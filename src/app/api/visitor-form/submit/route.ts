import { PrismaClient, QueueStatus, QueueType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();
		const { name, phone, institution, email, serviceId, tempUuid, queueType } =
			data;

		// Validate required fields
		if (!name || !phone || !serviceId || !tempUuid || !queueType) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Check if tempUuid is valid and not used
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

		// Check if link is expired
		if (new Date() > tempVisitorLink.expiresAt) {
			return NextResponse.json({ error: "Link has expired" }, { status: 400 });
		}
		// Get the latest queue number for today (resetting to 1 each day)
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Check if we already have queues for today
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

		// If it's a new day, start from 1, otherwise increment from the last queue number
		const nextQueueNumber = latestQueue ? latestQueue.queueNumber + 1 : 1;

		// Transaction to create visitor and queue
		const result = await prisma.$transaction(async (tx) => {
			// Create visitor
			const visitor = await tx.visitor.create({
				data: {
					name,
					phone,
					institution,
					email,
				},
			});

			// Generate a tracking link
			const trackingLink = `${nanoid(10)}`; // Create queue
			const queue = await tx.queue.create({
				data: {
					queueNumber: nextQueueNumber,
					status: QueueStatus.WAITING,
					queueType:
						queueType === "ONLINE" ? QueueType.ONLINE : QueueType.OFFLINE,
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

			// Mark temp link as used
			await tx.tempVisitorLink.update({
				where: { uuid: tempUuid },
				data: { used: true },
			}); // Format queue date to DDMM format
			
			const formatQueueDate = (date: Date): string => {
				const day = date.getDate().toString().padStart(2, "0");
				const month = (date.getMonth() + 1).toString().padStart(2, "0");
				return `${day}${month}`;
			}; // Create notification for staff
			await tx.notification.create({
				data: {
					type: "NEW_QUEUE",
					title: "Antrean Baru",
					message: `Antrean baru #${queue.queueNumber}-${formatQueueDate(
						new Date(queue.createdAt)
					)} (${queue.queueType === "ONLINE" ? "Online" : "Offline"}) dari ${visitor.name
						} untuk layanan ${queue.service.name}`,
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
	} catch (error) {
		console.error("Error submitting visitor form:", error);
		return NextResponse.json(
			{ error: "Failed to process visitor form" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
