export type UserRole =
  | 'astronaut'
  | 'medical_specialist'
  | 'scientific_researcher'
  | 'general_user'
  | 'administrator';

export type AccountStatus = 'active' | 'pending_review' | 'suspended';

export type LanguageCode = 'en' | 'es' | 'qu' | 'pt' | 'fr' | 'de' | 'ja' | 'zh';

export type PermissionKey =
  | 'manage_own_profile'
  | 'log_biomedical_measurements'
  | 'view_personal_health_trends'
  | 'complete_assessments'
  | 'view_authorized_astronaut_records'
  | 'analyze_biomedical_measurements'
  | 'review_alerts'
  | 'prepare_medical_reports'
  | 'add_clinical_observations'
  | 'access_anonymized_datasets'
  | 'review_scientific_models'
  | 'evaluate_experimental_formulas'
  | 'access_educational_resources'
  | 'use_wellness_features'
  | 'manage_application_settings'
  | 'manage_user_roles'
  | 'manage_application_branding'
  | 'manage_scientific_database';

export interface NotificationPreferences {
  biometricAlerts: boolean;
  medicalReports: boolean;
  systemSecurity: boolean;
  researchDigests: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  lastAccessAt: string;
  fullName: string;
  country: string;
  city: string;
  preferredLanguage: LanguageCode;
  avatarUrl: string | null;
  avatarMimeType: string | null;
  notifications: NotificationPreferences;
  emailVisibility: 'private' | 'team';
  telemetrySharing: boolean;
  permissions: PermissionKey[];
}

export interface AppBranding {
  id: number;
  applicationName: 'KAWSAY NOVA';
  applicationSubtitle: string;
  organizationName: string;
  institutionalFooter: string;
  contactEmail: string;
  contactPhone: string;
  logoStoragePath: string;
  faviconStoragePath: string;
  reportLogoStoragePath: string;
  logoFit: 'contain' | 'cover';
  logoAspectRatio: 'original' | '1:1' | '16:9' | '4:3';
  logoDisplayHeight: number;
  logoVersion: number;
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
  isActive: boolean;
}

export interface BrandingHistoryEntry {
  id: number;
  logoVersion: number;
  logoStoragePath: string;
  faviconStoragePath: string;
  action: 'updated' | 'restored_default' | 'metadata_updated';
  updatedBy: string;
  updatedByName: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: number;
  actorUserId: string | null;
  actorUsername: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  createdAt: string;
}

export type DataOrigin =
  | 'real_sensor'
  | 'manual_entry'
  | 'calculated'
  | 'simulated_demo';

export type DataQualityLabel =
  | 'HIGH DATA QUALITY'
  | 'ACCEPTABLE DATA QUALITY'
  | 'LOW DATA QUALITY'
  | 'INSUFFICIENT DATA';

export interface BiomedicalMeasurement {
  id: number;
  userId: string;
  astronautName: string;
  recordedAt: string;
  heartRateBpm: number;
  hrvRmssdMs: number;
  systolicMmHg: number;
  diastolicMmHg: number;
  mapMmHg: number;
  spo2Percent: number;
  respiratoryRateRpm: number;
  coreTempC: number;
  bloodGlucoseMgDl: number;
  hydrationLiters: number;
  sleepHours: number;
  activityMinutes: number;
  stepsCount: number;
  cortisolUgDl: number;
  boneDensityIndex: number;
  muscleStrengthScore: number;
  radiationDoseMsv: number;
  moodScore: number;
  stressScore: number;
  fatigueScore: number;
  isolationScore: number;
  socialConnectionScore: number;
  measurementMethod: string;
  sensorSource: string;
  dataOrigin: DataOrigin;
  dataQuality: DataQualityLabel;
  qualityReason: string;
  assessmentStatus: 'nominal' | 'elevated' | 'critical';
  notes: string;
  updatedAt?: string;
}

export interface AstronautMissionProfile {
  id: string;
  userId: string;
  callsign: string;
  fullName: string;
  age: number;
  missionId: string;
  missionName: string;
  missionPhase: string;
  missionDurationDays: number;
  missionStartDate: string;
  missionDestination: string;
  medicalBackground: string;
  baselineHrBpm: number;
  baselineHrvMs: number;
  baselineSbpMmHg: number;
  baselineDbpMmHg: number;
  baselineSpo2Pct: number;
  baselineTempC: number;
  healthHistory: string;
  sensorsList: string;
  isDemoData: boolean;
  updatedAt: string;
}

export interface MissionTask {
  id: number;
  userId: string;
  title: string;
  category:
    | 'health_assessment'
    | 'measurement_reminder'
    | 'physical_activity'
    | 'sleep_routine'
    | 'hydration_nutrition'
    | 'mission_activity';
  scheduledDate: string;
  scheduledTime: string;
  completed: boolean;
  notes: string;
  createdAt: string;
}

export interface ClinicalObservation {
  id: number;
  astronautUserId: string;
  astronautName: string;
  specialistUserId: string;
  specialistName: string;
  severity: 'nominal' | 'advisory' | 'critical';
  summary: string;
  recommendation: string;
  createdAt: string;
}

export interface MedicalAlert {
  id: number;
  astronautUserId: string;
  astronautName: string;
  metric: string;
  observedValue: string;
  threshold: string;
  severity: 'normal' | 'warning' | 'critical' | 'info';
  status?: 'open' | 'acknowledged' | 'resolved';
  explanation: string;
  dataSource: string;
  dataQuality: DataQualityLabel;
  suggestedNextStep: string;
  acknowledged: boolean;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AggregatedResearchCohort {
  cohortId: string;
  missionPhase: string;
  sampleCount: number;
  avgHeartRateBpm: number;
  avgSpo2Percent: number;
  avgCortisolUgDl: number;
  avgBoneDensityIndex: number;
  radiationMeanMsv: number;
}

export interface WellnessResource {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  summary: string;
  protocolSteps: string[];
}

export interface MentalAssessment {
  id: number;
  userId: string;
  moodScore: number;
  stressScore: number;
  fatigueScore: number;
  sleepQualityScore: number;
  notes: string;
  isPrivate: boolean;
  recordedAt: string;
}

export interface WellnessCompletion {
  resourceId: string;
  completedDate: string;
  completedAt: string;
}

export interface SavedMedicalReport {
  id: string;
  createdByUserId: string;
  createdByName: string;
  title: string;
  reportLang: LanguageCode;
  viewMode: 'cover' | 'document';
  measurementCount: number;
  observationCount: number;
  summaryJson: string;
  createdAt: string;
}

