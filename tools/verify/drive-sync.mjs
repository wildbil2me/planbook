/* drive-sync.mjs — the Drive transfer, and the conflict (WO-7.2)
 *
 * Written for the split this file's neighbours were moved into (WO-1.26): one `export async
 * function run(h)`, the body at column zero inside it, nothing here launching a browser, a server
 * or a document of its own. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes and names the ten traps; two of them are load-bearing below and are cited at the
 * lines they govern.
 *
 * ══════════ WHAT THIS SECTION CAN DO THAT THE ONE ABOVE IT CANNOT ══════════
 *
 * `drive-sign-in.mjs` opens by saying that the success path of the handshake is unreachable from a
 * headless browser and always will be, and that is still true: no Google account, no Google
 * session, no consent screen. THE SUCCESS PATH OF THE TRANSFER IS A DIFFERENT MATTER, and the
 * difference is what makes four of this work order's six acceptance lines closable at a desk. A
 * token can be handed to `src/auth.js` through the seam that module exports for exactly that
 * reason, and A PAGE'S NETWORK IS SOMETHING A PAGE CAN BE HANDED: this section stands up a small
 * Google Drive of its own in `window.fetch` for the length of its run and takes it away at the
 * foot.
 *
 * THAT IS WHY `src/drive-sync.js` EXPORTS NO SEAM OF ITS OWN, and the absence is the point. There
 * is no injectable transport in the shipped module, no test hook, and nothing that could be called
 * to point a gradebook's bytes at a different host. It did not need one — replacing `window.fetch`
 * from a harness costs the app nothing, where an exported "set the transport" would be a permanent
 * door in shipping code that exists so a test could avoid one line. `src/auth.js`'s
 * `acceptTokenResponse()` IS a seam because the arrival of a real Google token cannot be reached
 * any other way; a network can.
 *
 * WHAT STAYS OWED TO A HUMAN. Acceptance 1 and 2 are two devices — edit on A, sync, open on B; and
 * edit both offline, then sync both. Everything below models them with one device and a Drive this
 * file controls, which proves the state machine and does not prove two IndexedDBs. The runnable
 * form is two browser profiles at `https://localhost:8443`, which are two devices as far as
 * IndexedDB and the sync bookmark are concerned, and it is written out in `TESTING.md` § WO-7.2.
 * NOTHING IN THIS FILE CLOSES EITHER LINE.
 *
 * ══════════ TWO THINGS THAT MAKE THIS SECTION SLOW, ON PURPOSE ══════════
 *
 * Two checks below drive a sync with no usable token, and each of them pays for a REAL silent
 * renewal attempt inside `src/auth.js` — `ensureFreshToken()` asks Google Identity Services for a
 * token without a prompt, which is the code under test and cannot be stubbed out from here without
 * testing something else. If the section above it managed to load the real GIS library, that
 * attempt talks to Google and fails on the origin; if it did not, it fails immediately. Either way
 * it is bounded by that module's own 25-second silent timeout, so this section can cost up to a
 * minute more than its check count suggests. A stub is installed for it below anyway, which
 * catches the case where GIS never loaded; it cannot displace a token client the section above
 * already built, and pretending otherwise would be the more comfortable lie.
 *
 * ══════════ THE FIXTURE, AND HOW IT IS PUT BACK ══════════
 *
 * One of the checks below drives a real download, which REPLACES the year document — through
 * `store.adoptRemoteDocument()`, the app's own path, because a download that did not really swap
 * the document would prove nothing. Sections that replace the document are why
 * `verify/cooldown-quiet.mjs` is last in the run order, and this one is not last: it runs directly
 * after the sign-in it depends on. So it does what `verify/outreach.mjs` and
 * `verify/contact-log.mjs` do — it puts its own fixture back by hand at the foot, and the
 * restoration is asserted as a check rather than assumed. The only content this section ever
 * changes is one field it writes into the document itself, `teacher.school`, so what comes back is
 * the document this run built, field for field, with `rev` further along. `rev` moving is what a
 * save does, and no section after this one reads it.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
const { ROOT, check, skip, send, evalJs, clickSel, KILL_ANIM } = h;

console.log('\n--- the Drive transfer, and the conflict (WO-7.2) ---');

/* ══════════ static, in Node ══════════
 *
 * Six claims a browser cannot make, here rather than in `tools/wo-sweep.mjs` for the reason
 * `verify/policy-url.mjs` gives about its own static clause: each is HALF OF ONE CLAIM whose other
 * half is driven further down, and splitting a claim across two tools is how one half goes green
 * over a tree the other half would have failed.
 */
const readIf = async (rel) => {
  try { return await fs.readFile(path.join(ROOT, rel), 'utf8'); } catch (e) { return ''; }
};
/*
  CODE, WITH THE PROSE TAKEN OFF — and it is here because the first run of this section went red on
  three of its own checks and the app was innocent in all three. `src/drive-sync.js` is two thirds
  comment by design, and its header ARGUES about resumable uploads, about localStorage, and about
  the merge it refuses to write; a scan over the raw file found every one of those arguments and
  reported them as the thing they exist to forbid. The same trap `tools/wo-sweep.mjs` § 20 names at
  length: a claim about what is NOT in a file has to be made over the file's code, or the file's own
  explanation of the rule is the first thing to break it.

  A LOUD GUARD RIDES WITH IT, for that section's reason too: a stripper that quietly stopped working
  would make every absence below true over an empty string. Each block that uses this asserts the
  strip removed a plausible share of the file.
*/
const codeOnly = (text) => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

const swText = await readIf('sw.js');
const indexHtml = await readIf('index.html');
const chipText = await readIf('src/save-indicator.js');
const syncText = await readIf('src/drive-sync.js');
const storeText = await readIf('src/store.js');

/* A module reached only through an import is exactly as absent offline as one named in
   index.html, and easier to forget — the argument `verify/precache.mjs` makes about the whole
   list, applied to the one file this work order added. */
{
  const shellBlock = swText.match(/const SHELL\s*=\s*\[([\s\S]*?)\n\];/);
  const entries = shellBlock ? [...shellBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
  check('src/drive-sync.js is in sw.js SHELL, so an installed app can still reach the code that '
    + 'syncs on the morning the network is the thing that is broken — it is reached only through '
    + 'an import from src/shell.js, which is the shape of file that list exists to catch',
    entries.indexOf('./src/drive-sync.js') >= 0 && syncText.length > 2000,
    entries.length + ' SHELL entr(ies); ./src/drive-sync.js present = '
      + (entries.indexOf('./src/drive-sync.js') >= 0) + ', the module is ' + syncText.length
      + ' chars');
}

/* The Drive panel's own copy, which is a deliverable rather than a courtesy — CLAUDE.md allows
   ONE exception to "accommodation, medical and plan data never leaves the roster", the
   downloadable backup, "and its own UI says so". Sync is the second, so its own UI says so too,
   and this is the check that the sentence is there rather than promised. */
{
  const from = indexHtml.indexOf('<div class="drive-panel');
  let block = '';
  if (from >= 0) {
    let depth = 0;
    for (const m of indexHtml.slice(from).matchAll(/<div\b|<\/div>/g)) {
      depth += m[0] === '</div>' ? -1 : 1;
      if (depth === 0) { block = indexHtml.slice(from, from + m.index + 6); break; }
    }
  }
  const names = ['accommodations', 'IEP and 504 plans', 'case managers', 'medical needs',
    'behavior plans'].filter((n) => block.indexOf(n) >= 0);
  check('the Drive panel names what sync puts in a teacher’s Drive, field by field, and says in '
    + 'the same breath that sync is not a backup — the second of those is the misconception that '
    + 'costs a term of grades, and the first is the paragraph the backup panel already owes her '
    + 'about the file she downloads',
    block.length > 400 && names.length === 5
      && /Sync is not a backup/.test(block)
      && /Nothing is uploaded yet/.test(block) === false,
    'the block is ' + block.length + ' chars; support fields named = ' + names.length + '/5 ('
      + names.join(', ') + '), "Sync is not a backup" = ' + /Sync is not a backup/.test(block)
      + ', the WO-7.1 sentence "Nothing is uploaded yet" is still there = '
      + /Nothing is uploaded yet/.test(block));
}

/* THE DELIVERABLE SAYS "syncing / queued / retry" AND `queued` MUST NOT COME BACK. It was Roll
   Call!'s state and it meant "sitting in the Apps Script outbox waiting for the network" — the
   outbox CLAUDE.md forbids reintroducing — so the state table is asserted to hold five entries and
   not six, and no file in src/ may ask for the sixth. Both halves, because a `queued` entry nobody
   paints and a `showSaveState('queued')` against a table that lacks it are two different ways for
   this to come back and only one of them is visible in either file alone. */
{
  const table = chipText.match(/const STATES\s*=\s*\{([\s\S]*?)\n\};/);
  const keys = table ? [...table[1].matchAll(/^\s{2}([a-z]+)\s*:/gm)].map((m) => m[1]) : [];
  const src = path.join(ROOT, 'src');
  const files = (await fs.readdir(src)).filter((f) => f.endsWith('.js'));
  const askers = [];
  for (const f of files) {
    const text = await fs.readFile(path.join(src, f), 'utf8');
    text.split('\n').forEach((line, i) => {
      if (/showSaveState\s*\(\s*['"]queued['"]/.test(line)) askers.push('src/' + f + ':' + (i + 1));
    });
  }
  check('the save chip still has five states and none of them is `queued`, and no file in src/ '
    + 'asks for a sixth — `queued` is the Apps Script outbox wearing a chip, and this work order’s '
    + 'deliverable names it beside two states it really did wire',
    keys.length === 5 && keys.indexOf('queued') < 0 && keys.indexOf('syncing') >= 0
      && keys.indexOf('retry') >= 0 && askers.length === 0,
    'STATES = [' + keys.join(', ') + '], showSaveState(\'queued\') call site(s) = '
      + (askers.length ? askers.join(', ') : 'none') + ' across ' + files.length + ' src/*.js');
}

/* `syncing` AND `retry` NOW HAVE CALLERS, which is the other half of the same deliverable, and it
   is asserted over the source rather than over a run: a green run proves the paths it took, and
   this proves the wiring exists at all. `error` is deliberately not among what sync paints — every
   failure path in that module leaves the document untouched, so "✕ Save failed" would be a lie
   about local storage. */
{
  const painted = [...syncText.matchAll(/showSaveState\s*\(\s*'([a-z]+)'/g)].map((m) => m[1]);
  const uniq = [...new Set(painted)].sort();
  check('src/drive-sync.js paints `syncing` and `retry` and never `error` — the two states the '
    + 'deliverable asks for, and the one that would tell a teacher her grades are in danger at the '
    + 'moment every failure path in that module has left them exactly where they were',
    uniq.indexOf('syncing') >= 0 && uniq.indexOf('retry') >= 0 && uniq.indexOf('error') < 0
      && painted.length >= 3,
    painted.length + ' showSaveState call(s) in src/drive-sync.js: [' + uniq.join(', ') + ']');
}

/* THE TWO HANDLERS THAT PUT THIS FEATURE ON A TEACHER'S SCREEN, and this is the static half of a
   claim whose driven half is the last block in this file — split for the reason `verify/policy-url.mjs`
   gives about its own: a green run proves the paths it took, and this proves the wiring is there at
   all. It is asserted over `src/shell.js` because that is where it HAS to live. `refreshSyncChrome()`
   is in src/drive-sync.js, and src/auth.js repainting the sync half would mean src/auth.js importing
   this module — reversing the one-way dependency that `verify/drive-sign-in.mjs` fences one section
   earlier by asserting src/auth.js imports src/live-region.js and nothing else. So the chain hangs
   off the one delegated listener, which already carries every other cross-module consequence in the
   app, and the two branches that flip a sign-in have to be the two branches that carry it. */
{
  const shellText = await readIf('src/shell.js');
  const code = codeOnly(shellText);
  const from = code.indexOf('data-drive-connect');
  const to = code.indexOf('data-drive-sync');
  const handlers = from >= 0 && to > from ? code.slice(from, to) : '';
  const cut = handlers.indexOf('data-drive-disconnect');
  const onConnect = cut > 0 ? handlers.slice(0, cut) : '';
  const onDisconnect = cut > 0 ? handlers.slice(cut) : '';
  /* ON THE FAR END OF THE PROMISE AND ON BOTH OF ITS ARMS. connect() is async, and whether the
     Sync button is drawn is whether there is a sign-in behind it — a repaint fired on the line
     after the call would run before Google had answered and paint the state the tap started in,
     which is the defect wearing a fix. Both arms because a refusal repaints too: a failed connect
     can leave an earlier session standing. */
  const farEnd = /connect\(\)\s*\.then\(\s*afterDriveAuthChange\s*,\s*afterDriveAuthChange\s*\)/
    .test(onConnect);
  const helper = /function afterDriveAuthChange\s*\(\s*\)\s*\{[^}]*?refreshSyncChrome\s*\([^}]*?primeSyncChrome\s*\(/
    .test(code);
  check('both of the controls that flip a Google sign-in repaint the sync half of the Drive panel '
    + 'as well as their own — the Connect branch and the Disconnect branch in src/shell.js each '
    + 'chain afterDriveAuthChange(), which is refreshSyncChrome() and then primeSyncChrome(), and '
    + 'the connect one chains it on both arms of the promise rather than firing and forgetting: '
    + 'without it, connecting leaves "Sync this year now" hidden until About is closed and '
    + 're-opened, and disconnecting leaves it on the screen under the words "Not connected"',
    code.length > 20000 && onConnect.length > 20 && onDisconnect.length > 20
      && handlers.length < 1500 && farEnd === true
      && /afterDriveAuthChange/.test(onDisconnect) && helper === true,
    'the two branches span ' + handlers.length + ' chars of code; connect chains it on both arms '
      + 'of the promise = ' + farEnd + ', disconnect chains it = '
      + /afterDriveAuthChange/.test(onDisconnect) + ', the helper calls both painters = ' + helper);
}

/* NO RESUMABLE UPLOAD ANYWHERE, which is the fourth acceptance line written as a property of the
   code. A resumable upload is the obvious tool at three to six megabytes and it is the one that
   creates a half-written state with a name — a session URI and bytes at Drive belonging to a
   transfer nobody finished. One multipart request per write has no such state: Drive commits the
   whole body or the previous revision stands. */
{
  const code = codeOnly(syncText);
  const resumable = (code.match(/resumable/gi) || []).length;
  const multipart = (code.match(/uploadType=multipart/g) || []).length;
  check('every write to Drive is one multipart request and nothing in the module can start a '
    + 'resumable upload — so a connection that dies mid-upload leaves Drive holding the previous '
    + 'revision whole, because there is no half-finished session for this code to have left behind',
    code.length > 2000 && code.length < syncText.length * 0.6
      && multipart === 2 && resumable === 0,
    multipart + ' uploadType=multipart call site(s) and ' + resumable + ' mention(s) of resumable '
      + 'in ' + code.length + ' chars of code, stripped out of ' + syncText.length
      + ' chars of file');
}

/* THE BOOKMARK IS NOT IN THE DOCUMENT AND NOT IN localStorage — the first of this work order's
   five decisions, asserted where a grep can see it. newYearDocument() gaining a key is the WO-6.1
   scar (parseBackup() refuses every earlier backup by name); src/prefs.js gaining one would be the
   first widening of what that file is FOR. */
{
  const prefsText = await readIf('src/prefs.js');
  const seed = storeText.match(/export function newYearDocument\(year\) \{([\s\S]*?)\n\}/);
  const seedBody = codeOnly(seed ? seed[1] : '');
  const prefsKeys = codeOnly(prefsText).match(/export const PREF_DEFAULTS\s*=\s*\{([\s\S]*?)\n\};/);
  const declared = prefsKeys ? [...prefsKeys[1].matchAll(/^\s{2}([A-Za-z_]\w*)\s*:/gm)]
    .map((m) => m[1]) : [];
  const seedsBookmark = /baseRev|\bsync\b/.test(seedBody);
  const prefHolds = declared.filter((k) => /rev|sync|drive/i.test(k));
  const touchesLocalStorage = /localStorage/.test(codeOnly(syncText));
  check('the sync bookmark is in IndexedDB and in neither of the two places it was refused — '
    + 'newYearDocument() gained nothing, so every backup written by every earlier build still '
    + 'restores, and PREF_DEFAULTS gained nothing, so localStorage is still UI preferences and '
    + 'nothing else',
    seedBody.length > 200 && declared.length > 5
      && /createObjectStore\(SYNC_STORE/.test(storeText)
      && seedsBookmark === false && prefHolds.length === 0 && touchesLocalStorage === false,
    'store creates the sync object store = ' + /createObjectStore\(SYNC_STORE/.test(storeText)
      + '; newYearDocument() is ' + seedBody.length + ' chars of code and seeds a bookmark = '
      + seedsBookmark + '; PREF_DEFAULTS declares ' + declared.length + ' key(s), '
      + prefHolds.length + ' of them sync-shaped; src/drive-sync.js touches localStorage in code = '
      + touchesLocalStorage);
}

/* NO MERGE, WRITTEN AS AN ABSENCE. The work order's Traps line is "if you find yourself writing
   merge logic, stop", and the shape a merge would take here is a read of one document's fields
   while another is in hand. There is exactly one place in the module that turns Drive bytes into a
   document — the download — and exactly one that hands a document to the store, and they are the
   same path; the conflict path calls neither. */
{
  const code = codeOnly(syncText);
  /* The import line names both, so a call site is an occurrence that is not the import. */
  const parses = (code.match(/parseBackup\s*\(/g) || []).length;
  const adopts = (code.match(/store\.adoptRemoteDocument\s*\(/g) || []).length;
  const merges = (code.match(/Object\.assign\s*\(\s*(doc|incoming|local|remote)\b/g) || [])
    .concat(code.match(/\bmerge[A-Z(]/g) || []);
  check('there is no merge anywhere in the module: one call that turns Drive bytes into a '
    + 'document, one call that hands a document to the store, and nothing that reads fields off '
    + 'two documents at once — which is the Traps line asserted as an absence rather than as an '
    + 'intention',
    code.length > 2000 && parses === 1 && adopts === 1 && merges.length === 0,
    'over ' + code.length + ' chars of code: parseBackup() call sites = ' + parses
      + ', store.adoptRemoteDocument() call sites = ' + adopts + ', merge-shaped occurrence(s) = '
      + (merges.length ? JSON.stringify(merges) : 'none'));
}

/* ══════════ driven from here down ══════════ */

if (!h.seam) {
  skip('the Drive transfer (WO-7.2)', 'window.planbook is not on the page, so nothing below can '
    + 'seed a token, stand up a Drive or read what a sync decided');
  return;
}

const SCOPE_URL = 'https://www.googleapis.com/auth/drive.file';

const shutModals = () => evalJs("(function(){ Array.prototype.forEach.call("
  + "document.querySelectorAll('.modal-overlay:not(.hidden)'), function(m){"
  + " window.planbook.closeModal(m); }); return 1; })()");

await shutModals();
await evalJs('window.planbook.auth.disconnect(); 1');

/*
  ── THE DRIVE THIS SECTION STANDS UP ──

  Four operations, which is every one `src/drive-sync.js` makes: list by `appProperties.docId`,
  read a body, create a file, overwrite a file. It answers with a real `Response` rather than an
  object shaped like one, so the module's reading of `res.ok`, `res.status`, `res.json()` and
  `res.text()` is the reading it does against Google.

  IT RECORDS EVERY CALL IN ORDER, which is what lets the conflict checks assert something no
  single reading of the end state can: that the losing copy was WRITTEN BEFORE the live file was
  overwritten. Keep-both is an ordering guarantee, and a run that only looked at what was in Drive
  afterwards could not tell preserve-then-overwrite from overwrite-then-hope.

  TWO FAILURE SWITCHES, and they are two because there are two different questions. `failNext`
  fails everything, which is "the network is gone". `failUploads` fails only the calls that carry
  a body, which is the one Acceptance 4 is about — the list and the read succeed, the comparison
  is made, and the connection dies with an upload in the air.

  ANYTHING THAT IS NOT A GOOGLE URL GOES TO THE REAL fetch, so the app is not broken while this is
  installed, and the whole thing is taken away again at the foot of this file.
*/
const INSTALL_DRIVE = `(function(){
  if (window.__drive) return 'already';
  var d = { files: [], calls: [], nextId: 1, failNext: null, failUploads: null, failCount: 0 };
  window.__drive = d;
  window.__realFetch = window.fetch;

  function partsOf(contentType, body) {
    var m = /boundary=(.+)$/.exec(contentType || '');
    if (!m) return null;
    var chunks = body.split('--' + m[1]);
    var out = [];
    for (var i = 0; i < chunks.length; i++) {
      var at = chunks[i].indexOf('\\r\\n\\r\\n');
      if (at < 0) continue;
      out.push(chunks[i].slice(at + 4).replace(/\\r\\n$/, ''));
    }
    return out.length >= 2 ? { meta: JSON.parse(out[0]), content: out[1] } : null;
  }

  window.fetch = function (url, init) {
    var u = String(url);
    if (u.indexOf('googleapis.com') < 0) return window.__realFetch.apply(window, arguments);
    var method = (init && init.method) || 'GET';
    var isUpload = u.indexOf('/upload/') >= 0;
    d.calls.push({ method: method, url: u,
      auth: !!(init && init.headers && init.headers.Authorization) });

    var mode = isUpload && d.failUploads !== null ? d.failUploads : d.failNext;
    if (mode === 'network') {
      d.failCount++;
      return Promise.reject(new TypeError('Failed to fetch'));
    }
    if (typeof mode === 'number') {
      d.failCount++;
      return Promise.resolve(new Response('{"error":{"message":"planted"}}', { status: mode }));
    }

    if (method === 'GET' && u.indexOf('/drive/v3/files?') >= 0) {
      var q = decodeURIComponent((/[?&]q=([^&]*)/.exec(u) || [])[1] || '');
      var want = (/value='([^']*)'/.exec(q) || [])[1] || '';
      var hits = d.files.filter(function (f) {
        return f.appProperties && f.appProperties.docId === want;
      }).map(function (f) {
        return { id: f.id, name: f.name, appProperties: f.appProperties, modifiedTime: f.at };
      });
      return Promise.resolve(new Response(JSON.stringify({ files: hits }), { status: 200 }));
    }
    if (method === 'GET' && /\\/drive\\/v3\\/files\\/[^?]+\\?alt=media/.test(u)) {
      var rid = decodeURIComponent(/\\/drive\\/v3\\/files\\/([^?]+)/.exec(u)[1]);
      var got = d.files.filter(function (f) { return f.id === rid; })[0];
      if (!got) return Promise.resolve(new Response('not found', { status: 404 }));
      return Promise.resolve(new Response(got.body, { status: 200 }));
    }
    if (method === 'POST' && u.indexOf('/upload/drive/v3/files?') >= 0) {
      var made = partsOf(init.headers['Content-Type'], init.body);
      if (!made) return Promise.resolve(new Response('bad multipart', { status: 400 }));
      var file = { id: 'file-' + (d.nextId++), name: made.meta.name,
        appProperties: made.meta.appProperties || {}, body: made.content,
        at: new Date().toISOString() };
      d.files.push(file);
      return Promise.resolve(new Response(JSON.stringify({ id: file.id, name: file.name,
        appProperties: file.appProperties }), { status: 200 }));
    }
    if (method === 'PATCH' && /\\/upload\\/drive\\/v3\\/files\\//.test(u)) {
      var pid = decodeURIComponent(/\\/upload\\/drive\\/v3\\/files\\/([^?]+)/.exec(u)[1]);
      var target = d.files.filter(function (f) { return f.id === pid; })[0];
      if (!target) return Promise.resolve(new Response('not found', { status: 404 }));
      var next = partsOf(init.headers['Content-Type'], init.body);
      if (!next) return Promise.resolve(new Response('bad multipart', { status: 400 }));
      if (next.meta.name) target.name = next.meta.name;
      if (next.meta.appProperties) target.appProperties = next.meta.appProperties;
      target.body = next.content;
      target.at = new Date().toISOString();
      return Promise.resolve(new Response(JSON.stringify({ id: target.id, name: target.name,
        appProperties: target.appProperties }), { status: 200 }));
    }
    return Promise.resolve(new Response('unhandled', { status: 501 }));
  };
  return 'installed'; })()`;

const installed = await evalJs(INSTALL_DRIVE);

/* A Google Identity Services stand-in that refuses immediately. See the note in this file's
   header: it helps only if the section above never loaded the real library, and it is installed
   because half a mitigation that says so is better than a wait nobody expected. */
await evalJs(`(function(){
  if (window.google && window.google.accounts) return 'real GIS is already loaded';
  window.google = { accounts: { oauth2: {
    initTokenClient: function (cfg) {
      return { requestAccessToken: function () {
        setTimeout(function () { cfg.error_callback({ type: 'access_denied' }); }, 0); } };
    },
    revoke: function (t, cb) { if (cb) cb(); }
  } } };
  return 'stub installed'; })()`);

/* One round trip for everything a check below asks about the Drive, the bookmark and the panel. */
const READ = `(function(){
  var ds = window.planbook.driveSync;
  var s = ds.syncState();
  var d = window.__drive;
  var doc = window.planbook.store.getDoc();
  var json = JSON.stringify(doc);
  var hash = 5381;
  for (var i = 0; i < json.length; i++) hash = ((hash * 33) ^ json.charCodeAt(i)) >>> 0;
  var line = document.getElementById('driveSyncStatus');
  function box(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { h: Math.round(r.height * 100) / 100, w: Math.round(r.width * 100) / 100,
      shown: !el.classList.contains('hidden'), disabled: !!el.disabled,
      label: (el.textContent || '').trim() };
  }
  return {
    state: s,
    fingerprint: 'chars:' + json.length + '|rev:' + doc.rev + '|h:' + hash.toString(36),
    school: doc.teacher ? doc.teacher.school : null,
    files: d.files.map(function (f) {
      return { id: f.id, name: f.name, props: f.appProperties, bytes: f.body.length,
        marker: (/"school":"([^"]*)"/.exec(f.body) || [])[1] || '',
        bodyRev: (/"rev":(\\d+)/.exec(f.body) || [])[1] || '' };
    }),
    calls: d.calls.map(function (c) {
      return c.method + ' ' + (c.url.indexOf('/upload/') >= 0 ? 'upload' : 'api')
        + (/alt=media/.test(c.url) ? ':read' : '') + (/[?&]q=/.test(c.url) ? ':list' : ''); }),
    lastQuery: (function () {
      for (var i = d.calls.length - 1; i >= 0; i--) {
        if (/[?&]q=/.test(d.calls[i].url)) {
          return decodeURIComponent(/[?&]q=([^&]*)/.exec(d.calls[i].url)[1]);
        }
      }
      return ''; })(),
    everyCallAuthorised: d.calls.length > 0 && d.calls.every(function (c) { return c.auth; }),
    chip: (function () { var c = document.getElementById('saveIndicator');
      return c ? c.className : ''; })(),
    lineText: line ? line.textContent.trim() : null,
    lineClass: line ? line.className : null,
    syncBtn: box('driveSyncBtn'), connectBtn: box('driveConnectBtn'),
    disconnectBtn: box('driveDisconnectBtn'),
    /* The two fields the panel-follows-the-sign-in block at the foot needs, and both are about
       something OUTSIDE src/drive-sync.js: whether the About modal is still the one that was
       opened before the tap, and whether src/auth.js is still waiting on Google. syncState()
       answers neither — the busy flag it reports is this module's, not that one's. (No backticks
       in here: this comment is inside a template literal, and one would end it.) */
    aboutOpen: (function () { var m = document.getElementById('aboutModal');
      return !!(m && !m.classList.contains('hidden')); })(),
    authBusy: window.planbook.auth.authState().busy,
    coarse: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  }; })()`;

const SEED = (token, seconds) => `(function(){
  return window.planbook.auth.acceptTokenResponse({
    access_token: ${JSON.stringify(token)}, expires_in: ${seconds},
    scope: ${JSON.stringify(SCOPE_URL)}, token_type: 'Bearer' }); })()`;

const sync = () => evalJs('window.planbook.driveSync.syncNow()');
const reset = () => evalJs('window.__drive.calls = []; window.__drive.failNext = null; '
  + 'window.__drive.failUploads = null; window.__drive.failCount = 0; 1');
const fileNow = (id) => evalJs(`(function(){
  var f = window.__drive.files.filter(function (x) { return x.id === ${JSON.stringify(id)}; })[0];
  if (!f) return null;
  return { bytes: f.body.length, marker: (/"school":"([^"]*)"/.exec(f.body) || [])[1] || '',
    name: f.name, props: f.appProperties }; })()`);

const opening = await evalJs(READ);
const originalSchool = opening.school;

/* THE PURE TABLE, ASKED OF THE FUNCTION. Every arm of docs/sync.md's three rows plus the three
   cases the table does not name, and the three additions are the whole of this work order's
   conservatism: with no bookmark, with an unreadable remote rev, and with a remote BEHIND the
   bookmark, it keeps both rather than guessing. A build that answered `download` to any of them
   and a build that answers `conflict` are indistinguishable from outside this function until the
   day one of them replaces a gradebook it should not have. */
const table = await evalJs(`(function(){
  var p = window.planbook.driveSync.planFor;
  return {
    firstEver: p(3, null, null),
    inSync: p(7, 7, 7),
    localAhead: p(9, 7, 7),
    remoteAhead: p(7, 9, 7),
    bothChanged: p(9, 11, 7),
    noBookmark: p(9, 9, null),
    remoteBehind: p(9, 5, 7),
    remoteUnreadable: p(9, NaN, 7),
    localBehind: p(5, 7, 7)
  }; })()`);
check('the rev comparison is docs/sync.md’s table exactly, and the three cases that table does '
  + 'not name all answer `conflict` — no bookmark (which is what a backup restored from another '
  + 'device produces), a remote whose rev cannot be read, and a remote BEHIND the bookmark: this '
  + 'device replaces its own gradebook on proof that the remote is a later version of it, or not '
  + 'at all',
  table.firstEver === 'first-upload' && table.inSync === 'in-sync'
    && table.localAhead === 'upload' && table.remoteAhead === 'download'
    && table.bothChanged === 'conflict' && table.noBookmark === 'conflict'
    && table.remoteBehind === 'conflict' && table.remoteUnreadable === 'conflict'
    && table.localBehind === 'conflict',
  JSON.stringify(table));

/* THE RESTING PANEL IS READ BEFORE ANYTHING IS SYNCED, and the order is not arbitrary: once a sync
   has happened the line reports what it DID, which is the right thing for it to say and means the
   resting sentence is unreachable for the rest of this section. The first run of this block read it
   after the signed-out sync below and found that sentence instead — the check was wrong and the
   panel was right. */
await evalJs(SEED('wo72-resting-token-' + Date.now(), 3599));
await shutModals();
await clickSel('[data-modal-open="aboutModal"]');
await new Promise((r) => setTimeout(r, 400));
const fresh = await evalJs(READ);
check('signed in with nothing ever synced, the panel offers Sync and says so in as many words — a '
  + 'year that has never left this device is a fact a teacher is entitled to be told before she is '
  + 'told anything else about Drive',
  fresh.syncBtn && fresh.syncBtn.shown === true
    && fresh.syncBtn.label === 'Sync this year now'
    && fresh.lineText === 'This school year has not been synced from this device yet.'
    && fresh.state.baseRev === null && fresh.state.bookmarkRead === true,
  'Sync button = ' + JSON.stringify(fresh.syncBtn) + ', line = '
    + JSON.stringify(fresh.lineText) + ', baseRev = ' + fresh.state.baseRev);
await shutModals();

/* Nothing may reach Google before there is a sign-in behind it. This is one of the two slow
   checks — see the header. */
await evalJs('window.planbook.auth.disconnect(); 1');
const beforeToken = await sync();
const noToken = await evalJs(READ);
check('with nobody signed in, a sync makes no request at all and says the sign-in has run out — '
  + 'the fifth acceptance line at its easiest reading: a re-auth prompt rather than a silent '
  + 'no-op, and not one byte of a gradebook offered to anybody',
  beforeToken.kind === 'signed-out' && /Connect Google Drive/.test(beforeToken.message)
    && noToken.calls.length === 0 && noToken.files.length === 0,
  'outcome = ' + beforeToken.kind + ', calls made = ' + noToken.calls.length
    + ', message = ' + JSON.stringify(beforeToken.message.slice(0, 120)));

await evalJs(SEED('wo72-synthetic-token-' + Date.now(), 3599));
await reset();

/* ── the first sync of a document ── */
const first = await sync();
const afterFirst = await evalJs(READ);
const liveId = afterFirst.files.length ? afterFirst.files[0].id : '';
/* THE BOOKMARK RECORD ITSELF, READ RAW OUT OF INDEXEDDB, and it is read HERE rather than in
   `verify/year-document-store.mjs` — which also asserts the shape of that store — because this is
   the first moment in the whole run at which a bookmark exists. That section runs a thousand checks
   earlier over an empty store, so its field clause is true over nothing; this one is the same claim
   made over a record. The point of the claim is that the bookmark is FOUR SCALARS: an id, a year
   label, a number and a stamp, with nothing from inside a document anywhere in it. */
const bookmark = await evalJs(`(function(){ return new Promise(function(res, rej){
  var open = indexedDB.open('planbook');
  open.onerror = function(){ rej(open.error); };
  open.onsuccess = function(){
    var db = open.result;
    var all = db.transaction('sync', 'readonly').objectStore('sync').getAll();
    all.onerror = function(){ rej(all.error); };
    all.onsuccess = function(){ res(all.result); db.close(); };
  }; }); })()`);
check('the first sync of a school year creates one file in Drive, named for the year, carrying '
  + 'this document’s id and its save counter in appProperties — which is the deliverable’s "`rev` '
  + 'carried in appProperties so ordering is readable without downloading the file" — and the '
  + 'bookmark it writes on this device is four scalars with nothing from inside a document in it',
  first.kind === 'uploaded' && afterFirst.files.length === 1
    && afterFirst.files[0].name === 'Planbook ' + afterFirst.state.year + '.json'
    && afterFirst.files[0].props.docId === afterFirst.state.docId
    && afterFirst.files[0].props.rev === String(afterFirst.state.localRev)
    && afterFirst.state.baseRev === afterFirst.state.localRev
    && afterFirst.everyCallAuthorised === true
    && bookmark.length === 1
    && JSON.stringify(Object.keys(bookmark[0]).sort())
      === JSON.stringify(['at', 'baseRev', 'docId', 'year'])
    && bookmark[0].docId === afterFirst.state.docId
    && bookmark[0].baseRev === afterFirst.state.localRev
    && bookmark[0].year === afterFirst.state.year,
  'outcome = ' + first.kind + ', files = ' + JSON.stringify(afterFirst.files.map(
    (f) => ({ name: f.name, props: f.props, bytes: f.bytes })))
    + ', baseRev = ' + afterFirst.state.baseRev + ', localRev = ' + afterFirst.state.localRev
    + ', every call carried a bearer token = ' + afterFirst.everyCallAuthorised
    + ', the sync store holds ' + bookmark.length + ' record(s): ' + JSON.stringify(bookmark));

check('the query is this document’s id and nothing else — appProperties matching is the whole of '
  + '"sync never touches a year document other than the one matched by docId", and drive.file '
  + 'means the answer can only ever hold files this app itself made, so there is no folder to pick '
  + 'and no path to store',
  afterFirst.lastQuery.indexOf("key='docId'") >= 0
    && afterFirst.lastQuery.indexOf("value='" + afterFirst.state.docId + "'") >= 0
    && afterFirst.lastQuery.indexOf('trashed = false') >= 0,
  'the query was ' + JSON.stringify(afterFirst.lastQuery));

/* ── nothing changed ── */
await reset();
const again = await sync();
const afterAgain = await evalJs(READ);
check('a second sync with nothing changed anywhere writes nothing — the table’s first row read '
  + 'honestly rather than uploading three megabytes to replace a file with its own contents, '
  + 'which is what "remote.rev == baseRev → upload" says if it is taken literally',
  again.kind === 'in-sync'
    && afterAgain.calls.filter((c) => /upload/.test(c)).length === 0
    && afterAgain.files.length === 1
    && afterAgain.files[0].bytes === afterFirst.files[0].bytes,
  'outcome = ' + again.kind + ', calls = ' + JSON.stringify(afterAgain.calls)
    + ', the file is still ' + afterAgain.files[0].bytes + ' bytes');

/* ── local ahead ── */
await reset();
await evalJs(`(function(){ window.planbook.store.update(function(d){
  d.teacher.school = 'WO72-LOCAL-A'; }); return window.planbook.store.flush(); })()`);
const upped = await sync();
const afterUp = await evalJs(READ);
check('an edit on this device is uploaded over the same file, by the id the list answered with on '
  + 'this pass and never a remembered one — one file still, the marker this run typed now in the '
  + 'bytes Drive holds, and the bookmark moved to the save that was actually sent',
  upped.kind === 'uploaded' && afterUp.files.length === 1
    && afterUp.files[0].id === liveId
    && afterUp.files[0].marker === 'WO72-LOCAL-A'
    && afterUp.files[0].props.rev === String(afterUp.state.localRev)
    && afterUp.state.baseRev === afterUp.state.localRev
    && afterUp.state.localRev > afterFirst.state.localRev,
  'outcome = ' + upped.kind + ', file = ' + JSON.stringify(afterUp.files[0])
    + ', baseRev = ' + afterUp.state.baseRev + ' (was ' + afterFirst.state.baseRev + ')');

/* ── a document that is not ours, which nothing may ever touch ── */
await evalJs(`(function(){
  window.__drive.files.push({ id: 'file-foreign', name: 'Planbook 2019-2020.json',
    appProperties: { docId: 'not-this-document', rev: '400' },
    body: JSON.stringify({ year: '2019-2020', docId: 'not-this-document', rev: 400,
      teacher: { school: 'FOREIGN' } }), at: new Date().toISOString() });
  return 1; })()`);

/* ── remote ahead, local clean ── */
await reset();
const remoteRev = afterUp.state.localRev + 5;
await evalJs(`(function(){
  var f = window.__drive.files.filter(function (x) { return x.id === ${JSON.stringify(liveId)}; })[0];
  var doc = JSON.parse(f.body);
  doc.rev = ${remoteRev};
  doc.teacher.school = 'WO72-REMOTE-B';
  f.body = JSON.stringify(doc);
  f.appProperties = Object.assign({}, f.appProperties,
    { rev: String(${remoteRev}), deviceLabel: 'iPad' });
  return 1; })()`);
const down = await sync();
const afterDown = await evalJs(READ);
check('a Drive copy that is further along, with nothing unsynced here, is downloaded and adopted '
  + '— the document on this device is now the one from Drive, at the Drive copy’s own save number '
  + 'rather than one past it, which is what stops a download being followed forever by an upload '
  + 'of the bytes it just received',
  down.kind === 'downloaded' && afterDown.school === 'WO72-REMOTE-B'
    && afterDown.state.localRev === remoteRev && afterDown.state.baseRev === remoteRev
    && afterDown.calls.filter((c) => /upload/.test(c)).length === 0,
  'outcome = ' + down.kind + ', school marker now ' + JSON.stringify(afterDown.school)
    + ', localRev = ' + afterDown.state.localRev + ', baseRev = ' + afterDown.state.baseRev
    + ', calls = ' + JSON.stringify(afterDown.calls));

check('and the download said out loud that nothing typed here was lost, and why — a swap of the '
  + 'whole document is the one irreversible thing sync does, and a teacher told only that it '
  + 'happened has been told the frightening half',
  /Nothing you had typed on this device was lost/.test(down.message)
    && /already been synced/.test(down.message),
  JSON.stringify(down.message));

/* ── both sides changed: keep both ── */
await reset();
const clashRev = afterDown.state.localRev + 4;
await evalJs(`(function(){
  var f = window.__drive.files.filter(function (x) { return x.id === ${JSON.stringify(liveId)}; })[0];
  var doc = JSON.parse(f.body);
  doc.rev = ${clashRev};
  doc.teacher.school = 'WO72-REMOTE-C';
  f.body = JSON.stringify(doc);
  f.appProperties = Object.assign({}, f.appProperties,
    { rev: String(${clashRev}), deviceLabel: 'iPad' });
  return 1; })()`);
await evalJs(`(function(){ window.planbook.store.update(function(d){
  d.teacher.school = 'WO72-LOCAL-D'; }); return window.planbook.store.flush(); })()`);
const beforeClash = await evalJs(READ);
const clash = await sync();
const afterClash = await evalJs(READ);
const spare = afterClash.files.filter((f) => f.id !== liveId && f.id !== 'file-foreign')[0];
const live = afterClash.files.filter((f) => f.id === liveId)[0];

check('when both sides have changed, BOTH SURVIVE: the Drive copy is written to a second file and '
  + 'this device’s copy becomes the live one — two files, the losing bytes intact in the new one, '
  + 'the winning bytes in the old one, and nothing anywhere holding a blend of the two',
  clash.kind === 'conflict' && !!spare && !!live
    && spare.marker === 'WO72-REMOTE-C' && live.marker === 'WO72-LOCAL-D'
    && String(spare.bodyRev) === String(clashRev),
  'outcome = ' + clash.kind + ', conflict copy = ' + JSON.stringify(spare) + ', live file = '
    + JSON.stringify(live && { name: live.name, props: live.props, marker: live.marker }));

check('the conflict copy is named the way the work order names it — the year, the word conflict, '
  + 'the device the losing copy came from, and the day it was noticed — so it is findable in a '
  + 'Drive folder by somebody who was told about it once',
  !!spare && new RegExp('^Planbook ' + afterClash.state.year
    + ' \\(conflict from iPad \\d{4}-\\d{2}-\\d{2}\\)\\.json$').test(spare.name),
  'the conflict copy is named ' + JSON.stringify(spare && spare.name));

check('the conflict copy carries NO docId property, so no later sync can ever match it — it is '
  + 'stamped `conflictOf` instead, which a human reading the file’s properties can follow and the '
  + 'query cannot: a spare copy that answered the docId lookup would make every sync after it '
  + 'ambiguous, forever',
  !!spare && spare.props.docId === undefined
    && spare.props.conflictOf === afterClash.state.docId
    && /^\d{4}-\d{2}-\d{2}$/.test(spare.props.conflictOn || ''),
  'the conflict copy’s properties are ' + JSON.stringify(spare && spare.props));

check('the losing copy was WRITTEN BEFORE the live file was overwritten, which is the whole of '
  + 'the guarantee rather than a detail of it — preserve-then-overwrite means a conflict '
  + 'interrupted anywhere is a conflict that has not happened yet, where the other order means a '
  + 'dropped connection between the two steps destroys the copy it was about to save',
  (() => {
    const created = afterClash.calls.indexOf('POST upload');
    const patched = afterClash.calls.indexOf('PATCH upload');
    return created >= 0 && patched >= 0 && created < patched;
  })(),
  'the calls this sync made, in order: ' + JSON.stringify(afterClash.calls));

check('the local document was not touched by the conflict at all — the winner stays active, so '
  + 'the teacher’s screen does not change under her while she is being told what happened, and '
  + 'the bookmark now names the save that is live in Drive',
  afterClash.fingerprint === beforeClash.fingerprint
    && afterClash.state.baseRev === afterClash.state.localRev,
  'the document fingerprint went ' + beforeClash.fingerprint + ' -> ' + afterClash.fingerprint
    + ', baseRev = ' + afterClash.state.baseRev + ', localRev = ' + afterClash.state.localRev);

check('the conflict message names the file, says which Drive folder it is in, says nothing was '
  + 'thrown away, and says what is inside it — the last of those is not decoration: a conflict '
  + 'copy is a second copy of accommodations, medical needs and behavior plans, and a teacher is '
  + 'owed the same sentence about it that the backup panel owes her',
  !!spare && clash.message.indexOf(spare.name) >= 0
    && /My Drive/.test(clash.message)
    && /Nothing was thrown away/.test(clash.message)
    && /merged nothing/.test(clash.message)
    && /support details you keep on students/.test(clash.message),
  JSON.stringify(clash.message));

check('and the panel is showing that message, in the quiet grammar rather than the red one — a '
  + 'conflict is not an error: everything worked, and both copies are where the sentence says '
  + 'they are',
  afterClash.lineText === clash.message && afterClash.lineClass === 'class-hint',
  'the line reads ' + JSON.stringify(afterClash.lineText && afterClash.lineText.slice(0, 90))
    + ' (' + afterClash.lineClass + ')');

/* ── the foreign document, after all of that ── */
const foreign = await evalJs(`(function(){
  var f = window.__drive.files.filter(function (x) { return x.id === 'file-foreign'; })[0];
  return f ? { name: f.name, props: f.appProperties, body: f.body } : null; })()`);
check('the year document belonging to somebody else’s docId sat in the same Drive through a '
  + 'create, an overwrite, a download and a conflict, and came out byte for byte as it went in — '
  + 'the sixth acceptance line, measured against a file that was there to be damaged',
  !!foreign && foreign.props.docId === 'not-this-document' && foreign.props.rev === '400'
    && /"school":"FOREIGN"/.test(foreign.body) && foreign.name === 'Planbook 2019-2020.json',
  'the foreign file is ' + JSON.stringify(foreign && { name: foreign.name, props: foreign.props,
    bytes: foreign.body.length }));

/* ── two files claiming one docId ── */
await reset();
await evalJs(`(function(){
  var f = window.__drive.files.filter(function (x) { return x.id === ${JSON.stringify(liveId)}; })[0];
  window.__drive.files.push({ id: 'file-twin', name: 'Planbook copy.json',
    appProperties: Object.assign({}, f.appProperties), body: f.body,
    at: new Date().toISOString() });
  return 1; })()`);
const twins = await sync();
const afterTwins = await evalJs(READ);
check('two Drive files claiming the same document stops the sync dead rather than picking one — '
  + 'one of the two holds work that overwriting the other would destroy and there is no fact '
  + 'available to say which, so it writes nothing, touches neither, and tells the teacher to go '
  + 'and look',
  twins.kind === 'failed' && /will not guess/.test(twins.message)
    && afterTwins.calls.filter((c) => /upload/.test(c)).length === 0
    && afterTwins.lineClass === 'class-error',
  'outcome = ' + twins.kind + ', calls = ' + JSON.stringify(afterTwins.calls)
    + ', message = ' + JSON.stringify(twins.message.slice(0, 140)));
await evalJs("window.__drive.files = window.__drive.files.filter(function(f){"
  + " return f.id !== 'file-twin'; }); 1");

/* ── the network dies with an upload in the air ── */
await reset();
await evalJs(`(function(){ window.planbook.store.update(function(d){
  d.teacher.school = 'WO72-LOCAL-E'; }); return window.planbook.store.flush(); })()`);
const liveBefore = await fileNow(liveId);
const stateBefore = await evalJs(READ);
await evalJs("window.__drive.failUploads = 'network'; 1");
const dead = await sync();
const afterDead = await evalJs(READ);
const liveAfter = await fileNow(liveId);
const failedCalls = await evalJs('window.__drive.failCount');
check('a connection that dies with the upload in the air leaves the local document valid and the '
  + 'remote file exactly as it was — never half-written: the list and the comparison ran, the '
  + 'bytes at Drive are unchanged, the bookmark still names the save that really is there, and '
  + 'the document on this device is untouched',
  dead.kind === 'failed' && liveAfter.bytes === liveBefore.bytes
    && liveAfter.marker === liveBefore.marker
    && JSON.stringify(liveAfter.props) === JSON.stringify(liveBefore.props)
    && afterDead.state.baseRev === stateBefore.state.baseRev
    && afterDead.fingerprint === stateBefore.fingerprint
    && afterDead.files.length === stateBefore.files.length,
  'outcome = ' + dead.kind + ', the Drive file went ' + JSON.stringify(liveBefore) + ' -> '
    + JSON.stringify(liveAfter) + ', baseRev ' + stateBefore.state.baseRev + ' -> '
    + afterDead.state.baseRev + ', files ' + stateBefore.files.length + ' -> '
    + afterDead.files.length);

check('it was tried twice before it gave up, the save chip was never painted red for it, and the '
  + 'panel says when the last sync that worked was — one retry is the same shape src/store.js '
  + 'uses, and `error` on that chip reads "✕ Save failed", which would be a lie about local '
  + 'storage at the one moment a teacher is deciding whether to type a period of grades again',
  failedCalls === 2 && afterDead.chip.indexOf('error') < 0
    && /Nothing on this device changed/.test(dead.message)
    && /exactly as it was/.test(dead.message)
    && /The last sync that worked was on .+ at /.test(afterDead.lineText || ''),
  'requests that failed = ' + failedCalls + ', the chip reads ' + JSON.stringify(afterDead.chip)
    + ', the line reads ' + JSON.stringify(afterDead.lineText));

await reset();
const recovered = await sync();
const afterRecovered = await evalJs(READ);
check('and the retry a teacher makes by hand afterwards works — the failure left nothing behind '
  + 'that has to be cleaned up first, which is the other half of "retry available"',
  recovered.kind === 'uploaded'
    && afterRecovered.files.filter((f) => f.id === liveId)[0].marker === 'WO72-LOCAL-E'
    && afterRecovered.state.baseRev === afterRecovered.state.localRev,
  'outcome = ' + recovered.kind + ', baseRev = ' + afterRecovered.state.baseRev
    + ', localRev = ' + afterRecovered.state.localRev);

/* ── a token Google refuses part-way through ── */
await reset();
await evalJs(`(function(){ window.planbook.store.update(function(d){
  d.teacher.school = 'WO72-LOCAL-F'; }); return window.planbook.store.flush(); })()`);
await evalJs('window.__drive.failUploads = 401; 1');
const stale = await sync();
const afterStale = await evalJs(READ);
const liveAfterStale = await fileNow(liveId);
check('a token Google refuses part-way through produces a sentence naming the sign-in and telling '
  + 'the teacher to connect again — not a silent no-op and not a Google error code — and the '
  + 'Drive file is exactly as it was, because the refusal landed on the write rather than after it',
  stale.kind === 'signed-out' && /sign-in ran out/.test(stale.message)
    && /Connect Google Drive/.test(stale.message)
    && liveAfterStale.marker === 'WO72-LOCAL-E'
    && afterStale.state.baseRev === afterRecovered.state.baseRev
    && afterStale.lineClass === 'class-error',
  'outcome = ' + stale.kind + ', the Drive file still reads ' + JSON.stringify(liveAfterStale.marker)
    + ', baseRev = ' + afterStale.state.baseRev + ', line class = ' + afterStale.lineClass
    + ', message = ' + JSON.stringify(stale.message));

/* THE TOKEN LAPSING BEFORE THE SYNC RATHER THAN DURING IT — the half of the fifth acceptance line
   a teacher actually meets, because she comes back after lunch. `signedIn` is computed from the
   clock on every read, so a token seeded with ten seconds of life is already past src/auth.js's
   one-minute freshness margin and reads as signed out everywhere at once. This is the second of
   the two slow checks; see the header. */
await reset();
await evalJs(SEED('wo72-lapsing-token', 10));
const lapsed = await sync();
const afterLapsed = await evalJs(READ);
check('a sign-in that has already run out when the teacher taps Sync produces the re-auth prompt '
  + 'and nothing else — the Connect button back on the screen, the Sync button gone, no request '
  + 'made, and the document untouched: token expiry is handled without data loss and without a '
  + 'silent failure',
  lapsed.kind === 'signed-out' && afterLapsed.calls.length === 0
    && afterLapsed.connectBtn.shown === true && afterLapsed.syncBtn.shown === false
    && afterLapsed.state.signedIn === false
    && afterLapsed.fingerprint === afterStale.fingerprint,
  'outcome = ' + lapsed.kind + ', calls = ' + afterLapsed.calls.length + ', Connect shown = '
    + afterLapsed.connectBtn.shown + ', Sync shown = ' + afterLapsed.syncBtn.shown
    + ', message = ' + JSON.stringify(lapsed.message.slice(0, 120)));

/* ── the control, in the state it is drawn in ── */
await evalJs(SEED('wo72-synthetic-token-b-' + Date.now(), 3599));
await send('Emulation.setDeviceMetricsOverride',
  { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await new Promise((r) => setTimeout(r, 400));
/* tools/README.md § CDP trap 2: a headless frame never advances the modal's opening keyframe, so a
   button inside it measures 44 × 0.96 = 42.24px and reads exactly like a failed touch target. */
await evalJs(KILL_ANIM);
await shutModals();
await clickSel('[data-modal-open="aboutModal"]');
await new Promise((r) => setTimeout(r, 400));
const coarse = await evalJs(READ);
check('Sync clears 44 by 44 with the pointer actually coarse, in the state it is drawn in — it is '
  + 'a `.class-action-btn`, so the floor it clears is one src/shell.css already owns and this '
  + 'work order invented no control grammar at all (trap 3: the pointer is asserted coarse before '
  + 'the measurement is believed)',
  coarse.coarse === true && coarse.syncBtn && coarse.syncBtn.shown === true
    && coarse.syncBtn.h >= 44 && coarse.syncBtn.w >= 44
    && coarse.syncBtn.label === 'Sync this year now',
  'pointer is ' + (coarse.coarse ? 'coarse' : 'FINE') + ', Sync = '
    + JSON.stringify(coarse.syncBtn));

await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await new Promise((r) => setTimeout(r, 300));

/* ── the panel follows the sign-in, WITH THE MODAL NEVER CLOSED ──
 *
 * EVERY CHECK ABOVE THAT ASSERTS THE SYNC BUTTON IS ON THE SCREEN CLOSES AND REOPENS ABOUT FIRST,
 * and that is a real path — a teacher returning to a session that is already signed in opens the
 * modal and finds the button — but it is not the path that turns the feature on. The first build of
 * this work order painted the sync half of the Drive panel on THAT path only: `src/auth.js` repaints
 * its own half after a connect and a disconnect and cannot reach this one, and nothing chained the
 * other repaint onto the two handlers in `src/shell.js`. So connecting left "Sync this year now"
 * hidden until About was closed and reopened — the one modal session that enables the feature was
 * the one session that could not use it — and disconnecting left that button and the last-synced
 * line sitting under the words "Not connected". Every check in this file was green over both.
 *
 * The reopen checks stay: they assert something true about a returning session. These two are what
 * they were missing, and the whole of the difference is one word — THE MODAL STAYS OPEN across the
 * tap. Both taps are real taps on the real controls, through the one delegated listener.
 */
await shutModals();
await evalJs(SEED('wo72-panel-token-' + Date.now(), 3599));
await clickSel('[data-modal-open="aboutModal"]');
await new Promise((r) => setTimeout(r, 400));
const panelIn = await evalJs(READ);
await clickSel('[data-drive-disconnect]');
const panelOut = await evalJs(READ);
check('one tap of Disconnect takes the Sync button off the panel in the same tap, and the line '
  + 'under it with it, WITHOUT the modal being closed — a panel that reads "Not connected" over a '
  + 'live "Sync this year now" and a sentence about when this year last synced is not a cosmetic '
  + 'lag, it is the panel disagreeing with itself about whether the feature is on',
  panelIn.aboutOpen === true && !!panelIn.syncBtn && panelIn.syncBtn.shown === true
    && panelOut.aboutOpen === true && !!panelOut.syncBtn && panelOut.syncBtn.shown === false
    && panelOut.lineText === '' && panelOut.state.signedIn === false
    && panelOut.connectBtn.shown === true && panelOut.disconnectBtn.shown === false,
  'before the tap: Sync shown = ' + panelIn.syncBtn.shown + ', line = '
    + JSON.stringify(panelIn.lineText && panelIn.lineText.slice(0, 60)) + '; after: Sync shown = '
    + panelOut.syncBtn.shown + ', line = ' + JSON.stringify(panelOut.lineText)
    + ', Connect shown = ' + panelOut.connectBtn.shown + ', About still open = '
    + panelOut.aboutOpen);

/*
 * AND THE DIRECTION THAT MATTERS MORE, from the state the tap above just left: About open, nobody
 * signed in, no Sync button.
 *
 * A HEADLESS BROWSER CANNOT COMPLETE THE HANDSHAKE — `drive-sign-in.mjs` opens by saying so and it
 * is still true — so the token goes in through the seam `src/auth.js` exports for that reason and
 * the tap is a real tap on the real Connect button. connect() will fail at Google here whatever
 * this machine can reach; A FAILED CONNECT DOES NOT CLEAR A SESSION, so the seeded one is still
 * standing when it settles, and what is asserted is the only thing this pair is about: THE TAP RAN
 * THE CHAIN. The line before it is what makes that non-vacuous — the token is seeded with the modal
 * already open and the button is read as STILL HIDDEN, because acceptTokenResponse() paints
 * nothing. Nothing but the tap can be what reveals it.
 *
 * THE TWO ARE CHAINED ON PURPOSE AND THAT COSTS ONE THING WORTH KNOWING: this one starts from the
 * state the tap above left, so a build that broke only the DISCONNECT repaint turns both red — the
 * second one on its own non-vacuity clause, because the button it needed to see hidden is still on
 * the screen. Measured, not assumed (the mutation record is in `tools/README.md`). Decoupling them
 * would mean closing and reopening the modal between the two, which is the one thing neither check
 * is allowed to do.
 *
 * IT IS BOUNDED AND IT SKIPS RATHER THAN GOING RED IF IT RUNS OUT, for trap 8's reason: on a
 * machine that reached accounts.google.com the real library is answering on its own schedule and
 * src/auth.js waits 25 seconds for a silent attempt before it gives up, which is an environment
 * rather than a defect. A skip is announced and listed, and the static half of this claim at the
 * head of this file cannot be skipped.
 */
await evalJs(SEED('wo72-panel-token-b-' + Date.now(), 3599));
const seeded = await evalJs(READ);
const tapAt = Date.now();
await clickSel('[data-drive-connect]');
let panelBack = await evalJs(READ);
while (Date.now() - tapAt < 6000 && !(panelBack.syncBtn && panelBack.syncBtn.shown)) {
  await new Promise((r) => setTimeout(r, 100));
  panelBack = await evalJs(READ);
}
const revealed = 'one tap of Connect puts the Sync button on the panel in that same modal session, '
  + 'with About never closed — the control a teacher has just enabled has to exist in the sitting '
  + 'that enabled it, or the two-device procedure cannot be run by the person who just connected';
if (panelBack.syncBtn && panelBack.syncBtn.shown === true) {
  check(revealed,
    seeded.aboutOpen === true && !!seeded.syncBtn && seeded.syncBtn.shown === false
      && seeded.state.signedIn === true && panelBack.aboutOpen === true
      && panelBack.syncBtn.label === 'Sync this year now',
    'with the token seeded and nothing tapped, Sync shown = '
      + (seeded.syncBtn && seeded.syncBtn.shown)
      + ' (signedIn = ' + seeded.state.signedIn + '); ' + (Date.now() - tapAt)
      + 'ms after the tap, Sync shown = ' + panelBack.syncBtn.shown + ', About still open = '
      + panelBack.aboutOpen);
} else if (panelBack.authBusy === true) {
  skip(revealed, 'the sign-in attempt was still out at Google ' + (Date.now() - tapAt)
    + 'ms after the tap — this machine reached accounts.google.com, so src/auth.js is waiting on '
    + 'the real library rather than on anything this work order built. The tap reached the module '
    + '(authState().busy is true); there is nothing to read until it answers.');
} else {
  check(revealed, false, 'the tap settled — authState().busy is false — and the Sync button is '
    + 'still not on the screen ' + (Date.now() - tapAt) + 'ms later: Sync shown = '
    + (panelBack.syncBtn && panelBack.syncBtn.shown) + ', signedIn = '
    + panelBack.state.signedIn + ', About open = ' + panelBack.aboutOpen);
}

/* ── the fixture, put back by hand ── */
await evalJs(`(function(){
  window.planbook.store.update(function (d) { d.teacher.school = ${JSON.stringify(originalSchool || '')}; });
  return window.planbook.store.flush(); })()`);
await evalJs(`(function(){
  window.fetch = window.__realFetch;
  delete window.__realFetch;
  delete window.__drive;
  delete window.google;
  window.planbook.auth.disconnect();
  return 1; })()`);
await shutModals();
const handedBack = await evalJs(`(function(){
  var doc = window.planbook.store.getDoc();
  return { school: doc.teacher.school,
    fetchIsNative: /\\[native code\\]/.test(String(window.fetch)),
    driveGone: typeof window.__drive === 'undefined'
      && typeof window.__realFetch === 'undefined',
    signedIn: window.planbook.auth.authState().signedIn,
    aboutOpen: (function () { var m = document.getElementById('aboutModal');
      return !!(m && !m.classList.contains('hidden')); })(),
    coarse: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) }; })()`);
check('this section handed the page back the way it found it — the browser’s own fetch restored '
  + 'and the stand-in Drive gone from the window, no session held, the About panel shut, the '
  + 'pointer fine again, and the one field it typed into the year document put back: everything '
  + 'after this line reads a device this block is not still standing in the middle of',
  handedBack.fetchIsNative === true && handedBack.driveGone === true
    && handedBack.signedIn === false && handedBack.aboutOpen === false
    && handedBack.coarse === false
    && handedBack.school === (originalSchool || ''),
  JSON.stringify(handedBack) + ', the stand-in Drive was ' + installed
    + ', teacher.school started as ' + JSON.stringify(originalSchool));
}
