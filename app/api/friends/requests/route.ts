import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

// GET /api/friends/requests - Get user's sent and received friend requests
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
		const requestsCollection = db.collection("friendRequests");
		const usersCollection = db.collection("users");

		// Get sent and received requests
		const [sentRequests, receivedRequests] = await Promise.all([
			// Sent requests (user is sender)
			requestsCollection
				.find({
					senderId: userId,
					status: "pending",
				})
				.toArray(),

			// Received requests (user is recipient)
			requestsCollection
				.find({
					recipientId: userId,
					status: "pending",
				})
				.toArray(),
		]);

		// Get user details for each request
		const sentRequestsWithDetails = await Promise.all(
			sentRequests.map(async (request) => {
				const recipient = await usersCollection.findOne({
					_id: request.recipientId,
				});
				return {
					_id: request._id,
					sender: {_id: userId},
					recipient: {
						_id: recipient?._id,
						firstName: recipient?.firstName,
						lastName: recipient?.lastName,
						email: recipient?.email,
						jobTitle: recipient?.jobTitle,
						location: recipient?.location,
					},
					status: request.status,
					createdAt: request.createdAt,
				};
			})
		);

		const receivedRequestsWithDetails = await Promise.all(
			receivedRequests.map(async (request) => {
				const sender = await usersCollection.findOne({
					_id: request.senderId,
				});
				return {
					_id: request._id,
					sender: {
						_id: sender?._id,
						firstName: sender?.firstName,
						lastName: sender?.lastName,
						email: sender?.email,
						jobTitle: sender?.jobTitle,
						location: sender?.location,
					},
					recipient: {_id: userId},
					status: request.status,
					createdAt: request.createdAt,
				};
			})
		);

		return NextResponse.json({
			success: true,
			sentRequests: sentRequestsWithDetails,
			receivedRequests: receivedRequestsWithDetails,
		});
	} catch (error) {
		console.error("Error fetching friend requests:", error);
		return NextResponse.json(
			{success: false, message: "Failed to fetch friend requests"},
			{status: 500}
		);
	}
}

// POST /api/friends/requests - Send a friend request
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
		const {recipientId} = await request.json();

		if (!recipientId) {
			return NextResponse.json(
				{success: false, message: "Recipient ID is required"},
				{status: 400}
			);
		}

		const recipientObjectId = new ObjectId(recipientId);

		// Connect to MongoDB
		const client = await clientPromise;
		const db = client.db();
		const requestsCollection = db.collection("friendRequests");
		const usersCollection = db.collection("users");
		const notificationsCollection = db.collection("notifications");

		// Check if users exist
		const [sender, recipient] = await Promise.all([
			usersCollection.findOne({_id: userId}),
			usersCollection.findOne({_id: recipientObjectId}),
		]);

		if (!sender) {
			return NextResponse.json(
				{success: false, message: "Sender not found"},
				{status: 404}
			);
		}

		if (!recipient) {
			return NextResponse.json(
				{success: false, message: "Recipient not found"},
				{status: 404}
			);
		}

		// Check if they are already friends
		const senderFriends = sender.friends || [];
		if (
			senderFriends.some(
				(id: string | ObjectId) =>
					id.toString() === recipientObjectId.toString()
			)
		) {
			return NextResponse.json(
				{success: false, message: "Already friends"},
				{status: 400}
			);
		}

		// Check if a request already exists
		const existingRequest = await requestsCollection.findOne({
			$or: [
				{senderId: userId, recipientId: recipientObjectId},
				{senderId: recipientObjectId, recipientId: userId},
			],
		});

		if (existingRequest) {
			if (existingRequest.status === "pending") {
				return NextResponse.json(
					{success: false, message: "Friend request already exists"},
					{status: 400}
				);
			} else if (existingRequest.status === "accepted") {
				return NextResponse.json(
					{success: false, message: "Already friends"},
					{status: 400}
				);
			}
		}

		// Create the friend request
		const now = new Date();
		const friendRequest = {
			senderId: userId,
			recipientId: recipientObjectId,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		};

		const result = await requestsCollection.insertOne(friendRequest);

		// Create notification for recipient
		const notification = {
			userId: recipientObjectId,
			type: "friend_request",
			message: `${sender.firstName} ${sender.lastName} sent you a friend request`,
			isRead: false,
			data: {
				requestId: result.insertedId,
				senderId: userId,
				senderName: `${sender.firstName} ${sender.lastName}`,
			},
			createdAt: now,
		};

		await notificationsCollection.insertOne(notification);

		return NextResponse.json({
			success: true,
			message: "Friend request sent",
			request: {
				_id: result.insertedId,
				sender: {
					_id: sender._id,
					firstName: sender.firstName,
					lastName: sender.lastName,
					email: sender.email,
					jobTitle: sender.jobTitle,
					location: sender.location,
				},
				recipient: {
					_id: recipient._id,
					firstName: recipient.firstName,
					lastName: recipient.lastName,
					email: recipient.email,
					jobTitle: recipient.jobTitle,
					location: recipient.location,
				},
				status: "pending",
				createdAt: now,
			},
		});
	} catch (error) {
		console.error("Error sending friend request:", error);
		return NextResponse.json(
			{success: false, message: "Failed to send friend request"},
			{status: 500}
		);
	}
}
