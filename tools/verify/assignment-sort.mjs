/* assignment-sort.mjs — the assignment list sorts within each category, and writes nothing (WO-3.55)
 *
 * WHAT THIS SECTION OWNS. The owner's rulings of 2026-10-10 and -11, as the list draws them: five
 * headings that sort what is under each category and leave the categories where they are; the first
 * tap's direction per column, the second's reverse and the third's return to the teacher's order;
 * `aria-sort` on the one `<th>` sorting; names compared as a reader would, blank dates last in both
 * directions and ties in the teacher's order; a held column sorting under Entered by its own count;
 * the arrows resting, titled, while ↺ Your order stands in the Actions heading; the three resets;
 * the order held while the editor is open and re-sorted at its close; the coarse floor; and the hint.
 *
 * THE LINE IT EXISTS FOR IS THE WRITE-NOTHING ONE, and it is read three ways after every tap, because
 * each of the two ways a sort can write is invisible to one of them. A planted update() of the sorted
 * order moves `rev` and the stored record. An in-place `sort()` on the document's own array moves
 * neither — no save is scheduled until the next unrelated keystroke carries it — and is caught by the
 * open document's hash and by the Scores grid's column order, which is read off that array. All three
 * are asserted; `TESTING.md` § WO-3.55 records the two plants and which arm each turned red.
 *
 * WHAT IT LEAVES TO SECTIONS THAT ALREADY OWN IT. The list's rows, headings and hint as WO-3.54 drew
 * them are assignment-list-tidy.mjs's. The page's sideways scroll at 390×844 with a sort on is
 * horizontal-overflow.mjs's, whose WO-3.59 block now taps a real heading where it planted a stand-in.
 *
 * THE FIXTURE is two classes, three students and eleven assignments of its own — nine in one term of
 * the first class, in two categories and "Not in a category", each column's values chosen so that the
 * naive comparison gets it wrong (see the A3 block) — plus the open-class preference. All of it is put
 * back at the foot, with the viewport and touch, whatever happens above.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- the assignment list sorts within each category, and writes nothing (WO-3.55) ---');

if (!seam) {
  skip('the assignment list\'s column sort, and that it writes nothing (WO-3.55)',
    'window.planbook is not on the page, so nothing here can seed a class or open the list');
  return;
}

const j = (x) => JSON.stringify(x);
const pause = (ms) => new Promise(r => setTimeout(r, ms));
const D = nodeDaysFromToday;
const S = [{ id: 'wo355-s1', first: 'Marisol', last: 'Vantongeren' },
  { id: 'wo355-s2', first: 'Kwame', last: 'Ashby-Roe' }, { id: 'wo355-s3', first: 'Liesl', last: 'Okafor' }];
const SIDS = S.map((x) => x.id);
const C1 = { id: 'c_wo355a', name: 'WO-3.55 English III', t1: 'tm_wo355a1', t2: 'tm_wo355a2' };
const C2 = { id: 'c_wo355b', name: 'WO-3.55 English IV', t1: 'tm_wo355b1' };
const CATS = [{ id: 'k355_q', name: 'Quizzes', weight: 60 }, { id: 'k355_e', name: 'Essays', weight: 40 }];
const A = (id, classId, termId, categoryId, name, points, assigned, due, extra) =>
  Object.assign({ id, classId, termId, categoryId, name, points, assigned, due }, extra || {});
/* Doc order is the teacher's order. Every column below is built to fail a naive comparison somewhere. */
const ASSIGNMENTS = [
  A('a355_q1', C1.id, C1.t1, 'k355_q', 'Quiz 10', 20, D(-10), ''),
  A('a355_q2', C1.id, C1.t1, 'k355_q', 'Quiz 2', 50, '', D(5)),
  A('a355_q3', C1.id, C1.t1, 'k355_q', 'quiz 1', 20, D(-20), D(-2)),
  A('a355_q4', C1.id, C1.t1, 'k355_q', 'Quiz 3', 10, D(-5), D(5)),
  A('a355_e1', C1.id, C1.t1, 'k355_e', 'Essay 2: Argument', 100, D(-3), D(10)),
  A('a355_e2', C1.id, C1.t1, 'k355_e', 'Essay 1: Narrative', 50, D(-15), D(-1), { held: true }),
  A('a355_e3', C1.id, C1.t1, 'k355_e', 'Essay 3: Research', 150, '', ''),
  A('a355_u1', C1.id, C1.t1, 'k355_gone', 'Zeta reading log', 0, D(-1), D(1)),
  A('a355_u2', C1.id, C1.t1, 'k355_gone', 'alpha annotations', 30, D(-2), D(2)),
  A('a355_x1', C1.id, C1.t2, 'k355_q', 'Quarter 2 quiz', 20, D(40), D(45)),
  A('a355_y1', C2.id, C2.t1, 'k355_q2', 'Other class quiz', 20, D(-1), D(1)),
];
const MINE = ASSIGNMENTS.map((a) => a.id);
const BY_ID = Object.fromEntries(ASSIGNMENTS.map((a) => [a.id, a]));
/* Entered: q1 1/3, q2 3/3, q3 0, q4 1/3; e1 1/3, e2 3/3 (HELD), e3 0; u1 2/3, u2 2/3. */
const SCORES = {
  a355_q1: ['wo355-s1'], a355_q2: SIDS, a355_q4: ['wo355-s2'],
  a355_e1: ['wo355-s1'], a355_e2: SIDS,
  a355_u1: ['wo355-s1', 'wo355-s2'], a355_u2: ['wo355-s2', 'wo355-s3'],
};
const ENTERED = Object.fromEntries(MINE.map((id) => [id, (SCORES[id] || []).length]));

const TEACHER = { Quizzes: ['q1', 'q2', 'q3', 'q4'], Essays: ['e1', 'e2', 'e3'],
  'Not in a category': ['u1', 'u2'] };
const GROUPS = Object.keys(TEACHER);
/* [first tap, second tap], per group, hand-derived from the fixture above. */
const WANT = {
  name: [{ Quizzes: ['q3', 'q2', 'q4', 'q1'], Essays: ['e2', 'e1', 'e3'], 'Not in a category': ['u2', 'u1'] },
    { Quizzes: ['q1', 'q4', 'q2', 'q3'], Essays: ['e3', 'e1', 'e2'], 'Not in a category': ['u1', 'u2'] }],
  points: [{ Quizzes: ['q2', 'q1', 'q3', 'q4'], Essays: ['e3', 'e1', 'e2'], 'Not in a category': ['u2', 'u1'] },
    { Quizzes: ['q4', 'q1', 'q3', 'q2'], Essays: ['e2', 'e1', 'e3'], 'Not in a category': ['u1', 'u2'] }],
  assigned: [{ Quizzes: ['q3', 'q1', 'q4', 'q2'], Essays: ['e2', 'e1', 'e3'], 'Not in a category': ['u2', 'u1'] },
    { Quizzes: ['q4', 'q1', 'q3', 'q2'], Essays: ['e1', 'e2', 'e3'], 'Not in a category': ['u1', 'u2'] }],
  due: [{ Quizzes: ['q3', 'q2', 'q4', 'q1'], Essays: ['e2', 'e1', 'e3'], 'Not in a category': ['u1', 'u2'] },
    { Quizzes: ['q2', 'q4', 'q3', 'q1'], Essays: ['e1', 'e2', 'e3'], 'Not in a category': ['u2', 'u1'] }],
  entered: [{ Quizzes: ['q3', 'q1', 'q4', 'q2'], Essays: ['e3', 'e1', 'e2'], 'Not in a category': ['u1', 'u2'] },
    { Quizzes: ['q2', 'q1', 'q4', 'q3'], Essays: ['e2', 'e1', 'e3'], 'Not in a category': ['u1', 'u2'] }],
};
/* Ruling 3's first direction, as `aria-sort` says it. */
const FIRST_ARIA = { name: 'ascending', points: 'descending', assigned: 'ascending', due: 'ascending',
  entered: 'ascending' };
const FLIP = { ascending: 'descending', descending: 'ascending' };
const LABEL = { name: 'Assignment', points: 'Points', assigned: 'Assigned', due: 'Due', entered: 'Entered' };
const COLUMNS = Object.keys(WANT);
const short = (id) => id.replace('a355_', '');

const shut = () => evalJs(`(function(){
  var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
  Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
  return open.length; })()`);
const onView = () => evalJs(
  "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
const reload = async () => {
  await send('Page.reload');
  await pause(600);
  await waitForBoot();
  await evalJs(KILL_ANIM);
};
const toList = async (classId) => {
  await shut();
  if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
  await pause(150);
  await clickSel('#homeGrid [data-class-tab="' + classId + '"]');
  await pause(250);
  if ((await onView()) !== 'assignmentsView') {
    await clickVisible('[data-class-screen="assignments"]');
    await pause(300);
  }
};
const size = async (width, height, coarse) => {
  await send('Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: coarse ? 2 : 1, mobile: !!coarse });
  await send('Emulation.setTouchEmulationEnabled', coarse
    ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await evalJs('window.dispatchEvent(new Event("resize")); 1');
  await pause(300);
};
const tapSort = async (column) => { await clickVisible('[data-assignment-sort="' + column + '"]'); await pause(120); };
const tapReset = async () => { await clickVisible('[data-assignment-sort-reset]'); await pause(120); };

/* The list as drawn: each group's ids in screen order, the five headings, the Actions heading, every
   arrow, and where the focus is. */
const READ = `(function(){
  var norm = function(t){ return String(t || '').replace(/\\s+/g, ' ').trim(); };
  var groups = [], cur = null;
  Array.prototype.forEach.call(document.querySelectorAll('#assignmentsBody tr'), function(r){
    if (r.classList.contains('assign-group-head')) {
      var t = r.querySelector('.assign-group-title');
      cur = { title: t && t.firstChild ? norm(t.firstChild.textContent) : '', ids: [] };
      groups.push(cur); return;
    }
    var b = r.querySelector('[data-assignment-edit]');
    if (b && cur) cur.ids.push(b.getAttribute('data-assignment-edit'));
  });
  var ths = Array.prototype.map.call(document.querySelectorAll('#assignmentsView .assign-table thead th'), function(th){
    var b = th.querySelector('[data-assignment-sort]'), m = b ? b.querySelector('.assign-sort-mark') : null;
    return { col: b ? b.getAttribute('data-assignment-sort') : '', aria: th.getAttribute('aria-sort'),
      on: b ? b.classList.contains('on') : false, mark: m ? m.textContent : '', btnTag: b ? b.tagName : '',
      btnType: b ? b.type : '' };
  });
  var resetCell = document.querySelector('#assignmentsView .assign-table thead th.assign-col-reset');
  var reset = resetCell ? resetCell.querySelector('[data-assignment-sort-reset]') : null;
  var arrows = Array.prototype.map.call(
    document.querySelectorAll('#assignmentsBody [data-assignment-move-up], #assignmentsBody [data-assignment-move-down]'),
    function(b){ return { up: b.hasAttribute('data-assignment-move-up'),
      id: b.getAttribute('data-assignment-move-up') || b.getAttribute('data-assignment-move-down'),
      disabled: b.disabled, title: b.getAttribute('title') }; });
  var f = document.activeElement;
  return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '', groups: groups, ths: ths,
    resetCellIsLast: !!resetCell && resetCell === resetCell.parentElement.lastElementChild,
    actionsName: resetCell ? norm((resetCell.querySelector('.sr-only') || {}).textContent) : '',
    reset: reset ? { text: norm(reset.textContent), tag: reset.tagName } : null,
    arrows: arrows,
    focus: f ? (f.getAttribute('data-assignment-sort') || f.getAttribute('data-assignment-sort-reset') !== null
      && 'reset' || f.tagName) : '' };
})()`;

/* Hashes of the stored record and of the open document, after flush() — update() only SCHEDULES a
   save (WO-5.3's scar), so a read before flush() could miss a write the tap had just queued. */
const SNAP = `(async function(){
  var s = window.planbook.store;
  await s.flush();
  var d = s.getDoc();
  var stored = await s.readStoredDocument(d.year);
  var hash = async function(str){
    var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join('');
  };
  var ls = Object.keys(localStorage).sort().map(function(k){ return [k, localStorage.getItem(k)]; });
  return { rev: d.rev, storedRev: stored ? stored.rev : null,
    stored: await hash(JSON.stringify(stored)), live: await hash(JSON.stringify(d)), ls: JSON.stringify(ls),
    order: d.assignments.filter(function(a){ return ${j(MINE)}.indexOf(a.id) >= 0; }).map(function(a){ return a.id; }) };
})()`;

/* The grid's columns, in the order it draws them — the order it reads off the document's array. */
const gridColumns = async () => {
  await clickVisible('[data-class-screen="scores"]');
  await pause(350);
  const cols = await evalJs(`(function(){
    return Array.prototype.map.call(document.querySelectorAll('#scoresView [data-score-col]'),
      function(th){ return th.getAttribute('data-score-col'); }); })()`);
  await clickVisible('[data-class-screen="assignments"]');
  await pause(300);
  return cols;
};

const groupsOf = (r) => Object.fromEntries(r.groups.map((g) => [g.title, g.ids.map(short)]));
const sameGroups = (r, want) => {
  const got = groupsOf(r);
  return j(r.groups.map((g) => g.title)) === j(GROUPS) && GROUPS.every((t) => j(got[t]) === j(want[t]));
};
const ariaOk = (r, column, aria) => r.ths.filter((t) => t.aria !== null).length === (column ? 1 : 0)
  && (!column || r.ths.some((t) => t.col === column && t.aria === aria && t.on
    && t.mark === (aria === 'ascending' ? '▲' : '▼')))
  && r.ths.filter((t) => t.col && t.col !== column).every((t) => !t.on && t.mark === '↕');
const restingOk = (r, label) => r.arrows.length > 0 && r.arrows.every((a) => a.disabled
  && a.title === 'Sorted by ' + label + ' — tap Your order to move it');
/* The teacher's order: first up and last down of each group disabled, every other arrow live, and
   none carrying a title. */
const teacherArrowsOk = (r) => r.groups.every((g) => g.ids.every((id, i) => {
  const up = r.arrows.find((a) => a.up && a.id === id);
  const down = r.arrows.find((a) => !a.up && a.id === id);
  return up && down && up.disabled === (i === 0) && down.disabled === (i === g.ids.length - 1)
    && up.title === null && down.title === null;
}));

const before = await evalJs("({ open: localStorage.getItem('planbook_openClassId') })");

try {
  await size(1280, 800, false);
  const plant = await evalJs(`(async function(){
    var p = window.planbook, s = p.store;
    if (!s.getDoc()) return { ok:false, why:'no year document is open' };
    var kids = ${j(S)}.map(function(x){ var st = p.roster.newStudent(x.first, x.last); st.id = x.id; return st; });
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!doc.scores) doc.scores = {};
      kids.forEach(function(st){ doc.students.push(st); });
      doc.classes.push({ id:${j(C1.id)}, name:${j(C1.name)}, archived:false, roster:${j(SIDS)}, letterScale:null,
        terms:[{ id:${j(C1.t1)}, label:'Quarter 1', start:${j(D(-30))}, end:${j(D(30))} },
          { id:${j(C1.t2)}, label:'Quarter 2', start:${j(D(31))}, end:${j(D(90))} }],
        categories:${j(CATS)} });
      doc.classes.push({ id:${j(C2.id)}, name:${j(C2.name)}, archived:false, roster:${j(SIDS)}, letterScale:null,
        terms:[{ id:${j(C2.t1)}, label:'Quarter 1', start:${j(D(-30))}, end:${j(D(30))} }],
        categories:[{ id:'k355_q2', name:'Quizzes', weight:100 }] });
      ${j(ASSIGNMENTS)}.forEach(function(a){ doc.assignments.push(a); });
      var sc = ${j(SCORES)};
      Object.keys(sc).forEach(function(aid){
        doc.scores[aid] = {};
        sc[aid].forEach(function(sid){ doc.scores[aid][sid] = { v: 7 }; });
      });
    });
    await s.flush();
    return { ok:true }; })()`);
  if (!plant.ok) throw new Error('could not plant the fixture: ' + plant.why);
  await reload();

  await toList(C1.id);
  const gridBefore = await gridColumns();
  const base = await evalJs(SNAP);
  const r0 = await evalJs(READ);

  /* ══ the starting state: the teacher's order, no sort, the hint ══ */
  check('WO-3.55: the list opens in the teacher\'s order — every group in document order, the five headings each a '
    + 'real button carrying `data-assignment-sort` with a faint ↕, no `<th>` carrying `aria-sort`, and no ↺ Your order',
    r0.view === 'assignmentsView' && sameGroups(r0, TEACHER) && ariaOk(r0, '', '')
      && j(r0.ths.filter((t) => t.col).map((t) => t.col)) === j(COLUMNS)
      && r0.ths.filter((t) => t.col).every((t) => t.btnTag === 'BUTTON' && t.btnType === 'button')
      && r0.reset === null && r0.resetCellIsLast && r0.actionsName === 'Actions',
    j({ view: r0.view, groups: groupsOf(r0), ths: r0.ths, reset: r0.reset }));

  const hint = await evalJs(`Array.prototype.map.call(document.querySelectorAll('#assignmentsView .assign-hint'),
    function(p){ return p.textContent.replace(/\\s+/g, ' ').trim(); }).join(' ')`);
  const RULING_10 = 'Tap a column heading to sort what is under each category; tap it again to reverse, a third '
    + 'time for your order. While a sort is on, the arrows rest — ↺ Your order brings them back.';
  check('WO-3.55: the hint carries ruling 10\'s sentence, word for word',
    hint.indexOf(RULING_10) >= 0, hint.indexOf(RULING_10) >= 0 ? 'found' : 'hint reads: ' + hint.slice(-400));

  /* ══ A1, A2, A5 — every column, both directions, the third tap and ↺ Your order ══ */
  const writes = [];
  const note = (what, snap) => {
    const bad = [];
    if (snap.stored !== base.stored) bad.push('stored record changed');
    if (snap.rev !== base.rev || snap.storedRev !== base.storedRev) bad.push('rev ' + base.rev + '→' + snap.rev);
    if (snap.live !== base.live) bad.push('open document changed');
    if (j(snap.order) !== j(base.order)) bad.push('array order ' + snap.order.map(short).join(','));
    writes.push({ what, bad });
  };
  const seen = {};
  for (const column of COLUMNS) {
    const label = LABEL[column];
    const s = { taps: [] };
    await tapSort(column);
    const a = await evalJs(READ); note(column + ' tap 1', await evalJs(SNAP));
    await tapSort(column);
    const b = await evalJs(READ); note(column + ' tap 2', await evalJs(SNAP));
    await tapSort(column);
    const c = await evalJs(READ); note(column + ' tap 3', await evalJs(SNAP));
    await tapSort(column);
    const d = await evalJs(READ);
    await tapReset();
    const e = await evalJs(READ); note(column + ' ↺ Your order', await evalJs(SNAP));
    seen[column] = { a, b, c, d, e };
    const first = FIRST_ARIA[column];
    check('WO-3.55: ' + label + ' — the first tap sorts every group ' + (column === 'name' ? 'A→Z'
      : column === 'points' ? 'largest first' : column === 'entered' ? 'fewest entered first' : 'soonest first')
      + ' with the groups in their own order, the second reverses it, the third gives back the teacher\'s order; '
      + 'the active `<th>` carries `aria-sort` ' + first + ' then ' + FLIP[first] + ' and no other `<th>` carries one',
      sameGroups(a, WANT[column][0]) && ariaOk(a, column, first)
        && sameGroups(b, WANT[column][1]) && ariaOk(b, column, FLIP[first])
        && sameGroups(c, TEACHER) && ariaOk(c, '', ''),
      j({ tap1: groupsOf(a), aria1: a.ths.map((t) => t.aria), tap2: groupsOf(b), aria2: b.ths.map((t) => t.aria),
        tap3: groupsOf(c), aria3: c.ths.map((t) => t.aria) }));
    check('WO-3.55: ' + label + ' — while sorted every ↑ ↓ is disabled and titled "Sorted by ' + label
      + ' — tap Your order to move it", and ↺ Your order stands in the Actions heading; after the third tap and after '
      + '↺ Your order it is gone, the arrows behave as before and the focus is back on the ' + label + ' heading',
      restingOk(a, label) && restingOk(b, label) && restingOk(d, label)
        && !!a.reset && a.reset.text === '↺ Your order' && a.reset.tag === 'BUTTON' && !!b.reset && !!d.reset
        && c.reset === null && e.reset === null && teacherArrowsOk(c) && teacherArrowsOk(e)
        && sameGroups(d, WANT[column][0]) && sameGroups(e, TEACHER) && ariaOk(e, '', '') && e.focus === column,
      j({ tap1Arrows: a.arrows.slice(0, 2), reset1: a.reset, tap3Reset: c.reset, afterReset: e.reset,
        afterResetArrows: e.arrows.slice(0, 2), focus: e.focus }));
  }
  const after = await evalJs(SNAP);
  const dirty = writes.filter((w) => w.bad.length);
  check('WO-3.55: a sort writes nothing — after each of the ' + writes.length + ' taps (both directions and the third '
    + 'tap on all five columns, and ↺ Your order after each) and a flush(), the stored record is byte-identical to '
    + 'before, `rev` has not moved, and the open document and its array order are unchanged',
    writes.length === 20 && dirty.length === 0,
    writes.length + ' taps read · rev ' + base.rev + ' stored ' + base.storedRev
      + (dirty.length ? ' · CHANGED: ' + j(dirty) : ' · every one identical'));
  check('WO-3.55: no `planbook_` key is written by sorting — localStorage is the same, key for key and value for '
    + 'value, before and after those twenty taps',
    after.ls === base.ls, after.ls === base.ls ? 'identical' : 'before ' + base.ls + ' · after ' + after.ls);
  const gridAfter = await gridColumns();
  check('WO-3.55: the Scores grid\'s column order is unchanged by the sorting — read before the first tap and after '
    + 'the last, the same ' + gridBefore.length + ' columns in the same order',
    gridBefore.length === 9 && j(gridAfter) === j(gridBefore),
    'before ' + gridBefore.map(short).join(',') + ' · after ' + gridAfter.map(short).join(','));

  /* ══ A3 — each claim against a fixture the naive comparison gets wrong ══ */
  const naive = (ids, key, dir) => ids.slice().sort((x, y) => {
    const p = key(BY_ID['a355_' + x]), q = key(BY_ID['a355_' + y]);
    return dir * (p < q ? -1 : p > q ? 1 : 0);
  });
  const naiveName = naive(TEACHER.Quizzes, (a) => a.name, 1);
  const naiveNameU = naive(TEACHER['Not in a category'], (a) => a.name, 1);
  check('WO-3.55: names compare as a reader would — "quiz 1", "Quiz 2", "Quiz 3", "Quiz 10", and "alpha" before '
    + '"Zeta" — where a code-point comparison over the same fixture gives ' + naiveName.join(',') + ' and '
    + naiveNameU.join(','),
    sameGroups(seen.name.a, WANT.name[0]) && j(naiveName) !== j(WANT.name[0].Quizzes)
      && j(naiveNameU) !== j(WANT.name[0]['Not in a category']),
    'drawn ' + j(groupsOf(seen.name.a)) + ' · naive ' + naiveName.join(',') + ' / ' + naiveNameU.join(','));
  const naiveDueAsc = naive(TEACHER.Quizzes, (a) => a.due, 1);
  const naiveDueDesc = naive(TEACHER.Quizzes, (a) => a.due, -1);
  const blankLast = ['a', 'b'].every((k) => ['due', 'assigned'].every((col) => {
    const g = groupsOf(seen[col][k]);
    return g.Quizzes[3] === (col === 'due' ? 'q1' : 'q2') && g.Essays[2] === 'e3';
  }));
  check('WO-3.55: a blank date sorts last in both directions — on Due and on Assigned, soonest first and latest '
    + 'first — where comparing the stored strings puts the blank first ascending (' + naiveDueAsc.join(',') + ')',
    blankLast && naiveDueAsc[0] === 'q1' && naiveDueDesc[3] === 'q1',
    j(['due', 'assigned'].map((col) => [groupsOf(seen[col].a).Quizzes, groupsOf(seen[col].b).Quizzes])));
  const reversedAsc = WANT.due[0].Quizzes.slice().reverse();
  const reversedEntered = WANT.entered[0].Quizzes.slice().reverse();
  check('WO-3.55: equal keys keep the teacher\'s order in both directions — Quiz 2 before Quiz 3 on their shared '
    + 'due date, Quiz 10 before Quiz 3 on their shared count, and the two unfiled pieces in their own order on '
    + 'theirs — where reversing the ascending list would give ' + reversedAsc.join(',') + ' and '
    + reversedEntered.join(','),
    sameGroups(seen.due.b, WANT.due[1]) && sameGroups(seen.entered.b, WANT.entered[1])
      && j(reversedAsc) !== j(WANT.due[1].Quizzes) && j(reversedEntered) !== j(WANT.entered[1].Quizzes)
      && j(groupsOf(seen.entered.a)['Not in a category']) === j(['u1', 'u2'])
      && j(groupsOf(seen.entered.b)['Not in a category']) === j(['u1', 'u2']),
    j({ due2: groupsOf(seen.due.b).Quizzes, entered2: groupsOf(seen.entered.b).Quizzes }));

  /* ══ A4 — a held column under Entered ══ */
  const heldNow = await evalJs(`(function(){ var g = window.planbook.gradeEngine;
    var d = window.planbook.store.getDoc();
    return d.assignments.filter(function(a){ return g.isHeld(a); }).map(function(a){ return a.id; })
      .filter(function(id){ return ${j(MINE)}.indexOf(id) >= 0; }); })()`);
  check('WO-3.55: a held column sorts under Entered by its own count — "Essay 1" is held with 3 of 3 entered, and '
    + 'it is last fewest-first and first most-first among the essays (0, 1, 3)',
    j(heldNow) === j(['a355_e2']) && ENTERED.a355_e2 === 3
      && j(groupsOf(seen.entered.a).Essays) === j(['e3', 'e1', 'e2'])
      && j(groupsOf(seen.entered.b).Essays) === j(['e2', 'e1', 'e3']),
    'held ' + j(heldNow) + ' · fewest first ' + j(groupsOf(seen.entered.a).Essays) + ' · most first '
      + j(groupsOf(seen.entered.b).Essays));

  /* ══ A6 — the three ways back to the teacher's order ══ */
  await tapSort('due');
  const sortedBefore = await evalJs(READ);
  await clickVisible('[data-class-screen="scores"]');
  await pause(300);
  await clickVisible('[data-class-screen="assignments"]');
  await pause(300);
  const backFromScores = await evalJs(READ);
  check('WO-3.55: leaving the list returns the teacher\'s order — sorted by Due, to Scores and back by the '
    + 'switcher, the list is in document order with no `aria-sort` and no ↺ Your order',
    sameGroups(sortedBefore, WANT.due[0]) && backFromScores.view === 'assignmentsView'
      && sameGroups(backFromScores, TEACHER) && ariaOk(backFromScores, '', '') && backFromScores.reset === null,
    j({ before: groupsOf(sortedBefore), after: groupsOf(backFromScores), reset: backFromScores.reset }));

  await tapSort('due');
  await clickVisible('[data-class-tab="' + C2.id + '"]');
  await pause(350);
  const onOther = await evalJs(READ);
  await clickVisible('[data-class-tab="' + C1.id + '"]');
  await pause(350);
  const backFromClass = await evalJs(READ);
  check('WO-3.55: changing class returns the teacher\'s order — sorted by Due, a class tab and back: the other '
    + 'class opens unsorted, and so does this one again',
    onOther.view === 'assignmentsView' && ariaOk(onOther, '', '') && onOther.reset === null
      && onOther.groups.some((g) => g.ids.indexOf('a355_y1') >= 0)
      && sameGroups(backFromClass, TEACHER) && ariaOk(backFromClass, '', '') && backFromClass.reset === null,
    j({ other: onOther.groups.map((g) => g.ids.map(short)), otherAria: onOther.ths.map((t) => t.aria),
      back: groupsOf(backFromClass) }));

  await tapSort('due');
  await clickVisible('[data-term-select="' + C1.t2 + '"]');
  await pause(350);
  const onT2 = await evalJs(READ);
  await clickVisible('[data-term-select="' + C1.t1 + '"]');
  await pause(350);
  const backFromTerm = await evalJs(READ);
  check('WO-3.55: changing term returns the teacher\'s order — sorted by Due, Quarter 2 and back: Quarter 2 opens '
    + 'unsorted, and Quarter 1 comes back in document order',
    onT2.view === 'assignmentsView' && ariaOk(onT2, '', '') && onT2.reset === null
      && onT2.groups.some((g) => g.ids.indexOf('a355_x1') >= 0)
      && sameGroups(backFromTerm, TEACHER) && ariaOk(backFromTerm, '', '') && backFromTerm.reset === null,
    j({ t2: onT2.groups.map((g) => g.ids.map(short)), back: groupsOf(backFromTerm) }));

  /* ══ A8 — the coarse floor, with the table drawn and a sort on ══
     touch-targets.mjs measures #assignmentsView after its own section has emptied the list, when the
     table is hidden — so it never sees these. Measured here instead. */
  await size(1024, 768, true);
  await toList(C1.id);
  await tapSort('due');
  const touch = await evalJs(`(function(){
    var m = function(el){ var r = el.getBoundingClientRect(); return { w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10 }; };
    var sorts = Array.prototype.map.call(document.querySelectorAll('#assignmentsView [data-assignment-sort]'),
      function(b){ var x = m(b); x.col = b.getAttribute('data-assignment-sort'); return x; });
    var r = document.querySelector('#assignmentsView [data-assignment-sort-reset]');
    return { coarse: matchMedia('(pointer: coarse)').matches, sorts: sorts, reset: r ? m(r) : null }; })()`);
  check('WO-3.55: under a coarse pointer, with the table drawn and a sort on, each of the five sort buttons and '
    + '↺ Your order measures at least 44×44',
    touch.coarse && touch.sorts.length === 5 && touch.sorts.every((b) => b.w >= 44 && b.h >= 44)
      && !!touch.reset && touch.reset.w >= 44 && touch.reset.h >= 44,
    j(touch));
  await tapReset();
  await size(1280, 800, false);

  /* ══ A5's second half — in the teacher's order the arrows still move a row ══ */
  await toList(C1.id);
  const revBeforeMove = (await evalJs(SNAP)).rev;
  await clickSel('#assignmentsBody [data-assignment-move-down="a355_q1"]');
  await pause(200);
  const moved = await evalJs(READ);
  const afterMove = await evalJs(SNAP);
  check('WO-3.55: in the teacher\'s order the arrows behave as before — ↓ on the first quiz moves it one place '
    + 'later on screen and in the document, and that is a write',
    j(groupsOf(moved).Quizzes) === j(['q2', 'q1', 'q3', 'q4']) && afterMove.rev > revBeforeMove
      && j(afterMove.order.slice(0, 4).map(short)) === j(['q2', 'q1', 'q3', 'q4']),
    j({ screen: groupsOf(moved).Quizzes, doc: afterMove.order.map(short), rev: revBeforeMove + '→' + afterMove.rev }));

  /* ══ A7 — the order holds while the editor is open, and sorts again at its close ══ */
  const typeInto = (field, value) => evalJs(`(function(){
    var f = document.querySelector('#assignmentFields [data-assignment-field="${field}"]');
    if (!f) return 0; f.value = ${j(value)}; f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  const editorUp = () => evalJs("!document.getElementById('assignmentModal').classList.contains('hidden')");

  await tapSort('name');
  const byName = await evalJs(READ);
  await clickSel('#assignmentsBody [data-assignment-edit="a355_q3"]');
  await pause(250);
  const typedName = await typeInto('name', 'Quiz 50');
  await pause(150);
  const whileName = await evalJs(READ);
  const nameUp = await editorUp();
  await clickSel('#assignmentModal [data-assignment-done]');
  await pause(300);
  const afterName = await evalJs(READ);
  check('WO-3.55: sorted by Assignment, typing a name into the open editor moves no row — "quiz 1" retyped as '
    + '"Quiz 50" stays first behind the dialog — and at Done the list sorts again with the sort still on',
    j(groupsOf(byName).Quizzes) === j(['q3', 'q2', 'q4', 'q1']) && typedName === 1 && nameUp
      && j(groupsOf(whileName).Quizzes) === j(['q3', 'q2', 'q4', 'q1'])
      && !(await editorUp()) && j(groupsOf(afterName).Quizzes) === j(['q2', 'q4', 'q1', 'q3'])
      && ariaOk(afterName, 'name', 'ascending') && !!afterName.reset,
    j({ before: groupsOf(byName).Quizzes, whileOpen: groupsOf(whileName).Quizzes, afterDone: groupsOf(afterName).Quizzes,
      aria: afterName.ths.map((t) => t.aria), reset: !!afterName.reset }));

  await tapSort('due');
  const byDue = await evalJs(READ);
  await clickSel('#assignmentsBody [data-assignment-edit="a355_q3"]');
  await pause(250);
  const typedDue = await typeInto('due', D(8));
  const typedAssigned = await typeInto('assigned', D(-1));
  await pause(150);
  const whileDue = await evalJs(READ);
  const dueUp = await editorUp();
  await clickSel('#assignmentModal [data-assignment-done]');
  await pause(300);
  const afterDue = await evalJs(READ);
  const q3 = await evalJs(`(function(){ var a = window.planbook.store.getDoc().assignments
    .filter(function(x){ return x.id === 'a355_q3'; })[0]; return a ? { due: a.due, termId: a.termId } : null; })()`);
  check('WO-3.55: sorted by Due, typing a later due date (and an assigned date) into the open editor moves no row; '
    + 'when the editor closes the row moves to its new place — Quiz 50 from first to third — and the sort stays on',
    j(groupsOf(byDue).Quizzes) === j(['q3', 'q2', 'q4', 'q1']) && typedDue === 1 && typedAssigned === 1 && dueUp
      && j(groupsOf(whileDue).Quizzes) === j(['q3', 'q2', 'q4', 'q1'])
      && !!q3 && q3.due === D(8) && q3.termId === C1.t1
      && j(groupsOf(afterDue).Quizzes) === j(['q2', 'q4', 'q3', 'q1'])
      && ariaOk(afterDue, 'due', 'ascending') && !!afterDue.reset && restingOk(afterDue, 'Due'),
    j({ before: groupsOf(byDue).Quizzes, whileOpen: groupsOf(whileDue).Quizzes, afterClose: groupsOf(afterDue).Quizzes,
      q3, aria: afterDue.ths.map((t) => t.aria), reset: !!afterDue.reset }));
  await tapReset();
} finally {
  await shut();
  await size(1280, 800, false);
  await evalJs(`(async function(){
    var s = window.planbook.store;
    if (s.getDoc()) {
      var mine = ${j(MINE)}, kids = ${j(SIDS)};
      s.update(function(doc){
        doc.classes = (doc.classes || []).filter(function(c){ return c.id !== ${j(C1.id)} && c.id !== ${j(C2.id)}; });
        doc.students = (doc.students || []).filter(function(x){ return kids.indexOf(x.id) < 0; });
        doc.assignments = (doc.assignments || []).filter(function(a){ return mine.indexOf(a.id) < 0; });
        if (doc.scores) mine.forEach(function(id){ delete doc.scores[id]; });
      });
      await s.flush();
    }
    var b = ${j(before)};
    if (b.open === null) { try { localStorage.removeItem('planbook_openClassId'); } catch (e) {} }
    else localStorage.setItem('planbook_openClassId', b.open);
    return 1; })()`);
  await reload();
}
}
