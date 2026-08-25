/* build-line.mjs — which build this device is running (WO-8.10)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
const { ROOT, check, evalJs, has, clickSel } = h;

console.log('\n--- which build this device is running (WO-8.10) ---');
/*
  THE FIRST BLOCK IN THIS FILE THAT LOOKS AT A SERVICE WORKER'S WORK, and the line above the check
  count in tools/README.md — "it drives a page, not an installed app, and it has never seen a
  service worker" — needs reading precisely rather than as a prohibition. It is still true that
  nothing here installs an app, inspects a registration, or asserts anything about `fetch`
  interception. What this block reads is CACHE STORAGE, which is a window API on the page like
  localStorage and IndexedDB, and which the worker happens to be the only thing writing to.
  Measured before it was relied on: `http://127.0.0.1:<port>` is a secure context, so sw.js
  registers, activates and precaches within about a second and a half of the first navigation of a
  run, and by the time this last block runs it has been settled for three minutes.

  WHAT IS BEING GUARDED. After a deploy, the only way to learn whether the installed iPad took the
  new shell was Safari Web Inspector over USB from a Mac. The interesting question is not the
  version — sw.js uses skipWaiting + clients.claim, so `activate` deletes every cache that is not
  the current one, and ONE CACHE IS THE HEALTHY STATE. More than one means the activation did not
  finish and the app may be serving a mix, which is the failure that breaks a screen and the one a
  version string typed into index.html would hide.

  SO THE SECOND CACHE IS PLANTED BY THIS FILE. A display that has only ever shown one name has
  proved nothing about the case it exists for — that is WO-8.10's own acceptance line — and the
  plant is the only way to reach that state without waiting for a real botched deploy. It is
  cleared again in a `finally`, along with the two window.caches overrides below: a stray
  `planbook-shell-v1` would make every later reading of this line say the app is broken, and a
  window.caches left overridden would do worse quietly.

  THE STATIC CLAUSE IS HERE RATHER THAN IN wo-sweep.mjs on purpose. It reads the served tree for a
  versioned cache name outside sw.js, which is the Traps line as a grep — but it belongs beside the
  measurements that prove the line is generated, because the two halves are one claim: nothing
  types the name, and the thing that reads it moves when Cache Storage moves.
*/
{
  const swText = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const cacheM = swText.match(/const CACHE\s*=\s*'([^']+)'/);
  const CACHE_NOW = cacheM ? cacheM[1] : '';
  const PLANTED = 'planbook-shell-v1';

  /* Read the same way sw.js's own header says SHELL is read, and guarded the same way: an empty
     answer and a correct one are the same value, so a regex that stopped matching would leave
     every comparison below asserting that a sentence contains the empty string. */
  check('sw.js still declares a CACHE string this section can read (guards a vacuous pass)',
    /^planbook-shell-v\d+$/.test(CACHE_NOW), 'CACHE = ' + JSON.stringify(CACHE_NOW));

  /* The Traps line, asked of the whole served tree rather than of the one file that would be
     tempting to type it into. A build identifier that can be wrong is worse than none: a constant
     reads v64 while the browser holds v63, which is precisely the failure being reported on. */
  const servedFiles = ['index.html', 'manifest.webmanifest',
    ...(await fs.readdir(path.join(ROOT, 'src'))).filter(f => /\.(js|css)$/.test(f)).map(f => 'src/' + f)];
  const constants = [];
  for (const rel of servedFiles) {
    const text = await fs.readFile(path.join(ROOT, rel), 'utf8');
    text.split('\n').forEach((line, i) => {
      if (/planbook-shell-v\d/.test(line)) constants.push(rel + ':' + (i + 1));
    });
  }
  check('no file the browser loads carries a versioned cache name — the About line cannot be a '
    + 'constant, because a constant would report the build this tree WANTS rather than the one the '
    + 'device is holding',
    servedFiles.length > 20 && constants.length === 0,
    servedFiles.length + ' served file(s) read, sw.js excluded as the one place the name belongs'
      + (constants.length ? ' — versioned name found at ' + constants.join(', ') : ''));

  /* Everything the About line can be asked, in one round trip: whether the panel is open, the text
     a teacher reads, the names it emphasised, the class, and the computed colours — the amber is a
     claim about what the screen looks like and is read as a colour rather than as a class name. */
  const READ_BUILD = `(function(){
    var el = document.getElementById('buildCaches');
    var modal = document.getElementById('aboutModal');
    if (!el) return { found: false, open: !!(modal && !modal.classList.contains('hidden')) };
    var cs = getComputedStyle(el);
    return { found: true, open: !!(modal && !modal.classList.contains('hidden')),
      text: el.textContent, cls: el.className,
      names: Array.prototype.map.call(el.querySelectorAll('strong'), function(s){ return s.textContent; }),
      bg: cs.backgroundColor, color: cs.color }; })()`;

  /* Wait on the condition rather than on a clock (tools/README.md trap 5): the line is written
     from an awaited caches.keys() BEFORE the panel is shown, so "the modal is up and the line is
     not empty" is the state, and a fixed sleep would be a bet on how fast Cache Storage answers. */
  async function openAboutAndRead() {
    await evalJs("(function(){ Array.prototype.forEach.call("
      + "document.querySelectorAll('.modal-overlay:not(.hidden)'), function(m){"
      + " window.planbook.closeModal(m); }); return 1; })()");
    await clickSel('[data-modal-open="aboutModal"]');
    const until = Date.now() + 3000;
    let seen = await evalJs(READ_BUILD);
    while (Date.now() < until && !(seen.open && seen.text)) {
      await new Promise(r => setTimeout(r, 100));
      seen = await evalJs(READ_BUILD);
    }
    return seen;
  }
  const closeAbout = () => evalJs("window.planbook.closeModal('aboutModal'); 1");

  const cacheKeys = () => evalJs("(async function(){ return (await caches.keys()).filter("
    + "function(n){ return n.indexOf('planbook-shell-') === 0; }); })()");

  const before = await cacheKeys();
  check('a page this harness has been driving for three minutes holds exactly one shell cache, and '
    + 'it is the one sw.js names — the precondition for every reading below',
    before.length === 1 && before[0] === CACHE_NOW,
    'caches.keys() filtered to this app = ' + JSON.stringify(before) + ', sw.js CACHE = ' + CACHE_NOW);

  const one = await openAboutAndRead();
  check('the About modal names the cache the browser is actually holding, and does not say there '
    + 'is more than one',
    one.found === true && one.open === true && one.names.length === 1 && one.names[0] === CACHE_NOW
      && one.text.indexOf(CACHE_NOW) >= 0 && !/more than one/i.test(one.text)
      && one.cls.indexOf('warn') === -1,
    'names = ' + JSON.stringify(one.names) + ', class = ' + JSON.stringify(one.cls)
      + ', line = ' + JSON.stringify(one.text));
  await closeAbout();

  try {
    await evalJs("(async function(){ await caches.open('" + PLANTED + "'); return 1; })()");
    const planted = await cacheKeys();
    check('the plant took: two shell caches are on the device, which is the state a deploy that '
      + 'half-landed leaves behind',
      planted.length === 2 && planted.indexOf(PLANTED) >= 0 && planted.indexOf(CACHE_NOW) >= 0,
      'caches.keys() filtered to this app = ' + JSON.stringify(planted));

    const two = await openAboutAndRead();
    /* THE COUNT HAS TO BE SAID BEFORE THE NAMES ARE LISTED, and that clause is not fussiness — it
       is what this check needed to stop being vacuous. Written as a bare `/more than one/i` over
       the whole line it went GREEN against a mutation that deleted the opening sentence entirely
       ("⚠ Stored on this device: A and B"), because the line ENDS with "if this line still names
       more than one, send this screen on" and the phrase was still in the string. Comparing
       positions asks the thing the acceptance line actually asks — a teacher meets the number
       before she meets two cache names she has no way to compare — and it survives a rewrite of
       the sentence in a way a literal substring would not. */
    const saidAt = two.text.search(/more than one/i);
    const namedAt = two.text.indexOf(CACHE_NOW);
    check('with a second cache planted, the modal SAYS there is more than one BEFORE it lists them '
      + '— the sentence a teacher forwards, not two names side by side she would shrug at',
      saidAt >= 0 && namedAt >= 0 && saidAt < namedAt,
      '"more than one" at ' + saidAt + ', first cache name at ' + namedAt
        + ', line = ' + JSON.stringify(two.text));
    check('and it names both of them, in the order Cache Storage answers',
      two.names.length === 2 && two.names[0] === CACHE_NOW && two.names[1] === PLANTED
        && two.text.indexOf(CACHE_NOW) >= 0 && two.text.indexOf(PLANTED) >= 0,
      'names = ' + JSON.stringify(two.names) + ' against caches.keys() = ' + JSON.stringify(planted));
    /* The palette, measured rather than read off the class: `.warn` could be present with the rule
       gone, and design/style-guide.md §1 names #fff8e6 on #8a6d1a as the caution banner — the same
       amber the install banner and the backup nag wear, because a second shell IS a stale shell. */
    check('that line is drawn in the style guide\'s caution palette rather than left in the quiet '
      + 'hint grey — a warning nobody can see is not a warning',
      two.cls.indexOf('warn') >= 0 && two.bg === 'rgb(255, 248, 230)' && two.color === 'rgb(138, 109, 26)',
      'class = ' + JSON.stringify(two.cls) + ', background = ' + two.bg + ', color = ' + two.color);
    await closeAbout();

    await evalJs("(async function(){ await caches.delete('" + PLANTED + "'); return 1; })()");
    const back = await openAboutAndRead();
    /* The non-vacuity of the three above: a build that hard-coded the warning, or one that never
       re-read Cache Storage after the first open, passes all of them and fails here. */
    check('clearing that cache again puts the line back to one name with the caution gone — which '
      + 'is what makes the three checks above claims about Cache Storage rather than about text',
      back.names.length === 1 && back.names[0] === CACHE_NOW && !/more than one/i.test(back.text)
        && back.cls.indexOf('warn') === -1 && back.bg === one.bg,
      'names = ' + JSON.stringify(back.names) + ', class = ' + JSON.stringify(back.cls)
        + ', line = ' + JSON.stringify(back.text));
    await closeAbout();

    /* The two failure states, and they are the ENVIRONMENT being changed rather than the app's own
       path being deleted: `window.caches` is genuinely undefined on a non-secure origin, and
       genuinely rejects in some private modes. The original property descriptor is kept so the
       page is handed back exactly as it was found. */
    await evalJs("(function(){ window.__wo810 = Object.getOwnPropertyDescriptor(window, 'caches');"
      + " Object.defineProperty(window, 'caches', { value: undefined, configurable: true });"
      + " return window.caches === undefined; })()");
    const absent = await openAboutAndRead();
    check('with Cache Storage absent the line SAYS SO rather than going blank — a blank space reads '
      + 'as "no caches", which is a different fact and a wrong one',
      absent.found === true && absent.open === true && absent.text.trim().length > 40
        && /cannot tell you which build/i.test(absent.text) && absent.names.length === 0,
      'line = ' + JSON.stringify(absent.text));
    await closeAbout();

    await evalJs("(function(){ Object.defineProperty(window, 'caches', { configurable: true,"
      + " value: { keys: function(){ return Promise.reject(new Error("
      + "'refused by tools/verify-shell.mjs')); } } }); return 1; })()");
    const threw = await openAboutAndRead();
    check('and with the read REJECTING — the private-window shape — it says which failure it was, '
      + 'in different words from the absent-API line and with the browser\'s own reason on it',
      threw.found === true && threw.open === true
        && /cannot tell you which build/i.test(threw.text)
        && threw.text.indexOf('refused by tools/verify-shell.mjs') >= 0
        && threw.text !== absent.text && threw.names.length === 0,
      'line = ' + JSON.stringify(threw.text));
    await closeAbout();
  } finally {
    /* All paths, including a throw out of any of the above: a stray planted cache would make every
       later reading of this line report a broken app, and a window.caches left overridden would
       make it report a broken browser. */
    await evalJs("(async function(){"
      + " if (window.__wo810) { Object.defineProperty(window, 'caches', window.__wo810);"
      + "   delete window.__wo810; }"
      + " if (window.caches) await caches.delete('" + PLANTED + "');"
      + " return 1; })()").catch(() => {});
    await evalJs("window.planbook.closeModal('aboutModal'); 1").catch(() => {});
  }

  const after = await cacheKeys();
  check('this section handed Cache Storage back exactly as it found it — the plant is gone and the '
    + 'real API is live again, so nothing after this run reads a device this file broke',
    after.length === 1 && after[0] === CACHE_NOW && after.join() === before.join(),
    'caches.keys() filtered to this app = ' + JSON.stringify(after)
      + ', found at the top of this section = ' + JSON.stringify(before));
}
}
