/*
  The front door (WO-8.16) — what a stranger who types the domain meets instead of an empty
  gradebook, and the way past it.

  A FRONT DOOR, NOT A GATE. That is the ruling the work order starts from, and every decision below
  leans the same way. Installing cannot be made a precondition: Firefox on a laptop cannot install a
  web app at all, a school-managed Chromebook may have installing switched off, and a PWA is
  installed FROM THE PAGE IT IS, so the door can only explain and then send the visitor in. So the
  way in — `data-front-door-enter`, worded for the device — is on every variant of the door, and
  every answer below that is not a proof of "stranger" opens the app instead. Doubt draws no door.

  ── WHO SEES IT ──

  A visitor who is NOT running installed (src/install-banner.js's isInstalled(), the one asker) AND
  has NO SCHOOL YEAR STORED in this browser. Not "an untouched year" — the owner's ruling 1. boot()
  saves a rev-1 year on the first launch of a fresh origin, so the first pass through the door is
  also the last: that saved year is the memory, and there is no `planbook_` key for "she chose the
  browser" (ruling 2), because it would be a second record of the same fact.

  THE PROBE, IN ITS RULED ORDER (ruling 3), and both halves read; neither writes:
    1. the `openYear` preference, through getPref(), since src/prefs.js is the only
       module that reads the browser's preference store. store.openYear() and store.createYear() both set it, so a browser that has
       ever held a year holds it. PRESENT → straight in, and mightBeAStranger() is synchronous so
       that nobody who has used the app before waits on anything at all;
    2. absent → store.yearDatabaseListed(), which asks indexedDB.databases() for NAMES and never
       opens anything. A probe that opened the database to find out would create it — trap 2 —
       and the store "knows nothing before it opens one", so asking the store anything else would be
       the defect. Only a clean `false` draws the door; `null` (no databases(), or it threw) opens
       the app.
  An iOS eviction clears both halves together — script-writable storage goes as a unit — which is
  what lets the preference stand in for the database on every launch but the first.

  THE DECISION IS MADE IN THE APP AND NEVER IN THE WORKER (trap 1). sw.js answers `/` from Cache
  Storage exactly as before; this module runs inside that document, before store.boot(), under the
  loading screen that already covers the app from the first paint — which is what "no flash" is
  (trap 6): nothing is drawn until the decision is taken, and the async half only ever runs on a
  device with no preference, the only device that can be a stranger.

  ── THE WORDS ──

  NOT RETYPED (Deliverable 3). The door's prose is about.html's, fetched from it at the moment the
  door is drawn and lifted by its `data-front-door` markers. The other route on the table — the
  sections lifted into the shell and about.html "reduced to them" — would need about.html to load
  the shell's copy, and about.html carries no script by construction (its header, point 3, and
  tools/verify/about-page.mjs asserts it); without a script it can only be a second copy, which is
  what the Deliverable forbids. A fetch costs one request on the one launch that shows the door,
  and that launch is online by definition — somebody just typed the address. If the fetch fails,
  is slow, or the page no longer carries a piece this device's door needs, the door is NOT drawn
  and the app opens: doubt draws no door, here as at the probe.

  What index.html carries is the door's own chrome — the device heading, its one-line subtitle, the
  button and the line under it — the words the drawing put there that about.html has no place for.
  It is the install banner's convention: copy a teacher reads lives in the markup.

  ── WHICH DOOR ──

  Three, as drawn in design/mockups/front-door.html: iOS (install steps first, the caution beside
  them, the way past below and NOT primary — the thing to do next happens in Safari's toolbar);
  a browser that cannot install (Firefox on a desktop, told apart by its user agent — ruling 5);
  and the laptop door for everything else, where the way in IS the primary. A Chromebook whose admin
  has switched installing off cannot be told from an ordinary Chrome and gets the laptop door — and
  the absence of `beforeinstallprompt` is NOT used to guess at it: that event's timing is the
  browser's engagement heuristic and its silence proves nothing (ruling 5).

  ── THE HARNESS ──

  tools/verify-shell.mjs is a cold visitor on every run — a fresh profile, not installed, no year —
  so every section would land here. It passes with `?door=skip`, READ ONLY ON A LOOPBACK HOST, the
  way src/auth.js's hostAllowsSignIn() gates on the hostname: the deployed app cannot be told to
  skip it. Seeding `planbook_openYear` instead was refused (trap 5): it passes today and silently
  stops passing the day the probe order changes.
*/

import { getPref } from './prefs.js';
import { isInstalled } from './install-banner.js';
import * as store from './store.js';

const DOOR_ID = 'frontDoor';
/* On <body> while the door is up: src/front-door.css hides the app's header, main and banner
   strips under it, because the door REPLACES them rather than sitting inside them. */
const OPEN_CLASS = 'front-door-open';
/* Relative, and the file name rather than `/about`, for index.html's reason about the privacy
   link: the local server answers the file, and on the deployed host Pages redirects it to the
   extensionless URL, which fetch() follows. */
const WORDS_URL = './about.html';
/* Long enough for a school network on a first visit, short enough that a visitor on a dead one
   reaches the app rather than a spinner. On a timeout the app opens — doubt draws no door. */
const WORDS_TIMEOUT_MS = 5000;

/* What each door lifts out of about.html, by `data-front-door` marker. Every marker a door names
   must be found or that door is not drawn. `lede`, `what` and `where` are on every door. */
const COMMON = ['lede', 'what', 'where'];
const LIFTS = {
  ios: ['steps-ios', 'caution'],
  laptop: ['install', 'steps-laptop', 'backup'],
  cannot: ['cannot-install', 'backup'],
};

/* Resolves the boot that is waiting behind the door, once the visitor chooses. */
let enterNow = null;

/* ────────────────────────────── the pure halves, for the harness ────────────────────────────── */

/*
  May this host be told to skip the door? Loopback only, and EXACT STRINGS — src/auth.js's
  hostAllowsSignIn() reasoning: a page cannot change its own hostname, so the deployed origin can
  never answer yes, and the iPad's LAN address cannot either, which keeps the owner's own 👤
  readings honest. Pure, so the harness can ask it about hosts no page can be served from.
*/
export function skipAllowedOn(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/* `?door=skip` on an allowed host. Anything else in the query — or the flag on any other host — is
   ignored rather than refused, because the door is the safe answer to a visitor who typed it. */
export function skipAsked(search, hostname) {
  if (!skipAllowedOn(hostname)) return false;
  try { return new URLSearchParams(search || '').get('door') === 'skip'; } catch (e) { return false; }
}

/*
  Which door, from the user agent and the touch-point count and nothing else. iPadOS Safari reports
  itself as a Mac, so a "Macintosh" with more than one touch point is an iPad — the standard test,
  and the only one there is. Firefox on a desktop is the browser ruling 5 tells apart; Firefox on
  Android or iOS can add to the home screen and is not it. Everything else is the laptop door.
*/
export function deviceOf(ua, maxTouchPoints) {
  const s = String(ua || '');
  if (/iPad|iPhone|iPod/.test(s) || (/Macintosh/.test(s) && Number(maxTouchPoints) > 1)) return 'ios';
  if (/\bFirefox\//.test(s) && !/Android|Mobile|Tablet/.test(s)) return 'cannot';
  return 'laptop';
}

/* Safari proper, on iOS: every other iOS browser names itself in its token. Only the button's
   wording turns on it — "Use it in Safari for now" where the steps say Safari. */
function iosSafari(ua) {
  return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(String(ua || ''));
}

/* ────────────────────────────── the decision ────────────────────────────── */

/*
  The synchronous half — the whole decision for everyone who is not a stranger, with no await in
  front of it. False means "boot as today" and nothing else in this module runs.
*/
export function mightBeAStranger() {
  if (skipAsked(location.search, location.hostname)) return false;
  if (isInstalled()) return false;
  if (getPref('openYear')) return false;
  return true;
}

/*
  The asynchronous half, and the door itself. Resolves when the app should boot: at once if this
  is not a stranger after all (or if anything is in doubt), and otherwise when the visitor taps the
  way in. src/shell.js awaits it before store.boot() and nowhere else.
*/
export async function standAtDoor() {
  const listed = await store.yearDatabaseListed();
  if (listed !== false) return;
  const words = await fetchWords();
  if (!words) return;
  if (!draw(words)) return;
  await new Promise((resolve) => { enterNow = resolve; });
}

/* "Use it in this browser". Puts the loading screen back over the app before the door comes down,
   so boot draws the home screen the same way it does on every other launch, and lets the waiting
   boot go. Called from src/shell.js's click listener. */
export function enter() {
  if (!enterNow) return;
  const loading = document.getElementById('loadingScreen');
  if (loading) loading.classList.remove('hidden');
  const door = document.getElementById(DOOR_ID);
  if (door) door.classList.add('hidden');
  document.body.classList.remove(OPEN_CLASS);
  window.scrollTo(0, 0);
  const go = enterNow;
  enterNow = null;
  go();
}

/* Whether the door is on the glass now — read by the harness, and by nothing in the app. */
export function doorOpen() {
  return !!enterNow;
}

/* ────────────────────────────── the words ────────────────────────────── */

async function fetchWords() {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctl) ctl.abort(); }, WORDS_TIMEOUT_MS);
  try {
    const res = await fetch(WORDS_URL, ctl ? { signal: ctl.signal } : undefined);
    if (!res || !res.ok) return null;
    const text = await res.text();
    /* DOMParser builds an inert document: nothing in it runs, loads or is styled. */
    return new DOMParser().parseFromString(text, 'text/html');
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function lifted(words, name) {
  const node = words.querySelector('[data-front-door="' + name + '"]');
  return node ? document.importNode(node, true) : null;
}

/* about.html's section as a panel in the app's own grammar: its heading into `.panel-title`, the
   rest of it into the door's body, word for word. */
function asPanel(section) {
  const h2 = section.querySelector('h2');
  if (!h2) return null;
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.setAttribute('data-front-door', section.getAttribute('data-front-door'));
  const header = document.createElement('div');
  header.className = 'panel-header';
  const row = document.createElement('div');
  row.className = 'panel-title-row';
  const title = document.createElement('div');
  title.className = 'panel-title';
  const heading = document.createElement('h2');
  heading.textContent = h2.textContent.trim();
  title.appendChild(heading);
  row.appendChild(title);
  header.appendChild(row);
  panel.appendChild(header);
  h2.remove();
  const body = document.createElement('div');
  body.className = 'front-door-body';
  while (section.firstChild) body.appendChild(section.firstChild);
  panel.appendChild(body);
  return panel;
}

/*
  Fills the door for this device and puts it on the glass in one task — door up, app chrome hidden,
  loading screen down — so there is no frame with neither. Returns false, having changed nothing,
  if anything it needs is missing.
*/
function draw(words) {
  const door = document.getElementById(DOOR_ID);
  if (!door) return false;
  const ua = navigator.userAgent;
  const device = deviceOf(ua, navigator.maxTouchPoints);

  const pieces = {};
  for (const name of COMMON.concat(LIFTS[device])) {
    pieces[name] = lifted(words, name);
    if (!pieces[name]) {
      console.warn('front door: about.html has no [data-front-door="' + name + '"], so the door '
        + 'is not drawn and the app opens.');
      return false;
    }
  }
  const what = asPanel(pieces.what);
  const where = asPanel(pieces.where);
  const variant = door.querySelector('[data-front-door-for="' + device + '"]');
  const lede = door.querySelector('[data-front-door-slot="lede"]');
  const tail = door.querySelector('[data-front-door-slot="panels"]');
  if (!what || !where || !variant || !lede || !tail) return false;
  const slots = [...variant.querySelectorAll('[data-front-door-slot]')];
  if (!slots.length || slots.some((s) => !pieces[s.getAttribute('data-front-door-slot')])) return false;

  /* Every slot in this door's panel is replaced by the piece it names. The caution keeps
     about.html's words and wears the door's caution class, which is about.html's palette. */
  if (pieces.caution) pieces.caution.className = 'front-door-caution';
  for (const slot of slots) slot.replaceWith(pieces[slot.getAttribute('data-front-door-slot')]);
  lede.replaceWith(pieces.lede);
  tail.replaceWith(what, where);

  if (device === 'ios') {
    const noun = variant.querySelector('[data-front-door-noun]');
    if (noun && /iPhone|iPod/.test(ua)) noun.textContent = 'iPhone';
    const browser = variant.querySelector('[data-front-door-browser]');
    if (browser && iosSafari(ua)) browser.textContent = 'Safari';
  }

  for (const other of door.querySelectorAll('[data-front-door-for]')) {
    if (other !== variant) other.remove();
  }
  variant.classList.remove('hidden');

  document.body.classList.add(OPEN_CLASS);
  door.classList.remove('hidden');
  const loading = document.getElementById('loadingScreen');
  if (loading) loading.classList.add('hidden');
  return true;
}
