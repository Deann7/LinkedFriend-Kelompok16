import {MongoClient} from "mongodb";
import mongoose from 'mongoose';

// Default to a local connection if CONNECTION_STRING is not defined
const uri =
	process.env.CONNECTION_STRING ||
	"mongodb://admin:password@localhost:27017/linkedfriend?authSource=admin";

// Configure connection options for better performance and reliability
const options = {
	connectTimeoutMS: 10000, // Connection timeout of 10 seconds
	socketTimeoutMS: 45000, // Socket timeout of 45 seconds
	serverSelectionTimeoutMS: 10000, // Server selection timeout of 10 seconds
	maxPoolSize: 50, // Maximum number of connections in the pool
	minPoolSize: 5, // Minimum number of connections in the pool
	family: 4, // Force IPv4 connection
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
	// In development mode, use a global variable so that the value
	// is preserved across module reloads caused by HMR (Hot Module Replacement).
	let globalWithMongo = global as typeof global & {
		_mongoClientPromise?: Promise<MongoClient>;
	};

	if (!globalWithMongo._mongoClientPromise) {
		client = new MongoClient(uri, options);
		globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
			console.error("Failed to connect to MongoDB:", err);
			throw err;
		});
	}
	clientPromise = globalWithMongo._mongoClientPromise;
} else {
	// In production mode, it's best to not use a global variable.
	client = new MongoClient(uri, options);
	clientPromise = client.connect().catch((err) => {
		console.error("Failed to connect to MongoDB:", err);
		throw err;
	});
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

export async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  const uri = process.env.CONNECTION_STRING ||
    'mongodb://admin:password@localhost:27017/linkedfriend?authSource=admin';
  await mongoose.connect(uri);
}
