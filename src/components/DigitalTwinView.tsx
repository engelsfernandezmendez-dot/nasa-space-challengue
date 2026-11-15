import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BiomedicalMeasurement } from '../types/kawsay';
import { apiFetch } from '../utils/authToken';

type TwinSystemId =
  | 'cardiovascular'
  | 'respiratory'
  | 'metabolic'
  | 'musculoskeletal'
  | 'neurological'
  | 'psychological';

const SYSTEM_INFO: Record<
  TwinSystemId,
  {
    name: string;
    cy: number;
    spaceEffect: string;
    limitation: string;
  }
> = {
  cardiovascular: {
    name: 'Cardiovascular System',
    cy: 132,
    spaceEffect:
      'Cephalad fluid shift reduces plasma volume by ~10–15% early in orbital flight and alters baroreflex sensitivity.',
    limitation:
      'Simplified arterial pressure and resting heart rate indicators do not replace 12-lead ECG or echocardiographic imaging.',
  },
  respiratory: {
    name: 'Respiratory System',
    cy: 112,
    spaceEffect:
      'Absence of hydrostatic gravity alters ventilation-perfusion matching across lung zones while closed-cabin pCO2 requires continuous monitoring.',
    limitation:
      'Pulse oximetry SpO2 reflects arterial oxygenation percentage and does not directly quantify arterial CO2 partial pressure.',
  },
  metabolic: {
    name: 'Metabolic & Thermoregulatory System',
    cy: 185,
    spaceEffect:
      'Reduced convective air cooling in microgravity requires active cabin airflow to dissipate core metabolic heat during EVA/exercise.',
    limitation:
      'Interstitial CGM and hydration logs are subject to physiological lag and dietary variance.',
  },
  musculoskeletal: {
    name: 'Musculoskeletal System',
    cy: 255,
    spaceEffect:
      'Mechanical unloading accelerates trabecular bone mineral loss (~1% per month without resistive countermeasures) and postural muscle atrophy.',
    limitation:
      'Bone index tracking provides relative screening trends, not full DXA absorptiometry.',
  },
  neurological: {
    name: 'Neurological & Circadian System',
    cy: 46,
    spaceEffect:
      'Cephalad fluid shift is associated with Spaceflight-Associated Neuro-ocular Syndrome (SANS), while 90-minute orbital sunsets challenge circadian alignment.',
    limitation:
      'Sleep hour totals do not capture full polysomnographic sleep architecture.',
  },
  psychological: {
    name: 'Psychological & Behavioral Well-being',
    cy: 72,
    spaceEffect:
      'Prolonged confinement, isolation, and Earth-return communication latency impact mood, subjective fatigue, and team cohesion.',
    limitation:
      'Self-reported 1–10 scores are reflective check-ins, not clinical psychiatric evaluations.',
  },
};

export function DigitalTwinView() {
  const { user, t } = useAppContext();
  const [selectedSystem, setSelectedSystem] = useState<TwinSystemId>('cardiovascular');
  const [latest, setLatest] = useState<BiomedicalMeasurement | null>(null);

  useEffect(() => {
    apiFetch('/api/biomedical/overview', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.measurements?.[0]) setLatest(d.measurements[0]);
      })
      .catch(() => {});
  }, [user?.id]);

  const sys = SYSTEM_INFO[selectedSystem];

  function getSystemReadout(id: TwinSystemId): {
    metrics: string;
    status: 'Normal' | 'Warning' | 'Attention';
  } {
    if (!latest) {
      return {
        metrics: 'Demo educational baseline active (no personal crew record attached for this role)',
        status: 'Normal',
      };
    }
    switch (id) {
      case 'cardiovascular':
        return {
          metrics: `HR ${latest.heartRateBpm} bpm · HRV ${latest.hrvRmssdMs} ms · BP ${latest.systolicMmHg}/${latest.diastolicMmHg} mmHg`,
          status: latest.heartRateBpm > 105 ? 'Warning' : 'Normal',
        };
      case 'respiratory':
        return {
          metrics: `SpO2 ${latest.spo2Percent}% · Resp Rate ${latest.respiratoryRateRpm} breaths/min`,
          status: latest.spo2Percent < 95 ? 'Warning' : 'Normal',
        };
      case 'metabolic':
        return {
          metrics: `Temp ${latest.coreTempC}°C · Glucose ${latest.bloodGlucoseMgDl} mg/dL · Hydration ${latest.hydrationLiters} L`,
          status: latest.coreTempC > 37.8 ? 'Warning' : 'Normal',
        };
      case 'musculoskeletal':
        return {
          metrics: `Bone Index ${latest.boneDensityIndex} · Activity ${latest.activityMinutes} min · Radiation ${latest.radiationDoseMsv} mSv`,
          status: latest.boneDensityIndex < 0.96 ? 'Warning' : 'Normal',
        };
      case 'neurological':
        return {
          metrics: `Sleep ${latest.sleepHours} hrs · Cortisol ${latest.cortisolUgDl} ug/dL`,
          status: latest.sleepHours < 6 ? 'Warning' : 'Normal',
        };
      case 'psychological':
        return {
          metrics: `Mood ${latest.moodScore}/10 · Stress ${latest.stressScore}/10 · Fatigue ${latest.fatigueScore}/10`,
          status: latest.stressScore >= 7 ? 'Warning' : 'Normal',
        };
    }
  }

  const activeReadout = getSystemReadout(selectedSystem);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navDigitalTwin}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Interactive 6-system physiological model connecting biometric streams with microgravity adaptation context.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Anatomical SVG Explorer */}
        <div className="lg:col-span-5 bg-[#151F30] border border-[#293952] rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="text-xs font-mono text-[#38BDF8] flex items-center gap-1.5">
            <Cpu className="w-4 h-4" />
            SIMPLIFIED EDUCATIONAL BIOMEDICAL TWIN
          </div>

          <svg viewBox="0 0 240 360" className="w-60 h-80" role="img" aria-label="Interactive human anatomical system model">
            {/* Stylized Astronaut Silhouette */}
            <circle cx="120" cy="48" r="24" fill="#1D2A3D" stroke="#293952" strokeWidth="2" />
            <path
              d="M84 82 Q120 74 156 82 L170 185 L146 190 L142 295 L125 295 L120 210 L115 295 L98 295 L94 190 L70 185 Z"
              fill="#1D2A3D"
              stroke="#293952"
              strokeWidth="2"
            />
            {(Object.keys(SYSTEM_INFO) as TwinSystemId[]).map((id) => {
              const info = SYSTEM_INFO[id];
              const isSelected = selectedSystem === id;
              const cx = id === 'cardiovascular' ? 132 : id === 'respiratory' ? 108 : 120;
              return (
                <g
                  key={id}
                  onClick={() => setSelectedSystem(id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={cx}
                    cy={info.cy}
                    r={isSelected ? 14 : 9}
                    fill={isSelected ? '#38BDF8' : '#60A5FA'}
                    fillOpacity={isSelected ? 0.35 : 0.18}
                    stroke={isSelected ? '#38BDF8' : '#60A5FA'}
                    strokeWidth="2"
                  />
                  <circle cx={cx} cy={info.cy} r="4" fill={isSelected ? '#38BDF8' : '#CBD5E1'} />
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-2 gap-2 w-full">
            {(Object.keys(SYSTEM_INFO) as TwinSystemId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedSystem(id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                  selectedSystem === id
                    ? 'bg-[#38BDF8] text-[#0B1220] font-semibold'
                    : 'bg-[#1D2A3D] text-[#CBD5E1] border border-[#293952] hover:text-white'
                }`}
              >
                {SYSTEM_INFO[id].name.replace(' System', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Biological System Detail Card */}
        <div className="lg:col-span-7 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-[#293952] pb-4">
            <div>
              <div className="text-xs font-mono text-[#38BDF8]">ACTIVE BIOLOGICAL SYSTEM</div>
              <h2 className="text-xl font-semibold text-white mt-0.5">{sys.name}</h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono ${
                activeReadout.status === 'Normal'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
              }`}
            >
              {activeReadout.status === 'Normal' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              <span>{activeReadout.status}</span>
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#151F30] border border-[#293952] space-y-1">
            <div className="text-[11px] font-mono text-[#CBD5E1]">CURRENT TELEMETRY READOUT</div>
            <div className="text-sm font-mono text-white">{activeReadout.metrics}</div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Spaceflight Physiological Effects</h3>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">{sys.spaceEffect}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1220] border border-[#293952] flex items-start gap-2.5 text-xs text-amber-200">
            <Info className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
            <span>
              <strong>Model Limitation:</strong> {sys.limitation}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
