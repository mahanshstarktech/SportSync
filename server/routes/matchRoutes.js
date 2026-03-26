const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createMatch,
  joinMatch,
  leaveMatch,
  approvePlayer,
  getAllMatches,
  getMatchById,
  deleteMatch,
  getNearbyMatches
} = require("../controllers/matchController");

// CREATE
router.post("/", auth, createMatch);

// JOIN
router.post("/:id/join", auth, joinMatch);

// LEAVE
router.post("/:id/leave", auth, leaveMatch);

// APPROVE
router.post("/:id/approve", auth, approvePlayer);

// GET ALL
router.get("/", getAllMatches);

// GET SINGLE
router.get("/:id", getMatchById);

// DELETE
router.delete("/:id", auth, deleteMatch);

// NEARBY
router.get("/nearby/search", getNearbyMatches);

module.exports = router;