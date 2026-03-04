"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Loader2, Map } from "lucide-react";
import { geocodeSearch, GeocodeSuggestion } from "@/lib/geocode";
import { Location } from "@/lib/store";

interface LocationInputProps {
  label: string;
  placeholder: string;
  value: Location | null;
  onChange: (loc: Location | null) => void;
  variant: "pickup" | "drop";
  onDetectLocation?: () => void;
  isDetecting?: boolean;
  onOpenMap?: () => void;
}

export default function LocationInput({
  label,
  placeholder,
  value,
  onChange,
  variant,
  onDetectLocation,
  isDetecting,
  onOpenMap,
}: LocationInputProps) {
  const [query, setQuery] = useState(value?.address || "");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (value?.address && value.address !== query) {
      setQuery(value.address);
    }
  }, [value?.address]);

  const searchLocations = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setIsLoading(true);
    try {
      const results = await geocodeSearch(q);
      setSuggestions(results);
    } catch { setSuggestions([]); }
    finally { setIsLoading(false); }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 350);
  };

  const handleSelect = (s: GeocodeSuggestion) => {
    const loc: Location = {
      address: s.display_name,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lon),
    };
    onChange(loc);
    setQuery(s.display_name);
    setSuggestions([]);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery("");
    onChange(null);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const dotColor = variant === "pickup" ? "bg-emerald-500" : "bg-primary";
  const ringColor =
    variant === "pickup"
      ? "ring-emerald-500/20 border-emerald-500/30"
      : "ring-primary/20 border-primary/30";

  return (
    <div ref={wrapperRef} className="relative">
      <motion.div
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-surface border transition-all duration-200 ${
          isFocused ? `ring-4 ${ringColor}` : "border-card-border"
        }`}
      >
        {/* Dot indicator */}
        <div className={`w-3 h-3 rounded-full ${dotColor} shadow-sm flex-shrink-0`} />

        {/* Input */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">{label}</p>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="w-full bg-transparent text-foreground placeholder-muted/50 text-[15px] font-medium outline-none truncate"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isLoading && <Loader2 className="w-4 h-4 text-muted animate-spin" />}
          {query && !isLoading && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.8 }}
              onClick={handleClear}
              className="w-7 h-7 rounded-full bg-muted-light flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-muted" />
            </motion.button>
          )}
          {/* Map pin button */}
          {onOpenMap && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onOpenMap}
              className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center active:bg-primary/20"
              title="Pick on map"
            >
              <Map className="w-4 h-4 text-primary" />
            </motion.button>
          )}
          {/* GPS detect button (pickup only) */}
          {variant === "pickup" && onDetectLocation && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onDetectLocation}
              disabled={isDetecting}
              className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center active:bg-emerald-500/20 disabled:opacity-40"
              title="Use my location"
            >
              {isDetecting ? (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-emerald-500" />
              )}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-2 glass-card shadow-2xl shadow-black/10 dark:shadow-black/30 z-50 overflow-hidden max-h-[260px] overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={s.place_id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleSelect(s)}
                className="w-full flex items-start gap-3 px-4 py-3 active:bg-primary/5 hover:bg-muted-light/60 transition-colors text-left border-b border-card-border/50 last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
                <span className="text-[13px] text-foreground leading-snug line-clamp-2">{s.display_name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
