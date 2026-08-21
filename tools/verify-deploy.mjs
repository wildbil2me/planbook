#!/usr/bin/env node
/* verify-deploy.mjs — read the deployment, not the repository. WO-8.8.
 *
 *   node tools/verify-deploy.mjs                          the production origin
 *   node tools/verify-deploy.mjs https://foo.pages.dev     any other one
 *
 * Run this BY HAND, after a deploy, the way `verify-shell.mjs` is run by hand before one. It
 * gates nothing — no hook, no CI, no schedule, no other script calls it, and the app ships
 * whether or not it has ever been run (`plans/verification-tooling.md` § The boundary).
 *
 * WHY IT EXISTS. WO-8.7's first deploy shipped two faults and every check in this repository was
 * green through both of them — 628 of 628 before, 628 of 628 after, because neither fault is in
 * this repository at all:
 *
 *   - `sw.js` precached `./index.html`, Cloudflare Pages answers that path with a 308, `addAll`
 *     followed it and stored a response with `redirected` set, and Safari refuses to serve one of
 *     those to a navigation. The app opened once and then showed a white screen (WO-1.14). The
 *     redirect is the HOST's routing. It does not exist on disk and cannot be derived from disk.
 *   - `_headers` pinned `Cache-Control: no-cache` on `/sw.js`, was spelled correctly, and did not
 *     bind: the Cloudflare zone's own Browser Cache TTL (four hours on a new zone) rewrote it to
 *     `max-age=14400`. That is a setting in a dashboard, not a file. The shell document escaped it
 *     because HTML is not edge-cached, which is exactly why `/` looked fine and hid the problem.
 *
 * What found both was one HTTP request against the live origin. This is that, written down.
 *
 * THREE THINGS IN HERE ARE DELIBERATE AND LOOK LIKE OVERSIGHTS. Each is a trap this work order
 * was routed around, and each is commented again at the line where it bites:
 *
 *   1. The SHELL list is read out of the DEPLOYED `sw.js`, never the local one. Sourcing both
 *      sides from the working tree compares a file with itself and passes forever.
 *   2. `redirect: 'manual'` on every request. `fetch` follows redirects by default, and a
 *      followed 308 is indistinguishable from a 200 — which is precisely how the defect above
 *      stayed invisible.
 *   3. There is no retry. A flaky answer is information; a retry loop converts it into a
 *      confident pass over nothing, which `plans/dispatch-retro.md` keeps naming as worse than
 *      no check at all.
 *
 * AND THE ONE GENUINE DEPARTURE: this is the first check in this project that needs a network.
 * Everything else in `tools/` runs against files on disk or a browser pointed at localhost, which
 * is why it all works on a plane. So a transport failure — DNS, TLS, refused, timed out — stops
 * the run as UNREACHABLE and prints no red check at all. A network error reported as a failed
 * assertion is worse than no check: it says the deployment is broken when what is broken is the
 * hotel wifi, and the next person to see a red run believes it less.
 *
 * EXIT CODES
 *   0  every check passed
 *   1  a check failed — something about the deployment is wrong
 *   2  the origin could not be reached — nothing was asserted, and nothing went red
 *
 * AND THE EXIT CODE IS SET, NOT CALLED, which is the one thing in here that looks like a style
 * preference and is not. `process.exit()` after a `fetch` aborts the process on Windows often
 * enough to matter — 2 of 5 runs on Node v24.16.0, exiting `0xC0000409` (bash reports 127) with
 * the full, correct output already on the terminal. A run that read a perfect deployment then
 * handed back a failing status is the worst possible defect in a tool whose entire product is a
 * status. `process.exitCode` and a natural exit measured 3 of 3 correct and cost nothing: the
 * sockets are unref'd, so the process still ends in about half a second. Measured 2026-08-12.
 * (The one `process.exit()` below is before any request is made, which is where it is safe.)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTION = 'https://planbook.hwgteach.com';
const TIMEOUT_MS = 15000;

/* The first argument that is not a flag is the origin. No config file, by the same rule that
   keeps its siblings scripts rather than infrastructure. */
const arg = process.argv.slice(2).find(a => !a.startsWith('-'));
const ORIGIN = (arg || PRODUCTION).replace(/\/+$/, '');

if (typeof fetch !== 'function') {
  console.error('This needs Node 18 or newer — `fetch` is not defined here.');
  process.exit(1);
}

/* ────────────────────────────── result bookkeeping ──────────────────────────────
   Same shape as tools/wo-sweep.mjs and tools/verify-shell.mjs, so a reader takes one format from
   three commands. Two states only. A check that COULD NOT RUN is a FAIL with the reason in its
   detail, never a quiet skip and never a pass — WO-2.22 settled that for the sweep and the
   argument is the same here. */

const results = [];
function check(name, ok, detail) {
  results.push({ name, state: ok ? 'pass' : 'fail', detail: detail || '' });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? '  :: ' + detail : ''));
}

/* Printed, never counted, never able to fail. It exists because the deliverable asks the run to
   say what it read rather than to hand back a row of ticks. */
function observed(text) {
  console.log('  ·      ' + text);
}

/* ────────────────────────────── the wire ────────────────────────────── */

class Unreachable extends Error {
  constructor(url, cause) {
    super('could not reach ' + url);
    this.url = url;
    this.cause = cause;
  }
}

/* Every transport failure arrives here as `TypeError: fetch failed`, which tells a reader nothing.
   The useful word is two or three levels down and in a different place each time: DNS puts
   `ENOTFOUND` on `.cause`, a refused connection puts `ECONNREFUSED` inside an AggregateError's
   `.errors`, a timeout arrives as a `TimeoutError` with no code at all, and a connection dropped
   mid-body is `UND_ERR_SOCKET`. Worth the ten lines: "the wifi is out" and "that origin does not
   exist" are the same message otherwise, at the moment someone is trying to tell them apart. */
function transportReason(err) {
  const out = [];
  let e = err;
  for (let i = 0; i < 4 && e; i++) {
    if (typeof e.code === 'string') out.push(e.code);
    else if (e.name && !/^(TypeError|Error|AggregateError)$/.test(e.name)) out.push(e.name);
    e = (Array.isArray(e.errors) && e.errors[0]) || e.cause;
  }
  return [...new Set(out)].join(' / ');
}

/* One request. No retry (trap 3), no redirect following (trap 2), and a timeout that is a
   transport failure like any other rather than a check going red.

   `redirect: 'manual'` is the whole instrument. With the default, a 308 arrives here wearing the
   status and headers of whatever it pointed at, and every assertion below would be made about the
   wrong response. */
async function get(url) {
  let res;
  try {
    res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new Unreachable(url, err);
  }
  let bytes = 0;
  let text = '';
  try {
    /* Read the body even when nothing parses it: an unread body holds the socket open, and the
       byte count is evidence — a 200 that is 0 bytes long is a different problem from a 404. */
    const buf = Buffer.from(await res.arrayBuffer());
    bytes = buf.length;
    text = buf.toString('utf8');
  } catch (err) {
    throw new Unreachable(url, err); // the connection died mid-body; still not an assertion
  }
  const h = (n) => res.headers.get(n);
  return {
    url,
    status: res.status,
    contentType: h('content-type') || '',
    cacheControl: h('cache-control'),
    location: h('location'),
    cfCacheStatus: h('cf-cache-status'),
    age: h('age'),
    bytes,
    text,
  };
}

const isRedirect = (r) => r.status >= 300 && r.status < 400;

/* The line the deliverable calls "status, Cache-Control and redirect chain per path, printed". */
function say(label, r) {
  const bits = [String(r.status)];
  if (isRedirect(r)) bits.push('→ ' + (r.location || '(no Location header)'));
  bits.push(r.contentType || '(no content-type)');
  bits.push('cache-control: ' + (r.cacheControl === null ? '(absent)' : r.cacheControl));
  bits.push(r.bytes + ' B');
  if (r.cfCacheStatus) bits.push('cf-cache-status: ' + r.cfCacheStatus);
  if (r.age) bits.push('age: ' + r.age);
  console.log('  GET   ' + label.padEnd(30) + '  ' + bits.join(' · '));
}

/* Followed by hand, and ONLY to describe a redirect that has already failed a check. Following on
   the way in is trap 2; following afterwards to say where the 308 went is the diagnosis a human
   would otherwise go and get. Capped, so a redirect loop cannot hang the run. */
async function chainOf(start) {
  const hops = [];
  let url = start;
  for (let i = 0; i < 5; i++) {
    const r = await get(url);
    hops.push(r.status + (isRedirect(r) ? ' → ' + r.location : ''));
    if (!isRedirect(r) || !r.location) break;
    url = new URL(r.location, url).href;
  }
  return hops.join(' ');
}

/* ────────────────────────────── header reading ──────────────────────────────
   `_headers` pins the literal token `no-cache` on `/`, `/index.html` and `/sw.js`. This asserts
   that token and not a semantic equivalent: `max-age=0, must-revalidate` behaves nearly the same
   and is ALSO what this deployment sends on every path nobody pinned, so accepting it would make
   the check green on a file whose rule stopped binding. What we are watching for is the rule not
   surviving the trip. */
function directives(value) {
  return new Set(String(value || '').toLowerCase().split(',').map(s => s.trim().split('=')[0]).filter(Boolean));
}
function maxAgeOf(value) {
  const m = /(?:^|,)\s*max-age\s*=\s*(\d+)/i.exec(String(value || ''));
  return m ? Number(m[1]) : null;
}
function cacheDetail(r) {
  const raw = r.cacheControl === null ? '(absent)' : r.cacheControl;
  const age = maxAgeOf(r.cacheControl);
  if (age !== null && age > 0) {
    return `cache-control: ${raw} — a positive max-age here is the Cloudflare zone rewriting `
      + `_headers, not the file being wrong. Caching → Configuration → Respect Existing Headers, `
      + `then re-read this path (WO-8.7, 2026-08-12)`;
  }
  return 'cache-control: ' + raw;
}

/* What a path's extension says its content type ought to look like. Used because THIS host answers
   an unknown path with the shell document at 200 — measured 2026-08-12: `/nope-does-not-exist`
   comes back 200 `text/html` and byte-identical to `/`. So "the precache list resolves 200" is
   green over a file that was never deployed, and the app then caches HTML under the name of a
   stylesheet and opens offline unstyled. The type is what tells those apart. */
const TYPE_FOR = [
  [/\.m?js$/i, /(java|ecma)script/i, 'JavaScript'],
  [/\.css$/i, /text\/css/i, 'CSS'],
  [/\.png$/i, /image\/png/i, 'a PNG'],
  [/\.svg$/i, /image\/svg/i, 'an SVG'],
  [/\.ico$/i, /image\//i, 'an icon'],
  [/\.webmanifest$/i, /(manifest\+json|application\/json)/i, 'a web manifest'],
  [/\.json$/i, /json/i, 'JSON'],
  [/\.html$/i, /text\/html/i, 'HTML'],
  [/\/$/, /text\/html/i, 'HTML'],
];
function expectedType(pathname) {
  for (const [when, want, label] of TYPE_FOR) if (when.test(pathname)) return { want, label };
  return null;
}

/* ────────────────────────────── the run ────────────────────────────── */

console.log('verify-deploy.mjs — ' + ORIGIN);
console.log('Read on ' + new Date().toISOString() + ', following no redirects.\n');

let unreachable = null;

try {
  /* ── the shell document ── */
  console.log('── the shell document ──');
  const root = await get(ORIGIN + '/');
  say('/', root);

  check('the shell document answers 200', root.status === 200,
    isRedirect(root)
      ? `${root.status} → ${root.location} — a teacher types the bare origin, so this is the request that `
        + `carries the app; ${await chainOf(ORIGIN + '/')}`
      : String(root.status));
  check('the shell document is HTML', /text\/html/i.test(root.contentType),
    root.contentType || '(no content-type)');
  check('the shell document carries Cache-Control: no-cache', directives(root.cacheControl).has('no-cache'),
    cacheDetail(root));

  /* ── the privacy policy ──
     WO-8.12's first Acceptance line, and it says in as many words that the policy is to be
     "fetched over the wire rather than asserted from the repo" — so it is here, in the only check
     in this repository that reads the live origin, rather than in verify-shell.mjs. The file being
     in the working tree proves nothing: this is a URL Google fetches during OAuth verification
     (WO-3.18), from the outside, once, and a 404 or a redirect at that moment is the whole cost.

     THE CANONICAL URL IS `/privacy`, EXTENSIONLESS, and that is this host's doing rather than a
     preference. Cloudflare Pages serves `privacy.html` at `/privacy` and answers the `.html` path
     with a redirect, exactly as it does for `/index.html` → `/` (see the note on SHELL in sw.js
     for what that redirect already cost this project once). `/privacy` is therefore the URL to
     paste into the verification form, and the one asserted here. */
  console.log('\n── the privacy policy (WO-8.12) ──');
  const policyUrl = ORIGIN + '/privacy';
  const policy = await get(policyUrl);
  say('/privacy', policy);

  check('the privacy policy answers 200 at /privacy — the URL that goes in the Google verification '
    + 'form, fetched the way a reviewer fetches it', policy.status === 200,
    isRedirect(policy)
      ? `${policy.status} → ${policy.location}; ${await chainOf(policyUrl)} — paste the URL that answers `
        + `200 into the form, or serve the policy at this one`
      : String(policy.status) + ' — and on THIS host that is nearly free: an unknown path answers 200 '
        + 'with the shell document, so the check below is the one that can tell a deployed policy '
        + 'from a missing one');

  /* Read at the end of the chain rather than at the redirect, so a host that normalizes the path
     still gets its WORDS read: the status check above has already gone red, and a cascade of four
     more failures about an empty body would bury the one finding a reader needs. One hop, because
     that is the only shape this host produces. */
  let policyDoc = policy;
  if (isRedirect(policy) && policy.location) {
    policyDoc = await get(new URL(policy.location, policyUrl).href);
    say(policy.location, policyDoc);
    observed('the readings below are taken from ' + policyDoc.url + ', the end of that redirect, '
      + 'so that a redirected policy still has its words checked');
  }

  /* THE CHECK THAT IS NOT VACUOUS, and it is written down because the first run of this block
     proved the point: against a deployment with no policy on it, `/privacy` answered **200
     text/html, 204,614 bytes** — the app shell, which this host serves for any path it does not
     recognize (measured 2026-08-12 on `/nope-does-not-exist`, and again here). Status and content
     type therefore cannot see a policy that was never deployed. What can is the document itself:
     the policy says so in its <title>, and it does not carry the app's home screen. */
  const isPolicyDoc = /<title>[^<]*Privacy Policy[^<]*<\/title>/i.test(policyDoc.text)
    && !/id="homeView"/.test(policyDoc.text);
  check('the document at that URL is the POLICY and not the app shell — this host answers an '
    + 'unknown path with the gradebook at 200, so nothing above can tell a deployed policy from a '
    + 'missing one', isPolicyDoc,
    isPolicyDoc
      ? `${policyDoc.bytes} B, titled as the privacy policy, with no app markup in it`
      : `${policyDoc.bytes} B and ${/id="homeView"/.test(policyDoc.text) ? 'it IS the app shell — the '
        + 'policy is not deployed at this path' : 'not titled as the privacy policy'}`);

  /* The three things WO-3.18 names, asserted as sentences the policy actually contains. A reworded
     policy turns these red rather than turning them off — which is the intent: the wording is the
     deliverable, and a check that accepted any paraphrase would accept a policy that had quietly
     stopped making the claim. */
  const CLAIMS = [
    ['no vendor server ever receives student data', /no server of ours ever receives student information/i],
    ['no account is required', /no account is required/i],
    ['Drive holds only files this app created', /Drive holds only the file Planbook itself created/i],
  ];
  /* MATCHED AGAINST A WHITESPACE-NORMALISED COPY, and that is a repair rather than a loosening.
     `policyDoc.text` is the raw response body, so a claim sentence that happens to WRAP across two
     source lines carries a newline and its indent in the middle of it and matches nothing. That is
     exactly what this check did the first time it ever saw a real policy — the 2026-08-21 deploy,
     the first with `privacy.html` actually at that URL: it reported "Drive holds only the file
     Planbook itself created" MISSING while the sentence sat in the document in those words, broken
     only between `Planbook` and `itself` by an editor's line wrap. Until that deploy this host
     answered `/privacy` with the app shell, so the claims had never been run against a page that
     could contain them and the defect could not surface.
     Collapsing runs of whitespace to one space leaves the intent above intact: a REWORDED policy
     still turns these red, which is the point. What it stops is a REFLOWED one doing the same.
     KNOWN LIMIT, recorded rather than fixed: an inline tag introduced INSIDE one of these
     sentences — bolding a word mid-claim — would still break the match. Today none of the three
     has one, and the fix if that changes is to strip tags here, not to un-bold the policy. */
  const policyText = policyDoc.text.replace(/\s+/g, ' ');
  const missing = CLAIMS.filter(([, re]) => !re.test(policyText)).map(([label]) => label);
  /* The byte floor guards a vacuous pass in the other direction: this host answers an unknown path
     with the shell document at 200, and an empty or truncated body would fail every regex above
     for a reason that has nothing to do with the words. */
  check('the privacy policy says the three things WO-3.18 names, in plain words',
    policyDoc.bytes > 2000 && !missing.length,
    missing.length
      ? `${policyDoc.bytes} B read, and NOT saying: ${missing.join(' · ')}`
      : `${policyDoc.bytes} B read, all three claims present`);

  /* WO-8.12 trap 4, as a check. The contact on a public page is the owner's decision, and this
     file shipped with one marked placeholder standing in for it; a deployment still carrying the
     token is a public policy with no way to reach anybody, which is the one thing that work order
     says not to do quietly. THE OWNER DECIDED IT ON 2026-08-21 and privacy.html now names a real
     mailbox, so this reads green — which turns it from a countdown into the guard that catches a
     future edit reintroducing the placeholder, or a deploy of a stale copy that still has it. */
  check('the privacy policy names a contact rather than the placeholder it ships with',
    isPolicyDoc && !/PLANBOOK-CONTACT-TBD/.test(policyDoc.text),
    !isPolicyDoc
      ? 'not run — the document at that URL is not the policy, and a page with no token in it is not '
        + 'a page with a contact on it. Announced rather than passed quietly'
      : /PLANBOOK-CONTACT-TBD/.test(policyDoc.text)
        ? 'the deployed policy still carries PLANBOOK-CONTACT-TBD — replace it in privacy.html with '
          + 'the address or form the owner decides on (WO-8.12 Acceptance line 7, still open)'
        : 'no placeholder token in the deployed policy');

  /* AND THE CONTACT IS ACTUALLY READABLE, which the check above cannot see. That one asserts the
     placeholder is GONE, and a page with no token in it is not the same thing as a page with an
     address on it — every way of losing the address entirely passes it.
     THE WAY IT WAS LOST WAS NOT AN EDIT TO THIS REPOSITORY. Cloudflare Scrape Shield's Email
     Address Obfuscation is on for this zone, and on the first deploy that carried a real address
     (2026-08-21) it rewrote the mailto to `/cdn-cgi/l/email-protection#<hex>`, replaced the visible
     text with `<span class="__cf_email__">[email protected]</span>`, and injected
     `email-decode.min.js` — into a page whose own header says it contains no JavaScript. Read
     without a browser, which is how an automated reviewer reads it, the policy named nobody. The
     repair is a `<!--email_off-->` wrapper in privacy.html; this check is what stops a zone setting
     changed in a dashboard from silently undoing it, since nothing in the repository would move.
     Deliberately NOT pinned to a particular address: the contact is the owner's to change, and a
     check that hardcoded it would go red on a decision rather than on a defect. */
  const cfRewrote = /__cf_email__|cdn-cgi\/l\/email-protection/.test(policyDoc.text);
  const mailto = policyDoc.text.match(/href="mailto:([^"?]+)/i);
  check('the deployed policy carries a contact a reader can actually reach, un-rewritten by the host',
    isPolicyDoc && !cfRewrote && !!mailto && /.+@.+\..+/.test(mailto[1]),
    !isPolicyDoc
      ? 'not run — the document at that URL is not the policy'
      : cfRewrote
        ? 'THE HOST REWROTE IT: Cloudflare email obfuscation is on for this zone and the address is '
          + 'now a cdn-cgi link that needs injected JavaScript to resolve. Wrap it in <!--email_off--> '
          + 'in privacy.html, or turn the setting off under Scrape Shield'
        : !mailto
          ? 'no mailto: link in the deployed policy at all'
          : 'reachable at ' + mailto[1]);

  /* OBSERVED, not asserted, for the reason `/index.html` is observed below: which of the two paths
     redirects is the host's routing and a different origin may answer both perfectly well. What it
     is here for is that a run says out loud which URL a human should hand to Google. */
  const policyHtml = await get(ORIGIN + '/privacy.html');
  say('/privacy.html', policyHtml);
  observed(isRedirect(policyHtml)
    ? `/privacy.html answers ${policyHtml.status} → ${policyHtml.location}, which is this host `
      + `normalizing the extension away. No verdict: /privacy is the URL asserted above and the one to paste.`
    : `/privacy.html answers ${policyHtml.status}. No verdict, and on this host a 200 at a path that `
      + `was never deployed is the shell document — read this beside the check above rather than as `
      + `a second opinion about it.`);

  /* ── the service worker ── */
  console.log('\n── the service worker ──');
  const swUrl = ORIGIN + '/sw.js';
  const sw = await get(swUrl);
  say('/sw.js', sw);

  check('/sw.js answers 200', sw.status === 200,
    isRedirect(sw) ? `${sw.status} → ${sw.location}; ${await chainOf(swUrl)}` : String(sw.status));
  check('/sw.js is JavaScript', /(java|ecma)script/i.test(sw.contentType),
    sw.contentType || '(no content-type)');
  /* The one this work order exists for. `_headers` was correct and overridden, and the file in
     the repository cannot tell you that. */
  check('/sw.js carries Cache-Control: no-cache', directives(sw.cacheControl).has('no-cache'),
    cacheDetail(sw));

  /* ── the precache list, read off the deployment ──
     TRAP 1. `sw.js` in the working tree is NOT consulted here. The question is whether the list a
     teacher's browser is about to precache resolves on the host it is being served from, and both
     halves of that live at the origin. Reading the local file would compare the repository with
     itself and pass forever, including on a deploy that never landed. */
  console.log('\n── the precache list, as the deployment declares it ──');
  const shellBlock = sw.text.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
  /* Single-quoted strings out of the array text — the same reader `verify-shell.mjs` uses, and it
     inherits the same hazard: ONE APOSTROPHE inside that array, comments included, pairs with the
     next one and swallows every entry between them (sw.js's own header note, found at WO-1.10).
     What that looks like from here is a precache list that has mysteriously shrunk, which is why
     the floor below is a check rather than an assumption. */
  const shell = shellBlock ? [...shellBlock[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
  const FLOOR = 10;
  const readable = shell.length >= FLOOR;
  check('the deployed sw.js declares a SHELL list this check can read', readable,
    readable
      ? `${shell.length} entries, ${shell[0]} … ${shell[shell.length - 1]}`
      : `${shell.length} entr${shell.length === 1 ? 'y' : 'ies'} parsed out of ${swUrl}, below the floor of `
        + `${FLOOR} — either the array moved, or an apostrophe inside it swallowed the entries between `
        + `two quotes. Everything below this reads that list, so it is reported unread rather than empty`);

  if (!readable) {
    /* Announced, never silent, and never green: an empty list walks perfectly. */
    check('every path in the deployed SHELL resolves without a redirect', false,
      'not run — the SHELL list could not be read out of the deployed sw.js');
    check('every path in the deployed SHELL answers 200', false,
      'not run — the SHELL list could not be read out of the deployed sw.js');
    check('every path in the deployed SHELL answers with the content type its name implies', false,
      'not run — the SHELL list could not be read out of the deployed sw.js');
  } else {
    const reads = [];
    for (const entry of shell) {
      /* Resolved against the worker's own URL, because that is what the worker does. */
      const url = new URL(entry, swUrl).href;
      const r = await get(url);
      reads.push({ entry, r });
      say(entry, r);
    }

    const redirected = reads.filter(x => isRedirect(x.r));
    let redirectDetail = `${reads.length} path(s), every one answered without a 3xx`;
    if (redirected.length) {
      const lines = [];
      for (const x of redirected) lines.push(`${x.entry} ${await chainOf(x.r.url)}`);
      redirectDetail = `${redirected.length} of ${reads.length} redirect: ${lines.join(' · ')} — `
        + `cache.addAll() follows those and stores a response with \`redirected\` set, and Safari `
        + `refuses to hand one to a navigation (WO-1.14). Take the path off SHELL, or ask the host `
        + `to stop redirecting it`;
    }
    check('every path in the deployed SHELL resolves without a redirect', !redirected.length, redirectDetail);

    const notOk = reads.filter(x => x.r.status !== 200);
    check('every path in the deployed SHELL answers 200', !notOk.length,
      notOk.length
        ? notOk.map(x => `${x.entry} → ${x.r.status}`).join(', ')
        : `${reads.length} path(s), all 200`);

    const typed = reads.map(x => ({ ...x, want: expectedType(new URL(x.r.url).pathname) })).filter(x => x.want);
    const wrongType = typed.filter(x => x.r.status === 200 && !x.want.want.test(x.r.contentType));
    /* Two ways to be red, and they are not the same sentence. A wrong type is a finding about the
       deployment; too few typed paths is a finding about this check, which has gone blind and must
       say so rather than borrow the pass wording below (WO-8.8 follow-up). */
    const enoughTyped = typed.length >= FLOOR;
    check('every path in the deployed SHELL answers with the content type its name implies',
      enoughTyped && !wrongType.length,
      wrongType.length
        ? wrongType.map(x => `${x.entry} is ${x.want.label} and came back "${x.r.contentType}"`).join(', ')
          + ' — on this host a path that was never deployed answers 200 with the shell document, so the '
          + 'status alone cannot see a missing file'
        : !enoughTyped
          ? `only ${typed.length} of ${reads.length} path(s) carry a type this check knows, below the `
            + `floor of ${FLOOR} — the names in SHELL stopped implying types this check recognizes, so it `
            + `is reported unproven rather than passed. Nothing here says a type is wrong; expectedType() `
            + `is what to suspect first`
          : `${typed.length} of ${reads.length} path(s) carry a type this check knows, and each matched`);

    /* OBSERVED, not asserted. `/index.html` is the one path on Pages that is KNOWN to redirect, and
       reading it on every run is what keeps the redirect check above from being trusted on a green
       run alone: if this line stops saying 308 on this host, the detector is what to suspect first.
       It is not a check because a different origin may answer it perfectly well. */
    const indexHtml = await get(ORIGIN + '/index.html');
    say('/index.html', indexHtml);
    observed(isRedirect(indexHtml)
      ? `/index.html answers ${indexHtml.status} → ${indexHtml.location}. No verdict: that is the host's `
        + `routing, and it is WHY './index.html' must stay off SHELL (WO-1.14). This run's redirect `
        + `check saw a live 3xx here, so it is not passing above for want of anything to find.`
      : `/index.html answers ${indexHtml.status}. No verdict — but note that the redirect check above `
        + `then saw no 3xx anywhere in this run, and a detector with nothing to detect is worth less.`);
  }

  /* ── the deployed worker is the one in the tree ── */
  console.log('\n── the deployed sw.js against the working tree ──');
  const deployedCache = (sw.text.match(/const CACHE\s*=\s*'([^']+)'/) || [])[1] || null;
  let localCache = null;
  let localError = '';
  try {
    localCache = (fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/const CACHE\s*=\s*'([^']+)'/) || [])[1] || null;
  } catch (err) {
    localError = String(err && err.message);
  }
  /* The local file is read for THIS and nothing else. "I forgot to push" and "the deploy failed"
     both present as "the fix did not work", and this is the line that tells them apart. */
  check('the deployed sw.js CACHE matches the working tree',
    Boolean(deployedCache) && Boolean(localCache) && deployedCache === localCache,
    !deployedCache
      ? 'no CACHE string found in the deployed sw.js'
      : !localCache
        ? 'no CACHE string found in ' + path.join(ROOT, 'sw.js') + (localError ? ' — ' + localError : '')
        : deployedCache === localCache
          ? `both ${deployedCache}`
          : `deployed ${deployedCache}, working tree ${localCache} — the origin is not serving this tree. `
            + `Either the push has not landed, the build failed, or you are reading the wrong origin`);

  /* ── nothing server-side ──
     WO-8.7's fourth acceptance line, asked of the deployment rather than of the repository. What
     this can and cannot see, stated plainly: a `_worker.js` that is actually RUNNING intercepts
     every path including its own, so no request can prove its absence from out here. What is
     asserted is that none of the four paths that would carry server code is being SERVED as
     script or config. The repository half — no functions/, no _worker.js, no wrangler.toml — is
     WO-8.7's, checked in the tree and in the dashboard. */
  console.log('\n── nothing server-side ──');
  const SCRIPTISH = /(java|ecma)script|json/i;
  const serverPaths = ['/_worker.js', '/_routes.json', '/functions/', '/functions/index.js'];
  const answered = [];
  for (const p of serverPaths) {
    const r = await get(ORIGIN + p);
    say(p, r);
    if (r.status === 200 && SCRIPTISH.test(r.contentType)) answered.push(`${p} → 200 ${r.contentType}`);
  }
  check('no _worker.js, _routes.json or /functions/ path answers as a script', !answered.length,
    answered.length
      ? answered.join(', ') + ' — server-side code in this deployment is a decision nobody has made '
        + '(CLAUDE.md: no backend of our own)'
      : serverPaths.length + ' path(s) probed, none of them answered with script or config content. '
        + 'A 200 here is this host serving the shell for an unknown path, not a file');

} catch (err) {
  if (!(err instanceof Unreachable)) throw err;
  unreachable = err;
}

/* ────────────────────────────── how it ended ────────────────────────────── */

if (unreachable) {
  /* The departure, spelled out on the terminal. NOT a failed assertion: no check is added, the
     summary is not printed, and the exit code is its own. */
  const cause = unreachable.cause || {};
  const reason = transportReason(cause);
  const failedSoFar = results.filter(r => r.state === 'fail').length;
  console.log('\n=========== COULD NOT REACH THE ORIGIN ===========');
  console.log('  ' + unreachable.url);
  console.log('  ' + (cause.message || String(unreachable.cause)) + (reason ? '  [' + reason + ']' : ''));
  if (/TimeoutError/.test(reason)) console.log('  Nothing came back within ' + (TIMEOUT_MS / 1000) + 's.');
  console.log('');
  console.log('  This is NOT a failed check and says nothing about the deployment. The network');
  console.log('  did not answer, so nothing was asserted' + (results.length ? ` after ${results.length} check(s)` : '') + '.');
  console.log('  There is deliberately no retry: run it again yourself when you have a network,');
  console.log('  because a loop that hides a flaky answer is a confident pass over nothing.');
  console.log('');
  console.log('  ' + failedSoFar + ' check(s) had failed before the connection did'
    + (failedSoFar ? ' — they are printed above and are real.' : '.'));
  process.exitCode = 2;
} else {
  const fails = results.filter(r => r.state === 'fail');
  console.log('\n================ SUMMARY ================');
  console.log(`${ORIGIN} · ${results.length} checks · ${results.length - fails.length} passed · ${fails.length} failed`);
  if (fails.length) {
    console.log('\nFAILED:');
    fails.forEach(f => console.log('  - ' + f.name + (f.detail ? '\n      ' + f.detail : '')));
  }
  console.log('\nThis reads headers and statuses off the wire. It says nothing about whether the app');
  console.log('WORKS — that is TESTING.md\'s and a real device\'s job, and no 👤 line is closed here.');
  process.exitCode = fails.length ? 1 : 0;
}
