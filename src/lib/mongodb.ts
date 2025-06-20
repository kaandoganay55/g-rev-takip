import { MongoClient, MongoClientOptions } from "mongodb";

// Declare a global variable to store the MongoDB client promise
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

// Get the MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

// Check if the URI is defined, throw an error if not
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Initialize client and clientPromise variables
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to cache the client across module reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client for each connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export the client promise for use in other parts of the application
export default clientPromise; 