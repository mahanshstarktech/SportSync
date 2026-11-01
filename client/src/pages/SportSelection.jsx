import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import API from "../services/api";

const SPORTS = [
  { name: "Cricket", emoji: "🏏" },
  { name: "Football", emoji: "⚽" },
  { name: "Basketball", emoji: "🏀" },
  { name: "Tennis", emoji: "🎾" },
  { name: "Badminton", emoji: "🏸" },
  { name: "Volleyball", emoji: "🏐" },
  { name: "Kabaddi", emoji: "🤼" },
  { name: "Hockey", emoji: "🏑" },
  { name: "Table Tennis", emoji: "🏓" },
  { name: "Swimming", emoji: "🏊" },
  { name: "Athletics", emoji: "🏃" },
  { name: "Boxing", emoji: "🥊" },
];

export default function SportSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggle = (sport) => {
    setErrorMsg("");
    setSelected((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      setErrorMsg("Please select at least one sport to personalize your feed.");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      await API.put("/users/me", { sports: selected });
      localStorage.setItem("sportsSelected", "true");
      navigate("/dashboard");
    } catch (err) {
      console.error("Sport selection save error:", err);
      // Fallback: save locally and proceed so user is never blocked
      localStorage.setItem("sportsSelected", "true");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("sportsSelected", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors">
      <div className="w-full max-w-xl mx-auto">
        <div className="apple-double-bezel shadow-2xl">
          <div className="apple-glass-card rounded-[calc(1.75rem-3px)] p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personalize Experience</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                What sports do you play?
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Choose your favorite disciplines. We’ll curate matches, venues, and rivalries tailored to you.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            {/* Sports Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[380px] overflow-y-auto p-1">
              {SPORTS.map((sport) => {
                const isSelected = selected.includes(sport.name);
                return (
                  <button
                    key={sport.name}
                    type="button"
                    onClick={() => toggle(sport.name)}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center smooth-press ${
                      isSelected
                        ? "bg-blue-600/10 border-blue-500 dark:border-blue-400 shadow-sm shadow-blue-500/10"
                        : "bg-black/[0.02] dark:bg-white/[0.04] border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20"
                    }`}
                  >
                    <span className="text-3xl mb-1.5 select-none">{sport.emoji}</span>
                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {sport.name}
                    </span>

                    {/* Active check pill */}
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Count Indicator */}
            {selected.length > 0 && (
              <p className="text-center text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4 animate-fade-in">
                {selected.length} sport{selected.length > 1 ? "s" : ""} selected
              </p>
            )}

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleContinue}
                disabled={loading || selected.length === 0}
                className="w-full min-h-[46px] py-3 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter SportSync Arena</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2.5 px-4 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
