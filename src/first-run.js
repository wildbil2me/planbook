/*
  The first-run doors — a fresh device opens the year it already has, from Google Drive or from a
  backup (WO-7.9).

  ── WHY IT EXISTS ──

  A new install finds no year, so store.boot() makes an empty one with a new `docId`. Sync only ever
  looks for the Drive file carrying the `docId` of the document open here, so on that device it can
  never find the year the laptop has been syncing all term — and a tap on Sync uploads the empty year
  as a second Planbook file. The owner met exactly that on a fresh laptop on 2026-09-26, and ruled the
  same day: **on first run, a fresh device offers to open a year from Google Drive or from a backup.**

  ── WHERE THE DOORS ARE, AND WHEN ──

  Inside the home screen's empty state, under a hairline below *Add your first class* — variant B of
  design/mockups/first-run.html, the owner's ruling 2. One primary button on the screen every new
  teacher sees first, because pulling a year happens once per device; the two doors are secondary.
  They sit ALONGSIDE the ordinary way forward and never in its place: sync is an opt-in extra, and a
  teacher with no Drive year starts exactly as she does today.

  THEY ARE DRAWN ONLY ON A DEVICE WHOSE ONE DOCUMENT IS UNTOUCHED, and that test is
  store.untouchedYear()'s — a positive proof in six facts, argued where it is written, which answers
  null to anything short of proof. Here it is asked on every paint of the empty state and the doors
  appear only on a yes, so the block starts hidden in the markup and stays hidden through any doubt,
  any failure and any answer that arrives for a document that is no longer open. It goes away for
  good the moment the year stops being untouched, because nothing in the app ever makes a year
  untouched again: `rev` only rises.

  ── THE TWO DOORS ──

  THE BACKUP DOOR IS THE EXISTING RESTORE, reached from here — the button carries `data-backup-panel`,
  the header's own hook, so it opens the same panel through the same route. There is no second
  restore path, and there must not be one. A year restored from a backup brings a `docId` Drive
  already knows and no bookmark, so its first sync keeps both copies: one spare file in Drive, once.
  The owner's ruling 1 is to leave that alone — it errs the safe way, and docs/sync.md documents it.

  THE DRIVE DOOR SIGNS IN AND LISTS. It is drawn only where src/auth.js's flag is open — so on the
  iPad's LAN address only the backup door is drawn — and while the OAuth client is still in Testing,
  TESTING_MODE_NOTE is drawn under it exactly as it is above Connect in About: one constant, one set
  of words, and deleting it removes both.

  ── THE SIGN-IN, AND THE ONE CHOICE THIS FILE MADE ──

  The tap is the Connect: auth.reconnect() is called FIRST in the click handler, in the tap's own
  stack, so Google's window is asked for inside the gesture Safari's pop-up blocker demands — the
  same call the header's sync button makes (WO-7.5, WO-7.10). A sign-in that succeeds sets the
  WO-7.5 opt-in, exactly as About's Connect does, through the same chain in src/shell.js.

  BUT ON A FRESH DEVICE GOOGLE'S LIBRARY IS NOT ON THE PAGE, AND IT MUST NOT BE. WO-7.4 and WO-7.5
  keep it out of the launch of every device that never opted in — only a tap of Connect or of this
  door fetches it there — and this work order's third Acceptance line asserts
  that from the network: a device that never takes either door asks accounts.google.com for nothing.
  So the library cannot be preloaded when the doors are drawn, and the first tap has to fetch it —
  which puts the request after an await, where the iPad blocks the window. THE CHOICE: take
  reconnect()'s own `loadedFirst` path, whole, and give its honest two-tap sentence somewhere to
  stand. On a laptop the fetch lands inside the browser's activation window and the first tap opens
  Google; on the iPad the first tap loads the library and is refused, the dialog says "It is ready
  now — tap again and it will open" beside a *Sign in to Google* button, and that second tap asks
  inside its own gesture with the library already there. Preloading on the doors' paint was the
  obvious fix and it was refused, because it is the one thing Acceptance 3 forbids; preloading on the
  first touch of the door buys a head start of a hundred milliseconds that a script fetch does not
  fit into. The two-tap path is the one that is true on every device, and it is said rather than
  hidden.

  ── WHAT THE LIST SHOWS, AND WHAT IT CANNOT ──

  Years, devices and dates, and nothing from inside a document: src/drive-sync.js's listDriveYears()
  builds every row from Drive's metadata, so there is no class name and no student anywhere in this
  file, and the list is safe on a projector without a presentation-mode branch. A list of one is still
  a list, confirmed like any other. Conflict copies are not in it — they are for a teacher to open by
  hand — and the dialog says so.

  AND SYNC IS STILL NOT A BACKUP. A teacher who opens her year from Drive has not been told her
  backups are optional, and the confirm says the opposite in the About panel's own words. After a pull
  the backup nag is re-read (src/shell.js), which on a year never downloaded on this device puts the
  amber strip up straight away — the right first thing for her to see.

  It imports the store to ask one question, src/auth.js for the flag, the note and the sign-in, and
  src/drive-sync.js for the list and the pull. Nothing imports it but src/home.js, which paints the
  doors, and src/shell.js, which routes the taps.
*/

import * as store from './store.js';
import * as auth from './auth.js';
import * as driveSync from './drive-sync.js';
import { openModal, closeModal } from './modal.js';
import { shortDate } from './date-text.js';

const BLOCK_ID = 'homeFirstRun';
const DRIVE_BTN_ID = 'firstRunDriveBtn';
const NOTE_ID = 'firstRunTestingNote';

const PULL_ID = 'drivePullModal';
const PULL_STATUS_ID = 'drivePullStatus';
const PULL_SIGNIN_ID = 'drivePullSignIn';
const PULL_LABEL_ID = 'drivePullListLabel';
const PULL_LIST_ID = 'drivePullList';
const PULL_NOTE_ID = 'drivePullConflictNote';

const CONFIRM_ID = 'drivePullConfirmModal';
const CONFIRM_TITLE_ID = 'drivePullConfirmTitle';
const CONFIRM_LEAD_ID = 'drivePullConfirmLead';
const CONFIRM_BTN_ID = 'drivePullConfirmBtn';

/* ────────────────────────────── state ────────────────────────────── */

/* Which paint of the doors is the latest. The untouched test reads IndexedDB twice, so two paints in
   a row can answer out of order; only the newest one may draw. */
let asked = 0;
/* The rows the dialog last drew, by index — the `data-first-run-pick` hook carries an index into
   this rather than a docId, so a row's id never has to survive a trip through an attribute. */
let rows = [];
/* The row the confirm is about. */
let picked = null;

/* ────────────────────────────── the doors ────────────────────────────── */

/*
  Paint the doors from the open document. `offered` is src/home.js's answer to "is the empty state
  on screen with a document behind it" — the doors go when the empty state goes, so hiding them needs
  no rule of its own (ruling 2).

  Two halves. The synchronous one can only say NO — no document, or one that has a save, a class or a
  student already — and when it does the block is hidden in this call, with nothing awaited. The
  asynchronous one is the only thing that can say yes, and it draws only if it is still the newest
  paint and the document it proved is still the one open. Returned as a promise of the answer, for
  the harness; the app never awaits it.
*/
export function refreshFirstRun(offered) {
  const ticket = ++asked;
  const doc = store.getDoc();
  if (!offered || !doc || doc.rev !== 1
      || (Array.isArray(doc.classes) && doc.classes.length)
      || (Array.isArray(doc.students) && doc.students.length)) {
    paint(false);
    return Promise.resolve(false);
  }
  return store.untouchedYear().then((found) => {
    if (ticket !== asked) return false;
    const ok = !!found && store.getDoc() === doc && found.docId === doc.docId;
    paint(ok);
    return ok;
  }, () => {
    if (ticket === asked) paint(false);
    return false;
  });
}

/*
  WHICH DOORS, as a pure function of two facts — whether the device is untouched, and the host the
  page is served from. Split out for src/auth.js's hostAllowsSignIn() reason: A PAGE CANNOT CHANGE ITS
  OWN HOSTNAME, so the arm a harness cannot be served from — the iPad's LAN address, where only the
  backup door may be drawn — is unreachable from a page that can only measure its own origin. paint()
  below draws exactly this answer for the page's own host, so the harness asking it about the LAN
  address and measuring the page on its own are two readings of one function. Exported for the
  harness; nothing else calls it.
*/
export function doorsFor(untouched, hostname) {
  const any = untouched === true;
  return { backup: any, drive: any && auth.hostAllowsSignIn(hostname) };
}

function paint(show) {
  const block = document.getElementById(BLOCK_ID);
  if (!block) return;
  const doors = doorsFor(show, location.hostname);
  block.classList.toggle('hidden', !doors.backup);

  /* The Drive door is the flag's to allow: shut on every origin the OAuth client does not list, the
     iPad's LAN address first among them, where only the backup door is drawn. */
  const btn = document.getElementById(DRIVE_BTN_ID);
  if (btn) btn.classList.toggle('hidden', !doors.drive);

  /* The About panel's rule for the same words: drawn while nobody is signed in, hidden once somebody
     is, and gone entirely when the constant is emptied at Google's approval. */
  /* WRITTEN ONLY WHILE IT IS DRAWN, and emptied otherwise — not merely hidden. The home view is read
     as TEXT by more than one check (tools/verify/glance-quiet.mjs asks that nothing under #homeView
     mentions a review while presentation mode is on), and a hidden paragraph still has a
     textContent: the first run of this work order's harness put "Google is still reviewing…" under
     the home view of every device with classes, where no door is ever drawn. */
  const note = document.getElementById(NOTE_ID);
  if (note) {
    const drawn = doors.drive && !!auth.TESTING_MODE_NOTE && !auth.authState().signedIn;
    note.textContent = drawn ? auth.TESTING_MODE_NOTE : '';
    note.classList.toggle('hidden', !drawn);
  }
}

/* The synchronous half of the test above, asked at TAP time: a door left on the glass over a year
   that has since had something put in it does nothing, and takes itself down. The full proof is
   taken again by the pull, twice, before anything is replaced. */
function stillLooksUntouched() {
  const doc = store.getDoc();
  return !!doc && doc.rev === 1
    && !(Array.isArray(doc.classes) && doc.classes.length)
    && !(Array.isArray(doc.students) && doc.students.length);
}

/* ────────────────────────────── the Drive dialog ────────────────────────────── */

/*
  THE DRIVE DOOR'S TAP, and the button inside the dialog that asks again — both carry
  `data-first-run-drive` and both land here, from src/shell.js's click listener, which chains the
  opt-in and the list onto the promise this hands back.

  THE ORDER OF THE FIRST LINES IS THE WHOLE OF "INSIDE THE GESTURE". reconnect() is called before
  anything else that could await — it reaches requestAccessToken() in this stack when the library is
  on the page — and the dialog opens after it. With a sign-in already standing (About's Connect in the
  same session) nothing is asked and the list follows straight away.

  Returns a promise of whether there is a sign-in now, or null when the tap did nothing — off the
  flag, or on a device that is no longer untouched.
*/
export function tapDriveDoor(opener) {
  if (!auth.signInAvailable()) return null;
  if (!stillLooksUntouched()) {
    refreshFirstRun(false);
    return null;
  }

  const asking = auth.authState().signedIn ? Promise.resolve(true) : auth.reconnect();

  rows = [];
  picked = null;
  paintList();
  paintPullStatus('Waiting for Google…', false);
  showSignInButton(false);
  const overlay = document.getElementById(PULL_ID);
  if (overlay && overlay.classList.contains('hidden')) openModal(PULL_ID, opener);
  return asking.then((ok) => ok === true, () => false);
}

/*
  After the sign-in settles — called by src/shell.js once it has run the same chain About's Connect
  runs, so the opt-in is set before the list is asked for. A failed sign-in draws src/auth.js's own
  sentence, whichever of them it was — including reconnect()'s "It is ready now — tap again and it
  will open", which is the iPad's first tap on a fresh device — beside the button that taps again.
*/
export function afterSignIn(ok) {
  if (!ok) {
    const why = auth.authState().lastError
      || 'Planbook is not connected to Google Drive, so it cannot look for your years yet.';
    paintPullStatus(why, true);
    showSignInButton(true);
    return Promise.resolve(false);
  }
  showSignInButton(false);
  paintPullStatus('Looking in your Google Drive…', false);
  return driveSync.listDriveYears().then((found) => {
    if (!found.ok) {
      paintPullStatus(found.message, true);
      showSignInButton(!!found.signedOut);
      rows = [];
      paintList();
      return false;
    }
    rows = found.rows;
    paintList();
    paintPullStatus(rows.length
      ? (rows.length === 1
        ? 'There is one Planbook year in this Google account’s Drive. Tap it to open it here.'
        : 'There are ' + rows.length + ' Planbook years in this Google account’s Drive. Tap the '
          + 'one to open here.')
      : 'There is no Planbook year in this Google account’s Drive yet, so there is nothing to '
        + 'open. This device carries on as a fresh one — close this and add your first class.',
      false);
    return true;
  });
}

function paintPullStatus(text, bad) {
  const line = document.getElementById(PULL_STATUS_ID);
  if (!line) return;
  line.className = bad ? 'class-error' : 'class-hint';
  line.textContent = text || '';
}

function showSignInButton(show) {
  const wrap = document.getElementById(PULL_SIGNIN_ID);
  if (wrap) wrap.classList.toggle('hidden', !show);
}

/* "Windows PC · Sep 28 at 7:52 AM" — who wrote it last and when, from Drive's own clock. A date and a
   clock time rather than "2 hours ago", for the reason the Drive panel's last-synced line gives. */
function whenAndWhere(row) {
  const at = new Date(row.modifiedTime);
  if (!row.modifiedTime || Number.isNaN(at.getTime())) return row.deviceLabel;
  return row.deviceLabel + ' · ' + shortDate(driveSync.localDayOf(at)) + ' at '
    + at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/* The shipped year picker's rows, pointed at Drive: `.year-list` / `.year-row` / `.year-row-note`
   worn as shipped (the drawing says so, and src/year-picker.js builds them the same way). Built with
   textContent throughout, because a file name — the fallback for a year label — is something a
   teacher can type in Drive. */
function paintList() {
  const list = document.getElementById(PULL_LIST_ID);
  const label = document.getElementById(PULL_LABEL_ID);
  const note = document.getElementById(PULL_NOTE_ID);
  if (list) {
    list.textContent = '';
    rows.forEach((row, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'year-row';
      btn.setAttribute('data-first-run-pick', String(i));
      btn.setAttribute('aria-haspopup', 'dialog');
      const name = document.createElement('span');
      name.textContent = row.year;
      const where = document.createElement('span');
      where.className = 'year-row-note';
      where.textContent = whenAndWhere(row);
      btn.append(name, where);
      list.append(btn);
    });
  }
  if (label) label.classList.toggle('hidden', !rows.length);
  if (note) note.classList.toggle('hidden', !rows.length);
}

/* ────────────────────────────── the confirm ────────────────────────────── */

/*
  A ROW WAS TAPPED: say what will happen, and ask. A list of one is confirmed like any other.

  The sentence is built from the row — the year label, the device and the time — and from the empty
  year open here. Whether the pull replaces that year or opens beside it is decided by the year
  INSIDE the downloaded file (src/drive-sync.js pullYear()), so a renamed file with no year property
  could land the other way from what this says; both outcomes are safe, because the only year that
  can be replaced is one with nothing in it.
*/
export function pickRow(index, opener) {
  const row = rows[Number(index)];
  if (!row) return;
  picked = row;
  const here = store.getDoc();
  const device = isIPad() ? 'iPad' : 'device';
  const title = document.getElementById(CONFIRM_TITLE_ID);
  if (title) title.textContent = 'Open ' + row.year + ' from Google Drive?';
  const lead = document.getElementById(CONFIRM_LEAD_ID);
  if (lead) {
    lead.textContent = here && here.year === row.year
      ? 'This ' + device + '’s ' + row.year + ' is empty, and the one in Drive, ' + lastSaved(row)
        + ', will take its place. From then on the two devices sync this year with each other.'
      : 'The ' + row.year + ' in Drive, ' + lastSaved(row) + ', opens on this ' + device + ' beside its '
        + 'empty ' + (here ? here.year : 'year') + ', which stays here untouched. From then on the two '
        + 'devices sync ' + row.year + ' with each other.';
  }
  const btn = document.getElementById(CONFIRM_BTN_ID);
  if (btn) btn.disabled = false;
  openModal(CONFIRM_ID, opener);
}

/* "last saved on the Windows PC on Sep 28 at 7:52 AM" — the row's two facts as a clause. */
function lastSaved(row) {
  const who = row.deviceLabel === 'another device' ? 'another device' : 'the ' + row.deviceLabel;
  const at = new Date(row.modifiedTime);
  if (!row.modifiedTime || Number.isNaN(at.getTime())) return 'last saved on ' + who;
  return 'last saved on ' + who + ' on ' + shortDate(driveSync.localDayOf(at)) + ' at '
    + at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/* The device word in one sentence of the confirm, and nowhere that decides anything. */
function isIPad() {
  return driveSync.deviceLabelFor(navigator.userAgent, navigator.maxTouchPoints) === 'iPad';
}

export function cancelPick() {
  picked = null;
  closeModal(CONFIRM_ID);
}

/*
  "Open it". The pull is src/drive-sync.js's, and it proves the device untouched twice more before it
  replaces anything. On success both dialogs close and src/shell.js repaints every screen from the
  document that arrived (afterPull there); on a refusal the confirm closes and the list dialog says
  why, with the list still under it to try again.
*/
export function confirmPick() {
  const row = picked;
  if (!row) return Promise.resolve(null);
  const btn = document.getElementById(CONFIRM_BTN_ID);
  if (btn) btn.disabled = true;
  paintPullStatus('Opening ' + row.year + ' from Google Drive…', false);
  return driveSync.pullYear(row.docId).then((result) => {
    picked = null;
    closeModal(CONFIRM_ID);
    if (result && result.kind === 'pulled') {
      closeModal(PULL_ID);
      return result;
    }
    paintPullStatus(result ? result.message : 'Nothing was opened.', true);
    if (result && result.kind === 'signed-out') showSignInButton(true);
    return result;
  }, () => {
    picked = null;
    closeModal(CONFIRM_ID);
    paintPullStatus('Planbook could not open that year, so nothing was changed.', true);
    return null;
  });
}
