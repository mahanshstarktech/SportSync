import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  UserCheck,
  Check,
  Sparkles,
} from "lucide-react";
import API from "../services/api";
import LocationSearchInput from "../components/LocationSearchInput";

const SPORTS = [
  { name: "Cricket", emoji: "🏏", defaultPlayers: 11 },
  { name: "Football", emoji: "⚽", defaultPlayers: 10 },
  { name: "Basketball", emoji: "🏀", defaultPlayers: 10 },
  { name: "Tennis", emoji: "🎾", defaultPlayers: 2 },
  { name: "Badminton", emoji: "🏸", defaultPlayers: 4 },
  { name: "Volleyball", emoji: "🏐", defaultPlayers: 12 },
  { name: "Kabaddi", emoji: "🤼", defaultPlayers: 14 },
  { name: "Hockey", emoji: "🏑", defaultPlayers: 11 },
  { name: "Table Tennis", emoji: "🏓", defaultPlayers: 2 },
  { name: "Swimming", emoji: "🏊", defaultPlayers: 6 },
  { name: "Athletics", emoji: "🏃", defaultPlayers: 8 },
  { name: "Boxing", emoji: "🥊", defaultPlayers: 2 },
];

const TIME_SLOTS = [
  { value: "07:00", label: "07:00 AM", period: "Morning Kickoff" },
  { value: "09:00", label: "09:00 AM", period: "Midday Session" },
  { value: "17:00", label: "05:00 PM", period: "Evening Rush" },
  { value: "18:30", label: "06:30 PM", period: "Prime Sunset" },
  { value: "20:00", label: "08:00 PM", period: "Night Lights" },
];

// Helper to format date object to YYYY-MM-DD local string
const toLocalIsoDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CreateMatch() {
  const navigate = useNavigate();

  // Compute preset dates based on user's current local time
  const datePresets = useMemo(() => {
    const now = new Date();

    // Today
    const today = new Date(now);
    const todayIso = toLocalIsoDate(today);

    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = toLocalIsoDate(tomorrow);

    // Upcoming Weekend (Saturday)
    const weekend = new Date(now);
    const dayOfWeek = weekend.getDay();
    const daysUntilSat = 6 - dayOfWeek <= 0 ? 7 : 6 - dayOfWeek;
    weekend.setDate(weekend.getDate() + daysUntilSat);
    const weekendIso = toLocalIsoDate(weekend);

    return {
      today: {
        id: "today",
        label: "Today",
        iso: todayIso,
        sub: today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      },
      tomorrow: {
        id: "tomorrow",
        label: "Tomorrow",
        iso: tomorrowIso,
        sub: tomorrow.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      },
      weekend: {
        id: "weekend",
        label: "Weekend",
        iso: weekendIso,
        sub: weekend.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      },
    };
  }, []);

  // Form State
  const [selectedSport, setSelectedSport] = useState("Football");
  const [activeDatePreset, setActiveDatePreset] = useState("tomorrow");
  const [matchDate, setMatchDate] = useState(() => datePresets.tomorrow.iso);
  const [matchTime, setMatchTime] = useState("18:30");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState({ name: "", lat: 18.9385, lng: 72.8257 });

  // Friends & Invites
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  // UI Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = toLocalIsoDate(new Date());

  useEffect(() => {
    API.get("/friends")
      .then((res) => setFriends(res.data?.friends || []))
      .catch(() => {});
  }, []);

  // Update default players when sport changes
  const handleSportChange = (sport) => {
    setSelectedSport(sport.name);
    setMaxPlayers(sport.defaultPlayers);
    if (!title || SPORTS.some((s) => title.includes(s.name))) {
      setTitle(`${sport.name} Community Match`);
    }
  };

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleLocationSelect = ({ name, lat, lng }) => {
    setLocation({ name, lat: Number(lat), lng: Number(lng) });
    setErrorMsg("");
  };

  // Select Quick Date Preset
  const handleSelectDatePreset = (presetKey) => {
    const preset = datePresets[presetKey];
    if (preset) {
      setActiveDatePreset(presetKey);
      setMatchDate(preset.iso);
      setErrorMsg("");
    }
  };

  // Custom Date Input Change
  const handleCustomDateChange = (isoVal) => {
    setMatchDate(isoVal);
    // Check if matches one of the presets
    if (isoVal === datePresets.today.iso) {
      setActiveDatePreset("today");
    } else if (isoVal === datePresets.tomorrow.iso) {
      setActiveDatePreset("tomorrow");
    } else if (isoVal === datePresets.weekend.iso) {
      setActiveDatePreset("weekend");
    } else {
      setActiveDatePreset("custom");
    }
    setErrorMsg("");
  };

  const handleSelectTime = (val) => {
    setMatchTime(val);
    setErrorMsg("");
  };

  // Formatted date preview for Apple card
  const formattedDatePreview = useMemo(() => {
    if (!matchDate) return "";
    try {
      const parts = matchDate.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return matchDate;
    }
  }, [matchDate]);

  // Formatted 12-hour time preview
  const formattedTimePreview = useMemo(() => {
    if (!matchTime) return "";
    const slot = TIME_SLOTS.find((s) => s.value === matchTime);
    if (slot) return `${slot.label} (${slot.period})`;
    try {
      const [h, m] = matchTime.split(":");
      const hours = Number(h);
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${String(displayHours).padStart(2, "0")}:${m} ${ampm}`;
    } catch {
      return matchTime;
    }
  }, [matchTime]);

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedSport) {
      setErrorMsg("Please select a sport.");
      return;
    }

    if (!location.name || isNaN(location.lat) || isNaN(location.lng)) {
      setErrorMsg("Please select a valid venue location using search or GPS.");
      return;
    }

    if (!matchDate || !matchTime) {
      setErrorMsg("Please choose both date and time for the match.");
      return;
    }

    // Combine date & time into local Date object
    const matchDateTime = new Date(`${matchDate}T${matchTime}`);
    if (isNaN(matchDateTime.getTime())) {
      setErrorMsg("Invalid date/time format.");
      return;
    }

    if (matchDateTime <= new Date()) {
      setErrorMsg("Match date & time must be in the future.");
      return;
    }

    if (maxPlayers < 2) {
      setErrorMsg("Max players must be at least 2.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: title.trim() || `${selectedSport} Community Match`,
        sport: selectedSport,
        location: {
          name: location.name,
          coordinates: {
            type: "Point",
            coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
          },
        },
        date: matchDateTime.toISOString(),
        maxPlayers: Number(maxPlayers),
      };

      const res = await API.post("/matches", payload);

      // Send friend invites if selected
      if (selectedFriends.length > 0 && res.data?.match?._id) {
        try {
          await API.post(`/matches/${res.data.match._id}/invite`, {
            friendIds: selectedFriends,
          });
        } catch {
          // Invite errors non-blocking
        }
      }

      navigate(`/match/${res.data.match._id}`);
    } catch (err) {
      console.error("[Create Match Error]:", err);
      setErrorMsg(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Failed to create match. Please verify your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 sm:px-6 lg:px-10 2xl:px-16 3xl:px-24 py-8 sm:py-12 transition-colors">
      <div className="max-w-3xl 2xl:max-w-4xl 3xl:max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl 2xl:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Match
          </h1>
          <p className="text-sm 2xl:text-base text-slate-500 dark:text-slate-400 mt-1">
            Schedule an open pitch session, set the venue, and invite nearby athletes.
          </p>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3 animate-slide-up">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateMatch} className="space-y-6">
          {/* Card 1: Sport Selection */}
          <div className="apple-double-bezel shadow-lg">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">
                  Select Sport
                </label>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {selectedSport} Selected
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {SPORTS.map((sport) => {
                  const isSelected = selectedSport === sport.name;
                  return (
                    <button
                      type="button"
                      key={sport.name}
                      onClick={() => handleSportChange(sport)}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-center ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.03]"
                          : "bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/10"
                      }`}
                    >
                      <span className="text-2xl 2xl:text-3xl">{sport.emoji}</span>
                      <span className="text-xs font-semibold truncate w-full">
                        {sport.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Match Title & Venue (Space-Optimized Inline Drawer) */}
          <div className="apple-double-bezel shadow-lg">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="match-title"
                  className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Match Title
                </label>
                <input
                  id="match-title"
                  type="text"
                  placeholder="e.g. 5v5 Friday Night Turf Clash"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Advanced Location Search (In-Flow Expansion - NEVER overlaps other cards) */}
              <div>
                <label className="block text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                  Match Venue & Pitch
                </label>
                <LocationSearchInput onSelect={handleLocationSelect} />
              </div>
            </div>
          </div>

          {/* Card 3: Separate Date & Time Columns with Apple Selectors */}
          <div className="apple-double-bezel shadow-lg">
            <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">
                  Match Schedule & Capacity
                </p>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Interactive Selectors</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Apple Date Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>Select Date</span>
                    </label>
                    {activeDatePreset !== "custom" && (
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {datePresets[activeDatePreset]?.label}
                      </span>
                    )}
                  </div>

                  {/* 3 Large Apple Date Presets */}
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(datePresets).map((preset) => {
                      const isActive = activeDatePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectDatePreset(preset.id)}
                          className={`p-3 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02] ring-2 ring-blue-500/40"
                              : "bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold">{preset.label}</span>
                            {isActive && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-[10px] mt-0.5 ${isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                            {preset.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Date Input for Any Date */}
                  <div>
                    <label htmlFor="match-date" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Or pick another date:
                    </label>
                    <input
                      id="match-date"
                      type="date"
                      min={todayStr}
                      value={matchDate}
                      onChange={(e) => handleCustomDateChange(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>

                  {/* Formatted Date Confirmation Banner */}
                  {formattedDatePreview && (
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        <strong>Date:</strong> {formattedDatePreview}
                      </span>
                    </div>
                  )}
                </div>

                {/* Column 2: Apple Time Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Select Kickoff Time</span>
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {matchTime}
                    </span>
                  </div>

                  {/* 5 Quick Time Slot Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isActive = matchTime === slot.value;
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => handleSelectTime(slot.value)}
                          className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02] ring-2 ring-blue-500/40"
                              : "bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold font-mono">{slot.label}</span>
                            {isActive && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-[10px] mt-0.5 truncate ${isActive ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                            {slot.period}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Time Input */}
                  <div>
                    <label htmlFor="match-time" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      Or set specific time:
                    </label>
                    <input
                      id="match-time"
                      type="time"
                      value={matchTime}
                      onChange={(e) => handleSelectTime(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                    />
                  </div>

                  {/* Formatted Time Confirmation Banner */}
                  {formattedTimePreview && (
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        <strong>Kickoff:</strong> {formattedTimePreview}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Max Players Slider/Number */}
              <div className="pt-4 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="match-players"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Total Athlete Capacity</span>
                  </label>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {maxPlayers} Athletes
                  </span>
                </div>
                <input
                  id="match-players"
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Play Together (Friend Invites) */}
          {friends.length > 0 && (
            <div className="apple-double-bezel shadow-lg">
              <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8">
                <p className="text-xs 2xl:text-sm font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400 mb-3">
                  Invite Friends (Optional)
                </p>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {friends.map((friend) => {
                    const isInvited = selectedFriends.includes(friend._id);
                    return (
                      <button
                        type="button"
                        key={friend._id}
                        onClick={() => toggleFriend(friend._id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                          isInvited
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-black/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-black/[0.08]"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{friend.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] py-4 px-6 rounded-2xl font-bold text-base text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Publishing Match...</span>
              </div>
            ) : (
              <>
                <span>Publish Match to Radar</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
