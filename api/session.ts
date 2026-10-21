import type { IncomingMessage, ServerResponse } from 'http';
import {
  getSessionSecret,
  validateRequestSession,
  createNewSession,
} from '../server/session-core';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  // Always prevent caching on session endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'application/json');

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch (err: any) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: 'SERVER_MISCONFIGURATION',
        message: err.message || 'SESSION_SECRET missing on server.',
      })
    );
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const validation = validateRequestSession(req, secret);

  // 1. Existing valid session
  if (validation.valid && validation.session) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        active: true,
        expired: false,
        remainingSeconds: validation.remainingSeconds,
        expiresAt: validation.session.exp,
        sessionId: validation.session.sid,
      })
    );
    return;
  }

  // 2. Existing expired session (Do not silently restart!)
  if (validation.expired) {
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        active: false,
        expired: true,
        remainingSeconds: 0,
        expiresAt: validation.session?.exp,
        message: 'Session has expired.',
      })
    );
    return;
  }

  // 3. Existing tampered / invalid cookie
  if (validation.error && validation.error !== 'NO_COOKIE') {
    res.statusCode = 401;
    res.end(
      JSON.stringify({
        active: false,
        expired: false,
        remainingSeconds: 0,
        error: validation.error,
        message: 'Session signature verification failed or token is malformed.',
      })
    );
    return;
  }

  // 4. No session cookie: issue brand new 60-minute session
  const newSession = createNewSession(secret, isProduction);
  res.setHeader('Set-Cookie', newSession.cookieHeader);
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      active: true,
      expired: false,
      remainingSeconds: newSession.remainingSeconds,
      expiresAt: newSession.payload.exp,
      sessionId: newSession.payload.sid,
    })
  );
}
