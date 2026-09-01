'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export default function RopeTechnicianScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();

  // Smooth physics spring for rappelling motion
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 22,
    restDelta: 0.001,
  });

  // Calculate Y position percentage from top anchor to bottom of viewport
  const yPercent = useTransform(smoothProgress, [0, 1], ['4%', '92%']);
  const ropeSway = useTransform(smoothProgress, [0, 0.25, 0.5, 0.75, 1], [0, -4, 4, -3, 0]);
  const harnessTilt = useTransform(smoothProgress, [0, 0.5, 1], [-2, 3, -1]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-y-0 end-3 sm:end-8 md:end-12 lg:end-16 w-12 z-30 pointer-events-none select-none flex justify-center"
    >
      {/* Structural Rigging Anchor at top */}
      <div className="absolute top-0 w-6 h-6 rounded-b-md bg-slate-850 border border-slate-700/80 flex items-center justify-center shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 ring-2 ring-amber-500/30" />
      </div>

      {/* Main Static Lifeline Rope (Vertical braided rope line) */}
      <div className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-amber-500 via-amber-400/60 to-slate-700 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />

      {/* Rappelling Rope Access Technician Character */}
      <motion.div
        style={{
          top: yPercent,
          x: ropeSway,
          rotate: harnessTilt,
        }}
        className="absolute w-12 h-16 flex flex-col items-center justify-center -translate-x-1/2 will-change-transform"
      >
        {/* Rappel Descender & Carabiner Glow */}
        <div className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-500/30 shadow-amber-glow animate-pulse-slow" />

        {/* SVG Rope Access Technician Illustration */}
        <svg
          viewBox="0 0 64 80"
          className="w-11 h-14 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Anchor Rigging Carabiner */}
          <circle cx="32" cy="6" r="3" stroke="#F59E0B" strokeWidth="2" />
          <path d="M32 9V16" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />

          {/* Safety Helmet (Industrial Yellow) */}
          <path
            d="M23 20C23 15.58 27.03 12 32 12C36.97 12 41 15.58 41 20H23Z"
            fill="#F59E0B"
          />
          {/* Headlamp */}
          <circle cx="32" cy="18" r="2" fill="#06B6D4" className="animate-pulse" />
          {/* Face / Chin Strap */}
          <path d="M25 20C25 23.5 28.1 26 32 26C35.9 26 39 23.5 39 20" stroke="#CBD5E1" strokeWidth="1.5" />

          {/* High-Vis Vest & Industrial Harness */}
          <path
            d="M22 28L18 42C18 45 22 47 32 47C42 47 46 45 46 42L42 28H22Z"
            fill="#1E293B"
            stroke="#F59E0B"
            strokeWidth="1.5"
          />
          {/* Reflective Stripes */}
          <path d="M26 30L24 40" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 30L40 40" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />

          {/* Harness Center D-Ring */}
          <circle cx="32" cy="38" r="2.5" fill="#F59E0B" stroke="#07090E" strokeWidth="1" />

          {/* Arms holding the rope */}
          <path d="M20 32L30 35" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <path d="M44 32L34 37" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

          {/* Legs in Work Positioning / Rappel Stance */}
          <path
            d="M24 47L20 62L16 64"
            stroke="#334155"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M40 47L44 62L48 64"
            stroke="#334155"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Steel Toe Safety Boots */}
          <rect x="13" y="62" width="7" height="4" rx="2" fill="#F59E0B" />
          <rect x="44" y="62" width="7" height="4" rx="2" fill="#F59E0B" />
        </svg>

        {/* Depth Altitude Indicator Badge */}
        <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-400 shadow-md">
          IRATA
        </div>
      </motion.div>
    </div>
  );
}
