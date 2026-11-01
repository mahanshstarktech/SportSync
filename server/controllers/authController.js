const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔑 Generate JWT Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "sportsync_production_secure_jwt_2026";
  return jwt.sign({ id }, secret, { expiresIn: "30d" });
};

// RFC 5322 Email Validation Regex
const isValidEmail = (email) => {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
    email
  );
};

// Password Complexity Check (min 8 chars, at least one number or special char)
const isStrongPassword = (password) => {
  if (typeof password !== "string" || password.length < 8) return false;
  return /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
};

// ============================================================================
// 1. REGISTER
// ============================================================================
exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Full name, email address, and password are required.",
      });
    }

    name = String(name).trim();
    email = String(email).toLowerCase().trim();

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({
        success: false,
        msg: "Full name must be between 2 and 60 characters.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        msg: "Please provide a valid email address.",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        msg: "Password must be at least 8 characters and include at least one number or symbol.",
      });
    }

    // Check duplicate
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "An account with this email address already exists. Please log in.",
      });
    }

    // Bcrypt Hash (Salt Rounds: 12)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      sports: [],
      skillLevel: "Beginner",
      rating: 1000,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        sports: user.sports || [],
        skillLevel: user.skillLevel,
        rating: user.rating,
        matchesPlayed: user.matchesPlayed || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
      },
    });
  } catch (err) {
    console.error("[Auth Register Error]:", err);
    return res.status(500).json({
      success: false,
      msg: "Internal server error during registration. Please try again.",
    });
  }
};

// ============================================================================
// 2. LOGIN
// ============================================================================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Email and password are required.",
      });
    }

    email = String(email).toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        sports: user.sports || [],
        skillLevel: user.skillLevel || "Beginner",
        rating: user.rating || 1000,
        matchesPlayed: user.matchesPlayed || 0,
        wins: user.wins || 0,
        losses: user.losses || 0,
        location: user.location || "",
        bio: user.bio || "",
      },
    });
  } catch (err) {
    console.error("[Auth Login Error]:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error during login. Please try again.",
    });
  }
};

// ============================================================================
// 3. GET CURRENT ATHLETE (/api/auth/me)
// ============================================================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, msg: "Athlete profile not found." });
    }
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};
