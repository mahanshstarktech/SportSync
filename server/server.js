const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");
const initSocket = require("./socket/socketHandler");
const cleanupOldMatches = require("./jobs/cleanupMatches");

dotenv.config();

// ✅ Environment checks (Resilient boot - never crash server before binding port)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "sportsync_prod_default_jwt_secret_998811";
  console.warn("⚠️ Warning: JWT_SECRET not configured in environment. Using default key.");
}

if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/sportsync";
  console.warn("⚠️ Warning: MONGO_URI not set. Set MONGO_URI in Render Dashboard for persistent Atlas DB.");
}

// ✅ Connect DB (asynchronously, with auto-retry)
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Reverse proxy trust (Render / Cloudflare)
app.set("trust proxy", 1);

// ✅ Init Socket.io
const io = initSocket(server);
app.set("io", io);

// ✅ CORS Configuration for Cloudflare Pages, Netlify & Localhost
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://sportssync.netlify.app",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((s) => s.trim()) : [])
];

app.use(
  cors({
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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

// ✅ Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  })
);

// ✅ Middleware
app.use(express.json({ limit: "2mb" }));

// ✅ Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 50 : 200,
  message: { success: false, msg: "Too many authentication requests, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// ✅ Graceful DB readiness check for API routes
app.use("/api", (req, res, next) => {
  const mongoose = require("mongoose");
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    const isUriConfigured = !!process.env.MONGO_URI && !process.env.MONGO_URI.includes("127.0.0.1");
    const advice = !isUriConfigured
      ? "MongoDB Atlas URI is not set. Please add MONGO_URI in Render Dashboard -> Environment Variables."
      : "Connecting to MongoDB Atlas... If this persists, ensure MongoDB Atlas Network Access is set to 0.0.0.0/0 (Allow from anywhere).";

    return res.status(503).json({
      success: false,
      msg: advice,
      dbState: mongoose.connection.readyState
    });
  }
  next();
});

// ✅ Routes
app.use("/api/auth",          authLimiter, require("./routes/authRoutes"));
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/matches",       require("./routes/matchRoutes"));
app.use("/api/messages",      require("./routes/messageRoutes"));
app.use("/api/friends",       require("./routes/friendRoutes"));
app.use("/api/dm",            require("./routes/dmRoutes"));
app.use("/api/activity",      require("./routes/activityRoutes"));
app.use("/api/tournaments",   require("./routes/tournamentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ✅ Health route (Render and Cloudflare status monitor)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "SportSync API",
    version: "2.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  const mongoose = require("mongoose");
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? "healthy" : "degraded",
    database: isConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ✅ Error handler
app.use(errorHandler);

// ✅ Cron: cleanup old matches every hour
cron.schedule("0 * * * *", () => {
  console.log("[Cron] Running match cleanup...");
  cleanupOldMatches();
});

// ✅ Cron: match starting soon — runs every minute
cron.schedule("* * * * *", async () => {
  try {
    const Match = require("./models/Match");
    const { createNotification } = require("./utils/notificationHelper");

    const now = new Date();
    const in55mins = new Date(now.getTime() + 55 * 60 * 1000);
    const in65mins = new Date(now.getTime() + 65 * 60 * 1000);

    const upcomingMatches = await Match.find({
      status: "upcoming",
      date: { $gte: in55mins, $lte: in65mins },
      startingSoonNotified: { $ne: true }
    })
      .populate("players.user", "name")
      .populate("createdBy", "name");

    for (const match of upcomingMatches) {
      const approvedPlayers = match.players.filter((p) => p.status === "approved");
      console.log(`[Cron] Sending starting soon notification for match: ${match.sport}`);

      for (const player of approvedPlayers) {
        const uid = player.user?._id?.toString() || player.user?.toString();
        if (!uid) continue;

        await createNotification(io, {
          recipientId: uid,
          type: "match_starting_soon",
          title: "Match Starting Soon ⏰",
          message: `Your ${match.sport} match at ${match.location?.name || "the venue"} starts in about 1 hour!`,
          matchId: match._id,
          actionUrl: `/match/${match._id}`
        });
      }

      await Match.findByIdAndUpdate(match._id, { startingSoonNotified: true });
    }
  } catch (err) {
    console.error("[Cron] Starting soon notification error:", err);
  }
});

// ✅ Initial cleanup run
cleanupOldMatches();

// ✅ Start server (Render uses PORT env var, macOS defaults to 5001 to avoid AirPlay port 5000 conflict)
const PORT = process.env.PORT || 5001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SportSync Server + Socket.io running on port ${PORT} (0.0.0.0)`);
});
