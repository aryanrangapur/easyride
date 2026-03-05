"use client";

import { motion } from "framer-motion";
import { Car, Bike, Clock, AlertTriangle, ExternalLink, IndianRupee, Crown } from "lucide-react";
import { RideEstimate, RideMode } from "@/lib/store";
import { getPlayStoreLink } from "@/lib/deeplinks";

interface RideCardProps {
  estimate: RideEstimate;
  index: number;
  allEstimates: RideEstimate[];
}

function getModeIcon(icon: string, size = "w-4 h-4") {
  switch (icon) {
    case "bike":
      return <Bike className={size} />;
    case "auto":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="8" rx="2" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
          <path d="M5 8l2-4h10l2 4" />
        </svg>
      );
    case "sedan":
      return <Car className={size} />;
    case "suv":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 17h14M3 11l2-5h14l2 5" />
          <rect x="2" y="11" width="20" height="6" rx="2" />
          <circle cx="6.5" cy="17" r="2.5" />
          <circle cx="17.5" cy="17" r="2.5" />
        </svg>
      );
    case "premium":
      return <Crown className={size} />;
    default:
      return <Car className={size} />;
  }
}

function getTagStyle(tag: string | null | undefined): { bg: string; text: string } | null {
  if (!tag) return null;
  switch (tag) {
    case "Comfort": return { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" };
    case "Premium": return { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300" };
    case "Luxury": return { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300" };
    case "6-seater": return { bg: "bg-cyan-100 dark:bg-cyan-900/40", text: "text-cyan-700 dark:text-cyan-300" };
    case "No-Cancel": return { bg: "bg-teal-100 dark:bg-teal-900/40", text: "text-teal-700 dark:text-teal-300" };
    default: return { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-300" };
  }
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
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <ServiceBadge service={estimate.service} />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-[15px]">{estimate.serviceName}</h3>
          <p className="text-[11px] text-muted">{estimate.modes.length} ride types</p>
        </div>
      </div>

      {/* Ride modes */}
      <div className="px-3 pb-3 space-y-1.5">
        {estimate.modes.map((mode, i) => {
          const cheapest = getCheapestInCategory(allEstimates, mode.icon);
          const isCheapest = mode.priceMin === cheapest;
          const tagStyle = getTagStyle(mode.tag);

          return (
            <motion.button
              key={mode.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + i * 0.03 }}
              onClick={() => handleBook(mode)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all active:scale-[0.98] ${
                isCheapest
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50"
                  : "bg-muted-light/40 hover:bg-muted-light/70 active:bg-muted-light"
              }`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isCheapest
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  : "bg-white dark:bg-zinc-800 text-muted"
              }`}>
                {getModeIcon(mode.icon, "w-3.5 h-3.5")}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[12px] font-semibold text-foreground">{mode.name}</span>
                  {tagStyle && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none ${tagStyle.bg} ${tagStyle.text}`}>
                      {mode.tag}
                    </span>
                  )}
                  {isCheapest && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded-full leading-none">
                      BEST
                    </span>
                  )}
                  {mode.surge && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded-full leading-none flex items-center gap-0.5">
                      <AlertTriangle className="w-2 h-2" /> SURGE
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" /> {mode.eta} min
                </span>
              </div>

              {/* Price + book arrow */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="flex items-center text-[14px] font-bold text-foreground">
                    <IndianRupee className="w-3 h-3" />
                    {mode.priceMin}
                    {mode.priceMax !== mode.priceMin && (
                      <span className="text-[10px] text-muted font-normal ml-0.5">
                        -{mode.priceMax}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isCheapest
                    ? "bg-emerald-500 text-white"
                    : "bg-primary text-white"
                }`}>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
