import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

// GET /api/notifications - Get the user's notifications
export async function GET(request: NextRequest) {
	try {
		// Verify authentication
		const authResult = verifyToken(request);
		if (!authResult.success) {
			return NextResponse.json(
				{success: false, message: "Unauthorized"},
				{status: 401}
			);
		}

		const userId = new ObjectId(authResult.userId);

		// Connect to MongoDB
		const client = await clientPromise;
		const db = client.db();
		const notificationsCollection = db.collection("notifications");

		// Get notifications for the user, sorted by creation date (newest first)
		const notifications = await notificationsCollection
			.find({userId})
			.sort({createdAt: -1})
			.limit(50) // Limit to most recent 50 notifications
			.toArray();

		return NextResponse.json({
			success: true,
			notifications: notifications.map((notification) => ({
				id: notification._id.toString(),
				type: notification.type,
				message: notification.message,
				isRead: notification.isRead,
				data: notification.data,
				createdAt: notification.createdAt,
			})),
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return NextResponse.json(
			{success: false, message: "Failed to fetch notifications"},
			{status: 500}
		);
	}
}
