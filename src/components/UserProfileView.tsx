import React, { useRef, useState } from 'react';
import {
  Camera,
  Check,
  Edit3,
  Globe,
  KeyRound,
  LogOut,
  MapPin,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { LanguageCode } from '../types/kawsay';
import { LANGUAGE_OPTIONS } from '../utils/i18n';
import {
  ROLE_LABELS,
  validateAvatarFile,
  validateProfileUpdateInput,
} from '../utils/validation';
import { apiFetch } from '../utils/authToken';
import { UserAvatar } from './UserAvatar';

export function UserProfileView() {
  const { user, setUser, t, openSettingsSection, logout } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [country, setCountry] = useState(user?.country || '');
  const [city, setCity] = useState(user?.city || '');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(
    user?.preferredLanguage || 'en'
  );

  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [pendingAvatarMime, setPendingAvatarMime] = useState<string>('');
  const [pendingAvatarName, setPendingAvatarName] = useState<string>('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  if (!user) return null;

  function startEditing() {
    if (!user) return;
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email);
    setCountry(user.country);
    setCity(user.city);
    setPreferredLanguage(user.preferredLanguage);
    setFieldErrors({});
    setFeedback(null);
    setEditing(true);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const check = validateProfileUpdateInput({ fullName, username, email, country, city });
    if (!check.valid) {
      setFieldErrors(check.errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const profileRes = await apiFetch('/api/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          country: country.trim(),
          city: city.trim(),
        }),
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        if (profileData.fieldErrors) setFieldErrors(profileData.fieldErrors);
        setFeedback({ type: 'error', text: profileData.error || 'Could not update profile.' });
        return;
      }

      const prefRes = await apiFetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferredLanguage }),
      });
      const prefData = await prefRes.json();
      setUser(prefRes.ok ? prefData.user : profileData.user);
      setEditing(false);
      setFeedback({ type: 'success', text: 'Profile information saved successfully.' });
    } catch {
      setFeedback({ type: 'error', text: 'Network error while saving profile.' });
    } finally {
      setSaving(false);
    }
  }

  function handleSelectAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateAvatarFile({ name: file.name, type: file.type, size: file.size });
    if (!check.valid) {
      setFeedback({ type: 'error', text: check.error || 'Unsupported avatar file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingAvatarUrl(String(reader.result || ''));
      setPendingAvatarMime(file.type || 'image/png');
      setPendingAvatarName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirmAvatarUpload() {
    if (!pendingAvatarUrl) return;
    setSavingPhoto(true);
    setFeedback(null);
    try {
      const res = await apiFetch('/api/users/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dataUrl: pendingAvatarUrl,
          mimeType: pendingAvatarMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to upload profile photo.' });
        return;
      }
      setUser(data.user);
      setPendingAvatarUrl(null);
      setPendingAvatarName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback({ type: 'success', text: 'Profile photograph updated and persisted.' });
    } catch {
      setFeedback({ type: 'error', text: 'Unable to save profile photograph.' });
    } finally {
      setSavingPhoto(false);
    }
  }

  async function handleRemoveAvatar() {
    setSavingPhoto(true);
    setFeedback(null);
    try {
      const res = await apiFetch('/api/users/me/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Unable to remove profile photo.' });
        return;
      }
      setUser(data.user);
      setPendingAvatarUrl(null);
      setPendingAvatarName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback({ type: 'success', text: 'Profile photograph removed; reverted to default avatar.' });
    } catch {
      setFeedback({ type: 'error', text: 'Unable to remove profile photograph.' });
    } finally {
      setSavingPhoto(false);
    }
  }

  const languageLabel =
    LANGUAGE_OPTIONS.find((l) => l.code === user.preferredLanguage)?.label ||
    user.preferredLanguage;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <UserAvatar
            src={pendingAvatarUrl || user.avatarUrl}
            fullName={user.fullName}
            size="xl"
          />
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold text-white">{user.fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#CBD5E1]">
              <span className="font-mono text-[#38BDF8]">@{user.username}</span>
              <span aria-hidden="true">·</span>
              <span>{ROLE_LABELS[user.role]}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{user.status.replace('_', ' ')}</span>
            </div>
            <p className="text-xs text-[#CBD5E1] font-mono tabular-nums">
              Account ID: {user.id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4" />
              {t.editProfile}
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2.5 rounded-lg bg-[#151F30] hover:bg-rose-950/40 border border-[#293952] hover:border-rose-500/40 text-sm font-medium text-[#CBD5E1] hover:text-rose-200 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            {t.menuLogOut}
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Picture Management Card */}
        <div className="lg:col-span-5 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Profile Photograph</h2>
            <p className="text-xs text-[#CBD5E1] mt-1">
              Select a local JPG, JPEG, PNG, or WEBP image (max 5 MB). Personal avatars remain
              separate from official KAWSAY NOVA branding.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#151F30] border border-[#293952] flex flex-col items-center text-center gap-4">
            <UserAvatar
              src={pendingAvatarUrl || user.avatarUrl}
              fullName={user.fullName}
              size="xl"
            />
            {pendingAvatarUrl ? (
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#38BDF8]">
                  Preview Ready (Not Saved Yet)
                </p>
                <p className="text-xs text-[#CBD5E1] font-mono truncate max-w-[240px]">
                  {pendingAvatarName}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#CBD5E1]">
                {user.avatarUrl
                  ? 'Custom profile photograph active.'
                  : 'Default avatar active. Upload a photograph to personalize.'}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleSelectAvatarFile}
              className="hidden"
              aria-label="Upload profile photograph"
            />

            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingPhoto}
                className="px-3.5 py-2 rounded-lg bg-[#1D2A3D] hover:bg-[#0B1220] border border-[#38BDF8]/40 text-xs font-medium text-[#38BDF8] flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                {user.avatarUrl ? 'Replace Photo' : 'Select Photo'}
              </button>

              {pendingAvatarUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleConfirmAvatarUpload}
                    disabled={savingPhoto}
                    className="px-3.5 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {savingPhoto ? 'Saving...' : 'Save Photo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAvatarUrl(null);
                      setPendingAvatarName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-2 rounded-lg border border-[#293952] text-xs text-[#CBD5E1] hover:text-white flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </>
              )}

              {user.avatarUrl && !pendingAvatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={savingPhoto}
                  className="px-3.5 py-2 rounded-lg border border-[#293952] hover:border-rose-500/40 text-xs text-[#CBD5E1] hover:text-rose-200 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#293952] space-y-2.5">
            <button
              type="button"
              onClick={() => openSettingsSection('security')}
              className="w-full px-4 py-2.5 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#293952] text-left text-sm text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#60A5FA]" />
                Change Password & Security
              </span>
              <span className="text-xs text-[#38BDF8]">Manage</span>
            </button>
            <button
              type="button"
              onClick={() => openSettingsSection('notifications')}
              className="w-full px-4 py-2.5 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#293952] text-left text-sm text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#60A5FA]" />
                Notification Preferences
              </span>
              <span className="text-xs text-[#38BDF8]">Configure</span>
            </button>
          </div>
        </div>

        {/* Account Details / Edit Form */}
        <div className="lg:col-span-7 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6">
          {!editing ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Account & Profile Details</h2>
                <span className="text-xs text-[#CBD5E1]">Verified Record</span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Full Name" value={user.fullName} />
                <InfoRow label="Username" value={`@${user.username}`} mono />
                <InfoRow label="Email Address" value={user.email} />
                <InfoRow label="User Role" value={ROLE_LABELS[user.role]} />
                <InfoRow
                  label="Country & City"
                  value={`${user.city}, ${user.country}`}
                  icon={<MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />}
                />
                <InfoRow
                  label="Preferred Language"
                  value={languageLabel}
                  icon={<Globe className="w-3.5 h-3.5 text-[#38BDF8]" />}
                />
                <InfoRow label="Account Creation Date" value={formatDate(user.createdAt)} mono />
                <InfoRow label="Last Access" value={formatDate(user.lastAccessAt)} mono />
                <InfoRow
                  label="Account Status"
                  value={user.status === 'active' ? '● Active' : user.status}
                  highlight={user.status === 'active'}
                />
                <InfoRow
                  label="Privacy Visibility"
                  value={
                    user.emailVisibility === 'team'
                      ? 'Authorized Mission Team'
                      : 'Private (Owner & Admin Only)'
                  }
                />
              </dl>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#293952]">
                <h2 className="text-lg font-semibold text-white">Edit Personal Information</h2>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs text-[#CBD5E1] hover:text-white"
                >
                  {t.cancel}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prof-fullname"
                    className="block text-xs font-medium text-[#CBD5E1] mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="prof-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
                  />
                  {fieldErrors.fullName && (
                    <p className="text-xs text-rose-300 mt-1">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="prof-username"
                    className="block text-xs font-medium text-[#CBD5E1] mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="prof-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
                  />
                  {fieldErrors.username && (
                    <p className="text-xs text-rose-300 mt-1">{fieldErrors.username}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="prof-email"
                    className="block text-xs font-medium text-[#CBD5E1] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-300 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="prof-lang"
                    className="block text-xs font-medium text-[#CBD5E1] mb-1"
                  >
                    Preferred Language
                  </label>
                  <select
                    id="prof-lang"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="prof-country"
                    className="block text-xs font-medium text-[#CBD5E1] mb-1"
                  >
                    Country
                  </label>
                  <input
                    id="prof-country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
                  />
                  {fieldErrors.country && (
                    <p className="text-xs text-rose-300 mt-1">{fieldErrors.country}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="prof-city"
                    className="block text-xs font-medium text-[#CBD5E1] mb-1"
                  >
                    City
                  </label>
                  <input
                    id="prof-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
                  />
                  {fieldErrors.city && (
                    <p className="text-xs text-rose-300 mt-1">{fieldErrors.city}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#293952]">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg border border-[#293952] text-sm text-[#CBD5E1] hover:text-white"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {saving ? 'Saving...' : t.saveChanges}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  highlight = false,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952]">
      <dt className="text-xs text-[#CBD5E1] mb-1">{label}</dt>
      <dd
        className={`text-sm font-medium flex items-center gap-1.5 ${
          highlight ? 'text-emerald-400' : 'text-white'
        } ${mono ? 'font-mono tabular-nums text-xs sm:text-sm' : ''}`}
      >
        {icon}
        <span className="break-all">{value}</span>
      </dd>
    </div>
  );
}
