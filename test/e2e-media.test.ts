import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sessionHandler from '../api/session';
import videoCnmsHandler from '../api/video-cnms';
import videoOpsHandler from '../api/video-operations-advisor';
import imageHandler from '../api/image';
import {
  SESSION_COOKIE_NAME,
  signSessionPayload,
  ALLOWED_PROTECTED_IMAGES,
} from '../server/session-core';

describe('End-to-End Media & Browser Range Streaming Integration', () => {
  let server: http.Server;
  let serverPort: number;
  let baseUrl: string;
  const testSecret = crypto.randomBytes(32).toString('hex');

  beforeAll(async () => {
    process.env.SESSION_SECRET = testSecret;

    // Spin up real HTTP server binding to an ephemeral port
    server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      if (pathname === '/api/session') {
        return sessionHandler(req, res);
      }
      if (pathname === '/api/video-cnms' || pathname === '/videos/CNMS.mp4') {
        return videoCnmsHandler(req, res);
      }
      if (pathname === '/api/video-operations-advisor' || pathname === '/videos/operations-advisor.mp4') {
        return videoOpsHandler(req, res);
      }
      if (pathname === '/api/image' || pathname.startsWith('/img/')) {
        if (pathname.startsWith('/img/')) {
          const rawName = pathname.replace(/^\/img\//, '');
          req.url = `/api/image?name=${rawName}`;
        }
        return imageHandler(req, res);
      }

      res.statusCode = 404;
      res.end('Not Found');
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        serverPort = address.port;
        baseUrl = `http://127.0.0.1:${serverPort}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('verifies that packaged media files exist on disk with valid byte sizes and headers', () => {
    const root = process.cwd();
    const cnmsPath = path.resolve(root, 'protected', 'videos', 'CNMS.mp4');
    const opsPath = path.resolve(root, 'protected', 'videos', 'operations-advisor.mp4');

    expect(fs.existsSync(cnmsPath)).toBe(true);
    expect(fs.existsSync(opsPath)).toBe(true);

    const cnmsStat = fs.statSync(cnmsPath);
    const opsStat = fs.statSync(opsPath);

    expect(cnmsStat.size).toBe(35690361);
    expect(opsStat.size).toBe(39733894);

    // Verify all 6 screenshots exist and have PNG magic header
    for (const imgName of ALLOWED_PROTECTED_IMAGES) {
      const imgPath = path.resolve(root, 'protected', 'img', imgName);
      expect(fs.existsSync(imgPath)).toBe(true);
      const stat = fs.statSync(imgPath);
      expect(stat.size).toBeGreaterThan(10000);

      const fd = fs.openSync(imgPath, 'r');
      const header = Buffer.alloc(4);
      fs.readSync(fd, header, 0, 4, 0);
      fs.closeSync(fd);

      // PNG magic bytes: 0x89 0x50 0x4E 0x47 (.PNG)
      expect(header[0]).toBe(0x89);
      expect(header[1]).toBe(0x50);
      expect(header[2]).toBe(0x4e);
      expect(header[3]).toBe(0x47);
    }
  });

  it('completes initial session handshake and extracts signed HttpOnly cookie', async () => {
    const res = await fetch(`${baseUrl}/api/session`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.active).toBe(true);
    expect(data.remainingSeconds).toBe(3600);
    expect(data.sessionId).toBeDefined();

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain(SESSION_COOKIE_NAME);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('simulates browser video element initial load with Range: bytes=0- capped to 2 MB', async () => {
    // 1. Acquire active session cookie
    const sessionRes = await fetch(`${baseUrl}/api/session`);
    const cookieHeader = sessionRes.headers.get('set-cookie')?.split(';')[0] || '';

    // 2. Browser HTML5 video tag requests initial byte range
    const videoRes = await fetch(`${baseUrl}/api/video-cnms`, {
      headers: {
        Cookie: cookieHeader,
        Range: 'bytes=0-',
      },
    });

    expect(videoRes.status).toBe(206); // Partial Content
    expect(videoRes.headers.get('content-range')).toBe('bytes 0-2097151/35690361');
    expect(videoRes.headers.get('accept-ranges')).toBe('bytes');
    expect(videoRes.headers.get('content-type')).toBe('video/mp4');
    expect(videoRes.headers.get('content-length')).toBe('2097152'); // Exactly 2 MB

    const buffer = Buffer.from(await videoRes.arrayBuffer());
    expect(buffer.length).toBe(2097152);

    // Verify MP4 ftyp box signature in first 16 bytes
    const ftyp = buffer.subarray(4, 8).toString('ascii');
    expect(ftyp).toBe('ftyp');
  });

  it('simulates browser subsequent Range request for next 2 MB chunk (bytes=2097152-)', async () => {
    const sessionRes = await fetch(`${baseUrl}/api/session`);
    const cookieHeader = sessionRes.headers.get('set-cookie')?.split(';')[0] || '';

    const videoRes = await fetch(`${baseUrl}/api/video-cnms`, {
      headers: {
        Cookie: cookieHeader,
        Range: 'bytes=2097152-',
      },
    });

    expect(videoRes.status).toBe(206);
    expect(videoRes.headers.get('content-range')).toBe('bytes 2097152-4194303/35690361');
    expect(videoRes.headers.get('content-length')).toBe('2097152');

    const buffer = Buffer.from(await videoRes.arrayBuffer());
    expect(buffer.length).toBe(2097152);
  });

  it('simulates browser seeking into the middle of the stream (Range: bytes=15000000-)', async () => {
    const sessionRes = await fetch(`${baseUrl}/api/session`);
    const cookieHeader = sessionRes.headers.get('set-cookie')?.split(';')[0] || '';

    const videoRes = await fetch(`${baseUrl}/api/video-cnms`, {
      headers: {
        Cookie: cookieHeader,
        Range: 'bytes=15000000-',
      },
    });

    expect(videoRes.status).toBe(206);
    expect(videoRes.headers.get('content-range')).toBe('bytes 15000000-17097151/35690361');
    expect(videoRes.headers.get('content-length')).toBe('2097152');

    const buffer = Buffer.from(await videoRes.arrayBuffer());
    expect(buffer.length).toBe(2097152);
  });

  it('simulates Operations Advisor video Range requests and seeking', async () => {
    const sessionRes = await fetch(`${baseUrl}/api/session`);
    const cookieHeader = sessionRes.headers.get('set-cookie')?.split(';')[0] || '';

    const videoRes = await fetch(`${baseUrl}/api/video-operations-advisor`, {
      headers: {
        Cookie: cookieHeader,
        Range: 'bytes=0-',
      },
    });

    expect(videoRes.status).toBe(206);
    expect(videoRes.headers.get('content-range')).toBe('bytes 0-2097151/39733894');
    expect(videoRes.headers.get('content-length')).toBe('2097152');
  });

  it('serves protected screenshots via /api/image and /img/ rewrite during active session', async () => {
    const sessionRes = await fetch(`${baseUrl}/api/session`);
    const cookieHeader = sessionRes.headers.get('set-cookie')?.split(';')[0] || '';

    const imgRes = await fetch(`${baseUrl}/api/image?name=Earth%20station%20map.png`, {
      headers: { Cookie: cookieHeader },
    });

    expect(imgRes.status).toBe(200);
    expect(imgRes.headers.get('content-type')).toBe('image/png');
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    expect(buffer.length).toBe(147915);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
  });

  it('blocks direct unauthenticated requests to /videos/* and /img/* with 403 Forbidden', async () => {
    // Unauthenticated attempt to download CNMS video
    const cnmsRes = await fetch(`${baseUrl}/videos/CNMS.mp4`);
    expect(cnmsRes.status).toBe(403);
    const cnmsJson = await cnmsRes.json();
    expect(cnmsJson.error).toBe('SESSION_UNAUTHORIZED');

    // Unauthenticated attempt to download Operations Advisor video
    const opsRes = await fetch(`${baseUrl}/videos/operations-advisor.mp4`);
    expect(opsRes.status).toBe(403);
    const opsJson = await opsRes.json();
    expect(opsJson.error).toBe('SESSION_UNAUTHORIZED');

    // Unauthenticated attempt to view proprietary screenshot
    const imgRes = await fetch(`${baseUrl}/img/Dashboard.png`);
    expect(imgRes.status).toBe(403);
    const imgJson = await imgRes.json();
    expect(imgJson.error).toBe('SESSION_UNAUTHORIZED');
  });

  it('enforces expiry even when browser has buffered previous chunks: blocks subsequent chunks and seek', async () => {
    // 1. Create a session with a short 200ms lifetime
    const shortPayload = {
      sid: crypto.randomUUID(),
      iat: Date.now(),
      exp: Date.now() + 200, // 200ms window
    };
    const shortToken = signSessionPayload(shortPayload, testSecret);
    const cookie = `${SESSION_COOKIE_NAME}=${shortToken}`;

    // 2. Initial Range request succeeds while session is valid (browser buffers Chunk 0)
    const initialRes = await fetch(`${baseUrl}/api/video-cnms`, {
      headers: {
        Cookie: cookie,
        Range: 'bytes=0-1023',
      },
    });
    expect(initialRes.status).toBe(206);
    expect(initialRes.headers.get('content-length')).toBe('1024');

    // 3. Wait 250ms for session to expire on server
    await new Promise((resolve) => setTimeout(resolve, 250));

    // 4. Browser attempts to fetch next chunk (e.g. continuing buffer)
    const nextChunkRes = await fetch(`${baseUrl}/api/video-cnms`, {
      headers: {
        Cookie: cookie,
        Range: 'bytes=1024-2047',
      },
    });
    expect(nextChunkRes.status).toBe(403);
    const nextJson = await nextChunkRes.json();
    expect(nextJson.error).toBe('SESSION_EXPIRED');

    // 5. User seeks to a new timestamp
    const seekRes = await fetch(`${baseUrl}/api/video-cnms`, {
      headers: {
        Cookie: cookie,
        Range: 'bytes=5000000-5001023',
      },
    });
    expect(seekRes.status).toBe(403);
    const seekJson = await seekRes.json();
    expect(seekJson.error).toBe('SESSION_EXPIRED');

    // 6. Screenshot request also blocked after expiry
    const imgRes = await fetch(`${baseUrl}/api/image?name=Earth%20station%20map.png`, {
      headers: { Cookie: cookie },
    });
    expect(imgRes.status).toBe(403);
  });
});
