import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Calculator,
  Calendar,
  ChevronDown,
  Compass,
  Cpu,
  FileText,
  FlaskConical,
  GitBranch,
  Globe,
  Globe2,
  HeartPulse,
  Info,
  KeyRound,
  Languages,
  LogOut,
  Menu,
  Moon,
  Rocket,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAppContext, type AppView } from '../context/AppContext';
import type { LanguageCode } from '../types/kawsay';
import { LANGUAGE_OPTIONS } from '../utils/i18n';
import { ROLE_LABELS } from '../utils/validation';
import { AboutView } from './AboutView';
import { AccuracyControlView } from './AccuracyControlView';
import {
  AiAssistantView,
  GlobalAdaptationView,
  UniversalTranslatorView,
} from './AiTranslatorGlobalViews';
import { AstronautMissionProfileView } from './AstronautMissionProfileView';
import { BiomedicalDashboard } from './BiomedicalDashboard';
import { BiomedicalMonitoringView } from './BiomedicalMonitoringView';
import { BrandMark } from './BrandMark';
import { DemoTourModal } from './DemoTourModal';
import { DigitalTwinView } from './DigitalTwinView';
import {
  HealthAnalyticsView,
  KnowledgeCenterView,
  MissionCalendarView,
} from './KnowledgeAndCalendarViews';
import { MedicalReportView } from './MedicalReportView';
import { MissionSimulatorView } from './MissionSimulatorView';
import { PrecisionCoreView } from './PrecisionCoreView';
import { ResilienceEngineView } from './ResilienceEngineView';
import { RoleGovernanceView } from './RoleGovernanceView';
import { SettingsView } from './SettingsView';
import { UserAvatar } from './UserAvatar';
import { UserProfileView } from './UserProfileView';
import {
  MentalWellbeingView,
  SleepActivityView,
  SpaceRisksView,
} from './WellnessAndRisksViews';

export function AppShell() {
  const {
    user,
    branding,
    activeView,
    setActiveView,
    openSettingsSection,
    logout,
    t,
    uiLanguage,
    setUiLanguage,
    isOnline,
    offlineQueueCount,
    setDemoTourOpen,
  } = useAppContext();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
        setMobileNavOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  if (!user) return null;

  const navItems: Array<{
    id: AppView;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
  }> = [
    { id: 'dashboard', label: t.navDashboard, icon: <Activity className="w-4 h-4" />, visible: true },
    { id: 'astronaut_profile', label: t.navAstronautProfile, icon: <Rocket className="w-4 h-4" />, visible: true },
    { id: 'biomedical', label: t.navBiomedical, icon: <HeartPulse className="w-4 h-4" />, visible: true },
    { id: 'precision_core', label: t.navPrecisionCore, icon: <Calculator className="w-4 h-4" />, visible: true },
    { id: 'accuracy_control', label: t.navAccuracyControl, icon: <ShieldCheck className="w-4 h-4" />, visible: true },
    { id: 'digital_twin', label: t.navDigitalTwin, icon: <Cpu className="w-4 h-4" />, visible: true },
    { id: 'resilience_engine', label: t.navResilienceEngine, icon: <GitBranch className="w-4 h-4" />, visible: true },
    { id: 'mission_simulator', label: t.navMissionSimulator, icon: <FlaskConical className="w-4 h-4" />, visible: true },
    { id: 'space_risks', label: t.navSpaceRisks, icon: <ShieldAlert className="w-4 h-4" />, visible: true },
    { id: 'mental_wellbeing', label: t.navMentalWellbeing, icon: <HeartPulse className="w-4 h-4" />, visible: true },
    { id: 'sleep_activity', label: t.navSleepActivity, icon: <Moon className="w-4 h-4" />, visible: true },
    { id: 'knowledge_center', label: t.navKnowledgeCenter, icon: <BookOpen className="w-4 h-4" />, visible: true },
    { id: 'mission_calendar', label: t.navMissionCalendar, icon: <Calendar className="w-4 h-4" />, visible: true },
    { id: 'health_analytics', label: t.navHealthAnalytics, icon: <BarChart3 className="w-4 h-4" />, visible: true },
    { id: 'reports', label: t.navReports, icon: <FileText className="w-4 h-4" />, visible: true },
    { id: 'ai_assistant', label: t.navAiAssistant, icon: <Bot className="w-4 h-4" />, visible: true },
    { id: 'universal_translator', label: t.navUniversalTranslator, icon: <Languages className="w-4 h-4" />, visible: true },
    { id: 'global_adaptation', label: t.navGlobalAdaptation, icon: <Globe2 className="w-4 h-4" />, visible: true },
    { id: 'profile', label: t.navProfile, icon: <User className="w-4 h-4" />, visible: true },
    { id: 'settings', label: t.navSettings, icon: <Settings className="w-4 h-4" />, visible: true },
    {
      id: 'governance',
      label: t.navGovernance,
      icon: <Shield className="w-4 h-4" />,
      visible: user.role === 'administrator',
    },
    { id: 'about', label: t.navAbout, icon: <Info className="w-4 h-4" />, visible: true },
  ];

  const currentNavLabel = navItems.find((n) => n.id === activeView)?.label || 'KAWSAY NOVA';

  function navigateTo(view: AppView) {
    setActiveView(view);
    setMobileNavOpen(false);
    setProfileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex">
      {/* Desktop Left Sidebar */}
      <aside className="no-print hidden lg:flex lg:w-[272px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#151F30] border-r border-[#293952]">
        <div className="px-5 py-4 border-b border-[#293952]">
          <BrandMark branding={branding} variant="sidebar" />
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 py-2.5 space-y-0.5 overflow-y-auto">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors whitespace-nowrap text-left ${
                    active
                      ? 'bg-[#1D2A3D] text-[#38BDF8] border border-[#38BDF8]/30'
                      : 'text-[#CBD5E1] hover:text-white hover:bg-[#1D2A3D]/60 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
        </nav>

        <div className="px-4 py-3 border-t border-[#293952] text-[11px] text-[#CBD5E1] space-y-1">
          <div className="font-medium text-white truncate">{branding.organizationName}</div>
          <div className="truncate text-slate-400">{ROLE_LABELS[user.role]}</div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#151F30] border-r border-[#293952] flex flex-col">
            <div className="px-5 py-4 border-b border-[#293952] flex items-center justify-between gap-2">
              <BrandMark branding={branding} variant="sidebar" />
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#1D2A3D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {navItems
                .filter((item) => item.visible)
                .map((item) => {
                  const active = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors text-left ${
                        active
                          ? 'bg-[#1D2A3D] text-[#38BDF8] border border-[#38BDF8]/30'
                          : 'text-[#CBD5E1] hover:text-white hover:bg-[#1D2A3D]/60 border border-transparent'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </nav>
            <div className="p-3 border-t border-[#293952] space-y-2">
              <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white">
                <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
                <select
                  aria-label="Mobile workspace language"
                  value={uiLanguage}
                  onChange={(e) => setUiLanguage(e.target.value as LanguageCode)}
                  className="bg-transparent text-xs text-white focus:outline-none w-full"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code} className="bg-[#151F30] text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-[272px] flex flex-col min-w-0">
        {/* Top Header Bar with Language Switcher, Demo Mode, Sync Badge, and Upper-Right Profile Menu */}
        <header className="no-print sticky top-0 z-30 h-16 bg-[#0B1220]/95 backdrop-blur border-b border-[#293952] px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#151F30] border border-[#293952] text-[#CBD5E1] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-[#CBD5E1] truncate">
              <span className="text-white font-semibold">KAWSAY NOVA</span>
              <span className="mx-2 text-slate-500">/</span>
              <span>{currentNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Offline / Sync Indicator */}
            <button
              type="button"
              onClick={() => openSettingsSection('data')}
              title={isOnline ? t.offlineStatusOnline : t.offlineStatusOffline}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
                isOnline
                  ? 'bg-[#151F30] border-[#293952] text-emerald-300'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{offlineQueueCount > 0 ? `${offlineQueueCount} queued` : isOnline ? 'Online' : 'Offline'}</span>
            </button>

            {/* 15-Step Demo Tour Trigger */}
            <button
              type="button"
              onClick={() => setDemoTourOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151F30] hover:bg-[#1D2A3D] border border-[#38BDF8]/40 text-[11px] font-medium text-[#38BDF8]"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Demo Mode</span>
            </button>

            {/* Quick Global 8-Language Selector */}
            <label className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs text-white">
              <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
              <select
                aria-label="Global workspace language"
                value={uiLanguage}
                onChange={(e) => setUiLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-[#151F30] text-white">
                    {opt.code.toUpperCase()} · {opt.nativeName}
                  </option>
                ))}
              </select>
            </label>

            {/* Upper-Right User Avatar & Profile Menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-[#151F30] hover:bg-[#1D2A3D] border border-[#293952] transition-colors"
              >
                <UserAvatar src={user.avatarUrl} fullName={user.fullName} size="sm" />
                <div className="hidden sm:block text-left max-w-[150px]">
                  <div className="text-xs font-semibold text-white truncate">{user.fullName}</div>
                  <div className="text-[11px] text-[#CBD5E1] truncate">
                    {ROLE_LABELS[user.role]}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#CBD5E1]" />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="User profile menu"
                  className="absolute right-0 mt-2 w-60 rounded-xl bg-[#1D2A3D] border border-[#293952] shadow-xl py-1.5 z-50"
                >
                  <div className="px-4 py-2.5 border-b border-[#293952]">
                    <div className="text-sm font-semibold text-white truncate">{user.fullName}</div>
                    <div className="text-xs font-mono text-[#38BDF8] truncate">
                      @{user.username}
                    </div>
                  </div>

                  <ProfileMenuItem
                    icon={<User className="w-4 h-4" />}
                    label={t.menuMyProfile}
                    onClick={() => navigateTo('profile')}
                  />
                  <ProfileMenuItem
                    icon={<Settings className="w-4 h-4" />}
                    label={t.menuAccountSettings}
                    onClick={() => {
                      openSettingsSection('personal');
                      setProfileMenuOpen(false);
                    }}
                  />
                  <ProfileMenuItem
                    icon={<Globe className="w-4 h-4" />}
                    label={t.menuLanguagePreferences}
                    onClick={() => {
                      openSettingsSection('language');
                      setProfileMenuOpen(false);
                    }}
                  />
                  <ProfileMenuItem
                    icon={<Bell className="w-4 h-4" />}
                    label={t.menuNotifications}
                    onClick={() => {
                      openSettingsSection('notifications');
                      setProfileMenuOpen(false);
                    }}
                  />
                  <ProfileMenuItem
                    icon={<KeyRound className="w-4 h-4" />}
                    label={t.menuSecurity}
                    onClick={() => {
                      openSettingsSection('security');
                      setProfileMenuOpen(false);
                    }}
                  />

                  <div className="my-1 border-t border-[#293952]" />

                  <ProfileMenuItem
                    icon={<LogOut className="w-4 h-4 text-rose-400" />}
                    label={t.menuLogOut}
                    danger
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && <BiomedicalDashboard />}
          {activeView === 'astronaut_profile' && <AstronautMissionProfileView />}
          {activeView === 'biomedical' && <BiomedicalMonitoringView />}
          {activeView === 'precision_core' && <PrecisionCoreView />}
          {activeView === 'accuracy_control' && <AccuracyControlView />}
          {activeView === 'digital_twin' && <DigitalTwinView />}
          {activeView === 'resilience_engine' && <ResilienceEngineView />}
          {activeView === 'mission_simulator' && <MissionSimulatorView />}
          {activeView === 'space_risks' && <SpaceRisksView />}
          {activeView === 'mental_wellbeing' && <MentalWellbeingView />}
          {activeView === 'sleep_activity' && <SleepActivityView />}
          {activeView === 'knowledge_center' && <KnowledgeCenterView />}
          {activeView === 'mission_calendar' && <MissionCalendarView />}
          {activeView === 'health_analytics' && <HealthAnalyticsView />}
          {activeView === 'reports' && <MedicalReportView />}
          {activeView === 'ai_assistant' && <AiAssistantView />}
          {activeView === 'universal_translator' && <UniversalTranslatorView />}
          {activeView === 'global_adaptation' && <GlobalAdaptationView />}
          {activeView === 'profile' && <UserProfileView />}
          {activeView === 'settings' && <SettingsView />}
          {activeView === 'governance' && <RoleGovernanceView />}
          {activeView === 'about' && <AboutView />}
        </main>
      </div>

      <DemoTourModal />
    </div>
  );
}

function ProfileMenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 transition-colors ${
        danger
          ? 'text-rose-300 hover:bg-rose-950/50'
          : 'text-[#CBD5E1] hover:text-white hover:bg-[#151F30]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
