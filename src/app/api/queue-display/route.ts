import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { QueueStatus, Prisma } from "@/generated/prisma";

// Function to generate a hash of queue data to detect changes
function generateQueueHash(data: Record<string, unknown>): string {
	// Create a string representation of the data
	const dataString = JSON.stringify(data);
	// Generate SHA-256 hash
	return createHash("sha256").update(dataString).digest("hex");
}

export async function GET(req: NextRequest) {
	try {
		// Get query parameters
		const url = new URL(req.url);
		const adminId = url.searchParams.get("adminId");
		const dateFilter = url.searchParams.get("dateFilter") || "today";
		const clientHash = req.headers.get("x-queue-hash") || "";

		// Get the current date (for today's queues)
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Base where clause for serving queues
		const servingWhereClause: Prisma.QueueWhereInput = {
			status: QueueStatus.SERVING,
		};

		// Base where clause for next queue
		const nextQueueWhereClause: Prisma.QueueWhereInput = {
			status: QueueStatus.WAITING,
		};

		// Apply date filter if it's set to "today"
		if (dateFilter === "today") {
			servingWhereClause.createdAt = {
				gte: today,
			};
			nextQueueWhereClause.createdAt = {
				gte: today,
			};
		}

		// Add adminId filter if provided
		if (adminId && adminId !== "all") {
			servingWhereClause.adminId = adminId;
		}

		// Get currently serving queues
		const servingQueues = await prisma.queue.findMany({
			where: servingWhereClause,
			include: {
				service: {
					select: {
						name: true,
					},
				},
				admin: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				startTime: "asc", // Show the longest-serving first
			},
		});

		// Get the next queue waiting (oldest first)
		const nextQueue = await prisma.queue.findFirst({
			where: nextQueueWhereClause,
			include: {
				service: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				queueNumber: "asc", // Get the lowest queue number first
			},
		});

		// Prepare response data
		const responseData = {
			servingQueues,
			nextQueue: nextQueue || null,
		};

		// Generate a hash of the current data
		const serverHash = generateQueueHash(responseData);

		// Check if the data has changed
		const hasChanges = !clientHash || clientHash !== serverHash;

		// Return response
		return NextResponse.json({
			...responseData,
			hash: serverHash,
			hasChanges,
		});
	} catch (error) {
		console.error("Error fetching queue display data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch queue display data" },
			{ status: 500 }
		);
	}
}
