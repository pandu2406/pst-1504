import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated import path
import crypto from "crypto";
import prisma from "@/lib/prisma"; // Import shared prisma instance

export async function GET(request: Request) {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the client's hash if provided
		const url = new URL(request.url);
		const clientHash = url.searchParams.get("hash");

		// Get all unread notifications
		const notifications = await prisma.notification.findMany({
			where: {
				isRead: false,
				// If the notification has a userId, it should match the current user
				// Otherwise, notifications with null userId are visible to all users
				OR: [{ userId: null }, { userId: session.user.id }],
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 20, // Limit to 20 most recent notifications
		});

		// Generate a hash based on notifications data
		const notificationsData = JSON.stringify(notifications);
		const hash = crypto
			.createHash("md5")
			.update(notificationsData)
			.digest("hex");

		// If client sent a hash and it matches our current hash,
		// that means there are no changes
		const hasChanges = !clientHash || clientHash !== hash;

		// Return the notifications with the hash and a flag indicating changes
		return NextResponse.json({
			notifications,
			hash,
			hasChanges,
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return NextResponse.json(
			{ error: "Failed to fetch notifications" },
			{ status: 500 }
		);
	}
}

export async function POST() {
	try {
		// Get the current session to verify authentication
		const session = await getServerSession(authOptions);
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Mark all notifications for the current user as read
		await prisma.notification.updateMany({
			where: {
				isRead: false,
				OR: [{ userId: null }, { userId: session.user.id }],
			},
			data: {
				isRead: true,
			},
		});

		// Fetch updated notifications to generate new hash
		const updatedNotifications = await prisma.notification.findMany({
			where: {
				isRead: false,
				OR: [{ userId: null }, { userId: session.user.id }],
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 20,
		});

		// Generate new hash
		const notificationsData = JSON.stringify(updatedNotifications);
		const hash = crypto
			.createHash("md5")
			.update(notificationsData)
			.digest("hex");

		return NextResponse.json({
			success: true,
			notifications: updatedNotifications,
			hash,
		});
	} catch (error) {
		console.error("Error marking notifications as read:", error);
		return NextResponse.json(
			{ error: "Failed to mark notifications as read" },
			{ status: 500 }
		);
	}
}
