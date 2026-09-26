/* sync-button.mjs — the header says how fresh this device's sync is (WO-7.5)
 *
 * A section of its own rather than more of `drive-sync.mjs`, for the reason `tools/README.md` gives
 * about where a check goes: this is a different SURFACE — the header — over the same transfer, and
 * it reloads the page nine times, which that section never does. It runs directly after the two
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
  var f = window.__fakeGis = { silent: cfg.silent, visible: cfg.visible, calls: [], n: 0 };
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
            c.error_callback({ type: silent ? 'popup_failed_to_open' : 'popup_closed' });
          }
        }, 60);
      } };
    },
    revoke: function (t, cb) { if (cb) cb(); }
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
      return x.id || x.className; }) : [];
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
    beforeAbout: !!(b && b.nextElementSibling === a),
    optIn: raw,
    signedIn: au.signedIn, authBusy: au.busy,
    outcome: s.outcome, busy: s.busy, bad: s.bad, localRev: s.localRev, baseRev: s.baseRev,
    lastSyncedAt: s.lastSyncedAt,
    fake: window.__fakeGis ? window.__fakeGis.calls.slice() : null,
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
  + 'on About, About named only "About Planbook", the same five controls laid out — and through a '
  + 'launch and a return to view it asks accounts.google.com for nothing, measured on the wire '
  + '(WO-7.5 Acceptance 1)',
  never.hidden === true && never.state === '' && never.aboutBadgeShown === false
    && never.aboutLabel === 'About Planbook' && never.optIn === null
    && never.laidButtons.length === 5 && never.laidButtons.indexOf('syncBtn') < 0
    && never.laidButtons[never.laidButtons.length - 1] === 'aboutBtn'
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
  a blocked request is still sent, so it is still on the wire. And a library that cannot load is a
  renewal that failed, so the button lands on `lapsed` — which is also the offline launch, and the
  proof that the renewal is tried before `lapsed` is drawn rather than instead of it.
*/
await send('Network.setBlockedURLs', { urls: ['*accounts.google.com*'] });
await setOptIn(true);
netLog.length = 0;
await reload();
const blocked = await waitFor((r) => r.state === 'lapsed', 6000);
const googleOpted = netLog.filter((r) => /^https?:\/\/accounts\.google\.com\//i.test(r.url));
check('and on a device that has opted in, the launch itself asks for Google’s library — the renewal '
  + 'ruling 5 makes part of opting in — and when that request cannot land (blocked here, offline on '
  + 'a real device) the app is on the glass anyway and the button says the sign-in has ended',
  googleOpted.some((r) => r.url.indexOf('https://accounts.google.com/gsi/client') === 0)
    && blocked.state === 'lapsed' && blocked.hidden === false
    && blocked.label === 'Your Google sign-in has ended. Tap to reconnect.',
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

await reload();
const survived = await waitFor((r) => r.signedIn && r.state !== 'syncing', 4000);
check('and it survives a reload — which is a sign-out, the token being memory-only — so the button '
  + 'is drawn again, and the renewal it is now allowed to make is the SILENT one, answered without a '
  + 'window: one silent request and no visible one',
  survived.optIn === 'true' && survived.hidden === false && survived.signedIn === true
    && Array.isArray(survived.fake) && survived.fake.length === 1
    && survived.fake[0].silent === true,
  'opt-in = ' + JSON.stringify(survived.optIn) + ', button hidden = ' + survived.hidden
    + ', state = ' + survived.state + ', requests = ' + JSON.stringify(survived.fake));

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

await clickSel('[data-modal-open="aboutModal"]');
await pause(300);
await clickSel('[data-drive-disconnect]');
const disconnected = await waitFor((r) => r.hidden === true, 3000);
await shutModals();
await reload();
const stayedOut = await read();
check('Disconnect clears it — the stored value becomes `false`, the button leaves the header in the '
  + 'same tap, and after a reload the header is today’s and nothing is asked of the library',
  disconnected.optIn === 'false' && disconnected.hidden === true
    && stayedOut.optIn === 'false' && stayedOut.hidden === true
    && Array.isArray(stayedOut.fake) && stayedOut.fake.length === 0,
  'after the tap: opt-in = ' + JSON.stringify(disconnected.optIn) + ', hidden = '
    + disconnected.hidden + '; after a reload: opt-in = ' + JSON.stringify(stayedOut.optIn)
    + ', hidden = ' + stayedOut.hidden + ', requests = ' + JSON.stringify(stayedOut.fake));

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

/* LAPSED: the token runs out, the silent renewal is tried on the return to view and refused, and the
   tap asks VISIBLY, INSIDE THE CLICK. */
await setFake('deny', 'grant');
await evalJs(`window.planbook.auth.acceptTokenResponse({ access_token: 'wo75-short', expires_in: 10,
  scope: ${JSON.stringify(SCOPE_URL)} }); 1`);
const callsBefore = (await read()).fake.length;
await visible();
const lapsed = await waitFor((r) => r.state === 'lapsed', 4000);
const renewalCalls = lapsed.fake.slice(callsBefore);
check('a sign-in that has run out is renewed SILENTLY when the app comes back into view, before '
  + 'anything is drawn — and only when that is refused does the button read "Your Google sign-in has '
  + 'ended. Tap to reconnect.", in the inverted fill',
  lapsed.state === 'lapsed' && lapsed.label === 'Your Google sign-in has ended. Tap to reconnect.'
    && renewalCalls.length === 1 && renewalCalls[0].silent === true
    && renewalCalls[0].inClick === false && lapsed.badgeShown === false,
  'requests since the token lapsed = ' + JSON.stringify(renewalCalls) + '; state = ' + lapsed.state
    + ', label = ' + JSON.stringify(lapsed.label));
await measureWidths('lapsed');

const beforeReconnect = (await read()).fake.length;
await tap();
const reconnected = await waitFor((r) => r.signedIn && r.state !== 'lapsed' && r.state !== 'syncing', 4000);
const tapCalls = reconnected.fake.slice(beforeReconnect);
check('and the tap asks for Google’s window VISIBLY and INSIDE THE CLICK — one request, not silent, '
  + 'made in the click listener’s own synchronous stack rather than a promise later, with no silent '
  + 'attempt in front of it: the precondition for Safari’s pop-up blocker letting it open (whether '
  + 'iPadOS does is Acceptance 6, 👤) — and the sign-in comes back',
  tapCalls.length === 1 && tapCalls[0].silent === false && tapCalls[0].inClick === true
    && tapCalls[0].inListener === true
    && reconnected.signedIn === true && reconnected.state !== 'lapsed',
  'requests made by the tap = ' + JSON.stringify(tapCalls) + '; now signed in = '
    + reconnected.signedIn + ', state = ' + reconnected.state);

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
await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
await setFake('grant', 'grant');
const plantedAt = await evalJs(PLANT(1, 15));
await reload();
const stale = await waitFor((r) => r.state === 'stale', 4000);
check('a last sync on an earlier calendar day draws the stale state on the first launch — "Last '
  + 'synced yesterday at 3:12." — amber and a dot, like ahead, and told apart by its reading',
  stale.state === 'stale' && /^Last synced yesterday at .+\. Tap to sync now\.$/.test(stale.label)
    && stale.badgeShown === true && stale.baseRev === stale.localRev,
  'bookmark planted at ' + plantedAt + '; state = ' + stale.state + ', label = '
    + JSON.stringify(stale.label));
await measureWidths('stale');

await evalJs(PLANT(3, 9));
await reload();
const older = await waitFor((r) => r.state === 'stale', 4000);
check('and further back than yesterday it names the date — "Last synced on Sep 23 at 9:12." — by '
  + 'the calendar, never "3 days ago"',
  older.state === 'stale' && /^Last synced on [A-Z][a-z]{2} \d{1,2} at .+\. Tap to sync now\.$/.test(older.label),
  'label = ' + JSON.stringify(older.label));

await evalJs(INSTALL_DRIVE);
await tap();
const staleCleared = await waitFor((r) => r.state === 'current' && !r.busy, 5000);
check('and a tap on the stale button syncs, which brings it back to up to date',
  staleCleared.state === 'current' && staleCleared.driveCalls > 0,
  'state = ' + staleCleared.state + ', Drive calls = ' + staleCleared.driveCalls);

/* ══════════ Acceptance 5 — the clock moved a day past the bookmark's `at` ══════════ */

/*
  THE SAME PAGE-SIDE CLOCK `--today` INSTALLS (verify-shell.mjs SHIFT_PAGE_CLOCK), moved one day on
  from a bookmark written by a real sync a moment ago — so this is the literal line: `--today` a day
  past `at`, on first launch. It is installed as its own page-start script and taken away again,
  because a whole run on a moved clock is evidence about a different day for every other section.
*/
const syncedAt = (await read()).lastSyncedAt;
const SHIFT = `(function(){
  var SHIFT = 24 * 60 * 60 * 1000;
  var Real = Date;
  window.Date = new Proxy(Real, {
    construct: function (t, args, nt) {
      return args.length ? Reflect.construct(t, args, nt) : Reflect.construct(t, [Real.now() + SHIFT], nt);
    },
    apply: function () { return new Real(Real.now() + SHIFT).toString(); },
    get: function (t, key, recv) {
      if (key === 'now') return function () { return Real.now() + SHIFT; };
      return Reflect.get(t, key, recv);
    }
  });
})();`;
const shiftScript = await send('Page.addScriptToEvaluateOnNewDocument', { source: SHIFT });
await reload();
const tomorrow = await waitFor((r) => r.state === 'stale' || r.state === 'lapsed', 4000);
const pageDay = await evalJs('(function(){ var n = new Date(); return n.getFullYear() + "-" + (n.getMonth() + 1) + "-" + n.getDate(); })()');
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: shiftScript.identifier });
await reload();
const backToday = await waitFor((r) => r.state === 'current', 4000);
check('with the page clock moved one day past the bookmark’s `at` — the `--today` mechanism — the '
  + 'first launch draws "Last synced yesterday at …"; put back, the same bookmark reads up to date: '
  + 'the line is a calendar day, not a count of hours (WO-7.5 Acceptance 5)',
  tomorrow.state === 'stale' && /^Last synced yesterday at /.test(tomorrow.label)
    && tomorrow.lastSyncedAt === syncedAt && backToday.state === 'current',
  'bookmark at ' + syncedAt + '; page day with the clock moved = ' + pageDay + ', label = '
    + JSON.stringify(tomorrow.label) + '; back on the real clock the state is ' + backToday.state);

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
    && w.phone.laidButtons.length === 5 && w.phone.laidButtons.indexOf('syncBtn') < 0
    && w.phone.aboutBadgeShown === wantBadge
    && (wantBadge ? w.phone.aboutLabel.indexOf('About Planbook. ') === 0 : w.phone.aboutLabel === 'About Planbook')
    && Math.abs(w.phoneSlack.slack - baseSlack.slack) < 0.5 && w.phoneSlack.overflow <= 0);
});
check('at 390×844 under a coarse pointer the header draws NO fifth button in any state, the About '
  + 'button carries the badge in every state but up to date (and says what it means in its label), '
  + 'and the top row’s slack is the same figure as on a device that never opted in (ruling 2)',
  widths.length === 6 && phoneBad.length === 0 && baseCoarse.coarse === true
    && baseSlack.slack > 0 && baseCoarse.laidButtons.length === 5,
  'slack with no opt-in = ' + baseSlack.slack + 'px; ' + widths.map((w) => w.label + ': slack '
    + w.phoneSlack.slack + ', laid ' + w.phone.laidButtons.length + ', About badge '
    + w.phone.aboutBadgeShown).join(' · ')
    + (phoneBad.length ? ' — WRONG in ' + JSON.stringify(phoneBad.map((w) => w.label)) : ''));

const padBad = widths.filter((w) => !(w.pad.coarse === true && w.pad.hidden === false
  && w.pad.btn && w.pad.btn.laid === true && w.pad.btn.w >= 44 && w.pad.btn.h >= 44
  && w.pad.beforeAbout === true && w.pad.btn.right <= w.pad.about.left
  && w.pad.laidButtons.length === 6
  && w.pad.laidButtons[w.pad.laidButtons.length - 2] === 'syncBtn'
  && w.pad.laidButtons[w.pad.laidButtons.length - 1] === 'aboutBtn'
  && w.pad.aboutBadgeShown === false && w.padSlack.overflow <= 0));
check('at iPad width (834×1194, coarse) the sync button is drawn in every state, 44 by 44, and sits '
  + 'LAST BEFORE ABOUT — ruling 3, where the drawing put it beside the year — with About carrying no '
  + 'badge of its own',
  widths.length === 6 && padBad.length === 0,
  widths.map((w) => w.label + ': ' + (w.pad.btn ? w.pad.btn.w + 'x' + w.pad.btn.h : '-') + ', order '
    + JSON.stringify(w.pad.laidButtons.slice(-2)) + ', slack ' + w.padSlack.slack).join(' · ')
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
await clickSel('[data-drive-disconnect]');
await shutModals();
await setOptIn(null);
await clearFake();
await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fakeScript.identifier });
await reload();
const handedBack = await read();
const schoolBack = await evalJs('(window.planbook.store.getDoc().teacher || {}).school || ""');
check('this section handed the page back as it found it — reloaded with no stand-in library and no '
  + 'stand-in Drive, signed out, opted out with the key gone, the header back to five controls, the '
  + 'desktop viewport, and the one field it typed into the document put back',
  handedBack.fake === null && handedBack.driveCalls === null && handedBack.signedIn === false
    && handedBack.optIn === null && handedBack.hidden === true && handedBack.coarse === false
    && handedBack.aboutOpen === false && schoolBack === originalSchool
    && /\[native code\]/.test(await evalJs('String(window.fetch)')),
  JSON.stringify({ fake: handedBack.fake, drive: handedBack.driveCalls, signedIn: handedBack.signedIn,
    optIn: handedBack.optIn, hidden: handedBack.hidden, coarse: handedBack.coarse })
    + ', school = ' + JSON.stringify(schoolBack) + ' (was ' + JSON.stringify(originalSchool) + ')');
}
