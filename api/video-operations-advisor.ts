import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import { getSessionSecret, handleVideoStreaming } from '../server/session-core';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'SERVER_MISCONFIGURATION', message: err.message }));
    return;
  }

  const relativePath = path.join('protected', 'videos', 'operations-advisor.mp4');
  handleVideoStreaming(req, res, relativePath, secret);
}
