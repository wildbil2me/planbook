/* grade-engine.mjs — grade engine (WO-3.4)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, evalJs, has, seam } = h;

/* ───────────────── grade engine (WO-3.4) ─────────────────
 *
 * The twelve worked cases of docs/grade-math-cases.md, driven through window.planbook.gradeEngine
 * rather than recomputed here. This section's whole reason to exist is the correction that added
 * it: src/shell.js's comment above the `gradeEngine` seam already claimed "the browser verifier
 * reads its answers through this seam so the worked cases exercise the shipped module" — and until
 * this section existed, that was false. It said 522 green checks were watching arithmetic that
 * nothing here ran.
 *
 * A CHECK THAT COMPUTED THE EXPECTED ANSWER ITSELF WOULD PROVE NOTHING — a check that summed
 * `80 * 0.5 + 90 * 0.3 + 100 * 0.2` and compared it to its own answer agrees with itself perfectly
 * and would go green against a build that got the arithmetic wrong the same way twice. Every
 * expected value below is a LITERAL NUMBER OR STRING copied out of docs/grade-math-cases.md by
 * hand — never a formula — so the module's answer is being checked against a human's arithmetic,
 * not against a second copy of the module's own logic.
 *
 * There is no UI to drive: the grade engine is pure functions over a document (WO-3.4's Out of
 * scope line is explicit that WO-3.5 renders what this computes), so each case builds the exact
 * document fragment printed in the worked-cases doc as a plain object and hands it straight to
 * classGrade() and categoryResult() — no store, no class manager, no reload. That is also
 * why this section needs no classesBooted / classSeam gate the way the sections above it do: it
 * shares no screen and no document with the rest of the run.
 *
 * ONE CLASS, ONE TERM, ONE STUDENT — c1 / t1 / s1, matching every fixture in the source document,
 * for cases 1 through 12. A cold read of this suite at WO-3.4's verification found that an engine
 * which ignored classId, termId or studentId entirely would pass all twelve; the same read
 * confirmed by direct probe that the three filters do hold. Widening those twelve fixtures to
 * prove that as a standing check was EXPLICITLY OUT OF SCOPE for that round (owner's call,
 * recorded in .claude/dispatch/WO-3.4-status.md) and was left as a proposed follow-up.
 *
 * WO-3.12 is that follow-up: case 8's third direction (decimal weights, where the formatWeight()
 * fix has room to matter) and cases 13 through 15 (a second class, a second term, a second and
 * third student), each proved red by its own mutation and tabulated in TESTING.md § WO-3.12. They
 * are NOT folded into cases 1-12 above — docs/grade-math-cases.md's own Traps line is explicit
 * that the existing dozen stay single-class, single-term, single-student, because they are the
 * hand-computed record WO-3.4 was verified against.
 */

console.log('\n--- grade engine ---');

const gradeSeam = await evalJs("!!(window.planbook && window.planbook.gradeEngine"
  + " && typeof window.planbook.gradeEngine.classGrade === 'function'"
  + " && typeof window.planbook.gradeEngine.categoryResult === 'function')");

if (!gradeSeam) {
  skip('grade engine: the twelve worked cases of docs/grade-math-cases.md',
    'no window.planbook.gradeEngine seam on the page — it is kept deliberately for this file to '
    + 'read the arithmetic through, so its absence is a defect and not a stage of the build');
} else {
  /* One round trip per case: build the fixture doc exactly as printed in the source document, ask
     classGrade() for the class-level answer and categoryResult() for each category's own
     fraction, and hand both back untouched. */
  const gradeAt = async (fixtureDoc, termId, studentId) => await evalJs(`(function(){
    var doc = ${JSON.stringify(fixtureDoc)};
    var g = window.planbook.gradeEngine;
    var cls = doc.classes[0];
    var cats = (cls.categories || []).map(function(cat){
      return { id: cat.id, result: g.categoryResult(doc, cls, ${JSON.stringify(termId)}, cat.id, ${JSON.stringify(studentId)}) };
    });
    return { grade: g.classGrade(doc, cls, ${JSON.stringify(termId)}, ${JSON.stringify(studentId)}), categories: cats };
  })()`);

  /* docs/grade-math-cases.md:6 — "the letter scale is A >= 90, B >= 80, C >= 70, and F >= 0" — used
     only on the three cases whose worked answer names a letter. Cases that don't name one carry no
     letterScale at all, so scaleForClass() falls back to an empty scale and letterFor() answers
     null rather than guessing; those cases assert the percentage only, exactly as the doc does. */
  const CASE_SCALE = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 },
    { letter: 'F', min: 0 }];

  /* Case 1 — three weighted categories. */
  const case1 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 50 }, { id: 'quiz', weight: 30 },
      { id: 'home', weight: 20 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'a3', classId: 'c1', termId: 't1', categoryId: 'home', points: 10 },
    ],
    scores: { a1: { s1: { v: 80 } }, a2: { s1: { v: 18 } }, a3: { s1: { v: 10 } } },
    letterScale: CASE_SCALE,
  }, 't1', 's1');
  check('case 1 (three weighted categories): 80/90/100 by category, 87% overall, letter B',
    case1.categories[0].result.percentage === 80 && case1.categories[1].result.percentage === 90
      && case1.categories[2].result.percentage === 100 && case1.grade.percentage === 87
      && case1.grade.letter === 'B',
    JSON.stringify(case1.categories.map((c) => c.result.percentage)) + ' :: class '
      + case1.grade.percentage + case1.grade.letter);

  /* Case 2 — one assignment in the term. */
  const case2 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [{ id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 40 }],
    scores: { a1: { s1: { v: 34 } } },
    letterScale: CASE_SCALE,
  }, 't1', 's1');
  check('case 2 (one assignment in the term): 34/40 is 85%, letter B',
    case2.grade.percentage === 85 && case2.grade.letter === 'B',
    'class ' + case2.grade.percentage + case2.grade.letter);

  /* Case 3 — a category with no assignments at all. */
  const case3 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 60 }, { id: 'home', weight: 40 }] }],
    assignments: [{ id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 50 }],
    scores: { a1: { s1: { v: 40 } } },
  }, 't1', 's1');
  check('case 3 (a category with no assignments): Homework has no percentage, weight redistributes, class is 80%',
    case3.categories[1].result.percentage === null && case3.grade.percentage === 80,
    'Homework % = ' + case3.categories[1].result.percentage + ', class ' + case3.grade.percentage);

  /* Case 4 — every score in a category is excused. */
  const case4 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 60 }, { id: 'home', weight: 40 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 50 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'home', points: 20 },
    ],
    scores: { a1: { s1: { v: 45 } }, a2: { s1: { v: null, flag: 'excused' } } },
  }, 't1', 's1');
  check('case 4 (every score in a category excused): Homework is 0/0 and has no percentage, class is 90%',
    case4.categories[1].result.earned === 0 && case4.categories[1].result.possible === 0
      && case4.categories[1].result.percentage === null && case4.grade.percentage === 90,
    JSON.stringify(case4.categories[1].result) + ' :: class ' + case4.grade.percentage);

  /* Case 5 — a zero-point assignment adds extra credit, with no division by zero. */
  const case5 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'quiz', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'ec', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 0 },
    ],
    scores: { a1: { s1: { v: 13 } }, ec: { s1: { v: 5 } } },
  }, 't1', 's1');
  check('case 5 (zero-point assignment adds extra credit): 18/20 is 90%, no division by zero',
    case5.categories[0].result.earned === 18 && case5.categories[0].result.possible === 20
      && case5.categories[0].result.percentage === 90 && case5.grade.percentage === 90,
    JSON.stringify(case5.categories[0].result) + ' :: class ' + case5.grade.percentage);

  /* Case 6 — extra credit carries a category, and the class, past 100%. */
  const case6 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'quiz', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'ec', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 0 },
    ],
    scores: { a1: { s1: { v: 20 } }, ec: { s1: { v: 5 } } },
    letterScale: CASE_SCALE,
  }, 't1', 's1');
  check('case 6 (extra credit past 100%): 25/20 is 125% at the category and the class, letter A, nothing clamps',
    case6.categories[0].result.percentage === 125 && case6.grade.percentage === 125
      && case6.grade.letter === 'A',
    'category ' + case6.categories[0].result.percentage + '% :: class '
      + case6.grade.percentage + case6.grade.letter);

  /* Case 7 — a category holding only zero-point assignments: possible sums to zero. */
  const case7 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 70 }, { id: 'extra', weight: 30 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 },
      { id: 'ec', classId: 'c1', termId: 't1', categoryId: 'extra', points: 0 },
    ],
    scores: { a1: { s1: { v: 80 } }, ec: { s1: { v: 10 } } },
  }, 't1', 's1');
  check('case 7 (a category with only zero-point work): Extra Credit is 10/0 with no percentage, class is 80% — never NaN, never 100%',
    case7.categories[1].result.earned === 10 && case7.categories[1].result.possible === 0
      && case7.categories[1].result.percentage === null && case7.grade.percentage === 80
      && !Number.isNaN(case7.grade.percentage),
    JSON.stringify(case7.categories[1].result) + ' :: class ' + case7.grade.percentage);

  /* Case 8 — weights crossing from 95 to 100, both directions on the same document. */
  const case8Fixture = (weights) => ({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: weights[0] },
      { id: 'quiz', weight: weights[1] }, { id: 'home', weight: weights[2] }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 20 },
      { id: 'a3', classId: 'c1', termId: 't1', categoryId: 'home', points: 10 },
    ],
    scores: { a1: { s1: { v: 80 } }, a2: { s1: { v: 18 } }, a3: { s1: { v: 10 } } },
  });
  const case8unbalanced = await gradeAt(case8Fixture([50, 30, 15]), 't1', 's1');
  check('case 8, first direction: weights totalling 95 return no grade at all, and the reason names the total',
    case8unbalanced.grade.percentage === null && case8unbalanced.grade.letter === null
      && case8unbalanced.grade.reason === 'weights-unbalanced'
      && case8unbalanced.grade.message === 'The category weights total 95%, so there is no grade yet.'
      && case8unbalanced.grade.weightTotal === 95,
    JSON.stringify({ reason: case8unbalanced.grade.reason, message: case8unbalanced.grade.message }));
  const case8balanced = await gradeAt(case8Fixture([50, 30, 20]), 't1', 's1');
  check('case 8, second direction: the same document with weights corrected to 100 returns 87%',
    case8balanced.grade.percentage === 87 && case8balanced.grade.reason === null,
    'class ' + case8balanced.grade.percentage + ', reason ' + case8balanced.grade.reason);

  /* Case 8, third direction (WO-3.12) — decimal weights, the case integers cannot express. WO-3.4's
     correction round routed this message's total through formatWeight() (src/grade-engine.js:96) so
     it agrees with the categories editor's own banner, but the only unbalanced-weight fixture above
     is 50/30/15 = 95 — integers, exactly the case where the float bug cannot appear. 40.1 + 34.7 + 20
     is 94.8 in decimal and 94.80000000000001 in IEEE-754 double precision; this asserts the STRING,
     because the string is what the teacher reads and what disagreed with the banner. */
  const case8decimal = await gradeAt(case8Fixture([40.1, 34.7, 20]), 't1', 's1');
  check('case 8, third direction: decimal weights totalling 94.8 read "94.8%", never "94.80000000000001%"',
    case8decimal.grade.percentage === null && case8decimal.grade.reason === 'weights-unbalanced'
      && case8decimal.grade.message === 'The category weights total 94.8%, so there is no grade yet.',
    JSON.stringify({ reason: case8decimal.grade.reason, message: case8decimal.grade.message }));

  /* Case 9 — a missing flag scores zero; the same cell excused raises the grade. */
  const case9Fixture = (flag) => ({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
    ],
    scores: { a1: { s1: { v: 8 } }, a2: { s1: { v: null, flag } } },
  });
  const case9missing = await gradeAt(case9Fixture('missing'), 't1', 's1');
  const case9excused = await gradeAt(case9Fixture('excused'), 't1', 's1');
  check('case 9 (missing vs. excused): missing scores zero at 40%, the same cell excused rises to 80%',
    case9missing.grade.percentage === 40 && case9excused.grade.percentage === 80,
    'missing ' + case9missing.grade.percentage + '% :: excused ' + case9excused.grade.percentage + '%');

  /* Case 10 — late is a record, not a penalty. */
  const case10Fixture = (flagged) => ({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [{ id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 100 }],
    scores: { a1: { s1: flagged ? { v: 78, flag: 'late' } : { v: 78 } } },
  });
  const case10late = await gradeAt(case10Fixture(true), 't1', 's1');
  const case10plain = await gradeAt(case10Fixture(false), 't1', 's1');
  check('case 10 (late is a record, not a penalty): flagged and unflagged both score 78%',
    case10late.grade.percentage === 78 && case10plain.grade.percentage === 78,
    'late ' + case10late.grade.percentage + '% :: unflagged ' + case10plain.grade.percentage + '%');

  /* Case 11 — a blank cell changes nothing versus no cell at all. */
  const case11blankFixture = {
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
      { id: 'a2', classId: 'c1', termId: 't1', categoryId: 'tests', points: 10 },
    ],
    scores: { a1: { s1: { v: 9 } }, a2: { s1: { v: null } } },
  };
  const case11noKeyFixture = {
    classes: case11blankFixture.classes,
    assignments: case11blankFixture.assignments,
    scores: { a1: { s1: { v: 9 } } },
  };
  const case11blank = await gradeAt(case11blankFixture, 't1', 's1');
  const case11noKey = await gradeAt(case11noKeyFixture, 't1', 's1');
  check('case 11 (blank cell vs. no cell): both are 9/10, 90%, and agree with each other',
    case11blank.grade.percentage === 90 && case11noKey.grade.percentage === 90,
    'blank cell ' + case11blank.grade.percentage + '% :: no key ' + case11noKey.grade.percentage + '%');

  /* Case 12 — every category empty: an honest "no grade yet", not 0% and not NaN. */
  const case12 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 60 }, { id: 'home', weight: 40 }] }],
    assignments: [], scores: {},
  }, 't1', 's1');
  check('case 12 (every category empty): percentage is null, letter is null, reason is no-graded-work — never 0%, never NaN',
    case12.grade.percentage === null && case12.grade.letter === null
      && case12.grade.reason === 'no-graded-work'
      && case12.grade.message === 'There is no graded work yet.',
    JSON.stringify({ percentage: case12.grade.percentage, letter: case12.grade.letter,
      reason: case12.grade.reason }));

  /* Case 13 (WO-3.12) — an assignment filed under another class does not move this class's grade.
     Cases 1-12 are all one class, one term, one student; an engine that dropped the classId filter
     at src/grade-engine.js:35 would pass every one of them. `a2` shares `a1`'s term and category id
     but sits under `c2`. */
  const case13 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] },
      { id: 'c2', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 40 },
      { id: 'a2', classId: 'c2', termId: 't1', categoryId: 'tests', points: 100 },
    ],
    scores: { a1: { s1: { v: 34 } }, a2: { s1: { v: 100 } } },
  }, 't1', 's1');
  check("case 13 (an assignment filed under another class): c1's grade is 34/40 = 85%, unmoved by c2's a2",
    case13.grade.percentage === 85,
    'class ' + case13.grade.percentage);

  /* Case 14 (WO-3.12) — an assignment filed under another term does not move this term's grade,
     proving the termId filter at src/grade-engine.js:36. `a2` is the same class and category as
     `a1` but filed under `t2`; the grade asked for is `t1`'s. */
  const case14 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [
      { id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 40 },
      { id: 'a2', classId: 'c1', termId: 't2', categoryId: 'tests', points: 100 },
    ],
    scores: { a1: { s1: { v: 34 } }, a2: { s1: { v: 100 } } },
  }, 't1', 's1');
  check("case 14 (an assignment filed under another term): t1's grade is 34/40 = 85%, unmoved by t2's a2",
    case14.grade.percentage === 85,
    'class ' + case14.grade.percentage);

  /* Case 15 (WO-3.12) — a second and third student's cells do not move the subject's grade,
     proving the studentId lookup at src/grade-engine.js:41-42. `s2`'s cell is written BEFORE `s1`'s
     on purpose: a mutation that read "whichever cell is first" instead of the one keyed to the
     requested student would land on `s2`'s and go red here, where insertion-order coincidence
     could otherwise have hidden it. */
  const case15 = await gradeAt({
    classes: [{ id: 'c1', categories: [{ id: 'tests', weight: 100 }] }],
    assignments: [{ id: 'a1', classId: 'c1', termId: 't1', categoryId: 'tests', points: 40 }],
    scores: { a1: { s2: { v: 1 }, s1: { v: 34 }, s3: { v: 40 } } },
  }, 't1', 's1');
  check("case 15 (a second and third student's cells): s1's grade is 34/40 = 85%, unmoved by s2 or s3",
    case15.grade.percentage === 85,
    'class ' + case15.grade.percentage);

  /* ───────── a class graded on total points (WO-3.30) ─────────
   *
   * The second formula: everything earned over everything possible, weights ignored. Same rule as
   * cases 1-15 — EVERY EXPECTED VALUE IS A LITERAL worked by hand below, never a formula, and the
   * literals are compared at 1e-9 because a thirds-and-ninths fixture cannot be written as an exact
   * decimal. The fixture is LOPSIDED ON PURPOSE: one 200-point essay against a handful of 5- and
   * 10-point pieces, so a points grade and a weighted one land far apart and an engine quietly
   * answering the wrong formula cannot agree with the literal by accident. Its weights total 75,
   * which is acceptance line 2's second half: a weighted class at 75 has no grade at all, and this
   * one must.
   *
   *   Essays (w40):   e1 110/200, e2 50 pts outstanding
   *   Quizzes (w20):  q1 9/10, q2 10 pts marked missing (0/10)
   *   Homework (w15): h1 5/5, h2 5 pts EXCUSED (in neither total)
   *
   *   Earned 110 + 9 + 0 + 5 = 124.  Possible 200 + 10 + 10 + 5 = 225.
   *   Grade 124/225 = 55.1̅%  (F on A90/B80/C70/D60/F0; next band D at 60).
   *   Contributions 110/225 = 48.8̅, 9/225 = 4, 5/225 = 2.2̅  — sum 55.1̅.
   *   Counts at 200/225 = 88.8̅%, 20/225 = 8.8̅%, 5/225 = 2.2̅%.
   *
   *   Projection, outstanding at 0:  124/(225+50) = 124/275 = 45.09̅0̅%
   *   Projection, outstanding at 1:  174/275 = 63.27̅2̅%
   *   Missing handed in at full:     134/225 = 59.5̅%
   *   Rate for D (60): 124 + 50r = 0.60 x 275 = 165, so r = 41/50 = 0.82, landing at 165/275 = 60%.
   *
   *   The same work weighted 50/30/20 instead: 55 x .5 + 45 x .3 + 100 x .2 = 27.5 + 13.5 + 20 = 61.
   *
   *   Plus one assignment filed under NO category, r1, 18/20:
   *     points  142/245 = 57.95918367…%  (the loose row is 18 of 20, and only it moved)
   *     weighted  61 exactly, unmoved — it carries no weight.
   */
  const SCALE330 = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 },
    { letter: 'D', min: 60 }, { letter: 'F', min: 0 }];
  const fixture330 = (mode, weights, loose) => {
    const cls = { id: 'c1', categories: [
      { id: 'ess', name: 'Essays', weight: weights[0] },
      { id: 'quiz', name: 'Quizzes', weight: weights[1] },
      { id: 'home', name: 'Homework', weight: weights[2] }] };
    if (mode) cls.gradingMode = mode;
    const doc = {
      classes: [cls],
      assignments: [
        { id: 'e1', classId: 'c1', termId: 't1', categoryId: 'ess', points: 200 },
        { id: 'e2', classId: 'c1', termId: 't1', categoryId: 'ess', points: 50 },
        { id: 'q1', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 10 },
        { id: 'q2', classId: 'c1', termId: 't1', categoryId: 'quiz', points: 10 },
        { id: 'h1', classId: 'c1', termId: 't1', categoryId: 'home', points: 5 },
        { id: 'h2', classId: 'c1', termId: 't1', categoryId: 'home', points: 5 },
      ],
      scores: { e1: { s1: { v: 110 } }, q1: { s1: { v: 9 } }, q2: { s1: { v: null, flag: 'missing' } },
        h1: { s1: { v: 5 } }, h2: { s1: { v: null, flag: 'excused' } } },
      letterScale: SCALE330,
    };
    (loose || []).forEach((a) => {
      doc.assignments.push(Object.assign({ classId: 'c1', termId: 't1' }, a.assignment));
      if (a.cell) doc.scores[a.assignment.id] = { s1: a.cell };
    });
    return doc;
  };
  const ask330 = async (doc) => await evalJs(`(function(){
    var doc = ${JSON.stringify(doc)};
    var g = window.planbook.gradeEngine, cls = doc.classes[0];
    var grade = g.classGrade(doc, cls, 't1', 's1');
    return {
      grade: grade,
      floor: g.projectedClassGrade(doc, cls, 't1', 's1', { outstanding: 0 }),
      ceiling: g.projectedClassGrade(doc, cls, 't1', 's1', { outstanding: 1 }),
      handedIn: g.projectedClassGrade(doc, cls, 't1', 's1', { missing: 1 }),
      band: grade.percentage === null ? null : g.nextBandFor(doc, cls, grade.percentage),
      share: g.pointsShare(doc, cls, 't1') };
  })()`);
  const near = (a, b) => typeof a === 'number' && Math.abs(a - b) < 1e-9;
  const sumOf = (rows, key) => rows.reduce((n, r) => n + (r[key] === null ? 0 : r[key]), 0);

  const p330 = await ask330(fixture330('points', [40, 20, 15]));
  const pg = p330.grade;
  check('WO-3.30 points mode: three categories with lopsided points grade at total earned / total possible, '
    + '124/225 = 55.1̅% (F), worked by hand — and the weights total 75 and it still has a grade',
    near(pg.percentage, 55.1111111111111) && pg.letter === 'F' && pg.reason === null
      && pg.weightTotal === 75 && pg.categories.length === 3,
    JSON.stringify({ percentage: pg.percentage, letter: pg.letter, reason: pg.reason,
      weightTotal: pg.weightTotal, rows: pg.categories.length }));
  check('WO-3.30 points mode returns weighted mode\'s shape: each category carries its own fraction, '
    + 'counts at its share of the total possible (88.8̅ / 8.8̅ / 2.2̅) and contributes earned / total '
    + 'possible (48.8̅ / 4 / 2.2̅)',
    pg.categories.every((c) => ['id', 'name', 'weight', 'earned', 'possible', 'percentage',
      'effectiveWeight', 'contribution'].every((k) => k in c))
      && near(pg.categories[0].effectiveWeight, 88.8888888888889)
      && near(pg.categories[1].effectiveWeight, 8.88888888888889)
      && near(pg.categories[2].effectiveWeight, 2.22222222222222)
      && near(pg.categories[0].contribution, 48.8888888888889)
      && near(pg.categories[1].contribution, 4)
      && near(pg.categories[2].contribution, 2.22222222222222)
      && near(pg.categories[0].percentage, 55) && near(pg.categories[1].percentage, 45)
      && near(pg.categories[2].percentage, 100),
    JSON.stringify(pg.categories));

  const w330 = await ask330(fixture330(null, [50, 30, 20]));
  const wg = w330.grade;
  check('WO-3.30, both modes: the contributions add up to the percentage, and the excused 5-point '
    + 'homework is out of both totals — Homework is 5/5 in each, points 55.1̅ and weighted 61',
    near(sumOf(pg.categories, 'contribution'), pg.percentage)
      && near(sumOf(wg.categories, 'contribution'), wg.percentage) && wg.percentage === 61
      && pg.categories[2].earned === 5 && pg.categories[2].possible === 5
      && wg.categories[2].earned === 5 && wg.categories[2].possible === 5
      && near(sumOf(pg.categories, 'possible'), 225),
    'points: contributions ' + sumOf(pg.categories, 'contribution') + ' vs ' + pg.percentage
      + ' · weighted: contributions ' + sumOf(wg.categories, 'contribution') + ' vs ' + wg.percentage
      + ' · Homework ' + pg.categories[2].earned + '/' + pg.categories[2].possible + ' and '
      + wg.categories[2].earned + '/' + wg.categories[2].possible);

  /* The same work in weighted mode at 75 has no grade at all — the refusal points mode skips is
     still there for the class it belongs to, so the check above is a difference and not a
     coincidence. */
  const w75 = await ask330(fixture330(null, [40, 20, 15]));
  check('WO-3.30: the same 75-weight class with no gradingMode still refuses, weights-unbalanced — '
    + 'the refusal is skipped in points mode only',
    w75.grade.percentage === null && w75.grade.reason === 'weights-unbalanced',
    JSON.stringify({ percentage: w75.grade.percentage, reason: w75.grade.reason }));

  const LOOSE = [{ assignment: { id: 'r1', points: 20 }, cell: { v: 18 } }];
  const pLoose = await ask330(fixture330('points', [40, 20, 15], LOOSE));
  const wLoose = await ask330(fixture330(null, [50, 30, 20], LOOSE));
  const looseRow = pLoose.grade.categories.filter((c) => c.id === null)[0] || null;
  check('WO-3.30: a scored assignment filed under no category moves a points grade by exactly its 18 '
    + 'of 20 (124/225 -> 142/245 = 57.959…%, as one "no category" row) and a weighted grade not at all (61 -> 61)',
    near(pLoose.grade.percentage, 57.9591836734694)
      && !!looseRow && looseRow.earned === 18 && looseRow.possible === 20 && looseRow.weight === 0
      && looseRow.name === 'no category'
      && near(sumOf(pLoose.grade.categories, 'earned') - sumOf(pg.categories, 'earned'), 18)
      && near(sumOf(pLoose.grade.categories, 'possible') - sumOf(pg.categories, 'possible'), 20)
      && near(sumOf(pLoose.grade.categories, 'contribution'), pLoose.grade.percentage)
      && wLoose.grade.percentage === 61 && wLoose.grade.categories.length === 3
      && JSON.stringify(wLoose.grade) === JSON.stringify(wg),
    'points ' + pg.percentage + ' -> ' + pLoose.grade.percentage + ', loose row '
      + JSON.stringify(looseRow) + ' · weighted ' + wg.percentage + ' -> ' + wLoose.grade.percentage);

  check('WO-3.30: projectedClassGrade() in points mode matches the hand-worked projection — 45.09̅0̅% '
    + 'with nothing on the 50 outstanding points, 63.27̅2̅% with full marks, 59.5̅% with the missing quiz handed in',
    near(p330.floor.percentage, 45.0909090909091) && near(p330.ceiling.percentage, 63.2727272727273)
      && near(p330.handedIn.percentage, 59.5555555555556),
    'floor ' + p330.floor.percentage + ', ceiling ' + p330.ceiling.percentage + ', handed in '
      + p330.handedIn.percentage);
  /* The straight line, solved and then checked against the engine at the solved rate — the same
     two-point solve src/detail.js makes, so a projection that bent in points mode would miss. */
  const rate330 = p330.band ? (p330.band.min - p330.floor.percentage)
    / (p330.ceiling.percentage - p330.floor.percentage) : null;
  const at330 = rate330 === null ? null : await evalJs(`(function(){
    var doc = ${JSON.stringify(fixture330('points', [40, 20, 15]))};
    return window.planbook.gradeEngine.projectedClassGrade(doc, doc.classes[0], 't1', 's1',
      { outstanding: ${rate330} }).percentage; })()`);
  check('WO-3.30: the score needed for the next band (D at 60) still solves by the straight line — '
    + 'r = 41/50 = 0.82 by hand, and the engine at that rate lands on 60%',
    !!p330.band && p330.band.letter === 'D' && p330.band.min === 60
      && near(rate330, 0.82) && near(at330, 60),
    'band ' + JSON.stringify(p330.band) + ', solved rate ' + rate330 + ', engine there ' + at330);

  /* An outstanding piece filed under no category is in a points projection's denominator, because
     it is in the grade's: 124/(275+30) = 40.6557…% with a 30-point loose piece still open. */
  const pOpenLoose = await ask330(fixture330('points', [40, 20, 15],
    [{ assignment: { id: 'r3', points: 30 } }]));
  check('WO-3.30: an outstanding uncategorized piece is projected in points mode — 124/305 = 40.656% at '
    + 'nothing scored — while the real grade is unmoved at 55.1̅% (nothing on it is graded yet)',
    near(pOpenLoose.floor.percentage, 40.655737704918) && near(pOpenLoose.grade.percentage, 55.1111111111111)
      && pOpenLoose.grade.categories.length === 3,
    'floor ' + pOpenLoose.floor.percentage + ', grade ' + pOpenLoose.grade.percentage + ', rows '
      + pOpenLoose.grade.categories.length);

  const noneYet = await ask330({ classes: [{ id: 'c1', gradingMode: 'points',
    categories: [{ id: 'k', weight: 30 }] }],
    assignments: [{ id: 'x1', classId: 'c1', termId: 't1', categoryId: 'k', points: 0 },
      { id: 'x2', classId: 'c1', termId: 't1', categoryId: 'k', points: 10 }],
    scores: { x1: { s1: { v: 5 } } } });
  check('WO-3.30: no-graded-work still applies in points mode — a student whose only graded work is '
    + 'extra credit has n/0, not a grade',
    noneYet.grade.percentage === null && noneYet.grade.reason === 'no-graded-work',
    JSON.stringify({ percentage: noneYet.grade.percentage, reason: noneYet.grade.reason }));

  const sh = pLoose.share;
  check('WO-3.30: pointsShare() is each category\'s share of the points assigned in the term, graded or '
    + 'not — 250 / 20 / 10 / 20 loose of 300 = 83.3̅ / 6.6̅ / 3.3̅ / 6.6̅ — and 250 / 20 / 10 of 280 with nothing loose',
    sh.length === 4 && sh[0].id === 'ess' && sh[0].points === 250 && near(sh[0].share, 83.3333333333333)
      && sh[1].points === 20 && near(sh[1].share, 6.66666666666667)
      && sh[2].points === 10 && near(sh[2].share, 3.33333333333333)
      && sh[3].id === null && sh[3].points === 20 && near(sh[3].share, 6.66666666666667)
      && p330.share.length === 3 && near(p330.share[0].share, 89.2857142857143)
      && near(p330.share[1].share, 7.14285714285714) && near(p330.share[2].share, 3.57142857142857),
    JSON.stringify(sh) + ' :: ' + JSON.stringify(p330.share));

  const modes = await evalJs(`(function(){ var g = window.planbook.gradeEngine;
    return [g.gradingModeOf({}), g.gradingModeOf({ gradingMode: 'points' }),
      g.gradingModeOf({ gradingMode: 'weighted' }), g.gradingModeOf({ gradingMode: 'Points' }),
      g.gradingModeOf(null), typeof g.weightedClassGrade]; })()`);
  check('WO-3.30: an absent gradingMode IS weighted, only the exact string "points" is points, and the '
    + 'weighted-only entry point is gone from the engine rather than kept beside classGrade()',
    JSON.stringify(modes) === JSON.stringify(['weighted', 'points', 'weighted', 'weighted', 'weighted',
      'undefined']),
    JSON.stringify(modes));
}
}
