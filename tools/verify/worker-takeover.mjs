/* worker-takeover.mjs — the screen can be older than the worker serving it (WO-8.11)
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
const { ROOT, check, send, evalJs, has, clickSel, KILL_ANIM, waitForBoot } = h;

console.log('\n--- the screen can be older than the worker serving it (WO-8.11) ---');
/*
  THE SECOND HALF OF THE BUILD LINE, and the half that is NOT a reading of Cache Storage. The block
  above proves the line names what the device has STORED. This one proves it can also say what the
  window was BUILT FROM, because those are two facts and on 2026-08-16 they disagreed: sw.js uses
  skipWaiting + clients.claim, so a new worker took over and deleted the old cache while the open
  window went on rendering markup fetched before the swap. About read planbook-shell-v72 the whole
  time, honestly, about the wrong question. It cost WO-3.24 three readings of one legend row.

  THE STATE IS REACHED WITH A REAL WORKER, not a synthesised event. `navigator.serviceWorker` is an
  EventTarget and a `controllerchange` could be dispatched at it from the page in one line — but a
  check that fires the app's own listener by hand proves the listener runs, not that the browser
  ever runs it. So the harness registers a SECOND worker at the same scope under a different script
  URL (`./sw.js?wo811=1`; the server strips the query, so it is the same bytes), which is a real
  Update job: it installs, calls skipWaiting, activates, claims this already-loaded page, and the
  event arrives from the browser. tools/README.md's line — this file "has never seen a service
  worker" — needs the same precise reading it needed for the block above: nothing here installs an
  APP or asserts anything about `fetch` interception, and everything driven is a window API.

  WHAT THE THREE READINGS ARE FOR, in the order they run. (1) The healthy line, compared against
  WO-8.10's sentence written out in this file rather than read back out of src/shell.js — the
  acceptance line is "byte-for-byte what WO-8.10 ships", and a claim of unchangedness cannot be
  checked against the code it is a claim about. (2) The replacement, which is the whole feature.
  (3) THE FIRST-EVER LOAD, which is the trap: `controllerchange` fires when a worker claims a page
  that never had a controller, and keying off the event alone puts a warning in front of every new
  install. That one is driven by unregistering every worker and reloading, so the page genuinely
  boots with no controller and the claim that follows is genuinely the first — the shape a teacher
  meets on the day she installs Planbook.

  THE BOOT PROBE IS INSTALLED THROUGH Page.addScriptToEvaluateOnNewDocument, not evalJs, and that
  is a race rather than a preference: the app reads `navigator.serviceWorker.controller` at module
  evaluation and the claim can land within a second of `load`, so anything injected after a reload
  can arrive on the far side of the event it is there to count. The probe records what the
  controller was at document start and counts every controllerchange, which is what makes reading
  (3) an assertion rather than an absence — a healthy line on a page where the event never fired
  would prove nothing at all.

  RESTORED IN A finally, the way the block above restores its plant: the probe comes off, every
  worker this section registered is unregistered, and the page is left controlled by ./sw.js with
  Cache Storage holding exactly the list this section found. A stray ?wo811 registration would make
  every later run's first reading a stale one.
*/
{
  const swText = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const cacheM = swText.match(/const CACHE\s*=\s*'([^']+)'/);
  const CACHE_NOW = cacheM ? cacheM[1] : '';
  const SECOND = './sw.js?wo811=1';

  /* WO-8.10's healthy sentence, typed out here on purpose — see the head of this block. */
  const HEALTHY = 'Running from ' + CACHE_NOW
    + ' — one stored copy on this device, which is what it should be.';

  /* The same readings the block above takes, redeclared rather than shared. That block hands
     window.caches back in its own finally and this one hands the service worker back in its own;
     a helper reaching across the two would tie the restores together, and a section that cannot be
     deleted on its own is a section nobody deletes. */
  const READ_BUILD = `(function(){
    var el = document.getElementById('buildCaches');
    var modal = document.getElementById('aboutModal');
    if (!el) return { found: false, open: !!(modal && !modal.classList.contains('hidden')) };
    var cs = getComputedStyle(el);
    return { found: true, open: !!(modal && !modal.classList.contains('hidden')),
      text: el.textContent, cls: el.className,
      names: Array.prototype.map.call(el.querySelectorAll('strong'), function(s){ return s.textContent; }),
      bg: cs.backgroundColor, color: cs.color }; })()`;

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

  /* What the app itself reads before it registers, plus a count of the events it keys off. */
  const readProbe = () => evalJs("(function(){ var p = window.__wo811 || {};"
    + " var c = navigator.serviceWorker.controller;"
    + " return { installed: !!window.__wo811, boot: p.boot === undefined ? 'never ran' : p.boot,"
    + " changes: p.changes || 0, controller: c ? c.scriptURL : null }; })()");

  const flushAndReload = async () => {
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()').catch(() => {});
    await send('Page.reload');
    await new Promise((r) => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
  };
  /* Wait on the condition, never on a clock (tools/README.md trap 5): an install that precaches
     the whole shell takes about a second and a half here and rather longer on a cold profile. */
  const waitForClaim = async (from, ms = 20000) => {
    const until = Date.now() + ms;
    let seen = await readProbe();
    while (Date.now() < until && !(seen.changes > from && seen.controller)) {
      await new Promise(r => setTimeout(r, 150));
      seen = await readProbe();
    }
    return seen;
  };
  const unregisterAll = () => evalJs("(async function(){"
    + " var rs = await navigator.serviceWorker.getRegistrations();"
    + " for (var i = 0; i < rs.length; i++) await rs[i].unregister();"
    + " return rs.length; })()");

  const before = await cacheKeys();
  const probe = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: "window.__wo811 = { boot: null, changes: 0 };"
      + " try { var sw = navigator.serviceWorker;"
      + "   window.__wo811.boot = sw.controller ? sw.controller.scriptURL : null;"
      + "   sw.addEventListener('controllerchange', function(){ window.__wo811.changes++; });"
      + " } catch (e) { window.__wo811.boot = 'threw: ' + e.message; }",
  });

  try {
    await flushAndReload();
    const booted = await readProbe();
    /* The precondition for reading (2), and it is the half of the trap that can go vacuous from the
       other side: a page that booted with NO controller could never be reported stale however the
       app is written, so a green stale reading on such a page would mean nothing. */
    check('this page booted CONTROLLED by ./sw.js — the only state in which a later takeover can '
      + 'leave the markup on screen behind, and the precondition for every reading below',
      booted.installed === true && typeof booted.boot === 'string' && /\/sw\.js$/.test(booted.boot)
        && booted.changes === 0,
      'controller at document start = ' + JSON.stringify(booted.boot)
        + ', controllerchange events since = ' + booted.changes);

    const healthy = await openAboutAndRead();
    check('and the line it reads is WO-8.10\'s sentence to the character, with nothing about '
      + 'staleness added to the case that happens every single launch',
      healthy.found === true && healthy.open === true && healthy.text === HEALTHY
        && healthy.names.length === 1 && healthy.names[0] === CACHE_NOW
        && healthy.cls.indexOf('warn') === -1,
      'line = ' + JSON.stringify(healthy.text) + ', expected = ' + JSON.stringify(HEALTHY)
        + ', class = ' + JSON.stringify(healthy.cls));
    await closeAbout();

    await evalJs("(async function(){ await navigator.serviceWorker.register('" + SECOND
      + "'); return 1; })()");
    const claimed = await waitForClaim(0);
    /* The state the whole work order is about, and it arrived from the browser rather than from a
       dispatchEvent in this file: a different script at the same scope is an Update job, and
       sw.js's own skipWaiting + clients.claim is what makes it land on a page that is already up. */
    check('a second worker really did take this loaded page over — one controllerchange from the '
      + 'browser, and the controller is now the script that was registered second',
      claimed.changes === 1 && typeof claimed.controller === 'string'
        && claimed.controller.indexOf('wo811=1') >= 0,
      'controllerchange events = ' + claimed.changes + ', controller = '
        + JSON.stringify(claimed.controller));

    const stale = await openAboutAndRead();
    /* The count clause from the block above, in this block's shape: the position of the claim
       against the position of the version. A teacher has to meet "this screen is old" BEFORE she
       meets a cache name, or the line is two version strings she has no way to rank. */
    const saidAt = stale.text.search(/older than/i);
    const namedAt = stale.text.indexOf(CACHE_NOW);
    check('the build line now SAYS the screen is older than what is stored, and says it before it '
      + 'names the stored copy — the fact a teacher can act on, not two versions side by side',
      saidAt >= 0 && namedAt > saidAt && stale.names.length === 1 && stale.names[0] === CACHE_NOW
        && !/more than one/i.test(stale.text),
      '"older than" at ' + saidAt + ', ' + CACHE_NOW + ' at ' + namedAt
        + ', names = ' + JSON.stringify(stale.names) + ', line = ' + JSON.stringify(stale.text));
    check('and it names the action that actually clears it — quitting from the app switcher, which '
      + 'is the one thing that re-renders the document',
      /app switcher/i.test(stale.text) && /\bquit\b/i.test(stale.text),
      'line = ' + JSON.stringify(stale.text));
    /* THE CLAUSE THE WORK ORDER SPELLS OUT: a pull-to-refresh is not sufficient and the wording may
       not imply it is — that was tried on the iPad on 2026-08-16 and did not clear it. Read as the
       sentence the word lands in rather than as a literal string, so a rewrite of the line that
       kept the meaning passes and one that dropped the negation does not. */
    const refreshClause = (stale.text.split(/(?<=[.!?])\s+/)
      .filter((s) => /refresh/i.test(s)).join(' ')) || '';
    check('the refresh a teacher would try first is named AND refused in the same breath — a line '
      + 'that mentions refreshing without denying it sends her round the loop that failed',
      /refresh/i.test(stale.text) && /\b(not|never|isn.t|doesn.t|won.t)\b/i.test(refreshClause),
      'the sentence carrying "refresh" = ' + JSON.stringify(refreshClause));
    /* Measured as a colour, not read off the class name, for the reason the block above measures
       it: design/style-guide.md §1 names #fff8e6 on #8a6d1a, and .warn could be present with the
       rule gone. The palette means one thing across both amber states — you may be looking at an
       old Planbook — and the action under both is the same. */
    check('and it wears the same caution amber the more-than-one line wears, because the teacher\'s '
      + 'next move under both is to quit the app and open it again',
      stale.cls.indexOf('warn') >= 0 && stale.bg === 'rgb(255, 248, 230)'
        && stale.color === 'rgb(138, 109, 26)',
      'class = ' + JSON.stringify(stale.cls) + ', background = ' + stale.bg
        + ', color = ' + stale.color);
    await closeAbout();

    /* ── the first-ever load, which is the Trap written as a check ── */
    const removed = await unregisterAll();
    await flushAndReload();
    const virgin = await readProbe();
    /* WHAT THIS DOES NOT ASSERT, and it went red once for asserting it: that the claim has not
       landed YET. It usually has — the read is taken after waitForBoot(), and the worker was
       already installed, so it activates and claims within a beat of `load`. Requiring a count of
       zero here is tools/README.md trap 5 in its plainest form, a measurement racing an event, and
       the count that matters is asserted by the check below instead. What is asserted here is the
       one thing that cannot race: what `navigator.serviceWorker.controller` said at document
       start, read by the probe before any page script ran, which is what src/shell.js reads too. */
    check('with every worker unregistered and the page reloaded, this document booted with NO '
      + 'controller at all — the shape of a teacher\'s first launch, and the state the app has to '
      + 'tell apart from a takeover',
      removed >= 1 && virgin.installed === true && virgin.boot === null,
      'registrations unregistered = ' + removed + ', controller at document start = '
        + JSON.stringify(virgin.boot) + ', controllerchange events by the time this read = '
        + virgin.changes);

    const firstClaim = await waitForClaim(0);
    /* Without this the reading below is an absence: a healthy line on a page where the event never
       fired proves only that nothing happened. */
    check('the app re-registered ./sw.js and that worker CLAIMED this page — the same '
      + 'controllerchange the stale reading above was driven by, arriving for the opposite reason',
      firstClaim.changes >= 1 && typeof firstClaim.controller === 'string'
        && /\/sw\.js$/.test(firstClaim.controller),
      'controllerchange events = ' + firstClaim.changes + ', controller = '
        + JSON.stringify(firstClaim.controller));

    const firstRun = await openAboutAndRead();
    check('and the line stays WO-8.10\'s quiet sentence: a first install is read as healthy, not '
      + 'as staleness, so the day a teacher installs Planbook it does not open with a warning '
      + 'about a build that never existed',
      firstRun.text === HEALTHY && firstRun.cls.indexOf('warn') === -1
        && !/older than/i.test(firstRun.text) && firstRun.names.length === 1
        && firstRun.names[0] === CACHE_NOW,
      'line = ' + JSON.stringify(firstRun.text) + ', class = ' + JSON.stringify(firstRun.cls)
        + ', controllerchange events on this document = ' + firstClaim.changes);
    await closeAbout();

    await flushAndReload();
    const settled = await readProbe();
    const quiet = await openAboutAndRead();
    /* THE NON-VACUITY OF EVERY READING ABOVE, and the nearest this harness gets to the force-quit
       the 👤 line asks for: the launch after an update is a new document served by the worker that
       took over, nothing replaces anything, and the line has to go quiet. A build that hard-coded
       the warning, or one that let the flag outlive the document it is a fact about, passes the
       stale readings and fails here. It has to be taken AFTER the block above rather than straight
       after the stale one, because a reload taken while ?wo811 is the active worker is itself a
       replacement — src/shell.js re-registers ./sw.js on load, which is a different script URL and
       so a real takeover, and the line would be right to say so. */
    check('the launch after the update is quiet again — controlled from boot, nothing taking over, '
      + 'and WO-8.10\'s sentence to the character, which is what makes the readings above facts '
      + 'about a document rather than a string somebody typed',
      settled.boot !== null && settled.changes === 0 && quiet.text === HEALTHY
        && quiet.cls.indexOf('warn') === -1,
      'controller at document start = ' + JSON.stringify(settled.boot)
        + ', controllerchange events since = ' + settled.changes
        + ', line = ' + JSON.stringify(quiet.text));
    await closeAbout();
  } finally {
    /* All paths, including a throw out of any of the above. The probe comes off the browser, the
       ?wo811 registration comes off the origin, and the page is left controlled by ./sw.js — a
       stray second script URL would make the FIRST reading of every later run a stale one. */
    if (probe && probe.identifier) {
      await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: probe.identifier })
        .catch(() => {});
    }
    await evalJs("(async function(){"
      + " var rs = await navigator.serviceWorker.getRegistrations();"
      + " for (var i = 0; i < rs.length; i++) {"
      + "   if (rs[i].active && rs[i].active.scriptURL.indexOf('wo811') >= 0) await rs[i].unregister();"
      + " } return 1; })()").catch(() => {});
    await evalJs("window.planbook.closeModal('aboutModal'); 1").catch(() => {});
  }

  /* Read rather than awaited: navigator.serviceWorker.ready never settles when there is no
     registration, and an unresolved promise handed to evalJs hangs the run instead of failing it. */
  const controllerBack = await evalJs("(function(){ var c = navigator.serviceWorker.controller;"
    + " return c ? c.scriptURL : null; })()").catch(() => null);
  const after = await cacheKeys();
  /* The block above hands Cache Storage back; this one hands back the worker as well, because that
     is what it borrowed. Both are the same rule: nothing after this section may read a device this
     file left broken. */
  check('this section handed the device back as it found it — one shell cache, the same list, and '
    + 'the page controlled by ./sw.js with the second registration gone',
    after.length === 1 && after[0] === CACHE_NOW && after.join() === before.join()
      && typeof controllerBack === 'string' && /\/sw\.js$/.test(controllerBack),
    'caches.keys() filtered to this app = ' + JSON.stringify(after)
      + ', found at the top of this section = ' + JSON.stringify(before)
      + ', active worker = ' + JSON.stringify(controllerBack));
}
}
