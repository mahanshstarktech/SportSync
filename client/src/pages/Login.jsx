import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import API from "../services/api";
import Sports3DScene from "../components/Sports3DScene";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail || !form.password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/login", {
        email: trimmedEmail,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);

      const userSports = res.data.user.sports || [];
      const alreadySelected =
        localStorage.getItem("sportsSelected") === "true" || userSports.length > 0;

      if (!alreadySelected) {
        navigate("/select-sports");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failure:", err);
      const serverMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        (err.code === "ECONNABORTED"
          ? "Request timed out. Please verify backend service."
          : "Login failed. Please verify your credentials and connection.");
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setForm({
      email: "alex.hunter@example.com",
      password: "password123",
    });
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-6xl 2xl:max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: 3D Interactive Sport Presentation */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left px-2 sm:px-4">
          {/* Apple Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Next-Gen Sports Hub
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Match. Play. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-cyan-300">
              Elevate Your Game.
            </span>
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base 2xl:text-lg text-slate-600 dark:text-slate-400 max-w-lg">
            Connect with local players, discover sports pitches, organize tournaments, and record stats with effortless precision.
          </p>

          {/* Interactive 3D Sphere */}
          <div className="w-full max-w-md sm:max-w-lg lg:max-w-md my-4 sm:my-6 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-sm p-3">
            <Sports3DScene height="260px" activeSport="football" />
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1">
              Drag or touch the 3D ball to rotate • Tap sports below to change
            </p>
          </div>

          {/* Highlights */}
          <div className="hidden sm:flex flex-wrap gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Real-time Chat & Matchmaking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Verified Match Ratings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Cloudflare & Render Hosted</span>
            </div>
          </div>
        </div>

        {/* Right Column: Apple-Style Auth Card */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto">
          {/* Double-Bezel Enclosure */}
          <div className="apple-double-bezel shadow-2xl">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      SportSync
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sign in to your athlete profile
                    </p>
                  </div>
                </div>

                {/* Demo Button */}
                <button
                  type="button"
                  onClick={handleDemoFill}
                  title="Auto-fill demo test credentials"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Fill</span>
                </button>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2 animate-slide-up">
                  <span className="text-sm">⚠️</span>
                  <span className="flex-1">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="alex.hunter@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[46px] mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to SportSync</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher */}
              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 text-center">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  New to SportSync?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Create an account
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
