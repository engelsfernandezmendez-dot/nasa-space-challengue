import { useState } from 'react';
import { AlertTriangle, FlaskConical } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { runMissionSimulation, type SimulationParams } from '../utils/precisionCore';

export function MissionSimulatorView() {
  const { t } = useAppContext();

  const [scenarioA, setScenarioA] = useState<SimulationParams>({
    microgravityWeeks: 12,
    sleepShiftHours: 1.5,
    isolationLevel: 4,
    workloadIntensity: 6,
    cabinCo2MmHg: 2.3,
    commDelayMinutes: 0,
    missionPhase: 'LEO Transit',
  });

  const [scenarioB, setScenarioB] = useState<SimulationParams>({
    microgravityWeeks: 36,
    sleepShiftHours: 3.5,
    isolationLevel: 8,
    workloadIntensity: 8,
    cabinCo2MmHg: 4.1,
    commDelayMinutes: 14,
    missionPhase: 'Mars Cruise',
  });

  const outA = runMissionSimulation(scenarioA);
  const outB = runMissionSimulation(scenarioB);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navMissionSimulator}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Interactive What-If Mission Explorer comparing orbital, lunar, and deep-space stressor profiles.
        </p>
      </div>

      {/* Mandatory High-Visibility Simulation Disclaimer */}
      <div
        role="note"
        className="p-4 rounded-xl bg-amber-950/40 border border-amber-400/50 text-xs sm:text-sm text-amber-200 font-semibold flex items-center gap-3"
      >
        <AlertTriangle className="w-5 h-5 text-[#FACC15] shrink-0" />
        <span>{t.simulationBanner}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScenarioPanel
          title="Scenario A (Baseline Reference Mission)"
          params={scenarioA}
          onChange={setScenarioA}
          output={outA}
        />
        <ScenarioPanel
          title="Scenario B (Extended Stress What-If)"
          params={scenarioB}
          onChange={setScenarioB}
          output={outB}
        />
      </div>
    </div>
  );
}

function ScenarioPanel({
  title,
  params,
  onChange,
  output,
}: {
  title: string;
  params: SimulationParams;
  onChange: (p: SimulationParams) => void;
  output: ReturnType<typeof runMissionSimulation>;
}) {
  return (
    <div className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-[#293952] pb-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-[#38BDF8]" />
          <span>{title}</span>
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40">
          SIMULATION
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[#CBD5E1] mb-1">Mission Phase</label>
          <select
            value={params.missionPhase}
            onChange={(e) =>
              onChange({ ...params, missionPhase: e.target.value as SimulationParams['missionPhase'] })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-white"
          >
            <option value="LEO Transit">LEO Transit</option>
            <option value="Lunar Surface">Lunar Surface</option>
            <option value="Mars Cruise">Mars Cruise</option>
            <option value="EVA Operations">EVA Operations</option>
          </select>
        </div>

        <SliderField
          label={`Microgravity (${params.microgravityWeeks} wks)`}
          min={1}
          max={52}
          step={1}
          value={params.microgravityWeeks}
          onChange={(v) => onChange({ ...params, microgravityWeeks: v })}
        />
        <SliderField
          label={`Sleep Shift (${params.sleepShiftHours} h)`}
          min={0}
          max={6}
          step={0.5}
          value={params.sleepShiftHours}
          onChange={(v) => onChange({ ...params, sleepShiftHours: v })}
        />
        <SliderField
          label={`Isolation (${params.isolationLevel}/10)`}
          min={1}
          max={10}
          step={1}
          value={params.isolationLevel}
          onChange={(v) => onChange({ ...params, isolationLevel: v })}
        />
        <SliderField
          label={`Cabin CO2 (${params.cabinCo2MmHg.toFixed(1)} mmHg)`}
          min={1.5}
          max={6.0}
          step={0.1}
          value={params.cabinCo2MmHg}
          onChange={(v) => onChange({ ...params, cabinCo2MmHg: v })}
        />
        <SliderField
          label={`Comm Delay (${params.commDelayMinutes} min)`}
          min={0}
          max={22}
          step={1}
          value={params.commDelayMinutes}
          onChange={(v) => onChange({ ...params, commDelayMinutes: v })}
        />
      </div>

      <div className="p-3 rounded-lg bg-[#151F30] border border-[#293952] text-[11px] font-mono text-[#38BDF8]">
        {output.conditionSummary}
      </div>

      <div className="space-y-2.5">
        {output.affectedIndicators.map((ind) => (
          <div
            key={ind.indicator}
            className="p-3 rounded-lg bg-[#0B1220] border border-[#293952] text-xs space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white">{ind.indicator}</span>
              <span className="font-mono text-[#38BDF8]">{ind.projectedShift}</span>
            </div>
            <p className="text-[11px] text-[#CBD5E1]">{ind.rationale}</p>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-[#293952]">
        <p>
          <strong className="text-white">Considerations:</strong> {output.physiologicalConsiderations}
        </p>
        <p>
          <strong className="text-white">Background:</strong> {output.scientificBackground}
        </p>
        <p className="text-amber-300">
          <strong>Limitations:</strong> {output.limitations}
        </p>
      </div>
    </div>
  );
}

function SliderField({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[#CBD5E1] mb-1">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#38BDF8]"
      />
    </div>
  );
}
