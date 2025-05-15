import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

// PATCH /api/friends/requests/[id] - Accept or reject a friend request
export async function PATCH(
	request: NextRequest,
	{params}: {params: {id: string}}
) {
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
		const requestId = new ObjectId(params.id);
		const {action} = await request.json();

		if (!action || (action !== "accept" && action !== "reject")) {
			return NextResponse.json(
				{
					success: false,
					message: "Invalid action. Must be 'accept' or 'reject'",
				},
				{status: 400}
			);
		}

		// Connect to MongoDB
		const client = await clientPromise;
		const db = client.db();
		const requestsCollection = db.collection("friendRequests");
		const usersCollection = db.collection("users");
		const notificationsCollection = db.collection("notifications");

		// Get the friend request
		const friendRequest = await requestsCollection.findOne({
			_id: requestId,
			recipientId: userId,
			status: "pending",
		});

		if (!friendRequest) {
			return NextResponse.json(
				{success: false, message: "Friend request not found"},
				{status: 404}
			);
		}

		// Get the sender and recipient
		const [sender, recipient] = await Promise.all([
			usersCollection.findOne({_id: friendRequest.senderId}),
			usersCollection.findOne({_id: userId}),
		]);

		if (!sender || !recipient) {
			return NextResponse.json(
				{success: false, message: "User not found"},
				{status: 404}
			);
		}

		const now = new Date();

		// Update the request status
		await requestsCollection.updateOne(
			{_id: requestId},
			{
				$set: {
					status: action === "accept" ? "accepted" : "rejected",
					updatedAt: now,
				},
			}
		);

		// If accepted, update both users' friends arrays
		if (action === "accept") {
			await Promise.all([
				// Add sender to recipient's friends
				usersCollection.updateOne(
					{_id: userId},
					{$addToSet: {friends: friendRequest.senderId}}
				),
				// Add recipient to sender's friends
				usersCollection.updateOne(
					{_id: friendRequest.senderId},
					{$addToSet: {friends: userId}}
				),
			]);

			// Create notification for sender
			const notification = {
				userId: friendRequest.senderId,
				type: "request_accepted",
				message: `${recipient.firstName} ${recipient.lastName} accepted your friend request`,
				isRead: false,
				data: {
					friendId: userId,
					friendName: `${recipient.firstName} ${recipient.lastName}`,
				},
				createdAt: now,
			};

			await notificationsCollection.insertOne(notification);
		}

		return NextResponse.json({
			success: true,
			message:
				action === "accept"
					? "Friend request accepted"
					: "Friend request rejected",
		});
	} catch (error) {
		console.error(`Error handling friend request:`, error);
		return NextResponse.json(
			{success: false, message: "Failed to process friend request"},
			{status: 500}
		);
	}
}
