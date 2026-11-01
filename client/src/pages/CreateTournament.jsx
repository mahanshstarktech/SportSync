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

function CreateTournament() {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState("");
  const [location, setLocation] = useState({ name: "", lat: "", lng: "" });
  const [form, setForm] = useState({
    name: "", description: "", maxTeams: 4,
    playersPerTeam: 5, startDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  useEffect(() => {
    API.get("/friends")
      .then(res => setFriends(res.data.friends || []))
      .catch(() => {});
  }, []);

  const toggleFriend = (id) => {
    setSelectedFriends(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSport) return alert("Please select a sport");
    if (!location.name) return alert("Please select a location");
    if (!form.name.trim()) return alert("Tournament name is required");

    try {
      setLoading(true);
      const res = await API.post("/tournaments", {
        name: form.name.trim(),
        sport: selectedSport,
        description: form.description.trim(),
        location: {
          name: location.name,
          coordinates: {
            type: "Point",
            coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
          }
        },
        maxTeams: Number(form.maxTeams),
        playersPerTeam: Number(form.playersPerTeam),
        startDate: form.startDate
      });

      // Invite friends if selected
      if (selectedFriends.length > 0 && res.data.tournament?._id) {
        await API.post(`/tournaments/${res.data.tournament._id}/invite`, {
          friendIds: selectedFriends
        });
      }

      navigate(`/tournaments/${res.data.tournament._id}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "24px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--text-primary)" }}>
            Create Tournament
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Organize a competitive tournament for your community
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "var(--card-shadow)" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 14 }}>
              Tournament Details
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Tournament Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Summer Cricket Cup 2025"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--bg-primary)",
                  color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                Description (optional)
              </label>
              <textarea
                placeholder="Tell players about this tournament..."
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--bg-primary)",
                  color: "var(--text-primary)", fontSize: 14, outline: "none",
                  boxSizing: "border-box", resize: "vertical", fontFamily: "inherit"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Max Teams
                </label>
                <select
                  value={form.maxTeams}
                  onChange={e => setForm({ ...form, maxTeams: Number(e.target.value) })}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--bg-primary)",
                    color: "var(--text-primary)", fontSize: 14, outline: "none"
                  }}
                >
                  <option value={4}>4 Teams</option>
                  <option value={8}>8 Teams</option>
                  <option value={16}>16 Teams</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Players Per Team
                </label>
                <input
                  type="number" min={1} max={15} placeholder="e.g. 5"
                  required
                  value={form.playersPerTeam}
                  onChange={e => setForm({ ...form, playersPerTeam: e.target.value })}
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--bg-primary)",
                    color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sport */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "var(--card-shadow)" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 14 }}>
              Select Sport
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {SPORTS.map(sport => (
                <button
                  type="button"
                  key={sport.name}
                  onClick={() => setSelectedSport(sport.name)}
                  style={{
                    padding: "10px 6px", borderRadius: 12, cursor: "pointer",
                    border: selectedSport === sport.name ? "2px solid var(--accent)" : "2px solid var(--border)",
                    background: selectedSport === sport.name ? "rgba(59,130,246,0.08)" : "var(--bg-primary)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.15s"
                  }}
                >
                  <span style={{ fontSize: 20 }}>{sport.emoji}</span>
                  <span style={{
                    fontSize: 10, fontWeight: selectedSport === sport.name ? 600 : 400,
                    color: selectedSport === sport.name ? "var(--accent)" : "var(--text-secondary)"
                  }}>
                    {sport.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "var(--card-shadow)" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>
              Location
            </p>
            <LocationSearchInput onSelect={({ name, lat, lng }) => setLocation({ name, lat, lng })} />
            {location.name && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}>📍 {location.name}</p>
              </div>
            )}
          </div>

          {/* Start Date */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: "var(--card-shadow)" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>
              Start Date
            </p>
            <input
              type="datetime-local"
              required
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              style={{
                width: "100%", padding: "11px 14px", borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--bg-primary)",
                color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          {/* Invite Friends */}
          {friends.length > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20, marginBottom: 24, boxShadow: "var(--card-shadow)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                  👥 Invite Friends
                </p>
                {selectedFriends.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(59,130,246,0.1)", color: "var(--accent)" }}>
                    {selectedFriends.length} selected
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {friends.map(friend => {
                  const isSelected = selectedFriends.includes(friend._id);
                  return (
                    <div
                      key={friend._id}
                      onClick={() => toggleFriend(friend._id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                        border: isSelected ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                        background: isSelected ? "rgba(59,130,246,0.05)" : "var(--bg-primary)",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: isSelected ? "var(--accent)" : "linear-gradient(135deg, var(--accent), #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0
                      }}>
                        {friend.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: isSelected ? "var(--accent)" : "var(--text-primary)" }}>
                          {friend.name}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{friend.skillLevel}</p>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        border: isSelected ? "none" : "2px solid var(--border)",
                        background: isSelected ? "var(--accent)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, transition: "all 0.15s"
                      }}>
                        {isSelected && <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedSport || !location.name || !form.name}
            style={{
              width: "100%", padding: "14px", borderRadius: 14,
              background: !selectedSport || !location.name || !form.name ? "var(--border)" : "var(--accent)",
              color: !selectedSport || !location.name || !form.name ? "var(--text-muted)" : "white",
              fontWeight: 700, fontSize: 16, border: "none",
              cursor: loading || !selectedSport || !location.name || !form.name ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, transition: "all 0.15s"
            }}
          >
            {loading ? "Creating..." : "Create Tournament 🏆"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateTournament;