"use client";

import { motion } from "framer-motion";
import { Car, Bike, Clock, AlertTriangle, ExternalLink, IndianRupee } from "lucide-react";
import { RideEstimate, RideMode } from "@/lib/store";
import { getPlayStoreLink } from "@/lib/deeplinks";

interface RideCardProps {
  estimate: RideEstimate;
  index: number;
  allEstimates: RideEstimate[];
}

function getModeIcon(icon: string) {
  if (icon === "bike") return <Bike className="w-4 h-4" />;
  if (icon === "auto")
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="8" rx="2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
        <path d="M5 8l2-4h10l2 4" />
      </svg>
    );
  return <Car className="w-4 h-4" />;
}

function ServiceBadge({ service }: { service: string }) {
  const styles: Record<string, string> = {
    uber: "bg-black dark:bg-white text-white dark:text-black",
    ola: "bg-emerald-500 text-white",
    rapido: "bg-amber-400 text-black",
  };
  return (
    <div className={`w-10 h-10 rounded-2xl ${styles[service] || "bg-gray-500 text-white"} flex items-center justify-center font-bold text-base shadow-sm`}>
      {service.charAt(0).toUpperCase()}
    </div>
  );
}

function getCheapestInCategory(allEstimates: RideEstimate[], iconType: string): number {
  let min = Infinity;
  for (const est of allEstimates) {
    for (const m of est.modes) {
      if (m.icon === iconType && m.priceMin < min) min = m.priceMin;
    }
  }
  return min;
}

export default function RideCard({ estimate, index, allEstimates }: RideCardProps) {
  const handleBook = (mode: RideMode) => {
    const link = mode.deepLink || getPlayStoreLink(estimate.service);
    window.open(link, "_blank", "noopener");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 120, damping: 18 }}
      className="glass-card overflow-hidden"
    >
      {/* Service header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <ServiceBadge service={estimate.service} />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-[15px]">{estimate.serviceName}</h3>
          <p className="text-[11px] text-muted">{estimate.modes.length} options available</p>
        </div>
      </div>

      {/* Ride modes */}
      <div className="px-3 pb-3 space-y-2">
        {estimate.modes.map((mode, i) => {
          const cheapest = getCheapestInCategory(allEstimates, mode.icon);
          const isCheapest = mode.priceMin === cheapest;

          return (
            <motion.button
              key={mode.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + i * 0.05 }}
              onClick={() => handleBook(mode)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${
                isCheapest
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50"
                  : "bg-muted-light/40 hover:bg-muted-light/70 active:bg-muted-light"
              }`}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCheapest
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  : "bg-white dark:bg-zinc-800 text-muted"
              }`}>
                {getModeIcon(mode.icon)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-foreground">{mode.name}</span>
                  {isCheapest && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded-full leading-none">
                      BEST
                    </span>
                  )}
                  {mode.surge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded-full leading-none flex items-center gap-0.5">
                      <AlertTriangle className="w-2 h-2" /> SURGE
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {mode.eta} min away
                </span>
              </div>

              {/* Price + book */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center text-[15px] font-bold text-foreground">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {mode.priceMin}
                    {mode.priceMax !== mode.priceMin && (
                      <span className="text-[11px] text-muted font-normal ml-0.5">
                        -{mode.priceMax}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isCheapest
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-primary text-white shadow-sm shadow-primary/30"
                }`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
