import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Calendar,
  Users,
  Search,
  Plus,
  ArrowRight,
} from "lucide-react";
import API from "../services/api";

const DEFAULT_CENTER = [19.076, 72.8777];

const SPORT_EMOJIS = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Cricket: "🏏",
  Badminton: "🏸",
  Volleyball: "🏐",
  Kabaddi: "🤼",
  Hockey: "🏑",
  "Table Tennis": "🏓",
};

export default function MapView() {
  const [matches, setMatches] = useState([]);
  const [selectedSport, setSelectedSport] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Fetch real matches
  const fetchMatches = useCallback(async () => {
    try {
      const res = await API.get("/matches");
      setMatches(res.data?.matches || []);
    } catch (err) {
      console.error("[MapView fetch matches error]:", err);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Detect dark mode
    const isDark =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      zoomControl: false,
    });

    // High performance Retina CartoDB Tiles (100% Free, Zero API Keys, Gorgeous Apple Aesthetic)
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Layer group for match markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Request athlete GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });

          // Fly map to user location
          map.flyTo([lat, lng], 13, { duration: 1.5 });

          // Add User Location Blue Pulsing Marker
          const userIcon = L.divIcon({
            className: "apple-user-location-marker",
            html: `
              <div style="position: relative; width: 24px; height: 24px;">
                <div style="position: absolute; inset: -8px; background: rgba(0, 122, 255, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 24px; height: 24px; background: #007aff; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          L.marker([lat, lng], { icon: userIcon })
            .bindPopup(
              `<div style="font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 600; padding: 4px;">📍 You Are Here</div>`
            )
            .addTo(map);
        },
        () => {},
        { timeout: 8000 }
      );
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Filter matches based on sport and search query
  const filteredMatches = matches.filter((m) => {
    const matchesSport =
      selectedSport === "All" ||
      m.sport?.toLowerCase() === selectedSport.toLowerCase();

    const locationName =
      typeof m.location === "string" ? m.location : m.location?.name || "";

    const matchesSearch =
      !searchQuery.trim() ||
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sport?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSport && matchesSearch && m.status !== "completed";
  });

  // Render match pins on map whenever filtered matches update
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const bounds = [];

    filteredMatches.forEach((match) => {
      // Extract coordinates (GeoJSON [lng, lat] or lat/lng object)
      let lat = match.location?.coordinates?.coordinates?.[1] || match.location?.lat;
      let lng = match.location?.coordinates?.coordinates?.[0] || match.location?.lng;

      // Fallback coordinate offset if not set
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        lat = DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.08;
        lng = DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.08;
      }

      const sportEmoji = SPORT_EMOJIS[match.sport] || "🏆";
      const locationName =
        typeof match.location === "string"
          ? match.location
          : match.location?.name || "Local Sports Pitch";

      const approvedPlayers = (match.players || []).filter(
        (p) => p.status === "approved"
      ).length;

      const dateStr = match.date
        ? new Date(match.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBD";

      // Apple Glass Marker Icon
      const pinIcon = L.divIcon({
        className: "apple-match-map-pin",
        html: `
          <div style="
            background: linear-gradient(135deg, #007aff, #5856d6);
            width: 42px;
            height: 42px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 8px 20px rgba(0, 122, 255, 0.45), 0 0 0 3px rgba(255, 255, 255, 0.95);
            cursor: pointer;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
            ${sportEmoji}
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const marker = L.marker([lat, lng], { icon: pinIcon });

      // Apple Frosted Glass Popup
      const popupHtml = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          min-width: 220px;
          padding: 8px 4px;
          color: #1d1d1f;
        ">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 24px;">${sportEmoji}</span>
            <div>
              <div style="font-size: 15px; font-weight: 700; line-height: 1.2; color: #111827;">
                ${match.title || `${match.sport} Match`}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                ${match.sport} • ${approvedPlayers}/${match.maxPlayers || 10} Athletes
              </div>
            </div>
          </div>

          <div style="font-size: 12px; color: #374151; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
            📍 <span>${locationName}</span>
          </div>

          <div style="font-size: 11px; color: #6b7280; margin-bottom: 10px;">
            ⏰ ${dateStr}
          </div>

          <a href="/match/${match._id}" style="
            display: block;
            text-align: center;
            padding: 8px 12px;
            background: #007aff;
            color: #ffffff;
            font-size: 12px;
            font-weight: 600;
            border-radius: 10px;
            text-decoration: none;
            box-shadow: 0 4px 10px rgba(0, 122, 255, 0.3);
          ">
            View Match & Join ➔
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => setActiveMatch(match));

      layer.addLayer(marker);
      bounds.push([lat, lng]);
    });

    // If matches exist and no user GPS active, adjust view to include all pins
    if (bounds.length > 0 && !userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [filteredMatches, userLocation]);

  // Handle focus on match from list
  const handleFocusMatch = (match) => {
    setActiveMatch(match);
    if (!mapInstanceRef.current) return;

    let lat = match.location?.coordinates?.coordinates?.[1] || match.location?.lat;
    let lng = match.location?.coordinates?.coordinates?.[0] || match.location?.lng;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const sportsList = ["All", "Football", "Cricket", "Basketball", "Tennis", "Badminton"];

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 sm:px-6 lg:px-10 2xl:px-16 3xl:px-24 py-8 sm:py-12 transition-colors">
      <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto space-y-6">
        {/* Header Bar */}
        <div className="apple-double-bezel shadow-xl">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl 2xl:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                Live Sports Map
              </h1>
              <p className="text-sm 2xl:text-base text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl">
                Discover active community matches and pitch sessions pinned live across your city.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-5 py-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 text-center">
                <span className="block text-2xl 2xl:text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {filteredMatches.length}
                </span>
                <span className="text-[11px] 2xl:text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Matches on Map
                </span>
              </div>

              <Link
                to="/create-match"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Host Match</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by venue name, match title, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm backdrop-blur-md"
            />
          </div>

          {/* Sport Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {sportsList.map((sport) => {
              const active = selectedSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                      : "bg-white/70 dark:bg-white/[0.05] border border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/5"
                  }`}
                >
                  {sport !== "All" && `${SPORT_EMOJIS[sport] || ""} `}
                  {sport}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Interactive Map + Match List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Live Map (Left 8 Cols) */}
          <div className="lg:col-span-8 apple-double-bezel shadow-2xl">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-2">
              <div
                ref={mapContainerRef}
                className="w-full h-[480px] sm:h-[560px] 2xl:h-[680px] rounded-2xl overflow-hidden relative z-0"
              />
            </div>
          </div>

          {/* Matches List (Right 4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Pitch Sessions ({filteredMatches.length})
              </span>
              {userLocation && (
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  GPS Active
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-[560px] 2xl:max-h-[680px] overflow-y-auto pr-1">
              {filteredMatches.length === 0 ? (
                <div className="apple-double-bezel">
                  <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-8 text-center space-y-3">
                    <p className="text-3xl">🏟️</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      No matches found in this view
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Be the first to host an open pitch session in your area.
                    </p>
                    <Link
                      to="/create-match"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Host Match</span>
                    </Link>
                  </div>
                </div>
              ) : (
                filteredMatches.map((match) => {
                  const locationName =
                    typeof match.location === "string"
                      ? match.location
                      : match.location?.name || "Local Turf Ground";

                  const approvedPlayers = (match.players || []).filter(
                    (p) => p.status === "approved"
                  ).length;

                  const isSelected = activeMatch?._id === match._id;

                  return (
                    <div
                      key={match._id}
                      onClick={() => handleFocusMatch(match)}
                      className={`apple-double-bezel cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-blue-500 shadow-lg scale-[1.01]" : ""
                      }`}
                    >
                      <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-4 sm:p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.04]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl shrink-0">
                              {SPORT_EMOJIS[match.sport] || "🏆"}
                            </div>
                            <div>
                              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                {match.title || `${match.sport} Match`}
                              </h2>
                              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[160px] sm:max-w-[200px]">
                                  {locationName}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shrink-0">
                            {match.sport}
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {match.date
                                ? new Date(match.date).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" }
                                  )
                                : "Soon"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 font-medium">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              {approvedPlayers} / {match.maxPlayers || 10}
                            </span>
                          </div>

                          <Link
                            to={`/match/${match._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            <span>Join</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
