import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/** Vite plugin: serve OpenClaw gateway config at /api/gateway-config */
function openclawAutoDetect() {
  return {
    name: 'openclaw-auto-detect',
    configureServer(server) {
      server.middlewares.use('/api/gateway-config', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        const candidates = [
          join(homedir(), '.openclaw', 'openclaw.json'),
          join(homedir(), '.openclaw', 'config.json'),
          join(homedir(), '.config', 'openclaw', 'config.json'),
        ];
        for (const cfgPath of candidates) {
          try {
            const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
            const token = cfg.gateway?.auth?.token || cfg.gateway?.token || cfg.token;
            const host = cfg.gateway?.host || cfg.gateway?.hostname || '127.0.0.1';
            const port = cfg.gateway?.port || 18789;
            const tls = cfg.gateway?.tls === true || cfg.gateway?.ssl === true;
            const wsUrl = cfg.gateway?.url || `${tls ? 'wss' : 'ws'}://${host}:${port}`;
            if (token) {
              res.end(JSON.stringify({ wsUrl, token, autoDetected: true }));
              return;
            }
          } catch { /* try next */ }
        }
        res.end(JSON.stringify({ autoDetected: false }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), openclawAutoDetect()],
  server: {
    // SPA fallback in dev
    historyApiFallback: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('gifenc')) return 'gifenc';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
