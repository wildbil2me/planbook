/* score-history.mjs — a changed score cell keeps what it was (WO-3.33)
 *
 * Every write to a score cell stamps `at`; a change five minutes or more after the cell's last write
 * pushes the cell as it was onto `was`; a change inside the five minutes replaces it. The grid marks a
 * cell that has a past, student detail lists the trail, and neither is in the DOM under presentation
 * mode. No grade reads `was`, and the backup carries it.
 *
 * THE FIVE MINUTES ARE CROSSED ON A CLOCK THIS SECTION MOVES. `--today` shifts the page by whole days
 * (verify-shell.mjs's SHIFT_PAGE_CLOCK), and the boundary wants minutes, so this section lays a second
 * proxy of the same shape over whatever `Date` the page already has — zero-argument construction and
 * `Date.now()` move by `window.__wo333Offset`, everything else forwards — and takes it off again at its
 * foot. Nothing in src/ reads a flag: the app cannot tell this clock from a teacher who came back to the
 * cell six minutes later.
 *
 * Every score is TYPED at the grid and every flag pressed as a key; window.planbook plants the fixture,
 * moves the clock, and READS — the document, the engine, the grade sheet, the signals and the backup.
 * It plants its own class, reloads at its head and its foot, takes the class back out, restores the
 * year's own pre-history backup over itself on the way, and hands the page back at 1280x900 with touch
 * off and presentation mode where it found it.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

console.log('\n--- a changed score cell keeps what it was (WO-3.33) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.scores && window.planbook.gradeEngine"
  + " && window.planbook.gradesReport && window.planbook.backup && window.planbook.detail"
  + " && window.planbook.supports && window.planbook.signals)"))) {
  skip('a changed score cell keeps what it was (WO-3.33)', 'window.planbook is missing one of scores, '
    + 'gradeEngine, gradesReport, backup, detail, supports or signals, so the document and the grades '
    + 'cannot be read back');
  return;
}

const CLS = 'c_wo333', TERM = 'tm333', CAT = 'k333';
const S1 = 'wo333-s1', S2 = 'wo333-s2', S3 = 'wo333-s3';
const A1 = 'a333-essay', A2 = 'a333-quiz', A3 = 'a333-hw';
const NOTE = 'Wo333NoteOnTheRevisedEssay';
const MIN = 60 * 1000;
const T_START = nodeDaysFromToday(-30), T_END = nodeDaysFromToday(60);

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

/* The movable clock. Laid over the page's own Date (which may already be --today's proxy), so the two
   offsets add; `window.__wo333Real` is what goes back at the foot. */
const CLOCK = `(function(){
  if (window.__wo333Real) return 1;
  var Prev = window.Date;
  window.__wo333Real = Prev;
  window.__wo333Offset = 0;
  window.Date = new Proxy(Prev, {
    construct: function(target, args, nt){
      return args.length ? Reflect.construct(target, args, nt)
        : Reflect.construct(target, [Prev.now() + window.__wo333Offset], nt);
    },
    apply: function(){ return new Prev(Prev.now() + window.__wo333Offset).toString(); },
    get: function(target, key, recv){
      if (key === 'now') return function(){ return Prev.now() + window.__wo333Offset; };
      return Reflect.get(target, key, recv);
    }
  });
  return 1; })()`;
/* Put the page's clock at `ms` after the instant the ISO stamp `at` names. */
const clockAt = (at, ms) => evalJs(`(function(){
  var target = window.__wo333Real.parse(${JSON.stringify(at)}) + ${ms};
  window.__wo333Offset = target - window.__wo333Real.now();
  return new Date().getTime() - target; })()`);
const clockNow = () => evalJs('(function(){ window.__wo333Offset = 0; return 1; })()');

/* ── THE FIXTURE ── one weighted class, three students, three pieces of work.
     Ada Apple  Essay 72 (no `at` — written before this build) · Quiz MISSING (no `at`) · Homework blank
     Ben Birch  Essay 90, stamped ten minutes ago               · Quiz 7 (no `at`)      · Homework blank
     Cy Cole    Essay 70 (no `at`)                              · nothing else
   Grid order is surname order, so Apple, Birch, Cole top to bottom. */
const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var mode = window.planbook.supports.presentationMode();
  window.planbook.supports.setPresentationMode(false);
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var t = new Date(Date.now() - 10 * 60 * 1000), off = -t.getTimezoneOffset(), abs = Math.abs(off);
  var tenAgo = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()) + 'T' + pad(t.getHours())
    + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds()) + (off < 0 ? '-' : '+') + pad(Math.floor(abs / 60))
    + ':' + pad(abs % 60);
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id:'${S1}', first:'Ada', last:'Apple' }, { id:'${S2}', first:'Ben', last:'Birch' },
      { id:'${S3}', first:'Cy', last:'Cole' });
    doc.classes.push({ id:'${CLS}', name:'WO-3.33 History', archived:false, letterScale:null,
      roster:['${S3}','${S1}','${S2}'],
      terms:[{ id:'${TERM}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'${CAT}', name:'All work', weight:100 }]});
    var add = function(id, name, points){
      doc.assignments.push({ id:id, classId:'${CLS}', termId:'${TERM}', categoryId:'${CAT}',
        name:name, points:points, assigned:'${T_START}', due:'${nodeDaysFromToday(20)}' });
    };
    add('${A1}', 'WO-3.33 Essay', 100);
    add('${A2}', 'WO-3.33 Quiz', 10);
    add('${A3}', 'WO-3.33 Homework', 10);
    doc.scores['${A1}'] = { '${S1}': { v:72 }, '${S2}': { v:90, at: tenAgo }, '${S3}': { v:70 } };
    doc.scores['${A2}'] = { '${S1}': { v:null, flag:'missing' }, '${S2}': { v:7 } };
  });
  c.selectClass('${CLS}'); c.selectTerm('${TERM}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, mode: mode, open: c.getOpenTermId('${CLS}'), tenAgo: tenAgo };
})()`);

if (!plant.ok || plant.open !== TERM) {
  check('the WO-3.33 fixture is real: one class of three, open on its term', false, JSON.stringify(plant));
  return;
}
await evalJs(CLOCK);

/* THE FILE AN EARLIER BUILD WROTE: this year as it stands, with every `at` and `was` taken off every
   score cell in it — which is exactly the shape a backup had before this work order, since nothing
   wrote either key. Taken through the backup module's own writer, before a single revision. */
const before = await evalJs(`(async function(){
  var built = await window.planbook.backup.buildBackup();
  var raw = JSON.parse(built.text);
  Object.keys(raw.scores || {}).forEach(function(a){ Object.keys(raw.scores[a] || {}).forEach(function(s){
    var cell = raw.scores[a][s];
    if (cell && typeof cell === 'object') { delete cell.at; delete cell.was; } }); });
  var text = JSON.stringify(raw, null, 2);
  var scores = JSON.stringify(raw.scores);
  return { text: text, scores: scores, keys: (scores.match(/"(at|was)"/g) || []).length }; })()`);

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
  end: () => sk('End', 'End', 35),
  letter: (L) => sk(L, 'Key' + L.toUpperCase(), L.toUpperCase().charCodeAt(0), L),
  digit: (d) => sk(d, 'Digit' + d, d.charCodeAt(0), d),
  dot: () => sk('.', 'Period', 190, '.'),
};
/* Into a cell with its value selected — which is what every arrival leaves — and a number typed over
   it one key at a time, so the store sees every keystroke the way a teacher's would arrive. */
const focusSelected = (a, s) => evalJs('(function(){ var i = document.querySelector('
  + JSON.stringify(cellSel(a, s)) + '); i.focus(); i.select(); return 1; })()');
const typeOver = async (a, s, digits) => {
  await focusSelected(a, s);
  for (const d of digits) await KEY.digit(d);
};
const cell = async (a, s) => (await evalJs(`(async function(){
  await window.planbook.store.flush();
  var col = window.planbook.store.getDoc().scores['${a}'];
  return col && Object.prototype.hasOwnProperty.call(col, '${s}') ? JSON.stringify(col['${s}']) : 'null'; })()`));
const parsed = async (a, s) => JSON.parse(await cell(a, s));
const ISO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

await openGrid();

/* ── ACCEPTANCE LINE 1: a change five minutes or more after the last write pushes ──
   Ada's essay was written before this build — no `at` — so it always pushes. "88" is two keystrokes:
   the first pushes the 72, and the second lands inside the five minutes the first just started, so a
   version is a commit and not a key. */
await typeOver(A1, S1, '88');
const first = await parsed(A1, S1);
check('WO-3.33: typing 88 over a cell written before this build (72, no `at`) pushes { v: 72 } onto '
  + '`was` ONCE — two keystrokes, one version — and the cell carries a new local `at` with its offset',
  first.v === 88 && ISO_LOCAL.test(first.at || '') && Array.isArray(first.was) && first.was.length === 1
    && JSON.stringify(first.was[0]) === JSON.stringify({ v: 72 }),
  JSON.stringify(first));

/* Ben's essay was stamped ten minutes ago, and its change is a NOTE — the panel, typed. Acceptance
   line 1 says score, flag OR note. */
await evalJs(`(function(){ var i = document.querySelector('${cellSel(A1, S2)}'); i.focus(); return 1; })()`);
await clickSel('#scoresFlags [data-score-note-open]');
await send('Input.insertText', { text: NOTE });
await sleep(120);
await clickSel('#scoresNote [data-score-note-done]');
const noted = await parsed(A1, S2);
check('WO-3.33: a note added ten minutes after Ben\'s 90 was written pushes the cell as it was — '
  + '{ v: 90, at } with its own `at` — once for the whole sentence typed, and the cell carries the note and '
  + 'a new `at`',
  noted.v === 90 && noted.note === NOTE && ISO_LOCAL.test(noted.at || '') && noted.at !== plant.tenAgo
    && Array.isArray(noted.was) && noted.was.length === 1
    && JSON.stringify(noted.was[0]) === JSON.stringify({ v: 90, at: plant.tenAgo }),
  JSON.stringify(noted));

/* Ada's quiz — missing, no `at`. A typed 7 takes `missing` off (WO-3.5's rule) and pushes it; L inside
   the five minutes replaces; and a 9 typed six minutes later pushes the late 7 with its `at`. */
await typeOver(A2, S1, '7');
await KEY.letter('l');
const lateSeven = await parsed(A2, S1);
await clockAt(lateSeven.at, 6 * MIN);
await typeOver(A2, S1, '9');
const quiz = await parsed(A2, S1);
await clockNow();
check('WO-3.33: Missing → Late, 7 → Late, 9 — the missing flag is pushed by the typed 7, L inside the '
  + 'five minutes replaces rather than pushing, and a score typed six minutes later pushes the late 7 '
  + 'with its `at`; the whole cell is the history, flags and all',
  JSON.stringify(quiz.was) === JSON.stringify([{ v: null, flag: 'missing' },
    { v: 7, flag: 'late', at: lateSeven.at }])
    && quiz.v === 9 && quiz.flag === 'late' && ISO_LOCAL.test(quiz.at || '') && quiz.at !== lateSeven.at,
  JSON.stringify({ lateSeven: lateSeven, now: quiz }));

/* ── ACCEPTANCE LINE 2: either side of the boundary, on the moved clock ──
   4m55s after Ada's essay was stamped, 85 replaces the 88 and pushes nothing; 5m05s after THAT stamp,
   90 pushes the 85. */
const inside = await clockAt(first.at, 4 * MIN + 55 * 1000);
await typeOver(A1, S1, '85');
const replaced = await parsed(A1, S1);
const outside = await clockAt(replaced.at, 5 * MIN + 5 * 1000);
await typeOver(A1, S1, '90');
const pushed = await parsed(A1, S1);
await clockNow();
check('WO-3.33: 4m55s after the last write, 85 REPLACES the 88 — `was` still only the 72, a new `at` — '
  + 'and 5m05s after that, 90 PUSHES the 85 with its `at`: the five-minute rule, checked on the page\'s '
  + 'own moved clock either side of the boundary',
  replaced.v === 85 && JSON.stringify(replaced.was) === JSON.stringify([{ v: 72 }])
    && replaced.at !== first.at
    && pushed.v === 90 && JSON.stringify(pushed.was) === JSON.stringify([{ v: 72 }, { v: 85, at: replaced.at }])
    && pushed.at !== replaced.at && Math.abs(inside) < 1000 && Math.abs(outside) < 1000,
  JSON.stringify({ replaced: replaced, pushed: pushed, clockSkew: [inside, outside] }));

/* A WRITE THAT CHANGES NOTHING: `.` after the 90 reads as 90, and so does the 90 typed over itself
   twelve minutes on — the first is refused outright, the second pushes on `9` and takes the push
   back on `90`. Both leave the cell byte for byte as it was: no push, no restamp. */
const settled = await cell(A1, S1);
await focusSelected(A1, S1);
await KEY.end();
await KEY.dot();
const afterDot = await cell(A1, S1);
await KEY.back();
await clockAt(pushed.at, 12 * MIN);
await typeOver(A1, S1, '90');
const afterRetype = await cell(A1, S1);
await clockNow();
check('WO-3.33: a write that changes nothing is not a write — "90." over a 90, and 90 retyped over itself '
  + 'twelve minutes later, each leave the cell byte-identical: nothing pushed and nothing restamped',
  afterDot === settled && afterRetype === settled, JSON.stringify({ settled: settled, afterDot: afterDot,
    afterRetype: afterRetype }));

/* ── ACCEPTANCE LINE 5: the marks on the grid, and under the projector ── */
await openGrid();
const MARKS = `(function(){
  var out = {};
  Array.prototype.forEach.call(document.querySelectorAll('#scoresBody [data-score-cell]'), function(i){
    var w = i.parentElement, h = w.querySelector('.scores-history-mark'), n = w.querySelector('.scores-note-mark');
    var key = i.getAttribute('data-score-cell') + '/' + i.getAttribute('data-score-student');
    var r = function(e){ if (!e) return null; var b = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height),
        radius: cs.borderTopLeftRadius, color: cs.borderTopColor, hidden: e.getAttribute('aria-hidden') }; };
    out[key] = { history: r(h), note: r(n), cell: (function(){ var b = i.getBoundingClientRect();
      return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; })(),
      label: i.getAttribute('aria-label') || '', title: i.getAttribute('title') || '' };
  });
  return out; })()`;
const marks = await evalJs(MARKS);
const withHistory = Object.keys(marks).filter((k) => marks[k].history).sort();
const both = marks[A1 + '/' + S2] || {};
const told = both.history && both.note
  && both.note.y < both.history.y && both.note.x < both.history.x
  && both.note.radius !== both.history.radius && both.note.color !== both.history.color
  && both.history.hidden === 'true' && both.note.hidden === 'true';
check('WO-3.33: exactly the three cells with a past wear the history mark — Ada\'s essay and quiz, Ben\'s '
  + 'essay — and the six without do not; each says "has earlier versions" in its accessible name and '
  + 'nothing else does',
  JSON.stringify(withHistory) === JSON.stringify([A1 + '/' + S1, A1 + '/' + S2, A2 + '/' + S1].sort())
    && Object.keys(marks).length === 9
    && Object.keys(marks).every((k) => /has earlier versions/.test(marks[k].label) === !!marks[k].history),
  JSON.stringify({ withHistory: withHistory, labels: Object.keys(marks).map((k) => k + ': ' + marks[k].label) }));
check('WO-3.33: Ben\'s essay carries a note AND a past and shows both marks, told apart — the note a '
  + 'corner at the top left, the history a ring at the bottom right, in different shapes and colours, '
  + 'both aria-hidden — and its name and tooltip carry both clauses',
  !!told && /has a note, has earlier versions$/.test(both.label)
    && both.title.indexOf('Note: ' + NOTE) === 0 && /Changed since it was first entered/.test(both.title),
  JSON.stringify(both));

await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
await sleep(300);
const DETAIL = `(function(){
  var v = document.getElementById('detailView');
  var card = v.querySelector('[data-score-history-card]');
  var rows = card ? Array.prototype.map.call(card.querySelectorAll('[data-score-history-row]'), function(r){
    return { id: r.getAttribute('data-score-history-row'),
      name: (r.querySelector('.detail-missing-name') || {}).textContent || '',
      steps: Array.prototype.map.call(r.querySelectorAll('[data-score-history-step]'), function(s){ return s.textContent; }),
      now: (r.querySelector('.detail-history-step.now') || {}).textContent || '' }; }) : [];
  return { up: !v.classList.contains('hidden'), card: !!card,
    logCard: !!card && card.classList.contains('log-card'), rows: rows, html: v.innerHTML,
    csv: window.planbook.detail.studentCsv(window.planbook.detail.detailModel()).text }; })()`;

/* `Sep 14` from an `at`, read off the stamp's own date the way src/date-text.js reads an ISO day. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (at) => ' (' + MON[Number(at.slice(5, 7)) - 1] + ' ' + Number(at.slice(8, 10)) + ')';
const essay = JSON.parse(settled);

/* ── ACCEPTANCE LINE 4: the trail, in order, with dates ── */
const det = await evalJs(DETAIL);
const expectRows = [
  { id: A1, name: 'WO-3.33 Essay', steps: ['72 (undated)', '85' + day(essay.was[1].at), '90' + day(essay.at)] },
  { id: A2, name: 'WO-3.33 Quiz', steps: ['Missing (undated)', 'Late, 7' + day(quiz.was[1].at),
    'Late, 9' + day(quiz.at)] },
];
check('WO-3.33: student detail lists Ada\'s two changed scores under their assignments in the grid\'s '
  + 'column order, each trail oldest first with its dates and ending on what counts now — 72 (undated) → '
  + '85 → 90, and Missing (undated) → Late, 7 → Late, 9 — on a card wearing .log-card, the print gate',
  det.up && det.card && det.logCard
    && JSON.stringify(det.rows.map((r) => ({ id: r.id, name: r.name, steps: r.steps })))
      === JSON.stringify(expectRows)
    && det.rows.every((r) => r.now === r.steps[r.steps.length - 1]),
  JSON.stringify({ rows: det.rows, expect: expectRows }));
check('WO-3.33: and the student report\'s CSV carries none of it — no earlier score, no "undated"',
  det.csv.length > 50 && det.csv.indexOf('undated') === -1 && det.csv.indexOf('Late, 7') === -1,
  det.csv.length + ' characters of CSV');

/* "A cell with no history shows nothing extra": Ben's quiz (7, never changed) has no row on his card,
   and Cy, whose cells were never changed at all, has no card. */
await openGrid();
await clickSel('#scoresBody [data-student-detail="' + S2 + '"]');
await sleep(300);
const ben = await evalJs(DETAIL);
await openGrid();
await clickSel('#scoresBody [data-student-detail="' + S3 + '"]');
await sleep(300);
const cy = await evalJs(DETAIL);
check('WO-3.33: a cell with no history shows nothing extra — Ben\'s card lists his essay and not his '
  + 'unchanged quiz, and Cy, whose scores never changed, has no history card at all',
  ben.card && JSON.stringify(ben.rows.map((r) => r.id)) === JSON.stringify([A1])
    && ben.rows[0].steps.length === 2 && /^90 \(/.test(ben.rows[0].steps[0])
    && cy.up && !cy.card && cy.html.indexOf('data-score-history') === -1,
  JSON.stringify({ ben: ben.rows, cyCard: cy.card }));

/* ── ACCEPTANCE LINE 5, the projector: through the header's own control ── */
await openGrid();
await clickSel('#presentationBtn');
await sleep(250);
const LEAK = `(function(){
  var html = document.documentElement.outerHTML;
  var labels = Array.prototype.map.call(document.querySelectorAll('[aria-label],[title]'), function(e){
    return (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || ''); }).join('\\n');
  return { on: window.planbook.supports.presentationMode(),
    marks: document.querySelectorAll('.scores-history-mark').length,
    markInHtml: html.indexOf('scores-history-mark') !== -1,
    clause: /has earlier versions/.test(labels), tip: /Changed since/.test(labels),
    card: html.indexOf('data-score-history') !== -1, trail: /\\(undated\\)|Late, 7/.test(html),
    cells: document.querySelectorAll('#scoresBody [data-score-cell]').length,
    gridUp: !document.getElementById('scoresView').classList.contains('hidden'),
    detailUp: !document.getElementById('detailView').classList.contains('hidden') }; })()`;
const projGrid = await evalJs(LEAK);
await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
await sleep(300);
const projDetail = await evalJs(LEAK);
await clickSel('#presentationBtn');
await sleep(250);
const backDetail = await evalJs(DETAIL);
await openGrid();
const backGrid = await evalJs(LEAK);
check('WO-3.33: in presentation mode neither the history mark nor the trail is in the DOM — no mark, no '
  + 'class name anywhere in the page, no "has earlier versions" and no tooltip on the grid; no card and no '
  + 'step on student detail — and switched off again both are back, so the absence was the mode',
  projGrid.on && projGrid.gridUp && projGrid.cells === 9 && projGrid.marks === 0 && !projGrid.markInHtml
    && !projGrid.clause && !projGrid.tip
    && projDetail.on && projDetail.detailUp && !projDetail.card && !projDetail.trail
    && backDetail.card && backDetail.rows.length === 2 && !backGrid.on && backGrid.marks === 3 && backGrid.clause,
  JSON.stringify({ grid: projGrid, detail: projDetail, back: { card: backDetail.card, marks: backGrid.marks } }));

/* ── ACCEPTANCE LINE 3: every grade, with and without `was` ──
   The grid's grade cells and summary, the engine asked directly, the grade sheet's record, the signal
   evaluation and student detail's hero and breakdown for all three students — read, then read again
   with every `was` in the year taken off, then put back. */
const GRADES = `(async function(){
  var p = window.planbook, d = p.store.getDoc();
  var cls = d.classes.filter(function(c){ return c.id === '${CLS}'; })[0];
  var out = { grid: Array.prototype.map.call(document.querySelectorAll('#scoresBody tr[data-score-row]'),
      function(r){ return r.getAttribute('data-score-row') + '=' + (r.querySelector('.scores-grade') || {}).textContent; }),
    summary: (document.getElementById('scoresSummary') || {}).textContent || '',
    engine: ['${S1}','${S2}','${S3}'].map(function(id){ var g = p.gradeEngine.classGrade(d, cls, '${TERM}', id);
      return id + '=' + g.percentage + '/' + g.letter; }),
    sheet: JSON.stringify(p.gradesReport.gradesRecord()),
    signals: JSON.stringify(p.signals.evaluate(d, cls, '${TERM}')), detail: [] };
  ['${S1}','${S2}','${S3}'].forEach(function(id){
    p.detail.openDetail(id); p.detail.renderDetail();
    var v = document.getElementById('detailView');
    out.detail.push(id + '=' + ((v.querySelector('.detail-hero-grade') || {}).textContent || '') + '|'
      + ((v.querySelector('.detail-break') || {}).textContent || ''));
  });
  return out; })()`;
const STRIP = `(async function(){
  var s = window.planbook.store, held = {};
  s.update(function(doc){ Object.keys(doc.scores || {}).forEach(function(a){
    Object.keys(doc.scores[a] || {}).forEach(function(st){ var c = doc.scores[a][st];
      if (c && typeof c === 'object' && c.was) { held[a + '|' + st] = c.was; delete c.was; } }); }); });
  window.__wo333Held = held;
  return Object.keys(held).length; })()`;
const PUT_BACK = `(async function(){
  var s = window.planbook.store, held = window.__wo333Held || {};
  s.update(function(doc){ Object.keys(held).forEach(function(k){ var p = k.split('|');
    doc.scores[p[0]][p[1]].was = held[p[0] + '|' + p[1]]; }); });
  delete window.__wo333Held; await s.flush(); return Object.keys(held).length; })()`;
await openGrid();
const withWas = await evalJs(GRADES);
await openGrid();
const stripped = await evalJs(STRIP);
await openGrid();
const withoutWas = await evalJs(GRADES);
await evalJs(PUT_BACK);
await openGrid();
const afterPut = await parsed(A1, S1);
check('WO-3.33: every grade on every screen is byte-identical to the same document with every `was` '
  + 'removed — the grid\'s grade cells and summary, the engine, the grade sheet\'s record, the signal '
  + 'evaluation, and student detail\'s hero and breakdown for all three students — over a year where three '
  + 'cells have a past and Ada\'s essay was 72 before it was 90',
  stripped >= 3 && JSON.stringify(withWas) === JSON.stringify(withoutWas) && withWas.engine.length === 3
    && withWas.detail.length === 3 && withWas.grid.length === 3
    && JSON.stringify(afterPut.was) === JSON.stringify(essay.was),
  JSON.stringify({ stripped: stripped, withWas: withWas.engine, withoutWas: withoutWas.engine,
    gridWith: withWas.grid, gridWithout: withoutWas.grid,
    differs: Object.keys(withWas).filter((k) => JSON.stringify(withWas[k]) !== JSON.stringify(withoutWas[k])) }));

/* ── ACCEPTANCE LINE 6: the backup, both ways ── */
const files = await evalJs(`(async function(){
  var b = window.planbook.backup;
  var content = function(doc){ var c = Object.assign({}, doc); delete c.rev; delete c.updatedAt; return JSON.stringify(c); };
  var withHistory = await b.buildBackup();
  var parsed = b.parseBackup(withHistory.text, 'with-history.json').doc;
  var older = b.parseBackup(${JSON.stringify(before.text)}, 'older.json').doc;
  return { text: withHistory.text,
    carries: JSON.stringify(JSON.parse(withHistory.text).scores['${A1}']['${S1}']),
    parsedSame: content(parsed) === content(JSON.parse(withHistory.text)),
    parsedCell: JSON.stringify(parsed.scores['${A1}']['${S1}']),
    olderSame: content(older) === content(JSON.parse(${JSON.stringify(before.text)})),
    olderKeys: (JSON.stringify(older.scores).match(/"(at|was)"/g) || []).length }; })()`);
check('WO-3.33: a backup in the shape written before this build — no `at`, no `was` on any cell — parses '
  + 'back identical in content with neither key added, and a year with history is written into the file '
  + 'and parsed back with Ada\'s essay\'s whole past on it',
  before.keys === 0 && files.olderSame && files.olderKeys === 0 && files.parsedSame
    && files.carries === settled && files.parsedCell === settled,
  JSON.stringify({ olderSame: files.olderSame, olderKeys: files.olderKeys, parsedSame: files.parsedSame,
    carries: files.carries === settled, parsedCell: files.parsedCell === settled }));

const readDisk = `(async function(){ var s = window.planbook.store;
  var year = s.getDoc().year;
  var stored = await new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){ var db = open.result;
      var q = db.transaction('years','readonly').objectStore('years').get(year);
      q.onsuccess = function(){ res(q.result); db.close(); };
      q.onerror = function(){ rej(q.error); }; }; });
  return { scores: JSON.stringify(stored.scores),
    essay: stored.scores['${A1}'] ? JSON.stringify(stored.scores['${A1}']['${S1}']) : null,
    confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') }; })()`;
await evalJs(`(async function(){
  await window.planbook.backup.restoreFromText(${JSON.stringify(files.text)}, 'Planbook history.json'); return 1; })()`);
await clickSel('[data-backup-confirm]');
await sleep(600);
const roundTrip = await evalJs(readDisk);
check('WO-3.33: a year with history round-trips through the real restore — on disk afterwards Ada\'s essay '
  + 'is byte-identical to the cell that went into the file, `was` and `at` and all',
  !roundTrip.confirmOpen && roundTrip.essay === settled,
  JSON.stringify({ essay: roundTrip.essay, settled: settled, confirmOpen: roundTrip.confirmOpen }));

await evalJs(`(async function(){
  await window.planbook.backup.restoreFromText(${JSON.stringify(before.text)}, 'Planbook before history.json'); return 1; })()`);
await clickSel('[data-backup-confirm]');
await sleep(600);
const unchanged = await evalJs(readDisk);
check('WO-3.33: and the backup in the earlier shape restores unchanged — every score cell on disk is the '
  + 'file\'s, byte for byte, and not one carries `at` or `was`',
  !unchanged.confirmOpen && unchanged.scores === before.scores
    && (unchanged.scores.match(/"(at|was)"/g) || []).length === 0,
  unchanged.scores === before.scores ? 'score map identical to the file (' + before.scores.length + ' chars)'
    : 'DIFFERS: ' + unchanged.scores.slice(0, 300));

/* WO-3.52, ACCEPTANCE LINE 5: that same earlier-shape file, now on disk, holds no column — every
   assignment in it reads live through the engine's one reader of `held`, and none carries the key. */
const restoredLive = await evalJs(`(function(){ var g = window.planbook.gradeEngine;
  var all = window.planbook.store.getDoc().assignments || [];
  return { n: all.length, ours: all.filter(function(a){ return a.classId === '${CLS}'; }).length,
    held: all.filter(function(a){ return g.isHeld(a); }).length,
    keyed: all.filter(function(a){ return Object.prototype.hasOwnProperty.call(a, 'held')
      || Object.prototype.hasOwnProperty.call(a, 'committedAt'); }).length }; })()`);
check('WO-3.52: a document written before this build restores with every column live — after the '
  + 'earlier-shape file above, isHeld() is false for every assignment on the page and none carries '
  + '`held` or `committedAt`',
  restoredLive.ours === 3 && restoredLive.n >= 3 && restoredLive.held === 0 && restoredLive.keyed === 0,
  JSON.stringify(restoredLive));

/* ── A HELD COLUMN KEEPS NO HISTORY, IN reviseCell() ITSELF (WO-3.52) ──
   reviseCell() is pure, so these are asked of the module the page already loaded — a dynamic import of
   the same URL hands back the same instance — with every `now` an explicit Date and every stored `at`
   a literal stamp. Nothing here goes through the grid: no build can hold a column yet. A fresh stamp's
   text depends on the browser's zone, so each result is normalised before it is compared — an `at`
   naming exactly the `now` of that call reads as "NOW" — and every expectation below is a literal. */
const history352 = await evalJs(`(async function(){
  var m = await import(new URL('src/score-history.js', document.baseURI).href);
  var rc = m.reviseCell;
  var T = function(s){ return new Date(s); };
  var norm = function(r, now){
    return JSON.parse(JSON.stringify(r, function(k, v){
      return k === 'at' && typeof v === 'string' && Date.parse(v) === now.getTime() ? 'NOW' : v; })); };
  var ask = function(old, next, now, column){
    return arguments.length < 4 ? norm(rc(old, next, now), now) : norm(rc(old, next, now, column), now); };
  var out = {};

  /* Line 6: the rule with no fourth argument, case by case — the cases WO-3.33's checks above drive
     through the grid, asked directly — and the same answer with undefined, {} and a live column. */
  var N = T('2026-10-07T10:00:00-04:00');
  var cases = [
    [null, { v: 72 }],
    [null, { v: null }],
    [{ v: 72 }, { v: 88 }],
    [{ v: 72, at: '2026-10-07T09:50:00-04:00' }, { v: 88 }],
    [{ v: 72, at: '2026-10-07T09:55:01-04:00' }, { v: 88 }],
    [{ v: 72, at: '2026-10-07T09:55:00-04:00' }, { v: 88 }],
    [{ v: 72, at: '2026-10-07T09:50:00-04:00' }, { v: 72 }],
    [{ v: 7, at: '2026-10-07T09:59:00-04:00', was: [{ v: 72, at: '2026-10-01T08:00:00-04:00' }] }, { v: 72 }],
    [{ v: 88, at: '2026-10-07T09:50:00-04:00', was: [{ v: 72 }] }, { v: null }],
    [{ v: 88, at: '2026-10-07T09:59:00-04:00' }, { v: null }],
    [{ v: null, flag: 'missing' }, { v: 7, flag: 'late', note: 'x' }]];
  out.noArg = cases.map(function(c){ return ask(c[0], c[1], N); });
  out.sameEveryWay = cases.every(function(c){
    var a = JSON.stringify(ask(c[0], c[1], N));
    return a === JSON.stringify(ask(c[0], c[1], N, undefined))
      && a === JSON.stringify(ask(c[0], c[1], N, {}))
      && a === JSON.stringify(ask(c[0], c[1], N, { held: false })); });

  /* Line 2: first typed while held — at 9:00, a minute after the hold at 8:59 — and edited three times
     ten minutes apart, each far outside the window, so a live column would push every time; then
     committed and edited six minutes after the commit. */
  var H = { held: true, heldAt: '2026-10-07T08:59:00-04:00' };
  var c0 = rc(null, { v: 70 }, T('2026-10-07T09:00:00-04:00'), H).cell;
  var c1 = rc(c0, { v: 72 }, T('2026-10-07T09:10:00-04:00'), H).cell;
  var c2 = rc(c1, { v: 75, flag: 'late' }, T('2026-10-07T09:20:00-04:00'), H).cell;
  var c3 = rc(c2, { v: 78 }, T('2026-10-07T09:30:00-04:00'), H).cell;
  out.heldThree = [c1, c2, c3].map(function(c){ return Object.prototype.hasOwnProperty.call(c, 'was'); });
  out.heldLast = { v: c3.v, at: Date.parse(c3.at) === T('2026-10-07T09:30:00-04:00').getTime() };
  var l1 = rc(c0, { v: 72 }, T('2026-10-07T09:10:00-04:00')).cell;
  var l2 = rc(l1, { v: 75, flag: 'late' }, T('2026-10-07T09:20:00-04:00')).cell;
  var l3 = rc(l2, { v: 78 }, T('2026-10-07T09:30:00-04:00')).cell;
  out.liveThree = (l3.was || []).length;
  var committed = { committedAt: '2026-10-07T09:31:00-04:00' };
  var after = T('2026-10-07T09:37:00-04:00');
  out.afterCommit = norm(rc(c3, { v: 80 }, after, committed), after);
  out.c3at = c3.at;

  /* Line 3, Ruling 1: typed at T while held, committed at T+2m, changed at T+3m. */
  var r0 = rc(null, { v: 72 }, T('2026-10-07T09:00:00-04:00'), H).cell;
  var r1At = T('2026-10-07T09:03:00-04:00');
  var r1 = rc(r0, { v: 75 }, r1At, { held: false, committedAt: '2026-10-07T09:02:00-04:00' });
  out.ruling1 = norm(r1, r1At);
  out.ruling1Typed = r0.at;
  /* and the window resumes from the post-commit write: a minute later is a correction of the 75. */
  var r2At = T('2026-10-07T09:04:00-04:00');
  out.ruling1Then = norm(rc(r1.cell, { v: 76 }, r2At, { committedAt: '2026-10-07T09:02:00-04:00' }), r2At);

  /* Line 4, Ruling 2 as amended 2026-10-08: a live 88, typed at 8:58 over a two-version trail — one
     earlier version deliberately in a key order this file would never write, so a trail rebuilt through
     versionOf() would read differently — held at 9:00 and edited three times: at 9:01, three minutes
     after the 88's own at, so a live column would REPLACE (the control below proves it does); at 9:02;
     and at 9:20, which a live column would push. The first pushes the 88; the other two push nothing. */
  var HR = { held: true, heldAt: '2026-10-07T09:00:00-04:00' };
  var trail = [{ at: '2026-09-14T09:10:00-04:00', v: null, flag: 'missing' },
    { v: 70, flag: 'late', note: 'n', at: '2026-09-20T15:31:40-04:00' }];
  var live = { v: 88, at: '2026-10-07T08:58:00-04:00', was: JSON.parse(JSON.stringify(trail)) };
  var e1 = rc(live, { v: 90 }, T('2026-10-07T09:01:00-04:00'), HR).cell;
  var e2 = rc(e1, { v: 70, flag: 'late', note: 'n' }, T('2026-10-07T09:02:00-04:00'), HR).cell;
  var e3 = rc(e2, { v: 92 }, T('2026-10-07T09:20:00-04:00'), HR).cell;
  out.ruling2 = [e1, e2, e3].map(function(c){ return JSON.stringify(c.was); });
  out.ruling2Want = JSON.stringify(trail.concat([{ v: 88, at: '2026-10-07T08:58:00-04:00' }]));
  /* The control: the same edit on a live column replaces the 88 and pushes nothing, so the trail keeps
     its two versions (re-read through versionOf(), which is why it is counted rather than compared). */
  out.ruling2Live = rc(live, { v: 90 }, T('2026-10-07T09:01:00-04:00')).cell.was.length;
  out.ruling2Trail = JSON.stringify(trail);
  /* A blank as the first held edit pushes the same way, and the cell is kept as a blank carrying it. */
  var bAt = T('2026-10-07T09:01:00-04:00');
  out.ruling2Blank = norm(rc(live, { v: null }, bAt, HR), bAt);
  /* Committed at 9:30 and changed at 9:31: the trail shows the pre-hold 88, and the committed 92 is pushed. */
  var cAt = T('2026-10-07T09:31:00-04:00');
  out.ruling2Commit = norm(rc(e3, { v: 95 }, cAt,
    { held: false, heldAt: HR.heldAt, committedAt: '2026-10-07T09:30:00-04:00' }), cAt);
  out.e3at = e3.at;

  /* The hold boundary's edges, each against the 9:00 hold above and each edited at 9:00:30 — inside
     every window. The same second counts as before; one second later is a held version; a missing at
     counts as before; a missing heldAt means nothing was there first; a flag with no number counted,
     and a note alone did not. */
  var mid = T('2026-10-07T09:00:30-04:00');
  var edge = function(old, column){ return norm(rc(old, { v: 75 }, mid, column || HR), mid); };
  out.edges = {
    sameSecond: edge({ v: 72, at: '2026-10-07T09:00:00-04:00' }),
    secondAfter: edge({ v: 72, at: '2026-10-07T09:00:01-04:00' }),
    noAt: edge({ v: 72 }),
    noHeldAt: edge({ v: 72, at: '2026-10-07T08:58:00-04:00' }, { held: true }),
    missing: edge({ v: null, flag: 'missing', at: '2026-10-07T08:58:00-04:00' }),
    excused: edge({ v: null, flag: 'excused', at: '2026-10-07T08:58:00-04:00' }),
    noteOnly: edge({ v: null, note: 'x', at: '2026-10-07T08:58:00-04:00' }),
    /* and Ruling 1's boundary the same way: a cell stamped in the very second of the commit is pushed. */
    commitSecond: edge({ v: 72, at: '2026-10-07T09:00:00-04:00' }, { committedAt: '2026-10-07T09:00:00-04:00' }) };
  /* A held cell blanked with no past and nothing to push is deleted, as today; a held write that changes
     nothing is none. Both cells were typed after the 8:59 hold. */
  out.heldBlank = JSON.stringify(rc({ v: 72, at: '2026-10-07T09:00:00-04:00' }, { v: null },
    T('2026-10-07T09:10:00-04:00'), H));
  out.heldSame = JSON.stringify(rc({ v: 72, at: '2026-10-07T09:00:00-04:00' }, { v: 72 },
    T('2026-10-07T09:10:00-04:00'), H));
  return out; })()`);

const NO_ARG = [
  { write: true, cell: { v: 72, at: 'NOW' } },
  { write: false },
  { write: true, cell: { v: 88, at: 'NOW', was: [{ v: 72 }] } },
  { write: true, cell: { v: 88, at: 'NOW', was: [{ v: 72, at: '2026-10-07T09:50:00-04:00' }] } },
  { write: true, cell: { v: 88, at: 'NOW' } },
  { write: true, cell: { v: 88, at: 'NOW', was: [{ v: 72, at: '2026-10-07T09:55:00-04:00' }] } },
  { write: false },
  { write: true, cell: { v: 72, at: '2026-10-01T08:00:00-04:00' } },
  { write: true, cell: { v: null, at: 'NOW', was: [{ v: 72 }, { v: 88, at: '2026-10-07T09:50:00-04:00' }] } },
  { write: true, cell: null },
  { write: true, cell: { v: 7, flag: 'late', note: 'x', at: 'NOW', was: [{ v: null, flag: 'missing' }] } }];
check('WO-3.52: reviseCell() with no fourth argument answers every case WO-3.33\'s rule covers exactly as '
  + 'before — first write, blank first write, no-`at` push, push at ten minutes, replace at 4m59s, push '
  + 'at exactly five, no-op, burst pop, cleared-with-past kept, cleared-without-past deleted, flag and '
  + 'note pushed whole — and `undefined`, `{}` and `{ held: false }` answer identically',
  JSON.stringify(history352.noArg) === JSON.stringify(NO_ARG) && history352.sameEveryWay === true,
  JSON.stringify({ noArg: history352.noArg, sameEveryWay: history352.sameEveryWay }));
check('WO-3.52: a cell first typed while held, a minute after the hold, and edited three times ten '
  + 'minutes apart carries no `was` — where the same three edits on a live column push three versions — '
  + 'and after the commit at 9:31 the first edit, six minutes later, pushes the committed 78 with its own `at`',
  JSON.stringify(history352.heldThree) === '[false,false,false]' && history352.heldLast.v === 78
    && history352.heldLast.at === true && history352.liveThree === 3
    && JSON.stringify(history352.afterCommit) === JSON.stringify(
      { write: true, cell: { v: 80, at: 'NOW', was: [{ v: 78, at: history352.c3at }] } }),
  JSON.stringify({ heldThree: history352.heldThree, liveThree: history352.liveThree,
    afterCommit: history352.afterCommit }));
check('WO-3.52, Ruling 1: a held cell typed at 9:00, committed at 9:02 and changed at 9:03 pushes the '
  + 'committed 72 onto `was` — the window is measured from the commit, not from when the 72 was typed — '
  + 'and a change a minute after that is a correction of the 75 and pushes nothing more',
  JSON.stringify(history352.ruling1) === JSON.stringify(
    { write: true, cell: { v: 75, at: 'NOW', was: [{ v: 72, at: history352.ruling1Typed }] } })
    && JSON.stringify(history352.ruling1Then) === JSON.stringify(
      { write: true, cell: { v: 76, at: 'NOW', was: [{ v: 72, at: history352.ruling1Typed }] } }),
  JSON.stringify({ ruling1: history352.ruling1, then: history352.ruling1Then }));
check('WO-3.52, Ruling 2 as amended: a live 88 over a two-version trail, held at 9:00 and edited at '
  + '9:01 — inside the 88\'s own window, where a live column replaces and keeps the trail as it was — '
  + 'pushes the 88 with the old trail byte for byte beneath it, and the edits at 9:02 and 9:20 push '
  + 'nothing more; a blank as the first held edit pushes the same way and is kept as a blank carrying it; '
  + 'committed at 9:30 and changed at 9:31, the trail shows the pre-hold 88 and then the committed 92',
  history352.ruling2Live === 2
    && history352.ruling2Want.indexOf(history352.ruling2Trail.slice(0, -1)) === 0
    && history352.ruling2.every((w) => w === history352.ruling2Want)
    && JSON.stringify(history352.ruling2Blank) === JSON.stringify(
      { write: true, cell: { v: null, at: 'NOW', was: JSON.parse(history352.ruling2Want) } })
    /* After the commit the write is a live one, and a live write re-reads the trail through
       versionOf() — WO-3.33's behaviour, unchanged — so the earlier versions come back in the order the
       data model writes a cell's keys. The VALUES are the stored trail's; only the key order moves. */
    && JSON.stringify(history352.ruling2Commit) === JSON.stringify({ write: true, cell: { v: 95, at: 'NOW',
      was: [{ v: null, flag: 'missing', at: '2026-09-14T09:10:00-04:00' },
        { v: 70, flag: 'late', note: 'n', at: '2026-09-20T15:31:40-04:00' },
        { v: 88, at: '2026-10-07T08:58:00-04:00' }, { v: 92, at: history352.e3at }] } }),
  JSON.stringify({ ruling2: history352.ruling2, want: history352.ruling2Want, live: history352.ruling2Live,
    blank: history352.ruling2Blank, commit: history352.ruling2Commit }));
const E = history352.edges;
const heldPushed = (r, version) => JSON.stringify(r) === JSON.stringify(
  { write: true, cell: { v: 75, at: 'NOW', was: [version] } });
const heldReplaced = (r) => JSON.stringify(r) === JSON.stringify({ write: true, cell: { v: 75, at: 'NOW' } });
check('WO-3.52, Ruling 2\'s boundary: against a hold at 9:00:00, a cell stamped 9:00:00 — the same '
  + 'second — counts as before and is pushed, one stamped 9:00:01 is a held version and is not, a cell '
  + 'with no `at` is pushed, a held column with no `heldAt` pushes nothing, a `missing` or `excused` with '
  + 'no number is pushed, and a cell holding only a note is not; a held cell typed after the hold and '
  + 'blanked is deleted, and a held write that changes nothing is not a write; and after a commit at '
  + '9:00:00, a cell stamped in that same second is the committed version and is pushed',
  heldPushed(E.sameSecond, { v: 72, at: '2026-10-07T09:00:00-04:00' })
    && heldReplaced(E.secondAfter) && heldPushed(E.noAt, { v: 72 }) && heldReplaced(E.noHeldAt)
    && heldPushed(E.missing, { v: null, flag: 'missing', at: '2026-10-07T08:58:00-04:00' })
    && heldPushed(E.excused, { v: null, flag: 'excused', at: '2026-10-07T08:58:00-04:00' })
    && heldReplaced(E.noteOnly) && heldPushed(E.commitSecond, { v: 72, at: '2026-10-07T09:00:00-04:00' })
    && history352.heldBlank === '{"write":true,"cell":null}' && history352.heldSame === '{"write":false}',
  JSON.stringify({ edges: E, heldBlank: history352.heldBlank, heldSame: history352.heldSame }));

/* ── THE FIXTURE COMES BACK OUT, by id, the clock goes back, and the page is handed back ── */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo333-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a333-') === 0) delete doc.scores[k]; });
  });
  window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  if (window.__wo333Real) { window.Date = window.__wo333Real; delete window.__wo333Real; delete window.__wo333Offset; }
  return 1; })()`);
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await sleep(600);
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
