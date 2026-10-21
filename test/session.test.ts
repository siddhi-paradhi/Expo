import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import http from 'http';
import path from 'path';
import {
  signSessionPayload,
  verifySessionToken,
  parseCookie,
  formatSessionCookie,
  createNewSession,
  validateRequestSession,
  handleVideoStreaming,
  handleImageServing,
  getSessionSecret,
  SESSION_COOKIE_NAME,
  ALLOWED_PROTECTED_IMAGES,
} from '../server/session-core';
import { formatRemainingTime } from '../src/hooks/useVisitorSession';

// Mock helper to create minimal http IncomingMessage and ServerResponse for testing
function createMockHttpPair(headers: Record<string, string> = {}) {
  const req = {
    headers: { ...headers },
    url: '/',
  } as unknown as http.IncomingMessage;

  const resData: {
    statusCode: number;
    headers: Record<string, any>;
    body: Buffer[];
  } = {
    statusCode: 200,
    headers: {},
    body: [],
  };

  const res = {
    get statusCode() {
      return resData.statusCode;
    },
    set statusCode(code: number) {
      resData.statusCode = code;
    },
    setHeader(name: string, value: any) {
      resData.headers[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return resData.headers[name.toLowerCase()];
    },
    write(chunk: any) {
      if (chunk) {
        resData.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return true;
    },
    end(chunk?: any) {
      if (chunk) {
        resData.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    },
    on() {
      return res;
    },
    once() {
      return res;
    },
    emit() {
      return true;
    },
  } as unknown as http.ServerResponse & {
    _getData: () => { statusCode: number; headers: Record<string, any>; bodyText: string; bodyBuffer: Buffer };
  };

  res._getData = () => {
    const fullBuffer = Buffer.concat(resData.body);
    return {
      statusCode: resData.statusCode,
      headers: resData.headers,
      bodyText: fullBuffer.toString('utf8'),
      bodyBuffer: fullBuffer,
    };
  };

  return { req, res };
}

describe('Session Core & Cryptographic Verification', () => {
  // Use a cryptographically secure random 32-byte secret for each test run
  const testSecret = crypto.randomBytes(32).toString('hex');

  it('generates a valid signed session token that verifies successfully', () => {
    const now = Date.now();
    const payload = {
      sid: crypto.randomUUID(),
      iat: now,
      exp: now + 3600 * 1000,
    };

    const token = signSessionPayload(payload, testSecret);
    expect(token).toContain('.');

    const result = verifySessionToken(token, testSecret);
    expect(result.valid).toBe(true);
    expect(result.expired).toBe(false);
    expect(result.session?.sid).toBe(payload.sid);
    expect(result.remainingSeconds).toBeGreaterThan(3590);
    expect(result.remainingSeconds).toBeLessThanOrEqual(3600);
  });

  it('rejects tampered payload data when an attacker attempts to extend expiry', () => {
    const now = Date.now();
    const legitimatePayload = {
      sid: crypto.randomUUID(),
      iat: now,
      exp: now + 60 * 1000,
    };

    const genuineToken = signSessionPayload(legitimatePayload, testSecret);
    const [genuinePayloadB64, genuineSignature] = genuineToken.split('.');

    // Attacker decodes payload, changes exp to 10 hours in future, re-encodes with old signature
    const decoded = JSON.parse(Buffer.from(genuinePayloadB64, 'base64').toString('utf8'));
    decoded.exp = now + 10 * 3600 * 1000;
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64').replace(/=/g, '');

    const tamperedToken = `${tamperedPayloadB64}.${genuineSignature}`;

    const result = verifySessionToken(tamperedToken, testSecret);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_SIGNATURE');
  });

  it('rejects tampered signatures and arbitrary tokens', () => {
    const fakeToken = 'eyJzaWQiOiIxMjM0NSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyNzAwMDAwMDAwfQ.deadbeefcafebabe';
    const result = verifySessionToken(fakeToken, testSecret);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_SIGNATURE');
  });

  it('rejects malformed tokens without period separator', () => {
    const result = verifySessionToken('malformed_token_string', testSecret);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('MALFORMED_TOKEN');
  });

  it('identifies expired sessions correctly and calculates remainingSeconds as 0', () => {
    const pastTime = Date.now() - 5000;
    const expiredPayload = {
      sid: crypto.randomUUID(),
      iat: pastTime - 3600 * 1000,
      exp: pastTime,
    };

    const token = signSessionPayload(expiredPayload, testSecret);
    const result = verifySessionToken(token, testSecret);

    expect(result.valid).toBe(false);
    expect(result.expired).toBe(true);
    expect(result.remainingSeconds).toBe(0);
    expect(result.error).toBe('SESSION_EXPIRED');
  });

  it('fails closed when SESSION_SECRET is missing in production environment', () => {
    const origEnv = process.env.NODE_ENV;
    const origSecret = process.env.SESSION_SECRET;
    const origDevSecret = process.env.DEV_SESSION_SECRET;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.SESSION_SECRET;
      delete process.env.DEV_SESSION_SECRET;

      expect(() => getSessionSecret()).toThrow(/FATAL: SESSION_SECRET is not configured on server/);
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origSecret) process.env.SESSION_SECRET = origSecret;
      if (origDevSecret) process.env.DEV_SESSION_SECRET = origDevSecret;
    }
  });
});

describe('Cookie Parsing & Security Formatting', () => {
  it('correctly parses session cookie from Cookie header with multiple cookies', () => {
    const cookieHeader = 'analytics_id=xyz789; comm_showcase_session=test_token_123; theme=dark';
    const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
    expect(token).toBe('test_token_123');
  });

  it('returns null if session cookie is absent from Cookie header', () => {
    const cookieHeader = 'analytics_id=xyz789; theme=dark';
    const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
    expect(token).toBeNull();
  });

  it('formats session cookie with HttpOnly, SameSite=Lax, Path=/, and Secure in production', () => {
    const cookie = formatSessionCookie('test_token', 3600, true);
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=test_token`);
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=3600');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
  });

  it('omits Secure flag when in non-production local development', () => {
    const cookie = formatSessionCookie('test_token', 3600, false);
    expect(cookie).not.toContain('Secure');
  });

  it('createNewSession produces valid token, headers, and 3600 remaining seconds', () => {
    const secret = crypto.randomBytes(32).toString('hex');
    const session = createNewSession(secret, false);

    expect(session.remainingSeconds).toBe(3600);
    expect(session.payload.sid).toBeDefined();
    expect(session.cookieHeader).toContain(SESSION_COOKIE_NAME);

    const verified = verifySessionToken(session.token, secret);
    expect(verified.valid).toBe(true);
  });
});

describe('Server-Side Protected Video Streaming & HTTP Range Requests', () => {
  const secret = crypto.randomBytes(32).toString('hex');
  const videoPath = path.join('protected', 'videos', 'CNMS.mp4');

  it('blocks unauthenticated requests without session cookie with 403 Forbidden', () => {
    const { req, res } = createMockHttpPair();
    handleVideoStreaming(req, res, videoPath, secret);

    const data = res._getData();
    expect(data.statusCode).toBe(403);
    const body = JSON.parse(data.bodyText);
    expect(body.error).toBe('SESSION_UNAUTHORIZED');
  });

  it('blocks requests with expired session cookie with 403 Forbidden', () => {
    const expiredPayload = {
      sid: crypto.randomUUID(),
      iat: Date.now() - 4000 * 1000,
      exp: Date.now() - 400 * 1000,
    };
    const expiredToken = signSessionPayload(expiredPayload, secret);

    const { req, res } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${expiredToken}`,
    });

    handleVideoStreaming(req, res, videoPath, secret);

    const data = res._getData();
    expect(data.statusCode).toBe(403);
    const body = JSON.parse(data.bodyText);
    expect(body.error).toBe('SESSION_EXPIRED');
  });

  it('supports HTTP Range requests (206 Partial Content) for video seeking during active session', async () => {
    const activeSession = createNewSession(secret, false);

    const { req, res } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${activeSession.token}`,
      range: 'bytes=0-1023',
    });

    handleVideoStreaming(req, res, videoPath, secret);

    // Allow readable stream to finish piping
    await new Promise((resolve) => setTimeout(resolve, 50));

    const data = res._getData();
    expect(data.statusCode).toBe(206);
    expect(data.headers['content-range']).toMatch(/^bytes 0-1023\/\d+$/);
    expect(data.headers['accept-ranges']).toBe('bytes');
    expect(data.headers['content-length']).toBe(1024);
    expect(data.headers['content-type']).toBe('video/mp4');
    expect(data.bodyBuffer.length).toBe(1024);
  });

  it('returns 416 Range Not Satisfiable when range start exceeds file size', () => {
    const activeSession = createNewSession(secret, false);

    const { req, res } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${activeSession.token}`,
      range: 'bytes=99999999999-',
    });

    handleVideoStreaming(req, res, videoPath, secret);

    const data = res._getData();
    expect(data.statusCode).toBe(416);
    expect(data.headers['content-range']).toMatch(/^bytes \*\/\d+$/);
  });

  it('caps open-ended Range requests to 2 MB (MAX_VIDEO_CHUNK_SIZE) to respect Vercel payload limits', async () => {
    const activeSession = createNewSession(secret, false);

    const { req, res } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${activeSession.token}`,
      range: 'bytes=0-',
    });

    handleVideoStreaming(req, res, videoPath, secret);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const data = res._getData();
    expect(data.statusCode).toBe(206);
    // Must be capped at 2MB (2097152 bytes)
    expect(data.headers['content-length']).toBe(2 * 1024 * 1024);
    expect(data.headers['content-range']).toMatch(/^bytes 0-2097151\/\d+$/);
    expect(data.headers['content-type']).toBe('video/mp4');
  });

  it('simulates expiry during streaming: chunk requested before expiry succeeds, subsequent chunk and seek fail with 403', async () => {
    // 1. Session with 100ms lifetime
    const shortLivedPayload = {
      sid: crypto.randomUUID(),
      iat: Date.now(),
      exp: Date.now() + 150, // expires in 150ms
    };
    const shortLivedToken = signSessionPayload(shortLivedPayload, secret);

    // Initial chunk request before expiry
    const { req: req1, res: res1 } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${shortLivedToken}`,
      range: 'bytes=0-1023',
    });
    handleVideoStreaming(req1, res1, videoPath, secret);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const data1 = res1._getData();
    expect(data1.statusCode).toBe(206);
    expect(data1.headers['content-length']).toBe(1024);

    // 2. Wait 200ms so session passes its expiry timestamp
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Subsequent sequential chunk request (e.g. browser continuing playback buffer)
    const { req: req2, res: res2 } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${shortLivedToken}`,
      range: 'bytes=1024-2047',
    });
    handleVideoStreaming(req2, res2, videoPath, secret);

    const data2 = res2._getData();
    expect(data2.statusCode).toBe(403);
    const body2 = JSON.parse(data2.bodyText);
    expect(body2.error).toBe('SESSION_EXPIRED');

    // User seeking attempt after expiry
    const { req: req3, res: res3 } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${shortLivedToken}`,
      range: 'bytes=5000000-5001023',
    });
    handleVideoStreaming(req3, res3, videoPath, secret);

    const data3 = res3._getData();
    expect(data3.statusCode).toBe(403);
    const body3 = JSON.parse(data3.bodyText);
    expect(body3.error).toBe('SESSION_EXPIRED');
  });
});

describe('Server-Side Protected Image Gating', () => {
  const secret = crypto.randomBytes(32).toString('hex');
  const validImageName = 'Earth station map.png';

  it('blocks unauthenticated image requests with 403 Forbidden', () => {
    const { req, res } = createMockHttpPair();
    handleImageServing(req, res, validImageName, secret);

    const data = res._getData();
    expect(data.statusCode).toBe(403);
    const body = JSON.parse(data.bodyText);
    expect(body.error).toBe('SESSION_UNAUTHORIZED');
  });

  it('blocks expired sessions from loading protected screenshots with 403 Forbidden', () => {
    const expiredPayload = {
      sid: crypto.randomUUID(),
      iat: Date.now() - 4000 * 1000,
      exp: Date.now() - 100 * 1000,
    };
    const expiredToken = signSessionPayload(expiredPayload, secret);

    const { req, res } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${expiredToken}`,
    });

    handleImageServing(req, res, validImageName, secret);

    const data = res._getData();
    expect(data.statusCode).toBe(403);
    const body = JSON.parse(data.bodyText);
    expect(body.error).toBe('SESSION_EXPIRED');
  });

  it('serves valid whitelisted screenshots with 200 OK and image/png during active session', async () => {
    const activeSession = createNewSession(secret, false);

    const { req, res } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${activeSession.token}`,
    });

    handleImageServing(req, res, validImageName, secret);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const data = res._getData();
    expect(data.statusCode).toBe(200);
    expect(data.headers['content-type']).toBe('image/png');
    expect(data.headers['cache-control']).toBe('private, no-cache, no-store, must-revalidate');
    expect(data.bodyBuffer.length).toBeGreaterThan(0);
  });

  it('rejects path traversal attempts and non-whitelisted image files with 404', () => {
    const activeSession = createNewSession(secret, false);

    const { req, res } = createMockHttpPair({
      cookie: `${SESSION_COOKIE_NAME}=${activeSession.token}`,
    });

    handleImageServing(req, res, '../../package.json', secret);

    const data = res._getData();
    expect(data.statusCode).toBe(404);
  });
});

describe('Countdown & UI Time Formatting', () => {
  it('formats full hour cleanly as 01:00:00', () => {
    expect(formatRemainingTime(3600)).toBe('01:00:00');
  });

  it('formats partial minutes and seconds', () => {
    expect(formatRemainingTime(1845)).toBe('00:30:45');
    expect(formatRemainingTime(65)).toBe('00:01:05');
  });

  it('formats 0 or negative seconds as 00:00:00', () => {
    expect(formatRemainingTime(0)).toBe('00:00:00');
    expect(formatRemainingTime(-10)).toBe('00:00:00');
  });
});
