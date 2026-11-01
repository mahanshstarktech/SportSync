import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import { BASE_URL } from "../services/api";

let socket = null;

function MatchChat({ matchId, isApproved, isHost }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [chatOpenForAll, setChatOpenForAll] = useState(false);
  const [toggling, setToggling] = useState(false);
  const bottomRef = useRef(null);

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isApproved || !token) return;

socket = io(BASE_URL, { auth: { token } });
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinMatchRoom", { matchId });
    });

    socket.on("chatHistory", (history) => {
      setMessages(history);
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // ✅ Receive visibility state
    socket.on("chatVisibility", ({ chatOpenForAll }) => {
      setChatOpenForAll(chatOpenForAll);
    });

    // ✅ When host toggles — update all connected clients
    socket.on("chatVisibilityChanged", ({ chatOpenForAll }) => {
      setChatOpenForAll(chatOpenForAll);
      // Reload messages according to new visibility
      socket.emit("joinMatchRoom", { matchId });
    });

    socket.on("error", ({ msg }) => setError(msg));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socket = null;
    };
  }, [matchId, isApproved, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit("sendMessage", { matchId, text });
    setText("");
  };

  // ✅ Host toggles chat visibility
  const handleToggleChat = async () => {
    try {
      setToggling(true);
      const res = await API.post(`/matches/${matchId}/toggle-chat`);
      setChatOpenForAll(res.data.chatOpenForAll);
      // Notify all clients in room
      socket?.emit("notifyChatToggle", { matchId, chatOpenForAll: res.data.chatOpenForAll });
      // Reload history
      socket?.emit("joinMatchRoom", { matchId });
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to toggle chat");
    } finally {
      setToggling(false);
    }
  };

  if (!isApproved) {
    return (
      <div style={{
        marginTop: 20, padding: 16, borderRadius: 12,
        background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
        textAlign: "center", fontSize: 13, color: "#f59e0b"
      }}>
        Chat is only available for approved players.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>

      {/* Chat header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>
            Match Chat
          </h2>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
            background: connected ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.1)",
            color: connected ? "var(--success)" : "var(--text-muted)"
          }}>
            {connected ? "Live" : "Connecting..."}
          </span>
        </div>

        {/* ✅ Host chat visibility toggle */}
        {isHost && (
          <button
            onClick={handleToggleChat}
            disabled={toggling}
            style={{
              fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
              border: "none", cursor: toggling ? "not-allowed" : "pointer",
              background: chatOpenForAll ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
              color: chatOpenForAll ? "var(--danger)" : "var(--success)",
              transition: "all 0.15s"
            }}
          >
            {toggling ? "..." : chatOpenForAll ? "🔒 Make Private" : "🔓 Open for All"}
          </button>
        )}
      </div>

      {/* Visibility banner for players */}
      {!isHost && (
        <div style={{
          fontSize: 12, padding: "6px 12px", borderRadius: 8, marginBottom: 10,
          background: chatOpenForAll ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
          color: chatOpenForAll ? "var(--success)" : "#f59e0b",
          border: `1px solid ${chatOpenForAll ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`
        }}>
          {chatOpenForAll
            ? "🔓 Chat is open — all player messages are visible"
            : "🔒 Chat is restricted — only host messages are visible to you"}
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{error}</p>}

      {/* Messages */}
      <div style={{
        background: "var(--bg-primary)", border: "1px solid var(--border)",
        borderRadius: 16, padding: 12, height: 280,
        overflowY: "auto", display: "flex", flexDirection: "column", gap: 8
      }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", margin: "auto" }}>
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender?._id === userId || msg.sender === userId;
          const isHostMsg = msg.isHostMessage;
          const onlyMe = msg.onlyVisibleToSelf;

          return (
            <div key={msg._id} style={{
              display: "flex", flexDirection: "column",
              alignItems: isMe ? "flex-end" : "flex-start",
              maxWidth: "75%", alignSelf: isMe ? "flex-end" : "flex-start"
            }}>
              {!isMe && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                    {msg.sender?.name || "Player"}
                  </span>
                  {isHostMsg && (
                    <span style={{ fontSize: 10, background: "rgba(59,130,246,0.1)", color: "var(--accent)", padding: "1px 5px", borderRadius: 6 }}>
                      Host
                    </span>
                  )}
                </div>
              )}

              <div style={{
                padding: "8px 12px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isMe ? "var(--accent)" : "var(--bg-card)",
                border: isMe ? "none" : "1px solid var(--border)",
                color: isMe ? "white" : "var(--text-primary)", fontSize: 14
              }}>
                {msg.text}
                {onlyMe && (
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>(only you)</span>
                )}
              </div>

              <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, marginLeft: 4, marginRight: 4 }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 12,
            border: "1px solid var(--border)", background: "var(--bg-primary)",
            color: "var(--text-primary)", fontSize: 14, outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || !connected}
          style={{
            background: "var(--accent)", color: "white", border: "none",
            borderRadius: 12, padding: "10px 18px", fontSize: 14,
            fontWeight: 600, cursor: !text.trim() || !connected ? "not-allowed" : "pointer",
            opacity: !text.trim() || !connected ? 0.5 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default MatchChat;
