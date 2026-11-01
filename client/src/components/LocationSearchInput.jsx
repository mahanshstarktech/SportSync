import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, CheckCircle2, X, Loader2, ChevronRight, Building } from "lucide-react";

export default function LocationSearchInput({ onSelect, initialValue = "" }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const containerRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced OpenStreetMap Nominatim search (100% Free - No API Key Needed)
  useEffect(() => {
    if (!query || query.trim().length < 2 || selectedLocation) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query.trim()
          )}&limit=6&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );

        if (!res.ok) throw new Error("Search service busy");
        const data = await res.json();

        const formatted = (data || []).map((item) => {
          const parts = (item.display_name || "").split(", ");
          const mainTitle = item.name || parts[0] || "Sports Venue";
          const subtitle = parts.slice(1, 4).join(", ");
          return {
            id: item.place_id,
            name: mainTitle,
            fullName: item.display_name,
            subtitle: subtitle || parts.slice(1).join(", "),
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        setSuggestions(formatted);
        setIsOpen(formatted.length > 0);
      } catch (err) {
        console.warn("[Nominatim Autocomplete Notice]:", err.message);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query, selectedLocation]);

  // Handle location selection
  const handleSelect = (loc) => {
    setSelectedLocation(loc);
    setQuery(loc.name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect({
      name: loc.name,
      fullName: loc.fullName,
      lat: loc.lat,
      lng: loc.lng,
    });
  };

  // Clear selected location
  const handleClear = () => {
    setSelectedLocation(null);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    onSelect({ name: "", lat: "", lng: "" });
  };

  // GPS One-Click Location Detection
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          // Reverse geocode with Nominatim (100% Free)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );

          let venueName = "Current Athlete GPS Location";
          let fullName = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const parts = data.display_name.split(", ");
              venueName =
                data.name ||
                data.address?.leisure ||
                data.address?.sport ||
                data.address?.stadium ||
                data.address?.suburb ||
                parts[0] ||
                "Nearby Sports Ground";
              fullName = data.display_name;
            }
          }

          const loc = {
            id: "gps-" + Date.now(),
            name: venueName,
            fullName,
            subtitle: fullName.slice(0, 70),
            lat,
            lng,
          };
          handleSelect(loc);
        } catch {
          const loc = {
            id: "gps-" + Date.now(),
            name: "Athlete GPS Position",
            fullName: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            subtitle: `GPS Position`,
            lat,
            lng,
          };
          handleSelect(loc);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setErrorMsg("Location access denied. Please type your venue name above.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full space-y-3" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative">
        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedLocation) setSelectedLocation(null);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search stadium, turf, sports complex or city..."
          className="w-full pl-10 pr-24 py-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        />

        {/* Right Action Icons: GPS / Clear / Spinner */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
            title="Auto-detect current GPS location"
          >
            {gpsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
            <span>GPS</span>
          </button>
        </div>
      </div>

      {/* Selected Location Card (Apple HIG Verified Style) */}
      {selectedLocation && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs animate-slide-up">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {selectedLocation.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {selectedLocation.subtitle || selectedLocation.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-3 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0 transition-all"
          >
            Change
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </p>
      )}

      {/* Inline Space-Optimized Suggestions Drawer (Pushes card content naturally - NEVER overlaps other cards) */}
      {isOpen && suggestions.length > 0 && (
        <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.04] p-2 space-y-1 animate-slide-up max-h-64 overflow-y-auto">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Suggested Pitches & Grounds ({suggestions.length})</span>
            <span className="text-[10px] text-blue-500 font-normal">Tap to select</span>
          </div>

          {suggestions.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => handleSelect(loc)}
              className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left hover:bg-blue-600/10 dark:hover:bg-blue-500/15 border border-transparent hover:border-blue-500/20 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {loc.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {loc.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Select</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
