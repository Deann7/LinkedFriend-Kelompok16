const {MongoClient, ObjectId} = require("mongodb");
const bcrypt = require("bcryptjs");

// MongoDB connection string
const uri =
	process.env.CONNECTION_STRING ||
	"mongodb://admin:password@localhost:27017/linkedfriend?authSource=admin";

async function createTestAccount() {
	let client;

	try {
		// Connect to MongoDB
		client = new MongoClient(uri);
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db();
		const usersCollection = db.collection("users");
		const requestsCollection = db.collection("friendRequests");
		const notificationsCollection = db.collection("notifications");

		// Create a test password
		const salt = await bcrypt.genSalt(10);
		const password = await bcrypt.hash("test123", salt);

		// Check if test account already exists
		const existingUser = await usersCollection.findOne({
			email: "test@example.com",
		});
		if (existingUser) {
			console.log(
				"Test account already exists. Removing it to create a fresh one..."
			);

			// Remove the user and related data
			await usersCollection.deleteOne({_id: existingUser._id});
			await requestsCollection.deleteMany({
				$or: [
					{senderId: existingUser._id},
					{recipientId: existingUser._id},
				],
			});
			await notificationsCollection.deleteMany({
				userId: existingUser._id,
			});
		}

		// Create test account
		const result = await usersCollection.insertOne({
			firstName: "Test",
			lastName: "User",
			email: "test@example.com",
			password,
			jobTitle: "Software Developer",
			location: "New York, NY",
			friends: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const testUserId = result.insertedId;
		console.log(`Created test user with ID: ${testUserId}`);

		// Get 5 random existing users to be friends
		const randomUsers = await usersCollection
			.find({
				_id: {$ne: testUserId},
				email: {$ne: "admin@example.com"},
			})
			.limit(5)
			.toArray();

		const friendIds = randomUsers.map((user) => user._id);

		// Add these users as friends of test user
		await usersCollection.updateOne(
			{_id: testUserId},
			{$set: {friends: friendIds}}
		);

		// Add test user as friend to these users
		for (const friendId of friendIds) {
			await usersCollection.updateOne(
				{_id: friendId},
				{$addToSet: {friends: testUserId}}
			);
		}

		console.log(`Added ${friendIds.length} friends to test account`);

		// Get 3 more users to send friend requests to test user
		const requestSenders = await usersCollection
			.find({
				_id: {$ne: testUserId},
				email: {$ne: "admin@example.com"},
				friends: {$ne: testUserId},
			})
			.limit(3)
			.toArray();

		// Create pending friend requests
		const now = new Date();
		for (const sender of requestSenders) {
			// Check if request already exists
			const existingRequest = await requestsCollection.findOne({
				senderId: sender._id,
				recipientId: testUserId,
			});

			if (existingRequest) {
				console.log(
					`Request from ${sender.firstName} ${sender.lastName} already exists, skipping`
				);
				continue;
			}

			// Create friend request
			const requestResult = await requestsCollection.insertOne({
				senderId: sender._id,
				recipientId: testUserId,
				status: "pending",
				createdAt: now,
				updatedAt: now,
			});

			// Create notification
			await notificationsCollection.insertOne({
				userId: testUserId,
				type: "friend_request",
				message: `${sender.firstName} ${sender.lastName} sent you a friend request`,
				isRead: false,
				data: {
					requestId: requestResult.insertedId,
					senderId: sender._id,
					senderName: `${sender.firstName} ${sender.lastName}`,
				},
				createdAt: now,
			});
		}

		console.log(
			`Added ${requestSenders.length} pending friend requests to test account`
		);

		// Get 2 more users for test user to send friend requests to - exclude friends and requestSenders
		const excludeIds = [
			...friendIds,
			...requestSenders.map((u) => u._id),
			testUserId,
		];
		const requestRecipients = await usersCollection
			.find({
				_id: {$nin: excludeIds},
				email: {$ne: "admin@example.com"},
			})
			.limit(2)
			.toArray();

		// Create outgoing friend requests
		for (const recipient of requestRecipients) {
			await requestsCollection.insertOne({
				senderId: testUserId,
				recipientId: recipient._id,
				status: "pending",
				createdAt: now,
				updatedAt: now,
			});
		}

		console.log(
			`Added ${requestRecipients.length} outgoing friend requests from test account`
		);

		// Add some system notifications
		const systemNotifications = [
			{
				userId: testUserId,
				type: "system",
				message:
					"Welcome to LinkedFriend! Complete your profile to connect with more professionals.",
				isRead: true,
				createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
			},
			{
				userId: testUserId,
				type: "system",
				message:
					"Your profile is getting noticed! 5 people viewed your profile this week.",
				isRead: false,
				createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
			},
		];

		await notificationsCollection.insertMany(systemNotifications);

		console.log("Added system notifications to test account");
		console.log("\n-----------------------------------------");
		console.log("TEST ACCOUNT DETAILS:");
		console.log("Email: test@example.com");
		console.log("Password: test123");
		console.log("-----------------------------------------\n");
	} catch (error) {
		console.error("Error creating test account:", error);
	} finally {
		if (client) {
			await client.close();
			console.log("MongoDB connection closed");
		}
	}
}

// Run the function
createTestAccount();
