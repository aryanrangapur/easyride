"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import RideCard from "./RideCard";
import { AlertCircle, X, Car, Bike } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl skeleton" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-20 skeleton" />
          <div className="h-2.5 w-14 skeleton" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted-light/30">
          <div className="w-9 h-9 rounded-xl skeleton" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 skeleton" />
            <div className="h-2.5 w-16 skeleton" />
          </div>
          <div className="h-4 w-12 skeleton" />
          <div className="w-8 h-8 rounded-xl skeleton" />
        </div>
      ))}
    </div>
  );
}

const MODE_FILTERS = [
  { key: "all", label: "All", icon: null },
  { key: "car", label: "Cab", icon: <Car className="w-3.5 h-3.5" /> },
  { key: "bike", label: "Bike", icon: <Bike className="w-3.5 h-3.5" /> },
  {
    key: "auto",
    label: "Auto",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="8" rx="2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
        <path d="M5 8l2-4h10l2 4" />
      </svg>
    ),
  },
];

export default function ResultsSection() {
  const { estimates, isSearching, error, setError, selectedMode, setSelectedMode } =
    useAppStore();

  if (!isSearching && estimates.length === 0 && !error) return null;

  const filteredEstimates = estimates
    .map((est) => ({
      ...est,
      modes:
        selectedMode === "all"
          ? est.modes
          : est.modes.filter((m) => m.icon === selectedMode),
    }))
    .filter((est) => est.modes.length > 0);

  return (
    <div id="results" className="w-full max-w-lg mx-auto mt-6 scroll-mt-20">
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 p-3.5 mb-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-700 dark:text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="p-1">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeletons */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary bounce-dot" />
              <div className="w-2 h-2 rounded-full bg-primary bounce-dot" />
              <div className="w-2 h-2 rounded-full bg-primary bounce-dot" />
            </div>
            <span className="text-[13px] text-muted font-medium">Comparing prices...</span>
          </div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </motion.div>
      )}

      {/* Results */}
      {!isSearching && filteredEstimates.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Mode filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MODE_FILTERS.map((f) => (
              <motion.button
                key={f.key}
                whileTap={{ scale: 0.92 }}
                onClick={() => setSelectedMode(f.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                  selectedMode === f.key
                    ? "gradient-bg text-white shadow-md shadow-primary/20"
                    : "bg-muted-light text-muted active:bg-primary/10"
                }`}
              >
                {f.icon}
                {f.label}
              </motion.button>
            ))}
          </div>

          {/* Cards */}
          <AnimatePresence mode="popLayout">
            {filteredEstimates.map((est, i) => (
              <RideCard
                key={est.service}
                estimate={est}
                index={i}
                allEstimates={filteredEstimates}
              />
            ))}
          </AnimatePresence>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[11px] text-muted text-center py-2"
          >
            Tap any ride to book directly in the app with your locations pre-filled
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
