import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Navigation, Calendar, Users, Search, Compass, ExternalLink, ArrowRight, ShieldCheck } from "lucide-react";
import API from "../services/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "480px",
  borderRadius: "1.5rem",
};

const defaultCenter = { lat: 28.6139, lng: 77.209 }; // New Delhi default

const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

const SPORT_EMOJIS = {
  Football: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Cricket: "🏏",
  Badminton: "🏸",
  Volleyball: "🏐",
};

export default function MapView() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("All");

  const hasGoogleMaps =
    typeof window !== "undefined" &&
    typeof window.google !== "undefined" &&
    typeof window.google.maps !== "undefined";

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/matches");
      setMatches(res.data?.matches || []);
    } catch (err) {
      console.error("[MapView fetch error]:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(loc);
          setMapCenter(loc);
          setMapZoom(13);
        },
        (err) => {
          console.warn("[Geolocation permission denied]:", err.message);
        }
      );
    }
  }, [fetchMatches]);

  const sports = ["All", "Football", "Basketball", "Tennis", "Cricket", "Badminton"];

  const filteredMatches = matches.filter((m) => {
    const matchesSport =
      selectedSport === "All" ||
      m.sport?.toLowerCase() === selectedSport.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof m.location === "string" && m.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.location?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSport && matchesSearch && m.status !== "completed";
  });

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 sm:px-6 lg:px-10 2xl:px-16 3xl:px-24 py-6 sm:py-10 transition-colors">
      <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2200px] mx-auto space-y-6">
        
        {/* Apple Header Island */}
        <div className="apple-double-bezel shadow-lg">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>Venue & Pitch Explorer</span>
              </div>
              <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                Interactive Sports Map
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Discover active pitches, turf grounds, and athletic community matches happening around your city.
              </p>
            </div>

            {/* Quick stats pill */}
            <div className="flex items-center gap-3">
              <div className="p-3 sm:p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 text-center">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Available Pitches</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {filteredMatches.length}
                </p>
              </div>

              {userLocation && (
                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">GPS Active</p>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mt-1 flex items-center justify-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Near You</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pitch, turf or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-white/10 border border-black/10 dark:border-white/15 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Sport Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
            {sports.map((sport) => {
              const active = selectedSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  <span>{SPORT_EMOJIS[sport] || "🏅"} </span>
                  <span>{sport}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Interactive Map or Venue Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map View / Fallback Container */}
          <div className="lg:col-span-7 xl:col-span-8 apple-double-bezel shadow-xl min-h-[480px]">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-2 sm:p-3 h-full min-h-[480px] flex flex-col justify-center">
              {hasGoogleMaps ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  options={mapOptions}
                  onClick={() => setSelectedMatch(null)}
                >
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      title="Your Location"
                    />
                  )}

                  {filteredMatches.map((m) => {
                    const coords = m.location?.coordinates?.coordinates;
                    if (!coords || coords.length < 2) return null;
                    return (
                      <Marker
                        key={m._id}
                        position={{ lat: coords[1], lng: coords[0] }}
                        onClick={() => setSelectedMatch(m)}
                      />
                    );
                  })}

                  {selectedMatch && (
                    <InfoWindow
                      position={{
                        lat: selectedMatch.location?.coordinates?.coordinates[1] || mapCenter.lat,
                        lng: selectedMatch.location?.coordinates?.coordinates[0] || mapCenter.lng,
                      }}
                      onCloseClick={() => setSelectedMatch(null)}
                    >
                      <div className="p-2 text-slate-900">
                        <p className="font-bold text-sm">{selectedMatch.title || `${selectedMatch.sport} Match`}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{selectedMatch.location?.name || selectedMatch.location}</p>
                        <button
                          type="button"
                          onClick={() => navigate(`/match/${selectedMatch._id}`)}
                          className="mt-2 w-full py-1 px-3 bg-blue-600 text-white rounded text-xs font-semibold"
                        >
                          View Match
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                /* Apple-Style Vector Venue Arena View (100% Free Forever, No Key Required) */
                <div className="w-full h-full min-h-[480px] rounded-2xl bg-gradient-to-b from-blue-50/50 to-indigo-50/40 dark:from-white/[0.02] dark:to-white/[0.06] border border-black/5 dark:border-white/10 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Free-Tier Verified Discovery</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      Live Venue Radar Active
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg">
                      Explore venues and pitches below. Tap any location to get instantaneous navigation directions on Apple Maps or Google Maps.
                    </p>
                  </div>

                  {/* Visual Map Grid Pattern */}
                  <div className="my-8 grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
                    {filteredMatches.slice(0, 6).map((m) => {
                      const locName = typeof m.location === "string" ? m.location : (m.location?.name || "Local Turf");
                      return (
                        <div
                          key={m._id}
                          onClick={() => setSelectedMatch(m)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            selectedMatch?._id === m._id
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-[1.02]"
                              : "bg-white/80 dark:bg-white/10 border-black/5 dark:border-white/10 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/15"
                          }`}
                        >
                          <span className="text-2xl">{SPORT_EMOJIS[m.sport] || "🏅"}</span>
                          <p className="mt-2 text-xs font-bold line-clamp-1">{m.title || `${m.sport} Match`}</p>
                          <p className={`text-[11px] line-clamp-1 mt-0.5 ${selectedMatch?._id === m._id ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                            {locName}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative z-10 flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>OpenStreet & GPS Ready</span>
                    </span>
                    <span>100% Free Hosting Optimized</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Venue List Cards */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Confirmed Match Pitches ({filteredMatches.length})
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading pitch locations...</div>
            ) : filteredMatches.length === 0 ? (
              <div className="apple-double-bezel p-6 text-center rounded-2xl bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No matches found in this filter.</p>
                <Link to="/create-match" className="mt-3 inline-flex text-xs font-bold text-blue-600 hover:underline">
                  + Create a match at your local pitch
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {filteredMatches.map((m) => {
                  const locName = typeof m.location === "string" ? m.location : (m.location?.name || "Local Sports Pitch");
                  const playersCount = m.players?.length || 0;
                  const isFull = playersCount >= (m.maxPlayers || 10);
                  const isSelected = selectedMatch?._id === m._id;

                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName)}`;

                  return (
                    <div
                      key={m._id}
                      onClick={() => setSelectedMatch(m)}
                      className={`apple-double-bezel shadow-sm cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <div className="apple-glass-card rounded-[calc(1.25rem-3px)] p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{SPORT_EMOJIS[m.sport] || "🏅"}</span>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                {m.title || `${m.sport} Game`}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{locName}</span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              isFull
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {isFull ? "Full" : "Open"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-black/5 dark:border-white/10">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>{playersCount} / {m.maxPlayers || 10} Athletes</span>
                          </span>

                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{m.date ? new Date(m.date).toLocaleDateString() : "Upcoming"}</span>
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Directions</span>
                          </a>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/match/${m._id}`);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <span>View Match</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
