import { useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, X } from 'lucide-react';
import { useAppContext, type AppView } from '../context/AppContext';

const DEMO_STEPS: Array<{
  step: number;
  title: string;
  view: AppView;
  summary: string;
  scientificNote: string;
}> = [
  {
    step: 1,
    title: 'Landing & Institutional Identity',
    view: 'about',
    summary: 'KAWSAY NOVA originates in Ayacucho, Peru as an independent aerospace biomedical monitoring proposal.',
    scientificNote: 'Not an officially NASA-approved, funded, or deployed system.',
  },
  {
    step: 2,
    title: 'Mission Control Dashboard',
    view: 'dashboard',
    summary: 'Inspect real-time role-aware telemetry indicators, alerts (icons + descriptive text), sleep, hydration, and radiation exposure.',
    scientificNote: 'Demo crew values are clearly labeled DEMO / SIMULATED DATA.',
  },
  {
    step: 3,
    title: 'Astronaut Mission Profile',
    view: 'astronaut_profile',
    summary: 'Review or edit fictional astronaut baselines, destination targets, medical history, and configured sensor inventory.',
    scientificNote: 'Separated strictly by role permissions.',
  },
  {
    step: 4,
    title: 'Biomedical Monitoring (6 Systems)',
    view: 'biomedical',
    summary: 'Record, filter, edit, or delete cardiovascular, respiratory, metabolic, musculoskeletal, neurological, and psychological metrics.',
    scientificNote: 'Distinguishes Real Sensor, Manual Entry, Calculated, and Simulated Demo origins.',
  },
  {
    step: 5,
    title: 'NOVA PRECISION CORE',
    view: 'precision_core',
    summary: 'Verify documented biomedical equations including ECG HR, RMSSD, MAP approximation, and CGM MARD.',
    scientificNote: 'Exposes formula, inputs, assumptions, limitations, and literature references.',
  },
  {
    step: 6,
    title: 'NOVA ACCURACY CONTROL',
    view: 'accuracy_control',
    summary: 'Audit technical capture quality across 4 explicit classifications from HIGH DATA QUALITY to INSUFFICIENT DATA.',
    scientificNote: 'Technical signal quality is distinct from medical certainty.',
  },
  {
    step: 7,
    title: 'NOVA DIGITAL TWIN',
    view: 'digital_twin',
    summary: 'Explore the 6-system anatomical model showing spaceflight unloading effects and physiological status.',
    scientificNote: 'Simplified educational representation of biological telemetry.',
  },
  {
    step: 8,
    title: 'NOVA RESILIENCE ENGINE',
    view: 'resilience_engine',
    summary: 'Observe longitudinal multi-indicator co-variation across sleep, heart rate, activity, hydration, and stress.',
    scientificNote: 'Correlations never imply causation or medical diagnosis.',
  },
  {
    step: 9,
    title: 'NOVA MISSION SIMULATOR',
    view: 'mission_simulator',
    summary: 'Compare hypothetical microgravity, sleep shift, CO2, and communication delay scenarios side by side.',
    scientificNote: 'SIMULATION — NOT AN ACTUAL MEDICAL MEASUREMENT OR VALIDATED INDIVIDUAL PREDICTION.',
  },
  {
    step: 10,
    title: 'NASA HRP Space Health Risks',
    view: 'space_risks',
    summary: 'Review educational guidance on the 5 major spaceflight hazards: Radiation, Isolation, Microgravity, Distance, and Closed Environments.',
    scientificNote: 'Includes public NASA/WHO/NIH scientific references.',
  },
  {
    step: 11,
    title: 'Mental Well-being & Sleep / Activity',
    view: 'mental_wellbeing',
    summary: 'Use the guided breathing pacer, non-diagnostic self-reflection check-in, and circadian exercise logs.',
    scientificNote: 'Provides self-care context, never psychological diagnoses.',
  },
  {
    step: 12,
    title: 'Medical Knowledge Center & Calendar',
    view: 'knowledge_center',
    summary: 'Search 12 verified biomedical briefs with public links and schedule daily astronaut mission health tasks.',
    scientificNote: 'Supports full task creation, completion toggles, and deletion.',
  },
  {
    step: 13,
    title: 'Health Analytics & Multilingual PDF Reports',
    view: 'reports',
    summary: 'Filter multi-indicator time-series analytics and export printable PDF clinical reports in any of 8 languages.',
    scientificNote: 'PDF headers stay synchronized with the official uploaded KAWSAY NOVA logo.',
  },
  {
    step: 14,
    title: 'NOVA AI Assistant & Universal Translator',
    view: 'universal_translator',
    summary: 'Translate formulas and biomedical terms into 8 languages including Ayacucho Quechua, and query server-side Gemini AI when configured.',
    scientificNote: 'Never simulates unconfigured AI endpoints.',
  },
  {
    step: 15,
    title: 'Global Adaptation (Ayacucho → World) & Settings',
    view: 'global_adaptation',
    summary: 'See how orbital telemetry adapts for rural Andean highlands, emergencies, extreme climates, and persistent offline clinics.',
    scientificNote: 'Includes dynamic branding & offline sync controls in Settings.',
  },
];

export function DemoTourModal() {
  const { demoTourOpen, setDemoTourOpen, setActiveView } = useAppContext();
  const [stepIdx, setStepIdx] = useState(0);

  if (!demoTourOpen) return null;

  const current = DEMO_STEPS[stepIdx];

  function jumpToStep(idx: number) {
    setStepIdx(idx);
    setActiveView(DEMO_STEPS[idx].view);
  }

  return (
    <div
      role="dialog"
      aria-label="KAWSAY NOVA 15-Step Demonstration Mode"
      className="no-print fixed bottom-5 left-5 z-50 w-full max-w-md bg-[#1D2A3D] border border-[#38BDF8]/50 rounded-xl shadow-2xl p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#38BDF8]" />
          <div>
            <div className="text-[11px] font-mono text-[#38BDF8]">
              DEMONSTRATION MODE · STEP {current.step} OF 15
            </div>
            <h3 className="text-sm font-semibold text-white">{current.title}</h3>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close demonstration guide"
          onClick={() => setDemoTourOpen(false)}
          className="p-1 rounded text-[#CBD5E1] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-[#CBD5E1] leading-relaxed">{current.summary}</p>

      <div className="p-2.5 rounded-lg bg-[#151F30] border border-[#293952] text-[11px] text-amber-300">
        {current.scientificNote}
      </div>

      <div className="w-full h-1.5 bg-[#0B1220] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#38BDF8] transition-all"
          style={{ width: `${((stepIdx + 1) / 15) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={stepIdx === 0}
          onClick={() => jumpToStep(stepIdx - 1)}
          className="px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#293952] text-xs text-white disabled:opacity-40 flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        <button
          type="button"
          onClick={() => setActiveView(current.view)}
          className="px-3 py-1.5 rounded-lg bg-[#0B1220] border border-[#38BDF8]/40 text-xs text-[#38BDF8] font-medium"
        >
          Open Screen
        </button>

        {stepIdx < DEMO_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => jumpToStep(stepIdx + 1)}
            className="px-3 py-1.5 rounded-lg bg-[#38BDF8] text-[#0B1220] text-xs font-semibold flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDemoTourOpen(false)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-[#0B1220] text-xs font-semibold"
          >
            Finish Tour
          </button>
        )}
      </div>
    </div>
  );
}
