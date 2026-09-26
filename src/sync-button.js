/*
  The header's sync button — how fresh this device's Drive sync is, on the glass (WO-7.5).

  ── WHY IT EXISTS ──

  Until this landed nothing outside the About modal said anything about sync. The token lapses at
  ~59 minutes with no sign; the panel's Sync button hides and Connect returns, and a teacher learns
  it only by opening About. That is coherent while sync is a tap she chose to make — the lapse is
  silent while the consequence is loud — and it stops being coherent the moment she relies on it
  across two devices, which is the whole point of having it (docs/sync.md § "And if it becomes
  automatic, it needs a status on the glass").

  FRESHNESS, NOT CONNECTION. A plain "connected" light would not fix it: connected with three saves
  not in Drive is true and useless, and a permanent green dot reads as "your gradebook is safe in the
  cloud", which is the belief that stops a teacher downloading backups. So there is NO GREEN in this
  file or in the stylesheet behind it, and the quietest state — up to date — wears exactly the wash
  every other header button wears. Calm is what "nothing to do" looks like here.

  ── THE SIX STATES, AND EVERY TAP DOES WHAT ITS STATE NEEDS ──

      state      reading                                                          tap
      current    Synced with Google Drive at 9:41.                                sync now
      ahead      Changes on this device are not in Google Drive yet.              sync now
      stale      Last synced yesterday at 3:12.                                   sync now
      lapsed     Your Google sign-in has ended. Tap to reconnect.                 Google's sign-in, visibly
      failed     The last sync did not finish. Nothing on this device changed.    About, at the Drive section
      syncing    Syncing with Google Drive…                                       nothing until it settles

  THE READING IS THE LABEL. Ruling 1 chose a bare icon with a corner badge — the header's existing
  grammar, every control up there is an icon — so the sentence lives in `aria-label` and `title`,
  and the badge carries the part of the state a thumb can see at arm's length.

  WHAT THIS FILE DOES NOT DECIDE, which is the rule it is built on: whether this device is ahead,
  stale or current is src/drive-sync.js's freshnessOf(), because that file owns the bookmark and the
  comparison. Whether a sign-in is alive is src/auth.js's authState(). Whether the last sync failed is
  syncState().bad. This module COMBINES three answers it was handed — the precedence below — and
  holds no second opinion about any of them.

  ── THE FOUR RULINGS IT CARRIES (the owner, 2026-09-26) ──

  1. A bare icon with a corner badge (variant A). The drawing's variant B, the reading written
     beside the icon, was declined and is not lifted.
  2. BELOW THE PHONE BREAKPOINT THERE IS NO FIFTH BUTTON. The top row has 5.92px of slack at 390px
     (measured; the ruling said ~8) after WO-2.29's fourth control, and a fifth 44px one does not fit. So at that width the button
     is not laid out and the About button beside it wears the badge instead, and a tap on a badged
     About opens it at the Drive section, where Sync and Connect already are. The breakpoint lives
     in src/shell.css and ONLY there: this file never names a width, it asks the page whether the
     button was laid out (folded() below), so the two cannot disagree about where phone width is.
  3. At the end of the row, immediately before About — which is what makes ruling 2 clean: the
     button folds into its neighbour rather than moving somewhere else.
  4. Not synced TODAY turns amber on its own — a calendar day, not a number of hours. freshnessOf().
  5. Opting in is also the consent to try reconnecting at launch. One consent, not two.

  ── TWO THINGS THAT LOOK LIKE OVERSIGHTS ──

  THE TIME, NEVER A COUNTDOWN. "Synced at 9:41" stays true without a timer; "2 min ago" needs a clock
  ticking in the header. It is the ruling the Drive panel's "ends at 2:47" already took, and there is
  no setInterval and no setTimeout anywhere in this file.

  THE LAPSE IS NOT WATCHED. A token that runs out while the app sits open is not noticed until
  something repaints or the teacher taps — and a tap on a stale-token "current" reading goes through
  syncNow(), whose own silent renewal either carries it or turns this button to `lapsed`. Watching the
  clock for it would be the timer above by another name.

  ── WHAT IT IS NOT ──

  Not a toggle: Disconnect stays in About, where it is deliberate. Not in the save chip: src/store.js
  owns every state about this device's own storage, and freshness is a third kind of thing. Not
  automatic sync: nothing here syncs without a tap — "syncing without a tap" is the step after this
  one, and this button is what makes it safe to take, not the step itself. And presentation mode
  changes nothing about it, because sync state is not student data.
*/

import { getPref, setPref } from './prefs.js';
import * as auth from './auth.js';
import * as driveSync from './drive-sync.js';
import * as store from './store.js';
import { shortDate } from './date-text.js';

const PREF = 'driveSyncOptIn';
const BUTTON_ID = 'syncBtn';
const ABOUT_ID = 'aboutBtn';
const ABOUT_BADGE_ID = 'aboutSyncBadge';
const PANEL_ID = 'drivePanel';

/* Every state word this file can put on an element. `current` is deliberately absent from the class
   list below: it is drawn as no state at all, the same wash as the neighbours. */
const STATE_CLASSES = ['ahead', 'stale', 'lapsed', 'failed', 'syncing'];

/*
  THE ICONS, one per shape of state. Stroke paths only, drawn with `currentColor` in the markup's own
  <svg>, so every colour is the stylesheet's (inline, per src/shell.css's rule) and none is here.
  Lifted from design/mockups/sync-button.html. STALE WEARS AHEAD'S ICON, which is ruling 4 read
  literally — "drawn like ahead (amber, a dot) and told apart by its reading".
*/
const ICONS = {
  current: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="9 14.5 11 16.5 15 12.5"/>',
  ahead: '<path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>',
  lapsed: '<path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/>',
  failed: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="12" y1="11" x2="12" y2="14"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  syncing: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
};
ICONS.stale = ICONS.ahead;

/* ────────────────────────────── state ────────────────────────────── */

/*
  WHERE THE SILENT RENEWAL HAS GOT TO ON THIS PAGE, which is the one fact this module holds of its
  own — and it holds it because the rule it serves is about ORDER: "the silent renewal is tried
  before `lapsed` is drawn". No sign-in is not the same as a lapsed one until a renewal has been
  tried and has failed.

    ''        not tried on this page yet (a reload is a sign-out, so every launch starts here)
    'trying'  out at Google now
    'failed'  tried and refused — this is what `lapsed` is drawn on
    'ok'      a token came back, from the renewal or from a reconnect tap
*/
let renewal = '';
/* Whether the three listeners have been attached. Once per page; start() is safe to call again. */
let started = false;

/* ────────────────────────────── the opt-in ────────────────────────────── */

/*
  Has this device opted into sync — and is the sign-in reachable on this origin at all. The second
  half is the flag src/auth.js owns (hostAllowsSignIn): on the iPad's LAN address, or a preview
  deploy, the About panel draws no Drive section, and a header button there would offer a sign-in
  the page cannot make. So the button needs both, and a device carrying the preference to an origin
  that is shut simply draws today's header.
*/
export function optedIn() {
  return getPref(PREF) === true && auth.signInAvailable();
}

/* Set by a Connect that SUCCEEDED — src/shell.js passes connect()'s own answer, so a refusal, a
   closed window or a seeded session that a failed tap left standing all set nothing. Read back
   rather than trusted, for src/presentation.js's reason: localStorage can refuse a write. */
export function rememberOptIn() {
  setPref(PREF, true);
  renewal = 'ok';
  start();
  refreshSyncButton();
}

/* Cleared by Disconnect, and by nothing else — a failed reconnect leaves a teacher opted in, because
   she is: the next launch should try again, and the button should keep saying so. */
export function forgetOptIn() {
  setPref(PREF, false);
  renewal = '';
  refreshSyncButton();
}

/* ────────────────────────────── the six states ────────────────────────────── */

function clock(when) {
  return when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/* "yesterday" for the day before today by the CALENDAR, and "on Sep 24" for anything earlier —
   both composed from src/drive-sync.js's localDayOf(), never from a count of hours. */
function staleReading(at, now) {
  const day = driveSync.localDayOf(at);
  const yesterday = driveSync.localDayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  return 'Last synced ' + (day === yesterday ? 'yesterday' : 'on ' + shortDate(day))
    + ' at ' + clock(at) + '.';
}

/*
  THE PRECEDENCE, which is the whole of this module's own judgement and is written as one ladder so
  it can be read in one place:

    1. syncing   a transfer is out (src/drive-sync.js) — or a sign-in is, which reads "Connecting"
                 rather than "Syncing" because nothing is being transferred, and taps the same:
                 nothing until it settles. BEFORE THE RENEWAL HAS BEEN TRIED this is also where the
                 button sits, and that is ruling 5's "lapsed is drawn only when the attempt fails".
    2. lapsed    no live sign-in, and a silent renewal has been tried and refused — or a sync found
                 the sign-in gone. Above `failed` because it names the one thing that has to happen
                 before any sync can.
    3. failed    the last sync ended badly for any reason but the sign-in.
    4. unknown   the bookmark has not been read yet; drawn as `syncing` for the frame it takes,
                 because an amber "not in Drive yet" corrected a moment later is a false sentence.
    5. ahead, stale, current — freshnessOf(), unmodified.

  A SIGN-IN THAT LAPSED WHILE THE APP SAT OPEN, with the renewal already `ok` from launch, falls
  through to 5 on purpose: the header says what the bookmark says, and the tap goes through
  syncNow(), whose own silent renewal either carries it or lands this button on `lapsed`.
*/
export function syncButtonState(now) {
  const when = now || new Date();
  if (!optedIn()) return { drawn: false, state: '', reading: '', label: '' };

  const a = auth.authState();
  const s = driveSync.syncState();
  let state;
  let reading;

  if (s.busy) {
    state = 'syncing'; reading = 'Syncing with Google Drive…';
  } else if (a.busy || renewal === 'trying' || (renewal === '' && !a.signedIn)) {
    state = 'syncing'; reading = 'Connecting to Google Drive…';
  } else if (!a.signedIn && (renewal === 'failed' || s.outcome === 'signed-out')) {
    state = 'lapsed'; reading = 'Your Google sign-in has ended. Tap to reconnect.';
  } else if (s.bad && s.outcome !== 'signed-out') {
    state = 'failed'; reading = 'The last sync did not finish. Nothing on this device changed.';
  } else {
    const fresh = driveSync.freshnessOf(s, when);
    if (fresh === 'unknown') {
      state = 'syncing'; reading = 'Checking this device’s last sync…';
    } else if (fresh === 'ahead') {
      state = 'ahead'; reading = 'Changes on this device are not in Google Drive yet.';
    } else if (fresh === 'stale') {
      state = 'stale'; reading = staleReading(new Date(s.lastSyncedAt), when);
    } else {
      state = 'current';
      reading = 'Synced with Google Drive at ' + clock(new Date(s.lastSyncedAt)) + '.';
    }
  }

  /* The label is the reading and then what a tap will do — the reading alone describes a state, and
     a teacher about to tap is owed the consequence. `lapsed` already ends in its instruction. */
  const hint = state === 'failed' ? ' Tap for details.'
    : (state === 'current' || state === 'ahead' || state === 'stale') ? ' Tap to sync now.' : '';
  return { drawn: true, state: state, reading: reading, label: reading + hint };
}

/* ────────────────────────────── painting ────────────────────────────── */

/*
  Is the button folded into About — ruling 2. Asked of the page rather than of a width: the button is
  drawn (not `.hidden`) and yet has no box, which is src/shell.css's phone-width rule taking it out of
  the layout. One number for the breakpoint, in one file.
*/
function folded(btn) {
  return !!btn && !btn.classList.contains('hidden') && btn.getClientRects().length === 0;
}

/*
  Paint the button and About's badge from syncButtonState(). Called at start, after every save (a
  store subscription, below), after every sync and every sign-in change (chained from src/shell.js),
  when the app comes back into view, and when the window is resized across the breakpoint.

  SUBSCRIBED TO THE STORE, which src/classes.js refuses for the header's class bar — and the reason
  does not reach this: a subscriber fires on every save, and redrawing the class bar would take focus
  out of whatever a teacher is typing into. This rewrites two attributes, a class list and one
  <svg>'s children on a button nobody is typing into; nothing is rebuilt and no focus moves. And a
  save is the one event `ahead` is about, so a paint that did not follow it would be a button that
  says "up to date" over a grade that is not in Drive.
*/
export function refreshSyncButton() {
  const btn = document.getElementById(BUTTON_ID);
  const about = document.getElementById(ABOUT_ID);
  const aboutBadge = document.getElementById(ABOUT_BADGE_ID);
  if (!btn) return;

  const st = syncButtonState();
  btn.classList.toggle('hidden', !st.drawn);
  STATE_CLASSES.forEach((c) => btn.classList.toggle(c, st.state === c));
  btn.setAttribute('data-sync-state', st.state);
  btn.disabled = st.state === 'syncing';
  if (st.drawn) {
    btn.setAttribute('aria-label', st.label);
    btn.title = st.label;
    const icon = btn.querySelector('[data-sync-icon]');
    if (icon) icon.innerHTML = ICONS[st.state] || ICONS.current;
    /* The corner badge on the button itself: a dot when ahead or stale, a mark when failed. Lapsed
       has none because its inverted fill is already the loudest thing a square can do; syncing has
       none because its icon turns. */
    const badge = btn.querySelector('[data-sync-badge]');
    if (badge) {
      const shown = st.state === 'ahead' || st.state === 'stale' || st.state === 'failed';
      badge.classList.toggle('hidden', !shown);
      badge.classList.toggle('bad', st.state === 'failed');
      badge.textContent = st.state === 'failed' ? '!' : '';
    }
  }

  /* About's badge: in every state but `current`, and only below the breakpoint — the stylesheet
     hides it above, so this decides WHETHER and the page decides WHERE. */
  if (aboutBadge) {
    const shown = st.drawn && st.state !== 'current';
    aboutBadge.classList.toggle('hidden', !shown);
    STATE_CLASSES.forEach((c) => aboutBadge.classList.toggle(c, shown && st.state === c));
    aboutBadge.classList.toggle('bad', shown && st.state === 'failed');
    aboutBadge.textContent = shown && (st.state === 'failed' || st.state === 'lapsed') ? '!' : '';
  }
  if (about) {
    /* The label follows the badge: a screen reader on a phone is told what the badge says, and on a
       wider screen — where the sync button carries it — About is only About. */
    const carries = st.drawn && st.state !== 'current' && folded(btn);
    const label = carries ? 'About Planbook. ' + st.reading + ' Tap to open Google Drive sync.'
      : 'About Planbook';
    about.setAttribute('aria-label', label);
    about.title = label;
  }
}

/* Does a tap on About right now mean "take me to the Drive section" — true when About is the one
   wearing the sync badge (ruling 2). Asked at tap time, of what is on the glass. */
export function aboutOpensAtDrive() {
  const btn = document.getElementById(BUTTON_ID);
  const st = syncButtonState();
  return st.drawn && st.state !== 'current' && folded(btn);
}

/* Bring the Drive section into view inside an About modal that is already open. The panel scrolls,
   not the page; nothing is focused, because the first thing in that section a focus could land on is
   Connect or Disconnect and neither should be one keystroke away from an arrival. */
export function revealDriveSection() {
  const panel = document.getElementById(PANEL_ID);
  if (panel && !panel.classList.contains('hidden')) panel.scrollIntoView({ block: 'start' });
}

/* ────────────────────────────── the tap ────────────────────────────── */

/*
  What the tap does, by state — and it is the CALLER in src/shell.js that opens About, because that
  path already paints the modal before it appears; this returns 'about' and leaves it there.

  THE RECONNECT IS SYNCHRONOUS UP TO GOOGLE'S WINDOW, and that is WO-7.5's first Trap: this is called
  from the click listener, auth.reconnect() asks inside the same stack, and nothing is awaited
  before it. The silent attempt is NOT made here — it belongs to launch and to visibility, and it
  has already failed by the time `lapsed` is on the glass.
*/
export function tapSyncButton() {
  const st = syncButtonState();
  if (!st.drawn || st.state === 'syncing') return 'none';
  if (st.state === 'failed') return 'about';

  if (st.state === 'lapsed') {
    const asking = auth.reconnect();
    refreshSyncButton();
    asking.then((ok) => {
      renewal = ok ? 'ok' : 'failed';
      refreshSyncButton();
      driveSync.refreshSyncChrome();
    }, () => { renewal = 'failed'; refreshSyncButton(); });
    return 'reconnect';
  }

  const syncing = driveSync.syncNow();
  refreshSyncButton();
  syncing.then(afterSync, afterSync);
  return 'sync';
}

/* After a sync from EITHER door — this button or About's "Sync this year now" — which is why it is
   exported: src/shell.js chains it onto the panel's own tap. A sync that found the sign-in gone is
   the renewal failing by another route, so it is recorded as one. */
export function afterSync() {
  const s = driveSync.syncState();
  if (s.outcome === 'signed-out') renewal = 'failed';
  else if (s.outcome && !s.bad) renewal = 'ok';
  refreshSyncButton();
}

/* ────────────────────────────── the silent renewal ────────────────────────────── */

/*
  ON APP OPEN AND WHEN THE TAB COMES BACK INTO VIEW — never on the tap, and never on a timer.

  Only on a device that has opted in (ruling 5: one consent). A device that never connected reaches
  the first line and returns, so it fetches nothing from Google at all — which is what keeps
  privacy.html's "nothing is fetched from Google until Connect is tapped" true, and what
  tools/verify/sync-button.mjs asserts from the wire.

  IT NEVER BLOCKS. It is not awaited by anything: the app is already rendered when this runs, offline
  included, and an attempt that cannot reach Google fails into `lapsed` like any other refusal.
  EXPECT IT TO CARRY THE LAPTOP AND NOT THE iPad — it renews off the teacher's own Google session,
  and iOS blocks what that depends on (docs/sync.md § "Wanting it to be seamless"). On the iPad the
  visible reconnect above is the normal path, not the fallback.
*/
function renewSilently() {
  if (!optedIn()) return;
  const a = auth.authState();
  if (a.signedIn) { renewal = 'ok'; refreshSyncButton(); return; }
  if (a.busy || renewal === 'trying') return;
  renewal = 'trying';
  refreshSyncButton();
  auth.ensureFreshToken().then((token) => {
    renewal = token ? 'ok' : 'failed';
    refreshSyncButton();
    driveSync.refreshSyncChrome();
  }, () => { renewal = 'failed'; refreshSyncButton(); });
}

/* Read the bookmark for the open document if it has not been read, then repaint. The read is
   src/drive-sync.js's own primeSyncChrome() — this file never reads IndexedDB. */
function prime() {
  const p = driveSync.primeSyncChrome();
  refreshSyncButton();
  return p.then(refreshSyncButton, refreshSyncButton);
}

/*
  Boot, from src/shell.js once the year document is open. Paints (which for a device that never
  opted in means: stays hidden, and the header is exactly what it was), and on an opted-in device
  reads the bookmark and makes the silent renewal.

  THE LISTENERS ARE ATTACHED ONLY ONCE THE DEVICE HAS OPTED IN, here or from rememberOptIn(), so a
  device that never connected carries none of them — no store subscriber, no visibility handler — and
  its header cannot be moved by anything in this file.
*/
export function start() {
  refreshSyncButton();
  if (!optedIn()) return;

  if (!started) {
    started = true;
    store.subscribe(() => {
      if (!optedIn()) return;
      if (!driveSync.syncState().bookmarkRead) prime();
      else refreshSyncButton();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !optedIn()) return;
      /* A day may have turned over while the app was in the background, which is `stale` arriving
         on its own — so this repaints whether or not a renewal is needed. */
      refreshSyncButton();
      renewSilently();
    });
    window.addEventListener('resize', refreshSyncButton);
  }

  prime();
  renewSilently();
}
