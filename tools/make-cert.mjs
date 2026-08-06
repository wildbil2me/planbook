/* make-cert.mjs — mint a local certificate authority and a server certificate, so the app can
 * be served to the iPad over real HTTPS.
 *
 * Run:  node tools/make-cert.mjs            (detects this machine's LAN address)
 *       node tools/make-cert.mjs 192.168.50.142   (or name it, when detection picks wrong)
 * Out:  certs/, which is gitignored and must stay that way — it holds two private keys.
 *
 * WHY THIS EXISTS. A service worker needs a secure context. `localhost` is exempt from that
 * rule; a LAN address is not. So `http://192.168.50.142:8000` — the URL TESTING.md records from
 * the WO-1.2 sitting — cannot register `sw.js` at all, and the offline half of WO-1.3's
 * acceptance cannot be tested on it. Worse than failing: Safari's own HTTP cache will happily
 * re-serve the pages after the Wi-Fi goes off, which reads exactly like a passing offline test
 * and is not one. The tick would be wrong and nobody would know until August.
 *
 * Three ways to a secure context on a tablet that is not this machine:
 *
 *   - A tunnel (ngrok and friends). Works, and puts the roster on someone else's server. The
 *     whole architecture is "no vendor server ever touches student data" — see CLAUDE.md. Not
 *     for the sake of a test.
 *   - A self-signed certificate, click through the warning. Safari lets you past the
 *     interstitial to *read* a page, and still refuses to register a service worker behind an
 *     untrusted certificate. There is no click-through for that. Silent, and looks like the
 *     app is broken.
 *   - A local CA the iPad actually trusts. That is this file. One root installed on the tablet
 *     once, and every certificate signed under it works from then on.
 *
 * NOT COMMITTED, unlike everything else tools/ writes. `certs/` holds private keys. The rule in
 * tools/README.md about committing generated output is about assets the app serves; a key is
 * local machine state. Regenerate it per machine and never let it into a commit.
 *
 * WHAT IOS REQUIRES, all of which fails closed and none of which says why:
 *
 *   - `subjectAltName`, always. iOS ignores Common Name entirely — has since iOS 13. And for
 *     an address-based URL the entry must be `IP:`, not `DNS:`. A certificate whose only
 *     identity is `CN=192.168.50.142` is rejected as having no name at all.
 *   - 397 days or fewer on the leaf. The limit is 398; 397 leaves room for clock skew. A
 *     ten-year certificate is refused outright, which reads as a broken certificate rather
 *     than an expired-too-late one.
 *   - `extendedKeyUsage=serverAuth`, and EC P-256 or RSA-2048 upward, signed SHA-256 upward.
 *   - The root has to be *installed* and then *trusted*, which are two different screens and
 *     the second one is the step everybody misses. Installing the profile leaves the root in a
 *     disabled state. Settings → General → About → Certificate Trust Settings is where it gets
 *     switched on, and until it is, nothing changes. serve-https.mjs prints both steps.
 *
 * The root is a full CA rather than a lone self-signed server certificate so that a new LAN
 * address — a summer DHCP lease, a different network at school — costs a re-run of this script
 * and not another trip through the iPad's settings.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'certs');

/* Leaf validity. iOS caps this at 398 days; see the header. */
const LEAF_DAYS = 397;
const CA_DAYS = 3650;

/* ── the address the certificate has to name ── */

/* Every non-internal IPv4 the machine has, in the order Node reports them. Wi-Fi is what the
   iPad can reach, and it is rarely the only entry — a docked laptop with an Ethernet adapter,
   WSL, Hyper-V and a VPN each add one, and half of them are unroutable from the tablet. So all
   of them go in the SAN list and the caller can override, rather than this script guessing and
   being confidently wrong. */
function localAddresses() {
  const out = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) out.push({ name, address: a.address });
    }
  }
  return out;
}

function isIPv4(s) {
  const parts = s.split('.');
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255);
}

const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const detected = localAddresses();

for (const r of requested) {
  if (!isIPv4(r)) {
    console.error('Not an IPv4 address: ' + r);
    console.error('Usage: node tools/make-cert.mjs [192.168.x.x ...]');
    process.exit(1);
  }
}

const ips = requested.length ? requested : detected.map((d) => d.address);
if (!ips.length) {
  console.error('No non-internal IPv4 address found, and none given on the command line.');
  console.error('Connect to the same Wi-Fi as the iPad, or pass the address explicitly.');
  process.exit(1);
}

/* 127.0.0.1 and localhost so the same certificate serves this laptop's own browser, and the
   hostname because a school network with working mDNS can reach `wildbil-laptop.local`. */
const hostname = os.hostname();
const sans = [
  ...ips.map((ip) => 'IP:' + ip),
  'IP:127.0.0.1',
  'DNS:localhost',
  'DNS:' + hostname,
  'DNS:' + hostname + '.local',
];

/* ── openssl ── */

/* A system binary, not a dependency — the same latitude verify-shell.mjs takes with headless
   Edge. Node's own crypto can make a keypair but cannot sign an X.509 certificate, so there is
   no standard-library route to this. */
function openssl(args, opts = {}) {
  try {
    return execFileSync('openssl', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('openssl is not on PATH.');
      console.error('Git for Windows ships one at C:\\Program Files\\Git\\usr\\bin\\openssl.exe —');
      console.error('add that directory to PATH, or run this from Git Bash.');
      process.exit(1);
    }
    console.error('openssl failed: ' + args.join(' '));
    console.error(String(err.stderr || err.message).trim());
    process.exit(1);
  }
}

const p = (f) => path.join(OUT, f);

const CA_KEY = p('ca-key.pem');
const CA_CERT = p('ca-cert.pem');
const CA_PUBLIC = p('planbook-local-ca.crt');  /* what the iPad downloads */
const SRV_KEY = p('server-key.pem');
const SRV_CERT = p('server-cert.pem');

await fs.mkdir(OUT, { recursive: true });

/* ── the root ── */

/* Reused if it is already here. Regenerating it would invalidate the root already installed on
   the tablet, and re-installing that is the one genuinely annoying step in this whole setup.
   Delete certs/ by hand if you really want a new root. */
let reusedCa = false;
try {
  await fs.access(CA_KEY);
  await fs.access(CA_CERT);
  reusedCa = true;
} catch {
  /* not there yet — mint it */
}

if (!reusedCa) {
  openssl([
    'req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes',
    '-keyout', CA_KEY, '-out', CA_CERT,
    '-days', String(CA_DAYS), '-sha256',
    '-subj', '/CN=Planbook Local Dev CA/O=Planbook',
    '-addext', 'basicConstraints=critical,CA:TRUE,pathlen:0',
    '-addext', 'keyUsage=critical,keyCertSign,cRLSign',
    '-addext', 'subjectKeyIdentifier=hash',
  ]);
}

/* Same bytes, named so Safari offers to install it. iOS decides what a download is by MIME
   type and extension; `.pem` gets shown as text, `.crt` starts the profile flow. */
await fs.copyFile(CA_CERT, CA_PUBLIC);

/* ── the server certificate ── */

/* -addext on `req` puts extensions in the CSR, and `x509 -req` drops CSR extensions unless
   told to copy them. Writing them into an ext file for the signing step instead is the version
   that does not silently produce a certificate with no SAN. */
const EXT = p('leaf.ext');
const CSR = p('server.csr');

await fs.writeFile(EXT, [
  'basicConstraints=critical,CA:FALSE',
  /* digitalSignature only. keyEncipherment is meaningless for an EC key — ECDHE signs, it does
     not encrypt — and some validators object to it being asserted. */
  'keyUsage=critical,digitalSignature',
  'extendedKeyUsage=serverAuth',
  'subjectAltName=' + sans.join(','),
  'subjectKeyIdentifier=hash',
  'authorityKeyIdentifier=keyid,issuer',
  '',
].join('\n'));

openssl([
  'req', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes',
  '-keyout', SRV_KEY, '-out', CSR,
  '-subj', '/CN=' + ips[0] + '/O=Planbook',
]);

openssl([
  'x509', '-req', '-in', CSR,
  '-CA', CA_CERT, '-CAkey', CA_KEY, '-CAcreateserial',
  '-out', SRV_CERT,
  '-days', String(LEAF_DAYS), '-sha256',
  '-extfile', EXT,
]);

/* Scaffolding, not output. Leaving them behind invites someone to wonder whether they matter. */
await fs.rm(CSR, { force: true });
await fs.rm(EXT, { force: true });

/* ── report ── */

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');

console.log((reusedCa ? 'Reused' : 'Created') + ' root CA   ' + rel(CA_CERT));
console.log('Signed server cert ' + rel(SRV_CERT) + '  (' + LEAF_DAYS + ' days)');
console.log('');
console.log('Names on the certificate:');
for (const s of sans) {
  const iface = detected.find((d) => 'IP:' + d.address === s);
  console.log('  ' + s + (iface ? '   ← ' + iface.name : ''));
}
console.log('');
console.log('certs/ is gitignored and holds two private keys. Keep it that way.');
console.log('');
console.log('Next:  node tools/serve-https.mjs');
console.log('');
console.log('To trust the root in this machine\'s own browsers (optional, no admin rights needed):');
console.log('  certutil -addstore -user Root "' + CA_PUBLIC + '"');
