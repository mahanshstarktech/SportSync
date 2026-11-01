const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔑 Generate Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "sportsync_dev_secret_2026";
  return jwt.sign({ id }, secret, { expiresIn: "30d" });
};

// Simple email regex validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ✅ REGISTER
exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Full name, email, and password are required"
      });
    }

    name = name.trim();
    email = email.toLowerCase().trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        msg: "Please provide a valid email address"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        msg: "Password must be at least 6 characters"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "An account with this email already exists. Please log in."
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default preferences
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      sports: [],
      skillLevel: "Beginner",
      rating: 1000
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
        rating: user.rating
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Failed to create account. Please try again."
    });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Email and password are required"
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: "Invalid email or password"
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
        rating: user.rating || 1000
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      msg: err.message || "Server error during login"
    });
  }
};

// ✅ VERIFY CURRENT USER (/api/auth/me)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message });
  }
};
