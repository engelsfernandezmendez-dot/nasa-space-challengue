import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import type { PermissionKey, UserRole } from '../src/types/kawsay';
import { hasPermission, sanitizeSvgContent } from '../src/utils/validation';

const SESSION_COOKIE_NAME = 'kawsay_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'kawsay-nova-dev-hmac-secret-2026-change-in-prod';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const ADMIN_PROVISION_CODE =
  process.env.ADMIN_PROVISION_CODE || 'KAWSAY-ADMIN-2026';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

interface SessionPayload {
  uid: string;
  role: UserRole;
  exp: number;
}

export function createSessionToken(uid: string, role: UserRole): string {
  const payload: SessionPayload = {
    uid,
    role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || !parsed.role || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0) {
      const key = part.slice(0, eqIdx).trim();
      const val = decodeURIComponent(part.slice(eqIdx + 1).trim());
      result[key] = val;
    }
  }
  return result;
}

function isHttpsRequest(req?: Request): boolean {
  if (!req) return false;
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string') {
    return proto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return false;
}

export function setSessionCookie(res: Response, token: string, req?: Request): void {
  const https = isHttpsRequest(req);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: https ? 'none' : 'lax',
    secure: https,
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
  if (https) {
    const current = res.getHeader('Set-Cookie');
    if (typeof current === 'string' && !current.includes('Partitioned')) {
      res.setHeader('Set-Cookie', `${current}; Partitioned`);
    } else if (Array.isArray(current)) {
      res.setHeader(
        'Set-Cookie',
        current.map((c) =>
          c.startsWith(`${SESSION_COOKIE_NAME}=`) && !c.includes('Partitioned')
            ? `${c}; Partitioned`
            : c
        )
      );
    }
  }
}

export function clearSessionCookie(res: Response, req?: Request): void {
  const https = isHttpsRequest(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    sameSite: https ? 'none' : 'lax',
    secure: https,
  });
  if (https) {
    const current = res.getHeader('Set-Cookie');
    if (typeof current === 'string' && !current.includes('Partitioned')) {
      res.setHeader('Set-Cookie', `${current}; Partitioned`);
    } else if (Array.isArray(current)) {
      res.setHeader(
        'Set-Cookie',
        current.map((c) =>
          c.startsWith(`${SESSION_COOKIE_NAME}=`) && !c.includes('Partitioned')
            ? `${c}; Partitioned`
            : c
        )
      );
    }
  }
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1].trim() : null;
}

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const bearer = extractBearerToken(req.headers.authorization);
  if (bearer) {
    const verified = verifySessionToken(bearer);
    if (verified) return verified;
  }
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    role: UserRole;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  req.authUser = { id: session.uid, role: session.role };
  next();
}

export function requirePermission(permission: PermissionKey) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!hasPermission(req.authUser.role, permission)) {
      res.status(403).json({ error: 'Forbidden: insufficient role permissions.' });
      return;
    }
    next();
  };
}

export function detectImageMagicBytes(
  buffer: Buffer
): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (buffer.length >= 4) {
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }
  }
  return null;
}

export function saveUploadedImageToDisk(params: {
  targetDir: string;
  publicPrefix: string;
  fileBaseName: string;
  dataUrlOrBase64: string;
  mimeType: string;
  allowSvg: boolean;
  maxBytes?: number;
}): { ok: true; publicPath: string; mimeType: string; bytes: number } | { ok: false; error: string } {
  const maxBytes = params.maxBytes ?? 5 * 1024 * 1024;
  let base64Str = params.dataUrlOrBase64;
  let declaredMime = (params.mimeType || '').toLowerCase();

  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/i.exec(base64Str);
  if (dataUrlMatch) {
    declaredMime = dataUrlMatch[1].toLowerCase();
    base64Str = dataUrlMatch[2];
  }

  const buffer = Buffer.from(base64Str, 'base64');
  if (buffer.length === 0 || buffer.length > maxBytes) {
    return { ok: false, error: 'Image size exceeds allowed 5 MB limit or file is empty.' };
  }

  fs.mkdirSync(params.targetDir, { recursive: true });

  if (declaredMime === 'image/svg+xml') {
    if (!params.allowSvg) {
      return { ok: false, error: 'SVG format is not permitted for profile photographs.' };
    }
    const rawText = buffer.toString('utf8');
    const sanitized = sanitizeSvgContent(rawText);
    if (!sanitized.safe) {
      return { ok: false, error: sanitized.reason || 'Unsafe SVG content rejected.' };
    }
    const fileName = `${params.fileBaseName}.svg`;
    const fullPath = path.join(params.targetDir, fileName);
    fs.writeFileSync(fullPath, sanitized.sanitized, 'utf8');
    return {
      ok: true,
      publicPath: `${params.publicPrefix}/${fileName}`,
      mimeType: 'image/svg+xml',
      bytes: Buffer.byteLength(sanitized.sanitized, 'utf8'),
    };
  }

  const detected = detectImageMagicBytes(buffer);
  if (!detected) {
    return { ok: false, error: 'File signature does not match a valid PNG, JPG, or WEBP image.' };
  }

  const ext = detected === 'image/png' ? 'png' : detected === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${params.fileBaseName}.${ext}`;
  const fullPath = path.join(params.targetDir, fileName);
  fs.writeFileSync(fullPath, buffer);
  return {
    ok: true,
    publicPath: `${params.publicPrefix}/${fileName}`,
    mimeType: detected,
    bytes: buffer.length,
  };
}
