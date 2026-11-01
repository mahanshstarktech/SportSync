import { useState } from "react";
import API from "../services/api";

// Sport-specific stat fields config
const SPORT_FIELDS = {
  Cricket: [
    { key: "runs",    label: "Runs Scored",   type: "number", min: 0, placeholder: "e.g. 45" },
    { key: "wickets", label: "Wickets Taken",  type: "number", min: 0, placeholder: "e.g. 2" },
    { key: "catches", label: "Catches",        type: "number", min: 0, placeholder: "e.g. 1" }
  ],
  Football: [
    { key: "goals",      label: "Goals",       type: "number", min: 0, placeholder: "e.g. 2" },
    { key: "assists",    label: "Assists",      type: "number", min: 0, placeholder: "e.g. 1" },
    { key: "cleanSheet", label: "Clean Sheet (Goalkeeper)", type: "checkbox" }
  ],
  Basketball: [
    { key: "points",       label: "Points",        type: "number", min: 0, placeholder: "e.g. 18" },
    { key: "rebounds",     label: "Rebounds",       type: "number", min: 0, placeholder: "e.g. 7" },
    { key: "threePointers",label: "3-Pointers",     type: "number", min: 0, placeholder: "e.g. 2" }
  ],
  Badminton: [
    { key: "setsWon",     label: "Sets Won",    type: "number", min: 0, placeholder: "e.g. 2" },
    { key: "setsLost",    label: "Sets Lost",   type: "number", min: 0, placeholder: "e.g. 1" },
    { key: "comebackWin", label: "Comeback Win (won after losing first set)", type: "checkbox" }
  ],
  Tennis: [
    { key: "setsWon",     label: "Sets Won",    type: "number", min: 0, placeholder: "e.g. 2" },
    { key: "setsLost",    label: "Sets Lost",   type: "number", min: 0, placeholder: "e.g. 0" },
    { key: "comebackWin", label: "Comeback Win (won after losing first set)", type: "checkbox" }
  ],
  "Table Tennis": [
    { key: "setsWon",     label: "Sets Won",    type: "number", min: 0, placeholder: "e.g. 3" },
    { key: "setsLost",    label: "Sets Lost",   type: "number", min: 0, placeholder: "e.g. 1" },
    { key: "comebackWin", label: "Comeback Win", type: "checkbox" }
  ],
  Volleyball: [
    { key: "kills",  label: "Kills (Attack Points)", type: "number", min: 0, placeholder: "e.g. 8" },
    { key: "aces",   label: "Aces (Service Points)",  type: "number", min: 0, placeholder: "e.g. 3" },
    { key: "blocks", label: "Blocks",                  type: "number", min: 0, placeholder: "e.g. 2" }
  ],
  Kabaddi: [
    { key: "raidPoints",   label: "Raid Points",   type: "number", min: 0, placeholder: "e.g. 6" },
    { key: "tacklePoints", label: "Tackle Points", type: "number", min: 0, placeholder: "e.g. 3" }
  ],
  Hockey: [
    { key: "goalsHockey",    label: "Goals",           type: "number", min: 0, placeholder: "e.g. 2" },
    { key: "penaltyCorners", label: "Penalty Corners", type: "number", min: 0, placeholder: "e.g. 1" }
  ],
  Swimming: [
    { key: "setsWon", label: "Races Won", type: "number", min: 0, placeholder: "e.g. 1" }
  ],
  Athletics: [
    { key: "setsWon", label: "Events Won", type: "number", min: 0, placeholder: "e.g. 1" }
  ],
  Boxing: [
    { key: "setsWon", label: "Rounds Won", type: "number", min: 0, placeholder: "e.g. 3" }
  ]
};

function StatsSubmitModal({ matchId, sport, onClose, onDone }) {
  const fields = SPORT_FIELDS[sport] || SPORT_FIELDS["Cricket"];
  const [values, setValues] = useState(
    fields.reduce((acc, f) => ({
      ...acc,
      [f.key]: f.type === "checkbox" ? false : ""
    }), {})
  );
  const [submitting, setSubmitting] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [done, setDone] = useState(false);

  const handleChange = (key, value, type) => {
    setValues(prev => ({
      ...prev,
      [key]: type === "checkbox" ? value : value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Convert numeric strings to numbers
      const statsPayload = {};
      fields.forEach(f => {
        if (f.type === "checkbox") {
          statsPayload[f.key] = values[f.key];
        } else {
          const num = parseInt(values[f.key]) || 0;
          if (num > 0) statsPayload[f.key] = num;
        }
      });

      const res = await API.post(`/matches/${matchId}/stats`, { stats: statsPayload });
      setNewBadges(res.data.newBadges || []);
      setDone(true);

      setTimeout(() => { onDone?.(); onClose(); }, newBadges.length > 0 ? 3000 : 1500);
    } catch (err) {
      alert(err.response?.data?.msg || "Stats submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const sportEmojis = {
    Cricket: "🏏", Football: "⚽", Basketball: "🏀", Tennis: "🎾",
    Badminton: "🏸", Volleyball: "🏐", Kabaddi: "🤼", Hockey: "🏑",
    "Table Tennis": "🏓", Swimming: "🏊", Athletics: "🏃", Boxing: "🥊"
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
        width: "100%", maxWidth: 440,
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
              {sportEmojis[sport] || "🏅"} Submit Your Stats
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {sport} — Enter your performance in this match
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {done ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>✅</p>
            <p style={{ fontWeight: 600, color: "var(--success)", fontSize: 16, marginBottom: 12 }}>
              Stats submitted!
            </p>
            {newBadges.length > 0 && (
              <div>
                <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 10 }}>
                  🏆 New badges unlocked!
                </p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {newBadges.map(b => (
                    <div key={b.id} style={{
                      background: "var(--bg-primary)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: "10px 14px", textAlign: "center", minWidth: 100
                    }}>
                      <p style={{ fontSize: 24, marginBottom: 4 }}>{b.emoji}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{b.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {fields.map(field => (
                <div key={field.key}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 10,
                    fontSize: 13, fontWeight: 500, color: "var(--text-secondary)",
                    marginBottom: field.type !== "checkbox" ? 8 : 0,
                    cursor: field.type === "checkbox" ? "pointer" : "default"
                  }}>
                    {field.type === "checkbox" && (
                      <input
                        type="checkbox"
                        checked={values[field.key] || false}
                        onChange={e => handleChange(field.key, e.target.checked, "checkbox")}
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                    )}
                    {field.label}
                  </label>

                  {field.type === "number" && (
                    <input
                      type="number"
                      min={field.min || 0}
                      placeholder={field.placeholder}
                      value={values[field.key]}
                      onChange={e => handleChange(field.key, e.target.value, "number")}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: 12,
                        border: "1px solid var(--border)", background: "var(--bg-primary)",
                        color: "var(--text-primary)", fontSize: 14, outline: "none",
                        boxSizing: "border-box"
                      }}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                  )}
                </div>
              ))}

              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Leave fields empty if not applicable. Stats help unlock sport-specific badges on your profile.
              </p>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  background: "var(--accent)", color: "white",
                  fontWeight: 600, fontSize: 15, border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? "Submitting..." : "Submit Stats 📊"}
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

export default StatsSubmitModal;