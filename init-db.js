// Script to initialize MongoDB with collections and indexes
const {MongoClient} = require("mongodb");

async function initDb() {
	const uri =
		"mongodb://admin:password@localhost:27017/linkedfriend?authSource=admin";

	console.log("Connecting to MongoDB...");
	const client = new MongoClient(uri);

	try {
		await client.connect();
		console.log("Connected to MongoDB");

		const db = client.db("linkedfriend");

		// Create collections
		console.log("Creating collections...");
		await db.createCollection("users");
		await db.createCollection("posts");
		await db.createCollection("comments");
		await db.createCollection("connections");

		// Create indexes
		console.log("Creating indexes...");
		await db.collection("users").createIndex({email: 1}, {unique: true});
		await db.collection("users").createIndex({firstName: 1, lastName: 1});

		await db.collection("posts").createIndex({authorId: 1});
		await db.collection("posts").createIndex({createdAt: -1});

		await db.collection("comments").createIndex({postId: 1});
		await db.collection("comments").createIndex({authorId: 1});

		await db.collection("connections").createIndex({userId: 1});
		await db.collection("connections").createIndex({connectionId: 1});

		console.log("Database initialization completed successfully");
	} catch (err) {
		console.error("Error initializing database:", err);
	} finally {
		await client.close();
		console.log("MongoDB connection closed");
	}
}

initDb();
