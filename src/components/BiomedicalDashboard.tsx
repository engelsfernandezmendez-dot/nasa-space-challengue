import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardPlus,
  Cpu,
  FileText,
  FlaskConical,
  Globe2,
  HeartPulse,
  Info,
  Languages,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type {
  AggregatedResearchCohort,
  BiomedicalMeasurement,
  ClinicalObservation,
  MedicalAlert,
  UserAccount,
  WellnessResource,
} from '../types/kawsay';
import { ROLE_LABELS } from '../utils/validation';
import { apiFetch } from '../utils/authToken';
import { BrandMark } from './BrandMark';
import { UserAvatar } from './UserAvatar';

interface OverviewPayload {
  role: string;
  measurements?: BiomedicalMeasurement[];
  observations?: ClinicalObservation[];
  alerts?: MedicalAlert[];
  astronauts?: UserAccount[];
  cohorts?: AggregatedResearchCohort[];
  wellnessResources?: WellnessResource[];
  systemStats?: { totalUsers: number; totalMeasurements: number };
}

export function BiomedicalDashboard() {
  const { user, branding, setActiveView, openSettingsSection } = useAppContext();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview(silent = false) {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await apiFetch('/api/biomedical/overview', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        setError('Unable to load authorized biomedical workspace.');
        return;
      }
      setData(await res.json());
    } catch {
      setError('Connection error loading biomedical console.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadOverview(false);
  }, [user?.id, user?.role]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Synchronized Brand & Role Workspace Header */}
      <div className="bg-[#151F30] border border-[#293952] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0">
            <BrandMark branding={branding} variant="sidebar" />
          </div>
          <div className="hidden sm:block h-8 w-px bg-[#293952]" />
          <div className="min-w-0">
            <div className="text-xs text-[#CBD5E1]">Authorized Role Console</div>
            <div className="text-sm font-semibold text-[#38BDF8] truncate">
              {ROLE_LABELS[user.role]} · {user.fullName}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {(user.role === 'medical_specialist' || user.role === 'astronaut') && (
            <button
              type="button"
              onClick={() => setActiveView('reports')}
              className="px-3.5 py-2 rounded-lg bg-[#1D2A3D] hover:bg-[#0B1220] border border-[#293952] text-xs font-medium text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
              Medical Reports & PDF
            </button>
          )}
          {user.role === 'administrator' && (
            <button
              type="button"
              onClick={() => openSettingsSection('branding')}
              className="px-3.5 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Manage Application Branding
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl bg-[#1D2A3D] border border-[#293952] animate-pulse"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {user.role === 'astronaut' && (
            <AstronautConsole data={data} onRefresh={() => loadOverview(true)} />
          )}
          {user.role === 'medical_specialist' && (
            <MedicalSpecialistConsole data={data} onRefresh={() => loadOverview(true)} />
          )}
          {user.role === 'scientific_researcher' && <ResearcherConsole data={data} />}
          {user.role === 'general_user' && <GeneralUserConsole data={data} />}
          {user.role === 'administrator' && (
            <AdministratorConsole
              data={data}
              onAckAlert={async (id) => {
                await apiFetch(`/api/biomedical/alerts/${id}/acknowledge`, {
                  method: 'POST',
                  credentials: 'include',
                });
                loadOverview(true);
              }}
            />
          )}

          {/* Section 5 Cross-Module Quick Navigation Cards */}
          <MissionControlQuickGrid onNavigate={setActiveView} />
        </>
      )}
    </div>
  );
}

function AstronautConsole({
  data,
  onRefresh,
}: {
  data: OverviewPayload;
  onRefresh: () => void;
}) {
  const measurements = data.measurements || [];
  const observations = data.observations || [];
  const latest = measurements[0];

  const [hr, setHr] = useState('68');
  const [sys, setSys] = useState('118');
  const [dia, setDia] = useState('76');
  const [spo2, setSpo2] = useState('98.2');
  const [temp, setTemp] = useState('36.8');
  const [cortisol, setCortisol] = useState('12.5');
  const [bone, setBone] = useState('1.03');
  const [rad, setRad] = useState('0.45');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogMeasurement(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/biomedical/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          heartRateBpm: Number(hr),
          systolicMmHg: Number(sys),
          diastolicMmHg: Number(dia),
          spo2Percent: Number(spo2),
          coreTempC: Number(temp),
          cortisolUgDl: Number(cortisol),
          boneDensityIndex: Number(bone),
          radiationDoseMsv: Number(rad),
          notes,
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(resData.error || 'Unable to record biomedical telemetry measurement.');
        return;
      }
      setNotes('');
      setMsg('Biomedical telemetry measurement recorded.');
      onRefresh();
    } catch {
      setErrorMsg('Connection error while recording biomedical measurement.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="RESTING HEART RATE"
          value={latest ? `${latest.heartRateBpm.toFixed(0)}` : '--'}
          unit="bpm"
          sub={latest ? `Status: ${latest.assessmentStatus}` : 'No samples'}
        />
        <MetricCard
          label="BLOOD OXYGEN (SpO2)"
          value={latest ? `${latest.spo2Percent.toFixed(1)}` : '--'}
          unit="%"
          sub={latest ? `BP ${latest.systolicMmHg}/${latest.diastolicMmHg} mmHg` : '--'}
        />
        <MetricCard
          label="SALIVARY CORTISOL"
          value={latest ? `${latest.cortisolUgDl.toFixed(1)}` : '--'}
          unit="ug/dL"
          sub="Reference < 18.0 ug/dL"
        />
        <MetricCard
          label="CUMULATIVE RADIATION"
          value={latest ? `${latest.radiationDoseMsv.toFixed(2)}` : '--'}
          unit="mSv"
          sub={latest ? `Bone Index ${latest.boneDensityIndex.toFixed(2)}` : '--'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Trend Chart + History */}
        <div className="lg:col-span-7 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Personal Health Trends</h2>
              <p className="text-xs text-[#CBD5E1]">
                Heart rate (cyan) and SpO2 saturation (soft blue) across recent telemetry logs
              </p>
            </div>
            <HeartPulse className="w-5 h-5 text-[#38BDF8]" />
          </div>

          <TelemetryTrendChart measurements={[...measurements].reverse()} />

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#293952] text-[#CBD5E1]">
                  <th className="py-2 pr-3 font-medium">Timestamp</th>
                  <th className="py-2 pr-3 font-medium text-right">HR</th>
                  <th className="py-2 pr-3 font-medium text-right">SpO2</th>
                  <th className="py-2 pr-3 font-medium text-right">Cortisol</th>
                  <th className="py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#293952]/60 font-mono tabular-nums">
                {measurements.slice(0, 6).map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-3 text-[#CBD5E1]">
                      {new Date(m.recordedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3 text-right text-white">{m.heartRateBpm} bpm</td>
                    <td className="py-2 pr-3 text-right text-white">{m.spo2Percent}%</td>
                    <td className="py-2 pr-3 text-right text-white">{m.cortisolUgDl}</td>
                    <td
                      className={`py-2 text-right capitalize ${
                        m.assessmentStatus === 'nominal'
                          ? 'text-emerald-400'
                          : m.assessmentStatus === 'elevated'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                      }`}
                    >
                      {m.assessmentStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Register Biomedical Measurement Form */}
        <div className="lg:col-span-5 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardPlus className="w-5 h-5 text-[#38BDF8]" />
            <h2 className="text-lg font-semibold text-white">Register Measurement</h2>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200"
            >
              {errorMsg}
            </div>
          )}

          {msg && (
            <div
              role="status"
              className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200"
            >
              {msg}
            </div>
          )}

          <form onSubmit={handleLogMeasurement} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <NumericField label="Heart Rate (bpm)" value={hr} onChange={setHr} />
              <NumericField label="SpO2 (%)" value={spo2} onChange={setSpo2} step="0.1" />
              <NumericField label="Systolic (mmHg)" value={sys} onChange={setSys} />
              <NumericField label="Diastolic (mmHg)" value={dia} onChange={setDia} />
              <NumericField label="Core Temp (°C)" value={temp} onChange={setTemp} step="0.1" />
              <NumericField
                label="Cortisol (ug/dL)"
                value={cortisol}
                onChange={setCortisol}
                step="0.1"
              />
              <NumericField label="Bone Index" value={bone} onChange={setBone} step="0.01" />
              <NumericField label="Radiation (mSv)" value={rad} onChange={setRad} step="0.01" />
            </div>
            <div>
              <label className="block text-xs text-[#CBD5E1] mb-1">Assessment Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Post-EVA or ergometer session notes"
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? 'Logging Telemetry...' : 'Save Biomedical Measurement'}
            </button>
          </form>
        </div>
      </div>

      {/* Flight Surgeon Observations */}
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-3">
        <h3 className="text-base font-semibold text-white">Authorized Clinical Observations</h3>
        {observations.length === 0 ? (
          <p className="text-xs text-[#CBD5E1]">No clinical observations logged for your profile.</p>
        ) : (
          <div className="space-y-3">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className="p-4 rounded-lg bg-[#151F30] border border-[#293952] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-[#CBD5E1]">
                  <span className="font-medium text-white">{obs.specialistName}</span>
                  <span className="font-mono tabular-nums">
                    {new Date(obs.createdAt).toLocaleDateString()} · {obs.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-white">{obs.summary}</p>
                <p className="text-xs text-[#38BDF8]">Recommendation: {obs.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MedicalSpecialistConsole({
  data,
  onRefresh,
}: {
  data: OverviewPayload;
  onRefresh: () => void;
}) {
  const astronauts = data.astronauts || [];
  const measurements = data.measurements || [];
  const alerts = data.alerts || [];
  const observations = data.observations || [];

  const [selectedAstro, setSelectedAstro] = useState(astronauts[0]?.id || '');
  const [severity, setSeverity] = useState<'nominal' | 'advisory' | 'critical'>('nominal');
  const [summary, setSummary] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAddObservation(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErrorMsg(null);
    if (!selectedAstro || !summary.trim() || !recommendation.trim()) {
      setErrorMsg('Please select an astronaut and provide both a clinical summary and recommendation.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/biomedical/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          astronautUserId: selectedAstro,
          severity,
          summary: summary.trim(),
          recommendation: recommendation.trim(),
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(resData.error || 'Unable to record clinical observation.');
        return;
      }
      setSummary('');
      setRecommendation('');
      setMsg('Clinical observation added to astronaut record.');
      onRefresh();
    } catch {
      setErrorMsg('Connection error recording clinical observation.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAckAlert(id: number) {
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/biomedical/alerts/${id}/acknowledge`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        setErrorMsg('Unable to acknowledge medical alert.');
        return;
      }
      onRefresh();
    } catch {
      setErrorMsg('Connection error acknowledging medical alert.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="AUTHORIZED ASTRONAUTS"
          value={String(astronauts.length)}
          unit="crew"
          sub="Active flight status"
        />
        <MetricCard
          label="OPEN MEDICAL ALERTS"
          value={String(alerts.filter((a) => !a.acknowledged).length)}
          unit="alerts"
          sub="Requires clinical review"
        />
        <MetricCard
          label="LOGGED TELEMETRY SAMPLES"
          value={String(measurements.length)}
          unit="records"
          sub="Longitudinal crew pool"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Authorized Astronaut Roster & Measurements */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Authorized Astronaut Records</h2>
            <div className="space-y-3">
              {astronauts.map((astro) => (
                <div
                  key={astro.id}
                  className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar src={astro.avatarUrl} fullName={astro.fullName} size="md" />
                    <div>
                      <div className="text-sm font-medium text-white">{astro.fullName}</div>
                      <div className="text-xs text-[#CBD5E1]">
                        @{astro.username} · {astro.city}, {astro.country}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Cleared</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Active Medical Alerts</h3>
            <div className="space-y-2.5">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white flex items-center gap-2 flex-wrap">
                      {al.severity === 'critical' ? (
                        <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                      ) : al.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-[#FACC15]" />
                      ) : al.severity === 'normal' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                      ) : (
                        <Info className="w-4 h-4 text-[#38BDF8]" />
                      )}
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0B1220] border border-[#293952] text-[#CBD5E1]">
                        {al.severity}
                      </span>
                      <span>
                        {al.astronautName} · {al.metric}:{' '}
                        <span className="font-mono text-[#38BDF8]">{al.observedValue}</span>
                      </span>
                    </div>
                    <div className="text-xs text-[#CBD5E1]">
                      {al.explanation || `Threshold ${al.threshold}`} ·{' '}
                      <span className="font-mono">{new Date(al.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {al.acknowledged ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAckAlert(al.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#38BDF8] text-[#0B1220] text-xs font-semibold"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clinical Observation Entry */}
        <div className="lg:col-span-5 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Add Clinical Observation</h2>
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200"
            >
              {errorMsg}
            </div>
          )}
          {msg && (
            <div
              role="status"
              className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200"
            >
              {msg}
            </div>
          )}
          <form onSubmit={handleAddObservation} className="space-y-3.5">
            <div>
              <label className="block text-xs text-[#CBD5E1] mb-1">Astronaut</label>
              <select
                value={selectedAstro}
                onChange={(e) => setSelectedAstro(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm"
              >
                {astronauts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} (@{a.username})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#CBD5E1] mb-1">Clinical Severity</label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as 'nominal' | 'advisory' | 'critical')
                }
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm"
              >
                <option value="nominal">Nominal</option>
                <option value="advisory">Advisory</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#CBD5E1] mb-1">Clinical Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Objective biomedical analysis..."
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#CBD5E1] mb-1">Medical Recommendation</label>
              <textarea
                rows={2}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="Countermeasure protocol or follow-up timing..."
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? 'Recording Observation...' : 'Record Clinical Observation'}
            </button>
          </form>

          <div className="pt-3 border-t border-[#293952] space-y-2">
            <div className="text-xs font-medium text-[#CBD5E1]">Recent Observations</div>
            {observations.slice(0, 3).map((o) => (
              <div key={o.id} className="text-xs text-[#CBD5E1] p-2.5 rounded bg-[#151F30]">
                <span className="text-white font-medium">{o.astronautName}:</span> {o.summary}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResearcherConsole({ data }: { data: OverviewPayload }) {
  const cohorts = data.cohorts || [];
  const [spo2Input, setSpo2Input] = useState(96.5);
  const [cortisolInput, setCortisolInput] = useState(15.2);
  const [daysInMicroG, setDaysInMicroG] = useState(45);

  const stressIndex = Number(
    (((100 - spo2Input) * 1.45 + cortisolInput * 0.35) * (1 + daysInMicroG / 365)).toFixed(2)
  );
  const boneRetentionPct = Number(Math.max(82, 100 - daysInMicroG * 0.045).toFixed(2));

  return (
    <div className="space-y-6">
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Anonymized Scientific Research Cohorts
            </h2>
            <p className="text-xs text-[#CBD5E1]">
              All personal astronaut identifiers are stripped at the database layer. Only consented
              aggregated metrics are exposed.
            </p>
          </div>
          <FlaskConical className="w-5 h-5 text-[#38BDF8]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#293952] text-[#CBD5E1]">
                <th className="py-2.5 pr-4 font-medium">Cohort ID</th>
                <th className="py-2.5 pr-4 font-medium">Mission Phase</th>
                <th className="py-2.5 pr-4 font-medium text-right">Samples</th>
                <th className="py-2.5 pr-4 font-medium text-right">Mean HR</th>
                <th className="py-2.5 pr-4 font-medium text-right">Mean SpO2</th>
                <th className="py-2.5 pr-4 font-medium text-right">Mean Cortisol</th>
                <th className="py-2.5 font-medium text-right">Bone Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293952]/70 font-mono tabular-nums">
              {cohorts.map((c) => (
                <tr key={c.cohortId}>
                  <td className="py-3 pr-4 text-[#38BDF8]">{c.cohortId}</td>
                  <td className="py-3 pr-4 font-sans text-white">{c.missionPhase}</td>
                  <td className="py-3 pr-4 text-right text-white">{c.sampleCount}</td>
                  <td className="py-3 pr-4 text-right text-white">{c.avgHeartRateBpm} bpm</td>
                  <td className="py-3 pr-4 text-right text-white">{c.avgSpo2Percent}%</td>
                  <td className="py-3 pr-4 text-right text-white">{c.avgCortisolUgDl} ug/dL</td>
                  <td className="py-3 text-right text-white">{c.avgBoneDensityIndex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Experimental Formula Evaluator */}
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#60A5FA]" />
          <h3 className="text-base font-semibold text-white">
            Experimental Biomedical Model Evaluator
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <div className="flex justify-between text-xs text-[#CBD5E1] mb-1">
              <span>Cohort Mean SpO2 (%)</span>
              <span className="font-mono text-white">{spo2Input}%</span>
            </div>
            <input
              type="range"
              min={88}
              max={100}
              step={0.1}
              value={spo2Input}
              onChange={(e) => setSpo2Input(Number(e.target.value))}
              className="w-full accent-[#38BDF8]"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-[#CBD5E1] mb-1">
              <span>Salivary Cortisol (ug/dL)</span>
              <span className="font-mono text-white">{cortisolInput}</span>
            </div>
            <input
              type="range"
              min={6}
              max={28}
              step={0.2}
              value={cortisolInput}
              onChange={(e) => setCortisolInput(Number(e.target.value))}
              className="w-full accent-[#38BDF8]"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-[#CBD5E1] mb-1">
              <span>Mission Duration (Days)</span>
              <span className="font-mono text-white">{daysInMicroG} d</span>
            </div>
            <input
              type="range"
              min={1}
              max={365}
              value={daysInMicroG}
              onChange={(e) => setDaysInMicroG(Number(e.target.value))}
              className="w-full accent-[#38BDF8]"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <MetricCard
            label="HYPOXIA-CORTISOL ADAPTATION INDEX"
            value={String(stressIndex)}
            unit="KN-HI"
            sub={stressIndex > 12 ? 'Elevated neuro-endocrine load' : 'Nominal adaptation band'}
          />
          <MetricCard
            label="PROJECTED BONE MINERAL RETENTION"
            value={String(boneRetentionPct)}
            unit="%"
            sub="With resistive countermeasure protocol"
          />
        </div>
      </div>
    </div>
  );
}

function GeneralUserConsole({ data }: { data: OverviewPayload }) {
  const resources = data.wellnessResources || [];
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  function toggleProtocol(id: string) {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-white">
            Educational Resources & Personal Wellness
          </h2>
          <p className="text-xs text-[#CBD5E1] mt-1">
            Explore evidence-based aerospace wellness modules. Private astronaut medical records
            are strictly separated and inaccessible from general user accounts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {resources.map((res) => {
          const done = completedIds.includes(res.id);
          return (
            <div
              key={res.id}
              className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="text-xs text-[#38BDF8]">
                  {res.category} · {res.durationMinutes} min
                </div>
                <h3 className="text-base font-semibold text-white">{res.title}</h3>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">{res.summary}</p>
                <ul className="space-y-1.5 pt-2 border-t border-[#293952] text-xs text-[#CBD5E1]">
                  {res.protocolSteps.map((step, idx) => (
                    <li key={idx}>
                      {idx + 1}. {step}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => toggleProtocol(res.id)}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                    : 'bg-[#151F30] hover:bg-[#0B1220] border border-[#293952] text-[#38BDF8]'
                }`}
              >
                {done ? 'Completed Today' : 'Mark Protocol Complete'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdministratorConsole({
  data,
  onAckAlert,
}: {
  data: OverviewPayload;
  onAckAlert: (id: number) => void;
}) {
  const { setActiveView, openSettingsSection } = useAppContext();
  const alerts = data.alerts || [];
  const stats = data.systemStats || { totalUsers: 0, totalMeasurements: 0 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="REGISTERED ACCOUNTS"
          value={String(stats.totalUsers)}
          unit="users"
          sub="Role-separated directory"
        />
        <MetricCard
          label="BIOMEDICAL RECORDS"
          value={String(stats.totalMeasurements)}
          unit="samples"
          sub="Persisted in SQLite relational store"
        />
        <MetricCard
          label="ACTIVE ALERTS"
          value={String(alerts.filter((a) => !a.acknowledged).length)}
          unit="pending"
          sub="System telemetry monitor"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white">
              Dynamic Application Branding Studio
            </h3>
            <p className="text-xs text-[#CBD5E1]">
              Upload a new official KAWSAY NOVA logo from local files, adjust framing, sync
              favicons & PDF headers, or restore the original emblem.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openSettingsSection('branding')}
            className="px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold self-start"
          >
            Open Branding & Identity Settings
          </button>
        </div>

        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-white">
              User Roles, Access Control & Audit Logs
            </h3>
            <p className="text-xs text-[#CBD5E1]">
              Inspect user accounts, assign roles, manage account statuses, and review sensitive
              operation audit logs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('governance')}
            className="px-4 py-2.5 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#38BDF8]/40 text-xs font-semibold text-[#38BDF8] flex items-center gap-2 self-start"
          >
            <Shield className="w-4 h-4" />
            Open Role Governance
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-3">
          <h3 className="text-base font-semibold text-white">System Telemetry Alerts</h3>
          {alerts.map((al) => (
            <div
              key={al.id}
              className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {al.severity === 'critical' ? (
                  <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                ) : al.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-[#FACC15]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                )}
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0B1220] border border-[#293952] text-[#CBD5E1]">
                  {al.severity}
                </span>
                <span className="font-medium text-white">{al.astronautName}</span>
                <span>· {al.metric}</span>
                <span className="font-mono text-[#38BDF8]">{al.observedValue}</span>
              </div>
              {al.acknowledged ? (
                <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAckAlert(al.id)}
                  className="px-3 py-1.5 rounded bg-[#38BDF8] text-[#0B1220] font-semibold self-start sm:self-auto"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  sub: string;
}) {
  return (
    <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-1.5">
      <div className="text-[11px] font-mono tracking-wider text-[#CBD5E1]">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold font-mono tabular-nums text-white">{value}</span>
        <span className="text-xs font-mono text-[#38BDF8]">{unit}</span>
      </div>
      <div className="text-xs text-[#CBD5E1]">{sub}</div>
    </div>
  );
}

function NumericField({
  label,
  value,
  onChange,
  step = '1',
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  step?: string;
}) {
  const inputId = `dash-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-[11px] text-[#CBD5E1] mb-1">
        {label}
      </label>
      <input
        id={inputId}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono text-sm tabular-nums focus:outline-none focus:border-[#38BDF8]"
      />
    </div>
  );
}

function TelemetryTrendChart({ measurements }: { measurements: BiomedicalMeasurement[] }) {
  if (measurements.length === 0) {
    return (
      <div className="h-44 rounded-lg bg-[#151F30] border border-[#293952] flex items-center justify-center text-xs text-[#CBD5E1]">
        <Activity className="w-4 h-4 mr-2 text-[#38BDF8]" />
        Log your first biomedical measurement to visualize longitudinal trends.
      </div>
    );
  }

  const width = 560;
  const height = 160;
  const pad = 20;
  const count = measurements.length;
  const hrValues = measurements.map((m) => m.heartRateBpm);
  const spo2Values = measurements.map((m) => m.spo2Percent);

  const hrMin = Math.min(50, ...hrValues) - 5;
  const hrMax = Math.max(110, ...hrValues) + 5;

  const toX = (idx: number) =>
    count === 1 ? width / 2 : pad + (idx / (count - 1)) * (width - pad * 2);
  const toHrY = (val: number) =>
    height - pad - ((val - hrMin) / Math.max(1, hrMax - hrMin)) * (height - pad * 2);
  const toSpo2Y = (val: number) =>
    height - pad - ((val - 90) / 10) * (height - pad * 2);

  const hrPath = measurements
    .map((m, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toHrY(m.heartRateBpm).toFixed(1)}`)
    .join(' ');
  const spo2Path = measurements
    .map((m, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toSpo2Y(m.spo2Percent).toFixed(1)}`)
    .join(' ');

  return (
    <div className="rounded-lg bg-[#151F30] border border-[#293952] p-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-40 overflow-visible"
        role="img"
        aria-label="Biomedical heart rate and SpO2 trend chart"
      >
        <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="#293952" strokeDasharray="4 4" />
        <path d={hrPath} fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d={spo2Path}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
        {measurements.map((m, i) => (
          <g key={m.id}>
            <circle cx={toX(i)} cy={toHrY(m.heartRateBpm)} r="3.5" fill="#38BDF8" />
            <circle cx={toX(i)} cy={toSpo2Y(m.spo2Percent)} r="3" fill="#60A5FA" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function MissionControlQuickGrid({
  onNavigate,
}: {
  onNavigate: (view: any) => void;
}) {
  const quickModules = [
    {
      id: 'precision_core',
      title: 'NOVA PRECISION CORE',
      desc: 'Audited ECG HR, RMSSD, MAP, MARD equations with references',
      icon: <Calculator className="w-4 h-4 text-[#38BDF8]" />,
    },
    {
      id: 'digital_twin',
      title: 'NOVA DIGITAL TWIN',
      desc: '6 biological systems interactive orbital health explorer',
      icon: <Cpu className="w-4 h-4 text-[#38BDF8]" />,
    },
    {
      id: 'mission_simulator',
      title: 'NOVA MISSION SIMULATOR',
      desc: 'Compare orbital, lunar & Mars stressor what-if scenarios',
      icon: <FlaskConical className="w-4 h-4 text-[#FACC15]" />,
    },
    {
      id: 'universal_translator',
      title: 'NOVA UNIVERSAL TRANSLATOR',
      desc: '8-language medical translator including Ayacucho Quechua',
      icon: <Languages className="w-4 h-4 text-[#38BDF8]" />,
    },
    {
      id: 'global_adaptation',
      title: 'Global Adaptation',
      desc: 'Ayacucho, Peru origin & rural high-altitude care pathways',
      icon: <Globe2 className="w-4 h-4 text-[#60A5FA]" />,
    },
    {
      id: 'knowledge_center',
      title: 'Medical Knowledge Center',
      desc: '12 searchable space & terrestrial biomedical briefs',
      icon: <BookOpen className="w-4 h-4 text-[#38BDF8]" />,
    },
  ];

  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-sm font-semibold text-[#CBD5E1] uppercase tracking-wider font-mono">
        KAWSAY NOVA Scientific & Mission Modules
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {quickModules.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onNavigate(mod.id)}
            className="text-left p-4 rounded-xl bg-[#151F30] hover:bg-[#1D2A3D] border border-[#293952] hover:border-[#38BDF8]/60 transition-colors space-y-1.5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              {mod.icon}
              <span>{mod.title}</span>
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">{mod.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
