/* policy-url.mjs — the policy URL is not the app (WO-8.12)
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
const { ROOT, SERVED, check, evalJs } = h;

console.log('\n--- the policy URL is not the app (WO-8.12) ---');
/*
  THE THIRD BLOCK IN THIS FILE THAT LOOKS AT A SERVICE WORKER'S WORK, and the first that asserts
  anything about `fetch` INTERCEPTION — so the line in tools/README.md, "it drives a page, not an
  installed app, and it has never seen a service worker", is narrowed again here rather than left
  to be read charitably. Nothing below installs an app. What it does do is navigate an iframe at
  this origin and ask which document came back, which is the only way to see the defect this block
  exists for.

  WHAT THE DEFECT WAS. `sw.js`'s navigate branch answered EVERY navigation out of the cache without
  looking at the path, because until WO-8.12 the app was the only document at this origin. Add
  `privacy.html` — the policy Google fetches during OAuth verification — and every device with the
  worker installed renders the gradebook at the policy URL. **It is invisible from exactly the place
  it gets tested:** a reviewer fetches cold, with no worker, and sees the policy.

  WHY AN IFRAME. `Request.mode === 'navigate'` is the branch under test and a page cannot construct
  a navigate-mode `fetch()` — the mode is set by the browser, for a real navigation. An iframe at a
  same-origin URL is a real navigation, it goes through the controlling worker like any other, and
  its document is readable from here. Driving the TOP-LEVEL page to the policy would work equally
  well and would end the run: everything after it would be measuring a page that is not the app.

  AND WHY THE SERVER IS THE INSTRUMENT. Both navigations render *something*, and from the page a
  document served out of Cache Storage and one fetched over the network are indistinguishable —
  same bytes, same DOM. `SERVED` (declared with the static server above) is the discriminator: it
  records what the network was actually asked for. So "the policy went to the network" and "the app
  did NOT" are two readings of the same list, and the second is what stops this block passing on a
  build that deleted the navigate branch outright rather than fixing it.

  EVERY NAVIGATION CARRIES A UNIQUE QUERY, and that is not decoration. The harness has already
  loaded `/index.html` once, this server sends no cache headers, and a repeat of a URL the browser
  has seen can be answered from its own memory cache without touching the socket — which would make
  the reading above say "Cache Storage" about the browser's HTTP cache. A URL with a fresh query has
  never been seen. The worker is unaffected: it compares `url.pathname`, and the server strips the
  query before it looks for the file, so the same bytes come back by a name nothing has cached.

  ONE CLAUSE IS STATIC, in Node, and it is here rather than in wo-sweep.mjs for WO-8.10's reason:
  it is half of one claim. The policy is answered by the network BECAUSE it is not precached, and a
  later work order that quietly adds `./privacy.html` to SHELL would leave the driven half of this
  block passing over a page that had stopped being fetched at all.
*/
{
  const swText = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const shellBlock = swText.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
  const shellNow = shellBlock ? [...shellBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
  let policyOnDisk = true;
  try { await fs.access(path.join(ROOT, 'privacy.html')); } catch { policyOnDisk = false; }

  /* The trap-2 ruling as a grep, guarded against a vacuous pass the way every other reader of this
     array is: an empty parse and a clean one are the same answer, and the apostrophe hazard in
     sw.js's own header is what makes an empty parse plausible. */
  check('privacy.html exists at the root and is NOT in sw.js’s SHELL list — the policy is a '
    + 'document read once, online, and precaching it would buy an offline reading of a legal page '
    + 'nobody reads offline (WO-8.12 trap 2, ruled at the SHELL list itself)',
    policyOnDisk && shellNow.length > 20 && !shellNow.some(p => /privacy\.html$/.test(p)),
    'privacy.html on disk = ' + policyOnDisk + ', SHELL parsed to ' + shellNow.length + ' entr(ies), '
      + 'matching privacy.html = ' + JSON.stringify(shellNow.filter(p => /privacy\.html$/.test(p))));

  /* WHAT A READER ACTUALLY SEES AT THE TOP OF THE POLICY, and this check exists because on
     2026-08-21 that was fifty-five lines of this repository's internal notes.
     A literal closing marker written inside privacy.html's header comment ended that comment
     early — an HTML comment closes at the FIRST such marker regardless of what the author meant —
     so work-order numbers, `plans/` paths and the reasoning about which of the owner's accounts
     holds what rendered as visible text on the page a principal reads before trusting this app
     with student data, and the page Google fetches during OAuth verification.
     NOTHING IN EITHER HARNESS CAUGHT IT, and the reason generalises: every policy check written
     until then asks whether something is PRESENT — the title, the three claims, the contact, the
     absence of a placeholder token. Leaked comment text ADDS to a page without removing anything,
     so `verify-deploy.mjs` stayed green at 17/17 for the whole episode and the only thing that
     found it was the owner opening the page in a browser.
     So this asks the opposite question. It strips comments, script and style, flattens the tags,
     and asserts the remaining prose carries no marker that belongs only inside a comment. The
     markers are deliberately repository vocabulary rather than a list of the strings that leaked:
     the next escape will quote different lines, and what every one of them has in common is that
     it talks about this project instead of to a teacher.
     THE DELIMITER COUNT IS THE SECOND CLAUSE AND IT WOULD NOT HAVE CAUGHT THIS ONE — proved by
     mutation rather than assumed, which is how the sentence that used to sit here got corrected.
     Reinstating the exact defect leaves the counts BALANCED at 6 and 6, because the line that
     broke the page writes an opener and a closer both. The markers are what go red. The count
     stays because it catches the other shape — an unterminated comment swallowing the document
     forward — and because a balance that silently drifts is worth knowing about either way. */
  const policySrc = policyOnDisk ? await fs.readFile(path.join(ROOT, 'privacy.html'), 'utf8') : '';
  const opens = (policySrc.match(/<!--/g) || []).length;
  const closes = (policySrc.match(/-->/g) || []).length;
  const visible = policySrc
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)[\s\S]*?<\/>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const LEAK_MARKERS = ['plans/', 'verify-deploy', 'verify-shell', 'wo-sweep', 'sw.js', 'SHELL',
    'CLAUDE.md', 'TESTING.md', '.claude/', 'WO-8.12', 'ROADMAP'];
  const leaked = LEAK_MARKERS.filter((m) => visible.includes(m));
  check('the policy’s VISIBLE text is prose for a teacher and carries no comment that escaped '
    + 'onto the page — delimiters balanced, and no repository vocabulary outside a comment '
    + '(WO-8.12; this file’s header comment leaked 55 lines onto the deployed page once)',
    policyOnDisk && opens === closes && !leaked.length,
    'privacy.html on disk = ' + policyOnDisk + ', <!-- x' + opens + ' vs --> x' + closes
      + ', visible text ' + visible.trim().length + ' chars, markers found in it = '
      + JSON.stringify(leaked));

  const controller = await evalJs("(function(){ var c = navigator.serviceWorker.controller;"
    + " return c ? c.scriptURL : null; })()");
  /* Without this the two readings below prove nothing: an uncontrolled page fetches everything
     over the network, which is exactly what a correct fix looks like from here. */
  check('this page is controlled by ./sw.js — the precondition for asking what the worker does '
    + 'with a navigation, and the state in which the defect exists at all',
    typeof controller === 'string' && /\/sw\.js$/.test(controller),
    'navigator.serviceWorker.controller = ' + JSON.stringify(controller));

  /* Same-origin, so the document is readable. `#homeView` is in index.html's static markup, so it
     answers before any module has run — this asks which document came back, not whether it booted. */
  const READ_FRAME = `(function(){
    var f = document.getElementById('__wo812frame');
    var d = f && f.contentDocument;
    if (!d) return { reachable: false };
    var h1 = d.querySelector('h1');
    return { reachable: true, title: d.title || '',
      h1: h1 ? h1.textContent.trim().replace(/\\s+/g, ' ') : null,
      isApp: !!d.getElementById('homeView'), sections: d.querySelectorAll("section.panel").length }; })()`;

  async function navigateFrame(url) {
    await evalJs(`(function(){
      var old = document.getElementById('__wo812frame');
      if (old) old.remove();
      window.__wo812done = false;
      var f = document.createElement('iframe');
      f.id = '__wo812frame';
      f.style.cssText = 'position:fixed;left:-9999px;top:0;width:420px;height:320px;border:0';
      f.onload = function(){ window.__wo812done = true; };
      f.src = ${JSON.stringify(url)};
      document.body.appendChild(f);
      return 1; })()`);
    /* Wait on the condition, never on a clock (tools/README.md trap 5). */
    const until = Date.now() + 15000;
    while (Date.now() < until && !(await evalJs('!!window.__wo812done'))) {
      await new Promise(r => setTimeout(r, 100));
    }
    return await evalJs(READ_FRAME);
  }

  const beforePolicy = SERVED.length;
  const policy = await navigateFrame('/privacy.html?wo812=' + Date.now());
  const policyAsked = SERVED.slice(beforePolicy).filter(p => p === '/privacy.html');

  check('navigating to the policy on a page this worker controls renders THE POLICY and not the '
    + 'gradebook — the whole of WO-8.12’s first trap, driven through a real navigation rather '
    + 'than reasoned about the branch',
    policy.reachable === true && policy.isApp === false && /Privacy Policy/i.test(policy.title)
      && typeof policy.h1 === 'string' && /Privacy Policy/i.test(policy.h1),
    'title = ' + JSON.stringify(policy.title) + ', h1 = ' + JSON.stringify(policy.h1)
      + ', the app’s #homeView present in that document = ' + policy.isApp
      + ', sections = ' + policy.sections);

  check('and that navigation reached the NETWORK — the static server was asked for '
    + '/privacy.html, which is what "the worker let it through" looks like from outside the '
    + 'browser; a document answered out of Cache Storage never appears here',
    policyAsked.length === 1,
    policyAsked.length + ' request(s) for /privacy.html during that navigation, out of '
      + (SERVED.length - beforePolicy) + ' request(s) in the window: '
      + JSON.stringify(SERVED.slice(beforePolicy).slice(0, 8)));

  const beforeApp = SERVED.length;
  const app = await navigateFrame('/?wo812=' + Date.now());
  const appAsked = SERVED.slice(beforeApp).filter(p => p === '/index.html');

  check('the app’s own navigation still lands on the app — the half of this branch that was '
    + 'never broken, and the one a fix that simply deleted the branch would take with it',
    app.reachable === true && app.isApp === true,
    'title = ' + JSON.stringify(app.title) + ', #homeView present = ' + app.isApp);

  check('and it was answered out of Cache Storage, not the network: the static server was asked '
    + 'for /index.html ZERO times during it, which is the offline launch this branch exists for '
    + '(the query is unique, so the browser’s own HTTP cache cannot be what answered)',
    appAsked.length === 0,
    appAsked.length + ' request(s) for /index.html during that navigation, out of '
      + (SERVED.length - beforeApp) + ' request(s) in the window: '
      + JSON.stringify(SERVED.slice(beforeApp).slice(0, 8)));

  /* The frame comes off, the way every other section here hands the device back. A second app
     instance left running in an iframe would go on writing to the same IndexedDB after this run
     believes it has finished. */
  const cleaned = await evalJs("(function(){ var f = document.getElementById('__wo812frame');"
    + " if (f) f.remove(); delete window.__wo812done;"
    + " return { frames: document.querySelectorAll('iframe').length,"
    + " flag: typeof window.__wo812done }; })()");
  check('this section handed the page back as it found it — no iframe left in the document and no '
    + 'probe left on window',
    cleaned.frames === 0 && cleaned.flag === 'undefined',
    'iframes left = ' + cleaned.frames + ', window.__wo812done = ' + cleaned.flag);
}
}
