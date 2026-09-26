/* stuck-update.mjs — a stuck update serves the old copy for ever (WO-8.18)
 *
 * A section written for this split rather than moved into it: nothing here launches a browser, a
 * server or a document of its own. The entry file owns all three and hands them over on `h`.
 * `tools/README.md` § "Driving a browser over CDP" says where a new check goes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
const { ROOT, check, evalJs } = h;

console.log('\n--- a stuck update serves the old copy for ever (WO-8.18) ---');
/*
  THE STATE THE OWNER'S iPAD WAS IN, PLANTED. About read "planbook-shell-v132 and
  planbook-shell-v134" through four force-quits, and every launch showed the old build. Two things in
  sw.js made that permanent: old copies were deleted only in `activate`, which nothing runs twice, and
  both lookups called `caches.match()` with no cache name, which searches every cache in the order
  they were MADE — so the oldest copy answered first, whichever worker was running.

  This file cannot reproduce how iOS got there: the laptop, which is Chromium, took the same deploy
  cleanly. What it can do is build the state by hand and ask what the worker does in it. So the plant
  is shaped to make the defect answer if it is present:

    - an OLD shell cache holding a different `./` and a different `./src/shell.js`, each tagged
      `planted` — and it is made BEFORE the current cache, which is what the whole defect turns on.
      The current cache is read out, deleted and rebuilt after the plant, entry for entry, so Cache
      Storage lists the old copy first. The first check below asks an unscoped `caches.match()` from
      the page and requires the PLANTED copy to answer: without that, a scoped and an unscoped lookup
      would give the same reading and nothing below would be measuring the fix.
    - the current cache's own `./` and `./src/shell.js` re-stored with a `current` tag — a header
      on the module, and a <meta> in the document, because an iframe's response headers cannot be
      read from the page. The bodies are otherwise the real bytes. The tag is what tells "came from
      CACHE" from "fell through to the network", which from the page are the same file.
    - two caches the worker must never delete: one outside the prefix that still starts `planbook-`
      (a prefix narrowed carelessly to `planbook` would take it), and one under the prefix with a
      HIGHER version — the shape of a successor's cache while it installs, which the old worker is
      still active through (sw.js, above clearOldShells).

  THE NAVIGATION IS AN IFRAME, for policy-url.mjs's reason: a navigate-mode request cannot be
  constructed by a page, and driving the top-level page would end the run on the build this block
  exists to catch. It is SANDBOXED to allow-same-origin and nothing else, so the document is still
  this origin's and still goes through the worker, but no script in it runs — a second copy of the
  app booting in a frame would open the same IndexedDB this run is still using.

  ORDER MATTERS, AND IT IS WHAT the two mutation-proofs ARE AIMED AT. The module is fetched FIRST, while the
  old copy is still there, because a module fetch is not a launch and does not tidy up. The
  navigation is second: its lookup settles before its cleanup starts (sw.js chains one after the
  other), so its reading is taken with the old copy still present, and the cleanup it then triggers
  is what the deletion check reads. An unscoped lookup turns the two tag readings red; a fetch
  handler that no longer tidies turns the deletion red. No new worker is installed anywhere here —
  the registration is read for an installing or waiting worker, and a controllerchange listener
  counts takeovers — so the deletion is the running worker's and not a fresh `activate`.

  RESTORED IN A finally: the current cache gets its own two responses back, untagged, and all three
  planted caches go. build-line.mjs, which runs before this, asserts the device holds exactly one
  shell cache, and so does every later run's first reading.
*/
{
  const swText = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const cacheM = swText.match(/const CACHE\s*=\s*'([^']+)'/);
  const CACHE_NOW = cacheM ? cacheM[1] : '';
  const vM = /^planbook-shell-v(\d+)$/.exec(CACHE_NOW);
  const OLD = 'planbook-shell-v1';
  const NEWER = 'planbook-shell-v' + (vM ? Number(vM[1]) + 1000 : 99999);
  const FOREIGN = 'planbook-wo818-not-the-shell';
  const MODULE = './src/shell.js';

  /* STATIC, in Node, and here beside the driven half for build-line.mjs's reason: it is one claim.
     Comments are stripped first, because sw.js explains the defect in prose and quotes the call. */
  const code = swText.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const count = (re) => (code.match(re) || []).length;
  check('sw.js still declares a CACHE this section can read, and it is under the shell prefix '
    + '(guards a vacuous pass)',
    !!vM, 'CACHE = ' + JSON.stringify(CACHE_NOW));
  check('sw.js makes no unscoped caches.match() call: both lookups open CACHE by name, and '
    + 'caches.delete() is called in exactly one place, over names filtered by the shell-prefix rule',
    count(/caches\.match\s*\(/g) === 0 && count(/caches\.open\s*\(\s*CACHE\s*\)/g) >= 2
      && count(/caches\.delete\s*\(/g) === 1 && /\.filter\(\s*isOldShell\s*\)/.test(code)
      && /indexOf\(\s*SHELL_PREFIX\s*\)\s*!==\s*0/.test(code)
      && /const SHELL_PREFIX\s*=\s*'planbook-shell-'/.test(code),
    'caches.match( x' + count(/caches\.match\s*\(/g) + ', caches.open(CACHE) x'
      + count(/caches\.open\s*\(\s*CACHE\s*\)/g) + ', caches.delete( x'
      + count(/caches\.delete\s*\(/g));
  /* WO-8.11's reasons, which this work order may not touch: the two calls once each, in the
     listener each has always been in, and in the same chain position. */
  const installBody = (code.match(/addEventListener\('install'[\s\S]*?\n\}\);/) || [''])[0];
  const activateBody = (code.match(/addEventListener\('activate'[\s\S]*?\n\}\);/) || [''])[0];
  check('skipWaiting and clients.claim are where they were: skipWaiting once, at the end of '
    + 'install\'s chain; clients.claim once, at the end of activate\'s',
    count(/skipWaiting\s*\(/g) === 1 && count(/clients\.claim\s*\(/g) === 1
      && /\.then\(\(\)\s*=>\s*self\.skipWaiting\(\)\)\s*\)\s*;/.test(installBody)
      && /\.then\(\(\)\s*=>\s*self\.clients\.claim\(\)\)\s*\)\s*;/.test(activateBody),
    'skipWaiting( x' + count(/skipWaiting\s*\(/g) + ', clients.claim( x'
      + count(/clients\.claim\s*\(/g) + ', install chain ends in skipWaiting = '
      + /self\.skipWaiting\(\)\)\s*\)\s*;/.test(installBody) + ', activate chain ends in claim = '
      + /self\.clients\.claim\(\)\)\s*\)\s*;/.test(activateBody));

  const shellKeys = () => evalJs("(async function(){ return (await caches.keys()).filter("
    + "function(n){ return n.indexOf('planbook-shell-') === 0; }); })()");

  const before = await shellKeys();
  const ctl = await evalJs("(function(){ var c = navigator.serviceWorker.controller;"
    + " return c ? c.scriptURL : null; })()");
  check('this page is controlled by ./sw.js and the device holds exactly one shell cache, the one '
    + 'sw.js names — the precondition for planting a second',
    typeof ctl === 'string' && /\/sw\.js$/.test(ctl) && before.length === 1 && before[0] === CACHE_NOW,
    'controller = ' + JSON.stringify(ctl) + ', shell caches = ' + JSON.stringify(before));

  const LIT = JSON.stringify({ CUR: CACHE_NOW, OLD, NEWER, FOREIGN, MODULE });
  try {
    const plant = await evalJs(`(async function(){
      var K = ${LIT};
      var base = navigator.serviceWorker.controller.scriptURL;
      var INDEX_URL = new URL('./', base).href, MOD_URL = new URL(K.MODULE, base).href;
      window.__wo818 = { changes: 0 };
      navigator.serviceWorker.addEventListener('controllerchange', function(){ window.__wo818.changes++; });

      var cur = await caches.open(K.CUR);
      var reqs = await cur.keys();
      var resps = [];
      for (var i = 0; i < reqs.length; i++) resps.push(await cur.match(reqs[i]));
      var origIndex = await cur.match(INDEX_URL), origMod = await cur.match(MOD_URL);
      if (!origIndex || !origMod) return { error: 'the current cache holds no ' + (origIndex ? MOD_URL : INDEX_URL) };
      window.__wo818.origIndex = origIndex.clone();
      window.__wo818.origMod = origMod.clone();
      var indexText = await origIndex.text(), modText = await origMod.text();

      /* The rebuild: the old copy is made first, then the current one again, so the old one is
         older in Cache Storage's order — the order an unscoped lookup searches in. */
      await caches.delete(K.CUR);
      var old = await caches.open(K.OLD);
      await old.put(INDEX_URL, new Response('<!doctype html><html><head><meta name="wo818" content="planted">'
        + '<title>wo818 planted old shell</title></head><body>planted</body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Wo818': 'planted' } }));
      await old.put(MOD_URL, new Response('/* wo818 planted old module */',
        { headers: { 'Content-Type': 'text/javascript', 'X-Wo818': 'planted' } }));
      cur = await caches.open(K.CUR);
      for (var j = 0; j < reqs.length; j++) await cur.put(reqs[j], resps[j]);
      var hi = new Headers(window.__wo818.origIndex.headers); hi.set('X-Wo818', 'current');
      var hm = new Headers(window.__wo818.origMod.headers); hm.set('X-Wo818', 'current');
      var marked = indexText.replace('</head>', '<meta name="wo818" content="current"></head>');
      await cur.put(INDEX_URL, new Response(marked, { headers: hi }));
      await cur.put(MOD_URL, new Response(modText, { headers: hm }));
      await caches.open(K.NEWER);
      await caches.open(K.FOREIGN);

      var unscoped = await caches.match(INDEX_URL), unscopedMod = await caches.match(MOD_URL);
      return { keys: await caches.keys(), entries: reqs.length, entriesAfter: (await cur.keys()).length,
        markedDoc: marked !== indexText,
        unscoped: unscoped ? unscoped.headers.get('X-Wo818') : null,
        unscopedMod: unscopedMod ? unscopedMod.headers.get('X-Wo818') : null }; })()`);
    const keys = plant.keys || [];
    check('the plant took, in the shape of the stuck iPad: an old shell cache made BEFORE the current '
      + 'one, so an unscoped caches.match() from this page finds the PLANTED document and module first '
      + '— without which the two readings below could not tell a scoped lookup from an unscoped one',
      !plant.error && keys.indexOf(OLD) >= 0 && keys.indexOf(OLD) < keys.indexOf(CACHE_NOW)
        && plant.entries > 20 && plant.entriesAfter === plant.entries && plant.markedDoc === true
        && plant.unscoped === 'planted' && plant.unscopedMod === 'planted',
      plant.error ? plant.error : 'caches.keys() = ' + JSON.stringify(keys) + ', entries re-stored = '
        + plant.entriesAfter + '/' + plant.entries + ', unscoped match: document = '
        + JSON.stringify(plant.unscoped) + ', module = ' + JSON.stringify(plant.unscopedMod));

    /* A module fetch through the worker, which is not a launch: nothing is tidied by it. */
    const mod = await evalJs(`(async function(){
      var r = await fetch(${JSON.stringify(MODULE)}, { cache: 'no-store' });
      var t = await r.text();
      return { status: r.status, tag: r.headers.get('X-Wo818'), planted: t.indexOf('wo818 planted') >= 0,
        length: t.length }; })()`);
    check('a shell module fetched through the worker comes out of CACHE — the current copy, not the '
      + 'planted one an unscoped lookup finds first, and not the network either',
      mod.status === 200 && mod.tag === 'current' && mod.planted === false && mod.length > 1000,
      JSON.stringify(mod));

    await evalJs(`(function(){
      window.__wo818.done = false;
      var f = document.createElement('iframe');
      f.id = '__wo818frame';
      f.setAttribute('sandbox', 'allow-same-origin');
      f.style.cssText = 'position:fixed;left:-9999px;top:0;width:420px;height:320px;border:0';
      f.onload = function(){ window.__wo818.done = true; };
      f.src = '/?wo818=' + Date.now();
      document.body.appendChild(f);
      return 1; })()`);
    /* Wait on the condition, never on a clock (tools/README.md trap 5). */
    let until = Date.now() + 15000;
    while (Date.now() < until && !(await evalJs('!!(window.__wo818 && window.__wo818.done)'))) {
      await new Promise(r => setTimeout(r, 100));
    }
    const doc = await evalJs(`(function(){
      var f = document.getElementById('__wo818frame'), d = f && f.contentDocument;
      if (!d) return { reachable: false };
      var m = d.querySelector('meta[name="wo818"]');
      return { reachable: true, tag: m ? m.getAttribute('content') : null,
        isApp: !!d.getElementById('homeView'), title: d.title }; })()`);
    check('the app\'s document, navigated to with the old copy still stored, comes out of CACHE — '
      + 'the launch a teacher makes, answered by the build that is installed',
      doc.reachable === true && doc.tag === 'current' && doc.isApp === true,
      JSON.stringify(doc));

    /* The cleanup rides the navigation's waitUntil, after its response: poll for it. */
    until = Date.now() + 8000;
    let after = await evalJs('(async function(){ return await caches.keys(); })()');
    while (Date.now() < until && after.indexOf(OLD) >= 0) {
      await new Promise(r => setTimeout(r, 150));
      after = await evalJs('(async function(){ return await caches.keys(); })()');
    }
    const reg = await evalJs(`(async function(){
      var r = await navigator.serviceWorker.getRegistration();
      var c = navigator.serviceWorker.controller;
      return { installing: !!(r && r.installing), waiting: !!(r && r.waiting),
        active: r && r.active ? r.active.scriptURL : null, controller: c ? c.scriptURL : null,
        changes: window.__wo818.changes }; })()`);
    check('the planted old cache is gone after that launch, and the current one is still there — '
      + 'deleted by the running worker, with no new worker installing, waiting or taking over',
      after.indexOf(OLD) < 0 && after.indexOf(CACHE_NOW) >= 0
        && reg.installing === false && reg.waiting === false && reg.changes === 0
        && /\/sw\.js$/.test(reg.active || '') && /\/sw\.js$/.test(reg.controller || ''),
      'caches.keys() = ' + JSON.stringify(after) + ', registration = ' + JSON.stringify(reg));
    check('and nothing it was not entitled to went with it: the cache outside the shell prefix and '
      + 'the shell cache NEWER than this worker\'s — a successor\'s, mid-install — both survive',
      after.indexOf(FOREIGN) >= 0 && after.indexOf(NEWER) >= 0,
      'caches.keys() = ' + JSON.stringify(after));
  } finally {
    await evalJs(`(async function(){
      var K = ${LIT};
      var f = document.getElementById('__wo818frame'); if (f) f.remove();
      var p = window.__wo818 || {};
      var base = navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : location.href;
      if (p.origIndex && p.origMod) {
        var cur = await caches.open(K.CUR);
        await cur.put(new URL('./', base).href, p.origIndex);
        await cur.put(new URL(K.MODULE, base).href, p.origMod);
      }
      await caches.delete(K.OLD); await caches.delete(K.NEWER); await caches.delete(K.FOREIGN);
      delete window.__wo818;
      return 1; })()`).catch(() => {});
  }

  const back = await evalJs(`(async function(){
    var K = ${LIT};
    var base = navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : location.href;
    var cur = await caches.open(K.CUR);
    var i = await cur.match(new URL('./', base).href), m = await cur.match(new URL(K.MODULE, base).href);
    return { keys: await caches.keys(), frames: document.querySelectorAll('iframe').length,
      indexTag: i ? i.headers.get('X-Wo818') : 'missing', modTag: m ? m.headers.get('X-Wo818') : 'missing',
      indexMarked: i ? (await i.text()).indexOf('name="wo818"') >= 0 : null }; })()`);
  const backShell = back.keys.filter(n => n.indexOf('planbook-shell-') === 0);
  check('this section handed the device back as it found it — one shell cache, no planted cache of '
    + 'any name, the current copy\'s document and module untagged, and no iframe left',
    backShell.length === 1 && backShell[0] === CACHE_NOW && backShell.join() === before.join()
      && back.keys.indexOf(FOREIGN) < 0 && back.indexTag === null && back.modTag === null
      && back.indexMarked === false && back.frames === 0,
    JSON.stringify(back) + ', found at the top = ' + JSON.stringify(before));
}
}
