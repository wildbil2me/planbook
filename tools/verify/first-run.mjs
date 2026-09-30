/* first-run.mjs — a fresh device opens the year it already has in Google Drive (WO-7.9)
 *
 * A section of its own rather than more of `drive-sync.mjs`, for the reason `tools/README.md` gives
 * about where a check goes: this is a different SURFACE — the home screen's empty state and a dialog
 * of its own — over the same transfer, and it needs a thing no other section needs: A FRESH DEVICE.
 *
 * ══════════ HOW A FRESH DEVICE IS MADE WITHOUT TOUCHING THE RUN'S FIXTURE ══════════
 *
 * Every other section shares one document at `http://127.0.0.1:<port>`, built up over a thousand
 * checks, and a first-run door is only ever drawn on a device holding nothing. Emptying that
 * document would cost every section after this one its fixture. So this section never touches it:
 * it drives the app at `http://localhost:<port>` — the same server, the same files, and A DIFFERENT
 * ORIGIN, which is to say a different IndexedDB, a different localStorage and a different service
 * worker. As far as the app can tell, that is another device. `localhost` is also one of the hosts
 * src/auth.js's flag opens, so the Drive door is drawn there as it is on the deployed origin.
 * Between arms the origin is wiped with `Storage.clearDataForOrigin`, from `about:blank` so that no
 * open connection holds the database, and at the foot it is wiped again and the page is handed back
 * at 127.0.0.1 through the harness's own `load()`, with the fixture asserted untouched.
 *
 * WHAT NO PAGE CAN BE SERVED FROM is the iPad's LAN address, where only the backup door may be drawn.
 * That arm is asked of src/first-run.js's doorsFor() — the pure function paint() draws for the page's
 * own host — which is src/auth.js's hostAllowsSignIn() argument and WO-7.4's precedent, and it is said
 * here rather than passed off as a page measured on that host.
 *
 * ══════════ THE STAND-INS ══════════
 *
 * Google's library, as `verify/sync-button.mjs` stands it in: a page-start script, inert unless this
 * section has written its configuration into sessionStorage, that records per request whether it was
 * made in the click listener's own stack. And a Drive in `window.fetch`, as `verify/drive-sync.mjs`
 * stands one up, grown by the one operation this work order adds — a list of every file, which the
 * two Drives in those sections do not answer. Nothing in `src/` knows either exists.
 *
 * WHAT STAYS OWED TO A HUMAN: the two 👤 lines. Google's real window opening on the iPad with the
 * pop-up blocker on, the laptop's grades on the iPad's screen, and a real backup file through a real
 * Files picker. What this proves is the state machine and that the sign-in is asked inside the tap.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, load, netLog, waitForBoot, KILL_ANIM, INSTALL_WALKER } = h;

console.log('\n--- the first-run doors (WO-7.9) ---');

if (!h.seam) {
  skip('the first-run doors (WO-7.9)', 'window.planbook is not on the page, so nothing below can '
    + 'read the untouched test, stand up a Drive or read what a pull decided');
  return;
}

const FRESH = 'http://localhost:' + h.PORT;
const FAKE_KEY = 'wo79-fake-gis';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── the run's own fixture, fingerprinted before anything here moves ── */

await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
const fixtureBefore = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { origin: location.origin, docId: d.docId, year: d.year, rev: d.rev,
    classes: d.classes.length, students: d.students.length }; })()`);

/* ══════════ Acceptance 1 — which doors, by host (the pure half) ══════════ */

const table = await evalJs(`(function(){ var f = window.planbook.firstRun.doorsFor; return {
  loopback: f(true, '127.0.0.1'), localhost: f(true, 'localhost'),
  deployed: f(true, 'planbook.hwgteach.com'), lan: f(true, '192.168.1.50'), lan2: f(true, '10.0.0.12'),
  nearMiss: f(true, 'hwgteach.com'), touched: f(false, 'planbook.hwgteach.com'),
  truthy: f(1, 'localhost') }; })()`);
const both = (x) => !!x && x.backup === true && x.drive === true;
const backupOnly = (x) => !!x && x.backup === true && x.drive === false;
const neither = (x) => !!x && x.backup === false && x.drive === false;
check('which doors a device draws is a function of two facts and nothing else: an untouched device '
  + 'draws both on loopback, localhost and the deployed origin, ONLY the backup door on a LAN address '
  + '(the iPad reaching the laptop) or any host the OAuth client does not list, and a device that is '
  + 'not proved untouched draws neither — asked of doorsFor(), which paint() draws for the page’s own '
  + 'host, because no page in a harness can be served from the iPad’s LAN address (WO-7.9 '
  + 'Acceptance 1)',
  both(table.loopback) && both(table.localhost) && both(table.deployed)
    && backupOnly(table.lan) && backupOnly(table.lan2) && backupOnly(table.nearMiss)
    && neither(table.touched) && neither(table.truthy),
  JSON.stringify(table));

/* THE RUN'S OWN DEVICE IS NOT UNTOUCHED, and it is asked two ways: the store's proof, and the paint
   told outright that the empty state is up — which is the failure a door drawn on a stale answer would
   be. Neither may say yes over a year holding classes. */
const onFixture = await evalJs(`(async function(){
  var u = await window.planbook.store.untouchedYear();
  var forced = await window.planbook.firstRun.refreshFirstRun(true);
  var b = document.getElementById('homeFirstRun');
  var years = await window.planbook.store.listYears();
  return { untouched: u, forced: forced, hidden: !!b && b.classList.contains('hidden'),
    classes: window.planbook.store.getDoc().classes.length, years: years.length }; })()`);
check('the run’s own device — classes, students, hundreds of saves — is not untouched by the store’s '
  + 'proof, and the doors stay down even when the paint is told the empty state is on screen, so a '
  + 'door cannot be drawn over a year that has anything in it (WO-7.9 Acceptance 1, Traps)',
  onFixture.untouched === null && onFixture.forced === false && onFixture.hidden === true
    && onFixture.classes > 0,
  JSON.stringify(onFixture));
/* Put the doors back to what the fixture page's own paint says, which is what they were. */
await evalJs('window.planbook.firstRun.refreshFirstRun(false); 1');

/* ── the fresh device ── */

const FAKE_GIS = `(function(){
  var raw = null;
  try { raw = sessionStorage.getItem(${JSON.stringify(FAKE_KEY)}); } catch (e) {}
  if (!raw) return;
  var cfg = JSON.parse(raw);
  var f = window.__fakeGis = { visible: cfg.visible, calls: [], n: 0 };
  window.google = { accounts: { oauth2: {
    initTokenClient: function (c) {
      return { requestAccessToken: function (o) {
        var limit = Error.stackTraceLimit;
        Error.stackTraceLimit = 80;
        var stack = String(new Error().stack || '');
        Error.stackTraceLimit = limit;
        var ev = window.event;
        f.calls.push({ silent: !!(o && o.prompt === ''), inClick: !!(ev && ev.type === 'click'),
          inListener: /\\/src\\/shell\\.js/.test(stack) });
        setTimeout(function () {
          if (f.visible === 'grant') {
            c.callback({ access_token: 'wo79-fake-token-' + (++f.n), expires_in: 3599,
              scope: c.scope, token_type: 'Bearer' });
          } else {
            c.error_callback({ type: 'popup_failed_to_open' });
          }
        }, 40);
      } };
    },
    revoke: function (t, cb) { if (cb) cb(); }
  } } };
})();`;
const fakeScript = await send('Page.addScriptToEvaluateOnNewDocument', { source: FAKE_GIS });

/*
  THE DRIVE. The four operations src/drive-sync.js already makes, plus the fifth this work order adds:
  a list with no `docId` in its query, which answers EVERY file — conflict copies and trashed files
  included, each carrying the fields Drive would send. The trashed file is answered on purpose even
  though the query asks Drive to leave it out: a real Drive honours `trashed = false`, so the query is
  asserted to carry it, and the file is sent anyway so that the module's own second filter is what
  keeps it off the list. Both halves, because either alone is one edit from nothing.
*/
const INSTALL_DRIVE = `(function(){
  if (window.__drive) return 'already';
  var d = { files: [], calls: [], nextId: 100 };
  window.__drive = d;
  window.__realFetch = window.fetch;
  function partsOf(ct, body) {
    var m = /boundary=(.+)$/.exec(ct || ''); if (!m) return null;
    var chunks = body.split('--' + m[1]), out = [];
    for (var i = 0; i < chunks.length; i++) {
      var at = chunks[i].indexOf('\\r\\n\\r\\n'); if (at < 0) continue;
      out.push(chunks[i].slice(at + 4).replace(/\\r\\n$/, ''));
    }
    return out.length >= 2 ? { meta: JSON.parse(out[0]), content: out[1] } : null;
  }
  function meta(f) {
    return { id: f.id, name: f.name, appProperties: f.appProperties, modifiedTime: f.at,
      trashed: !!f.trashed };
  }
  window.fetch = function (url, init) {
    var u = String(url);
    if (u.indexOf('googleapis.com') < 0) return window.__realFetch.apply(window, arguments);
    var method = (init && init.method) || 'GET';
    var q = decodeURIComponent((/[?&]q=([^&]*)/.exec(u) || [])[1] || '');
    d.calls.push({ method: method, upload: u.indexOf('/upload/') >= 0, q: q,
      media: /alt=media/.test(u) });
    if (method === 'GET' && u.indexOf('/drive/v3/files?') >= 0) {
      var want = (/value='([^']*)'/.exec(q) || [])[1];
      var hits = d.files.filter(function (f) {
        if (want === undefined) return true;
        return !f.trashed && f.appProperties && f.appProperties.docId === want;
      }).map(meta);
      return Promise.resolve(new Response(JSON.stringify({ files: hits }), { status: 200 }));
    }
    if (method === 'GET' && /alt=media/.test(u)) {
      var rid = decodeURIComponent(/\\/drive\\/v3\\/files\\/([^?]+)/.exec(u)[1]);
      var got = d.files.filter(function (f) { return f.id === rid; })[0];
      if (d.onMedia) { var hook = d.onMedia; d.onMedia = null; try { hook(); } catch (e) {} }
      return Promise.resolve(got ? new Response(got.body, { status: 200 })
        : new Response('no', { status: 404 }));
    }
    if (method === 'POST') {
      var made = partsOf(init.headers['Content-Type'], init.body);
      var file = { id: 'file-' + (d.nextId++), name: made.meta.name,
        appProperties: made.meta.appProperties || {}, body: made.content, at: new Date().toISOString() };
      d.files.push(file);
      return Promise.resolve(new Response(JSON.stringify({ id: file.id }), { status: 200 }));
    }
    if (method === 'PATCH') {
      var pid = decodeURIComponent(/\\/upload\\/drive\\/v3\\/files\\/([^?]+)/.exec(u)[1]);
      var t = d.files.filter(function (f) { return f.id === pid; })[0];
      var next = partsOf(init.headers['Content-Type'], init.body);
      if (t && next) { t.appProperties = next.meta.appProperties || t.appProperties; t.body = next.content; }
      return Promise.resolve(new Response(JSON.stringify({ id: pid }), { status: t ? 200 : 404 }));
    }
    return Promise.resolve(new Response('unhandled', { status: 501 }));
  };
  return 'installed'; })()`;

/*
  THE FILES, built in the page out of the app's own newYearDocument() so every body is a year this
  build would write. Each one that carries a class and a student carries SENTINELS — a class name, a
  student's name and a medical note nobody would type — so the list can be asserted to show nothing
  from inside a document. The live year is at rev 7 and is for the year the fresh device made, so
  opening it REPLACES the empty year; the renamed one is for the year before, carries its year only in
  `appProperties.year`, and opens BESIDE it.
*/
const PLANT = `(function(){
  var st = window.planbook.store, ro = window.planbook.roster;
  var here = st.getDoc().year;
  var start = Number(here.slice(0, 4));
  var prev = (start - 1) + '-' + start;
  function body(docId, year, rev, withWork, schema) {
    var d = st.newYearDocument(year);
    d.docId = docId; d.rev = rev;
    if (schema) d.schemaVersion = schema;
    if (withWork) {
      var s = ro.newStudent('Wosev', 'Sentinelle');
      s.id = 's_wo79x' + rev;
      s.supports.medical = 'WO79 MEDICAL SENTINEL';
      d.students.push(s);
      d.classes.push({ id: 'c_wo79x' + rev, name: 'WO79 Class Sentinel', archived: false,
        terms: [{ id: 'tm_wo79x' + rev, label: 'Q1', start: '', end: '' }], categories: [],
        letterScale: null, roster: [s.id] });
      d.teacher.school = 'WO79 school ' + docId;
    }
    return JSON.stringify(d);
  }
  var t = '2026-09-27T11:52:00.000Z';
  window.__drive.files = [
    { id: 'f-live', name: 'Planbook ' + here + '.json', at: t, body: body('wo79-live', here, 7, true),
      appProperties: { docId: 'wo79-live', rev: '7', deviceLabel: 'Windows PC' } },
    { id: 'f-conflict', name: 'Planbook ' + here + ' (conflict from iPad 2026-09-01).json', at: t,
      body: body('wo79-live', here, 5, true),
      appProperties: { conflictOf: 'wo79-live', rev: '5', conflictOn: '2026-09-01' } },
    { id: 'f-trashed', name: 'Planbook 2019-2020.json', at: t, trashed: true,
      body: body('wo79-trashed', '2019-2020', 3, true),
      appProperties: { docId: 'wo79-trashed', rev: '3', deviceLabel: 'Mac', year: '2019-2020' } },
    { id: 'f-prev', name: 'Renamed by the teacher.json', at: '2026-06-14T19:00:00.000Z',
      body: body('wo79-prev', prev, 4, true),
      appProperties: { docId: 'wo79-prev', rev: '4', deviceLabel: 'iPad', year: prev } },
    { id: 'f-broken', name: 'Planbook ' + here + '.json', at: t, body: 'this is not { json',
      appProperties: { docId: 'wo79-broken', rev: '2', deviceLabel: 'Windows PC', year: here } },
    { id: 'f-newer', name: 'Planbook ' + here + '.json', at: t,
      body: body('wo79-newer', here, 6, true, 99),
      appProperties: { docId: 'wo79-newer', rev: '6', deviceLabel: 'Windows PC', year: here } }
  ];
  return { here: here, prev: prev }; })()`;

/* One round trip for everything a check below reads off the fresh device. */
const READ = `(function(){
  function shown(el) { return !!el && !el.classList.contains('hidden') && el.getClientRects().length > 0; }
  function byId(id) { return document.getElementById(id); }
  var doc = window.planbook.store.getDoc();
  var empty = byId('homeEmpty');
  var note = byId('firstRunTestingNote');
  var pull = byId('drivePullModal'), conf = byId('drivePullConfirmModal');
  var status = byId('drivePullStatus'), lead = byId('drivePullConfirmLead');
  var sync = byId('syncBtn');
  var raw = null;
  try { raw = localStorage.getItem('planbook_driveSyncOptIn'); } catch (e) {}
  return {
    origin: location.origin,
    block: shown(byId('homeFirstRun')),
    drive: shown(byId('firstRunDriveBtn')),
    backup: shown(document.querySelector('#homeFirstRun [data-backup-panel]')),
    note: shown(note), noteText: note ? note.textContent : '',
    testing: window.planbook.auth.TESTING_MODE_NOTE,
    emptyShown: shown(empty), grid: shown(byId('homeGrid')),
    primaries: empty ? Array.prototype.filter.call(empty.querySelectorAll('.class-action-btn.primary'),
      function (b) { return shown(b); }).map(function (b) { return b.textContent.trim(); }) : [],
    doorPrimaries: document.querySelectorAll('#homeFirstRun .primary').length,
    docId: doc ? doc.docId : '', year: doc ? doc.year : '', rev: doc ? doc.rev : null,
    classes: doc ? doc.classes.length : -1, students: doc ? doc.students.length : -1,
    optIn: raw,
    syncBtn: sync ? { hidden: sync.classList.contains('hidden'), state: sync.getAttribute('data-sync-state') } : null,
    gisOnPage: !!(window.google && window.google.accounts),
    gisScripts: document.querySelectorAll('script[src*="accounts.google.com"]').length,
    pullOpen: !!pull && !pull.classList.contains('hidden'),
    confirmOpen: !!conf && !conf.classList.contains('hidden'),
    backupOpen: !!byId('backupModal') && !byId('backupModal').classList.contains('hidden'),
    status: status ? status.textContent.trim() : '', statusBad: !!status && status.className === 'class-error',
    signInShown: shown(byId('drivePullSignIn')),
    rows: Array.prototype.map.call(document.querySelectorAll('#drivePullList .year-row'),
      function (r) { return r.textContent.trim(); }),
    conflictNote: shown(byId('drivePullConflictNote')),
    lead: lead ? lead.textContent.trim() : '',
    confirmText: conf ? conf.textContent.replace(/\\s+/g, ' ').trim() : '',
    fake: window.__fakeGis ? window.__fakeGis.calls.slice() : null,
    driveCalls: window.__drive ? window.__drive.calls.slice() : null
  }; })()`;
const read = () => evalJs(READ);
/* WO-7.17: every non-empty sentence #srLive is given from here on, in order. src/live-region.js
   writes a tick after it is called and clears first on a repeat, so an observer — not a read after
   the fact — is what sees a sentence that a later one replaced. Started fresh on each call. */
const WATCH_LIVE = `(function(){
  var el = document.getElementById('srLive');
  if (window.__srWatch) window.__srWatch.disconnect();
  window.__srSaid = [];
  if (!el) return 0;
  window.__srWatch = new MutationObserver(function () {
    var t = (el.textContent || '').trim();
    if (t) window.__srSaid.push(t);
  });
  window.__srWatch.observe(el, { childList: true, characterData: true, subtree: true });
  return 1; })()`;
async function waitFor(pred, ms) {
  const until = Date.now() + (ms || 5000);
  let r = await read();
  while (Date.now() < until && !pred(r)) { await pause(80); r = await read(); }
  return r;
}
const untouched = () => evalJs('window.planbook.store.untouchedYear()');
const shutModals = () => evalJs("(function(){ Array.prototype.forEach.call("
  + "document.querySelectorAll('.modal-overlay:not(.hidden)'), function(m){"
  + " window.planbook.closeModal(m); }); return 1; })()");
const setFake = (visible) => evalJs(`(function(){ sessionStorage.setItem(${JSON.stringify(FAKE_KEY)},
  JSON.stringify({ visible: ${JSON.stringify(visible)} })); return 1; })()`);
/* A digest of the whole stored document, so "left as it was" is a claim about every byte. */
const DIGEST = `(async function(){
  var st = window.planbook.store, d = st.getDoc();
  var stored = await st.readStoredDocument(d.year);
  var json = JSON.stringify(stored || null), hash = 5381;
  for (var i = 0; i < json.length; i++) hash = ((hash * 33) ^ json.charCodeAt(i)) >>> 0;
  var years = await st.listYears();
  return { docId: d.docId, rev: d.rev, years: years, stored: 'chars:' + json.length + '|h:' + hash.toString(36) };
})()`;

/* A device made fresh: the origin wiped from `about:blank`, then the app booted on it. */
async function goFresh(wipe) {
  if (wipe) {
    await send('Page.navigate', { url: 'about:blank' });
    await pause(250);
    await send('Storage.clearDataForOrigin', { origin: FRESH, storageTypes: 'all' });
  }
  await send('Page.navigate', { url: FRESH + '/index.html' });
  await pause(800);
  const up = await waitForBoot();
  try { await evalJs(KILL_ANIM); await evalJs(INSTALL_WALKER); } catch (e) { /* the check reports it */ }
  return up;
}
/* A reload on the fresh device that loses nothing (tools/README.md trap 6): flush first. */
async function reloadFresh() {
  try { await evalJs('window.planbook.store.flush().then(function(){ return 1; })'); } catch (e) { /* no page */ }
  return goFresh(false);
}

/* ══════════ Acceptance 1 and 3 — a fresh device draws both doors, and asks Google nothing ══════════ */

await shutModals();
await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
netLog.length = 0;
await send('Network.enable');
const booted = await goFresh(true);
const fresh = await waitFor((r) => r.block, 5000);
await evalJs("document.dispatchEvent(new Event('visibilitychange')); 1");
await pause(1200);
const freshProof = await untouched();
const freshYears = await evalJs('window.planbook.store.listYears()');
const quiet = await read();
const googleQuiet = netLog.filter((r) => /^https?:\/\/accounts\.google\.com\//i.test(r.url));
const ownQuiet = netLog.filter((r) => r.url.indexOf(FRESH) === 0);
check('a fresh device — a new origin, whose only document is the empty year boot() just made — draws '
  + 'both doors inside the empty state, under “Add your first class”, which stays the one primary '
  + 'button on the screen; the Drive door carries TESTING_MODE_NOTE under it, word for word; and the '
  + 'store proves the device untouched — one year on the device, rev 1, that year open (WO-7.9 '
  + 'Acceptance 1, ruling 2)',
  booted === true && fresh.origin === FRESH && fresh.block === true && fresh.drive === true
    && fresh.backup === true && fresh.emptyShown === true && fresh.grid === false
    && fresh.primaries.length === 1 && /Add your first class/.test(fresh.primaries[0])
    && fresh.doorPrimaries === 0
    && (fresh.testing ? fresh.note === true && fresh.noteText === fresh.testing : fresh.note === false)
    && !!freshProof && freshProof.docId === fresh.docId && fresh.rev === 1
    && Array.isArray(freshYears) && freshYears.length === 1 && freshYears[0] === fresh.year,
  'booted = ' + booted + ', ' + JSON.stringify({ origin: fresh.origin, block: fresh.block,
    drive: fresh.drive, backup: fresh.backup, note: fresh.note, empty: fresh.emptyShown,
    primaries: fresh.primaries, doorPrimaries: fresh.doorPrimaries, rev: fresh.rev })
    + '; untouchedYear() = ' + JSON.stringify(freshProof) + '; years = ' + JSON.stringify(freshYears));

check('and a fresh device that takes neither door boots, draws and behaves as today: through a launch '
  + 'and a return to view it asks accounts.google.com for nothing — measured on the wire — puts no '
  + 'Google library on the page, draws no header sync button and stores no opt-in; the library loads '
  + 'only on a sign-in tap (here, the Drive door), never when the door is drawn (WO-7.9 Acceptance 3, '
  + 'Traps 1)',
  googleQuiet.length === 0 && ownQuiet.length > 5 && quiet.gisOnPage === false
    && quiet.gisScripts === 0 && quiet.optIn === null && !!quiet.syncBtn && quiet.syncBtn.hidden === true
    && quiet.block === true,
  googleQuiet.length + ' request(s) to accounts.google.com and ' + ownQuiet.length + ' to ' + FRESH
    + '; library on the page = ' + quiet.gisOnPage + ', Google script tags = ' + quiet.gisScripts
    + ', opt-in = ' + JSON.stringify(quiet.optIn) + ', header sync button = ' + JSON.stringify(quiet.syncBtn));

/* THE DOORS UNDER A COARSE POINTER. Both are .class-action-btn, floored in src/shell.css's coarse
   block; measured here because verify/touch-targets.mjs runs on the fixture, where no door is ever
   drawn. Set and put back, the verify/worker-takeover.mjs way, in a finally so a throw cannot leave
   the rest of the run on the wrong pointer (TESTING.md § WO-1.56). */
const wasCoarse = await evalJs("matchMedia('(pointer: coarse)').matches");
let doorBoxes = null;
try {
  if (!wasCoarse) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  doorBoxes = await evalJs(`(function(){ function box(sel){ var e = document.querySelector(sel);
    if (!e) return null; var r = e.getBoundingClientRect(); return { w: r.width, h: r.height }; }
    return { coarse: matchMedia('(pointer: coarse)').matches, drive: box('#firstRunDriveBtn'),
      backup: box('#homeFirstRun [data-backup-panel]') }; })()`);
} finally {
  if (!wasCoarse) await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
check('both doors measure at least 44px both ways under a pointer that really is coarse',
  !!doorBoxes && doorBoxes.coarse === true && !!doorBoxes.drive && !!doorBoxes.backup
    && doorBoxes.drive.h >= 44 && doorBoxes.drive.w >= 44
    && doorBoxes.backup.h >= 44 && doorBoxes.backup.w >= 44,
  JSON.stringify(doorBoxes));

/* THE BACKUP DOOR IS THE EXISTING RESTORE — the same panel the header's ⤓ opens, by the same hook —
   and taking it still asks Google for nothing. */
await clickSel('#homeFirstRun [data-backup-panel]');
const backupDoor = await waitFor((r) => r.backupOpen, 2000);
const googleAfterBackup = netLog.filter((r) => /^https?:\/\/accounts\.google\.com\//i.test(r.url));
check('the backup door opens the existing Backup & restore panel — no second restore path — and taking '
  + 'it asks accounts.google.com for nothing either',
  backupDoor.backupOpen === true && googleAfterBackup.length === 0
    && await evalJs("!!document.querySelector('#backupModal [data-backup-file]')"),
  'backup panel open = ' + backupDoor.backupOpen + ', requests to accounts.google.com = '
    + googleAfterBackup.length);
await shutModals();

/* THE CHOICE ON TRAP 1, DRIVEN. With no library on the page and Google unreachable (blocked here,
   offline or behind a school filter on a real device), the Drive door's tap is what asks for the
   library — the only request to Google this device has made — and the dialog it opens says why
   nothing happened, in src/auth.js's own words, beside the button that taps again. No opt-in is set,
   because no sign-in succeeded. */
await send('Network.setBlockedURLs', { urls: ['*accounts.google.com*'] });
netLog.length = 0;
await clickSel('#firstRunDriveBtn');
const blockedTap = await waitFor((r) => r.pullOpen && r.statusBad, 6000);
const googleOnTap = netLog.filter((r) => /^https?:\/\/accounts\.google\.com\//i.test(r.url));
check('the Drive door’s tap is the first thing on a fresh device to ask for Google’s library, and when '
  + 'it cannot load the dialog says so in src/auth.js’s sentence, in red, beside a Sign in button that '
  + 'taps again — and nothing is stored (WO-7.9, the Trap 1 choice: reconnect()’s own path, never a '
  + 'preload on paint)',
  googleOnTap.some((r) => r.url.indexOf('https://accounts.google.com/gsi/client') === 0)
    && blockedTap.pullOpen === true && blockedTap.statusBad === true
    && /could not reach Google/.test(blockedTap.status) && blockedTap.signInShown === true
    && blockedTap.rows.length === 0 && blockedTap.optIn === null,
  googleOnTap.length + ' request(s) to accounts.google.com after the tap ('
    + JSON.stringify(googleOnTap.map((r) => r.url).slice(0, 2)) + '); dialog open = '
    + blockedTap.pullOpen + ', status = ' + JSON.stringify(blockedTap.status) + ' (red = '
    + blockedTap.statusBad + '), Sign in shown = ' + blockedTap.signInShown + ', opt-in = '
    + JSON.stringify(blockedTap.optIn));
await send('Network.setBlockedURLs', { urls: [] });
await send('Network.disable');
await shutModals();

/* ══════════ Acceptance 4 — a file that fails validation, or is from a newer build, is refused ══════════ */

await setFake('grant');
await reloadFresh();
await evalJs(INSTALL_DRIVE);
const planted = await evalJs(PLANT);
const beforeRefusals = await evalJs(DIGEST);
await waitFor((r) => r.drive, 4000);
await evalJs(WATCH_LIVE);
await clickSel('#firstRunDriveBtn');
const listed = await waitFor((r) => r.rows.length > 0 || r.statusBad, 6000);

/* WO-7.17 — WHAT A SCREEN READER HEARS ON THAT TAP. Every sentence the live region held from the tap
   to the list, not only the last one: the chain after the sign-in may announce again, and the
   sentence a teacher heard first is the one this is about. RED ON THE BUILD BEFORE IT, which said
   "Reconnected to Google Drive." to a device that had never been connected. */
const doorSaid = await evalJs('(window.__srSaid || []).slice()');
check('WO-7.17 — the Drive door’s first sign-in on a device that was never connected is announced as '
  + 'a connect, not a reconnect: the live region says “Connected to Google Drive.” and never '
  + '“Reconnected” (WO-7.17 deliverable 1)',
  doorSaid.indexOf('Connected to Google Drive.') >= 0 && !doorSaid.some((s) => /Reconnected/.test(s))
    && listed.optIn === 'true',
  'the live region said ' + JSON.stringify(doorSaid) + '; opt-in after = ' + JSON.stringify(listed.optIn));

/* THE SIGN-IN, INSIDE THE TAP, AND THE LIST. */
const listQuery = (listed.driveCalls || []).filter((c) => c.method === 'GET' && !c.media
  && c.q.indexOf("value='") < 0).map((c) => c.q);
const sentinel = /WO79|Sentinel|Wosev|MEDICAL/i;
check('the Drive door signs in inside the tap — one visible request, made in the click listener’s own '
  + 'stack — and a sign-in that succeeds sets the WO-7.5 opt-in, exactly as About’s Connect does '
  + '(WO-7.9 deliverables, Traps)',
  !!listed.fake && listed.fake.length === 1 && listed.fake[0].silent === false
    && listed.fake[0].inClick === true && listed.fake[0].inListener === true
    && listed.optIn === 'true' && listed.pullOpen === true,
  'requests to the stand-in library = ' + JSON.stringify(listed.fake) + ', opt-in = '
    + JSON.stringify(listed.optIn) + ', dialog open = ' + listed.pullOpen);

check('the list is every live Planbook year in Drive and only those — no conflict copy and no trashed '
  + 'file, the query asking Drive to leave trashed files out AND the module dropping one Drive sent '
  + 'anyway — each row a year, the device that last wrote it and a date, with the renamed file named '
  + 'by its year property rather than its name, and nothing from inside any document: no class, no '
  + 'student, no support note (WO-7.9 Acceptance 2, Traps)',
  listed.rows.length === 4 && listQuery.length === 1 && /trashed = false/.test(listQuery[0])
    && listed.rows.filter((t) => t.indexOf(planted.here) === 0).length === 3
    && listed.rows.filter((t) => t.indexOf(planted.prev) === 0 && /iPad/.test(t)).length === 1
    && listed.rows.every((t) => !/2019-2020|conflict|Renamed/i.test(t))
    && listed.rows.every((t) => !sentinel.test(t)) && listed.conflictNote === true
    && !/Renamed/.test(listed.rows.join(' ')),
  'rows = ' + JSON.stringify(listed.rows) + '; list query = ' + JSON.stringify(listQuery)
    + '; conflict note shown = ' + listed.conflictNote);

/* Pick a row by the docId it stands for, through the module's own rows. */
async function pick(docId) {
  /* The row order is the module's (newest year first, then newest write); find ours by asking the
     module's list in the page. */
  const at = await evalJs(`(async function(){
    var r = await window.planbook.driveSync.listDriveYears();
    for (var i = 0; i < r.rows.length; i++) if (r.rows[i].docId === ${JSON.stringify(docId)}) return i;
    return -1; })()`);
  if (at < 0) throw new Error('no row for ' + docId);
  await clickSel('#drivePullList .year-row', at);
  await waitFor((r) => r.confirmOpen, 2000);
  await clickSel('[data-first-run-open]');
  return waitFor((r) => !r.confirmOpen, 6000);
}

const broken = await pick('wo79-broken');
const afterBroken = await evalJs(DIGEST);
const brokenMark = await evalJs("window.planbook.store.readSyncState('wo79-broken')");
const newer = await pick('wo79-newer');
const afterNewer = await evalJs(DIGEST);
const stillUntouched = await untouched();
const sameDoc = (a, b) => a.docId === b.docId && a.rev === b.rev && a.stored === b.stored
  && JSON.stringify(a.years) === JSON.stringify(b.years);
check('a file in Drive that is not a Planbook year, and one written by a newer build, are each refused '
  + 'in a sentence in the dialog — parseBackup()’s own, ending “Nothing on this device has been '
  + 'changed” — and the untouched year is left byte for byte as it was, still untouched, with no '
  + 'bookmark written (WO-7.9 Acceptance 4)',
  broken.statusBad === true && /not a Planbook backup/.test(broken.status)
    && /Nothing on this device has been changed/.test(broken.status)
    && newer.statusBad === true && /newer version of Planbook/.test(newer.status)
    && /Nothing on this device has been changed/.test(newer.status)
    && sameDoc(beforeRefusals, afterBroken) && sameDoc(beforeRefusals, afterNewer)
    && !!stillUntouched && stillUntouched.docId === beforeRefusals.docId && brokenMark === null
    && newer.pullOpen === true,
  'broken → ' + JSON.stringify(broken.status) + '; newer → ' + JSON.stringify(newer.status)
    + '; before ' + JSON.stringify(beforeRefusals) + ', after ' + JSON.stringify(afterNewer)
    + '; still untouched = ' + JSON.stringify(stillUntouched) + '; bookmark for the broken file = '
    + JSON.stringify(brokenMark));

/* ══════════ Acceptance 2 — opening one, and the sync straight after ══════════ */

const pulled = await pick('wo79-live');
const landed = await waitFor((r) => r.docId === 'wo79-live' && !r.pullOpen && r.grid, 6000);
const pulledMark = await evalJs("window.planbook.store.readSyncState('wo79-live')");
const pulledYears = await evalJs('window.planbook.store.listYears()');
const freshnessNow = await evalJs('window.planbook.driveSync.freshnessOf(window.planbook.driveSync.syncState())');
await evalJs('window.__drive.calls = []; 1');
const after = await evalJs('window.planbook.driveSync.syncNow()');
const afterCalls = await evalJs('window.__drive.calls.slice()');
const writes = afterCalls.filter((c) => c.method !== 'GET');
check('opening the live year leaves this device holding THAT document — its own docId, the remote’s '
  + 'rev, in place of the empty year of the same label — current by the freshness reading, with a '
  + 'bookmark at the remote’s rev; and a sync straight after is in-sync and writes nothing to Drive, '
  + 'which is the whole difference between a pull and a restore (WO-7.9 Acceptance 2)',
  pulled.confirmOpen === false && landed.docId === 'wo79-live' && landed.rev === 7
    && landed.year === planted.here && landed.classes === 1
    && Array.isArray(pulledYears) && pulledYears.length === 1 && pulledYears[0] === planted.here
    && !!pulledMark && pulledMark.docId === 'wo79-live' && pulledMark.baseRev === 7
    && freshnessNow === 'current'
    && !!after && after.kind === 'in-sync' && writes.length === 0 && afterCalls.length >= 1,
  'open document = ' + JSON.stringify({ docId: landed.docId, rev: landed.rev, year: landed.year,
    classes: landed.classes }) + ', years = ' + JSON.stringify(pulledYears) + ', bookmark = '
    + JSON.stringify(pulledMark) + ', freshness = ' + freshnessNow + '; the sync after: '
    + JSON.stringify(after && { kind: after.kind, bad: after.bad }) + ' over ' + afterCalls.length
    + ' Drive call(s), ' + writes.length + ' of them a write ' + JSON.stringify(writes));

check('and the screen is the year that arrived: the class card is drawn, the doors are gone for good '
  + 'with the empty state, the header’s sync button reads up to date, and the backup nag is up — a '
  + 'year never downloaded on this device, so sync is not presented as a backup',
  landed.grid === true && landed.block === false && landed.emptyShown === false
    && !!landed.syncBtn && landed.syncBtn.hidden === false && landed.syncBtn.state === 'current'
    && await evalJs("(function(){ var n = document.getElementById('backupNag'); return !!n && !n.classList.contains('hidden'); })()"),
  JSON.stringify({ grid: landed.grid, doors: landed.block, empty: landed.emptyShown,
    syncBtn: landed.syncBtn }));

/* WO-7.17 — AND THE HEADER BUTTON'S RECONNECT KEEPS ITS SENTENCE. The same device, now opted in by the
   door above: a reload discards the token (memory only), the header's sync button is drawn, and its
   tap goes through the same reconnect() — on a device that WAS connected, so "Reconnected" is true
   there and must survive the change. The stand-in library is still granting (sessionStorage outlives
   the reload); the Drive is stood up again so the sync after the sign-in answers from here. */
await reloadFresh();
await evalJs(INSTALL_DRIVE);
await evalJs(PLANT);
const headerBefore = await waitFor((r) => !!r.syncBtn && r.syncBtn.hidden === false, 4000);
const signedOutFirst = await evalJs('window.planbook.auth.authState().signedIn');
await evalJs(WATCH_LIVE);
await clickSel('#syncBtn');
const headerUntil = Date.now() + 5000;
while (Date.now() < headerUntil
  && !(await evalJs('window.planbook.auth.authState().signedIn'))) await pause(80);
await pause(200);
const headerSaid = await evalJs('(window.__srSaid || []).slice()');
check('WO-7.17 — the header sync button’s tap, on a device that has connected before and was signed out '
  + 'by a reload, is still announced “Reconnected to Google Drive.” — the door above changed the first '
  + 'sign-in’s sentence and not this one (WO-7.17 Acceptance 3)',
  headerBefore.syncBtn && headerBefore.syncBtn.hidden === false && signedOutFirst === false
    && headerSaid.indexOf('Reconnected to Google Drive.') >= 0
    && headerSaid.indexOf('Connected to Google Drive.') < 0,
  'header button ' + JSON.stringify(headerBefore.syncBtn) + ', signed in before the tap = '
    + signedOutFirst + '; the live region said ' + JSON.stringify(headerSaid));
await evalJs("(function(){ if (window.__srWatch) window.__srWatch.disconnect(); return 1; })()");
await shutModals();

/* ══════════ the arms that make the proof fail closed ══════════ */

/* OPENS BESIDE: a year whose label differs does not replace the empty one. */
/* The stand-in's configuration is sessionStorage on THIS origin, so it is written after the wipe and
   read by the reload after it. */
await goFresh(true);
await setFake('grant');
await reloadFresh();
await evalJs(INSTALL_DRIVE);
await evalJs(PLANT);
const emptyYear = (await read()).year;
await waitFor((r) => r.drive, 4000);
await clickSel('#firstRunDriveBtn');
await waitFor((r) => r.rows.length > 0, 6000);
await pick('wo79-prev');
const beside = await waitFor((r) => r.docId === 'wo79-prev' && !r.pullOpen, 6000);
const besideYears = await evalJs('window.planbook.store.listYears()');
const besideEmpty = await evalJs(`window.planbook.store.readStoredDocument(${JSON.stringify(emptyYear)})`);
const besideMark = await evalJs("window.planbook.store.readSyncState('wo79-prev')");
check('a year from Drive whose label differs opens BESIDE the empty year, which stays on the device '
  + 'untouched at rev 1, and the year button names the year that opened',
  beside.docId === 'wo79-prev' && beside.year === planted.prev && beside.rev === 4
    && Array.isArray(besideYears) && besideYears.length === 2
    && !!besideEmpty && besideEmpty.rev === 1 && besideEmpty.classes.length === 0
    && !!besideMark && besideMark.baseRev === 4
    && await evalJs(`(function(){ var b = document.querySelector('.hdr-year-btn');
      return !!b && b.textContent.indexOf(${JSON.stringify(planted.prev)}) >= 0; })()`),
  'open = ' + JSON.stringify({ docId: beside.docId, year: beside.year, rev: beside.rev })
    + ', years = ' + JSON.stringify(besideYears) + ', the empty year on disk at rev '
    + (besideEmpty && besideEmpty.rev) + ', bookmark = ' + JSON.stringify(besideMark));

/* THE YEAR STOPS BEING UNTOUCHED BETWEEN THE LIST AND THE CONFIRM (the brief's trap 2): a class
   added while the dialog is open. The pull must refuse, and the class must still be there. */
await goFresh(true);
await setFake('grant');
await reloadFresh();
await evalJs(INSTALL_DRIVE);
await evalJs(PLANT);
await waitFor((r) => r.drive, 4000);
await clickSel('#firstRunDriveBtn');
await waitFor((r) => r.rows.length > 0, 6000);
const raced = await evalJs(`(async function(){
  var st = window.planbook.store;
  st.update(function (d) { d.classes.push({ id: 'c_wo79race', name: 'Added while the list was open',
    archived: false, terms: [], categories: [], letterScale: null, roster: [] }); });
  await st.flush();
  return { docId: st.getDoc().docId, rev: st.getDoc().rev }; })()`);
const racedResult = await pick('wo79-live');
const racedAfter = await read();
check('a year that stops being untouched while the list is open is not replaced: the pull refuses in '
  + 'a sentence, and the class that was added is still there on the same document',
  racedResult.statusBad === true && /already has something in it|Something was added/.test(racedResult.status)
    && racedAfter.docId === raced.docId && racedAfter.classes === 1 && racedAfter.rev === raced.rev
    && racedAfter.docId !== 'wo79-live',
  'refusal = ' + JSON.stringify(racedResult.status) + '; the document before '
    + JSON.stringify(raced) + ', after ' + JSON.stringify({ docId: racedAfter.docId,
      rev: racedAfter.rev, classes: racedAfter.classes }));
await shutModals();

/* AND THE SAME RACE ONE STEP LATER — a change typed WHILE THE FILE IS DOWNLOADING, after the first
   proof has passed. The Drive's download is the hook: it makes the edit as it answers, so the only
   thing between that edit and the replace is the second proof pullYear() takes after the network.
   Then the last line of defence on its own: store.adoptRemoteDocument() handed a guard naming a record
   that is not the one on disk refuses before it writes. */
await goFresh(true);
await setFake('grant');
await reloadFresh();
await evalJs(INSTALL_DRIVE);
await evalJs(PLANT);
await waitFor((r) => r.drive, 4000);
await clickSel('#firstRunDriveBtn');
await waitFor((r) => r.rows.length > 0, 6000);
const midBefore = await read();
await evalJs(`(function(){ window.__drive.onMedia = function () {
  window.planbook.store.update(function (d) { d.teacher.name = 'Typed while it was fetching'; }); };
  return 1; })()`);
const midResult = await pick('wo79-live');
await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
const midAfter = await read();
const midName = await evalJs("window.planbook.store.getDoc().teacher.name");
const guarded = await evalJs(`(async function(){
  var st = window.planbook.store, d = st.getDoc();
  var stranger = st.newYearDocument(d.year); stranger.docId = 'wo79-guard'; stranger.rev = 50;
  var before = JSON.stringify(await st.readStoredDocument(d.year));
  var threw = '';
  try { await st.adoptRemoteDocument(stranger, { docId: 'not-the-one-on-disk', rev: 1 }); }
  catch (e) { threw = String(e.message || e); }
  var after = JSON.stringify(await st.readStoredDocument(d.year));
  return { threw: threw, same: before === after, open: st.getDoc().docId === d.docId }; })()`);
check('a change typed while the year is downloading stops the pull at its second proof, after the '
  + 'network and before the replace — refused in a sentence, the typing kept — and the store’s own '
  + 'guard refuses an adoption over any record but the one proved untouched, writing nothing',
  midResult.statusBad === true && /Something was added/.test(midResult.status)
    && midAfter.docId === midBefore.docId && midAfter.docId !== 'wo79-live'
    && midName === 'Typed while it was fetching'
    && /has changed since Planbook checked it was empty/.test(guarded.threw)
    && guarded.same === true && guarded.open === true,
  'refusal = ' + JSON.stringify(midResult.status) + '; document ' + midBefore.docId + ' → '
    + midAfter.docId + ', name kept = ' + JSON.stringify(midName) + '; the guard: '
    + JSON.stringify(guarded));
await shutModals();

/* A STUDENT, A SAVE, A SECOND YEAR — each on a fresh device, then a reload, and the doors stay down.
   The student and the save are the sharp ones: the empty state is still on screen (no class), so the
   only thing keeping the doors down is the proof. */
const arms = {};
const ARM_JS = {
  student: `(async function(){ var st = window.planbook.store;
    st.update(function (d) { d.students.push(window.planbook.roster.newStudent('Only', 'Student')); });
    await st.flush(); return 1; })()`,
  save: `(async function(){ var st = window.planbook.store;
    st.update(function (d) { d.teacher.name = 'Mr Toomey'; });
    await st.flush(); return 1; })()`,
  secondYear: `(async function(){ var st = window.planbook.store;
    var start = Number(st.getDoc().year.slice(0, 4)) + 1;
    await st.createYear(start + '-' + (start + 1)); return 1; })()`,
  klass: `(async function(){ var st = window.planbook.store;
    st.update(function (d) { d.classes.push({ id: 'c_wo79arm', name: 'English III', archived: false,
      terms: [], categories: [], letterScale: null, roster: [] }); });
    await st.flush(); return 1; })()`,
};
for (const name of Object.keys(ARM_JS)) {
  await goFresh(true);
  const drawnFirst = (await waitFor((r) => r.block, 4000)).block;
  await evalJs(ARM_JS[name]);
  await reloadFresh();
  await pause(600);
  const r = await read();
  arms[name] = { drawnFirst: drawnFirst, doors: r.block, empty: r.emptyShown,
    proof: await untouched(), rev: r.rev };
}
check('a device with a student, with a single save of anything, with a second year, or with a class '
  + 'draws neither door — each measured on a fresh device that drew both a moment before, and the '
  + 'first two with the empty state still on screen, so the proof alone keeps them down (WO-7.9 '
  + 'Acceptance 1)',
  Object.keys(arms).length === 4 && Object.keys(arms).every((k) => arms[k].drawnFirst === true
    && arms[k].doors === false && arms[k].proof === null)
    && arms.student.empty === true && arms.save.empty === true && arms.secondYear.empty === true,
  JSON.stringify(arms));

/* ── hand the page back ── */

await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fakeScript.identifier });
await send('Page.navigate', { url: 'about:blank' });
await pause(250);
await send('Storage.clearDataForOrigin', { origin: FRESH, storageTypes: 'all' });
await load();
const fixtureAfter = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { origin: location.origin, docId: d.docId, year: d.year, rev: d.rev,
    classes: d.classes.length, students: d.students.length,
    gis: !!(window.google && window.google.accounts), drive: typeof window.__drive }; })()`);
check('the run’s own device was never touched: the page is back at 127.0.0.1 on the same document at '
  + 'the same rev, with no stand-in library and no stand-in Drive on it, and the fresh origin is wiped',
  fixtureAfter.origin === fixtureBefore.origin && fixtureAfter.docId === fixtureBefore.docId
    && fixtureAfter.rev === fixtureBefore.rev && fixtureAfter.classes === fixtureBefore.classes
    && fixtureAfter.students === fixtureBefore.students && fixtureAfter.gis === false
    && fixtureAfter.drive === 'undefined',
  'before ' + JSON.stringify(fixtureBefore) + ', after ' + JSON.stringify(fixtureAfter));
}
