import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import API from "../services/api";

const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 68px)" // full screen minus navbar
};

// Default center — India
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true
};

function MapView() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(5);
  const [loading, setLoading] = useState(true);



  // Fetch all matches
  const fetchMatches = useCallback(async () => {
    try {
      const res = await API.get("/matches");
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setUserLocation(loc);
          setMapCenter(loc);
          setMapZoom(12); // zoom in to user's city
        },
        () => {
          // Permission denied — stay at default India view
          console.log("Location permission denied");
        }
      );
    }
  }, [fetchMatches]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Loading matches...</p>
    </div>
  );

  const upcomingMatches = matches.filter((m) => m.status !== "completed");

  return (
    <div className="relative">

      {/* Match count badge */}
      <div className="absolute top-4 left-4 z-10 bg-white shadow rounded-xl px-4 py-2 text-sm font-semibold text-gray-700">
        {upcomingMatches.length} upcoming matches
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapZoom}
        options={mapOptions}
        onClick={() => setSelectedMatch(null)}
      >

        {/* User location marker — blue dot */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#3B82F6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3
            }}
            title="You are here"
          />
        )}

        {/* Match markers */}
        {upcomingMatches.map((match) => {
          const coords = match.location?.coordinates?.coordinates;
          if (!coords || coords.length < 2) return null;

          const position = {
            lat: coords[1], // GeoJSON is [lng, lat] — so index 1 is lat
            lng: coords[0]
          };

          const isFull = match.players?.filter(
            (p) => p.status === "approved"
          ).length >= match.maxPlayers;

          return (
            <Marker
              key={match._id}
              position={position}
              onClick={() => setSelectedMatch(match)}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
                  isFull
                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 10.4 16 24 16 24S32 26.4 32 16C32 7.2 24.8 0 16 0z" fill="#EF4444"/><circle cx="16" cy="16" r="7" fill="white"/></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 10.4 16 24 16 24S32 26.4 32 16C32 7.2 24.8 0 16 0z" fill="#22C55E"/><circle cx="16" cy="16" r="7" fill="white"/></svg>'
                ),
                scaledSize: new window.google.maps.Size(32, 40),
                anchor: new window.google.maps.Point(16, 40)
              }}
            />
          );
        })}

        {/* Info window on marker click */}
        {selectedMatch && (() => {
          const coords = selectedMatch.location?.coordinates?.coordinates;
          if (!coords) return null;

          const approvedCount = selectedMatch.players?.filter(
            (p) => p.status === "approved"
          ).length || 0;

          const isFull = approvedCount >= selectedMatch.maxPlayers;

          return (
            <InfoWindow
              position={{ lat: coords[1], lng: coords[0] }}
              onCloseClick={() => setSelectedMatch(null)}
            >
              <div style={{ minWidth: 200, fontFamily: "sans-serif" }}>
                <p style={{ fontWeight: "700", fontSize: 16, marginBottom: 4 }}>
                  {selectedMatch.sport}
                </p>
                <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 2 }}>
                  📍 {selectedMatch.location?.name}
                </p>
                <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 2 }}>
                  📅 {new Date(selectedMatch.date).toLocaleString()}
                </p>
                <p style={{ fontSize: 13, marginBottom: 8 }}>
                  👥 {approvedCount} / {selectedMatch.maxPlayers} players
                  {isFull && (
                    <span style={{ color: "#EF4444", marginLeft: 6 }}>Full</span>
                  )}
                </p>
                <button
                  onClick={() => navigate(`/match/${selectedMatch._id}`)}
                  style={{
                    background: "#3B82F6",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: 13,
                    width: "100%"
                  }}
                >
                  View Match
                </button>
              </div>
            </InfoWindow>
          );
        })()}

      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-10 bg-white shadow rounded-xl px-4 py-3 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Open match</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Match full</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Your location</span>
        </div>
      </div>

    </div>
  );
}

export default MapView;
