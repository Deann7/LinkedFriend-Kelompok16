import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

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
		const usersCollection = db.collection("users");
		const requestsCollection = db.collection("friendRequests");

		// Get the current user with their friends
		const currentUser = await usersCollection.findOne({_id: userId});
		if (!currentUser) {
			return NextResponse.json(
				{success: false, message: "User not found"},
				{status: 404}
			);
		}

		// Get current user's friends (converting to ObjectId if necessary)
		const userFriends = (currentUser.friends || []).map(
			(id: string | ObjectId) =>
				id instanceof ObjectId ? id : new ObjectId(id)
		);

		// Add the user's own ID to the exclusion list
		const excludeIds = [userId];
		if (userFriends.length > 0) {
			excludeIds.push(...userFriends);
		}

		// Get users who have pending requests with the current user
		const pendingRequests = await requestsCollection
			.find({
				$or: [
					{senderId: userId, status: "pending"},
					{recipientId: userId, status: "pending"},
				],
			})
			.toArray();

		// Get the user IDs from the pending requests
		const pendingUserIds = pendingRequests.flatMap((request) => {
			const ids = [];
			if (request.senderId.toString() !== userId.toString()) {
				ids.push(request.senderId);
			}
			if (request.recipientId.toString() !== userId.toString()) {
				ids.push(request.recipientId);
			}
			return ids;
		});

		// Add pending users to the exclude list if there are any
		if (pendingUserIds.length > 0) {
			excludeIds.push(...pendingUserIds);
		}

		// Find users who aren't already friends with the current user and don't have pending requests
		let suggestions;

		// If the user has no friends and no pending requests, recommend random users
		if (userFriends.length === 0 && pendingUserIds.length === 0) {
			suggestions = await usersCollection
				.find({
					_id: {$ne: userId}, // Only exclude the user themselves
				})
				.project({
					_id: 1,
					firstName: 1,
					lastName: 1,
					jobTitle: 1,
					location: 1,
					email: 1,
				})
				.limit(10) // Return up to 10 random users
				.toArray();
		} else {
			// Otherwise, exclude friends and pending requests
			suggestions = await usersCollection
				.find({
					_id: {$nin: excludeIds},
				})
				.project({
					_id: 1,
					firstName: 1,
					lastName: 1,
					jobTitle: 1,
					location: 1,
					email: 1,
				})
				.limit(10)
				.toArray();
		}

		return NextResponse.json({success: true, suggestions});
	} catch (error) {
		console.error("Error fetching friend suggestions:", error);
		return NextResponse.json(
			{success: false, message: "Failed to fetch friend suggestions"},
			{status: 500}
		);
	}
}
