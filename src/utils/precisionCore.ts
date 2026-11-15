import type { BiomedicalMeasurement, DataQualityLabel } from '../types/kawsay';

export interface ScientificCalculationResult {
  id: string;
  name: string;
  formula: string;
  inputsSummary: string;
  outputValue: string;
  units: string;
  explanation: string;
  assumptions: string;
  limitations: string;
  dataQuality: DataQualityLabel;
  validationStatus: 'Validated Equation' | 'Approximation' | 'Insufficient Input';
  reference: string;
}

export function calculateEcgHeartRate(rrIntervalsMs: number[]): ScientificCalculationResult {
  const valid = rrIntervalsMs.filter((v) => Number.isFinite(v) && v >= 300 && v <= 2000);
  if (valid.length < 3) {
    return {
      id: 'ecg-hr',
      name: 'ECG-Derived Heart Rate',
      formula: 'HR = 60 / mean(RR_seconds)',
      inputsSummary: `${valid.length} valid RR intervals (minimum 3 required)`,
      outputValue: 'Insufficient Data',
      units: 'bpm',
      explanation: 'At least 3 artifact-free RR intervals (300–2000 ms) are needed to compute mean RR.',
      assumptions: 'Regular sinus rhythm across recording window.',
      limitations: 'Short windows may not capture transient arrhythmia or motion artifacts.',
      dataQuality: 'INSUFFICIENT DATA',
      validationStatus: 'Insufficient Input',
      reference: 'Task Force of ESC & NASPE (1996), Circulation 93(5):1043–1065.',
    };
  }

  const meanRrSec = valid.reduce((a, b) => a + b, 0) / valid.length / 1000;
  const hr = 60 / meanRrSec;
  return {
    id: 'ecg-hr',
    name: 'ECG-Derived Heart Rate',
    formula: 'HR = 60 / mean(RR_seconds)',
    inputsSummary: `${valid.length} RR intervals · Mean RR = ${meanRrSec.toFixed(3)} s`,
    outputValue: hr.toFixed(1),
    units: 'bpm',
    explanation: 'Computes instantaneous ventricular rate from the reciprocal of mean beat-to-beat RR duration.',
    assumptions: 'Each detected R-peak represents a normal supraventricular beat.',
    limitations: 'Ectopic beats or R-wave misdetection shift the mean RR interval.',
    dataQuality: valid.length >= 10 ? 'HIGH DATA QUALITY' : 'ACCEPTABLE DATA QUALITY',
    validationStatus: 'Validated Equation',
    reference: 'Task Force of ESC & NASPE (1996), Circulation 93(5):1043–1065.',
  };
}

export function calculateRmssd(nnIntervalsMs: number[]): ScientificCalculationResult {
  const valid = nnIntervalsMs.filter((v) => Number.isFinite(v) && v >= 300 && v <= 2000);
  const artifactCount = nnIntervalsMs.length - valid.length;
  if (valid.length < 5) {
    return {
      id: 'hrv-rmssd',
      name: 'Heart Rate Variability (RMSSD)',
      formula: 'RMSSD = sqrt( mean( (NN_{i+1} - NN_i)^2 ) )',
      inputsSummary: `${valid.length} normal-to-normal intervals (${artifactCount} rejected)`,
      outputValue: 'Insufficient Data',
      units: 'ms',
      explanation: 'Requires at least 5 consecutive artifact-free NN intervals to compute successive differences.',
      assumptions: 'Stationary autonomic state during short-term recording.',
      limitations: 'Standard ultra-short-term HRV reliability improves significantly at >= 60 s recordings.',
      dataQuality: 'INSUFFICIENT DATA',
      validationStatus: 'Insufficient Input',
      reference: 'Shaffer & Ginsberg (2017), Frontiers in Public Health 5:258.',
    };
  }

  let sumSq = 0;
  for (let i = 0; i < valid.length - 1; i++) {
    const diff = valid[i + 1] - valid[i];
    sumSq += diff * diff;
  }
  const rmssd = Math.sqrt(sumSq / (valid.length - 1));
  return {
    id: 'hrv-rmssd',
    name: 'Heart Rate Variability (RMSSD)',
    formula: 'RMSSD = sqrt( mean( (NN_{i+1} - NN_i)^2 ) )',
    inputsSummary: `${valid.length} NN intervals (${artifactCount} artifacts excluded)`,
    outputValue: rmssd.toFixed(1),
    units: 'ms',
    explanation: 'Quantifies beat-to-beat parasympathetic (vagal) modulation across successive normal intervals.',
    assumptions: 'Non-sinus ectopic intervals have been filtered prior to computation.',
    limitations: 'Short segments (<5 min) are sensitive to respiratory rate and posture.',
    dataQuality: artifactCount === 0 && valid.length >= 10 ? 'HIGH DATA QUALITY' : 'ACCEPTABLE DATA QUALITY',
    validationStatus: 'Validated Equation',
    reference: 'Shaffer & Ginsberg (2017), Frontiers in Public Health 5:258.',
  };
}

export function calculateMapApprox(sbpMmHg: number, dbpMmHg: number): ScientificCalculationResult {
  if (!Number.isFinite(sbpMmHg) || !Number.isFinite(dbpMmHg) || sbpMmHg <= dbpMmHg || dbpMmHg <= 20) {
    return {
      id: 'map-approx',
      name: 'Mean Arterial Pressure (Approximation)',
      formula: 'MAP ≈ DBP + (SBP - DBP) / 3',
      inputsSummary: `SBP=${sbpMmHg} mmHg, DBP=${dbpMmHg} mmHg`,
      outputValue: 'Insufficient Data',
      units: 'mmHg',
      explanation: 'Valid systolic (> diastolic) and diastolic pressures are required.',
      assumptions: 'Resting heart rate ~60 bpm (systole ~1/3 of cardiac cycle).',
      limitations: 'Cannot independently determine SBP or DBP from MAP.',
      dataQuality: 'INSUFFICIENT DATA',
      validationStatus: 'Insufficient Input',
      reference: 'Hall & Hall, Guyton and Hall Textbook of Medical Physiology.',
    };
  }

  const map = dbpMmHg + (sbpMmHg - dbpMmHg) / 3;
  return {
    id: 'map-approx',
    name: 'Mean Arterial Pressure (Approximation)',
    formula: 'MAP ≈ DBP + (SBP - DBP) / 3',
    inputsSummary: `SBP = ${sbpMmHg} mmHg · DBP = ${dbpMmHg} mmHg`,
    outputValue: map.toFixed(1),
    units: 'mmHg',
    explanation: 'Approximates time-averaged arterial perfusion pressure assuming a 1:2 systole-to-diastole ratio.',
    assumptions: 'Resting heart rate near 60 bpm. Tachycardia alters the systolic fraction.',
    limitations: 'Approximation only. Never use this formula to derive SBP or DBP independently.',
    dataQuality: 'HIGH DATA QUALITY',
    validationStatus: 'Approximation',
    reference: 'Hall & Hall, Guyton and Hall Textbook of Medical Physiology.',
  };
}

export function calculateGlucoseMard(
  pairs: Array<{ sensorMgDl: number; referenceMgDl: number }>
): ScientificCalculationResult {
  const valid = pairs.filter(
    (p) => Number.isFinite(p.sensorMgDl) && Number.isFinite(p.referenceMgDl) && p.referenceMgDl > 0
  );
  if (valid.length === 0) {
    return {
      id: 'glucose-mard',
      name: 'CGM Mean Absolute Relative Difference (MARD)',
      formula: 'MARD = mean( |Sensor - Reference| / Reference ) × 100%',
      inputsSummary: '0 paired sensor/reference glucose samples',
      outputValue: 'Insufficient Data',
      units: '%',
      explanation: 'Paired CGM sensor and reference blood glucose values are required.',
      assumptions: 'Paired timestamps fall within physiological lag tolerances.',
      limitations: 'MARD is an aggregate measurement accuracy metric, not a guarantee of clinical accuracy.',
      dataQuality: 'INSUFFICIENT DATA',
      validationStatus: 'Insufficient Input',
      reference: 'Reiterer et al. (2017), Journal of Diabetes Science and Technology 11(1):59–67.',
    };
  }

  const sumPct = valid.reduce(
    (acc, p) => acc + (Math.abs(p.sensorMgDl - p.referenceMgDl) / p.referenceMgDl) * 100,
    0
  );
  const mard = sumPct / valid.length;
  return {
    id: 'glucose-mard',
    name: 'CGM Mean Absolute Relative Difference (MARD)',
    formula: 'MARD = mean( |Sensor - Reference| / Reference ) × 100%',
    inputsSummary: `${valid.length} paired CGM-to-reference samples`,
    outputValue: mard.toFixed(2),
    units: '%',
    explanation: 'Quantifies mean relative deviation of interstitial CGM sensor readings against a calibrated reference.',
    assumptions: 'Minimal rapid glycemic rate-of-change lag at sampling times.',
    limitations: 'MARD is a statistical accuracy metric and does not guarantee clinical accuracy at individual points.',
    dataQuality: valid.length >= 3 ? 'HIGH DATA QUALITY' : 'ACCEPTABLE DATA QUALITY',
    validationStatus: 'Validated Equation',
    reference: 'Reiterer et al. (2017), Journal of Diabetes Science and Technology 11(1):59–67.',
  };
}

export interface DataQualityInput {
  calibrated: boolean;
  deviceId: string;
  signalQualityPct: number;
  missingFieldsCount: number;
  motionArtifactDetected: boolean;
  timestampConsistent: boolean;
  valuePlausible: boolean;
  repeatedConsistent: boolean;
}

export function evaluateDataQuality(input: DataQualityInput): {
  label: DataQualityLabel;
  score: number;
  reasons: string[];
  guidance: string;
} {
  const reasons: string[] = [];

  if (!input.deviceId.trim() || input.missingFieldsCount >= 3 || !input.timestampConsistent) {
    if (!input.deviceId.trim()) reasons.push('Missing sensor or device identification.');
    if (input.missingFieldsCount >= 3) reasons.push(`${input.missingFieldsCount} required fields missing.`);
    if (!input.timestampConsistent) reasons.push('Timestamp sequence inconsistency detected.');
    return {
      label: 'INSUFFICIENT DATA',
      score: 25,
      reasons,
      guidance: 'INSUFFICIENT DATA — Provide complete sensor metadata and valid synchronized timestamps.',
    };
  }

  let score = 100;
  if (!input.calibrated) {
    score -= 25;
    reasons.push('Sensor calibration is overdue or unverified.');
  }
  if (input.signalQualityPct < 70) {
    score -= 30;
    reasons.push(`Signal-to-noise quality is low (${input.signalQualityPct}%).`);
  } else if (input.signalQualityPct < 88) {
    score -= 12;
    reasons.push(`Moderate signal quality (${input.signalQualityPct}%).`);
  }
  if (input.motionArtifactDetected) {
    score -= 22;
    reasons.push('Motion artifact interference detected during capture.');
  }
  if (!input.valuePlausible) {
    score -= 40;
    reasons.push('Recorded value approaches physiological plausibility boundary.');
  }
  if (!input.repeatedConsistent) {
    score -= 15;
    reasons.push('Deviation from recent repeated baseline measurements.');
  }
  if (input.missingFieldsCount > 0) {
    score -= input.missingFieldsCount * 8;
    reasons.push(`${input.missingFieldsCount} secondary field(s) omitted.`);
  }

  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 85) {
    if (reasons.length === 0) reasons.push('Calibrated sensor, stable signal, plausible and consistent capture.');
    return {
      label: 'HIGH DATA QUALITY',
      score: clamped,
      reasons,
      guidance: 'HIGH DATA QUALITY — Measurement meets technical capture criteria. Note: technical quality is not medical certainty.',
    };
  }
  if (clamped >= 60) {
    return {
      label: 'ACCEPTABLE DATA QUALITY',
      score: clamped,
      reasons,
      guidance: 'ACCEPTABLE DATA QUALITY — Usable for trend observation; verify sensor contact on next scheduled check.',
    };
  }
  return {
    label: 'LOW DATA QUALITY',
    score: clamped,
    reasons,
    guidance: 'LOW DATA QUALITY — Please repeat the measurement or check the sensor.',
  };
}

export interface ResilienceObservation {
  id: string;
  title: string;
  indicators: string[];
  period: string;
  sampleCount: number;
  dataQuality: DataQualityLabel;
  explanation: string;
  limitations: string;
  additionalInfoNeeded: string;
}

export function analyzeResiliencePatterns(records: BiomedicalMeasurement[]): ResilienceObservation[] {
  if (records.length < 2) {
    return [
      {
        id: 'res-insufficient',
        title: 'Insufficient Longitudinal History for Multi-Indicator Patterning',
        indicators: ['Heart Rate', 'Sleep Duration', 'Physical Activity', 'Stress'],
        period: 'Current Session',
        sampleCount: records.length,
        dataQuality: 'INSUFFICIENT DATA',
        explanation: 'At least 2 longitudinal records are required to observe multi-indicator co-variation.',
        limitations: 'Observations reflect correlations only and never prove causation or medical diagnoses.',
        additionalInfoNeeded: 'Continue scheduled biomedical and sleep/activity logging across consecutive days.',
      },
    ];
  }

  const latest = records[0];
  const avgSleep = records.reduce((s, r) => s + r.sleepHours, 0) / records.length;
  const avgHr = records.reduce((s, r) => s + r.heartRateBpm, 0) / records.length;
  const observations: ResilienceObservation[] = [];

  if (latest.sleepHours < 6.5 || latest.stressScore >= 6 || latest.heartRateBpm > avgHr + 6) {
    observations.push({
      id: 'res-sleep-hr-stress',
      title: 'Co-variation Observed Across Sleep Duration, Heart Rate, and Subjective Stress',
      indicators: ['Sleep Duration', 'Resting Heart Rate', 'HRV (RMSSD)', 'Stress Score'],
      period: `${new Date(records[records.length - 1].recordedAt).toLocaleDateString()} – ${new Date(latest.recordedAt).toLocaleDateString()}`,
      sampleCount: records.length,
      dataQuality: latest.dataQuality,
      explanation: `Changes in sleep duration (${latest.sleepHours.toFixed(1)} h vs. mean ${avgSleep.toFixed(1)} h), resting heart rate (${latest.heartRateBpm} bpm), and stress rating (${latest.stressScore}/10) have been observed together. Additional assessment may be useful.`,
      limitations: 'Observed statistical co-variation does NOT establish causation and is not a clinical diagnosis.',
      additionalInfoNeeded: 'Confirm sleep hygiene logs, caffeine/hydration intake, and scheduled flight-surgeon review.',
    });
  }

  observations.push({
    id: 'res-activity-recovery',
    title: 'Physical Activity, Hydration, and Cardiovascular Recovery Relationship',
    indicators: ['Activity Minutes', 'Hydration (L)', 'HRV (RMSSD)', 'Fatigue Score'],
    period: `${records.length} logged cycles`,
    sampleCount: records.length,
    dataQuality: latest.dataQuality,
    explanation: `Recent physical activity (${latest.activityMinutes} min) alongside hydration intake (${latest.hydrationLiters.toFixed(1)} L) and fatigue score (${latest.fatigueScore}/10) provides baseline context for resistive countermeasure planning.`,
    limitations: 'Self-reported fatigue and fluid intake alone do not fully quantify total body hydration status.',
    additionalInfoNeeded: 'Electrolyte balance, urine specific gravity, and ambient cabin humidity logs.',
  });

  return observations;
}

export interface SimulationParams {
  microgravityWeeks: number;
  sleepShiftHours: number;
  isolationLevel: number; // 1-10
  workloadIntensity: number; // 1-10
  cabinCo2MmHg: number; // nominal ~2.0, elevated >4.0
  commDelayMinutes: number; // 0 for LEO, up to 22 for Mars
  missionPhase: 'LEO Transit' | 'Lunar Surface' | 'Mars Cruise' | 'EVA Operations';
}

export interface SimulationOutput {
  disclaimer: string;
  conditionSummary: string;
  affectedSystems: string[];
  affectedIndicators: Array<{ indicator: string; projectedShift: string; rationale: string }>;
  physiologicalConsiderations: string;
  scientificBackground: string;
  limitations: string;
}

export function runMissionSimulation(params: SimulationParams): SimulationOutput {
  const boneShiftPct = -(params.microgravityWeeks * 0.12).toFixed(1);
  const hrShiftBpm = Math.round(params.sleepShiftHours * 1.4 + (params.workloadIntensity - 5) * 1.2);
  const stressShift = Number(
    (params.isolationLevel * 0.35 + params.commDelayMinutes * 0.08 + params.sleepShiftHours * 0.4).toFixed(1)
  );
  const respShift = Number(((params.cabinCo2MmHg - 2.0) * 1.1).toFixed(1));

  return {
    disclaimer: 'SIMULATION — NOT AN ACTUAL MEDICAL MEASUREMENT OR VALIDATED INDIVIDUAL PREDICTION.',
    conditionSummary: `${params.missionPhase} · ${params.microgravityWeeks} weeks microgravity · ${params.sleepShiftHours}h circadian shift · ${params.commDelayMinutes} min one-way comm delay · CO2 ${params.cabinCo2MmHg.toFixed(1)} mmHg`,
    affectedSystems: [
      'Musculoskeletal System',
      'Cardiovascular & Autonomic System',
      'Respiratory System',
      'Neurobehavioral & Circadian System',
    ],
    affectedIndicators: [
      {
        indicator: 'Bone Mineral Density Index',
        projectedShift: `${boneShiftPct}% hypothetical shift without countermeasures`,
        rationale: 'Unloading in reduced gravity reduces osteoblastic mechanical stimulus over multi-week exposure.',
      },
      {
        indicator: 'Resting Heart Rate',
        projectedShift: `${hrShiftBpm >= 0 ? '+' : ''}${hrShiftBpm} bpm hypothetical offset`,
        rationale: 'Circadian misalignment and high operational workload are associated with sympathetic tone shifts.',
      },
      {
        indicator: 'Respiratory Rate',
        projectedShift: `${respShift >= 0 ? '+' : ''}${respShift} breaths/min hypothetical offset`,
        rationale: 'Elevated closed-cabin pCO2 increases chemoreceptor ventilatory drive.',
      },
      {
        indicator: 'Subjective Stress / Isolation Load',
        projectedShift: `+${stressShift} index units`,
        rationale: 'Prolonged confinement and Earth-return communication latency increase autonomous crew stress load.',
      },
    ],
    physiologicalConsiderations:
      'Fluid cephalad shift, circadian phase drift, resistive exercise countermeasure adherence, and closed-loop atmospheric CO2 scrubbing should be monitored across long-duration profiles.',
    scientificBackground:
      'Model trends reflect published aerospace physiology observations (NASA Human Research Program Evidence Reports on Bone Loss, Spaceflight-Associated Neuro-ocular Syndrome, and Behavioral Health).',
    limitations:
      'Simplified educational model. Does not account for individual genetics, countermeasures efficacy, nutrition, or acute mission events.',
  };
}

// --- Unit Conversions ---

export function fahrenheitToCelsius(f: number): number {
  return Number((((f - 32) * 5) / 9).toFixed(2));
}

export function celsiusToFahrenheit(c: number): number {
  return Number(((c * 9) / 5 + 32).toFixed(2));
}

export function mmolLToMgDl(mmol: number): number {
  return Number((mmol * 18.0182).toFixed(1));
}

export function mgDlToMmolL(mgDl: number): number {
  return Number((mgDl / 18.0182).toFixed(2));
}

export function flOzToLiters(oz: number): number {
  return Number((oz * 0.0295735).toFixed(2));
}

export function litersToFlOz(liters: number): number {
  return Number((liters / 0.0295735).toFixed(1));
}

// --- Additional Supported Scientific Calculations ---

export function calculatePulsePressure(sbpMmHg: number, dbpMmHg: number): ScientificCalculationResult {
  if (!Number.isFinite(sbpMmHg) || !Number.isFinite(dbpMmHg) || sbpMmHg <= dbpMmHg || dbpMmHg <= 20) {
    return {
      id: 'pulse-pressure',
      name: 'Pulse Pressure (PP)',
      formula: 'PP = SBP - DBP',
      inputsSummary: `SBP=${sbpMmHg} mmHg, DBP=${dbpMmHg} mmHg`,
      outputValue: 'Insufficient Data',
      units: 'mmHg',
      explanation: 'Valid systolic (> diastolic) and diastolic blood pressure values are required.',
      assumptions: 'Brachial or calibrated cuff arterial measurement.',
      limitations: 'Widened or narrowed pulse pressure is non-specific and requires clinical context.',
      dataQuality: 'INSUFFICIENT DATA',
      validationStatus: 'Insufficient Input',
      reference: 'Hall & Hall, Guyton and Hall Textbook of Medical Physiology.',
    };
  }

  const pp = sbpMmHg - dbpMmHg;
  return {
    id: 'pulse-pressure',
    name: 'Pulse Pressure (PP)',
    formula: 'PP = SBP - DBP',
    inputsSummary: `SBP = ${sbpMmHg} mmHg · DBP = ${dbpMmHg} mmHg`,
    outputValue: pp.toFixed(0),
    units: 'mmHg',
    explanation: 'Represents stroke-volume-driven pulsatile arterial pressure difference per cardiac cycle.',
    assumptions: 'Simultaneous systolic and diastolic pressures captured at rest.',
    limitations: 'Influenced by arterial compliance, stroke volume, and cuff calibration.',
    dataQuality: 'HIGH DATA QUALITY',
    validationStatus: 'Validated Equation',
    reference: 'Hall & Hall, Guyton and Hall Textbook of Medical Physiology.',
  };
}

export function calculateBodyMassIndex(massKg: number, heightCm: number): ScientificCalculationResult {
  if (!Number.isFinite(massKg) || !Number.isFinite(heightCm) || massKg <= 20 || massKg > 350 || heightCm < 80 || heightCm > 250) {
    return {
      id: 'bmi-index',
      name: 'Body Mass Index (BMI)',
      formula: 'BMI = mass_kg / (height_m)^2',
      inputsSummary: `Mass=${massKg} kg, Height=${heightCm} cm`,
      outputValue: 'Insufficient Data',
      units: 'kg/m²',
      explanation: 'Valid crew body mass (20–350 kg) and stature (80–250 cm) are required.',
      assumptions: 'Measured on calibrated ground scale or Space Linear Acceleration Mass Measurement Device.',
      limitations: 'BMI does not distinguish lean muscle mass from adipose tissue or fluid shifts.',
      dataQuality: 'INSUFFICIENT DATA',
      validationStatus: 'Insufficient Input',
      reference: 'WHO Physical Status Report (TRS 854) & NASA Anthropometric Standards.',
    };
  }

  const heightM = heightCm / 100;
  const bmi = massKg / (heightM * heightM);
  return {
    id: 'bmi-index',
    name: 'Body Mass Index (BMI)',
    formula: 'BMI = mass_kg / (height_m)^2',
    inputsSummary: `Mass = ${massKg.toFixed(1)} kg · Height = ${heightCm.toFixed(1)} cm (${heightM.toFixed(2)} m)`,
    outputValue: bmi.toFixed(1),
    units: 'kg/m²',
    explanation: 'Standard mass-for-height anthropometric index tracked longitudinally across microgravity countermeasures.',
    assumptions: 'Accurate terrestrial or inertial mass measurement.',
    limitations: 'Does not measure body composition, bone mineral loss, or cephalad fluid redistribution.',
    dataQuality: 'HIGH DATA QUALITY',
    validationStatus: 'Validated Equation',
    reference: 'WHO Physical Status Report (TRS 854) & NASA Anthropometric Standards.',
  };
}

export function calculateHydrationBaseline(
  massKg: number,
  activityMinutes: number
): ScientificCalculationResult {
  if (!Number.isFinite(massKg) || !Number.isFinite(activityMinutes) || massKg < 25 || massKg > 250 || activityMinutes < 0) {
    return {
      id: 'hydration-target',
      name: 'Weight-Based Daily Fluid Baseline (Estimate)',
      formula: 'Target_L ≈ (mass_kg × 0.0325) + (activity_min / 60) × 0.45',
      inputsSummary: `Mass=${massKg} kg, Activity=${activityMinutes} min`,
      outputValue: 'Insufficient Data',
      units: 'L/day',
      explanation: 'Requires valid body mass (25–250 kg) and daily activity minutes (>= 0).',
      assumptions: 'Temperate cabin humidity and nominal renal concentrating capacity.',
      limitations: 'Baseline approximation only; EVA sweat loss, diuresis, and electrolytes alter individual fluid needs.',
      dataQuality: 'INSUFFICIENT DATA',
      validationStatus: 'Insufficient Input',
      reference: 'National Academies Dietary Reference Intakes for Water & NASA Nutrition Evidence Report.',
    };
  }

  const liters = massKg * 0.0325 + (activityMinutes / 60) * 0.45;
  return {
    id: 'hydration-target',
    name: 'Weight-Based Daily Fluid Baseline (Estimate)',
    formula: 'Target_L ≈ (mass_kg × 0.0325) + (activity_min / 60) × 0.45',
    inputsSummary: `Mass = ${massKg.toFixed(1)} kg · Exercise = ${activityMinutes} min`,
    outputValue: liters.toFixed(2),
    units: 'L/day',
    explanation: 'Estimates total daily beverage + metabolic hydration baseline scaled by body mass and exercise duration.',
    assumptions: 'Rest baseline ~32.5 mL/kg plus ~450 mL/h aerobic sweat replacement.',
    limitations: 'Approximation only. Clinical fluid status requires serum electrolytes, urine specific gravity, and medical review.',
    dataQuality: 'HIGH DATA QUALITY',
    validationStatus: 'Approximation',
    reference: 'National Academies Dietary Reference Intakes for Water & NASA Nutrition Evidence Report.',
  };
}

// --- Measurement Validation & Date Filtering ---

export interface MeasurementValidationPayload {
  recordedDate?: string;
  recordedTime?: string;
  heartRateBpm: number;
  hrvRmssdMs?: number;
  systolicMmHg: number;
  diastolicMmHg: number;
  spo2Percent: number;
  respiratoryRateRpm?: number;
  coreTempC: number;
  bloodGlucoseMgDl?: number;
  hydrationLiters?: number;
  sleepHours: number;
  activityMinutes?: number;
  stepsCount?: number;
  cortisolUgDl?: number;
  boneDensityIndex?: number;
  radiationDoseMsv?: number;
  moodScore?: number;
  stressScore?: number;
  fatigueScore?: number;
  sensorSource?: string;
  measurementMethod?: string;
  dataOrigin?: string;
}

export function validateMeasurementInput(input: MeasurementValidationPayload): {
  valid: boolean;
  errors: Record<string, string>;
  recordedAtIso?: string;
} {
  const errors: Record<string, string> = {};

  if (input.recordedDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.recordedDate.trim())) {
      errors.recordedDate = 'Select a valid measurement date (YYYY-MM-DD).';
    }
  }
  if (input.recordedTime !== undefined) {
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.recordedTime.trim())) {
      errors.recordedTime = 'Select a valid measurement time (HH:MM).';
    }
  }

  let recordedAtIso: string | undefined;
  if (!errors.recordedDate && !errors.recordedTime && input.recordedDate && input.recordedTime) {
    const timePart = input.recordedTime.trim().length === 5 ? `${input.recordedTime.trim()}:00` : input.recordedTime.trim();
    const parsed = new Date(`${input.recordedDate.trim()}T${timePart}Z`);
    if (Number.isNaN(parsed.getTime())) {
      errors.recordedDate = 'Date and time combination is invalid.';
    } else {
      recordedAtIso = parsed.toISOString();
    }
  }

  if (!Number.isFinite(input.heartRateBpm) || input.heartRateBpm < 30 || input.heartRateBpm > 220) {
    errors.heartRateBpm = 'Heart rate must be between 30 and 220 bpm.';
  }
  if (
    input.hrvRmssdMs !== undefined &&
    (!Number.isFinite(input.hrvRmssdMs) || input.hrvRmssdMs < 5 || input.hrvRmssdMs > 250)
  ) {
    errors.hrvRmssdMs = 'HRV RMSSD must be between 5 and 250 ms.';
  }
  if (!Number.isFinite(input.systolicMmHg) || input.systolicMmHg < 60 || input.systolicMmHg > 250) {
    errors.systolicMmHg = 'Systolic pressure must be 60–250 mmHg.';
  }
  if (!Number.isFinite(input.diastolicMmHg) || input.diastolicMmHg < 35 || input.diastolicMmHg > 150) {
    errors.diastolicMmHg = 'Diastolic pressure must be 35–150 mmHg.';
  }
  if (
    Number.isFinite(input.systolicMmHg) &&
    Number.isFinite(input.diastolicMmHg) &&
    input.systolicMmHg <= input.diastolicMmHg
  ) {
    errors.systolicMmHg = 'Systolic BP must be greater than Diastolic BP.';
  }
  if (!Number.isFinite(input.spo2Percent) || input.spo2Percent < 50 || input.spo2Percent > 100) {
    errors.spo2Percent = 'SpO2 must be between 50% and 100%.';
  }
  if (
    input.respiratoryRateRpm !== undefined &&
    (!Number.isFinite(input.respiratoryRateRpm) || input.respiratoryRateRpm < 6 || input.respiratoryRateRpm > 50)
  ) {
    errors.respiratoryRateRpm = 'Respiratory rate must be 6–50 breaths/min.';
  }
  if (!Number.isFinite(input.coreTempC) || input.coreTempC < 33 || input.coreTempC > 42) {
    errors.coreTempC = 'Core temperature must be 33.0–42.0 °C (91.4–107.6 °F).';
  }
  if (
    input.bloodGlucoseMgDl !== undefined &&
    (!Number.isFinite(input.bloodGlucoseMgDl) || input.bloodGlucoseMgDl < 30 || input.bloodGlucoseMgDl > 600)
  ) {
    errors.bloodGlucoseMgDl = 'Blood glucose must be 30–600 mg/dL (1.7–33.3 mmol/L).';
  }
  if (
    input.hydrationLiters !== undefined &&
    (!Number.isFinite(input.hydrationLiters) || input.hydrationLiters < 0 || input.hydrationLiters > 12)
  ) {
    errors.hydrationLiters = 'Hydration intake must be 0–12 L.';
  }
  if (!Number.isFinite(input.sleepHours) || input.sleepHours < 0 || input.sleepHours > 24) {
    errors.sleepHours = 'Sleep duration must be 0–24 hours.';
  }
  if (
    input.activityMinutes !== undefined &&
    (!Number.isFinite(input.activityMinutes) || input.activityMinutes < 0 || input.activityMinutes > 720)
  ) {
    errors.activityMinutes = 'Activity minutes must be 0–720 min.';
  }
  if (
    input.stepsCount !== undefined &&
    (!Number.isFinite(input.stepsCount) || input.stepsCount < 0 || input.stepsCount > 100000)
  ) {
    errors.stepsCount = 'Step count must be 0–100,000.';
  }
  if (
    input.cortisolUgDl !== undefined &&
    (!Number.isFinite(input.cortisolUgDl) || input.cortisolUgDl < 0.5 || input.cortisolUgDl > 60)
  ) {
    errors.cortisolUgDl = 'Cortisol must be 0.5–60 ug/dL.';
  }
  if (
    input.boneDensityIndex !== undefined &&
    (!Number.isFinite(input.boneDensityIndex) || input.boneDensityIndex < 0.4 || input.boneDensityIndex > 2.0)
  ) {
    errors.boneDensityIndex = 'Bone density index must be 0.40–2.00.';
  }
  if (
    input.radiationDoseMsv !== undefined &&
    (!Number.isFinite(input.radiationDoseMsv) || input.radiationDoseMsv < 0 || input.radiationDoseMsv > 500)
  ) {
    errors.radiationDoseMsv = 'Radiation dose must be 0–500 mSv.';
  }
  if (input.sensorSource !== undefined && input.sensorSource.trim().length < 2) {
    errors.sensorSource = 'Specify the sensor or measurement device source.';
  }
  if (input.measurementMethod !== undefined && input.measurementMethod.trim().length < 2) {
    errors.measurementMethod = 'Specify the measurement method.';
  }
  if (
    input.dataOrigin !== undefined &&
    !['real_sensor', 'manual_entry', 'calculated', 'simulated_demo'].includes(input.dataOrigin)
  ) {
    errors.dataOrigin = 'Select a valid data origin category.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    recordedAtIso,
  };
}

export function filterMeasurementsByDateRange(
  measurements: BiomedicalMeasurement[],
  range: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom',
  customStartDate?: string,
  customEndDate?: string,
  referenceNowMs?: number
): BiomedicalMeasurement[] {
  if (range === 'all') return measurements;

  const latestRecordMs =
    measurements.length > 0
      ? Math.max(...measurements.map((m) => new Date(m.recordedAt).getTime()).filter(Number.isFinite))
      : Date.now();
  const anchorMs = referenceNowMs ?? Math.max(Date.now(), latestRecordMs);

  if (range === 'daily') {
    const cutoff = anchorMs - 24 * 60 * 60 * 1000;
    return measurements.filter((m) => new Date(m.recordedAt).getTime() >= cutoff);
  }
  if (range === 'weekly') {
    const cutoff = anchorMs - 7 * 24 * 60 * 60 * 1000;
    return measurements.filter((m) => new Date(m.recordedAt).getTime() >= cutoff);
  }
  if (range === 'monthly') {
    const cutoff = anchorMs - 30 * 24 * 60 * 60 * 1000;
    return measurements.filter((m) => new Date(m.recordedAt).getTime() >= cutoff);
  }

  // custom date window (inclusive YYYY-MM-DD)
  const startMs = customStartDate ? new Date(`${customStartDate}T00:00:00.000Z`).getTime() : -Infinity;
  const endMs = customEndDate ? new Date(`${customEndDate}T23:59:59.999Z`).getTime() : Infinity;
  return measurements.filter((m) => {
    const t = new Date(m.recordedAt).getTime();
    return Number.isFinite(t) && t >= startMs && t <= endMs;
  });
}

function escapeCsvCell(value: unknown): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function measurementsToCsv(measurements: BiomedicalMeasurement[]): string {
  const headers = [
    'ID',
    'Crew Member',
    'Recorded At (UTC)',
    'Heart Rate (bpm)',
    'HRV RMSSD (ms)',
    'Systolic (mmHg)',
    'Diastolic (mmHg)',
    'MAP Approx (mmHg)',
    'SpO2 (%)',
    'Resp Rate (rpm)',
    'Core Temp (°C)',
    'Blood Glucose (mg/dL)',
    'Hydration (L)',
    'Sleep (h)',
    'Activity (min)',
    'Steps',
    'Cortisol (ug/dL)',
    'Bone Density Index',
    'Radiation (mSv)',
    'Mood (1-10)',
    'Stress (1-10)',
    'Fatigue (1-10)',
    'Origin',
    'Method',
    'Sensor Source',
    'Data Quality',
    'Status',
    'Notes',
  ];

  const rows = measurements.map((m) =>
    [
      m.id,
      m.astronautName,
      m.recordedAt,
      m.heartRateBpm,
      m.hrvRmssdMs,
      m.systolicMmHg,
      m.diastolicMmHg,
      m.mapMmHg,
      m.spo2Percent,
      m.respiratoryRateRpm,
      m.coreTempC,
      m.bloodGlucoseMgDl,
      m.hydrationLiters,
      m.sleepHours,
      m.activityMinutes,
      m.stepsCount,
      m.cortisolUgDl,
      m.boneDensityIndex,
      m.radiationDoseMsv,
      m.moodScore,
      m.stressScore,
      m.fatigueScore,
      m.dataOrigin,
      m.measurementMethod,
      m.sensorSource,
      m.dataQuality,
      m.assessmentStatus,
      m.notes,
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

