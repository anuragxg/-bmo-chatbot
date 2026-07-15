import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import Message from "./models/Message.js";
import chatRoutes from "./routes/chatRoutes.js";
import { generateBmoReply, classifyEmotion } from "./controllers/chatController.js";

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());
app.use("/api/chat", chatRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "BMO is awake!" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

// In-memory recent history per session, used as context for Claude calls.
// (Full history still persists to MongoDB regardless.)
const sessionHistory = new Map();

io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);

  socket.on("join_session", (sessionId) => {
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    if (!sessionHistory.has(sessionId)) sessionHistory.set(sessionId, []);
  });

  // Fired the instant the user is typing/sends a message, so BMO can react
  // with an emotion on-screen before the reply even comes back.
  socket.on("user_message", async ({ sessionId, text }) => {
    if (!sessionId || !text?.trim()) return;

    const userEmotion = classifyEmotion(text);

    // Broadcast the user's message + BMO's immediate "reaction" emotion
    io.to(sessionId).emit("bmo_reaction", { emotion: userEmotion, phase: "heard" });

    // Fire-and-forget persistence: DB writes never block the live chat flow,
    // so the app stays fully responsive even if MongoDB isn't connected.
    new Message({ sessionId, sender: "user", text, emotion: userEmotion })
      .save()
      .catch((e) => console.error("[db] save user msg failed:", e.message));

    const history = sessionHistory.get(sessionId) || [];
    history.push({ sender: "user", text });

    // Let BMO "think" briefly before replying (drives a thinking animation client-side)
    io.to(sessionId).emit("bmo_reaction", { emotion: "thinking", phase: "thinking" });

    const replyText = await generateBmoReply(text, history);
    const replyEmotion = classifyEmotion(replyText);

    history.push({ sender: "bmo", text: replyText });
    sessionHistory.set(sessionId, history);

    new Message({
      sessionId,
      sender: "bmo",
      text: replyText,
      emotion: replyEmotion,
    })
      .save()
      .catch((e) => console.error("[db] save bmo msg failed:", e.message));

    io.to(sessionId).emit("bmo_message", {
      text: replyText,
      emotion: replyEmotion,
      createdAt: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`[server] BMO backend running on port ${PORT}`);
});

// Connect to MongoDB in the background - chat still works live even if
// this is slow or fails, it just won't persist history until connected.
connectDB();
