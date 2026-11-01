const mongoose = require("mongoose");

let isConnecting = false;

// Normalize MongoDB Atlas URI if database name or query string was omitted
const normalizeMongoUri = (rawUri) => {
  if (!rawUri) return "mongodb://127.0.0.1:27017/sportsync";
  let uri = rawUri.trim();

  // If ends with .mongodb.net/ -> append database name & query params
  if (/^mongodb(\+srv)?:\/\/[^/]+\.mongodb\.net\/$/i.test(uri)) {
    uri = uri + "sportsync?retryWrites=true&w=majority";
  } else if (/^mongodb(\+srv)?:\/\/[^/]+\.mongodb\.net$/i.test(uri)) {
    uri = uri + "/sportsync?retryWrites=true&w=majority";
  }
  return uri;
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;

  const rawUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sportsync";
  const uri = normalizeMongoUri(rawUri);
  isConnecting = true;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) so server remains responsive
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    isConnecting = false;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (error.message.includes("authentication failed")) {
      console.error("💡 Action Required: MongoDB Atlas Authentication Failed. Please verify database user password in MongoDB Atlas -> Security -> Database Access, and update MONGO_URI in Render.");
    } else {
      console.error("💡 Action Required: Ensure MONGO_URI is set in Render Environment Variables and IP Whitelist on Atlas allows 0.0.0.0/0");
    }
    // Retry in 10 seconds with non-blocking timer
    setTimeout(connectDB, 10000);
  }
};

module.exports = connectDB;
