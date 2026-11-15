import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BiomedicalMeasurement, ClinicalObservation, LanguageCode } from '../types/kawsay';
import { LANGUAGE_OPTIONS } from '../utils/i18n';
import { ROLE_LABELS } from '../utils/validation';
import { apiFetch } from '../utils/authToken';
import { BrandMark } from './BrandMark';

const REPORT_STRINGS: Record<
  LanguageCode,
  {
    coverBadge: string;
    reportTitle: string;
    measurementsHeading: string;
    observationsHeading: string;
    qualityHeading: string;
    disclaimer: string;
  }
> = {
  en: {
    coverBadge: 'Official Aerospace Biomedical Dossier',
    reportTitle: 'KAWSAY NOVA Clinical & Telemetry Summary Report',
    measurementsHeading: 'Authorized Biomedical Measurements',
    observationsHeading: 'Clinical Observations',
    qualityHeading: 'Data Quality & Methodology Summary',
    disclaimer:
      'Independent educational and biomedical monitoring summary. Not a substitute for formal flight-surgeon diagnosis.',
  },
  es: {
    coverBadge: 'Dossier Biomédico Aeroespacial Oficial',
    reportTitle: 'KAWSAY NOVA — Informe Clínico y de Telemetría',
    measurementsHeading: 'Mediciones Biomédicas Autorizadas',
    observationsHeading: 'Observaciones Clínicas',
    qualityHeading: 'Resumen de Calidad de Datos y Metodología',
    disclaimer:
      'Resumen educativo y de monitoreo biomédico independiente. No sustituye el diagnóstico clínico formal.',
  },
  qu: {
    coverBadge: 'Hanaq Pacha Hampiy Willakuy Qillqa [Verify]',
    reportTitle: 'KAWSAY NOVA — Hampiy hinaspa Telemetría Willakuy [Verify]',
    measurementsHeading: 'Tupusqa Biomédico Willakuykuna [Verify]',
    observationsHeading: 'Hampiqkunap Qawasqan',
    qualityHeading: 'Datos Allin Kaynin hinaspa Método',
    disclaimer: 'Yachaypaq hinaspa qawaypaq willakuyllam; manam hampiqpa cheqaq diagnósticonchu [Verify].',
  },
  pt: {
    coverBadge: 'Dossiê Biomédico Aeroespacial Oficial',
    reportTitle: 'KAWSAY NOVA — Relatório Clínico e de Telemetria',
    measurementsHeading: 'Medições Biomédicas Autorizadas',
    observationsHeading: 'Observações Clínicas',
    qualityHeading: 'Resumo de Qualidade de Dados e Metodologia',
    disclaimer: 'Resumo independente de monitoramento biomédico; não substitui diagnóstico médico formal.',
  },
  fr: {
    coverBadge: 'Dossier Biomédical Aérospatial Officiel',
    reportTitle: 'KAWSAY NOVA — Rapport Clinique et Télémétrique',
    measurementsHeading: 'Mesures Biomédicales Autorisées',
    observationsHeading: 'Observations Cliniques',
    qualityHeading: 'Qualité des Données et Méthodologie',
    disclaimer: 'Synthèse biomédicale indépendante ; ne remplace pas un avis médical formel.',
  },
  de: {
    coverBadge: 'Offizielles Raumfahrt-Biomedizin-Dossier',
    reportTitle: 'KAWSAY NOVA — Klinischer & Telemetriebericht',
    measurementsHeading: 'Autorisierte Biomedizinische Messungen',
    observationsHeading: 'Klinische Beobachtungen',
    qualityHeading: 'Datenqualität & Methodik',
    disclaimer: 'Unabhängiger biomedizinischer Überwachungsbericht; ersetzt keine ärztliche Diagnose.',
  },
  ja: {
    coverBadge: '公式宇宙生体医工学レポート',
    reportTitle: 'KAWSAY NOVA 臨床・テレメトリー要約報告書',
    measurementsHeading: '承認済み生体計測データ',
    observationsHeading: '臨床所見',
    qualityHeading: 'データ品質および計測手法',
    disclaimer: '独立した生体モニタリング要約であり、医師による正式な診断に代わるものではありません。',
  },
  zh: {
    coverBadge: '航天生物医学官方档案报告',
    reportTitle: 'KAWSAY NOVA 临床与遥测综合报告',
    measurementsHeading: '授权生物医学测量记录',
    observationsHeading: '临床医学观察记录',
    qualityHeading: '数据质量与测量方法摘要',
    disclaimer: '独立航天生物医学监测摘要，不能替代航空军医的正式临床诊断。',
  },
};

export function MedicalReportView() {
  const { user, branding, uiLanguage } = useAppContext();
  const [measurements, setMeasurements] = useState<BiomedicalMeasurement[]>([]);
  const [observations, setObservations] = useState<ClinicalObservation[]>([]);
  const [viewMode, setViewMode] = useState<'cover' | 'document'>('document');
  const [reportLang, setReportLang] = useState<LanguageCode>(uiLanguage);
  const [includeAlerts, setIncludeAlerts] = useState(true);
  const [includeMethodology, setIncludeMethodology] = useState(true);

  useEffect(() => {
    apiFetch('/api/biomedical/overview', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.measurements) setMeasurements(d.measurements);
        if (d?.observations) setObservations(d.observations);
      })
      .catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  const rs = REPORT_STRINGS[reportLang] || REPORT_STRINGS.en;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Screen Controls (Hidden when printing PDF) */}
      <div className="no-print bg-[#151F30] border border-[#293952] rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('cover')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'cover'
                  ? 'bg-[#38BDF8] text-[#0B1220]'
                  : 'bg-[#1D2A3D] text-[#CBD5E1] hover:text-white'
              }`}
            >
              Report Cover Page
            </button>
            <button
              type="button"
              onClick={() => setViewMode('document')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'document'
                  ? 'bg-[#38BDF8] text-[#0B1220]'
                  : 'bg-[#1D2A3D] text-[#CBD5E1] hover:text-white'
              }`}
            >
              Full Printable Clinical Report
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF Report
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#293952] text-xs">
          <label className="flex items-center gap-2 text-[#CBD5E1]">
            <span>Report Language:</span>
            <select
              aria-label="Medical report language"
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value as LanguageCode)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[#CBD5E1] cursor-pointer">
            <input
              type="checkbox"
              checked={includeMethodology}
              onChange={(e) => setIncludeMethodology(e.target.checked)}
              className="accent-[#38BDF8]"
            />
            <span>Include Data Quality & Methodology</span>
          </label>
          <label className="flex items-center gap-1.5 text-[#CBD5E1] cursor-pointer">
            <input
              type="checkbox"
              checked={includeAlerts}
              onChange={(e) => setIncludeAlerts(e.target.checked)}
              className="accent-[#38BDF8]"
            />
            <span>Include Clinical Observations</span>
          </label>
        </div>
      </div>

      {/* Report Cover Page OR Full Printable PDF Header + Document */}
      <div className="print-only-light bg-white text-[#0B1220] border border-slate-300 rounded-xl p-8 sm:p-10 space-y-8 shadow-sm">
        {/* PDF Report Header synchronized with branding.reportLogoStoragePath */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <BrandMark branding={branding} variant="report" useReportLogo lightSurface />
          <div className="text-left sm:text-right text-xs text-slate-600 print-muted space-y-0.5 font-mono tabular-nums">
            <div className="font-semibold text-slate-900">{branding.organizationName}</div>
            <div>Document Ref: KN-MED-{new Date().toISOString().slice(0, 10)}</div>
            <div>Logo Version: v{branding.logoVersion} · Lang: {reportLang.toUpperCase()}</div>
          </div>
        </header>

        {viewMode === 'cover' ? (
          <div className="py-12 space-y-8">
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-sky-700">
                {rs.coverBadge}
              </div>
              <h1 className="text-3xl font-bold text-[#0B1220]">{rs.reportTitle}</h1>
              <p className="text-sm text-slate-600 print-muted max-w-2xl">
                Prepared under {branding.organizationName} clinical telemetry protocols. All
                biomedical records strictly reflect authenticated role authorization.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200 text-sm">
              <div>
                <div className="text-xs text-slate-500">Prepared For / Operator</div>
                <div className="font-semibold text-[#0B1220]">{user.fullName}</div>
                <div className="text-xs text-slate-600">
                  @{user.username} · {ROLE_LABELS[user.role]}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Contact & Institutional Desk</div>
                <div className="font-semibold text-[#0B1220]">{branding.contactEmail}</div>
                <div className="text-xs text-slate-600">{branding.contactPhone}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 print-muted">
              <span>
                Prepared by: <strong className="text-slate-900">{user.fullName}</strong> (
                {ROLE_LABELS[user.role]})
              </span>
              <span className="font-mono tabular-nums">
                Generated: {new Date().toLocaleString()}
              </span>
            </div>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#0B1220] border-b border-slate-200 pb-1.5">
                {rs.measurementsHeading}
              </h2>
              {measurements.length === 0 ? (
                <p className="text-xs text-slate-600">
                  No individual astronaut measurements attached for this role view.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-600">
                        <th className="py-2 pr-3">Crew Member</th>
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3 text-right">HR</th>
                        <th className="py-2 pr-3 text-right">BP / MAP</th>
                        <th className="py-2 pr-3 text-right">SpO2</th>
                        <th className="py-2 pr-3 text-right">Quality</th>
                        <th className="py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                      {measurements.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2 pr-3 font-sans font-medium text-slate-900">
                            {m.astronautName}
                          </td>
                          <td className="py-2 pr-3 text-slate-600">
                            {new Date(m.recordedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-3 text-right">{m.heartRateBpm} bpm</td>
                          <td className="py-2 pr-3 text-right">
                            {m.systolicMmHg}/{m.diastolicMmHg} ({m.mapMmHg})
                          </td>
                          <td className="py-2 pr-3 text-right">{m.spo2Percent}%</td>
                          <td className="py-2 pr-3 text-right text-[10px]">{m.dataQuality}</td>
                          <td className="py-2 text-right capitalize">{m.assessmentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {includeAlerts && (
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-[#0B1220] border-b border-slate-200 pb-1.5">
                  {rs.observationsHeading}
                </h2>
                {observations.length === 0 ? (
                  <p className="text-xs text-slate-600">No clinical observations recorded.</p>
                ) : (
                  <div className="space-y-2.5">
                    {observations.map((obs) => (
                      <div key={obs.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>
                            {obs.astronautName} · Reviewed by {obs.specialistName}
                          </span>
                          <span className="font-mono uppercase">{obs.severity}</span>
                        </div>
                        <p className="text-xs text-slate-900">{obs.summary}</p>
                        <p className="text-xs text-sky-800 mt-1">
                          Recommendation: {obs.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {includeMethodology && (
              <section className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <h3 className="font-semibold text-slate-900">{rs.qualityHeading}</h3>
                <p>
                  ECG HR = 60 / mean(RR_seconds); HRV RMSSD = sqrt(mean((NN_i+1 - NN_i)^2)); MAP ≈ DBP + (SBP - DBP) / 3.
                </p>
                <p className="text-amber-800">{rs.disclaimer}</p>
              </section>
            )}
          </div>
        )}

        <footer className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 print-muted">
          <span>{branding.institutionalFooter}</span>
          <span>
            {branding.contactEmail} · {branding.contactPhone}
          </span>
        </footer>
      </div>
    </div>
  );
}
