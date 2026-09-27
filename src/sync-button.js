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
      lapsed     The Google sign-in did not finish. Tap to try again.             Google's sign-in, then sync
      failed     The last sync did not finish. Nothing on this device changed.    About, at the Drive section
      syncing    Syncing with Google Drive…                                       nothing until it settles

  WITH NO SIGN-IN, THE FIRST THREE READ EXACTLY AS THEY WOULD SIGNED IN (WO-7.10). The token is
  memory-only, so every launch starts without one, and "no token" is not something to raise an alarm
  about: the bookmark still says how fresh this device is, and that is what the header reads. The
  tap is what changes — it asks Google for a sign-in INSIDE ITSELF and syncs when one comes back, one
  gesture — and the label says so ("Tap to sign in to Google and sync now.") so the window that opens
  is one she was told about. `lapsed` has changed meaning to match: see its arm in the ladder below.

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
     REVERSED IN ITS SECOND HALF BY WO-7.10 (the owner, 2026-09-26): the "silent" reconnect was a
     Google window with no tap behind it — blocked on the laptop, which put a red line in About, and
     opened over the app on the iPad at launch and on every return, which left About dead and held
     the next build back. Opting in is still remembered and still means the library loads at launch;
     a sign-in is asked for only by a tap.

  ── TWO THINGS THAT LOOK LIKE OVERSIGHTS ──

  THE TIME, NEVER A COUNTDOWN. "Synced at 9:41" stays true without a timer; "2 min ago" needs a clock
  ticking in the header. It is the ruling the Drive panel's "ends at 2:47" already took, and there is
  no setInterval and no setTimeout anywhere in this file.

  THE LAPSE IS NOT WATCHED. A token that runs out while the app sits open changes nothing on the
  header, and does not need to: the reading is freshness, which the lapse does not touch, and the next
  tap finds no token and signs in inside itself before it syncs. Watching the clock for it would be
  the timer above by another name.

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
  WHETHER THE LAST SIGN-IN THIS BUTTON'S TAP ASKED FOR FAILED — the one fact this module holds of its
  own (WO-7.10). Until that work order it held where a launch-time "silent renewal" had got to
  (''/'trying'/'failed'/'ok'), because `lapsed` was drawn only after that renewal had been tried. The
  renewal is gone — it was a Google window with no tap behind it — and with it the only reason to
  distinguish "not tried yet" from "no token": both now read the bookmark. What is left is a tap
  that asked Google and did not get a token, which is a thing she did and is owed an answer to.

    false  nothing to say (every launch starts here: the token is memory-only)
    true   her tap asked and it failed — this is what `lapsed` is drawn on, until the next success
*/
let tapFailed = false;
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
  tapFailed = false;
  start();
  refreshSyncButton();
}

/* Cleared by About's switch-off — "Disconnect" signed in, "Stop syncing on this device" signed out,
   one control (WO-7.11) — and by nothing else. A failed reconnect leaves a teacher opted in, because
   she is: the button stays, and its next tap asks again.

   AND src/auth.js IS TOLD, both here and in start() (which rememberOptIn() reaches), because the
   About panel draws that switch-off on the opt-in as well as on a sign-in and auth.js does not read
   the preference — see `syncOptedIn` there. Told the value READ BACK, for rememberOptIn()'s reason. */
export function forgetOptIn() {
  setPref(PREF, false);
  tapFailed = false;
  auth.noteSyncOptIn(optedIn());
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

    1. syncing   a transfer is out (src/drive-sync.js) — or a sign-in her tap asked for is, which
                 reads "Waiting for Google…" (the About panel's own words for the same moment)
                 rather than "Syncing" because nothing is being transferred, and taps the same:
                 nothing until it settles. It is drawn ONLY while a request is really out. Until
                 WO-7.10 it was also the resting state of every launch — "Connecting to Google
                 Drive…" until a renewal had been tried — and with the renewal gone that reading
                 would have sat on the header for ever.
    2. lapsed    her tap asked Google for a sign-in and did not get one, and nothing has succeeded
                 since. THE POINT OF DEPARTURE FROM WO-7.5, argued here because the work order left
                 it to the build (keep it, or draw it only after a tapped sign-in fails): it is kept,
                 in that narrow form. Dropping it would leave a tap that did nothing visible — the
                 button would go back to "Tap to sign in and sync" as though she had never tapped —
                 and the two commonest causes are ones she can act on: a blocked window (About says
                 how, and says it in red), and a library that had to be fetched first, which the
                 SECOND tap cures. What it no longer means is "the sign-in ended": a missing token is
                 every launch now, and is not an alarm. A sync that found the sign-in gone is not
                 this state either — syncNow() asks Google nothing, so that outcome is the token's
                 lapse, not a refusal, and the tap that follows signs in on its own.
    3. failed    the last sync ended badly for any reason but the sign-in.
    4. unknown   the bookmark has not been read yet; drawn as `syncing` for the frame it takes,
                 because an amber "not in Drive yet" corrected a moment later is a false sentence.
    5. ahead, stale, current — freshnessOf(), unmodified, SIGNED IN OR NOT. With no token only the
                 label's last sentence changes, to say that the tap signs in first.
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
  } else if (a.busy) {
    state = 'syncing'; reading = 'Waiting for Google…';
  } else if (!a.signedIn && tapFailed) {
    state = 'lapsed'; reading = 'The Google sign-in did not finish. Tap to try again.';
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
     a teacher about to tap is owed the consequence. `lapsed` already ends in its instruction. With no
     token the tap opens Google's window before it syncs, and she is told that before she taps. */
  const syncs = state === 'current' || state === 'ahead' || state === 'stale';
  const hint = state === 'failed' ? ' Tap for details.'
    : syncs ? (a.signedIn ? ' Tap to sync now.' : ' Tap to sign in to Google and sync now.') : '';
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
  path already paints the modal before it appears; this answers door 'about' and leaves it there.

  WITH NO SIGN-IN, THE TAP SIGNS IN AND THEN SYNCS, AND THE SIGN-IN IS ASKED FOR SYNCHRONOUSLY
  (WO-7.10, and WO-7.5's first Trap before it). This is called from the click listener,
  auth.reconnect() reaches requestAccessToken() inside the same stack, and nothing is awaited before
  it. The sync is started only from the far side of that promise. The tempting shape — call
  syncNow() and let it find no token — is the one WO-7.10's brief warned about: syncNow() flushes and
  reads the disk before it asks for a token, so a request made there lands two awaits after the tap
  and the gesture is gone. That is the launch renewal's failure moved onto the tap, and it is why
  src/auth.js's ensureFreshToken() no longer asks Google anything at all.

  `lapsed` taps the same way: it is a sign-in her last tap asked for and did not get, and the only
  thing that cures it is another one, inside another tap.

  IT HANDS THE SYNC BACK, NOT JUST THE DOOR (WO-7.7). The answer is `{ door, syncing }`: which way
  the tap went, and — when it went to Drive — a promise of syncNow()'s own result, so src/shell.js can
  chain the screen repaint a download needs exactly where it chains one onto About's Sync. On the
  sign-in door that promise resolves to null if the sign-in failed, which afterDownload() reads as
  "nothing downloaded". That repaint is not done HERE because it reaches every screen, and this file
  importing src/shell.js or a screen would close the loop afterYearChange()'s comment refuses; a
  registered "call me after a download" hook was the other shape, and it was declined because it is
  a store subscriber by another name — a standing listener this module would own for somebody else's
  screens. Handing the promise back is one caller, one tap, nothing left registered.
*/
export function tapSyncButton() {
  const st = syncButtonState();
  if (!st.drawn || st.state === 'syncing') return { door: 'none', syncing: null };
  if (st.state === 'failed') return { door: 'about', syncing: null };

  if (!auth.authState().signedIn) {
    /* Evaluated first, in this stack: reconnect() asks Google before its own first await. */
    const asking = auth.reconnect();
    refreshSyncButton();
    const syncing = asking.then((ok) => {
      tapFailed = !ok;
      if (!ok) {
        refreshSyncButton();
        driveSync.refreshSyncChrome();
        return null;
      }
      /* A sign-in succeeded, so a sync outcome that said the sign-in had run out is now false —
         dropped at its cause rather than hidden at paint (src/drive-sync.js signedInAgain()). */
      driveSync.signedInAgain();
      const run = driveSync.syncNow();
      refreshSyncButton();
      return run;
    }, () => { tapFailed = true; refreshSyncButton(); return null; });
    syncing.then(afterSync, afterSync);
    return { door: 'sign-in', syncing: syncing };
  }

  const syncing = driveSync.syncNow();
  refreshSyncButton();
  syncing.then(afterSync, afterSync);
  return { door: 'sync', syncing: syncing };
}

/* After a sync from EITHER door — this button or About's "Sync this year now" — which is why it is
   exported: src/shell.js chains it onto the panel's own tap. A sync that landed is a sign-in that
   works, so it clears a failed tap; a sync that found no token says nothing new about the tap.

   IT READS THE VALUE THIS SYNC RESOLVED WITH, never syncState().outcome — src/shell.js's
   afterDownload() argument (WO-7.7). Here it is not a nicety: the sign-in door resolves with null
   when the sign-in failed and no sync ran, and the sticky outcome at that moment is the LAST sync's,
   usually a success, which would clear the failure this function had just been told about. */
export function afterSync(result) {
  if (result && result.kind && !result.bad) tapFailed = false;
  refreshSyncButton();
}

/* ────────────────────────────── launch ────────────────────────────── */

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
  reads the bookmark and PUTS GOOGLE'S LIBRARY ON THE PAGE — and asks it for nothing.

  NO SIGN-IN IS REQUESTED HERE, OR ON A RETURN TO VIEW (WO-7.10). Until that work order this function
  and the visibility listener below made a "silent renewal" — ensureFreshToken(), which reached
  `requestAccessToken({ prompt: '' })`. Google's token client has no silent path: that call opens a
  window. On the laptop the browser blocked it and About showed "The browser blocked the Google
  sign-in window" in red; on the iPad's home-screen app it opened, over the app, at launch — and
  because a failed renewal was retried on every return to view, closing it brought it straight back
  (the harness observed the loop against a stub that opens every window: one request per return).
  The owner's ruling that day was option A: opting in stays, a sign-in is asked for only by a tap.

  THE LIBRARY STILL LOADS HERE, and only on an opted-in device (auth.preloadSignIn()). That is what
  lets the header's tap reach requestAccessToken() in its own stack; without it the first tap of
  every session would spend its gesture fetching a script. It is also exactly what privacy.html and
  docs/FERPA.md say — the library loads each time Planbook opens on a device where Connect
  succeeded — and a device that never connected fetches nothing, which tools/verify/sync-button.mjs
  asserts from the wire. A return to view loads it again only if it is still not there (an offline
  launch), which is a script fetch and never a token request.

  THE LISTENERS ARE ATTACHED ONLY ONCE THE DEVICE HAS OPTED IN, here or from rememberOptIn(), so a
  device that never connected carries none of them — no store subscriber, no visibility handler — and
  its header cannot be moved by anything in this file.
*/
export function start() {
  /* Before the early return, so a device that never opted in tells auth.js so too (WO-7.11). */
  auth.noteSyncOptIn(optedIn());
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
         on its own — so this repaints. It asks Google for nothing. */
      refreshSyncButton();
      auth.preloadSignIn();
    });
    window.addEventListener('resize', refreshSyncButton);
  }

  prime();
  auth.preloadSignIn();
}
