/*
  Recorded quarters — what the teacher keyed into the SIS, and whether Planbook still agrees (WO-3.72).

  ── WHY THIS EXISTS ──

  Grades are re-keyed into Blackbaud by hand, and once a quarter is keyed, any later change here — a
  score, an excuse, a weight, the letter scale, a drop count — leaves two grades for one student with
  nothing on screen to say so. Grade changes after a quarter ends are allowed and normal for about two
  weeks (plans/closing-a-quarter.md, ruling 1), so the answer is A RECORD AND A REMINDER, NEVER A
  LOCK. Nothing in this file refuses an edit, and nothing anywhere else may start to on its account.

  ── WHAT IS IN `termRecords[]` ──

  `{ id, classId, termId, at, grades: [{ studentId, percentage, letter }] }`, one entry per tap of
  *Record grades* — docs/data-model.md § Recording a quarter's grades has the rulings. The block is
  CREATED BY ITS FIRST WRITE AND NEVER SEEDED (CLAUDE.md, WO-6.1's scar): newYearDocument() gains
  nothing and SCHEMA_VERSION does not move, so every backup written by every earlier build restores
  and reads as unrecorded through every reader below — an absent key is an empty list.

  A RECORDING IS A FACT THE TEACHER DID, like a contact log entry, so storing it is consistent with
  "everything the teacher did not type is computed at render": the live grade is still computed,
  and the record is what she confirmed she keyed.

  ── APPEND-ONLY, AND THERE IS NOTHING HERE TO EDIT WITH ──

  The log's shape (WO-4.4, src/log.js): this module exports ONE writer, recordTerm(), and it does
  exactly one thing to the document — `push` — inside one update(). There is no updater, no delete
  and no lookup of a record by its id anywhere in the file, so append-only is a property of what is
  here rather than a promise made about it. A second recording is a second entry and THE NEWEST WINS;
  the history is kept so that a reversal loses nothing, and NO SCREEN READS IT (the owner,
  2026-10-23 — revisit at year end, plans/future-features.md § 6). That is why no reader below hands
  back the whole array: there is newestRecord() and nothing older.

  ── WHETHER A QUARTER STILL MATCHES IS DERIVED, NEVER STORED ──

  noLongerMatching() asks the engine for every live grade at read time and compares it against the
  newest record. No edit path sets a "changed" bit, so no edit path can forget to — a cached flag is
  the second truth CLAUDE.md refuses everywhere (WO-4.3's concern state is the same rule). BOTH the
  percentage and the letter are compared: a percentage that moves inside the same letter is a change
  (the owner, 2026-10-23, follow-up 1).

  ── WHAT THIS FILE IS NOT ──

  IT IS NOT THE GRADE ENGINE, AND IT MUST NEVER BE FOLDED INTO IT. src/grade-engine.js reads no
  clock, and the two term-end readers here do. The import runs one way: this file imports the engine
  and the attendance date helper, and nothing in the engine imports this file back.

  IT HAS NO DOM AND NO SCREEN. The bar, the dialog and the notice are WO-3.73 and WO-3.74, and they
  draw from these readers and compute nothing — a screen that re-ran the comparison would be the
  second opinion that lets the bar and the dialog disagree about who changed.

  IT HANDS BACK IDS AND FIGURES, NEVER A NAME. A student is a `studentId`; a category and a held
  column carry their teacher-typed names because that is the whole of the line they feed. Whether a
  name may be on screen under a projector is the screen's question, and the screens WO-3.73 and
  WO-3.74 draw are refused there.
*/

import { getDoc, update, newId } from './store.js';
import { classGrade, openWork, isHeld } from './grade-engine.js';
import { categoriesOf } from './categories.js';
/* What "dated" means for a term, asked rather than re-tested: src/classes.js owns the term shape. */
import { termIsDated } from './classes.js';
/* The attendance date helper the work order names: today as a LOCAL date, never toISOString(). */
import { todayISO } from './attendance.js';
/* THE TWO DECIMALS THE SCREENS PRINT, imported rather than re-declared. A record and a live grade
   are the same figure when the score grid would print them the same, so the comparison goes through
   the grid's own formatter; a second rounding here is a second opinion about what "the same" means.
   Importing a screen module for it is the established shape — src/signals.js, src/grading-mode.js
   and src/merge-fields.js all do — and nothing in src/scores.js's graph reaches this file. */
import { formatPercent } from './scores.js';
/* The log's clock, for `at`: a local ISO timestamp with its offset, never a `Z`. */
import { localStamp } from './log.js';

function arrayOf(value) { return Array.isArray(value) ? value : []; }

/* The class's own term by id, or null. A term this class does not have is not one it can record. */
function termOf(cls, termId) {
  return arrayOf(cls && cls.terms).filter((term) => term && term.id === termId)[0] || null;
}

/*
  THE STUDENTS ON THIS CLASS'S ROSTER, IN ROSTER ORDER — ids only, with an id that names nobody
  dropped and a repeated id taken once, the tolerance src/roster.js's studentsOf() has. A dangling id
  is reachable (a backup from a build that deleted a student differently, a hand-edited file) and
  has no grade to record.

  THE ROSTER IS THE WHOLE OF WHO IS ASKED ABOUT, in both the writer and noLongerMatching(), and that
  is the owner's ruling of 2026-10-23 made structural: a student recorded in a quarter who has since
  LEFT the roster is left out — not reported as changed, not counted, not listed. A withdrawal is
  Blackbaud's business, and a reminder that cannot be cleared is worse than none. So nothing in this
  file walks a record's own `grades[]` looking for people; it is only ever searched for a student the
  roster already named.
*/
function rosterIds(doc, cls) {
  const known = arrayOf(doc && doc.students).map((s) => s && s.id);
  return arrayOf(cls && cls.roster)
    .filter((id, at, all) => known.indexOf(id) !== -1 && all.indexOf(id) === at);
}

/* The two figures this file compares, out of one classGrade() answer, and nothing else of it. */
function figuresOf(grade) {
  return { percentage: grade ? grade.percentage : null, letter: grade ? grade.letter : null };
}

/* ────────────────────────────── the record ────────────────────────────── */

/*
  ONE ENTRY, EXACTLY THE FIVE FIELDS docs/data-model.md NAMES, in that order and no others.

  WHO IS IN IT: every student on the roster whose classGrade() has a percentage, in roster order.
  A student with no grade has nothing to key into the SIS and is not in the record. Each figure is
  classGrade()'s OWN `percentage` and `letter`, unrounded and unaltered — never a second computation —
  so the record is the float the engine produced, and the comparison below rounds both sides the same
  way at read time.

  AN EMPTY `grades` IS STILL A RECORD. A class with nothing graded that the teacher records anyway
  has keyed nothing, which is the truth, and refusing the write would leave a bar that asks for a
  recording no tap could ever clear.
*/
function newTermRecord(doc, cls, termId, at) {
  return {
    id: newId('tr'),
    classId: String(cls.id),
    termId: String(termId),
    at: at || localStamp(),
    grades: rosterIds(doc, cls)
      .map((studentId) => ({ studentId: studentId, grade: classGrade(doc, cls, termId, studentId) }))
      .filter((row) => row.grade.percentage !== null)
      .map((row) => ({ studentId: row.studentId, percentage: row.grade.percentage,
        letter: row.grade.letter })),
  };
}

/*
  THE ONE WRITER. Records one class's term and returns the entry, or null when there is no document,
  no class, or the term is not one of this class's.

  It is a `push` inside one update(), which is the only shape this operation has — see the header.
  The grades are worked out before the update() from the document as it stands, which is the
  document the teacher was looking at when she tapped.

  IT DOES NOT ASK WHETHER THE TERM HAS ENDED. When to OFFER a recording is the bar's question
  (WO-3.73); the writer records what it is asked to, so a teacher who keys a quarter a day early is
  not refused by a clock.
*/
export function recordTerm(cls, termId) {
  const doc = getDoc();
  if (!doc || !cls || !cls.id || !termOf(cls, termId)) return null;
  const entry = newTermRecord(doc, cls, termId);
  update((d) => {
    if (!Array.isArray(d.termRecords)) d.termRecords = [];
    d.termRecords.push(entry);
  });
  return entry;
}

/* ────────────────────────────── reading it back ────────────────────────────── */

/*
  HAS THE TERM ENDED, AND DOES IT END TODAY — two readers, because the bar has two wordings for them
  (plans/closing-a-quarter.md, the drawing's question 1): on the end date itself *Quarter 1 ends
  today*, and from the next day *has ended*. So `ended` is strictly after the end date, and the end
  date is `endsToday` and not yet `ended`. Both are false for an undated term or one the class does
  not have, and false before the end date.

  `today` is an ISO date and defaults to todayISO() — the LOCAL date, which is the whole reason that
  helper exists. A caller may pass one, which is how an as-of question is asked; dates compare as
  strings, the way every date comparison in this app does.
*/
function termEnd(cls, termId) {
  const term = termOf(cls, termId);
  return termIsDated(term) ? String(term.end) : '';
}

export function termEnded(cls, termId, today) {
  const end = termEnd(cls, termId);
  return !!end && end < String(today || todayISO());
}

export function termEndsToday(cls, termId, today) {
  const end = termEnd(cls, termId);
  return !!end && end === String(today || todayISO());
}

/*
  THE NEWEST RECORD FOR ONE CLASS AND TERM — a copy of it, or null when it was never recorded (which
  includes every document with no `termRecords` key at all).

  NEWEST BY `at`, AND THE TIE GOES TO THE LATER WRITE, which is src/log.js's rule and for its reason:
  localStamp() is second-granular, so two recordings in one sitting carry the same `at`, and the
  second is the one the teacher meant. Array order is write order, so a walk that takes a later
  entry on `>=` resolves the tie the right way without sorting anything.

  A COPY, NOT THE STORED OBJECT, because nothing in the app edits a record and a caller handed the
  document's own entry is one assignment away from doing so.
*/
export function newestRecord(doc, cls, termId) {
  const classId = cls && cls.id;
  let newest = null;
  arrayOf(doc && doc.termRecords).forEach((entry) => {
    if (!entry || typeof entry !== 'object' || entry.classId !== classId || entry.termId !== termId) {
      return;
    }
    if (newest === null || String(entry.at || '') >= String(newest.at || '')) newest = entry;
  });
  if (!newest) return null;
  return {
    id: newest.id,
    classId: newest.classId,
    termId: newest.termId,
    at: newest.at,
    grades: arrayOf(newest.grades).filter((g) => !!g && typeof g === 'object')
      .map((g) => ({ studentId: g.studentId, percentage: g.percentage, letter: g.letter })),
  };
}

/*
  ARE TWO GRADES THE SAME GRADE — the percentage as the screens print it, and the letter.

  AT THE TWO DECIMALS THE SCREENS PRINT, so a float that prints the same is never a change: the
  engine's arithmetic can land a hair apart on two paths to one grade, and a teacher cannot act on a
  difference she cannot see on any screen or key into the SIS. A null percentage — a student with no
  grade — matches only another null.
*/
function sameFigures(a, b) {
  const pa = a.percentage === null || a.percentage === undefined ? '' : formatPercent(a.percentage);
  const pb = b.percentage === null || b.percentage === undefined ? '' : formatPercent(b.percentage);
  return pa === pb && String(a.letter == null ? '' : a.letter) === String(b.letter == null ? '' : b.letter);
}

/*
  THE STUDENTS WHO NO LONGER MATCH THE NEWEST RECORD — one row each, in roster order:

    { studentId, recorded: { percentage, letter } | null, live: { percentage, letter } }

  or NULL when the term was never recorded, which is a different answer from `[]` and must stay one:
  "nobody changed" and "nothing to compare with" are the bar's two different wordings.

  WHO IS ASKED: the class's CURRENT ROSTER, and only it (rosterIds(), and the owner's ruling there).
  A row is a student who —
    · has a grade now and was not in the record (`recorded: null`): someone who joined the class or
      was first graded after the recording;
    · was in the record and whose live percentage or letter differs from it — including a live grade
      that has GONE, `live: { percentage: null, letter: null }`, because Blackbaud still holds what was
      keyed and Planbook now holds nothing, which is two grades for one student in the plainest form.
  A student with no grade now and none recorded is not a row: there is nothing on either side.

  EVERY FIGURE IS THE ENGINE'S. `live` is classGrade()'s own pair and `recorded` is the record's own
  pair, unrounded; only the comparison rounds, and it rounds both sides through one formatter.
*/
export function noLongerMatching(doc, cls, termId) {
  const record = newestRecord(doc, cls, termId);
  if (!record) return null;
  return rosterIds(doc, cls).map((studentId) => {
    const live = figuresOf(classGrade(doc, cls, termId, studentId));
    const kept = record.grades.filter((g) => g.studentId === studentId)[0];
    const recorded = kept ? { percentage: kept.percentage, letter: kept.letter } : null;
    if (!recorded && live.percentage === null) return null;
    if (recorded && sameFigures(recorded, live)) return null;
    return { studentId: studentId, recorded: recorded, live: live };
  }).filter((row) => row !== null);
}

/*
  THE EMPTY BOXES IN A CLASS'S TERM — `{ count, categories: [{ id, name }] }`, for the line *There are
  7 empty boxes in Q1, across Exams and Projects.* (the owner, 2026-10-23: the count and the
  categories, no assignment names, no door).

  EMPTY IS: no score, and not marked `excused` or `missing`, in a live column (follow-up 2). A `late`
  mark with no score IS empty — the owner marks late on a scored cell as a cue, so a late alone is
  work with no score in it. A DROPPED cell never is, because only a scored cell is ever dropped.

  IT ASKS THE ENGINE RATHER THAN TESTING A CELL. openWork() already answers "which of this student's
  work is not graded yet" through the engine's one branch for it — `open`, and `bonus` for zero-point
  work, are exactly the cells with no score and no excused or missing flag, and a held column is not
  in it at all because the engine took it out (WO-3.52). A second copy of that test here would be how
  the record's line and the queue's *N to grade* come to disagree about one cell.

  TWO LIMITS THAT FOLLOW, stated rather than worked around. Work filed under NO CATEGORY is not
  counted — openWork() lists categorized work only, which is the queue's limit too, and the line names
  categories so a loose piece would have none to be named under. And every roster student is asked,
  graded or not: an ungraded student's empty boxes are still boxes nobody has filled.

  The categories come back in the class's own order, each named once, only where an empty box is.
*/
export function emptyBoxes(doc, cls, termId) {
  const rows = rosterIds(doc, cls)
    .map((studentId) => openWork(doc, cls, termId, studentId)
      .filter((row) => row.state === 'open' || row.state === 'bonus'))
    .reduce((all, some) => all.concat(some), []);
  const categories = categoriesOf(cls)
    .filter((category) => category && rows.some((row) => row.categoryId === category.id))
    .map((category) => ({ id: category.id, name: String(category.name == null ? '' : category.name) }));
  return { count: rows.length, categories: categories };
}

/*
  THE HELD COLUMNS IN A CLASS'S TERM, BY NAME — `[{ id, name }]` in document order (the order the
  score grid draws columns in), for the dialog's own line: *1 held column, Vocabulary Quiz 4, is not
  committed, so it counts toward none of these grades.*

  A held column's cells are not empty boxes (emptyBoxes() above never sees them), and this is the
  reader of their own the work order names: a held column is the one case where work with scores in
  it is still not in the grade. Asked through isHeld(), the one reader of `held` (wo-sweep.mjs § 30).
  A held column is uncommitted by definition — a commit deletes the key — so there is no third state.
*/
export function heldColumns(doc, cls, termId) {
  const classId = cls && cls.id;
  return arrayOf(doc && doc.assignments)
    .filter((a) => a && a.classId === classId && a.termId === termId && isHeld(a))
    .map((a) => ({ id: a.id, name: String(a.name == null ? '' : a.name) }));
}
