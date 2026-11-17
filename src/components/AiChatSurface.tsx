import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  ListTodo,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { formatMoney } from '../lib/formatters';
import type { AiProposal } from '../types/lifeos';
import { EASE_OUT_EXPO } from './MotionPrimitives';

const SUGGESTED_PROMPTS = [
  'Summarize my personal finances and upcoming tasks',
  'Log a R 380 personal groceries expense for today',
  'Create an invoice for Apex Studio for R 6,500 due in 14 days',
  'Schedule a high-priority task to submit my NYDA grant review tomorrow at 10:00',
];

const ProposalCard: React.FC<{
  messageId: string;
  proposal: AiProposal;
}> = ({ messageId, proposal }) => {
  const { resolveAiProposal, workspace } = useLifeOS();
  const [committing, setCommitting] = useState(false);
  const currency = workspace?.currency || 'ZAR';
  const args = proposal.args;

  const titleMap: Record<AiProposal['toolName'], string> = {
    propose_finance_entry: 'Finance Entry Proposal',
    propose_task: 'Schedule & Task Proposal',
    propose_invoice: 'Business Document Proposal',
    propose_learning_plan: 'Learning Plan Proposal',
  };

  const iconMap: Record<AiProposal['toolName'], React.ReactNode> = {
    propose_finance_entry: <Wallet className="w-4 h-4 text-fuchsia-500" />,
    propose_task: <ListTodo className="w-4 h-4 text-purple-500" />,
    propose_invoice: <FileText className="w-4 h-4 text-indigo-500" />,
    propose_learning_plan: <GraduationCap className="w-4 h-4 text-pink-500" />,
  };

  const handleDecision = async (decision: 'approved' | 'declined') => {
    setCommitting(true);
    try {
      await resolveAiProposal(messageId, proposal.id, decision);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
          {iconMap[proposal.toolName]}
          <span>{titleMap[proposal.toolName]}</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          {proposal.status === 'pending'
            ? 'Awaiting Approval'
            : proposal.status === 'approved'
              ? 'Approved & Saved'
              : 'Declined'}
        </span>
      </div>

      <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
        {proposal.toolName === 'propose_finance_entry' && (
          <>
            <div className="font-medium text-zinc-900 dark:text-white">
              {String(args.title || '')} ({String(args.scope || 'personal')} · {String(args.type || 'expense')})
            </div>
            <div className="font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
              {formatMoney(Number(args.amount || 0), currency)} · {String(args.category || 'General')} · {String(args.date || '')}
            </div>
          </>
        )}

        {proposal.toolName === 'propose_task' && (
          <>
            <div className="font-medium text-zinc-900 dark:text-white">{String(args.title || '')}</div>
            <div className="font-mono text-zinc-600 dark:text-zinc-400">
              {String(args.dueDate || '')} {args.timeSlot ? `at ${String(args.timeSlot)}` : ''} · Priority: {String(args.priority || 'medium')}
            </div>
          </>
        )}

        {proposal.toolName === 'propose_invoice' && (
          <>
            <div className="font-medium text-zinc-900 dark:text-white">
              {String(args.docType || 'invoice').toUpperCase()} for {String(args.clientName || '')}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">{String(args.itemSummary || '')}</div>
            <div className="font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
              Subtotal: {formatMoney(Number(args.subtotal || 0), currency)} {args.includeVat ? '(+15% VAT)' : '(No VAT)'} · Due {String(args.dueDate || '')}
            </div>
          </>
        )}

        {proposal.toolName === 'propose_learning_plan' && (
          <>
            <div className="font-medium text-zinc-900 dark:text-white">{String(args.title || '')}</div>
            <div className="text-zinc-600 dark:text-zinc-400">
              {String(args.skillArea || '')} · {String(args.level || 'beginner')} · {String(args.totalLessons || 8)} lessons
            </div>
            <div className="text-zinc-500 dark:text-zinc-400">Next: {String(args.nextTopic || '')}</div>
          </>
        )}
      </div>

      {proposal.status === 'pending' ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={committing}
            onClick={() => handleDecision('approved')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg lifeos-gradient-bg text-white text-xs font-medium hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{committing ? 'Saving...' : 'Approve & Save'}</span>
          </button>
          <button
            type="button"
            disabled={committing}
            onClick={() => handleDecision('declined')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-medium pt-0.5">
          {proposal.status === 'approved' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Committed to workspace</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
              <XCircle className="w-3.5 h-3.5" />
              <span>Action cancelled by user</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export const AiChatSurface: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { aiMessages, aiBusy, aiError, sendAiMessage, workspace } = useLifeOS();
  const [draft, setDraft] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, aiBusy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || aiBusy) return;
    const text = draft;
    setDraft('');
    await sendAiMessage(text, { useSearch });
  };

  const toggleVoiceRecording = async () => {
    setVoiceError(null);
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) return;

        setTranscribing(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const res = String(reader.result || '');
              const idx = res.indexOf(',');
              resolve(idx >= 0 ? res.slice(idx + 1) : res);
            };
            reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
            reader.readAsDataURL(blob);
          });

          const resp = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64, mimeType }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data?.error || 'Transcription failed.');
          if (data.transcript) {
            setDraft((prev) => (prev.trim() ? `${prev.trim()} ${data.transcript}` : data.transcript));
          }
        } catch (err: unknown) {
          setVoiceError(err instanceof Error ? err.message : 'Unable to transcribe audio.');
        } finally {
          setTranscribing(false);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err: unknown) {
      setVoiceError(err instanceof Error ? err.message : 'Microphone access was denied.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Privacy notice strip */}
      <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/80 dark:bg-[#07070C]">
        <span className="truncate">
          {workspace?.aiContextEnabled
            ? 'Context active · Reads workspace summary under POPIA consent'
            : 'Context restricted · Manual chat only (POPIA preference)'}
        </span>
        <span className="font-mono shrink-0 text-fuchsia-600 dark:text-fuchsia-400">Approval Gated</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {aiMessages.length <= 1 && !compact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <motion.button
                key={prompt}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => sendAiMessage(prompt, { useSearch })}
                className="text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] hover:border-fuchsia-500/50 transition-colors text-xs text-zinc-700 dark:text-zinc-200 flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className="line-clamp-2">{prompt}</span>
                <ArrowRight className="w-3.5 h-3.5 text-fuchsia-500 shrink-0" />
              </motion.button>
            ))}
          </div>
        )}

        <AnimatePresence initial={false}>
          {aiMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'lifeos-gradient-bg text-white shadow-[0_6px_20px_-6px_rgba(236,72,153,0.45)]'
                      : 'bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] opacity-70">
                    {!isUser && <Bot className="w-3.5 h-3.5 text-fuchsia-500" />}
                    <span>{isUser ? 'You' : 'LIFEOS Intelligence'}</span>
                    <span>·</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.proposals?.map((prop) => (
                    <ProposalCard key={prop.id} messageId={msg.id} proposal={prop} />
                  ))}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        Verified Web Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingSources.map((src) => (
                          <a
                            key={src.url}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[11px] text-fuchsia-600 dark:text-fuchsia-400 hover:underline max-w-[230px]"
                          >
                            <span className="truncate">{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {aiBusy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 px-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-500 animate-spin" />
            <span>LIFEOS Intelligence is reasoning...</span>
          </motion.div>
        )}

        {(aiError || voiceError) && (
          <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
            {voiceError || aiError}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#07070C] flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setUseSearch((prev) => !prev)}
          title="Toggle Google Search Web Grounding"
          className={`p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            useSearch
              ? 'border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400'
              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleVoiceRecording}
          disabled={transcribing}
          title={recording ? 'Stop voice capture' : 'Dictate via microphone'}
          className={`p-2.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
            recording
              ? 'border-red-500 bg-red-500/15 text-red-500 animate-pulse'
              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-fuchsia-500'
          }`}
        >
          {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            transcribing
              ? 'Transcribing your voice...'
              : recording
                ? 'Listening... tap mic when finished'
                : useSearch
                  ? 'Ask with live Google Search web grounding...'
                  : 'Ask LIFEOS to analyze, draft, schedule, or propose...'
          }
          className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-fuchsia-500 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!draft.trim() || aiBusy || transcribing}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg lifeos-gradient-bg text-white text-sm font-medium hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
