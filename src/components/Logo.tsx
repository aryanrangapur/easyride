"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  animate?: boolean;
}

/**
 * Custom EasyRide logo — an abstract route/path icon
 * Two location pins connected by a curved path, forming an "E" shape
 */
export default function Logo({ size = 32, animate = true }: LogoProps) {
  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { whileTap: { scale: 0.9, rotate: -8 } }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rounded square background */}
        <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />

        {/* Route path (curved line connecting two points) */}
        <path
          d="M13 28C13 22 16 18 20 18C24 18 27 14 27 10"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="0"
          opacity="0.5"
        />

        {/* Pickup dot (top) */}
        <circle cx="27" cy="11" r="4.5" fill="white" />
        <circle cx="27" cy="11" r="2" fill="#22c55e" />

        {/* Drop dot (bottom) */}
        <circle cx="13" cy="28" r="4.5" fill="white" />
        <circle cx="13" cy="28" r="2" fill="#FF6B35" />

        {/* Middle comparison bars (abstract price lines) */}
        <rect x="19" y="22" width="10" height="2" rx="1" fill="white" opacity="0.7" />
        <rect x="19" y="26" width="7" height="2" rx="1" fill="white" opacity="0.45" />
        <rect x="19" y="30" width="9" height="2" rx="1" fill="white" opacity="0.3" />

        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6B35" />
            <stop offset="0.5" stopColor="#ff8c5e" />
            <stop offset="1" stopColor="#ffab76" />
          </linearGradient>
        </defs>
      </svg>
    </Wrapper>
  );
}

/** Wordmark only — no icon */
export function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      Easy<span className="text-primary">Ride</span>
    </span>
  );
}
