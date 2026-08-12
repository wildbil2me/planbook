/*
  Grade arithmetic — the pure, shared answer to what one student's recorded work means.

  WHY THIS IS ITS OWN FILE. Scores are written by the grid, displayed by several later screens,
  and reused by signals and merge fields. If any of those consumers sums cells for itself, the
  first blank, excused score or empty category makes two parts of the app disagree. This module
  reads a document and returns numbers; it has no store, DOM or clock.

  IT SAID "NUMBERS ONLY" UNTIL WO-3.7, and now says "numbers", because two of that work order's
  three additions answer with something that is not one: openWork() returns assignment IDS with a
  state per row, and nextBandFor() returns the letter of the band above. Both are still answers to
  arithmetic questions — which work is unfinished, and which boundary is next — and neither carries
  a student's name or an assignment's; the band letter is the one string here a teacher typed, and
  it comes back out of the scale unaltered exactly as letterFromPercentage()'s does. What has not
  moved is the rule underneath: no consumer of this module may sum a cell, resolve a band, or
  decide for itself what "not graded yet" means.

  A CELL IS ALWAYS AN OBJECT. There is deliberately no compatibility branch for bare numbers:
  accepting two shapes here would preserve malformed data and make every later grade depend on
  which path wrote the cell. A missing key and `{ v: null }` are both ungraded; only the explicit
  `missing` flag turns a null value into zero.

  EXTRA CREDIT HAS NO SPECIAL CASE. A scored zero-point assignment adds to earned while adding
  nothing to possible. Summing before dividing therefore permits category and class percentages
  above 100, while a category whose total possible is zero has no percentage and redistributes.
*/

import { categoriesOf, formatWeight, isBalanced, weightTotal } from './categories.js';
import { bandRanges, letterFor, scaleForClass } from './letter-scale.js';

function arrayOf(value) { return Array.isArray(value) ? value : []; }

/* A malformed numeric field becomes an honest zero instead of allowing NaN to poison every
   category after it. No value is clamped: negative or above-possible scores remain what was
   recorded, just as extra-credit scores do. */
function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function assignmentsFor(doc, cls, termId, categoryId) {
  const classId = cls && cls.id;
  return arrayOf(doc && doc.assignments).filter((assignment) => assignment
    && assignment.classId === classId
    && assignment.termId === termId
    && assignment.categoryId === categoryId);
}

function scoreCell(doc, assignmentId, studentId) {
  const byAssignment = doc && doc.scores && doc.scores[assignmentId];
  if (!byAssignment || !Object.prototype.hasOwnProperty.call(byAssignment, studentId)) return null;
  const cell = byAssignment[studentId];
  return cell && typeof cell === 'object' && !Array.isArray(cell) ? cell : null;
}

/* The full fraction is exported because later detail screens need to show arithmetic, while
   categoryPercentage() remains the small numeric answer most consumers want. */
export function categoryResult(doc, cls, termId, categoryId, studentId) {
  let earned = 0;
  let possible = 0;

  assignmentsFor(doc, cls, termId, categoryId).forEach((assignment) => {
    const cell = scoreCell(doc, assignment.id, studentId);
    if (!cell || cell.flag === 'excused') return;

    if (cell.flag === 'missing') {
      possible += numberOrZero(assignment.points);
      return;
    }

    if (cell.v === null || cell.v === undefined) return;
    earned += numberOrZero(cell.v);
    possible += numberOrZero(assignment.points);
  });

  return {
    earned,
    possible,
    percentage: possible === 0 ? null : earned / possible * 100,
  };
}

export function categoryPercentage(doc, cls, termId, categoryId, studentId) {
  return categoryResult(doc, cls, termId, categoryId, studentId).percentage;
}

/* The mapping stays in letter-scale.js. Routing through scaleForClass() preserves an explicitly
   empty per-class override instead of silently falling back to the document-wide bands. */
export function letterFromPercentage(doc, cls, percentage) {
  return letterFor(percentage, scaleForClass(doc, cls));
}

/*
  THE NEXT BAND UP, which is the target every "what it would take to move" figure is solved against
  (WO-3.7). Same shape as letterFromPercentage() above and here for the same reason: the class's own
  bands beat the document's, and a screen that resolved that for itself would be the second copy of
  the override rule.

  The lowest reachable boundary STRICTLY above the percentage, or null when there is nothing above
  it. Reachability comes out of letter-scale.js's own pass rather than from a comparison here — a
  band nobody can reach (A 93, B+ 95) is not a band a student can be told to aim for, and the module
  that decides which those are is the one that draws the ranges in the editor.
*/
export function nextBandFor(doc, cls, percentage) {
  const n = Number(percentage);
  if (!Number.isFinite(n)) return null;
  const scale = scaleForClass(doc, cls);
  const ranges = bandRanges(scale);
  let best = null;
  ranges.forEach((range, i) => {
    if (!range.reachable || range.from === null || !(range.from > n)) return;
    if (best === null || range.from < best.min) {
      best = { letter: String((scale[i] && scale[i].letter) || ''), min: range.from };
    }
  });
  return best;
}

/* ────────────────────────────── what is still open ──────────────────────────────

   ONE STUDENT'S UNFINISHED WORK, and it is here rather than on the screen that asks for it because
   the test for "not graded yet" is the same branch categoryResult() above grades by: no cell at
   all, or a cell whose value is null with no flag on it. A second copy of that branch on a detail
   screen is how a page comes to disagree with the grade printed an inch above it the first time a
   `late` blank turns up.

   THREE STATES, and the third is why bonus work needs a line of its own:

     `missing`  is GRADED — a zero out of the full points, already in the grade, and only ever there
                because the teacher marked it (CLAUDE.md; nothing here reads a date).
     `open`     is ungraded work worth points. This is the only state a "score X% on what is left"
                figure can be computed over.
     `bonus`    is ungraded work worth ZERO points, which is how extra credit is written down here.
                75% of nothing is nothing, so folding it into that figure would put a piece of work
                in the arithmetic that cannot move it — design/mockups/README.md's tenth open
                question, answered by keeping it out and naming it separately.

   `excused` work is in none of them: it is out of the grade entirely, in both directions, so it is
   neither owed nor outstanding.

   Ids and points, never names — a name is the screen's business, and this module has no strings in
   it that a teacher typed. */
export function openWork(doc, cls, termId, studentId) {
  const rows = [];
  categoriesOf(cls).forEach((category) => {
    const categoryId = category && category.id;
    assignmentsFor(doc, cls, termId, categoryId).forEach((assignment) => {
      const cell = scoreCell(doc, assignment.id, studentId);
      const points = numberOrZero(assignment.points);
      if (cell && cell.flag === 'excused') return;
      if (cell && cell.flag === 'missing') {
        rows.push({ id: assignment.id, categoryId: categoryId, points: points, state: 'missing' });
        return;
      }
      if (cell && cell.v !== null && cell.v !== undefined) return;
      rows.push({ id: assignment.id, categoryId: categoryId, points: points,
        state: points === 0 ? 'bonus' : 'open' });
    });
  });
  return rows;
}

function pointsOfState(rows, categoryId, state) {
  return rows.filter((row) => row.categoryId === categoryId && row.state === state)
    .reduce((sum, row) => sum + row.points, 0);
}

function noGrade(reason, message, total, categories) {
  return { percentage: null, letter: null, reason, message, weightTotal: total, categories };
}

/* Empty categories redistribute because the weighted sum is divided by the weights of categories
   with a real percentage, not by 100. That calculation is allowed only after isBalanced() agrees
   with the category editor; duplicating its equality rule here would eventually make the banner
   and the grade disagree for decimal weights.

   `plan` is null for the real grade and an object for a projection — see projectedClassGrade()
   below. It is one function rather than two because a projection that walked its own categories
   would be a second weighted average, and the whole point of the figure is that it is the same
   arithmetic with different numbers in it. */
function weighted(doc, cls, termId, studentId, plan) {
  const total = weightTotal(cls);
  if (!isBalanced(cls)) {
    return noGrade('weights-unbalanced',
      'The category weights total ' + formatWeight(total) + '%, so there is no grade yet.', total, []);
  }

  const open = plan ? openWork(doc, cls, termId, studentId) : null;
  const categories = categoriesOf(cls).map((category) => {
    const result = categoryResult(doc, cls, termId, category && category.id, studentId);
    let earned = result.earned;
    let possible = result.possible;
    if (plan) {
      const id = category && category.id;
      /* Outstanding work scored at `outstanding` adds to BOTH sides: it is work that has not been
         handed in, so its points are not yet in the denominator either. */
      if (plan.outstanding !== null && plan.outstanding !== undefined) {
        const owed = pointsOfState(open, id, 'open');
        earned += numberOrZero(plan.outstanding) * owed;
        possible += owed;
      }
      /* Work already marked missing adds to the NUMERATOR only. Its points are in `possible`
         already — that is what marking it missing did — so counting them twice would make handing
         work in look like it dilutes the grade. */
      if (plan.missing !== null && plan.missing !== undefined) {
        earned += numberOrZero(plan.missing) * pointsOfState(open, id, 'missing');
      }
    }
    return {
      id: category && category.id,
      name: category && category.name,
      weight: numberOrZero(category && category.weight),
      earned: earned,
      possible: possible,
      percentage: possible === 0 ? null : earned / possible * 100,
      effectiveWeight: null,
      contribution: null,
    };
  });
  const active = categories.filter((category) => category.percentage !== null);
  const activeWeight = active.reduce((sum, category) => sum + category.weight, 0);
  if (!active.length || activeWeight === 0) {
    return noGrade('no-graded-work', 'There is no graded work yet.', total, categories);
  }

  let percentage = 0;
  active.forEach((category) => {
    category.effectiveWeight = category.weight / activeWeight * 100;
    category.contribution = category.percentage * category.weight / activeWeight;
    percentage += category.contribution;
  });

  return {
    percentage,
    letter: letterFromPercentage(doc, cls, percentage),
    reason: null,
    message: null,
    weightTotal: total,
    categories,
  };
}

export function weightedClassGrade(doc, cls, termId, studentId) {
  return weighted(doc, cls, termId, studentId, null);
}

/*
  THE SAME GRADE WITH DIFFERENT NUMBERS IN IT — what this student would have if the work that is
  still open were scored at a given rate, and what they would have if the work marked missing were
  handed in (WO-3.7).

  `plan` carries two rates, each 0..1, and each one may be null meaning "leave that half alone":

    { outstanding: 0.75 }   score 75% on everything not yet graded
    { missing: 1 }          hand in every piece marked missing and score it in full

  IT IS LINEAR IN EITHER RATE, and that is what makes WO-3.7's third acceptance line — "the figure
  is reproducible by hand" — something a guardian can check with a calculator rather than take on
  trust. Each category's percentage becomes (earned + rate x owed) / (possible + owed), which is a
  straight line in `rate` because `owed` does not depend on it, and the weighted average of straight
  lines is a straight line. So the score needed to reach a band is solved rather than searched for:
  take the grade at 0 and the grade at 1, and the answer is where the line between them crosses.

  WHICH CATEGORIES COUNT DOES NOT MOVE WITH THE RATE either, which is the other half of the same
  fact: a category with outstanding work has a denominator whether the rate is 0 or 1, so the
  redistribution above is settled before the line is drawn.
*/
export function projectedClassGrade(doc, cls, termId, studentId, plan) {
  return weighted(doc, cls, termId, studentId, plan || {});
}
