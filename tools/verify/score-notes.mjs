/* score-notes.mjs — a score cell can carry a note (WO-3.32)
 *
 * A note on one cell — the reason behind a mark — added, edited and cleared from the score grid
 * without leaving it, read back on student detail, and absent everywhere a projector or a guardian
 * could see it: presentation mode, the merge-field resolver, the printed grade sheet, the student
 * report's CSV. The backup carries it.
 *
 * Every note is ADDED through the controls a teacher touches — a cell, the flag bar's Note button,
 * the panel's field, Done and Remove note — and every keyboard claim is made with keys dispatched at
 * the page. window.planbook is used to plant the fixture and to READ: the document, the engine's own
 * classGrade(), the resolver, the grade sheet's record and the backup round trip.
 *
 * THE NOTE STRINGS OCCUR NOWHERE ELSE IN THIS REPOSITORY, the technique merge-fields.mjs borrows
 * from WO-6.3: "is a note on this surface" is then a search over what was actually produced, never
 * an inspection of the fields somebody remembered to look at.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes. It plants its own class, reloads at its head and its foot, takes the class back out,
 * and hands the page back at 1280x900 with touch off and presentation mode where it found it.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';
import { measureIn } from './touch-targets.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

console.log('\n--- a score cell can carry a note (WO-3.32) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.scores && window.planbook.gradeEngine"
  + " && window.planbook.mergeFields && window.planbook.gradesReport && window.planbook.backup"
  + " && window.planbook.detail && window.planbook.supports)"))) {
  skip('a score cell can carry a note (WO-3.32)', 'window.planbook is missing one of scores, '
    + 'gradeEngine, mergeFields, gradesReport, backup, detail or supports, so the document, the '
    + 'resolver and the sheet cannot be read back');
  return;
}

const CLS = 'c_wo332', TERM = 'tm332', CAT = 'k332';
const S1 = 'wo332-s1', S2 = 'wo332-s2', S3 = 'wo332-s3';
const A1 = 'a332-essay', A2 = 'a332-quiz', A3 = 'a332-hw';
const T_START = nodeDaysFromToday(-30), T_END = nodeDaysFromToday(60);
/* Every one of these is typed through the panel, and none of them may reach a draft, the sheet, the
   CSV, a projected screen or a log entry. */
const N1 = 'Wo332NoteRevisedEssay', N1B = 'Wo332NoteRevisedTwice', N2 = 'Wo332NoteOnTheMissing';
const N3 = 'Wo332NoteOnTheBlank', N4 = 'Wo332NoteOnTheLate';
const NOTES = [N1, N1B, N2, N3, N4];

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

/* ── THE FIXTURE ── one weighted class, three students, three pieces of work.
     Ada Apple  Essay 80 · Quiz MISSING · Homework blank
     Ben Birch  Essay 90 · Quiz 7       · Homework blank
     Cy Cole    Essay 70 · Quiz blank   · Homework blank
   Grid order is surname order, so Apple, Birch, Cole top to bottom. */
const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var mode = window.planbook.supports.presentationMode();
  window.planbook.supports.setPresentationMode(false);
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id:'${S1}', first:'Ada', last:'Apple', guardians:[{ name:'Gwen Apple',
      email:'gwen@example.invalid', relationship:'', phone:'' }] },
      { id:'${S2}', first:'Ben', last:'Birch' }, { id:'${S3}', first:'Cy', last:'Cole' });
    doc.classes.push({ id:'${CLS}', name:'WO-3.32 Notes', archived:false, letterScale:null,
      roster:['${S3}','${S1}','${S2}'],
      terms:[{ id:'${TERM}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'${CAT}', name:'All work', weight:100 }]});
    var add = function(id, name, points){
      doc.assignments.push({ id:id, classId:'${CLS}', termId:'${TERM}', categoryId:'${CAT}',
        name:name, points:points, assigned:'${T_START}', due:'${nodeDaysFromToday(20)}' });
    };
    add('${A1}', 'WO-3.32 Essay', 100);
    add('${A2}', 'WO-3.32 Quiz', 10);
    add('${A3}', 'WO-3.32 Homework', 10);
    /* EVERY PLANTED CELL IS STAMPED NOW (WO-3.33). A cell with no \`at\` pushes itself onto \`was\` on
       its first change, and this section is about notes, not history: stamped within the five
       minutes, every edit below replaces rather than pushes, so no cell here grows a past and the
       note checks read what they always read. score-history.mjs is where the push is checked. */
    var pad = function(n){ return (n < 10 ? '0' : '') + n; };
    var t = new Date(), off = -t.getTimezoneOffset(), abs = Math.abs(off);
    var at = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + 'T' + pad(t.getHours())
      + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds()) + (off < 0 ? '-' : '+') + pad(Math.floor(abs / 60))
      + ':' + pad(abs % 60);
    doc.scores['${A1}'] = { '${S1}': { v:80, at:at }, '${S2}': { v:90, at:at }, '${S3}': { v:70, at:at } };
    doc.scores['${A2}'] = { '${S1}': { v:null, flag:'missing', at:at }, '${S2}': { v:7, at:at } };
  });
  c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, mode: mode, open: c.getOpenTermId('${CLS}') };
})()`);

if (!plant.ok || plant.open !== TERM) {
  check('the WO-3.32 fixture is real: one class of three, open on its term', false, JSON.stringify(plant));
  return;
}

/* The file every earlier build wrote: this year as it stands, with no note on any cell anywhere.
   Taken now, before a single note exists, through the backup module's own writer. */
const before = await evalJs(`(async function(){
  var built = await window.planbook.backup.buildBackup();
  var scores = JSON.stringify(JSON.parse(built.text).scores);
  /* Counted in the SCORE MAP only: an attendance mark or a pass elsewhere in the year may carry a
     note of its own, and that is not what this file is about. */
  return { text: built.text, notes: (scores.match(/"note"/g) || []).length, scores: scores }; })()`);

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

/* One key at the page, the score grid section's own helper: a printable key needs `keyDown` with
   `text`, everything else the `rawKeyDown` shape. */
const sk = async (k, code, vk, text) => {
  const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 0 };
  if (text) ev.text = text;
  await send('Input.dispatchKeyEvent', Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
  await sleep(45);
};
const KEY = {
  enter: () => sk('Enter', 'Enter', 13), up: () => sk('ArrowUp', 'ArrowUp', 38),
  down: () => sk('ArrowDown', 'ArrowDown', 40), right: () => sk('ArrowRight', 'ArrowRight', 39),
  left: () => sk('ArrowLeft', 'ArrowLeft', 37), tab: () => sk('Tab', 'Tab', 9),
  esc: () => sk('Escape', 'Escape', 27), back: () => sk('Backspace', 'Backspace', 8),
  letter: (L) => sk(L, 'Key' + L.toUpperCase(), L.toUpperCase().charCodeAt(0), L),
  digit: (d) => sk(d, 'Digit' + d, d.charCodeAt(0), d),
};

/* The cell with the caret in it, the panel's state, and the field's value — read together. */
const STATE = `(function(){
  var a = document.activeElement;
  var panel = document.getElementById('scoresNote');
  var field = document.getElementById('scoresNoteText');
  return { cell: a && a.getAttribute('data-score-cell') ? a.getAttribute('data-score-cell') + '/'
      + a.getAttribute('data-score-student') : (a ? (a.id || a.tagName) : ''),
    panelOpen: !!panel && !panel.classList.contains('hidden'),
    field: field ? field.value : null,
    label: (document.getElementById('scoresNoteLabel') || {}).textContent || '',
    said: (document.getElementById('srLive') || {}).textContent || '' }; })()`;

/* What the document holds for the fixture's cells, after the debounced save has really happened —
   with each cell's `at` taken off (WO-3.33: every write stamps one, and the moment is not what these
   checks are about). `was` is NOT taken off, so a note edit that grew a history would still go red. */
const BARE = `function(col){ if (!col || typeof col !== 'object') return col; var o = {};
  Object.keys(col).forEach(function(k){ var c = col[k];
    if (c && typeof c === 'object') { c = Object.assign({}, c); delete c.at; } o[k] = c; }); return o; }`;
const DOC = `(async function(){
  await window.planbook.store.flush();
  var d = window.planbook.store.getDoc(), bare = ${BARE};
  return { A1: bare(d.scores['${A1}']) || null, A2: bare(d.scores['${A2}']) || null,
    A3: Object.prototype.hasOwnProperty.call(d.scores, '${A3}') ? bare(d.scores['${A3}']) : '(no column)' }; })()`;

/* Every grade the app shows for this class: the grid's three grade cells and its summary line, the
   engine asked directly, the grade sheet's record, and the assignment list's entered counts. */
const GRADES = `(function(){
  var p = window.planbook, d = p.store.getDoc();
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var grid = Array.prototype.map.call(document.querySelectorAll('#scoresBody tr[data-score-row]'),
    function(r){ return r.getAttribute('data-score-row') + '=' + (r.querySelector('.scores-grade') || {}).textContent; });
  var engine = ['${S1}','${S2}','${S3}'].map(function(id){
    var g = p.gradeEngine.classGrade(d, cls, '${TERM}', id);
    return id + '=' + g.percentage + '/' + g.letter; });
  var sheet = p.gradesReport.gradesRecord();
  return { grid: grid, summary: (document.getElementById('scoresSummary') || {}).textContent || '',
    engine: engine, sheet: JSON.stringify(sheet) }; })()`;

await openGrid();
const gradesBefore = await evalJs(GRADES);
const drawn = await evalJs(`(function(){
  var v = document.getElementById('scoresView');
  return { up: !!v && !v.classList.contains('hidden'),
    cells: document.querySelectorAll('#scoresBody [data-score-cell]').length,
    noteBtn: !!document.querySelector('#scoresFlags [data-score-note-open]'),
    noteBtnShown: (function(){ var b = document.querySelector('#scoresFlags [data-score-note-open]');
      return !!b && getComputedStyle(b).display !== 'none'; })(),
    panelHidden: document.getElementById('scoresNote').classList.contains('hidden'),
    marks: document.querySelectorAll('#scoresBody .scores-note-mark').length }; })()`);
check('WO-3.32: the grid is open on the fixture — nine cells, a Note button in the flag bar, the note '
  + 'panel shut, and no note mark on any cell before a note exists',
  drawn.up && drawn.cells === 9 && drawn.noteBtn && drawn.noteBtnShown && drawn.panelHidden
    && drawn.marks === 0 && before.notes === 0,
  JSON.stringify(drawn) + ' · notes in the pre-note backup = ' + before.notes);

/* ── ACCEPTANCE LINE 1: add, edit and clear from the grid ── */

/* ADD — tap Ada's essay, tap Note, type. Input.insertText is the keyboard's own insertion path, so
   the `input` event src/shell.js listens for is the real one. */
await clickSel(cellSel(A1, S1));
await clickSel('#scoresFlags [data-score-note-open]');
const opened = await evalJs(STATE);
await send('Input.insertText', { text: N1 });
await sleep(120);
const added = await evalJs(DOC);
const addedMark = await evalJs(`(function(){
  var i = document.querySelector('${cellSel(A1, S1)}');
  var w = i ? i.parentElement : null;
  return { mark: !!(w && w.querySelector('.scores-note-mark')), title: i ? i.title : '',
    label: i ? i.getAttribute('aria-label') : '',
    others: document.querySelectorAll('#scoresBody .scores-note-mark').length }; })()`);
check('WO-3.32: tapping a cell and then Note opens the panel on THAT cell with the caret in an empty '
  + 'field, and typing writes { v: 80, note } — the score untouched',
  opened.panelOpen && opened.cell === 'scoresNoteText' && opened.field === ''
    && /WO-3\.32 Essay/.test(opened.label) && /Ada Apple/.test(opened.label)
    && JSON.stringify(added.A1[S1]) === JSON.stringify({ v: 80, note: N1 }),
  JSON.stringify({ opened: opened, cell: added.A1[S1] }));

/* EDIT — the field's whole text replaced, as select-all-and-type does, through the same listener. */
await evalJs(`(function(){ var f = document.getElementById('scoresNoteText');
  f.value = ${JSON.stringify(N1B)}; f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
const edited = await evalJs(DOC);
await clickSel('#scoresNote [data-score-note-done]');
const done = await evalJs(STATE);
check('WO-3.32: editing the note rewrites it in the document, and Done shuts the panel, EMPTIES its '
  + 'field and puts the caret back in the cell it was about',
  JSON.stringify(edited.A1[S1]) === JSON.stringify({ v: 80, note: N1B })
    && !done.panelOpen && done.field === '' && done.label === '' && done.cell === A1 + '/' + S1,
  JSON.stringify({ cell: edited.A1[S1], after: done }));

/* A note on a MISSING cell and on a BLANK one — "any cell, including a blank, a missing or an
   excused" — and a second note on Ben's essay for the keyboard walk below. */
const addNote = async (a, s, text) => {
  await clickSel(cellSel(a, s));
  await clickSel('#scoresFlags [data-score-note-open]');
  await send('Input.insertText', { text: text });
  await sleep(100);
  await clickSel('#scoresNote [data-score-note-done]');
};
await addNote(A2, S1, N2);
await addNote(A3, S3, N3);
await addNote(A1, S2, N4);
const three = await evalJs(DOC);
const marksNow = await evalJs(`(function(){
  return Array.prototype.map.call(document.querySelectorAll('#scoresBody .scores-note-mark'), function(m){
    var i = m.parentElement.querySelector('[data-score-cell]');
    return i.getAttribute('data-score-cell') + '/' + i.getAttribute('data-score-student'); }).sort(); })()`);
check('WO-3.32: a note sits on a missing cell and on a blank one as well — { v: null, flag: missing, '
  + 'note } and { v: null, note } — and exactly the four noted cells wear the mark',
  JSON.stringify(three.A2[S1]) === JSON.stringify({ v: null, flag: 'missing', note: N2 })
    && three.A3 !== '(no column)' && JSON.stringify(three.A3[S3]) === JSON.stringify({ v: null, note: N3 })
    && JSON.stringify(marksNow) === JSON.stringify([A1 + '/' + S1, A1 + '/' + S2, A2 + '/' + S1, A3 + '/' + S3].sort()),
  JSON.stringify({ missing: three.A2[S1], blank: three.A3, marks: marksNow }));

/* ── ACCEPTANCE LINE 2: no grade moved, on any screen that shows one ── */
const gradesAfter = await evalJs(GRADES);
await clickSel('#scoresView [data-class-screen="assignments"]');
await sleep(300);
const counts = await evalJs(`(function(){
  return Array.prototype.map.call(document.querySelectorAll('#assignmentsBody tr'), function(r){
    var n = r.querySelector('.assign-name'), c = r.querySelector('.assign-count');
    return n && c ? n.textContent + '=' + c.textContent : ''; }).filter(Boolean); })()`);
check('WO-3.32: four notes later — one on a missing cell, one on a blank — every grade is where it was: '
  + 'the grid\'s three grade cells, its summary line (blanks included), the engine asked directly and '
  + 'the grade sheet\'s record; and the assignment list still counts the noted blank as not entered',
  JSON.stringify(gradesAfter) === JSON.stringify(gradesBefore) && gradesBefore.grid.length === 3
    && counts.some((t) => /WO-3\.32 Homework=0\/3/.test(t)) && counts.some((t) => /WO-3\.32 Essay=3\/3/.test(t)),
  JSON.stringify({ before: gradesBefore.engine, after: gradesAfter.engine, summary: gradesAfter.summary,
    counts: counts }));

/* ── ACCEPTANCE LINE 3: the mark on the grid, the note beside its assignment on student detail ── */
await openGrid();
const markRead = await evalJs(`(function(){
  var i = document.querySelector('${cellSel(A1, S1)}');
  var w = i.parentElement;
  var m = w.querySelector('.scores-note-mark');
  var cs = m ? getComputedStyle(m) : null;
  var r = m ? m.getBoundingClientRect() : { width: 0, height: 0 };
  return { mark: !!m, ariaHidden: m ? m.getAttribute('aria-hidden') : '', drawn: r.width > 0 || r.height > 0
      || (cs && parseFloat(cs.borderTopWidth) > 0),
    title: i.title, label: i.getAttribute('aria-label') }; })()`);
check('WO-3.32: a cell with a note shows the mark — drawn, aria-hidden — with the note on the field\'s '
  + 'tooltip and "has a note" in its accessible name (and not the note itself)',
  markRead.mark && markRead.ariaHidden === 'true' && markRead.drawn
    && markRead.title === 'Note: ' + N1B && /has a note$/.test(markRead.label)
    && markRead.label.indexOf(N1B) === -1,
  JSON.stringify(markRead));

await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
await sleep(300);
const DETAIL = `(function(){
  var v = document.getElementById('detailView');
  var card = v.querySelector('[data-score-notes-card]');
  var rows = card ? Array.prototype.map.call(card.querySelectorAll('[data-score-note-row]'), function(r){
    return r.getAttribute('data-score-note-row') + '|' + r.querySelector('.detail-missing-name').textContent
      + '|' + r.querySelector('.detail-score-note').textContent; }) : [];
  return { up: !v.classList.contains('hidden'), card: !!card,
    logCard: !!card && card.classList.contains('log-card'), rows: rows,
    html: v.innerHTML, hero: (v.querySelector('.detail-hero') || {}).textContent || '',
    csv: window.planbook.detail.studentCsv(window.planbook.detail.detailModel()).text }; })()`;
const det = await evalJs(DETAIL);
check('WO-3.32: student detail shows each of Ada\'s notes beside its assignment, in the grid\'s column '
  + 'order — the essay\'s and the missing quiz\'s — on a card wearing .log-card, the print gate',
  det.up && det.card && det.logCard
    && JSON.stringify(det.rows) === JSON.stringify([A1 + '|WO-3.32 Essay|' + N1B,
      A2 + '|WO-3.32 Quiz|' + N2]),
  JSON.stringify({ rows: det.rows, card: det.card, logCard: det.logCard }));
check('WO-3.32: and the student report\'s CSV carries none of it',
  det.csv.length > 100 && NOTES.every((n) => det.csv.indexOf(n) === -1),
  det.csv.length + ' characters of CSV; notes found = '
    + JSON.stringify(NOTES.filter((n) => det.csv.indexOf(n) !== -1)));

/* ── ACCEPTANCE LINE 4: presentation mode, through the header's own control ──
   The panel is OPEN on a noted cell when the switch is reached for, which is the worst case: a
   field holding a student's words is still in the DOM whatever its display. */
await openGrid();
await clickSel(cellSel(A1, S1));
await clickSel('#scoresFlags [data-score-note-open]');
const openBeforeFlip = await evalJs(STATE);
await clickSel('#presentationBtn');
await sleep(250);
const LEAK = `(function(notes){
  var root = document.documentElement;
  var html = root.outerHTML;
  var values = Array.prototype.map.call(document.querySelectorAll('input, textarea'), function(e){ return e.value; }).join('\\n');
  var labels = Array.prototype.map.call(document.querySelectorAll('[aria-label],[title]'), function(e){
    return (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || ''); }).join('\\n');
  return { on: window.planbook.supports.presentationMode(),
    found: notes.filter(function(n){ return html.indexOf(n) !== -1 || values.indexOf(n) !== -1; }),
    marks: document.querySelectorAll('.scores-note-mark').length,
    hasANote: /has a note/.test(labels),
    noteTitle: /Note: Wo332/.test(labels),
    btnShown: (function(){ var b = document.querySelector('#scoresFlags [data-score-note-open]');
      return !!b && getComputedStyle(b).display !== 'none'; })(),
    panelOpen: !document.getElementById('scoresNote').classList.contains('hidden'),
    field: document.getElementById('scoresNoteText').value,
    card: !!document.querySelector('[data-score-notes-card]'),
    gridUp: !document.getElementById('scoresView').classList.contains('hidden'),
    detailUp: !document.getElementById('detailView').classList.contains('hidden'),
    cells: document.querySelectorAll('#scoresBody [data-score-cell]').length }; })(${JSON.stringify(NOTES)})`;
const projGrid = await evalJs(LEAK);
check('WO-3.32: presentation mode switched on from the header WITH THE NOTE PANEL OPEN takes every '
  + 'note off the grid at once — no note text anywhere in the DOM or in any field\'s value, no mark, '
  + 'no "has a note", no tooltip, the panel shut and emptied, and the Note button gone',
  openBeforeFlip.panelOpen && openBeforeFlip.field === N1B
    && projGrid.on === true && projGrid.gridUp && projGrid.cells === 9 && projGrid.found.length === 0
    && projGrid.marks === 0 && !projGrid.hasANote && !projGrid.noteTitle && !projGrid.btnShown
    && !projGrid.panelOpen && projGrid.field === '',
  JSON.stringify({ openBefore: openBeforeFlip.panelOpen, projected: projGrid }));

await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
await sleep(300);
const projDetail = await evalJs(LEAK);
check('WO-3.32: and on student detail in presentation mode there is no notes card and no note text '
  + 'anywhere in the page',
  projDetail.on === true && projDetail.detailUp && !projDetail.card && projDetail.found.length === 0,
  JSON.stringify(projDetail));

/* Back off: the mark and the card return, which is what makes the two checks above non-vacuous —
   the same page, the same notes, one switch. */
await clickSel('#presentationBtn');
await sleep(250);
const backDetail = await evalJs(DETAIL);
await openGrid();
const backGrid = await evalJs(LEAK);
check('WO-3.32: switched off again, the card is back on student detail and the four marks are back '
  + 'on the grid — the same notes, so the absences above were the mode and not an empty fixture',
  backDetail.card && backDetail.rows.length === 2 && backGrid.on === false && backGrid.marks === 4
    && backGrid.hasANote && backGrid.btnShown,
  JSON.stringify({ card: backDetail.card, rows: backDetail.rows.length, marks: backGrid.marks,
    btn: backGrid.btnShown }));

/* ── ACCEPTANCE LINE 7: the keyboard is unchanged, on cells that carry notes ──
   The walk starts in Ada's essay — noted — and passes through Ben's — noted — and every key does
   what WO-3.5, WO-3.16 and the browser's own Tab order did before a note existed. The panel never
   opens. */
const at = async () => (await evalJs(STATE));
const focusSelected = (a, s) => evalJs('(function(){ var i = document.querySelector('
  + JSON.stringify(cellSel(a, s)) + '); i.focus(); i.select(); return 1; })()');
await focusSelected(A1, S1);
const walk = [];
const step = async (name, fn) => { await fn(); const s = await at(); walk.push(name + '→' + s.cell + (s.panelOpen ? '(PANEL)' : '')); };
await step('Enter', KEY.enter);
await step('Enter', KEY.enter);
await step('Enter(last)', KEY.enter);
await step('Up', KEY.up);
await step('Right', KEY.right);
await step('Left', KEY.left);
await step('Tab', KEY.tab);
await step('Down', KEY.down);
await step('Escape', KEY.esc);
const expectWalk = ['Enter→' + A1 + '/' + S2, 'Enter→' + A1 + '/' + S3, 'Enter(last)→' + A1 + '/' + S3,
  'Up→' + A1 + '/' + S2, 'Right→' + A2 + '/' + S2, 'Left→' + A1 + '/' + S2, 'Tab→' + A2 + '/' + S2,
  'Down→' + A2 + '/' + S3, 'Escape→' + A2 + '/' + S3];
check('WO-3.32: Enter, the arrows, Tab and Escape move exactly as they did before notes, across two '
  + 'noted cells — down the column, clamped at the last student, up, sideways both ways, Tab to the next '
  + 'assignment, and Escape doing nothing — and the note panel never opens',
  JSON.stringify(walk) === JSON.stringify(expectWalk), JSON.stringify(walk));

/* The flags on a noted cell: Ben's quiz is given a note, then L, L, a typed score, ⌫ to empty, ⌫ on the
   empty cell, and the score typed back. Each flag key does what it did; the note rides through every
   one of them; ⌫ on an empty cell holding only a note is handed back to the browser exactly as it was
   on a cell with no key; and no key — L, M, X, N — opens the panel. */
await addNote(A2, S2, N4 + 'Quiz');
await focusSelected(A2, S2);
const flagWalk = [];
const cellNow = async () => JSON.stringify((await evalJs(DOC)).A2[S2]);
await KEY.letter('l'); flagWalk.push('L ' + await cellNow());
await KEY.letter('L'); flagWalk.push('L ' + await cellNow());
await evalJs(`(function(){ var i = document.querySelector('${cellSel(A2, S2)}'); i.focus(); i.select(); return 1; })()`);
await KEY.digit('8'); flagWalk.push('8 ' + await cellNow());
await KEY.back(); flagWalk.push('⌫ ' + await cellNow());
await KEY.back(); flagWalk.push('⌫(empty) ' + await cellNow());
await KEY.letter('n'); await KEY.letter('N');
const afterN = await at();
await KEY.digit('7'); flagWalk.push('7 ' + await cellNow());
const nq = N4 + 'Quiz';
const expectFlags = ['L ' + JSON.stringify({ v: 7, flag: 'late', note: nq }), 'L ' + JSON.stringify({ v: 7, note: nq }),
  '8 ' + JSON.stringify({ v: 8, note: nq }), '⌫ ' + JSON.stringify({ v: null, note: nq }),
  '⌫(empty) ' + JSON.stringify({ v: null, note: nq }), '7 ' + JSON.stringify({ v: 7, note: nq })];
check('WO-3.32: on a noted cell L sets and takes off late, a typed score and ⌫ edit the value, ⌫ on '
  + 'the emptied cell does nothing, and the note survives every one; N opens nothing',
  JSON.stringify(flagWalk) === JSON.stringify(expectFlags) && !afterN.panelOpen
    && afterN.cell === A2 + '/' + S2,
  JSON.stringify({ walk: flagWalk, afterN: afterN }));

await focusSelected(A2, S1);
await KEY.letter('x');
const xOn = (await evalJs(DOC)).A2[S1];
await KEY.letter('m');
const mOn = (await evalJs(DOC)).A2[S1];
const xmState = await at();
check('WO-3.32: X and M on the noted missing cell set excused and then missing again, carrying the note, '
  + 'and neither opens the panel',
  JSON.stringify(xOn) === JSON.stringify({ v: null, flag: 'excused', note: N2 })
    && JSON.stringify(mOn) === JSON.stringify({ v: null, flag: 'missing', note: N2 }) && !xmState.panelOpen,
  JSON.stringify({ x: xOn, m: mOn, panel: xmState.panelOpen }));

/* Clear on the flag bar, on Ben's essay (90, noted): the score goes to blank, the note stays. */
await clickSel(cellSel(A1, S2));
await clickSel('#scoresFlags [data-score-flag="clear"]');
const cleared = (await evalJs(DOC)).A1[S2];
check('WO-3.32: Clear on the flag bar empties the score and keeps the note — { v: null, note } — because '
  + 'Clear is about the score and the note is taken off in its own panel',
  JSON.stringify(cleared) === JSON.stringify({ v: null, note: N4 }), JSON.stringify(cleared));
/* And the 90 back, typed, so the fixture's grades are what they were. */
await evalJs(`(function(){ var i = document.querySelector('${cellSel(A1, S2)}'); i.focus(); i.select(); return 1; })()`);
await KEY.digit('9'); await KEY.digit('0');

/* ── ACCEPTANCE LINE 5: the resolver and the printed sheet ── */
const drafts = await evalJs(`(function(){
  var p = window.planbook, d = p.store.getDoc();
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var hits = p.signals.evaluate(d, cls, '${TERM}');
  var notes = ${JSON.stringify(NOTES)};
  var draft = function(subject, body){
    return p.mergeFields.resolveDraft({ doc: d, classId: '${CLS}', termId: '${TERM}', studentId: '${S1}',
      hit: null, hits: hits, template: { subject: subject, body: body } }); };
  var paths = ['score.note', 'scores.note', 'note', 'score', 'scores', 'student.score.note',
    'student.scores', 'cell.note', 'scores.${A1}.${S1}.note', 'scores.${A1}.${S1}', 'scores.${A1}',
    '${A1}.${S1}.note', 'assignment.note', 'grade.note', 'missing.note', 'missing.list.note', 'notes',
    'student.notes', 'Score.Note'];
  var refusals = paths.map(function(path){
    var out = draft('Re {{' + path + '}}', 'Body {{' + path + '}} end');
    var all = out.subject + ' ' + out.body;
    return { path: path, blocked: out.blocked, codes: out.errors.map(function(e){ return e.code; }),
      intact: all.indexOf('{{' + path + '}}') >= 0,
      leaks: notes.filter(function(n){ return all.indexOf(n) !== -1; }) }; });
  var body = p.mergeFields.mergeFieldNames().map(function(n){ return n + ' = {{' + n + '}}'; }).join('\\n');
  var full = draft('About {{student.first}}', body);
  return { refusals: refusals, full: { codes: full.errors.map(function(e){ return e.code + ':' + e.field; }),
    body: full.body, leaks: notes.filter(function(n){ return (full.subject + full.body).indexOf(n) !== -1; }) } }; })()`);
const badRef = drafts.refusals.filter((r) => !(r.blocked && r.intact && r.leaks.length === 0
  && r.codes.length === 2 && r.codes.every((c) => c === 'refused-field' || c === 'unknown-field')));
check('WO-3.32: {{score.note}} and every path into a cell — nineteen spellings, by assignment and '
  + 'student id among them — are refused by the merge-field resolver: each blocks the draft, keeps its '
  + 'token as typed, and carries no note',
  drafts.refusals.length === 19 && badRef.length === 0,
  badRef.length ? 'not refused: ' + JSON.stringify(badRef) : '19 path(s) refused, no note in any');
/* Not every field has an answer for this fixture — no signal hit is handed in, so the hit-shaped
   fields are UNRESOLVED and the draft blocks on them — and that is fine here: what is asked is what
   the fields that DO resolve carry. So the errors are allowed only as `unresolved-field`, never as a
   refusal or an unknown name, and {{missing.list}} has to have resolved to the noted quiz. */
check('WO-3.32: and the whole palette, resolved for the student with three notes on her cells — one of '
  + 'them on the missing quiz {{missing.list}} names — carries none of them',
  drafts.full.leaks.length === 0 && /missing\.list = .*WO-3\.32 Quiz/.test(drafts.full.body)
    && drafts.full.codes.every((c) => c.indexOf('unresolved-field:') === 0),
  JSON.stringify({ codes: drafts.full.codes, leaks: drafts.full.leaks,
    missingList: (drafts.full.body.match(/missing\.list = .*/) || [''])[0] }));

await openGrid();
await clickSel('#scoresView [data-grades-record]');
await sleep(400);
const sheet = await evalJs(`(function(notes){
  var p = window.planbook, m = document.getElementById('gradesRecordModal');
  var rec = p.gradesReport.gradesRecord();
  var csv = p.gradesReport.gradesCsv(rec);
  var text = (m ? m.innerHTML : '') + '\\n' + JSON.stringify(rec) + '\\n' + (csv && csv.text !== undefined ? csv.text : String(csv));
  return { open: !!m && !m.classList.contains('hidden'), len: text.length,
    hasAda: text.indexOf('Apple') !== -1, has80: (m ? m.textContent : '').indexOf('80') !== -1,
    found: notes.filter(function(n){ return text.indexOf(n) !== -1; }) }; })(${JSON.stringify(NOTES)})`);
await evalJs("window.planbook.closeModal('gradesRecordModal'); 1");
check('WO-3.32: the printed grade sheet — the dialog as drawn, its record and its CSV — contains no note '
  + 'text, over a sheet that does carry Ada\'s row and her 80',
  sheet.open && sheet.hasAda && sheet.has80 && sheet.found.length === 0,
  JSON.stringify(sheet));

/* No log entry was written by any of the above — the note lives in the cell and nowhere else. */
const logged = await evalJs(`(function(notes){ var d = window.planbook.store.getDoc();
  var t = JSON.stringify(d.log || []);
  return notes.filter(function(n){ return t.indexOf(n) !== -1; }).length; })(${JSON.stringify(NOTES)})`);
check('WO-3.32: no note was mirrored into the log', logged === 0, logged + ' log entr(ies) carry a note');

/* ── ACCEPTANCE LINE 1, the other half: clearing removes the KEY ──
   By emptying the field on Ada's essay (a scored cell, so the cell stays as { v: 80 }) and by
   Remove note on Cy's homework (a blank, so the cell and its now-empty column go entirely). */
await clickSel(cellSel(A1, S1));
await clickSel('#scoresFlags [data-score-note-open]');
await evalJs(`(function(){ var f = document.getElementById('scoresNoteText');
  f.value = '   '; f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
const emptied = (await evalJs(DOC)).A1[S1];
await clickSel('#scoresNote [data-score-note-done]');
await clickSel(cellSel(A3, S3));
await clickSel('#scoresFlags [data-score-note-open]');
const openedBlank = await evalJs(STATE);
await clickSel('#scoresNote [data-score-note-remove]');
const removed = await evalJs(DOC);
const afterRemove = await evalJs(STATE);
check('WO-3.32: clearing a note removes the key — a field emptied to whitespace leaves { v: 80 } with '
  + 'no note key, and Remove note on a blank cell that held only a note deletes the cell and the '
  + 'column with it, so the document is as it was before the note',
  JSON.stringify(emptied) === JSON.stringify({ v: 80 }) && !('note' in emptied)
    && openedBlank.field === N3 && removed.A3 === '(no column)'
    && !afterRemove.panelOpen && afterRemove.cell === A3 + '/' + S3,
  JSON.stringify({ emptied: emptied, openedBlankWith: openedBlank.field, A3: removed.A3, after: afterRemove }));

/* ── ACCEPTANCE LINE 6: the backup, both ways ── */
const files = await evalJs(`(async function(){
  var b = window.planbook.backup;
  var content = function(doc){ var c = Object.assign({}, doc); delete c.rev; delete c.updatedAt; return JSON.stringify(c); };
  var withNotes = await b.buildBackup();
  var parsed = b.parseBackup(withNotes.text, 'with-notes.json').doc;
  var older = b.parseBackup(${JSON.stringify(before.text)}, 'older.json').doc;
  return { text: withNotes.text,
    carries: withNotes.text.indexOf(${JSON.stringify(N2)}) !== -1 && withNotes.text.indexOf(${JSON.stringify(N4)}) !== -1,
    parsedSame: content(parsed) === content(JSON.parse(withNotes.text)),
    parsedNotes: [parsed.scores['${A2}']['${S1}'].note, parsed.scores['${A1}']['${S2}'].note],
    olderSame: content(older) === content(JSON.parse(${JSON.stringify(before.text)})),
    olderNotes: (JSON.stringify(older.scores).match(/"note"/g) || []).length }; })()`);
check('WO-3.32: a backup written before notes existed parses back identical in content with no note '
  + 'added, and a year with notes is written into the file and parsed back with them on the same cells',
  files.olderSame && files.olderNotes === 0 && files.carries && files.parsedSame
    && JSON.stringify(files.parsedNotes) === JSON.stringify([N2, N4]),
  JSON.stringify({ olderSame: files.olderSame, olderNotes: files.olderNotes, carries: files.carries,
    parsedSame: files.parsedSame, parsedNotes: files.parsedNotes }));

/* The real restore, through the confirm, read back off the disk — first the year WITH notes over
   itself, then the file from before any note existed, which must come back exactly as it was. */
const readDisk = `(async function(){ var s = window.planbook.store;
  var year = s.getDoc().year;
  var stored = await new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){ var db = open.result;
      var q = db.transaction('years','readonly').objectStore('years').get(year);
      q.onsuccess = function(){ res(q.result); db.close(); };
      q.onerror = function(){ rej(q.error); }; }; });
  var bare = ${BARE};
  return { scores: JSON.stringify(stored.scores), a2s1: stored.scores['${A2}'] ? bare(stored.scores['${A2}'])['${S1}'] : null,
    a1s2: stored.scores['${A1}'] ? bare(stored.scores['${A1}'])['${S2}'] : null,
    confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') }; })()`;
await evalJs(`(async function(){
  await window.planbook.backup.restoreFromText(${JSON.stringify(files.text)}, 'Planbook notes.json'); return 1; })()`);
await clickSel('[data-backup-confirm]');
await sleep(600);
const roundTrip = await evalJs(readDisk);
check('WO-3.32: a year with notes round-trips through the real restore — on disk afterwards the missing '
  + 'quiz still carries its note beside its flag, and Ben\'s essay its note beside his 90',
  !roundTrip.confirmOpen
    && JSON.stringify(roundTrip.a2s1) === JSON.stringify({ v: null, flag: 'missing', note: N2 })
    && JSON.stringify(roundTrip.a1s2) === JSON.stringify({ v: 90, note: N4 }),
  JSON.stringify({ a2s1: roundTrip.a2s1, a1s2: roundTrip.a1s2, confirmOpen: roundTrip.confirmOpen }));

await evalJs(`(async function(){
  await window.planbook.backup.restoreFromText(${JSON.stringify(before.text)}, 'Planbook before notes.json'); return 1; })()`);
await clickSel('[data-backup-confirm]');
await sleep(600);
const unchanged = await evalJs(readDisk);
check('WO-3.32: and the backup written before this work order restores unchanged — every score cell on '
  + 'disk is the file\'s, byte for byte, and not one carries a note',
  !unchanged.confirmOpen && unchanged.scores === before.scores
    && (unchanged.scores.match(/"note"/g) || []).length === 0,
  unchanged.scores === before.scores ? 'score map identical to the file (' + before.scores.length + ' chars)'
    : 'DIFFERS: ' + unchanged.scores.slice(0, 300));

/* ── the coarse pass: the Note button and the open panel's three controls at 44px ── */
await flush();
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.reload');
await sleep(700);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
const coarse = await evalJs("matchMedia('(pointer: coarse)').matches");
await openGrid();
await evalJs(`(function(){ var i = document.querySelector('${cellSel(A1, S1)}'); i.focus(); return 1; })()`);
await clickSel('#scoresFlags [data-score-note-open]');
const panel44 = await evalJs(measureIn('#scoresNote'));
const btn44 = await evalJs(`(function(){ var b = document.querySelector('#scoresFlags [data-score-note-open]');
  var r = b.getBoundingClientRect(); return { w: r.width, h: r.height }; })()`);
const under = panel44.filter((m) => m.w < 44 || m.h < 44);
check('WO-3.32: under a coarse pointer the Note button and the open panel\'s field, Remove note and Done '
  + 'all clear 44px',
  coarse === true && panel44.length === 3 && under.length === 0 && btn44.w >= 44 && btn44.h >= 44,
  'coarse = ' + coarse + '; panel ' + JSON.stringify(panel44) + '; Note button ' + JSON.stringify(btn44));
await clickSel('#scoresNote [data-score-note-done]');

/* ── THE FIXTURE COMES BACK OUT, by id, and the page is handed back as it was received ── */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo332-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a332-') === 0) delete doc.scores[k]; });
  });
  window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
