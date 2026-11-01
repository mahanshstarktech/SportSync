import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import LocationSearchInput from "../components/LocationSearchInput";

const SPORTS = [
  { name: "Cricket", emoji: "🏏" },
  { name: "Football", emoji: "⚽" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Tennis", emoji: "🎾" },
  { name: "Badminton", emoji: "🏸" },
  { name: "Volleyball", emoji: "🏐" },
  { name: "Kabaddi", emoji: "🤼" },
  { name: "Hockey", emoji: "🏑" },
  { name: "Table Tennis", emoji: "🏓" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Athletics", emoji: "🏃" },
  { name: "Boxing", emoji: "🥊" },
];

function CreateMatch() {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState("");
  const [form, setForm] = useState({ date: "", maxPlayers: "" });
  const [location, setLocation] = useState({ name: "", lat: "", lng: "" });
  const [loading, setLoading] = useState(false);

  // ✅ Play Together
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  useEffect(() => {
    API.get("/friends")
      .then((res) => setFriends(res.data.friends || []))
      .catch(() => {});
  }, []);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const handleLocationSelect = ({ name, lat, lng }) => {
    setLocation({ name, lat, lng });
  };

  const createMatch = async (e) => {
    e.preventDefault();
    if (!selectedSport) return alert("Please select a sport ❌");
    if (!location.name || !location.lat || !location.lng)
      return alert("Please select a location from suggestions ❌");

    try {
      setLoading(true);
      const res = await API.post("/matches", {
        sport: selectedSport,
        location: {
          name: location.name,
          coordinates: {
            type: "Point",
            coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
          },
        },
        date: new Date(form.date).toISOString(),
        maxPlayers: Number(form.maxPlayers),
      });

      // ✅ Friends selected hain toh invite bhejo
      if (selectedFriends.length > 0 && res.data.match?._id) {
        await API.post(`/matches/${res.data.match._id}/invite`, {
          friendIds: selectedFriends,
        });
      }

      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.msg || "Create failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "32px 24px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              fontSize: 28,
              color: "var(--text-primary)",
            }}
          >
            Create Match
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Set up a match and invite players
          </p>
        </div>

        <form onSubmit={createMatch}>
          {/* Sport selection */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              boxShadow: "var(--card-shadow)",
            }}
          >
            <p
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                marginBottom: 14,
              }}
            >
              Select Sport
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
              }}
            >
              {SPORTS.map((sport) => (
                <button
                  type="button"
                  key={sport.name}
                  onClick={() => setSelectedSport(sport.name)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border:
                      selectedSport === sport.name
                        ? "2px solid var(--accent)"
                        : "2px solid var(--border)",
                    background:
                      selectedSport === sport.name
                        ? "rgba(59,130,246,0.08)"
                        : "var(--bg-primary)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.15s",
                    transform:
                      selectedSport === sport.name ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{sport.emoji}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: selectedSport === sport.name ? 600 : 400,
                      color:
                        selectedSport === sport.name
                          ? "var(--accent)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {sport.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              boxShadow: "var(--card-shadow)",
            }}
          >
            <p
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                marginBottom: 12,
              }}
            >
              Locationn
            </p>
            <LocationSearchInput onSelect={handleLocationSelect} />
            {location.name && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--card-shadow)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  📍 {location.name}
                </p>

                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {parseFloat(location.lat).toFixed(5)},{" "}
                  {parseFloat(location.lng).toFixed(5)}
                </p>
              </div>
            )}
          </div>

          {/* Date & Players */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              boxShadow: "var(--card-shadow)",
            }}
          >
            <p
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                marginBottom: 14,
              }}
            >
              Match Details
            </p>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                Max Players
              </label>
              <input
                type="number"
                min="2"
                max="50"
                placeholder="e.g. 10"
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onChange={(e) =>
                  setForm({ ...form, maxPlayers: e.target.value })
                }
              />
            </div>
          </div>

          {/* ✅ Play Together — Invite Friends */}
          {friends.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 24,
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <p
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--text-primary)",
                  }}
                >
                  👥 Invite Friends
                </p>
                {selectedFriends.length > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: "rgba(59,130,246,0.1)",
                      color: "var(--accent)",
                    }}
                  >
                    {selectedFriends.length} selected
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {friends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend._id);
                  return (
                    <div
                      key={friend._id}
                      onClick={() => toggleFriend(friend._id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        borderRadius: 12,
                        cursor: "pointer",
                        border: isSelected
                          ? "1.5px solid var(--accent)"
                          : "1.5px solid var(--border)",
                        background: isSelected
                          ? "rgba(59,130,246,0.05)"
                          : "var(--bg-primary)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isSelected
                            ? "var(--accent)"
                            : "linear-gradient(135deg, var(--accent), #8b5cf6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 15,
                          flexShrink: 0,
                        }}
                      >
                        {friend.name?.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: isSelected
                              ? "var(--accent)"
                              : "var(--text-primary)",
                          }}
                        >
                          {friend.name}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {friend.skillLevel} · {friend.wins || 0}W{" "}
                          {friend.losses || 0}L
                        </p>
                      </div>

                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          border: isSelected
                            ? "none"
                            : "2px solid var(--border)",
                          background: isSelected
                            ? "var(--accent)"
                            : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                      >
                        {isSelected && (
                          <span
                            style={{
                              color: "white",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedFriends.length > 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 10,
                    textAlign: "center",
                  }}
                >
                  After the match is created, the invite will be sent
                  automatically.
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedSport || !location.name}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              background:
                !selectedSport || !location.name
                  ? "var(--border)"
                  : "var(--accent)",
              color:
                !selectedSport || !location.name
                  ? "var(--text-muted)"
                  : "white",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor:
                loading || !selectedSport || !location.name
                  ? "not-allowed"
                  : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.15s",
            }}
          >
            {loading
              ? "Creating..."
              : selectedFriends.length > 0
                ? `Create & Invite ${selectedFriends.length} Friend${selectedFriends.length > 1 ? "s" : ""} 🚀`
                : "Create Match 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateMatch;
