import React, { useEffect, useState } from 'react';
import {
  Bell,
  Database,
  Download,
  Globe,
  KeyRound,
  Lock,
  Palette,
  Shield,
  User,
} from 'lucide-react';
import { useAppContext, type SettingsTab } from '../context/AppContext';
import type { AuditLogEntry, LanguageCode } from '../types/kawsay';
import { LANGUAGE_OPTIONS } from '../utils/i18n';
import { ROLE_LABELS, validatePasswordChange } from '../utils/validation';
import {
  getOfflineStorageStats,
  STORAGE_ARCHITECTURE_NOTE,
} from '../utils/offlineSync';
import { apiFetch } from '../utils/authToken';
import { BrandingStudio } from './BrandingStudio';
import { UserProfileView } from './UserProfileView';

export function SettingsView() {
  const { user, activeSettingsTab, setActiveSettingsTab, t } = useAppContext();

  if (!user) return null;

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'personal', label: t.settingsPersonal, icon: <User className="w-4 h-4" /> },
    { id: 'security', label: t.settingsSecurity, icon: <KeyRound className="w-4 h-4" /> },
    { id: 'language', label: t.settingsLanguage, icon: <Globe className="w-4 h-4" /> },
    { id: 'notifications', label: t.settingsNotifications, icon: <Bell className="w-4 h-4" /> },
    { id: 'branding', label: t.settingsBranding, icon: <Palette className="w-4 h-4" /> },
    { id: 'data', label: t.settingsData, icon: <Database className="w-4 h-4" /> },
    { id: 'privacy', label: t.settingsPrivacy, icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navSettings}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Configure account security, localization, notifications, privacy permissions, and
          institutional branding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 7-Section Settings Navigation */}
        <nav
          aria-label="Settings sections"
          className="lg:col-span-3 bg-[#151F30] border border-[#293952] rounded-xl p-2 flex flex-wrap lg:flex-col gap-1"
        >
          {tabs.map((tab) => {
            const active = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors text-left ${
                  active
                    ? 'bg-[#1D2A3D] text-[#38BDF8] border border-[#38BDF8]/30'
                    : 'text-[#CBD5E1] hover:text-white hover:bg-[#1D2A3D]/60 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Settings Content */}
        <div className="lg:col-span-9">
          {activeSettingsTab === 'personal' && <UserProfileView />}
          {activeSettingsTab === 'security' && <AccountSecurityPanel />}
          {activeSettingsTab === 'language' && <LanguageSettingsPanel />}
          {activeSettingsTab === 'notifications' && <NotificationsSettingsPanel />}
          {activeSettingsTab === 'branding' && <BrandingStudio />}
          {activeSettingsTab === 'data' && <DataManagementPanel />}
          {activeSettingsTab === 'privacy' && <PrivacyPermissionsPanel />}
        </div>
      </div>
    </div>
  );
}

function AccountSecurityPanel() {
  const { user } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const check = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    if (!check.valid) {
      setFeedback({ type: 'error', text: check.error || 'Password validation failed.' });
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Password update failed.' });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setFeedback({ type: 'success', text: 'Password updated securely.' });
    } catch {
      setFeedback({ type: 'error', text: 'Unable to reach security endpoint.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Account Security</h2>
        <p className="text-xs text-[#CBD5E1] mt-1">
          Rotate your account password using scrypt cryptographic verification. All security events
          are recorded in your account audit trail.
        </p>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-lg border text-sm ${
            feedback.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label htmlFor="sec-cur-pass" className="block text-xs font-medium text-[#CBD5E1] mb-1">
            Current Password
          </label>
          <input
            id="sec-cur-pass"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
        <div>
          <label htmlFor="sec-new-pass" className="block text-xs font-medium text-[#CBD5E1] mb-1">
            New Password
          </label>
          <input
            id="sec-new-pass"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
        <div>
          <label
            htmlFor="sec-conf-pass"
            className="block text-xs font-medium text-[#CBD5E1] mb-1"
          >
            Confirm New Password
          </label>
          <input
            id="sec-conf-pass"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="pt-4 border-t border-[#293952] flex items-center gap-3 text-xs text-[#CBD5E1]">
        <Lock className="w-4 h-4 text-[#38BDF8]" />
        <span>
          Session signed with HTTP-only HMAC cookie · Last login{' '}
          <span className="font-mono text-white">
            {new Date(user.lastAccessAt).toLocaleString()}
          </span>
        </span>
      </div>
    </div>
  );
}

function LanguageSettingsPanel() {
  const { user, setUser, setUiLanguage } = useAppContext();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(
    user?.preferredLanguage || 'en'
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  if (!user) return null;

  async function handleSaveLanguage(lang: LanguageCode) {
    setSelectedLang(lang);
    setSaving(true);
    setSavedMsg(null);
    try {
      await setUiLanguage(lang);
      const res = await apiFetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferredLanguage: lang }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setSavedMsg('Language preference saved and applied across all 8 languages.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Language and Translation</h2>
        <p className="text-xs text-[#CBD5E1] mt-1">
          Select your preferred interface language for KAWSAY NOVA navigation, profile menus,
          and controls.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
          {savedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LANGUAGE_OPTIONS.map((opt) => {
          const active = selectedLang === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              disabled={saving}
              onClick={() => handleSaveLanguage(opt.code)}
              className={`p-3.5 rounded-lg border text-left transition-colors ${
                active
                  ? 'bg-[#151F30] border-[#38BDF8] text-white'
                  : 'bg-[#0B1220] border-[#293952] text-[#CBD5E1] hover:border-[#60A5FA]/50 hover:text-white'
              }`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs font-mono text-[#38BDF8] mt-0.5 uppercase">{opt.code}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsSettingsPanel() {
  const { user, setUser } = useAppContext();
  const [prefs, setPrefs] = useState(
    user?.notifications || {
      biometricAlerts: true,
      medicalReports: true,
      systemSecurity: true,
      researchDigests: false,
    }
  );
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!user) return null;

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await apiFetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notifications: prefs }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setStatusMsg('Notification preferences saved.');
      }
    } finally {
      setSaving(false);
    }
  }

  const items: Array<{
    key: keyof typeof prefs;
    title: string;
    desc: string;
  }> = [
    {
      key: 'biometricAlerts',
      title: 'Biometric Threshold Alerts',
      desc: 'Notify when SpO2, heart rate, or salivary cortisol cross clinical thresholds.',
    },
    {
      key: 'medicalReports',
      title: 'Medical Report Readiness',
      desc: 'Notify when flight surgeon observations or printable clinical reports are posted.',
    },
    {
      key: 'systemSecurity',
      title: 'Account & Security Notices',
      desc: 'Notify on sign-ins, password changes, or role updates.',
    },
    {
      key: 'researchDigests',
      title: 'Anonymized Research Digests',
      desc: 'Receive periodic cohort telemetry model summaries.',
    },
  ];

  return (
    <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
        <p className="text-xs text-[#CBD5E1] mt-1">
          Control which operational, clinical, and security notifications are enabled for your
          account.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
          {statusMsg}
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <label
            key={item.key}
            className="p-4 rounded-lg bg-[#151F30] border border-[#293952] flex items-start justify-between gap-4 cursor-pointer"
          >
            <div>
              <div className="text-sm font-medium text-white">{item.title}</div>
              <div className="text-xs text-[#CBD5E1] mt-0.5">{item.desc}</div>
            </div>
            <input
              type="checkbox"
              checked={prefs[item.key]}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
              }
              className="mt-1 h-4 w-4 accent-[#38BDF8]"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Notification Settings'}
      </button>
    </div>
  );
}

function DataManagementPanel() {
  const { user, isOnline, offlineQueueCount, lastSyncAt, syncConflicts, syncNow } = useAppContext();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [idbStats, setIdbStats] = useState<{ indexedDbAvailable: boolean; lastSavedAt: string | null } | null>(null);

  useEffect(() => {
    apiFetch('/api/users/me/audit-logs', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.logs) setLogs(d.logs);
      })
      .catch(() => {});
    getOfflineStorageStats().then(setIdbStats).catch(() => {});
  }, [offlineQueueCount, lastSyncAt]);

  if (!user) return null;

  async function handleExportArchive() {
    if (!user) return;
    const res = await apiFetch('/api/users/me/export', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kawsay-nova-${user.username}-archive.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Offline Cache & Synchronization Status (Section 25) */}
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Database, IndexedDB & Offline Synchronization</h2>
            <p className="text-xs text-[#CBD5E1] mt-1">
              {STORAGE_ARCHITECTURE_NOTE}
            </p>
          </div>
          <button
            type="button"
            onClick={() => syncNow()}
            className="px-4 py-2 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#38BDF8]/40 text-xs font-semibold text-[#38BDF8] whitespace-nowrap"
          >
            Synchronize Queue Now
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952]">
            <div className="text-[#CBD5E1]">Connection Status</div>
            <div className="font-mono font-semibold text-white mt-0.5">
              {isOnline ? 'Online · Active Sync' : 'Offline · Local Cache'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952]">
            <div className="text-[#CBD5E1]">IndexedDB Engine</div>
            <div className="font-mono font-semibold text-emerald-300 mt-0.5">
              {idbStats?.indexedDbAvailable ? 'Active (kawsay_nova_idb_v1)' : 'LocalStorage Fallback'}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952]">
            <div className="text-[#CBD5E1]">Pending Offline Mutations</div>
            <div className="font-mono font-semibold text-[#38BDF8] mt-0.5">{offlineQueueCount} queued</div>
          </div>
          <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952]">
            <div className="text-[#CBD5E1]">Last Local Cache Timestamp</div>
            <div className="font-mono font-semibold text-white mt-0.5">
              {idbStats?.lastSavedAt
                ? new Date(idbStats.lastSavedAt).toLocaleString()
                : lastSyncAt
                  ? new Date(lastSyncAt).toLocaleString()
                  : 'Active session cache'}
            </div>
          </div>
        </div>

        {syncConflicts.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1">
            <div className="font-semibold">Detected Synchronization Conflicts:</div>
            {syncConflicts.map((c) => (
              <div key={c.mutationId}>
                • {c.description}: {c.reason}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Personal Data Archive</h2>
          <p className="text-xs text-[#CBD5E1] mt-1">
            Download your own profile, preferences, and owned biomedical measurements in portable
            JSON format.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportArchive}
          className="px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          Export My Records
        </button>
      </div>

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-white">Your Recent Account Audit Trail</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#293952] text-[#CBD5E1]">
                <th className="py-2 pr-4 font-medium">Action</th>
                <th className="py-2 pr-4 font-medium">Details</th>
                <th className="py-2 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293952]/70">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 pr-4 font-mono text-[#38BDF8]">{log.action}</td>
                  <td className="py-2.5 pr-4 text-white">{log.details}</td>
                  <td className="py-2.5 font-mono tabular-nums text-[#CBD5E1] text-right">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-[#CBD5E1]">
                    No audit entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PrivacyPermissionsPanel() {
  const { user, setUser } = useAppContext();
  const [emailVisibility, setEmailVisibility] = useState<'private' | 'team'>(
    user?.emailVisibility || 'private'
  );
  const [telemetrySharing, setTelemetrySharing] = useState<boolean>(
    user?.telemetrySharing ?? true
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  if (!user) return null;

  async function handleSavePrivacy() {
    setSaving(true);
    setSavedMsg(null);
    try {
      const res = await apiFetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emailVisibility, telemetrySharing }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setSavedMsg('Privacy settings saved.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Privacy Controls</h2>
          <p className="text-xs text-[#CBD5E1] mt-1">
            Control contact visibility and participation in anonymized scientific research cohorts.
          </p>
        </div>

        {savedMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
            {savedMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Email Address Visibility
            </label>
            <select
              value={emailVisibility}
              onChange={(e) => setEmailVisibility(e.target.value as 'private' | 'team')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="private">Private (Account Owner & Administrators Only)</option>
              <option value="team">Authorized Medical & Mission Operations Team</option>
            </select>
          </div>

          <label className="p-4 rounded-lg bg-[#151F30] border border-[#293952] flex items-start justify-between gap-4 cursor-pointer">
            <div>
              <div className="text-sm font-medium text-white">
                Contribute Anonymized Telemetry to Research Cohorts
              </div>
              <div className="text-xs text-[#CBD5E1] mt-0.5">
                When enabled, de-identified aggregate statistics may be included in Scientific
                Researcher datasets without personal identifiers.
              </div>
            </div>
            <input
              type="checkbox"
              checked={telemetrySharing}
              onChange={(e) => setTelemetrySharing(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#38BDF8]"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSavePrivacy}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Privacy Preferences'}
        </button>
      </div>

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-3">
        <h3 className="text-base font-semibold text-white">
          Active Role Permissions ({ROLE_LABELS[user.role]})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {user.permissions.map((perm) => (
            <div
              key={perm}
              className="px-3 py-2 rounded-lg bg-[#151F30] border border-[#293952] text-xs font-mono text-[#CBD5E1]"
            >
              ✓ {perm}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
