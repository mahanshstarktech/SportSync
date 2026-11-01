const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const { sendOtpEmail } = require("../utils/emailService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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
// 1. REQUEST REGISTRATION OTP (Initiates Email Verification)
// ============================================================================
exports.registerRequestOtp = async (req, res) => {
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "An athlete account with this email address already exists. Please log in.",
      });
    }

    // Hash password before saving to pending verification
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit numerical OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Clean up any stale pending verification for this email
    await EmailVerification.deleteMany({ email });

    // Save pending verification
    await EmailVerification.create({
      email,
      otp,
      name,
      password: hashedPassword,
      attempts: 0,
      createdAt: new Date(),
    });

    // Send OTP via Nodemailer / Apple template
    const emailResult = await sendOtpEmail(email, name, otp);

    return res.status(200).json({
      success: true,
      msg: `A 6-digit confirmation code has been sent to ${email}.`,
      email,
      expiresIn: 600, // 10 minutes
      // If running simulated/dev fallback without SMTP credentials, pass devOtp for zero-friction testing
      ...(emailResult.simulated ? { devOtp: otp, note: "Email simulated: OTP logged to server console." } : {}),
    });
  } catch (err) {
    console.error("[Auth Request OTP Error]:", err);
    return res.status(500).json({
      success: false,
      msg: "Unable to send verification email. Please verify your connection or try again.",
    });
  }
};

// ============================================================================
// 2. VERIFY OTP & COMPLETE REGISTRATION
// ============================================================================
exports.verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        msg: "Email address and 6-digit confirmation code are required.",
      });
    }

    email = String(email).toLowerCase().trim();
    otp = String(otp).trim();

    const pending = await EmailVerification.findOne({ email });
    if (!pending) {
      return res.status(400).json({
        success: false,
        msg: "Confirmation code has expired or was not requested. Please request a new code.",
      });
    }

    if (pending.attempts >= 5) {
      await EmailVerification.deleteOne({ _id: pending._id });
      return res.status(429).json({
        success: false,
        msg: "Too many failed attempts. For your security, please request a new verification code.",
      });
    }

    if (pending.otp !== otp) {
      pending.attempts += 1;
      await pending.save();
      const remaining = 5 - pending.attempts;
      return res.status(400).json({
        success: false,
        msg: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // Check once more if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      await EmailVerification.deleteOne({ _id: pending._id });
      return res.status(400).json({
        success: false,
        msg: "An account with this email already exists. Please log in.",
      });
    }

    // Create verified athlete profile
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      isVerified: true,
      sports: [],
      skillLevel: "Beginner",
      rating: 1000,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    });

    // Delete pending record
    await EmailVerification.deleteOne({ _id: pending._id });

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
    console.error("[Auth Verify OTP Error]:", err);
    return res.status(500).json({
      success: false,
      msg: "Internal server error while verifying code. Please try again.",
    });
  }
};

// ============================================================================
// 3. RESEND OTP
// ============================================================================
exports.resendOtp = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, msg: "Email address is required." });
    }

    email = String(email).toLowerCase().trim();

    const pending = await EmailVerification.findOne({ email });
    if (!pending) {
      return res.status(400).json({
        success: false,
        msg: "Registration session expired. Please enter your athlete details again.",
      });
    }

    // Generate fresh OTP
    const newOtp = crypto.randomInt(100000, 999999).toString();
    pending.otp = newOtp;
    pending.attempts = 0;
    pending.createdAt = new Date();
    await pending.save();

    const emailResult = await sendOtpEmail(email, pending.name, newOtp);

    return res.json({
      success: true,
      msg: `A fresh 6-digit confirmation code has been sent to ${email}.`,
      expiresIn: 600,
      ...(emailResult.simulated ? { devOtp: newOtp } : {}),
    });
  } catch (err) {
    console.error("[Auth Resend OTP Error]:", err);
    return res.status(500).json({
      success: false,
      msg: "Unable to resend confirmation email. Please try again.",
    });
  }
};

// ============================================================================
// 4. DIRECT REGISTER (Legacy Fallback)
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "An account with this email address already exists. Please log in.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: true,
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
// 5. LOGIN
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
