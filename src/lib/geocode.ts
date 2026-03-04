export interface GeocodeSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

let abortController: AbortController | null = null;

/**
 * Geocode search using Nominatim with India-optimized parameters.
 * Covers every city, town, village, landmark, railway station,
 * metro station, airport, hospital, mall, etc. across all Indian states.
 */
export async function geocodeSearch(query: string): Promise<GeocodeSuggestion[]> {
  if (query.length < 2) return [];

  // Cancel previous in-flight request
  if (abortController) abortController.abort();
  abortController = new AbortController();

  try {
    // Primary search: India-focused, high limit
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "8",
      countrycodes: "in",
      "accept-language": "en",
      dedupe: "1",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "EasyRide/1.0 (ride-compare-app)",
          Accept: "application/json",
        },
        signal: abortController.signal,
      }
    );

    if (!res.ok) throw new Error("Geocode failed");
    let results: GeocodeSuggestion[] = await res.json();

    // If few results, do a broader fallback search
    if (results.length < 3 && query.length >= 3) {
      const broadParams = new URLSearchParams({
        q: query + " India",
        format: "json",
        addressdetails: "1",
        limit: "5",
        "accept-language": "en",
        dedupe: "1",
      });

      try {
        const broadRes = await fetch(
          `https://nominatim.openstreetmap.org/search?${broadParams.toString()}`,
          {
            headers: {
              "User-Agent": "EasyRide/1.0 (ride-compare-app)",
              Accept: "application/json",
            },
            signal: abortController.signal,
          }
        );

        if (broadRes.ok) {
          const broadResults: GeocodeSuggestion[] = await broadRes.json();
          const existingIds = new Set(results.map((r) => r.place_id));
          for (const r of broadResults) {
            if (!existingIds.has(r.place_id)) {
              results.push(r);
              existingIds.add(r.place_id);
            }
          }
        }
      } catch {
        // Broad search failed, use what we have
      }
    }

    return results.slice(0, 8);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return [];
    throw err;
  }
}

/**
 * Reverse geocode: lat/lng → human readable address.
 * Uses zoom=18 for street-level detail.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: "json",
    addressdetails: "1",
    zoom: "18",
    "accept-language": "en",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        "User-Agent": "EasyRide/1.0 (ride-compare-app)",
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = await res.json();

  // Build a clean short address from address components
  if (data.address) {
    const a = data.address;
    const parts: string[] = [];

    if (a.road) parts.push(a.road);
    else if (a.neighbourhood) parts.push(a.neighbourhood);
    else if (a.suburb) parts.push(a.suburb);

    if (a.suburb && !parts.includes(a.suburb)) parts.push(a.suburb);
    else if (a.neighbourhood && !parts.includes(a.neighbourhood)) parts.push(a.neighbourhood);

    if (a.city) parts.push(a.city);
    else if (a.town) parts.push(a.town);
    else if (a.village) parts.push(a.village);
    else if (a.county) parts.push(a.county);

    if (a.state) parts.push(a.state);

    if (parts.length > 0) return parts.join(", ");
  }

  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
