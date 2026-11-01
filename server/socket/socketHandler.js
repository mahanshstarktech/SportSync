const jwt = require("jsonwebtoken");
const Match = require("../models/Match");
const Message = require("../models/Message");

module.exports = function initSocket(server) {
  const { Server } = require("socket.io");

  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://sportssync.netlify.app",
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map(s => s.trim()) : [])
  ];

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          /\.pages\.dev$/.test(origin) ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1")
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.userId}`);

    socket.join(socket.userId);

    socket.on("joinMatchRoom", async ({ matchId }) => {
      try {
        const match = await Match.findById(matchId);
        if (!match) return socket.emit("error", { msg: "Match not found" });

        const isApproved = match.players.some((p) => {
          const pid = p.user?._id?.toString() || p.user?.toString();
          return pid === socket.userId && p.status === "approved";
        });

        if (!isApproved) return socket.emit("error", { msg: "Only approved players can chat" });

        socket.join(matchId);

        const isHost = match.createdBy?.toString() === socket.userId;
        const history = await getVisibleMessages(matchId, socket.userId, isHost, match.chatOpenForAll);

        socket.emit("chatHistory", history);
        socket.emit("chatVisibility", { chatOpenForAll: match.chatOpenForAll, isHost });

      } catch (err) {
        socket.emit("error", { msg: err.message });
      }
    });

    socket.on("sendMessage", async ({ matchId, text }) => {
      try {
        if (!text || !text.trim()) return;
        if (text.length > 500) return socket.emit("error", { msg: "Message too long" });

        const match = await Match.findById(matchId);
        if (!match) return socket.emit("error", { msg: "Match not found" });

        const isApproved = match.players.some((p) => {
          const pid = p.user?._id?.toString() || p.user?.toString();
          return pid === socket.userId && p.status === "approved";
        });

        if (!isApproved) return socket.emit("error", { msg: "Not authorized to chat" });

        const isHost = match.createdBy?.toString() === socket.userId;

        const message = await Message.create({
          matchId,
          sender: socket.userId,
          text: text.trim()
        });

        const populated = await Message.findById(message._id).populate("sender", "name");
        const socketsInRoom = await io.in(matchId).fetchSockets();

        for (const s of socketsInRoom) {
          const receiverIsHost = match.createdBy?.toString() === s.userId;

          if (receiverIsHost) {
            s.emit("newMessage", { ...populated.toObject(), isHostMessage: isHost });
            continue;
          }

          if (match.chatOpenForAll) {
            s.emit("newMessage", { ...populated.toObject(), isHostMessage: isHost });
            continue;
          }

          if (isHost) {
            s.emit("newMessage", { ...populated.toObject(), isHostMessage: true });
          } else if (s.userId === socket.userId) {
            s.emit("newMessage", { ...populated.toObject(), isHostMessage: false, onlyVisibleToSelf: true });
          }
        }

      } catch (err) {
        socket.emit("error", { msg: err.message });
      }
    });

    socket.on("notifyChatToggle", ({ matchId, chatOpenForAll }) => {
      io.to(matchId).emit("chatVisibilityChanged", { chatOpenForAll });
    });

    socket.on("dm:send", async ({ receiverId, text, replyTo, poll, bubbleEffect }) => {
      try {
        if ((!text || !text.trim()) && !poll) return;
        if (text && text.length > 2000)
          return socket.emit("dm:error", { message: "Message exceeds character limit." });

        const Conversation = require("../models/Conversation");
        const DirectMessage = require("../models/DirectMessage");

        let conversation = await Conversation.findOne({
          participants: { $all: [socket.userId, receiverId] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [socket.userId, receiverId],
            unreadCount: { [socket.userId]: 0, [receiverId]: 0 },
          });
        }

        const messageData = {
          conversationId: conversation._id,
          sender: socket.userId,
          receiver: receiverId,
          text: (text || (poll ? `📊 Poll: ${poll.question}` : "")).trim(),
          bubbleEffect: bubbleEffect || "none",
        };

        if (replyTo && replyTo.messageId) {
          messageData.replyTo = {
            messageId: replyTo.messageId,
            text: replyTo.text,
            senderName: replyTo.senderName,
          };
        }

        if (poll && poll.question && Array.isArray(poll.options)) {
          messageData.poll = {
            question: poll.question,
            options: poll.options.map((opt) => ({ text: opt, votes: [] })),
          };
        }

        const message = await DirectMessage.create(messageData);
        const populated = await message.populate("sender", "name");

        const prevUnread = conversation.unreadCount.get(receiverId) || 0;
        conversation.lastMessage = messageData.text;
        conversation.lastMessageTime = new Date();
        conversation.unreadCount.set(receiverId, prevUnread + 1);
        await conversation.save();

        io.to(receiverId).emit("dm:receive", {
          message: populated,
          conversationId: conversation._id,
        });

        socket.emit("dm:sent", {
          message: populated,
          conversationId: conversation._id,
        });

      } catch (err) {
        console.error("[DM Error]", err.message);
        socket.emit("dm:error", { message: "Message delivery failed" });
      }
    });

    // Apple iMessage Tapback Reactions (❤️ 👍 👎 😂 ‼️ ❓)
    socket.on("dm:reaction", async ({ messageId, receiverId, reactionType }) => {
      try {
        const DirectMessage = require("../models/DirectMessage");
        const msg = await DirectMessage.findById(messageId);
        if (!msg) return;

        const existingIndex = msg.reactions.findIndex(
          (r) => r.userId === socket.userId && r.type === reactionType
        );

        if (existingIndex > -1) {
          msg.reactions.splice(existingIndex, 1);
        } else {
          msg.reactions = msg.reactions.filter((r) => r.userId !== socket.userId);
          msg.reactions.push({ userId: socket.userId, type: reactionType });
        }

        await msg.save();

        io.to(receiverId).emit("dm:reaction:update", {
          messageId,
          reactions: msg.reactions,
        });
        socket.emit("dm:reaction:update", {
          messageId,
          reactions: msg.reactions,
        });
      } catch (err) {
        console.error("[DM Reaction Error]:", err.message);
      }
    });

    // Interactive Poll Voting
    socket.on("dm:poll:vote", async ({ messageId, receiverId, optionIndex }) => {
      try {
        const DirectMessage = require("../models/DirectMessage");
        const msg = await DirectMessage.findById(messageId);
        if (!msg || !msg.poll || !msg.poll.options[optionIndex]) return;

        msg.poll.options.forEach((opt) => {
          opt.votes = opt.votes.filter((u) => u !== socket.userId);
        });

        msg.poll.options[optionIndex].votes.push(socket.userId);
        await msg.save();

        io.to(receiverId).emit("dm:poll:update", {
          messageId,
          poll: msg.poll,
        });
        socket.emit("dm:poll:update", {
          messageId,
          poll: msg.poll,
        });
      } catch (err) {
        console.error("[DM Poll Vote Error]:", err.message);
      }
    });

    socket.on("dm:typing", ({ receiverId, isTyping }) => {
      io.to(receiverId).emit("dm:typing", {
        senderId: socket.userId,
        isTyping,
      });
    });

    socket.on("activity:broadcast", async ({ activityId }) => {
      try {
        const Activity = require("../models/Activity");
        const User = require("../models/User");

        const activity = await Activity.findById(activityId)
          .populate("actor", "name")
          .populate("match", "sport location")
          .populate("targetUser", "name");

        if (!activity) return;

        const user = await User.findById(socket.userId).select("friends");
        const friendIds = user.friends.map(f => f.toString());

        friendIds.forEach(fid => {
          io.to(fid).emit("activity:new", activity);
        });

      } catch (err) {
        console.error("[Activity Broadcast Error]", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

async function getVisibleMessages(matchId, userId, isHost, chatOpenForAll) {
  const match = await Match.findById(matchId);
  const hostId = match.createdBy?.toString();

  let query = { matchId };

  if (!isHost && !chatOpenForAll) {
    query.sender = hostId;
  }

  return await Message.find(query)
    .populate("sender", "name")
    .sort({ createdAt: 1 })
    .limit(50);
}