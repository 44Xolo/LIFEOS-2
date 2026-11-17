import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MailCheck, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { SignInPortal } from './components/SignInPortal';
import { DashboardShell } from './components/DashboardShell';
import { SplashScreen } from './components/SplashScreen';
import { OverviewModule } from './components/modules/OverviewModule';
import { FinanceModule } from './components/modules/FinanceModule';
import { BusinessModule } from './components/modules/BusinessModule';
import { TasksModule } from './components/modules/TasksModule';
import { PlacesModule } from './components/modules/PlacesModule';
import { OpportunitiesModule } from './components/modules/OpportunitiesModule';
import { LearningModule } from './components/modules/LearningModule';
import { AiAssistantModule } from './components/modules/AiAssistantModule';
import { AccountModule } from './components/modules/AccountModule';
import { EASE_OUT_EXPO, LIFEOS_LOGO_SRC } from './components/MotionPrimitives';
import { OfflineIndicator } from './components/PWAInstallPrompt';

const EmailVerificationGate: React.FC = () => {
  const { user, resendVerificationEmail, refreshAuthUser, signOutUser } = useLifeOS();
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F7FC] dark:bg-[#050508] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] p-7 space-y-5 shadow-xl text-center">
        <div className="w-12 h-12 rounded-2xl lifeos-gradient-bg text-white flex items-center justify-center mx-auto shadow-lg">
          <MailCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            Verify your email address
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-semibold text-zinc-900 dark:text-white">
              {user?.email}
            </span>
            . Click the link in your inbox, then continue below.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await refreshAuthUser();
              } finally {
                setBusy(false);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl lifeos-gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            <span>I&apos;ve verified — Enter LIFEOS</span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await resendVerificationEmail();
              } finally {
                setBusy(false);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-fuchsia-500/40 cursor-pointer"
          >
            Resend verification link
          </button>

          <button
            type="button"
            onClick={signOutUser}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white pt-1 cursor-pointer"
          >
            Use a different sign-in method
          </button>
        </div>
      </div>
    </div>
  );
};

const LifeOSRouter: React.FC = () => {
  const { user, authReady, workspaceLoading, needsEmailVerification, activeModule } = useLifeOS();
  const [splashVisible, setSplashVisible] = useState(true);

  const renderContent = () => {
    if (!authReady || (user && !needsEmailVerification && workspaceLoading)) {
      return (
        <div className="min-h-screen bg-[#F8F7FC] dark:bg-[#050508] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
                className="absolute inset-0 rounded-2xl border border-fuchsia-500/40"
              />
              <div className="w-16 h-16 rounded-2xl bg-black overflow-hidden border border-zinc-800 shadow-[0_10px_35px_-8px_rgba(236,72,153,0.5)]">
                <img
                  src={LIFEOS_LOGO_SRC}
                  alt="LIFEOS emblem"
                  className="w-full h-full object-contain scale-110"
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-display text-2xl font-bold italic tracking-tight text-zinc-900 dark:text-white">
                LIFE<span className="lifeos-gradient-text">OS</span>
              </div>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Initializing secure personal operating system...
              </p>
            </div>
          </motion.div>
        </div>
      );
    }

    if (!user) {
      return <SignInPortal />;
    }

    if (needsEmailVerification) {
      return <EmailVerificationGate />;
    }

    const renderModule = () => {
      switch (activeModule) {
        case 'overview':
          return <OverviewModule />;
        case 'finance':
          return <FinanceModule />;
        case 'business':
          return <BusinessModule />;
        case 'tasks':
          return <TasksModule />;
        case 'places':
          return <PlacesModule />;
        case 'opportunities':
          return <OpportunitiesModule />;
        case 'learning':
          return <LearningModule />;
        case 'assistant':
          return <AiAssistantModule />;
        case 'account':
          return <AccountModule />;
        default:
          return <OverviewModule />;
      }
    };

    return <DashboardShell>{renderModule()}</DashboardShell>;
  };

  return (
    <>
      <AnimatePresence>
        {splashVisible && (
          <SplashScreen ready={authReady} onComplete={() => setSplashVisible(false)} />
        )}
      </AnimatePresence>
      {renderContent()}
    </>
  );
};

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  return (
    <ErrorBoundary>
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <LifeOSProvider>
        <LifeOSRouter />
        <OfflineIndicator />
      </LifeOSProvider>
    </ErrorBoundary>
  );
}
