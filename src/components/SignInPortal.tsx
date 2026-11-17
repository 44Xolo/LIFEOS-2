import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ConfirmationResult } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Smartphone,
  Sun,
  Wallet,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import { EASE_OUT_EXPO, LIFEOS_LOGO_SRC, LifeOSLogoMark } from './MotionPrimitives';
import { LifeOS3DCore } from './LifeOS3DCore';
import { PWAInstallButton } from './PWAInstallPrompt';

const OS_PILLARS = [
  {
    id: 'finance',
    label: 'Personal Finance',
    title: 'Every rand accounted for, without spreadsheets.',
    description:
      'Track income and expenses, allocate monthly category budgets, monitor savings goals, and clear bill reminders in real time.',
    highlights: [
      'Real-time cashflow splines and budget threshold alerts',
      'One-click bill clearance that updates your ledger automatically',
      'Multi-currency support (ZAR, USD, EUR, GBP)',
    ],
  },
  {
    id: 'business',
    label: 'Small Business',
    title: 'Client quotations, VAT invoices, and profit clarity.',
    description:
      'Manage customers, draft professional quotes, convert them to invoices in one click, and track net operating profit.',
    highlights: [
      'Instant 15% VAT calculation and printable client invoices',
      'Terminal payment locking with automatic income posting',
      'Client CRM directory synced across devices',
    ],
  },
  {
    id: 'intelligence',
    label: 'AI Control',
    title: 'An assistant that drafts, plans, and asks before acting.',
    description:
      'Ask LIFEOS Intelligence to summarize cashflow, structure a study plan, or prepare an invoice—with explicit approval cards before any commit.',
    highlights: [
      'Human-in-the-loop approval gates on every financial or schedule write',
      'Voice dictation and Google Search grounded web research',
      'Beginner-friendly tutoring across any learning track',
    ],
  },
  {
    id: 'privacy',
    label: 'POPIA Security',
    title: 'Privacy by design, governed under your consent.',
    description:
      'Personally identifiable details are isolated from general workspace preferences, with granular AI context toggles and instant JSON data export.',
    highlights: [
      'Verified Google, Apple, Email & Phone authentication with owner-scoped rules',
      'Granular POPIA consent controls for AI and alerts',
      'One-click Right of Access archive export',
    ],
  },
] as const;

const COUNTRY_CODES = [
  { code: '+27', label: 'ZA +27' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+234', label: 'NG +234' },
  { code: '+254', label: 'KE +254' },
  { code: '+61', label: 'AU +61' },
  { code: '+91', label: 'IN +91' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+971', label: 'AE +971' },
] as const;

type AuthView = 'methods' | 'phone-otp' | 'email';
type EmailMode = 'signin' | 'signup' | 'reset';

const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.77 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.91 6.16-4.91z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.72-4.94 3.72-8.69z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
  </svg>
);

const AppleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 shrink-0' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

function mapFirebaseAuthError(err: unknown, contextLabel: string): string {
  const raw = err instanceof Error ? err.message : 'Sign-in did not complete.';
  if (raw.includes('popup-blocked')) {
    return 'Your browser blocked the sign-in popup. Allow popups for this site or open directly in Safari / Chrome.';
  }
  if (raw.includes('popup-closed-by-user') || raw.includes('cancelled-popup-request')) {
    return `${contextLabel} sign-in was closed before finishing. Tap again when ready.`;
  }
  if (raw.includes('unauthorized-domain')) {
    return 'This app domain must be added to Authorized Domains in Firebase Authentication settings.';
  }
  if (raw.includes('operation-not-allowed') || raw.includes('configuration-not-found')) {
    return `${contextLabel} sign-in is not enabled yet in Firebase Console (Authentication → Sign-in method). Enable it there to activate this provider.`;
  }
  if (raw.includes('invalid-phone-number') || raw.includes('missing-phone-number')) {
    return 'Enter a valid mobile number including digits without spaces (e.g. 0821234567 or 821234567).';
  }
  if (raw.includes('invalid-verification-code')) {
    return 'That 6-digit verification code does not match. Please double-check your SMS and try again.';
  }
  if (raw.includes('code-expired')) {
    return 'The SMS verification code expired. Tap "Resend code" to receive a fresh one.';
  }
  if (raw.includes('too-many-requests')) {
    return 'Too many attempts right now. Please wait a minute before trying again.';
  }
  if (raw.includes('invalid-credential') || raw.includes('wrong-password') || raw.includes('user-not-found')) {
    return 'Incorrect email or password. Double-check your credentials or reset your password.';
  }
  if (raw.includes('email-already-in-use')) {
    return 'An account with this email already exists. Switch to Sign In or reset your password.';
  }
  if (raw.includes('weak-password')) {
    return 'Please choose a stronger password (at least 6 characters).';
  }
  if (raw.includes('captcha-check-failed')) {
    return 'Verification check could not complete. Refresh the page or ensure this domain is authorized in Firebase.';
  }
  return raw;
}

export const SignInPortal: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    sendPhoneOtp,
    verifyPhoneOtp,
    theme,
    toggleTheme,
  } = useLifeOS();

  const authPanelRef = useRef<HTMLDivElement>(null);
  const [signingInProvider, setSigningInProvider] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('methods');

  // Phone OTP state
  const [countryCode, setCountryCode] = useState('+27');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [formattedPhone, setFormattedPhone] = useState('');

  // Email / Gmail state
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState<(typeof OS_PILLARS)[number]['id']>('finance');

  const isAppleDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
  }, []);

  const currentPillar = OS_PILLARS.find((p) => p.id === activeTab) || OS_PILLARS[0];

  const scrollToLoginCard = () => {
    authPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleGoogleSignIn = async () => {
    setSigningInProvider('google');
    setAuthError(null);
    setAuthNotice(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setAuthError(mapFirebaseAuthError(err, 'Google / Gmail'));
      setSigningInProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    setSigningInProvider('apple');
    setAuthError(null);
    setAuthNotice(null);
    try {
      await signInWithApple();
    } catch (err: unknown) {
      setAuthError(mapFirebaseAuthError(err, 'Apple'));
      setSigningInProvider(null);
    }
  };

  const formatE164 = (dialCode: string, localRaw: string): string => {
    const cleaned = localRaw.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    const withoutLeadingZero = cleaned.replace(/^0+/, '');
    return `${dialCode}${withoutLeadingZero}`;
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const e164 = formatE164(countryCode, phoneInput);
    if (e164.length < 8) {
      setAuthError('Enter a valid mobile number to receive your 6-digit SMS code.');
      return;
    }

    setSigningInProvider('phone');
    setAuthError(null);
    setAuthNotice(null);
    try {
      const confirmation = await sendPhoneOtp(e164, 'lifeos-recaptcha-container');
      setConfirmationResult(confirmation);
      setFormattedPhone(e164);
      setOtpCode('');
      setAuthView('phone-otp');
    } catch (err: unknown) {
      setAuthError(mapFirebaseAuthError(err, 'Phone Number'));
    } finally {
      setSigningInProvider(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    if (otpCode.trim().length < 6) {
      setAuthError('Enter the full 6-digit verification code sent to your phone.');
      return;
    }

    setSigningInProvider('otp');
    setAuthError(null);
    try {
      await verifyPhoneOtp(confirmationResult, otpCode);
    } catch (err: unknown) {
      setAuthError(mapFirebaseAuthError(err, 'SMS Code'));
      setSigningInProvider(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningInProvider('email');
    setAuthError(null);
    setAuthNotice(null);
    try {
      if (emailMode === 'reset') {
        await sendPasswordReset(emailInput);
        setAuthNotice('Password reset email sent. Check your Gmail or inbox to choose a new password.');
        setEmailMode('signin');
      } else if (emailMode === 'signup') {
        await signUpWithEmail(emailInput, passwordInput, fullNameInput);
      } else {
        await signInWithEmail(emailInput, passwordInput);
      }
    } catch (err: unknown) {
      setAuthError(mapFirebaseAuthError(err, 'Email / Gmail'));
    } finally {
      setSigningInProvider(null);
    }
  };

  const busy = signingInProvider !== null;

  return (
    <div className="min-h-screen bg-[#F8F7FC] dark:bg-transparent text-zinc-900 dark:text-zinc-100 flex flex-col">
      <div className="h-[2px] w-full lifeos-gradient-bg shrink-0" />
      <div id="lifeos-recaptcha-container" className="hidden" />

      {/* Top Bar */}
      <header className="w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#050508]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a href="#top" className="whitespace-nowrap shrink-0">
            <LifeOSLogoMark size="sm" showWordmark />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#overview" className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors whitespace-nowrap shrink-0">
              Sign In
            </a>
            <a href="#modules" className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors whitespace-nowrap shrink-0">
              Modules
            </a>
            <a href="#intelligence" className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors whitespace-nowrap shrink-0">
              3D Core &amp; AI
            </a>
            <a href="#privacy" className="hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors whitespace-nowrap shrink-0">
              POPIA Privacy
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton compact />
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToLoginCard}
              className="px-4 py-2 text-sm font-semibold rounded-lg lifeos-gradient-bg text-white shadow-[0_8px_22px_-6px_rgba(236,72,153,0.45)] hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </motion.button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split with Unified Multi-Method Login Card */}
        <section id="overview" className="max-w-7xl mx-auto px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
              className="lg:col-span-6 flex flex-col justify-between py-2"
            >
              <div className="space-y-6">
                <p className="text-xs font-mono tracking-wide lifeos-gradient-text font-semibold">
                  Personal Operating System · South Africa &amp; Global
                </p>

                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.08] text-balance">
                  One platform. More control over{' '}
                  <span className="lifeos-gradient-text italic">everyday life.</span>
                </h1>

                <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xl">
                  LIFEOS brings your personal money, small business invoicing, daily schedule,
                  verified opportunities, and guided skill learning into one unified workspace
                  orchestrated by an approval-first AI assistant.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-fuchsia-500/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-fuchsia-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <a
                    href="#modules"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-fuchsia-500/40 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Explore Modules</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-zinc-200 dark:border-zinc-800/80 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-xl font-display font-semibold tabular-nums text-zinc-900 dark:text-white">
                    7 Modules
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Unified under one login
                  </div>
                </div>
                <div>
                  <div className="text-xl font-display font-semibold tabular-nums text-zinc-900 dark:text-white">
                    100% Gated
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    AI asks before writing
                  </div>
                </div>
                <div>
                  <div className="text-xl font-display font-semibold tabular-nums text-zinc-900 dark:text-white">
                    POPIA Ready
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Export &amp; consent controls
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Uber-Style Multi-Method Login Card */}
            <motion.div
              ref={authPanelRef}
              id="auth-panel"
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="lg:col-span-6"
            >
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0B0B12] p-6 sm:p-8 shadow-[0_24px_60px_-20px_rgba(236,72,153,0.28)] relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-25 blur-3xl lifeos-gradient-bg"
                />

                {/* Card Brand Header */}
                <div className="relative flex items-center justify-between gap-4 pb-5 mb-5 border-b border-zinc-200 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-black border border-fuchsia-500/45 overflow-hidden shadow-[0_6px_20px_-6px_rgba(236,72,153,0.55)] shrink-0">
                      <img
                        src={LIFEOS_LOGO_SRC}
                        alt="LIFEOS emblem"
                        className="w-full h-full object-contain scale-110"
                      />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white leading-tight">
                        {authView === 'phone-otp'
                          ? 'Verify your mobile number'
                          : authView === 'email'
                            ? emailMode === 'signup'
                              ? 'Create your LIFEOS account'
                              : emailMode === 'reset'
                                ? 'Reset your password'
                                : 'Sign in with Gmail or Email'
                            : 'Sign in or get started'}
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {authView === 'phone-otp'
                          ? `Enter the 6-digit SMS code sent to ${formattedPhone}`
                          : 'Choose Phone Number, Gmail, or Apple ID'}
                      </p>
                    </div>
                  </div>

                  {authView !== 'methods' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthView('methods');
                        setAuthError(null);
                        setAuthNotice(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>All options</span>
                    </button>
                  )}
                </div>

                {/* Error & Notice Banners */}
                {authError && (
                  <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/35 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                    {authError}
                  </div>
                )}

                {authNotice && (
                  <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/90 dark:bg-emerald-950/35 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    {authNotice}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {authView === 'methods' && (
                    <motion.div
                      key="view-methods"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                      className="relative space-y-4"
                    >
                      {/* 1. Uber-style Phone Number First Flow */}
                      <form onSubmit={handleSendPhoneCode} className="space-y-2.5">
                        <label
                          htmlFor="lifeos-phone-input"
                          className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-fuchsia-500" />
                            <span>Enter your mobile number</span>
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">SMS OTP</span>
                        </label>

                        <div className="flex items-stretch gap-2">
                          <select
                            aria-label="Country dialing code"
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            disabled={busy}
                            className="px-2.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-fuchsia-500 shrink-0"
                          >
                            {COUNTRY_CODES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.label}
                              </option>
                            ))}
                          </select>

                          <input
                            id="lifeos-phone-input"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel-national"
                            placeholder="082 123 4567"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            disabled={busy}
                            className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-fuchsia-500"
                          />
                        </div>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          disabled={busy}
                          className="w-full py-3 px-4 rounded-xl lifeos-gradient-bg text-white text-sm font-semibold shadow-[0_10px_28px_-8px_rgba(236,72,153,0.55)] hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>
                            {signingInProvider === 'phone'
                              ? 'Sending SMS code...'
                              : 'Continue with Phone Number'}
                          </span>
                        </motion.button>
                      </form>

                      {/* Divider */}
                      <div className="relative flex items-center py-1">
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
                        <span className="mx-3 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                          or
                        </span>
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
                      </div>

                      {/* 2. Gmail / Google & Apple (iOS) & Email Stack */}
                      <div className="space-y-2.5">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleGoogleSignIn}
                          disabled={busy}
                          className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#12121C] hover:bg-zinc-50 dark:hover:bg-[#181826] text-sm font-semibold text-zinc-900 dark:text-white transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                        >
                          <GoogleIcon />
                          <span>
                            {signingInProvider === 'google'
                              ? 'Connecting Gmail...'
                              : 'Continue with Gmail / Google'}
                          </span>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleAppleSignIn}
                          disabled={busy}
                          className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 ${
                            isAppleDevice
                              ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 border border-zinc-900 dark:border-white'
                              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 border border-zinc-800 dark:border-zinc-200'
                          }`}
                        >
                          <AppleIcon />
                          <span>
                            {signingInProvider === 'apple'
                              ? 'Connecting Apple ID...'
                              : 'Continue with Apple'}
                          </span>
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white/15 dark:bg-zinc-900/10">
                            {isAppleDevice ? 'iOS Ready' : 'iOS'}
                          </span>
                        </motion.button>

                        <button
                          type="button"
                          onClick={() => {
                            setAuthView('email');
                            setEmailMode('signin');
                            setAuthError(null);
                            setAuthNotice(null);
                          }}
                          disabled={busy}
                          className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] hover:border-fuchsia-500/40 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Mail className="w-3.5 h-3.5 text-fuchsia-500" />
                          <span>Use Gmail / Email &amp; Password</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center pt-1">
                        Protected by Firebase Authentication &amp; owner-isolated POPIA rules.
                      </p>
                    </motion.div>
                  )}

                  {authView === 'phone-otp' && (
                    <motion.form
                      key="view-otp"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                      onSubmit={handleVerifyOtp}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="lifeos-otp-input"
                          className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                        >
                          6-Digit SMS Verification Code
                        </label>
                        <input
                          id="lifeos-otp-input"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="••••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          disabled={busy}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-center font-mono text-xl tracking-[0.45em] text-zinc-900 dark:text-white outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-3 px-4 rounded-xl lifeos-gradient-bg text-white text-sm font-semibold shadow-[0_10px_28px_-8px_rgba(236,72,153,0.55)] hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>
                          {signingInProvider === 'otp'
                            ? 'Verifying code...'
                            : 'Verify & Enter LIFEOS'}
                        </span>
                      </button>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthView('methods');
                            setAuthError(null);
                          }}
                          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                        >
                          Change phone number
                        </button>
                        <button
                          type="button"
                          onClick={(e) => void handleSendPhoneCode(e as unknown as React.FormEvent)}
                          disabled={busy}
                          className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold hover:underline cursor-pointer"
                        >
                          Resend code
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {authView === 'email' && (
                    <motion.form
                      key="view-email"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                      onSubmit={handleEmailSubmit}
                      className="space-y-3.5"
                    >
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-[#050508] border border-zinc-200 dark:border-zinc-800">
                        {(['signin', 'signup'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setEmailMode(mode);
                              setAuthError(null);
                              setAuthNotice(null);
                            }}
                            className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              emailMode === mode
                                ? 'lifeos-gradient-bg text-white'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                          >
                            {mode === 'signin' ? 'Sign In' : 'Create Account'}
                          </button>
                        ))}
                      </div>

                      {emailMode === 'signup' && (
                        <div>
                          <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={80}
                            placeholder="e.g. Xolo Mokoena"
                            value={fullNameInput}
                            onChange={(e) => setFullNameInput(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                          Gmail or Email Address
                        </label>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@gmail.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
                        />
                      </div>

                      {emailMode !== 'reset' && (
                        <div>
                          <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              minLength={6}
                              autoComplete={emailMode === 'signup' ? 'new-password' : 'current-password'}
                              placeholder="••••••••"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full py-3 px-4 rounded-xl lifeos-gradient-bg text-white text-sm font-semibold shadow-[0_10px_28px_-8px_rgba(236,72,153,0.55)] hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {signingInProvider === 'email'
                            ? 'Authenticating...'
                            : emailMode === 'signup'
                              ? 'Create LIFEOS Account'
                              : emailMode === 'reset'
                                ? 'Send Password Reset Email'
                                : 'Sign In with Email'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        {emailMode !== 'reset' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEmailMode('reset');
                              setAuthError(null);
                              setAuthNotice(null);
                            }}
                            className="text-zinc-500 hover:text-fuchsia-500 cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEmailMode('signin')}
                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          >
                            Back to Sign In
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold hover:underline cursor-pointer"
                        >
                          One-tap Gmail instead
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Interactive Module Explorer */}
        <section id="modules" className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-800/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
                Core Architecture
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white mt-1">
                Built as one coherent ecosystem
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800">
              {OS_PILLARS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="landing-tab-bg"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-0 lifeos-gradient-bg rounded-lg shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPillar.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-2xl p-6 sm:p-8"
            >
              <div className="lg:col-span-7 space-y-5">
                <h3 className="font-display text-2xl font-semibold text-zinc-900 dark:text-white">
                  {currentPillar.title}
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {currentPillar.description}
                </p>
                <ul className="space-y-3 pt-2">
                  {currentPillar.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                      <CheckCircle2 className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {[
                  { icon: Wallet, name: 'Finance', detail: 'Budgets & Savings', color: 'text-fuchsia-500' },
                  { icon: Briefcase, name: 'Business', detail: 'Quotes & Invoices', color: 'text-purple-500' },
                  { icon: Compass, name: 'Opportunities', detail: 'Grants & Roles', color: 'text-indigo-500' },
                  { icon: GraduationCap, name: 'Learning', detail: 'Guided Tracks', color: 'text-pink-500' },
                ].map((m) => (
                  <motion.div
                    key={m.name}
                    whileHover={{ y: -3, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-[#06060A] border border-zinc-200 dark:border-zinc-800/90 flex flex-col justify-between gap-4"
                  >
                    <m.icon className={`w-5 h-5 ${m.color}`} />
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white">{m.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{m.detail}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Interactive 3D Emblem & Central AI Core Spotlight */}
        <section id="intelligence" className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-800/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <LifeOS3DCore darkSurface={theme === 'dark'} />
            </div>

            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
                Interactive 3D Core &amp; Approval-First AI
              </p>
              <h2 className="font-display text-3xl font-semibold text-zinc-900 dark:text-white text-balance">
                AI that drafts the work, while you hold the final key.
              </h2>
              <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Orbit the LIFEOS emblem or speak directly to your assistant. Ask LIFEOS to log a
                fuel expense, draft an invoice, schedule tomorrow’s study session, or search live
                opportunities online—every workspace write waits for your explicit approval.
              </p>
              <div id="privacy" className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">POPIA Compliant Controls</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Toggle AI context access, export your full JSON archive, or erase personal records anytime.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Isolated Owner Rules</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Verified Google, Apple, Phone, and Email authentication with owner-only Firestore security rules.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#050508]">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <LifeOSLogoMark size="xs" showWordmark={false} />
            <span>LIFEOS · One Platform. More Control Over Everyday Life.</span>
          </div>
          <div className="flex items-center gap-6">
            <span>POPIA Privacy by Design</span>
            <button
              type="button"
              onClick={scrollToLoginCard}
              className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold hover:underline cursor-pointer"
            >
              Sign in to LIFEOS
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
