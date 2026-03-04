"use client";

import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowUpDown, Loader2 } from "lucide-react";
import LocationInput from "./LocationInput";
import { useAppStore, Location, RideEstimate } from "@/lib/store";
import { reverseGeocode } from "@/lib/geocode";
import { generateDeepLink } from "@/lib/deeplinks";

// Lazy-load MapPicker (it imports Leaflet which is heavy)
const MapPicker = lazy(() => import("./MapPicker"));

export default function SearchForm() {
  const {
    pickup, destination,
    setPickup, setDestination,
    setSearching, setEstimates, setError,
    isSearching, addHistory,
  } = useAppStore();

  const [isDetecting, setIsDetecting] = useState(false);
  const [mapMode, setMapMode] = useState<"pickup" | "drop" | null>(null);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setIsDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      const { latitude, longitude } = pos.coords;
      const address = await reverseGeocode(latitude, longitude);
      setPickup({ address, lat: latitude, lng: longitude });
    } catch {
      setError("Couldn't detect location. Enter it manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  const swapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  const handleMapConfirm = (location: Location) => {
    if (mapMode === "pickup") setPickup(location);
    else if (mapMode === "drop") setDestination(location);
    setMapMode(null);
  };

  const handleSearch = async () => {
    if (!pickup || !destination) {
      setError("Enter both pickup and drop locations");
      return;
    }
    setError(null);
    setSearching(true);
    setEstimates([]);

    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupLat: pickup.lat, pickupLng: pickup.lng,
          destLat: destination.lat, destLng: destination.lng,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      const estimates: RideEstimate[] = data.estimates.map((est: RideEstimate) => ({
        ...est,
        modes: est.modes.map((mode) => ({
          ...mode,
          deepLink: generateDeepLink(est.service, pickup, destination, mode.name),
        })),
      }));

      setEstimates(estimates);
      addHistory({
        id: Date.now().toString(),
        pickup, destination,
        timestamp: Date.now(),
      });

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setError("Failed to fetch estimates. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const canSearch = pickup && destination && !isSearching;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="glass-card p-4 sm:p-6 space-y-3">
          {/* Location inputs */}
          <div className="relative">
            <LocationInput
              label="Pickup"
              placeholder="Search any place in India..."
              value={pickup}
              onChange={setPickup}
              variant="pickup"
              onDetectLocation={handleDetectLocation}
              isDetecting={isDetecting}
              onOpenMap={() => setMapMode("pickup")}
            />

            {/* Connector line + swap button */}
            <div className="flex items-center justify-center -my-1.5 relative z-10">
              <div className="absolute left-[26px] top-0 w-[1px] h-full border-l border-dashed border-muted/30" />
              <motion.button
                whileTap={{ scale: 0.8, rotate: 180 }}
                onClick={swapLocations}
                className="w-8 h-8 rounded-full bg-surface border border-card-border shadow-sm flex items-center justify-center active:bg-muted-light z-10"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
              </motion.button>
            </div>

            <LocationInput
              label="Drop"
              placeholder="Where to?"
              value={destination}
              onChange={setDestination}
              variant="drop"
              onOpenMap={() => setMapMode("drop")}
            />
          </div>

          {/* Search button */}
          <motion.button
            whileTap={canSearch ? { scale: 0.97 } : {}}
            onClick={handleSearch}
            disabled={!canSearch}
            className={`w-full py-4 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2.5 transition-all active:brightness-90 ${
              canSearch
                ? "gradient-bg shadow-lg shadow-primary/25"
                : "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            {isSearching ? (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80 bounce-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80 bounce-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80 bounce-dot" />
                </div>
                <span>Finding rides...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Compare Prices
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Full-screen Map Picker overlay */}
      <AnimatePresence>
        {mapMode && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            }
          >
            <MapPicker
              mode={mapMode}
              pickup={pickup}
              destination={destination}
              onConfirm={handleMapConfirm}
              onClose={() => setMapMode(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}
