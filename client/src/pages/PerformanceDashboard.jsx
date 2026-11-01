import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from "recharts";

const SPORT_EMOJIS = {
  Cricket: "🏏", Football: "⚽", Basketball: "🏀", Tennis: "🎾",
  Badminton: "🏸", Volleyball: "🏐", Kabaddi: "🤼", Hockey: "🏑",
  "Table Tennis": "🏓", Swimming: "🏊", Athletics: "🏃", Boxing: "🥊"
};

// ── Stat card ─────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 20, padding: "20px", boxShadow: "var(--card-shadow)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{label}</p>
      </div>
      <p style={{
        fontFamily: "Outfit, sans-serif", fontWeight: 700,
        fontSize: 32, color: color || "var(--text-primary)", lineHeight: 1
      }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

// ── Custom tooltip for charts ─────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "10px 14px", fontSize: 13
    }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ── ELO tier badge ────────────────────────────────────────
function EloTier({ rating }) {
  const r = rating || 1000;
  const tier = r >= 1400 ? { label: "Diamond", color: "#60a5fa", emoji: "💎" }
    : r >= 1200 ? { label: "Gold", color: "#f59e0b", emoji: "🥇" }
    : r >= 1000 ? { label: "Silver", color: "#9ca3af", emoji: "🥈" }
    : { label: "Bronze", color: "#d97706", emoji: "🥉" };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: `${tier.color}18`, border: `1px solid ${tier.color}40`,
      borderRadius: 20, padding: "4px 12px"
    }}>
      <span style={{ fontSize: 14 }}>{tier.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: tier.color }}>
        {tier.label} — {r} ELO
      </span>
    </div>
  );
}

function PerformanceDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/users/me/performance");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch performance data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <p style={{ color: "var(--text-muted)" }}>Loading your stats...</p>
    </div>
  );

  if (!data) return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <p style={{ color: "var(--danger)" }}>Failed to load performance data</p>
    </div>
  );

  const { stats, winLossTrend, sportBreakdown, monthlyActivity } = data;

  const winLossChartData = winLossTrend.map(d => ({
    ...d,
    wins: d.result === 1 ? 1 : 0,
    losses: d.result === 0 ? 1 : 0
  }));

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "24px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Header ───────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "8px 14px", fontSize: 13,
              cursor: "pointer", color: "var(--text-secondary)"
            }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontWeight: 700,
              fontSize: 26, color: "var(--text-primary)"
            }}>
              📊 Performance Dashboard
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 2 }}>
              Your complete sports performance overview
            </p>
          </div>
        </div>

        {/* ── ELO Tier ─────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <EloTier rating={stats.rating} />
        </div>

        {/* ── Top stats grid ────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12, marginBottom: 24
        }}>
          <StatCard
            emoji="🎮" label="Matches Played"
            value={stats.matchesPlayed} color="var(--text-primary)"
          />
          <StatCard
            emoji="🏆" label="Total Wins"
            value={stats.wins} color="var(--success)"
            sub={`${stats.winRate}% win rate`}
          />
          <StatCard
            emoji="🌟" label="Man of the Match"
            value={stats.motmCount} color="#f59e0b"
            sub="Times awarded"
          />
          <StatCard
            emoji="🏅" label="Badges Earned"
            value={stats.badges} color="var(--accent)"
            sub="Total achievements"
          />
        </div>

        {/* ── Streak + Reliability row ──────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12, marginBottom: 24
        }}>
          {/* Current streak */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 20, boxShadow: "var(--card-shadow)"
          }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Current Streak</p>
            {stats.currentWinStreak > 0 ? (
              <div>
                <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--success)" }}>
                  🔥 {stats.currentWinStreak}W
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Win streak
                </p>
              </div>
            ) : stats.currentLossStreak > 0 ? (
              <div>
                <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--danger)" }}>
                  📉 {stats.currentLossStreak}L
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Loss streak
                </p>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No matches yet</p>
            )}
          </div>

          {/* Reliability */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 20, boxShadow: "var(--card-shadow)"
          }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Reliability Score</p>
            <p style={{
              fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28,
              color: stats.reliabilityScore >= 80 ? "var(--success)"
                : stats.reliabilityScore >= 60 ? "#f59e0b" : "var(--danger)"
            }}>
              {stats.reliabilityScore}/100
            </p>
            <div style={{ background: "var(--border)", borderRadius: 4, height: 6, marginTop: 8 }}>
              <div style={{
                width: `${stats.reliabilityScore}%`, height: 6, borderRadius: 4,
                background: stats.reliabilityScore >= 80 ? "var(--success)"
                  : stats.reliabilityScore >= 60 ? "#f59e0b" : "var(--danger)",
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>
        </div>

        {/* ── Win/Loss Trend ────────────────────────────── */}
        {winLossTrend.length > 0 && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 24, padding: 24, marginBottom: 20, boxShadow: "var(--card-shadow)"
          }}>
            <h2 style={{
              fontFamily: "Outfit, sans-serif", fontWeight: 600,
              fontSize: 16, color: "var(--text-primary)", marginBottom: 6
            }}>
              📈 Last {winLossTrend.length} Matches — Win/Loss Trend
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
              Green = Win, Red = Loss
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={winLossTrend} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="result" radius={[6, 6, 0, 0]}>
                  {winLossTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.result === 1 ? "#22c55e" : "#ef4444"}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* W/L legend below chart */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {winLossTrend.map((d, i) => (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: d.result === 1 ? "var(--success)" : "var(--danger)"
                  }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{d.sport?.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Monthly Activity ──────────────────────────── */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 24, padding: 24, marginBottom: 20, boxShadow: "var(--card-shadow)"
        }}>
          <h2 style={{
            fontFamily: "Outfit, sans-serif", fontWeight: 600,
            fontSize: 16, color: "var(--text-primary)", marginBottom: 6
          }}>
            📅 Monthly Activity — Last 6 Months
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
            Matches played and won per month
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyActivity} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false} tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "var(--text-muted)", paddingTop: 12 }}
              />
              <Bar dataKey="played" name="Played" fill="#3b82f6" opacity={0.7} radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="won" name="Won" fill="#22c55e" opacity={0.85} radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Sport Breakdown ───────────────────────────── */}
        {sportBreakdown.length > 0 && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 24, padding: 24, marginBottom: 20, boxShadow: "var(--card-shadow)"
          }}>
            <h2 style={{
              fontFamily: "Outfit, sans-serif", fontWeight: 600,
              fontSize: 16, color: "var(--text-primary)", marginBottom: 20
            }}>
              🏅 Sport-wise Performance
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {sportBreakdown
                .sort((a, b) => b.played - a.played)
                .map(s => (
                  <div key={s.sport}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{SPORT_EMOJIS[s.sport] || "🏅"}</span>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                          {s.sport}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {s.motm > 0 && (
                          <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>
                            🌟 {s.motm} MoTM
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {s.won}W {s.played - s.won}L
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: s.winRate >= 50 ? "var(--success)" : "var(--danger)",
                          minWidth: 42, textAlign: "right"
                        }}>
                          {s.winRate}%
                        </span>
                      </div>
                    </div>
                    <div style={{ background: "var(--border)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{
                        width: `${s.winRate}%`, height: "100%",
                        background: s.winRate >= 60 ? "var(--success)"
                          : s.winRate >= 40 ? "#f59e0b" : "var(--danger)",
                        borderRadius: 4, transition: "width 0.5s ease"
                      }} />
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      {s.played} match{s.played !== 1 ? "es" : ""} played
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Sportsmanship ─────────────────────────────── */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 24, padding: 24, marginBottom: 20, boxShadow: "var(--card-shadow)"
        }}>
          <h2 style={{
            fontFamily: "Outfit, sans-serif", fontWeight: 600,
            fontSize: 16, color: "var(--text-primary)", marginBottom: 16
          }}>
            ⭐ Sportsmanship Rating
          </h2>
          {stats.sportsmanshipScore > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(245,158,11,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 24, color: "#f59e0b" }}>
                  {stats.sportsmanshipScore.toFixed(1)}
                </p>
              </div>
              <div>
                <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{
                      fontSize: 22,
                      color: s <= Math.round(stats.sportsmanshipScore) ? "#f59e0b" : "var(--border)"
                    }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Based on ratings from other players
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>⭐</p>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Not rated yet — play more matches!
              </p>
            </div>
          )}
        </div>

        {/* ── Empty state ───────────────────────────────── */}
        {stats.matchesPlayed === 0 && (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 24, padding: 40, textAlign: "center", boxShadow: "var(--card-shadow)"
          }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🏅</p>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 18, color: "var(--text-primary)", marginBottom: 8 }}>
              No matches played yet
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
              Join your first match to start tracking your performance!
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "var(--accent)", color: "white", border: "none",
                borderRadius: 12, padding: "10px 24px", fontSize: 14,
                fontWeight: 600, cursor: "pointer"
              }}
            >
              Find Matches
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default PerformanceDashboard;