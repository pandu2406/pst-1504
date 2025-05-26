import { ServiceStatus } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import prisma from "@/lib/prisma"; // Import shared prisma instance

export async function GET(req: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get services with optional filter for status
		const { searchParams } = new URL(req.url);
		const statusFilter = searchParams.get("status") as ServiceStatus | null;

		const where = statusFilter ? { status: statusFilter } : {};

		const services = await prisma.service.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json({ services });
	} catch (error) {
		console.error("Error fetching services:", error);
		return NextResponse.json(
			{ error: "Failed to fetch services" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Parse request body
		const body = await req.json();
		const { name } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Service name is required" },
				{ status: 400 }
			);
		}

		// Create new service
		const service = await prisma.service.create({
			data: {
				name,
				status: ServiceStatus.ACTIVE,
			},
		});

		return NextResponse.json({ service }, { status: 201 });
	} catch (error) {
		console.error("Error creating service:", error);
		return NextResponse.json(
			{ error: "Failed to create service" },
			{ status: 500 }
		);
	}
}
