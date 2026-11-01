import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

function MotmSection({ matchId, approvedPlayers, isHost, isApproved, userId, sport }) {
  const [, setMyVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [motmDeclared, setMotmDeclared] = useState(false);
  const [motmPlayer, setMotmPlayer] = useState(null);
  const [declaring, setDeclaring] = useState(false);
  const [voting, setVoting] = useState(false);
  const [selectedDeclaree, setSelectedDeclaree] = useState("");

  const fetchMotmStatus = useCallback(async () => {
    try {
      const voteRes = await API.get(`/matches/${matchId}/motm/my-vote`);
      setHasVoted(voteRes.data.hasVoted);
      setMyVote(voteRes.data.nomineeId);
      setMotmDeclared(voteRes.data.motmDeclared);
      setMotmPlayer(voteRes.data.motmPlayer);

      if (isHost) {
        const tallRes = await API.get(`/matches/${matchId}/motm/votes`);
        setVotes(tallRes.data.votes || []);
        setTotalVotes(tallRes.data.totalVotes || 0);
        if (tallRes.data.motmPlayer) {
          setMotmPlayer(tallRes.data.motmPlayer);
        }
      }
    } catch {}
  }, [matchId, isHost]);

  useEffect(() => { fetchMotmStatus(); }, [fetchMotmStatus]);

  const handleVote = async (nomineeId) => {
    try {
      setVoting(true);
      await API.post(`/matches/${matchId}/motm/vote`, { nomineeId });
      setHasVoted(true);
      setMyVote(nomineeId);
      fetchMotmStatus();
    } catch (err) {
      alert(err.response?.data?.msg || "Vote failed");
    } finally {
      setVoting(false);
    }
  };

  const handleDeclare = async () => {
    if (!selectedDeclaree) return alert("Select a player to declare as MoTM");
    if (!window.confirm("Declare this player as Man of the Match?")) return;
    try {
      setDeclaring(true);
      const res = await API.post(`/matches/${matchId}/motm/declare`, { motmUserId: selectedDeclaree });
      alert(res.data.msg);
      fetchMotmStatus();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to declare MoTM");
    } finally {
      setDeclaring(false);
    }
  };

  const otherPlayers = approvedPlayers.filter(p => {
    const pid = p.user?._id?.toString() || p.user?.toString();
    return pid !== userId;
  });

  // MoTM already declared — show winner
  if (motmDeclared && motmPlayer) {
    const winner = approvedPlayers.find(p => {
      const pid = p.user?._id?.toString() || p.user?.toString();
      return pid === (motmPlayer?._id?.toString() || motmPlayer?.toString());
    });

    return (
      <div style={{
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.3)",
        borderRadius: 16, padding: 20, marginBottom: 16
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 32, marginBottom: 6 }}>🌟</p>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 18, color: "#f59e0b", marginBottom: 4 }}>
            Man of the Match
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#78350f", fontWeight: 700, fontSize: 20
            }}>
              {winner?.user?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 700, color: "#f59e0b", fontSize: 16 }}>
                {winner?.user?.name || "Player"}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {sport} · MoTM Award
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(59,130,246,0.04)",
      border: "1px solid rgba(59,130,246,0.15)",
      borderRadius: 16, padding: 20, marginBottom: 16
    }}>
      <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)", marginBottom: 6 }}>
        🌟 Man of the Match
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        {isHost
          ? `${totalVotes} vote(s) received. Review and declare the winner.`
          : hasVoted
            ? "Your vote has been submitted. Waiting for host to declare MoTM."
            : "Vote for the best player in this match."}
      </p>

      {/* Player vote for approved players */}
      {isApproved && !isHost && !hasVoted && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
          {otherPlayers.map(p => {
            const pid = p.user?._id?.toString() || p.user?.toString();
            return (
              <button
                key={pid}
                onClick={() => handleVote(pid)}
                disabled={voting}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  cursor: voting ? "not-allowed" : "pointer",
                  transition: "all 0.15s", textAlign: "left",
                  opacity: voting ? 0.7 : 1
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#f59e0b";
                  e.currentTarget.style.background = "rgba(245,158,11,0.06)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--bg-card)";
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: p.team === "A" ? "rgba(59,130,246,0.2)" : "rgba(139,92,246,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: p.team === "A" ? "var(--accent)" : "#8b5cf6",
                  fontWeight: 700, fontSize: 14, flexShrink: 0
                }}>
                  {p.user?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                    {p.user?.name}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Team {p.team}</p>
                </div>
                <span style={{ fontSize: 18 }}>⭐</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Already voted state */}
      {isApproved && !isHost && hasVoted && (
        <div style={{
          padding: "10px 14px", borderRadius: 12,
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          fontSize: 13, color: "var(--success)", fontWeight: 500
        }}>
          ✅ Vote submitted! Waiting for host to declare MoTM.
        </div>
      )}

      {/* Host view — vote tally + declare */}
      {isHost && (
        <div>
          {votes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                Vote tally:
              </p>
              {votes.map(v => (
                <div key={v.userId} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: 10,
                  background: "var(--bg-primary)", marginBottom: 6,
                  border: "1px solid var(--border)"
                }}>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 14 }}>
                    {v.name}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "2px 10px",
                    borderRadius: 20, background: "rgba(245,158,11,0.1)", color: "#f59e0b"
                  }}>
                    {v.votes} vote{v.votes > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Declare selector */}
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
            Select final MoTM:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {approvedPlayers.map(p => {
              const pid = p.user?._id?.toString() || p.user?.toString();
              const voteCount = votes.find(v => v.userId === pid)?.votes || 0;
              const isSelected = selectedDeclaree === pid;

              return (
                <div
                  key={pid}
                  onClick={() => setSelectedDeclaree(pid)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                    border: isSelected ? "1.5px solid #f59e0b" : "1.5px solid var(--border)",
                    background: isSelected ? "rgba(245,158,11,0.06)" : "var(--bg-card)",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: isSelected ? "#f59e0b" : "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSelected ? "#78350f" : "white", fontWeight: 700, fontSize: 13
                    }}>
                      {p.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: isSelected ? "#f59e0b" : "var(--text-primary)" }}>
                        {p.user?.name}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Team {p.team}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {voteCount > 0 && (
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 10,
                        background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontWeight: 600
                      }}>
                        {voteCount}v
                      </span>
                    )}
                    {isSelected && <span style={{ fontSize: 16 }}>⭐</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleDeclare}
            disabled={!selectedDeclaree || declaring}
            style={{
              width: "100%", padding: "11px", borderRadius: 12, border: "none",
              background: selectedDeclaree ? "#f59e0b" : "var(--border)",
              color: selectedDeclaree ? "#78350f" : "var(--text-muted)",
              fontWeight: 700, fontSize: 14,
              cursor: !selectedDeclaree || declaring ? "not-allowed" : "pointer",
              opacity: declaring ? 0.7 : 1
            }}
          >
            {declaring ? "Declaring..." : "🌟 Declare Man of the Match"}
          </button>
        </div>
      )}
    </div>
  );
}

export default MotmSection;