import { Location } from "./store";

// ============================================================
// UBER - Universal links work on both iOS and Android
// Docs: https://developer.uber.com/docs/riders/ride-requests/tutorials/deep-links/introduction
// ============================================================
export function generateUberDeepLink(
  pickup: Location,
  destination: Location,
  productId?: string
): string {
  const params = new URLSearchParams({
    action: "setPickup",
    "pickup[latitude]": pickup.lat.toFixed(6),
    "pickup[longitude]": pickup.lng.toFixed(6),
    "pickup[formatted_address]": shortenAddress(pickup.address),
    "dropoff[latitude]": destination.lat.toFixed(6),
    "dropoff[longitude]": destination.lng.toFixed(6),
    "dropoff[formatted_address]": shortenAddress(destination.address),
  });
  if (productId) params.set("product_id", productId);
  // m.uber.com universal link opens app on mobile, web on desktop
  return `https://m.uber.com/ul/?${params.toString()}`;
}

// Uber product IDs by vehicle type (India, may vary by city)
export const UBER_PRODUCTS: Record<string, string> = {
  UberGo: "db6779d6-d8da-479f-8002-1d tried", // fallback - app picks nearest
  UberMoto: "MOTO",
  UberAuto: "AUTO",
};

// ============================================================
// OLA - Universal link + app scheme
// Book URL opens Ola app if installed, else Ola web
// ============================================================
export function generateOlaDeepLink(
  pickup: Location,
  destination: Location,
  category?: string
): string {
  const params = new URLSearchParams({
    pickup_lat: pickup.lat.toFixed(6),
    pickup_lng: pickup.lng.toFixed(6),
    pickup_name: shortenAddress(pickup.address),
    drop_lat: destination.lat.toFixed(6),
    drop_lng: destination.lng.toFixed(6),
    drop_name: shortenAddress(destination.address),
  });
  if (category) params.set("category", category);
  return `https://book.olacabs.com/?${params.toString()}`;
}

export const OLA_CATEGORIES: Record<string, string> = {
  "Ola Mini": "mini",
  "Ola Bike": "bike",
  "Ola Auto": "auto",
};

// ============================================================
// RAPIDO - Intent URL for Android, fallback to Play Store
// Rapido doesn't have public deep links, so we use intent scheme
// which opens the app if installed, else Play Store
// ============================================================
export function generateRapidoDeepLink(
  pickup: Location,
  destination: Location,
  _mode?: string
): string {
  // Android intent URL - tries to open Rapido app, fallback to Play Store
  if (isMobile() && isAndroid()) {
    return `intent://ride?from_lat=${pickup.lat.toFixed(6)}&from_lng=${pickup.lng.toFixed(6)}&from_name=${encodeURIComponent(shortenAddress(pickup.address))}&to_lat=${destination.lat.toFixed(6)}&to_lng=${destination.lng.toFixed(6)}&to_name=${encodeURIComponent(shortenAddress(destination.address))}#Intent;scheme=rapido;package=com.rapido.passenger;end`;
  }
  // Fallback: Play Store with referrer containing ride info
  return `https://play.google.com/store/apps/details?id=com.rapido.passenger&referrer=utm_source%3Deasyride%26pickup_lat%3D${pickup.lat}%26pickup_lng%3D${pickup.lng}%26drop_lat%3D${destination.lat}%26drop_lng%3D${destination.lng}`;
}

// ============================================================
// NAMMA YATRI - Open-source, uses universal links
// ============================================================
export function generateNammaYatriDeepLink(
  pickup: Location,
  destination: Location
): string {
  return `https://nammayatri.in/ride?pickup_lat=${pickup.lat.toFixed(6)}&pickup_lng=${pickup.lng.toFixed(6)}&drop_lat=${destination.lat.toFixed(6)}&drop_lng=${destination.lng.toFixed(6)}`;
}

// ============================================================
// HELPERS
// ============================================================
export function getPlayStoreLink(service: string): string {
  const ids: Record<string, string> = {
    uber: "com.ubercab",
    ola: "com.olacabs.customer",
    rapido: "com.rapido.passenger",
    nammayatri: "in.juspay.nammayatri",
  };
  return `https://play.google.com/store/apps/details?id=${ids[service] || ids.uber}`;
}

export function getAppStoreLink(service: string): string {
  const ids: Record<string, string> = {
    uber: "id368677368",
    ola: "id539179365",
    rapido: "id1476983922",
  };
  return `https://apps.apple.com/in/app/${ids[service] || ids.uber}`;
}

export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function shortenAddress(address: string): string {
  // Limit address to prevent URL issues
  return address.length > 80 ? address.substring(0, 80) : address;
}

// Main function to generate deep link for a ride
export function generateDeepLink(
  service: string,
  pickup: Location,
  destination: Location,
  modeName?: string
): string {
  switch (service) {
    case "uber":
      return generateUberDeepLink(pickup, destination);
    case "ola":
      return generateOlaDeepLink(
        pickup,
        destination,
        modeName ? OLA_CATEGORIES[modeName] : undefined
      );
    case "rapido":
      return generateRapidoDeepLink(pickup, destination, modeName);
    default:
      return getPlayStoreLink(service);
  }
}
