/*
  Grade arithmetic — the pure, shared answer to what one student's recorded work means.

  WHY THIS IS ITS OWN FILE. Scores are written by the grid, displayed by several later screens,
  and reused by signals and merge fields. If any of those consumers sums cells for itself, the
  first blank, excused score or empty category makes two parts of the app disagree. This module
  reads a document and returns numbers only; it has no store, DOM or clock.

  A CELL IS ALWAYS AN OBJECT. There is deliberately no compatibility branch for bare numbers:
  accepting two shapes here would preserve malformed data and make every later grade depend on
  which path wrote the cell. A missing key and `{ v: null }` are both ungraded; only the explicit
  `missing` flag turns a null value into zero.

  EXTRA CREDIT HAS NO SPECIAL CASE. A scored zero-point assignment adds to earned while adding
  nothing to possible. Summing before dividing therefore permits category and class percentages
  above 100, while a category whose total possible is zero has no percentage and redistributes.
*/

import { categoriesOf, formatWeight, isBalanced, weightTotal } from './categories.js';
import { letterFor, scaleForClass } from './letter-scale.js';

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

function noGrade(reason, message, total, categories) {
  return { percentage: null, letter: null, reason, message, weightTotal: total, categories };
}

/* Empty categories redistribute because the weighted sum is divided by the weights of categories
   with a real percentage, not by 100. That calculation is allowed only after isBalanced() agrees
   with the category editor; duplicating its equality rule here would eventually make the banner
   and the grade disagree for decimal weights. */
export function weightedClassGrade(doc, cls, termId, studentId) {
  const total = weightTotal(cls);
  if (!isBalanced(cls)) {
    return noGrade('weights-unbalanced',
      'The category weights total ' + formatWeight(total) + '%, so there is no grade yet.', total, []);
  }

  const categories = categoriesOf(cls).map((category) => {
    const result = categoryResult(doc, cls, termId, category && category.id, studentId);
    return {
      id: category && category.id,
      name: category && category.name,
      weight: numberOrZero(category && category.weight),
      earned: result.earned,
      possible: result.possible,
      percentage: result.percentage,
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
