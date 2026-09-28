/*
  Google Drive document transfer, and what to do when two copies disagree (WO-7.2).

  ── WHAT THIS IS ──

  The half of Phase 7 that moves bytes. src/auth.js (WO-7.1) signs in and stops; this file takes
  the token from it, finds the one Drive file that belongs to the open school year, and does
  exactly one of four things: nothing, upload, download, or keep both. There is a fifth thing it
  will never do, and it is the work order's Traps line: IT NEVER MERGES. There is no merge
  function below, no field-level comparison, no "take the newer of the two", and no code path in
  which one document is read for parts and another for the rest. Two gradebooks silently folded
  into one is how a teacher loses a term of grades and never finds out, and the design's answer —
  the only answer — is to keep both copies whole and say so.

  ── WHAT SYNC IS NOT, WHICH THE PANEL SAYS OUT LOUD ──

  It is not a backup. Drive holds ONE live copy of a year and the next sync overwrites it with a
  newer one; the file the ⤓ button downloads is the safety net and stays mandatory whether or not
  sync is on (docs/sync.md § "What sync is not", CLAUDE.md, WO-1.5). That sentence is in the panel
  copy in index.html rather than only here, because a teacher who believes she is backed up stops
  downloading backups, and no comment in a source file has ever stopped anybody doing that.

  ── AND WHAT IT PUTS SOMEWHERE OTHER THAN THIS DEVICE ──

  The whole year document, which carries IEP and 504 details, case managers, plan review dates,
  medical needs, behavior plans and what a plan says about attendance. CLAUDE.md's rule is that
  accommodation, medical and plan data never leaves the roster, with the JSON backup as the one
  exception whose own UI says so — and this is the second such exception, so it holds the same
  standard: the Drive panel names that data in as many words, in the teacher's own words, above
  the button that starts it. Do not soften that copy, and do not filter the upload to make it go
  away — a Drive copy that quietly dropped the support fields would restore a gradebook that had
  lost the things a teacher is legally obliged to implement, which is exactly the argument
  src/backup.js's panel makes about the file it writes.

  ── THE FIVE DECISIONS THIS WORK ORDER HAD TO MAKE ──

  1. WHERE `baseRev` LIVES. It lives in IndexedDB, in a store of its own, keyed by `docId`, and
     the whole argument is at store.readSyncState() — including the two places it was refused,
     the year document and localStorage itself. It is read from here, written from here, and is not
     touched anywhere else in the app.

  2. WHAT A RESTORE FROM ANOTHER DEVICE MEANS — docs/sync.md left this open in as many words and
     answering it was part of this work order. The answer fell out of decision 1 rather than
     being bolted on: the bookmark is keyed by `docId`, a backup from another device brings that
     file's `docId` with it, so the restored document asks for a bookmark that has never existed
     and gets none. "No bookmark" is a state this file already has to handle, and its answer is
     the conservative one — with a remote file present and no bookmark, THIS IS A CONFLICT, so
     both copies are kept and neither is guessed at. See planFor().

  3. `queued` DOES NOT COME BACK. The deliverable names "syncing / queued / retry", and
     src/save-indicator.js records why the middle one is absent from this app: `queued` was Roll
     Call!'s state and it meant "sitting in the Apps Script outbox waiting for the network" — the
     outbox CLAUDE.md forbids reintroducing. Nothing here queues anything. Sync is a foreground
     act that happens on a tap, while the app is open and the teacher is signed in (there is no
     refresh token in this flow, so it cannot be anything else), and a transfer that did not
     happen has failed and says so rather than waiting somewhere. What IS wired is `syncing`,
     which has had no caller in the app since WO-1.10 because Phase 7 owns it, and `retry`.

     AND `error` IS DELIBERATELY NOT WIRED, which is the part worth reading twice. That state
     draws "✕ Save failed" and announces "Your last change may not be stored" — and a sync
     failure means nothing of the kind. The document on this device is untouched by every failure
     path below, so painting the save chip red for one would tell a teacher her grades are in
     danger at the exact moment they are not. src/store.js calls that chip's one forbidden lie
     "showing ✓ Saved for a write that was then thrown away"; this is the same lie in the other
     direction. A failed sync reports in the Drive panel, which is where the teacher tapped.

  4. THE DEPENDENCY POINTS ONE WAY. src/auth.js imports src/live-region.js and nothing else, and
     its header says why: there is no path from there to src/store.js, so signing out cannot
     write, clear or reorder a single thing in IndexedDB, and "a later work order that needs the
     document should take the token from here rather than bring the store in." This file is that
     later work order. It imports auth.js and store.js; neither imports it back, and auth.js is
     exactly as isolated from the document as it was before this landed.

  5. THE CONFLICT COPY IS A SECOND COPY OF THE MOST SENSITIVE DATA IN THIS APP, which is the § at
     the top of this header. What the panel says about it is teacher-facing prose about a
     disclosure and it holds the backup panel's standard: the conflict outcome names the file, says
     which Drive folder it is in, and says what is inside it.

  ── THE SEAM, AND WHAT NO HARNESS CAN DO ──

  Nothing in this file is exported for a harness. There is no injectable transport and no test
  hook: every request below goes through the page's own `fetch`, which is a thing a browser
  harness can replace for the length of a section without a single line of shipped code existing
  for its benefit. That is a deliberate difference from src/auth.js, whose acceptTokenResponse()
  IS exported as a seam — a page cannot be handed a real Google token, so the arrival of one had
  to be reachable some other way, whereas a page's network is already reachable. An exported
  "set the transport" would be a door in shipping code through which every byte of a gradebook
  could be pointed somewhere else, and it would exist so that a test could avoid one line.

  What no harness can do is the real handshake and the real Drive, so tools/verify/drive-sync.mjs
  drives the whole state machine against a Drive it stands up itself, and the two-device
  acceptance lines stay owed to a human with two browser profiles (TESTING.md § WO-7.2).
*/

import * as store from './store.js';
import { parseBackup } from './backup.js';
import { signInAvailable, authState, ensureFreshToken, refreshAuthChrome, refused } from './auth.js';
import { showSaveState } from './save-indicator.js';
import { announce } from './live-region.js';

/* Drive v3. Two hosts because Google splits them: metadata operations go to the API host and
   anything carrying a file body goes to the upload host. Both are `googleapis.com`, and neither
   is fetched without a sign-in and a tap behind it: a sync from About's "Sync this year now" or
   the header's sync button (whose tap signs in first when there is no token), or — since WO-7.9,
   with neither Connect nor Sync tapped — the first-run door Open from Google Drive, whose
   successful sign-in lists this account's years (listDriveYears()) and whose confirm pulls one
   (pullYear()). Nothing in this file reaches either host on a timer or at launch. */
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

/*
  Today, as YYYY-MM-DD, out of the LOCAL calendar fields and never out of toISOString() — that
  method returns UTC, which is a different day from about 7pm Eastern onward, so a conflict
  noticed after school in the autumn would be filed under tomorrow.

  IT IS A THIRD PRIVATE COPY OF FOUR LINES AND THAT IS THE CONVENTION HERE, not laziness.
  src/attendance.js exports todayISO() and src/log.js keeps its own localStamp() rather than
  importing it, for the reason that decides it here too: attendance.js pulls in the class layer,
  the roster and the pass code, and a module whose whole job is to move one file to Drive should
  not import the roster to find out what day it is. What must never be re-derived is a RULE — the
  grade math, the visibility of a support field, the merge-field whitelist — and this is a date
  format that has been written the same way in every file in this repository since WO-2.1.
*/
function todayLocal() {
  return localDayOf(new Date());
}

/* The same four lines for any moment rather than for now — split out at WO-7.5, whose stale rule is
   a comparison of two CALENDAR DAYS (the owner's ruling 4) and never a subtraction of hours. Two
   instants 90 minutes apart can be on different days and two 23 hours apart on the same one, and
   only the first pair is "not synced today". Exported for src/sync-button.js, which writes the
   "yesterday" in a reading from it rather than keeping a fourth copy. */
export function localDayOf(when) {
  const pad = (n) => (n < 10 ? '0' : '') + n;
  return when.getFullYear() + '-' + pad(when.getMonth() + 1) + '-' + pad(when.getDate());
}

/* How long to wait before the one retry. Short, because the teacher is standing there watching
   the chip, and one retry rather than a ladder for src/store.js's reason: a request that fails
   for a permanent reason fails again in half a second, and a control that flaps trains a teacher
   to ignore it. */
const RETRY_AFTER_MS = 600;

/* ────────────────────────────── state ────────────────────────────── */

/* True while a transfer is out. Guards a second tap and greys the button. */
let busy = false;
/* The last outcome — `{ kind, message, bad }` or null. A sentence for the teacher and a kind for
   the harness; never an exception object and never a Google error body, which are identifiers
   rather than sentences (src/auth.js's describe() makes the same distinction). */
let outcome = null;
/* The bookmark for the open document, and the docId it is about. `markFor` is '' whenever the
   bookmark has not been read yet, which is a THIRD state from "read, and there is none" — the
   panel says different things about them and one of the two would be a lie if they were folded
   together. */
let mark = null;
let markFor = '';

const SYNC_BTN_ID = 'driveSyncBtn';
const SYNC_STATUS_ID = 'driveSyncStatus';

/* ────────────────────────────── names, and the device ────────────────────────────── */

/* The live file. One per school year per document, and the name is for the teacher's eyes in her
   own Drive — nothing matches on it. Matching is `appProperties.docId` and only that, because a
   name is a thing a teacher can rename. */
export function liveFileName(year) {
  return 'Planbook ' + year + '.json';
}

/* The losing side of a conflict, named the way the work order names it:
   `Planbook 2026-2027 (conflict from iPad 2026-11-14).json`. The device is the one that WROTE
   the copy being set aside, read off the file's own `appProperties.deviceLabel`, and the date is
   the day the conflict was noticed rather than the day the copy was made — a teacher looking for
   "the one from Tuesday" is looking for the day she was told about it. */
export function conflictFileName(year, deviceLabel, day) {
  return 'Planbook ' + year + ' (conflict from ' + (deviceLabel || 'another device') + ' '
    + day + ').json';
}

/*
  A coarse label for the kind of device this is, for the filename above and for nothing else.

  IT NAMES A KIND OF MACHINE AND NEVER A PERSON OR AN INSTALL. There is no id in it, nothing
  generated, nothing stored on the device and nothing that could distinguish one teacher's iPad
  from another's — it is one of six words, chosen so that "conflict from iPad" reads the way the
  work order writes it. It travels to the teacher's own Drive as a property of the teacher's own
  file. `deviceId` in the year document is NOT used for this: it is a uuid, "conflict from
  b3f1…" tells a human nothing, and a document's deviceId is generated with the document rather
  than re-stamped by whichever machine last wrote it, so it names the wrong device anyway.

  THE iPad ARM IS THE ONE THAT NEEDS THE COMMENT. iPadOS has reported a Macintosh user agent by
  default since iPadOS 13 — "Request Desktop Website" is the default for iPad — so a plain
  /iPad/ test answers "Mac" on the device this app is built for. The touch-point count is the
  standard discriminator: a Mac reports 0, an iPad reports 5. Getting it wrong costs a filename
  that says Mac, which is why this is a comment rather than a check with a fallback path.
*/
export function deviceLabelFor(ua, touchPoints) {
  const s = String(ua || '');
  if (/iPad/.test(s)) return 'iPad';
  if (/Macintosh/.test(s) && Number(touchPoints) > 1) return 'iPad';
  if (/iPhone/.test(s)) return 'iPhone';
  if (/Android/.test(s)) return 'Android tablet';
  if (/Macintosh|Mac OS X/.test(s)) return 'Mac';
  if (/Windows/.test(s)) return 'Windows PC';
  return 'another device';
}

function thisDeviceLabel() {
  return deviceLabelFor(navigator.userAgent, navigator.maxTouchPoints);
}

/* ────────────────────────────── the comparison ────────────────────────────── */

/*
  THE WHOLE OF THE ORDERING, as a pure function of three numbers — docs/sync.md's table, written
  out so that every arm of it is nameable, drivable and readable in one place. It reads no
  document, takes no token, and touches nothing.

  The table the design specifies is three rows:

      remote.rev == baseRev   → local is ahead      → upload
      remote.rev >  baseRev   → remote is ahead     → download (if local is unchanged since baseRev)
      both changed            → conflict            → keep both, never discard

  and this function is those three rows plus the three cases the table does not name. Each of the
  three additions is resolved the same way, and it is the direction that matters: WHEN THIS
  DEVICE CANNOT PROVE THE REMOTE IS A LATER VERSION OF ITS OWN DOCUMENT, IT KEEPS BOTH. Replacing
  a local gradebook is the only irreversible thing sync does, and it is done on proof or not at
  all; a spare file in Drive is the cost of being wrong in the other direction.

    · NO REMOTE FILE AT ALL. Not a conflict and not a comparison — there is nothing to compare
      with, so the first sync of a document creates the file. `first-upload` rather than `upload`
      because the caller does different things with them (create versus overwrite) and because a
      run that reports which one it did is a run that can be read.

    · NO BOOKMARK, WITH A FILE PRESENT. This device has never synced this document and something
      in Drive claims to be it. That is decision 2 above — a backup restored from another device
      is the ordinary way to arrive here — and the two revs cannot be ordered against each other,
      because `rev` counts saves of a document on whichever machine made them and is not a global
      clock. So: conflict. Both copies survive, the teacher is told, and the bookmark written
      afterwards means it happens exactly once.

    · THE REMOTE IS BEHIND THE BOOKMARK. Drive holds a rev EARLIER than the one this device last
      put there, which means another device overwrote the file with a document of its own whose
      save count is lower. The remote is not a descendant of anything this device knows about, so
      it is not something to download and it is not something to overwrite blind: conflict.

  ONE MORE ARM IS NOT IN THE TABLE AND IS NOT AN ADDITION: `remote.rev == baseRev` with the local
  document also AT baseRev is "nothing has changed anywhere", and the table's first row would
  upload three megabytes to replace a file with its own contents. `in-sync` is that row read
  honestly rather than a departure from it.
*/
export function planFor(localRev, remoteRev, baseRev) {
  if (remoteRev === null || remoteRev === undefined) return 'first-upload';
  if (!Number.isFinite(remoteRev)) return 'conflict';
  if (baseRev === null || baseRev === undefined) return 'conflict';

  if (remoteRev === baseRev) {
    if (localRev === baseRev) return 'in-sync';
    if (localRev > baseRev) return 'upload';
    /* The local document is BEHIND its own bookmark, which `rev` never doing so for a year on a
       device says cannot happen. It is here because "cannot happen" and "is not handled" read
       identically at three in the afternoon in week two of a term. */
    return 'conflict';
  }
  if (remoteRev > baseRev) return localRev === baseRev ? 'download' : 'conflict';
  return 'conflict';
}

/* ────────────────────────────── talking to Drive ────────────────────────────── */

/*
  Every failure below carries a `code`, and there are three of them because the teacher gets a
  different sentence for each: `expired` (Google answered 401 — the token lapsed mid-sync, which is
  the fifth acceptance line, or was revoked before its hour was up, which is WO-7.14; either way
  syncNow() ends the session in src/auth.js through refused() before it settles),
  `network` (nothing reached Google, which is the only one worth retrying), and `drive` (Google
  answered and said no). A bare Error with a message would collapse the three into one paragraph
  that has to hedge.
*/
function fault(code, message, status) {
  const e = new Error(message);
  e.code = code;
  if (status) e.status = status;
  return e;
}

async function request(token, url, init) {
  const options = Object.assign({}, init);
  options.headers = Object.assign({}, options.headers, { Authorization: 'Bearer ' + token });
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    /* fetch() rejects for exactly one class of reason — the request never completed — so this is
       the offline arm, the DNS arm and the school-firewall arm at once. It is also the arm that
       Acceptance 4 is about: a request that never completed wrote nothing at Drive, because
       nothing below ever starts a resumable upload (see uploadBody()). */
    throw fault('network', 'Planbook could not reach Google Drive.');
  }
  if (res.status === 401) {
    throw fault('expired', 'Google would not accept the sign-in Planbook was using.', 401);
  }
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 300); } catch (e) { detail = ''; }
    throw fault('drive', 'Google Drive answered ' + res.status
      + (detail ? ' (' + detail + ')' : ''), res.status);
  }
  return res;
}

/*
  ONE RETRY, AND ONLY FOR A REQUEST THAT IS SAFE TO REPEAT — which is a shorter list than it
  looks. A read can always be repeated. An overwrite of a known file id can be repeated, because
  the second attempt writes the same bytes over the same file and the outcome is identical
  whether or not the first one landed. A CREATE CANNOT: a create whose response was lost and
  whose bytes did land makes a second file, and two files claiming the same `docId` is the one
  state findRemote() below refuses to act on. So neither create in this module is wrapped, and
  the cost of that is that a conflict copy interrupted by a dropped connection has to be asked
  for again by hand — which is the safe direction, since the create of the conflict copy happens
  BEFORE anything is overwritten.

  `retry` on the save chip is this and nothing else, which is the state the deliverable names.
*/
async function withOneRetry(run) {
  try {
    return await run();
  } catch (e) {
    if (e.code !== 'network') throw e;
    showSaveState('retry');
    await new Promise((r) => setTimeout(r, RETRY_AFTER_MS));
    return await run();
  }
}

/*
  THE ONE QUERY, and the sixth acceptance line lives here: sync never touches a year document
  other than the one matched by `docId`.

  Three things make that true rather than intended. The query asks Drive for files carrying this
  document's id as an app property — and `drive.file` means the answer can only ever contain
  files this app itself created, so there is no folder to pick and no path to store. The result
  is then filtered AGAIN, here, against the same id: a `q` is a filter running on Google's side,
  and re-reading the property on ours turns "Drive said these match" into "this code checked".
  And nothing anywhere caches a file id between syncs — every operation in this module writes to
  an id that came out of this function on this pass, so there is no stored pointer that can go
  stale and address the wrong file.

  TWO MATCHES IS A REFUSAL AND NOT A CHOICE. It should be impossible: ids are uuids and only this
  module ever writes the property. If it happens anyway — a create retried against the rule
  above, two devices racing the very first sync of one document — then one of the two files holds
  work that picking the other one would overwrite, and there is no fact available here that says
  which. So it stops, touches neither, and says so.
*/
async function findRemote(token, docId) {
  if (/['\\]/.test(docId)) {
    /* A `docId` is a uuid from crypto.randomUUID(). One carrying a quote could only come from a
       hand-edited document, and it would be building a query string out of it. */
    throw fault('drive', 'This school year has an id Planbook cannot look up safely.');
  }
  const q = "appProperties has { key='docId' and value='" + docId + "' } and trashed = false";
  const url = API + '?spaces=drive&pageSize=10'
    + '&fields=' + encodeURIComponent('files(id,name,appProperties,modifiedTime)')
    + '&q=' + encodeURIComponent(q);

  const res = await request(token, url, { method: 'GET' });
  const body = await res.json();
  const files = (body.files || []).filter(
    (f) => f && f.appProperties && f.appProperties.docId === docId
  );
  if (files.length > 1) {
    throw fault('drive', 'Google Drive has ' + files.length + ' files for this school year and '
      + 'Planbook will not guess which one is yours, so it has not touched any of them. Open '
      + 'Drive, keep the one you want, and move the others out of it.');
  }
  if (!files.length) return null;

  const f = files[0];
  const rev = Number(f.appProperties.rev);
  return {
    id: f.id,
    name: f.name,
    /* NaN when the property is missing or unreadable, and planFor() reads that as a conflict
       rather than as a zero. A file whose rev cannot be read is a file whose place in the order
       is unknown, and unknown is not "the beginning". */
    rev: Number.isFinite(rev) ? rev : NaN,
    deviceLabel: f.appProperties.deviceLabel || '',
  };
}

/* The file's bytes, exactly as Drive holds them. `alt=media` is the whole download. */
async function downloadRemote(token, fileId) {
  const res = await request(token, API + '/' + encodeURIComponent(fileId) + '?alt=media',
    { method: 'GET' });
  return res.text();
}

/*
  A multipart/related body: the metadata part, then the document.

  ONE REQUEST, NEVER A RESUMABLE UPLOAD, AND THAT IS THE FOURTH ACCEPTANCE LINE RATHER THAN A
  simplification. A resumable upload is the obvious tool for three to six megabytes — it is what
  Google's own documentation reaches for at this size — and it is precisely the thing that
  creates a half-written state with a name: a session URI, a file id, and bytes at Drive that
  belong to a transfer nobody finished. A single multipart request has no such state. Drive
  either has the whole body and commits a new revision, or it does not and the previous revision
  is untouched; there is no third outcome for this code to leave behind and no cleanup path for
  it to get wrong. What it costs is that a dropped connection means starting again, which on a
  manual sync a teacher has already been told about by the message that says nothing moved.

  THE BOUNDARY IS CHECKED AGAINST THE BODY. A boundary string that also occurs inside the
  document would end the part early and hand Drive a truncated gradebook that parses — the worst
  shape of failure available here, because it is silent. The string is 24 random hex characters,
  so a collision is not going to happen; checking for one is two lines and turns "will not
  happen" into "did not happen".
*/
function uploadBody(metadata, text) {
  let boundary = '';
  for (let i = 0; i < 8 && !boundary; i++) {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    let hex = '';
    for (let b = 0; b < bytes.length; b++) hex += bytes[b].toString(16).padStart(2, '0');
    const candidate = 'planbook-' + hex;
    if (text.indexOf(candidate) === -1) boundary = candidate;
  }
  if (!boundary) throw fault('drive', 'Planbook could not build the upload safely.');

  const body = '--' + boundary + '\r\n'
    + 'Content-Type: application/json; charset=UTF-8\r\n\r\n'
    + JSON.stringify(metadata) + '\r\n'
    + '--' + boundary + '\r\n'
    + 'Content-Type: application/json\r\n\r\n'
    + text + '\r\n'
    + '--' + boundary + '--';
  return { body: body, contentType: 'multipart/related; boundary=' + boundary };
}

/* Create a file. Never retried — see withOneRetry(). No `parents`, so it lands in the root of
   the teacher's own My Drive, which is what the conflict message tells her. */
async function createFile(token, name, text, appProperties) {
  const part = uploadBody({ name: name, mimeType: 'application/json', appProperties }, text);
  const res = await request(token, UPLOAD + '?uploadType=multipart&fields=id,name,appProperties', {
    method: 'POST',
    headers: { 'Content-Type': part.contentType },
    body: part.body,
  });
  return res.json();
}

/* Overwrite a file this app created, by an id that came out of findRemote() on this pass. */
async function updateFile(token, fileId, name, text, appProperties) {
  const part = uploadBody({ name: name, appProperties }, text);
  const res = await request(token,
    UPLOAD + '/' + encodeURIComponent(fileId) + '?uploadType=multipart&fields=id,name,appProperties', {
      method: 'PATCH',
      headers: { 'Content-Type': part.contentType },
      body: part.body,
    });
  return res.json();
}

/* What every upload stamps on the file. `rev` is here so that the next sync can order the file
   without downloading it, which is the deliverable in one line; `deviceLabel` is here so that a
   conflict copy can be named after the machine that wrote the copy being set aside. Strings,
   because `appProperties` values are strings at Drive whatever is sent.

   `year` SINCE WO-7.9, for the first-run list: a fresh device lists every Planbook year in Drive
   and names each by its year, and the only other place a year is written is the file NAME, which a
   teacher can rename. It is the label and nothing else — the same string the file name carries, and
   nothing from inside a document — and nothing matches on it: the pull goes by `docId`, and what it
   adopts is decided by the year inside the downloaded document. A file written before this landed
   has no `year` property until its next upload, and the list falls back to the name for it. */
function propertiesFor(docId, rev, year) {
  const props = { docId: docId, rev: String(rev), deviceLabel: thisDeviceLabel() };
  if (year) props.year = String(year);
  return props;
}

/* ────────────────────────────── the flow ────────────────────────────── */

function settle(kind, message, bad) {
  outcome = { kind: kind, message: message, bad: !!bad };
  return outcome;
}

/*
  Sync the open school year, on a tap and never on a timer.

  THERE IS NO AUTOMATIC SYNC ANYWHERE IN THIS FILE, and that is not an omission to fill in later:
  a browser token flow has no refresh token, so a sync that ran while the teacher was not looking
  would fail every time the hour was up (src/auth.js, docs/sync.md § Auth, and this phase's Traps
  line). Nothing here listens for `online`, for `visibilitychange`, or for a save.

  THE ORDER OF THE FIRST FOUR LINES IS THE WHOLE OF "WHAT GETS UPLOADED IS WHAT IS ON THIS DISK".

    · flush() first. update() only SCHEDULES a save and `rev` advances 800ms later — the scar is
      in CLAUDE.md, from WO-5.3's harness, and it is worse here than anywhere: without the flush,
      a sync a moment after a grade was typed uploads the document as it was BEFORE the grade,
      stamps the bookmark with the rev that went with it, and then the debounce fires and makes
      the local document ahead again. Nothing is lost, but the file in Drive is a version the
      teacher never saw and the panel has just told her it is up to date.
    · then read the record back out of IndexedDB, and upload THAT. Not the live object — the
      stored one. It costs one read, and what it buys is that the bytes in Drive are provably the
      bytes on this disk rather than the bytes in a variable, and that `rev` and the content
      cannot disagree: a save that failed leaves the old record on disk with the old rev, and
      this uploads the old record with the old rev, which is correct. The teacher's unsaved
      change stays unsynced and the save chip is already red about it.
    · the token after that, so that a sign-in that lapsed is found before anything is read or
      written rather than in the middle. FOUND, NOT RENEWED (WO-7.10): ensureFreshToken() asks
      Google nothing since that work order. A request from here would land two awaits after the
      tap that started this, outside its gesture — a Google window with no tap behind it, which a
      browser blocks and which then put its red line in the About panel. So no token here settles
      `signed-out`, and the sign-in is asked for by a tap in its own stack: the header's does it
      before it calls this (src/sync-button.js), About's Connect does it on its own.
    · and `syncing` on the chip only once a transfer is actually about to happen.
*/
export async function syncNow() {
  if (busy) return settle('busy', 'Planbook is already syncing this year. Give it a moment.', false);
  if (!signInAvailable()) {
    return settle('off', 'Google Drive sync is not switched on in this build of Planbook.', true);
  }
  const open = store.getDoc();
  if (!open || !open.docId) {
    return settle('no-document', 'There is no school year open to sync.', true);
  }

  busy = true;
  outcome = null;
  refreshSyncChrome();

  /* Whether the save chip was ever taken off what it was saying. The paths that stop before a
     transfer starts — no sign-in, a record that would not read back — must not leave a green
     tick flashing for a save nobody made, so the chip is only put back by the hand that moved
     it. */
  let touchedChip = false;

  try {
    await store.flush();
    const doc = await store.readStoredDocument(open.year);
    if (!doc || !doc.docId) {
      return settle('no-document', 'Planbook could not read the ' + open.year + ' school year back '
        + 'out of this device\u2019s storage, so it has not sent anything to Google Drive.', true);
    }
    if (doc.docId !== open.docId) {
      /* The record on disk is not the document on screen. It means a year switch or a restore
         landed between the flush and this read; the safe answer is to do nothing and let the
         next tap read a settled pair. */
      return settle('failed', 'The school year on screen changed while Planbook was starting the '
        + 'sync, so nothing was sent. Try again.', true);
    }

    const token = await ensureFreshToken();
    if (!token) {
      /* THE FIFTH ACCEPTANCE LINE. Not a silent no-op: the sign-in ran out, and the Connect button
         is back on screen because the `finally` below repaints src/auth.js's half of the panel on a
         `signed-out` outcome (WO-7.13). authState() computes `signedIn` from the session and the
         clock (and since WO-7.14 a 401 below ends the session, so the clock is not the only thing
         that can end a sign-in), but nothing redraws a button from either — until that repaint,
         this comment said the clock was enough,
         and a sign-in that lapsed with About open left Connect hidden under "Connected to Google
         Drive". Nothing on this device changed and nothing was sent. */
      return settle('signed-out', 'Your Google sign-in has run out, so nothing was synced. '
        + 'Nothing on this device changed. Tap Connect Google Drive above, then sync again.', true);
    }

    showSaveState('syncing');
    touchedChip = true;

    const remote = await withOneRetry(() => findRemote(token, doc.docId));
    const bookmark = await store.readSyncState(doc.docId);
    mark = bookmark;
    markFor = doc.docId;

    const localRev = Number(doc.rev) || 0;
    const baseRev = bookmark ? Number(bookmark.baseRev) : null;
    const plan = planFor(localRev, remote ? remote.rev : null, baseRev);

    if (plan === 'in-sync') {
      return settle('in-sync', 'Google Drive already has this year exactly as it is on this '
        + 'device. Nothing needed to move.', false);
    }
    if (plan === 'first-upload' || plan === 'upload') {
      return await sendUp(token, doc, remote, localRev, plan === 'first-upload');
    }
    if (plan === 'download') {
      return await bringDown(token, doc, remote);
    }
    return await keepBoth(token, doc, remote, localRev);
  } catch (e) {
    /* A 401 IS GOOGLE SAYING THE SIGN-IN IS OVER, SO src/auth.js IS TOLD BEFORE THIS SETTLES
       (WO-7.14). Until then only this outcome said so: the session stood, `signedIn` read true
       until the clock ran it out — up to an hour after a teacher revoked Planbook's access — the
       repaint in the `finally` below drew "Connected" beside a sentence saying to tap Connect, and
       the header's tap skipped the sign-in and met the same 401 again. refused() drops the session
       and nothing else: no revoke, no announcement, no write to storage, and the opt-in stands.
       ONLY THIS ARM. A `network` or `drive` fault is not a finding about the token and keeps it. */
    const expired = !!e && e.code === 'expired';
    if (expired) refused();
    return settle(expired ? 'signed-out' : 'failed', sentenceFor(e), true);
  } finally {
    busy = false;
    /* The chip goes back to what it says about local storage. `saved` rather than `error` on
       every path, including the failures — decision 3 in the header — and it fades itself out
       two seconds later, which is the only self-clearing state there is. It is honest on every
       path that reaches here: syncNow() flushes before it does anything else, so by this line
       the document on this device really is saved. */
    if (touchedChip) showSaveState('saved');
    refreshSyncChrome();
    /* AND THE SIGN-IN'S HALF, WHEN THIS SYNC IS WHAT FOUND THE SIGN-IN GONE (WO-7.13). Connect,
       Disconnect and the status line above them are src/auth.js's, painted by refreshAuthChrome()
       and by nothing else, and no paint follows a token lapsing — `signedIn` changes on the clock
       (or, since WO-7.14, on refused() in the `catch` above) and the glass does not. So a teacher
       who opened About signed in, let the hour run out with it open (an iPad resuming does not
       reload), and tapped Sync was left with no Connect, no Sync and
       "Connected to Google Drive". HERE, not in src/shell.js's tap chain, so every door that syncs
       gets it — About's button, the header's, and a harness calling this directly. Only on
       `signed-out`: no other outcome is a finding about the sign-in. It reads authState() and
       writes nothing, and with About shut it paints a hidden panel the next About-open repaints
       anyway. The import points the way decision 4 requires — this file into auth.js, never back. */
    if (outcome && outcome.kind === 'signed-out') refreshAuthChrome();
    if (outcome && outcome.message) announce(outcome.message);
  }
}

/*
  A SIGN-IN SUCCEEDED, SO AN OUTCOME THAT SAID THE SIGN-IN HAD RUN OUT IS NOW FALSE — and it is
  dropped here, at its cause, rather than hidden when the panel paints (WO-7.10).

  THE RED LINE THIS REMOVES WAS FOUND, NOT GUESSED. The harness drove the old tree against a stub
  that opens a window only inside a tap's own stack (Safari's rule): the token lapses while the app
  is open, a tap syncs, this module reaches the token two awaits late, Google's window is blocked, and
  the outcome settles `signed-out`. The next tap signs in — and the About panel then read "Connected
  to Google Drive" over this line in red, "Your Google sign-in has run out, so nothing was synced",
  because `signedIn` had turned the sync half back on and nothing had replaced the outcome it drew.
  Clearing it on paint would also hide a failure nobody had resolved; clearing it on a SIGN-IN clears
  exactly the one outcome a sign-in answers. A network failure or a Drive refusal stays standing until
  a sync replaces it, because a new token does not make either of those less true.

  Called by src/shell.js afterDriveAuthChange() after a sign-in that succeeded from About's Connect
  or (since WO-7.9) the first-run door Open from Google Drive, and by src/sync-button.js after its
  tap's sign-in succeeded — each before anything is painted.
*/
export function signedInAgain() {
  if (outcome && outcome.kind === 'signed-out') outcome = null;
  refreshSyncChrome();
}

/* Google's own words are identifiers; a teacher gets a sentence. Same split src/auth.js makes,
   and the network arm is the one that has to be exactly right — "nothing moved" is the fact a
   teacher needs before she decides whether to type it all again. */
function sentenceFor(e) {
  const code = e && e.code;
  if (code === 'network') {
    return 'Planbook could not reach Google Drive, so nothing was synced. Nothing on this device '
      + 'changed and the copy in Drive is exactly as it was. Try again when you are back online.';
  }
  if (code === 'expired') {
    return 'Your Google sign-in ran out part-way through, so the sync stopped. Nothing on this '
      + 'device changed. Tap Connect Google Drive above, then sync again.';
  }
  if (code === 'drive') return String(e.message);
  /* A throw from parseBackup(), from store.adoptRemoteDocument(), or from anywhere else that
     writes its own teacher-facing sentence. Those end in "Nothing on this device has been
     changed" already, which is why nothing is appended here. */
  return String((e && e.message) || 'The sync did not finish, so nothing was changed.');
}

/*
  Local is ahead: put this device's document in Drive.

  THE BYTES AND THE NUMBER ARE TAKEN TOGETHER, from the stored record read at the top of
  syncNow(), and the bookmark is written from the same number — so what the bookmark claims is in
  Drive is exactly what was sent, and there is no window in which the two could describe
  different revisions.

  THE BOOKMARK IS WRITTEN AFTER THE UPLOAD AND ONLY AFTER IT LANDS. A bookmark written first, or
  written in a `finally`, is a claim that Drive holds a rev it does not — and the next pass would
  read that as "nothing to do" and never send the document at all.
*/
async function sendUp(token, doc, remote, localRev, isFirst) {
  const text = JSON.stringify(doc);
  const props = propertiesFor(doc.docId, localRev, doc.year);
  const name = liveFileName(doc.year);

  if (isFirst) await createFile(token, name, text, props);
  else await withOneRetry(() => updateFile(token, remote.id, name, text, props));

  /* THE RECORD THAT WAS STORED, NOT A SECOND ONE BUILT BESIDE IT (WO-7.5). This read
     `mark = { …, at: new Date().toISOString() }` until the header began drawing the stamp: that was
     a second clock reading a few milliseconds after writeSyncState()'s own, so the time on the
     glass in this session and the time read back after a reload were two facts about one sync.
     writeSyncState() returns the record it put, and this call site and the two below hold exactly
     that. */
  mark = await store.writeSyncState(doc.docId, doc.year, localRev);
  markFor = doc.docId;

  return settle('uploaded', isFirst
    ? 'This school year is now in your Google Drive, in My Drive, as \u201C' + name + '\u201D.'
    : 'Your Google Drive copy of this school year is up to date with this device.', false);
}

/*
  Remote is ahead and this device has nothing unsynced: take the Drive copy.

  IT IS VALIDATED BEFORE IT IS ADOPTED, through the same parseBackup() a restored file goes
  through — which walks the migration ladder, refuses a document from a newer build, and refuses
  anything that is not shaped like a school year, each with a sentence already written for a
  teacher. A downloaded document is a file somebody else's browser wrote, exactly as a backup is,
  and adopting one unchecked is the one way this feature could destroy a gradebook with a
  well-formed request.

  AND THE FILE HAS TO AGREE WITH ITSELF. `appProperties.rev` is the index the comparison was made
  on and `doc.rev` is the document's own count of its saves; if they differ, one of them is
  wrong, there is nothing here that says which, and the whole ordering was computed from the one
  that might be the lie. Refusing costs a message and a second tap. Guessing costs the wrong
  document.
*/
async function bringDown(token, doc, remote) {
  const text = await withOneRetry(() => downloadRemote(token, remote.id));
  const parsed = parseBackup(text, remote.name);
  const incoming = parsed.doc;

  if (incoming.docId !== doc.docId) {
    return settle('failed', 'The file in Google Drive says it belongs to a different school year '
      + 'document than the one open here, so Planbook has not touched anything on this device.',
      true);
  }
  if (incoming.year !== doc.year) {
    return settle('failed', 'The file in Google Drive is for ' + incoming.year + ' and the year '
      + 'open here is ' + doc.year + ', so Planbook has not touched anything on this device.', true);
  }
  if ((Number(incoming.rev) || 0) !== remote.rev) {
    return settle('failed', 'The file in Google Drive does not agree with itself about which save '
      + 'it is, so Planbook has not touched anything on this device. Sync again from the device '
      + 'that wrote it.', true);
  }

  await store.adoptRemoteDocument(incoming);
  mark = await store.writeSyncState(doc.docId, doc.year, remote.rev);
  markFor = doc.docId;

  return settle('downloaded', 'This device now has the copy of ' + doc.year + ' from Google Drive, '
    + 'which was further along than the one here. Nothing you had typed on this device was lost: '
    + 'everything here had already been synced.', false);
}

/*
  BOTH SIDES CHANGED. Keep both, merge nothing, discard nothing.

  THE ORDER IS THE WHOLE OF THE GUARANTEE, and it is preserve-then-overwrite:

    1. download the remote copy — the side that is about to stop being the live one;
    2. create a NEW Drive file holding those exact bytes, under a name that says where it came
       from and when;
    3. only then overwrite the live file with this device's document;
    4. only then write the bookmark.

  A failure anywhere in 1 or 2 leaves the live file exactly as it was and this device exactly as
  it was: nothing has been overwritten yet, so an interrupted conflict is a conflict that has not
  happened. A failure at 3 leaves the conflict copy sitting in Drive with the live file still
  holding the remote's document — one spare file, nothing lost, and the next tap tries again.

  THE LOCAL DOCUMENT IS NOT TOUCHED ON THIS PATH AT ALL. The winner is the document the teacher is
  holding, which is what "keep the winner active" means, and the copy that steps aside is the one
  that was in Drive. Nothing in this function calls store.adoptRemoteDocument(), and nothing in
  it writes to the year document.

  THE CONFLICT COPY CARRIES NO `docId` PROPERTY, and that is load-bearing rather than tidy: the
  only thing findRemote() matches on is `appProperties.docId`, so a conflict copy that carried
  one would be found by every later sync and the ambiguity refusal would fire forever. It carries
  `conflictOf` instead — the same id, under a name nothing matches on — so the file is traceable
  by a human reading its properties and invisible to the query.
*/
async function keepBoth(token, doc, remote, localRev) {
  const losing = await withOneRetry(() => downloadRemote(token, remote.id));
  const day = todayLocal();
  const spare = conflictFileName(doc.year, remote.deviceLabel, day);

  await createFile(token, spare, losing, {
    conflictOf: doc.docId,
    rev: Number.isFinite(remote.rev) ? String(remote.rev) : 'unknown',
    conflictOn: day,
  });

  const live = liveFileName(doc.year);
  await withOneRetry(() => updateFile(token, remote.id, live, JSON.stringify(doc),
    propertiesFor(doc.docId, localRev, doc.year)));

  mark = await store.writeSyncState(doc.docId, doc.year, localRev);
  markFor = doc.docId;

  /* THE THIRD ACCEPTANCE LINE, and it is the only message in this app that has to do four things
     at once: say what happened, name the file, say where the file is, and say what is inside it.
     The last of those is decision 5 in the header — a conflict copy is a second copy of the most
     sensitive data this app holds, and the teacher is entitled to the same sentence the backup
     panel gives her about the file she downloads. */
  return settle('conflict', 'Both copies of ' + doc.year + ' had changed since the last sync, so '
    + 'Planbook kept both and merged nothing. The copy that was in Google Drive is now saved '
    + 'there, in My Drive, as \u201C' + spare + '\u201D. The copy on this device is the live one '
    + 'and is what Drive now holds as \u201C' + live + '\u201D. Nothing was thrown away. Open the '
    + 'conflict file from Drive if you need anything out of it \u2014 it holds everything a '
    + 'backup file holds, including the support details you keep on students.', false);
}

/* ────────────────────────────── the first-run pull (WO-7.9) ────────────────────────────── */

/*
  A FRESH DEVICE OPENS THE YEAR IT ALREADY HAS IN DRIVE — the one door in this file that looks for
  "a year" rather than for THE year. Everything above finds one file, by the `docId` of the document
  open here; on a fresh device that document is the empty one boot() just made, with a `docId` Drive
  has never seen, so every search above finds nothing and a Sync uploads the empty year as a second
  file. These two functions are the way round it, and they are offered on exactly one kind of
  device: one whose only document is untouched (store.untouchedYear()). Pulling onto a device that
  holds work is out of scope by name — its own year would have to be kept, merged or replaced, which
  is the question the keep-both design exists to refuse.

  THE BOOKMARK IS THE WHOLE DIFFERENCE BETWEEN THIS AND A RESTORE. A restore of a backup taken on the
  other device puts the same document here with no bookmark, so its first sync is `no bookmark +
  remote exists → conflict` and Drive gains a spare file, once (docs/sync.md, and the owner's ruling 1
  on WO-7.9 leaves that alone). A pull knows what a restore cannot: the file it just read IS the live
  file for that `docId`, at that `rev`. So it adopts the document with the remote's own `rev` and
  writes the bookmark at that `rev` in the same step, and the next sync reads `remote == base ==
  local` — in-sync, nothing sent.
*/

/*
  The year a listed file is for, as a label on a row and never as a key. `appProperties.year` when an
  upload stamped one (propertiesFor(), since WO-7.9); otherwise read out of the name this module gave
  the file, "Planbook 2026-2027.json"; otherwise the name as it stands. A name is something a teacher
  can rename, which is exactly why it is only the fallback and why nothing is decided by it — the
  pull matches on `docId`, and whether it replaces the empty year or opens beside it is decided by the
  year written INSIDE the downloaded document.
*/
function listedYearOf(f) {
  const props = f.appProperties || {};
  if (typeof props.year === 'string' && /^\d{4}-\d{4}$/.test(props.year)) return props.year;
  const m = /Planbook (\d{4}-\d{4})/.exec(String(f.name || ''));
  return m ? m[1] : String(f.name || 'A Planbook year');
}

/*
  EVERY LIVE PLANBOOK YEAR THIS ACCOUNT'S DRIVE HOLDS, from Drive's metadata alone.

  `drive.file` means the answer can only contain files this app created, so there is no folder to
  pick and nothing of the teacher's own to see. What counts as a live year is decided HERE, on each
  file, and not only in the query — the same "Drive said so" versus "this code checked" line
  findRemote() draws: `appProperties.docId` present, `conflictOf` absent, not trashed. Conflict copies
  are left out on purpose — they are for a teacher to open by hand, not for the app to choose between
  — and they are already invisible to findRemote() for the same reason (keepBoth() gives them no
  `docId`).

  NOTHING IS DOWNLOADED TO BUILD THE LIST, which is the trap it was written against: each row is a
  year, the device that last wrote it and when, all three read off the file's properties and Drive's
  own `modifiedTime`. No class name, no student, nothing from inside a document — so the list is safe
  on a projector without a presentation-mode branch, and it costs one request however many years
  there are.

  It reads and it writes nothing: no bookmark, no outcome, no chip. A list that failed says so in its
  own sentence to the dialog that asked, which is where the teacher is looking.
*/
export async function listDriveYears() {
  if (!signInAvailable()) {
    return { ok: false, rows: [], message: 'Google Drive sync is not switched on in this build of '
      + 'Planbook.' };
  }
  const token = await ensureFreshToken();
  if (!token) {
    return { ok: false, signedOut: true, rows: [], message: 'Your Google sign-in has run out, so '
      + 'Planbook could not look in your Drive. Nothing on this device changed. Sign in again to see '
      + 'your years.' };
  }
  try {
    const q = "trashed = false and mimeType = 'application/json'";
    const rows = [];
    let pageToken = '';
    /* Bounded, because a loop that follows a server's "there is more" has to stop somewhere. Ten
       pages of a hundred is a thousand files this app made, which no teacher's Drive holds. */
    for (let page = 0; page < 10; page++) {
      const url = API + '?spaces=drive&pageSize=100'
        + '&fields=' + encodeURIComponent('nextPageToken,files(id,name,appProperties,modifiedTime,trashed)')
        + '&q=' + encodeURIComponent(q)
        + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
      const res = await withOneRetry(() => request(token, url, { method: 'GET' }));
      const body = await res.json();
      (body.files || []).forEach((f) => {
        const props = f && f.appProperties;
        if (!props || typeof props.docId !== 'string' || !props.docId) return;
        if (props.conflictOf !== undefined) return;
        if (f.trashed === true) return;
        rows.push({
          docId: props.docId,
          year: listedYearOf(f),
          deviceLabel: props.deviceLabel || 'another device',
          modifiedTime: typeof f.modifiedTime === 'string' ? f.modifiedTime : '',
        });
      });
      pageToken = body.nextPageToken || '';
      if (!pageToken) break;
    }
    /* Newest year first, and within one year the most recently written first — the year picker's
       order, for its reason: the year in progress is the one that wants to be under her thumb. */
    rows.sort((a, b) => (a.year < b.year ? 1 : a.year > b.year ? -1
      : (a.modifiedTime < b.modifiedTime ? 1 : a.modifiedTime > b.modifiedTime ? -1 : 0)));
    return { ok: true, rows: rows, message: '' };
  } catch (e) {
    const expired = !!e && e.code === 'expired';
    if (expired) refused();
    return { ok: false, signedOut: expired, rows: [], message: expired
      ? 'Google would not accept the sign-in Planbook was using, so it could not look in your Drive. '
        + 'Nothing on this device changed. Sign in again to see your years.'
      : pullSentenceFor(e) };
  }
}

/* A pull's failures in a pull's words. The sync sentences above say "nothing was synced" and point
   at Connect above them; a teacher at the first-run dialog did neither thing and is not in About. */
function pullSentenceFor(e) {
  const code = e && e.code;
  if (code === 'network') {
    return 'Planbook could not reach Google Drive, so nothing was opened. Nothing on this device '
      + 'changed. Try again when you are back online.';
  }
  if (code === 'drive') return String(e.message);
  return String((e && e.message) || 'Planbook could not open that year, so nothing was changed.');
}

/*
  OPEN ONE OF THOSE YEARS ON THIS DEVICE — by `docId`, never by name.

  THE ORDER IS THE SAFETY, and it is bringDown()'s order with two checks added at the ends:

    1. the device is proved untouched (store.untouchedYear()) before anything is fetched — the door
       is only drawn on such a device, and the proof is taken again rather than trusted from the
       paint, which can be minutes old;
    2. the live file for that `docId` is found again, by findRemote() — the row the teacher tapped is
       a moment old, and findRemote() is the one place that refuses two files claiming one id;
    3. its bytes are read and validated by parseBackup(), exactly as a download already is — the
       migration ladder, the newer-build refusal and the shape check, each with a teacher's sentence
       that ends "Nothing on this device has been changed.";
    4. the file has to agree with itself: the document inside carries the `docId` it was listed
       under, and its own `rev` is the `rev` on the file;
    5. the device is proved untouched AGAIN, now that the network has had its turn — a teacher who
       added a class while the list was open has a device this door no longer applies to;
    6. only then is it adopted, with the proof handed to store.adoptRemoteDocument() as its guard,
       which checks it once more after its own flush, at the last moment before the write;
    7. and the bookmark is written at the remote's `rev` in the same step — after the adoption and
       only after it, for sendUp()'s reason: a bookmark ahead of what is on disk is a claim nothing
       backs. If that one write fails, the year is here with no bookmark and its first sync keeps
       both copies, which is the safe direction and costs one spare file.

  REPLACE OR BESIDE is decided by the year inside the document: the same year as the empty one here,
  and it takes that one's place (the empty year had nothing in it, which is the only reason it may
  be replaced); a different year, and it opens beside it and the empty year stays on the device,
  untouched, to be switched to or ignored.

  IT DOES NOT SETTLE AN OUTCOME ON A FAILURE, and that is decision 3's argument one step on: the
  sentence goes back to the dialog that asked, which is where the teacher tapped. A refused pull left
  this device exactly as it was, and painting the header's "the last sync did not finish" over it
  would report a sync nobody started. On success the outcome is cleared, because whatever it said was
  about the document that has just been put away.
*/
export async function pullYear(docId) {
  if (busy) return { kind: 'busy', message: 'Planbook is already talking to Google Drive. Give it a '
    + 'moment.', bad: true };
  if (!signInAvailable()) {
    return { kind: 'off', message: 'Google Drive sync is not switched on in this build of Planbook.',
      bad: true };
  }
  if (typeof docId !== 'string' || !docId) {
    return { kind: 'failed', message: 'Planbook could not tell which year that was, so nothing was '
      + 'opened. Nothing on this device has been changed.', bad: true };
  }

  busy = true;
  refreshSyncChrome();
  let result = null;
  try {
    const before = await store.untouchedYear();
    if (!before) {
      result = { kind: 'refused', bad: true, message: 'This device already has something in it, so '
        + 'Planbook will not open a year from Google Drive over it. Nothing on this device has been '
        + 'changed.' };
      return result;
    }

    const token = await ensureFreshToken();
    if (!token) {
      result = { kind: 'signed-out', bad: true, message: 'Your Google sign-in has run out, so '
        + 'nothing was opened. Nothing on this device changed. Sign in again, then pick the year.' };
      return result;
    }

    const remote = await withOneRetry(() => findRemote(token, docId));
    if (!remote) {
      result = { kind: 'failed', bad: true, message: 'That year is no longer in your Google Drive — '
        + 'it may have been moved to the bin — so nothing was opened. Nothing on this device has been '
        + 'changed.' };
      return result;
    }

    const text = await withOneRetry(() => downloadRemote(token, remote.id));
    const incoming = parseBackup(text, remote.name).doc;

    if (incoming.docId !== docId) {
      result = { kind: 'failed', bad: true, message: 'The file in Google Drive says it belongs to a '
        + 'different school year document than the one listed, so Planbook has not touched anything '
        + 'on this device.' };
      return result;
    }
    if (!Number.isFinite(remote.rev) || (Number(incoming.rev) || 0) !== remote.rev) {
      result = { kind: 'failed', bad: true, message: 'The file in Google Drive does not agree with '
        + 'itself about which save it is, so Planbook has not touched anything on this device. Sync '
        + 'again from the device that wrote it, then try this again.' };
      return result;
    }
    const replaces = incoming.year === before.year;
    if (replaces && remote.rev <= 1) {
      /* A Drive file at rev 1 is a year that was synced before anything was put in it — exactly the
         empty year this device already has. Adopting it would change nothing a teacher could see,
         and store.adoptRemoteDocument() would refuse it anyway as moving the year backwards, in a
         sentence about saves that would mean nothing to her. */
      result = { kind: 'failed', bad: true, message: 'The ' + incoming.year + ' in Google Drive is an '
        + 'empty year that was synced before anything was put in it, so there is nothing in it to '
        + 'open. Nothing on this device has been changed.' };
      return result;
    }

    const again = await store.untouchedYear();
    if (!again || again.docId !== before.docId) {
      result = { kind: 'refused', bad: true, message: 'Something was added on this device while '
        + 'Planbook was fetching the year, so it has not opened it over what is here. Nothing on this '
        + 'device has been changed.' };
      return result;
    }

    await store.adoptRemoteDocument(incoming, { docId: before.docId, rev: 1 });
    mark = await store.writeSyncState(incoming.docId, incoming.year, remote.rev);
    markFor = incoming.docId;
    outcome = null;

    result = { kind: 'pulled', bad: false, year: incoming.year, replaced: replaces,
      message: replaces
        ? 'This device now has ' + incoming.year + ' from Google Drive, in place of the empty year '
          + 'that was here.'
        : 'This device now has ' + incoming.year + ' from Google Drive, open beside the empty '
          + before.year + ', which is still here.' };
    return result;
  } catch (e) {
    const expired = !!e && e.code === 'expired';
    if (expired) refused();
    result = { kind: expired ? 'signed-out' : 'failed', bad: true, message: expired
      ? 'Google would not accept the sign-in Planbook was using, so nothing was opened. Nothing on '
        + 'this device changed. Sign in again, then pick the year.'
      : pullSentenceFor(e) };
    return result;
  } finally {
    busy = false;
    refreshSyncChrome();
    if (result && result.message) announce(result.message);
  }
}

/* ────────────────────────────── the panel ────────────────────────────── */

/*
  Everything a screen needs, and NOT THE TOKEN and NOT THE DOCUMENT — the shape src/auth.js's
  authState() takes, for its reason: a state object handed to a renderer or a future debug dump
  cannot leak what it never carried. What is here is four booleans, two ids, two numbers and a
  sentence, and the sentence is one this file wrote for a teacher rather than anything Google or
  a document said.
*/
export function syncState() {
  const doc = store.getDoc();
  const known = !!doc && markFor === doc.docId;
  return {
    available: signInAvailable(),
    signedIn: authState().signedIn,
    busy: busy,
    outcome: outcome ? outcome.kind : '',
    message: outcome ? outcome.message : '',
    /* Whether the last outcome was a failure, which is the panel's red box and — since WO-7.5 — the
       header button's "the last sync did not finish". Carried rather than re-derived from `outcome`
       so the two surfaces cannot disagree about which kinds count as failures. */
    bad: outcome ? outcome.bad : false,
    year: doc ? doc.year : '',
    docId: doc ? doc.docId : '',
    localRev: doc ? (Number(doc.rev) || 0) : 0,
    /* Null and not 0 when this device has never synced this document, and null again while the
       bookmark has not been read: "no bookmark" and "a bookmark saying zero" are different facts
       and the comparison above treats them as different. `bookmarkRead` is what tells them
       apart. */
    baseRev: known && mark ? (Number(mark.baseRev) || 0) : null,
    lastSyncedAt: known && mark ? mark.at : '',
    bookmarkRead: known,
  };
}

/*
  HOW FRESH THIS DEVICE'S SYNC IS, as one word — the header button's question (WO-7.5), answered
  HERE rather than in the header's own module, because this is the file that owns the bookmark and
  the comparison. src/sync-button.js combines the answer with the sign-in and the last outcome to
  pick one of its six states, and it asks this function rather than holding a second opinion about
  what "up to date" means.

    'unknown'  the bookmark for the open document has not been read yet. A third state from "read,
               and there is none", for syncState()'s reason — saying "not synced" for one frame and
               correcting it would put a false sentence on the glass.
    'ahead'    the document on this device has saves the bookmark does not — including a document
               this device has never synced at all, whose every save is in that position. It says
               CHANGES and never how many: `rev − baseRev` counts saves, and one save can carry a
               whole column of scores, so a number would be read as grades and would not be
               (WO-7.5's Traps).
    'stale'    nothing is ahead, but the last sync was on an EARLIER CALENDAR DAY than today — the
               owner's ruling 4. A day, not a number of hours: the other device is picked up the
               next morning, which is when a stale reading matters, and a fixed number of hours
               would turn amber in the middle of a teaching day for no reason. localDayOf() on both
               sides, never a 24-hour subtraction.
    'current'  synced today, and nothing since.

  `now` is a parameter for the reason it is anywhere: a caller can ask about a moment. The app
  passes nothing and gets the clock.
*/
export function freshnessOf(state, now) {
  if (!state || !state.bookmarkRead) return 'unknown';
  if (state.baseRev === null || state.localRev !== state.baseRev) return 'ahead';
  if (!state.lastSyncedAt) return 'ahead';
  const at = new Date(state.lastSyncedAt);
  if (Number.isNaN(at.getTime())) return 'ahead';
  return localDayOf(at) < localDayOf(now || new Date()) ? 'stale' : 'current';
}

/*
  Paint the sync half of the About modal's Drive section.

  It draws NOTHING when the flag is shut or nobody is signed in, rather than an explanation:
  src/auth.js's status line directly above already says "Not connected", and a second line
  underneath saying the same thing in different words is the panel disagreeing with itself.

  THE LAST-SYNCED LINE IS A DATE AND A CLOCK TIME, never "3 minutes ago", for the reason the
  expiry above it is a clock time: a relative number is wrong a minute later, and a stale figure
  in the one place reporting on where a gradebook has been sent is the shape of failure this
  whole panel exists to avoid.
*/
export function refreshSyncChrome() {
  const btn = document.getElementById(SYNC_BTN_ID);
  const line = document.getElementById(SYNC_STATUS_ID);
  if (!btn && !line) return;

  const state = syncState();
  const on = state.available && state.signedIn;

  if (btn) {
    btn.classList.toggle('hidden', !on);
    btn.disabled = state.busy;
  }
  if (!line) return;

  if (!on) {
    line.className = 'class-hint';
    line.textContent = '';
    return;
  }
  /* `.class-error` is the panel grammar's red box and `.class-hint` its quiet note — swapped
     rather than layered, exactly as the sign-in line above does it. */
  line.className = outcome && outcome.bad ? 'class-error' : 'class-hint';

  if (state.busy) {
    line.textContent = 'Syncing this school year with Google Drive\u2026';
    return;
  }
  if (outcome) {
    /* AND WHEN THE OUTCOME IS A BAD ONE, WHEN IT LAST WORKED IS APPENDED TO IT. That is the fact a
       teacher actually needs after being told a sync did not happen: "could not reach Drive" is
       only half an answer, and the other half is whether the copy over there is from this morning
       or from last month. It is appended only to the failures — after a sync that worked, the
       stamp is now and saying so twice is a panel repeating itself. */
    const good = mark && markFor === state.docId && mark.at;
    if (outcome.bad && good) {
      const last = new Date(mark.at);
      line.textContent = outcome.message + ' The last sync that worked was on '
        + last.toLocaleDateString() + ' at '
        + last.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.';
      return;
    }
    line.textContent = outcome.message;
    return;
  }
  if (!state.bookmarkRead) {
    /* The bookmark is a read out of IndexedDB and this function is synchronous, so for one frame
       after the modal opens there is nothing true to say. BLANK IS WHAT GOES THERE. Saying "not
       synced yet" and correcting it a moment later would put a false sentence about where a
       gradebook has been on the screen, which is worse than an empty line — and the fill-in is
       primeSyncChrome() below, which is why the flicker is one line arriving rather than a panel
       rearranging itself. */
    line.textContent = '';
    return;
  }
  if (!state.lastSyncedAt) {
    line.textContent = 'This school year has not been synced from this device yet.';
    return;
  }
  const when = new Date(state.lastSyncedAt);
  line.textContent = 'This school year last synced on ' + when.toLocaleDateString()
    + ' at ' + when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.';
}

/*
  Read the bookmark for the open document and repaint. Called on the path that opens the About
  modal, beside the sign-in's own paint, and deliberately NOT awaited by it: a modal that waits
  on IndexedDB before appearing is a modal that hangs on a slow device, and the line this fills
  in is a footnote rather than the panel's subject. It is safe to call repeatedly — the read
  happens once per document and every later call repaints from what is already held.
*/
export function primeSyncChrome() {
  const doc = store.getDoc();
  if (!doc || !doc.docId) { refreshSyncChrome(); return Promise.resolve(); }
  if (markFor === doc.docId) { refreshSyncChrome(); return Promise.resolve(); }

  return store.readSyncState(doc.docId).then((found) => {
    /* THE DOCUMENT IT ASKED ABOUT MAY BE GONE BY NOW (WO-7.9). A first-run pull signs in — which
       starts this read for the empty year — and then replaces that year and writes the new one's
       bookmark itself; an answer about the document that was put away must not land on top of it.
       Whatever replaced it holds its own bookmark or reads it on the next call. */
    const open = store.getDoc();
    if (!open || open.docId !== doc.docId) { refreshSyncChrome(); return; }
    mark = found;
    markFor = doc.docId;
    refreshSyncChrome();
  }, () => {
    /* A read that failed leaves `markFor` empty on purpose, so the line stays blank rather than
       claiming this year has never been synced. An unanswered question is not a No. */
    mark = null;
    markFor = '';
    refreshSyncChrome();
  });
}
