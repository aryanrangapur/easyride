import { create } from "zustand";

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface RideEstimate {
  service: "uber" | "ola" | "rapido";
  serviceName: string;
  logo: string;
  color: string;
  modes: RideMode[];
}

export interface RideMode {
  name: string;
  icon: string;
  priceMin: number;
  priceMax: number;
  eta: number; // minutes
  surge: boolean;
  deepLink: string;
}

export interface SearchHistory {
  id: string;
  pickup: Location;
  destination: Location;
  timestamp: number;
}

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Location
  pickup: Location | null;
  destination: Location | null;
  setPickup: (loc: Location | null) => void;
  setDestination: (loc: Location | null) => void;

  // Search
  isSearching: boolean;
  estimates: RideEstimate[];
  error: string | null;
  setSearching: (val: boolean) => void;
  setEstimates: (estimates: RideEstimate[]) => void;
  setError: (error: string | null) => void;

  // History
  history: SearchHistory[];
  addHistory: (entry: SearchHistory) => void;
  clearHistory: () => void;

  // Selected mode filter
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: false,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("darkMode", JSON.stringify(next));
      }
      return { darkMode: next };
    }),

  pickup: null,
  destination: null,
  setPickup: (loc) => set({ pickup: loc }),
  setDestination: (loc) => set({ destination: loc }),

  isSearching: false,
  estimates: [],
  error: null,
  setSearching: (val) => set({ isSearching: val }),
  setEstimates: (estimates) => set({ estimates }),
  setError: (error) => set({ error }),

  history: [],
  addHistory: (entry) =>
    set((state) => {
      const updated = [entry, ...state.history].slice(0, 20);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("rideHistory", JSON.stringify(updated));
      }
      return { history: updated };
    }),
  clearHistory: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("rideHistory");
    }
    set({ history: [] });
  },

  selectedMode: "all",
  setSelectedMode: (mode) => set({ selectedMode: mode }),
}));
