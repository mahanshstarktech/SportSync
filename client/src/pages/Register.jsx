import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Award,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import API from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  // Multi-step: "form" | "otp"
  const [step, setStep] = useState("form");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // OTP State: 6 digits
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  const digitRefs = useRef([]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus first digit when switching to OTP step
  useEffect(() => {
    if (step === "otp" && digitRefs.current[0]) {
      setTimeout(() => {
        digitRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Password strength calculation
  const hasMinLength = form.password.length >= 8;
  const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password);
  const hasLetters = /[a-zA-Z]/.test(form.password);

  const getStrengthLabel = () => {
    if (!form.password) return { label: "", color: "bg-slate-200" };
    const score = (hasMinLength ? 1 : 0) + (hasNumberOrSymbol ? 1 : 0) + (hasLetters ? 1 : 0);
    if (score === 3) return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
    if (score === 2) return { label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
    return { label: "Weak", color: "bg-red-500", text: "text-red-500" };
  };

  const strength = getStrengthLabel();

  // ============================================================================
  // Step 1: Submit Details & Request Email OTP
  // ============================================================================
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessNotice("");

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !form.password) {
      setErrorMsg("All registration fields are required.");
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMsg("Please enter your full name (minimum 2 characters).");
      return;
    }

    if (form.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    if (!hasNumberOrSymbol) {
      setErrorMsg("Password must contain at least one number or special symbol.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/register-request-otp", {
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
      });

      if (res.data?.success) {
        setStep("otp");
        setCountdown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setSuccessNotice(`Verification code sent to ${trimmedEmail}`);
      } else {
        setErrorMsg(res.data?.msg || "Unable to send verification code. Please try again.");
      }
    } catch (err) {
      console.error("[Request OTP Error]:", err);
      if (err.code === "ECONNABORTED" || !err.response) {
        setErrorMsg(
          "Server is waking up (Render free tier). Please wait ~15 seconds and tap 'Send Verification Code' again."
        );
      } else {
        setErrorMsg(
          err.response?.data?.msg ||
          err.response?.data?.message ||
          "Registration failed. An account with this email may already exist."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Step 2: Handle 6-Digit OTP Inputs (Auto-advance & Paste support)
  // ============================================================================
  const handleDigitChange = (index, val) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMsg("");

    // If character entered, auto-focus next
    if (char && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }

    // If all 6 filled, trigger verification automatically
    if (char && index === 5 && newDigits.every((d) => d !== "")) {
      executeVerify(newDigits.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (pasteData.length >= 6) {
      const codeArray = pasteData.slice(0, 6).split("");
      setOtpDigits(codeArray);
      digitRefs.current[5]?.focus();
      executeVerify(codeArray.join(""));
    }
  };

  // ============================================================================
  // Step 3: Verify OTP & Complete Signup
  // ============================================================================
  const executeVerify = async (otpCode) => {
    const code = otpCode || otpDigits.join("");
    if (code.length < 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await API.post("/auth/verify-otp", {
        email: form.email.trim().toLowerCase(),
        otp: code,
      });

      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user._id);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/select-sports");
      } else {
        setErrorMsg("Verification succeeded but no session token received.");
      }
    } catch (err) {
      console.error("[Verify OTP Error]:", err);
      if (err.code === "ECONNABORTED" || !err.response) {
        setErrorMsg("Connection timed out. Please retry verification.");
      } else {
        setErrorMsg(
          err.response?.data?.msg ||
          err.response?.data?.message ||
          "Incorrect verification code. Please check your email."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Resend OTP
  // ============================================================================
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    try {
      setResending(true);
      setErrorMsg("");
      const res = await API.post("/auth/resend-otp", {
        email: form.email.trim().toLowerCase(),
      });

      if (res.data?.success) {
        setCountdown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setSuccessNotice("A fresh verification code has been sent!");
        digitRefs.current[0]?.focus();
      } else {
        setErrorMsg(res.data?.msg || "Unable to resend verification code.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 2xl:p-16 3xl:p-24 bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 2xl:w-[600px] h-96 2xl:h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 left-1/4 w-96 2xl:w-[600px] h-96 2xl:h-[600px] bg-emerald-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Brand Showcase (Desktop/Large Screens) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-start text-left px-4 2xl:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 mb-5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] 2xl:text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Join SportSync
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Create Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300">
              Athlete Profile.
            </span>
          </h1>

          <p className="mt-4 text-base 2xl:text-lg 3xl:text-xl text-slate-600 dark:text-slate-400 max-w-lg 2xl:max-w-xl leading-relaxed">
            Build your personalized sports passport. Track match statistics, challenge local players, join weekend tournaments, and level up your community presence.
          </p>

          <div className="mt-8 space-y-3.5 w-full max-w-lg 2xl:max-w-xl">
            <div className="flex items-center gap-3 text-xs sm:text-sm 2xl:text-base text-slate-700 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>Verified matchmaking & competitive skill rankings</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm 2xl:text-base text-slate-700 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>Interactive venue maps & nearby open pitch slots</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm 2xl:text-base text-slate-700 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Award className="w-3.5 h-3.5" />
              </div>
              <span>Community leaderboards, MVPs & tournament brackets</span>
            </div>
          </div>
        </div>

        {/* Right Column: Register / OTP Card */}
        <div className="lg:col-span-6 xl:col-span-5 w-full">
          <div className="apple-double-bezel shadow-2xl">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 2xl:p-10 transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 2xl:w-12 2xl:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h2 className="text-xl 2xl:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {step === "otp" ? "Verify Email" : "Get Started"}
                    </h2>
                    <p className="text-xs 2xl:text-sm text-slate-500 dark:text-slate-400">
                      {step === "otp"
                        ? "Enter your 6-digit confirmation code"
                        : "Create your permanent SportSync athlete account"}
                    </p>
                  </div>
                </div>

                {step === "otp" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setErrorMsg("");
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title="Edit athlete details"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Notices */}
              {errorMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs 2xl:text-sm font-medium flex items-start gap-2.5 animate-slide-up">
                  <span className="text-base leading-none">⚠️</span>
                  <span className="flex-1 leading-snug">{errorMsg}</span>
                </div>
              )}

              {successNotice && !errorMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs 2xl:text-sm font-medium flex items-center gap-2.5 animate-slide-up">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="flex-1 leading-snug">{successNotice}</span>
                </div>
              )}

              {/* STEP 1: Registration Form */}
              {step === "form" ? (
                <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Mahansh Gaur"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 2xl:py-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm 2xl:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="yourname@gmail.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 2xl:py-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm 2xl:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="reg-password"
                        className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400"
                      >
                        Password
                      </label>
                      {form.password && (
                        <span className={`text-[11px] 2xl:text-xs font-semibold ${strength.text}`}>
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Min 8 characters & number"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        className="w-full pl-10 pr-10 py-3 2xl:py-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm 2xl:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="reg-confirm"
                      className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-confirm"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 2xl:py-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm 2xl:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] mt-4 py-3.5 px-4 rounded-xl font-semibold text-sm 2xl:text-base text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Verification Code...</span>
                      </div>
                    ) : (
                      <>
                        <span>Verify Email with Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STEP 2: 6-Digit OTP Verification View */
                <div className="mt-6 space-y-6 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Code sent to
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 font-mono">
                      {form.email}
                    </p>
                  </div>

                  {/* 6 Digit Input Boxes */}
                  <div>
                    <label className="block text-center text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-3">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (digitRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-11 sm:w-12 h-14 sm:h-15 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all select-none"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Verify Action Button */}
                  <button
                    type="button"
                    onClick={() => executeVerify()}
                    disabled={loading || otpDigits.some((d) => !d)}
                    className="w-full min-h-[48px] py-3.5 px-4 rounded-xl font-semibold text-sm 2xl:text-base text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Account...</span>
                      </div>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Confirm & Complete Profile</span>
                      </>
                    )}
                  </button>

                  {/* Resend Code & Back actions */}
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setErrorMsg("");
                      }}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      ← Change email
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0 || resending}
                      className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 disabled:opacity-40 hover:underline"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                      <span>{countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] 2xl:text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero spam guarantee • 100% Secure authentication</span>
              </div>

              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 text-center">
                <p className="text-xs sm:text-sm 2xl:text-base text-slate-500 dark:text-slate-400">
                  Already have an account?{" "}
                  <Link
                    to="/"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
