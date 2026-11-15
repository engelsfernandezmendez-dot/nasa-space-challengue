import { useEffect, useState } from 'react';
import { GitBranch, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { BiomedicalMeasurement } from '../types/kawsay';
import { analyzeResiliencePatterns } from '../utils/precisionCore';
import { apiFetch } from '../utils/authToken';

const RESILIENCE_NODES = [
  { id: 'hr', label: 'Heart Rate', x: 180, y: 60 },
  { id: 'sleep', label: 'Sleep Hours', x: 340, y: 80 },
  { id: 'stress', label: 'Stress', x: 420, y: 170 },
  { id: 'mood', label: 'Mood', x: 340, y: 255 },
  { id: 'iso', label: 'Isolation', x: 180, y: 270 },
  { id: 'act', label: 'Physical Activity', x: 70, y: 210 },
  { id: 'hyd', label: 'Hydration', x: 60, y: 115 },
  { id: 'spo2', label: 'SpO2', x: 240, y: 165 },
];

export function ResilienceEngineView() {
  const { user, t } = useAppContext();
  const [measurements, setMeasurements] = useState<BiomedicalMeasurement[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('spo2');

  useEffect(() => {
    apiFetch('/api/biomedical/overview', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.measurements) setMeasurements(d.measurements);
      })
      .catch(() => {});
  }, [user?.id]);

  const observations = analyzeResiliencePatterns(measurements);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navResilienceEngine}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Multi-indicator longitudinal pattern analysis. Co-variation reflects statistical correlation only and never implies causation or diagnosis.
        </p>
      </div>

      {/* RESILIENCE MAP Network Visualization */}
      <div className="bg-[#151F30] border border-[#293952] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <GitBranch className="w-4 h-4 text-[#38BDF8]" />
            <span>RESILIENCE MAP — Multi-System Physiological Connections</span>
          </div>
          <span className="text-[11px] font-mono text-[#38BDF8]">CORRELATION ONLY</span>
        </div>

        <svg
          viewBox="0 0 500 320"
          className="w-full max-h-72 bg-[#0B1220] rounded-xl border border-[#293952]"
          role="img"
          aria-label="Resilience multi-indicator network map"
        >
          {RESILIENCE_NODES.map((node, i) =>
            RESILIENCE_NODES.slice(i + 1).map((target) => {
              const highlight = node.id === selectedNode || target.id === selectedNode;
              return (
                <line
                  key={`${node.id}-${target.id}`}
                  x1={node.x}
                  y1={node.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={highlight ? '#38BDF8' : '#293952'}
                  strokeWidth={highlight ? '1.8' : '0.8'}
                  strokeOpacity={highlight ? 0.75 : 0.45}
                />
              );
            })
          )}
          {RESILIENCE_NODES.map((node) => {
            const active = node.id === selectedNode;
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={active ? 16 : 12}
                  fill={active ? '#38BDF8' : '#1D2A3D'}
                  stroke="#38BDF8"
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y + 27}
                  textAnchor="middle"
                  fill="#CBD5E1"
                  fontSize="10"
                  fontWeight={active ? 'bold' : 'normal'}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Longitudinal Pattern Observations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {observations.map((obs) => (
          <article
            key={obs.id}
            className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-[#38BDF8]">
              <span>
                {obs.period} · {obs.sampleCount} samples
              </span>
              <span>{obs.dataQuality}</span>
            </div>
            <h2 className="text-base font-semibold text-white">{obs.title}</h2>
            <div className="flex flex-wrap gap-1.5">
              {obs.indicators.map((ind) => (
                <span
                  key={ind}
                  className="px-2 py-0.5 rounded bg-[#151F30] border border-[#293952] text-[11px] text-[#CBD5E1]"
                >
                  {ind}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">{obs.explanation}</p>
            <div className="p-3 rounded-lg bg-[#0B1220] border border-[#293952] text-[11px] text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
              <div>
                <div>
                  <strong>Limitation:</strong> {obs.limitations}
                </div>
                <div className="text-[#CBD5E1] mt-1">
                  <strong>Additional info needed:</strong> {obs.additionalInfoNeeded}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
