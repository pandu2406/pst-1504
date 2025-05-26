import { PrismaClient, QueueStatus, QueueType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();
		const { name, phone, institution, email, serviceId, tempUuid, queueType } = data;

		// Validasi field
		if (!name || !phone || !serviceId || !tempUuid || !queueType) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Cek tempUuid
		const tempVisitorLink = await prisma.tempVisitorLink.findUnique({
			where: { uuid: tempUuid },
		});

		if (!tempVisitorLink) {
			return NextResponse.json(
				{ error: "Invalid temporary link" },
				{ status: 400 }
			);
		}

		if (tempVisitorLink.used) {
			return NextResponse.json(
				{ error: "This form has already been submitted" },
				{ status: 400 }
			);
		}

		if (new Date() > tempVisitorLink.expiresAt) {
			return NextResponse.json({ error: "Link has expired" }, { status: 400 });
		}

		// Ambil antrean terbaru hari ini
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const latestQueue = await prisma.queue.findFirst({
			where: {
				createdAt: {
					gte: today,
				},
			},
			orderBy: {
				queueNumber: "desc",
			},
		});

		const nextQueueNumber = latestQueue ? latestQueue.queueNumber + 1 : 1;

		// Transaksi
		const result = await prisma.$transaction(async (tx) => {
			const visitor = await tx.visitor.create({
				data: {
					name,
					phone,
					institution,
					email,
				},
			});

			const trackingLink = nanoid(10);

			const queue = await tx.queue.create({
				data: {
					queueNumber: nextQueueNumber,
					status: QueueStatus.WAITING,
					queueType: queueType === "ONLINE" ? QueueType.ONLINE : QueueType.OFFLINE,
					visitorId: visitor.id,
					serviceId,
					tempUuid: tempUuid,
					trackingLink: trackingLink,
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
					message: `Antrean baru #${queue.queueNumber}-${formatQueueDate(
						new Date(queue.createdAt)
					)} (${queue.queueType === "ONLINE" ? "Online" : "Offline"}) dari ${visitor.name} untuk layanan ${queue.service.name}`,
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
	} catch (error: unknown) {
		console.error("Error submitting visitor form:", error);

		let message = "Failed to process visitor form";
		if (error instanceof Error) {
			message = error.message;
		}

		return NextResponse.json(
			{ success: false, error: message },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
