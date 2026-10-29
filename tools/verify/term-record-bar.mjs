/* term-record-bar.mjs — Record Q1 grades: the dialog, and the bar on the class's screens (WO-3.73)
 *
 * src/term-record-view.js draws what src/term-record.js (WO-3.72) answers, and computes nothing, so
 * every figure below is checked twice: against a literal worked out by hand here, and — where the
 * claim is "the engine's figure" — against the engine asked directly. The bar and the dialog are
 * driven through their real controls (the bar's button, the dialog's buttons, the ✕, Escape), and
 * "wrote nothing" is a flushed `rev` and a byte-identical document (WO-5.3's blind spot: update()
 * schedules its save, so a check that does not flush cannot see a write).
 *
 * THE FIXTURE. One weighted class with its own letter scale (A 90, B 80, C 70, D 60, F 0), Exams 50 /
 * Projects 50, and two dated terms whose edge the checks move: Quarter 1 ends on day T, Quarter 2 runs
 * from T+1 to T+60. Roster order zim, abe, mo, nan — grade-sheet order is by surname, so the dialog
 * must reorder them. Every column is 100 points:
 *
 *            E1 (Exams)   P1 (Projects)   L1 (NO CATEGORY)   H1 (Exams, HELD)
 *   zim      90           80              50                 —
 *   abe      70           —               —                  —
 *   mo       95           95              —                  —
 *   nan      —            —               —                  —
 *
 *   zim   (90·50 + 80·50) / 100 = 85.00 B
 *   abe   Exams 70 alone, Projects empty and redistributed → 70.00 C
 *   mo    95.00 A
 *   nan   nothing graded → no grade, never listed
 *   Grade-sheet order: Abbott373 (abe), Moss373 (mo), Zimmer373 (zim).
 *
 *   EMPTY BOXES in Q1: E1 nan · P1 abe nan · L1 abe mo nan = 6, across Exams, Projects and *no
 *   category* (the owner, 2026-10-23: uncategorized work counts, in either grading mode). H1 is held
 *   and counts nowhere (8 if it did). In points mode the count is the same 6.
 *   UNCATEGORIZED WORK OUTSIDE A WEIGHTED GRADE: L1, which holds zim's 50 → 1 assignment. In points
 *   mode L1 IS in the grade, so the line is not drawn (count 0). LAST, zim's L1 50 becomes a missing
 *   mark, so L1 holds no score at all and is counted by its `M` alone → still 1 (the owner, 2026-10-27).
 *   PROJECTIONS, unmoved by any of it: abe with everything open scored in full — weighted Exams 70,
 *   Projects 100 → 85.00 (L1 counts toward nothing); points 70 + 100 + 100 over 300 → 90.00.
 *
 *   AFTER RECORDING, abe's E1 70 → 72 (72.00 C: a percentage move inside one letter) and mo's P1
 *   95 → 60 (77.50 C: a letter change). zim is unchanged and must not be listed.
 *
 * A second class, with no dated terms, carries no bar. It plants both classes through the store,
 * moves no viewport, turns presentation mode on once and puts it back as it was found, takes both
 * classes back out with the `termRecords` key as it was found, and hands the page back reloaded.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, clickVisible, KILL_ANIM, INSTALL_WALKER, waitForBoot, send } = h;

console.log('\n--- Record Q1 grades: the dialog, and the bar on the class\'s screens (WO-3.73) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.termRecord"
  + " && window.planbook.termRecordView && window.planbook.gradeEngine && window.planbook.classes"
  + " && window.planbook.supports && document.getElementById('termRecordNag')"
  + " && document.getElementById('termRecordModal'))"))) {
  skip('Record Q1 grades (WO-3.73)', 'window.planbook is missing termRecordView, termRecord, '
    + 'gradeEngine, classes or supports, or the bar or the dialog is not in the page');
  return;
}

const CLS = 'c_wo373', OTHER = 'c_wo373b', Q1 = 'tm373q1', Q2 = 'tm373q2';
const KE = 'k373e', KP = 'k373p';
const S = { zim: 'wo373-zim', abe: 'wo373-abe', mo: 'wo373-mo', nan: 'wo373-nan' };
const NAMES = ['Zimmer373', 'Abbott373', 'Moss373', 'Nogrades373'];
const A = { e1: 'a373-e1', p1: 'a373-p1', l1: 'a373-l1', h1: 'a373-h1' };
const SCALE = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 },
  { letter: 'D', min: 60 }, { letter: 'F', min: 0 }];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const TODAY = nodeDaysFromToday(0);

/* Move Quarter 1's last day (and Quarter 2's first) to `end`, flushed. */
const endQ1On = (end) => evalJs(`(async function(){ var s = window.planbook.store;
  var next = new Date(Number('${end}'.slice(0,4)), Number('${end}'.slice(5,7)) - 1, Number('${end}'.slice(8,10)) + 1);
  var p = function(x){ return (x < 10 ? '0' : '') + x; };
  var start2 = next.getFullYear() + '-' + p(next.getMonth() + 1) + '-' + p(next.getDate());
  s.update(function(doc){
    var cls = doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
    cls.terms[0].end = '${end}'; cls.terms[1].start = start2;
  });
  await s.flush(); return 1; })()`);

/* What the bar shows right now, read off the DOM. */
const barNow = () => evalJs(`(function(){
  var bar = document.getElementById('termRecordNag');
  var btn = document.getElementById('termRecordNagBtn');
  var r = bar.getBoundingClientRect();
  return { shown: !bar.classList.contains('hidden') && r.height > 0,
    text: (bar.textContent || '').replace(/\\s+/g, ' ').trim(),
    button: btn ? btn.textContent : '', cls: btn ? btn.getAttribute('data-term-record-class') : '',
    term: btn ? btn.getAttribute('data-term-record-open') : '',
    afterBackupNag: (function(){ var b = document.getElementById('backupNag');
      return !!(b && (b.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING)); })(),
    view: (function(){ var ids = { home: 'homeView', 'class': 'classView', assignments: 'assignmentsView',
      scores: 'scoresView', detail: 'detailView', calendar: 'calendarView', signals: 'signalsView',
      templates: 'templatesView' };
      return Object.keys(ids).filter(function(k){ var e = document.getElementById(ids[k]);
        return e && !e.classList.contains('hidden'); }).join(','); })() }; })()`);

/* A flushed snapshot: `rev` and the whole document as text. */
const snap = () => evalJs(`(async function(){ var s = window.planbook.store; await s.flush();
  var d = s.getDoc(); return { rev: d.rev, json: JSON.stringify(d),
    records: Array.isArray(d.termRecords) ? d.termRecords.length : null }; })()`);

/* What the open dialog shows, read off the DOM. */
const dialogNow = () => evalJs(`(function(){
  var m = document.getElementById('termRecordModal');
  var vis = function(id){ var e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  var txt = function(id){ var e = document.getElementById(id); return e ? (e.textContent || '').replace(/\\s+/g, ' ').trim() : ''; };
  var rows = Array.prototype.map.call(document.querySelectorAll('#termRecordList [data-term-record-row]'),
    function(n){ var a = n.nextElementSibling, b = a ? a.nextElementSibling : null;
      return { id: n.getAttribute('data-term-record-row'), name: n.textContent,
        a: a ? a.textContent : '', b: b ? b.textContent : '',
        now: b ? b.getAttribute('data-term-record-now') : null,
        bold: b ? getComputedStyle(b).fontWeight : '' }; });
  return { open: !m.classList.contains('hidden'), title: txt('termRecordTitle'), lead: txt('termRecordLead'),
    leadShown: vis('termRecordLead'), label: txt('termRecordLabel'), rows: rows,
    listChildren: document.getElementById('termRecordList').children.length,
    empty: vis('termRecordEmpty') ? txt('termRecordEmpty') : null,
    held: vis('termRecordHeld') ? txt('termRecordHeld') : null,
    loose: vis('termRecordLoose') ? txt('termRecordLoose') : null,
    hint: vis('termRecordHint'), refused: vis('termRecordRefused') ? txt('termRecordRefused') : null,
    confirm: vis('termRecordBtn') ? txt('termRecordBtn') : null, keep: txt('termRecordKeep'),
    all: (m.textContent || '').replace(/\\s+/g, ' ') }; })()`);

/* Onto one of the open class's screens through its real door — the switcher's pill, or for detail
   the registry's door beside a name. The pill for the screen already showing carries no hook (it is
   the active segment), so arriving at the screen you are on goes by way of another one first: an
   arrival is what repaints the bar, and that is what is being tested. */
const viewNow = () => evalJs(`(function(){ var ids = { home: 'homeView', 'class': 'classView',
  assignments: 'assignmentsView', scores: 'scoresView', detail: 'detailView', calendar: 'calendarView',
  signals: 'signalsView', templates: 'templatesView' };
  return Object.keys(ids).filter(function(k){ var e = document.getElementById(ids[k]);
    return e && !e.classList.contains('hidden'); }).join(','); })()`);
const go = async (screen) => {
  if (screen === 'detail') {
    if ((await viewNow()) !== 'class') await go('class');
    await clickVisible('#classView [data-student-detail="' + S.zim + '"]');
  } else {
    if ((await viewNow()) === screen) {
      await clickVisible('[data-class-screen="' + (screen === 'class' ? 'assignments' : 'class') + '"]');
      await sleep(150);
    }
    await clickVisible('[data-class-screen="' + screen + '"]');
  }
  await sleep(150);
};
/* A class opened through its real door — the card on All classes or the tab in the header, both
   `data-class-tab`, whichever is on screen — so src/shell.js's chain runs as it does for a teacher. */
const openClass = async (id) => { await clickVisible('[data-class-tab="' + id + '"]'); await sleep(200); };
const openFromBar = async () => { await clickSel('#termRecordNagBtn'); await sleep(200); };
const escape = async () => {
  await evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 1");
  await sleep(150);
};

/* ── THE FIXTURE ── */
const plant = await evalJs(`(async function(){
  var s = window.planbook.store, d0 = s.getDoc();
  if (!d0) return { ok: false, why: 'no year document is open' };
  var S = ${JSON.stringify(S)}, A = ${JSON.stringify(A)};
  var had = Object.prototype.hasOwnProperty.call(d0, 'termRecords');
  var was = { cls: window.planbook.classes.getSelectedClassId(), mode: window.planbook.supports.presentationMode() };
  s.update(function(doc){
    doc.students.push({ id: S.zim, first: 'Zed', last: 'Zimmer373' }, { id: S.abe, first: 'Abe', last: 'Abbott373' },
      { id: S.mo, first: 'Mo', last: 'Moss373' }, { id: S.nan, first: 'Nan', last: 'Nogrades373' });
    doc.classes.push({ id: '${CLS}', name: 'WO-3.73 Record bar', archived: false,
      letterScale: ${JSON.stringify(SCALE)},
      terms: [{ id: '${Q1}', label: 'Quarter 1', start: '2026-01-01', end: '2099-12-30' },
              { id: '${Q2}', label: 'Quarter 2', start: '2099-12-31', end: '2100-02-28' }],
      categories: [{ id: '${KE}', name: 'Exams', weight: 50 }, { id: '${KP}', name: 'Projects', weight: 50 }],
      roster: [S.zim, S.abe, S.mo, S.nan] });
    doc.classes.push({ id: '${OTHER}', name: 'WO-3.73 Undated', archived: false,
      terms: [{ id: 'tm373x', label: 'Quarter 1', start: '', end: '' }],
      categories: [{ id: 'k373x', name: 'Exams', weight: 100 }], roster: [S.zim] });
    var add = function(id, cat, name, held){
      var a = { id: id, classId: '${CLS}', termId: '${Q1}', categoryId: cat, name: name, points: 100,
        assigned: '', due: '' };
      if (held) a.held = true;
      doc.assignments.push(a); doc.scores[id] = {}; };
    add(A.e1, '${KE}', 'WO-3.73 Exam'); add(A.p1, '${KP}', 'WO-3.73 Project');
    add(A.l1, '', 'WO-3.73 Loose essay'); add(A.h1, '${KE}', 'WO-3.73 Held quiz', true);
    var put = function(a, st, v){ doc.scores[a][st] = { v: v }; };
    put(A.e1, S.zim, 90); put(A.p1, S.zim, 80); put(A.l1, S.zim, 50);
    put(A.e1, S.abe, 70);
    put(A.e1, S.mo, 95); put(A.p1, S.mo, 95);
  });
  await s.flush();
  var d = s.getDoc(), G = window.planbook.gradeEngine;
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var pf = function(p){ return p === null ? null : Number(p).toFixed(2); };
  return { ok: !!cls, had: had, was: was,
    grades: [S.zim, S.abe, S.mo, S.nan].map(function(id){
      var g = G.classGrade(d, cls, '${Q1}', id); return [pf(g.percentage), g.letter]; }) }; })()`);

const FIXTURE = [['85.00', 'B'], ['70.00', 'C'], ['95.00', 'A'], [null, null]];
if (!plant || !plant.ok || JSON.stringify(plant.grades) !== JSON.stringify(FIXTURE)) {
  check('WO-3.73: the fixture is real — both classes planted and every grade the hand table\'s',
    false, JSON.stringify(plant));
  return;
}
try {
/* Planted through the store, so nothing on screen has been redrawn for the new classes (no screen
   listens to notify()). selectClass() puts the header's class tabs up for the document as it now
   stands; the tab is then tapped, which is the arrival a teacher makes. */
await evalJs(`(function(){ window.planbook.supports.setPresentationMode(false);
  window.planbook.classes.selectClass('${CLS}'); return 1; })()`);
await openClass(CLS);
await go('scores');

/* ── ACCEPTANCE 1: the three wordings, and no bar before the end date ── */
await endQ1On(nodeDaysFromToday(1));
await go('class');
const before = await barNow();
await endQ1On(TODAY);
await go('scores');
const onDay = await barNow();
await endQ1On(nodeDaysFromToday(-1));
await go('assignments');
const after = await barNow();
check('WO-3.73: before Quarter 1\'s end date there is no bar; on the end date it reads *ends today*; '
  + 'from the next day *has ended … are not recorded* — each in the drawing\'s words, naming the '
  + 'class, with the button *Record Q1 grades*, and the bar sits after the backup nag',
  before.shown === false
    && onDay.shown && onDay.text === '⚠ Quarter 1 ends today. Record its grades for WO-3.73 Record bar '
      + 'once they are keyed into Blackbaud. Record Q1 grades'
    && after.shown && after.text === '⚠ Quarter 1 has ended, and its grades for WO-3.73 Record bar are '
      + 'not recorded. Record them once they are keyed into Blackbaud, and Planbook will tell you if any '
      + 'of them changes afterwards. Record Q1 grades'
    && onDay.button === 'Record Q1 grades' && after.button === 'Record Q1 grades'
    && after.cls === CLS && after.term === Q1 && after.afterBackupNag === true,
  JSON.stringify({ before: before, onDay: onDay.text, after: after }));

/* ── ACCEPTANCE 2: all five of the class's screens, and no other class's ── */
const screens = {};
for (const screen of ['class', 'assignments', 'scores', 'detail', 'signals']) {
  await go(screen);
  const b = await barNow();
  screens[screen] = b.view === screen && b.shown && b.cls === CLS;
}
await go('calendar');
const onCalendar = await barNow();
await clickVisible('[data-view-home]');
await sleep(150);
const onHome = await barNow();
await openClass(OTHER);
const onOther = await barNow();
await openClass(CLS);
await go('scores');
check('WO-3.73: the bar shows on all five of the class\'s screens — Attendance, Assignments, Scores, a '
  + 'student\'s detail and the concern list — and on no other view (the calendar, All classes) and not '
  + 'on another class\'s screens, whose own terms have ended nowhere',
  Object.keys(screens).length === 5 && Object.values(screens).every(Boolean)
    && onCalendar.shown === false && onHome.shown === false && onOther.shown === false
    && onOther.view === 'class',
  JSON.stringify({ screens: screens, calendar: onCalendar.shown, home: onHome.shown,
    other: [onOther.view, onOther.shown, onOther.text] }));

/* ── ACCEPTANCES 3 and 4: the first-recording dialog ── */
const engine = await evalJs(`(function(){
  var d = window.planbook.store.getDoc(), G = window.planbook.gradeEngine, T = window.planbook.termRecord;
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  return ['${S.abe}', '${S.mo}', '${S.zim}'].map(function(id){
    var g = G.classGrade(d, cls, '${Q1}', id); return [Number(g.percentage).toFixed(2) + '%', g.letter]; }); })()`);
const pointsRead = await evalJs(`(async function(){
  var s = window.planbook.store, G = window.planbook.gradeEngine, T = window.planbook.termRecord;
  var ask = function(){ var d = s.getDoc(); var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
    var open = G.openWork(d, cls, '${Q1}', '${S.abe}');
    var proj = G.projectedClassGrade(d, cls, '${Q1}', '${S.abe}', { outstanding: 1 });
    return { empty: T.emptyBoxes(d, cls, '${Q1}'), loose: T.looseWorkOutOfGrade(d, cls, '${Q1}').count,
      openIds: open.map(function(r){ return r.id; }), openNull: open.filter(function(r){ return r.categoryId === null; }).length,
      proj: Number(proj.percentage).toFixed(2),
      uncat: G.uncategorizedWork(d, cls, '${Q1}', '${S.abe}').map(function(r){ return [r.id, r.state, r.categoryId]; }) }; };
  var weighted = ask();
  s.update(function(doc){ doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0].gradingMode = 'points'; });
  await s.flush();
  var points = ask();
  s.update(function(doc){ delete doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0].gradingMode; });
  await s.flush();
  return { weighted: weighted, points: points }; })()`);
const quietBefore = await snap();
await openFromBar();
const first = await dialogNow();
check('WO-3.73: the first-recording dialog lists every graded student in grade-sheet order (Abbott, '
  + 'Moss, Zimmer — not roster order, and never the student with no grade) with the engine\'s own '
  + 'percentage and letter, the empty-boxes line in the owner\'s words, and the uncommitted held column '
  + 'by name; its buttons are *Record Q1 grades* and *Not now*',
  first.open && first.title === 'Record Quarter 1 grades for WO-3.73 Record bar?'
    && first.label === '3 students'
    && JSON.stringify(first.rows.map((r) => r.id)) === JSON.stringify([S.abe, S.mo, S.zim])
    && JSON.stringify(first.rows.map((r) => r.name))
      === JSON.stringify(['Abbott373, Abe', 'Moss373, Mo', 'Zimmer373, Zed'])
    && JSON.stringify(first.rows.map((r) => [r.a, r.b])) === JSON.stringify(engine)
    && JSON.stringify(engine) === JSON.stringify([['70.00%', 'C'], ['95.00%', 'A'], ['85.00%', 'B']])
    && first.all.indexOf('Nogrades373') === -1
    && first.held === '1 held column, WO-3.73 Held quiz, is not committed, so it counts toward none of '
      + 'these grades.'
    && first.confirm === 'Record Q1 grades' && first.keep === 'Not now' && first.refused === null,
  JSON.stringify({ title: first.title, label: first.label, rows: first.rows, engine: engine,
    held: first.held, confirm: first.confirm, keep: first.keep }));

check('WO-3.73: an empty uncategorized box is counted and named under *no category*, after the class\'s '
  + 'own categories, in a weighted class (the dialog\'s line: 6 boxes across Exams, Projects and no '
  + 'category) and in a points class (the same 6); in the weighted class the scored uncategorized essay '
  + 'gets its own *not in these grades* line, and in points mode, where it IS in the grade, it does not; '
  + 'and no projection moves — openWork() still lists categorized work only, and abe\'s full-marks '
  + 'projection is the hand figure in each mode (85.00 weighted, 90.00 points)',
  first.empty === 'There are 6 empty boxes in Q1, across Exams, Projects and no category.'
    && first.loose === '1 assignment filed under no category has scores or missing marks in it, which '
      + 'are not in these grades: a weighted grade counts only work in a category.'
    && pointsRead.weighted.empty.count === 6 && pointsRead.points.empty.count === 6
    && JSON.stringify(pointsRead.weighted.empty.categories.map((c) => [c.id, c.name]))
      === JSON.stringify([[KE, 'Exams'], [KP, 'Projects'], [null, 'no category']])
    && JSON.stringify(pointsRead.points.empty.categories) === JSON.stringify(pointsRead.weighted.empty.categories)
    && pointsRead.weighted.loose === 1 && pointsRead.points.loose === 0
    && JSON.stringify(pointsRead.weighted.openIds) === JSON.stringify([A.p1])
    && pointsRead.weighted.openNull === 0 && pointsRead.points.openNull === 0
    && JSON.stringify(pointsRead.weighted.uncat) === JSON.stringify([[A.l1, 'open', null]])
    && pointsRead.weighted.proj === '85.00' && pointsRead.points.proj === '90.00',
  JSON.stringify({ emptyLine: first.empty, looseLine: first.loose, read: pointsRead }));

/* ── ACCEPTANCE 5: the three ways out that write nothing, and the one that writes ── */
const notNow = first.open ? (await clickSel('#termRecordKeep'), await sleep(150), await snap()) : null;
await openFromBar();
await clickSel('#termRecordModal .modal-close');
await sleep(150);
const afterX = await snap();
await openFromBar();
await escape();
const afterEsc = await snap();
const closedQuietly = await evalJs("document.getElementById('termRecordModal').classList.contains('hidden')");
await openFromBar();
await clickSel('#termRecordBtn');
await sleep(200);
const recorded = await snap();
const entry = await evalJs(`(function(){ var d = window.planbook.store.getDoc(), G = window.planbook.gradeEngine;
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var mine = (d.termRecords || []).filter(function(e){ return e.classId === '${CLS}'; });
  var e = mine[mine.length - 1] || null;
  return { mine: mine.length, term: e ? e.termId : null,
    grades: e ? e.grades.map(function(g){ return [g.studentId, Number(g.percentage).toFixed(2), g.letter]; }) : null,
    open: !document.getElementById('termRecordModal').classList.contains('hidden') }; })()`);
const gone = await barNow();
check('WO-3.73: *Not now*, the ✕ and Escape each close the dialog and write nothing — `rev` unmoved and '
  + 'the document byte-identical after a flush, with no `termRecords` block created by opening it — '
  + 'and *Record Q1 grades* writes exactly one entry, holding the engine\'s figures, and the bar goes',
  notNow && notNow.rev === quietBefore.rev && notNow.json === quietBefore.json
    && afterX.json === quietBefore.json && afterEsc.json === quietBefore.json && closedQuietly === true
    && (plant.had || quietBefore.records === null)
    && recorded.rev === quietBefore.rev + 1
    && recorded.records === (quietBefore.records === null ? 0 : quietBefore.records) + 1
    && entry.mine === 1 && entry.term === Q1 && entry.open === false
    && JSON.stringify(entry.grades) === JSON.stringify([[S.zim, '85.00', 'B'], [S.abe, '70.00', 'C'],
      [S.mo, '95.00', 'A']])
    && gone.shown === false,
  JSON.stringify({ rev: [quietBefore.rev, notNow && notNow.rev, afterX.rev, afterEsc.rev, recorded.rev],
    same: [notNow && notNow.json === quietBefore.json, afterX.json === quietBefore.json,
      afterEsc.json === quietBefore.json], records: [quietBefore.records, recorded.records],
    entry: entry, barAfter: gone.shown }));

/* ── ACCEPTANCE 1, third wording, and ACCEPTANCE 6: the changed form ── */
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ doc.scores['${A.e1}']['${S.abe}'] = { v: 72 }; doc.scores['${A.p1}']['${S.mo}'] = { v: 60 }; });
  await s.flush(); return 1; })()`);
await go('class');
const changedBar = await barNow();
const recShort = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  var mine = d.termRecords.filter(function(e){ return e.classId === '${CLS}'; });
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var at = String(mine[mine.length - 1].at).slice(0, 10).split('-');
  return MON[Number(at[1]) - 1] + ' ' + Number(at[2]); })()`);
const changedBefore = await snap();
await openFromBar();
const changed = await dialogNow();
check('WO-3.73: after a recorded change the bar reads *have changed since you recorded them on <date> — '
  + '2 students*, the date the record\'s own in the app\'s short format, and names nobody',
  changedBar.shown && changedBar.text === '⚠ Quarter 1 grades for WO-3.73 Record bar have changed since '
    + 'you recorded them on ' + recShort + ' — 2 students. Record Q1 grades'
    && NAMES.every((n) => changedBar.text.indexOf(n) === -1),
  JSON.stringify({ bar: changedBar.text, date: recShort }));
check('WO-3.73: the changed form lists only the students who changed — abe and mo, in grade-sheet '
  + 'order, never zim, whose grade matches — each recorded beside now; mo\'s letter change is bold and '
  + 'abe\'s percentage-only change is quiet; *Not yet* is its second button',
  changed.open && changed.title === 'Quarter 1’s grades have changed'
    && changed.label === '2 students changed' && changed.hint === true
    && JSON.stringify(changed.rows.map((r) => [r.id, r.a, r.b, r.now]))
      === JSON.stringify([[S.abe, '70.00% C', '72.00% C', 'percentage'], [S.mo, '95.00% A', '77.50% C', 'letter']])
    && Number(changed.rows[1].bold) >= 700 && Number(changed.rows[0].bold) < 700
    && changed.all.indexOf('Zimmer373') === -1
    && changed.empty === null && changed.held === null && changed.loose === null
    && changed.confirm === 'Record Q1 grades' && changed.keep === 'Not yet',
  JSON.stringify({ title: changed.title, label: changed.label, rows: changed.rows,
    zimListed: changed.all.indexOf('Zimmer373') !== -1, keep: changed.keep }));
await clickSel('#termRecordKeep');
await sleep(150);
const notYet = await snap();

/* ── ACCEPTANCE 7: under a projector ── */
await evalJs(`(function(){ window.planbook.supports.setPresentationMode(true); return 1; })()`);
await go('scores');
const projBar = await barNow();
await openFromBar();
const refused = await dialogNow();
await clickSel('#termRecordKeep');
await sleep(150);
const refusedAfter = await snap();
await evalJs(`(function(){ window.planbook.supports.setPresentationMode(false); return 1; })()`);
check('WO-3.73: in presentation mode the bar stays and names no student; the dialog refuses — it builds '
  + 'no list and carries no name or figure, says it lists students and grades, and names the header\'s '
  + 'screen button that turns presentation mode off — and closing it writes nothing',
  projBar.shown && NAMES.every((n) => projBar.text.indexOf(n) === -1)
    && refused.open && refused.title === 'Record Quarter 1 grades' && refused.refused !== null
    && /presentation mode/i.test(refused.refused) && /screen button in the header/i.test(refused.refused)
    && /students and their grades/i.test(refused.refused)
    && refused.listChildren === 0 && refused.rows.length === 0 && refused.confirm === null
    && refused.leadShown === false && refused.keep === 'Close'
    && NAMES.every((n) => refused.all.indexOf(n) === -1) && !/\d+\.\d\d%/.test(refused.all)
    && refusedAfter.json === changedBefore.json && notYet.json === changedBefore.json,
  JSON.stringify({ bar: projBar.text, refused: refused.refused, title: refused.title,
    listChildren: refused.listChildren, confirm: refused.confirm,
    wroteNothing: [notYet.json === changedBefore.json, refusedAfter.json === changedBefore.json] }));

/* And the changed form's record button records the whole class again, as one new entry. */
await go('scores');
await openFromBar();
await clickSel('#termRecordBtn');
await sleep(200);
const again = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  var mine = d.termRecords.filter(function(e){ return e.classId === '${CLS}'; });
  return { mine: mine.length, ids: mine[mine.length - 1].grades.map(function(g){ return g.studentId; }) }; })()`);
const goneAgain = await barNow();
check('WO-3.73: *Record Q1 grades* in the changed form records the whole class again — a second entry '
  + 'holding all three graded students, not only the two who changed — and the bar goes',
  again.mine === 2 && JSON.stringify(again.ids) === JSON.stringify([S.zim, S.abe, S.mo])
    && goneAgain.shown === false,
  JSON.stringify({ again: again, bar: goneAgain.shown }));

/* ── ACCEPTANCE 4, the missing-mark half (the owner, 2026-10-27) ── an uncategorized column holding
   only an `M` is still a zero the weighted grade leaves out, so it is counted and the dialog says
   *scores or missing marks*. zim's L1 50 becomes a missing mark — L1 then holds no score at all, so
   only the missing-mark half of looseWorkOutOfGrade() can count it — and this class's records come
   off, so the bar offers the first-recording form again, the one that draws the line. */
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ doc.scores['${A.l1}']['${S.zim}'] = { v: null, flag: 'missing' };
    doc.termRecords = doc.termRecords.filter(function(e){ return e.classId !== '${CLS}'; }); });
  await s.flush(); return 1; })()`);
const onlyM = await evalJs(`(function(){ var d = window.planbook.store.getDoc(), G = window.planbook.gradeEngine;
  var T = window.planbook.termRecord;
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  return { loose: T.looseWorkOutOfGrade(d, cls, '${Q1}').count,
    scored: G.uncategorizedScores(d, cls, '${Q1}', '${S.zim}').length,
    cell: d.scores['${A.l1}']['${S.zim}'] }; })()`);
await go('class');
await openFromBar();
const mDialog = await dialogNow();
await clickSel('#termRecordKeep');
await sleep(150);
check('WO-3.73: in a weighted class an uncategorized column holding only a missing mark (zim\'s L1 50 '
  + 'turned to `M`, no score left in it) is counted — looseWorkOutOfGrade() answers 1 — and the '
  + 'first-recording dialog draws *1 assignment filed under no category has scores or missing marks in '
  + 'it*, never the scores-only wording, which is false for a column of `M`s',
  onlyM.loose === 1 && onlyM.scored === 0 && onlyM.cell && onlyM.cell.flag === 'missing'
    && mDialog.open && mDialog.refused === null
    && mDialog.loose === '1 assignment filed under no category has scores or missing marks in it, which '
      + 'are not in these grades: a weighted grade counts only work in a category.',
  JSON.stringify({ read: onlyM, looseLine: mDialog.loose, open: mDialog.open }));
} finally {
/* ── THE FIXTURE COMES BACK OUT ── */
await evalJs(`(async function(){
  var s = window.planbook.store;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}' && x.id !== '${OTHER}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo373-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a373-') === 0) delete doc.scores[k]; });
    if (${plant.had ? 'true' : 'false'}) {
      doc.termRecords = (doc.termRecords || []).filter(function(e){ return e.classId !== '${CLS}'; });
    } else {
      delete doc.termRecords;
    }
  });
  window.planbook.supports.setPresentationMode(${plant.was.mode ? 'true' : 'false'});
  if (${JSON.stringify(plant.was.cls || '')}) window.planbook.classes.selectClass(${JSON.stringify(plant.was.cls || '')});
  await s.flush();
  return 1; })()`);
}
const cleared = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { classes: d.classes.filter(function(x){ return x.id === '${CLS}' || x.id === '${OTHER}'; }).length,
    students: d.students.filter(function(x){ return String(x.id).indexOf('wo373-') === 0; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${CLS}'; }).length,
    records: Object.prototype.hasOwnProperty.call(d, 'termRecords'),
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.73 fixture came back off the document, the termRecords key is as it was found, and '
  + 'presentation mode is where it was found',
  cleared.classes === 0 && cleared.students === 0 && cleared.work === 0
    && cleared.records === !!plant.had && cleared.mode === !!plant.was.mode,
  JSON.stringify(cleared) + ' · had the key at the start: ' + plant.had);
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
