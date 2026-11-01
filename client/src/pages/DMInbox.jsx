import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function timeAgo(date) {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function DMInbox() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/dm/conversations")
      .then((res) => setConversations(res.data.conversations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading messages...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "32px 24px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 28, color: "var(--text-primary)" }}>
            Messages
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Direct messages with your friends
          </p>
        </div>

        {/* Conversation list */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 44, marginBottom: 12 }}>💬</p>
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No messages yet</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                Friends list se kisi ko message karo
              </p>
            </div>
          ) : (
            conversations.map((conv, i) => (
              <div
                key={conv._id}
                onClick={() => navigate(`/dm/${conv.friend?._id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "16px 20px", cursor: "pointer",
                  borderBottom: i < conversations.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.15s",
                  background: conv.unread > 0 ? "rgba(59,130,246,0.03)" : "transparent"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.background = conv.unread > 0 ? "rgba(59,130,246,0.03)" : "transparent"}
              >
                {/* Avatar with unread badge */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: 18
                  }}>
                    {conv.friend?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  {conv.unread > 0 && (
                    <span style={{
                      position: "absolute", top: -2, right: -2,
                      background: "#ef4444", color: "white",
                      fontSize: 10, fontWeight: 700,
                      width: 18, height: 18, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <span style={{
                      fontWeight: conv.unread > 0 ? 700 : 600,
                      color: "var(--text-primary)", fontSize: 15
                    }}>
                      {conv.friend?.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, marginLeft: 8 }}>
                      {timeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: conv.unread > 0 ? "var(--text-secondary)" : "var(--text-muted)",
                    fontWeight: conv.unread > 0 ? 500 : 400,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    {conv.lastMessage || "Conversation shuru karo..."}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DMInbox;