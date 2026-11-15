import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Rocket, ShieldCheck, UserCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { AstronautMissionProfile } from '../types/kawsay';
import { apiFetch } from '../utils/authToken';

export function AstronautMissionProfileView() {
  const { user, t } = useAppContext();
  const [profiles, setProfiles] = useState<AstronautMissionProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>('view');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [age, setAge] = useState('34');
  const [missionId, setMissionId] = useState('');
  const [missionName, setMissionName] = useState('');
  const [missionPhase, setMissionPhase] = useState('Orbital Operations');
  const [missionDurationDays, setMissionDurationDays] = useState('180');
  const [missionDestination, setMissionDestination] = useState('Lunar South Pole');
  const [medicalBackground, setMedicalBackground] = useState('');
  const [healthHistory, setHealthHistory] = useState('');
  const [sensorsList, setSensorsList] = useState('Simulated Demo ECG, Optical SpO2, Tympanic Thermal');

  async function loadProfiles() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/biomedical/overview', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list: AstronautMissionProfile[] = data.missionProfiles || [];
        setProfiles(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, [user?.id]);

  if (!user) return null;

  const canManage = ['astronaut', 'medical_specialist', 'administrator'].includes(user.role);
  const activeProfile = profiles.find((p) => p.id === selectedId) || profiles[0];

  function openEdit(p: AstronautMissionProfile) {
    setFullName(p.fullName);
    setCallsign(p.callsign);
    setAge(String(p.age));
    setMissionId(p.missionId);
    setMissionName(p.missionName);
    setMissionPhase(p.missionPhase);
    setMissionDurationDays(String(p.missionDurationDays));
    setMissionDestination(p.missionDestination);
    setMedicalBackground(p.medicalBackground);
    setHealthHistory(p.healthHistory);
    setSensorsList(p.sensorsList);
    setMode('edit');
  }

  function openCreate() {
    setFullName('Dr. Mateo Quispe (Demo)');
    setCallsign('KN-ANDES-02');
    setAge('33');
    setMissionId('KN-SELENE-04');
    setMissionName('High-Altitude Lunar Analog');
    setMissionPhase('Transit');
    setMissionDurationDays('120');
    setMissionDestination('Lunar Orbit Gateway');
    setMedicalBackground('Andean hypoxia adaptation physiology baseline.');
    setHealthHistory('Cleared flight status; nominal lipid and bone panel.');
    setSensorsList('Simulated Demo Wearable Patch, Pulse Oximeter');
    setMode('create');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);
    if (!fullName.trim() || !missionId.trim() || !missionName.trim() || !missionDestination.trim()) {
      setErrorMsg('Full Name, Mission ID, Mission Name, and Destination are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await apiFetch('/api/mission-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({
            fullName: fullName.trim(),
            callsign: callsign.trim(),
            age: Number(age),
            missionId: missionId.trim(),
            missionName: missionName.trim(),
            missionPhase: missionPhase.trim(),
            missionDurationDays: Number(missionDurationDays),
            missionDestination: missionDestination.trim(),
            medicalBackground: medicalBackground.trim(),
            healthHistory: healthHistory.trim(),
            sensorsList: sensorsList.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrorMsg(data.error || 'Unable to create mission profile.');
          return;
        }
        setProfiles(data.missionProfiles || []);
        if (data.createdProfileId) {
          setSelectedId(data.createdProfileId);
        } else if (data.missionProfiles?.[0]) {
          setSelectedId(data.missionProfiles[0].id);
        }
        setStatusMsg('Fictional astronaut mission profile created.');
        setMode('view');
      } else if (mode === 'edit' && activeProfile) {
        const res = await apiFetch(`/api/mission-profiles/${activeProfile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({
            fullName: fullName.trim(),
            age: Number(age),
            missionId: missionId.trim(),
            missionName: missionName.trim(),
            missionPhase: missionPhase.trim(),
            missionDurationDays: Number(missionDurationDays),
            missionDestination: missionDestination.trim(),
            medicalBackground: medicalBackground.trim(),
            healthHistory: healthHistory.trim(),
            sensorsList: sensorsList.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrorMsg(data.error || 'Unable to update mission profile.');
          return;
        }
        setProfiles(data.missionProfiles || []);
        setStatusMsg('Mission profile updated.');
        setMode('view');
      }
    } catch {
      setErrorMsg('Connection error saving mission profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#293952] pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t.navAstronautProfile}</h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Mission-level physiological baselines, destinations, and sensor configurations.
          </p>
        </div>
        {canManage && mode === 'view' && (
          <div className="flex items-center gap-2">
            {activeProfile && (
              <button
                type="button"
                onClick={() => openEdit(activeProfile)}
                className="px-3.5 py-2 rounded-lg bg-[#151F30] border border-[#293952] text-xs font-medium text-white hover:border-[#38BDF8] flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5 text-[#38BDF8]" />
                Edit Mission Profile
              </button>
            )}
            <button
              type="button"
              onClick={openCreate}
              className="px-3.5 py-2 rounded-lg bg-[#38BDF8] text-[#0B1220] text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Astronaut Profile
            </button>
          </div>
        )}
      </div>

      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{t.demoDataBanner}</span>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200"
        >
          {errorMsg}
        </div>
      )}

      {statusMsg && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200"
        >
          {statusMsg}
        </div>
      )}

      {!canManage && profiles.length === 0 && !loading && (
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 text-sm text-[#CBD5E1]">
          Individual astronaut dossiers are hidden for {user.role.replace('_', ' ')} accounts to
          preserve crew privacy and strict role separation.
        </div>
      )}

      {mode !== 'view' && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-white">
            {mode === 'create' ? 'Create Fictional Astronaut Profile' : 'Edit Mission Profile'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Full Name" value={fullName} onChange={setFullName} />
            <InputField label="Callsign" value={callsign} onChange={setCallsign} />
            <InputField label="Age" value={age} onChange={setAge} type="number" />
            <InputField label="Mission ID" value={missionId} onChange={setMissionId} />
            <InputField label="Mission Name" value={missionName} onChange={setMissionName} />
            <InputField label="Mission Phase" value={missionPhase} onChange={setMissionPhase} />
            <InputField
              label="Duration (Days)"
              value={missionDurationDays}
              onChange={setMissionDurationDays}
              type="number"
            />
            <InputField
              label="Destination"
              value={missionDestination}
              onChange={setMissionDestination}
            />
            <InputField label="Sensors Inventory" value={sensorsList} onChange={setSensorsList} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#CBD5E1] mb-1">Medical Background</label>
              <textarea
                rows={2}
                value={medicalBackground}
                onChange={(e) => setMedicalBackground(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-[#CBD5E1] mb-1">Health History</label>
              <textarea
                rows={2}
                value={healthHistory}
                onChange={(e) => setHealthHistory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode('view')}
              className="px-4 py-2 rounded-lg border border-[#293952] text-xs text-[#CBD5E1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#38BDF8] text-[#0B1220] text-xs font-semibold disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {mode === 'view' && profiles.length > 0 && activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2.5">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  p.id === activeProfile.id
                    ? 'bg-[#1D2A3D] border-[#38BDF8]'
                    : 'bg-[#151F30] border-[#293952] hover:border-[#60A5FA]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#38BDF8]">{p.callsign}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                    DEMO DATA
                  </span>
                </div>
                <div className="text-sm font-semibold text-white mt-1">{p.fullName}</div>
                <div className="text-xs text-[#CBD5E1]">
                  {p.missionId} · {p.missionDestination}
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#293952] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#151F30] border border-[#293952]">
                  <Rocket className="w-6 h-6 text-[#38BDF8]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{activeProfile.fullName}</h2>
                  <p className="text-xs text-[#CBD5E1]">
                    Callsign <span className="font-mono text-[#38BDF8]">{activeProfile.callsign}</span>{' '}
                    · Age {activeProfile.age} · {activeProfile.missionName}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                {activeProfile.missionPhase}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <StatBox label="Mission Duration" value={`${activeProfile.missionDurationDays} days`} />
              <StatBox label="Destination" value={activeProfile.missionDestination} />
              <StatBox label="Baseline HR" value={`${activeProfile.baselineHrBpm} bpm`} />
              <StatBox label="Baseline SpO2" value={`${activeProfile.baselineSpo2Pct}%`} />
              <StatBox
                label="Baseline BP"
                value={`${activeProfile.baselineSbpMmHg}/${activeProfile.baselineDbpMmHg} mmHg`}
              />
              <StatBox label="Baseline HRV" value={`${activeProfile.baselineHrvMs} ms`} />
              <StatBox label="Baseline Temp" value={`${activeProfile.baselineTempC} °C`} />
              <StatBox label="Start Date" value={activeProfile.missionStartDate} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-[#151F30] border border-[#293952] space-y-1">
                <div className="text-[#38BDF8] font-medium">Medical Background</div>
                <p className="text-[#CBD5E1] leading-relaxed">{activeProfile.medicalBackground}</p>
              </div>
              <div className="p-4 rounded-lg bg-[#151F30] border border-[#293952] space-y-1">
                <div className="text-[#38BDF8] font-medium">Configured Sensors & Origin</div>
                <p className="text-[#CBD5E1] leading-relaxed">{activeProfile.sensorsList}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const inputId = `astro-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-xs text-[#CBD5E1] mb-1">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs text-white focus:outline-none focus:border-[#38BDF8]"
      />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952]">
      <div className="text-[11px] text-[#CBD5E1]">{label}</div>
      <div className="text-sm font-semibold font-mono text-white mt-0.5 truncate">{value}</div>
    </div>
  );
}
