import React, { useEffect, useState } from 'react';
import {
  Activity,
  Brain,
  Download,
  Droplets,
  Dumbbell,
  FileJson,
  HeartPulse,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wind,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BiomedicalMeasurement, DataOrigin, UserAccount } from '../types/kawsay';
import { apiFetch } from '../utils/authToken';
import { enqueueOfflineMutation, loadOfflineCacheAsync, saveOfflineCache } from '../utils/offlineSync';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  filterMeasurementsByDateRange,
  flOzToLiters,
  litersToFlOz,
  measurementsToCsv,
  mgDlToMmolL,
  mmolLToMgDl,
  validateMeasurementInput,
} from '../utils/precisionCore';

type BioSystemFilter =
  | 'all'
  | 'cardiovascular'
  | 'respiratory'
  | 'metabolic'
  | 'musculoskeletal'
  | 'neurological'
  | 'psychological';

const ORIGIN_META: Record<DataOrigin, { label: string; colorClass: string }> = {
  real_sensor: {
    label: 'Real Sensor',
    colorClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
  },
  manual_entry: {
    label: 'Manual Entry',
    colorClass: 'bg-sky-950/60 text-sky-300 border-sky-500/40',
  },
  calculated: {
    label: 'Calculated',
    colorClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40',
  },
  simulated_demo: {
    label: 'Simulated Demo',
    colorClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
  },
};

export function BiomedicalMonitoringView() {
  const { user, isOnline, refreshOfflineState, t } = useAppContext();
  const [measurements, setMeasurements] = useState<BiomedicalMeasurement[]>([]);
  const [astronauts, setAstronauts] = useState<UserAccount[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [systemFilter, setSystemFilter] = useState<BioSystemFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BiomedicalMeasurement | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Measurement Units (converted to SI metric before save)
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [glucoseUnit, setGlucoseUnit] = useState<'mg_dl' | 'mmol_l'>('mg_dl');
  const [hydrationUnit, setHydrationUnit] = useState<'L' | 'oz'>('L');

  // Form Fields
  const nowIso = new Date().toISOString();
  const [recordedDate, setRecordedDate] = useState(nowIso.slice(0, 10));
  const [recordedTime, setRecordedTime] = useState(nowIso.slice(11, 16));
  const [heartRateBpm, setHeartRateBpm] = useState('68');
  const [hrvRmssdMs, setHrvRmssdMs] = useState('44');
  const [systolicMmHg, setSystolicMmHg] = useState('118');
  const [diastolicMmHg, setDiastolicMmHg] = useState('76');
  const [spo2Percent, setSpo2Percent] = useState('98.1');
  const [respiratoryRateRpm, setRespiratoryRateRpm] = useState('15');
  const [coreTempValue, setCoreTempValue] = useState('36.7');
  const [bloodGlucoseValue, setBloodGlucoseValue] = useState('94');
  const [hydrationValue, setHydrationValue] = useState('2.5');
  const [sleepHours, setSleepHours] = useState('7.4');
  const [activityMinutes, setActivityMinutes] = useState('45');
  const [stepsCount, setStepsCount] = useState('6500');
  const [cortisolUgDl, setCortisolUgDl] = useState('12.5');
  const [boneDensityIndex, setBoneDensityIndex] = useState('1.02');
  const [radiationDoseMsv, setRadiationDoseMsv] = useState('0.45');
  const [moodScore, setMoodScore] = useState('8');
  const [stressScore, setStressScore] = useState('4');
  const [fatigueScore, setFatigueScore] = useState('3');
  const [dataOrigin, setDataOrigin] = useState<DataOrigin>('manual_entry');
  const [measurementMethod, setMeasurementMethod] = useState('Manual calibrated check');
  const [sensorSource, setSensorSource] = useState('Manual Calibrated Kit');
  const [notes, setNotes] = useState('');

  async function loadMeasurements() {
    try {
      const res = await apiFetch('/api/biomedical/overview', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const list: BiomedicalMeasurement[] = data.measurements || [];
        const astroList: UserAccount[] = data.astronauts || [];
        setMeasurements(list);
        setAstronauts(astroList);
        if (astroList.length > 0 && !targetUserId) {
          setTargetUserId(astroList[0].id);
        }
        saveOfflineCache(list, data.tasks || []);
        return;
      }
    } catch {
      // fallback to IndexedDB / localStorage cache
    }
    const cached = await loadOfflineCacheAsync();
    if (cached?.measurements) setMeasurements(cached.measurements);
  }

  useEffect(() => {
    loadMeasurements();
  }, [user?.id]);

  if (!user) return null;

  const canLog = user.permissions.includes('log_biomedical_measurements');

  function toggleTempUnit(next: 'C' | 'F') {
    if (next === tempUnit) return;
    const n = Number(coreTempValue);
    if (Number.isFinite(n)) {
      setCoreTempValue(String(next === 'F' ? celsiusToFahrenheit(n) : fahrenheitToCelsius(n)));
    }
    setTempUnit(next);
  }

  function toggleGlucoseUnit(next: 'mg_dl' | 'mmol_l') {
    if (next === glucoseUnit) return;
    const n = Number(bloodGlucoseValue);
    if (Number.isFinite(n)) {
      setBloodGlucoseValue(String(next === 'mmol_l' ? mgDlToMmolL(n) : mmolLToMgDl(n)));
    }
    setGlucoseUnit(next);
  }

  function toggleHydrationUnit(next: 'L' | 'oz') {
    if (next === hydrationUnit) return;
    const n = Number(hydrationValue);
    if (Number.isFinite(n)) {
      setHydrationValue(String(next === 'oz' ? litersToFlOz(n) : flOzToLiters(n)));
    }
    setHydrationUnit(next);
  }

  function startEdit(rec: BiomedicalMeasurement) {
    setEditingRecord(rec);
    setFieldErrors({});
    setFeedback(null);
    setTempUnit('C');
    setGlucoseUnit('mg_dl');
    setHydrationUnit('L');
    const iso = new Date(rec.recordedAt).toISOString();
    setRecordedDate(iso.slice(0, 10));
    setRecordedTime(iso.slice(11, 16));
    setHeartRateBpm(String(rec.heartRateBpm));
    setHrvRmssdMs(String(rec.hrvRmssdMs));
    setSystolicMmHg(String(rec.systolicMmHg));
    setDiastolicMmHg(String(rec.diastolicMmHg));
    setSpo2Percent(String(rec.spo2Percent));
    setRespiratoryRateRpm(String(rec.respiratoryRateRpm));
    setCoreTempValue(String(rec.coreTempC));
    setBloodGlucoseValue(String(rec.bloodGlucoseMgDl));
    setHydrationValue(String(rec.hydrationLiters));
    setSleepHours(String(rec.sleepHours));
    setActivityMinutes(String(rec.activityMinutes));
    setStepsCount(String(rec.stepsCount));
    setCortisolUgDl(String(rec.cortisolUgDl));
    setBoneDensityIndex(String(rec.boneDensityIndex));
    setRadiationDoseMsv(String(rec.radiationDoseMsv));
    setMoodScore(String(rec.moodScore));
    setStressScore(String(rec.stressScore));
    setFatigueScore(String(rec.fatigueScore));
    setDataOrigin(rec.dataOrigin);
    setMeasurementMethod(rec.measurementMethod);
    setSensorSource(rec.sensorSource);
    setNotes(rec.notes || '');
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    const normalizedTempC =
      tempUnit === 'F' ? fahrenheitToCelsius(Number(coreTempValue)) : Number(coreTempValue);
    const normalizedGlucoseMgDl =
      glucoseUnit === 'mmol_l'
        ? mmolLToMgDl(Number(bloodGlucoseValue))
        : Number(bloodGlucoseValue);
    const normalizedHydrationL =
      hydrationUnit === 'oz' ? flOzToLiters(Number(hydrationValue)) : Number(hydrationValue);

    const payload = {
      targetUserId:
        (user?.role === 'medical_specialist' || user?.role === 'administrator') && targetUserId
          ? targetUserId
          : undefined,
      recordedDate,
      recordedTime,
      heartRateBpm: Number(heartRateBpm),
      hrvRmssdMs: Number(hrvRmssdMs),
      systolicMmHg: Number(systolicMmHg),
      diastolicMmHg: Number(diastolicMmHg),
      spo2Percent: Number(spo2Percent),
      respiratoryRateRpm: Number(respiratoryRateRpm),
      coreTempC: normalizedTempC,
      bloodGlucoseMgDl: normalizedGlucoseMgDl,
      hydrationLiters: normalizedHydrationL,
      sleepHours: Number(sleepHours),
      activityMinutes: Number(activityMinutes),
      stepsCount: Number(stepsCount),
      cortisolUgDl: Number(cortisolUgDl),
      boneDensityIndex: Number(boneDensityIndex),
      radiationDoseMsv: Number(radiationDoseMsv),
      moodScore: Number(moodScore),
      stressScore: Number(stressScore),
      fatigueScore: Number(fatigueScore),
      dataOrigin,
      sensorSource: sensorSource.trim(),
      measurementMethod: measurementMethod.trim(),
      notes: notes.trim(),
    };

    const validation = validateMeasurementInput(payload);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setFeedback({
        type: 'error',
        text: Object.values(validation.errors)[0] || 'Please fix highlighted validation errors.',
      });
      return;
    }

    if (editingRecord) {
      if (!isOnline) {
        enqueueOfflineMutation({
          endpoint: `/api/biomedical/measurements/${editingRecord.id}`,
          method: 'PATCH',
          payload,
          description: `Update biomedical record #${editingRecord.id}`,
        });
        refreshOfflineState();
        setFeedback({ type: 'success', text: 'Offline mode: update queued cleanly for synchronization.' });
        setShowForm(false);
        setEditingRecord(null);
        return;
      }
      setSubmitting(true);
      try {
        const res = await apiFetch(`/api/biomedical/measurements/${editingRecord.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.fieldErrors) setFieldErrors(data.fieldErrors);
          setFeedback({ type: 'error', text: data.error || 'Failed to update record.' });
          return;
        }
        const updatedList: BiomedicalMeasurement[] = data.measurements || [];
        setMeasurements(updatedList);
        saveOfflineCache(updatedList, []);
        setFeedback({ type: 'success', text: 'Biomedical measurement updated and database synced.' });
        setShowForm(false);
        setEditingRecord(null);
      } catch {
        setFeedback({ type: 'error', text: 'Connection error while updating biomedical record.' });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!isOnline) {
      const targetAstro = astronauts.find((a) => a.id === targetUserId);
      const optimistic: BiomedicalMeasurement = {
        id: Date.now(),
        userId: payload.targetUserId || user?.id || '',
        astronautName: targetAstro?.fullName || user?.fullName || 'Crew Member',
        recordedAt: validation.recordedAtIso || new Date().toISOString(),
        heartRateBpm: payload.heartRateBpm,
        hrvRmssdMs: payload.hrvRmssdMs,
        systolicMmHg: payload.systolicMmHg,
        diastolicMmHg: payload.diastolicMmHg,
        mapMmHg: Number((payload.diastolicMmHg + (payload.systolicMmHg - payload.diastolicMmHg) / 3).toFixed(1)),
        spo2Percent: payload.spo2Percent,
        respiratoryRateRpm: payload.respiratoryRateRpm,
        coreTempC: payload.coreTempC,
        bloodGlucoseMgDl: payload.bloodGlucoseMgDl,
        hydrationLiters: payload.hydrationLiters,
        sleepHours: payload.sleepHours,
        activityMinutes: payload.activityMinutes,
        stepsCount: payload.stepsCount,
        cortisolUgDl: payload.cortisolUgDl,
        boneDensityIndex: payload.boneDensityIndex,
        muscleStrengthScore: 88,
        radiationDoseMsv: payload.radiationDoseMsv,
        moodScore: payload.moodScore,
        stressScore: payload.stressScore,
        fatigueScore: payload.fatigueScore,
        isolationScore: 3,
        socialConnectionScore: 8,
        measurementMethod: payload.measurementMethod,
        sensorSource: payload.sensorSource,
        dataOrigin: payload.dataOrigin,
        dataQuality: 'ACCEPTABLE DATA QUALITY',
        qualityReason: 'Saved locally while offline; awaiting server sync.',
        assessmentStatus: 'nominal',
        notes: payload.notes,
      };
      const nextList = [optimistic, ...measurements];
      setMeasurements(nextList);
      saveOfflineCache(nextList, []);
      enqueueOfflineMutation({
        endpoint: '/api/biomedical/measurements',
        method: 'POST',
        payload,
        description: `New ${dataOrigin} measurement (${heartRateBpm} bpm)`,
      });
      refreshOfflineState();
      setFeedback({ type: 'success', text: 'Offline mode: measurement cached locally and queued for upload.' });
      setShowForm(false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/biomedical/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        setFeedback({ type: 'error', text: data.error || 'Failed to save biomedical measurement.' });
        return;
      }
      const updatedList: BiomedicalMeasurement[] = data.measurements || [];
      setMeasurements(updatedList);
      saveOfflineCache(updatedList, []);
      setFeedback({ type: 'success', text: 'New biomedical telemetry measurement saved cleanly.' });
      setShowForm(false);
    } catch {
      setFeedback({ type: 'error', text: 'Connection error while saving biomedical telemetry.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setFeedback(null);
    try {
      const res = await apiFetch(`/api/biomedical/measurements/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Failed to delete measurement record.' });
        return;
      }
      const updatedList: BiomedicalMeasurement[] = data.measurements || [];
      setMeasurements(updatedList);
      saveOfflineCache(updatedList, []);
      setFeedback({ type: 'success', text: 'Measurement record deleted.' });
    } catch {
      setFeedback({ type: 'error', text: 'Connection error deleting measurement record.' });
    }
  }

  const dateFiltered =
    dateFrom || dateTo
      ? filterMeasurementsByDateRange(measurements, 'custom', dateFrom || undefined, dateTo || undefined)
      : measurements;

  const filtered = dateFiltered.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.astronautName.toLowerCase().includes(q) ||
      m.sensorSource.toLowerCase().includes(q) ||
      m.measurementMethod.toLowerCase().includes(q) ||
      (m.notes || '').toLowerCase().includes(q) ||
      m.dataOrigin.toLowerCase().includes(q)
    );
  });

  function handleExportCsv() {
    if (filtered.length === 0) return;
    const csv = measurementsToCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kawsay-nova-measurements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    if (filtered.length === 0) return;
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records: filtered }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kawsay-nova-measurements-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const systems: Array<{ id: BioSystemFilter; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'All 6 Systems', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'cardiovascular', label: 'Cardiovascular', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'respiratory', label: 'Respiratory', icon: <Wind className="w-3.5 h-3.5" /> },
    { id: 'metabolic', label: 'Metabolic', icon: <Droplets className="w-3.5 h-3.5" /> },
    { id: 'musculoskeletal', label: 'Musculoskeletal', icon: <Dumbbell className="w-3.5 h-3.5" /> },
    { id: 'neurological', label: 'Neurological & Sleep', icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'psychological', label: 'Psychological', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#293952] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t.navBiomedical}</h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Six physiological systems with validated units, timestamps, source metadata, and export controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#293952] text-xs font-medium text-[#CBD5E1] hover:text-white flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
            Export CSV
          </button>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={handleExportJson}
            className="px-3 py-2 rounded-lg bg-[#151F30] hover:bg-[#0B1220] border border-[#293952] text-xs font-medium text-[#CBD5E1] hover:text-white flex items-center gap-1.5 disabled:opacity-40"
          >
            <FileJson className="w-3.5 h-3.5 text-[#60A5FA]" />
            Export JSON
          </button>
          {canLog && (
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setFieldErrors({});
                setFeedback(null);
                setShowForm((p) => !p);
              }}
              className="px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Record Measurement
            </button>
          )}
        </div>
      </div>

      {!canLog && (
        <div className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs text-[#CBD5E1]">
          Individual telemetry entry is restricted to Astronaut, Medical Specialist, and Administrator accounts to protect crew biomedical records.
        </div>
      )}

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-lg border text-xs ${
            feedback.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-[#1D2A3D] border border-[#38BDF8]/40 rounded-xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">
              {editingRecord ? `Edit Record #${editingRecord.id}` : 'Log New Biomedical Measurement'}
            </h2>
            <span className="text-[11px] font-mono text-[#38BDF8]">
              Units normalize automatically to SI clinical schema
            </span>
          </div>

          {!editingRecord &&
            (user.role === 'medical_specialist' || user.role === 'administrator') &&
            astronauts.length > 0 && (
              <div className="p-3.5 rounded-lg bg-[#151F30] border border-[#293952]">
                <label htmlFor="bio-target-astronaut" className="block text-[11px] text-[#CBD5E1] mb-1">
                  Target Astronaut Profile *
                </label>
                <select
                  id="bio-target-astronaut"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full sm:w-80 px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
                >
                  {astronauts.map((astro) => (
                    <option key={astro.id} value={astro.id}>
                      {astro.fullName} (@{astro.username})
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Date, Time & Origin Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 rounded-lg bg-[#151F30] border border-[#293952]">
            <div>
              <label htmlFor="bio-date" className="block text-[11px] text-[#CBD5E1] mb-1">
                Measurement Date *
              </label>
              <input
                id="bio-date"
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono text-xs"
              />
              {fieldErrors.recordedDate && (
                <p className="text-[10px] text-rose-300 mt-0.5">{fieldErrors.recordedDate}</p>
              )}
            </div>
            <div>
              <label htmlFor="bio-time" className="block text-[11px] text-[#CBD5E1] mb-1">
                Time (UTC) *
              </label>
              <input
                id="bio-time"
                type="time"
                value={recordedTime}
                onChange={(e) => setRecordedTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono text-xs"
              />
              {fieldErrors.recordedTime && (
                <p className="text-[10px] text-rose-300 mt-0.5">{fieldErrors.recordedTime}</p>
              )}
            </div>
            <div>
              <label htmlFor="bio-origin" className="block text-[11px] text-[#CBD5E1] mb-1">
                Data Origin *
              </label>
              <select
                id="bio-origin"
                value={dataOrigin}
                onChange={(e) => setDataOrigin(e.target.value as DataOrigin)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
              >
                <option value="manual_entry">Manual Entry</option>
                <option value="real_sensor">Real Sensor</option>
                <option value="calculated">Calculated</option>
                <option value="simulated_demo">Simulated Demo</option>
              </select>
            </div>
            <div>
              <label htmlFor="bio-method" className="block text-[11px] text-[#CBD5E1] mb-1">
                Measurement Method *
              </label>
              <input
                id="bio-method"
                type="text"
                value={measurementMethod}
                onChange={(e) => setMeasurementMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
              />
              {fieldErrors.measurementMethod && (
                <p className="text-[10px] text-rose-300 mt-0.5">{fieldErrors.measurementMethod}</p>
              )}
            </div>
            <div>
              <label htmlFor="bio-sensor" className="block text-[11px] text-[#CBD5E1] mb-1">
                Sensor / Device Source *
              </label>
              <input
                id="bio-sensor"
                type="text"
                value={sensorSource}
                onChange={(e) => setSensorSource(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
              />
              {fieldErrors.sensorSource && (
                <p className="text-[10px] text-rose-300 mt-0.5">{fieldErrors.sensorSource}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumInput label="Heart Rate (bpm)" value={heartRateBpm} onChange={setHeartRateBpm} error={fieldErrors.heartRateBpm} />
            <NumInput label="HRV RMSSD (ms)" value={hrvRmssdMs} onChange={setHrvRmssdMs} error={fieldErrors.hrvRmssdMs} />
            <NumInput label="Systolic (mmHg)" value={systolicMmHg} onChange={setSystolicMmHg} error={fieldErrors.systolicMmHg} />
            <NumInput label="Diastolic (mmHg)" value={diastolicMmHg} onChange={setDiastolicMmHg} error={fieldErrors.diastolicMmHg} />
            <NumInput label="SpO2 (%)" value={spo2Percent} onChange={setSpo2Percent} step="0.1" error={fieldErrors.spo2Percent} />
            <NumInput label="Resp Rate (rpm)" value={respiratoryRateRpm} onChange={setRespiratoryRateRpm} error={fieldErrors.respiratoryRateRpm} />

            {/* Core Temp with Unit Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#CBD5E1]">Core Temp</label>
                <select
                  aria-label="Core temperature unit"
                  value={tempUnit}
                  onChange={(e) => toggleTempUnit(e.target.value as 'C' | 'F')}
                  className="bg-[#151F30] border border-[#293952] rounded px-1 py-0.5 text-[10px] text-[#38BDF8] font-mono"
                >
                  <option value="C">°C</option>
                  <option value="F">°F</option>
                </select>
              </div>
              <input
                type="number"
                step="0.1"
                value={coreTempValue}
                onChange={(e) => setCoreTempValue(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono text-xs tabular-nums"
              />
              {fieldErrors.coreTempC && <p className="text-[10px] text-rose-300 mt-0.5">{fieldErrors.coreTempC}</p>}
            </div>

            {/* Blood Glucose with Unit Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#CBD5E1]">Glucose</label>
                <select
                  aria-label="Blood glucose unit"
                  value={glucoseUnit}
                  onChange={(e) => toggleGlucoseUnit(e.target.value as 'mg_dl' | 'mmol_l')}
                  className="bg-[#151F30] border border-[#293952] rounded px-1 py-0.5 text-[10px] text-[#38BDF8] font-mono"
                >
                  <option value="mg_dl">mg/dL</option>
                  <option value="mmol_l">mmol/L</option>
                </select>
              </div>
              <input
                type="number"
                step={glucoseUnit === 'mmol_l' ? '0.1' : '1'}
                value={bloodGlucoseValue}
                onChange={(e) => setBloodGlucoseValue(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono text-xs tabular-nums"
              />
              {fieldErrors.bloodGlucoseMgDl && (
                <p className="text-[10px] text-rose-300 mt-0.5">{fieldErrors.bloodGlucoseMgDl}</p>
              )}
            </div>

            {/* Hydration with Unit Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-[#CBD5E1]">Hydration</label>
                <select
                  aria-label="Hydration volume unit"
                  value={hydrationUnit}
                  onChange={(e) => toggleHydrationUnit(e.target.value as 'L' | 'oz')}
                  className="bg-[#151F30] border border-[#293952] rounded px-1 py-0.5 text-[10px] text-[#38BDF8] font-mono"
                >
                  <option value="L">L</option>
                  <option value="oz">fl oz</option>
                </select>
              </div>
              <input
                type="number"
                step="0.1"
                value={hydrationValue}
                onChange={(e) => setHydrationValue(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono text-xs tabular-nums"
              />
              {fieldErrors.hydrationLiters && (
                <p className="text-[10px] text-rose-300 mt-0.5">{fieldErrors.hydrationLiters}</p>
              )}
            </div>

            <NumInput label="Sleep (hours)" value={sleepHours} onChange={setSleepHours} step="0.1" error={fieldErrors.sleepHours} />
            <NumInput label="Activity (min)" value={activityMinutes} onChange={setActivityMinutes} error={fieldErrors.activityMinutes} />
            <NumInput label="Steps Count" value={stepsCount} onChange={setStepsCount} error={fieldErrors.stepsCount} />
            <NumInput label="Cortisol (ug/dL)" value={cortisolUgDl} onChange={setCortisolUgDl} step="0.1" error={fieldErrors.cortisolUgDl} />
            <NumInput label="Bone Index" value={boneDensityIndex} onChange={setBoneDensityIndex} step="0.01" error={fieldErrors.boneDensityIndex} />
            <NumInput label="Radiation (mSv)" value={radiationDoseMsv} onChange={setRadiationDoseMsv} step="0.01" error={fieldErrors.radiationDoseMsv} />
            <NumInput label="Mood (1-10)" value={moodScore} onChange={setMoodScore} />
            <NumInput label="Stress (1-10)" value={stressScore} onChange={setStressScore} />
            <NumInput label="Fatigue (1-10)" value={fatigueScore} onChange={setFatigueScore} />
          </div>

          <div>
            <label htmlFor="bio-notes" className="block text-[11px] text-[#CBD5E1] mb-1">
              Clinical / Mission Observations
            </label>
            <input
              id="bio-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Post-EVA, rest state, posture, or environmental context..."
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingRecord(null);
              }}
              className="px-4 py-2 rounded-lg border border-[#293952] text-xs text-[#CBD5E1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#60A5FA] text-[#0B1220] text-xs font-semibold disabled:opacity-60"
            >
              {submitting ? 'Saving Telemetry...' : editingRecord ? 'Save Changes' : 'Submit Telemetry'}
            </button>
          </div>
        </form>
      )}

      {/* System Filter Tabs + Date Range & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {systems.map((sys) => (
            <button
              key={sys.id}
              type="button"
              onClick={() => setSystemFilter(sys.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                systemFilter === sys.id
                  ? 'bg-[#38BDF8] text-[#0B1220]'
                  : 'bg-[#151F30] text-[#CBD5E1] border border-[#293952] hover:text-white'
              }`}
            >
              {sys.icon}
              <span>{sys.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Filter measurements"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sensor, method, notes..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-[#CBD5E1]">
            <span>From:</span>
            <input
              type="date"
              aria-label="Filter from date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs text-white font-mono"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[#CBD5E1]">
            <span>To:</span>
            <input
              type="date"
              aria-label="Filter to date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs text-white font-mono"
            />
          </label>
          {(dateFrom || dateTo || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#293952] text-[11px] text-[#38BDF8] hover:bg-[#151F30]"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Measurements Table */}
      <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-[#CBD5E1] py-6 text-center">
            No individual biomedical measurements match the active date filter or role scope.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#293952] text-[#CBD5E1]">
                <th className="py-2.5 pr-3">Timestamp / Crew</th>
                {(systemFilter === 'all' || systemFilter === 'cardiovascular') && (
                  <th className="py-2.5 pr-3">Cardiovascular (HR / HRV / BP / MAP)</th>
                )}
                {(systemFilter === 'all' || systemFilter === 'respiratory') && (
                  <th className="py-2.5 pr-3">Respiratory (SpO2 / RR)</th>
                )}
                {(systemFilter === 'all' || systemFilter === 'metabolic') && (
                  <th className="py-2.5 pr-3">Metabolic & Thermal</th>
                )}
                {(systemFilter === 'all' || systemFilter === 'musculoskeletal') && (
                  <th className="py-2.5 pr-3">Musculoskeletal & Rad</th>
                )}
                {(systemFilter === 'all' ||
                  systemFilter === 'neurological' ||
                  systemFilter === 'psychological') && <th className="py-2.5 pr-3">Sleep & Psych</th>}
                <th className="py-2.5 pr-3">Origin, Method & Quality</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293952]/70">
              {filtered.map((m) => {
                const origin = ORIGIN_META[m.dataOrigin] || ORIGIN_META.simulated_demo;
                return (
                  <tr key={m.id}>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-white">{m.astronautName}</div>
                      <div className="font-mono text-[11px] text-[#CBD5E1]">
                        {new Date(m.recordedAt).toISOString().slice(0, 16).replace('T', ' ')} UTC
                      </div>
                    </td>
                    {(systemFilter === 'all' || systemFilter === 'cardiovascular') && (
                      <td className="py-3 pr-3 font-mono tabular-nums text-white">
                        <div>
                          {m.heartRateBpm} bpm · RMSSD {m.hrvRmssdMs} ms
                        </div>
                        <div className="text-[11px] text-[#CBD5E1]">
                          {m.systolicMmHg}/{m.diastolicMmHg} (MAP≈{m.mapMmHg})
                        </div>
                      </td>
                    )}
                    {(systemFilter === 'all' || systemFilter === 'respiratory') && (
                      <td className="py-3 pr-3 font-mono tabular-nums text-white">
                        {m.spo2Percent}% SpO2 · {m.respiratoryRateRpm} rpm
                      </td>
                    )}
                    {(systemFilter === 'all' || systemFilter === 'metabolic') && (
                      <td className="py-3 pr-3 font-mono tabular-nums text-white">
                        <div>
                          {m.coreTempC}°C · {m.bloodGlucoseMgDl} mg/dL
                        </div>
                        <div className="text-[11px] text-[#CBD5E1]">{m.hydrationLiters} L H2O</div>
                      </td>
                    )}
                    {(systemFilter === 'all' || systemFilter === 'musculoskeletal') && (
                      <td className="py-3 pr-3 font-mono tabular-nums text-white">
                        <div>
                          Bone {m.boneDensityIndex} · {m.activityMinutes}m
                        </div>
                        <div className="text-[11px] text-[#CBD5E1]">{m.radiationDoseMsv} mSv</div>
                      </td>
                    )}
                    {(systemFilter === 'all' ||
                      systemFilter === 'neurological' ||
                      systemFilter === 'psychological') && (
                      <td className="py-3 pr-3 font-mono tabular-nums text-white">
                        <div>{m.sleepHours}h sleep</div>
                        <div className="text-[11px] text-[#CBD5E1]">
                          Mood {m.moodScore}/10 · Stress {m.stressScore}/10
                        </div>
                      </td>
                    )}
                    <td className="py-3 pr-3 space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[10px] font-mono ${origin.colorClass}`}
                      >
                        {origin.label}
                      </span>
                      <div className="text-[10px] text-[#CBD5E1]">
                        {m.sensorSource} · {m.measurementMethod}
                      </div>
                      <div className="text-[10px] font-mono text-[#38BDF8]">{m.dataQuality}</div>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {(m.userId === user.id || user.role === 'administrator') && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Edit record ${m.id}`}
                            onClick={() => startEdit(m)}
                            className="p-1.5 rounded bg-[#151F30] border border-[#293952] text-[#CBD5E1] hover:text-[#38BDF8]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete record ${m.id}`}
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 rounded bg-[#151F30] border border-[#293952] text-[#CBD5E1] hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  step = '1',
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  error?: string;
}) {
  const inputId = `bio-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
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
        className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono text-xs tabular-nums"
      />
      {error && <p className="text-[10px] text-rose-300 mt-0.5">{error}</p>}
    </div>
  );
}
