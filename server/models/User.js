const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  skillLevel: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner"
  },

  rating: { type: Number, default: 1000 },
  sports: [String],

  location: {
    lat: Number,
    lng: Number
  },

  matchesPlayed: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },

  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);