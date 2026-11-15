import React, { useRef, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldAlert, Upload, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { LanguageCode, UserRole } from '../types/kawsay';
import { LANGUAGE_OPTIONS } from '../utils/i18n';
import { ROLE_LABELS, validateAvatarFile } from '../utils/validation';
import { BrandMark } from './BrandMark';

export function LoadingScreen() {
  const { branding } = useAppContext();
  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col items-center justify-center px-6 text-center">
      <div className="bg-[#151F30] border border-[#293952] rounded-xl p-8 flex flex-col items-center gap-5 max-w-sm w-full">
        <BrandMark branding={branding} variant="loading" />
        <div className="w-full h-1 bg-[#1D2A3D] rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-[#38BDF8] rounded-full animate-pulse" />
        </div>
        <p className="text-xs text-[#CBD5E1]">
          Initializing encrypted telemetry workspace and institutional branding...
        </p>
      </div>
    </div>
  );
}

const DEMO_ACCOUNTS: Array<{
  label: string;
  role: string;
  identifier: string;
  password: string;
}> = [
  {
    label: 'Astronaut',
    role: 'Cmdr. Camila Vega',
    identifier: 'commander.vega',
    password: 'KawsayUser2026!',
  },
  {
    label: 'Medical Specialist',
    role: 'Dr. Marcus Palacios',
    identifier: 'dr.palacios',
    password: 'KawsayUser2026!',
  },
  {
    label: 'Scientific Researcher',
    role: 'Dr. Mei-Ling Chen',
    identifier: 'dr.chen',
    password: 'KawsayUser2026!',
  },
  {
    label: 'General User',
    role: 'Luna Morales',
    identifier: 'guest.luna',
    password: 'KawsayUser2026!',
  },
  {
    label: 'System Administrator',
    role: 'Elena Reed',
    identifier: 'admin.kawsay',
    password: 'KawsayAdmin2026!',
  },
];

export function AuthPortal() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return mode === 'login' ? (
    <LoginScreen onSwitchToRegister={() => setMode('register')} />
  ) : (
    <RegistrationScreen onSwitchToLogin={() => setMode('login')} />
  );
}

function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { branding, login, authSubmitting, setShowLanding, t } = useAppContext();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await login({ identifier, password });
    if (!result.ok) {
      setError(result.error || 'Authentication failed.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Institutional Context Column */}
        <div className="lg:col-span-5 bg-[#151F30] border border-[#293952] rounded-xl p-8 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <BrandMark branding={branding} variant="auth" />
            <div className="pt-4 border-t border-[#293952] space-y-3">
              <h1
                className="text-2xl font-semibold text-white leading-snug"
                style={{ textWrap: 'balance' }}
              >
                Aerospace Biomedical Telemetry & Crew Governance
              </h1>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                Role-separated clinical telemetry, longitudinal health monitoring, anonymized
                cohort modeling, and centralized institutional identity for mission operations.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-[#293952] text-xs text-[#CBD5E1]">
            <p className="font-medium text-white">{branding.organizationName}</p>
            <p>{branding.contactEmail} · {branding.contactPhone}</p>
            <p className="text-slate-400">{branding.institutionalFooter}</p>
          </div>
        </div>

        {/* Right Sign-In Card */}
        <div className="lg:col-span-7 bg-[#1D2A3D] border border-[#293952] rounded-xl p-8 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Sign In to Workspace</h2>
                <p className="text-sm text-[#CBD5E1] mt-1">
                  Access your personalized KAWSAY NOVA profile and authorized telemetry.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLanding(true)}
                  className="px-3 py-2 text-xs font-medium text-[#CBD5E1] hover:text-white border border-[#293952] rounded-lg hover:bg-[#151F30] transition-colors whitespace-nowrap"
                >
                  {t.backToLanding}
                </button>
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="px-4 py-2 text-sm font-medium text-[#38BDF8] border border-[#38BDF8]/40 rounded-lg hover:bg-[#38BDF8]/10 transition-colors whitespace-nowrap"
                >
                  Create Account
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-sm text-rose-200"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-sm font-medium text-[#CBD5E1] mb-1.5"
                >
                  Username or Email Address
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. commander.vega or vega@kawsaynova.org"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-[#CBD5E1] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-11 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#CBD5E1] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] font-semibold transition-colors disabled:opacity-60"
              >
                {authSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div className="pt-5 border-t border-[#293952]">
            <p className="text-xs font-medium text-[#CBD5E1] mb-2.5">
              Quick-Fill Seeded Role Accounts (Real Server Authentication)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.identifier}
                  type="button"
                  onClick={() => {
                    setIdentifier(acc.identifier);
                    setPassword(acc.password);
                    setError(null);
                  }}
                  className="text-left px-3 py-2 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#293952] hover:border-[#38BDF8]/50 transition-colors"
                >
                  <div className="text-xs font-semibold text-white">{acc.label}</div>
                  <div className="text-[11px] text-[#CBD5E1] font-mono">
                    {acc.role} · {acc.identifier}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { branding, register, activateAuthenticatedUser, authSubmitting } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<UserRole>('astronaut');
  const [adminProvisionCode, setAdminProvisionCode] = useState('');

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarMimeType, setAvatarMimeType] = useState<string>('');
  const [avatarFileName, setAvatarFileName] = useState<string>('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateAvatarFile({ name: file.name, type: file.type, size: file.size });
    if (!check.valid) {
      setFieldErrors((prev) => ({ ...prev, avatar: check.error || 'Invalid image.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreviewUrl(String(reader.result || ''));
      setAvatarMimeType(file.type || 'image/png');
      setAvatarFileName(file.name);
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);
    setFieldErrors({});

    const result = await register(
      {
        fullName,
        username,
        email,
        password,
        passwordConfirmation,
        preferredLanguage,
        country,
        city,
        role,
        adminProvisionCode,
        avatarDataUrl: avatarPreviewUrl || undefined,
        avatarMimeType: avatarMimeType || undefined,
      },
      { deferActivation: true }
    );

    if (!result.ok || !result.user) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result.error && !result.fieldErrors) setServerError(result.error);
      else if (result.error && result.error !== 'Validation failed.') setServerError(result.error);
      return;
    }

    const createdUser = result.user;
    setSuccessMsg('Account created successfully. Entering KAWSAY NOVA workspace...');
    setTimeout(() => {
      activateAuthenticatedUser(createdUser);
    }, 350);
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#293952]">
          <BrandMark branding={branding} variant="auth" />
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="px-4 py-2 text-sm font-medium text-[#CBD5E1] hover:text-white border border-[#293952] rounded-lg hover:bg-[#151F30] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            Back to Sign In
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-white">Create Personal Account</h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Register an individual profile with role-based permissions and encrypted data isolation.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-sm text-rose-200"
          >
            {serverError}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-sm text-emerald-200"
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture Selection */}
          <div className="p-4 rounded-xl bg-[#151F30] border border-[#293952] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {avatarPreviewUrl ? (
                <img
                  src={avatarPreviewUrl}
                  alt="Selected profile preview"
                  className="h-16 w-16 rounded-full object-cover border border-[#38BDF8]"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#1D2A3D] border border-[#293952] flex items-center justify-center text-xs font-mono text-[#CBD5E1]">
                  AVATAR
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-white">Profile Picture (Optional)</div>
                <p className="text-xs text-[#CBD5E1]">
                  Supported formats: JPG, JPEG, PNG, WEBP (max 5 MB).
                </p>
                {avatarFileName && (
                  <p className="text-xs text-[#38BDF8] font-mono mt-0.5">{avatarFileName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
                aria-label="Choose profile picture file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg bg-[#1D2A3D] hover:bg-[#0B1220] border border-[#38BDF8]/40 text-xs font-medium text-[#38BDF8] flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                Select Photo
              </button>
              {avatarPreviewUrl && (
                <button
                  type="button"
                  aria-label="Remove selected profile picture"
                  onClick={() => {
                    setAvatarPreviewUrl(null);
                    setAvatarFileName('');
                    setAvatarMimeType('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 rounded-lg bg-[#1D2A3D] hover:bg-rose-950/50 border border-[#293952] text-[#CBD5E1] hover:text-rose-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {fieldErrors.avatar && (
            <p className="text-xs text-rose-300">{fieldErrors.avatar}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-fullname" className="block text-sm font-medium text-[#CBD5E1] mb-1">
                Full Name
              </label>
              <input
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Valeria Mendoza"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              {fieldErrors.fullName && (
                <p className="text-xs text-rose-300 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-username" className="block text-sm font-medium text-[#CBD5E1] mb-1">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. valeria.mendoza"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              {fieldErrors.username && (
                <p className="text-xs text-rose-300 mt-1">{fieldErrors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-[#CBD5E1] mb-1">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="valeria@kawsaynova.org"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-300 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-language" className="block text-sm font-medium text-[#CBD5E1] mb-1">
                Preferred Language
              </label>
              <select
                id="reg-language"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white focus:outline-none focus:border-[#38BDF8]"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reg-country" className="block text-sm font-medium text-[#CBD5E1] mb-1">
                Country
              </label>
              <input
                id="reg-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Peru"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              {fieldErrors.country && (
                <p className="text-xs text-rose-300 mt-1">{fieldErrors.country}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-city" className="block text-sm font-medium text-[#CBD5E1] mb-1">
                City
              </label>
              <input
                id="reg-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Cusco"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              {fieldErrors.city && (
                <p className="text-xs text-rose-300 mt-1">{fieldErrors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-[#CBD5E1] mb-1">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              {fieldErrors.password && (
                <p className="text-xs text-rose-300 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-password-confirm"
                className="block text-sm font-medium text-[#CBD5E1] mb-1"
              >
                Password Confirmation
              </label>
              <input
                id="reg-password-confirm"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]"
              />
              {fieldErrors.passwordConfirmation && (
                <p className="text-xs text-rose-300 mt-1">{fieldErrors.passwordConfirmation}</p>
              )}
            </div>
          </div>

          {/* Account Type / Role Selection */}
          <div className="space-y-2">
            <label htmlFor="reg-role" className="block text-sm font-medium text-[#CBD5E1]">
              User Role
            </label>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white focus:outline-none focus:border-[#38BDF8]"
            >
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((rKey) => (
                <option key={rKey} value={rKey}>
                  {ROLE_LABELS[rKey]}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <p className="text-xs text-rose-300">{fieldErrors.role}</p>
            )}
          </div>

          {role === 'administrator' && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-100 leading-relaxed">
                  <strong className="block text-sm text-white mb-0.5">
                    Restricted Privilege Notice
                  </strong>
                  System Administrator privileges are never granted via open self-registration.
                  An institutional authorization provisioning code is required, or register as a
                  standard role and request elevation from an existing administrator.
                </div>
              </div>
              <div>
                <label
                  htmlFor="reg-admin-code"
                  className="block text-xs font-medium text-amber-200 mb-1"
                >
                  Administrator Authorization Provisioning Code
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-admin-code"
                    type="password"
                    value={adminProvisionCode}
                    onChange={(e) => setAdminProvisionCode(e.target.value)}
                    placeholder="Enter secure provisioning authorization code"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#0B1220] border border-amber-500/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="px-4 py-2.5 rounded-lg border border-[#293952] text-sm font-medium text-[#CBD5E1] hover:text-white hover:bg-[#151F30] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={authSubmitting}
              className="px-6 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {authSubmitting ? 'Creating Account...' : 'Register Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
