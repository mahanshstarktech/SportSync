import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, ChevronRight, UserPlus, Users } from "lucide-react";
import API from "../services/api";

function timeAgo(date) {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DMInbox() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get("/dm/conversations"), API.get("/friends")])
      .then(([convRes, friendsRes]) => {
        setConversations(convRes.data?.conversations || []);
        setFriends(friendsRes.data?.friends || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredConversations = conversations.filter((c) =>
    c.friend?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 sm:px-6 lg:px-10 2xl:px-16 3xl:px-24 py-8 sm:py-12 transition-colors">
      <div className="max-w-2xl 2xl:max-w-3xl 3xl:max-w-4xl mx-auto space-y-6">
        
        {/* Apple Header */}
        <div className="apple-double-bezel shadow-lg">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Messages
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Direct peer-to-peer messaging, match polls, and real-time coordination.
              </p>
            </div>

            <Link
              to="/friends"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-center"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Message</span>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search athlete conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
          />
        </div>

        {/* Active Friends Quick Strip */}
        {friends.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
              Active Athletes
            </h2>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 pr-2">
              {friends.map((friend) => (
                <button
                  key={friend._id}
                  type="button"
                  onClick={() => navigate(`/dm/${friend._id}`)}
                  className="flex flex-col items-center gap-1 shrink-0 p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                    {friend.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 max-w-[64px] truncate">
                    {friend.name?.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation List Card */}
        <div className="apple-double-bezel shadow-xl">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] overflow-hidden divide-y divide-black/5 dark:divide-white/10">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mx-auto text-2xl">
                  💬
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Conversations Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Connect with fellow players on the Friends list or join a match to start coordinating!
                </p>
                <Link
                  to="/friends"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-500 transition-all mt-2"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Find Athletes</span>
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => navigate(`/dm/${conv.friend?._id}`)}
                  className={`flex items-center gap-3.5 p-4 sm:p-5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors ${
                    conv.unread > 0 ? "bg-blue-500/[0.03]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {conv.friend?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    {conv.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md">
                        {conv.unread > 9 ? "9+" : conv.unread}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h4
                        className={`text-sm 2xl:text-base truncate ${
                          conv.unread > 0
                            ? "font-bold text-slate-900 dark:text-white"
                            : "font-semibold text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {conv.friend?.name || "Athlete"}
                      </h4>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {timeAgo(conv.lastMessageTime)}
                      </span>
                    </div>

                    <p
                      className={`text-xs 2xl:text-sm truncate ${
                        conv.unread > 0
                          ? "text-blue-600 dark:text-blue-400 font-semibold"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {conv.lastMessage || "Tap to chat..."}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
