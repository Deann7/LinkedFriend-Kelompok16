import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@/utils/mongodb";
import {ObjectId} from "mongodb";
import {verifyToken} from "@/utils/auth";

interface FriendData {
	_id: ObjectId;
	friends?: Array<string | ObjectId>;
}

interface ConnectionData {
	_id: ObjectId;
	firstName: string;
	lastName: string;
	jobTitle?: string;
	location?: string;
	email: string;
	friends?: Array<string | ObjectId>;
	[key: string]: any;
}

// GET /api/friends/network - Get mutual connections and friends of friends
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

		// Get current user's friends (ensuring the array exists)
		const userFriends = currentUser.friends || [];

		// If the user doesn't have any friends yet, return empty results
		if (userFriends.length === 0) {
			return NextResponse.json({
				success: true,
				connections: [],
				message: "Add friends to see your network connections",
			});
		}

		// Convert string IDs to ObjectIds if needed
		const friendObjectIds = userFriends.map((id: string | ObjectId) =>
			id instanceof ObjectId ? id : new ObjectId(id)
		);

		// Get all users who are friends with the user's friends (friends of friends)
		const friendsData: FriendData[] = await usersCollection
			.find({_id: {$in: friendObjectIds}})
			.project({_id: 1, friends: 1})
			.toArray();

		// Extract friend-of-friend IDs
		const friendOfFriendIds = new Set<string>();

		// For each friend
		friendsData.forEach((friend: FriendData) => {
			// Get the friend's friends (if any)
			const friendFriends = friend.friends || [];

			// For each friend-of-friend
			friendFriends.forEach((fofId: string | ObjectId) => {
				const fofIdStr = fofId.toString();

				// Only add if not the user themselves and not already their direct friend
				if (
					fofIdStr !== userId.toString() &&
					!friendObjectIds.some(
						(id: ObjectId) => id.toString() === fofIdStr
					)
				) {
					friendOfFriendIds.add(fofIdStr);
				}
			});
		});

		// If no friends-of-friends found
		if (friendOfFriendIds.size === 0) {
			return NextResponse.json({
				success: true,
				connections: [],
				message: "No network connections found yet",
			});
		}

		// Get pending requests with these potential connections
		const pendingRequests = await requestsCollection
			.find({
				$or: [
					{
						senderId: userId,
						recipientId: {
							$in: Array.from(friendOfFriendIds).map(
								(id: string) => new ObjectId(id)
							),
						},
						status: "pending",
					},
					{
						senderId: {
							$in: Array.from(friendOfFriendIds).map(
								(id: string) => new ObjectId(id)
							),
						},
						recipientId: userId,
						status: "pending",
					},
				],
			})
			.toArray();

		// Get IDs with pending requests
		const pendingIds = new Set<string>();
		pendingRequests.forEach((req: any) => {
			if (req.senderId.toString() !== userId.toString()) {
				pendingIds.add(req.senderId.toString());
			}
			if (req.recipientId.toString() !== userId.toString()) {
				pendingIds.add(req.recipientId.toString());
			}
		});

		// Get user details for friends-of-friends
		const connections: ConnectionData[] = await usersCollection
			.find({
				_id: {
					$in: Array.from(friendOfFriendIds).map(
						(id: string) => new ObjectId(id)
					),
				},
			})
			.project({
				_id: 1,
				firstName: 1,
				lastName: 1,
				jobTitle: 1,
				location: 1,
				email: 1,
				friends: 1,
			})
			.limit(20)
			.toArray();

		// Calculate mutual connections for each friend-of-friend
		const connectionsWithMutual = connections.map(
			(connection: ConnectionData) => {
				const connectionFriends = connection.friends || [];

				// Find mutual friends (user's friends who are also connection's friends)
				const mutualFriends = friendObjectIds.filter(
					(friendId: ObjectId) =>
						connectionFriends.some(
							(connFriendId: string | ObjectId) =>
								connFriendId.toString() === friendId.toString()
						)
				);

				// Add a status if there's a pending request
				let status = null;
				if (pendingIds.has(connection._id.toString())) {
					const request = pendingRequests.find(
						(req: any) =>
							req.senderId.toString() ===
								connection._id.toString() ||
							req.recipientId.toString() ===
								connection._id.toString()
					);

					if (request) {
						status =
							request.senderId.toString() === userId.toString()
								? "pending"
								: "received";
					}
				}

				// Remove the friends array from the response
				const {friends, ...connectionData} = connection;

				return {
					...connectionData,
					mutualFriends: mutualFriends.length,
					status,
				};
			}
		);

		// Sort by number of mutual friends (most mutual connections first)
		connectionsWithMutual.sort((a, b) => b.mutualFriends - a.mutualFriends);

		return NextResponse.json({
			success: true,
			connections: connectionsWithMutual,
		});
	} catch (error) {
		console.error("Error fetching network connections:", error);
		return NextResponse.json(
			{success: false, message: "Failed to fetch network connections"},
			{status: 500}
		);
	}
}
