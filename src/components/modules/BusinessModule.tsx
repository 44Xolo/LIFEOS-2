import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Eye,
  Plus,
  Printer,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { addDaysIsoDate, formatHumanDate, formatMoney, todayIsoDate } from '../../lib/formatters';
import type { BusinessDocument } from '../../types/lifeos';
import { AnimatedNumber, EASE_OUT_EXPO, LifeOSLogoMark, ProfitBarChart } from '../MotionPrimitives';

export const BusinessModule: React.FC = () => {
  const {
    workspace,
    privateProfile,
    transactions,
    clients,
    documents,
    addClient,
    deleteClient,
    addBusinessDocument,
    convertQuoteToInvoice,
    markDocumentPaid,
    deleteBusinessDocument,
    addTransaction,
  } = useLifeOS();

  const currency = workspace?.currency || 'ZAR';
  const [subView, setSubView] = useState<'documents' | 'clients' | 'expenses'>('documents');
  const [previewDoc, setPreviewDoc] = useState<BusinessDocument | null>(null);

  const [docType, setDocType] = useState<'quote' | 'invoice'>('invoice');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [itemSummary, setItemSummary] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [includeVat, setIncludeVat] = useState(true);
  const [dueDate, setDueDate] = useState(addDaysIsoDate(14));

  const [cName, setCName] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');

  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Operations');
  const [expAmount, setExpAmount] = useState('');

  const bizTx = useMemo(() => transactions.filter((t) => t.scope === 'business'), [transactions]);

  const financials = useMemo(() => {
    const revenue = bizTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = bizTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const outstanding = documents
      .filter((d) => d.docType === 'invoice' && d.status !== 'paid')
      .reduce((s, d) => s + d.totalAmount, 0);
    return { revenue, expenses, profit, margin, outstanding };
  }, [bizTx, documents]);

  const quarterlyBars = useMemo(() => {
    const rev = Math.max(1000, financials.revenue);
    const exp = Math.max(400, financials.expenses);
    return [
      { label: 'W1', revenue: Math.round(rev * 0.22), expense: Math.round(exp * 0.25) },
      { label: 'W2', revenue: Math.round(rev * 0.31), expense: Math.round(exp * 0.22) },
      { label: 'W3', revenue: Math.round(rev * 0.24), expense: Math.round(exp * 0.31) },
      { label: 'W4', revenue: Math.round(rev * 0.23), expense: Math.round(exp * 0.22) },
    ];
  }, [financials.revenue, financials.expenses]);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(subtotal);
    if (!clientName.trim() || !itemSummary.trim() || !Number.isFinite(num) || num <= 0) return;
    await addBusinessDocument({
      docType,
      clientName,
      clientEmail,
      itemSummary,
      subtotal: num,
      includeVat,
      dueDate,
    });
    setClientName('');
    setClientEmail('');
    setItemSummary('');
    setSubtotal('');
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;
    await addClient({
      name: cName,
      company: cCompany,
      email: cEmail,
      phone: cPhone,
    });
    setCName('');
    setCCompany('');
    setCEmail('');
    setCPhone('');
  };

  const handleCreateBizExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(expAmount);
    if (!expTitle.trim() || !Number.isFinite(num) || num <= 0) return;
    await addTransaction({
      scope: 'business',
      type: 'expense',
      title: expTitle,
      category: expCategory,
      amount: num,
      date: todayIsoDate(),
    });
    setExpTitle('');
    setExpAmount('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
            LIFEOS Business · {privateProfile?.businessName || 'Small Business Suite'}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
            Operations, Invoices &amp; Profit
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800">
          {(
            [
              { id: 'documents', label: 'Quotes & Invoices' },
              { id: 'clients', label: 'Clients' },
              { id: 'expenses', label: 'Business Costs' },
            ] as const
          ).map((tab) => {
            const active = subView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubView(tab.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="business-subview"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 lifeos-gradient-bg rounded-lg"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI + Profit Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Business Revenue', val: financials.revenue, sub: 'Collected client payments', money: true, accent: false },
            { label: 'Net Profit', val: financials.profit, sub: `${Math.round(financials.margin)}% operating margin`, money: true, accent: true },
            { label: 'Open Receivables', val: financials.outstanding, sub: 'Unpaid issued invoices', money: true, accent: false },
            { label: 'Active Customers', val: clients.length, sub: 'Saved CRM accounts', money: false, accent: false },
          ].map((k) => (
            <motion.div
              key={k.label}
              whileHover={{ y: -2 }}
              className="p-5 rounded-xl bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 space-y-1.5"
            >
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{k.label}</span>
              <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
                <AnimatedNumber value={k.val} currency={k.money ? currency : undefined} />
              </div>
              <div className={`text-xs font-mono ${k.accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {k.sub}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-white">
            Weekly Revenue vs. Costs
          </h2>
          <ProfitBarChart bars={quarterlyBars} currency={currency} />
        </div>
      </div>

      {/* Subview Panels */}
      {subView === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateDoc}
            className="lg:col-span-4 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              Draft Quote or Invoice
            </h2>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#050508]">
              {(['quote', 'invoice'] as const).map((t) => {
                const active = docType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    className={`relative py-1.5 text-xs font-semibold rounded-md capitalize cursor-pointer ${
                      active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="biz-doctype"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 lifeos-gradient-bg rounded-md"
                      />
                    )}
                    <span className="relative z-10">{t}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              required
              maxLength={100}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client or Company Name"
              list="lifeos-clients-list"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <datalist id="lifeos-clients-list">
              {clients.map((c) => (
                <option key={c.id} value={c.company || c.name} />
              ))}
            </datalist>

            <input
              type="email"
              maxLength={160}
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Client Email (optional)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />

            <textarea
              rows={2}
              required
              maxLength={300}
              value={itemSummary}
              onChange={(e) => setItemSummary(e.target.value)}
              placeholder="Deliverables / line items summary"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                placeholder="Subtotal"
                className="px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
              />
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
              />
            </div>

            <label className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer">
              <span>Include 15% VAT</span>
              <input
                type="checkbox"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
                className="rounded accent-fuchsia-600 w-4 h-4"
              />
            </label>

            {Number(subtotal) > 0 && (
              <div className="flex items-center justify-between text-xs font-mono pt-1 text-zinc-600 dark:text-zinc-400">
                <span>Total Amount</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {formatMoney(includeVat ? Number(subtotal) * 1.15 : Number(subtotal), currency)}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg lifeos-gradient-bg text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate {docType === 'invoice' ? 'Invoice' : 'Quotation'}</span>
            </button>
          </form>

          <div className="lg:col-span-8 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                Issued Quotations &amp; Invoices
              </h2>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {documents.length} records
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {documents.map((d) => (
                <div key={d.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-900 dark:text-white">{d.docNumber}</span>
                      <span>·</span>
                      <span className="uppercase">{d.docType}</span>
                      <span>·</span>
                      <span
                        className={
                          d.status === 'paid'
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                            : 'text-fuchsia-600 dark:text-fuchsia-400 font-medium'
                        }
                      >
                        {d.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {d.clientName}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {d.itemSummary}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="text-base font-mono font-semibold tabular-nums text-zinc-900 dark:text-white mr-2">
                      {formatMoney(d.totalAmount, currency)}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewDoc(d)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium hover:border-fuchsia-500/40 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {d.docType === 'quote' && d.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => convertQuoteToInvoice(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-fuchsia-300 dark:border-fuchsia-800 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-medium hover:bg-fuchsia-500/10 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>To Invoice</span>
                      </button>
                    )}

                    {d.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => markDocumentPaid(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteBusinessDocument(d.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                      aria-label={`Delete ${d.docNumber}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No quotes or invoices yet. Create your first client document on the left.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subView === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateClient}
            className="lg:col-span-4 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              Add Customer
            </h2>
            <input
              type="text"
              required
              maxLength={100}
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="Contact Name"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <input
              type="text"
              maxLength={100}
              value={cCompany}
              onChange={(e) => setCCompany(e.target.value)}
              placeholder="Company Name (optional)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <input
              type="email"
              maxLength={160}
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <input
              type="text"
              maxLength={32}
              value={cPhone}
              onChange={(e) => setCPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg lifeos-gradient-bg text-white text-sm font-semibold cursor-pointer"
            >
              Save Customer
            </button>
          </form>

          <div className="lg:col-span-8 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800/80">
            <div className="p-5 flex items-center gap-2">
              <Users className="w-4 h-4 text-fuchsia-500" />
              <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                Customer Directory
              </h2>
            </div>
            {clients.map((c) => (
              <div key={c.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {c.name} {c.company ? `· ${c.company}` : ''}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact info added'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteClient(c.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {clients.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No customers saved yet.
              </div>
            )}
          </div>
        </div>
      )}

      {subView === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateBizExpense}
            className="lg:col-span-4 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              Log Business Cost
            </h2>
            <input
              type="text"
              required
              maxLength={120}
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="Expense description"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            />
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
            >
              <option value="Operations">Operations</option>
              <option value="Software">Software</option>
              <option value="Marketing">Marketing</option>
              <option value="Contractors">Contractors</option>
              <option value="Equipment">Equipment</option>
            </select>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm font-mono outline-none focus:border-fuchsia-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg lifeos-gradient-bg text-white text-sm font-semibold cursor-pointer"
            >
              Record Business Expense
            </button>
          </form>

          <div className="lg:col-span-8 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800/80">
            <div className="p-5 font-display text-lg font-semibold text-zinc-900 dark:text-white">
              Business Ledger
            </div>
            {bizTx.map((tx) => (
              <div key={tx.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">{tx.title}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {tx.date} · {tx.category}
                  </div>
                </div>
                <div
                  className={`text-sm font-mono font-semibold tabular-nums ${
                    tx.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-900 dark:text-white'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatMoney(tx.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Document Preview Modal featuring Official LIFEOS Letterhead */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full rounded-2xl bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <LifeOSLogoMark size="md" showWordmark={false} />
                  <div>
                    <div className="text-xs font-mono uppercase text-fuchsia-600 dark:text-fuchsia-400">
                      {previewDoc.docType} · {previewDoc.docNumber}
                    </div>
                    <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                      {privateProfile?.businessName || workspace?.displayName || 'LIFEOS Business'}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {privateProfile?.email || ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-t border-b border-zinc-200 dark:border-zinc-800 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Bill To</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{previewDoc.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Due Date</span>
                  <span className="font-mono">{formatHumanDate(previewDoc.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Status</span>
                  <span className="capitalize font-medium">{previewDoc.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Deliverables</div>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">{previewDoc.itemSummary}</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-sm font-mono tabular-nums">
                <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatMoney(previewDoc.subtotal, currency)}</span>
                </div>
                {previewDoc.includeVat && (
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>VAT (15%)</span>
                    <span>{formatMoney(previewDoc.totalAmount - previewDoc.subtotal, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-white pt-1">
                  <span>Total</span>
                  <span>{formatMoney(previewDoc.totalAmount, currency)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg lifeos-gradient-bg text-white text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
