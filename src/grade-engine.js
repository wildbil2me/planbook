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

/*
  WORK FILED UNDER NO CATEGORY THIS CLASS HAS (WO-3.30) — the same test src/assignments.js draws its
  red "Not in a category" group by: the assignment's categoryId is none of this class's category
  ids, which covers a blank one and one left behind by a deleted category alike. assignmentsFor()
  above can never return these, which is right for a weighted grade — the work carries no weight,
  so it counts toward nothing — and is why a points grade needs its own walk for them.
*/
function looseAssignments(doc, cls, termId) {
  const classId = cls && cls.id;
  const filed = categoriesOf(cls).map((category) => category && category.id);
  return arrayOf(doc && doc.assignments).filter((assignment) => assignment
    && assignment.classId === classId
    && assignment.termId === termId
    && filed.indexOf(assignment.categoryId) === -1);
}

/* The cell rule, once. categoryResult() sums a category's work through it and a points grade sums
   the uncategorized work through it, so "what a cell does to the math" (docs/data-model.md) has one
   definition however many piles it is applied to. The accumulation order is the one this file has
   always used, which is what keeps every existing grade the same float to the last digit. */
function tally(doc, assignments, studentId) {
  let earned = 0;
  let possible = 0;

  assignments.forEach((assignment) => {
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

/* The full fraction is exported because later detail screens need to show arithmetic, while
   categoryPercentage() remains the small numeric answer most consumers want. */
export function categoryResult(doc, cls, termId, categoryId, studentId) {
  return tally(doc, assignmentsFor(doc, cls, termId, categoryId), studentId);
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
    workRows(doc, assignmentsFor(doc, cls, termId, categoryId), studentId, categoryId, rows);
  });
  return rows;
}

/* openWork()'s per-assignment branch, shared with the points projection's walk over uncategorized
   work (WO-3.30) so the two cannot disagree about which state a cell is in. openWork() itself still
   walks categories only: what it returns is unchanged, and so is every screen that lists from it. */
function workRows(doc, assignments, studentId, categoryId, rows) {
  assignments.forEach((assignment) => {
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
  return rows;
}

function pointsOfState(rows, categoryId, state) {
  return rows.filter((row) => row.categoryId === categoryId && row.state === state)
    .reduce((sum, row) => sum + row.points, 0);
}

function noGrade(reason, message, total, categories) {
  return { percentage: null, letter: null, reason, message, weightTotal: total, categories };
}

/* A projection's adjustment to one pile of work — a category's, or (in points mode) the
   uncategorized pile's. `open` is that pile's own openWork-shaped rows and `id` picks them out. */
function planned(earned, possible, plan, open, id) {
  if (plan) {
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
  return { earned, possible };
}

/* One row per category the class has, in the class's order, with the fraction filled in and the two
   class-level columns left for the formula to fill. Both formulas start here, so the rows a detail
   screen draws are the same rows whichever way the class is graded. */
function categoryRows(doc, cls, termId, studentId, plan) {
  const open = plan ? openWork(doc, cls, termId, studentId) : null;
  return categoriesOf(cls).map((category) => {
    const result = categoryResult(doc, cls, termId, category && category.id, studentId);
    const sums = planned(result.earned, result.possible, plan, open, category && category.id);
    return {
      id: category && category.id,
      name: category && category.name,
      weight: numberOrZero(category && category.weight),
      earned: sums.earned,
      possible: sums.possible,
      percentage: sums.possible === 0 ? null : sums.earned / sums.possible * 100,
      effectiveWeight: null,
      contribution: null,
    };
  });
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

  const categories = categoryRows(doc, cls, termId, studentId, plan);
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

/*
  THE SECOND FORMULA — total points (WO-3.30). Everything earned over everything possible, weights
  ignored. The categories are kept: they still file the work, carry their own percentage and drive
  the grid's filter, and they are the rows a detail screen takes the grade apart into.

  THE SAME SHAPE AS weighted() RETURNS, so no caller branches on the mode. A category's
  `effectiveWeight` is its share of the total `possible` — what it actually counts at, which is the
  question that column answers in weighted mode too — and its `contribution` is its `earned` over
  the total `possible`, x100, so the contributions still add up to the grade a detail screen prints
  above them. A category with nothing graded in it has neither, exactly as in weighted mode.

  THE WEIGHTS-TOTAL-100 REFUSAL DOES NOT APPLY: there are no weights in this formula to be wrong, so
  a points class has a grade as soon as anything worth points is graded. `weightTotal` is still
  reported, because it is a fact about the class rather than about the formula. What still refuses
  is "no graded work": a total possible of zero is n/0 here exactly as it is inside one category,
  which includes a student whose only graded work is extra credit.

  UNCATEGORIZED WORK COUNTS HERE (the owner's ruling, 2026-10-02) and in weighted mode it never has —
  it carries no weight, and in this formula there is no weight for it to lack. It arrives as ONE
  MORE ROW at the foot of `categories`, `id: null`, named "no category" in the words the score grid
  and the grade sheet already print beside such work, with a weight of 0. A row rather than a
  silent addition to the totals, because "the contributions add up to the grade" is a promise the
  detail screen prints in words, and points with no row to stand in would break it there. The row is
  present only when that work has something graded in it, so a points class with nothing loose
  draws exactly the rows its categories are, and a weighted class never sees it at all.

  `percentage` is the definition — total earned / total possible x100 — rather than the running sum
  of the contributions, so the grade is the fraction a teacher would work on paper; the
  contributions agree with it to the last float digit or so, and src/detail.js's cent allocation
  already reconciles a printed column to the printed total.
*/
const LOOSE_NAME = 'no category';

function points(doc, cls, termId, studentId, plan) {
  const total = weightTotal(cls);
  const categories = categoryRows(doc, cls, termId, studentId, plan);

  const loose = looseAssignments(doc, cls, termId);
  if (loose.length) {
    const result = tally(doc, loose, studentId);
    const open = plan ? workRows(doc, loose, studentId, null, []) : null;
    const sums = planned(result.earned, result.possible, plan, open, null);
    if (sums.earned !== 0 || sums.possible !== 0) {
      categories.push({
        id: null,
        name: LOOSE_NAME,
        weight: 0,
        earned: sums.earned,
        possible: sums.possible,
        percentage: sums.possible === 0 ? null : sums.earned / sums.possible * 100,
        effectiveWeight: null,
        contribution: null,
      });
    }
  }

  let earned = 0;
  let possible = 0;
  categories.forEach((category) => {
    earned += category.earned;
    possible += category.possible;
  });
  if (possible === 0) {
    return noGrade('no-graded-work', 'There is no graded work yet.', total, categories);
  }

  categories.forEach((category) => {
    if (category.earned === 0 && category.possible === 0) return;
    category.effectiveWeight = category.possible / possible * 100;
    category.contribution = category.earned / possible * 100;
  });
  const percentage = earned / possible * 100;

  return {
    percentage,
    letter: letterFromPercentage(doc, cls, percentage),
    reason: null,
    message: null,
    weightTotal: total,
    categories,
  };
}

/* HOW A CLASS IS GRADED, and an absent key IS the default — the rule thresholdsOf() follows. The
   only value ever stored is "points"; going back to weighted deletes the key rather than writing
   "weighted", so nothing is seeded and every backup from every earlier build still restores
   (CLAUDE.md § Data, the WO-6.1 scar). Anything that is not exactly "points" reads as weighted. */
export function gradingModeOf(cls) {
  return cls && cls.gradingMode === 'points' ? 'points' : 'weighted';
}

function formulaFor(cls) {
  return gradingModeOf(cls) === 'points' ? points : weighted;
}

/*
  THE CLASS GRADE — the one function every screen, rule and merge field asks (WO-3.30). It replaced
  the weighted-only entry point WO-3.4 shipped, which was removed rather than kept beside it: two
  names for one answer is how a screen comes to disagree with the one next to it, and wo-sweep.mjs
  keeps the old name out of src/ entirely — not even a comment may spell it.
*/
export function classGrade(doc, cls, termId, studentId) {
  return formulaFor(cls)(doc, cls, termId, studentId, null);
}

/*
  EACH CATEGORY'S SHARE OF THE POINTS ASSIGNED IN THE TERM SO FAR — what a points class's categories
  editor shows where a weighted class shows weights (WO-3.30 exports it; WO-3.31 draws it and does
  no arithmetic of its own). A property of the assignments, not of any student: every assignment
  in the class and term counts at its full points, graded or not, because the question is how the
  term's work is divided up rather than how any one student did. "So far" is whatever has been
  created — this module reads no clock, and a share must not move because a date rolled over.

  One row per category in the class's order, `{ id, name, points, share }`, then a `{ id: null,
  name: "no category" }` row when uncategorized work holds points — the same row classGrade() adds,
  for the same reason: in points mode that work counts, so the shares only add up to 100 with it.
  `share` is a percentage, or null for every row while the term holds no points at all.
*/
export function pointsShare(doc, cls, termId) {
  const sum = (list) => list.reduce((n, assignment) => n + numberOrZero(assignment.points), 0);
  const rows = categoriesOf(cls).map((category) => ({
    id: category && category.id,
    name: category && category.name,
    points: sum(assignmentsFor(doc, cls, termId, category && category.id)),
    share: null,
  }));
  const loosePoints = sum(looseAssignments(doc, cls, termId));
  if (loosePoints !== 0) rows.push({ id: null, name: LOOSE_NAME, points: loosePoints, share: null });
  const total = rows.reduce((n, row) => n + row.points, 0);
  if (total !== 0) rows.forEach((row) => { row.share = row.points / total * 100; });
  return rows;
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

  IN POINTS MODE THE SAME ARGUMENT HOLDS, more simply (WO-3.30): the grade is (E + rate x owed) /
  (P + owed) over the whole class, and `owed` does not depend on the rate, so it is a straight line
  and the band is still solved rather than searched. It takes the same branch classGrade() does,
  and in points mode it projects the uncategorized pile too, because that pile is in the grade.
  One honest limit: openWork() lists categorized work only, so a screen listing the open pieces
  does not name an uncategorized one the projection has counted — src/assignments.js's red
  "Not in a category" group is where that work is asked to be re-filed.
*/
export function projectedClassGrade(doc, cls, termId, studentId, plan) {
  return formulaFor(cls)(doc, cls, termId, studentId, plan || {});
}
