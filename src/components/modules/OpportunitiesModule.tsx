import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark,
  Bot,
  CheckCircle2,
  ExternalLink,
  Globe,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import { OPPORTUNITIES_CATALOG } from '../../data/opportunitiesCatalog';
import type { GroundingSource, OpportunityCatalogItem, OpportunityKind } from '../../types/lifeos';
import { EASE_OUT_EXPO } from '../MotionPrimitives';

const KIND_FILTERS: Array<{ id: 'all' | OpportunityKind; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'job', label: 'Jobs' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'grant', label: 'Grants' },
  { id: 'internship', label: 'Internships' },
  { id: 'business', label: 'Business' },
  { id: 'training', label: 'Training' },
];

export const OpportunitiesModule: React.FC = () => {
  const {
    savedOpportunities,
    saveOpportunity,
    updateOpportunityStatus,
    removeSavedOpportunity,
    askAiWithPrompt,
  } = useLifeOS();

  const [kindFilter, setKindFilter] = useState<'all' | OpportunityKind>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OpportunityCatalogItem>(OPPORTUNITIES_CATALOG[0]);

  // Live Google Search Grounding state
  const [liveQuery, setLiveQuery] = useState('');
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveResult, setLiveResult] = useState<{ summary: string; sources: GroundingSource[] } | null>(null);

  const filtered = useMemo(() => {
    return OPPORTUNITIES_CATALOG.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (
        search.trim() &&
        !`${item.title} ${item.organization} ${item.summary}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [kindFilter, search]);

  const savedMap = useMemo(() => {
    const map = new Map<string, (typeof savedOpportunities)[number]>();
    for (const s of savedOpportunities) {
      map.set(s.opportunityId, s);
    }
    return map;
  }, [savedOpportunities]);

  const runLiveWebSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = liveQuery.trim();
    if (!q || liveBusy) return;
    setLiveBusy(true);
    setLiveError(null);
    try {
      const resp = await fetch('/api/ai/opportunities-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, kind: kindFilter }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Live web search failed.');
      setLiveResult({
        summary: data.summary || '',
        sources: Array.isArray(data.sources) ? data.sources : [],
      });
    } catch (err: unknown) {
      setLiveError(err instanceof Error ? err.message : 'Unable to search live opportunities.');
    } finally {
      setLiveBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">LIFEOS Opportunities</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
            Jobs, Scholarships, Grants &amp; Training
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] w-full lg:w-72 focus-within:border-fuchsia-500">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter curated catalog..."
            className="flex-1 bg-transparent text-sm outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Live Google Search Grounding Discovery Bar */}
      <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-fuchsia-500" />
            <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-white">
              Live Web Opportunity Search (Google Search Grounded)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            Verifiable external deadlines &amp; official links
          </span>
        </div>

        <form onSubmit={runLiveWebSearch} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
            placeholder="e.g. South Africa youth tech scholarships or SME digital grants 2026"
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
          />
          <button
            type="submit"
            disabled={!liveQuery.trim() || liveBusy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg lifeos-gradient-bg text-white text-xs font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
          >
            {liveBusy ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            <span>{liveBusy ? 'Searching Web...' : 'Search Live Web'}</span>
          </button>
        </form>

        {liveError && (
          <div className="text-xs text-red-600 dark:text-red-400">{liveError}</div>
        )}

        <AnimatePresence>
          {liveResult && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-xl bg-zinc-50 dark:bg-[#050508] border border-zinc-200 dark:border-zinc-800 space-y-3"
            >
              <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {liveResult.summary}
              </div>
              {liveResult.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  {liveResult.sources.map((src) => (
                    <a
                      key={src.url}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-700 text-xs text-fuchsia-600 dark:text-fuchsia-400 hover:underline max-w-[240px]"
                    >
                      <span className="truncate">{src.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Category Filter */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800 w-fit">
        {KIND_FILTERS.map((f) => {
          const active = kindFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setKindFilter(f.id)}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="opp-kind-filter"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 lifeos-gradient-bg rounded-lg"
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Catalog Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          {filtered.map((item) => {
            const isSelected = selected.id === item.id;
            const savedRecord = savedMap.get(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-5 rounded-xl border transition-colors cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-white dark:bg-[#0C0C14] border-fuchsia-500 shadow-[0_0_0_1px_rgba(236,72,153,0.2)]'
                    : 'bg-white dark:bg-[#0C0C14] border-zinc-200 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  <span className="capitalize">
                    {item.kind} · {item.location}
                  </span>
                  <span>Deadline: {item.deadline}</span>
                </div>
                <div className="text-base font-semibold text-zinc-900 dark:text-white">
                  {item.title}
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                  <span>
                    {item.organization} · {item.valueLabel}
                  </span>
                  {savedRecord && (
                    <span className="text-fuchsia-600 dark:text-fuchsia-400 font-medium capitalize">
                      Tracked ({savedRecord.status})
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] text-center text-sm text-zinc-500 dark:text-zinc-400">
              No curated opportunities match this filter. Try searching the live web bar above.
            </div>
          )}
        </div>

        {/* Detail Inspector */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-5 lg:sticky lg:top-24">
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400 capitalize">
              {selected.kind} · {selected.location}
            </div>
            <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white">
              {selected.title}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {selected.organization} · {selected.valueLabel}
            </p>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {selected.summary}
          </p>

          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
              Eligibility Requirements
            </h3>
            <ul className="space-y-1.5">
              {selected.eligibility.map((req) => (
                <li
                  key={req}
                  className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-500 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-1">
            Application Deadline: {selected.deadline}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {!savedMap.has(selected.id) ? (
              <button
                type="button"
                onClick={() =>
                  saveOpportunity({
                    opportunityId: selected.id,
                    title: selected.title,
                    organization: selected.organization,
                    kind: selected.kind,
                    deadline: selected.deadline,
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save to Tracker</span>
              </button>
            ) : (
              <select
                value={savedMap.get(selected.id)?.status || 'saved'}
                onChange={(e) =>
                  updateOpportunityStatus(
                    savedMap.get(selected.id)!.id,
                    e.target.value as 'saved' | 'preparing' | 'applied'
                  )
                }
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#050508] text-xs font-medium"
              >
                <option value="saved">Status: Saved</option>
                <option value="preparing">Status: Preparing</option>
                <option value="applied">Status: Applied</option>
              </select>
            )}

            <button
              type="button"
              onClick={() =>
                askAiWithPrompt(
                  `Help me assess my eligibility and draft a concise motivation note for "${selected.title}" at ${selected.organization} (Deadline: ${selected.deadline}).`
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg lifeos-gradient-bg text-white text-xs font-semibold cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Application Help</span>
            </button>

            <a
              href={selected.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:border-fuchsia-500/40"
            >
              <span>Official Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Saved Tracker Table */}
      <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            My Tracked Applications
          </h2>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {savedOpportunities.length} saved
          </span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {savedOpportunities.map((saved) => (
            <div key={saved.id} className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {saved.title}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {saved.organization} · Deadline {saved.deadline}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={saved.status}
                  onChange={(e) =>
                    updateOpportunityStatus(
                      saved.id,
                      e.target.value as 'saved' | 'preparing' | 'applied'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#050508] text-xs"
                >
                  <option value="saved">Saved</option>
                  <option value="preparing">Preparing</option>
                  <option value="applied">Applied</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeSavedOpportunity(saved.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                  aria-label={`Remove ${saved.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {savedOpportunities.length === 0 && (
            <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Select any opportunity above and click &ldquo;Save to Tracker&rdquo; to monitor deadlines.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
