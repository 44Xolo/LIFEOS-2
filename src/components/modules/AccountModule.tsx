import React, { useEffect, useState } from 'react';
import { Download, Lock, ShieldCheck, Trash2 } from 'lucide-react';
import { useLifeOS } from '../../context/LifeOSContext';
import type { CurrencyCode, ThemeMode } from '../../types/lifeos';

export const AccountModule: React.FC = () => {
  const {
    user,
    workspace,
    privateProfile,
    theme,
    updateWorkspaceSettings,
    updatePrivateProfile,
    updatePopiaConsent,
    exportAllUserData,
    clearWorkspaceData,
    signOutUser,
  } = useLifeOS();

  const [displayName, setDisplayName] = useState(workspace?.displayName || '');
  const [roleTitle, setRoleTitle] = useState(workspace?.roleTitle || '');
  const [currency, setCurrency] = useState<CurrencyCode>(workspace?.currency || 'ZAR');
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(theme);

  const [phone, setPhone] = useState(privateProfile?.phone || '');
  const [businessName, setBusinessName] = useState(privateProfile?.businessName || '');
  const [location, setLocation] = useState(privateProfile?.location || '');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (workspace) {
      setDisplayName(workspace.displayName);
      setRoleTitle(workspace.roleTitle || '');
      setCurrency(workspace.currency);
      setSelectedTheme(workspace.theme);
    }
  }, [workspace]);

  useEffect(() => {
    if (privateProfile) {
      setPhone(privateProfile.phone || '');
      setBusinessName(privateProfile.businessName || '');
      setLocation(privateProfile.location || '');
    }
  }, [privateProfile]);

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateWorkspaceSettings({
      displayName,
      roleTitle,
      currency,
      theme: selectedTheme,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePrivateProfile({
      phone,
      businessName,
      location,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono text-fuchsia-600 dark:text-fuchsia-400">
          Account &amp; Governance
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
          Profile, Preferences &amp; POPIA Privacy
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workspace Preferences */}
        <form
          onSubmit={handleSavePrefs}
          className="lg:col-span-6 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Workspace Preferences
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={80}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Role or Focus
              </label>
              <input
                type="text"
                maxLength={80}
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
                >
                  <option value="ZAR">ZAR (South African Rand)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Appearance
                </label>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value as ThemeMode)}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg lifeos-gradient-bg text-white text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
          >
            Save Preferences
          </button>
        </form>

        {/* Isolated PII Private Profile */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-6 bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              Personal &amp; Business Identity
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-500 dark:text-zinc-400">
              <Lock className="w-3.5 h-3.5 text-fuchsia-500" />
              <span>PII Isolated</span>
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Verified Account Identity
              </label>
              <input
                type="text"
                disabled
                value={user?.email || user?.phoneNumber || privateProfile?.email || 'Verified Member'}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-[#050508]/60 text-sm text-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Business Trading Name (used on Quotes &amp; Invoices)
              </label>
              <input
                type="text"
                maxLength={100}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  maxLength={32}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  City / Province
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050508] text-sm outline-none focus:border-fuchsia-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-sm font-semibold cursor-pointer"
          >
            Update Private Profile
          </button>
        </form>
      </div>

      {/* POPIA Privacy & Permission Management */}
      <div className="bg-white dark:bg-[#0C0C14] border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-6 space-y-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-fuchsia-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              POPIA Data Protection &amp; Permission Management
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              In alignment with South Africa’s Protection of Personal Information Act (POPIA), you
              control what context LIFEOS processes, and can export or erase your data at any time.
            </p>
          </div>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <label className="py-3.5 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                AI Workspace Context Processing
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Allow LIFEOS AI to read sanitized balance, task, and learning summaries to answer questions.
              </div>
            </div>
            <input
              type="checkbox"
              checked={workspace?.aiContextEnabled ?? true}
              onChange={(e) => updatePopiaConsent({ aiContextEnabled: e.target.checked })}
              className="w-4 h-4 accent-fuchsia-600 cursor-pointer"
            />
          </label>

          <label className="py-3.5 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                Opportunity Deadline Alerts
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Surface upcoming scholarship, grant, and job deadlines inside your notification center.
              </div>
            </div>
            <input
              type="checkbox"
              checked={workspace?.opportunityAlertsEnabled ?? true}
              onChange={(e) => updatePopiaConsent({ opportunityAlertsEnabled: e.target.checked })}
              className="w-4 h-4 accent-fuchsia-600 cursor-pointer"
            />
          </label>

          <label className="py-3.5 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium text-zinc-900 dark:text-white">
                Bill &amp; Schedule Reminders
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Compute due-date alerts for active personal bills and scheduled tasks.
              </div>
            </div>
            <input
              type="checkbox"
              checked={workspace?.billRemindersEnabled ?? true}
              onChange={(e) => updatePopiaConsent({ billRemindersEnabled: e.target.checked })}
              className="w-4 h-4 accent-fuchsia-600 cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportAllUserData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-fuchsia-500/40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export My Data (JSON)</span>
            </button>

            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Erase Workspace Records</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Confirm permanent deletion?
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await clearWorkspaceData();
                    setConfirmClear(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Erase
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={signOutUser}
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            Sign Out of LIFEOS
          </button>
        </div>
      </div>
    </div>
  );
};
