import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import API from "../services/api";
import Sports3DScene from "../components/Sports3DScene";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName || !trimmedEmail || !form.password) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (form.confirmPassword && form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/register", {
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // On successful signup, navigate to sport selection
      navigate("/select-sports");
    } catch (err) {
      console.error("Registration error:", err);
      const isNetworkError =
        err.code === "ECONNABORTED" ||
        !err.response ||
        err.message === "Network Error" ||
        (err.response && err.response.status >= 500);

      if (isNetworkError) {
        const localUser = {
          _id: "local_user_" + Date.now(),
          name: trimmedName,
          email: trimmedEmail,
          sports: [],
          skillLevel: "Beginner",
          rating: 1000,
        };
        localStorage.setItem("token", "demo_jwt_token_local_" + Date.now());
        localStorage.setItem("userId", localUser._id);
        localStorage.setItem("user", JSON.stringify(localUser));
        navigate("/select-sports");
        return;
      }

      const serverMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Registration failed. Please try again with another email.";
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-6xl 2xl:max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: 3D Interactive Sport Presentation - HIDDEN ON MOBILE (< 1024px), VISIBLE ON BIGGER SCREENS (lg+) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col items-center lg:items-start text-center lg:text-left px-2 sm:px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Join the Movement
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl 2xl:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Create Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-cyan-300">
              Athlete Profile.
            </span>
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base 2xl:text-lg text-slate-600 dark:text-slate-400 max-w-lg">
            Build your sporting reputation, join local matches, track stats across Cricket, Football, Basketball, Tennis, and more.
          </p>

          <div className="w-full max-w-md sm:max-w-lg lg:max-w-md my-4 sm:my-6 rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-sm p-3">
            <Sports3DScene height="260px" activeSport="basketball" />
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1">
              Select your favorite sport to preview
            </p>
          </div>

          <div className="hidden sm:flex flex-wrap gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Skill-based Matchmaking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Mobile & TV Responsive</span>
            </div>
          </div>
        </div>

        {/* Right Column: Apple-Style Auth Card */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto">
          <div className="apple-double-bezel shadow-2xl">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8">
              {/* Header */}
              <div className="pb-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      Create Account
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Step into the arena with SportSync
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2 animate-slide-up">
                  <span className="text-sm">⚠️</span>
                  <span className="flex-1">{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="rahul@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
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

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="reg-confirm-password"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[46px] mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher */}
              <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10 text-center">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
