import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import prisma from "@/lib/prisma"; // Import shared prisma instance
import { QueueStatus } from "@/generated/prisma"; // Add this import

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			console.error("Unauthorized access attempt to serve queue");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("Session user data:", JSON.stringify(session.user, null, 2));
		if (!session.user?.id) {
			console.error("Missing user ID in session");
			return NextResponse.json(
				{ error: "Invalid session: missing user ID" },
				{ status: 401 }
			);
		}

		const { id } = await params;
		console.log(`Attempting to serve queue with ID: ${id}`);

		// Get the queue
		const queue = await prisma.queue.findUnique({
			where: { id },
		});

		if (!queue) {
			console.error(`Queue not found with ID: ${id}`);
			return NextResponse.json({ error: "Queue not found" }, { status: 404 });
		}
		if (queue.status !== QueueStatus.WAITING) {
			return NextResponse.json(
				{ error: "Queue is not in waiting status" },
				{ status: 400 }
			);
		}
		// Verify that the admin user exists in the database
		const adminUser = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, name: true },
		});

		if (!adminUser) {
			console.error(`Admin user not found with ID: ${session.user.id}`);
			return NextResponse.json(
				{ error: "Admin user not found in database" },
				{ status: 404 }
			);
		}
		// Format queue date to DDMM format
		const formatQueueDate = (date: Date): string => {
			const day = date.getDate().toString().padStart(2, "0");
			const month = (date.getMonth() + 1).toString().padStart(2, "0");
			return `${day}${month}`;
		};

		// Update queue to serving status
		const updatedQueue = await prisma.queue.update({
			where: { id },
			data: {
				status: QueueStatus.SERVING,
				startTime: new Date(),
				adminId: session.user.id,
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

		// Create notification for queue being served
		await prisma.notification.create({
			data: {
				type: "QUEUE_SERVING",
				title: "Antrean Sedang Dilayani",
				message: `Antrean #${updatedQueue.queueNumber}-${formatQueueDate(
					new Date(updatedQueue.createdAt)
				)} (${
					updatedQueue.queueType === "ONLINE" ? "Online" : "Offline"
				}) sedang dilayani oleh ${adminUser.name}`,
				isRead: false,
			},
		});

		return NextResponse.json({
			message: "Queue is now being served",
			queue: updatedQueue,
		});
	} catch (error) {
		console.error("Error serving queue:", error);
		// Check if it's a Prisma error
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error(`Detailed error: ${errorMessage}`);

		// If it's a Prisma foreign key constraint error, give a more helpful message
		if (
			errorMessage.includes(
				"Foreign key constraint violated on the constraint: `Queue_adminId_fkey`"
			)
		) {
			return NextResponse.json(
				{
					error: "Failed to serve queue",
					details:
						"The admin user associated with this session does not exist in the database.",
				},
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to serve queue", details: errorMessage },
			{ status: 500 }
		);
	}
}
