import { useState } from "react";
import API from "../services/api";

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 24, padding: 0, lineHeight: 1,
            color: star <= (hovered || value) ? "#f59e0b" : "var(--border)",
            transition: "color 0.1s"
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const sportsmanshipLabels = {
  1: "Poor",
  2: "Below Average",
  3: "Good",
  4: "Very Good",
  5: "Excellent"
};

function RatePlayersModal({ matchId, players, currentUserId, onClose, onDone }) {
  const [ratings, setRatings] = useState(
    players
      .filter(p => {
        const pid = p.user?._id?.toString() || p.user?.toString();
        return pid !== currentUserId;
      })
      .map(p => ({
        userId: p.user?._id?.toString() || p.user?.toString(),
        name: p.user?.name || "Player",
        team: p.team,
        sportsmanship: 0,
        comment: ""
      }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const updateRating = (userId, field, value) => {
    setRatings(prev => prev.map(r =>
      r.userId === userId ? { ...r, [field]: value } : r
    ));
  };

  const handleSubmit = async () => {
    const toSubmit = ratings.filter(r => r.sportsmanship > 0);
    if (toSubmit.length === 0) return alert("Please rate at least one player");

    try {
      setSubmitting(true);
      await API.post(`/matches/${matchId}/rate`, { ratings: toSubmit });
      setDone(true);
      setTimeout(() => { onDone?.(); onClose(); }, 1500);
    } catch (err) {
      alert(err.response?.data?.msg || "Rating failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16
    }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: 24,
        width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "var(--card-shadow-hover)"
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
              Rate Your Players
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              Rate sportsmanship of players you played with
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, color: "var(--text-muted)", lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {done ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>🎉</p>
            <p style={{ fontWeight: 600, color: "var(--success)", fontSize: 16 }}>
              Ratings submitted!
            </p>
          </div>
        ) : (
          <>
            <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {ratings.map(r => (
                <div
                  key={r.userId}
                  style={{
                    background: "var(--bg-primary)", borderRadius: 16,
                    padding: 16, border: "1px solid var(--border)"
                  }}
                >
                  {/* Player info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: r.team === "A"
                        ? "rgba(59,130,246,0.2)"
                        : "rgba(139,92,246,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: r.team === "A" ? "var(--accent)" : "#8b5cf6",
                      fontWeight: 700, fontSize: 16, flexShrink: 0
                    }}>
                      {r.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>
                        {r.name}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Team {r.team}
                      </p>
                    </div>
                  </div>

                  {/* Sportsmanship stars */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>
                      Sportsmanship
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <StarRating
                        value={r.sportsmanship}
                        onChange={val => updateRating(r.userId, "sportsmanship", val)}
                      />
                      {r.sportsmanship > 0 && (
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: r.sportsmanship >= 4 ? "var(--success)"
                            : r.sportsmanship === 3 ? "#f59e0b"
                            : "var(--danger)"
                        }}>
                          {sportsmanshipLabels[r.sportsmanship]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Optional comment */}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Comment (optional)
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Great teamwork!"
                      maxLength={200}
                      value={r.comment}
                      onChange={e => updateRating(r.userId, "comment", e.target.value)}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 10,
                        border: "1px solid var(--border)", background: "var(--bg-card)",
                        color: "var(--text-primary)", fontSize: 13, outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
              <button
                onClick={handleSubmit}
                disabled={submitting || ratings.every(r => r.sportsmanship === 0)}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  background: ratings.some(r => r.sportsmanship > 0) ? "var(--accent)" : "var(--border)",
                  color: ratings.some(r => r.sportsmanship > 0) ? "white" : "var(--text-muted)",
                  fontWeight: 600, fontSize: 15, border: "none",
                  cursor: submitting || ratings.every(r => r.sportsmanship === 0) ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? "Submitting..." : "Submit Ratings"}
              </button>
              <button
                onClick={onClose}
                style={{
                  width: "100%", padding: "10px", borderRadius: 12,
                  background: "none", color: "var(--text-muted)",
                  border: "none", cursor: "pointer", fontSize: 14, marginTop: 8
                }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RatePlayersModal;