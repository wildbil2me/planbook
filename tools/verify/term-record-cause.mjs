/* term-record-cause.mjs — the notice says which score changed (WO-3.75)
 *
 * The Record dialog's changed form gains *What changed*: for each changed student, every score cell of
 * the quarter written since the recording, from what it held at the recording to what it holds now —
 * or, when no score of theirs moved, one line saying a class setting did. src/term-record.js's
 * whatChanged() is the reader; src/score-history.js's scoreChangeSince() is the only code that reads a
 * cell's past to answer it.
 *
 * EVERY CELL IS BUILT BY THE APP'S OWN RULE, ON A CLOCK THIS SECTION NAMES. The fixture's histories
 * need writes days and minutes apart, so each cell is written by reviseCell() — the rule every score
 * write in the app goes through — handed an explicit Date, imported from the page's own module graph
 * (tools/verify/held-readers.mjs's door) so it is the same module instance the app runs. The recording
 * is the writer's own list (gradesToRecord()) taken at the before-state and stamped at R, a moment two
 * days back, by the log's own localStamp(). Nothing in src/ can tell these cells from a teacher's.
 *
 * THE FIXTURE. One weighted class, Exams 50 / Projects 50, scale A 90 · B 80 · C 70 · D 60 · F 0, one
 * term, three columns of 10 points: E1 *Act 2 quiz* (Exams), P1 *Essay 1* (Projects), H1 *Vocab 4*
 * (Exams, HELD since R − 30 days). Grid order is by surname, A to E:
 *
 *            before the recording (R)              after it
 *   Avery    E1 4 (R−20d) · P1 Missing (R−20d)     E1 9 (R+1h) · P1 8 (R+1h) · H1 7 (R+1h, held)
 *   Brook    E1 4 (R−20d) · P1 10 (R−20d)          E1 7 (R+1h) · E1 9 (R+3h)        two edits
 *   Cole     E1 9 (R−20d) · P1 5 (R−20d)           nothing                          a setting only
 *   Dunn     E1 5 (R−20d) · E1 6 (R−1min)          E1 8 (R+2min)                     straddles R
 *   Ellis    E1 4 (R−20d) · P1 10 (R−20d)          E1 9 (R+1h) · E1 4 (R+2h)        ends where it began
 *
 *   and, after every score, Exams 70 / Projects 30 — so every student's grade moves, and Cole's and
 *   Ellis's move through the weights alone.
 *
 *   Avery  20.00 F → 87.00 B · Brook 70.00 C → 93.00 A · Cole 70.00 C → 78.00 C
 *   Dunn   60.00 D → 80.00 B · Ellis 70.00 C → 58.00 F     (Projects empty for Dunn: redistributed)
 *
 * WHAT EACH ROW IS FOR. Avery: a score and a flag that moved, with the assignment and the category
 * (Acceptance 1), and a held column written since that is not listed (trap 5). Brook: two edits since,
 * one line from the recorded 4 to the latest 9 — not 7 → 9, the version before the newest (Acceptance
 * 2, the work order's Traps). Cole: the setting line (Acceptance 3). Dunn: the write at R+2min replaced
 * the one at R−1min inside the five minutes, so nothing the recording saw survives — and the version
 * before it on the trail, 5, is NOT what the recording saw: the line says the value then is not known
 * and shows no number for it (trap 3). Ellis: 4 → 9 → 4, so no score of hers differs and she gets the
 * setting line (trap 4). Two stamps either side of the end of daylight saving are compared as instants
 * (trap 2), through scoreChangeSince() asked directly.
 *
 * It plants one class through the store, turns presentation mode on once and puts it back as it found
 * it, takes the class and its records back out with the `termRecords` key as it found it, and hands
 * the page back reloaded. No viewport change.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, send } = h;

console.log('\n--- The notice says which score changed (WO-3.75) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.termRecord"
  + " && window.planbook.termRecord.whatChanged && window.planbook.termRecordView"
  + " && window.planbook.gradeEngine && window.planbook.supports"
  + " && document.getElementById('termRecordCauses'))"))) {
  skip('The notice says which score changed (WO-3.75)', 'window.planbook is missing termRecord, '
    + 'termRecord.whatChanged, termRecordView, gradeEngine or supports, or #termRecordCauses is not in '
    + 'the page');
  return;
}

const CLS = 'c_wo375', Q1 = 'tm375q1', KE = 'k375e', KP = 'k375p';
const S = { avery: 'wo375-avery', brook: 'wo375-brook', cole: 'wo375-cole', dunn: 'wo375-dunn',
  ellis: 'wo375-ellis' };
const A = { e1: 'a375-e1', p1: 'a375-p1', h1: 'a375-h1' };
const SCALE = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 },
  { letter: 'D', min: 60 }, { letter: 'F', min: 0 }];
const SETTING = 'No score changed; a class setting did — weights, the letter scale or drop lowest.';
const D = (n) => nodeDaysFromToday(n);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* What the open dialog's *What changed* box shows, read off the DOM, beside the list's own order. */
const causesNow = () => evalJs(`(function(){
  var vis = function(id){ var e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  var box = document.getElementById('termRecordCauses');
  return { open: !document.getElementById('termRecordModal').classList.contains('hidden'),
    refused: vis('termRecordRefused'),
    label: vis('termRecordCauseLabel') ? document.getElementById('termRecordCauseLabel').textContent : null,
    shown: vis('termRecordCauses'), children: box.children.length,
    listOrder: Array.prototype.map.call(document.querySelectorAll('#termRecordList [data-term-record-row]'),
      function(n){ return n.getAttribute('data-term-record-row'); }),
    rows: Array.prototype.map.call(box.querySelectorAll('[data-term-record-cause]'), function(r){
      var name = r.querySelector('.term-record-name');
      return { id: r.getAttribute('data-term-record-cause'), name: name ? name.textContent : '',
        lines: Array.prototype.map.call(r.querySelectorAll('[data-term-record-cause-line]'), function(l){
          return [l.getAttribute('data-term-record-cause-line'), l.textContent]; }),
        cols: getComputedStyle(r).gridTemplateColumns }; }),
    text: (box.textContent || '') }; })()`);
const closeDialog = async () => {
  if (await evalJs("!document.getElementById('termRecordModal').classList.contains('hidden')")) {
    await clickSel('#termRecordKeep');
    await sleep(150);
  }
};

/* ── THE FIXTURE ── */
const plant = await evalJs(`(async function(){
  var s = window.planbook.store, d0 = s.getDoc();
  if (!d0) return { ok: false, why: 'no year document is open' };
  var sh = await import(new URL('src/score-history.js', document.baseURI).href);
  var lg = await import(new URL('src/log.js', document.baseURI).href);
  var had = Object.prototype.hasOwnProperty.call(d0, 'termRecords');
  var was = { mode: window.planbook.supports.presentationMode() };
  window.planbook.supports.setPresentationMode(false);
  var MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  var R = new Date(Math.floor((Date.now() - 2 * DAY) / 1000) * 1000);
  var at = function(ms){ return new Date(R.getTime() + ms); };
  var HELD_AT = lg.localStamp(at(-30 * DAY));
  /* One cell, written by the app's rule at each (value, moment) in turn; a flag is { v, flag }. */
  var write = function(cell, steps, column){
    steps.forEach(function(step){
      var want = typeof step[0] === 'object' ? step[0] : { v: step[0] };
      var r = sh.reviseCell(cell, want, at(step[1]), column);
      if (r.write) cell = r.cell;
    });
    return cell;
  };
  s.update(function(doc){
    doc.students.push({ id: '${S.avery}', first: 'Ada', last: 'Avery375' },
      { id: '${S.brook}', first: 'Ben', last: 'Brook375' }, { id: '${S.cole}', first: 'Cy', last: 'Cole375' },
      { id: '${S.dunn}', first: 'Di', last: 'Dunn375' }, { id: '${S.ellis}', first: 'Eve', last: 'Ellis375' });
    doc.classes.push({ id: '${CLS}', name: 'WO-3.75 Causes', archived: false,
      letterScale: ${JSON.stringify(SCALE)},
      terms: [{ id: '${Q1}', label: 'Quarter 1', start: '${D(-40)}', end: '${D(60)}' }],
      categories: [{ id: '${KE}', name: 'Exams', weight: 50 }, { id: '${KP}', name: 'Projects', weight: 50 }],
      roster: ['${S.ellis}', '${S.cole}', '${S.avery}', '${S.dunn}', '${S.brook}'] });
    var add = function(id, cat, name, extra){
      doc.assignments.push(Object.assign({ id: id, classId: '${CLS}', termId: '${Q1}', categoryId: cat,
        name: name, points: 10, assigned: '${D(-30)}', due: '${D(-25)}' }, extra || {}));
    };
    add('${A.e1}', '${KE}', 'Act 2 quiz');
    add('${A.p1}', '${KP}', 'Essay 1');
    add('${A.h1}', '${KE}', 'Vocab 4', { held: true, heldAt: HELD_AT });
    doc.scores['${A.e1}'] = {};
    doc.scores['${A.p1}'] = {};
    doc.scores['${A.h1}'] = {};
  });
  var BEFORE = [
    ['${A.e1}', '${S.avery}', [[4, -20 * DAY]]], ['${A.p1}', '${S.avery}', [[{ v: null, flag: 'missing' }, -20 * DAY]]],
    ['${A.e1}', '${S.brook}', [[4, -20 * DAY]]], ['${A.p1}', '${S.brook}', [[10, -20 * DAY]]],
    ['${A.e1}', '${S.cole}', [[9, -20 * DAY]]], ['${A.p1}', '${S.cole}', [[5, -20 * DAY]]],
    ['${A.e1}', '${S.dunn}', [[5, -20 * DAY], [6, -1 * MIN]]],
    ['${A.e1}', '${S.ellis}', [[4, -20 * DAY]]], ['${A.p1}', '${S.ellis}', [[10, -20 * DAY]]]];
  var AFTER = [
    ['${A.e1}', '${S.avery}', [[9, HOUR]]], ['${A.p1}', '${S.avery}', [[8, HOUR]]],
    ['${A.e1}', '${S.brook}', [[7, HOUR], [9, 3 * HOUR]]],
    ['${A.e1}', '${S.dunn}', [[8, 2 * MIN]]],
    ['${A.e1}', '${S.ellis}', [[9, HOUR], [4, 2 * HOUR]]]];
  var apply = function(list){
    s.update(function(doc){
      list.forEach(function(row){
        doc.scores[row[0]][row[1]] = write(doc.scores[row[0]][row[1]] || null, row[2]);
      });
    });
  };
  apply(BEFORE);
  var cls = s.getDoc().classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var recorded = window.planbook.termRecord.gradesToRecord(s.getDoc(), cls, '${Q1}');
  s.update(function(doc){
    if (!Array.isArray(doc.termRecords)) doc.termRecords = [];
    doc.termRecords.push({ id: 'tr375', classId: '${CLS}', termId: '${Q1}', at: lg.localStamp(R),
      grades: recorded });
  });
  apply(AFTER);
  /* The held column, written since the recording, by the rule as a held column's writer calls it. */
  s.update(function(doc){
    doc.scores['${A.h1}']['${S.avery}'] = write(null, [[7, HOUR]], { held: true, heldAt: HELD_AT });
  });
  s.update(function(doc){
    var c = doc.classes.filter(function(x){ return x.id === '${CLS}'; })[0];
    c.categories[0].weight = 70; c.categories[1].weight = 30;
  });
  await s.flush();
  var d = s.getDoc();
  var live = function(id){ var g = window.planbook.gradeEngine.classGrade(d,
    d.classes.filter(function(c){ return c.id === '${CLS}'; })[0], '${Q1}', id);
    return g.percentage === null ? null : g.percentage.toFixed(2) + ' ' + g.letter; };
  var shape = function(a, id){ return JSON.stringify(d.scores[a][id]); };
  return { ok: true, had: had, was: was, R: lg.localStamp(R),
    recorded: recorded.map(function(g){ return g.studentId.slice(6) + '=' + g.percentage.toFixed(2) + ' ' + g.letter; }),
    live: ['${S.avery}', '${S.brook}', '${S.cole}', '${S.dunn}', '${S.ellis}'].map(function(id){ return id.slice(6) + '=' + live(id); }),
    brook: shape('${A.e1}', '${S.brook}'), dunn: shape('${A.e1}', '${S.dunn}'),
    ellis: shape('${A.e1}', '${S.ellis}'), held: shape('${A.h1}', '${S.avery}') }; })()`);

try {
const RECORDED = ['avery=20.00 F', 'brook=70.00 C', 'cole=70.00 C', 'dunn=60.00 D', 'ellis=70.00 C'];
const LIVE = ['avery=87.00 B', 'brook=93.00 A', 'cole=78.00 C', 'dunn=80.00 B', 'ellis=58.00 F'];
const real = plant.ok
  && JSON.stringify(plant.recorded.slice().sort()) === JSON.stringify(RECORDED)
  && JSON.stringify(plant.live) === JSON.stringify(LIVE)
  /* The histories the rule wrote are the ones the table says: Brook's 4 and 7 on the trail, Dunn's
     5 alone (the 6 replaced inside the five minutes), Ellis's back at 4 with 4 and 9 behind it, and
     the held cell stamped after R with no trail at all. */
  && /"v":9/.test(plant.brook) && /"v":4/.test(plant.brook) && /"v":7/.test(plant.brook)
  && /^\{"v":8,/.test(plant.dunn) && /"v":5/.test(plant.dunn) && !/"v":6/.test(plant.dunn)
  && /^\{"v":4,/.test(plant.ellis) && /"v":9/.test(plant.ellis)
  && /^\{"v":7,"at":"[^"]+"\}$/.test(plant.held);
if (!real) {
  check('WO-3.75: the fixture is real — the recording holds the hand table\'s grades, every live grade '
    + 'is the table\'s, and each history is the one the rule wrote', false, JSON.stringify(plant));
} else {

/* ── ACCEPTANCE 1, 2 AND 3, and traps 3, 4 and 5 — one opening of the changed form ── */
await evalJs(`(function(){ window.planbook.termRecordView.openTermRecordDialog('${CLS}', '${Q1}', null); return 1; })()`);
await sleep(200);
const seen = await causesNow();
const byId = {};
seen.rows.forEach((r) => { byId[r.id] = r; });
const lines = (key) => (byId[S[key]] ? byId[S[key]].lines : null);
const engine = await evalJs(`(function(){ var s = window.planbook.store, d = s.getDoc();
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  return window.planbook.termRecord.whatChanged(d, cls, '${Q1}'); })()`);
const engineOf = (key) => (engine || []).filter((r) => r.studentId === S[key])[0];

check('WO-3.75: a score changed after a recording appears under *What changed* with the assignment, its '
  + 'category, and the value at recording beside the value now — Avery375\'s Act 2 quiz (Exams) 4 → 9 '
  + 'of 10 and Essay 1 (Projects) Missing → 8 of 10, under the label *What changed*, one row per changed '
  + 'student in the list\'s own grade-sheet order, the drawing\'s two-column grid',
  seen.open && seen.label === 'What changed' && seen.shown
    && JSON.stringify(seen.rows.map((r) => r.id)) === JSON.stringify(seen.listOrder)
    && JSON.stringify(seen.listOrder) === JSON.stringify([S.avery, S.brook, S.cole, S.dunn, S.ellis])
    && byId[S.avery] && byId[S.avery].name === 'Avery375, Ada'
    && JSON.stringify(lines('avery')) === JSON.stringify([
      ['score', 'Act 2 quiz (Exams): 4 → 9 of 10'], ['score', 'Essay 1 (Projects): Missing → 8 of 10']])
    && JSON.stringify(engineOf('avery').scores.map((l) => [l.name, l.category, l.then, l.now]))
      === JSON.stringify([['Act 2 quiz', 'Exams', { v: 4, flag: '' }, { v: 9, flag: '' }],
        ['Essay 1', 'Projects', { v: null, flag: 'missing' }, { v: 8, flag: '' }]])
    && / /.test(byId[S.avery].cols),
  JSON.stringify({ seen: seen, avery: engineOf('avery') }));

check('WO-3.75: two edits to one cell after a recording show one line, from the recorded value to the '
  + 'latest — Brook375\'s Act 2 quiz written 7 at R+1h and 9 at R+3h reads *4 → 9 of 10*, once: the '
  + 'value at the recording is the latest version at or before it (4), not the version before the '
  + 'newest (7)',
  JSON.stringify(lines('brook')) === JSON.stringify([['score', 'Act 2 quiz (Exams): 4 → 9 of 10']]),
  JSON.stringify({ brook: lines('brook'), engine: engineOf('brook'), cell: plant.brook }));

check('WO-3.75: a student whose grade moved only through a class setting gets the setting line — '
  + 'Cole375, 70.00 C → 78.00 C on the weights alone, reads exactly *' + SETTING + '* and nothing else',
  JSON.stringify(lines('cole')) === JSON.stringify([['setting', SETTING]])
    && engineOf('cole') && engineOf('cole').scores.length === 0,
  JSON.stringify({ cole: lines('cole'), engine: engineOf('cole') }));

check('WO-3.75 (trap 3): a write inside the five minutes either side of the recording leaves no version '
  + 'the recording saw, and the line says so rather than inventing one — Dunn375\'s 6 at R−1min was '
  + 'replaced by 8 at R+2min, the 5 from twenty days before is still on the trail, and the line reads '
  + '*now 8 of 10 — what it held when you recorded is not known*, with no *5 →* and no *6 →*',
  JSON.stringify(lines('dunn')) === JSON.stringify([['score',
    'Act 2 quiz (Exams): now 8 of 10 — what it held when you recorded is not known']])
    && engineOf('dunn') && engineOf('dunn').scores.length === 1 && engineOf('dunn').scores[0].then === null
    && seen.text.indexOf('5 →') === -1 && seen.text.indexOf('6 →') === -1,
  JSON.stringify({ dunn: lines('dunn'), engine: engineOf('dunn'), cell: plant.dunn }));

check('WO-3.75 (trap 4): a cell that ends where it began is not a change — Ellis375\'s Act 2 quiz went '
  + '4 → 9 → 4 after the recording, more than five minutes apart, so it gets no line, and with no other '
  + 'score of hers moved she gets the setting line',
  JSON.stringify(lines('ellis')) === JSON.stringify([['setting', SETTING]]),
  JSON.stringify({ ellis: lines('ellis'), engine: engineOf('ellis'), cell: plant.ellis }));

check('WO-3.75 (trap 5): a held column is never under *What changed* — Avery375\'s Vocab 4 (Exams, held) '
  + 'was written at R+1h, after the recording, and counts toward neither grade, so neither the box nor '
  + 'the reader names it',
  seen.text.indexOf('Vocab 4') === -1
    && !(engine || []).some((r) => r.scores.some((l) => l.assignmentId === A.h1)),
  JSON.stringify({ held: plant.held, text: seen.text }));
await closeDialog();

/* ── trap 2: instants, not strings ──
   US daylight saving ends 2026-11-01 at 02:00 EDT, so 01:30-04:00 (05:30Z) is EARLIER than
   01:10-05:00 (06:10Z) although it sorts later as a string. Asked of scoreChangeSince() directly, on
   hand-written stamps, both ways round. */
const dst = await evalJs(`(async function(){
  var sh = await import(new URL('src/score-history.js', document.baseURI).href);
  var cell = function(at){ return { v: 9, at: at, was: [{ v: 4, at: '2026-10-20T10:00:00-04:00' }] }; };
  return { after: sh.scoreChangeSince(cell('2026-11-01T01:10:00-05:00'), '2026-11-01T01:30:00-04:00'),
    before: sh.scoreChangeSince(cell('2026-11-01T01:30:00-04:00'), '2026-11-01T01:10:00-05:00') }; })()`);
check('WO-3.75 (trap 2): stamps are compared as instants, not strings — a cell written at 01:10-05:00 '
  + 'after a recording at 01:30-04:00 (40 minutes later, though it sorts earlier) reads 4 → 9, and a cell '
  + 'written at 01:30-04:00 before a recording at 01:10-05:00 reads as unwritten since',
  JSON.stringify(dst.after) === JSON.stringify({ then: { v: 4, flag: '' }, now: { v: 9, flag: '' } })
    && dst.before === null,
  JSON.stringify(dst));

/* ── under a projector the dialog refuses, and the box is emptied with the list ── */
await evalJs(`(function(){ window.planbook.supports.setPresentationMode(true);
  window.planbook.termRecordView.openTermRecordDialog('${CLS}', '${Q1}', null); return 1; })()`);
await sleep(200);
const proj = await causesNow();
await closeDialog();
await evalJs('(function(){ window.planbook.supports.setPresentationMode(false); return 1; })()');
check('WO-3.75: in presentation mode the dialog refuses and *What changed* is neither drawn nor built — '
  + 'its label hidden, its box hidden and empty, no student\'s name in it',
  proj.open && proj.refused && proj.label === null && !proj.shown && proj.children === 0
    && proj.text === '',
  JSON.stringify(proj));

/* ── recording again: the first form carries no *What changed* ── */
await evalJs(`(function(){ window.planbook.termRecordView.openTermRecordDialog('${CLS}', '${Q1}', null); return 1; })()`);
await sleep(200);
await clickSel('#termRecordBtn');
await sleep(250);
await evalJs(`(function(){ window.planbook.termRecordView.openTermRecordDialog('${CLS}', '${Q1}', null); return 1; })()`);
await sleep(200);
const first = await causesNow();
await closeDialog();
check('WO-3.75: once the quarter is recorded again and matches, the dialog opens in its first form and '
  + '*What changed* is gone — label hidden, box hidden and empty',
  first.open && !first.refused && first.label === null && !first.shown && first.children === 0,
  JSON.stringify(first));
}
} finally {
/* ── THE FIXTURE COMES BACK OUT ── */
await closeDialog();
await evalJs(`(async function(){
  var s = window.planbook.store;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo375-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a375-') === 0) delete doc.scores[k]; });
    if (${plant && plant.had ? 'true' : 'false'}) {
      doc.termRecords = (doc.termRecords || []).filter(function(e){ return e.classId !== '${CLS}'; });
    } else {
      delete doc.termRecords;
    }
  });
  window.planbook.supports.setPresentationMode(${plant && plant.was && plant.was.mode ? 'true' : 'false'});
  await s.flush();
  return 1; })()`);
}
const cleared = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { classes: d.classes.filter(function(x){ return x.id === '${CLS}'; }).length,
    students: d.students.filter(function(x){ return String(x.id).indexOf('wo375-') === 0; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${CLS}'; }).length,
    scores: Object.keys(d.scores || {}).filter(function(k){ return k.indexOf('a375-') === 0; }).length,
    records: Object.prototype.hasOwnProperty.call(d, 'termRecords'),
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.75 fixture came back off the document, the termRecords key is as it was found, and '
  + 'presentation mode is where it was found',
  cleared.classes === 0 && cleared.students === 0 && cleared.work === 0 && cleared.scores === 0
    && cleared.records === !!(plant && plant.had) && cleared.mode === !!(plant && plant.was && plant.was.mode),
  JSON.stringify(cleared) + ' · had the key at the start: ' + !!(plant && plant.had));
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
