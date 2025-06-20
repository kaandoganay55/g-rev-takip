import { AuthOptions } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "./mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

// Define the NextAuth options
export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const client = await clientPromise;
        const usersCollection = client.db().collection("users");
        const user = await usersCollection.findOne({ email: credentials.email });
        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return { id: user._id.toString(), email: user.email, name: user.name };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

// Use MongoDB adapter for session storage
// ... existing code ...

// Configure Google OAuth provider
// ... existing code ...

// Configure Credentials provider for email/password authentication
// ... existing code ...

// Check if email and password are provided
// ... existing code ...

// Connect to the database and find the user
// ... existing code ...

// Compare the provided password with the stored hashed password
// ... existing code ...

// Return user object if authentication is successful
// ... existing code ...

// Use JWT strategy for session management
// ... existing code ...

// Use environment variable for NextAuth secret
// ... existing code ... 