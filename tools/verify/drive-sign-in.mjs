/* drive-sign-in.mjs — the Drive sign-in (WO-7.1)
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
const { ROOT, results, check, readLocalStore, foreignIn, storeDetail, send, evalJs, has, clickSel,
  KILL_ANIM } = h;

/*
  ══════════ THE DRIVE SIGN-IN (WO-7.1) ══════════

  WHAT NO HARNESS CAN DO HERE, SAID FIRST, because every check below is shaped by it. This browser
  has no Google account, no Google session and no consent screen, so **the success path of the real
  handshake is unreachable from this file** and always will be. The work order's first two
  acceptance lines — a sign-in completes and the app receives a token, and the consent screen shows
  exactly one scope — are 👤 lines against `https://localhost:8443` on the owner's laptop, which is
  the only origin `hostAllowsSignIn()` accepts (WO-3.10; the client itself has also authorized
  `https://planbook.hwgteach.com` since 2026-08-21). Nothing here closes either of them, and
  a green run below is not a sign-in.

  WHAT IS MEASURABLE IS EVERYTHING AROUND IT, and it is most of the risk:

    · the scope. "Exactly one scope on the consent screen" is guaranteed by exactly one scope
      string existing in anything the browser loads, requested from one call site — and that is a
      static fact this file can assert completely. Read below rather than looked at.
    · the state machine on the far side of the token: what is held, where it is NOT held, what an
      expired one reads as, what a sign-out leaves behind, and what happens to a grant that is not
      the one we asked for. src/auth.js's acceptTokenResponse() is the seam these go through — the
      argument for it is at that function and it is src/backup.js's restoreFromText() argument
      exactly: a page cannot be handed a real file either, and the read is the only part that
      differs.
    · the flag. The arm that matters is the SHUT one, which is the arm every teacher on the
      released app meets — and a page cannot change its own hostname, so hostAllowsSignIn() is
      asked directly about the two hostnames this run can never be served from.
    · the two controls, tapped, at 44px, under a coarse pointer.

  AND ONE THING THE WHOLE FILE MEASURES WITHOUT MENTIONING IT: every check before this section ran
  with nobody signed in and no Google code on the page. "Every feature outside this phase works
  identically signed-out" is not a check here so much as a property of the run — which is why the
  first reading below is that the app arrived at this line signed out, with no GIS script in the
  document, after a thousand checks that never noticed.

  THE SECTION HANDS THE PAGE BACK SIGNED OUT. It seeds synthetic sessions through the seam and it
  is the last thing in this file before the summary, but the last check still asserts the state it
  found — nothing after this may read a device this section left holding a token.
*/
{
  const SCOPE_URL = 'https://www.googleapis.com/auth/drive.file';
  const CLIENT_ID = '953887983230-ub72ee8rs6r6ejggn55l83pva3e8pedl.apps.googleusercontent.com';

  /* Every file the app itself RUNS — index.html, sw.js and all of src/, 54 of them — which is the
     set the scope claim has to be about: a scope string in a `.md` is prose and a scope string in a
     file the app executes is a request. sw.js is in because it is served and runs; tools/ is out
     because no browser loads it. privacy.html is out on that same rule from the other side, and it
     is the reason this comment does not say "everything the browser loads": a browser does load it,
     and it DOES name the scope in prose, but it carries no script, so nothing on that page can ask
     Google for anything. The claim is about what executes, and it is wrong by exactly that one file
     if it is worded any wider. */
  const served71 = ['index.html', 'sw.js',
    ...(await fs.readdir(path.join(ROOT, 'src'))).filter(f => /\.(js|css)$/.test(f)).map(f => 'src/' + f)];
  const source71 = new Map();
  for (const rel of served71) source71.set(rel, await fs.readFile(path.join(ROOT, rel), 'utf8'));

  const scopeHits = [];
  const anyScopeHits = [];
  for (const [rel, text] of source71) {
    text.split('\n').forEach((line, i) => {
      if (line.includes(SCOPE_URL)) scopeHits.push(rel + ':' + (i + 1));
      for (const m of line.matchAll(/https:\/\/www\.googleapis\.com\/auth\/[A-Za-z0-9._-]+/g)) {
        anyScopeHits.push({ at: rel + ':' + (i + 1), scope: m[0] });
      }
    });
  }

  check('the one scope string exists exactly once in every file the app itself runs — index.html, '
    + 'sw.js and all of src/ — and it is in '
    + 'src/auth.js — which is what makes "the consent screen shows exactly one scope" a property '
    + 'of the code rather than a promise: Google draws one line per string requested',
    scopeHits.length === 1 && scopeHits[0].indexOf('src/auth.js:') === 0 && served71.length > 20,
    served71.length + ' file(s) the app runs, read; ' + SCOPE_URL + ' found at '
      + (scopeHits.join(', ') || 'nowhere'));

  const distinctScopes = [...new Set(anyScopeHits.map(h => h.scope))];
  check('and it is the ONLY Google scope of any kind anywhere in those files — not spreadsheets, '
    + 'not a mail scope, not drive.appdata, and not openid/profile/email added for convenience; '
    + 'every extra string is another line on a screen a teacher reads and fears',
    distinctScopes.length === 1 && distinctScopes[0] === SCOPE_URL,
    anyScopeHits.length + ' googleapis.com/auth/ string(s) across the served files, '
      + distinctScopes.length + ' distinct: ' + JSON.stringify(distinctScopes)
      + ' at ' + JSON.stringify(anyScopeHits.map(h => h.at)));

  /*
     A browser token flow has no client secret and no refresh token, and the way that stops being
     true is not a hostile edit — it is somebody pasting a server-side snippet. So this looks for
     the five names that only appear in one, USED rather than mentioned: read or written as a
     property, or handed over as a parameter. Prose about not having one does not match, and that
     distinction is the check being honest rather than lenient — src/auth.js argues the rule at
     length and would otherwise be the first file to fail it.
  */
  const FORBIDDEN71 = /\b(client_secret|refresh_token|access_type|approval_prompt|grant_type)\b\s*[:=]|[.[]\s*'?"?(client_secret|refresh_token|access_type|grant_type)\b/;
  const forbidden71 = [];
  for (const [rel, text] of source71) {
    text.split('\n').forEach((line, i) => {
      if (FORBIDDEN71.test(line)) forbidden71.push(rel + ':' + (i + 1) + '  ' + line.trim().slice(0, 90));
    });
  }
  check('no served file USES a client secret, a refresh token, or the offline-access parameters '
    + 'that would ask for one — there is no refresh token in a browser flow, and code written as '
    + 'if there were is how a background-sync assumption gets in (the work order’s sixth '
    + 'acceptance line, and its Traps line)',
    !forbidden71.length,
    forbidden71.length ? forbidden71.join(' · ')
      : 'none of client_secret / refresh_token / access_type / approval_prompt / grant_type is '
        + 'read, written or passed anywhere in ' + served71.length + ' served file(s)');

  const authSrc = source71.get('src/auth.js') || '';
  const authImports = [...authSrc.matchAll(/^import[^\n]*from\s+'([^']+)'/gm)].map(m => m[1]);
  const persists71 = ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'caches']
    .filter(api => authSrc.includes(api + '.') || authSrc.includes(api + '['));
  check('src/auth.js reaches no storage that outlives the page and imports one module — the token '
    + 'lives in a module variable, so a reload is a sign-out; and with no path from here to '
    + 'src/store.js, "sign-out leaves the local document untouched" is a property of the import '
    + 'graph rather than something a reviewer has to trace',
    !persists71.length && authImports.length === 1 && authImports[0] === './live-region.js'
      && authSrc.includes(CLIENT_ID),
    'storage APIs used: ' + JSON.stringify(persists71) + '; imports: ' + JSON.stringify(authImports)
      + '; the WO-3.10 client id is ' + (authSrc.includes(CLIENT_ID) ? 'present' : 'MISSING'));

  const swText71 = await fs.readFile(path.join(ROOT, 'sw.js'), 'utf8');
  const shellBlock71 = swText71.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
  const shell71 = shellBlock71 ? [...shellBlock71[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
  const indexHtml71 = source71.get('index.html') || '';
  check('the Google Identity Services library is in no precache list and in no <script> tag in '
    + 'index.html, while src/auth.js IS precached — the app boots and works with no network and no '
    + 'Google, and the library is fetched on demand only after a teacher taps Connect',
    shell71.length > 20 && shell71.some(p => /\/auth\.js$/.test(p))
      && !shell71.some(p => /accounts\.google|gsi/.test(p))
      && !/<script[^>]+accounts\.google/i.test(indexHtml71),
    'SHELL parsed to ' + shell71.length + ' entr(ies); ./src/auth.js present = '
      + shell71.some(p => /\/auth\.js$/.test(p)) + '; accounts.google in SHELL = '
      + shell71.some(p => /accounts\.google|gsi/.test(p)) + '; <script> tags in index.html naming '
      + 'accounts.google = ' + (indexHtml71.match(/<script[^>]+accounts\.google/gi) || []).length);

  /*
     THE OTHER HALF OF "EVERY FEATURE OUTSIDE THIS PHASE WORKS IDENTICALLY SIGNED-OUT", and it is
     the half a green run cannot give. A run proves the app works with nobody signed in; it says
     nothing about whether being signed in would change anything. This does: if the only module that
     imports src/auth.js is src/shell.js, then no screen, no report, no print surface and no signal
     rule can observe a sign-in at all, and "identically" is a property of the import graph.
  */
  const authImporters = [];
  for (const [rel, text] of source71) {
    if (rel === 'src/auth.js') continue;
    text.split('\n').forEach((line, i) => {
      if (/from\s+['"][^'"]*auth\.js['"]/.test(line) || /auth\.js['"]\s*\)/.test(line)) {
        authImporters.push(rel + ':' + (i + 1));
      }
    });
  }
  /*
     THE SET IS TWO SINCE WO-7.2, AND WHAT IS ASSERTED IS THE SET RATHER THAN THE SIZE. It was
     `length === 1` until 2026-09-07, when `src/drive-sync.js` — the transfer half of this same
     phase — became the second importer, exactly as this module's own header invited it to: "a
     later work order that needs the document should take the token from here rather than bring the
     store in."

     THE CLAIM IS UNCHANGED AND IS NOT WEAKER BY ONE FILE, because both importers are Phase 7's
     own. What "every feature outside this phase works identically signed-out" needs is that no
     file OUTSIDE the phase can observe a sign-in, and an allowlist of two named Phase 7 files says
     that where a count of one only said it by accident. A third importer is red, and so is a
     second one that is not `src/drive-sync.js` — which is the edit that would actually break the
     line: the roster, the score grid or the signal engine learning whether a teacher is connected.
  */
  const AUTH_IMPORTERS = ['src/shell.js', 'src/drive-sync.js'];
  const importerFiles = [...new Set(authImporters.map(a => a.split(':')[0]))].sort();
  check('the only files in the app that import src/auth.js are Phase 7’s own — src/shell.js, which '
    + 'draws the panel, and src/drive-sync.js, which spends the token — so nothing OUTSIDE this '
    + 'phase can tell whether a teacher is signed in, which is what makes "works identically '
    + 'signed-out" a fact about the import graph rather than a claim about a green run',
    importerFiles.length === 2
      && importerFiles.every(f => AUTH_IMPORTERS.indexOf(f) >= 0),
    authImporters.length + ' import(s) in ' + importerFiles.length + ' file(s): '
      + JSON.stringify(authImporters) + '; the allowed set is ' + JSON.stringify(AUTH_IMPORTERS));

  /*
     THE ONE PIECE OF COPY IN THIS SECTION THAT IS A DELIVERABLE — and WO-7.2 is the day the
     paragraph above this one predicted.

     What it said, until 2026-09-07: this build signs in and moves no data, a teacher who connects
     and assumes her gradebook is in Drive has been misled by an omission, so the sentence
     "Nothing is uploaded yet" is asserted rather than left to a later tidy-up — "and the day it
     stops being true is the day WO-7.2 lands and rewrites it on purpose." That day came, the
     upload is real, and the sentence would now be the lie it was written to prevent. It is gone
     from index.html and this check asserts that it is gone.

     WHAT REPLACED IT IS ASSERTED IN THE SECTION BELOW rather than here, and the split is
     deliberate: what sync puts in a teacher's Drive and the fact that sync is not a backup are
     WO-7.2's copy, and they belong beside the transfer they describe. What is left here is
     WO-7.1's own half — the permission, named in plain English and never as a scope URL, which is
     a claim about the sign-in and stays true whatever moves afterwards.
  */
  /* The element, not the first `</div>` after it — which was this check's own first defect: the
     section opens with a `.modal-section-label` div, so a naive slice ended 81 characters in and
     reported the copy missing from a file that has it. Tags are counted instead. */
  const driveBlock = (() => {
    const from = indexHtml71.indexOf('<div class="drive-panel');
    if (from < 0) return '';
    let depth = 0;
    for (const m of indexHtml71.slice(from).matchAll(/<div\b|<\/div>/g)) {
      depth += m[0] === '</div>' ? -1 : 1;
      if (depth === 0) return indexHtml71.slice(from, from + m.index + 6);
    }
    return '';
  })();
  check('the Drive panel names the one permission in plain English rather than as a scope URL, '
    + 'and no longer claims that nothing is uploaded — that sentence was this section’s '
    + 'deliverable while the build signed in and stopped, and WO-7.2 made it the lie it existed '
    + 'to prevent (what replaced it is asserted in the section below)',
    driveBlock.length > 200 && /Nothing is uploaded yet/.test(driveBlock) === false
      && /only the files you use with this app/.test(driveBlock)
      && driveBlock.indexOf(SCOPE_URL) < 0,
    'the block is ' + driveBlock.length + ' chars; "Nothing is uploaded yet" still present = '
      + /Nothing is uploaded yet/.test(driveBlock) + ', plain-English permission = '
      + /only the files you use with this app/.test(driveBlock) + ', raw scope URL in it = '
      + (driveBlock.indexOf(SCOPE_URL) >= 0));

  /* ── driven from here down ── */

  /* THE YEAR DOCUMENT AS ONE STRING, hashed in the page rather than shipped out of it. Two of the
     checks below compare the whole document across a sign-out and across a token lapsing, and by
     this point in the run it is hundreds of kilobytes of fixture — handing that back through CDP
     twice per comparison is slow for no gain. A length, the save counter and a djb2 over the
     serialised document answer the only question being asked: did anything at all move. */
  const DOC_FINGERPRINT = `(function(){
    var json = JSON.stringify(window.planbook.store.getDoc());
    var h = 5381;
    for (var i = 0; i < json.length; i++) h = ((h * 33) ^ json.charCodeAt(i)) >>> 0;
    var doc = window.planbook.store.getDoc();
    return 'chars:' + json.length + '|rev:' + doc.rev + '|h:' + h.toString(36); })()`;


  await evalJs("(function(){ Array.prototype.forEach.call("
    + "document.querySelectorAll('.modal-overlay:not(.hidden)'), function(m){"
    + " window.planbook.closeModal(m); }); return 1; })()");

  /* One round trip for everything about the sign-in that a screen or a caller can ask. The token
     is read separately and only where a check needs the string; authState() deliberately does not
     carry it. */
  const READ_AUTH = `(function(){
    var a = window.planbook.auth;
    var s = a.authState();
    var panel = document.getElementById('drivePanel');
    var status = document.getElementById('driveStatus');
    var connect = document.getElementById('driveConnectBtn');
    var disconnect = document.getElementById('driveDisconnectBtn');
    function box(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { h: Math.round(r.height * 100) / 100, w: Math.round(r.width * 100) / 100,
        shown: !el.classList.contains('hidden'), disabled: !!el.disabled,
        label: (el.textContent || '').trim() };
    }
    return { state: s, hasToken: a.accessToken() !== null, now: Date.now(),
      coarse: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches),
      gisScripts: document.querySelectorAll('script[src*="accounts.google.com"]').length,
      panelShown: !!(panel && !panel.classList.contains('hidden')),
      /* The SECTION and the MODAL are two questions and the first run of this block conflated
         them: #drivePanel stays drawn for as long as the flag is open, which is exactly right and
         is not an answer about whether the About panel is on screen. */
      aboutOpen: (function(){ var m = document.getElementById('aboutModal');
        return !!(m && !m.classList.contains('hidden')); })(),
      statusText: status ? status.textContent.trim() : null,
      statusClass: status ? status.className : null,
      connect: box(connect), disconnect: box(disconnect) }; })()`;

  const arrived = await evalJs(READ_AUTH);
  check('the app reached this line signed out, with no token, nothing held, and not one Google '
    + 'script in the document — every check above this one ran that way, which is the whole of '
    + '"every feature outside this phase works identically signed-out" measured rather than '
    + 'asserted',
    arrived.state.signedIn === false && arrived.hasToken === false
      && arrived.state.fields.length === 0 && arrived.state.busy === false
      && arrived.state.lastError === '' && arrived.gisScripts === 0
      && results.length > 900,
    'authState = ' + JSON.stringify(arrived.state) + ', accessToken() is a string = '
      + arrived.hasToken + ', GIS <script> tags = ' + arrived.gisScripts
      + ', checks already run in this file = ' + results.length);

  /* The flag's truth table, asked of the function rather than of this origin — see the note at
     hostAllowsSignIn() in src/auth.js for why it is a function of a hostname at all. The deployed
     host and the LAN address the iPad reaches are the two answers that matter and the two this run
     can never be served from. */
  const flag71 = await evalJs(`(function(){
    var f = window.planbook.auth.hostAllowsSignIn;
    var hosts = ['localhost', '127.0.0.1', 'planbook.hwgteach.com', '192.168.50.142',
      'localhost.hwgteach.com', 'notlocalhost', ''];
    var out = {};
    hosts.forEach(function(h){ out[h || '(empty)'] = f(h); });
    return { table: out, here: window.planbook.auth.signInAvailable(),
      hostname: location.hostname }; })()`);
  check('the flag is the origin, and it is shut everywhere but loopback: the deployed host and the '
    + 'iPad’s LAN address both answer false, so the released app draws no sign-in and fetches no '
    + 'Google script at all — which is what keeps privacy.html’s "no third-party code of any kind" '
    + 'true word for word (WO-7.3 widens this one function; the client’s origin list already carries the deployed origin, so the code is the half that is behind)',
    flag71.table['localhost'] === true && flag71.table['127.0.0.1'] === true
      && flag71.table['planbook.hwgteach.com'] === false
      && flag71.table['192.168.50.142'] === false
      && flag71.table['localhost.hwgteach.com'] === false
      && flag71.table['notlocalhost'] === false && flag71.table['(empty)'] === false
      && flag71.here === true,
    'hostAllowsSignIn = ' + JSON.stringify(flag71.table) + '; this page is '
      + JSON.stringify(flag71.hostname) + ' and reads ' + flag71.here);

  const openAbout71 = async () => {
    await evalJs("(function(){ Array.prototype.forEach.call("
      + "document.querySelectorAll('.modal-overlay:not(.hidden)'), function(m){"
      + " window.planbook.closeModal(m); }); return 1; })()");
    await clickSel('[data-modal-open="aboutModal"]');
    const until = Date.now() + 3000;
    let seen = await evalJs(READ_AUTH);
    while (Date.now() < until && !(seen.panelShown && seen.statusText)) {
      await new Promise(r => setTimeout(r, 100));
      seen = await evalJs(READ_AUTH);
    }
    return seen;
  };
  const closeAbout71 = () => evalJs("window.planbook.closeModal('aboutModal'); 1");

  const resting = await openAbout71();
  check('opening About on a loopback origin shows the Drive section with one control offered — '
    + 'Connect live, Disconnect not on the screen at all, and a line that says the app works the '
    + 'same either way rather than leaving a teacher to guess what "not connected" costs her',
    resting.panelShown === true && resting.connect && resting.connect.shown === true
      && resting.connect.disabled === false && resting.connect.label === 'Connect Google Drive'
      && resting.disconnect && resting.disconnect.shown === false
      && /^Not connected\./.test(resting.statusText)
      && resting.statusClass === 'class-hint',
    'panel shown = ' + resting.panelShown + ', Connect = ' + JSON.stringify(resting.connect)
      + ', Disconnect = ' + JSON.stringify(resting.disconnect) + ', status = '
      + JSON.stringify(resting.statusText) + ' (' + resting.statusClass + ')');

  /* Both controls under a coarse pointer, which is the only way to read the 44px rule: they are
     `.class-action-btn`, so the floor they clear is one src/shell.css already owns — and that is
     the claim, since this work order deliberately invented no new control grammar. The pointer is
     asserted coarse before either measurement is believed (tools/README.md § CDP trap 3). */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await new Promise(r => setTimeout(r, 400));
  /* Re-injected before anything is measured, for tools/README.md § CDP trap 2: a headless frame
     never advances the modal panel's opening keyframe, so a button inside it measures 44 x 0.96 =
     42.24px and reads exactly like a failed touch target. */
  await evalJs(KILL_ANIM);
  const coarseOut = await openAbout71();
  check('Connect clears 44 by 44 with the pointer actually coarse — at 390px, where index.html '
    + 'measures the header’s spare width at ~46px and presentation mode already spent it, which '
    + 'is why this control is in a modal and not up there',
    coarseOut.coarse === true && coarseOut.connect && coarseOut.connect.h >= 44
      && coarseOut.connect.w >= 44,
    'pointer is ' + (coarseOut.coarse ? 'coarse' : 'FINE') + ', Connect = '
      + JSON.stringify(coarseOut.connect));

  const SEED = (token, seconds, extra) => `(function(){
    return window.planbook.auth.acceptTokenResponse(Object.assign({
      access_token: ${JSON.stringify(token)}, expires_in: ${seconds},
      scope: ${JSON.stringify(SCOPE_URL)}, token_type: 'Bearer' }, ${JSON.stringify(extra || {})})); })()`;

  const TOKEN_A = 'wo71-synthetic-token-a-' + Date.now();
  await evalJs(SEED(TOKEN_A, 3599));
  await evalJs('window.planbook.auth.refreshAuthChrome(); 1');
  const coarseIn = await evalJs(READ_AUTH);
  check('and Disconnect clears it too, in the state it is the only control drawn in — the pair of '
    + 'them is the whole of this section’s new chrome, and neither gets its own 44 from a rule '
    + 'this work order wrote',
    coarseIn.coarse === true && coarseIn.disconnect && coarseIn.disconnect.shown === true
      && coarseIn.disconnect.h >= 44 && coarseIn.disconnect.w >= 44
      && coarseIn.connect.shown === false,
    'pointer is ' + (coarseIn.coarse ? 'coarse' : 'FINE') + ', Disconnect = '
      + JSON.stringify(coarseIn.disconnect) + ', Connect now shown = ' + coarseIn.connect.shown);

  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));

  const held = await evalJs(`(function(){
    var a = window.planbook.auth;
    var s = a.authState();
    return { state: s, token: a.accessToken(), now: Date.now() }; })()`);
  check('a token that arrives is held as exactly three fields — the access token, when it lapses, '
    + 'and what Google said it granted — and nothing else, whatever the response carried: the '
    + 'three-field copy in acceptTokenResponse() is the "no refresh token is stored" line written '
    + 'as a shape rather than as a check for a name',
    held.state.signedIn === true && held.token === TOKEN_A
      && JSON.stringify(held.state.fields) === JSON.stringify(['token', 'expiresAt', 'granted'])
      && held.state.expiresAt - held.now > 3500 * 1000
      && held.state.expiresAt - held.now <= 3599 * 1000,
    'fields = ' + JSON.stringify(held.state.fields) + ', accessToken() matches what Google sent = '
      + (held.token === TOKEN_A) + ', it lapses in '
      + Math.round((held.state.expiresAt - held.now) / 1000) + 's');

  /* THE MEMORY-ONLY RULE, MEASURED RATHER THAN ARGUED. src/auth.js's header argues it at length;
     this asks the browser. Everything a page has that outlives the page is searched for the token
     that is live in the app right now — and the localStorage half re-asserts the standing rule
     that every key there is ours, which is the check trap 8 in tools/README.md exists to keep
     trustworthy. Cache Storage is not searched: sw.js caches only same-origin GETs and Google is
     neither, which is its own check further up this file. */
  const store71 = await readLocalStore(evalJs, 4000);
  const elsewhere71 = await evalJs(`(function(){
    var ss = {};
    try { for (var i = 0; i < sessionStorage.length; i++) {
      var k = sessionStorage.key(i); ss[k] = String(sessionStorage.getItem(k)).slice(0, 4000); } } catch (e) {}
    var doc = '';
    try { doc = JSON.stringify(window.planbook.store.getDoc()); } catch (e) { doc = '(unreadable)'; }
    return { session: ss, cookie: document.cookie || '', docChars: doc.length,
      inDoc: doc.indexOf(${JSON.stringify(TOKEN_A)}) >= 0 }; })()`);
  const localHits71 = Object.keys(store71).filter(k =>
    k.includes(TOKEN_A) || String(store71[k]).includes(TOKEN_A));
  const sessionHits71 = Object.keys(elsewhere71.session).filter(k =>
    k.includes(TOKEN_A) || String(elsewhere71.session[k]).includes(TOKEN_A));
  check('and while it is held, the token is in no storage that survives the page: not in '
    + 'localStorage, not in sessionStorage, not in a cookie, and not in the year document — so a '
    + 'reload is a sign-out and a laptop handed to a substitute carries no credential (and every '
    + 'localStorage key present is still ours)',
    !localHits71.length && !sessionHits71.length && !elsewhere71.inDoc
      && !elsewhere71.cookie.includes(TOKEN_A) && !foreignIn(store71).length
      && elsewhere71.docChars > 100,
    'localStorage: ' + storeDetail(store71) + '; sessionStorage keys = '
      + JSON.stringify(Object.keys(elsewhere71.session)) + '; cookie length = '
      + elsewhere71.cookie.length + '; the open document is ' + elsewhere71.docChars
      + ' chars and holds the token = ' + elsewhere71.inDoc);

  /* The mutation this shape exists to catch, driven: a response carrying the fields a server-side
     flow would send. A build that spread the response instead of copying three fields out of it
     passes every grep in this file — `refresh_token` is nowhere in the source either way — and
     fails here. */
  const REFRESH_MARKER = 'wo71-refresh-token-that-does-not-exist';
  const TOKEN_B = 'wo71-synthetic-token-b-' + Date.now();
  await evalJs(SEED(TOKEN_B, 3599, { refresh_token: REFRESH_MARKER, id_token: 'wo71-id-token',
    authuser: '0', hd: 'example.org' }));
  const afterExtras = await evalJs(`(function(){
    var a = window.planbook.auth;
    var s = a.authState();
    return { fields: s.fields, signedIn: s.signedIn, token: a.accessToken(),
      stateJson: JSON.stringify(s) }; })()`);
  check('a response carrying a refresh token, an id token and three extras leaves the session at '
    + 'the same three fields, with none of them anywhere in the state a screen can read — the one '
    + 'edit that would break the sixth acceptance line and pass every grep',
    JSON.stringify(afterExtras.fields) === JSON.stringify(['token', 'expiresAt', 'granted'])
      && afterExtras.signedIn === true && afterExtras.token === TOKEN_B
      && afterExtras.stateJson.indexOf(REFRESH_MARKER) < 0
      && afterExtras.stateJson.indexOf('refresh') < 0
      && afterExtras.stateJson.indexOf('id_token') < 0,
    'fields = ' + JSON.stringify(afterExtras.fields) + ', the state a screen reads = '
      + afterExtras.stateJson.slice(0, 300));

  const wrongGrant = await evalJs(`(function(){
    var a = window.planbook.auth;
    var took = a.acceptTokenResponse({ access_token: 'wo71-wrong-scope-token', expires_in: 3599,
      scope: 'https://www.googleapis.com/auth/spreadsheets' });
    var s = a.authState();
    return { took: took, signedIn: s.signedIn, fields: s.fields, lastError: s.lastError,
      token: a.accessToken() }; })()`);
  check('a grant that is not the one we asked for is refused and stores nothing — if Google ever '
    + 'answers with spreadsheets attached, this app is signed out and says so rather than holding '
    + 'a scope its own consent screen never showed',
    wrongGrant.took === false && wrongGrant.signedIn === false && wrongGrant.token === null
      && wrongGrant.fields.length === 0
      && /permission/i.test(wrongGrant.lastError),
    'acceptTokenResponse returned ' + wrongGrant.took + ', signedIn = ' + wrongGrant.signedIn
      + ', fields = ' + JSON.stringify(wrongGrant.fields) + ', the teacher is told: '
      + JSON.stringify(wrongGrant.lastError));

  const noToken = await evalJs(`(function(){
    var a = window.planbook.auth;
    var one = a.acceptTokenResponse(null);
    var two = a.acceptTokenResponse({ expires_in: 3599, scope: ${JSON.stringify(SCOPE_URL)} });
    var s = a.authState();
    return { one: one, two: two, signedIn: s.signedIn, lastError: s.lastError }; })()`);
  check('an answer with no token in it is refused twice over — null, and a well-formed response '
    + 'missing the one field that matters — and leaves a sentence rather than a silent nothing',
    noToken.one === false && noToken.two === false && noToken.signedIn === false
      && noToken.lastError.length > 20,
    'null returned ' + noToken.one + ', tokenless response returned ' + noToken.two
      + ', the teacher is told: ' + JSON.stringify(noToken.lastError));

  /*
    TOKEN EXPIRY, DRIVEN IN THREE SECONDS RATHER THAN AN HOUR.

    `signedIn` is computed from the clock on every read and stored as no flag anywhere, so a token
    seeded with a 63-second life crosses the one-minute freshness margin while this block watches,
    with no code running and nothing to notice it. That is the shape of the fifth acceptance line
    that a desk can prove: not the hour, but the fact that NOTHING in this module can go on
    claiming a connection after the token behind it has lapsed.

    The year document is read before and after, whole, because "without data loss" is the other
    half of that line and the honest way to say it here is that a lapse is not an event this app
    responds to at all — there is nothing for it to lose.
  */
  const docBefore71 = await evalJs(DOC_FINGERPRINT);
  const TOKEN_C = 'wo71-synthetic-token-c-' + Date.now();
  await evalJs(SEED(TOKEN_C, 63));
  const lapsing = await evalJs(READ_AUTH);
  const lapseStart = Date.now();
  /* Polled, never slept (tools/README.md § CDP trap 5), and what it waits for is exactly what the
     check asserts. */
  let lapsed = lapsing;
  while (Date.now() - lapseStart < 8000 && lapsed.state.signedIn) {
    await new Promise(r => setTimeout(r, 100));
    lapsed = await evalJs(READ_AUTH);
  }
  const lapseMs = Date.now() - lapseStart;
  const docAfter71 = await evalJs(DOC_FINGERPRINT);
  check('a token seeded with 63 seconds of life reads as signed in and then, with no code running '
    + 'and nothing dispatched, reads as signed out the moment it crosses the one-minute freshness '
    + 'margin — expiry is computed on every read, so there is no stale flag anywhere to disagree '
    + 'with the clock, and the year document is byte-identical across it',
    lapsing.state.signedIn === true && lapsed.state.signedIn === false
      && lapseMs > 1000 && lapseMs < 8000 && docAfter71 === docBefore71
      && /chars:[1-9]/.test(docBefore71),
    'signed in at seed, out after ' + lapseMs + 'ms with a 63s token and a 60s margin; '
      + 'accessToken() now a string = ' + lapsed.hasToken + '; the document was '
      + docBefore71 + ' and is now ' + docAfter71);

  const lapsedPanel = await openAbout71();
  check('and the panel opened on that lapsed token says "not connected" rather than reporting an '
    + 'hour it no longer has — the one surface that reports on this credential cannot be quietly '
    + 'wrong, which is what "without a silent failure" means on a build where nothing syncs yet',
    /^Not connected\./.test(lapsedPanel.statusText) && lapsedPanel.connect.shown === true
      && lapsedPanel.disconnect.shown === false && lapsedPanel.state.signedIn === false,
    'status = ' + JSON.stringify(lapsedPanel.statusText) + ', Connect shown = '
      + lapsedPanel.connect.shown + ', Disconnect shown = ' + lapsedPanel.disconnect.shown);

  /*
    SIGN-OUT, BY A REAL TAP ON THE REAL BUTTON through the one delegated listener — the only half
    of this feature a click can reach end to end, because it talks to nobody. The document is
    compared whole on both sides of it: the acceptance line is "sign-out leaves the local document
    intact and removes the token", and one of those two halves is the one an import graph already
    guarantees (src/auth.js imports src/live-region.js and nothing else).
  */
  const TOKEN_D = 'wo71-synthetic-token-d-' + Date.now();
  await evalJs(SEED(TOKEN_D, 3599));
  const signedIn71 = await openAbout71();
  const docBeforeOut = await evalJs(DOC_FINGERPRINT);
  await clickSel('[data-drive-disconnect]');
  const signedOut71 = await evalJs(READ_AUTH);
  const docAfterOut = await evalJs(DOC_FINGERPRINT);
  const storeAfterOut = await readLocalStore(evalJs, 4000);
  check('one tap of Disconnect, on the button a teacher actually taps, signs the app out and '
    + 'leaves the year document byte-identical — the token gone from the state, from accessToken() '
    + 'and from every storage on the device, and the panel back to offering Connect',
    signedIn71.state.signedIn === true && signedOut71.state.signedIn === false
      && signedOut71.hasToken === false && signedOut71.state.fields.length === 0
      && docAfterOut === docBeforeOut && /chars:[1-9]/.test(docBeforeOut)
      && signedOut71.connect.shown === true && signedOut71.disconnect.shown === false
      && !Object.keys(storeAfterOut).some(k => String(storeAfterOut[k]).includes(TOKEN_D)),
    'before the tap signedIn = ' + signedIn71.state.signedIn + '; after, authState = '
      + JSON.stringify(signedOut71.state) + '; the document was ' + docBeforeOut
      + ' and is now ' + docAfterOut
      + '; localStorage: ' + storeDetail(storeAfterOut));

  /*
    AND THE OTHER BUTTON, TAPPED — the last thing this section does, because it is the one control
    here that talks to Google and this run cannot know whether it can reach it.

    WHAT IS ASSERTED IS DELIBERATELY THE UNION OF BOTH OUTCOMES, and that is not a hedge. On a
    machine that cannot reach accounts.google.com the script fails to load and the panel says so;
    on one that can, GIS is asked for a token, the origin is not one the client authorises, and the
    panel says something else. Either way the two things this check is for are true: the tap
    REACHED src/auth.js through the delegated listener, and it did not sign anybody in. A check
    that demanded one particular message would go red about the network rather than about the app,
    which is trap 8 in tools/README.md.

    Nothing is awaited to completion. A request that is still out when this file ends is a timer in
    a browser that is about to be killed; what must not happen is this section leaving a SESSION
    behind, which the last check below is what settles.
  */
  const beforeTap = await openAbout71();
  await clickSel('[data-drive-connect]');
  const tapUntil = Date.now() + 4000;
  let tapped = await evalJs(READ_AUTH);
  while (Date.now() < tapUntil && tapped.statusText === beforeTap.statusText) {
    await new Promise(r => setTimeout(r, 100));
    tapped = await evalJs(READ_AUTH);
  }
  check('one tap of Connect reaches the module and changes the line — either "waiting for Google" '
    + 'or a sentence naming what went wrong, never the resting text and never a silent nothing — '
    + 'and it signs nobody in, which is as far as any harness can take a handshake that needs a '
    + 'real account (acceptance lines 1 and 2 are 👤, against https://localhost:8443)',
    tapped.statusText !== beforeTap.statusText && tapped.statusText.length > 10
      && tapped.state.signedIn === false && tapped.hasToken === false,
    'the line went ' + JSON.stringify(beforeTap.statusText) + ' -> '
      + JSON.stringify(tapped.statusText) + ' (' + tapped.statusClass + '), signedIn = '
      + tapped.state.signedIn + ', GIS <script> tags now = ' + tapped.gisScripts);

  await evalJs('window.planbook.auth.disconnect(); 1');
  await closeAbout71();
  const handedBack71 = await evalJs(READ_AUTH);
  check('this section handed the page back signed out and closed — no session, no token, nothing '
    + 'held, and the About panel shut, so nothing after this line reads a device this block left '
    + 'holding a credential',
    handedBack71.state.signedIn === false && handedBack71.hasToken === false
      && handedBack71.state.fields.length === 0 && handedBack71.aboutOpen === false
      && handedBack71.coarse === false,
    'authState = ' + JSON.stringify(handedBack71.state) + ', About open = '
      + handedBack71.aboutOpen + ', pointer coarse = ' + handedBack71.coarse);
}
}
