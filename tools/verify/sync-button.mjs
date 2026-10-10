/* sync-button.mjs — the header says how fresh this device's sync is (WO-7.5)
 *
 * A section of its own rather than more of `drive-sync.mjs`, for the reason `tools/README.md` gives
 * about where a check goes: this is a different SURFACE — the header — over the same transfer, and
 * it reloads the page fourteen times, which that section never does. It runs directly after the two
 * Phase 7 sections and depends on them in one direction only: it reads the bookmark the transfer
 * section left in IndexedDB as "a device that synced before", and it hands the page back reloaded,
 * signed out, opted OUT, at the desktop viewport, with every stand-in it installed taken away.
 *
 * WHAT NO HARNESS CAN DO HERE, SAID FIRST. This browser has no Google account, so the real
 * handshake is unreachable, exactly as `drive-sign-in.mjs` opens by saying. So Google's library is
 * STOOD IN FOR — a page-start script puts a `window.google.accounts.oauth2` on the page before the
 * app's modules run, `src/auth.js`'s loadGis() finds it ready and appends nothing, and the stand-in
 * answers each request as this section tells it to. What it records is the point: whether each
 * request was silent or visible, and WHETHER IT ARRIVED INSIDE THE CLICK — `window.event` is the
 * click while a click listener's own stack is running and is gone by the first `.then`, which is
 * the line Safari's pop-up blocker draws. Nothing in `src/` knows the stand-in exists.
 *
 * TWO LINES OF THE WORK ORDER ARE 👤 AND NOTHING HERE CLOSES THEM: Google's real window opening on
 * the iPad with Safari's pop-up blocker on, and a reading legible at arm's length. What this proves
 * is that the request is made inside the gesture, which is the precondition; whether iPadOS agrees
 * is the owner's reading on hardware.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, load, netLog, KILL_ANIM } = h;

console.log('\n--- the header sync button (WO-7.5) ---');

if (!h.seam) {
  skip('the header sync button (WO-7.5)', 'window.planbook is not on the page, so nothing below can '
    + 'read the sign-in, the transfer or the bookmark the button is drawn from');
  return;
}

const PREF_KEY = 'planbook_driveSyncOptIn';
const FAKE_KEY = 'wo75-fake-gis';
const SCOPE_URL = 'https://www.googleapis.com/auth/drive.file';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── the stand-ins ── */

/* Google's library, on every new document while this section runs, and INERT unless this section
   has written its configuration into sessionStorage — so a reload made with the key absent is a page
   with no stand-in at all, which is what the wire checks below need. */
const FAKE_GIS = `(function(){
  var raw = null;
  try { raw = sessionStorage.getItem(${JSON.stringify(FAKE_KEY)}); } catch (e) {}
  if (!raw) return;
  var cfg = JSON.parse(raw);
  var f = window.__fakeGis = { silent: cfg.silent, visible: cfg.visible, calls: [], revokes: [], n: 0 };
  window.google = { accounts: { oauth2: {
    initTokenClient: function (c) {
      return { requestAccessToken: function (o) {
        var silent = !!(o && o.prompt === '');
        var ev = window.event;
        /* IN THE LISTENER'S OWN STACK, which is the stricter of the two readings and the one that
           decides. \`window.event\` alone is NOT enough, and the mutation round proved it: a request
           made one \`.then\` late still sees the click there, because the microtask checkpoint runs
           before dispatch restores \`window.event\`. So the stack is read too — with the limit raised
           so a deep call chain cannot push the frame off the end — and a request made in the click
           listener's own stack has src/shell.js in it, where one made from a microtask does not. */
        var limit = Error.stackTraceLimit;
        Error.stackTraceLimit = 80;
        var stack = String(new Error().stack || '');
        Error.stackTraceLimit = limit;
        f.calls.push({ silent: silent, inClick: !!(ev && ev.type === 'click'),
          inListener: /\\/src\\/shell\\.js/.test(stack), at: Date.now() });
        var mode = silent ? f.silent : f.visible;
        setTimeout(function () {
          if (mode === 'grant') {
            c.callback({ access_token: 'wo75-fake-token-' + (++f.n), expires_in: 3599,
              scope: c.scope, token_type: 'Bearer' });
          } else {
            /* 'block' is a browser's pop-up blocker whichever kind of request it was — the sentence
               WO-7.10 is about; 'deny' keeps WO-7.5's split, a blocked silent attempt and a visible
               window closed unfinished. */
            c.error_callback({ type: mode === 'block' || silent ? 'popup_failed_to_open' : 'popup_closed' });
          }
        }, 60);
      } };
    },
    /* Counted since WO-7.11, whose signed-in tap must attempt one and whose signed-out tap none. */
    revoke: function (t, cb) { f.revokes.push(String(t)); if (cb) cb(); }
  } } };
})();`;
const fakeScript = await send('Page.addScriptToEvaluateOnNewDocument', { source: FAKE_GIS });

/* The Drive, the same four operations `drive-sync.mjs` stands up, installed after each reload that
   needs one. A `delay` holds every response, which is how a transfer is caught in flight. */
const INSTALL_DRIVE = `(function(){
  if (window.__drive) return 'already';
  var d = { files: [], calls: 0, nextId: 1, failNext: null, delay: 0 };
  window.__drive = d;
  window.__realFetch = window.fetch;
  function later(v) { return new Promise(function (r) { setTimeout(function () { r(v); }, d.delay); }); }
  function partsOf(ct, body) {
    var m = /boundary=(.+)$/.exec(ct || ''); if (!m) return null;
    var chunks = body.split('--' + m[1]), out = [];
    for (var i = 0; i < chunks.length; i++) {
      var at = chunks[i].indexOf('\\r\\n\\r\\n'); if (at < 0) continue;
      out.push(chunks[i].slice(at + 4).replace(/\\r\\n$/, ''));
    }
    return out.length >= 2 ? { meta: JSON.parse(out[0]), content: out[1] } : null;
  }
  window.fetch = function (url, init) {
    var u = String(url);
    if (u.indexOf('googleapis.com') < 0) return window.__realFetch.apply(window, arguments);
    var method = (init && init.method) || 'GET';
    d.calls++;
    if (typeof d.failNext === 'number') {
      return later(new Response('{"error":{"message":"planted"}}', { status: d.failNext }));
    }
    if (method === 'GET' && u.indexOf('/drive/v3/files?') >= 0) {
      var q = decodeURIComponent((/[?&]q=([^&]*)/.exec(u) || [])[1] || '');
      var want = (/value='([^']*)'/.exec(q) || [])[1] || '';
      var hits = d.files.filter(function (f) { return f.appProperties.docId === want; })
        .map(function (f) { return { id: f.id, name: f.name, appProperties: f.appProperties }; });
      return later(new Response(JSON.stringify({ files: hits }), { status: 200 }));
    }
    if (method === 'GET' && /alt=media/.test(u)) {
      var rid = decodeURIComponent(/\\/drive\\/v3\\/files\\/([^?]+)/.exec(u)[1]);
      var got = d.files.filter(function (f) { return f.id === rid; })[0];
      return later(got ? new Response(got.body, { status: 200 }) : new Response('no', { status: 404 }));
    }
    if (method === 'POST') {
      var made = partsOf(init.headers['Content-Type'], init.body);
      var file = { id: 'file-' + (d.nextId++), name: made.meta.name,
        appProperties: made.meta.appProperties || {}, body: made.content };
      d.files.push(file);
      return later(new Response(JSON.stringify({ id: file.id }), { status: 200 }));
    }
    if (method === 'PATCH') {
      var pid = decodeURIComponent(/\\/upload\\/drive\\/v3\\/files\\/([^?]+)/.exec(u)[1]);
      var t = d.files.filter(function (f) { return f.id === pid; })[0];
      var next = partsOf(init.headers['Content-Type'], init.body);
      if (t && next) { t.appProperties = next.meta.appProperties || t.appProperties; t.body = next.content; }
      return later(new Response(JSON.stringify({ id: pid }), { status: t ? 200 : 404 }));
    }
    return later(new Response('unhandled', { status: 501 }));
  };
  return 'installed'; })()`;

/* ── reading the header ── */

const READ = `(function(){
  var b = document.getElementById('syncBtn');
  var a = document.getElementById('aboutBtn');
  var ab = document.getElementById('aboutSyncBadge');
  var badge = b ? b.querySelector('[data-sync-badge]') : null;
  function box(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
      left: Math.round(r.left * 100) / 100, right: Math.round(r.right * 100) / 100,
      laid: el.getClientRects().length > 0 };
  }
  var raw = null;
  try { raw = localStorage.getItem(${JSON.stringify(PREF_KEY)}); } catch (e) {}
  var s = window.planbook.driveSync.syncState();
  var au = window.planbook.auth.authState();
  var actions = document.querySelector('.header-actions');
  var laidButtons = actions ? Array.prototype.filter.call(actions.querySelectorAll('button'),
    function (x) { return x.getClientRects().length > 0; }).map(function (x) {
      return x.id || (x.hasAttribute('data-backup-panel') ? 'backup' : x.className); }) : [];
  var m = document.getElementById('aboutModal');
  return {
    hidden: !b || b.classList.contains('hidden'),
    state: b ? b.getAttribute('data-sync-state') : null,
    label: b ? b.getAttribute('aria-label') : null,
    title: b ? b.title : null,
    disabled: b ? b.disabled : null,
    badgeShown: !!(badge && badge.getClientRects().length > 0),
    badgeText: badge ? badge.textContent : '',
    btn: box(b), about: box(a), laidButtons: laidButtons,
    aboutLabel: a ? a.getAttribute('aria-label') : null,
    aboutBadgeShown: !!(ab && ab.getClientRects().length > 0),
    aboutBadgeText: ab ? ab.textContent : '',
    /* WO-1.71 moved it from last-before-About (WO-7.5's ruling 3) to beside Backup (ruling 1). */
    afterBackup: !!(b && b.previousElementSibling && b.previousElementSibling.hasAttribute('data-backup-panel')),
    optIn: raw,
    signedIn: au.signedIn, authBusy: au.busy, authError: au.lastError,
    statusClass: (document.getElementById('driveStatus') || {}).className || '',
    statusText: ((document.getElementById('driveStatus') || {}).textContent || '').trim(),
    syncLineClass: (document.getElementById('driveSyncStatus') || {}).className || '',
    syncLineText: ((document.getElementById('driveSyncStatus') || {}).textContent || '').trim(),
    outcome: s.outcome, busy: s.busy, bad: s.bad, localRev: s.localRev, baseRev: s.baseRev,
    lastSyncedAt: s.lastSyncedAt,
    fake: window.__fakeGis ? window.__fakeGis.calls.slice() : null,
    revokes: window.__fakeGis ? window.__fakeGis.revokes.slice() : null,
    /* The switch-off in About's Drive section (WO-7.11): whether it is drawn, laid out, and its word. */
    off: (function(){ var d = document.getElementById('driveDisconnectBtn');
      return d ? { shown: !d.classList.contains('hidden'), laid: d.getClientRects().length > 0,
        text: (d.textContent || '').trim() } : null; })(),
    gisOnPage: !!(window.google && window.google.accounts),
    gisScripts: document.querySelectorAll('script[src*="accounts.google.com"]').length,
    said: ((document.getElementById('srLive') || {}).textContent || '').trim(),
    driveCalls: window.__drive ? window.__drive.calls : null,
    aboutOpen: !!(m && !m.classList.contains('hidden')),
    coarse: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches),
    width: window.innerWidth
  }; })()`;
const read = () => evalJs(READ);

/* Polled, never slept (tools/README.md § CDP trap 5), and it hands back the reading it exited on. */
async function waitFor(pred, ms) {
  const until = Date.now() + (ms || 4000);
  let r = await read();
  while (Date.now() < until && !pred(r)) {
    await pause(80);
    r = await read();
  }
  return r;
}

const setFake = (silent, visible) => evalJs(`(function(){
  sessionStorage.setItem(${JSON.stringify(FAKE_KEY)}, JSON.stringify({ silent: ${JSON.stringify(silent)},
    visible: ${JSON.stringify(visible)} }));
  if (window.__fakeGis) { window.__fakeGis.silent = ${JSON.stringify(silent)};
    window.__fakeGis.visible = ${JSON.stringify(visible)}; }
  return 1; })()`);
const clearFake = () => evalJs(`(function(){ sessionStorage.removeItem(${JSON.stringify(FAKE_KEY)}); return 1; })()`);
const setOptIn = (v) => evalJs(v === null
  ? `(function(){ localStorage.removeItem(${JSON.stringify(PREF_KEY)}); return 1; })()`
  : `(function(){ localStorage.setItem(${JSON.stringify(PREF_KEY)}, ${JSON.stringify(JSON.stringify(v))}); return 1; })()`);
const shutModals = () => evalJs("(function(){ Array.prototype.forEach.call("
  + "document.querySelectorAll('.modal-overlay:not(.hidden)'), function(m){"
  + " window.planbook.closeModal(m); }); return 1; })()");
/* A reload that loses nothing (trap 6): flush the store first, every time. */
const reload = async () => {
  await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
  await load();
};
const visible = () => evalJs("document.dispatchEvent(new Event('visibilitychange')); 1");
const save = (school) => evalJs(`(function(){ window.planbook.store.update(function(d){
  d.teacher.school = ${JSON.stringify(school)}; }); return window.planbook.store.flush().then(function(){ return 1; }); })()`);
const tap = () => clickSel('#syncBtn');
const TIME = /^\d{1,2}:\d{2}(\s?[AP]M)?$/i;

const originalSchool = await evalJs('(window.planbook.store.getDoc().teacher || {}).school || ""');

/* ══════════ Acceptance 1 — a device that never connected ══════════ */

/*
  THE HEADER EXACTLY AS TODAY, AND NOTHING ASKED OF GOOGLE — FROM THE WIRE. WO-7.4's second line
  measured the same negative around the Connect tap; this one measures it around the two moments
  WO-7.5 added a request to — a launch and a return to view — on a device that has not opted in.
  The page is reloaded with the Network domain on and NO stand-in, so a request, if one were made,
  would be for the real library and would be on the wire.
*/
await shutModals();
await clearFake();
await setOptIn(null);
netLog.length = 0;
await send('Network.enable');
await reload();
await visible();
await pause(1500);
const never = await read();
const googleNever = netLog.filter((r) => /^https?:\/\/accounts\.google\.com\//i.test(r.url));
const ownNever = netLog.filter((r) => r.url.indexOf('http://127.0.0.1:') === 0);
check('a device that never connected draws the header exactly as it was — no sync button, no badge '
  + 'on About, About named only "About Planbook", the same four controls laid out (five until WO-1.71 '
  + 'took the sound switch into Settings) — and through a '
  + 'launch and a return to view it asks accounts.google.com for nothing, measured on the wire '
  + '(WO-7.5 Acceptance 1)',
  never.hidden === true && never.state === '' && never.aboutBadgeShown === false
    && never.aboutLabel === 'About Planbook' && never.optIn === null
    && JSON.stringify(never.laidButtons) === JSON.stringify(['backup', 'presentationBtn', 'yearButton', 'aboutBtn'])
    && googleNever.length === 0 && ownNever.length > 5 && never.fake === null,
  googleNever.length + ' request(s) to accounts.google.com and ' + ownNever.length
    + ' to this origin; sync button hidden = ' + never.hidden + ', About badge = '
    + never.aboutBadgeShown + ', About label = ' + JSON.stringify(never.aboutLabel)
    + ', laid-out controls = ' + JSON.stringify(never.laidButtons) + ', opt-in stored = '
    + JSON.stringify(never.optIn));

/*
  AND THE OPT-IN IS WHAT ASKS — the other half, and what keeps the zero above from passing by
  watching nothing. The same reload with the preference set asks for Google's library at launch. The
  request is BLOCKED at the browser rather than let through, so no real Google code runs on this page;
  a blocked request is still sent, so it is still on the wire.

  WHAT THE BUTTON READS WHEN IT CANNOT LOAD CHANGED AT WO-7.10. It used to land on `lapsed`, because a
  library that could not load was a launch-time renewal that failed. There is no launch-time renewal
  now — the load asks Google for nothing — so an offline launch reads what every launch reads with no
  token: the bookmark's freshness, with a label saying the tap signs in first. Never "Connecting…",
  which with nothing to connect would sit on the header for ever.
*/
await send('Network.setBlockedURLs', { urls: ['*accounts.google.com*'] });
await setOptIn(true);
netLog.length = 0;
await reload();
const blocked = await waitFor((r) => ['current', 'ahead', 'stale'].indexOf(r.state) >= 0, 6000);
const googleOpted = netLog.filter((r) => /^https?:\/\/accounts\.google\.com\//i.test(r.url));
check('and on a device that has opted in, the launch itself asks for Google’s library — the preload '
  + 'that lets a tap reach the sign-in in its own stack — and when that request cannot land (blocked '
  + 'here, offline on a real device) the app is on the glass anyway and the button reads the '
  + 'bookmark’s freshness, saying that its tap signs in first (WO-7.10)',
  googleOpted.some((r) => r.url.indexOf('https://accounts.google.com/gsi/client') === 0)
    && ['current', 'ahead', 'stale'].indexOf(blocked.state) >= 0 && blocked.hidden === false
    && blocked.signedIn === false && / Tap to sign in to Google and sync now\.$/.test(blocked.label),
  googleOpted.length + ' request(s) to accounts.google.com: '
    + JSON.stringify(googleOpted.map((r) => r.url).slice(0, 3)) + '; the button reads '
    + JSON.stringify(blocked.state) + ' — ' + JSON.stringify(blocked.label));
await send('Network.setBlockedURLs', { urls: [] });
await send('Network.disable');

/* ══════════ Acceptance 2 — the opt-in: Connect sets it, Disconnect clears it ══════════ */

await setOptIn(null);
await setFake('grant', 'grant');
await reload();
await visible();
await pause(400);
const fresh = await read();
check('with the stand-in library on the page and no opt-in, the launch and a return to view make no '
  + 'request of it at all — no silent renewal is attempted for a teacher who never chose sync',
  fresh.hidden === true && Array.isArray(fresh.fake) && fresh.fake.length === 0
    && fresh.signedIn === false,
  'requests the stand-in received = ' + JSON.stringify(fresh.fake) + ', button hidden = '
    + fresh.hidden);

await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
await clickSel('[data-drive-connect]');
const connected = await waitFor((r) => r.optIn === 'true' && r.hidden === false, 4000);
await shutModals();
check('a Connect that succeeds — the real button, tapped, answered by the stand-in — stores the '
  + 'opt-in as the JSON boolean `true` and draws the button in the same tap',
  connected.optIn === 'true' && connected.hidden === false && connected.signedIn === true
    && connected.state !== '' && connected.state !== 'lapsed',
  'stored ' + PREF_KEY + ' = ' + JSON.stringify(connected.optIn) + ', button hidden = '
    + connected.hidden + ', state = ' + connected.state + ', signed in = ' + connected.signedIn);

/*
  WO-7.10 ACCEPTANCE 1 — A LAUNCH AND A RETURN TO VIEW MAKE NO TOKEN REQUEST, counted at the stand-in's
  requestAccessToken() rather than on the wire, because the library itself still loads (the wire
  check above) and that load is expected. The stand-in is set to BLOCK every request it is handed,
  whichever kind — which is the laptop's browser, and the sequence the build found: under WO-7.5 this
  exact reload made one "silent" request with no tap behind it, the stand-in refused it as a pop-up
  blocker does, and the About panel said so in red; a return to view made another, and another. So a
  request here cannot pass quietly: it is on the count, and it is in red on the panel.
*/
await setFake('block', 'block');
await reload();
const survived = await waitFor((r) => ['current', 'ahead', 'stale'].indexOf(r.state) >= 0, 4000);
await pause(400);
const launched = await read();
await visible();
await pause(400);
await visible();
await pause(400);
const returned = await read();
check('WO-7.10 Acceptance 1 — the opt-in survives a reload, which is a sign-out (the token is '
  + 'memory-only), and on that opted-in device the launch and two returns to view make NO token '
  + 'request — zero calls to requestAccessToken(), counted at a stand-in that would have refused '
  + 'each one as a pop-up blocker — and the button is drawn reading the bookmark, never "Connecting…"',
  survived.optIn === 'true' && survived.hidden === false && survived.signedIn === false
    && Array.isArray(launched.fake) && launched.fake.length === 0
    && Array.isArray(returned.fake) && returned.fake.length === 0
    && ['current', 'ahead', 'stale'].indexOf(returned.state) >= 0
    && !/Connecting/.test(returned.label) && / Tap to sign in to Google and sync now\.$/.test(returned.label),
  'opt-in = ' + JSON.stringify(survived.optIn) + ', button hidden = ' + survived.hidden
    + '; requests after the launch = ' + JSON.stringify(launched.fake) + ', after two returns to view = '
    + JSON.stringify(returned.fake) + '; the button reads ' + returned.state + ' — '
    + JSON.stringify(returned.label));

await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
const launchPanel = await read();
await shutModals();
check('WO-7.10 Acceptance 3, its first half — a failed silent attempt can no longer set the red line: '
  + 'after that launch and those returns to view, with a stand-in that turns any request into "The '
  + 'browser blocked the Google sign-in window", About’s Drive section carries no red line and the '
  + 'sign-in holds no error — because nothing asked',
  launchPanel.aboutOpen === true && launchPanel.authError === ''
    && launchPanel.statusClass === 'class-hint' && /^Not connected\./.test(launchPanel.statusText)
    && launchPanel.syncLineClass !== 'class-error' && launchPanel.fake.length === 0,
  'status line ' + JSON.stringify(launchPanel.statusClass) + ' ' + JSON.stringify(launchPanel.statusText)
    + ', sync line ' + JSON.stringify(launchPanel.syncLineClass) + ', auth error '
    + JSON.stringify(launchPanel.authError) + ', requests ' + launchPanel.fake.length);
await setFake('grant', 'grant');

/* Every planbook_ key, and what the opt-in key holds — the "nothing but a boolean" half. */
const storeWith = await evalJs(`(function(){ var out = {};
  for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i);
    out[k] = String(localStorage.getItem(k)); } return out; })()`);
const tokenish = Object.keys(storeWith).filter((k) => /wo75-fake-token/.test(storeWith[k]));
check('and what reaches localStorage for it is one key holding a boolean and nothing else — no token '
  + 'anywhere in the store, and every key still ours',
  storeWith[PREF_KEY] === 'true' && tokenish.length === 0
    && Object.keys(storeWith).every((k) => k.indexOf('planbook_') === 0),
  PREF_KEY + ' = ' + JSON.stringify(storeWith[PREF_KEY]) + '; keys = '
    + JSON.stringify(Object.keys(storeWith)) + '; keys holding a token = ' + JSON.stringify(tokenish));

/* ══════════ WO-7.11 — sync switches off from where a teacher is after every launch: signed out ══════════

   Until WO-7.11 this block connected first, because the switch-off (About's Disconnect) was drawn only
   while signed in and since WO-7.10 a reload leaves an opted-in device signed OUT — so the teacher who
   wanted sync off had to finish Google's sign-in to reach the one control that clears the opt-in, and
   offline could not do it at all. The workaround is gone: the device here is exactly that one —
   reloaded above, opted in, no token — and the tap is made from there. Four readings, one per
   Acceptance line the harness can close: signed out and counted at the stand-in (1), the wire after a
   reload (4), offline with no library on the page (2), and signed in, which must still be today's
   Disconnect (3). */
const STOP_WORD = 'Stop syncing on this device';

/* ── WO-7.11 Acceptance 1: signed out, opted in, the stand-in counting every token request ── */
await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
const offBefore = await read();

/* THE SWITCH-OFF IN THE STATE IT IS NOW DRAWN IN, under a thumb. The touch sweep measures this
   element signed in, as "Disconnect"; signed out it carries a longer word and sits BESIDE Connect,
   which it never did before, in a row that does not wrap (`.modal-actions` is a plain flex row and
   `.class-action-btn` is nowrap). So both buttons are measured at a phone and at the iPad, under a
   coarse pointer: each 44 by 44, and the pair inside the panel with nothing scrolled sideways. */
const ACTIONS_BOX = `(function(){
  var p = document.querySelector('#aboutModal .modal-panel');
  var off = document.getElementById('driveDisconnectBtn');
  var con = document.getElementById('driveConnectBtn');
  function b(el) { var r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left),
      right: Math.round(r.right) }; }
  var pr = p.getBoundingClientRect();
  return { off: b(off), connect: b(con), panelLeft: Math.round(pr.left), panelRight: Math.round(pr.right),
    overflow: document.documentElement.scrollWidth - window.innerWidth }; })()`;
const offWidths = [];
for (const [w, hgt] of [[390, 844], [834, 1194]]) {
  await atWidth(w, hgt);
  offWidths.push(Object.assign({ at: w }, await evalJs(ACTIONS_BOX)));
}
await desktop();
const offWidthBad = offWidths.filter((m) => !(m.off.w >= 44 && m.off.h >= 44 && m.connect.h >= 44
  && m.off.left >= m.panelLeft && m.off.right <= m.panelRight
  && m.connect.left >= m.panelLeft && m.connect.right <= m.panelRight && m.overflow <= 0));
check('WO-7.11 — signed out, the switch-off and Connect sit side by side, and at 390×844 and at iPad '
  + 'width (834×1194) under a coarse pointer each is 44px tall (the switch-off 44 wide as well) and '
  + 'both lie inside the About panel with nothing scrolled sideways',
  offWidths.length === 2 && offWidthBad.length === 0,
  offWidths.map((m) => m.at + ': switch-off ' + m.off.w + 'x' + m.off.h + ' at ' + m.off.left + '–'
    + m.off.right + ', Connect ' + m.connect.w + 'x' + m.connect.h + ' at ' + m.connect.left + '–'
    + m.connect.right + ', panel ' + m.panelLeft + '–' + m.panelRight + ', overflow ' + m.overflow)
    .join(' · '));

/* Tapped only if drawn: a click on a hidden control lands at the viewport's corner (tools/README.md
   trap 3), and a miss must read as the red it is rather than as whatever sits there. */
if (offBefore.off && offBefore.off.shown) await clickSel('[data-drive-disconnect]');
const offAfter = await waitFor((r) => r.optIn === 'false' && r.hidden === true, 3000);
await pause(150);
const offSaid = await read();
await shutModals();
check('WO-7.11 Acceptance 1 — on an opted-in device with NO token, About draws the switch-off, worded for '
  + 'the state ("Stop syncing on this device", not "Disconnect" under "Not connected"), and one tap clears '
  + 'the opt-in, takes the header button off in the same tap and the switch-off off the open panel, and '
  + 'makes NO token request and no revoke — counted at the stand-in, as in WO-7.10',
  offBefore.aboutOpen === true && offBefore.signedIn === false && offBefore.optIn === 'true'
    && offBefore.hidden === false && !!offBefore.off && offBefore.off.shown === true
    && offBefore.off.laid === true && offBefore.off.text === STOP_WORD
    && /^Not connected\./.test(offBefore.statusText)
    && offAfter.optIn === 'false' && offAfter.hidden === true && offAfter.aboutOpen === true
    && offAfter.off.shown === false && offAfter.signedIn === false
    && Array.isArray(offAfter.fake) && offAfter.fake.length === offBefore.fake.length
    && offAfter.revokes.length === offBefore.revokes.length
    && offAfter.authError === '' && offAfter.statusClass === 'class-hint'
    && /^Google Drive sync is off on this device\./.test(offSaid.said) && !/Signed out/.test(offSaid.said),
  'before the tap: signed in = ' + offBefore.signedIn + ', opt-in = ' + JSON.stringify(offBefore.optIn)
    + ', switch-off = ' + JSON.stringify(offBefore.off) + ', status '
    + JSON.stringify(offBefore.statusText.slice(0, 40)) + '; after: opt-in = ' + JSON.stringify(offAfter.optIn)
    + ', header button hidden = ' + offAfter.hidden + ', switch-off = ' + JSON.stringify(offAfter.off)
    + ', token requests ' + (offBefore.fake || []).length + ' → ' + (offAfter.fake || []).length
    + ', revokes ' + (offBefore.revokes || []).length + ' → ' + (offAfter.revokes || []).length
    + ', announced ' + JSON.stringify(offSaid.said));

/* ── WO-7.11 Acceptance 4: the next launch is a never-opted-in device's, from the wire ──

   The measurement the never-connected check at the top of this section makes, with no stand-in on the
   page — and its positive control is the check just after that one: the same reload with the opt-in
   set asks for /gsi/client, so a zero here is a request that was not made rather than a recorder that
   was not listening. Google is blocked at the browser either way, so no real Google code runs on this
   page; a blocked request is still on the wire. */
await clearFake();
netLog.length = 0;
await send('Network.enable');
await send('Network.setBlockedURLs', { urls: ['*accounts.google.com*'] });
await reload();
await visible();
await pause(1500);
const offReload = await read();
const googleOffReload = netLog.filter((r) => /^https?:\/\/accounts\.google\.com\//i.test(r.url));
const ownOffReload = netLog.filter((r) => r.url.indexOf('http://127.0.0.1:') === 0);
check('WO-7.11 Acceptance 4 — a reload after switching off fetches nothing from Google: through the launch '
  + 'and a return to view /gsi/client is absent from the wire (no request to accounts.google.com at all), '
  + 'no Google script is on the page, and the header has no sync button — exactly a device that never '
  + 'opted in',
  googleOffReload.length === 0 && ownOffReload.length > 5 && offReload.optIn === 'false'
    && offReload.hidden === true && offReload.fake === null && offReload.gisOnPage === false
    && offReload.gisScripts === 0 && offReload.laidButtons.indexOf('syncBtn') < 0,
  googleOffReload.length + ' request(s) to accounts.google.com ('
    + JSON.stringify(googleOffReload.map((r) => r.url).slice(0, 3)) + ') and ' + ownOffReload.length
    + ' to this origin; opt-in = ' + JSON.stringify(offReload.optIn) + ', header button hidden = '
    + offReload.hidden + ', Google on the page = ' + offReload.gisOnPage + ', script tags = '
    + offReload.gisScripts);

/* ── WO-7.11 Acceptance 2: the same tap with the network refused ──

   Opted in again and reloaded with Google still blocked and no stand-in, so the launch's preload fails
   and the library is NOT on the page — an offline launch on a real device. Then the browser is taken
   offline outright and the tap is made with the wire recorder cleared: the claim is that the switch-off
   needs nothing from any network, so the wire during it is asserted EMPTY, not merely free of Google. */
await setOptIn(true);
await reload();
await waitFor((r) => r.hidden === false && ['current', 'ahead', 'stale'].indexOf(r.state) >= 0, 6000);
const OFFLINE = { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };
const ONLINE = { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };
await send('Network.emulateNetworkConditions', OFFLINE);
await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
const offlineBefore = await read();
const onLineFlag = await evalJs('navigator.onLine');
netLog.length = 0;
if (offlineBefore.off && offlineBefore.off.shown) await clickSel('[data-drive-disconnect]');
const offlineAfter = await waitFor((r) => r.optIn === 'false' && r.hidden === true, 3000);
await pause(300);
const offlineWire = netLog.slice();
await shutModals();
await send('Network.emulateNetworkConditions', ONLINE);
await send('Network.setBlockedURLs', { urls: [] });
await send('Network.disable');
check('WO-7.11 Acceptance 2 — with the network refused (the browser offline, Google’s library never '
  + 'loaded), the same tap still clears the opt-in and takes the header button away, and the wire is '
  + 'empty for the length of it: no request of any kind, to Google or anywhere else',
  onLineFlag === false && offlineBefore.gisOnPage === false && offlineBefore.signedIn === false
    && offlineBefore.optIn === 'true' && offlineBefore.hidden === false && !!offlineBefore.off
    && offlineBefore.off.shown === true && offlineBefore.off.text === STOP_WORD
    && offlineAfter.optIn === 'false' && offlineAfter.hidden === true && offlineAfter.off.shown === false
    && offlineWire.length === 0 && offlineAfter.gisOnPage === false,
  'navigator.onLine = ' + onLineFlag + ', Google on the page = ' + offlineBefore.gisOnPage
    + '; before: opt-in ' + JSON.stringify(offlineBefore.optIn) + ', switch-off '
    + JSON.stringify(offlineBefore.off) + '; after: opt-in ' + JSON.stringify(offlineAfter.optIn)
    + ', header button hidden = ' + offlineAfter.hidden + '; requests during the tap = '
    + JSON.stringify(offlineWire.map((r) => r.url).slice(0, 3)) + ' (' + offlineWire.length + ')');

/* ── WO-7.11 Acceptance 3: signed in, the tap is today's Disconnect ── */
await setFake('grant', 'grant');
await reload();
await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
await clickSel('[data-drive-connect]');
const inBefore = await waitFor((r) => r.signedIn && !r.authBusy && r.optIn === 'true', 4000);
const heldToken = await evalJs('window.planbook.auth.accessToken()');
await clickSel('[data-drive-disconnect]');
const inAfter = await waitFor((r) => r.optIn === 'false' && r.hidden === true, 3000);
await pause(150);
const inSaid = await read();
const tokenAfter = await evalJs('window.planbook.auth.accessToken()');
await shutModals();
const revoked = (inAfter.revokes || []).slice((inBefore.revokes || []).length);
check('WO-7.11 Acceptance 3 — signed in, the switch-off reads "Disconnect" and does what Disconnect '
  + 'always did: the token is dropped, a revoke of THAT token is attempted, the opt-in is cleared, and '
  + 'the header button leaves in the same tap — with no token request of its own',
  inBefore.signedIn === true && !!inBefore.off && inBefore.off.shown === true
    && inBefore.off.text === 'Disconnect' && typeof heldToken === 'string' && heldToken !== ''
    && inAfter.signedIn === false && tokenAfter === null
    && revoked.length === 1 && revoked[0] === heldToken
    && inAfter.optIn === 'false' && inAfter.hidden === true && inAfter.off.shown === false
    && Array.isArray(inAfter.fake) && inAfter.fake.length === inBefore.fake.length
    && /^Signed out of Google Drive\./.test(inSaid.said),
  'before: signed in = ' + inBefore.signedIn + ', switch-off ' + JSON.stringify(inBefore.off)
    + '; after: signed in = ' + inAfter.signedIn + ', token held = ' + (tokenAfter === null ? 'none' : 'STILL')
    + ', revokes made by the tap = ' + revoked.length + (revoked.length ? (revoked[0] === heldToken
      ? ' (of the token that was held)' : ' (of a DIFFERENT token)') : '') + ', opt-in = '
    + JSON.stringify(inAfter.optIn) + ', header button hidden = ' + inAfter.hidden
    + ', token requests during the tap = ' + ((inAfter.fake || []).length - (inBefore.fake || []).length)
    + ', announced ' + JSON.stringify(inSaid.said));

await reload();
const stayedOut = await read();
check('and after a reload the header is today’s and nothing is asked of the library — the opt-in still '
  + 'reads `false`',
  stayedOut.optIn === 'false' && stayedOut.hidden === true
    && Array.isArray(stayedOut.fake) && stayedOut.fake.length === 0,
  'after a reload: opt-in = ' + JSON.stringify(stayedOut.optIn) + ', hidden = ' + stayedOut.hidden
    + ', requests = ' + JSON.stringify(stayedOut.fake));

/* ══════════ the widths — Acceptance 4, measured in every state as it is reached ══════════ */

/* The top row's slack at 390×844 under a coarse pointer: the content box of `.header-top` less the
   two things in it and the gap between them. Taken first on a device that has NOT opted in — the
   figure the 640px block's comments record — and then in every state below; it must not move. */
const SLACK = `(function(){
  var top = document.querySelector('.header-top');
  var left = document.querySelector('.header-left');
  var actions = document.querySelector('.header-actions');
  var cs = getComputedStyle(top);
  var inner = top.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  var used = left.getBoundingClientRect().width + parseFloat(cs.columnGap || cs.gap || 0)
    + actions.getBoundingClientRect().width;
  return { slack: Math.round((inner - used) * 100) / 100,
    overflow: document.documentElement.scrollWidth - window.innerWidth }; })()`;

async function atWidth(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await evalJs('window.dispatchEvent(new Event("resize")); 1');
  await pause(300);
  await evalJs(KILL_ANIM);
}
async function desktop() {
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await evalJs('window.dispatchEvent(new Event("resize")); 1');
  await pause(250);
}

await atWidth(390, 844);
const baseSlack = await evalJs(SLACK);
const baseCoarse = await read();
await desktop();

const widths = [];
async function measureWidths(label) {
  await atWidth(390, 844);
  const phone = await read();
  const phoneSlack = await evalJs(SLACK);
  await atWidth(834, 1194);
  const pad = await read();
  const padSlack = await evalJs(SLACK);
  await desktop();
  widths.push({ label, phone, phoneSlack, pad, padSlack });
}

/* ══════════ Acceptance 3 — the six states, each with its reading and its tap ══════════ */

/* Opted in and signed in, with a Drive to talk to. */
await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
await clickSel('[data-drive-connect]');
await waitFor((r) => r.optIn === 'true' && r.signedIn, 4000);
await shutModals();
await evalJs(INSTALL_DRIVE);

/* CURRENT, reached by a tap. Whatever the bookmark said before, the tap syncs and the button reads
   the time it did. */
const beforeFirst = await read();
await tap();
const current = await waitFor((r) => r.state === 'current' && !r.busy, 5000);
check('a tap in any sync-now state syncs, and the button then reads the TIME it synced — "Synced '
  + 'with Google Drive at 9:41." — a clock time and never a countdown, with no badge and no state '
  + 'class: up to date is the quietest thing on the header',
  current.state === 'current' && /^Synced with Google Drive at (.+)\.$/.test(current.label.split(' Tap')[0])
    && TIME.test(current.label.split(' Tap')[0].replace(/^Synced with Google Drive at /, '').replace(/\.$/, ''))
    && current.label.endsWith(' Tap to sync now.') && current.title === current.label
    && current.badgeShown === false && current.driveCalls > 0
    && current.baseRev === current.localRev,
  'before the tap the button read ' + JSON.stringify(beforeFirst.state) + '; after: '
    + JSON.stringify(current.label) + ', badge = ' + current.badgeShown + ', Drive calls = '
    + current.driveCalls + ', baseRev ' + current.baseRev + ' / localRev ' + current.localRev);
await measureWidths('current');

/* AHEAD, after a save that has not synced — and gone again after one that has. */
await save('WO75-AHEAD-1');
const ahead = await waitFor((r) => r.state === 'ahead', 3000);
check('a save that has not synced turns it to "Changes on this device are not in Google Drive '
  + 'yet." — amber, a dot on the corner and NO NUMBER in it, because the save counter counts saves '
  + 'and not grades',
  ahead.state === 'ahead'
    && ahead.label === 'Changes on this device are not in Google Drive yet. Tap to sync now.'
    && ahead.badgeShown === true && ahead.badgeText === '' && ahead.localRev > ahead.baseRev,
  'state = ' + ahead.state + ', label = ' + JSON.stringify(ahead.label) + ', badge = '
    + ahead.badgeShown + ' reading ' + JSON.stringify(ahead.badgeText) + ', localRev '
    + ahead.localRev + ' over baseRev ' + ahead.baseRev);
await measureWidths('ahead');

await tap();
const cleared = await waitFor((r) => r.state === 'current' && !r.busy, 5000);
check('and a tap syncs it and the amber clears — "ahead" is gone after a sync that landed, and the '
  + 'bookmark now matches the document',
  cleared.state === 'current' && cleared.baseRev === cleared.localRev
    && cleared.badgeShown === false,
  'state = ' + cleared.state + ', baseRev ' + cleared.baseRev + ' / localRev ' + cleared.localRev);

/* SYNCING, caught in flight by holding every Drive response. A second tap does nothing. */
await save('WO75-AHEAD-2');
await waitFor((r) => r.state === 'ahead', 3000);
await evalJs('window.__drive.delay = 3500; 1');
await tap();
const inFlight = await waitFor((r) => r.state === 'syncing', 1500);
const callsInFlight = inFlight.driveCalls;
await clickSel('#syncBtn');
await pause(200);
const secondTap = await read();
check('while a transfer is out the button reads "Syncing with Google Drive…", its icon turns, and it '
  + 'is disabled — a second tap starts nothing',
  inFlight.state === 'syncing' && inFlight.label === 'Syncing with Google Drive…'
    && inFlight.disabled === true && inFlight.busy === true
    && secondTap.busy === true && secondTap.driveCalls === callsInFlight
    && secondTap.outcome !== 'busy',
  'state = ' + inFlight.state + ', label = ' + JSON.stringify(inFlight.label) + ', disabled = '
    + inFlight.disabled + '; Drive calls before the second tap ' + callsInFlight + ', after '
    + secondTap.driveCalls + ', outcome ' + JSON.stringify(secondTap.outcome));
await measureWidths('syncing');
await waitFor((r) => !r.busy && r.state === 'current', 9000);
await evalJs('window.__drive.delay = 0; 1');

/* FAILED, and its tap opens About at the Drive section. */
await save('WO75-FAIL');
await evalJs('window.__drive.failNext = 500; 1');
await tap();
const failed = await waitFor((r) => r.state === 'failed', 4000);
check('a sync that does not finish turns it to "The last sync did not finish. Nothing on this device '
  + 'changed." — a red outline and a mark, never a red fill, and never the save chip',
  failed.state === 'failed'
    && failed.label === 'The last sync did not finish. Nothing on this device changed. Tap for details.'
    && failed.badgeShown === true && failed.badgeText === '!' && failed.bad === true,
  'state = ' + failed.state + ', label = ' + JSON.stringify(failed.label) + ', badge '
    + JSON.stringify(failed.badgeText) + ', outcome ' + failed.outcome);
await measureWidths('failed');

/* Where the Drive section sits in what is showing. The OVERLAY is the scroller in this app
   (`.modal-overlay { overflow-y: auto }`), not the modal body, so the section's top edge is read
   against the viewport and the scroll against the overlay. A section at the foot of a panel cannot
   be scrolled higher than the panel's end allows, so "at the Drive section" is asserted as: its top
   edge is on the glass, and if the panel is taller than the glass, the overlay has scrolled to it. */
const DRIVE_IN_VIEW = `(function(){
  var p = document.getElementById('drivePanel');
  var o = document.getElementById('aboutModal');
  if (!p || !o) return null;
  var pr = p.getBoundingClientRect();
  return { top: Math.round(pr.top), viewport: window.innerHeight,
    scrolled: o.scrollTop, overflows: o.scrollHeight > o.clientHeight + 1 }; })()`;
const inView = (v) => !!v && v.top >= -2 && v.top < v.viewport - 80 && (!v.overflows || v.scrolled > 0);
await tap();
await pause(500);
const failTap = await read();
const failView = await evalJs(DRIVE_IN_VIEW);
check('and its tap opens About AT the Drive section — scrolled so the section is on the glass, where '
  + 'the reason is written and where Sync already is',
  failTap.aboutOpen === true && inView(failView),
  'About open = ' + failTap.aboutOpen + ', Drive section ' + JSON.stringify(failView));

/* The About panel's own Sync button clears it, and the header follows a sync from that door too. */
await evalJs('window.__drive.failNext = null; 1');
await clickSel('[data-drive-sync]');
const viaPanel = await waitFor((r) => r.state === 'current' && !r.busy, 5000);
await shutModals();
check('a sync from the About panel’s own button moves the header too — the button is a reading of the '
  + 'transfer, not of which door started it',
  viaPanel.state === 'current' && viaPanel.outcome !== '' && viaPanel.bad === false,
  'state = ' + viaPanel.state + ', outcome = ' + viaPanel.outcome);

/* ══════════ WO-7.7 — a download repaints the screen it lands under, and nothing else does ══════════

   HERE RATHER THAN IN drive-sync.mjs because this section is the one that drives BOTH DOORS as
   doors — the header button and About's Sync, each tapped — against a Drive it controls, and it is
   standing, opted in and signed in, at `current` by this line. The other section calls syncNow()
   directly, which is exactly the path that never had a screen repaint to forget.

   WHAT IS READ is the attendance register (#classView) of the class with the most students, and the
   thing planted is one student's LAST NAME in the Drive copy — the register draws rosterName(), so
   the new name is on the page or it is not. Read with no navigation between the tap and the reading:
   the About door's reading is taken with About still open over the register.

   AND WHETHER THE SCREEN WAS REDRAWN AT ALL is read with a sentinel rather than a mutation count,
   because a count would also see anything on that screen that changes on a schedule of its own and
   say nothing about which rows were replaced. Before each tap every leaf element carrying the student's name is held in a page
   variable; a redraw replaces them, so afterwards they are disconnected, and no redraw leaves every
   one of them in the document. THE DOWNLOAD CHECKS ARE THE SENTINEL'S POSITIVE CONTROL — the same
   reading goes to zero there — so the no-redraw checks below cannot pass over a sentinel that could
   never have seen one.

   THE ORDER IS THE BRIEF'S TRAP, AND WHAT IT CAN AND CANNOT CATCH IS MEASURED. The upload, the
   in-sync pass and the failure all come AFTER a download, so a sync that left the previous outcome
   standing would repaint here. But syncNow() settles on every path before it resolves, so by the
   time the repaint's chain runs `syncState().outcome` already names THIS sync — keying the repaint
   off that sticky field was run as a mutation and stayed green (TESTING.md § WO-7.7). What these
   three checks do catch is a repaint that is not gated at all. On today's syncNow() the sticky field
   and the resolved value cannot disagree at chain time; src/shell.js's afterDownload() reads the
   resolved value so that stays true if syncNow() ever changes. */
{
  /* Chosen by class rather than by tab index, and clicked by whichever copy of its tab is on the
     glass: a class's `data-class-tab` is carried by its home card AND by the header strip, and
     which of the two is laid out depends on the view the section above left open (clickVisible's
     trap, tools/verify-shell.mjs). */
  const pick = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var best = null, n = -1;
    doc.classes.forEach(function (c) {
      if (!document.querySelector('[data-class-tab="' + c.id + '"]')) return;
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c; }
    });
    var s = best && best.roster.length ? doc.students.filter(function (x) {
      return x.id === best.roster[0]; })[0] : null;
    return { tab: best ? best.id : '', students: n, id: s ? s.id : '',
      last: s ? String(s.last || '') : '', first: s ? String(s.first || '') : '' }; })()`);
  if (pick.tab) await clickVisible('[data-class-tab="' + pick.tab + '"]');
  await pause(300);

  const TAG = (name) => evalJs(`(function(){
    var v = document.getElementById('classView');
    if (!v || v.classList.contains('hidden')) { window.__wo77 = []; return 0; }
    window.__wo77 = Array.prototype.filter.call(v.querySelectorAll('*'), function (e) {
      return e.children.length === 0 && (e.textContent || '').indexOf(${JSON.stringify(name)}) >= 0; });
    return window.__wo77.length; })()`);
  const PAGE = (want, gone) => evalJs(`(function(){
    var v = document.getElementById('classView');
    var text = v ? v.textContent : '';
    var held = window.__wo77 || [];
    var m = document.getElementById('aboutModal');
    return { shown: !!(v && !v.classList.contains('hidden')),
      has: text.indexOf(${JSON.stringify(want)}) >= 0,
      stillHasOld: ${JSON.stringify(gone || '')} !== '' && text.indexOf(${JSON.stringify(gone || '')}) >= 0,
      held: held.length,
      kept: held.filter(function (e) { return e.isConnected; }).length,
      aboutOpen: !!(m && !m.classList.contains('hidden')) }; })()`);
  const PLANT = (last) => evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var f = window.__drive.files.filter(function (x) {
      return x.appProperties && x.appProperties.docId === doc.docId; })[0];
    if (!f) return { rev: 0, found: false };
    var body = JSON.parse(f.body);
    var rev = (Number(doc.rev) || 0) + 5;
    var found = false;
    body.rev = rev;
    body.students.forEach(function (s) {
      if (s.id === ${JSON.stringify(pick.id)}) { s.last = ${JSON.stringify(last)}; found = true; } });
    f.body = JSON.stringify(body);
    f.appProperties = Object.assign({}, f.appProperties, { rev: String(rev), deviceLabel: 'iPad' });
    return { rev: rev, found: found }; })()`);
  const settled = async (kind) => {
    const r = await waitFor((x) => !x.busy && x.outcome === kind, 6000);
    await pause(150);
    return r;
  };

  const HEADER = 'Wosevenseven-Header';
  const ABOUT = 'Wosevenseven-About';

  /* ── the header door, downloading ── */
  const before = await PAGE(pick.last);
  const heldA = await TAG(pick.last);
  const plantA = await PLANT(HEADER);
  await tap();
  const downA = await settled('downloaded');
  const pageA = await PAGE(HEADER, pick.last);
  check('WO-7.7 — a sync from the HEADER BUTTON that downloads redraws the open screen from the new '
    + 'document: a student’s name changed in the Drive copy is on the attendance register with no '
    + 'navigation between the tap and the reading, the old name is gone, and the rows that carried it '
    + 'were replaced — which is the sentinel below seeing a redraw when there is one',
    pick.students > 0 && pick.id !== '' && pick.last !== '' && before.shown === true && before.has === true
      && plantA.found === true && heldA > 0
      && downA.outcome === 'downloaded' && pageA.shown === true && pageA.has === true
      && pageA.stillHasOld === false && pageA.kept === 0,
    'class tab ' + pick.tab + ' with ' + pick.students + ' student(s); register shown before = '
      + before.shown + ', old name drawn before = ' + before.has + '; planted = '
      + JSON.stringify(plantA) + '; outcome = ' + downA.outcome + '; after: ' + JSON.stringify(pageA)
      + ' (held ' + heldA + ' before the tap)');

  /* ── the header door, not downloading: upload, in-sync, failure — each after a download ── */
  await save('WO77-UPLOAD');
  await waitFor((r) => r.state === 'ahead', 3000);
  const heldUp = await TAG(HEADER);
  await tap();
  const up = await settled('uploaded');
  const pageUp = await PAGE(HEADER);

  const heldSame = await TAG(HEADER);
  await tap();
  const same = await settled('in-sync');
  const pageSame = await PAGE(HEADER);

  const heldFail = await TAG(HEADER);
  await evalJs('window.__drive.failNext = 500; 1');
  await tap();
  const fail = await waitFor((r) => !r.busy && r.state === 'failed', 6000);
  await pause(150);
  const pageFail = await PAGE(HEADER);
  await evalJs('window.__drive.failNext = null; 1');

  check('WO-7.7 — an upload, an in-sync pass and a failure from the header button do NOT redraw the '
    + 'screen, each of them run directly after a download so the last settled outcome still reads '
    + '`downloaded` as it starts: every row that carried the name before the tap is still the row in '
    + 'the document after it',
    up.outcome === 'uploaded' && same.outcome === 'in-sync' && fail.bad === true
      && heldUp > 0 && heldSame > 0 && heldFail > 0
      && pageUp.kept === heldUp && pageSame.kept === heldSame && pageFail.kept === heldFail
      && pageUp.shown && pageSame.shown && pageFail.shown,
    'upload: outcome ' + up.outcome + ', rows kept ' + pageUp.kept + '/' + heldUp
      + ' · in-sync: outcome ' + same.outcome + ', kept ' + pageSame.kept + '/' + heldSame
      + ' · failure: outcome ' + fail.outcome + ' (bad ' + fail.bad + '), kept ' + pageFail.kept
      + '/' + heldFail);

  /* ── About's Sync, downloading — read with About still open over the register ── */
  const plantB = await PLANT(ABOUT);
  await clickSel('[data-modal-open="aboutModal"]');
  await pause(300);
  const heldB = await TAG(HEADER);
  await clickSel('[data-drive-sync]');
  const downB = await settled('downloaded');
  const pageB = await PAGE(ABOUT, HEADER);
  check('WO-7.7 — a sync from ABOUT’S OWN SYNC BUTTON that downloads redraws the screen behind the '
    + 'modal: the name changed in Drive is on the register, read while About is still open over it, '
    + 'and the rows that carried the old one were replaced',
    plantB.found === true && heldB > 0 && downB.outcome === 'downloaded'
      && pageB.aboutOpen === true && pageB.shown === true && pageB.has === true
      && pageB.stillHasOld === false && pageB.kept === 0,
    'planted = ' + JSON.stringify(plantB) + '; outcome = ' + downB.outcome + '; after: '
      + JSON.stringify(pageB) + ' (held ' + heldB + ' before the tap)');

  const heldSameB = await TAG(ABOUT);
  if (!(await PAGE(ABOUT)).aboutOpen) {
    await clickSel('[data-modal-open="aboutModal"]');
    await pause(300);
  }
  await clickSel('[data-drive-sync]');
  const sameB = await settled('in-sync');
  const pageSameB = await PAGE(ABOUT);
  await shutModals();
  check('WO-7.7 — and an in-sync pass from About’s Sync, straight after that download, does not '
    + 'redraw it',
    sameB.outcome === 'in-sync' && heldSameB > 0 && pageSameB.kept === heldSameB,
    'outcome ' + sameB.outcome + ', rows kept ' + pageSameB.kept + '/' + heldSameB);

  /* Handed back: the student's own name, synced so the header is at `current` again for LAPSED. */
  await evalJs(`(function(){ window.planbook.store.update(function (d) {
    d.students.forEach(function (s) {
      if (s.id === ${JSON.stringify(pick.id)}) s.last = ${JSON.stringify(pick.last)}; }); });
    return window.planbook.store.flush().then(function () { return 1; }); })()`);
  await waitFor((r) => r.state === 'ahead', 3000);
  await tap();
  await waitFor((r) => r.state === 'current' && !r.busy, 5000);
}

/* ══════════ WO-5.17 — a sync that downloads under an open draft closes it ══════════

   afterDownload() in src/shell.js runs afterRestore() whole, and afterRestore() calls
   outreachView.resetOutreach(): a draft is about a student in the document a download has just
   replaced. `verify/outreach.mjs` proves the restore half; this is the download half, HERE because
   this section owns the Drive stand-in and the WO-7.7 block above is standing at `current`, opted
   in and signed in.

   THE ORDER IS THE ONE A TEACHER CAN ACTUALLY PRODUCE. A modal covers the header, so nobody taps
   Sync with a draft already open — and a pointer event at the button's coordinate would land on the
   draft's backdrop and close it for the wrong reason. What she can do is tap Sync and open a draft
   while the transfer is still on the wire. So the stand-in's `delay` holds every Drive response,
   the header button is tapped (a real pointer event, nothing over it), the draft is opened from the
   student record's own door during the wait, and the precondition is READ, not assumed: the modal
   open with a non-empty body while the sync is still busy. Then the sync is let settle `downloaded`
   and the modal is read. Nothing here calls afterDownload(), afterRestore() or resetOutreach() —
   the work order's Traps line: a check that called the function would pass with the call deleted.

   THE DRAFT NEEDS A TEMPLATE TO HAVE A BODY, and this document has none until `templates.mjs` runs
   much later. So two plain ones — one per tone, since which tone a draft opens on is the student's
   signals' business — are written locally and uploaded first, which puts the device back at
   `current` so the next sync can download at all (src/drive-sync.js's planFor() downloads only an
   unchanged device). Both come off at the foot and are synced away, as is the school name the Drive
   copy is planted with. */
{
  const T_CONCERN = 't_wo517concern', T_PRAISE = 't_wo517praise';
  const MARK = 'WO517-DOWNLOADED';
  const pick = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var best = null, n = -1;
    doc.classes.forEach(function (c) {
      if (!document.querySelector('[data-class-tab="' + c.id + '"]')) return;
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c; }
    });
    return { tab: best ? best.id : '', id: best && best.roster.length ? best.roster[0] : '',
      school: (doc.teacher || {}).school || '' }; })()`);
  await evalJs(`(function(){ window.planbook.store.update(function (d) {
    if (!Array.isArray(d.templates)) d.templates = [];
    d.templates.push({ id: ${JSON.stringify(T_CONCERN)}, name: 'WO-5.17 concern', audience: 'guardian',
      tone: 'concern', subject: 'WO-5.17 subject', body: 'WO-5.17 draft body, concern.' });
    d.templates.push({ id: ${JSON.stringify(T_PRAISE)}, name: 'WO-5.17 praise', audience: 'guardian',
      tone: 'praise', subject: 'WO-5.17 subject', body: 'WO-5.17 draft body, praise.' }); });
    return window.planbook.store.flush().then(function () { return 1; }); })()`);
  await waitFor((r) => r.state === 'ahead', 3000);
  await tap();
  const seeded = await waitFor((r) => r.state === 'current' && !r.busy, 5000);

  if (pick.tab) await clickVisible('[data-class-tab="' + pick.tab + '"]');
  await pause(300);
  await clickSel('#classView [data-class-screen="class"]');
  await pause(300);
  if (pick.id) await clickSel('#classView [data-student-detail="' + pick.id + '"]');
  await pause(350);

  const planted = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var f = window.__drive.files.filter(function (x) {
      return x.appProperties && x.appProperties.docId === doc.docId; })[0];
    if (!f) return { found: false };
    var body = JSON.parse(f.body);
    var rev = (Number(doc.rev) || 0) + 5;
    body.rev = rev;
    body.teacher = Object.assign({}, body.teacher, { school: ${JSON.stringify(MARK)} });
    f.body = JSON.stringify(body);
    f.appProperties = Object.assign({}, f.appProperties, { rev: String(rev), deviceLabel: 'iPad' });
    window.__drive.delay = 1200;
    return { found: true, rev: rev,
      templates: (body.templates || []).filter(function (t) { return t.id.indexOf('t_wo517') === 0; }).length };
  })()`);
  const DRAFT = `(function(){
    var m = document.getElementById('outreachModal');
    return { open: !m.classList.contains('hidden'),
      body: document.getElementById('outreachBody').value.length,
      view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
      school: (window.planbook.store.getDoc().teacher || {}).school || '' }; })()`;
  const viewBefore = (await evalJs(DRAFT)).view;
  await tap();
  await clickSel('#detailActions [data-outreach-draft]');
  const during = await evalJs(DRAFT);
  const duringSync = await read();
  const down = await waitFor((x) => !x.busy && x.outcome === 'downloaded', 8000);
  let after = await evalJs(DRAFT);
  for (let i = 0; i < 20 && after.open; i++) {
    await pause(100);
    after = await evalJs(DRAFT);
  }
  await evalJs('window.__drive.delay = 0; 1');
  check('WO-5.17 — with a draft open, a sync that DOWNLOADS closes #outreachModal: the header button '
    + 'was tapped, the draft opened from the student record’s own door while the transfer was still '
    + 'held on the wire, and read open with a non-empty body while the sync was busy — then the sync '
    + 'settled `downloaded`, the planted document is the one open, and the draft is gone with the '
    + 'document it was about',
    seeded.state === 'current' && pick.id !== '' && viewBefore === 'detailView'
      && planted.found === true && planted.templates === 2
      && during.open === true && during.body > 0 && duringSync.busy === true
      && duringSync.outcome !== 'downloaded'
      && down.outcome === 'downloaded' && after.school === MARK && after.open === false,
    'seeded at ' + seeded.state + '; view before the tap = ' + viewBefore + '; planted = '
      + JSON.stringify(planted) + '; during: ' + JSON.stringify(during) + ', busy = '
      + duringSync.busy + ', outcome = ' + JSON.stringify(duringSync.outcome)
      + '; settled ' + down.outcome + '; after: ' + JSON.stringify(after));

  /* Handed back: the draft shut if it is not, the two templates and the planted school off the
     document, synced so the header is at `current` again for the WO-7.10 block below, and the page
     back on the register the WO-7.7 block left it on. */
  await shutModals();
  await evalJs(`(function(){ window.planbook.store.update(function (d) {
    d.templates = (d.templates || []).filter(function (t) {
      return !t || String(t.id).indexOf('t_wo517') !== 0; });
    d.teacher.school = ${JSON.stringify(pick.school)}; });
    return window.planbook.store.flush().then(function () { return 1; }); })()`);
  await waitFor((r) => r.state === 'ahead', 3000);
  await tap();
  await waitFor((r) => r.state === 'current' && !r.busy, 5000);
  await clickVisible('[data-class-screen="class"]');
  await pause(300);
}

/* ══════════ WO-7.10 — no token is not an alarm, the tap signs in inside itself, and the red line ══════
   ══════════ that outlived a tapped success                                                     ══════

   THE SEQUENCE THE BUILD FOUND, which is this block's fixture (WO-7.10 Acceptance 3). It was observed
   by driving the WO-7.5 tree against a stand-in that opens Google's window only from inside a tap's
   own stack, which is Safari's rule, and reading the About panel after each step:
     1. the token runs out while the app is open; the header still reads up to date;
     2. a tap syncs, and syncNow() reaches the token two awaits after the tap — outside its gesture —
        so the "silent" request is blocked: the auth line goes red ("The browser blocked the Google
        sign-in window…") and the sync outcome settles `signed-out`;
     3. the next tap signs in, and the auth line clears — but the About panel then reads "Connected to
        Google Drive" OVER A RED SYNC LINE, "Your Google sign-in has run out, so nothing was synced",
        because signing in turned the sync half back on and nothing had replaced its outcome.
   The launch and the returns to view made the auth line red too, every time (the check above). What
   the stand-in could NOT make happen, under any of three browsers modelled, is the auth line's own
   sentence surviving a tapped sign-in: every success path clears it. Recorded in the WO-7.10 result
   file rather than claimed away.

   Steps 1–3 are replayed below against today's tree: the lapse, then a sync that finds no token (the
   About panel's Sync door, which is the one way left to reach syncNow() without a token — the panel
   sat open across the lapse), then a tap the pop-up blocker refuses, then a tap that works. */
await setFake('block', 'block');
await evalJs(`window.planbook.auth.acceptTokenResponse({ access_token: 'wo75-short', expires_in: 10,
  scope: ${JSON.stringify(SCOPE_URL)} }); 1`);
const callsBefore = (await read()).fake.length;
await visible();
await pause(400);
const lapsed = await read();
check('WO-7.10 — a sign-in that has run out while the app sits open is NOT renewed on the return to '
  + 'view: no token request is made, the button goes on reading the bookmark ("Synced with Google '
  + 'Drive at …") with a label saying the tap signs in first, and it is never "Connecting…" and never '
  + 'an alarm',
  lapsed.signedIn === false && lapsed.fake.length === callsBefore
    && lapsed.state === 'current'
    && /^Synced with Google Drive at .+\. Tap to sign in to Google and sync now\.$/.test(lapsed.label)
    && lapsed.authError === '',
  'requests since the token lapsed = ' + (lapsed.fake.length - callsBefore) + '; state = '
    + lapsed.state + ', label = ' + JSON.stringify(lapsed.label));

const outBefore = (await read()).fake.length;
const noToken = await evalJs('window.planbook.driveSync.syncNow().then(function (r) { return r.kind; })');
const afterNoToken = await read();
check('WO-7.10 Acceptance 3 — step 2 of the found sequence no longer asks Google: a sync that finds no '
  + 'token settles `signed-out` and makes NO token request (it used to make a "silent" one two awaits '
  + 'after the tap, which a pop-up blocker refused), so the sign-in line gains no red sentence',
  noToken === 'signed-out' && afterNoToken.fake.length === outBefore && afterNoToken.authError === '',
  'outcome = ' + noToken + ', token requests = ' + (afterNoToken.fake.length - outBefore)
    + ', auth error = ' + JSON.stringify(afterNoToken.authError));

const beforeBlocked = (await read()).fake.length;
await tap();
const refused = await waitFor((r) => r.state === 'lapsed', 3000);
const blockedCalls = refused.fake.slice(beforeBlocked);
await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
const refusedPanel = await read();
await shutModals();
check('a tap the browser refuses — the stand-in blocking the one window it asked for — draws `lapsed`, '
  + 'now meaning "your tap asked and it did not finish": "The Google sign-in did not finish. Tap to try '
  + 'again.", and About says why in red',
  blockedCalls.length === 1 && blockedCalls[0].silent === false && blockedCalls[0].inListener === true
    && refused.state === 'lapsed'
    && refused.label === 'The Google sign-in did not finish. Tap to try again.'
    && refusedPanel.statusClass === 'class-error'
    && /blocked the Google sign-in window/.test(refusedPanel.statusText),
  'requests made by the tap = ' + JSON.stringify(blockedCalls) + '; state = ' + refused.state
    + ', label = ' + JSON.stringify(refused.label) + '; About: ' + refusedPanel.statusClass + ' '
    + JSON.stringify(refusedPanel.statusText.slice(0, 80)));
await measureWidths('lapsed');

await setFake('grant', 'grant');
await save('WO710-TAP');
const beforeReconnect = (await read()).fake.length;
const driveBefore = (await read()).driveCalls;
await tap();
const reconnected = await waitFor((r) => r.signedIn && !r.busy && !r.authBusy
  && r.state === 'current' && r.driveCalls > driveBefore, 5000);
const tapCalls = reconnected.fake.slice(beforeReconnect);
check('WO-7.10 Acceptance 2 — with no token, a tap asks for Google’s window VISIBLY and INSIDE THE CLICK '
  + '— one request, not silent, made in the click listener’s own synchronous stack rather than a '
  + 'promise later — and THEN SYNCS, in the same gesture: the sign-in comes back, Drive is called, '
  + 'and the button reads up to date',
  tapCalls.length === 1 && tapCalls[0].silent === false && tapCalls[0].inClick === true
    && tapCalls[0].inListener === true
    && reconnected.signedIn === true && reconnected.state === 'current'
    && reconnected.driveCalls > driveBefore && reconnected.baseRev === reconnected.localRev,
  'requests made by the tap = ' + JSON.stringify(tapCalls) + '; now signed in = '
    + reconnected.signedIn + ', state = ' + reconnected.state + ', Drive calls ' + driveBefore
    + ' → ' + reconnected.driveCalls + ', outcome = ' + reconnected.outcome);

await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
const clearedPanel = await read();
await shutModals();
check('WO-7.10 Acceptance 3, its second half — a tapped success clears every red line already there: '
  + 'after the blocked tap and the no-token sync above, the tap that signs in and syncs leaves About’s '
  + 'Drive section with no red line in EITHER half — the sign-in line says connected, and the sync '
  + 'line no longer says the sign-in ran out',
  clearedPanel.statusClass === 'class-hint' && /^Connected to Google Drive\./.test(clearedPanel.statusText)
    && clearedPanel.syncLineClass === 'class-hint' && !/run out/.test(clearedPanel.syncLineText)
    && clearedPanel.authError === '',
  'sign-in line ' + clearedPanel.statusClass + ' ' + JSON.stringify(clearedPanel.statusText.slice(0, 60))
    + '; sync line ' + clearedPanel.syncLineClass + ' '
    + JSON.stringify(clearedPanel.syncLineText.slice(0, 80)));

/* THE CONNECT DOOR, same sequence: a no-token sync leaves `signed-out`, and About's own Connect is
   the tap that signs in. Connect does not sync, so without the fix the panel read "Connected" over the
   red "run out" line until the next sync — which is step 3 of the found sequence exactly. */
await evalJs(`window.planbook.auth.acceptTokenResponse({ access_token: 'wo710-short', expires_in: 10,
  scope: ${JSON.stringify(SCOPE_URL)} }); 1`);
const viaConnectOut = await evalJs('window.planbook.driveSync.syncNow().then(function (r) { return r.kind; })');
await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
await clickSel('[data-drive-connect]');
const viaConnect = await waitFor((r) => r.signedIn && !r.authBusy, 4000);
await pause(150);
const viaConnectPanel = await read();
await shutModals();
check('and the same holds through About’s own Connect: a sync that found no token leaves its red "run '
  + 'out" line, and the Connect that succeeds takes it away — a sign-in answers that sentence, so the '
  + 'panel stops saying it (src/drive-sync.js signedInAgain(), at the cause, not on paint)',
  viaConnectOut === 'signed-out' && viaConnect.signedIn === true
    && viaConnectPanel.statusClass === 'class-hint' && viaConnectPanel.syncLineClass === 'class-hint'
    && !/run out/.test(viaConnectPanel.syncLineText),
  'no-token sync = ' + viaConnectOut + '; after Connect: sign-in line ' + viaConnectPanel.statusClass
    + ', sync line ' + viaConnectPanel.syncLineClass + ' '
    + JSON.stringify(viaConnectPanel.syncLineText.slice(0, 80)));

/* WO-7.15 — A SIGN-IN THAT SUCCEEDS AFTER A REFUSAL RETURNS THE BUTTON TO ITS FRESHNESS READING.
   `verify/drive-sync.mjs` proves the refused header tap is drawn `lapsed`; its stand-in library only
   refuses, so the other half is here, where one grants. Signed in and up to date after the Connect
   above; a header tap meets Drive's 401 (src/auth.js ends the session, the outcome is `signed-out`)
   and the button is read `lapsed`; then the next header tap is read as the sign-in door — ONE visible
   request inside the click, About not opened — and once the granted token has synced the button is
   `current` again, which is signedInAgain() clearing the outcome at its cause followed by a sync. */
await setFake('grant', 'grant');
await evalJs('window.__drive.failNext = 401; 1');
const drive715 = (await read()).driveCalls;
await tap();
const refused715 = await waitFor((r) => r.state === 'lapsed' && !r.busy && r.driveCalls > drive715, 5000);
await evalJs('window.__drive.failNext = null; 1');
const gis715 = refused715.fake.length;
await tap();
const back715 = await waitFor((r) => r.signedIn && !r.busy && !r.authBusy && r.state === 'current', 5000);
const signIn715 = back715.fake.slice(gis715);
check('WO-7.15 — a header tap that meets Drive’s 401 is drawn `lapsed`, saying the last sync did not '
  + 'reach Google Drive; the NEXT header tap is the sign-in (one visible request in the click, About '
  + 'not opened), and once it succeeds the button is back on its freshness reading, up to date',
  refused715.state === 'lapsed' && refused715.signedIn === false && refused715.outcome === 'signed-out'
    && /did not reach Google Drive/.test(refused715.label || '')
    && signIn715.length === 1 && signIn715[0].silent === false && signIn715[0].inListener === true
    && back715.aboutOpen === false && back715.signedIn === true && back715.state === 'current'
    && back715.outcome !== 'signed-out'
    && /^Synced with Google Drive at .+\. Tap to sync now\.$/.test(back715.label || ''),
  'after the refused tap: state = ' + refused715.state + ', signedIn = ' + refused715.signedIn
    + ', outcome = ' + refused715.outcome + ', label = ' + JSON.stringify(refused715.label)
    + '; the next tap asked Google ' + JSON.stringify(signIn715) + ', About open = '
    + back715.aboutOpen + '; then state = ' + back715.state + ', outcome = ' + back715.outcome
    + ', label = ' + JSON.stringify(back715.label));

/* STALE: a bookmark from yesterday, read on the first launch of today. */
const PLANT = (daysBack, hour) => `(function(){
  var doc = window.planbook.store.getDoc();
  var now = new Date();
  var at = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ${daysBack}, ${hour}, 12, 0);
  return new Promise(function (res, rej) {
    var open = indexedDB.open('planbook');
    open.onerror = function () { rej(open.error); };
    open.onsuccess = function () {
      var db = open.result;
      var t = db.transaction('sync', 'readwrite');
      t.objectStore('sync').put({ docId: doc.docId, year: doc.year, baseRev: doc.rev, at: at.toISOString() });
      t.oncomplete = function () { db.close(); res(at.toISOString()); };
      t.onerror = function () { rej(t.error); };
    };
  }); })()`;

/* WO-7.8 — the same write as `PLANT` above, but at an EXPLICIT {y, month, day, hour, minute} rather
   than an offset from "now": the two fixed-clock cases below plant relative to a page clock they
   are about to pin, never to whatever real moment the harness happens to run at, so this never
   reads the page's current Date at all. */
const PLANT_AT = (y, mo, d, hh, mm) => `(function(){
  var doc = window.planbook.store.getDoc();
  var at = new Date(${y}, ${mo}, ${d}, ${hh}, ${mm}, 0);
  return new Promise(function (res, rej) {
    var open = indexedDB.open('planbook');
    open.onerror = function () { rej(open.error); };
    open.onsuccess = function () {
      var db = open.result;
      var t = db.transaction('sync', 'readwrite');
      t.objectStore('sync').put({ docId: doc.docId, year: doc.year, baseRev: doc.rev, at: at.toISOString() });
      t.oncomplete = function () { db.close(); res(at.toISOString()); };
      t.onerror = function () { rej(t.error); };
    };
  }); })()`;

/* WO-7.8 — a page clock pinned to one absolute LOCAL moment (never UTC: `localDayOf()` is local on
   purpose), independent of whatever real time the harness happens to be run at — as opposed to
   a relative offset from wherever the run's own clock already sits, which is what these two checks
   used before WO-7.8 and why a run after 15:12 could not see the defect at all. Same page-start-script
   mechanism, and the same composition `tools/verify-shell.mjs`'s own
   SHIFT_PAGE_CLOCK relies on for `--today`: by the time this script runs, `Date` may ALREADY be that
   file's shifting proxy rather than the native constructor, so `Real` here can itself be that proxy.
   Passing explicit arguments (never zero) forwards straight through any such nesting to a literal
   local date, which is what lets `y`/`mo`/`d`/`hh`/`mm` name the same wall-clock moment whether or
   not `--today` is in play — `y`/`mo`/`d` are read off the page's own `new Date()` below for exactly
   that reason. A FIXED BASE PLUS ELAPSED REAL TIME, never a frozen `Date.now()`: a frozen clock can
   stall anything in the app that times itself, and an hour of drift is far more slack than either
   check below needs. */
const FIXED_CLOCK = (y, mo, d, hh, mm) => `(function(){
  var Real = Date;
  var target = new Real(${y}, ${mo}, ${d}, ${hh}, ${mm}, 0).getTime();
  var installedAt = Real.now();
  window.Date = new Proxy(Real, {
    construct: function (t, args, nt) {
      return args.length ? Reflect.construct(t, args, nt)
        : Reflect.construct(t, [target + (Real.now() - installedAt)], nt);
    },
    apply: function () { return new Real(target + (Real.now() - installedAt)).toString(); },
    get: function (t, key, recv) {
      if (key === 'now') return function () { return target + (Real.now() - installedAt); };
      return Reflect.get(t, key, recv);
    }
  });
})();`;

/* The reference day, off the page's OWN clock (already reflecting --today if it is in play) —
   read once and reused by both fixed-clock cases below, per the Traps' instruction to build the
   fixed clock from absolute local components taken from the page's own `new Date()`. */
const todayYMD = () => evalJs('(function(){ var n = new Date(); '
  + 'return { y: n.getFullYear(), mo: n.getMonth(), d: n.getDate() }; })()');

/* ── the midnight case (WO-7.8): 23:30 yesterday, read at 00:30 today — one hour apart, across
   midnight, independent of when the harness runs. A 24-hour rule would read this pair as current;
   only a calendar-day rule reads it stale. Installed for one reload and removed immediately after
   (the Traps: a whole run on a moved clock is evidence about a different day for every other
   section), and the bookmark is written BEFORE the fixed clock installs, so it never depends on the
   page's Date at all. */
await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
await setFake('grant', 'grant');
const { y: my, mo: mmo, d: md } = await todayYMD();
const midnightPlantedAt = await evalJs(PLANT_AT(my, mmo, md - 1, 23, 30));
const midnightScript = await send('Page.addScriptToEvaluateOnNewDocument',
  { source: FIXED_CLOCK(my, mmo, md, 0, 30) });
await reload();
const stale = await waitFor((r) => r.state === 'stale', 4000);
const midnightPageClock = await evalJs('new Date().toISOString()');
check('a sync at 23:30 yesterday, read at 00:30 today — one hour apart, across midnight, on a page '
  + 'clock pinned to that moment — draws the stale state: "Last synced yesterday at 11:30 PM." A '
  + '24-hour rule would read this pair as current, and only a calendar-day rule reads it stale '
  + '(WO-7.8)',
  stale.state === 'stale' && /^Last synced yesterday at .+\. Tap to sign in to Google and sync now\.$/.test(stale.label)
    && stale.badgeShown === true && stale.baseRev === stale.localRev,
  'bookmark planted at ' + midnightPlantedAt + ', page clock pinned to ' + midnightPageClock
    + '; state = ' + stale.state + ', label = ' + JSON.stringify(stale.label));
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: midnightScript.identifier });
await reload();
await measureWidths('stale');

await evalJs(PLANT(3, 9));
await reload();
const older = await waitFor((r) => r.state === 'stale', 4000);
check('and further back than yesterday it names the date — "Last synced on Sep 23 at 9:12." — by '
  + 'the calendar, never "3 days ago"',
  older.state === 'stale' && /^Last synced on [A-Z][a-z]{2} \d{1,2} at .+\. Tap to sign in to Google and sync now\.$/.test(older.label),
  'label = ' + JSON.stringify(older.label));

await evalJs(INSTALL_DRIVE);
await tap();
const staleCleared = await waitFor((r) => r.state === 'current' && !r.busy, 5000);
check('and a tap on the stale button syncs, which brings it back to up to date',
  staleCleared.state === 'current' && staleCleared.driveCalls > 0,
  'state = ' + staleCleared.state + ', Drive calls = ' + staleCleared.driveCalls);

/* ══════════ Acceptance 5 — a calendar day, never a count of hours (WO-7.5), pinned so the two ══════
   ══════════ rules can be told apart at any hour the harness runs (WO-7.8)                  ══════ */

/*
  THE SAME-DAY CASE: a sync at 00:30 today, read at 23:30 today — 23 hours apart, on one calendar
  day — must still read up to date. WO-7.5's own version of this check moved the page clock a full
  24 hours past a bookmark written "a moment ago" by a real sync, which is exactly the boundary
  where a calendar-day rule and a 24-hour rule agree, so it could not tell them apart at all
  (WO-7.8's finding). Pinned with the same FIXED_CLOCK mechanism as the midnight case above,
  installed for one reload and removed immediately after — a whole run on a moved clock is evidence
  about a different day for every other section.
*/
const { y: sy, mo: smo, d: sd } = await todayYMD();
const sameDayPlantedAt = await evalJs(PLANT_AT(sy, smo, sd, 0, 30));
const sameDayScript = await send('Page.addScriptToEvaluateOnNewDocument',
  { source: FIXED_CLOCK(sy, smo, sd, 23, 30) });
await reload();
const sameDay = await waitFor((r) => r.state === 'current' || r.state === 'stale', 4000);
const sameDayPageClock = await evalJs('new Date().toISOString()');
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: sameDayScript.identifier });
await reload();
const sameDayBack = await waitFor((r) => r.state === 'current', 4000);
check('a sync at 00:30 today, read at 23:30 today — 23 hours apart, on one calendar day, on a page '
  + 'clock pinned to that moment — reads up to date; put back on the real clock the same bookmark '
  + 'still does. A rule with a threshold shorter than a day would read this pair as stale: the line '
  + 'is a calendar day, never a count of hours (WO-7.5 Acceptance 5, pinned WO-7.8)',
  sameDay.state === 'current' && sameDay.baseRev === sameDay.localRev && sameDay.badgeShown === false
    && sameDayBack.state === 'current',
  'bookmark planted at ' + sameDayPlantedAt + ', page clock pinned to ' + sameDayPageClock
    + '; state = ' + sameDay.state + '; back on the real clock the state is ' + sameDayBack.state);

/* Presentation mode changes nothing about it — sync state is not student data. */
const beforeMode = await read();
await clickSel('header [data-presentation-toggle]');
await pause(200);
const inMode = await read();
await clickSel('#presentationStrip [data-presentation-toggle]');
await pause(200);
check('presentation mode changes nothing about the button — same state, same reading — because sync '
  + 'state is not student data',
  inMode.hidden === false && inMode.state === beforeMode.state && inMode.label === beforeMode.label,
  'before ' + JSON.stringify(beforeMode.label) + ', in presentation mode '
    + JSON.stringify(inMode.label));

/* ══════════ Acceptance 4 — reported ══════════ */

const phoneBad = widths.filter((w) => {
  const wantBadge = w.label !== 'current';
  return !(w.phone.coarse === true && w.phone.width === 390 && w.phone.hidden === false
    && w.phone.btn && w.phone.btn.laid === false
    && w.phone.laidButtons.length === 4 && w.phone.laidButtons.indexOf('syncBtn') < 0
    && w.phone.aboutBadgeShown === wantBadge
    && (wantBadge ? w.phone.aboutLabel.indexOf('About Planbook. ') === 0 : w.phone.aboutLabel === 'About Planbook')
    && Math.abs(w.phoneSlack.slack - baseSlack.slack) < 0.5 && w.phoneSlack.overflow <= 0);
});
check('at 390×844 under a coarse pointer the header draws NO fifth button in any state, the About '
  + 'button carries the badge in every state but up to date (and says what it means in its label), '
  + 'and the top row’s slack is the same figure as on a device that never opted in (ruling 2)',
  widths.length === 6 && phoneBad.length === 0 && baseCoarse.coarse === true
    && baseSlack.slack > 0 && baseCoarse.laidButtons.length === 4,
  'slack with no opt-in = ' + baseSlack.slack + 'px; ' + widths.map((w) => w.label + ': slack '
    + w.phoneSlack.slack + ', laid ' + w.phone.laidButtons.length + ', About badge '
    + w.phone.aboutBadgeShown).join(' · ')
    + (phoneBad.length ? ' — WRONG in ' + JSON.stringify(phoneBad.map((w) => w.label)) : ''));

const padBad = widths.filter((w) => !(w.pad.coarse === true && w.pad.hidden === false
  && w.pad.btn && w.pad.btn.laid === true && w.pad.btn.w >= 44 && w.pad.btn.h >= 44
  && w.pad.afterBackup === true && w.pad.btn.right <= w.pad.about.left
  && JSON.stringify(w.pad.laidButtons)
    === JSON.stringify(['backup', 'syncBtn', 'presentationBtn', 'yearButton', 'aboutBtn'])
  && w.pad.aboutBadgeShown === false && w.padSlack.overflow <= 0));
check('at iPad width (834×1194, coarse) the sync button is drawn in every state, 44 by 44, and the row '
  + 'reads Backup · Sync · Presentation · Year · About — WO-1.71 ruling 1, which replaced WO-7.5 ruling '
  + '3’s last-before-About — with About carrying no badge of its own',
  widths.length === 6 && padBad.length === 0,
  widths.map((w) => w.label + ': ' + (w.pad.btn ? w.pad.btn.w + 'x' + w.pad.btn.h : '-') + ', order '
    + JSON.stringify(w.pad.laidButtons) + ', slack ' + w.padSlack.slack).join(' · ')
    + (padBad.length ? ' — WRONG in ' + JSON.stringify(padBad.map((w) => w.label)) : ''));

/* At phone width a badged About opens at the Drive section. Reached with a save (ahead). */
await evalJs(INSTALL_DRIVE);
await save('WO75-PHONE');
await waitFor((r) => r.state === 'ahead', 3000);
await atWidth(390, 844);
await clickSel('#aboutBtn');
await pause(500);
const phoneAbout = await read();
const phoneView = await evalJs(DRIVE_IN_VIEW);
await shutModals();
await desktop();
check('and at phone width a tap on the badged About opens it at the Drive section, where Sync and '
  + 'Connect already are',
  phoneAbout.aboutOpen === true && phoneAbout.aboutBadgeShown === true && inView(phoneView),
  'About open = ' + phoneAbout.aboutOpen + ', badge = ' + phoneAbout.aboutBadgeShown
    + ', Drive section ' + JSON.stringify(phoneView));

/* ── handed back ── */
await save(originalSchool);
await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
/* Switched off THROUGH THE SWITCH-OFF, from the state the reloads above leave it in: opted in and
   signed out (WO-7.10). Until WO-7.11 this line clicked Disconnect only if a sign-in happened to be
   standing, because signed out it was not drawn; now it is, so the hand-back is the teacher's own
   tap. Still guarded — a click on a hidden control lands at the viewport's corner (tools/README.md
   trap 3) — and the key is still removed by hand below, because "opted out" and "never opted in" are
   two different stored states and this section hands back the second. */
const handOff = await read();
if (handOff.off && handOff.off.shown) await clickSel('[data-drive-disconnect]');
const handedOff = await waitFor((r) => r.optIn === 'false' && r.hidden === true, 3000);
await shutModals();
check('WO-7.11 — and the section switches sync off the way a teacher now can after any launch: from '
  + 'signed out, with the switch-off drawn as "Stop syncing on this device", one tap and the header '
  + 'button is gone',
  handOff.signedIn === false && handOff.optIn === 'true' && !!handOff.off && handOff.off.shown === true
    && handOff.off.text === STOP_WORD && handedOff.optIn === 'false' && handedOff.hidden === true,
  'before: signed in = ' + handOff.signedIn + ', opt-in = ' + JSON.stringify(handOff.optIn)
    + ', switch-off = ' + JSON.stringify(handOff.off) + '; after: opt-in = '
    + JSON.stringify(handedOff.optIn) + ', header button hidden = ' + handedOff.hidden);
await setOptIn(null);
await clearFake();
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fakeScript.identifier });
await reload();
const handedBack = await read();
const schoolBack = await evalJs('(window.planbook.store.getDoc().teacher || {}).school || ""');
check('this section handed the page back as it found it — reloaded with no stand-in library and no '
  + 'stand-in Drive, signed out, opted out with the key gone, the header back to its four controls, the '
  + 'desktop viewport, and the one field it typed into the document put back',
  handedBack.fake === null && handedBack.driveCalls === null && handedBack.signedIn === false
    && handedBack.optIn === null && handedBack.hidden === true && handedBack.coarse === false
    && handedBack.aboutOpen === false && schoolBack === originalSchool
    && /\[native code\]/.test(await evalJs('String(window.fetch)')),
  JSON.stringify({ fake: handedBack.fake, drive: handedBack.driveCalls, signedIn: handedBack.signedIn,
    optIn: handedBack.optIn, hidden: handedBack.hidden, coarse: handedBack.coarse })
    + ', school = ' + JSON.stringify(schoolBack) + ' (was ' + JSON.stringify(originalSchool) + ')');
}
