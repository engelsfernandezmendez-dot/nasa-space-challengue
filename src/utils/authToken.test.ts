import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apiFetch,
  buildAuthorizedHeaders,
  clearSessionToken,
  getSessionToken,
  isSameOriginApiUrl,
  setSessionToken,
} from './authToken';

test('isSameOriginApiUrl matches relative and same-origin /api/ paths only', () => {
  assert.equal(isSameOriginApiUrl('/api/calendar/tasks', 'https://app.run.app'), true);
  assert.equal(
    isSameOriginApiUrl('https://app.run.app/api/biomedical/measurements', 'https://app.run.app'),
    true
  );
  assert.equal(
    isSameOriginApiUrl('https://other-site.com/api/biomedical/measurements', 'https://app.run.app'),
    false
  );
  assert.equal(isSameOriginApiUrl('/assets/logo.png', 'https://app.run.app'), false);
});

test('setSessionToken, getSessionToken, and clearSessionToken manage in-memory session tokens', () => {
  clearSessionToken();
  assert.equal(getSessionToken(), null);

  setSessionToken('  abc.def.123  ');
  assert.equal(getSessionToken(), 'abc.def.123');

  clearSessionToken();
  assert.equal(getSessionToken(), null);
});

test('buildAuthorizedHeaders injects Bearer token without overriding existing headers', () => {
  const headers = buildAuthorizedHeaders({ 'Content-Type': 'application/json' }, 'tok-123');
  assert.equal(headers.get('Content-Type'), 'application/json');
  assert.equal(headers.get('Authorization'), 'Bearer tok-123');

  const preserved = buildAuthorizedHeaders({ Authorization: 'Bearer custom' }, 'tok-123');
  assert.equal(preserved.get('Authorization'), 'Bearer custom');
});

test('apiFetch attaches Bearer token and credentials include without mutating global fetch', async () => {
  setSessionToken('session-xyz');
  let capturedInit: RequestInit | undefined;
  let capturedUrl: string | undefined;

  await apiFetch(
    '/api/calendar/tasks',
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedInit = init;
      return new Response('{}', { status: 200 });
    }) as typeof fetch
  );

  assert.equal(capturedUrl, '/api/calendar/tasks');
  assert.equal(capturedInit?.credentials, 'include');
  assert.equal(new Headers(capturedInit?.headers).get('Authorization'), 'Bearer session-xyz');
  assert.equal(new Headers(capturedInit?.headers).get('Content-Type'), 'application/json');
  clearSessionToken();
});
