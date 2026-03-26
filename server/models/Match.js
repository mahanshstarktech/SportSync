const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    sport: {
      type: String,
      required: true
    },

    // 👇 UPDATED LOCATION (GeoJSON format)
    location: {
      name: String,
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number], // [lng, lat]
          required: true
        }
      }
    },

    date: {
      type: Date,
      required: true
    },

    maxPlayers: {
      type: Number,
      required: true
    },

    // 👇 creator added (IMPORTANT)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        status: {
          type: String,
          enum: ["pending", "approved"],
          default: "pending"
        }
      }
    ],

    price: {
      type: Number,
      default: 0
    },

    paidUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    winnerTeam: String
  },
  { timestamps: true }
);

// 🌍 GEO INDEX (VERY IMPORTANT)
matchSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Match", matchSchema);