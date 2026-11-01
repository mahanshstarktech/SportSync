import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Plus, MapPin, Sparkles, Navigation, Trophy, Users, Flame } from "lucide-react";

const sportEmoji = {
  cricket: "🏏",
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  badminton: "🏸",
  volleyball: "🏐",
  hockey: "🏑",
  kabaddi: "🤼",
  "table tennis": "🏓",
  swimming: "🏊",
  athletics: "🏃",
  boxing: "🥊",
};

const getSportEmoji = (sport) => {
  if (!sport) return "🏅";
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(sportEmoji)) {
    if (key.includes(k)) return v;
  }
  return "🏅";
};

const SPORTS = [
  "All",
  "Cricket",
  "Football",
  "Basketball",
  "Tennis",
  "Badminton",
  "Volleyball",
  "Kabaddi",
  "Hockey",
  "Table Tennis",
  "Swimming",
  "Athletics",
  "Boxing",
];

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "16px 20px",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 4 }}>
        {label}
      </p>
      <p
        style={{
          color: color || "var(--text-primary)",
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function MatchCard({ match, userId, onJoin, onLeave }) {
  const navigate = useNavigate();
  const players = match.players || [];
  const approvedCount = players.filter((p) => p.status === "approved").length;
  const isJoined = players.some((p) => (p.user?._id || p.user) === userId);
  const isFull = approvedCount >= match.maxPlayers;
  const isCompleted = match.status === "completed";
  const fillPercent = Math.round((approvedCount / match.maxPlayers) * 100);

  return (
    <div
      onClick={() => navigate(`/match/${match._id}`)}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: 20,
        cursor: "pointer",
        boxShadow: "var(--card-shadow)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "var(--card-shadow-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "var(--card-shadow)")
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(59,130,246,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {getSportEmoji(match.sport)}
          </div>
          <div>
            <h3
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--text-primary)",
              }}
            >
              {match.sport}
            </h3>
            <p
              style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}
            >
              {match.location?.name || "N/A"}
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            flexShrink: 0,
            background: isCompleted
              ? "rgba(239,68,68,0.1)"
              : isFull
                ? "rgba(245,158,11,0.1)"
                : "rgba(34,197,94,0.1)",
            color: isCompleted ? "#ef4444" : isFull ? "#f59e0b" : "#22c55e",
          }}
        >
          {isCompleted ? "Completed" : isFull ? "Full" : "Open"}
        </span>
      </div>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 13,
          marginBottom: 12,
        }}
      >
        📅{" "}
        {new Date(match.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Players
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {approvedCount}/{match.maxPlayers}
          </span>
        </div>
        <div
          style={{ background: "var(--border)", borderRadius: 4, height: 6 }}
        >
          <div
            style={{
              width: `${fillPercent}%`,
              height: 6,
              borderRadius: 4,
              background: fillPercent >= 100 ? "#f59e0b" : "var(--accent)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {match.distance && (
        <p style={{ fontSize: 12, color: "var(--accent)", marginBottom: 10 }}>
          📍 {(match.distance / 1000).toFixed(1)} km away
        </p>
      )}

      {match._friendsPlaying && match._friendsPlaying.length > 0 && (
        <p
          style={{
            fontSize: 12,
            color: "#f59e0b",
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          👥 {match._friendsPlaying.join(", ")} playing this match
        </p>
      )}

      {!isCompleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            isJoined ? onLeave(match._id) : !isFull && onJoin(match._id);
          }}
          disabled={!isJoined && isFull}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: isJoined || !isFull ? "pointer" : "not-allowed",
            border: "none",
            transition: "all 0.15s",
            background: isJoined
              ? "rgba(239,68,68,0.1)"
              : isFull
                ? "var(--border)"
                : "var(--accent)",
            color: isJoined
              ? "#ef4444"
              : isFull
                ? "var(--text-muted)"
                : "white",
          }}
        >
          {isJoined ? "Leave" : isFull ? "Match Full" : "Join Match"}
        </button>
      )}
    </div>
  );
}

// ✅ Player Search Component
function PlayerSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState({});

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const [searchRes, friendsRes] = await Promise.all([
          API.get(`/users/search?q=${encodeURIComponent(query.trim())}`),
          API.get("/friends"),
        ]);

        setResults(searchRes.data.users || []);
        setSearched(true);

        // Build friend status map
        const friends = friendsRes.data.friends || [];
        const statusMap = {};
        friends.forEach((f) => {
          statusMap[f._id] = "friends";
        });
        setFriendStatuses(statusMap);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleAddFriend = async (e, userId) => {
    e.stopPropagation();
    try {
      const res = await API.post(`/friends/send/${userId}`);
      alert(res.data.msg);
      setFriendStatuses((prev) => ({ ...prev, [userId]: "pending" }));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to send request");
    }
  };

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 16,
            pointerEvents: "none",
          }}
        >
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players by name..."
          style={{
            width: "100%",
            padding: "12px 16px 12px 42px",
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            boxShadow: "var(--card-shadow)",
            transition: "border 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        {searching && (
          <span
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            Searching...
          </span>
        )}
        {query && !searching && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setSearched(false);
            }}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "var(--text-muted)",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div
          style={{
            marginTop: 8,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {results.map((user, i) => {
            const status = friendStatuses[user._id];
            const winRate =
              user.matchesPlayed > 0
                ? Math.round((user.wins / user.matchesPlayed) * 100)
                : 0;

            return (
              <div
                key={user._id}
                onClick={() => navigate(`/profile/${user._id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom:
                    i < results.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      "linear-gradient(135deg, var(--accent), #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: 17,
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      fontSize: 14,
                    }}
                  >
                    {user.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {user.skillLevel}
                    </span>
                    {(user.sports || []).slice(0, 2).map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 11,
                          padding: "1px 7px",
                          borderRadius: 10,
                          background: "rgba(59,130,246,0.08)",
                          color: "var(--accent)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {user.matchesPlayed > 0 && (
                      <span
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        {winRate}% win rate
                      </span>
                    )}
                  </div>
                </div>

                {/* Action button */}
                {status === "friends" ? (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "rgba(34,197,94,0.1)",
                      color: "var(--success)",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    Friends ✓
                  </span>
                ) : status === "pending" ? (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "rgba(59,130,246,0.1)",
                      color: "var(--accent)",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    Sent
                  </span>
                ) : (
                  <button
                    onClick={(e) => handleAddFriend(e, user._id)}
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "var(--accent)",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {searched &&
        results.length === 0 &&
        query.trim().length >= 2 &&
        !searching && (
          <div
            style={{
              marginTop: 8,
              padding: "16px",
              textAlign: "center",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              boxShadow: "var(--card-shadow)",
            }}
          >
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              No players found for "{query}"
            </p>
          </div>
        )}
    </div>
  );
}

function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedSport, setSelectedSport] = useState(
    () => localStorage.getItem("activeSport") || "All",
  );
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchMatches();
    fetchFriends();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await API.get("/matches");
      setMatches(res.data.matches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await API.get("/friends");
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getNearbyMatches = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude: lat, longitude: lng } = position.coords;
          const res = await API.get(
            `/matches/nearby/search?lat=${lat}&lng=${lng}&distance=10`,
          );
          setMatches(res.data.matches);
          setFilter("all");
        } catch {
          alert("Error fetching nearby matches");
        }
      },
      () => alert("Location permission denied"),
    );
  };

  const joinMatch = async (id) => {
    try {
      await API.post(`/matches/${id}/join`);
      fetchMatches();
    } catch (err) {
      alert(err.response?.data?.msg || "Join failed");
    }
  };

  const leaveMatch = async (id) => {
    try {
      await API.post(`/matches/${id}/leave`);
      fetchMatches();
    } catch (err) {
      alert(err.response?.data?.msg || "Leave failed");
    }
  };

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    localStorage.setItem("activeSport", sport);
  };

  const friendIds = new Set(friends.map((f) => f._id?.toString()));

  const matchesWithFriendInfo = matches.map((m) => {
    const friendsPlaying = (m.players || [])
      .filter((p) => {
        const pid = p.user?._id?.toString() || p.user?.toString();
        return pid && friendIds.has(pid) && p.status === "approved";
      })
      .map((p) => p.user?.name || "Friend");
    return { ...m, _friendsPlaying: friendsPlaying };
  });

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const activeMatches = matchesWithFriendInfo.filter((m) => {
    const matchTime = new Date(m.date);
    const hideAfter = new Date(matchTime.getTime() + 6 * 60 * 60 * 1000);
    return now < hideAfter && m.status !== "completed";
  });

  const completedMatches = matchesWithFriendInfo.filter((m) => {
    if (m.status !== "completed") return false;
    const completedTime = new Date(m.updatedAt || m.date);
    return completedTime > oneDayAgo;
  });

  const totalMatches = matchesWithFriendInfo.length;

  const myMatches = matchesWithFriendInfo.filter((m) =>
    m.players?.some(
      (p) => (p.user?._id?.toString() || p.user?.toString()) === userId,
    ),
  );

  const openMatches = activeMatches.filter((m) => {
    const approvedCount =
      m.players?.filter((p) => p.status === "approved").length || 0;

    return approvedCount < m.maxPlayers && m.status !== "completed";
  });

  const friendsMatches = activeMatches.filter((m) =>
    m.players?.some((p) => {
      const pid = p.user?._id?.toString() || p.user?.toString();

      return pid && friendIds.has(pid) && p.status === "approved";
    }),
  );
  const filtered = (() => {
    if (filter === "completed") {
      return completedMatches.filter(
        (m) =>
          selectedSport === "All" ||
          m.sport?.toLowerCase() === selectedSport.toLowerCase(),
      );
    }
    let base = activeMatches;
    if (filter === "friends") base = friendsMatches;
    else if (filter === "open") base = openMatches;
    else if (filter === "joined") base = myMatches;

    return base.filter(
      (m) =>
        selectedSport === "All" ||
        m.sport?.toLowerCase() === selectedSport.toLowerCase(),
    );
  })();

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-3 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-8 transition-colors">
      <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto space-y-6">
        
        {/* Apple 3D Hero Island */}
        <div className="apple-double-bezel shadow-lg">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider w-fit mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Arena Active</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                Find Your Match. Play Today.
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl">
                Explore local sports venues, challenge rivals, or schedule a game with friends across all popular sports.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link
                  to="/create-match"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Match</span>
                </Link>
                <Link
                  to="/map"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-medium text-sm border border-black/5 dark:border-white/10 active:scale-95 transition-all"
                >
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Venue Map</span>
                </Link>
                <button
                  type="button"
                  onClick={getNearbyMatches}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-medium text-sm border border-black/5 dark:border-white/10 active:scale-95 transition-all"
                >
                  <Navigation className="w-4 h-4 text-emerald-500" />
                  <span>Nearby Matches</span>
                </button>
              </div>
            </div>

            {/* Apple Activity Pill Card on the Right */}
            <div className="hidden lg:flex lg:col-span-4 justify-center items-center">
              <div className="w-full max-w-[280px] p-5 rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Community Pulse
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{matches.length}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live Matches</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{friends.length}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Friends</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Active Sport</span>
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {selectedSport}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Upcoming Matches
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time games and pitch bookings available in your community
            </p>
          </div>
        </div>

        {/* ✅ Player Search */}
        <PlayerSearch />

        {/* Stats — 2 cols on mobile, 4 on desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
          className="md:grid-cols-4"
        >
          <StatCard label="Total Matches" value={totalMatches} />{" "}
          <StatCard
            label="Open Matches"
            value={openMatches.length}
            color="var(--success)"
          />
          <StatCard
            label="My Matches"
            value={myMatches.length}
            color="var(--accent)"
          />
          <StatCard
            label="Friends Playing"
            value={friendsMatches.length}
            color="#f59e0b"
          />
        </div>

        {/* Sport pills — horizontally scrollable */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {SPORTS.map((sport) => (
            <button
              key={sport}
              onClick={() => handleSportChange(sport)}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                border: "1px solid var(--border)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                background:
                  selectedSport === sport
                    ? "var(--text-primary)"
                    : "var(--bg-card)",
                color:
                  selectedSport === sport
                    ? "var(--bg-primary)"
                    : "var(--text-secondary)",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {sport === "All" ? "🏅 All" : sport}
            </button>
          ))}
        </div>

        {/* Filter tabs — horizontally scrollable */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {[
            { key: "all", label: "All" },
            { key: "open", label: "Open" },
            { key: "joined", label: "My Matches" },
            { key: "friends", label: `👥 Friends (${friendsMatches.length})` },
            { key: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "7px 18px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                border: "1px solid var(--border)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                background:
                  filter === tab.key ? "var(--accent)" : "var(--bg-card)",
                color: filter === tab.key ? "white" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchMatches}
            style={{
              padding: "7px 18px",
              borderRadius: 10,
              fontSize: 14,
              border: "1px solid var(--border)",
              cursor: "pointer",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
            }}
          >
            ↺ Refresh
          </button>
        </div>

        {/* Match grid — 1 col mobile, 2 tablet, 3 desktop */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <p style={{ color: "var(--text-muted)" }}>Loading matches...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "80px 0",
            }}
          >
            <p style={{ fontSize: 48 }}>🏅</p>
            <p
              style={{
                color: "var(--text-muted)",
                marginTop: 12,
                fontSize: 16,
              }}
            >
              {filter === "friends"
                ? "No friends are playing any matches yet"
                : "No matches found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-4 sm:gap-6">
            {filtered.map((m) => (
              <MatchCard
                key={m._id}
                match={m}
                userId={userId}
                onJoin={joinMatch}
                onLeave={leaveMatch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
