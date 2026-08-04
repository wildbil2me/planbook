/*
  Backup and restore — the file the teacher holds, and the way back in from it.

  WHY THIS IS THE GATE. Everything Planbook knows lives in one browser's IndexedDB. iOS evicts
  that after about a week of not opening the app, unless the app was added to the home screen
  (CLAUDE.md); a wiped browser, a re-imaged laptop, or a tablet that will not turn on takes it
  with no warning at all. Drive sync is not a backup either — it holds one live copy that the
  next sync overwrites (docs/sync.md). A file on the teacher's own disk is the only recovery
  path that survives all of that, which is why no feature that writes student data ships before
  this one does.

  THE FILE CONTAINS EVERYTHING, ON PURPOSE. From WO-1.8 the year document carries IEP and 504
  accommodations, medical needs, and behavior plans, and the backup carries them too. A backup
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
import { announce } from './live-region.js';
import { getPref, setPref } from './prefs.js';
import { refreshYearButton } from './year-picker.js';

const PANEL_ID = 'backupModal';
const CONFIRM_ID = 'restoreConfirmModal';
const NAG_ID = 'backupNag';
const STATUS_ID = 'backupStatus';
const LAST_ID = 'backupLast';
const OTHER_YEARS_ID = 'backupOtherYears';
const DROP_ID = 'backupDrop';
const FILE_ID = 'backupFile';
const DOWNLOAD_ID = 'backupDownloadBtn';

/* Seven days, the number the work order names, and it is the same seven as the iOS eviction
   window rather than a coincidence — a backup older than the window that erases the browser is
   a backup that can already be behind what was lost. */
const NAG_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/* A whole year is 3-6 MB (docs/data-model.md). This is not a size limit on Planbook's own
   files, it is a guard against reading a 2 GB video into a string because it landed on the drop
   target by accident, which on an iPad reads as the app freezing. */
const MAX_FILE_BYTES = 64 * 1024 * 1024;

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

function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

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

/* The facts the confirm dialog names, from a document that may never have been opened. */
function describe(doc) {
  return {
    year: doc.year,
    classes: count(doc.classes),
    students: count(doc.students),
    saved: whenSaved(doc.updatedAt),
    rev: Number(doc.rev) || 0,
    schemaVersion: doc.schemaVersion,
  };
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
  return {
    year: doc.year,
    name: 'Planbook ' + doc.year + ' backup ' + dateStamp(new Date()) + '.json',
    text: JSON.stringify(doc, null, 2),
  };
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
   to render a sentence. */
async function yearsNeverBackedUp() {
  let years = [];
  try {
    years = await listYears();
  } catch (e) {
    return [];
  }
  const times = backupTimes();
  return years.filter((y) => !times[y]);
}

/*
  Hand the file to the browser. An <a download> over a blob URL rather than anything cleverer:
  it is the one mechanism that works in an installed PWA on iPadOS, where it lands in the Files
  app the teacher chooses, and on a laptop, where it lands in Downloads.

  The object URL is revoked on the next turn rather than immediately — Safari has historically
  cancelled the download if the URL is revoked in the same task as the click.
*/
export async function downloadBackup() {
  let file;
  try {
    file = await buildBackup();
  } catch (e) {
    showStatus(readable(e), 'error');
    return false;
  }

  const url = URL.createObjectURL(new Blob([file.text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);

  /* Recorded as "she was offered the file", against the year that is actually in it — never the
     year on screen, which for a download are the same thing today and would stop being one the
     moment anything backs up a year it does not have open. A page is never told whether the save
     dialog was confirmed, and the alternative — never clearing the nag — is a strip that is
     permanent and therefore invisible by October. See PREF_DEFAULTS.lastBackupAt. */
  recordBackupFor(file.year);
  refreshLastBackupLine();
  refreshBackupNag();
  showStatus('Saved ' + file.name + '. Keep it somewhere only you can reach — it holds '
    + 'everything, including the support details on your roster.', 'ok');
  return true;
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

  const compare = document.getElementById('restoreCompare');
  if (compare) {
    compare.textContent = '';
    side(compare, 'On this device now', stored ? describe(stored) : null,
      stored
        ? (stored.schemaVersion !== SCHEMA_VERSION
            ? 'Written by a different version of Planbook (schema ' + stored.schemaVersion + ')'
            : '')
        : 'Nothing for ' + doc.year + ' is stored here.');
    side(compare, 'In the backup file', describe(doc),
      applied && applied.length ? 'Brought up to date from an older version (' + applied.join(', ') + ')' : '');
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
     ago, so the list of years that have never been downloaded is stale by definition here. */
  refreshOtherYearsLine();

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
  One line, and only when it has something to say: a teacher who has just one year — which is
  every teacher until the first rollover — never sees it.

  It exists because "Download backup" backs up the year that is open, and nothing on this panel
  used to say so. A teacher who has rolled over to 2027-2028 and still keeps 2026-2027 for the
  gradebook she has not finished reporting can take a backup, see the date update, and reasonably
  read that as "Planbook is backed up." Downloading the other one is a year switch away, and the
  only thing missing was the sentence that says to go and do it. Backing both up in one tap is
  WO-1.11; this is the half that is true either way, and it is the half that stops the gap from
  being silent.
*/
async function refreshOtherYearsLine() {
  const el = document.getElementById(OTHER_YEARS_ID);
  if (!el) return;
  const doc = getDoc();
  const pending = (await yearsNeverBackedUp()).filter((y) => !doc || y !== doc.year);
  el.classList.toggle('hidden', pending.length === 0);
  if (pending.length === 0) return;
  el.textContent = 'This backs up the year you have open. '
    + (pending.length === 1
      ? pending[0] + ' is also on this device and has never been downloaded — switch to it from '
        + 'the year button to back it up too.'
      : pending.length + ' other years on this device have never been downloaded ('
        + pending.join(', ') + ') — switch to each from the year button to back them up too.');
}

/* Anything that would be lost. A brand-new document is not empty of meaning — it has a year and
   a letter scale — but it holds nothing a teacher typed, and nagging about it on day one is how
   a warning becomes wallpaper before there is anything to warn about. */
function hasSomethingToLose(doc) {
  if (!doc) return false;
  return count(doc.classes) + count(doc.students) + count(doc.assignments)
    + count(doc.attendance) + count(doc.log) + count(doc.events) + count(doc.templates) > 0;
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

  const input = document.getElementById(FILE_ID);
  if (input) input.value = '';

  openModal(PANEL_ID, opener);

  /* Deliberately after the panel is up, and deliberately not awaited. Every other fact here is
     in place before it opens, for the no-flicker reason above — this one needs IndexedDB, and
     this panel is the way out of a boot that already failed. Holding a recovery screen closed
     behind a read of the store that may be exactly what is broken trades a line that fills in
     for a panel that never appears. The line starts hidden, so nothing moves unless it has
     something to say. */
  refreshOtherYearsLine();
}
