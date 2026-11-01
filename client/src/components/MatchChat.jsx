import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ArrowUp, Lock, Unlock, Users, ShieldAlert } from "lucide-react";
import API, { BASE_URL } from "../services/api";

let socket = null;

export default function MatchChat({ matchId, isApproved, isHost }) {
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

    socket = io(BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

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

    socket.on("chatVisibility", ({ chatOpenForAll }) => {
      setChatOpenForAll(chatOpenForAll);
    });

    socket.on("chatVisibilityChanged", ({ chatOpenForAll }) => {
      setChatOpenForAll(chatOpenForAll);
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
    socket.emit("sendMessage", { matchId, text: text.trim() });
    setText("");
  };

  const handleToggleChat = async () => {
    try {
      setToggling(true);
      const res = await API.post(`/matches/${matchId}/toggle-chat`);
      setChatOpenForAll(res.data.chatOpenForAll);
      socket?.emit("notifyChatToggle", { matchId, chatOpenForAll: res.data.chatOpenForAll });
      socket?.emit("joinMatchRoom", { matchId });
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to toggle chat visibility");
    } finally {
      setToggling(false);
    }
  };

  if (!isApproved) {
    return (
      <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>Match squad chat is reserved for approved participating athletes.</span>
      </div>
    );
  }

  return (
    <div className="mt-6 apple-double-bezel shadow-lg">
      <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-4 sm:p-6 space-y-4">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Squad Channel
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                connected
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-500/10 text-slate-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span>{connected ? "Live" : "Connecting"}</span>
            </span>
          </div>

          {isHost && (
            <button
              type="button"
              onClick={handleToggleChat}
              disabled={toggling}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                chatOpenForAll
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {chatOpenForAll ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{chatOpenForAll ? "Restrict to Host" : "Open for Squad"}</span>
            </button>
          )}
        </div>

        {/* Visibility banner */}
        {!isHost && (
          <div className="text-[11px] px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              {chatOpenForAll
                ? "Open Squad Chat — All approved player messages visible."
                : "Restricted Broadcast — Only match host announcements visible."}
            </span>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 font-semibold">{error}</p>
        )}

        {/* iMessage-Style Messages Stream */}
        <div className="p-3 sm:p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 h-72 overflow-y-auto space-y-2.5">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No messages yet in this match. Coordinate tactics and pitch arrival!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender?._id === userId || msg.sender === userId;
              const isHostMsg = msg.isHostMessage;

              return (
                <div
                  key={msg._id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {msg.sender?.name || "Player"}
                      </span>
                      {isHostMsg && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Host
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`px-3.5 py-2 text-xs sm:text-sm leading-relaxed max-w-[80%] shadow-sm ${
                      isMe
                        ? "bg-[#007aff] text-white rounded-[16px] rounded-br-[4px]"
                        : "bg-[#e9e9eb] dark:bg-[#26252a] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-[16px] rounded-bl-[4px]"
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type squad message..."
            maxLength={500}
            className="flex-1 px-4 py-2.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            disabled={!text.trim() || !connected}
            className="w-9 h-9 rounded-full bg-[#007aff] hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-30 shadow-md shadow-blue-500/25 shrink-0"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
