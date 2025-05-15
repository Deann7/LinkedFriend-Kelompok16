const {MongoClient, ObjectId} = require("mongodb");
const bcrypt = require("bcryptjs");

// MongoDB connection string - same as in your application
const uri =
	process.env.CONNECTION_STRING ||
	"mongodb://admin:password@localhost:27017/linkedfriend?authSource=admin";

// Number of dummy users to create
const NUM_USERS = 30;
const NUM_FRIENDS_PER_USER = 5;
const NUM_PENDING_REQUESTS = 10;

// List of dummy job titles
const JOB_TITLES = [
	"Software Engineer",
	"Product Manager",
	"UX Designer",
	"Data Scientist",
	"Marketing Specialist",
	"Project Manager",
	"Content Writer",
	"HR Manager",
	"Financial Analyst",
	"Sales Representative",
	"Business Analyst",
	"DevOps Engineer",
];

// List of dummy locations
const LOCATIONS = [
	"New York, NY",
	"San Francisco, CA",
	"Seattle, WA",
	"Austin, TX",
	"Chicago, IL",
	"Boston, MA",
	"Los Angeles, CA",
	"Denver, CO",
	"Atlanta, GA",
	"Miami, FL",
	"Portland, OR",
	"Washington, DC",
];

// Hash password
const hashPassword = async (password) => {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
};

// Generate random user data
const generateUsers = async (count) => {
	const users = [];
	const commonPassword = await hashPassword("password123");

	for (let i = 1; i <= count; i++) {
		const firstName = `User${i}`;
		const lastName = `Test${i}`;

		users.push({
			firstName,
			lastName,
			email: `user${i}@example.com`,
			password: commonPassword,
			jobTitle: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)],
			location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
			friends: [], // Will be populated later
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	return users;
};

// Create friend relationships
const createFriendships = (users) => {
	// Create copy of user indices for randomization
	const userIndices = Array.from({length: users.length}, (_, i) => i);

	// For each user, add some random friends
	for (let i = 0; i < users.length; i++) {
		const friendsToAdd = Math.min(NUM_FRIENDS_PER_USER, users.length - 1);
		const possibleFriends = userIndices.filter((idx) => idx !== i);

		// Shuffle and take first N
		const shuffled = possibleFriends.sort(() => 0.5 - Math.random());
		const selectedFriends = shuffled.slice(0, friendsToAdd);

		// Add friend relationships (bidirectional)
		for (const friendIdx of selectedFriends) {
			// Only add if not already friends
			if (
				!users[i].friends.some(
					(id) => id.toString() === users[friendIdx]._id.toString()
				)
			) {
				users[i].friends.push(users[friendIdx]._id);
				users[friendIdx].friends.push(users[i]._id);
			}
		}
	}

	return users;
};

// Create friend requests
const createFriendRequests = (users) => {
	const requests = [];
	const now = new Date();

	// Generate random pending requests
	let count = 0;
	while (count < NUM_PENDING_REQUESTS) {
		// Pick random sender and recipient
		const senderIdx = Math.floor(Math.random() * users.length);
		const recipientIdx = Math.floor(Math.random() * users.length);

		// Skip if same user or already friends
		if (
			senderIdx === recipientIdx ||
			users[senderIdx].friends.some(
				(id) => id.toString() === users[recipientIdx]._id.toString()
			)
		) {
			continue;
		}

		// Skip if request already exists in our generated list
		const alreadyExists = requests.some(
			(req) =>
				(req.senderId.toString() === users[senderIdx]._id.toString() &&
					req.recipientId.toString() ===
						users[recipientIdx]._id.toString()) ||
				(req.senderId.toString() ===
					users[recipientIdx]._id.toString() &&
					req.recipientId.toString() ===
						users[senderIdx]._id.toString())
		);

		if (alreadyExists) {
			continue;
		}

		// Add request
		requests.push({
			senderId: users[senderIdx]._id,
			recipientId: users[recipientIdx]._id,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		});

		count++;
	}

	return requests;
};

// Create notifications
const createNotifications = (users, requests) => {
	const notifications = [];

	// For each friend request, create a notification for the recipient
	for (const request of requests) {
		const sender = users.find(
			(user) => user._id.toString() === request.senderId.toString()
		);

		notifications.push({
			userId: request.recipientId,
			type: "friend_request",
			message: `${sender.firstName} ${sender.lastName} sent you a friend request`,
			isRead: Math.random() > 0.7, // 30% chance of being read
			data: {
				requestId: request._id,
				senderId: sender._id,
				senderName: `${sender.firstName} ${sender.lastName}`,
			},
			createdAt: request.createdAt,
		});
	}

	// Add some system notifications
	for (const user of users) {
		if (Math.random() > 0.7) {
			// 30% chance of having a system notification
			notifications.push({
				userId: user._id,
				type: "system",
				message:
					"Welcome to LinkedFriend! Complete your profile to connect with more professionals.",
				isRead: Math.random() > 0.5,
				createdAt: new Date(
					Date.now() -
						Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
				), // Random time in the last week
			});
		}
	}

	return notifications;
};

// Main function to seed the database
async function seedDatabase() {
	let client;

	try {
		// Connect to MongoDB
		client = new MongoClient(uri);
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db();

		// Clear existing data
		await db.collection("users").deleteMany({});
		await db.collection("friendRequests").deleteMany({});
		await db.collection("notifications").deleteMany({});

		console.log("Existing data cleared");

		// Generate users with random data
		let users = await generateUsers(NUM_USERS);

		// Insert users to get their _id values
		const result = await db.collection("users").insertMany(users);

		// Update user objects with their _id from MongoDB
		users = users.map((user, index) => ({
			...user,
			_id: result.insertedIds[index],
		}));

		console.log(`Inserted ${users.length} users`);

		// Create friend relationships
		users = createFriendships(users);

		// Update users with their friends
		for (const user of users) {
			await db
				.collection("users")
				.updateOne({_id: user._id}, {$set: {friends: user.friends}});
		}

		console.log("Updated users with friend relationships");

		// Generate friend requests
		const friendRequests = createFriendRequests(users);

		// Insert friend requests
		const requestResult = await db
			.collection("friendRequests")
			.insertMany(friendRequests);

		// Update friend request objects with their _id
		const requestsWithIds = friendRequests.map((request, index) => ({
			...request,
			_id: requestResult.insertedIds[index],
		}));

		console.log(`Inserted ${requestsWithIds.length} friend requests`);

		// Generate notifications
		const notifications = createNotifications(users, requestsWithIds);

		// Insert notifications
		await db.collection("notifications").insertMany(notifications);

		console.log(`Inserted ${notifications.length} notifications`);

		console.log("Database seeded successfully!");

		// Create a test admin user
		const adminPassword = await hashPassword("admin123");
		await db.collection("users").insertOne({
			firstName: "Admin",
			lastName: "User",
			email: "admin@example.com",
			password: adminPassword,
			jobTitle: "System Administrator",
			location: "System, Cloud",
			friends: [],
			isAdmin: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		console.log("Test admin user created (admin@example.com / admin123)");
	} catch (error) {
		console.error("Error seeding database:", error);
	} finally {
		if (client) {
			await client.close();
			console.log("MongoDB connection closed");
		}
	}
}

// Run the seed function
seedDatabase();
