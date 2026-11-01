import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import API, { BASE_URL } from "../services/api";

let inviteSocket = null;

function InviteNotification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [matchInvites, setMatchInvites] = useState([]);
  const [tournamentInvites, setTournamentInvites] = useState([]);
  const token = localStorage.getItem("token");

  const isAuthPage = location.pathname === "/" || location.pathname === "/register";

  useEffect(() => {
    if (!token) return;

    // Load pending match invites
    API.get("/matches/invites/me")
      .then((res) => setMatchInvites(res.data.invites || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;

    inviteSocket = io(BASE_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    // Match invite
    inviteSocket.on("match:invite", (invite) => {
      setMatchInvites((prev) => {
        if (prev.some((i) => i._id === invite.matchId)) return prev;
        return [
          ...prev,
          {
            _id: invite.matchId,
            sport: invite.sport,
            location: invite.location,
            date: invite.date,
            hostName: invite.hostName,
          },
        ];
      });
    });

    // Tournament invite
    inviteSocket.on("tournament:invite", (invite) => {
      setTournamentInvites((prev) => {
        if (prev.some((i) => i._id === invite.tournamentId)) return prev;
        return [
          ...prev,
          {
            _id: invite.tournamentId,
            name: invite.name,
            sport: invite.sport,
            hostName: invite.hostName,
          },
        ];
      });
    });

    return () => {
      inviteSocket?.disconnect();
      inviteSocket = null;
    };
  }, [token]);

  const handleMatchRespond = async (matchId, response) => {
    try {
      await API.post(`/matches/${matchId}/invite/respond`, { response });
      setMatchInvites((prev) => prev.filter((i) => i._id !== matchId));
      if (response === "accepted") navigate(`/match/${matchId}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed");
    }
  };

  const dismissTournamentInvite = (tournamentId) => {
    setTournamentInvites((prev) => prev.filter((i) => i._id !== tournamentId));
  };

  const allInvites = [
    ...matchInvites.map((i) => ({ ...i, type: "match" })),
    ...tournamentInvites.map((i) => ({ ...i, type: "tournament" })),
  ];

  if (isAuthPage || !token || allInvites.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 12,
        right: 12,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "auto",
        maxWidth: 340,
        margin: "0 auto",
      }}
    >
      {allInvites.map((invite) => (
        <div
          key={`${invite.type}-${invite._id}`}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderLeft: `4px solid ${invite.type === "tournament" ? "#f59e0b" : "var(--accent)"}`,
            borderRadius: 16,
            padding: 16,
            boxShadow: "var(--card-shadow-hover)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--text-primary)",
                }}
              >
                {invite.type === "tournament"
                  ? "🏆 Tournament Invite!"
                  : "🎮 Match Invite!"}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                from {invite.hostName}
              </p>
            </div>
            <button
              onClick={() => {
                if (invite.type === "tournament")
                  dismissTournamentInvite(invite._id);
                else
                  setMatchInvites((prev) =>
                    prev.filter((i) => i._id !== invite._id),
                  );
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: 18,
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              ×
            </button>
          </div>

          {/* Details */}
          <div
            style={{
              background: "var(--bg-primary)",
              borderRadius: 10,
              padding: "10px 12px",
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {invite.type === "tournament" ? (
              <>
                <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {invite.name}
                </p>
                <p style={{ color: "var(--text-muted)", marginTop: 3 }}>
                  🏅 {invite.sport}
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {invite.sport}
                </p>
                {invite.location && (
                  <p style={{ color: "var(--text-muted)", marginTop: 3 }}>
                    📍 {invite.location}
                  </p>
                )}
                {invite.date && (
                  <p style={{ color: "var(--text-muted)", marginTop: 2 }}>
                    📅{" "}
                    {new Date(invite.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {invite.type === "tournament" ? (
              <button
                onClick={() => {
                  dismissTournamentInvite(invite._id);
                  navigate(`/tournaments/${invite._id}`);
                }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 10,
                  border: "none",
                  background: "#f59e0b",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                View Tournament
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleMatchRespond(invite._id, "accepted")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 10,
                    border: "none",
                    background: "var(--success)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  ✓ Join
                </button>
                <button
                  onClick={() => handleMatchRespond(invite._id, "declined")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 10,
                    background: "rgba(239,68,68,0.08)",
                    color: "var(--danger)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  ✕ Decline
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default InviteNotification;
