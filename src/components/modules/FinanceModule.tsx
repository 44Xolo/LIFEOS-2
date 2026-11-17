import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { formatHumanDate, formatMoney, todayIsoDate } from '../../lib/formatters';
import { AnimatedNumber, EASE_OUT_EXPO, RadialGauge } from '../MotionPrimitives';

export const FinanceModule: React.FC = () => {
  const {
    workspace,
    transactions,
    goals,
    addTransaction,
    deleteTransaction,
    addGoal,
    contributeGoal,
    markBillPaid,
    deleteGoal,
  } = useLifeOS();

  const currency = workspace?.currency || 'ZAR';
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');

  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txCategory, setTxCategory] = useState('Groceries');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayIsoDate());
  const [submittingTx, setSubmittingTx] = useState(false);

  const [goalKind, setGoalKind] = useState<'savings' | 'budget' | 'bill'>('savings');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState('Reserve');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDueDate, setGoalDueDate] = useState('');
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const personalTx = useMemo(
    () => transactions.filter((t) => t.scope === 'personal'),
    [transactions]
  );

  const totals = useMemo(() => {
    const income = personalTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = personalTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [personalTx]);

  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of personalTx.filter((t) => t.type === 'expense')) {
      map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
    }
    const entries = Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
    const max = Math.max(1, ...entries.map((e) => e.amount));
    return { entries, max };
  }, [personalTx]);

  const filteredTx = useMemo(() => {
    return personalTx.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (
        search.trim() &&
        !`${t.title} ${t.category}`.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [personalTx, filterType, search]);

  const savingsGoals = goals.filter((g) => g.kind === 'savings');
  const monthlyBudgets = goals.filter((g) => g.kind === 'budget');
  const bills = goals.filter((g) => g.kind === 'bill');

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(txAmount);
    if (!txTitle.trim() || !Number.isFinite(amt) || amt <= 0) return;
    setSubmittingTx(true);
    try {
      await addTransaction({
        scope: 'personal',
        type: txType,
        title: txTitle,
        category: txCategory,
        amount: amt,
        date: txDate,
      });
      setTxTitle('');
      setTxAmount('');
    } finally {
      setSubmittingTx(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(goalTarget);
    if (!goalTitle.trim() || !Number.isFinite(target) || target <= 0) return;
    setSubmittingGoal(true);
    try {
      await addGoal({
        kind: goalKind,
        title: goalTitle,
        category: goalCategory,
        targetAmount: target,
        currentAmount: 0,
        dueDate: goalDueDate || undefined,
      });
      setGoalTitle('');
      setGoalTarget('');
      setGoalDueDate('');
    } finally {
      setSubmittingGoal(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">LIFEOS Finance</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
          Personal Money &amp; Cash Control
        </h1>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-xl bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 space-y-1.5"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Personal Income</span>
          <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            <AnimatedNumber value={totals.income} currency={currency} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Recorded inflow</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-xl bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 space-y-1.5"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Personal Expenses</span>
          <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            <AnimatedNumber value={totals.expense} currency={currency} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <TrendingDown className="w-3.5 h-3.5 text-fuchsia-500" />
            <span>{categorySpending.entries.length} spending categories</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-xl bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 space-y-1.5"
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Available Surplus</span>
          <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            <AnimatedNumber value={totals.net} currency={currency} />
          </div>
          <div className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-mono">
            {totals.income > 0
              ? `${Math.max(0, Math.round((totals.net / totals.income) * 100))}% retained`
              : 'Log income to calculate savings rate'}
          </div>
        </motion.div>
      </div>

      {/* Log Transaction + Spending Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddTransaction}
          className="lg:col-span-5 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Record Entry
          </h2>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#050508]">
            {(['expense', 'income'] as const).map((t) => {
              const active = txType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTxType(t);
                    setTxCategory(t === 'income' ? 'Salary' : 'Groceries');
                  }}
                  className={`relative py-2 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                    active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="finance-tx-type"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 lifeos-gradient-bg rounded-md"
                    />
                  )}
                  <span className="relative z-10">{t}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <input
              type="text"
              required
              maxLength={120}
              value={txTitle}
              onChange={(e) => setTxTitle(e.target.value)}
              placeholder="Description (e.g. Monthly Groceries)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
              >
                {txType === 'expense' ? (
                  <>
                    <option value="Groceries">Groceries</option>
                    <option value="Housing">Housing</option>
                    <option value="Transport">Transport</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="General">General</option>
                  </>
                ) : (
                  <>
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Dividend">Dividend</option>
                    <option value="Allowance">Allowance</option>
                  </>
                )}
              </select>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="Amount"
                className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
              />
            </div>
            <input
              type="date"
              required
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={submittingTx}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg lifeos-gradient-bg text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>{submittingTx ? 'Saving...' : `Add ${txType === 'income' ? 'Income' : 'Expense'}`}</span>
          </motion.button>
        </form>

        {/* Spending Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              Spending by Category
            </h2>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              {formatMoney(totals.expense, currency)} total
            </span>
          </div>

          {categorySpending.entries.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
              Record an expense to see category allocation bars.
            </p>
          ) : (
            <div className="space-y-4">
              {categorySpending.entries.map((item, idx) => {
                const widthPct = Math.round((item.amount / categorySpending.max) * 100);
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {item.category}
                      </span>
                      <span className="font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                        {formatMoney(item.amount, currency)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 origin-left"
                        style={{ width: `${widthPct}%` }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: idx * 0.05, duration: 0.55, ease: EASE_OUT_EXPO }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Savings Goals, Monthly Budgets & Bill Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAddGoal}
          className="lg:col-span-4 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Create Plan or Bill
          </h2>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#050508]">
            {(['savings', 'budget', 'bill'] as const).map((k) => {
              const active = goalKind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGoalKind(k)}
                  className={`relative py-1.5 text-xs font-medium rounded-md capitalize cursor-pointer ${
                    active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="finance-goal-kind"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 lifeos-gradient-bg rounded-md"
                    />
                  )}
                  <span className="relative z-10">{k}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            required
            maxLength={100}
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder={
              goalKind === 'savings'
                ? 'Goal title (e.g. Laptop Upgrade)'
                : goalKind === 'budget'
                  ? 'Monthly budget title'
                  : 'Bill reminder (e.g. Electricity)'
            }
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              maxLength={50}
              value={goalCategory}
              onChange={(e) => setGoalCategory(e.target.value)}
              placeholder="Category"
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <input
              type="number"
              required
              min="1"
              step="1"
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              placeholder="Target amount"
              className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
            />
          </div>

          <input
            type="date"
            value={goalDueDate}
            onChange={(e) => setGoalDueDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
          />

          <button
            type="submit"
            disabled={submittingGoal}
            className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {submittingGoal ? 'Saving...' : 'Save Goal / Reminder'}
          </button>
        </form>

        <div className="lg:col-span-8 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-6">
          {/* Savings Goals */}
          <div className="space-y-3">
            <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
              Savings Goals &amp; Monthly Budgets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...savingsGoals, ...monthlyBudgets].map((item) => {
                const spentInCategory =
                  item.kind === 'budget'
                    ? personalTx
                        .filter((t) => t.type === 'expense' && t.category.toLowerCase() === item.category.toLowerCase())
                        .reduce((s, t) => s + t.amount, 0)
                    : item.currentAmount;
                const pct = Math.min(100, (spentInCategory / Math.max(1, item.targetAmount)) * 100);
                const over = item.kind === 'budget' && spentInCategory > item.targetAmount;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-[#050508] border border-zinc-100 dark:border-zinc-800/80 flex items-center gap-4 justify-between"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <RadialGauge
                        percentage={pct}
                        size={64}
                        strokeWidth={6}
                        danger={over}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                          {formatMoney(spentInCategory, currency)} / {formatMoney(item.targetAmount, currency)}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 capitalize">
                          {item.kind} · {over ? 'Over budget' : item.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {item.kind === 'savings' && item.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => contributeGoal(item, 500)}
                          className="px-2.5 py-1 rounded-md lifeos-gradient-bg text-white text-[11px] font-medium cursor-pointer"
                        >
                          +500
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteGoal(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill Reminders */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
              Bill Reminders
            </h3>
            {bills.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No upcoming bills scheduled.</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {bills.map((bill) => (
                  <div key={bill.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-white">{bill.title}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {formatMoney(bill.targetAmount, currency)}
                        {bill.dueDate ? ` · Due ${formatHumanDate(bill.dueDate)}` : ''}
                        {` · ${bill.status === 'paid' ? 'Paid' : 'Pending'}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bill.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => markBillPaid(bill)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteGoal(bill.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Personal Transaction Ledger
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-xs outline-none focus:border-fuchsia-500"
            />
            <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#050508]">
              {(['all', 'income', 'expense'] as const).map((f) => {
                const active = filterType === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterType(f)}
                    className={`relative px-2.5 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                      active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="finance-ledger-filter"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 lifeos-gradient-bg rounded-md"
                      />
                    )}
                    <span className="relative z-10">{f}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/70 dark:bg-[#07070C]">
              <tr>
                <th className="py-3 px-5 font-medium">Date</th>
                <th className="py-3 px-5 font-medium">Description</th>
                <th className="py-3 px-5 font-medium">Category</th>
                <th className="py-3 px-5 font-medium text-right">Amount</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredTx.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {tx.date}
                  </td>
                  <td className="py-3 px-5 font-medium text-zinc-900 dark:text-white">{tx.title}</td>
                  <td className="py-3 px-5 text-xs text-zinc-600 dark:text-zinc-300">{tx.category}</td>
                  <td
                    className={`py-3 px-5 text-right font-mono tabular-nums font-medium whitespace-nowrap ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-900 dark:text-white'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatMoney(tx.amount, currency)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                      aria-label={`Delete ${tx.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTx.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    No matching transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
