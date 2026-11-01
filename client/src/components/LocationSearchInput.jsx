import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, CheckCircle2, X, Loader2 } from "lucide-react";

export default function LocationSearchInput({ onSelect, initialValue = "" }) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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
        // Graceful fallback suggestions based on query
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, selectedLocation]);

  // Handle location selection
  const handleSelect = (loc) => {
    setSelectedLocation(loc);
    setQuery(loc.name);
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
    onSelect({ name: "", lat: "", lng: "" });
  };

  // GPS One-Click Location Detection
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );
          const data = await res.json();
          const placeName =
            data.name ||
            data.address?.amenity ||
            data.address?.leisure ||
            data.address?.suburb ||
            data.address?.city ||
            "My Current Location";

          const loc = {
            id: `gps-${Date.now()}`,
            name: placeName,
            fullName: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            subtitle: `${data.address?.city || data.address?.state || "Nearby"}, (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
            lat,
            lng,
          };

          handleSelect(loc);
        } catch {
          // If reverse geocoding fails, still provide coordinates!
          const loc = {
            id: `gps-${Date.now()}`,
            name: "My GPS Sports Location",
            fullName: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            subtitle: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
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
    <div className="relative w-full" ref={dropdownRef}>
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
          placeholder="Search venue, stadium, pitch or city..."
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
            title="Use current GPS location"
          >
            {gpsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>
      </div>

      {/* Selected Location Pill */}
      {selectedLocation && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs animate-slide-up">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedLocation.name}
              </span>
              <span className="ml-2 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-red-500 ml-2 shrink-0 font-medium"
          >
            Change
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
          ⚠️ {errorMsg}
        </p>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-slide-up max-h-64 overflow-y-auto">
          <div className="p-1.5">
            {suggestions.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full flex items-start gap-3 p-2.5 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {loc.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {loc.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
