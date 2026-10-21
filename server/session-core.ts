import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

export interface SessionPayload {
  sid: string;
  iat: number;
  exp: number;
}

export interface SessionValidationResult {
  valid: boolean;
  expired: boolean;
  session?: SessionPayload;
  remainingSeconds: number;
  error?: string;
}

export const SESSION_COOKIE_NAME = 'comm_showcase_session';
export const SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes in milliseconds
export const SESSION_DURATION_SECONDS = 3600;
export const MAX_VIDEO_CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB limit per Range response (strictly under Vercel's 4.5 MB payload ceiling)

export const ALLOWED_PROTECTED_IMAGES = [
  'Alerts and live events.png',
  'Dashboard.png',
  'Device inventory details.png',
  'Earth station map.png',
  'Network Topolgy.png',
  'Performance.png',
] as const;

/**
 * Resolves the cryptographic secret used for HMAC-SHA256 signing.
 * In production, this strictly requires SESSION_SECRET in process.env.
 * Never provides a hardcoded fallback.
 */
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: SESSION_SECRET is not configured on server.');
    }
    const devSecret = process.env.DEV_SESSION_SECRET;
    if (devSecret && devSecret.trim().length > 0) {
      return devSecret;
    }
    throw new Error('SESSION_SECRET environment variable is missing.');
  }
  return secret;
}

/**
 * Encodes an object into URL-safe base64 string.
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes URL-safe base64 string.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a payload with HMAC-SHA256 and returns token: base64Payload.signatureHex
 */
export function signSessionPayload(payload: SessionPayload, secret: string): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('hex');
  return `${encodedPayload}.${signature}`;
}

/**
 * Parses and verifies an HMAC-signed session token.
 * Uses timing-safe constant-time comparison.
 */
export function verifySessionToken(token: string, secret: string): SessionValidationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, expired: false, remainingSeconds: 0, error: 'MISSING_TOKEN' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, expired: false, remainingSeconds: 0, error: 'MALFORMED_TOKEN' };
  }

  const [encodedPayload, signatureHex] = parts;

  // Compute expected signature
  const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('hex');

  const sigBuffer = Buffer.from(signatureHex, 'utf8');
  const expectedSigBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return { valid: false, expired: false, remainingSeconds: 0, error: 'INVALID_SIGNATURE' };
  }

  try {
    const rawJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(rawJson) as SessionPayload;

    if (!payload.sid || typeof payload.sid !== 'string' || typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
      return { valid: false, expired: false, remainingSeconds: 0, error: 'INVALID_PAYLOAD' };
    }

    const now = Date.now();
    if (now >= payload.exp) {
      return {
        valid: false,
        expired: true,
        session: payload,
        remainingSeconds: 0,
        error: 'SESSION_EXPIRED',
      };
    }

    const remainingSeconds = Math.max(0, Math.floor((payload.exp - now) / 1000));
    return {
      valid: true,
      expired: false,
      session: payload,
      remainingSeconds,
    };
  } catch {
    return { valid: false, expired: false, remainingSeconds: 0, error: 'DECODE_ERROR' };
  }
}

/**
 * Extracts a cookie value by name from standard Cookie header.
 */
export function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Formats a Set-Cookie header value with security attributes.
 */
export function formatSessionCookie(token: string, maxAgeSeconds: number, isProduction: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (isProduction) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Creates a brand new 60-minute session.
 */
export function createNewSession(secret: string, isProduction: boolean): {
  cookieHeader: string;
  token: string;
  payload: SessionPayload;
  remainingSeconds: number;
} {
  const now = Date.now();
  const payload: SessionPayload = {
    sid: crypto.randomUUID(),
    iat: now,
    exp: now + SESSION_DURATION_MS,
  };

  const token = signSessionPayload(payload, secret);
  const cookieHeader = formatSessionCookie(token, SESSION_DURATION_SECONDS, isProduction);

  return {
    cookieHeader,
    token,
    payload,
    remainingSeconds: SESSION_DURATION_SECONDS,
  };
}

/**
 * Validates the visitor session from incoming HTTP headers.
 */
export function validateRequestSession(req: IncomingMessage, secret: string): SessionValidationResult {
  const cookieHeader = req.headers.cookie;
  const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) {
    return { valid: false, expired: false, remainingSeconds: 0, error: 'NO_COOKIE' };
  }
  return verifySessionToken(token, secret);
}

/**
 * Resolves the absolute path to a protected asset on disk, supporting both local dev and Vercel functions.
 */
export function resolveProtectedPath(relativePath: string): string {
  // First check process.cwd() (standard in Vercel Serverless and local dev)
  const root = process.cwd();
  const directPath = path.resolve(root, relativePath);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // Fallback for packaged Lambda paths
  const lambdaPath = path.resolve(__dirname, '..', relativePath);
  if (fs.existsSync(lambdaPath)) {
    return lambdaPath;
  }

  return directPath;
}

/**
 * Handles HTTP Range requests for video streaming with active session validation.
 */
export function handleVideoStreaming(
  req: IncomingMessage,
  res: ServerResponse,
  videoRelativePath: string,
  secret: string
): void {
  // 1. Authoritative session validation
  const sessionResult = validateRequestSession(req, secret);

  if (!sessionResult.valid) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.end(
      JSON.stringify({
        error: sessionResult.expired ? 'SESSION_EXPIRED' : 'SESSION_UNAUTHORIZED',
        message: sessionResult.expired
          ? 'Visitor showcase session has expired. Access to demonstration videos is restricted.'
          : 'Unauthorized. An active visitor session is required.',
        remainingSeconds: 0,
      })
    );
    return;
  }

  // 2. Resolve file on disk
  const filePath = resolveProtectedPath(videoRelativePath);
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'FILE_NOT_FOUND', message: 'Video demonstration file not found.' }));
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // 3. Range request handling (seeking / progressive streaming)
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const requestedEnd = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Check Range validity
    if (isNaN(start) || start >= fileSize || (parts[1] && (isNaN(requestedEnd) || start > requestedEnd))) {
      res.statusCode = 416; // Range Not Satisfiable
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      res.setHeader('Content-Type', 'text/plain');
      res.end('Requested Range Not Satisfiable');
      return;
    }

    // Limit individual chunk to MAX_VIDEO_CHUNK_SIZE (2 MB) to strictly respect Vercel limits
    // and guarantee frequent session expiry checks
    const end = Math.min(requestedEnd, start + MAX_VIDEO_CHUNK_SIZE - 1, fileSize - 1);
    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.statusCode = 206; // Partial Content
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    fileStream.pipe(res);
  } else {
    // Client did not specify Range: serve the first 2 MB chunk with 206 Partial Content
    const start = 0;
    const end = Math.min(fileSize - 1, MAX_VIDEO_CHUNK_SIZE - 1);
    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunkSize);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    fileStream.pipe(res);
  }
}

/**
 * Handles protected screenshot image serving with session validation.
 */
export function handleImageServing(
  req: IncomingMessage,
  res: ServerResponse,
  imageName: string,
  secret: string
): void {
  // 1. Authoritative session validation
  const sessionResult = validateRequestSession(req, secret);

  if (!sessionResult.valid) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.end(
      JSON.stringify({
        error: sessionResult.expired ? 'SESSION_EXPIRED' : 'SESSION_UNAUTHORIZED',
        message: 'Visitor showcase session has expired. Access to interface consoles is restricted.',
        remainingSeconds: 0,
      })
    );
    return;
  }

  // 2. Whitelist validation to prevent path traversal
  const decodedName = decodeURIComponent(imageName);
  const isAllowed = ALLOWED_PROTECTED_IMAGES.includes(decodedName as any);
  if (!isAllowed) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'IMAGE_NOT_FOUND', message: 'Requested interface capture not found.' }));
    return;
  }

  const filePath = resolveProtectedPath(path.join('protected', 'img', decodedName));
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'FILE_NOT_FOUND', message: 'Interface capture file not found.' }));
    return;
  }

  const stat = fs.statSync(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}
