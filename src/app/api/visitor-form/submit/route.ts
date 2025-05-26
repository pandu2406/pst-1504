import { PrismaClient, QueueStatus, QueueType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();
		const { name, phone, institution, email, serviceId, tempUuid, queueType } = data;

		// Validasi input
		if (!name || !phone || !serviceId || !tempUuid || !queueType) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// Validasi queueType
		const queueTypeEnum =
			queueType === "ONLINE" ? QueueType.ONLINE :
			queueType === "OFFLINE" ? QueueType.OFFLINE : null;

		if (!queueTypeEnum) {
			return NextResponse.json({ error: "Invalid queue type" }, { status: 400 });
		}

		// Cek apakah serviceId valid
		const service = await prisma.service.findUnique({
			where: { id: serviceId },
		});
		if (!service) {
			return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
		}

		// Cek apakah tempUuid valid dan belum digunakan
		const tempVisitorLink = await prisma.tempVisitorLink.findUnique({
			where: { uuid: tempUuid },
		});
		if (!tempVisitorLink) {
			return NextResponse.json({ error: "Invalid temporary link" }, { status: 400 });
		}
		if (tempVisitorLink.used) {
			return NextResponse.json({ error: "This form has already been submitted" }, { status: 400 });
		}
		if (new Date() > tempVisitorLink.expiresAt) {
			return NextResponse.json({ error: "Link has expired" }, { status: 400 });
		}

		// Ambil antrean terakhir hari ini
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const latestQueue = await prisma.queue.findFirst({
			where: {
				createdAt: { gte: today },
			},
			orderBy: {
				queueNumber: "desc",
			},
		});
		const nextQueueNumber = latestQueue ? latestQueue.queueNumber + 1 : 1;

		// Transaksi buat visitor dan antrean
		const result = await prisma.$transaction(async (tx) => {
			const visitor = await tx.visitor.create({
				data: { name, phone, institution, email },
			});

			const trackingLink = nanoid(10);

			const queue = await tx.queue.create({
				data: {
					queueNumber: nextQueueNumber,
					status: QueueStatus.WAITING,
					queueType: queueTypeEnum,
					visitorId: visitor.id,
					serviceId,
					tempUuid,
					trackingLink,
					filledSKD: false,
				},
				include: {
					service: true,
				},
			});

			await tx.tempVisitorLink.update({
				where: { uuid: tempUuid },
				data: { used: true },
			});

			const formatQueueDate = (date: Date): string => {
				const day = date.getDate().toString().padStart(2, "0");
				const month = (date.getMonth() + 1).toString().padStart(2, "0");
				return `${day}${month}`;
			};

			await tx.notification.create({
				data: {
					type: "NEW_QUEUE",
					title: "Antrean Baru",
					message: `Antrean baru #${queue.queueNumber}-${formatQueueDate(queue.createdAt)} (${queue.queueType === "ONLINE" ? "Online" : "Offline"}) dari ${visitor.name} untuk layanan ${queue.service.name}`,
					isRead: false,
				},
			});

			return { visitor, queue };
		});

		return NextResponse.json({
			success: true,
			message: "Queue created successfully",
			data: {
				queueNumber: result.queue.queueNumber,
				serviceName: result.queue.service.name,
				visitorName: result.visitor.name,
				createdAt: result.queue.createdAt,
				queueType: result.queue.queueType,
				redirectUrl: `/visitor-form/${tempUuid}`,
			},
		});
	} catch (error: any) {
		console.error("Error submitting visitor form:", error);
		return NextResponse.json(
			{ error: "Failed to process visitor form", detail: error?.message || String(error) },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}