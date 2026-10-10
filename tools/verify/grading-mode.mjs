/* grading-mode.mjs — the categories editor offers total points (WO-3.31)
 *
 * WO-3.30 built the second formula and points-grade.mjs proves every screen reads it, on a class
 * whose mode was PLANTED, because nothing a teacher could tap wrote the key. This section is the tap:
 * the mode control on the categories editor, the share of the points it draws in place of each
 * weight, and the confirmation that says what a switch would change before it changes it.
 *
 * Everything is driven through the controls a teacher touches — the class manager's Categories
 * button, the editor's two pills, the confirmation's buttons, the real Add. window.planbook is used
 * to READ: the engine's own classGrade(), letterFromPercentage() and pointsShare(), so the dialog's
 * figures are held against the module every other screen asks rather than against a copy of its
 * arithmetic here; and gradingMode.previewModeChange(), the dialog as data.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot, openSettingsDoor } = h;

/* ───────── the categories editor offers total points (WO-3.31) ─────────
 *
 * THREE CLASSES, each built so that the failure it is for can happen.
 *
 *   c_wo331  — two terms, Q1 then Q2, the open one Q2. Weights 50/50, its own letter scale
 *              (A 90 · B 80 · C 70 · D 60 · F 0), so every letter below is computable by hand:
 *
 *              Q2: Test 100 pts (Tests) · Homework 10 pts (Homework) · Reading log 10 pts, NO
 *                  category, unscored — it moves every share and no grade.
 *                Abbot   90, 5  → weighted 70 C    · points 95/110  = 86.36 B   CHANGES
 *                Brook   95, 9  → weighted 92.5 A  · points 104/110 = 94.55 A   SAME LETTER,
 *                                                                              percentage moves
 *                Crane   nothing graded → no grade either way                   no change
 *                Dunn    70, 10 → weighted 85 B    · points 80/110  = 72.73 C   CHANGES
 *                class average: weighted (70 + 92.5 + 85) / 3 = 82.50% ·
 *                               points (86.36… + 94.55… + 72.73…) / 3 = 84.55%
 *                shares: 100 / 10 / 10 of 120 → Tests 83.33 · Homework 8.33 · no category 8.33
 *              Q1: Essay 50 pts (Tests) · Homework 10 pts (Homework)
 *                Abbot 45, 5 → 70 C · 50/60 = 83.33 B CHANGES · Brook 50, 8 → 90 A · 58/60 A ·
 *                Dunn 30, 10 → 80 B · 40/60 = 66.67 D CHANGES  → "Q1: 2 letters would change."
 *
 *              BROOK IS THE TRAP FOR A PERCENTAGE LIST: her percentage moves by two points under the switch
 *              and her letter does not, so a list built from percentages lists her and goes red.
 *
 *   c_wo331u — weights 40 + 35 = 75, one term. Weighted it has no grade at all; on points Eve has
 *              9/10 = A and Fay 7/10 = C. So the way there lists "no grade → A" and the way back
 *              "A → no grade", with the sentence that says why every letter goes.
 *
 *   c_wo331e — on points from the start, one category, a term holding no work at all: the share
 *              line has to say so in words rather than print 0%.
 */
console.log('\n--- the categories editor offers total points (WO-3.31) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.gradingMode"
  + " && typeof window.planbook.gradingMode.previewModeChange === 'function'"
  + " && window.planbook.gradeEngine && typeof window.planbook.gradeEngine.pointsShare === 'function')"))) {
  skip('the categories editor offers total points (WO-3.31)', 'window.planbook.gradingMode is not on the '
    + 'page, so there is no preview to read the confirmation against');
  return;
}

const C = 'c_wo331', Q1 = 'tm331a', Q2 = 'tm331b';
const CU = 'c_wo331u', TU = 'tm331u';
const CE = 'c_wo331e', TE = 'tm331e';
const ABBOT = 'wo331-s1', BROOK = 'wo331-s2', CRANE = 'wo331-s3', DUNN = 'wo331-s4';
const EVE = 'wo331-s5', FAY = 'wo331-s6';
/* Q2 is the term TODAY is in, and Q1 the one before it. Entering a class through its card moves it
   to the term holding today (WO-2.50's door), so a Q2 dated anywhere else would be quietly swapped
   for Q1 the moment the score grid is opened — the first red run of this section was exactly that.
   Read off lib-dates.mjs so a `--today` run moves them with the clock. */
const Q1_START = nodeDaysFromToday(-120), Q1_END = nodeDaysFromToday(-31);
const Q2_START = nodeDaysFromToday(-30), Q2_END = nodeDaysFromToday(60);

await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

const plant = await evalJs(`(function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var scale = function(){ return [{ letter:'A', min:90 }, { letter:'B', min:80 }, { letter:'C', min:70 },
    { letter:'D', min:60 }, { letter:'F', min:0 }]; };
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id:'${ABBOT}', first:'Ada', last:'Abbot' }, { id:'${BROOK}', first:'Bea', last:'Brook' },
      { id:'${CRANE}', first:'Cal', last:'Crane' }, { id:'${DUNN}', first:'Dee', last:'Dunn' },
      { id:'${EVE}', first:'Eve', last:'Ennis' }, { id:'${FAY}', first:'Fay', last:'Ford' });
    doc.classes.push({ id:'${C}', name:'WO-3.31 Mode', archived:false, letterScale:scale(),
      roster:['${ABBOT}','${BROOK}','${CRANE}','${DUNN}'],
      terms:[{ id:'${Q1}', label:'Q1', start:'${Q1_START}', end:'${Q1_END}' },
             { id:'${Q2}', label:'Q2', start:'${Q2_START}', end:'${Q2_END}' }],
      categories:[{ id:'k331t', name:'Tests', weight:50 }, { id:'k331h', name:'Homework', weight:50 }]});
    doc.classes.push({ id:'${CU}', name:'WO-3.31 Unbalanced', archived:false, letterScale:scale(),
      roster:['${EVE}','${FAY}'],
      terms:[{ id:'${TU}', label:'Q1', start:'${Q2_START}', end:'${Q2_END}' }],
      categories:[{ id:'k331u1', name:'Essays', weight:40 }, { id:'k331u2', name:'Quizzes', weight:35 }]});
    doc.classes.push({ id:'${CE}', name:'WO-3.31 Empty', archived:false, letterScale:scale(),
      gradingMode:'points', roster:[],
      terms:[{ id:'${TE}', label:'Q1', start:'${Q2_START}', end:'${Q2_END}' }],
      categories:[{ id:'k331e', name:'Tests', weight:100 }]});
    var add = function(id, cls, term, cat, name, points){
      var a = { id:id, classId:cls, termId:term, name:name, points:points,
        assigned:'${Q2_START}', due:'${nodeDaysFromToday(5)}' };
      if (cat) a.categoryId = cat;
      doc.assignments.push(a);
    };
    add('a331t2', '${C}', '${Q2}', 'k331t', 'Unit test', 100);
    add('a331h2', '${C}', '${Q2}', 'k331h', 'Homework 2', 10);
    add('a331r2', '${C}', '${Q2}', null, 'Reading log', 10);
    add('a331t1', '${C}', '${Q1}', 'k331t', 'Essay', 50);
    add('a331h1', '${C}', '${Q1}', 'k331h', 'Homework 1', 10);
    add('a331u1', '${CU}', '${TU}', 'k331u1', 'Essay', 10);
    doc.scores['a331t2'] = { '${ABBOT}': { v:90 }, '${BROOK}': { v:95 }, '${DUNN}': { v:70 } };
    doc.scores['a331h2'] = { '${ABBOT}': { v:5 },  '${BROOK}': { v:9 },  '${DUNN}': { v:10 } };
    doc.scores['a331t1'] = { '${ABBOT}': { v:45 }, '${BROOK}': { v:50 }, '${DUNN}': { v:30 } };
    doc.scores['a331h1'] = { '${ABBOT}': { v:5 },  '${BROOK}': { v:8 },  '${DUNN}': { v:10 } };
    doc.scores['a331u1'] = { '${EVE}': { v:9 }, '${FAY}': { v:7 } };
  });
  c.selectClass('${CU}'); c.selectTerm('${TU}');
  c.selectClass('${CE}'); c.selectTerm('${TE}');
  c.selectClass('${C}'); c.selectTerm('${Q2}');
  c.refreshClassBar();
  return { ok:true, was: was, open: c.getOpenTermId('${C}') };
})()`);

if (!plant.ok || plant.open !== Q2) {
  check('the WO-3.31 fixture is real: three classes, the first open on Q2', false, JSON.stringify(plant));
  return;
}

/* The document, read the way a check has to: after the debounced save has really happened. */
const docState = (id) => evalJs(`(async function(){
  await window.planbook.store.flush();
  var d = window.planbook.store.getDoc();
  var cls = d.classes.filter(function(x){ return x.id === ${JSON.stringify(id)}; })[0];
  return { rev: d.rev, hasKey: !!cls && Object.prototype.hasOwnProperty.call(cls, 'gradingMode'),
    mode: cls ? cls.gradingMode : undefined, categories: cls ? JSON.stringify(cls.categories) : '' }; })()`);

/* Everything the editor and the confirmation show, in one round trip. */
const readScreen = () => evalJs(`(function(){
  var vis = function(el){ return !!el && getComputedStyle(el).display !== 'none'
    && !el.closest('.hidden'); };
  var ed = document.getElementById('categoriesModal');
  var cf = document.getElementById('gradingModeModal');
  var text = function(sel){ return Array.prototype.map.call(document.querySelectorAll(sel),
    function(e){ return { id: e.getAttribute(sel.match(/\\[(data-[a-z-]+)/)[1]), text: e.textContent }; }); };
  var intro = ed.querySelector('.modal-body > p');
  var introCopy = intro.cloneNode(true);
  Array.prototype.forEach.call(intro.querySelectorAll('[data-category-mode-text]'), function(b, i){
    if (getComputedStyle(b).display === 'none')
      introCopy.querySelectorAll('[data-category-mode-text]')[i].remove(); });
  return {
    editorOpen: !ed.classList.contains('hidden'),
    title: (document.getElementById('categoriesModalTitle') || {}).textContent,
    intro: introCopy.textContent.replace(/\\s+/g, ' ').trim(),
    pills: Array.prototype.map.call(ed.querySelectorAll('[data-grading-mode]'), function(p){
      return { mode: p.getAttribute('data-grading-mode'), on: p.getAttribute('aria-pressed') === 'true'
        && p.classList.contains('active') }; }),
    weightsDisabled: Array.prototype.map.call(ed.querySelectorAll('#categoryList .category-weight'),
      function(i){ return i.disabled; }),
    weightValues: Array.prototype.map.call(ed.querySelectorAll('#categoryList .category-weight'),
      function(i){ return i.value; }),
    totalDrawn: vis(document.getElementById('categoryTotal')),
    shares: text('#categoryList [data-category-share]'),
    listText: (document.getElementById('categoryList') || {}).textContent || '',
    confirmOpen: !cf.classList.contains('hidden'),
    confirmTitle: (document.getElementById('gradingModeTitle') || {}).textContent,
    warn: vis(document.getElementById('gradingModeWarn'))
      ? document.getElementById('gradingModeWarn').textContent : '',
    averages: text('#gradingModeAverages [data-mode-average]'),
    changes: text('#gradingModeLetters [data-mode-change]'),
    lettersText: (document.getElementById('gradingModeLetters') || {}).textContent || '',
    others: vis(document.getElementById('gradingModeOtherTerms'))
      ? text('#gradingModeOtherTerms [data-mode-other-term]') : [],
    otherLabelDrawn: vis(document.getElementById('gradingModeOtherLabel'))
  }; })()`);

/* What the engine says, asked directly — never the dialog's answer compared with itself. For every
   student on the class's roster in one term: the grade under each mode, and the letter, with a null
   percentage read as NO GRADE rather than handed to letterFromPercentage() (which reads null as 0). */
const engineSays = (id, termId) => evalJs(`(function(){
  var g = window.planbook.gradeEngine, d = window.planbook.store.getDoc();
  var cls = d.classes.filter(function(x){ return x.id === ${JSON.stringify(id)}; })[0];
  var w = Object.assign({}, cls); delete w.gradingMode;
  var p = Object.assign({}, cls, { gradingMode:'points' });
  var side = function(version, sid){ var pct = g.classGrade(d, version, ${JSON.stringify(termId)}, sid).percentage;
    return { pct: pct, letter: pct === null ? null : g.letterFromPercentage(d, version, pct) }; };
  var mean = function(list){ var got = list.filter(function(x){ return x !== null; });
    return got.length ? got.reduce(function(a, b){ return a + b; }, 0) / got.length : null; };
  var rows = cls.roster.map(function(sid){ var a = side(w, sid), b = side(p, sid);
    return { id: sid, w: a, p: b,
      letterDiffers: (a.pct === null ? 'none' : 'letter:' + a.letter) !== (b.pct === null ? 'none' : 'letter:' + b.letter),
      pctDiffers: a.pct !== b.pct }; });
  var fmt = function(x){ return x === null ? null : Number(x).toFixed(2) + '%'; };
  return { rows: rows, weightedAvg: fmt(mean(rows.map(function(r){ return r.w.pct; }))),
    pointsAvg: fmt(mean(rows.map(function(r){ return r.p.pct; }))),
    shares: g.pointsShare(d, cls, ${JSON.stringify(termId)}).map(function(r){
      return { id: r.id === null ? 'none' : r.id,
        text: (r.id === null ? r.name : (r.name || 'Untitled category')) + ' — '
          + (r.share === null ? 'No work assigned yet'
            : window.planbook.categories.formatWeight(r.share) + '% of the points assigned so far') }; }) };
})()`);

/* The score grid's own class average, read off its summary line. */
const gridAverage = async () => {
  const on = await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  if (on !== 'scoresView') {
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 400));
  }
  return evalJs(`(function(){ var s = document.getElementById('scoresSummary');
    var b = s ? s.querySelector('b') : null;
    return { open: window.planbook.classes.getSelectedClassId(),
      term: window.planbook.classes.getSelectedTermId(), avg: b ? b.textContent : '' }; })()`);
};

/* Into the class's score grid the way a teacher goes: home, the class's card, the Scores segment. */
const toScores = async (id) => {
  const on = await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  if (on !== 'homeView') {
    const nth = await evalJs(`(function(){
      var all = document.querySelectorAll('[data-view-home]');
      for (var i = 0; i < all.length; i++) {
        var r = all[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return i;
      }
      return -1; })()`);
    if (nth < 0) throw new Error('no visible [data-view-home] to go home by');
    await clickSel('[data-view-home]', nth);
    await new Promise(r => setTimeout(r, 250));
  }
  await clickSel('#homeGrid [data-class-tab="' + id + '"]');
  await new Promise(r => setTimeout(r, 250));
  await clickSel('#classView [data-class-screen="scores"]');
  await new Promise(r => setTimeout(r, 400));
};

/* The editor, through the class manager's own Categories button — the door with no term in view,
   which is the one the work order says the open term has to be resolved for. */
const openEditor = async (id) => {
  await openSettingsDoor('[data-class-manage]');
  await new Promise(r => setTimeout(r, 200));
  await clickSel('#classList [data-category-manage="' + id + '"]');
  await new Promise(r => setTimeout(r, 200));
};
const closeAll = async () => {
  await evalJs(`(function(){ ['gradingModeModal','categoriesModal','classesModal'].forEach(function(id){
    var o = document.getElementById(id); if (o && !o.classList.contains('hidden')) window.planbook.closeModal(id); });
    return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
};
const tapPill = async (mode) => {
  await clickSel('#categoriesModal [data-grading-mode="' + mode + '"]');
  await new Promise(r => setTimeout(r, 200));
};

/* ── 1. the weighted grid, then the editor and the confirmation, then Cancel ── */
await toScores(C);
const gridW = await gridAverage();
const said = await engineSays(C, Q2);
const before = await docState(C);
await openEditor(C);
const edW = await readScreen();
check('WO-3.31: a weighted class opens the editor exactly as WO-3.1 drew it — "Categories & weights", the '
  + 'weighted opening sentence, Weighted categories on, every weight live, the weights total drawn, no '
  + 'share line',
  edW.editorOpen && edW.title === 'Categories & weights'
    && edW.intro.indexOf('What WO-3.31 Mode is graded on, and how much each part counts. Every class') === 0
    && edW.pills.length === 2 && edW.pills.filter((p) => p.on).map((p) => p.mode).join() === 'weighted'
    && edW.weightsDisabled.length === 2 && edW.weightsDisabled.every((x) => x === false)
    && edW.totalDrawn && edW.shares.length === 0,
  JSON.stringify(edW));

await tapPill('points');
const cfP = await readScreen();
const model = await evalJs(`window.planbook.gradingMode.previewModeChange(${JSON.stringify(C)}, ${JSON.stringify(Q2)})`);
const wantChanged = said.rows.filter((r) => r.letterDiffers).map((r) => r.id);
const listed = cfP.changes.map((c) => c.id);
check('WO-3.31: the confirmation\'s before and after are classGrade()\'s under each mode, averaged — '
  + '82.50% weighted and 84.55% on points by hand, and the same two figures from the engine asked directly',
  cfP.confirmOpen && said.weightedAvg === '82.50%' && said.pointsAvg === '84.55%'
    && cfP.averages.length === 2
    && cfP.averages[0].id === 'before' && cfP.averages[0].text === 'Now, on weighted categories: ' + said.weightedAvg
    && cfP.averages[1].id === 'after' && cfP.averages[1].text === 'On total points: ' + said.pointsAvg,
  JSON.stringify({ averages: cfP.averages, engine: [said.weightedAvg, said.pointsAvg] }));
check('WO-3.31: the students listed are exactly those whose LETTER differs — Abbot C → B and Dunn B → C by '
  + 'hand, the engine\'s letterFromPercentage() agreeing — and Brook, whose percentage moves inside her A, '
  + 'is not listed (a list built from percentages lists her)',
  JSON.stringify(listed) === JSON.stringify([ABBOT, DUNN])
    && JSON.stringify(wantChanged) === JSON.stringify([ABBOT, DUNN])
    && said.rows.filter((r) => r.id === BROOK)[0].pctDiffers === true
    && cfP.changes[0].text === 'Abbot, Ada — C → B' && cfP.changes[1].text === 'Dunn, Dee — B → C'
    && JSON.stringify(model.changes.map((c) => c.studentId)) === JSON.stringify(listed),
  JSON.stringify({ listed: cfP.changes, engineDiffers: wantChanged }));
check('WO-3.31: the other term gets one line, and it counts right — "Q1: 2 letters would change."',
  cfP.otherLabelDrawn && cfP.others.length === 1 && cfP.others[0].id === Q1
    && cfP.others[0].text === 'Q1: 2 letters would change.',
  JSON.stringify(cfP.others));
check('WO-3.31: the confirmation the points pill opens is the way there, says so, and carries no '
  + 'no-grade warning (these weights total 100)',
  cfP.confirmTitle === 'Grade on total points?' && cfP.warn === '', cfP.confirmTitle + ' · ' + cfP.warn);

await clickSel('#gradingModeModal [data-grading-mode-cancel]');
await new Promise(r => setTimeout(r, 200));
const afterCancel = await docState(C);
const edCancel = await readScreen();
check('WO-3.31: Cancel writes nothing — `rev` is the same after flush(), there is still no gradingMode key, '
  + 'and the editor is still weighted with Weighted categories on',
  !edCancel.confirmOpen && edCancel.editorOpen && afterCancel.rev === before.rev && !afterCancel.hasKey
    && afterCancel.categories === before.categories
    && edCancel.pills.filter((p) => p.on).map((p) => p.mode).join() === 'weighted',
  JSON.stringify({ before: before.rev, after: afterCancel.rev, key: afterCancel.hasKey }));

/* ── 2. a term where no letter changes draws no line ──
 * Abbot's and Dunn's Q1 scores come out; Brook's Q1 letter is A either way, so Q1 has nothing to say. */
await evalJs(`(function(){ window.planbook.store.update(function(doc){
  delete doc.scores['a331t1']['${ABBOT}']; delete doc.scores['a331h1']['${ABBOT}'];
  delete doc.scores['a331t1']['${DUNN}']; delete doc.scores['a331h1']['${DUNN}']; }); return 1; })()`);
const saidQ1 = await engineSays(C, Q1);
await tapPill('points');
const cfQuiet = await readScreen();
check('WO-3.31: an other term where no letter changes draws no line — Q1 with only Brook graded (A either '
  + 'way) leaves the other-terms block undrawn',
  cfQuiet.confirmOpen && saidQ1.rows.every((r) => !r.letterDiffers)
    && cfQuiet.others.length === 0 && !cfQuiet.otherLabelDrawn,
  JSON.stringify({ others: cfQuiet.others, label: cfQuiet.otherLabelDrawn }));
await clickSel('#gradingModeModal [data-grading-mode-cancel]');
await new Promise(r => setTimeout(r, 200));
await evalJs(`(function(){ window.planbook.store.update(function(doc){
  doc.scores['a331t1']['${ABBOT}'] = { v:45 }; doc.scores['a331h1']['${ABBOT}'] = { v:5 };
  doc.scores['a331t1']['${DUNN}'] = { v:30 }; doc.scores['a331h1']['${DUNN}'] = { v:10 }; }); return 1; })()`);

/* ── 3. confirm: the class is on points, the editor says so, and the grid agrees with the dialog ── */
const preSwitch = await docState(C);
await tapPill('points');
const cfGo = await readScreen();
await clickSel('#gradingModeModal [data-grading-mode-confirm]');
await new Promise(r => setTimeout(r, 300));
const onPoints = await docState(C);
const edP = await readScreen();
const sharesP = await engineSays(C, Q2);
check('WO-3.31: confirming writes the key — gradingMode "points" — and touches no weight',
  onPoints.hasKey && onPoints.mode === 'points' && onPoints.categories === preSwitch.categories
    && onPoints.rev > preSwitch.rev,
  JSON.stringify({ mode: onPoints.mode, cats: onPoints.categories }));
check('WO-3.31: in points mode the weight inputs are disabled and still hold what was typed, no weights-total '
  + 'line is drawn, Total points is on, and the title and opening sentence speak of points',
  !edP.confirmOpen && edP.editorOpen && edP.title === 'Categories & points'
    && /is graded on\. It is graded on total points: every point earned over every point possible/.test(edP.intro)
    && edP.intro.indexOf('how much each part counts') === -1
    && edP.pills.filter((p) => p.on).map((p) => p.mode).join() === 'points'
    && edP.weightsDisabled.length === 2 && edP.weightsDisabled.every((x) => x === true)
    && JSON.stringify(edP.weightValues) === JSON.stringify(edW.weightValues)
    && !edP.totalDrawn,
  JSON.stringify({ title: edP.title, intro: edP.intro, disabled: edP.weightsDisabled, total: edP.totalDrawn }));
check('WO-3.31: each category\'s share is pointsShare()\'s, every row it returns drawn — Tests 83.33, '
  + 'Homework 8.33 and the no-category row 8.33 by hand, in the class\'s order',
  JSON.stringify(edP.shares) === JSON.stringify(sharesP.shares)
    && JSON.stringify(edP.shares.map((s) => s.text)) === JSON.stringify([
      'Tests — 83.33% of the points assigned so far',
      'Homework — 8.33% of the points assigned so far',
      'no category — 8.33% of the points assigned so far']),
  JSON.stringify({ drawn: edP.shares, engine: sharesP.shares }));

await closeAll();
const gridP = await gridAverage();
check('WO-3.31: the class averages are the score grid\'s own — the grid read 82.50% weighted before the '
  + 'switch and 84.55% on points after it, the two figures the confirmation printed, same class, same term',
  gridW.open === C && gridW.term === Q2 && gridP.open === C && gridP.term === Q2
    && gridW.avg === '82.50%' && gridP.avg === '84.55%'
    && cfGo.averages[0].text === 'Now, on weighted categories: ' + gridW.avg
    && cfGo.averages[1].text === 'On total points: ' + gridP.avg,
  JSON.stringify({ gridW, gridP, dialog: cfGo.averages }));

/* ── 4. a category added on points gets a weight, disabled; then the way back ── */
await openEditor(C);
await clickSel('#categoriesModal [data-category-add]');
await new Promise(r => setTimeout(r, 200));
const edAdded = await readScreen();
const added = await docState(C);
check('WO-3.31: a category added in points mode gets a weight like any other — 0, stored — and its field is '
  + 'disabled with the rest, its share line drawn',
  edAdded.weightsDisabled.length === 3 && edAdded.weightsDisabled.every((x) => x === true)
    && JSON.parse(added.categories).length === 3 && JSON.parse(added.categories)[2].weight === 0
    && edAdded.shares.length === 4,
  JSON.stringify({ disabled: edAdded.weightsDisabled, cats: added.categories, shares: edAdded.shares.length }));

await tapPill('weighted');
const cfBack = await readScreen();
await clickSel('#gradingModeModal [data-grading-mode-confirm]');
await new Promise(r => setTimeout(r, 300));
const back = await docState(C);
const edBack = await readScreen();
check('WO-3.31: back to weighted the key is DELETED, not written as "weighted", and every weight is '
  + 'byte-identical to what was typed — the two originals and the one added on points',
  !back.hasKey && back.categories === added.categories
    && JSON.stringify(JSON.parse(back.categories).slice(0, 2)) === before.categories
    && cfBack.confirmTitle === 'Go back to weighted categories?',
  JSON.stringify({ key: back.hasKey, cats: back.categories, original: before.categories }));
check('WO-3.31: back on weighted the editor is WO-3.1\'s again — weights live, the total drawn, no share '
  + 'line, Weighted categories on, "Categories & weights"',
  edBack.title === 'Categories & weights' && edBack.weightsDisabled.every((x) => x === false)
    && edBack.totalDrawn && edBack.shares.length === 0
    && edBack.pills.filter((p) => p.on).map((p) => p.mode).join() === 'weighted',
  JSON.stringify(edBack));
await closeAll();

/* ── 5. weights that do not total 100: no grade → a letter, and back ── */
await openEditor(CU);
const saidU = await engineSays(CU, TU);
await tapPill('points');
const cfU = await readScreen();
check('WO-3.31: from weights that total 75 the way to points lists every student whose grade appears — '
  + '"no grade → A" and "no grade → C" — and a no-grade side counts as a change',
  cfU.confirmOpen && JSON.stringify(cfU.changes.map((c) => c.text))
    === JSON.stringify(['Ennis, Eve — no grade → A', 'Ford, Fay — no grade → C'])
    && saidU.rows.every((r) => r.letterDiffers && r.w.pct === null) && cfU.warn === ''
    && cfU.averages[0].text === 'Now, on weighted categories: no grades yet',
  JSON.stringify({ changes: cfU.changes, averages: cfU.averages }));
await clickSel('#gradingModeModal [data-grading-mode-confirm]');
await new Promise(r => setTimeout(r, 300));
await tapPill('weighted');
const cfU2 = await readScreen();
check('WO-3.31: going back to weights that total 75 says in words that every letter goes, and lists '
  + '"A → no grade" and "C → no grade"',
  cfU2.confirmOpen && /These weights total 75%, not 100%/.test(cfU2.warn)
    && JSON.stringify(cfU2.changes.map((c) => c.text))
      === JSON.stringify(['Ennis, Eve — A → no grade', 'Ford, Fay — C → no grade'])
    && cfU2.averages[1].text === 'On weighted categories: no grades yet',
  JSON.stringify({ warn: cfU2.warn, changes: cfU2.changes }));
await clickSel('#gradingModeModal [data-grading-mode-confirm]');
await new Promise(r => setTimeout(r, 300));
const backU = await docState(CU);
check('WO-3.31: the unbalanced class went there and back with no key left and its 40 and 35 untouched',
  !backU.hasKey && backU.categories === JSON.stringify([{ id:'k331u1', name:'Essays', weight:40 },
    { id:'k331u2', name:'Quizzes', weight:35 }]),
  JSON.stringify(backU));
await closeAll();

/* ── 6. a term with no points says so in words ── */
await openEditor(CE);
const edE = await readScreen();
const saidE = await engineSays(CE, TE);
check('WO-3.31: a points term holding no work draws words, not 0% — "Tests — No work assigned yet", the '
  + 'share pointsShare() answers null for',
  edE.title === 'Categories & points' && edE.shares.length === 1
    && edE.shares[0].text === 'Tests — No work assigned yet'
    && JSON.stringify(edE.shares) === JSON.stringify(saidE.shares) && !/0%/.test(edE.listText),
  JSON.stringify(edE.shares));
await closeAll();

/* ── 7. 44px under the coarse pointer ── */
await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
const coarse = await evalJs("matchMedia('(pointer: coarse)').matches");
await evalJs(`(function(){ window.planbook.classes.selectClass(${JSON.stringify(C)}); return 1; })()`);
await openEditor(C);
const measure = (sel) => evalJs(`(function(){ return Array.prototype.map.call(document.querySelectorAll(${JSON.stringify(sel)}),
  function(e){ var r = e.getBoundingClientRect(); return { t: e.textContent.trim(), w: r.width, h: r.height }; }); })()`);
const pillBoxes = await measure('#categoriesModal [data-grading-mode]');
await tapPill('points');
const btnBoxes = await measure('#gradingModeModal .modal-actions button, #gradingModeModal .modal-close');
const big = (list) => list.length > 0 && list.every((b) => b.w >= 44 && b.h >= 44);
check('WO-3.31: under a pointer that really is coarse, both mode pills and the confirmation\'s buttons — '
  + 'confirm, Cancel and the close — measure at least 44 x 44',
  coarse === true && pillBoxes.length === 2 && big(pillBoxes) && btnBoxes.length === 3 && big(btnBoxes),
  JSON.stringify({ coarse, pillBoxes, btnBoxes }));
await clickSel('#gradingModeModal [data-grading-mode-cancel]');
await new Promise(r => setTimeout(r, 200));
await closeAll();

/* THE FIXTURE COMES BACK OUT, by id, and the page is handed back as points-grade.mjs leaves it. */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var mine = [${JSON.stringify(C)}, ${JSON.stringify(CU)}, ${JSON.stringify(CE)}];
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return mine.indexOf(x.id) === -1; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo331-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return mine.indexOf(a.classId) === -1; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a331') === 0) delete doc.scores[k]; });
  });
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
