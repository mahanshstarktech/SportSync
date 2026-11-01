import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Zap, Activity } from "lucide-react";
import API from "../services/api";

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
      setErrorMsg("Please provide both your registered email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/login", {
        email: trimmedEmail,
        password: form.password,
      });

      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user._id);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const userSports = res.data.user.sports || [];
        const hasSports =
          localStorage.getItem("sportsSelected") === "true" || userSports.length > 0;

        if (!hasSports) {
          navigate("/select-sports");
        } else {
          navigate("/dashboard");
        }
      } else {
        setErrorMsg("Authentication succeeded, but invalid server payload received.");
      }
    } catch (err) {
      console.error("[Login Request Failed]:", err);
      if (err.code === "ECONNABORTED" || !err.response) {
        setErrorMsg(
          "Server connection timed out or unreachable. If hosting on free tier, please allow ~30s for server startup."
        );
      } else {
        const msg =
          err.response?.data?.msg ||
          err.response?.data?.message ||
          "Invalid email or password. Please try again.";
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 2xl:p-16 3xl:p-24 bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 2xl:w-[600px] h-96 2xl:h-[600px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 right-1/4 w-96 2xl:w-[600px] h-96 2xl:h-[600px] bg-sky-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Apple Brand Showcase (Desktop/Large Screens) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-start text-left px-4 2xl:px-8">
          <h1 className="text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Match. Play. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300">
              Elevate Your Game.
            </span>
          </h1>

          <p className="mt-4 text-base 2xl:text-lg 3xl:text-xl text-slate-600 dark:text-slate-400 max-w-lg 2xl:max-w-xl leading-relaxed">
            The modern sports matchmaking platform designed for athletes. Discover nearby turf pitches, create tournaments, coordinate live games, and track performance.
          </p>

          {/* Feature Highlights Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg 2xl:max-w-xl">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs 2xl:text-sm font-semibold text-slate-900 dark:text-white">Real-Time Sync</h2>
                <p className="text-[11px] 2xl:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Instant match updates and peer-to-peer player invites.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs 2xl:text-sm font-semibold text-slate-900 dark:text-white">Dynamic Ratings</h2>
                <p className="text-[11px] 2xl:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fair play rating algorithm and skill level tracking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Apple-Style Auth Card */}
        <div className="lg:col-span-6 xl:col-span-5 w-full">
          <div className="apple-double-bezel shadow-2xl">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 2xl:p-10">
              {/* Header */}
              <div className="flex items-center gap-3 pb-5 border-b border-black/5 dark:border-white/10">
                <div className="w-11 h-11 2xl:w-12 2xl:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h2 className="text-xl 2xl:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    SportSync
                  </h2>
                  <p className="text-xs 2xl:text-sm text-slate-500 dark:text-slate-400">
                    Sign in to your athlete profile
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs 2xl:text-sm font-medium flex items-start gap-2.5 animate-slide-up">
                  <span className="text-base leading-none">⚠️</span>
                  <span className="flex-1 leading-snug">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="athlete@example.com"
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
                      htmlFor="login-password"
                      className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400"
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] mt-3 py-3.5 px-4 rounded-xl font-semibold text-sm 2xl:text-base text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

              {/* Security Badge */}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] 2xl:text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted with SHA-256 & JWT Authentication</span>
              </div>

              {/* Bottom Switcher */}
              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 text-center">
                <p className="text-xs sm:text-sm 2xl:text-base text-slate-500 dark:text-slate-400">
                  New athlete?{" "}
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
