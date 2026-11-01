import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { io } from "socket.io-client";
import API from "../services/api";
import { BASE_URL } from "../services/api";

const NOTIF_ICONS = {
  friend_request:      "👥",
  friend_accepted:     "🤝",
  match_invite:        "📩",
  match_approved:      "✅",
  match_join_request:  "🙋",
  motm_awarded:        "🌟",
  tournament_invite:   "🏆",
  match_starting_soon: "⏰"
};

function NotificationDropdown({ notifications, unreadCount, onMarkAllRead, onMarkRead, onDelete, onClose }) {
  return (
 <div style={{
  position: "fixed",
  top: 72,
  right: window.innerWidth > 768 ? 24 : "50%",
  left: window.innerWidth > 768 ? "auto" : "50%",
  transform: window.innerWidth > 768 ? "none" : "translateX(-50%)",
  width: "calc(100vw - 24px)",
  maxWidth: 340,
  maxHeight: 480,
  overflowY: "auto",
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  zIndex: 100
}}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0,
        background: "var(--bg-card)"
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
          Notifications {unreadCount > 0 && (
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
              ({unreadCount} new)
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div style={{ padding: "32px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🔔</p>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No notifications yet</p>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => {
                if (!n.read) onMarkRead(n._id);
                if (n.actionUrl) {
                  onClose();
                  window.location.href = n.actionUrl;
                }
              }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 16px", cursor: n.actionUrl ? "pointer" : "default",
                background: n.read ? "transparent" : "rgba(59,130,246,0.04)",
                borderBottom: "1px solid var(--border)",
                transition: "background 0.15s"
              }}
              onMouseEnter={e => { if (n.actionUrl) e.currentTarget.style.background = "var(--bg-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = n.read ? "transparent" : "rgba(59,130,246,0.04)"; }}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: n.read ? "var(--bg-primary)" : "rgba(59,130,246,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16
              }}>
                {NOTIF_ICONS[n.type] || "🔔"}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: n.read ? 400 : 600,
                  color: "var(--text-primary)", marginBottom: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {n.title}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.4 }}>
                  {n.message}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {new Date(n.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>

              {/* Unread dot + delete */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                )}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(n._id); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: "var(--text-muted)", lineHeight: 1,
                    padding: 2
                  }}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, setDark } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);
  const [dmUnread, setDmUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ✅ Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) return;

    API.get("/friends/requests")
      .then(res => setPendingCount(res.data.requests?.length || 0))
      .catch(() => {});

    API.get("/dm/conversations")
      .then(res => {
        const total = (res.data.conversations || []).reduce((sum, c) => sum + (c.unread || 0), 0);
        setDmUnread(total);
      })
      .catch(() => {});

    fetchNotifications();

const navSocket = io(BASE_URL, { auth: { token } });
    navSocket.on("dm:receive", () => setDmUnread(prev => prev + 1));

    // ✅ Real-time notification
    navSocket.on("notification:new", (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => navSocket.disconnect();
  }, [token, location, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const handleMarkAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleDeleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      const wasUnread = notifications.find(n => n._id === id && !n.read);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const navLinks = [
    { to: "/dashboard",   label: "Dashboard" },
    { to: "/map",         label: "Map" },
    { to: "/create-match",label: "Create Match" },
    { to: "/tournaments", label: "Tournaments" },
    { to: "/activity",    label: "Feed" },
    { to: "/profile",     label: "Profile" }
  ];

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? "var(--accent)" : "var(--text-secondary)",
    background: isActive(path) ? "rgba(59,130,246,0.08)" : "transparent",
    fontWeight: isActive(path) ? 600 : 400,
    padding: "6px 10px", borderRadius: 8, fontSize: 13,
    textDecoration: "none", transition: "all 0.15s",
    position: "relative", display: "inline-block", whiteSpace: "nowrap"
  });

  const isAuthPage = location.pathname === "/" || location.pathname === "/register";
  if (isAuthPage || !token) {
    return null;
  }

  return (
    <nav style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, zIndex: 50
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "0 16px",
        height: 64, display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 12
      }}>

        {/* Logo */}
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 16 }}>⚡</span>
          </div>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
            SportsSync
          </span>
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} style={linkStyle(link.to)}>
                {link.label}
              </Link>
            ))}
            <Link to="/friends" style={linkStyle("/friends")}>
              Friends
              {pendingCount > 0 && (
                <span style={{
                  position: "absolute", top: 0, right: 0,
                  background: "#ef4444", color: "white",
                  fontSize: 9, fontWeight: 700,
                  width: 15, height: 15, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {pendingCount}
                </span>
              )}
            </Link>
            <Link to="/dm" style={linkStyle("/dm")}>
              Messages
              {dmUnread > 0 && (
                <span style={{
                  position: "absolute", top: 0, right: 0,
                  background: "#ef4444", color: "white",
                  fontSize: 9, fontWeight: 700,
                  width: 15, height: 15, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {dmUnread > 9 ? "9+" : dmUnread}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* ✅ Bell icon with dropdown */}
          {token && (
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifDropdown(prev => !prev)}
                style={{
                  background: "var(--bg-primary)", border: "1px solid var(--border)",
                  borderRadius: 8, width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 16, position: "relative"
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    background: "#ef4444", color: "white",
                    fontSize: 9, fontWeight: 700,
                    width: 16, height: 16, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
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
          )}

          <button
            onClick={() => setDark(!dark)}
            style={{
              background: "var(--bg-primary)", border: "1px solid var(--border)",
              borderRadius: 8, width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 16
            }}
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {!isMobile && (
            <button
              onClick={logout}
              style={{
                background: "rgba(239,68,68,0.1)", color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
                padding: "6px 14px", fontSize: 14, fontWeight: 500, cursor: "pointer"
              }}
            >
              Logout
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "var(--bg-primary)", border: "1px solid var(--border)",
                borderRadius: 8, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", position: "relative"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ display: "block", width: 18, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none" }} />
                <span style={{ display: "block", width: 18, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.2s", opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: "block", width: 18, height: 2, background: "var(--text-primary)", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }} />
              </div>
              {(pendingCount + dmUnread + unreadCount) > 0 && !menuOpen && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#ef4444", color: "white",
                  fontSize: 9, fontWeight: 700,
                  width: 16, height: 16, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {(pendingCount + dmUnread + unreadCount) > 9 ? "9+" : pendingCount + dmUnread + unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)", padding: "8px 12px 16px" }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: "block", padding: "12px 16px", borderRadius: 10,
                fontSize: 15, fontWeight: isActive(link.to) ? 600 : 400,
                color: isActive(link.to) ? "var(--accent)" : "var(--text-primary)",
                background: isActive(link.to) ? "rgba(59,130,246,0.08)" : "transparent",
                textDecoration: "none", marginBottom: 2, transition: "all 0.15s"
              }}
            >
              {link.label}
            </Link>
          ))}

          <Link to="/friends" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderRadius: 10, fontSize: 15,
            fontWeight: isActive("/friends") ? 600 : 400,
            color: isActive("/friends") ? "var(--accent)" : "var(--text-primary)",
            background: isActive("/friends") ? "rgba(59,130,246,0.08)" : "transparent",
            textDecoration: "none", marginBottom: 2
          }}>
            Friends
            {pendingCount > 0 && (
              <span style={{ background: "#ef4444", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>
                {pendingCount}
              </span>
            )}
          </Link>

          <Link to="/dm" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderRadius: 10, fontSize: 15,
            fontWeight: isActive("/dm") ? 600 : 400,
            color: isActive("/dm") ? "var(--accent)" : "var(--text-primary)",
            background: isActive("/dm") ? "rgba(59,130,246,0.08)" : "transparent",
            textDecoration: "none", marginBottom: 2
          }}>
            Messages
            {dmUnread > 0 && (
              <span style={{ background: "#ef4444", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>
                {dmUnread > 9 ? "9+" : dmUnread}
              </span>
            )}
          </Link>

          {/* ✅ Notifications in mobile menu */}
          <div
            onClick={() => { setMenuOpen(false); setShowNotifDropdown(true); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 10, fontSize: 15,
              color: "var(--text-primary)", cursor: "pointer", marginBottom: 2
            }}
          >
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{ background: "#ef4444", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>
                {unreadCount}
              </span>
            )}
          </div>

          <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

          <button
            onClick={logout}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 10,
              background: "rgba(239,68,68,0.08)", color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.15)",
              fontSize: 15, fontWeight: 500, cursor: "pointer", textAlign: "left"
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;