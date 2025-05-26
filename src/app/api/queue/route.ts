import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import { createHash } from "crypto";
import prisma from "@/lib/prisma"; // Import shared prisma instance
import { QueueStatus, Prisma } from "@prisma/client"; // Add this import

// Function to generate a hash of queue data to detect changes
function generateQueueHash(queues: Record<string, unknown>[]): string {
	// Create a string representation of the queues
	const queueString = JSON.stringify(queues);
	// Generate SHA-256 hash
	return createHash("sha256").update(queueString).digest("hex");
}

export async function GET(req: NextRequest) {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get query parameters
		const url = new URL(req.url);
		const statusParam = url.searchParams.get("status") as QueueStatus | null;
		const clientHash = url.searchParams.get("hash") || "";
		const dateFilter = url.searchParams.get("dateFilter") || "today"; // 'today' or 'all', default to 'today'

		// Default to WAITING if no status provided
		const status = statusParam || QueueStatus.WAITING;

		// Base where clause for Prisma query
		const whereClause: Prisma.QueueWhereInput = {
			status,
		};

		// Apply date filter if set to 'today'
		if (dateFilter === "today") {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);

			whereClause.createdAt = {
				gte: today,
				lt: tomorrow, // Use 'lt' (less than) tomorrow to include everything from today up to midnight
			};
		}
		// If dateFilter is 'all', no additional createdAt filter is applied here.

		// Get queues with the specified status for today
		const queues = await prisma.queue.findMany({
			where: whereClause,
			include: {
				visitor: {
					select: {
						name: true,
						phone: true,
						institution: true,
					},
				},
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
				queueNumber: "asc",
			},
		});

		// Generate a hash of the current data
		const serverHash = generateQueueHash(queues);

		// Check if the data has changed
		const hasChanges = !clientHash || clientHash !== serverHash;

		return NextResponse.json({
			queues,
			hash: serverHash,
			hasChanges,
		});
	} catch (error) {
		console.error("Error fetching queues:", error);
		return NextResponse.json(
			{ error: "Failed to fetch queues" },
			{ status: 500 }
		);
	}
}
