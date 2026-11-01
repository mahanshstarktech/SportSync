import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowUp,
  BarChart2,
  X,
  Reply,
  CheckCheck,
} from "lucide-react";
import API, { BASE_URL } from "../services/api";

const TAPBACKS = [
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "like", emoji: "👍", label: "Like" },
  { type: "dislike", emoji: "👎", label: "Dislike" },
  { type: "laugh", emoji: "😂", label: "Laugh" },
  { type: "emphasize", emoji: "‼️", label: "Emphasize" },
  { type: "question", emoji: "❓", label: "Question" },
];

let dmSocket = null;

export default function DMChat() {
  const { friendId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [friendInfo, setFriendInfo] = useState(null);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // iMessage Advanced Features: Reply, Tapback, Polls
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeTapbackMessageId, setActiveTapbackMessageId] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Load chat history & friend profile
  const loadChat = useCallback(async () => {
    try {
      setLoading(true);
      const [msgRes, userRes] = await Promise.all([
        API.get(`/dm/messages/${friendId}`),
        API.get(`/users/${friendId}`),
      ]);
      setMessages(msgRes.data?.messages || []);
      setFriendInfo(userRes.data?.user);
    } catch (err) {
      console.error("[DMChat Load Error]:", err);
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  // Socket Connection with Advanced iMessage Real-Time Events
  useEffect(() => {
    if (!token) return;

    dmSocket = io(BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    dmSocket.on("connect", () => setConnected(true));
    dmSocket.on("disconnect", () => setConnected(false));

    dmSocket.on("dm:receive", ({ message }) => {
      if (
        message.sender?._id === friendId ||
        message.sender === friendId
      ) {
        setMessages((prev) => [...prev, message]);

        if (message.bubbleEffect === "confetti") {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        }
      }
    });

    dmSocket.on("dm:sent", ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });

    dmSocket.on("dm:typing", ({ senderId, isTyping: typing }) => {
      if (senderId === friendId) {
        setIsTyping(typing);
      }
    });

    // Tapback Reaction Real-Time Update
    dmSocket.on("dm:reaction:update", ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    });

    // Poll Real-Time Update
    dmSocket.on("dm:poll:update", ({ messageId, poll }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, poll } : msg
        )
      );
    });

    dmSocket.on("dm:error", ({ message }) => {
      alert(message || "Message delivery failed");
    });

    return () => {
      dmSocket?.disconnect();
      dmSocket = null;
    };
  }, [token, friendId]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Send message
  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim() || !dmSocket) return;

    const payload = {
      receiverId: friendId,
      text: text.trim(),
    };

    if (replyingTo) {
      payload.replyTo = {
        messageId: replyingTo._id,
        text: replyingTo.text,
        senderName: replyingTo.sender?.name || (replyingTo.sender === userId ? "You" : friendInfo?.name || "Athlete"),
      };
    }

    dmSocket.emit("dm:send", payload);
    setText("");
    setReplyingTo(null);
    clearTimeout(typingTimeout.current);
    dmSocket.emit("dm:typing", { receiverId: friendId, isTyping: false });
  };

  // Typing event emission with debouncing
  const handleTyping = (val) => {
    setText(val);
    if (!dmSocket) return;

    dmSocket.emit("dm:typing", { receiverId: friendId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      dmSocket.emit("dm:typing", { receiverId: friendId, isTyping: false });
    }, 2000);
  };

  // Handle Tapback Reaction
  const handleTapback = (messageId, reactionType) => {
    if (!dmSocket) return;
    dmSocket.emit("dm:reaction", {
      messageId,
      receiverId: friendId,
      reactionType,
    });
    setActiveTapbackMessageId(null);
  };

  // Handle Poll Creation
  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || !dmSocket) return;
    const validOptions = pollOptions.filter((opt) => opt.trim().length > 0);
    if (validOptions.length < 2) {
      alert("Please enter at least 2 poll options.");
      return;
    }

    dmSocket.emit("dm:send", {
      receiverId: friendId,
      poll: {
        question: pollQuestion.trim(),
        options: validOptions,
      },
    });

    setShowPollModal(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  // Vote on Poll
  const handleVotePoll = (messageId, optionIndex) => {
    if (!dmSocket) return;
    dmSocket.emit("dm:poll:vote", {
      messageId,
      receiverId: friendId,
      optionIndex,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col transition-colors duration-300">
      <div className="max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl w-full mx-auto flex-1 flex flex-col p-2 sm:p-4 lg:p-6 h-[100dvh]">
        
        {/* Apple iMessage Header */}
        <div className="apple-double-bezel shadow-md shrink-0 mb-3">
          <div className="apple-glass-card rounded-[calc(1.5rem-3px)] px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/dm")}
                className="p-1.5 -ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Back to messages"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Friend Avatar with Status */}
              <div className="relative">
                <div className="w-10 h-10 2xl:w-11 2xl:h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {friendInfo?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-black ${
                    connected ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  title={connected ? "Active on SportSync" : "Connecting..."}
                />
              </div>

              <div>
                <h1 className="text-sm 2xl:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {friendInfo?.name || "Athlete"}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isTyping ? (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                      typing...
                    </span>
                  ) : connected ? (
                    "iMessage Encrypted"
                  ) : (
                    "Connecting to match server..."
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPollModal(true)}
                title="Create match poll"
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
              </button>

              <Link
                to={`/profile/${friendId}`}
                title="View athlete passport"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-3 apple-double-bezel rounded-[calc(1.75rem-3px)] bg-white/40 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 backdrop-blur-xl">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 text-2xl">
                💬
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Start Conversation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Coordinate match timing, pitch location, or challenge {friendInfo?.name || "this athlete"} to a duel.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine =
                msg.sender?._id === userId ||
                msg.sender === userId;

              const showTapbacks = activeTapbackMessageId === msg._id;
              const hasReactions = msg.reactions && msg.reactions.length > 0;

              return (
                <div
                  key={msg._id || index}
                  className={`group relative flex flex-col ${
                    isMine ? "items-end" : "items-start"
                  }`}
                >
                  {/* Quoted Inline Reply Bubble Header */}
                  {msg.replyTo && (
                    <div
                      className={`text-[11px] mb-1 px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-l-2 border-blue-500 max-w-[75%] truncate`}
                    >
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {msg.replyTo.senderName}:{" "}
                      </span>
                      <span>{msg.replyTo.text}</span>
                    </div>
                  )}

                  {/* Main Bubble Container */}
                  <div className="relative max-w-[85%] sm:max-w-[70%]">
                    {/* Floating Tapback Pill (Appears on Hover / Click) */}
                    {showTapbacks && (
                      <div
                        className={`absolute -top-11 z-30 flex items-center gap-1.5 p-1.5 rounded-full bg-white dark:bg-[#1c1c1e] shadow-xl border border-black/10 dark:border-white/15 animate-bounce-short ${
                          isMine ? "right-0" : "left-0"
                        }`}
                      >
                        {TAPBACKS.map((t) => (
                          <button
                            key={t.type}
                            type="button"
                            onClick={() => handleTapback(msg._id, t.type)}
                            className="p-1 hover:scale-125 transition-transform text-sm"
                            title={t.label}
                          >
                            {t.emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(msg);
                            setActiveTapbackMessageId(null);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Reply"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Interactive Match Poll Card */}
                    {msg.poll ? (
                      <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/15 shadow-sm space-y-3 min-w-[240px]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                          <BarChart2 className="w-4 h-4" />
                          <span>Game Poll</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {msg.poll.question}
                        </h4>

                        {/* Poll options with live voting */}
                        <div className="space-y-2">
                          {msg.poll.options?.map((opt, optIdx) => {
                            const totalVotes = msg.poll.options.reduce(
                              (sum, o) => sum + (o.votes?.length || 0),
                              0
                            );
                            const optVotes = opt.votes?.length || 0;
                            const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                            const hasVoted = opt.votes?.includes(userId);

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleVotePoll(msg._id, optIdx)}
                                className={`w-full relative overflow-hidden p-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                                  hasVoted
                                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                                    : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                <div
                                  className="absolute top-0 bottom-0 left-0 bg-blue-500/15 dark:bg-blue-400/20 transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative z-10 flex items-center justify-between">
                                  <span>{opt.text}</span>
                                  <span className="text-[11px] font-bold text-slate-400">
                                    {pct}% ({optVotes})
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Classic Apple iMessage Text Bubble */
                      <div
                        onClick={() =>
                          setActiveTapbackMessageId(
                            showTapbacks ? null : msg._id
                          )
                        }
                        className={`cursor-pointer px-4 py-2.5 text-sm leading-relaxed transition-all select-text shadow-sm ${
                          isMine
                            ? "bg-[#007aff] text-white rounded-[18px] rounded-br-[4px]"
                            : "bg-[#e9e9eb] dark:bg-[#26252a] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-[18px] rounded-bl-[4px]"
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    )}

                    {/* Attached Tapback Reaction Badge Pill */}
                    {hasReactions && (
                      <div
                        className={`absolute -bottom-2.5 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-white/15 shadow-sm text-xs z-10 ${
                          isMine ? "right-1" : "left-1"
                        }`}
                      >
                        {msg.reactions.slice(0, 3).map((r, rIdx) => {
                          const iconObj = TAPBACKS.find((t) => t.type === r.type);
                          return (
                            <span key={rIdx}>{iconObj?.emoji || "❤️"}</span>
                          );
                        })}
                        {msg.reactions.length > 1 && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-0.5">
                            {msg.reactions.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Status (Under latest message) */}
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                    <span>
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </span>
                    {isMine && (
                      <span className="flex items-center gap-0.5 text-blue-500">
                        <CheckCheck className="w-3 h-3" />
                        <span>Delivered</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Bouncing Bubble */}
          {isTyping && (
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-[18px] rounded-bl-[4px] bg-[#e9e9eb] dark:bg-[#26252a] w-fit">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quoted Reply Docked Banner */}
        {replyingTo && (
          <div className="mt-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-between text-xs animate-slide-up">
            <div className="truncate pr-2">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                Replying to{" "}
                {replyingTo.sender?.name ||
                  (replyingTo.sender === userId ? "yourself" : friendInfo?.name || "athlete")}
                :{" "}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {replyingTo.text}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Apple iMessage Composer Dock */}
        <form
          onSubmit={handleSend}
          className="mt-3 apple-double-bezel shadow-lg rounded-[calc(1.75rem-3px)] shrink-0"
        >
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-2 sm:p-2.5 flex items-center gap-2">
            {/* Polls & Match Tools Action */}
            <button
              type="button"
              onClick={() => setShowPollModal(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-white/10 transition-colors"
              title="Create Match Poll"
            >
              <BarChart2 className="w-5 h-5" />
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="iMessage • Coordinate match details..."
              className="flex-1 bg-transparent border-none text-sm 2xl:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none px-2"
            />

            {/* Apple Blue Circular Send Button */}
            <button
              type="submit"
              disabled={!text.trim()}
              className="w-8 h-8 rounded-full bg-[#007aff] hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-[#007aff] active:scale-90 shadow-md shadow-blue-500/25"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Modal: Create Game Poll */}
        {showPollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="apple-double-bezel w-full max-w-md shadow-2xl">
              <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Create Match Poll
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPollModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Question / Match Decision
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kickoff time preference?"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Poll Options
                  </label>
                  {pollOptions.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-xs"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowPollModal(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreatePoll}
                    className="px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20"
                  >
                    Send Poll to Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
