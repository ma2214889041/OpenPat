import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

      // Clear stale webchat paired devices so new browsers can connect
      server.middlewares.use('/api/gateway-clear-device', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') { res.end('{}'); return; }
        const pairedPath = join(homedir(), '.openclaw', 'devices', 'paired.json');
        try {
          if (!existsSync(pairedPath)) { res.end('{"ok":true}'); return; }
          const paired = JSON.parse(readFileSync(pairedPath, 'utf8'));
          let changed = false;
          for (const [id, dev] of Object.entries(paired)) {
            if (dev.clientMode === 'webchat' || dev.clientId === 'openclaw-control-ui') {
              delete paired[id];
              changed = true;
            }
          }
          if (changed) {
            writeFileSync(pairedPath, JSON.stringify(paired, null, 2) + '\n', 'utf8');
          }
          res.end(JSON.stringify({ ok: true, cleared: changed }));
        } catch (err) {
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
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
