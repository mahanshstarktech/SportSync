const Match = require("../models/Match");

// ✅ CREATE MATCH
exports.createMatch = async (req, res) => {
  try {
    const match = new Match({
      ...req.body,
      createdBy: req.user,
      players: [{ user: req.user, status: "approved" }]
    });

    await match.save();

    res.status(201).json({
      success: true,
      match
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ✅ JOIN MATCH (FIXED)
exports.joinMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match)
      return res.status(404).json({ msg: "Match not found" });

    // ✅ SAFE duplicate check (handles both cases)
    const alreadyJoined = match.players.some((p) => {
      const playerId = p.user?._id
        ? p.user._id.toString()
        : p.user.toString();

      return playerId === req.user.toString();
    });

    if (alreadyJoined)
      return res.status(400).json({ msg: "Already joined match" });

    if (match.players.length >= match.maxPlayers)
      return res.status(400).json({ msg: "Match is full" });

    match.players.push({
      user: req.user,
      status: "pending"
    });

    await match.save();

    res.json({
      success: true,
      msg: "Join request sent",
      match
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ✅ LEAVE MATCH (FULLY FIXED 🔥)
exports.leaveMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    // ❌ creator cannot leave
    if (match.createdBy.toString() === req.user.toString()) {
      return res.status(400).json({
        msg: "Creator cannot leave match"
      });
    }

    // ✅ SAFE FIND (handles populated + non-populated)
    const playerIndex = match.players.findIndex((p) => {
      const playerId = p.user?._id
        ? p.user._id.toString()
        : p.user.toString();

      return playerId === req.user.toString();
    });

    if (playerIndex === -1) {
      return res.status(400).json({
        msg: "You are not in this match"
      });
    }

    // ✅ remove player
    match.players.splice(playerIndex, 1);

    await match.save();

    res.json({
      success: true,
      msg: "Left match successfully",
      match
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// ✅ APPROVE PLAYER (FIXED)
exports.approvePlayer = async (req, res) => {
  try {
    const { playerId } = req.body;

    const match = await Match.findById(req.params.id);

    if (!match)
      return res.status(404).json({ msg: "Match not found" });

    if (match.createdBy.toString() !== req.user.toString()) {
      return res.status(403).json({
        msg: "Only organizer can approve players"
      });
    }

    let found = false;

    match.players = match.players.map((p) => {
      const currentId = p.user?._id
        ? p.user._id.toString()
        : p.user.toString();

      if (currentId === playerId) {
        found = true;
        return { ...p._doc, status: "approved" };
      }
      return p;
    });

    if (!found)
      return res.status(404).json({ msg: "Player not found" });

    await match.save();

    res.json({
      success: true,
      msg: "Player approved",
      match
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ✅ GET ALL MATCHES
exports.getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("players.user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ✅ GET SINGLE MATCH (IMPORTANT FIX)
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("players.user", "name email");

    if (!match)
      return res.status(404).json({ msg: "Match not found" });

    res.json({
      success: true,
      match // ✅ always use res.data.match in frontend
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ✅ DELETE MATCH
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match)
      return res.status(404).json({ msg: "Match not found" });

    if (match.createdBy.toString() !== req.user.toString()) {
      return res.status(403).json({
        msg: "Only organizer can delete match"
      });
    }

    await match.deleteOne();

    res.json({
      success: true,
      msg: "Match deleted"
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// ✅ GET NEARBY MATCHES
exports.getNearbyMatches = async (req, res) => {
  try {
    const { lat, lng, distance = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        msg: "Latitude and Longitude required"
      });
    }

    const matches = await Match.find({
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            distance / 6378.1
          ]
        }
      }
    });

    res.json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};