"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function HistoryPage() {
  const { history, clearHistory, setPickup, setDestination } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("rideHistory");
    if (saved) {
      try { useAppStore.setState({ history: JSON.parse(saved) }); } catch {}
    }
    const dm = localStorage.getItem("darkMode");
    if (dm === "true") {
      document.documentElement.classList.add("dark");
      useAppStore.setState({ darkMode: true });
    }
  }, []);

  const handleReuse = (entry: (typeof history)[0]) => {
    setPickup(entry.pickup);
    setDestination(entry.destination);
    router.push("/");
  };

  return (
    <div className="min-h-[100dvh] mesh-gradient">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-lg mx-auto safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <motion.button
                whileTap={{ scale: 0.85 }}
                className="w-10 h-10 rounded-xl bg-surface border border-card-border flex items-center justify-center active:bg-muted-light"
              >
                <ArrowLeft className="w-[18px] h-[18px] text-foreground" />
              </motion.button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">History</h1>
          </div>
          {history.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={clearHistory}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-medium text-red-500 active:bg-red-50 dark:active:bg-red-950/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </motion.button>
          )}
        </div>

        {/* Empty state */}
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted-light flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-muted/40" />
            </div>
            <p className="text-[15px] font-medium text-foreground mb-1">No history yet</p>
            <p className="text-[13px] text-muted mb-5">Your ride searches will appear here</p>
            <Link href="/">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-xl gradient-bg text-white text-[13px] font-semibold shadow-md shadow-primary/20"
              >
                Compare rides
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {history.map((entry, i) => (
                <motion.button
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -80 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleReuse(entry)}
                  className="w-full glass-card p-4 active:scale-[0.98] transition-transform text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div className="w-[1px] h-4 border-l border-dashed border-muted/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-[13px] font-medium text-foreground line-clamp-1">
                        {entry.pickup.address}
                      </p>
                      <p className="text-[13px] font-medium text-foreground line-clamp-1">
                        {entry.destination.address}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-muted">
                        {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted/50" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
