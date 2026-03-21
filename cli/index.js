#!/usr/bin/env node
/**
 * npx openclaw-pat [command]
 *
 * Commands:
 *   (default)    Auto-detect OpenClaw, open browser, bridge config
 *   setup        Interactive setup — generate token + save config
 *   status       Show connection status
 *   test         Send a test event
 *   disconnect   Remove openpat.json config
 */
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { createInterface } from 'readline';

const PORT = process.env.PORT || 4242;
const APP_URL = 'https://open-pat.com';
const ENDPOINT = 'https://wajtjbjdbenlrsnzpeng.supabase.co/functions/v1/event';
const CFG_PATH = join(homedir(), '.openclaw', 'openpat.json');

// ─── Helpers ────────────────────────────────────────────────

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';
  import('child_process').then(({ exec }) => {
    exec(`${cmd} ${url}`, () => {});
  });
}

function readConfig() {
  if (process.env.OPENPAT_TOKEN) {
    return { endpoint: ENDPOINT, token: process.env.OPENPAT_TOKEN, source: '$OPENPAT_TOKEN' };
  }
  if (existsSync(CFG_PATH)) {
    try {
      const cfg = JSON.parse(readFileSync(CFG_PATH, 'utf8'));
      return { ...cfg, source: CFG_PATH };
    } catch { /* skip */ }
  }
  return null;
}

async function sendEvent(token, type) {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  });
  return { ok: resp.ok, status: resp.status, body: await resp.text() };
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

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
      const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
      if (!cfg.gateway) continue;
      const ui = cfg.gateway.controlUi = cfg.gateway.controlUi || {};
      const origins = ui.allowedOrigins = ui.allowedOrigins || [];
      let changed = false;
      if (!origins.includes(APP_URL)) { origins.push(APP_URL); changed = true; }
      if (!origins.some(o => o === 'http://localhost:*')) { origins.push('http://localhost:*'); changed = true; }
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
    if (!existsSync(path)) continue;
    try {
      const cfg = JSON.parse(readFileSync(path, 'utf8'));
      const token = cfg.gateway?.auth?.token || cfg.gateway?.token || cfg.gateway_token || cfg.token;
      const host = cfg.gateway?.host || cfg.gateway?.hostname || 'localhost';
      const port = cfg.gateway?.port || 18789;
      const tls  = cfg.gateway?.tls === true || cfg.gateway?.ssl === true;
      const url  = cfg.gateway_url || cfg.gateway?.url || `${tls ? 'wss' : 'ws'}://${host}:${port}`;
      if (token) return { token, url, path };
    } catch { /* skip */ }
  }
  return null;
}

// ─── Commands ────────────────────────────────────────────────

async function cmdSetup() {
  console.log('');
  console.log('  🦞 OpenPat Setup');
  console.log('');

  const existing = readConfig();
  if (existing) {
    console.log(`  ✅ Already configured via ${existing.source}`);
    console.log('  Run "npx openclaw-pat test" to verify, or "npx openclaw-pat disconnect" to remove.');
    return;
  }

  console.log('  Step 1: Get your token');
  console.log('  → Opening https://open-pat.com ...');
  console.log('  → Sign in → ⚙️ Settings → Agent Skill → Generate Token');
  console.log('');
  openBrowser(`${APP_URL}/app`);

  const token = await ask('  Paste your token here: ');
  if (!token) {
    console.log('  ❌ No token. Setup cancelled.');
    process.exit(1);
  }

  // Save config
  mkdirSync(join(homedir(), '.openclaw'), { recursive: true });
  writeFileSync(CFG_PATH, JSON.stringify({ endpoint: ENDPOINT, token }, null, 2) + '\n', 'utf8');
  console.log(`  ✅ Config saved to ${CFG_PATH}`);

  // Verify
  console.log('  🧪 Verifying...');
  try {
    const { ok } = await sendEvent(token, 'idle');
    if (ok) {
      console.log('  ✅ Connected! Your companion is live at https://open-pat.com/app');
    } else {
      console.log('  ⚠️  Token may be wrong. Check at https://open-pat.com/app');
    }
  } catch {
    console.log('  ⚠️  Could not verify (network issue). Check later.');
  }
  console.log('');
}

function cmdStatus() {
  console.log('');
  console.log('  🦞 OpenPat Status');
  console.log('');
  const cfg = readConfig();
  if (cfg) {
    console.log(`  ✅ Config: ${cfg.source}`);
    console.log(`  🔑 Token: ${cfg.token.substring(0, 8)}...`);
    console.log(`  🔗 Endpoint: ${cfg.endpoint}`);
  } else {
    console.log('  ❌ Not configured.');
    console.log('  Run "npx openclaw-pat setup" to connect.');
  }
  console.log(`  🌐 Dashboard: ${APP_URL}/app`);
  console.log('');
}

async function cmdTest() {
  const cfg = readConfig();
  if (!cfg) {
    console.log('  ❌ Not configured. Run "npx openclaw-pat setup" first.');
    process.exit(1);
  }
  console.log('  🧪 Sending test event...');
  try {
    const { ok, status } = await sendEvent(cfg.token, 'idle');
    if (ok) {
      console.log(`  ✅ Success! Check your companion at ${APP_URL}/app`);
    } else {
      console.log(`  ❌ Failed (HTTP ${status}). Check your token.`);
    }
  } catch (err) {
    console.log(`  ❌ Network error: ${err.message}`);
  }
}

function cmdDisconnect() {
  if (existsSync(CFG_PATH)) {
    unlinkSync(CFG_PATH);
    console.log('  ✅ Config removed. OpenPat disconnected.');
  } else {
    console.log('  ℹ️  No config found — already disconnected.');
  }
  if (process.env.OPENPAT_TOKEN) {
    console.log('  ⚠️  $OPENPAT_TOKEN is still set. Run: unset OPENPAT_TOKEN');
  }
}

// ─── Bridge server (default command) ─────────────────────────

function cmdServe() {
  const originResult = ensureOriginAllowed();
  if (originResult === 'patched') {
    console.log('  ℹ️   Gateway config updated — restart gateway: openclaw gateway restart');
  }

  const cfg = detectOpenClawConfig();

  const server = createServer((req, res) => {
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

// ─── Route command ───────────────────────────────────────────

const cmd = process.argv[2];

switch (cmd) {
  case 'setup':      await cmdSetup(); break;
  case 'status':     cmdStatus(); break;
  case 'test':       await cmdTest(); break;
  case 'disconnect': await cmdDisconnect(); break;
  case 'help':
  case '--help':
  case '-h':
    console.log('');
    console.log('  🦞 OpenPat CLI');
    console.log('');
    console.log('  Usage: npx openclaw-pat [command]');
    console.log('');
    console.log('  Commands:');
    console.log('    (none)       Auto-detect OpenClaw gateway, open browser');
    console.log('    setup        Interactive setup — generate token + save config');
    console.log('    status       Show connection status');
    console.log('    test         Send a test event to verify connection');
    console.log('    disconnect   Remove config and stop sending events');
    console.log('');
    break;
  default:           cmdServe(); break;
}
