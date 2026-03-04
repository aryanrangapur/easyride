"use client";

import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Moon, Sun, History } from "lucide-react";
import Link from "next/link";
import Logo, { LogoText } from "./Logo";

export default function Navbar() {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <motion.nav
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 safe-top"
    >
      <div className="glass-card mx-3 mt-2 !rounded-2xl border border-card-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <LogoText className="text-lg" />
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/history">
              <motion.button
                whileTap={{ scale: 0.85 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted-light active:bg-muted-light transition-colors"
              >
                <History className="w-[18px] h-[18px] text-muted" />
              </motion.button>
            </Link>

            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted-light active:bg-muted-light transition-colors"
            >
              <motion.div
                key={darkMode ? "sun" : "moon"}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {darkMode ? (
                  <Sun className="w-[18px] h-[18px] text-amber-400" />
                ) : (
                  <Moon className="w-[18px] h-[18px] text-muted" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
