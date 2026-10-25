/* term-record.mjs — a quarter's grades can be recorded, and the engine says when they stop matching (WO-3.72)
 *
 * src/term-record.js is a writer and six readers with no screen (the bar and the dialog are WO-3.73),
 * so every check here asks the module through the window.planbook seam and compares what it says to a
 * literal worked out by hand below — never to a comparison the harness made for itself, which would
 * agree with a build that compared wrongly the same way. Where a figure is "classGrade()'s own", the
 * check asks classGrade() too, because that is the claim.
 *
 * THE FIXTURE, AND THE HAND ARITHMETIC. One weighted class with its OWN letter scale (A 90, B 80, C 70,
 * D 60, F 0 — so the run year's document-wide scale, whatever an earlier section left it as, decides
 * nothing here), categories Exams 50 / Projects 30 / Homework 20, and two terms: Q1 (2026-08-24 to
 * 2026-10-31) and an UNDATED Q2. Q1's columns, all 100 points except Homework's 10:
 *
 *            E1    E2         P1        P2        W1        H1 (Exams, HELD)
 *   ada      90    80         90        —         10        0
 *   ben      70    late, —    80        90        8         —
 *   cy       95    85         excused   missing   10        —
 *   dee      88    —          —         —         excused   —
 *   eve      —     —          —         —         excused   —
 *   fay      60    —          —         —         5         —
 *
 * plus one Q2 column, X1 (Exams), blank for everybody. Roster order: ada, ben, cy, dee, eve, fay, and a
 * dangling id that names nobody.
 *
 *   ada   Exams 170/200 = 85, Projects 90, Homework 100 → 42.5 + 27 + 20 = 89.50 B
 *   ben   Exams 70 (the late blank counts nothing), Projects 170/200 = 85, Homework 80 → 76.50 C
 *   cy    Exams 90, Projects 0/100 (excused out, missing a zero), Homework 100 → 65.00 D
 *   dee   Exams 88 alone (the other two categories empty, their weight redistributed) → 88.00 B
 *   eve   nothing graded → no grade, so not in a recording
 *   fay   Exams 60, Homework 50, over 70 of active weight → 57.14 F
 *
 *   EMPTY BOXES in Q1: ada P2 · ben E2 (late alone IS empty) · dee E2 P1 P2 · eve E1 E2 P1 P2 · fay E2 P1
 *   P2 = 12, in Exams and Projects — never Homework (every W1 is scored or excused). Not counted: cy's
 *   excused P1 and missing P2 (14 if they were), H1's five blanks (17 if the held column were live —
 *   the check takes the hold off to prove it), and X1 (another term). With Exams dropLowest 1, ada's
 *   E2 and cy's E2 are dropped and the count stays 12 (14 if a dropped cell counted).
 *
 *   AFTER ben's E1 goes 70 → 72: ben 77.50 C — a percentage move inside one letter. Re-recorded, then:
 *   weights 40/40/20   ada 90.00 A · ben 78.80 C · cy 56.00 F · fay 56.67 F · dee unchanged (one category)
 *   scale B 88.5, C 78 ben 77.50 → D · dee 88.00 → C · ada 89.50 still B · cy, fay unchanged
 *   Exams dropLowest 1 ada 92.00 A (E2 dropped) · cy 67.50 D (E2 dropped; same letter) · ben's late blank
 *                      is no candidate, and dee and fay have one score each, so nothing else moves
 *   gus joins          Exams 75 alone → 75.00 C, recorded: null
 *   fay leaves         and her E1 goes 60 → 95 (she would be 82.14 B) — still nobody reported
 *   dee's E1 excused   dee has no grade now — reported, live null, recorded 88 B
 *
 * It plants its class through the store, restores this run's own year over itself once (with the
 * recordings taken off — the content is otherwise unchanged), takes the class back out, deletes the
 * `termRecords` key it created, and hands the page back reloaded. No viewport change, no
 * presentation-mode change.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { nodeToday } from './lib-dates.mjs';

export async function run(h) {
const { ROOT, check, skip, evalJs, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, send } = h;

console.log('\n--- a quarter\'s grades can be recorded, and the engine says when they stop matching (WO-3.72) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.termRecord"
  + " && typeof window.planbook.termRecord.recordTerm === 'function'"
  + " && window.planbook.gradeEngine && window.planbook.backup)"))) {
  skip('a quarter\'s grades can be recorded (WO-3.72)', 'window.planbook is missing termRecord, '
    + 'gradeEngine, store or backup, so nothing can be recorded or read back');
  return;
}

const CLS = 'c_wo372', Q1 = 'tm372q1', Q2 = 'tm372q2';
const KE = 'k372e', KP = 'k372p', KW = 'k372w';
const S = { ada: 'wo372-ada', ben: 'wo372-ben', cy: 'wo372-cy', dee: 'wo372-dee', eve: 'wo372-eve',
  fay: 'wo372-fay', gus: 'wo372-gus' };
const A = { e1: 'a372-e1', e2: 'a372-e2', p1: 'a372-p1', p2: 'a372-p2', w1: 'a372-w1', h1: 'a372-h1',
  x1: 'a372-x1' };
const SCALE = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 },
  { letter: 'D', min: 60 }, { letter: 'F', min: 0 }];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* Page-side prelude: the module, the document, the fixture class out of it, and a formatter that
   prints a figure the way the screens do, so a literal below reads as the grid would. */
const P = `var s = window.planbook.store, T = window.planbook.termRecord, G = window.planbook.gradeEngine;
  var d = s.getDoc();
  var cls = (d.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
  var pf = function(p){ return p === null || p === undefined ? null : Number(p).toFixed(2); };
  var rows = function(list){ return list === null ? null : list.map(function(r){ return {
    id: r.studentId,
    rec: r.recorded ? [pf(r.recorded.percentage), r.recorded.letter] : null,
    live: [pf(r.live.percentage), r.live.letter] }; }); };`;
/* One change to the document through the store, flushed, then the comparison read back. */
const change = (body) => evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){
    var cls = doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
    var cell = function(a, st){ return doc.scores[a][st]; };
    ${body}
  });
  await s.flush();
  ${P}
  return rows(T.noLongerMatching(d, cls, '${Q1}')); })()`);
const record = () => evalJs(`(async function(){ ${P}
  var e = T.recordTerm(cls, '${Q1}'); await s.flush(); return e ? e.id : null; })()`);

/* ── THE FIXTURE ── */
const plant = await evalJs(`(async function(){
  var s = window.planbook.store, d0 = s.getDoc();
  if (!d0) return { ok: false, why: 'no year document is open' };
  var had = Object.prototype.hasOwnProperty.call(d0, 'termRecords');
  var S = ${JSON.stringify(S)}, A = ${JSON.stringify(A)};
  s.update(function(doc){
    doc.students.push({ id: S.ada, first: 'Ada', last: 'Wo372' }, { id: S.ben, first: 'Ben', last: 'Wo372' },
      { id: S.cy, first: 'Cy', last: 'Wo372' }, { id: S.dee, first: 'Dee', last: 'Wo372' },
      { id: S.eve, first: 'Eve', last: 'Wo372' }, { id: S.fay, first: 'Fay', last: 'Wo372' },
      { id: S.gus, first: 'Gus', last: 'Wo372' });
    doc.classes.push({ id: '${CLS}', name: 'WO-3.72 Recorded quarter', archived: false,
      letterScale: ${JSON.stringify(SCALE)},
      terms: [{ id: '${Q1}', label: 'Quarter 1', start: '2026-08-24', end: '2026-10-31' },
              { id: '${Q2}', label: 'Quarter 2', start: '', end: '' }],
      categories: [{ id: '${KE}', name: 'Exams', weight: 50 }, { id: '${KP}', name: 'Projects', weight: 30 },
                   { id: '${KW}', name: 'Homework', weight: 20 }],
      roster: [S.ada, S.ben, S.cy, S.dee, S.eve, S.fay, 's_wo372-ghost'] });
    var add = function(id, cat, name, points, term, held){
      var a = { id: id, classId: '${CLS}', termId: term || '${Q1}', categoryId: cat, name: name,
        points: points, assigned: '', due: '' };
      if (held) a.held = true;
      doc.assignments.push(a); doc.scores[id] = {}; };
    add(A.e1, '${KE}', 'WO-3.72 Exam 1', 100); add(A.e2, '${KE}', 'WO-3.72 Exam 2', 100);
    add(A.p1, '${KP}', 'WO-3.72 Project 1', 100); add(A.p2, '${KP}', 'WO-3.72 Project 2', 100);
    add(A.w1, '${KW}', 'WO-3.72 Homework', 10); add(A.h1, '${KE}', 'WO-3.72 Held quiz', 100, '', true);
    add(A.x1, '${KE}', 'WO-3.72 Next quarter', 100, '${Q2}');
    var put = function(a, st, cell){ doc.scores[a][st] = cell; };
    put(A.e1, S.ada, { v: 90 }); put(A.e2, S.ada, { v: 80 }); put(A.p1, S.ada, { v: 90 });
    put(A.w1, S.ada, { v: 10 }); put(A.h1, S.ada, { v: 0 });
    put(A.e1, S.ben, { v: 70 }); put(A.e2, S.ben, { v: null, flag: 'late' }); put(A.p1, S.ben, { v: 80 });
    put(A.p2, S.ben, { v: 90 }); put(A.w1, S.ben, { v: 8 });
    put(A.e1, S.cy, { v: 95 }); put(A.e2, S.cy, { v: 85 }); put(A.p1, S.cy, { v: null, flag: 'excused' });
    put(A.p2, S.cy, { v: null, flag: 'missing' }); put(A.w1, S.cy, { v: 10 });
    put(A.e1, S.dee, { v: 88 }); put(A.w1, S.dee, { v: null, flag: 'excused' });
    put(A.w1, S.eve, { v: null, flag: 'excused' });
    put(A.e1, S.fay, { v: 60 }); put(A.w1, S.fay, { v: 5 });
  });
  await s.flush();
  ${P}
  return { ok: !!cls, had: had,
    grades: [S.ada, S.ben, S.cy, S.dee, S.eve, S.fay].map(function(id){
      var g = G.classGrade(d, cls, '${Q1}', id); return [pf(g.percentage), g.letter]; }),
    newest: T.newestRecord(d, cls, '${Q1}'), changed: T.noLongerMatching(d, cls, '${Q1}') }; })()`);

const FIXTURE = [['89.50', 'B'], ['76.50', 'C'], ['65.00', 'D'], ['88.00', 'B'], [null, null], ['57.14', 'F']];
if (!plant || !plant.ok || JSON.stringify(plant.grades) !== JSON.stringify(FIXTURE)) {
  check('WO-3.72: the fixture is real — the class planted and every student\'s grade the hand table\'s',
    false, JSON.stringify(plant));
  return;
}

/* ── ACCEPTANCE LINE 5: the ended and ends-today readers ── */
const ends = await evalJs(`(function(){ ${P}
  var ask = function(term, day){ return [T.termEnded(cls, term, day), T.termEndsToday(cls, term, day)]; };
  return { before: ask('${Q1}', '2026-10-30'), on: ask('${Q1}', '2026-10-31'), after: ask('${Q1}', '2026-11-01'),
    undated: [ask('${Q2}', '2026-10-30'), ask('${Q2}', '2026-10-31'), ask('${Q2}', '2099-01-01')],
    unknown: ask('tm_nobody', '2026-11-01'),
    clock: [T.termEnded(cls, '${Q1}'), T.termEndsToday(cls, '${Q1}')] }; })()`);
const clockWant = ['2026-10-31' < nodeToday, '2026-10-31' === nodeToday];
check('WO-3.72: the ended and ends-today readers answer for Q1\'s end date (2026-10-31), the day before '
  + 'and the day after — the day before neither, the end date ends-today and not yet ended, the day '
  + 'after ended and not ends-today — and an undated term or one the class does not have is neither; '
  + 'with no date passed they read the clock (' + nodeToday + ')',
  JSON.stringify(ends.before) === '[false,false]' && JSON.stringify(ends.on) === '[false,true]'
    && JSON.stringify(ends.after) === '[true,false]'
    && JSON.stringify(ends.undated) === '[[false,false],[false,false],[false,false]]'
    && JSON.stringify(ends.unknown) === '[false,false]'
    && JSON.stringify(ends.clock) === JSON.stringify(clockWant),
  JSON.stringify(ends) + ' · clock wanted ' + JSON.stringify(clockWant));

/* ── ACCEPTANCE LINE 6: the empty boxes ── */
const boxes = await evalJs(`(async function(){ ${P}
  var read = function(){ var dd = s.getDoc();
    var c = dd.classes.filter(function(x){ return x.id === '${CLS}'; })[0];
    return T.emptyBoxes(dd, c, '${Q1}'); };
  var plain = read();
  var held = T.heldColumns(d, cls, '${Q1}');
  /* Exams drops its lowest 1: ada's E2 and cy's E2 go, both SCORED cells. */
  s.update(function(doc){ doc.classes.forEach(function(c){ if (c.id === '${CLS}') c.categories[0].dropLowest = 1; }); });
  await s.flush();
  var dd = s.getDoc(), c2 = dd.classes.filter(function(x){ return x.id === '${CLS}'; })[0];
  var dropped = [G.isDropped(dd, c2, '${Q1}', '${S.ada}', '${A.e2}'), G.isDropped(dd, c2, '${Q1}', '${S.cy}', '${A.e2}')];
  var withDrop = read();
  s.update(function(doc){ doc.classes.forEach(function(c){ if (c.id === '${CLS}') delete c.categories[0].dropLowest; }); });
  /* The hold taken off H1, read, and put back — what the held column WOULD add if it were live. */
  s.update(function(doc){ doc.assignments.forEach(function(a){ if (a.id === '${A.h1}') delete a.held; }); });
  await s.flush();
  var live = read();
  s.update(function(doc){ doc.assignments.forEach(function(a){ if (a.id === '${A.h1}') a.held = true; }); });
  await s.flush();
  var back = read();
  return { plain: plain, withDrop: withDrop, dropped: dropped, live: live, back: back, held: held,
    q2: T.emptyBoxes(d, cls, '${Q2}').count }; })()`);
const CATS = JSON.stringify([{ id: KE, name: 'Exams' }, { id: KP, name: 'Projects' }]);
check('WO-3.72: the empty-boxes reader counts 12 in Q1 — a scoreless late mark among them (ben\'s Exam 2), '
  + 'never cy\'s excused or missing cell (14 if it did) — and names Exams and Projects, never Homework, '
  + 'in the class\'s order; with Exams dropping its lowest 1 the two dropped cells are not empty and '
  + 'the count stays 12',
  boxes.plain.count === 12 && JSON.stringify(boxes.plain.categories) === CATS
    && JSON.stringify(boxes.dropped) === '[true,true]'
    && boxes.withDrop.count === 12 && JSON.stringify(boxes.withDrop.categories) === CATS,
  JSON.stringify({ plain: boxes.plain, dropped: boxes.dropped, withDrop: boxes.withDrop }));
check('WO-3.72: nothing in a held column is an empty box — Q1 reads 12 with the held quiz held and 17 '
  + 'with its hold taken off (its five blanks), 12 again once it is held back — and heldColumns() '
  + 'names it on a line of its own; another term\'s blanks are that term\'s',
  boxes.plain.count === 12 && boxes.live.count === 17 && boxes.back.count === 12
    && JSON.stringify(boxes.held) === JSON.stringify([{ id: A.h1, name: 'WO-3.72 Held quiz' }])
    && boxes.q2 === 6,
  JSON.stringify({ held: boxes.held, live: boxes.live.count, back: boxes.back.count, q2: boxes.q2 }));

/* ── ACCEPTANCE LINE 1: recording appends one entry; recording again appends a second ── */
const rec = await evalJs(`(async function(){ ${P}
  var others = function(dd){ return JSON.stringify([dd.classes, dd.students, dd.assignments, dd.scores]); };
  var before = { unrecorded: [T.newestRecord(d, cls, '${Q1}'), T.noLongerMatching(d, cls, '${Q1}')],
    others: others(d) };
  var first = T.recordTerm(cls, '${Q1}');
  await s.flush();
  var firstStored = JSON.stringify(s.getDoc().termRecords.filter(function(e){ return e.classId === '${CLS}'; })[0]);
  var second = T.recordTerm(cls, '${Q1}');
  await s.flush();
  var dd = s.getDoc();
  var mine = dd.termRecords.filter(function(e){ return e.classId === '${CLS}'; });
  var c = dd.classes.filter(function(x){ return x.id === '${CLS}'; })[0];
  var engine = mine[0].grades.map(function(g){ var live = G.classGrade(dd, c, '${Q1}', g.studentId);
    return g.percentage === live.percentage && g.letter === live.letter; });
  return { before: before.unrecorded, sameOthers: others(dd) === before.others,
    count: mine.length, keys: Object.keys(mine[0]), gradeKeys: Object.keys(mine[0].grades[0]),
    at: mine[0].at, ids: [first && first.id, second && second.id, mine[0].id, mine[1].id],
    firstKept: JSON.stringify(mine[0]) === firstStored,
    sameGrades: JSON.stringify(mine[0].grades) === JSON.stringify(mine[1].grades),
    grades: mine[0].grades.map(function(g){ return [g.studentId, pf(g.percentage), g.letter]; }),
    engine: engine, newest: (T.newestRecord(dd, c, '${Q1}') || {}).id,
    changed: T.noLongerMatching(dd, c, '${Q1}') }; })()`);
const RECORDED = JSON.stringify([[S.ada, '89.50', 'B'], [S.ben, '76.50', 'C'], [S.cy, '65.00', 'D'],
  [S.dee, '88.00', 'B'], [S.fay, '57.14', 'F']]);
check('WO-3.72: recording Q1 appends ONE entry — id, classId, termId, a local `at` with its offset, and '
  + 'grades — holding every graded student in roster order (ada, ben, cy, dee, fay; not eve, who has no '
  + 'grade, and not the dangling id) with classGrade()\'s own percentage and letter, compared with ===; '
  + 'recording again appends a second with the same grades and leaves the first byte for byte, and '
  + 'neither touches the classes, students, assignments or scores',
  JSON.stringify(rec.before) === '[null,null]' && rec.count === 2
    && JSON.stringify(rec.keys) === '["id","classId","termId","at","grades"]'
    && JSON.stringify(rec.gradeKeys) === '["studentId","percentage","letter"]'
    && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/.test(rec.at)
    && rec.ids[0] === rec.ids[2] && rec.ids[1] === rec.ids[3] && rec.ids[0] !== rec.ids[1]
    && rec.firstKept && rec.sameGrades && rec.sameOthers
    && JSON.stringify(rec.grades) === RECORDED && rec.engine.length === 5 && rec.engine.every(Boolean)
    && rec.newest === rec.ids[1],
  JSON.stringify(rec));

/* ── ACCEPTANCE LINE 2: nothing changed, nobody reported ── */
check('WO-3.72: with nothing changed since the recording, no student is reported as changed — an empty '
  + 'list, where the same question before any recording answered null',
  Array.isArray(rec.changed) && rec.changed.length === 0 && rec.before[1] === null,
  JSON.stringify({ after: rec.changed, before: rec.before[1] }));

/* A float that prints the same is never a change, and a tie on `at` goes to the later write. The
   harness appends a record by hand with the newest record's own `at`: ben 76.501 (prints 76.50) and
   cy 65.006 (prints 65.01). If the tie went to the earlier write, the reader would compare against
   the real record and report nobody. */
const nearby = await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){
    var mine = doc.termRecords.filter(function(e){ return e.classId === '${CLS}'; });
    var last = mine[mine.length - 1];
    var copy = JSON.parse(JSON.stringify(last));
    copy.id = 'tr_wo372near';
    copy.grades.forEach(function(g){
      if (g.studentId === '${S.ben}') g.percentage = 76.501;
      if (g.studentId === '${S.cy}') g.percentage = 65.006; });
    doc.termRecords.push(copy); });
  await s.flush();
  ${P}
  return { newest: T.newestRecord(d, cls, '${Q1}').id, changed: rows(T.noLongerMatching(d, cls, '${Q1}')) }; })()`);
check('WO-3.72: percentages are compared at the two decimals the screens print — against a record holding '
  + 'ben at 76.501 (prints 76.50, as his live grade does) and cy at 65.006 (prints 65.01), only cy is '
  + 'reported, with her letter unchanged; and that record, written last with the same `at` as the one '
  + 'before it, is the newest',
  nearby.newest === 'tr_wo372near'
    && JSON.stringify(nearby.changed) === JSON.stringify([{ id: S.cy, rec: ['65.01', 'D'], live: ['65.00', 'D'] }]),
  JSON.stringify(nearby));

/* ── ACCEPTANCE LINE 3: a score edit inside one letter ── */
await record();
const edit = await change(`cell('${A.e1}', '${S.ben}').v = 72;`);
check('WO-3.72: a score edit that moves a percentage inside the same letter — ben\'s Exam 1 70 → 72 — '
  + 'reports ben and nobody else, recorded 76.50 C beside live 77.50 C',
  JSON.stringify(edit) === JSON.stringify([{ id: S.ben, rec: ['76.50', 'C'], live: ['77.50', 'C'] }]),
  JSON.stringify(edit));

/* ── ACCEPTANCE LINE 4: weights, the letter scale and a drop count ── */
await record();
const weights = await change(`cls.categories[0].weight = 40; cls.categories[1].weight = 40;`);
const weightsBack = await change(`cls.categories[0].weight = 50; cls.categories[1].weight = 30;`);
check('WO-3.72: a weight change that moves grades — Exams 50 → 40, Projects 30 → 40 — reports exactly the '
  + 'students whose figures moved: ada 89.50 B → 90.00 A, ben 77.50 → 78.80 C, cy 65.00 D → 56.00 F, '
  + 'fay 57.14 → 56.67 F; not dee, whose only graded category is Exams. Put back, nobody is reported',
  JSON.stringify(weights) === JSON.stringify([
    { id: S.ada, rec: ['89.50', 'B'], live: ['90.00', 'A'] },
    { id: S.ben, rec: ['77.50', 'C'], live: ['78.80', 'C'] },
    { id: S.cy, rec: ['65.00', 'D'], live: ['56.00', 'F'] },
    { id: S.fay, rec: ['57.14', 'F'], live: ['56.67', 'F'] }])
    && JSON.stringify(weightsBack) === '[]',
  JSON.stringify({ weights: weights, back: weightsBack }));

const scale = await change(`cls.letterScale = [{ letter: 'A', min: 90 }, { letter: 'B', min: 88.5 },
  { letter: 'C', min: 78 }, { letter: 'D', min: 60 }, { letter: 'F', min: 0 }];`);
const scaleBack = await change(`cls.letterScale = ${JSON.stringify(SCALE)};`);
check('WO-3.72: a letter-scale change that moves letters — B from 80 to 88.5, C from 70 to 78 — reports '
  + 'exactly ben (77.50 C → D) and dee (88.00 B → C), their percentages unmoved; not ada at 89.50, still '
  + 'a B. Put back, nobody is reported',
  JSON.stringify(scale) === JSON.stringify([
    { id: S.ben, rec: ['77.50', 'C'], live: ['77.50', 'D'] },
    { id: S.dee, rec: ['88.00', 'B'], live: ['88.00', 'C'] }])
    && JSON.stringify(scaleBack) === '[]',
  JSON.stringify({ scale: scale, back: scaleBack }));

const drop = await change(`cls.categories[0].dropLowest = 1;`);
const dropBack = await change(`delete cls.categories[0].dropLowest;`);
check('WO-3.72: a drop-lowest change that moves grades — Exams drops its lowest 1 — reports exactly ada '
  + '(89.50 B → 92.00 A) and cy (65.00 → 67.50 D, the same letter); not ben, whose late blank is no '
  + 'candidate, nor dee and fay with one score each. Put back, nobody is reported',
  JSON.stringify(drop) === JSON.stringify([
    { id: S.ada, rec: ['89.50', 'B'], live: ['92.00', 'A'] },
    { id: S.cy, rec: ['65.00', 'D'], live: ['67.50', 'D'] }])
    && JSON.stringify(dropBack) === '[]',
  JSON.stringify({ drop: drop, back: dropBack }));

/* ── WHO IS ASKED: a newcomer, a leaver (the owner's ruling) and a grade that has gone ── */
const joins = await change(`cls.roster.push('${S.gus}'); doc.scores['${A.e1}']['${S.gus}'] = { v: 75 };`);
check('WO-3.72: a student with a grade now who was not in the record is reported — gus joins with 75 on '
  + 'Exam 1, recorded null, live 75.00 C',
  JSON.stringify(joins) === JSON.stringify([{ id: S.gus, rec: null, live: ['75.00', 'C'] }]),
  JSON.stringify(joins));

await record();
const leaves = await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){
    var cls = doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
    cls.roster = cls.roster.filter(function(id){ return id !== '${S.fay}'; });
    doc.scores['${A.e1}']['${S.fay}'].v = 95; });
  await s.flush();
  ${P}
  var newest = T.newestRecord(d, cls, '${Q1}');
  var fayNow = G.classGrade(d, cls, '${Q1}', '${S.fay}');
  return { changed: rows(T.noLongerMatching(d, cls, '${Q1}')),
    fayRecorded: newest.grades.filter(function(g){ return g.studentId === '${S.fay}'; })
      .map(function(g){ return [pf(g.percentage), g.letter]; })[0] || null,
    fayNow: [pf(fayNow.percentage), fayNow.letter] }; })()`);
check('WO-3.72 (the owner\'s ruling, 2026-10-23): a student recorded in the quarter who has since LEFT the '
  + 'roster is left out — fay is in the newest record at 57.14 F, is taken off the roster, and her '
  + 'Exam 1 then moves 60 → 95 (her grade would read 82.14 B), and nobody is reported',
  Array.isArray(leaves.changed) && leaves.changed.length === 0
    && JSON.stringify(leaves.fayRecorded) === '["57.14","F"]'
    && JSON.stringify(leaves.fayNow) === '["82.14","B"]',
  JSON.stringify(leaves));

const gone = await change(`cell('${A.e1}', '${S.dee}').flag = 'excused';`);
const goneBack = await change(`delete cell('${A.e1}', '${S.dee}').flag;`);
check('WO-3.72: a student on the roster whose grade has GONE since the recording is reported — dee\'s '
  + 'only score excused, recorded 88.00 B beside live none — because the SIS still holds what was keyed. '
  + 'Put back, nobody is reported',
  JSON.stringify(gone) === JSON.stringify([{ id: S.dee, rec: ['88.00', 'B'], live: [null, null] }])
    && JSON.stringify(goneBack) === '[]',
  JSON.stringify({ gone: gone, back: goneBack }));

/* ── ACCEPTANCE LINE 8: one writer, and it only pushes ──
   Read off the file rather than driven — the posture tools/verify/log-entries.mjs takes about
   src/log.js: driving proves what today's paths did, and reading refuses the spellings in REMOVERS
   and one assignment regex wherever they sit. Comments come out first, because the header names the
   very words.

   A FENCE, NOT A READING. WO-1.84 planted 52 removal shapes against this check's own code
   (TESTING.md § WO-1.84) and 31 passed. The families that pass it:
   - a BRACKETED OR COMPUTED ROOT KEY (`d['termRecords'] = []`, `d["…"]`, a template key, `d[k]`) —
     the regex wants `termRecords` followed by `=` or by one subscript, never a quote and a `]`;
   - a COMPOUND OR LOGICAL ASSIGNMENT (`+=`, `-=`, `&&=`, `||=`, `??=`, dotted or bracketed);
   - DESTRUCTURING ASSIGNMENT (`[d.termRecords] = [[]]`, `({ termRecords: d.termRecords } = …)`);
   - an INDEX WRITE through a bracketed key or an alias (`d['termRecords'][0] = x`,
     `const l = d.termRecords; l[0] = x`);
   - an EDIT TO A STORED RECORD, directly or through an alias (`d.termRecords[0].x = y`) — the
     lookup half is refused (`.find(`, `findIndex(`), the edit itself is not;
   - EVERY `.length` WRITE — `= 0`, `-=`, `--`, `++`, through an alias — there is no `.length`
     pattern here at all;
   - a MUTATOR NAMED BY A STRING OR BORROWED (`d.termRecords['splice'](0, 1)`,
     `Array.prototype.splice.call(…)`);
   - `Reflect.set` (including on `length`), `Reflect.deleteProperty` and `Object.defineProperty`
     (`Object.assign(` and every `delete ` ARE refused);
   - and the WHOLE-DOCUMENT SWAPS, `restoreDocument(` and `adoptRemoteDocument(`, bare or through
     `store.`.
   The title below said "the create-on-first-write guard is its only other line touching the block"
   until WO-1.85; every family above touches the block, so it now says the guard is present and
   names the spellings searched. */
const source = await fs.readFile(path.join(ROOT, 'src/term-record.js'), 'utf8');
const engineSource = await fs.readFile(path.join(ROOT, 'src/grade-engine.js'), 'utf8');
/* Line endings first: the writer is cut out at its closing `\n}\n`, and a file saved with CRLF endings
   read as having no writer at all — it did, once, on the mutation run, when the planted copy was
   written back with Windows endings. */
const code = source.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '\n').replace(/^\s*\/\/.*$/gm, '');
const guard = 'if (!Array.isArray(d.termRecords)) d.termRecords = [];';
const writerAt = code.indexOf('export function recordTerm(');
const writerEnd = writerAt < 0 ? -1 : code.indexOf('\n}\n', writerAt);
const writer = writerAt < 0 || writerEnd < 0 ? '' : code.slice(writerAt, writerEnd);
const outside = writerAt < 0 ? code : code.slice(0, writerAt) + code.slice(writerEnd);
const count = (text, re) => (text.match(re) || []).length;
const REMOVERS = ['.splice(', '.pop(', '.shift(', '.unshift(', '.sort(', '.reverse(', '.fill(',
  '.copyWithin(', 'delete ', 'Object.assign(', 'findIndex(', '.find('];
const withoutGuard = code.split(guard).join('');
const found = REMOVERS.filter((token) => withoutGuard.indexOf(token) !== -1)
  .concat(/termRecords\s*(\[[^\]]*\])?\s*=[^=]/.test(withoutGuard) ? ['an assignment to termRecords'] : []);
const exported = [...code.matchAll(/export function (\w+)\(/g)].map((m) => m[1]);
const imports = [...code.matchAll(/from '\.\/([\w-]+)\.js'/g)].map((m) => m[1]);
check('WO-3.72: src/term-record.js holds one writer, and it only pushes — recordTerm() holds the file\'s '
  + 'only update() and only push(), the create-on-first-write guard is present, and nowhere in the '
  + 'code is there one of the spellings it searches for — splice, pop, shift, unshift, sort, reverse, '
  + 'fill, copyWithin, delete, Object.assign, termRecords followed by = or by one subscript and =, or '
  + 'a lookup of a record by find/findIndex (a fence, '
  + 'not a reading: bracketed and computed keys, compound and logical assignment, destructuring, '
  + 'index writes through an alias, record edits, every .length write, borrowed mutators, '
  + 'Reflect.set/deleteProperty, Object.defineProperty and whole-document swaps pass it); it '
  + 'imports the engine and the attendance date helper, and src/grade-engine.js does not import it '
  + 'back',
  writer.length > 0 && count(code, /\.push\(/g) === 1 && count(writer, /\.push\(/g) === 1
    && count(code, /\bupdate\(/g) === 1 && count(writer, /\bupdate\(/g) === 1
    && count(outside, /\.push\(|\bupdate\(/g) === 0 && code.indexOf(guard) !== -1
    && found.length === 0
    && JSON.stringify(exported) === JSON.stringify(['recordTerm', 'termEnded', 'termEndsToday',
      'newestRecord', 'noLongerMatching', 'emptyBoxes', 'heldColumns'])
    && imports.indexOf('grade-engine') !== -1 && imports.indexOf('attendance') !== -1
    && engineSource.indexOf('term-record') === -1,
  JSON.stringify({ pushes: count(code, /\.push\(/g), updates: count(code, /\bupdate\(/g),
    writerLines: writer.split('\n').length, found: found, exported: exported, imports: imports,
    engineImportsBack: engineSource.indexOf('term-record') !== -1 }));

/* ── ACCEPTANCE LINE 7: a backup with no termRecords key ──
   The key comes off the document, this run's own year is written by the backup module, and the file
   is searched for the word: it must not be there at all. It parses, restores through the real
   confirm, and every reader reads the quarter as never recorded. One recording after it creates the
   block — the first write — and that is the only way the key comes back. */
const boxesBefore = await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ delete doc.termRecords; });
  await s.flush();
  ${P}
  return T.emptyBoxes(d, cls, '${Q1}').count; })()`);
const file = await evalJs(`(async function(){
  var b = window.planbook.backup, built = await b.buildBackup();
  var parsed = b.parseBackup(built.text, 'wo372.json');
  return { text: built.text, has: built.text.indexOf('termRecords') !== -1, parsed: !!(parsed && parsed.doc),
    fresh: Object.prototype.hasOwnProperty.call(window.planbook.store.newYearDocument('2099-2100'), 'termRecords') }; })()`);
await evalJs(`(async function(){
  await window.planbook.backup.restoreFromText(${JSON.stringify(file.text)}, 'Planbook wo372.json'); return 1; })()`);
await clickSel('[data-backup-confirm]');
await sleep(600);
const restored = await evalJs(`(async function(){ ${P}
  var out = { key: Object.prototype.hasOwnProperty.call(d, 'termRecords'), cls: !!cls,
    newest: cls ? T.newestRecord(d, cls, '${Q1}') : 'no class', changed: cls ? T.noLongerMatching(d, cls, '${Q1}') : 'no class',
    boxes: cls ? T.emptyBoxes(d, cls, '${Q1}').count : null };
  var e = cls ? T.recordTerm(cls, '${Q1}') : null;
  await s.flush();
  var dd = s.getDoc();
  out.afterWrite = Array.isArray(dd.termRecords) ? dd.termRecords.length : null;
  out.newestAfter = e && (T.newestRecord(dd, cls, '${Q1}') || {}).id === e.id;
  return out; })()`);
check('WO-3.72: a backup with no termRecords key — the word nowhere in the file, and none in a new year '
  + 'document — parses, restores through the real confirm, and reads as unrecorded: no key on the '
  + 'restored document, no newest record and no comparison (null) for the class, its empty boxes the '
  + '13 they were before the restore (gus in and fay out since the first count: + 4 − 3); the next '
  + 'recording creates the block with one entry',
  !file.has && file.parsed && !file.fresh && restored.cls && restored.key === false
    && restored.newest === null && restored.changed === null && boxesBefore === 13 && restored.boxes === 13
    && restored.afterWrite === 1 && restored.newestAfter === true,
  JSON.stringify({ inFile: file.has, parsed: file.parsed, freshHasKey: file.fresh, boxesBefore: boxesBefore, restored: restored }));

/* ── THE FIXTURE COMES BACK OUT ── */
await evalJs(`(async function(){
  var s = window.planbook.store;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo372-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a372-') === 0) delete doc.scores[k]; });
    if (${plant.had ? 'true' : 'false'}) {
      doc.termRecords = (doc.termRecords || []).filter(function(e){ return e.classId !== '${CLS}'; });
    } else {
      delete doc.termRecords;
    }
  });
  window.planbook.classes.refreshClassBar();
  await s.flush();
  return 1; })()`);
const cleared = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { classes: d.classes.filter(function(x){ return x.id === '${CLS}'; }).length,
    students: d.students.filter(function(x){ return String(x.id).indexOf('wo372-') === 0; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${CLS}'; }).length,
    scores: Object.keys(d.scores || {}).filter(function(k){ return String(k).indexOf('a372-') === 0; }).length,
    records: Object.prototype.hasOwnProperty.call(d, 'termRecords') }; })()`);
check('the WO-3.72 fixture came back off the document, and the termRecords key is as it was found',
  cleared.classes === 0 && cleared.students === 0 && cleared.work === 0 && cleared.scores === 0
    && cleared.records === !!plant.had,
  JSON.stringify(cleared) + ' · had the key at the start: ' + plant.had);
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
