/*
  WHAT IS GRADED, ASKED OF THE CELLS — and the one sentence a screen says when there is no grade
  (WO-3.42, lifted out of src/detail.js where WO-3.38 wrote it).

  ── WHY THIS IS A MODULE OF ITS OWN ──

  WO-3.38 taught student detail that a bonus graded at 0 is graded. Its verifier then found two more
  screens printing the engine's no-grade sentence as the accessible name of the em dash in the grade
  column — the score grid (src/scores.js) and the grade sheet (src/grades-report.js) — and both were
  still telling a screen reader "There is no graded work yet." about a student whose only graded work
  was that 0. The owner ruled (a) at WO-3.42's dispatch: the answer moves here, ONE copy, and all three
  screens import it, so the three cannot disagree. The engine was ruled NOT to start handing this fact
  back (WO-3.38's ruling (b)), and nothing here changes src/grade-engine.js or its returned shape.

  A copy of gradedPieces() or noGradeMessage() in any screen is the defect WO-3.42 exists to stop.
  If a fourth screen needs the sentence, it imports it from here.

  ── NOTHING HERE IS GRADE ARITHMETIC ──

  src/grade-engine.js is still the only grade arithmetic in the app (WO-3.4). This file reads the
  grading MODE, asks each cell whether a score is THERE, and compares the engine's own earned and
  possible to 0. It adds nothing up, works no percentage, total or share out, and reads no score's
  value except to ask whether one exists. A function here that grew a sum would be the second grade
  calculation this app has refused since WO-3.4.

  ── WHAT IT IMPORTS, AND WHAT IT MUST NOT ──

  src/categories.js, for the class's own category list (how filed work is told from unfiled), and
  src/grade-engine.js, for gradingModeOf() and — since WO-3.53 — isHeld(), and nothing else. It
  imports NONE of the three screens that import it: src/detail.js and src/grades-report.js both
  already import src/scores.js, and a module any of them reached back into would close a loop.

  ── THE WEIGHTED GUARD LIVES HERE, NOT AT THE CALL SITES ──

  gradedPieces() answers null for a class that is not graded on total points, and asks no cell. Until
  WO-3.42 that guard was written out inline at each call site; three screens writing it three times are
  three guards that can drift apart, and the one rule they all protect is that a weighted class never
  asks — which is what keeps every weighted screen, sheet and file the bytes it always was. With the
  guard inside, no caller can ask without it.

  ── OUT OF SCOPE, BY RULING ──

  src/signals.js does NOT import this, and its quiet list keeps its own sentence for this case — the
  owner's ruling of 2026-10-03, recorded in WO-3.42's Traps.
*/

import { categoriesOf } from './categories.js';
/* The mode, and whether a column is held (WO-3.53). Nothing else from the engine is read here. */
import { gradingModeOf, isHeld } from './grade-engine.js';

/*
  WHETHER A CATEGORY ROW IS EMPTY BY THE ENGINE'S NUMBERS (WO-3.34, the points branch WO-3.35).

  In a weighted class: no percentage and no contribution. The two tests never disagree when there is a
  grade — a category contributes exactly when it has a percentage — and testing both keeps the one
  weighted state where they could part (weights at 100, every graded category at weight 0, so no grade
  and no contributions) drawing its categories' work as it always has rather than calling them empty.

  In a points class the test is the engine's own: nothing earned and nothing possible, the line
  src/grade-engine.js's points() skips a row on before it hands out shares. That is what keeps a row
  whose only graded work is extra credit — points earned, nothing possible, no grade — from being
  called "nothing graded in it yet" over a cell scored 2.

  IT READS THE ENGINE'S NUMBERS AND NOTHING ELSE, so in a points class it cannot see a bonus graded at
  0 — that adds 0 to both sides, exactly as a blank does. That is what gradedPieces() below is for.
  src/detail.js's rowShowsEmpty() is the question the breakdown and the CSV actually draw by: this
  test, and no graded cell in the row.
*/
export function rowIsEmpty(category, byPoints) {
  if (byPoints) return category.earned === 0 && category.possible === 0;
  return category.percentage === null && category.contribution === null;
}

/*
  THE SENTENCE FOR THE CASE THE ENGINE CANNOT SEE (WO-3.38): extra credit graded at 0 is the only
  graded work. The engine's "There is no graded work yet." is false about that student. One string,
  so the hero on student detail, its to-move card, the score grid's em dash and the grade sheet's em
  dash all read the same words.
*/
const POINTS_ZERO_BONUS_MESSAGE = 'The only work graded so far is extra credit, graded at 0, so there is '
  + 'no grade yet.';

/*
  WHICH ROWS HOLD A GRADED PIECE, counted off the cells themselves (WO-3.38, the owner's ruling (b);
  moved here at WO-3.42, ruling (a)). A fact src/grade-engine.js does not hand back and was ruled NOT
  to start handing back. Worked out from the class's assignments in the term and this student's cell
  on each.

  NULL IN A WEIGHTED CLASS, AND NO CELL IS READ — see this file's header. Callers pass the class as
  it is and never test the mode themselves.

  IT IS A YES/NO PER ROW, NEVER A SUM. Nothing here reads a score's value except to ask whether one is
  there; there is no earned, no possible and no percentage.

  WHAT COUNTS AS GRADED is the gradebook's own cell rule (docs/data-model.md § Grade math, and
  src/scores.js's isUngraded()), not a new one:
    - a cell holding a value is graded, with or without a `late` flag beside it;
    - `missing` is graded — it is a marked zero, the teacher's decision, and the engine counts it;
    - `excused` is NOT — it drops out of the grade entirely, in both directions;
    - a blank — no key, or a cell carrying neither a value nor a flag that means something, which
      includes a `late` with no score yet — is NOT. A blank is ungraded, and it never becomes a
      scored 0 here: that is the rule the whole gradebook rests on.

  Filed and unfiled work are told apart by the engine's own test (src/grade-engine.js's
  looseAssignments()): a categoryId that is none of this class's category ids is "no category", and
  that row is `id: null` on the grade.
*/
export function gradedPieces(doc, cls, termId, studentId) {
  if (!cls || gradingModeOf(cls) !== 'points') return null;
  const filed = categoriesOf(cls).map((category) => category && category.id);
  const ids = [];
  let loose = false;
  const assignments = doc && Array.isArray(doc.assignments) ? doc.assignments : [];
  assignments.forEach((assignment) => {
    if (!assignment || assignment.classId !== cls.id || assignment.termId !== termId) return;
    /* A HELD COLUMN HAS NO COUNTED WORK (WO-3.53, the owner's ruling of 2026-10-07). This answers
       which rows hold a graded piece, and a held column's cells are graded toward nothing — the
       engine drops it before it sums — so a row whose only work is held is empty here too, and the
       sentence a screen prints is the engine's own. Asked of isHeld(), never of the key. */
    if (isHeld(assignment)) return;
    const byStudent = doc.scores && doc.scores[assignment.id];
    if (!byStudent || !Object.prototype.hasOwnProperty.call(byStudent, studentId)) return;
    const cell = byStudent[studentId];
    if (!cell || typeof cell !== 'object' || Array.isArray(cell)) return;
    if (cell.flag === 'excused') return;
    if (cell.flag !== 'missing' && (cell.v === null || cell.v === undefined)) return;
    if (filed.indexOf(assignment.categoryId) === -1) loose = true;
    else if (ids.indexOf(assignment.categoryId) === -1) ids.push(assignment.categoryId);
  });
  return { ids: ids, loose: loose };
}

/* Whether one row of the grade holds a graded piece — the `no category` row is `id: null`. An array
   scanned by indexOf rather than an object keyed by id, so a category id that happens to read
   "constructor" finds nothing it should not. False when `graded` is null, i.e. in a weighted class. */
export function rowIsGraded(category, graded) {
  if (!graded) return false;
  return category.id === null ? graded.loose : graded.ids.indexOf(category.id) !== -1;
}

/*
  WHAT A SCREEN SAYS WHEN THERE IS NO GRADE — the engine's own sentence, except in the one case the
  engine cannot tell apart: a points class where every row is empty by its numbers and something is
  graded all the same (extra credit graded at 0, filed or not). `graded` is gradedPieces()'s answer,
  null in a weighted class, so a weighted student reads the engine's sentence exactly as before.

  One limit, stated rather than claimed away: extra credit scored +2 in one category and −2 in
  another nets the engine's earned to 0, its sentence says nothing is graded, and a row is not empty,
  so this keeps the engine's words. Negative extra credit in two places at once is the only way
  there, and fixing it means reading the engine's arithmetic back, which WO-3.38's ruling (b) refused.
*/
export function noGradeMessage(grade, graded) {
  if (graded && grade.reason === 'no-graded-work'
    && grade.categories.every((category) => rowIsEmpty(category, true))
    && (graded.loose || graded.ids.length > 0)) {
    return POINTS_ZERO_BONUS_MESSAGE;
  }
  return grade.message;
}
