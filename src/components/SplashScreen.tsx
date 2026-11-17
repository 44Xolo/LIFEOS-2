import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EASE_OUT_EXPO, LIFEOS_LOGO_SRC } from './MotionPrimitives';

interface SplashScreenProps {
  ready: boolean;
  onComplete: () => void;
}

const BOOT_PILLARS = [
  'PERSONAL FINANCE',
  'SMALL BUSINESS',
  'SCHEDULE & ROUTES',
  'AI INTELLIGENCE',
] as const;

export const SplashScreen: React.FC<SplashScreenProps> = ({ ready, onComplete }) => {
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [pillarIdx, setPillarIdx] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const minDelay = prefersReduced ? 450 : 2100;
    const skipDelay = 550;

    const minTimer = window.setTimeout(() => setMinDurationElapsed(true), minDelay);
    const skipTimer = window.setTimeout(() => setCanSkip(true), skipDelay);

    const ticker = window.setInterval(() => {
      setPillarIdx((prev) => (prev + 1) % BOOT_PILLARS.length);
    }, 460);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(skipTimer);
      window.clearInterval(ticker);
    };
  }, []);

  useEffect(() => {
    if (ready && minDurationElapsed) {
      onComplete();
    }
  }, [ready, minDurationElapsed, onComplete]);

  return (
    <motion.div
      key="lifeos-splash"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 1.03,
        transition: { duration: 0.48, ease: EASE_OUT_EXPO },
      }}
      className="fixed inset-0 z-50 bg-[#050508] text-white flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Ambient Radial Aura & Architectural Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50rem 32rem at 50% 45%, rgba(236, 72, 153, 0.16), transparent 62%), radial-gradient(42rem 28rem at 50% 58%, rgba(99, 102, 241, 0.14), transparent 66%)',
        }}
      />

      {/* Top Precision Accent Bar + Skip */}
      <div className="relative z-10 w-full">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
          className="h-[2px] w-full origin-left lifeos-gradient-bg"
        />
        <div className="max-w-7xl mx-auto px-6 pt-5 flex items-center justify-between">
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 0.75, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45, ease: EASE_OUT_EXPO }}
            className="text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase"
          >
            OS // v2.6
          </motion.span>

          <AnimatePresence>
            {canSkip && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={onComplete}
                className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/80 text-[11px] font-mono text-zinc-400 hover:text-white hover:border-fuchsia-500/40 transition-colors cursor-pointer"
              >
                Skip
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Center Uber-Inspired Kinetic Stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        {/* Horizontal Horizon Datum Lines (Uber-style geometric split) */}
        <motion.div
          aria-hidden="true"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.35 }}
          transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/60 to-transparent"
        />
        <motion.div
          aria-hidden="true"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 0.25 }}
          transition={{ duration: 0.85, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="absolute top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent"
        />

        {/* Expanding Kinetic Pulse Rings */}
        <motion.div
          aria-hidden="true"
          initial={{ scale: 0.4, opacity: 0.65 }}
          animate={{ scale: 2.35, opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.35, ease: EASE_OUT_EXPO }}
          className="absolute w-44 h-44 rounded-full border border-fuchsia-500/40"
        />
        <motion.div
          aria-hidden="true"
          initial={{ scale: 0.4, opacity: 0.55 }}
          animate={{ scale: 1.85, opacity: 0 }}
          transition={{ duration: 1.35, delay: 0.55, ease: EASE_OUT_EXPO }}
          className="absolute w-44 h-44 rounded-full border border-indigo-500/40"
        />

        <div className="relative flex flex-col items-center text-center">
          {/* Emblem Squircle */}
          <motion.div
            initial={{ scale: 0.45, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.08,
            }}
            className="relative mb-7"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute -inset-2.5 rounded-[26px] border border-dashed border-fuchsia-500/35"
            />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-black border border-fuchsia-500/45 overflow-hidden shadow-[0_18px_55px_-10px_rgba(236,72,153,0.62)] flex items-center justify-center">
              <img
                src={LIFEOS_LOGO_SRC}
                alt="LIFEOS emblem"
                className="w-full h-full object-contain scale-110"
              />
            </div>
          </motion.div>

          {/* Masked Kinetic Wordmark Reveal */}
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '105%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.65, delay: 0.28, ease: EASE_OUT_EXPO }}
              className="font-display text-5xl sm:text-6xl font-bold italic tracking-tight leading-none"
            >
              LIFE<span className="lifeos-gradient-text">OS</span>
            </motion.div>
          </div>

          <div className="overflow-hidden mt-3">
            <motion.p
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.46, ease: EASE_OUT_EXPO }}
              className="text-sm sm:text-base text-zinc-300 font-medium tracking-tight"
            >
              One platform. More control over everyday life.
            </motion.p>
          </div>

          {/* Cycling Module Status Pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.45, ease: EASE_OUT_EXPO }}
            className="mt-7 h-7 flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={BOOT_PILLARS[pillarIdx]}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono tracking-[0.16em] text-pink-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
                {BOOT_PILLARS[pillarIdx]}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Bottom Uber-Style Sweep Progress Bar */}
      <div className="relative z-10 max-w-md w-full mx-auto px-8 pb-10 space-y-2.5">
        <div className="h-[3px] w-full rounded-full bg-zinc-900 overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.95, ease: EASE_OUT_EXPO }}
            className="h-full w-full lifeos-gradient-bg rounded-full"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Syncing secure environment</span>
          <span>POPIA Ready</span>
        </div>
      </div>
    </motion.div>
  );
};
