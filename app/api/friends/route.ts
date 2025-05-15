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

		// Get the current user with their friends
		const currentUser = await usersCollection.findOne({_id: userId});
		if (!currentUser) {
			return NextResponse.json(
				{success: false, message: "User not found"},
				{status: 404}
			);
		}

		// Get current user's friends (ensuring the array exists)
		const userFriends = currentUser.friends || [];

		// Convert string IDs to ObjectIds if needed
		const friendObjectIds = userFriends.map((id: string | ObjectId) =>
			id instanceof ObjectId ? id : new ObjectId(id)
		);

		// If the user has no friends, return an empty array
		if (friendObjectIds.length === 0) {
			return NextResponse.json({success: true, friends: []});
		}

		// Find all friends
		const friends = await usersCollection
			.find({_id: {$in: friendObjectIds}})
			.project({
				_id: 1,
				firstName: 1,
				lastName: 1,
				jobTitle: 1,
				location: 1,
				email: 1,
			})
			.toArray();

		return NextResponse.json({success: true, friends});
	} catch (error) {
		console.error("Error fetching friends:", error);
		return NextResponse.json(
			{success: false, message: "Failed to fetch friends"},
			{status: 500}
		);
	}
}
