import test from 'node:test';
import assert from 'node:assert/strict';
import type { BiomedicalMeasurement } from '../types/kawsay';
import {
  calculateBodyMassIndex,
  calculateEcgHeartRate,
  calculateGlucoseMard,
  calculateHydrationBaseline,
  calculateMapApprox,
  calculatePulsePressure,
  calculateRmssd,
  celsiusToFahrenheit,
  evaluateDataQuality,
  fahrenheitToCelsius,
  filterMeasurementsByDateRange,
  flOzToLiters,
  measurementsToCsv,
  mgDlToMmolL,
  mmolLToMgDl,
  runMissionSimulation,
  validateMeasurementInput,
} from './precisionCore';

test('calculateEcgHeartRate computes HR = 60 / mean RR in seconds', () => {
  const res = calculateEcgHeartRate([1000, 1000, 1000, 1000, 1000]);
  assert.equal(res.outputValue, '60.0');
  assert.equal(res.units, 'bpm');
  assert.equal(res.validationStatus, 'Validated Equation');
});

test('calculateEcgHeartRate returns Insufficient Data for fewer than 3 intervals', () => {
  const res = calculateEcgHeartRate([800, 810]);
  assert.equal(res.dataQuality, 'INSUFFICIENT DATA');
  assert.equal(res.validationStatus, 'Insufficient Input');
});

test('calculateRmssd computes exact root mean square of successive differences', () => {
  // Differences: +10, -10, +10, -10 -> squares: 100, 100, 100, 100 -> mean=100 -> sqrt=10.0
  const res = calculateRmssd([800, 810, 800, 810, 800]);
  assert.equal(res.outputValue, '10.0');
  assert.equal(res.units, 'ms');
});

test('calculateMapApprox computes DBP + (SBP - DBP) / 3 and labels as Approximation', () => {
  const res = calculateMapApprox(120, 80);
  assert.equal(res.outputValue, '93.3');
  assert.equal(res.validationStatus, 'Approximation');
});

test('calculateGlucoseMard computes mean absolute relative difference percentage', () => {
  // |110 - 100|/100 = 10%, |90 - 100|/100 = 10% -> MARD = 10.00%
  const res = calculateGlucoseMard([
    { sensorMgDl: 110, referenceMgDl: 100 },
    { sensorMgDl: 90, referenceMgDl: 100 },
  ]);
  assert.equal(res.outputValue, '10.00');
  assert.equal(res.units, '%');
});

test('evaluateDataQuality classifies HIGH, LOW, and INSUFFICIENT DATA transparently', () => {
  const high = evaluateDataQuality({
    calibrated: true,
    deviceId: 'KN-ECG-01',
    signalQualityPct: 95,
    missingFieldsCount: 0,
    motionArtifactDetected: false,
    timestampConsistent: true,
    valuePlausible: true,
    repeatedConsistent: true,
  });
  assert.equal(high.label, 'HIGH DATA QUALITY');

  const low = evaluateDataQuality({
    calibrated: false,
    deviceId: 'KN-ECG-01',
    signalQualityPct: 60,
    missingFieldsCount: 1,
    motionArtifactDetected: true,
    timestampConsistent: true,
    valuePlausible: true,
    repeatedConsistent: false,
  });
  assert.equal(low.label, 'LOW DATA QUALITY');

  const insuff = evaluateDataQuality({
    calibrated: true,
    deviceId: '',
    signalQualityPct: 90,
    missingFieldsCount: 4,
    motionArtifactDetected: false,
    timestampConsistent: false,
    valuePlausible: true,
    repeatedConsistent: true,
  });
  assert.equal(insuff.label, 'INSUFFICIENT DATA');
});

test('runMissionSimulation always attaches required non-prediction disclaimer', () => {
  const sim = runMissionSimulation({
    microgravityWeeks: 12,
    sleepShiftHours: 2,
    isolationLevel: 7,
    workloadIntensity: 8,
    cabinCo2MmHg: 3.5,
    commDelayMinutes: 14,
    missionPhase: 'Mars Cruise',
  });
  assert.equal(
    sim.disclaimer,
    'SIMULATION — NOT AN ACTUAL MEDICAL MEASUREMENT OR VALIDATED INDIVIDUAL PREDICTION.'
  );
  assert.ok(sim.affectedIndicators.length >= 4);
});

test('unit conversions convert temperature, glucose, and volume accurately', () => {
  assert.equal(fahrenheitToCelsius(98.6), 37);
  assert.equal(celsiusToFahrenheit(37), 98.6);
  assert.equal(mmolLToMgDl(5.5), 99.1);
  assert.equal(mgDlToMmolL(99.1), 5.5);
  assert.ok(Math.abs(flOzToLiters(33.814) - 1) <= 0.01);
});

test('calculatePulsePressure, calculateBodyMassIndex, and calculateHydrationBaseline return verified equations', () => {
  const pp = calculatePulsePressure(120, 80);
  assert.equal(pp.outputValue, '40');
  assert.equal(pp.units, 'mmHg');

  const bmi = calculateBodyMassIndex(70, 175);
  assert.equal(bmi.outputValue, '22.9');
  assert.equal(bmi.units, 'kg/m²');

  const hyd = calculateHydrationBaseline(70, 60);
  // 70 * 0.0325 + 0.45 = 2.275 + 0.45 = 2.725 -> 2.73
  assert.equal(hyd.outputValue, '2.73');
  assert.equal(hyd.units, 'L/day');
});

test('validateMeasurementInput rejects invalid physiological values and accepts valid dated entries', () => {
  const invalid = validateMeasurementInput({
    recordedDate: 'bad-date',
    recordedTime: '25:99',
    heartRateBpm: 900,
    systolicMmHg: 70,
    diastolicMmHg: 80,
    spo2Percent: 120,
    coreTempC: 25,
    sleepHours: 30,
    sensorSource: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.recordedDate);
  assert.ok(invalid.errors.heartRateBpm);
  assert.ok(invalid.errors.systolicMmHg);
  assert.ok(invalid.errors.spo2Percent);
  assert.ok(invalid.errors.coreTempC);
  assert.ok(invalid.errors.sleepHours);
  assert.ok(invalid.errors.sensorSource);

  const valid = validateMeasurementInput({
    recordedDate: '2026-11-14',
    recordedTime: '14:30',
    heartRateBpm: 68,
    systolicMmHg: 118,
    diastolicMmHg: 76,
    spo2Percent: 98.2,
    coreTempC: 36.8,
    sleepHours: 7.5,
    sensorSource: 'KN-BioHarness-01',
    measurementMethod: 'Manual calibrated check',
    dataOrigin: 'manual_entry',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.recordedAtIso, '2026-11-14T14:30:00.000Z');
});

test('filterMeasurementsByDateRange and measurementsToCsv filter and format cleanly', () => {
  const sample = (id: number, recordedAt: string): BiomedicalMeasurement => ({
    id,
    userId: 'u1',
    astronautName: 'Cmdr. "Camila" Vega',
    recordedAt,
    heartRateBpm: 68,
    hrvRmssdMs: 45,
    systolicMmHg: 118,
    diastolicMmHg: 76,
    mapMmHg: 90,
    spo2Percent: 98.2,
    respiratoryRateRpm: 15,
    coreTempC: 36.7,
    bloodGlucoseMgDl: 92,
    hydrationLiters: 2.5,
    sleepHours: 7.5,
    activityMinutes: 45,
    stepsCount: 6500,
    cortisolUgDl: 12.1,
    boneDensityIndex: 1.03,
    muscleStrengthScore: 90,
    radiationDoseMsv: 0.45,
    moodScore: 8,
    stressScore: 3,
    fatigueScore: 3,
    isolationScore: 2,
    socialConnectionScore: 9,
    measurementMethod: 'Manual calibrated check',
    sensorSource: 'KN-Kit',
    dataOrigin: 'manual_entry',
    dataQuality: 'HIGH DATA QUALITY',
    qualityReason: 'Stable',
    assessmentStatus: 'nominal',
    notes: 'Routine check, post-exercise',
  });

  const list = [
    sample(1, '2026-11-14T09:00:00Z'),
    sample(2, '2026-11-10T09:00:00Z'),
    sample(3, '2026-10-01T09:00:00Z'),
  ];
  const anchor = new Date('2026-11-14T12:00:00Z').getTime();

  assert.equal(filterMeasurementsByDateRange(list, 'daily', undefined, undefined, anchor).length, 1);
  assert.equal(filterMeasurementsByDateRange(list, 'weekly', undefined, undefined, anchor).length, 2);
  assert.equal(filterMeasurementsByDateRange(list, 'monthly', undefined, undefined, anchor).length, 2);
  assert.equal(filterMeasurementsByDateRange(list, 'custom', '2026-10-01', '2026-10-15', anchor).length, 1);

  const csv = measurementsToCsv([list[0]]);
  assert.ok(csv.includes('""Camila""'));
  assert.ok(csv.includes('"Routine check, post-exercise"'));
});

