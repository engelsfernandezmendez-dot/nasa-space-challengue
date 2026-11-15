const TOKEN_STORAGE_KEY = 'kawsay_session_token_v1';

let inMemoryToken: string | null = null;

function readStorageToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromSession = window.sessionStorage?.getItem(TOKEN_STORAGE_KEY);
    if (fromSession) return fromSession;
  } catch {
    // ignore storage access errors in restricted iframes
  }
  try {
    const fromLocal = window.localStorage?.getItem(TOKEN_STORAGE_KEY);
    if (fromLocal) return fromLocal;
  } catch {
    // ignore storage access errors in restricted iframes
  }
  return null;
}

export function getSessionToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  const stored = readStorageToken();
  if (stored) {
    inMemoryToken = stored;
    return stored;
  }
  return null;
}

export function setSessionToken(token: string | null | undefined): void {
  const normalized = typeof token === 'string' && token.trim().length > 0 ? token.trim() : null;
  inMemoryToken = normalized;
  if (typeof window === 'undefined') return;
  try {
    if (normalized) {
      window.sessionStorage?.setItem(TOKEN_STORAGE_KEY, normalized);
    } else {
      window.sessionStorage?.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  try {
    if (normalized) {
      window.localStorage?.setItem(TOKEN_STORAGE_KEY, normalized);
    } else {
      window.localStorage?.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function clearSessionToken(): void {
  setSessionToken(null);
}

export function isSameOriginApiUrl(
  target: string | URL,
  currentOrigin: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
): boolean {
  const raw = target instanceof URL ? target.toString() : String(target);
  if (raw.startsWith('/api/')) return true;
  if (raw === '/api') return true;
  try {
    const parsed = new URL(raw, currentOrigin);
    return parsed.origin === currentOrigin && parsed.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export function buildAuthorizedHeaders(
  existing?: HeadersInit,
  token: string | null = getSessionToken()
): Headers {
  const headers = new Headers(existing);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)
): Promise<Response> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const urlTarget = input instanceof Request ? input.url : input;
  if (!isSameOriginApiUrl(urlTarget, origin)) {
    return fetchImpl(input, init);
  }

  const token = getSessionToken();
  if (input instanceof Request) {
    const merged = buildAuthorizedHeaders(init?.headers ?? input.headers, token);
    const nextReq = new Request(input, {
      ...init,
      headers: merged,
      credentials: init?.credentials ?? input.credentials ?? 'include',
    });
    return fetchImpl(nextReq);
  }

  const headers = buildAuthorizedHeaders(init?.headers, token);
  return fetchImpl(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}
