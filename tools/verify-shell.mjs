/* verify-shell.mjs — drive the real app in a headless browser and measure it.
 *
 * Run:  node tools/verify-shell.mjs
 * Exit: 0 if every check passed, 1 if any failed or the browser could not be driven.
 *
 * WHY THIS EXISTS. Several of Phase 1's acceptance lines cannot be settled by reading a
 * stylesheet. WO-1.2 shipped `.search-box { min-height: 44px }` around a 19px input: the
 * wrapper measured 44px, the input did not, and tapping above the text did nothing. A
 * stylesheet review calls that line compliant. Measuring it does not. Everything here is a
 * claim that grep would get wrong.
 *
 * It is NOT a test framework, and the distinction matters — `CLAUDE.md` and Roll Call!'s
 * `plans/b-hygiene.md` rule out linters and test frameworks. This is one dependency-free
 * `.mjs` under `tools/`, run by hand, exactly as `tools/README.md` describes; Roll Call!'s
 * `design/execution-guide.md` §7 already says to verify by driving the built demo in headless
 * Edge over CDP. `TESTING.md` remains the gate. This tool feeds it evidence.
 *
 * Read `tools/README.md` § "Driving a browser over CDP" before changing anything below. Two
 * of the traps documented there were discovered twice, by two different agents, because they
 * present as app defects rather than harness bugs.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/* The schema this build writes. Written out here rather than read off the app, so that the checks
   below which say "the document came out at the current version" are claims about a NUMBER and not
   a comparison of the app with itself. It went 1 → 2 at WO-2.10, when every `marks` cell became an
   object, and 2 → 3 at WO-2.8, when the document grew `openPasses` and `passes`; the next
   migration changes this line and the assertions that use it. */
const SCHEMA_NOW = 3;

/* The two controls that replaced the ~950-line soft cap on 2026-08-05, retired after binding once
   in four work orders — it could not tell coverage from bloat on a file that grows with the app's
   surface. `plans/verification-tooling.md` § "Retiring the line cap" holds the reasoning, and says
   these get reported beside the check count so that neither is a number nobody computes. Lines per
   check catches 400 lines buying five checks; runtime catches the harness quietly becoming too slow
   to run before a commit, which is how one actually dies. Neither gates anything — this file gates
   nothing, by the first rule in that document. They are printed to be looked at. */
const RUN_STARTED = Date.now();

/* Derived, not hardcoded. This script gets run once every few months by someone who has
   forgotten it exists, possibly from a clone at a different path. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

/* Every browser that speaks CDP and is plausibly on a Windows teacher-laptop. Edge first
   because that is what the suite's execution guide names. */
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

/* ────────────────────────────── result bookkeeping ────────────────────────────── */

const results = [];
function check(name, ok, detail) {
  results.push({ name, state: ok ? 'pass' : 'fail', detail: detail || '' });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? '  :: ' + detail : ''));
}
/* A skipped check is announced, never silent. A fixture that quietly stopped existing is how
   a suite of 27 checks becomes a suite of 4 that still prints green. */
function skip(name, why) {
  results.push({ name, state: 'skip', detail: why });
  console.log('SKIP | ' + name + '  :: ' + why);
}

/* ────────────────── reading localStorage, and whose keys are whose ──────────────────
 *
 * THE BROWSER CAN WRITE INTO THE PAGE'S LOCALSTORAGE TOO, which took two red runs at WO-1.9 to
 * believe. `shopifySelectors` and `debug` appeared mid-run — intermittently, on a throwaway
 * profile, on a page served from 127.0.0.1 that nothing but this app touches, and never on a
 * shorter probe of the same page. They were suspected to be Edge's, not Planbook's, and
 * `--disable-extensions` plus `--disable-component-extensions-with-background-pages` went on the
 * launch line as the fix (see below).
 *
 * The two checks that read localStorage assert "every key here starts with planbook_" — this
 * was dropped once, on the reasoning that the environment noise made the assertion unreliable,
 * but trap 7 in tools/README.md is the precedent against exactly that move: dropping a
 * sensitive-feeling assertion because the harness looks unreliable leaves the check measuring
 * almost nothing, and it goes green whether or not a leak is present. The environment gets
 * fixed instead (the two flags above), and the assertion is kept and trusted. src/prefs.js is
 * the only door to localStorage in this repo and it prefixes everything it writes, which
 * tools/wo-sweep.mjs settles statically by grep as well — both catch a key written outside the
 * door, one at the source and one in the browser.
 *
 * Every key, ours or not, and every value, is still searched for the fixture's own phrases: what
 * makes a key a leak is what is in it as much as what it's named. And a foreign key is always
 * PRINTED when the check fails, so a reader can see what was in the store.
 */
function readLocalStore(evaluate, limit) {
  return evaluate(`(function(){ var out = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i); out[k] = String(localStorage.getItem(k)).slice(0, ` + limit + `); }
    return out; })()`);
}
const oursIn = (store) => Object.keys(store).filter(k => k.indexOf('planbook_') === 0);
const foreignIn = (store) => Object.keys(store).filter(k => k.indexOf('planbook_') !== 0);
const storeDetail = (store) => oursIn(store).join(', ')
  + (foreignIn(store).length ? ' · not ours, and searched anyway: ' + foreignIn(store).join(', ') : '');

/* ───────────────── the precache covers the module graph ─────────────────
 *
 * Static, and deliberately so. `plans/verification-tooling.md` allows "static preconditions
 * that silently disable a feature", which is exactly this: nothing else in this file so much
 * as opens `sw.js`, because it drives a page and never an installed app.
 *
 * WO-1.4 shipped `src/store.js` and `src/year-picker.js` without adding either to SHELL, and
 * every desk check still passed — a served page fetches them over the network without
 * complaint. Only an installed app with the network gone shows it, and by then it is on a
 * teacher's iPad, where the symptom is an app that will not open. This is the safe-area
 * precondition again in a new place: a check that reports green while measuring nothing.
 */
{
  const swSrc = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const shellBlock = swSrc.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
  const shell = shellBlock
    ? [...shellBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1].replace(/^\.\//, ''))
    : [];
  check('sw.js still declares a SHELL array this check can read',
    shell.length > 0, shell.length + ' entries');

  /* Transitive, not just the entry points: a module reached only through shell.js's imports
     is exactly as absent offline as one named in index.html, and easier to forget. */
  const seen = new Set();
  async function walk(rel) {
    if (seen.has(rel) || !rel.endsWith('.js')) return;
    seen.add(rel);
    let src = '';
    try { src = await fs.readFile(path.join(ROOT, rel), 'utf8'); } catch { return; }
    for (const m of src.matchAll(/import[^'"]*['"]([^'"]+)['"]/g)) {
      if (!m[1].startsWith('.')) continue;
      await walk(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
    }
  }
  const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
  for (const m of html.matchAll(/<script\b[^>]*>/gi)) {
    if (!/type\s*=\s*["']module["']/i.test(m[0])) continue;
    const src = m[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (src) await walk(src[1].replace(/^\.\//, ''));
  }
  const missing = [...seen].filter(rel => !shell.includes(rel));
  /* Guarded against a vacuous pass: an empty walk and a complete one are the same value here,
     and a regex that stops matching would report the empty one as green. */
  check('every module reachable from index.html is precached by sw.js',
    seen.size >= 3 && missing.length === 0,
    seen.size + ' modules walked'
      + (missing.length ? ', NOT in SHELL: ' + missing.join(', ') : ''));
}

/* ────────────────────────────── static server ────────────────────────────── */

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); res.end('no'); return; }
  try {
    const buf = await fs.readFile(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

function bail(msg) {
  console.error('\nCANNOT RUN: ' + msg);
  try { server.close(); } catch {}
  process.exit(1);
}

/* ────────────────────────────── launch the browser ────────────────────────────── */

let exe = null;
for (const b of BROWSERS) { try { await fs.access(b); exe = b; break; } catch {} }
if (!exe) bail('no Edge or Chrome found. Looked in:\n  ' + BROWSERS.join('\n  '));
console.log('browser : ' + exe);
console.log('serving : ' + ROOT + ' on 127.0.0.1:' + PORT + '\n');

const udd = await fs.mkdtemp(path.join(os.tmpdir(), 'pb-verify-'));

/* Port 0 lets the browser choose, and it writes the choice to DevToolsActivePort. A fixed
   port collides with a previous run that did not shut down cleanly, and the failure looks
   like "the app broke" rather than "something else owns 9333". */
/* The two extension flags are the suspected source of the foreign localStorage keys described at
   readLocalStore() above — Edge ships features as bundled component extensions, and a content
   script of one of them is the only thing on this machine that could be writing into the store of
   a page served from 127.0.0.1. Suspected, not proven: the injection was intermittent and could
   not be reproduced on demand, so the assertions below do not depend on these flags working. */
const proc = spawn(exe, [
  '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + udd,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  '--disable-extensions', '--disable-component-extensions-with-background-pages',
  'about:blank',
], { stdio: 'ignore' });
proc.on('error', e => bail('could not spawn the browser: ' + e.message));

async function debuggerUrl() {
  const portFile = path.join(udd, 'DevToolsActivePort');
  for (let i = 0; i < 100; i++) {
    try {
      const txt = await fs.readFile(portFile, 'utf8');
      const [port, wsPath] = txt.split('\n');
      if (port && wsPath) return 'ws://127.0.0.1:' + port.trim() + wsPath.trim();
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('the browser never wrote DevToolsActivePort');
}

let ws;
try {
  ws = new WebSocket(await debuggerUrl());
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('CDP socket refused')); });
} catch (e) { proc.kill(); bail(e.message); }

let id = 0, sessionId = null;
const pending = new Map();
/* Everything the page logged, in order. Runtime.enable is already on, so these events were
   arriving and being dropped; keeping them is what lets a check assert that a failure was
   REPORTED and not only handled — "does not silently swallow" is an acceptance line, and the
   console is where a swallowed error would have gone. */
const consoleLog = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    const args = (msg.params.args || []).map(a => (a.value !== undefined ? String(a.value) : (a.description || '')));
    consoleLog.push({ type: msg.params.type, text: args.join(' ') });
    return;
  }
  if (msg.id && pending.has(msg.id)) {
    const e = pending.get(msg.id); pending.delete(msg.id);
    msg.error ? e.rej(new Error(JSON.stringify(msg.error))) : e.res(msg.result);
  }
};
function send(method, params = {}, useSession = true) {
  const mid = ++id;
  const payload = { id: mid, method, params };
  if (useSession && sessionId) payload.sessionId = sessionId;
  ws.send(JSON.stringify(payload));
  return new Promise((res, rej) => pending.set(mid, { res, rej }));
}

const target = await send('Target.createTarget', { url: 'about:blank' }, false);
const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false);
sessionId = attached.sessionId;
await send('Page.enable');
await send('Runtime.enable');

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || 'eval threw');
  }
  return r.result.value;
}
async function has(sel) { return await evalJs('!!document.querySelector(' + JSON.stringify(sel) + ')'); }

/* Input.dispatchMouseEvent takes VIEWPORT coordinates, so a target below the fold is not
   clicked — the event lands on whatever is at that spot on screen, or on nothing, and the
   failure reads as "the modal stopped opening". Scroll it into view first, then measure.
   WO-1.3's install banner is what exposed this: it added ~150px above the shelf and pushed
   the second modal opener off an 800x600 headless window. */
async function clickSel(sel, nth = 0) {
  const box = await evalJs('(function(){var e=document.querySelectorAll(' + JSON.stringify(sel) + ')['
    + nth + '];if(!e)return null;e.scrollIntoView({block:"center"});var r=e.getBoundingClientRect();'
    + 'return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  if (!box) throw new Error('nothing to click for ' + sel + ' [' + nth + ']');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 150));
}

/* Headless Chromium with no visible frame never advances a transition or a keyframe, so
   getBoundingClientRect returns start-of-animation values. `.modal-close` measures 42.24px —
   which is 44 x 0.96, the srIn keyframe's opening scale — and reads exactly like a failed
   touch target. Kill animation before measuring anything, and re-apply after every reload. */
const KILL_ANIM = "(function(){var s=document.createElement('style');"
  + "s.textContent='*,*::before,*::after{transition:none !important;animation:none !important}';"
  + "document.head.appendChild(s);return 1})()";

/* One rule walker, installed page-side, used by every stylesheet check below.
 *
 * THE TRAP, and it is subtle enough to have cost two harnesses: a modern CSSStyleRule exposes
 * its own `.cssRules` — an empty CSSRuleList, present because CSS nesting exists. So the
 * obvious walk
 *
 *     if (r.cssRules) { walk(r.cssRules); continue; }   // WRONG
 *
 * treats every ordinary style rule as a container, recurses into nothing, and skips it. A
 * stylesheet of 120 rules reports 3, every selector search comes back empty, and nothing
 * throws. It reads as a clean pass. Process the rule first, THEN recurse into any children.
 */
const INSTALL_WALKER = `(function(){
  window.__eachRule = function(fn){
    var seen = 0;
    function walk(list){
      for (var i=0;i<list.length;i++){
        var r = list[i];
        if (r.style) { seen++; fn(r, r.selectorText || r.keyText || '(' + r.constructor.name + ')'); }
        if (r.cssRules && r.cssRules.length) walk(r.cssRules);
      }
    }
    for (var j=0;j<document.styleSheets.length;j++){
      try { walk(document.styleSheets[j].cssRules); } catch(e){}
    }
    return seen;
  };
  return 1;
})()`;

/* Boot is asynchronous since WO-1.4 — the page hides its loading screen only once the year
   document is out of IndexedDB — so a fixed sleep is a race on a slow machine, and losing it
   would look like every check below failing at once. Poll instead, and report rather than
   hang. Returns false if the app never came up, which is a failure and never a skip. */
async function waitForBoot(ms = 8000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const up = await evalJs("(function(){var l=document.getElementById('loadingScreen');"
        + "return !!(l && l.classList.contains('hidden'))})()");
      if (up) return true;
    } catch { /* the document is still swapping under us */ }
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

async function load() {
  await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/index.html' });
  await new Promise(r => setTimeout(r, 800));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
}
await load();

const booted = await evalJs("document.querySelectorAll('*').length");
if (booted < 20) bail('the page did not render — is index.html a placeholder?');

/* ───────────────── the focus ring, both directions ───────────────── */

console.log('\n--- focus ring ---');
const SHEETWALK = `(function(){
  var out=[], bad=[];
  var seen = window.__eachRule(function(r, label){
    if (label.indexOf(':focus-visible')>=0)
      out.push({sel:label, css:r.style.cssText, w:r.style.outlineWidth,
                s:r.style.outlineStyle, c:r.style.outlineColor, off:r.style.outlineOffset,
                props:Array.prototype.slice.call(r.style)});
    var ow=(r.style.outlineWidth||'').trim(), os=(r.style.outlineStyle||'').trim(),
        ol=(r.style.outline||'').trim();
    if (os==='none'||ow==='0px'||ow==='0'||ol==='none'||ol==='0'||ol==='0px')
      bad.push({sel:label, css:r.style.cssText});
  });
  return {out:out, bad:bad, seen:seen, sheets:document.styleSheets.length};
})()`;
const fv = await evalJs(SHEETWALK);
check('the rule walker reached a plausible number of style rules (guards a vacuous pass)',
  fv.seen > 50, 'style rules walked = ' + fv.seen + ' across ' + fv.sheets + ' sheet(s)');
check('exactly one :focus-visible rule, and its selector is global',
  fv.out.length === 1 && fv.out[0].sel === ':focus-visible',
  JSON.stringify(fv.out.map(o => o.sel)));
/* Longhands, not a string compare: Chromium re-serializes the shorthand as
   "rgb(91,111,204) solid 2px" and a naive compare fails on a correct rule. And "declares
   nothing else" is a property-set assertion, not a count — `outline` + `outline-offset`
   enumerates as FOUR longhands (color, style, width, offset), so counting to 2 fails on a
   correct rule too. */
const OUTLINE_PROPS = ['outline', 'outline-color', 'outline-style', 'outline-width', 'outline-offset'];
const strayProps = (fv.out[0]?.props || []).filter(p => !OUTLINE_PROPS.includes(p));
check('it is outline 2px solid rgb(91,111,204) + offset 2px, and declares nothing else',
  !!fv.out[0] && fv.out[0].w === '2px' && fv.out[0].s === 'solid'
    && fv.out[0].c === 'rgb(91, 111, 204)' && fv.out[0].off === '2px' && strayProps.length === 0,
  fv.out[0] ? fv.out[0].css + (strayProps.length ? ' | STRAY: ' + strayProps.join(', ') : '') : 'missing');
check('no rule in any loaded sheet, including inside @media, removes an outline',
  fv.bad.length === 0, JSON.stringify(fv.bad));

/* ───────────────── inline colors, no custom properties ───────────────── */

console.log('\n--- no CSS custom properties ---');
const VARWALK = `(function(){ var found=[];
  window.__eachRule(function(r, label){
    for (var k=0;k<r.style.length;k++) if (r.style[k].indexOf('--')===0)
      found.push('DECLARES '+label+' {'+r.style[k]+'}');
    if ((r.style.cssText||'').indexOf('var(--')>=0) found.push('USES var() in '+label);
  });
  return found; })()`;
const vars = await evalJs(VARWALK);
check('zero custom-property declarations and zero var() uses at runtime',
  vars.length === 0, JSON.stringify(vars));

/* ───────────────── safe-area insets: the PRECONDITION, not just the declaration ─────────────────
 *
 * This check exists because two agents verified WO-1.2's safe-area work by confirming the
 * env() declarations were present, and both handed the line to a human as "needs a real iPad."
 * Neither asked whether the declarations could resolve non-zero at all. They cannot without
 * viewport-fit=cover: iOS resolves every inset to 0 without it, so the iPad pass succeeds by
 * having nothing to test. Deferring to hardware is what you do AFTER ruling out a static
 * precondition, not instead of it.
 */

console.log('\n--- safe-area insets ---');
const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
const viewport = (html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i) || [''])[0];
const usesEnv = await evalJs(`(function(){ var hits=[];
  window.__eachRule(function(r, label){
    if ((r.style.cssText||'').indexOf('env(safe-area-inset')>=0) hits.push(label);
  });
  return hits; })()`).then(h => h.length);
console.log('viewport meta   : ' + viewport.trim());
console.log('rules using env(safe-area-inset*) : ' + usesEnv);
if (usesEnv === 0) {
  skip('env(safe-area-inset*) is usable on iOS', 'no rule uses it yet');
} else {
  check('env(safe-area-inset*) can resolve non-zero on iOS — viewport-fit=cover is set',
    /viewport-fit\s*=\s*cover/i.test(viewport),
    /viewport-fit/i.test(viewport) ? viewport.trim()
      : usesEnv + ' rules declare an inset, but without viewport-fit=cover iOS resolves every one'
        + ' of them to 0. The declarations are inert and no iPad pass can tell you so.');
}

/* ───────────────── the modal, driven rather than read ───────────────── */

/*
  RE-POINTED AT WO-1.10, and the reason is the whole reason that work order carries this file.
  This section used to drive `#aboutModal` through `[data-modal-open]`, and the second and third of
  those openers were two buttons on the WO-1.2 component shelf, labelled "Open from here" and "Open
  from here instead" — fixtures whose only job was to make focus-return falsifiable. Deleting the
  shelf left one opener on the page and this whole block would have degraded to an announced SKIP:
  correct behaviour, and worthless, because a run that is mostly skips proves nothing.

  So it drives the class manager instead, which needs no fixtures at all. `#classesModal` has two
  REAL openers that are on screen on every launch — the "+" (or "Add a class") tab at the end of the
  header's class strip, and the gear beside it on the bottom row — and they go through the same
  openModal() with the same opener argument, so every behaviour asserted below is asserted about the
  code path a teacher actually uses. It is a better fixture than the one it replaces: the shelf's two
  buttons sat side by side in one container, where these two are in different containers, one of them
  inside a horizontal scroller.

  SCOPED TO `header`, and that is not tidiness. `[data-class-manage]` now appears three times: those
  two, plus "Add your first class" in the home screen's empty state — which is INSIDE a `.hidden`
  container whenever the other two are worth clicking. querySelectorAll counts hidden elements, so an
  unscoped selector would hand clickSel an element measuring 0x0 and the click would land in the
  top-left corner of the viewport on whatever happens to be there. That is the viewport-coordinate
  trap in clickSel's own comment, arriving through the fixture instead of through the scroll offset.
*/
console.log('\n--- modal behaviour ---');
const MODAL = '#classesModal';
const OPENER = 'header [data-class-manage]';
/* Visible openers, not present ones, for the reason in the block above. */
const openerCount = await evalJs("Array.prototype.slice.call(document.querySelectorAll("
  + JSON.stringify(OPENER) + ")).filter(function(e){return e.offsetWidth>0||e.offsetHeight>0}).length");
if (!(await has(MODAL)) || openerCount < 2) {
  /* Two openers for one modal is what makes focus-return falsifiable: an implementation that
     always returns focus to the first opener on the page passes with one and fails with two. */
  skip('modal opens, traps focus, closes, and returns focus to its opener',
    'needs ' + MODAL + ' and >=2 visible ' + OPENER + ' on the page; found ' + openerCount);
} else {
  const INSTALL = [
    'window.__panel=function(){return document.querySelector("' + MODAL + ' [role=\'dialog\']")};',
    'window.__f=function(){',
    '  var sel="a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),'
      + ' textarea:not([disabled]), [tabindex]:not([tabindex=\'-1\'])";',
    '  return Array.prototype.slice.call(window.__panel().querySelectorAll(sel))',
    '    .filter(function(n){return n.offsetWidth>0||n.offsetHeight>0});',
    '};1',
  ].join('\n');
  await evalJs(INSTALL);

  /* clickSel is the shared helper defined above, with the viewport-coordinate trap in its
     comment. It is shared because the store section drives the year picker the same way. */
  const key = async (k, code, vk, mods = 0) => {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: mods });
    await new Promise(r => setTimeout(r, 120));
  };
  const isOpen = () => evalJs("!document.querySelector('" + MODAL + "').classList.contains('hidden')");
  const activeIs = (nth) => evalJs("document.activeElement===document.querySelectorAll("
    + JSON.stringify(OPENER) + ")[" + nth + "]");

  const second = Math.min(2, openerCount - 1);
  await clickSel(OPENER, second);
  check('modal opens on click', await isOpen());
  check('focus moved inside the panel', await evalJs('window.__panel().contains(document.activeElement)'));

  await evalJs('(function(){var f=window.__f();f[f.length-1].focus();return 1})()');
  await key('Tab', 'Tab', 9);
  check('Tab from the last focusable wraps to the first, inside the panel',
    await evalJs('(function(){var f=window.__f();return document.activeElement===f[0]})()'));
  await key('Tab', 'Tab', 9, 8);
  check('Shift+Tab from the first wraps to the last',
    await evalJs('(function(){var f=window.__f();return document.activeElement===f[f.length-1]})()'));

  await key('Escape', 'Escape', 27);
  check('Escape closes the modal', !(await isOpen()));
  check('Escape returns focus to the opener that was clicked, not the first on the page',
    await activeIs(second));

  const other = second === 1 ? 0 : 1;
  await clickSel(OPENER, other);
  const bd = await evalJs("(function(){var r=document.querySelector('" + MODAL + "').getBoundingClientRect();return {x:r.x+6,y:r.y+6}})()");
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 200));
  check('backdrop click closes the modal', !(await isOpen()));
  check('backdrop close returns focus to ITS opener, a different button', await activeIs(other));

  /* A press that starts inside the panel and ends on the backdrop is a text selection, not a
     dismissal. Closing on it loses whatever the teacher was typing. */
  await clickSel(OPENER, other);
  const ins = await evalJs("(function(){var r=document.querySelector('" + MODAL + " .modal-body').getBoundingClientRect();return {x:r.x+12,y:r.y+12}})()");
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: ins.x, y: ins.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 200));
  check('press inside + release on the backdrop does NOT close it', await isOpen());

  /* From the WO-1.7 iPad sitting. Every student and guardian edit happens inside a modal, and
     a modal covers the header the indicator lives in — so the teacher changed a guardian's
     email, closed the panel, and had nothing telling her it landed. The save was real; the
     silence was the defect. Measured rather than reviewed, because a stacking bug reads as
     perfectly correct in the stylesheet. Asserted with a modal actually open, so it is the
     painted result and not the declared value. */
  const stack = await evalJs(`(function(){
    var i = getComputedStyle(document.getElementById('saveIndicator'));
    var o = getComputedStyle(document.querySelector('${MODAL}'));
    return { ind: parseInt(i.zIndex, 10), overlay: parseInt(o.zIndex, 10),
             pos: i.position, taps: i.pointerEvents }; })()`);
  check('the save indicator outranks the modal overlay, so a save is visible from inside a panel',
    stack.ind > stack.overlay && stack.pos === 'fixed',
    'indicator z-index ' + stack.ind + ' (' + stack.pos + ') vs overlay ' + stack.overlay);
  /* At rest the chip is `opacity: 0` and still occupies its corner. Without this it would be an
     invisible tap target sitting over the top-right of every screen in the app. */
  check('and at rest it cannot swallow a tap in the corner it occupies',
    stack.taps === 'none', 'pointer-events: ' + stack.taps);

  await key('Escape', 'Escape', 27);
}

/* ───────────────── planbook_ keys hold UI preferences only ───────────────── */

console.log('\n--- localStorage ---');
const seam = await evalJs("typeof window.planbook==='object' && typeof window.planbook.setPref==='function'");
if (!seam) {
  skip('setPref refuses a key that is not a declared UI preference',
    'no window.planbook.setPref seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js');
} else {
  const pref = await evalJs(`(function(){
    return { roster: window.planbook.setPref('roster',[{name:'Student A'}]),
             grades: window.planbook.setPref('lastGrades',{x:1}),
             read:   window.planbook.getPref('roster') }; })()`);
  check('setPref refuses an undeclared key "roster"', pref.roster === false);
  check('setPref refuses an undeclared key "lastGrades"', pref.grades === false);
  check('getPref on an undeclared key returns undefined rather than reading storage', pref.read === undefined);
}
const keys = await evalJs("Object.keys(localStorage).filter(function(k){return k.indexOf('planbook_')===0})");
check('every planbook_ key present is a declared UI preference, and no student data',
  Array.isArray(keys) && keys.every(k => !/roster|grade|student|attend|support|medical/i.test(k)),
  'planbook_ keys = ' + JSON.stringify(keys));

/* ───────────────── the live region ───────────────── */

console.log('\n--- aria-live ---');
const regions = await evalJs("document.querySelectorAll('[aria-live]').length");
check('exactly one aria-live region in the document', regions === 1, 'found ' + regions);
if (!seam) {
  skip('announce() lands text in the live region', 'no window.planbook seam');
} else {
  const live = await evalJs(`(async function(){ window.planbook.announce('probe text');
    await new Promise(function(r){setTimeout(r,150)});
    var e=document.querySelector('[aria-live]');
    return {text:e.textContent, live:e.getAttribute('aria-live'), cls:e.className}; })()`);
  check('announce() lands text in the single polite .sr-only region',
    live.text === 'probe text' && live.live === 'polite' && live.cls.indexOf('sr-only') >= 0,
    JSON.stringify(live));
}

/* ───────────────── the year document store ─────────────────
 *
 * WO-1.4's acceptance lines are the ones a human looking at the app cannot settle: that `rev`
 * counts saves rather than edits, that a failed write reaches the chip instead of being
 * swallowed, that two years coexist, and that a document from an older schema comes up the
 * migration ladder without losing anything. All of it is driven through the exported store,
 * which until WO-1.6 and WO-1.7 give the app a screen that writes is only reachable through
 * the window.planbook seam.
 *
 * These checks WRITE to IndexedDB, and that is safe only because the browser above runs
 * against a throwaway --user-data-dir that is deleted at the bottom of this file. Nothing
 * here may ever be pointed at a real profile.
 */

console.log('\n--- year document store ---');
const DOC_KEYS = ['schemaVersion', 'docId', 'year', 'rev', 'deviceId', 'updatedAt', 'teacher',
  'classes', 'letterScale', 'students', 'assignments', 'scores', 'attendance', 'log',
  /* WO-2.8's two, and they are both here rather than one: an open pass and a finished one are
     separate collections on purpose (docs/data-model.md), and a build that shipped only `passes`
     would be the in-memory `activePasses` mistake with a log bolted on. */
  'openPasses', 'passes',
  'events', 'templates', 'signals'];
const storeSeam = await evalJs("!!(window.planbook && window.planbook.store"
  + " && typeof window.planbook.store.update === 'function')");

if (!storeSeam) {
  skip('the year document store: shape, rev, save failure, two years, migration',
    'no window.planbook.store seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js');
} else {
  const doc0 = await evalJs(`(function(){ var d=window.planbook.store.getDoc(); if(!d) return null;
    return { year:d.year, schemaVersion:d.schemaVersion, rev:d.rev, docId:d.docId,
             hasDeviceId:!!d.deviceId, keys:Object.keys(d),
             scoresIsMap:(!!d.scores && typeof d.scores==='object' && !Array.isArray(d.scores)),
             label:(document.getElementById('yearButtonLabel')||{}).textContent }; })()`);

  check('boot() put a year document in memory and the loading screen came down behind it',
    !!doc0 && doc0.schemaVersion === SCHEMA_NOW && !!doc0.docId && doc0.hasDeviceId
      && /^\d{4}-\d{4}$/.test(doc0.year || ''),
    doc0 ? 'year=' + doc0.year + ' rev=' + doc0.rev + ' schemaVersion=' + doc0.schemaVersion : 'no document');
  check('the fresh document carries every collection docs/data-model.md names, and scores is a map',
    !!doc0 && DOC_KEYS.every(k => doc0.keys.includes(k)) && doc0.scoresIsMap,
    doc0 ? 'missing: ' + JSON.stringify(DOC_KEYS.filter(k => !doc0.keys.includes(k))) : 'no document');
  check('the header names the open year', !!doc0 && doc0.label === doc0.year,
    doc0 ? 'button says "' + doc0.label + '", document says "' + doc0.year + '"' : 'no document');

  /*
    WO-1.11's second acceptance line, and it is HERE — three hundred lines before the backup
    section — because this is the only moment in the run when the device holds exactly one school
    year. The year-switch checks below create 2030-2031, the migration fixture adds a third, and
    nothing deletes a year afterwards. "No teacher who never rolls over ever sees it" is a claim
    about that state and cannot be made from any later one.

    The positive half — the control appearing, labelled with the count — is in the backup section.
    Neither half means anything alone: a control that is never shown passes this check, and one
    that is always shown passes that one.

    Asserted as a state that HOLDS rather than as one sample, per trap 5. openBackupPanel()
    deliberately does not await the read of IndexedDB that reveals this control (a recovery screen
    does not wait on the store), so "hidden right now" cannot tell a correct absence from a refresh
    that has not landed yet. Forty samples over a second can.
  */
  const oneYear = await evalJs(`(async function(){
    var b = window.planbook && window.planbook.backup;
    if (!b || typeof b.downloadAllBackups !== 'function') return { seam:false };
    var years = await window.planbook.store.listYears();
    b.openBackupPanel(document.querySelector('header [data-backup-panel]'));
    var el = document.getElementById('backupDownloadAllBtn');
    var note = document.getElementById('backupAllNote');
    var visible = 0, samples = 0;
    for (var i = 0; i < 40; i++) {
      samples++;
      if (el && !el.classList.contains('hidden')) visible++;
      if (note && !note.classList.contains('hidden')) visible++;
      await new Promise(function(r){ setTimeout(r, 25); });
    }
    window.planbook.closeModal('backupModal');
    return { seam:true, years:years.length, inMarkup:!!el && !!note, visible:visible,
             samples:samples, hooked: !!document.querySelector('[data-backup-download-all]') }; })()`);
  if (!oneYear.seam) {
    skip('with one year on the device, nothing offers to back up every year',
      'no window.planbook.backup.downloadAllBackups seam on the page — see the window.planbook block at the foot of src/shell.js');
  } else if (oneYear.years !== 1) {
    skip('with one year on the device, nothing offers to back up every year',
      'the device already holds ' + oneYear.years + ' years at this point in the run, so the '
        + 'one-year state cannot be observed here');
  } else {
    check('with one year on the device, nothing offers to back up every year',
      oneYear.inMarkup && oneYear.hooked && oneYear.visible === 0,
      'one year on the device; the control and its note are in the markup = ' + oneYear.inMarkup
        + ', hook present = ' + oneYear.hooked + ', and both stayed hidden across '
        + oneYear.samples + ' samples over 1s (' + oneYear.visible + ' sightings)');
  }

  /* The Traps line, measured rather than asserted: splitting the document into per-collection
     stores is the change that breaks sync and breaks nothing you can see on a desk. */
  const shape = await evalJs(`(function(){ return new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){
      var db = open.result;
      var names = Array.prototype.slice.call(db.objectStoreNames);
      var s = db.transaction(names[0], 'readonly').objectStore(names[0]);
      var all = s.getAll();
      all.onerror = function(){ rej(all.error); };
      all.onsuccess = function(){
        var recs = all.result;
        res({ stores:names, keyPath:s.keyPath, indexes:Array.prototype.slice.call(s.indexNames),
              count:recs.length,
              whole: recs.length > 0 && recs.every(function(d){
                return Array.isArray(d.students) && Array.isArray(d.classes)
                  && Array.isArray(d.attendance) && !!d.scores && typeof d.rev === 'number'; }) });
        db.close();
      };
    }; }); })()`);
  check('one object store called years, keyed by the year string, with no index on it',
    shape.stores.length === 1 && shape.stores[0] === 'years' && shape.keyPath === 'year'
      && shape.indexes.length === 0,
    'stores=' + JSON.stringify(shape.stores) + ' keyPath=' + shape.keyPath
      + ' indexes=' + JSON.stringify(shape.indexes));
  check('one record per year, and the record IS the whole document — nothing normalized out',
    shape.count >= 1 && shape.whole, 'records = ' + shape.count);

  /* Debounce: two edits inside the window are one save and one rev. 60ms apart against an
     800ms debounce, then a wait long enough for the timer and the write. */
  const deb = await evalJs(`(async function(){ var s = window.planbook.store;
    var before = s.getDoc().rev;
    s.update(function(d){ d.teacher.school = 'probe one'; });
    await new Promise(function(r){ setTimeout(r, 60); });
    s.update(function(d){ d.teacher.school = 'probe two'; });
    var duringWindow = s.getDoc().rev;
    await new Promise(function(r){ setTimeout(r, 1800); });
    return { before:before, duringWindow:duringWindow, after:s.getDoc().rev,
             value:s.getDoc().teacher.school }; })()`);
  check('two edits 60ms apart are ONE save and ONE rev, and the later edit is the one stored',
    deb.after === deb.before + 1 && deb.value === 'probe two',
    'rev ' + deb.before + ' -> ' + deb.after + ', teacher.school = ' + JSON.stringify(deb.value));
  check('an edit alone does not move rev — rev counts saves, not keystrokes',
    deb.duringWindow === deb.before, 'rev during the debounce window = ' + deb.duringWindow);

  /* The other half of the Traps line, and the one that costs a period of grades when it is
     wrong: iOS kills a backgrounded tab, and a debounce timer that has not fired dies with
     it — so the pending write has to start the moment the page stops being visible.
     `visibilityState` cannot be assigned, so it is shadowed for the length of this check and
     the event dispatched; the listener reads exactly that property. What is asserted is the
     TIMING — the write is on disk well inside the 800ms the debounce would still be counting. */
  const vis = await evalJs(`(async function(){ var s = window.planbook.store;
    var stamp = 'flushed-on-hide-' + Date.now();
    var t0 = Date.now();
    s.update(function(d){ d.teacher.adminEmail = stamp; });
    Object.defineProperty(document, 'visibilityState',
      { configurable:true, get:function(){ return 'hidden'; } });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState;

    function readStored(){ return new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(s.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; }); }

    for (var i = 0; i < 12; i++) {
      var stored = await readStored();
      if (stored && stored.teacher.adminEmail === stamp) return { landed:true, ms:Date.now() - t0 };
      await new Promise(function(r){ setTimeout(r, 50); });
    }
    return { landed:false, ms:Date.now() - t0 }; })()`);
  check('a pending edit is flushed when the page stops being visible, not left on the debounce',
    vis.landed && vis.ms < 700,
    'on disk after ' + vis.ms + 'ms — the debounce alone would still have 800ms to run');

  const once = await evalJs(`(async function(){ var s = window.planbook.store;
    var before = s.getDoc().rev;
    s.update(function(d){ d.teacher.name = 'Persisted Probe'; });
    await s.flush();
    var chip = document.getElementById('saveIndicator');
    return { before:before, after:s.getDoc().rev, chip:chip.className, text:chip.textContent,
             updatedAt:s.getDoc().updatedAt, year:s.getDoc().year, docId:s.getDoc().docId }; })()`);
  check('a further save bumps rev by exactly one and stamps updatedAt',
    once.after === once.before + 1 && Math.abs(Date.now() - Date.parse(once.updatedAt)) < 120000,
    'rev ' + once.before + ' -> ' + once.after + ', updatedAt = ' + once.updatedAt);
  check('the save indicator shows the real write landing',
    /(^|\s)saved(\s|$)/.test(once.chip) && once.text.indexOf('Saved') >= 0,
    'class="' + once.chip + '" text="' + once.text + '"');

  /* A full document load, not a soft re-render: this is the acceptance line's "full reload". */
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const cameBack = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  const after = await evalJs(`(function(){ var d=window.planbook.store.getDoc(); if(!d) return null;
    return { year:d.year, rev:d.rev, docId:d.docId, name:d.teacher.name, school:d.teacher.school,
             label:(document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
  check('the app boots again after a full reload, out of IndexedDB', cameBack && !!after,
    after ? 'reopened ' + after.year : 'the loading screen never came down');
  check('the change persists across a full reload, with its rev and its docId',
    !!after && after.name === 'Persisted Probe' && after.school === 'probe two'
      && after.rev === once.after && after.year === once.year && after.docId === once.docId,
    JSON.stringify(after));

  /* Year switching, driven through the picker rather than through the store's API: "create a
     new year, list years, open one" is a deliverable about controls a teacher can reach, and
     calling createYear() from here would only prove the half that was never in doubt. */
  const FIRST_YEAR = once.year;
  const NEW_YEAR = '2030-2031';
  await clickSel('[data-year-picker]');
  await new Promise(r => setTimeout(r, 400));
  const listed = await evalJs(`(function(){ var m=document.getElementById('yearModal');
    return { open: !!m && !m.classList.contains('hidden'),
             rows: Array.prototype.slice.call(document.querySelectorAll('#yearList [data-year-switch]'))
                     .map(function(b){ return b.getAttribute('data-year-switch'); }),
             current: Array.prototype.slice.call(document.querySelectorAll('#yearList .year-row.current'))
                     .map(function(b){ return b.getAttribute('data-year-switch'); }) }; })()`);
  check('the year button opens the picker, and the picker lists the years on this device',
    listed.open && listed.rows.length === 1 && listed.rows[0] === FIRST_YEAR
      && listed.current.length === 1 && listed.current[0] === FIRST_YEAR,
    JSON.stringify(listed));

  await evalJs('(function(){document.getElementById("yearNewInput").value='
    + JSON.stringify(NEW_YEAR) + ';return 1})()');
  await clickSel('#yearModal button[type="submit"]');
  await new Promise(r => setTimeout(r, 1200));
  const made = await evalJs(`(async function(){ var s=window.planbook.store; var d=s.getDoc();
    return { years: await s.listYears(), year:d.year, rev:d.rev, docId:d.docId,
             students:d.students.length, name:d.teacher.name,
             modalOpen: !document.getElementById('yearModal').classList.contains('hidden'),
             label:(document.getElementById('yearButtonLabel')||{}).textContent,
             pref: window.planbook.getPref('openYear') }; })()`);
  check('creating a year from the picker writes a SECOND document and opens it, empty',
    made.years.length === 2 && made.years.indexOf(NEW_YEAR) >= 0 && made.years.indexOf(FIRST_YEAR) >= 0
      && made.year === NEW_YEAR && made.rev === 1 && made.students === 0 && made.name === ''
      && made.docId !== once.docId && !made.modalOpen && made.label === NEW_YEAR,
    JSON.stringify(made));
  check('the last-open year is remembered as a planbook_ preference, and it is only a label',
    made.pref === NEW_YEAR, 'planbook_openYear = ' + JSON.stringify(made.pref));

  await clickSel('[data-year-picker]');
  await new Promise(r => setTimeout(r, 400));
  await clickSel('#yearList [data-year-switch=' + JSON.stringify(FIRST_YEAR) + ']');
  await new Promise(r => setTimeout(r, 900));
  const back = await evalJs(`(function(){ var d=window.planbook.store.getDoc();
    return { year:d.year, rev:d.rev, docId:d.docId, name:d.teacher.name, school:d.teacher.school,
             modalOpen: !document.getElementById('yearModal').classList.contains('hidden'),
             label:(document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
  check('switching back through the picker shows the FIRST year\'s data, not the second\'s',
    back.year === FIRST_YEAR && back.docId === once.docId && back.name === 'Persisted Probe'
      && back.school === 'probe two' && back.rev === once.after && !back.modalOpen
      && back.label === FIRST_YEAR,
    JSON.stringify(back));

  /* The migration ladder, walked TWO steps. It used to be one — MIGRATIONS was empty, and what was
     being checked was that the ladder existed, ran and lost nothing, so that adding the first real
     step would be one entry in an object rather than a rewrite of the load path. WO-2.10 added that
     entry, so this fixture now climbs a hook installed here (0 → 1) and then the app's own real
     step (1 → 2), which is a better test of the walk than either alone: a ladder that ran only the
     step it was handed, or only its own, would be caught here.

     The fixture's one mark is a BARE STRING, which is what every document written before WO-2.10
     holds, and it has to arrive as `{ code: 'A' }` with no `at` invented for it. A step is installed
     for the length of one open and removed again; the document it climbs is written straight into
     IndexedDB, the way a document from an older build would be sitting there. */
  const OLD_YEAR = '2019-2020';
  const mig = await evalJs(`(async function(){ var s = window.planbook.store;
    var older = { schemaVersion:0, docId:'d_from_an_older_build', year:${JSON.stringify(OLD_YEAR)},
      rev:7, deviceId:'dev_old', updatedAt:'2019-09-01T00:00:00.000Z',
      teacher:{ name:'Older Build', school:'', email:'', adminEmail:'', defaultCc:true },
      classes:[{ id:'c_1', name:'Period 3' }], letterScale:[{ letter:'A', min:93 }],
      students:[{ id:'s_1', first:'Keep', last:'Me' }],
      assignments:[{ id:'a_1', classId:'c_1', name:'Quiz', points:100 }],
      scores:{ a_1:{ s_1:{ v:87 } } }, attendance:[{ classId:'c_1', date:'2019-09-09', marks:{ s_1:'A' } }],
      log:[], events:[], templates:[], signals:{} };
    await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var t = db.transaction('years', 'readwrite');
        t.objectStore('years').put(older);
        t.oncomplete = function(){ db.close(); res(); };
        t.onerror = function(){ rej(t.error); };
      }; });

    var ran = 0;
    s.MIGRATIONS[0] = function(d){ ran++; d.cameThroughTheHook = true; return d; };
    var opened, failure = null;
    try { opened = await s.openYear(${JSON.stringify(OLD_YEAR)}); }
    catch (e) { failure = String(e && e.message); }
    delete s.MIGRATIONS[0];
    if (failure) return { failure: failure };

    /* Read it back off disk: a migration that only happened in memory would run again on
       every open, and the acceptance line is about a document, not a variable. */
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(OLD_YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); };
      }; });

    await s.openYear(${JSON.stringify(FIRST_YEAR)});
    return { ran:ran, schemaVersion:opened.schemaVersion, marker:opened.cameThroughTheHook === true,
             rev:opened.rev, docId:opened.docId, teacher:opened.teacher.name,
             student:opened.students[0] && opened.students[0].last,
             score:opened.scores.a_1 && opened.scores.a_1.s_1 && opened.scores.a_1.s_1.v,
             mark:opened.attendance[0] && opened.attendance[0].marks.s_1,
             storedMark: stored && stored.attendance[0] && stored.attendance[0].marks.s_1,
             /* WO-2.8's rung, read off DISK for the reason the mark above is: a collection seeded
                in memory and never written back is a collection the next launch does not have. */
             storedOpen: stored && stored.openPasses, storedPasses: stored && stored.passes,
             storedVersion: stored && stored.schemaVersion, storedMarker: stored && stored.cameThroughTheHook };
  })()`);
  check('a document written under an older schema loads THROUGH the migration hook',
    !mig.failure && mig.ran === 1 && mig.schemaVersion === SCHEMA_NOW && mig.marker === true,
    mig.failure ? 'openYear threw: ' + mig.failure
      : 'steps run = ' + mig.ran + ', schemaVersion now ' + mig.schemaVersion);
  check('and it loses nothing on the way up — students, scores, marks, docId, teacher',
    !mig.failure && mig.student === 'Me' && mig.score === 87
      && !!mig.mark && mig.mark.code === 'A'
      && mig.docId === 'd_from_an_older_build' && mig.teacher === 'Older Build',
    JSON.stringify(mig));
  /* WO-2.10's own step, asked of the thing it converts. The cell arrived as `"A"` and has to be
     `{ code: "A" }` — an object, its code intact, and NO `at`, because the moment that tardy or
     absence was marked was never recorded and a timestamp from the migration's own clock would say
     the student arrived the day the teacher updated the app. Asserted on the record ON DISK as well
     as in memory: a conversion that happened only in memory would run again on every open, which is
     one of the three failure modes that step is written against. */
  check('and every bare-string mark cell came up as an object, with no `at` invented for it',
    !mig.failure && !!mig.storedMark && typeof mig.storedMark === 'object'
      && mig.storedMark.code === 'A' && mig.storedMark.at === undefined
      && Object.keys(mig.storedMark).join(',') === 'code',
    'the cell was "A" in the version-1 document and is ' + JSON.stringify(mig.storedMark)
      + ' on disk (in memory: ' + JSON.stringify(mig.mark) + ')');
  /* WO-2.8's step, asked the same way. A document written before hall passes existed has neither
     collection, and it has to come up the ladder holding both — empty, on disk, and as arrays
     rather than as anything else. src/passes.js reads them through an accessor that tolerates a
     missing key, so a build whose rung did nothing would LOOK fine on screen and would write a
     document that every later reader has to keep guarding against. This is where that shows. */
  check('and it comes up holding both hall-pass collections, empty, as arrays, on disk',
    !mig.failure && Array.isArray(mig.storedOpen) && mig.storedOpen.length === 0
      && Array.isArray(mig.storedPasses) && mig.storedPasses.length === 0,
    'openPasses = ' + JSON.stringify(mig.storedOpen) + ', passes = ' + JSON.stringify(mig.storedPasses)
      + ' in the version-0 document read back off disk');
  check('the migrated document is written back once, as a save (rev 7 -> 8), not on every open',
    !mig.failure && mig.rev === 8 && mig.storedVersion === SCHEMA_NOW && mig.storedMarker === true,
    'rev = ' + mig.rev + ', stored schemaVersion = ' + mig.storedVersion);

  /* A forced save failure, and it has to be a REAL one: a function in the document is a value
     structured clone refuses, so put() throws DataCloneError out of the same line a full disk
     would. Nothing in the store is stubbed for this. It goes last in the section because it
     leaves the in-memory document permanently unwritable — every later save fails too, which
     is exactly the condition being checked, and the reload at the top of the next section is
     what clears it. */
  const logMark = consoleLog.length;
  const failed = await evalJs(`(async function(){ var s = window.planbook.store;
    var before = s.getDoc().rev;
    s.update(function(d){ d.teacher.thisCannotBeCloned = function(){}; });
    await s.flush();
    /* Poll for a SETTLED chip rather than sleeping a fixed 150ms. writeCurrent resolves only
       after its one retry has run and painted 'error' (store.js:388), so the sleep was never
       needed to see the end state — but a doomed save restarted by a surviving timer repaints
       'retry' underneath it, and a fixed wait lands inside that window often enough to fail a
       green build. Waiting on the condition cannot race it. */
    var chip = document.getElementById('saveIndicator');
    await new Promise(function(resolve){
      var deadline = Date.now() + 12000, settledSince = 0;
      (function poll(){
        var settled = /(^|\s)(error|saved)(\s|$)/.test(chip.className);
        if (!settled) settledSince = 0;
        else if (!settledSince) settledSince = Date.now();
        /* Settled AND still settled 600ms later. A single sample cannot tell a finished
           failure from the gap between two attempts, and MAX_WAIT_MS is 5000, so a stale
           max-wait timer restarting the doomed write lands squarely on a 5000ms deadline. */
        if ((settledSince && Date.now() - settledSince > 600) || Date.now() > deadline) return resolve();
        setTimeout(poll, 25);
      })();
    });
    return { before:before, after:s.getDoc().rev, chip:chip.className, text:chip.textContent,
             spoken:(document.querySelector('[aria-live]')||{}).textContent }; })()`);
  check('a save failure paints the error state on the indicator',
    /(^|\s)error(\s|$)/.test(failed.chip) && failed.text.indexOf('Save failed') >= 0,
    'class="' + failed.chip + '" text="' + failed.text + '"');
  check('and it is announced as well as shown — the chip is not something a screen reader watches',
    /Save failed/i.test(failed.spoken || ''), 'live region = ' + JSON.stringify(failed.spoken));
  check('and rev is rolled back, so memory never claims a save that storage never saw',
    failed.after === failed.before, 'rev ' + failed.before + ' -> ' + failed.after);
  const swallowed = consoleLog.slice(logMark).filter(l => l.type === 'error'
    && /could not be saved/i.test(l.text));
  check('the failure is not silently swallowed — it reaches the console with the year named',
    swallowed.length >= 1, swallowed.length ? swallowed[0].text.slice(0, 120)
      : 'nothing was logged at error level');
}

/* ───────────────── backup & restore ─────────────────
 *
 * WO-1.5's acceptance lines, all of which are about what happens to a file and to storage and
 * none of which a person looking at the app can settle. They are driven through
 * window.planbook.backup for one specific reason: a script cannot hand a page a real File, so
 * no harness can put a file through the file input or the drop target. Everything AFTER the
 * read is the same code either way, and restoreFromText() is that seam. The real drop, the real
 * Files-app download, and a thumb on a 44px target stay owed to a human.
 *
 * The confirm dialog is driven by clicking its actual buttons rather than by calling
 * confirmRestore(), because "the confirm names what is being replaced" and "cancelling changes
 * nothing" are claims about controls a teacher touches.
 */

console.log('\n--- backup & restore ---');

/* Downloads land in the throwaway profile dir, which is deleted at the bottom of this file. A
   real <a download> click is the only mechanism that works in an installed PWA, so the check
   drives the real one — and without this it would leave a Planbook backup in whoever-ran-it's
   Downloads folder. */
let downloadsRedirected = false;
try {
  await send('Browser.setDownloadBehavior',
    { behavior: 'allow', downloadPath: path.join(udd, 'downloads') }, false);
  downloadsRedirected = true;
} catch { /* older build without the Browser domain; the file lands in Downloads instead */ }

/* The store section above ends by leaving the in-memory document permanently unwritable, on
   purpose. A reload clears it, and the backup checks need a document that can be saved. */
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const backupBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

const backupSeam = await evalJs("!!(window.planbook && window.planbook.backup"
  + " && typeof window.planbook.backup.restoreFromText === 'function')");

if (!backupBooted || !backupSeam) {
  skip('backup & restore: round trip, refusals, the confirm, the nag, the boot-failure exit',
    backupBooted ? 'no window.planbook.backup seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  check('downloads were redirected into the throwaway profile (else this litters Downloads)',
    downloadsRedirected, downloadsRedirected ? path.join(udd, 'downloads') : 'Browser.setDownloadBehavior refused');

  /* Seeded with the two kinds of data the file has to carry: ordinary roster fields, and the
     support details CLAUDE.md calls the most sensitive data in the app. The backup is the ONE
     surface that is allowed to contain the second kind, and a check that it is still in there
     is the check that stops a later work order from "fixing" the file for safety. */
  const YEAR = await evalJs('window.planbook.store.getDoc().year');
  const built = await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.teacher.name = 'Backup Probe';
      /* DELIBERATELY NO terms ARRAY. This class is the legacy shape the section at the class-view
         checks depends on — "a class stored with no terms at all still renders". Giving it terms
         here was tried on 2026-08-08 to un-skip the WO-2.4 block and broke two checks: that one,
         and the one requiring every term id to match tm_ plus ten generated characters. The
         WO-2.4 block supplies its own term and takes it back out again; see the note there.
         NO BACKTICKS IN THIS COMMENT — it lives inside a template literal. */
      d.classes = [{ id:'c_b1', name:'Period 3 — Biology' }];
      d.students = [
        { id:'s_b1', first:'Ada', last:'Probe',
          supports:{ plan:'IEP', medical:'epi-pen in the nurse office', accommodations:[{ kind:'extended-time' }] } },
        { id:'s_b2', first:'Bo', last:'Probe', supports:{ plan:'none' } }];
    });
    await s.flush();
    var file = await window.planbook.backup.buildBackup();
    var doc = s.getDoc();
    return { name:file.name, text:file.text, rev:doc.rev, docId:doc.docId,
             whole: JSON.stringify(JSON.parse(file.text)) === JSON.stringify(doc) }; })()`);
  const TEXT = JSON.stringify(built.text);

  /* The date on the file is the LOCAL one, and this check has to derive it the same way
     src/backup.js does or it is testing a different fact. It compared against
     `toISOString().slice(0,10)` until WO-1.7 — that is UTC, so from 8pm EDT onward it demanded
     tomorrow's date and failed on a correct build. It passed at every other hour, which is how it
     survived three work orders. The app is right: a teacher in EDT downloading at 8pm expects
     today's date on her file, so `dateStamp()` builds it from getFullYear/getMonth/getDate and so
     does this. Stricter about the right value rather than looser about the wrong one. */
  const localStamp = (() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  })();
  check('the backup file is the whole year document, and its name carries the year and the date',
    built.whole && built.name === 'Planbook ' + YEAR + ' backup ' + localStamp + '.json',
    built.name + ' · ' + built.text.length + ' bytes');
  check('and it still contains the support data — a backup that filtered it out is not a recovery path',
    /epi-pen in the nurse office/.test(built.text) && /"plan": "IEP"/.test(built.text),
    'medical and plan fields present in the file');

  const copy = await evalJs(`(function(){ var m = document.getElementById('backupModal');
    return m ? m.textContent.replace(/\\s+/g, ' ') : ''; })()`);
  check('the backup UI says in words what sensitive data the file contains',
    /accommodation/i.test(copy) && /medical/i.test(copy) && /IEP/.test(copy)
      && /504/.test(copy) && /behavior plan/i.test(copy),
    copy ? 'panel copy is ' + copy.length + ' characters and names accommodations, IEP/504, medical, behavior plans'
      : 'no #backupModal on the page');

  /* The nag, at four ages. A single "it appeared" sample cannot tell a working threshold from a
     strip that is always up. */
  const nag = await evalJs(`(async function(){ var b = window.planbook.backup, p = window.planbook;
    var y = window.planbook.store.getDoc().year;
    var el = document.getElementById('backupNag'), day = 24*60*60*1000;
    function state(){ return !el.classList.contains('hidden'); }
    /* The preference is a map of year → epoch ms, so every age below is set for the year that
       is actually open. Writing a bare number here is what the old shape did, and it is the
       shape the cross-year check further down exists to keep out. */
    function stamp(ms){ var m = {}; if (ms) { m[y] = ms; } p.setPref('lastBackupAt', m); }
    stamp(Date.now() - 2*day); b.refreshBackupNag();
    var atTwoDays = state();
    stamp(Date.now() - 8*day); b.refreshBackupNag();
    var atEightDays = state();
    var lead = (document.getElementById('backupNagLead')||{}).textContent;
    stamp(0); b.refreshBackupNag();
    var never = state();
    await b.downloadBackup();
    return { year:y, atTwoDays:atTwoDays, atEightDays:atEightDays, lead:lead, never:never,
             afterDownload: state(), pref: (p.getPref('lastBackupAt')||{})[y],
             status: document.getElementById('backupStatus').textContent }; })()`);
  check('the nag appears when the last backup is over 7 days old, and says how long ago',
    nag.atEightDays === true && /8 days ago/.test(nag.lead || ''),
    'at 8 days: shown=' + nag.atEightDays + ' lead=' + JSON.stringify(nag.lead));
  check('and it names the year it is talking about',
    new RegExp(nag.year).test(nag.lead || ''),
    'lead = ' + JSON.stringify(nag.lead));
  check('and it stays down at 2 days, and comes up when there has never been one',
    nag.atTwoDays === false && nag.never === true,
    'at 2 days shown=' + nag.atTwoDays + ', never-backed-up shown=' + nag.never);
  check('a successful download clears the nag and stamps the planbook_ preference for that year',
    nag.afterDownload === false && Math.abs(Date.now() - nag.pref) < 120000,
    'planbook_lastBackupAt[' + nag.year + '] = ' + nag.pref + ', nag shown = ' + nag.afterDownload);

  /*
    The cross-year check, and the reason it exists rather than the reason it is thorough.

    Until 2026-08-04 the timestamp was one number for the whole browser, so downloading the open
    year marked every other year on the device as backed up too and the strip went quiet for a
    year that had never been written to a file. Nothing caught it: every check above samples one
    year, and one year is exactly the case where the bug is invisible. A second year, with
    something in it to lose, is the whole of the fixture.

    It runs against the year the store already has from the year-switching checks, so it creates
    nothing — and it puts the open year back afterwards, because everything below assumes it.
  */
  const otherYear = await evalJs(`(async function(){ var s = window.planbook.store,
      b = window.planbook.backup, was = s.getDoc().year;
    var years = (await s.listYears()).filter(function(y){ return y !== was; });
    if (!years.length) return { skipped:true };
    await s.openYear(years[0]);
    /* A year with nothing typed into it never nags, by design — so give it something first. */
    s.update(function(d){ d.students.push({ id:'s-cross', first:'Cross', last:'Year' }); });
    await s.flush();
    b.refreshBackupNag();
    var shown = !document.getElementById('backupNag').classList.contains('hidden');
    var lead = (document.getElementById('backupNagLead')||{}).textContent;
    await s.openYear(was);
    b.refreshBackupNag();
    return { skipped:false, other:years[0], was:was, shown:shown, lead:lead,
             backHome: s.getDoc().year }; })()`);
  if (otherYear.skipped) {
    skip('downloading one year does not silence the nag for another',
      'only one year exists on the device at this point in the run');
  } else {
    check('downloading one year does not silence the nag for another',
      otherYear.shown === true && new RegExp(otherYear.other).test(otherYear.lead || '')
        && otherYear.backHome === otherYear.was,
      otherYear.was + ' was just downloaded; with ' + otherYear.other
        + ' open the nag is shown=' + otherYear.shown + ' saying ' + JSON.stringify(otherYear.lead));

    /* And the panel says so out loud, because the nag only fires on the year that is open: a
       teacher who never switches to the other year is never told it is unbacked-up otherwise. */
    const otherLine = await evalJs(`(async function(){ var el, tries = 0;
      window.planbook.backup.openBackupPanel(document.querySelector('[data-backup-panel]'));
      /* The line is filled after the panel opens, on purpose (src/backup.js: a recovery screen
         does not wait on the store). Poll rather than sleep — a fixed wait here would assert a
         presence too early and a stale absence forever. */
      while (tries++ < 60) {
        el = document.getElementById('backupOtherYears');
        if (el && !el.classList.contains('hidden') && el.textContent) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { hidden: !el || el.classList.contains('hidden'),
               text: el ? el.textContent.replace(/\\s+/g,' ') : '' }; })()`);
    check('and the panel says the download covers only the open year, naming the one it does not',
      otherLine.hidden === false && new RegExp(otherYear.other).test(otherLine.text)
        && /year you have open/i.test(otherLine.text),
      otherLine.hidden ? 'the line stayed hidden' : JSON.stringify(otherLine.text));
  }

  /* ─────────── WO-1.11: every year on the device, in one tap ───────────
   *
   * Four claims, and the reason this is worth 200 lines rather than "the status said Saved": the
   * failure this work order is about is a button that reports three backups and delivers one. That
   * cannot be caught by asking the page how it went — the page is the thing under suspicion — so
   * the artifact is read back OFF DISK, out of the throwaway profile's download directory, parsed,
   * and matched against the years it claims to hold. The stamps are read out of localStorage, and
   * the nag is asked about every year in turn rather than about the one that happens to be open.
   *
   * THE MECHANISM UNDER TEST CHANGED ON 2026-08-05, and these checks changed with it. The first
   * build wrote one .json per year, 400ms apart. On the teacher's installed iPad PWA that produced
   * exactly one file and no status line at all: iOS answers a download with the native "Open in…"
   * sheet, which is a context switch the in-flight JS does not come back from, so the second
   * hand-off never happened. What is measured below is the replacement — ONE zip file, built by
   * hand in src/zip.js, holding one .json per year with the names the single-year button would
   * have given them. The intent of every check here is the one it had before (every year on the
   * device is really in there, with its own roster; only what was delivered is stamped; restore
   * still takes every piece of it); the mechanism is one file instead of N, so the evidence is
   * the archive's own bytes, parsed by a reader written above rather than by a library.
   *
   * WHAT THIS STILL CANNOT PROVE, and it is the whole of the 👤 acceptance line: this is
   * Edge/Chrome over CDP on a laptop. It never saw an installed PWA, a Files app, or iOS's save
   * sheet — which is precisely the thing that broke the last build. What the checks below settle
   * is that ONE tap produces ONE archive, that the archive is well-formed and complete, that only
   * the years inside it are stamped, and that everything inside it restores. Whether iPadOS takes
   * the single hand-off and unzips what it gets stays owed to a human.
   */
  const allSeam = await evalJs("typeof window.planbook.backup.downloadAllBackups === 'function'");
  const yearsOnDevice = await evalJs('window.planbook.store.listYears()');
  const DL_DIR = path.join(udd, 'downloads');
  /* Only complete files. Chrome writes `<name>.crdownload` and renames on completion, so the .zip
     filter is what keeps a half-written archive out of the count — and every archive is parsed
     below, which catches a partial that slipped through the filter anyway.

     It filters to .zip rather than .json as of 2026-08-05, when this control stopped writing one
     file per year (see the block comment below). That also takes the single-year button's own
     .json downloads out of the way: several are already sitting in this directory from the checks
     above, and they are not this control's business. */
  const listDownloads = async () => {
    try { return (await fs.readdir(DL_DIR)).filter(n => /\.zip$/i.test(n)); } catch { return []; }
  };
  /* Name → last-modified. A SECOND run writes the same file names as the first (same years, same
     date), and whether the browser uniquifies them or overwrites them is the browser's business,
     not this app's — so "which files did this run write" is answered by a new name OR a moved
     mtime. The first version of this check diffed names only, and it went red on a correct build
     the second time around: trap 5's shape, where the check is the broken part. */
  const statDownloads = async () => {
    const out = new Map();
    for (const n of await listDownloads()) {
      try { out.set(n, (await fs.stat(path.join(DL_DIR, n))).mtimeMs); } catch { /* gone again */ }
    }
    return out;
  };
  const writtenSince = async (had) => {
    const now = await statDownloads();
    return [...now].filter(([n, t]) => !had.has(n) || had.get(n) !== t).map(([n]) => n);
  };
  /* Poll for the files, never sleep for them (trap 5). Returns whatever arrived, so a short run is
     reported as a short run rather than hanging — and it keeps watching for half a second after the
     expected number turns up, because "it wrote a file for the year it said it had skipped" is one
     of the two failures these checks exist for, and a poll that stops at `want` cannot see it. */
  const newDownloads = async (had, want, ms = 20000) => {
    const until = Date.now() + ms;
    let got = [];
    while (Date.now() < until) {
      got = await writtenSince(had);
      if (got.length >= want) {
        await new Promise(r => setTimeout(r, 600));
        return writtenSince(had);
      }
      await new Promise(r => setTimeout(r, 150));
    }
    return got;
  };

  /* ───── a minimal ZIP reader, written to mirror src/zip.js ─────
     Node has no zip reader, and this repo will not take a dependency to get one (tools/README.md:
     "Node's standard library only"). So the archive is parsed here the way the app builds it —
     find the end-of-central-directory record, walk the central directory, seek to each local
     header, take the bytes, CRC them — and every field the writer sets is read back and CHECKED
     rather than assumed. That is what keeps this evidence about the file on the disk rather than
     about what the page said it wrote, which is the same reason the sequential version of these
     checks read its .json files off disk instead of asking the page how it went.

     Deliberately strict about things a lenient unzipper would forgive: the two copies of every
     size and CRC (local header and central directory) have to agree with each other, the entry
     has to be STORED, and the CRC has to match the bytes. A writer that got any of those wrong
     produces an archive that opens fine in one tool and fails in another, which on a recovery
     path is the worst possible failure — it would be discovered on the day everything else has
     already gone wrong. */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (bytes) => {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const readZip = async (name) => {
    const out = { name, error: '', entries: [] };
    let buf;
    try { buf = await fs.readFile(path.join(DL_DIR, name)); }
    catch (e) { out.error = 'could not be read: ' + (e.message || e); return out; }
    out.bytes = buf.length;
    /* Scanned backwards, the way every real reader finds it: the record is last, and nothing may
       follow it. There is no archive comment here, so it is at length-22 — but a writer that
       accidentally appended anything is exactly the bug this scan would still catch. */
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65535; i--) {
      if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) { out.error = 'no end-of-central-directory record'; return out; }
    const count = buf.readUInt16LE(eocd + 10);
    const cdSize = buf.readUInt32LE(eocd + 12);
    const cdAt = buf.readUInt32LE(eocd + 16);
    out.claimed = count;
    if (cdAt + cdSize > buf.length) { out.error = 'the central directory runs past the end'; return out; }
    let at = cdAt;
    for (let i = 0; i < count; i++) {
      if (buf.readUInt32LE(at) !== 0x02014b50) {
        out.error = 'entry ' + i + ' has no central directory header'; return out;
      }
      const method = buf.readUInt16LE(at + 10);
      const crc = buf.readUInt32LE(at + 16);
      const csize = buf.readUInt32LE(at + 20);
      const usize = buf.readUInt32LE(at + 24);
      const nameLen = buf.readUInt16LE(at + 28);
      const extraLen = buf.readUInt16LE(at + 30);
      const commentLen = buf.readUInt16LE(at + 32);
      const localAt = buf.readUInt32LE(at + 42);
      const entryName = buf.toString('utf8', at + 46, at + 46 + nameLen);
      at += 46 + nameLen + extraLen + commentLen;
      if (localAt + 30 > buf.length || buf.readUInt32LE(localAt) !== 0x04034b50) {
        out.error = '“' + entryName + '” has no local file header where the directory says';
        return out;
      }
      const localNameLen = buf.readUInt16LE(localAt + 26);
      const localExtraLen = buf.readUInt16LE(localAt + 28);
      const localName = buf.toString('utf8', localAt + 30, localAt + 30 + localNameLen);
      const dataAt = localAt + 30 + localNameLen + localExtraLen;
      const bytes = buf.subarray(dataAt, dataAt + csize);
      out.entries.push({
        name: entryName,
        stored: method === 0 && csize === usize,
        agrees: localName === entryName && buf.readUInt32LE(localAt + 14) === crc
          && buf.readUInt32LE(localAt + 18) === csize && buf.readUInt32LE(localAt + 22) === usize,
        crcOk: bytes.length === usize && crc32(bytes) === crc,
        text: bytes.toString('utf8'),
      });
    }
    return out;
  };

  if (!allSeam || yearsOnDevice.length < 2 || !downloadsRedirected) {
    skip('one tap writes one zip file holding a readable backup of every year on the device',
      !allSeam ? 'no downloadAllBackups on the backup seam'
        : yearsOnDevice.length < 2 ? 'only one year on the device, so there is nothing to compare'
          : 'downloads were not redirected into the throwaway profile, so the archive cannot be read back');
  } else {
    /*
      Cleared to nothing first, so "each year written gets its OWN stamp" is measured from an empty
      map rather than from whatever the checks above left behind — and so the nag is up for every
      year that has anything to lose before the tap, which is what makes it being down afterwards
      mean something. A year with nothing typed into it never nags by design, so the fixture counts
      how many years could nag and the assertion below is about those.
    */
    const beforeAll = await evalJs(`(async function(){ var s = window.planbook.store, p = window.planbook,
        b = window.planbook.backup, was = s.getDoc().year, out = [];
      function n(a){ return Array.isArray(a) ? a.length : 0; }
      p.setPref('lastBackupAt', {});
      var years = await s.listYears();
      for (var i = 0; i < years.length; i++) {
        await s.openYear(years[i]);
        b.refreshBackupNag();
        var d = s.getDoc();
        out.push({ year: years[i],
                   hasSomethingToLose: (n(d.classes) + n(d.students) + n(d.assignments)
                     + n(d.attendance) + n(d.log) + n(d.events) + n(d.templates)) > 0,
                   nagUp: !document.getElementById('backupNag').classList.contains('hidden') });
      }
      await s.openYear(was);
      b.refreshBackupNag();
      return { years: years, rows: out, backHome: s.getDoc().year,
               stamps: p.getPref('lastBackupAt') }; })()`);
    const couldNag = beforeAll.rows.filter(r => r.hasSomethingToLose);
    check('before the tap: no year is stamped, and every year holding anything is nagging',
      beforeAll.backHome === YEAR
        && JSON.stringify(beforeAll.stamps) === '{}'
        && couldNag.length >= 2 && couldNag.every(r => r.nagUp === true),
      beforeAll.rows.map(r => r.year + (r.hasSomethingToLose ? ' (has data)' : ' (empty)')
        + ' nag=' + r.nagUp).join(', '));

    /* The panel, and the control as a teacher meets it: polled for rather than sampled, because
       openBackupPanel() does not await the read of IndexedDB that reveals it. */
    const panelState = await evalJs(`(async function(){
      window.planbook.backup.openBackupPanel(document.querySelector('header [data-backup-panel]'));
      var btn, note;
      for (var i = 0; i < 80; i++) {
        btn = document.getElementById('backupDownloadAllBtn');
        note = document.getElementById('backupAllNote');
        if (btn && !btn.classList.contains('hidden') && note && !note.classList.contains('hidden')) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { hidden: !btn || btn.classList.contains('hidden'), label: btn ? btn.textContent : '',
               disabled: btn ? btn.disabled : null,
               noteHidden: !note || note.classList.contains('hidden'),
               note: note ? note.textContent.replace(/\\s+/g, ' ') : '',
               otherYears: (document.getElementById('backupOtherYears')||{}).textContent }; })()`);
    check('with several years on the device the control appears, and its label says how many it covers',
      panelState.hidden === false && panelState.disabled === false
        && panelState.label === 'Back up all ' + yearsOnDevice.length + ' years'
        && panelState.noteHidden === false
        && /one zip file/.test(panelState.note)
        && new RegExp('all ' + yearsOnDevice.length + ' school years').test(panelState.note)
        && /unzip it/i.test(panelState.note)
        && /restores by itself/.test(panelState.note),
      'label = ' + JSON.stringify(panelState.label) + ', note = ' + JSON.stringify(panelState.note));

    const dlBefore = await statDownloads();
    await clickSel('[data-backup-download-all]');
    /* Waited on, not slept through, and waited on POSITIVELY: the run puts "Reading 3 school
       years…" up first, so a fixed sleep would sample the gap while the years are being read and
       report a run that never finished, and "anything that is not Reading" would read the message
       left behind by the check above. The never-downloaded line is polled separately because
       refreshYearCoverage() re-reads IndexedDB and is deliberately not awaited by the run that
       triggers it. */
    const ran = await evalJs(`(async function(){ var el = document.getElementById('backupStatus');
      for (var i = 0; i < 200; i++) {
        if (el && !el.classList.contains('hidden') && /^(Saved|No file was written|Planbook could not)/.test(el.textContent)) break;
        await new Promise(function(r){ setTimeout(r, 100); });
      }
      var line = document.getElementById('backupOtherYears'), gone = false;
      for (var j = 0; j < 60; j++) {
        gone = line.classList.contains('hidden');
        if (gone) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { status: el.textContent, cls: el.className,
               stamps: window.planbook.getPref('lastBackupAt'),
               otherYearsHidden: gone,
               disabled: document.getElementById('backupDownloadAllBtn').disabled }; })()`);
    /* ONE file, and the wait is for one: `want` is 1 rather than the year count, which is the
       whole architectural change stated as a number. newDownloads() keeps watching for another
       half-second after it arrives, so a build that also fired a per-year download would be caught
       here rather than passing as "at least one". */
    const added = await newDownloads(dlBefore, 1);

    /* The archive itself, read off the disk the browser wrote it to and parsed here with the
       reader above. This is the only evidence in this file that does not come through the page. */
    const archive = added.length === 1 ? await readZip(added[0]) : null;
    const files = [];
    for (const e of (archive ? archive.entries : [])) {
      let doc = null, error = '';
      try { doc = JSON.parse(e.text); } catch (err) { error = String(err.message || err); }
      files.push({ name: e.name, doc, error, text: e.text,
                   stored: e.stored, crcOk: e.crcOk, agrees: e.agrees });
    }
    const parsed = files.filter(f => f.doc && typeof f.doc === 'object');
    const yearsInFiles = parsed.map(f => f.doc.year).sort();
    const wellFormed = parsed.filter(f => Array.isArray(f.doc.classes)
      && Array.isArray(f.doc.students) && f.doc.scores && typeof f.doc.scores === 'object'
      && f.doc.schemaVersion === SCHEMA_NOW
      && f.name === 'Planbook ' + f.doc.year + ' backup ' + localStamp + '.json');
    check('one tap writes one zip file, holding a readable backup of every year on the device',
      added.length === 1
        && !!archive && archive.error === ''
        && archive.entries.length === yearsOnDevice.length
        && archive.entries.every(e => e.stored && e.crcOk && e.agrees)
        && parsed.length === archive.entries.length
        && wellFormed.length === parsed.length
        && JSON.stringify(yearsInFiles) === JSON.stringify(yearsOnDevice.slice().sort()),
      added.length + ' file(s) landed for ' + yearsOnDevice.length + ' year(s) on the device: '
        + (added.join(', ') || 'nothing')
        + (archive ? ' (' + archive.bytes + ' bytes' + (archive.error ? ', BROKEN: ' + archive.error : '')
          + ') holding ' + files.map(f => f.name + (f.error ? ' — UNREADABLE (' + f.error + ')'
            : f.stored && f.crcOk && f.agrees ? '' : ' — HEADERS DISAGREE')).join(', ') : ''));
    /* The entry names are the deliverable's own promise, and they are asserted above rather than
       described: what a teacher gets out of the archive has to be indistinguishable from what the
       single-year button would have handed her, or "unzip it and each year restores on its own" is
       not true of the files she is actually looking at. */

    /* Two things a count of entries cannot tell apart from a working run. The open year's entry has
       to still carry the support data — the one surface allowed to hold it, and the thing a later
       work order might "fix" out of a backup for safety. And the years read STRAIGHT OFF THE DISK,
       without being opened, have to have arrived with their rosters in them: a build that zipped
       three copies of the open document would pass every other check here. */
    const seeded = parsed.find(f => f.doc.year === YEAR);
    const unopened = parsed.filter(f => f.doc.year !== YEAR);
    check('and the years it never opened are in there with their own rosters, support data included',
      !!seeded && /epi-pen in the nurse office/.test(JSON.stringify(seeded.doc))
        && unopened.length === yearsOnDevice.length - 1
        && unopened.every(f => f.doc.docId && f.doc.docId !== seeded.doc.docId)
        && unopened.some(f => f.doc.students.length >= 1),
      (seeded ? seeded.name + ' carries the medical field' : 'no entry for the open year ' + YEAR)
        + ' · ' + unopened.map(f => f.doc.year + ' (' + f.doc.students.length + ' students, docId '
          + String(f.doc.docId).slice(0, 12) + ')').join(', '));

    check('the status names the zip and what is in it, and says a page cannot know it arrived',
      / ok($|\s)/.test(' ' + ran.cls + ' ')
        && added.every(n => ran.status.indexOf(n.replace(/ \(\d+\)\.zip$/, '.zip')) >= 0)
        && files.every(f => ran.status.indexOf(f.name) >= 0)
        && /unzip it/i.test(ran.status)
        && /Check that it arrived/.test(ran.status)
        && /support details/.test(ran.status),
      JSON.stringify(ran.status.slice(0, 300)));

    /* Each year in the archive gets its OWN stamp — the deliverable, and the half of the Traps line
       that is about not stamping ahead of the hand-off. */
    const stamped = Object.keys(ran.stamps || {}).sort();
    check('each year written gets its own lastBackupAt stamp, and every stamp is fresh',
      JSON.stringify(stamped) === JSON.stringify(yearsOnDevice.slice().sort())
        && stamped.every(y => Math.abs(Date.now() - Number(ran.stamps[y])) < 180000)
        && ran.disabled === false,
      'planbook_lastBackupAt = ' + JSON.stringify(ran.stamps));

    /* And the nag is down for EVERY year, not just the one on screen — asked year by year, the way
       the cross-year check above asks it, because the strip is a fact about the open document. */
    const afterAll = await evalJs(`(async function(){ var s = window.planbook.store,
        b = window.planbook.backup, was = s.getDoc().year, out = [];
      var years = await s.listYears();
      for (var i = 0; i < years.length; i++) {
        await s.openYear(years[i]);
        b.refreshBackupNag();
        out.push({ year: years[i],
                   nagUp: !document.getElementById('backupNag').classList.contains('hidden') });
      }
      await s.openYear(was);
      b.refreshBackupNag();
      return { rows: out, backHome: s.getDoc().year,
               otherYears: document.getElementById('backupOtherYears').classList.contains('hidden') }; })()`);
    check('the nag is down for every year afterwards, not only for the one on screen',
      afterAll.backHome === YEAR && afterAll.rows.every(r => r.nagUp === false)
        && afterAll.otherYears === true && ran.otherYearsHidden === true,
      afterAll.rows.map(r => r.year + ' nag=' + r.nagUp).join(', ')
        + '; the never-downloaded line is hidden = ' + afterAll.otherYears);

    /* Acceptance 4, driven rather than reasoned: every file this control produced is fed back
       through the real restore path and has to reach the confirm. Cancelled each time — the swap
       itself has its own checks above, and this one is about what restore will ACCEPT.

       The text now comes out of the archive rather than off the disk, which is the same claim with
       one more step in it: these are the bytes a teacher gets after tapping the zip in Files, and
       restore — which has not changed and has never seen a zip — has to take every one of them. */
    const roundTrip = [];
    for (const f of parsed) {
      const text = f.text;
      roundTrip.push(await evalJs(`(async function(){ var b = window.planbook.backup;
        var ok = await b.restoreFromText(${JSON.stringify(text)}, ${JSON.stringify(f.name)});
        var m = document.getElementById('restoreConfirmModal');
        var open = !m.classList.contains('hidden');
        var button = document.getElementById('restoreConfirmBtn').textContent;
        b.cancelRestore();
        return { year: ${JSON.stringify(f.doc.year)}, ok: ok, confirmOpen: open, button: button,
                 status: document.getElementById('backupStatus').textContent }; })()`));
    }
    check('restore accepts every file this produces — each one reaches the confirm by name',
      roundTrip.length === parsed.length && roundTrip.length === yearsOnDevice.length
        && roundTrip.every(r => r.ok === true && r.confirmOpen === true
          && r.button === 'Replace ' + r.year),
      roundTrip.map(r => r.year + ': accepted=' + r.ok + ' confirm="' + r.button + '"').join(' | '));

    /*
      THE TRAPS LINE, as a fixture. One year is made unreadable in storage exactly the way a
      newer build would leave it — schemaVersion 99, the same poison the boot-failure exit uses —
      its stamp is cleared, and the run is repeated. What must be true afterwards is the whole of
      "never stamp a year that did not get delivered": that year is not an entry in the archive, it
      has no stamp, the other years are stamped and ARE entries, and the panel says which one was
      left out and why. A check that only counted files could not tell this apart from a run that
      worked.

      The victim is a year that is NOT open, because the open year comes out of memory and poisoning
      its record would prove nothing. The record is put back byte for byte at the end — everything
      after this section reads these years.
    */
    const victim = yearsOnDevice.find(y => y !== YEAR);
    const original = await evalJs(`(async function(){ return new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(victim)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; }); })()`);
    await evalJs(`(async function(){ var p = window.planbook;
      var times = p.getPref('lastBackupAt') || {};
      delete times[${JSON.stringify(victim)}];
      p.setPref('lastBackupAt', times);
      return new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite'), s = t.objectStore('years');
          var q = s.get(${JSON.stringify(victim)});
          q.onsuccess = function(){ var d = q.result; d.schemaVersion = 99; s.put(d); };
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; }); })()`);

    const dlBefore2 = await statDownloads();
    /* The victim's entry in the archive the FIRST tap wrote, which is what makes the assertion
       below non-vacuous: "this year is not in the zip" measured against a control that never put it
       in one would pass on a build that zips nothing at all. It was in there a moment ago, under a
       name this names, and now it must not be. */
    const victimWasIn = files.filter(f => f.doc && f.doc.year === victim).map(f => f.name);
    await clickSel('[data-backup-download-all]');
    const cut = await evalJs(`(async function(){ var el = document.getElementById('backupStatus');
      for (var i = 0; i < 200; i++) {
        if (el && !el.classList.contains('hidden') && /^(Saved|No file was written|Planbook could not)/.test(el.textContent)) break;
        await new Promise(function(r){ setTimeout(r, 100); });
      }
      /* The line has to come BACK, and refreshYearCoverage() re-reads IndexedDB without the run
         waiting for it, so this is polled for the same way its disappearance was above. */
      var line = document.getElementById('backupOtherYears'), text = '';
      for (var j = 0; j < 60; j++) {
        if (!line.classList.contains('hidden') && line.textContent) { text = line.textContent; break; }
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { status: el.textContent, cls: el.className,
               stamps: window.planbook.getPref('lastBackupAt'), otherYears: text }; })()`);
    const added2 = await newDownloads(dlBefore2, 1, 12000);
    /*
      The second archive, parsed the same way as the first. A second tap in one sitting produces the
      same file NAME as the first (same date), so whether the browser uniquifies it or overwrites it
      is the browser's business — trap 9, and why newDownloads() answers "this run wrote it" with a
      new name OR a moved mtime rather than with a diff of names.

      This is a stronger fixture than the sequential version's was, and the reason is the
      architecture rather than the wording: there is no longer any way for a year to be "written but
      not delivered", so what the archive holds IS what the tap produced. The old check had to
      narrow itself to the victim's own file on disk and say nothing about the other two, because a
      browser is entitled to refuse a second burst of downloads from one page (trap 8: a check that
      needs the environment to cooperate twice goes red about the environment). One file per tap
      needs it to cooperate once, so the survivors can be asserted too.
    */
    const zip2 = added2.length === 1 ? await readZip(added2[0]) : null;
    const years2 = [];
    for (const e of (zip2 ? zip2.entries : [])) {
      try { years2.push(JSON.parse(e.text).year); }
      catch (err) { years2.push('UNREADABLE:' + e.name); }
    }
    check('a year Planbook cannot read is left out of the zip, is NOT stamped, and is named on screen',
      victimWasIn.length === 1
        && added2.length === 1 && !!zip2 && zip2.error === ''
        && zip2.entries.every(e => e.name !== victimWasIn[0])
        && years2.indexOf(victim) === -1
        && JSON.stringify(years2.slice().sort())
          === JSON.stringify(yearsOnDevice.filter(y => y !== victim).sort())
        && !(cut.stamps || {})[victim]
        && Object.keys(cut.stamps || {}).length === yearsOnDevice.length - 1
        && / error($|\s)/.test(' ' + cut.cls + ' ')
        && new RegExp('holding ' + (yearsOnDevice.length - 1) + ' of ' + yearsOnDevice.length).test(cut.status)
        && new RegExp(victim + ' is not in it').test(cut.status)
        && /newer version of Planbook/.test(cut.status)
        && /still marked\s+as never backed up/.test(cut.status),
      victim + ' was in the previous archive as ' + JSON.stringify(victimWasIn) + '; this tap wrote '
        + added2.length + ' file(s) holding ' + (years2.join(', ') || 'nothing')
        + (zip2 && zip2.error ? ' (BROKEN: ' + zip2.error + ')' : '')
        + '; stamps = ' + JSON.stringify(cut.stamps)
        + '; status = ' + JSON.stringify(cut.status.slice(0, 240)));
    check('and the panel goes back to naming that year as never downloaded',
      new RegExp(victim).test(cut.otherYears) && /Back up all/.test(cut.otherYears),
      cut.otherYears ? JSON.stringify(cut.otherYears) : 'the never-downloaded line stayed hidden');

    /* The record put back exactly as it was, and the stamp with it, so nothing below inherits a
       poisoned year or a nag this section turned on. */
    await evalJs(`(async function(){ var p = window.planbook;
      var times = p.getPref('lastBackupAt') || {};
      times[${JSON.stringify(victim)}] = Date.now();
      p.setPref('lastBackupAt', times);
      return new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite');
          t.objectStore('years').put(${JSON.stringify(original)});
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; }); })()`);
    const repaired = await evalJs(`(async function(){
      var d = await window.planbook.store.readStoredDocument(${JSON.stringify(victim)});
      return { schemaVersion: d && d.schemaVersion, rev: d && d.rev }; })()`);
    check('the poisoned year is put back as it was, so the sections below inherit nothing',
      repaired.schemaVersion === SCHEMA_NOW && repaired.rev === original.rev,
      victim + ' is schema ' + repaired.schemaVersion + ' at rev ' + repaired.rev
        + ' (was schema ' + original.schemaVersion + ' at rev ' + original.rev + ')');
    await evalJs("window.planbook.closeModal('backupModal');1");
  }

  /* Every refusal, and the two things each one has to be true of: it says what was wrong, and
     it did not touch storage. A file that parses as JSON and is a shopping list has to be
     refused by name rather than by a stack trace. */
  const beforeRefusals = await evalJs(`(async function(){ var d = window.planbook.store.getDoc();
    return { rev:d.rev, docId:d.docId, students:d.students.length }; })()`);
  const refusals = await evalJs(`(async function(){ var b = window.planbook.backup;
    var good = ${TEXT}, out = [];
    async function tryIt(label, text, name){
      var ok = await b.restoreFromText(text, name);
      var st = document.getElementById('backupStatus');
      out.push({ label:label, ok:ok, msg:st.textContent, cls:st.className,
        confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') });
    }
    await tryIt('empty', '   ', 'empty.json');
    await tryIt('not JSON', '{ "year": "2026-2027", ', 'truncated.json');
    await tryIt('a shopping list', JSON.stringify({ milk:2, eggs:12 }), 'shopping.json');
    var newer = JSON.parse(good); newer.schemaVersion = 99;
    await tryIt('a newer schemaVersion', JSON.stringify(newer), 'future.json');
    var partial = JSON.parse(good); delete partial.students; delete partial.scores;
    await tryIt('half a document', JSON.stringify(partial), 'partial.json');
    var wrongKind = JSON.parse(good); wrongKind.students = 'Ada, Bo';
    await tryIt('students as text', JSON.stringify(wrongKind), 'wrong.json');
    return out; })()`);
  const afterRefusals = await evalJs(`(async function(){ var d = window.planbook.store.getDoc();
    return { rev:d.rev, docId:d.docId, students:d.students.length }; })()`);

  const refusedProperly = refusals.filter(r => r.ok === false && !r.confirmOpen
    && / error$| error /.test(' ' + r.cls + ' ')
    && /Nothing on this device has been changed\./.test(r.msg));
  check('every malformed or non-Planbook file is refused, with a message, and never reaches the confirm',
    refusedProperly.length === refusals.length,
    refusals.map(r => r.label + ': ' + (refusedProperly.includes(r) ? 'refused' : 'NOT REFUSED — ' + JSON.stringify(r))).join(' | '));
  check('and each refusal says what was actually wrong with that file, not one generic message',
    /not valid JSON|could not be read as JSON/i.test(refusals[1].msg)
      && /no school year in it/i.test(refusals[2].msg)
      && /newer version of Planbook/i.test(refusals[3].msg)
      && /missing students, scores/i.test(refusals[4].msg)
      && /students holds text where Planbook expects a list/i.test(refusals[5].msg),
    refusals.map(r => r.label + ' → ' + r.msg.slice(0, 60)).join(' | '));
  check('a refused file changes nothing — no partial apply, not even a rev',
    afterRefusals.rev === beforeRefusals.rev && afterRefusals.docId === beforeRefusals.docId
      && afterRefusals.students === beforeRefusals.students,
    JSON.stringify(beforeRefusals) + ' -> ' + JSON.stringify(afterRefusals));

  /* The confirm, named and cancellable. The live document is moved on first, so the two sides
     of the comparison genuinely differ and a dialog that printed the same document twice would
     fail this. */
  const confirmShown = await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){ d.students.push({ id:'s_b3', first:'Cy', last:'Probe' }); });
    await s.flush();
    await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json');
    var m = document.getElementById('restoreConfirmModal');
    return { open: !m.classList.contains('hidden'),
             lead: document.getElementById('restoreConfirmLead').textContent,
             compare: document.getElementById('restoreCompare').textContent.replace(/\\s+/g,' '),
             button: document.getElementById('restoreConfirmBtn').textContent,
             storedRev: s.getDoc().rev, storedStudents: s.getDoc().students.length }; })()`);
  check('the restore confirm names the outgoing document and the incoming one, with counts and dates',
    confirmShown.open
      && /On this device now/.test(confirmShown.compare)
      && /In the backup file/.test(confirmShown.compare)
      && /3 students/.test(confirmShown.compare) && /2 students/.test(confirmShown.compare)
      && (confirmShown.compare.match(/Last saved/g) || []).length === 2
      && (confirmShown.compare.match(new RegExp(YEAR, 'g')) || []).length === 2
      && confirmShown.button === 'Replace ' + YEAR,
    confirmShown.compare.slice(0, 220));

  await clickSel('[data-backup-cancel]');
  const cancelled = await evalJs(`(async function(){ var s = window.planbook.store;
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(s.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    return { confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden'),
             panelOpen: !document.getElementById('backupModal').classList.contains('hidden'),
             status: document.getElementById('backupStatus').textContent,
             memoryStudents: s.getDoc().students.length, storedStudents: stored.students.length,
             storedRev: stored.rev }; })()`);
  check('cancelling the confirm leaves the existing document untouched, in memory and on disk',
    !cancelled.confirmOpen && cancelled.memoryStudents === 3 && cancelled.storedStudents === 3
      && cancelled.storedRev === confirmShown.storedRev && /cancelled/i.test(cancelled.status),
    JSON.stringify(cancelled));

  /* Accepting it. The document that comes back has to be the file's content exactly — rev and
     updatedAt excepted, which src/store.js's restoreDocument() moves on purpose and explains
     at length. */
  const restored = await evalJs(`(async function(){
    await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json'); return 1; })()`);
  await clickSel('[data-backup-confirm]');
  await new Promise(r => setTimeout(r, 600));
  const applied = await evalJs(`(async function(){ var s = window.planbook.store;
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var file = JSON.parse(${TEXT});
    function content(d){ var c = Object.assign({}, d); delete c.rev; delete c.updatedAt;
      return JSON.stringify(c); }
    return { identical: content(stored) === content(file),
             storedRev: stored.rev, fileRev: file.rev, memoryRev: s.getDoc().rev,
             students: stored.students.length, docId: stored.docId,
             medical: !!(stored.students[0].supports && stored.students[0].supports.medical),
             label: (document.getElementById('yearButtonLabel')||{}).textContent,
             status: document.getElementById('backupStatus').textContent,
             confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') }; })()`);
  check('accepting the confirm restores the file byte-for-byte in content, support data included',
    restored === 1 && applied.identical && applied.students === 2 && applied.medical
      && applied.docId === built.docId && !applied.confirmOpen && applied.label === YEAR,
    JSON.stringify({ identical: applied.identical, students: applied.students, label: applied.label }));
  check('and the restored document continues this device\'s rev rather than reverting to the file\'s',
    applied.storedRev === cancelled.storedRev + 1 && applied.storedRev > applied.fileRev
      && applied.memoryRev === applied.storedRev,
    'file rev ' + applied.fileRev + ', device was at ' + cancelled.storedRev
      + ', restored document is rev ' + applied.storedRev);

  /* The two entry points a teacher actually uses, driven as closely as a script can get. A page
     cannot be handed a File by a script — but it can be handed a DataTransfer holding one,
     which is exactly what a drop and a file picker deliver, so everything from the event inward
     is the real path including the read. A REAL drag out of Finder, and the iPad's Files sheet,
     stay owed to a human. */
  const entry = await evalJs(`(async function(){ var text = ${TEXT};
    function dt(){ var d = new DataTransfer();
      d.items.add(new File([text], 'Planbook backup.json', { type:'application/json' }));
      return d; }
    var confirmEl = document.getElementById('restoreConfirmModal');
    function confirmOpen(){ return !confirmEl.classList.contains('hidden'); }
    var zone = document.getElementById('backupDrop');

    zone.dispatchEvent(new DragEvent('dragover', { bubbles:true, cancelable:true, dataTransfer: dt() }));
    var highlighted = zone.classList.contains('active');
    zone.dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer: dt() }));
    await new Promise(function(r){ setTimeout(r, 350); });
    var dropped = confirmOpen();
    window.planbook.backup.cancelRestore();

    var input = document.getElementById('backupFile');
    input.files = dt().files;
    input.dispatchEvent(new Event('change', { bubbles:true }));
    await new Promise(function(r){ setTimeout(r, 350); });
    var chosen = confirmOpen();
    window.planbook.backup.cancelRestore();

    /* A file dropped an inch wide of the target must do nothing — and must not navigate the
       browser to it, which would take the year document in memory with it. */
    var strayEvent = new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer: dt() });
    document.body.dispatchEvent(strayEvent);
    await new Promise(function(r){ setTimeout(r, 250); });
    return { highlighted:highlighted, dropped:dropped, chosen:chosen,
             stray: confirmOpen(), strayCancelled: strayEvent.defaultPrevented,
             inputCleared: input.value === '', dropStillActive: zone.classList.contains('active') }; })()`);
  check('a dropped backup file highlights the target and goes through the same confirm',
    entry.highlighted && entry.dropped && !entry.dropStillActive,
    JSON.stringify({ highlighted: entry.highlighted, reachedConfirm: entry.dropped }));
  check('choosing a file with the file input does too, and the input is cleared so the same file can be re-chosen',
    entry.chosen && entry.inputCleared, JSON.stringify({ reachedConfirm: entry.chosen, cleared: entry.inputCleared }));
  check('a file dropped anywhere else does nothing, and the browser is stopped from opening it',
    entry.stray === false && entry.strayCancelled === true,
    'confirm opened = ' + entry.stray + ', default prevented = ' + entry.strayCancelled);

  /* Download → wipe → restore, the acceptance line in full. The record is deleted out from
     under the app and the page reloaded, which is what a teacher's evicted iPad looks like from
     inside the browser: boot() finds a different year, or none. */
  await evalJs(`(async function(){ return new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){ var db = open.result;
      var t = db.transaction('years','readwrite');
      t.objectStore('years').delete(${JSON.stringify(YEAR)});
      t.oncomplete = function(){ db.close(); res(1); };
      t.onerror = function(){ rej(t.error); }; }; }); })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  const wiped = await evalJs(`(async function(){
    await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json');
    return { openYear: window.planbook.store.getDoc().year,
             lead: document.getElementById('restoreConfirmLead').textContent,
             note: document.getElementById('restoreConfirmNote').textContent,
             button: document.getElementById('restoreConfirmBtn').textContent }; })()`);
  check('with the year gone from storage, the confirm says nothing is being overwritten and names the switch',
    wiped.openYear !== YEAR
      && new RegExp('no ' + YEAR + ' school year on this device').test(wiped.lead || '')
      && new RegExp('The year you have open, ' + wiped.openYear + ', is not touched').test(wiped.note || '')
      && wiped.button === 'Add ' + YEAR,
    JSON.stringify(wiped));
  await clickSel('[data-backup-confirm]');
  await new Promise(r => setTimeout(r, 600));
  const back = await evalJs(`(async function(){ var s = window.planbook.store;
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var file = JSON.parse(${TEXT});
    function content(d){ var c = Object.assign({}, d); delete c.rev; delete c.updatedAt;
      return JSON.stringify(c); }
    return { identical: stored ? content(stored) === content(file) : false,
             rev: stored && stored.rev, fileRev: file.rev, open: s.getDoc().year,
             label: (document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
  check('download → wipe the year out of storage → restore gives the document back, identical in content',
    back.identical && back.open === YEAR && back.label === YEAR && back.rev === back.fileRev + 1,
    'restored ' + back.open + ' at rev ' + back.rev + ' from a file at rev ' + back.fileRev);

  /*
    ── A BACKUP WRITTEN BEFORE WO-2.10, RESTORED (WO-2.10 acceptance 14) ──

    The file on a teacher's disk today holds `"marks": { "s_1": "A" }` — bare strings, schema 1 —
    and there is no way to re-download it in the new shape, because the app that wrote it is gone.
    So the restore path is the only thing standing between her and a term of attendance that comes
    back half-converted, and it has to come out RIGHT rather than merely come out.

    It is driven end to end through the real path: the same restoreFromText() a drop and a file
    picker land in, the same confirm dialog, the same button. Nothing here calls the migration.
    The file is built from the one the run already produced, so it is a genuine Planbook backup in
    every respect except the two this check is about — its schemaVersion and the shape of its cells.

    FIVE THINGS ARE ASSERTED ON THE RECORD ON DISK, which is the only place the answer counts:
    every cell is an object, every code survived, no `at` was invented for a mark that never had
    one, the `at` that WAS in the file (a hand-written one, because a pre-WO-2.10 file cannot have
    any) is not disturbed, and the document is stamped at the current schema so the conversion
    cannot run a second time. The confirm is asked to have SAID so as well: "brought up to date
    from an older version" is what tells the teacher her file was older than her app.

    Nothing is put back afterwards, deliberately: the block below poisons this year's record and
    then restores the good file over it, so the next check's fixture is what cleans up.
  */
  const OLD_FILE = await evalJs(`(function(){
    var doc = JSON.parse(${TEXT});
    doc.schemaVersion = 1;
    doc.attendance = [
      { classId:'c_b1', date:'2026-09-08', marks:{ s_b1:'A', s_b2:'T' } },
      { classId:'c_b1', date:'2026-09-09', marks:{ s_b1:'', s_b2:'E' } },
      { classId:'c_b1', date:'2026-09-10', exception:'dropped' }
    ];
    return JSON.stringify(doc); })()`);
  await evalJs(`(async function(){
    await window.planbook.backup.restoreFromText(${JSON.stringify(OLD_FILE)},
      'Planbook ${YEAR} backup 2026-05-01.json'); return 1; })()`);
  const oldConfirm = await evalJs(`(function(){
    return { open: !document.getElementById('restoreConfirmModal').classList.contains('hidden'),
             compare: document.getElementById('restoreCompare').textContent.replace(/\\s+/g,' ') }; })()`);
  await clickSel('[data-backup-confirm]');
  await new Promise(r => setTimeout(r, 600));
  const converted = await evalJs(`(async function(){
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var cells = [];
    (stored.attendance || []).forEach(function(r){
      Object.keys(r.marks || {}).forEach(function(k){
        cells.push({ student:k, date:r.date, value:r.marks[k],
                     isObject: !!r.marks[k] && typeof r.marks[k] === 'object',
                     code: r.marks[k] && r.marks[k].code, at: r.marks[k] && r.marks[k].at }); });
    });
    return { schemaVersion: stored.schemaVersion, records: (stored.attendance || []).length,
             cells: cells, dropped: (stored.attendance || []).filter(function(r){ return r.exception; }).length }; })()`);
  check('restoring a backup written before WO-2.10 produces object cells, codes intact and no invented time',
    /* Two rungs now, and the confirm names both. A file this old climbs 1 → 2 (cells became
       objects) and then 2 → 3 (the two hall-pass collections), and the dialog says so in the words
       the teacher reads before agreeing to anything. */
    oldConfirm.open && /older version \(1→2, 2→3\)/.test(oldConfirm.compare)
      && converted.schemaVersion === SCHEMA_NOW && converted.records === 3 && converted.dropped === 1
      && converted.cells.length === 3
      && converted.cells.every(c => c.isObject && c.at === undefined)
      && converted.cells.map(c => c.date + ':' + c.student + '=' + c.code).sort().join(' ')
        === '2026-09-08:s_b1=A 2026-09-08:s_b2=T 2026-09-09:s_b2=E',
    'the file held bare strings at schema 1; on disk the cells are '
      + JSON.stringify(converted.cells.map(c => c.date + ' ' + c.student + ' ' + JSON.stringify(c.value)))
      + ' in ' + converted.records + ' record(s) at schema ' + converted.schemaVersion
      + '; the confirm said ' + (/older version/.test(oldConfirm.compare)
        ? JSON.stringify((oldConfirm.compare.match(/Brought up to date[^·]*/) || [''])[0].trim())
        : 'NOTHING about the file being older'));

  /* The boot-failure exit. WO-1.4 holds the loading screen up on a document written by a newer
     build, deliberately — and until WO-1.5 that screen had no way out at all. The document is
     poisoned in storage the way a newer build would have left it, and the whole recovery is
     driven from the screen the teacher would actually be looking at. */
  await evalJs(`(async function(){ window.planbook.setPref('openYear', ${JSON.stringify(YEAR)});
    return new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var t = db.transaction('years','readwrite'), s = t.objectStore('years');
        var q = s.get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ var d = q.result; d.schemaVersion = 99; s.put(d); };
        t.oncomplete = function(){ db.close(); res(1); };
        t.onerror = function(){ rej(t.error); }; }; }); })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  /* Poll for the failure, rather than sleeping and hoping: boot is asynchronous, and a single
     early sample cannot tell "refused" from "still loading". */
  let refusedBoot = null;
  for (let i = 0; i < 40 && !refusedBoot; i++) {
    try {
      refusedBoot = await evalJs(`(function(){ var box = document.getElementById('loadingError');
        if (!box || box.classList.contains('hidden')) return null;
        return { stuck: !document.getElementById('loadingScreen').classList.contains('hidden'),
                 detail: document.getElementById('loadingErrorDetail').textContent,
                 exits: document.querySelectorAll('#loadingError [data-backup-panel]').length }; })()`);
    } catch { /* the document is still swapping under us */ }
    if (!refusedBoot) await new Promise(r => setTimeout(r, 150));
  }
  await evalJs(KILL_ANIM);
  check('a document from a newer schemaVersion still stops boot, and says why',
    !!refusedBoot && refusedBoot.stuck && /newer version of Planbook/.test(refusedBoot.detail || ''),
    refusedBoot ? refusedBoot.detail.slice(0, 110) : 'the loading error never appeared');
  if (!refusedBoot) {
    skip('the boot-failure screen offers a reachable way back in from a backup file',
      'boot did not fail, so there was no failure screen to escape from');
    skip('with one un-downloaded year and no year open, nothing names a control that is not there',
      'boot did not fail, so the state this check is about could not be built');
    skip('and that fixture puts every year back, so the sections below inherit nothing',
      'boot did not fail, so nothing was taken away to put back');
  } else {
    await clickSel('#loadingError [data-backup-panel]');
    const exit = await evalJs(`(function(){ var m = document.getElementById('backupModal');
      return { panelOpen: !!m && !m.classList.contains('hidden'),
               downloadDisabled: document.getElementById('backupDownloadBtn').disabled,
               downloadLabel: document.getElementById('backupDownloadBtn').textContent }; })()`);
    check('the boot-failure screen offers a reachable way back in from a backup file',
      refusedBoot.exits === 1 && exit.panelOpen && exit.downloadDisabled === true,
      'exits on the screen = ' + refusedBoot.exits + ', panel opened = ' + exit.panelOpen
        + ', download button says "' + exit.downloadLabel + '"');

    await evalJs(`(async function(){
      await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json'); return 1; })()`);
    await clickSel('[data-backup-confirm]');
    await new Promise(r => setTimeout(r, 700));
    const recovered = await evalJs(`(async function(){ var s = window.planbook.store;
      var stored = await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
          q.onsuccess = function(){ res(q.result); db.close(); };
          q.onerror = function(){ rej(q.error); }; }; });
      return { loadingHidden: document.getElementById('loadingScreen').classList.contains('hidden'),
               storedVersion: stored.schemaVersion, students: stored.students.length,
               open: s.getDoc().year,
               label: (document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
    check('and restoring from there replaces the unreadable document and starts the app',
      recovered.loadingHidden && recovered.storedVersion === SCHEMA_NOW && recovered.students === 2
        && recovered.open === YEAR && recovered.label === YEAR,
      JSON.stringify(recovered));

    /*
      THE ONE STATE WO-1.11 GOT WRONG, built on purpose because nothing in this run reached it by
      accident. The never-downloaded line named "Back up all N years" — and the control it names is
      hidden by refreshBackupAllControl() whenever the device holds exactly one year, while the line
      hid itself only when no year was un-downloaded. Three conditions have to hold together for the
      two to disagree, and each one is already somewhere in this run on its own:

        · getDoc() is null   — only on the boot-failure screen, forty lines above, where by then
                               every year is stamped, so the line has nothing to say;
        · exactly one year   — only three hundred lines above the backup section, where a document
                               is open, so the line excludes it as "the year you have open";
        · that year unstamped.

      All three at once and the panel read: "… 2026-2027 is also on this device and has never been
      downloaded — “Back up all 1 year” writes it out too" — naming a button that is not on the
      screen, under a label the code above is written specifically never to show anybody.

      Built by taking the device down to one year rather than by reasoning about it: the other year
      records are lifted out whole, put aside in this process, and put back byte for byte below.
      Every stamp is cleared, the survivor is poisoned to schema 99 the same way the fixture above
      poisons it, and the panel is opened from the failure screen the teacher would be looking at.

      Asserted as a state that HOLDS rather than as one sample, per trap 5 and for the same reason as
      the one-year check three hundred lines above: refreshYearCoverage() re-reads IndexedDB without
      the panel waiting for it, so a single early sample cannot tell a correct silence from a refresh
      that has not landed. The strip may stay hidden or it may speak — what it may not do is name a
      control that is not on screen, so the assertion is on the words "Back up all" never appearing
      anywhere in the panel, which the markup's own fallback label ("Back up every year") leaves free
      to mean exactly that.
    */
    const solo = await evalJs(`(async function(){
      var p = window.planbook;
      var kept = ${JSON.stringify(YEAR)};
      var stamps = p.getPref('lastBackupAt');
      var records = await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var q = db.transaction('years','readonly').objectStore('years').getAll();
          q.onsuccess = function(){ res(q.result); db.close(); };
          q.onerror = function(){ rej(q.error); }; }; });
      await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite'), s = t.objectStore('years');
          records.forEach(function(d){ if (d.year !== kept) s.delete(d.year); });
          var q = s.get(kept);
          q.onsuccess = function(){ var d = q.result; d.schemaVersion = 99; s.put(d); };
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; });
      p.setPref('lastBackupAt', {});
      p.setPref('openYear', kept);
      return { records: records, stamps: stamps }; })()`);

    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    let soloRefused = null;
    for (let i = 0; i < 40 && !soloRefused; i++) {
      try {
        soloRefused = await evalJs(`(function(){ var box = document.getElementById('loadingError');
          return (!box || box.classList.contains('hidden')) ? null
            : { exits: document.querySelectorAll('#loadingError [data-backup-panel]').length }; })()`);
      } catch { /* the document is still swapping under us */ }
      if (!soloRefused) await new Promise(r => setTimeout(r, 150));
    }
    await evalJs(KILL_ANIM);
    if (soloRefused) await clickSel('#loadingError [data-backup-panel]');
    const named = soloRefused ? await evalJs(`(async function(){
      var p = window.planbook, s = p.store;
      var years = await s.listYears();
      var stamps = p.getPref('lastBackupAt') || {};
      var panel = document.getElementById('backupModal');
      var line = document.getElementById('backupOtherYears');
      var btn = document.getElementById('backupDownloadAllBtn');
      var note = document.getElementById('backupAllNote');
      var controlSeen = 0, lineSeen = 0, said = '', offence = '';
      for (var i = 0; i < 40; i++) {
        if (btn && !btn.classList.contains('hidden')) controlSeen++;
        if (note && !note.classList.contains('hidden')) controlSeen++;
        if (line && !line.classList.contains('hidden')) {
          lineSeen++;
          if (line.textContent) said = line.textContent;
        }
        var all = panel ? (panel.textContent.match(/Back up all[^”"]*/) || [])[0] : '';
        if (all && !offence) offence = all;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { years: years, docNull: !s.getDoc(), stamped: !!stamps[${JSON.stringify(YEAR)}],
               panelOpen: !!panel && !panel.classList.contains('hidden'),
               controlSeen: controlSeen, lineSeen: lineSeen, said: said, offence: offence }; })()`)
      : null;
    if (!named) {
      skip('with one un-downloaded year and no year open, nothing names a control that is not there',
        'the loading error never appeared on the one-year device, so the panel could not be opened '
          + 'from the screen this check is about');
    } else {
      check('with one un-downloaded year and no year open, nothing names a control that is not there',
        named.years.length === 1 && named.docNull === true && named.stamped === false
          && named.panelOpen === true && named.controlSeen === 0 && named.offence === '',
        'years on the device = ' + JSON.stringify(named.years) + ', nothing open = ' + named.docNull
          + ', stamped = ' + named.stamped + '; the multi-year control stayed hidden across 40 '
          + 'samples over 1s (' + named.controlSeen + ' sightings); the panel said "Back up all …" '
          + (named.offence ? 'in ' + JSON.stringify(named.offence) : 'nowhere') + '; the '
          + 'never-downloaded strip was ' + (named.lineSeen ? 'shown: ' + JSON.stringify(named.said)
            : 'hidden'));
    }

    /* Every year put back exactly as it was lifted, stamps and all, and the survivor un-poisoned by
       the same put — everything below this section reads these years. */
    await evalJs(`(async function(){
      var p = window.planbook;
      await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite'), s = t.objectStore('years');
          ${JSON.stringify(solo.records)}.forEach(function(d){ s.put(d); });
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; });
      p.setPref('lastBackupAt', ${JSON.stringify(solo.stamps || {})});
      p.setPref('openYear', ${JSON.stringify(YEAR)});
      return 1; })()`);
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const soloBack = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    const restoredAll = await evalJs(`(async function(){ var s = window.planbook.store;
      var d = s.getDoc();
      return { years: await s.listYears(), open: d && d.year, schemaVersion: d && d.schemaVersion,
               stamps: window.planbook.getPref('lastBackupAt') }; })()`);
    check('and that fixture puts every year back, so the sections below inherit nothing',
      soloBack && restoredAll.years.length === solo.records.length && restoredAll.open === YEAR
        && restoredAll.schemaVersion === SCHEMA_NOW
        && JSON.stringify(restoredAll.stamps) === JSON.stringify(solo.stamps || {}),
      'booted = ' + soloBack + ', years = ' + JSON.stringify(restoredAll.years) + ' (took '
        + solo.records.length + ' away), open = ' + restoredAll.open + ' at schema '
        + restoredAll.schemaVersion + ', stamps back = '
        + (JSON.stringify(restoredAll.stamps) === JSON.stringify(solo.stamps || {})));
  }
}

/* ───────────────── classes & terms ─────────────────
 *
 * WO-1.6's acceptance lines, driven through the controls a teacher touches: the classes are
 * created by typing into the real form and clicking its real Create button, reordered by clicking
 * the real arrows, and deleted through the real confirm. The window.planbook.classes seam is used
 * only to READ the answer — which class and which term are open, what the document holds — because
 * the alternative is a second copy of "resolve the stored id against the document" living in this
 * file, where it could agree with itself and disagree with the app.
 *
 * What is NOT here, and is owed to a human: a thumb on a 44px arrow, the iPadOS date picker that
 * `<input type="date">` opens, and whether six tabs and four terms are actually reachable on a
 * physical iPad in portrait. The touch section below measures the boxes; it cannot press them.
 */

console.log('\n--- classes & terms ---');

/* The section above finishes with a modal open over the header. A reload starts from the app as a
   teacher finds it — and it also proves the class bar draws itself from IndexedDB at boot rather
   than from whatever happened to be in memory. */
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const classesBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

/* Everything this section reads, in one page-side helper, so that a check is one round trip and
   the reads cannot drift between checks. Re-installed after every reload, like the walker. */
const INSTALL_CLASS_READER = `(function(){
  window.__cls = function(){
    var doc = window.planbook.store.getDoc();
    var c = window.planbook.classes;
    var bar = document.getElementById('classTabBar');
    var nav = document.getElementById('termNav');
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('[data-class-tab]'));
    return {
      names: doc.classes.map(function(x){ return x.name; }),
      ids: doc.classes.map(function(x){ return x.id; }),
      archived: doc.classes.map(function(x){ return !!x.archived; }),
      termCounts: doc.classes.map(function(x){ return (x.terms||[]).length; }),
      termIds: doc.classes.map(function(x){ return (x.terms||[]).map(function(t){ return t.id; }); }),
      termLabels: doc.classes.map(function(x){ return (x.terms||[]).map(function(t){ return t.label; }); }),
      termDates: doc.classes.map(function(x){ return (x.terms||[]).map(function(t){ return [t.start, t.end]; }); }),
      rosters: doc.classes.map(function(x){ return (x.roster||[]).length; }),
      categories: doc.classes.map(function(x){ return (x.categories||[]).length; }),
      /* WO-3.1. The totals and the provisional verdict come out of src/categories.js rather than
         being summed here, for the reason every other read on this object does: a harness carrying
         its own copy of the arithmetic could agree with itself perfectly and disagree with the app,
         which is the exact failure the seam exists to prevent.
         (No backticks in this comment: it is inside a template literal.) */
      weightTotals: doc.classes.map(function(x){ return window.planbook.categories.weightTotal(x); }),
      provisional: doc.classes.map(function(x){ return window.planbook.categories.isProvisional(x); }),
      categoryNames: doc.classes.map(function(x){ return (x.categories||[]).map(function(k){ return k.name; }); }),
      categoryWeights: doc.classes.map(function(x){ return (x.categories||[]).map(function(k){ return k.weight; }); }),
      categoryIds: doc.classes.map(function(x){ return (x.categories||[]).map(function(k){ return k.id; }); }),
      /* The badge src/classes.js draws on a manager row when a class's weights do not add up —
         WO-3.1's warning on the screen five classes are set up from, read as text so that a check
         can assert the NUMBER is in it and not merely that something went amber. */
      rowWarnings: Array.prototype.slice.call(
        document.querySelectorAll('#classList .class-row')).map(function(r){
          var w = r.querySelector('.class-row-warn'); return w ? w.textContent : ''; }),
      tabNames: tabs.map(function(b){ return b.textContent; }),
      tabIds: tabs.map(function(b){ return b.getAttribute('data-class-tab'); }),
      addTab: !!bar.querySelector('.cls-tab-add'),
      injectedInBar: bar.querySelectorAll('b, script, i').length,
      tabChildren: tabs.reduce(function(n, b){ return n + b.children.length; }, 0),
      navLabels: Array.prototype.slice.call(nav.querySelectorAll('button')).map(function(b){ return b.textContent; }),
      navActive: Array.prototype.slice.call(nav.querySelectorAll('button.active')).map(function(b){ return b.getAttribute('data-term-select'); }),
      /* The home screen's cards, read in the same round trip as the tab bar because they are the
         SECOND VIEW OF THE SAME LIST and only the bar redraws itself — src/shell.js's
         afterClassChange() is what redraws these, from a hand-maintained call list. See
         homeVsDoc() in this file for what a missing line off that list looks like from here.

         The data-class-tab hook moved OFF the card and onto the button inside it at WO-2.1: a card
         that has to carry a second control cannot itself be a button, because a control cannot be
         nested in a control. Same claim, one level deeper — see src/home.js's classCard().
         (No backticks in this comment: it is inside a template literal.) */
      homeIds: Array.prototype.slice.call(
        document.querySelectorAll('#homeGrid .class-card .class-card-open')).map(function(c){ return c.getAttribute('data-class-tab'); }),
      homeNames: Array.prototype.slice.call(
        document.querySelectorAll('#homeGrid .class-card')).map(function(c){ return (c.querySelector('.class-card-name')||{}).textContent; }),
      homeOpen: Array.prototype.slice.call(
        document.querySelectorAll('#homeGrid .class-card.open .class-card-open')).map(function(c){ return c.getAttribute('data-class-tab'); }),
      rows: document.querySelectorAll('#classList .class-row').length,
      archivedRows: document.querySelectorAll('#classArchivedList .class-row').length,
      archivedHidden: document.getElementById('classArchivedSection').classList.contains('hidden'),
      selectedClass: c.getSelectedClassId(),
      selectedTerm: c.getSelectedTermId(),
      rev: doc.rev,
      attendance: doc.attendance.length,
      assignments: doc.assignments.length,
      scoreColumns: Object.keys(doc.scores).length,
      students: doc.students.length,
      classError: (document.getElementById('classError')||{}).textContent,
      termError: (document.getElementById('termError')||{}).textContent,
      prefClass: window.planbook.getPref('openClassId'),
      prefTerms: window.planbook.getPref('openTermIds')
    };
  }; return 1; })()`;

/*
  Does the home screen still agree with the document — right now, after whatever just changed a
  class?

  WHY THIS EXISTS AS ITS OWN READ, repeated after each mutation instead of once at the end. The
  cards and the header tabs are two views of one list and only the tabs redraw themselves:
  src/classes.js ends every mutator with its own refreshClassBar(), and the cards are redrawn from
  src/shell.js's afterClassChange(), which is a HAND-MAINTAINED LIST OF CALL SITES. That list is
  complete today. The failure it has no guard against is a work order adding a mutator — or editing
  one of the eight branches that already call it — and forgetting its line, which leaves every check
  in this file green while a teacher watches an archived class sit on the grid behind the dialog she
  archived it in. Read once, before the archive step, that gap was invisible (WO-1.12).

  THE VACUOUS PASS THIS GUARDS AGAINST is the obvious one: an empty grid agrees with a document that
  has no classes, and a check that only asked "is the archived class gone from the grid" would pass
  hardest on a grid that renders nothing at all. So the assertion is equality against the ACTIVE
  classes in the document — order, ids and names — plus a non-zero count, plus the open mark landing
  on the class src/classes.js resolves. `live` is one window.__cls() read; the active list is derived
  here from the document it already carries rather than asked for separately.
*/
function homeVsDoc(live) {
  const activeIds = live.ids.filter((_, i) => !live.archived[i]);
  const activeNames = live.names.filter((_, i) => !live.archived[i]);
  /* An archived or deleted class can be the one the preference still names, and it has no card —
     so "no card is marked" is the right answer then, and only then. */
  const wantOpen = activeIds.indexOf(live.selectedClass) === -1 ? [] : [live.selectedClass];
  return {
    ok: live.homeIds.length > 0
      && JSON.stringify(live.homeIds) === JSON.stringify(activeIds)
      && JSON.stringify(live.homeNames) === JSON.stringify(activeNames)
      && JSON.stringify(live.homeOpen) === JSON.stringify(wantOpen),
    detail: live.homeIds.length + ' card(s) ' + JSON.stringify(live.homeNames) + ' for '
      + activeIds.length + ' active class(es) ' + JSON.stringify(activeNames)
      + '; open card ' + JSON.stringify(live.homeOpen) + ', expected ' + JSON.stringify(wantOpen)
  };
}

const classSeam = await evalJs("!!(window.planbook && window.planbook.classes"
  + " && typeof window.planbook.classes.getSelectedTermId === 'function')");

if (!classesBooted || !classSeam) {
  skip('classes & terms: create, reorder, rename, per-class term structures, archive, delete',
    classesBooted ? 'no window.planbook.classes seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  await evalJs(INSTALL_CLASS_READER);

  /*
    ONTO THE CLASS VIEW BEFORE ANYTHING IS READ OFF THE TAB STRIP, because since WO-1.13 that strip
    is a class-view control: cards enter, tabs switch, and the home grid draws no class tabs at all
    (src/classes.js's refreshClassBar). Every tabNames / tabIds check below is asking what the
    SWITCHER shows, so it has to be asked where the switcher is — and the way onto it is the card a
    teacher taps rather than the seam.

    Guarded rather than unconditional: which view a reload lands on is a preference now, so where
    this section starts depends on where the one above it finished, and the guard is what stops that
    mattering. Every check below is about a mutation made AFTER this point, so arriving here does
    not paint any of the answers they read.
  */
  const toClassView = async () => {
    if (await has('#classTabBar [data-class-tab]')) return;
    await clickSel('#homeGrid .class-card-open');
  };
  await toClassView();

  /* The document restored by the section above holds one class written WITHOUT a `terms` array,
     which is exactly the shape a class arrives in from another build, or from a document older
     than this work order. The header has to survive it rather than throw on `cls.terms.length`,
     and the term nav's answer has to be a way to fix it rather than a blank strip. */
  const legacy = await evalJs('window.__cls()');
  check('a class stored with no terms at all still renders, and the term nav offers to add them',
    legacy.tabNames.length === 1 && legacy.addTab && legacy.navLabels.length === 1
      && legacy.navLabels[0] === 'Add terms' && legacy.selectedTerm === ''
      && legacy.selectedClass === legacy.ids[0],
    JSON.stringify({ tabs: legacy.tabNames, nav: legacy.navLabels, selectedTerm: legacy.selectedTerm }));

  /* Six, because the owner teaches five and the acceptance line says six: the sixth is what proves
     nothing here is sized to five. One of them carries markup in its name — class names in this app
     are typed by a teacher and pasted out of a school system, and `Honors Bio <b>lab</b>` has to
     stay those characters rather than become bold. */
  const NEW_CLASSES = ['Period 1 — Biology', 'Period 2 — Chemistry', 'Period 4 — Physics',
    'Honors Bio <b>lab</b>', 'AP Bio', 'Homeroom'];
  await clickSel('header [data-class-manage]');
  for (const name of NEW_CLASSES) {
    await evalJs('(function(){document.getElementById("classNewInput").value='
      + JSON.stringify(name) + ';return 1})()');
    await clickSel('[data-class-create] button[type="submit"]');
  }
  const made = await evalJs('window.__cls()');
  const expectedNames = [legacy.names[0]].concat(NEW_CLASSES);
  check('six classes created through the form are in the document and on the tab bar, in that order',
    JSON.stringify(made.names) === JSON.stringify(expectedNames)
      && JSON.stringify(made.tabNames) === JSON.stringify(expectedNames)
      && JSON.stringify(made.tabIds) === JSON.stringify(made.ids)
      && made.rows === 7,
    JSON.stringify(made.tabNames));
  /* RE-POINTED AT WO-3.1, and the change of side is the deliverable. This asserted
     `categories.every(n => n === 0)` until then, because src/classes.js seeded none on purpose and
     said so in a comment that named the work order it was waiting for. That work order has landed,
     so a class now arrives with a starter set — and the interesting half is not that there are
     four of them but that they add up to 100, which is what makes a fresh class arrive with the
     warning off. The empty collection asserted here now is `roster`, which is still empty on
     purpose. The class restored by the section above predates all of this and is skipped by the
     same `slice(1)` the term count uses. */
  check('each one arrives with a term structure and a starter weighting that already adds up',
    made.termCounts.slice(1).every(n => n === 4) && made.rosters.every(n => n === 0)
      && made.categories.slice(1).every(n => n === 4)
      && made.weightTotals.slice(1).every(n => n === 100)
      && made.provisional.slice(1).every(p => p === false),
    'terms per class = ' + JSON.stringify(made.termCounts) + ', rosters = '
      + JSON.stringify(made.rosters) + ', categories = ' + JSON.stringify(made.categories)
      + ', weights total = ' + JSON.stringify(made.weightTotals));
  check('a class name containing markup is rendered as text — createElement, never innerHTML',
    made.tabNames.indexOf('Honors Bio <b>lab</b>') >= 0 && made.injectedInBar === 0
      && made.tabChildren === 0,
    'elements injected into the tab bar = ' + made.injectedInBar
      + ', child elements inside the tabs = ' + made.tabChildren);
  /* And the home screen's cards followed all six creations — the first of the six mutations below
     that each carry one line of src/shell.js's afterClassChange() list. See homeVsDoc(). */
  const madeHome = homeVsDoc(made);
  check('the home screen gains a card when a class is created through the form', madeHome.ok,
    madeHome.detail);

  /* Reorder, by the explicit controls rather than by drag: HTML5 drag-and-drop does not fire for
     touch on iPadOS at all, and the acceptance line reads "by drag OR by explicit up/down
     controls". The document order IS the tab order — there is no order field — so both halves of
     that claim come out of one read. */
  await clickSel('#classList .class-row:nth-child(1) [data-class-move-down]');
  const down = await evalJs('window.__cls()');
  check('the down control moves a class one place later, in the document and on the bar together',
    down.ids[0] === made.ids[1] && down.ids[1] === made.ids[0]
      && JSON.stringify(down.tabIds) === JSON.stringify(down.ids),
    JSON.stringify(down.tabNames.slice(0, 3)));
  const downHome = homeVsDoc(down);
  check('and the cards reorder with it — the grid is the tab bar\'s second view, not a stale copy',
    downHome.ok, downHome.detail);
  await clickSel('#classList .class-row:nth-child(2) [data-class-move-up]');
  const up = await evalJs('window.__cls()');
  check('the up control puts it back, and the tab order follows the document exactly',
    JSON.stringify(up.ids) === JSON.stringify(made.ids)
      && JSON.stringify(up.tabIds) === JSON.stringify(up.ids),
    JSON.stringify(up.tabNames.slice(0, 3)));
  /* The up arrow is its own line in that list, and its own check for that reason: the down arrow
     above having redrawn the grid is exactly what would let a missing line here read as green. */
  const upHome = homeVsDoc(up);
  check('and the cards go back with it, in the document\'s order', upHome.ok, upHome.detail);
  const ends = await evalJs(`(function(){ var rows = document.querySelectorAll('#classList .class-row');
    var first = rows[0], last = rows[rows.length-1];
    return { firstUp: first.querySelector('[data-class-move-up]').disabled,
             firstDown: first.querySelector('[data-class-move-down]').disabled,
             lastUp: last.querySelector('[data-class-move-up]').disabled,
             lastDown: last.querySelector('[data-class-move-down]').disabled }; })()`);
  check('the arrows are disabled at the ends of the list rather than being live and doing nothing',
    ends.firstUp === true && ends.lastDown === true
      && ends.firstDown === false && ends.lastUp === false,
    JSON.stringify(ends));

  /* Rename, in place in the row. The field is a <form>, so Enter submits it; the click below is the
     other half of the same path. */
  await clickSel('#classList .class-row:nth-child(3) [data-class-rename]');
  const renaming = await evalJs(`(function(){ var i = document.querySelector('#classList .rename-input');
    return { present: !!i, value: i ? i.value : '', focused: i === document.activeElement }; })()`);
  await evalJs('(function(){var i=document.querySelector("#classList .rename-input");'
    + 'i.value="Period 2 — Chem (renamed)";return 1})()');
  await clickSel('#classList .class-rename-form button[type="submit"]');
  const renamed = await evalJs('window.__cls()');
  check('renaming happens in the row, starts from the old name, and lands on the tab as well',
    renaming.present && renaming.value === 'Period 2 — Chemistry' && renaming.focused
      && renamed.names[2] === 'Period 2 — Chem (renamed)'
      && renamed.tabNames[2] === 'Period 2 — Chem (renamed)'
      && renamed.ids[2] === made.ids[2]
      && renamed.names.indexOf('Period 2 — Chemistry') === -1,
    'the field held ' + JSON.stringify(renaming.value) + ', the document now says '
      + JSON.stringify(renamed.names[2]));
  const renamedHome = homeVsDoc(renamed);
  check('and the card carries the new name too, not the one it was rendered with',
    renamedHome.ok && renamed.homeNames.indexOf('Period 2 — Chem (renamed)') >= 0,
    renamedHome.detail);

  /*
    Two classes, two different term structures, both working — the acceptance line that fails the
    instant anything in this app treats terms as a property of the year rather than of the class.
    `Homeroom` is given one term for the whole year; the class above it keeps its four quarters.
  */
  await clickSel('#classList .class-row:nth-child(7) [data-term-manage]');
  const termsPanel = await evalJs(`(function(){ var m = document.getElementById('termsModal');
    return { open: !!m && !m.classList.contains('hidden'),
             className: (document.getElementById('termsClassName')||{}).textContent,
             rows: document.querySelectorAll('#termList .term-row').length,
             stacked: !document.getElementById('classesModal').classList.contains('hidden') }; })()`);
  await clickSel('[data-term-preset="fullYear"]');
  const single = await evalJs('window.__cls()');
  check('the term editor opens over the manager, for the class whose row was tapped',
    termsPanel.open && termsPanel.stacked && termsPanel.className === 'Homeroom'
      && termsPanel.rows === 4,
    JSON.stringify(termsPanel));
  check('a class can be given a single year-long term while its neighbour keeps four',
    single.termCounts[6] === 1 && single.termLabels[6][0] === 'Full year'
      && single.termCounts[1] === 4 && single.termLabels[1].length === 4,
    'Homeroom = ' + JSON.stringify(single.termLabels[6]) + ', Period 1 = '
      + JSON.stringify(single.termLabels[1]));

  /* The dates on that one term, put through the two real date fields. Setting `.value` and
     dispatching `input` is the path a keystroke takes — the delegated listener in shell.js reads
     the element, not the event's provenance. The iPadOS date picker itself is owed to a human. */
  await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-date');
    f[0].value = '2026-08-26'; f[0].dispatchEvent(new Event('input', { bubbles:true }));
    f[1].value = '2027-06-11'; f[1].dispatchEvent(new Event('input', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 300));
  const dated = await evalJs('window.__cls()');
  check('and that term can carry the whole school year, stored exactly as it was typed',
    JSON.stringify(dated.termDates[6]) === JSON.stringify([['2026-08-26', '2027-06-11']]),
    JSON.stringify(dated.termDates[6]));

  /*
    Messy dates, which is an acceptance line stated as a promise about what does NOT happen: term 2
    starts before term 1 ends (an overlap), term 3 has no dates at all (a gap, and two blanks), and
    term 4 ends months before it starts (backwards). Nothing may sort them, repair them, warn about
    them or refuse them — plans/rotating-schedule.md deleted the schedule model, and validating
    these into a contiguous calendar is how it comes back.
  */
  await clickSel('#termsModal [data-modal-close]');
  await clickSel('#classList .class-row:nth-child(2) [data-term-manage]');
  const messyBefore = await evalJs('window.__cls()');
  const MESSY = [['2026-08-26', '2026-11-06'], ['2026-10-15', '2027-01-22'], ['', ''],
    ['2027-06-10', '2027-03-25']];
  await evalJs(`(function(){ var rows = document.querySelectorAll('#termList .term-row');
    var want = ${JSON.stringify(MESSY)};
    for (var i = 0; i < rows.length; i++) {
      var f = rows[i].querySelectorAll('.term-date');
      f[0].value = want[i][0]; f[0].dispatchEvent(new Event('input', { bubbles:true }));
      f[1].value = want[i][1]; f[1].dispatchEvent(new Event('input', { bubbles:true }));
    }
    return 1; })()`);
  await new Promise(r => setTimeout(r, 300));
  const messy = await evalJs('window.__cls()');
  check('overlapping, backwards and empty term dates are all stored exactly as they were typed',
    JSON.stringify(messy.termDates[1]) === JSON.stringify(MESSY),
    JSON.stringify(messy.termDates[1]));
  check('and nothing sorted, repaired, refused or warned about them',
    JSON.stringify(messy.termIds[1]) === JSON.stringify(messyBefore.termIds[1])
      && JSON.stringify(messy.termLabels[1]) === JSON.stringify(messyBefore.termLabels[1])
      && messy.termCounts[1] === 4 && messy.termError === '' && messy.classError === '',
    'term order and labels unchanged, term error = ' + JSON.stringify(messy.termError));

  /*
    Clearing a date and then choosing the SAME date again, which is the iPadOS defect the first
    device sitting found: the date popover keeps its own selection after the field is cleared, so
    re-tapping the day that was just cleared is a no-op the picker never reports. classes.js answers
    it by throwing a cleared field away and building a fresh one, which is what this measures —
    element identity, not just the stored value.

    Chrome cannot reproduce the picker's stale state, so this does not prove the tablet is fixed.
    What it does prove is the mechanism the fix rests on, and that it is still there next month.

    Run on term 1's start date and then put it back, so MESSY is intact for the reload check
    further down that asserts these same dates survived a restart.
  */
  await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[0]
      .querySelectorAll('.term-date')[0];
    f.__pbStale = 1;
    f.value = ''; f.dispatchEvent(new Event('input', { bubbles:true }));
    f.dispatchEvent(new Event('change', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 200));
  const cleared = await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[0]
      .querySelectorAll('.term-date')[0];
    return { rebuilt: !f.__pbStale, value: f.value, type: f.type,
             label: (f.closest('.term-date-field')||{}).textContent,
             stored: window.planbook.store.getDoc().classes[1].terms[0].start }; })()`);
  check('a cleared term date is stored empty, and its field is rebuilt so the picker keeps no stale selection',
    cleared.rebuilt && cleared.value === '' && cleared.stored === '' && cleared.type === 'date'
      && cleared.label === 'Starts',
    JSON.stringify(cleared));

  await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[0]
      .querySelectorAll('.term-date')[0];
    f.value = '2026-08-26'; f.dispatchEvent(new Event('input', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 300));
  /* Named for what this can actually prove here. Chrome will accept a re-set value whether or not
     the element was rebuilt, so "works on the first tap" is not what is being measured — what is,
     is that the REBUILT field is still wired to the term and field it replaced. A rebuild that
     dropped or mistyped `data-term-id` would write this date to the wrong term, or nowhere, and the
     stored dates would not come back to MESSY. */
  const repicked = await evalJs('window.__cls()');
  check('and the rebuilt field still writes to the term and field it replaced',
    JSON.stringify(repicked.termDates[1]) === JSON.stringify(MESSY),
    JSON.stringify(repicked.termDates[1][0]));

  /* The other half of that fix, and the regression it could easily become. A desktop date field
     reports '' while a date is part-typed, so the rebuild is bound to `change` and must NOT happen
     on `input` — rebuilding there would replace the element under the teacher's caret partway
     through typing. Term 3 carries no dates in MESSY, so an empty `input` here changes nothing. */
  const typing = await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[2]
      .querySelectorAll('.term-date')[0];
    f.__pbTyping = 1;
    f.value = ''; f.dispatchEvent(new Event('input', { bubbles:true }));
    var now = document.querySelectorAll('#termList .term-row')[2].querySelectorAll('.term-date')[0];
    return { survived: !!now.__pbTyping, same: now === f }; })()`);
  check('an empty date field being typed into is not rebuilt underneath the caret',
    typing.survived && typing.same, JSON.stringify(typing));

  /*
    The one refusal this feature has, and the only place it reads anything grade-shaped: removing a
    term that still holds an assignment. WO-3.x owns moving an assignment between terms; until that
    exists, cascading the removal would leave a grade pointing at a term that is gone, and a grade
    that quietly stops counting is the worst failure this app has. There is no assignment screen
    yet, so the fixture is written through the store — and taken back out afterwards, so the counts
    the delete confirm prints further down stay the ones this file states.
  */
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){ d.assignments.push({ id:'a_guard',
      classId:${JSON.stringify(messyBefore.ids[1])},
      termId:${JSON.stringify(messyBefore.termIds[1][1])}, name:'Unit test', points:100 }); });
    await s.flush(); return 1; })()`);
  await clickSel('#termList .term-row:nth-child(2) [data-term-remove]');
  const refused = await evalJs('window.__cls()');
  check('removing a term that still holds an assignment is refused, and says what is in the way',
    refused.termCounts[1] === 4 && /still holds 1 assignment/.test(refused.termError || '')
      && /has not been removed/.test(refused.termError || ''),
    JSON.stringify(refused.termError));
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){ d.assignments = d.assignments.filter(function(a){ return a.id !== 'a_guard'; }); });
    await s.flush(); return 1; })()`);

  /* Selecting a class and a term from the header, which is the control every later screen reads
     through. Both panels are closed first: an overlay is fixed at inset 0, so a click aimed at a
     header button underneath one lands on the scrim — the same viewport-coordinate trap clickSel's
     own comment describes, one level up. */
  await clickSel('#termsModal [data-modal-close]');
  await clickSel('#classesModal [data-modal-close]');
  await clickSel('[data-class-tab]', 1);
  const onClass = await evalJs('window.__cls()');
  check('tapping a class tab opens it, and the term nav switches to THAT class\'s terms',
    onClass.selectedClass === onClass.ids[1]
      && JSON.stringify(onClass.navLabels) === JSON.stringify(messyBefore.termLabels[1])
      && onClass.selectedTerm === onClass.termIds[1][0],
    'open class = ' + JSON.stringify(onClass.names[1]) + ', nav = ' + JSON.stringify(onClass.navLabels));
  await clickSel('[data-term-select]', 1);
  const onTerm = await evalJs('window.__cls()');
  check('and tapping a term opens that one, with one active tab in the nav',
    onTerm.selectedTerm === onTerm.termIds[1][1] && onTerm.navActive.length === 1
      && onTerm.navActive[0] === onTerm.termIds[1][1],
    'open term = ' + onTerm.selectedTerm);

  /*
    A full reload, which settles three things at once: that a document holding those messy dates
    still boots (a date this app could not read would take the whole year down at load), that the
    header draws itself out of IndexedDB, and that the open class and term are remembered.

    Which class and which term are open is a UI fact, so it lives in a `planbook_` preference —
    ids on both sides and nothing else. A class NAME there would be teacher-typed content sitting
    outside IndexedDB, which is the line src/prefs.js exists to hold.

    FLUSHED FIRST, deliberately, and this is the one place in this file where that needs saying.
    Every write above went through the store's debounce, and a CDP `Page.reload` tears the
    execution context down without waiting for an IndexedDB transaction to complete — which is
    exactly the limit src/store.js's own header comment admits it cannot survive. Reloading on an
    unflushed document made this check fail for a reason with nothing to do with classes and terms:
    the document came back without the six classes, and it read like a store defect. That the store
    starts a pending write the moment the page stops being visible has its own check further up,
    where it is measured with a dispatched `visibilitychange` and a poll rather than a race.
  */
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const rememberedBoot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  const remembered = await evalJs('window.__cls()');
  check('the app boots again on those dates, and the header comes back with them',
    rememberedBoot && JSON.stringify(remembered.termDates[1]) === JSON.stringify(MESSY)
      && remembered.tabNames.length === 7 && remembered.navLabels.length === 4,
    rememberedBoot ? 'reopened with ' + remembered.navLabels.length + ' terms in the nav'
      : 'the loading screen never came down');
  check('the open class and the open term survive the reload',
    remembered.selectedClass === onTerm.selectedClass
      && remembered.selectedTerm === onTerm.selectedTerm
      && remembered.navActive.length === 1 && remembered.navActive[0] === onTerm.selectedTerm,
    'class ' + remembered.selectedClass + ', term ' + remembered.selectedTerm);
  const prefTermPairs = Object.keys(remembered.prefTerms || {})
    .map((k) => k + ' → ' + remembered.prefTerms[k]);
  check('and only ids are remembered — no class name, nothing else out of the document',
    /^c_[0-9a-z]{10}$/.test(remembered.prefClass || '')
      && Object.keys(remembered.prefTerms || {}).length > 0
      && Object.keys(remembered.prefTerms || {}).every(k => /^c_[0-9a-z]{10}$/.test(k))
      && Object.keys(remembered.prefTerms || {}).every(k => /^tm_[0-9a-z]{10}$/.test(remembered.prefTerms[k])),
    'planbook_openClassId = ' + remembered.prefClass + ', planbook_openTermIds = '
      + JSON.stringify(prefTermPairs));
  /* The WO-1.4 defect, which shipped and looked like it worked: setPref refuses any key that is
     not declared in PREF_DEFAULTS, and it refuses it by logging to the console and returning
     false. A new preference that was never declared writes nothing, forever, silently. */
  const declared = await evalJs("(function(){ var p = window.planbook;"
    + " return p.setPref('openClassId', p.getPref('openClassId'))"
    + " && p.setPref('openTermIds', p.getPref('openTermIds')); })()");
  check('both new preferences are declared in PREF_DEFAULTS, so setPref writes instead of refusing',
    declared === true, 'setPref returned ' + declared);

  /* The Traps line, from both ends. Every id in the document is generated and opaque, and no
     module in src/ contains the literal the schema sketch shows — because the day one does,
     something is comparing against it. */
  const termIds = remembered.termIds.reduce((all, list) => all.concat(list), []);
  const uniqueTermIds = new Set(termIds);
  /* Twenty is the guard against a vacuous pass, not the expected number: five classes on quarters
     and one on a single year-long term is 21, and `every` over an empty list is true. */
  check('every term id is generated and opaque: tm_ prefixed, unique, and never a label',
    termIds.length >= 20 && termIds.every(id => /^tm_[0-9a-z]{10}$/.test(id))
      && uniqueTermIds.size === termIds.length,
    termIds.length + ' term ids across ' + remembered.ids.length + ' classes, e.g. ' + termIds[0]);

  /* Static, and comment-stripped rather than a raw grep: src/classes.js's own explanation of this
     trap names the literal, as does the note in src/store.js, and a check that flagged those is
     one nobody could keep green. The strip is naive — block comments, then line comments — so the
     length assertion beside it is the guard against a stripper that ate a file and passed. */
  {
    const files = (await fs.readdir(path.join(ROOT, 'src'))).filter(f => f.endsWith('.js'));
    const offenders = [];
    let shortest = Infinity;
    for (const f of files) {
      const raw = await fs.readFile(path.join(ROOT, 'src', f), 'utf8');
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
      shortest = Math.min(shortest, code.replace(/\s+/g, '').length);
      if (/['"]Q[1-4]['"]/.test(code)) offenders.push(f);
    }
    /* index.html as well, which this sweep did not read until WO-1.6's maintenance pass. The seed
       structures are CHOSEN IN MARKUP — `data-preset="quarters"`, `data-term-preset="fullYear"` —
       so the markup is exactly where a term literal gets reintroduced, and `data-term-preset="Q1"`
       is the same defect as the string in a module. Quoted-literal only, like the pattern above:
       matching a bare Q1 would flag ordinary prose in a hint, and a check that fails on English is
       a check someone deletes. HTML comments come out first, because index.html explains this trap
       in a comment that names it. */
    const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
    const markup = html.replace(/<!--[\s\S]*?-->/g, '');
    if (/['"]Q[1-4]['"]/.test(markup)) offenders.push('index.html');
    check('no module in src/ and no attribute in index.html carries a term literal like the schema sketch\'s Q1',
      files.length >= 8 && offenders.length === 0 && shortest > 200 && markup.length > 2000,
      (files.length + 1) + ' files read, the smallest module holding ' + shortest
        + ' characters of code, markup ' + markup.length + ' characters'
        + (offenders.length ? ', OFFENDERS: ' + offenders.join(', ') : ''));
  }

  /*
    Archive, then delete. Two operations, and the difference between them is the whole of this work
    order's Trap 6: archive keeps every record and takes the class off the bar, delete destroys
    them. The fixture below is written through the store rather than through a screen because
    attendance and grades have no screen yet — WO-2.x and WO-3.x own those — and the point of it is
    that the confirm counts real records rather than printing zeroes.

    A neighbouring class gets records of its own, so "it deleted the right one" is falsifiable.
  */
  const victimId = remembered.ids[6];
  const neighbourId = remembered.ids[1];
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.students = [{ id:'s_v1', first:'Ada', last:'Probe' }, { id:'s_v2', first:'Bo', last:'Probe' }];
      /* Object cells, per WO-2.10 and docs/data-model.md: a fixture written as a bare string here
         would be the one place in this run that a stored string could come from, and the check
         further down that no cell in the document is a bare string would go red about this line
         rather than about the app. (Bare strings ARE tested — deliberately, in the migration and
         restore fixtures, where the point is that they get converted.) */
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-09', marks:{ s_v1:{ code:'A' } } });
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-10', marks:{} });
      /* A day the class did not meet. It is destroyed too, and it is NOT a meeting — everything in
         this app counts recorded meetings (plans/rotating-schedule.md), so the confirm names the
         two kinds separately and this record is what makes that falsifiable. */
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-11', exception:'dropped' });
      d.attendance.push({ classId:${JSON.stringify(neighbourId)}, date:'2026-09-09', marks:{ s_v1:{ code:'T' } } });
      d.assignments.push({ id:'a_v1', classId:${JSON.stringify(victimId)}, name:'Quiz', points:100 });
      d.assignments.push({ id:'a_n1', classId:${JSON.stringify(neighbourId)}, name:'Lab', points:50 });
      d.scores['a_v1'] = { s_v1:{ v:87 }, s_v2:{ v:null, flag:'missing' } };
      d.scores['a_n1'] = { s_v1:{ v:50 } };
      var victim = d.classes.filter(function(c){ return c.id === ${JSON.stringify(victimId)}; })[0];
      victim.roster = ['s_v1', 's_v2'];
    });
    await s.flush(); return 1; })()`);

  await clickSel('header [data-class-manage]');
  await clickSel('#classList .class-row:nth-child(7) [data-class-archive]');
  const archived = await evalJs('window.__cls()');
  check('archiving takes the class off the tab bar and destroys nothing at all',
    archived.tabNames.length === 6 && archived.tabNames.indexOf('Homeroom') === -1
      && archived.names.length === 7 && archived.archived[6] === true
      && archived.rows === 6 && archived.archivedRows === 1 && !archived.archivedHidden
      && archived.attendance === 4 && archived.assignments === 2 && archived.scoreColumns === 2,
    'tabs = ' + archived.tabNames.length + ', archived rows = ' + archived.archivedRows
      + ', attendance records still there = ' + archived.attendance);
  /* The card goes with the tab, and it goes NOW rather than at the next redraw — this is the
     literal picture src/shell.js's afterClassChange() comment describes: a class the teacher has
     just archived, still on the grid behind the dialog she archived it in. */
  const archivedHome = homeVsDoc(archived);
  check('and the card goes off the grid with it, while the dialog is still open',
    archivedHome.ok && archived.homeNames.indexOf('Homeroom') === -1, archivedHome.detail);
  await clickSel('#classArchivedList [data-class-restore]');
  const unarchived = await evalJs('window.__cls()');
  check('and restoring puts it back on the bar, in the place it had',
    JSON.stringify(unarchived.tabIds) === JSON.stringify(remembered.ids)
      && unarchived.archivedHidden && unarchived.archivedRows === 0,
    JSON.stringify(unarchived.tabNames));
  const unarchivedHome = homeVsDoc(unarchived);
  check('and its card comes back to the grid in that same place',
    unarchivedHome.ok && JSON.stringify(unarchived.homeIds) === JSON.stringify(remembered.ids),
    unarchivedHome.detail);

  /* Delete is offered on an archived row only, and that is the safety this design buys: getting a
     class out of the way costs one tap and nothing at all, and destroying a term of attendance
     costs an archive, a second tap, and a dialog that counts what goes. */
  const deleteOnActive = await evalJs(
    "document.querySelectorAll('#classList [data-class-delete]').length");
  check('no delete control on an active class — archive is how a class leaves the bar',
    deleteOnActive === 0, 'delete buttons in the active list = ' + deleteOnActive);

  /* And the teacher is told why, at the moment she is looking for the control that is not there.
     The full explanation lives in the Archived section, which ships `hidden` and stays hidden until
     something has been archived — so until WO-1.6's maintenance pass, the answer to "where is
     Delete?" was only readable by someone who had already stopped needing to ask. Asserted here
     precisely because nothing is archived at this point in the run. */
  const whyNoDelete = await evalJs(`(function(){
    var modal = document.getElementById('classesModal');
    var stowed = document.getElementById('classArchivedSection');
    var hints = Array.prototype.slice.call(modal.querySelectorAll('.class-hint'));
    var visible = hints.filter(function(p){ return p.offsetParent !== null && !stowed.contains(p); });
    var explains = visible.filter(function(p){ var t = p.textContent.toLowerCase();
      return t.indexOf('archiv') !== -1 && t.indexOf('delet') !== -1; });
    return { archivedSectionHidden: stowed.classList.contains('hidden'),
             visibleHints: visible.length, explaining: explains.length,
             text: explains.length ? explains[0].textContent.replace(/\\s+/g, ' ').trim() : '' };
    })()`);
  check('the reason an active class has no Delete is readable before anything has been archived',
    whyNoDelete.archivedSectionHidden === true && whyNoDelete.explaining >= 1,
    JSON.stringify(whyNoDelete));

  await clickSel('#classList .class-row:nth-child(7) [data-class-archive]');
  await clickSel('#classArchivedList [data-class-delete]');
  const confirmText = await evalJs(`(function(){ var m = document.getElementById('classDeleteModal');
    return { open: !!m && !m.classList.contains('hidden'),
             lead: (document.getElementById('classDeleteLead')||{}).textContent,
             facts: (document.getElementById('classDeleteFacts')||{}).textContent.replace(/\\s+/g,' '),
             button: (document.getElementById('classDeleteBtn')||{}).textContent }; })()`);
  check('the delete confirm names the class and counts the attendance, grades and roster it destroys',
    confirmText.open && /Homeroom/.test(confirmText.lead)
      && /cannot be undone/.test(confirmText.lead) && /archived/.test(confirmText.lead)
      && /2 recorded meetings/.test(confirmText.facts)
      && /1 day marked as not meeting/.test(confirmText.facts)
      && /1 assignment and 2 scores/.test(confirmText.facts)
      && /1 term/.test(confirmText.facts) && /2 students/.test(confirmText.facts)
      && confirmText.button === 'Delete Homeroom',
    confirmText.facts.slice(0, 240));

  /* Flushed first, so that `rev` is settled before the cancel: a debounced save still in the air
     would land between the two reads below and read as the cancel having written something. */
  const beforeCancel = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__cls(); })()');
  await clickSel('[data-class-delete-cancel]');
  const afterCancel = await evalJs(`(async function(){ var s = window.planbook.store;
    await s.flush();
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(s.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var live = window.__cls();
    live.confirmOpen = !document.getElementById('classDeleteModal').classList.contains('hidden');
    live.storedClasses = stored.classes.length;
    live.storedAttendance = stored.attendance.length;
    return live; })()`);
  check('cancelling the delete leaves the class and every record of it exactly as they were',
    afterCancel.confirmOpen === false && afterCancel.names.length === 7
      && afterCancel.attendance === beforeCancel.attendance
      && afterCancel.assignments === beforeCancel.assignments
      && afterCancel.scoreColumns === beforeCancel.scoreColumns
      && afterCancel.rev === beforeCancel.rev
      && afterCancel.storedClasses === 7 && afterCancel.storedAttendance === 4,
    'classes ' + afterCancel.names.length + ', attendance ' + afterCancel.attendance
      + ', rev ' + beforeCancel.rev + ' -> ' + afterCancel.rev
      + ' (nothing written, so rev cannot move)');

  await clickSel('#classArchivedList [data-class-delete]');
  await clickSel('[data-class-delete-confirm]');
  await new Promise(r => setTimeout(r, 400));
  const deleted = await evalJs(`(async function(){ var s = window.planbook.store; await s.flush();
    var d = s.getDoc(); var live = window.__cls();
    live.victimAttendance = d.attendance.filter(function(r){ return r.classId === ${JSON.stringify(victimId)}; }).length;
    live.neighbourAttendance = d.attendance.filter(function(r){ return r.classId === ${JSON.stringify(neighbourId)}; }).length;
    live.victimAssignments = d.assignments.filter(function(a){ return a.classId === ${JSON.stringify(victimId)}; }).length;
    live.victimScores = !!d.scores['a_v1'];
    live.neighbourScores = !!d.scores['a_n1'];
    live.confirmOpen = !document.getElementById('classDeleteModal').classList.contains('hidden');
    return live; })()`);
  check('deleting takes the class, its attendance, its assignments and their scores — and only those',
    deleted.names.length === 6 && deleted.names.indexOf('Homeroom') === -1
      && deleted.victimAttendance === 0 && deleted.victimAssignments === 0
      && deleted.victimScores === false && !deleted.confirmOpen
      && deleted.neighbourAttendance === 1 && deleted.neighbourScores === true
      && deleted.attendance === 1 && deleted.assignments === 1 && deleted.scoreColumns === 1,
    'classes ' + deleted.names.length + ', attendance left ' + deleted.attendance
      + ', assignments left ' + deleted.assignments + ', score columns left ' + deleted.scoreColumns);
  check('and both students stay — a student belongs to the school year, not to one class',
    deleted.students === 2, 'students in the document = ' + deleted.students);
  /*
    The grid after a delete, and this one is HONEST ABOUT BEING WEAKER than the five above it.
    Delete is offered on an ARCHIVED row only (src/classes.js), so the class whose record is being
    destroyed already has no card — the active list does not change, and dropping
    afterClassChange() from this branch of src/shell.js would not move anything on screen. So this
    asserts the invariant rather than the redraw: the grid must still agree with the document, and
    in particular must not have regained a card for a class that no longer exists. Making the
    redraw itself falsifiable here would need delete to be reachable on an active class, which is
    the safety WO-1.6 deliberately bought and is not a thing to add for a check's convenience.
  */
  const deletedHome = homeVsDoc(deleted);
  check('the grid still matches the document after a class is destroyed',
    deletedHome.ok && deleted.homeNames.indexOf('Homeroom') === -1, deletedHome.detail);

  /*
    The first-run header, which nothing above has seen: every class on this device belongs to the
    year that has been open all along, and a teacher opening Planbook for the first time sees
    neither a tab nor a term. An empty year is one year switch away — and the switch is worth
    driving for its own sake, because the class bar is refreshed from shell.js's year-switch chain
    rather than from inside year-picker.js, and a chain nothing exercises is a chain that goes stale
    the next time someone edits that file.
  */
  await evalJs("window.planbook.closeModal('classesModal');1");
  /* A year that genuinely has no classes, found by reading each stored record rather than by
     picking the first other key: the run has three years on the device by now and one of them is
     the migration fixture, which arrives holding a class. Choosing by name gave a year with a tab
     in it and failed this check for the wrong reason. */
  const emptyYear = await evalJs(`(async function(){ var s = window.planbook.store;
    var years = await s.listYears(), open = s.getDoc().year;
    for (var i = 0; i < years.length; i++) {
      if (years[i] === open) continue;
      var d = await s.readStoredDocument(years[i]);
      if (d && (!d.classes || d.classes.length === 0)) return years[i];
    }
    return ''; })()`);
  if (!emptyYear) {
    skip('a year with no classes says so on the bar, and offers the way to add the first one',
      'only one year exists on the device at this point in the run');
  } else {
    const homeYear = await evalJs('window.planbook.store.getDoc().year');
    await clickSel('[data-year-picker]');
    await clickSel('#yearList [data-year-switch=' + JSON.stringify(emptyYear) + ']');
    await new Promise(r => setTimeout(r, 800));
    const bare = await evalJs(`(function(){ var bar = document.getElementById('classTabBar');
      var add = bar.querySelector('.cls-tab-add');
      return { year: window.planbook.store.getDoc().year,
               tabs: bar.querySelectorAll('[data-class-tab]').length,
               emptyText: (bar.querySelector('.hdr-empty')||{}).textContent,
               addText: add ? add.textContent : '',
               dividerHidden: document.getElementById('headerDivider').classList.contains('hidden'),
               navButtons: document.getElementById('termNav').querySelectorAll('button').length,
               manageReachable: !!document.querySelector('#headerRightControls [data-class-manage]')
                 && !document.getElementById('headerRightControls').classList.contains('hidden'),
               selectedClass: window.planbook.classes.getSelectedClassId(),
               selectedTerm: window.planbook.classes.getSelectedTermId(),
               /* WO-1.10's third acceptance line, read off the same fixture: the year that has no
                  classes is also the fresh document its home screen has to be honest about. */
               homeCards: document.querySelectorAll('#homeGrid .class-card').length,
               homeGridHidden: document.getElementById('homeGrid').classList.contains('hidden'),
               homeEmptyShown: !document.getElementById('homeEmpty').classList.contains('hidden'),
               homeEmptyLead: (document.getElementById('homeEmptyLead')||{}).textContent.trim(),
               homeEmptySaid: (document.getElementById('homeEmptyClasses')||{}).textContent.trim().length,
               homeNoYearHidden: document.getElementById('homeEmptyNoYear').classList.contains('hidden'),
               homeEmptyRoute: !!document.querySelector('#homeEmpty [data-class-manage]')
                 && !document.getElementById('homeEmptyActions').classList.contains('hidden')
             }; })()`);
    check('a year with no classes says so on the bar, and offers the way to add the first one',
      bare.year === emptyYear && bare.tabs === 0 && bare.emptyText === 'No classes yet.'
        && bare.addText === 'Add a class' && bare.dividerHidden && bare.navButtons === 0
        && bare.manageReachable && bare.selectedClass === '' && bare.selectedTerm === '',
      JSON.stringify(bare));
    /* A grid that renders nothing and an empty state that says nothing are the same picture, so
       both halves are asserted: zero cards AND a sentence on screen AND the control that leads out
       of it. The no-school-year variant must be the one that stays hidden — there IS a year open
       here, it just has nothing in it, and saying otherwise would be a worse lie than saying
       nothing. */
    check('a fresh document shows a real empty state on the home screen, not blank cards',
      bare.homeCards === 0 && bare.homeGridHidden && bare.homeEmptyShown
        && bare.homeEmptyLead === 'No classes yet.' && bare.homeEmptySaid > 60
        && bare.homeNoYearHidden && bare.homeEmptyRoute,
      'cards = ' + bare.homeCards + ', empty state shown = ' + bare.homeEmptyShown
        + ', lead = ' + JSON.stringify(bare.homeEmptyLead) + ', ' + bare.homeEmptySaid
        + ' characters of explanation, way to the first class = ' + bare.homeEmptyRoute);
    await clickSel('[data-year-picker]');
    await clickSel('#yearList [data-year-switch=' + JSON.stringify(homeYear) + ']');
    await new Promise(r => setTimeout(r, 800));
    const backHome = await evalJs('window.__cls()');
    /* Read on the class GRID, which is where a year switch lands and where the tab strip carries no
       classes at all since WO-1.13. The year with no classes had no working surface to be on, so
       the app went home for it (src/shell.js's afterClassChange) and switching back leaves it
       there. So "that year's classes are back" is counted on the cards — and the bar's own repaint
       is still proved, by the term nav: refreshClassBar draws both halves of that row, and a
       year-switch chain that skipped it would leave the nav empty whichever view was up. */
    check('and switching back brings that year\'s classes and its open term back — the cards on the grid, the terms on the bar',
      backHome.homeIds.length === 6 && backHome.selectedClass === backHome.ids[1]
        && backHome.navLabels.length === 4,
      backHome.homeIds.length + ' cards and ' + backHome.navLabels.length + ' terms back on '
        + homeYear);

  /* ───────────────── the home screen ─────────────────
   *
   * WO-1.10's other three acceptance lines, and they sit INSIDE the classes section because this is
   * the only point in the run where the fixture they need exists: six ACTIVE classes, one of them
   * named with markup, nothing archived yet, and the checks above having just proved all six came
   * back out of IndexedDB rather than out of memory. The step immediately below archives one on
   * purpose, for the delete confirm and the touch pass, and takes the sixth card with it.
   *
   * These are the kinds of check this file already makes and no new ones — rendered geometry under
   * an emulated coarse pointer, and runtime state read back through the seam after a real click.
   * The work order forbids growing this script beyond re-pointing it, and measuring a new screen
   * with measurements that are already here is not that: "six classes fit on an iPad screen in
   * portrait without scrolling" is unreadable from a stylesheet by construction, which is the test
   * plans/verification-tooling.md applies to everything in this file.
   */
  console.log('\n--- the home screen ---');
  await evalJs("(function(){ ['classesModal','yearModal','aboutModal'].forEach(function(m){"
    + " window.planbook.closeModal(m); }); return 1; })()");

  const cards = await evalJs(`(function(){
    var grid = document.getElementById('homeGrid');
    var doc = window.planbook.store.getDoc();
    var active = doc.classes.filter(function(c){ return !c.archived; });
    var els = Array.prototype.slice.call(grid.querySelectorAll('.class-card'));
    return {
      count: els.length,
      active: active.length,
      names: els.map(function(c){ return (c.querySelector('.class-card-name')||{}).textContent; }),
      ids: els.map(function(c){ var b = c.querySelector('.class-card-open');
        return b ? b.getAttribute('data-class-tab') : null; }),
      activeIds: active.map(function(c){ return c.id; }),
      activeNames: active.map(function(c){ return c.name; }),
      /* Class names are teacher-typed and SIS-pasted; one of the six carries markup on purpose. */
      injected: grid.querySelectorAll('b, script, i').length,
      marked: els.filter(function(c){ return c.classList.contains('open'); })
        .map(function(c){ var b = c.querySelector('.class-card-open');
          return b ? b.getAttribute('data-class-tab') : null; }),
      current: els.filter(function(c){
        var b = c.querySelector('.class-card-open');
        return b && b.getAttribute('aria-current') === 'true'; }).length,
      selected: window.planbook.classes.getSelectedClassId(),
      /* The two slots, per card. The state slot was filled by WO-2.1 and says today's state; the
         signals slot is still reserved, empty of text AND of elements, and holding real height. A
         reserved slot with nothing in it and no height is a slot that reflows the grid the day it
         is filled, which is the failure WO-1.10's fourth acceptance line is actually about.

         inControl replaced a hook attribute at WO-1.13, when the card went back to being one
         control: the state line is a span INSIDE the button that opens the class, so what has to be
         true is that the line describing a class sits inside the tap that opens that class. A line
         rendered onto the wrong card, or loose in the grid, answers false.
         (No backticks in this comment: it is inside a template literal.) */
      slots: els.map(function(c){
        var s = c.querySelector('.class-card-state'), g = c.querySelector('.class-card-signals');
        var b = c.querySelector('.class-card-open');
        return { both: !!(s && g),
                 state: s ? s.textContent.trim() : '',
                 inControl: !!(s && b && b.contains(s)),
                 controls: c.querySelectorAll('button').length,
                 said: (g ? g.textContent : '').trim(),
                 kids: g ? g.children.length : 0,
                 h: (s ? s.getBoundingClientRect().height : 0)
                    + (g ? g.getBoundingClientRect().height : 0) };
      })
    }; })()`);

  check('every active class has exactly one card on the home screen, in the tab bar\'s own order',
    cards.count === 6 && cards.count === cards.active
      && JSON.stringify(cards.ids) === JSON.stringify(cards.activeIds)
      && JSON.stringify(cards.names) === JSON.stringify(cards.activeNames)
      && cards.injected === 0,
    cards.count + ' cards for ' + cards.active + ' active classes, elements injected into the grid = '
      + cards.injected + ' :: ' + JSON.stringify(cards.names));
  check('one card is marked as the open class, and it is the one src/classes.js resolves',
    cards.marked.length === 1 && cards.marked[0] === cards.selected && cards.current === 1,
    'marked = ' + JSON.stringify(cards.marked) + ', getSelectedClassId() = ' + cards.selected
      + ', aria-current = ' + cards.current);
  check('every card carries today\'s attendance state and the tap that fixes it, and still reserves Phase 3 and 4\'s space',
    cards.slots.length === 6 && cards.slots.every(s => s.both && s.state !== '' && s.inControl
      && s.controls === 1 && s.said === '' && s.kids === 0 && s.h > 0),
    JSON.stringify(cards.slots.map(s => Math.round(s.h) + 'px, state ' + JSON.stringify(s.state)
      + ', ' + s.controls + ' control(s), line inside it = ' + s.inControl
      + ', signals ' + (s.said === '' && s.kids === 0 ? 'reserved and empty'
        : 'HOLDS ' + JSON.stringify(s.said)))));

  /*
    One tap. Driven on a card that is NOT already the open one — tapping the open card would pass
    whether or not the tap does anything at all — and the answer is read from the same accessor the
    header uses, plus the header itself: the card and the tab are two views of one selection, and a
    tap that moved only the view it was on is the defect this asserts against.
  */
  const other = cards.ids.filter(id => id !== cards.selected)[0];
  await clickSel('#homeGrid .class-card-open[data-class-tab=' + JSON.stringify(other) + ']');
  const tapped = await evalJs(`(function(){
    var want = ${JSON.stringify(other)};
    var btn = document.querySelector('#homeGrid .class-card-open[data-class-tab=' + JSON.stringify(want) + ']');
    var card = btn ? btn.closest('.class-card') : null;
    var tab = document.querySelector('#classTabBar [data-class-tab=' + JSON.stringify(want) + ']');
    var view = document.getElementById('classView'), home = document.getElementById('homeView');
    return { selected: window.planbook.classes.getSelectedClassId(),
             pref: window.planbook.getPref('openClassId'),
             cardMarked: !!(card && card.classList.contains('open')),
             tabMarked: !!(tab && tab.classList.contains('active')),
             marked: document.querySelectorAll('#homeGrid .class-card.open').length,
             /* WO-1.13: the tap is navigation as well as a selection. */
             classView: !!(view && !view.classList.contains('hidden')),
             homeView: !!(home && !home.classList.contains('hidden')),
             dialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
               .filter(function(m){ return !m.classList.contains('hidden'); }).map(function(m){ return m.id; }),
             onScreen: (document.getElementById('attendanceClassName') || {}).textContent }; })()`);
  check('one tap on a card makes that class the open class, on the card AND on the header tab',
    tapped.selected === other && tapped.pref === other && tapped.cardMarked
      && tapped.tabMarked && tapped.marked === 1,
    JSON.stringify(tapped));
  /* The same tap, asked the other question — WO-1.13's first acceptance line, driven from the card
     rather than from the header. The class grid goes, that class's working surface arrives, and
     nothing opened a dialog to do it. The name on the surface is read too: a view that swapped but
     went on describing the class before it would satisfy every clause above this one. */
  check('and it swaps what is in <main> for that class\'s own screen, with no dialog opened',
    tapped.classView && !tapped.homeView && tapped.dialogs.length === 0
      && tapped.onScreen === cards.activeNames[cards.ids.indexOf(other)],
    'class view up = ' + tapped.classView + ', class grid up = ' + tapped.homeView
      + ', dialogs open = ' + JSON.stringify(tapped.dialogs) + ', the screen says '
      + JSON.stringify(tapped.onScreen) + ' for '
      + JSON.stringify(cards.activeNames[cards.ids.indexOf(other)]));

  /*
    Six classes on an iPad in portrait, without scrolling, at 44px.

    Metrics + touch emulation + a reload, in that order, because setEmulatedMedia does not reach
    `pointer` (tools/README.md trap 3) — and the coarse assertion below gates the measurement for
    the same reason the touch section's does: getting this wrong measures the desktop pass and
    reports green.

    THE INSTALL BANNER IS HIDDEN FOR THE MEASUREMENT AND PUT BACK, which is the one liberty taken
    here and it is the honest reading of the acceptance line rather than a way past it. That banner
    is on screen exactly while Planbook is NOT installed, and this claim is about an installed app
    on an iPad — where iOS does not evict the storage either, which is the whole reason the banner
    exists. A headless browser can never be installed, so leaving it up would measure ~200px of a
    strip that cannot be present in the situation being asserted. The backup nag is left exactly as
    the run left it and is reported in the detail, because that one CAN be on screen on an installed
    iPad and it is fair for it to have to fit.
  */
  /* Back to the class grid before the reload below, through the control a teacher taps. Two reasons
     and both are WO-1.13's: the cards cannot be measured while `#homeView` is hidden — they measure
     0x0, which is a green run that measured nothing — and the view is a preference now, so a reload
     taken from a class comes back on that class. Which is a fact this file asserts on purpose in the
     attendance section, and would otherwise trip over here. */
  await clickSel('#classTabBar [data-view-home]');
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  const portraitCoarse = await evalJs("matchMedia('(pointer: coarse)').matches");
  check('the emulated iPad-portrait pointer really is coarse (else the fit below is the desktop pass)',
    portraitCoarse === true, 'matchMedia = ' + portraitCoarse);
  const fit = await evalJs(`(function(){
    var banner = document.getElementById('installBanner');
    var wasShown = banner && !banner.classList.contains('hidden');
    if (wasShown) banner.classList.add('hidden');
    var grid = document.getElementById('homeGrid');
    var els = Array.prototype.slice.call(grid.querySelectorAll('.class-card'));
    var last = els.length ? els[els.length - 1].getBoundingClientRect() : null;
    var out = {
      cards: els.length,
      viewport: window.innerHeight,
      scrollH: document.documentElement.scrollHeight,
      lastBottom: last ? Math.round(last.bottom) : 0,
      columns: getComputedStyle(grid).gridTemplateColumns.split(/\\s+/).length,
      /* The CONTROLS on a card, not the card. The card is a container with a button in it, and
         measuring the container would report 44px about a box nobody taps — the WO-1.2 search-box
         defect exactly, arriving in a check rather than in a stylesheet. One per card since WO-1.13
         where WO-2.1 had two; the count below is asserted, so a card that grows a second control
         has to come back through here.
         (No backticks in this comment: it is inside a template literal.) */
      controls: grid.querySelectorAll('.class-card button').length,
      under44: Array.prototype.slice.call(grid.querySelectorAll('.class-card button'))
        .filter(function(c){ var r = c.getBoundingClientRect();
          return r.height < 44 || r.width < 44; }).length,
      nagUp: !document.getElementById('backupNag').classList.contains('hidden'),
      bannerWasUp: !!wasShown
    };
    if (wasShown) banner.classList.remove('hidden');
    return out; })()`);
  if (portraitCoarse !== true) {
    skip('six classes fit on an iPad screen in portrait without scrolling, at 44px+ targets',
      'the coarse pointer never engaged, so nothing below it can be trusted');
  } else {
    check('six classes fit on an iPad screen in portrait without scrolling, at 44px+ targets',
      fit.cards === 6 && fit.controls === 6 && fit.under44 === 0 && fit.lastBottom <= fit.viewport
        && fit.scrollH <= fit.viewport,
      fit.cards + ' cards in ' + fit.columns + ' column(s); last card ends at ' + fit.lastBottom
        + 'px of ' + fit.viewport + 'px, page is ' + fit.scrollH + 'px tall; '
        + fit.controls + ' controls on them, ' + fit.under44 + ' under 44px; backup nag on screen = ' + fit.nagUp
        + ', install banner hidden for the measurement = ' + fit.bannerWasUp);
  }
  /* Handed back as it was found. The touch section sets its own metrics later and the sections
     between here and it drive clicks by viewport coordinate, so a left-behind override would move
     every one of them without saying so. */
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));
  /* Back onto the class view for the archive below, for the reason given at the top of this
     section: the measurement above was taken on the grid, and the check under the archive is about
     what the SWITCHER shows once a class has left it. */
  await toClassView();
    await clickSel('header [data-class-manage]');
  }

  /* One class is left archived on purpose. The delete confirm has nothing to open from otherwise,
     and the touch section below has to be able to measure it. Flushed for the reason the reload
     above gives — that section reloads too, and an unflushed archive would arrive there as a
     missing fixture rather than as a failed check. */
  await clickSel('#classList .class-row:nth-child(5) [data-class-archive]');
  const leftover = await evalJs(`(async function(){ var live = window.__cls();
    window.planbook.closeModal('classesModal');
    await window.planbook.store.flush();
    return live; })()`);
  check('the archived section shows what is in it, and the bar shows what is left',
    leftover.archivedRows === 1 && leftover.rows === 5 && leftover.tabNames.length === 5
      && !leftover.archivedHidden,
    'active ' + leftover.rows + ', archived ' + leftover.archivedRows);
}

/* ───────────────── categories & weights (WO-3.1) ─────────────────
 *
 * The four acceptance lines of WO-3.1, as far as they can honestly be driven — and two of them
 * cannot be driven all the way here, which is stated rather than papered over. There is no grade
 * engine (WO-3.4), no assignments UI (WO-3.3) and no score grid (WO-3.5), so nothing in this app
 * renders a percentage for a student. What exists to be measured is the CATEGORIES: the total, the
 * warning that names it, the provisional verdict the later screens will read, and the fact that
 * two classes cannot interfere.
 *
 * Everything is driven through the controls a teacher touches — the Categories button on a manager
 * row, the real name and weight fields, the real Remove and its real confirm. The
 * window.planbook.categories seam is used only to READ, and specifically to read weightTotal() and
 * isProvisional(): a check that summed the weights itself would go green against a build where the
 * banner does its own arithmetic and the export WO-3.4 is going to consume says something else.
 *
 * What is NOT here and is owed to a human: a thumb on a 58px numeric field, whether iPadOS offers
 * the numeric keypad for `type="number"`, and whether the amber line is legible on a projector at
 * the back of a room. The touch section below measures the boxes; it cannot press them.
 */

console.log('\n--- categories & weights ---');

const catSeam = await evalJs("!!(window.planbook && window.planbook.categories"
  + " && typeof window.planbook.categories.weightTotal === 'function'"
  + " && typeof window.planbook.categories.isProvisional === 'function')");

if (!classesBooted || !classSeam || !catSeam) {
  skip('categories & weights: the starter set, the total that names itself, per-class isolation, and a removal that counts',
    classesBooted
      ? 'no window.planbook.categories seam on the page — it is kept deliberately for this file to read the weight arithmetic through, so its absence is a defect and not a stage of the build'
      : 'the app did not boot before this section');
} else {
  /* Everything this section reads off the SCREEN, in one page-side helper, so a check is one round
     trip and the reads cannot drift between checks. The document side is window.__cls() above,
     which already carries the per-class category names, weights, ids and totals. */
  const INSTALL_CAT_READER = `(function(){
    window.__cat = function(){
      var modal = document.getElementById('categoriesModal');
      var total = document.getElementById('categoryTotal');
      var list = document.getElementById('categoryList');
      var rows = Array.prototype.slice.call(list.querySelectorAll('.category-row'));
      return {
        open: !!modal && !modal.classList.contains('hidden'),
        stacked: !document.getElementById('classesModal').classList.contains('hidden'),
        className: (document.getElementById('categoriesClassName')||{}).textContent,
        names: rows.map(function(r){ return r.querySelector('.category-name-input').value; }),
        weights: rows.map(function(r){ return r.querySelector('.category-weight').value; }),
        ids: rows.map(function(r){ return r.querySelector('.category-name-input').getAttribute('data-category-id'); }),
        upDisabled: rows.map(function(r){ return r.querySelector('[data-category-move-up]').disabled; }),
        downDisabled: rows.map(function(r){ return r.querySelector('[data-category-move-down]').disabled; }),
        /* A category name is teacher-typed; one of them below is given markup on purpose. */
        injected: list.querySelectorAll('b, script, i').length,
        rowChildren: rows.reduce(function(n, r){ return n + r.querySelectorAll('b, script, i').length; }, 0),
        total: total ? total.textContent : '',
        warn: !!(total && total.classList.contains('warn')),
        error: (document.getElementById('categoryError')||{}).textContent,
        empty: !!list.querySelector('.class-empty'),
        confirmOpen: !document.getElementById('categoryRemoveModal').classList.contains('hidden'),
        confirmLead: (document.getElementById('categoryRemoveLead')||{}).textContent,
        confirmFacts: (document.getElementById('categoryRemoveFacts')||{}).textContent.replace(/\\s+/g,' '),
        confirmButton: (document.getElementById('categoryRemoveBtn')||{}).textContent
      };
    }; return 1; })()`;
  await evalJs(INSTALL_CAT_READER);

  /* Typing a weight, through the real field and the real delegated listener: setting `.value` and
     dispatching `input` is the path a keystroke takes, and shell.js reads the element rather than
     the event's provenance. Weights are set by INDEX because that is what a teacher does — the
     third row down — and the row order is itself asserted below. */
  const typeWeights = async (values) => {
    await evalJs(`(function(){ var rows = document.querySelectorAll('#categoryList .category-row');
      var want = ${JSON.stringify(values)};
      for (var i = 0; i < want.length && i < rows.length; i++) {
        if (want[i] === null) continue;
        var f = rows[i].querySelector('.category-weight');
        f.value = String(want[i]); f.dispatchEvent(new Event('input', { bubbles:true }));
      }
      return 1; })()`);
    await new Promise(r => setTimeout(r, 120));
  };
  const rowClassId = async (n) => await evalJs(
    `(function(){ var r = document.querySelectorAll('#classList .class-row')[${n - 1}];
      var b = r && r.querySelector('[data-category-manage]');
      return b ? b.getAttribute('data-category-manage') : ''; })()`);

  await clickSel('header [data-class-manage]');

  /*
    Row 1 is the class the backup section restored — written by a build older than this work order,
    so its `categories` key is absent entirely rather than empty. The editor has to survive that
    rather than throw on `cls.categories.length`, and the total line's answer has to be a sentence
    about there being nothing to weight rather than a confident "0%".
  */
  const bareId = await rowClassId(1);
  await clickSel('#classList .class-row:nth-child(1) [data-category-manage]');
  const bare = await evalJs('window.__cat()');
  const bareDoc = await evalJs('window.__cls()');
  check('a class stored with no categories at all opens the editor, says so, and does not print a total it cannot have',
    bare.open && bare.stacked && bare.empty && bare.names.length === 0 && bare.warn
      && /No categories yet/.test(bare.total) && !/0%/.test(bare.total)
      && bareDoc.provisional[bareDoc.ids.indexOf(bareId)] === true,
    JSON.stringify({ rows: bare.names.length, warn: bare.warn, total: bare.total }));
  /* And the manager row behind it says the same thing in a badge, which is the half of "visible,
     persistent" that is not inside the panel a teacher has to open to see it. */
  check('and the manager row behind it carries the warning too, in words rather than only in colour',
    bareDoc.rowWarnings[0] === 'no categories',
    'row badges = ' + JSON.stringify(bareDoc.rowWarnings));

  await clickSel('#categoriesModal [data-modal-close]');

  /*
    ACCEPTANCE LINE 1, driven on a class that arrived with the starter set: 40/35/25 produces no
    warning, and 40/35/20 warns and shows 95%.

    The fourth starter category is removed first, and that removal is itself the "nothing is filed
    under it" branch — no confirm, no dialog, gone on the tap. Three categories is what the
    acceptance line names, and getting to three through the real control is cheaper than a fixture.
  */
  const workingId = await rowClassId(2);
  await clickSel('#classList .class-row:nth-child(2) [data-category-manage]');
  const seeded = await evalJs('window.__cat()');
  const seededDoc = await evalJs('window.__cls()');
  const workingAt = seededDoc.ids.indexOf(workingId);
  check('a class created through the form arrives with a starter set that already totals 100, and no warning',
    seeded.open && seeded.names.length === 4 && !seeded.warn
      && /100%/.test(seeded.total) && !/⚠/.test(seeded.total)
      && seededDoc.weightTotals[workingAt] === 100
      && seededDoc.provisional[workingAt] === false
      && seededDoc.rowWarnings[1] === '',
    JSON.stringify(seeded.names) + ' at ' + JSON.stringify(seeded.weights)
      + ' :: ' + JSON.stringify(seeded.total));

  await clickSel('#categoryList .category-row:nth-child(4) [data-category-remove]');
  const dropped = await evalJs('window.__cat()');
  check('removing a category with nothing filed under it takes one tap and opens no dialog',
    dropped.names.length === 3 && !dropped.confirmOpen
      && JSON.stringify(dropped.names) === JSON.stringify(seeded.names.slice(0, 3)),
    JSON.stringify(dropped.names) + ', confirm opened = ' + dropped.confirmOpen);

  await typeWeights([40, 35, 25]);
  const balanced = await evalJs('window.__cat()');
  const balancedDoc = await evalJs('window.__cls()');
  check('weights of 40/35/25 produce no warning at all',
    !balanced.warn && /100%/.test(balanced.total) && !/⚠/.test(balanced.total)
      && balancedDoc.weightTotals[workingAt] === 100
      && balancedDoc.provisional[workingAt] === false
      && balancedDoc.rowWarnings[1] === '',
    JSON.stringify(balanced.weights) + ' :: ' + JSON.stringify(balanced.total)
      + ', row badge = ' + JSON.stringify(balancedDoc.rowWarnings[1]));

  await typeWeights([null, null, 20]);
  const short = await evalJs('window.__cat()');
  const shortDoc = await evalJs('window.__cls()');
  /* The number, not the verdict: "shows 95%" is the acceptance line, and a banner reading "these
     weights are invalid" would satisfy every other clause here. Asserted as a substring of the
     line the teacher reads, and the row badge is asserted to carry the same figure — two surfaces,
     one arithmetic. */
  check('and 40/35/20 warns, naming the actual total as 95% rather than calling it invalid',
    short.warn && /95%/.test(short.total) && /provisional/.test(short.total)
      && shortDoc.weightTotals[workingAt] === 95
      && shortDoc.provisional[workingAt] === true
      && shortDoc.rowWarnings[1] === 'weights 95%',
    JSON.stringify(short.total) + ' :: row badge ' + JSON.stringify(shortDoc.rowWarnings[1]));
  /* Nothing was blocked on the way — the work order's own words are "don't block them, tell
     them", so an error line or a disabled control here would be the defect rather than the fix. */
  const notBlocked = await evalJs(`(function(){ var m = document.getElementById('categoriesModal');
    return { error: (document.getElementById('categoryError')||{}).textContent,
             disabled: m.querySelectorAll('button[disabled], input[disabled]').length,
             enabledFields: m.querySelectorAll('input:not([disabled])').length }; })()`);
  /* `disabled` is reported rather than asserted at zero: the two disabled controls in that panel
     are the first row's ↑ and the last row's ↓, which are the ENDS OF THE LIST and have nothing to
     do with the total. Every field is asserted live, which is the claim. */
  check('a wrong total blocks nothing: no error line, and every field still live',
    notBlocked.error === '' && notBlocked.enabledFields === 6,
    JSON.stringify(notBlocked) + ' (the disabled pair are the reorder arrows at the ends of the list)');

  /*
    ACCEPTANCE LINE 3, and the fixture is the state the two checks above just produced: this class
    is on three categories totalling 95, and its neighbours are still on the untouched starter four
    totalling 100. Read off the document for every class at once, so "no interference" is a claim
    about all six rather than about the one that was looked at.
  */
  const others = shortDoc.ids
    .map((id, i) => ({ id, i }))
    .filter((c) => c.i !== workingAt && shortDoc.categories[c.i] > 0);
  check('two classes carry different category sets without interference, and the rest are untouched',
    shortDoc.categories[workingAt] === 3 && shortDoc.weightTotals[workingAt] === 95
      && others.length >= 4
      && others.every((c) => shortDoc.categories[c.i] === 4 && shortDoc.weightTotals[c.i] === 100)
      && others.every((c) => JSON.stringify(shortDoc.categoryNames[c.i])
        === JSON.stringify(seededDoc.categoryNames[c.i])),
    'edited class = ' + shortDoc.categories[workingAt] + ' categories at '
      + shortDoc.weightTotals[workingAt] + '%; the other ' + others.length + ' = '
      + JSON.stringify(others.map((c) => shortDoc.categories[c.i] + '@' + shortDoc.weightTotals[c.i])));
  /* Every category id in the document is generated and opaque, the same claim WO-1.6 makes about
     term ids and for the same reason: an id that means something is an id somebody eventually
     parses. Fifteen is the guard against a vacuous pass rather than the expected number: four
     classes on the starter four plus the edited one on three is nineteen at this point in the run,
     and `every` over an empty list is true. */
  const catIds = shortDoc.categoryIds.reduce((all, list) => all.concat(list), []);
  check('every category id is generated and opaque: k_ prefixed, unique, and never a name',
    catIds.length >= 15 && catIds.every((id) => /^k_[0-9a-z]{10}$/.test(id))
      && new Set(catIds).size === catIds.length,
    catIds.length + ' category ids across ' + shortDoc.ids.length + ' classes, e.g. ' + catIds[0]);

  /*
    Rename, reorder, and add — the rest of the first deliverable, on the class that is open. The
    name carries markup, because a category is named by a teacher and "Labs <b>only</b>" has to
    stay those characters rather than become bold.
  */
  await evalJs(`(function(){ var f = document.querySelectorAll('#categoryList .category-name-input')[1];
    f.value = 'Quizzes <b>and</b> exit tickets'; f.dispatchEvent(new Event('input', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 120));
  const renamedCat = await evalJs('window.__cat()');
  const renamedCatDoc = await evalJs('window.__cls()');
  check('a category renames as it is typed, and a name containing markup stays text',
    renamedCatDoc.categoryNames[workingAt][1] === 'Quizzes <b>and</b> exit tickets'
      && renamedCat.injected === 0 && renamedCat.rowChildren === 0
      && renamedCatDoc.weightTotals[workingAt] === 95,
    'stored ' + JSON.stringify(renamedCatDoc.categoryNames[workingAt][1])
      + ', elements injected into the list = ' + renamedCat.injected);

  await clickSel('#categoryList .category-row:nth-child(3) [data-category-move-up]');
  const reordered = await evalJs('window.__cat()');
  const reorderedDoc = await evalJs('window.__cls()');
  check('the up control moves a category one place earlier, in the document and on screen together',
    JSON.stringify(reorderedDoc.categoryIds[workingAt])
      === JSON.stringify([renamedCatDoc.categoryIds[workingAt][0],
        renamedCatDoc.categoryIds[workingAt][2], renamedCatDoc.categoryIds[workingAt][1]])
      && JSON.stringify(reordered.ids) === JSON.stringify(reorderedDoc.categoryIds[workingAt])
      && reordered.upDisabled[0] === true && reordered.downDisabled[2] === true
      && reorderedDoc.weightTotals[workingAt] === 95,
    JSON.stringify(reordered.names) + ' at ' + JSON.stringify(reordered.weights));

  await clickSel('#categoriesModal [data-category-add]');
  const added = await evalJs('window.__cat()');
  const addedDoc = await evalJs('window.__cls()');
  /* A new category arrives at 0 and NOT at "whatever makes the total work". Adding one must not
     silently reweight the categories already there — see src/categories.js's addCategory() — so
     the total is still 95 and the banner still says 95. */
  check('a category added arrives at 0% and changes no other weight, so the total does not move',
    added.names.length === 4 && added.weights[3] === '0'
      && addedDoc.weightTotals[workingAt] === 95 && added.warn && /95%/.test(added.total)
      && JSON.stringify(addedDoc.categoryWeights[workingAt].slice(0, 3))
        === JSON.stringify(reorderedDoc.categoryWeights[workingAt]),
    JSON.stringify(added.weights) + ' :: ' + JSON.stringify(added.total));

  /*
    And back to 100 the other way, which is the crossing the banner has to make in the direction
    that matters most: a teacher who has just fixed it has to be told she has.

    THE NUMBERS ARE THE FLOATING-POINT CASE BALANCE_EPSILON EXISTS FOR, and they were chosen by
    searching for a set rather than guessed: 40.1 + 34.7 + 25.2 + 0 is exactly 100 in decimal and
    100.00000000000001 in IEEE-754, so a `=== 100` in isBalanced() calls a correct class
    provisional. The first draft of this check used 12.5 + 87.5, which sums to 100 EXACTLY in
    binary — it went green against the strict-equality mutation and proved nothing. That is worth
    knowing about: this defect appears for some decimal sets and not others, and never for the
    round numbers anyone reaches for first.
  */
  await typeWeights([40.1, 34.7, 25.2, 0]);
  const fixed = await evalJs('window.__cat()');
  const fixedDoc = await evalJs('window.__cls()');
  check('weights that are right only in decimal — 40.1 + 34.7 + 25.2 — are called right, and the warning clears',
    !fixed.warn && /100%/.test(fixed.total) && !/⚠/.test(fixed.total)
      && fixedDoc.provisional[workingAt] === false
      && fixedDoc.rowWarnings[1] === ''
      && fixedDoc.weightTotals[workingAt] !== 100,
    JSON.stringify(fixedDoc.categoryWeights[workingAt]) + ' sums to '
      + fixedDoc.weightTotals[workingAt] + ' :: ' + JSON.stringify(fixed.total));
  /* Stored exactly as typed, which is the header's first decision: nothing clamps, rounds or
     repairs a number a teacher entered. 0 is a real weight — it is how a category stops counting
     without its work being destroyed — and it is not silently deleted or turned into a removal. */
  check('a weight is stored exactly as it was typed, decimals and a deliberate zero included',
    fixedDoc.categoryWeights[workingAt].every((w) => typeof w === 'number')
      && JSON.stringify(fixedDoc.categoryWeights[workingAt]) === JSON.stringify([40.1, 34.7, 25.2, 0])
      && fixedDoc.categories[workingAt] === 4,
    JSON.stringify(fixedDoc.categoryWeights[workingAt]));

  /*
    THE REMOVAL WARNING — the third deliverable, and the one place this feature destroys anything.
    The fixture is written through the store because there is no assignment screen yet (WO-3.3 owns
    that), and its point is that the confirm counts real records rather than printing zeroes. A
    neighbouring category gets an assignment of its own, so "it removed the right one" is
    falsifiable.
  */
  const victimCat = fixedDoc.categoryIds[workingAt][0];
  const bystanderCat = fixedDoc.categoryIds[workingAt][1];
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.assignments.push({ id:'a_k1', classId:${JSON.stringify(workingId)},
        categoryId:${JSON.stringify(victimCat)}, name:'Unit 1 test', points:100 });
      d.assignments.push({ id:'a_k2', classId:${JSON.stringify(workingId)},
        categoryId:${JSON.stringify(victimCat)}, name:'Unit 2 test', points:50 });
      d.assignments.push({ id:'a_k3', classId:${JSON.stringify(workingId)},
        categoryId:${JSON.stringify(bystanderCat)}, name:'Pop quiz', points:10 });
      /* Object cells, per docs/data-model.md — never a bare number. */
      d.scores['a_k1'] = { s_v1:{ v:87 }, s_v2:{ v:null, flag:'missing' } };
      d.scores['a_k2'] = { s_v1:{ v:44 } };
      d.scores['a_k3'] = { s_v1:{ v:9 } };
    });
    await s.flush(); return 1; })()`);
  /* Re-rendered through the real control rather than by calling the renderer: the Remove button's
     aria-haspopup is set per row from what is filed under it, and a row drawn before the fixture
     existed would still be promising no dialog. */
  await clickSel('#categoriesModal [data-modal-close]');
  await clickSel('#classList .class-row:nth-child(2) [data-category-manage]');
  await clickSel('#categoryList .category-row:nth-child(1) [data-category-remove]');
  const warned = await evalJs('window.__cat()');
  check('removing a category that holds work warns first, and counts the assignments and scores it takes',
    warned.confirmOpen && /2 assignments and 3 scores/.test(warned.confirmFacts)
      && /cannot be undone/.test(warned.confirmLead) && /weight to 0/.test(warned.confirmLead)
      && /Remove /.test(warned.confirmButton),
    JSON.stringify(warned.confirmFacts.slice(0, 200)) + ' :: ' + JSON.stringify(warned.confirmButton));

  const beforeCatCancel = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__cls(); })()');
  await clickSel('[data-category-remove-cancel]');
  const afterCatCancel = await evalJs(`(async function(){ await window.planbook.store.flush();
    var live = window.__cls(); var s = window.planbook.store.getDoc();
    live.catConfirmOpen = !document.getElementById('categoryRemoveModal').classList.contains('hidden');
    live.assignmentIds = s.assignments.map(function(a){ return a.id; });
    live.scoreKeys = Object.keys(s.scores);
    return live; })()`);
  check('cancelling the removal leaves the category, its assignments and its scores exactly as they were',
    afterCatCancel.catConfirmOpen === false
      && afterCatCancel.categories[workingAt] === beforeCatCancel.categories[workingAt]
      && afterCatCancel.rev === beforeCatCancel.rev
      && afterCatCancel.assignmentIds.indexOf('a_k1') >= 0
      && afterCatCancel.scoreKeys.indexOf('a_k1') >= 0,
    'categories ' + afterCatCancel.categories[workingAt] + ', rev ' + beforeCatCancel.rev
      + ' -> ' + afterCatCancel.rev + ' (nothing written, so rev cannot move)');

  await clickSel('#categoryList .category-row:nth-child(1) [data-category-remove]');
  await clickSel('[data-category-remove-confirm]');
  await new Promise(r => setTimeout(r, 300));
  const removed = await evalJs(`(async function(){ var s = window.planbook.store; await s.flush();
    var d = s.getDoc(); var live = window.__cls();
    live.assignmentIds = d.assignments.map(function(a){ return a.id; });
    live.scoreKeys = Object.keys(d.scores);
    live.catConfirmOpen = !document.getElementById('categoryRemoveModal').classList.contains('hidden');
    return live; })()`);
  check('confirming takes the category, the assignments filed under it and their scores — and only those',
    removed.categories[workingAt] === 3 && !removed.catConfirmOpen
      && removed.categoryIds[workingAt].indexOf(victimCat) === -1
      && removed.categoryIds[workingAt].indexOf(bystanderCat) >= 0
      && removed.assignmentIds.indexOf('a_k1') === -1
      && removed.assignmentIds.indexOf('a_k2') === -1
      && removed.assignmentIds.indexOf('a_k3') >= 0
      && removed.scoreKeys.indexOf('a_k1') === -1 && removed.scoreKeys.indexOf('a_k2') === -1
      && removed.scoreKeys.indexOf('a_k3') >= 0,
    'categories left ' + removed.categories[workingAt] + ', assignments left '
      + JSON.stringify(removed.assignmentIds) + ', score columns left '
      + JSON.stringify(removed.scoreKeys));
  /* And the total followed the removal down, which is the other half of "recomputed immediately":
     40.1 went with the category, so the class is at 59.9 and the banner and the row badge both say
     so without anything being reopened. Compared with a tolerance rather than to 59.9 exactly,
     because 34.7 + 25.2 is 59.900000000000006 — the same arithmetic BALANCE_EPSILON is about, and
     the reason the two surfaces print through one formatter rather than two. */
  const afterRemovalScreen = await evalJs('window.__cat()');
  check('and the total recomputed the moment the category left, on the banner and on the row behind it',
    Math.abs(removed.weightTotals[workingAt] - 59.9) < 0.005 && afterRemovalScreen.warn
      && /59\.9%/.test(afterRemovalScreen.total)
      && removed.rowWarnings[1] === 'weights 59.9%',
    JSON.stringify(afterRemovalScreen.total) + ' :: row badge '
      + JSON.stringify(removed.rowWarnings[1]));

  /* The fixture comes back out, so the sections after this one see the document they expect. */
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.assignments = d.assignments.filter(function(a){ return a.id !== 'a_k3'; });
      delete d.scores['a_k3'];
    });
    await s.flush(); return 1; })()`);

  /*
    A full reload. Weights are the setting a whole term of grades is computed from, so "it was in
    the document" is not the claim — the claim is that it came back out of IndexedDB, and that the
    warning a teacher left on screen is the warning she finds when she opens the app again. Flushed
    first, for the reason the classes section states at length: CDP tears the execution context
    down without waiting for a debounced write.
  */
  await evalJs("window.planbook.closeModal('categoriesModal');"
    + "window.planbook.closeModal('classesModal');1");
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const catBoot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  await evalJs(INSTALL_CAT_READER);
  const reopened = await evalJs('window.__cls()');
  check('the weights survive a reload, and the class comes back provisional because it still is',
    catBoot && JSON.stringify(reopened.categoryWeights[workingAt]) === JSON.stringify([34.7, 25.2, 0])
      && Math.abs(reopened.weightTotals[workingAt] - 59.9) < 0.005
      && reopened.provisional[workingAt] === true
      && reopened.categoryNames[workingAt][1] === 'Quizzes <b>and</b> exit tickets',
    catBoot ? JSON.stringify(reopened.categoryWeights[workingAt]) + ' for '
      + JSON.stringify(reopened.categoryNames[workingAt])
      : 'the loading screen never came down');
}

/* ───────────────── letter grades (WO-3.2) ─────────────────
 *
 * The four acceptance lines of WO-3.2. Three of them are driven entirely through the controls a
 * teacher touches — the door in the class manager, the subject pills, the real letter and boundary
 * fields, the real reorder arrows and Remove — and the fourth (`there is no rounding code anywhere`)
 * is a grep, made in tools/wo-sweep.mjs § 10 rather than measured here.
 *
 * That sentence was wrong when this section was written, and the scar is worth keeping: it said the
 * grep was "made in tools/wo-sweep.mjs" at a point when the sweep had no rounding check at all. The
 * acceptance line had been settled by hand, once, in the dispatch that built this — so the record
 * claimed a standing guard where there was a one-time reading, and the next person to add a "round
 * to nearest whole percent" option would have been told by two files that something was watching.
 * The check now exists, which is the only reason this reference is allowed to stand.
 *
 * WHY THE MAPPING IS READ THROUGH THE SEAM. Nothing in this app displays a grade: there is no grade
 * engine (WO-3.4), no assignment UI (WO-3.3) and no score grid (WO-3.5), and WO-3.2 explicitly
 * forbids building a preview over student data to demonstrate the mapping with. So "89.5 is an A and
 * 89.49 is an A−" is asked of window.planbook.letterScale.letterFor() after the boundary has been
 * typed into the real field — which is also the only way to tell a build where the ranges on screen
 * come out of the exported mapping from one where the panel does its own arithmetic and the export
 * WO-3.4 is going to import says something else. A check that banded the percentage itself would
 * agree with itself perfectly and prove nothing.
 *
 * NO BOUNDARY IS WRITTEN DOWN IN THIS FILE except the ones this section types on purpose. The seeded
 * scale is compared against what src/store.js put in the document, because 90/80/70 belongs in seed
 * data and nowhere else — a harness asserting `93` would be a second copy of the school's grading
 * policy living in a tool.
 *
 * What is NOT here and is owed to a human: a thumb on a 64px letter field and a 66px boundary field
 * side by side, whether iPadOS offers the numeric keypad for the boundary, and whether "never
 * reached" reads as amber rather than as an error from the back of a room. The touch section below
 * measures the boxes; it cannot press them.
 */

console.log('\n--- letter grades ---');

const scaleSeam = await evalJs("!!(window.planbook && window.planbook.letterScale"
  + " && typeof window.planbook.letterScale.letterFor === 'function'"
  + " && typeof window.planbook.letterScale.scaleFaults === 'function'"
  + " && typeof window.planbook.letterScale.scaleForClass === 'function')");

if (!classesBooted || !classSeam || !scaleSeam) {
  skip('letter grades: the seeded bands and their derived ranges, an out-of-order band caught in the editor, a boundary of 89.5, and a per-class override',
    classesBooted
      ? 'no window.planbook.letterScale seam on the page — it is kept deliberately for this file to read the mapping through, so its absence is a defect and not a stage of the build'
      : 'the app did not boot before this section');
} else {
  /* Everything this section reads off the screen and out of the document, in one page-side helper,
     so a check is one round trip and the reads cannot drift between checks. The document half comes
     through the module's own exports rather than being re-derived here — see the note above. */
  const INSTALL_SCALE_READER = `(function(){
    window.__scale = function(){
      var modal = document.getElementById('letterScaleModal');
      var list = document.getElementById('bandList');
      var note = document.getElementById('scaleNote');
      var subjects = document.getElementById('scaleSubjects');
      var override = document.getElementById('scaleOverride');
      var rows = Array.prototype.slice.call(list.querySelectorAll('.band-row'));
      var pills = Array.prototype.slice.call(subjects.querySelectorAll('[data-scale-subject]'));
      var s = window.planbook.letterScale;
      var doc = window.planbook.store.getDoc();
      var docScale = s.letterScaleOf(doc);
      return {
        open: !!modal && !modal.classList.contains('hidden'),
        stacked: !document.getElementById('classesModal').classList.contains('hidden'),
        subjects: pills.map(function(p){ return p.textContent; }),
        subjectIds: pills.map(function(p){ return p.getAttribute('data-scale-subject'); }),
        active: pills.map(function(p){ return p.classList.contains('active'); }),
        pressed: pills.map(function(p){ return p.getAttribute('aria-pressed'); }),
        overrideText: override.textContent.replace(/\\s+/g, ' ').trim(),
        overrideOn: !!override.querySelector('[data-scale-override-on]'),
        overrideOff: !!override.querySelector('[data-scale-override-off]'),
        /* A letter is a field on an editable row and a span on an inherited one, which is the
           read-only half of the per-class override rather than a second rendering of the list. */
        letters: rows.map(function(r){ var f = r.querySelector('.band-letter-input');
          return f ? f.value : (r.querySelector('.band-letter')||{}).textContent; }),
        mins: rows.map(function(r){ var f = r.querySelector('.band-min'); return f ? f.value : null; }),
        ranges: rows.map(function(r){ return (r.querySelector('.band-range')||{}).textContent; }),
        rangeWarn: rows.map(function(r){ var c = r.querySelector('.band-range');
          return !!(c && c.classList.contains('warn')); }),
        inherited: rows.filter(function(r){ return r.classList.contains('inherited'); }).length,
        fields: list.querySelectorAll('input').length,
        /* A letter is teacher-typed; one of them below is given markup on purpose. */
        injected: list.querySelectorAll('b, script, i').length,
        note: note ? note.textContent : '',
        warn: !!(note && note.classList.contains('warn')),
        empty: !!list.querySelector('.class-empty'),
        addHidden: document.getElementById('bandAddRow').classList.contains('hidden'),
        docLetters: docScale.map(function(b){ return b.letter; }),
        docMins: docScale.map(function(b){ return b.min; }),
        faults: s.scaleFaults(docScale),
        classIds: doc.classes.map(function(c){ return c.id; }),
        classNames: doc.classes.map(function(c){ return c.name; }),
        classArchived: doc.classes.map(function(c){ return !!c.archived; }),
        classOwn: doc.classes.map(function(c){ return s.hasOwnScale(c); }),
        /* What the field actually HOLDS, not a boolean about it. null is the documented sentinel for
           "use the document default", an array is an override, and undefined is a class stored by a
           build older than this work order — the restored class in row 1 of the manager is exactly
           that, and a check asserting strict equality with null for every other class would fail on
           it for a reason that has nothing to do with the claim. Distinguishing them is also the
           only way to assert that turning an override OFF writes the sentinel rather than an empty
           array. (No backticks in this comment: it is inside a template literal.) */
        classScaleKind: doc.classes.map(function(c){
          return c.letterScale === null ? 'null'
            : (Array.isArray(c.letterScale) ? 'array' : typeof c.letterScale); }),
        classTopMin: doc.classes.map(function(c){ var eff = s.scaleForClass(doc, c);
          return eff.length ? eff[0].min : null; }),
        rev: doc.rev
      };
    }; return 1; })()`;
  await evalJs(INSTALL_SCALE_READER);

  /* Typing a boundary or a letter, through the real field and the real delegated listener: setting
     `.value` and dispatching `input` is the path a keystroke takes, and shell.js reads the element
     rather than the event's provenance. By ROW INDEX, because that is what a teacher does — the
     second row down — and because a band deliberately has no id (src/letter-scale.js's decision 3). */
  const typeBand = async (index, field, value) => {
    await evalJs(`(function(){
      var sel = ${JSON.stringify(field)} === 'min' ? '.band-min' : '.band-letter-input';
      var row = document.querySelectorAll('#bandList .band-row')[${index}];
      var f = row && row.querySelector(sel);
      if (!f) return 0;
      f.value = ${JSON.stringify(String(value))};
      f.dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 120));
  };
  /* What the app makes of a percentage, asked of the exported mapping against the scale that applies
     — the document's, or one class's. '(none)' rather than null so a detail line says which. */
  const letterAt = async (pct, classId) => await evalJs(`(function(){
    var s = window.planbook.letterScale; var d = window.planbook.store.getDoc();
    var want = ${JSON.stringify(classId || '')};
    var cls = want ? d.classes.filter(function(c){ return c.id === want; })[0] : null;
    var out = s.letterFor(${JSON.stringify(pct)}, cls ? s.scaleForClass(d, cls) : s.letterScaleOf(d));
    return out === null ? '(none)' : out; })()`);

  /* Nothing above this is guaranteed to have left the screen clear — the categories section closes
     its own panels, and a section that skipped left whatever it had open. */
  await evalJs("['categoryRemoveModal','categoriesModal','termsModal','classesModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); 1");

  await clickSel('header [data-class-manage]');
  await clickSel('#classesModal [data-letter-scale]');
  const seededScale = await evalJs('window.__scale()');
  /*
    THE DOOR, AND THE SEED. The panel opens over the class manager (src/modal.js keeps a stack, so
    Escape closes this and leaves that open) with the bands src/store.js seeded — compared against
    the document rather than against numbers typed in here, for the reason in this section's header.
  */
  check('the letter-scale editor opens over the class manager and shows the bands the document holds',
    seededScale.open && seededScale.stacked
      && seededScale.letters.length === seededScale.docLetters.length
      && seededScale.letters.length >= 5
      && JSON.stringify(seededScale.letters) === JSON.stringify(seededScale.docLetters)
      && JSON.stringify(seededScale.mins) === JSON.stringify(seededScale.docMins.map(String))
      && seededScale.fields === seededScale.letters.length * 2,
    seededScale.letters.length + ' bands: ' + JSON.stringify(seededScale.letters) + ' at '
      + JSON.stringify(seededScale.mins));
  /* And it is in order with no gap, which is the state a fresh document has to arrive in: a teacher
     who has made no decision yet must not be greeted by a warning. */
  check('a seeded scale is called clean: nothing unreachable, no gap at the bottom, and no warning',
    !seededScale.warn && !/⚠/.test(seededScale.note)
      && seededScale.faults.unreachable.length === 0 && seededScale.faults.gapBelow === null
      && seededScale.faults.reachable === seededScale.faults.bands
      && /exactly one letter/.test(seededScale.note),
    JSON.stringify(seededScale.faults) + ' :: ' + JSON.stringify(seededScale.note));

  /*
    DELIVERABLE 4 — the derived range on every row, which is what makes a gap or an overlap visible
    without a validator. The expected text is built HERE from the document's own boundaries, so the
    check is that the panel derived the upper bound from the band above it: the top band runs up with
    no ceiling, and every other band stops where the one above it starts.
  */
  const wantRanges = seededScale.docMins.map((min, i) => i === 0
    ? min + '% and up'
    : min + '% up to ' + seededScale.docMins[i - 1] + '%');
  check('every band shows the range it works out to, derived from the band above rather than stored',
    JSON.stringify(seededScale.ranges) === JSON.stringify(wantRanges)
      && seededScale.rangeWarn.every((w) => w === false),
    JSON.stringify(seededScale.ranges.slice(0, 4)) + ' … expected '
      + JSON.stringify(wantRanges.slice(0, 4)));

  /*
    ACCEPTANCE LINE 3, in the direction that is actually expressible. An INTERIOR GAP IS NOT: the
    upper bound is derived, so two bands cannot leave a hole between them (src/letter-scale.js's
    header argues it at length). What is expressible is a band nothing can reach — and typing the
    work order's own 89.5 into the A boundary while A− still sits at 90 is exactly that, which is why
    this fixture is the first half of acceptance line 1 rather than a second one.
  */
  await typeBand(0, 'min', 89.5);
  const outOfOrder = await evalJs('window.__scale()');
  check('a band the list can never reach is caught in the editor: named in the note, and flagged on its own row',
    outOfOrder.warn && JSON.stringify(outOfOrder.faults.unreachable) === '[1]'
      && outOfOrder.rangeWarn[1] === true && /never reached/.test(outOfOrder.ranges[1])
      && outOfOrder.note.indexOf(outOfOrder.docLetters[1]) >= 0
      && /never be reached/.test(outOfOrder.note)
      && outOfOrder.rangeWarn[0] === false,
    JSON.stringify(outOfOrder.note) + ' :: row 2 range ' + JSON.stringify(outOfOrder.ranges[1]));
  /*
    And the mapping AGREES with the warning rather than quietly working around it. A percentage
    between the two boundaries is the band BELOW the stranded one, because nothing sorts the list to
    be helpful — if letterFor() sorted, this scale would look fine and the editor's warning would be
    a warning about nothing.

    THE THIRD PROBE IS THE ONLY ONE THAT CATCHES A SORT, and the first draft of this check did not
    have it: at 89.4 and 89.6 a sorted scale and an unsorted one give the SAME answers, because
    reordering A above A− changes nothing below 90. Mutating letterFor() to sort descending turned
    nothing red at all. A percentage of 92 is where the two builds disagree — the list says A, sorted
    says A− — which is the whole of "the order is the rule".
  */
  const skipped = await letterAt(89.4);
  const aboveBoth = await letterAt(92);
  check('and the mapping skips the unreachable band rather than sorting the scale behind the teacher',
    skipped === outOfOrder.docLetters[2] && await letterAt(89.6) === outOfOrder.docLetters[0]
      && aboveBoth === outOfOrder.docLetters[0],
    '89.4 is ' + skipped + ', not ' + outOfOrder.docLetters[1]
      + '; 89.6 is ' + await letterAt(89.6) + '; 92 is ' + aboveBoth + ' — the first band in the '
      + 'list, which is what a build that sorted would get wrong');

  /*
    ACCEPTANCE LINE 1. A− goes to 89 — below the new A boundary and above the band under it — which
    is the scale the acceptance line describes, and the warning clears because the list is in order
    again.
  */
  await typeBand(1, 'min', 89);
  const halfPoint = await evalJs('window.__scale()');
  const atBoundary = await letterAt(89.5);
  const justUnder = await letterAt(89.49);
  check('an A boundary of 89.5 makes 89.5 an A and 89.49 the band below it, with no rounding anywhere in between',
    atBoundary === halfPoint.docLetters[0] && justUnder === halfPoint.docLetters[1]
      && await letterAt(89.4999) === halfPoint.docLetters[1]
      && await letterAt(90) === halfPoint.docLetters[0]
      && !halfPoint.warn && halfPoint.faults.unreachable.length === 0,
    '89.5 -> ' + atBoundary + ', 89.49 -> ' + justUnder + ', 89.4999 -> '
      + await letterAt(89.4999) + ' (boundaries ' + halfPoint.docMins[0] + ' / '
      + halfPoint.docMins[1] + ')');
  /* Stored exactly as it was typed, decimal included — src/letter-scale.js's first decision, and
     docs/data-model.md's rule about a number a teacher entered. A build that rounded the boundary on
     the way in would pass a check that only asked what 89.5 maps to, because 89.5 is an A either
     way; what it could not do is still be 89.5 in the document. */
  check('the boundary is stored exactly as typed — 89.5, as a number, not 90 and not "89.5"',
    halfPoint.docMins[0] === 89.5 && typeof halfPoint.docMins[0] === 'number'
      && halfPoint.mins[0] === '89.5'
      && halfPoint.ranges[0] === '89.5% and up' && halfPoint.ranges[1] === '89% up to 89.5%',
    'document ' + JSON.stringify(halfPoint.docMins.slice(0, 3)) + ' :: field '
      + JSON.stringify(halfPoint.mins[0]) + ' :: ranges '
      + JSON.stringify(halfPoint.ranges.slice(0, 2)));
  /* Nothing was blocked on the way through the faulty state — the same call src/categories.js made
     about weights that do not add up, and for the same reason: a scale mid-edit is wrong for a
     second at a time. An error line or a disabled field here would be the defect rather than the
     fix. The two disabled controls are the ends of the list, which is what they are asserted to be. */
  const scaleNotBlocked = await evalJs(`(function(){ var m = document.getElementById('letterScaleModal');
    var off = Array.prototype.slice.call(m.querySelectorAll('button[disabled], input[disabled]'));
    return { disabled: off.map(function(b){ return b.getAttribute('aria-label'); }),
             fields: m.querySelectorAll('input:not([disabled])').length,
             errors: m.querySelectorAll('.class-error:not(.hidden)').length }; })()`);
  check('a faulty scale blocks nothing: every field still live, and the only disabled controls are the ends of the list',
    scaleNotBlocked.errors === 0 && scaleNotBlocked.fields === halfPoint.letters.length * 2
      && scaleNotBlocked.disabled.length === 2
      && /higher/.test(scaleNotBlocked.disabled[0]) && /lower/.test(scaleNotBlocked.disabled[1]),
    JSON.stringify(scaleNotBlocked));

  /*
    ADDING A BAND, and the boundary it must NOT invent. A new band arrives at 0 rather than halfway
    between its neighbours, because a boundary Planbook chose is Planbook deciding what a B+ is —
    which is the one thing "the app never hardcodes 90/80/70" forbids. So it lands out of order with
    the bottom band and the note says so at once, which is the prompt to type the real number.
  */
  await clickSel('#letterScaleModal [data-band-add]');
  const addedBand = await evalJs('window.__scale()');
  const last = addedBand.letters.length - 1;
  check('a band added arrives at 0% with no boundary invented for it, and the note says the scale is out of order',
    addedBand.letters.length === halfPoint.letters.length + 1
      && addedBand.mins[last] === '0' && addedBand.docMins[last] === 0
      && JSON.stringify(addedBand.docMins.slice(0, last)) === JSON.stringify(halfPoint.docMins)
      && addedBand.warn && addedBand.rangeWarn[last] === true,
    'new band ' + JSON.stringify(addedBand.letters[last]) + ' at '
      + JSON.stringify(addedBand.mins[last]) + ' :: ' + JSON.stringify(addedBand.note));
  /* A letter is typed by a teacher, so markup in one stays text. */
  await typeBand(last, 'letter', 'I<b>nc</b>');
  const markup = await evalJs('window.__scale()');
  check('a letter renames as it is typed, and one containing markup stays text',
    markup.docLetters[last] === 'I<b>nc</b>' && markup.injected === 0,
    'stored ' + JSON.stringify(markup.docLetters[last]) + ', elements injected into the list = '
      + markup.injected);
  /* And out again on the tap, with no confirm dialog anywhere: nothing is filed under a band. */
  await clickSel('#bandList .band-row:last-child [data-band-remove]');
  const removedBand = await evalJs(`(function(){ var live = window.__scale();
    live.dialogs = Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
      .filter(function(o){ return !o.classList.contains('hidden'); })
      .map(function(o){ return o.id; });
    return live; })()`);
  check('removing a band takes one tap and opens no dialog, because nothing is filed under a band',
    removedBand.letters.length === halfPoint.letters.length
      && JSON.stringify(removedBand.docMins) === JSON.stringify(halfPoint.docMins)
      && JSON.stringify(removedBand.dialogs) === JSON.stringify(['classesModal', 'letterScaleModal'])
      && !removedBand.warn,
    JSON.stringify(removedBand.letters) + ' :: open dialogs ' + JSON.stringify(removedBand.dialogs));

  /*
    REORDER IS THE REPAIR THAT CHANGES NO BOUNDARY, which is why the arrows are here at all and why
    nothing sorts the list for the teacher. Moving the bottom band up makes the one it passed
    unreachable — no number changed — and moving it back repairs it, also with no number changed.
  */
  const beforeMove = removedBand.docMins.slice();
  await clickSel('#bandList .band-row:last-child [data-band-move-up]');
  const moved = await evalJs('window.__scale()');
  const bottom = moved.letters.length - 1;
  check('reordering changes no boundary at all, and can strand a band on its own',
    JSON.stringify(moved.docMins.slice().sort((a, b) => a - b))
      === JSON.stringify(beforeMove.slice().sort((a, b) => a - b))
      && JSON.stringify(moved.faults.unreachable) === JSON.stringify([bottom])
      && moved.warn && /never reached/.test(moved.ranges[bottom]),
    JSON.stringify(moved.docMins.slice(-3)) + ' :: unreachable '
      + JSON.stringify(moved.faults.unreachable));
  /* The row that moved is now the second from the bottom, and it is that row's ↓ that undoes it —
     the last row's is disabled, because it is the end of the list. */
  await clickSel('#bandList .band-row:nth-last-child(2) [data-band-move-down]');
  const unmoved = await evalJs('window.__scale()');
  check('and moving it back repairs the scale, again without touching a boundary',
    JSON.stringify(unmoved.docMins) === JSON.stringify(beforeMove) && !unmoved.warn
      && unmoved.faults.unreachable.length === 0,
    JSON.stringify(unmoved.docMins.slice(-3)) + ' :: ' + JSON.stringify(unmoved.note));

  /*
    THE OTHER EXPRESSIBLE FAULT: the gap at the bottom, which is the only true gap this shape allows.
    Raising the lowest boundary leaves every percentage below it with no letter at all — and the
    mapping says so rather than falling back to a letter nobody defined.
  */
  await typeBand(unmoved.letters.length - 1, 'min', 50);
  const gapped = await evalJs('window.__scale()');
  const belowTheFloor = await letterAt(49);
  check('a gap at the bottom is caught in the editor, and a percentage under it gets no letter rather than an invented one',
    gapped.warn && gapped.faults.gapBelow === 50 && /below 50%/.test(gapped.note)
      && belowTheFloor === '(none)' && await letterAt(50) === gapped.docLetters[gapped.docLetters.length - 1],
    JSON.stringify(gapped.note) + ' :: 49% -> ' + belowTheFloor);
  await typeBand(unmoved.letters.length - 1, 'min', 0);
  const ungapped = await evalJs('window.__scale()');
  check('setting it back to 0 clears the gap and the note goes positive again',
    !ungapped.warn && ungapped.faults.gapBelow === null && /exactly one letter/.test(ungapped.note)
      && await letterAt(0) === ungapped.docLetters[ungapped.docLetters.length - 1],
    JSON.stringify(ungapped.note));

  /*
    ACCEPTANCE LINE 2 — the per-class override, and the door to it. The subject row is where it is
    reached from, because the class-manager row already carries six controls and
    plans/gradebook-surfaces.md forbids re-cutting it: so the pills are asserted to be the document's
    own active classes, in order, behind "Every class".
  */
  const subjectIds = ungapped.subjectIds.slice(1);
  /* The classes still on the bar, in document order. An ARCHIVED class is deliberately not offered
     here — it is one the teacher has put away, and it keeps whatever override it had — so this is the
     assertion that would catch the pill row being built off `doc.classes` unfiltered. */
  const activeIds = ungapped.classIds.filter((id, i) => !ungapped.classArchived[i]);
  check('the subject row offers the document scale and every class on the bar, which is where the per-class override is reached',
    ungapped.subjects[0] === 'Every class' && ungapped.subjectIds[0] === ''
      && ungapped.active[0] === true && ungapped.pressed[0] === 'true'
      && subjectIds.length >= 4
      && JSON.stringify(subjectIds) === JSON.stringify(activeIds)
      && ungapped.active.filter((a) => a).length === 1
      && /Every class uses these bands/.test(ungapped.overrideText),
    ungapped.subjects.length + ' subjects: ' + JSON.stringify(ungapped.subjects.slice(0, 3))
      + ' … :: ' + JSON.stringify(ungapped.overrideText.slice(0, 80)));

  const overrideId = subjectIds[1];
  await clickSel('#scaleSubjects [data-scale-subject="' + overrideId + '"]');
  const inherited = await evalJs('window.__scale()');
  /* A class with no override is SHOWN the bands it uses, read-only. Editing them here would be
     editing every other class from a panel whose subject row says the name of one. */
  check('a class with no override shows the bands it uses, read-only, with the door to give it its own',
    inherited.inherited === inherited.letters.length && inherited.fields === 0
      && inherited.addHidden === true && inherited.overrideOn && !inherited.overrideOff
      && JSON.stringify(inherited.letters) === JSON.stringify(inherited.docLetters)
      && inherited.classScaleKind[inherited.classIds.indexOf(overrideId)] === 'null',
    inherited.letters.length + ' inherited row(s), ' + inherited.fields + ' field(s), add-a-band '
      + (inherited.addHidden ? 'hidden' : 'showing'));

  await clickSel('#scaleOverride [data-scale-override-on]');
  const owned = await evalJs('window.__scale()');
  const ownedAt = owned.classIds.indexOf(overrideId);
  /* Turning it on writes a COPY of the bands that already applied — not a diff against the default,
     which would be a second thing to keep in step every time the default moved. */
  check('turning the override on copies the bands that already applied, and the rows become editable',
    owned.classOwn[ownedAt] === true && owned.classScaleKind[ownedAt] === 'array'
      && owned.inherited === 0 && owned.fields === owned.letters.length * 2
      && owned.addHidden === false && owned.overrideOff && !owned.overrideOn
      && owned.classTopMin[ownedAt] === owned.docMins[0]
      && JSON.stringify(owned.letters) === JSON.stringify(owned.docLetters),
    'own bands = ' + owned.classOwn[ownedAt] + ', top boundary ' + owned.classTopMin[ownedAt]
      + ' copied from ' + owned.docMins[0]);

  /*
    AND IT APPLIES TO THAT CLASS ONLY, which is the acceptance line itself. The class's A boundary
    goes to 95 and the same percentage is asked of both scales: a build that shared one array between
    the copy and the document — the mistake src/categories.js's starterCategories() carries a warning
    about — would answer identically for both and fail here.
  */
  await typeBand(0, 'min', 95);
  const isolated = await evalJs('window.__scale()');
  const inThatClass = await letterAt(94, overrideId);
  const inTheDocument = await letterAt(94);
  const inAnotherClass = await letterAt(94, subjectIds[0]);
  check('a per-class override applies to that class only: 94% is one letter there and another everywhere else',
    isolated.classTopMin[ownedAt] === 95 && isolated.docMins[0] === ungapped.docMins[0]
      && inThatClass === isolated.docLetters[1] && inTheDocument === isolated.docLetters[0]
      && inAnotherClass === isolated.docLetters[0]
      && isolated.classOwn.filter((o) => o).length === 1
      && isolated.classScaleKind.every((k, i) => i === ownedAt ? k === 'array' : k !== 'array'),
    '94% -> ' + inThatClass + ' in ' + JSON.stringify(isolated.classNames[ownedAt])
      + ', ' + inAnotherClass + ' in ' + JSON.stringify(isolated.classNames[isolated.classIds.indexOf(subjectIds[0])])
      + ', ' + inTheDocument + ' document-wide; classes with their own bands = '
      + isolated.classOwn.filter((o) => o).length);
  /* And the panel says whose bands are whose while the document scale is up, because "why did my
     change not reach Period 3" is the question an override creates. */
  await clickSel('#scaleSubjects [data-scale-subject=""]');
  const named = await evalJs('window.__scale()');
  check('with the document scale up, the panel names the classes that have their own bands',
    named.overrideText.indexOf(named.classNames[ownedAt]) >= 0
      && /own bands/.test(named.overrideText) && named.inherited === 0
      && named.fields === named.letters.length * 2,
    JSON.stringify(named.overrideText.slice(0, 120)));

  /*
    A FULL RELOAD. A letter scale is the setting a whole year of report cards is read through, so "it
    was in the document" is not the claim — the claim is that it came back out of IndexedDB, both
    halves of it: the document's own 89.5 boundary and one class's override. Flushed first, for the
    reason tools/README.md trap 6 states at length.
  */
  await evalJs("window.planbook.closeModal('letterScaleModal');"
    + "window.planbook.closeModal('classesModal');1");
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const scaleBoot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  await evalJs(INSTALL_SCALE_READER);
  await clickSel('header [data-class-manage]');
  await clickSel('#classesModal [data-letter-scale]');
  const reloadedScale = await evalJs('window.__scale()');
  check('the bands survive a reload — the document scale and the one class override both come back out of IndexedDB',
    scaleBoot && JSON.stringify(reloadedScale.docMins) === JSON.stringify(isolated.docMins)
      && JSON.stringify(reloadedScale.docLetters) === JSON.stringify(isolated.docLetters)
      && reloadedScale.classTopMin[reloadedScale.classIds.indexOf(overrideId)] === 95
      && reloadedScale.classOwn.filter((o) => o).length === 1
      && await letterAt(89.5) === reloadedScale.docLetters[0]
      && await letterAt(94, overrideId) === reloadedScale.docLetters[1],
    scaleBoot ? JSON.stringify(reloadedScale.docMins.slice(0, 3)) + ' with '
      + reloadedScale.classOwn.filter((o) => o).length + ' class override(s)'
      : 'the loading screen never came down');

  /* And off again, which writes the `null` sentinel rather than an empty array — "use the document
     default" is a thing the document already has a word for, and the next reader of that field has
     to be able to tell the two apart. */
  await clickSel('#scaleSubjects [data-scale-subject="' + overrideId + '"]');
  await clickSel('#scaleOverride [data-scale-override-off]');
  const releasedScale = await evalJs('window.__scale()');
  const releasedAt = releasedScale.classIds.indexOf(overrideId);
  check('turning the override off writes null rather than an empty array, and the class is back on the document bands',
    releasedScale.classScaleKind[releasedAt] === 'null'
      && releasedScale.classOwn[releasedAt] === false
      && releasedScale.classOwn.every((o) => o === false)
      && releasedScale.inherited === releasedScale.letters.length
      && releasedScale.classTopMin[releasedAt] === releasedScale.docMins[0]
      && await letterAt(94, overrideId) === releasedScale.docLetters[0],
    'letterScale holds ' + releasedScale.classScaleKind[releasedAt] + '; 94% is now '
      + await letterAt(94, overrideId) + ' in that class again');

  await evalJs("window.planbook.closeModal('letterScaleModal');"
    + "window.planbook.closeModal('classesModal');1");
}

/* ───────────────── grade engine (WO-3.4) ─────────────────
 *
 * The twelve worked cases of docs/grade-math-cases.md, driven through window.planbook.gradeEngine
 * rather than recomputed here. This section's whole reason to exist is the correction that added
 * it: src/shell.js's comment above the `gradeEngine` seam already claimed "the browser verifier
 * reads its answers through this seam so the worked cases exercise the shipped module" — and until
 * this section existed, that was false. It said 522 green checks were watching arithmetic that
 * nothing here ran.
 *
 * A CHECK THAT COMPUTED THE EXPECTED ANSWER ITSELF WOULD PROVE NOTHING — a check that summed
 * `80 * 0.5 + 90 * 0.3 + 100 * 0.2` and compared it to its own answer agrees with itself perfectly
 * and would go green against a build that got the arithmetic wrong the same way twice. Every
 * expected value below is a LITERAL NUMBER OR STRING copied out of docs/grade-math-cases.md by
 * hand — never a formula — so the module's answer is being checked against a human's arithmetic,
 * not against a second copy of the module's own logic.
 *
 * There is no UI to drive: the grade engine is pure functions over a document (WO-3.4's Out of
 * scope line is explicit that WO-3.5 renders what this computes), so each case builds the exact
 * document fragment printed in the worked-cases doc as a plain object and hands it straight to
 * weightedClassGrade() and categoryResult() — no store, no class manager, no reload. That is also
 * why this section needs no classesBooted / classSeam gate the way the sections above it do: it
 * shares no screen and no document with the rest of the run.
 *
 * ONE CLASS, ONE TERM, ONE STUDENT — c1 / t1 / s1, matching every fixture in the source document.
 * A cold read of this suite found that an engine which ignored classId, termId or studentId
 * entirely would pass all twelve cases; the same read confirmed by direct probe that the three
 * filters do hold. Widening these fixtures to prove that here as a standing check is EXPLICITLY
 * OUT OF SCOPE for this round (owner's call, recorded in .claude/dispatch/WO-3.4-status.md) and is
 * left as a proposed follow-up work order rather than built into this section.
 */

console.log('\n--- grade engine ---');

const gradeSeam = await evalJs("!!(window.planbook && window.planbook.gradeEngine"
  + " && typeof window.planbook.gradeEngine.weightedClassGrade === 'function'"
  + " && typeof window.planbook.gradeEngine.categoryResult === 'function')");

if (!gradeSeam) {
  skip('grade engine: the twelve worked cases of docs/grade-math-cases.md',
    'no window.planbook.gradeEngine seam on the page — it is kept deliberately for this file to '
    + 'read the arithmetic through, so its absence is a defect and not a stage of the build');
} else {
  /* One round trip per case: build the fixture doc exactly as printed in the source document, ask
     weightedClassGrade() for the class-level answer and categoryResult() for each category's own
     fraction, and hand both back untouched. */
  const gradeAt = async (fixtureDoc, termId, studentId) => await evalJs(`(function(){
    var doc = ${JSON.stringify(fixtureDoc)};
    var g = window.planbook.gradeEngine;
    var cls = doc.classes[0];
    var cats = (cls.categories || []).map(function(cat){
      return { id: cat.id, result: g.categoryResult(doc, cls, ${JSON.stringify(termId)}, cat.id, ${JSON.stringify(studentId)}) };
    });
    return { grade: g.weightedClassGrade(doc, cls, ${JSON.stringify(termId)}, ${JSON.stringify(studentId)}), categories: cats };
  })()`);

  /* docs/grade-math-cases.md:6 — "the letter scale is A >= 90, B >= 80, C >= 70, and F >= 0" — used
     only on the three cases whose worked answer names a letter. Cases that don't name one carry no
     letterScale at all, so scaleForClass() falls back to an empty scale and letterFor() answers
     null rather than guessing; those cases assert the percentage only, exactly as the doc does. */
  const CASE_SCALE = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 },
    { letter: 'F', min: 0 }];

  /* Case 1 — three weighted categories. */
  const case1 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 50 }, { id: 'quiz', weight: 30 },
      { id: 'home', weight: 20 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'a3', classId: 'c1', termId: 't1', categoryId: 'home', points: 10 },
    ],
    scores: { a1: { s1: { v: 80 } }, a2: { s1: { v: 18 } }, a3: { s1: { v: 10 } } },
    letterScale: CASE_SCALE,
  }, 't1', 's1');
  check('case 1 (three weighted categories): 80/90/100 by category, 87% overall, letter B',
    case1.categories[0].result.percentage === 80 && case1.categories[1].result.percentage === 90
      && case1.categories[2].result.percentage === 100 && case1.grade.percentage === 87
      && case1.grade.letter === 'B',
    JSON.stringify(case1.categories.map((c) => c.result.percentage)) + ' :: class '
      + case1.grade.percentage + case1.grade.letter);

  /* Case 2 — one assignment in the term. */
  const case2 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [{ id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 40 }],
    scores: { a1: { s1: { v: 34 } } },
    letterScale: CASE_SCALE,
  }, 't1', 's1');
  check('case 2 (one assignment in the term): 34/40 is 85%, letter B',
    case2.grade.percentage === 85 && case2.grade.letter === 'B',
    'class ' + case2.grade.percentage + case2.grade.letter);

  /* Case 3 — a category with no assignments at all. */
  const case3 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 60 }, { id: 'home', weight: 40 }] }],
    assignments: [{ id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 50 }],
    scores: { a1: { s1: { v: 40 } } },
  }, 't1', 's1');
  check('case 3 (a category with no assignments): Homework has no percentage, weight redistributes, class is 80%',
    case3.categories[1].result.percentage === null && case3.grade.percentage === 80,
    'Homework % = ' + case3.categories[1].result.percentage + ', class ' + case3.grade.percentage);

  /* Case 4 — every score in a category is excused. */
  const case4 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 60 }, { id: 'home', weight: 40 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 50 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'home', points: 20 },
    ],
    scores: { a1: { s1: { v: 45 } }, a2: { s1: { v: null, flag: 'excused' } } },
  }, 't1', 's1');
  check('case 4 (every score in a category excused): Homework is 0/0 and has no percentage, class is 90%',
    case4.categories[1].result.earned === 0 && case4.categories[1].result.possible === 0
      && case4.categories[1].result.percentage === null && case4.grade.percentage === 90,
    JSON.stringify(case4.categories[1].result) + ' :: class ' + case4.grade.percentage);

  /* Case 5 — a zero-point assignment adds extra credit, with no division by zero. */
  const case5 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'quiz', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'ec', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 0 },
    ],
    scores: { a1: { s1: { v: 13 } }, ec: { s1: { v: 5 } } },
  }, 't1', 's1');
  check('case 5 (zero-point assignment adds extra credit): 18/20 is 90%, no division by zero',
    case5.categories[0].result.earned === 18 && case5.categories[0].result.possible === 20
      && case5.categories[0].result.percentage === 90 && case5.grade.percentage === 90,
    JSON.stringify(case5.categories[0].result) + ' :: class ' + case5.grade.percentage);

  /* Case 6 — extra credit carries a category, and the class, past 100%. */
  const case6 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'quiz', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'ec', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 0 },
    ],
    scores: { a1: { s1: { v: 20 } }, ec: { s1: { v: 5 } } },
    letterScale: CASE_SCALE,
  }, 't1', 's1');
  check('case 6 (extra credit past 100%): 25/20 is 125% at the category and the class, letter A, nothing clamps',
    case6.categories[0].result.percentage === 125 && case6.grade.percentage === 125
      && case6.grade.letter === 'A',
    'category ' + case6.categories[0].result.percentage + '% :: class '
      + case6.grade.percentage + case6.grade.letter);

  /* Case 7 — a category holding only zero-point assignments: possible sums to zero. */
  const case7 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 70 }, { id: 'extra', weight: 30 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 },
      { id: 'ec', classId: 'c1', termId: 't1', categoryId: 'extra', points: 0 },
    ],
    scores: { a1: { s1: { v: 80 } }, ec: { s1: { v: 10 } } },
  }, 't1', 's1');
  check('case 7 (a category with only zero-point work): Extra Credit is 10/0 with no percentage, class is 80% — never NaN, never 100%',
    case7.categories[1].result.earned === 10 && case7.categories[1].result.possible === 0
      && case7.categories[1].result.percentage === null && case7.grade.percentage === 80
      && !Number.isNaN(case7.grade.percentage),
    JSON.stringify(case7.categories[1].result) + ' :: class ' + case7.grade.percentage);

  /* Case 8 — weights crossing from 95 to 100, both directions on the same document. */
  const case8Fixture = (weights) => ({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: weights[0] },
      { id: 'quiz', weight: weights[1] }, { id: 'home', weight: weights[2] }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'a3', classId: 'c1', termId: 't1', categoryId: 'home', points: 10 },
    ],
    scores: { a1: { s1: { v: 80 } }, a2: { s1: { v: 18 } }, a3: { s1: { v: 10 } } },
  });
  const case8unbalanced = await gradeAt(case8Fixture([50, 30, 15]), 't1', 's1');
  check('case 8, first direction: weights totalling 95 return no grade at all, and the reason names the total',
    case8unbalanced.grade.percentage === null && case8unbalanced.grade.letter === null
      && case8unbalanced.grade.reason === 'weights-unbalanced'
      && case8unbalanced.grade.message === 'The category weights total 95%, so there is no grade yet.'
      && case8unbalanced.grade.weightTotal === 95,
    JSON.stringify({ reason: case8unbalanced.grade.reason, message: case8unbalanced.grade.message }));
  const case8balanced = await gradeAt(case8Fixture([50, 30, 20]), 't1', 's1');
  check('case 8, second direction: the same document with weights corrected to 100 returns 87%',
    case8balanced.grade.percentage === 87 && case8balanced.grade.reason === null,
    'class ' + case8balanced.grade.percentage + ', reason ' + case8balanced.grade.reason);

  /* Case 9 — a missing flag scores zero; the same cell excused raises the grade. */
  const case9Fixture = (flag) => ({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
    ],
    scores: { a1: { s1: { v: 8 } }, a2: { s1: { v: null, flag } } },
  });
  const case9missing = await gradeAt(case9Fixture('missing'), 't1', 's1');
  const case9excused = await gradeAt(case9Fixture('excused'), 't1', 's1');
  check('case 9 (missing vs. excused): missing scores zero at 40%, the same cell excused rises to 80%',
    case9missing.grade.percentage === 40 && case9excused.grade.percentage === 80,
    'missing ' + case9missing.grade.percentage + '% :: excused ' + case9excused.grade.percentage + '%');

  /* Case 10 — late is a record, not a penalty. */
  const case10Fixture = (flagged) => ({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [{ id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 }],
    scores: { a1: { s1: flagged ? { v: 78, flag: 'late' } : { v: 78 } } },
  });
  const case10late = await gradeAt(case10Fixture(true), 't1', 's1');
  const case10plain = await gradeAt(case10Fixture(false), 't1', 's1');
  check('case 10 (late is a record, not a penalty): flagged and unflagged both score 78%',
    case10late.grade.percentage === 78 && case10plain.grade.percentage === 78,
    'late ' + case10late.grade.percentage + '% :: unflagged ' + case10plain.grade.percentage + '%');

  /* Case 11 — a blank cell changes nothing versus no cell at all. */
  const case11blankFixture = {
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
    ],
    scores: { a1: { s1: { v: 9 } }, a2: { s1: { v: null } } },
  };
  const case11noKeyFixture = {
    classes: case11blankFixture.classes,
    assignments: case11blankFixture.assignments,
    scores: { a1: { s1: { v: 9 } } },
  };
  const case11blank = await gradeAt(case11blankFixture, 't1', 's1');
  const case11noKey = await gradeAt(case11noKeyFixture, 't1', 's1');
  check('case 11 (blank cell vs. no cell): both are 9/10, 90%, and agree with each other',
    case11blank.grade.percentage === 90 && case11noKey.grade.percentage === 90,
    'blank cell ' + case11blank.grade.percentage + '% :: no key ' + case11noKey.grade.percentage + '%');

  /* Case 12 — every category empty: an honest "no grade yet", not 0% and not NaN. */
  const case12 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 60 }, { id: 'home', weight: 40 }] }],
    assignments: [], scores: {},
  }, 't1', 's1');
  check('case 12 (every category empty): percentage is null, letter is null, reason is no-graded-work — never 0%, never NaN',
    case12.grade.percentage === null && case12.grade.letter === null
      && case12.grade.reason === 'no-graded-work'
      && case12.grade.message === 'There is no graded work yet.',
    JSON.stringify({ percentage: case12.grade.percentage, letter: case12.grade.letter,
      reason: case12.grade.reason }));
}

/* ───────────────── roster & contacts ─────────────────
 *
 * The five acceptance lines of WO-1.7, each driven through the real controls rather than through
 * src/roster.js's exports. The parser is exported on `window.planbook.roster` and this section
 * deliberately never calls it: a check that asked parseRosterLine() what it thought of a line
 * would agree with itself perfectly while the paste box wrote something else. Everything below
 * types into the box a teacher types into, reads the split out of the fields she reads it out of,
 * and then compares BOTH against the document — which is what "the preview matched" means.
 */

console.log('\n--- roster & contacts ---');

/* Flushed, then reloaded, for the reason the classes section gives at length (tools/README.md,
   trap 6) and for one that belongs to this feature: every screen here is filled from the document
   when its dialog opens, so a roster that renders only because the module still holds what it just
   wrote is a roster that is empty on the teacher's next launch. */
await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const rosterBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

/* Three page-side readers, for the reason window.__cls exists: one round trip per check, and the
   reads cannot drift apart between them. Re-installed after every reload, like the walker. */
const INSTALL_ROSTER_READER = `(function(){
  function pair(s){ return s ? [s.last, s.first] : null; }
  window.__ros = function(){
    var doc = window.planbook.store.getDoc();
    var openId = window.planbook.classes.getSelectedClassId();
    var open = doc.classes.filter(function(c){ return c.id === openId; })[0] || null;
    function byId(id){ return doc.students.filter(function(s){ return s.id === id; })[0] || null; }
    var rows = Array.prototype.slice.call(document.querySelectorAll('#rosterList .roster-row'));
    var orphans = Array.prototype.slice.call(document.querySelectorAll('#rosterOrphanList .roster-row'));
    function controls(r){
      return { name: (r.querySelector('.roster-row-name')||{}).textContent,
               edit: !!r.querySelector('[data-student-edit]'),
               remove: !!r.querySelector('[data-student-remove]'),
               add: !!r.querySelector('[data-student-add-to-class]'),
               del: !!r.querySelector('[data-student-delete]') };
    }
    return {
      students: doc.students.length,
      docPairs: doc.students.map(pair),
      openClass: open ? open.id : '',
      openName: open ? open.name : '',
      tabNames: Array.prototype.slice.call(
        document.querySelectorAll('#classTabBar [data-class-tab]')).map(function(b){ return b.textContent; }),
      rosterIds: open ? (open.roster || []).slice() : [],
      rosterPairs: open ? (open.roster || []).map(function(id){ return pair(byId(id)); }) : [],
      rowNames: rows.map(function(r){ return (r.querySelector('.roster-row-name')||{}).textContent; }),
      rowNotes: rows.map(function(r){ return (r.querySelector('.roster-row-note')||{}).textContent; }),
      rowControls: rows.map(controls),
      /* A student's name is pasted out of a school system, so the same claim src/classes.js makes
         about a class name has to hold here: rendered as text, never as markup. */
      injectedInList: document.querySelectorAll('#rosterList b, #rosterList i, #rosterList script').length,
      countLine: (document.getElementById('rosterCount')||{}).textContent,
      orphanHidden: document.getElementById('rosterOrphanSection').classList.contains('hidden'),
      orphanControls: orphans.map(controls),
      rosterError: (document.getElementById('rosterError')||{}).textContent,
      teacher: JSON.parse(JSON.stringify(doc.teacher || {})),
      ccPressed: (document.getElementById('teacherCcBtn')||{}).getAttribute
        ? document.getElementById('teacherCcBtn').getAttribute('aria-pressed') : '',
      ccHint: (document.getElementById('teacherCcState')||{}).textContent,
      rev: doc.rev
    };
  };
  /* The preview, read off the fields on screen rather than out of src/roster.js's model — the
     Traps line is about what the teacher can SEE before she commits, and a model she cannot see
     proves nothing about that. */
  window.__preview = function(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('#rosterPasteList .paste-row'));
    var btn = document.getElementById('rosterPasteCommitBtn') || {};
    return {
      rows: rows.length,
      pairs: rows.map(function(r){ var f = r.querySelectorAll('.paste-input');
        return [f[0] ? f[0].value : null, f[1] ? f[1].value : null]; }),
      include: rows.map(function(r){ var t = r.querySelector('[data-paste-include]');
        return t ? t.getAttribute('aria-pressed') === 'true' : null; }),
      labels: rows.map(function(r){ var t = r.querySelector('[data-paste-include]');
        return t ? t.textContent : ''; }),
      notes: rows.map(function(r){ return (r.querySelector('.paste-row-note')||{}).textContent; }),
      warn: rows.map(function(r){ return r.classList.contains('warn'); }),
      count: (document.getElementById('rosterPasteCount')||{}).textContent,
      commitText: btn.textContent || '', commitDisabled: !!btn.disabled
    };
  };
  window.__student = function(id){
    var doc = window.planbook.store.getDoc();
    var s = doc.students.filter(function(x){ return x.id === id; })[0];
    if (!s) return null;
    return { id: s.id, first: s.first, last: s.last, nickname: s.nickname, gradYear: s.gradYear,
             email: s.email, notes: s.notes,
             guardians: (s.guardians || []).map(function(g){
               return { name:g.name, relation:g.relation, email:g.email, phone:g.phone,
                        language:g.language, preferred:!!g.preferred }; }),
             counselor: { name: (s.counselor||{}).name, email: (s.counselor||{}).email },
             inClasses: doc.classes.filter(function(c){ return (c.roster||[]).indexOf(s.id) >= 0; })
               .map(function(c){ return c.id; }),
             /* Enumerated rather than sampled. It began as WO-1.7's Out of scope line — no
                supports stub before the work order that owns the shape — and at WO-1.8 it is the
                other half of the same claim: the block is there now, spelled the one way
                docs/data-model.md spells it, and nothing else has crept into the record. */
             keys: Object.keys(s).sort() };
  };
  return 1; })()`;

const rosterSeam = await evalJs("!!(window.planbook && window.planbook.roster"
  + " && typeof window.planbook.roster.parseRosterLine === 'function')");

if (!rosterBooted || !rosterSeam) {
  skip('roster & contacts: paste, duplicates, one student in two classes, remove, contacts round-trip',
    rosterBooted ? 'no window.planbook.roster seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  await evalJs(INSTALL_ROSTER_READER);
  const closeAll = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
    + "'rosterPasteModal','rosterModal','teacherModal','classesModal','aboutModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
  const openRosterOn = async (tab) => {
    await closeAll();
    await clickSel('[data-class-tab]', tab);
    await clickSel('header [data-roster-manage]');
    return evalJs('window.__ros()');
  };

  /*
    The fixture, and every line of it is a shape a real paste arrives in. `Last, First` with and
    without stray whitespace, two spreadsheet columns separated by a tab, `First Last` with nothing
    to read the split from, a surname made of particles, two spellings of a suffix, and the column
    heading a copied range brings along with it. The expected split beside each line is written out
    rather than computed, because a check that derived the answer from the same parser it is
    checking would agree with itself no matter what the parser did.
  */
  const PASTE_LINES = [
    ['Last Name\tFirst Name', null, null],
    ['Van Dyke, Mary', 'Van Dyke', 'Mary'],
    ['Okonkwo, Chidi', 'Okonkwo', 'Chidi'],
    ['  Nakamura ,  Yuki  ', 'Nakamura', 'Yuki'],
    ["O'Brien, Siobhan", "O'Brien", 'Siobhan'],
    ['Álvarez, José', 'Álvarez', 'José'],
    ['Washington, Dee Dee', 'Washington', 'Dee Dee'],
    ['Delgado, Robert, Jr.', 'Delgado Jr.', 'Robert'],
    ['Chen, Wei-Lin', 'Chen', 'Wei-Lin'],
    ['de la Cruz, Ana', 'de la Cruz', 'Ana'],
    ['Park, Min', 'Park', 'Min'],
    ['Ito\tHaruki', 'Ito', 'Haruki'],
    ['Bauer\t\tGreta', 'Bauer', 'Greta'],
    ['Novak\tPetra  ', 'Novak', 'Petra'],
    ['Marcus Aurelio', 'Aurelio', 'Marcus'],
    ['Jonas Van Der Berg', 'Van Der Berg', 'Jonas'],
    ['Anh Le', 'Le', 'Anh'],
    ['Robert Smith Jr', 'Smith Jr', 'Robert'],
    ['Grace Hopper', 'Hopper', 'Grace'],
    ['Ada Lovelace', 'Lovelace', 'Ada'],
    ['Katherine Johnson', 'Johnson', 'Katherine'],
    ['Bo <b>x</b>, Mae', 'Bo <b>x</b>', 'Mae'],
    ['Curie, Marie', 'Curie', 'Marie'],
    ['Franklin, Rosalind', 'Franklin', 'Rosalind'],
    ['Tharp, Marie', 'Tharp', 'Marie'],
    ['Ochoa, Ellen', 'Ochoa', 'Ellen'],
  ];
  const EXPECTED = PASTE_LINES.slice(1).map(l => [l[1], l[2]]);
  /* A blank line in the middle is what a copy out of two ranges looks like, and the two at the end
     are what every copy out of a spreadsheet looks like. All three have to disappear rather than
     arrive as empty rows the teacher unticks one at a time. */
  const PASTE_TEXT = [
    ...PASTE_LINES.slice(0, 6).map(l => l[0]), '',
    ...PASTE_LINES.slice(6).map(l => l[0]), '', '',
  ].join('\n');
  const typeInto = (id, text) => evalJs('(function(){ var e = document.getElementById('
    + JSON.stringify(id) + '); e.value = ' + JSON.stringify(text)
    + '; e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');

  const start = await openRosterOn(0);
  check('the roster opens on the class that is open, empty, with the class-less students listed apart',
    start.tabNames.length >= 2 && start.openName === start.tabNames[0]
      && start.rosterIds.length === 0
      && start.rowNames.length === 0 && start.orphanHidden === false
      && start.orphanControls.length === start.students
      && start.orphanControls.every(c => c.add && c.del && !c.remove),
    'open class = ' + JSON.stringify(start.openName) + ', on its roster = '
      + start.rosterIds.length + ', in the year and in no class = ' + start.orphanControls.length);

  /* ── acceptance 1: 25 names, split correctly, and the preview matched ── */

  await clickSel('#rosterModal [data-roster-paste]');
  await typeInto('rosterPasteBox', PASTE_TEXT);
  await clickSel('[data-roster-preview]');
  const preview = await evalJs('window.__preview()');
  const previewPairs = preview.pairs.slice(1);
  check('26 pasted lines preview as 26 rows, each split into a first and a last you can see and edit',
    preview.rows === 26 && JSON.stringify(previewPairs) === JSON.stringify(EXPECTED),
    preview.rows === 26
      ? 'every row matched the expected split'
      : previewPairs.length + ' name rows; first mismatch = ' + JSON.stringify(
          previewPairs.find((p, i) => JSON.stringify(p) !== JSON.stringify(EXPECTED[i])) || null));
  check('the blank lines are gone and the column heading is ticked off rather than added',
    preview.include[0] === false && preview.labels[0] === 'Skip'
      && /Column heading/.test(preview.notes[0]) && preview.warn[0] === true
      && preview.include.slice(1).every(v => v === true),
    JSON.stringify(preview.pairs[0]) + ' — ' + JSON.stringify(preview.notes[0]));
  check('and the preview says how many will be added, out of how many lines',
    preview.count === '25 new students — out of 26 lines.'
      && preview.commitText === 'Add 25 students' && preview.commitDisabled === false,
    JSON.stringify(preview.count) + ' · button ' + JSON.stringify(preview.commitText));

  await clickSel('[data-roster-commit]');
  const pasted = await evalJs('window.__ros()');
  check('committing adds exactly 25 students to this class, split exactly as the preview showed',
    pasted.students === start.students + 25 && pasted.rosterIds.length === 25
      && JSON.stringify(pasted.rosterPairs) === JSON.stringify(previewPairs)
      && pasted.rowNames.length === 25,
    'students in the year ' + start.students + ' -> ' + pasted.students + ', on this roster '
      + pasted.rosterIds.length + ', document split === preview split');
  check('a pasted name carrying markup stays those characters — createElement, never innerHTML',
    pasted.rowNames.indexOf('Bo <b>x</b>, Mae') >= 0 && pasted.injectedInList === 0,
    'elements injected into the roster list = ' + pasted.injectedInList);

  /* ── the Traps line: the split is a guess, and the preview is where it gets caught ── */

  await clickSel('#rosterModal [data-roster-paste]');
  await typeInto('rosterPasteBox', 'Fitzgerald Ellen\nBhatt Priya\n');
  await clickSel('[data-roster-preview]');
  const guessed = await evalJs('window.__preview()');
  check('a line with no separator is read as First Last, shown split, and flagged as a guess',
    JSON.stringify(guessed.pairs) === JSON.stringify([['Ellen', 'Fitzgerald'], ['Priya', 'Bhatt']])
      && guessed.warn.every(w => w === true)
      && guessed.notes.every(n => /Read as .First Last./.test(n) && /check the split/.test(n)),
    JSON.stringify(guessed.pairs) + ' — ' + JSON.stringify(guessed.notes[0]));
  await clickSel('[data-paste-swap-all]');
  const swappedAll = await evalJs('window.__preview()');
  check('one tap puts every row the other way round, in the fields on screen',
    JSON.stringify(swappedAll.pairs) === JSON.stringify([['Fitzgerald', 'Ellen'], ['Bhatt', 'Priya']])
      && swappedAll.warn.every(w => w === false)
      && swappedAll.include.every(v => v === true),
    JSON.stringify(swappedAll.pairs));
  await clickSel('[data-paste-swap]', 1);
  const swappedOne = await evalJs('window.__preview()');
  check('and the per-row swap moves that row and only that row',
    JSON.stringify(swappedOne.pairs) === JSON.stringify([['Fitzgerald', 'Ellen'], ['Priya', 'Bhatt']]),
    JSON.stringify(swappedOne.pairs));
  await clickSel('[data-paste-swap]', 1);
  await clickSel('[data-roster-commit]');
  const corrected = await evalJs('window.__ros()');
  check('and the corrected split is what gets written, not the guess',
    corrected.rosterIds.length === 27
      && JSON.stringify(corrected.rosterPairs.slice(25))
        === JSON.stringify([['Fitzgerald', 'Ellen'], ['Bhatt', 'Priya']]),
    JSON.stringify(corrected.rosterPairs.slice(25)));

  /* ── acceptance 2: the same list again ── */

  await clickSel('#rosterModal [data-roster-paste]');
  await typeInto('rosterPasteBox', PASTE_TEXT);
  await clickSel('[data-roster-preview]');
  const again = await evalJs('window.__preview()');
  check('re-pasting the same list warns on every line instead of silently doubling the roster',
    again.rows === 26 && again.include.every(v => v === false)
      && again.labels.slice(1).every(l => l === 'Skip')
      && again.notes.slice(1).every(n => /Already in this class/.test(n))
      && again.warn.slice(1).every(w => w === true)
      && again.count === '0 new students · 25 names already in this class, skipped — out of 26 lines.',
    JSON.stringify(again.count));
  check('and the Add control refuses rather than being live and doubling it',
    again.commitDisabled === true && again.commitText === 'Nothing to add',
    'button ' + JSON.stringify(again.commitText) + ', disabled = ' + again.commitDisabled);
  /* Clicked anyway: a disabled button fires no click, so this is the same gesture a teacher who
     did not read the count line makes, and the counts below are what she gets for it. */
  await clickSel('[data-roster-commit]');
  await evalJs("window.planbook.closeModal('rosterPasteModal');1");
  const afterRepaste = await evalJs('window.__ros()');
  check('so a second paste of the same 25 names writes nothing at all',
    afterRepaste.students === corrected.students && afterRepaste.rosterIds.length === 27,
    'students in the year = ' + afterRepaste.students + ', on this roster = '
      + afterRepaste.rosterIds.length);

  /* ── acceptance 3: one student, two classes, one set of contacts ── */

  const maryId = afterRepaste.rosterIds[0];
  await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
  await evalJs(`(function(){
    function set(id, v){ var e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); }
    set('studentNickname', 'Mimi');
    set('studentGradYear', '2029');
    set('studentEmail', 'mary.vandyke@student.example.edu');
    set('studentCounselorName', 'R. Ochoa');
    set('studentCounselorEmail', 'r.ochoa@example.edu');
    return 1; })()`);
  await clickSel('#studentModal [data-guardian-add]');
  await evalJs(`(function(){ var list = document.getElementById('guardianList');
    function set(field, v){
      var e = list.querySelector('[data-student-field="guardian.' + field + '"]');
      e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
    set('name', 'Elena Van Dyke'); set('relation', 'Mother');
    set('email', 'elena.vandyke@example.com'); set('phone', '555-0142'); set('language', 'es');
    return 1; })()`);
  await new Promise(r => setTimeout(r, 200));
  /* The second class, turned on from the editor — which is the whole of "move a student between
     classes": the class takes the id, and the record is not touched at all. */
  await clickSel('#studentClasses [data-student-class]', 1);
  const twoClasses = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  const afterJoin = await evalJs('window.__ros()');
  check('a student put into a second class is still one record, with one set of contacts',
    !!twoClasses && twoClasses.inClasses.length === 2
      && afterJoin.students === afterRepaste.students
      && afterJoin.docPairs.filter(p => p[0] === 'Van Dyke' && p[1] === 'Mary').length === 1
      && twoClasses.guardians.length === 1
      && twoClasses.guardians[0].email === 'elena.vandyke@example.com'
      && twoClasses.guardians[0].preferred === true
      && twoClasses.counselor.email === 'r.ochoa@example.edu',
    /* Reported rather than dereferenced. A mutation that copies the student instead of referencing
       her makes this read null, and a check that throws on a defect is a check that took the run
       down instead of naming it. */
    twoClasses
      ? 'in ' + twoClasses.inClasses.length + ' classes, ' + afterJoin.students
        + ' students in the year, ' + twoClasses.guardians.length + ' guardian(s)'
      : 'the student the editor was open on is no longer in the document');
  /* The whole record, enumerated rather than sampled: ten keys and no eleventh. `supports` is
     WO-1.8's and is now one of them; the check that used to assert its ABSENCE is the same check,
     which is why it is worth spelling every key out rather than testing for the one in question. */
  check('and the record carries exactly the fields the data model gives a student, supports included',
    JSON.stringify(twoClasses.keys) === JSON.stringify(['counselor', 'email', 'first', 'gradYear',
      'guardians', 'id', 'last', 'nickname', 'notes', 'supports']),
    JSON.stringify(twoClasses.keys));

  const otherClass = await openRosterOn(1);
  check('and the other class shows the same record on its roster rather than a copy of her',
    otherClass.rosterIds.length === 1 && otherClass.rosterIds[0] === maryId
      && /Van Dyke, Mary/.test(otherClass.rowNames[0]) && /Mimi/.test(otherClass.rowNames[0])
      && /^also in /.test(otherClass.rowNotes[0]),
    JSON.stringify(otherClass.rowNames[0]) + ' · ' + JSON.stringify(otherClass.rowNotes[0]));

  /* ── acceptance 4: off one roster, and nowhere else ── */

  await clickSel('#rosterList .roster-row:nth-child(1) [data-student-remove]');
  const afterRemove = await evalJs('window.__ros()');
  const survivor = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  check('removing her from this class takes her off this roster and touches nothing else',
    afterRemove.rosterIds.length === 0 && !!survivor && survivor.inClasses.length === 1
      && afterRemove.students === afterJoin.students
      && survivor.email === 'mary.vandyke@student.example.edu'
      && survivor.guardians.length === 1
      && survivor.guardians[0].email === 'elena.vandyke@example.com'
      && survivor.counselor.email === 'r.ochoa@example.edu',
    survivor
      ? 'on this roster now = ' + afterRemove.rosterIds.length + ', still in '
        + survivor.inClasses.length + ' class, contacts intact'
      : 'REMOVE DESTROYED THE RECORD: she is off this roster and out of the school year');
  const backOnFirst = await openRosterOn(0);
  check('and the class she is still in has her, and all 27, exactly as before',
    backOnFirst.rosterIds.length === 27 && backOnFirst.rosterIds[0] === maryId
      && JSON.stringify(backOnFirst.rosterPairs) === JSON.stringify(afterRepaste.rosterPairs),
    backOnFirst.rosterIds.length + ' on the roster, in the order they were pasted');

  /* ── the teacher's own details, which are the other half of this work order's deliverables ── */

  await closeAll();
  await clickSel('header [data-teacher-panel]');
  await evalJs(`(function(){
    function set(id, v){ var e = document.getElementById(id); e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true })); }
    set('teacherName', 'Ms Toomey'); set('teacherSchool', 'Probe High School');
    set('teacherEmail', 'toomey@example.edu'); set('teacherAdminEmail', 'dean@example.edu');
    return 1; })()`);
  await new Promise(r => setTimeout(r, 200));
  await clickSel('[data-teacher-cc]');
  const teacherOff = await evalJs('window.__ros()');
  check('the teacher\'s five details are written to the year document, the cc flag included',
    teacherOff.teacher.name === 'Ms Toomey' && teacherOff.teacher.school === 'Probe High School'
      && teacherOff.teacher.email === 'toomey@example.edu'
      && teacherOff.teacher.adminEmail === 'dean@example.edu'
      && teacherOff.teacher.defaultCc === false && teacherOff.ccPressed === 'false'
      && /will not copy you/.test(teacherOff.ccHint),
    JSON.stringify(teacherOff.teacher));
  await clickSel('[data-teacher-cc]');
  const teacherOn = await evalJs('window.__ros()');
  check('and the cc toggle says which way it is in words, not only in a fill colour',
    teacherOn.teacher.defaultCc === true && teacherOn.ccPressed === 'true'
      && /copied in/.test(teacherOn.ccHint),
    JSON.stringify(teacherOn.ccHint));

  /*
    WO-1.10's "Header: … teacher name", driven through the field she types it into rather than
    through src/teacher.js — the panel is a modal and the header shows above and behind it, so the
    line has to follow the keystrokes and not the next reload.

    The second half is the one worth having: clearing the name has to put the app's strapline back,
    and the strapline is NOT written out in src/teacher.js — it captures whatever index.html shipped
    in that element. So the expected string is read out of index.html here too. Two copies of a
    sentence is how a header ends up saying something the markup does not, and this is the check
    that would notice.

    The name is put back before moving on, so the document leaves this block exactly as the checks
    above found it.
  */
  const strapline = (html.match(/<p id="headerSubtitle">([^<]*)<\/p>/) || [])[1];
  const named = await evalJs("(document.getElementById('headerSubtitle')||{}).textContent");
  await evalJs(`(function(){ var e = document.getElementById('teacherName'); e.value = '';
    e.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
  const unnamed = await evalJs("(document.getElementById('headerSubtitle')||{}).textContent");
  await evalJs(`(function(){ var e = document.getElementById('teacherName'); e.value = 'Ms Toomey';
    e.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
  const renamed = await evalJs('window.__ros()');
  check('the header says whose planbook it is as she types her name, and says the strapline when she has not',
    named === 'Ms Toomey · Probe High School'
      && !!strapline && unnamed.trim() === strapline.trim()
      && renamed.teacher.name === 'Ms Toomey',
    'named = ' + JSON.stringify(named) + ' · cleared = ' + JSON.stringify(unnamed)
      + ' · index.html ships ' + JSON.stringify(strapline));

  /* Neither a student's contacts nor the teacher's own name is a UI preference, and src/prefs.js
     is the only door to localStorage precisely so this stays true. Read out of the browser rather
     than out of prefs.js, because what is being asserted is what is in the browser. */
  const localKeys = await readLocalStore(evalJs, 300);
  const localBlob = JSON.stringify(localKeys);
  check('nothing a teacher typed about herself or a student reached localStorage, and every key present is ours',
    oursIn(localKeys).length > 0
      && foreignIn(localKeys).length === 0
      && !/Van Dyke|Mimi|elena\.vandyke|r\.ochoa|Ms Toomey|Probe High/.test(localBlob),
    storeDetail(localKeys));

  /* ── acceptance 5: through a save and a reload ── */

  await closeAll();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const rosterReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  await evalJs(INSTALL_ROSTER_READER);
  const reloaded = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  check('the student, guardian and counselor emails all come back after a save and a reload',
    rosterReboot && !!reloaded && reloaded.email === 'mary.vandyke@student.example.edu'
      && reloaded.guardians.length === 1
      && reloaded.guardians[0].email === 'elena.vandyke@example.com'
      && reloaded.guardians[0].name === 'Elena Van Dyke'
      && reloaded.guardians[0].relation === 'Mother'
      && reloaded.guardians[0].phone === '555-0142'
      && reloaded.guardians[0].language === 'es'
      && reloaded.guardians[0].preferred === true
      && reloaded.counselor.name === 'R. Ochoa'
      && reloaded.counselor.email === 'r.ochoa@example.edu'
      && reloaded.nickname === 'Mimi' && reloaded.gradYear === '2029',
    rosterReboot ? 'student, guardian and counselor addresses all present out of IndexedDB'
      : 'the loading screen never came down');
  const reloadedRoster = await openRosterOn(0);
  check('and so does the whole roster, in its pasted order, with the teacher\'s details',
    reloadedRoster.rosterIds.length === 27
      && JSON.stringify(reloadedRoster.rosterPairs) === JSON.stringify(backOnFirst.rosterPairs)
      && reloadedRoster.teacher.name === 'Ms Toomey'
      && reloadedRoster.teacher.adminEmail === 'dean@example.edu'
      && reloadedRoster.teacher.defaultCc === true,
    reloadedRoster.rosterIds.length + ' students back on the roster, teacher = '
      + JSON.stringify(reloadedRoster.teacher.name));

  /* The recovery path carries contacts too, which is the half of acceptance 5 that a reload cannot
     answer: IndexedDB is what iOS evicts, and the file is what survives it. Built rather than
     restored — the swap has its own checks further up, and this one is about what is in the file. */
  const inBackup = await evalJs(`(async function(){
    var f = await window.planbook.backup.buildBackup();
    var doc = JSON.parse(f.text);
    var mary = doc.students.filter(function(s){ return s.id === ${JSON.stringify(maryId)}; })[0] || {};
    return { students: doc.students.length,
             email: mary.email,
             guardian: ((mary.guardians || [])[0] || {}).email,
             counselor: (mary.counselor || {}).email,
             teacher: (doc.teacher || {}).email }; })()`);
  check('and the backup file carries the students, their contacts and the teacher\'s address',
    inBackup.students === reloadedRoster.students
      && inBackup.email === 'mary.vandyke@student.example.edu'
      && inBackup.guardian === 'elena.vandyke@example.com'
      && inBackup.counselor === 'r.ochoa@example.edu'
      && inBackup.teacher === 'toomey@example.edu',
    inBackup.students + ' students in the file, all three addresses present');

  /* ── remove and delete are different operations ── */

  /*
    Gated on the fixture this arc drives, rather than clicking into it and hoping. Everything below
    taps a specific row and then a specific orphan by id, and clickSel THROWS when it finds nothing
    — so a defect upstream that shortened the roster would end the run here instead of reporting,
    taking the touch and overflow sections with it. That is a harness bug wearing an app defect's
    clothes, which is the whole subject of tools/README.md's CDP section. A missing fixture is one
    honest failure, and the run goes on.
  */
  const priyaId = reloadedRoster.rosterIds[26];
  /* Gated on the RENDERED rows as well as on the stored ids, because those two can disagree and
     the arc below taps rows. A roster id naming a student who is no longer in the document renders
     as nothing at all — src/roster.js calls that the harmless failure and it is — so a defect that
     destroyed a record while leaving its id on a roster leaves 27 ids and 26 rows, and a gate that
     counted only ids would wave the arc through into a row that is not there. */
  if (reloadedRoster.rosterIds.length !== 27 || reloadedRoster.rowNames.length !== 27 || !priyaId) {
    check('remove leaves the record, delete destroys it, and the confirm counts what goes',
      false, 'this arc needs the 27-name roster the checks above build; it arrived with '
        + reloadedRoster.rosterIds.length + ' ids and ' + reloadedRoster.rowNames.length
        + ' rows, so it was not driven');
  } else {
  await clickSel('#rosterList .roster-row:nth-child(27) [data-student-remove]');
  const orphaned = await evalJs('window.__ros()');
  check('a student removed from her only class lands in "Not in any class" rather than being deleted',
    orphaned.rosterIds.length === 26 && orphaned.students === reloadedRoster.students
      && orphaned.orphanHidden === false
      && orphaned.orphanControls.some(c => c.name === 'Bhatt, Priya' && c.add && c.del && !c.remove)
      && orphaned.rowControls.every(c => c.remove && !c.del),
    'on the roster ' + orphaned.rosterIds.length + ', in the year ' + orphaned.students
      + ', class-less ' + orphaned.orphanControls.length
      + ' — Delete is offered there and nowhere else');

  /* Mary, who has contacts, so the confirm has something to count. Removed first because Delete is
     only offered on a student who is in no class at all — which is the safety this design buys:
     "wrong class" is one cheap tap and "destroy a person's contacts" is a deliberate one. */
  await clickSel('#rosterList .roster-row:nth-child(1) [data-student-remove]');
  await clickSel('#rosterOrphanList [data-student-delete="' + maryId + '"]');
  const confirmText = await evalJs(`(function(){ var m = document.getElementById('studentDeleteModal');
    return { open: !!m && !m.classList.contains('hidden'),
             lead: (document.getElementById('studentDeleteLead')||{}).textContent,
             facts: (document.getElementById('studentDeleteFacts')||{}).textContent.replace(/\\s+/g,' '),
             button: (document.getElementById('studentDeleteBtn')||{}).textContent }; })()`);
  check('the delete confirm names the student and counts the contacts it would destroy',
    confirmText.open && /Mary Van Dyke/.test(confirmText.lead)
      && /cannot be undone/.test(confirmText.lead)
      && /2 contacts — guardian and counselor details/.test(confirmText.facts)
      && confirmText.button === 'Delete Mary Van Dyke',
    confirmText.facts.slice(0, 160));
  const beforeCancelStudent = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__ros(); })()');
  await clickSel('[data-student-delete-cancel]');
  const afterCancelStudent = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__ros(); })()');
  const cancelled = await evalJs('window.__student(' + JSON.stringify(maryId) + ')');
  check('cancelling it writes nothing — she and her contacts are exactly as they were',
    afterCancelStudent.students === beforeCancelStudent.students
      && afterCancelStudent.rev === beforeCancelStudent.rev
      && !!cancelled && cancelled.guardians.length === 1
      && cancelled.counselor.email === 'r.ochoa@example.edu',
    'students ' + afterCancelStudent.students + ', rev ' + beforeCancelStudent.rev + ' -> '
      + afterCancelStudent.rev + ' (nothing written, so rev cannot move)');
  /* Back onto the roster she goes, which is the repair that "Not in any class" exists for. */
  await clickSel('#rosterOrphanList [data-student-add-to-class="' + maryId + '"]');

  await clickSel('#rosterOrphanList [data-student-delete="' + priyaId + '"]');
  await clickSel('[data-student-delete-confirm]');
  await new Promise(r => setTimeout(r, 300));
  const deletedStudent = await evalJs('window.__ros()');
  check('confirming it destroys that one record and leaves every other student alone',
    deletedStudent.students === beforeCancelStudent.students - 1
      && (await evalJs('window.__student(' + JSON.stringify(priyaId) + ')')) === null
      && deletedStudent.rosterIds.length === 26
      && deletedStudent.rosterIds.indexOf(maryId) === 25,
    'students in the year ' + beforeCancelStudent.students + ' -> ' + deletedStudent.students
      + ', on the roster ' + deletedStudent.rosterIds.length);
  }

  /* The open class is put back where the classes section left it. The overflow section at the
     bottom measures the tab strip AND the term nav of whatever is open, and the class this section
     works in is the one the backup section restored — which has no terms at all, so leaving it
     open would quietly halve what that sweep measures without failing anything. */
  await closeAll();
  await clickSel('[data-class-tab]', 1);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
}

/* ───────────────── support details ─────────────────
 *
 * WO-1.8's five acceptance lines, driven through the real controls the way the section above
 * drives the roster's. Two of them are unlike anything else in this file, and both are unlike it
 * in the same way: they are claims about what is NOT on the screen.
 *
 * That shape is where a vacuous pass hides. "The roster does not show the word IEP" is true of a
 * roster with no students on it, of a roster that failed to render, and of a build where the
 * feature was never wired up — so every absence check below is paired with the presence check that
 * proves the fixture was really there: the same string, in the same document, read back out after
 * a reload. An absence with nothing behind it is not evidence.
 *
 * The third is the dot. A dot that encoded the plan type would still be one dot per student and
 * would still pass any check that counted them, so the dots are compared to EACH OTHER — computed
 * colour, radius, border, size, glyph and label, across three students with three different things
 * on file. That is the only form of this check that can fail.
 */

console.log('\n--- support details ---');

const supportSeam = await evalJs("!!(window.planbook && window.planbook.supports"
  + " && typeof window.planbook.supports.supportsVisible === 'function'"
  + " && typeof window.planbook.roster === 'object')");

if (!supportSeam) {
  skip('support details: the block round-trips, the roster stays quiet, and the dot says nothing',
    'no window.planbook.supports seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js');
} else {
  /* Three page-side readers, re-installed after every reload like the walker: the document's own
     copy of a support block, everything the editor panel is showing, and every dot on the roster
     with the computed style a projector would actually paint. */
  const INSTALL_SUPPORT_READER = `(function(){
    window.__sup = function(id){
      var doc = window.planbook.store.getDoc();
      var s = doc.students.filter(function(x){ return x.id === id; })[0];
      if (!s) return null;
      return { keys: Object.keys(s).sort(),
               supports: s.supports ? JSON.parse(JSON.stringify(s.supports)) : null,
               dot: window.planbook.supports.hasSupports(s) };
    };
    window.__panel = function(){
      var body = document.getElementById('supportsBody');
      var btn = document.getElementById('supportsRevealBtn');
      function val(id){ var e = document.getElementById(id); return e ? e.value : null; }
      function all(sel){ return Array.prototype.map.call(
        document.querySelectorAll('#accommodationList ' + sel), function(e){ return e.value; }); }
      var pressed = document.querySelectorAll('#supportsPlanRow [aria-pressed="true"]');
      return {
        hidden: !!body && body.classList.contains('hidden'),
        expanded: btn ? btn.getAttribute('aria-expanded') : null,
        label: btn ? btn.textContent.replace(/\\s+/g, ' ').trim() : null,
        plan: Array.prototype.map.call(pressed, function(b){
          return b.getAttribute('data-support-plan'); }),
        caseName: val('supportsCaseManagerName'), caseEmail: val('supportsCaseManagerEmail'),
        reviewDate: val('supportsReviewDate'),
        medical: val('supportsMedical'), behaviorPlan: val('supportsBehaviorPlan'),
        cards: document.querySelectorAll('#accommodationList .accommodation-card').length,
        kinds: all('[data-support-kind]'),
        details: all('[data-student-field="accommodation.detail"]'),
        applies: all('[data-student-field="accommodation.appliesTo"]'),
        /* The whole dialog as a reader would hear it, so an absence claim covers rendered text and
           not only the fields this reader happens to name. */
        text: (document.getElementById('studentModal') || { textContent: '' })
          .textContent.replace(/\\s+/g, ' ')
      };
    };
    window.__dots = function(){
      var out = [];
      Array.prototype.forEach.call(document.querySelectorAll('#rosterList [data-supports-open]'),
        function(d){
          var cs = getComputedStyle(d), box = d.getBoundingClientRect();
          out.push({ id: d.getAttribute('data-supports-open'),
                     text: d.textContent, cls: d.className,
                     label: d.getAttribute('aria-label'), title: d.getAttribute('title'),
                     look: [cs.backgroundColor, cs.color, cs.borderTopColor, cs.borderTopWidth,
                            cs.borderTopLeftRadius, cs.fontSize,
                            Math.round(box.width) + 'x' + Math.round(box.height)].join(' | ') });
        });
      return out;
    };
    window.__rosterText = function(){
      var m = document.getElementById('rosterModal');
      return { rows: document.querySelectorAll('#rosterList .roster-row').length,
               dots: document.querySelectorAll('#rosterList [data-supports-open]').length,
               text: (m ? m.textContent : '').replace(/\\s+/g, ' ') };
    };
    return 1; })()`;
  await evalJs(INSTALL_SUPPORT_READER);

  const closeAllSupport = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
    + "'rosterPasteModal','rosterModal','teacherModal','classesModal','backupModal','yearModal',"
    + "'aboutModal'].forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
  /* Found rather than assumed, exactly as the touch section does it: the section above leaves the
     open class wherever its last check left it, and an empty roster would make every absence check
     below true for the wrong reason. */
  const openFullestRoster = async () => {
    await closeAllSupport();
    const fullest = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var tabs = Array.prototype.slice.call(
        document.querySelectorAll('#classTabBar [data-class-tab]'));
      var best = -1, n = -1;
      tabs.forEach(function(t, i){
        var c = doc.classes.filter(function(x){
          return x.id === t.getAttribute('data-class-tab'); })[0];
        var len = c && c.roster ? c.roster.length : 0;
        if (len > n) { n = len; best = i; }
      });
      return { tab: best, students: n }; })()`);
    if (fullest.tab >= 0) await clickSel('[data-class-tab]', fullest.tab);
    await clickSel('header [data-roster-manage]');
    return fullest;
  };
  const typeField = (id, text) => evalJs('(function(){ var e = document.getElementById('
    + JSON.stringify(id) + '); if (!e) return 0; e.value = ' + JSON.stringify(text)
    + '; e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');

  /*
    The fixture. Three students with three different things on file, because acceptance line 3 is
    about the dots DIFFERING and one student cannot differ from anybody. Every value is a phrase
    that appears nowhere else in the app, so searching a screen for it cannot match furniture:
    "Peanut" is not a word in any copy in this repo, and neither is "Ramirez" or "1.5x on tests".
  */
  const CASE_NAME = 'K. Ramirez';
  const CASE_EMAIL = 'k.ramirez@example.edu';
  const REVIEW_DATE = '2027-02-11';
  const DETAIL_ONE = '1.5x on tests and quizzes';
  const DETAIL_TWO = 'Noise-cancelling headphones';
  const MEDICAL = 'Peanut allergy, EpiPen in the office';
  const BEHAVIOR = 'Check in at the door, two-minute break on request';
  const MEDICAL_TWO = 'Type 1 diabetes, tests before lunch';
  /*
    Two needle lists, and the difference between them is the whole reason this is not one.

    A STUDENT'S support data is every phrase above plus the rendered name of an accommodation kind.
    None of it may appear on a list view, in the editor before the panel is opened, or in
    localStorage — searched case-sensitively, so a surname like "Ellen" cannot be mistaken for the
    plan value "ELL".

    The plan words themselves — IEP, 504, ELL — are on the LIST-VIEW needle list only. Inside the
    editor they are the four buttons that name the options, present in the markup whether or not
    any of them is chosen, and a check that called that furniture a leak would be a check that can
    only pass by deleting the picker. What proves the student's plan is not on screen there is that
    none of those four reads as pressed, which the panel reader above reports.
  */
  const VALUE_NEEDLES = [CASE_NAME, CASE_EMAIL, REVIEW_DATE, DETAIL_ONE, DETAIL_TWO, MEDICAL,
    BEHAVIOR, MEDICAL_TWO, 'Extended time', 'extended-time', 'Something else'];
  const PLAN_NEEDLES = ['IEP', '504', 'ELL'];
  const NEEDLES = [...VALUE_NEEDLES, ...PLAN_NEEDLES];
  const foundIn = (text) => NEEDLES.filter(n => text.indexOf(n) >= 0);
  const foundValueIn = (text) => VALUE_NEEDLES.filter(n => text.indexOf(n) >= 0);
  /*
    A third matcher, for a JSON dump of localStorage only — where the plan words need a word
    boundary and everywhere else they must not have one.

    '504' is three digits and every epoch-millisecond stamp we write is thirteen of them.
    `planbook_lastBackupAt` held {"2026-2027":1786195504308,…} on 2026-08-08 and turned the storage
    check red about the clock, on the one check whose subject is accommodation data reaching
    storage. A control that goes red for a reason the reader learns to dismiss is worse than no
    control, because the dismissal is what survives.

    The boundary cannot hide a real leak here: anything written to localStorage arrives in this
    string as JSON, where a plan value is delimited — "504", "plan":"504", "has a 504 plan". It is
    NOT applied to `foundIn`, which reads DOM text: innerText runs adjacent nodes together, so a
    real leak can land as "504Smith" with no boundary at all, and a boundary there would be a way
    to miss one. Substring on screen, boundary in the store.
  */
  const foundInStore = (text) => [
    ...foundValueIn(text),
    ...PLAN_NEEDLES.filter(n => new RegExp(`\\b${n}\\b`).test(text)),
  ];

  const before = await openFullestRoster();
  const ids = await evalJs("(function(){ var doc = window.planbook.store.getDoc();"
    + " var open = window.planbook.classes.getSelectedClassId();"
    + " var c = doc.classes.filter(function(x){ return x.id === open; })[0];"
    + " return (c && c.roster ? c.roster : []).slice(0, 3); })()");

  if (!ids || ids.length < 3) {
    check('support details: a roster with three students to put support details on',
      false, 'the open class arrived with ' + (ids ? ids.length : 0)
        + ' students, so nothing below was driven');
    /* Announced rather than silently absent. WO-1.9's checks are driven against the fixture this
       section builds, so a fixture that never arrived takes them with it — and a suite that
       quietly shrinks still prints green (tools/README.md). */
    skip('presentation mode: the toggle, the suppression, and what survives a reload',
      'the support-details fixture never arrived, so there was nothing to suppress');
  } else {
    /* ── acceptance 1: every field in the block is editable, through the real controls ── */

    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
    const shutOnOpen = await evalJs('window.__panel()');
    check('the support panel is shut when the editor opens by the ordinary route, showing nothing',
      shutOnOpen.hidden === true && shutOnOpen.expanded === 'false'
        && shutOnOpen.label === 'Show support details'
        && shutOnOpen.plan.length === 0 && shutOnOpen.cards === 0
        && [shutOnOpen.caseName, shutOnOpen.caseEmail, shutOnOpen.reviewDate,
          shutOnOpen.medical, shutOnOpen.behaviorPlan].every(v => v === ''),
      'hidden = ' + shutOnOpen.hidden + ', plan buttons pressed = ' + shutOnOpen.plan.length
        + ', accommodation cards = ' + shutOnOpen.cards);

    await clickSel('[data-supports-reveal]');
    /* The four plan buttons are real markup in index.html and the four plan values live in
       src/supports.js, which is two lists that have to agree — and when they stop agreeing the
       symptom is a button that does nothing, because setPlan() refuses a value isPlan() does not
       know. Compared rather than trusted, in the order the data model writes them. */
    const planButtons = await evalJs(`(function(){
      return { markup: Array.prototype.map.call(
                 document.querySelectorAll('#supportsPlanRow [data-support-plan]'),
                 function(b){ return b.getAttribute('data-support-plan'); }),
               module: window.planbook.supports.PLANS.map(function(p){ return p.value; }) }; })()`);
    check('the plan buttons in the markup are exactly the plan values src/supports.js enumerates',
      JSON.stringify(planButtons.markup) === JSON.stringify(planButtons.module)
        && JSON.stringify(planButtons.module) === JSON.stringify(['none', 'IEP', '504', 'ELL']),
      'markup ' + JSON.stringify(planButtons.markup) + ' · module '
        + JSON.stringify(planButtons.module));
    await clickSel('#supportsPlanRow [data-support-plan="IEP"]');
    await typeField('supportsCaseManagerName', CASE_NAME);
    await typeField('supportsCaseManagerEmail', CASE_EMAIL);
    await typeField('supportsReviewDate', REVIEW_DATE);
    await typeField('supportsMedical', MEDICAL);
    await typeField('supportsBehaviorPlan', BEHAVIOR);
    await clickSel('[data-accommodation-add]');
    await clickSel('[data-accommodation-add]');
    /* The kind picker commits on `change`, which is what a <select> does and why src/shell.js
       routes it from the change listener rather than from the input one. */
    await evalJs(`(function(){
      var sel = document.querySelectorAll('#accommodationList [data-support-kind]');
      function pick(i, v){ sel[i].value = v;
        sel[i].dispatchEvent(new Event('change', { bubbles: true })); }
      pick(0, 'extended-time'); pick(1, 'other');
      var d = document.querySelectorAll('#accommodationList [data-student-field="accommodation.detail"]');
      var a = document.querySelectorAll('#accommodationList [data-student-field="accommodation.appliesTo"]');
      function set(e, v){ e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }
      set(d[0], ${JSON.stringify(DETAIL_ONE)}); set(a[0], 'tests, quizzes');
      set(d[1], ${JSON.stringify(DETAIL_TWO)});
      return 1; })()`);
    await new Promise(r => setTimeout(r, 200));

    const filled = await evalJs('window.__panel()');
    const stored = await evalJs('window.__sup(' + JSON.stringify(ids[0]) + ')');
    check('every field in the supports block is editable from the panel and lands in the document',
      !!stored && !!stored.supports
        && stored.supports.plan === 'IEP'
        && stored.supports.caseManager.name === CASE_NAME
        && stored.supports.caseManager.email === CASE_EMAIL
        && stored.supports.reviewDate === REVIEW_DATE
        && stored.supports.medical === MEDICAL
        && stored.supports.behaviorPlan === BEHAVIOR
        && stored.supports.accommodations.length === 2
        && stored.supports.accommodations[0].kind === 'extended-time'
        && stored.supports.accommodations[0].detail === DETAIL_ONE
        && filled.plan.length === 1 && filled.plan[0] === 'IEP' && filled.cards === 2,
      stored && stored.supports
        ? 'plan ' + stored.supports.plan + ', ' + stored.supports.accommodations.length
          + ' accommodation(s), case manager, review date, medical and behavior plan all stored'
        : 'no supports block on the student the editor was open on');
    check('`appliesTo` is an array of the words typed, and an empty one means everything',
      !!stored && Array.isArray(stored.supports.accommodations[0].appliesTo)
        && JSON.stringify(stored.supports.accommodations[0].appliesTo)
          === JSON.stringify(['tests', 'quizzes'])
        && Array.isArray(stored.supports.accommodations[1].appliesTo)
        && stored.supports.accommodations[1].appliesTo.length === 0,
      stored && stored.supports
        ? JSON.stringify(stored.supports.accommodations.map(a => a.appliesTo))
        : 'no supports block to read');
    check('and the record still carries exactly the keys the data model gives a student',
      !!stored && JSON.stringify(stored.keys) === JSON.stringify(['counselor', 'email', 'first',
        'gradYear', 'guardians', 'id', 'last', 'nickname', 'notes', 'supports']),
      stored ? JSON.stringify(stored.keys) : 'no student');

    /* Two more students, so the dots have something to differ by if they are going to. */
    await evalJs("window.planbook.closeModal('studentModal');1");
    await clickSel('#rosterList .roster-row:nth-child(2) [data-student-edit]');
    await clickSel('[data-supports-reveal]');
    await clickSel('#supportsPlanRow [data-support-plan="504"]');
    await evalJs("window.planbook.closeModal('studentModal');1");
    await clickSel('#rosterList .roster-row:nth-child(3) [data-student-edit]');
    await clickSel('[data-supports-reveal]');
    await typeField('supportsMedical', MEDICAL_TWO);
    await new Promise(r => setTimeout(r, 200));
    await evalJs("window.planbook.closeModal('studentModal');1");

    /* ── acceptance 4: reviewDate is stored and readable, through a save and a reload ── */

    await closeAllSupport();
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const supportReboot = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    await evalJs(INSTALL_CLASS_READER);
    await evalJs(INSTALL_ROSTER_READER);
    await evalJs(INSTALL_SUPPORT_READER);
    const reloadedSupport = await evalJs('window.__sup(' + JSON.stringify(ids[0]) + ')');
    check('the whole supports block comes back out of IndexedDB after a save and a reload',
      supportReboot && !!reloadedSupport && !!reloadedSupport.supports
        && JSON.stringify(reloadedSupport.supports) === JSON.stringify(stored.supports),
      supportReboot
        ? (reloadedSupport && reloadedSupport.supports
          ? 'identical to what was written, field for field'
          : 'the student came back without a supports block')
        : 'the loading screen never came down');
    check('reviewDate is stored and readable whether or not anything consumes it yet',
      !!reloadedSupport && reloadedSupport.supports
        && reloadedSupport.supports.reviewDate === REVIEW_DATE,
      reloadedSupport && reloadedSupport.supports
        ? 'reviewDate = ' + JSON.stringify(reloadedSupport.supports.reviewDate)
          + ' — no calendar reads it; WO-6.1 owns that'
        : 'no supports block to read');

    /* ── acceptance 2: no list view shows any of it without a deliberate tap ── */

    await openFullestRoster();
    const list = await evalJs('window.__rosterText()');
    check('the roster list shows a dot for each student who has something on file, and nothing else',
      list.rows >= 3 && list.dots === 3 && foundIn(list.text).length === 0,
      list.rows + ' rows, ' + list.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(list.text)));

    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
    const editorShut = await evalJs('window.__panel()');
    check('and opening the editor by Edit shows no plan, no accommodation, no medical, no behavior text',
      editorShut.hidden === true && editorShut.plan.length === 0 && editorShut.cards === 0
        && [editorShut.caseName, editorShut.caseEmail, editorShut.reviewDate, editorShut.medical,
          editorShut.behaviorPlan].every(v => v === '')
        && foundValueIn(editorShut.text).length === 0,
      'panel hidden = ' + editorShut.hidden + ', no plan button pressed, leaked into the dialog: '
        + JSON.stringify(foundValueIn(editorShut.text)));

    await clickSel('[data-supports-reveal]');
    const editorOpen = await evalJs('window.__panel()');
    check('one deliberate tap on that panel is what puts them on screen — and it really is them',
      editorOpen.hidden === false && editorOpen.expanded === 'true'
        && editorOpen.label === 'Hide support details'
        && JSON.stringify(editorOpen.plan) === JSON.stringify(['IEP'])
        && editorOpen.caseName === CASE_NAME && editorOpen.caseEmail === CASE_EMAIL
        && editorOpen.reviewDate === REVIEW_DATE && editorOpen.medical === MEDICAL
        && editorOpen.behaviorPlan === BEHAVIOR
        && editorOpen.cards === 2
        && JSON.stringify(editorOpen.kinds) === JSON.stringify(['extended-time', 'other'])
        && editorOpen.details[0] === DETAIL_ONE && editorOpen.applies[0] === 'tests, quizzes',
      'plan ' + JSON.stringify(editorOpen.plan) + ', cards ' + editorOpen.cards
        + ', kinds ' + JSON.stringify(editorOpen.kinds));
    await clickSel('[data-supports-reveal]');
    const editorShutAgain = await evalJs('window.__panel()');
    check('and tapping it again takes them back off, fields emptied rather than merely unpainted',
      editorShutAgain.hidden === true && editorShutAgain.plan.length === 0
        && editorShutAgain.cards === 0
        && [editorShutAgain.caseName, editorShutAgain.medical, editorShutAgain.behaviorPlan]
          .every(v => v === ''),
      'hidden = ' + editorShutAgain.hidden + ', cards = ' + editorShutAgain.cards);

    await evalJs("window.planbook.closeModal('studentModal');1");
    await clickSel('#rosterList .roster-row:nth-child(1) [data-supports-open]');
    const viaDot = await evalJs('window.__panel()');
    check('the dot is that deliberate tap: it opens the editor with the panel already showing',
      viaDot.hidden === false && viaDot.expanded === 'true'
        && JSON.stringify(viaDot.plan) === JSON.stringify(['IEP'])
        && viaDot.medical === MEDICAL,
      'panel hidden = ' + viaDot.hidden + ', plan = ' + JSON.stringify(viaDot.plan));
    await evalJs("window.planbook.closeModal('studentModal');1");
    const reopened = await evalJs("(function(){ window.planbook.roster.openStudentEditor("
      + JSON.stringify(ids[0]) + "); return window.__panel(); })()");
    check('and the next open is shut again — it is not a setting that stays where it was left',
      reopened.hidden === true && reopened.expanded === 'false' && reopened.plan.length === 0,
      'hidden = ' + reopened.hidden + ', expanded = ' + reopened.expanded);
    await evalJs("window.planbook.closeModal('studentModal');1");

    /* ── acceptance 3: the dot encodes nothing ── */

    /*
      The pointer is parked somewhere harmless first, and that is not housekeeping — it is what
      this check found on its first run. The last thing clicked above was row 1's dot, so the
      cursor was still resting on it: getComputedStyle returned that dot's `:hover` rule and the
      other two returned their resting one, and the run reported three dots that did not match.
      Which is exactly what a plan-coded dot would look like. A check whose failure mode is
      indistinguishable from the defect it exists for has to rule the artifact out rather than
      tolerate it, so the mouse goes to the corner instead of the hover properties coming out of
      the comparison — dropping background and border colour would leave this measuring almost
      nothing, which is the whole subject of tools/README.md's CDP section.
    */
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
    await new Promise(r => setTimeout(r, 100));
    const dots = await evalJs('window.__dots()');
    const looks = [...new Set(dots.map(d => d.look))];
    const glyphs = [...new Set(dots.map(d => d.text))];
    const classes = [...new Set(dots.map(d => d.cls))];
    check('three students with three different things on file get three identical dots',
      dots.length === 3 && looks.length === 1 && glyphs.length === 1 && classes.length === 1,
      dots.length + ' dot(s); distinct looks = ' + JSON.stringify(looks)
        + '; distinct glyphs = ' + JSON.stringify(glyphs));
    /* The label is the other half of the dot. A dot that said nothing and was announced as "IEP"
       would be a disclosure to the room the moment VoiceOver is on. */
    const PLAN_WORDS = /IEP|504|ELL|accommodat|medical|behavio|allerg|diabet/i;
    check('and neither its label nor its tooltip names a plan, a need, or an accommodation',
      dots.length === 3 && dots.every(d => d.label && d.title
        && d.label === d.title
        && /^Support details for /.test(d.label)
        && !PLAN_WORDS.test(d.label.replace(/^Support details for /, ''))),
      JSON.stringify(dots.map(d => d.label)));
    /* The row with nothing on file has no dot at all, which is what makes the dot mean anything —
       and is also the reason presentation mode has to be able to take it away (WO-1.9). */
    const bare = await evalJs("(function(){ var rows = document.querySelectorAll("
      + "'#rosterList .roster-row'); var n = 0;"
      + " Array.prototype.forEach.call(rows, function(r){"
      + "   if (!r.querySelector('[data-supports-open]')) n++; }); return n; })()");
    check('a student with nothing on file carries no indicator at all',
      bare === list.rows - 3, bare + ' of ' + list.rows + ' rows have no dot');

    /* ── acceptance 5: the backup names what it holds, and holds it ── */

    await closeAllSupport();
    await clickSel('header [data-backup-panel]');
    await new Promise(r => setTimeout(r, 300));
    const notice = await evalJs("(function(){ var m = document.getElementById('backupModal');"
      + " return { open: !!m && !m.classList.contains('hidden'),"
      + " text: (m ? m.textContent : '').replace(/\\s+/g, ' ') }; })()");
    check('the backup panel names accommodation, IEP/504, medical and behavior-plan data as being in the file',
      notice.open && /accommodation/i.test(notice.text) && /\bIEP\b/.test(notice.text)
        && /\b504\b/.test(notice.text) && /medical/i.test(notice.text)
        && /behavio(u)?r plan/i.test(notice.text),
      notice.open
        ? (notice.text.match(/It also contains[^.]*\./) || ['no "It also contains" sentence'])[0]
        : 'the backup panel did not open');
    /* And the claim is true. A notice that named data the file did not carry would be the same
       defect the other way round: the teacher would keep a backup she believed was complete. */
    const inFile = await evalJs(`(async function(){
      var f = await window.planbook.backup.buildBackup();
      var doc = JSON.parse(f.text);
      var s = doc.students.filter(function(x){ return x.id === ${JSON.stringify(ids[0])}; })[0] || {};
      var sup = s.supports || {};
      return { plan: sup.plan, medical: sup.medical, behaviorPlan: sup.behaviorPlan,
               reviewDate: sup.reviewDate,
               caseManager: (sup.caseManager || {}).name,
               accommodations: (sup.accommodations || []).length }; })()`);
    check('and the file really does carry them, so the notice is a fact rather than a promise',
      inFile.plan === 'IEP' && inFile.medical === MEDICAL && inFile.behaviorPlan === BEHAVIOR
        && inFile.reviewDate === REVIEW_DATE && inFile.caseManager === CASE_NAME
        && inFile.accommodations === 2,
      'plan ' + JSON.stringify(inFile.plan) + ', ' + inFile.accommodations
        + ' accommodation(s), medical and behavior plan present in the downloaded JSON');
    await closeAllSupport();

    /* Nothing sensitive may reach localStorage, which is where a "remember the panel was open"
       preference would have gone if anyone had written one. Read out of the browser rather than
       out of prefs.js, because what is being asserted is what is in the browser. */
    const supportLocal = await readLocalStore(evalJs, 400);
    const supportBlob = JSON.stringify(supportLocal);
    check('no support detail, and no memory of the panel being open, reached localStorage, and every key present is ours',
      oursIn(supportLocal).length > 0
        && foreignIn(supportLocal).length === 0
        && foundInStore(supportBlob).length === 0
        && !/supports|accommodat|reveal/i.test(supportBlob),
      storeDetail(supportLocal));

    /* ───────────────── WO-1.9: presentation mode ─────────────────
     *
     * Driven here, inside the support-details section, and sharing its fixture on purpose: what
     * presentation mode has to suppress is three students with an IEP, a 504, two accommodations,
     * a case manager, a review date, a medical note and a behavior plan, all of it already in the
     * document above. A second fixture would be a second thing to keep in step, and — worse — a
     * fixture built after the switch was thrown could be empty for the wrong reason and every
     * absence check below would pass over nothing.
     *
     * Four things these checks are shaped to be able to fail:
     *
     *   1. ABSENT, NOT HIDDEN. The claim is not that support data stops being painted, it is that
     *      it stops being in the page — `display: none` is still reachable by a screenshot tool,
     *      a find-in-page and the accessibility tree. So the sweep is over the WHOLE document's
     *      text plus the value of every input, select and textarea in it, hidden ones included,
     *      and it runs with dialogs open rather than closed.
     *   2. WHAT IS ALREADY ON SCREEN. The roster panel is left open across the flip and is never
     *      reopened, because suppression that only reaches the next render leaves the screen the
     *      teacher is looking at exactly as it was — which is the screen she flipped the switch
     *      for.
     *   3. AN ABSENCE WITH NOTHING BEHIND IT IS NOT EVIDENCE. The mode is turned back off at the
     *      end and the same data is required to come back. Without that, a build that had simply
     *      lost the fixture would report a clean pass.
     *   4. THE STATE IS VISIBLE. Measured rather than asserted: the button's own computed fill is
     *      read off in both states and required to differ and to be the solid white the header's
     *      active grammar uses. The pointer is parked first — trap 7 in tools/README.md, found by
     *      the dots check above, and this check would have walked into it the same way.
     */

    console.log('\n--- presentation mode ---');

    /* One page-side reader for the mode, re-installed after the reload below like every other. It
       reads the CHROME and the SWITCH, never the preference name twice: the harness asks the app
       what it thinks the mode is, so a check cannot agree with itself and disagree with the app. */
    const INSTALL_PRESENTATION_READER = `(function(){
      window.__pres = function(){
        var b = document.getElementById('presentationBtn');
        var strip = document.getElementById('presentationStrip');
        var box = b ? b.getBoundingClientRect() : null;
        var cs = b ? getComputedStyle(b) : null;
        return {
          hasButton: !!b,
          inHeader: !!(b && b.closest('header')),
          hook: b ? b.hasAttribute('data-presentation-toggle') : false,
          pressed: b ? b.getAttribute('aria-pressed') : null,
          label: b ? b.getAttribute('aria-label') : null,
          title: b ? b.getAttribute('title') : null,
          look: cs ? [cs.backgroundColor, cs.color, cs.borderTopColor].join(' | ') : null,
          size: box ? Math.round(box.width) + 'x' + Math.round(box.height) : null,
          stripShown: !!(strip && !strip.classList.contains('hidden')),
          stripText: strip ? strip.textContent.replace(/\\s+/g, ' ').trim() : null,
          stripHasOff: !!(strip && strip.querySelector('[data-presentation-toggle]')),
          visible: window.planbook.supports.supportsVisible(),
          stored: localStorage.getItem('planbook_presentationMode')
        };
      };
      /* The absence claim, over the whole document rather than over the elements this harness
         happens to know the names of — including every hidden one, which is the entire point. */
      window.__leak = function(){
        var vals = Array.prototype.map.call(
          document.querySelectorAll('input, textarea, select'), function(e){ return e.value; });
        return { text: document.documentElement.textContent.replace(/\\s+/g, ' '),
                 values: vals.join(' | '),
                 dots: document.querySelectorAll('[data-supports-open]').length };
      };
      return 1; })()`;
    await evalJs(INSTALL_PRESENTATION_READER);

    /* Park the pointer before every read of the button's fill. The last thing clicked is otherwise
       sitting under the cursor and measures its :hover rule, which is how a colour comparison
       reports a difference that is not there — or hides one that is. */
    const park = async () => {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
      await new Promise(r => setTimeout(r, 100));
    };

    /* Every dialog down first, and that is not tidiness: a `.modal-overlay` is fixed at inset 0
       over the whole viewport, so a click aimed at the header while one is open lands on the scrim
       and is a backdrop dismissal instead. The classes-manager block further down hits the same
       thing and says so. It is also true of the app — a teacher cannot reach the header toggle
       without closing the dialog she is in — which is exactly why the redraw checks below matter
       for the screens Phase 2 puts in <main> rather than in a modal. */
    await closeAllSupport();
    await park();
    const modeOff = await evalJs('window.__pres()');
    check('presentation mode ships off, and its toggle is a header control with a state to read',
      modeOff.hasButton && modeOff.inHeader && modeOff.hook
        && modeOff.pressed === 'false' && modeOff.visible === true
        && modeOff.stripShown === false
        && !!modeOff.label && modeOff.label === modeOff.title,
      'in header = ' + modeOff.inHeader + ', aria-pressed = ' + modeOff.pressed
        + ', strip shown = ' + modeOff.stripShown);

    /* The flip, through the real header button with a real mouse. */
    await clickSel('header [data-presentation-toggle]');
    await park();
    const modeOn = await evalJs('window.__pres()');
    check('one tap on it turns every support field in the app off at the one switch',
      modeOn.pressed === 'true' && modeOn.visible === false,
      'aria-pressed = ' + modeOn.pressed + ', supportsVisible() = ' + modeOn.visible);
    check('the toggle says so without being hunted for: a different fill, a changed label, and a strip',
      modeOn.look !== modeOff.look && modeOn.look.indexOf('rgb(255, 255, 255)') === 0
        && modeOn.label !== modeOff.label && modeOn.label === modeOn.title
        && modeOn.stripShown === true && modeOn.stripHasOff === true
        && /Presentation mode is on/.test(modeOn.stripText),
      'off = ' + modeOff.look + ' · on = ' + modeOn.look + ' · strip: '
        + (modeOn.stripText || '').slice(0, 80));

    /* A roster opened while the mode is already on. */
    await openFullestRoster();
    const rosterUnderMode = await evalJs('window.__rosterText()');
    check('a roster opened while it is on arrives with no indicator dots and no support text',
      rosterUnderMode.rows >= 3 && rosterUnderMode.dots === 0
        && foundIn(rosterUnderMode.text).length === 0,
      rosterUnderMode.rows + ' rows, ' + rosterUnderMode.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(rosterUnderMode.text)));

    /*
      AND THE SCREEN THAT IS ALREADY ON THE GLASS, flipped both ways with the panel never reopened.

      Driven with element.click() rather than a mouse, for the reason the closeAllSupport() above
      gives: the roster panel has to STAY open for this check to mean anything, and while it is
      open no physical click can reach the header at all. What el.click() skips is the browser's
      hit testing, which the real tap above already proved; what it goes through is the same
      delegated listener in src/shell.js that a thumb goes through, which is the path under test.
    */
    const flipFromHeader = () => evalJs(
      "document.querySelector('header [data-presentation-toggle]').click(); 1");
    await flipFromHeader();
    await new Promise(r => setTimeout(r, 200));
    const rosterLit = await evalJs('window.__rosterText()');
    check('flipping it off redraws the roster that is already open — the dots come back, no reopen',
      rosterLit.rows === rosterUnderMode.rows && rosterLit.dots === 3,
      rosterLit.rows + ' rows, ' + rosterLit.dots + ' dot(s) back on a panel nobody reopened');
    await flipFromHeader();
    await new Promise(r => setTimeout(r, 200));
    const rosterAfter = await evalJs('window.__rosterText()');
    check('and flipping it on takes them off the screen she is looking at, without a reopen',
      rosterAfter.rows === rosterUnderMode.rows && rosterAfter.dots === 0
        && foundIn(rosterAfter.text).length === 0,
      rosterAfter.rows + ' rows still listed, ' + rosterAfter.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(rosterAfter.text)));

    /* The editor, opened the only way left — the dot it used to be reachable by is gone. */
    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
    const panelUnderMode = await evalJs('window.__panel()');
    const revealState = await evalJs(`(function(){
      var b = document.getElementById('supportsRevealBtn');
      var hint = document.getElementById('supportsHint');
      var alt = document.getElementById('supportsHintPresentation');
      return { disabled: !!(b && b.disabled),
               ordinaryHintShown: !!(hint && !hint.classList.contains('hidden')),
               modeHintShown: !!(alt && !alt.classList.contains('hidden')),
               modeHint: alt ? alt.textContent.replace(/\\s+/g, ' ').trim() : null }; })()`);
    check('the support panel cannot be opened at all, and says why rather than looking broken',
      panelUnderMode.hidden === true && panelUnderMode.plan.length === 0
        && panelUnderMode.cards === 0
        && [panelUnderMode.caseName, panelUnderMode.caseEmail, panelUnderMode.reviewDate,
          panelUnderMode.medical, panelUnderMode.behaviorPlan].every(v => v === '')
        && revealState.disabled === true
        && revealState.modeHintShown === true && revealState.ordinaryHintShown === false
        && /nothing has been deleted/i.test(revealState.modeHint || ''),
      'reveal disabled = ' + revealState.disabled + ', mode hint shown = '
        + revealState.modeHintShown + ' :: ' + (revealState.modeHint || '').slice(0, 60));
    /* And tapping it anyway does nothing — the control is refused in the module, not only greyed
       out in the stylesheet. A disabled attribute is one line away from being removed by a later
       work order's CSS, and the refusal has to survive that. */
    await evalJs("document.getElementById('supportsRevealBtn').removeAttribute('disabled');"
      + "window.planbook.roster.toggleSupports(); 1");
    const forced = await evalJs('window.__panel()');
    check('and forcing the control open anyway still shows nothing — the refusal is in the module',
      forced.hidden === true && forced.plan.length === 0 && forced.cards === 0
        && forced.medical === '' && forced.behaviorPlan === '',
      'panel hidden = ' + forced.hidden + ', cards = ' + forced.cards);

    /* THE ABSENCE CLAIM, over the whole document with the editor open. */
    const leak = await evalJs('window.__leak()');
    check('none of it is anywhere in the DOM — not hidden in it, absent from it',
      foundValueIn(leak.text).length === 0 && foundValueIn(leak.values).length === 0
        && leak.dots === 0,
      'document text leaked: ' + JSON.stringify(foundValueIn(leak.text))
        + ' · control values leaked: ' + JSON.stringify(foundValueIn(leak.values))
        + ' · indicator dots anywhere on the page: ' + leak.dots);

    /* A SCREEN WRITTEN AFTER THIS WORK ORDER inherits the suppression, and this is the form of
       that claim a harness can actually falsify: the two funnels every renderer hands its strings
       to are driven directly, with no screen involved. A screen that uses them is suppressed
       whether or not its author knew presentation mode existed — which is the whole reason the
       rule lives at the render helper rather than in a conditional per screen. */
    const funnels = await evalJs(`(function(){
      var s = window.planbook.supports;
      var el = document.createElement('span');
      s.setSensitiveText(el, ${JSON.stringify(MEDICAL)});
      return { value: s.sensitiveValue(${JSON.stringify(CASE_NAME)}),
               text: el.textContent,
               visible: s.supportsVisible() }; })()`);
    check('a screen built later inherits it: both render funnels return nothing while the mode is on',
      funnels.visible === false && funnels.value === '' && funnels.text === '',
      'sensitiveValue() = ' + JSON.stringify(funnels.value)
        + ', setSensitiveText() wrote ' + JSON.stringify(funnels.text));

    /* ── acceptance 3: it survives a reload and an app relaunch ── */

    await closeAllSupport();
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const modeReboot = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    await evalJs(INSTALL_CLASS_READER);
    await evalJs(INSTALL_ROSTER_READER);
    await evalJs(INSTALL_SUPPORT_READER);
    await evalJs(INSTALL_PRESENTATION_READER);
    await park();
    const afterReload = await evalJs('window.__pres()');
    check('it survives a reload: the mode, the pressed toggle, and the strip all come back on',
      modeReboot && afterReload.visible === false && afterReload.pressed === 'true'
        && afterReload.stripShown === true && afterReload.stored === 'true',
      modeReboot
        ? 'supportsVisible() = ' + afterReload.visible + ', aria-pressed = ' + afterReload.pressed
          + ', planbook_presentationMode = ' + afterReload.stored
        : 'the loading screen never came down');
    await openFullestRoster();
    const rosterReloaded = await evalJs('window.__rosterText()');
    check('and the roster comes back up already quiet, rather than quiet only after a redraw',
      rosterReloaded.rows >= 3 && rosterReloaded.dots === 0
        && foundIn(rosterReloaded.text).length === 0,
      rosterReloaded.rows + ' rows, ' + rosterReloaded.dots + ' dot(s), leaked: '
        + JSON.stringify(foundIn(rosterReloaded.text)));

    /* ── and back off again, which is what makes every absence above evidence ── */

    /* Through the strip's own "Turn it off", with a real mouse — so the second of the two controls
       that carry the hook is driven the way a teacher drives it, and not only the header one.
       Dialogs down first, for the scrim reason above. */
    await closeAllSupport();
    await clickSel('#presentationStrip [data-presentation-toggle]');
    await park();
    const modeBackOff = await evalJs('window.__pres()');
    await openFullestRoster();
    const rosterBack = await evalJs('window.__rosterText()');
    check('the strip\'s own control turns it back off, and every dot returns',
      modeBackOff.visible === true && modeBackOff.pressed === 'false'
        && modeBackOff.stripShown === false && modeBackOff.stored === 'false'
        && rosterBack.dots === 3,
      'supportsVisible() = ' + modeBackOff.visible + ', dots back = ' + rosterBack.dots);
    await clickSel('#rosterList .roster-row:nth-child(1) [data-supports-open]');
    const restored = await evalJs('window.__panel()');
    check('and the data behind the absence was never touched — it is all still on the student',
      restored.hidden === false && JSON.stringify(restored.plan) === JSON.stringify(['IEP'])
        && restored.medical === MEDICAL && restored.behaviorPlan === BEHAVIOR
        && restored.caseName === CASE_NAME && restored.reviewDate === REVIEW_DATE
        && restored.cards === 2,
      'plan ' + JSON.stringify(restored.plan) + ', ' + restored.cards
        + ' accommodation card(s), medical and behavior plan back exactly as they were');
    await evalJs("window.planbook.closeModal('studentModal');1");

    /* The preference is a switch position and nothing else. `planbook_presentationMode` is the one
       key WO-1.9 adds, and what it may hold is `true` or `false` — anything longer is somebody
       having stored a state instead of a state's name. */
    const modePref = await evalJs("localStorage.getItem('planbook_presentationMode')");
    check('the preference it persists is a bare boolean, not a state carried in localStorage',
      modePref === 'true' || modePref === 'false',
      'planbook_presentationMode = ' + JSON.stringify(modePref));
  }

  await closeAllSupport();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  /* The open class is left where the roster section left it, for the reason that section gives:
     the overflow sweep at the bottom measures the term nav of whatever is open. */
  if (before && before.tab !== 1) await clickSel('[data-class-tab]', 1);
}

/* ───────────────── assignments and the screen switcher (WO-3.3) ─────────────────
 *
 * Five of WO-3.3's seven acceptance lines are driven here in full, and two are driven as far as
 * anything in this build can take them. Everything is done through the controls a teacher touches:
 * the segmented strip under the panel title, the real "+ New assignment", the real name, points,
 * category and date fields, the real Duplicate dialog with its real class pills, and the real
 * delete confirm. The window.planbook.assignments seam is used only to READ.
 *
 * TWO LINES NAME A GRADE AND THERE IS NO GRADE IN THIS APP. "does not break any grade calculation"
 * and "the grade updates" both need WO-3.4's engine and WO-3.5's grid, neither of which exists, and
 * building either here is what WO-3.4's Out of scope line forbids. So the halves that exist are
 * measured and the halves that do not are re-homed in the work order rather than faked here:
 * a `0` typed into the points field survives typing, re-rendering and a reload as `0` — never
 * defaulted, never rejected — and an assignment moves between categories with its score column
 * following it untouched.
 *
 * WHY A SCORE IS PLANTED THROUGH THE SEAM. There is no score entry anywhere in this build (WO-3.5
 * owns it), so the only way to have a score column at all is to write one. Every claim ABOUT that
 * column is then read back off the real screen and the real dialogs — the coverage bar, the count
 * in the delete confirm, and the column surviving a move between categories.
 *
 * THE TRAP CHECK IS THE ONE TO KEEP. WO-3.3's Traps line says a duplicate must not carry its
 * source's `categoryId` into another class, because a category removal in the first class would
 * then destroy work in the second under a dialog naming the first. Two checks stand on it: the copy
 * is asserted to carry the TARGET's own category id (or none) and never the source's, and a foreign
 * assignment is planted carrying this class's `categoryId` with another class's `classId` — where
 * it must be absent from this list AND absent from the count in the category-removal confirm. The
 * second one goes red against the build this work order started from, which is what makes it worth
 * its lines.
 *
 * WHAT IS NOT HERE AND IS OWED TO A HUMAN: whether five controls in an assignment row are
 * distinguishable under a thumb (design/mockups/README.md's open question 4), whether iPadOS offers
 * the numeric keypad for the points field, and whether the date picker's Clear behaves on the
 * hardware the way the rebuild below assumes. The touch section measures the boxes; it cannot press
 * them.
 */

console.log('\n--- assignments and the screen switcher ---');

const assignSeam = await evalJs("!!(window.planbook && window.planbook.assignments"
  + " && typeof window.planbook.assignments.renderAssignments === 'function'"
  + " && window.planbook.screenNav"
  + " && typeof window.planbook.screenNav.setDetailBreadcrumb === 'function')");

if (!classesBooted || !classSeam || !assignSeam) {
  skip('assignments: the list as a view, the three-tab switcher, a zero-point assignment, a move between categories, a duplicate with no scores, and a delete that counts',
    classesBooted
      ? 'no window.planbook.assignments / screenNav seam on the page — both are kept deliberately for this file to read a copy and the breadcrumb rule through, so their absence is a defect and not a stage of the build'
      : 'the app did not boot before this section');
} else {
  /* Everything this section reads off the SCREEN, in two page-side helpers, so a check is one round
     trip and the reads cannot drift between checks. `__assign` is the list; `__strip` is the
     switcher, which is drawn on every class screen and therefore has to be read as a set rather
     than as one element. */
  const INSTALL_ASSIGN_READER = `(function(){
    window.__assign = function(){
      var view = document.getElementById('assignmentsView');
      var body = document.getElementById('assignmentsBody');
      var rows = Array.prototype.slice.call(body.querySelectorAll('tr'));
      var data = rows.filter(function(r){ return !!r.querySelector('.assign-name'); });
      var wrap = document.querySelector('#assignmentsView .assign-table-wrap');
      var empty = document.getElementById('assignmentsEmpty');
      return {
        shown: !view.classList.contains('hidden'),
        classShown: !document.getElementById('classView').classList.contains('hidden'),
        homeShown: !document.getElementById('homeView').classList.contains('hidden'),
        /* A view lives in <main>. A dialog would not, and would carry the semantics below. */
        inMain: !!view.closest('main'),
        dialogBits: view.querySelectorAll('[role="dialog"], [aria-modal], .modal-overlay').length,
        openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        managerOpen: !document.getElementById('classesModal').classList.contains('hidden'),
        heading: (document.getElementById('assignmentsClassName')||{}).textContent,
        summary: (document.getElementById('assignmentsSummary')||{}).textContent,
        emptyText: empty ? empty.textContent : '',
        emptyHidden: empty ? empty.classList.contains('hidden') : null,
        wrapHidden: wrap ? wrap.classList.contains('hidden') : null,
        names: data.map(function(r){ return r.querySelector('.assign-name').textContent; }),
        points: data.map(function(r){ return r.querySelector('.assign-pts').textContent; }),
        dates: data.map(function(r){ return Array.prototype.slice.call(
          r.querySelectorAll('.assign-date')).map(function(d){ return d.textContent; }); }),
        counts: data.map(function(r){ return (r.querySelector('.assign-count')||{}).textContent; }),
        extras: data.map(function(r){ return !!r.querySelector('.assign-extra'); }),
        overdue: body.querySelectorAll('.assign-date.overdue').length,
        rowButtons: data.length ? data[0].querySelectorAll('.assign-row-actions button').length : 0,
        groups: rows.filter(function(r){ return r.classList.contains('assign-group-head'); })
          .map(function(r){ return r.querySelector('.assign-group-title').textContent
            .replace(/\\s+/g, ' ').trim(); }),
        notes: Array.prototype.slice.call(body.querySelectorAll('.assign-group-empty'))
          .map(function(p){ return p.textContent.replace(/\\s+/g, ' ').trim(); }),
        orphans: Array.prototype.slice.call(body.querySelectorAll('.assign-group-orphan'))
          .map(function(p){ return p.textContent.replace(/\\s+/g, ' ').trim(); }),
        /* An assignment name and a category name are both teacher-typed, and one of each below
           carries markup on purpose. The chip's own <b> holds the weight, so it is excluded by
           asking the NAME cells and the group titles rather than the whole table. */
        injected: body.querySelectorAll('.assign-name b, .assign-name i, .assign-name script,'
          + ' .assign-group-title b:not(.cat-chip b), .assign-group-title i').length,
        chips: body.querySelectorAll('.cat-chip').length
      };
    };
    window.__strip = function(){
      return Array.prototype.slice.call(document.querySelectorAll('[data-screen-nav]'))
        .map(function(s){
          var btns = Array.prototype.slice.call(s.querySelectorAll('.screen-nav-btn'));
          return {
            /* Visible ones only tell you what a teacher can reach; both strips are read so that a
               hidden one cannot be holding a stale active mark or a name it should not have. */
            visible: !!s.offsetParent,
            inHeader: !!s.closest('.header'),
            inMain: !!s.closest('main'),
            labels: btns.map(function(b){ return b.textContent; }),
            hooks: btns.map(function(b){ return b.getAttribute('data-class-screen'); }),
            active: btns.map(function(b){ return b.classList.contains('active'); }),
            current: btns.map(function(b){ return b.getAttribute('aria-current'); }),
            disabled: btns.map(function(b){ return b.disabled; }),
            detail: s.querySelectorAll('.screen-nav-btn.detail').length
          };
        });
    };
    window.__adoc = function(){
      var d = window.planbook.store.getDoc();
      return {
        rev: d.rev,
        assignments: d.assignments.map(function(a){ return { id:a.id, classId:a.classId,
          termId:a.termId, categoryId:a.categoryId, name:a.name, points:a.points,
          assigned:a.assigned, due:a.due }; }),
        scoreKeys: Object.keys(d.scores),
        scores: JSON.stringify(d.scores),
        /* Parsed, because src/prefs.js stores every preference as JSON — the raw string carries
           its own quotation marks, and a check comparing it to the bare word would go red about
           the storage format rather than about the rule. (No backticks in this comment: it is
           inside a template literal.) */
        openView: JSON.parse(localStorage.getItem('planbook_openView') || 'null')
      };
    }; return 1; })()`;
  await evalJs(INSTALL_ASSIGN_READER);

  /* Typing into the editor, through the real field and the real delegated listener: setting
     `.value` and dispatching `input` is the path a keystroke takes, and shell.js reads the element
     rather than the event's provenance. */
  const typeField = async (field, value) => {
    await evalJs(`(function(){
      var f = document.querySelector('#assignmentFields [data-assignment-field="${field}"]');
      if (!f) return 0;
      f.value = ${JSON.stringify(String(value))};
      f.dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 120));
  };
  /* A <select> commits on `change`, which is the event src/shell.js listens for on both of these —
     dispatching `input` here would prove nothing about the path a tap takes. */
  const pickSelect = async (sel, value) => {
    await evalJs(`(function(){
      var s = document.querySelector(${JSON.stringify(sel)});
      if (!s) return 0;
      s.value = ${JSON.stringify(String(value))};
      s.dispatchEvent(new Event('change', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
  };
  const closeAssignDialogs = () => evalJs("['assignmentDeleteModal','assignmentCopyModal',"
    + "'assignmentModal','categoriesModal','classesModal','rosterModal','studentModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); 1");

  await closeAssignDialogs();

  /*
    WHICH CLASS THIS SECTION WORKS IN, chosen off the document rather than written down: the biggest
    roster among the classes that have both a term and a category, because the coverage bar's
    denominator is the roster and a class with none of it would make three checks vacuous. The
    duplicate's target is another active class with a term of its own.
  */
  const stage = await evalJs(`(function(){
    var c = window.planbook.classes; var d = window.planbook.store.getDoc();
    var live = c.getActiveClasses().map(function(cls){
      return { id: cls.id, name: cls.name, roster: (cls.roster||[]).length,
        terms: c.getTerms(cls.id).map(function(t){ return t.id; }),
        catIds: (cls.categories||[]).map(function(k){ return k.id; }),
        catNames: (cls.categories||[]).map(function(k){ return k.name; }),
        catWeights: (cls.categories||[]).map(function(k){ return Number(k.weight) || 0; }) };
    });
    var usable = live.filter(function(x){ return x.terms.length && x.catIds.length; });
    var source = usable.slice().sort(function(a, b){ return b.roster - a.roster; })[0] || null;
    var target = usable.filter(function(x){ return source && x.id !== source.id; })[0] || null;
    return { source: source, target: target, classes: live,
      tabs: Array.prototype.slice.call(document.querySelectorAll('#classTabBar [data-class-tab]'))
        .map(function(b){ return b.getAttribute('data-class-tab'); }) };
  })()`);

  if (!stage.source || !stage.target) {
    skip('assignments: the list, the switcher, the zero-point field, the duplicate and the delete',
      'this run did not leave two classes with a term and a category each, so there is nothing to '
      + 'file work in — the fixture is the defect, not the app');
  } else {
    const src = stage.source;
    const dst = stage.target;

    /* Into the source class the way a teacher does — a tab on the header strip, which also puts
       the class view up. The class manager is not opened anywhere in this block, which is half of
       acceptance line 5. */
    const tabIndex = stage.tabs.indexOf(src.id);
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);

    /*
      TWO STUDENTS, IF THIS CLASS HAS NONE — added through the real roster form, and taken out again
      at the end of this section so the sections after it see the document they expect.

      The coverage bar's denominator IS the roster, so a class with an empty one turns three checks
      below into `0/0`, which is a number that passes whatever the app does. The only class this run
      leaves with a roster is the one restored from a pre-WO-3.1 backup, which has neither terms nor
      categories and so cannot hold an assignment at all — hence a fixture rather than a hunt.
      Deliberately not added to that class: the attendance section asserts it draws exactly 26 rows,
      and a fixture that quietly changed another section's arithmetic is worse than no fixture.
    */
    let planted = [];
    if (src.roster === 0) {
      await clickSel('#headerRightControls [data-roster-manage]');
      for (const who of ['Coverage, Ada', 'Coverage, Bo']) {
        await evalJs('(function(){ document.getElementById("rosterNewInput").value = '
          + JSON.stringify(who) + '; return 1; })()');
        await clickSel('[data-roster-create] button[type="submit"]');
      }
      planted = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
        var cls = d.classes.filter(function(c){ return c.id === ${JSON.stringify(src.id)}; })[0];
        return (cls.roster || []).slice(); })()`);
      await evalJs("window.planbook.closeModal('rosterModal'); 1");
    }
    const rosterSize = planted.length || src.roster;
    check('the coverage fixture is real: this class has a roster for the bar to be a fraction of',
      rosterSize >= 2,
      rosterSize + ' student(s) on ' + src.name
        + (planted.length ? ' (added here through the roster form, removed again below)' : ''));

    /*
      ACCEPTANCE LINE 7, first half — and it is asserted on BOTH strips, because they are two
      renderings of one control drawn by one module and a build that painted only the visible one
      would flash the wrong active segment for a frame on every switch.

      Three segments, named, in order, with no fourth. A student's name is not among them: WO-3.7's
      per-student detail is reached by tapping a name, and the owner's 2026-08-09 decision is that
      it is deliberately not a tab (plans/gradebook-surfaces.md).
    */
    const stripOnClass = await evalJs('window.__strip()');
    const wantLabels = ['Attendance', 'Assignments', 'Scores'];
    check('the switcher carries exactly three tabs — Attendance, Assignments, Scores — and no student tab',
      stripOnClass.length >= 2
        && stripOnClass.every((s) => JSON.stringify(s.labels) === JSON.stringify(wantLabels))
        && stripOnClass.every((s) => s.detail === 0)
        && stripOnClass.some((s) => s.visible),
      stripOnClass.length + ' strip(s): ' + JSON.stringify(stripOnClass.map((s) => s.labels)));
    /* And it is on the white panel in <main>, never in the navy header — a measurement rather than
       a taste: src/classes.js records that a fourth control up there overflows at 390px. */
    check('the strip sits on the panel inside <main> rather than in the header strip',
      stripOnClass.every((s) => s.inMain && !s.inHeader),
      'inMain ' + JSON.stringify(stripOnClass.map((s) => s.inMain))
        + ', inHeader ' + JSON.stringify(stripOnClass.map((s) => s.inHeader)));
    /* All three carry their hook and none is disabled since WO-3.5 landed #scoresView. This check
       asserted the OPPOSITE of the third one until 2026-08-10 — "Scores is drawn but not yet
       reachable" — and stayed green through a build that shipped the view with its only door greyed
       out, because src/screen-nav.js still held a hardcoded `pending` string. That is the shape of a
       check that outlives the state it describes: it went on measuring the build it was written
       against. It is worded as a question about the SET now, so the day a fourth screen is drawn
       ahead of its view the disabled one is named rather than assumed. */
    check('Attendance is the active segment on a freshly opened class, and all three segments carry their hook',
      stripOnClass.every((s) => s.active[0] === true && s.current[0] === 'true')
        && stripOnClass.every((s) => s.disabled.every((d) => d === false))
        && stripOnClass.every((s) => s.hooks[0] === 'class' && s.hooks[1] === 'assignments'
          && s.hooks[2] === 'scores'),
      'active ' + JSON.stringify(stripOnClass[0].active)
        + ', disabled ' + JSON.stringify(stripOnClass[0].disabled)
        + ', hooks ' + JSON.stringify(stripOnClass[0].hooks));

    /*
      ACCEPTANCE LINE 5. One tap on the strip, and what arrives is a VIEW: a sibling of #homeView
      and #classView inside <main>, carrying no dialog semantics of its own, with no overlay open
      behind or in front of it — and the class manager never opened on the way.
    */
    await clickSel('#classView [data-class-screen="assignments"]');
    const listUp = await evalJs('window.__assign()');
    check('the assignment list is a view in <main>, not a dialog, and one tap on the strip gets there',
      listUp.shown && !listUp.classShown && !listUp.homeShown && listUp.inMain
        && listUp.dialogBits === 0 && listUp.openModals === 0 && !listUp.managerOpen,
      'shown ' + listUp.shown + ', in <main> ' + listUp.inMain + ', dialog bits '
        + listUp.dialogBits + ', open overlays ' + listUp.openModals);
    const stripOnList = await evalJs('window.__strip()');
    check('the class\'s screens are switchable without passing through the class manager, and the active segment followed',
      stripOnList.every((s) => s.active[1] === true && s.active[0] === false
        && s.current[1] === 'true')
        && stripOnList.some((s) => s.visible),
      'active ' + JSON.stringify(stripOnList[0].active));

    /*
      A CLASS WITH NO WORK IN IT SAYS SO. The empty state is a sentence naming the class and the
      term rather than a table of headings with nothing under them — the roster's own idiom.
    */
    check('an empty list says so in words, naming the class and the term, with no table drawn',
      listUp.wrapHidden === true && listUp.emptyHidden === false
        && listUp.emptyText.indexOf(src.name) >= 0 && /New assignment/.test(listUp.emptyText)
        && listUp.names.length === 0,
      JSON.stringify(listUp.emptyText.slice(0, 110)));

    /*
      ACCEPTANCE LINE 4, and it is the one that is easiest to satisfy by accident and easiest to
      lose by accident too. A brand-new assignment's dates are EMPTY — not today, not the term's
      start, and above all not "the next time this class meets", which would need the schedule model
      plans/rotating-schedule.md deleted. Asserted in the document and on the two fields at once.
    */
    await clickSel('#assignmentsView [data-assignment-new]');
    const fresh = await evalJs(`(function(){
      var doc = window.__adoc();
      var mine = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(src.id)}; });
      var fields = {};
      ['name','points','assigned','due'].forEach(function(f){
        var el = document.querySelector('#assignmentFields [data-assignment-field="' + f + '"]');
        fields[f] = el ? el.value : null;
      });
      var cat = document.querySelector('#assignmentFields [data-assignment-category]');
      return { made: mine[mine.length - 1] || null, count: mine.length, fields: fields,
        editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
        catOptions: cat ? cat.options.length : 0, catValue: cat ? cat.value : null,
        dateInputs: document.querySelectorAll('#assignmentFields input[type="date"]').length }; })()`);
    check('no date field auto-populates: a new assignment arrives with both dates empty, in the document and on the fields',
      !!fresh.made && fresh.made.assigned === '' && fresh.made.due === ''
        && fresh.fields.assigned === '' && fresh.fields.due === '' && fresh.dateInputs === 2
        && fresh.editorOpen,
      JSON.stringify({ assigned: fresh.made && fresh.made.assigned, due: fresh.made && fresh.made.due,
        fields: fresh.fields.assigned + '|' + fresh.fields.due }));
    /* It lands in the open class and the open term, filed under the class's first category —
       which is a starting point rather than a guess at a better one, and the select offers the
       rest. */
    check('a new assignment belongs to the open class, the open term and one of that class\'s own categories',
      fresh.made.classId === src.id && src.terms.indexOf(fresh.made.termId) >= 0
        && src.catIds.indexOf(fresh.made.categoryId) >= 0
        && fresh.catValue === fresh.made.categoryId
        && fresh.catOptions === src.catIds.length,
      JSON.stringify({ classId: fresh.made.classId === src.id, termId: fresh.made.termId,
        categoryId: fresh.made.categoryId, options: fresh.catOptions }));

    const firstId = fresh.made.id;

    /*
      ACCEPTANCE LINE 1, the half that exists in this build. `0` is the extra-credit mechanism
      (docs/data-model.md § Extra credit, owner 2026-08-09), so the field has to take it and the
      document has to keep it — not default it back, not refuse it, not turn it into a blank. Typed
      through the real field, read back out of the document, and then read off the row, where it is
      labelled in words so a lone zero cannot read as a slip.
    */
    await typeField('name', 'Bonus <b>lab</b> write-up');
    await typeField('points', '0');
    const zeroed = await evalJs(`(function(){ var doc = window.__adoc();
      var a = doc.assignments.filter(function(x){ return x.id === ${JSON.stringify(firstId)}; })[0];
      var f = document.querySelector('#assignmentFields [data-assignment-field="points"]');
      return { a: a, field: f ? f.value : null, type: f ? f.type : null,
        min: f ? f.getAttribute('min') : null }; })()`);
    check('a zero-point assignment can be created: 0 is typed, kept as 0, and never defaulted or refused',
      zeroed.a && zeroed.a.points === 0 && zeroed.field === '0' && zeroed.type === 'number',
      'points stored ' + JSON.stringify(zeroed.a && zeroed.a.points) + ', field reads '
        + JSON.stringify(zeroed.field));
    await clickSel('#assignmentModal [data-modal-close]');
    const withZero = await evalJs('window.__assign()');
    check('the row says EXTRA CREDIT in words beside the 0, so a zero cannot read as a mistake',
      withZero.names.length === 1 && withZero.points[0] === '0' && withZero.extras[0] === true
        && /Extra credit/i.test(withZero.names[0]),
      JSON.stringify(withZero.names[0]) + ' at ' + JSON.stringify(withZero.points[0]));
    /* And the name is text. An assignment name is typed by a teacher, and "Bonus <b>lab</b>
       write-up" has to be those characters rather than markup. */
    check('an assignment name carrying markup is rendered as text',
      withZero.injected === 0 && withZero.names[0].indexOf('<b>lab</b>') >= 0,
      withZero.injected + ' element(s) built from a name or a category title');

    /*
      THE EMPTY CATEGORIES, AND WHAT EACH ONE COSTS. Every category with nothing filed under it is
      drawn and says its own consequence — a weight that redistributes (docs/data-model.md § Grade
      math) or, at 0%, that it counts for nothing either way. The expected sentences are derived
      HERE from the class's own weights, so this cannot pass by printing one sentence everywhere.
    */
    const emptyCats = src.catIds
      .map((id, i) => ({ id, name: src.catNames[i], weight: src.catWeights[i] }))
      .filter((c) => c.id !== fresh.made.categoryId);
    const withZeroWeight = emptyCats.filter((c) => c.weight === 0).length;
    check('every empty category is drawn with its consequence in words, and a 0% one says something different',
      withZero.notes.length === emptyCats.length
        && emptyCats.every((c, i) => withZero.notes[i].indexOf(c.name) >= 0)
        && emptyCats.every((c, i) => (c.weight === 0
          ? /counts for nothing either way/.test(withZero.notes[i])
          : /redistributes/.test(withZero.notes[i])))
        && withZero.groups.length === src.catIds.length
        && withZero.chips === src.catIds.length,
      emptyCats.length + ' empty categor(ies), ' + withZeroWeight + ' at 0% :: '
        + JSON.stringify(withZero.notes.map((n) => n.slice(0, 48))));

    /*
      ACCEPTANCE LINE 2, the half that exists. A second assignment, worth real points, moved between
      categories through the real <select> — with a score column planted on it first, so that the
      claim "the work moves and its scores go with it" is asserted against a column that exists
      rather than against an empty object. The other half of the line names a displayed grade and is
      re-homed to WO-3.5 in the work order.
    */
    await clickSel('#assignmentsView [data-assignment-new]');
    await typeField('name', 'Unit 1 test');
    await typeField('points', '100');
    await typeField('assigned', '2026-09-14');
    await typeField('due', '2026-09-18');
    await clickSel('#assignmentModal [data-modal-close]');
    const secondId = await evalJs(`(function(){ var d = window.__adoc().assignments
      .filter(function(a){ return a.classId === ${JSON.stringify(src.id)}; });
      return d[d.length - 1].id; })()`);
    /* The only write in this section that does not go through a control, and it is here because
       there is no score entry in this build at all — WO-3.5 owns it. Everything read back about it
       is read off the real screen and the real dialogs. */
    const scoredStudent = await evalJs(`(function(){ var s = window.planbook.store;
      var cls = s.getDoc().classes.filter(function(c){ return c.id === ${JSON.stringify(src.id)}; })[0];
      var who = (cls.roster || [])[0]; if (!who) return '';
      s.update(function(d){ var col = {}; col[who] = { v: 87 };
        d.scores[${JSON.stringify(secondId)}] = col; });
      return who; })()`);
    await evalJs('window.planbook.assignments.renderAssignments(); 1');
    const scored = await evalJs('window.__assign()');
    check('the coverage bar counts entered cells against the class roster rather than guessing',
      !!scoredStudent && rosterSize > 0
        && scored.counts.indexOf('1/' + rosterSize) >= 0
        && scored.counts.indexOf('0/' + rosterSize) >= 0,
      JSON.stringify(scored.counts) + ' over a roster of ' + rosterSize);

    const beforeMove = await evalJs('window.__adoc()');
    const otherCat = src.catIds.filter((id) => id !== fresh.made.categoryId)[0];
    await clickSel('#assignmentsView [data-assignment-edit="' + secondId + '"]');
    await pickSelect('#assignmentFields [data-assignment-category]', otherCat);
    await clickSel('#assignmentModal [data-modal-close]');
    const moved = await evalJs(`(function(){ var live = window.__assign();
      var doc = window.__adoc();
      live.moved = doc.assignments.filter(function(a){ return a.id === ${JSON.stringify(secondId)}; })[0];
      live.scores = doc.scores; live.scoreKeys = doc.scoreKeys; return live; })()`);
    check('an assignment can be moved between categories, and its scores go with it untouched',
      moved.moved.categoryId === otherCat
        && moved.moved.classId === src.id
        && moved.scores === beforeMove.scores
        && moved.groups.length === src.catIds.length,
      'now in ' + moved.moved.categoryId + ' :: score column byte-identical = '
        + (moved.scores === beforeMove.scores));
    /* And the row went with it on screen, which is the half of "moved" a document read cannot see:
       it is drawn under the group head of the category it now counts in. */
    const movedWhere = await evalJs(`(function(){
      var rows = Array.prototype.slice.call(document.querySelectorAll('#assignmentsBody tr'));
      var head = ''; var out = '';
      rows.forEach(function(r){
        if (r.classList.contains('assign-group-head')) head = r.querySelector('.assign-group-title').textContent;
        var n = r.querySelector('.assign-name');
        if (n && n.textContent.indexOf('Unit 1 test') === 0) out = head;
      });
      return out.replace(/\\s+/g, ' ').trim(); })()`);
    check('and the row is drawn under the group head of the category it now counts in',
      movedWhere.indexOf(src.catNames[src.catIds.indexOf(otherCat)]) >= 0,
      JSON.stringify(movedWhere.slice(0, 70)));

    /*
      THE TERM NAV SITS IN THE HEADER ON EVERY CLASS SCREEN, AND THE WHOLE OF THIS LIST IS
      TERM-FILTERED. *(Added 2026-08-09, correction round 1, with the one-line fix in src/shell.js's
      [data-term-select] branch.)* Before it, tapping Quarter 2 moved the chip in the header and
      left the table, the caption and the summary line all describing Quarter 1 — the first surface
      in this app where a term switch gets the entire body wrong rather than one figure, which is
      why it was fixed here first. The registry's own term-totals gap, left then to whoever owned
      it, is WO-2.17 — its block sits directly below this section, and the chain both screens now
      hang off is src/shell.js's afterTermChange().

      TWO TERMS ARE NEEDED TO SWITCH BETWEEN and this class may only have one, so one is added
      through the real term editor when that is the case and taken down with the rest of the fixture
      at the foot of this section.
    */
    const TERM_NAV = `(function(){
      var nav = document.getElementById('termNav');
      var btns = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
      return btns.map(function(b){ return { id: b.getAttribute('data-term-select'),
        label: b.textContent, active: b.classList.contains('active') }; }); })()`;
    let termTabs = await evalJs(TERM_NAV);
    let plantedTerm = '';
    if (termTabs.length < 2) {
      await clickSel('header [data-class-manage]');
      await clickSel('#classList [data-term-manage="' + src.id + '"]');
      await clickSel('#termsModal [data-term-add]');
      await clickSel('#termsModal [data-modal-close]');
      await closeAssignDialogs();
      termTabs = await evalJs(TERM_NAV);
      plantedTerm = (termTabs.filter((t) => src.terms.indexOf(t.id) < 0)[0] || {}).id || '';
    }
    const openTerm = termTabs.filter((t) => t.active)[0] || termTabs[0];
    const otherTerm = termTabs.filter((t) => t.id !== openTerm.id)[0];
    check('the term fixture is real: this class has two terms to switch between',
      termTabs.length >= 2 && !!openTerm && !!otherTerm && openTerm.id !== otherTerm.id,
      termTabs.length + ' term(s): ' + JSON.stringify(termTabs.map((t) => t.label))
        + (plantedTerm ? ' (one added here through the term editor, removed below)' : ''));
    /* Named by the summary line's own shape — "Assignments · <term> · …" — rather than by searching
       for the label anywhere in it, so two terms whose labels share a prefix cannot pass this. */
    const summaryFor = (t) => 'Assignments · ' + t.label + ' · ';
    await clickSel('#termNav [data-term-select="' + otherTerm.id + '"]');
    const otherTermUp = await evalJs('window.__assign()');
    check('switching term repaints the assignment list instead of leaving the other term\'s work on screen under a new heading',
      otherTermUp.shown
        && otherTermUp.names.every((n) => n.indexOf('Unit 1 test') === -1)
        && otherTermUp.names.every((n) => n.indexOf('Bonus') === -1)
        && otherTermUp.summary.indexOf(summaryFor(otherTerm)) === 0,
      JSON.stringify(otherTermUp.summary) + ' over rows '
        + JSON.stringify(otherTermUp.names.map((n) => n.slice(0, 24))));
    await clickSel('#termNav [data-term-select="' + openTerm.id + '"]');
    const backOnTerm = await evalJs('window.__assign()');
    check('and switching back brings that term\'s own work back, with the summary line naming it',
      backOnTerm.names.length === 2
        && backOnTerm.summary.indexOf(summaryFor(openTerm)) === 0
        && backOnTerm.names.some((n) => n.indexOf('Unit 1 test') === 0),
      JSON.stringify(backOnTerm.summary));

    /*
      ACCEPTANCE LINE 3, and this work order's named TRAP in the same breath. Duplicating into
      another class produces a NEW assignment with no scores attached — and the copy carries the
      TARGET class's own ids. A copy that kept the source's `categoryId` would sit in the target
      filed under a category only the source has: invisible on its list, counted by nothing, and
      destroyed by a category removal in the source under a dialog naming the source.

      THE FIXTURE IS BUILT IN BOTH DIRECTIONS NOW, AND THAT IS WHY THIS BLOCK IS LONG.
      *(Rebuilt 2026-08-09, correction round 1.)* Its first cut asserted "the copy wears the
      target's id for its category name, or none" against a document in which no class was ever
      named like another — so `matchCategory()` only ever took its `return ''` path, and a version
      of it that returned `''` unconditionally would have passed every check in this file. The
      REFUSAL was measured and the MATCH was not, which is the same shape as the `termId` finding
      four checks up and was invisible for the same reason: nothing in the fixture could express the
      failure. Both cases are constructed here rather than hoped for. The source's category is first
      renamed to a name no other class has — the no-match case, and the one the dialog has to be
      honest about — and the target is then given a category of that same name through the real
      category manager, which is the match case and the only one that can tell the target's id for a
      name apart from the source's.
    */
    const catRowIndex = src.catIds.indexOf(otherCat);
    const sourceCatName = src.catNames[catRowIndex];
    /* Distinctive on purpose: the claim below is that no OTHER class has a category of this name,
       and a name a teacher might plausibly reuse would make that an accident rather than a fixture. */
    const PROBE_CAT = 'Copy probe — labs (WO-3.3)';
    await clickSel('header [data-class-manage]');
    await clickSel('#classList [data-category-manage="' + src.id + '"]');
    await evalJs(`(function(){
      var f = document.querySelectorAll('#categoryList .category-name-input')[${catRowIndex}];
      if (!f) return 0;
      f.value = ${JSON.stringify(PROBE_CAT)};
      f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
    await closeAssignDialogs();
    /* Both classes' categories read off the document, because the ids are what the two cases below
       are about and `stage` was taken before either of these edits. */
    const catsNow = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
      var pick = function(id){ var cls = d.classes.filter(function(c){ return c.id === id; })[0];
        return (cls.categories || []).map(function(k){ return { id: k.id, name: k.name }; }); };
      return { src: pick(${JSON.stringify(src.id)}), dst: pick(${JSON.stringify(dst.id)}) }; })()`);
    const probeInSrc = catsNow.src.filter((k) => k.id === otherCat)[0];
    check('the duplicate fixture is real: the source\'s category has a name the target class does not use',
      !!probeInSrc && probeInSrc.name === PROBE_CAT
        && catsNow.dst.length >= 1
        && catsNow.dst.every((k) => k.name !== PROBE_CAT),
      'source category ' + JSON.stringify(PROBE_CAT) + ' :: ' + dst.name + ' holds '
        + JSON.stringify(catsNow.dst.map((k) => k.name)));

    /* One read of the dialog, used three times below, so the two proposals and the pick in between
       cannot drift apart by being read differently. `catShown` is what the CONTROL displays —
       the selected option's value rather than the variable behind it, which is the whole of the
       first defect this round came back for. */
    const COPY_READ = `(function(){
      var term = document.querySelector('[data-assignment-copy-term]');
      var cat = document.querySelector('[data-assignment-copy-category]');
      var opts = cat ? Array.prototype.slice.call(cat.options) : [];
      var shown = cat && cat.selectedIndex >= 0 ? opts[cat.selectedIndex] : null;
      return {
        open: !document.getElementById('assignmentCopyModal').classList.contains('hidden'),
        lead: (document.getElementById('assignmentCopyLead')||{}).textContent.replace(/\\s+/g,' '),
        note: (document.getElementById('assignmentCopyNote')||{}).textContent.replace(/\\s+/g,' '),
        button: (document.getElementById('assignmentCopyBtn')||{}).textContent,
        term: term ? term.value : null, category: cat ? cat.value : null,
        catOptions: opts.map(function(o){ return o.value; }),
        catShown: shown ? shown.value : null,
        catShownLabel: shown ? shown.textContent : null,
        classes: document.querySelectorAll('#assignmentCopyClasses .pill').length,
        active: document.querySelectorAll('#assignmentCopyClasses .pill.active').length }; })()`;

    await clickSel('#assignmentsView [data-assignment-duplicate="' + secondId + '"]');
    await clickSel('#assignmentCopyClasses [data-assignment-copy-class="' + dst.id + '"]');
    const proposal = await evalJs(COPY_READ);
    check('the duplicate dialog proposes the TARGET class\'s own term, and files under nothing when that class has no category of the source\'s name',
      proposal.open && dst.terms.indexOf(proposal.term) >= 0
        && proposal.category === ''
        && proposal.active === 1 && proposal.classes >= 2
        && proposal.button.indexOf(dst.name) >= 0
        && /no scores/.test(proposal.lead)
        && proposal.note.indexOf(PROBE_CAT) >= 0 && /Pick one above/.test(proposal.note),
      JSON.stringify({ term: dst.terms.indexOf(proposal.term) >= 0, category: proposal.category,
        button: proposal.button }));
    /*
      AND THE CONTROL SHOWS WHAT THE PROPOSAL HOLDS. A <select> with no option marked `selected`
      displays its first one, so an unmatched proposal against a class that HAS categories drew
      "Homework — 25%" while the copy was filed under nothing: the teacher reads the dialog, taps
      Copy into Period 2, and finds the row under the red "Not in a category" banner. The reachable
      half is the same defect from the other side — the option a select is already displaying fires
      no `change` when it is tapped, so the note's own "Pick one above" was unreachable for exactly
      the option it pointed at. Asserted as: the displayed option is the placeholder, and every real
      category sits below it, in the target's own order and with the target's own ids.
    */
    check('the copy dialog never displays a category it will not file the copy under, and every real category is a change away from what is shown',
      proposal.catShown === '' && proposal.catOptions[0] === ''
        && /choose a category/i.test(proposal.catShownLabel || '')
        && proposal.catOptions.length === catsNow.dst.length + 1
        && proposal.catOptions.slice(1).every((v, i) => v === catsNow.dst[i].id),
      'displaying ' + JSON.stringify(proposal.catShownLabel) + ' for a proposal of '
        + JSON.stringify(proposal.category) + ' over ' + catsNow.dst.length + ' real categor(ies)');
    /* And picking one through the real control moves the proposal onto it and takes the placeholder
       away with it — so it cannot be chosen back into by accident, which is the rule
       categoryField() states for the editor's own select. */
    await pickSelect('[data-assignment-copy-category]', catsNow.dst[0].id);
    const picked = await evalJs(COPY_READ);
    check('picking a category in the duplicate dialog moves the proposal onto it and retires the placeholder',
      picked.category === catsNow.dst[0].id && picked.catShown === catsNow.dst[0].id
        && picked.catOptions.indexOf('') === -1
        && picked.catOptions.length === catsNow.dst.length
        && !/Pick one above/.test(picked.note),
      'proposal now ' + JSON.stringify(picked.category) + ', options '
        + picked.catOptions.length + ' with no placeholder among them');
    await clickSel('[data-assignment-copy-cancel]');

    /*
      THE MATCH CASE. The target class gets a category of the source's own name, through the real
      manager — [data-category-add] puts it at 0% and disturbs no other weight — and the copy must
      come out wearing THAT class's id for that name. This is the half no run in this tree exercised
      before today.
    */
    await clickSel('header [data-class-manage]');
    await clickSel('#classList [data-category-manage="' + dst.id + '"]');
    await clickSel('#categoriesModal [data-category-add]');
    await evalJs(`(function(){
      var all = document.querySelectorAll('#categoryList .category-name-input');
      var last = all[all.length - 1]; if (!last) return 0;
      last.value = ${JSON.stringify(PROBE_CAT)};
      last.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
    await closeAssignDialogs();
    const twin = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
      var cls = d.classes.filter(function(c){ return c.id === ${JSON.stringify(dst.id)}; })[0];
      var cats = cls.categories || [];
      var hit = cats.filter(function(k){ return k.name === ${JSON.stringify(PROBE_CAT)}; });
      return { id: hit.length === 1 ? hit[0].id : '', count: cats.length,
        ids: cats.map(function(k){ return k.id; }) }; })()`);
    check('the target class now holds a category of the source\'s own name, under an id of its own',
      !!twin.id && twin.id !== otherCat && twin.ids.indexOf(otherCat) === -1
        && twin.count === catsNow.dst.length + 1,
      dst.name + ' category ' + JSON.stringify(twin.id) + ' for the name ' + JSON.stringify(PROBE_CAT)
        + ', where the source\'s id for it is ' + JSON.stringify(otherCat));

    await clickSel('#assignmentsView [data-assignment-duplicate="' + secondId + '"]');
    await clickSel('#assignmentCopyClasses [data-assignment-copy-class="' + dst.id + '"]');
    const matched = await evalJs(COPY_READ);
    check('with a category of that name in the target, the dialog proposes the TARGET\'s id for it and shows it',
      matched.category === twin.id && matched.catShown === twin.id
        && matched.category !== otherCat
        && matched.catOptions.indexOf('') === -1
        && /The dates come across as they are/.test(matched.note),
      'proposed ' + JSON.stringify(matched.category) + ' and displayed '
        + JSON.stringify(matched.catShownLabel));

    const beforeCopy = await evalJs('window.__adoc()');
    await clickSel('[data-assignment-copy-confirm]');
    const copied = await evalJs(`(function(){ var doc = window.__adoc();
      var made = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(dst.id)}; });
      doc.copy = made[made.length - 1] || null;
      doc.copyOpen = !document.getElementById('assignmentCopyModal').classList.contains('hidden');
      return doc; })()`);
    check('duplicating into another class produces a new assignment with no scores attached',
      !!copied.copy && copied.copy.id !== secondId
        && copied.copy.classId === dst.id
        && dst.terms.indexOf(copied.copy.termId) >= 0
        && copied.scoreKeys.indexOf(copied.copy.id) === -1
        && copied.scoreKeys.indexOf(secondId) >= 0
        && copied.assignments.length === beforeCopy.assignments.length + 1
        && !copied.copyOpen,
      'copy ' + (copied.copy && copied.copy.id) + ' in ' + dst.name + ', score columns '
        + JSON.stringify(copied.scoreKeys.length) + ' (unchanged from '
        + beforeCopy.scoreKeys.length + ')');
    check('the copy is filed under the TARGET class\'s own id for that category name, never the source\'s — the trap this work order names',
      copied.copy.categoryId === twin.id
        && copied.copy.categoryId !== otherCat
        && twin.id !== otherCat
        && twin.ids.indexOf(copied.copy.categoryId) >= 0
        && catsNow.src.every((k) => k.id !== copied.copy.categoryId)
        && copied.copy.classId === dst.id,
      JSON.stringify(PROBE_CAT) + ': source id ' + JSON.stringify(otherCat) + ' -> copy id '
        + JSON.stringify(copied.copy.categoryId) + ' (matched by name in ' + dst.name + ')');
    /* And the points and both dates came across as they were — a duplicate that dropped the dates
       would be a form to fill in twice, which is what this control exists to stop. */
    check('the copy carries the points and both dates across, and nothing else about the source moved',
      copied.copy.points === 100 && copied.copy.assigned === '2026-09-14'
        && copied.copy.due === '2026-09-18'
        && JSON.stringify(copied.assignments.filter((a) => a.id === secondId))
          === JSON.stringify(beforeCopy.assignments.filter((a) => a.id === secondId)),
      JSON.stringify({ points: copied.copy.points, assigned: copied.copy.assigned,
        due: copied.copy.due }));

    /*
      THE OTHER END OF THE TRAP. A document can arrive from a restore, a hand edit, or a build older
      than this one carrying an assignment whose `categoryId` belongs to this class and whose
      `classId` does not. It must be absent from this class's list, and — the expensive half —
      absent from the count in the category-removal confirm, which is what decides how much work a
      teacher agrees to destroy.

      THE PLANT CARRIES THE SOURCE'S TERM ID AS WELL, AND THAT IS THE WHOLE FIXTURE. The first
      version of it used the target class's own term, and the mutation run said so: dropping the
      `classId` guard from assignmentsOf() turned NOTHING red, because the term filter beside it was
      already excluding the row for a reason that has nothing to do with the claim. A naive
      duplicate copies everything and changes the class, so the honest adversary shares the term as
      well as the category — and then only the guard under test can keep it off this list.
    */
    await evalJs(`(function(){ var s = window.planbook.store;
      s.update(function(d){ d.assignments.push({ id:'a_foreign', classId:${JSON.stringify(dst.id)},
        termId:${JSON.stringify(fresh.made.termId)}, categoryId:${JSON.stringify(otherCat)},
        name:'Planted in another class', points:25, assigned:'', due:'' }); });
      return 1; })()`);
    await evalJs('window.planbook.assignments.renderAssignments(); 1');
    const guarded = await evalJs('window.__assign()');
    check('work belonging to another class never appears on this class\'s list, however its category reads',
      guarded.names.every((n) => n.indexOf('Planted in another class') === -1)
        && guarded.names.length === 2,
      guarded.names.length + ' row(s): ' + JSON.stringify(guarded.names.map((n) => n.slice(0, 32))));
    /* Through the real door and the real confirm: the class manager, the Categories button on this
       class's row, and Remove on the category that holds one real assignment. "1 assignment" is the
       claim; an unguarded count says 2 and the teacher agrees to destroy work in a class the dialog
       does not name. */
    await clickSel('header [data-class-manage]');
    await clickSel('#classList [data-category-manage="' + src.id + '"]');
    await clickSel('#categoryList .category-row:nth-child(' + (catRowIndex + 1) + ') [data-category-remove]');
    const removalCount = await evalJs(`(function(){
      return { open: !document.getElementById('categoryRemoveModal').classList.contains('hidden'),
        facts: (document.getElementById('categoryRemoveFacts')||{}).textContent.replace(/\\s+/g,' ') }; })()`);
    check('and a category removal counts only the work in its own class, not work elsewhere wearing the same category id',
      removalCount.open && /1 assignment\b/.test(removalCount.facts)
        && !/2 assignments/.test(removalCount.facts),
      JSON.stringify(removalCount.facts.slice(0, 120)));
    await clickSel('[data-category-remove-cancel]');
    await closeAssignDialogs();
    await evalJs(`(function(){ var s = window.planbook.store;
      s.update(function(d){ d.assignments = d.assignments.filter(function(a){ return a.id !== 'a_foreign'; }); });
      return 1; })()`);

    /*
      ACCEPTANCE LINE 6, and it is proved the way the work order asks for — by leaving one class on
      Assignments, opening a second and coming back — rather than by reading the code. The failure
      mode is a per-class memory nobody asked for, and it is invisible until the second class.
    */
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);
    await clickSel('#classView [data-class-screen="assignments"]');
    const leftOnList = await evalJs('window.__assign()');
    const dstTab = stage.tabs.indexOf(dst.id);
    await clickSel('#classTabBar [data-class-tab]', dstTab);
    const secondClass = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); live.open = window.planbook.classes.getSelectedClassId();
      return live; })()`);
    check('opening a second class from a class left on Assignments lands on Attendance',
      leftOnList.shown && secondClass.classShown && !secondClass.shown
        && secondClass.open === dst.id
        && secondClass.strip.every((s) => s.active[0] === true),
      'left on assignments = ' + leftOnList.shown + ', second class shows attendance = '
        + secondClass.classShown);
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);
    const backAgain = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); live.open = window.planbook.classes.getSelectedClassId();
      return live; })()`);
    check('and coming back to the first class lands on Attendance too — there is no per-class memory',
      backAgain.classShown && !backAgain.shown && backAgain.open === src.id
        && backAgain.strip.every((s) => s.active[0] === true && s.active[1] === false),
      'open class ' + (backAgain.open === src.id) + ', attendance up = ' + backAgain.classShown);

    /* The way in from a card, which is the other door into a class, and it has to answer the same
       way — a teacher who left the list open and went home through "All classes" is the commonest
       route to the defect. */
    await clickSel('#classView [data-class-screen="assignments"]');
    await clickSel('#assignmentsView [data-view-home]');
    const homeFromList = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); return live; })()`);
    check('the way back to the class grid works from the assignment list, and empties the switcher on the way',
      homeFromList.homeShown && !homeFromList.shown && !homeFromList.classShown
        && homeFromList.strip.every((s) => s.labels.length === 0),
      'home up = ' + homeFromList.homeShown + ', segments left on the strip = '
        + JSON.stringify(homeFromList.strip.map((s) => s.labels.length)));
    await clickSel('#homeGrid [data-class-tab="' + src.id + '"]');
    const fromCard = await evalJs('window.__assign()');
    check('entering a class from its card lands on Attendance, not on the screen it was left on',
      fromCard.classShown && !fromCard.shown && !fromCard.homeShown,
      'attendance up = ' + fromCard.classShown + ', assignments up = ' + fromCard.shown);

    /*
      AND ACROSS A RELOAD, which is the cross-device form of the same failure: `planbook_openView`
      is this browser's own memory of where it was, and src/views.js writes every class screen down
      as `class` precisely so that there is nothing for a reload to restore. Flushed first — CDP
      tears the execution context down without waiting for a debounced write, and that loss reads as
      a store defect (tools/README.md § trap 6).
    */
    await clickSel('#classView [data-class-screen="assignments"]');
    const storedOnList = await evalJs('window.__adoc().openView');
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const assignBoot = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    await evalJs(INSTALL_CLASS_READER);
    await evalJs(INSTALL_ASSIGN_READER);
    const afterReload = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); live.doc = window.__adoc();
      live.stored = live.doc.openView; return live; })()`);
    check('a reload while the assignment list is open comes back on Attendance, because no class screen is ever written down as itself',
      assignBoot && afterReload.classShown && !afterReload.shown
        && storedOnList === 'class' && afterReload.stored === 'class'
        && afterReload.strip.every((s) => s.active[0] === true),
      assignBoot ? 'planbook_openView held ' + JSON.stringify(storedOnList)
        + ' while the list was up, and ' + JSON.stringify(afterReload.stored) + ' after the reload'
        : 'the loading screen never came down');
    /* And the work itself came back out of IndexedDB — including the 0, which is the half of
       acceptance line 1 a document read is the only witness to. By id rather than by class,
       because an earlier section left a fixture of its own on this class and a count would be
       asserting that nobody else had written anything rather than that these two survived. */
    const survived = afterReload.doc.assignments
      .filter((a) => a.id === firstId || a.id === secondId);
    check('the assignments survive a reload, zero points included',
      survived.length === 2
        && survived.some((a) => a.id === firstId && a.points === 0)
        && survived.some((a) => a.id === secondId && a.points === 100 && a.due === '2026-09-18'),
      JSON.stringify(survived.map((a) => a.name + ' @ ' + a.points)));

    /*
      ACCEPTANCE LINE 7, second half, as far as this build can take it — and the shortfall is named
      rather than papered over. WO-3.7 owns the per-student detail, so there is no screen from which
      a name can be set and then left; what CAN be asserted is the rule that makes the line true on
      the way out, which is that the name is drawn only while that screen is the one on the glass.
      Setting one with no detail open must therefore change nothing at all.
    */
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);
    await clickSel('#classView [data-class-screen="assignments"]');
    const breadcrumb = await evalJs(`(function(){
      window.planbook.screenNav.setDetailBreadcrumb('Ada Probe');
      window.planbook.screenNav.refreshScreenNav();
      var strips = window.__strip();
      return { strips: strips,
        named: strips.some(function(s){ return s.labels.some(function(l){
          return l.indexOf('Ada Probe') >= 0; }); }) }; })()`);
    check('a student\'s name stays off the strip while no student detail is open, so it cannot outlive the screen it belongs to',
      breadcrumb.named === false
        && breadcrumb.strips.every((s) => s.detail === 0)
        && breadcrumb.strips.every((s) => JSON.stringify(s.labels) === JSON.stringify(wantLabels)),
      'segments ' + JSON.stringify(breadcrumb.strips[0].labels) + ', breadcrumb segments '
        + JSON.stringify(breadcrumb.strips.map((s) => s.detail)));

    /*
      REORDER, which is two arrows and an array — no `order` field, because two ways to say where an
      assignment sits is one way for them to disagree. Driven on two rows in one category.
    */
    await clickSel('#assignmentsView [data-assignment-new]');
    await typeField('name', 'Second in its group');
    await clickSel('#assignmentModal [data-modal-close]');
    const pair = await evalJs(`(function(){ var doc = window.__adoc();
      var mine = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(src.id)}
        && a.categoryId === ${JSON.stringify(fresh.made.categoryId)}; });
      return mine.map(function(a){ return a.id; }); })()`);
    await clickSel('#assignmentsView [data-assignment-move-down="' + pair[0] + '"]');
    const reordered = await evalJs(`(function(){ var doc = window.__adoc();
      var live = window.__assign();
      live.order = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(src.id)}
        && a.categoryId === ${JSON.stringify(fresh.made.categoryId)}; })
        .map(function(a){ return a.id; });
      return live; })()`);
    check('the arrows reorder an assignment inside its own category, and the document order is the order drawn',
      pair.length === 2 && JSON.stringify(reordered.order) === JSON.stringify([pair[1], pair[0]])
        && reordered.names.length === 3
        && reordered.rowButtons === 5,
      'order ' + JSON.stringify(pair) + ' -> ' + JSON.stringify(reordered.order)
        + ', ' + reordered.rowButtons + ' controls per row');

    /*
      DELETING ONE WARNS ABOUT THE SCORES IT TAKES WITH IT. It asks every time, including when there
      is nothing filed under it — an assignment IS the work, so one with no scores is still a name, a
      mark out of, a category and two dates the teacher would have to type again. Cancel writes
      nothing, which is the point of counting before the dialog rather than after it.
    */
    await clickSel('#assignmentsView [data-assignment-delete="' + secondId + '"]');
    const confirmSeen = await evalJs(`(function(){
      return { open: !document.getElementById('assignmentDeleteModal').classList.contains('hidden'),
        lead: (document.getElementById('assignmentDeleteLead')||{}).textContent.replace(/\\s+/g,' '),
        facts: (document.getElementById('assignmentDeleteFacts')||{}).textContent.replace(/\\s+/g,' '),
        button: (document.getElementById('assignmentDeleteBtn')||{}).textContent }; })()`);
    check('deleting an assignment warns first and counts the scores it takes with it',
      confirmSeen.open && /1 score entered on it/.test(confirmSeen.facts)
        && /cannot be undone/.test(confirmSeen.lead)
        && confirmSeen.button.indexOf('Unit 1 test') >= 0,
      JSON.stringify(confirmSeen.facts.slice(0, 90)) + ' :: ' + JSON.stringify(confirmSeen.button));
    const beforeCancel = await evalJs(
      '(async function(){ await window.planbook.store.flush(); return window.__adoc(); })()');
    await clickSel('[data-assignment-delete-cancel]');
    const afterCancel = await evalJs(
      '(async function(){ await window.planbook.store.flush(); return window.__adoc(); })()');
    check('cancelling leaves the assignment and its scores exactly as they were, and writes nothing',
      afterCancel.rev === beforeCancel.rev
        && JSON.stringify(afterCancel.assignments) === JSON.stringify(beforeCancel.assignments)
        && afterCancel.scores === beforeCancel.scores,
      'rev ' + beforeCancel.rev + ' -> ' + afterCancel.rev + ' (nothing written, so rev cannot move)');

    await clickSel('#assignmentsView [data-assignment-delete="' + secondId + '"]');
    await clickSel('[data-assignment-delete-confirm]');
    await new Promise(r => setTimeout(r, 250));
    const deleted = await evalJs(`(async function(){ await window.planbook.store.flush();
      var live = window.__assign(); live.doc = window.__adoc(); return live; })()`);
    check('confirming takes the assignment and its score column — and only those',
      deleted.doc.assignments.every((a) => a.id !== secondId)
        && deleted.doc.scoreKeys.indexOf(secondId) === -1
        && deleted.doc.assignments.filter((a) => a.classId === dst.id).length >= 1
        && deleted.names.length === 2,
      deleted.doc.assignments.length + ' assignment(s) left, score columns '
        + JSON.stringify(deleted.doc.scoreKeys));

    /*
      The fixture comes back out, so the sections after this one see the document they expect, and
      the class the roster section left open is left open — the overflow sweep at the bottom
      measures the term nav of whatever is up. Driven through the real confirm rather than spliced
      out of the array, because a cleanup that writes differently from the app is a cleanup that can
      leave a shape the app never makes.
    */
    const leftovers = await evalJs('window.__adoc().assignments.map(function(a){ return a.id; })');
    for (const id of leftovers) {
      await evalJs(`(function(){ var s = window.planbook.store;
        s.update(function(d){ delete d.scores[${JSON.stringify(id)}];
          d.assignments = d.assignments.filter(function(a){ return a.id !== ${JSON.stringify(id)}; }); });
        return 1; })()`);
    }
    /* And the fixtures the duplicate and the term switch used: the twin category comes off the
       target class, the source's category gets its own name back, and a term added for the switch
       goes away. One update rather than the real Remove controls, for the reason the roster
       teardown below gives — a fixture coming down is not a claim being made — and every assignment
       that was filed in any of them is already gone. */
    await evalJs(`(function(){ var s = window.planbook.store; var planted = ${JSON.stringify(plantedTerm)};
      s.update(function(d){ d.classes.forEach(function(c){
        if (c.id === ${JSON.stringify(dst.id)} && Array.isArray(c.categories)) {
          c.categories = c.categories.filter(function(k){ return k.id !== ${JSON.stringify(twin.id)}; });
        }
        if (c.id === ${JSON.stringify(src.id)} && Array.isArray(c.categories)) {
          c.categories.forEach(function(k){
            if (k.id === ${JSON.stringify(otherCat)}) k.name = ${JSON.stringify(sourceCatName)}; });
        }
        if (c.id === ${JSON.stringify(src.id)} && planted && Array.isArray(c.terms)) {
          c.terms = c.terms.filter(function(t){ return t.id !== planted; });
        }
      }); }); return 1; })()`);
    /* And the two students this section added for the coverage bar, off the roster and out of the
       year — which is what Remove followed by Delete does through the controls, written in one
       update because this is a fixture coming down rather than a claim being made. */
    if (planted.length) {
      await evalJs(`(function(){ var s = window.planbook.store; var ids = ${JSON.stringify(planted)};
        s.update(function(d){
          d.classes.forEach(function(c){ if (Array.isArray(c.roster)) {
            c.roster = c.roster.filter(function(x){ return ids.indexOf(x) === -1; }); } });
          d.students = d.students.filter(function(st){ return ids.indexOf(st.id) === -1; });
        }); return 1; })()`);
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await clickSel('#assignmentsView [data-class-screen="class"]');
    const backOnAttendance = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); return live; })()`);
    check('the strip takes you back to Attendance from the assignment list, which is the switch in both directions',
      backOnAttendance.classShown && !backOnAttendance.shown
        && backOnAttendance.strip.every((s) => s.active[0] === true && s.active[1] === false),
      'attendance up = ' + backOnAttendance.classShown);
    if (stage.tabs[1] && stage.tabs[1] !== src.id) await clickSel('#classTabBar [data-class-tab]', 1);
  }
}

/* ───────── the term nav repaints the screen it is sitting on (WO-2.17) ─────────
 *
 * THE SIBLING OF THE TERM-SWITCH CHECK IN THE SECTION ABOVE, and it is here because that block's
 * own comment left the registry's half "to whoever owns it". This is that half. `selectTerm()`
 * wrote the preference, repainted the class bar and said the new term out loud, and the totals line
 * an inch below the nav went on reporting the term the teacher had just left. It came right on the
 * next repaint from any other cause, which is what kept it invisible for a phase: mark one student
 * and the numbers jump, and the jump reads as the mark landing rather than as the term arriving.
 *
 * THE FIXTURE IS TWO DATED TERMS OVER RECORDS THIS BLOCK PLANTS — three meetings inside one window
 * and five inside the other — because the claim is a NUMBER that has to move, not a repaint that
 * has to happen. A check that only read the label at the front of the line would go green against a
 * build that redrew that line out of the same stale totals. The whole document is snapshotted here
 * and put back at the foot of the block, the way the WO-2.13 timing fixture does it.
 *
 * TWO KINDS OF SENTINEL, and they are what make this work order's Traps line measurable instead of
 * a matter of reading the diff. A `data-wo217-sentinel` attribute on one row of the grid survives a
 * repaint of the figures and does NOT survive `renderAttendance()`, which empties tbody and builds
 * it again — so the check that says "the figures, not the grid" goes red against the blanket fix as
 * well as against no fix at all. And the totals element is overwritten by hand before every term tap
 * made from a screen that is NOT the registry, so "a screen that does not read the term is not
 * repainted" is asserted as text still sitting there afterwards rather than inferred from which
 * branch src/shell.js took.
 *
 * TWO MORE CHECKS HANG OFF THIS FIXTURE (WO-2.18), and neither is a defect in what WO-2.17 shipped —
 * both are the check that would notice if it stopped being right.
 *
 *   THE OPEN DETAIL PANEL IS THE THIRD SURFACE paintRenderedTotals() PAINTS, and the seven checks
 *   above assert the first two. So the block opens the ⋯ panel through the real button before the
 *   term tap: deleting `paintDetail(totals)` at the foot of that function used to leave all seven
 *   green while a panel a teacher opened BECAUSE she wanted the detail kept the term she had just
 *   left on screen. A check that asserts two of three painted surfaces licenses the third to be
 *   deleted. The panel's figures are read out of the DOM — the text in `.attendance-detail-totals`,
 *   which is the sentence the teacher reads — and never out of the totals map, for the same reason
 *   the row sentinel is an attribute on a surviving element rather than a count: a figure recomputed
 *   correctly and never painted is the whole bug.
 *
 *   AND selectTerm() IS DRIVEN WITH ANOTHER CLASS'S TERM ID, at the foot of the block. WO-2.17's
 *   fourth acceptance line asks that it return without writing in that case; nothing here ever asked
 *   it to, so that half was settled by reading the two-line guard, which is the condition under which
 *   a guard gets refactored away. The failure it prevents is a preference naming a term the open
 *   class does not have — the case src/classes.js keys the whole preference per class to avoid — so
 *   what is asserted is the absence of all three of its writes: the preference byte for byte, the
 *   nav's own active mark, and the live region, which is pre-filled with a sentence of this file's
 *   own so that silence is text still sitting there rather than an empty string that was always
 *   empty. announce() defers its write a tick (src/live-region.js), so that read waits.
 */
console.log('\n--- the term nav repaints the screen it is sitting on (WO-2.17) ---');
{
  const TERM_A = 'tm_wo217a', TERM_B = 'tm_wo217b';
  const LABEL_A = 'WO-2.17 early', LABEL_B = 'WO-2.17 late';
  /* Written out in full rather than pattern-matched: this is the sentence a teacher reads under the
     term nav, and both halves of it — which term, and how many meetings in it — are the claim. */
  const LINE_A = LABEL_A + ': 3 recorded meetings · Year: 8 recorded meetings';
  const LINE_B = LABEL_B + ': 5 recorded meetings · Year: 8 recorded meetings';
  const ROW_A = LABEL_A + ' · P 3 · T 0 · A 0 · E 0 · D 0 · 100%';
  const ROW_B = LABEL_B + ' · P 5 · T 0 · A 0 · E 0 · D 0 · 100%';
  /* The panel says the term half and the year half in one line, and only the term half is allowed
     to move: the year is the same eight meetings under either term, which is what makes this pair
     of strings a claim about the TERM rather than about the panel having been redrawn at all. */
  const PANEL_A = LABEL_A + ': P 3 · T 0 · A 0 · E 0 · D 0 · 100% | Year: P 8 · T 0 · A 0 · E 0 · D 0 · 100%';
  const PANEL_B = LABEL_B + ': P 5 · T 0 · A 0 · E 0 · D 0 · 100% | Year: P 8 · T 0 · A 0 · E 0 · D 0 · 100%';
  const SENTINEL = 'WO-2.17 sentinel — this screen was not repainted';
  const SR_SENTINEL = 'WO-2.18 sentinel — nothing was announced';

  const plant = await evalJs(`(function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var clsId = c.getSelectedClassId();
    var cls = (d.classes || []).filter(function(x){ return x.id === clsId; })[0];
    if (!cls) return { ok:false, why:'no class is open, so there is no term nav to tap' };
    /* Parked on the window rather than carried back through this call: the teardown at the foot of
       the block has to put the SAME object graph back, and a document that made the round trip
       through CDP would come back as a copy of a copy. NO BACKTICKS IN THIS COMMENT. */
    window.__wo217 = { doc: JSON.stringify(d), classId: clsId, termId: c.getSelectedTermId() };
    s.update(function(doc){
      cls.terms = [
        { id:'tm_wo217a', label:'WO-2.17 early', start:'2026-02-02', end:'2026-02-06' },
        { id:'tm_wo217b', label:'WO-2.17 late', start:'2026-03-02', end:'2026-03-13' }
      ];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(cls.roster)) cls.roster = [];
      doc.attendance = doc.attendance.filter(function(r){ return r.classId !== clsId; });
      ['2026-02-02','2026-02-03','2026-02-04',
        '2026-03-02','2026-03-03','2026-03-04','2026-03-05','2026-03-06'].forEach(function(date){
        doc.attendance.push({ classId: clsId, date: date, marks: {} }); });
      doc.students.push({ id:'wo217-student', first:'Term', last:'Probe' });
      cls.roster.push('wo217-student');
    });
    /* Whatever the sections above left on the toolbar, so the planted row is drawn and its totals
       are the whole roster's arithmetic rather than a filtered subset's. */
    a.setSearch(''); a.setFilter('all');
    c.selectClass(clsId);
    a.renderAttendance();
    return { ok:true, classId: clsId, name: cls.name };
  })()`);

  const READ = `(function(){
    var nav = document.getElementById('termNav');
    var btns = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
    var row = document.querySelector('[data-attendance-row="wo217-student"]');
    var line = row ? row.querySelector('.attendance-student-totals') : null;
    /* WO-2.18. Out of the panel the teacher is looking at, not out of the map that fed it. */
    var panel = document.querySelector('tr[data-attendance-detail-row="wo217-student"]');
    var panelLine = panel ? panel.querySelector('.attendance-detail-totals') : null;
    var up = function(id){ var el = document.getElementById(id);
      return !!(el && !el.classList.contains('hidden')); };
    return {
      terms: btns.map(function(b){ return { id: b.getAttribute('data-term-select'),
        label: b.textContent, active: b.classList.contains('active') }; }),
      classText: (document.getElementById('attendanceTotals') || {}).textContent || '',
      rowText: line ? line.textContent : '',
      panelUp: !!panel,
      panelText: panelLine ? panelLine.textContent : '',
      sentinel: !!(row && row.getAttribute('data-wo217-sentinel')),
      summary: (document.getElementById('assignmentsSummary') || {}).textContent || '',
      registryUp: up('classView'), listUp: up('assignmentsView'), homeUp: up('homeView') }; })()`;

  if (!plant.ok) {
    check('the WO-2.17 fixture is real: the registry is up, over two dated terms whose windows hold three meetings and five',
      false, plant.why);
  } else {
    await evalJs(`(function(){ var row = document.querySelector('[data-attendance-row="wo217-student"]');
      if (row) row.setAttribute('data-wo217-sentinel', '1'); return !!row; })()`);
    /* WO-2.18: the panel is opened through the ⋯ the teacher taps, before anything is read, so that
       every read below is taken with the third painted surface on screen. */
    await clickSel('[data-attendance-detail="wo217-student"]');
    const before = await evalJs(READ);
    check('the WO-2.17 fixture is real: the registry is up, over two dated terms whose windows hold three meetings and five',
      before.registryUp && before.terms.length === 2
        && before.terms[0].id === TERM_A && before.terms[1].id === TERM_B
        && before.terms[0].active && !before.terms[1].active
        && before.classText === LINE_A && before.rowText === ROW_A && before.sentinel,
      JSON.stringify(before.terms.map((t) => t.label + (t.active ? ' (open)' : ''))) + ' :: '
        + JSON.stringify(before.classText) + ' :: ' + JSON.stringify(before.rowText));

    await clickSel('#termNav [data-term-select="' + TERM_B + '"]');
    const after = await evalJs(READ);
    check('switching term on the attendance registry updates the totals line in the same paint — no mark, no reload, no second tap',
      before.classText === LINE_A && after.classText === LINE_B
        && !!(after.terms[1] || {}).active,
      JSON.stringify(before.classText) + ' -> ' + JSON.stringify(after.classText));
    check('and each student\'s own term line goes with it, rather than the class figure moving alone',
      before.rowText === ROW_A && after.rowText === ROW_B,
      JSON.stringify(before.rowText) + ' -> ' + JSON.stringify(after.rowText));
    /* THE THIRD SURFACE (WO-2.18). paintRenderedTotals()'s own header names three, the two checks
       above are the first two, and an open panel is the one a teacher opened because she wanted the
       detail. Its own figures, read out of the panel, in the same tap as the two lines above. */
    check('and the open detail panel moves with them, which is the third surface the same paint owes',
      before.panelUp && after.panelUp
        && before.panelText === PANEL_A && after.panelText === PANEL_B,
      'panel open before = ' + before.panelUp + ', after = ' + after.panelUp + ' :: '
        + JSON.stringify(before.panelText) + ' -> ' + JSON.stringify(after.panelText));
    /* THE TRAP, MEASURED. Repainting the whole registry would make the two checks above pass and
       this one fail: the marked row would be a different element by then. The registry's columns are
       a window of dates and do not move when the term does, so a term change owes the teacher the
       figures and nothing else — src/attendance.js's own history is one long argument about paint
       cost (WO-2.13 exists because the totals were computed once per student). */
    check('the term change repaints the figures and not the grid under them — the rows the teacher was looking at are the same elements',
      after.sentinel && after.rowText !== before.rowText,
      'the marked row survived the switch = ' + after.sentinel + ', and its totals moved = '
        + (after.rowText !== before.rowText));

    /* The panel closed the way it was opened (WO-2.18). The three checks below drive other screens,
       and a panel left open behind them would be a fixture none of them asked for. */
    await clickSel('[data-attendance-detail="wo217-student"]');

    /* THE OTHER SCREEN THE NAV SITS ON, which is WO-3.3's line and must not regress — and the same
       tap must leave the registry it is not on alone. */
    await clickSel('#classView [data-class-screen="assignments"]');
    await evalJs(`(function(){ var t = document.getElementById('attendanceTotals');
      if (t) t.textContent = ${JSON.stringify(SENTINEL)}; return 1; })()`);
    await clickSel('#termNav [data-term-select="' + TERM_A + '"]');
    const onList = await evalJs(READ);
    check('switching term on the assignment list still repaints it, and the tap is the only action it takes',
      onList.listUp && !onList.registryUp
        && onList.summary.indexOf('Assignments · ' + LABEL_A + ' · ') === 0
        && !!(onList.terms[0] || {}).active,
      JSON.stringify(onList.summary.slice(0, 64)));
    check('and the registry is not repainted from under the assignment list, because it is not the screen that is up',
      onList.classText === SENTINEL,
      JSON.stringify(onList.classText.slice(0, 64)));

    /* AND FROM THE CLASS GRID, where the term nav is still drawn and no class screen is on the
       glass. Nothing in <main> reads the term there, so nothing in <main> is repainted — asserted
       against both class screens at once, with the nav's own active mark as the proof that the tap
       landed at all. A blanket repaint passes every check above this one and fails this. */
    await clickSel('#assignmentsView [data-view-home]');
    await evalJs(`(function(){
      var t = document.getElementById('attendanceTotals');
      var s = document.getElementById('assignmentsSummary');
      if (t) t.textContent = ${JSON.stringify(SENTINEL)};
      if (s) s.textContent = ${JSON.stringify(SENTINEL)};
      return 1; })()`);
    await clickSel('#termNav [data-term-select="' + TERM_B + '"]');
    const onHome = await evalJs(READ);
    check('a term change made from the class grid repaints neither class screen — the fix is a chain, not a blanket repaint of everything',
      onHome.homeUp && !onHome.registryUp && !onHome.listUp
        && onHome.classText === SENTINEL && onHome.summary === SENTINEL
        && !!(onHome.terms[1] || {}).active,
      'class grid up = ' + onHome.homeUp + ', the nav moved to '
        + JSON.stringify((onHome.terms[1] || {}).label) + ', both screens untouched = '
        + (onHome.classText === SENTINEL && onHome.summary === SENTINEL));

    /* A TERM ID FROM ANOTHER CLASS, AIMED AT THIS ONE (WO-2.18). There is no control that can do
       this — the nav only ever draws the open class's terms — so it goes through the seam, which is
       the same exception the future-date check in the attendance section names. What a restore, a
       hand edit or a class switched under a stale handler CAN produce is exactly this call, and the
       guard's whole job is that it writes nothing. Borrowed from whichever other class in the
       document carries a term rather than from a planted one: an id nothing else in this run has
       ever seen would be a weaker fixture than a real one belonging to a real class. */
    const foreign = await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc(), clsId = c.getSelectedClassId();
      var other = (d.classes || []).filter(function(x){
        return x.id !== clsId && (x.terms || []).length; })[0];
      if (!other) return { ok:false, why:'no other class in this document carries a term id to borrow' };
      var read = function(){
        var nav = document.getElementById('termNav');
        var btns = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
        return {
          pref: JSON.stringify(window.planbook.getPref('openTermIds') || {}),
          term: c.getSelectedTermId(),
          active: btns.filter(function(b){ return b.classList.contains('active'); })
            .map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
          offered: btns.map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
          totals: (document.getElementById('attendanceTotals') || {}).textContent || '' };
      };
      var live = document.getElementById('srLive');
      if (live) live.textContent = ${JSON.stringify(SR_SENTINEL)};
      var was = read();
      /* CAUGHT RATHER THAN LET FLY, and it is asserted below. A build whose guard is gone reaches
         term.label on a term this class does not have and throws — which writes no preference and
         announces nothing, so the three claims below would all be satisfied by a screen that had
         just broken. Caught here, it is one red check; uncaught, it is the whole run. */
      var threw = '';
      try { c.selectTerm(other.terms[0].id); } catch (e) { threw = String(e && e.message || e); }
      /* announce() clears and then writes on a 30ms timer so that an identical repeat reaches
         assistive tech as a change (src/live-region.js). Reading straight back would report
         silence from a build that spoke. */
      await new Promise(function(r){ setTimeout(r, 250); });
      return { ok:true, borrowed: other.terms[0].id, from: other.name,
        was: was, now: read(), said: live ? live.textContent : '', threw: threw };
    })()`);
    check('a term id belonging to ANOTHER class writes no preference, moves no highlight and announces nothing',
      foreign.ok && !foreign.threw && foreign.now.pref === foreign.was.pref
        && foreign.now.term === foreign.was.term
        && foreign.now.active === foreign.was.active
        && foreign.now.offered === foreign.was.offered
        && foreign.said === SR_SENTINEL
        && foreign.now.totals === SENTINEL,
      foreign.ok
        ? JSON.stringify(foreign.borrowed) + ' from ' + JSON.stringify(foreign.from) + ' :: '
          + 'preference ' + foreign.was.pref + ' -> ' + foreign.now.pref + ', open term '
          + JSON.stringify(foreign.was.term) + ' -> ' + JSON.stringify(foreign.now.term)
          + ', nav active ' + JSON.stringify(foreign.was.active) + ' -> '
          + JSON.stringify(foreign.now.active) + ', said ' + JSON.stringify(foreign.said)
          + (foreign.threw ? ', and it THREW: ' + foreign.threw : '')
        : foreign.why);

    /*
      The document back as it was, IN PLACE rather than as a fresh object — every module holds the
      reference getDoc() handed it — and the class and term this block found open put back with it.
      The section below reloads onto whatever is left here and expects to arrive inside a class, so
      the last act is selectClass(), exactly as the assignments teardown above ends on a tab.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo217, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      c.selectClass(saved.classId);
      /* The preference is still naming tm_wo217b, which no longer exists — resolved rather than
         trusted (src/classes.js), so this is tidiness and not a repair. */
      if (saved.termId) c.selectTerm(saved.termId);
      a.setSearch(''); a.setFilter('all'); a.renderAttendance();
      delete window.__wo217;
      await s.flush();
      return 1; })()`);
  }
}

/* ───────────────── attendance ─────────────────
 *
 * WO-2.1's twelve acceptance lines, driven through the controls a teacher touches: the screen is
 * opened by clicking the state line on a real card, marks are made by tapping real cells, past
 * days are unlocked with the real pencil, and the class is dropped and un-dropped with the real
 * column head. The window.planbook.attendance seam is used only to READ — what stateOf() says
 * about a class, what the app thinks today is — because the alternative is a second copy of "is
 * this class taken" living in this file, where it could agree with itself and disagree with the
 * app. That is precisely the failure the three states exist to prevent.
 *
 * ONE EXCEPTION TO READ-ONLY, and it is named here because it is the only one: acceptance line 9
 * says future dates are blocked, and a blocked path has no control to click. The check that proves
 * it calls setMark() through the seam with tomorrow's date and asserts nothing lands. Driving it
 * from the UI is impossible by construction, which is the claim.
 *
 * THREE CLAIMS HERE ARE ABOUT WHAT IS *NOT* IN THE DOCUMENT, and an absence check with nothing
 * behind it is not evidence — so each is paired with the presence that proves the fixture was
 * real. "No P is stored" is asserted over a class of 26 with four exceptions on it, counted; the
 * twenty-two silent students are the claim, and the four loud ones are what makes the silence mean
 * something. "No submit step" is asserted as the absence of a form and of any button whose label
 * is save/submit/finalize/apply, on a dialog whose other controls are enumerated in the same read.
 * "No future column" is asserted against a window whose six dates this file computes for itself.
 *
 * WHAT IS NOT HERE, AND IS OWED TO A HUMAN: WO-2.1's acceptance lines 2, 6 and 8. Six columns
 * readable on the iPad the owner actually holds, twenty-five students in under fifteen seconds, and
 * a "not today" strip legible across a lit classroom all need a thumb, a device and eyes. This
 * section measures what a desk can measure about them — six columns rendered and no sideways
 * scroll at 800px and at an emulated coarse 1024px, a path that is one tap per absence with
 * nothing to submit, and a banner that is on screen and carries the date in words — and none of
 * those three is the line. They stay 👤 items in TESTING.md.
 *
 * ── WO-2.10, AND WHY MOST OF THIS SECTION MOVED RATHER THAN GREW ──
 *
 * A cell is an OBJECT now — `{ code, at?, note? }` — and a class that has been started holds a `U`
 * for every student nobody has reached yet. Both of those change what every read below sees, so the
 * reader was re-pointed rather than extended: `values` counts `.code`, and it counts what it finds
 * however deep, so a cell that is still a bare string shows up as its own entry rather than as
 * `[object Object]` in a tally nobody reads.
 *
 * THE THREE NEW CLAIMS THAT ARE ABOUT AN ABSENCE, each paired with the presence that makes it mean
 * something. "One tap changes no other cell" is asserted by reading all twenty-six cells before and
 * after, not by reading the one that was tapped — the work order says so in as many words, and a
 * check that read only the tapped cell would have passed the build this work order exists to
 * replace. "No bare string anywhere" is asked of every cell in the whole document, across every
 * year-level fixture this run has written, with the object count printed beside it so a zero cannot
 * pass for a clean sweep. And "no stray tardy time" is asserted on a cell that DOES carry a time —
 * the dismissal's — so that "no `at`" cannot be true because nothing was ever stamped.
 */

console.log('\n--- attendance ---');

/* Flushed then reloaded, for the reason every section here reloads (tools/README.md trap 6) and
   for one that belongs to this feature: the registry is filled from the document when its dialog
   opens, and a screen that renders only because the module still holds what it just wrote is a
   screen that is empty on the teacher's next launch — which for attendance is a period of a term
   gone. */
await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
/*
  THE VIEWPORT IS PINNED HERE, AND IT WAS NOT BEFORE WO-2.8. Every claim in this section is about a
  six-column grid, and how many columns the grid draws is a function of the viewport: src/attendance.js
  budgets the width and shows fewer days rather than scrolling sideways. Until the Passes column
  landed, the browser's own default window happened to be wide enough for six and nobody had to say
  so — which is a check whose premise is an accident of the harness, and the accident stopped
  holding the moment a 160px column joined the table. 1280 is a laptop, it is where six columns fit
  on a fine pointer with the pass column in place, and it is now stated rather than inherited.
  Cleared at the end of the section, before the coarse touch sweep sets its own.
*/
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const attBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

/*
  Today's date, computed HERE, in Node, off the same machine clock the browser is reading.

  This is the one value in this section that is deliberately not asked of the app. src/attendance.js
  builds it out of the local calendar fields precisely because toISOString() would return UTC — a
  different day from about 7pm Eastern onward — and a check that asked the app what today was would
  agree with a UTC bug perfectly. Two runtimes, one clock, one answer.
*/
const nodeToday = (() => {
  const n = new Date();
  const p = (x) => (x < 10 ? '0' : '') + x;
  return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate());
})();

/*
  And the COLUMNS, computed here too, for the same reason and for a second one.

  The work order's rule is "the last N weekdays, Mon-Fri, by calendar" — deliberately not "the
  dates this class has records for", because a day you forgot has no record and a window built from
  records would omit exactly the column you opened the screen to find. A check that asked the app
  which dates it had chosen could not tell those two rules apart; it would agree with either. So
  this file derives the window from the calendar and compares.

  Today is always index 0, whatever day of the week it is — the app's own documented divergence
  from a literal reading of "weekday", matching Roll Call!'s "today plus the five preceding
  weekdays". On the five days that matter the two readings are the same list.
*/
const nodeColumns = (count, offset) => {
  const p = (x) => (x < 10 ? '0' : '') + x;
  const iso = (x) => x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate());
  const d = new Date();
  const out = [];
  while (out.length < count * (offset + 1)) {
    const dow = d.getDay();
    if (!out.length || (dow !== 0 && dow !== 6)) out.push(iso(d));
    d.setDate(d.getDate() - 1);
  }
  return out.slice(offset * count, offset * count + count);
};
const thisWeek = nodeColumns(6, 0);
const lastWeek = nodeColumns(6, 1);
/* And the same walk the other way, derived here for the same reason nodeColumns is: since
   2026-08-08 the registry pages FORWARD as far as the calendar goes, and a check that asked the app
   which future dates it had chosen would agree with any answer it gave. `n` is in weekdays after
   today, 1-based — nodeWeekdayAhead(1) is the next weekday, whatever today is. */
const nodeWeekdayAhead = (n) => {
  const p = (x) => (x < 10 ? '0' : '') + x;
  const d = new Date();
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
const daysApart = (a, b) => Math.round(
  (new Date(a.slice(0, 4), Number(a.slice(5, 7)) - 1, a.slice(8, 10))
    - new Date(b.slice(0, 4), Number(b.slice(5, 7)) - 1, b.slice(8, 10))) / 86400000);
const tomorrow = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (x) => (x < 10 ? '0' : '') + x;
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
})();

/* One page-side reader for the whole section, for the reason window.__cls and window.__ros exist:
   one round trip per check, and the reads cannot drift apart between them. */
const INSTALL_ATT_READER = `(function(){
  function hookOf(b){
    var out = '';
    Array.prototype.slice.call(b.attributes).forEach(function(x){
      if (x.name.indexOf('data-attendance-') === 0) out = x.name + (x.value ? '=' + x.value : '');
    });
    return out;
  }
  window.__att = function(){
    var doc = window.planbook.store.getDoc();
    var a = window.planbook.attendance;
    var openId = window.planbook.classes.getSelectedClassId();
    var open = doc.classes.filter(function(c){ return c.id === openId; })[0] || null;
    var active = doc.classes.filter(function(c){ return !c.archived; });
    /* The registry is a VIEW in <main> since WO-1.13, not a dialog over the cards. So "is it up" is
       a question about #classView, and "did anything open a dialog to get here" is a separate
       question with its own answer below — the two used to be one field, and the acceptance line
       that says a class opens WITHOUT a dialog cannot be asked of a build where they still are.
       (No backticks in this comment: it is inside a template literal.) */
    var view = document.getElementById('classView');
    var home = document.getElementById('homeView');
    var heads = Array.prototype.slice.call(
      document.querySelectorAll('#attendanceHead th[data-attendance-col]'));
    var rows = Array.prototype.slice.call(
      document.querySelectorAll('#attendanceBody tr[data-attendance-row]'));
    var actions = Array.prototype.slice.call(document.querySelectorAll('#attendanceActions button'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('#homeGrid .class-card'));
    function studentById(id){ return doc.students.filter(function(s){ return s.id === id; })[0] || null; }
    return {
      rev: doc.rev,
      appToday: a.todayISO(),
      openClass: openId,
      activeIds: active.map(function(c){ return c.id; }),
      /* Every attendance record in the document, verbatim, WITH ITS KEY SET. A record carrying a
         key nobody meant to write is exactly what one record per class per date is supposed to
         rule out, and a check that only read the fields it expected could not see one. */
      records: doc.attendance.map(function(r){
        return { classId: r.classId, date: r.date, exception: r.exception,
                 keys: Object.keys(r).sort().join(','),
                 marks: r.marks ? JSON.parse(JSON.stringify(r.marks)) : null }; }),
      /* Today's, separately. The document arrives here already holding records on 2026-09-09 and
         after: the class manager section pushes a fixture onto a class it is about to delete and
         onto a neighbour it is not, so that "it deleted the right one" is falsifiable, and the
         neighbour's survives. That residue is kept rather than cleaned away, because it is the only
         thing in the run that can catch a screen which writes onto the wrong date or reads the
         array without filtering. (No backticks in this comment: it is inside a template literal.) */
      today: doc.attendance.filter(function(r){ return r.date === a.todayISO(); })
        .map(function(r){
          return { classId: r.classId, date: r.date, exception: r.exception,
                   keys: Object.keys(r).sort().join(','),
                   marks: r.marks ? JSON.parse(JSON.stringify(r.marks)) : null }; }),
      /* Every mark CODE stored anywhere in the document, counted. The no-P claim is asked of the
         whole document rather than of the class on screen — one P anywhere is the trap sprung,
         whatever date it is on. A cell that is somehow still a bare string is counted under its own
         string, so it lands in this tally as itself rather than being folded in with the objects.
         (No backticks in this comment: it is inside a template literal.) */
      values: (function(){ var out = {};
        doc.attendance.forEach(function(r){
          Object.keys(r.marks || {}).forEach(function(k){
            var c = r.marks[k], code = (c && typeof c === 'object') ? c.code : String(c);
            out[code] = (out[code] || 0) + 1; });
        });
        return out; })(),
      todayValues: (function(){ var out = {};
        doc.attendance.filter(function(r){ return r.date === a.todayISO(); }).forEach(function(r){
          Object.keys(r.marks || {}).forEach(function(k){
            var c = r.marks[k], code = (c && typeof c === 'object') ? c.code : String(c);
            out[code] = (out[code] || 0) + 1; });
        });
        return out; })(),
      /* THE SHAPE OF EVERY CELL IN THE DOCUMENT, which is WO-2.10's acceptance line 13 and is a
         question about storage rather than about the screen. The object count is the guard against
         a vacuous pass: zero bare strings and zero cells at all are the same number otherwise, and
         this run legitimately empties the document between sections. The key tally is every field
         name used by any cell anywhere, so a cell carrying something nobody meant to write is
         visible here rather than only in a record dump.
         (No backticks in this comment: it is inside a template literal.) */
      cells: (function(){ var out = { objects:0, strings:0, other:0, bare:[], keys:{} };
        doc.attendance.forEach(function(r){
          Object.keys(r.marks || {}).forEach(function(k){
            var c = r.marks[k];
            if (typeof c === 'string') { out.strings++; out.bare.push(r.date + ' ' + k + ' = ' + JSON.stringify(c)); }
            else if (c && typeof c === 'object' && !Array.isArray(c)) { out.objects++;
              Object.keys(c).forEach(function(f){ out.keys[f] = (out.keys[f] || 0) + 1; }); }
            else { out.other++; out.bare.push(r.date + ' ' + k + ' = ' + JSON.stringify(c)); }
          });
        });
        return out; })(),
      states: active.map(function(c){ return c.id + '=' + a.stateOf(c.id, a.todayISO()); }).join(' '),
      /* ── WO-2.8, and the first two fields are the whole work order ──
         Both hall-pass collections, verbatim and WITH THEIR KEY SETS, read off the open document.
         An open pass has to be IN HERE rather than in a module variable: Roll Call! keeps its
         active passes in memory, and a build that copied that would answer every question on the
         screen correctly and answer this one with an empty array after a reload. A pass carrying a
         key nobody meant to write — a name, most of all — shows up in the key set rather than
         nowhere.
         (No backticks in this comment: it is inside a template literal.) */
      openPasses: (doc.openPasses || []).map(function(p){
        return { id: p.id, studentId: p.studentId, classId: p.classId, type: p.type, out: p.out,
                 note: p.note, keys: Object.keys(p).sort().join(',') }; }),
      passLog: (doc.passes || []).map(function(p){
        return { id: p.id, studentId: p.studentId, classId: p.classId, type: p.type, out: p.out,
                 back: p.back, minutes: p.minutes, endedBy: p.endedBy, note: p.note,
                 keys: Object.keys(p).sort().join(',') }; }),
      /* Both collections as they SIT, byte for byte, which is the only way to ask WO-2.11's first
         acceptance line: "cancelling leaves the pass log byte-identical" is a claim about the array
         and not about the fields this file remembered to read.
         (No backticks in this comment: it is inside a template literal.) */
      passLogJson: JSON.stringify(doc.passes || []),
      openPassJson: JSON.stringify(doc.openPasses || []),
      /* ── WO-2.3, and the second field is the whole work order ──
         Every calendar event, verbatim and WITH ITS KEY SET, so an entry carrying a field nobody
         meant to write shows up here rather than nowhere. And doc.attendance serialised BYTE FOR
         BYTE, which is the only honest way to ask "authoring an event created no attendance
         record": a count would pass a build that rewrote a record in place, and a field-by-field
         read would pass one that added a field this file forgot to look for. The Traps line is
         about a copy appearing in that array, so the array is compared as a string.
         (No backticks in this comment: it is inside a template literal.) */
      events: (doc.events || []).map(function(e){
        return { id: e.id, kind: e.kind, date: e.date, endDate: e.endDate, title: e.title,
                 classIds: (e.classIds || []).join(','),
                 keys: Object.keys(e).sort().join(',') }; }),
      attJson: JSON.stringify(doc.attendance || []),
      /* THE WHOLE DOCUMENT, serialised. Used once, to ask where a cancelled pass's note went: the
         answer is meant to be nowhere, and "nowhere" is a question about the document rather than
         about the two arrays a check might think to look in. */
      docJson: JSON.stringify(doc),
      /* ── WO-2.11: the pass banner ──
         One card per open pass IN THE CLASS ON SCREEN. Read off the DOM rather than off the
         document, so "the card says he is out" and "the document says he is out" stay two facts
         that can disagree — and the geometry with it, because the acceptance line that matters most
         here is where the banner IS: above the grid, costing the registry no width.
         (No backticks in this block: it is inside a template literal.) */
      passBanner: (function(){
        var box = document.getElementById('attendancePassBanner');
        var wrap = document.getElementById('attendanceGridWrap');
        if (!box) return null;
        var shown = !box.classList.contains('hidden');
        var br = box.getBoundingClientRect(), wr = wrap ? wrap.getBoundingClientRect() : null;
        return { shown: shown, label: box.getAttribute('aria-label') || '',
                 /* Inside the grid would be beside the rows by another name. */
                 insideGrid: !!(wrap && wrap.contains(box)),
                 aboveGrid: !!(wr && br.bottom <= wr.top + 0.5),
                 cards: Array.prototype.slice.call(box.querySelectorAll('.attendance-pass-card'))
                   .map(function(c){
                     var back = c.querySelector('[data-pass-return]');
                     var drop = c.querySelector('[data-pass-cancel]');
                     var note = c.querySelector('[data-pass-note]');
                     return { name: ((c.querySelector('.attendance-pass-card-name') || {}).textContent || '').trim(),
                              type: ((c.querySelector('.attendance-pass-card-type') || {}).textContent || '').trim(),
                              out: ((c.querySelector('.attendance-pass-card-out') || {}).textContent || '').trim(),
                              student: back ? back.getAttribute('data-pass-return') : '',
                              cancels: drop ? drop.getAttribute('data-pass-cancel') : '',
                              backText: back ? (back.textContent || '').trim() : '',
                              cancelText: drop ? (drop.textContent || '').trim() : '',
                              cancelLabel: drop ? (drop.getAttribute('aria-label') || '') : '',
                              note: note ? note.value : null }; }) }; })(),
      /* Every name in the document, so that "the log is keyed by student id, never by name" can be
         asked as "does the serialised pass log contain any of these strings" rather than as "does
         it contain the fields I remembered to look for". */
      names: doc.students.map(function(s){ return s.first + ' ' + s.last; }),
      passJson: JSON.stringify(doc.passes || []) + JSON.stringify(doc.openPasses || []),
      /* The reason the pass buttons are off, when it is up. It is the acceptance line's "on screen
         rather than a dead control", so it is read as text and not as a class. */
      passNote: (function(){ var n = document.getElementById('attendancePassNote');
        return n && !n.classList.contains('hidden') ? (n.textContent || '').trim() : ''; })(),
      passColumn: document.querySelectorAll('#attendanceHead th.attendance-passes').length,
      /* What the OPEN class's state is on each date the grid is showing, asked of the predicate
         rather than read off the screen — so "the header says Taken" and "the document says taken"
         are two facts that can disagree and be caught disagreeing. */
      colStates: open ? heads.map(function(th){
        var d = th.getAttribute('data-attendance-col');
        return d + '=' + a.stateOf(open.id, d); }).join(' ') : '',
      /* The open class roster as pairs, so this file can derive the order it expects rather than
         asking the app what order it chose. */
      roster: open ? (open.roster || []).map(function(id){
        var s = studentById(id); return s ? [s.last, s.first] : null; }).filter(Boolean) : [],
      /* Which view is in <main>, read off the DOM rather than off the preference: the preference is
         what a reload restores and this is what a teacher is looking at, and a check that asked the
         preference could not tell those two apart. */
      viewShown: !!(view && !view.classList.contains('hidden')),
      homeShown: !!(home && !home.classList.contains('hidden')),
      /* Every overlay on the page that is currently up. Zero is the claim: opening a class is
         navigation now, and a registry that arrived by opening a dialog would be the Traps line's
         first failure mode wearing the new markup. */
      dialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
        .filter(function(m){ return !m.classList.contains('hidden'); }).map(function(m){ return m.id; }),
      /* And what the view IS, in the markup sense: a page-level surface with no dialog semantics
         left on it. A dialog role, an aria-modal, or a close control are what the Traps line calls a
         dialog pretending to be a page. */
      viewRoles: view ? Array.prototype.slice.call(view.querySelectorAll('[role],[aria-modal]'))
        .map(function(e){ return (e.getAttribute('role') || '') + (e.getAttribute('aria-modal') ? '/modal' : ''); })
        .filter(function(r){ return r === 'dialog' || r.indexOf('/modal') >= 0; }) : ['no view'],
      viewCloses: view ? view.querySelectorAll('[data-modal-close]').length : -1,
      /* The way back out, and there are two doors on one hook — the tab at the head of the class
         row and the button in the view's own panel header. ON SCREEN ONLY, which is the whole point
         since WO-1.13: both live in the markup at all times, one of them inside the view that is
         hidden and one of them on a strip that is not drawn on the grid, so a count of the DOM would
         report the same number from either screen and could not tell "two ways back from a class"
         from "a way back offered on the screen you are already on". */
      homeDoors: Array.prototype.slice.call(document.querySelectorAll('[data-view-home]'))
        .filter(function(b){ return b.offsetParent !== null; })
        .map(function(b){ return (b.textContent || '').trim(); }),
      className: (document.getElementById('attendanceClassName') || {}).textContent,
      dateText: (document.getElementById('attendanceDate') || {}).textContent,
      stateText: (document.getElementById('attendanceState') || {}).textContent,
      stateClass: (document.getElementById('attendanceState') || {}).className,
      note: (function(){ var n = document.getElementById('attendanceNote');
        return n && !n.classList.contains('hidden') ? n.textContent : ''; })(),
      /* The "you are not on today" strip: whether it is up, and what it says. */
      banner: (function(){ var b = document.getElementById('attendanceBanner');
        return { shown: !!(b && !b.classList.contains('hidden')),
                 text: b ? (b.textContent || '').trim() : '' }; })(),
      actions: actions.map(function(b){
        return { text: (b.textContent || '').trim(), hook: hookOf(b),
                 pressed: b.getAttribute('aria-pressed') }; }),
      /* One entry per column: the date it will write, the word above it, the classes that paint it,
         and the one control that belongs to that day. */
      columns: heads.map(function(th){
        var btn = th.querySelector('button');
        return { date: th.getAttribute('data-attendance-col'),
                 dow: ((th.querySelector('.attendance-day-dow') || {}).textContent || '').trim(),
                 shown: ((th.querySelector('.attendance-day-date') || {}).textContent || '').trim(),
                 chip: ((th.querySelector('.attendance-day-state') || {}).textContent || '').trim(),
                 cls: th.className,
                 btn: btn ? hookOf(btn) : '',
                 btnText: btn ? (btn.textContent || '').trim() : '' }; }),
      pager: Array.prototype.slice.call(document.querySelectorAll('#attendancePager button'))
        .map(function(b){ return { text: (b.textContent || '').trim(),
                                   value: b.getAttribute('data-attendance-page'),
                                   disabled: !!b.disabled, title: b.title || '' }; }),
      pills: Array.prototype.slice.call(document.querySelectorAll('#attendancePills .pill'))
        .map(function(b){ return { code: b.getAttribute('data-attendance-filter'),
                                   active: b.classList.contains('active'),
                                   pressed: b.getAttribute('aria-pressed') }; }),
      sorts: Array.prototype.slice.call(document.querySelectorAll('#attendanceSort button'))
        .map(function(b){ return { which: b.getAttribute('data-attendance-sort'),
                                   active: b.classList.contains('active') }; }),
      rowCount: rows.length,
      /* Per row: whose it is, the name as drawn, and the glyph in every column of that row read
         left to right — "P?PP-P" is a whole row's story in six characters, and it is what makes a
         hole in the grid a thing this file can see rather than infer.

         THE GLYPH IS READ OFF THE CELL, NOT OFF THE td. Since WO-2.10 a td can also hold the time
         caption under the circle, so reading the td's own textContent yields "T8:14a" and every
         check that compares a row to a string of letters breaks on four characters that are not a
         mark. Same trap, and the same answer, as the avatar initials in the name cell below.
         (No backticks in this comment: it is inside a template literal.) */
      rows: rows.map(function(r){
        var tds = Array.prototype.slice.call(r.querySelectorAll('td[data-attendance-col]'));
        /* Read .attendance-student-name, not .attendance-name. The name cell holds an avatar beside
           the name, and the avatar's initials are part of the cell's textContent — reading the cell
           yields "AMAurelio, Marcus" and every check that compares or searches on a name breaks on
           two characters that are in nobody's name. Read the element that holds only the name.
           Falls back to the cell so this still reports something if the span is ever removed.
           NO BACKTICKS IN THIS BLOCK: it lives inside the template literal shipped to the browser,
           and one closes it. Same trap as the apostrophe rule in sw.js, found the same way. */
        return { name: ((r.querySelector('.attendance-student-name')
                         || r.querySelector('.attendance-name') || {}).textContent || '').trim(),
                 student: r.getAttribute('data-attendance-row'),
                 codes: tds.map(function(td){
                   var c = td.querySelector('.attendance-cell');
                   return ((c || td).textContent || '').trim(); }).join(''),
                 /* The time under each glyph, in the same left-to-right order, empty where there is
                    none — so "a tardy shows its time on the screen" is a thing this file reads
                    rather than infers from the document. */
                 times: tds.map(function(td){
                   var t = td.querySelector('.attendance-cell-time');
                   return t ? (t.textContent || '').trim() : ''; }),
                 /* And what a screen reader would be told about each cell, which is where the time
                    and the note are said in full. */
                 labels: tds.map(function(td){
                   var c = td.firstElementChild;
                   return c ? (c.getAttribute('aria-label') || '') : ''; }),
                 dates: tds.map(function(td){ return td.getAttribute('data-attendance-col'); }).join(' '),
                 tappable: tds.filter(function(td){
                   return !!td.querySelector('button[data-attendance-cell]'); }).length,
                 detail: r.querySelector('[data-attendance-detail]') ? 1 : 0,
                 /* This row's Passes cell (WO-2.8): which types it offers, how many of them are
                    switched off, whether it shows a Return instead, and the time out beside it.
                    Read off the buttons rather than off the document, so "the screen says he is
                    out" and "the document says he is out" stay two facts that can disagree.
                    (No backticks in this block: it is inside a template literal.) */
                 pass: (function(){
                   var td = r.querySelector('td[data-pass-cell]');
                   if (!td) return null;
                   var issue = Array.prototype.slice.call(td.querySelectorAll('[data-pass-issue]'));
                   var back = td.querySelector('[data-pass-return]');
                   var since = td.querySelector('.attendance-pass-since');
                   return { types: issue.map(function(b){ return b.getAttribute('data-pass-type'); }).join(','),
                            off: issue.filter(function(b){ return b.disabled; }).length,
                            out: !!back,
                            since: since ? (since.textContent || '').trim() : '',
                            label: back ? (back.getAttribute('aria-label') || '') : '' }; })(),
                 named: tds.filter(function(td){
                   var c = td.firstElementChild;
                   return !!(c && c.getAttribute('aria-label')); }).length }; }),
      /* The one open row-detail panel, or nulls. It is a <tr> of its own under the row it belongs
         to, so "is it open" and "whose is it" are two different questions and both are asked. */
      detail: (function(){
        var tr = document.querySelector('#attendanceBody tr[data-attendance-detail-row]');
        var note = tr ? tr.querySelector('[data-attendance-note]') : null;
        return { open: !!tr, student: tr ? tr.getAttribute('data-attendance-detail-row') : '',
                 text: tr ? (tr.textContent || '').replace(/\\s+/g, ' ').trim() : '',
                 mark: tr && tr.querySelector('.attendance-detail-mark')
                   ? (tr.querySelector('.attendance-detail-mark').textContent || '').trim() : '',
                 hasNote: !!note, note: note ? note.value : '',
                 noteDate: note ? note.getAttribute('data-attendance-note-date') : '',
                 unconfirms: tr ? tr.querySelectorAll('[data-attendance-unconfirm]').length : 0,
                 rows: document.querySelectorAll('#attendanceBody tr[data-attendance-detail-row]').length }; })(),
      /* Anything that would turn one tap into two, or one screen into two. */
      submenus: document.querySelectorAll('#attendanceGridWrap select, #attendanceGridWrap [aria-expanded], #attendanceGridWrap details').length,
      /* The Traps line, as a structure rather than as a promise: no form to submit, and no control
         whose label says it commits anything. */
      forms: document.querySelectorAll('#classView form').length,
      submitish: Array.prototype.slice.call(document.querySelectorAll('#classView button'))
        .map(function(b){ return (b.textContent || '').trim(); })
        .filter(function(t){ return /save|submit|finali|apply|^done$|^ok$/i.test(t); }),
      injected: document.querySelectorAll('#attendanceBody b, #attendanceBody i, #attendanceBody script').length,
      /* Does the grid fit, or does it want a sideways swipe? The desk half of acceptance line 2. */
      fit: (function(){ var w = document.getElementById('attendanceGridWrap');
        if (!w) return null;
        return { over: w.scrollWidth - w.clientWidth,
                 page: document.documentElement.scrollWidth - window.innerWidth,
                 viewport: window.innerWidth }; })(),
      /* The home screen, and what each card says about today. The hook is the class its state line
         belongs to, answered by asking which control the line is INSIDE — since WO-1.13 the card is
         one button and the state line is a span in it, so "this line describes the class this tap
         opens" is a containment question rather than an attribute one. A line rendered onto the
         wrong card, or loose in the grid, reads as null here. */
      cards: cards.map(function(c){
        var s = c.querySelector('.class-card-state');
        var b = c.querySelector('.class-card-open');
        return { id: b ? b.getAttribute('data-class-tab') : null,
                 state: s ? (s.textContent || '').trim() : '',
                 cls: s ? s.className : '',
                 controls: c.querySelectorAll('button').length,
                 hook: (s && b && b.contains(s)) ? b.getAttribute('data-class-tab') : null }; })
    };
  };
  /* How a card's state line is actually PAINTED, for the claim that a dropped class and an untaken
     one are told apart without reading fine print. Computed style rather than declared, because
     what a projector shows is the computed one. */
  window.__look = function(id){
    /* The line inside the card that opens that class. It carried a hook of its own until WO-1.13
       made the card one control; it is a span now, found through the control it sits in. */
    var c = document.querySelector('#homeGrid .class-card-open[data-class-tab="' + id + '"]');
    var b = c ? c.querySelector('.class-card-state') : null;
    if (!b) return null;
    var s = getComputedStyle(b);
    return { text: (b.textContent || '').trim(), bg: s.backgroundColor, border: s.borderTopColor,
             style: s.borderTopStyle, color: s.color };
  };
  /* And the same question asked of a COLUMN — the head and a cell under it together, because the
     work order says the three states have to be distinguishable in the header AND in the cells. */
  window.__colLook = function(date){
    var th = document.querySelector('#attendanceHead th[data-attendance-col="' + date + '"]');
    var td = document.querySelector('#attendanceBody td[data-attendance-col="' + date + '"]');
    if (!th || !td || !td.firstElementChild) return null;
    var chip = th.querySelector('.attendance-day-state');
    var hs = getComputedStyle(th);
    var cs = getComputedStyle(td.firstElementChild);
    return { chip: chip ? (chip.textContent || '').trim() : '',
             chipColor: chip ? getComputedStyle(chip).color : '',
             headBg: hs.backgroundColor, headEdge: hs.borderBottomColor,
             headStyle: hs.borderBottomStyle,
             glyph: (td.firstElementChild.textContent || '').trim(),
             cellBg: cs.backgroundColor, cellEdge: cs.borderTopColor,
             cellStyle: cs.borderTopStyle, cellColor: cs.color }; };
  return 1; })()`;

const attSeam = await evalJs("!!(window.planbook && window.planbook.attendance"
  + " && typeof window.planbook.attendance.stateOf === 'function'"
  + " && typeof window.planbook.attendance.todayISO === 'function')");

if (!attBooted || !attSeam) {
  skip('attendance: the registry, three states in a grid, and no P in the document',
    attBooted ? 'no window.planbook.attendance seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  await evalJs(INSTALL_ATT_READER);
  /* Every dialog in the app, shut. `attendanceModal` is not on this list because there is no such
     thing since WO-1.13 — the registry is a view, and leaving it is navigation rather than a close,
     which is what goHome() below does through the control a teacher taps. */
  const closeAll = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
    + "'rosterPasteModal','rosterModal','teacherModal','termsModal','classDeleteModal','classesModal',"
    + "'daysOffConfirmModal','daysOffModal',"
    + "'backupModal','restoreConfirmModal','yearModal','aboutModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
  /* Back to the class grid, through the tab a teacher taps rather than through the seam — the
     acceptance line is that this control exists and works, so every route this section takes into a
     card goes through it. The header's door is used rather than the panel's because it is on screen
     from either view. */
  const goHome = async () => {
    await closeAll();
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
  };
  /* Flushed before every read that compares `rev`: the number only moves when a write lands, and a
     read taken while one is still on src/store.js's 800ms debounce reports the rev before it. */
  const read = () => evalJs('(async function(){ await window.planbook.store.flush(); return window.__att(); })()');
  /* One class, opened the way a teacher opens one: back to the grid, then a tap on its card. The
     card is one control since WO-1.13 — the state line inside it is a span — so the tap lands on
     `.class-card-open`, which is the same hook the header tab carries. */
  const openCard = async (id) => {
    await goHome();
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + id + '"]');
    return read();
  };
  /* And the same class reached from the header's tab row instead, for the checks that are about the
     header being navigation. Same hook, same route, different door — but a different GESTURE, and
     that is the owner's call on WO-1.13: cards enter, tabs switch. The row is drawn on the class
     view only, so there is no such thing as tapping a class tab from the grid; what this does is
     what a teacher does, which is arrive on some other class and then switch to this one. */
  const openTab = async (id) => {
    await goHome();
    await clickSel('#homeGrid .class-card-open:not([data-class-tab="' + id + '"])');
    await clickSel('#classTabBar [data-class-tab="' + id + '"]');
    return read();
  };
  /* One cell, by student and by date — the same selector src/attendance.js writes, so a check that
     cannot find it is a check reporting that the hook moved. */
  const cellSel = (student, date) => '#attendanceBody [data-attendance-cell="' + student
    + '"][data-attendance-date="' + date + '"]';
  const tapCell = (student, date) => clickSel(cellSel(student, date));
  const park = async () => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
    await new Promise(r => setTimeout(r, 100));
  };
  /* Every record this section writes on a date that is not today, counted as it goes, so the
     "nothing else was disturbed" clause at the bottom is arithmetic rather than a guess. */
  let pastWrites = 0;

  /*
    A SIXTH CLASS, MADE HERE, THROUGH THE CONTROL A TEACHER MAKES ONE WITH.

    The classes section leaves five on the bar on purpose — it creates seven, deletes one to prove
    delete destroys records, and leaves one archived so the touch section has a delete confirm to
    measure. Five is one short of what this section needs, and the missing one is not a rounding
    detail: the day below is a full day of FIVE classes marked, and the sixth is the one still
    saying "Not taken yet" when the last bell goes. Without it there is no untaken class left at
    the end of the run, and the three states collapse to two in the exact check that exists to
    prove they do not. Made rather than un-archived, because the archived class is another
    section's fixture and handing it back afterwards is a state juggle that fails silently.
  */
  await closeAll();
  await clickSel('header [data-class-manage]');
  await evalJs('(function(){ document.getElementById("classNewInput").value = "Study Hall";'
    + ' return 1; })()');
  await clickSel('[data-class-create] button[type="submit"]');
  await closeAll();

  const start = await read();
  const ids = start.activeIds;

  /* ── the day loads showing all classes, and the third state is the one they are all in ── */

  /*
    `start.today` rather than `start.records`: the residue named in the reader above sits on
    2026-09-09 and after, and a section that demanded an empty attendance array would be asserting
    that no earlier section left anything behind rather than that this screen has written nothing
    yet. The residue is also why this is worth stating as a precondition at all — if a run ever
    happens to fall on one of those dates the two collide, and this line is where that says so out
    loud instead of turning into six confusing failures further down.
  */
  check('every class on the home screen carries today\'s state, and a day nobody has marked is six untaken classes',
    ids.length === 6 && start.cards.length === 6 && start.today.length === 0
      && start.cards.every((c) => c.state === 'Not taken yet' && / not-taken\b/.test(c.cls))
      && start.cards.map((c) => c.hook).join(',') === ids.join(',')
      && start.states === ids.map((id) => id + '=not-taken').join(' '),
    start.cards.length + ' card(s) ' + JSON.stringify(start.cards.map((c) => c.state))
      + '; records already on ' + nodeToday + ' = ' + start.today.length
      + ', on other dates = ' + (start.records.length - start.today.length));

  /* ── the way in, and the fact that looking is not marking ── */

  const marking = ids[0];
  const opened = await openCard(marking);
  check('one tap on a card puts that class\'s registry in the main area — and opening it writes nothing',
    opened.viewShown && !opened.homeShown && opened.dialogs.length === 0
      && opened.openClass === marking && opened.today.length === 0
      && opened.records.length === start.records.length
      && opened.rev === start.rev && opened.className !== '' && opened.dateText !== ''
      && opened.stateText === 'Not taken yet',
    'open on ' + JSON.stringify(opened.className) + ' for ' + JSON.stringify(opened.dateText)
      + '; class view up = ' + opened.viewShown + ', class grid up = ' + opened.homeShown
      + ', dialogs open = ' + JSON.stringify(opened.dialogs)
      + '; records on ' + nodeToday + ' = ' + opened.today.length + ', records in the document '
      + start.records.length + ' -> ' + opened.records.length
      + ', rev ' + start.rev + ' -> ' + opened.rev);

  check('the date it will write is today in LOCAL time — the same day Node reads off this machine',
    opened.appToday === nodeToday && opened.dateText.indexOf(String(Number(nodeToday.slice(8, 10)))) >= 0,
    'the app says ' + opened.appToday + ', this process says ' + nodeToday
      + ', the screen says ' + JSON.stringify(opened.dateText));

  /* ── the columns are a CALENDAR fact, not a record fact ── */

  check('the columns are the last six weekdays by calendar, most recent first, today at the front',
    opened.columns.length === 6
      && opened.columns.map((c) => c.date).join(' ') === thisWeek.join(' ')
      && opened.columns[0].date === nodeToday
      && / attendance-col-today\b/.test(opened.columns[0].cls)
      && opened.columns.every((c) => c.dow.length === 3 && c.shown.indexOf('/') > 0),
    'rendered ' + JSON.stringify(opened.columns.map((c) => c.dow + ' ' + c.date))
      + '; this process expected ' + JSON.stringify(thisWeek));

  /* The precondition that keeps the rest of this section honest: none of the six dates on screen
     may already carry a record for this class, or every claim below about what a tap wrote is a
     claim about somebody else's fixture. */
  const preexisting = opened.records.filter((r) => r.classId === marking && thisWeek.indexOf(r.date) >= 0);
  check('and none of those six dates already holds a record for this class, so what follows is this section\'s own',
    preexisting.length === 0,
    preexisting.length + ' record(s) already on ' + JSON.stringify(thisWeek)
      + ' for the class about to be marked: ' + JSON.stringify(preexisting));

  /* ── the grid itself: 26 rows, six columns, no submenu, nothing to submit ── */

  const expectedOrder = opened.roster.slice()
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])))
    .map((p) => p[0] + ', ' + p[1]);
  check('a class of 26 draws 26 rows against six days, in surname order, with every cell named for a screen reader',
    opened.rowCount === 26
      && JSON.stringify(opened.rows.map((r) => r.name)) === JSON.stringify(expectedOrder)
      && opened.rows.every((r) => r.dates === thisWeek.join(' ') && r.named === 6)
      && opened.submenus === 0 && opened.injected === 0,
    opened.rowCount + ' row(s) of ' + expectedOrder.length + ' — first three '
      + JSON.stringify(opened.rows.slice(0, 3).map((r) => r.name))
      + ', submenu-shaped controls = ' + opened.submenus);

  /* The desk half of acceptance line 2. It is not the line — the line needs an iPad in the owner's
     hands — but a grid that already wants a sideways swipe at 800px would fail it on any device. */
  check('six columns for a class of 26 fit without a sideways swipe, and the page gains no horizontal scroll',
    !!opened.fit && opened.fit.over <= 0 && opened.fit.page <= 0,
    opened.fit ? 'the grid overflows its box by ' + opened.fit.over + 'px and the page by '
      + opened.fit.page + 'px in a ' + opened.fit.viewport + 'px viewport'
      : 'no grid to measure');

  check('there is no submit step on the registry — no form, and no control that says it saves',
    opened.forms === 0 && opened.submitish.length === 0,
    'forms = ' + opened.forms + ', controls whose label reads as a commit = '
      + JSON.stringify(opened.submitish) + '; class-level controls present = '
      + JSON.stringify(opened.actions.map((a) => a.text)));

  /* ── acceptance 9: there is no tomorrow, on screen or in the storage layer ── */

  const laterBtn = opened.pager.filter((b) => b.value === 'later')[0] || {};
  check('no column is later than today, and the control that would go there is disabled and says why',
    opened.columns.every((c) => c.date <= nodeToday)
      && laterBtn.disabled === true && /tomorrow/i.test(laterBtn.title || ''),
    'latest column = ' + opened.columns[0].date + ' against a today of ' + nodeToday
      + '; the pager reads ' + JSON.stringify(opened.pager.map((b) => b.text
        + (b.disabled ? ' (disabled)' : ''))));

  /*
    And the same rule asked of the storage layer, which is the only check in this section that
    WRITES through the seam. There is no control to click, because a blocked path has none; the
    claim is that the refusal is in the writer rather than in the rendering, so a keyboard path
    added in WO-2.5 inherits it.
  */
  const futureTry = await evalJs('(async function(){'
    + ' var before = window.planbook.store.getDoc().attendance.length;'
    + ' window.planbook.attendance.setMark(' + JSON.stringify(opened.rows[0].student)
    + ", 'A', " + JSON.stringify(tomorrow) + ');'
    + ' window.planbook.attendance.takeClass(' + JSON.stringify(tomorrow) + ');'
    + ' window.planbook.attendance.dropClass(' + JSON.stringify(tomorrow) + ');'
    + ' await window.planbook.store.flush();'
    + ' var doc = window.planbook.store.getDoc();'
    + ' return { before: before, after: doc.attendance.length,'
    + '   onTomorrow: doc.attendance.filter(function(r){ return r.date === '
    + JSON.stringify(tomorrow) + '; }).length }; })()');
  check('marking, taking or dropping TOMORROW writes nothing at all — the refusal is in the writer',
    futureTry.before === futureTry.after && futureTry.onTomorrow === 0,
    'three writes aimed at ' + tomorrow + ': records ' + futureTry.before + ' -> '
      + futureTry.after + ', records on that date = ' + futureTry.onTomorrow);

  /*
    ── WO-2.10 acceptance 1: ONE TAP MOVES ONE CELL AND NOTHING ELSE ──

    Read across all twenty-six cells of today's column before and after, because that is the
    acceptance line's own instruction ("verify by reading every other cell, not by looking at one")
    and because the build this work order replaces would have passed a check that read the tapped
    cell alone: there, one tap flipped every other `?` to `P` at once, which is the owner's second
    complaint and the whole reason `U` exists.
  */
  const first = opened.rows[4].student;
  await tapCell(first, nodeToday);
  const oneTap = await read();
  const oneTapRec = oneTap.today.filter((r) => r.classId === marking)[0] || {};
  const others = oneTap.rows.filter((r) => r.student !== first);
  check('one tap on a cell moves that cell to P and changes no other cell on the screen — all twenty-five stay ?',
    oneTap.rows.filter((r) => r.student === first)[0].codes.charAt(0) === 'P'
      && others.length === 25 && others.every((r) => r.codes.charAt(0) === '?')
      && opened.rows.every((r) => r.codes.charAt(0) === '?')
      && oneTap.today.length === 1 && oneTapRec.keys === 'classId,date,marks',
    'today\'s column read ' + JSON.stringify(opened.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and now reads ' + JSON.stringify(oneTap.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' (the tapped row is #5)');
  /* And the same fact in the document, which is where the `?`s actually live: the tap wrote a `U`
     for the twenty-five it did not confirm, and deleted the entry of the one it did. A build that
     drew the `?`s without storing them would pass the check above and lose them on reload — which
     is the next check but one. */
  check('and the document says so: a U for every student not reached, and no entry at all for the one confirmed',
    Object.keys(oneTapRec.marks || {}).length === 25
      && oneTapRec.marks[first] === undefined
      && Object.keys(oneTapRec.marks).every((id) => oneTapRec.marks[id].code === 'U')
      && oneTap.todayValues.U === 25 && !oneTap.todayValues.P,
    'the record holds ' + Object.keys(oneTapRec.marks || {}).length + ' entr(ies), values = '
      + JSON.stringify(oneTap.todayValues) + ', and the confirmed student\'s entry is '
      + JSON.stringify(oneTapRec.marks[first]));
  /* The column head and the state line count what is left, which is the surface WO-2.10's Traps
     line demands: a class holding `U`s is a meeting with an absence for every one of them, and the
     failure is silent unless something says so. */
  check('and the screen is loud about it — the column head counts what is left and the state line leads with it',
    oneTap.columns[0].chip === '25 to go' && opened.columns[0].chip === 'Not taken'
      && oneTap.stateText === '25 unconfirmed'
      && / unconfirmed\b/.test(oneTap.stateClass)
      && /count as absent/.test(oneTap.note),
    'the column head says ' + JSON.stringify(oneTap.columns[0].chip) + ', the state line says '
      + JSON.stringify(oneTap.stateText) + ' with class ' + JSON.stringify(oneTap.stateClass)
      + ', and the note under it says ' + JSON.stringify(oneTap.note));

  /* ── WO-2.10 acceptance 4: the unconfirmed state is stored, so it survives a reload ── */

  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const uReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const afterOneTap = await openCard(marking);
  check('one tap, then a reload, still shows one P and twenty-five ? — the unconfirmed state came back out of IndexedDB',
    uReboot && afterOneTap.rowCount === 26
      && afterOneTap.rows.filter((r) => r.codes.charAt(0) === 'P').length === 1
      && afterOneTap.rows.filter((r) => r.codes.charAt(0) === '?').length === 25
      && afterOneTap.rows.filter((r) => r.student === first)[0].codes.charAt(0) === 'P'
      && afterOneTap.columns[0].chip === '25 to go'
      && afterOneTap.cards.filter((c) => c.id === marking)[0].state === '25 unconfirmed',
    uReboot ? 'today\'s column reads '
      + JSON.stringify(afterOneTap.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and the card says ' + JSON.stringify(afterOneTap.cards.filter((c) => c.id === marking)[0].state)
      : 'the loading screen never came down');

  /* ── WO-2.10 acceptance 7: the cycle, entered at P from a question mark ── */

  const cycler = opened.rows[0].student;
  const seen = [];
  for (let i = 0; i < 6; i++) {
    await tapCell(cycler, nodeToday);
    const step = await read();
    seen.push(step.rows.filter((r) => r.student === cycler)[0].codes.charAt(0));
  }
  const cycled = await read();
  const cycledRec = cycled.today.filter((r) => r.classId === marking)[0] || {};
  check('the cycle from ? reads P → A → E → T → D and returns to P, never to ?, with no menu and no second screen',
    seen.join('') === 'PAETDP'
      && cycled.submenus === 0 && cycled.rowCount === 26
      && cycledRec.marks && cycledRec.marks[cycler] === undefined,
    'six taps on a cell that started on ? walked ' + JSON.stringify(seen)
      + ' (present is stored as nothing at all, so the sixth tap left '
      + JSON.stringify(cycledRec.marks ? cycledRec.marks[cycler] : null) + ' on the record)');

  /* And it did not take the rest of the class with it: the twenty-four nobody has touched are still
     `?`, six taps later. */
  check('and six taps on one cell still change no other cell — twenty-four are ? and the confirmed one is P',
    cycled.rows.filter((r) => r.codes.charAt(0) === '?').length === 24
      && cycled.rows.filter((r) => r.codes.charAt(0) === 'P').length === 2
      && cycled.columns[0].chip === '24 to go',
    'today\'s column reads ' + JSON.stringify(cycled.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' under a head that says ' + JSON.stringify(cycled.columns[0].chip));

  /* ── two absences on a class of 26, and what is in the document at rest ── */

  const absent = opened.rows[2].student;
  const tardy = opened.rows[7].student;
  await tapCell(absent, nodeToday);
  await tapCell(absent, nodeToday);                        /* two taps  -> P, A */
  for (let i = 0; i < 4; i++) await tapCell(tardy, nodeToday);   /* four taps -> P, A, E, T */
  const twoTaps = await read();
  const rec = twoTaps.today.filter((r) => r.classId === marking)[0] || {};
  check('an absence and a tardy are two entries in the document, and the other twenty-four are U or nothing',
    twoTaps.today.length === 1 && rec.classId === marking && rec.date === nodeToday
      && rec.keys === 'classId,date,marks'
      && rec.marks[absent].code === 'A' && rec.marks[tardy].code === 'T'
      && !twoTaps.values.P && twoTaps.rowCount === 26
      && twoTaps.todayValues.A === 1 && twoTaps.todayValues.T === 1,
    'record keys = ' + JSON.stringify(rec.keys) + '; the two marked cells are '
      + JSON.stringify({ absent: rec.marks[absent], tardy: rec.marks[tardy] })
      + ' for ' + twoTaps.rowCount + ' students; mark values today = '
      + JSON.stringify(twoTaps.todayValues) + ', in the whole document = '
      + JSON.stringify(twoTaps.values));
  check('and those two cells say so while the ones nobody has reached still read ?',
    twoTaps.rows.filter((r) => r.codes.charAt(0) === 'A').length === 1
      && twoTaps.rows.filter((r) => r.codes.charAt(0) === 'T').length === 1
      && twoTaps.rows.filter((r) => r.codes.charAt(0) === 'P').length === 2
      && twoTaps.rows.filter((r) => r.codes.charAt(0) === '?').length === 22,
    'today\'s column reads ' + JSON.stringify(twoTaps.rows.map((r) => r.codes.charAt(0)).join('')));

  /*
    ── WO-2.10 acceptance 9: the tardy carries its time, and the screen shows it ──

    Both halves, because they fail separately: the timestamp is in the document with its offset on
    it, and the grid draws the clock time under the letter without anything being opened. The offset
    is asserted rather than assumed — `toISOString()` would produce a `Z` and a different hour, and
    "arrived 12:14" on a class that starts at 08:10 is a wrong fact beside a student's name.
  */
  const tardyCell = rec.marks[tardy];
  const tardyRow = twoTaps.rows.filter((r) => r.student === tardy)[0];
  check('marking a student tardy stores an ISO timestamp with its offset, and the cell shows the time without a report',
    !!tardyCell.at && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(tardyCell.at)
      && tardyCell.at.slice(0, 10) === nodeToday
      && /^\d{1,2}:\d{2}[ap]$/.test(tardyRow.times[0])
      && tardyRow.times[0].slice(0, tardyRow.times[0].indexOf(':'))
        === String(Number(tardyCell.at.slice(11, 13)) % 12 || 12)
      && /tardy at \d{1,2}:\d{2} [AP]M/.test(tardyRow.labels[0])
      && twoTaps.rows.filter((r) => r.times[0]).length === 1,
    'the cell holds ' + JSON.stringify(tardyCell) + ', the grid draws '
      + JSON.stringify(tardyRow.times[0]) + ' under it, a screen reader is told '
      + JSON.stringify(tardyRow.labels[0]) + ', and ' + twoTaps.rows.filter((r) => r.times[0]).length
      + ' of 26 cells in that column carry a time');

  /* ── acceptance 1: a mark lands and survives a reload ── */

  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const attReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const afterReload = await evalJs('window.__att()');
  const reloadedRec = afterReload.today[0] || {};
  check('a mark lands and survives a reload — it comes back out of IndexedDB, not out of memory',
    attReboot && afterReload.today.length === 1
      && reloadedRec.marks[absent].code === 'A' && reloadedRec.marks[tardy].code === 'T'
      && reloadedRec.marks[tardy].at === tardyCell.at
      && !afterReload.values.P,
    attReboot ? 'the two marks back out of storage = '
      + JSON.stringify({ absent: reloadedRec.marks[absent], tardy: reloadedRec.marks[tardy] })
      : 'the loading screen never came down');
  check('and the card behind it says what the document says, without anything being reopened',
    afterReload.cards.filter((c) => c.id === marking)[0].state === '22 unconfirmed · 1 absent, 1 tardy'
      && / taken\b/.test(afterReload.cards.filter((c) => c.id === marking)[0].cls)
      && / unconfirmed\b/.test(afterReload.cards.filter((c) => c.id === marking)[0].cls),
    JSON.stringify(afterReload.cards.map((c) => c.state)));

  const reopened = await openCard(marking);
  check('and the grid it reopens to shows those two marks in today\'s column, on those two rows',
    reopened.rowCount === 26
      && reopened.rows.filter((r) => r.student === absent)[0].codes.charAt(0) === 'A'
      && reopened.rows.filter((r) => r.student === tardy)[0].codes.charAt(0) === 'T'
      && reopened.stateText === '22 unconfirmed · 1 absent, 1 tardy'
      && reopened.columns[0].date === nodeToday,
    'state line = ' + JSON.stringify(reopened.stateText) + ', today\'s column reads '
      + JSON.stringify(reopened.rows.map((r) => r.codes.charAt(0)).join('')));

  /*
    ── WO-2.10 acceptances 2 and 3: "Everyone's here" finishes the class, and what is left at rest ──

    One tap on the control that is allowed to change every row, on a class that is 22/26 of the way
    through being taken. Every `U` goes and the two real marks stay, which leaves the finished
    document holding exactly what WO-2.1's document held for the same class: two entries out of
    twenty-six students, no `U` and no `P`. Storage at rest is unchanged by this whole work order,
    and this is where that is measured.
  */
  await clickSel('#attendanceActions [data-attendance-take]');
  const finished = await read();
  const finishedRec = finished.today.filter((r) => r.classId === marking)[0] || {};
  check('"Everyone\'s here" resolves every remaining student in one tap, and the document holds no U afterwards',
    Object.keys(finishedRec.marks || {}).length === 2
      && finishedRec.marks[absent].code === 'A' && finishedRec.marks[tardy].code === 'T'
      && !finished.values.U && !finished.values.P
      && finished.rows.filter((r) => r.codes.charAt(0) === 'P').length === 24
      && finished.rows.filter((r) => r.codes.charAt(0) === '?').length === 0
      && finished.columns[0].chip === 'Taken'
      && finished.stateText === 'Taken · 1 absent, 1 tardy',
    'a class of 26 with two exceptions is ' + Object.keys(finishedRec.marks || {}).length
      + ' entr(ies) in the finished document: ' + JSON.stringify(finishedRec.marks)
      + '; U anywhere in the document = ' + (finished.values.U || 0)
      + '; the column reads ' + JSON.stringify(finished.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' under ' + JSON.stringify(finished.columns[0].chip));

  /*
    ── WO-2.10 acceptances 10 and 11: one time, the dismissal's, and nothing left behind ──

    Cycled a cell all the way round on a class that is now finished, so it starts at present and
    every step is a code the teacher chose. Read at three points, because the three claims fail
    separately: `T` stamps a time, `D` past it leaves ONE time and it is the dismissal's, and `P`
    takes the whole entry with it — no code, no `at`, no note.

    A note is typed onto the mark first, so that the last of those three is not vacuously true: a
    build that dropped the code and kept the note would pass an assertion that only counted keys.
  */
  const undone = reopened.rows[4].student;
  await tapCell(undone, nodeToday);
  await tapCell(undone, nodeToday);                       /* A, E */
  const three = await read();
  await tapCell(undone, nodeToday);                       /* T — the first time stamped */
  const atTardy = await read();
  await tapCell(undone, nodeToday);                       /* D — the second, and the only one left */
  const atDismissed = await read();
  const tardyStamp = ((atTardy.today[0] || {}).marks || {})[undone] || {};
  const dismissStamp = ((atDismissed.today[0] || {}).marks || {})[undone] || {};
  check('cycling past T onto D leaves ONE time — the dismissal\'s — and no orphaned tardy time on the cell',
    ((three.today[0] || {}).marks || {})[undone].code === 'E'
      && ((three.today[0] || {}).marks || {})[undone].at === undefined
      && tardyStamp.code === 'T' && !!tardyStamp.at
      && dismissStamp.code === 'D' && !!dismissStamp.at
      && Object.keys(dismissStamp).sort().join(',') === 'at,code'
      && dismissStamp.at >= tardyStamp.at,
    'the cell went ' + JSON.stringify(((three.today[0] || {}).marks || {})[undone]) + ' -> '
      + JSON.stringify(tardyStamp) + ' -> ' + JSON.stringify(dismissStamp)
      + ' (an E carries no time, and the D carries exactly one field beside its code)');

  /* A note on it, then the last tap. The note is written through the row's own panel, which is the
     only way a teacher can write one. */
  await clickSel('#attendanceBody [data-attendance-detail="' + undone + '"]');
  await evalJs('(function(){ var e = document.querySelector("[data-attendance-note]");'
    + ' e.value = "left at the end of the period"; e.dispatchEvent(new Event("input", { bubbles: true }));'
    + ' return 1; })()');
  const noted = await read();
  await tapCell(undone, nodeToday);                       /* back to present */
  const backToTwo = await read();
  check('cycling all the way back to present clears the entry entirely — no code, no time, no note left behind',
    (((noted.today[0] || {}).marks || {})[undone] || {}).note === 'left at the end of the period'
      && Object.keys((backToTwo.today[0] || {}).marks || {}).length === 2
      && !((backToTwo.today[0] || {}).marks || {})[undone]
      && backToTwo.today.length === 1 && !backToTwo.values.P
      && backToTwo.rows.filter((r) => r.student === undone)[0].codes.charAt(0) === 'P'
      && backToTwo.rows.filter((r) => r.student === undone)[0].times[0] === ''
      && backToTwo.rev > three.rev,
    'the cell carried ' + JSON.stringify(((noted.today[0] || {}).marks || {})[undone])
      + ' and is now ' + JSON.stringify(((backToTwo.today[0] || {}).marks || {})[undone])
      + '; the record holds ' + JSON.stringify((backToTwo.today[0] || {}).marks)
      + ', rev ' + three.rev + ' -> ' + backToTwo.rev);

  /* All four stored codes on one class, which is what makes the no-P claim below say something:
     every letter this app can store is in the document, and P is not one of them. */
  const eventStudent = reopened.rows[11].student;
  const dismissed = reopened.rows[19].student;
  for (let i = 0; i < 2; i++) await tapCell(eventStudent, nodeToday);   /* A, E */
  for (let i = 0; i < 4; i++) await tapCell(dismissed, nodeToday);      /* A, E, T, D */
  const fourCodes = await read();
  check('all four stored codes reach the document, and the fifth never does',
    JSON.stringify(fourCodes.todayValues) === JSON.stringify({ A: 1, T: 1, E: 1, D: 1 })
      && !fourCodes.values.P
      && Object.keys(fourCodes.today[0].marks).length === 4
      && fourCodes.today[0].keys === 'classId,date,marks',
    'mark values written today = ' + JSON.stringify(fourCodes.todayValues)
      + ', in the whole document = ' + JSON.stringify(fourCodes.values)
      + ', card says ' + JSON.stringify(fourCodes.cards.filter((c) => c.id === marking)[0].state));

  /*
    ── WO-2.10 acceptance 12: a note survives a reload, on the same student, date and class ──

    Written through the row's ⋯ panel, read back after a full reload out of IndexedDB, and checked
    on BOTH sides: the field comes back filled for that student on that date, and the note is in the
    cell rather than anywhere else in the document. The date the panel is bound to is asserted too —
    a note that landed on today while the panel said yesterday would be invisible here otherwise.
  */
  await clickSel('#attendanceBody [data-attendance-detail="' + dismissed + '"]');
  const panel = await read();
  await evalJs('(function(){ var e = document.querySelector("[data-attendance-note]");'
    + ' e.value = "left for the nurse at the bell"; e.dispatchEvent(new Event("input", { bubbles: true }));'
    + ' return 1; })()');
  const typedIn = await read();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const noteReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const backOnCard = await openCard(marking);
  await clickSel('#attendanceBody [data-attendance-detail="' + dismissed + '"]');
  const reopenedNote = await read();
  const noteCell = ((reopenedNote.today.filter((r) => r.classId === marking)[0] || {}).marks
    || {})[dismissed] || {};
  check('a note typed on a mark survives a reload, on the same student, date and class',
    noteReboot && panel.detail.open && panel.detail.student === dismissed
      && panel.detail.hasNote && panel.detail.noteDate === nodeToday
      && typedIn.detail.note === 'left for the nurse at the bell'
      && noteCell.note === 'left for the nurse at the bell'
      && noteCell.code === 'D' && !!noteCell.at
      && reopenedNote.detail.open && reopenedNote.detail.student === dismissed
      && reopenedNote.detail.note === 'left for the nurse at the bell'
      && backOnCard.rows.filter((r) => r.student === dismissed)[0].labels[0]
        .indexOf('left for the nurse at the bell') > 0
      && reopenedNote.records.filter((r) => JSON.stringify(r.marks || {}).indexOf('nurse') >= 0)
        .length === 1,
    noteReboot ? 'the panel opened on ' + JSON.stringify(panel.detail.mark) + ' for '
      + JSON.stringify(panel.detail.noteDate) + '; after a reload the cell holds '
      + JSON.stringify(noteCell) + ' and the field reads '
      + JSON.stringify(reopenedNote.detail.note)
      : 'the loading screen never came down');

  /*
    ── the row's panel is where un-confirm lives, and it puts ONE student back ──

    The deliverable is that a student cycled by mistake can be returned to `?` without leaving the
    screen. Driven through the panel's own button, and asserted the same way acceptance 1 is: every
    other cell in the column is read, because a control that un-confirmed the class would be a
    control that quietly turned twenty-five present students into absences.

    THE CELL HAS TO COME BACK AS `{ code: "U" }` AND NOTHING ELSE, and that clause is here because
    this check found the opposite on its first run: the note carried across the code change and left
    `{ code: "U", note: "left for the nurse at the bell" }` — a note about a mark that no longer
    existed, in an entry that is deleted the moment somebody confirms that student. src/attendance.js
    now stops the note at `U` and says why.
  */
  const beforeUnconfirm = await read();
  await clickSel('#attendanceBody tr[data-attendance-detail-row] [data-attendance-unconfirm]');
  const unconfirmed = await read();
  const unconfirmedRec = unconfirmed.today.filter((r) => r.classId === marking)[0] || {};
  check('the row\'s panel puts one student back to ? — and moves no other cell on the screen',
    beforeUnconfirm.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0) === 'D'
      && unconfirmed.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0) === '?'
      && unconfirmedRec.marks[dismissed].code === 'U'
      && Object.keys(unconfirmedRec.marks[dismissed]).join(',') === 'code'
      && unconfirmed.rows.filter((r) => r.codes.charAt(0) === '?').length === 1
      && unconfirmed.columns[0].chip === '1 to go'
      && unconfirmed.rows.map((r) => r.codes.charAt(0)).join('')
        === beforeUnconfirm.rows.map((r) => r.codes.charAt(0)).join('').replace('D', '?'),
    'the cell went from ' + JSON.stringify(beforeUnconfirm.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0))
      + ' to ' + JSON.stringify(unconfirmed.rows.filter((r) => r.student === dismissed)[0].codes.charAt(0))
      + ' and the entry is now ' + JSON.stringify(unconfirmedRec.marks[dismissed])
      + ' — the note and the time went with the mark. The column reads '
      + JSON.stringify(unconfirmed.rows.map((r) => r.codes.charAt(0)).join('')));

  /* And back to where the rest of this section expects it: the dismissal restored, the panel shut.
     Four taps from `?` — P, A, E, T, D — because a cell that has been un-confirmed enters the cycle
     at present like any other question mark. */
  for (let i = 0; i < 5; i++) await tapCell(dismissed, nodeToday);
  await clickSel('#attendanceBody [data-attendance-detail="' + dismissed + '"]');
  const restored4 = await read();
  check('and a re-confirmed cell walks the same cycle from ? — five taps back to dismissed, with a fresh time',
    (((restored4.today.filter((r) => r.classId === marking)[0] || {}).marks || {})[dismissed] || {}).code === 'D'
      && !!(((restored4.today.filter((r) => r.classId === marking)[0] || {}).marks || {})[dismissed] || {}).at
      && restored4.detail.open === false
      && JSON.stringify(restored4.todayValues) === JSON.stringify({ A: 1, T: 1, E: 1, D: 1 }),
    'the cell is ' + JSON.stringify((((restored4.today.filter((r) => r.classId === marking)[0] || {}).marks || {})[dismissed]))
      + ' and today\'s values are ' + JSON.stringify(restored4.todayValues));

  /* ── acceptance 4: taken with zero exceptions is still a record ── */

  const allPresent = ids[1];
  const beforeTake = await openCard(allPresent);
  await clickSel('#attendanceActions [data-attendance-take]');
  const taken = await read();
  const takenRec = taken.today.filter((r) => r.classId === allPresent)[0] || {};
  check('one tap records a class as met with everyone present, and it is a record rather than a silence',
    takenRec.keys === 'classId,date,marks' && takenRec.exception === undefined
      && JSON.stringify(takenRec.marks) === '{}'
      && taken.states.indexOf(allPresent + '=taken') >= 0
      && taken.stateText === 'Taken · all present'
      && taken.columns[0].chip === 'Taken'
      && taken.today.length === beforeTake.today.length + 1,
    'record = ' + JSON.stringify(takenRec) + '; state line = ' + JSON.stringify(taken.stateText)
      + ', column head = ' + JSON.stringify(taken.columns[0].chip));
  check('and "taken with everyone present" is a different thing in the document from "not taken yet"',
    taken.states.indexOf(allPresent + '=taken') >= 0
      && taken.states.indexOf(ids[5] + '=not-taken') >= 0
      && taken.today.filter((r) => r.classId === ids[5]).length === 0
      && taken.cards.filter((c) => c.id === allPresent)[0].state === 'Taken · all present'
      && taken.cards.filter((c) => c.id === ids[5])[0].state === 'Not taken yet',
    taken.states);

  /* The same control, now pressed, taking it back — offered only while there is nothing to lose. */
  await clickSel('#attendanceActions [data-attendance-untake]');
  const untaken = await read();
  /* The other half of this one is quiet and worth naming: `allPresent` is a class the fixture
     residue may belong to, so an un-take that removed by classId alone — rather than by class AND
     date — would take a record off another day with it. That is a period of a term gone, and it
     would leave no trace on this screen. Hence the baseline comparison rather than a zero. */
  const otherDays = (r) => r.classId === allPresent && r.date !== nodeToday;
  check('the same one tap takes that back, and the day is not taken yet again — without touching another day',
    untaken.today.filter((r) => r.classId === allPresent).length === 0
      && untaken.records.filter(otherDays).length === start.records.filter(otherDays).length
      && untaken.states.indexOf(allPresent + '=not-taken') >= 0
      && untaken.stateText === 'Not taken yet'
      && untaken.cards.filter((c) => c.id === allPresent)[0].state === 'Not taken yet',
    'records for that class today = '
      + untaken.today.filter((r) => r.classId === allPresent).length
      + ' (on other dates ' + start.records.filter(otherDays).length + ' -> '
      + untaken.records.filter(otherDays).length + ', which the un-take must not have touched)'
      + ', state line = ' + JSON.stringify(untaken.stateText));
  /* The refusal that makes the toggle safe, read off the class that is carrying marks: with marks
     on the record the un-take is not offered at all, so nothing on this screen can destroy a mark
     by being tapped a second time. src/attendance.js's untakeClass() states the same rule again in
     code, where it cannot be skipped. */
  const withMarks = await openCard(ids[0]);
  const marksOnIt = Object.keys((withMarks.today.filter((r) => r.classId === ids[0])[0] || {}).marks || {}).length;
  check('the un-take is offered on a class with nothing on it and withheld from one with marks on it',
    untaken.actions.some((a) => a.hook.indexOf('data-attendance-take=') === 0)
      && !untaken.actions.some((a) => a.hook.indexOf('data-attendance-untake=') === 0)
      && marksOnIt > 0
      && !withMarks.actions.some((a) => a.hook.indexOf('data-attendance-untake=') === 0)
      && withMarks.actions.some((a) => a.hook.indexOf('data-attendance-drop=') === 0),
    'on the untaken class: ' + JSON.stringify(untaken.actions.map((a) => a.text))
      + '; on the class carrying ' + marksOnIt + ' marks: '
      + JSON.stringify(withMarks.actions.map((a) => a.text)));

  /* Left taken, so the full-day document below has a class recorded with nobody absent in it. */
  await openCard(allPresent);
  await clickSel('#attendanceActions [data-attendance-take]');

  /* ── acceptance 5: one tap drops a class, one tap undoes it — from today's column head ── */

  /*
    Driven on a class with NO ROSTER, deliberately. "The class can still be marked as met, or as
    not meeting" is a deliverable, and a class whose names have not been pasted yet is exactly the
    case where a screen that hides its table would hide the only two controls that could say so.
    What the cells of a dropped column look like is a separate claim and is measured further down,
    against the twenty-six-name class, where `rows.every(...)` is not vacuously true.
  */
  const dropped = ids[2];
  const emptyClass = await openCard(dropped);
  await clickSel('#attendanceHead [data-attendance-drop]');
  const isDropped = await read();
  const dropRec = isDropped.today.filter((r) => r.classId === dropped)[0] || {};
  check('one tap on today\'s column head says the class did not meet, and writes exactly classId, date and exception',
    dropRec.keys === 'classId,date,exception' && dropRec.exception === 'dropped'
      && dropRec.marks === null && dropRec.date === nodeToday
      && isDropped.states.indexOf(dropped + '=dropped') >= 0
      && isDropped.columns[0].chip === 'Didn’t meet'
      && isDropped.note !== '' && isDropped.stateText === 'Didn’t meet'
      && emptyClass.rowCount === 0 && isDropped.columns.length === 6,
    'record = ' + JSON.stringify(dropRec) + '; the column head says '
      + JSON.stringify(isDropped.columns[0].chip) + ' over a roster of '
      + emptyClass.rowCount + ' student(s), with ' + isDropped.columns.length
      + ' column head(s) still reachable');

  await clickSel('#attendanceHead [data-attendance-undrop]');
  const unDropped = await read();
  check('and one tap undoes it, leaving the day not taken yet rather than claiming everyone was there',
    unDropped.today.filter((r) => r.classId === dropped).length === 0
      && unDropped.states.indexOf(dropped + '=not-taken') >= 0
      && unDropped.stateText === 'Not taken yet' && unDropped.note === ''
      && unDropped.columns[0].chip === 'Not taken'
      && unDropped.cards.filter((c) => c.id === dropped)[0].state === 'Not taken yet',
    'records for that class today = '
      + unDropped.today.filter((r) => r.classId === dropped).length
      + ', column head = ' + JSON.stringify(unDropped.columns[0].chip));

  /* Dropped again, and left that way: the full day below needs one of each state. */
  await clickSel('#attendanceHead [data-attendance-drop]');

  /* ── acceptances 3 and 10: three states in ONE grid, and a hole you can see ──
     Every column of this class's week is acted on except ONE, which is the day "deliberately left"
     that the teacher then has to find without remembering which it was. Each past column takes its
     ✏ first, because a past column that accepted a tap without one would be the deliberate-unlock
     deliverable missing. */

  const holeAt = 3;
  await openCard(marking);
  for (let i = 1; i < 6; i++) {
    if (i === holeAt) continue;
    const date = thisWeek[i];
    await clickSel('[data-attendance-edit="' + date + '"]');
    await clickSel(i === 5 ? '#attendanceActions [data-attendance-drop]'
      : '#attendanceActions [data-attendance-take]');
    pastWrites += 1;
  }
  await clickSel('[data-attendance-page="today"]');
  const week = await read();

  const wantColStates = thisWeek.map((d, i) =>
    d + '=' + (i === holeAt ? 'not-taken' : (i === 5 ? 'dropped' : 'taken'))).join(' ');
  check('a past column takes its unlock, then accepts the same taps today does — and lands on that date',
    week.colStates === wantColStates
      && week.columns.map((c) => c.chip).join('|')
        === ['Taken', 'Taken', 'Taken', 'Not taken', 'Taken', 'Didn’t meet'].join('|')
      /* And with nothing unlocked, exactly ONE of the six cells in a row is a button: today's.
         A past column that took a tap without its ✏ would show six here, and the deliberate
         unlock would be a decoration rather than a gate. */
      && week.rows.every((r) => r.tappable === 1),
    'the document says ' + week.colStates + '; the column heads say '
      + JSON.stringify(week.columns.map((c) => c.chip)) + '; tappable cells per row = '
      + JSON.stringify([...new Set(week.rows.map((r) => r.tappable))]));

  /* Parked first (tools/README.md trap 7). The last thing clicked was inside this grid, so the
     cursor is sitting over a cell — and `.attendance-cell:hover` moves the border colour, which is
     one of the properties this comparison is about. One column measured hovered and two measured
     resting is indistinguishable from three states painted differently, which is the defect being
     looked for. */
  await park();
  const lookTakenCol = await evalJs('window.__colLook(' + JSON.stringify(thisWeek[1]) + ')');
  const lookHoleCol = await evalJs('window.__colLook(' + JSON.stringify(thisWeek[holeAt]) + ')');
  const lookDropCol = await evalJs('window.__colLook(' + JSON.stringify(thisWeek[5]) + ')');
  const apart = (a, b) => a.chip !== b.chip && a.chipColor !== b.chipColor
    && a.glyph !== b.glyph && a.cellBg !== b.cellBg && a.cellColor !== b.cellColor;
  check('a taken day, an untaken one and a dropped one differ in the column head AND in every cell under it',
    !!lookTakenCol && !!lookHoleCol && !!lookDropCol
      && apart(lookTakenCol, lookHoleCol) && apart(lookHoleCol, lookDropCol)
      && apart(lookTakenCol, lookDropCol)
      && lookTakenCol.glyph === 'P' && lookHoleCol.glyph === '?' && lookDropCol.glyph === '–'
      && lookDropCol.cellStyle === 'dashed' && lookHoleCol.cellStyle === 'solid'
      && lookTakenCol.cellStyle === 'solid'
      && lookDropCol.headStyle === 'dashed',
    'taken ' + JSON.stringify(lookTakenCol) + ' · untaken ' + JSON.stringify(lookHoleCol)
      + ' · dropped ' + JSON.stringify(lookDropCol));

  /* And in the document, which is the other half of acceptance 3: a dropped day is a record with
     an exception on it and an untaken day is no record at all. Not two flavours of the same shape. */
  const holeRec = week.records.filter((r) => r.classId === marking && r.date === thisWeek[holeAt]);
  const dropDayRec = week.records.filter((r) => r.classId === marking && r.date === thisWeek[5])[0] || {};
  check('and the same two days are different in the stored document — an exception, against no record at all',
    holeRec.length === 0 && dropDayRec.keys === 'classId,date,exception'
      && dropDayRec.exception === 'dropped',
    'the untaken day holds ' + holeRec.length + ' record(s); the dropped day holds '
      + JSON.stringify(dropDayRec));

  /* Acceptance 10, stated the way a teacher meets it: one glance at the grid, and exactly one
     column is the amber one. Every row agrees, because the wash is on the column and not on a cell. */
  const holeCols = week.columns.filter((c) => c.chip === 'Not taken').map((c) => c.date);
  check('a hole left three days earlier is the one amber column in the grid — found by looking, not by remembering',
    holeCols.length === 1 && holeCols[0] === thisWeek[holeAt]
      && week.rows.every((r) => r.codes.charAt(holeAt) === '?')
      && week.rows.every((r) => r.codes.split('').filter((ch) => ch === '?').length === 1),
    'columns reading "Not taken" = ' + JSON.stringify(holeCols) + ', expected '
      + JSON.stringify([thisWeek[holeAt]]) + '; a row reads '
      + JSON.stringify(week.rows[0].codes));

  /* ── acceptance 7: a date two weeks back, reached from this screen, landing on that date ── */

  await clickSel('[data-attendance-page="earlier"]');
  const paged = await read();
  const twoWeeks = lastWeek[lastWeek.length - 1];
  check('one tap of Earlier reaches the week before, and its oldest column is a fortnight back',
    paged.columns.map((c) => c.date).join(' ') === lastWeek.join(' ')
      && daysApart(nodeToday, twoWeeks) >= 14
      && paged.banner.shown && paged.banner.text.indexOf('not on screen') > 0,
    'showing ' + JSON.stringify(paged.columns.map((c) => c.date)) + '; the oldest is '
      + daysApart(nodeToday, twoWeeks) + ' calendar days back; the strip says '
      + JSON.stringify(paged.banner.text));

  await clickSel('[data-attendance-edit="' + twoWeeks + '"]');
  const unlocked = await read();
  /* The desk half of acceptance 8. Whether it reads across a classroom is a 👤 line; whether it is
     on screen, in words, naming the day, is not. */
  check('unlocking a past day puts a strip on screen that says which day it is, in words, and offers the way back',
    unlocked.banner.shown
      && /You are editing /.test(unlocked.banner.text)
      && unlocked.banner.text.indexOf('not today') > 0
      && unlocked.banner.text.indexOf(String(Number(twoWeeks.slice(8, 10)))) > 0
      && unlocked.dateText.indexOf(String(Number(twoWeeks.slice(8, 10)))) >= 0
      && / attendance-col-editing\b/.test(
        (unlocked.columns.filter((c) => c.date === twoWeeks)[0] || {}).cls || ''),
    'the strip says ' + JSON.stringify(unlocked.banner.text) + '; the column carries '
      + JSON.stringify((unlocked.columns.filter((c) => c.date === twoWeeks)[0] || {}).cls));

  /*
    Four taps on a cell in an unlocked column two weeks back: P, A, E, T. It lands on THAT date and
    nowhere else, it takes that day (a `U` for the twenty-five students it did not confirm, exactly
    as today's column does), and — the clause that is WO-2.10's — the tardy carries NO `at`.

    That last one is a decision this work order left open and src/attendance.js settles: `at` comes
    off the device clock, and the device clock on a Thursday says nothing true about what time a
    student walked in a fortnight ago. A wrong time printed beside a student's name in a
    conversation with a guardian is worse than no time, so a past column records the mark and not
    the moment.
  */
  const backThen = unlocked.rows[1].student;
  for (let i = 0; i < 4; i++) await tapCell(backThen, twoWeeks);
  pastWrites += 1;
  const marked = await read();
  const backRec = marked.records.filter((r) => r.classId === marking && r.date === twoWeeks)[0] || {};
  const backCell = (backRec.marks || {})[backThen] || {};
  check('and a tap there lands on THAT date — not on today, and not on the column beside it',
    backRec.date === twoWeeks && backRec.keys === 'classId,date,marks'
      && backCell.code === 'T' && backCell.at === undefined
      && Object.keys(backCell).join(',') === 'code'
      && Object.keys(backRec.marks).length === 26
      && Object.keys(backRec.marks).filter((id) => backRec.marks[id].code === 'U').length === 25
      && marked.records.filter((r) => r.classId === marking && r.date === nodeToday)[0].marks[backThen] === undefined
      && marked.records.filter((r) => r.classId === marking && r.date === lastWeek[4]).length === 0,
    'the cell on ' + twoWeeks + ' is ' + JSON.stringify(backCell) + ' — no time, because the device '
      + 'clock is not evidence about a fortnight ago — beside '
      + Object.keys(backRec.marks || {}).filter((id) => backRec.marks[id].code === 'U').length
      + ' unconfirmed students; today\'s record is still ' + JSON.stringify(
        marked.records.filter((r) => r.classId === marking && r.date === nodeToday)[0].marks));

  /* Back where a teacher would leave it. "Back to today" is the control on the strip itself, which
     is the one a teacher reaches for, so it is the one driven here. */
  await clickSel('#attendanceBanner [data-attendance-page="today"]');
  const home = await read();
  check('the way back is one tap on the strip, and it lands on today with the strip gone',
    !home.banner.shown && home.columns.map((c) => c.date).join(' ') === thisWeek.join(' ')
      && home.dateText.indexOf(String(Number(nodeToday.slice(8, 10)))) >= 0
      && home.columns.filter((c) => / attendance-col-editing\b/.test(c.cls)).length === 0,
    'showing ' + JSON.stringify(home.columns.map((c) => c.date)) + ', strip up = '
      + home.banner.shown);

  /* ── search, the filter pills and the sort pair ── */

  /* The term is taken out of the roster on screen rather than written in here: a literal that
     happens not to be in this class's twenty-six names makes the check fail with an empty result,
     which is indistinguishable from a search that does not work. */
  const typed = String(home.rows[1].name.split(',')[0] || '').toLowerCase();
  const searchHit = home.rows.filter((r) => r.name.toLowerCase().indexOf(typed) >= 0).length;
  await evalJs('(function(){ var e = document.getElementById("attendanceSearch");'
    + ' e.value = ' + JSON.stringify(typed) + ';'
    + ' e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
  const searched = await read();
  await evalJs('(function(){ var e = document.getElementById("attendanceSearch"); e.value = "";'
    + ' e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
  await clickSel('[data-attendance-filter="A"]');
  const filtered = await read();
  await clickSel('[data-attendance-filter="all"]');
  await clickSel('[data-attendance-sort="first"]');
  const sorted = await read();
  await clickSel('[data-attendance-sort="last"]');
  const byFirst = home.roster.slice()
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])) || String(a[0]).localeCompare(String(b[0])))
    .map((p) => p[0] + ', ' + p[1]);
  check('search narrows the rows, a pill shows only that mark, and First/Last reorders the whole class',
    typed.length >= 3 && searchHit > 0 && searchHit < 26 && searched.rowCount === searchHit
      && searched.rows.every((r) => r.name.toLowerCase().indexOf(typed) >= 0)
      && filtered.rowCount === filtered.rows.filter((r) => r.codes.charAt(0) === 'A').length
      && filtered.rowCount > 0 && filtered.pills.filter((p) => p.active).length === 1
      && filtered.pills.filter((p) => p.code === 'A')[0].active
      && sorted.rowCount === 26
      && JSON.stringify(sorted.rows.map((r) => r.name)) === JSON.stringify(byFirst)
      && sorted.sorts.filter((s) => s.active).map((s) => s.which).join('') === 'first',
    'search for ' + JSON.stringify(typed) + ' left ' + searched.rowCount + ' of 26 ('
      + JSON.stringify(searched.rows.map((r) => r.name)) + '); the absent pill left '
      + filtered.rowCount + '; sorted by first name the top three are '
      + JSON.stringify(sorted.rows.slice(0, 3).map((r) => r.name)));

  /* ── a second class with a roster, so the full day has marks in more than one place ── */

  const second = ids[3];
  await closeAll();
  await clickSel('[data-class-tab]', 3);
  await clickSel('header [data-roster-manage]');
  /* Deliberately not in alphabetical order: the grid's own order is the claim below. */
  for (const name of ['Zeta, Ada', 'Alpha, Bo', 'Mid, Cy']) {
    await evalJs('(function(){ var e = document.getElementById("rosterNewInput"); e.value = '
      + JSON.stringify(name) + '; return 1; })()');
    await clickSel('[data-roster-create] button[type="submit"]');
  }
  const secondOpen = await openCard(second);
  check('a second class marks its own roster, in its own order, without touching the first',
    secondOpen.rowCount === 3
      && JSON.stringify(secondOpen.rows.map((r) => r.name)) === JSON.stringify(['Alpha, Bo', 'Mid, Cy', 'Zeta, Ada'])
      && secondOpen.rows.every((r) => r.codes === '??????')
      && Object.keys(secondOpen.today.filter((r) => r.classId === ids[0])[0].marks).length === 4,
    secondOpen.rowCount + ' row(s) ' + JSON.stringify(secondOpen.rows.map((r) => r.name))
      + '; the first class still holds '
      + Object.keys(secondOpen.today.filter((r) => r.classId === ids[0])[0].marks).length + ' marks');

  /* One tap, which takes that class and leaves the other two students unconfirmed — the half-taken
     class the day below needs, and the fixture the next check is built on. */
  await tapCell(secondOpen.rows[2].student, nodeToday);

  /*
    ── WO-2.10 acceptance 8: a student added AFTER a class was taken gets no mark for it ──

    The `U`s are written once, when the record is created, and never again. So a student who joins
    the roster afterwards has no entry on that day at all — which reads as present, because present
    is the absence of a mark, and which is the only honest answer: nobody failed to account for a
    student who was not on the list. A build that re-seeded on every write would give them an
    absence for a class they were not in, retroactively, and it would do it silently.
  */
  const beforeLate = await read();
  await closeAll();
  await clickSel('header [data-roster-manage]');
  await evalJs('(function(){ var e = document.getElementById("rosterNewInput");'
    + ' e.value = "Late, Ida"; return 1; })()');
  await clickSel('[data-roster-create] button[type="submit"]');
  const late = await openCard(second);
  const lateRec = late.today.filter((r) => r.classId === second)[0] || {};
  const lateStudent = late.rows.filter((r) => r.name === 'Late, Ida')[0] || {};
  check('a student added to the roster after a class was taken does not acquire a mark for it retroactively',
    late.rowCount === 4 && !!lateStudent.student
      && lateRec.marks[lateStudent.student] === undefined
      && Object.keys(lateRec.marks || {}).length
        === Object.keys((beforeLate.today.filter((r) => r.classId === second)[0] || {}).marks || {}).length
      && Object.keys(lateRec.marks || {}).length === 2
      && lateStudent.codes.charAt(0) === 'P'
      && late.columns[0].chip === '2 to go',
    'the class went from 3 students to ' + late.rowCount + ' and the record still holds '
      + Object.keys(lateRec.marks || {}).length + ' entr(ies) ' + JSON.stringify(lateRec.marks)
      + '; the new row reads ' + JSON.stringify(lateStudent.codes)
      + ' under a head that says ' + JSON.stringify(late.columns[0].chip));

  /* One more class taken with nobody absent, so the day is five classes. */
  await openCard(ids[4]);
  await clickSel('#attendanceActions [data-attendance-take]');

  /* ── acceptance 12: a full day of five classes, and no P anywhere in it ── */

  await closeAll();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const dayReboot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const day = await evalJs('window.__att()');

  const wantStates = [ids[0] + '=taken', ids[1] + '=taken', ids[2] + '=dropped',
    ids[3] + '=taken', ids[4] + '=taken', ids[5] + '=not-taken'].join(' ');
  /* Five records for today, and the document is otherwise exactly as this section found it plus
     the past days it wrote on purpose, counted as it went. The second clause is what makes the
     first mean "the app wrote five" rather than "there are five here now". */
  check('after a full day of five classes the document holds five records for today and every one of the three states',
    dayReboot && day.today.length === 5 && day.states === wantStates
      && day.records.length === start.records.length + 5 + pastWrites
      && day.today.filter((r) => r.exception).length === 1
      && day.today.filter((r) => r.keys === 'classId,date,marks').length === 4
      && day.today.filter((r) => r.classId === ids[5]).length === 0,
    dayReboot ? day.today.length + ' record(s) on ' + nodeToday + ': ' + day.states
      + '; records in the whole document ' + start.records.length + ' -> ' + day.records.length
      + ' against ' + pastWrites + ' deliberate write(s) on past dates'
      : 'the loading screen never came down');
  /* The exact tally is asked of today, where this section knows every tap it made. The no-P claim
     is asked of the WHOLE document, where a stray P written on any date by anything would show —
     and it is asked twice, once as an absent key and once as the complete key set. */
  check('and there is no P in it — not one, across five classes, six days and every student in them',
    !day.values.P && Object.keys(day.values).sort().join('') === 'ADETU'
      && JSON.stringify(day.todayValues) === JSON.stringify({ A: 1, T: 1, E: 1, D: 1, U: 2 })
      && day.today.filter((r) => r.marks).reduce((n, r) => n + Object.keys(r.marks).length, 0) === 6,
    'mark values written today = ' + JSON.stringify(day.todayValues)
      + ', every value stored anywhere in the document = ' + JSON.stringify(day.values)
      + ' across ' + day.today.filter((r) => r.marks).length + ' met classes');

  /*
    ── WO-2.10 acceptance 13: every cell in the document is an object ──

    Asked of storage rather than of the screen, and of the WHOLE document rather than of the class
    on screen — every year-level fixture this run has written passes through here, including the
    ones the classes section pushed straight into the store. `objects` is printed beside the zero
    because a document with no cells in it would answer "no bare strings" just as happily; `keys`
    is every field name any cell carries, so a cell holding something nobody meant to write shows
    up here rather than in a record dump nobody reads.
  */
  check('every cell in the document is an object — not one bare string anywhere, U and untimed codes included',
    day.cells.strings === 0 && day.cells.other === 0 && day.cells.objects >= 30
      && Object.keys(day.cells.keys).sort().join(',') === 'at,code'
      && day.cells.keys.code === day.cells.objects,
    day.cells.objects + ' object cell(s), ' + day.cells.strings + ' bare string(s), '
      + day.cells.other + ' of some other shape'
      + (day.cells.bare.length ? ' — ' + JSON.stringify(day.cells.bare.slice(0, 5)) : '')
      + '; every field name in use across them = ' + JSON.stringify(day.cells.keys));

  check('and each card on the home screen states its own class\'s answer',
    JSON.stringify(day.cards.map((c) => c.state)) === JSON.stringify([
      'Taken · 4 marked', 'Taken · all present', 'Didn’t meet', '2 unconfirmed',
      'Taken · all present', 'Not taken yet']),
    JSON.stringify(day.cards.map((c) => c.state)));
  /* WO-2.10 acceptance 6, on the surface it names: the half-taken class is the one that has to be
     loud, and it is loud in the same place the other five are quiet. Its own palette too — a green
     "taken" line over two students nobody looked at is the silence this is for. */
  check('and the half-taken class names its unconfirmed count on the card, in the caution palette',
    /^2 unconfirmed$/.test(day.cards.filter((c) => c.id === ids[3])[0].state)
      && / unconfirmed\b/.test(day.cards.filter((c) => c.id === ids[3])[0].cls)
      && !/ unconfirmed\b/.test(day.cards.filter((c) => c.id === ids[1])[0].cls),
    'the half-taken card says ' + JSON.stringify(day.cards.filter((c) => c.id === ids[3])[0].state)
      + ' with class ' + JSON.stringify(day.cards.filter((c) => c.id === ids[3])[0].cls)
      + '; the finished one says '
      + JSON.stringify(day.cards.filter((c) => c.id === ids[1])[0].state));

  /*
    And the three states are told apart ON THE CARD without reading the words — the same claim the
    column heads answer above, asked of the surface WO-1.13 changed. It matters more now than it did
    at WO-2.1: the state line stopped being a control of its own, so if it had also stopped carrying
    its palette it would have quietly become a grey sentence on a grey card.

    Parked first (tools/README.md trap 7): the last click landed on a card, and a card under the
    cursor is a card wearing `.class-card:hover` — one measured hovered and two measured resting is
    indistinguishable from three states painted differently, which is the defect being looked for.
  */
  await park();
  const cardTaken = await evalJs('window.__look(' + JSON.stringify(ids[1]) + ')');
  const cardDropped = await evalJs('window.__look(' + JSON.stringify(ids[2]) + ')');
  const cardUntaken = await evalJs('window.__look(' + JSON.stringify(ids[5]) + ')');
  const cardsApart = (a, b) => a.text !== b.text && a.bg !== b.bg && a.color !== b.color;
  check('and a taken class, a dropped one and an untaken one are three different cards to look at, not three sentences to read',
    !!cardTaken && !!cardDropped && !!cardUntaken
      && cardsApart(cardTaken, cardDropped) && cardsApart(cardDropped, cardUntaken)
      && cardsApart(cardTaken, cardUntaken)
      && cardDropped.style === 'dashed' && cardTaken.style === 'solid'
      && cardUntaken.style === 'solid',
    'taken ' + JSON.stringify(cardTaken) + ' · dropped ' + JSON.stringify(cardDropped)
      + ' · untaken ' + JSON.stringify(cardUntaken));

  /* ── WO-1.13: the reload above was taken from a class, so it comes back to that class ──
     `openClassId` has always survived a reload and until now it meant nothing on screen; this is
     the other half. The class is ids[4], which is where the last tap of the day left the app, and
     what has to come back is BOTH: that class open, and its working surface in <main> rather than
     the grid. The reload is the one already being taken for the day's tally above, so this costs
     no second boot.

     It is also where the class view's markup is asserted to be a page and not a dialog wearing new
     class names — no `role="dialog"`, no `aria-modal`, no close control anywhere inside it. That is
     the Traps line, and the moment to ask it is after a reload, when everything on screen was built
     from the markup rather than from whatever the run had done to it. */
  check('a reload taken from a class comes back to that class\'s view, not to a blank main area or the grid',
    day.viewShown && !day.homeShown && day.openClass === ids[4]
      && day.className !== '' && day.dialogs.length === 0
      /* Painted, not merely revealed: the six day columns are built by the renderer at boot, and an
         empty grid under a visible view would be a view restored without its screen. Columns rather
         than rows, because the class this reload lands on legitimately has an empty roster and the
         grid keeps its head for exactly that case (renderRows in src/attendance.js). */
      && day.columns.length === 6 && day.colStates !== '',
    'class view up = ' + day.viewShown + ', class grid up = ' + day.homeShown
      + ', open class = ' + JSON.stringify(day.openClass) + ' of ' + JSON.stringify(ids[4])
      + ', the screen says ' + JSON.stringify(day.className) + ' over '
      + day.columns.length + ' day column(s) and ' + day.rowCount + ' row(s)'
      + ', dialogs open = ' + JSON.stringify(day.dialogs));
  check('and that view is a page rather than a dialog wearing a new name — no dialog role, no aria-modal, no close control',
    day.viewRoles.length === 0 && day.viewCloses === 0 && day.homeDoors.length === 2,
    'dialog semantics found inside the view = ' + JSON.stringify(day.viewRoles)
      + ', close controls = ' + day.viewCloses + ', ways back to the grid = '
      + JSON.stringify(day.homeDoors));

  /* ── every open starts on today ──
     The screen is opened with a class walking through the door, and finding it where it was left
     an hour ago — paged back, filtered to tardies, with Tuesday unlocked — would cost exactly the
     seconds this whole design is about. Left until after the reload above so that the state being
     checked is the one a fresh open produces rather than one a reload cleared for free. */
  const reFiltered = await openCard(marking);
  await clickSel('[data-attendance-page="earlier"]');
  await clickSel('[data-attendance-filter="A"]');
  await closeAll();
  const reopenedFresh = await openCard(marking);
  check('every open starts on today, unpaged, unfiltered and with no past day left unlocked',
    reopenedFresh.columns.map((c) => c.date).join(' ') === thisWeek.join(' ')
      && !reopenedFresh.banner.shown
      && reopenedFresh.pills.filter((p) => p.active).map((p) => p.code).join('') === 'all'
      && reopenedFresh.sorts.filter((s) => s.active).map((s) => s.which).join('') === 'last'
      && reopenedFresh.rowCount === 26,
    'reopened on ' + JSON.stringify(reopenedFresh.columns.map((c) => c.date))
      + ' with ' + reopenedFresh.rowCount + ' row(s), pills '
      + JSON.stringify(reopenedFresh.pills.filter((p) => p.active).map((p) => p.code))
      + ' (it had been left on ' + JSON.stringify(reFiltered.columns[0].date) + ' paged back)');

  /*
    ── WO-1.13 acceptance 8: presentation mode covers the view that moved ──

    The registry holds no support data of any kind, on purpose (src/attendance.js: it is the screen
    most likely to be on a projector, with a whole class on it). That claim was made about a dialog;
    this asks it of the same screen as a page, with a full roster on it, in BOTH modes — because
    "the new view inherits presentation mode" is only meaningful if what it inherits is enforced
    where the data would otherwise be.

    The strings searched for are read out of the document rather than written here, so a fixture
    changed in the roster section cannot quietly make this check vacuous — and there being some of
    them is asserted, for the same reason. The mode is put back off before anything else runs: a run
    that walked away in presentation mode would suppress the fixtures of every check after it.
  */
  const supportStrings = await evalJs(`(function(){
    var out = [];
    function walk(v){
      if (typeof v === 'string') { if (v.trim().length > 3) out.push(v.trim()); return; }
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (v && typeof v === 'object') { Object.keys(v).forEach(function(k){ walk(v[k]); }); }
    }
    window.planbook.store.getDoc().students.forEach(function(s){ walk(s.supports); });
    return out; })()`);
  const onRoster = await openCard(marking);
  const quietOff = await evalJs("(function(){ var v = document.getElementById('classView');"
    + " return { text: v ? (v.textContent || '') : '',"
    + " hooks: v ? v.querySelectorAll('[data-support-plan],[data-supports-open],[data-supports-reveal],.support-dot').length : -1 }; })()");
  await clickSel('header [data-presentation-toggle]');
  await new Promise(r => setTimeout(r, 200));
  const quietOn = await evalJs("(function(){ var v = document.getElementById('classView');"
    + " return { on: !window.planbook.supports.supportsVisible(), text: v ? (v.textContent || '') : '',"
    + " hooks: v ? v.querySelectorAll('[data-support-plan],[data-supports-open],[data-supports-reveal],.support-dot').length : -1 }; })()");
  await clickSel('header [data-presentation-toggle]');
  await new Promise(r => setTimeout(r, 200));
  const modeLeftOff = await evalJs('window.planbook.supports.supportsVisible()');
  const leaked = (text) => supportStrings.filter((s) => text.indexOf(s) >= 0);
  check('the registry in the main area carries no support data in either mode, on a class of 26 with plans on file',
    supportStrings.length > 0 && onRoster.rowCount === 26
      && quietOff.hooks === 0 && quietOn.hooks === 0 && quietOn.on === true
      && leaked(quietOff.text).length === 0 && leaked(quietOn.text).length === 0
      && modeLeftOff === true,
    supportStrings.length + ' support string(s) on file, searched for on a ' + onRoster.rowCount
      + '-row grid; leaked with the mode off = ' + JSON.stringify(leaked(quietOff.text))
      + ', with it on = ' + JSON.stringify(leaked(quietOn.text))
      + '; support-shaped controls in the view = ' + quietOff.hooks + '/' + quietOn.hooks
      + '; mode really engaged = ' + quietOn.on + ', left off = ' + modeLeftOff);

  /* ── the way back out (WO-1.13) ──
     It used to be a ✕ on a dialog, and the check here was that closing it handed focus back to the
     card that opened it — the one opener in the app that could not be taken for granted, because
     the grid was rebuilt under it before the dialog went up. There is no dialog and no ✕ now:
     leaving the registry is navigation, so what has to be true is that the control is there, that
     it puts the class grid back without opening anything, and that WHICH CLASS IS OPEN survives the
     trip. That last clause is the one with teeth — a "back" that quietly cleared the selection
     would leave the header with nothing marked and the next screen describing no class. */
  const backFrom = ids[5];
  await openCard(backFrom);
  await clickSel('#classView [data-view-home]');
  const back = await read();
  check('one tap on "All classes" puts the grid back, opens no dialog, and keeps the class it was on open',
    back.homeShown && !back.viewShown && back.dialogs.length === 0
      && back.openClass === backFrom && back.cards.length === 6
      /* And no way back offered on the screen it lands on: both doors go with the class view they
         belong to, which is the same rule that takes the class tabs off this screen. Asserted on
         the class view instead, where the two of them are, by the reload check further up. */
      && back.homeDoors.length === 0,
    'class grid up = ' + back.homeShown + ', class view up = ' + back.viewShown
      + ', dialogs open = ' + JSON.stringify(back.dialogs) + ', open class still '
      + JSON.stringify(back.openClass) + ' of ' + JSON.stringify(backFrom)
      + '; doors back offered here = ' + JSON.stringify(back.homeDoors));

  /*
    ── WO-1.13 acceptance 3, as a measurement: cards enter, tabs switch ──

    "Exactly one control means work on this class now" was the line this work order failed the first
    time, and it failed on a build where the header's class tabs and the home screen's cards were
    both on screen, both carrying `data-class-tab`, both landing on the same branch of src/shell.js.
    The owner's call is that the tab row is not drawn on the grid at all: there the cards are how you
    enter a class, and on the class view the row is the switcher between classes — a job the cards
    cannot do, because by then they are not on screen.

    So it is counted as CONTROLS A TEACHER COULD TAP RIGHT NOW rather than as markup. Both sets are
    in the DOM at all times — the hidden view keeps its own — and `offsetParent` is null for anything
    inside a `.hidden` view or absent from a strip, which is what makes "never both at once" a
    question this file can answer at all.

    The first read is taken on the grid the check above just landed on; the second after one tap on a
    card, which is the gesture being asserted.
  */
  const visibleSelectors = () => evalJs(`(function(){
    function shown(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel))
      .filter(function(e){ return e.offsetParent !== null; }); }
    var cap = document.querySelector('#classTabBar .hdr-empty');
    var strip = document.getElementById('classTabBar');
    var sr = strip.getBoundingClientRect();
    var cr = cap && cap.offsetParent !== null ? cap.getBoundingClientRect() : null;
    return { headerTabs: shown('#classTabBar [data-class-tab]').length,
             cards: shown('#homeGrid .class-card-open').length,
             activeTabs: shown('#classTabBar .cls-tab.active').map(function(b){ return b.textContent; }),
             doors: shown('[data-view-home]').map(function(b){ return (b.textContent || '').trim(); }),
             caption: cr ? (cap.textContent || '').trim() : '',
             /* Drawn, not merely present: a caption clipped to nothing is the blank navy strip the
                work order says must not happen, and it would answer this check green on text alone.
                Read inside the strip it is supposed to be in, too — one line of it, at its top. */
             capW: cr ? Math.round(cr.width) : 0, capH: cr ? Math.round(cr.height) : 0,
             capIn: !!(cr && cr.left >= sr.left - 1 && cr.right <= sr.right + 1
               && cr.height <= sr.height + 1) }; })()`);
  const onGrid = await visibleSelectors();
  check('on the class grid the only control that opens a class is the card — the header row draws no class tabs, and does not read as a blank strip',
    onGrid.cards === 6 && onGrid.headerTabs === 0 && onGrid.activeTabs.length === 0
      && onGrid.doors.length === 0 && onGrid.caption !== ''
      && onGrid.capW > 20 && onGrid.capH > 0 && onGrid.capIn,
    onGrid.cards + ' card(s) and ' + onGrid.headerTabs + ' header class tab(s) on screen; the strip '
      + (onGrid.caption ? 'says ' + JSON.stringify(onGrid.caption) + ' in ' + onGrid.capW + 'x'
        + onGrid.capH + 'px, inside the strip = ' + onGrid.capIn : 'is EMPTY')
      + ', ways back offered = ' + JSON.stringify(onGrid.doors));
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + ids[0] + '"]');
  const inClass = await visibleSelectors();
  check('and on a class the only control that opens a class is the header tab — the cards are gone, one tab is active, and "All classes" says in words what the other one does',
    inClass.headerTabs === 6 && inClass.cards === 0 && inClass.activeTabs.length === 1
      && inClass.doors.length === 2 && inClass.doors.every((t) => /All classes/.test(t))
      && inClass.caption === '',
    inClass.headerTabs + ' header class tab(s) and ' + inClass.cards + ' card(s) on screen; active = '
      + JSON.stringify(inClass.activeTabs) + ', ways back = ' + JSON.stringify(inClass.doors));

  /* And the same door from the header, which is the one that has to work from either view — the
     panel's own is inside the screen it leaves. Driven separately rather than assumed to be the
     same code path, because two doors onto one route is only true while both are wired to it. */
  await openTab(ids[1]);
  await clickSel('#classTabBar [data-view-home]');
  const backHdr = await read();
  check('and so does the "All classes" tab in the header, from a class opened off the header tab row',
    backHdr.homeShown && !backHdr.viewShown && backHdr.dialogs.length === 0
      && backHdr.openClass === ids[1],
    'class grid up = ' + backHdr.homeShown + ', class view up = ' + backHdr.viewShown
      + ', open class = ' + JSON.stringify(backHdr.openClass));

  /*
    ── THE CLASS RESET, AND THE ROUND TRIP BACK OUT OF IT (WO-2.10) ──

    "Un-confirm is reachable: a student cycled by mistake can be returned to `?`, OR THE CLASS
    RESET, without leaving the screen." The row's own button is driven further up; this is the other
    half, and it goes last because it is the one control on this screen that deliberately destroys
    marks — the same trade dropClass() makes, and made loud the same way: its title counts what will
    go before it goes.

    Then straight back out again with "Everyone's here", which is what makes this a round trip
    rather than a one-way door: the class ends the run taken, with an empty `marks` object, which is
    the shape WO-2.1 shipped for a class where nobody was absent.
  */
  const beforeReset = await openCard(ids[0]);
  const resetBtn = beforeReset.actions.filter((a) => a.hook.indexOf('data-attendance-unconfirm-all=') === 0)[0];
  await clickSel('#attendanceActions [data-attendance-unconfirm-all]');
  const reset = await read();
  const resetRec = reset.today.filter((r) => r.classId === ids[0])[0] || {};
  check('"Un-confirm everyone" puts the whole class back to ?, and says how many marks that costs before it costs them',
    !!resetBtn && resetBtn.text === 'Un-confirm everyone'
      && beforeReset.actions.every((a) => a.hook.indexOf('data-attendance-untake=') !== 0)
      && Object.keys(resetRec.marks || {}).length === 26
      && Object.keys(resetRec.marks).every((id) => resetRec.marks[id].code === 'U')
      && Object.keys(resetRec.marks).every((id) => Object.keys(resetRec.marks[id]).join(',') === 'code')
      && reset.rows.every((r) => r.codes.charAt(0) === '?')
      && reset.columns[0].chip === '26 to go' && reset.stateText === '26 unconfirmed'
      && reset.states.indexOf(ids[0] + '=taken') >= 0,
    'the control offered on a class carrying four marks was '
      + JSON.stringify(beforeReset.actions.map((a) => a.text))
      + '; after one tap the record holds ' + Object.keys(resetRec.marks || {}).length
      + ' entr(ies), all of them U with nothing else on them, the column reads '
      + JSON.stringify(reset.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and the class is still a meeting (' + reset.states.split(' ')[0] + ')');

  await clickSel('#attendanceActions [data-attendance-take]');
  const retaken = await read();
  const retakenRec = retaken.today.filter((r) => r.classId === ids[0])[0] || {};
  check('and one tap of "Everyone\'s here" comes straight back out of it, to a record with an empty marks object',
    JSON.stringify(retakenRec.marks) === '{}'
      && retakenRec.keys === 'classId,date,marks'
      && retaken.rows.every((r) => r.codes.charAt(0) === 'P')
      && retaken.columns[0].chip === 'Taken' && retaken.stateText === 'Taken · all present'
      /* Its own class only. The half-taken class beside it keeps its two `U`s — "everyone's here"
         is a statement about the room in front of her, and a build that resolved every class at
         once would be the WO-2.1 defect this whole work order exists to undo, one level up. */
      && retaken.todayValues.U === 2 && !retaken.values.P,
    'the record is now ' + JSON.stringify(retakenRec) + ', the column reads '
      + JSON.stringify(retaken.rows.map((r) => r.codes.charAt(0)).join(''))
      + ' and the unconfirmed students left on the day are ' + (retaken.todayValues.U || 0)
      + ' (the other class\'s, untouched)');

  /*
    ── WO-2.8: hall passes ──

    Seven acceptance lines, and the FIRST ONE IS WHY THIS FEATURE EXISTS AS A WORK ORDER AT ALL:
    Roll Call! keeps its open passes in a module variable (`activePasses`, dashboard.html:2437), and
    a build that copied that would pass every other check below. So the reload check here does not
    ask the app whether the pass is still open — it reads the record straight out of IndexedDB, with
    the page freshly reloaded, and compares the time out character for character. That is the only
    question a desk can answer about "survives a force-quit", and it is the half of the line that is
    not owed to a human with a real iPad.

    THREE OF THESE CLAIMS ARE ABOUT WHAT DID *NOT* HAPPEN, and each is paired with the presence that
    makes the absence mean something. "A pass creates no attendance record" is asserted over a class
    that is genuinely taken, with the record count and the mark tally read before and after — the
    fixture is loud, and the silence beside it is the claim. "The log holds no name" is asked by
    searching the serialised log for every name in the document, not for the fields this file
    happened to think of. And "undoing the D leaves nothing behind" is asserted against a log entry
    that was seen to exist first.
  */
  const passClass = ids[0];
  const beforePasses = await openCard(passClass);
  const passRoster = beforePasses.rows.map((r) => r.student);
  /* The fixture, asserted rather than assumed: a class of 26 that is taken with everybody present,
     so that every claim below about attendance not moving is made against a real record with a real
     tally, and every claim about a pass is made on a row that has one. */
  const passBaselineRecords = beforePasses.records.length;
  const passBaselineValues = JSON.stringify(beforePasses.values);
  check('the registry carries a Passes column, three types per student, on a class that is already taken',
    beforePasses.passColumn === 1 && passRoster.length === 26
      && beforePasses.rows.every((r) => r.pass && r.pass.types === 'bathroom,nurse,quick'
        && r.pass.off === 0 && !r.pass.out)
      && beforePasses.openPasses.length === 0 && beforePasses.passLog.length === 0
      && beforePasses.states.indexOf(passClass + '=taken') >= 0,
    beforePasses.rows.length + ' row(s), the first offering '
      + JSON.stringify(beforePasses.rows[0] && beforePasses.rows[0].pass)
      + '; open passes = ' + beforePasses.openPasses.length + ', logged = '
      + beforePasses.passLog.length + ', over ' + passBaselineRecords + ' attendance record(s)');

  /* ── one tap out ── */
  const outA = passRoster[0];
  const outB = passRoster[1];
  const outC = passRoster[2];
  const outD = passRoster[3];
  await clickSel('[data-pass-issue="' + outA + '"][data-pass-type="bathroom"]');
  const issued = await read();
  const firstPass = issued.openPasses[0] || {};
  const rowA = issued.rows.filter((r) => r.student === outA)[0] || {};
  check('one tap sends a student out: who, which type, and the time — and their row offers Return instead',
    issued.openPasses.length === 1 && firstPass.studentId === outA
      && firstPass.classId === passClass && firstPass.type === 'bathroom'
      /* A local stamp WITH its offset, like every other time this app writes: the hour read back
         has to be the hour the teacher's clock showed (src/attendance.js's stampNow). A `Z` here
         would be the same instant printed as a different hour. */
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(firstPass.out || '')
      && (firstPass.out || '').slice(0, 10) === nodeToday
      && firstPass.keys === 'classId,id,out,studentId,type'
      && !!rowA.pass && rowA.pass.out === true && /^\d+:\d{2}[ap]$/.test(rowA.pass.since)
      /* And nobody else moved. Twenty-five rows still offering three buttons is what makes the one
         row that changed a change rather than a repaint. */
      && issued.rows.filter((r) => r.pass && r.pass.out).length === 1
      && issued.rows.filter((r) => r.pass && r.pass.types === 'bathroom,nurse,quick').length === 25,
    'openPasses = ' + JSON.stringify(issued.openPasses) + '; the row reads '
      + JSON.stringify(rowA.pass));

  /* WO-2.8 acceptance 6, on the tap that would break it. */
  check('and it wrote no attendance: no new record, no mark moved, nobody made absent by leaving the room',
    issued.records.length === passBaselineRecords
      && JSON.stringify(issued.values) === passBaselineValues
      && rowA.codes.charAt(0) === 'P',
    issued.records.length + ' attendance record(s) (was ' + passBaselineRecords
      + '), marks across the document = ' + JSON.stringify(issued.values)
      + ' (was ' + passBaselineValues + '); the row that left the room still reads "'
      + rowA.codes + '" across the week');

  /*
    ── ACCEPTANCE LINE 1, THE HALF A DESK CAN ANSWER ──

    Flushed, reloaded, and then read OUT OF INDEXEDDB rather than out of the app: the question is
    whether the open pass is a record or a variable, and only the record survives a process. The
    time out is compared character for character against the one written before the reload, because
    "still out" with a time re-stamped at boot would be a cleared board wearing the right shape.

    The 👤 half — an actual force-quit of an installed PWA on the owner's own iPad — stays owed.
  */
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const onDisk = await evalJs(`(async function(){
    var rec = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years')
          .get(window.planbook.store.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    return { open: (rec && rec.openPasses) || null, log: (rec && rec.passes) || null,
             stored: !!rec }; })()`);
  const relaunched = await openCard(passClass);
  const rowAgain = relaunched.rows.filter((r) => r.student === outA)[0] || {};
  check('an open pass survives a reload: it comes back out of IndexedDB, with the original time out',
    onDisk.stored && Array.isArray(onDisk.open) && onDisk.open.length === 1
      && onDisk.open[0].studentId === outA && onDisk.open[0].out === firstPass.out
      && Array.isArray(onDisk.log) && onDisk.log.length === 0
      && relaunched.openPasses.length === 1 && relaunched.openPasses[0].out === firstPass.out
      && !!rowAgain.pass && rowAgain.pass.out === true
      && rowAgain.pass.since === rowA.pass.since,
    'the record on disk is ' + JSON.stringify(onDisk.open) + ' — the same time out ('
      + firstPass.out + ') as before the reload, and the row still reads "'
      + (rowAgain.pass && rowAgain.pass.since) + '" beside its Return button');

  /* ── the cap, and the reason for it ── */
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="nurse"]');
  await clickSel('[data-pass-issue="' + outC + '"][data-pass-type="quick"]');
  const capped = await read();
  const stillIn = capped.rows.filter((r) => r.pass && !r.pass.out);
  check('three at once is the cap: every remaining student\'s buttons are off, and the reason is on the screen',
    capped.openPasses.length === 3
      && capped.openPasses.map((p) => p.type).sort().join(',') === 'bathroom,nurse,quick'
      && stillIn.length === 23 && stillIn.every((r) => r.pass.off === 3)
      /* Not a dead control: the sentence above the grid says the number and what to do about it. */
      && /3 students/.test(capped.passNote) && /Return/.test(capped.passNote),
    capped.openPasses.length + ' out, ' + stillIn.length + ' rows with '
      + (stillIn[0] ? stillIn[0].pass.off : '?') + ' of 3 buttons disabled; the line above the grid says '
      + JSON.stringify(capped.passNote));

  /* And the writer refuses too, which is the half a disabled button cannot prove. Driven through
     the seam because a disabled control has no click to give — the same exception this section
     already makes for the future-date block, and for the same reason: a refused path has no button
     to press. */
  const fourth = await evalJs(`(async function(){
    var att = window.planbook.attendance;
    var p = window.planbook.passes;
    var s = window.planbook.store;
    /* The screen's own writer first: the guard a stale tap or a keyboard path would arrive at. */
    att.issuePass(${JSON.stringify(outD)}, 'bathroom');
    await s.flush();
    var afterScreen = s.getDoc().openPasses.length;
    /* And then the model underneath it, handed the live document with the screen's guard bypassed
       entirely. Both are asserted because they are guards against different mistakes — one is
       about a control that should not have fired, one is about the document — and a check that
       only drove the top one would go green with the bottom one deleted. */
    s.update(function(d){ p.openPass(d, ${JSON.stringify(passClass)},
      ${JSON.stringify(outD)}, 'bathroom', '2026-01-01T09:00:00-05:00'); });
    await s.flush();
    var out = window.__att();
    out.afterScreen = afterScreen;
    return out; })()`);
  check('and a fourth pass is refused by the screen AND by the writer under it, not merely un-clickable',
    fourth.afterScreen === 3 && fourth.openPasses.length === 3
      && fourth.openPasses.every((p) => p.studentId !== outD),
    'after asking the screen for a fourth, ' + fourth.afterScreen
      + ' pass(es) were open; after asking the model directly, ' + fourth.openPasses.length + ': '
      + JSON.stringify(fourth.openPasses.map((p) => p.studentId + ' ' + p.type)));

  /*
    ── AND THE CAP IS *THIS* CLASS'S CAP ──

    A deliberate divergence from the reference, argued at src/passes.js:81-91: Roll Call! loads one
    class at a time, so over there a global count and a per-class one are the same number. Here they
    are not — a pass the teacher forgot to close in period 2 must not eat a third of period 3's
    capacity for a room it has nothing to do with. EVERY OTHER PASS CHECK IN THIS SECTION RUNS
    INSIDE ONE CLASS, so a regression to a global count, or an openPassFor() that stopped filtering
    by classId, would leave all of them green.

    Nothing is issued next door: a pass left open in a second class would move the totals every
    check below counts. What is asked instead is the two predicates the divergence actually lives
    in, plus the screen drawn from them.
  */
  /* Any other class that has students on it — this run leaves one active class with an empty
     roster on purpose, and a check whose "next door" had no rows in it would assert nothing about
     a screen. Which one it lands on does not matter; that it has rows is asserted below. */
  const otherClass = await evalJs(`(function(){
    var d = window.planbook.store.getDoc();
    var c = d.classes.filter(function(x){ return !x.archived
      && x.id !== ${JSON.stringify(passClass)} && (x.roster || []).length > 0; })[0];
    return c ? c.id : ''; })()`);
  const otherOpen = await openCard(otherClass);
  const perClass = await evalJs(`(function(){
    var p = window.planbook.passes, d = window.planbook.store.getDoc();
    return { hereAtCap: p.atCap(d, ${JSON.stringify(passClass)}),
             thereAtCap: p.atCap(d, ${JSON.stringify(otherClass)}),
             hereOut: !!p.openPassFor(d, ${JSON.stringify(passClass)}, ${JSON.stringify(outA)}),
             thereOut: !!p.openPassFor(d, ${JSON.stringify(otherClass)}, ${JSON.stringify(outA)}),
             open: (d.openPasses || []).length }; })()`);
  check('the cap is THIS class\'s cap: a room that is full leaves the class next door its own three',
    perClass.hereAtCap === true && perClass.thereAtCap === false && perClass.open === 3
      /* And a student who is out of one room is not out of another: openPassFor() filters by class
         as well as by student, which is what stops the same child being drawn with a Return button
         in a room they are sitting in. */
      && perClass.hereOut === true && perClass.thereOut === false
      /* The screen agrees. Not one button off next door, and no reason line, while the class this
         section has been working is at its limit. */
      && otherOpen.rows.length > 0
      && otherOpen.rows.every((r) => r.pass && r.pass.off === 0 && !r.pass.out)
      && otherOpen.passNote === '',
    'at the cap here = ' + perClass.hereAtCap + ', next door = ' + perClass.thereAtCap
      + ' over ' + perClass.open + ' open pass(es); that student reads out here = '
      + perClass.hereOut + ', next door = ' + perClass.thereOut + '; '
      + otherOpen.rows.length + ' row(s) next door with '
      + JSON.stringify([...new Set(otherOpen.rows.map((r) => r.pass && r.pass.off))])
      + ' button(s) off and the note line ' + JSON.stringify(otherOpen.passNote));
  await openCard(passClass);

  /*
    ── one tap back, with the minutes it owes ──

    THE GAP IS MANUFACTURED. Left alone, every pass this run issues comes back in under a second and
    "0 minutes" is what a broken calculation and a correct one both produce. So the open pass's `out`
    is wound back seven minutes through the store before the Return is tapped, and seven is the
    number the entry has to carry. The wind-back is asserted before it is used.
  */
  const wound = await evalJs(`(async function(){
    var s = window.planbook.store;
    var was = '';
    s.update(function(d){
      d.openPasses.forEach(function(p){
        if (p.studentId !== ${JSON.stringify(outA)}) return;
        was = p.out;
        var t = new Date(Date.parse(p.out) - 7 * 60000);
        var pad = function(n){ return (n < 10 ? '0' : '') + n; };
        var off = -t.getTimezoneOffset(), abs = Math.abs(off);
        p.out = t.getFullYear() + '-' + pad(t.getMonth()+1) + '-' + pad(t.getDate())
          + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds())
          + (off < 0 ? '-' : '+') + pad(Math.floor(abs/60)) + ':' + pad(abs % 60);
      }); });
    await s.flush();
    return { was: was, now: (s.getDoc().openPasses.filter(function(p){
      return p.studentId === ${JSON.stringify(outA)}; })[0] || {}).out }; })()`);
  check('the fixture for the minutes is real: that student\'s time out was wound back seven minutes',
    !!wound.was && !!wound.now && wound.now !== wound.was
      && Math.round((Date.parse(wound.was) - Date.parse(wound.now)) / 60000) === 7,
    'out went from ' + wound.was + ' to ' + wound.now);

  await evalJs('window.planbook.attendance.renderAttendance();1');
  await clickSel('[data-pass-return="' + outA + '"]');
  const returned = await read();
  const logged = returned.passLog[0] || {};
  const rowBack = returned.rows.filter((r) => r.student === outA)[0] || {};
  check('one tap back writes ONE log entry with the right minutes, and the student\'s buttons come back',
    returned.passLog.length === 1
      && logged.studentId === outA && logged.classId === passClass && logged.type === 'bathroom'
      && logged.out === wound.now && logged.minutes === 7 && logged.endedBy === 'return'
      && logged.keys === 'back,classId,endedBy,id,minutes,out,studentId,type'
      && returned.openPasses.length === 2
      && !!rowBack.pass && rowBack.pass.out === false
      && rowBack.pass.types === 'bathroom,nurse,quick'
      /* Under the cap again, so every other row's buttons come back on with it, and the reason
         above the grid goes away because there is no longer one. */
      && rowBack.pass.off === 0 && returned.passNote === '',
    'the log holds ' + returned.passLog.length + ' entr(ies): ' + JSON.stringify(logged)
      + '; the row now offers ' + JSON.stringify(rowBack.pass) + ' and the note line is '
      + JSON.stringify(returned.passNote));

  check('and the round trip still wrote no attendance — a student who went to the bathroom was present',
    returned.records.length === passBaselineRecords
      && JSON.stringify(returned.values) === passBaselineValues
      && rowBack.codes.charAt(0) === 'P',
    returned.records.length + ' attendance record(s) (was ' + passBaselineRecords
      + '), marks across the document = ' + JSON.stringify(returned.values)
      + ' (was ' + passBaselineValues + '), and that row reads "' + rowBack.codes + '"');

  /*
    ── the log is keyed by student id, and a rename proves it ──

    Asked of the document rather than of the screen, which is the acceptance line's own wording. The
    rename goes in through the store and the app is reloaded on top of it, so what is compared is a
    log entry that has been through IndexedDB since the name changed.
  */
  const renamedTo = await evalJs(`(async function(){
    var s = window.planbook.store;
    var doc = s.getDoc();
    var stu = doc.students.filter(function(x){ return x.id === ${JSON.stringify(outA)}; })[0];
    var was = { first: stu.first, last: stu.last };
    s.update(function(){ stu.first = 'Renamed'; stu.last = 'Afterwards'; });
    await s.flush();
    return was; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_ATT_READER);
  const afterRename = await openCard(passClass);
  const keptEntry = afterRename.passLog.filter((p) => p.studentId === outA)[0] || {};
  check('the pass log is keyed by student id: renaming that student afterwards neither orphans nor re-attaches their pass',
    afterRename.names.indexOf('Renamed Afterwards') >= 0
      && afterRename.passLog.length === 1
      && keptEntry.id === logged.id && keptEntry.minutes === 7
      && keptEntry.out === logged.out && keptEntry.back === logged.back
      /* And no name is in there at all — searched for every name the document holds, rather than
         for the fields this file thought to look at. */
      && afterRename.names.every((n) => afterRename.passJson.indexOf(n) < 0)
      && afterRename.passJson.indexOf('Renamed') < 0,
    'the entry after the rename is ' + JSON.stringify(keptEntry)
      + '; the serialised pass collections mention none of the '
      + afterRename.names.length + ' names in the document');
  await evalJs(`(async function(){ var s = window.planbook.store;
    var stu = s.getDoc().students.filter(function(x){ return x.id === ${JSON.stringify(outA)}; })[0];
    s.update(function(){ stu.first = ${JSON.stringify(renamedTo.first)};
      stu.last = ${JSON.stringify(renamedTo.last)}; });
    await s.flush(); return 1; })()`);
  await evalJs('window.planbook.attendance.renderAttendance();1');

  /*
    ── `D` and an open pass agree ──

    Driven through the CELL, one tap at a time round the cycle, rather than through setMark: the
    coupling lives in the writer every tap goes through, and a check that called the writer directly
    would not notice a grid that had stopped reaching it. The three marks on the way to `D` are the
    control: a student who is out and is marked absent, at an event, or tardy is still out, and only
    the dismissal closes anything.
  */
  const beforeD = await read();
  const passB = beforeD.openPasses.filter((p) => p.studentId === outB)[0] || {};
  const onTheWay = [];
  for (let i = 0; i < 4; i++) {
    await tapCell(outB, nodeToday);
    const step = await read();
    const row = step.rows.filter((r) => r.student === outB)[0] || {};
    onTheWay.push(row.codes.charAt(0) + (step.openPasses.some((p) => p.studentId === outB) ? '+' : '-'));
  }
  const dismissD = await read();
  const dCell = ((dismissD.today.filter((r) => r.classId === passClass)[0] || {}).marks || {})[outB];
  const closedByD = dismissD.passLog.filter((p) => p.studentId === outB)[0] || {};
  check('marking a student D while they are out closes the pass — and A, E and T on the way there do not',
    onTheWay.join(' ') === 'A+ E+ T+ D-'
      && !dismissD.openPasses.some((p) => p.studentId === outB)
      && dismissD.passLog.length === 2
      && closedByD.endedBy === 'dismissed' && closedByD.out === passB.out
      && typeof closedByD.minutes === 'number'
      /* The link back, on the cell that caused it and nowhere else. A `D` that closed no pass
         carries no such field, and no other code ever does. */
      && !!dCell && dCell.code === 'D' && dCell.passId === closedByD.id
      && Object.keys(dCell).sort().join(',') === 'at,code,passId',
    'the cell walked ' + JSON.stringify(onTheWay.join(' '))
      + ' (code, and + for still out); the D cell is ' + JSON.stringify(dCell)
      + ' and the entry it closed is ' + JSON.stringify(closedByD));

  await tapCell(outB, nodeToday);
  const undoneD = await read();
  const undoneRec = (undoneD.today.filter((r) => r.classId === passClass)[0] || {});
  const backOut = undoneD.openPasses.filter((p) => p.studentId === outB)[0] || {};
  const rowB = undoneD.rows.filter((r) => r.student === outB)[0] || {};
  check('and undoing the D puts the pass back — same time out, and the entry it wrote is gone rather than doubled',
    backOut.studentId === outB && backOut.out === passB.out && backOut.id === closedByD.id
      && undoneD.openPasses.length === 2
      && undoneD.passLog.length === 1
      && !undoneD.passLog.some((p) => p.studentId === outB)
      && !!rowB.pass && rowB.pass.out === true
      /* The mark went back to present, which for this class means no entry at all — so the record
         is exactly the one this section started from, and the dismissal left nothing behind in
         either collection. */
      && JSON.stringify(undoneRec.marks) === '{}'
      && undoneD.records.length === passBaselineRecords
      && JSON.stringify(undoneD.values) === passBaselineValues,
    'the reopened pass is ' + JSON.stringify(backOut) + ', the log holds '
      + undoneD.passLog.length + ' entr(ies) ' + JSON.stringify(undoneD.passLog.map((p) => p.endedBy))
      + ', and the record is back to ' + JSON.stringify(undoneRec.marks));

  /*
    ── AND THEN THE DAY ROLLS OVER: yesterday's `D` does not put a pass back in the corridor ──

    The coupling is TODAY-ONLY IN BOTH DIRECTIONS, and the undo is the half that is easy to leave
    open — a retraction of the app's own write looks like it needs no date guard. It does. A `D`
    marked today carries a passId; tomorrow that same cell is a past-dated cell, and a past column
    is unlockable (WO-2.1). Ungated, editing it pushes a FINISHED pass back into `openPasses` with
    yesterday's time out: a Return button beside a student who is sitting in the room, one of the
    class's three slots eaten until somebody notices, and a real completed dismissal deleted out of
    the append-only history by an edit made on a later day. That is the Traps paragraph's own
    failure — the app asserting a child is out of the room when they are not — running backwards.

    EVERY OTHER `D` IN THIS SECTION IS MARKED AND UNDONE ON THE SAME DAY, so every check above is
    blind to it by construction. This one rolls the day over BY MOVING THE CELL RATHER THAN THE
    CLOCK: the dismissal is made today through the grid, exactly as the checks above make it, and
    then that cell — passId and all — is lifted onto yesterday's column with only its `at` re-dated,
    which is precisely the state midnight leaves it in. The fixture is asserted before it is used.

    IT IS MOVED ONTO THE RECORD THAT COLUMN ALREADY HAS, never onto a second record beside it, and
    the count is asserted. This is the mistake the first version of this check made and it is worth
    naming: yesterday is a day this section's own class was taken on, so a pushed record is a
    DUPLICATE classId+date pair — and a duplicate is inert (src/attendance.js:618-620, "the first is
    the one this app reads and the one every write below edits"). The D cell would have been sitting
    somewhere the tap below could never reach, the tap would have walked an empty cell P → A → E,
    and every assertion about a pass not reopening would have been true of a cell nothing touched.
  */
  const yesterday = thisWeek[1];
  for (let i = 0; i < 4; i++) await tapCell(outB, nodeToday);
  const dismissedAgain = await read();
  const secondD = dismissedAgain.passLog
    .filter((p) => p.studentId === outB && p.endedBy === 'dismissed')[0] || {};
  const rolled = await evalJs(`(async function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    var cls = ${JSON.stringify(passClass)}, who = ${JSON.stringify(outB)};
    var day = ${JSON.stringify(yesterday)};
    var day0 = d.attendance.filter(function(r){ return r.classId === cls && r.date === day; });
    var rec = d.attendance.filter(function(r){
      return r.classId === cls && r.date === ${JSON.stringify(nodeToday)}; })[0];
    var cell = rec && rec.marks[who] ? JSON.parse(JSON.stringify(rec.marks[who])) : null;
    if (cell && cell.at) cell.at = day + cell.at.slice(10);
    var before = day0.length === 1 ? JSON.stringify(day0[0].marks || {}) : null;
    s.update(function(){
      delete rec.marks[who];
      if (day0.length === 1 && cell) day0[0].marks[who] = cell;
    });
    await s.flush();
    window.planbook.attendance.renderAttendance();
    var after = s.getDoc().attendance.filter(function(r){ return r.classId === cls && r.date === day; });
    return { records: after.length, before: before,
             moved: after.length === 1 ? ((after[0].marks || {})[who] || null) : null,
             todayNow: rec.marks[who] || null,
             open: s.getDoc().openPasses.length }; })()`);
  check('the fixture for a day rolling over is real: that D cell, passId and all, now sits on the one record yesterday has',
    rolled.records === 1
      && !!rolled.moved && rolled.moved.code === 'D' && rolled.moved.passId === secondD.id
      && (rolled.moved.at || '').slice(0, 10) === yesterday
      && rolled.todayNow === null && rolled.open === 1
      && dismissedAgain.passLog.length === 2 && secondD.endedBy === 'dismissed',
    yesterday + ' holds ' + rolled.records + ' record(s) for that class, the first of them reading '
      + JSON.stringify(rolled.moved) + ' for that student, and today holds '
      + JSON.stringify(rolled.todayNow) + '; the pass it closed is ' + JSON.stringify(secondD)
      + ', leaving ' + rolled.open + ' open');

  await clickSel('[data-attendance-edit="' + yesterday + '"]');
  await tapCell(outB, yesterday);          /* D -> P: the tap that would have reopened it */
  const nextDay = await read();
  await tapCell(outB, yesterday);          /* P -> A: and the cell comes back without the id */
  const nextDayA = await read();
  const yGone = (nextDay.records.filter((r) => r.classId === passClass && r.date === yesterday)[0]
    || {}).marks || {};
  const yRec = nextDayA.records.filter((r) => r.classId === passClass && r.date === yesterday)[0] || {};
  const stillDone = nextDay.passLog.filter((p) => p.id === secondD.id)[0] || {};
  check('but a D edited on a LATER day does not push its finished pass back into the corridor',
    /* THE TAP LANDED, which is the premise the two absences below are worth nothing without: the
       dismissal is off the cell, so the reopen was reached and refused rather than never asked. */
    !yGone[outB]
      /* Nobody new is out. One pass is open and it is the one that was already open. */
      && nextDay.openPasses.length === 1 && !nextDay.openPasses.some((p) => p.studentId === outB)
      /* And the history is intact: the dismissal that really happened is still there, unretracted,
         which is the half that would delete a record rather than invent one. */
      && nextDay.passLog.length === 2 && stillDone.endedBy === 'dismissed'
      && stillDone.out === secondD.out && stillDone.back === secondD.back
      /* The link dies with the cell instead, as the coupling's comment says it does: the rewritten
         cell carries a code and nothing else — no passId, and no `at`, because a device clock says
         nothing about yesterday. */
      && nextDayA.openPasses.length === 1 && nextDayA.passLog.length === 2
      && ((yRec.marks || {})[outB] || {}).code === 'A'
      && Object.keys((yRec.marks || {})[outB] || {}).join(',') === 'code',
    'after the tap on ' + yesterday + ' the cell held ' + JSON.stringify(yGone[outB] || null)
      + ', ' + nextDay.openPasses.length + ' pass(es) open ('
      + JSON.stringify(nextDay.openPasses.map((p) => p.studentId)) + ') and '
      + nextDay.passLog.length + ' logged ' + JSON.stringify(nextDay.passLog.map((p) => p.endedBy))
      + '; the rewritten cell is ' + JSON.stringify((yRec.marks || {})[outB]));

  /* Put the fixture away: the past column locked, yesterday's record put back byte for byte as this
     check found it — it is a real taken day this section borrowed, not one it invented, so it is
     restored rather than deleted — and that student sent out again, because the section has to END
     with two passes open for the reason below. */
  await clickSel('#attendanceBanner [data-attendance-page="today"]');
  await evalJs(`(async function(){
    var s = window.planbook.store;
    s.update(function(d){
      var rec = d.attendance.filter(function(r){
        return r.classId === ${JSON.stringify(passClass)}
          && r.date === ${JSON.stringify(yesterday)}; })[0];
      if (rec) rec.marks = JSON.parse(${JSON.stringify(rolled.before || '{}')});
    });
    await s.flush();
    window.planbook.attendance.renderAttendance();
    return 1; })()`);
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="bathroom"]');

  /*
    ── WO-2.11: the banner, and cancelling a pass issued by mistake ──

    NINE ACCEPTANCE LINES, AND THE FIRST OF THEM IS THE WHOLE WORK ORDER: cancelling has to leave
    `passes` BYTE-IDENTICAL. So every claim about it below is made against `JSON.stringify` of the
    array taken immediately before the tap, not against a count and not against the fields this file
    thought to read — the failure this exists to prevent is a cancel implemented as a return with
    `minutes: 0`, which would keep the count honest for one entry and leave a phantom trip in the
    record Phase 4 reads as a signal.

    FOUR OF THESE CLAIMS ARE ABOUT WHAT DID *NOT* HAPPEN, and each is paired with the presence that
    makes the absence mean something. The pass being cancelled is issued, seen on a card and seen in
    the document first; the note whose disappearance is the claim is typed, read back off the open
    pass, and only then cancelled; the attendance that must not move is a class of 26 that is
    genuinely taken; and the append-only rule is asserted on a log entry that was watched being
    written by a Return two taps earlier.

    EVERYTHING GOES THROUGH THE CONTROLS. The one exception is the model gate at the end — asking
    cancelPass() to delete a FINISHED pass, which is the Traps paragraph's own failure mode and has
    no button by construction, because the card that carried one is gone the moment the pass ends.
  */
  const banner0 = await read();
  /* This section's own fixture, re-read rather than inherited: the WO-2.8 checks above borrowed a
     past column and put it back, and a baseline taken before all that would be asserting their
     tidy-up as well as this one's silence. */
  const cancelRecords = banner0.records.length;
  const cancelValues = JSON.stringify(banner0.values);
  const cardB = (banner0.passBanner.cards || []).filter((c) => c.student === outB)[0] || {};
  const cardC = (banner0.passBanner.cards || []).filter((c) => c.student === outC)[0] || {};
  check('the banner draws one card per open pass in this class: name, type, time out, Return, Cancel and a note field',
    !!banner0.passBanner && banner0.passBanner.shown
      && banner0.passBanner.cards.length === 2 && banner0.openPasses.length === 2
      && !!cardB.student && !!cardC.student
      /* The card names the student the row does, says which type, and says when they left — the
         three things the work order asks the card to carry, and no elapsed clock among them. */
      && cardB.name === (banner0.rows.filter((r) => r.student === outB)[0] || {}).name
      /* The word with NO glyph, asserted as an absence rather than left unstated: the emoji came
         off on 2026-08-07 to buy the card's single row, and a chip that quietly grew one again
         would cost that row back on the device where it is tightest. */
      && /^Bathroom$/.test(cardB.type) && /^Quick$/.test(cardC.type)
      && /^out \d+:\d{2} [AP]M$/.test(cardB.out)
      /* Both actions on the card, and Return carries the SAME hook the row's own Return carries —
         one writer, two surfaces. Cancel is on the card only; the cell's own controls are asserted
         to be three issue buttons or one Return everywhere else in this section. */
      && cardB.cancels === outB && cardB.backText === '✓ Return' && cardB.cancelText === '✕ Cancel'
      && /Nothing is recorded/.test(cardB.cancelLabel)
      && cardB.note === '' && cardC.note === ''
      && /2 students are out of/.test(banner0.passBanner.label),
    banner0.passBanner ? banner0.passBanner.cards.length + ' card(s): '
      + JSON.stringify(banner0.passBanner.cards.map((c) => c.name + ' / ' + c.type + ' / ' + c.out))
      + ', announced as ' + JSON.stringify(banner0.passBanner.label)
      : 'no banner element on the page at all');

  /* Acceptance line 9, and it is a claim about WHERE rather than about what: the registry's width is
     budgeted to the pixel and WO-2.12 is about to spend it again, so a banner that took a day column
     would be a regression nobody would attribute to this work order six weeks from now. Measured
     three ways — the column count against the count from before any pass existed, the geometry, and
     the containment, because a card inside the grid wrap is a panel beside the rows by another
     name. */
  check('and it costs the registry no day columns — it is above the grid, not inside it and not beside it',
    banner0.columns.length === beforePasses.columns.length
      && banner0.passBanner.insideGrid === false && banner0.passBanner.aboveGrid === true
      && banner0.fit.over <= 0 && banner0.fit.page <= 0,
    banner0.columns.length + ' day column(s) with two cards up, against '
      + beforePasses.columns.length + ' with none; inside the grid = '
      + banner0.passBanner.insideGrid + ', above it = ' + banner0.passBanner.aboveGrid
      + ', grid over its own box by ' + banner0.fit.over + 'px, page by ' + banner0.fit.page + 'px');

  /*
    THE DESK HALF OF A 👤 LINE, AND IT DOES NOT CLOSE IT. "Cancel and Return cannot be confused at
    speed on glass" is the owner's call on her own device and nothing here can answer it. What this
    can answer is the half that would make the question moot: the two controls have to be drawn as
    DIFFERENT SHAPES rather than as two buttons of one kind in two colours — filled against outline,
    which is the difference that survives being seen out of the corner of an eye, and the one a
    later refactor to "one button style for the card" would quietly delete.

    The pointer is parked first, for the reason tools/README.md's trap 7 gives: the last thing
    clicked measures its `:hover` rule, and a comparison between two buttons where one is hovered
    reports a difference that is not the one being asked about.
  */
  await park();
  const drawn = await evalJs(`(function(){
    var card = document.querySelector('.attendance-pass-card');
    if (!card) return null;
    var b = card.querySelector('[data-pass-return]'), c = card.querySelector('[data-pass-cancel]');
    if (!b || !c) return null;
    /* The alpha of the computed fill, so this asks "is it filled at all" rather than naming a
       colour. It was written against a literal white on 2026-08-07 and broke the same day the card
       took Roll Call!'s dark palette — a check that hardcodes the surface it sits on fails on a
       re-skin that did not touch the thing it is guarding. */
    var alpha = function(c){ var m = /^rgba?\(([^)]*)\)/.exec(c || ''); if (!m) return 1;
      var p = m[1].split(','); return p.length > 3 ? parseFloat(p[3]) : 1; };
    var look = function(e){ var s = getComputedStyle(e);
      return { bg: s.backgroundColor, fill: alpha(s.backgroundColor), color: s.color,
               border: s.borderTopColor, text: (e.textContent || '').trim() }; };
    return { back: look(b), cancel: look(c) }; })()`);
  check('Return and Cancel are drawn as different SHAPES on the card — filled against outline, not one style in two colours (the desk half of a 👤 line)',
    !!drawn && drawn.back.bg !== drawn.cancel.bg
      && drawn.back.color !== drawn.cancel.color
      && drawn.back.border !== drawn.cancel.border
      /* The fill is the load-bearing half: Return is a solid button and Cancel has no fill of its
         own at all — it shows whatever the card behind it is. */
      && drawn.back.fill === 1 && drawn.cancel.fill === 0
      && drawn.back.text.charAt(0) === '✓' && drawn.cancel.text.charAt(0) === '✕',
    drawn ? 'Return is ' + JSON.stringify(drawn.back) + ' and Cancel is '
      + JSON.stringify(drawn.cancel) : 'no card on screen to measure');

  /* Acceptance line 8's hardest clause: the banner is scoped to the class ON SCREEN, which is only
     visible on a screen whose OWN class has nobody out while another class does. `openPassesFor()`
     against `openPassesIn()` is the whole difference, and a build that used the second would draw
     two cards here and pass every other check in this section. */
  const nextDoor = await openCard(otherClass);
  check('the banner is scoped to the class on screen: nothing next door, while two students are still out of this one',
    !!nextDoor.passBanner && nextDoor.passBanner.shown === false
      && nextDoor.passBanner.cards.length === 0 && nextDoor.passBanner.label === ''
      /* And the document still says two, so this is a banner that is scoped rather than a banner
         that is broken. */
      && nextDoor.openPasses.length === 2
      && nextDoor.rows.length > 0 && nextDoor.rows.every((r) => r.pass && !r.pass.out),
    'next door: banner shown = ' + (nextDoor.passBanner || {}).shown + ' with '
      + ((nextDoor.passBanner || {}).cards || []).length + ' card(s), while the document holds '
      + nextDoor.openPasses.length + ' open pass(es) across ' + nextDoor.rows.length + ' row(s) here');
  const backHere = await openCard(passClass);
  check('and it is drawn again on the class the passes belong to, unchanged by the trip next door',
    backHere.passBanner.shown === true && backHere.passBanner.cards.length === 2
      && backHere.passBanner.cards.map((c) => c.student).sort().join(',')
        === [outB, outC].sort().join(','),
    backHere.passBanner.cards.length + ' card(s) back: '
      + JSON.stringify(backHere.passBanner.cards.map((c) => c.name)));

  /*
    ── the note, and the shape rule it has to follow ──

    Typed into the card's own field, twice: whitespace first, which must leave NO KEY, and then a
    sentence, which must leave exactly one. That is src/attendance.js's own rule for a mark's note
    and acceptance line 6 asks for it here — a pass with no note carries no `note` key at all, not
    an empty string.
  */
  const noteSel = '[data-pass-note="' + outB + '"]';
  const typeNote = (sel, text) => evalJs('(function(){ var e = document.querySelector('
    + JSON.stringify(sel) + '); if (!e) return 0; e.value = ' + JSON.stringify(text)
    + '; e.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
  await typeNote(noteSel, '   ');
  const blankNote = await read();
  await typeNote(noteSel, 'nurse said to come straight back');
  const typedNote = await read();
  const openB = typedNote.openPasses.filter((p) => p.studentId === outB)[0] || {};
  check('a note typed on the card lands on the open pass — and whitespace alone leaves no key at all',
    (blankNote.openPasses.filter((p) => p.studentId === outB)[0] || {}).keys
      === 'classId,id,out,studentId,type'
      && openB.note === 'nurse said to come straight back'
      && openB.keys === 'classId,id,note,out,studentId,type'
      /* On the open pass and nowhere else. Nothing is finished, so nothing may have reached the
         history. */
      && typedNote.passLogJson === banner0.passLogJson,
    'the entry carried ' + JSON.stringify((blankNote.openPasses
      .filter((p) => p.studentId === outB)[0] || {}).keys) + ' after whitespace and '
      + JSON.stringify(openB.keys) + ' after a sentence; the log is unchanged at '
      + typedNote.passLog.length + ' entr(ies)');

  /*
    ── THE TAP THIS WORK ORDER EXISTS FOR ──

    Cancel, from the card, on a pass that is open and carries a note. Four things have to be true
    afterwards and they fail separately: the history is byte-identical, the open pass is gone, the
    ROW that issued it has its three buttons back (card → cell), and the note is nowhere in the
    document — not in either collection and not anywhere else either, which is why the whole
    serialised document is searched rather than the two arrays.
  */
  const beforeCancel = typedNote.passLogJson;
  await clickSel('[data-pass-cancel="' + outB + '"]');
  const cancelled = await read();
  const rowCancelled = cancelled.rows.filter((r) => r.student === outB)[0] || {};
  check('cancelling from the card leaves `passes` BYTE-IDENTICAL and takes the open pass with it',
    cancelled.passLogJson === beforeCancel
      && cancelled.passLog.length === typedNote.passLog.length
      && cancelled.openPasses.length === typedNote.openPasses.length - 1
      && !cancelled.openPasses.some((p) => p.studentId === outB)
      /* The card is gone and the row it came from offers the three types again — the two surfaces
         moving together is acceptance line 8's second clause, in the card-to-cell direction. */
      && cancelled.passBanner.cards.length === 1
      && cancelled.passBanner.cards[0].student === outC
      && !!rowCancelled.pass && rowCancelled.pass.out === false
      && rowCancelled.pass.types === 'bathroom,nurse,quick' && rowCancelled.pass.off === 0,
    'the log is ' + (cancelled.passLogJson === beforeCancel ? 'byte-identical' : 'DIFFERENT')
      + ' at ' + cancelled.passLog.length + ' entr(ies), ' + cancelled.openPasses.length
      + ' pass(es) still open, ' + cancelled.passBanner.cards.length
      + ' card(s) on the banner, and that row now offers ' + JSON.stringify(rowCancelled.pass));

  check('a note on a cancelled pass goes where the pass goes — nowhere in the document at all',
    typedNote.docJson.indexOf('nurse said to come straight back') >= 0
      && cancelled.docJson.indexOf('nurse said to come straight back') < 0,
    'the phrase was in the document before the cancel = '
      + (typedNote.docJson.indexOf('nurse said to come straight back') >= 0)
      + ', after it = ' + (cancelled.docJson.indexOf('nurse said to come straight back') >= 0));

  check('and cancelling wrote no attendance either: no record, no mark moved, nobody made absent by a mis-tap',
    cancelled.records.length === cancelRecords
      && JSON.stringify(cancelled.values) === cancelValues
      && rowCancelled.codes.charAt(0) === 'P',
    cancelled.records.length + ' attendance record(s) (was ' + cancelRecords
      + '), marks across the document = ' + JSON.stringify(cancelled.values)
      + ' (was ' + cancelValues + '); that row still reads "' + rowCancelled.codes + '"');

  /*
    ── acceptance line 2: the slot comes back IMMEDIATELY ──

    Taken to the cap, cancelled from the card, and then a FOURTH student is sent out with no reload
    and no repaint in between. A build that freed the slot in the document but not on the screen
    would leave the buttons grey; a build that did neither would refuse the issue outright, and the
    document is read after it either way.
  */
  const outE = passRoster[4];
  const outF = passRoster[5];
  await clickSel('[data-pass-issue="' + outD + '"][data-pass-type="nurse"]');
  await clickSel('[data-pass-issue="' + outE + '"][data-pass-type="bathroom"]');
  const atCapAgain = await read();
  await clickSel('[data-pass-cancel="' + outD + '"]');
  const freed = await read();
  await clickSel('[data-pass-issue="' + outF + '"][data-pass-type="quick"]');
  const refilled = await read();
  check('a cancelled pass frees its slot against the cap of three immediately — the next student goes out with no reload',
    atCapAgain.openPasses.length === 3 && /3 students/.test(atCapAgain.passNote)
      && atCapAgain.passBanner.cards.length === 3
      /* The moment after the cancel: two out, the reason line down, and every remaining row's
         buttons live again. */
      && freed.openPasses.length === 2 && freed.passNote === ''
      && freed.passBanner.cards.length === 2
      && freed.rows.filter((r) => r.pass && !r.pass.out).every((r) => r.pass.off === 0)
      /* And the slot is real, not merely drawn: the next issue lands. */
      && refilled.openPasses.length === 3
      && refilled.openPasses.some((p) => p.studentId === outF)
      && refilled.passBanner.cards.length === 3
      /* All of it without one entry reaching the history. */
      && refilled.passLogJson === beforeCancel,
    'at the cap: ' + atCapAgain.openPasses.length + ' out with the line up; after the cancel: '
      + freed.openPasses.length + ' out, line = ' + JSON.stringify(freed.passNote)
      + '; after the next issue: ' + refilled.openPasses.length + ' out and '
      + refilled.passLog.length + ' logged (unchanged = '
      + (refilled.passLogJson === beforeCancel) + ')');

  /*
    ── acceptance lines 5 and 6: Return still works, and the note rides through it ──

    Returned from the ROW rather than from the card, which is acceptance line 8's other direction:
    the cell writes and the card has to notice. The note is typed on the card first, so what is
    being asked is whether a note typed on one surface survives an action taken on the other.
  */
  await typeNote('[data-pass-note="' + outC + '"]', 'walked down to the office');
  const notedC = await read();
  await clickSel('[data-pass-return="' + outC + '"]');
  const returnedC = await read();
  const entryC = returnedC.passLog.filter((p) => p.studentId === outC)[0] || {};
  check('a note typed on the card survives the Return and is on the entry in `passes` — written from the row, and the card notices',
    (notedC.openPasses.filter((p) => p.studentId === outC)[0] || {}).note === 'walked down to the office'
      /* EXACTLY ONE entry, and the count is taken against the log this section has been holding
         byte-identical through four cancels. Cancel has not weakened Return. */
      && returnedC.passLog.length === refilled.passLog.length + 1
      && entryC.note === 'walked down to the office' && entryC.endedBy === 'return'
      && entryC.keys === 'back,classId,endedBy,id,minutes,note,out,studentId,type'
      && typeof entryC.minutes === 'number'
      /* The card went with the pass, and the row it belonged to has its three buttons back. */
      && returnedC.passBanner.cards.length === 2
      && !returnedC.passBanner.cards.some((c) => c.student === outC)
      && (returnedC.rows.filter((r) => r.student === outC)[0] || {}).pass.out === false,
    'the log went from ' + refilled.passLog.length + ' to ' + returnedC.passLog.length
      + ' entr(ies); the new one is ' + JSON.stringify(entryC) + ' and the banner is down to '
      + returnedC.passBanner.cards.length + ' card(s)');

  /* And the other half of the shape rule, on the same tap path: a pass nobody noted writes an entry
     with no `note` key at all. Returned from the CARD this time, so both buttons that carry the
     hook have been driven. */
  await clickSel('.attendance-pass-card [data-pass-return="' + outE + '"]');
  const returnedE = await read();
  const entryE = returnedE.passLog.filter((p) => p.studentId === outE)[0] || {};
  check('and a pass with no note carries no `note` key at all — the same rule a mark cell follows',
    returnedE.passLog.length === returnedC.passLog.length + 1
      && entryE.note === undefined
      && entryE.keys === 'back,classId,endedBy,id,minutes,out,studentId,type'
      && entryE.endedBy === 'return'
      && returnedE.passBanner.cards.length === 1
      && returnedE.passBanner.cards[0].student === outF,
    'that entry is ' + JSON.stringify(entryE) + ', leaving '
      + returnedE.passBanner.cards.length + ' card(s) on the banner');

  /*
    ── THE TRAPS PARAGRAPH, AS A CHECK ──

    `passes` is append-only and this work order is the one exception being carved into that rule, so
    it must not become two. cancelPass() is asked — through the seam, because a finished pass has no
    card and therefore no button — to remove an entry that has already been RETURNED. It has to
    refuse, and the array has to come back byte-identical.

    Asked twice, and the second is the one that would catch a cancel written to take an id: once by
    the student whose pass this section just returned, and once with the finished entry's own id
    passed as the student, which is the shape a "cancel by id" implementation would accept.
  */
  const gated = await evalJs(`(async function(){
    var s = window.planbook.store, p = window.planbook.passes;
    var before = JSON.stringify(s.getDoc().passes);
    var out = { before: before, byStudent: null, byId: null };
    s.update(function(d){ out.byStudent = p.cancelPass(d, ${JSON.stringify(passClass)},
      ${JSON.stringify(outC)}); });
    s.update(function(d){ out.byId = p.cancelPass(d, ${JSON.stringify(passClass)},
      ${JSON.stringify(entryC.id)}); });
    await s.flush();
    out.after = JSON.stringify(s.getDoc().passes);
    out.open = s.getDoc().openPasses.length;
    return out; })()`);
  check('cancelPass() refuses a pass that has already been returned: the one exception to append-only does not become two',
    gated.byStudent === null && gated.byId === null
      && gated.after === gated.before
      && gated.after.indexOf('walked down to the office') >= 0
      && gated.open === 1,
    'it returned ' + JSON.stringify(gated.byStudent) + ' for the student and '
      + JSON.stringify(gated.byId) + ' for the finished entry\'s own id; the log is '
      + (gated.after === gated.before ? 'byte-identical' : 'DIFFERENT') + ' and still holds '
      + 'the returned trip with its note');

  /* And the banner goes away entirely when this class has nobody out — the last clause of
     acceptance line 8, asserted by emptying the room rather than by starting from an empty one. */
  await clickSel('[data-pass-cancel="' + outF + '"]');
  const emptyRoom = await read();
  check('the banner disappears entirely when the class on screen has nobody out',
    emptyRoom.openPasses.length === 0 && emptyRoom.passBanner.shown === false
      && emptyRoom.passBanner.cards.length === 0 && emptyRoom.passBanner.label === ''
      && emptyRoom.passLogJson === returnedE.passLogJson
      && emptyRoom.rows.every((r) => r.pass && !r.pass.out && r.pass.off === 0),
    emptyRoom.openPasses.length + ' open pass(es), banner shown = '
      + emptyRoom.passBanner.shown + ' with ' + emptyRoom.passBanner.cards.length
      + ' card(s), and the log unchanged by the last cancel = '
      + (emptyRoom.passLogJson === returnedE.passLogJson));

  /* Two back out, which is the state the section is required to hand on — see below. */
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="bathroom"]');
  await clickSel('[data-pass-issue="' + outC + '"][data-pass-type="nurse"]');

  /* Handed back the way the section before this one left it: the overflow sweep at the bottom
     measures the term nav of whatever class is open, and this section has been walking across
     five of them.

     TWO PASSES ARE LEFT OPEN ON PURPOSE. The coarse sweep below opens the class with the biggest
     roster — this one — and measures every control on it, so leaving one row showing a Return
     button and the rest showing three issue buttons is what puts both shapes of this column under
     the 44px measurement. A run that tidied them away would measure the empty case only.

     SINCE WO-2.11 IT PUTS THE BANNER UNDER IT TOO, which is where that work order's 44px obligation
     is actually measured: two open passes mean two cards on screen, and the sweep below reads every
     button and input inside `#classView` — the card's Return, its Cancel and its note field among
     them. That is the reason this hand-off is worth two lines of comment rather than one. */
  /*
    ────────────── WO-2.3: days off & pre-drops, read by the registry and never copied into it ──────

    Five acceptance lines, and four of them are about what is NOT in the document — so every check
    below carries `attJson`, `doc.attendance` serialised byte for byte, beside whatever it is
    asserting. A build that copied the event onto records would pass every visible claim here: the
    columns would go grey, the cards would say "No school", and the only thing that would give it
    away is the array this section keeps comparing to itself.

    THE EVENTS ARE AUTHORED THROUGH THE REAL FORM, on the real panel, opened from both of its doors —
    the home screen's own button and the 📅 that appears in a covered column's head. The seam is
    used to READ, as everywhere else in this section: what stateOf() says about a class on a date,
    and what src/calendar.js says covers it. A second copy of the covering rule in this file could
    agree with itself perfectly and disagree with the app, which is the failure the one-function
    design exists to prevent.

    THE FIXTURE IS A WINDOW OF PAST WEEKDAYS THIS RUN HAS NOT TOUCHED, and the first check asserts
    that it has not — an empty range is the precondition for "every class shows as not-meeting", and
    an assertion made over dates that already held records would be measuring the history rule
    instead and passing for the wrong reason.

    THE RANGE IS FIVE OF THAT WINDOW'S SIX WEEKDAYS, AND THE SIXTH IS DROPPED BY HAND FIRST. Two
    reasons, both of them about a check that could otherwise pass for the wrong reason. A range that
    covered the whole window would go green against a build whose covering test ignored the dates
    entirely, so the day just outside it is what proves a range is a range. And the sixth column is
    DROPPED rather than left empty because a covered day and a dropped day are the two quiet greys
    in this palette — the pair a refactor collapses into one by accident — and the only way to
    measure that they are still two is to have one of each on screen at the same time.
  */
  const offWeek = nodeColumns(6, 1);            /* the six weekdays before this week's six */
  const offEdge = offWeek[offWeek.length - 1];  /* nodeColumns is most-recent-first: the oldest */
  const offRange = offWeek.slice(0, offWeek.length - 1);
  const offFrom = offRange[offRange.length - 1];
  const offTo = offRange[0];
  /* A future date for the pre-drop, because "a FUTURE dropped event" is the acceptance line's own
     word. It is asked of the PREDICATE here rather than of the screen — which was once because the
     registry had no column after today, and since 2026-08-08 is because stateOf() is the thing this
     acceptance line is about. The screen's own answer about a future day is measured in the punch
     list at the end of this section. */
  const preDropDay = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    const p = (x) => (x < 10 ? '0' : '') + x;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  })();

  /* stateOf() for every active class over a list of dates, in one round trip. Asked of the app's
     own predicate — the point of the whole work order is that there is exactly one of them. */
  const statesOver = (dates) => evalJs('(async function(){ await window.planbook.store.flush();'
    + ' var a = window.planbook.attendance, doc = window.planbook.store.getDoc();'
    + ' var ids = doc.classes.filter(function(c){ return !c.archived; }).map(function(c){ return c.id; });'
    + ' var out = {};'
    + ' ' + JSON.stringify(dates) + '.forEach(function(d){'
    + '   out[d] = ids.map(function(id){ return a.stateOf(id, d); }); });'
    + ' return { ids: ids, states: out }; })()');

  /* The form, filled and submitted the way a teacher fills and submits it. The two date fields are
     set by value rather than typed: `Input.dispatchKeyEvent` into a native date picker types into
     whichever segment happens to be focused, and what this section is testing is not the picker. */
  const fillDayOff = async (kind, title, from, to, classIds) => {
    if (kind === 'dropped') await clickSel('#daysOffModal [data-dayoff-kind="dropped"]');
    else await clickSel('#daysOffModal [data-dayoff-kind="no-school"]');
    /* Everything already chosen is tapped OFF first. The panel keeps its selection between opens —
       a teacher entering three drops for the same two classes should not re-pick them each time —
       so a fill that only tapped what it wanted would toggle a leftover choice back off and quietly
       author a different event than the one this check is about. */
    const active = await evalJs('Array.prototype.slice.call('
      + 'document.querySelectorAll("#daysOffClassPicker .toggle-btn.active"))'
      + '.map(function(b){ return b.getAttribute("data-dayoff-class"); })');
    for (const id of active) await clickSel('#daysOffClassPicker [data-dayoff-class="' + id + '"]');
    for (const id of (classIds || [])) {
      await clickSel('#daysOffClassPicker [data-dayoff-class="' + id + '"]');
    }
    await evalJs('(function(){ document.getElementById("daysOffTitle").value = '
      + JSON.stringify(title) + ';'
      + ' document.getElementById("daysOffFrom").value = ' + JSON.stringify(from) + ';'
      + ' document.getElementById("daysOffTo").value = ' + JSON.stringify(to || '') + ';'
      + ' return 1; })()');
    await clickSel('#daysOffModal [data-dayoff-create] button[type="submit"]');
  };
  /* What the panel is showing: which overlays are up, and every row on the calendar list. */
  const dayOffPanel = () => evalJs(`(function(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('#daysOffList .roster-row'));
    return {
      open: !document.getElementById('daysOffModal').classList.contains('hidden'),
      confirm: !document.getElementById('daysOffConfirmModal').classList.contains('hidden'),
      confirmLead: (document.getElementById('daysOffConfirmLead') || {}).textContent || '',
      confirmFacts: Array.prototype.slice.call(
        document.querySelectorAll('#daysOffConfirmFacts .dayoff-keeps-line'))
        .map(function(e){ return (e.textContent || '').trim(); }),
      error: (function(){ var e = document.getElementById('daysOffError');
        return e && !e.classList.contains('hidden') ? (e.textContent || '').trim() : ''; })(),
      pickerShown: !document.getElementById('daysOffClasses').classList.contains('hidden'),
      rows: rows.map(function(r){
        var rm = r.querySelector('[data-dayoff-remove]');
        return { badge: ((r.querySelector('.dayoff-kind') || {}).textContent || '').trim(),
                 name: ((r.querySelector('.roster-row-name') || {}).textContent || '').trim(),
                 scope: ((r.querySelector('.roster-row-note') || {}).textContent || '').trim(),
                 id: rm ? rm.getAttribute('data-dayoff-remove') : '' }; })
    }; })()`);

  /* The neighbour column, dropped through the controls a teacher uses: unlock the past day, tap
     "Didn't meet" in the action row it retargets, lock it again. This is the ONLY write this
     sub-section makes to `attendance`, it is made before the baseline is taken, and everything
     after it is measured against a document that already holds it. */
  await closeAll();
  await openCard(marking);
  await clickSel('[data-attendance-page="earlier"]');
  await clickSel('[data-attendance-edit="' + offEdge + '"]');
  await clickSel('#attendanceActions [data-attendance-drop]');
  await clickSel('[data-attendance-lock]');
  await goHome();

  const beforeEvents = await read();
  const emptyRange = beforeEvents.records.filter((r) => r.date >= offFrom && r.date <= offTo);
  const edgeRecord = beforeEvents.records.filter((r) => r.date === offEdge
    && r.classId === marking)[0] || null;
  check('WO-2.3 fixture: the week this section is about to close holds no attendance, and the day just outside the range is dropped so the two greys can be told apart',
    emptyRange.length === 0 && beforeEvents.events.length === 0
      && !!edgeRecord && edgeRecord.exception === 'dropped',
    offFrom + ' .. ' + offTo + ' holds ' + emptyRange.length + ' record(s); '
      + offEdge + ' holds ' + JSON.stringify(edgeRecord)
      + '; the document holds ' + beforeEvents.events.length + ' event(s) and '
      + beforeEvents.records.length + ' attendance record(s) in total');

  /* ── acceptance line 1: a no-school range across a week closes every class on every date in it ── */

  await clickSel('#homeView [data-dayoff-panel]');
  const panelOpen = await dayOffPanel();
  await fillDayOff('no-school', 'Winter break', offFrom, offTo, []);
  const afterRange = await read();
  const rangeStates = await statesOver(offWeek);
  const madeEvent = afterRange.events[0] || {};
  check('a no-school range authored across a week shows every class as not-meeting on every date in it — one event, not thirty',
    panelOpen.open === true && panelOpen.pickerShown === false
      && afterRange.events.length === 1
      && madeEvent.kind === 'no-school' && madeEvent.title === 'Winter break'
      && madeEvent.date === offFrom && madeEvent.endDate === offTo && madeEvent.classIds === ''
      && madeEvent.keys === 'classIds,date,endDate,id,kind,notes,studentId,title'
      && offRange.every((d) => rangeStates.states[d].length === 6
        && rangeStates.states[d].every((s) => s === 'covered'))
      /* And the weekday one day outside the range is untouched by it: five classes still not taken
         there, and the sixth still holding the drop this section made. A covering test that ignored
         its own dates would go green on the clause above and red on this one. */
      && rangeStates.states[offEdge].filter((s) => s === 'not-taken').length === 5
      && rangeStates.states[offEdge].filter((s) => s === 'dropped').length === 1,
    'one event ' + JSON.stringify(madeEvent) + ' covering '
      + offRange.length + ' weekday(s) × ' + rangeStates.ids.length + ' class(es); states = '
      + JSON.stringify(rangeStates.states));

  /* ── acceptance line 5, first of four askings: authoring wrote nothing into `attendance` ── */

  check('authoring that range created no attendance record — the array is byte-identical to what it was',
    afterRange.attJson === beforeEvents.attJson
      && afterRange.records.length === beforeEvents.records.length,
    'the attendance array is ' + (afterRange.attJson === beforeEvents.attJson ? 'byte-identical'
      : 'DIFFERENT') + ' across the write; ' + beforeEvents.records.length + ' record(s) before, '
      + afterRange.records.length + ' after, and ' + afterRange.events.length + ' event(s) now');

  /* ── and the registry says so, in the column head and in the cells under it ── */

  await closeAll();
  await openCard(marking);
  await clickSel('[data-attendance-page="earlier"]');
  const coveredCols = await read();
  await park();
  const coveredLook = await evalJs('window.__colLook(' + JSON.stringify(offTo) + ')');
  const dropLook = await evalJs('window.__colLook(' + JSON.stringify(offEdge) + ')');
  const inRange = coveredCols.columns.filter((c) => c.date !== offEdge);
  const outside = coveredCols.columns.filter((c) => c.date === offEdge)[0] || {};
  check('the covered week draws as not-meeting on the grid: the fourth word in every column head, and a dash in every cell under it',
    coveredCols.columns.length === 6 && inRange.length === 5
      && inRange.every((c) => c.chip === 'No school')
      && inRange.every((c) => / attendance-col-covered\b/.test(c.cls))
      /* The one control on a covered head is the door to the screen the reason was authored on —
         not an undo, because removing a holiday is not one class's decision to take. */
      && inRange.every((c) => c.btnText === '📅' && c.btn === '')
      /* And the day outside the range still says the OTHER quiet word, with its own control. */
      && outside.chip === 'Didn’t meet' && outside.btnText === '✏️'
      && coveredCols.rows.length > 0
      /* Every glyph in every row is the dash, on all six columns: five covered and one dropped, no
         letter and no question mark anywhere. Tested by exclusion rather than against a literal —
         the en dash is one paste away from being an em dash in this file and not in the app. */
      && coveredCols.rows.every((r) => r.codes.length === 6
        && r.codes.split('').every((g) => g !== '?' && !/[A-Za-z]/.test(g))),
    'chips ' + JSON.stringify(coveredCols.columns.map((c) => c.chip))
      + ', head buttons ' + JSON.stringify(coveredCols.columns.map((c) => c.btnText))
      + ', first row reads ' + JSON.stringify((coveredCols.rows[0] || {}).codes));

  /* And it is a DIFFERENT picture from a dropped column, which is the whole reason the state is a
     fourth rather than a re-use of the third. Measured rather than declared, on two columns side by
     side on one screen: the two are quiet greys and what separates them is a word, a fill and a
     border-style — exactly the kind of distinction a refactor collapses by accident and a
     stylesheet review calls identical. */
  check('a covered column and a dropped column, side by side, are drawn as two different things rather than one grey',
    !!coveredLook && !!dropLook
      && coveredLook.chip === 'No school' && dropLook.chip === 'Didn’t meet'
      && coveredLook.cellStyle === 'solid' && dropLook.cellStyle === 'dashed'
      && coveredLook.glyph === dropLook.glyph
      && coveredLook.cellBg !== dropLook.cellBg
      && coveredLook.headBg !== dropLook.headBg,
    'covered = ' + JSON.stringify(coveredLook) + '; dropped = ' + JSON.stringify(dropLook));

  /* ── acceptance line 2: delete the event and every one of those days is back to "not taken yet" ── */

  await clickSel('#attendanceHead [data-dayoff-panel]');
  const listed = await dayOffPanel();
  await clickSel('#daysOffList [data-dayoff-remove="' + madeEvent.id + '"]');
  const afterDelete = await read();
  const restored = await statesOver(offWeek);
  check('deleting that event puts all five days back to "not taken yet" — and not one attendance record was touched on the way in or out',
    listed.open === true && listed.rows.length === 1
      && listed.rows[0].badge === 'No school' && listed.rows[0].scope === 'Every class'
      && afterDelete.events.length === 0
      && offRange.every((d) => restored.states[d].every((s) => s === 'not-taken'))
      /* The dropped day is untouched by the deletion too: it was never the event's to restore, and
         a build that had copied the holiday onto records would most likely have overwritten it. */
      && restored.states[offEdge].filter((s) => s === 'dropped').length === 1
      && afterDelete.attJson === beforeEvents.attJson,
    'the panel listed ' + JSON.stringify(listed.rows) + '; after the Remove the document holds '
      + afterDelete.events.length + ' event(s), the states are ' + JSON.stringify(restored.states)
      + ', and the attendance array is '
      + (afterDelete.attJson === beforeEvents.attJson ? 'byte-identical' : 'DIFFERENT'));

  /* ── acceptance line 3: a future pre-drop naming two classes touches only those two ── */

  const twoClasses = [ids[1], ids[3]];
  await fillDayOff('dropped', 'Fall assembly', preDropDay, '', twoClasses);
  const afterDrop = await read();
  const dropStates = await statesOver([preDropDay]);
  const dropEvent = afterDrop.events[0] || {};
  const covered = dropStates.states[preDropDay]
    .map((s, i) => (s === 'covered' ? dropStates.ids[i] : null)).filter(Boolean);
  check('a future dropped event naming two classes affects only those two — and the other four are untouched',
    afterDrop.events.length === 1 && dropEvent.kind === 'dropped'
      && dropEvent.date === preDropDay && dropEvent.endDate === preDropDay
      && dropEvent.classIds === twoClasses.join(',')
      && covered.join(',') === twoClasses.join(',')
      && dropStates.states[preDropDay].filter((s) => s === 'not-taken').length === 4
      /* Authoring on a FUTURE date is the point of this work order, and it must not have gone
         anywhere near the gate that refuses attendance writes after today. */
      && afterDrop.attJson === beforeEvents.attJson,
    'the event is ' + JSON.stringify(dropEvent) + ' on ' + preDropDay + ' (today is ' + nodeToday
      + '); states across ' + dropStates.ids.length + ' class(es) = '
      + JSON.stringify(dropStates.states[preDropDay]) + ', covered = ' + JSON.stringify(covered)
      + '; attendance byte-identical = ' + (afterDrop.attJson === beforeEvents.attJson));

  /* And the form refuses a drop that names nobody, rather than writing a school-wide one under the
     wrong kind — a `dropped` with empty classIds is school-wide by the data model, which is the
     silent wrong thing this refusal exists to stop. */
  await fillDayOff('dropped', 'Nobody named', preDropDay, '', []);
  const refused = await dayOffPanel();
  const afterRefusal = await read();
  check('a planned drop that names no class is refused rather than written as a school-wide one',
    refused.error !== '' && /which classes/i.test(refused.error)
      && afterRefusal.events.length === 1
      && afterRefusal.attJson === beforeEvents.attJson,
    'the panel said ' + JSON.stringify(refused.error) + ' and the document still holds '
      + afterRefusal.events.length + ' event(s)');

  /* ── acceptance line 4: a retroactive snow day over a day that was really taught ── */

  const taughtToday = beforeEvents.today.filter((r) => !r.exception).map((r) => r.classId);
  /* A class that dropped today from its OWN record, which is precedence line two rather than line
     three: it did not meet, and the reason is the ledger's rather than the calendar's, so laying a
     snow day over it must leave it reading "dropped" and not "covered". Counted here so the check
     below is arithmetic over three groups rather than two. */
  const droppedToday = beforeEvents.today.filter((r) => r.exception).map((r) => r.classId);
  await fillDayOff('no-school', 'Snow day', nodeToday, '', []);
  const warned = await dayOffPanel();
  const duringWarning = await read();
  check('a retroactive snow day over a day that already has recorded attendance WARNS, and has written nothing yet',
    warned.confirm === true
      && warned.confirmFacts.length === taughtToday.length && taughtToday.length > 0
      && /stay/i.test(warned.confirmLead)
      && duringWarning.events.length === 1
      && duringWarning.attJson === beforeEvents.attJson,
    'the confirm named ' + warned.confirmFacts.length + ' period(s) '
      + JSON.stringify(warned.confirmFacts) + ' against ' + taughtToday.length
      + ' recorded today; lead = ' + JSON.stringify(warned.confirmLead.slice(0, 120))
      + '; events in the document while the warning is up = ' + duringWarning.events.length);

  /* Cancel first, because "warns" is only half of it: a warning the teacher backs out of has to
     leave the document exactly as it was, event and all. */
  await clickSel('#daysOffConfirmModal [data-dayoff-cancel]');
  const backedOut = await read();
  check('backing out of that warning writes nothing at all — no event, no record',
    backedOut.events.length === 1 && backedOut.events[0].title === 'Fall assembly'
      && backedOut.attJson === beforeEvents.attJson,
    'the document holds ' + backedOut.events.length + ' event(s) '
      + JSON.stringify(backedOut.events.map((e) => e.title)) + ' and the attendance array is '
      + (backedOut.attJson === beforeEvents.attJson ? 'byte-identical' : 'DIFFERENT'));

  /* And now through it, which is the acceptance line proper: the marks are still there afterward. */
  await fillDayOff('no-school', 'Snow day', nodeToday, '', []);
  await clickSel('#daysOffConfirmModal [data-dayoff-confirm]');
  const snowed = await read();
  const snowStates = await statesOver([nodeToday]);
  const stillTaken = snowStates.states[nodeToday]
    .map((s, i) => (s === 'taken' ? snowStates.ids[i] : null)).filter(Boolean);
  check('adding the snow day anyway does NOT void the record: every period that was taught is still taken, and every mark is still on it',
    snowed.events.length === 2
      && snowed.attJson === beforeEvents.attJson
      && stillTaken.slice().sort().join(',') === taughtToday.slice().sort().join(',')
      /* The three groups, and the arithmetic over them is the precedence rule in full. A class with
         a record and no exception stays TAKEN; a class that dropped today from its own record stays
         DROPPED, because the ledger answers before the calendar does; and only the classes with
         nothing recorded at all are the ones the snow day closes. That last count is what makes the
         clause above non-vacuous — without it, a build that ignored the event entirely would pass. */
      && snowStates.states[nodeToday].filter((s) => s === 'dropped').length === droppedToday.length
      && snowStates.states[nodeToday].filter((s) => s === 'covered').length
        === snowStates.ids.length - taughtToday.length - droppedToday.length
      && snowStates.ids.length - taughtToday.length - droppedToday.length > 0,
    'today reads ' + JSON.stringify(snowStates.states[nodeToday]) + ' across '
      + snowStates.ids.length + ' class(es): ' + stillTaken.length + ' still taken ('
      + JSON.stringify(taughtToday) + '), ' + droppedToday.length
      + ' dropped from their own record, and the attendance array is '
      + (snowed.attJson === beforeEvents.attJson ? 'byte-identical' : 'DIFFERENT'));

  /* ── acceptance line 5, asked of the whole run rather than of one write ── */

  await clickSel('#daysOffList [data-dayoff-remove="' + snowed.events[1].id + '"]');
  await clickSel('#daysOffList [data-dayoff-remove="' + dropEvent.id + '"]');
  const cleared = await read();
  const clearedStates = await statesOver([nodeToday, preDropDay].concat(offWeek));
  check('across every event this section authored, confirmed, cancelled and removed, not one attendance record was created, changed or destroyed',
    cleared.events.length === 0
      && cleared.attJson === beforeEvents.attJson
      && cleared.records.length === beforeEvents.records.length
      /* And the whole document is back where it started — the days the events covered answer with
         their own records again, or with "not taken yet" where there never was one. */
      && offRange.every((d) => clearedStates.states[d].every((s) => s === 'not-taken'))
      && clearedStates.states[preDropDay].every((s) => s === 'not-taken')
      && clearedStates.states[nodeToday]
        .map((s, i) => (s === 'taken' ? clearedStates.ids[i] : null)).filter(Boolean)
        .slice().sort().join(',') === taughtToday.slice().sort().join(','),
    beforeEvents.records.length + ' record(s) before and ' + cleared.records.length
      + ' after, byte-identical = ' + (cleared.attJson === beforeEvents.attJson)
      + '; ' + cleared.events.length + ' event(s) left; today reads '
      + JSON.stringify(clearedStates.states[nodeToday]));

  /*
    ────────── THE 2026-08-08 PUNCH LIST: what the first iPad sitting sent back ──────────

    WO-2.3 passed its five acceptance lines above and then met a classroom, which found five things
    none of them covered. Three are measured here; the other two are a stylesheet rule and a focus
    call, measured where they live (the coarse block below, and the form check in this one).

    The largest is the one this sub-section is mostly about. Days off could be SET ahead and not
    LOOKED at ahead — the window ended at today — so a teacher who entered Thanksgiving in September
    had no way to go and see that she had entered it right. The registry now pages forward as far as
    the calendar reaches, and the three claims worth holding are that it goes far enough, that it
    stops somewhere honest, and that going there still writes nothing. The third is the one that
    would be easy to lose: opening up the columns is a rendering change, and the whole reason it was
    safe to make is that the refusal to write tomorrow lives in the writer.
  */

  const aheadDay = nodeWeekdayAhead(4);

  /* One page-side read of the grid AND the pager AND the action row, for the reason every other
     reader in this file is one round trip: three reads taken a paint apart can disagree with each
     other and the check cannot tell which one was wrong. */
  const gridAhead = () => evalJs(`(function(){
    function colOf(th){
      var date = th.getAttribute('data-attendance-col');
      var btn = th.querySelector('button');
      var td = document.querySelector('#attendanceBody td[data-attendance-col="' + date + '"]');
      var cell = td ? td.firstElementChild : null;
      return { date: date,
               chip: ((th.querySelector('.attendance-day-state') || {}).textContent || '').trim(),
               future: th.className.indexOf('attendance-col-future') >= 0,
               covered: th.className.indexOf('attendance-col-covered') >= 0,
               btn: btn ? (btn.hasAttribute('data-dayoff-panel') ? 'dayoff'
                 : btn.hasAttribute('data-attendance-edit') ? 'edit' : 'other') : 'none',
               cellTag: cell ? cell.tagName : '',
               cellFuture: cell ? cell.className.indexOf('attendance-cell-future') >= 0 : false,
               cellGlyph: cell ? (cell.textContent || '').trim() : '' };
    }
    var later = Array.prototype.slice.call(document.querySelectorAll('#attendancePager button'))
      .filter(function(b){ return b.getAttribute('data-attendance-page') === 'later'; })[0];
    return {
      columns: Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead th[data-attendance-col]')).map(colOf),
      later: later ? { disabled: !!later.disabled, title: later.title || '' } : null,
      doors: document.querySelectorAll('#attendanceActions [data-dayoff-panel]').length,
      actions: Array.prototype.slice.call(
        document.querySelectorAll('#attendanceActions button'))
        .map(function(b){ return (b.textContent || '').trim(); })
    }; })()`);

  await closeAll();
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + marking + '"]');
  await clickSel('[data-attendance-page="today"]');

  /* ── the door, on a day with nothing special about it ── */

  const doorOnPlainDay = await gridAhead();
  check('the way to the calendar is on the class screen itself, on an ordinary day, past the controls that write',
    doorOnPlainDay.doors === 1
      && doorOnPlainDay.actions[doorOnPlainDay.actions.length - 1].indexOf('Days off') >= 0
      /* Last in the row, which is the half that keeps the three-control rule true: it is not one of
         the controls a teacher aims at with a class walking in, so it must not sit among them. */
      && doorOnPlainDay.actions.filter((t) => t.indexOf('Days off') >= 0).length === 1,
    'the action row reads ' + JSON.stringify(doorOnPlainDay.actions));

  /* ── the form empties itself, and does not summon the keyboard over the list it just changed ── */

  const beforeAhead = await read();
  await goHome();
  await clickSel('#homeView [data-dayoff-panel]');
  await fillDayOff('no-school', 'Teacher institute day', aheadDay, '', []);
  const formAfterAdd = await evalJs(`(function(){
    var a = document.activeElement;
    return { from: document.getElementById('daysOffFrom').value,
             to: document.getElementById('daysOffTo').value,
             title: document.getElementById('daysOffTitle').value,
             focusId: a ? (a.id || '') : '',
             focusTag: a ? a.tagName : '',
             focusType: a ? (a.getAttribute('type') || '') : '',
             rows: document.querySelectorAll('#daysOffList .roster-row').length }; })()`);
  check('after an add the whole form is empty and focus is on a button, not back in a text field where the keyboard would cover the list',
    formAfterAdd.from === '' && formAfterAdd.to === '' && formAfterAdd.title === ''
      && formAfterAdd.focusId !== 'daysOffTitle'
      && formAfterAdd.focusTag === 'BUTTON'
      && formAfterAdd.rows >= 1,
    'the form reads ' + JSON.stringify([formAfterAdd.title, formAfterAdd.from, formAfterAdd.to])
      + ', focus is on ' + formAfterAdd.focusTag + '#' + formAfterAdd.focusId
      + ', and the list below it shows ' + formAfterAdd.rows + ' row(s)');

  /* And the other half of the same complaint: a range is two fields, and the second one is almost
     always the first one. Dispatched as a real `change`, because that is the event a native date
     picker fires and the hook is deliberately not on `input` (src/days-off.js says why). */
  const carried = await evalJs(`(function(){
    var from = document.getElementById('daysOffFrom');
    var to = document.getElementById('daysOffTo');
    from.value = ${JSON.stringify(aheadDay)};
    from.dispatchEvent(new Event('change', { bubbles: true }));
    var filled = to.value;
    to.value = ${JSON.stringify(nodeWeekdayAhead(6))};
    from.value = ${JSON.stringify(aheadDay)};
    from.dispatchEvent(new Event('change', { bubbles: true }));
    return { filled: filled, kept: to.value }; })()`);
  check('picking a start date carries the end date with it, and never overwrites an end date the teacher set herself',
    carried.filled === aheadDay && carried.kept === nodeWeekdayAhead(6),
    'an empty To became ' + JSON.stringify(carried.filled) + ' (start was ' + aheadDay
      + '); a To already set to ' + nodeWeekdayAhead(6) + ' stayed ' + JSON.stringify(carried.kept));

  await closeAll();
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + marking + '"]');
  await clickSel('[data-attendance-page="today"]');

  /* ── forward, to the day that is on the calendar ── */

  const atToday = await gridAhead();
  let hops = 0;
  let ahead = atToday;
  while (hops < 8 && !ahead.columns.some((c) => c.date === aheadDay)) {
    if (ahead.later && ahead.later.disabled) break;
    await clickSel('[data-attendance-page="later"]');
    ahead = await gridAhead();
    hops += 1;
  }
  const aheadCol = ahead.columns.filter((c) => c.date === aheadDay)[0] || null;
  /* A future weekday with nothing on it, taken off the same window, so the two future treatments
     are measured against each other rather than one at a time. */
  const plainAhead = ahead.columns.filter((c) => c.future && c.date !== aheadDay)[0] || null;

  check('a day off set for next week can be paged forward to and read on the registry — the reason the columns were opened up at all',
    atToday.later && atToday.later.disabled === false
      && !!aheadCol && aheadCol.covered === true && aheadCol.future === true
      && aheadCol.chip.length > 0 && aheadCol.btn === 'dayoff',
    'Later at today: ' + JSON.stringify(atToday.later) + '; ' + hops + ' tap(s) later the window is '
      + JSON.stringify(ahead.columns.map((c) => c.date)) + ' and ' + aheadDay + ' reads '
      + JSON.stringify(aheadCol));

  check('an ordinary day ahead of today says "Ahead" rather than "Not taken", carries no unlock, and its cells are inert',
    !!plainAhead && plainAhead.chip === 'Ahead' && plainAhead.btn === 'none'
      && plainAhead.cellTag === 'SPAN' && plainAhead.cellFuture === true
      /* Not the `?` an untaken past day wears. That glyph and that amber together are this screen's
         one alarm, and a day that has not happened is not something anybody forgot. */
      && plainAhead.cellGlyph !== '?',
    plainAhead ? JSON.stringify(plainAhead) : 'no plain future column in the window '
      + JSON.stringify(ahead.columns.map((c) => c.date + ' ' + c.chip)));

  /* ── and it stops where the calendar does ── */

  let guard = 0;
  let edge = ahead;
  while (guard < 12 && edge.later && !edge.later.disabled) {
    await clickSel('[data-attendance-page="later"]');
    edge = await gridAhead();
    guard += 1;
  }
  check('paging forward stops at the last thing on the calendar and says so, rather than running on into empty weeks forever',
    !!edge.later && edge.later.disabled === true
      && /as far ahead as the calendar goes/i.test(edge.later.title)
      && edge.columns.some((c) => c.date >= aheadDay),
    'after ' + (hops + guard) + ' forward tap(s) the window is '
      + JSON.stringify(edge.columns.map((c) => c.date)) + ' and Later reads '
      + JSON.stringify(edge.later));

  /*
    ── AND PORTRAIT STILL DOES NOT PAGE, WITH SOMETHING AHEAD ON THE CALENDAR ──

    A regression this section shipped and caught within the hour, worth a check of its own because
    of the shape of it. `Later` was disabled by ONE test — "are you at the forward end" — and that
    test used to mean "are you on today", which portrait always is. Once the forward end could be a
    day off next week, portrait's pinned position stopped being the end, and the button lit up on
    the one screen that refuses to page: live, tappable, and thrown away by pageDays().

    So the fixture matters. The WO-2.12 section already asks this question and CANNOT catch it —
    it runs after every event has been removed, where the old test and the new one agree. This one
    asks it with a day off four weekdays out, which is the only state the two answers differ in.
  */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
  /* Longer than the app's own settle delay, for the reason the WO-2.12 turns give: its last look
     after a turn is at 400ms, and reading at 300 would be timing the wait rather than the app. */
  await new Promise(r => setTimeout(r, 700));
  const upright = await gridAhead();
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 700));

  check('turning upright with a day off still ahead on the calendar leaves Later disabled — portrait does not page, and the forward end is no longer the same question as "are you on today"',
    upright.columns.length === 1
      && !!upright.later && upright.later.disabled === true
      && /portrait/i.test(upright.later.title),
    'portrait drew ' + JSON.stringify(upright.columns.map((c) => c.date))
      + ' and Later reads ' + JSON.stringify(upright.later));

  /* ── acceptance line 5 again, asked of the surface that did not exist when it was written ── */

  const afterAhead = await read();
  check('reading a week that has not happened yet wrote nothing — the columns opened up, the writer did not',
    afterAhead.attJson === beforeAhead.attJson
      && afterAhead.records.length === beforeAhead.records.length,
    beforeAhead.records.length + ' record(s) before the forward paging and '
      + afterAhead.records.length + ' after, byte-identical = '
      + (afterAhead.attJson === beforeAhead.attJson));

  /* And with the event gone, the forward stop goes back to today — the behaviour of every year that
     has nothing scheduled in it, which is what this screen did before the change. */
  /* Reached from the HOME screen rather than from the 📅 in the covered column head, and that is a
     consequence of the portrait detour above rather than a preference: turning upright pins the
     position to today, and landscape comes back on the week ending today rather than where the
     screen was before the turn (WO-2.12's documented cost). So the covered column is off screen by
     the time this runs, and the 📅 with it. The home door is the orientation-independent one. */
  await goHome();
  await clickSel('#homeView [data-dayoff-panel]');
  const madeAhead = (await read()).events.filter((e) => e.title === 'Teacher institute day')[0];
  await clickSel('#daysOffList [data-dayoff-remove="' + madeAhead.id + '"]');
  await closeAll();
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + marking + '"]');
  await clickSel('[data-attendance-page="today"]');
  const backAtToday = await gridAhead();
  check('with nothing on the calendar the window ends at today again, and Later goes back to saying tomorrow is not something to record',
    !!backAtToday.later && backAtToday.later.disabled === true
      && /tomorrow/i.test(backAtToday.later.title)
      && backAtToday.columns.every((c) => c.future === false),
    'the window is ' + JSON.stringify(backAtToday.columns.map((c) => c.date))
      + ' and Later reads ' + JSON.stringify(backAtToday.later));

  await send('Emulation.clearDeviceMetricsOverride');
  await closeAll();
  await clickSel('[data-class-tab]', 1);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
}

/* ───────────────── marking a class from the keyboard (WO-2.5) ─────────────────
 *
 * ON A FINE POINTER, ON PURPOSE. Everything below runs before the coarse block resets the device
 * metrics, because the keyboard path is the LAPTOP's — since 2026-08-08 that is the device of
 * record, and this is how a live class gets marked while it walks in.
 *
 * THE CLAIM IS NOT "THE KEYS WORK", IT IS "ONE KEYSTROKE PER STUDENT". So the walk below dispatches
 * exactly one ArrowDown and then exactly one letter per student — nothing else, no clicks between
 * them, no arrow to move on — and then compares the whole `marks` object against what those
 * keystrokes should have produced. A build where a letter marked but did not advance would pass a
 * check that pressed ↓ between letters, and it would fail the term.
 *
 * THREE OF THESE ASSERT AN ABSENCE, and each one is the failure the feature exists to prevent:
 * a letter with nothing selected writes nothing, a letter typed into the search box writes nothing,
 * and a letter with a dialog open writes nothing. Each is answered by `doc.attendance` serialised
 * BYTE FOR BYTE either side of the keystroke, the same posture the WO-2.3 block below uses, because
 * a count is kept honest by an overwrite and the defect here is a mark landing on the wrong student.
 *
 * THE CLASS IS PICKED RATHER THAN ASSUMED — the biggest roster, the way the coarse sweep below
 * picks one, because "a full class" is the acceptance line and a walk down four names would prove
 * nothing about a room of thirty. Marking every student is also what makes the comparison exact:
 * whatever was on the day before, the keys overwrite all of it.
 *
 * AND THE TWO OPEN HALL PASSES ARE STEPPED AROUND RATHER THAN CLOSED. That same class is the one
 * the pass section hands on with two students out, on purpose, so that the coarse sweep measures
 * the banner card and both shapes of the Passes column. A `D` closes an open pass
 * (src/attendance.js's setMark), so the two students who are out get `E` where the pattern would
 * have said `D` — and `openPasses` is compared byte for byte across the whole walk afterwards,
 * which turns "this section did not take the next one's fixture away" from a hope into a check.
 */

console.log('\n--- marking a class from the keyboard (WO-2.5) ---');

if (!seam) {
  skip('a full class is marked from the keyboard, one keystroke per student',
    'the window.planbook seam is not present, so nothing here could read what was written');
} else {
  /* One key, dispatched AT THE PAGE rather than at an element, which is most of the claim. A
     printable key needs `keyDown` with `text` or `e.key` arrives as the raw code; the arrows and
     Escape use the `rawKeyDown` shape the modal section above already uses. */
  const kb = async (k, code, vk, text, mods = 0) => {
    const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
      modifiers: mods };
    if (text) ev.text = text;
    await send('Input.dispatchKeyEvent',
      Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
    await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
    await new Promise(r => setTimeout(r, 55));
  };
  const kbDown = () => kb('ArrowDown', 'ArrowDown', 40);
  const kbUp = () => kb('ArrowUp', 'ArrowUp', 38);
  const kbEsc = () => kb('Escape', 'Escape', 27);
  const kbLetter = (L) => kb(L, 'Key' + L, L.charCodeAt(0), L);

  /* Flushed before every read, for tools/README.md trap 6: every save is debounced, so a read taken
     a moment after a keystroke can be looking at the document from before it. */
  const kbAtt = () => evalJs('(async function(){ await window.planbook.store.flush();'
    + ' return JSON.stringify(window.planbook.store.getDoc().attendance); })()');
  const kbRows = () => evalJs("Array.prototype.slice.call("
    + "document.querySelectorAll('#attendanceBody tr[data-attendance-row]'))"
    + ".map(function(tr){ return tr.getAttribute('data-attendance-row'); })");
  /* A letter that would CHANGE the selected student's cell, read off the document rather than
     assumed. The three "this keystroke writes nothing" checks below are answered by comparing
     `doc.attendance` either side, and setMark() refuses a no-op — so a letter that happens to be
     the mark already on that cell would leave the document byte-identical whether the guard is
     there or not. Proved the honest way: two of those three checks passed against a build with the
     guard removed until this helper existed. */
  const kbChangingLetter = async () => evalJs(`(function(){
    var id = window.planbook.attendance.selectedStudent();
    if (!id) return 'A';
    var doc = window.planbook.store.getDoc();
    var cls = window.planbook.classes.getSelectedClassId();
    var day = window.planbook.attendance.todayISO();
    var rec = (doc.attendance || []).filter(function(r){
      return r.classId === cls && r.date === day; })[0];
    var cell = rec && rec.marks ? rec.marks[id] : null;
    var code = cell && cell.code ? cell.code : 'P';
    return code === 'A' ? 'E' : 'A'; })()`);
  /* Where the browser's focus actually is, said in the terms acceptance line 3 is written in.
     `:focus-visible` is asked of the element rather than inferred from a stylesheet rule, because
     the rule being present and the ring being drawn are two different facts — and it is the second
     one the style guide's global rule is about. */
  const kbFocus = () => evalJs(`(function(){ var a = document.activeElement;
    if (!a || a === document.body) return { on: 'body' };
    return { on: a.tagName + '.' + (a.className || ''),
             student: a.getAttribute ? (a.getAttribute('data-attendance-cell') || '') : '',
             date: a.getAttribute ? (a.getAttribute('data-attendance-date') || '') : '',
             ring: a.matches ? a.matches(':focus-visible') : null,
             outline: getComputedStyle(a).outlineWidth + ' ' + getComputedStyle(a).outlineColor };
    })()`);

  await evalJs("window.planbook.closeModal('attendanceKeysModal');1");
  const kbPick = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var best = null, n = -1;
    doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c; } });
    if (!best) return null;
    return { id: best.id, name: best.name, students: n,
             out: (doc.openPasses || []).filter(function(p){ return p && p.classId === best.id; })
               .map(function(p){ return p.studentId; }) }; })()`);

  if (!kbPick || kbPick.students < 20) {
    check('a class with a roster worth walking down was found for the keyboard pass', false,
      'picked = ' + JSON.stringify(kbPick) + ' — under twenty students is not "a full class", and '
        + 'a short walk would not tell an advancing selection from a stationary one');
  } else {
    /*
      ── AND THE GRID IS REACHED WITHOUT A MOUSE EITHER ──

      "Without touching the mouse" has to include getting to the class, or the acceptance line is
      only about the half of the job that happens once you are already there. So the harness puts
      itself on the home screen — the screen a teacher opens the app to, and the only pointer event
      in this section — and from there Tab walks to the class and Enter opens it.

      Tabbed to BY ID rather than to the first card that comes along: the class this section wants
      is the one with the biggest roster, and it is not necessarily the first in the grid.
    */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));
    await evalJs('(function(){ var a = document.activeElement;'
      + ' if (a && a.blur) a.blur(); return 1; })()');
    let kbHops = 0;
    let kbOn = '';
    while (kbHops < 60 && kbOn !== kbPick.id) {
      await kb('Tab', 'Tab', 9);
      kbHops++;
      kbOn = await evalJs("(function(){ var a = document.activeElement;"
        + " return a && a.getAttribute ? (a.getAttribute('data-class-tab') || '') : ''; })()");
    }
    await kb('Enter', 'Enter', 13, '\r');
    await new Promise(r => setTimeout(r, 300));
    const kbArrived = await evalJs("(function(){ var v = document.getElementById('classView');"
      + " return { up: !!v && !v.classList.contains('hidden'),"
      + " cls: window.planbook.classes.getSelectedClassId(),"
      + " cells: document.querySelectorAll('#attendanceBody [data-attendance-cell]').length }; })()");
    check('the grid is reached without a mouse too — Tab lands on the class and Enter opens it, '
      + 'which is the half of "without touching the mouse" that happens before any marking',
      kbOn === kbPick.id && kbArrived.up === true && kbArrived.cls === kbPick.id
        && kbArrived.cells >= 20,
      kbHops + ' Tab(s) to reach ' + kbPick.name + ' (landed on ' + JSON.stringify(kbOn)
        + '), then Enter: ' + JSON.stringify(kbArrived));

    /*
      ── THE THIRD DELIVERABLE, WHICH WAS ALREADY MET AND HAD NOTHING WATCHING IT ──

      "Screen-reader labels on the mark buttons — an icon-only `A` button needs `aria-label` and
      `title`." WO-2.1 wrote both on every cell and every column head, so this work order added no
      labels; what it adds is the check, because a deliverable with no fixture behind it is a
      deliverable the next refactor can quietly undo. Asked of the whole class view rather than of
      the cells, and in the deliverable's own terms: every button needs an accessible name, and a
      button whose visible text is one glyph needs BOTH — the name for a screen reader and the
      tooltip for a teacher on a laptop who cannot guess what 🚫 does.
    */
    const kbLabels = await evalJs(`(function(){
      var out = { total: 0, iconOnly: 0, nameless: [], untitled: [] };
      Array.prototype.slice.call(document.querySelectorAll('#classView button'))
        .filter(function(b){ var r = b.getBoundingClientRect(); return r.width || r.height; })
        .forEach(function(b){
          out.total++;
          var text = (b.textContent || '').trim();
          var label = (b.getAttribute('aria-label') || '').trim();
          var title = (b.title || '').trim();
          var id = (b.className || b.tagName) + ' ' + JSON.stringify(text);
          if (!label && !text) out.nameless.push(id);
          if (Array.from(text).length <= 2) {
            out.iconOnly++;
            if (!label || !title) out.untitled.push(id + ' label=' + JSON.stringify(label)
              + ' title=' + JSON.stringify(title));
          }
        });
      return out; })()`);
    check('every button on the registry has an accessible name, and every icon-only one carries '
      + 'both an aria-label and a title',
      kbLabels.total > 30 && kbLabels.iconOnly > 20
        && kbLabels.nameless.length === 0 && kbLabels.untitled.length === 0,
      /* Capped at four of each: a hundred and fifty cells failing one rule prints the same lesson a
         hundred and fifty times, and the count beside it is what says how wide the failure is. */
      kbLabels.total + ' visible button(s), ' + kbLabels.iconOnly + ' of them one glyph; '
        + kbLabels.nameless.length + ' nameless ' + JSON.stringify(kbLabels.nameless.slice(0, 4))
        + ', ' + kbLabels.untitled.length + ' icon-only without both '
        + JSON.stringify(kbLabels.untitled.slice(0, 4)));

    const kbToday = await evalJs('window.planbook.attendance.todayISO()');
    const kbBeforeAny = await kbAtt();
    const kbPassesBefore = await evalJs(
      'JSON.stringify(window.planbook.store.getDoc().openPasses || [])');

    /* ── a letter with nothing selected writes nothing ── */
    /* TWO DIFFERENT LETTERS, here and at the two refusals below, and it is the same precaution the
       kbChangingLetter() helper above exists for: setMark() refuses a no-op, so one letter that
       happens to match the mark already on the cell leaves the document byte-identical whether the
       refusal worked or not. Two letters cannot both be no-ops. */
    await kbLetter('A');
    await kbLetter('E');
    check('a letter with nothing selected writes nothing — the arrow key is what picks a student up, '
      + 'so a stray keystroke cannot mark whoever happens to be at the top of the class',
      (await kbAtt()) === kbBeforeAny,
      'attendance byte-identical across two different keystrokes = '
        + ((await kbAtt()) === kbBeforeAny));

    /* ── one ArrowDown, then one letter per student ── */
    const kbOrder = await kbRows();
    const kbPattern = ['A', 'T', 'E', 'D', 'P'];
    const kbExpect = {};
    /* `D` is swapped for `E` on the two students who are out of the room, and only on them — see
       the block above. It is a substitution in the FIXTURE, not a special case in the app: the key
       these two get is an ordinary one and it is asserted exactly like the rest. */
    kbOrder.forEach((id, i) => {
      const want = kbPattern[i % kbPattern.length];
      kbExpect[id] = want === 'D' && kbPick.out.indexOf(id) !== -1 ? 'E' : want;
    });

    await kbDown();
    const kbFirst = await kbFocus();
    check('one ArrowDown lands the keyboard on the first student, with the focus ring on the exact '
      + 'cell the next letter writes into',
      kbFirst.student === kbOrder[0] && kbFirst.date === kbToday && kbFirst.ring === true,
      JSON.stringify(kbFirst) + ' against first row ' + kbOrder[0] + ' on ' + kbToday);

    /* The walk. One letter per student and NOTHING else — no arrow between them, which is the
       whole of "the selection advances on its own". The focus is read after every keystroke rather
       than at the end, because "never lost after a mark" is a claim about each mark. */
    const kbLostRing = [];
    const kbWrongRow = [];
    for (let i = 0; i < kbOrder.length; i++) {
      await kbLetter(kbExpect[kbOrder[i]]);
      const at = await kbFocus();
      if (at.ring !== true) kbLostRing.push({ step: i, focus: at });
      const want = kbOrder[Math.min(i + 1, kbOrder.length - 1)];
      if (at.student !== want) kbWrongRow.push({ step: i, want: want, got: at.student });
    }

    const kbWrote = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var rec = (doc.attendance || []).filter(function(r){
        return r.classId === ${JSON.stringify(kbPick.id)} && r.date === ${JSON.stringify(kbToday)}; })[0];
      if (!rec) return null;
      var out = {};
      Object.keys(rec.marks || {}).forEach(function(id){
        var c = rec.marks[id];
        out[id] = { code: c && c.code, at: !!(c && c.at), pass: !!(c && c.passId) }; });
      return { entries: out, exception: rec.exception || '' }; })()`);

    const kbShould = {};
    kbOrder.forEach((id) => {
      const code = kbExpect[id];
      /* `P` IS NOT AN ENTRY. Present is the absence of a mark (src/attendance.js's header), so a
         keyboard `P` has to DELETE exactly as a tap does — which is the one thing a check that
         only counted marks would miss, and the one that quietly triples the document. */
      if (code === 'P') return;
      kbShould[id] = { code: code, at: code === 'T' || code === 'D', pass: false };
    });
    const kbGot = kbWrote ? kbWrote.entries : null;
    /* The DIFFERENCE rather than both maps: twenty-six entries printed twice is four thousand
       characters of green output nobody reads, and what a red run needs is the entries that
       disagree. Both directions, so a missing entry shows up as loudly as a wrong one. */
    const kbDiff = kbGot ? Object.keys(Object.assign({}, kbGot, kbShould))
      .filter((id) => JSON.stringify(kbGot[id]) !== JSON.stringify(kbShould[id]))
      .map((id) => ({ id: id, got: kbGot[id] || null, want: kbShould[id] || null })) : null;
    check('a full class is marked from the keyboard, one keystroke per student — ' + kbOrder.length
      + ' letters after one arrow, and every mark landed on the student it was typed at',
      !!kbWrote && !kbWrote.exception && !!kbDiff && kbDiff.length === 0,
      kbOrder.length + ' student(s) in ' + kbPick.name + '; wrote '
        + (kbGot ? Object.keys(kbGot).length : 'no record') + ' entr(ies) against '
        + Object.keys(kbShould).length + ' expected (the ' + kbOrder.filter(
          (id) => kbExpect[id] === 'P').length + ' P students are absent from the document on '
        + 'purpose); disagreements = ' + JSON.stringify(kbDiff));

    check('and the two students who were out of the room are still out — a keyboard mark moves no '
      + 'hall pass, which is also what leaves the coarse sweep below its fixture',
      (await evalJs('JSON.stringify(window.planbook.store.getDoc().openPasses || [])'))
        === kbPassesBefore,
      kbPick.out.length + ' open pass(es) in ' + kbPick.name + ', byte-identical across '
        + kbOrder.length + ' keystroke(s) = '
        + ((await evalJs('JSON.stringify(window.planbook.store.getDoc().openPasses || [])'))
          === kbPassesBefore));

    check('and the selection advanced on its own the whole way down — no arrow key between the '
      + 'letters, which is the difference between thirty keystrokes and sixty',
      kbWrongRow.length === 0,
      kbOrder.length + ' step(s), ' + kbWrongRow.length + ' landed on the wrong row: '
        + JSON.stringify(kbWrongRow.slice(0, 4)));

    check('and keyboard focus was visible on every one of those steps — never lost to <body> by the '
      + 'repaint that follows a mark',
      kbLostRing.length === 0,
      kbOrder.length + ' step(s), ' + kbLostRing.length + ' without a focus-visible ring: '
        + JSON.stringify(kbLostRing.slice(0, 4)));

    /* The last row is its own case: there is nothing to advance to, and the naive implementation
       leaves focus on a cell that has just been replaced — which is <body>. */
    const kbEnd = await kbFocus();
    check('the last student in the class keeps the ring after being marked, rather than dropping '
      + 'focus at the bottom of the list',
      kbEnd.student === kbOrder[kbOrder.length - 1] && kbEnd.ring === true,
      JSON.stringify(kbEnd) + ' against last row ' + kbOrder[kbOrder.length - 1]);

    /*
      ── THE OTHER WAY A KEYBOARD MARKS, AND THE ONE THAT PREDATES THIS WORK ORDER ──

      Tab to a cell and press Enter. That fires the cell's own click, which cycles the mark and
      REPLACES the cell node (src/attendance.js's paintColumn) — so without a hand-off to the
      replacement, focus lands on <body> and a keyboard user is put back at the top of the tab
      order after every single mark. It is the same acceptance line as the walk above and a
      different code path: the walk re-focuses through selectStudent(), which would cover the loss
      up. Asked here, where nothing else is doing the focusing.
    */
    const kbEnterFrom = await kbFocus();
    await kb('Enter', 'Enter', 13, '\r');
    const kbEnterTo = await kbFocus();
    check('pressing Enter on the focused cell cycles it and the ring stays on that cell — the mark '
      + 'replaces the element focus was sitting on, and it is handed to the replacement',
      kbEnterTo.student === kbEnterFrom.student && kbEnterTo.student !== ''
        && kbEnterTo.on !== 'body' && kbEnterTo.ring === true,
      'from ' + JSON.stringify(kbEnterFrom) + ' to ' + JSON.stringify(kbEnterTo));

    /* ── the row highlight: Roll Call!'s treatment, and the reflow it must not cause ── */
    await kbUp();
    await kbUp();
    const kbSel = await evalJs(`(function(){
      var rows = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceBody tr[data-attendance-row]'));
      var on = rows.filter(function(r){ return r.classList.contains('attendance-row-selected'); });
      if (on.length !== 1) return { selected: on.length };
      var name = on[0].querySelector('.attendance-name');
      var other = rows.filter(function(r){ return r !== on[0]; })[0].querySelector('.attendance-name');
      var s = getComputedStyle(name), o = getComputedStyle(other);
      return { selected: 1,
               id: on[0].getAttribute('data-attendance-row'),
               wash: getComputedStyle(on[0].querySelector('.attendance-cell-td')).backgroundColor,
               rail: s.borderLeftWidth + ' ' + s.borderLeftColor,
               otherRail: o.borderLeftWidth + ' ' + o.borderLeftColor,
               left: Math.round(name.getBoundingClientRect().left * 100) / 100,
               otherLeft: Math.round(other.getBoundingClientRect().left * 100) / 100 }; })()`);
    check('exactly one row wears Roll Call!\'s selection treatment — the indigo wash and the 3px '
      + 'left rail, copied by value rather than re-derived',
      kbSel.selected === 1 && kbSel.wash === 'rgba(91, 111, 204, 0.07)'
        && kbSel.rail === '3px rgb(91, 111, 204)',
      JSON.stringify(kbSel));
    /* The one departure from Roll Call!, measured as the thing it was made for: the rail is
       reserved on every row, so selecting one does not shove twenty-six names 3px sideways once
       per student down a class of thirty. */
    check('and selecting a row moves nothing — the rail is reserved on every row, so the names do '
      + 'not step sideways once per student',
      kbSel.left === kbSel.otherLeft && kbSel.otherRail === '3px rgba(0, 0, 0, 0)',
      'selected name at ' + kbSel.left + 'px, an unselected one at ' + kbSel.otherLeft
        + 'px; the unselected rail is ' + kbSel.otherRail);

    /* ── Escape: the selection goes, the focus does not ── */
    const kbBeforeEsc = await kbAtt();
    const kbFocusBeforeEsc = await kbFocus();
    await kbEsc();
    const kbAfterEsc = await evalJs("({ selected: "
      + "document.querySelectorAll('#attendanceBody tr.attendance-row-selected').length,"
      + " id: window.planbook.attendance.selectedStudent() })");
    const kbFocusAfterEsc = await kbFocus();
    check('Escape deselects — no row is highlighted and the module agrees nothing is selected',
      kbAfterEsc.selected === 0 && kbAfterEsc.id === '', JSON.stringify(kbAfterEsc));
    check('and Escape does not throw focus away: the ring stays on the cell it was on, so a teacher '
      + 'who paused is not left hunting for her place with Tab',
      kbFocusAfterEsc.student === kbFocusBeforeEsc.student && kbFocusAfterEsc.on !== 'body',
      'before = ' + JSON.stringify(kbFocusBeforeEsc) + ', after = '
        + JSON.stringify(kbFocusAfterEsc));
    await kbLetter('A');
    await kbLetter('E');
    check('and after Escape a letter writes NOTHING — which is what Escape is for, and it is the '
      + 'reason deselecting is not the same as blurring',
      (await kbAtt()) === kbBeforeEsc,
      'attendance byte-identical across two different keystrokes = '
        + ((await kbAtt()) === kbBeforeEsc));
    await kbDown();
    check('and one arrow picks the selection back up from where the focus was left, rather than at '
      + 'the top of the class',
      (await evalJs('window.planbook.attendance.selectedStudent()'))
        === kbOrder[Math.min(kbOrder.indexOf(kbFocusBeforeEsc.student) + 1, kbOrder.length - 1)],
      'resumed on ' + (await evalJs('window.planbook.attendance.selectedStudent()'))
        + ' after Escape on ' + kbFocusBeforeEsc.student);

    /* ── the three places a letter must not be a mark ── */
    const kbBeforeSearch = await kbAtt();
    const kbSearchLetter = await kbChangingLetter();
    await evalJs("(function(){ var f = document.getElementById('attendanceSearch');"
      + " f.focus(); f.value = ''; return 1; })()");
    await kbLetter(kbSearchLetter);
    const kbTyped = await evalJs("document.getElementById('attendanceSearch').value");
    check('a letter typed into the search box is a letter, not a mark — the field is two inches '
      + 'above the grid and "Patel" is five of them',
      (await kbAtt()) === kbBeforeSearch && kbTyped.toUpperCase() === kbSearchLetter,
      'typed ' + kbSearchLetter + ', the box reads ' + JSON.stringify(kbTyped)
        + ' and attendance is byte-identical = ' + ((await kbAtt()) === kbBeforeSearch));
    await evalJs("(function(){ var f = document.getElementById('attendanceSearch');"
      + " f.value = ''; f.dispatchEvent(new Event('input', { bubbles: true })); f.blur();"
      + " return 1; })()");

    /* ── the shortcuts, on screen rather than in the work order ── */
    const kbDoor = await evalJs(`(function(){
      var b = document.querySelector('#classView [data-modal-open="attendanceKeysModal"]');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { visible: !!b.offsetParent, tag: b.tagName, w: Math.round(r.width),
               h: Math.round(r.height), text: (b.textContent || '').trim(),
               label: b.getAttribute('aria-label') || '', title: b.title || '',
               tabbable: b.tabIndex >= 0 }; })()`);
    check('the shortcuts have a door on the registry itself, and it is an ordinary control — Tab '
      + 'finds it for somebody who does not know a single one of the keys yet',
      !!kbDoor && kbDoor.visible === true && kbDoor.tag === 'BUTTON' && kbDoor.tabbable === true
        && kbDoor.w > 0 && kbDoor.h > 0 && /keyboard/i.test(kbDoor.label),
      JSON.stringify(kbDoor));

    await kbDown();
    const kbOpener = await kbFocus();
    await kb('?', 'Slash', 191, '?', 8);
    const kbPanel = await evalJs(`(function(){
      var m = document.getElementById('attendanceKeysModal');
      if (!m || m.classList.contains('hidden')) return null;
      var t = m.textContent || '';
      return { open: true,
               inside: m.contains(document.activeElement),
               keys: ['P','T','A','E','D'].filter(function(k){
                 return Array.prototype.slice.call(m.querySelectorAll('.attendance-key'))
                   .some(function(n){ return (n.textContent || '').trim() === k; }); }),
               arrows: /↓/.test(t) && /↑/.test(t),
               esc: /Esc/.test(t) }; })()`);
    check('and `?` opens the same list for the hand that is already on the keys, naming all five '
      + 'letters, both arrows and Escape',
      !!kbPanel && kbPanel.keys.length === 5 && kbPanel.arrows === true && kbPanel.esc === true
        && kbPanel.inside === true,
      JSON.stringify(kbPanel));

    const kbBeforeDialog = await kbAtt();
    const kbDialogLetter = await kbChangingLetter();
    await kbLetter(kbDialogLetter);
    check('and a letter with that dialog open writes nothing — the keys belong to whatever is on '
      + 'top of the screen',
      (await kbAtt()) === kbBeforeDialog,
      'typed ' + kbDialogLetter + ' at ' + (await evalJs(
        'window.planbook.attendance.selectedStudent()')) + ', attendance byte-identical = '
        + ((await kbAtt()) === kbBeforeDialog));
    await kbEsc();
    const kbBack = await kbFocus();
    check('and closing it hands focus back to the cell it was opened from',
      kbBack.student === kbOpener.student && kbBack.student !== '',
      'opened from ' + JSON.stringify(kbOpener) + ', came back to ' + JSON.stringify(kbBack));

    /* ── the keys are refused exactly where a thumb is refused ── */
    await clickSel('[data-attendance-page="earlier"]');
    await new Promise(r => setTimeout(r, 200));
    const kbBeforePaged = await kbAtt();
    await kbDown();
    await kbLetter('A');
    await kbLetter('E');
    check('a window paged off the day being edited takes no keystroke — the keyboard is refused '
      + 'exactly where a thumb is, because both go through the same writer',
      (await kbAtt()) === kbBeforePaged,
      'attendance byte-identical across an arrow and two different letters = '
        + ((await kbAtt()) === kbBeforePaged));
    await clickSel('[data-attendance-page="today"]');

    /* Left the way the section above left it: no dialog, and a class open in <main>. */
    await evalJs("window.planbook.closeModal('attendanceKeysModal');1");
    await clickSel('[data-class-tab]', 1);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  }
}

/* ───────────────── touch targets, under a pointer that is REALLY coarse ─────────────────
 *
 * Emulation.setEmulatedMedia's `features` list does not reach `pointer`. It needs touch
 * emulation plus mobile device metrics. Getting this wrong measures the desktop pass and
 * reports green, which is the worst available outcome — so the coarse assertion below gates
 * every measurement after it.
 */

console.log('\n--- 44px touch targets (emulated coarse pointer) ---');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();            /* boot is async since WO-1.4; see waitForBoot */
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);   /* a reload discards page-side helpers */

const coarse = await evalJs("matchMedia('(pointer: coarse)').matches");
check('the emulated pointer really is coarse (else everything below measures the desktop pass)',
  coarse === true, 'matchMedia = ' + coarse);

if (coarse !== true) {
  skip('no visible interactive element measures under 44px', 'the coarse pointer never engaged');
} else {
  const MEAS = `(function(){
    var sel='button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])', out=[];
    document.querySelectorAll(sel).forEach(function(e){
      var r=e.getBoundingClientRect();
      if (r.width===0 && r.height===0) return;
      if (getComputedStyle(e).display==='none') return;
      out.push({t:e.tagName+'.'+(e.className||''), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100});
    });
    return out; })()`;
  const meas = await evalJs(MEAS);
  const under = meas.filter(m => m.h < 44 || m.w < 44);
  console.log('measured ' + meas.length + ' visible interactive elements');
  check('at least a handful of controls were found (guards a vacuous pass)', meas.length >= 5,
    'measured = ' + meas.length);
  check('no visible interactive element measures under 44px on a coarse pointer',
    under.length === 0, JSON.stringify(under));

  /* Measured after opening, not read off min-height: the search-box defect was a compliant
     declaration on the wrong element.

     `[data-modal-open]` is still the right selector here, unlike in the modal-behaviour section
     above: the shelf's two openers went at WO-1.10 and the header's About button — the one this
     clicks — is the real control that carried the hook all along. One opener is all a measurement
     needs; it is focus RETURN that needed two. */
  if (await has('[data-modal-open]')) {
    /* Same viewport-coordinate rule as clickSel above, and one extra reason to obey it here:
       Chrome restores the previous scroll offset across Page.reload, so this click can start
       from wherever the section before it left the page. */
    const box = await evalJs("(function(){var e=document.querySelector('[data-modal-open]');"
      + "e.scrollIntoView({block:'center'});var r=e.getBoundingClientRect();"
      + "return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await new Promise(r => setTimeout(r, 200));
    const mm = await evalJs(`(function(){ var out=[];
      document.querySelectorAll('.modal-overlay:not(.hidden) button, .modal-overlay:not(.hidden) input').forEach(function(e){
        var r=e.getBoundingClientRect();
        out.push({t:e.className||e.tagName, w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100});
      }); return out; })()`);
    if (!mm.length) skip('modal controls measure >=44px on a coarse pointer', 'no modal opened');
    else check('modal controls measure >=44px on a coarse pointer',
      mm.every(m => m.h >= 44 && m.w >= 44), JSON.stringify(mm.filter(m => m.h < 44 || m.w < 44)));
  }

  /* The year picker's rows and its "start another year" field are built at open time, so the
     sweep above never sees them — inside a hidden overlay they measure 0x0 and are skipped.
     They are the controls WO-1.4 adds, so they get measured explicitly, on the same coarse
     pointer, with the About modal closed first so only one overlay is on screen. */
  if (await has('[data-year-picker]')) {
    if (seam) await evalJs("window.planbook.closeModal('aboutModal');1");
    await clickSel('[data-year-picker]');
    await new Promise(r => setTimeout(r, 500));
    const ym = await evalJs(`(function(){ var m=document.getElementById('yearModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r=e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 };
      }); })()`);
    if (!ym || ym.length < 3) {
      check('the year picker opened with its rows, so there is something to measure',
        false, 'controls found = ' + (ym ? ym.length : 'modal never opened'));
    } else {
      check('every year-picker control measures >=44px on a coarse pointer',
        ym.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + ym.length + '; under = ' + JSON.stringify(ym.filter(m => m.h < 44 || m.w < 44)));
    }
    if (seam) await evalJs("window.planbook.closeModal('yearModal');1");
  }

  /* The backup panel and the restore confirm, for the same reason as the year picker above:
     everything in them sits inside a hidden overlay, where it measures 0x0 and the sweep skips
     it. The file input is the one that matters — a 44px <input type=file> wrapped around a 20px
     native button is the WO-1.2 `.search-box` defect exactly, so both are measured. */
  if (await has('[data-backup-panel]')) {
    if (seam) await evalJs("window.planbook.closeModal('yearModal');window.planbook.closeModal('aboutModal');1");
    /* Scoped to the header. The first [data-backup-panel] in the document is the exit inside
       the loading screen, which is display:none on a healthy boot — clicking it measures 0x0
       and the click lands at the top-left corner of the viewport instead, on whatever is there.
       Same viewport-coordinate trap as clickSel's own comment, one level up. */
    await clickSel('header [data-backup-panel]');
    await new Promise(r => setTimeout(r, 400));
    /* The confirm is opened over the top through the seam, so both panels are measured in one
       pass — there is no file to put through the input from here. */
    if (seam) {
      await evalJs("(async function(){ var s = window.planbook.store; var d = s.getDoc();"
        + " if (!d) return 0; var f = await window.planbook.backup.buildBackup();"
        + " await window.planbook.backup.restoreFromText(f.text, 'measure.json'); return 1; })()");
      await new Promise(r => setTimeout(r, 400));
    }
    /* WO-1.11's "Back up all N years" is inside this panel and is `.hidden` on a device with one
       year, so the measurement waits for it rather than measuring a 0x0 box and calling the panel
       broken. It is a real control here — the run has three years by now — and it gets its own
       named check below, because a control that is skipped for being invisible is a control nobody
       measured. */
    const allBtn = await evalJs(`(async function(){ var el;
      for (var i = 0; i < 60; i++) {
        el = document.getElementById('backupDownloadAllBtn');
        if (el && !el.classList.contains('hidden')) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      if (!el || el.classList.contains('hidden')) return null;
      var r = el.getBoundingClientRect();
      return { label: el.textContent, w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100 }; })()`);
    const bm = await evalJs(`(function(){ var out = [];
      document.querySelectorAll('.modal-overlay:not(.hidden) button, .modal-overlay:not(.hidden) input')
        .forEach(function(e){ var r = e.getBoundingClientRect();
          /* The same two skips the whole-page sweep above makes, and for the same reason: a control
             inside a visible overlay can still be hidden by its own class, and a box that is not
             rendered is not a box a thumb can miss. Anything hidden here is measured by a check of
             its own in the state where it is shown. */
          if (r.width === 0 && r.height === 0) return;
          if (getComputedStyle(e).display === 'none') return;
          out.push({ t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }); });
      return out; })()`);
    if (bm.length < 5) {
      check('the backup panel and restore confirm opened, so there is something to measure',
        false, 'controls found = ' + bm.length);
    } else {
      check('every backup and restore control measures >=44px on a coarse pointer',
        bm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + bm.length + '; under = ' + JSON.stringify(bm.filter(m => m.h < 44 || m.w < 44)));
    }
    check('the "back up every year" control is on the panel and measures >=44px on a coarse pointer',
      !!allBtn && allBtn.h >= 44 && allBtn.w >= 44,
      allBtn ? '"' + allBtn.label + '" is ' + allBtn.w + 'x' + allBtn.h
        : 'the control never appeared, so nothing was measured — with three years on the device it should be shown');
    /* The native ::file-selector-button, which is a separate box inside the input and is the
       part a thumb actually lands on. */
    const fileBtn = await evalJs(`(function(){ var i = document.getElementById('backupFile');
      if (!i) return null; var s = getComputedStyle(i, '::file-selector-button');
      return { minHeight: s.minHeight, padding: s.padding }; })()`);
    check('the file input\'s own native button carries a 44px minimum, not just the input around it',
      !!fileBtn && parseFloat(fileBtn.minHeight) >= 44,
      fileBtn ? 'min-height = ' + fileBtn.minHeight + ', padding = ' + fileBtn.padding : 'no #backupFile');
  }

  /* The classes manager, the term editor and the delete confirm, for the same reason as the year
     picker and the backup panel above: every control in them is built at open time inside a hidden
     overlay, where it measures 0x0 and the sweep skips it. Three of them are the ones this work
     order could plausibly get wrong — the reorder arrows are one glyph wide, the rename field is
     an input inside a row, and `<input type="date">` is a control whose height nobody sets by
     accident — so all three are opened and measured rather than read off a rule. */
  if (await has('[data-class-manage]')) {
    /* Everything the section above left open comes down first, the restore confirm included: an
       overlay is fixed at inset 0, so a click aimed at the header button underneath one lands on
       the scrim — and a press-and-release on a scrim is a backdrop dismissal, which would read as
       "the manager stopped opening". */
    if (seam) {
      await evalJs("window.planbook.backup.cancelRestore();"
        + "window.planbook.closeModal('backupModal');"
        + "window.planbook.closeModal('yearModal');window.planbook.closeModal('aboutModal');1");
    }
    await clickSel('header [data-class-manage]');
    await new Promise(r => setTimeout(r, 400));
    /* Rename first, so the field and its two buttons are on screen and inside the sweep. */
    await clickSel('#classList .class-row:nth-child(1) [data-class-rename]');
    const cm = await evalJs(`(function(){ var out = [];
      document.querySelectorAll('#classesModal button, #classesModal input').forEach(function(e){
        var r = e.getBoundingClientRect();
        out.push({ t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }); });
      return out; })()`);
    if (cm.length < 12) {
      check('the classes manager opened with its rows, so there is something to measure',
        false, 'controls found = ' + cm.length);
    } else {
      check('every control in the classes manager measures >=44px on a coarse pointer, arrows included',
        cm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + cm.length + '; under = ' + JSON.stringify(cm.filter(m => m.h < 44 || m.w < 44)));
    }

    await clickSel('[data-class-rename-cancel]');
    /* The SECOND row, not the first: the first is the class the backup section restored, which has
       no terms at all, and its editor is four preset buttons with nothing under them. Measuring
       that would report green while measuring none of the controls this section is here for. */
    await clickSel('#classList .class-row:nth-child(2) [data-term-manage]');
    await new Promise(r => setTimeout(r, 300));
    const tm = await evalJs(`(function(){ var m = document.getElementById('termsModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r = e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
    if (!tm || tm.length < 8) {
      check('the term editor opened with its rows, so there is something to measure',
        false, 'controls found = ' + (tm ? tm.length : 'modal never opened'));
    } else {
      check('every control in the term editor measures >=44px, date fields included',
        tm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + tm.length + '; under = ' + JSON.stringify(tm.filter(m => m.h < 44 || m.w < 44)));
    }
    await clickSel('#termsModal [data-modal-close]');

    /* The categories editor (WO-3.1), for the same reason as every panel above: its rows are built
       at open time inside a hidden overlay, where they measure 0x0 and the sweep at the top of this
       section skips them. Two shapes in here are the ones this work order could plausibly get
       wrong. The weight field is an `<input type="number">` — a control the browser draws, with a
       spinner inside it, whose height nobody sets by accident and which the term editor's date
       fields already had to be told about once. And the Remove button sits shoulder to shoulder
       with a one-glyph reorder arrow, which is where `min-width` matters as much as `min-height`:
       44px tall and 30px wide is half a touch target. The SECOND row again, for the reason the
       term editor uses it — the first class is the restored one, whose categories panel is an
       empty state with one button in it and measuring that would report green having measured
       none of the controls this check exists for. */
    await clickSel('#classList .class-row:nth-child(2) [data-category-manage]');
    await new Promise(r => setTimeout(r, 300));
    const km = await evalJs(`(function(){ var m = document.getElementById('categoriesModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r = e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
    if (!km || km.length < 8) {
      check('the categories editor opened with its rows, so there is something to measure',
        false, 'controls found = ' + (km ? km.length : 'modal never opened'));
    } else {
      check('every control in the categories editor measures >=44px, the weight field included',
        km.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + km.length + '; under = ' + JSON.stringify(km.filter(m => m.h < 44 || m.w < 44)));
    }
    /* The total is not a control and is deliberately not in the sweep above — it is a standing
       line of prose. What it does have to do on a tablet is be READ, so it is measured for the one
       thing a 12px line gets wrong at arm's length, and for the one thing a nowrap banner gets
       wrong at 390px: the "Days off" spill from the first iPad sitting, asked of the next surface
       that carries a sentence rather than a label. */
    const catTotal = await evalJs(`(function(){ var t = document.getElementById('categoryTotal');
      if (!t) return null; var s = getComputedStyle(t);
      return { size: parseFloat(s.fontSize), spill: t.scrollWidth > t.clientWidth,
               said: t.textContent.trim().length }; })()`);
    check('the weights total is legible on a coarse pointer and does not spill out of its own box',
      !!catTotal && catTotal.size >= 13 && !catTotal.spill && catTotal.said > 30,
      JSON.stringify(catTotal));
    await clickSel('#categoriesModal [data-modal-close]');

    /* The letter-scale editor (WO-3.2), for the same reason as every panel above: its bands are
       built at open time inside a hidden overlay, where they measure 0x0 and the sweep at the top of
       this section skips them. Four shapes in here are the ones this work order could plausibly get
       wrong. The boundary field is an `<input type="number">` — the control the categories editor and
       the term editor have each had to be told about once already. The letter field is two
       characters wide by nature, so it is the one input in this app whose `min-width` is doing real
       work. The subject pills wear `.pill`, which carries a coarse HEIGHT and no width, and a pill
       reading "AP" would be half a target — the subject row pins the width for that reason. And
       Remove sits shoulder to shoulder with a one-glyph reorder arrow, which is the mis-tap the 8px
       gap is for. */
    await clickSel('#classesModal [data-letter-scale]');
    await new Promise(r => setTimeout(r, 300));
    const lsm = await evalJs(`(function(){ var m = document.getElementById('letterScaleModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r = e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
    if (!lsm || lsm.length < 20) {
      check('the letter-scale editor opened with its bands, so there is something to measure',
        false, 'controls found = ' + (lsm ? lsm.length : 'modal never opened'));
    } else {
      check('every control in the letter-scale editor measures >=44px, the letter and boundary fields and the subject pills included',
        lsm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + lsm.length + '; under = ' + JSON.stringify(lsm.filter(m => m.h < 44 || m.w < 44)));
    }
    /* Two pieces of prose that are not controls and are deliberately not in the sweep above: the
       standing note, and the derived range on a band row. Both are measured for the two things a
       12px line gets wrong on a tablet — legibility at arm's length, and the "Days off" spill from
       the first iPad sitting, asked of the next surfaces that carry a sentence and a chip rather
       than a label. */
    const scaleNote = await evalJs(`(function(){ var n = document.getElementById('scaleNote');
      var chip = document.querySelector('#bandList .band-range');
      if (!n || !chip) return null; var ns = getComputedStyle(n); var cs = getComputedStyle(chip);
      return { size: parseFloat(ns.fontSize), spill: n.scrollWidth > n.clientWidth,
               said: n.textContent.trim().length, chipSize: parseFloat(cs.fontSize),
               chipSpill: chip.scrollWidth > chip.clientWidth,
               chipSaid: chip.textContent.trim().length }; })()`);
    check('the scale note and the derived range beside a band are legible on a coarse pointer and do not spill out of their boxes',
      !!scaleNote && scaleNote.size >= 13 && !scaleNote.spill && scaleNote.said > 30
        && scaleNote.chipSize >= 11 && !scaleNote.chipSpill && scaleNote.chipSaid > 5,
      JSON.stringify(scaleNote));
    await clickSel('#letterScaleModal [data-modal-close]');

    const archivedRows = await evalJs("document.querySelectorAll('#classArchivedList [data-class-delete]').length");
    if (!archivedRows) {
      skip('every control in the delete confirm measures >=44px on a coarse pointer',
        'no archived class on the device to open the confirm from');
    } else {
      await clickSel('#classArchivedList [data-class-delete]');
      await new Promise(r => setTimeout(r, 300));
      const dm = await evalJs(`(function(){ var m = document.getElementById('classDeleteModal');
        if (!m || m.classList.contains('hidden')) return null;
        return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
          var r = e.getBoundingClientRect();
          return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
      if (!dm || dm.length < 3) {
        check('the delete confirm opened, so there is something to measure', false,
          'controls found = ' + (dm ? dm.length : 'modal never opened'));
      } else {
        check('every control in the delete confirm measures >=44px on a coarse pointer',
          dm.every(m => m.h >= 44 && m.w >= 44),
          'measured ' + dm.length + '; under = ' + JSON.stringify(dm.filter(m => m.h < 44 || m.w < 44)));
      }
      await clickSel('[data-class-delete-cancel]');
    }
    if (seam) await evalJs("window.planbook.closeModal('classesModal');1");
  }

  /*
    Days off & planned drops (WO-2.3), for the same reason as every panel above: its class picker
    and its calendar list are built at open time inside a hidden overlay, where they measure 0x0 and
    the sweep at the top of this section skips them.

    Two shapes in here are the ones this work order could plausibly get wrong, and they are the two
    the run below puts on screen deliberately. The class picker is `.toggle-btn` rather than
    checkboxes — a checkbox is 16px of target that no padding makes bigger — so the kind is switched
    to a planned drop first, which is the only state in which that row exists. And the two date
    fields are `<input type="date">`, a control whose height nobody sets by accident and which the
    term editor above already had to be told about once.
  */
  if (seam && await has('#homeView [data-dayoff-panel]')) {
    await evalJs("(function(){ ['classDeleteModal','termsModal','classesModal','backupModal',"
      + "'yearModal','aboutModal'].forEach(function(m){ window.planbook.closeModal(m); });"
      + " return 1; })()");
    /* From the home view's own door, which means being on the home view: the coarse sweep reloads
       the page and Chrome restores whichever view the preference last held. */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await clickSel('#homeView [data-dayoff-panel]');
    await new Promise(r => setTimeout(r, 300));
    await clickSel('#daysOffModal [data-dayoff-kind="dropped"]');
    await new Promise(r => setTimeout(r, 200));
    const dom = await evalJs(`(function(){ var m = document.getElementById('daysOffModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input'))
        .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
        .map(function(e){ var r = e.getBoundingClientRect();
          return { t:(e.className || e.tagName), w:Math.round(r.width*100)/100,
                   h:Math.round(r.height*100)/100 }; }); })()`);
    const picker = await evalJs("document.querySelectorAll('#daysOffClassPicker .toggle-btn').length");
    if (!dom || dom.length < 8 || !picker) {
      check('the days-off panel opened with its class picker, so there is something to measure',
        false, 'controls found = ' + (dom ? dom.length : 'panel never opened')
          + ', class buttons = ' + picker);
    } else {
      check('every control in the days-off panel measures >=44px on a coarse pointer, date fields and class picker included',
        dom.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + dom.length + ' (including ' + picker + ' class button(s)); under = '
          + JSON.stringify(dom.filter(m => m.h < 44 || m.w < 44)));
    }
    await evalJs("window.planbook.closeModal('daysOffModal');1");

    /*
      AND THE BUTTON THAT OPENS IT, WHICH IS A DIFFERENT QUESTION FROM 44px AND THE ONE THAT FAILED.
      The owner found "Days off" spilling out through its own border on the iPad on 2026-08-08, with
      every touch-target check above it green — because a button can clear 44px in both directions
      and still be narrower than the words inside it. Every `.class-action-btn` is `white-space:
      nowrap`, so a shrunk one does not reflow, it overflows; and the coarse block's `min-width:
      44px` is what gave it permission to shrink, by replacing the `min-width: auto` that a flex
      item otherwise gets for free.

      Measured as scrollWidth against clientWidth, which is the defect itself rather than a proxy
      for it: a control whose content is wider than its box IS the bug, whatever caused it. Asked of
      every button in the header row, so the next one added to that row inherits the check.
    */
    const titleRow = await evalJs(`(function(){
      var row = document.querySelector('#homeView .panel-title-row');
      if (!row) return null;
      return Array.prototype.slice.call(row.querySelectorAll('button')).map(function(b){
        var r = b.getBoundingClientRect();
        return { text: (b.textContent || '').trim(),
                 over: b.scrollWidth - b.clientWidth,
                 w: Math.round(r.width), h: Math.round(r.height),
                 wrap: getComputedStyle(b).whiteSpace }; }); })()`);
    if (!titleRow || !titleRow.length) {
      check('the home screen header row has a control to measure', false,
        'found ' + JSON.stringify(titleRow));
    } else {
      check('no button in the home header row is narrower than its own label — a nowrap control that shrinks does not reflow, it spills through its border',
        titleRow.every(b => b.over <= 0 && b.w >= 44 && b.h >= 44),
        titleRow.map(b => '"' + b.text + '" ' + b.w + 'x' + b.h + ' (' + b.wrap + '), content over its box by '
          + b.over + 'px').join(' · '));
    }
    /* AND BACK INTO A CLASS, which is not tidying up — it is a precondition for the roster block
       below. The class tab strip is drawn on the class view ONLY (WO-1.13), and that block finds
       the class with the biggest roster by reading those tabs; left on the home screen it reads an
       empty list, switches to nothing, and fails four checks about controls it never opened. Found
       exactly that way. A card is the way in, the same route a teacher takes. */
    if (await has('#homeGrid .class-card-open')) await clickSel('#homeGrid .class-card-open');
  }

  /*
    The roster's four screens, for the same reason as the ones above: every control in them is
    built at open time inside a hidden overlay, where it measures 0x0 and the sweep at the top of
    this section skips it. This feature has more fields than every other one put together, which is
    exactly how one of them gets missed — and three of them are shapes nobody sets the height of by
    accident: a <textarea>, a preview row whose two name fields sit side by side, and the
    "Contact first" toggle, which is a pill rather than a checkbox precisely because a checkbox is
    16px of target that no padding makes bigger.

    The wrapper classes the sweep flagged — .roster-list, .roster-form, .student-grid, .guardian-card
    and the rest — carry no rule and are not measured here, because they are not targets. What is
    measured is the control INSIDE each of them, which is the WO-1.2 .search-box lesson: a 44px
    declaration on a wrapper is what a stylesheet review calls compliant and a thumb calls broken.
  */
  if (seam && await has('header [data-roster-manage]')) {
    const closeStack = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
      + "'rosterPasteModal','rosterModal','teacherModal','classesModal','backupModal',"
      + "'yearModal','aboutModal'].forEach(function(m){ window.planbook.closeModal(m); });"
      + " return 1; })()");
    const measureIn = (id) => evalJs(`(function(){ var m = document.getElementById(`
      + JSON.stringify(id) + `);
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input, textarea'))
        .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
        .map(function(e){ var r = e.getBoundingClientRect();
          return { t:(e.className || e.tagName), w:Math.round(r.width*100)/100,
                   h:Math.round(r.height*100)/100 }; }); })()`);
    const report = (list) => 'measured ' + list.length + '; under = '
      + JSON.stringify(list.filter(m => m.h < 44 || m.w < 44));

    await closeStack();
    /* Onto the class that actually has a roster, found rather than assumed: the panel renders one
       row per student, and measuring an empty one would report green having measured the two
       controls the markup ships with. The overflow section below wants the class the roster
       section left open, so it is put back at the end of this block. */
    const fullest = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var tabs = Array.prototype.slice.call(document.querySelectorAll('#classTabBar [data-class-tab]'));
      var best = -1, n = -1;
      tabs.forEach(function(t, i){
        var c = doc.classes.filter(function(x){ return x.id === t.getAttribute('data-class-tab'); })[0];
        var len = c && c.roster ? c.roster.length : 0;
        if (len > n) { n = len; best = i; }
      });
      return { tab: best, students: n, was: window.planbook.classes.getSelectedClassId() }; })()`);
    if (fullest.tab >= 0) await clickSel('[data-class-tab]', fullest.tab);
    await clickSel('header [data-roster-manage]');
    await new Promise(r => setTimeout(r, 300));
    const rm = await measureIn('rosterModal');
    if (!rm || rm.length < 5) {
      check('the roster panel opened with its rows, so there is something to measure', false,
        'controls found = ' + (rm ? rm.length : 'panel never opened'));
    } else {
      check('every control on the roster panel measures >=44px on a coarse pointer',
        rm.every(m => m.h >= 44 && m.w >= 44), report(rm));
    }

    await clickSel('#rosterModal [data-roster-paste]');
    await new Promise(r => setTimeout(r, 200));
    await evalJs('(function(){ var b = document.getElementById("rosterPasteBox");'
      + ' b.value = "Measured, Ann\\nBeta Gamma\\n";'
      + ' b.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
    await clickSel('[data-roster-preview]');
    await new Promise(r => setTimeout(r, 200));
    const pm = await measureIn('rosterPasteModal');
    if (!pm || pm.length < 6) {
      check('the paste preview opened with its rows, so there is something to measure', false,
        'controls found = ' + (pm ? pm.length : 'panel never opened'));
    } else {
      check('every control in the paste preview measures >=44px, the per-row swap included',
        pm.every(m => m.h >= 44 && m.w >= 44), report(pm));
    }
    await evalJs("window.planbook.closeModal('rosterPasteModal');1");

    /* The first roster row's student, with a guardian card open: the card is the only place in
       this feature where a toggle, a delete and five fields share one box.

       Guarded rather than clicked straight, because there is no student to open when the roster
       section above ended on a failure — and clickSel throws when it finds nothing, which would
       take the whole run down at the point where a report is what is wanted. Failing to have a
       fixture is a failed check here, never a crash and never a silent pass. */
    const editable = await has('#rosterList .roster-row [data-student-edit]');
    if (!editable) {
      check('the student editor opened with a guardian card, so there is something to measure',
        false, 'no student on the open class\'s roster to open an editor from');
    } else {
      await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
      await new Promise(r => setTimeout(r, 200));
      const noGuardian = await evalJs(
        "document.querySelectorAll('#guardianList .guardian-card').length === 0");
      if (noGuardian) await clickSel('#studentModal [data-guardian-add]');
      await new Promise(r => setTimeout(r, 200));
      const sm = await measureIn('studentModal');
      const cards = await evalJs("document.querySelectorAll('#guardianList .guardian-card').length");
      if (!sm || sm.length < 10 || !cards) {
        check('the student editor opened with a guardian card, so there is something to measure',
          false, 'controls found = ' + (sm ? sm.length : 'panel never opened')
            + ', guardian cards = ' + cards);
      } else {
        check('every control in the student editor measures >=44px, the notes box and guardian card included',
          sm.every(m => m.h >= 44 && m.w >= 44), report(sm));
      }

      /*
        The support panel, opened, with an accommodation card in it. Everything in it is inside a
        block that is `.hidden` until a deliberate tap, where it measures 0x0 and every sweep above
        skips it — and two of its controls are shapes nobody sets the height of by accident: a
        <select>, which measureIn's own selector does not even name, and an <input type="date">,
        which is the control the term editor already had to be told about twice.
      */
      const revealable = await has('#studentModal [data-supports-reveal]');
      if (!revealable) {
        check('the support panel opened with an accommodation card, so there is something to measure',
          false, 'no [data-supports-reveal] control in the student editor');
      } else {
        await clickSel('#studentModal [data-supports-reveal]');
        await new Promise(r => setTimeout(r, 200));
        const noCard = await evalJs(
          "document.querySelectorAll('#accommodationList .accommodation-card').length === 0");
        if (noCard) await clickSel('#studentModal [data-accommodation-add]');
        await new Promise(r => setTimeout(r, 200));
        const spm = await evalJs(`(function(){ var b = document.getElementById('supportsBody');
          if (!b || b.classList.contains('hidden')) return null;
          return Array.prototype.slice.call(
            b.querySelectorAll('button, input, textarea, select'))
            .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
            .map(function(e){ var r = e.getBoundingClientRect();
              return { t:(e.className || e.tagName), w:Math.round(r.width*100)/100,
                       h:Math.round(r.height*100)/100 }; }); })()`);
        const selects = await evalJs(
          "document.querySelectorAll('#accommodationList [data-support-kind]').length");
        if (!spm || spm.length < 8 || !selects) {
          check('the support panel opened with an accommodation card, so there is something to measure',
            false, 'controls found = ' + (spm ? spm.length : 'panel never opened')
              + ', kind pickers = ' + selects);
        } else {
          check('every control in the support panel measures >=44px, the kind picker and review date included',
            spm.every(m => m.h >= 44 && m.w >= 44), report(spm));
        }
      }
      /* The support dot on the roster row behind this dialog is a `.support-dot` button and is
         measured by the roster-panel sweep above, which collects every button in that overlay. It
         is named here so that a reader looking for it does not conclude it was missed. */
    }

    await closeStack();
    await clickSel('header [data-teacher-panel]');
    await new Promise(r => setTimeout(r, 300));
    const tp = await measureIn('teacherModal');
    if (!tp || tp.length < 5) {
      check('the teacher panel opened, so there is something to measure', false,
        'controls found = ' + (tp ? tp.length : 'panel never opened'));
    } else {
      check('every control on the teacher panel measures >=44px on a coarse pointer',
        tp.every(m => m.h >= 44 && m.w >= 44), report(tp));
    }
    await closeStack();
    if (fullest.was) await evalJs('window.planbook.classes.selectClass('
      + JSON.stringify(fullest.was) + ');1');
  }

  /*
    THE REGISTRY, which is the one screen in this app whose touch targets are the feature.

    It carries more controls than everything measured above put together — one per student per day,
    and a class is a hundred and fifty-six of them — and each one is a single glyph, which is the
    shape shell.css's coarse block already had to be told about twice (`.cls-tab`,
    `.class-action-btn`): a one-glyph button given 44px of height and its natural width is half a
    touch target, so min-WIDTH is asserted here as hard as min-height.

    The card's own control is measured too, and it is measured before the view swaps, because it is
    the control that swaps it: a home screen whose route into attendance is a 20px strip is a home
    screen unusable on the device it was built for. Since WO-1.13 that is ONE control per card
    rather than two — the state line inside it reports and is not tapped — so what is asserted is
    that every card carries exactly one button and that it is a target.
  */
  if (seam && await has('#homeGrid .class-card-open')) {
    /* Remembered here rather than borrowed from the block above, whose `fullest` is scoped to it.
       Opening the registry moves the selection — that is the whole point of the control —
       and the overflow sweep below measures the term nav of whatever is open. */
    const openWas = await evalJs('window.planbook.classes.getSelectedClassId()');
    await evalJs("(function(){ ['rosterModal','studentModal','classesModal',"
      + "'teacherModal','backupModal','yearModal','aboutModal']"
      + ".forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
    /* Back to the grid first, through the control a teacher taps: the section above leaves the app
       on a class, and a card measured while `#homeView` is hidden measures 0x0 — which is the shape
       of a green run that measured nothing (tools/README.md trap 3's lesson, one screen further
       in). */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));
    const cardBtns = await evalJs(`(function(){
      var cards = document.querySelectorAll('#homeGrid .class-card');
      var loose = 0;
      Array.prototype.forEach.call(cards, function(c){
        if (c.querySelectorAll('button').length !== 1) loose++; });
      return { cards: cards.length, oddCards: loose,
        btns: Array.prototype.slice.call(document.querySelectorAll('#homeGrid .class-card button'))
          .map(function(e){ var r = e.getBoundingClientRect();
            return { t: e.className, w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100 }; }) }; })()`);
    if (!cardBtns.cards || !cardBtns.btns.length) {
      check('the one control on a class card measures >=44px on a coarse pointer', false,
        'cards on the grid = ' + cardBtns.cards + ', controls found = ' + cardBtns.btns.length);
    } else {
      check('the one control on a class card measures >=44px on a coarse pointer, and there is exactly one per card',
        cardBtns.oddCards === 0 && cardBtns.btns.length === cardBtns.cards
          && cardBtns.btns.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + cardBtns.btns.length + ' control(s) on ' + cardBtns.cards + ' card(s), '
          + cardBtns.oddCards + ' card(s) not carrying exactly one; under = '
          + JSON.stringify(cardBtns.btns.filter(m => m.h < 44 || m.w < 44)));
    }

    /* Onto the class with the biggest roster, found rather than assumed, for the reason the roster
       block above gives: measuring a class with no students would report green having measured two
       class-level buttons and no marks at all. */
    const biggest = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var best = null, n = -1;
      doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
        var len = c.roster ? c.roster.length : 0;
        if (len > n) { n = len; best = c.id; } });
      return { id: best, students: n }; })()`);
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + biggest.id + '"]');
    await new Promise(r => setTimeout(r, 300));
    const am = await evalJs(`(function(){ var m = document.getElementById('classView');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input, select, textarea'))
        .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
        .map(function(e){ var r = e.getBoundingClientRect();
          return { t: (e.className || e.tagName), w: Math.round(r.width*100)/100,
                   h: Math.round(r.height*100)/100 }; }); })()`);
    const cellCount = await evalJs(
      "document.querySelectorAll('#attendanceBody [data-attendance-cell]').length");
    const dayCount = await evalJs(
      "document.querySelectorAll('#attendanceHead th[data-attendance-col]').length");
    if (!am || cellCount < 25) {
      check('the registry opened with a class on it, so there is something to measure', false,
        'controls found = ' + (am ? am.length : 'the class view never came up') + ', tappable cells = '
          + cellCount + ' for a roster of ' + biggest.students);
    } else {
      check('every control on the registry measures >=44px on a coarse pointer, cells and column heads alike',
        am.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + am.length + ' (' + cellCount + ' of them cells in ' + dayCount
          + ' day column(s), for a roster of ' + biggest.students + '); under = '
          + JSON.stringify(am.filter(m => m.h < 44 || m.w < 44)));
    }
    /*
      THE ⌨ DOOR, BY NAME AND WITH THE SPILL MEASURED (WO-2.5). The sweep above already reads every
      control in `#classView`, so this adds nothing to the 44px claim — what it adds is the OTHER
      half, which is the lesson the first iPad sitting sent back on 2026-08-08: "Days off" cleared
      44px in both directions and still spilled through its own border, because a `nowrap` button
      can be narrower than its own label. `⌨ Keys` is the same shape — a glyph and a word in a flex
      row — so it gets the same measurement, `scrollWidth` against `clientWidth`, which is the
      defect itself rather than a proxy for it.
    */
    const keysDoor = await evalJs(`(function(){
      var b = document.querySelector('#classView [data-modal-open="attendanceKeysModal"]');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
               spill: b.scrollWidth - b.clientWidth }; })()`);
    check('the ⌨ shortcuts door measures >=44px on a coarse pointer and does not spill through its '
      + 'own border',
      !!keysDoor && keysDoor.h >= 44 && keysDoor.w >= 44 && keysDoor.spill <= 0,
      JSON.stringify(keysDoor));

    /*
      And six columns of 44px cells still fit, on the device this screen is for. This is the desk
      half of acceptance line 2 — the line itself needs the owner's own iPad in the orientation she
      holds it, and no emulator has that — but a grid that already wants a sideways swipe under an
      emulated coarse pointer at 1024px would fail it on any device. Measured three ways, because a
      grid can escape in three: past its own box, past the panel, and past the page.
    */
    const spill = await evalJs(`(function(){
      var wrap = document.getElementById('attendanceGridWrap');
      var rows = Array.prototype.slice.call(document.querySelectorAll('#attendanceBody tr'));
      var panel = document.querySelector('#classView .attendance-panel');
      if (!wrap || !rows.length || !panel) return null;
      var pr = panel.getBoundingClientRect();
      return { rows: rows.length,
               days: document.querySelectorAll('#attendanceHead th[data-attendance-col]').length,
               over: rows.filter(function(r){ var b = r.getBoundingClientRect();
                 return b.right > pr.right + 0.5 || b.left < pr.left - 0.5; }).length,
               wrapOver: wrap.scrollWidth - wrap.clientWidth,
               scrollW: document.documentElement.scrollWidth, inner: window.innerWidth }; })()`);
    check('six days of columns for a full class fit the panel with no sideways scroll anywhere',
      !!spill && spill.days === 6 && spill.over === 0 && spill.wrapOver <= 0
        && spill.scrollW <= spill.inner,
      spill ? spill.rows + ' row(s) across ' + spill.days + ' day column(s), ' + spill.over
        + ' wider than the panel, grid over its own box by ' + spill.wrapOver + 'px; page '
        + spill.scrollW + 'px in a ' + spill.inner + 'px viewport' : 'no rows to measure');
    /* Back to the grid through the control again rather than through the seam — and the selection
       restored under it, because the overflow sweep below measures the term nav of whatever class
       is open. selectClass() navigates since WO-1.13, so the order is: leave, then select. */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    if (openWas) await evalJs('window.planbook.classes.selectClass('
      + JSON.stringify(openWas) + ');1');
  }

  /*
    Presentation mode's two controls, and the reason they need their own block: one of them does
    not exist in the state that matters. The strip under the header is only on screen while the
    mode is ON, where the sweep at the top of this section has already run and where an off strip
    measures 0x0 and is skipped — the same shape as every modal above, with the switch standing in
    for the opener. So the mode goes on, both controls are measured, and it goes off again, because
    a run that walked away leaving support data suppressed would take the fixtures of everything
    after it with it.
  */
  if (seam && await has('header [data-presentation-toggle]')) {
    await clickSel('header [data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 200));
    const pm = await evalJs(`(function(){
      var strip = document.getElementById('presentationStrip');
      if (!strip || strip.classList.contains('hidden')) return null;
      var out = [];
      Array.prototype.forEach.call(
        document.querySelectorAll('#presentationBtn, #presentationStrip button'), function(e){
          var r = e.getBoundingClientRect();
          out.push({ t: (e.id || e.className || e.tagName), w: Math.round(r.width * 100) / 100,
                     h: Math.round(r.height * 100) / 100 }); });
      return out; })()`);
    if (!pm || pm.length < 2) {
      check('presentation mode turned on, so its two controls are on screen to be measured',
        false, 'controls found = ' + (pm ? pm.length : 'the strip never appeared'));
    } else {
      check('the presentation toggle and the strip\'s own button both measure >=44px on a coarse pointer',
        pm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + pm.length + '; under = ' + JSON.stringify(pm.filter(m => m.h < 44 || m.w < 44)));
    }
    await clickSel('#presentationStrip [data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 200));
    const leftOff = await evalJs('window.planbook.supports.supportsVisible()');
    check('and the run leaves presentation mode off, so nothing after this measures a suppressed app',
      leftOff === true, 'supportsVisible() = ' + leftOff);
  }

  if (await has('[data-backup-panel]')) {
    /* The boot-failure exit is the one control that cannot be measured here: it only exists on
       screen when boot has failed, and this section needs an app that booted. Its rule is read
       instead — weaker than a measurement, and said so, but it still catches the control being
       added without its line in the touch pass. */
    const exitRule = await evalJs(`(function(){ var b = document.querySelector('.loading-error-btn');
      return b ? getComputedStyle(b).minHeight : null; })()`);
    check('the boot-failure exit button declares 44px under a coarse pointer (rule, not a measurement)',
      parseFloat(exitRule) >= 44, 'computed min-height = ' + exitRule);
    if (seam) {
      await evalJs("window.planbook.backup.cancelRestore();"
        + "window.planbook.closeModal('backupModal');1");
    }
  }
}

/* ───────────────── no horizontal overflow at any breakpoint ───────────────── */

console.log('\n--- horizontal overflow ---');
for (const [w, h, dsf] of [[1024, 768, 2], [768, 1024, 2], [390, 844, 3]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const o = await evalJs('({sw:document.documentElement.scrollWidth, iw:window.innerWidth})');
  check('no horizontal overflow at ' + w + 'x' + h, o.sw <= o.iw, JSON.stringify(o));

  /*
    The page not overflowing is not the same as the header being readable, which is what the first
    device sitting found: the two strips scrolled correctly and the buttons inside them were
    compressed to narrower than their own labels, so the names were laid out across the rounded
    background and over its edge. `flex-shrink: 0` in shell.css is the fix and this is the
    measurement — a button whose label does not fit inside it, at the width where it was seen.

    A button sitting at its `max-width` cap is exempt: that one is ellipsised on purpose, and an
    ellipsis is the label not fitting by design rather than by accident.
  */
  const spill = await evalJs(`(function(){
    var els = document.querySelectorAll('#classTabBar .cls-tab, #termNav .q-btn');
    var out = [];
    for (var i = 0; i < els.length; i++) {
      var e = els[i], cs = getComputedStyle(e);
      var cap = parseFloat(cs.maxWidth);
      var capped = !isNaN(cap) && e.getBoundingClientRect().width >= cap - 1;
      if (!capped && e.scrollWidth > e.clientWidth + 1) {
        out.push({ text: e.textContent, scrollW: e.scrollWidth, clientW: e.clientWidth });
      }
      if (cs.flexShrink !== '0' || cs.whiteSpace !== 'nowrap') {
        out.push({ text: e.textContent, flexShrink: cs.flexShrink, whiteSpace: cs.whiteSpace });
      }
    }
    return { measured: els.length, bad: out }; })()`);
  check('no class tab or term button is squeezed narrower than its own label at ' + w + 'x' + h,
    spill.measured > 0 && spill.bad.length === 0,
    'measured ' + spill.measured + '; bad = ' + JSON.stringify(spill.bad));

  /*
    The other half of that fix, and a defect it introduced. Once the tabs stopped squeezing they
    started scrolling, and refreshClassBar() rebuilds the strip's children on every call — which
    resets `scrollLeft` to 0. So the teacher whose open class is the last of six got a header
    scrolled to the left with no tab on it looking selected, which reads as the app having forgotten
    which class she was in.

    Measured on the LAST class, because the first one is visible whether or not anything works.
  */
  /* Read off the DOM rather than through `window.__cls`: that reader is re-installed after each
     reload for the sections that use it, and this one runs past the last of them. */
  const tabScroll = await evalJs(`(function(){
    var strip = document.getElementById('classTabBar');
    var tabs = strip.querySelectorAll('[data-class-tab]');
    if (!tabs.length) return { noTabs: true };
    window.planbook.classes.selectClass(tabs[tabs.length - 1].getAttribute('data-class-tab'));
    var el = strip.querySelector('.cls-tab.active');
    if (!el) return { noActive: true };
    var s = strip.getBoundingClientRect(), e = el.getBoundingClientRect();
    return { overflows: strip.scrollWidth > strip.clientWidth + 1,
             inView: e.left >= s.left - 1 && e.right <= s.right + 1,
             scrollLeft: strip.scrollLeft, text: el.textContent,
             strip: { left: Math.round(s.left), right: Math.round(s.right),
                      scrollW: strip.scrollWidth, clientW: strip.clientWidth },
             tab: { left: Math.round(e.left), right: Math.round(e.right) } }; })()`);
  if (tabScroll.noTabs) {
    skip('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
      'no classes on the bar at this point in the run');
  } else {
    /* Asserted before the scroll question, because a strip of zero width answers that question
       "no" for a reason that has nothing to do with scrolling — and it is a whole class bar the
       teacher cannot see. This is how the 390px flex-basis defect was found. */
    check('the class tab strip has real width to scroll at ' + w + 'x' + h,
      tabScroll.strip.clientW >= 96, JSON.stringify(tabScroll.strip));
    if (tabScroll.overflows === false) {
      skip('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
        'the strip fits every tab at this width, so there is nothing to scroll');
    } else {
      check('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
        tabScroll.inView === true, JSON.stringify(tabScroll));
    }
  }
}

/* ──────────── the WO-2.10 note panel fits the screen it is read on ──────────── */

/*
  THE 2026-08-06 DEVICE SITTING. The note field was cut off on the right on the iPad, in BOTH
  orientations, on every mark code — worst on present/absent/at-an-event, where the mark chip is
  short enough that the field stays on the same flex line as the name and gets pushed under the
  edge. Tardy and dismissed carry a time, the longer chip wraps the field onto its own line, and it
  escaped; that difference is why the report described a severity order rather than a plain break.

  The cause was a fixed `width: 720px` on `.attendance-panel` inside src/attendance.css's
  `(pointer: coarse)` block. The cap had already been overruled by the owner and removed from the
  BASE rule — and left standing in the touch block, so the fix reached the laptop and never reached
  the only device it was for. At 720px the grid's own columns want 711px inside 680px of body, the
  wrap's `overflow-x` safety valve engages, and everything past 680px is invisible. A fixed panel
  width also makes the geometry identical in both orientations, which is exactly what was reported:
  rotating to landscape left 288px of screen unused and changed nothing.

  This measures the thing the eye actually catches — the right edge of the field against the right
  edge of the scroll container — rather than the page-level overflow the block above already covers.
  The page never overflowed; the clipping was always INSIDE the wrap, which is why three green
  "no horizontal overflow" checks sat above a screen that was visibly broken.

  Driven at both iPad orientations and on every code, because the defect was orientation-independent
  and code-dependent, and a check that ran one code would have passed on `T` while `A` was broken.
*/
console.log('\n--- the WO-2.10 note panel fits its screen ---');
{
  /*
    THE CONDITION HAS TO BE MANUFACTURED, AND THE FIRST VERSION OF THIS CHECK DID NOT DO IT. Written
    against whatever roster the run happened to have built, it passed with the fix fully reverted:
    the names this harness types in are short, the name column stays narrow, and the grid fits its
    wrap at 720px with room to spare. It was measuring a screen the defect had never been on.

    The trigger is NAME LENGTH. The column is `nowrap`, so its min-content is the longest name laid
    flat, and a table cell's min-content is a floor the browser widens the whole TABLE to honour.
    Short names, no defect; "Delacroix-Nguyen, Xiomara" is 279px and pushes the table to 711px inside
    680px of body. Real rosters are full of hyphenated and double-barrelled names, which is why this
    reached the owner's iPad and never reached a test.

    So the long name is written in deliberately, and put back afterwards. The precondition is then
    ASSERTED rather than assumed — a rename that silently failed would take the check back to
    measuring nothing, which is the exact failure being corrected here.
  */
  const LONG_NAME = { first: 'Xiomara', last: 'Delacroix-Nguyen' };
  const ready = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var cls = (doc.classes || []).filter(function(c){ return !c.archived && (c.roster||[]).length; })[0];
    if (!cls) return { none: true };
    var sid = cls.roster[0];
    var stu = doc.students.filter(function(s){ return s.id === sid; })[0];
    if (!stu) return { none: true };
    var was = { first: stu.first, last: stu.last };
    window.planbook.store.update(function(){
      stu.first = ${JSON.stringify(LONG_NAME.first)}; stu.last = ${JSON.stringify(LONG_NAME.last)}; });
    window.planbook.classes.selectClass(cls.id);
    window.planbook.attendance.renderAttendance();
    return { classId: cls.id, student: sid, was: was,
             rows: document.querySelectorAll('[data-attendance-row]').length }; })()`);

  if (ready.none || !ready.rows) {
    skip('the WO-2.10 note panel sits inside the grid it is drawn in',
      'no unarchived class with a roster is on the device at this point in the run, so there is no '
        + 'registry to draw a panel in — a state, not a pass');
  } else {
    const day = await evalJs('window.planbook.attendance.todayISO()');

    for (const [w, h, label] of [[768, 1024, 'portrait'], [1024, 768, 'landscape']]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await new Promise(r => setTimeout(r, 350));
      /* RENDER AFTER THE RESIZE, EVERY TIME. dayColumnCount() reads `window.innerWidth` when the
         grid is painted, not when it is looked at, so a grid painted at the 390px this run's
         previous section left behind keeps THREE columns at 768px — and three columns leave so much
         spare width that the defect cannot occur. The first version of this section rendered once,
         before the first resize, and measured that phantom. */
      await evalJs('window.planbook.attendance.renderAttendance()');
      await new Promise(r => setTimeout(r, 250));

      /*
        The precondition, per orientation. Without a name column that WANTS more than the day columns
        leave spare, every check below is green for a reason that has nothing to do with the fix.

        Measured on the RENAMED student's own row, found by id. Reading `tbody .attendance-name` took
        whichever row sorted first — "Álvarez, José" — while the long name sat further down the list,
        so the probe reported a 185px column and failed itself. The row this asks about has to be the
        row the name was written onto.
      */
      const cond = await evalJs(`(function(){
        var row = document.querySelector('[data-attendance-row="' + ${JSON.stringify(ready.student)} + '"]');
        var cell = row && row.querySelector('.attendance-name');
        if (!cell) return { noCell: true };
        var probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:min-content;';
        var clone = cell.cloneNode(true);
        clone.style.maxWidth = 'none';          /* what the column would demand UNCAPPED */
        probe.appendChild(clone); document.body.appendChild(probe);
        var want = Math.round(probe.getBoundingClientRect().width);
        document.body.removeChild(probe);
        var days = document.querySelectorAll('thead .attendance-day').length;
        var dayW = days ? Math.round(document.querySelector('thead .attendance-day')
                            .getBoundingClientRect().width) : 0;
        var wrap = document.querySelector('.attendance-grid-wrap');
        /* The Passes column takes its share of the wrap before the name column sees any of it
           (WO-2.8), so the spare the name is competing for is what is left after BOTH fixed
           columns. Measured rather than assumed, because it is the number that decides whether
           the cap below is still load-bearing. */
        var passTh = document.querySelector('thead .attendance-passes');
        var passW = passTh ? Math.round(passTh.getBoundingClientRect().width) : 0;
        return { want: want, days: days, dayW: dayW, wrapW: wrap.clientWidth, passW: passW,
                 spare: wrap.clientWidth - days * dayW - passW,
                 name: (cell.getAttribute('title') || '') }; })()`);
      /* Two claims, and they are separated because only one of them can be made in both
         orientations. This first one guards the RENDER: the right number of day columns, and the
         long name actually on the row being measured. If either slips, everything below is
         measuring a screen the defect was never on, which is the trap this whole block exists to
         close.

         IT WAS SIX IN BOTH ORIENTATIONS UNTIL WO-2.8, and the change is that work order's visible
         cost rather than a slackening of this check. The Passes column asks for 160px of a 688px
         wrap; six day columns and a name column do not fit beside it in portrait, and
         src/attendance.js's answer to "not enough width" was already to draw fewer days rather than
         to let the grid escape sideways — which is the very failure this block was written for.
         So: four in portrait, six in landscape, and the count is still ASSERTED rather than
         accepted, because a grid that quietly dropped to three would be measuring a screen with
         room to spare.

         AND IT IS ONE IN PORTRAIT SINCE WO-2.12 — today's column and nothing else, the owner's own
         answer to the four-five-or-six question WO-2.8 escalated. Six in landscape is untouched by
         that work order and stays asserted here as the thing it must not have changed. */
      const wantDays = label === 'portrait' ? 1 : 6;
      check('the grid under this measurement is ' + wantDays
        + ' columns wide beside the Passes column, and carries the long name, iPad ' + label,
        !cond.noCell && cond.days === wantDays && cond.passW >= 148
          && /Delacroix-Nguyen/.test(cond.name) && cond.want >= 240,
        cond.days + ' day columns at ' + cond.dayW + 'px beside a ' + cond.passW
          + 'px Passes column; the name column wants ' + cond.want
          + 'px uncapped — "' + cond.name + '"');

      /* THIS CHECK CHANGED SIDES AT WO-2.12, AND THE REVERSAL IS THE WORK ORDER.
         It used to assert the defect condition — that a long name in portrait wants MORE than the
         other columns leave, so the cap was load-bearing there and the note-panel measurements below
         were being made on a screen the defect could actually occur on. That was true against four
         day columns (256px spare against a 279px name). Portrait draws ONE column now, so the same
         arithmetic comes out the other way: 688 - 160 - 72 = 456px of spare against the same 279px,
         and the name has room it did not have.

         So the claim is now the one WO-2.12 promised in its place — "full names, no truncation" —
         and it is asserted with the same numbers rather than deleted, which would have left the
         orientation measuring nothing. It is the DESK HALF of acceptance line 4: the ellipsis is
         proved not to engage on the longest name this harness can write. Whether the owner's own
         longest name reads at arm's length is still hers.

         Landscape is exempt for the reason it always was: `.attendance-panel` takes the whole screen
         there, 352px of spare against a 279px name, and nothing could overflow it. */
      if (label === 'portrait') {
        const cut = await evalJs(`(function(){
          var row = document.querySelector('[data-attendance-row="' + ${JSON.stringify(ready.student)} + '"]');
          var span = row && row.querySelector('.attendance-student-name');
          var cell = row && row.querySelector('.attendance-name');
          if (!span || !cell) return { noCell: true };
          return { over: span.scrollWidth - span.clientWidth, shown: span.textContent,
                   spanW: Math.round(span.getBoundingClientRect().width),
                   cellW: Math.round(cell.getBoundingClientRect().width),
                   cap: getComputedStyle(cell).maxWidth }; })()`);
        /* `spanW >= 100` is the guard against a vacuous pass rather than a claim about the design: a
           span of zero width has `scrollWidth - clientWidth === 0` too, and would report "not
           truncated" about a name nobody can see. 100px is well under the ~184px of text this name
           lays out to inside a cell whose other 95px is avatar, ⋯ and padding, and well over
           anything a collapsed column could produce. */
        check('a long name is drawn IN FULL in portrait — one day column leaves the name column more '
          + 'than it wants, so the cap never engages (the desk half of WO-2.12 acceptance line 4)',
          !cut.noCell && cut.over <= 0 && cond.want <= cond.spare
            && /Delacroix-Nguyen/.test(cut.shown) && cut.spanW >= 100,
          'the name is over its box by ' + cut.over + 'px (<=0 is whole) in a ' + cut.spanW
            + 'px span; the column wants ' + cond.want + 'px and ' + cond.days
            + ' day column(s) plus a ' + cond.passW + 'px Passes column leave '
            + cond.spare + 'px of a ' + cond.wrapW + 'px wrap; the cell is ' + cut.cellW
            + 'px under a cap of ' + cut.cap + ', showing ' + JSON.stringify(cut.shown));
      }

      /* `P` is in the list and it is not redundant: present is stored as NO MARK, so the panel draws
         the hint paragraph instead of the note field, and that paragraph is the widest thing this
         panel ever holds. It spilled by the same 16px, and it is the case the owner named first. */
      for (const code of ['P', 'A', 'E', 'T', 'D']) {
        const m = await evalJs(`(async function(){
          window.planbook.attendance.takeClass(${JSON.stringify(day)});
          window.planbook.attendance.setMark(${JSON.stringify(ready.student)},
            ${JSON.stringify(code)}, ${JSON.stringify(day)});
          await window.planbook.store.flush();
          window.planbook.attendance.renderAttendance();
          window.planbook.attendance.toggleDetail(${JSON.stringify(ready.student)});
          var wrap = document.querySelector('.attendance-grid-wrap');
          var field = document.querySelector('.attendance-detail-note')
                   || document.querySelector('.attendance-detail-hint');
          if (!wrap || !field) return { noPanel: true };
          var wr = wrap.getBoundingClientRect(), fr = field.getBoundingClientRect();
          var out = { spill: Math.round(fr.right - wr.right),
                      wrapOverflow: wrap.scrollWidth - wrap.clientWidth,
                      wrapClientW: wrap.clientWidth, fieldW: Math.round(fr.width),
                      panelW: Math.round(document.querySelector('.attendance-panel')
                                .getBoundingClientRect().width) };
          window.planbook.attendance.toggleDetail(${JSON.stringify(ready.student)});
          return out; })()`);

        if (m.noPanel) {
          check('the WO-2.10 note panel opens at all on ' + code + ', ' + label, false,
            'the ⋯ toggle drew no field — the measurement below cannot be made');
          continue;
        }
        /* Guarded against a vacuous pass twice over: a field of zero width, or a wrap of zero
           width, would both put the right edge "inside" the container without anything being
           readable. The defect this replaces measured spill = +16 here. */
        check('the note field sits inside the grid on ' + code + ', iPad ' + label,
          m.spill <= 0 && m.fieldW >= 80 && m.wrapClientW >= 320,
          'field right is ' + m.spill + 'px past the wrap right (<=0 is inside); field '
            + m.fieldW + 'px, wrap ' + m.wrapClientW + 'px, panel ' + m.panelW + 'px');
      }

      /* The condition underneath all four: the grid fits the box it is drawn in, so the safety
         valve never engages and nothing on this screen is reachable only by sideways swipe. */
      const valve = await evalJs(`(function(){ var w = document.querySelector('.attendance-grid-wrap');
        return { over: w.scrollWidth - w.clientWidth, clientW: w.clientWidth,
                 scrollW: w.scrollWidth }; })()`);
      check('the registry grid fits its wrap on an iPad in ' + label
        + ', so the overflow valve stays shut',
        valve.over <= 0 && valve.clientW >= 320,
        'wrap client ' + valve.clientW + ', scroll ' + valve.scrollW + ' (over by ' + valve.over + ')');
    }
    await send('Emulation.clearDeviceMetricsOverride');
    /* Put the roster back. Nothing runs after this today, but a section that leaves a student
       renamed is a trap for whichever check gets appended below it next. */
    await evalJs(`(async function(){
      var doc = window.planbook.store.getDoc();
      var stu = doc.students.filter(function(s){ return s.id === ${JSON.stringify(ready.student)}; })[0];
      if (stu) window.planbook.store.update(function(){
        stu.first = ${JSON.stringify(ready.was && ready.was.first)};
        stu.last = ${JSON.stringify(ready.was && ready.was.last)}; });
      await window.planbook.store.flush(); })()`);
  }
}

/* ───────── the pass card is ONE ROW on a thumb, at the cap (WO-2.11) ─────────
 *
 * The owner's report of 2026-08-07, turned into a measurement. Three open passes drew two rows of
 * buttons in landscape and three in portrait on a real iPad, while the desktop layout — same
 * markup, different media block — was correct. That asymmetry is the whole reason this section
 * exists at 768/1024 with touch on rather than in the desk pass: the defect lived entirely inside
 * `@media (pointer: coarse)`, so every fine-pointer check in this file was green while the device
 * the screen is FOR was wrong.
 *
 * THREE CARDS, NOT TWO. The cap is three per class and three is where the row is tightest; the
 * two-card case elsewhere in this file passed throughout the defect.
 */
console.log('\n--- the pass card is one row at the cap of three (emulated iPad, both orientations) ---');
{
  await send('Emulation.clearDeviceMetricsOverride');
  await new Promise(r => setTimeout(r, 200));

  const biggest = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    if (!doc) return null;
    var best = null, n = -1;
    doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c.id; } });
    return n >= 3 ? { id: best, students: n } : null; })()`);

  if (!biggest) {
    skip('the pass card stays one row with three open, on an iPad in both orientations',
      'no unarchived class with three students is on the device at this point in the run — a state, '
        + 'not a pass');
  } else {
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + biggest.id + '"]');
    await new Promise(r => setTimeout(r, 300));

    /* Whatever earlier sections left open, taken back through the card's own Cancel rather than
       through the seam — it writes nothing, so this costs the document nothing to arrive at a known
       three. A loop with a bound rather than `while`, because a Cancel that stopped working would
       otherwise hang the run instead of failing it. */
    for (let i = 0; i < 6; i++) {
      if (!(await has('.attendance-pass-card [data-pass-cancel]'))) break;
      await clickSel('.attendance-pass-card [data-pass-cancel]');
      await new Promise(r => setTimeout(r, 120));
    }
    /* Issued through the buttons a teacher taps, one type each, so the chip on each card is a
       different width and the widest one is really on screen. */
    for (const type of ['bathroom', 'nurse', 'quick']) {
      const sel = '#attendanceBody [data-pass-issue][data-pass-type="' + type + '"]';
      if (await has(sel)) await clickSel(sel);
      await new Promise(r => setTimeout(r, 120));
    }

    const MEASURE = `(function(){
      var cards = Array.prototype.slice.call(document.querySelectorAll('.attendance-pass-card'));
      return cards.map(function(c){
        var main = c.querySelector('.attendance-pass-card-main');
        if (!main) return null;
        var kids = Array.prototype.slice.call(main.children).filter(function(e){
          var r = e.getBoundingClientRect(); return r.width || r.height; });
        if (!kids.length) return null;
        var heights = kids.map(function(e){ return e.getBoundingClientRect().height; });
        var btn = function(s){ var e = c.querySelector(s); if (!e) return null;
          var r = e.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left) }; };
        var back = btn('[data-pass-return]'), cancel = btn('[data-pass-cancel]');
        return {
          /* THE SINGLE-ROW TEST. A flex row that has not wrapped is exactly as tall as its tallest
             child; one that has wrapped is about twice that. 2px of slack for subpixel rounding at
             deviceScaleFactor 2 — not enough to swallow a wrapped row, which costs 44 or more. */
          mainH: Math.round(main.getBoundingClientRect().height),
          tallest: Math.round(Math.max.apply(null, heights)),
          back: back, cancel: cancel,
          /* The gap between the two buttons, measured rather than assumed: it is the one dimension
             that was explicitly not allowed to give in buying this row back. */
          gap: (back && cancel) ? Math.round(cancel.l - (back.l + back.w)) : null,
          chip: ((c.querySelector('.attendance-pass-card-type') || {}).textContent || '').trim(),
          name: ((c.querySelector('.attendance-pass-card-name') || {}).textContent || '').trim()
        };
      }).filter(Boolean); })()`;

    for (const [w, h, label] of [[768, 1024, 'portrait'], [1024, 768, 'landscape']]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await new Promise(r => setTimeout(r, 300));
      /* Repainted after the resize for the reason the note-panel section gives above: this grid
         reads `window.innerWidth` when it is drawn, not when it is measured. */
      await evalJs('window.planbook.attendance.renderAttendance()');
      await new Promise(r => setTimeout(r, 250));

      const isCoarse = await evalJs("matchMedia('(pointer: coarse)').matches");
      const cards = await evalJs(MEASURE);
      const wrapped = (cards || []).filter(c => c.mainH > c.tallest + 2);
      const small = (cards || []).filter(c =>
        !c.back || !c.cancel || c.back.h < 44 || c.cancel.h < 44 || c.back.w < 44 || c.cancel.w < 44);
      const tight = (cards || []).filter(c => c.gap === null || c.gap < 8);

      if (isCoarse !== true) {
        check('the emulated iPad-' + label + ' pointer really is coarse (else this measures the '
          + 'desk pass, where the defect never was)', false, 'matchMedia = ' + isCoarse);
      } else if (!cards || cards.length < 3) {
        check('three passes are open, so the row is measured where it is tightest, iPad ' + label,
          false, 'cards on screen = ' + (cards ? cards.length : 'no banner at all')
            + ' — the cap is three and three is the case that broke');
      } else {
        check('the pass card is ONE ROW with three open, on an iPad in ' + label,
          wrapped.length === 0,
          cards.length + ' card(s); ' + cards.map(c => c.name.split(',')[0] + ' ' + c.mainH + 'px'
            + ' vs tallest child ' + c.tallest + 'px').join(' · ')
            + (wrapped.length ? ' — WRAPPED: ' + JSON.stringify(wrapped.map(c => c.name)) : ''));
        check('Return and Cancel still clear 44px and stay 8px+ apart on that one row, iPad ' + label,
          small.length === 0 && tight.length === 0,
          cards.map(c => (c.back ? c.back.w + '×' + c.back.h : 'no Return') + ' / '
            + (c.cancel ? c.cancel.w + '×' + c.cancel.h : 'no Cancel') + ' gap ' + c.gap).join(' · '));
        if (label === 'portrait') {
          /* The chip carries the word and NOT the glyph, asserted where it was spent: the emoji came
             off to buy this row, and portrait is the orientation that could not afford it. */
          check('the type chip on each card is a word with no emoji, which is what paid for the row',
            cards.every(c => /^[A-Za-z]+$/.test(c.chip)),
            JSON.stringify(cards.map(c => c.chip)));
        }
      }
    }
    await send('Emulation.clearDeviceMetricsOverride');
    /* The three passes taken back the way they were issued. Nothing runs after this today, but a
       section that leaves three students marked out of the room is a trap for whatever gets
       appended below it — and Cancel is the one exit that leaves the document as it found it. */
    for (let i = 0; i < 6; i++) {
      if (!(await has('.attendance-pass-card [data-pass-cancel]'))) break;
      await clickSel('.attendance-pass-card [data-pass-cancel]');
      await new Promise(r => setTimeout(r, 120));
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  }
}

/* ───────── portrait shows today, landscape shows the week (WO-2.12) ─────────
 *
 * The owner's answer, 2026-08-07, to the four-five-or-six question WO-2.8 escalated: none of the
 * three. In portrait this screen is held at the classroom door to mark TODAY, so portrait draws
 * today's column alone and landscape keeps the week.
 *
 * MEASURED ON THE OWNER'S OWN SIZES rather than on 768/1024. Her iPad is an 834pt 11″, which is the
 * width that made this work order necessary — the width budget drew FIVE columns there, not the four
 * the WO-2.8 note leads with, and a check written at 768 would have been measuring a device nobody
 * in this project owns.
 *
 * THE ROTATION IS NOT SIMULATED. Nothing here calls renderAttendance() between the two orientations,
 * because "with no reload" is half of acceptance line 2 and the whole of the repaint this work order
 * added: the device metrics change, the `(orientation: portrait)` media query flips, and the grid
 * either redraws itself or it does not. A harness that repainted the screen by hand would go green
 * against a build with no listener in it at all — which is exactly what the build looked like before
 * this work order, and what every other section of this file works around by rendering after each
 * resize.
 */
console.log('\n--- portrait shows today, landscape shows the week (WO-2.12) ---');
{
  await send('Emulation.clearDeviceMetricsOverride');
  await new Promise(r => setTimeout(r, 200));

  const roster = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    if (!doc) return null;
    var best = null, n = -1;
    doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c; } });
    return n >= 1 ? { id: best.id, student: best.roster[0], students: n } : null; })()`);

  if (!roster) {
    skip('portrait draws one day column and landscape six, on one device with no reload',
      'no unarchived class with a roster is on the device at this point in the run — a state, not '
        + 'a pass');
  } else {
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + roster.id + '"]');
    await new Promise(r => setTimeout(r, 300));
    const day = await evalJs('window.planbook.attendance.todayISO()');

    /* What the screen is made of, in one read: the columns and their dates, the Passes column, the
       wrap's own overflow, and the mark on one cell. The glyph is read off the CELL ITSELF, which is
       the `<button class="attendance-cell" data-attendance-cell>` — not off its `<td>`, which can
       carry the time caption too and would make "T8:14a" of what should be one letter (the WO-2.10
       reader rule, and the first version of this block got it wrong in the other direction by
       looking for `.attendance-cell` INSIDE the hook rather than on it). */
    const CELL_SEL = '#attendanceBody [data-attendance-cell="' + roster.student
      + '"][data-attendance-date="' + day + '"]';
    const READ = `(function(){
      var head = document.getElementById('attendanceHead');
      var wrap = document.getElementById('attendanceGridWrap');
      var passTh = head && head.querySelector('.attendance-passes');
      var cols = head ? Array.prototype.slice.call(head.querySelectorAll('th[data-attendance-col]'))
        .map(function(th){ return th.getAttribute('data-attendance-col'); }) : [];
      var cell = document.querySelector(${JSON.stringify(CELL_SEL)});
      return { cols: cols,
               passW: passTh ? Math.round(passTh.getBoundingClientRect().width) : 0,
               over: wrap ? wrap.scrollWidth - wrap.clientWidth : -1,
               wrapW: wrap ? wrap.clientWidth : 0,
               mark: cell ? cell.textContent.trim() : '',
               inner: window.innerWidth + 'x' + window.innerHeight,
               coarse: matchMedia('(pointer: coarse)').matches,
               portrait: matchMedia('(orientation: portrait)').matches }; })()`;

    /* ── the owner's 11″, held upright ── */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    const up = await evalJs(READ);

    check('the emulated 11″ really is coarse and really is portrait (else everything below measures '
      + 'some other device)', up.coarse === true && up.portrait === true,
      up.inner + ', coarse = ' + up.coarse + ', portrait = ' + up.portrait);
    /* Acceptance line 1. THREE CLAUSES, and the second is the one that would be missed: a grid that
       drew one column of the wrong DATE would satisfy "exactly one" perfectly. */
    check('portrait draws exactly one day column, it is today\'s, and the Passes column is still there',
      up.cols.length === 1 && up.cols[0] === day && up.passW >= 148,
      up.cols.length + ' day column(s) ' + JSON.stringify(up.cols) + ' against today = '
        + JSON.stringify(day) + ', beside a ' + up.passW + 'px Passes column, at ' + up.inner);
    /* Acceptance line 5, portrait half — the WO-2.10 defect this must not reopen. Guarded against a
       vacuous pass by the wrap having a plausible width: a wrap of zero cannot overflow either. */
    check('and the grid fits its wrap in portrait, so the overflow valve stays shut',
      up.over <= 0 && up.wrapW >= 320,
      'the grid is over its own box by ' + up.over + 'px in a ' + up.wrapW + 'px wrap');

    /* A mark made at the door, in portrait, on the one column there is — through the cell a teacher
       taps, round the real cycle. It is what the rotation below has to still be holding.

       WALKED TO `A` RATHER THAN TAPPED ONCE, and the difference matters: one tap on a `?` means
       PRESENT, present is stored as no entry at all, and a check that then asked the document what
       it held would be asking about an absence of data. `A` is a mark that exists in both places, so
       "still on the cell" and "still in the record" are two claims rather than one. */
    let walked = '';
    for (let i = 0; i < 6 && walked !== 'A'; i++) {
      await clickSel(CELL_SEL);
      await new Promise(r => setTimeout(r, 140));
      walked = (await evalJs(READ)).mark;
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    const marked = await evalJs(READ);
    check('a cell in that one column still takes a mark, so the door is a working screen and not a '
      + 'read-only one', marked.mark === 'A' && marked.cols.length === 1,
      'the cell reads ' + JSON.stringify(marked.mark) + ' across ' + marked.cols.length + ' column(s)');

    /* ── the same device, turned. Nothing repaints this by hand; see the header. ── */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1112, height: 834, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 500));
    const across = await evalJs(READ);
    const stored = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var rec = (doc.attendance || []).filter(function(r){
        return r.classId === ${JSON.stringify(roster.id)} && r.date === ${JSON.stringify(day)}; })[0];
      var m = rec && rec.marks ? rec.marks[${JSON.stringify(roster.student)}] : null;
      return m && typeof m === 'object' ? m.code : m; })()`);

    /* Acceptance line 2, and it is the listener that is under test rather than the arithmetic. */
    check('turning the same device to landscape draws six again — no reload, and nothing repainted '
      + 'it by hand', across.cols.length === 6 && across.portrait === false && across.cols[0] === day,
      across.cols.length + ' day column(s) at ' + across.inner + ', most recent = '
        + JSON.stringify(across.cols[0]) + ' against today = ' + JSON.stringify(day));
    /* The DESK HALF of acceptance line 3, and it does not close it: scroll position and a thumb
       mid-tap need the real device. What a desk can answer is that the turn did not cost the mark —
       on the glass and in the document, because a repaint that redrew from a stale copy would put
       the right letter on screen over the wrong record. */
    check('and the mark made in portrait is still on the cell and still in the document after the turn',
      across.mark === marked.mark && across.mark !== '' && stored === across.mark,
      'the cell read ' + JSON.stringify(marked.mark) + ' before the turn and '
        + JSON.stringify(across.mark) + ' after it; the document holds ' + JSON.stringify(stored));
    /* Acceptance line 5, landscape half. */
    check('and the grid still fits its wrap in landscape, so the valve stays shut in both orientations',
      across.over <= 0 && across.wrapW >= 320,
      'the grid is over its own box by ' + across.over + 'px in a ' + across.wrapW + 'px wrap');

    /*
      TURNED AGAIN, AND AGAIN, AND AGAIN — the check the shipped build would have failed and the
      one above would not. The owner's iPad on 2026-08-07: the first turn worked, the turn back did
      not, a reload restored the week, and the next turn into portrait did nothing. Everything above
      this point turns the device ONCE, and a listener that fires once and dies passes all of it.

      Four more turns rather than one, because "once" and "twice" are the two answers a broken
      trigger gives. What it cannot reproduce is WHY the shipped one died — WebKit collecting an
      unreferenced MediaQueryList is not a thing Chrome does, and stale post-rotation metrics are not
      a thing CDP emulation has — so this is a check on the SYMPTOM. The two causes are answered in
      src/attendance.js at the listener, and a build that keeps a live trigger by any means passes.
    */
    const cycle = [[834, 1112, 1], [1112, 834, 6], [834, 1112, 1], [1112, 834, 6]];
    const turns = [];
    for (const [w, h] of cycle) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      /* Longer than the app's own settle delay: the third and last look a turn takes is at 400ms,
         and a harness that read at 300 would be timing the wait rather than the app. */
      await new Promise(r => setTimeout(r, 700));
      const now = await evalJs(READ);
      turns.push({ at: now.inner, cols: now.cols.length, mark: now.mark });
    }
    check('and it goes on turning — four more flips, no reload, each one drawing the count that '
      + 'orientation asks for',
      turns.every((t, i) => t.cols === cycle[i][2]),
      turns.map((t, i) => t.at + ' → ' + t.cols + ' column(s), wanted ' + cycle[i][2]).join(' · '));
    check('and the mark survives all four, so a repaint on every turn is still not a reset',
      turns.every(t => t.mark === marked.mark),
      'the cell read ' + JSON.stringify(marked.mark) + ' before the first turn and '
        + JSON.stringify(turns.map(t => t.mark)) + ' across the four');

    /*
      AN UNLOCKED PAST COLUMN, AND THE TURN THAT TAKES IT OFF THE SCREEN. Not an acceptance line —
      it is the defect this work order opens if the repaint only counts columns. `editingPast` is
      module state and survives a render, so unlocking Tuesday in landscape and turning the iPad
      upright leaves `editDate()` answering Tuesday with no Tuesday on screen: every cell in today's
      column comes back read-only and the banner above them names a day that is not there. A teacher
      at the door cannot mark anybody, and nothing about it looks like a rotation bug.

      Driven through the ✏ a teacher taps, in landscape where a past column exists to unlock, and
      read after the turn as the two things she would actually notice: the "not on today" banner is
      down, and today's cell is a button again.
    */
    const past = await evalJs(`(function(){
      var ths = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead [data-attendance-edit]'));
      return ths.length ? ths[ths.length - 1].getAttribute('data-attendance-edit') : ''; })()`);
    if (!past) {
      skip('turning the iPad upright locks a past column that is no longer on screen',
        'the landscape grid offered no past column with an unlock on it — a state, not a pass');
    } else {
      await clickSel('#attendanceHead [data-attendance-edit="' + past + '"]');
      await new Promise(r => setTimeout(r, 250));
      const unlocked = await evalJs(`(function(){
        var b = document.getElementById('attendanceBanner');
        return { banner: b && !b.classList.contains('hidden'),
                 editing: !!document.querySelector('#attendanceHead th[data-attendance-col="'
                   + ${JSON.stringify(past)} + '"] [data-attendance-lock]') }; })()`);
      await send('Emulation.setDeviceMetricsOverride',
        { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
      await new Promise(r => setTimeout(r, 500));
      const turned = await evalJs(`(function(){
        var b = document.getElementById('attendanceBanner');
        var cell = document.querySelector(${JSON.stringify(CELL_SEL)});
        return { banner: b && !b.classList.contains('hidden'),
                 cols: document.querySelectorAll('#attendanceHead th[data-attendance-col]').length,
                 tappable: !!cell && cell.tagName === 'BUTTON' }; })()`);
      check('turning the iPad upright with a past column unlocked puts the screen back on today — '
        + 'the day being edited is not on screen any more, so it does not go on holding the marks',
        unlocked.banner === true && unlocked.editing === true
          && turned.banner === false && turned.cols === 1 && turned.tappable === true,
        'landscape: "not on today" banner up = ' + unlocked.banner + ', the column carries a lock = '
          + unlocked.editing + '; after the turn: banner up = ' + turned.banner + ', '
          + turned.cols + ' column(s), today\'s cell is tappable = ' + turned.tappable);
    }

    /* Put the mark back. The cycle is P → A → E → T → D → P, so tapping round to present is what
       leaves the document as this section found it — and it is the only exit that writes nothing
       permanent, since present is stored as no mark at all. */
    for (let i = 0; i < 6; i++) {
      const now = (await evalJs(READ)).mark;
      if (now === 'P' || now === '') break;
      await clickSel(CELL_SEL);
      await new Promise(r => setTimeout(r, 120));
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');

    /* ── acceptance line 6: a NARROW LAPTOP WINDOW, which is landscape ──
       The trap this closes is a portrait rule written as a width rule. A browser window dragged to
       900px is 900px of a screen that is still wider than it is tall, the teacher at that window is
       at a desk reading a week, and a build that answered "narrow, therefore today" would take the
       week off the only device it is for.

       NOT RENDERED BY HAND ANY MORE, and the change is the point. This block used to call
       renderAttendance() itself, on the reasoning that landscape → landscape fires no orientation
       change and a window drag had never repainted this grid. That reasoning is what the 2026-08-07
       fix overturned: the repaint now hangs off `resize` as well, guarded by a comparison against
       the count on screen, so a drag across a budget boundary redraws and a drag within one does
       nothing. Measuring it with a hand render would go green against a build that had lost the
       listener again — which is the failure that shipped.

       Two windows rather than one. 900px is the width the acceptance line names and the budget
       answers with five; 1280 is the control that proves the same code still reaches six, so a build
       that had capped every fine-pointer window at five would not pass this pair. */
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    for (const [w, h, want] of [[900, 700, 5], [1280, 900, 6]]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      /* Longer than the app's own settle delay, since the last of the three looks a turn takes is
         the one that has to land here. */
      await new Promise(r => setTimeout(r, 700));
      const desk = await evalJs(READ);
      check('a ' + w + 'px laptop window is LANDSCAPE and keeps its week — ' + want
        + ' day columns, not one',
        desk.cols.length === want && desk.cols.length > 1 && desk.portrait === false
          && desk.coarse === false && desk.over <= 0,
        desk.cols.length + ' day column(s) at ' + desk.inner + ' (portrait = ' + desk.portrait
          + ', coarse = ' + desk.coarse + '), budget = (' + w
          + ' - 80 chrome - 280 name - 160 Passes) / 72; over its box by ' + desk.over + 'px');
    }

    /*
     * ── PAGING ACROSS A TURN — the second thing the owner found, 2026-08-07 ──
     *
     * "If I click Earlier three times and turn to portrait, I see 8/4 instead of today." Two separate
     * defects behind one symptom, and both are checked here.
     *
     * THE POSITION WAS COUNTED IN WINDOWS. `dayColumns()` sliced at `offset * count`, so the number
     * standing for where the teacher is got multiplied by a number that changes when the iPad turns:
     * three taps is eighteen weekdays back at six columns and three weekdays back at one. Now it is
     * counted in weekdays and the STEP is the window, so the anchor survives any change of width —
     * including a laptop drag, which is the same bug with a smaller jump and no rotation in it.
     *
     * AND PORTRAIT SHOULD NOT HAVE A POSITION AT ALL. Her rule: in portrait this screen shows today.
     * Pinned at the paint rather than on the turn, because a turn is only one of the ways into an
     * upright screen — a window dragged tall, a Split View pane, a boot in portrait.
     */
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1112, height: 834, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 700));

    /* The pager's own state, which is a claim about what a thumb can reach rather than about dates. */
    const PAGER = `(function(){
      /* Scoped to the pager: the "not on today" banner carries its own data-attendance-page="today"
         button, and an unscoped query would sometimes read that one instead. */
      var pick = function(dir){
        var b = document.querySelector('#attendancePager [data-attendance-page="' + dir + '"]');
        return b ? { there: true, off: !!b.disabled, title: b.title || '' }
                 : { there: false, off: false, title: '' }; };
      return { earlier: pick('earlier'), later: pick('later'), today: pick('today') }; })()`;

    const EARLIER = '#attendancePager [data-attendance-page="earlier"]';
    const TODAY_BTN = '#attendancePager [data-attendance-page="today"]';
    const page = async (sel, times) => {
      for (let i = 0; i < times; i++) {
        await clickSel(sel);
        await new Promise(r => setTimeout(r, 200));
      }
    };

    await page(EARLIER, 3);
    const back3 = await evalJs(READ);
    check('three taps of Earlier in landscape walk a whole window at a time — six columns, and today '
      + 'is not one of them',
      back3.cols.length === 6 && back3.cols.indexOf(day) < 0,
      'leftmost ' + JSON.stringify(back3.cols[0]) + ' across ' + back3.cols.length
        + ' column(s) at ' + back3.inner + '; today = ' + JSON.stringify(day));

    /* THE REPORTED SYMPTOM, exactly as she described it. Under the old build this read 8/4. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 700));
    const upright = await evalJs(READ);
    const uprightPager = await evalJs(PAGER);
    check('turning to portrait while paged three windows back shows TODAY, not the day the old '
      + 'arithmetic landed on',
      upright.cols.length === 1 && upright.cols[0] === day,
      upright.cols.length + ' column(s) ' + JSON.stringify(upright.cols) + ' at ' + upright.inner
        + '; today = ' + JSON.stringify(day));
    /* Disabled and still on screen, which is this strip's own answer for `Later` at today — a control
       that vanishes on rotation is a control the teacher goes hunting for. The tooltip is checked
       because it is the only place the backfill route is written down for her. */
    check('and the page controls are disabled in portrait rather than gone, and say to turn the iPad',
      uprightPager.earlier.there && uprightPager.earlier.off
        && uprightPager.later.there && uprightPager.later.off
        && /turn the ipad/i.test(uprightPager.earlier.title),
      'Earlier: there = ' + uprightPager.earlier.there + ', disabled = ' + uprightPager.earlier.off
        + ', title = ' + JSON.stringify(uprightPager.earlier.title) + '; Later disabled = '
        + uprightPager.later.off);

    /* Acceptance for part C: landscape comes back on the week ending today, because portrait zeroed
       the position rather than hiding it. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1112, height: 834, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 700));
    const backAcross = await evalJs(READ);
    check('and turning back to landscape lands on the week ending today, not on the page portrait '
      + 'was not allowed to keep',
      backAcross.cols.length === 6 && backAcross.cols[0] === day,
      backAcross.cols.length + ' column(s), leftmost ' + JSON.stringify(backAcross.cols[0])
        + ' against today = ' + JSON.stringify(day));

    /*
      THE ANCHOR, with no rotation in it at all — a laptop window dragged from six columns to five.
      The old window arithmetic slid the teacher from twelve weekdays back to ten without her touching
      anything; an anchor counted in days cannot. Read as "the leftmost column is the SAME DATE",
      which is the claim, rather than as a date this harness would have to compute for itself.
    */
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 700));
    await page(EARLIER, 2);
    const wide = await evalJs(READ);
    await send('Emulation.setDeviceMetricsOverride',
      { width: 900, height: 700, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 700));
    const narrow = await evalJs(READ);
    check('dragging a laptop window from six columns to five keeps the day you were looking at — it '
      + 'shows fewer days, it does not move you',
      wide.cols.length === 6 && narrow.cols.length === 5 && narrow.cols[0] === wide.cols[0]
        && wide.cols[0] !== day,
      'leftmost was ' + JSON.stringify(wide.cols[0]) + ' across ' + wide.cols.length
        + ' column(s) at 1280, and is ' + JSON.stringify(narrow.cols[0]) + ' across '
        + narrow.cols.length + ' at 900');

    /* Back to today, so the next section finds this screen where it expects it. */
    await clickSel(TODAY_BTN);
    await new Promise(r => setTimeout(r, 250));
    await send('Emulation.clearDeviceMetricsOverride');
  }
}

/* ───────── attendance totals render cost (WO-2.13) ───────── */
console.log('\n--- attendance totals render cost (WO-2.13) ---');
{
  const timing = await evalJs(`(function(){
    var s=window.planbook.store, a=window.planbook.attendance, c=window.planbook.classes;
    var d=s.getDoc(), old=JSON.stringify(d), oldClass=c.getSelectedClassId();
    var cls=(d.classes||[])[0]; if(!cls) return {fixture:false,why:'no class'};
    var ids=[]; d.students=[]; cls.roster=[];
    for(var i=0;i<27;i++){var id='wo213-student-'+i;ids.push(id);d.students.push({id:id,first:'Student',last:String(i)});cls.roster.push(id);}
    cls.terms=[{id:'tm_wo213',label:'Quarter 1',start:'2026-01-01',end:'2026-03-31'}];
    d.attendance=[];
    for(var day=0;day<175;day++){
      var date=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10), marks={};
      if(day===1||day===89)marks[ids[0]]={code:'A'};
      if(day===2)marks[ids[0]]={code:'T'};
      d.attendance.push({classId:cls.id,date:date,marks:marks});
    }
    for(var extra=0;extra<700;extra++)d.attendance.push({classId:'wo213-other-'+extra,date:'2025-01-01',marks:{}});
    c.selectClass(cls.id); a.renderAttendance();
    var samples=[];
    for(var run=0;run<9;run++){var start=performance.now();a.renderAttendance();samples.push(performance.now()-start);}
    samples.sort(function(x,y){return x-y;});
    var hasCount=typeof a.resetMeetingDatesCallCount==='function'&&typeof a.meetingDatesCallCount==='function';
    var calls=null;if(hasCount){a.resetMeetingDatesCallCount();a.renderAttendance();calls=a.meetingDatesCallCount();}
    var target='2026-03-31';a.editPastDay(target);a.setFilter('A');a.toggleDetail(ids[0]);
    var rowSel='[data-attendance-row="'+ids[0]+'"] .attendance-student-totals';
    var detailSel='[data-attendance-detail-row] .attendance-detail-totals';
    var beforeRow=(document.querySelector(rowSel)||{}).textContent||'';
    var beforeDetail=(document.querySelector(detailSel)||{}).textContent||'';
    var beforeClass=(document.getElementById('attendanceTotals')||{}).textContent||'';
    var threw='';try{a.setMark(ids[0],'P',target);}catch(e){threw=e&&e.message||String(e);}
    var afterRow=(document.querySelector(rowSel)||{}).textContent||'';
    var afterDetail=(document.querySelector(detailSel)||{}).textContent||'';
    var afterClass=(document.getElementById('attendanceTotals')||{}).textContent||'';
    a.setFilter('all');a.setMark(ids[0],'A',target);a.setFilter('A');
    var unconfirmThrew='';try{a.unconfirmAll(target);}catch(e){unconfirmThrew=e&&e.message||String(e);}
    var afterUnconfirmDetail=(document.querySelector(detailSel)||{}).textContent||'';
    var result={fixture:true,records:d.attendance.length,meetings:175,rows:ids.length,
      median:samples[4],samples:samples,calls:calls,beforeRow:beforeRow,afterRow:afterRow,
      beforeDetail:beforeDetail,afterDetail:afterDetail,beforeClass:beforeClass,afterClass:afterClass,
      threw:threw,unconfirmThrew:unconfirmThrew,afterUnconfirmDetail:afterUnconfirmDetail};
    var restored=JSON.parse(old);Object.keys(d).forEach(function(k){delete d[k];});Object.assign(d,restored);
    s.update(function(){});if(oldClass)c.selectClass(oldClass);a.setFilter('all');a.renderAttendance();return result;
  })()`);
  console.log('MEASURE | renderAttendance() at 875 records / 175 meetings / 27 rows | '
    + (timing && timing.fixture ? timing.median.toFixed(2)+' ms median | '+JSON.stringify(timing.samples)
      : 'fixture failed: '+JSON.stringify(timing)));
  check('the WO-2.13 performance fixture is exactly 875 records / 175 meetings / 27 rows',
    timing && timing.fixture && timing.records === 875 && timing.meetings === 175 && timing.rows === 27,
    JSON.stringify(timing && {records:timing.records,meetings:timing.meetings,rows:timing.rows}));
  check('meetingDates() is called a constant two times for a dated-term render',
    timing && (timing.calls === null || timing.calls === 2), timing ? timing.calls+' call(s)' : 'fixture did not run');
  check('a filtered-out row and its open detail repaint exact term/year totals after a mark',
    timing && !timing.threw
      && timing.beforeRow === 'Quarter 1 · P 87 · T 1 · A 2 · E 0 · D 0 · 98%'
      && timing.afterRow === 'Quarter 1 · P 88 · T 1 · A 1 · E 0 · D 0 · 99%'
      && timing.beforeDetail === 'Quarter 1: P 87 · T 1 · A 2 · E 0 · D 0 · 98% | Year: P 172 · T 1 · A 2 · E 0 · D 0 · 99%'
      && timing.afterDetail === 'Quarter 1: P 88 · T 1 · A 1 · E 0 · D 0 · 99% | Year: P 173 · T 1 · A 1 · E 0 · D 0 · 99%'
      && timing.beforeClass === timing.afterClass,
    JSON.stringify(timing && {row:[timing.beforeRow,timing.afterRow],
      detail:[timing.beforeDetail,timing.afterDetail],class:[timing.beforeClass,timing.afterClass],threw:timing.threw}));
  check('unconfirmAll() repaints an open detail under an active filter without throwing',
    timing && !timing.unconfirmThrew
      && timing.afterUnconfirmDetail === 'Quarter 1: P 87 · T 1 · A 2 · E 0 · D 0 · 98% | Year: P 172 · T 1 · A 2 · E 0 · D 0 · 99%',
    JSON.stringify(timing && {detail:timing.afterUnconfirmDetail,threw:timing.unconfirmThrew}));
}

/* ───────── recorded-meeting counts and Roll Call! percentage (WO-2.4) ───────── */
console.log('\n--- recorded-meeting counts and Roll Call! percentage (WO-2.4) ---');
{
  const result = await evalJs(`(function(){
    var s = window.planbook.store, a = window.planbook.attendance;
    var classes = window.planbook.classes, d = s.getDoc();
    var cls = (d.classes || [])[0], student = cls && (cls.roster || [])[0];
    /* A MISSING FIXTURE IS A FAILURE, NOT A SKIP. This returned null, and the caller turned that
       into one skip() that swallowed all ten checks while the suite still exited 0 — the same
       shape as the term guard below, one level up, and the reason it is spelled out twice is that
       this file produced it twice. The caller now asserts on fixture presence, so a class or
       roster that changes under this block fails loudly instead of quietly measuring nothing.
       NO BACKTICKS IN THIS COMMENT — it lives inside a template literal. */
    if (!cls || !student) {
      return { fixture:false,
        why: cls ? 'the first class has an empty roster' : 'no class in the document' };
    }
    /* What the screen was showing before this block moved it. selectClass() navigates since
       WO-1.13 and writes the openClassId preference, so a block that calls it and walks away
       leaves the next section on a different class and a different view. This one is currently
       last in the file, which makes that harmless TODAY and a trap for whoever appends after it —
       the sections at the touch-target sweep restore both, and so does this now. */
    var oldClassId = classes.getSelectedClassId();
    var classViewEl = document.getElementById('classView');
    var oldView = classViewEl && !classViewEl.classList.contains('hidden') ? 'class' : 'home';
    classes.selectClass(cls.id);
    /* NARROWED 2026-08-08. This read "if (!term) return null", which turned one missing term into
       ten skipped checks while the suite still exited 0 — and a check that cannot run is the same
       defect as one that cannot fail. Only the two rendered-DOM checks below need a live selected
       term to write dates onto; the other eight build their own window object and never touch it.
       A missing term now costs exactly those two, and says so.
       NO BACKTICKS IN THIS COMMENT — it lives inside a template literal. */
    var oldAttendance = JSON.stringify(d.attendance || []), oldEvents = JSON.stringify(d.events || []);
    var oldStudents = JSON.stringify(d.students || []), oldRoster = JSON.stringify(cls.roster || []);
    var oldTerms = JSON.stringify(cls.terms || []);
    /* AND IF IT HAS NONE, LEND IT ONE. The fixture class is the legacy no-terms shape on purpose
       (see the seeding comment far above), so asking it for a term and giving up is how ten checks
       came to skip on every run. The id is shaped like a generated one because this document is
       read by id-format checks; it is removed again in the restore below, so nothing downstream
       sees it either way. Dates start empty, which is what newTerm() ships and is a valid term. */
    if (!(cls.terms || []).length) {
      cls.terms = [{ id:'tm_wo24fixt', label:'Quarter 1', start:'', end:'' }];
    }
    var term = classes.getSelectedTerm();
    var oldTerm = term ? {start:term.start, end:term.end} : null;
    var dates = ['2026-09-01','2026-09-03','2026-09-08','2026-09-11','2026-09-14',
      '2026-09-18','2026-09-21','2026-09-24','2026-09-29','2026-10-02'];
    d.attendance = dates.map(function(date, i){ return { classId: cls.id, date: date,
      marks: i === 4 ? Object.fromEntries([[student, {code:'E'}]]) : {} }; });
    d.attendance.push({classId:cls.id,date:'2026-09-04',exception:'dropped'});
    d.attendance.push({classId:'another-class',date:'2026-10-06',marks:{}});
    d.events = [{id:'fixture-day-off',kind:'no-school',title:'Fixture holiday',
      date:'2026-09-07',endDate:'2026-09-07',classIds:[]}];
    var excused = a.attendanceTotals(cls.id, student);
    var fixtureStudent = 'wo-2-4-no-marks';
    d.students.push({id:fixtureStudent,first:'Fixture',last:'Student'});
    cls.roster.push(fixtureStudent);
    var noMarks = a.attendanceTotals(cls.id, fixtureStudent);
    var dated = a.termTotals(cls.id, fixtureStudent,
      {start:'2026-09-01',end:'2026-09-14'});
    var datedDom = null, undatedDom = null;
    if (term) {
      term.start = '2026-09-01'; term.end = '2026-09-14';
      a.renderAttendance();
      datedDom = {
        classText:(document.getElementById('attendanceTotals') || {}).textContent || '',
        studentText:((document.querySelector('[data-attendance-row="' + fixtureStudent
          + '"] .attendance-student-totals') || {}).textContent || '')
      };
      term.start = ''; term.end = ''; a.renderAttendance();
      undatedDom = {
        classText:(document.getElementById('attendanceTotals') || {}).textContent || '',
        studentText:((document.querySelector('[data-attendance-row="' + fixtureStudent
          + '"] .attendance-student-totals') || {}).textContent || '')
      };
    }
    d.attendance.push({classId:cls.id,date:'2026-10-05',
      marks:Object.fromEntries([[student,{code:'U'}]])});
    var withU = a.attendanceTotals(cls.id, student);
    var zero = a.attendanceTotals(cls.id, 'student-with-no-meetings', '2030-01-01', '2030-12-31');
    /* TEN, NOT THREE. At N=3 the three newest dates were all plain meetings and the dropped day
       sat outside the window entirely, so a lastMeetings() that never excluded dropped days would
       have passed a check whose name claims it counts meetings rather than days. Ten reaches back
       across 2026-09-04 (dropped) and 2026-09-07 (no school, no record), so both now have to be
       skipped for this to pass. The expected list is every taken date but the oldest. */
    var last = a.lastMeetings(cls.id, 10, '2026-10-31');
    var snowBefore = a.stateOf(cls.id, '2026-09-03');
    d.events.push({id:'retro-snow',kind:'no-school',title:'Retroactive snow',
      date:'2026-09-03',endDate:'2026-09-03',classIds:[]});
    var snowAfter = a.stateOf(cls.id, '2026-09-03');
    d.attendance = JSON.parse(oldAttendance); d.events = JSON.parse(oldEvents);
    d.students = JSON.parse(oldStudents); cls.roster = JSON.parse(oldRoster);
    if (term && oldTerm) { term.start = oldTerm.start; term.end = oldTerm.end; }
    cls.terms = JSON.parse(oldTerms);
    a.renderAttendance();
    return {fixture:true, excused:excused, withU:withU, noMarks:noMarks, dated:dated,
      datedDom:datedDom, undatedDom:undatedDom, hadTerm:!!term, zero:zero, last:last,
      snowBefore:snowBefore, snowAfter:snowAfter,
      oldClassId:oldClassId, oldView:oldView};
  })()`);
  /* Asserted rather than skipped. See the note at the top of the block: a fixture that has gone
     missing must cost a red line, because the alternative is ten checks silently measuring
     nothing behind a green summary — which is what this block did until 2026-08-08. */
  check('the WO-2.4 fixture has a class with a roster member to count',
    !!result && result.fixture === true,
    result ? (result.why || 'class and roster member present') : 'the block did not run at all');
  if (result && result.fixture) {
    check('one excused absence in ten recorded meetings is 100%, with E in the numerator',
      result.excused.E === 1 && result.excused.P === 9 && result.excused.percent === 100,
      JSON.stringify(result.excused));
    check('U folds into A in totals and the denominator, without becoming a sixth displayed mark',
      result.withU.A === 1 && result.withU.meetings === 11
        && Math.abs(result.withU.percent - (10 / 11 * 100)) < 0.000001,
      JSON.stringify(result.withU));
    /* `excused.meetings === 10` is the conjunct that earns this check its name. It used to assert
       only `withU.meetings === 11` — the fact the line above already proves — so it could not fail
       independently of its neighbour, which is this work order's own recurring defect. The `withU`
       conjunct is KEPT rather than replaced: the two together say the denominator is right before
       and after the `U` row lands. The fixture lays down 12 attendance rows for this class
       (10 taken + 1 `dropped` + 1 on another-class) plus a no-school event, so 10 is the number
       that proves all three are excluded, and it is read BEFORE the `U` row exists. */
    check('dropped, no-school, untaken, and another class are absent from the denominator',
      result.excused.meetings === 10 && result.withU.meetings === 11,
      JSON.stringify({excused:result.excused.meetings, withU:result.withU.meetings}));
    check('a roster student absent from every marks object reads present at all ten meetings',
      result.noMarks.P === 10 && result.noMarks.meetings === 10 && result.noMarks.percent === 100,
      JSON.stringify(result.noMarks));
    check('termTotals applies an actual dated term window',
      result.dated.P === 5 && result.dated.meetings === 5 && result.dated.percent === 100,
      JSON.stringify(result.dated));
    /* These two, and only these two, need a live selected term to write dates onto. They skip on
       their own rather than through the block's front door — see the NARROWED note above. `(^|[^0-9])`
       in front of the 5 because a bare /5 recorded meetings/ also matches "15 recorded meetings",
       which is the assertion passing on a number it was written to reject. */
    if (!result.hadTerm) {
      skip('rendered class and student surfaces show dated-term and year counts',
        'the fixture class carries no term');
      skip('an undated term is disclosed instead of wearing its label over year totals',
        'the fixture class carries no term');
    } else {
      check('rendered class and student surfaces show dated-term and year counts',
        /(^|[^0-9])5 recorded meetings/.test(result.datedDom.classText)
          && /Year: 10 recorded meetings/.test(result.datedDom.classText)
          && /P 5/.test(result.datedDom.studentText) && /100%/.test(result.datedDom.studentText),
        JSON.stringify(result.datedDom));
      check('an undated term is disclosed instead of wearing its label over year totals',
        /Term dates not set/.test(result.undatedDom.classText)
          && /Year: 10 recorded meetings/.test(result.undatedDom.classText)
          && /Term dates not set/.test(result.undatedDom.studentText)
          && /Year/.test(result.undatedDom.studentText) && !/Quarter 1/.test(result.undatedDom.classText),
        JSON.stringify(result.undatedDom));
    }
    check('zero recorded meetings returns null percentage, not NaN or zero',
      result.zero.meetings === 0 && result.zero.percent === null, JSON.stringify(result.zero));
    /* Ten deep, so the window spans the dropped day and the no-school day and both have to be
       absent from the answer for this to pass — see the note at the call site. 2026-09-01 is the
       eleventh-newest meeting and is correctly off the end. */
    check('last N meetings is class-scoped, newest first, and counts meetings rather than days',
      JSON.stringify(result.last) === JSON.stringify(['2026-10-05','2026-10-02','2026-09-29',
        '2026-09-24','2026-09-21','2026-09-18','2026-09-14','2026-09-11','2026-09-08','2026-09-03']),
      JSON.stringify(result.last));
    check('a retroactive no-school event cannot erase an already recorded meeting',
      result.snowBefore === 'taken' && result.snowAfter === 'taken',
      result.snowBefore + ' -> ' + result.snowAfter);
  }
  /* Put the screen back where it was found. The document is restored inside the block, but the
     SELECTION and the VIEW are not part of the document — selectClass() writes a preference and
     navigates, so this is undone here through the same seam and the same control the touch-target
     sweeps use rather than by toggling `hidden` by hand, which would be a second copy of
     src/views.js's showView() living in the harness.

     Order matters: selectClass() navigates to the class view, so the selection is restored FIRST
     and the walk back to home comes after it. */
  if (result && result.oldClassId) {
    await evalJs('window.planbook.classes.selectClass('
      + JSON.stringify(result.oldClassId) + ');1');
  }
  if (result && result.oldView === 'home' && await has('#classTabBar [data-view-home]')) {
    await clickSel('#classTabBar [data-view-home]');
  }
}

/* ───────── byte-identical total objects (WO-2.13) ───────── */
console.log('\n--- byte-identical total objects (WO-2.13) ---');
{
  const exact = await evalJs(`(function(){
    var s=window.planbook.store,a=window.planbook.attendance,c=window.planbook.classes,d=s.getDoc();
    var cls=(d.classes||[])[0],student=cls&&(cls.roster||[])[0];
    if(!cls||!student)return {fixture:false};
    var oldAttendance=JSON.stringify(d.attendance||[]),oldEvents=JSON.stringify(d.events||[]);
    var dates=['2026-09-01','2026-09-03','2026-09-08','2026-09-11','2026-09-14',
      '2026-09-18','2026-09-21','2026-09-24','2026-09-29','2026-10-02'];
    d.attendance=dates.map(function(date,i){return {classId:cls.id,date:date,
      marks:i===4?Object.fromEntries([[student,{code:'E'}]]):{}};});
    d.attendance.push({classId:cls.id,date:'2026-09-04',exception:'dropped'});
    d.events=[{id:'wo213-day-off',kind:'no-school',title:'Fixture holiday',
      date:'2026-09-07',endDate:'2026-09-07',classIds:[]}];
    var excused=a.attendanceTotals(cls.id,student);
    var noMarks=a.attendanceTotals(cls.id,'wo-2-4-no-marks');
    d.attendance.push({classId:cls.id,date:'2026-10-05',
      marks:Object.fromEntries([[student,{code:'U'}]])});
    var withU=a.attendanceTotals(cls.id,student);
    var zero=a.attendanceTotals(cls.id,'student-with-no-meetings','2030-01-01','2030-12-31');
    d.attendance=JSON.parse(oldAttendance);d.events=JSON.parse(oldEvents);a.renderAttendance();
    return {fixture:true,excused:excused,noMarks:noMarks,withU:withU,zero:zero};
  })()`);
  const expected = {
    excused:{P:9,T:0,A:0,E:1,D:0,meetings:10,attended:10,percent:100},
    noMarks:{P:10,T:0,A:0,E:0,D:0,meetings:10,attended:10,percent:100},
    withU:{P:9,T:0,A:1,E:1,D:0,meetings:11,attended:10,percent:10/11*100},
    zero:{P:0,T:0,A:0,E:0,D:0,meetings:0,attended:0,percent:null}
  };
  check('attendanceTotals() returns byte-identical full objects for E, no-mark, U, and zero cases',
    exact && exact.fixture
      && JSON.stringify({excused:exact.excused,noMarks:exact.noMarks,withU:exact.withU,zero:exact.zero})
        === JSON.stringify(expected),
    JSON.stringify(exact));
}

/* ───────── the score entry grid (WO-3.5) ─────────
 *
 * Ten acceptance lines, nine of which a desk can answer and one of which cannot. The one that
 * cannot is line 6 — "the grid is usable on an iPad in landscape" — and it stays a 👤 item in
 * TESTING.md however green this block runs; what is measured here is the half a laptop can see, on
 * an emulated coarse pointer, and none of it is the line.
 *
 * WHY THIS BLOCK OPENS THE VIEW BEFORE IT MEASURES ANYTHING, which is the whole reason it exists
 * rather than a handful of lines bolted onto the sweeps above. The standing 44px sweep collects
 * `button, input, ...` across the page and skips anything whose computed `display` is `none`;
 * `.hidden` is `display: none !important` (src/shell.css), and every view but the one on screen is
 * `.hidden`. So that sweep walked past ~250 score inputs and reported green — the same shape as the
 * backup-nag escape, a green run over a fixture that cannot express the failure. Worse, until the
 * correction round of 2026-08-10 nothing in this run COULD open the view: src/screen-nav.js still
 * shipped the Scores segment disabled, so the grid had no door at all. A check that cannot fail is
 * not a check, so the coarse pass below opens the grid through the real segment first and asserts it
 * is drawn before it measures one box.
 *
 * THE FIXTURE IS docs/grade-math-cases.md CASE 1, DRIVEN THROUGH THE KEYBOARD. A class of 25 with
 * Tests 50 / Quizzes 30 / Homework 20, its own four-band letter scale so that 87% is a B rather than
 * the document default's B+, and case 1's three assignments — plus seven empty ones, which change no
 * grade (an assignment with no cell for a student contributes 0/0) and are there so the grid is wider
 * than the viewport and the two frozen columns have something to be frozen against. Every score below
 * is typed as keystrokes AT THE PAGE, never assigned to `.value`: the claim is a keyboard path, and a
 * harness that sets values and dispatches `input` would be asserting that src/shell.js's listener
 * works, which is not what the acceptance line says.
 *
 * THE SCORES DIFFER PER ROW ON PURPOSE. A column of 25 identical numbers stores the same map whether
 * the build wrote it against the drawn row order or against the roster order, and this class's roster
 * is deliberately stored BACKWARDS from the order the grid sorts into. So the map is the claim: row i
 * gets 60 + i, and the check reads the students off the drawn rows.
 *
 * THE FIXTURE COMES BACK OUT at the foot of the block — the class, its students, its work and its
 * score columns — the way the assignments section takes its own down. Not a document snapshot, for a
 * reason particular to this block: it reloads the page twice, and a snapshot parked on `window` does
 * not survive a reload.
 */
console.log('\n--- the score entry grid (WO-3.5) ---');
{
  const scoreSeam = await evalJs("!!(window.planbook && window.planbook.scores"
    + " && typeof window.planbook.scores.renderScores === 'function'"
    + " && window.planbook.classes && window.planbook.gradeEngine && window.planbook.assignments)");

  if (!scoreSeam) {
    skip('the score grid: 25 down a column, Enter at the bottom, Esc mid-column, three flags, a '
      + 'cleared key, case 1 to the digit, the category move, and the weights crossing 100 both ways',
      'no window.planbook.scores seam on the page — it is kept deliberately so this file can read '
      + 'what a keystroke wrote, so its absence is a defect and not a stage of the build');
  } else {
    /* Back to a laptop before anything is measured: the sections above leave the browser on an
       emulated tablet, and eight of the checks below are about a keyboard. The coarse half of this
       block turns touch on again for itself. */
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);

    /* One key, dispatched AT THE PAGE rather than at an element, which is most of the claim — the
       same helper and the same reasoning as the WO-2.5 keyboard section above. A printable key needs
       `keyDown` with `text` or `e.key` arrives as the raw code; Enter, Escape, the arrows and
       Backspace take the `rawKeyDown` shape, which still reaches the editing pipeline. */
    const sk = async (k, code, vk, text) => {
      const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
        modifiers: 0 };
      if (text) ev.text = text;
      await send('Input.dispatchKeyEvent',
        Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
      await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
      await new Promise(r => setTimeout(r, 45));
    };
    const skEnter = () => sk('Enter', 'Enter', 13);
    const skEsc = () => sk('Escape', 'Escape', 27);
    const skBack = () => sk('Backspace', 'Backspace', 8);
    const skUp = () => sk('ArrowUp', 'ArrowUp', 38);
    const skLetter = (L) => sk(L, 'Key' + L, L.charCodeAt(0), L);
    const skDigits = async (n) => {
      for (const d of String(n).split('')) await sk(d, 'Digit' + d, d.charCodeAt(0), d);
    };
    /* One keystroke-group: the digits of a score, and the Enter that commits it and moves down. */
    const skScore = async (n) => { await skDigits(n); await skEnter(); };

    const A1 = 'wo35-a1', A2 = 'wo35-a2', A3 = 'wo35-a3', P1 = 'wo35-p1';
    const cellSel = (a, s) => '#scoresBody [data-score-cell="' + a + '"][data-score-student="'
      + s + '"]';
    const focusCell = (a, s) => clickSel(cellSel(a, s));

    /*
      THE FIXTURE. Planted through the store rather than through the controls, and that is the one
      place this block departs from the assignments section's rule of driving everything: 25 students,
      three categories, ten assignments and a per-class letter scale is twenty minutes of clicking
      that proves nothing this file has not proved elsewhere. Every SCORE — which is what this work
      order is about — is typed.
    */
    const plant = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return { ok:false, why:'no year document is open' };
      var students = [], roster = [];
      for (var i = 1; i <= 25; i++) {
        var n = (i < 10 ? '0' : '') + i;
        students.push({ id:'wo35-s' + n, first:'Score', last:'Row' + n });
        roster.push('wo35-s' + n);
      }
      /* BACKWARDS. The grid sorts surname then first name (src/scores.js's gridOrder), so the drawn
         order is Row01..Row25 and the stored roster is the exact reverse of it. A column typed down
         the screen and written against the roster order would land twenty-five scores on the wrong
         twenty-five students and look perfectly fine doing it. */
      roster.reverse();
      var work = [
        { id:'wo35-a1', classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-tests',
          name:'Unit test', points:100, assigned:'', due:'2026-09-18' },
        { id:'wo35-a2', classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-quiz',
          name:'Quiz one', points:20, assigned:'', due:'' },
        { id:'wo35-a3', classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-home',
          name:'HW one', points:10, assigned:'', due:'' }
      ];
      /* Seven with nothing in them. An assignment with no cell for a student contributes 0/0, so
         these change no grade below — what they change is the WIDTH of the grid, which is what the
         two frozen columns exist for and what a three-column fixture could not have tested. */
      for (var j = 1; j <= 7; j++) {
        work.push({ id:'wo35-p' + j, classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-tests',
          name:'Filler ' + j, points:10, assigned:'', due:'' });
      }
      var was = c.getSelectedClassId();
      s.update(function(doc){
        doc.classes.push({ id:'c_wo35', name:'WO-3.5 Grid', archived:false,
          terms:[{ id:'tm_wo35', label:'WO-3.5 Term', start:'', end:'' }],
          categories:[{ id:'wo35-tests', name:'Tests', weight:50 },
                      { id:'wo35-quiz', name:'Quizzes', weight:30 },
                      { id:'wo35-home', name:'Homework', weight:20 }],
          /* Its own bands, so 87 is a B rather than the document default's B+ — which is the letter
             docs/grade-math-cases.md case 1 names, and the reason that file says "unless a case says
             otherwise". */
          letterScale:[{ letter:'A', min:90 }, { letter:'B', min:80 },
                       { letter:'C', min:70 }, { letter:'F', min:0 }],
          roster: roster });
        students.forEach(function(st){ doc.students.push(st); });
        work.forEach(function(a){ doc.assignments.push(a); });
      });
      /* Navigates and repaints the class bar, and deliberately paints no screen and no strip — which
         is why the tab is then clicked for real: that is the route that runs src/shell.js's chain. */
      c.selectClass('c_wo35');
      return { ok:true, rows: roster.length, columns: work.length, was: was,
        drawnFirst: 'wo35-s01', rosterFirst: roster[0] };
    })()`);

    if (!plant.ok) {
      check('the WO-3.5 fixture is real: a class of 25 with case 1\'s three weighted categories',
        false, plant.why);
    } else {
      await clickSel('#classTabBar [data-class-tab="c_wo35"]');
      await new Promise(r => setTimeout(r, 250));

      const READ = `(function(){
        var view = document.getElementById('scoresView');
        var body = document.getElementById('scoresBody');
        var head = document.getElementById('scoresHead');
        var rows = Array.prototype.slice.call(body.querySelectorAll('tr[data-score-row]'));
        var banner = document.getElementById('scoresNoGrade');
        var summary = document.getElementById('scoresSummary');
        var strip = document.querySelector('#scoresView [data-screen-nav]');
        var segs = strip ? Array.prototype.slice.call(strip.querySelectorAll('.screen-nav-btn')) : [];
        return {
          shown: !view.classList.contains('hidden'),
          classShown: !document.getElementById('classView').classList.contains('hidden'),
          /* A view lives in <main>. A dialog would not, and would carry the semantics beside it. */
          inMain: !!view.closest('main'),
          dialogBits: view.querySelectorAll('[role="dialog"], [aria-modal], .modal-overlay').length,
          openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
          headline: (document.getElementById('scoresHeadline')||{}).textContent,
          students: rows.map(function(r){ return r.getAttribute('data-score-row'); }),
          grades: rows.map(function(r){
            var n = r.querySelector('.scores-grade-num');
            return n ? n.textContent : (r.querySelector('.scores-grade-none') ? '—' : ''); }),
          letters: rows.map(function(r){
            var l = r.querySelector('.scores-grade-letter'); return l ? l.textContent : ''; }),
          heads: Array.prototype.slice.call(head.querySelectorAll('th.scores-col')).map(function(th){
            return { name: (th.querySelector('.scores-col-name')||{}).textContent,
                     chip: ((th.querySelector('.cat-chip')||{}).textContent||'')
                       .replace(/\\s+/g,' ').trim() }; }),
          summary: (summary ? summary.textContent : '').replace(/\\s+/g,' ').trim(),
          bannerUp: banner ? !banner.classList.contains('hidden') : null,
          bannerText: ((document.getElementById('scoresNoGradeText')||{}).textContent||'')
            .replace(/\\s+/g,' ').trim(),
          /* The word the owner's 2026-08-09 rule forbids ON A FIGURE, asked of the three surfaces
             that carry one and NOT of the whole view: the standing hint under the grid uses the word
             in order to tell the teacher it is never used, and a search of the view would go red
             about the sentence that states the rule. */
          provisional: /provisional/i.test(body.textContent)
            || /provisional/i.test(summary ? summary.textContent : '')
            || /provisional/i.test(banner ? banner.textContent : ''),
          segHooks: segs.map(function(b){ return b.getAttribute('data-class-screen'); }),
          segDisabled: segs.map(function(b){ return b.disabled; })
        }; })()`;

      /* Flushed before every read, for tools/README.md trap 6: every save is debounced, so a read
         taken a moment after a keystroke can be looking at the document from before it. */
      const readDoc = () => evalJs(`(async function(){ await window.planbook.store.flush();
        var d = window.planbook.store.getDoc();
        var sc = d.scores || {};
        /* Every cell in the WHOLE document that is a null with no flag — the shape acceptance line 4
           says must never be written — and every cell that is a bare number rather than an object.
           Asked of everything rather than of this fixture, so a second writer added later cannot pass
           by being somewhere else. */
        var nulls = [], bare = [];
        Object.keys(sc).forEach(function(a){
          Object.keys(sc[a]).forEach(function(s){
            var cell = sc[a][s];
            if (typeof cell !== 'object' || cell === null) { bare.push(a + '/' + s); return; }
            if ((cell.v === null || cell.v === undefined) && !cell.flag) nulls.push(a + '/' + s); }); });
        return { keys: Object.keys(sc), nulls: nulls, bare: bare,
                 a1: sc['wo35-a1'] ? JSON.stringify(sc['wo35-a1']) : null,
                 a1has: sc['wo35-a1'] ? Object.keys(sc['wo35-a1']) : [],
                 all: JSON.stringify(sc),
                 weights: JSON.stringify((d.classes.filter(function(c){
                   return c.id === 'c_wo35'; })[0] || {}).categories || []) }; })()`);

      const onClass = await evalJs(READ);
      check('the WO-3.5 fixture is real: a class of 25 opens on Attendance, and its roster is stored in the reverse of the order the grid draws',
        onClass.classShown && !onClass.shown && plant.rows === 25 && plant.columns === 10
          && plant.rosterFirst === 'wo35-s25',
        plant.rows + ' student(s), ' + plant.columns + ' assignment(s); the roster starts at '
          + plant.rosterFirst + ' where the grid draws ' + plant.drawnFirst + ' first');

      /*
        THE DOOR, which is defect 1 of the 2026-08-10 correction round. The grid shipped with the
        Scores segment disabled and carrying no `data-class-screen`, so nothing — not a teacher, not
        this file — could reach the view at all; index.html asserted that src/screen-nav.js needed no
        change for it, and that file had never been opened. One tap on the real segment is the claim.

        AND THE PREFERENCE IS STILL `class`, which is src/views.js's REMEMBERED_AS and the owner's
        rule that a class always reopens on Attendance. Asserted here rather than after a reload
        because the write happens on the way IN — showView() collapses every class screen to `class`
        as it stores it — which is the half a check made after a reload cannot tell from a read-side
        fix that left `scores` sitting in localStorage.
      */
      /*
        THE DOOR CHECK IS ALSO A GATE, and it is a gate because of what happened when this section
        was first negative-tested: with the Scores segment disabled again, clickSel found nothing,
        threw, and took the whole run down before it printed a summary. A missing fixture is a failed
        check in this file and never a crash — the roster block says so in as many words — so the
        hook is asked for before it is clicked, and everything below it is announced as SKIPPED
        rather than quietly not run. A skip is not a pass.
      */
      const doorOk = await evalJs("!!document.querySelector("
        + "'#classView [data-class-screen=\"scores\"]')");
      if (!doorOk) {
        check('the Scores segment is a live door: one tap lands on the grid, a view in <main> with no dialog anywhere in it, and the reload preference still says class',
          false,
          'the segment carries no data-class-screen hook — hooks '
            + JSON.stringify(onClass.segHooks) + ', disabled '
            + JSON.stringify(onClass.segDisabled)
            + '. Drawn and greyed is the state WO-3.5 shipped in and the 2026-08-10 correction round removed.');
        skip('the rest of WO-3.5 — 25 down a column, Enter at the bottom, Esc mid-column, the three flags, the cleared key, case 1 to the digit, the category move, the weights crossing 100 both ways, and the coarse-pointer sweep',
          'the grid has no door, so nothing below it could be driven the way a teacher would reach it');
      } else {
        await clickSel('#classView [data-class-screen="scores"]');
        await new Promise(r => setTimeout(r, 250));
        const opened = await evalJs(READ);
        const openView = await evalJs(
          "JSON.parse(localStorage.getItem('planbook_openView') || 'null')");
        check('the Scores segment is a live door: one tap lands on the grid, a view in <main> with no dialog anywhere in it, and the reload preference still says class',
          opened.shown && !opened.classShown && opened.inMain
            && opened.dialogBits === 0 && opened.openModals === 0
            && opened.segHooks.join(',') === 'class,assignments,scores'
            && opened.segDisabled.every((d) => d === false)
            && openView === 'class',
          'grid up = ' + opened.shown + ', in <main> = ' + opened.inMain + ', dialog bits = '
            + opened.dialogBits + ', segment hooks = ' + JSON.stringify(opened.segHooks)
            + ', disabled = ' + JSON.stringify(opened.segDisabled)
            + ', openView preference = ' + JSON.stringify(openView));

        /*
          ACCEPTANCE LINE 1. Twenty-five scores down one column in twenty-five keystroke-groups, with no
          mouse — and "no mouse" is COUNTED rather than asserted by the harness not having called
          clickSel. A page-side listener installed after the arrival tap catches a build that needs a
          click between rows, which is exactly the failure the line is about.
        */
        await focusCell(A1, 'wo35-s01');
        await evalJs(`(function(){
          window.__wo35mouse = 0;
          window.__wo35count = function(){ window.__wo35mouse++; };
          ['mousedown','mouseup','click'].forEach(function(t){
            document.addEventListener(t, window.__wo35count, true); });
          return 1; })()`);
        for (let i = 1; i <= 25; i++) await skScore(60 + i);
        await new Promise(r => setTimeout(r, 150));
        const typed = await readDoc();
        const afterColumn = await evalJs(READ);
        const mouse = await evalJs('window.__wo35mouse');
        const wantColumn = {};
        afterColumn.students.forEach((id, i) => { wantColumn[id] = { v: 61 + i }; });
        check('twenty-five scores go down one column in twenty-five keystroke-groups with no mouse, and land on the students in DRAWN row order rather than in roster order',
          mouse === 0 && afterColumn.students.length === 25
            && typed.a1 === JSON.stringify(wantColumn)
            && afterColumn.students[0] === 'wo35-s01' && afterColumn.students[24] === 'wo35-s25',
          'mouse events during the column = ' + mouse + '; drawn order ran '
            + afterColumn.students[0] + ' → ' + afterColumn.students[24] + '; stored column = '
            + String(typed.a1).slice(0, 96) + ' …');

        /*
          ACCEPTANCE LINE 2. The twenty-fifth Enter above was pressed at the bottom of the column, so
          this reads what it did: the caret is still in the last cell, its value is selected so the next
          thing typed overtypes rather than appends, and the live region says which student and how many
          are in. A wrap would have put the teacher back at the top of a class she had just finished,
          where the next number overwrites the first student's mark.
        */
        const bottom = await evalJs(`(function(){ var a = document.activeElement;
          return { cell: a ? a.getAttribute('data-score-cell') : '',
                   student: a ? a.getAttribute('data-score-student') : '',
                   value: a ? a.value : '',
                   selected: a ? (a.selectionEnd - a.selectionStart) : -1,
                   said: (document.getElementById('srLive')||{}).textContent || '' }; })()`);
        check('Enter at the bottom of a column keeps the caret where it is with the value selected for overtyping, and says which student and how many are in',
          bottom.cell === A1 && bottom.student === 'wo35-s25' && bottom.value === '85'
            && bottom.selected === 2 && /last student/.test(bottom.said)
            && /25 of 25/.test(bottom.said),
          JSON.stringify(bottom));

        /*
          ACCEPTANCE LINE 7, proved by pressing the key rather than by arguing the screen is a view.
          Twice, two thirds of the way down, with a freshly typed digit in the field: nothing closes,
          nothing navigates, the caret does not move, what was typed survives and no dialog appears.
          There is no Escape binding in src/scores.js at all, which is what makes this true — so the
          check is written to fail against a build that added one "helpfully".
        */
        await focusCell(A1, 'wo35-s16');
        await skEnter();
        await skDigits(9);
        const escBefore = await evalJs(`(function(){ var a = document.activeElement;
          return { student: a.getAttribute('data-score-student'), value: a.value,
                   caret: a.selectionStart }; })()`);
        await skEsc();
        await skEsc();
        const escAfter = await evalJs(`(function(){ var a = document.activeElement;
          var view = document.getElementById('scoresView');
          return { student: a ? a.getAttribute('data-score-student') : '(focus left the grid)',
                   value: a ? a.value : '', caret: a ? a.selectionStart : -1,
                   shown: !view.classList.contains('hidden'),
                   openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length }; })()`);
        check('Esc pressed twice mid-column closes nothing and loses nothing — the screen is still up, the caret is in the same cell, and what was typed into it is still there',
          escAfter.shown && escAfter.openModals === 0
            && escBefore.student === 'wo35-s17' && escAfter.student === 'wo35-s17'
            && escBefore.value === '9' && escAfter.value === '9'
            && escAfter.caret === escBefore.caret,
          JSON.stringify(escBefore) + ' -> ' + JSON.stringify(escAfter));
        /* The 9 typed to give Esc something to lose comes back off and the row's own mark goes back on,
           through the keyboard like everything else, so the arithmetic below is case 1's and not this
           check's leftovers. */
        await skBack();
        await skDigits(77);

        /*
          ACCEPTANCE LINE 5. docs/grade-math-cases.md case 1, to the digit, on the row whose Tests mark
          the column above happened to make 80: Tests 80/100, Quizzes 18/20, Homework 10/10 against
          weights 50/30/20 is 87%, and this class's own bands make that a B. Both extra cells are typed
          through the keyboard like everything else, and the figure is read off the SCREEN — the engine
          is asked separately, so a screen doing its own arithmetic could not pass by agreeing with
          itself.
        */
        await focusCell(A3, 'wo35-s01');
        for (let i = 1; i <= 25; i++) await skScore(10);
        await focusCell(A2, 'wo35-s20');
        await skDigits(18);
        await new Promise(r => setTimeout(r, 150));
        const case1 = await evalJs(READ);
        const engine = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
          var cls = d.classes.filter(function(c){ return c.id === 'c_wo35'; })[0];
          var g = window.planbook.gradeEngine.weightedClassGrade(d, cls, 'tm_wo35', 'wo35-s20');
          return { percentage: g.percentage, letter: g.letter, reason: g.reason }; })()`);
        const row20 = case1.students.indexOf('wo35-s20');
        check('the displayed grade is docs/grade-math-cases.md case 1 to the digit — 87.0% and a B — and the screen and the engine agree about it',
          row20 >= 0 && case1.grades[row20] === '87.0%' && case1.letters[row20] === 'B'
            && engine.percentage === 87 && engine.letter === 'B' && engine.reason === null
            && case1.bannerUp === false && case1.provisional === false,
          'screen ' + case1.grades[row20] + ' ' + case1.letters[row20] + ' :: engine '
            + engine.percentage + ' ' + engine.letter);

        /*
          ACCEPTANCE LINE 8, INHERITED FROM WO-3.3, and the box that only this claim can tick. The
          assignment moves from Tests (50%) to Homework (20%) through the real <select> in the real
          editor, and EVERY displayed grade in the class has to move on that keystroke — no weight
          changes, no score changes, and walking the weights across 100 could never have discharged it.

          Case 1's row goes 87.0% -> 86.7%: Quizzes keep 90% at 30, Homework becomes (80 + 10) / 110 =
          81.81…% at 20, Tests is empty so its 50 redistributes, and 90 x 30/50 + 81.81… x 20/50 =
          86.72…%. Hand-computed here rather than asked of the engine, for the reason the case above is:
          an engine and a screen that agree with each other and disagree with the arithmetic is exactly
          what this file exists to catch.

          THE EDITOR IS OPENED THROUGH THE SEAM, and that is the one exception in this block. No control
          on the score grid opens an assignment editor — there is deliberately no second door to the
          assignment list from here, and index.html says why — so no tap can get the dialog on screen
          over this view. What is DRIVEN is the part the acceptance line is about: the real <select>,
          the real `change` event, and src/shell.js's real hook.
        */
        const beforeMove = await evalJs(READ);
        const beforeDoc = await readDoc();
        await evalJs("window.planbook.assignments.openAssignmentEditor('wo35-a1'); 1");
        await new Promise(r => setTimeout(r, 250));
        const pickCategory = async (id) => {
          await evalJs(`(function(){
            var s = document.querySelector('#assignmentFields [data-assignment-category]');
            if (!s) return 0;
            s.value = ${JSON.stringify(id)};
            s.dispatchEvent(new Event('change', { bubbles: true }));
            return 1; })()`);
          await new Promise(r => setTimeout(r, 250));
        };
        await pickCategory('wo35-home');
        const afterMove = await evalJs(READ);
        const afterMoveDoc = await readDoc();
        const movedRows = afterMove.students.filter((id, i) =>
          afterMove.grades[i] !== beforeMove.grades[i]).length;
        const a1Head = afterMove.heads.filter((h) => h.name === 'Unit test')[0] || {};
        check('moving an assignment to another category moves EVERY displayed grade in the class on the keystroke — case 1\'s row 87.0% -> 86.7%, with no weight and no score touched',
          beforeMove.grades[row20] === '87.0%' && afterMove.grades[row20] === '86.7%'
            && movedRows === 25
            && /Homework/.test(a1Head.chip) && /20%/.test(a1Head.chip)
            && afterMoveDoc.all === beforeDoc.all
            && afterMoveDoc.weights === beforeDoc.weights,
          movedRows + ' of 25 displayed grades moved; case 1\'s row ' + beforeMove.grades[row20]
            + ' -> ' + afterMove.grades[row20] + '; that column head now reads '
            + JSON.stringify(a1Head.chip) + '; scores byte-identical = '
            + (afterMoveDoc.all === beforeDoc.all) + ', weights byte-identical = '
            + (afterMoveDoc.weights === beforeDoc.weights));

        /* And back, through the same control — the half of a move a build can get right on the way out
           and wrong on the way home, and it puts case 1 back for the two checks below. */
        await pickCategory('wo35-tests');
        await evalJs("window.planbook.closeModal('assignmentModal'); 1");
        await new Promise(r => setTimeout(r, 200));
        const backAgain = await evalJs(READ);
        check('and moving it back restores every displayed grade, so the chain runs in both directions rather than only on the way out',
          backAgain.grades[row20] === '87.0%'
            && JSON.stringify(backAgain.grades) === JSON.stringify(beforeMove.grades),
          'case 1\'s row is ' + backAgain.grades[row20] + ' again, and all 25 match = '
            + (JSON.stringify(backAgain.grades) === JSON.stringify(beforeMove.grades)));

        /*
          ACCEPTANCE LINES 9 AND 10, INHERITED FROM WO-3.1 — the weights taken off 100 and put back,
          through the real weight field in the real categories editor, reached from the class manager
          the way a teacher reaches it. The banner has to stand where the number was and NAME the total;
          no grade may be shown at all; and the word "provisional" may appear on no figure.

          The disappearing half first, which is the one the work order warns a build can pass while
          getting wrong.
        */
        await clickSel('header [data-class-manage]');
        await new Promise(r => setTimeout(r, 350));
        await clickSel('#classList [data-category-manage="c_wo35"]');
        await new Promise(r => setTimeout(r, 350));
        const typeWeight = async (v) => {
          await evalJs(`(function(){
            var f = document.querySelector('#categoryList [data-category-id="wo35-tests"]'
              + '[data-category-field="weight"]');
            if (!f) return 0;
            f.value = ${JSON.stringify(String(v))};
            f.dispatchEvent(new Event('input', { bubbles: true }));
            return 1; })()`);
          await new Promise(r => setTimeout(r, 250));
        };
        await typeWeight(40);
        const unbalanced = await evalJs(READ);
        check('no grade is shown at all while the weights do not total 100, the banner stands where the number was and names the total, and no figure wears a "provisional" label',
          unbalanced.bannerUp === true && /90%/.test(unbalanced.bannerText)
            && /not 100%/.test(unbalanced.bannerText)
            && unbalanced.grades.length === 25 && unbalanced.grades.every((g) => g === '—')
            && unbalanced.letters.every((l) => l === '')
            && /Class average —/.test(unbalanced.summary)
            && unbalanced.provisional === false,
          'banner up = ' + unbalanced.bannerUp + ' :: '
            + JSON.stringify(unbalanced.bannerText.slice(0, 96)) + ' :: distinct grade cells = '
            + JSON.stringify([...new Set(unbalanced.grades)]) + ' :: '
            + JSON.stringify(unbalanced.summary.slice(0, 64)));

        await typeWeight(50);
        const balanced = await evalJs(READ);
        check('and the grades come back the moment the weights reach 100 again — the crossing works in both directions, with the categories panel still open over the grid',
          balanced.bannerUp === false && balanced.grades[row20] === '87.0%'
            && balanced.letters[row20] === 'B'
            && JSON.stringify(balanced.grades) === JSON.stringify(beforeMove.grades)
            && /Weights total 100%/.test(balanced.summary),
          'banner up = ' + balanced.bannerUp + ', case 1\'s row is ' + balanced.grades[row20] + ' '
            + balanced.letters[row20] + ', and all 25 match = '
            + (JSON.stringify(balanced.grades) === JSON.stringify(beforeMove.grades)));
        await evalJs("window.planbook.closeModal('categoriesModal');"
          + "window.planbook.closeModal('classesModal'); 1");
        await new Promise(r => setTimeout(r, 250));

        /*
          ACCEPTANCE LINE 3. The three flags, set from the keyboard, read back as COMPUTED STYLE rather
          than as class names: the claim is that a teacher can tell them apart, and a class name on an
          element whose rule was deleted is a class name that says nothing. Four ways apart — the fill,
          the border, the corner glyph and the accessible name — and blank has none of them, because a
          blank that is styled is a blank that looks like a state somebody chose.

          The caret is parked on a fourth cell before the read: `.scores-input:focus` carries a wash of
          its own, and measuring a flag on the cell that still has focus would be measuring the two
          rules together.
        */
        await focusCell(A1, 'wo35-s01');
        await skLetter('L');
        await focusCell(A1, 'wo35-s02');
        await skLetter('M');
        await focusCell(A1, 'wo35-s03');
        await skLetter('X');
        await focusCell(A1, 'wo35-s10');
        const flags = await evalJs(`(function(){
          var pick = function(a, s){
            var e = document.querySelector('#scoresBody [data-score-cell="' + a
              + '"][data-score-student="' + s + '"]');
            if (!e) return null;
            var st = getComputedStyle(e);
            var glyph = e.parentElement ? e.parentElement.querySelector('.scores-flag') : null;
            return { bg: st.backgroundColor, border: st.borderTopColor, ink: st.color,
                     glyph: glyph ? glyph.textContent : '', label: e.getAttribute('aria-label') || '',
                     placeholder: e.placeholder, value: e.value }; };
          return { late: pick('wo35-a1','wo35-s01'), missing: pick('wo35-a1','wo35-s02'),
                   excused: pick('wo35-a1','wo35-s03'), blank: pick('wo35-p2','wo35-s01') }; })()`);
        const four = [flags.late, flags.missing, flags.excused, flags.blank];
        check('late, missing and excused are three distinct fills, three distinct borders, three distinct glyphs and three distinct accessible names — and blank wears none of them',
          four.every((f) => !!f)
            && new Set(four.map((f) => f.bg)).size === 4
            && new Set(four.map((f) => f.border)).size === 4
            && flags.late.glyph === 'L' && flags.missing.glyph === 'M' && flags.excused.glyph === 'X'
            && flags.blank.glyph === ''
            && / — late$/.test(flags.late.label) && / — missing$/.test(flags.missing.label)
            && / — excused$/.test(flags.excused.label) && !/ — /.test(flags.blank.label)
            && flags.missing.value === '' && flags.excused.value === ''
            && flags.missing.placeholder === '0' && flags.excused.placeholder === 'Ex'
            && flags.blank.placeholder === '—',
          'fills ' + JSON.stringify(four.map((f) => f && f.bg)) + ' :: borders '
            + JSON.stringify(four.map((f) => f && f.border)) + ' :: glyphs '
            + JSON.stringify(four.map((f) => f && f.glyph)));

        /*
          ACCEPTANCE LINE 4, and it is the one no screenshot can answer: a cleared cell and a cell
          holding `{ v: null }` with no flag look identical on the grid and grade identically too. Two
          halves, because writeCell() makes two promises. The cell's key goes; and when the last cell in
          a column goes, the COLUMN's key goes with it, rather than leaving an empty object under an
          assignment id that every later reader would have to know about.

          Both cells are arrived at with a key rather than a click, so the value is SELECTED on arrival
          and one Backspace is the whole clear — which is also how a teacher fixing a column does it.
        */
        await focusCell(A1, 'wo35-s03');
        await skEnter();
        await skBack();
        await new Promise(r => setTimeout(r, 150));
        /* And a column with exactly one cell in it, so that its last cell leaving is the column
           leaving. wo35-p1 has never been typed into. */
        await focusCell(P1, 'wo35-s01');
        await skScore(7);
        const withColumn = await readDoc();
        await skUp();
        await skBack();
        await new Promise(r => setTimeout(r, 150));
        const cleared = await readDoc();
        check('clearing a cell deletes its key rather than storing a null with no flag, the last cell out takes the empty column key with it, and no such null exists anywhere in the document',
          cleared.a1has.indexOf('wo35-s04') === -1
            && cleared.a1has.length === 24
            && withColumn.keys.indexOf('wo35-p1') >= 0
            && cleared.keys.indexOf('wo35-p1') === -1
            && cleared.nulls.length === 0 && cleared.bare.length === 0,
          'the cleared student is still in the column = ' + (cleared.a1has.indexOf('wo35-s04') !== -1)
            + ' with ' + cleared.a1has.length + ' cell(s) left; the one-cell column went from present ('
            + (withColumn.keys.indexOf('wo35-p1') >= 0) + ') to present ('
            + (cleared.keys.indexOf('wo35-p1') >= 0) + '); nulls with no flag anywhere = '
            + JSON.stringify(cleared.nulls) + '; bare numbers anywhere = '
            + JSON.stringify(cleared.bare));

        /*
          THE TWO FROZEN COLUMNS, AND THE PAIR src/scores.css SAYS IS ASSERTED HERE. The grade column's
          `left` is a pixel offset, so it can only be right if the name column's width is known — the
          hand-computed layout src/attendance.css warns against, accepted for two columns because sticky
          arithmetic leaves no alternative. That comment claimed a check that did not exist until this
          one; the width and the offset could have drifted apart in any later edit and nothing would have
          said so. Both blocks, because the coarse block narrows the name column and has to move the
          offset with it — which is also why the two numbers are asserted to DIFFER between the blocks:
          a coarse block that had quietly stopped overriding either would otherwise pass.
        */
        const frozen = await evalJs(`(function(){
          var out = { base: {}, coarse: {}, sheet: false };
          window.__eachRule(function(r, label){
            var href = '';
            try { href = (r.parentStyleSheet && r.parentStyleSheet.href) || ''; } catch (e) {}
            if (href.indexOf('scores.css') < 0) return;
            out.sheet = true;
            var coarse = false, p = r.parentRule;
            while (p) {
              if (p.conditionText && p.conditionText.indexOf('coarse') >= 0) coarse = true;
              p = p.parentRule;
            }
            var bag = coarse ? out.coarse : out.base;
            /* Split and matched exactly, never by substring: '.scores-grade-num' contains
               '.scores-grade', and the grouped thead selector contains both of them. */
            var parts = String(label).split(',').map(function(x){ return x.trim(); });
            if (parts.indexOf('.scores-name') >= 0 && r.style.width) {
              bag.nameWidth = r.style.width; bag.nameMin = r.style.minWidth;
            }
            if (parts.indexOf('.scores-grade') >= 0 && r.style.left) bag.gradeLeft = r.style.left;
          });
          return out; })()`);
        check('the frozen name column\'s width and the frozen grade column\'s offset are the same number in the base rules and the same number again in the coarse block',
          frozen.sheet && !!frozen.base.nameWidth && !!frozen.coarse.nameWidth
            && frozen.base.nameWidth === frozen.base.gradeLeft
            && frozen.base.nameWidth === frozen.base.nameMin
            && frozen.coarse.nameWidth === frozen.coarse.gradeLeft
            && frozen.coarse.nameWidth === frozen.coarse.nameMin
            && frozen.coarse.nameWidth !== frozen.base.nameWidth,
          'base ' + JSON.stringify(frozen.base) + ' :: coarse ' + JSON.stringify(frozen.coarse));

        /*
          AND THE SAME PAIR AS A MEASUREMENT, with the grid scrolled sideways — which is the defect
          itself rather than a proxy for it. Two sticky columns whose numbers have drifted apart do not
          stop being sticky; they OVERLAP, and the student's name disappears under her own grade three
          columns into a wide term. The seven empty assignments in the fixture are here for this: a
          three-column grid at 1200px does not scroll at all, and a check over a grid that cannot move
          is a check that cannot fail.
        */
        const PIN = `(function(){
          var wrap = document.getElementById('scoresGridWrap');
          var row = document.querySelector('#scoresBody tr[data-score-row="wo35-s01"]');
          if (!wrap || !row) return null;
          wrap.scrollLeft = 260;
          var name = row.querySelector('.scores-name').getBoundingClientRect();
          var grade = row.querySelector('.scores-grade').getBoundingClientRect();
          var box = wrap.getBoundingClientRect();
          return { scrolled: wrap.scrollLeft, scrollable: wrap.scrollWidth - wrap.clientWidth,
                   overlap: Math.round((name.right - grade.left) * 100) / 100,
                   nameOff: Math.round((name.left - box.left) * 100) / 100,
                   nameW: Math.round(name.width * 100) / 100 }; })()`;
        const pinned = await evalJs(PIN);
        check('and with the grid scrolled sideways the two frozen columns stay pinned to its left edge without overlapping each other',
          !!pinned && pinned.scrollable > 0 && pinned.scrolled > 0
            && pinned.overlap <= 0.5 && Math.abs(pinned.nameOff) <= 0.5,
          JSON.stringify(pinned));

        /*
          ── THE COARSE PASS ──

          Everything above is a keyboard, and none of it is acceptance line 6. This is what a desk can
          say about the touch half: that every control on the grid clears 44px with the view OPEN, which
          is the state the standing sweep at the top of this run cannot reach. A `.hidden` view computes
          to `display: none`, that sweep skips anything that does, and so it walked past every one of
          these inputs and reported green. The grid is opened here through the real segment before a
          single box is measured, and that it is DRAWN is its own check — because a sweep over nothing
          is the failure this block exists to close.

          Line 6 itself — "usable on an iPad in landscape" — stays a 👤 item in TESTING.md. An emulator
          is not a thumb.
        */
        await send('Emulation.setDeviceMetricsOverride',
          { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
        await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
        await send('Page.reload');
        await new Promise(r => setTimeout(r, 700));
        await waitForBoot();
        await evalJs(KILL_ANIM);
        await evalJs(INSTALL_WALKER);
        const coarseNow = await evalJs("matchMedia('(pointer: coarse)').matches");
        await clickSel('#classTabBar [data-class-tab="c_wo35"]');
        await new Promise(r => setTimeout(r, 250));
        await clickSel('#classView [data-class-screen="scores"]');
        await new Promise(r => setTimeout(r, 350));
        const drawn = await evalJs(`(function(){
          var view = document.getElementById('scoresView');
          var cell = document.querySelector('#scoresBody [data-score-cell]');
          if (!view) return null;
          var vs = getComputedStyle(view);
          var r = cell ? cell.getBoundingClientRect() : { width: 0, height: 0 };
          return { hidden: view.classList.contains('hidden'), viewDisplay: vs.display,
                   cellDisplay: cell ? getComputedStyle(cell).display : '(no cell)',
                   drawn: r.width > 0 && r.height > 0,
                   cells: document.querySelectorAll('#scoresBody [data-score-cell]').length }; })()`);
        check('the score grid is OPEN and drawn under the coarse pointer, so the sweep below measures score cells rather than a display:none screen',
          coarseNow === true && !!drawn && !drawn.hidden && drawn.viewDisplay !== 'none'
            && drawn.cellDisplay !== 'none' && drawn.drawn && drawn.cells >= 200,
          'coarse pointer = ' + coarseNow + ' :: ' + JSON.stringify(drawn));

        const grid44 = await evalJs(`(function(){
          var out = [];
          document.querySelectorAll('#scoresView button, #scoresView input').forEach(function(e){
            var r = e.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            if (getComputedStyle(e).display === 'none') return;
            out.push({ t: (e.className || e.tagName), w: Math.round(r.width * 100) / 100,
                       h: Math.round(r.height * 100) / 100 }); });
          return out; })()`);
        const under44 = grid44.filter((m) => m.h < 44 || m.w < 44);
        check('every control on the open score grid measures >=44px on a coarse pointer, the score cells and the four flag buttons included',
          grid44.length >= 200 && under44.length === 0,
          'measured ' + grid44.length + ' visible control(s) with the grid open; under = '
            + JSON.stringify(under44.slice(0, 6))
            + (under44.length > 6 ? ' … and ' + (under44.length - 6) + ' more' : ''));

        const pinnedCoarse = await evalJs(PIN);
        check('and the frozen pair holds on the coarse pointer too, where the name column is narrower and the offset had to move with it',
          !!pinnedCoarse && pinnedCoarse.scrollable > 0 && pinnedCoarse.scrolled > 0
            && pinnedCoarse.overlap <= 0.5 && Math.abs(pinnedCoarse.nameOff) <= 0.5
            && !!pinned && pinnedCoarse.nameW < pinned.nameW,
          JSON.stringify(pinnedCoarse) + ' against a fine-pointer name column of '
            + (pinned ? pinned.nameW : '?') + 'px');
      }
    }

    /*
      THE FIXTURE COMES BACK OUT — the class, its twenty-five students, its ten assignments and every
      score column typed into them — and the class this block found open is put back under it. Written
      as one update rather than through the real Delete controls, for the reason the assignments
      teardown gives: a fixture coming down is not a claim being made. This is the last section in the
      file, so nothing depends on the state; it is cleaned up anyway, because a run that left a
      fixture class in the teacher's own browser is a run that wrote student data nobody asked for.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return 0;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){ return x.id !== 'c_wo35'; });
        doc.students = doc.students.filter(function(x){
          return String(x.id).indexOf('wo35-') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){ return a.classId !== 'c_wo35'; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (String(k).indexOf('wo35-') === 0) delete doc.scores[k]; });
      });
      var was = ${JSON.stringify(plant.was || '')};
      if (was) c.selectClass(was);
      c.refreshClassBar();
      await s.flush();
      return 1; })()`);
  }
}

/* ────────────────────────────── summary ────────────────────────────── */

const fails = results.filter(r => r.state === 'fail');
const skips = results.filter(r => r.state === 'skip');
console.log('\n================ SUMMARY ================');
console.log(results.length + ' checks · ' + results.filter(r => r.state === 'pass').length
  + ' passed · ' + fails.length + ' failed · ' + skips.length + ' skipped');

/* Read from disk rather than tracked as a constant, so it cannot drift from the file it describes. */
const ownLines = (await fs.readFile(fileURLToPath(import.meta.url), 'utf8')).split('\n').length;
const perCheck = results.length ? (ownLines / results.length) : 0;
console.log(ownLines.toLocaleString() + ' lines · ' + perCheck.toFixed(1) + ' lines per check · '
  + ((Date.now() - RUN_STARTED) / 1000).toFixed(0) + 's');
console.log('(health, not a gate — see plans/verification-tooling.md § "Retiring the line cap")');
if (skips.length) {
  console.log('\nSKIPPED (a skip is not a pass):');
  skips.forEach(s => console.log('  - ' + s.name + '  :: ' + s.detail));
}
if (fails.length) {
  console.log('\nFAILED:');
  fails.forEach(f => console.log('  - ' + f.name + (f.detail ? '\n      ' + f.detail : '')));
}
console.log('\nThis tool measures. It does not replace TESTING.md, and nothing here closes a 👤 item —');
console.log('the iPad checks stay owed to a human no matter how green this run is.');

try { ws.close(); } catch {}
proc.kill();
server.close();
await fs.rm(udd, { recursive: true, force: true }).catch(() => {});
process.exit(fails.length ? 1 : 0);
