import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import type { LanguageCode, UserRole } from './src/types/kawsay';
import { translateOfflineText } from './src/utils/i18n';
import { evaluateDataQuality, validateMeasurementInput } from './src/utils/precisionCore';
import {
  canAccessUserProfile,
  canAssignRolePublicly,
  validateMissionTaskInput,
  validatePasswordChange,
  validateProfileUpdateInput,
  validateRegistrationInput,
} from './src/utils/validation';
import {
  ADMIN_PROVISION_CODE,
  clearSessionCookie,
  createSessionToken,
  extractBearerToken,
  getSessionFromRequest,
  hashPassword,
  requireAuth,
  requirePermission,
  saveUploadedImageToDisk,
  setSessionCookie,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth';
import {
  AVATARS_DIR,
  BRANDING_DIR,
  db,
  generateUserId,
  getActiveBranding,
  getAggregatedResearchCohorts,
  getAllAstronautMeasurements,
  getAuditLogs,
  getBrandingHistory,
  getMeasurementsForUser,
  getMedicalAlerts,
  getMentalAssessments,
  getMissionProfiles,
  getMissionTasks,
  getObservations,
  getSavedReports,
  getUserAccountById,
  getWellnessCompletions,
  initDatabase,
  logAudit,
  mapRowToUserAccount,
  UPLOADS_DIR,
  WELLNESS_RESOURCES,
} from './server/db';

initDatabase();

const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3000);

function getConfiguredGeminiClient(): GoogleGenAI | null {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Public active branding & capability status
app.get('/api/branding/active', (_req, res) => {
  res.json({ branding: getActiveBranding() });
});

app.get('/api/system/capabilities', (_req, res) => {
  const aiClient = getConfiguredGeminiClient();
  res.json({
    geminiConfigured: Boolean(aiClient),
    model: aiClient ? 'gemini-4-hydrogen' : null,
    wearableHardwareConnected: false,
    wearableStatusNote:
      'No external biometric wearable hardware is connected; measurements use manual entry, calculated equations, or labeled demonstration telemetry.',
  });
});

// Authentication endpoints
app.get('/api/auth/me', (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.json({ user: null, sessionToken: null });
    return;
  }
  const user = getUserAccountById(session.uid);
  if (!user || user.status !== 'active') {
    clearSessionCookie(res, req);
    res.json({ user: null, sessionToken: null });
    return;
  }
  const sessionToken =
    extractBearerToken(req.headers.authorization) || createSessionToken(user.id, user.role);
  res.json({ user, sessionToken });
});

app.post('/api/auth/register', (req, res) => {
  const body = req.body ?? {};
  const validation = validateRegistrationInput({
    fullName: String(body.fullName ?? ''),
    username: String(body.username ?? ''),
    email: String(body.email ?? ''),
    password: String(body.password ?? ''),
    passwordConfirmation: String(body.passwordConfirmation ?? ''),
    country: String(body.country ?? ''),
    city: String(body.city ?? ''),
    preferredLanguage: String(body.preferredLanguage ?? 'en'),
    role: String(body.role ?? 'general_user'),
  });

  if (!validation.valid) {
    res.status(400).json({ error: 'Validation failed.', fieldErrors: validation.errors });
    return;
  }

  const requestedRole = body.role as UserRole;
  const adminCheck = canAssignRolePublicly(
    requestedRole,
    body.adminProvisionCode,
    ADMIN_PROVISION_CODE
  );
  if (!adminCheck.allowed) {
    logAudit(
      null,
      String(body.username || 'anonymous'),
      'BLOCKED_PRIVILEGE_ESCALATION',
      'user_role',
      requestedRole,
      'Attempted public registration as System Administrator without valid provisioning authorization.'
    );
    res.status(403).json({
      error: adminCheck.reason,
      fieldErrors: { role: adminCheck.reason || 'Unauthorized role selection.' },
    });
    return;
  }

  const username = String(body.username).trim();
  const email = String(body.email).trim().toLowerCase();

  const existing = db
    .prepare(`SELECT id, username, email FROM users WHERE username = ? OR email = ?`)
    .get(username, email) as { id: string; username: string; email: string } | undefined;

  if (existing) {
    const fieldErrors: Record<string, string> = {};
    if (existing.username.toLowerCase() === username.toLowerCase()) {
      fieldErrors.username = 'Username is already registered.';
    }
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      fieldErrors.email = 'Email address is already registered.';
    }
    res.status(409).json({ error: 'Account already exists.', fieldErrors });
    return;
  }

  const userId = generateUserId();
  const now = new Date().toISOString();
  let avatarPath: string | null = null;
  let avatarMime: string | null = null;
  let avatarBytes = 0;

  if (body.avatarDataUrl) {
    const saved = saveUploadedImageToDisk({
      targetDir: AVATARS_DIR,
      publicPrefix: '/uploads/avatars',
      fileBaseName: `${userId}-${Date.now()}`,
      dataUrlOrBase64: String(body.avatarDataUrl),
      mimeType: String(body.avatarMimeType || ''),
      allowSvg: false,
    });
    if (!saved.ok) {
      res.status(400).json({ error: saved.error, fieldErrors: { avatar: saved.error } });
      return;
    }
    avatarPath = saved.publicPath;
    avatarMime = saved.mimeType;
    avatarBytes = saved.bytes;
  }

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, role_key, status, created_at, last_access_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
    ).run(userId, username, email, hashPassword(String(body.password)), requestedRole, now, now);

    db.prepare(
      `INSERT INTO user_profiles (user_id, full_name, country, city, updated_at) VALUES (?, ?, ?, ?, ?)`
    ).run(userId, String(body.fullName).trim(), String(body.country).trim(), String(body.city).trim(), now);

    db.prepare(
      `INSERT INTO user_preferences (user_id, preferred_language) VALUES (?, ?)`
    ).run(userId, String(body.preferredLanguage));

    db.prepare(
      `INSERT INTO user_avatars (user_id, storage_path, mime_type, file_size_bytes, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, avatarPath, avatarMime, avatarBytes, now);

    if (requestedRole === 'astronaut') {
      db.prepare(
        `INSERT INTO biomedical_measurements (
          user_id, recorded_at, heart_rate_bpm, hrv_rmssd_ms, systolic_mmhg, diastolic_mmhg, map_mmhg,
          spo2_percent, respiratory_rate_rpm, core_temp_c, blood_glucose_mg_dl, hydration_liters,
          sleep_hours, activity_minutes, steps_count, cortisol_ug_dl, bone_density_index,
          muscle_strength_score, radiation_dose_msv, mood_score, stress_score, fatigue_score,
          isolation_score, social_connection_score, measurement_method, sensor_source,
          data_origin, data_quality, quality_reason, assessment_status, notes, updated_at
        ) VALUES (?, ?, 68, 45, 118, 76, 90.0, 98.2, 15, 36.7, 92, 2.4, 7.5, 40, 6200, 12.4, 1.02, 90, 0.35, 8, 3, 3, 2, 8, 'Manual Baseline Entry', 'Onboarding Baseline', 'manual_entry', 'ACCEPTABLE DATA QUALITY', 'Initial manual onboarding baseline.', 'nominal', 'Initial onboarding baseline telemetry.', ?)`
      ).run(userId, now, now);

      db.prepare(
        `INSERT INTO astronaut_mission_profiles (
          id, user_id, callsign, full_name, age, mission_id, mission_name, mission_phase,
          mission_duration_days, mission_start_date, mission_destination, medical_background,
          baseline_hr_bpm, baseline_hrv_ms, baseline_sbp_mmhg, baseline_dbp_mmhg,
          baseline_spo2_pct, baseline_temp_c, health_history, sensors_list, is_demo_data, updated_at
        ) VALUES (?, ?, ?, ?, 32, 'KN-LEO-2026', 'Orbital Health Baseline Mission', 'Pre-Flight Readiness', 90, ?, 'Low Earth Orbit', 'Baseline pending medical clearance.', 68, 45, 118, 76, 98.2, 36.7, 'No acute observations.', 'Manual Entry / Pending Sensor Calibration', 1, ?)`
      ).run(
        `mp-${userId}`,
        userId,
        `KN-${username.slice(0, 5).toUpperCase()}`,
        String(body.fullName).trim(),
        now.slice(0, 10),
        now
      );
    }
  });

  tx();

  logAudit(
    userId,
    username,
    'USER_REGISTERED',
    'user',
    userId,
    `Registered new ${requestedRole} account from ${String(body.city).trim()}, ${String(body.country).trim()}.`
  );

  const sessionToken = createSessionToken(userId, requestedRole);
  setSessionCookie(res, sessionToken, req);
  res.status(201).json({
    user: getUserAccountById(userId),
    sessionToken,
    message: 'Account created successfully.',
  });
});

app.post('/api/auth/login', (req, res) => {
  const identifier = String(req.body?.identifier ?? '').trim();
  const password = String(req.body?.password ?? '');

  if (!identifier || !password) {
    res.status(400).json({ error: 'Username or email and password are required.' });
    return;
  }

  const row = db
    .prepare(
      `SELECT id, username, role_key, password_hash, status
       FROM users
       WHERE username = ? OR email = ?`
    )
    .get(identifier, identifier.toLowerCase()) as
    | { id: string; username: string; role_key: UserRole; password_hash: string; status: string }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    logAudit(null, identifier, 'LOGIN_FAILED', 'auth', identifier, 'Invalid username/email or password attempt.');
    res.status(401).json({ error: 'Invalid credentials. Verify username/email and password.' });
    return;
  }

  if (row.status !== 'active') {
    res.status(403).json({ error: `Account status is ${row.status}. Contact system administrator.` });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE users SET last_access_at = ? WHERE id = ?`).run(now, row.id);
  const sessionToken = createSessionToken(row.id, row.role_key);
  setSessionCookie(res, sessionToken, req);

  logAudit(row.id, row.username, 'USER_LOGIN', 'auth', row.id, 'Authenticated session started.');
  res.json({ user: getUserAccountById(row.id), sessionToken });
});

app.post('/api/auth/logout', (req, res) => {
  const session = getSessionFromRequest(req);
  if (session) {
    const user = getUserAccountById(session.uid);
    if (user) {
      logAudit(user.id, user.username, 'USER_LOGOUT', 'auth', user.id, 'Session terminated by user.');
    }
  }
  clearSessionCookie(res, req);
  res.json({ ok: true });
});

app.post('/api/auth/recover/request', (req, res) => {
  const identifier = String(req.body?.identifier ?? '').trim();
  if (!identifier) {
    res.status(400).json({ error: 'Enter your username or email address to initiate access recovery.' });
    return;
  }

  const row = db
    .prepare(`SELECT id, username, email, status FROM users WHERE username = ? OR email = ?`)
    .get(identifier, identifier.toLowerCase()) as
    | { id: string; username: string; email: string; status: string }
    | undefined;

  if (!row || row.status !== 'active') {
    res.status(404).json({ error: 'No active account matched that username or email address.' });
    return;
  }

  const token = `KN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO password_recovery_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`
  ).run(token, row.id, expiresAt, now.toISOString());

  logAudit(row.id, row.username, 'RECOVERY_TOKEN_ISSUED', 'auth', row.id, 'Generated single-use 15-min recovery code.');
  res.json({
    ok: true,
    username: row.username,
    recoveryCode: token,
    expiresAt,
    note: 'No external SMTP mail relay is configured in this workspace; use this time-limited single-use verification code to reset your password.',
  });
});

app.post('/api/auth/recover/reset', (req, res) => {
  const identifier = String(req.body?.identifier ?? '').trim();
  const recoveryCode = String(req.body?.recoveryCode ?? '').trim().toUpperCase();
  const newPassword = String(req.body?.newPassword ?? '');
  const confirmNewPassword = String(req.body?.confirmNewPassword ?? '');

  if (!identifier || !recoveryCode) {
    res.status(400).json({ error: 'Account identifier and recovery code are required.' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }
  if (newPassword !== confirmNewPassword) {
    res.status(400).json({ error: 'New password confirmation does not match.' });
    return;
  }

  const userRow = db
    .prepare(`SELECT id, username FROM users WHERE username = ? OR email = ?`)
    .get(identifier, identifier.toLowerCase()) as { id: string; username: string } | undefined;

  if (!userRow) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const tokenRow = db
    .prepare(
      `SELECT token, expires_at, used_at FROM password_recovery_tokens WHERE token = ? AND user_id = ?`
    )
    .get(recoveryCode, userRow.id) as
    | { token: string; expires_at: string; used_at: string | null }
    | undefined;

  if (!tokenRow || tokenRow.used_at || tokenRow.expires_at < nowIso) {
    res.status(400).json({ error: 'Recovery code is invalid, already used, or expired.' });
    return;
  }

  db.transaction(() => {
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashPassword(newPassword), userRow.id);
    db.prepare(`UPDATE password_recovery_tokens SET used_at = ? WHERE token = ?`).run(nowIso, recoveryCode);
  })();

  logAudit(userRow.id, userRow.username, 'PASSWORD_RECOVERED', 'auth', userRow.id, 'Password reset via verified single-use recovery token.');
  res.json({ ok: true, message: 'Password reset completed. You can now sign in with your new password.' });
});

// User Profile & Account Management
app.get('/api/users/:id/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const targetId = req.params.id;
  const targetUser = getUserAccountById(targetId);
  if (!targetUser) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  if (!canAccessUserProfile(req.authUser!, targetUser.id, targetUser.role)) {
    const actor = getUserAccountById(req.authUser!.id);
    logAudit(
      req.authUser!.id,
      actor?.username || req.authUser!.id,
      'UNAUTHORIZED_PROFILE_ACCESS',
      'user_profile',
      targetId,
      `Blocked attempt by ${req.authUser!.role} to access profile ${targetId}.`
    );
    res.status(403).json({ error: 'Forbidden: you are not authorized to view this profile.' });
    return;
  }

  res.json({ user: targetUser });
});

app.patch('/api/users/me/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.authUser!.id;
  const body = req.body ?? {};
  const validation = validateProfileUpdateInput({
    fullName: String(body.fullName ?? ''),
    username: String(body.username ?? ''),
    email: String(body.email ?? ''),
    country: String(body.country ?? ''),
    city: String(body.city ?? ''),
  });

  if (!validation.valid) {
    res.status(400).json({ error: 'Validation failed.', fieldErrors: validation.errors });
    return;
  }

  const username = String(body.username).trim();
  const email = String(body.email).trim().toLowerCase();

  const conflict = db
    .prepare(`SELECT id, username, email FROM users WHERE (username = ? OR email = ?) AND id != ?`)
    .get(username, email, userId) as { id: string; username: string; email: string } | undefined;

  if (conflict) {
    const fieldErrors: Record<string, string> = {};
    if (conflict.username.toLowerCase() === username.toLowerCase()) {
      fieldErrors.username = 'Username is already in use.';
    }
    if (conflict.email.toLowerCase() === email.toLowerCase()) {
      fieldErrors.email = 'Email address is already in use.';
    }
    res.status(409).json({ error: 'Duplicate username or email.', fieldErrors });
    return;
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare(`UPDATE users SET username = ?, email = ? WHERE id = ?`).run(username, email, userId);
    db.prepare(
      `UPDATE user_profiles SET full_name = ?, country = ?, city = ?, updated_at = ? WHERE user_id = ?`
    ).run(
      String(body.fullName).trim(),
      String(body.country).trim(),
      String(body.city).trim(),
      now,
      userId
    );
  })();

  logAudit(userId, username, 'PROFILE_UPDATED', 'user_profile', userId, 'Updated personal profile fields.');
  res.json({ user: getUserAccountById(userId) });
});

app.patch('/api/users/me/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.authUser!.id;
  const current = getUserAccountById(userId);
  if (!current) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const body = req.body ?? {};
  const validLangs = ['en', 'es', 'qu', 'pt', 'fr', 'de', 'ja', 'zh'];
  const preferredLanguage = validLangs.includes(body.preferredLanguage)
    ? body.preferredLanguage
    : current.preferredLanguage;

  const notifications = {
    biometricAlerts:
      typeof body.notifications?.biometricAlerts === 'boolean'
        ? body.notifications.biometricAlerts
        : current.notifications.biometricAlerts,
    medicalReports:
      typeof body.notifications?.medicalReports === 'boolean'
        ? body.notifications.medicalReports
        : current.notifications.medicalReports,
    systemSecurity:
      typeof body.notifications?.systemSecurity === 'boolean'
        ? body.notifications.systemSecurity
        : current.notifications.systemSecurity,
    researchDigests:
      typeof body.notifications?.researchDigests === 'boolean'
        ? body.notifications.researchDigests
        : current.notifications.researchDigests,
  };

  const emailVisibility =
    body.emailVisibility === 'team' || body.emailVisibility === 'private'
      ? body.emailVisibility
      : current.emailVisibility;
  const telemetrySharing =
    typeof body.telemetrySharing === 'boolean' ? body.telemetrySharing : current.telemetrySharing;

  db.prepare(
    `UPDATE user_preferences
     SET preferred_language = ?,
         notify_biometric_alerts = ?,
         notify_medical_reports = ?,
         notify_system_security = ?,
         notify_research_digests = ?,
         email_visibility = ?,
         telemetry_sharing = ?
     WHERE user_id = ?`
  ).run(
    preferredLanguage,
    notifications.biometricAlerts ? 1 : 0,
    notifications.medicalReports ? 1 : 0,
    notifications.systemSecurity ? 1 : 0,
    notifications.researchDigests ? 1 : 0,
    emailVisibility,
    telemetrySharing ? 1 : 0,
    userId
  );

  logAudit(
    userId,
    current.username,
    'PREFERENCES_UPDATED',
    'user_preferences',
    userId,
    `Updated preferences (lang=${preferredLanguage}, telemetrySharing=${telemetrySharing}).`
  );

  res.json({ user: getUserAccountById(userId) });
});

app.post('/api/users/me/password', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.authUser!.id;
  const body = req.body ?? {};
  const check = validatePasswordChange({
    currentPassword: String(body.currentPassword ?? ''),
    newPassword: String(body.newPassword ?? ''),
    confirmNewPassword: String(body.confirmNewPassword ?? ''),
  });

  if (!check.valid) {
    res.status(400).json({ error: check.error });
    return;
  }

  const row = db
    .prepare(`SELECT username, password_hash FROM users WHERE id = ?`)
    .get(userId) as { username: string; password_hash: string } | undefined;

  if (!row || !verifyPassword(String(body.currentPassword), row.password_hash)) {
    res.status(403).json({ error: 'Current password is incorrect.' });
    return;
  }

  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(
    hashPassword(String(body.newPassword)),
    userId
  );

  logAudit(userId, row.username, 'PASSWORD_CHANGED', 'user', userId, 'User rotated account password.');
  res.json({ ok: true, message: 'Password updated securely.' });
});

app.post('/api/users/me/avatar', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.authUser!.id;
  const user = getUserAccountById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const dataUrl = String(req.body?.dataUrl ?? '');
  const mimeType = String(req.body?.mimeType ?? '');
  if (!dataUrl) {
    res.status(400).json({ error: 'Image payload is required.' });
    return;
  }

  const saved = saveUploadedImageToDisk({
    targetDir: AVATARS_DIR,
    publicPrefix: '/uploads/avatars',
    fileBaseName: `${userId}-${Date.now()}`,
    dataUrlOrBase64: dataUrl,
    mimeType,
    allowSvg: false,
  });

  if (!saved.ok) {
    res.status(400).json({ error: saved.error });
    return;
  }

  if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/') && !user.avatarUrl.includes('seed-')) {
    const oldFile = path.join(AVATARS_DIR, path.basename(user.avatarUrl));
    if (fs.existsSync(oldFile)) {
      fs.unlinkSync(oldFile);
    }
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO user_avatars (user_id, storage_path, mime_type, file_size_bytes, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       storage_path = excluded.storage_path,
       mime_type = excluded.mime_type,
       file_size_bytes = excluded.file_size_bytes,
       updated_at = excluded.updated_at`
  ).run(userId, saved.publicPath, saved.mimeType, saved.bytes, now);

  logAudit(userId, user.username, 'AVATAR_UPDATED', 'user_avatar', userId, `Saved avatar ${saved.publicPath}.`);
  res.json({ user: getUserAccountById(userId) });
});

app.delete('/api/users/me/avatar', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.authUser!.id;
  const user = getUserAccountById(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/') && !user.avatarUrl.includes('seed-')) {
    const oldFile = path.join(AVATARS_DIR, path.basename(user.avatarUrl));
    if (fs.existsSync(oldFile)) {
      fs.unlinkSync(oldFile);
    }
  }

  db.prepare(
    `UPDATE user_avatars SET storage_path = NULL, mime_type = NULL, file_size_bytes = 0, updated_at = ? WHERE user_id = ?`
  ).run(new Date().toISOString(), userId);

  logAudit(userId, user.username, 'AVATAR_REMOVED', 'user_avatar', userId, 'Reverted to default avatar.');
  res.json({ user: getUserAccountById(userId) });
});

app.get('/api/users/me/audit-logs', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT id, actor_user_id, actor_username, action, resource_type, resource_id, details, created_at
       FROM audit_logs WHERE actor_user_id = ? ORDER BY id DESC LIMIT 30`
    )
    .all(req.authUser!.id) as Array<Record<string, unknown>>;
  res.json({
    logs: rows.map((r) => ({
      id: Number(r.id),
      actorUserId: r.actor_user_id ? String(r.actor_user_id) : null,
      actorUsername: String(r.actor_username),
      action: String(r.action),
      resourceType: String(r.resource_type),
      resourceId: String(r.resource_id),
      details: String(r.details),
      createdAt: String(r.created_at),
    })),
  });
});

app.get('/api/users/me/export', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = getUserAccountById(req.authUser!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  const measurements = user.role === 'astronaut' ? getMeasurementsForUser(user.id) : [];
  logAudit(user.id, user.username, 'PERSONAL_DATA_EXPORTED', 'user', user.id, 'Exported personal JSON record archive.');
  res.json({ exportedAt: new Date().toISOString(), user, measurements });
});

// Dynamic Application Logo & Branding Management (Admin Only)
app.get('/api/branding/history', requireAuth, requirePermission('manage_application_branding'), (_req, res) => {
  res.json({ history: getBrandingHistory() });
});

app.post('/api/branding/logo', requireAuth, requirePermission('manage_application_branding'), (req: AuthenticatedRequest, res) => {
  const admin = getUserAccountById(req.authUser!.id);
  if (!admin) {
    res.status(401).json({ error: 'Invalid admin session.' });
    return;
  }

  const body = req.body ?? {};
  const dataUrl = String(body.dataUrl ?? '');
  const mimeType = String(body.mimeType ?? '');
  if (!dataUrl) {
    res.status(400).json({ error: 'Logo file payload is required.' });
    return;
  }

  const current = getActiveBranding();
  const nextVersion = current.logoVersion + 1;
  const saved = saveUploadedImageToDisk({
    targetDir: BRANDING_DIR,
    publicPrefix: '/uploads/branding',
    fileBaseName: `logo-v${nextVersion}-${Date.now()}`,
    dataUrlOrBase64: dataUrl,
    mimeType,
    allowSvg: true,
  });

  if (!saved.ok) {
    res.status(400).json({ error: saved.error });
    return;
  }

  const logoFit = body.logoFit === 'cover' ? 'cover' : 'contain';
  const validAspects = ['original', '1:1', '16:9', '4:3'];
  const logoAspectRatio = validAspects.includes(body.logoAspectRatio) ? body.logoAspectRatio : 'original';
  const logoDisplayHeight = Math.min(64, Math.max(24, Number(body.logoDisplayHeight) || 36));
  const syncFavicon = body.syncFavicon !== false;
  const syncReportLogo = body.syncReportLogo !== false;

  const nextFavicon = syncFavicon ? saved.publicPath : current.faviconStoragePath;
  const nextReportLogo = syncReportLogo ? saved.publicPath : current.reportLogoStoragePath;
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(
      `UPDATE app_branding
       SET logo_storage_path = ?, favicon_storage_path = ?, report_logo_storage_path = ?,
           logo_fit = ?, logo_aspect_ratio = ?, logo_display_height = ?, logo_version = ?,
           updated_by = ?, updated_at = ?
       WHERE id = 1`
    ).run(saved.publicPath, nextFavicon, nextReportLogo, logoFit, logoAspectRatio, logoDisplayHeight, nextVersion, admin.id, now);

    db.prepare(
      `INSERT INTO branding_history (logo_version, logo_storage_path, favicon_storage_path, action, updated_by, updated_by_name, updated_at)
       VALUES (?, ?, ?, 'updated', ?, ?, ?)`
    ).run(nextVersion, saved.publicPath, nextFavicon, admin.id, admin.fullName, now);
  })();

  logAudit(admin.id, admin.username, 'BRANDING_LOGO_UPDATED', 'app_branding', '1', `Updated official KAWSAY NOVA logo to v${nextVersion}.`);
  res.json({ branding: getActiveBranding(), history: getBrandingHistory() });
});

app.post('/api/branding/favicon', requireAuth, requirePermission('manage_application_branding'), (req: AuthenticatedRequest, res) => {
  const admin = getUserAccountById(req.authUser!.id)!;
  const saved = saveUploadedImageToDisk({
    targetDir: BRANDING_DIR,
    publicPrefix: '/uploads/branding',
    fileBaseName: `favicon-${Date.now()}`,
    dataUrlOrBase64: String(req.body?.dataUrl ?? ''),
    mimeType: String(req.body?.mimeType ?? ''),
    allowSvg: true,
  });
  if (!saved.ok) {
    res.status(400).json({ error: saved.error });
    return;
  }
  const now = new Date().toISOString();
  db.prepare(`UPDATE app_branding SET favicon_storage_path = ?, updated_by = ?, updated_at = ? WHERE id = 1`).run(
    saved.publicPath,
    admin.id,
    now
  );
  logAudit(admin.id, admin.username, 'BRANDING_FAVICON_UPDATED', 'app_branding', '1', `Updated favicon to ${saved.publicPath}.`);
  res.json({ branding: getActiveBranding() });
});

app.post('/api/branding/report-logo', requireAuth, requirePermission('manage_application_branding'), (req: AuthenticatedRequest, res) => {
  const admin = getUserAccountById(req.authUser!.id)!;
  const saved = saveUploadedImageToDisk({
    targetDir: BRANDING_DIR,
    publicPrefix: '/uploads/branding',
    fileBaseName: `report-logo-${Date.now()}`,
    dataUrlOrBase64: String(req.body?.dataUrl ?? ''),
    mimeType: String(req.body?.mimeType ?? ''),
    allowSvg: true,
  });
  if (!saved.ok) {
    res.status(400).json({ error: saved.error });
    return;
  }
  const now = new Date().toISOString();
  db.prepare(`UPDATE app_branding SET report_logo_storage_path = ?, updated_by = ?, updated_at = ? WHERE id = 1`).run(
    saved.publicPath,
    admin.id,
    now
  );
  logAudit(admin.id, admin.username, 'BRANDING_REPORT_LOGO_UPDATED', 'app_branding', '1', `Updated report logo to ${saved.publicPath}.`);
  res.json({ branding: getActiveBranding() });
});

app.patch('/api/branding/metadata', requireAuth, requirePermission('manage_application_branding'), (req: AuthenticatedRequest, res) => {
  const admin = getUserAccountById(req.authUser!.id)!;
  const current = getActiveBranding();
  const body = req.body ?? {};
  const now = new Date().toISOString();

  const applicationSubtitle = String(body.applicationSubtitle ?? current.applicationSubtitle).trim() || current.applicationSubtitle;
  const organizationName = String(body.organizationName ?? current.organizationName).trim() || current.organizationName;
  const institutionalFooter = String(body.institutionalFooter ?? current.institutionalFooter).trim() || current.institutionalFooter;
  const contactEmail = String(body.contactEmail ?? current.contactEmail).trim() || current.contactEmail;
  const contactPhone = String(body.contactPhone ?? current.contactPhone).trim() || current.contactPhone;
  const logoFit = body.logoFit === 'cover' ? 'cover' : body.logoFit === 'contain' ? 'contain' : current.logoFit;
  const validAspects = ['original', '1:1', '16:9', '4:3'];
  const logoAspectRatio = validAspects.includes(body.logoAspectRatio) ? body.logoAspectRatio : current.logoAspectRatio;
  const logoDisplayHeight = body.logoDisplayHeight
    ? Math.min(64, Math.max(24, Number(body.logoDisplayHeight)))
    : current.logoDisplayHeight;

  db.prepare(
    `UPDATE app_branding
     SET application_name = 'KAWSAY NOVA',
         application_subtitle = ?, organization_name = ?, institutional_footer = ?,
         contact_email = ?, contact_phone = ?, logo_fit = ?, logo_aspect_ratio = ?,
         logo_display_height = ?, updated_by = ?, updated_at = ?
     WHERE id = 1`
  ).run(applicationSubtitle, organizationName, institutionalFooter, contactEmail, contactPhone, logoFit, logoAspectRatio, logoDisplayHeight, admin.id, now);

  logAudit(admin.id, admin.username, 'BRANDING_METADATA_UPDATED', 'app_branding', '1', 'Updated institutional branding configuration.');
  res.json({ branding: getActiveBranding() });
});

app.post('/api/branding/restore', requireAuth, requirePermission('manage_application_branding'), (req: AuthenticatedRequest, res) => {
  const admin = getUserAccountById(req.authUser!.id)!;
  const current = getActiveBranding();
  const nextVersion = current.logoVersion + 1;
  const now = new Date().toISOString();

  db.transaction(() => {
    db.prepare(
      `UPDATE app_branding
       SET logo_storage_path = '/default-logo.svg',
           favicon_storage_path = '/default-logo.svg',
           report_logo_storage_path = '/default-logo.svg',
           logo_fit = 'contain', logo_aspect_ratio = 'original', logo_display_height = 36,
           logo_version = ?, updated_by = ?, updated_at = ?
       WHERE id = 1`
    ).run(nextVersion, admin.id, now);

    db.prepare(
      `INSERT INTO branding_history (logo_version, logo_storage_path, favicon_storage_path, action, updated_by, updated_by_name, updated_at)
       VALUES (?, '/default-logo.svg', '/default-logo.svg', 'restored_default', ?, ?, ?)`
    ).run(nextVersion, admin.id, admin.fullName, now);
  })();

  logAudit(admin.id, admin.username, 'BRANDING_LOGO_RESTORED', 'app_branding', '1', `Restored original KAWSAY NOVA official default logo (v${nextVersion}).`);
  res.json({ branding: getActiveBranding(), history: getBrandingHistory() });
});

// Role-separated Biomedical, Mission Profile & Calendar endpoints
app.get('/api/biomedical/overview', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = getUserAccountById(req.authUser!.id);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  if (user.role === 'astronaut') {
    res.json({
      role: user.role,
      missionProfiles: getMissionProfiles(user.id),
      measurements: getMeasurementsForUser(user.id),
      observations: getObservations(user.id),
      alerts: getMedicalAlerts(user.id),
      tasks: getMissionTasks(user.id),
      wellnessResources: WELLNESS_RESOURCES,
    });
    return;
  }

  if (user.role === 'medical_specialist') {
    const astronauts = db
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
         WHERE u.role_key = 'astronaut'`
      )
      .all() as Array<Record<string, unknown>>;

    res.json({
      role: user.role,
      astronauts: astronauts.map(mapRowToUserAccount),
      missionProfiles: getMissionProfiles(),
      measurements: getAllAstronautMeasurements(),
      observations: getObservations(),
      alerts: getMedicalAlerts(),
      tasks: getMissionTasks(user.id),
    });
    return;
  }

  if (user.role === 'scientific_researcher') {
    res.json({
      role: user.role,
      cohorts: getAggregatedResearchCohorts(),
      tasks: getMissionTasks(user.id),
    });
    return;
  }

  if (user.role === 'general_user') {
    res.json({
      role: user.role,
      wellnessResources: WELLNESS_RESOURCES,
      tasks: getMissionTasks(user.id),
    });
    return;
  }

  const totalUsers = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
  const totalMeasurements = (db.prepare(`SELECT COUNT(*) as c FROM biomedical_measurements`).get() as { c: number }).c;
  const astronauts = db
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
       WHERE u.role_key = 'astronaut'`
    )
    .all() as Array<Record<string, unknown>>;

  res.json({
    role: user.role,
    systemStats: { totalUsers, totalMeasurements },
    astronauts: astronauts.map(mapRowToUserAccount),
    missionProfiles: getMissionProfiles(),
    measurements: getAllAstronautMeasurements(),
    observations: getObservations(),
    alerts: getMedicalAlerts(),
    cohorts: getAggregatedResearchCohorts(),
    tasks: getMissionTasks(user.id),
  });
});

app.post('/api/biomedical/measurements', requireAuth, requirePermission('log_biomedical_measurements'), (req: AuthenticatedRequest, res) => {
  const user = getUserAccountById(req.authUser!.id)!;
  const b = req.body ?? {};

  let targetUserId = user.id;
  if (user.role === 'medical_specialist' || user.role === 'administrator') {
    const requestedTarget = typeof b.targetUserId === 'string' ? b.targetUserId.trim() : '';
    if (requestedTarget) {
      const targetUser = getUserAccountById(requestedTarget);
      if (!targetUser || targetUser.role !== 'astronaut') {
        res.status(400).json({ error: 'Selected target astronaut account was not found.' });
        return;
      }
      targetUserId = targetUser.id;
    } else {
      const firstAstro = db
        .prepare(`SELECT id FROM users WHERE role_key = 'astronaut' AND status = 'active' ORDER BY created_at ASC LIMIT 1`)
        .get() as { id: string } | undefined;
      if (firstAstro) {
        targetUserId = firstAstro.id;
      }
    }
  }
  const hr = Number(b.heartRateBpm);
  const hrv = Number(b.hrvRmssdMs ?? 42);
  const sys = Number(b.systolicMmHg);
  const dia = Number(b.diastolicMmHg);
  const mapVal = Number((dia + (sys - dia) / 3).toFixed(1));
  const spo2 = Number(b.spo2Percent);
  const resp = Number(b.respiratoryRateRpm ?? 15);
  const temp = Number(b.coreTempC);
  const glucose = Number(b.bloodGlucoseMgDl ?? 94);
  const hydration = Number(b.hydrationLiters ?? 2.4);
  const sleep = Number(b.sleepHours ?? 7.2);
  const activity = Number(b.activityMinutes ?? 45);
  const steps = Number(b.stepsCount ?? 6000);
  const cortisol = Number(b.cortisolUgDl ?? 12.5);
  const bone = Number(b.boneDensityIndex ?? 1.03);
  const muscle = Number(b.muscleStrengthScore ?? 88);
  const rad = Number(b.radiationDoseMsv ?? 0.45);
  const mood = Math.min(10, Math.max(1, Number(b.moodScore ?? 8)));
  const stress = Math.min(10, Math.max(1, Number(b.stressScore ?? 4)));
  const fatigue = Math.min(10, Math.max(1, Number(b.fatigueScore ?? 3)));
  const isolation = Math.min(10, Math.max(1, Number(b.isolationScore ?? 3)));
  const social = Math.min(10, Math.max(1, Number(b.socialConnectionScore ?? 8)));

  const dataOrigin = ['real_sensor', 'manual_entry', 'calculated', 'simulated_demo'].includes(b.dataOrigin)
    ? b.dataOrigin
    : 'manual_entry';
  const measurementMethod = String(b.measurementMethod || 'Manual calibrated check').trim();
  const sensorSource = String(b.sensorSource || 'Manual Input Kit').trim();

  const validation = validateMeasurementInput({
    recordedDate: typeof b.recordedDate === 'string' ? b.recordedDate : undefined,
    recordedTime: typeof b.recordedTime === 'string' ? b.recordedTime : undefined,
    heartRateBpm: hr,
    hrvRmssdMs: hrv,
    systolicMmHg: sys,
    diastolicMmHg: dia,
    spo2Percent: spo2,
    respiratoryRateRpm: resp,
    coreTempC: temp,
    bloodGlucoseMgDl: glucose,
    hydrationLiters: hydration,
    sleepHours: sleep,
    activityMinutes: activity,
    stepsCount: steps,
    cortisolUgDl: cortisol,
    boneDensityIndex: bone,
    radiationDoseMsv: rad,
    sensorSource,
    measurementMethod,
    dataOrigin,
  });

  if (!validation.valid) {
    res.status(400).json({
      error: Object.values(validation.errors)[0] || 'Invalid biomedical measurement inputs.',
      fieldErrors: validation.errors,
    });
    return;
  }

  let recordedAt = new Date().toISOString();
  if (validation.recordedAtIso) {
    recordedAt = validation.recordedAtIso;
  } else if (typeof b.recordedAt === 'string' && !Number.isNaN(new Date(b.recordedAt).getTime())) {
    recordedAt = new Date(b.recordedAt).toISOString();
  }

  const qualityEval = evaluateDataQuality({
    calibrated: b.calibrated !== false,
    deviceId: sensorSource,
    signalQualityPct: Number(b.signalQualityPct ?? 92),
    missingFieldsCount: 0,
    motionArtifactDetected: Boolean(b.motionArtifactDetected),
    timestampConsistent: true,
    valuePlausible: hr >= 35 && hr <= 210 && spo2 >= 70 && spo2 <= 100 && temp >= 34 && temp <= 42,
    repeatedConsistent: !Boolean(b.motionArtifactDetected),
  });

  let status: 'nominal' | 'elevated' | 'critical' = 'nominal';
  if (spo2 < 92 || hr > 130 || hr < 42 || temp > 38.2 || sys >= 160) {
    status = 'critical';
  } else if (spo2 < 95 || hr > 105 || temp > 37.6 || cortisol > 18 || sys >= 140) {
    status = 'elevated';
  }

  const now = new Date().toISOString();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO biomedical_measurements (
        user_id, recorded_at, heart_rate_bpm, hrv_rmssd_ms, systolic_mmhg, diastolic_mmhg, map_mmhg,
        spo2_percent, respiratory_rate_rpm, core_temp_c, blood_glucose_mg_dl, hydration_liters,
        sleep_hours, activity_minutes, steps_count, cortisol_ug_dl, bone_density_index,
        muscle_strength_score, radiation_dose_msv, mood_score, stress_score, fatigue_score,
        isolation_score, social_connection_score, measurement_method, sensor_source,
        data_origin, data_quality, quality_reason, assessment_status, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      targetUserId, recordedAt, hr, hrv, sys, dia, mapVal, spo2, resp, temp, glucose, hydration,
      sleep, activity, steps, cortisol, bone, muscle, rad, mood, stress, fatigue,
      isolation, social, measurementMethod, sensorSource, dataOrigin,
      qualityEval.label, qualityEval.reasons.join(' '), status, String(b.notes || '').trim(), now
    );

    if (status !== 'nominal') {
      const alertMetric =
        spo2 < 95
          ? 'SpO2 Saturation'
          : temp > 37.6
            ? 'Core Body Temperature'
            : sys >= 140
              ? 'Arterial Blood Pressure'
              : cortisol > 18
                ? 'Cortisol (Salivary)'
                : 'Resting Heart Rate';
      const alertObserved =
        spo2 < 95
          ? `${spo2}%`
          : temp > 37.6
            ? `${temp}°C`
            : sys >= 140
              ? `${sys}/${dia} mmHg`
              : cortisol > 18
                ? `${cortisol} ug/dL`
                : `${hr} bpm`;
      const alertThreshold =
        spo2 < 95
          ? 'Sea-level ref >= 95% (note altitude/cabin pO2)'
          : temp > 37.6
            ? '<= 37.6 °C'
            : sys >= 140
              ? '< 140/90 mmHg'
              : cortisol > 18
                ? '< 18.0 ug/dL'
                : '45–105 bpm';

      db.prepare(
        `INSERT INTO medical_alerts (
          astronaut_user_id, metric, observed_value, threshold, severity, status, explanation, data_source, data_quality, suggested_next_step, acknowledged, created_at
        ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, 0, ?)`
      ).run(
        targetUserId,
        alertMetric,
        alertObserved,
        alertThreshold,
        status === 'critical' ? 'critical' : 'warning',
        `Captured via ${measurementMethod} (${dataOrigin}). ${qualityEval.guidance}`,
        sensorSource,
        qualityEval.label,
        'Repeat resting measurement and consult flight surgeon if persistent.',
        now
      );
    }
  })();

  logAudit(user.id, user.username, 'BIOMEDICAL_MEASUREMENT_LOGGED', 'measurement', targetUserId, `Recorded ${status} (${dataOrigin}) sample for ${targetUserId} at ${recordedAt}.`);
  const isPrivileged = user.role === 'medical_specialist' || user.role === 'administrator';
  res.status(201).json({
    measurements: isPrivileged ? getAllAstronautMeasurements() : getMeasurementsForUser(user.id),
    alerts: isPrivileged ? getMedicalAlerts() : getMedicalAlerts(user.id),
  });
});

app.patch('/api/biomedical/measurements/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM biomedical_measurements WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Measurement record not found.' });
    return;
  }
  const ownerId = String(existing.user_id);
  if (ownerId !== req.authUser!.id && req.authUser!.role !== 'administrator') {
    res.status(403).json({ error: 'Forbidden: you cannot modify another user’s biomedical record.' });
    return;
  }

  const b = req.body ?? {};
  const hr = Number(b.heartRateBpm ?? existing.heart_rate_bpm);
  const hrv = Number(b.hrvRmssdMs ?? existing.hrv_rmssd_ms);
  const sys = Number(b.systolicMmHg ?? existing.systolic_mmhg);
  const dia = Number(b.diastolicMmHg ?? existing.diastolic_mmhg);
  const mapVal = Number((dia + (sys - dia) / 3).toFixed(1));
  const spo2 = Number(b.spo2Percent ?? existing.spo2_percent);
  const resp = Number(b.respiratoryRateRpm ?? existing.respiratory_rate_rpm);
  const temp = Number(b.coreTempC ?? existing.core_temp_c);
  const glucose = Number(b.bloodGlucoseMgDl ?? existing.blood_glucose_mg_dl);
  const hydration = Number(b.hydrationLiters ?? existing.hydration_liters);
  const sleep = Number(b.sleepHours ?? existing.sleep_hours);
  const activity = Number(b.activityMinutes ?? existing.activity_minutes);
  const steps = Number(b.stepsCount ?? existing.steps_count);
  const cortisol = Number(b.cortisolUgDl ?? existing.cortisol_ug_dl);
  const bone = Number(b.boneDensityIndex ?? existing.bone_density_index);
  const rad = Number(b.radiationDoseMsv ?? existing.radiation_dose_msv);
  const mood = Math.min(10, Math.max(1, Number(b.moodScore ?? existing.mood_score)));
  const stress = Math.min(10, Math.max(1, Number(b.stressScore ?? existing.stress_score)));
  const fatigue = Math.min(10, Math.max(1, Number(b.fatigueScore ?? existing.fatigue_score)));
  const dataOrigin = ['real_sensor', 'manual_entry', 'calculated', 'simulated_demo'].includes(b.dataOrigin)
    ? b.dataOrigin
    : String(existing.data_origin || 'manual_entry');
  const measurementMethod = String(b.measurementMethod ?? existing.measurement_method).trim();
  const sensorSource = String(b.sensorSource ?? existing.sensor_source).trim();
  const notes = String(b.notes ?? existing.notes ?? '').trim();

  const validation = validateMeasurementInput({
    recordedDate: typeof b.recordedDate === 'string' ? b.recordedDate : undefined,
    recordedTime: typeof b.recordedTime === 'string' ? b.recordedTime : undefined,
    heartRateBpm: hr,
    hrvRmssdMs: hrv,
    systolicMmHg: sys,
    diastolicMmHg: dia,
    spo2Percent: spo2,
    respiratoryRateRpm: resp,
    coreTempC: temp,
    bloodGlucoseMgDl: glucose,
    hydrationLiters: hydration,
    sleepHours: sleep,
    activityMinutes: activity,
    stepsCount: steps,
    cortisolUgDl: cortisol,
    boneDensityIndex: bone,
    radiationDoseMsv: rad,
    sensorSource,
    measurementMethod,
    dataOrigin,
  });

  if (!validation.valid) {
    res.status(400).json({
      error: Object.values(validation.errors)[0] || 'Validation failed.',
      fieldErrors: validation.errors,
    });
    return;
  }

  let recordedAt = String(existing.recorded_at);
  if (validation.recordedAtIso) {
    recordedAt = validation.recordedAtIso;
  } else if (typeof b.recordedAt === 'string' && !Number.isNaN(new Date(b.recordedAt).getTime())) {
    recordedAt = new Date(b.recordedAt).toISOString();
  }

  let status: 'nominal' | 'elevated' | 'critical' = 'nominal';
  if (spo2 < 92 || hr > 130 || hr < 42 || temp > 38.2 || sys >= 160) {
    status = 'critical';
  } else if (spo2 < 95 || hr > 105 || temp > 37.6 || cortisol > 18 || sys >= 140) {
    status = 'elevated';
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE biomedical_measurements
     SET recorded_at = ?, heart_rate_bpm = ?, hrv_rmssd_ms = ?, systolic_mmhg = ?, diastolic_mmhg = ?, map_mmhg = ?,
         spo2_percent = ?, respiratory_rate_rpm = ?, core_temp_c = ?, blood_glucose_mg_dl = ?, hydration_liters = ?,
         sleep_hours = ?, activity_minutes = ?, steps_count = ?, cortisol_ug_dl = ?, bone_density_index = ?,
         radiation_dose_msv = ?, mood_score = ?, stress_score = ?, fatigue_score = ?,
         measurement_method = ?, sensor_source = ?, data_origin = ?, assessment_status = ?, notes = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    recordedAt, hr, hrv, sys, dia, mapVal, spo2, resp, temp, glucose, hydration,
    sleep, activity, steps, cortisol, bone, rad, mood, stress, fatigue,
    measurementMethod, sensorSource, dataOrigin, status, notes, now, id
  );

  logAudit(req.authUser!.id, req.authUser!.id, 'BIOMEDICAL_MEASUREMENT_UPDATED', 'measurement', String(id), `Edited biomedical record #${id}.`);
  res.json({
    measurements: getMeasurementsForUser(ownerId),
    alerts: getMedicalAlerts(ownerId),
  });
});

app.delete('/api/biomedical/measurements/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT id, user_id FROM biomedical_measurements WHERE id = ?`).get(id) as
    | { id: number; user_id: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Measurement record not found.' });
    return;
  }
  if (existing.user_id !== req.authUser!.id && req.authUser!.role !== 'administrator') {
    res.status(403).json({ error: 'Forbidden: you cannot delete another user’s biomedical record.' });
    return;
  }
  db.prepare(`DELETE FROM biomedical_measurements WHERE id = ?`).run(id);
  logAudit(req.authUser!.id, req.authUser!.id, 'BIOMEDICAL_MEASUREMENT_DELETED', 'measurement', String(id), 'Deleted biomedical record.');
  res.json({
    measurements: getMeasurementsForUser(existing.user_id),
    alerts: getMedicalAlerts(existing.user_id),
  });
});

// Astronaut Mission Profiles (Authorized management)
app.post('/api/mission-profiles', requireAuth, (req: AuthenticatedRequest, res) => {
  const role = req.authUser!.role;
  if (!['astronaut', 'medical_specialist', 'administrator'].includes(role)) {
    res.status(403).json({ error: 'Forbidden: insufficient role permissions for mission profile creation.' });
    return;
  }
  const b = req.body ?? {};
  const fullName = String(b.fullName || '').trim();
  const missionId = String(b.missionId || '').trim();
  const missionName = String(b.missionName || '').trim();
  const missionDestination = String(b.missionDestination || '').trim();
  if (!fullName || !missionId || !missionName || !missionDestination) {
    res.status(400).json({ error: 'Full name, Mission ID, Mission Name, and Destination are required.' });
    return;
  }
  const id = `mp-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO astronaut_mission_profiles (
      id, user_id, callsign, full_name, age, mission_id, mission_name, mission_phase,
      mission_duration_days, mission_start_date, mission_destination, medical_background,
      baseline_hr_bpm, baseline_hrv_ms, baseline_sbp_mmhg, baseline_dbp_mmhg,
      baseline_spo2_pct, baseline_temp_c, health_history, sensors_list, is_demo_data, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(
    id,
    role === 'astronaut' ? req.authUser!.id : String(b.userId || req.authUser!.id),
    String(b.callsign || 'KN-CREW').trim(),
    fullName,
    Number(b.age || 34),
    missionId,
    missionName,
    String(b.missionPhase || 'Orbital Operations').trim(),
    Number(b.missionDurationDays || 180),
    String(b.missionStartDate || now.slice(0, 10)),
    missionDestination,
    String(b.medicalBackground || 'Cleared analog flight crew baseline.').trim(),
    Number(b.baselineHrBpm || 66),
    Number(b.baselineHrvMs || 45),
    Number(b.baselineSbpMmHg || 118),
    Number(b.baselineDbpMmHg || 76),
    Number(b.baselineSpo2Pct || 98.2),
    Number(b.baselineTempC || 36.7),
    String(b.healthHistory || 'Routine periodic flight physicals nominal.').trim(),
    String(b.sensorsList || 'Simulated Demo Sensor Pack').trim(),
    now
  );
  res.status(201).json({
    createdProfileId: id,
    missionProfiles: getMissionProfiles(role === 'astronaut' ? req.authUser!.id : undefined),
  });
});

app.patch('/api/mission-profiles/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = req.params.id;
  const existing = db.prepare(`SELECT * FROM astronaut_mission_profiles WHERE id = ?`).get(id) as
    | { id: string; user_id: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Astronaut mission profile not found.' });
    return;
  }
  if (
    existing.user_id !== req.authUser!.id &&
    !['medical_specialist', 'administrator'].includes(req.authUser!.role)
  ) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }
  const b = req.body ?? {};
  db.prepare(
    `UPDATE astronaut_mission_profiles
     SET full_name = ?, age = ?, mission_id = ?, mission_name = ?, mission_phase = ?,
         mission_duration_days = ?, mission_destination = ?, medical_background = ?,
         health_history = ?, sensors_list = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    String(b.fullName || ''),
    Number(b.age || 34),
    String(b.missionId || ''),
    String(b.missionName || ''),
    String(b.missionPhase || ''),
    Number(b.missionDurationDays || 180),
    String(b.missionDestination || ''),
    String(b.medicalBackground || ''),
    String(b.healthHistory || ''),
    String(b.sensorsList || ''),
    new Date().toISOString(),
    id
  );
  res.json({
    missionProfiles: getMissionProfiles(
      req.authUser!.role === 'astronaut' ? req.authUser!.id : undefined
    ),
  });
});

// Mission Calendar Task endpoints
app.get('/api/calendar/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ tasks: getMissionTasks(req.authUser!.id) });
});

app.post('/api/calendar/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
  const b = req.body ?? {};
  const title = String(b.title ?? '').trim();
  const now = new Date().toISOString();
  const category = String(b.category || 'health_assessment');
  const scheduledDate = String(b.scheduledDate || now.slice(0, 10)).trim();
  const scheduledTime = String(b.scheduledTime || '09:00').trim();

  const validation = validateMissionTaskInput({
    title,
    category,
    scheduledDate,
    scheduledTime,
  });
  if (!validation.valid) {
    res.status(400).json({
      error: Object.values(validation.errors)[0] || 'Invalid mission calendar task details.',
      fieldErrors: validation.errors,
    });
    return;
  }

  db.prepare(
    `INSERT INTO mission_tasks (user_id, title, category, scheduled_date, scheduled_time, completed, notes, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    req.authUser!.id,
    title,
    category,
    scheduledDate,
    scheduledTime,
    String(b.notes || '').trim(),
    now
  );
  res.status(201).json({ tasks: getMissionTasks(req.authUser!.id) });
});

app.patch('/api/calendar/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT user_id, completed, title, scheduled_date, scheduled_time, notes FROM mission_tasks WHERE id = ?`).get(id) as
    | { user_id: string; completed: number; title: string; scheduled_date: string; scheduled_time: string; notes: string }
    | undefined;
  if (!existing || existing.user_id !== req.authUser!.id) {
    res.status(403).json({ error: 'Forbidden or task not found.' });
    return;
  }
  const b = req.body ?? {};
  db.prepare(
    `UPDATE mission_tasks SET title = ?, scheduled_date = ?, scheduled_time = ?, completed = ?, notes = ? WHERE id = ?`
  ).run(
    b.title !== undefined ? String(b.title) : existing.title,
    b.scheduledDate !== undefined ? String(b.scheduledDate) : existing.scheduled_date,
    b.scheduledTime !== undefined ? String(b.scheduledTime) : existing.scheduled_time,
    typeof b.completed === 'boolean' ? (b.completed ? 1 : 0) : existing.completed,
    b.notes !== undefined ? String(b.notes) : existing.notes,
    id
  );
  res.json({ tasks: getMissionTasks(req.authUser!.id) });
});

app.delete('/api/calendar/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT user_id FROM mission_tasks WHERE id = ?`).get(id) as
    | { user_id: string }
    | undefined;
  if (!existing || existing.user_id !== req.authUser!.id) {
    res.status(403).json({ error: 'Forbidden or task not found.' });
    return;
  }
  db.prepare(`DELETE FROM mission_tasks WHERE id = ?`).run(id);
  res.json({ tasks: getMissionTasks(req.authUser!.id) });
});

// Clinical Observations & Alerts
app.post('/api/biomedical/observations', requireAuth, requirePermission('add_clinical_observations'), (req: AuthenticatedRequest, res) => {
  const specialist = getUserAccountById(req.authUser!.id)!;
  const b = req.body ?? {};
  const astronautUserId = String(b.astronautUserId ?? '');
  const summary = String(b.summary ?? '').trim();
  const recommendation = String(b.recommendation ?? '').trim();
  const severity = ['nominal', 'advisory', 'critical'].includes(b.severity) ? b.severity : 'nominal';

  if (!astronautUserId || !summary || !recommendation) {
    res.status(400).json({ error: 'Astronaut, summary, and recommendation are required.' });
    return;
  }

  const target = getUserAccountById(astronautUserId);
  if (!target || target.role !== 'astronaut') {
    res.status(404).json({ error: 'Authorized astronaut record not found.' });
    return;
  }

  db.prepare(
    `INSERT INTO clinical_observations (astronaut_user_id, specialist_user_id, severity, summary, recommendation, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(astronautUserId, specialist.id, severity, summary, recommendation, new Date().toISOString());

  logAudit(specialist.id, specialist.username, 'CLINICAL_OBSERVATION_ADDED', 'clinical_observation', astronautUserId, `Added ${severity} clinical observation.`);
  res.status(201).json({ observations: getObservations() });
});

app.post('/api/biomedical/alerts/:id/acknowledge', requireAuth, (req: AuthenticatedRequest, res) => {
  const alertId = Number(req.params.id);
  const alertRow = db.prepare(`SELECT astronaut_user_id FROM medical_alerts WHERE id = ?`).get(alertId) as
    | { astronaut_user_id: string }
    | undefined;
  if (!alertRow) {
    res.status(404).json({ error: 'Medical alert not found.' });
    return;
  }
  const actor = getUserAccountById(req.authUser!.id)!;
  const isPrivileged = actor.permissions.includes('review_alerts');
  if (!isPrivileged && alertRow.astronaut_user_id !== actor.id) {
    res.status(403).json({ error: 'Forbidden: cannot acknowledge another crew member alert.' });
    return;
  }
  db.prepare(
    `UPDATE medical_alerts SET acknowledged = 1, status = CASE WHEN status = 'open' THEN 'acknowledged' ELSE status END WHERE id = ?`
  ).run(alertId);
  logAudit(actor.id, actor.username, 'ALERT_ACKNOWLEDGED', 'medical_alert', String(alertId), 'Medical alert acknowledged.');
  res.json({ alerts: isPrivileged ? getMedicalAlerts() : getMedicalAlerts(actor.id) });
});

app.post('/api/biomedical/alerts/:id/resolve', requireAuth, (req: AuthenticatedRequest, res) => {
  const alertId = Number(req.params.id);
  const alertRow = db.prepare(`SELECT astronaut_user_id FROM medical_alerts WHERE id = ?`).get(alertId) as
    | { astronaut_user_id: string }
    | undefined;
  if (!alertRow) {
    res.status(404).json({ error: 'Medical alert not found.' });
    return;
  }
  const actor = getUserAccountById(req.authUser!.id)!;
  const isPrivileged = actor.permissions.includes('review_alerts');
  if (!isPrivileged && alertRow.astronaut_user_id !== actor.id) {
    res.status(403).json({ error: 'Forbidden: cannot resolve another crew member alert.' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE medical_alerts SET acknowledged = 1, status = 'resolved', resolved_by = ?, resolved_at = ? WHERE id = ?`
  ).run(actor.fullName, now, alertId);
  logAudit(actor.id, actor.username, 'ALERT_RESOLVED', 'medical_alert', String(alertId), `Medical alert marked resolved by ${actor.fullName}.`);
  res.json({ alerts: isPrivileged ? getMedicalAlerts() : getMedicalAlerts(actor.id) });
});

// Persistent Mental Well-being & Reflective Assessments
app.get('/api/assessments', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ assessments: getMentalAssessments(req.authUser!.id) });
});

app.post('/api/assessments', requireAuth, (req: AuthenticatedRequest, res) => {
  const b = req.body ?? {};
  const mood = Math.min(10, Math.max(1, Number(b.moodScore ?? 8)));
  const stress = Math.min(10, Math.max(1, Number(b.stressScore ?? 3)));
  const fatigue = Math.min(10, Math.max(1, Number(b.fatigueScore ?? 3)));
  const sleepQuality = Math.min(10, Math.max(1, Number(b.sleepQualityScore ?? 7)));
  const notes = String(b.notes ?? '').trim() || 'Routine self-reflection check-in.';
  const isPrivate = b.isPrivate !== false ? 1 : 0;
  const recordedAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO mental_assessments (user_id, mood_score, stress_score, fatigue_score, sleep_quality_score, notes, is_private, recorded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.authUser!.id, mood, stress, fatigue, sleepQuality, notes, isPrivate, recordedAt);

  res.status(201).json({ assessments: getMentalAssessments(req.authUser!.id) });
});

app.delete('/api/assessments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT user_id FROM mental_assessments WHERE id = ?`).get(id) as
    | { user_id: string }
    | undefined;
  if (!existing || existing.user_id !== req.authUser!.id) {
    res.status(403).json({ error: 'Assessment entry not found or unauthorized.' });
    return;
  }
  db.prepare(`DELETE FROM mental_assessments WHERE id = ?`).run(id);
  res.json({ assessments: getMentalAssessments(req.authUser!.id) });
});

// Persistent Wellness Protocol Completions
app.get('/api/wellness/completions', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ completions: getWellnessCompletions(req.authUser!.id) });
});

app.post('/api/wellness/completions', requireAuth, (req: AuthenticatedRequest, res) => {
  const resourceId = String(req.body?.resourceId ?? '').trim();
  if (!resourceId) {
    res.status(400).json({ error: 'Resource ID is required.' });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const existing = db
    .prepare(`SELECT id FROM wellness_completions WHERE user_id = ? AND resource_id = ? AND completed_date = ?`)
    .get(req.authUser!.id, resourceId, today) as { id: number } | undefined;
  if (existing) {
    db.prepare(`DELETE FROM wellness_completions WHERE id = ?`).run(existing.id);
  } else {
    db.prepare(
      `INSERT INTO wellness_completions (user_id, resource_id, completed_date, completed_at) VALUES (?, ?, ?, ?)`
    ).run(req.authUser!.id, resourceId, today, new Date().toISOString());
  }
  res.json({ completions: getWellnessCompletions(req.authUser!.id) });
});

// Saved Clinical Dossier Reports
app.get('/api/reports', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ reports: getSavedReports(req.authUser!.id, req.authUser!.role) });
});

app.post('/api/reports', requireAuth, (req: AuthenticatedRequest, res) => {
  const actor = getUserAccountById(req.authUser!.id)!;
  if (!['astronaut', 'medical_specialist', 'administrator'].includes(actor.role)) {
    res.status(403).json({ error: 'Forbidden: insufficient permissions to save clinical reports.' });
    return;
  }
  const b = req.body ?? {};
  const id = `rpt-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  const title = String(b.title ?? `KN-MED-${new Date().toISOString().slice(0, 10)}`).trim();
  const reportLang = String(b.reportLang ?? 'en');
  const viewMode = b.viewMode === 'cover' ? 'cover' : 'document';
  const measurementCount = Number(b.measurementCount ?? 0);
  const observationCount = Number(b.observationCount ?? 0);
  const summaryJson = typeof b.summaryJson === 'string' ? b.summaryJson : JSON.stringify(b.summary ?? {});
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO saved_reports (id, created_by_user_id, created_by_name, title, report_lang, view_mode, measurement_count, observation_count, summary_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, actor.id, actor.fullName, title, reportLang, viewMode, measurementCount, observationCount, summaryJson, now);

  logAudit(actor.id, actor.username, 'MEDICAL_REPORT_SAVED', 'report', id, `Saved medical report dossier (${title}).`);
  res.status(201).json({ reports: getSavedReports(actor.id, actor.role) });
});

app.delete('/api/reports/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const id = req.params.id;
  const existing = db.prepare(`SELECT created_by_user_id FROM saved_reports WHERE id = ?`).get(id) as
    | { created_by_user_id: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Saved report not found.' });
    return;
  }
  if (existing.created_by_user_id !== req.authUser!.id && req.authUser!.role !== 'administrator') {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }
  db.prepare(`DELETE FROM saved_reports WHERE id = ?`).run(id);
  res.json({ reports: getSavedReports(req.authUser!.id, req.authUser!.role) });
});

// NOVA AI Assistant (Server-side Gemini API when configured; honest unconfigured response otherwise)
app.post('/api/ai/assistant', requireAuth, async (req: AuthenticatedRequest, res) => {
  const question = String(req.body?.question ?? '').trim();
  const language = String(req.body?.language ?? 'en');
  const contextSummary = String(req.body?.contextSummary ?? '').trim();

  if (!question) {
    res.status(400).json({ error: 'Question cannot be empty.' });
    return;
  }

  const ai = getConfiguredGeminiClient();
  if (!ai) {
    res.status(503).json({
      configured: false,
      error:
        'NOVA AI live inference requires GEMINI_API_KEY configured on the server. No unconfigured AI service is simulated.',
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `User question (${language}): ${question}\n\nAuthorized context summary:\n${contextSummary || 'No active measurements provided.'}`,
      config: {
        systemInstruction:
          'You are NOVA AI Assistant inside KAWSAY NOVA, an educational aerospace biomedical monitoring platform. Follow strict scientific responsibility: (1) Explain biomedical concepts, equations, and data-quality limitations clearly. (2) Distinguish directly measured values, calculated values, and simulated demonstration data. (3) Never provide a medical diagnosis, prescription, or fabricated references/measurements. (4) Always recommend consulting qualified flight surgeons or medical professionals. Respond in the requested user language (for Ayacucho Quechua, mark uncertain technical terms with [Verify]).',
      },
    });
    res.json({ configured: true, answer: response.text || 'No response text returned.' });
  } catch (err) {
    res.status(502).json({
      configured: true,
      error: err instanceof Error ? err.message : 'Error calling Gemini server inference.',
    });
  }
});

// NOVA UNIVERSAL TRANSLATOR Dynamic Server Translation
app.post('/api/translate', async (req, res) => {
  const text = String(req.body?.text ?? '').trim();
  const sourceLang = String(req.body?.sourceLang ?? 'auto');
  const targetLang = String(req.body?.targetLang ?? 'es') as LanguageCode;

  if (!text) {
    res.status(400).json({ error: 'Text to translate is required.' });
    return;
  }

  const offlineMatch = translateOfflineText(text, targetLang);
  if (offlineMatch.usedGlossary) {
    res.json({
      source: 'offline_glossary',
      translatedText: offlineMatch.translated,
      note: offlineMatch.note,
    });
    return;
  }

  const ai = getConfiguredGeminiClient();
  if (!ai) {
    res.json({
      source: 'offline_fallback',
      configured: false,
      translatedText: offlineMatch.translated,
      note: offlineMatch.note,
    });
    return;
  }

  try {
    const langNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      qu: 'Ayacucho Quechua (Runasimi Ayakuchu)',
      pt: 'Portuguese',
      fr: 'French',
      de: 'German',
      ja: 'Japanese',
      zh: 'Chinese (Simplified)',
    };
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Translate from ${sourceLang} to ${langNames[targetLang] || targetLang}:\n\n${text}`,
      config: {
        systemInstruction:
          'You are NOVA UNIVERSAL TRANSLATOR for aerospace and biomedical texts. Preserve all mathematical formulas (e.g., HR = 60 / mean RR, RMSSD, MAP, MARD), numbers, measurement units (bpm, mmHg, %, °C, mg/dL, mSv, L, ms), and scientific symbols verbatim. If translating into Ayacucho Quechua and a specialized modern clinical term has no established equivalent, keep the international symbol or mark it with [Verify]. Return ONLY the translated text.',
      },
    });
    res.json({
      source: 'gemini_server',
      configured: true,
      translatedText: (response.text || text).trim(),
      note:
        targetLang === 'qu'
          ? 'Ayacucho Quechua dynamic translation completed; review [Verify] tags for clinical terminology.'
          : undefined,
    });
  } catch (err) {
    res.status(502).json({
      source: 'error',
      error: err instanceof Error ? err.message : 'Translation request failed.',
    });
  }
});

// Admin Governance Endpoints
app.get('/api/admin/users', requireAuth, requirePermission('manage_user_roles'), (_req, res) => {
  const rows = db
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
       ORDER BY u.created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;
  res.json({ users: rows.map(mapRowToUserAccount) });
});

app.patch('/api/admin/users/:id/role', requireAuth, requirePermission('manage_user_roles'), (req: AuthenticatedRequest, res) => {
  const targetId = req.params.id;
  const admin = getUserAccountById(req.authUser!.id)!;
  const target = getUserAccountById(targetId);
  if (!target) {
    res.status(404).json({ error: 'Target user not found.' });
    return;
  }

  const validRoles: UserRole[] = ['astronaut', 'medical_specialist', 'scientific_researcher', 'general_user', 'administrator'];
  const nextRole = validRoles.includes(req.body?.role) ? (req.body.role as UserRole) : target.role;
  const validStatuses = ['active', 'pending_review', 'suspended'];
  const nextStatus = validStatuses.includes(req.body?.status) ? req.body.status : target.status;

  if (targetId === admin.id && nextRole !== 'administrator') {
    res.status(400).json({ error: 'Administrators cannot demote their own active session role.' });
    return;
  }

  db.prepare(`UPDATE users SET role_key = ?, status = ? WHERE id = ?`).run(nextRole, nextStatus, targetId);
  logAudit(admin.id, admin.username, 'USER_ROLE_OR_STATUS_UPDATED', 'user', targetId, `Changed ${target.username} role=${nextRole}, status=${nextStatus}.`);
  res.json({ user: getUserAccountById(targetId) });
});

app.get('/api/admin/audit-logs', requireAuth, requirePermission('manage_application_settings'), (_req, res) => {
  res.json({ logs: getAuditLogs(80) });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KAWSAY NOVA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
