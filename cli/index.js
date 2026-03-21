#!/usr/bin/env node
/**
 * npx openpat
 * Auto-detects OpenClaw config, exposes it on localhost:4242,
 * then opens open-pat.com which reads it for auto-fill.
 */
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { writeFileSync } from 'fs';

const PORT = process.env.PORT || 4242;
const APP_URL = 'https://open-pat.com';

// ─── Ensure gateway allows our origin ────────────────────────
function ensureOriginAllowed() {
  const candidates = [
    join(homedir(), '.openclaw', 'openclaw.json'),
    join(homedir(), '.openclaw', 'config.json'),
    join(homedir(), '.config', 'openclaw', 'config.json'),
  ];

  for (const cfgPath of candidates) {
    if (!existsSync(cfgPath)) continue;
    try {
      const raw = readFileSync(cfgPath, 'utf8');
      const cfg = JSON.parse(raw);
      if (!cfg.gateway) continue;

      const ui = cfg.gateway.controlUi = cfg.gateway.controlUi || {};
      const origins = ui.allowedOrigins = ui.allowedOrigins || [];
      let changed = false;

      if (!origins.includes(APP_URL)) {
        origins.push(APP_URL);
        changed = true;
      }
      if (!origins.some(o => o === 'http://localhost:*')) {
        origins.push('http://localhost:*');
        changed = true;
      }

      if (changed) {
        writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
        console.log(`  ✅  Added ${APP_URL} to gateway.controlUi.allowedOrigins`);
        return 'patched';
      }
      return 'ok';
    } catch { /* skip */ }
  }
  return 'not-found';
}

// ─── Auto-detect OpenClaw Gateway config ─────────────────────
function detectOpenClawConfig() {
  const candidates = [
    join(homedir(), '.openclaw', 'openclaw.json'),
    join(homedir(), '.openclaw', 'config.json'),
    join(homedir(), '.config', 'openclaw', 'config.json'),
    join(homedir(), '.openclaw', 'gateway.json'),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const cfg = JSON.parse(readFileSync(path, 'utf8'));
        // Try multiple known token locations
        const token = cfg.gateway?.auth?.token
          || cfg.gateway?.token
          || cfg.gateway_token
          || cfg.token
          || cfg.api_token;
        // Resolve gateway URL from config
        const host = cfg.gateway?.host || cfg.gateway?.hostname || 'localhost';
        const port = cfg.gateway?.port || 18789;
        const tls  = cfg.gateway?.tls === true || cfg.gateway?.ssl === true;
        const url  = cfg.gateway_url
          || cfg.gateway?.url
          || cfg.websocket_url
          || `${tls ? 'wss' : 'ws'}://${host}:${port}`;
        if (token) return { token, url, path };
      } catch { /* skip */ }
    }
  }
  return null;
}

// ─── Tiny bridge server ───────────────────────────────────────
function serve() {
  // Ensure our origin is whitelisted before starting
  const originResult = ensureOriginAllowed();
  if (originResult === 'patched') {
    console.log('  ℹ️   Gateway config updated — restart gateway to apply: openclaw gateway restart');
  }

  const cfg = detectOpenClawConfig();

  const server = createServer((req, res) => {
    // CORS — allow open-pat.com and local dev origins
    const origin = req.headers.origin || '';
    const allowed = origin === APP_URL || /^http:\/\/localhost(:\d+)?$/.test(origin);
    res.setHeader('Access-Control-Allow-Origin', allowed ? origin : APP_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.url === '/lobster-config.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cfg
        ? { wsUrl: cfg.url, token: cfg.token, autoDetected: true }
        : { autoDetected: false }
      ));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, () => {
    console.log('');
    console.log('  🦞  OpenPat');
    console.log('');
    if (cfg) {
      console.log(`  ✅  OpenClaw detected: ${cfg.path}`);
      console.log(`  🔗  Gateway: ${cfg.url}`);
    } else {
      console.log('  ⚠️   OpenClaw config not found (~/.openclaw/openclaw.json)');
      console.log('  👉  Enter Gateway URL and Token manually on the site');
    }
    console.log('');
    console.log(`  🌐  Opening: ${APP_URL}`);
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('');

    openBrowser(APP_URL);
  });
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';

  import('child_process').then(({ exec }) => {
    exec(`${cmd} ${url}`, (err) => {
      if (err) console.log(`  → Open manually: ${url}`);
    });
  });
}

serve();
