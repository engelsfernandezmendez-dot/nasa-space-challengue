import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BiomedicalMeasurement } from '../types/kawsay';
import { evaluateDataQuality } from '../utils/precisionCore';
import { apiFetch } from '../utils/authToken';

export function AccuracyControlView() {
  const { user, t } = useAppContext();
  const [measurements, setMeasurements] = useState<BiomedicalMeasurement[]>([]);

  // Interactive Quality Inspector State
  const [calibrated, setCalibrated] = useState(true);
  const [deviceId, setDeviceId] = useState('KN-ECG-PATCH-01');
  const [signalQualityPct, setSignalQualityPct] = useState(94);
  const [missingFieldsCount, setMissingFieldsCount] = useState(0);
  const [motionArtifactDetected, setMotionArtifactDetected] = useState(false);
  const [timestampConsistent, setTimestampConsistent] = useState(true);
  const [valuePlausible, setValuePlausible] = useState(true);
  const [repeatedConsistent, setRepeatedConsistent] = useState(true);

  useEffect(() => {
    apiFetch('/api/biomedical/overview', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.measurements) setMeasurements(d.measurements);
      })
      .catch(() => {});
  }, [user?.id]);

  const evaluation = evaluateDataQuality({
    calibrated,
    deviceId,
    signalQualityPct,
    missingFieldsCount,
    motionArtifactDetected,
    timestampConsistent,
    valuePlausible,
    repeatedConsistent,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navAccuracyControl}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Signal-to-noise quality governance across 4 classification tiers. High technical quality never implies medical certainty.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Quality Evaluator */}
        <div className="lg:col-span-6 bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Interactive Capture Quality Auditor</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#CBD5E1] mb-1">Sensor / Device ID</label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1">
                Signal Quality ({signalQualityPct}%)
              </label>
              <input
                type="range"
                min={20}
                max={100}
                value={signalQualityPct}
                onChange={(e) => setSignalQualityPct(Number(e.target.value))}
                className="w-full accent-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1">Missing Required Fields</label>
              <input
                type="number"
                min={0}
                max={5}
                value={missingFieldsCount}
                onChange={(e) => setMissingFieldsCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <ToggleCheck label="Sensor calibrated" checked={calibrated} onChange={setCalibrated} />
            <ToggleCheck
              label="Motion artifact detected"
              checked={motionArtifactDetected}
              onChange={setMotionArtifactDetected}
            />
            <ToggleCheck
              label="Timestamp sequence valid"
              checked={timestampConsistent}
              onChange={setTimestampConsistent}
            />
            <ToggleCheck
              label="Physiologically plausible"
              checked={valuePlausible}
              onChange={setValuePlausible}
            />
            <ToggleCheck
              label="Consistent with repeated check"
              checked={repeatedConsistent}
              onChange={setRepeatedConsistent}
            />
          </div>
        </div>

        {/* Result Card */}
        <div className="lg:col-span-6 bg-[#151F30] border border-[#293952] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#CBD5E1]">CLASSIFICATION RESULT</span>
            <span className="text-sm font-mono font-bold text-[#38BDF8]">
              Score: {evaluation.score}/100
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              evaluation.label === 'HIGH DATA QUALITY'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : evaluation.label === 'ACCEPTABLE DATA QUALITY'
                  ? 'bg-sky-950/50 border-sky-500/40 text-sky-200'
                  : evaluation.label === 'LOW DATA QUALITY'
                    ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
            }`}
          >
            {evaluation.label === 'HIGH DATA QUALITY' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : evaluation.label === 'ACCEPTABLE DATA QUALITY' ? (
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            ) : evaluation.label === 'LOW DATA QUALITY' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-mono font-bold text-sm">{evaluation.label}</div>
              <p className="text-xs leading-relaxed">{evaluation.guidance}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-white">Audit Criteria Findings:</div>
            <ul className="space-y-1 text-xs text-[#CBD5E1]">
              {evaluation.reasons.map((r, idx) => (
                <li key={idx}>• {r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Stored Measurements Audit Table */}
      {measurements.length > 0 && (
        <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-3 overflow-x-auto">
          <h3 className="text-base font-semibold text-white">Authorized Telemetry Audit Trail</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#293952] text-[#CBD5E1]">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Sensor Source</th>
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Quality Classification</th>
                <th className="py-2">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293952]/70">
              {measurements.slice(0, 8).map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 pr-3 font-mono text-[#CBD5E1]">
                    {new Date(m.recordedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 pr-3 text-white">{m.sensorSource}</td>
                  <td className="py-2.5 pr-3 text-[#CBD5E1]">{m.measurementMethod}</td>
                  <td className="py-2.5 pr-3 font-mono text-[#38BDF8]">{m.dataQuality}</td>
                  <td className="py-2.5 text-[#CBD5E1]">{m.qualityReason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ToggleCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#151F30] border border-[#293952] cursor-pointer">
      <span className="text-[#CBD5E1]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#38BDF8]"
      />
    </label>
  );
}
