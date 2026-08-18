import mongoose from "mongoose";
import { env } from "./env.js";

let isConnected = false;

function getMongoUri(): string {
  const uri = env.MONGODB_URI;
  if (process.env.NODE_ENV === "production" || !uri.startsWith("mongodb://localhost:27017")) return uri;
  if (uri.includes("replicaSet=")) return uri;
  return `${uri}${uri.includes("?") ? "&" : "?"}replicaSet=rs0&directConnection=true`;
}

export async function connectDB(): Promise<void> {
  if (isConnected) return;
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(getMongoUri());
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}
