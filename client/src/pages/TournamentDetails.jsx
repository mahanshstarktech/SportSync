import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

const sportEmoji = {
  cricket: "🏏", football: "⚽", basketball: "🏀", tennis: "🎾",
  badminton: "🏸", volleyball: "🏐", hockey: "🏑", kabaddi: "🤼",
  "table tennis": "🏓", swimming: "🏊", athletics: "🏃", boxing: "🥊"
};

const getSportEmoji = (sport) => {
  if (!sport) return "🏅";
  const key = sport.toLowerCase();
  for (const [k, v] of Object.entries(sportEmoji)) {
    if (key.includes(k)) return v;
  }
  return "🏅";
};

// ─── Visual Bracket Component ────────────────────────────────
function BracketView({ tournament, isHost, onDeclareResult }) {
  const rounds = tournament.rounds || [];
  if (rounds.length === 0) return null;

  const CARD_W = 180;
  const CARD_H = 80;
  const ROUND_GAP = 80;
  const MATCH_GAP = 24;

  // Calculate positions for each round
  const roundPositions = rounds.map((round, rIdx) => {
    const matchCount = round.matches.length;
    // Each match in later rounds has more vertical space
    const spacing = (CARD_H + MATCH_GAP) * Math.pow(2, rIdx);
    const totalHeight = matchCount * spacing - (spacing - CARD_H - MATCH_GAP);
    return { spacing, totalHeight };
  });

  const maxHeight = Math.max(...roundPositions.map(r => r.totalHeight)) + 60;
  const totalWidth = rounds.length * (CARD_W + ROUND_GAP) + 40;

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", paddingBottom: 16 }}>
      <svg
        width={Math.max(totalWidth, 400)}
        height={maxHeight}
        style={{ display: "block", minWidth: totalWidth }}
      >
        {rounds.map((round, rIdx) => {
          const x = rIdx * (CARD_W + ROUND_GAP) + 20;
          const { spacing } = roundPositions[rIdx];
          const maxH = roundPositions[0].totalHeight;

          return (
            <g key={round.roundNumber}>
              {/* Round label */}
              <text
                x={x + CARD_W / 2}
                y={22}
                textAnchor="middle"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "Outfit, sans-serif",
                  fill: "var(--accent)"
                }}
              >
                {round.name}
              </text>

              {round.matches.map((match, mIdx) => {
                const matchY = 36 + mIdx * spacing + (spacing - CARD_H - MATCH_GAP) / 2;
                const isCompleted = match.status === "completed";
                const isBye = match.teamBName === "BYE";
                const canDeclare = isHost && !isCompleted && !isBye
                  && match.teamAName !== "TBD" && match.teamBName !== "TBD";

                const teamAWon = isCompleted && match.winnerName === match.teamAName;
                const teamBWon = isCompleted && match.winnerName === match.teamBName;

                // Connector lines to next round
                const hasNextRound = rIdx < rounds.length - 1;
                const nextX = x + CARD_W + ROUND_GAP;
                const nextSpacing = roundPositions[rIdx + 1]?.spacing;
                const nextMatchIdx = Math.floor(mIdx / 2);
                const nextMatchY = hasNextRound
                  ? 36 + nextMatchIdx * nextSpacing + (nextSpacing - CARD_H - MATCH_GAP) / 2 + CARD_H / 2
                  : 0;
                const myMidY = matchY + CARD_H / 2;

                return (
                  <g key={mIdx}>
                    {/* Connector lines */}
                    {hasNextRound && (
                      <>
                        <line
                          x1={x + CARD_W}
                          y1={myMidY}
                          x2={x + CARD_W + ROUND_GAP / 2}
                          y2={myMidY}
                          stroke="var(--border)"
                          strokeWidth={2}
                        />
                        <line
                          x1={x + CARD_W + ROUND_GAP / 2}
                          y1={myMidY}
                          x2={x + CARD_W + ROUND_GAP / 2}
                          y2={nextMatchY}
                          stroke="var(--border)"
                          strokeWidth={2}
                        />
                        <line
                          x1={x + CARD_W + ROUND_GAP / 2}
                          y1={nextMatchY}
                          x2={nextX}
                          y2={nextMatchY}
                          stroke="var(--border)"
                          strokeWidth={2}
                        />
                      </>
                    )}

                    {/* Match card background */}
                    <rect
                      x={x}
                      y={matchY}
                      width={CARD_W}
                      height={CARD_H}
                      rx={10}
                      fill="var(--bg-card)"
                      stroke={isCompleted ? "rgba(34,197,94,0.3)" : "var(--border)"}
                      strokeWidth={isCompleted ? 1.5 : 1}
                    />

                    {/* Divider */}
                    <line
                      x1={x + 8}
                      y1={matchY + CARD_H / 2}
                      x2={x + CARD_W - 8}
                      y2={matchY + CARD_H / 2}
                      stroke="var(--border)"
                      strokeWidth={1}
                    />

                    {/* Team A row */}
                    <rect
                      x={x}
                      y={matchY}
                      width={CARD_W}
                      height={CARD_H / 2}
                      rx={10}
                      fill={teamAWon ? "rgba(34,197,94,0.12)" : "transparent"}
                    />
                    <text
                      x={x + 10}
                      y={matchY + CARD_H / 4 + 5}
                      style={{
                        fontSize: 12,
                        fontWeight: teamAWon ? 700 : 500,
                        fontFamily: "DM Sans, sans-serif",
                        fill: match.teamAName === "TBD"
                          ? "var(--text-muted)"
                          : teamAWon
                            ? "#22c55e"
                            : "var(--text-primary)"
                      }}
                    >
                      {match.teamAName?.length > 18
                        ? match.teamAName.slice(0, 16) + "…"
                        : match.teamAName}
                    </text>
                    {teamAWon && (
                      <text
                        x={x + CARD_W - 8}
                        y={matchY + CARD_H / 4 + 5}
                        textAnchor="end"
                        style={{ fontSize: 11, fill: "#22c55e", fontWeight: 700 }}
                      >
                        ✓
                      </text>
                    )}

                    {/* Team B row */}
                    <rect
                      x={x}
                      y={matchY + CARD_H / 2}
                      width={CARD_W}
                      height={CARD_H / 2}
                      rx={10}
                      fill={teamBWon ? "rgba(34,197,94,0.12)" : "transparent"}
                    />
                    <text
                      x={x + 10}
                      y={matchY + (3 * CARD_H) / 4 + 5}
                      style={{
                        fontSize: 12,
                        fontWeight: teamBWon ? 700 : 500,
                        fontFamily: "DM Sans, sans-serif",
                        fill: match.teamBName === "TBD" || match.teamBName === "BYE"
                          ? "var(--text-muted)"
                          : teamBWon
                            ? "#22c55e"
                            : "var(--text-primary)"
                      }}
                    >
                      {match.teamBName?.length > 18
                        ? match.teamBName.slice(0, 16) + "…"
                        : match.teamBName}
                    </text>
                    {teamBWon && (
                      <text
                        x={x + CARD_W - 8}
                        y={matchY + (3 * CARD_H) / 4 + 5}
                        textAnchor="end"
                        style={{ fontSize: 11, fill: "#22c55e", fontWeight: 700 }}
                      >
                        ✓
                      </text>
                    )}

                    {/* Winner crown for completed matches */}
                    {isCompleted && (
                      <text
                        x={x + CARD_W - 6}
                        y={matchY + 14}
                        textAnchor="end"
                        style={{ fontSize: 14 }}
                      >
                        ✅
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Declare result buttons — below bracket for host */}
      {isHost && (
        <div style={{ marginTop: 20 }}>
          {rounds.map(round =>
            round.matches.map((match, mIdx) => {
              const canDeclare = !match.status || match.status === "scheduled" || match.status === "ongoing";
              const isBye = match.teamBName === "BYE";
              const isCompleted = match.status === "completed";

              if (!canDeclare || isBye || isCompleted) return null;
              if (match.teamAName === "TBD" || match.teamBName === "TBD") return null;

              return (
                <div
                  key={`${round.roundNumber}-${mIdx}`}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 14, padding: "14px 16px", marginBottom: 10
                  }}
                >
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                    {round.name} — Match {mIdx + 1}: Declare winner
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => onDeclareResult(
                        round.roundNumber, mIdx,
                        tournament.teams.find(t => t.name === match.teamAName)?._id?.toString()
                      )}
                      style={{
                        flex: 1, padding: "9px", borderRadius: 10, border: "none",
                        background: "rgba(59,130,246,0.1)", color: "var(--accent)",
                        fontWeight: 600, fontSize: 13, cursor: "pointer"
                      }}
                    >
                      🏆 {match.teamAName}
                    </button>
                    <button
                      onClick={() => onDeclareResult(
                        round.roundNumber, mIdx,
                        tournament.teams.find(t => t.name === match.teamBName)?._id?.toString()
                      )}
                      style={{
                        flex: 1, padding: "9px", borderRadius: 10, border: "none",
                        background: "rgba(139,92,246,0.1)", color: "#8b5cf6",
                        fontWeight: 600, fontSize: 13, cursor: "pointer"
                      }}
                    >
                      🏆 {match.teamBName}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main TournamentDetails Component ────────────────────────
function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [starting, setStarting] = useState(false);
  const [activeTab, setActiveTab] = useState("bracket");

  const userId = localStorage.getItem("userId");

  const fetchTournament = useCallback(async () => {
    try {
      const res = await API.get(`/tournaments/${id}`);
      setTournament(res.data.tournament);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTournament(); }, [fetchTournament]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return alert("Team name is required");
    try {
      setRegistering(true);
      await API.post(`/tournaments/${id}/register`, { teamName: teamName.trim() });
      setTeamName("");
      fetchTournament();
    } catch (err) {
      alert(err.response?.data?.msg || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleStart = async () => {
    if (!window.confirm("Start the tournament? This will generate the bracket and close registration.")) return;
    try {
      setStarting(true);
      await API.post(`/tournaments/${id}/start`);
      setActiveTab("bracket");
      fetchTournament();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to start tournament");
    } finally {
      setStarting(false);
    }
  };

  const handleDeclareResult = async (roundNumber, matchIndex, winnerTeamId) => {
    if (!winnerTeamId) return alert("Team not found");
    if (!window.confirm("Declare this team as winner?")) return;
    try {
      await API.post(`/tournaments/${id}/result`, { roundNumber, matchIndex, winnerTeamId });
      fetchTournament();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to declare result");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this tournament? This cannot be undone.")) return;
    try {
      await API.delete(`/tournaments/${id}`);
      navigate("/tournaments");
    } catch (err) {
      alert(err.response?.data?.msg || "Delete failed");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading tournament...</p>
    </div>
  );

  if (!tournament) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--danger)" }}>Tournament not found</p>
    </div>
  );

  const isHost = tournament.createdBy?._id?.toString() === userId
    || tournament.createdBy?.toString() === userId;
  const myTeam = tournament.teams?.find(t =>
    t.captain?._id?.toString() === userId || t.captain?.toString() === userId
  );
  const teamsLeft = tournament.maxTeams - (tournament.teams?.length || 0);

  const statusColors = {
    registration: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Registration Open" },
    ongoing: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Ongoing" },
    completed: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Completed" }
  };
  const sc = statusColors[tournament.status];

  // Count pending matches for badge
  const pendingMatches = (tournament.rounds || []).reduce((acc, round) =>
    acc + round.matches.filter(m =>
      m.status !== "completed" && m.teamAName !== "TBD" && m.teamBName !== "TBD" && m.teamBName !== "BYE"
    ).length, 0
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Back */}
        <button
          onClick={() => navigate("/tournaments")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 14, marginBottom: 16,
            display: "flex", alignItems: "center", gap: 4, padding: 0
          }}
        >
          ← Back to Tournaments
        </button>

        {/* Winner banner */}
        {tournament.status === "completed" && tournament.winnerName && (
          <div style={{
            background: "rgba(251,191,36,0.1)", border: "2px solid rgba(251,191,36,0.4)",
            borderRadius: 20, padding: "20px 24px", marginBottom: 16,
            textAlign: "center", boxShadow: "0 4px 24px rgba(251,191,36,0.15)"
          }}>
            <p style={{ fontSize: 36, marginBottom: 6 }}>🏆</p>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 24, color: "#f59e0b" }}>
              {tournament.winnerName}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
              Tournament Champion
            </p>
          </div>
        )}

        {/* Header card */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 24, padding: 24, marginBottom: 16, boxShadow: "var(--card-shadow)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "rgba(59,130,246,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, flexShrink: 0
            }}>
              {getSportEmoji(tournament.sport)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text-primary)" }}>
                  {tournament.name}
                </h1>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                  {sc.label}
                </span>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {tournament.sport} · by {tournament.createdBy?.name}
              </p>
            </div>
          </div>

          {tournament.description && (
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
              {tournament.description}
            </p>
          )}

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Location", value: `📍 ${tournament.location?.name}` },
              { label: "Start Date", value: `📅 ${new Date(tournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` },
              { label: "Teams", value: `👥 ${tournament.teams?.length || 0} / ${tournament.maxTeams}` },
              { label: "Format", value: `🎮 ${tournament.playersPerTeam}v${tournament.playersPerTeam} Knockout` }
            ].map(info => (
              <div key={info.label} style={{ background: "var(--bg-primary)", borderRadius: 12, padding: "10px 14px" }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>{info.label}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{info.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
              <span>Team registration</span>
              <span>{tournament.teams?.length || 0}/{tournament.maxTeams}</span>
            </div>
            <div style={{ background: "var(--border)", borderRadius: 6, height: 8 }}>
              <div style={{
                width: `${((tournament.teams?.length || 0) / tournament.maxTeams) * 100}%`,
                height: 8, borderRadius: 6,
                background: teamsLeft === 0 ? "#f59e0b" : "var(--accent)",
                transition: "width 0.4s ease"
              }} />
            </div>
          </div>

          {/* Host controls */}
          {isHost && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {tournament.status === "registration" && tournament.teams?.length >= 2 && (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  style={{
                    background: "var(--success)", color: "white", border: "none",
                    borderRadius: 10, padding: "9px 20px", fontSize: 14,
                    fontWeight: 600, cursor: "pointer", opacity: starting ? 0.7 : 1
                  }}
                >
                  {starting ? "Generating bracket..." : "🚀 Start & Generate Bracket"}
                </button>
              )}
              {tournament.status !== "completed" && (
                <button
                  onClick={handleDelete}
                  style={{
                    background: "rgba(239,68,68,0.1)", color: "var(--danger)",
                    border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
                    padding: "9px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer"
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* My team banner */}
        {myTeam && tournament.status === "registration" && (
          <div style={{
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 16, padding: 14, marginBottom: 16, textAlign: "center"
          }}>
            <p style={{ color: "var(--success)", fontWeight: 600, fontSize: 14 }}>
              ✅ Your team "{myTeam.name}" is registered — waiting for tournament to start
            </p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { key: "bracket", label: "🏆 Bracket" },
            { key: "teams", label: `👥 Teams (${tournament.teams?.length || 0})` },
            ...(tournament.status === "registration" && !myTeam
              ? [{ key: "register", label: "➕ Register Team" }]
              : [])
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                border: "1px solid var(--border)", cursor: "pointer", whiteSpace: "nowrap",
                background: activeTab === tab.key ? "var(--accent)" : "var(--bg-card)",
                color: activeTab === tab.key ? "white" : "var(--text-secondary)",
                transition: "all 0.15s", position: "relative"
              }}
            >
              {tab.label}
              {tab.key === "bracket" && isHost && pendingMatches > 0 && tournament.status === "ongoing" && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#ef4444", color: "white",
                  fontSize: 9, fontWeight: 700,
                  width: 16, height: 16, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {pendingMatches}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Register tab */}
        {activeTab === "register" && tournament.status === "registration" && !myTeam && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 24, boxShadow: "var(--card-shadow)" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 18, color: "var(--text-primary)", marginBottom: 6 }}>
              Register Your Team
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
              {teamsLeft > 0 ? `${teamsLeft} of ${tournament.maxTeams} spots remaining` : "Tournament is full"}
            </p>

            {teamsLeft > 0 ? (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Thunder Strikers"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 12,
                      border: "1px solid var(--border)", background: "var(--bg-primary)",
                      color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box"
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                  You will be the team captain. Other players can be added later.
                </p>
                <button
                  type="submit"
                  disabled={registering || !teamName.trim()}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    background: teamName.trim() ? "var(--accent)" : "var(--border)",
                    color: teamName.trim() ? "white" : "var(--text-muted)",
                    fontWeight: 600, fontSize: 15, border: "none",
                    cursor: registering || !teamName.trim() ? "not-allowed" : "pointer",
                    opacity: registering ? 0.7 : 1
                  }}
                >
                  {registering ? "Registering..." : "Register Team"}
                </button>
              </form>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                All spots are filled. Registration is closed.
              </p>
            )}
          </div>
        )}

        {/* Teams tab */}
        {activeTab === "teams" && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
            {/* Header */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "rgba(59,130,246,0.03)" }}>
              <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                Registered Teams
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {tournament.teams?.length || 0} of {tournament.maxTeams} teams
              </p>
            </div>

            {tournament.teams?.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 44, marginBottom: 12 }}>👥</p>
                <p style={{ color: "var(--text-muted)" }}>No teams registered yet</p>
              </div>
            ) : (
              tournament.teams.map((team, i) => {
                const isWinner = tournament.winner?.toString() === team._id?.toString();
                const winRate = (team.wins + team.losses) > 0
                  ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 0;

                return (
                  <div
                    key={team._id}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 20px",
                      borderBottom: i < tournament.teams.length - 1 ? "1px solid var(--border)" : "none",
                      background: isWinner ? "rgba(251,191,36,0.05)" : "transparent"
                    }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: isWinner ? "#fbbf24" : "linear-gradient(135deg, var(--accent), #8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: isWinner ? 16 : 14
                    }}>
                      {isWinner ? "🏆" : team.name?.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15 }}>
                          {team.name}
                        </p>
                        {isWinner && (
                          <span style={{
                            fontSize: 11, background: "#fbbf24", color: "#78350f",
                            padding: "2px 8px", borderRadius: 20, fontWeight: 700
                          }}>
                            Champion
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        Captain: {team.captain?.name || "Unknown"}
                        {team.players?.length > 0 && ` · ${team.players.length} player${team.players.length > 1 ? "s" : ""}`}
                      </p>
                    </div>

                    {/* Stats */}
                    {tournament.status !== "registration" && (
                      <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--success)" }}>{team.wins || 0}</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)" }}>W</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--danger)" }}>{team.losses || 0}</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)" }}>L</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Bracket tab */}
        {activeTab === "bracket" && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, boxShadow: "var(--card-shadow)" }}>
            {tournament.status === "registration" ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <p style={{ fontSize: 44, marginBottom: 12 }}>🎯</p>
                <p style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                  Bracket not generated yet
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  {tournament.teams?.length || 0} of {tournament.maxTeams} teams registered
                  {isHost && tournament.teams?.length >= 2 && " · You can start now!"}
                </p>
                {/* Mini team list preview */}
                {tournament.teams?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 }}>
                    {tournament.teams.map(t => (
                      <span key={t._id} style={{
                        fontSize: 13, padding: "4px 12px", borderRadius: 20,
                        background: "rgba(59,130,246,0.08)", color: "var(--accent)",
                        border: "1px solid rgba(59,130,246,0.2)"
                      }}>
                        {t.name}
                      </span>
                    ))}
                    {teamsLeft > 0 && Array.from({ length: teamsLeft }).map((_, i) => (
                      <span key={`empty-${i}`} style={{
                        fontSize: 13, padding: "4px 12px", borderRadius: 20,
                        background: "var(--bg-primary)", color: "var(--text-muted)",
                        border: "1px dashed var(--border)"
                      }}>
                        TBD
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Bracket legend */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.5)" }} />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Winner</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--bg-card)", border: "1px solid var(--border)" }} />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Scheduled</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>TBD = awaiting previous round result</span>
                  </div>
                </div>

                <BracketView
                  tournament={tournament}
                  isHost={isHost}
                  onDeclareResult={handleDeclareResult}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentDetails;