/* excused-kept.mjs — an excused cell keeps the score it had (WO-3.68)
 *
 * Marking a scored cell excused used to erase the score. Since WO-3.68 it keeps it: the engine still
 * puts an excused cell in neither earned nor possible, and the grid draws the kept number STRUCK
 * THROUGH so it is shown and plainly not counted. The owner's three rulings of 2026-10-21 are the
 * spine of this section — the strike, typing into an excused cell keeps it excused, and `missing` is
 * untouched — and the work order's Trap is the reason every strike below is read as COMPUTED STYLE
 * (`text-decoration-line`) rather than as a class name: a class whose rule was deleted, or overridden
 * in a block, says nothing, and "a number on screen the grade is not using must never look like one it
 * is" is a claim about what is drawn.
 *
 * THE GRADE CLAIMS ARE PAIRS. "The class grade is the same as for an excused blank" is satisfied by a
 * build that never counts anything, so every equality is taken beside a reading that proves the cell
 * COULD move the grade — the same cell with the flag off. That pair is also what the work order's
 * mutation turns red: make the engine read `v` on an excused cell and the kept score counts, so the
 * excused-with-score grade stops equalling the excused-blank one.
 *
 * Every flag is pressed as a key and every score typed at the grid; window.planbook plants the
 * fixture and READS — the document, the engine, the grade sheet, student detail and the backup. It
 * plants its own class, reloads at its head, under a coarse pointer, and at its foot, restores this
 * run's own year over itself once (the content is unchanged), takes the class back out, and hands the
 * page back at 1280x900 with touch off and presentation mode where it found it.
 *
 * WHAT IS NOT HERE AND IS OWED TO A HUMAN: whether the strike READS as "not counted" on the iPad, in
 * normal mode and under the projector. Computed style proves the line is declared on the field in
 * every state measured; no emulator has eyes.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

console.log('\n--- an excused cell keeps the score it had (WO-3.68) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.scores && window.planbook.gradeEngine"
  + " && window.planbook.gradesReport && window.planbook.backup && window.planbook.detail"
  + " && window.planbook.supports)"))) {
  skip('an excused cell keeps the score it had (WO-3.68)', 'window.planbook is missing one of scores, '
    + 'gradeEngine, gradesReport, backup, detail or supports, so the document and the grades cannot be '
    + 'read back');
  return;
}

const CLS = 'c_wo368', TERM = 'tm368', WRITING = 'k368w', PRACTICE = 'k368p';
const S1 = 'wo368-s1', S2 = 'wo368-s2', S3 = 'wo368-s3';
const A1 = 'a368-essay', A2 = 'a368-quiz', A3 = 'a368-hw';
const T_START = nodeDaysFromToday(-30), T_END = nodeDaysFromToday(60);
/* Two stamps for the one planted history, written as literals so the trail's dates are known here. */
const AT_OLD = '2026-09-20T09:00:00-04:00', AT_NEW = '2026-10-01T09:00:00-04:00';

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

/* ── THE FIXTURE ── one class, two categories so the two grading modes give different figures,
     three students, three pieces of work.
       Writing 60%:  Essay 100 pts
       Practice 40%: Quiz 20 pts · Homework 10 pts, due in 2020 so the past-due prompt asks about it
     Ada Apple   Essay 80                 · Quiz 15                         · Homework BLANK
     Ben Birch   Essay 90                 · Quiz EXCUSED, 18 kept, with a past · Homework EXCUSED, no score
     Cy Cole     Essay EXCUSED, no score  · Quiz 10                         · Homework EXCUSED, 7 kept
   The two `{ v: null, flag: 'excused' }` cells are the shape every earlier build wrote; the two with
   a number are the shape this one writes. Grid order is surname order. */
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
    doc.students.push({ id:'${S1}', first:'Ada', last:'Apple' }, { id:'${S2}', first:'Ben', last:'Birch' },
      { id:'${S3}', first:'Cy', last:'Cole' });
    doc.classes.push({ id:'${CLS}', name:'WO-3.68 Excused', archived:false, letterScale:null,
      roster:['${S3}','${S1}','${S2}'],
      terms:[{ id:'${TERM}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'${WRITING}', name:'Writing', weight:60 },
                  { id:'${PRACTICE}', name:'Practice', weight:40 }]});
    var add = function(id, cat, name, points, due){
      doc.assignments.push({ id:id, classId:'${CLS}', termId:'${TERM}', categoryId:cat,
        name:name, points:points, assigned:'${T_START}', due:due });
    };
    add('${A1}', '${WRITING}', 'WO-3.68 Essay', 100, '${nodeDaysFromToday(20)}');
    add('${A2}', '${PRACTICE}', 'WO-3.68 Quiz', 20, '${nodeDaysFromToday(20)}');
    add('${A3}', '${PRACTICE}', 'WO-3.68 Homework', 10, '2020-01-06');
    doc.scores['${A1}'] = { '${S1}': { v:80 }, '${S2}': { v:90 }, '${S3}': { v:null, flag:'excused' } };
    doc.scores['${A2}'] = { '${S1}': { v:15 },
      '${S2}': { v:18, flag:'excused', at:'${AT_NEW}', was:[{ v:18, at:'${AT_OLD}' }] },
      '${S3}': { v:10 } };
    doc.scores['${A3}'] = { '${S2}': { v:null, flag:'excused' }, '${S3}': { v:7, flag:'excused' } };
  });
  c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, mode: mode, open: c.getOpenTermId('${CLS}') }; })()`);

if (!plant || !plant.ok || plant.open !== TERM) {
  check('the WO-3.68 fixture is real: one class of three, open on its term', false, JSON.stringify(plant));
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
const KEY = {
  back: () => sk('Backspace', 'Backspace', 8),
  letter: (L) => sk(L, 'Key' + L.toUpperCase(), L.toUpperCase().charCodeAt(0), L),
  digit: (d) => sk(d, 'Digit' + d, d.charCodeAt(0), d),
};
/* Into a cell with its value selected — which is what every arrival leaves. */
const focusSelected = (a, s) => evalJs('(function(){ var i = document.querySelector('
  + JSON.stringify(cellSel(a, s)) + '); if (!i) return 0; i.focus(); i.select(); return 1; })()');
const typeOver = async (a, s, digits) => {
  await focusSelected(a, s);
  for (const d of digits) await KEY.digit(d);
};
/* The stored cell without its `at` and `was` — WO-3.33's stamp is not what these checks are about,
   and score-history.mjs owns it. */
const cell = async (a, s) => (await evalJs(`(async function(){
  await window.planbook.store.flush();
  var col = window.planbook.store.getDoc().scores['${a}'];
  if (!col || !Object.prototype.hasOwnProperty.call(col, '${s}')) return 'null';
  var c = JSON.parse(JSON.stringify(col['${s}'])); delete c.at; delete c.was;
  return JSON.stringify(c); })()`));
/* One field as it is DRAWN: its contents, placeholder, class, glyph, accessible name, and the
   computed decoration — which is the whole of what this work order adds to the screen. */
const drawn = (a, s) => evalJs(`(function(){
  var i = document.querySelector(${JSON.stringify(cellSel(a, s))});
  if (!i) return null;
  var st = getComputedStyle(i);
  var g = i.parentElement ? i.parentElement.querySelector('.scores-flag') : null;
  return { value: i.value, placeholder: i.placeholder, excused: i.classList.contains('excused'),
    line: st.textDecorationLine, thick: st.textDecorationThickness, ink: st.color,
    glyph: g ? g.textContent : '', label: i.getAttribute('aria-label') || '',
    focused: document.activeElement === i }; })()`);
const struck = (d) => !!d && /line-through/.test(d.line);
/* The flag clause of a kept score's accessible name. Followed by nothing, or by the next clause — a
   cell typed into here grows a past (WO-3.33), so ", has earlier versions" may come after it. */
const KEPT_SAYS = (n) => new RegExp(' — excused, ' + n + ' kept and not counted(,|$)');
const said = () => evalJs("(document.getElementById('srLive') || {}).textContent || ''");
/* The grade the grid shows for a student, and the engine's answer for the same document with one cell
   swapped — so "the same as an excused blank" is a comparison against the engine's own figure for the
   blank, not a number written down here. */
const grades = (student, swaps) => evalJs(`(function(){
  var p = window.planbook, d = p.store.getDoc();
  var pick = function(doc){ return doc.classes.filter(function(c){ return c.id === '${CLS}'; })[0]; };
  var row = document.querySelector('#scoresBody tr[data-score-row="${student}"]');
  var out = { grid: row ? ((row.querySelector('.scores-grade-num') || {}).textContent || '') : '',
    mode: p.gradeEngine.gradingModeOf(pick(d)),
    live: p.gradeEngine.classGrade(d, pick(d), '${TERM}', '${student}').percentage, as: {} };
  var swaps = ${JSON.stringify(swaps || {})};
  Object.keys(swaps).forEach(function(name){
    var clone = JSON.parse(JSON.stringify(d));
    var sw = swaps[name];
    clone.scores[sw.a][sw.s] = sw.cell;
    out.as[name] = p.gradeEngine.classGrade(clone, pick(clone), '${TERM}', '${student}').percentage;
  });
  out.liveText = out.live === null ? '' : p.scores.formatPercent(out.live);
  return out; })()`);

/* ── ACCEPTANCE LINE 1, THE ENGINE HALF, IN BOTH GRADING MODES ──
   Asked of the shipped module over clones of the live document, before anything is pressed: Ada's
   essay as 80, as excused with 80 kept, and as excused with nothing. The first must differ from the
   other two — otherwise the cell could not move the grade and the equality would prove nothing — and
   the other two must be equal. In a weighted class the excused essay empties Writing and its weight
   redistributes; in a points class it leaves both totals. */
const ENGINE = (mode) => evalJs(`(function(){
  var p = window.planbook, d = JSON.parse(JSON.stringify(p.store.getDoc()));
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  if (${JSON.stringify(mode)} === 'points') cls.gradingMode = 'points'; else delete cls.gradingMode;
  var at = function(cellValue){
    d.scores['${A1}']['${S1}'] = cellValue;
    var g = p.gradeEngine.classGrade(d, cls, '${TERM}', '${S1}');
    var open = p.gradeEngine.openWork(d, cls, '${TERM}', '${S1}');
    return { pct: g.percentage, cats: JSON.stringify(g.categories.map(function(k){
      return [k.id, k.earned, k.possible]; })), open: JSON.stringify(open) }; };
  return { mode: p.gradeEngine.gradingModeOf(cls), scored: at({ v:80 }),
    kept: at({ v:80, flag:'excused' }), blank: at({ v:null, flag:'excused' }) }; })()`);
for (const mode of ['weighted', 'points']) {
  const e = await ENGINE(mode);
  check('WO-3.68: in a ' + mode + ' class the engine grades Ada\'s essay excused-with-80-kept exactly as '
    + 'excused-with-nothing — the same percentage, the same per-category earned and possible, the same '
    + 'open work — and both differ from the essay scored 80, so the kept score could have moved it',
    e.mode === mode && e.kept.pct === e.blank.pct && e.kept.cats === e.blank.cats
      && e.kept.open === e.blank.open && e.scored.pct !== e.kept.pct && typeof e.kept.pct === 'number',
    JSON.stringify(e));
}

/* ── ACCEPTANCE LINE 1, ON THE GRID: X on a scored cell ── */
await openGrid();
const ready = await drawn(A1, S1);
check('WO-3.68: the grid is up with Ada\'s essay drawn as 80, unflagged and not struck — the cell X is '
  + 'about to be pressed in', !!ready && ready.value === '80' && !ready.excused && !struck(ready),
  JSON.stringify(ready));
await focusSelected(A1, S1);
await KEY.letter('x');
await sleep(120);
const kept = await cell(A1, S1);
const keptDrawn = await drawn(A1, S1);
const keptSaid = await said();
const keptGrades = await grades(S1, {
  blank: { a: A1, s: S1, cell: { v: null, flag: 'excused' } },
  counted: { a: A1, s: S1, cell: { v: 80 } } });
check('WO-3.68: pressing X on Ada\'s essay (80) keeps `v` in the document — `{ v: 80, flag: \'excused\' }` '
  + '— and says so: the score is kept, struck through, and no longer counts',
  kept === '{"v":80,"flag":"excused"}' && /The 80 is kept, struck through, and no longer counts\./.test(keptSaid),
  'cell ' + kept + ' :: said ' + JSON.stringify(keptSaid));
check('WO-3.68: and the cell draws the 80 struck through in the excused colours — computed '
  + '`text-decoration-line: line-through`, the X glyph, the excused class — while it still has the caret, '
  + 'and its accessible name says excused, kept and not counted',
  !!keptDrawn && keptDrawn.focused && keptDrawn.value === '80' && keptDrawn.excused && struck(keptDrawn)
    && keptDrawn.glyph === 'X' && KEPT_SAYS(80).test(keptDrawn.label)
    && keptDrawn.ink === 'rgb(124, 58, 237)',
  JSON.stringify(keptDrawn));
check('WO-3.68: the class grade on the grid with the 80 kept is the engine\'s grade for the same cell '
  + 'excused with no score, in a weighted class — and the 80 counted would have been a different grade',
  keptGrades.mode === 'weighted' && keptGrades.live === keptGrades.as.blank
    && keptGrades.grid === keptGrades.liveText && keptGrades.grid !== ''
    && keptGrades.as.counted !== keptGrades.as.blank,
  JSON.stringify(keptGrades));

/* ── ACCEPTANCE LINE 2: X again takes the flag off, and the kept score counts ── */
await focusSelected(A1, S1);
await KEY.letter('x');
await sleep(120);
const off = await cell(A1, S1);
const offDrawn = await drawn(A1, S1);
const offSaid = await said();
const offGrades = await grades(S1, { blank: { a: A1, s: S1, cell: { v: null, flag: 'excused' } } });
check('WO-3.68: pressing X again on that cell takes the flag off and the kept 80 counts — the cell is '
  + '`{ v: 80 }`, drawn unstruck with no glyph, the sentence says it counts again, and the grid\'s grade '
  + 'moves off the excused-blank grade to the engine\'s grade for the 80',
  off === '{"v":80}' && !!offDrawn && offDrawn.value === '80' && !offDrawn.excused && !struck(offDrawn)
    && offDrawn.glyph === '' && !/excused/.test(offDrawn.label)
    && /The 80 it kept counts in the grade again\./.test(offSaid)
    && offGrades.grid === offGrades.liveText && offGrades.live !== offGrades.as.blank
    && offGrades.live === keptGrades.as.counted,
  JSON.stringify({ off: off, drawn: offDrawn, said: offSaid, grades: offGrades }));

/* ── ACCEPTANCE LINE 3: typing into an excused cell ── */
await focusSelected(A1, S1);
await KEY.letter('x');
await sleep(80);
await typeOver(A1, S1, '65');
await sleep(80);
const typed = await cell(A1, S1);
const typedDrawn = await drawn(A1, S1);
await focusSelected(A1, S1);
await KEY.back();
await sleep(120);
const emptied = await cell(A1, S1);
const emptiedDrawn = await drawn(A1, S1);
check('WO-3.68: typing 65 into the excused essay writes `v` and keeps the flag — `{ v: 65, flag: '
  + '\'excused\' }`, drawn 65 and struck, its accessible name saying 65 kept',
  typed === '{"v":65,"flag":"excused"}' && !!typedDrawn && typedDrawn.value === '65' && typedDrawn.excused
    && struck(typedDrawn) && KEPT_SAYS(65).test(typedDrawn.label),
  JSON.stringify({ typed: typed, drawn: typedDrawn }));
check('WO-3.68: and emptying the field clears `v` and keeps the flag — `{ v: null, flag: \'excused\' }`, '
  + 'drawn exactly as an excused blank always was: empty, the Ex placeholder, the X glyph, no strike, '
  + 'and an accessible name ending "— excused"',
  emptied === '{"v":null,"flag":"excused"}' && !!emptiedDrawn && emptiedDrawn.value === ''
    && emptiedDrawn.placeholder === 'Ex' && emptiedDrawn.excused && emptiedDrawn.glyph === 'X'
    && !struck(emptiedDrawn) && / — excused(,|$)/.test(emptiedDrawn.label) && !/kept/.test(emptiedDrawn.label),
  JSON.stringify({ emptied: emptied, drawn: emptiedDrawn }));

/* RULING 3: `missing` is unchanged — M on Ada's quiz (15) clears the score, and typing a number into a
   missing cell still takes the flag off. Put back to 15 by typing, so the readers below see the
   fixture as planted. */
await focusSelected(A2, S1);
await KEY.letter('m');
await sleep(80);
const missing = await cell(A2, S1);
await typeOver(A2, S1, '9');
await sleep(80);
const unmissed = await cell(A2, S1);
await typeOver(A2, S1, '15');
check('WO-3.68, ruling 3: `missing` is untouched — M on a scored cell still clears the score, and typing '
  + 'a number into a missing cell still takes the flag off',
  missing === '{"v":null,"flag":"missing"}' && unmissed === '{"v":9}',
  JSON.stringify({ missing: missing, typedOver: unmissed }));
/* The essay back to a kept score for the states measured below: excused, then 80 typed into it. */
await focusSelected(A1, S1);
await typeOver(A1, S1, '80');
await sleep(120);

/* ── THE POINTS MODE, ON THE GRID ── the same comparison with the class switched to total points. */
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ doc.classes.forEach(function(c){ if (c.id === '${CLS}') c.gradingMode = 'points'; }); });
  await s.flush(); return 1; })()`);
await openGrid();
const pointsGrades = await grades(S1, {
  blank: { a: A1, s: S1, cell: { v: null, flag: 'excused' } },
  counted: { a: A1, s: S1, cell: { v: 80 } } });
const pointsCell = await cell(A1, S1);
check('WO-3.68: in a points class too, the grid\'s grade with Ada\'s 80 kept on an excused essay is the '
  + 'engine\'s grade for that essay excused with no score — and the 80 counted would differ',
  pointsCell === '{"v":80,"flag":"excused"}' && pointsGrades.mode === 'points'
    && pointsGrades.live === pointsGrades.as.blank && pointsGrades.grid === pointsGrades.liveText
    && pointsGrades.grid !== '' && pointsGrades.as.counted !== pointsGrades.as.blank,
  JSON.stringify({ cell: pointsCell, grades: pointsGrades }));
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ doc.classes.forEach(function(c){ if (c.id === '${CLS}') delete c.gradingMode; }); });
  await s.flush(); return 1; })()`);

/* ── THE STRIKE IN EVERY STATE THIS DESK CAN MEASURE ── the Trap: "do not drop the strike for any
   state, size or mode". Unfocused, under presentation mode, and (below) under a coarse pointer. The
   old-shape excused blank is read beside it each time — no strike, the placeholder showing. */
await openGrid();
await evalJs("(function(){ if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); return 1; })()");
const rest = { essay: await drawn(A1, S1), hw: await drawn(A3, S3), old: await drawn(A1, S3) };
await clickSel('#presentationBtn');
await sleep(250);
const projOn = await evalJs('window.planbook.supports.presentationMode()');
const proj = { essay: await drawn(A1, S1), hw: await drawn(A3, S3), old: await drawn(A1, S3) };
await clickSel('#presentationBtn');
await sleep(250);
const strikeOk = (set) => !!set.essay && !!set.hw && !!set.old
  && struck(set.essay) && set.essay.value === '80' && struck(set.hw) && set.hw.value === '7'
  && !struck(set.old) && set.old.value === '' && set.old.placeholder === 'Ex' && set.old.excused;
check('WO-3.68: with the caret elsewhere, both kept scores (Ada\'s typed 80, Cy\'s planted 7) are struck '
  + 'through and the old-shape excused blank beside them is not; and with presentation mode ON, drawn '
  + 'fresh through the header\'s own control, all three read exactly the same',
  strikeOk(rest) && projOn === true && strikeOk(proj)
    && proj.essay.line === rest.essay.line && proj.hw.thick === rest.hw.thick,
  JSON.stringify({ rest: rest, presenting: projOn, proj: proj }));

/* ── ACCEPTANCE LINE 4: THE READERS ──
   The grade sheet's record and its CSV both come out of markText(); the legend is read off the
   opened dialog. */
const sheet = await evalJs(`(function(){
  var p = window.planbook, rec = p.gradesReport.gradesRecord();
  var ids = rec.assignments.map(function(a){ return a.id; });
  var row = function(id){ var st = rec.students.filter(function(x){ return x.id === id; })[0];
    if (!st) return null; var out = {}; st.cells.forEach(function(m, i){ out[ids[i]] = m.text; }); return out; };
  p.gradesReport.openGrades(null);
  var key = Array.prototype.map.call(document.querySelectorAll('#gradesRecordModal .grades-report-key-item'),
    function(n){ return n.textContent; });
  var printed = Array.prototype.map.call(document.querySelectorAll('#gradesRecordModal .grades-report-mark.excused'),
    function(n){ return n.textContent; });
  p.closeModal('gradesRecordModal');
  return { ids: ids, ada: row('${S1}'), ben: row('${S2}'), cy: row('${S3}'), key: key, printed: printed,
    csv: p.gradesReport.gradesCsv(rec).text }; })()`);
const csvRow = (who) => (sheet.csv.match(new RegExp('"' + who + '"[^\\r\\n]*')) || [''])[0];
/* The CSV row is the record's own texts in the record's own column order — the sheet orders its
   columns, and this check is about what is IN a cell, not where its column falls. */
const csvHas = (who, marks) => !!marks
  && csvRow(who).indexOf('"' + who + '",' + sheet.ids.map((id) => marks[id]).join(',') + ',') === 0;
check('WO-3.68: the grade sheet prints a kept score with the excused mark — `Ex (80)`, `Ex (18)`, '
  + '`Ex (7)` — and an excused blank as the `Ex` it always was, on the printed sheet and in its CSV '
  + 'alike, and the legend says the bracketed score is kept and not counted',
  !!sheet.ada && sheet.ada[A1] === 'Ex (80)' && sheet.ben[A2] === 'Ex (18)' && sheet.ben[A3] === 'Ex'
    && sheet.cy[A1] === 'Ex' && sheet.cy[A3] === 'Ex (7)'
    && csvHas('Apple, Ada', sheet.ada) && csvHas('Birch, Ben', sheet.ben) && csvHas('Cole, Cy', sheet.cy)
    && sheet.printed.indexOf('Ex (80)') !== -1 && sheet.printed.indexOf('Ex (7)') !== -1
    && sheet.key.some((k) => /^Ex excused/.test(k) && /Ex \(62\), is the one it had, kept for your record and not counted/.test(k)),
  JSON.stringify({ ada: sheet.ada, ben: sheet.ben, cy: sheet.cy, rows: [csvRow('Apple, Ada'),
    csvRow('Birch, Ben'), csvRow('Cole, Cy')], printed: sheet.printed, key: sheet.key }));

/* Student detail: the one place it lists an excused piece is the score history card. Ben's quiz was
   18 and was then excused with the 18 kept. And the student CSV, which lists outstanding work and
   never an excused piece, is the same file whether Cy's homework kept its 7 or not — the kept score
   does not leak into the file's figures. */
await clickSel('#scoresBody [data-student-detail="' + S2 + '"]');
await sleep(300);
const ben = await evalJs(`(function(){
  var v = document.getElementById('detailView');
  var row = v.querySelector('[data-score-history-row="${A2}"]');
  return { up: !v.classList.contains('hidden'),
    steps: row ? Array.prototype.map.call(row.querySelectorAll('[data-score-history-step]'),
      function(s){ return s.textContent; }) : [] }; })()`);
check('WO-3.68: student detail\'s score history shows Ben\'s quiz trail ending on the kept score with the '
  + 'excused mark — 18 (Sep 20) → Excused, 18 kept (Oct 1)',
  ben.up && JSON.stringify(ben.steps) === JSON.stringify(['18 (Sep 20)', 'Excused, 18 kept (Oct 1)']),
  JSON.stringify(ben));
await openGrid();
await clickSel('#scoresBody [data-student-detail="' + S3 + '"]');
await sleep(300);
const cyCsv = await evalJs(`(function(){
  var p = window.planbook, s = p.store;
  var a = p.detail.studentCsv(p.detail.detailModel()).text;
  var real = s.getDoc().scores['${A3}']['${S3}'];
  s.getDoc().scores['${A3}']['${S3}'] = { v:null, flag:'excused' };
  var b = p.detail.studentCsv(p.detail.detailModel()).text;
  s.getDoc().scores['${A3}']['${S3}'] = real;
  return { same: a === b, len: a.length, ex: a.indexOf('Ex (') !== -1, homework: a.indexOf('WO-3.68 Homework') !== -1,
    restored: JSON.stringify(s.getDoc().scores['${A3}']['${S3}']) }; })()`);
check('WO-3.68: the student report\'s CSV is byte-identical whether Cy\'s excused homework kept its 7 or '
  + 'not — it lists outstanding work and no excused piece, so the kept score never reaches its figures',
  cyCsv.same && cyCsv.len > 50 && !cyCsv.ex && !cyCsv.homework && /"v":7,"flag":"excused"/.test(cyCsv.restored),
  JSON.stringify(cyCsv));

/* ── ACCEPTANCE LINE 6: THE PAST-DUE PROMPT ──
   The homework was due in 2020. Ada's cell is a true blank; Ben's is an excused blank; Cy's is excused
   with a kept 7. The review lists exactly one cell, and accepting writes exactly one. */
await openGrid();
const pdBefore = await evalJs(`(function(){
  var host = document.getElementById('scoresPastDue');
  return { up: !!host && !host.classList.contains('hidden'),
    lead: host ? ((host.querySelector('.past-due-lead') || {}).textContent || '') : '' }; })()`);
await clickSel('#scoresPastDue [data-past-due-review]');
await sleep(200);
const pdChips = await evalJs(`(function(){
  return Array.prototype.map.call(document.querySelectorAll('#scoresPastDue [data-past-due-cell]'),
    function(c){ return c.getAttribute('data-past-due-cell'); }); })()`);
await clickSel('#scoresPastDue [data-past-due-accept]');
await sleep(300);
const pdAfter = { ada: await cell(A3, S1), ben: await cell(A3, S2), cy: await cell(A3, S3) };
check('WO-3.68: the past-due prompt never sweeps an excused cell, with or without a kept score — over '
  + 'homework due in 2020 it offers one blank (Ada\'s), its review lists only her cell, and accepting '
  + 'marks her missing and leaves Ben\'s excused blank and Cy\'s excused 7 exactly as they were',
  pdBefore.up && /^1 blank is past due/.test(pdBefore.lead)
    && JSON.stringify(pdChips) === JSON.stringify([A3 + '/' + S1])
    && pdAfter.ada === '{"v":null,"flag":"missing"}' && pdAfter.ben === '{"v":null,"flag":"excused"}'
    && pdAfter.cy === '{"v":7,"flag":"excused"}',
  JSON.stringify({ before: pdBefore, chips: pdChips, after: pdAfter }));

/* ── ACCEPTANCE LINE 5: A BACKUP HOLDING THE OLD SHAPE ──
   This run's own year, written by the backup module, carries Cy's essay and Ben's homework as
   `{ v: null, flag: 'excused' }`. It parses back with both cells as written, restores through the real
   confirm, and the grid draws both exactly as an excused blank has always drawn. */
const files = await evalJs(`(async function(){
  var b = window.planbook.backup;
  var built = await b.buildBackup();
  var raw = JSON.parse(built.text);
  var parsed = b.parseBackup(built.text, 'wo368.json').doc;
  var strip = function(c){ c = JSON.parse(JSON.stringify(c)); delete c.at; delete c.was; return JSON.stringify(c); };
  return { text: built.text,
    inFile: [strip(raw.scores['${A1}']['${S3}']), strip(raw.scores['${A3}']['${S2}'])],
    parsed: [strip(parsed.scores['${A1}']['${S3}']), strip(parsed.scores['${A3}']['${S2}'])] }; })()`);
await evalJs(`(async function(){
  await window.planbook.backup.restoreFromText(${JSON.stringify(files.text)}, 'Planbook wo368.json'); return 1; })()`);
await clickSel('[data-backup-confirm]');
await sleep(600);
const onDisk = await evalJs(`(async function(){ var s = window.planbook.store;
  var year = s.getDoc().year;
  var stored = await new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){ var db = open.result;
      var q = db.transaction('years','readonly').objectStore('years').get(year);
      q.onsuccess = function(){ res(q.result); db.close(); };
      q.onerror = function(){ rej(q.error); }; }; });
  var strip = function(c){ c = JSON.parse(JSON.stringify(c)); delete c.at; delete c.was; return JSON.stringify(c); };
  return [strip(stored.scores['${A1}']['${S3}']), strip(stored.scores['${A3}']['${S2}'])]; })()`);
await evalJs(`(function(){ var c = window.planbook.classes; c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar(); return 1; })()`);
await openGrid();
const oldDrawn = { essay: await drawn(A1, S3), hw: await drawn(A3, S2), kept: await drawn(A3, S3) };
const OLD = '{"v":null,"flag":"excused"}';
const asBefore = (d) => !!d && d.value === '' && d.placeholder === 'Ex' && d.excused && d.glyph === 'X'
  && !struck(d) && / — excused$/.test(d.label);
check('WO-3.68: a backup holding `{ v: null, flag: \'excused\' }` cells restores and draws them as before — '
  + 'both old-shape cells are in the file, parse back and land on disk through the real confirm '
  + 'unchanged, and each draws empty with the Ex placeholder, the X glyph, no strike and "— excused"; the '
  + 'kept 7 beside them is still struck',
  JSON.stringify(files.inFile) === JSON.stringify([OLD, OLD]) && JSON.stringify(files.parsed) === JSON.stringify([OLD, OLD])
    && JSON.stringify(onDisk) === JSON.stringify([OLD, OLD])
    && asBefore(oldDrawn.essay) && asBefore(oldDrawn.hw) && struck(oldDrawn.kept) && oldDrawn.kept.value === '7',
  JSON.stringify({ inFile: files.inFile, parsed: files.parsed, onDisk: onDisk, drawn: oldDrawn }));

/* ── THE STRIKE UNDER A COARSE POINTER ── the size the app is used at. The coarse assertion gates the
   measurement for the reason tools/README.md trap 3 gives. */
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
const big = { essay: await drawn(A1, S1), hw: await drawn(A3, S3), old: await drawn(A1, S3),
  h: await evalJs('(function(){ var i = document.querySelector(' + JSON.stringify(cellSel(A3, S3))
    + '); return i ? i.getBoundingClientRect().height : 0; })()') };
if (!coarse) {
  check('WO-3.68: the strike survives a coarse pointer', false,
    'the emulated pointer is not coarse, so nothing below it was measured (tools/README.md trap 3)');
} else {
  check('WO-3.68: under an emulated coarse pointer — the 44px cell the iPad draws — both kept scores are '
    + 'still struck through and the old-shape excused blank still is not',
    big.h >= 44 && strikeOk(big), JSON.stringify(big));
}

/* ── THE FIXTURE COMES BACK OUT, by id, and the page is handed back ── */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo368-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a368-') === 0) delete doc.scores[k]; });
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
    scores: Object.keys(d.scores || {}).filter(function(k){ return String(k).indexOf('a368-') === 0; }).length,
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.68 fixture came back off the document, and presentation mode was left as it was found',
  gone.classes === 0 && gone.work === 0 && gone.scores === 0 && gone.mode === !!plant.mode,
  JSON.stringify(gone));
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
