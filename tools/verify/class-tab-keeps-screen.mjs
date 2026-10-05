/* class-tab-keeps-screen.mjs — a class tab keeps Assignments and Scores up (WO-3.45)
 *
 * The owner's ruling of 2026-10-04: a header tab tapped while the assignment list or the score grid
 * is up shows the SAME screen for the class tapped, where it used to drop to Attendance. Student
 * detail still drops to Attendance, because the student is not in the other class. Nothing else
 * moves — a card and a reload still land on Attendance, and those halves are asserted in
 * verify/assignments.mjs, where WO-3.3's own checks for them already were.
 *
 * TWO CLASSES THAT SHARE NOTHING, which is the whole of the fixture's job. Different students,
 * different terms, different categories, different work, and every id and name prefixed so that
 * "a row or a column of A's on B's grid" is a set intersection rather than a judgement. The search
 * query typed into A matches one of A's students and none of B's, so a search carried across the
 * tap narrows B's grid to nobody; and A's category pill is A's own id, so a pill carried across
 * leaves no pill on B pressed. Both shapes are what the work order's Deliverables name as the
 * failure, and both go red here rather than passing by luck.
 *
 * Every navigation is a tap on the real control — a card, a switcher pill, a header tab, a name on
 * the grid — and the score is typed one key at a time into a real cell, then the tab is tapped with
 * no flush between them: the claim is that the write lands in A before B is drawn, and a flush in
 * the middle would make the check about the flush. The document is read only after the store has
 * really saved (tools/README.md § "Driving a browser over CDP", trap 6).
 *
 * It plants its own two classes, reloads at its head and its foot, takes both back out, and hands
 * the page back at 1200x900 with touch off — the state score-search.mjs leaves it in.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

console.log('\n--- a class tab keeps Assignments and Scores up (WO-3.45) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.classes)"))) {
  skip('a class tab keeps Assignments and Scores up (WO-3.45)',
    'no window.planbook.store/classes seam on the page, so no fixture can be planted');
  return;
}

const A = 'c_wo345a', B = 'c_wo345b';
const TA = 'tm345a', TB = 'tm345b';
const KA1 = 'k345a-essays', KA2 = 'k345a-quizzes', KB1 = 'k345b-reading', KB2 = 'k345b-writing';
const SA = ['wo345a-s1', 'wo345a-s2', 'wo345a-s3'];
const SB = ['wo345b-s1', 'wo345b-s2', 'wo345b-s3'];
const AA = ['a345a-essay', 'a345a-quiz'];
const AB = ['a345b-reading', 'a345b-journal', 'a345b-poem'];
const T_START = nodeDaysFromToday(-30), T_END = nodeDaysFromToday(60);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const flush = () => evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');

await flush();
await send('Emulation.setDeviceMetricsOverride',
  { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

/* ── THE FIXTURE ── two English classes, nothing in common.
     A: English I   — Odette Ashby, Pell Arden, Quill Avery · Essay (Essays), Quiz (Quizzes)
     B: English III — Rhea Brook, Sol Barlow, Tam Birch     · Reading, Journal (Reading), Poem (Writing)
   "Ashby" is the search: it is one of A's surnames and in nothing of B's. */
const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id:'${SA[0]}', first:'Odette', last:'Ashby' },
      { id:'${SA[1]}', first:'Pell', last:'Arden' }, { id:'${SA[2]}', first:'Quill', last:'Avery' },
      { id:'${SB[0]}', first:'Rhea', last:'Brook' }, { id:'${SB[1]}', first:'Sol', last:'Barlow' },
      { id:'${SB[2]}', first:'Tam', last:'Birch' });
    doc.classes.push({ id:'${A}', name:'WO-3.45 English I', archived:false, letterScale:null,
      roster:${JSON.stringify(SA)},
      terms:[{ id:'${TA}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'${KA1}', name:'Essays', weight:60 }, { id:'${KA2}', name:'Quizzes', weight:40 }] });
    doc.classes.push({ id:'${B}', name:'WO-3.45 English III', archived:false, letterScale:null,
      roster:${JSON.stringify(SB)},
      terms:[{ id:'${TB}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'${KB1}', name:'Reading', weight:50 }, { id:'${KB2}', name:'Writing', weight:50 }] });
    var add = function(id, cls, term, cat, name, points){
      doc.assignments.push({ id:id, classId:cls, termId:term, categoryId:cat, name:name, points:points,
        assigned:'${T_START}', due:'' });
    };
    add('${AA[0]}', '${A}', '${TA}', '${KA1}', 'WO-3.45 A Essay', 100);
    add('${AA[1]}', '${A}', '${TA}', '${KA2}', 'WO-3.45 A Quiz', 20);
    add('${AB[0]}', '${B}', '${TB}', '${KB1}', 'WO-3.45 B Reading', 10);
    add('${AB[1]}', '${B}', '${TB}', '${KB1}', 'WO-3.45 B Journal', 10);
    add('${AB[2]}', '${B}', '${TB}', '${KB2}', 'WO-3.45 B Poem', 50);
    /* A quiz score in each class, so both grids have a real cell before anything is typed. */
    doc.scores['${AA[1]}'] = { '${SA[1]}': { v:15 } };
    doc.scores['${AB[0]}'] = { '${SB[0]}': { v:8 } };
  });
  c.selectClass('${B}'); c.selectTerm('${TB}');
  c.selectClass('${A}'); c.selectTerm('${TA}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, openA: c.getOpenTermId('${A}'), openB: c.getOpenTermId('${B}') };
})()`);

if (!plant.ok || plant.openA !== TA || plant.openB !== TB) {
  check('the WO-3.45 fixture is real: two classes, each open on its own term', false, JSON.stringify(plant));
  return;
}

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
const tapTab = async (id) => {
  await clickSel('#classTabBar [data-class-tab="' + id + '"]');
  await sleep(300);
};

/* Everything a check here reads, in one round trip: which view is up, which class is open, which tab
   is marked, which segment every switcher strip marks, and what the two screens drew. */
const STATE = `(function(){
  var up = function(id){ var e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  var tab = document.querySelector('#classTabBar [data-class-tab][aria-current="true"]');
  var activeTabs = Array.prototype.map.call(document.querySelectorAll('#classTabBar [data-class-tab].active'),
    function(b){ return b.getAttribute('data-class-tab'); });
  var strips = Array.prototype.map.call(document.querySelectorAll('[data-screen-nav]'), function(s){
    return Array.prototype.filter.call(s.querySelectorAll('.screen-nav-btn.active'), function(){ return true; })
      .map(function(b){ return b.getAttribute('data-class-screen') || (b.classList.contains('detail') ? 'detail' : '?'); })
      .join(','); });
  var cats = Array.prototype.map.call(document.querySelectorAll('#scoresCategories [data-scores-category]'),
    function(b){ return { id: b.getAttribute('data-scores-category'), pressed: b.getAttribute('aria-pressed') }; });
  var box = document.getElementById('scoresSearch');
  var found = document.getElementById('scoresFound');
  return {
    view: ['homeView','classView','assignmentsView','scoresView','detailView'].filter(up).join(','),
    open: window.planbook.classes.getSelectedClassId(),
    tab: tab ? tab.getAttribute('data-class-tab') : '',
    activeTabs: activeTabs,
    strips: strips,
    listHeading: (document.getElementById('assignmentsClassName') || {}).textContent || '',
    listNames: Array.prototype.map.call(document.querySelectorAll('#assignmentsBody .assign-name'),
      function(n){ return n.textContent; }),
    rows: Array.prototype.map.call(document.querySelectorAll('#scoresBody tr[data-score-row]'),
      function(r){ return r.getAttribute('data-score-row'); }),
    cols: Array.prototype.map.call(document.querySelectorAll('#scoresGridWrap [data-score-col]'),
      function(th){ return th.getAttribute('data-score-col'); }),
    cells: Array.prototype.map.call(document.querySelectorAll('#scoresBody [data-score-cell]'),
      function(i){ return i.getAttribute('data-score-cell') + '/' + i.getAttribute('data-score-student'); }),
    box: box ? box.value : null,
    found: found && !found.classList.contains('hidden') ? found.textContent.replace(/\\s+/g, ' ').trim() : '',
    cats: cats,
    registryRows: Array.prototype.map.call(document.querySelectorAll('#classView tr[data-attendance-row]'),
      function(r){ return r.getAttribute('data-attendance-row'); })
  }; })()`;

const same = (x, y) => JSON.stringify(x.slice().sort()) === JSON.stringify(y.slice().sort());
const noneOf = (xs, ids) => xs.every((x) => ids.every((id) => String(x).indexOf(id) === -1));
const stripsOn = (st, seg) => st.strips.length >= 1 && st.strips.every((s) => s === seg);

/* ── ACCEPTANCE LINE 1: the assignment list stays up across two class taps ── */
await goHome();
await clickSel('#homeGrid [data-class-tab="' + A + '"]');
await sleep(300);
await clickSel('#classView [data-class-screen="assignments"]');
await sleep(300);
const listA = await evalJs(STATE);
await tapTab(B);
const listB = await evalJs(STATE);
await tapTab(A);
const listBack = await evalJs(STATE);
check('WO-3.45: with English I\'s assignment list up, a tap on English III\'s header tab shows English III\'s '
  + 'assignment list — its heading, its three pieces of work and none of English I\'s — with the English III tab '
  + 'the marked one and every switcher strip marking Assignments; and a second tap, back on English I, shows '
  + 'English I\'s list again the same way',
  listA.view === 'assignmentsView' && listA.open === A
    && listB.view === 'assignmentsView' && listB.open === B && listB.tab === B
    && JSON.stringify(listB.activeTabs) === JSON.stringify([B]) && stripsOn(listB, 'assignments')
    && /English III/.test(listB.listHeading)
    && same(listB.listNames, ['WO-3.45 B Reading', 'WO-3.45 B Journal', 'WO-3.45 B Poem'])
    && listBack.view === 'assignmentsView' && listBack.open === A && listBack.tab === A
    && stripsOn(listBack, 'assignments') && /English I\b/.test(listBack.listHeading)
    && same(listBack.listNames, ['WO-3.45 A Essay', 'WO-3.45 A Quiz']),
  JSON.stringify({ before: [listA.view, listA.open], afterB: { view: listB.view, open: listB.open,
    tab: listB.tab, tabs: listB.activeTabs, strips: listB.strips, heading: listB.listHeading, names: listB.listNames },
    backA: { view: listBack.view, open: listBack.open, tab: listBack.tab, strips: listBack.strips,
      heading: listBack.listHeading, names: listBack.listNames } }));

/* ── ACCEPTANCE LINE 2 and LINE 6: the score grid, with a search, a pill and a score in flight ──
   Onto A's grid through the switcher, which is the arrival — then narrowed the way a teacher would:
   "Ashby" typed in the box, the Essays pill tapped, and a 73 typed into Odette's essay. The tab is
   tapped straight after the last key, with no flush in between. */
await clickSel('#assignmentsView [data-class-screen="scores"]');
await sleep(300);
await evalJs(`(function(){ var e = document.getElementById('scoresSearch'); e.value = 'Ashby';
  e.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
await sleep(150);
await clickSel('#scoresCategories [data-scores-category="' + KA1 + '"]');
await sleep(200);
const narrowedA = await evalJs(STATE);
const sk = async (k, code, vk, text) => {
  const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 0 };
  if (text) ev.text = text;
  await send('Input.dispatchKeyEvent', Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
  await sleep(45);
};
await evalJs(`(function(){ var i = document.querySelector('#scoresBody [data-score-cell="${AA[0]}"][data-score-student="${SA[0]}"]');
  if (!i) return 0; i.focus(); i.select(); return 1; })()`);
for (const d of '73') await sk(d, 'Digit' + d, d.charCodeAt(0), d);
await tapTab(B);
const gridB = await evalJs(STATE);

check('WO-3.45: the fixture narrowed English I\'s grid before the tap — the search held "Ashby" and showed '
  + 'Odette alone, and the Essays pill was the pressed one with the essay as the only column',
  narrowedA.view === 'scoresView' && narrowedA.open === A && narrowedA.box === 'Ashby'
    && JSON.stringify(narrowedA.rows) === JSON.stringify([SA[0]])
    && JSON.stringify(narrowedA.cols) === JSON.stringify([AA[0]])
    && narrowedA.cats.some((p) => p.id === KA1 && p.pressed === 'true'),
  JSON.stringify({ view: narrowedA.view, box: narrowedA.box, rows: narrowedA.rows, cols: narrowedA.cols,
    cats: narrowedA.cats }));

const aIds = SA.concat(AA, [A, KA1, KA2]);
check('WO-3.45: from English I\'s score grid, a tap on English III\'s header tab shows English III\'s score grid — '
  + 'its three students as the rows, its three pieces of work as the columns, and not one row, column or cell '
  + 'of English I\'s — with the English III tab marked and every switcher strip marking Scores',
  gridB.view === 'scoresView' && gridB.open === B && gridB.tab === B
    && JSON.stringify(gridB.activeTabs) === JSON.stringify([B]) && stripsOn(gridB, 'scores')
    && same(gridB.rows, SB) && same(gridB.cols, AB) && gridB.cells.length === SB.length * AB.length
    && noneOf(gridB.rows.concat(gridB.cols, gridB.cells), aIds),
  JSON.stringify({ view: gridB.view, open: gridB.open, tab: gridB.tab, tabs: gridB.activeTabs, strips: gridB.strips,
    rows: gridB.rows, cols: gridB.cols, cells: gridB.cells.length }));

check('WO-3.45: and English III\'s grid arrives unsearched and on All — the box empty, no count beside it, All '
  + 'the one pressed pill, and none of English I\'s category ids among the pills — exactly as an arrival '
  + 'through the switcher leaves it',
  gridB.box === '' && gridB.found === ''
    && gridB.cats.length === 3 && gridB.cats[0].id === '' && gridB.cats[0].pressed === 'true'
    && gridB.cats.filter((p) => p.pressed === 'true').length === 1
    && noneOf(gridB.cats.map((p) => p.id).filter(Boolean), [KA1, KA2]),
  JSON.stringify({ box: gridB.box, found: gridB.found, cats: gridB.cats }));

/* The score, read out of the store once it has really saved. "In A" is Odette's essay holding 73;
   "nowhere in B" is every cell of every B column, and every B student in every column at all. */
const stored = await evalJs(`(async function(){
  await window.planbook.store.flush();
  var d = window.planbook.store.getDoc();
  var a = (d.scores['${AA[0]}'] || {})['${SA[0]}'] || null;
  var inB = [];
  Object.keys(d.scores || {}).forEach(function(col){
    var cells = d.scores[col] || {};
    Object.keys(cells).forEach(function(st){
      var isB = ${JSON.stringify(AB)}.indexOf(col) !== -1 || ${JSON.stringify(SB)}.indexOf(st) !== -1;
      if (isB) inB.push(col + '/' + st + '=' + JSON.stringify(cells[st].v));
    });
  });
  return { a: a ? a.v : null, inB: inB }; })()`);
check('WO-3.45: the 73 typed into English I immediately before the tap is in English I — Odette\'s essay holds '
  + 'it in the saved document — and nowhere in English III: the only English III cell in the document is the '
  + 'one the fixture planted',
  stored.a === 73 && JSON.stringify(stored.inB) === JSON.stringify([AB[0] + '/' + SB[0] + '=8']),
  JSON.stringify(stored));

/* ── ACCEPTANCE LINE 3: student detail still drops to Attendance ──
   Onto Rhea's detail by her name on English III's grid, then a tap on English I's tab. */
await clickSel('#scoresBody [data-student-detail="' + SB[0] + '"]');
await sleep(300);
const onDetail = await evalJs(STATE);
await tapTab(A);
const fromDetail = await evalJs(STATE);
check('WO-3.45: with a student\'s detail up, a tap on another class\'s header tab lands on that class\'s '
  + 'Attendance — the registry up with English I\'s three students, the English I tab marked, and every '
  + 'switcher strip marking Attendance — because the student is not in the other class',
  onDetail.view === 'detailView' && onDetail.open === B
    && fromDetail.view === 'classView' && fromDetail.open === A && fromDetail.tab === A
    && stripsOn(fromDetail, 'class') && same(fromDetail.registryRows, SA),
  JSON.stringify({ before: [onDetail.view, onDetail.open], after: { view: fromDetail.view,
    open: fromDetail.open, tab: fromDetail.tab, strips: fromDetail.strips, rows: fromDetail.registryRows } }));

/* ── ACCEPTANCE LINE 4, the score grid's half: a reload from the grid still lands on Attendance ──
   verify/assignments.mjs reloads from the assignment list; this is the same reload from the other
   screen that now stays up on a tap, and REMEMBERED_AS is what has to answer it. Flushed first. */
await clickSel('#classView [data-class-screen="scores"]');
await sleep(300);
const storedOnGrid = await evalJs("JSON.parse(localStorage.getItem('planbook_openView') || 'null')");
await flush();
await send('Page.reload');
await sleep(600);
const booted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
const afterReload = await evalJs(STATE);
check('WO-3.45: a reload while the score grid is up still lands on Attendance — planbook_openView holds '
  + '"class" while the grid is showing, and the registry is what comes back',
  booted && storedOnGrid === 'class' && afterReload.view === 'classView' && afterReload.open === A
    && stripsOn(afterReload, 'class'),
  JSON.stringify({ storedOnGrid: storedOnGrid, view: afterReload.view, open: afterReload.open,
    strips: afterReload.strips }));

/* ── THE FIXTURE COMES BACK OUT, by id, and the page is handed back as it was received ── */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${A}' && x.id !== '${B}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo345') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${A}' && a.classId !== '${B}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a345') === 0) delete doc.scores[k]; });
  });
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
const gone = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return d.classes.filter(function(x){ return x.id === '${A}' || x.id === '${B}'; }).length
    + d.students.filter(function(x){ return String(x.id).indexOf('wo345') === 0; }).length
    + d.assignments.filter(function(a){ return String(a.id).indexOf('a345') === 0; }).length; })()`);
check('WO-3.45: the fixture comes back out — no class, student or assignment of it left in the document',
  gone === 0, gone + ' left');
}
