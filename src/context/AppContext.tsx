import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppBranding, LanguageCode, UserAccount, UserRole } from '../types/kawsay';
import { getTranslations, type TranslationBundle } from '../utils/i18n';
import {
  flushOfflineQueue,
  getLastSyncTimestamp,
  getOfflineQueue,
  type SyncConflictItem,
} from '../utils/offlineSync';
import { validateRegistrationInput } from '../utils/validation';
import { apiFetch, clearSessionToken, setSessionToken } from '../utils/authToken';

export type AppView =
  | 'dashboard'
  | 'astronaut_profile'
  | 'biomedical'
  | 'precision_core'
  | 'accuracy_control'
  | 'digital_twin'
  | 'resilience_engine'
  | 'mission_simulator'
  | 'space_risks'
  | 'mental_wellbeing'
  | 'sleep_activity'
  | 'knowledge_center'
  | 'mission_calendar'
  | 'health_analytics'
  | 'reports'
  | 'ai_assistant'
  | 'universal_translator'
  | 'global_adaptation'
  | 'profile'
  | 'settings'
  | 'governance'
  | 'about';

export type SettingsTab =
  | 'personal'
  | 'security'
  | 'language'
  | 'notifications'
  | 'branding'
  | 'data'
  | 'privacy';

export interface SavedTranslatedTerm {
  id: string;
  sourceText: string;
  translatedText: string;
  targetLang: LanguageCode;
  note?: string;
  savedAt: string;
}

const DEFAULT_BRANDING: AppBranding = {
  id: 1,
  applicationName: 'KAWSAY NOVA',
  applicationSubtitle: 'ADVANCED ASTRONAUT HEALTH MONITORING SYSTEM',
  organizationName: 'KAWSAY NOVA Initiative · Ayacucho, Peru',
  institutionalFooter:
    'KAWSAY NOVA · Independent Aerospace Biomedical Proposal · From Space to the World',
  contactEmail: 'telemetry@kawsaynova.org',
  contactPhone: '+51 (066) 555-0194',
  logoStoragePath: '/default-logo.svg',
  faviconStoragePath: '/default-logo.svg',
  reportLogoStoragePath: '/default-logo.svg',
  logoFit: 'contain',
  logoAspectRatio: 'original',
  logoDisplayHeight: 36,
  logoVersion: 1,
  updatedBy: '',
  updatedByName: 'System',
  updatedAt: new Date().toISOString(),
  isActive: true,
};

const VALID_LANGS: LanguageCode[] = ['en', 'es', 'qu', 'pt', 'fr', 'de', 'ja', 'zh'];

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  preferredLanguage: LanguageCode;
  country: string;
  city: string;
  role: UserRole;
  adminProvisionCode?: string;
  avatarDataUrl?: string;
  avatarMimeType?: string;
}

export interface AuthActionResult {
  ok: boolean;
  user?: UserAccount;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface AppContextValue {
  user: UserAccount | null;
  isAuthenticated: boolean;
  branding: AppBranding;
  loading: boolean;
  authSubmitting: boolean;
  authError: string | null;
  clearAuthError: () => void;
  showLanding: boolean;
  setShowLanding: (val: boolean) => void;
  activeView: AppView;
  activeSettingsTab: SettingsTab;
  uiLanguage: LanguageCode;
  setUiLanguage: (lang: LanguageCode) => Promise<void>;
  t: TranslationBundle;
  isOnline: boolean;
  offlineQueueCount: number;
  lastSyncAt: string | null;
  syncConflicts: SyncConflictItem[];
  refreshOfflineState: () => void;
  syncNow: () => Promise<void>;
  demoTourOpen: boolean;
  setDemoTourOpen: (open: boolean) => void;
  translatorOpen: boolean;
  setTranslatorOpen: (open: boolean) => void;
  savedTerms: SavedTranslatedTerm[];
  saveTranslatedTerm: (entry: Omit<SavedTranslatedTerm, 'id' | 'savedAt'>) => void;
  removeSavedTerm: (id: string) => void;
  setUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  setBranding: React.Dispatch<React.SetStateAction<AppBranding>>;
  setActiveView: (view: AppView) => void;
  setActiveSettingsTab: (tab: SettingsTab) => void;
  openSettingsSection: (tab: SettingsTab) => void;
  login: (credentials: LoginCredentials) => Promise<AuthActionResult>;
  register: (
    payload: RegisterPayload,
    options?: { deferActivation?: boolean }
  ) => Promise<AuthActionResult>;
  activateAuthenticatedUser: (nextUser: UserAccount) => void;
  refreshSession: () => Promise<UserAccount | null>;
  refreshBranding: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function readInitialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem('kawsay_lang') as LanguageCode | null;
    if (saved && VALID_LANGS.includes(saved)) return saved;
  } catch {
    // ignore
  }
  return 'en';
}

function readAutostartParam(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1';
  } catch {
    return false;
  }
}

function loadSavedTerms(): SavedTranslatedTerm[] {
  try {
    const raw = localStorage.getItem('kawsay_saved_terms_v1');
    if (!raw) return [];
    return JSON.parse(raw) as SavedTranslatedTerm[];
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [branding, setBranding] = useState<AppBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState(!readAutostartParam());
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('personal');
  const [uiLanguage, setUiLanguageState] = useState<LanguageCode>(readInitialLanguage);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => getLastSyncTimestamp());
  const [syncConflicts, setSyncConflicts] = useState<SyncConflictItem[]>([]);
  const [demoTourOpen, setDemoTourOpen] = useState(false);
  const [translatorOpen, setTranslatorOpen] = useState(false);
  const [savedTerms, setSavedTerms] = useState<SavedTranslatedTerm[]>(loadSavedTerms);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const activateAuthenticatedUser = useCallback((nextUser: UserAccount) => {
    setUser(nextUser);
    setAuthError(null);
    setShowLanding(false);
    setActiveView('dashboard');
    if (nextUser.preferredLanguage && VALID_LANGS.includes(nextUser.preferredLanguage)) {
      setUiLanguageState(nextUser.preferredLanguage);
      try {
        localStorage.setItem('kawsay_lang', nextUser.preferredLanguage);
      } catch {
        // ignore storage restrictions
      }
    }
  }, []);

  const refreshOfflineState = useCallback(() => {
    setOfflineQueueCount(getOfflineQueue().length);
    setLastSyncAt(getLastSyncTimestamp());
  }, []);

  const syncNow = useCallback(async () => {
    const result = await flushOfflineQueue();
    if (result.conflicts.length > 0) {
      setSyncConflicts(result.conflicts);
    }
    refreshOfflineState();
  }, [refreshOfflineState]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      syncNow();
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  const refreshBranding = useCallback(async () => {
    try {
      const res = await apiFetch('/api/branding/active', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.branding) {
          setBranding(data.branding);
        }
      }
    } catch {
      // retain current branding
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<UserAccount | null> => {
    try {
      const res = await apiFetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        clearSessionToken();
        setUser(null);
        return null;
      }
      const data = await res.json();
      const sessionUser: UserAccount | null = data.user ?? null;
      if (sessionUser && data.sessionToken) {
        setSessionToken(data.sessionToken);
      } else if (!sessionUser) {
        clearSessionToken();
      }
      setUser(sessionUser);
      if (sessionUser) {
        setShowLanding(false);
        if (sessionUser.preferredLanguage && VALID_LANGS.includes(sessionUser.preferredLanguage)) {
          setUiLanguageState(sessionUser.preferredLanguage);
          try {
            localStorage.setItem('kawsay_lang', sessionUser.preferredLanguage);
          } catch {
            // ignore
          }
        }
      }
      return sessionUser;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.all([refreshBranding(), refreshSession()]);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshBranding, refreshSession]);

  // Re-validate HTTP-only HMAC session when returning to an active tab
  useEffect(() => {
    if (!user) return;
    function handleVisibilityCheck() {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityCheck);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityCheck);
    };
  }, [user, refreshSession]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthActionResult> => {
      const identifier = credentials.identifier.trim();
      const password = credentials.password;
      setAuthError(null);

      if (!identifier || !password) {
        const errorMsg = 'Enter your username or email address and password.';
        setAuthError(errorMsg);
        return { ok: false, error: errorMsg };
      }

      setAuthSubmitting(true);
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({ identifier, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.user) {
          const errorMsg = data.error || 'Authentication failed.';
          setAuthError(errorMsg);
          return { ok: false, error: errorMsg };
        }
        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
        }
        activateAuthenticatedUser(data.user as UserAccount);
        return { ok: true, user: data.user as UserAccount };
      } catch {
        const errorMsg = 'Unable to reach authentication service.';
        setAuthError(errorMsg);
        return { ok: false, error: errorMsg };
      } finally {
        setAuthSubmitting(false);
      }
    },
    [activateAuthenticatedUser]
  );

  const register = useCallback(
    async (
      payload: RegisterPayload,
      options?: { deferActivation?: boolean }
    ): Promise<AuthActionResult> => {
      setAuthError(null);
      const validation = validateRegistrationInput({
        fullName: payload.fullName,
        username: payload.username,
        email: payload.email,
        password: payload.password,
        passwordConfirmation: payload.passwordConfirmation,
        country: payload.country,
        city: payload.city,
        preferredLanguage: payload.preferredLanguage,
        role: payload.role,
      });

      if (!validation.valid) {
        return { ok: false, error: 'Validation failed.', fieldErrors: validation.errors };
      }

      setAuthSubmitting(true);
      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({
            fullName: payload.fullName.trim(),
            username: payload.username.trim(),
            email: payload.email.trim(),
            password: payload.password,
            passwordConfirmation: payload.passwordConfirmation,
            preferredLanguage: payload.preferredLanguage,
            country: payload.country.trim(),
            city: payload.city.trim(),
            role: payload.role,
            adminProvisionCode:
              payload.role === 'administrator' ? payload.adminProvisionCode : undefined,
            avatarDataUrl: payload.avatarDataUrl || undefined,
            avatarMimeType: payload.avatarMimeType || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.user) {
          const errorMsg = data.error || 'Registration failed.';
          setAuthError(errorMsg);
          return {
            ok: false,
            error: errorMsg,
            fieldErrors: data.fieldErrors as Record<string, string> | undefined,
          };
        }

        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
        }
        const createdUser = data.user as UserAccount;
        if (!options?.deferActivation) {
          activateAuthenticatedUser(createdUser);
        }
        return { ok: true, user: createdUser };
      } catch {
        const errorMsg = 'Unable to reach registration endpoint.';
        setAuthError(errorMsg);
        return { ok: false, error: errorMsg };
      } finally {
        setAuthSubmitting(false);
      }
    },
    [activateAuthenticatedUser]
  );

  // Global browser favicon & title synchronization
  useEffect(() => {
    document.title = branding.applicationName || 'KAWSAY NOVA';
    const faviconUrl = `${branding.faviconStoragePath}?v=${branding.logoVersion}`;
    let linkEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = 'app-favicon';
      linkEl.rel = 'icon';
      document.head.appendChild(linkEl);
    }
    linkEl.href = faviconUrl;
    if (branding.faviconStoragePath.endsWith('.svg')) {
      linkEl.type = 'image/svg+xml';
    } else if (branding.faviconStoragePath.endsWith('.png')) {
      linkEl.type = 'image/png';
    } else if (branding.faviconStoragePath.endsWith('.webp')) {
      linkEl.type = 'image/webp';
    } else {
      linkEl.type = 'image/jpeg';
    }
  }, [branding.faviconStoragePath, branding.logoVersion, branding.applicationName]);

  const setUiLanguage = useCallback(
    async (lang: LanguageCode) => {
      setUiLanguageState(lang);
      try {
        localStorage.setItem('kawsay_lang', lang);
      } catch {
        // ignore
      }
      if (user) {
        try {
          const res = await apiFetch('/api/users/me/preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ preferredLanguage: lang }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) setUser(data.user);
          }
        } catch {
          // keep local language active even offline
        }
      }
    },
    [user]
  );

  const saveTranslatedTerm = useCallback(
    (entry: Omit<SavedTranslatedTerm, 'id' | 'savedAt'>) => {
      setSavedTerms((prev) => {
        const next: SavedTranslatedTerm[] = [
          {
            ...entry,
            id: `term-${Date.now()}`,
            savedAt: new Date().toISOString(),
          },
          ...prev.slice(0, 49),
        ];
        try {
          localStorage.setItem('kawsay_saved_terms_v1', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const removeSavedTerm = useCallback((id: string) => {
    setSavedTerms((prev) => {
      const next = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem('kawsay_saved_terms_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } finally {
      clearSessionToken();
      setUser(null);
      setAuthError(null);
      setSyncConflicts([]);
      setActiveView('dashboard');
      setShowLanding(false);
    }
  }, []);

  const openSettingsSection = useCallback((tab: SettingsTab) => {
    setActiveSettingsTab(tab);
    setActiveView('settings');
  }, []);

  const t = getTranslations(uiLanguage);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        branding,
        loading,
        authSubmitting,
        authError,
        clearAuthError,
        showLanding,
        setShowLanding,
        activeView,
        activeSettingsTab,
        uiLanguage,
        setUiLanguage,
        t,
        isOnline,
        offlineQueueCount,
        lastSyncAt,
        syncConflicts,
        refreshOfflineState,
        syncNow,
        demoTourOpen,
        setDemoTourOpen,
        translatorOpen,
        setTranslatorOpen,
        savedTerms,
        saveTranslatedTerm,
        removeSavedTerm,
        setUser,
        setBranding,
        setActiveView,
        setActiveSettingsTab,
        openSettingsSection,
        login,
        register,
        activateAuthenticatedUser,
        refreshSession,
        refreshBranding,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
