import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH(request: NextRequest) {
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

		// Update all notifications for the user
		const result = await notificationsCollection.updateMany(
			{userId, isRead: false},
			{$set: {isRead: true}}
		);

		return NextResponse.json({
			success: true,
			message: "All notifications marked as read",
			count: result.modifiedCount,
		});
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to mark all notifications as read",
			},
			{status: 500}
		);
	}
}
