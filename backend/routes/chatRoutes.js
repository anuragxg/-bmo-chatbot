import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// GET /api/chat/:sessionId - fetch chat history for a session
router.get("/:sessionId", async (req, res) => {
  try {
    const messages = await Message.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch chat history" });
  }
});

export default router;
