import { Location } from "./store";

// ============================================================
// DEVICE DETECTION
// ============================================================
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
  return address.length > 80 ? address.substring(0, 80) : address;
}

// ============================================================
// UBER - Universal links work on both iOS and Android
// m.uber.com/ul opens the app if installed, web otherwise
// ============================================================
export function generateUberDeepLink(
  pickup: Location,
  destination: Location
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
  return `https://m.uber.com/ul/?${params.toString()}`;
}

// ============================================================
// OLA - Universal link that opens app if installed
// Correct params: lat, lng (pickup), drop_lat, drop_lng (drop)
// ============================================================
const OLA_CATEGORIES: Record<string, string> = {
  "Ola Bike": "bike",
  "Ola Auto": "auto",
  "Ola Mini": "mini",
  "Ola Prime Sedan": "sedan",
  "Ola Prime Plus": "sedan",
  "Ola Prime SUV": "suv",
};

export function generateOlaDeepLink(
  pickup: Location,
  destination: Location,
  modeName?: string
): string {
  const params = new URLSearchParams({
    lat: pickup.lat.toFixed(6),
    lng: pickup.lng.toFixed(6),
    pickup_name: shortenAddress(pickup.address),
    drop_lat: destination.lat.toFixed(6),
    drop_lng: destination.lng.toFixed(6),
    drop_name: shortenAddress(destination.address),
  });
  const cat = modeName ? OLA_CATEGORIES[modeName] : undefined;
  if (cat) params.set("category", cat);

  // Try app scheme first on mobile, fallback to web booking
  if (isMobile()) {
    if (isAndroid()) {
      // Android: intent URI that opens Ola app or falls back to Play Store
      return `intent://app/launch?${params.toString()}#Intent;scheme=olacabs;package=com.olacabs.customer;S.browser_fallback_url=${encodeURIComponent(`https://book.olacabs.com/?${params.toString()}`)};end`;
    }
    if (isIOS()) {
      // iOS: try olacabs:// scheme, but use universal link as reliable fallback
      // We use the web URL which iOS will intercept if the app is installed (Associated Domains)
      return `https://book.olacabs.com/?${params.toString()}`;
    }
  }
  return `https://book.olacabs.com/?${params.toString()}`;
}

// ============================================================
// RAPIDO - Android intent URI, iOS App Store fallback
// Rapido has no public deep link docs, so we use best-known schemes
// ============================================================
export function generateRapidoDeepLink(
  pickup: Location,
  destination: Location
): string {
  if (isMobile()) {
    if (isAndroid()) {
      // Android intent URI - opens Rapido app if installed, falls back to Play Store
      const rideParams = `from_lat=${pickup.lat.toFixed(6)}&from_lng=${pickup.lng.toFixed(6)}&from_name=${encodeURIComponent(shortenAddress(pickup.address))}&to_lat=${destination.lat.toFixed(6)}&to_lng=${destination.lng.toFixed(6)}&to_name=${encodeURIComponent(shortenAddress(destination.address))}`;
      return `intent://ride?${rideParams}#Intent;scheme=rapido;package=com.rapido.passenger;S.browser_fallback_url=${encodeURIComponent("https://play.google.com/store/apps/details?id=com.rapido.passenger")};end`;
    }
    if (isIOS()) {
      // iOS: try rapido:// scheme via a redirect approach
      // Since Rapido doesn't have universal links, we open the app store page
      // which will show "Open" if app is installed
      return "https://apps.apple.com/in/app/rapido-bike-taxi-auto-cabs/id1198464606";
    }
  }
  // Desktop fallback
  return "https://www.rapido.bike/";
}

// ============================================================
// STORE LINKS
// ============================================================
export function getPlayStoreLink(service: string): string {
  const ids: Record<string, string> = {
    uber: "com.ubercab",
    ola: "com.olacabs.customer",
    rapido: "com.rapido.passenger",
  };
  return `https://play.google.com/store/apps/details?id=${ids[service] || ids.uber}`;
}

export function getAppStoreLink(service: string): string {
  const ids: Record<string, string> = {
    uber: "id368677368",
    ola: "id539179365",
    rapido: "id1198464606",
  };
  return `https://apps.apple.com/in/app/${ids[service] || ids.uber}`;
}

// ============================================================
// MAIN DISPATCHER
// ============================================================
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
      return generateOlaDeepLink(pickup, destination, modeName);
    case "rapido":
      return generateRapidoDeepLink(pickup, destination);
    default:
      return isMobile() && isIOS()
        ? getAppStoreLink(service)
        : getPlayStoreLink(service);
  }
}
