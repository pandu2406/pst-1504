import { Role } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma"; // Import shared prisma instance

export async function GET() {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user is a superadmin
		if (session.user.role !== Role.SUPERADMIN) {
			return NextResponse.json(
				{ error: "Only superadmins can view users" },
				{ status: 403 }
			);
		}

		// Fetch users
		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				username: true,
				role: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json({ users });
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ error: "Failed to fetch users" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user is a superadmin
		if (session.user.role !== Role.SUPERADMIN) {
			return NextResponse.json(
				{ error: "Only superadmins can create users" },
				{ status: 403 }
			);
		}

		const data = await req.json();
		const { name, username, password, role } = data;

		// Validate required fields
		if (!name || !username || !password) {
			return NextResponse.json(
				{ error: "Name, username, and password are required" },
				{ status: 400 }
			);
		}

		// Check if username already exists
		const existingUser = await prisma.user.findUnique({
			where: { username },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Username already exists" },
				{ status: 409 }
			);
		}

		// Hash password with bcryptjs
		const hashedPassword = await bcryptjs.hash(password, 10);

		// Create user
		const user = await prisma.user.create({
			data: {
				name,
				username,
				password: hashedPassword,
				role: role || Role.ADMIN, // Default to ADMIN if not specified
			},
			select: {
				id: true,
				name: true,
				username: true,
				role: true,
				createdAt: true,
			},
		});

		return NextResponse.json({
			message: "User created successfully",
			user,
		});
	} catch (error) {
		console.error("Error creating user:", error);
		return NextResponse.json(
			{ error: "Failed to create user" },
			{ status: 500 }
		);
	}
}
