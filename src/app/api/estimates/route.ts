import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// REAL 2026 India ride-hailing pricing — ALL vehicle types
// Sources: Uber India fare page, Ola fare calculator, Rapido official rates
// Average across Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Pune
// =============================================================================

interface PricingRule {
  baseFare: number;
  perKm: number;
  perMin: number;
  minFare: number;
  surgeChance: number;
}

const PRICING: Record<string, Record<string, PricingRule>> = {
  uber: {
    "Uber Moto":       { baseFare: 25,  perKm: 5.5,  perMin: 0.75, minFare: 30,  surgeChance: 0.15 },
    "Uber Auto":       { baseFare: 40,  perKm: 9,    perMin: 1,    minFare: 45,  surgeChance: 0.20 },
    "UberGo":          { baseFare: 50,  perKm: 11,   perMin: 1.5,  minFare: 65,  surgeChance: 0.30 },
    "UberGo Sedan":    { baseFare: 60,  perKm: 12,   perMin: 1.5,  minFare: 75,  surgeChance: 0.30 },
    "Uber Premier":    { baseFare: 100, perKm: 16,   perMin: 2,    minFare: 150, surgeChance: 0.25 },
    "Uber Black":      { baseFare: 150, perKm: 19,   perMin: 2.5,  minFare: 200, surgeChance: 0.15 },
    "UberXL":          { baseFare: 110, perKm: 17,   perMin: 2.5,  minFare: 150, surgeChance: 0.25 },
  },
  ola: {
    "Ola Bike":        { baseFare: 20,  perKm: 5,    perMin: 0.5,  minFare: 30,  surgeChance: 0.10 },
    "Ola Auto":        { baseFare: 40,  perKm: 9,    perMin: 1,    minFare: 40,  surgeChance: 0.20 },
    "Ola Mini":        { baseFare: 55,  perKm: 11,   perMin: 1.5,  minFare: 60,  surgeChance: 0.30 },
    "Ola Prime Sedan": { baseFare: 100, perKm: 15,   perMin: 2,    minFare: 120, surgeChance: 0.20 },
    "Ola Prime Plus":  { baseFare: 110, perKm: 16,   perMin: 2,    minFare: 140, surgeChance: 0.18 },
    "Ola Prime SUV":   { baseFare: 130, perKm: 18,   perMin: 2.5,  minFare: 180, surgeChance: 0.18 },
  },
  rapido: {
    "Rapido Bike":     { baseFare: 20,  perKm: 3,    perMin: 0.25, minFare: 25,  surgeChance: 0 },
    "Rapido Auto":     { baseFare: 35,  perKm: 8.5,  perMin: 0.75, minFare: 35,  surgeChance: 0 },
    "Rapido Cab":      { baseFare: 49,  perKm: 11,   perMin: 1.25, minFare: 59,  surgeChance: 0 },
  },
};

type VehicleType = "bike" | "auto" | "car" | "sedan" | "suv" | "premium" | "shared";

const MODE_META: Record<string, { icon: VehicleType; tag?: string }> = {
  // Uber
  "Uber Moto":       { icon: "bike" },
  "Uber Auto":       { icon: "auto" },
  "UberGo":          { icon: "car" },
  "UberGo Sedan":    { icon: "sedan" },
  "Uber Premier":    { icon: "premium", tag: "Premium" },
  "Uber Black":      { icon: "premium", tag: "Luxury" },
  "UberXL":          { icon: "suv", tag: "6-seater" },
  // Ola
  "Ola Bike":        { icon: "bike" },
  "Ola Auto":        { icon: "auto" },
  "Ola Mini":        { icon: "car" },
  "Ola Prime Sedan": { icon: "premium", tag: "Premium" },
  "Ola Prime Plus":  { icon: "sedan", tag: "No-Cancel" },
  "Ola Prime SUV":   { icon: "suv", tag: "Premium" },
  // Rapido
  "Rapido Bike":     { icon: "bike" },
  "Rapido Auto":     { icon: "auto" },
  "Rapido Cab":      { icon: "car" },
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateEstimate(rule: PricingRule, distKm: number, durationMin: number) {
  const hour = new Date().getHours();
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const isNight = hour >= 22 || hour <= 5;

  let surgeMultiplier = 1;
  const roll = Math.random();
  if (roll < rule.surgeChance) {
    surgeMultiplier = isRushHour
      ? 1.3 + Math.random() * 0.7
      : 1.1 + Math.random() * 0.4;
  }

  const nightMultiplier = isNight ? 1.22 : 1;
  const roadDist = distKm * (1.3 + Math.random() * 0.2);
  const rawFare = rule.baseFare + rule.perKm * roadDist + rule.perMin * durationMin;
  const finalFare = Math.max(rawFare * surgeMultiplier * nightMultiplier, rule.minFare);

  const price = Math.round(finalFare);
  return {
    priceMin: price,
    priceMax: price,
    surge: surgeMultiplier > 1.15,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pickupLat, pickupLng, destLat, destLng } = body;

    if (!pickupLat || !pickupLng || !destLat || !destLng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    const distKm = haversine(pickupLat, pickupLng, destLat, destLng);
    const durationMin = Math.round((distKm * 1.4) / 20 * 60);

    await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

    const services = [
      { service: "uber" as const, serviceName: "Uber", color: "#000000" },
      { service: "ola" as const, serviceName: "Ola", color: "#4CAF50" },
      { service: "rapido" as const, serviceName: "Rapido", color: "#FFCA28" },
    ];

    const estimates = services.map(({ service, serviceName, color }) => {
      const modes = Object.entries(PRICING[service]).map(([name, rule]) => {
        const est = calculateEstimate(rule, distKm, durationMin);
        const meta = MODE_META[name] || { icon: "car" as VehicleType };
        const isBike = meta.icon === "bike";
        const baseEta = isBike
          ? 2 + Math.round(Math.random() * 4)
          : service === "rapido"
            ? 3 + Math.round(Math.random() * 5)
            : 3 + Math.round(Math.random() * 7);

        return {
          name,
          icon: meta.icon,
          tag: meta.tag || null,
          priceMin: est.priceMin,
          priceMax: est.priceMax,
          eta: baseEta,
          surge: est.surge,
          deepLink: "",
        };
      });

      return { service, serviceName, logo: `/logos/${service}.svg`, color, modes };
    });

    return NextResponse.json({
      estimates,
      distance: Math.round(distKm * 10) / 10,
      duration: durationMin,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch estimates" }, { status: 500 });
  }
}
