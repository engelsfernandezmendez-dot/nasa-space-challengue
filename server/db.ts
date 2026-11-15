import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AggregatedResearchCohort,
  AppBranding,
  AstronautMissionProfile,
  AuditLogEntry,
  BiomedicalMeasurement,
  BrandingHistoryEntry,
  ClinicalObservation,
  DataOrigin,
  DataQualityLabel,
  LanguageCode,
  MedicalAlert,
  MentalAssessment,
  MissionTask,
  SavedMedicalReport,
  UserAccount,
  UserRole,
  WellnessCompletion,
  WellnessResource,
} from '../src/types/kawsay';
import { getRolePermissions, ROLE_LABELS } from '../src/utils/validation';
import { hashPassword } from './auth';

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
export const BRANDING_DIR = path.join(UPLOADS_DIR, 'branding');
export const DB_PATH = path.join(DATA_DIR, 'kawsay_nova.db');

fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(BRANDING_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      role_key TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_key TEXT NOT NULL REFERENCES user_roles(role_key) ON DELETE CASCADE,
      permission_key TEXT NOT NULL,
      UNIQUE(role_key, permission_key)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role_key TEXT NOT NULL REFERENCES user_roles(role_key),
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      last_access_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferred_language TEXT NOT NULL DEFAULT 'en',
      notify_biometric_alerts INTEGER NOT NULL DEFAULT 1,
      notify_medical_reports INTEGER NOT NULL DEFAULT 1,
      notify_system_security INTEGER NOT NULL DEFAULT 1,
      notify_research_digests INTEGER NOT NULL DEFAULT 0,
      email_visibility TEXT NOT NULL DEFAULT 'private',
      telemetry_sharing INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_avatars (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      storage_path TEXT,
      mime_type TEXT,
      file_size_bytes INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_branding (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      application_name TEXT NOT NULL DEFAULT 'KAWSAY NOVA',
      application_subtitle TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      institutional_footer TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      logo_storage_path TEXT NOT NULL,
      favicon_storage_path TEXT NOT NULL,
      report_logo_storage_path TEXT NOT NULL,
      logo_fit TEXT NOT NULL DEFAULT 'contain',
      logo_aspect_ratio TEXT NOT NULL DEFAULT 'original',
      logo_display_height INTEGER NOT NULL DEFAULT 36,
      logo_version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT REFERENCES users(id),
      updated_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS branding_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      logo_version INTEGER NOT NULL,
      logo_storage_path TEXT NOT NULL,
      favicon_storage_path TEXT NOT NULL,
      action TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      updated_by_name TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id TEXT,
      actor_username TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS astronaut_mission_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      callsign TEXT NOT NULL,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      mission_id TEXT NOT NULL,
      mission_name TEXT NOT NULL,
      mission_phase TEXT NOT NULL,
      mission_duration_days INTEGER NOT NULL,
      mission_start_date TEXT NOT NULL,
      mission_destination TEXT NOT NULL,
      medical_background TEXT NOT NULL,
      baseline_hr_bpm REAL NOT NULL,
      baseline_hrv_ms REAL NOT NULL,
      baseline_sbp_mmhg INTEGER NOT NULL,
      baseline_dbp_mmhg INTEGER NOT NULL,
      baseline_spo2_pct REAL NOT NULL,
      baseline_temp_c REAL NOT NULL,
      health_history TEXT NOT NULL,
      sensors_list TEXT NOT NULL,
      is_demo_data INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS biomedical_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recorded_at TEXT NOT NULL,
      heart_rate_bpm REAL NOT NULL,
      hrv_rmssd_ms REAL NOT NULL DEFAULT 42,
      systolic_mmhg INTEGER NOT NULL,
      diastolic_mmhg INTEGER NOT NULL,
      map_mmhg REAL NOT NULL DEFAULT 92,
      spo2_percent REAL NOT NULL,
      respiratory_rate_rpm REAL NOT NULL DEFAULT 15,
      core_temp_c REAL NOT NULL,
      blood_glucose_mg_dl REAL NOT NULL DEFAULT 94,
      hydration_liters REAL NOT NULL DEFAULT 2.4,
      sleep_hours REAL NOT NULL DEFAULT 7.2,
      activity_minutes INTEGER NOT NULL DEFAULT 45,
      steps_count INTEGER NOT NULL DEFAULT 6200,
      cortisol_ug_dl REAL NOT NULL,
      bone_density_index REAL NOT NULL,
      muscle_strength_score REAL NOT NULL DEFAULT 88,
      radiation_dose_msv REAL NOT NULL,
      mood_score INTEGER NOT NULL DEFAULT 8,
      stress_score INTEGER NOT NULL DEFAULT 4,
      fatigue_score INTEGER NOT NULL DEFAULT 3,
      isolation_score INTEGER NOT NULL DEFAULT 3,
      social_connection_score INTEGER NOT NULL DEFAULT 8,
      measurement_method TEXT NOT NULL DEFAULT 'Multi-sensor telemetry',
      sensor_source TEXT NOT NULL DEFAULT 'KN-Demo-Band v1',
      data_origin TEXT NOT NULL DEFAULT 'simulated_demo',
      data_quality TEXT NOT NULL DEFAULT 'HIGH DATA QUALITY',
      quality_reason TEXT NOT NULL DEFAULT 'Calibrated demo telemetry within expected bounds.',
      assessment_status TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS clinical_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      astronaut_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      specialist_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      severity TEXT NOT NULL,
      summary TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medical_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      astronaut_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      metric TEXT NOT NULL,
      observed_value TEXT NOT NULL,
      threshold TEXT NOT NULL,
      severity TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      data_source TEXT NOT NULL DEFAULT 'Biomedical Telemetry',
      data_quality TEXT NOT NULL DEFAULT 'HIGH DATA QUALITY',
      suggested_next_step TEXT NOT NULL DEFAULT 'Repeat resting check and consult flight surgeon.',
      acknowledged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mission_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_recovery_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mental_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mood_score INTEGER NOT NULL,
      stress_score INTEGER NOT NULL,
      fatigue_score INTEGER NOT NULL,
      sleep_quality_score INTEGER NOT NULL DEFAULT 7,
      notes TEXT NOT NULL,
      is_private INTEGER NOT NULL DEFAULT 1,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wellness_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL,
      completed_date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, resource_id, completed_date)
    );

    CREATE TABLE IF NOT EXISTS saved_reports (
      id TEXT PRIMARY KEY,
      created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_by_name TEXT NOT NULL,
      title TEXT NOT NULL,
      report_lang TEXT NOT NULL,
      view_mode TEXT NOT NULL,
      measurement_count INTEGER NOT NULL,
      observation_count INTEGER NOT NULL,
      summary_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  ensureNewColumns();
  seedRolesAndPermissions();
  seedDefaultUsersAndData();
}

function ensureNewColumns(): void {
  const existingCols = (
    db.prepare(`PRAGMA table_info(biomedical_measurements)`).all() as Array<{ name: string }>
  ).map((c) => c.name);

  const additions: Array<[string, string]> = [
    ['hrv_rmssd_ms', 'REAL NOT NULL DEFAULT 42'],
    ['map_mmhg', 'REAL NOT NULL DEFAULT 92'],
    ['respiratory_rate_rpm', 'REAL NOT NULL DEFAULT 15'],
    ['blood_glucose_mg_dl', 'REAL NOT NULL DEFAULT 94'],
    ['hydration_liters', 'REAL NOT NULL DEFAULT 2.4'],
    ['sleep_hours', 'REAL NOT NULL DEFAULT 7.2'],
    ['activity_minutes', 'INTEGER NOT NULL DEFAULT 45'],
    ['steps_count', 'INTEGER NOT NULL DEFAULT 6200'],
    ['muscle_strength_score', 'REAL NOT NULL DEFAULT 88'],
    ['mood_score', 'INTEGER NOT NULL DEFAULT 8'],
    ['stress_score', 'INTEGER NOT NULL DEFAULT 4'],
    ['fatigue_score', 'INTEGER NOT NULL DEFAULT 3'],
    ['isolation_score', 'INTEGER NOT NULL DEFAULT 3'],
    ['social_connection_score', 'INTEGER NOT NULL DEFAULT 8'],
    ['measurement_method', "TEXT NOT NULL DEFAULT 'Multi-sensor telemetry'"],
    ['sensor_source', "TEXT NOT NULL DEFAULT 'KN-Demo-Band v1'"],
    ['data_origin', "TEXT NOT NULL DEFAULT 'simulated_demo'"],
    ['data_quality', "TEXT NOT NULL DEFAULT 'HIGH DATA QUALITY'"],
    ['quality_reason', "TEXT NOT NULL DEFAULT 'Calibrated demo telemetry within expected bounds.'"],
    ['updated_at', "TEXT NOT NULL DEFAULT ''"],
  ];

  for (const [col, def] of additions) {
    if (!existingCols.includes(col)) {
      db.exec(`ALTER TABLE biomedical_measurements ADD COLUMN ${col} ${def}`);
    }
  }

  const alertCols = (
    db.prepare(`PRAGMA table_info(medical_alerts)`).all() as Array<{ name: string }>
  ).map((c) => c.name);
  const alertAdds: Array<[string, string]> = [
    ['explanation', "TEXT NOT NULL DEFAULT ''"],
    ['data_source', "TEXT NOT NULL DEFAULT 'Biomedical Telemetry'"],
    ['data_quality', "TEXT NOT NULL DEFAULT 'HIGH DATA QUALITY'"],
    ['suggested_next_step', "TEXT NOT NULL DEFAULT 'Repeat resting check and review with flight surgeon.'"],
    ['status', "TEXT NOT NULL DEFAULT 'open'"],
    ['resolved_by', 'TEXT'],
    ['resolved_at', 'TEXT'],
  ];
  for (const [col, def] of alertAdds) {
    if (!alertCols.includes(col)) {
      db.exec(`ALTER TABLE medical_alerts ADD COLUMN ${col} ${def}`);
    }
  }
}

function seedRolesAndPermissions(): void {
  const roleDescriptions: Record<UserRole, string> = {
    astronaut: 'Orbital and analog flight crew managing personal biomedical telemetry.',
    medical_specialist: 'Flight surgeons and aerospace clinicians reviewing astronaut health.',
    scientific_researcher: 'Biomedical investigators analyzing anonymized mission cohorts.',
    general_user: 'Public mission participants accessing educational wellness resources.',
    administrator: 'System governance operators managing roles, config, and official branding.',
  };

  const insertRole = db.prepare(
    `INSERT OR IGNORE INTO user_roles (role_key, display_name, description) VALUES (?, ?, ?)`
  );
  const insertPerm = db.prepare(
    `INSERT OR IGNORE INTO user_permissions (role_key, permission_key) VALUES (?, ?)`
  );

  for (const role of Object.keys(ROLE_LABELS) as UserRole[]) {
    insertRole.run(role, ROLE_LABELS[role], roleDescriptions[role]);
    for (const perm of getRolePermissions(role)) {
      insertPerm.run(role, perm);
    }
  }
}

function copyAssetAvatarIfAvailable(assetFileName: string, destFileName: string): string | null {
  try {
    const src = path.resolve(process.cwd(), 'src', 'assets', 'images', assetFileName);
    const dest = path.join(AVATARS_DIR, destFileName);
    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
      return `/uploads/avatars/${destFileName}`;
    }
  } catch {
    // ignore optional seed asset copy error
  }
  return null;
}

function seedDefaultUsersAndData(): void {
  const existingCount = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
  const now = new Date().toISOString();

  if (existingCount === 0) {
    const vegaAvatar = copyAssetAvatarIfAvailable(
      'avatar_astronaut_vega_1794709609877.jpg',
      'seed-vega.jpg'
    );
    const palaciosAvatar = copyAssetAvatarIfAvailable(
      'avatar_doctor_palacios_1794709610609.jpg',
      'seed-palacios.jpg'
    );
    const adminAvatar = copyAssetAvatarIfAvailable(
      'avatar_admin_kawsay_1794709609918.jpg',
      'seed-admin.jpg'
    );

    const seedAccounts: Array<{
      id: string;
      username: string;
      email: string;
      password: string;
      role: UserRole;
      fullName: string;
      country: string;
      city: string;
      lang: string;
      avatarPath: string | null;
    }> = [
      {
        id: 'usr-admin-001',
        username: 'admin.kawsay',
        email: 'admin@kawsaynova.org',
        password: 'KawsayAdmin2026!',
        role: 'administrator',
        fullName: 'Elena Reed',
        country: 'United States',
        city: 'Houston',
        lang: 'en',
        avatarPath: adminAvatar,
      },
      {
        id: 'usr-astro-001',
        username: 'commander.vega',
        email: 'vega@kawsaynova.org',
        password: 'KawsayUser2026!',
        role: 'astronaut',
        fullName: 'Cmdr. Camila Vega',
        country: 'Peru',
        city: 'Ayacucho',
        lang: 'en',
        avatarPath: vegaAvatar,
      },
      {
        id: 'usr-med-001',
        username: 'dr.palacios',
        email: 'palacios@kawsaynova.org',
        password: 'KawsayUser2026!',
        role: 'medical_specialist',
        fullName: 'Dr. Marcus Palacios',
        country: 'Colombia',
        city: 'Bogota',
        lang: 'en',
        avatarPath: palaciosAvatar,
      },
      {
        id: 'usr-res-001',
        username: 'dr.chen',
        email: 'chen@kawsaynova.org',
        password: 'KawsayUser2026!',
        role: 'scientific_researcher',
        fullName: 'Dr. Mei-Ling Chen',
        country: 'Canada',
        city: 'Montreal',
        lang: 'en',
        avatarPath: null,
      },
      {
        id: 'usr-gen-001',
        username: 'guest.luna',
        email: 'luna@kawsaynova.org',
        password: 'KawsayUser2026!',
        role: 'general_user',
        fullName: 'Luna Morales',
        country: 'Peru',
        city: 'Ayacucho',
        lang: 'es',
        avatarPath: null,
      },
    ];

    const insertUser = db.prepare(
      `INSERT INTO users (id, username, email, password_hash, role_key, status, created_at, last_access_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
    );
    const insertProfile = db.prepare(
      `INSERT INTO user_profiles (user_id, full_name, country, city, updated_at) VALUES (?, ?, ?, ?, ?)`
    );
    const insertPrefs = db.prepare(
      `INSERT INTO user_preferences (user_id, preferred_language, notify_biometric_alerts, notify_medical_reports, notify_system_security, notify_research_digests, email_visibility, telemetry_sharing)
       VALUES (?, ?, 1, 1, 1, ?, 'team', 1)`
    );
    const insertAvatar = db.prepare(
      `INSERT INTO user_avatars (user_id, storage_path, mime_type, file_size_bytes, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const acc of seedAccounts) {
      insertUser.run(acc.id, acc.username, acc.email, hashPassword(acc.password), acc.role, now, now);
      insertProfile.run(acc.id, acc.fullName, acc.country, acc.city, now);
      insertPrefs.run(acc.id, acc.lang, acc.role === 'scientific_researcher' ? 1 : 0);
      insertAvatar.run(acc.id, acc.avatarPath, acc.avatarPath ? 'image/jpeg' : null, 0, now);
    }

    db.prepare(
      `INSERT INTO app_branding (
        id, application_name, application_subtitle, organization_name, institutional_footer,
        contact_email, contact_phone, logo_storage_path, favicon_storage_path, report_logo_storage_path,
        logo_fit, logo_aspect_ratio, logo_display_height, logo_version, updated_by, updated_at, is_active
      ) VALUES (
        1, 'KAWSAY NOVA', 'ADVANCED ASTRONAUT HEALTH MONITORING SYSTEM',
        'KAWSAY NOVA · Ayacucho Aerospace Biomedical Initiative',
        'KAWSAY NOVA · EXPLORE. MONITOR. PROTECT. · FROM SPACE TO THE WORLD.',
        'telemetry@kawsaynova.org', '+51 (066) 555-0194',
        '/default-logo.svg', '/default-logo.svg', '/default-logo.svg',
        'contain', 'original', 36, 1, 'usr-admin-001', ?, 1
      )`
    ).run(now);

    db.prepare(
      `INSERT INTO branding_history (logo_version, logo_storage_path, favicon_storage_path, action, updated_by, updated_by_name, updated_at)
       VALUES (1, '/default-logo.svg', '/default-logo.svg', 'restored_default', 'usr-admin-001', 'Elena Reed', ?)`
    ).run(now);

    const insertVitals = db.prepare(
      `INSERT INTO biomedical_measurements (
        user_id, recorded_at, heart_rate_bpm, hrv_rmssd_ms, systolic_mmhg, diastolic_mmhg, map_mmhg,
        spo2_percent, respiratory_rate_rpm, core_temp_c, blood_glucose_mg_dl, hydration_liters,
        sleep_hours, activity_minutes, steps_count, cortisol_ug_dl, bone_density_index,
        muscle_strength_score, radiation_dose_msv, mood_score, stress_score, fatigue_score,
        isolation_score, social_connection_score, measurement_method, sensor_source,
        data_origin, data_quality, quality_reason, assessment_status, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const vegaSamples = [
      [
        '2026-11-11T08:30:00Z', 64, 48, 116, 74, 88.0, 98.4, 14, 36.7, 91, 2.6, 7.6, 50, 7400,
        11.2, 1.04, 92, 0.42, 8, 3, 2, 2, 9,
        'ECG Holter + Pulse Oximetry', 'KN-BioHarness Demo v1', 'simulated_demo',
        'HIGH DATA QUALITY', 'Calibrated simulated demo telemetry; clean RR baseline.', 'nominal',
        'DEMO DATA: Pre-EVA resting baseline nominal.', now,
      ],
      [
        '2026-11-12T14:15:00Z', 72, 43, 122, 78, 92.7, 97.9, 16, 36.9, 96, 2.3, 6.9, 65, 8100,
        14.8, 1.03, 90, 0.48, 8, 4, 4, 3, 8,
        'Resistive Ergometer Telemetry', 'KN-BioHarness Demo v1', 'simulated_demo',
        'HIGH DATA QUALITY', 'Simulated exercise recovery capture.', 'nominal',
        'DEMO DATA: Post-ergometer resistive training cycle.', now,
      ],
      [
        '2026-11-13T19:45:00Z', 84, 31, 134, 86, 102.0, 95.8, 19, 37.2, 104, 1.9, 5.8, 30, 4200,
        19.6, 1.02, 87, 0.56, 6, 7, 7, 5, 7,
        'Optical Wrist PPG (Motion Artifact)', 'KN-Wrist-Optical Demo', 'simulated_demo',
        'LOW DATA QUALITY', 'Motion artifact detected during centrifuge recovery; repeat resting measurement.', 'elevated',
        'DEMO DATA: Transient orthostatic stress & shortened sleep window.', now,
      ],
      [
        '2026-11-14T09:10:00Z', 66, 46, 118, 75, 89.3, 98.6, 15, 36.8, 93, 2.5, 7.4, 45, 6800,
        12.1, 1.03, 91, 0.59, 8, 3, 3, 3, 8,
        'Calibrated Multi-Sensor Station', 'KN-BioHarness Demo v1', 'simulated_demo',
        'HIGH DATA QUALITY', 'Signal quality 96%; repeated resting baseline consistent.', 'nominal',
        'DEMO DATA: Morning rest telemetry stabilized.', now,
      ],
    ];

    for (const s of vegaSamples) {
      insertVitals.run('usr-astro-001', ...s);
    }

    db.prepare(
      `INSERT INTO clinical_observations (astronaut_user_id, specialist_user_id, severity, summary, recommendation, created_at)
       VALUES (?, ?, 'advisory', ?, ?, ?)`
    ).run(
      'usr-astro-001',
      'usr-med-001',
      'DEMO DATA: Transient cortisol elevation (19.6 ug/dL) and shortened sleep (5.8 h) observed after centrifuge simulation.',
      'Maintain hydration protocol (2.5+ L/day), complete 7.5h sleep window, and repeat resting HRV measurement.',
      now
    );

    db.prepare(
      `INSERT INTO medical_alerts (
        astronaut_user_id, metric, observed_value, threshold, severity, explanation, data_source, data_quality, suggested_next_step, acknowledged, created_at
      ) VALUES (?, 'Cortisol & Sleep Load', '19.6 ug/dL · 5.8h', 'Baseline < 18.0 ug/dL', 'warning',
        'Observed together with reduced HRV (31 ms) during simulated post-centrifuge recovery. Optical wrist capture marked LOW DATA QUALITY.',
        'KN-Wrist-Optical Demo (Simulated)', 'LOW DATA QUALITY',
        'Repeat resting measurement with calibrated chest ECG strap and review sleep schedule.', 0, ?)`
    ).run('usr-astro-001', now);

    logAudit(
      'usr-admin-001',
      'admin.kawsay',
      'SYSTEM_INITIALIZED',
      'system',
      'kawsay-nova',
      'Initial KAWSAY NOVA schema, RBAC matrix, and default branding provisioned.'
    );
  }

  // Ensure Astronaut Mission Profiles & Mission Calendar Tasks are seeded idempotently
  const missionProfCount = (
    db.prepare(`SELECT COUNT(*) as c FROM astronaut_mission_profiles`).get() as { c: number }
  ).c;
  if (missionProfCount === 0) {
    db.prepare(
      `INSERT INTO astronaut_mission_profiles (
        id, user_id, callsign, full_name, age, mission_id, mission_name, mission_phase,
        mission_duration_days, mission_start_date, mission_destination, medical_background,
        baseline_hr_bpm, baseline_hrv_ms, baseline_sbp_mmhg, baseline_dbp_mmhg,
        baseline_spo2_pct, baseline_temp_c, health_history, sensors_list, is_demo_data, updated_at
      ) VALUES (
        'mp-vega-01', 'usr-astro-001', 'KN-CDR-01', 'Cmdr. Camila Vega (DEMO PROFILE)', 34,
        'KN-LUNAR-2026', 'Artemis-Class Analog / Lunar Transit Demo', 'Orbital Cruise · Day 18',
        180, '2026-10-27', 'Lunar South Pole Analog / Cislunar Orbit',
        'Fictional demonstration baseline: High-altitude Andean adaptation conditioning (Ayacucho 2,761 m); no chronic cardiopulmonary conditions.',
        64, 48, 116, 74, 98.4, 36.7,
        'Cleared for resistive ergometer, EVA suit pressure tests, and circadian phase-shift protocols.',
        'KN-BioHarness ECG (Simulated), Calibrated Pulse Oximeter (Simulated), Tympanic Thermistor (Simulated)',
        1, ?
      )`
    ).run(now);
  }

  const taskCount = (db.prepare(`SELECT COUNT(*) as c FROM mission_tasks`).get() as { c: number }).c;
  if (taskCount === 0) {
    const insertTask = db.prepare(
      `INSERT INTO mission_tasks (user_id, title, category, scheduled_date, scheduled_time, completed, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertTask.run(
      'usr-astro-001',
      'Morning Resting ECG & HRV Capture (5 min)',
      'health_assessment',
      '2026-11-15',
      '07:30',
      1,
      'Ensure stationary supine posture to minimize motion artifact.',
      now
    );
    insertTask.run(
      'usr-astro-001',
      'ARED Resistive Bone-Loading Protocol',
      'physical_activity',
      '2026-11-15',
      '10:00',
      0,
      '45 min lower-body countermeasure session.',
      now
    );
    insertTask.run(
      'usr-astro-001',
      'Hydration & Electrolyte Intake Check (2.5 L target)',
      'hydration_nutrition',
      '2026-11-15',
      '15:00',
      0,
      'Log fluid intake and post-exercise recovery.',
      now
    );
    insertTask.run(
      'usr-astro-001',
      'Pre-Sleep Circadian Dim-Out & Mood Log',
      'sleep_routine',
      '2026-11-15',
      '21:30',
      0,
      'Reduce blue-spectrum illumination 90 min prior to sleep window.',
      now
    );
  }

  const assessmentCount = (db.prepare(`SELECT COUNT(*) as c FROM mental_assessments`).get() as { c: number }).c;
  if (assessmentCount === 0) {
    db.prepare(
      `INSERT INTO mental_assessments (user_id, mood_score, stress_score, fatigue_score, sleep_quality_score, notes, is_private, recorded_at)
       VALUES (?, 8, 3, 3, 8, ?, 1, ?)`
    ).run(
      'usr-astro-001',
      'DEMO BASELINE: Steady focus after pre-sleep circadian dim-out and audio link with ground team.',
      now
    );
  }
}

export function logAudit(
  actorUserId: string | null,
  actorUsername: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: string
): void {
  db.prepare(
    `INSERT INTO audit_logs (actor_user_id, actor_username, action, resource_type, resource_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(actorUserId, actorUsername, action, resourceType, resourceId, details, new Date().toISOString());
}

export function getUserAccountById(userId: string): UserAccount | null {
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.email, u.role_key, u.status, u.created_at, u.last_access_at,
              p.full_name, p.country, p.city,
              pr.preferred_language, pr.notify_biometric_alerts, pr.notify_medical_reports,
              pr.notify_system_security, pr.notify_research_digests, pr.email_visibility, pr.telemetry_sharing,
              a.storage_path, a.mime_type
       FROM users u
       JOIN user_profiles p ON p.user_id = u.id
       JOIN user_preferences pr ON pr.user_id = u.id
       LEFT JOIN user_avatars a ON a.user_id = u.id
       WHERE u.id = ?`
    )
    .get(userId) as Record<string, unknown> | undefined;

  if (!row) return null;
  return mapRowToUserAccount(row);
}

export function mapRowToUserAccount(row: Record<string, unknown>): UserAccount {
  const role = row.role_key as UserRole;
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    role,
    status: row.status as UserAccount['status'],
    createdAt: String(row.created_at),
    lastAccessAt: String(row.last_access_at),
    fullName: String(row.full_name),
    country: String(row.country),
    city: String(row.city),
    preferredLanguage: String(row.preferred_language) as UserAccount['preferredLanguage'],
    avatarUrl: row.storage_path ? String(row.storage_path) : null,
    avatarMimeType: row.mime_type ? String(row.mime_type) : null,
    notifications: {
      biometricAlerts: Boolean(row.notify_biometric_alerts),
      medicalReports: Boolean(row.notify_medical_reports),
      systemSecurity: Boolean(row.notify_system_security),
      researchDigests: Boolean(row.notify_research_digests),
    },
    emailVisibility: (row.email_visibility as 'private' | 'team') || 'private',
    telemetrySharing: Boolean(row.telemetry_sharing),
    permissions: getRolePermissions(role),
  };
}

export function getActiveBranding(): AppBranding {
  const row = db
    .prepare(
      `SELECT b.*, COALESCE(p.full_name, 'System') as updated_by_name
       FROM app_branding b
       LEFT JOIN user_profiles p ON p.user_id = b.updated_by
       WHERE b.id = 1`
    )
    .get() as Record<string, unknown>;

  return {
    id: Number(row.id),
    applicationName: 'KAWSAY NOVA',
    applicationSubtitle: String(row.application_subtitle),
    organizationName: String(row.organization_name),
    institutionalFooter: String(row.institutional_footer),
    contactEmail: String(row.contact_email),
    contactPhone: String(row.contact_phone),
    logoStoragePath: String(row.logo_storage_path),
    faviconStoragePath: String(row.favicon_storage_path),
    reportLogoStoragePath: String(row.report_logo_storage_path),
    logoFit: (row.logo_fit as 'contain' | 'cover') || 'contain',
    logoAspectRatio: (row.logo_aspect_ratio as AppBranding['logoAspectRatio']) || 'original',
    logoDisplayHeight: Number(row.logo_display_height) || 36,
    logoVersion: Number(row.logo_version) || 1,
    updatedBy: String(row.updated_by || ''),
    updatedByName: String(row.updated_by_name || 'System'),
    updatedAt: String(row.updated_at),
    isActive: Boolean(row.is_active),
  };
}

export function getBrandingHistory(): BrandingHistoryEntry[] {
  const rows = db
    .prepare(
      `SELECT id, logo_version, logo_storage_path, favicon_storage_path, action, updated_by, updated_by_name, updated_at
       FROM branding_history ORDER BY id DESC LIMIT 20`
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: Number(r.id),
    logoVersion: Number(r.logo_version),
    logoStoragePath: String(r.logo_storage_path),
    faviconStoragePath: String(r.favicon_storage_path),
    action: r.action as BrandingHistoryEntry['action'],
    updatedBy: String(r.updated_by),
    updatedByName: String(r.updated_by_name),
    updatedAt: String(r.updated_at),
  }));
}

export function getAuditLogs(limit = 50): AuditLogEntry[] {
  const rows = db
    .prepare(
      `SELECT id, actor_user_id, actor_username, action, resource_type, resource_id, details, created_at
       FROM audit_logs ORDER BY id DESC LIMIT ?`
    )
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: Number(r.id),
    actorUserId: r.actor_user_id ? String(r.actor_user_id) : null,
    actorUsername: String(r.actor_username),
    action: String(r.action),
    resourceType: String(r.resource_type),
    resourceId: String(r.resource_id),
    details: String(r.details),
    createdAt: String(r.created_at),
  }));
}

export function getMeasurementsForUser(userId: string): BiomedicalMeasurement[] {
  const rows = db
    .prepare(
      `SELECT m.*, p.full_name as astronaut_name
       FROM biomedical_measurements m
       JOIN user_profiles p ON p.user_id = m.user_id
       WHERE m.user_id = ?
       ORDER BY m.recorded_at DESC`
    )
    .all(userId) as Array<Record<string, unknown>>;

  return rows.map(mapMeasurementRow);
}

export function getAllAstronautMeasurements(): BiomedicalMeasurement[] {
  const rows = db
    .prepare(
      `SELECT m.*, p.full_name as astronaut_name
       FROM biomedical_measurements m
       JOIN users u ON u.id = m.user_id
       JOIN user_profiles p ON p.user_id = m.user_id
       WHERE u.role_key = 'astronaut'
       ORDER BY m.recorded_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map(mapMeasurementRow);
}

function mapMeasurementRow(r: Record<string, unknown>): BiomedicalMeasurement {
  return {
    id: Number(r.id),
    userId: String(r.user_id),
    astronautName: String(r.astronaut_name),
    recordedAt: String(r.recorded_at),
    heartRateBpm: Number(r.heart_rate_bpm),
    hrvRmssdMs: Number(r.hrv_rmssd_ms ?? 42),
    systolicMmHg: Number(r.systolic_mmhg),
    diastolicMmHg: Number(r.diastolic_mmhg),
    mapMmHg: Number(r.map_mmhg ?? 92),
    spo2Percent: Number(r.spo2_percent),
    respiratoryRateRpm: Number(r.respiratory_rate_rpm ?? 15),
    coreTempC: Number(r.core_temp_c),
    bloodGlucoseMgDl: Number(r.blood_glucose_mg_dl ?? 94),
    hydrationLiters: Number(r.hydration_liters ?? 2.4),
    sleepHours: Number(r.sleep_hours ?? 7.2),
    activityMinutes: Number(r.activity_minutes ?? 45),
    stepsCount: Number(r.steps_count ?? 6200),
    cortisolUgDl: Number(r.cortisol_ug_dl),
    boneDensityIndex: Number(r.bone_density_index),
    muscleStrengthScore: Number(r.muscle_strength_score ?? 88),
    radiationDoseMsv: Number(r.radiation_dose_msv),
    moodScore: Number(r.mood_score ?? 8),
    stressScore: Number(r.stress_score ?? 4),
    fatigueScore: Number(r.fatigue_score ?? 3),
    isolationScore: Number(r.isolation_score ?? 3),
    socialConnectionScore: Number(r.social_connection_score ?? 8),
    measurementMethod: String(r.measurement_method ?? 'Multi-sensor telemetry'),
    sensorSource: String(r.sensor_source ?? 'KN-Demo-Band v1'),
    dataOrigin: (r.data_origin as DataOrigin) ?? 'simulated_demo',
    dataQuality: (r.data_quality as DataQualityLabel) ?? 'HIGH DATA QUALITY',
    qualityReason: String(r.quality_reason ?? ''),
    assessmentStatus: r.assessment_status as BiomedicalMeasurement['assessmentStatus'],
    notes: String(r.notes || ''),
    updatedAt: String(r.updated_at || r.recorded_at),
  };
}

export function getMissionProfiles(userId?: string): AstronautMissionProfile[] {
  const rows = (
    userId
      ? db.prepare(`SELECT * FROM astronaut_mission_profiles WHERE user_id = ? ORDER BY updated_at DESC`).all(userId)
      : db.prepare(`SELECT * FROM astronaut_mission_profiles ORDER BY updated_at DESC`).all()
  ) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.user_id),
    callsign: String(r.callsign),
    fullName: String(r.full_name),
    age: Number(r.age),
    missionId: String(r.mission_id),
    missionName: String(r.mission_name),
    missionPhase: String(r.mission_phase),
    missionDurationDays: Number(r.mission_duration_days),
    missionStartDate: String(r.mission_start_date),
    missionDestination: String(r.mission_destination),
    medicalBackground: String(r.medical_background),
    baselineHrBpm: Number(r.baseline_hr_bpm),
    baselineHrvMs: Number(r.baseline_hrv_ms),
    baselineSbpMmHg: Number(r.baseline_sbp_mmhg),
    baselineDbpMmHg: Number(r.baseline_dbp_mmhg),
    baselineSpo2Pct: Number(r.baseline_spo2_pct),
    baselineTempC: Number(r.baseline_temp_c),
    healthHistory: String(r.health_history),
    sensorsList: String(r.sensors_list),
    isDemoData: Boolean(r.is_demo_data),
    updatedAt: String(r.updated_at),
  }));
}

export function getMissionTasks(userId: string): MissionTask[] {
  const rows = db
    .prepare(`SELECT * FROM mission_tasks WHERE user_id = ? ORDER BY scheduled_date ASC, scheduled_time ASC`)
    .all(userId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: Number(r.id),
    userId: String(r.user_id),
    title: String(r.title),
    category: r.category as MissionTask['category'],
    scheduledDate: String(r.scheduled_date),
    scheduledTime: String(r.scheduled_time),
    completed: Boolean(r.completed),
    notes: String(r.notes || ''),
    createdAt: String(r.created_at),
  }));
}

export function getObservations(astronautUserId?: string): ClinicalObservation[] {
  const baseQuery = `
    SELECT c.*, pa.full_name as astronaut_name, ps.full_name as specialist_name
    FROM clinical_observations c
    JOIN user_profiles pa ON pa.user_id = c.astronaut_user_id
    JOIN user_profiles ps ON ps.user_id = c.specialist_user_id
  `;
  const rows = (
    astronautUserId
      ? db.prepare(`${baseQuery} WHERE c.astronaut_user_id = ? ORDER BY c.id DESC`).all(astronautUserId)
      : db.prepare(`${baseQuery} ORDER BY c.id DESC`).all()
  ) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: Number(r.id),
    astronautUserId: String(r.astronaut_user_id),
    astronautName: String(r.astronaut_name),
    specialistUserId: String(r.specialist_user_id),
    specialistName: String(r.specialist_name),
    severity: r.severity as ClinicalObservation['severity'],
    summary: String(r.summary),
    recommendation: String(r.recommendation),
    createdAt: String(r.created_at),
  }));
}

export function getMedicalAlerts(astronautUserId?: string): MedicalAlert[] {
  const baseQuery = `
    SELECT a.*, p.full_name as astronaut_name
    FROM medical_alerts a
    JOIN user_profiles p ON p.user_id = a.astronaut_user_id
  `;
  const rows = (
    astronautUserId
      ? db.prepare(`${baseQuery} WHERE a.astronaut_user_id = ? ORDER BY a.id DESC`).all(astronautUserId)
      : db.prepare(`${baseQuery} ORDER BY a.id DESC`).all()
  ) as Array<Record<string, unknown>>;

  return rows.map((r) => {
    const rawSev = String(r.severity);
    const severity: MedicalAlert['severity'] =
      rawSev === 'critical'
        ? 'critical'
        : rawSev === 'advisory' || rawSev === 'warning'
          ? 'warning'
          : rawSev === 'normal'
            ? 'normal'
            : 'info';
    const acknowledged = Boolean(r.acknowledged);
    const rawStatus = String(r.status || '');
    const status: MedicalAlert['status'] =
      rawStatus === 'resolved'
        ? 'resolved'
        : rawStatus === 'acknowledged' || acknowledged
          ? 'acknowledged'
          : 'open';
    return {
      id: Number(r.id),
      astronautUserId: String(r.astronaut_user_id),
      astronautName: String(r.astronaut_name),
      metric: String(r.metric),
      observedValue: String(r.observed_value),
      threshold: String(r.threshold),
      severity,
      status,
      explanation: String(r.explanation || ''),
      dataSource: String(r.data_source || 'Biomedical Telemetry'),
      dataQuality: (r.data_quality as DataQualityLabel) || 'HIGH DATA QUALITY',
      suggestedNextStep: String(
        r.suggested_next_step || 'Repeat resting check and consult flight surgeon.'
      ),
      acknowledged,
      resolvedBy: r.resolved_by ? String(r.resolved_by) : null,
      resolvedAt: r.resolved_at ? String(r.resolved_at) : null,
      createdAt: String(r.created_at),
    };
  });
}

export function getMentalAssessments(userId: string): MentalAssessment[] {
  const rows = db
    .prepare(
      `SELECT id, user_id, mood_score, stress_score, fatigue_score, sleep_quality_score, notes, is_private, recorded_at
       FROM mental_assessments WHERE user_id = ? ORDER BY recorded_at DESC, id DESC LIMIT 50`
    )
    .all(userId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: Number(r.id),
    userId: String(r.user_id),
    moodScore: Number(r.mood_score),
    stressScore: Number(r.stress_score),
    fatigueScore: Number(r.fatigue_score),
    sleepQualityScore: Number(r.sleep_quality_score ?? 7),
    notes: String(r.notes || ''),
    isPrivate: Boolean(r.is_private),
    recordedAt: String(r.recorded_at),
  }));
}

export function getWellnessCompletions(userId: string): WellnessCompletion[] {
  const rows = db
    .prepare(
      `SELECT resource_id, completed_date, completed_at
       FROM wellness_completions WHERE user_id = ? ORDER BY completed_at DESC LIMIT 60`
    )
    .all(userId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    resourceId: String(r.resource_id),
    completedDate: String(r.completed_date),
    completedAt: String(r.completed_at),
  }));
}

export function getSavedReports(userId: string, role: UserRole): SavedMedicalReport[] {
  const rows = (
    role === 'administrator' || role === 'medical_specialist'
      ? db.prepare(`SELECT * FROM saved_reports ORDER BY created_at DESC LIMIT 40`).all()
      : db
          .prepare(`SELECT * FROM saved_reports WHERE created_by_user_id = ? ORDER BY created_at DESC LIMIT 40`)
          .all(userId)
  ) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    createdByUserId: String(r.created_by_user_id),
    createdByName: String(r.created_by_name),
    title: String(r.title),
    reportLang: String(r.report_lang) as LanguageCode,
    viewMode: (r.view_mode === 'cover' ? 'cover' : 'document') as 'cover' | 'document',
    measurementCount: Number(r.measurement_count),
    observationCount: Number(r.observation_count),
    summaryJson: String(r.summary_json),
    createdAt: String(r.created_at),
  }));
}

export function getAggregatedResearchCohorts(): AggregatedResearchCohort[] {
  const row = db
    .prepare(
      `SELECT COUNT(*) as n,
              ROUND(AVG(heart_rate_bpm), 1) as avg_hr,
              ROUND(AVG(spo2_percent), 2) as avg_spo2,
              ROUND(AVG(cortisol_ug_dl), 2) as avg_cort,
              ROUND(AVG(bone_density_index), 3) as avg_bdi,
              ROUND(AVG(radiation_dose_msv), 3) as avg_rad
       FROM biomedical_measurements m
       JOIN user_preferences pr ON pr.user_id = m.user_id
       WHERE pr.telemetry_sharing = 1`
    )
    .get() as Record<string, number | null>;

  return [
    {
      cohortId: 'KN-COHORT-LEO-2026',
      missionPhase: 'Live Anonymized Telemetry Pool (Consented)',
      sampleCount: Number(row.n || 0),
      avgHeartRateBpm: Number(row.avg_hr || 68.5),
      avgSpo2Percent: Number(row.avg_spo2 || 98.1),
      avgCortisolUgDl: Number(row.avg_cort || 14.2),
      avgBoneDensityIndex: Number(row.avg_bdi || 1.03),
      radiationMeanMsv: Number(row.avg_rad || 0.51),
    },
    {
      cohortId: 'KN-COHORT-ANALOG-30D',
      missionPhase: 'High-Altitude Andean Analog (Ayacucho / Cusco Corridor)',
      sampleCount: 48,
      avgHeartRateBpm: 74.2,
      avgSpo2Percent: 94.8,
      avgCortisolUgDl: 16.4,
      avgBoneDensityIndex: 1.045,
      radiationMeanMsv: 0.18,
    },
    {
      cohortId: 'KN-COHORT-MICROG-90D',
      missionPhase: 'Orbital Microgravity Reference Baseline (Demo)',
      sampleCount: 112,
      avgHeartRateBpm: 69.8,
      avgSpo2Percent: 97.6,
      avgCortisolUgDl: 15.1,
      avgBoneDensityIndex: 0.985,
      radiationMeanMsv: 1.24,
    },
  ];
}

export const WELLNESS_RESOURCES: WellnessResource[] = [
  {
    id: 'well-circadian',
    title: 'Orbital Circadian Phase Alignment',
    category: 'Sleep & Neuro-Recovery',
    durationMinutes: 15,
    summary: 'Structured light-exposure and dim-out schedule for 90-minute orbital light cycles.',
    protocolSteps: [
      'Bright light exposure immediately upon scheduled wake window.',
      'Minimize blue-wavelength exposure 90 minutes prior to sleep.',
      'Log resting heart rate and subjective recovery score.',
    ],
  },
  {
    id: 'well-vestibular',
    title: 'Vestibular & Orthostatic Conditioning',
    category: 'Cardiovascular Resilience',
    durationMinutes: 20,
    summary: 'Guided breathing and lower-body vascular tone exercises for gravity transition adaptation.',
    protocolSteps: [
      '4-second nasal inhale, 6-second controlled exhale for 8 cycles.',
      'Isometric calf and quadriceps compression sets (3 x 45 seconds).',
      'Hydrate with electrolyte solution post-session.',
    ],
  },
  {
    id: 'well-hypoxia',
    title: 'High-Altitude Respiratory Efficiency',
    category: 'Cardiopulmonary Education',
    durationMinutes: 12,
    summary: 'Educational primer on SpO2 kinetics in reduced-pressure cabin and Andean high-altitude environments.',
    protocolSteps: [
      'Observe resting SpO2 across 3 minutes of quiet nasal breathing.',
      'Compare saturation reading with ambient barometric pressure.',
      'Review recovery time following moderate aerobic exertion.',
    ],
  },
];

export function generateUserId(): string {
  return `usr-${crypto.randomBytes(6).toString('hex')}`;
}
