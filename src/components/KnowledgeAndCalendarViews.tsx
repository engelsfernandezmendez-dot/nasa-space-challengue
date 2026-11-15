import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BiomedicalMeasurement, MissionTask } from '../types/kawsay';
import { apiFetch } from '../utils/authToken';
import { enqueueOfflineMutation, loadOfflineCache, saveOfflineCache } from '../utils/offlineSync';
import { validateMissionTaskInput } from '../utils/validation';

const KNOWLEDGE_TOPICS = [
  {
    id: 'hr',
    category: 'Cardiovascular',
    title: 'Heart Rate & R–R Interval Physiology',
    summary: 'Calculated via HR = 60 / mean(RR_seconds). Microgravity deconditioning can elevate post-flight orthostatic heart rate.',
    sourceName: 'NIH / PubMed Central (Task Force 1996)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/8598068/',
  },
  {
    id: 'hrv',
    category: 'Autonomic',
    title: 'Heart Rate Variability (RMSSD)',
    summary: 'Root mean square of successive RR differences quantifies parasympathetic vagal recovery across rest and sleep.',
    sourceName: 'Frontiers in Public Health (Shaffer & Ginsberg 2017)',
    url: 'https://www.frontiersin.org/articles/10.3389/fpubh.2017.00258/full',
  },
  {
    id: 'spo2',
    category: 'Respiratory',
    title: 'Pulse Oximetry & High-Altitude Hypoxia',
    summary: 'Relevant to orbital cabin decompression drills and high-altitude Andean clinics in Ayacucho (2,746m+).',
    sourceName: 'WHO Pulse Oximetry Training Manual',
    url: 'https://www.who.int/publications/i/item/9789241501132',
  },
  {
    id: 'bp',
    category: 'Cardiovascular',
    title: 'Blood Pressure & MAP Approximation',
    summary: 'MAP ≈ DBP + (SBP - DBP) / 3 estimates mean perfusion pressure at resting heart rates.',
    sourceName: 'AHA / NIH Blood Pressure Standards',
    url: 'https://www.nhlbi.nih.gov/health/high-blood-pressure',
  },
  {
    id: 'temp',
    category: 'Thermoregulation',
    title: 'Core Body Temperature Regulation in Microgravity',
    summary: 'Without natural thermal convection, sweat evaporation and active cabin ventilation regulate core temperature.',
    sourceName: 'NASA Technical Reports Server',
    url: 'https://ntrs.nasa.gov/',
  },
  {
    id: 'sleep',
    category: 'Neurobehavioral',
    title: 'Circadian Rhythm & Orbital Sunrise Cycles',
    summary: 'Low Earth Orbit experiences 16 sunrises daily, requiring scheduled blue-enriched lighting and sleep anchors.',
    sourceName: 'NASA HRP Behavioral Health & Performance',
    url: 'https://www.nasa.gov/hrp/',
  },
  {
    id: 'stress',
    category: 'Psychology',
    title: 'Isolation, Confinement & Salivary Cortisol',
    summary: 'Biochemical cortisol rhythms interact with subjective stress logs during long-duration missions.',
    sourceName: 'NASA HRP Isolation & Confinement',
    url: 'https://www.nasa.gov/hrp/elements/humanfactors/',
  },
  {
    id: 'radiation',
    category: 'Radiation',
    title: 'Galactic Cosmic Rays & Dosimetry (mSv)',
    summary: 'Cumulative effective radiation dose requires continuous shielding and solar storm sheltering protocols.',
    sourceName: 'NASA Space Radiation Element',
    url: 'https://www.nasa.gov/hrp/elements/radiation/',
  },
  {
    id: 'bone',
    category: 'Musculoskeletal',
    title: 'Bone Mineral Loss & Resistive Countermeasures',
    summary: 'Load-bearing resistive exercise (ARED) preserves femoral and lumbar spine density during prolonged unloading.',
    sourceName: 'NASA HRP Musculoskeletal Health',
    url: 'https://www.nasa.gov/hrp/',
  },
  {
    id: 'mard',
    category: 'Metabolic',
    title: 'Glucose Telemetry & CGM MARD Accuracy',
    summary: 'Mean Absolute Relative Difference evaluates average interstitial sensor deviation vs. blood glucose reference.',
    sourceName: 'Journal of Diabetes Science & Technology',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    id: 'rural',
    category: 'Earth Health',
    title: 'Remote & High-Altitude Rural Telemedicine',
    summary: 'Offline-first triage tools bring biomedical quality verification directly to underserved Andean health posts.',
    sourceName: 'WHO Digital Health Strategy',
    url: 'https://www.who.int/health-topics/digital-health',
  },
  {
    id: 'sans',
    category: 'Neuro-ocular',
    title: 'Spaceflight-Associated Neuro-ocular Syndrome (SANS)',
    summary: 'Fluid shift toward the head elevates intracranial vascular pressure over multi-month orbital stays.',
    sourceName: 'NASA HRP SANS Evidence Report',
    url: 'https://www.nasa.gov/hrp/',
  },
];

export function KnowledgeCenterView() {
  const { t } = useAppContext();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(KNOWLEDGE_TOPICS.map((x) => x.category)))];
  const filtered = KNOWLEDGE_TOPICS.filter((topic) => {
    const matchCat = category === 'All' || topic.category === category;
    const q = query.trim().toLowerCase();
    const matchText =
      !q ||
      topic.title.toLowerCase().includes(q) ||
      topic.summary.toLowerCase().includes(q) ||
      topic.category.toLowerCase().includes(q);
    return matchCat && matchText;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navKnowledgeCenter}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Curated educational aerospace & clinical physiology briefs with verified public references (NASA, WHO, NIH).
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                category === cat
                  ? 'bg-[#38BDF8] text-[#0B1220]'
                  : 'bg-[#151F30] text-[#CBD5E1] border border-[#293952]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search medical knowledge topics"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search SpO2, RMSSD, SANS..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-[#38BDF8] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{item.category}</span>
              </div>
              <h2 className="text-base font-semibold text-white">{item.title}</h2>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">{item.summary}</p>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pt-3 border-t border-[#293952] text-xs text-[#38BDF8] hover:underline flex items-center justify-between gap-2"
            >
              <span className="truncate">{item.sourceName}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

export function MissionCalendarView() {
  const { user, isOnline, refreshOfflineState, t } = useAppContext();
  const [tasks, setTasks] = useState<MissionTask[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MissionTask['category']>('mission_activity');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadTasks() {
    try {
      const res = await apiFetch('/api/calendar/tasks', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        const loaded: MissionTask[] = d.tasks || [];
        setTasks(loaded);
        const cached = loadOfflineCache();
        saveOfflineCache(cached?.measurements || [], loaded, cached?.assessments);
        return;
      }
      const errData = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setErrorMsg('Session expired. Please sign in again to manage mission calendar entries.');
      } else if (errData.error) {
        setErrorMsg(errData.error);
      }
    } catch {
      // fallback to offline cache below
    }
    const cached = loadOfflineCache();
    if (cached?.tasks) setTasks(cached.tasks);
  }

  useEffect(() => {
    loadTasks();
  }, [user?.id]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErrorMsg(null);

    const check = validateMissionTaskInput({
      title,
      category,
      scheduledDate,
      scheduledTime,
    });
    if (!check.valid) {
      setErrorMsg(Object.values(check.errors)[0] || 'Please complete all required mission calendar fields.');
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      scheduledDate: scheduledDate.trim(),
      scheduledTime: scheduledTime.trim(),
      notes: notes.trim(),
    };

    if (!isOnline) {
      const optimisticTask: MissionTask = {
        id: Date.now(),
        userId: user?.id || '',
        title: payload.title,
        category: payload.category,
        scheduledDate: payload.scheduledDate,
        scheduledTime: payload.scheduledTime,
        completed: false,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
      };
      const updated = [...tasks, optimisticTask].sort((a, b) =>
        `${a.scheduledDate} ${a.scheduledTime}`.localeCompare(`${b.scheduledDate} ${b.scheduledTime}`)
      );
      setTasks(updated);
      const cached = loadOfflineCache();
      saveOfflineCache(cached?.measurements || [], updated, cached?.assessments);
      enqueueOfflineMutation({
        endpoint: '/api/calendar/tasks',
        method: 'POST',
        payload,
        description: `Create calendar task: ${payload.title}`,
      });
      refreshOfflineState();
      setMsg('Offline mode: mission task added locally and queued for sync.');
      setTitle('');
      setNotes('');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/calendar/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(d.error || 'Unable to add mission task to calendar. Verify your session and inputs.');
        return;
      }
      const nextTasks: MissionTask[] = d.tasks || [];
      setTasks(nextTasks);
      const cached = loadOfflineCache();
      saveOfflineCache(cached?.measurements || [], nextTasks, cached?.assessments);
      setTitle('');
      setNotes('');
      setMsg('Mission / health task scheduled in calendar.');
    } catch {
      setErrorMsg('Connection error while saving to mission calendar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task: MissionTask) {
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/calendar/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: !task.completed }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(d.error || 'Unable to update calendar task status.');
        return;
      }
      setTasks(d.tasks || []);
    } catch {
      setErrorMsg('Connection error updating calendar task.');
    }
  }

  async function deleteTask(id: number) {
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/calendar/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(d.error || 'Unable to remove calendar task.');
        return;
      }
      setTasks(d.tasks || []);
    } catch {
      setErrorMsg('Connection error deleting calendar task.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navMissionCalendar}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Schedule biomedical measurements, resistive exercise blocks, hydration checks, and mission sleep anchors.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreateTask}
          className="lg:col-span-5 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#38BDF8]" />
            <span>Schedule Mission / Routine</span>
          </h2>
          <div>
            <label htmlFor="cal-title" className="block text-xs text-[#CBD5E1] mb-1">
              Mission or Task Title
            </label>
            <input
              id="cal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. EVA Lunar Surface Prep or SpO2 Check"
              required
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
            />
          </div>
          <div>
            <label htmlFor="cal-category" className="block text-xs text-[#CBD5E1] mb-1">
              Category
            </label>
            <select
              id="cal-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as MissionTask['category'])}
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
            >
              <option value="mission_activity">EVA / Mission Activity</option>
              <option value="health_assessment">Health Assessment</option>
              <option value="measurement_reminder">Measurement Reminder</option>
              <option value="physical_activity">Physical Activity / ARED</option>
              <option value="sleep_routine">Sleep Routine</option>
              <option value="hydration_nutrition">Hydration & Nutrition</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cal-date" className="block text-xs text-[#CBD5E1] mb-1">
                Date
              </label>
              <input
                id="cal-date"
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
              />
            </div>
            <div>
              <label htmlFor="cal-time" className="block text-xs text-[#CBD5E1] mb-1">
                Time (UTC)
              </label>
              <input
                id="cal-time"
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor="cal-notes" className="block text-xs text-[#CBD5E1] mb-1">
              Notes
            </label>
            <input
              id="cal-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional mission objective or protocol detail"
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold disabled:opacity-60"
          >
            {submitting ? 'Scheduling...' : 'Add to Mission Calendar'}
          </button>
        </form>

        <div className="lg:col-span-7 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#38BDF8]" />
              <span>Scheduled Tasks ({tasks.length})</span>
            </h2>
          </div>

          {tasks.length === 0 ? (
            <p className="text-xs text-[#CBD5E1]">No mission health tasks scheduled yet.</p>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    className="flex items-start gap-3 text-left flex-1"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        task.completed ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          task.completed ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-[11px] font-mono text-[#38BDF8]">
                        {task.scheduledDate} · {task.scheduledTime} UTC · {task.category.replace('_', ' ')}
                      </div>
                      {task.notes && <div className="text-xs text-[#CBD5E1] mt-0.5">{task.notes}</div>}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete task ${task.title}`}
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HealthAnalyticsView() {
  const { user, t } = useAppContext();
  const [measurements, setMeasurements] = useState<BiomedicalMeasurement[]>([]);
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [metric, setMetric] = useState<'hr' | 'spo2' | 'sleep' | 'stress'>('hr');

  useEffect(() => {
    apiFetch('/api/biomedical/overview', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.measurements) setMeasurements(d.measurements);
      })
      .catch(() => {});
  }, [user?.id]);

  // Inline pure filtering matching unit-tested precisionCore filterMeasurementsByDateRange semantics
  const anchorMs =
    measurements.length > 0
      ? Math.max(Date.now(), ...measurements.map((m) => new Date(m.recordedAt).getTime()).filter(Number.isFinite))
      : Date.now();

  const filteredMeasurements = measurements.filter((m) => {
    const ts = new Date(m.recordedAt).getTime();
    if (!Number.isFinite(ts)) return false;
    if (range === 'daily') return ts >= anchorMs - 24 * 60 * 60 * 1000;
    if (range === 'weekly') return ts >= anchorMs - 7 * 24 * 60 * 60 * 1000;
    if (range === 'monthly') return ts >= anchorMs - 30 * 24 * 60 * 60 * 1000;
    const sMs = customStart ? new Date(`${customStart}T00:00:00.000Z`).getTime() : -Infinity;
    const eMs = customEnd ? new Date(`${customEnd}T23:59:59.999Z`).getTime() : Infinity;
    return ts >= sMs && ts <= eMs;
  });

  const ordered = [...filteredMeasurements].reverse();
  const values = ordered.map((m) =>
    metric === 'hr'
      ? m.heartRateBpm
      : metric === 'spo2'
        ? m.spo2Percent
        : metric === 'sleep'
          ? m.sleepHours
          : m.stressScore
  );

  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '--';
  const min = values.length ? Math.min(...values).toFixed(1) : '--';
  const max = values.length ? Math.max(...values).toFixed(1) : '--';

  const baselineMap: Record<typeof metric, number> = {
    hr: 68,
    spo2: 98,
    sleep: 7.5,
    stress: 4,
  };

  const w = 640;
  const h = 220;
  const pad = 32;
  const vMin = values.length ? Math.min(...values, baselineMap[metric]) - 3 : 0;
  const vMax = values.length ? Math.max(...values, baselineMap[metric]) + 3 : 100;
  const toX = (i: number) =>
    ordered.length <= 1 ? w / 2 : pad + (i / (ordered.length - 1)) * (w - pad * 2);
  const toY = (val: number) => h - pad - ((val - vMin) / Math.max(1, vMax - vMin)) * (h - pad * 2);
  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ');

  function exportFilteredCsv() {
    if (ordered.length === 0) return;
    const headers = ['ID', 'Crew', 'RecordedAt', 'HR_bpm', 'SpO2_pct', 'Sleep_h', 'Stress_score', 'Origin'];
    const lines = ordered.map((m) =>
      [m.id, `"${m.astronautName.replace(/"/g, '""')}"`, m.recordedAt, m.heartRateBpm, m.spo2Percent, m.sleepHours, m.stressScore, m.dataOrigin].join(',')
    );
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kawsay-nova-analytics-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t.navHealthAnalytics}</h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Multi-period longitudinal telemetry trends dynamically filtered from persistent database logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['daily', 'weekly', 'monthly', 'custom'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                range === r
                  ? 'bg-[#38BDF8] text-[#0B1220]'
                  : 'bg-[#151F30] text-[#CBD5E1] border border-[#293952]'
              }`}
            >
              {r}
            </button>
          ))}
          <button
            type="button"
            disabled={ordered.length === 0}
            onClick={exportFilteredCsv}
            className="px-3 py-1.5 rounded-lg bg-[#1D2A3D] border border-[#293952] text-xs text-[#38BDF8] hover:bg-[#151F30] disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      {range === 'custom' && (
        <div className="bg-[#151F30] border border-[#293952] rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-[#CBD5E1]">
            <span>Start Date (UTC):</span>
            <input
              type="date"
              aria-label="Analytics start date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono"
            />
          </label>
          <label className="flex items-center gap-2 text-[#CBD5E1]">
            <span>End Date (UTC):</span>
            <input
              type="date"
              aria-label="Analytics end date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono"
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-4">
          <div className="text-xs text-[#CBD5E1]">SAMPLES ANALYZED</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{values.length}</div>
        </div>
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-4">
          <div className="text-xs text-[#CBD5E1]">PERIOD MEAN</div>
          <div className="text-2xl font-mono font-bold text-[#38BDF8] mt-1">{avg}</div>
        </div>
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-4">
          <div className="text-xs text-[#CBD5E1]">MINIMUM</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{min}</div>
        </div>
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-4">
          <div className="text-xs text-[#CBD5E1]">MAXIMUM</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">{max}</div>
        </div>
      </div>

      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
            <span>Indicator Comparison vs. Personal Baseline ({baselineMap[metric]})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'hr', label: 'Heart Rate' },
              { id: 'spo2', label: 'SpO2 (%)' },
              { id: 'sleep', label: 'Sleep (hrs)' },
              { id: 'stress', label: 'Stress (1-10)' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id as typeof metric)}
                className={`px-3 py-1.5 rounded-lg text-xs ${
                  metric === m.id
                    ? 'bg-[#38BDF8] text-[#0B1220] font-semibold'
                    : 'bg-[#151F30] text-[#CBD5E1] border border-[#293952]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {values.length === 0 ? (
          <p className="text-xs text-[#CBD5E1] py-8 text-center">
            No individual biomedical records found in this date window or role scope. Adjust the date range or record a new measurement.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-56 bg-[#151F30] rounded-xl border border-[#293952]"
            role="img"
            aria-label="Longitudinal health analytics chart"
          >
            <line
              x1={pad}
              y1={toY(baselineMap[metric])}
              x2={w - pad}
              y2={toY(baselineMap[metric])}
              stroke="#22C55E"
              strokeDasharray="6 4"
            />
            <path d={linePath} fill="none" stroke="#38BDF8" strokeWidth="2.5" />
            {ordered.map((rec, i) => {
              const v = values[i];
              return (
                <g key={rec.id}>
                  <circle cx={toX(i)} cy={toY(v)} r="4" fill="#38BDF8" />
                  <text
                    x={toX(i)}
                    y={toY(v) - 8}
                    textAnchor="middle"
                    fill="#CBD5E1"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {v}
                  </text>
                  <text
                    x={toX(i)}
                    y={h - 8}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {new Date(rec.recordedAt).toISOString().slice(5, 10)}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
