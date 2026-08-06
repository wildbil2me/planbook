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
  'classes', 'letterScale', 'students', 'assignments', 'scores', 'attendance', 'log', 'events',
  'templates', 'signals'];
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
    !!doc0 && doc0.schemaVersion === 1 && !!doc0.docId && doc0.hasDeviceId
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

  /* The migration hook. MIGRATIONS is empty today and that is the point — what is being
     checked is that the ladder exists, runs, and loses nothing, so that adding the first real
     step is one entry in an object rather than a rewrite of the load path. A step is installed
     here for the length of one open and removed again; the document it climbs is written
     straight into IndexedDB, the way a document from an older build would be sitting there. */
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
             storedVersion: stored && stored.schemaVersion, storedMarker: stored && stored.cameThroughTheHook };
  })()`);
  check('a document written under an older schema loads THROUGH the migration hook',
    !mig.failure && mig.ran === 1 && mig.schemaVersion === 1 && mig.marker === true,
    mig.failure ? 'openYear threw: ' + mig.failure
      : 'steps run = ' + mig.ran + ', schemaVersion now ' + mig.schemaVersion);
  check('and it loses nothing on the way up — students, scores, marks, docId, teacher',
    !mig.failure && mig.student === 'Me' && mig.score === 87 && mig.mark === 'A'
      && mig.docId === 'd_from_an_older_build' && mig.teacher === 'Older Build',
    JSON.stringify(mig));
  check('the migrated document is written back once, as a save (rev 7 -> 8), not on every open',
    !mig.failure && mig.rev === 8 && mig.storedVersion === 1 && mig.storedMarker === true,
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
      && f.doc.schemaVersion === 1
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
      repaired.schemaVersion === 1 && repaired.rev === original.rev,
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
      recovered.loadingHidden && recovered.storedVersion === 1 && recovered.students === 2
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
        && restoredAll.schemaVersion === 1
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
      tabNames: tabs.map(function(b){ return b.textContent; }),
      tabIds: tabs.map(function(b){ return b.getAttribute('data-class-tab'); }),
      addTab: !!bar.querySelector('.cls-tab-add'),
      injectedInBar: bar.querySelectorAll('b, script, i').length,
      tabChildren: tabs.reduce(function(n, b){ return n + b.children.length; }, 0),
      navLabels: Array.prototype.slice.call(nav.querySelectorAll('button')).map(function(b){ return b.textContent; }),
      navActive: Array.prototype.slice.call(nav.querySelectorAll('button.active')).map(function(b){ return b.getAttribute('data-term-select'); }),
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

const classSeam = await evalJs("!!(window.planbook && window.planbook.classes"
  + " && typeof window.planbook.classes.getSelectedTermId === 'function')");

if (!classesBooted || !classSeam) {
  skip('classes & terms: create, reorder, rename, per-class term structures, archive, delete',
    classesBooted ? 'no window.planbook.classes seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  await evalJs(INSTALL_CLASS_READER);

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
  check('each one arrives with a term structure, and with its other collections present and empty',
    made.termCounts.slice(1).every(n => n === 4) && made.rosters.every(n => n === 0)
      && made.categories.every(n => n === 0),
    'terms per class = ' + JSON.stringify(made.termCounts) + ', rosters = '
      + JSON.stringify(made.rosters) + ', categories = ' + JSON.stringify(made.categories));
  check('a class name containing markup is rendered as text — createElement, never innerHTML',
    made.tabNames.indexOf('Honors Bio <b>lab</b>') >= 0 && made.injectedInBar === 0
      && made.tabChildren === 0,
    'elements injected into the tab bar = ' + made.injectedInBar
      + ', child elements inside the tabs = ' + made.tabChildren);

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
  await clickSel('#classList .class-row:nth-child(2) [data-class-move-up]');
  const up = await evalJs('window.__cls()');
  check('the up control puts it back, and the tab order follows the document exactly',
    JSON.stringify(up.ids) === JSON.stringify(made.ids)
      && JSON.stringify(up.tabIds) === JSON.stringify(up.ids),
    JSON.stringify(up.tabNames.slice(0, 3)));
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
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-09', marks:{ s_v1:'A' } });
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-10', marks:{} });
      /* A day the class did not meet. It is destroyed too, and it is NOT a meeting — everything in
         this app counts recorded meetings (plans/rotating-schedule.md), so the confirm names the
         two kinds separately and this record is what makes that falsifiable. */
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-11', exception:'dropped' });
      d.attendance.push({ classId:${JSON.stringify(neighbourId)}, date:'2026-09-09', marks:{ s_v1:'T' } });
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
  await clickSel('#classArchivedList [data-class-restore]');
  const unarchived = await evalJs('window.__cls()');
  check('and restoring puts it back on the bar, in the place it had',
    JSON.stringify(unarchived.tabIds) === JSON.stringify(remembered.ids)
      && unarchived.archivedHidden && unarchived.archivedRows === 0,
    JSON.stringify(unarchived.tabNames));

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
    check('and switching back brings that year\'s classes and its open term back to the bar',
      backHome.tabNames.length === 6 && backHome.selectedClass === backHome.ids[1]
        && backHome.navLabels.length === 4,
      backHome.tabNames.length + ' tabs and ' + backHome.navLabels.length + ' terms back on '
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
      ids: els.map(function(c){ return c.getAttribute('data-class-tab'); }),
      activeIds: active.map(function(c){ return c.id; }),
      activeNames: active.map(function(c){ return c.name; }),
      /* Class names are teacher-typed and SIS-pasted; one of the six carries markup on purpose. */
      injected: grid.querySelectorAll('b, script, i').length,
      marked: els.filter(function(c){ return c.classList.contains('open'); })
        .map(function(c){ return c.getAttribute('data-class-tab'); }),
      current: els.filter(function(c){ return c.getAttribute('aria-current') === 'true'; }).length,
      selected: window.planbook.classes.getSelectedClassId(),
      /* Both slots, per card: present, empty of text AND of elements, and holding real height. A
         slot with nothing in it and no height is a slot that reflows the grid the day it is
         filled, which is the failure Acceptance line 4 is actually about. */
      slots: els.map(function(c){
        var s = c.querySelector('.class-card-state'), g = c.querySelector('.class-card-signals');
        return { both: !!(s && g),
                 said: ((s ? s.textContent : '') + (g ? g.textContent : '')).trim(),
                 kids: (s ? s.children.length : 0) + (g ? g.children.length : 0),
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
  check('each card reserves the space Phase 2, 3 and 4 fill and puts nothing in it yet',
    cards.slots.length === 6 && cards.slots.every(s => s.both && s.said === '' && s.kids === 0
      && s.h > 0),
    JSON.stringify(cards.slots.map(s => Math.round(s.h) + 'px reserved, '
      + (s.said === '' && s.kids === 0 ? 'empty' : 'HOLDS ' + JSON.stringify(s.said)))));

  /*
    One tap. Driven on a card that is NOT already the open one — tapping the open card would pass
    whether or not the tap does anything at all — and the answer is read from the same accessor the
    header uses, plus the header itself: the card and the tab are two views of one selection, and a
    tap that moved only the view it was on is the defect this asserts against.
  */
  const other = cards.ids.filter(id => id !== cards.selected)[0];
  await clickSel('#homeGrid .class-card[data-class-tab=' + JSON.stringify(other) + ']');
  const tapped = await evalJs(`(function(){
    var want = ${JSON.stringify(other)};
    var card = document.querySelector('#homeGrid .class-card[data-class-tab=' + JSON.stringify(want) + ']');
    var tab = document.querySelector('#classTabBar [data-class-tab=' + JSON.stringify(want) + ']');
    return { selected: window.planbook.classes.getSelectedClassId(),
             pref: window.planbook.getPref('openClassId'),
             cardMarked: !!(card && card.classList.contains('open')),
             tabMarked: !!(tab && tab.classList.contains('active')),
             marked: document.querySelectorAll('#homeGrid .class-card.open').length }; })()`);
  check('one tap on a card makes that class the open class, on the card AND on the header tab',
    tapped.selected === other && tapped.pref === other && tapped.cardMarked
      && tapped.tabMarked && tapped.marked === 1,
    JSON.stringify(tapped));

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
      under44: els.filter(function(c){ var r = c.getBoundingClientRect();
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
      fit.cards === 6 && fit.under44 === 0 && fit.lastBottom <= fit.viewport
        && fit.scrollH <= fit.viewport,
      fit.cards + ' cards in ' + fit.columns + ' column(s); last card ends at ' + fit.lastBottom
        + 'px of ' + fit.viewport + 'px, page is ' + fit.scrollH + 'px tall; '
        + fit.under44 + ' under 44px; backup nag on screen = ' + fit.nagUp
        + ', install banner hidden for the measurement = ' + fit.bannerWasUp);
  }
  /* Handed back as it was found. The touch section sets its own metrics later and the sections
     between here and it drive clicks by viewport coordinate, so a left-behind override would move
     every one of them without saying so. */
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));
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
  const NEEDLES = [...VALUE_NEEDLES, 'IEP', '504', 'ELL'];
  const foundIn = (text) => NEEDLES.filter(n => text.indexOf(n) >= 0);
  const foundValueIn = (text) => VALUE_NEEDLES.filter(n => text.indexOf(n) >= 0);

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
        && foundIn(supportBlob).length === 0
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

    /* The delete confirm, opened from the archived row the section above left behind on purpose. */
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
