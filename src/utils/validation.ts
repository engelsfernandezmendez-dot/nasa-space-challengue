import type { PermissionKey, UserRole } from '../types/kawsay';

export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_AVATAR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const ALLOWED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
] as const;

export const ALLOWED_LOGO_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg'] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ROLE_LABELS: Record<UserRole, string> = {
  astronaut: 'Astronaut',
  medical_specialist: 'Medical Specialist',
  scientific_researcher: 'Scientific Researcher',
  general_user: 'General User',
  administrator: 'System Administrator',
};

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  astronaut: [
    'manage_own_profile',
    'log_biomedical_measurements',
    'view_personal_health_trends',
    'complete_assessments',
    'use_wellness_features',
  ],
  medical_specialist: [
    'manage_own_profile',
    'view_authorized_astronaut_records',
    'log_biomedical_measurements',
    'analyze_biomedical_measurements',
    'review_alerts',
    'prepare_medical_reports',
    'add_clinical_observations',
  ],
  scientific_researcher: [
    'manage_own_profile',
    'access_anonymized_datasets',
    'review_scientific_models',
    'evaluate_experimental_formulas',
  ],
  general_user: [
    'manage_own_profile',
    'access_educational_resources',
    'use_wellness_features',
  ],
  administrator: [
    'manage_own_profile',
    'log_biomedical_measurements',
    'manage_application_settings',
    'manage_user_roles',
    'manage_application_branding',
    'manage_scientific_database',
    'review_alerts',
  ],
};

export function getRolePermissions(role: UserRole): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  return getRolePermissions(role).includes(permission);
}

export function canAccessUserProfile(
  requester: { id: string; role: UserRole },
  targetUserId: string,
  targetRole: UserRole
): boolean {
  if (requester.id === targetUserId) return true;
  if (requester.role === 'administrator') return true;
  if (requester.role === 'medical_specialist' && targetRole === 'astronaut') return true;
  return false;
}

export function canAssignRolePublicly(
  requestedRole: UserRole,
  adminProvisionCode?: string,
  expectedProvisionCode?: string
): { allowed: boolean; reason?: string } {
  if (requestedRole !== 'administrator') {
    return { allowed: true };
  }
  const provided = (adminProvisionCode ?? '').trim();
  const expected = (expectedProvisionCode ?? '').trim();
  if (!expected || !provided || provided !== expected) {
    return {
      allowed: false,
      reason:
        'System Administrator accounts cannot be created via open self-registration without a valid authorization provisioning code.',
    };
  }
  return { allowed: true };
}

export interface RegistrationValidationInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  country: string;
  city: string;
  preferredLanguage: string;
  role: string;
}

export function validateRegistrationInput(input: RegistrationValidationInput): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  const usernameTrimmed = (input.username ?? '').trim();
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(usernameTrimmed)) {
    errors.username =
      'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.';
  }

  const emailTrimmed = (input.email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!input.password || input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }

  if (input.password !== input.passwordConfirmation) {
    errors.passwordConfirmation = 'Password confirmation does not match.';
  }

  if (!input.country || input.country.trim().length < 2) {
    errors.country = 'Country is required.';
  }

  if (!input.city || input.city.trim().length < 2) {
    errors.city = 'City is required.';
  }

  const validLangs = ['en', 'es', 'qu', 'pt', 'fr', 'de', 'ja', 'zh'];
  if (!validLangs.includes(input.preferredLanguage)) {
    errors.preferredLanguage = 'Select a supported language.';
  }

  const validRoles: UserRole[] = [
    'astronaut',
    'medical_specialist',
    'scientific_researcher',
    'general_user',
    'administrator',
  ];
  if (!validRoles.includes(input.role as UserRole)) {
    errors.role = 'Select a valid account role.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateProfileUpdateInput(input: {
  fullName: string;
  username: string;
  email: string;
  country: string;
  city: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test((input.username ?? '').trim())) {
    errors.username = 'Username must be 3–32 characters (letters, numbers, ., _, -).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((input.email ?? '').trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!input.country || input.country.trim().length < 2) {
    errors.country = 'Country is required.';
  }
  if (!input.city || input.city.trim().length < 2) {
    errors.city = 'City is required.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePasswordChange(input: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): { valid: boolean; error?: string } {
  if (!input.currentPassword) {
    return { valid: false, error: 'Current password is required.' };
  }
  if (!input.newPassword || input.newPassword.length < 8) {
    return { valid: false, error: 'New password must be at least 8 characters.' };
  }
  if (input.newPassword === input.currentPassword) {
    return { valid: false, error: 'New password must differ from current password.' };
  }
  if (input.newPassword !== input.confirmNewPassword) {
    return { valid: false, error: 'New password confirmation does not match.' };
  }
  return { valid: true };
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

export function validateAvatarFile(file: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  const ext = getExtension(file.name);
  const mime = (file.type || '').toLowerCase();
  if (
    !ALLOWED_AVATAR_EXTENSIONS.includes(ext as (typeof ALLOWED_AVATAR_EXTENSIONS)[number]) &&
    !ALLOWED_AVATAR_MIME_TYPES.includes(mime as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])
  ) {
    return { valid: false, error: 'Unsupported format. Allowed: JPG, JPEG, PNG, WEBP.' };
  }
  if (mime && !ALLOWED_AVATAR_MIME_TYPES.includes(mime as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
    return { valid: false, error: 'Unsupported image MIME type. Allowed: JPG, JPEG, PNG, WEBP.' };
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Profile image must be between 1 byte and 5 MB.' };
  }
  return { valid: true };
}

export function validateLogoFile(file: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  const ext = getExtension(file.name);
  const mime = (file.type || '').toLowerCase();
  if (
    !ALLOWED_LOGO_EXTENSIONS.includes(ext as (typeof ALLOWED_LOGO_EXTENSIONS)[number]) &&
    !ALLOWED_LOGO_MIME_TYPES.includes(mime as (typeof ALLOWED_LOGO_MIME_TYPES)[number])
  ) {
    return { valid: false, error: 'Unsupported logo format. Allowed: PNG, JPG, JPEG, WEBP, SVG.' };
  }
  if (mime && !ALLOWED_LOGO_MIME_TYPES.includes(mime as (typeof ALLOWED_LOGO_MIME_TYPES)[number])) {
    return { valid: false, error: 'Unsupported logo MIME type. Allowed: PNG, JPG, JPEG, WEBP, SVG.' };
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    return { valid: false, error: 'Logo file must be between 1 byte and 5 MB.' };
  }
  return { valid: true };
}

export function sanitizeSvgContent(rawSvg: string): {
  safe: boolean;
  sanitized: string;
  reason?: string;
} {
  const trimmed = rawSvg.trim();
  if (!/<svg[\s>]/i.test(trimmed)) {
    return { safe: false, sanitized: '', reason: 'File does not contain a valid <svg> root element.' };
  }

  let cleaned = trimmed
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|xlink:href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '')
    .replace(/(href|xlink:href|src)\s*=\s*(['"])\s*data:text\/html[^'"]*\2/gi, '');

  if (!/<svg[\s>]/i.test(cleaned)) {
    return { safe: false, sanitized: '', reason: 'SVG failed safety validation.' };
  }

  return { safe: true, sanitized: cleaned };
}

export function computeAspectRatioDimensions(
  aspectRatio: 'original' | '1:1' | '16:9' | '4:3',
  naturalWidth: number,
  naturalHeight: number
): { width: number; height: number } {
  const safeW = Math.max(1, naturalWidth);
  const safeH = Math.max(1, naturalHeight);
  if (aspectRatio === 'original') {
    return { width: safeW, height: safeH };
  }
  const targetRatio =
    aspectRatio === '1:1' ? 1 : aspectRatio === '16:9' ? 16 / 9 : 4 / 3;
  const currentRatio = safeW / safeH;
  if (currentRatio > targetRatio) {
    return { width: Math.round(safeH * targetRatio), height: safeH };
  }
  return { width: safeW, height: Math.round(safeW / targetRatio) };
}

export const VALID_MISSION_TASK_CATEGORIES = [
  'health_assessment',
  'measurement_reminder',
  'physical_activity',
  'sleep_routine',
  'hydration_nutrition',
  'mission_activity',
] as const;

export function validateMissionTaskInput(input: {
  title: string;
  category?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.title || input.title.trim().length < 2) {
    errors.title = 'Enter a mission or routine title (at least 2 characters).';
  }
  if (
    input.category &&
    !VALID_MISSION_TASK_CATEGORIES.includes(
      input.category as (typeof VALID_MISSION_TASK_CATEGORIES)[number]
    )
  ) {
    errors.category = 'Select a valid mission calendar category.';
  }
  if (!input.scheduledDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.scheduledDate.trim())) {
    errors.scheduledDate = 'Select a valid date (YYYY-MM-DD).';
  }
  if (!input.scheduledTime || !/^\d{2}:\d{2}$/.test(input.scheduledTime.trim())) {
    errors.scheduledTime = 'Select a valid time (HH:MM).';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
