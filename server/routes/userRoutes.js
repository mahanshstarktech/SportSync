const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Match = require("../models/Match");

// GET /api/users/me
router.get("/me", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user)) {
      return res.status(401).json({ success: false, msg: "Invalid authentication session" });
    }

    const user = await User.findById(req.user).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, msg: "Athlete profile not found" });
    }

    const recentMatches = await Match.find({
      "players.user": req.user,
    })
      .select("title sport location date status winnerTeam players")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ success: true, user, recentMatches });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/search?q=name — player search
router.get("/search", auth, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, msg: "Search query must be at least 2 characters" });
    }

    const users = await User.find({
      _id: { $ne: req.user }, // exclude self
      name: { $regex: q.trim(), $options: "i" }
    })
      .select("name email skillLevel sports wins losses matchesPlayed rating")
      .limit(20);

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get("/:id", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, msg: "Invalid user ID format" });
    }

    const user = await User.findById(req.params.id).select("-password -walletBalance");
    if (!user) return res.status(404).json({ success: false, msg: "Athlete not found" });

    const recentMatches = await Match.find({
      "players.user": req.params.id,
    })
      .select("title sport location date status winnerTeam players")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ success: true, user, recentMatches });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me
router.put("/me", auth, async (req, res, next) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.sports !== undefined) updateData.sports = req.body.sports;
    if (req.body.skillLevel !== undefined) updateData.skillLevel = req.body.skillLevel;
    if (req.body.location !== undefined) updateData.location = req.body.location;

    const updated = await User.findByIdAndUpdate(
      req.user,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;