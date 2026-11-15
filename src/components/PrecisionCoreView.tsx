import { useState } from 'react';
import { BookOpenCheck, Calculator } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  calculateBodyMassIndex,
  calculateEcgHeartRate,
  calculateGlucoseMard,
  calculateHydrationBaseline,
  calculateMapApprox,
  calculatePulsePressure,
  calculateRmssd,
  type ScientificCalculationResult,
} from '../utils/precisionCore';

export function PrecisionCoreView() {
  const { t } = useAppContext();

  const [rrInput, setRrInput] = useState('880, 910, 895, 920, 875, 905, 890, 915, 885, 900');
  const [sbp, setSbp] = useState('118');
  const [dbp, setDbp] = useState('76');
  const [cgmPairsInput, setCgmPairsInput] = useState('96:92, 108:104, 88:91, 114:110');
  const [massKg, setMassKg] = useState('68');
  const [heightCm, setHeightCm] = useState('172');
  const [activityMin, setActivityMin] = useState('60');

  const rrArray = rrInput
    .split(/[\s,]+/)
    .map((v) => Number(v.trim()))
    .filter((v) => !Number.isNaN(v));

  const pairs = cgmPairsInput
    .split(',')
    .map((chunk) => chunk.trim().split(':').map(Number))
    .filter(([s, r]) => Number.isFinite(s) && Number.isFinite(r) && r > 0)
    .map(([sensorMgDl, referenceMgDl]) => ({ sensorMgDl, referenceMgDl }));

  const results: ScientificCalculationResult[] = [
    calculateEcgHeartRate(rrArray),
    calculateRmssd(rrArray),
    calculateMapApprox(Number(sbp), Number(dbp)),
    calculatePulsePressure(Number(sbp), Number(dbp)),
    calculateGlucoseMard(pairs),
    calculateBodyMassIndex(Number(massKg), Number(heightCm)),
    calculateHydrationBaseline(Number(massKg), Number(activityMin)),
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#293952] pb-4">
        <h1 className="text-2xl font-semibold text-white">{t.navPrecisionCore}</h1>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Transparent, peer-reviewed biomedical calculations. No black-box formulas or invented clinical equations.
        </p>
      </div>

      {/* Interactive Equation Inputs */}
      <div className="bg-[#151F30] border border-[#293952] rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <label htmlFor="pc-rr" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            ECG R–R / NN Intervals (ms, comma-separated)
          </label>
          <input
            id="pc-rr"
            type="text"
            value={rrInput}
            onChange={(e) => setRrInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white focus:outline-none focus:border-[#38BDF8]"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Valid sinus range: 300–2000 ms (min 3 for HR, 5 for RMSSD).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pc-sbp" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Systolic BP (mmHg)
            </label>
            <input
              id="pc-sbp"
              type="number"
              value={sbp}
              onChange={(e) => setSbp(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <div>
            <label htmlFor="pc-dbp" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Diastolic BP (mmHg)
            </label>
            <input
              id="pc-dbp"
              type="number"
              value={dbp}
              onChange={(e) => setDbp(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pc-cgm" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
            CGM Sensor:Reference Pairs (mg/dL)
          </label>
          <input
            id="pc-cgm"
            type="text"
            value={cgmPairsInput}
            onChange={(e) => setCgmPairsInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
          />
          <p className="text-[11px] text-slate-400 mt-1">Format: sensor:reference, e.g. 96:92</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="pc-mass" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Mass (kg)
            </label>
            <input
              id="pc-mass"
              type="number"
              value={massKg}
              onChange={(e) => setMassKg(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <div>
            <label htmlFor="pc-height" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Height (cm)
            </label>
            <input
              id="pc-height"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
          <div>
            <label htmlFor="pc-act" className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Exer (min)
            </label>
            <input
              id="pc-act"
              type="number"
              value={activityMin}
              onChange={(e) => setActivityMin(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-[#0B1220] border border-[#293952] text-xs font-mono text-white"
            />
          </div>
        </div>
      </div>

      {/* Audited Calculation Output Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((item) => (
          <article
            key={item.id}
            className="bg-[#1D2A3D] border border-[#293952] rounded-xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#293952] pb-3">
              <div>
                <div className="text-[11px] font-mono text-[#38BDF8] flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{item.validationStatus.toUpperCase()}</span>
                </div>
                <h2 className="text-lg font-semibold text-white mt-0.5">{item.name}</h2>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono tabular-nums text-white">
                  {item.outputValue}{' '}
                  <span className="text-xs font-normal text-[#38BDF8]">
                    {item.outputValue === 'Insufficient Data' ? '' : item.units}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#CBD5E1]">{item.dataQuality}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0B1220] border border-[#293952] font-mono text-xs text-[#38BDF8]">
              Formula: {item.formula}
            </div>

            <div className="text-xs space-y-2 text-[#CBD5E1]">
              <p>
                <strong className="text-white">Inputs:</strong> {item.inputsSummary}
              </p>
              <p>
                <strong className="text-white">Explanation:</strong> {item.explanation}
              </p>
              <p>
                <strong className="text-white">Assumptions:</strong> {item.assumptions}
              </p>
              <p className="text-amber-300">
                <strong>Limitations:</strong> {item.limitations}
              </p>
            </div>

            <div className="pt-2 border-t border-[#293952] text-[11px] text-slate-300 flex items-start gap-1.5">
              <BookOpenCheck className="w-3.5 h-3.5 text-[#60A5FA] shrink-0 mt-0.5" />
              <span>Reference: {item.reference}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
