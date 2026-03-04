"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X, Crosshair, Loader2, Minus, Plus, Layers } from "lucide-react";
import { Location } from "@/lib/store";
import { reverseGeocode } from "@/lib/geocode";
import L from "leaflet";

const PICKUP_ICON_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="28" viewBox="0 0 20 28"><path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="%2322c55e"/><circle cx="10" cy="10" r="4" fill="white"/></svg>`)}`;

const DROP_ICON_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="28" viewBox="0 0 20 28"><path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="%23FF6B35"/><circle cx="10" cy="10" r="4" fill="white"/></svg>`)}`;

function createIcon(svgUrl: string) {
  return L.icon({
    iconUrl: svgUrl,
    iconSize: [20, 28],
    iconAnchor: [10, 28],
    popupAnchor: [0, -28],
  });
}

const TILE_LAYERS = {
  streets: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    label: "Streets",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    label: "Satellite",
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    label: "Light",
  },
};

interface MapPickerProps {
  mode: "pickup" | "drop";
  pickup: Location | null;
  destination: Location | null;
  onConfirm: (location: Location) => void;
  onClose: () => void;
}

export default function MapPicker({ mode, pickup, destination, onConfirm, onClose }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);

  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tileKey, setTileKey] = useState<keyof typeof TILE_LAYERS>("streets");
  const [showLayers, setShowLayers] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const getDefaultCenter = useCallback((): [number, number] => {
    if (mode === "drop" && pickup) return [pickup.lat, pickup.lng];
    if (mode === "pickup" && destination) return [destination.lat, destination.lng];
    if (pickup) return [pickup.lat, pickup.lng];
    if (destination) return [destination.lat, destination.lng];
    return [20.5937, 78.9629];
  }, [mode, pickup, destination]);

  const getDefaultZoom = useCallback((): number => {
    if (pickup || destination) return 16;
    return 5;
  }, [pickup, destination]);

  const geocodeCenter = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setCoords({ lat, lng });
    try {
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = getDefaultCenter();
    const zoom = getDefaultZoom();

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    tileLayerRef.current = L.tileLayer(TILE_LAYERS.streets.url, {
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(map);

    if (pickup) {
      pickupMarkerRef.current = L.marker([pickup.lat, pickup.lng], {
        icon: createIcon(PICKUP_ICON_SVG),
        interactive: false,
      }).addTo(map);
    }
    if (destination) {
      dropMarkerRef.current = L.marker([destination.lat, destination.lng], {
        icon: createIcon(DROP_ICON_SVG),
        interactive: false,
      }).addTo(map);
    }

    geocodeCenter(center[0], center[1]);

    map.on("moveend", () => {
      const c = map.getCenter();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        geocodeCenter(c.lat, c.lng);
      }, 400);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch tile layer
  const switchTileLayer = (key: keyof typeof TILE_LAYERS) => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(TILE_LAYERS[key].url, {
      maxZoom: 20,
      subdomains: "abcd",
    }).addTo(mapRef.current);
    setTileKey(key);
    setShowLayers(false);
  };

  const handleLocateMe = async () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setIsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 18, { duration: 1.2 });
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleConfirm = () => {
    if (!coords || !address) return;
    onConfirm({ address, lat: coords.lat, lng: coords.lng });
  };

  const pinColor = mode === "pickup" ? "#22c55e" : "#FF6B35";
  const btnClass = mode === "pickup"
    ? "bg-emerald-500 shadow-emerald-500/30"
    : "gradient-bg shadow-primary/30";

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* Map */}
      <div ref={mapContainerRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {/* Tiny center crosshair + dot for precision */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        <div className="relative" style={{ width: 28, height: 28 }}>
          {/* Crosshair lines */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1.5px] h-2 rounded-full" style={{ background: pinColor, opacity: 0.6 }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] h-2 rounded-full" style={{ background: pinColor, opacity: 0.6 }} />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] w-2 rounded-full" style={{ background: pinColor, opacity: 0.6 }} />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[1.5px] w-2 rounded-full" style={{ background: pinColor, opacity: 0.6 }} />
          {/* Center dot */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ background: pinColor, boxShadow: `0 0 6px ${pinColor}40` }}
          />
        </div>
      </div>

      {/* Top address bar */}
      <div className="absolute top-0 left-0 right-0 safe-top" style={{ zIndex: 1001 }}>
        <div className="mx-3 mt-3">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/40 border border-black/5 dark:border-white/10 px-4 py-3 flex items-center gap-3"
          >
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 active:bg-gray-200 dark:active:bg-zinc-700"
            >
              <X className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: pinColor }}>
                {mode === "pickup" ? "Set pickup point" : "Set drop location"}
              </p>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bounce-dot" style={{ background: pinColor }} />
                    <div className="w-1.5 h-1.5 rounded-full bounce-dot" style={{ background: pinColor }} />
                    <div className="w-1.5 h-1.5 rounded-full bounce-dot" style={{ background: pinColor }} />
                  </div>
                  <span className="text-[13px] text-muted">Finding address...</span>
                </div>
              ) : (
                <p className="text-[14px] font-semibold text-foreground line-clamp-2 leading-snug">
                  {address || "Move the map to select location"}
                </p>
              )}
            </div>
            {/* Coordinates chip */}
            {coords && !isLoading && (
              <span className="text-[9px] text-muted/60 font-mono flex-shrink-0 hidden sm:block">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right side controls */}
      <div
        className="absolute right-3 flex flex-col gap-2"
        style={{ zIndex: 1001, top: "50%", transform: "translateY(-50%)" }}
      >
        {/* Locate me */}
        <motion.button
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleLocateMe}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-black/12 dark:shadow-black/40 border border-black/5 dark:border-white/10 flex items-center justify-center active:bg-gray-50"
        >
          <Crosshair className="w-[18px] h-[18px] text-primary" />
        </motion.button>

        {/* Zoom in */}
        <motion.button
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleZoomIn}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-black/12 dark:shadow-black/40 border border-black/5 dark:border-white/10 flex items-center justify-center active:bg-gray-50"
        >
          <Plus className="w-[18px] h-[18px] text-foreground" />
        </motion.button>

        {/* Zoom out */}
        <motion.button
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleZoomOut}
          className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-black/12 dark:shadow-black/40 border border-black/5 dark:border-white/10 flex items-center justify-center active:bg-gray-50"
        >
          <Minus className="w-[18px] h-[18px] text-foreground" />
        </motion.button>

        {/* Map layer switcher */}
        <div className="relative">
          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowLayers(!showLayers)}
            className="w-11 h-11 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-black/12 dark:shadow-black/40 border border-black/5 dark:border-white/10 flex items-center justify-center active:bg-gray-50"
          >
            <Layers className="w-[18px] h-[18px] text-muted" />
          </motion.button>

          {showLayers && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className="absolute right-full mr-2 top-0 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden min-w-[100px]"
            >
              {(Object.keys(TILE_LAYERS) as (keyof typeof TILE_LAYERS)[]).map((key) => (
                <button
                  key={key}
                  onClick={() => switchTileLayer(key)}
                  className={`w-full px-3 py-2 text-left text-[12px] font-medium transition-colors ${
                    tileKey === key
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {TILE_LAYERS[key].label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom confirm */}
      <div className="absolute bottom-0 left-0 right-0 safe-bottom" style={{ zIndex: 1001 }}>
        <div className="mx-3 mb-4">
          <motion.button
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 150 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={!coords || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-2.5 shadow-2xl transition-all active:brightness-90 ${
              coords && !isLoading
                ? btnClass
                : "bg-gray-300 dark:bg-zinc-700 cursor-not-allowed shadow-none"
            }`}
          >
            <Check className="w-5 h-5" />
            Confirm {mode === "pickup" ? "Pickup" : "Drop"} Location
          </motion.button>
        </div>
      </div>
    </div>
  );
}
