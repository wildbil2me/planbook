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
      second digit of a two-digit score.
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

/*
  THE RULE, for every path that writes a score cell. `old` is the cell as stored (or nothing);
  `next` is the cell the writer wants — a value, a flag and a note, or null for "no value, no flag,
  no note". `now` is a Date, and defaults to the device clock.

  Answers `{ write: false }` when the document must not be touched at all, or `{ write: true, cell }`
  where `cell` is what to store under the key — or null, which means delete the key.
*/
export function reviseCell(old, next, now) {
  const at = now instanceof Date ? now : new Date();
  const was = isCell(old) ? old : null;
  const want = isCell(next) ? next : { v: null };

  if (!was) {
    if (isBlank(want)) return { write: false };
    return { write: true, cell: Object.assign(versionOf(want), { at: localStamp(at) }) };
  }
  if (sameContent(was, want)) return { write: false };

  let past = earlier(was).map(versionOf);
  let cell;
  const stamped = typeof was.at === 'string' ? Date.parse(was.at) : NaN;
  const since = at.getTime() - stamped;
  if (Number.isFinite(stamped) && since >= 0 && since < REVISION_WINDOW_MS) {
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

/* createElement and textContent, never innerHTML: a note inside a version is typed by a teacher. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* One version as it reads in the trail: *Missing*, *Excused*, *Late, 70*, *88*, or *Blank* for a cell
   that was cleared. The note is said only where it changed from the version before, so a note that
   rode through three revisions is read once rather than three times. */
function versionWords(version, before) {
  const flag = flagWord(version);
  const value = valueIn(version);
  let words = flag === 'missing' ? 'Missing'
    : flag === 'excused' ? 'Excused'
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
