import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const statusColors = {
  registration: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Registration Open" },
  ongoing: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Ongoing" },
  completed: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Completed" }
};

function TournamentList() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    API.get("/tournaments")
      .then(res => setTournaments(res.data.tournaments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tournaments.filter(t => {
    if (filter === "all") return true;
    return t.status === filter;
  });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--text-muted)" }}>Loading tournaments...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--text-primary)" }}>
              Tournaments
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
              Compete in organized tournaments
            </p>
          </div>
          <button
            onClick={() => navigate("/tournaments/create")}
            style={{
              background: "var(--accent)", color: "white", border: "none",
              borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}
          >
            + Create Tournament
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { key: "all", label: "All" },
            { key: "registration", label: "Open Registration" },
            { key: "ongoing", label: "Ongoing" },
            { key: "completed", label: "Completed" }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "7px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500,
                border: "1px solid var(--border)", cursor: "pointer", whiteSpace: "nowrap",
                background: filter === tab.key ? "var(--accent)" : "var(--bg-card)",
                color: filter === tab.key ? "white" : "var(--text-secondary)",
                transition: "all 0.15s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tournament cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🏆</p>
            <p style={{ color: "var(--text-muted)", fontSize: 16 }}>No tournaments found</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
              Create one to get started!
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(t => {
              const sc = statusColors[t.status] || statusColors.registration;
              const teamsLeft = t.maxTeams - (t.teams?.length || 0);

              return (
                <div
                  key={t._id}
                  onClick={() => navigate(`/tournaments/${t._id}`)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 20, padding: 20, cursor: "pointer",
                    boxShadow: "var(--card-shadow)", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--card-shadow-hover)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--card-shadow)"}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "rgba(59,130,246,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
                      }}>
                        {getSportEmoji(t.sport)}
                      </div>
                      <div>
                        <h3 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 2 }}>
                          {t.name}
                        </h3>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.sport}</p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                      background: sc.bg, color: sc.color, whiteSpace: "nowrap"
                    }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      📍 {t.location?.name}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      📅 {new Date(t.startDate).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      👤 Organized by {t.createdBy?.name}
                    </p>
                  </div>

                  {/* Teams progress */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Teams</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                        {t.teams?.length || 0} / {t.maxTeams}
                      </span>
                    </div>
                    <div style={{ background: "var(--border)", borderRadius: 4, height: 6 }}>
                      <div style={{
                        width: `${((t.teams?.length || 0) / t.maxTeams) * 100}%`,
                        height: 6, borderRadius: 4,
                        background: teamsLeft === 0 ? "#f59e0b" : "var(--accent)",
                        transition: "width 0.4s ease"
                      }} />
                    </div>
                  </div>

                  {/* Footer info */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                    <span>{t.playersPerTeam} players/team</span>
                    {t.status === "registration" && (
                      <span style={{ color: teamsLeft > 0 ? "var(--success)" : "#f59e0b", fontWeight: 500 }}>
                        {teamsLeft > 0 ? `${teamsLeft} spots left` : "Full"}
                      </span>
                    )}
                    {t.status === "completed" && t.winnerName && (
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                        🏆 {t.winnerName}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentList;