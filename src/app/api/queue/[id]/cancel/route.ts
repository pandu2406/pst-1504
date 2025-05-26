import { QueueStatus, Role } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import prisma from "@/lib/prisma"; // Import shared prisma instance

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Get the queue
		const queue = await prisma.queue.findUnique({
			where: { id },
		});

		if (!queue) {
			return NextResponse.json({ error: "Queue not found" }, { status: 404 });
		}

		// Only waiting or serving queues can be canceled
		const allowedStatuses: QueueStatus[] = [
			QueueStatus.WAITING,
			QueueStatus.SERVING,
		];
		if (!allowedStatuses.includes(queue.status)) {
			return NextResponse.json(
				{ error: "Queue cannot be canceled in its current state" },
				{ status: 400 }
			);
		}

		// If queue is being served, only the serving admin or a superadmin can cancel it
		if (
			queue.status === QueueStatus.SERVING &&
			session.user.role !== Role.SUPERADMIN &&
			queue.adminId !== session.user.id
		) {
			return NextResponse.json(
				{ error: "You are not authorized to cancel this queue" },
				{ status: 403 }
			);
		}
		// Format queue date to DDMM format
		const formatQueueDate = (date: Date): string => {
			const day = date.getDate().toString().padStart(2, "0");
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			return `${day}${month}`;
		};

		// Update queue to canceled status
		const updatedQueue = await prisma.queue.update({
			where: { id },
			data: {
				status: QueueStatus.CANCELED,
				endTime: new Date(),
			},
			include: {
				visitor: {
					select: {
						name: true,
					},
				},
				service: {
					select: {
						name: true,
					},
				},
			},
		});

		// Create notification for queue cancellation
		await prisma.notification.create({
			data: {
				type: "QUEUE_CANCELED",
				title: "Antrean Dibatalkan",
				message: `Antrean #${updatedQueue.queueNumber}-${formatQueueDate(
					new Date(updatedQueue.createdAt)
				)} (${
					updatedQueue.queueType === "ONLINE" ? "Online" : "Offline"
				}) untuk layanan ${updatedQueue.service.name} telah dibatalkan`,
				isRead: false,
				userId: session.user.id,
			},
		});

		return NextResponse.json({
			message: "Queue has been canceled",
			queue: updatedQueue,
		});
	} catch (error) {
		console.error("Error canceling queue:", error);
		return NextResponse.json(
			{ error: "Failed to cancel queue" },
			{ status: 500 }
		);
	}
}
