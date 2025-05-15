import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

// GET /api/users/search - Search users by name, job title, or location
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
		const searchUrl = new URL(request.url);
		const query = searchUrl.searchParams.get("query");

		if (!query || query.trim().length < 2) {
			return NextResponse.json(
				{
					success: false,
					message: "Search query must be at least 2 characters",
				},
				{status: 400}
			);
		}

		// Connect to MongoDB
		const client = await clientPromise;
		const db = client.db();
		const usersCollection = db.collection("users");
		const requestsCollection = db.collection("friendRequests");

		// Get current user with friends
		const currentUser = await usersCollection.findOne({_id: userId});
		if (!currentUser) {
			return NextResponse.json(
				{success: false, message: "User not found"},
				{status: 404}
			);
		}

		// Get user's friends (ensure the array exists)
		const userFriends = currentUser.friends || [];

		// Convert string IDs to ObjectIds if needed
		const friendObjectIds = userFriends.map((id: string | ObjectId) =>
			id instanceof ObjectId ? id : new ObjectId(id)
		);

		// Create regex for search (case insensitive)
		const searchRegex = new RegExp(query, "i");

		// Search for users matching the query
		const users = await usersCollection
			.find({
				_id: {$ne: userId}, // Exclude current user
				$or: [
					{firstName: searchRegex},
					{lastName: searchRegex},
					{jobTitle: searchRegex},
					{location: searchRegex},
					{email: searchRegex},
				],
			})
			.project({
				_id: 1,
				firstName: 1,
				lastName: 1,
				jobTitle: 1,
				location: 1,
				email: 1,
			})
			.limit(20)
			.toArray();

		// Get pending friend requests to/from these users
		const sentRequestsPromise = requestsCollection
			.find({
				senderId: userId,
				recipientId: {$in: users.map((u) => u._id)},
				status: "pending",
			})
			.toArray();

		const receivedRequestsPromise = requestsCollection
			.find({
				senderId: {$in: users.map((u) => u._id)},
				recipientId: userId,
				status: "pending",
			})
			.toArray();

		const [sentRequests, receivedRequests] = await Promise.all([
			sentRequestsPromise,
			receivedRequestsPromise,
		]);

		// Mark users with their status (friend, pending request, etc.)
		const usersWithStatus = users.map((user) => {
			// Check if user is already a friend
			const isFriend = friendObjectIds.some(
				(id) => id.toString() === user._id.toString()
			);

			if (isFriend) {
				return {...user, status: "friend"};
			}

			// Check if there's a pending request sent to this user
			const hasSentRequest = sentRequests.some(
				(req) => req.recipientId.toString() === user._id.toString()
			);

			if (hasSentRequest) {
				return {...user, status: "pending"};
			}

			// Check if there's a pending request from this user
			const hasReceivedRequest = receivedRequests.some(
				(req) => req.senderId.toString() === user._id.toString()
			);

			if (hasReceivedRequest) {
				return {...user, status: "received"};
			}

			// No special status
			return user;
		});

		return NextResponse.json({success: true, users: usersWithStatus});
	} catch (error) {
		console.error("Error searching users:", error);
		return NextResponse.json(
			{success: false, message: "Failed to search users"},
			{status: 500}
		);
	}
}
