/*
  What a score cell was before it was changed (WO-3.33). English runs on revision: *72, revised to
  88* is the rise the praise column exists for, and until this file a revision overwrote the 72 the
  moment the 88 was typed.

  ── THE HISTORY IS OF THE WHOLE CELL, NOT OF THE SCORE ──

  Every write to a score cell stamps `at`, a local ISO timestamp with its offset — the mark cell's
  rule (docs/data-model.md), written by src/log.js's localStamp(), which is imported rather than
  copied so the app has two clocks-to-string and not three. Overwriting a cell pushes the cell as it
  WAS — its value, its flag, its note and its `at` — onto `was`, oldest first. So *Missing → Late, 70
  → 88* is one list with no separate flag tracking, and only the current fields count toward any
  grade. `was` is absent until the first change, and a cell written before this build has no `at`,
  which is valid.

  ── A VERSION IS A COMMIT, NOT A KEY ──

  The grid writes on every keystroke (src/scores.js's editScore()), and so does the note panel. A
  rule that pushed on every write would turn *88* into *8 → 88*. So:

    · A WRITE WITHIN FIVE MINUTES OF THE CELL'S LAST WRITE REPLACES IT AND PUSHES NOTHING. Five
      minutes is measured from the current cell's `at`, and a cell with no `at` always pushes (the
      owner's ruling, 2026-10-02). Correcting a typo leaves no history entry, and neither does the
      second digit of a two-digit score. A held column, a cell last written before its column was
      held, one last written before its column was committed (WO-3.52), and one last written before
      the newest recording of its class and term (WO-3.79) are the exceptions, all argued above
      reviseCell().
    · A WRITE THAT CHANGES NOTHING IS NOT A WRITE. Same value, same flag, same note: nothing is
      pushed, nothing is restamped, and the caller is told not to touch the document. `72.` in the
      field reads as 72 over a stored 72, and leaving that cell is not a revision.
    · A BURST THAT ENDS WHERE IT STARTED TAKES ITS OWN PUSH BACK. Inside the five minutes, a write
      that puts the cell back to exactly the version the burst pushed pops that version and restores
      it, `at` and all. This is the one rule here that is not a sentence in the work order, and it is
      the second bullet applied to a burst rather than to one write: overtyping a 72 with `7`, `2`
      writes 7 (pushing 72) and then 72 — without this, every cell a teacher retypes as it stood
      would carry a *72 → 72* history and a mark saying it changed. It cannot reach past the burst:
      a popped version's `at` is at least five minutes old by construction (it was pushed because
      it was), so the next write after a pop always pushes again.

  A CELL THAT IS CLEARED KEEPS ITS HISTORY. src/scores.js deletes the key of a cell with no value,
  no flag and no note (its decision 2); a cell that also has no `was` is still deleted that way, but
  one that has a past is kept as `{ v: null, at, was }` — blank, ungraded, and still carrying what it
  was. Otherwise backspacing a 72 on the way to typing 75 would delete the 72 between the two
  keystrokes, and the history with it.

  ── THIS FILE IS THE ONE ASKER, AND THE ONE READER ──

  The mark says only that a score changed, and the trail says what it was — both about one student,
  on the screen most likely to be on a classroom wall. So under presentation mode both are ABSENT:
  no mark, no "has earlier versions" in an accessible name, no tooltip clause, no card (the owner's
  ruling, 2026-10-04 — WO-3.32's treatment of a note, and src/shell.js's flipPresentationMode()
  already repaints both screens). The question is asked here and only here, the arrangement
  src/score-notes.js has for a note.

  NOTHING READS `was` BUT THIS FILE, and nothing outside it is handed `was` except the writer it
  goes straight back into the document from. The grid gets a boolean (hasVisibleHistory()), student
  detail gets a built card (scoreHistoryCard()), and no signal rule, merge field, grade or print
  surface reads a history entry: what a rise means once a score is dated is parked in
  plans/future-features.md § Gradebook as the owner's ruling to make, not this file's.
  tools/wo-sweep.mjs § 28 keeps that true of the tree.

  ONE MORE ANSWER LEAVES SINCE WO-3.75, AND IT IS ONE VERSION, NOT THE TRAIL. The Record dialog's
  *What changed* box names the score that moved a recorded quarter — *Act 2 quiz (Exams): 4 → 9 of
  10* — and the 4 is a past version. scoreChangeSince() hands src/term-record.js exactly that: one
  cell's value and flag at a moment beside its value and flag now, or nothing. Never a note, never an
  `at`, never the list, and never a version between the two ends: two edits since the recording are
  one line from the recorded value to the latest. It asks presentationMode() nothing, deliberately —
  the dialog it feeds is refused under a projector before any reader is asked
  (src/term-record-view.js's termRecordModel()), so a second asker here would be the second opinion
  this file exists to prevent. § 28 names its one importer.

  ── WHAT IT DOES NOT DO ──

  IT IS NOT A WRITER OF THE DOCUMENT: no store import, no update(). reviseCell() is pure — it is
  handed the cell as stored and the cell a writer wants, and answers what to store — and the two
  writers that call it (src/scores.js, src/past-due.js) do the storing inside their own update().
*/

import { presentationMode } from './supports.js';
import { localStamp } from './log.js';
import { shortDate } from './date-text.js';
import { noteOf } from './score-notes.js';

/* Five minutes, from the current cell's `at`. A write strictly inside it replaces; one at five
   minutes or later pushes. */
export const REVISION_WINDOW_MS = 5 * 60 * 1000;

function isCell(cell) {
  return !!cell && typeof cell === 'object' && !Array.isArray(cell);
}

function flagWord(cell) {
  const flag = isCell(cell) ? cell.flag : '';
  return flag === 'late' || flag === 'missing' || flag === 'excused' ? flag : '';
}

function valueIn(cell) {
  return isCell(cell) && cell.v !== undefined ? cell.v : null;
}

/* The earlier versions, as stored. Read ONLY inside this file. */
function earlier(cell) {
  return isCell(cell) && Array.isArray(cell.was) ? cell.was.filter(isCell) : [];
}

/* Whether two cells hold the same thing — value, flag and note, which is the whole of what a version
   is. `at` and `was` are about the cell's past, not its content. */
function sameContent(a, b) {
  return valueIn(a) === valueIn(b) && flagWord(a) === flagWord(b) && noteOf(a) === noteOf(b);
}

/* One version of a cell, in the order the data model writes a cell's keys: `v`, then the flag, the
   note and the moment, each only where it is there. A version never carries a `was` of its own. */
function versionOf(cell) {
  const out = { v: valueIn(cell) };
  if (flagWord(cell)) out.flag = flagWord(cell);
  if (noteOf(cell)) out.note = noteOf(cell);
  if (typeof cell.at === 'string' && cell.at) out.at = cell.at;
  return out;
}

function isBlank(cell) {
  return valueIn(cell) === null && !flagWord(cell) && !noteOf(cell);
}

/* Whether a cell holds a score that counted before its column was held (WO-3.52, ruling 2): a value
   or a flag, last written at or before `heldAt` — a missing `at` counts as before, a missing
   `heldAt` means nothing was there first, and the same second counts as before. Argued above
   reviseCell(). */
function countedBefore(cell, heldAt) {
  if (valueIn(cell) === null && !flagWord(cell)) return false;
  const hold = typeof heldAt === 'string' ? Date.parse(heldAt) : NaN;
  if (!Number.isFinite(hold)) return false;
  const stamped = typeof cell.at === 'string' ? Date.parse(cell.at) : NaN;
  return !Number.isFinite(stamped) || stamped <= hold;
}

/*
  THE RULE, for every path that writes a score cell. `old` is the cell as stored (or nothing);
  `next` is the cell the writer wants — a value, a flag and a note, or null for "no value, no flag,
  no note". `now` is a Date, and defaults to the device clock. `column` is what the writer knows
  about the cell's column — `{ held, heldAt, committedAt, classId, termId, records }`, built by the
  caller from src/grade-engine.js's isHeld(), the assignment's own `heldAt`, `committedAt`, `classId`
  and `termId`, and the document's `termRecords` (WO-3.79, below) — or nothing, which means a live
  column that was never committed or recorded and is WO-3.33's behaviour to the byte (WO-3.52).

  Answers `{ write: false }` when the document must not be touched at all, or `{ write: true, cell }`
  where `cell` is what to store under the key — or null, which means delete the key.

  ── A HOLD AND A COMMIT ARE VERSION BOUNDARIES (WO-3.52) ──

  Both of the owner's rulings, as amended 2026-10-08, come from one principle of his: EVERY SCORE
  THAT COUNTED TOWARD A GRADE APPEARS IN THE TRAIL, AND A VERSION THAT NEVER COUNTED DOES NOT. The
  five-minute window is the one deliberate exception — a typo corrected inside it counted for a
  moment and is still not kept. This file does not import the grade engine: the caller says whether
  the column is held and when it was held and committed, and what that means for a cell is decided
  here and only here, so the two writers cannot disagree.

    · A HOLD IS A VERSION BOUNDARY (ruling 2). The score a cell carried when its column was held —
      last written at or before `heldAt` — counted, so the first held write PUSHES it onto `was`,
      however soon after its own `at`, with the stored `was` kept beneath it exactly as stored (not
      re-read through versionOf(), not popped by a burst). That includes a blank: the cell is kept
      as `{ v: null, at, was }`. Holding a column must never be a way to make a score disappear.
    · EVERY OTHER HELD WRITE REPLACES AND PUSHES NOTHING. Once the first held write has stamped the
      cell after `heldAt`, the cell is a held version, which counted toward nothing, so the next
      held write replaces it however long since — and a cell first typed while held keeps no history
      until the commit. A write that changes nothing is still not a write, and a held cell blanked
      with no `was` and nothing to push is still deleted.
    · WHAT "A SCORE THAT COUNTED" MEANS HERE: a value or a flag — the two fields the grade math reads.
      A `missing` with no number counted as a zero, and an `excused` took the work out of the grade,
      so either is pushed. A cell holding only a note, or a blank kept for its past, counted toward
      nothing and pushes nothing; its trail is frozen as it stands.
    · A MISSING STAMP COUNTS AS BEFORE THE HOLD — a cell written before WO-3.33 has no `at`, and it
      was certainly there first. A MISSING `heldAt` means held from before any cell was typed, so
      nothing is pushed: no build has written a held column without one, and a column created held
      has no score from before it.
    · AFTER A COMMIT, THE COMMIT IS A VERSION BOUNDARY (ruling 1). A held cell's `at` is when it was
      typed, not when it began to count, so a cell last written at or before the column's
      `committedAt` is the committed version and the first change after the commit PUSHES it,
      however soon, the way a cell with no `at` always does — the five minutes cannot reach back
      across a commit. Type 72 while held, commit at 9:02, change it to 75 at 9:03: the 72 is on the
      trail, where measuring from the cell's `at` alone would have read 9:03 as a correction of 9:00
      and dropped it. A write after the commit opens an ordinary window from its own `at`.
    · THE SAME SECOND COUNTS AS BEFORE, at both boundaries. `at` is second-granular (localStamp()),
      and a spare trail entry costs nothing where a lost score that counted is the failure. The one
      spare it can produce: a write in the very second of a hold or a commit, followed by another,
      keeps the first. Both are compared as parsed instants, the way the window is.

  ── A RECORDING IS A VERSION BOUNDARY TOO (WO-3.79) ──

  The owner's ruling of 2026-10-31: *fix the store, not the wording*. A cell last written at or
  before the NEWEST RECORDING OF ITS CLASS AND TERM (src/term-record.js's termRecords[]) is the
  version that recording saw, so the first write after the recording PUSHES it, however soon — the
  commit's rule above, extended, and computed in the same `sealed` test rather than beside it. Type 4
  at 9:58, record at 10:00, fix it to 9 at 10:01: the 4 is on the trail, where the five minutes
  measured from 9:58 would have replaced it and the Record dialog's *What changed* could only say the
  value then was not known. A write after the recording opens an ordinary window from its own `at`.
  The same second counts as before, as at the other two boundaries.

    · IT IS THE ORDINARY BRANCH ONLY. A held write replaces however long since (WO-3.52), and *What
      changed* never lists a held column, so the held branch above does not look at a recording.
    · HOW THE BOUNDARY ARRIVES — the point of departure the work order left to this file. Not by
      import: src/term-record.js imports src/scores.js, which imports this file, so a reader of
      newestRecord() here would close an import loop. And not as an instant the caller worked out:
      two writers each walking termRecords[] for "the newest" is two opinions about which recording
      counts. The caller hands FACTS beside the ones it already hands — `records`, the document's own
      `termRecords` array as stored, and `classId` and `termId`, the column's assignment's own — and
      what they mean for the cell is decided here, by recordedBoundary(), the arrangement this
      descriptor has had since WO-3.52 (the caller says when the column was held and committed; this
      file says what that means). A descriptor without them is a column with no recording, which is
      every caller that existed before this build, to the byte.
    · NEWEST IS THE LATEST INSTANT, compared parsed, never as strings — a stamp carries its offset, and
      two recordings either side of a daylight-saving change sort wrongly as text. A recording whose
      `at` does not parse names no moment and seals nothing. It is the same recording newestRecord()
      answers: that reader takes the latest instant too, and a tie between two equal instants is the
      same instant either way.
*/
function recordedBoundary(column) {
  let newest = NaN;
  (Array.isArray(column.records) ? column.records : []).forEach((entry) => {
    if (!entry || typeof entry !== 'object' || entry.classId !== column.classId
      || entry.termId !== column.termId) return;
    const when = instantOf(entry.at);
    if (Number.isFinite(when) && (!Number.isFinite(newest) || when > newest)) newest = when;
  });
  return newest;
}

export function reviseCell(old, next, now, column) {
  const at = now instanceof Date ? now : new Date();
  const was = isCell(old) ? old : null;
  const want = isCell(next) ? next : { v: null };
  const held = !!(column && column.held);

  if (!was) {
    if (isBlank(want)) return { write: false };
    return { write: true, cell: Object.assign(versionOf(want), { at: localStamp(at) }) };
  }
  if (sameContent(was, want)) return { write: false };

  if (held) {
    const kept = Array.isArray(was.was) && was.was.length ? was.was : [];
    const past = countedBefore(was, column.heldAt) ? kept.concat([versionOf(was)]) : kept;
    const cell = Object.assign(versionOf(want), { at: localStamp(at) });
    if (past.length) cell.was = past;
    if (isBlank(cell) && !past.length) return { write: true, cell: null };
    return { write: true, cell: cell };
  }

  let past = earlier(was).map(versionOf);
  let cell;
  const stamped = typeof was.at === 'string' ? Date.parse(was.at) : NaN;
  const since = at.getTime() - stamped;
  const committed = column && typeof column.committedAt === 'string'
    ? Date.parse(column.committedAt) : NaN;
  const recorded = column ? recordedBoundary(column) : NaN;
  const sealed = Number.isFinite(stamped)
    && ((Number.isFinite(committed) && stamped <= committed)
      || (Number.isFinite(recorded) && stamped <= recorded));
  if (!sealed && Number.isFinite(stamped) && since >= 0 && since < REVISION_WINDOW_MS) {
    const last = past[past.length - 1];
    if (last && sameContent(last, want)) {
      past = past.slice(0, -1);
      cell = versionOf(last);
    } else {
      cell = Object.assign(versionOf(want), { at: localStamp(at) });
    }
  } else {
    past = past.concat([versionOf(was)]);
    cell = Object.assign(versionOf(want), { at: localStamp(at) });
  }
  if (past.length) cell.was = past;
  if (isBlank(cell) && !past.length) return { write: true, cell: null };
  return { write: true, cell: cell };
}

/* MAY A SCORE'S HISTORY BE ON SCREEN RIGHT NOW. The one question, asked in the one place. */
export function scoreHistoryVisible() {
  return !presentationMode();
}

/* Whether the grid may mark this cell as changed: it has an earlier version, and the screen is not
   being projected. A boolean and nothing more — the grid is never handed what the cell was. */
export function hasVisibleHistory(cell) {
  return scoreHistoryVisible() && earlier(cell).length > 0;
}

/* The instant a stamp names, or NaN. Every `at` here is a local stamp WITH ITS OFFSET (localStamp()),
   so two stamps either side of a daylight-saving change carry different offsets and compare wrongly
   as strings — 01:30-04:00 is earlier than 01:10-05:00. Parsed, they compare as the moments they are,
   which is how reviseCell() already measures its window and its two boundaries. */
function instantOf(stamp) {
  return typeof stamp === 'string' && stamp ? Date.parse(stamp) : NaN;
}

/* What a version counted as: its value and its flag, the two fields the grade math reads. Not the
   note, which counts toward nothing and is the teacher's own text. */
function scoreOf(cell) {
  return { v: valueIn(cell), flag: flagWord(cell) };
}

/*
  WHAT ONE CELL HELD AT A MOMENT, BESIDE WHAT IT HOLDS NOW (WO-3.75) — for the Record dialog's *What
  changed*, through src/term-record.js and nothing else. `moment` is a stamp in the `at` form (a
  recording's own `at`); `column` is `{ committedAt }` for the cell's column, or nothing. Answers:

    null                                  nothing to say: the cell has not been written since the
                                          moment, or it holds now what it held then (value and flag);
    { then: { v, flag }, now: { v, flag } }  it changed, from `then` to `now`;
    { then: null,       now: { v, flag } }  it was written since, and what it held at the moment is
                                          not kept, so it is not said.

  `flag` is '' for none. A blank `then` — `{ v: null, flag: '' }` — is a cell that held nothing at the
  moment, which is known, and is not the same answer as `then: null`, which is not known.

  THE VALUE AT THE MOMENT IS THE LATEST VERSION AT OR BEFORE IT (the work order's Traps): versions
  merge in five-minute windows, so the version before the newest is not the one the recording saw. A
  version with no `at` was written before WO-3.33, so it is before any recording — countedBefore()'s
  reading. "At or before" because `at` is second-granular, the same second as the recording counts
  as before, as it does at a hold and a commit.

  THE READER TRUSTS THE TRAIL ACROSS A RECORDING (WO-3.79, the owner's ruling of 2026-10-31). A
  recording is a version boundary (above reviseCell()), so under this build the first write after a
  recording always pushes the version the recording saw, however soon: type 4, record, fix it to 9 a
  minute later, and the 4 is on the trail with its own `at`. So the latest version at or before the
  moment IS what the recording saw, for every write this build makes, and `then` is that version —
  whether the 4 was typed two minutes or twenty days before. There is no five-minute test here any
  more: WO-3.75 answered `then: null` whenever the first version after the moment fell inside the
  five minutes after it, because before the seal a burst across the moment could have swallowed what
  the recording saw, and that guard is what the seal made unnecessary.

  THE ONE EXCEPTION, stated rather than claimed away: a cell an EARLIER BUILD replaced inside the five
  minutes after a recording. That build had no seal, so a 6 written at R−1min and an 8 at R+2min left
  one version, the 8, over a 5 from weeks before — byte for byte the cell this build leaves when a 5
  typed weeks before is fixed to 8 just after recording. Nothing in the cell says which, and this
  reader takes the trail at its word, so that cell names the version before the swallowed one: 5 → 8
  where the recording saw 6. Accepted, because Record shipped on 2026-10-29 (WO-3.73) and only edits
  saved in the days before this build can carry it (tools/verify/term-record-cause.mjs's Dunn375 pins
  it as the known limit). The two WO-3.75 limits that came from the same cause — a burst restamping
  one cell for more than five minutes across the moment, and a burst across it that ends where it
  began popping its own push back — are closed for this build's writes by the same seal, and stand
  for an earlier build's the same way.

  NO VERSION AT OR BEFORE THE MOMENT — every version on the trail is stamped after it — answers a
  BLANK `then`, `{ v: null, flag: '' }`: the cell held nothing when the quarter was recorded. That is
  what WO-3.75 answered too once the first write was five minutes clear, and with the guard gone it is
  the answer at any distance, because under the seal a cell that held anything at the recording keeps
  that version on its trail (a cell cleared with no past is a deleted key, which is nothing). An
  earlier build's first write at R−1min replaced at R+2min reads as blank → 8, the exception above in
  its other shape, and accepted with it.

  A COLUMN COMMITTED SINCE THE MOMENT still answers `then: null` for every cell written since
  (WO-3.75): it was held at some point in between, and a held write replaces however long since
  (WO-3.52) — the seal applies to the ordinary branch only — so nothing on the trail is a version the
  recording saw.

  A CELL THAT ENDS WHERE IT BEGAN IS NOT A CHANGE: 4 → 9 → 4 across the recording, more than five
  minutes apart, answers null. Only the two ends are compared, because only the two ends are in the
  two grades.
*/
export function scoreChangeSince(cell, moment, column) {
  const when = instantOf(moment);
  if (!isCell(cell) || !Number.isFinite(when)) return null;
  const last = instantOf(cell.at);
  if (!Number.isFinite(last) || last <= when) return null;
  const versions = earlier(cell).concat([cell]);
  let before = -1;
  versions.forEach((version, i) => {
    const stamped = instantOf(version.at);
    if (!Number.isFinite(stamped) || stamped <= when) before = i;
  });
  const now = scoreOf(cell);
  const committed = column ? instantOf(column.committedAt) : NaN;
  if (Number.isFinite(committed) && committed > when) return { then: null, now: now };
  const then = before < 0 ? { v: null, flag: '' } : scoreOf(versions[before]);
  if (then.v === now.v && then.flag === now.flag) return null;
  return { then: then, now: now };
}

/* createElement and textContent, never innerHTML: a note inside a version is typed by a teacher. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* One version as it reads in the trail: *Missing*, *Excused*, *Excused, 62 kept*, *Late, 70*, *88*, or
   *Blank* for a cell that was cleared. An excused cell may carry the score it had (WO-3.68), and the
   trail says it with the word `kept` — the grid strikes that number through, and a line of text
   cannot, so the word is what keeps *Excused, 62* from reading like *Late, 70*: one counted and one
   did not. The note is said only where it changed from the version before, so a note that rode
   through three revisions is read once rather than three times. */
function versionWords(version, before) {
  const flag = flagWord(version);
  const value = valueIn(version);
  let words = flag === 'missing' ? 'Missing'
    : flag === 'excused' ? 'Excused' + (value === null ? '' : ', ' + value + ' kept')
      : flag === 'late' ? 'Late' + (value === null ? '' : ', ' + value)
        : value === null ? 'Blank' : String(value);
  const note = noteOf(version);
  if (note && note !== noteOf(before)) words += ' — “' + note + '”';
  return words;
}

/* `(Sep 14)` from the version's own `at` — the date part of a local stamp is the teacher's own
   calendar day, so it is read straight off the string rather than through a Date. A version written
   before this build has no `at` and says so. */
function versionDate(version) {
  const day = typeof version.at === 'string' ? shortDate(version.at.slice(0, 10)) : '';
  return day ? ' (' + day + ')' : ' (undated)';
}

/* One cell of the document, through the guard every reader of `scores` uses. Not imported from
   src/scores.js: that file imports this one. */
function cellIn(doc, assignmentId, studentId) {
  const column = doc && doc.scores ? doc.scores[assignmentId] : null;
  if (!column || !Object.prototype.hasOwnProperty.call(column, studentId)) return null;
  const cell = column[studentId];
  return isCell(cell) ? cell : null;
}

/*
  THE CHANGED SCORES ON ONE STUDENT'S RECORD, as a card for student detail — each assignment whose
  cell has an earlier version, in the order the document holds the open class's work in the open
  term (the grid's column order), with its trail under it, oldest first and ending with what the
  cell holds now: *Missing (Sep 14) → Late, 70 (Sep 20) → 88 (Oct 1)*.

  NULL WHEN THERE IS NOTHING TO DRAW — no changed score, or presentation mode — the same answer for
  both, so the card's absence on a projected screen says nothing about whether a score changed.

  IT WEARS `.log-card`, THE PRINT GATE, for the reason the notes card does: history goes to no print
  surface (WO-3.33's last deliverable), and src/detail.css's print block already hides that class.
  studentCsv() names its own columns and none of them is this.
*/
export function scoreHistoryCard(doc, cls, termId, studentId) {
  if (!scoreHistoryVisible() || !doc || !cls || !termId) return null;
  const work = (Array.isArray(doc.assignments) ? doc.assignments : [])
    .filter((a) => a && a.classId === cls.id && a.termId === termId);
  const rows = [];
  work.forEach((a) => {
    const cell = cellIn(doc, a.id, studentId);
    const past = earlier(cell);
    if (past.length) rows.push({ assignment: a, versions: past.concat([cell]).map(versionOf) });
  });
  if (!rows.length) return null;

  const card = el('div', 'detail-card log-card');
  /* What tells this card apart from the others wearing `.log-card` — read by
     tools/verify/score-history.mjs, and not a delegated hook: there is no control on it. */
  card.setAttribute('data-score-history-card', '');
  card.append(el('div', 'detail-card-title', 'Changed scores'));
  rows.forEach((row) => {
    const line = el('div', 'detail-history-row');
    line.setAttribute('data-score-history-row', row.assignment.id);
    line.append(el('span', 'detail-missing-name', row.assignment.name || 'Untitled assignment'));
    const trail = el('span', 'detail-history-trail');
    row.versions.forEach((version, i) => {
      if (i) trail.append(el('span', 'detail-history-arrow', ' → '));
      const step = el('span', 'detail-history-step'
        + (i === row.versions.length - 1 ? ' now' : ''));
      step.setAttribute('data-score-history-step', String(i));
      step.textContent = versionWords(version, i ? row.versions[i - 1] : null) + versionDate(version);
      trail.append(step);
    });
    line.append(trail);
    card.append(line);
  });
  card.append(el('p', 'detail-card-note',
    'What each of these scores was before it was changed, oldest first and ending with what counts '
      + 'now. Only the last one counts toward the grade. A change made within five minutes of the one '
      + 'before replaces it rather than adding a step. Like a note on a score, this stays on your '
      + 'screen: not on the printed sheet, not in the CSV, and no message template can reach it.'));
  return card;
}
