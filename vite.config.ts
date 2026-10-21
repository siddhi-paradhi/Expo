import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import sessionHandler from './api/session';
import videoCnmsHandler from './api/video-cnms';
import videoOpsHandler from './api/video-operations-advisor';
import imageHandler from './api/image';

/**
 * Local development and preview server middleware.
 * Ensures the exact same session verification, Range streaming, and image gating logic
 * is executed during 'npm run dev' and 'npm run preview' as in Vercel production.
 */
function visitorSessionDevPlugin(): Plugin {
  const mountMiddleware = (server: any) => {
    const env = loadEnv(server.config.mode, process.cwd(), '');
    if (env.SESSION_SECRET && !process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = env.SESSION_SECRET;
    }

    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url ? req.url.split('?')[0] : '';

      if (url === '/api/session') {
        return sessionHandler(req, res);
      }
      if (url === '/api/video-cnms' || url === '/videos/CNMS.mp4') {
        return videoCnmsHandler(req, res);
      }
      if (url === '/api/video-operations-advisor' || url === '/videos/operations-advisor.mp4') {
        return videoOpsHandler(req, res);
      }
      if (url === '/api/image' || url.startsWith('/img/')) {
        if (url.startsWith('/img/')) {
          const rawName = url.replace(/^\/img\//, '');
          req.url = `/api/image?name=${rawName}`;
        }
        return imageHandler(req, res);
      }

      next();
    });
  };

  return {
    name: 'visitor-session-dev-server',
    configureServer(server) {
      mountMiddleware(server);
    },
    configurePreviewServer(server) {
      mountMiddleware(server);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), visitorSessionDevPlugin()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['animejs', 'lenis'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
    host: true,
    watch: {
      ignored: ['**/video/**', '**/videos/**', '**/*.mp4', '**/protected/**'],
    },
  },
});
