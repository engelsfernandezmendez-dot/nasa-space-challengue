import { useState } from 'react';
import {
  BookmarkPlus,
  Check,
  Copy,
  Languages,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { LanguageCode } from '../types/kawsay';
import { LANGUAGE_OPTIONS, OFFLINE_MEDICAL_GLOSSARY, translateOfflineText } from '../utils/i18n';
import { apiFetch } from '../utils/authToken';

export function FloatingTranslator() {
  const {
    translatorOpen,
    setTranslatorOpen,
    uiLanguage,
    t,
    savedTerms,
    saveTranslatedTerm,
    removeSavedTerm,
  } = useAppContext();

  const [sourceText, setSourceText] = useState('Heart Rate (BPM)');
  const [sourceLang, setSourceLang] = useState<'auto' | LanguageCode>('auto');
  const [targetLang, setTargetLang] = useState<LanguageCode>(uiLanguage === 'en' ? 'es' : uiLanguage);
  const [translatedText, setTranslatedText] = useState('');
  const [translationNote, setTranslationNote] = useState<string | null>(null);
  const [sourceTag, setSourceTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function captureSelectedPageText() {
    const sel = window.getSelection()?.toString().trim();
    if (sel) {
      setSourceText(sel);
    }
    setTranslatorOpen(true);
  }

  async function handleTranslate(overrideText?: string, overrideLang?: LanguageCode) {
    const textToTranslate = (overrideText ?? sourceText).trim();
    const target = overrideLang ?? targetLang;
    if (!textToTranslate) return;

    setLoading(true);
    setTranslationNote(null);

    try {
      const res = await apiFetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLang,
          targetLang: target,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.translatedText || textToTranslate);
        setTranslationNote(data.note || null);
        setSourceTag(data.source || 'offline_glossary');
        return;
      }
    } catch {
      // fall through to offline translation
    } finally {
      setLoading(false);
    }

    const offline = translateOfflineText(textToTranslate, target);
    setTranslatedText(offline.translated);
    setTranslationNote(offline.note || null);
    setSourceTag('offline_cache');
  }

  function handleCopy() {
    if (!translatedText) return;
    navigator.clipboard?.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleSpeak() {
    const text = translatedText || sourceText;
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voiceLangMap: Record<LanguageCode, string> = {
      en: 'en-US',
      es: 'es-PE',
      qu: 'es-PE',
      pt: 'pt-BR',
      fr: 'fr-FR',
      de: 'de-DE',
      ja: 'ja-JP',
      zh: 'zh-CN',
    };
    utter.lang = voiceLangMap[targetLang] || 'en-US';
    window.speechSynthesis.speak(utter);
  }

  return (
    <>
      {/* Persistent Floating Translation Trigger */}
      <button
        type="button"
        onClick={captureSelectedPageText}
        aria-label="Open NOVA Universal Translator"
        className="no-print fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] font-semibold text-xs shadow-lg shadow-sky-950/60 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">NOVA Translator</span>
      </button>

      {/* Translation Drawer */}
      {translatorOpen && (
        <div
          role="dialog"
          aria-label={t.translatorTitle}
          className="no-print fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#151F30] border-l border-[#293952] shadow-2xl flex flex-col"
        >
          <div className="px-5 py-4 border-b border-[#293952] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-[#38BDF8]" />
              <div>
                <h2 className="text-sm font-semibold text-white">{t.translatorTitle}</h2>
                <p className="text-[11px] text-[#CBD5E1]">8-language aerospace & biomedical engine</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close translator"
              onClick={() => setTranslatorOpen(false)}
              className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-[#1D2A3D]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#CBD5E1] mb-1">Source Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value as 'auto' | LanguageCode)}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
                >
                  <option value="auto">Auto-detect</option>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#CBD5E1] mb-1">Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#CBD5E1]">Text, Term, or Formula</label>
                <button
                  type="button"
                  onClick={() => {
                    const sel = window.getSelection()?.toString().trim();
                    if (sel) setSourceText(sel);
                  }}
                  className="text-[11px] text-[#38BDF8] hover:underline"
                >
                  Use Page Selection
                </button>
              </div>
              <textarea
                rows={3}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={t.translatorPlaceholder}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {OFFLINE_MEDICAL_GLOSSARY.map((item) => (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => {
                    setSourceText(item.term);
                    handleTranslate(item.term, targetLang);
                  }}
                  className="px-2.5 py-1 rounded bg-[#1D2A3D] hover:bg-[#0B1220] border border-[#293952] text-[11px] text-[#CBD5E1] hover:text-[#38BDF8]"
                >
                  {item.term}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleTranslate()}
              disabled={loading || !sourceText.trim()}
              className="w-full py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Translating...' : t.translateBtn}</span>
            </button>

            {translatedText && (
              <div className="p-4 rounded-xl bg-[#1D2A3D] border border-[#38BDF8]/40 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#38BDF8] font-mono">
                  <span>{LANGUAGE_OPTIONS.find((l) => l.code === targetLang)?.nativeName}</span>
                  <span>{sourceTag === 'gemini_server' ? 'LIVE GEMINI' : 'OFFLINE GLOSSARY'}</span>
                </div>
                <p className="text-sm font-medium text-white leading-relaxed">{translatedText}</p>
                {translationNote && (
                  <p className="text-[11px] text-amber-300 leading-relaxed">{translationNote}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 rounded bg-[#151F30] border border-[#293952] text-[11px] text-[#CBD5E1] hover:text-white flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : t.copyBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      saveTranslatedTerm({
                        sourceText,
                        translatedText,
                        targetLang,
                        note: translationNote || undefined,
                      })
                    }
                    className="px-2.5 py-1.5 rounded bg-[#151F30] border border-[#293952] text-[11px] text-[#CBD5E1] hover:text-white flex items-center gap-1"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    <span>{t.saveTermBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className="px-2.5 py-1.5 rounded bg-[#151F30] border border-[#293952] text-[11px] text-[#CBD5E1] hover:text-white flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{t.pronounceBtn}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#0B1220] border border-[#293952] text-[11px] text-[#CBD5E1]">
              {t.quechuaVerificationNote}
            </div>

            {savedTerms.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#293952]">
                <div className="text-xs font-semibold text-white">Saved Personal Glossary</div>
                <div className="space-y-1.5">
                  {savedTerms.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-[#0B1220] border border-[#293952] flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="text-slate-400 text-[11px]">{item.sourceText}</div>
                        <div className="text-white font-medium">{item.translatedText}</div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.sourceText}`}
                        onClick={() => removeSavedTerm(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
