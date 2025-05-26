import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user || !session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: notificationId } = await params;

		const notification = await prisma.notification.findUnique({
			where: {
				id: notificationId,
			},
		});

		if (!notification) {
			return NextResponse.json(
				{ error: "Notification not found" },
				{ status: 404 }
			);
		}

		if (
			notification.userId !== null &&
			notification.userId !== session.user.id
		) {
			return NextResponse.json(
				{
					error:
						"Forbidden: You are not authorized to update this notification",
				},
				{ status: 403 }
			);
		}

		if (notification.isRead) {
			return NextResponse.json({
				success: true,
				message: "Notification was already marked as read",
				notification,
			});
		}

		const updatedNotification = await prisma.notification.update({
			where: {
				id: notificationId,
			},
			data: {
				isRead: true,
			},
		});

		return NextResponse.json({
			success: true,
			message: "Notification marked as read",
			notification: updatedNotification,
		});
	} catch (error: unknown) {
		console.error("Error marking notification as read:", error);
		let errorMessage = "Failed to process request to mark notification as read";
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
