import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import MatchChat from "../components/MatchChat";
import RatePlayersModal from "../components/RatePlayersModal";
import MotmSection from "../components/MotmSection";
import StatsSubmitModal from "../components/StatsSubmitModal";

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState("");
  const [friends, setFriends] = useState([]);
  const [addedFriends, setAddedFriends] = useState(new Set());
  const [showRateModal, setShowRateModal] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [alreadySubmittedStats, setAlreadySubmittedStats] = useState(false);
  const [noShowIds, setNoShowIds] = useState([]);
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const userId = localStorage.getItem("userId");

  const fetchMatch = useCallback(async () => {
    try {
      const res = await API.get(`/matches/${id}`);
      setMatch(res.data.match);
    } catch (err) {
      console.error("Failed to fetch match:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await API.get("/friends");
      setFriends(res.data.friends || []);
    } catch {}
  }, []);

  const checkAlreadyRated = useCallback(async () => {
    try {
      const res = await API.get(`/matches/${id}/my-ratings`);
      setAlreadyRated(res.data.ratedIds?.length > 0);
    } catch {}
  }, [id]);

  const checkAlreadySubmittedStats = useCallback(async () => {
    try {
      const res = await API.get(`/matches/${id}/stats`);
      setAlreadySubmittedStats(res.data.hasSubmitted);
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchMatch();
    fetchFriends();
  }, [fetchMatch, fetchFriends]);

  useEffect(() => {
    if (match?.status === "completed") {
      checkAlreadyRated();
      checkAlreadySubmittedStats();
    }
  }, [match, checkAlreadyRated, checkAlreadySubmittedStats]);

  const handleJoin = async () => {
    try { await API.post(`/matches/${id}/join`); fetchMatch(); }
    catch (err) { alert(err.response?.data?.msg || "Join failed"); }
  };

  const handleLeave = async () => {
    try { await API.post(`/matches/${id}/leave`); fetchMatch(); }
    catch (err) { alert(err.response?.data?.msg || "Leave failed"); }
  };

  const handleApprove = async (playerId) => {
    try { await API.post(`/matches/${id}/approve`, { playerId }); fetchMatch(); }
    catch (err) { alert(err.response?.data?.msg || "Approval failed"); }
  };

  const handleComplete = async () => {
    if (!selectedWinner) return alert("Please select a winner team first!");
    if (!window.confirm(`Are you sure? Team ${selectedWinner} will be declared winner. This cannot be undone.`)) return;
    try {
      setCompleting(true);
      const res = await API.post(`/matches/${id}/complete`, { winnerTeam: selectedWinner });
      alert(res.data.msg);
      fetchMatch();
    } catch (err) {
      alert(err.response?.data?.msg || "Could not complete match");
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    const othersApproved = match?.players?.filter(p => {
      const pid = p.user?._id?.toString() || p.user?.toString();
      return p.status === "approved" && pid !== userId;
    }).length || 0;

    const confirmMsg = othersApproved > 0
      ? `⚠️ Warning: ${othersApproved} player(s) have already joined.\n\nCancelling will reduce your Reliability Score by 15 points.\n\nAre you sure?`
      : "Are you sure? This will permanently delete the match.";

    if (!window.confirm(confirmMsg)) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/matches/${id}`);
      alert(res.data.msg);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddFriend = async (playerId) => {
    try {
      const res = await API.post(`/friends/send/${playerId}`);
      alert(res.data.msg);
      setAddedFriends(prev => new Set([...prev, playerId]));
      fetchFriends();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to send request");
    }
  };

  const toggleNoShow = (pid) => {
    setNoShowIds(prev =>
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const handleMarkNoShow = async () => {
    if (noShowIds.length === 0) return alert("Select at least one player");
    if (!window.confirm(`Mark ${noShowIds.length} player(s) as no-show? Their reliability score will be reduced.`)) return;
    try {
      setMarkingNoShow(true);
      const res = await API.post(`/matches/${id}/no-show`, { playerIds: noShowIds });
      alert(res.data.msg);
      setNoShowIds([]);
      fetchMatch();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to mark no-show");
    } finally {
      setMarkingNoShow(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading...</p>
    </div>
  );

  if (!match) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--danger)" }}>Match not found</p>
    </div>
  );

  const players = match.players || [];
  const createdById = match.createdBy?._id?.toString() || match.createdBy?.toString();
  const isHost = createdById === userId;
  const isApproved = players.some(
    p => (p.user?._id?.toString() || p.user?.toString()) === userId && p.status === "approved"
  );
  const isJoined = players.some(
    p => (p.user?._id?.toString() || p.user?.toString()) === userId
  );
  const approvedPlayers = players.filter(p => p.status === "approved");
  const pendingPlayers = players.filter(p => p.status === "pending");
  const isFull = approvedPlayers.length >= match.maxPlayers;
  const teamA = approvedPlayers.filter(p => p.team === "A");
  const teamB = approvedPlayers.filter(p => p.team === "B");
  const isCompleted = match.status === "completed";
  const friendIds = new Set(friends.map(f => f._id?.toString()));
  const alreadyMarkedNoShow = match.noShows?.map(id => id?.toString()) || [];

  const FriendButton = ({ player }) => {
    const pid = player.user?._id?.toString() || player.user?.toString();
    if (!pid || pid === userId) return null;
    const isFriend = friendIds.has(pid);
    const justAdded = addedFriends.has(pid);
    if (isFriend) return (
      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "var(--success)", fontWeight: 500 }}>
        Friends ✓
      </span>
    );
    if (justAdded) return (
      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(59,130,246,0.1)", color: "var(--accent)", fontWeight: 500 }}>
        Request Sent
      </span>
    );
    return (
      <button onClick={() => handleAddFriend(pid)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--accent)", color: "white", border: "none", cursor: "pointer", fontWeight: 500 }}>
        + Add Friend
      </button>
    );
  };

  const PlayerRow = ({ player, bgColor, borderColor }) => {
    const pid = player.user?._id?.toString() || player.user?.toString();
    const isNoShow = alreadyMarkedNoShow.includes(pid);
    const isSelectedNoShow = noShowIds.includes(pid);
    const isMotmWinner = match.motmDeclared && (
      match.motmPlayer?.toString() === pid || match.motmPlayer?._id?.toString() === pid
    );

    return (
      <li style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderRadius: 12,
        background: isNoShow ? "rgba(239,68,68,0.05)" : bgColor,
        border: `1px solid ${isNoShow ? "rgba(239,68,68,0.3)" : borderColor}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isHost && isCompleted && pid !== userId && !isNoShow && (
            <input
              type="checkbox"
              checked={isSelectedNoShow}
              onChange={() => toggleNoShow(pid)}
              style={{ cursor: "pointer", width: 16, height: 16, flexShrink: 0 }}
            />
          )}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: isNoShow ? "rgba(239,68,68,0.2)" : "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: isNoShow ? "var(--danger)" : "white", fontSize: 13, fontWeight: 700
          }}>
            {player.user?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <span style={{ color: isNoShow ? "var(--text-muted)" : "var(--text-primary)", fontWeight: 500, fontSize: 14 }}>
              {player.user?.name || "User"}
              {pid === userId && (
                <span style={{ marginLeft: 6, fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>(You)</span>
              )}
            </span>
            <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
              {isMotmWinner && (
                <span style={{ fontSize: 10, background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>
                  🌟 MoTM
                </span>
              )}
              {isNoShow && (
                <span style={{ fontSize: 10, color: "var(--danger)", fontWeight: 500 }}>
                  ❌ No-show
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isCompleted && <FriendButton player={player} />}
        </div>
      </li>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 680 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, boxShadow: "var(--card-shadow)" }}>

          {/* Sport heading */}
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--text-primary)", textAlign: "center", marginBottom: 8 }}>
            {match.sport}
          </h1>

          {/* Status badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <span style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: isCompleted ? "rgba(239,68,68,0.1)" : match.status === "ongoing" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
              color: isCompleted ? "var(--danger)" : match.status === "ongoing" ? "#f59e0b" : "var(--success)"
            }}>
              {isCompleted ? "Completed" : match.status === "ongoing" ? "Ongoing" : "Upcoming"}
            </span>
          </div>

          {/* ── Winner banner ─────────────────────────── */}
          {isCompleted && match.winnerTeam && (
            <div style={{
              background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: 16, padding: 16, marginBottom: 20, textAlign: "center"
            }}>
              <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 22, color: "#f59e0b" }}>
                🏆 Team {match.winnerTeam} Won!
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Stats and ELO ratings have been updated
              </p>

              {/* Action buttons row */}
              {isApproved && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
                  {!alreadyRated && (
                    <button
                      onClick={() => setShowRateModal(true)}
                      style={{
                        padding: "9px 18px", borderRadius: 12,
                        background: "var(--accent)", color: "white",
                        border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13
                      }}
                    >
                      ⭐ Rate Players
                    </button>
                  )}
                  {alreadyRated && (
                    <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500, alignSelf: "center" }}>
                      ✅ Players rated
                    </span>
                  )}
                  {!alreadySubmittedStats && (
                    <button
                      onClick={() => setShowStatsModal(true)}
                      style={{
                        padding: "9px 18px", borderRadius: 12,
                        background: "rgba(34,197,94,0.1)", color: "var(--success)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        cursor: "pointer", fontWeight: 600, fontSize: 13
                      }}
                    >
                      📊 Submit Stats
                    </button>
                  )}
                  {alreadySubmittedStats && (
                    <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 500, alignSelf: "center" }}>
                      ✅ Stats submitted
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Host section ──────────────────────────── */}
          {isHost && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <p style={{ color: "var(--accent)", fontWeight: 600 }}>👑 You are the organizer</p>
              {!isCompleted && (
                <>
                  {approvedPlayers.filter(p => (p.user?._id?.toString() || p.user?.toString()) !== userId).length > 0 && (
                    <p style={{ fontSize: 12, color: "#f59e0b", textAlign: "center", maxWidth: 340 }}>
                      ⚠️ Cancelling now will reduce your reliability score by 15 points
                    </p>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      background: "rgba(239,68,68,0.1)", color: "var(--danger)",
                      border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
                      padding: "6px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                      opacity: deleting ? 0.7 : 1
                    }}
                  >
                    {deleting ? "Cancelling..." : "Cancel Match"}
                  </button>
                </>
              )}
            </div>
          )}

          {isJoined && !isHost && (
            <p style={{ color: "var(--success)", textAlign: "center", fontWeight: 600, marginBottom: 16 }}>
              ✅ You joined this match
            </p>
          )}

          {/* ── Match info ────────────────────────────── */}
          <div style={{ background: "var(--bg-primary)", borderRadius: 16, padding: 16, marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>📍 Location: </span>
              {match.location?.name || "N/A"}
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>📅 Date: </span>
              {new Date(match.date).toLocaleString()}
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>👥 Players: </span>
              {approvedPlayers.length} / {match.maxPlayers}
              <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>
                ({match.maxPlayers - approvedPlayers.length} slots left)
              </span>
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>👤 Organizer: </span>
              {match.createdBy?.name || "Unknown"}
            </p>
          </div>

          {/* ── Team A ────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              🅰️ Team A
              {isCompleted && match.winnerTeam === "A" && (
                <span style={{ fontSize: 11, background: "#fbbf24", color: "#78350f", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Winner</span>
              )}
            </h2>
            {teamA.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No players yet</p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teamA.map(p => (
                  <PlayerRow key={p.user?._id || p.user} player={p}
                    bgColor="rgba(59,130,246,0.05)" borderColor="rgba(59,130,246,0.2)" />
                ))}
              </ul>
            )}
          </div>

          {/* ── Team B ────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              🅱️ Team B
              {isCompleted && match.winnerTeam === "B" && (
                <span style={{ fontSize: 11, background: "#fbbf24", color: "#78350f", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Winner</span>
              )}
            </h2>
            {teamB.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No players yet</p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teamB.map(p => (
                  <PlayerRow key={p.user?._id || p.user} player={p}
                    bgColor="rgba(139,92,246,0.05)" borderColor="rgba(139,92,246,0.2)" />
                ))}
              </ul>
            )}
          </div>

          {/* ── MoTM Section ──────────────────────────── */}
          {isCompleted && approvedPlayers.length >= 2 && (
            <MotmSection
              matchId={id}
              approvedPlayers={approvedPlayers}
              isHost={isHost}
              isApproved={isApproved}
              userId={userId}
              sport={match.sport}
            />
          )}

          {/* ── No-show section ───────────────────────── */}
          {isHost && isCompleted && approvedPlayers.filter(p => (p.user?._id?.toString() || p.user?.toString()) !== userId).length > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 16, padding: 16, marginBottom: 16
            }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 6 }}>
                Mark No-Shows
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
                Select players who were approved but did not show up in person.
              </p>
              {noShowIds.length > 0 ? (
                <button
                  onClick={handleMarkNoShow}
                  disabled={markingNoShow}
                  style={{
                    background: "var(--danger)", color: "white", border: "none",
                    borderRadius: 10, padding: "9px 20px", fontSize: 14,
                    fontWeight: 600, cursor: "pointer", opacity: markingNoShow ? 0.7 : 1
                  }}
                >
                  {markingNoShow ? "Marking..." : `Mark ${noShowIds.length} Player(s) as No-Show`}
                </button>
              ) : (
                alreadyMarkedNoShow.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Check the checkbox next to a player's name above to mark them as no-show
                  </p>
                )
              )}
            </div>
          )}

          {/* ── Pending Requests ──────────────────────── */}
          {pendingPlayers.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 10 }}>
                ⏳ Pending Requests
              </h2>
              <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingPlayers.map(p => {
                  const pid = p.user?._id?.toString() || p.user?.toString();
                  return (
                    <li key={pid} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 12,
                      background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "var(--accent)", display: "flex", alignItems: "center",
                          justifyContent: "center", color: "white", fontSize: 13, fontWeight: 700
                        }}>
                          {p.user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {p.user?.name || "User"}
                        </span>
                      </div>
                      {isHost && (
                        <button onClick={() => handleApprove(pid)} style={{
                          background: "var(--accent)", color: "white", border: "none",
                          borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer"
                        }}>
                          Approve
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ── Complete Match ────────────────────────── */}
          {isHost && !isCompleted && (
            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 8 }}>
                Complete Match
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
                Select the winning team. Stats, ELO, and badges will update automatically.
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={() => setSelectedWinner("A")} style={{
                  flex: 1, padding: "10px", borderRadius: 12, fontWeight: 600, cursor: "pointer",
                  border: `2px solid ${selectedWinner === "A" ? "var(--accent)" : "var(--border)"}`,
                  background: selectedWinner === "A" ? "rgba(59,130,246,0.08)" : "var(--bg-card)",
                  color: selectedWinner === "A" ? "var(--accent)" : "var(--text-secondary)"
                }}>Team A Wins</button>
                <button onClick={() => setSelectedWinner("B")} style={{
                  flex: 1, padding: "10px", borderRadius: 12, fontWeight: 600, cursor: "pointer",
                  border: `2px solid ${selectedWinner === "B" ? "#8b5cf6" : "var(--border)"}`,
                  background: selectedWinner === "B" ? "rgba(139,92,246,0.08)" : "var(--bg-card)",
                  color: selectedWinner === "B" ? "#8b5cf6" : "var(--text-secondary)"
                }}>Team B Wins</button>
              </div>
              <button onClick={handleComplete} disabled={!selectedWinner || completing} style={{
                width: "100%", padding: "12px", borderRadius: 12, fontWeight: 600, fontSize: 15,
                border: "none", cursor: !selectedWinner || completing ? "not-allowed" : "pointer",
                background: selectedWinner ? "var(--success)" : "var(--border)",
                color: selectedWinner ? "white" : "var(--text-muted)",
                opacity: completing ? 0.7 : 1
              }}>
                {completing ? "Completing..." : "Confirm & Complete Match"}
              </button>
            </div>
          )}

          {/* ── Join / Leave ──────────────────────────── */}
          {!isCompleted && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              {isHost ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Organizers cannot leave their own match.</p>
              ) : isJoined ? (
                <button onClick={handleLeave} style={{
                  background: "rgba(239,68,68,0.1)", color: "var(--danger)",
                  border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12,
                  padding: "10px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer"
                }}>Leave Match</button>
              ) : isFull ? (
                <button disabled style={{
                  background: "var(--border)", color: "var(--text-muted)",
                  border: "none", borderRadius: 12, padding: "10px 28px", fontSize: 15, cursor: "not-allowed"
                }}>Match Full</button>
              ) : (
                <button onClick={handleJoin} style={{
                  background: "var(--success)", color: "white", border: "none",
                  borderRadius: 12, padding: "10px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer"
                }}>Join Match</button>
              )}
            </div>
          )}

          <MatchChat matchId={id} isApproved={isApproved} isHost={isHost} />
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────── */}
      {showRateModal && (
        <RatePlayersModal
          matchId={id}
          players={approvedPlayers}
          currentUserId={userId}
          onClose={() => setShowRateModal(false)}
          onDone={() => setAlreadyRated(true)}
        />
      )}

      {showStatsModal && (
        <StatsSubmitModal
          matchId={id}
          sport={match.sport}
          onClose={() => setShowStatsModal(false)}
          onDone={() => setAlreadySubmittedStats(true)}
        />
      )}
    </div>
  );
};

export default MatchDetails;