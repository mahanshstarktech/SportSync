import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import { BASE_URL } from "../services/api";

let dmSocket = null;

function DMChat() {
  const { friendId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [, setConversationId] = useState(null);
  const [friendInfo, setFriendInfo] = useState(null);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Load messages + friend info
  useEffect(() => {
    const load = async () => {
      try {
        const [msgRes, userRes] = await Promise.all([
          API.get(`/dm/messages/${friendId}`),
          API.get(`/users/${friendId}`),
        ]);
        setMessages(msgRes.data.messages || []);
        setConversationId(msgRes.data.conversationId);
        setFriendInfo(userRes.data.user);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [friendId]);

  // Socket setup
  useEffect(() => {
    if (!token) return;

dmSocket = io(BASE_URL, { auth: { token } });
    dmSocket.on("connect", () => setConnected(true));
    dmSocket.on("disconnect", () => setConnected(false));

    dmSocket.on("dm:receive", ({ message, conversationId: cId }) => {
      // Sirf is conversation ke messages show karo
      if (
        message.sender?._id === friendId ||
        message.sender === friendId
      ) {
        setMessages((prev) => [...prev, message]);
        setConversationId(cId);
      }
    });

    dmSocket.on("dm:sent", ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });

    dmSocket.on("dm:typing", ({ senderId, isTyping: typing }) => {
      if (senderId === friendId) setIsTyping(typing);
    });

    dmSocket.on("dm:error", ({ message }) => {
      alert(message);
    });

    return () => {
      dmSocket?.disconnect();
      dmSocket = null;
    };
  }, [token, friendId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!text.trim() || !dmSocket) return;
    dmSocket.emit("dm:send", { receiverId: friendId, text: text.trim() });
    setText("");
    clearTimeout(typingTimeout.current);
    dmSocket.emit("dm:typing", { receiverId: friendId, isTyping: false });
  };

  const handleTyping = (val) => {
    setText(val);
    if (!dmSocket) return;
    dmSocket.emit("dm:typing", { receiverId: friendId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      dmSocket?.emit("dm:typing", { receiverId: friendId, isTyping: false });
    }, 1500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading chat...</p>
      </div>
    );
  }

  return (
    <div style={{
      height: "calc(100vh - 64px)",
      background: "var(--bg-primary)",
      display: "flex", flexDirection: "column",
      maxWidth: 680, margin: "0 auto"
    }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px",
        background: "var(--bg-card)", borderBottom: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)"
      }}>
        <button
          onClick={() => navigate("/dm")}
          style={{
            background: "var(--bg-primary)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer",
            color: "var(--text-secondary)", fontSize: 13
          }}
        >
          ← Back
        </button>

        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0
        }}>
          {friendInfo?.name?.charAt(0).toUpperCase() || "?"}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 15 }}>
            {friendInfo?.name || "Loading..."}
          </p>
          <p style={{ fontSize: 11, color: connected ? "var(--success)" : "var(--text-muted)" }}>
            {connected ? "● Online" : "Connecting..."}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 8
      }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center" }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>👋</p>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
               Send the first message to {friendInfo?.name}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine =
            msg.sender?._id === userId || msg.sender === userId;
          return (
            <div
              key={msg._id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
                alignSelf: isMine ? "flex-end" : "flex-start",
                maxWidth: "72%"
              }}
            >
              <div style={{
                padding: "9px 14px",
                borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isMine ? "var(--accent)" : "var(--bg-card)",
                border: isMine ? "none" : "1px solid var(--border)",
                color: isMine ? "white" : "var(--text-primary)",
                fontSize: 14, lineHeight: 1.5
              }}>
                {msg.text}
                {isMine && (
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 6 }}>
                    {msg.read ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 10, color: "var(--text-muted)",
                marginTop: 3, marginLeft: 4, marginRight: 4
              }}>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{
            display: "flex", alignSelf: "flex-start",
            padding: "9px 14px", borderRadius: "18px 18px 18px 4px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            fontSize: 13, color: "var(--text-muted)", fontStyle: "italic"
          }}>
            {friendInfo?.name} typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 20px",
        background: "var(--bg-card)", borderTop: "1px solid var(--border)",
        display: "flex", gap: 8
      }}>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Message"
          maxLength={1000}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 24,
            border: "1px solid var(--border)", background: "var(--bg-primary)",
            color: "var(--text-primary)", fontSize: 14, outline: "none"
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || !connected}
          style={{
            background: text.trim() && connected ? "var(--accent)" : "var(--border)",
            color: text.trim() && connected ? "white" : "var(--text-muted)",
            border: "none", borderRadius: 24, padding: "10px 20px",
            fontSize: 14, fontWeight: 600,
            cursor: !text.trim() || !connected ? "not-allowed" : "pointer",
            transition: "all 0.15s"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default DMChat;