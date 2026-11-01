const mongoose = require("mongoose");

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;

  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sportsync";
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
    console.error("💡 Action Required: Ensure MONGO_URI is set in Render Environment Variables and IP Whitelist on Atlas allows 0.0.0.0/0");
    // Retry in 5 seconds instead of crashing the process
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
