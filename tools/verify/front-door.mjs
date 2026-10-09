/* front-door.mjs — a first-time visitor meets the front page, not an empty gradebook (WO-8.16)
 *
 * THE ONE SECTION THAT NAVIGATES WITHOUT `?door=skip`. Every run is a cold visitor — a fresh profile,
 * not installed, no year — which is exactly the door's condition, so `load()` passes the flag and
 * every other section rides on it (the work order's trap 5). This section takes the flag off and
 * proves the door is there to be passed.
 *
 * A FRESH DEVICE, MADE THE WAY verify/first-run.mjs MAKES ONE: the same server at
 * `http://localhost:<port>` — a different origin, so a different IndexedDB, localStorage and worker —
 * wiped with `Storage.clearDataForOrigin` from `about:blank` before each arm, and wiped again at the
 * foot before the page is handed back at 127.0.0.1 through `load()`, with the run's fixture asserted
 * untouched. `localhost` is a loopback host, so the flag WOULD be honoured there; every arm below
 * that wants the door simply does not send it.
 *
 * STAND-INS, as page-start scripts, each removed before the next arm: a user agent (the iPad and
 * Firefox doors — a page cannot change its browser), `navigator.standalone` (iOS's installed flag,
 * which is one of the two things src/install-banner.js's isInstalled() asks), a missing or throwing
 * `indexedDB.databases()`, and an about.html that will not load. And one OBSERVER, installed for the
 * whole section, that records whether the door or the app was ever on the glass at a task boundary —
 * which is what "no flash" means to a reader of the DOM (trap 6). Nothing in src/ knows any of them
 * exist.
 *
 * WHAT STAYS OWED TO A HUMAN: the 👤 line. Real Safari on a real iPad — in a tab and then installed
 * — and Edge on the laptop, walked into cold. A user-agent string is not Safari.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
const { ROOT, check, skip, send, evalJs, clickSel, load, KILL_ANIM } = h;

console.log('\n--- the front door (WO-8.16) ---');

if (!h.seam) {
  skip('the front door (WO-8.16)', 'window.planbook is not on the page, so nothing below can read the '
    + 'door’s pure halves or the store a tap boots');
  return;
}

const FRESH = 'http://localhost:' + h.PORT;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── the run's own fixture, fingerprinted before anything here moves ── */
await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
const FINGERPRINT = `(function(){ var d = window.planbook.store.getDoc();
  return { origin: location.origin, docId: d.docId, year: d.year, rev: d.rev,
    classes: d.classes.length, students: d.students.length }; })()`;
const fixtureBefore = await evalJs(FINGERPRINT);

/* ══════════ the pure halves — hosts and browsers no page here can be ══════════ */

const pure = await evalJs(`(function(){ var f = window.planbook.frontDoor;
  var hosts = ['localhost', '127.0.0.1', 'planbook.hwgteach.com', '192.168.1.50', 'localhost.hwgteach.com',
    'notlocalhost', '127.0.0.10', ''];
  var allowed = {}; hosts.forEach(function(x){ allowed[x || '(empty)'] = f.skipAllowedOn(x); });
  var UA = {
    ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
    firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
    chromebook: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' };
  return { allowed: allowed,
    asked: { deployed: f.skipAsked('?door=skip', 'planbook.hwgteach.com'), lan: f.skipAsked('?door=skip', '192.168.1.50'),
      loopback: f.skipAsked('?door=skip', '127.0.0.1'), localhost: f.skipAsked('?x=1&door=skip', 'localhost'),
      otherValue: f.skipAsked('?door=no', 'localhost'), none: f.skipAsked('', 'localhost') },
    device: { ipad: f.deviceOf(UA.ipad, 5), iphone: f.deviceOf(UA.iphone, 5), ipadAsMac: f.deviceOf(UA.mac, 5),
      mac: f.deviceOf(UA.mac, 0), firefox: f.deviceOf(UA.firefox, 0), firefoxAndroid: f.deviceOf(UA.firefoxAndroid, 5),
      edge: f.deviceOf(UA.edge, 0), chromebook: f.deviceOf(UA.chromebook, 0) } }; })()`);
const a = pure.allowed, k = pure.asked, d = pure.device;
check('the skip flag is loopback-only by exact string — `localhost` and `127.0.0.1` and nothing else, '
  + 'so the deployed origin and the iPad’s LAN address cannot be told to skip the door — and only '
  + '`door=skip` asks; and the door is chosen by browser: iPad (and iPadOS calling itself a Mac with '
  + 'touch) and iPhone get the iOS door, Firefox on a desktop the cannot-install door, and Edge, Mac '
  + 'Safari, Android Firefox and a Chromebook the laptop door (WO-8.16 trap 5, ruling 5)',
  a.localhost === true && a['127.0.0.1'] === true && a['planbook.hwgteach.com'] === false
    && a['192.168.1.50'] === false && a['localhost.hwgteach.com'] === false && a.notlocalhost === false
    && a['127.0.0.10'] === false && a['(empty)'] === false
    && k.deployed === false && k.lan === false && k.loopback === true && k.localhost === true
    && k.otherValue === false && k.none === false
    && d.ipad === 'ios' && d.iphone === 'ios' && d.ipadAsMac === 'ios' && d.mac === 'laptop'
    && d.firefox === 'cannot' && d.firefoxAndroid === 'laptop' && d.edge === 'laptop' && d.chromebook === 'laptop',
  JSON.stringify(pure));

/* ══════════ the static halves — the worker is not taught to choose, and the probe opens nothing ══════════ */

const swText = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
const shellBlock = swText.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
const shellNow = shellBlock ? [...shellBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
const fetchAt = swText.indexOf("self.addEventListener('fetch'");
const fetchHandler = fetchAt >= 0 ? swText.slice(fetchAt).replace(/\/\*[\s\S]*?\*\//g, ' ') : '';
check('the worker is not taught to choose (trap 1): sw.js’s fetch handler, comments aside, names no door, '
  + 'no about page and no preference, and still answers the app’s own document from the cache — while '
  + 'src/front-door.js and src/front-door.css are both precached, so an installed launch offline has the '
  + 'module its boot now asks first',
  fetchHandler.length > 200 && !/door|about|openYear|localStorage|indexedDB/i.test(fetchHandler)
    && /APP_DOCUMENT\.has\(url\.pathname\)/.test(fetchHandler)
    && shellNow.includes('./src/front-door.js') && shellNow.includes('./src/front-door.css'),
  'fetch handler ' + fetchHandler.length + ' chars, mentions a door/about/pref/storage = '
    + /door|about|openYear|localStorage|indexedDB/i.test(fetchHandler)
    + ', SHELL has front-door.js = ' + shellNow.includes('./src/front-door.js')
    + ', front-door.css = ' + shellNow.includes('./src/front-door.css'));

const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const doorJs = strip(await fs.readFile(path.join(ROOT, 'src', 'front-door.js'), 'utf8'));
const storeJs = await fs.readFile(path.join(ROOT, 'src', 'store.js'), 'utf8');
const probeAt = storeJs.indexOf('export async function yearDatabaseListed');
const probeEnd = probeAt >= 0 ? storeJs.indexOf('\n}\n', probeAt) : -1;
const probeBody = probeAt >= 0 && probeEnd > probeAt ? strip(storeJs.slice(probeAt, probeEnd)) : '';
const shellJs = await fs.readFile(path.join(ROOT, 'src', 'shell.js'), 'utf8');
const doorCallAt = shellJs.indexOf('frontDoor.mightBeAStranger()');
const bootCallAt = shellJs.indexOf('await store.boot()');
check('the probe opens nothing and writes nothing (trap 2): yearDatabaseListed() in src/store.js calls '
  + 'indexedDB.databases() and no open() or connect(); src/front-door.js calls no open(), no setPref() '
  + 'and no store function but that one; and src/shell.js asks the door before it calls store.boot()',
  probeBody.length > 50 && /indexedDB\.databases\(\)/.test(probeBody) && !/\bopen\s*\(|connect\s*\(/.test(probeBody)
    && !/\.open\s*\(|setPref|localStorage|indexedDB/.test(doorJs) && /store\.yearDatabaseListed\(/.test(doorJs)
    && (doorJs.match(/\bstore\.[A-Za-z]+(?=\s*\()/g) || []).every((x) => x === 'store.yearDatabaseListed')
    && doorCallAt > 0 && bootCallAt > doorCallAt,
  'probe body ' + probeBody.length + ' chars; store calls in the door = '
    + JSON.stringify([...new Set(doorJs.match(/\bstore\.[A-Za-z]+(?=\s*\()/g) || [])])
    + '; door asked at shell.js offset ' + doorCallAt + ', boot at ' + bootCallAt);

/* ══════════ the driven halves ══════════ */

/* Installed for the whole section: at every task boundary, whether the door or the bare app was on
   the glass. A MutationObserver's callback runs at the end of the task that changed the DOM, so a
   state set and undone inside one task — which no browser paints — is not seen, and a state that
   survived to a paint is. */
const WATCH = await send('Page.addScriptToEvaluateOnNewDocument', { source: `(function(){
  window.__fd = { doorSeen: false, appSeen: false, appBeforeDoor: false };
  new MutationObserver(function(){
    var d = document.getElementById('frontDoor'), l = document.getElementById('loadingScreen');
    if (!d || !l) return;
    var door = !d.classList.contains('hidden'), app = !door && l.classList.contains('hidden');
    if (door) window.__fd.doorSeen = true;
    if (app) { if (!window.__fd.doorSeen) window.__fd.appBeforeDoor = true; window.__fd.appSeen = true; }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
})();` });

async function wipe() {
  await send('Page.navigate', { url: 'about:blank' });
  await pause(250);
  await send('Storage.clearDataForOrigin', { origin: FRESH, storageTypes: 'all' });
}

/* Polls until the page has decided: the door is up, or the loading screen is down with no door. */
async function settle(ms = 12000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const s = await evalJs(`(function(){ var d = document.getElementById('frontDoor'),
        l = document.getElementById('loadingScreen'); if (!d || !l) return 'none';
        if (!d.classList.contains('hidden')) return 'door';
        return l.classList.contains('hidden') ? 'app' : 'wait'; })()`);
      if (s === 'door' || s === 'app') return s;
    } catch (e) { /* the document is still swapping under us */ }
    await pause(150);
  }
  return 'timeout';
}

const READ = `(async function(){
  var door = document.getElementById('frontDoor'), load = document.getElementById('loadingScreen');
  function laidOut(sel){ var e = document.querySelector(sel); if (!e) return null;
    return getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }
  var enter = door ? [].slice.call(door.querySelectorAll('[data-front-door-enter]')).filter(function(b){
    return b.getClientRects().length > 0; }) : [];
  var names = [];
  try { names = (await indexedDB.databases()).map(function(x){ return x.name; }); } catch (e) { names = ['(threw)']; }
  return {
    door: !!door && !door.classList.contains('hidden'),
    loadingUp: !!load && !load.classList.contains('hidden'),
    bodyOpen: document.body.classList.contains('front-door-open'),
    header: laidOut('body > header'), main: laidOut('body > main'), home: laidOut('#homeView'),
    variants: door ? [].slice.call(door.querySelectorAll('[data-front-door-for]')).map(function(p){
      return p.getAttribute('data-front-door-for') + (p.classList.contains('hidden') ? ':hidden' : ''); }) : [],
    lifted: door ? [].slice.call(door.querySelectorAll('[data-front-door]')).map(function(e){
      return e.getAttribute('data-front-door'); }) : [],
    slotsLeft: door ? door.querySelectorAll('[data-front-door-slot]').length : -1,
    caution: door ? door.querySelectorAll('.front-door-caution').length : -1,
    heading: (function(){ var x = door && door.querySelector('[data-front-door-for]:not(.hidden) h2');
      return x ? x.textContent.replace(/\\s+/g, ' ').trim() : null; })(),
    enter: enter.map(function(b){ return { text: b.textContent.replace(/\\s+/g, ' ').trim(),
      primary: b.classList.contains('primary') }; }),
    restore: laidOut('#homeFirstRun [data-backup-panel]'),
    doc: !!(window.planbook && window.planbook.store.getDoc()),
    keys: Object.keys(localStorage), databases: names,
    seen: window.__fd ? { doorSeen: window.__fd.doorSeen, appSeen: window.__fd.appSeen,
      appBeforeDoor: window.__fd.appBeforeDoor } : null };
})()`;

/* One cold visit to a wiped device, with an optional stand-in script for that visit only. */
async function coldVisit(stand, query = '') {
  let ident = null;
  await wipe();
  if (stand) ident = (await send('Page.addScriptToEvaluateOnNewDocument', { source: stand })).identifier;
  try {
    await send('Page.navigate', { url: FRESH + '/index.html' + query });
    await pause(400);
    const settled = await settle();
    try { await evalJs(KILL_ANIM); } catch (e) { /* the check reports it */ }
    const state = await evalJs(READ);
    return { settled, ...state };
  } finally {
    if (ident) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: ident });
  }
}

const ua = (s, touch) => `Object.defineProperty(Navigator.prototype, 'userAgent', { configurable: true,
  get: function(){ return ${JSON.stringify(s)}; } });
  Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { configurable: true,
  get: function(){ return ${touch}; } });`;

/* ── Acceptance 1 and 4: the cold visit — the door, and nothing written ── */

const cold = await coldVisit(null);
check('a cold, non-installed visit with no stored year shows the front door — the laptop door in this '
  + 'browser, the only variant left in it, its way in the primary and reading "Use it in this browser" — '
  + 'INSTEAD of the app: the header and main are not laid out, the loading screen is down, every slot '
  + 'is filled, and the bare app was never on the glass before it (WO-8.16 Acceptance 1 and 2)',
  cold.settled === 'door' && cold.door === true && cold.bodyOpen === true && cold.loadingUp === false
    && cold.header === false && cold.main === false
    && JSON.stringify(cold.variants) === '["laptop"]' && cold.slotsLeft === 0 && cold.caution === 0
    && cold.enter.length === 1 && cold.enter[0].primary === true && cold.enter[0].text === 'Use it in this browser'
    && !!cold.seen && cold.seen.appSeen === false && cold.seen.appBeforeDoor === false,
  JSON.stringify({ settled: cold.settled, door: cold.door, header: cold.header, main: cold.main,
    loadingUp: cold.loadingUp, variants: cold.variants, slotsLeft: cold.slotsLeft, enter: cold.enter,
    heading: cold.heading, seen: cold.seen }));

check('detecting "no school year stored" writes nothing: with the door up, indexedDB.databases() lists '
  + 'no `planbook` database — the probe did not create one — localStorage holds no key at all, and no '
  + 'year document is open (WO-8.16 Acceptance 4, trap 2)',
  cold.door === true && Array.isArray(cold.databases) && !cold.databases.includes('planbook')
    && !cold.databases.includes('(threw)') && cold.keys.length === 0 && cold.doc === false,
  'databases = ' + JSON.stringify(cold.databases) + ', localStorage keys = ' + JSON.stringify(cold.keys)
    + ', a document open = ' + cold.doc);

/* ── Deliverable 3: the words are about.html's, lifted and not retyped ── */

const words = await evalJs(`(async function(){
  var door = document.getElementById('frontDoor');
  var text = function(e){ return e.textContent.replace(/\\s+/g, ' ').trim(); };
  var src = new DOMParser().parseFromString(await (await fetch('./about.html', { cache: 'no-store' })).text(), 'text/html');
  var pieces = [].slice.call(door.querySelectorAll('[data-front-door]')).map(function(e){
    var name = e.getAttribute('data-front-door'), there = src.querySelector('[data-front-door="' + name + '"]');
    return { name: name, same: !!there && text(e) === text(there), chars: text(e).length }; });
  var sentences = [].slice.call(src.querySelectorAll('[data-front-door]')).map(text)
    .join(' ').split(/(?<=[.!?])\\s+/).filter(function(s){ return s.length >= 40; });
  var index = await (await fetch('./index.html?wo816=' + Date.now(), { cache: 'no-store' })).text();
  var module = await (await fetch('./src/front-door.js?wo816=' + Date.now(), { cache: 'no-store' })).text();
  var flat = function(t){ return t.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' '); };
  var retyped = sentences.filter(function(s){ var probe = s.slice(0, 40);
    return flat(index).indexOf(probe) >= 0 || flat(module).indexOf(probe) >= 0; });
  return { pieces: pieces, sentences: sentences.length, retyped: retyped }; })()`);
const wantPieces = ['lede', 'install', 'steps-laptop', 'backup', 'what', 'where'];
check('the door’s words are about.html’s, word for word, and are typed nowhere else: each of the six '
  + 'pieces on the laptop door matches its `data-front-door` source in about.html, and no sentence of '
  + 'them appears in index.html or src/front-door.js (WO-8.16 Deliverable 3)',
  words.pieces.length === wantPieces.length
    && wantPieces.every((n) => words.pieces.some((p) => p.name === n && p.same === true && p.chars > 20))
    && words.sentences >= 10 && words.retyped.length === 0,
  JSON.stringify(words));

/* ── the door under a coarse pointer ── */

const wasCoarse = await evalJs("matchMedia('(pointer: coarse)').matches");
let boxes = null;
try {
  if (!wasCoarse) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  boxes = await evalJs(`(function(){ var door = document.getElementById('frontDoor');
    var all = [].slice.call(door.querySelectorAll('button, a')).filter(function(e){ return e.getClientRects().length; });
    var controls = all.filter(function(e){ return e.tagName === 'BUTTON' || e.classList.contains('block-link'); });
    return { coarse: matchMedia('(pointer: coarse)').matches, controls: controls.map(function(e){
      var r = e.getBoundingClientRect(); return { what: e.tagName + (e.className ? '.' + e.className.split(' ').join('.') : ''),
        w: Math.round(r.width), h: Math.round(r.height) }; }) }; })()`);
} finally {
  if (!wasCoarse) await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
check('every control on the door — the way in, and about.html’s two document links standing on their own '
  + 'lines — measures at least 44px tall under a pointer that really is coarse (a link inside a sentence '
  + 'is text, privacy.html’s distinction)',
  !!boxes && boxes.coarse === true && boxes.controls.length >= 3
    && boxes.controls.every((c) => c.h >= 44 && c.w >= 44),
  JSON.stringify(boxes));

/* ── trap 4: the way in lands on the home screen, one tap from Restore ── */

await clickSel('[data-front-door-enter]');
const settledIn = await settle();
let inside = null;
for (let i = 0; i < 40; i++) {
  inside = await evalJs(READ);
  if (inside.restore === true) break;
  await pause(150);
}
check('"Use it in this browser" lands on the home screen with Restore on it: the door is down, the '
  + 'header and the home view are laid out, the empty state’s "Restore a backup file" is drawn — so a '
  + 'teacher who cleared this device to restore onto it is one tap from Restore — and only NOW, after '
  + 'the choice, does a `planbook` database and the open-year preference exist (WO-8.16 trap 4, '
  + 'Acceptance 4)',
  cold.door === true && settledIn === 'app' && inside.door === false && inside.bodyOpen === false && inside.loadingUp === false
    && inside.header === true && inside.home === true && inside.restore === true && inside.doc === true
    && inside.databases.includes('planbook') && inside.keys.includes('planbook_openYear'),
  JSON.stringify({ settled: settledIn, door: inside.door, header: inside.header, home: inside.home,
    restore: inside.restore, databases: inside.databases, keys: inside.keys }));

/* ── Acceptance 1, second half: a browser that already holds a year goes straight in ── */

await evalJs('window.planbook.store.flush().then(function(){ return 1; })');
await send('Page.navigate', { url: FRESH + '/index.html' });
await pause(400);
const again = { settled: await settle(), ...(await evalJs(READ)) };
check('a browser visit to a device that already holds a year opens the app with no flash of the door: '
  + 'the same device, reloaded with no flag, boots to the home screen and the door was never on the glass',
  again.settled === 'app' && again.home === true && !!again.seen && again.seen.doorSeen === false,
  JSON.stringify({ settled: again.settled, home: again.home, seen: again.seen }));

/* The preference ASKED FIRST: with databases() standing in as "this browser has none", the stored
   open-year preference alone must send the visit straight in — the ruled order, and the reason no
   returning teacher waits on the async half. */
const emptyList = (await send('Page.addScriptToEvaluateOnNewDocument', { source:
  'IDBFactory.prototype.databases = function(){ return Promise.resolve([]); };' })).identifier;
let prefFirst = null;
try {
  await send('Page.navigate', { url: FRESH + '/index.html' });
  await pause(400);
  prefFirst = { settled: await settle(), ...(await evalJs(READ)) };
} finally {
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: emptyList });
}
check('the preference is asked first: with indexedDB.databases() standing in as "no databases at all", '
  + 'a browser holding the open-year preference still opens the app with no door — the preference '
  + 'answers before the probe’s async half is reached (ruling 3)',
  prefFirst.settled === 'app' && prefFirst.home === true && !!prefFirst.seen && prefFirst.seen.doorSeen === false
    && prefFirst.keys.includes('planbook_openYear'),
  JSON.stringify({ settled: prefFirst.settled, seen: prefFirst.seen, keys: prefFirst.keys }));

/* The preference gone and the database kept: the probe's second half answers alone. */
await evalJs("(function(){ localStorage.removeItem('planbook_openYear'); return 1; })()");
await send('Page.navigate', { url: FRESH + '/index.html' });
await pause(400);
const byList = { settled: await settle(), ...(await evalJs(READ)) };
check('and the probe’s second half holds on its own: with the open-year preference removed but the '
  + '`planbook` database still there, indexedDB.databases() names it and the app opens with no door '
  + '(ruling 3)',
  byList.settled === 'app' && byList.home === true && !!byList.seen && byList.seen.doorSeen === false
    && byList.databases.includes('planbook'),
  JSON.stringify({ settled: byList.settled, seen: byList.seen, databases: byList.databases }));

/* ── Acceptance 3: an installed launch on a device the worker controls is still answered from Cache
   Storage. The query is unique so the browser's own HTTP cache cannot be what answered (the
   argument verify/policy-url.mjs makes); the navigate branch compares the pathname, so the worker
   still recognises the app's own document. ── */
const controlled = await evalJs('!!navigator.serviceWorker.controller');
const standIn = (await send('Page.addScriptToEvaluateOnNewDocument', { source:
  "Object.defineProperty(Navigator.prototype, 'standalone', { configurable: true, get: function(){ return true; } });" })).identifier;
let fromCache = null;
const servedBefore = h.SERVED.length;
try {
  await send('Page.navigate', { url: FRESH + '/index.html?wo816=' + Date.now() });
  await pause(400);
  fromCache = { settled: await settle(), ...(await evalJs(READ)) };
} finally {
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: standIn });
}
const docAsked = h.SERVED.slice(servedBefore).filter((p) => p === '/' || p === '/index.html');
const doorAsked = h.SERVED.slice(servedBefore).filter((p) => /front-door/.test(p) || /about\.html$/.test(p));
check('an installed launch of a device the worker controls is unchanged: the app’s document came out of '
  + 'Cache Storage — the static server was asked for it zero times — the front door’s module and sheet '
  + 'were not fetched either, about.html was not asked for, and the app booted with no door (WO-8.16 '
  + 'Acceptance 3, trap 1)',
  controlled === true && fromCache.settled === 'app' && fromCache.home === true && !!fromCache.seen
    && fromCache.seen.doorSeen === false && docAsked.length === 0 && doorAsked.length === 0,
  'controlled before = ' + controlled + ', settled = ' + fromCache.settled + ', door seen = '
    + JSON.stringify(fromCache.seen) + ', requests for the document = ' + docAsked.length
    + ', for the door or about.html = ' + JSON.stringify(doorAsked) + ', out of '
    + (h.SERVED.length - servedBefore) + ' request(s): ' + JSON.stringify(h.SERVED.slice(servedBefore).slice(0, 8)));

/* ── an installed launch, cold: no door, with or without a year ── */

const installed = await coldVisit(`Object.defineProperty(Navigator.prototype, 'standalone', {
  configurable: true, get: function(){ return true; } });`);
check('an installed launch opens the app with no flash of the door, even on a device holding no year: '
  + 'with iOS’s installed flag standing in, a cold visit boots straight to the home screen and the door '
  + 'was never on the glass (WO-8.16 Acceptance 1)',
  installed.settled === 'app' && installed.home === true && !!installed.seen && installed.seen.doorSeen === false,
  JSON.stringify({ settled: installed.settled, home: installed.home, seen: installed.seen }));

/* ── doubt draws no door ── */

const missing = await coldVisit('delete IDBFactory.prototype.databases;');
const throwing = await coldVisit(`IDBFactory.prototype.databases = function(){
  return Promise.reject(new Error('stand-in: databases() refused')); };`);
const noWords = await coldVisit(`(function(){ var f = window.fetch; window.fetch = function(u){
  if (String(u && u.url ? u.url : u).indexOf('about.html') >= 0) return Promise.reject(new TypeError('stand-in: offline'));
  return f.apply(this, arguments); }; })();`);
check('doubt draws no door — a front door, not a gate: a cold visit where indexedDB.databases() is '
  + 'missing, where it throws, and where about.html cannot be fetched each opens the app instead '
  + '(ruling 3, Deliverable 3)',
  [missing, throwing, noWords].every((s) => s.settled === 'app' && s.home === true && !!s.seen
    && s.seen.doorSeen === false),
  JSON.stringify({ missing: [missing.settled, missing.seen], throwing: [throwing.settled, throwing.seen],
    noWords: [noWords.settled, noWords.seen] }));

/* ── the flag the rest of the run rides on ── */

const skipped = await coldVisit(null, '?door=skip');
check('`?door=skip` on a loopback host passes the door on a cold visit — the flag every other section '
  + 'loads with — and the door was never on the glass (trap 5)',
  skipped.settled === 'app' && skipped.home === true && !!skipped.seen && skipped.seen.doorSeen === false,
  JSON.stringify({ settled: skipped.settled, seen: skipped.seen }));

/* ── the two other doors, by browser ── */

const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ipad = await coldVisit(ua(IPAD, 5));
check('iPad Safari gets the iOS door, as drawn: "Install it on this iPad", about.html’s iPad steps first '
  + 'and its one caution beside them, the way in last and NOT primary, worded "Use it in Safari for now" — '
  + 'the door, never a gate (ruling 4, trap 3)',
  ipad.settled === 'door' && JSON.stringify(ipad.variants) === '["ios"]' && ipad.slotsLeft === 0
    && ipad.heading === 'Install it on this iPad' && ipad.caution === 1
    && ipad.lifted.includes('steps-ios') && ipad.lifted.includes('caution') && !ipad.lifted.includes('backup')
    && ipad.enter.length === 1 && ipad.enter[0].primary === false && ipad.enter[0].text === 'Use it in Safari for now',
  JSON.stringify({ settled: ipad.settled, variants: ipad.variants, heading: ipad.heading, lifted: ipad.lifted,
    caution: ipad.caution, enter: ipad.enter }));

const FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0';
const firefox = await coldVisit(ua(FIREFOX, 0));
check('Firefox on a desktop gets its own words — "Planbook works in this browser", about.html’s '
  + 'cannot-install paragraph and its backup line, no caution — with the way in as the primary (ruling 5)',
  firefox.settled === 'door' && JSON.stringify(firefox.variants) === '["cannot"]' && firefox.slotsLeft === 0
    && firefox.heading === 'Planbook works in this browser' && firefox.caution === 0
    && firefox.lifted.includes('cannot-install') && firefox.lifted.includes('backup')
    && firefox.enter.length === 1 && firefox.enter[0].primary === true
    && firefox.enter[0].text === 'Use it in this browser',
  JSON.stringify({ settled: firefox.settled, variants: firefox.variants, heading: firefox.heading,
    lifted: firefox.lifted, enter: firefox.enter }));

/* ── hand the page back ── */

await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: WATCH.identifier });
await wipe();
await load();
const fixtureAfter = await evalJs(FINGERPRINT);
check('the run’s own device was never touched: the page is back at 127.0.0.1 on the same document at the '
  + 'same rev, with no door on it, and the fresh origin is wiped',
  fixtureAfter.origin === fixtureBefore.origin && fixtureAfter.docId === fixtureBefore.docId
    && fixtureAfter.rev === fixtureBefore.rev && fixtureAfter.classes === fixtureBefore.classes
    && fixtureAfter.students === fixtureBefore.students
    && (await evalJs("document.getElementById('frontDoor').classList.contains('hidden')")) === true,
  JSON.stringify({ before: fixtureBefore, after: fixtureAfter }));
}
