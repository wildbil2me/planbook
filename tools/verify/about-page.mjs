/* about-page.mjs — the front page is not the app, and it says nothing it should not (WO-8.15)
 *
 * `about.html` is the homepage Google is given during OAuth verification and the page a stranger
 * reads before the app means anything to them. It is shaped like `privacy.html` on purpose, and
 * this section is `verify/policy-url.mjs` asked of a second document: the same three questions,
 * because the same three things can go wrong with it.
 *
 *   1. It must not be precached, and it must not grow a manifest, a worker or a script — a front
 *      page that links the manifest offers to install itself instead of the app.
 *   2. Its header comment must not escape onto the page. privacy.html's did, on 2026-08-21, and
 *      every presence check stayed green through it; this asks the absence question instead.
 *   3. On a page the worker controls, navigating to it must render IT, over the network — the
 *      navigate branch answers only the app's own document, and this is the second document that
 *      branch has to leave alone.
 *
 * Plus the two links the page exists to carry: the privacy policy, which Google's branding review
 * asks a homepage for, and the app itself. The iframe helper is policy-url.mjs's, re-stated
 * rather than imported, because sections here share nothing but `h`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
  const { ROOT, SERVED, check, evalJs } = h;

  console.log('\n--- the front page is not the app (WO-8.15) ---');

  const swText = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const shellBlock = swText.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
  const shellNow = shellBlock ? [...shellBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
  let src = '';
  try { src = await fs.readFile(path.join(ROOT, 'about.html'), 'utf8'); } catch { src = ''; }
  const onDisk = src.length > 0;

  /* Guarded against a vacuous pass the way policy-url.mjs guards it: an empty parse of SHELL and
     a clean one are the same answer. */
  check('about.html exists at the root and is NOT in sw.js’s SHELL list — it is read once, online, '
    + 'by somebody who has installed nothing yet (WO-8.15, privacy.html’s ruling applied to a second page)',
    onDisk && shellNow.length > 20 && !shellNow.some(p => /about\.html$/.test(p)),
    'about.html on disk = ' + onDisk + ', SHELL parsed to ' + shellNow.length + ' entr(ies), '
      + 'matching about.html = ' + JSON.stringify(shellNow.filter(p => /about\.html$/.test(p))));

  const noComments = src.replace(/<!--[\s\S]*?-->/g, ' ');
  const scripts = (noComments.match(/<script\b/gi) || []).length;
  const manifest = /<link[^>]+rel=["']?manifest/i.test(noComments);
  const swCall = /serviceWorker/.test(noComments);
  check('the front page carries no script, no manifest link and no worker registration — linking '
    + 'the manifest here would offer to install the front page instead of the app',
    onDisk && scripts === 0 && !manifest && !swCall,
    '<script> tags = ' + scripts + ', manifest link = ' + manifest + ', serviceWorker mentioned = '
      + swCall);

  /* policy-url.mjs's leak check, with this page's own work-order number added to the vocabulary.
     The markers are repository words rather than the strings that leaked last time: the next
     escape will quote different lines, and what they share is that they talk about this project
     instead of to a teacher. */
  const opens = (src.match(/<!--/g) || []).length;
  const closes = (src.match(/-->/g) || []).length;
  const visible = noComments
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const LEAK_MARKERS = ['plans/', 'verify-deploy', 'verify-shell', 'wo-sweep', 'sw.js', 'SHELL',
    'CLAUDE.md', 'TESTING.md', '.claude/', 'WO-8.15', 'WO-3.18', 'ROADMAP'];
  const leaked = LEAK_MARKERS.filter((m) => visible.includes(m));
  check('the front page’s VISIBLE text is prose for a stranger — delimiters balanced, and no '
    + 'repository vocabulary outside a comment (privacy.html’s header leaked onto the deployed '
    + 'page once, and nothing that asked what was present could see it)',
    onDisk && opens === closes && visible.trim().length > 400 && !leaked.length,
    '<!-- x' + opens + ' vs --> x' + closes + ', visible text ' + visible.trim().length
      + ' chars, markers found in it = ' + JSON.stringify(leaked));

  /* The two links the page exists for, read off the markup outside comments. The privacy link is
     the file name for index.html's reason — the local server answers the file, and Pages
     redirects it to `/privacy` — so either spelling passes and nothing else does. */
  const hrefs = [...noComments.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map(m => m[1]);
  const toPolicy = hrefs.filter(u => u === './privacy.html' || u === './privacy' || u === '/privacy');
  const toApp = hrefs.filter(u => u === './' || u === '/');
  check('the front page links the privacy policy and opens the app — the one link Google’s '
    + 'branding review asks a homepage for, and the one a teacher came for',
    toPolicy.length >= 1 && toApp.length >= 1,
    toPolicy.length + ' link(s) to the policy, ' + toApp.length + ' to the app, out of '
      + hrefs.length + ' link(s): ' + JSON.stringify(hrefs));

  const controller = await evalJs("(function(){ var c = navigator.serviceWorker.controller;"
    + " return c ? c.scriptURL : null; })()");
  check('this page is controlled by ./sw.js — without it, the navigation below proves nothing, '
    + 'because an uncontrolled page fetches everything over the network anyway',
    typeof controller === 'string' && /\/sw\.js$/.test(controller),
    'navigator.serviceWorker.controller = ' + JSON.stringify(controller));

  const READ_FRAME = `(function(){
    var f = document.getElementById('__wo815frame');
    var d = f && f.contentDocument;
    if (!d) return { reachable: false };
    var h1 = d.querySelector('h1');
    return { reachable: true, title: d.title || '',
      h1: h1 ? h1.textContent.trim().replace(/\\s+/g, ' ') : null,
      isApp: !!d.getElementById('homeView') }; })()`;

  const before = SERVED.length;
  await evalJs(`(function(){
    var old = document.getElementById('__wo815frame');
    if (old) old.remove();
    window.__wo815done = false;
    var f = document.createElement('iframe');
    f.id = '__wo815frame';
    f.style.cssText = 'position:fixed;left:-9999px;top:0;width:420px;height:320px;border:0';
    f.onload = function(){ window.__wo815done = true; };
    f.src = ${JSON.stringify('/about.html?wo815=' + Date.now())};
    document.body.appendChild(f);
    return 1; })()`);
  /* Wait on the condition, never on a clock (tools/README.md trap 5). */
  const until = Date.now() + 15000;
  while (Date.now() < until && !(await evalJs('!!window.__wo815done'))) {
    await new Promise(r => setTimeout(r, 100));
  }
  const page = await evalJs(READ_FRAME);
  const asked = SERVED.slice(before).filter(p => p === '/about.html').length;

  check('navigating to the front page on a page this worker controls renders THE FRONT PAGE and '
    + 'not the gradebook, fetched over the network — the navigate branch leaves a second document '
    + 'alone as well as it leaves the policy alone',
    page.reachable === true && page.isApp === false && /About Planbook/.test(page.title)
      && page.h1 === 'Planbook' && asked >= 1,
    'title = ' + JSON.stringify(page.title) + ', h1 = ' + JSON.stringify(page.h1)
      + ', #homeView present = ' + page.isApp + ', requests for /about.html seen by the server = '
      + asked + ' (' + (SERVED.length - before) + ' request(s) after the frame went in)');

  const cleaned = await evalJs("(function(){ var f = document.getElementById('__wo815frame');"
    + " if (f) f.remove(); delete window.__wo815done;"
    + " return { frames: document.querySelectorAll('iframe').length,"
    + " flag: typeof window.__wo815done }; })()");
  check('this section handed the page back as it found it — no iframe left and no probe on window',
    cleaned.frames === 0 && cleaned.flag === 'undefined',
    'iframes left = ' + cleaned.frames + ', window.__wo815done = ' + cleaned.flag);
}
