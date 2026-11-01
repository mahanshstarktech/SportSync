const express = require("express");
const router = express.Router();
const {
  registerRequestOtp,
  verifyOtp,
  resendOtp,
  register,
  login,
  getMe,
} = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

// 📧 Email OTP Verification Flow
router.post("/register-request-otp", registerRequestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// 🔐 Standard Auth & Legacy Support
router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getMe);

module.exports = router;
