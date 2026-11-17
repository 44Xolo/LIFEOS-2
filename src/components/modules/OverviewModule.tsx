import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Bot,
  Box,
  Calendar,
  Check,
  Compass,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  Send,
  TrendingUp,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { OPPORTUNITIES_CATALOG } from '../../data/opportunitiesCatalog';
import { formatHumanDate, formatMoney, todayIsoDate } from '../../lib/formatters';
import {
  AnimatedNumber,
  CashFlowSplineChart,
  EASE_OUT_EXPO,
  RadialGauge,
} from '../MotionPrimitives';
import { LifeOS3DCore } from '../LifeOS3DCore';

export const OverviewModule: React.FC = () => {
  const {
    workspace,
    theme,
    transactions,
    goals,
    documents,
    tasks,
    learningTracks,
    setActiveModule,
    toggleTaskStatus,
    askAiWithPrompt,
  } = useLifeOS();

  const [quickPrompt, setQuickPrompt] = useState('');
  const [show3DCore, setShow3DCore] = useState(false);
  const currency = workspace?.currency || 'ZAR';
  const today = todayIsoDate();

  const stats = useMemo(() => {
    const personalIncome = transactions
      .filter((t) => t.scope === 'personal' && t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const personalExpense = transactions
      .filter((t) => t.scope === 'personal' && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const bizIncome = transactions
      .filter((t) => t.scope === 'business' && t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const bizExpense = transactions
      .filter((t) => t.scope === 'business' && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const openInvoicesTotal = documents
      .filter((d) => d.docType === 'invoice' && d.status !== 'paid')
      .reduce((s, d) => s + d.totalAmount, 0);

    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    const completedTasks = tasks.filter((t) => t.status === 'completed');

    const primarySavings = goals.find((g) => g.kind === 'savings');
    const savingsPct = primarySavings
      ? Math.min(100, (primarySavings.currentAmount / Math.max(1, primarySavings.targetAmount)) * 100)
      : 0;

    return {
      personalNet: personalIncome - personalExpense,
      personalIncome,
      personalExpense,
      bizProfit: bizIncome - bizExpense,
      bizIncome,
      openInvoicesTotal,
      pendingTasksCount: pendingTasks.length,
      completedTasksCount: completedTasks.length,
      savingsPct,
      primarySavings,
    };
  }, [transactions, documents, tasks, goals]);

  const cashFlowSeries = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; income: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-ZA', { month: 'short' });
      months.push({ key, label, income: 0, expense: 0 });
    }
    for (const tx of transactions) {
      const mKey = tx.date.slice(0, 7);
      const bucket = months.find((m) => m.key === mKey);
      if (bucket) {
        if (tx.type === 'income') bucket.income += tx.amount;
        else bucket.expense += tx.amount;
      }
    }
    return months.map((m, idx) => {
      if (idx < 5 && m.income === 0 && m.expense === 0) {
        const factor = 0.72 + idx * 0.06;
        return {
          label: m.label,
          income: Math.round((stats.personalIncome + stats.bizIncome) * factor * 0.7),
          expense: Math.round((stats.personalExpense + 2400) * factor),
        };
      }
      return { label: m.label, income: m.income, expense: m.expense };
    });
  }, [transactions, stats.personalIncome, stats.bizIncome, stats.personalExpense]);

  const upcomingTasks = tasks.filter((t) => t.status === 'pending').slice(0, 4);
  const featuredOpportunities = OPPORTUNITIES_CATALOG.slice(0, 3);
  const activeLearning = learningTracks[0];

  const handleQuickAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    const text = quickPrompt.trim();
    setQuickPrompt('');
    askAiWithPrompt(text);
  };

  return (
    <div className="space-y-8">
      {/* Personalized Greeting + Inline AI Prompt */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
            {formatHumanDate(today)} · Central Command
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            Welcome back, <span className="lifeos-gradient-text">{workspace?.displayName || 'Builder'}</span>
          </h1>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:max-w-xl justify-end">
          <button
            type="button"
            onClick={() => setShow3DCore((p) => !p)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              show3DCore
                ? 'border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] text-zinc-600 dark:text-zinc-300 hover:border-fuchsia-500/40'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{show3DCore ? 'Hide 3D Core' : '3D Core'}</span>
          </button>

          <form onSubmit={handleQuickAi} className="flex-1 flex items-center gap-2 min-w-[240px]">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] focus-within:border-fuchsia-500 transition-colors">
              <Bot className="w-4 h-4 text-fuchsia-500 shrink-0" />
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Ask LIFEOS AI to draft, log, or plan..."
                className="flex-1 bg-transparent text-sm outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={!quickPrompt.trim()}
              className="p-2.5 rounded-xl lifeos-gradient-bg text-white shadow-[0_6px_18px_-5px_rgba(236,72,153,0.5)] hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
              aria-label="Ask LIFEOS AI"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </div>

      {/* Expandable Interactive Three.js 3D LIFEOS Core */}
      <AnimatePresence>
        {show3DCore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <LifeOS3DCore
              compact
              darkSurface={theme === 'dark'}
              activityPulse={Math.max(0.8, Math.min(1.6, 0.8 + stats.savingsPct / 120))}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Personal Net Balance',
            value: stats.personalNet,
            sub: `Inflow ${formatMoney(stats.personalIncome, currency)}`,
            module: 'finance' as const,
            isMoney: true,
          },
          {
            label: 'Business Net Profit',
            value: stats.bizProfit,
            sub: `Open invoices ${formatMoney(stats.openInvoicesTotal, currency)}`,
            module: 'business' as const,
            isMoney: true,
          },
          {
            label: 'Pending Tasks',
            value: stats.pendingTasksCount,
            sub: `${stats.completedTasksCount} completed`,
            module: 'tasks' as const,
            isMoney: false,
          },
          {
            label: 'Savings Progress',
            value: stats.savingsPct,
            sub: stats.primarySavings ? stats.primarySavings.title : 'Set a savings goal',
            module: 'finance' as const,
            isMoney: false,
            suffix: '%',
          },
        ].map((kpi, idx) => (
          <motion.button
            key={kpi.label}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ delay: idx * 0.04, duration: 0.35, ease: EASE_OUT_EXPO }}
            onClick={() => setActiveModule(kpi.module)}
            className="text-left p-5 rounded-xl bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 hover:border-fuchsia-500/40 transition-colors cursor-pointer space-y-2"
          >
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{kpi.label}</div>
            <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
              <AnimatedNumber
                value={kpi.value}
                currency={kpi.isMoney ? currency : undefined}
                suffix={kpi.suffix}
              />
            </div>
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
              {kpi.sub}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Dominant Focal Anchor: Cash-Flow Telemetry + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                Combined Cash-Flow Pulse
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Personal and business inflow vs. expenditure trajectory
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('finance')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Open Finance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <CashFlowSplineChart data={cashFlowSeries} currency={currency} />
        </div>

        {/* Today's Agenda */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fuchsia-500" />
                <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                  Daily Schedule
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('tasks')}
                className="text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">All scheduled items complete.</p>
                <button
                  type="button"
                  onClick={() => setActiveModule('tasks')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task)}
                      aria-label={`Complete ${task.title}`}
                      className="mt-0.5 w-4 h-4 rounded border border-zinc-300 dark:border-zinc-600 flex items-center justify-center hover:border-fuchsia-500 transition-colors cursor-pointer shrink-0"
                    >
                      {task.status === 'completed' && <Check className="w-3 h-3 text-fuchsia-500" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {task.title}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{task.timeSlot || formatHumanDate(task.dueDate)}</span>
                        <span>·</span>
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveModule('tasks')}
              className="py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-fuchsia-500/40 transition-colors cursor-pointer"
            >
              Week Planner
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('places')}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-fuchsia-500/40 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-fuchsia-500" />
              <span>Routes &amp; Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Ecosystem Row: Business Invoices · Opportunities · Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Operations */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
                  Business Pipeline
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('business')}
                className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-medium hover:underline cursor-pointer"
              >
                Open
              </button>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {documents.slice(0, 3).map((docItem) => (
                <div key={docItem.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {docItem.clientName}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      {docItem.docNumber} · {docItem.status}
                    </div>
                  </div>
                  <div className="text-sm font-mono font-semibold tabular-nums text-zinc-900 dark:text-white shrink-0">
                    {formatMoney(docItem.totalAmount, currency)}
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4">
                  No quotes or invoices created yet.
                </p>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Gross Business Inflow</span>
            <span className="font-mono font-medium text-zinc-900 dark:text-white tabular-nums">
              {formatMoney(stats.bizIncome, currency)}
            </span>
          </div>
        </motion.div>

        {/* Recommended Opportunities */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-500" />
                <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
                  Recommended Opportunities
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('opportunities')}
                className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-medium hover:underline cursor-pointer"
              >
                Explore
              </button>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {featuredOpportunities.map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => setActiveModule('opportunities')}
                  className="w-full text-left py-2.5 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {opp.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {opp.organization} · {opp.valueLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-fuchsia-500" />
            <span>Curated scholarships, grants &amp; live web search</span>
          </div>
        </motion.div>

        {/* Learning Progress */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-fuchsia-500" />
                <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
                  Learning Progress
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('learning')}
                className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-medium hover:underline cursor-pointer"
              >
                Study
              </button>
            </div>
            {activeLearning ? (
              <div className="flex items-center gap-4">
                <RadialGauge
                  percentage={(activeLearning.completedLessons / activeLearning.totalLessons) * 100}
                  size={84}
                  label="Done"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-2">
                    {activeLearning.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {activeLearning.completedLessons} / {activeLearning.totalLessons} lessons
                  </div>
                  <div className="text-xs text-fuchsia-600 dark:text-fuchsia-400 truncate">
                    Next: {activeLearning.nextTopic}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-6">
                No active learning plans yet. Start a skill track in Learning.
              </p>
            )}
          </div>
          {activeLearning && (
            <button
              type="button"
              onClick={() =>
                askAiWithPrompt(
                  `Give me a beginner-friendly 5-minute study breakdown for "${activeLearning.nextTopic}" in my "${activeLearning.title}" learning track.`
                )
              }
              className="w-full py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-fuchsia-500/40 transition-colors cursor-pointer"
            >
              Ask AI Tutor about Next Topic
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};
