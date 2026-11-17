import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Bot,
  Briefcase,
  Command,
  Compass,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Search,
  Shield,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import { useLifeOS } from '../context/LifeOSContext';
import type { ModuleId } from '../types/lifeos';
import { AiChatSurface } from './AiChatSurface';
import { EASE_OUT_EXPO, LifeOSLogoMark } from './MotionPrimitives';
import { PWAInstallButton } from './PWAInstallPrompt';

export const NAV_ITEMS: Array<{
  id: ModuleId;
  label: string;
  icon: React.FC<{ className?: string }>;
  group: 'core' | 'growth' | 'system';
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'core' },
  { id: 'finance', label: 'Finance', icon: Wallet, group: 'core' },
  { id: 'business', label: 'Business', icon: Briefcase, group: 'core' },
  { id: 'tasks', label: 'Tasks & Schedule', icon: ListTodo, group: 'core' },
  { id: 'places', label: 'Places & Routes', icon: MapPin, group: 'core' },
  { id: 'opportunities', label: 'Opportunities', icon: Compass, group: 'growth' },
  { id: 'learning', label: 'Learning', icon: GraduationCap, group: 'growth' },
  { id: 'assistant', label: 'AI Assistant', icon: Bot, group: 'system' },
  { id: 'account', label: 'Account & POPIA', icon: Shield, group: 'system' },
];

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    workspace,
    user,
    activeModule,
    setActiveModule,
    theme,
    toggleTheme,
    notifications,
    aiDrawerOpen,
    setAiDrawerOpen,
    commandPaletteOpen,
    setCommandPaletteOpen,
    askAiWithPrompt,
    signOutUser,
    toastMessage,
  } = useLifeOS();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');

  const activeNav = NAV_ITEMS.find((n) => n.id === activeModule) || NAV_ITEMS[0];

  const filteredCommands = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(cmdQuery.trim().toLowerCase())
  );

  const initials = (workspace?.displayName || user?.email || 'LO')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8F7FC] dark:bg-transparent text-zinc-900 dark:text-zinc-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#07070B] z-30">
        <div className="h-[2px] w-full lifeos-gradient-bg shrink-0" />
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveModule('overview')}
            className="text-left cursor-pointer"
          >
            <LifeOSLogoMark size="sm" showWordmark />
          </button>
          <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
            {workspace?.currency || 'ZAR'}
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {(['core', 'growth', 'system'] as const).map((group) => {
            const groupLabel =
              group === 'core' ? 'Workspace' : group === 'growth' ? 'Growth' : 'Intelligence & Privacy';
            return (
              <div key={group} className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  {groupLabel}
                </div>
                {NAV_ITEMS.filter((n) => n.group === group).map((item) => {
                  const isActive = activeModule === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveModule(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'text-zinc-950 dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="nav-active-pill"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-500/12 via-purple-500/10 to-indigo-500/12 border border-fuchsia-500/25 dark:border-fuchsia-400/25"
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 relative z-10 shrink-0 transition-colors ${
                          isActive ? 'text-fuchsia-600 dark:text-fuchsia-400' : ''
                        }`}
                      />
                      <span className="relative z-10 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-lg lifeos-gradient-bg text-white text-xs font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                {workspace?.displayName || 'Member'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {workspace?.roleTitle || 'LIFEOS Workspace'}
              </div>
            </div>
            <button
              type="button"
              onClick={signOutUser}
              title="Sign Out"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <div className="lg:hidden h-[2px] w-full lifeos-gradient-bg shrink-0" />
        {/* Top Bar */}
        <header className="h-14 sm:h-16 sticky top-0 z-20 bg-white/90 dark:bg-[#050508]/88 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="lg:hidden">
                <LifeOSLogoMark size="xs" showWordmark={false} />
              </span>
              <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline font-display italic font-semibold">
                LIFEOS
              </span>
              <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">/</span>
              <span className="font-semibold text-zinc-900 dark:text-white truncate">
                {activeNav.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton compact />

            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0C0C14] text-xs text-zinc-500 dark:text-zinc-400 hover:border-fuchsia-500/40 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Quick Command</span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] text-zinc-600 dark:text-zinc-300 hover:border-fuchsia-500/40 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-fuchsia-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notifications"
                className="relative p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] text-zinc-600 dark:text-zinc-300 hover:border-fuchsia-500/40 transition-colors cursor-pointer inline-flex items-center"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="ml-1 text-[11px] font-mono font-semibold text-fuchsia-600 dark:text-fuchsia-400 tabular-nums">
                    {notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                    className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] shadow-xl p-3 z-40 space-y-2"
                  >
                    <div className="flex items-center justify-between px-1 pb-1 border-b border-zinc-200 dark:border-zinc-800">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                        Active Reminders
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
                        All clear — no urgent bills or due tasks.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setActiveModule(n.targetModule);
                            setNotifOpen(false);
                          }}
                          className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors space-y-0.5 cursor-pointer"
                        >
                          <div className="text-xs font-medium text-zinc-900 dark:text-white">
                            {n.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {n.detail}
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {activeModule !== 'assistant' && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAiDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg lifeos-gradient-bg text-white text-xs font-semibold shadow-[0_6px_18px_-5px_rgba(236,72,153,0.5)] hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask LIFEOS</span>
              </motion.button>
            )}
          </div>
        </header>

        {/* Viewport Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-xs flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 bg-white dark:bg-[#07070C] h-full border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <LifeOSLogoMark size="sm" showWordmark />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-500 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveModule(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                          active
                            ? 'bg-gradient-to-r from-fuchsia-500/12 to-indigo-500/12 text-zinc-950 dark:text-white border border-fuchsia-500/25'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-fuchsia-500' : ''}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={signOutUser}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Dock (compact <= 56px) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 h-14 bg-white/95 dark:bg-[#07070C]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-5">
        {(['overview', 'finance', 'business', 'tasks', 'assistant'] as ModuleId[]).map((id) => {
          const item = NAV_ITEMS.find((n) => n.id === id)!;
          const Icon = item.icon;
          const active = activeModule === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveModule(id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer ${
                active ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[60px]">{id === 'tasks' ? 'Tasks' : item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Slide-Over AI Assistant Drawer */}
      <AnimatePresence>
        {aiDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
            onClick={() => setAiDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#07070C] h-full border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl"
            >
              <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <LifeOSLogoMark size="xs" showWordmark={false} />
                  <span className="font-display font-semibold text-sm">LIFEOS Intelligence</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiDrawerOpen(false);
                      setActiveModule('assistant');
                    }}
                    className="text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline cursor-pointer"
                  >
                    Expand
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <AiChatSurface compact />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Command Palette (Cmd+K) */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
            onClick={() => setCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0C0C14] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                <Command className="w-4 h-4 text-fuchsia-500" />
                <input
                  type="text"
                  autoFocus
                  value={cmdQuery}
                  onChange={(e) => setCmdQuery(e.target.value)}
                  placeholder="Jump to a module or type a question for LIFEOS AI..."
                  className="flex-1 bg-transparent text-sm outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(false)}
                  className="text-xs font-mono text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  ESC
                </button>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto space-y-1">
                {cmdQuery.trim().length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const q = cmdQuery.trim();
                      setCmdQuery('');
                      setCommandPaletteOpen(false);
                      askAiWithPrompt(q);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 text-sm font-medium cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span className="truncate">Ask LIFEOS Intelligence: &ldquo;{cmdQuery.trim()}&rdquo;</span>
                  </button>
                )}

                {filteredCommands.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(item.id);
                        setCmdQuery('');
                        setCommandPaletteOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-zinc-400" />
                        <span>{item.label}</span>
                      </span>
                      <span className="text-xs font-mono text-zinc-400">Open</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            className="fixed bottom-16 lg:bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border border-fuchsia-500/30 text-xs font-medium shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
