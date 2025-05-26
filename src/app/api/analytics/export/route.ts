import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import { format } from "date-fns";
import prisma from "@/lib/prisma"; // Import shared prisma instance

export async function GET(req: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const startDateParam =
			searchParams.get("startDate") || format(new Date(), "yyyy-MM-dd");
		const exportFormat = searchParams.get("format") || "json";
		// Parse the start date
		const startDate = new Date(startDateParam);
		startDate.setHours(0, 0, 0, 0);
		startDate.setHours(0, 0, 0, 0);

		// Get all queues within the date range
		const queues = await prisma.queue.findMany({
			where: {
				createdAt: {
					gte: startDate,
				},
			},
			include: {
				visitor: true,
				service: true,
				admin: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		// Transform queue data for export
		const exportData = queues.map((queue) => ({
			queueNumber: queue.queueNumber,
			serviceType: queue.service.name,
			visitorName: queue.visitor.name,
			phoneNumber: queue.visitor.phone,
			createdAt: format(new Date(queue.createdAt), "yyyy-MM-dd HH:mm:ss"),
			startTime: queue.startTime
				? format(new Date(queue.startTime), "yyyy-MM-dd HH:mm:ss")
				: "",
			endTime: queue.endTime
				? format(new Date(queue.endTime), "yyyy-MM-dd HH:mm:ss")
				: "",
			status: queue.status,
			servedBy: queue.admin ? queue.admin.name : "",
			waitTimeMinutes: queue.startTime
				? Math.round(
						(new Date(queue.startTime).getTime() -
							new Date(queue.createdAt).getTime()) /
							(1000 * 60)
				  )
				: "",
			serviceTimeMinutes:
				queue.startTime && queue.endTime
					? Math.round(
							(new Date(queue.endTime).getTime() -
								new Date(queue.startTime).getTime()) /
								(1000 * 60)
					  )
					: "",
		}));

		if (exportFormat === "json") {
			// Return as JSON
			return NextResponse.json(exportData);
		} else if (exportFormat === "csv") {
			// Convert to CSV
			if (exportData.length === 0) {
				return NextResponse.json(
					{ error: "No data to export" },
					{ status: 404 }
				);
			}

			// Create CSV header
			const headers = Object.keys(exportData[0]);
			let csv = headers.join(",") + "\n";

			// Add data rows
			for (const row of exportData) {
				const values = headers.map((header) => {
					const value = row[header as keyof typeof row];
					// Escape quotes in string values and wrap in quotes
					return typeof value === "string"
						? `"${value.replace(/"/g, '""')}"`
						: value;
				});
				csv += values.join(",") + "\n";
			}

			// Return CSV file
			return new Response(csv, {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="pst-queue-report-${format(
						new Date(),
						"yyyy-MM-dd"
					)}.csv"`,
				},
			});
		} else {
			return NextResponse.json(
				{ error: "Unsupported export format" },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("Error exporting analytics data:", error);
		return NextResponse.json(
			{ error: "Failed to export analytics data" },
			{ status: 500 }
		);
	}
}
