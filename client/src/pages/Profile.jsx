import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  User,
  MapPin,
  Trophy,
  Medal,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Activity,
  UserPlus,
  UserCheck,
  RefreshCw,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import API from "../services/api";

const SPORT_EMOJIS = {
  Cricket: "🏏",
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Badminton: "🏸",
  Volleyball: "🏐",
  Kabaddi: "🤼",
  Hockey: "🏑",
  "Table Tennis": "🏓",
  Swimming: "🏊",
  Athletics: "🏃",
  Boxing: "🥊",
};

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", sports: "", skillLevel: "Beginner", location: "", bio: "" });
  const [friendStatus, setFriendStatus] = useState("none");
  const [actionLoading, setActionLoading] = useState(false);

  const myId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const isOwnProfile = !id || id === myId;
  const targetId = id || myId;

  const fetchProfile = useCallback(async () => {
    if (!token) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      // Fetch user profile
      const res = isOwnProfile
        ? await API.get("/users/me")
        : await API.get(`/users/${targetId}`);

      const userData = res.data?.user;
      if (!userData) {
        throw new Error("Athlete profile not found");
      }

      setProfile(userData);
      setRecentMatches(res.data?.recentMatches || []);
      setForm({
        name: userData.name || "",
        sports: (userData.sports || []).join(", "),
        skillLevel: userData.skillLevel || "Beginner",
        location: userData.location || "",
        bio: userData.bio || "",
      });

      // Fetch friends for connection status
      try {
        const friendsRes = await API.get("/friends");
        const friendList = friendsRes.data?.friends || [];

        if (!isOwnProfile && targetId) {
          const isFriend = friendList.some(
            (f) => f._id === targetId || f._id?.toString() === targetId
          );
          setFriendStatus(isFriend ? "friends" : "none");
        }
      } catch {
        // Friends fetch is non-blocking
      }
    } catch (err) {
      console.error("[Profile Fetch Error]:", err);
      const serverMsg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        (err.response?.status === 404
          ? "Athlete not found."
          : "Unable to load athlete profile. Please verify your connection or sign in again.");
      setErrorMsg(serverMsg);
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, targetId, token, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const sportsArray = form.sports
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await API.put("/users/me", {
        name: form.name.trim(),
        sports: sportsArray,
        skillLevel: form.skillLevel,
        location: form.location.trim(),
        bio: form.bio.trim(),
      });

      if (res.data?.user) {
        setProfile(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      setEditing(false);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update profile.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFriend = async () => {
    try {
      setActionLoading(true);
      const res = await API.post(`/friends/send/${targetId}`);
      alert(res.data?.msg || "Friend request sent!");
      setFriendStatus("pending");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to send friend request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("sportsSelected");
    navigate("/");
  };

  // Loading State with Apple Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center p-4">
        <div className="apple-double-bezel w-full max-w-xl mx-auto shadow-2xl">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mx-auto flex items-center justify-center text-blue-600 animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Loading Athlete Profile...
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Retrieving verified stats, match history, and achievements
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State with Apple Card
  if (errorMsg || !profile) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center p-4">
        <div className="apple-double-bezel w-full max-w-lg mx-auto shadow-2xl">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center text-red-500 mb-4">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Profile Unavailable
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              {errorMsg || "We were unable to locate this athlete's records."}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={fetchProfile}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry</span>
              </button>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-medium text-xs sm:text-sm border border-black/5 dark:border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Win Rate & Stats Calculations
  const matchesPlayed = profile.matchesPlayed || 0;
  const wins = profile.wins || 0;
  const losses = profile.losses || 0;
  const rating = profile.rating || 1000;
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  const getTier = (r) => {
    if (r >= 1400) return { label: "Diamond Elite", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    if (r >= 1200) return { label: "Gold Master", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    if (r >= 1000) return { label: "Silver Challenger", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
    return { label: "Bronze Contender", color: "text-amber-700", bg: "bg-amber-700/10", border: "border-amber-700/20" };
  };

  const tier = getTier(rating);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 sm:px-6 lg:px-10 2xl:px-16 3xl:px-24 py-8 sm:py-12 transition-colors">
      <div className="max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs 2xl:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {isOwnProfile && (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Apple Main Profile Card */}
        <div className="apple-double-bezel shadow-2xl">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 2xl:p-10">
            {/* Top Row: Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-black/5 dark:border-white/10">
              {/* Avatar with Gradient Halo */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 2xl:w-32 2xl:h-32 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white text-3xl sm:text-4xl 2xl:text-5xl font-black shadow-xl shadow-blue-500/25">
                  {profile.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-white dark:bg-black shadow-md border border-black/5 dark:border-white/10">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Info & Action Controls */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {profile.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {profile.email}
                    </p>
                  </div>

                  {/* Actions: Edit (Self) or Add Friend (Peer) */}
                  <div>
                    {isOwnProfile ? (
                      <button
                        type="button"
                        onClick={() => setEditing(!editing)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/60 transition-all active:scale-95"
                      >
                        {editing ? <X className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                        <span>{editing ? "Cancel Editing" : "Edit Profile"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAddFriend}
                        disabled={actionLoading || friendStatus === "friends"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                      >
                        {friendStatus === "friends" ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Connected Friend</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Friend</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Location & Skill Tier Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${tier.bg} ${tier.border} ${tier.color} border`}>
                    <Medal className="w-3.5 h-3.5" />
                    <span>{tier.label} ({rating})</span>
                  </div>

                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{profile.skillLevel || "Beginner"}</span>
                  </div>

                  {profile.location && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>

                {/* Bio text */}
                {profile.bio && !editing && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-2 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Inline Profile Edit Form */}
            {editing && (
              <form onSubmit={handleSave} className="py-6 border-b border-black/5 dark:border-white/10 space-y-4 animate-slide-up">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Update Athlete Credentials
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Skill Level
                    </label>
                    <select
                      value={form.skillLevel}
                      onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. London, UK or Mumbai, India"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Sports (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="Football, Tennis, Basketball"
                      value={form.sports}
                      onChange={(e) => setForm({ ...form, sports: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Athlete Bio
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief note about your playing style, frequency, preferred positions..."
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* Performance Stats Bento Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-black/5 dark:border-white/10">
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-center">
                <p className="text-[11px] 2xl:text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Matches Played
                </p>
                <p className="mt-1 text-2xl 2xl:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {matchesPlayed}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-center">
                <p className="text-[11px] 2xl:text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Wins
                </p>
                <p className="mt-1 text-2xl 2xl:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {wins}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-center">
                <p className="text-[11px] 2xl:text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Losses
                </p>
                <p className="mt-1 text-2xl 2xl:text-3xl font-extrabold text-slate-500 dark:text-slate-400">
                  {losses}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-center">
                <p className="text-[11px] 2xl:text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Win Rate
                </p>
                <p className="mt-1 text-2xl 2xl:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                  {winRate}%
                </p>
              </div>
            </div>

            {/* Active Sports & Passion Badges */}
            <div className="py-6 border-b border-black/5 dark:border-white/10">
              <h2 className="text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Active Sports & Disciplines
              </h2>

              <div className="flex flex-wrap gap-2.5">
                {(profile.sports && profile.sports.length > 0) ? (
                  profile.sports.map((sport) => (
                    <div
                      key={sport}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs 2xl:text-sm font-semibold"
                    >
                      <span>{SPORT_EMOJIS[sport] || "🏅"}</span>
                      <span>{sport}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No sports selected yet. Click Edit Profile or visit onboarding.
                  </p>
                )}
              </div>
            </div>

            {/* Recent Match Participation */}
            <div className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recent Match Records
                </h2>
                <Link
                  to="/dashboard"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Explore Games</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentMatches.length === 0 ? (
                <div className="p-6 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] text-center space-y-2 border border-black/5 dark:border-white/10">
                  <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No completed match records yet.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Join or create a match from Dashboard to build your athlete passport!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMatches.map((m) => (
                    <Link
                      key={m._id}
                      to={`/match/${m._id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.07] border border-black/5 dark:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{SPORT_EMOJIS[m.sport] || "🏅"}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {m.title || `${m.sport} Match`}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{m.location || "Local Arena"}</span>
                            <span>•</span>
                            <span>{m.status}</span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
