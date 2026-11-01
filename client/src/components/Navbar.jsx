import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { io } from "socket.io-client";
import { Bell, Sun, Moon, LogOut, Menu, X, Users, MessageSquare } from "lucide-react";
import API, { BASE_URL } from "../services/api";

const NOTIF_ICONS = {
  friend_request: "👥",
  friend_accepted: "🤝",
  match_invite: "📩",
  match_approved: "✅",
  match_join_request: "🙋",
  motm_awarded: "🌟",
  tournament_invite: "🏆",
  match_starting_soon: "⏰",
};

function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onDelete,
  onClose,
}) {
  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 max-h-[480px] overflow-y-auto apple-glass-card rounded-2xl shadow-2xl border border-black/10 dark:border-white/15 p-1 z-50 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-black/5 dark:border-white/10 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10">
        <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              ({unreadCount} new)
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="py-10 px-4 text-center space-y-1">
          <p className="text-2xl">🔔</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">No new notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => {
                if (!n.read) onMarkRead(n._id);
                if (n.actionUrl) {
                  onClose();
                  window.location.href = n.actionUrl;
                }
              }}
              className={`p-3 flex items-start gap-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer ${
                n.read ? "opacity-75" : "bg-blue-500/[0.04]"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-sm shrink-0">
                {NOTIF_ICONS[n.type] || "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                  {n.title || n.message}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { dark, setDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const token = localStorage.getItem("token");

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {
      // Non-blocking
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    API.get("/friends/requests")
      .then((res) => setPendingCount(res.data?.requests?.length || 0))
      .catch(() => {});

    API.get("/dm/conversations")
      .then((res) => {
        const total = (res.data?.conversations || []).reduce(
          (sum, c) => sum + (c.unread || 0),
          0
        );
        setDmUnread(total);
      })
      .catch(() => {});

    fetchNotifications();

    const navSocket = io(BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    navSocket.on("dm:receive", () => setDmUnread((prev) => prev + 1));
    navSocket.on("notification:new", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => navSocket.disconnect();
  }, [token, location, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleMarkAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleDeleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      const wasUnread = notifications.find((n) => n._id === id && !n.read);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("sportsSelected");
    navigate("/");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/map", label: "Map" },
    { to: "/create-match", label: "Create Match" },
    { to: "/tournaments", label: "Tournaments" },
    { to: "/activity", label: "Feed" },
    { to: "/profile", label: "Profile" },
  ];

  const isAuthPage = location.pathname === "/" || location.pathname === "/register";
  if (isAuthPage || !token) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-black/5 dark:border-white/10 transition-colors">
      <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <span className="text-sm">⚡</span>
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
            SportSync
          </span>
        </Link>

        {/* Desktop Links (Centered Apple Pill Strip) */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? "bg-black/5 dark:bg-white/10 text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            to="/friends"
            className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive("/friends")
                ? "bg-black/5 dark:bg-white/10 text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Friends</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            to="/dm"
            className={`relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive("/dm") || location.pathname.startsWith("/dm/")
                ? "bg-black/5 dark:bg-white/10 text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>Messages</span>
            {dmUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                {dmUnread > 9 ? "9+" : dmUnread}
              </span>
            )}
          </Link>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
                onDelete={handleDeleteNotif}
                onClose={() => setShowNotifDropdown(false)}
              />
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Desktop Logout */}
          <button
            type="button"
            onClick={logout}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {menuOpen && (
        <div className="md:hidden p-4 border-t border-black/5 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl space-y-1 animate-slide-up">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive(link.to)
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/friends"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Friends</span>
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            to="/dm"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </span>
            {dmUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {dmUnread}
              </span>
            )}
          </Link>

          <div className="pt-2 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
