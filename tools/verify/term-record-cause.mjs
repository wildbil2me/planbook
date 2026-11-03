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
 * 2, the work order's Traps). Cole: the setting line (Acceptance 3). Dunn: written with no column
 * descriptor, as an EARLIER BUILD wrote — the write at R+2min replaced the one at R−1min inside the five
 * minutes, so nothing the recording saw survives. WO-3.75 read that as *not known* (its trap 3); since
 * WO-3.79 the reader trusts the trail across a recording, and Dunn is the one cell shape where that
 * names the wrong *then* — 5 → 8, where the recording saw 6 — pinned as the earlier-build limit
 * WO-3.79's Traps accept. Ellis: 4 → 9 → 4, so no score of hers differs and she gets the
 * setting line (trap 4). Two stamps either side of the end of daylight saving are compared as instants
 * (trap 2), through scoreChangeSince() asked directly.
 *
 * WO-3.79 adds a second class at the foot, planted after the first is gone: the setting line's new
 * wording for a grade moved only by a deleted assignment, a typo fixed a minute after recording that
 * reads *4 → 9* because a recording is now a version boundary, the same edit over a 4 typed weeks
 * before it reading *4 → 9* too because the reader trusts the trail across a recording, and
 * newestRecord() on instants across the end of daylight saving. Its own table is at its own block. A
 * third class after it puts the past-due sweep through the same seal.
 *
 * It plants one class through the store, turns presentation mode on once and puts it back as it found
 * it, takes the class and its records back out with the `termRecords` key as it found it, and hands
 * the page back reloaded. No viewport change.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, KILL_ANIM, INSTALL_WALKER, mustBoot, send } = h;

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
/* The owner's wording since WO-3.79 — an equality everywhere it is read, never a substring, so a line
   that names too few causes again goes red here. */
const SETTING = 'No score changed. Something else did — weights, the letter scale, drop lowest, '
  + 'or an assignment\'s points, category or term, or one held or deleted.';
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

check('WO-3.79 (Acceptance 3, the earlier-build limit the Traps accept): Dunn375 (an earlier build\'s 6 '
  + 'at R−1min swallowed by 8 at R+2min) reads *5 → 8 of 10* — the reader trusts the trail across a '
  + 'recording, the 5 from twenty days before is the latest version at or before it, and the 6 the '
  + 'recording saw is gone because the build that wrote this cell had no seal. Pinned as the known limit '
  + '(Record shipped 2026-10-29, WO-3.73), not deleted: no *6 →* and no *not known*',
  JSON.stringify(lines('dunn')) === JSON.stringify([['score', 'Act 2 quiz (Exams): 5 → 8 of 10']])
    && engineOf('dunn') && engineOf('dunn').scores.length === 1
    && JSON.stringify(engineOf('dunn').scores[0].then) === JSON.stringify({ v: 5, flag: '' })
    && seen.text.indexOf('6 →') === -1 && seen.text.indexOf('not known') === -1,
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

/* ══ WO-3.79 — *What changed* names the cause honestly, and a recording closes the edit window ══
 *
 * A SECOND CLASS, planted after the first is gone, so WO-3.75's hand table above stays exactly as it
 * was argued. Same scale, Exams 50 / Projects 50, one term, three columns of 10: E1 *Act 2 quiz*
 * (Exams), P1 *Essay 2* (Projects), P2 *Draft* (Projects, DELETED after the recording). Every cell is
 * written by reviseCell() on a named clock, and every write after the recording is handed the
 * descriptor the two score writers build — `classId`, `termId` and the document's own `termRecords` —
 * so the seal is the app's, not the fixture's:
 *
 *            before the recording (R)              after it
 *   Fenn     E1 8 (R−20d) · P2 2 (R−20d)           P2 deleted, column and all     moved only by that
 *   Gale     E1 4 (R−2min) · P1 10 (R−20d)         E1 9 (R+1min)                  Acceptance 2
 *   Hale     E1 4 (R−20d) · P1 10 (R−20d)          E1 9 (R+1min)                  Acceptance 2 too
 *
 *   Fenn 50.00 F → 80.00 B (Projects empty once P2 is gone: redistributed) · Gale 70.00 C → 95.00 A
 *   · Hale 70.00 C → 95.00 A. Nothing else changes: no weight, no scale, no drop.
 *
 * Gale is the typo fixed a minute after recording: without the seal, the 9 at R+1min lands inside the
 * five minutes of the 4 at R−2min and replaces it, and the trail would hold nothing the recording saw.
 * Hale is the same edit over a 4 typed twenty days before: the five-minute rule pushes that 4 with or
 * without the seal, and the cell is byte for byte what an earlier build left when it swallowed a write
 * inside the window (Dunn375, above). WO-3.75 read both as *not known*; the owner's ruling of 2026-10-31
 * is that the reader trusts the trail across a recording, so Hale reads *4 → 9* and Dunn names the
 * earlier-build limit the Traps accept (src/score-history.js says why above scoreChangeSince()). */
{
const C9 = 'c_wo379', T9 = 'tm379q1', K9E = 'k379e', K9P = 'k379p';
const S9 = { fenn: 'wo379-fenn', gale: 'wo379-gale', hale: 'wo379-hale' };
const A9 = { e1: 'a379-e1', p1: 'a379-p1', p2: 'a379-p2' };
const plant9 = await evalJs(`(async function(){
  var s = window.planbook.store, d0 = s.getDoc();
  if (!d0) return { ok: false, why: 'no year document is open' };
  var sh = await import(new URL('src/score-history.js', document.baseURI).href);
  var lg = await import(new URL('src/log.js', document.baseURI).href);
  var had = Object.prototype.hasOwnProperty.call(d0, 'termRecords');
  var was = { mode: window.planbook.supports.presentationMode() };
  window.planbook.supports.setPresentationMode(false);
  var MIN = 60 * 1000, DAY = 24 * 60 * MIN;
  var R = new Date(Math.floor((Date.now() - 2 * DAY) / 1000) * 1000);
  var at = function(ms){ return new Date(R.getTime() + ms); };
  /* The descriptor src/scores.js's putCell() builds, from the document as it stands at the write. */
  var column = function(doc){ return { held: false, classId: '${C9}', termId: '${T9}', records: doc.termRecords }; };
  s.update(function(doc){
    doc.students.push({ id: '${S9.fenn}', first: 'Flo', last: 'Fenn379' },
      { id: '${S9.gale}', first: 'Gus', last: 'Gale379' }, { id: '${S9.hale}', first: 'Hal', last: 'Hale379' });
    doc.classes.push({ id: '${C9}', name: 'WO-3.79 Seal', archived: false,
      letterScale: ${JSON.stringify(SCALE)},
      terms: [{ id: '${T9}', label: 'Quarter 1', start: '${D(-40)}', end: '${D(60)}' }],
      categories: [{ id: '${K9E}', name: 'Exams', weight: 50 }, { id: '${K9P}', name: 'Projects', weight: 50 }],
      roster: ['${S9.hale}', '${S9.fenn}', '${S9.gale}'] });
    var add = function(id, cat, name){
      doc.assignments.push({ id: id, classId: '${C9}', termId: '${T9}', categoryId: cat, name: name,
        points: 10, assigned: '${D(-30)}', due: '${D(-25)}' });
    };
    add('${A9.e1}', '${K9E}', 'Act 2 quiz');
    add('${A9.p1}', '${K9P}', 'Essay 2');
    add('${A9.p2}', '${K9P}', 'Draft');
    doc.scores['${A9.e1}'] = {}; doc.scores['${A9.p1}'] = {}; doc.scores['${A9.p2}'] = {};
    var put = function(a, id, v, ms){
      var r = sh.reviseCell(doc.scores[a][id] || null, { v: v }, at(ms), column(doc));
      if (r.write) doc.scores[a][id] = r.cell;
    };
    put('${A9.e1}', '${S9.fenn}', 8, -20 * DAY); put('${A9.p2}', '${S9.fenn}', 2, -20 * DAY);
    put('${A9.e1}', '${S9.gale}', 4, -2 * MIN); put('${A9.p1}', '${S9.gale}', 10, -20 * DAY);
    put('${A9.e1}', '${S9.hale}', 4, -20 * DAY); put('${A9.p1}', '${S9.hale}', 10, -20 * DAY);
  });
  var cls = s.getDoc().classes.filter(function(c){ return c.id === '${C9}'; })[0];
  var recorded = window.planbook.termRecord.gradesToRecord(s.getDoc(), cls, '${T9}');
  s.update(function(doc){
    if (!Array.isArray(doc.termRecords)) doc.termRecords = [];
    doc.termRecords.push({ id: 'tr379', classId: '${C9}', termId: '${T9}', at: lg.localStamp(R), grades: recorded });
  });
  s.update(function(doc){
    ['${S9.gale}', '${S9.hale}'].forEach(function(id){
      var r = sh.reviseCell(doc.scores['${A9.e1}'][id], { v: 9 }, at(MIN), column(doc));
      if (r.write) doc.scores['${A9.e1}'][id] = r.cell;
    });
    /* The deletion, as src/assignments.js does it: the assignment and its column, nothing else. */
    doc.assignments = doc.assignments.filter(function(a){ return a.id !== '${A9.p2}'; });
    delete doc.scores['${A9.p2}'];
  });
  await s.flush();
  var d = s.getDoc();
  var c = d.classes.filter(function(x){ return x.id === '${C9}'; })[0];
  var live = function(id){ var g = window.planbook.gradeEngine.classGrade(d, c, '${T9}', id);
    return g.percentage === null ? null : g.percentage.toFixed(2) + ' ' + g.letter; };
  return { ok: true, had: had, was: was,
    recorded: recorded.map(function(g){ return g.studentId.slice(6) + '=' + g.percentage.toFixed(2) + ' ' + g.letter; }),
    live: ['${S9.fenn}', '${S9.gale}', '${S9.hale}'].map(function(id){ return id.slice(6) + '=' + live(id); }),
    gale: JSON.stringify(d.scores['${A9.e1}']['${S9.gale}']),
    hale: JSON.stringify(d.scores['${A9.e1}']['${S9.hale}']) }; })()`);

try {
const REC9 = ['fenn=50.00 F', 'gale=70.00 C', 'hale=70.00 C'];
const LIVE9 = ['fenn=80.00 B', 'gale=95.00 A', 'hale=95.00 A'];
if (!(plant9.ok && JSON.stringify(plant9.recorded.slice().sort()) === JSON.stringify(REC9)
  && JSON.stringify(plant9.live) === JSON.stringify(LIVE9))) {
  check('WO-3.79: the fixture is real — the recording holds the hand table\'s grades and every live grade '
    + 'is the table\'s', false, JSON.stringify(plant9));
} else {
await evalJs(`(function(){ window.planbook.termRecordView.openTermRecordDialog('${C9}', '${T9}', null); return 1; })()`);
await sleep(200);
const seen9 = await causesNow();
const lines9 = (key) => { const r = seen9.rows.filter((x) => x.id === S9[key])[0]; return r ? r.lines : null; };
await closeDialog();

check('WO-3.79 (Acceptance 1): a student whose grade moved only because an assignment was deleted gets '
  + 'the new setting line, word for word — Fenn379, 50.00 F → 80.00 B once *Draft* went, reads exactly *'
  + SETTING + '* and nothing else',
  seen9.open && JSON.stringify(lines9('fenn')) === JSON.stringify([['setting', SETTING]]),
  JSON.stringify({ fenn: lines9('fenn'), text: seen9.text }));

check('WO-3.79 (Acceptance 2, two minutes): a score recorded at 4, edited to 9 one minute after the '
  + 'recording, reads *4 → 9 of 10*, not *not known* — Gale379\'s 4 typed two minutes before the recording is pushed by '
  + 'the 9 at R+1min, inside the five minutes, because the recording sealed it',
  JSON.stringify(lines9('gale')) === JSON.stringify([['score', 'Act 2 quiz (Exams): 4 → 9 of 10']])
    && /^\{"v":9,"at":"[^"]+","was":\[\{"v":4,"at":"[^"]+"\}\]\}$/.test(plant9.gale),
  JSON.stringify({ gale: lines9('gale'), cell: plant9.gale }));

check('WO-3.79 (Acceptance 2, twenty days): a score recorded at 4, edited to 9 one minute after the '
  + 'recording, reads *4 → 9 of 10*, not *not known* — Hale379\'s 4 typed twenty days before the '
  + 'recording, the 9 at R+1min: the reader trusts the trail across a recording, so the 4 at or before '
  + 'it is what it saw',
  JSON.stringify(lines9('hale')) === JSON.stringify([['score', 'Act 2 quiz (Exams): 4 → 9 of 10']])
    && seen9.text.indexOf('not known') === -1
    && /^\{"v":9,"at":"[^"]+","was":\[\{"v":4,"at":"[^"]+"\}\]\}$/.test(plant9.hale),
  JSON.stringify({ hale: lines9('hale'), cell: plant9.hale }));
}

/* ── Acceptance 6, and the seal on the same night: instants, not strings ──
   US daylight saving ends 2026-11-01 at 02:00 EDT, so 01:30-04:00 (05:30Z) is EARLIER than 01:10-05:00
   (06:10Z) although it sorts later as a string. newestRecord() over the two in write order, the other
   way round, two equal stamps, and an unparseable one; then reviseCell() handed both as `records`. */
const dst9 = await evalJs(`(async function(){
  var sh = await import(new URL('src/score-history.js', document.baseURI).href);
  var T = window.planbook.termRecord, cls = { id: 'c' };
  var rec = function(id, at){ return { id: id, classId: 'c', termId: 't', at: at, grades: [] }; };
  var first = rec('first', '2026-11-01T01:30:00-04:00'), second = rec('second', '2026-11-01T01:10:00-05:00');
  var pick = function(list){ var r = T.newestRecord({ termRecords: list }, cls, 't'); return r ? r.id : null; };
  /* A cell stamped 01:09-05:00 (06:09Z) — after the first recording, before the second — written again
     three minutes later. Sealed by the second; inside an ordinary window if the first were newest. */
  var revised = sh.reviseCell({ v: 4, at: '2026-11-01T01:09:00-05:00' }, { v: 9 },
    new Date(Date.parse('2026-11-01T01:12:00-05:00')),
    { held: false, classId: 'c', termId: 't', records: [first, second] });
  return { inOrder: pick([first, second]), reversed: pick([second, first]),
    tie: pick([rec('a', '2026-11-01T01:10:00-05:00'), rec('b', '2026-11-01T01:10:00-05:00')]),
    junk: pick([rec('junk', 'not a stamp'), first]) + '/' + pick([first, rec('junk', 'not a stamp')]),
    sealed: revised.write && revised.cell && Array.isArray(revised.cell.was)
      ? JSON.stringify(revised.cell.was) : JSON.stringify(revised) }; })()`);
check('WO-3.79 (Acceptance 6): two recordings of one quarter stamped …T01:30:00-04:00 and then '
  + '…T01:10:00-05:00 on 2026-11-01: newestRecord() returns the second — and the second still when '
  + 'written first, the later write on a tie, a parseable stamp over one that will not parse either way '
  + 'round; and reviseCell() seals against that same second recording, pushing a 4 stamped between them',
  dst9.inOrder === 'second' && dst9.reversed === 'second' && dst9.tie === 'b'
    && dst9.junk === 'first/first'
    && dst9.sealed === JSON.stringify([{ v: 4, at: '2026-11-01T01:09:00-05:00' }]),
  JSON.stringify(dst9));
} finally {
await closeDialog();
await evalJs(`(async function(){
  var s = window.planbook.store;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${C9}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo379-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${C9}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a379-') === 0) delete doc.scores[k]; });
    if (${plant9 && plant9.had ? 'true' : 'false'}) {
      doc.termRecords = (doc.termRecords || []).filter(function(e){ return e.classId !== '${C9}'; });
    } else {
      delete doc.termRecords;
    }
  });
  window.planbook.supports.setPresentationMode(${plant9 && plant9.was && plant9.was.mode ? 'true' : 'false'});
  await s.flush();
  return 1; })()`);
}
const cleared9 = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { classes: d.classes.filter(function(x){ return x.id === '${C9}'; }).length,
    students: d.students.filter(function(x){ return String(x.id).indexOf('wo379-') === 0; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${C9}'; }).length,
    scores: Object.keys(d.scores || {}).filter(function(k){ return k.indexOf('a379-') === 0; }).length,
    records: Object.prototype.hasOwnProperty.call(d, 'termRecords'),
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.79 fixture came back off the document, the termRecords key is as it was found, and '
  + 'presentation mode is where it was found',
  cleared9.classes === 0 && cleared9.students === 0 && cleared9.work === 0 && cleared9.scores === 0
    && cleared9.records === !!(plant9 && plant9.had)
    && cleared9.mode === !!(plant9 && plant9.was && plant9.was.mode),
  JSON.stringify(cleared9) + ' · had the key at the start: ' + !!(plant9 && plant9.had));
}

/* ══ WO-3.79 — the past-due sweep is a writer too, and the recording seals against it ══
 *
 * A THIRD CLASS, so the sweep has a past-due blank of its own and touches nobody else's. All work 100,
 * one term, two columns of 10, both due three days ago: Q *Quiz 3* and L *Reading log*. One student:
 *
 *            before the recording (R = a minute ago)       after it
 *   Ives     Q 8 (R−20d) · L 4 (R−20d), cleared (R−2min)    L Missing (R+1min), by the past-due sweep
 *
 *   Recorded 80.00 B (the blank counts toward nothing) → live 40.00 F (8 of 20).
 *
 * The clear at R−2min pushes the 4 — twenty days old — and leaves a blank WITH A PAST, which is a blank
 * to the sweep. The sweep runs on the device clock, a minute after R and three after the blank, inside
 * WO-3.33's five minutes: without the seal it REPLACES the blank, and *What changed* reads the 4 from
 * twenty days before as what the recording saw. With it, the blank is pushed, and the line reads
 * *Blank → Missing*. It is src/past-due.js's own writer that runs — paintPastDue() takes the class's
 * blanks as the screen does, acceptPastDue() writes them — imported from the page's own module graph,
 * so the descriptor is the one that file builds and not the fixture's. */
{
const C8 = 'c_wo379pd', T8 = 'tm379pd', K8 = 'k379pd', S8 = 'wo379pd-ives';
const A8 = { q: 'a379pd-q', l: 'a379pd-l' };
const plant8 = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes, d0 = s.getDoc();
  if (!d0) return { ok: false, why: 'no year document is open' };
  var sh = await import(new URL('src/score-history.js', document.baseURI).href);
  var lg = await import(new URL('src/log.js', document.baseURI).href);
  var had = Object.prototype.hasOwnProperty.call(d0, 'termRecords');
  var was = { mode: window.planbook.supports.presentationMode(), cls: c.getSelectedClassId() };
  window.planbook.supports.setPresentationMode(false);
  var MIN = 60 * 1000, DAY = 24 * 60 * MIN;
  var R = new Date(Math.floor((Date.now() - MIN) / 1000) * 1000);
  var at = function(ms){ return new Date(R.getTime() + ms); };
  var column = function(doc){ return { held: false, classId: '${C8}', termId: '${T8}', records: doc.termRecords }; };
  s.update(function(doc){
    doc.students.push({ id: '${S8}', first: 'Ivo', last: 'Ives379' });
    doc.classes.push({ id: '${C8}', name: 'WO-3.79 Sweep', archived: false,
      letterScale: ${JSON.stringify(SCALE)},
      terms: [{ id: '${T8}', label: 'Quarter 1', start: '${D(-40)}', end: '${D(60)}' }],
      categories: [{ id: '${K8}', name: 'All work', weight: 100 }], roster: ['${S8}'] });
    var add = function(id, name){
      doc.assignments.push({ id: id, classId: '${C8}', termId: '${T8}', categoryId: '${K8}', name: name,
        points: 10, assigned: '${D(-30)}', due: '${D(-3)}' });
    };
    add('${A8.q}', 'Quiz 3'); add('${A8.l}', 'Reading log');
    doc.scores['${A8.q}'] = {}; doc.scores['${A8.l}'] = {};
    var put = function(a, v, ms){
      var r = sh.reviseCell(doc.scores[a]['${S8}'] || null, { v: v }, at(ms), column(doc));
      if (r.write) { if (r.cell) doc.scores[a]['${S8}'] = r.cell; else delete doc.scores[a]['${S8}']; }
    };
    put('${A8.q}', 8, -20 * DAY); put('${A8.l}', 4, -20 * DAY); put('${A8.l}', null, -2 * MIN);
  });
  var cls = s.getDoc().classes.filter(function(x){ return x.id === '${C8}'; })[0];
  var recorded = window.planbook.termRecord.gradesToRecord(s.getDoc(), cls, '${T8}');
  s.update(function(doc){
    if (!Array.isArray(doc.termRecords)) doc.termRecords = [];
    doc.termRecords.push({ id: 'tr379pd', classId: '${C8}', termId: '${T8}', at: lg.localStamp(R), grades: recorded });
  });
  var blank = JSON.stringify(s.getDoc().scores['${A8.l}']['${S8}']);
  /* The sweep, as the class screen offers it: the class open, its blanks taken, the offer accepted. */
  c.selectClass('${C8}'); c.selectTerm('${T8}');
  var pd = await import(new URL('src/past-due.js', document.baseURI).href);
  pd.paintPastDue();
  var asked = pd.pastDueAsksAbout('${A8.l}');
  var wrote = pd.acceptPastDue();
  await s.flush();
  var d = s.getDoc();
  var g = window.planbook.gradeEngine.classGrade(d, d.classes.filter(function(x){ return x.id === '${C8}'; })[0], '${T8}', '${S8}');
  return { ok: true, had: had, was: was, R: lg.localStamp(R), term: c.getSelectedTermId(),
    recorded: recorded.map(function(x){ return x.percentage.toFixed(2) + ' ' + x.letter; }),
    live: g.percentage === null ? null : g.percentage.toFixed(2) + ' ' + g.letter,
    blank: blank, asked: asked, wrote: wrote,
    cell: JSON.stringify(d.scores['${A8.l}']['${S8}']) }; })()`);

try {
let swept = null;
if (plant8.ok && plant8.asked && plant8.wrote) {
  await evalJs(`(function(){ window.planbook.termRecordView.openTermRecordDialog('${C8}', '${T8}', null); return 1; })()`);
  await sleep(200);
  const seen8 = await causesNow();
  const r8 = seen8.rows.filter((x) => x.id === S8)[0];
  swept = r8 ? r8.lines : null;
  await closeDialog();
}
const cell8 = (() => { try { return JSON.parse(plant8.cell); } catch (e) { return null; } })();
check('WO-3.79: the past-due sweep writing *missing* one minute after a recording keeps the version the '
  + 'recording saw, driven through src/past-due.js\'s own writer rather than read off its source — '
  + 'Ives379\'s Reading log, cleared two minutes before the recording over a 4 from twenty days before, is '
  + 'swept to Missing by acceptPastDue() a minute after it: the blank is pushed onto the trail behind the '
  + '4, and *What changed* reads *Reading log (All work): Blank → Missing*, not *4 of 10 → Missing*',
  plant8.ok && plant8.asked && plant8.wrote && plant8.term === T8
    && JSON.stringify(plant8.recorded) === JSON.stringify(['80.00 B']) && plant8.live === '40.00 F'
    && /^\{"v":null,"at":"[^"]+","was":\[\{"v":4,"at":"[^"]+"\}\]\}$/.test(plant8.blank)
    && !!cell8 && cell8.v === null && cell8.flag === 'missing' && Array.isArray(cell8.was)
    && cell8.was.length === 2 && cell8.was[0].v === 4
    && JSON.stringify(cell8.was[1]) === JSON.stringify({ v: null, at: JSON.parse(plant8.blank).at })
    && JSON.stringify(swept) === JSON.stringify([['score', 'Reading log (All work): Blank → Missing']]),
  JSON.stringify({ plant: plant8, lines: swept }));
} finally {
await closeDialog();
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${C8}'; });
    doc.students = doc.students.filter(function(x){ return x.id !== '${S8}'; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${C8}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a379pd-') === 0) delete doc.scores[k]; });
    if (${plant8 && plant8.had ? 'true' : 'false'}) {
      doc.termRecords = (doc.termRecords || []).filter(function(e){ return e.classId !== '${C8}'; });
    } else {
      delete doc.termRecords;
    }
  });
  window.planbook.supports.setPresentationMode(${plant8 && plant8.was && plant8.was.mode ? 'true' : 'false'});
  var back = ${JSON.stringify((plant8 && plant8.was && plant8.was.cls) || '')};
  if (back) c.selectClass(back);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
}
const cleared8 = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
  return { classes: d.classes.filter(function(x){ return x.id === '${C8}'; }).length,
    students: d.students.filter(function(x){ return x.id === '${S8}'; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${C8}'; }).length,
    scores: Object.keys(d.scores || {}).filter(function(k){ return k.indexOf('a379pd-') === 0; }).length,
    records: Object.prototype.hasOwnProperty.call(d, 'termRecords'),
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.79 sweep fixture came back off the document, the termRecords key is as it was found, '
  + 'and presentation mode is where it was found',
  cleared8.classes === 0 && cleared8.students === 0 && cleared8.work === 0 && cleared8.scores === 0
    && cleared8.records === !!(plant8 && plant8.had)
    && cleared8.mode === !!(plant8 && plant8.was && plant8.was.mode),
  JSON.stringify(cleared8) + ' · had the key at the start: ' + !!(plant8 && plant8.had));
}
await send('Page.reload');
await sleep(600);
await mustBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
