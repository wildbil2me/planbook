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
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
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

async function load() {
  await send('Page.navigate', { url: 'http://127.0.0.1:' + PORT + '/index.html' });
  await new Promise(r => setTimeout(r, 2500));
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

  const clickSel = async (sel, nth) => {
    const box = await evalJs('(function(){var e=document.querySelectorAll(' + JSON.stringify(sel) + ')['
      + nth + '];var r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await new Promise(r => setTimeout(r, 150));
  };
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
await new Promise(r => setTimeout(r, 2200));
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
    const box = await evalJs("(function(){var e=document.querySelector('[data-modal-open]');var r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
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
