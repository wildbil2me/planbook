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

    /* ── WO-8.17: coming back on screen looks for an update, at most once a window ──

       THE CHECK IS WHAT MAKES EVERYTHING BELOW ARRIVE ON A DEVICE LEFT OPEN. Without it a browser
       looks for a new worker only when a page loads, and neither an open laptop window nor an iPad
       resumed from the background loads one. What is counted is ServiceWorkerRegistration's own
       update(), stubbed on the prototype for the length of this block so the count is the app's
       calls and nothing is fetched; `visibilityState` is shadowed and the event dispatched, the
       way verify/year-document-store.mjs drives the hidden half.

       THE CLOCK IS STEPPED, NOT WAITED ON. The throttle reads Date.now() and nothing else, so
       Date.now is shifted for the length of the block — an hour past anything this page has done
       for the first return, then the window read out of src/shell.js plus a second for the third.
       Three returns, because two cannot tell a throttle from a listener that fires once and dies:
       the second must be refused and the third, past the window, must be let through.

       THE BARRIER IS THE BROWSER'S OWN, not a sleep. The app asks getRegistration() and calls
       update() on what comes back; this block asks getRegistration() after each dispatch and reads
       the count once its own answer is in, and the two answers come back in the order they were
       asked. Mutation-proved in TESTING.md § WO-8.17: with the listener removed the first check
       goes red. */
    const shellText = await fs.readFile(path.join(ROOT, 'src', 'shell.js'), 'utf8');
    const windowM = shellText.match(/const UPDATE_CHECK_EVERY_MS\s*=\s*([\d\s*]+);/);
    const WINDOW_MS = windowM ? windowM[1].split('*').reduce((n, f) => n * Number(f.trim()), 1) : 0;
    check('src/shell.js still declares an UPDATE_CHECK_EVERY_MS this block can read, and it is at '
      + 'least a minute (guards a vacuous throttle reading)',
      WINDOW_MS >= 60 * 1000, 'UPDATE_CHECK_EVERY_MS = ' + WINDOW_MS + 'ms');
    const upd = await evalJs(`(async function(){
      var proto = ServiceWorkerRegistration.prototype, realUpdate = proto.update;
      var realNow = Date.now, calls = 0, shift = 0, counts = [];
      proto.update = function(){ calls++; return Promise.resolve(this); };
      Date.now = function(){ return realNow.call(Date) + shift; };
      async function comeBack(){
        Object.defineProperty(document, 'visibilityState',
          { configurable: true, get: function(){ return 'visible'; } });
        document.dispatchEvent(new Event('visibilitychange'));
        delete document.visibilityState;
        await navigator.serviceWorker.getRegistration();
        await new Promise(function(r){ setTimeout(r, 0); });
        counts.push(calls);
      }
      var hasReg = false;
      try {
        hasReg = !!(await navigator.serviceWorker.getRegistration());
        shift = 60 * 60 * 1000;
        await comeBack();
        shift += 20 * 1000;
        await comeBack();
        shift += ${WINDOW_MS} + 1000;
        await comeBack();
      } finally { proto.update = realUpdate; Date.now = realNow; }
      return { hasReg: hasReg, counts: counts }; })()`);
    check('the page has a service-worker registration to ask — without one no return could call '
      + 'update() however the app is written, and the two readings below would be empty',
      upd.hasReg === true, 'getRegistration() resolved to a registration = ' + upd.hasReg);
    check('bringing the page back to visible calls registration.update() — once, on the first return',
      upd.counts[0] === 1, 'update() calls after each return = ' + JSON.stringify(upd.counts));
    check('a second return twenty seconds later is inside the throttle window and calls nothing, and '
      + 'a third past the window calls it again — so the silence is the throttle and not a listener '
      + 'that fired once',
      upd.counts[1] === 1 && upd.counts[2] === 2,
      'update() calls after each return = ' + JSON.stringify(upd.counts) + ', window = ' + WINDOW_MS + 'ms');

    /* The strip, read the way a teacher meets it: whether it is hidden, whether it has a box, and
       what it says. Read before the takeover too, so "it shows after" is a change and not a state. */
    const READ_BANNER = `(function(){
      var el = document.getElementById('updateBanner');
      if (!el) return { found: false };
      var r = el.getBoundingClientRect();
      var btn = el.querySelector('[data-update-reload]');
      var strip = document.getElementById('presentationStrip');
      return { found: true, hidden: el.classList.contains('hidden'), height: r.height,
        text: el.textContent.replace(/\\s+/g, ' ').trim(), button: btn ? btn.textContent.trim() : null,
        presenting: !!(strip && !strip.classList.contains('hidden')) }; })()`;
    const quietBanner = await evalJs(READ_BANNER);
    check('on a page that booted controlled and has had nothing replaced, the update strip is in the '
      + 'markup and hidden (WO-8.17)',
      quietBanner.found === true && quietBanner.hidden === true && quietBanner.height === 0,
      JSON.stringify(quietBanner));

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

    /* ── WO-8.17: the takeover is said on the page, not only in About ──
       Read BEFORE About is opened, because About is exactly what a teacher who has not been told
       does not open — the strip has to be up on its own. */
    const shown = await evalJs(READ_BANNER);
    check('the replacement shows the update strip under the header with no modal opened — a newer '
      + 'version is ready, and a Reload to take it',
      shown.found === true && shown.hidden === false && shown.height > 0 && shown.presenting === false
        && /newer version/i.test(shown.text) && shown.button === 'Reload',
      JSON.stringify(shown));

    /* Ruling 2, driven through the real header control both ways. The strip carries no student
       data, so this is noise on a projector rather than a disclosure — and it has to come BACK,
       because the newer build is still waiting when the projector goes off. */
    await clickSel('#presentationBtn');
    const projecting = await evalJs(READ_BANNER);
    await clickSel('#presentationBtn');
    const unprojected = await evalJs(READ_BANNER);
    check('presentation mode hides the strip, and turning it off brings the strip back (ruling 2)',
      projecting.presenting === true && projecting.hidden === true && projecting.height === 0
        && unprojected.presenting === false && unprojected.hidden === false && unprojected.height > 0,
      'projecting = ' + JSON.stringify({ presenting: projecting.presenting, hidden: projecting.hidden })
        + ', after = ' + JSON.stringify({ presenting: unprojected.presenting, hidden: unprojected.hidden }));

    /* Its one control, measured under a pointer that really is coarse — the same apparatus
       verify/touch-targets.mjs uses, set and put back here because that section runs when this strip
       is hidden and so never sees it. */
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    const reloadBox = await evalJs("(function(){ var b = document.querySelector('[data-update-reload]');"
      + " var r = b.getBoundingClientRect(); return { coarse: matchMedia('(pointer: coarse)').matches,"
      + " w: r.width, h: r.height }; })()");
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    check('the strip\'s Reload measures at least 44px both ways on a coarse pointer',
      reloadBox.coarse === true && reloadBox.w >= 44 && reloadBox.h >= 44,
      JSON.stringify(reloadBox));

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

    /* ── WO-8.17: the strip's Reload saves before it reloads ──

       WHY NOT A STUBBED location.reload(). The brief suggested one, and in this browser it cannot
       be done: `location` is unforgeable, its reload() cannot be redefined from the page, and the
       only way to stub it would be an indirection in src/ that exists for the harness. So the
       reload is REAL, and the order is read off a log that survives it — sessionStorage, which a
       reload of the same tab keeps. Three entries are written into it by listeners this block
       installs: `click` when the Reload is tapped (capture, on window, so before the app's own
       delegated listener), `landed` when a save transaction COMPLETES (the store resolves on
       `complete` and so does this), and `pagehide` when the reload begins unloading the page.

       WHAT GREEN MEANS: a change is made through the store and the tap follows inside the 800ms
       debounce, so the only write that can land is one the tap caused — and the log must read
       click, landed, pagehide, in that order. With the explicit flush removed the store's own
       `pagehide` listener still STARTS a write, but it starts it after the unload has begun, so the
       log reads click, pagehide — and that is the failure this line exists for, because a write
       started at `pagehide` is the one src/store.js says can be cut off. The change is then read
       back out of IndexedDB on the far side of the reload, and put back as it was. */
    const stamp = 'wo817-' + Date.now();
    const armed = await evalJs(`(function(){
      sessionStorage.setItem('wo817log', '[]');
      function log(what){ var l = JSON.parse(sessionStorage.getItem('wo817log') || '[]');
        l.push(what); sessionStorage.setItem('wo817log', JSON.stringify(l)); }
      var realPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function(){
        var req = realPut.apply(this, arguments);
        this.transaction.addEventListener('complete', function(){ log('landed'); });
        return req; };
      window.addEventListener('click', function(e){
        if (e.target.closest && e.target.closest('[data-update-reload]')) log('click'); }, true);
      window.addEventListener('pagehide', function(){ log('pagehide'); });
      window.__wo817page = true;
      var s = window.planbook.store;
      var was = s.getDoc().teacher.adminEmail;
      s.update(function(d){ d.teacher.adminEmail = ${JSON.stringify(stamp)}; });
      return { was: was === undefined ? null : was, year: s.getDoc().year }; })()`);
    await clickSel('[data-update-reload]');
    await new Promise((r) => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    const reloaded = await evalJs(`(async function(){
      var log = JSON.parse(sessionStorage.getItem('wo817log') || 'null');
      sessionStorage.removeItem('wo817log');
      var stored = await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var q = db.transaction('years', 'readonly').objectStore('years').get(${JSON.stringify(armed.year)});
          q.onsuccess = function(){ res(q.result); db.close(); };
          q.onerror = function(){ rej(q.error); }; }; });
      return { log: log, newPage: !window.__wo817page,
        storedValue: stored && stored.teacher ? stored.teacher.adminEmail : null }; })()`);
    const L = reloaded.log || [];
    const at = (w) => L.indexOf(w);
    check('the strip\'s Reload waited for the save to LAND before it reloaded — a change made inside '
      + 'the debounce was written after the tap and before the page began to unload',
      reloaded.newPage === true && at('click') === 0 && at('landed') > at('click')
        && at('pagehide') > at('landed'),
      'log across the reload = ' + JSON.stringify(reloaded.log) + ', new document = ' + reloaded.newPage);
    check('and the change is in IndexedDB on the far side of the reload',
      reloaded.storedValue === stamp,
      'stored teacher.adminEmail = ' + JSON.stringify(reloaded.storedValue) + ', expected ' + JSON.stringify(stamp));
    /* Put back as it was, and let the reload's own re-registration of ./sw.js finish before anything
       below unregisters it: the reloaded page booted under ?wo811, so src/shell.js's register() on
       `load` is a different script URL and a real takeover, and unregistering mid-install races it. */
    await evalJs(`(async function(){ var s = window.planbook.store;
      s.update(function(d){ if (${JSON.stringify(armed.was)} === null) delete d.teacher.adminEmail;
        else d.teacher.adminEmail = ${JSON.stringify(armed.was)}; });
      await s.flush(); return 1; })()`);
    await waitForClaim(0);

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

    /* WO-8.11's trap arriving at a second reader (WO-8.17): the same controllerchange that put the
       strip up above has just fired again, for the opposite reason, and the strip must not read it
       as an update. The check above this one is what stops this being an absence. */
    const firstBanner = await evalJs(READ_BANNER);
    check('and the update strip stays hidden: a first install is not a newer version, so the day a '
      + 'teacher installs Planbook it does not open offering to reload (WO-8.17)',
      firstBanner.found === true && firstBanner.hidden === true && firstBanner.height === 0
        && firstClaim.changes >= 1,
      JSON.stringify(firstBanner) + ', controllerchange events on this document = ' + firstClaim.changes);

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
