import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ["user", "bmo"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    emotion: {
      type: String,
      enum: ["happy", "curious", "surprised", "sleepy", "thinking", "sad", "neutral", "excited", "confused", "dizzy"],
      default: "neutral",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
