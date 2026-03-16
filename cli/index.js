#!/usr/bin/env node
/**
 * npx openpat
 * Starts a local HTTP server serving the OpenPat UI,
 * auto-detects OpenClaw config, and opens the browser.
 */
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PORT = process.env.PORT || 4242;
const DIST_DIR = join(__dirname, '..', 'dist');

// ─── Auto-detect OpenClaw Gateway config ─────────────────────
function detectOpenClawConfig() {
  const candidates = [
    join(homedir(), '.openclaw', 'openclaw.json'),
    join(homedir(), '.openclaw', 'config.json'),
    join(homedir(), '.config', 'openclaw', 'config.json'),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      try {
        const cfg = JSON.parse(readFileSync(path, 'utf8'));
        const token = cfg.gateway_token || cfg.token || cfg.api_token;
        const url = cfg.gateway_url || cfg.websocket_url || 'ws://localhost:18789';
        if (token) {
          return { token, url, path };
        }
      } catch { /* skip */ }
    }
  }
  return null;
}

// ─── MIME types ───────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff2':'font/woff2',
};

// ─── HTTP server ──────────────────────────────────────────────
function serve() {
  const cfg = detectOpenClawConfig();

  const server = createServer((req, res) => {
    // Inject auto-detected config
    if (req.url === '/lobster-config.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cfg
        ? { wsUrl: cfg.url, token: cfg.token, autoDetected: true, configPath: cfg.path }
        : { autoDetected: false }
      ));
      return;
    }

    // Serve static files from dist/
    let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

    // SPA fallback — serve index.html for any non-file route
    if (!existsSync(filePath) || !extname(filePath)) {
      filePath = join(DIST_DIR, 'index.html');
    }

    try {
      const content = readFileSync(filePath);
      const mime = MIME[extname(filePath)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log('');
    console.log('  🦞  OpenPat');
    console.log('');
    if (cfg) {
      console.log(`  ✅  Auto-detected OpenClaw config: ${cfg.path}`);
      console.log(`  🔗  Gateway: ${cfg.url}`);
    } else {
      console.log('  ⚠️   Could not find OpenClaw config (~/.openclaw/openclaw.json)');
      console.log('  👉  You can enter the Gateway URL and Token manually in the UI');
    }
    console.log('');
    console.log(`  🌐  Open: ${url}`);
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('');

    openBrowser(url);
  });
}

function openBrowser(url) {
  const { platform } = process;
  const cmd = platform === 'darwin' ? 'open'
    : platform === 'win32' ? 'start'
    : 'xdg-open';

  import('child_process').then(({ exec }) => {
    exec(`${cmd} ${url}`, (err) => {
      if (err) console.log(`  → Open manually: ${url}`);
    });
  });
}

serve();
