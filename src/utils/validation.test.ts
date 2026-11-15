import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessUserProfile,
  canAssignRolePublicly,
  computeAspectRatioDimensions,
  hasPermission,
  sanitizeSvgContent,
  validateAvatarFile,
  validateLogoFile,
  validateMissionTaskInput,
  validatePasswordChange,
  validateRegistrationInput,
} from './validation';

test('validateRegistrationInput accepts valid astronaut registration', () => {
  const res = validateRegistrationInput({
    fullName: 'Valeria Mendoza',
    username: 'valeria.mendoza',
    email: 'valeria@kawsay.org',
    password: 'StrongPassword2026!',
    passwordConfirmation: 'StrongPassword2026!',
    country: 'Peru',
    city: 'Cusco',
    preferredLanguage: 'es',
    role: 'astronaut',
  });
  assert.equal(res.valid, true);
  assert.deepEqual(res.errors, {});
});

test('validateRegistrationInput rejects mismatched passwords and invalid email', () => {
  const res = validateRegistrationInput({
    fullName: 'A',
    username: 'x',
    email: 'bad-email',
    password: '123',
    passwordConfirmation: '456',
    country: '',
    city: '',
    preferredLanguage: 'zz',
    role: 'unknown',
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors.fullName);
  assert.ok(res.errors.username);
  assert.ok(res.errors.email);
  assert.ok(res.errors.password);
  assert.ok(res.errors.passwordConfirmation);
  assert.ok(res.errors.role);
});

test('canAssignRolePublicly blocks administrator without authorization code', () => {
  assert.equal(canAssignRolePublicly('astronaut').allowed, true);
  assert.equal(canAssignRolePublicly('administrator', '', 'KAWSAY-ADMIN-2026').allowed, false);
  assert.equal(canAssignRolePublicly('administrator', 'wrong', 'KAWSAY-ADMIN-2026').allowed, false);
  assert.equal(
    canAssignRolePublicly('administrator', 'KAWSAY-ADMIN-2026', 'KAWSAY-ADMIN-2026').allowed,
    true
  );
});

test('RBAC permissions enforce strict role separation', () => {
  assert.equal(hasPermission('administrator', 'manage_application_branding'), true);
  assert.equal(hasPermission('astronaut', 'manage_application_branding'), false);
  assert.equal(hasPermission('general_user', 'view_authorized_astronaut_records'), false);
  assert.equal(hasPermission('medical_specialist', 'add_clinical_observations'), true);
  assert.equal(hasPermission('scientific_researcher', 'access_anonymized_datasets'), true);
  assert.equal(hasPermission('astronaut', 'log_biomedical_measurements'), true);
  assert.equal(hasPermission('medical_specialist', 'log_biomedical_measurements'), true);
  assert.equal(hasPermission('administrator', 'log_biomedical_measurements'), true);
  assert.equal(hasPermission('general_user', 'log_biomedical_measurements'), false);
});

test('canAccessUserProfile prevents unauthorized cross-profile access', () => {
  assert.equal(canAccessUserProfile({ id: 'u1', role: 'astronaut' }, 'u1', 'astronaut'), true);
  assert.equal(canAccessUserProfile({ id: 'u1', role: 'astronaut' }, 'u2', 'astronaut'), false);
  assert.equal(canAccessUserProfile({ id: 'u3', role: 'general_user' }, 'u1', 'astronaut'), false);
  assert.equal(
    canAccessUserProfile({ id: 'u4', role: 'medical_specialist' }, 'u1', 'astronaut'),
    true
  );
  assert.equal(
    canAccessUserProfile({ id: 'u4', role: 'medical_specialist' }, 'u5', 'administrator'),
    false
  );
  assert.equal(
    canAccessUserProfile({ id: 'u5', role: 'administrator' }, 'u1', 'astronaut'),
    true
  );
});

test('validateAvatarFile restricts formats to JPG/JPEG/PNG/WEBP and <= 5MB', () => {
  assert.equal(
    validateAvatarFile({ name: 'portrait.png', type: 'image/png', size: 102400 }).valid,
    true
  );
  assert.equal(
    validateAvatarFile({ name: 'vector.svg', type: 'image/svg+xml', size: 1024 }).valid,
    false
  );
  assert.equal(
    validateAvatarFile({ name: 'huge.jpg', type: 'image/jpeg', size: 10 * 1024 * 1024 }).valid,
    false
  );
});

test('validateLogoFile permits sanitized SVG in addition to raster formats', () => {
  assert.equal(
    validateLogoFile({ name: 'brand.svg', type: 'image/svg+xml', size: 4096 }).valid,
    true
  );
  assert.equal(
    validateLogoFile({ name: 'brand.exe', type: 'application/octet-stream', size: 4096 }).valid,
    false
  );
});

test('sanitizeSvgContent strips scripts, event handlers, and javascript URIs', () => {
  const dirty =
    '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>fetch("/x")</script><a href="javascript:alert(2)"><circle cx="10" cy="10" r="5"/></a></svg>';
  const res = sanitizeSvgContent(dirty);
  assert.equal(res.safe, true);
  assert.equal(res.sanitized.includes('<script'), false);
  assert.equal(res.sanitized.includes('onload'), false);
  assert.equal(res.sanitized.includes('javascript:'), false);
  assert.equal(res.sanitized.includes('<circle'), true);
});

test('validatePasswordChange enforces current password and new password distinction', () => {
  assert.equal(
    validatePasswordChange({
      currentPassword: 'OldPassword1',
      newPassword: 'OldPassword1',
      confirmNewPassword: 'OldPassword1',
    }).valid,
    false
  );
  assert.equal(
    validatePasswordChange({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword2!',
      confirmNewPassword: 'NewPassword2!',
    }).valid,
    true
  );
});

test('computeAspectRatioDimensions crops cleanly without stretching', () => {
  assert.deepEqual(computeAspectRatioDimensions('1:1', 800, 400), { width: 400, height: 400 });
  assert.deepEqual(computeAspectRatioDimensions('16:9', 1600, 900), { width: 1600, height: 900 });
  assert.deepEqual(computeAspectRatioDimensions('original', 640, 480), { width: 640, height: 480 });
});

test('validateMissionTaskInput enforces title, valid date/time, and category', () => {
  assert.equal(
    validateMissionTaskInput({
      title: 'Lunar Orbit EVA Readiness',
      category: 'mission_activity',
      scheduledDate: '2026-11-15',
      scheduledTime: '09:30',
    }).valid,
    true
  );
  const bad = validateMissionTaskInput({
    title: '',
    category: 'invalid_cat',
    scheduledDate: '15-11-2026',
    scheduledTime: '',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.title);
  assert.ok(bad.errors.category);
  assert.ok(bad.errors.scheduledDate);
  assert.ok(bad.errors.scheduledTime);
});
