/*
  Backup and restore — the file the teacher holds, and the way back in from it.

  WHY THIS IS THE GATE. Everything Planbook knows lives in one browser's IndexedDB. iOS evicts
  that after about a week of not opening the app, unless the app was added to the home screen
  (CLAUDE.md); a wiped browser, a re-imaged laptop, or a tablet that will not turn on takes it
  with no warning at all. Drive sync is not a backup either — it holds one live copy that the
  next sync overwrites (docs/sync.md). A file on the teacher's own disk is the only recovery
  path that survives all of that, which is why no feature that writes student data ships before
  this one does.

  THE FILE CONTAINS EVERYTHING, ON PURPOSE. Since WO-1.8 the year document carries IEP and 504
  accommodations, a case manager, a review date, medical needs, and behavior plans on every
  student who has any — `students[].supports`, src/supports.js — and the backup carries them too,
  today rather than eventually: this file is the one place that data is written out. A backup
  that filtered them out would restore a gradebook that had quietly lost the things a teacher is
  legally obliged to implement — that is not a recovery path, it is a trap. CLAUDE.md's rule
  that no export emits accommodation data governs merge fields, print surfaces and outreach:
  the places where the data reaches somebody else. This file goes to the teacher and nowhere
  else. What the rule costs here is honesty about it, and that is a deliverable rather than a
  courtesy: the copy in index.html says in plain words what is in the file and how to treat it.

  BUILD, VALIDATE, THEN SWAP. A restore is the most destructive thing this app can do. Nothing
  here writes anything until a file has been parsed, walked up the migration ladder, and checked
  against the shape newYearDocument() produces — and the write itself is one IndexedDB
  transaction that either lands whole or throws (src/store.js). Every refusal below says what
  was wrong with the file and ends by saying that nothing on this device was changed, because
  the second half is the part a teacher standing over a broken gradebook needs to hear.

  This module is shaped like src/year-picker.js: a shell feature in its own file, driven by the
  data-* hooks shell.js routes to it, rendering with createElement rather than innerHTML, and
  reporting into its own dialog rather than onto the save chip. The chip means "did a save
  land"; a file that would not parse is not a save.
*/

import {
  getDoc, flush, listYears, newYearDocument, migrateDocument, normalizeYear,
  readStoredDocument, restoreDocument, SCHEMA_VERSION,
} from './store.js';
import { openModal, closeModal } from './modal.js';
/* One import for one function, and it is the only thing this module takes from a screen: what
   counts as a recorded meeting is src/attendance.js's answer and has been since WO-2.1, so the
   restore confirm asks it rather than testing `exception` for itself. A copy of that test here
   could agree with itself and disagree with the ledger, in the dialog that decides whether a term
   survives. See ledgerCountsIn()'s header for why it takes a document. */
import { ledgerCountsIn } from './attendance.js';
import { zipStored } from './zip.js';
import { announce } from './live-region.js';
import { getPref, setPref } from './prefs.js';
import { refreshYearButton } from './year-picker.js';

const PANEL_ID = 'backupModal';
const CONFIRM_ID = 'restoreConfirmModal';
const LOSS_ID = 'restoreConfirmLoss';
const NAG_ID = 'backupNag';
const STATUS_ID = 'backupStatus';
const LAST_ID = 'backupLast';
const OTHER_YEARS_ID = 'backupOtherYears';
const DROP_ID = 'backupDrop';
const FILE_ID = 'backupFile';
const DOWNLOAD_ID = 'backupDownloadBtn';
const DOWNLOAD_ALL_ID = 'backupDownloadAllBtn';
const ALL_NOTE_ID = 'backupAllNote';

/* Seven days, the number the work order names, and it is the same seven as the iOS eviction
   window rather than a coincidence — a backup older than the window that erases the browser is
   a backup that can already be behind what was lost. */
const NAG_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/* A whole year is 3-6 MB (docs/data-model.md). This is not a size limit on Planbook's own
   files, it is a guard against reading a 2 GB video into a string because it landed on the drop
   target by accident, which on an iPad reads as the app freezing. */
const MAX_FILE_BYTES = 64 * 1024 * 1024;

/* True while downloadAllBackups() is building the archive. Two runs at once would hand the
   browser two copies of it and stamp each year twice; the button is disabled for the duration,
   and this is the half of that which does not depend on a button existing. */
let runningAll = false;

/* The file that has been parsed and validated and is waiting for the teacher to say yes.
   Nothing else in this module writes, so a stale value here can do nothing on its own: only
   confirmRestore() reads it, and only the button inside the confirm dialog calls that. */
let pending = null;

/* ────────────────────────────── the panel's own reporting ────────────────────────────── */

/* Store messages are written for the teacher already, but carry a `store:` prefix meant for the
   console. It comes off on the way to the screen — same as year-picker.js. */
function readable(e) {
  return String(e && e.message ? e.message : e).replace(/^store:\s*/, '');
}

/* One status line, two tones. Also spoken: it appears in the middle of a dialog a screen-reader
   user has no reason to move to, and there is exactly one aria-live region in this app. */
function showStatus(message, tone) {
  const el = document.getElementById(STATUS_ID);
  if (!el) return;
  el.textContent = message || '';
  el.className = 'backup-status' + (message ? ' ' + (tone || 'error') : ' hidden');
  if (message) announce(message);
}

/* ────────────────────────────── describing a document ────────────────────────────── */

function count(list) { return Array.isArray(list) ? list.length : 0; }

/* SCORE CELLS, WHICH IS NOT count(doc.scores). `scores` is an object keyed by assignment and then
   by student (docs/data-model.md), so the list counter above answers 0 for a full gradebook —
   which on this panel would be a term of marks reported as nothing at stake, the exact defect
   WO-1.15 exists to remove. src/classes.js's deletionCounts() counts the same thing the same way
   for the class-delete confirm: a key that is not there means ungraded and is not a score. */
function countScores(scores) {
  if (!scores || typeof scores !== 'object' || Array.isArray(scores)) return 0;
  return Object.keys(scores).reduce((n, id) => {
    const column = scores[id];
    return n + (column && typeof column === 'object' && !Array.isArray(column)
      ? Object.keys(column).length : 0);
  }, 0);
}

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

/* "a, b and c" — the join the delete confirms use in prose, in one place because the loss sentence
   below is the first thing here to need a list a teacher reads as a sentence. */
function andList(parts) {
  if (parts.length < 2) return parts.join('');
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
}

/* A date a teacher can compare against her own memory of the week. toLocaleString rather than
   the ISO string: "4 Aug 2026, 1:12 PM" answers "is this the file I made on Friday?" and
   "2026-08-04T17:12:03.918Z" does not. */
function whenSaved(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 'an unknown date';
  try {
    return new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return new Date(t).toLocaleString();
  }
}

/*
  The facts the confirm dialog names, from a document that may never have been opened.

  IT COUNTS THE RECORD AND NOT ONLY THE ROSTER, since WO-1.15, and the four record numbers are the
  whole of that work order. Until then this returned six things — year, classes, students, saved,
  rev, schemaVersion — so two documents with the same five classes and the same twenty-five students
  drew an identical panel whether one held a term of marks and scores and the other held none. That
  is exactly the pair of documents `plans/work-orders/gates.md` § "The iPad stays in the rotation"
  exists to keep apart: restore is a wholesale replace (src/store.js restoreDocument()), so a backup
  taken off the test iPad and opened on the teaching laptop replaced the real ledger with test data,
  silently, and reported success — under a panel a careful teacher could read and learn nothing from.

  MEETINGS, MARKS, ASSIGNMENTS AND SCORES, and that list is exhaustive on purpose. It is the four
  things a teacher typed, and the panel is a screen she may be projecting: `supports` is in the file
  (see this module's header) and is deliberately not counted here, because "3 students with plans" on
  a projector is a disclosure to thirty students and a number is enough to make it. Days that did not
  meet are counted by ledgerCountsIn() and not shown either — a dropped class is not a meeting and
  nothing was recorded in it.
*/
function describe(doc) {
  const ledger = ledgerCountsIn(doc);
  return {
    year: doc.year,
    classes: count(doc.classes),
    students: count(doc.students),
    meetings: ledger.meetings,
    marks: ledger.marks,
    assignments: count(doc.assignments),
    scores: countScores(doc.scores),
    saved: whenSaved(doc.updatedAt),
    rev: Number(doc.rev) || 0,
    schemaVersion: doc.schemaVersion,
  };
}

/*
  WHAT REPLACING ONE DOCUMENT WITH ANOTHER WOULD COST, in the four numbers above — the excess the
  stored side holds over the file, category by category, and nothing else.

  IT IS AN EXCESS RATHER THAN A DIFFERENCE, which is the whole of WO-1.15's Traps line. Restoring a
  year from its own backup is what backups are FOR, and a file that holds as much as the device does
  — or more, which is every restore after an eviction — produces an empty list here and no warning
  at all. A warning on the safe case is a warning a teacher learns to tap through, and she will be
  tapping through it on the unsafe one.

  NO THRESHOLD, and that is a decision rather than an omission: any excess is real work that exists
  on this device and in no file, so the honest sentence names it and lets her judge. The alternative
  is a number in here deciding for her how many of her own marks are worth mentioning.
*/
function wouldBeLost(stored, file) {
  if (!stored || !file) return [];
  const gaps = [];
  const gap = (key, one, many) => {
    if (stored[key] > file[key]) gaps.push(plural(stored[key] - file[key], one, many));
  };
  gap('meetings', 'recorded meeting', 'recorded meetings');
  gap('marks', 'attendance mark', 'attendance marks');
  gap('assignments', 'assignment', 'assignments');
  gap('scores', 'score', 'scores');
  return gaps;
}

/* ────────────────────────────── the backup file ────────────────────────────── */

function dateStamp(now) {
  const pad = (n) => String(n).padStart(2, '0');
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}

/*
  The file, as text, with the name it will be saved under. Split out from the download so the
  part with no DOM in it can be driven from tools/verify-shell.mjs without a real download
  landing in somebody's Downloads folder.

  Pending edits are flushed first. Without that the file is whatever was on disk 800ms ago, and
  the one time it matters is the one time a teacher downloads a backup: right after entering a
  column of grades.

  Pretty-printed, and that is worth the ~25% it costs. A backup is the artifact a teacher opens
  when everything else has gone wrong — sometimes in a text editor, to prove her students are
  still in there — and one 4 MB line proves nothing to anybody. The same reasoning is already in
  store.js's newId(): the ids in this file are read by a human exactly once, here.

  The name carries the year and the date because a Downloads folder holds a dozen of these by
  June and "which one is October's" is the only question ever asked of it.
*/
export async function buildBackup() {
  await flush();
  const doc = getDoc();
  if (!doc) {
    throw new Error('There is no school year open, so there is nothing to back up yet.');
  }
  return fileFor(doc);
}

/* The name and the text, from a document already in hand. Split out of buildBackup() at WO-1.11,
   which writes out every year on the device: every year after the first is a year this browser
   does not have open, so the part that turns a document into a file cannot be the part that
   decides which document that is.

   It is also what names the entries INSIDE the archive downloadAllBackups() builds, deliberately
   and not incidentally — a teacher who unzips it gets exactly the files she would have got by
   tapping the one-year button once per year, same name and same bytes. */
function fileFor(doc) {
  return {
    year: doc.year,
    name: 'Planbook ' + doc.year + ' backup ' + dateStamp(new Date()) + '.json',
    text: JSON.stringify(doc, null, 2),
  };
}

/* The archive's own name. Same "Planbook … backup <date>" family as the per-year files, so the
   whole set sorts together in a Files listing and reads as one thing; "all years" rather than a
   count, because the count is on the button and a name is a thing she reads next June. */
function zipNameFor() {
  return 'Planbook all years backup ' + dateStamp(new Date()) + '.zip';
}

/* ────────────────────────── when each year was last written out ──────────────────────────

   One timestamp per year, in one preference (see PREF_DEFAULTS.lastBackupAt for why it is not
   one number for the browser). Read through here rather than directly, because a device that
   ran the build before 2026-08-04 has a bare number in that key: an unrecognised shape reads as
   "nothing has been backed up", which costs one redundant download and never the reverse. */
function backupTimes() {
  const raw = getPref('lastBackupAt');
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function lastBackupFor(year) {
  return Number(backupTimes()[year]) || 0;
}

function recordBackupFor(year) {
  const times = backupTimes();
  times[year] = Date.now();
  setPref('lastBackupAt', times);
}

/* Years on this device that have never been downloaded from this browser. Year *labels* only —
   listYears() reads keys with getAllKeys and opens no documents, so asking this question costs
   nothing and, more to the point, cannot be answered with "and it has 3 students in it": that
   would need the document, and the panel has no business loading three other years of rosters
   to render a sentence.

   The list is passed in rather than read here as of WO-1.11: the panel asks two questions of the
   same list — which years have never been written out, and whether there is more than one year at
   all — and two reads of the store to answer one question about one list is how two answers on
   one screen drift apart. */
function yearsNeverBackedUp(years) {
  const times = backupTimes();
  return years.filter((y) => !times[y]);
}

/*
  Hand the file to the browser. An <a download> over a blob URL rather than anything cleverer:
  it is the one mechanism that works in an installed PWA on iPadOS, where it lands in the Files
  app the teacher chooses, and on a laptop, where it lands in Downloads.

  The object URL is revoked on the next turn rather than immediately — Safari has historically
  cancelled the download if the URL is revoked in the same task as the click.

  Its own function since WO-1.11, and it is deliberately the ONLY one: the control that writes
  out every year hands over its archive through exactly the mechanism the one-year button was
  proven with on the teacher's own iPad. That is why it takes a ready-made `blob` as an
  alternative to `text` rather than growing a second copy of these six lines for the zip — the
  bytes and the media type differ, and nothing else about handing a file to iOS may.

  EXPORTED AT WO-2.6, and that is the same decision made a second time rather than a new one. The
  attendance CSV is the third file this app hands over, it goes out on the same iPad, and it would
  otherwise be six lines copied into src/attendance-report.js — where the revoke delay and the
  one-download-per-tap rule would be six lines nobody had paid for yet. This file still decides HOW
  a file reaches the browser; it does not decide what is in one it did not build. Note the rule that
  travels with it: an installed home-screen PWA gets structurally ONE download event per tap, so a
  caller that wants to hand over two files wants an archive, not a loop.
*/
export function handToBrowser(file) {
  const url = URL.createObjectURL(
    file.blob || new Blob([file.text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function downloadBackup() {
  let file;
  try {
    file = await buildBackup();
  } catch (e) {
    showStatus(readable(e), 'error');
    return false;
  }

  handToBrowser(file);

  /* Recorded as "she was offered the file", against the year that is actually in it — never the
     year on screen. For this button the two are the same thing; for downloadAllBackups() below
     they stopped being one, which is why the stamp was written this way before there was anything
     that needed it. A page is never told whether the save dialog was confirmed, and the
     alternative — never clearing the nag — is a strip that is permanent and therefore invisible
     by October. See PREF_DEFAULTS.lastBackupAt. */
  recordBackupFor(file.year);
  refreshLastBackupLine();
  refreshBackupNag();
  showStatus('Saved ' + file.name + '. Keep it somewhere only you can reach — it holds '
    + 'everything, including the support details on your roster.', 'ok');
  return true;
}

/* ───────────────────────── every year on the device, in one tap ─────────────────────────
 *
 * WO-1.11. The one-file button above backs up the year that is OPEN, because the open document is
 * what getDoc() returns. That is right for one year and wrong at a rollover: a teacher holding
 * 2026-2027 for reporting she has not finished while she teaches 2027-2028 takes a backup, sees
 * the date move, and reasonably reads it as "Planbook is backed up" with one of her two years on
 * disk. The per-year timestamp and the line that names an un-downloaded year closed the silent
 * half of that on 2026-08-04; this is the convenience, and the convenience is what makes it
 * actually get done.
 *
 * ONE ZIP HOLDING ONE JSON PER YEAR, and the route to that shape is worth writing down because it
 * looks like the thing the work order told this work order not to do.
 *
 * The work order named two shapes — one file per year in sequence, or one artifact holding an
 * array of year documents — and said to try the sequential one first, because restore then does
 * not change at all. That is what shipped on 2026-08-05. **The iPad refused it**, and not by
 * degrees: on the installed home-screen PWA a download opens the native "Open in…" sheet, which
 * is a full context switch away from the page, and returning from it does not resume the JS that
 * was in flight. The loop's second hand-off never happened and neither did the status line after
 * it. One file, no message, and a nag still up for the year that never arrived — which is at
 * least the failure the Traps line asked for, since nothing was stamped that was not written. No
 * delay fixes it: the page goes away at the first hand-off, not when a timer expires. One tap in
 * an installed PWA gets ONE download event, structurally.
 *
 * So the N files go inside one download event. src/zip.js writes the archive out of raw bytes —
 * no library, no build step — with one STORED entry per year, named exactly what the one-year
 * button would have named it. What that buys is the property the original decision was protecting:
 * RESTORE STILL DOES NOT CHANGE. It has never seen a zip and still does not; the teacher taps the
 * archive in Files, iOS unpacks it, and what she is left with is loose .json files that
 * parseBackup() has read since WO-1.5. The confirm still names one outgoing year and one incoming
 * year, and the unit of recovery is still the year (docs/data-model.md). The array-of-year-
 * documents artifact — the shape that would have taught the most destructive path in the app a
 * second top-level shape — was NOT built, and is still the thing that would want its own
 * acceptance lines.
 *
 * The one-year button above is untouched by all of this. It is hardware-proven, it is the fast
 * path for the common case, and it stays exactly one download of exactly one file.
 */

/* The document to write for one year, or the reason there will not be a file for it.
 *
 * THE OPEN YEAR COMES FROM MEMORY, and that is not a shortcut. flush() resolves even when the
 * write failed (src/store.js), so the record on disk can be one edit behind the document on
 * screen — and the file has to carry what the teacher typed, which is exactly what buildBackup()
 * promises for the same year.
 *
 * EVERY OTHER YEAR IS READ WITHOUT BEING OPENED. readStoredDocument() is a raw get: it does not
 * make the year current, does not touch `openYear`, and does not migrate. Taking a backup must not
 * move the teacher off the class she was looking at, so openYear() is deliberately not called here.
 *
 * WHAT AN OFF-VERSION RECORD PRODUCES, decided rather than inherited. The check is one call to
 * parseBackup() — the code on the other side of the round trip — on the very text that would be
 * written. Whatever a restore would refuse, this refuses to write, which is what makes "restore
 * accepts every file this produces" true by construction rather than by inspection. A year this
 * build cannot place (a document from a NEWER Planbook, which is still the only such case: the
 * ladder climbs every older one) is named on screen and left unstamped: a file the teacher's own
 * app will not read is not a way back, and it would have answered the nag anyway.
 * The stored bytes are what goes in the file — a document from an OLDER schema is written as it
 * sits, not migrated on the way out, because parseBackup() walks the ladder on the way IN and says
 * so in the confirm, and a copy that has been rewritten by a migration the teacher never saw run
 * is a copy whose original no longer exists anywhere.
 *
 * THAT LAST PARAGRAPH STOPPED BEING HYPOTHETICAL ON 2026-08-06. It used to end "today the two are
 * the same bytes; the difference only starts to matter when the first migration lands" — WO-2.10 is
 * that migration (SCHEMA_VERSION is 2, and `marks` cells that were bare strings are objects), so a
 * device holding a year written before it now writes that year out AS IT SITS, at schema 1, and the
 * restore converts on the way back in. That is the behaviour the paragraph chose, deliberately, and
 * it is worth knowing that it is now being exercised rather than merely described.
 *
 * Note what stays reachable either way: the button above does NOT validate, so the open year can
 * still be downloaded on its own even in the state where this one would leave it out of the
 * archive.
 *
 * The check costs one extra parse of one year per year, on a tap that is already writing several
 * megabytes to a disk. Worth it: the alternative is a copy of the shape rules living here, where it
 * could agree with itself and disagree with the restore it is supposed to be predicting. */
async function documentForBackup(year, open) {
  let doc = open && open.year === year ? open : null;
  if (!doc) {
    try {
      doc = await readStoredDocument(year);
    } catch (e) {
      return { year: year, reason: 'Planbook could not read it out of this browser’s storage ('
        + readable(e) + ').' };
    }
    if (!doc) return { year: year, reason: 'there is no longer a document for it on this device.' };
  }
  const file = fileFor(doc);
  try {
    parseBackup(file.text, file.name);
  } catch (e) {
    /* The refusal's own words, minus the tail about nothing on this device having been changed —
       true here, and about a file, which this is not yet. The one refusal that happens in practice
       comes from migrateDocument() and names the year and what to do about it. */
    return { year: year, reason: readable(e).split(UNCHANGED).join('') };
  }
  return { year: year, file: file };
}

/*
  The whole device, in the order listYears() gives it — chronological, the same order the year
  picker lists and the order the entries sit in the archive, so they land in a Files listing in
  the order a teacher thinks about them.

  WHAT IS STAMPED, and this is the whole of the work order's Traps line. It got SIMPLER when the
  loop of downloads became one archive, which is worth saying because the Traps line was written
  against the harder version: there is now exactly one hand-off, so there is exactly one moment
  after which a stamp can be honest. Every year that made it into the archive is stamped after
  handToBrowser() returns without throwing, and never before. A year that could not be read is not
  an entry, is not stamped, and is named on screen with the reason — so its nag stays up and the
  line below still says it has never been downloaded. A button that says it backed up three years
  and wrote two is worse than no button, because it answers the question the nag was asking.
  What is gone is the middle case the sequential version had to reason about: a run cannot be
  half-delivered any more, because there is nothing to truncate.

  WHAT A PAGE STILL CANNOT KNOW, said out loud rather than assumed away: no event tells a page
  that a download reached the disk (PREF_DEFAULTS.lastBackupAt says the same thing about the
  one-year button). One file makes that a smaller claim than it was — "did the one thing you asked
  for arrive" rather than "did all three" — but it is the same claim, so the status still names the
  file and asks her to check.
*/
export async function downloadAllBackups() {
  if (runningAll) return false;
  runningAll = true;
  const button = document.getElementById(DOWNLOAD_ALL_ID);
  if (button) button.disabled = true;

  try {
    await flush();

    let years;
    try {
      years = await listYears();
    } catch (e) {
      showStatus('Planbook could not list the school years on this device, so no file was written ('
        + readable(e) + '). Nothing has been marked as backed up.', 'error');
      return false;
    }
    if (!years.length) {
      showStatus('There are no school years on this device, so there is nothing to back up yet.',
        'error');
      return false;
    }

    showStatus('Reading ' + plural(years.length, 'school year', 'school years')
      + ' and packing them into one zip file…', 'ok');

    /* Read and validate every year FIRST, then build, then hand over once. Nothing is stamped
       inside this loop — see below; the whole point of the shape is that there is one moment when
       the teacher has been offered the file, and it is after all of this. */
    const open = getDoc();
    const entries = [];
    const skipped = [];
    for (let i = 0; i < years.length; i++) {
      const one = await documentForBackup(years[i], open);
      if (one.reason) skipped.push(one);
      else entries.push(one.file);
    }

    const why = skipped.map((s) => s.year + ' is not in it: ' + s.reason).join(' ');
    if (!entries.length) {
      showStatus('No file was written. ' + why + ' No year has been marked as backed up, and '
        + 'nothing on this device has been changed.', 'error');
      return false;
    }

    const name = zipNameFor();
    try {
      /* src/zip.js, hand-written, no dependency. It throws rather than producing an archive it
         cannot vouch for, and a throw here has to read as "no file" rather than as a stamp: the
         catch is around the build AND the hand-off for that reason. */
      const bytes = zipStored(entries.map((f) => ({ name: f.name, text: f.text })));
      handToBrowser({ name: name, blob: new Blob([bytes], { type: 'application/zip' }) });
    } catch (e) {
      showStatus('Planbook could not put the backup together, so no file was written ('
        + String(e.message || e) + '). No year has been marked as backed up, and nothing on this '
        + 'device has been changed.', 'error');
      return false;
    }

    /* Only now, and only for the years that are actually entries in the file she was just
       offered. Everything above this line can fail. */
    entries.forEach((f) => recordBackupFor(f.year));

    refreshLastBackupLine();
    refreshBackupNag();
    /* The count and the never-downloaded line are both stale now: years were stamped, and a run
       that left one out has left it in the list this sentence is about. */
    refreshYearCoverage();

    const inside = entries.map((f) => f.name).join(', ');
    if (skipped.length) {
      showStatus('Saved ' + name + ', holding ' + entries.length + ' of ' + years.length
        + ' school years: ' + inside + '. ' + why + ' '
        + (skipped.length === 1 ? 'That year is' : 'Those years are') + ' still marked '
        + 'as never backed up, so Planbook keeps asking about '
        + (skipped.length === 1 ? 'it' : 'them') + '.', 'error');
      return false;
    }
    showStatus('Saved ' + name + ' — one zip file holding every school year on this device: '
      + inside + '. Tap it in Files to unzip it, and each year is a backup on its own that '
      + 'restores by itself. Check that it arrived: a page is never told whether a download '
      + 'finished. Keep it somewhere only you can reach — it holds everything, including the '
      + 'support details on your roster.', 'ok');
    return true;
  } finally {
    runningAll = false;
    /* Re-enabled from here rather than from the refresh above, so a throw on the way through
       cannot leave the control dead until the panel is reopened. */
    const b = document.getElementById(DOWNLOAD_ALL_ID);
    if (b) b.disabled = false;
  }
}

/* ────────────────────────────── validating a file ────────────────────────────── */

/* Every refusal ends with this. A teacher who has just been told her backup file is no good is
   one sentence away from assuming she has now broken the copy she still has. */
const UNCHANGED = ' Nothing on this device has been changed.';

function kindOf(value) {
  if (Array.isArray(value)) return 'list';
  if (value === null || value === undefined) return 'nothing';
  return typeof value === 'object' ? 'group' : typeof value;
}

const KIND_WORDS = {
  list: 'a list', group: 'a group of settings', string: 'text', number: 'a number',
  boolean: 'a yes/no', nothing: 'nothing at all', function: 'something unreadable',
};
function kindWord(kind) { return KIND_WORDS[kind] || kind; }

/*
  Read a backup file into a document, or refuse it by name.

  Nothing here mutates anything outside the object it just parsed, so a refusal at any step
  leaves the device untouched by construction rather than by being careful.

  The order matters. The migration ladder runs BEFORE the shape check, because a document from
  an older schema is legitimately missing whatever its migration step adds — checking first
  would refuse exactly the files migration exists to accept. And the shape it is checked against
  is derived from newYearDocument() rather than written out here, so this check cannot drift
  away from the document it is checking.

  Unknown extra keys are kept, not stripped. A document from a NEWER build is already refused by
  migrateDocument(); anything else extra came from a teacher or a future field, and silently
  editing a file on the way in is not what "restore" means.
*/
export function parseBackup(text, fileName) {
  const what = fileName ? '“' + fileName + '”' : 'That file';

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(what + ' is empty, so there is nothing in it to restore. Choose the backup '
      + 'file you downloaded from Planbook — its name starts with “Planbook”.' + UNCHANGED);
  }

  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error(what + ' is not a Planbook backup. A backup is a JSON file, and this one '
      + 'could not be read as JSON at all (' + String(e.message || e) + '). If the file was '
      + 'edited or renamed, try the original download instead.' + UNCHANGED);
  }

  if (Array.isArray(raw) || raw === null || typeof raw !== 'object') {
    throw new Error(what + ' holds ' + kindWord(kindOf(raw)) + ', not a Planbook school year. A '
      + 'backup file contains one year document.' + UNCHANGED);
  }

  if (raw.year === undefined || raw.year === null || raw.year === '') {
    throw new Error(what + ' is JSON, but it is not a Planbook backup: there is no school year '
      + 'in it. Every Planbook backup names its year, like “2026-2027”.' + UNCHANGED);
  }
  /* Tolerant on the way in, strict on the way out — the same rule the year picker uses, and for
     the same reason: `year` is the primary key of the object store, so two spellings of one
     year would be two documents (src/store.js). */
  const year = normalizeYear(raw.year);
  if (!year) {
    throw new Error(what + ' says its school year is “' + String(raw.year) + '”, which Planbook '
      + 'cannot read as a school year. It should look like “2026-2027”.' + UNCHANGED);
  }

  /* Refuses a newer schemaVersion, refuses a gap in the ladder, and returns the document
     untouched when there is nothing to apply. Its messages are already teacher-facing. */
  let migrated;
  try {
    migrated = migrateDocument(raw);
  } catch (e) {
    throw new Error(readable(e) + UNCHANGED);
  }
  const doc = migrated.doc;
  doc.year = year;

  const template = newYearDocument(year);
  const missing = [];
  const wrong = [];
  Object.keys(template).forEach((key) => {
    const want = kindOf(template[key]);
    const got = kindOf(doc[key]);
    if (got === 'nothing') missing.push(key);
    else if (got !== want) wrong.push(key + ' holds ' + kindWord(got) + ' where Planbook '
      + 'expects ' + kindWord(want));
  });
  if (missing.length) {
    throw new Error(what + ' is missing ' + missing.join(', ') + ', so Planbook cannot treat it '
      + 'as a whole school year. It may be a partial copy, or a file from another app.'
      + UNCHANGED);
  }
  if (wrong.length) {
    throw new Error(what + ' is not shaped like a Planbook year: ' + wrong.join('; ') + '.'
      + UNCHANGED);
  }

  return { doc: doc, applied: migrated.applied };
}

/* ────────────────────────────── the restore flow ────────────────────────────── */

function line(parent, className, text) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  parent.append(el);
  return el;
}

/* One side of the before/after. Built with createElement rather than an innerHTML template,
   which is the convention for everything this app renders out of a year document — and here it
   is not a formality: the year and the counts come out of a file somebody else's browser wrote. */
function side(parent, label, facts, extra) {
  const box = document.createElement('div');
  box.className = 'restore-side';
  line(box, 'restore-side-label', label);
  if (!facts) {
    line(box, 'restore-side-empty', extra);
    parent.append(box);
    return;
  }
  line(box, 'restore-side-year', facts.year);
  line(box, 'restore-side-line', plural(facts.classes, 'class', 'classes') + ' · '
    + plural(facts.students, 'student', 'students'));
  /* The record, in the same ` · ` grammar as the roster line above it and on two lines rather than
     one: attendance and the gradebook are the two things a teacher would miss, and four counts run
     together read as a serial number. The zeros are printed rather than hidden — "0 recorded
     meetings" against "46" on the other side is the sentence this panel exists to say, and a line
     that disappeared when it had nothing to report would take it away in exactly that case. */
  line(box, 'restore-side-line', plural(facts.meetings, 'recorded meeting', 'recorded meetings')
    + ' · ' + plural(facts.marks, 'attendance mark', 'attendance marks'));
  line(box, 'restore-side-line', plural(facts.assignments, 'assignment', 'assignments') + ' · '
    + plural(facts.scores, 'score', 'scores'));
  line(box, 'restore-side-line', 'Last saved ' + facts.saved);
  line(box, 'restore-side-note', plural(facts.rev, 'save', 'saves') + ' behind it');
  if (extra) line(box, 'restore-side-note', extra);
  parent.append(box);
}

/*
  The confirm. It names the document being overwritten and the one coming in, with counts and
  dates, before anything is replaced — because "restore" and "destroy a term of grades" are the
  same gesture and the only thing that separates them is what is on the screen at the moment the
  teacher taps yes.

  The outgoing side is read straight off disk without opening it, so this works even when the
  stored document is one boot() refused: a year written by a newer build still has a roster
  worth counting, and that case is the whole reason there is an exit from the loading screen.

  AND SINCE WO-1.15 IT SAYS THE ANSWER OUT LOUD when the stored side holds more of the record than
  the file does, instead of leaving a teacher to subtract two columns of numbers in the two seconds
  before she destroys a term. Nothing here guesses which DEVICE the file came from — there is no
  field for that and there must not be one; the fix is to make the difference visible, not to make
  the app clever.
*/
async function openRestoreConfirm(doc, applied, opener) {
  const stored = await readStoredDocument(doc.year);
  const open = getDoc();

  pending = { doc: doc };

  const lead = document.getElementById('restoreConfirmLead');
  if (lead) {
    lead.textContent = stored
      ? 'This replaces the ' + doc.year + ' school year on this device with the one in the '
        + 'file. What is here now is overwritten, and that cannot be undone.'
      : 'There is no ' + doc.year + ' school year on this device, so nothing is overwritten — '
        + 'this adds it and opens it.';
  }

  /* Described once and read twice — the panel prints both sides and the sentence below compares
     them, and two calls to describe() on one document is how one screen comes to hold two counts
     of the same thing. */
  const outgoing = stored ? describe(stored) : null;
  const incoming = describe(doc);

  const compare = document.getElementById('restoreCompare');
  if (compare) {
    compare.textContent = '';
    side(compare, 'On this device now', outgoing,
      stored
        ? (stored.schemaVersion !== SCHEMA_VERSION
            ? 'Written by a different version of Planbook (schema ' + stored.schemaVersion + ')'
            : '')
        : 'Nothing for ' + doc.year + ' is stored here.');
    side(compare, 'In the backup file', incoming,
      applied && applied.length ? 'Brought up to date from an older version (' + applied.join(', ') + ')' : '');
  }

  /*
    The subtraction, done for her, in the danger wash the delete confirms use — and only when there
    is one to do. It sits between the numbers it summarises and the button it is about, because the
    last thing read before a tap is the thing that stops it.

    It names the file rather than the device, deliberately: "this file does not have them" is a fact
    about what is in her hand, where "this file came from your iPad" would be a guess the format
    cannot support. And it says what the way back is, because a teacher who has just been told what
    she is about to lose is one sentence away from believing it is already gone.
  */
  const lost = document.getElementById(LOSS_ID);
  if (lost) {
    const gaps = wouldBeLost(outgoing, incoming);
    lost.textContent = gaps.length
      ? 'The ' + doc.year + ' school year on this device holds more than the file does. Replacing '
        + 'it loses ' + andList(gaps) + ', which this file does not have — and the only way back '
        + 'to that is a backup taken from this device. Check that this is the file you meant.'
      : '';
    lost.classList.toggle('hidden', !gaps.length);
  }

  const note = document.getElementById('restoreConfirmNote');
  if (note) {
    const messages = [];
    if (open && open.year !== doc.year) {
      messages.push('The year you have open, ' + open.year + ', is not touched by this. Planbook '
        + 'switches to ' + doc.year + ' when the restore finishes.');
    }
    note.textContent = messages.join(' ');
    note.classList.toggle('hidden', !messages.length);
  }

  const button = document.getElementById('restoreConfirmBtn');
  if (button) button.textContent = stored ? 'Replace ' + doc.year : 'Add ' + doc.year;

  openModal(CONFIRM_ID, opener);
}

/* Yes. Everything before this point has been in memory; this is the only line in the module
   that changes what is on disk. */
export async function confirmRestore() {
  if (!pending) return false;
  const doc = pending.doc;
  pending = null;

  try {
    await restoreDocument(doc);
  } catch (e) {
    closeModal(CONFIRM_ID);
    showStatus('The restore did not happen: ' + readable(e), 'error');
    return false;
  }

  closeModal(CONFIRM_ID);
  refreshYearButton();
  refreshBackupNag();
  refreshLastBackupLine();
  /* A restore can switch the open year and can create one that was not on the device a moment
     ago, so the list of years that have never been downloaded is stale by definition here — and
     since WO-1.11 so is the count on "Back up all N years", which a restore that adds the second
     year on this device brings onto the screen for the first time. */
  refreshYearCoverage();

  /* The exit from the boot-failure screen, and the reason it is done here rather than in
     shell.js: this is the only path that can end with a working document after boot() refused
     one. The screen is up in exactly one case — boot failed — so hiding it is safe to do
     unconditionally, and the alternative is a teacher looking at a spinner over a gradebook
     that has just been restored underneath it. */
  const loading = document.getElementById('loadingScreen');
  if (loading) loading.classList.add('hidden');

  const facts = describe(doc);
  showStatus('Restored ' + facts.year + ' from the backup: '
    + plural(facts.classes, 'class', 'classes') + ' and '
    + plural(facts.students, 'student', 'students') + '. This is the year that is open now.', 'ok');
  return true;
}

/* No. Nothing was written, so there is nothing to undo — which is the point of doing the whole
   validation before the dialog rather than after it. */
export function cancelRestore() {
  pending = null;
  closeModal(CONFIRM_ID);
  showStatus('Restore cancelled. The ' + (getDoc() ? getDoc().year + ' school year is' : 'documents on this device are')
    + ' exactly as before.', 'ok');
}

/*
  A file, from the input or from the drop target — both paths land here. Reading and validating
  it is all that happens; the write waits for the dialog.
*/
export async function restoreFromFile(file, opener) {
  if (!file) return false;
  if (file.size > MAX_FILE_BYTES) {
    showStatus('“' + file.name + '” is ' + Math.round(file.size / (1024 * 1024)) + ' MB, which is '
      + 'far larger than a Planbook backup ever is, so Planbook has not tried to read it.'
      + UNCHANGED, 'error');
    return false;
  }
  let text;
  try {
    text = await file.text();
  } catch (e) {
    showStatus('“' + file.name + '” could not be read from this device (' + String(e.message || e)
      + ').' + UNCHANGED, 'error');
    return false;
  }
  return restoreFromText(text, file.name, opener);
}

/* The same path with the file already read, which is also the seam tools/verify-shell.mjs
   drives: a page cannot be handed a real file by a script, and every step after the read is
   identical whether the bytes came from a drop, a file input, or a harness. */
export async function restoreFromText(text, fileName, opener) {
  showStatus('', null);
  let parsed;
  try {
    parsed = parseBackup(text, fileName);
  } catch (e) {
    showStatus(readable(e), 'error');
    return false;
  }
  await openRestoreConfirm(parsed.doc, parsed.applied, opener);
  return true;
}

/* ────────────────────────────── the drop target ────────────────────────────── */

export function setDropActive(on) {
  const zone = document.getElementById(DROP_ID);
  if (zone) zone.classList.toggle('active', !!on);
}

export function handleDropped(file) {
  /* The panel may not be open — a file dropped on the page while the modal is closed does
     nothing at all, and that is deliberate: a restore that can be started by dropping a file
     anywhere is a restore that can be started by accident. */
  const zone = document.getElementById(DROP_ID);
  if (!zone) return;
  restoreFromFile(file, zone);
}

/* The file input, which is the path an iPad actually takes — a tablet has a Files picker and no
   drag. Clearing the value afterwards is what makes choosing the SAME file twice fire `change`
   a second time, which is exactly what a teacher does after fixing a refusal. */
export function handleChosenFile(input) {
  const file = input && input.files && input.files[0];
  if (input) {
    const clear = () => { input.value = ''; };
    restoreFromFile(file, input).then(clear, clear);
  }
}

/* ────────────────────────────── the panel and the nag ────────────────────────────── */

function refreshLastBackupLine() {
  const el = document.getElementById(LAST_ID);
  if (!el) return;
  const doc = getDoc();
  if (!doc) {
    /* The boot-failure case: this panel is the exit from a year that would not open, so there is
       no "this year" to date. Restore is the control that matters here, not this line. */
    el.textContent = 'No school year is open, so there is nothing to date here.';
    return;
  }
  const at = lastBackupFor(doc.year);
  el.textContent = at
    ? 'Last ' + doc.year + ' backup downloaded from this browser: '
      + whenSaved(new Date(at).toISOString()) + '.'
    : 'No ' + doc.year + ' backup has ever been downloaded from this browser.';
}

/*
  The two facts on this panel that are about the OTHER years on the device — the control that
  writes them all out, and the line that names one that never has been. Both need the year list
  and neither is worth a second read of the store to get it, so one read answers both.

  Not awaited by openBackupPanel(), on purpose, and the reason is in that function: this panel is
  the exit from a boot that already failed, and holding a recovery screen closed behind a read of
  the store that may be exactly what is broken trades a control that fills in for a panel that
  never appears. Both start hidden in the markup, so nothing moves unless there is something to
  say.
*/
async function refreshYearCoverage() {
  let years = [];
  try {
    years = await listYears();
  } catch (e) {
    /* A store that will not list its years cannot answer either question, and a guess here would
       either hide a control the teacher needs or offer one that writes nothing. Both stay away. */
    years = [];
  }
  refreshBackupAllControl(years);
  refreshOtherYearsLine(years);
}

/*
  The second control, and its one sentence of prose.

  SHOWN ONLY WHEN THERE IS MORE THAN ONE YEAR, which is the deliverable and also the whole of "no
  teacher who never rolls over ever sees it": until her first August rollover this panel is exactly
  the panel WO-1.5 verified, with one button on it. The count is in the label rather than only in
  the prose, because the label is the part that gets read — "Back up all 3 years" says what will
  happen without the teacher having to trust a sentence underneath it.

  Outline rather than solid: the primary action on this panel is still the one-file button. A
  teacher who has not rolled over never sees this one, and a teacher who has still wants the year
  she is teaching backed up first and fastest.
*/
function refreshBackupAllControl(years) {
  const many = years.length > 1;
  const button = document.getElementById(DOWNLOAD_ALL_ID);
  if (button) {
    button.classList.toggle('hidden', !many);
    if (many) button.textContent = 'Back up all ' + plural(years.length, 'year', 'years');
  }
  const note = document.getElementById(ALL_NOTE_ID);
  if (note) {
    note.classList.toggle('hidden', !many);
    if (many) {
      /* Rewritten on 2026-08-05, when the control stopped writing one file per year: it used to
         promise "N separate files" and an iPad that asks about each one, which is exactly what the
         installed PWA turned out not to do. The sentence now says what the teacher will be handed
         and what to do with it, because "one zip file" is a thing she has to act on — a download
         she cannot restore from directly is a download she is entitled to be suspicious of. */
      note.textContent = 'That downloads one zip file holding all '
        + plural(years.length, 'school year', 'school years') + '. Tap it in Files to unzip it, '
        + 'and each year is a backup on its own that restores by itself.';
    }
  }
}

/*
  One line, and only when it has something to say: a teacher who has just one year — which is
  every teacher until the first rollover — never sees it.

  It exists because "Download backup" backs up the year that is open, and nothing on this panel
  used to say so. A teacher who has rolled over to 2027-2028 and still keeps 2026-2027 for the
  gradebook she has not finished reporting can take a backup, see the date update, and reasonably
  read that as "Planbook is backed up." That silence is what this closed on 2026-08-04, before
  there was a button to point at.

  WHAT WO-1.11 CHANGED HERE IS THE SECOND HALF OF THE SENTENCE, and nothing else. It used to send
  the teacher to the year button to switch and download again, which was the only answer there was;
  it now names the control that does it in one tap. What the line asks about — a year on this device
  that has never been written to a file — is untouched, and so is the strip on the home screen.

  AND SO THE YEAR COUNT IS NOW A CONDITION OF SHOWING THIS LINE, in code rather than in a comment.
  The first pass of WO-1.11 asserted here that the line "is only ever shown when there is more than
  one year, so the control it names is always on screen beside it" and did not enforce it: the test
  below was only ever about whether some year was un-downloaded, while the control is hidden by
  refreshBackupAllControl() whenever the device holds exactly one year. One state satisfies both at
  once — the boot-failure screen (getDoc() is null, so the filter below keeps every year instead of
  excluding the open one) on a device holding a single year that has never been downloaded — and
  there this line named a button that was not on the screen, under the label "Back up all 1 year"
  that the function above is written specifically never to show anybody.

  THE GATE IS ON THE COUNT, AND THE `!doc ||` FILTER BELOW IS LEFT ALONE, which is the part worth
  saying out loud because the filter looks like the culprit. It is not: it is what makes this line
  work on the boot-failure screen at all. With several years on the device and none of them open,
  every un-downloaded year is one to name, the control IS on screen, and the advice is good.
  Requiring an open document would have taken the line away from the case it earns its keep in, to
  fix a case that is really about there being nothing to compare against.

  So the one-year boot-failure screen now says nothing about coverage, and that is the honest answer
  there rather than a gap: the one-file button is disabled because nothing is open, this control is
  hidden because there is one year, and a document this build refuses to open is one
  downloadAllBackups() refuses to write. There is no action for a sentence to point at.
*/
function refreshOtherYearsLine(years) {
  const el = document.getElementById(OTHER_YEARS_ID);
  if (!el) return;
  const doc = getDoc();
  /* One year on the device means there are no OTHER years, whatever getDoc() returns, and it means
     the control named below is not on screen. Both reasons point the same way. */
  const pending = years.length > 1
    ? yearsNeverBackedUp(years).filter((y) => !doc || y !== doc.year)
    : [];
  el.classList.toggle('hidden', pending.length === 0);
  if (pending.length === 0) return;
  const control = '“Back up all ' + plural(years.length, 'year', 'years') + '”';
  el.textContent = 'This backs up the year you have open. '
    + (pending.length === 1
      ? pending[0] + ' is also on this device and has never been downloaded — ' + control
        + ' writes it out too.'
      : pending.length + ' other years on this device have never been downloaded ('
        + pending.join(', ') + ') — ' + control + ' writes them out too.');
}

/*
  WHAT A DOCUMENT HOLDS THAT A TEACHER WOULD MISS — as a list rather than as a sum, and the list is
  what WO-1.17 is really for. The three names it added to it are the smaller half.

  THE DEFECT IT REPLACES. Until 2026-08-15 the test below was seven count() calls in one expression,
  and `scores`, `passes` and `openPasses` were not among them: the nag could not see a year whose
  only content was grades or hall passes. It was masked rather than harmless — a score cell needs an
  assignment to hang on, so count(doc.assignments) fired first and the strip appeared anyway — and it
  stops being masked the moment scores can outlive their column: an assignment deleted with its
  scores kept, an import, a partial restore. What the omission costs is silence about the only copy
  of a term of grades, on the one strip standing between a teacher and the iOS eviction CLAUDE.md
  describes. Found on 2026-08-12 by WO-1.15's verifier, reading this file for another reason.

  WHY A LIST AND NOT A SUM. A sum can only be kept in step with docs/data-model.md by somebody
  remembering to, and nobody did for the six days between WO-2.8 adding two collections to the
  document and a verifier happening to read this line. A list is machine-readable, so it does not
  depend on remembering: tools/wo-sweep.mjs § 14 reconciles BOTH halves of it against the document
  sketch in docs/data-model.md, and a collection that appears there and is classified in neither half
  FAILs the sweep by name, in a command every dispatch already runs. What that catches is the
  omission, on the day it is made. What it cannot catch is a wrong DECISION — an entry parked below
  with a plausible sentence beside it is a judgment this file records and nothing audits — and that
  split is deliberate: the sweep makes the next reader decide, it does not decide for them.

  EACH ROW CARRIES ITS OWN COUNTER, which is the same defect's other half. `count(doc.scores)` is 0
  for a full gradebook — `scores` is an object keyed by assignment and then by student, not an array
  (countScores(), above, and the trap WO-1.15 wrote out there) — so adding `scores` to a sum of
  count() calls would have looked like this fix and changed nothing. The counter is therefore paired
  with the shape docs/data-model.md documents, and the sweep checks the pairing too: a collection
  written there as an object may not be counted with the list counter.

  THE ALTERNATIVE CONSIDERED AND REJECTED was deriving this from newYearDocument()'s keys, the way
  parseBackup() derives its shape check ("so this check cannot drift away from the document it is
  checking"). Three reasons it is not right here. It reconciles against a second hand-written list in
  src/store.js rather than against the documentation, which is where the collections are argued. It
  has nowhere to hold the REASON a key is excluded, and every exclusion below is a judgment somebody
  will want to re-open. And "every collection except these" is one careless refactor away from
  "anything non-empty", which is exactly what the day-one rule under it is defending against — a
  document is never empty, it always has a year and a letter scale.
*/
const CONTENT_COLLECTIONS = [
  { key: 'classes', counter: count },
  { key: 'students', counter: count },
  { key: 'assignments', counter: count },
  /* NOT count(). See countScores() above, and EACH ROW CARRIES ITS OWN COUNTER in the block. */
  { key: 'scores', counter: countScores },
  { key: 'attendance', counter: count },
  { key: 'log', counter: count },
  /* WO-2.8's two, and both of them rather than one: `openPasses` is a child who is out of the room
     right now and `passes` is the history Phase 4 reads as a signal. Either one alone is a document
     with something in it a teacher typed. */
  { key: 'openPasses', counter: count },
  { key: 'passes', counter: count },
  { key: 'events', counter: count },
  { key: 'templates', counter: count },
];

/* The other half of the same list: every top-level key docs/data-model.md names that is NOT content,
   each with the reason it is not. NOTHING IN THIS MODULE READS IT, on purpose — it is the half that
   lets the sweep tell "decided against" from "forgotten", which is the entire difference this work
   order is about, and it gives the next reader who disagrees with one of these calls a sentence to
   argue with instead of a silence. Deleting it as dead code turns § 14 red, which is the point. */
const NOT_CONTENT = [
  { key: 'schemaVersion', why: 'stamped by the build, not typed by anybody' },
  { key: 'docId', why: 'generated with the document' },
  { key: 'year', why: 'the label; every document is for some year' },
  { key: 'rev', why: 'counts saves, not work' },
  { key: 'deviceId', why: 'generated with the document' },
  { key: 'updatedAt', why: 'a clock reading' },
  { key: 'teacher', why: 'a name, a school and two addresses, typed once at setup and re-typed from '
    + 'memory in a minute. The nag is about the record that cannot be reconstructed' },
  { key: 'letterScale', why: 'seeded by newYearDocument(); the day-one rule below names it out loud' },
  { key: 'signals', why: 'thresholds that default when absent (docs/data-model.md § Signal '
    + 'thresholds). A teacher can tune these as of WO-4.1, so this is no longer empty by '
    + 'construction — it stays out because a threshold is a preference rather than a record, and '
    + 'because an untouched year still holds no keys here at all. Re-open it if the nag ever has to '
    + 'mean "you would lose how you set this app up" as well as "you would lose what you typed"' },
];

/* Anything that would be lost. A brand-new document is not empty of meaning — it has a year and
   a letter scale — but it holds nothing a teacher typed, and nagging about it on day one is how
   a warning becomes wallpaper before there is anything to warn about. */
function hasSomethingToLose(doc) {
  if (!doc) return false;
  return CONTENT_COLLECTIONS.reduce((n, row) => n + row.counter(doc[row.key]), 0) > 0;
}

/*
  The nag. Amber caution styling and a strip in normal flow, exactly like the install banner
  above it, and for the same stated reason: this is a standing condition to act on, not an error
  that just happened, and a strip that looks like an error every launch is a strip that is tuned
  out by October.

  It carries no "Not now", which is the one place it diverges from the install banner. The way
  to make this one go away is to take the backup, that is one tap from the button in the strip,
  and it always works — a snooze here would be a snooze on the only copy of a term of grades.

  Evaluated at boot, after a backup or a restore, and on a year switch — and not on every save:
  the answer can only change when one of those happens, and a strip that appears mid-sentence
  while a teacher is typing a roster is a strip she will learn to ignore. The year switch joined
  that list on 2026-08-04, when the timestamp became per-year: the answer is now a fact about the
  open year, so changing which year is open changes it.

  IT ASKS ABOUT THE OPEN YEAR, which is the whole of that fix. One timestamp for the browser
  meant a teacher part-way through a rollover could download the year on screen and watch the
  strip go quiet for both — including the one that had never been written to a file at all. This
  strip is the only thing standing between a set-aside year and silence.
*/
export function refreshBackupNag() {
  const el = document.getElementById(NAG_ID);
  if (!el) return;

  const doc = getDoc();
  const at = doc ? lastBackupFor(doc.year) : 0;
  const age = Date.now() - at;
  const due = hasSomethingToLose(doc) && (!at || age > NAG_AFTER_MS);
  el.classList.toggle('hidden', !due);
  if (!due) return;

  const lead = document.getElementById('backupNagLead');
  if (lead) {
    const days = Math.floor(age / (24 * 60 * 60 * 1000));
    /* Named, not "your last Planbook backup". The strip is about the year on screen, and a
       teacher holding two years needs to read which one it means without doing the arithmetic
       herself. With one year it costs four words and reads as ordinary. */
    lead.textContent = at
      ? 'Your last ' + doc.year + ' backup was ' + plural(days, 'day', 'days') + ' ago.'
      : 'You have never downloaded a ' + doc.year + ' backup.';
  }
}

/* Opened through its own hook rather than data-modal-open, for the reason year-picker.js gives:
   the panel states facts — whether anything is open to back up, when the last one was — and a
   modal that opens and then fills in is a modal that flickers. */
export function openBackupPanel(opener) {
  showStatus('', null);
  refreshLastBackupLine();

  /* No open document means boot() refused one, which is the case this panel is the exit from.
     Restoring still works; there is simply nothing to download. The button says so rather than
     failing on tap. */
  const doc = getDoc();
  const button = document.getElementById(DOWNLOAD_ID);
  if (button) {
    button.disabled = !doc;
    button.textContent = doc ? 'Download ' + doc.year + ' backup' : 'Nothing open to back up';
  }

  /* The multi-year control is not touched here beyond clearing a disable that a previous run left
     behind. It is hidden in the markup and revealed by the read below, and it is deliberately NOT
     re-hidden first: a second open would then blink it off and on for no reason, which is the
     flicker this whole function is arranged to avoid. Nor is it disabled-and-relabelled the way the
     button above is when there is nothing open — a control that is only right for a teacher who has
     rolled over does not belong on the screen of one who has not, and "Back up all 1 years" is not
     a thing to show anybody. */
  const all = document.getElementById(DOWNLOAD_ALL_ID);
  if (all) all.disabled = false;

  const input = document.getElementById(FILE_ID);
  if (input) input.value = '';

  openModal(PANEL_ID, opener);

  /* Deliberately after the panel is up, and deliberately not awaited. Every other fact here is
     in place before it opens, for the no-flicker reason above — these two need IndexedDB, and
     this panel is the way out of a boot that already failed. Holding a recovery screen closed
     behind a read of the store that may be exactly what is broken trades a control that fills in
     for a panel that never appears. Both start hidden, so nothing moves unless there is something
     to say. */
  refreshYearCoverage();
}
