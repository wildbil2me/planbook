/* serve-https.mjs — serve the repo over HTTPS on the LAN, so an iPad can install the PWA and
 * the offline checks mean something.
 *
 * Run:  node tools/serve-https.mjs          (after node tools/make-cert.mjs)
 *       node tools/serve-https.mjs --port 8443
 * Stop: Ctrl-C.
 *
 * Serves the repo root as it sits on disk. There is no build, so there is nothing to watch and
 * nothing to rebuild — edit a file, pull to refresh.
 *
 * WHY NOT `python -m http.server`, which is what TESTING.md:84 records. A service worker needs
 * a secure context, and a LAN address is not one. The registration silently rejects, the
 * install banner never goes away, and the offline walk passes anyway off Safari's own HTTP
 * cache. See the header of make-cert.mjs; that is the whole reason both of these files exist.
 *
 * TWO LISTENERS, deliberately:
 *
 *   - **HTTPS, port 8443** — the app. Everything under the repo root.
 *   - **HTTP, port 8080** — the setup page and the CA download, and *nothing else*. It exists
 *     for the ten minutes before the iPad trusts the root, when it cannot reach the HTTPS
 *     listener at all. It will not serve `index.html` or anything under `src/` at any price:
 *     an HTTP copy of the app is precisely the trap this script exists to close, and a plain
 *     port sitting next to a secure one is how someone tired ends up testing the wrong one.
 *     The refusal says which URL to use instead.
 *
 * NO-STORE ON EVERYTHING. The offline half of WO-1.3 asks whether the *service worker* cache
 * can serve the app with the network off. Safari's HTTP cache will answer yes on its own
 * behalf if allowed to, and the two are indistinguishable from the tablet. `no-store` takes it
 * out of the running, leaving only the thing under test. It does not touch the precache —
 * Cache Storage is explicit and ignores Cache-Control — so `sw.js` still fills normally.
 *
 * THE FIREWALL, which will happen on first run and does not look like a firewall. Windows
 * Defender prompts to allow Node through on first bind; if the prompt is dismissed, or if the
 * network is typed as Public, the port is open on this machine and invisible from the iPad.
 * The symptom is a spinner and then "Safari cannot open the page" — identical to a wrong
 * address. Check by loading the HTTPS URL in this laptop's browser first: if it works here and
 * not there, it is the firewall or the network profile, not the server.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CERTS = path.join(ROOT, 'certs');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const HTTPS_PORT = Number(arg('--port', 8443));
const HTTP_PORT = Number(arg('--http-port', 8080));

/* ── certificate ── */

let key, cert, caPem;
try {
  key = await fsp.readFile(path.join(CERTS, 'server-key.pem'));
  cert = await fsp.readFile(path.join(CERTS, 'server-cert.pem'));
  caPem = await fsp.readFile(path.join(CERTS, 'planbook-local-ca.crt'));
} catch {
  console.error('No certificate in certs/.');
  console.error('Run:  node tools/make-cert.mjs');
  process.exit(1);
}

const x509 = new X509Certificate(cert);

/* The addresses the certificate actually names, versus the ones this machine actually has. A
   DHCP lease that moved over a school holiday leaves a certificate that is valid, unexpired,
   properly signed, and for the wrong host — and Safari reports that the same way it reports
   every other certificate problem, which is by refusing to register the service worker and
   saying nothing useful. Worth the twenty lines to catch here instead of on the tablet. */
const certIPs = new Set(
  String(x509.subjectAltName || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('IP Address:'))
    .map((s) => s.slice('IP Address:'.length).trim()),
);

const localIPs = Object.values(os.networkInterfaces())
  .flat()
  .filter((a) => a && a.family === 'IPv4' && !a.internal)
  .map((a) => a.address);

const usable = localIPs.filter((ip) => certIPs.has(ip));
const drifted = localIPs.filter((ip) => !certIPs.has(ip));

const daysLeft = Math.floor((Date.parse(x509.validTo) - Date.now()) / 86400000);

/* ── static file serving, HTTPS ── */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  /* Not application/json. Safari has been picky about the manifest type, and a manifest served
     as the wrong type is ignored without an error anywhere. */
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

function resolveInRoot(urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  const full = path.resolve(ROOT, '.' + path.posix.normalize(rel));
  /* Containment check, not a string prefix on ROOT alone — `c:\dev\planbook-secrets` starts
     with `c:\dev\planbook`. */
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}

const appServer = https.createServer({ key, cert }, async (req, res) => {
  const send = (code, body, type) => {
    res.writeHead(code, {
      'Content-Type': type || 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed\n');

  let file = resolveInRoot(req.url);
  if (!file) return send(400, 'Bad path\n');

  try {
    let stat = await fsp.stat(file);
    if (stat.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = await fsp.stat(file);
    }

    /* No SPA fallback. A 404 during the offline walk is a finding, not a nuisance — it is how
       a screen that quietly depends on the network announces itself. */
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Content-Length': stat.size,
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch {
    send(404, 'Not found: ' + req.url + '\n');
  }
});

/* ── setup page and CA download, plain HTTP ── */

const httpsUrl = (host) => 'https://' + host + (HTTPS_PORT === 443 ? '' : ':' + HTTPS_PORT) + '/';
const primary = usable[0] || localIPs[0] || 'localhost';

const setupPage = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planbook — iPad setup</title>
<style>
  body { font: 17px/1.55 -apple-system, system-ui, sans-serif; color: #1a1a1a;
         background: #f0f2f5; margin: 0; padding: 24px 20px 64px; }
  .card { max-width: 34rem; margin: 0 auto; background: #fff; border-radius: 12px;
          padding: 20px 22px; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  h1 { font-size: 22px; margin: 0 0 4px; }
  p.sub { color: #5a6472; margin: 0 0 20px; }
  ol { padding-left: 22px; margin: 0; }
  li { margin-bottom: 18px; }
  a.btn { display: inline-block; background: #1a3c5e; color: #fff; text-decoration: none;
          padding: 13px 20px; border-radius: 8px; min-height: 44px; box-sizing: border-box;
          font-weight: 600; }
  code { background: #eef1f5; padding: 2px 6px; border-radius: 4px; font-size: 15px;
         word-break: break-all; }
  .warn { background: #fdf3e3; border-left: 3px solid #d98c1f; padding: 10px 14px;
          border-radius: 0 6px 6px 0; margin-top: 20px; color: #5a4620; font-size: 15px; }
</style>
<div class="card">
  <h1>Planbook — iPad setup</h1>
  <p class="sub">One time per tablet. Then the app is reachable over HTTPS and installable.</p>
  <ol>
    <li>
      <a class="btn" href="/ca">Install the local certificate</a>
      <div style="margin-top:8px;color:#5a6472">Allow the download, then open
        <b>Settings → Profile Downloaded → Install</b>.</div>
    </li>
    <li>
      <b>Turn the trust on.</b> Settings → General → About → <b>Certificate Trust Settings</b>,
      and switch on <b>Planbook Local Dev CA</b>.
      <div style="margin-top:8px;color:#5a6472">Installing is not trusting. Skipping this is
        the step that makes everything after it fail.</div>
    </li>
    <li>
      <b>Open the app</b> at <code>${httpsUrl(primary)}</code> in Safari — no warning should
      appear. Then Share → Add to Home Screen.
    </li>
  </ol>
  <div class="warn">This plain-HTTP page serves only these two things. The app itself is
    HTTPS-only on purpose: a service worker will not register without it, and testing offline
    over HTTP gives a false pass.</div>
</div>
`;

const setupServer = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/ca' || url === '/ca.crt') {
    return res.writeHead(200, {
      /* This exact type is what makes iOS treat the response as a profile to install rather
         than a text file to display.
         And NO `Content-Disposition: attachment`, which was here first and was wrong: it hands
         the response to Safari's download manager, so the certificate lands in Files as a
         saved file and the install flow never starts. The user gets a download prompt and no
         profile. Serve it inline and iOS offers to install it directly. */
      'Content-Type': 'application/x-x509-ca-cert',
      'Cache-Control': 'no-store',
      'Content-Length': caPem.length,
    }).end(caPem);
  }

  if (url === '/' || url === '/index.html') {
    return res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }).end(setupPage);
  }

  /* Everything else, including any real app path. Not a redirect to HTTPS — a redirect would
     work, which means it would get used, and the point is that nothing about the app should
     ever be reachable on this port. */
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    .end('This port serves only the certificate setup page.\nThe app is at '
       + httpsUrl(primary) + '\n');
});

/* ── start ── */

function listen(server, port, label) {
  return new Promise((resolve) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(label + ' port ' + port + ' is already in use.');
        console.error('Something else is serving there — stop it, or pass a different port.');
      } else {
        console.error(label + ' failed to start: ' + err.message);
      }
      process.exit(1);
    });
    server.listen(port, '0.0.0.0', resolve);
  });
}

await listen(appServer, HTTPS_PORT, 'HTTPS');
await listen(setupServer, HTTP_PORT, 'HTTP');

const line = (s) => console.log(s);

line('');
line('  Planbook  ' + path.basename(ROOT) + '/  served over HTTPS');
line('');
if (usable.length) {
  for (const ip of usable) line('    app      ' + httpsUrl(ip));
} else {
  line('    app      ' + httpsUrl('localhost') + '   (localhost only — see the warning below)');
}
line('    setup    http://' + primary + ':' + HTTP_PORT + '/     ← open this on the iPad first');
line('');
line('  Certificate valid ' + daysLeft + ' more days.');

if (drifted.length) {
  line('');
  line('  ⚠  This machine has an address the certificate does not name:');
  for (const ip of drifted) line('       ' + ip);
  line('     If that is the one the iPad reaches, Safari will refuse it and the service');
  line('     worker will not register. Re-run:  node tools/make-cert.mjs');
}
if (!usable.length) {
  line('');
  line('  ⚠  None of this machine\'s LAN addresses are on the certificate. The iPad cannot');
  line('     use this server as it stands. Re-run:  node tools/make-cert.mjs');
}
if (daysLeft < 30) {
  line('');
  line('  ⚠  Certificate expires in ' + daysLeft + ' days. Re-run: node tools/make-cert.mjs');
}

line('');
line('  First run on this machine will prompt Windows Defender — allow Node on Private');
line('  networks. If the iPad cannot reach it but this laptop can, that prompt is why.');
line('');
line('  Ctrl-C to stop.');
line('');

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    appServer.close();
    setupServer.close();
    process.exit(0);
  });
}
