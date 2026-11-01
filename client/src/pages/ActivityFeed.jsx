import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import { BASE_URL } from "../services/api";
let feedSocket = null;

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

function getActivityText(activity) {
  const name = activity.actor?.name || "Someone";
  const sport = activity.sport || activity.match?.sport || "";
  const emoji = getSportEmoji(sport);
  const target = activity.targetUser?.name || "a friend";

  switch (activity.type) {
    case "match_created":
      return { icon: emoji, text: `${name} has created ${sport} match` };
    case "match_joined":
      return { icon: emoji, text: `${name} has joined  ${sport} match` };
    case "match_completed":
      return {
        icon: "🏆",
        text: `${name}'s ${sport} match has been completed — Team ${activity.winnerTeam} won!`
      };
    case "friend_added":
  return { icon: "👥", text: `${name} and ${target} are now friends` };
default:
  return { icon: "📌", text: `${name} did something` };
  }
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ActivityFeed() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchFeed = useCallback(async () => {
    try {
      const res = await API.get("/activity/feed");
      setActivities(res.data.activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // ✅ Real-time — naya activity aaye toh top pe add karo
  useEffect(() => {
    if (!token) return;

feedSocket = io(BASE_URL, { auth: { token } });
    feedSocket.on("activity:new", (activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 50));
    });

    return () => {
      feedSocket?.disconnect();
      feedSocket = null;
    };
  }, [token]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg-primary)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <p style={{ color: "var(--text-muted)" }}>Loading feed...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-primary)",
      padding: "32px 24px", display: "flex", justifyContent: "center"
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "Outfit, sans-serif", fontWeight: 700,
            fontSize: 28, color: "var(--text-primary)"
          }}>
            Activity Feed
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Your friends' latest activities
          </p>
        </div>

        {/* Feed */}
        {activities.length === 0 ? (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 48, textAlign: "center",
            boxShadow: "var(--card-shadow)"
          }}>
            <p style={{ fontSize: 44, marginBottom: 12 }}>📭</p>
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>There is no activity right now.</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
              Add friends or join matches — activities will appear here.
            </p>
          </div>
        ) : (
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, overflow: "hidden", boxShadow: "var(--card-shadow)"
          }}>
            {activities.map((activity, i) => {
              const { icon, text } = getActivityText(activity);
              const isClickable = ["match_created", "match_joined", "match_completed"]
                .includes(activity.type) && activity.match?._id;

              return (
                <div
                  key={activity._id}
                  onClick={() => isClickable && navigate(`/match/${activity.match._id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px",
                    borderBottom: i < activities.length - 1 ? "1px solid var(--border)" : "none",
                    cursor: isClickable ? "pointer" : "default",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={e => {
                    if (isClickable) e.currentTarget.style.background = "var(--bg-primary)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0
                  }}>
                    {icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, color: "var(--text-primary)",
                      lineHeight: 1.5
                    }}>
                      {text}
                    </p>
                    {activity.match?.location?.name && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        📍 {activity.match.location.name}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <span style={{
                    fontSize: 11, color: "var(--text-muted)",
                    flexShrink: 0, marginLeft: 8
                  }}>
                    {timeAgo(activity.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh button */}
        {activities.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={fetchFeed}
              style={{
                background: "var(--bg-card)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "8px 20px", fontSize: 13,
                color: "var(--text-secondary)", cursor: "pointer"
              }}
            >
              ↺ Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeed;