import { PrismaClient, ServiceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
	try {
		// Get the UUID from the header
		const visitorUuid = req.headers.get("x-visitor-uuid");
		console.log("Visitor UUID service:", visitorUuid);

		if (!visitorUuid) {
			return NextResponse.json(
				{ error: "Missing visitor UUID" },
				{ status: 400 }
			);
		}

		// Check if UUID exists and is valid
		const tempVisitorLink = await prisma.tempVisitorLink.findUnique({
			where: { uuid: visitorUuid },
		});

		if (!tempVisitorLink) {
			return NextResponse.json(
				{ error: "Invalid visitor UUID" },
				{ status: 400 }
			);
		}

		// Check if link is expired
		if (new Date() > tempVisitorLink.expiresAt) {
			return NextResponse.json({ error: "Link has expired" }, { status: 400 });
		}

		// Check if link has already been used
		if (tempVisitorLink.used) {
			return NextResponse.json(
				{ error: "Link has already been used" },
				{ status: 400 }
			);
		}

		// Get available services
		const services = await prisma.service.findMany({
			where: {
				status: ServiceStatus.ACTIVE,
			},
			select: {
				id: true,
				name: true,
				status: true,
			},
		});

		return NextResponse.json({ services });
	} catch (error) {
		console.error("Error fetching services:", error);
		return NextResponse.json(
			{ error: "Failed to fetch services" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}
