import { useEffect, useState } from 'react';
import {
  Activity,
  Brain,
  ExternalLink,
  Moon,
  Pause,
  Play,
  Radio,
  ShieldAlert,
  Sparkles,
  Wind,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BiomedicalMeasurement, MentalAssessment } from '../types/kawsay';
import { Trash2, CheckCircle2, Droplets } from 'lucide-react';
import { apiFetch } from '../utils/authToken';


const NASA_HRP_RISKS = [
  {
    id: 'radiation',
    title: 'Space Radiation',
    hazard: 'Galactic Cosmic Rays (GCR) & Solar Particle Events (SPE)',
    explanation:
      'Beyond Earth’s magnetosphere, crews receive chronic high-LET ionizing radiation increasing oxidative stress, cataract risk, and long-term carcinogenesis probabilities.',
    systems: ['Central Nervous System', 'Cardiovascular', 'Cellular DNA Repair'],
    indicators: ['Cumulative Dose (mSv)', 'Dosimetry Badge Rate', 'Solar Weather Alerts'],
    countermeasures: ['Water-wall & polyethylene shielding', 'Storm shelter protocols', 'Real-time radiation dosimetry'],
    referenceUrl: 'https://www.nasa.gov/hrp/elements/radiation/',
  },
  {
    id: 'isolation',
    title: 'Isolation and Confinement',
    hazard: 'Sensory monotony & prolonged closed-team habitats',
    explanation:
      'Long-duration confinement in small crews strains circadian mood stability, interpersonal cohesion, and subjective stress resilience.',
    systems: ['Psychological Well-being', 'Neuroendocrine (Cortisol)', 'Circadian Sleep'],
    indicators: ['Mood Score (1-10)', 'Stress Rating', 'Sleep Efficiency'],
    countermeasures: ['Structured private reflection', 'Light-therapy scheduling', 'VR/family asynchronous messaging'],
    referenceUrl: 'https://www.nasa.gov/hrp/elements/humanfactors/',
  },
  {
    id: 'gravity',
    title: 'Altered Gravity Fields (Microgravity / Hypogravity)',
    hazard: 'Mechanical unloading & cephalad fluid redistribution',
    explanation:
      'Microgravity triggers ~1% monthly bone mineral density loss in weight-bearing bones, muscle atrophy, orthostatic intolerance on return, and Spaceflight-Associated Neuro-ocular Syndrome (SANS).',
    systems: ['Musculoskeletal', 'Cardiovascular', 'Ocular & Vestibular'],
    indicators: ['Bone Density Index', 'ARED Exercise Load', 'Resting BP & HRV'],
    countermeasures: ['Daily resistive & aerobic exercise (2+ hrs)', 'Lower-body negative pressure', 'Vitamin D & nutritional balance'],
    referenceUrl: 'https://www.nasa.gov/hrp/',
  },
  {
    id: 'distance',
    title: 'Distance from Earth',
    hazard: 'Autonomous clinical operations & 4–22 min one-way comm delay',
    explanation:
      'Without real-time Earth tele-consultation or emergency evacuation, crews require transparent offline medical references and self-contained diagnostics.',
    systems: ['All Clinical Decision Pathways', 'Crew Medical Autonomy'],
    indicators: ['Offline Cache Readiness', 'Sensor Data Quality Tier'],
    countermeasures: ['Offline biomedical libraries', 'Guided procedural checklists', 'Precision mathematical validation'],
    referenceUrl: 'https://www.nasa.gov/hrp/mars/',
  },
  {
    id: 'closed',
    title: 'Hostile / Closed Environments',
    hazard: 'Cabin CO2 accumulation, microbial balance, noise, and thermal load',
    explanation:
      'Recycled cabin atmosphere and water systems can accumulate hypercapnic CO2 pockets without convective buoyancy, causing headaches and degraded cognitive focus.',
    systems: ['Respiratory', 'Metabolic & Thermoregulatory', 'Immune'],
    indicators: ['SpO2 (%)', 'Respiratory Rate', 'Core Temperature (°C)'],
    countermeasures: ['CO2 scrubbing verification', 'HEPA filtration & surface sanitation', 'Acoustic protection'],
    referenceUrl: 'https://www.nasa.gov/hrp/elements/exploration/',
  },
];

export function SpaceRisksView() {
  const { t } = useAppContext();
  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navSpaceRisks}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          The 5 primary human spaceflight hazard categories studied by space biomedical researchers (NASA Human Research Program reference framework). Independent educational synthesis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {NASA_HRP_RISKS.map((risk) => (
          <article
            key={risk.id}
            className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono text-[#38BDF8] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>{risk.hazard}</span>
                </div>
                <h2 className="text-lg font-semibold text-white mt-1">{risk.title}</h2>
              </div>
              <a
                href={risk.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Reference</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">{risk.explanation}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952]">
                <div className="font-semibold text-white mb-1">Monitored Indicators</div>
                <ul className="space-y-0.5 text-[#CBD5E1]">
                  {risk.indicators.map((i) => (
                    <li key={i}>• {i}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952]">
                <div className="font-semibold text-white mb-1">Countermeasures</div>
                <ul className="space-y-0.5 text-[#CBD5E1]">
                  {risk.countermeasures.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function MentalWellbeingView() {
  const { user, t } = useAppContext();
  const [breathingActive, setBreathingActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale (4s)' | 'Hold (4s)' | 'Exhale (6s)'>('Inhale (4s)');
  const [mood, setMood] = useState(8);
  const [stress, setStress] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(8);
  const [journalNote, setJournalNote] = useState('');
  const [journalPrivate, setJournalPrivate] = useState(true);
  const [savedEntries, setSavedEntries] = useState<MentalAssessment[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/assessments', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.assessments) setSavedEntries(d.assessments);
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!breathingActive) return;
    const sequence: Array<{ label: 'Inhale (4s)' | 'Hold (4s)' | 'Exhale (6s)'; ms: number }> = [
      { label: 'Inhale (4s)', ms: 4000 },
      { label: 'Hold (4s)', ms: 4000 },
      { label: 'Exhale (6s)', ms: 6000 },
    ];
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    function nextStep() {
      setPhase(sequence[idx].label);
      timer = setTimeout(() => {
        idx = (idx + 1) % sequence.length;
        nextStep();
      }, sequence[idx].ms);
    }
    nextStep();
    return () => clearTimeout(timer);
  }, [breathingActive]);

  async function handleSaveCheckIn(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);
    const res = await apiFetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        moodScore: mood,
        stressScore: stress,
        fatigueScore: fatigue,
        sleepQualityScore: sleepQuality,
        notes: journalNote.trim() || 'Routine orbital self-reflection check-in.',
        isPrivate: journalPrivate,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setSavedEntries(d.assessments || []);
      setJournalNote('');
      setStatusMsg('Reflective well-being check-in saved to database.');
    }
  }

  async function handleDeleteCheckIn(id: number) {
    const res = await apiFetch(`/api/assessments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      const d = await res.json();
      setSavedEntries(d.assessments || []);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navMentalWellbeing}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Persistent self-reflection check-ins, autonomic breathing pacer, and supportive strategies. Non-diagnostic reflective module.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Guided Breathing Pacer */}
        <div className="lg:col-span-5 bg-[#151F30] border border-[#293952] rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-5">
          <div className="text-xs font-mono text-[#38BDF8] flex items-center gap-1.5">
            <Wind className="w-4 h-4" />
            <span>4-4-6 AUTONOMIC BREATHING PACER</span>
          </div>
          <div
            className={`w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-1000 ${
              breathingActive
                ? 'border-[#38BDF8] bg-[#38BDF8]/15 scale-105'
                : 'border-[#293952] bg-[#1D2A3D]'
            }`}
          >
            <span className="text-sm font-semibold text-white">
              {breathingActive ? phase : 'Ready'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBreathingActive((p) => !p)}
            className="px-5 py-2.5 rounded-lg bg-[#38BDF8] text-[#0B1220] text-xs font-semibold flex items-center gap-2"
          >
            {breathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{breathingActive ? 'Pause Breathing Guide' : 'Start Guided Breathing'}</span>
          </button>
        </div>

        {/* Non-Diagnostic Self Check-In */}
        <form
          onSubmit={handleSaveCheckIn}
          className="lg:col-span-7 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#38BDF8]" />
              <span>Reflective Well-Being Check-In</span>
            </h2>
            <span className="text-[11px] font-mono text-amber-300">NON-DIAGNOSTIC</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[#CBD5E1] mb-1">Mood ({mood}/10)</label>
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1">Stress ({stress}/10)</label>
              <input
                type="range"
                min={1}
                max={10}
                value={stress}
                onChange={(e) => setStress(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1">Fatigue ({fatigue}/10)</label>
              <input
                type="range"
                min={1}
                max={10}
                value={fatigue}
                onChange={(e) => setFatigue(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1">Sleep Quality ({sleepQuality}/10)</label>
              <input
                type="range"
                min={1}
                max={10}
                value={sleepQuality}
                onChange={(e) => setSleepQuality(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#CBD5E1] mb-1">Private Reflection Journal</label>
            <textarea
              rows={3}
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Reflect on sleep, social contact, mission workload, or Earth communication..."
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-[#CBD5E1] cursor-pointer">
              <input
                type="checkbox"
                checked={journalPrivate}
                onChange={(e) => setJournalPrivate(e.target.checked)}
                className="accent-[#38BDF8]"
              />
              <span>Keep reflection private (do not share with team console)</span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#38BDF8] text-[#0B1220] text-xs font-semibold"
            >
              Save Check-In
            </button>
          </div>
        </form>
      </div>

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-2.5">
        <h3 className="text-sm font-semibold text-white">Persisted Self-Check History ({savedEntries.length})</h3>
        {savedEntries.length === 0 ? (
          <p className="text-xs text-[#CBD5E1] py-3">No reflective check-ins saved for your account yet.</p>
        ) : (
          savedEntries.map((item) => (
            <div key={item.id} className="p-3 rounded-lg bg-[#151F30] border border-[#293952] text-xs flex justify-between items-start gap-3">
              <div>
                <div className="text-white font-medium">{item.notes}</div>
                <div className="text-[11px] text-[#CBD5E1] mt-0.5 font-mono">
                  Mood {item.moodScore}/10 · Stress {item.stressScore}/10 · Fatigue {item.fatigueScore}/10 · Sleep {item.sleepQualityScore}/10 ·{' '}
                  {item.isPrivate ? 'Private' : 'Team Shared'}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(item.recordedAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  aria-label={`Delete check-in ${item.id}`}
                  onClick={() => handleDeleteCheckIn(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function SleepActivityView() {
  const { user, t } = useAppContext();
  const [measurements, setMeasurements] = useState<BiomedicalMeasurement[]>([]);
  const [sleepInput, setSleepInput] = useState('7.6');
  const [activityInput, setActivityInput] = useState('50');
  const [stepsInput, setStepsInput] = useState('7200');
  const [hydrationInput, setHydrationInput] = useState('2.6');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logMsg, setLogMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function loadOverview() {
    apiFetch('/api/biomedical/overview', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.measurements) setMeasurements(d.measurements);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadOverview();
  }, [user?.id]);

  const canLog = user?.permissions.includes('log_biomedical_measurements');
  const latest = measurements[0];
  const ordered = [...measurements].reverse();

  async function handleLogCountermeasures(e: React.FormEvent) {
    e.preventDefault();
    if (!canLog) return;
    setLogMsg(null);
    setSaving(true);
    try {
      const base = latest;
      const res = await apiFetch('/api/biomedical/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recordedDate: logDate,
          recordedTime: new Date().toISOString().slice(11, 16),
          heartRateBpm: base?.heartRateBpm ?? 68,
          hrvRmssdMs: base?.hrvRmssdMs ?? 44,
          systolicMmHg: base?.systolicMmHg ?? 118,
          diastolicMmHg: base?.diastolicMmHg ?? 76,
          spo2Percent: base?.spo2Percent ?? 98.2,
          coreTempC: base?.coreTempC ?? 36.7,
          sleepHours: Number(sleepInput),
          activityMinutes: Number(activityInput),
          stepsCount: Number(stepsInput),
          hydrationLiters: Number(hydrationInput),
          dataOrigin: 'manual_entry',
          measurementMethod: 'Sleep, Activity & Hydration Log',
          sensorSource: 'Manual Daily Countermeasure Log',
          notes: `Logged ${sleepInput}h sleep, ${activityInput}m exercise, ${hydrationInput}L hydration.`,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setMeasurements(d.measurements || []);
        setLogMsg('Sleep, physical activity, and hydration log saved to database.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navSleepActivity}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Circadian sleep duration, resistive exercise countermeasures, locomotion, and hydration tracking synced to SQLite.
        </p>
      </div>

      {logMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
          {logMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#CBD5E1] flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-[#38BDF8]" />
            <span>LAST SLEEP CYCLE</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {latest ? `${latest.sleepHours.toFixed(1)} h` : '--'}
          </div>
          <div className="text-xs text-[#CBD5E1]">
            {latest ? 'From latest saved telemetry' : 'No sleep records saved'}
          </div>
        </div>
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#CBD5E1] flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#38BDF8]" />
            <span>COUNTERMEASURE EXERCISE</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {latest ? `${latest.activityMinutes} min` : '--'}
          </div>
          <div className="text-xs text-[#CBD5E1]">ARED resistive + cycle ergometer</div>
        </div>
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#CBD5E1] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#60A5FA]" />
            <span>STEPS / LOCOMOTION</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {latest ? latest.stepsCount.toLocaleString() : '--'}
          </div>
          <div className="text-xs text-[#CBD5E1]">Treadmill harness equivalent</div>
        </div>
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#CBD5E1] flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-[#38BDF8]" />
            <span>HYDRATION INTAKE</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {latest ? `${latest.hydrationLiters.toFixed(1)} L` : '--'}
          </div>
          <div className="text-xs text-[#CBD5E1]">Orbital baseline ~2.5 L/day</div>
        </div>
      </div>

      {canLog && (
        <form
          onSubmit={handleLogCountermeasures}
          className="bg-[#151F30] border border-[#293952] rounded-xl p-5 grid grid-cols-2 sm:grid-cols-6 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] text-[#CBD5E1] mb-1">Log Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#CBD5E1] mb-1">Sleep (hrs)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="24"
              value={sleepInput}
              onChange={(e) => setSleepInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#CBD5E1] mb-1">Activity (min)</label>
            <input
              type="number"
              min="0"
              max="720"
              value={activityInput}
              onChange={(e) => setActivityInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#CBD5E1] mb-1">Steps</label>
            <input
              type="number"
              min="0"
              max="100000"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#CBD5E1] mb-1">Hydration (L)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="12"
              value={hydrationInput}
              onChange={(e) => setHydrationInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold"
          >
            {saving ? 'Saving...' : 'Save Daily Log'}
          </button>
        </form>
      )}

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Sleep Duration & Exercise Trend</h2>
          <Radio className="w-4 h-4 text-[#38BDF8]" />
        </div>
        {ordered.length === 0 ? (
          <p className="text-xs text-[#CBD5E1] py-4">
            No individual longitudinal sleep or activity records are currently stored for this role scope.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Dynamic SVG Bar Comparison Chart */}
            <svg
              viewBox="0 0 600 150"
              className="w-full h-36 bg-[#151F30] rounded-xl border border-[#293952]"
              role="img"
              aria-label="Sleep duration and activity bars"
            >
              {ordered.slice(-8).map((m, i, arr) => {
                const slot = 560 / Math.max(1, arr.length);
                const x = 24 + i * slot;
                const sleepH = Math.min(100, (m.sleepHours / 10) * 100);
                const actH = Math.min(100, (m.activityMinutes / 90) * 100);
                return (
                  <g key={m.id}>
                    <rect x={x} y={118 - sleepH} width={Math.max(8, slot * 0.28)} height={sleepH} rx="3" fill="#38BDF8" />
                    <rect x={x + Math.max(10, slot * 0.32)} y={118 - actH} width={Math.max(8, slot * 0.28)} height={actH} rx="3" fill="#60A5FA" />
                    <text x={x + slot * 0.3} y={138} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                      {new Date(m.recordedAt).toISOString().slice(5, 10)}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ordered.slice(-4).map((m) => (
                <div key={m.id} className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs space-y-1">
                  <div className="font-mono text-[#38BDF8]">{new Date(m.recordedAt).toLocaleDateString()}</div>
                  <div className="text-white font-semibold">Sleep: {m.sleepHours} hrs</div>
                  <div className="text-[#CBD5E1]">Activity: {m.activityMinutes} min · {m.hydrationLiters} L</div>
                  <div className="text-[11px] text-slate-400">Steps: {m.stepsCount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
