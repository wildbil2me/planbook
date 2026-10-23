/* drop-lowest.mjs — a category can drop each student's lowest N scores (WO-3.69)
 *
 * A category may carry `dropLowest`, and the grade engine leaves each student's lowest N scored cells
 * in it out of the grade. Nothing is written to a cell: the engine decides at read time, and
 * isDropped() in src/grade-engine.js is the one asker every screen uses. The owner's six rulings of
 * 2026-10-22 are the spine of this section, and the work order's Trap is why the reader checks are
 * SETS COMPARED TO A LITERAL: "no screen works out which cell is dropped", so the grid, the grade
 * sheet, its CSV, student detail and the student CSV are each read for the cells they mark, and each
 * must name exactly the cells written down below by hand.
 *
 * THE FIXTURE, AND THE HAND ARITHMETIC. One class, Quizzes 50% (dropLowest 1, then 2) and Tests 50%,
 * six students. Columns in document order — the test first, so the quizzes end every student's score
 * sequence — with due dates as day offsets from today:
 *
 *   t1 Test     100 pts  due +20   (Tests)
 *   q1 Quiz 1    10 pts  due +11        qx Bonus     0 pts  due +8   (extra credit)
 *   q2 Quiz 2    20 pts  due +10        q5 Quiz 5   10 pts  due +18
 *   q3 Quiz 3    10 pts  due +15        qh Held quiz 10 pts due +19   (held)
 *   q4 Quiz 4    10 pts  due +15
 *   lo Loose     10 pts  due +21  — filed under no category
 *
 *            q1        q2   q3  q4  qx  q5          qh  t1  lo   (t1 is first in the document)
 *   Ada       6        10    9   8   2  missing      1  80   1
 *   Ben   Ex(1 kept)    —    7   9   —  5            2  90   —
 *   Cy        7        14    9   9   —  —            —  70   —
 *   Dee       9        18    5   5   0  —            —  85   —
 *   Eve       6         —    8   —   —  missing      —  75   —
 *   Fred      9        18    5   4   —  3 late       —  40   —
 *
 * Candidates are scored cells worth points, outside a held column: never Ben's excused quiz, his blank,
 * a missing zero, the bonus, the held quiz or the loose work. Ranked by percentage of points:
 *
 *   drop 1   Ada q2 (10/20 = 50%, below q1's 6/10 = 60%: by percentage, not by points)
 *            Ben q5 (50%; his excused 1/10 and held 2/10 are lower and are not candidates)
 *            Cy  q2 (70%, tied with q1, and due a day EARLIER — ruling 2's first tiebreak)
 *            Dee q3 (50%, tied with q4 on the same due date — the column further left; her 0 on
 *                    the zero-point bonus is not a candidate, ruling 6)
 *            Eve q1 (60%; her missing q5 is never dropped, ruling 1)
 *            Fred q5 (3/10 late = 30%)
 *   drop 2   Ada q1 q2 · Ben q3 q5 · Cy q1 q2 · Dee q3 q4 · Eve q1 only (two candidates, and the best
 *            is kept — ruling 4) · Fred q4 q5
 *
 *   Ada, weighted (Quizzes / class):   none 35/60 = 58.333…% → 69.1666…%
 *                                      drop 1  25/40 = 62.5%  → 71.25%
 *                                      drop 2  19/30 = 63.333…% → 71.6666…%
 *   Ada, points (loose work counts there, 1/10, and is never dropped — ruling 3):
 *                                      none 116/170 = 68.2352…%
 *                                      drop 1  106/150 = 70.6666…%
 *                                      drop 2  100/140 = 71.4285…%
 *   Drop 1, weighted, the grid's figures: Ada 71.25 · Ben 85.00 · Cy 76.67 · Dee 82.50 · Eve 57.50 ·
 *   Fred 56.00. No drop: 69.17 · 80.00 · 74.00 · 79.50 · 60.83 · 52.50.
 *
 * Every expected value below is a literal copied from this table, never a formula — a check that
 * worked the drop out for itself would agree with a build that got it wrong the same way.
 *
 * The section plants its own class, reloads at its head, under a coarse pointer and at its foot,
 * restores this run's own year over itself once, takes the class back out, and hands the page back
 * at 1280x900 with touch off and presentation mode where it found it.
 *
 * WHAT IS NOT HERE AND IS OWED TO A HUMAN: whether the *Drop lowest* field and a dropped cell READ
 * clearly on the iPad. Computed style proves the strike and the tag are drawn and the field is 44px;
 * no emulator has eyes.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

console.log('\n--- a category can drop each student\'s lowest N scores (WO-3.69) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.scores && window.planbook.gradeEngine"
  + " && typeof window.planbook.gradeEngine.isDropped === 'function'"
  + " && window.planbook.gradesReport && window.planbook.backup && window.planbook.detail"
  + " && window.planbook.signals && window.planbook.mergeFields && window.planbook.categories"
  + " && window.planbook.supports)"))) {
  skip('a category can drop each student\'s lowest N scores (WO-3.69)', 'window.planbook is missing '
    + 'gradeEngine.isDropped or one of the readers, so the drop cannot be read back');
  return;
}

const CLS = 'c_wo369', TERM = 'tm369', QUIZ = 'k369q', TEST = 'k369t';
const S = { ada: 'wo369-ada', ben: 'wo369-ben', cy: 'wo369-cy', dee: 'wo369-dee', eve: 'wo369-eve',
  fred: 'wo369-fred' };
const A = { q1: 'a369-q1', q2: 'a369-q2', q3: 'a369-q3', q4: 'a369-q4', qx: 'a369-qx', q5: 'a369-q5',
  qh: 'a369-qh', t1: 'a369-t1', lo: 'a369-lo' };
const T_START = nodeDaysFromToday(-30), T_END = nodeDaysFromToday(60);

/* The hand-worked answers. A key is `assignment/student`, sorted, so two sets compare as strings. */
const key = (a, s) => A[a] + '/' + S[s];
const set = (list) => JSON.stringify(list.slice().sort());
const DROP1 = set([key('q2', 'ada'), key('q5', 'ben'), key('q2', 'cy'), key('q3', 'dee'), key('q1', 'eve'),
  key('q5', 'fred')]);
const DROP2 = set([key('q1', 'ada'), key('q2', 'ada'), key('q3', 'ben'), key('q5', 'ben'), key('q1', 'cy'),
  key('q2', 'cy'), key('q3', 'dee'), key('q4', 'dee'), key('q1', 'eve'), key('q4', 'fred'), key('q5', 'fred')]);
const GRID_DROP1 = { ada: '71.25%', ben: '85.00%', cy: '76.67%', dee: '82.50%', eve: '57.50%', fred: '56.00%' };
const GRID_NONE = { ada: '69.17%', ben: '80.00%', cy: '74.00%', dee: '79.50%', eve: '60.83%', fred: '52.50%' };
const near = (x, want) => typeof x === 'number' && Math.abs(x - want) < 1e-9;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const flush = () => evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');

await flush();
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var mode = window.planbook.supports.presentationMode();
  window.planbook.supports.setPresentationMode(false);
  var S = ${JSON.stringify(S)}, A = ${JSON.stringify(A)};
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id:S.ada, first:'Ada', last:'Apple' }, { id:S.ben, first:'Ben', last:'Birch' },
      { id:S.cy, first:'Cy', last:'Cole' }, { id:S.dee, first:'Dee', last:'Dunn' },
      { id:S.eve, first:'Eve', last:'Ebb' }, { id:S.fred, first:'Fred', last:'Fox' });
    doc.classes.push({ id:'${CLS}', name:'WO-3.69 Drop lowest', archived:false, letterScale:null,
      roster:[S.fred, S.ada, S.eve, S.ben, S.dee, S.cy],
      terms:[{ id:'${TERM}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'${QUIZ}', name:'Quizzes', weight:50, dropLowest:1 },
                  { id:'${TEST}', name:'Tests', weight:50 }]});
    var add = function(id, cat, name, points, due, extra){
      var a = { id:id, classId:'${CLS}', termId:'${TERM}', categoryId:cat,
        name:name, points:points, assigned:'${T_START}', due:due };
      if (extra) a.held = true;
      doc.assignments.push(a);
    };
    /* The test FIRST in the document's order, so the quizzes are the last scores in Fred's sequence and
       ruling 5's run can be read off them alone — see the signals check. */
    add(A.t1, '${TEST}', 'WO-3.69 Test', 100, '${nodeDaysFromToday(20)}');
    add(A.q1, '${QUIZ}', 'WO-3.69 Quiz 1', 10, '${nodeDaysFromToday(11)}');
    add(A.q2, '${QUIZ}', 'WO-3.69 Quiz 2', 20, '${nodeDaysFromToday(10)}');
    add(A.q3, '${QUIZ}', 'WO-3.69 Quiz 3', 10, '${nodeDaysFromToday(15)}');
    add(A.q4, '${QUIZ}', 'WO-3.69 Quiz 4', 10, '${nodeDaysFromToday(15)}');
    add(A.qx, '${QUIZ}', 'WO-3.69 Bonus', 0, '${nodeDaysFromToday(8)}');
    add(A.q5, '${QUIZ}', 'WO-3.69 Quiz 5', 10, '${nodeDaysFromToday(18)}');
    add(A.qh, '${QUIZ}', 'WO-3.69 Held quiz', 10, '${nodeDaysFromToday(19)}', true);
    add(A.lo, '', 'WO-3.69 Loose', 10, '${nodeDaysFromToday(21)}');
    doc.scores[A.q1] = {}; doc.scores[A.q1][S.ada] = { v:6 }; doc.scores[A.q1][S.ben] = { v:1, flag:'excused' };
      doc.scores[A.q1][S.cy] = { v:7 }; doc.scores[A.q1][S.dee] = { v:9 }; doc.scores[A.q1][S.eve] = { v:6 };
      doc.scores[A.q1][S.fred] = { v:9 };
    doc.scores[A.q2] = {}; doc.scores[A.q2][S.ada] = { v:10 }; doc.scores[A.q2][S.cy] = { v:14 };
      doc.scores[A.q2][S.dee] = { v:18 }; doc.scores[A.q2][S.fred] = { v:18 };
    doc.scores[A.q3] = {}; doc.scores[A.q3][S.ada] = { v:9 }; doc.scores[A.q3][S.ben] = { v:7 };
      doc.scores[A.q3][S.cy] = { v:9 }; doc.scores[A.q3][S.dee] = { v:5 }; doc.scores[A.q3][S.eve] = { v:8 };
      doc.scores[A.q3][S.fred] = { v:5 };
    doc.scores[A.q4] = {}; doc.scores[A.q4][S.ada] = { v:8 }; doc.scores[A.q4][S.ben] = { v:9 };
      doc.scores[A.q4][S.cy] = { v:9 }; doc.scores[A.q4][S.dee] = { v:5 }; doc.scores[A.q4][S.fred] = { v:4 };
    doc.scores[A.qx] = {}; doc.scores[A.qx][S.ada] = { v:2 }; doc.scores[A.qx][S.dee] = { v:0 };
    doc.scores[A.q5] = {}; doc.scores[A.q5][S.ada] = { v:null, flag:'missing' }; doc.scores[A.q5][S.ben] = { v:5 };
      doc.scores[A.q5][S.eve] = { v:null, flag:'missing' }; doc.scores[A.q5][S.fred] = { v:3, flag:'late' };
    doc.scores[A.qh] = {}; doc.scores[A.qh][S.ada] = { v:1 }; doc.scores[A.qh][S.ben] = { v:2 };
    doc.scores[A.t1] = {}; doc.scores[A.t1][S.ada] = { v:80 }; doc.scores[A.t1][S.ben] = { v:90 };
      doc.scores[A.t1][S.cy] = { v:70 }; doc.scores[A.t1][S.dee] = { v:85 }; doc.scores[A.t1][S.eve] = { v:75 };
      doc.scores[A.t1][S.fred] = { v:40 };
    doc.scores[A.lo] = {}; doc.scores[A.lo][S.ada] = { v:1 };
  });
  c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, mode: mode, open: c.getOpenTermId('${CLS}') }; })()`);

if (!plant || !plant.ok || plant.open !== TERM) {
  check('the WO-3.69 fixture is real: one class of six, open on its term', false, JSON.stringify(plant));
  return;
}

/* The engine over a CLONE of the live document with the class's drop and mode set — so the engine
   claims are made before anything is pressed and the live document is never touched by them. */
const engine = (drop, mode) => evalJs(`(function(){
  var p = window.planbook, g = p.gradeEngine, d = JSON.parse(JSON.stringify(p.store.getDoc()));
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var quiz = cls.categories.filter(function(k){ return k.id === '${QUIZ}'; })[0];
  if (${JSON.stringify(drop)} === null) delete quiz.dropLowest; else quiz.dropLowest = ${JSON.stringify(drop)};
  if (${JSON.stringify(mode)} === 'points') cls.gradingMode = 'points'; else delete cls.gradingMode;
  var S = ${JSON.stringify(S)}, A = ${JSON.stringify(A)};
  var ada = g.classGrade(d, cls, '${TERM}', S.ada);
  var quizCat = ada.categories.filter(function(k){ return k.id === '${QUIZ}'; })[0];
  var looseRow = ada.categories.filter(function(k){ return k.id === null; })[0] || null;
  var dropped = [];
  Object.keys(S).forEach(function(s){ Object.keys(A).forEach(function(a){
    if (g.isDropped(d, cls, '${TERM}', S[s], A[a])) dropped.push(A[a] + '/' + S[s]); }); });
  var quizzes = {};
  Object.keys(S).forEach(function(s){
    var r = g.categoryResult(d, cls, '${TERM}', '${QUIZ}', S[s]); quizzes[s] = [r.earned, r.possible]; });
  return { mode: g.gradingModeOf(cls), pct: ada.percentage, quiz: quizCat ? [quizCat.earned, quizCat.possible] : null,
    loose: looseRow ? [looseRow.earned, looseRow.possible] : null,
    dropped: JSON.stringify(dropped.sort()), quizzes: quizzes,
    open: JSON.stringify(g.openWork(d, cls, '${TERM}', S.ada)) }; })()`);

/* ── ACCEPTANCE LINE 1: the hand-worked fixture, dropLowest 1 and 2, both grading modes ── */
const none = { weighted: await engine(null, 'weighted'), points: await engine(null, 'points') };
const WANT = {
  weighted: { 1: { pct: 71.25, quiz: [25, 40] }, 2: { pct: 71.66666666666667, quiz: [19, 30] } },
  points: { 1: { pct: 70.66666666666667, quiz: [25, 40] }, 2: { pct: 71.42857142857143, quiz: [19, 30] } },
};
check('WO-3.69: with no dropLowest key the engine drops nothing and grades Ada as the hand table says — '
  + 'weighted 69.1666…% on Quizzes 35/60, points 68.2352…% — so the drop below has something to move',
  none.weighted.dropped === '[]' && none.points.dropped === '[]' && near(none.weighted.pct, 69.16666666666667)
    && near(none.points.pct, 68.23529411764706) && JSON.stringify(none.weighted.quiz) === '[35,60]',
  JSON.stringify(none));
for (const mode of ['weighted', 'points']) {
  for (const drop of [1, 2]) {
    const e = await engine(drop, mode);
    check('WO-3.69: in a ' + mode + ' class with dropLowest ' + drop + ', Ada\'s Quizzes category and class '
      + 'grade match the hand-worked fixture — Quizzes ' + WANT[mode][drop].quiz.join('/') + ', class '
      + WANT[mode][drop].pct + '%' + (mode === 'points' ? ', the loose 1/10 still counted (ruling 3)' : ''),
      e.mode === mode && near(e.pct, WANT[mode][drop].pct)
        && JSON.stringify(e.quiz) === JSON.stringify(WANT[mode][drop].quiz)
        && (mode === 'weighted' ? e.loose === null : JSON.stringify(e.loose) === '[1,10]')
        && e.open === none[mode].open,
      JSON.stringify(e));
  }
}

/* ── ACCEPTANCE LINE 3: which cells are candidates, and the rulings ── */
const d1 = await engine(1, 'weighted');
const d2 = await engine(2, 'weighted');
const d5 = await engine(5, 'weighted');
const d1p = await engine(1, 'points');
check('WO-3.69: isDropped() names exactly the hand table\'s cells at dropLowest 1 — Ada q2 by percentage '
  + 'not points, Ben q5 (his excused 1, blank and held 2 never counted toward N), Cy q2 (the earlier due '
  + 'date of a 70% tie), Dee q3 (the left column of a same-due tie, her 0 on the bonus not a candidate), Eve '
  + 'q1 (her missing zero never dropped), Fred\'s late q5 — and the same in a points class, the loose work '
  + 'never named',
  d1.dropped === DROP1 && d1p.dropped === DROP1, JSON.stringify({ weighted: d1.dropped, points: d1p.dropped,
    want: DROP1 }));
check('WO-3.69: each student\'s Quizzes fraction at dropLowest 1 is the hand table\'s — Ada 25/40, Ben 16/20, '
  + 'Cy 25/30, Dee 32/40 (the bonus 0 adds 0 to both), Eve 8/20 (the missing zero still counts), Fred 36/50',
  JSON.stringify(d1.quizzes) === JSON.stringify({ ada: [25, 40], ben: [16, 20], cy: [25, 30], dee: [32, 40],
    eve: [8, 20], fred: [36, 50] }),
  JSON.stringify(d1.quizzes));
check('WO-3.69: at dropLowest 2 the hand table\'s eleven cells are dropped, and Eve — two scored quizzes — '
  + 'keeps her best (ruling 4); at dropLowest 5 she still keeps it and her Quizzes stay 8/20, never emptied',
  d2.dropped === DROP2 && JSON.stringify(d5.quizzes.eve) === '[8,20]'
    && d5.dropped.indexOf(A.q3 + '/' + S.eve) === -1 && d5.dropped.indexOf(A.q1 + '/' + S.eve) !== -1,
  JSON.stringify({ drop2: d2.dropped, want: DROP2, eveAt5: d5.quizzes.eve }));

/* ── THE GRID ── */
async function goHome() {
  const nth = await evalJs(`(function(){
    var all = document.querySelectorAll('[data-view-home]');
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return i;
    }
    return -1; })()`);
  if (nth >= 0) { await clickSel('[data-view-home]', nth); await sleep(250); }
}
async function openGrid() {
  await goHome();
  await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
  await sleep(250);
  await clickSel('#classView [data-class-screen="scores"]');
  await sleep(300);
}
const cellSel = (a, s) => '#scoresBody [data-score-cell="' + a + '"][data-score-student="' + s + '"]';
const sk = async (k, code, vk, text) => {
  const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 0 };
  if (text) ev.text = text;
  await send('Input.dispatchKeyEvent', Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
  await sleep(45);
};
const typeOver = async (a, s, digits) => {
  await evalJs('(function(){ var i = document.querySelector(' + JSON.stringify(cellSel(a, s))
    + '); if (!i) return 0; i.focus(); i.select(); return 1; })()');
  for (const d of digits) await sk(d, 'Digit' + d, d.charCodeAt(0), d);
};
/* Every field the grid draws as dropped, as `assignment/student`, and the grade text per student. */
const gridRead = () => evalJs(`(function(){
  var S = ${JSON.stringify(S)}, out = [], grades = {};
  document.querySelectorAll('#scoresBody [data-score-cell].dropped').forEach(function(i){
    out.push(i.getAttribute('data-score-cell') + '/' + i.getAttribute('data-score-student')); });
  Object.keys(S).forEach(function(s){
    var row = document.querySelector('#scoresBody tr[data-score-row="' + S[s] + '"]');
    grades[s] = row ? ((row.querySelector('.scores-grade-num') || {}).textContent || '') : ''; });
  var tags = document.querySelectorAll('#scoresBody .scores-dropped').length;
  return { dropped: JSON.stringify(out.sort()), grades: grades, tags: tags }; })()`);
const drawn = (a, s) => evalJs(`(function(){
  var i = document.querySelector(${JSON.stringify(cellSel(a, s))});
  if (!i) return null;
  var st = getComputedStyle(i), tag = i.parentElement ? i.parentElement.querySelector('.scores-dropped') : null;
  var tr = tag ? tag.getBoundingClientRect() : null;
  return { value: i.value, dropped: i.classList.contains('dropped'), line: st.textDecorationLine,
    thick: st.textDecorationThickness, tag: tag ? tag.textContent : '', tagShown: !!tr && tr.width > 0 && tr.height > 0
      && getComputedStyle(tag).visibility !== 'hidden', label: i.getAttribute('aria-label') || '',
    h: i.getBoundingClientRect().height }; })()`);
const struck = (x) => !!x && /line-through/.test(x.line);
const DROP_SAYS = /, dropped as one of this student’s lowest in its category and not counted/;

await openGrid();
const grid1 = await gridRead();
const adaQ2 = await drawn(A.q2, S.ada), adaQ1 = await drawn(A.q1, S.ada), fredQ5 = await drawn(A.q5, S.fred);
check('WO-3.69: the grid marks exactly the hand table\'s cells as dropped at dropLowest 1, one tag each, and '
  + 'every student\'s grade is the hand table\'s figure — Ada 71.25%, Ben 85.00%, Cy 76.67%, Dee 82.50%, '
  + 'Eve 57.50%, Fred 56.00%',
  grid1.dropped === DROP1 && grid1.tags === 6 && JSON.stringify(grid1.grades) === JSON.stringify(GRID_DROP1),
  JSON.stringify(grid1));
check('WO-3.69: a dropped cell draws its score struck through (WO-3.68\'s 2px strike, read as computed style) '
  + 'with a visible `dropped` tag and an accessible name that says so — Ada\'s 10 and Fred\'s late 3 — while '
  + 'Ada\'s counted 6 beside them is neither struck nor tagged',
  !!adaQ2 && adaQ2.value === '10' && adaQ2.dropped && struck(adaQ2) && adaQ2.thick === '2px'
    && adaQ2.tag === 'dropped' && adaQ2.tagShown && DROP_SAYS.test(adaQ2.label)
    && !!fredQ5 && fredQ5.value === '3' && struck(fredQ5) && fredQ5.tag === 'dropped' && / — late/.test(fredQ5.label)
    && DROP_SAYS.test(fredQ5.label)
    && !!adaQ1 && !adaQ1.dropped && !struck(adaQ1) && adaQ1.tag === '' && !DROP_SAYS.test(adaQ1.label),
  JSON.stringify({ adaQ2: adaQ2, fredQ5: fredQ5, adaQ1: adaQ1 }));

/* ── ACCEPTANCE LINE 2: a new, lower score takes the drop over ──
   Ada's Quiz 4 is 8/10 (80%). Typed down to 3 (30%) it is now her lowest: the drop moves onto it and
   her Quiz 2 (10/20) counts again — Quizzes 6+10+9+2 = 27 over 10+20+10+10 = 50, 54%, class 67.00%.
   Typed back to 8, the drop goes back to Quiz 2 and the grade to 71.25%. */
await typeOver(A.q4, S.ada, '3');
await sleep(150);
const over = { q4: await drawn(A.q4, S.ada), q2: await drawn(A.q2, S.ada), grid: await gridRead(),
  quiz: await evalJs(`(function(){ var p = window.planbook, d = p.store.getDoc();
    var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
    var r = p.gradeEngine.categoryResult(d, cls, '${TERM}', '${QUIZ}', '${S.ada}'); return [r.earned, r.possible]; })()`) };
check('WO-3.69: typing 3 into Ada\'s Quiz 4 (80% → 30%) moves the drop onto it as she types — Quiz 4 struck '
  + 'and tagged, Quiz 2 unstruck and counted again, Quizzes 27/50 and her grade 67.00% — with nothing written '
  + 'to either cell but the 3',
  !!over.q4 && over.q4.value === '3' && over.q4.dropped && struck(over.q4) && over.q4.tag === 'dropped'
    && !!over.q2 && !over.q2.dropped && !struck(over.q2) && over.q2.tag === ''
    && JSON.stringify(over.quiz) === '[27,50]' && over.grid.grades.ada === '67.00%',
  JSON.stringify(over));
await typeOver(A.q4, S.ada, '8');
await sleep(150);
const back = { q4: await drawn(A.q4, S.ada), q2: await drawn(A.q2, S.ada), grid: await gridRead(),
  cells: await evalJs(`(async function(){ await window.planbook.store.flush(); var sc = window.planbook.store.getDoc().scores;
    var strip = function(c){ c = JSON.parse(JSON.stringify(c)); delete c.at; delete c.was; return JSON.stringify(c); };
    return [strip(sc['${A.q2}']['${S.ada}']), strip(sc['${A.q4}']['${S.ada}'])]; })()`) };
check('WO-3.69: typed back to 8, the drop returns to Quiz 2 and the grade to 71.25% — and neither cell holds '
  + 'anything but its score: no flag, no mark, nothing that says "dropped" in the document',
  !!back.q2 && back.q2.dropped && struck(back.q2) && !!back.q4 && !back.q4.dropped && !struck(back.q4)
    && back.grid.dropped === DROP1 && back.grid.grades.ada === '71.25%'
    && JSON.stringify(back.cells) === JSON.stringify(['{"v":10}', '{"v":8}']),
  JSON.stringify(back));

/* ── ACCEPTANCE LINE 4: every reader names the same cells ── */
const sheet = await evalJs(`(function(){
  var p = window.planbook, rec = p.gradesReport.gradesRecord();
  var ids = rec.assignments.map(function(a){ return a.id; });
  var fromRecord = [], texts = {};
  rec.students.forEach(function(st){ st.cells.forEach(function(m, i){
    if (/^Dr \\(/.test(m.text)) { fromRecord.push(ids[i] + '/' + st.id); texts[ids[i] + '/' + st.id] = m.text; } }); });
  var csv = p.gradesReport.gradesCsv(rec).text.split('\\r\\n');
  var head = csv.filter(function(l){ return l.indexOf('Student,') === 0; })[0] || '';
  var byName = {}; rec.students.forEach(function(st){ byName[st.name] = st.id; });
  var fromCsv = [];
  csv.forEach(function(line){
    var m = line.match(/^"([^"]*)",(.*)$/); if (!m || !byName[m[1]]) return;
    m[2].split(',').forEach(function(cell, i){ if (/^Dr \\(/.test(cell) && ids[i]) fromCsv.push(ids[i] + '/' + byName[m[1]]); }); });
  p.gradesReport.openGrades(null);
  var printed = [];
  document.querySelectorAll('#gradesRecordModal .grades-report-mark.dropped').forEach(function(n){ printed.push(n.textContent); });
  var keyItems = Array.prototype.map.call(document.querySelectorAll('#gradesRecordModal .grades-report-key-item'),
    function(n){ return n.textContent; });
  p.closeModal('gradesRecordModal');
  return { record: JSON.stringify(fromRecord.sort()), csv: JSON.stringify(fromCsv.sort()), texts: texts,
    printed: printed.sort(), key: keyItems.filter(function(k){ return /^Dr /.test(k); }), head: head.slice(0, 40) }; })()`);
check('WO-3.69: the grade sheet and its CSV mark the hand table\'s cells and no others — `Dr (10)` for Ada\'s '
  + 'Quiz 2, `Dr (3 L)` for Fred\'s late Quiz 5 — six marks on the printed sheet, and a `Dr` entry in its key',
  sheet.record === DROP1 && sheet.csv === DROP1 && sheet.texts[key('q2', 'ada')] === 'Dr (10)'
    && sheet.texts[key('q5', 'fred')] === 'Dr (3 L)' && sheet.printed.length === 6
    && sheet.key.length === 1 && /kept and shown and not counted/.test(sheet.key[0]),
  JSON.stringify(sheet));

const detailFor = async (s) => {
  await openGrid();
  await clickSel('#scoresBody [data-student-detail="' + S[s] + '"]');
  await sleep(300);
  return evalJs(`(function(){
    var p = window.planbook, v = document.getElementById('detailView');
    var rows = Array.prototype.map.call(v.querySelectorAll('[data-detail-dropped-row]'), function(r){
      return r.getAttribute('data-detail-dropped-row') + '/${S[s]}'; });
    var scores = Array.prototype.map.call(v.querySelectorAll('[data-detail-dropped-row] .detail-dropped-score'),
      function(n){ return n.textContent; });
    var names = {}; p.store.getDoc().assignments.forEach(function(a){ if (a.classId === '${CLS}') names[a.name] = a.id; });
    var csv = p.detail.studentCsv(p.detail.detailModel()).text.split('\\r\\n');
    var fromCsv = [], lines = [];
    csv.forEach(function(line){ if (/dropped — scored/.test(line)) { lines.push(line);
      var name = line.split(',')[0]; if (names[name]) fromCsv.push(names[name] + '/${S[s]}'); } });
    return { up: !v.classList.contains('hidden'), rows: rows, scores: scores, csv: fromCsv, lines: lines }; })()`);
};
const people = {};
for (const s of Object.keys(S)) people[s] = await detailFor(s);
const detailRows = set([].concat(...Object.values(people).map((x) => x.rows)));
const detailCsv = set([].concat(...Object.values(people).map((x) => x.csv)));
check('WO-3.69: student detail lists the hand table\'s cells on each student\'s *Dropped from the grade* card '
  + 'and in the Work section of each student\'s CSV, and no others — so grid, sheet, sheet CSV, detail and '
  + 'student CSV mark the same six cells',
  Object.values(people).every((x) => x.up) && detailRows === DROP1 && detailCsv === DROP1
    && JSON.stringify(people.ada.scores) === JSON.stringify(['10 of 20'])
    && JSON.stringify(people.fred.scores) === JSON.stringify(['3 of 10, late'])
    && people.ada.lines.length === 1 && /,"dropped — scored 10 of 20, not counted"$/.test(people.ada.lines[0]),
  JSON.stringify({ rows: detailRows, csv: detailCsv, ada: people.ada, fred: people.fred }));

/* ── ACCEPTANCE LINE 5: signals and merge fields read the grade the screens show ──
   Fred: 56.00% on the grid (Quiz 5 dropped), under the default 65% line, so *grade below* fires on the
   engine's figure. His scores in the document's order are 40 (the test, first), 90, 90, 50, 40, 30 —
   the 30 is the dropped Quiz 5 — so *A run of low scores* (3 in a row under 60, the defaults) fires on
   the last three, the dropped one included (ruling 5). A rule that asked isDropped() would read 40,
   90, 90, 50, 40: a run of two, and silent. */
const said = await evalJs(`(function(){
  var p = window.planbook, d = p.store.getDoc();
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var t = p.signals.thresholdsOf(d);
  var hits = p.signals.evaluate(d, cls, '${TERM}', { studentIds: ['${S.fred}', '${S.ada}'] });
  var pick = function(rule, sid){ return hits.filter(function(x){ return x.ruleId === rule && x.studentId === sid; })[0] || null; };
  var below = pick('grade-below', '${S.fred}'), run = pick('low-score-run', '${S.fred}');
  var merge = function(sid){ return p.mergeFields.resolveText('{{grade.percent}}',
    { doc: d, classId: '${CLS}', termId: '${TERM}', studentId: sid }).text; };
  return { t: [t.gradeBelow, t.lowScoreRun, t.lowScoreBelow],
    below: below ? p.scores.formatPercent(below.numbers.percentage) : null,
    run: run ? { run: run.numbers.run, scores: run.numbers.scores.map(function(x){ return Math.round(x); }) } : null,
    mergeFred: merge('${S.fred}'), mergeAda: merge('${S.ada}') }; })()`);
const gridNow = (await openGrid(), await gridRead());
check('WO-3.69: signals and merge fields read the grade the screen shows — *grade below* fires for Fred on '
  + '56.00% and `{{grade.percent}}` resolves to the grid\'s own figures, Fred 56.00% and Ada 71.25%',
  JSON.stringify(said.t) === '[65,3,60]' && said.below === '56.00%' && said.below === gridNow.grades.fred
    && said.mergeFred === gridNow.grades.fred && said.mergeAda === gridNow.grades.ada
    && said.mergeAda === '71.25%',
  JSON.stringify({ said: said, grid: gridNow.grades }));
check('WO-3.69, ruling 5: *A run of low scores* still counts Fred\'s dropped Quiz 5 — the run is 3, '
  + '50, 40 and 30, the 30 being the score the grade leaves out',
  !!said.run && said.run.run === 3 && JSON.stringify(said.run.scores) === '[50,40,30]',
  JSON.stringify(said.run));

/* ── THE EDITOR'S FIELD ── blank and 0 delete the key, a whole number writes it, anything else writes
   nothing and says why; and it stays live in a points class, where the weights grey out. */
const cat = () => evalJs(`(async function(){ await window.planbook.store.flush();
  var cls = window.planbook.store.getDoc().classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var q = cls.categories.filter(function(k){ return k.id === '${QUIZ}'; })[0];
  return JSON.stringify({ has: Object.prototype.hasOwnProperty.call(q, 'dropLowest'), n: q.dropLowest === undefined ? null : q.dropLowest }); })()`);
const typeDrop = (value) => evalJs(`(function(){
  var f = document.querySelector('#categoryList .category-drop[data-category-id="${QUIZ}"]');
  if (!f) return 0; f.value = ${JSON.stringify(value)}; f.dispatchEvent(new Event('input', { bubbles:true })); return 1; })()`);
/* Opened as src/shell.js's `data-category-manage` hook opens it: the editor, then the class's mode
   painted over it. */
const openEditor = () => evalJs(`(function(){ var p = window.planbook;
  p.categories.openCategoryEditor('${CLS}', null); p.gradingMode.paintEditor('${CLS}', '${TERM}'); return 1; })()`);
await openEditor();
await sleep(200);
const field0 = await evalJs(`(function(){
  var f = document.querySelector('#categoryList .category-drop[data-category-id="${QUIZ}"]');
  var g = document.querySelector('#categoryList .category-drop[data-category-id="${TEST}"]');
  return { quiz: f ? f.value : null, test: g ? g.value : null, placeholder: f ? f.placeholder : null,
    label: f ? f.getAttribute('aria-label') : '' }; })()`);
await typeDrop('2'); await sleep(120);
const at2 = { doc: await cat(), grid: await gridRead() };
await typeDrop(''); await sleep(120);
const atBlank = await cat();
await typeDrop('2'); await sleep(80);
await typeDrop('0'); await sleep(120);
const atZero = await cat();
await typeDrop('2'); await sleep(80);
await typeDrop('1.5'); await sleep(120);
const atHalf = { doc: await cat(), error: await evalJs("(document.getElementById('categoryError') || {}).textContent || ''") };
await typeDrop('1'); await sleep(120);
const at1 = await cat();
check('WO-3.69: the categories editor\'s *Drop lowest* field shows 1 on Quizzes and blank on Tests; typing 2 '
  + 'writes 2 and the grid behind it moves to the dropLowest-2 cells; blank and 0 DELETE the key; 1.5 writes '
  + 'nothing and says why; 1 writes 1',
  field0.quiz === '1' && field0.test === '' && field0.placeholder === '0' && /lowest scores in Quizzes/.test(field0.label)
    && at2.doc === '{"has":true,"n":2}' && at2.grid.dropped === DROP2
    && atBlank === '{"has":false,"n":null}' && atZero === '{"has":false,"n":null}'
    && atHalf.doc === '{"has":true,"n":2}' && /whole number/.test(atHalf.error)
    && at1 === '{"has":true,"n":1}',
  JSON.stringify({ field0: field0, at2: at2, atBlank: atBlank, atZero: atZero, atHalf: atHalf, at1: at1 }));
await evalJs(`(async function(){ var p = window.planbook, s = p.store;
  p.closeModal('categoriesModal');
  s.update(function(doc){ doc.classes.forEach(function(c){ if (c.id === '${CLS}') c.gradingMode = 'points'; }); });
  await s.flush(); return 1; })()`);
await openEditor();
await sleep(200);
const pointsField = await evalJs(`(function(){
  var f = document.querySelector('#categoryList .category-drop[data-category-id="${QUIZ}"]');
  var w = document.querySelector('#categoryList .category-weight[data-category-id="${QUIZ}"]');
  return { drop: f ? f.disabled : null, weight: w ? w.disabled : null, value: f ? f.value : null }; })()`);
await evalJs(`(async function(){ var p = window.planbook, s = p.store;
  p.closeModal('categoriesModal');
  s.update(function(doc){ doc.classes.forEach(function(c){ if (c.id === '${CLS}') delete c.gradingMode; }); });
  await s.flush(); return 1; })()`);
check('WO-3.69, ruling 3: in a class graded on total points the *Drop lowest* field stays live while the '
  + 'weights grey out', pointsField.drop === false && pointsField.weight === true && pointsField.value === '1',
  JSON.stringify(pointsField));

/* ── THE COARSE POINTER ── the field at 44px, and the dropped cell still struck and tagged. ── */
await flush();
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
await evalJs(`(function(){ var c = window.planbook.classes; c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar(); return 1; })()`);
await openGrid();
const coarse = await evalJs("window.matchMedia('(pointer: coarse)').matches");
const bigCell = await drawn(A.q2, S.ada);
await openEditor();
await sleep(200);
const bigField = await evalJs(`(function(){
  var f = document.querySelector('#categoryList .category-drop[data-category-id="${QUIZ}"]');
  var r = f ? f.getBoundingClientRect() : null; return r ? { h: r.height, w: r.width } : null; })()`);
await evalJs("(function(){ window.planbook.closeModal('categoriesModal'); return 1; })()");
if (!coarse) {
  check('WO-3.69: the drop field and the dropped cell under a coarse pointer', false,
    'the emulated pointer is not coarse, so nothing below it was measured (tools/README.md trap 3)');
} else {
  check('WO-3.69: under an emulated coarse pointer the *Drop lowest* field is at least 44px tall and wide, '
    + 'and Ada\'s dropped Quiz 2 in its 44px cell is still struck through and tagged',
    !!bigField && bigField.h >= 44 && bigField.w >= 44 && !!bigCell && bigCell.h >= 44 && struck(bigCell)
      && bigCell.tag === 'dropped' && bigCell.tagShown,
    JSON.stringify({ field: bigField, cell: bigCell }));
}
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

/* ── ACCEPTANCE LINE 6: a backup with no dropLowest key anywhere ──
   The key comes off the class, this run's own year is written by the backup module, and the file is
   searched for the word: it must not be there at all. It parses, restores through the real confirm,
   and the grid grades every student exactly as the hand table's no-drop column, with nothing marked. */
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ doc.classes.forEach(function(c){ if (c.id === '${CLS}') (c.categories || []).forEach(function(k){ delete k.dropLowest; }); }); });
  await s.flush(); return 1; })()`);
const file = await evalJs(`(async function(){
  var b = window.planbook.backup, built = await b.buildBackup();
  var parsed = b.parseBackup(built.text, 'wo369.json');
  return { text: built.text, has: built.text.indexOf('dropLowest') !== -1, parsed: !!(parsed && parsed.doc),
    fresh: JSON.stringify(window.planbook.store.newYearDocument ? window.planbook.store.newYearDocument('2099-2100') : {}).indexOf('dropLowest') !== -1 }; })()`);
await evalJs(`(async function(){
  await window.planbook.backup.restoreFromText(${JSON.stringify(file.text)}, 'Planbook wo369.json'); return 1; })()`);
await clickSel('[data-backup-confirm]');
await sleep(600);
await evalJs(`(function(){ var c = window.planbook.classes; c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar(); return 1; })()`);
await openGrid();
const restored = await gridRead();
check('WO-3.69: a backup with no dropLowest key anywhere — the word is nowhere in the file — parses, restores '
  + 'through the real confirm, and grades every student as before: the hand table\'s no-drop figures, 69.17% '
  + 'to 52.50%, with no cell marked dropped',
  !file.has && file.parsed && !file.fresh && restored.dropped === '[]' && restored.tags === 0
    && JSON.stringify(restored.grades) === JSON.stringify(GRID_NONE),
  JSON.stringify({ inFile: file.has, parsed: file.parsed, freshHasKey: file.fresh, grid: restored }));

/* ── THE FIXTURE COMES BACK OUT ── */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo369-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a369-') === 0) delete doc.scores[k]; });
  });
  window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
const gone = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { classes: d.classes.filter(function(x){ return x.id === '${CLS}'; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${CLS}'; }).length,
    scores: Object.keys(d.scores || {}).filter(function(k){ return String(k).indexOf('a369-') === 0; }).length,
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.69 fixture came back off the document, and presentation mode was left as it was found',
  gone.classes === 0 && gone.work === 0 && gone.scores === 0 && gone.mode === !!plant.mode,
  JSON.stringify(gone));
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
