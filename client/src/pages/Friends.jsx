import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Friends() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("friends");
  const userId = localStorage.getItem("userId");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const [reqRes, friendsRes] = await Promise.all([
        API.get("/friends/requests"),
        API.get("/friends"),
      ]);
      setRequests(reqRes.data.requests || []);
      setFriends(friendsRes.data.friends || []);
      if (friendsRes.data.friends?.length > 0)
        fetchStreaks(friendsRes.data.friends);

      // Build friend status map for search
      const statusMap = {};
      (friendsRes.data.friends || []).forEach(f => {
        statusMap[f._id] = "friends";
      });
      setFriendStatuses(statusMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStreaks = async (friendsList) => {
    try {
      const res = await API.get("/matches");
      const completed = res.data.matches.filter(m => m.status === "completed");
      const map = {};
      friendsList.forEach(f => {
        map[f._id] = completed.filter(m => {
          const ids = (m.players || []).map(p => p.user?._id?.toString() || p.user?.toString());
          return ids.includes(userId) && ids.includes(f._id?.toString());
        }).length;
      });
      setStreaks(map);
    } catch {}
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Search debounce
  useEffect(() => {
    if (activeTab !== "search") return;
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await API.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data.users || []);
        setSearched(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, activeTab]);

  const handleAddFriend = async (e, targetId) => {
    e?.stopPropagation();
    try {
      const res = await API.post(`/friends/send/${targetId}`);
      alert(res.data.msg);
      setFriendStatuses(prev => ({ ...prev, [targetId]: "pending" }));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to send request");
    }
  };

  const handleAccept = async (id) => {
    try { await API.post(`/friends/accept/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.msg || "Failed"); }
  };

  const handleReject = async (id) => {
    try { await API.post(`/friends/reject/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.msg || "Failed"); }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this friend?")) return;
    try { await API.delete(`/friends/remove/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.msg || "Failed"); }
  };

  const leaderboard = [...friends].sort((a, b) => (b.wins || 0) - (a.wins || 0));

  const Tab = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
        border: "1px solid var(--border)", cursor: "pointer", whiteSpace: "nowrap",
        background: activeTab === id ? "var(--accent)" : "var(--bg-card)",
        color: activeTab === id ? "white" : "var(--text-secondary)",
        transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          background: activeTab === id ? "rgba(255,255,255,0.25)" : "var(--danger)",
          color: "white", fontSize: 10, fontWeight: 700,
          padding: "1px 6px", borderRadius: 10
        }}>
          {count}
        </span>
      )}
    </button>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 640 }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--text-primary)" }}>
            Friends
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            {friends.length} friends · {requests.length} pending
          </p>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
          <Tab id="friends" label="My Friends" count={0} />
          <Tab id="search" label="🔍 Find Players" count={0} />
          <Tab id="leaderboard" label="🏆 Leaderboard" count={0} />
          <Tab id="requests" label="Requests" count={requests.length} />
        </div>

        {/* ✅ Search tab */}
        {activeTab === "search" && (
          <div>
            {/* Search input */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <span style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none"
              }}>
                🔍
              </span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players by name..."
                autoFocus
                style={{
                  width: "100%", padding: "12px 16px 12px 42px",
                  borderRadius: 14, border: "1px solid var(--border)",
                  background: "var(--bg-card)", color: "var(--text-primary)",
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                  boxShadow: "var(--card-shadow)"
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              {searching && (
                <span style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)", fontSize: 12, color: "var(--text-muted)"
                }}>
                  Searching...
                </span>
              )}
              {searchQuery && !searching && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchResults([]); setSearched(false); }}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: 18,
                    color: "var(--text-muted)", lineHeight: 1
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 20, overflow: "hidden", boxShadow: "var(--card-shadow)"
              }}>
                {searchResults.map((user, i) => {
                  const status = friendStatuses[user._id];
                  const winRate = user.matchesPlayed > 0
                    ? Math.round((user.wins / user.matchesPlayed) * 100) : 0;

                  return (
                    <div
                      key={user._id}
                      onClick={() => navigate(`/profile/${user._id}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "16px 20px", cursor: "pointer",
                        borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-primary)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 700, fontSize: 18
                      }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15 }}>
                          {user.name}
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {user.skillLevel}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--success)" }}>
                            {user.wins || 0}W
                          </span>
                          <span style={{ fontSize: 12, color: "var(--danger)" }}>
                            {user.losses || 0}L
                          </span>
                          {user.matchesPlayed > 0 && (
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {winRate}% win rate
                            </span>
                          )}
                        </div>
                        {(user.sports || []).length > 0 && (
                          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {user.sports.slice(0, 3).map(s => (
                              <span key={s} style={{
                                fontSize: 11, padding: "1px 7px", borderRadius: 10,
                                background: "rgba(59,130,246,0.08)", color: "var(--accent)"
                              }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div onClick={e => e.stopPropagation()}>
                        {status === "friends" ? (
                          <span style={{
                            fontSize: 11, padding: "4px 10px", borderRadius: 20,
                            background: "rgba(34,197,94,0.1)", color: "var(--success)",
                            fontWeight: 500
                          }}>
                            Friends ✓
                          </span>
                        ) : status === "pending" ? (
                          <span style={{
                            fontSize: 11, padding: "4px 10px", borderRadius: 20,
                            background: "rgba(59,130,246,0.1)", color: "var(--accent)",
                            fontWeight: 500
                          }}>
                            Request Sent
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleAddFriend(e, user._id)}
                            style={{
                              fontSize: 12, padding: "6px 14px", borderRadius: 20,
                              background: "var(--accent)", color: "white",
                              border: "none", cursor: "pointer", fontWeight: 500
                            }}
                          >
                            + Add Friend
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {searched && searchResults.length === 0 && !searching && (
              <div style={{
                padding: 48, textAlign: "center",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 20, boxShadow: "var(--card-shadow)"
              }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>🔍</p>
                <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
                  No players found for "{searchQuery}"
                </p>
              </div>
            )}

            {/* Hint */}
            {!searched && searchQuery.trim().length === 0 && (
              <div style={{
                padding: 40, textAlign: "center",
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 20, boxShadow: "var(--card-shadow)"
              }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>👤</p>
                <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
                  Type a name to find players
                </p>
              </div>
            )}
          </div>
        )}

        {/* Friends tab */}
        {activeTab === "friends" && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, overflow: "hidden", boxShadow: "var(--card-shadow)"
          }}>
            {friends.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 44, marginBottom: 12 }}>👥</p>
                <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No friends yet!</p>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                  Use "Find Players" tab to search and add friends
                </p>
              </div>
            ) : (
              friends.map((f, i) => (
                <div
                  key={f._id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "16px 20px",
                    borderBottom: i < friends.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-primary)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div
                    onClick={() => navigate(`/profile/${f._id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer", minWidth: 0 }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: 18, flexShrink: 0
                    }}>
                      {f.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15 }}>
                        {f.name}
                      </p>
                      <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.skillLevel}</span>
                        <span style={{ fontSize: 12, color: "var(--success)" }}>{f.wins || 0}W</span>
                        <span style={{ fontSize: 12, color: "var(--danger)" }}>{f.losses || 0}L</span>
                        {streaks[f._id] > 0 && (
                          <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
                            🔥 {streaks[f._id]} together
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/dm/${f._id}`)}
                      style={{
                        fontSize: 12, color: "var(--accent)",
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: 8, padding: "5px 10px", cursor: "pointer"
                      }}
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleRemove(f._id)}
                      style={{
                        fontSize: 12, color: "var(--danger)",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        borderRadius: 8, padding: "5px 10px", cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Leaderboard tab */}
        {activeTab === "leaderboard" && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, overflow: "hidden", boxShadow: "var(--card-shadow)"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Friends Leaderboard</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Ranked by wins among your friends
              </p>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>Add friends to see the leaderboard!</p>
              </div>
            ) : (
              leaderboard.map((f, i) => {
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
                const winRate = f.matchesPlayed > 0
                  ? Math.round((f.wins / f.matchesPlayed) * 100) : 0;
                const avatarColor = i === 0 ? "#fbbf24" : i === 1 ? "#9ca3af" : i === 2 ? "#d97706" : "var(--accent)";

                return (
                  <div
                    key={f._id}
                    onClick={() => navigate(`/profile/${f._id}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 20px", cursor: "pointer",
                      borderBottom: i < leaderboard.length - 1 ? "1px solid var(--border)" : "none",
                      background: i === 0 ? "rgba(251,191,36,0.03)" : "transparent",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-primary)"}
                    onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "rgba(251,191,36,0.03)" : "transparent"}
                  >
                    <span style={{ fontSize: i < 3 ? 22 : 13, minWidth: 30, textAlign: "center", color: "var(--text-muted)", fontWeight: 700 }}>
                      {medal}
                    </span>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: avatarColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0
                    }}>
                      {f.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15 }}>{f.name}</p>
                      <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                        <span style={{ fontSize: 12, color: "var(--success)" }}>{f.wins || 0} wins</span>
                        <span style={{ fontSize: 12, color: "var(--danger)" }}>{f.losses || 0} losses</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.matchesPlayed || 0} played</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{
                        fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 20,
                        color: winRate >= 50 ? "var(--success)" : "var(--danger)"
                      }}>
                        {winRate}%
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>win rate</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Requests tab */}
        {activeTab === "requests" && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, overflow: "hidden", boxShadow: "var(--card-shadow)"
          }}>
            {requests.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 44, marginBottom: 12 }}>📭</p>
                <p style={{ color: "var(--text-muted)" }}>No pending requests</p>
              </div>
            ) : (
              requests.map((req, i) => (
                <div
                  key={req._id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: i < requests.length - 1 ? "1px solid var(--border)" : "none",
                    gap: 12
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: "50%", background: "#f59e0b",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: 18, flexShrink: 0
                    }}>
                      {req.sender?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {req.sender?.name}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {req.sender?.email}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleAccept(req._id)}
                      style={{
                        background: "var(--success)", color: "white", border: "none",
                        borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      style={{
                        background: "var(--bg-primary)", color: "var(--text-secondary)",
                        border: "1px solid var(--border)", borderRadius: 8,
                        padding: "7px 12px", fontSize: 13, cursor: "pointer"
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;