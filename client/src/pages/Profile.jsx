import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function ReliabilityBadge({ score }) {
  const s = score ?? 75;
  const color = s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";
  const bg = s >= 80 ? "rgba(34,197,94,0.1)" : s >= 60 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
  const label = s >= 80 ? "Reliable" : s >= 60 ? "Average" : "Unreliable";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: bg, borderRadius: 12, padding: "10px 14px" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>🎯 Reliability — {label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{s}/100</span>
        </div>
        <div style={{ background: "var(--border)", borderRadius: 4, height: 6 }}>
          <div style={{ width: `${Math.min(s, 100)}%`, height: 6, borderRadius: 4, background: color, transition: "width 0.5s ease" }} />
        </div>
      </div>
    </div>
  );
}

function SportsmanshipBadge({ score, count }) {
  if (!count || count === 0) return (
    <div style={{ background: "var(--bg-primary)", borderRadius: 12, padding: "10px 14px" }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>⭐ Sportsmanship — Not rated yet</p>
    </div>
  );
  const stars = Math.round(score);
  return (
    <div style={{ background: "rgba(245,158,11,0.08)", borderRadius: 12, padding: "10px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>⭐ Sportsmanship</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{count} rating{count > 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
        <div style={{ display: "flex", gap: 2 }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{ fontSize: 18, color: s <= stars ? "#f59e0b" : "var(--border)" }}>★</span>
          ))}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

function EloBadge({ rating }) {
  const r = rating || 1000;
  const tier = r >= 1400 ? { label: "Diamond", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" }
    : r >= 1200 ? { label: "Gold", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" }
    : r >= 1000 ? { label: "Silver", color: "#9ca3af", bg: "rgba(156,163,175,0.1)" }
    : { label: "Bronze", color: "#d97706", bg: "rgba(217,119,6,0.1)" };
  return (
    <div style={{ background: tier.bg, borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>🏅 Skill Rating — {tier.label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: tier.color }}>{r}</span>
    </div>
  );
}

const SPORT_EMOJIS = {
  Cricket: "🏏", Football: "⚽", Basketball: "🏀", Tennis: "🎾",
  Badminton: "🏸", Volleyball: "🏐", Kabaddi: "🤼", Hockey: "🏑",
  "Table Tennis": "🏓", Swimming: "🏊", Athletics: "🏃", Boxing: "🥊"
};

function BadgesSection({ badges, motmCount }) {
  const [activeTab, setActiveTab] = useState("all");

  const universalBadges = (badges || []).filter(b => !b.sport);
  const sportBadgeMap = {};
  (badges || []).filter(b => b.sport).forEach(b => {
    if (!sportBadgeMap[b.sport]) sportBadgeMap[b.sport] = [];
    sportBadgeMap[b.sport].push(b);
  });

  const sportsWithBadges = Object.keys(sportBadgeMap);
  const tabs = ["all", ...sportsWithBadges];

  const displayBadges = activeTab === "all"
    ? (badges || [])
    : (sportBadgeMap[activeTab] || []);

  if ((!badges || badges.length === 0) && !motmCount) return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>
      <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 12 }}>
        Achievements
      </p>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>🏅</p>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No badges yet</p>
        <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
          Play matches and submit stats to earn badges!
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>
          Achievements
        </p>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {badges?.length || 0} badge{badges?.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* MoTM highlight */}
      {motmCount > 0 && (
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>
            🌟 Man of the Match Awards
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>× {motmCount}</span>
        </div>
      )}

      {/* Sport filter tabs */}
      {sportsWithBadges.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: "1px solid var(--border)", cursor: "pointer", whiteSpace: "nowrap",
                background: activeTab === tab ? "var(--accent)" : "var(--bg-primary)",
                color: activeTab === tab ? "white" : "var(--text-secondary)",
                transition: "all 0.15s", flexShrink: 0
              }}
            >
              {tab === "all" ? "🏅 All" : `${SPORT_EMOJIS[tab] || "🏅"} ${tab}`}
            </button>
          ))}
        </div>
      )}

      {/* Badge grid */}
      {displayBadges.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
          No {activeTab !== "all" ? activeTab : ""} badges yet
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
          {displayBadges.map(badge => (
            <div
              key={badge.id}
              title={badge.description}
              style={{
                background: "var(--bg-primary)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "14px 10px", textAlign: "center",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <p style={{ fontSize: 28, marginBottom: 6 }}>{badge.emoji}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                {badge.name}
              </p>
              {badge.sport && (
                <p style={{ fontSize: 10, color: "var(--accent)", marginBottom: 2 }}>
                  {SPORT_EMOJIS[badge.sport] || "🏅"} {badge.sport}
                </p>
              )}
              <p style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {new Date(badge.earnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SportStatsSection({ sportStats }) {
  const [activeSport, setActiveSport] = useState(null);

  if (!sportStats || sportStats.length === 0) return null;

  const selected = sportStats.find(s => s.sport === (activeSport || sportStats[0]?.sport));

  const getStatRows = (s) => {
    if (!s) return [];
    const sport = s.sport.toLowerCase();
    const rows = [
      { label: "Matches Played", value: s.matchesPlayed || 0 },
      { label: "Wins",           value: s.wins || 0 },
      { label: "Losses",         value: s.losses || 0 },
      { label: "MoTM Awards",    value: s.motmCount || 0 }
    ];

    if (sport === "cricket") {
      if (s.totalRuns)       rows.push({ label: "Career Runs",     value: s.totalRuns });
      if (s.totalWickets)    rows.push({ label: "Career Wickets",  value: s.totalWickets });
      if (s.centuries)       rows.push({ label: "Centuries",       value: s.centuries });
      if (s.fifties)         rows.push({ label: "Fifties",         value: s.fifties });
      if (s.fiveWicketHauls) rows.push({ label: "5-Wicket Hauls", value: s.fiveWicketHauls });
    } else if (sport === "football") {
      if (s.totalGoals)   rows.push({ label: "Career Goals",   value: s.totalGoals });
      if (s.totalAssists) rows.push({ label: "Career Assists", value: s.totalAssists });
      if (s.hatTricks)    rows.push({ label: "Hat-tricks",     value: s.hatTricks });
      if (s.cleanSheets)  rows.push({ label: "Clean Sheets",   value: s.cleanSheets });
    } else if (sport === "basketball") {
      if (s.totalPoints)   rows.push({ label: "Career Points",   value: s.totalPoints });
      if (s.totalRebounds) rows.push({ label: "Career Rebounds", value: s.totalRebounds });
      if (s.doubleDoubles) rows.push({ label: "Double Doubles",  value: s.doubleDoubles });
      if (s.threePointers) rows.push({ label: "3-Pointers",      value: s.threePointers });
    } else if (["badminton", "tennis", "table tennis"].includes(sport)) {
      if (s.setsWon)         rows.push({ label: "Sets Won",          value: s.setsWon });
      if (s.straightSetWins) rows.push({ label: "Straight Set Wins", value: s.straightSetWins });
      if (s.comebackWins)    rows.push({ label: "Comeback Wins",     value: s.comebackWins });
    } else if (sport === "volleyball") {
      if (s.totalKills)  rows.push({ label: "Career Kills",  value: s.totalKills });
      if (s.totalAces)   rows.push({ label: "Career Aces",   value: s.totalAces });
      if (s.totalBlocks) rows.push({ label: "Career Blocks", value: s.totalBlocks });
    } else if (sport === "kabaddi") {
      if (s.totalRaids) rows.push({ label: "Career Raids", value: s.totalRaids });
      if (s.superRaids) rows.push({ label: "Super Raids",  value: s.superRaids });
    } else if (sport === "hockey") {
      if (s.totalGoalsHockey) rows.push({ label: "Career Goals",    value: s.totalGoalsHockey });
      if (s.penaltyCorners)   rows.push({ label: "Penalty Corners", value: s.penaltyCorners });
    }

    return rows;
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>
      <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 16 }}>
        Sport Career Stats
      </p>

      {/* Sport selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {sportStats.map(s => {
          const isActive = (activeSport || sportStats[0]?.sport) === s.sport;
          return (
            <button
              key={s.sport}
              onClick={() => setActiveSport(s.sport)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                border: "1px solid var(--border)", cursor: "pointer", whiteSpace: "nowrap",
                background: isActive ? "var(--accent)" : "var(--bg-primary)",
                color: isActive ? "white" : "var(--text-secondary)",
                transition: "all 0.15s", flexShrink: 0
              }}
            >
              {SPORT_EMOJIS[s.sport] || "🏅"} {s.sport}
            </button>
          );
        })}
      </div>

      {/* Stats grid */}
      {selected && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {getStatRows(selected).map(row => (
            <div key={row.label} style={{
              background: "var(--bg-primary)", borderRadius: 12, padding: "12px 14px"
            }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{row.label}</p>
              <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>
                {row.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", sports: "", skillLevel: "" });
  const [friendStatus, setFriendStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const myId = localStorage.getItem("userId");
  const isOwnProfile = !id || id === myId;
  const profileId = id || myId;

  const fetchProfile = useCallback(async () => {
    try {
      const res = isOwnProfile
        ? await API.get("/users/me")
        : await API.get(`/users/${profileId}`);

      setProfile(res.data.user);
      setRecentMatches(res.data.recentMatches || []);
      setForm({
        name: res.data.user.name || "",
        sports: (res.data.user.sports || []).join(", "),
        skillLevel: res.data.user.skillLevel || "Beginner"
      });

      const friendsRes = await API.get("/friends");
      setFriends(friendsRes.data.friends || []);

      if (!isOwnProfile) {
        const isFriend = friendsRes.data.friends.some(
          f => f._id === profileId || f._id?.toString() === profileId
        );
        setFriendStatus(isFriend ? "friends" : "none");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId, isOwnProfile]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    try {
      await API.put("/users/me", {
        name: form.name,
        sports: form.sports.split(",").map(s => s.trim()).filter(Boolean),
        skillLevel: form.skillLevel
      });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.msg || "Update failed");
    }
  };

  const handleAddFriend = async () => {
    try {
      setActionLoading(true);
      const res = await API.post(`/friends/send/${profileId}`);
      alert(res.data.msg);
      setFriendStatus("pending");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm("Remove this friend?")) return;
    try {
      setActionLoading(true);
      await API.delete(`/friends/remove/${profileId}`);
      setFriendStatus("none");
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading...</p>
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--danger)" }}>User not found</p>
    </div>
  );

  const winRate = profile.matchesPlayed > 0
    ? Math.round((profile.wins / profile.matchesPlayed) * 100) : 0;

  const skillColor = {
    Beginner:     { bg: "rgba(34,197,94,0.1)",  color: "var(--success)" },
    Intermediate: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    Advanced:     { bg: "rgba(239,68,68,0.1)",  color: "var(--danger)" }
  }[profile.skillLevel] || { bg: "var(--border)", color: "var(--text-muted)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Profile card ─────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>

            {/* Avatar */}
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 26, fontWeight: 700, flexShrink: 0,
              position: "relative"
            }}>
              {profile.name?.charAt(0).toUpperCase()}
              {(profile.motmCount || 0) > 0 && (
                <span style={{ position: "absolute", top: -8, right: -4, fontSize: 18, lineHeight: 1 }}>
                  🌟
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{
                    fontSize: 20, fontWeight: 700, border: "1px solid var(--border)",
                    borderRadius: 8, padding: "4px 10px", background: "var(--bg-primary)",
                    color: "var(--text-primary)", width: "100%", boxSizing: "border-box"
                  }}
                />
              ) : (
                <h1 style={{
                  fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 22,
                  color: "var(--text-primary)", marginBottom: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {profile.name}
                </h1>
              )}

              <p style={{ color: "var(--text-muted)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.email}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {editing ? (
                  <select
                    value={form.skillLevel}
                    onChange={e => setForm({ ...form, skillLevel: e.target.value })}
                    style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13 }}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: skillColor.bg, color: skillColor.color }}>
                    {profile.skillLevel}
                  </span>
                )}

                {!isOwnProfile && (
                  friendStatus === "friends" ? (
                    <button onClick={handleRemoveFriend} disabled={actionLoading} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
                      Remove Friend
                    </button>
                  ) : (
                    <button onClick={handleAddFriend} disabled={actionLoading || friendStatus === "pending"} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: friendStatus === "pending" ? "var(--border)" : "var(--accent)", color: friendStatus === "pending" ? "var(--text-muted)" : "white", border: "none", cursor: friendStatus === "pending" ? "not-allowed" : "pointer" }}>
                      {actionLoading ? "..." : friendStatus === "pending" ? "Request Sent" : "+ Add Friend"}
                    </button>
                  )
                )}

                {!isOwnProfile && friendStatus === "friends" && (
                  <button onClick={() => navigate(`/dm/${profileId}`)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, background: "rgba(59,130,246,0.08)", color: "var(--accent)", border: "1px solid rgba(59,130,246,0.2)", cursor: "pointer" }}>
                    Message
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sports */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Sports
            </p>
            {editing ? (
              <input
                value={form.sports}
                placeholder="Cricket, Football, Basketball"
                onChange={e => setForm({ ...form, sports: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(profile.sports || []).length === 0 ? (
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No sports added yet</span>
                ) : profile.sports.map(s => (
                  <span key={s} style={{ fontSize: 13, padding: "4px 12px", borderRadius: 20, background: "rgba(59,130,246,0.08)", color: "var(--accent)", fontWeight: 500 }}>
                    {SPORT_EMOJIS[s] || ""} {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isOwnProfile && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {editing ? (
                <>
                  <button onClick={handleSave} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--accent)", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
                  <button onClick={() => setEditing(false)} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)", fontSize: 13, cursor: "pointer" }}>Edit Profile</button>
                  <button onClick={() => navigate("/friends")} style={{ padding: "8px 18px", borderRadius: 10, background: "rgba(59,130,246,0.08)", color: "var(--accent)", border: "1px solid rgba(59,130,246,0.2)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Friends ({friends.length})</button>
                  <button onClick={() => navigate("/select-sports")} style={{ padding: "8px 18px", borderRadius: 10, background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)", fontSize: 13, cursor: "pointer" }}>Change Sports</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Ratings card ─────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 14 }}>Ratings</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <EloBadge rating={profile.rating} />
            <ReliabilityBadge score={profile.reliabilityScore} />
            <SportsmanshipBadge score={profile.sportsmanshipScore || 0} count={profile.sportsmanshipCount || 0} />
          </div>
        </div>

        {/* ── Overall Stats card ───────────────────────── */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 16 }}>Overall Stats</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Played",   value: profile.matchesPlayed || 0, color: "var(--text-primary)" },
              { label: "Wins",     value: profile.wins || 0,          color: "var(--success)" },
              { label: "Losses",   value: profile.losses || 0,        color: "var(--danger)" },
              { label: "Win Rate", value: `${winRate}%`,              color: winRate >= 50 ? "var(--success)" : "var(--danger)" }
            ].map(stat => (
              <div key={stat.label} style={{ background: "var(--bg-primary)", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 22, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{stat.label}</p>
              </div>
            ))}
          </div>
          {profile.matchesPlayed > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                <span>Win rate</span><span>{winRate}%</span>
              </div>
              <div style={{ background: "var(--border)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${winRate}%`, height: "100%", background: winRate >= 50 ? "var(--success)" : "var(--danger)", borderRadius: 4, transition: "width 0.5s ease" }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Sport Career Stats ───────────────────────── */}
        <SportStatsSection sportStats={profile.sportStats} />

        {/* ── Achievements / Badges ────────────────────── */}
        <BadgesSection badges={profile.badges} motmCount={profile.motmCount} />

        {/* ── Recent Matches ───────────────────────────── */}
        {recentMatches.length > 0 && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 16 }}>Recent Matches</p>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentMatches.map(m => {
                const playerEntry = m.players?.find(p => (p.user?._id?.toString() || p.user?.toString()) === profile._id.toString());
                const userTeam = playerEntry?.team;
                const won = userTeam === m.winnerTeam;
                return (
                  <li
                    key={m._id}
                    onClick={() => navigate(`/match/${m._id}`)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: 14, cursor: "pointer",
                      background: "var(--bg-primary)", border: "1px solid var(--border)",
                      transition: "all 0.15s", gap: 12
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                        {SPORT_EMOJIS[m.sport] || "🏅"} {m.sport}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.location?.name} · {new Date(m.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Team {userTeam}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: won ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: won ? "var(--success)" : "var(--danger)" }}>
                        {won ? "Won" : "Lost"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

export default Profile;