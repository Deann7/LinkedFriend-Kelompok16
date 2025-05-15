import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

export async function POST(request: NextRequest) {
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
		const {friendId} = await request.json();

		if (!friendId) {
			return NextResponse.json(
				{success: false, message: "Friend ID is required"},
				{status: 400}
			);
		}

		const friendObjectId = new ObjectId(friendId);

		// Connect to MongoDB
		const client = await clientPromise;
		const db = client.db();
		const usersCollection = db.collection("users");

		// Check if both users exist
		const [currentUser, friendUser] = await Promise.all([
			usersCollection.findOne({_id: userId}),
			usersCollection.findOne({_id: friendObjectId}),
		]);

		if (!currentUser) {
			return NextResponse.json(
				{success: false, message: "User not found"},
				{status: 404}
			);
		}

		if (!friendUser) {
			return NextResponse.json(
				{success: false, message: "Friend not found"},
				{status: 404}
			);
		}

		// Initialize friends array if it doesn't exist
		const userFriends = currentUser.friends || [];
		const friendFriends = friendUser.friends || [];

		// Check if they are already friends
		if (
			userFriends.some(
				(id: string | ObjectId) =>
					id.toString() === friendObjectId.toString()
			)
		) {
			return NextResponse.json(
				{success: false, message: "Already friends"},
				{status: 400}
			);
		}

		// Add each other as friends (bidirectional relationship)
		await Promise.all([
			usersCollection.updateOne(
				{_id: userId},
				{$addToSet: {friends: friendObjectId}}
			),
			usersCollection.updateOne(
				{_id: friendObjectId},
				{$addToSet: {friends: userId}}
			),
		]);

		return NextResponse.json({
			success: true,
			message: "Friend added successfully",
			friend: {
				_id: friendUser._id,
				firstName: friendUser.firstName,
				lastName: friendUser.lastName,
				jobTitle: friendUser.jobTitle,
				location: friendUser.location,
				email: friendUser.email,
			},
		});
	} catch (error) {
		console.error("Error adding friend:", error);
		return NextResponse.json(
			{success: false, message: "Failed to add friend"},
			{status: 500}
		);
	}
}
