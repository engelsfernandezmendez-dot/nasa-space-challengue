import React, { useEffect, useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Globe2,
  Languages,
  MapPin,
  Send,
  ShieldAlert,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { LanguageCode } from '../types/kawsay';
import { LANGUAGE_OPTIONS, OFFLINE_MEDICAL_GLOSSARY, translateOfflineText } from '../utils/i18n';
import { apiFetch } from '../utils/authToken';

export function AiAssistantView() {
  const { user, uiLanguage, t } = useAppContext();
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'error'; text: string }>>([
    {
      role: 'assistant',
      text: 'Welcome to NOVA AI Assistant. Ask about biomedical formulas (ECG HR, RMSSD, MAP, MARD), NASA HRP space hazards, or data quality guidelines. Note: I never provide medical diagnoses or fabricate measurements.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/system/capabilities')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setGeminiConfigured(Boolean(d.geminiConfigured));
      })
      .catch(() => setGeminiConfigured(false));
  }, []);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          question: q,
          language: uiLanguage,
          contextSummary: `Role: ${user?.role || 'operator'}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'error', text: data.error || 'NOVA AI server inference unavailable.' },
        ]);
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'error', text: 'Unable to reach /api/ai/assistant endpoint.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-[#293952] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t.navAiAssistant}</h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Server-side educational biomedical & aerospace guidance powered by @google/genai when configured.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-lg text-xs font-mono border ${
            geminiConfigured
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}
        >
          {geminiConfigured ? 'GEMINI SERVER READY' : 'OFFLINE / NO KEY CONFIGURED'}
        </span>
      </div>

      {geminiConfigured === false && (
        <div className="p-4 rounded-xl bg-[#151F30] border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
          <span>
            Live AI inference requires a valid server-side <span className="font-mono">GEMINI_API_KEY</span>.
            KAWSAY NOVA does not simulate unconfigured AI responses. All mathematical calculators,
            glossary lookup, and Knowledge Center modules remain 100% operational offline.
          </span>
        </div>
      )}

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-4">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-white ml-8'
                  : m.role === 'error'
                    ? 'bg-rose-950/50 border border-rose-500/40 text-rose-200 mr-8'
                    : 'bg-[#151F30] border border-[#293952] text-[#CBD5E1] mr-8'
              }`}
            >
              <div className="font-mono text-[10px] text-[#38BDF8] mb-1 uppercase flex items-center gap-1.5">
                {m.role === 'assistant' && <Bot className="w-3.5 h-3.5" />}
                <span>{m.role}</span>
              </div>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask how RMSSD works, why CO2 shifts breathing, or how Ayacucho adaptation works..."
            className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Sending...' : 'Ask'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function UniversalTranslatorView() {
  const { t, saveTranslatedTerm, savedTerms } = useAppContext();
  const [sourceText, setSourceText] = useState(
    'Heart Rate (BPM): HR = 60 / mean(RR_seconds). Monitor SpO2 (%) and Core Temp (°C) daily.'
  );
  const [targetLang, setTargetLang] = useState<LanguageCode>('qu');
  const [translated, setTranslated] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runTranslation(textOverride?: string) {
    const input = (textOverride ?? sourceText).trim();
    if (!input) return;
    setLoading(true);
    setNote(null);
    try {
      const res = await apiFetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, sourceLang: 'auto', targetLang }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslated(data.translatedText || input);
        setNote(data.note || null);
        return;
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
    const off = translateOfflineText(input, targetLang);
    setTranslated(off.translated);
    setNote(off.note || null);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navUniversalTranslator}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Translate terminology, interface blocks, and medical explanations across 8 languages while preserving units and scientific formulas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#38BDF8]" />
              <span>Translator Workbench</span>
            </div>
            <select
              aria-label="Target translation language"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="px-3 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label} ({opt.nativeName})
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={4}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
          />

          <button
            type="button"
            onClick={() => runTranslation()}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Translating...' : t.translateBtn}</span>
          </button>

          {translated && (
            <div className="p-4 rounded-xl bg-[#151F30] border border-[#38BDF8]/40 space-y-3">
              <p className="text-sm text-white">{translated}</p>
              {note && <p className="text-xs text-amber-300">{note}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(translated);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="px-3 py-1.5 rounded bg-[#0B1220] border border-[#293952] text-xs text-[#CBD5E1] flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : t.copyBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    saveTranslatedTerm({
                      sourceText,
                      translatedText: translated,
                      targetLang,
                      note: note || undefined,
                    })
                  }
                  className="px-3 py-1.5 rounded bg-[#0B1220] border border-[#293952] text-xs text-[#CBD5E1]"
                >
                  {t.saveTermBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.speak(new SpeechSynthesisUtterance(translated));
                    }
                  }}
                  className="px-3 py-1.5 rounded bg-[#0B1220] border border-[#293952] text-xs text-[#CBD5E1] flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t.pronounceBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-[#151F30] border border-[#293952] rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Offline Aerospace & Clinical Glossary</h2>
          <div className="space-y-2.5">
            {OFFLINE_MEDICAL_GLOSSARY.map((g) => (
              <button
                key={g.term}
                type="button"
                onClick={() => {
                  setSourceText(g.term);
                  runTranslation(g.term);
                }}
                className="w-full text-left p-3 rounded-lg bg-[#1D2A3D] border border-[#293952] hover:border-[#38BDF8] space-y-1"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">{g.term}</span>
                  <span className="text-[#38BDF8] font-mono">{g.translations[targetLang]}</span>
                </div>
                <p className="text-[11px] text-[#CBD5E1]">{g.explanation}</p>
              </button>
            ))}
          </div>
          {savedTerms.length > 0 && (
            <div className="text-[11px] text-emerald-300 font-mono">
              {savedTerms.length} term(s) saved in your personal glossary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const EARTH_ADAPTATION_CASES = [
  {
    id: 'ayacucho',
    region: 'Ayacucho & Andean Highlands (Peru)',
    x: 175,
    y: 162,
    useCase: 'High-altitude hypoxia & maternal/community screening (2,746m–4,200m)',
    impact:
      'Calibrated SpO2 + respiratory tracking combined with Ayacucho Quechua voice/text terminology for rural health posts without continuous connectivity.',
  },
  {
    id: 'remote',
    region: 'Remote Amazon & Polar Stations',
    x: 205,
    y: 150,
    useCase: 'Offline triage & asynchronous clinical review',
    impact:
      'Local SQLite/cache persistence plus conflict-safe telemetry synchronization mirrors deep-space communication delay design.',
  },
  {
    id: 'emergency',
    region: 'Disaster Response & Field Clinics',
    x: 280,
    y: 95,
    useCase: 'Rapid physiological quality control',
    impact:
      'NOVA ACCURACY CONTROL immediately flags motion-artifact ECG or pulse oximetry readings before triage handoff.',
  },
  {
    id: 'elderly',
    region: 'Global Aging & Chronic Monitoring',
    x: 410,
    y: 95,
    useCase: 'Multilingual home-care telemetry & PDF summaries',
    impact:
      'Multilingual PDF clinical dossiers enable cross-border caregiver understanding across 8 languages.',
  },
];

export function GlobalAdaptationView() {
  const { t } = useAppContext();
  const [selectedRegion, setSelectedRegion] = useState(EARTH_ADAPTATION_CASES[0]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navGlobalAdaptation}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          {t.vision} — Translating aerospace telemetry into accessible, offline-ready healthcare innovation starting from Ayacucho, Peru.
        </p>
      </div>

      {/* Interactive SVG Global Adaptation Map */}
      <div className="bg-[#151F30] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Globe2 className="w-4 h-4 text-[#38BDF8]" />
            <span>Global Adaptation Network · Origin: Ayacucho, Peru</span>
          </div>
          <span className="text-xs font-mono text-[#38BDF8]">13°09′S 74°13′W</span>
        </div>

        <svg
          viewBox="0 0 600 260"
          className="w-full max-h-72 bg-[#0B1220] rounded-xl border border-[#293952]"
          role="img"
          aria-label="Global Earth Adaptation Map highlighting Ayacucho, Peru"
        >
          {/* Simplified Continental Silhouettes */}
          <path d="M90,45 L175,40 L195,95 L155,115 L120,100 Z" fill="#1D2A3D" stroke="#293952" />
          <path d="M155,120 L215,130 L225,175 L185,235 L165,205 Z" fill="#1D2A3D" stroke="#293952" />
          <path d="M265,45 L335,45 L340,85 L270,90 Z" fill="#1D2A3D" stroke="#293952" />
          <path d="M275,95 L350,100 L345,190 L295,195 L275,140 Z" fill="#1D2A3D" stroke="#293952" />
          <path d="M345,45 L505,50 L515,125 L415,135 L350,100 Z" fill="#1D2A3D" stroke="#293952" />
          <path d="M450,165 L525,165 L525,215 L455,215 Z" fill="#1D2A3D" stroke="#293952" />

          {/* Connection Arcs from Ayacucho */}
          {EARTH_ADAPTATION_CASES.slice(1).map((reg) => (
            <path
              key={reg.id}
              d={`M 175 162 Q ${(175 + reg.x) / 2} 60 ${reg.x} ${reg.y}`}
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.65"
            />
          ))}

          {EARTH_ADAPTATION_CASES.map((reg) => {
            const active = reg.id === selectedRegion.id;
            const isOrigin = reg.id === 'ayacucho';
            return (
              <g key={reg.id} onClick={() => setSelectedRegion(reg)} className="cursor-pointer">
                <circle
                  cx={reg.x}
                  cy={reg.y}
                  r={active ? 11 : 7}
                  fill={isOrigin ? '#FACC15' : '#38BDF8'}
                  fillOpacity={0.3}
                  stroke={isOrigin ? '#FACC15' : '#38BDF8'}
                  strokeWidth="2"
                />
                <circle cx={reg.x} cy={reg.y} r="3.5" fill={isOrigin ? '#FACC15' : '#38BDF8'} />
              </g>
            );
          })}
        </svg>

        <div className="p-4 rounded-xl bg-[#1D2A3D] border border-[#38BDF8]/40 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <MapPin className="w-4 h-4 text-[#FACC15]" />
            <span>{selectedRegion.region}</span>
          </div>
          <div className="text-xs font-mono text-[#38BDF8]">{selectedRegion.useCase}</div>
          <p className="text-xs text-[#CBD5E1] leading-relaxed">{selectedRegion.impact}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EARTH_ADAPTATION_CASES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedRegion(c)}
            className={`text-left p-5 rounded-xl border transition-colors ${
              selectedRegion.id === c.id
                ? 'bg-[#1D2A3D] border-[#38BDF8]'
                : 'bg-[#151F30] border-[#293952] hover:border-[#60A5FA]/40'
            }`}
          >
            <div className="text-sm font-semibold text-white">{c.region}</div>
            <div className="text-xs text-[#38BDF8] mt-0.5">{c.useCase}</div>
            <p className="text-xs text-[#CBD5E1] mt-2 leading-relaxed">{c.impact}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
