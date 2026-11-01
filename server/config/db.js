const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sportsync";
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error("💡 Tip: Set MONGO_URI in server/.env with your MongoDB Atlas or local connection string.");
    if (process.env.NODE_ENV === "production") {
      // In production, keep trying or exit
      process.exit(1);
    }
  }
};

module.exports = connectDB;
