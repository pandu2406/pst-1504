import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import prisma from "@/lib/prisma"; // Import shared prisma instance

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ error: "Service ID is required" },
				{ status: 400 }
			);
		}

		// Get service details
		const service = await prisma.service.findUnique({
			where: { id },
		});

		if (!service) {
			return NextResponse.json({ error: "Service not found" }, { status: 404 });
		}

		return NextResponse.json({ service });
	} catch (error) {
		console.error("Error fetching service:", error);
		return NextResponse.json(
			{ error: "Failed to fetch service" },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ error: "Service ID is required" },
				{ status: 400 }
			);
		}

		// Parse request body
		const body = await req.json();
		const { name, status } = body;

		if (!name && status === undefined) {
			return NextResponse.json(
				{ error: "No updates provided" },
				{ status: 400 }
			);
		}

		// Check if service exists
		const existingService = await prisma.service.findUnique({
			where: { id },
		});

		if (!existingService) {
			return NextResponse.json({ error: "Service not found" }, { status: 404 });
		}

		// Update service
		type ServiceStatus = "ACTIVE" | "INACTIVE";
		const updatedData: { name?: string; status?: ServiceStatus } = {};
		if (name) updatedData.name = name;
		if (status !== undefined) {
			updatedData.status = status ? "ACTIVE" : "INACTIVE"; // Map boolean to ServiceStatus
		}

		const service = await prisma.service.update({
			where: { id },
			data: updatedData,
		});

		return NextResponse.json({ service });
	} catch (error) {
		console.error("Error updating service:", error);
		return NextResponse.json(
			{ error: "Failed to update service" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Check authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ error: "Service ID is required" },
				{ status: 400 }
			);
		}

		// Check if service exists
		const existingService = await prisma.service.findUnique({
			where: { id },
		});

		if (!existingService) {
			return NextResponse.json({ error: "Service not found" }, { status: 404 });
		}

		// Delete service
		await prisma.service.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting service:", error);
		return NextResponse.json(
			{ error: "Failed to delete service" },
			{ status: 500 }
		);
	}
}
