import mongoose from "mongoose";

// Fail fast instead of buffering commands indefinitely when disconnected -
// otherwise a missing/slow DB silently stalls the whole chat flow.
mongoose.set("bufferCommands", false);

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/bmo-chatbot";

  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected");
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    console.error("[db] The app will keep running, but chat history won't persist.");
  }
}
