const mongoose = require("mongoose");

const directMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false },

    // Apple iMessage Tapbacks (reactions: ❤️ 👍 👎 😂 ‼️ ❓)
    reactions: [
      {
        userId: { type: String, required: true },
        type: {
          type: String,
          enum: ["love", "like", "dislike", "laugh", "emphasize", "question"],
          required: true,
        },
      },
    ],

    // Threaded inline replies (reply-to parent message snippet)
    replyTo: {
      messageId: { type: String },
      text: { type: String },
      senderName: { type: String },
    },

    // Interactive Game / Match Polls
    poll: {
      question: { type: String },
      options: [
        {
          text: { type: String },
          votes: [{ type: String }],
        },
      ],
    },

    // iMessage Bubble Effects
    bubbleEffect: {
      type: String,
      enum: ["none", "confetti", "fireworks", "slam", "gentle"],
      default: "none",
    },
  },
  { timestamps: true }
);

directMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("DirectMessage", directMessageSchema);
