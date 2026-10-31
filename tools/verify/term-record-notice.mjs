/* term-record-notice.mjs — the notice opens when you leave a quarter that changed, and home carries
 * the bar (WO-3.74)
 *
 * The notice is WO-3.73's changed-form dialog opening by itself. These checks drive it through the
 * app's real doors — a term tab, a class tab, *All classes*, the switcher's pills, the score grid's own
 * cells — and read whether #termRecordModal opened, which form, and for whom. Edits that a teacher
 * makes in the quarter are typed into the grid; a change "made from another quarter" is a class
 * setting written through the store while the teacher is in Quarter 2, which is the only way such a
 * change reaches the app without passing through Quarter 1's screens.
 *
 * THE FIXTURE. Two classes, both with a scale of A 90 · B 80 · C 70 · D 60 · F 0 and one category,
 * Exams at 100.
 *   N  "WO-3.74 Notice"  Quarter 1 ended 10 days ago, Quarter 2 runs from 9 days ago to 60 days on,
 *                        so the class opens on Quarter 2. Roster s1 Ames374, s2 Bell374 (grid order).
 *                        E1 (Q1, 100 pts): s1 90, s2 80 → 90.00 A, 80.00 B. Q2X (Q2, 100): s1 85.
 *                        Quarter 1 is RECORDED at the start, so nothing is changed on arrival.
 *   O  "WO-3.74 Other"   one term holding today, nothing to record; roster s1. It is the "another
 *                        class" a tab goes to, and it never carries a bar or a notice of its own until
 *                        the home-bar checks end its term.
 *
 * It plants both through the store, turns presentation mode on once and puts it back as it found it,
 * takes both classes and their records back out, and hands the page back reloaded — the reload is
 * also what empties the notice's in-memory record of what it has shown. No viewport change.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, clickVisible, KILL_ANIM, INSTALL_WALKER, waitForBoot, send } = h;

console.log('\n--- The notice opens when you leave a quarter that changed, and home carries the bar (WO-3.74) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.termRecord"
  + " && window.planbook.termRecordView && window.planbook.classes && window.planbook.supports"
  + " && window.planbook.termRecordView.termRecordHomeModel && window.planbook.termRecord.newestNeedOf"
  + " && document.getElementById('termRecordHomeNag') && document.getElementById('termRecordModal'))"))) {
  skip('The notice and the home bar (WO-3.74)', 'window.planbook is missing termRecordView, termRecord, '
    + 'classes or supports, or the home bar or the dialog is not in the page');
  return;
}

const N = 'c_wo374n', O = 'c_wo374o', Q1 = 'tm374q1', Q2 = 'tm374q2', OQ = 'tm374oq';
const K = 'k374e', KO = 'k374o';
const S1 = 'wo374-s1', S2 = 'wo374-s2';
const E1 = 'a374-e1', Q2X = 'a374-q2x';
const NAMES = ['Ames374', 'Bell374'];
const SCALE = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 },
  { letter: 'D', min: 60 }, { letter: 'F', min: 0 }];
const D = (n) => nodeDaysFromToday(n);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const flush = () => evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');

/* What is up right now: the Record dialog (open, which form, its rows), any other dialog, the view,
   the open class and its open term. Read after a pause long enough for the notice's microtask and
   the modal's paint. */
const state = () => evalJs(`(function(){
  var m = document.getElementById('termRecordModal');
  var txt = function(id){ var e = document.getElementById(id); return e ? (e.textContent || '').replace(/\\s+/g, ' ').trim() : ''; };
  var vis = function(id){ var e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  var ids = { home: 'homeView', 'class': 'classView', assignments: 'assignmentsView', scores: 'scoresView',
    detail: 'detailView', calendar: 'calendarView', signals: 'signalsView', templates: 'templatesView' };
  var c = window.planbook.classes;
  return { open: !m.classList.contains('hidden'), title: txt('termRecordTitle'),
    refused: vis('termRecordRefused'),
    rows: Array.prototype.map.call(document.querySelectorAll('#termRecordList [data-term-record-row]'),
      function(n){ var a = n.nextElementSibling, b = a ? a.nextElementSibling : null;
        return [n.getAttribute('data-term-record-row'), a ? a.textContent : '', b ? b.textContent : '']; }),
    others: Array.prototype.filter.call(document.querySelectorAll('.modal-overlay'), function(o){
      return o.id !== 'termRecordModal' && !o.classList.contains('hidden'); }).map(function(o){ return o.id; }),
    view: Object.keys(ids).filter(function(k){ var e = document.getElementById(ids[k]);
      return e && !e.classList.contains('hidden'); }).join(','),
    cls: c.getSelectedClassId(), term: c.getSelectedTermId() }; })()`);
const settle = async () => { await sleep(250); return state(); };
/* Closes the Record dialog with *Not yet* if it is up, so a failed check does not leave it over the
   next tap. */
const notYet = async () => {
  if (await evalJs("!document.getElementById('termRecordModal').classList.contains('hidden')")) {
    await clickSel('#termRecordKeep');
    await sleep(150);
  }
};
const viewNow = () => evalJs(`(function(){ var ids = { home: 'homeView', 'class': 'classView',
  assignments: 'assignmentsView', scores: 'scoresView', detail: 'detailView', calendar: 'calendarView',
  signals: 'signalsView', templates: 'templatesView' };
  return Object.keys(ids).filter(function(k){ var e = document.getElementById(ids[k]);
    return e && !e.classList.contains('hidden'); }).join(','); })()`);
/* One of the open class's screens, through the switcher's pill (or the registry's door, for detail). */
const go = async (screen) => {
  if (screen === 'detail') {
    if ((await viewNow()) !== 'class') await go('class');
    await clickVisible('#classView [data-student-detail="' + S1 + '"]');
  } else {
    if ((await viewNow()) === screen) {
      await clickVisible('[data-class-screen="' + (screen === 'class' ? 'assignments' : 'class') + '"]');
      await sleep(150);
    }
    await clickVisible('[data-class-screen="' + screen + '"]');
  }
  await sleep(150);
};
const openClass = async (id) => { await clickVisible('[data-class-tab="' + id + '"]'); await sleep(200); };
const tapTerm = async (id) => { await clickVisible('[data-term-select="' + id + '"]'); await sleep(200); };
const home = async () => { await clickVisible('[data-view-home]'); await sleep(200); };
/* A score typed into the grid's own cell, as the teacher types it — the `input` the grid listens to. */
const type = async (a, s, v) => {
  const ok = await evalJs(`(function(){
    var f = document.querySelector('#scoresBody [data-score-cell="${a}"][data-score-student="${s}"]');
    if (!f) return 0; f.focus(); f.value = ${JSON.stringify(String(v))};
    f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
  await sleep(150);
  return ok === 1;
};
/* What the document and this browser's planbook_ keys look like, flushed — for "nothing about the
   notice is stored". The three preferences a tap between terms and screens writes on its own account
   (which class, which term, which view — src/classes.js and src/views.js) are left out: they move
   because the teacher moved, and the notice is not why. */
const NAV_PREFS = ['planbook_openClassId', 'planbook_openTermIds', 'planbook_openView'];
const stored = () => evalJs(`(async function(){ var s = window.planbook.store; await s.flush();
  var d = s.getDoc(), keys = [], skip = ${JSON.stringify(NAV_PREFS)};
  for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i);
    if (String(k).indexOf('planbook_') === 0 && skip.indexOf(k) === -1) keys.push(k + '=' + localStorage.getItem(k)); }
  return { rev: d.rev, json: JSON.stringify(d), local: keys.sort().join('|'),
    count: localStorage.length }; })()`);

/* ── THE FIXTURE ── */
const plant = await evalJs(`(async function(){
  var s = window.planbook.store, d0 = s.getDoc();
  if (!d0) return { ok: false, why: 'no year document is open' };
  var had = Object.prototype.hasOwnProperty.call(d0, 'termRecords');
  var was = { cls: window.planbook.classes.getSelectedClassId(), mode: window.planbook.supports.presentationMode() };
  s.update(function(doc){
    doc.students.push({ id: '${S1}', first: 'Ada', last: 'Ames374' }, { id: '${S2}', first: 'Bo', last: 'Bell374' });
    doc.classes.push({ id: '${N}', name: 'WO-3.74 Notice', archived: false, letterScale: ${JSON.stringify(SCALE)},
      terms: [{ id: '${Q1}', label: 'Quarter 1', start: '${D(-40)}', end: '${D(-10)}' },
              { id: '${Q2}', label: 'Quarter 2', start: '${D(-9)}', end: '${D(60)}' }],
      categories: [{ id: '${K}', name: 'Exams', weight: 100 }], roster: ['${S1}', '${S2}'] });
    doc.classes.push({ id: '${O}', name: 'WO-3.74 Other', archived: false, letterScale: ${JSON.stringify(SCALE)},
      terms: [{ id: '${OQ}', label: 'Quarter 1', start: '${D(-40)}', end: '${D(60)}' }],
      categories: [{ id: '${KO}', name: 'Exams', weight: 100 }], roster: ['${S1}'] });
    doc.assignments.push({ id: '${E1}', classId: '${N}', termId: '${Q1}', categoryId: '${K}', name: 'WO-3.74 Exam',
      points: 100, assigned: '', due: '' });
    doc.assignments.push({ id: '${Q2X}', classId: '${N}', termId: '${Q2}', categoryId: '${K}', name: 'WO-3.74 Q2 exam',
      points: 100, assigned: '', due: '' });
    doc.scores['${E1}'] = { '${S1}': { v: 90 }, '${S2}': { v: 80 } };
    doc.scores['${Q2X}'] = { '${S1}': { v: 85 } };
  });
  await s.flush();
  var d = s.getDoc();
  var cls = d.classes.filter(function(c){ return c.id === '${N}'; })[0];
  var entry = window.planbook.termRecord.recordTerm(cls, '${Q1}');
  await s.flush();
  window.planbook.supports.setPresentationMode(false);
  return { ok: !!cls && !!entry, had: had, was: was,
    grades: entry ? entry.grades.map(function(g){ return [g.studentId, Number(g.percentage).toFixed(2), g.letter]; }) : null }; })()`);
if (!plant || !plant.ok || JSON.stringify(plant.grades) !== JSON.stringify([[S1, '90.00', 'A'], [S2, '80.00', 'B']])) {
  check('WO-3.74: the fixture is real — both classes planted and Quarter 1 recorded at the hand table\'s figures',
    false, JSON.stringify(plant));
  return;
}

try {
/* The header's class tabs drawn for the document as it now stands (planted through the store, so
   nothing has repainted), then the class opened through its tab, as a teacher opens it. */
await evalJs(`(function(){ window.planbook.classes.selectClass('${O}'); window.planbook.classes.refreshClassBar(); return 1; })()`);
await openClass(O);
await notYet();
await openClass(N);
const arrived = await settle();

/* ── ACCEPTANCE 2: working in the quarter opens nothing ── */
await tapTerm(Q1);
const intoQ1 = await settle();
await go('scores');
const working = [];
const typed = [await type(E1, S1, 85)];
working.push(['typed s1 85', (await settle()).open]);
await go('class');
working.push(['attendance', (await settle()).open]);
await go('assignments');
working.push(['assignments', (await settle()).open]);
await go('scores');
typed.push(await type(E1, S2, 82));
working.push(['typed s2 82', (await settle()).open]);
await go('detail');
working.push(['detail', (await settle()).open]);
await go('scores');
working.push(['scores again', (await settle()).open]);
await tapTerm(Q1);
working.push(['Quarter 1 tapped again', (await settle()).open]);
const stillQ1 = await state();
check('WO-3.74: working in the quarter opens nothing — arriving in the class on Quarter 2 with Quarter 1 '
  + 'matching its record opens nothing; then in Quarter 1, two scores typed into the grid and the class\'s '
  + 'screens visited in turn (Attendance, Assignments, Scores, a student\'s detail, Scores) and Quarter 1 '
  + 'tapped again, and the dialog never opens',
  arrived.open === false && arrived.cls === N && arrived.term === Q2
    && intoQ1.open === false && intoQ1.term === Q1
    && typed.every(Boolean) && working.every((w) => w[1] === false)
    && stillQ1.cls === N && stillQ1.term === Q1,
  JSON.stringify({ arrived: arrived, intoQ1: [intoQ1.open, intoQ1.term], typed: typed, working: working,
    still: [stillQ1.cls, stillQ1.term] }));

/* ── ACCEPTANCE 1 and 7: leaving opens the notice, once ── */
const before = await stored();
await tapTerm(Q2);
const leftByTerm = await settle();
await notYet();
const afterClose = await stored();
await tapTerm(Q1);
const backIn = await settle();
await tapTerm(Q2);
const leftAgain = await settle();
await notYet();
await tapTerm(Q1);
await go('scores');
await type(E1, S1, 86);
await openClass(O);
const leftByClass = await settle();
await notYet();
await openClass(N);
const backToN = await settle();
await notYet();
await tapTerm(Q1);
await go('scores');
await type(E1, S2, 83);
await home();
const leftByHome = await settle();
await notYet();
const CHANGED_TITLE = 'Quarter 1’s grades have changed';
const isNotice = (s, rows) => s.open && !s.refused && s.title === CHANGED_TITLE
  && JSON.stringify(s.rows) === JSON.stringify(rows) && s.others.length === 0;
check('WO-3.74: changing a recorded quarter\'s scores and then tapping another term opens the notice — the '
  + 'changed form, listing who changed (Ames374 90.00% A → 85.00% B, Bell374 80.00% B → 82.00% B), on the '
  + 'Quarter 2 the teacher tapped to — and so does tapping another class after a further edit, and tapping '
  + 'All classes after another, each listing the students as they now stand; opening and closing it writes '
  + 'nothing to the year document or to this browser\'s storage',
  isNotice(leftByTerm, [[S1, '90.00% A', '85.00% B'], [S2, '80.00% B', '82.00% B']])
    && leftByTerm.cls === N && leftByTerm.term === Q2
    && isNotice(leftByClass, [[S1, '90.00% A', '86.00% B'], [S2, '80.00% B', '82.00% B']])
    && leftByClass.cls === O
    && isNotice(leftByHome, [[S1, '90.00% A', '86.00% B'], [S2, '80.00% B', '83.00% B']])
    && leftByHome.view === 'home'
    && before.json === afterClose.json && before.rev === afterClose.rev && before.local === afterClose.local,
  JSON.stringify({ term: leftByTerm, cls: leftByClass, home: leftByHome,
    wroteNothing: [before.json === afterClose.json, before.local === afterClose.local] }));
check('WO-3.74: the notice opens ONCE for a change — back into Quarter 1 and out again with nothing new '
  + 'changed opens nothing, and nor does coming back to the class that was just left',
  backIn.open === false && leftAgain.open === false && leftAgain.term === Q2 && backToN.open === false,
  JSON.stringify({ backIn: backIn.open, leftAgain: [leftAgain.open, leftAgain.term, leftAgain.title],
    backToN: [backToN.open, backToN.title] }));

/* ── ACCEPTANCE 3: a change made from another quarter ──
   On Quarter 2 of the class, the class's letter scale moves B's floor from 80 to 84 — a class setting,
   which changes Bell374's Quarter 1 letter (83.00 B → C) without the teacher visiting Quarter 1. */
await openClass(N);
await notYet();
const onQ2 = await state();
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ var c = doc.classes.filter(function(x){ return x.id === '${N}'; })[0];
    c.letterScale = c.letterScale.map(function(r){ return r.letter === 'B' ? { letter: 'B', min: 84 } : r; }); });
  await s.flush(); return 1; })()`);
await go('scores');
const stayQ2 = await settle();
await go('class');
const stayQ2b = await settle();
await openClass(O);
const toOther = await settle();
await openClass(N);
const reopened = await settle();
await notYet();
await openClass(O);
await openClass(N);
const reopenedAgain = await settle();
check('WO-3.74: a change made from another quarter — the letter scale changed while the class is on '
  + 'Quarter 2 — opens nothing while the teacher stays, nothing on leaving Quarter 2 for another class, '
  + 'then opens the notice the next time the class is opened, listing Bell374 now 83.00% C; and the next '
  + 'opening after that, with nothing new changed, opens nothing',
  onQ2.term === Q2 && stayQ2.open === false && stayQ2b.open === false && toOther.open === false
    && isNotice(reopened, [[S1, '90.00% A', '86.00% B'], [S2, '80.00% B', '83.00% C']])
    && reopened.cls === N
    && reopenedAgain.open === false && reopenedAgain.cls === N,
  JSON.stringify({ onQ2: onQ2.term, stay: [stayQ2.open, stayQ2b.open], toOther: toOther.open,
    reopened: reopened, again: reopenedAgain.open }));

/* ── ACCEPTANCE 4: under a projector ── a new change from Quarter 2: B back at 80 and A's floor down to
   85, so Ames374's 86.00 reads A — a figure no notice has shown yet. */
const SCALE_A85 = [{ letter: 'A', min: 85 }].concat(SCALE.slice(1));
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ doc.classes.filter(function(x){ return x.id === '${N}'; })[0].letterScale = ${JSON.stringify(SCALE_A85)}; });
  await s.flush(); window.planbook.supports.setPresentationMode(true); return 1; })()`);
await openClass(O);
await openClass(N);
const projOpen = await settle();
await notYet();
await tapTerm(Q1);
await tapTerm(Q2);
const projLeave = await settle();
await notYet();
await evalJs('(function(){ window.planbook.supports.setPresentationMode(false); return 1; })()');
await go('scores');
const modeOff = await settle();
await openClass(O);
await openClass(N);
const nextOpening = await settle();
await notYet();
check('WO-3.74: in presentation mode the notice does not open — not on opening the class with a change '
  + 'unshown, and not on leaving the changed quarter, and its refusal is not shown in its place either — '
  + 'nor when the mode is turned off; it opens on the next opening of the class with the mode off, '
  + 'listing Ames374 now 86.00% A and Bell374 83.00% B',
  projOpen.open === false && projLeave.open === false && modeOff.open === false
    && isNotice(nextOpening, [[S1, '90.00% A', '86.00% A'], [S2, '80.00% B', '83.00% B']]),
  JSON.stringify({ projOpen: projOpen.open, projLeave: projLeave.open, modeOff: modeOff.open,
    next: nextOpening }));

/* ── ACCEPTANCE 5: the home bar ──
   The other class's term is ended and never recorded; this class's Quarter 1 is still changed, with
   the scale back as planted. */
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ var o = doc.classes.filter(function(x){ return x.id === '${O}'; })[0];
    o.terms[0].start = '${D(-40)}'; o.terms[0].end = '${D(-2)}';
    doc.classes.filter(function(x){ return x.id === '${N}'; })[0].letterScale = ${JSON.stringify(SCALE)}; });
  await s.flush(); return 1; })()`);
const homeBar = () => evalJs(`(function(){
  var bar = document.getElementById('termRecordHomeNag'), r = bar.getBoundingClientRect();
  var norm = function(t){ return (t || '').replace(/\\s+/g, ' ').trim(); };
  var lead = bar.querySelector('.term-record-nag-text');
  var backup = document.getElementById('backupNag');
  return { shown: !bar.classList.contains('hidden') && r.height > 0, text: norm(lead ? lead.textContent : ''),
    all: norm(bar.textContent),
    buttons: Array.prototype.map.call(bar.querySelectorAll('[data-term-record-home]'), function(b){
      return [b.getAttribute('data-term-record-home'), b.getAttribute('data-term-record-term'), b.textContent]; }),
    labelledBy: !!document.getElementById(bar.getAttribute('aria-labelledby')),
    inGlance: !!bar.closest('#homeView'),
    afterBackupNag: !!(backup && (backup.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING)) }; })()`);
const mine = (b) => b.buttons.filter((x) => x[0] === N || x[0] === O);
await home();
await notYet();
const bar1 = await homeBar();
const theirs1 = bar1.buttons.length - mine(bar1).length;
await clickSel('#termRecordHomeNag [data-term-record-home="' + O + '"]');
const landedO = await settle();
await notYet();
const otherDialogTitle = landedO.title;
await home();
await notYet();
await clickSel('#termRecordHomeNag [data-term-record-home="' + N + '"]');
const landedN = await settle();
await notYet();
await go('class');
const noBarOnClass = await evalJs("document.getElementById('termRecordHomeNag').classList.contains('hidden')");
check('WO-3.74: the home bar names each class that needs recording — one strip on All classes, after the '
  + 'backup nag and outside the glance page, *Quarter 1 needs recording in N classes. WO-3.74 Notice has '
  + 'changed since it was recorded.*, one button per class in class order, naming no student — and a '
  + 'class\'s button lands on that class\'s Scores for the quarter with the dialog open: the changed form '
  + 'for WO-3.74 Notice\'s Quarter 1, the first recording for WO-3.74 Other\'s; it is not drawn on a '
  + 'class\'s screens',
  bar1.shown && bar1.afterBackupNag && !bar1.inGlance && bar1.labelledBy
    && JSON.stringify(mine(bar1)) === JSON.stringify([[N, Q1, 'WO-3.74 Notice'], [O, OQ, 'WO-3.74 Other']])
    && (theirs1 > 0 || bar1.text === '⚠ Quarter 1 needs recording in 2 classes. WO-3.74 Notice has changed '
      + 'since it was recorded.')
    && NAMES.every((n) => bar1.all.indexOf(n) === -1)
    && landedO.view === 'scores' && landedO.cls === O && landedO.term === OQ && landedO.open
    && otherDialogTitle === 'Record Quarter 1 grades for WO-3.74 Other?'
    && landedN.view === 'scores' && landedN.cls === N && landedN.term === Q1
    && isNotice(landedN, [[S1, '90.00% A', '86.00% B'], [S2, '80.00% B', '83.00% B']])
    && noBarOnClass === true,
  JSON.stringify({ bar: bar1, others: theirs1, landedO: landedO, landedN: landedN, noBarOnClass: noBarOnClass }));

/* ── ACCEPTANCE 6: Q1 never recorded, Q2 recorded and since changed — the button opens Q2 ──
   This class's records come off (Quarter 1 reads as never recorded), Quarter 2 is ended yesterday and
   recorded, then Ames374's Q2 exam moves 85 → 70. */
await evalJs(`(async function(){ var s = window.planbook.store;
  s.update(function(doc){ var c = doc.classes.filter(function(x){ return x.id === '${N}'; })[0];
    c.terms[1].end = '${D(-1)}';
    doc.termRecords = doc.termRecords.filter(function(e){ return e.classId !== '${N}'; }); });
  await s.flush();
  var d = s.getDoc(), cls = d.classes.filter(function(x){ return x.id === '${N}'; })[0];
  window.planbook.termRecord.recordTerm(cls, '${Q2}');
  await s.flush();
  s.update(function(doc){ doc.scores['${Q2X}']['${S1}'] = { v: 70 }; });
  await s.flush(); return 1; })()`);
const engine6 = await evalJs(`(function(){ var d = window.planbook.store.getDoc(), T = window.planbook.termRecord;
  var cls = d.classes.filter(function(x){ return x.id === '${N}'; })[0];
  var list = T.termsNeedingRecord(d, cls), newest = T.newestNeedOf(cls, list);
  return { list: list.map(function(n){ return [n.termId, n.state]; }), newest: newest ? newest.termId : null }; })()`);
await home();
await notYet();
const bar2 = await homeBar();
await clickSel('#termRecordHomeNag [data-term-record-home="' + N + '"]');
const landed2 = await settle();
const classBar2 = await evalJs(`Array.prototype.map.call(document.querySelectorAll('#termRecordNag [data-term-record-open]'),
  function(b){ return b.getAttribute('data-term-record-open'); })`);
await notYet();
check('WO-3.74: with the class\'s Quarter 1 never recorded and its Quarter 2 recorded and since changed, '
  + 'the home bar\'s button carries Quarter 2 — the engine\'s newest by term order, though its list leads '
  + 'with Quarter 1 — and lands on Quarter 2\'s Scores with Quarter 2\'s changed form open, while the '
  + 'class\'s own bar lists Quarter 1 first; the lead no longer names one quarter, since the two buttons '
  + 'open different ones',
  JSON.stringify(engine6.list) === JSON.stringify([[Q1, 'unrecorded'], [Q2, 'changed']])
    && engine6.newest === Q2
    && JSON.stringify(mine(bar2)) === JSON.stringify([[N, Q2, 'WO-3.74 Notice'], [O, OQ, 'WO-3.74 Other']])
    && (bar2.buttons.length !== 2 || bar2.text === '⚠ Grades need recording in 2 classes. WO-3.74 Notice has '
      + 'changed since it was recorded.')
    && landed2.view === 'scores' && landed2.cls === N && landed2.term === Q2 && landed2.open
    && landed2.title === 'Quarter 2’s grades have changed'
    && JSON.stringify(landed2.rows) === JSON.stringify([[S1, '85.00% B', '70.00% C']])
    && JSON.stringify(classBar2) === JSON.stringify([Q1, Q2]),
  JSON.stringify({ engine: engine6, bar: bar2, landed: landed2, classBar: classBar2 }));

/* Under a projector the home bar stays and names no student; its button lands with the dialog's
   refusal, as the class bar's does. */
await evalJs('(function(){ window.planbook.supports.setPresentationMode(true); return 1; })()');
await home();
const projBar = await homeBar();
await clickSel('#termRecordHomeNag [data-term-record-home="' + N + '"]');
const projLanded = await settle();
await notYet();
await evalJs('(function(){ window.planbook.supports.setPresentationMode(false); return 1; })()');
check('WO-3.74: in presentation mode the home bar stays up naming classes and no student, and its button '
  + 'lands on the class\'s Scores with the dialog\'s refusal, listing nobody',
  projBar.shown && NAMES.every((n) => projBar.all.indexOf(n) === -1)
    && projLanded.view === 'scores' && projLanded.open && projLanded.refused && projLanded.rows.length === 0,
  JSON.stringify({ bar: projBar.all, landed: projLanded }));

/* ── THE TRAPS, read off the source: the home bar is not a glance panel, and the notice stores nothing ──
   src/glance.js and src/home.js name nothing of the record; the notice's code — from the home bar to
   the end of src/term-record-view.js, comments out — writes no document, no preference, no storage. */
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '\n').replace(/^\s*\/\/.*$/gm, '');
const glance = strip(await fs.readFile(path.join(h.ROOT, 'src/glance.js'), 'utf8'));
const homeJs = strip(await fs.readFile(path.join(h.ROOT, 'src/home.js'), 'utf8'));
const view = (await fs.readFile(path.join(h.ROOT, 'src/term-record-view.js'), 'utf8')).replace(/\r\n/g, '\n');
const tail = strip(view.slice(Math.max(0, view.indexOf('export function termRecordHomeModel('))));
const REFUSED = ['update(', 'recordTerm(', 'setPref(', 'localStorage', 'sessionStorage', 'indexedDB', '.sort(', '.reverse('];
const tailHits = REFUSED.filter((t) => tail.indexOf(t) !== -1);
const glanceHits = ['term-record', 'termRecord', 'termsNeedingRecord', 'termRecordHomeNag']
  .filter((t) => glance.indexOf(t) !== -1 || homeJs.indexOf(t) !== -1);
check('WO-3.74: the home bar is not a glance panel and the notice stores nothing — src/glance.js and '
  + 'src/home.js name nothing of the record, and the home bar\'s and the notice\'s code calls no writer, '
  + 'no preference and no storage, and orders nothing (no update, recordTerm, setPref, localStorage, '
  + 'sessionStorage, indexedDB, sort or reverse)',
  tail.length > 200 && tailHits.length === 0 && glanceHits.length === 0,
  JSON.stringify({ tailFound: tail.length, tailHits: tailHits, glanceHits: glanceHits }));
} finally {
/* ── THE FIXTURE COMES BACK OUT ── */
await notYet();
await evalJs(`(async function(){
  var s = window.planbook.store;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${N}' && x.id !== '${O}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo374-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${N}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a374-') === 0) delete doc.scores[k]; });
    if (${plant.had ? 'true' : 'false'}) {
      doc.termRecords = (doc.termRecords || []).filter(function(e){ return e.classId !== '${N}' && e.classId !== '${O}'; });
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
  return { classes: d.classes.filter(function(x){ return x.id === '${N}' || x.id === '${O}'; }).length,
    students: d.students.filter(function(x){ return String(x.id).indexOf('wo374-') === 0; }).length,
    work: d.assignments.filter(function(a){ return a.classId === '${N}'; }).length,
    records: Object.prototype.hasOwnProperty.call(d, 'termRecords'),
    mode: window.planbook.supports.presentationMode() }; })()`);
check('the WO-3.74 fixture came back off the document, the termRecords key is as it was found, and '
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
