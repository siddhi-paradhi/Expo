import type { IncomingMessage, ServerResponse } from 'http';
import { getSessionSecret, handleImageServing } from '../server/session-core';

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

  // Parse query parameter ?name=...
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const imageName = url.searchParams.get('name') || '';

  handleImageServing(req, res, imageName, secret);
}
