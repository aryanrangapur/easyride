"use client";

import { useEffect, useState } from "react";
import { motion, type Variants, useInView } from "framer-motion";
import {
  ArrowRight, IndianRupee, Clock, Shield, MapPin,
  Bike, Car, Sparkles, ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";
import ResultsSection from "@/components/ResultsSection";
import Logo from "@/components/Logo";
import { useAppStore } from "@/lib/store";
import { useRef } from "react";

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 14 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 150, damping: 16 } },
};

/* ========= HOW IT WORKS STEP ========= */
function Step({ num, title, desc, icon, delay }: {
  num: string; title: string; desc: string; icon: React.ReactNode; delay: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, type: "spring", stiffness: 100 }}
      className="relative flex gap-4"
    >
      {/* Number + line */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20">
          {num}
        </div>
        <div className="flex-1 w-[1px] bg-gradient-to-b from-primary/30 to-transparent mt-2" />
      </div>
      {/* Content */}
      <div className="pb-8 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-muted/50">{icon}</span>
          <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

/* ========= STAT CARD ========= */
function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card p-4 text-center flex-1 min-w-0">
      <div className="flex items-center justify-center mb-2 text-primary">{icon}</div>
      <p className="text-[20px] font-extrabold text-foreground tracking-tight">{value}</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}

/* ========= FLOATING SERVICE BUBBLE ========= */
function ServiceBubble({ name, color, letter, className }: {
  name: string; color: string; letter: string; className?: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl"
        style={{ background: color }}
      >
        {letter}
      </div>
      <p className="text-[9px] font-semibold text-muted text-center mt-1">{name}</p>
    </div>
  );
}

/* ========= MAIN PAGE ========= */
export default function Home() {
  const { estimates } = useAppStore();
  const howItWorksRef = useRef(null);
  const howInView = useInView(howItWorksRef, { once: true, margin: "-60px" });

  useEffect(() => {
    const dm = localStorage.getItem("darkMode");
    if (dm === "true") {
      document.documentElement.classList.add("dark");
      useAppStore.setState({ darkMode: true });
    }
    const hist = localStorage.getItem("rideHistory");
    if (hist) {
      try { useAppStore.setState({ history: JSON.parse(hist) }); } catch {}
    }
  }, []);

  return (
    <div className="min-h-[100dvh] mesh-gradient">
      <Navbar />

      <main className="pt-[72px] pb-6 px-4 safe-bottom">

        {/* ====== HERO SECTION ====== */}
        <section className="max-w-lg mx-auto mt-2 mb-6 relative">
          {/* Decorative floating orbs */}
          <div className="absolute -top-6 -right-4 w-20 h-20 rounded-full bg-primary/8 blur-2xl float-orb pointer-events-none" />
          <div className="absolute top-10 -left-6 w-16 h-16 rounded-full bg-emerald-500/8 blur-2xl float-orb-delay pointer-events-none" />

          <motion.div variants={stagger} initial="hidden" animate="show">
            {/* Tagline chip */}
            <motion.div variants={fadeUp} className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-[11px] font-semibold text-primary">
                <Sparkles className="w-3 h-3" />
                Stop overpaying for rides
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-[30px] sm:text-[38px] font-extrabold tracking-tight text-foreground leading-[1.1] mb-3"
            >
              Every cab app.{" "}
              <br />
              <span className="animated-gradient-text">
                One smart search.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p variants={fadeUp} className="text-[15px] text-muted leading-relaxed mb-4 max-w-sm">
              Instantly compare fares across Uber, Ola & Rapido. Pick the cheapest option and book directly — no switching between apps.
            </motion.p>

            {/* Service badges + savings hint */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-2">
              <div className="flex items-center -space-x-2">
                {[
                  { l: "U", bg: "#000", dark: "#fff", textDark: "#000" },
                  { l: "O", bg: "#22c55e" },
                  { l: "R", bg: "#facc15", text: "#000" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ring-2 ring-background"
                    style={{
                      background: s.bg,
                      color: s.text || "#fff",
                    }}
                  >
                    {s.l}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground">3 services compared</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Users save avg. ₹35-80 per ride</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ====== SEARCH FORM ====== */}
        <SearchForm />

        {/* ====== RESULTS ====== */}
        <ResultsSection />

        {/* ====== HOW IT WORKS ====== */}
        {estimates.length === 0 && (
          <>
            <section ref={howItWorksRef} className="max-w-lg mx-auto mt-14">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={howInView ? { opacity: 1, y: 0 } : {}}
                transition={{ type: "spring", stiffness: 100 }}
                className="mb-6"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">How it works</p>
                <h2 className="text-[22px] font-extrabold text-foreground tracking-tight">
                  Three taps to your cheapest ride
                </h2>
              </motion.div>

              <Step
                num="1"
                title="Enter your route"
                desc="Type any place in India or drop a pin on the map. We cover every city, town, village, landmark — even that chai stall near your PG."
                icon={<MapPin className="w-4 h-4" />}
                delay={0.1}
              />
              <Step
                num="2"
                title="Compare prices instantly"
                desc="We fetch real-time estimates from Uber, Ola & Rapido in parallel. See the cheapest for each ride type — auto, bike, or cab."
                icon={<IndianRupee className="w-4 h-4" />}
                delay={0.2}
              />
              <Step
                num="3"
                title="Book in the app"
                desc="Tap any ride and it opens directly in that app with your pickup & drop pre-filled. No copy-pasting, no re-entering addresses."
                icon={<ArrowRight className="w-4 h-4" />}
                delay={0.3}
              />
            </section>

            {/* ====== STATS ====== */}
            <section className="max-w-lg mx-auto mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                className="flex gap-3"
              >
                <StatCard
                  value="₹35-80"
                  label="Avg. savings per ride"
                  icon={<IndianRupee className="w-5 h-5" />}
                />
                <StatCard
                  value="<2s"
                  label="Comparison speed"
                  icon={<Clock className="w-5 h-5" />}
                />
                <StatCard
                  value="100%"
                  label="Free forever"
                  icon={<Shield className="w-5 h-5" />}
                />
              </motion.div>
            </section>

            {/* ====== RIDE TYPES SHOWCASE ====== */}
            <section className="max-w-lg mx-auto mt-14">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Ride types</p>
                <h2 className="text-[22px] font-extrabold text-foreground tracking-tight mb-5">
                  Whatever moves you
                </h2>
              </motion.div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    name: "Bike",
                    desc: "Fastest in traffic",
                    price: "From ₹20",
                    icon: <Bike className="w-6 h-6" />,
                    color: "text-emerald-500",
                    bg: "bg-emerald-50 dark:bg-emerald-950/30",
                    border: "border-emerald-200/60 dark:border-emerald-800/40",
                  },
                  {
                    name: "Auto",
                    desc: "Classic and affordable",
                    price: "From ₹35",
                    icon: (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="8" width="18" height="8" rx="2" />
                        <circle cx="7" cy="18" r="2" />
                        <circle cx="17" cy="18" r="2" />
                        <path d="M5 8l2-4h10l2 4" />
                      </svg>
                    ),
                    color: "text-amber-500",
                    bg: "bg-amber-50 dark:bg-amber-950/30",
                    border: "border-amber-200/60 dark:border-amber-800/40",
                  },
                  {
                    name: "Cab",
                    desc: "Comfortable rides",
                    price: "From ₹50",
                    icon: <Car className="w-6 h-6" />,
                    color: "text-blue-500",
                    bg: "bg-blue-50 dark:bg-blue-950/30",
                    border: "border-blue-200/60 dark:border-blue-800/40",
                  },
                ].map((r, i) => (
                  <motion.div
                    key={r.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`${r.bg} border ${r.border} rounded-2xl p-4 text-center`}
                  >
                    <div className={`${r.color} flex justify-center mb-2`}>{r.icon}</div>
                    <p className="text-[14px] font-bold text-foreground">{r.name}</p>
                    <p className="text-[11px] text-muted mt-0.5">{r.desc}</p>
                    <p className="text-[12px] font-bold text-foreground mt-2">{r.price}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ====== CITIES MARQUEE ====== */}
            <section className="max-w-lg mx-auto mt-14 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3 text-center">
                  Available across India
                </p>
                <div className="relative">
                  <div className="flex gap-2 animate-marquee whitespace-nowrap">
                    {[
                      "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
                      "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow",
                      "Kochi", "Chandigarh", "Indore", "Goa", "Mysore",
                      "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
                      "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow",
                    ].map((city, i) => (
                      <span
                        key={`${city}-${i}`}
                        className="px-3 py-1.5 rounded-full bg-surface border border-card-border text-[11px] font-medium text-muted flex-shrink-0"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                  {/* Fade edges */}
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </section>

            {/* ====== CTA ====== */}
            <section className="max-w-lg mx-auto mt-14 text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6 relative overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />

                <div className="relative">
                  <Logo size={40} animate={false} />
                  <h3 className="text-[20px] font-extrabold text-foreground mt-3 mb-1">
                    Ready to save on every ride?
                  </h3>
                  <p className="text-[13px] text-muted mb-4">
                    Scroll up and enter your route. It takes 5 seconds.
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="gradient-bg text-white px-6 py-2.5 rounded-xl text-[13px] font-bold shadow-lg shadow-primary/20 active:brightness-90 transition-all inline-flex items-center gap-1.5"
                  >
                    Compare now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </section>
          </>
        )}

        {/* ====== FOOTER ====== */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-14 space-y-2"
        >
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Logo size={20} animate={false} />
            <span className="text-[13px] font-bold text-foreground">
              Easy<span className="text-primary">Ride</span>
            </span>
          </div>
          <p className="text-[11px] text-muted/50 leading-relaxed max-w-xs mx-auto">
            EasyRide compares ride estimates and redirects to official apps for booking. We are not affiliated with Uber, Ola, or Rapido.
          </p>
          <p className="text-[10px] text-muted/30">
            Made with care in India
          </p>
        </motion.footer>
      </main>
    </div>
  );
}
