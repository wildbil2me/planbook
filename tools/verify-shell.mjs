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
const proc = spawn(exe, [
  '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + udd,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
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

console.log('\n--- modal behaviour ---');
const MODAL = '#aboutModal';
const openerCount = await evalJs("document.querySelectorAll('[data-modal-open]').length");
if (!(await has(MODAL)) || openerCount < 2) {
  /* Two openers for one modal is what makes focus-return falsifiable: an implementation that
     always returns focus to the first opener on the page passes with one and fails with two. */
  skip('modal opens, traps focus, closes, and returns focus to its opener',
    'needs ' + MODAL + ' and >=2 [data-modal-open] on the page; found ' + openerCount);
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
  const activeIs = (nth) => evalJs("document.activeElement===document.querySelectorAll('[data-modal-open]')[" + nth + ']');

  const second = Math.min(2, openerCount - 1);
  await clickSel('[data-modal-open]', second);
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
  await clickSel('[data-modal-open]', other);
  const bd = await evalJs("(function(){var r=document.querySelector('" + MODAL + "').getBoundingClientRect();return {x:r.x+6,y:r.y+6}})()");
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 200));
  check('backdrop click closes the modal', !(await isOpen()));
  check('backdrop close returns focus to ITS opener, a different button', await activeIs(other));

  /* A press that starts inside the panel and ends on the backdrop is a text selection, not a
     dismissal. Closing on it loses whatever the teacher was typing. */
  await clickSel('[data-modal-open]', other);
  const ins = await evalJs("(function(){var r=document.querySelector('" + MODAL + " .modal-body').getBoundingClientRect();return {x:r.x+12,y:r.y+12}})()");
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: ins.x, y: ins.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bd.x, y: bd.y, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 200));
  check('press inside + release on the backdrop does NOT close it', await isOpen());
  await key('Escape', 'Escape', 27);
}

/* ───────────────── planbook_ keys hold UI preferences only ───────────────── */

console.log('\n--- localStorage ---');
const seam = await evalJs("typeof window.planbook==='object' && typeof window.planbook.setPref==='function'");
if (!seam) {
  skip('setPref refuses a key that is not a declared UI preference',
    'no window.planbook.setPref seam on the page (expected once the WO-1.2 shelf is gone)');
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
    'no window.planbook.store seam on the page (expected once the WO-1.2 shelf is gone)');
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
     declaration on the wrong element. */
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
}

/* ───────────────── no horizontal overflow at any breakpoint ───────────────── */

console.log('\n--- horizontal overflow ---');
for (const [w, h, dsf] of [[1024, 768, 2], [768, 1024, 2], [390, 844, 3]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const o = await evalJs('({sw:document.documentElement.scrollWidth, iw:window.innerWidth})');
  check('no horizontal overflow at ' + w + 'x' + h, o.sw <= o.iw, JSON.stringify(o));
}

/* ────────────────────────────── summary ────────────────────────────── */

const fails = results.filter(r => r.state === 'fail');
const skips = results.filter(r => r.state === 'skip');
console.log('\n================ SUMMARY ================');
console.log(results.length + ' checks · ' + results.filter(r => r.state === 'pass').length
  + ' passed · ' + fails.length + ' failed · ' + skips.length + ' skipped');
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
