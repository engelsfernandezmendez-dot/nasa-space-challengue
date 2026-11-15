import { ArrowRight, Globe, Languages, ShieldAlert, Sparkles } from 'lucide-react';
import orbitalEarthBackdrop from '../assets/images/landing_orbital_earth_1794710480366.jpg';
import { useAppContext } from '../context/AppContext';
import type { LanguageCode } from '../types/kawsay';
import { LANGUAGE_OPTIONS } from '../utils/i18n';
import { BrandMark } from './BrandMark';

export function LandingPage() {
  const { branding, t, uiLanguage, setUiLanguage, setShowLanding, setTranslatorOpen } =
    useAppContext();

  return (
    <div className="min-h-screen bg-[#0B1220] text-white relative overflow-hidden flex flex-col">
      {/* Orbital Cupola Background Photograph + Atmospheric Dark Scrim */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src={orbitalEarthBackdrop}
          alt="Earth horizon viewed from an orbital observation cupola"
          className="w-full h-full object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1220]/90 via-[#0B1220]/75 to-[#0B1220]" />
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 700"
          className="absolute inset-0 w-full h-full opacity-25"
        >
          <circle cx="960" cy="140" r="240" fill="none" stroke="#38BDF8" strokeDasharray="6 10" />
          <circle cx="960" cy="140" r="320" fill="none" stroke="#60A5FA" strokeDasharray="3 12" />
          <circle cx="140" cy="540" r="180" fill="none" stroke="#38BDF8" strokeDasharray="4 8" />
        </svg>
      </div>

      {/* Top Navigation & Global Language Selector */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <BrandMark branding={branding} variant="sidebar" />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setTranslatorOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#151F30]/90 hover:bg-[#1D2A3D] border border-[#293952] text-xs font-medium text-[#CBD5E1] hover:text-white flex items-center gap-2 transition-colors"
          >
            <Languages className="w-4 h-4 text-[#38BDF8]" />
            <span>{t.navUniversalTranslator}</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151F30]/90 border border-[#293952]">
            <Globe className="w-4 h-4 text-[#38BDF8]" />
            <span className="sr-only">Select Interface Language</span>
            <select
              aria-label="Global interface language"
              value={uiLanguage}
              onChange={(e) => setUiLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-[#151F30] text-white">
                  {opt.label} ({opt.nativeName})
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {/* Main Hero Frame */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 py-8 sm:py-12 flex flex-col justify-center gap-8">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151F30]/90 border border-[#38BDF8]/40 text-xs font-mono tracking-wider text-[#38BDF8]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AYACUCHO, PERU · ORBITAL · LUNAR · MARS</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white">
              {branding.applicationName}
            </h1>
            <p className="text-sm sm:text-base font-mono tracking-widest text-[#38BDF8]">
              {t.appSubtitle}
            </p>
          </div>

          <div className="space-y-1.5 border-l-2 border-[#38BDF8] pl-4">
            <p className="text-lg sm:text-2xl font-semibold tracking-wide text-white">{t.slogan}</p>
            <p className="text-base sm:text-lg font-medium text-[#60A5FA]">{t.vision}</p>
          </div>

          <p className="text-base text-[#CBD5E1] leading-relaxed max-w-2xl">
            {t.landingSummary}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{t.landingOrigin}</p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setShowLanding(false)}
              className="px-7 py-3.5 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm sm:text-base font-bold tracking-wide flex items-center gap-2.5 shadow-lg shadow-sky-500/20 transition-colors cursor-pointer"
            >
              <span>{t.enterSystem}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Capabilities Strip & Independent Non-NASA Scientific Framing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-[#151F30]/85 backdrop-blur border border-[#293952] rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-mono text-[#38BDF8]">NOVA PRECISION CORE</div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Transparent biomedical equations (ECG HR, RMSSD, MAP, MARD) with formulas,
              assumptions, limitations, and peer-reviewed references.
            </p>
          </div>
          <div className="bg-[#151F30]/85 backdrop-blur border border-[#293952] rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-mono text-[#38BDF8]">DIGITAL TWIN & SIMULATOR</div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Interactive 6-system anatomical explorer, multi-indicator resilience mapping, and
              what-if mission simulation separated from real measurements.
            </p>
          </div>
          <div className="bg-[#151F30]/85 backdrop-blur border border-[#293952] rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-mono text-[#38BDF8]">FROM SPACE TO THE WORLD</div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Multilingual access across 8 languages including Ayacucho Quechua, offline cache,
              and adaptation paths for remote rural and high-altitude communities.
            </p>
          </div>
        </div>
      </main>

      {/* Independent Project Disclaimer Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 sm:pr-44 border-t border-[#293952]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#CBD5E1]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#FACC15] shrink-0" />
          <span>{t.landingDisclaimer}</span>
        </div>
        <span className="font-mono text-slate-400">KAWSAY NOVA · Ayacucho, Peru</span>
      </footer>
    </div>
  );
}
