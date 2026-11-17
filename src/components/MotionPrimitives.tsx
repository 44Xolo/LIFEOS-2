import React, { useEffect, useId, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import type { CurrencyCode } from '../types/lifeos';
import { formatCompactMoney, formatMoney } from '../lib/formatters';

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const LIFEOS_LOGO_SRC = '/assets/aistudio/Screenshot_2026-11-15_192656_d7a74dff.png';

export const LifeOSLogoMark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  subtitle?: string;
}> = ({ size = 'sm', showWordmark = true, subtitle }) => {
  const dimClass =
    size === 'xs'
      ? 'w-7 h-7 rounded-lg'
      : size === 'sm'
        ? 'w-9 h-9 rounded-xl'
        : size === 'md'
          ? 'w-12 h-12 rounded-xl'
          : 'w-16 h-16 rounded-2xl';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <motion.div
        whileHover={{ scale: 1.05, rotate: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className={`relative ${dimClass} bg-black overflow-hidden border border-fuchsia-500/40 shadow-[0_6px_22px_-6px_rgba(244,114,182,0.5)] shrink-0`}
      >
        <img
          src={LIFEOS_LOGO_SRC}
          alt="LIFEOS emblem"
          className="w-full h-full object-contain scale-110"
        />
      </motion.div>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight italic text-zinc-900 dark:text-white">
            LIFE<span className="lifeos-gradient-text">OS</span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const AnimatedNumber: React.FC<{
  value: number;
  currency?: CurrencyCode;
  suffix?: string;
  compact?: boolean;
  className?: string;
}> = ({ value, currency, suffix = '', compact = false, className = '' }) => {
  const motionVal = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.65,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [value, motionVal]);

  const formatted = currency
    ? compact
      ? formatCompactMoney(display, currency)
      : formatMoney(display, currency)
    : `${Math.round(display)}${suffix}`;

  return <span className={`tabular-nums ${className}`}>{formatted}</span>;
};

export interface CashFlowPoint {
  label: string;
  income: number;
  expense: number;
}

export const CashFlowSplineChart: React.FC<{
  data: CashFlowPoint[];
  currency: CurrencyCode;
}> = ({ data, currency }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');
  const width = 640;
  const height = 220;
  const padX = 28;
  const padY = 24;

  const maxVal = useMemo(() => {
    const peak = Math.max(1000, ...data.flatMap((d) => [d.income, d.expense]));
    return peak * 1.15;
  }, [data]);

  const points = useMemo(() => {
    const stepX = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;
    const toY = (val: number) => height - padY - (val / maxVal) * (height - padY * 2);

    return data.map((d, i) => ({
      x: padX + i * stepX,
      yIncome: toY(d.income),
      yExpense: toY(d.expense),
      ...d,
    }));
  }, [data, maxVal]);

  const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cpX = (curr.x + next.x) / 2;
      d += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const incomePath = buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yIncome })));
  const expensePath = buildSmoothPath(points.map((p) => ({ x: p.x, y: p.yExpense })));
  const incomeArea =
    points.length > 0
      ? `${incomePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`
      : '';

  const activePoint = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];

  return (
    <div className="relative w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 inline-block" />
            <span>Inflow</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-0.5 bg-zinc-400 dark:bg-zinc-600 inline-block" />
            <span>Outflow</span>
          </span>
        </div>
        {activePoint && (
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span className="text-zinc-500 dark:text-zinc-400">{activePoint.label}</span>
            <span className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold">
              +{formatMoney(activePoint.income, currency)}
            </span>
            <span className="text-zinc-700 dark:text-zinc-300">
              -{formatMoney(activePoint.expense, currency)}
            </span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52 overflow-visible select-none"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`lifeosStroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="35%" stopColor="#EC4899" />
            <stop offset="70%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id={`lifeosFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.25" />
            <stop offset="65%" stopColor="#A855F7" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padY - ratio * (height - padY * 2);
          return (
            <line
              key={ratio}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-zinc-200/80 dark:text-zinc-800/90"
              strokeDasharray="3 4"
            />
          );
        })}

        {incomeArea && (
          <motion.path
            d={incomeArea}
            fill={`url(#lifeosFill-${uid})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
          />
        )}

        <motion.path
          d={expensePath}
          fill="none"
          stroke="currentColor"
          className="text-zinc-400 dark:text-zinc-600"
          strokeWidth={1.85}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        />

        <motion.path
          d={incomePath}
          fill="none"
          stroke={`url(#lifeosStroke-${uid})`}
          strokeWidth={2.75}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.05, ease: EASE_OUT_EXPO }}
        />

        {activePoint && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padY}
            y2={height - padY}
            stroke={`url(#lifeosStroke-${uid})`}
            strokeOpacity={0.35}
            strokeWidth={1.25}
          />
        )}

        {points.map((pt, idx) => {
          const isHovered = hoverIdx === idx;
          return (
            <g key={pt.label} onMouseEnter={() => setHoverIdx(idx)} className="cursor-pointer">
              <rect x={pt.x - 28} y={0} width={56} height={height} fill="transparent" />
              {isHovered && (
                <motion.circle
                  cx={pt.x}
                  cy={pt.yIncome}
                  r={10}
                  className="fill-fuchsia-500/20"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
              <motion.circle
                cx={pt.x}
                cy={pt.yIncome}
                r={isHovered ? 5.2 : 3.4}
                fill={idx % 2 === 0 ? '#EC4899' : '#6366F1'}
                className="stroke-white dark:stroke-[#0C0C14]"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.14 + idx * 0.05, duration: 0.25 }}
              />
              <text
                x={pt.x}
                y={height - 4}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-500 text-[11px] font-mono"
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const RadialGauge: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  danger?: boolean;
}> = ({ percentage, size = 84, strokeWidth = 7, label, danger = false }) => {
  const uid = useId().replace(/:/g, '');
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const progress = useMotionValue(circumference);
  const animatedOffset = useTransform(progress, (v) => v);

  useEffect(() => {
    const ctrl = animate(progress, dashOffset, {
      duration: 0.85,
      ease: EASE_OUT_EXPO,
    });
    return () => ctrl.stop();
  }, [dashOffset, progress]);

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`gaugeGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={danger ? '#EF4444' : '#F472B6'} />
            <stop offset="55%" stopColor={danger ? '#F97316' : '#A855F7'} />
            <stop offset="100%" stopColor={danger ? '#DC2626' : '#6366F1'} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-200 dark:text-zinc-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gaugeGrad-${uid})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: animatedOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {Math.round(clamped)}%
        </span>
        {label && <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{label}</span>}
      </div>
    </div>
  );
};

export const ProfitBarChart: React.FC<{
  bars: Array<{ label: string; revenue: number; expense: number }>;
  currency: CurrencyCode;
}> = ({ bars, currency }) => {
  const maxVal = Math.max(1000, ...bars.flatMap((b) => [b.revenue, b.expense]));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-4 items-end h-44 pt-4">
        {bars.map((bar, idx) => {
          const revH = Math.max(6, Math.round((bar.revenue / maxVal) * 140));
          const expH = Math.max(6, Math.round((bar.expense / maxVal) * 140));
          return (
            <div key={bar.label} className="flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex items-end gap-1.5 h-36">
                <motion.div
                  title={`Revenue: ${formatMoney(bar.revenue, currency)}`}
                  className="w-5 rounded-t bg-gradient-to-t from-indigo-600 via-purple-500 to-fuchsia-500 origin-bottom"
                  style={{ height: revH }}
                  initial={{ scaleY: 0, opacity: 0.4 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  whileHover={{ scaleY: 1.05 }}
                  transition={{ delay: idx * 0.06, duration: 0.55, ease: EASE_OUT_EXPO }}
                />
                <motion.div
                  title={`Expenses: ${formatMoney(bar.expense, currency)}`}
                  className="w-5 rounded-t bg-zinc-300 dark:bg-zinc-700 origin-bottom"
                  style={{ height: expH }}
                  initial={{ scaleY: 0, opacity: 0.4 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.06 + 0.05, duration: 0.55, ease: EASE_OUT_EXPO }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{bar.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-5 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-indigo-600 to-fuchsia-500 inline-block" />
          <span>Business Revenue</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-700 inline-block" />
          <span>Operating Costs</span>
        </span>
      </div>
    </div>
  );
};
