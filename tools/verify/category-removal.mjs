/* category-removal.mjs — removing a category moves its work to *no category* (WO-3.43)
 *
 * WO-3.1 built a removal that took the work filed under a category with it, behind a red dialog
 * that counted it and pointed at the backup file. The owner reversed that on 2026-10-04, in both
 * modes: the category goes, its assignments stay with their `categoryId` cleared to '', and every
 * score column stays byte for byte. categories-weights.mjs still drives the removal on a starter
 * class and had two checks re-pointed from the cascade to the new ruling; this section is the rest
 * of WO-3.43 — the document on either side, the grade on either side in each mode, the dialog's
 * words in each mode, and the four announcements.
 *
 * Everything is driven through the controls a teacher touches — the class manager's Categories
 * button, Remove on a row, the confirm, Add, a weight field. window.planbook is used to READ: the
 * engine's own classGrade(), and the categories module's weightTotal() and formatWeight(), so the
 * dialog's total is held against the module the editor prints through rather than a sum here.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

/* ───────── removing a category moves its work to no category (WO-3.43) ─────────
 *
 * THREE CLASSES, one term each, the term holding today.
 *
 *   c_wo343w — WEIGHTED, Essays 40 · Quizzes 60, so it totals 100 and has a grade before the removal.
 *              Essay 1 (100 pts, Essays) · Essay 2 (50 pts, Essays) · Quiz 1 (10 pts, Quizzes)
 *                Avery  80, 40, 9          Blake  60, missing, 5
 *              Removing Essays leaves Quizzes at 60 → no grade, "60%" in the dialog, on the editor's
 *              total line and in weightTotal(). With Quizzes then typed to 100 the grade is the quiz
 *              alone — Avery 9/10 = 90, Blake 5/10 = 50 — and the same figure the engine gives a copy
 *              of the document with both essays deleted: that is "gives that work no weight".
 *
 *   c_wo343p — TOTAL POINTS, the same three pieces of work and the same scores.
 *                Avery (80 + 40 + 9) / 160 = 80.625     Blake (60 + 0 + 5) / 160 = 40.625
 *              Removing Essays moves 150 of those 160 points to the no-category row, and both
 *              percentages stay exactly where they were.
 *
 *   c_wo343x — the BYSTANDER: weighted, one category of its own, and one assignment planted with
 *              this class's `classId` and c_wo343w's Essays id — the restored-document case WO-3.3's
 *              guard is for. A removal in c_wo343w must leave it filed exactly as it was.
 */
console.log('\n--- removing a category moves its work to no category (WO-3.43) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.categories && window.planbook.gradeEngine"
  + " && typeof window.planbook.gradeEngine.classGrade === 'function')"))) {
  skip('removing a category moves its work to no category (WO-3.43)', 'window.planbook.categories or '
    + 'window.planbook.gradeEngine is not on the page, so there is no engine to read the grade through');
  return;
}

const CW = 'c_wo343w', CP = 'c_wo343p', CX = 'c_wo343x';
const TW = 'tm343w', TP = 'tm343p', TX = 'tm343x';
const AVERY = 'wo343-s1', BLAKE = 'wo343-s2';
const T_START = nodeDaysFromToday(-30), T_END = nodeDaysFromToday(60);

await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

const plant = await evalJs(`(async function(){
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
    doc.students.push({ id:'${AVERY}', first:'Avery', last:'Adler' }, { id:'${BLAKE}', first:'Blake', last:'Byrne' });
    doc.classes.push({ id:'${CW}', name:'WO-3.43 Weighted', archived:false, letterScale:scale(),
      roster:['${AVERY}','${BLAKE}'],
      terms:[{ id:'${TW}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'k343we', name:'Essays', weight:40 }, { id:'k343wq', name:'Quizzes', weight:60 }]});
    doc.classes.push({ id:'${CP}', name:'WO-3.43 Points', archived:false, letterScale:scale(),
      gradingMode:'points', roster:['${AVERY}','${BLAKE}'],
      terms:[{ id:'${TP}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'k343pe', name:'Essays', weight:40 }, { id:'k343pq', name:'Quizzes', weight:60 }]});
    doc.classes.push({ id:'${CX}', name:'WO-3.43 Bystander', archived:false, letterScale:scale(),
      roster:['${AVERY}'],
      terms:[{ id:'${TX}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'k343xo', name:'Other', weight:100 }]});
    var add = function(id, cls, term, cat, name, points){
      doc.assignments.push({ id:id, classId:cls, termId:term, categoryId:cat, name:name, points:points,
        assigned:'${T_START}', due:'${nodeDaysFromToday(5)}' });
    };
    add('a343we1', '${CW}', '${TW}', 'k343we', 'Essay 1', 100);
    add('a343we2', '${CW}', '${TW}', 'k343we', 'Essay 2', 50);
    add('a343wq1', '${CW}', '${TW}', 'k343wq', 'Quiz 1', 10);
    add('a343pe1', '${CP}', '${TP}', 'k343pe', 'Essay 1', 100);
    add('a343pe2', '${CP}', '${TP}', 'k343pe', 'Essay 2', 50);
    add('a343pq1', '${CP}', '${TP}', 'k343pq', 'Quiz 1', 10);
    /* The plant: another class's work wearing c_wo343w's Essays id. */
    add('a343xf', '${CX}', '${TX}', 'k343we', 'Planted in the bystander', 20);
    ['w','p'].forEach(function(m){
      doc.scores['a343' + m + 'e1'] = { '${AVERY}': { v:80 }, '${BLAKE}': { v:60 } };
      doc.scores['a343' + m + 'e2'] = { '${AVERY}': { v:40 }, '${BLAKE}': { v:null, flag:'missing' } };
      doc.scores['a343' + m + 'q1'] = { '${AVERY}': { v:9 },  '${BLAKE}': { v:5 } };
    });
    doc.scores['a343xf'] = { '${AVERY}': { v:17 } };
  });
  c.selectClass('${CX}'); c.selectTerm('${TX}');
  c.selectClass('${CP}'); c.selectTerm('${TP}');
  c.selectClass('${CW}'); c.selectTerm('${TW}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, open: c.getOpenTermId('${CW}') };
})()`);

if (!plant.ok || plant.open !== TW) {
  check('the WO-3.43 fixture is real: three classes, the weighted one open on its term', false, JSON.stringify(plant));
  return;
}

/* The whole of the grade data, as strings, after the debounced save has really happened: every
   assignment by id and the entire score map. "Byte-identical" is asserted on these. */
const snapshot = () => evalJs(`(async function(){
  await window.planbook.store.flush();
  var d = window.planbook.store.getDoc();
  var byId = {}; d.assignments.forEach(function(a){ byId[a.id] = JSON.stringify(a); });
  var cats = {}; d.classes.forEach(function(c){ cats[c.id] = JSON.stringify(c.categories); });
  return { rev: d.rev, count: d.assignments.length, assignments: byId, categories: cats,
    scores: JSON.stringify(d.scores),
    columns: ['a343we1','a343we2','a343wq1','a343pe1','a343pe2','a343pq1','a343xf'].map(function(k){
      return k + ':' + JSON.stringify(d.scores[k]); }) }; })()`);

/* The engine, asked directly, for both students. `withoutMoved` is the same question asked of a copy
   of the document with the named assignments deleted — what the grade would be if that work did not
   exist at all, which is what "no weight" has to equal. */
const engine = (id, termId, without) => evalJs(`(function(){
  var g = window.planbook.gradeEngine, d = window.planbook.store.getDoc();
  var cls = d.classes.filter(function(x){ return x.id === ${JSON.stringify(id)}; })[0];
  var gone = ${JSON.stringify(without || [])};
  var copy = Object.assign({}, d, { assignments: d.assignments.filter(function(a){ return gone.indexOf(a.id) === -1; }) });
  return ['${AVERY}', '${BLAKE}'].map(function(sid){
    var r = g.classGrade(d, cls, ${JSON.stringify(termId)}, sid);
    var w = g.classGrade(copy, cls, ${JSON.stringify(termId)}, sid);
    var loose = (r.categories || []).filter(function(row){ return row.id === null; })[0] || null;
    return { id: sid, pct: r.percentage, reason: r.reason, weightTotal: r.weightTotal,
      rowIds: (r.categories || []).map(function(row){ return row.id; }),
      loose: loose ? { earned: loose.earned, possible: loose.possible } : null,
      pctWithout: w.percentage,
      total: window.planbook.categories.formatWeight(window.planbook.categories.weightTotal(cls)) };
  }); })()`);

/* Every write into the one live region, in order, from now until the next call. A removal speaks
   twice in the same breath (a weights crossing, then the removal), and the region only ever holds
   the last, so the record is taken off the mutations rather than off the region afterwards. */
const listen = () => evalJs(`(function(){
  var el = document.getElementById('srLive');
  if (window.__said343 && window.__said343.obs) window.__said343.obs.disconnect();
  var said = [];
  var obs = new MutationObserver(function(records){ records.forEach(function(r){
    Array.prototype.forEach.call(r.addedNodes, function(n){ if (n.textContent) said.push(n.textContent); }); }); });
  obs.observe(el, { childList:true, characterData:true, subtree:true });
  window.__said343 = { obs: obs, said: said };
  return 1; })()`);
const heard = async () => {
  await new Promise(r => setTimeout(r, 250));
  return evalJs('(function(){ var s = window.__said343; if (s) s.obs.disconnect(); return s ? s.said.slice() : []; })()');
};

/* The editor and the confirm, in one round trip. `panel` is every word the confirm shows, title and
   section label and button included — Acceptance line 4 is about the dialog, not one element. */
const readScreen = () => evalJs(`(function(){
  var ed = document.getElementById('categoriesModal');
  var cf = document.getElementById('categoryRemoveModal');
  var btn = document.getElementById('categoryRemoveBtn');
  var facts = document.getElementById('categoryRemoveFacts');
  return {
    editorOpen: !ed.classList.contains('hidden'),
    names: Array.prototype.map.call(ed.querySelectorAll('#categoryList .category-name-input'), function(i){ return i.value; }),
    total: (document.getElementById('categoryTotal') || {}).textContent || '',
    looseShare: !!ed.querySelector('#categoryList [data-category-share="none"]'),
    looseShareText: (ed.querySelector('#categoryList [data-category-share="none"]') || {}).textContent || '',
    confirmOpen: !cf.classList.contains('hidden'),
    panel: cf.querySelector('.modal-panel').textContent.replace(/\\s+/g, ' ').trim(),
    lead: (document.getElementById('categoryRemoveLead') || {}).textContent || '',
    facts: Array.prototype.map.call(facts.children, function(e){ return e.textContent; }),
    factsClass: facts.className,
    lineClasses: Array.prototype.map.call(facts.children, function(e){ return e.className; }),
    button: btn.textContent, buttonDanger: btn.classList.contains('danger'),
    buttonColor: getComputedStyle(btn).backgroundColor,
    hints: Array.prototype.filter.call(ed.querySelectorAll('[data-category-mode-text]'), function(p){
      return !p.classList.contains('hidden'); }).map(function(p){ return p.textContent.replace(/\\s+/g, ' ').trim(); })
  }; })()`);

const openEditor = async (id) => {
  await clickSel('header [data-class-manage]');
  await new Promise(r => setTimeout(r, 200));
  await clickSel('#classList [data-category-manage="' + id + '"]');
  await new Promise(r => setTimeout(r, 200));
};
const closeAll = async () => {
  await evalJs(`(function(){ ['categoryRemoveModal','categoriesModal','classesModal'].forEach(function(id){
    var o = document.getElementById(id); if (o && !o.classList.contains('hidden')) window.planbook.closeModal(id); });
    return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
};

/* The class's assignment list, the way a teacher reaches it — home, the class's card, Assignments —
   read as groups: every row's name under the group head it sits beneath. */
const assignmentGroups = async (id) => {
  const nth = await evalJs(`(function(){
    var on = document.querySelector('main > :not(.hidden)');
    if (on && on.id === 'homeView') return -2;
    var all = document.querySelectorAll('[data-view-home]');
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return i;
    }
    return -1; })()`);
  if (nth === -1) throw new Error('no visible [data-view-home] to go home by');
  if (nth >= 0) {
    await clickSel('[data-view-home]', nth);
    await new Promise(r => setTimeout(r, 250));
  }
  await clickSel('#homeGrid [data-class-tab="' + id + '"]');
  await new Promise(r => setTimeout(r, 250));
  await clickSel('#classView [data-class-screen="assignments"]');
  await new Promise(r => setTimeout(r, 300));
  return evalJs(`(function(){
    var body = document.getElementById('assignmentsBody');
    var groups = {}, at = '';
    Array.prototype.forEach.call(body.querySelectorAll('tr'), function(r){
      if (r.classList.contains('assign-group-head')) {
        at = r.querySelector('.assign-group-title').firstChild.textContent; groups[at] = []; return; }
      var n = r.querySelector('.assign-name'); if (n && at) groups[at].push(n.textContent);
    });
    var notice = body.querySelector('.assign-group-orphan');
    return { open: window.planbook.classes.getSelectedClassId(), groups: groups,
      notice: notice ? notice.textContent : '', counted: !!(notice && notice.classList.contains('counted')) };
  })()`);
};

/* ══ WEIGHTED ══ */
const w0 = await snapshot();
const gW0 = await engine(CW, TW);

/* The add announcement first, on the balanced class, then the new category comes straight back out
   — empty, so on the tap — and the class is at 40/60 again for the removal. */
await openEditor(CW);
await listen();
await clickSel('#categoriesModal [data-category-add]');
const saidAddW = await heard();
await clickSel('#categoryList .category-row:nth-child(3) [data-category-remove]');
await new Promise(r => setTimeout(r, 150));

await clickSel('#categoryList .category-row:nth-child(1) [data-category-remove]');
await new Promise(r => setTimeout(r, 150));
const cfW = await readScreen();
await listen();
await clickSel('[data-category-remove-confirm]');
const saidW = await heard();
const w1 = await snapshot();
const edW = await readScreen();
const gW1 = await engine(CW, TW, ['a343we1', 'a343we2']);

const movedW = ['a343we1', 'a343we2'];
const sameButCategory = (before, after, id) => {
  const b = JSON.parse(before.assignments[id]); const a = JSON.parse(after.assignments[id]);
  b.categoryId = ''; return JSON.stringify(a) === JSON.stringify(b);
};
const untouched = (before, after, except) => Object.keys(before.assignments)
  .filter((id) => except.indexOf(id) === -1)
  .every((id) => before.assignments[id] === after.assignments[id]);
check('WO-3.43: removing a weighted category that holds work leaves both its assignments in the document with '
  + 'categoryId \'\' and nothing else about them changed, every score column byte-identical, and no other '
  + 'assignment — the neighbouring category\'s, the other classes\', and the plant in another class wearing '
  + 'the same category id — moved',
  w1.count === w0.count
    && movedW.every((id) => !!w1.assignments[id] && JSON.parse(w1.assignments[id]).categoryId === '')
    && movedW.every((id) => sameButCategory(w0, w1, id))
    && w1.scores === w0.scores
    && untouched(w0, w1, movedW)
    && JSON.parse(w1.assignments.a343xf).categoryId === 'k343we'
    && JSON.parse(w1.categories[CW]).map((k) => k.id).join() === 'k343wq'
    && w1.categories[CX] === w0.categories[CX] && w1.categories[CP] === w0.categories[CP],
  JSON.stringify({ count: [w0.count, w1.count], moved: movedW.map((id) => w1.assignments[id] || 'GONE'),
    scoresSame: w1.scores === w0.scores, columns: w1.columns, plant: w1.assignments.a343xf,
    categories: w1.categories[CW] }));

/* Before the removal the class had a real grade: Avery (80+40)/150 = 80 on Essays at 40, 90 on
   Quizzes at 60 → 86; Blake 40 and 50 → 46. Asserted so the "no grade after" below is a change and
   not the fixture never having had one. */
const dialogTotal = ((cfW.facts.join(' ').match(/totals ([\d.]+)%/) || [])[1]) || '';
check('WO-3.43: in a weighted class the work stops counting — the class had a grade (86 and 46 by hand), after '
  + 'the removal classGrade() refuses on weights-unbalanced at 60, and the dialog\'s weights sentence, the '
  + 'editor\'s total line and weightTotal() all name that same 60',
  Math.abs(gW0[0].pct - 86) < 1e-9 && Math.abs(gW0[1].pct - 46) < 1e-9
    && gW1.every((r) => r.pct === null && r.reason === 'weights-unbalanced' && r.weightTotal === 60)
    && dialogTotal === '60' && gW1[0].total === dialogTotal
    && edW.total.indexOf('Weights total ' + dialogTotal + '%, not 100%') >= 0,
  JSON.stringify({ before: gW0.map((r) => r.pct), after: gW1.map((r) => [r.reason, r.weightTotal]),
    dialog: cfW.facts, editor: edW.total }));

/* Then Quizzes typed to 100 through its real field, and the grade comes back as the quiz alone. */
await evalJs(`(function(){ var f = document.querySelector('#categoryList .category-row:nth-child(1) .category-weight');
  f.value = '100'; f.dispatchEvent(new Event('input', { bubbles:true })); return 1; })()`);
await new Promise(r => setTimeout(r, 150));
const gW2 = await engine(CW, TW, ['a343we1', 'a343we2']);
check('WO-3.43: and the moved work carries no weight — with Quizzes set to 100 the grade is the quiz alone '
  + '(90 and 50 by hand), equal to classGrade() of a copy of the document with both essays deleted, with no '
  + 'no-category row',
  Math.abs(gW2[0].pct - 90) < 1e-9 && Math.abs(gW2[1].pct - 50) < 1e-9
    && gW2.every((r) => r.pct === r.pctWithout && r.rowIds.join() === 'k343wq' && r.loose === null),
  JSON.stringify(gW2));

check('WO-3.43: the weighted confirm says where the work goes — no "backup", no "cannot be undone", no '
  + '"set its weight to 0" — counts what moves, keeps the weights sentence, names the category on its '
  + 'button, and is no longer red',
  cfW.confirmOpen && !/backup/i.test(cfW.panel) && !/set its weight to 0/i.test(cfW.panel)
    && !/cannot be undone/i.test(cfW.panel)
    && /keeps the work filed under it/.test(cfW.lead) && /stop counting toward the grade/.test(cfW.lead)
    && cfW.facts[0] === '2 assignments and 4 scores move to no category.'
    && /^The remaining categories keep the weights they have, so this class totals 60% until you set them\.$/.test(cfW.facts[1])
    && cfW.button === 'Remove Essays' && !cfW.buttonDanger && cfW.buttonColor !== 'rgb(231, 76, 60)'
    && cfW.factsClass === 'mode-change-facts' && cfW.lineClasses.every((c) => c === 'mode-change-line'),
  JSON.stringify({ panel: cfW.panel, button: [cfW.button, cfW.buttonColor], facts: cfW.factsClass }));

check('WO-3.43: in a weighted class the add and crossing announcements are byte-for-byte what they were, and '
  + 'the removal says where the work went',
  JSON.stringify(saidAddW) === JSON.stringify(['Added New category to WO-3.43 Weighted at 0 percent.'])
    && JSON.stringify(saidW) === JSON.stringify([
      'Weights total 60 percent, not 100. Grades are provisional.',
      'Removed Essays from WO-3.43 Weighted. Its 2 assignments are now under no category and count for '
        + 'nothing until you file them again.']),
  JSON.stringify({ add: saidAddW, remove: saidW }));

await closeAll();
const listW = await assignmentGroups(CW);
check('WO-3.43: on the weighted class\'s assignment list both essays are found again under "Not in a category", '
  + 'red, and the quiz is still under Quizzes',
  listW.open === CW && JSON.stringify(listW.groups['Not in a category']) === JSON.stringify(['Essay 1', 'Essay 2'])
    && JSON.stringify(listW.groups['Quizzes']) === JSON.stringify(['Quiz 1'])
    && !('Essays' in listW.groups) && !listW.counted && /nothing counts them at all/.test(listW.notice),
  JSON.stringify(listW));

/* ══ TOTAL POINTS ══ */
const p0 = await snapshot();
const gP0 = await engine(CP, TP);
await openEditor(CP);
await listen();
await clickSel('#categoriesModal [data-category-add]');
const saidAddP = await heard();
await clickSel('#categoryList .category-row:nth-child(3) [data-category-remove]');
await new Promise(r => setTimeout(r, 150));

await clickSel('#categoryList .category-row:nth-child(1) [data-category-remove]');
await new Promise(r => setTimeout(r, 150));
const cfP = await readScreen();
await listen();
await clickSel('[data-category-remove-confirm]');
const saidP = await heard();
const p1 = await snapshot();
const edP = await readScreen();
const gP1 = await engine(CP, TP);
const movedP = ['a343pe1', 'a343pe2'];

check('WO-3.43: removing a category in a points class leaves its work in the document under categoryId \'\' with '
  + 'every score column byte-identical, and every student\'s classGrade() percentage is identical before and '
  + 'after — 80.625 and 40.625 by hand',
  Math.abs(gP0[0].pct - 80.625) < 1e-9 && Math.abs(gP0[1].pct - 40.625) < 1e-9
    && gP1.every((r, i) => r.pct === gP0[i].pct)
    && movedP.every((id) => sameButCategory(p0, p1, id)) && p1.scores === p0.scores
    && untouched(p0, p1, movedP) && p1.count === p0.count,
  JSON.stringify({ before: gP0.map((r) => r.pct), after: gP1.map((r) => r.pct),
    moved: movedP.map((id) => p1.assignments[id] || 'GONE'), scoresSame: p1.scores === p0.scores }));

check('WO-3.43: and the work appears in the no-category row — the engine\'s null row holds the essays\' 150 '
  + 'possible points for both students, and the editor draws its share line',
  gP1.every((r) => r.loose && r.loose.possible === 150 && r.rowIds.join() === 'k343pq,')
    && gP1[0].loose.earned === 120 && gP1[1].loose.earned === 60
    && gP0.every((r) => r.loose === null)
    && edP.looseShare && /^no category — /.test(edP.looseShareText),
  JSON.stringify({ rows: gP1.map((r) => [r.rowIds, r.loose]), share: edP.looseShareText }));

check('WO-3.43: the points confirm contains no "weight", no "0%" and no "backup" anywhere in the dialog, says the '
  + 'work goes on counting, and names the category on a button that is not red',
  cfP.confirmOpen && !/weight/i.test(cfP.panel) && cfP.panel.indexOf('0%') === -1 && !/backup/i.test(cfP.panel)
    && /keeps the work filed under it/.test(cfP.lead) && /go on counting toward the grade/.test(cfP.lead)
    && cfP.facts[0] === '2 assignments and 4 scores move to no category.'
    && cfP.facts[1] === 'Every point in them still counts, so no grade in WO-3.43 Points changes.'
    && cfP.button === 'Remove Essays' && !cfP.buttonDanger,
  JSON.stringify({ panel: cfP.panel, button: cfP.button }));

check('WO-3.43: in a points class the add and crossing announcements read the points wording, and the removal '
  + 'says the work still counts',
  JSON.stringify(saidAddP) === JSON.stringify([
    'Added New category to WO-3.43 Points, which is graded on total points, so it needs no weight.'])
    && JSON.stringify(saidP) === JSON.stringify([
      'The weights now total 60 percent. WO-3.43 Points is graded on total points, so they change no grade.',
      'Removed Essays from WO-3.43 Points. Its 2 assignments are now under no category and still count '
        + 'toward the grade.']),
  JSON.stringify({ add: saidAddP, remove: saidP }));

/* The editor's own hints, read in each mode as the teacher sees them, before she taps Remove. Until
   the owner's amendment of 2026-10-04 both said a removal takes the work with it — the opposite of
   the confirm above them. The weighted one keeps its weight-0 advice, which is still true. */
const claimsLoss = /takes? (the )?work|with it,|destroy|delet|losing anything|cannot be undone|backup/i;
check('WO-3.43: the categories editor\'s visible hints agree with the confirm in both modes — neither claims a '
  + 'removal takes, destroys or loses the work; each says removing keeps the work under no category, the '
  + 'weighted one that it stops counting and still offers weight 0, the points one that it goes on counting',
  cfW.hints.length > 0 && cfP.hints.length > 0
    && cfW.hints.concat(cfP.hints).every((t) => !claimsLoss.test(t))
    && cfW.hints.some((t) => /Removing a category keeps the work filed under it[^.]*under no category[^.]*stop counting toward the grade/.test(t))
    && cfW.hints.some((t) => /set its weight to 0/.test(t))
    && cfP.hints.some((t) => /Removing a category keeps the work filed under it\. [^.]*under no category[^.]*go on counting toward the grade/.test(t))
    && !cfP.hints.some((t) => /set its weight to 0/.test(t)),
  JSON.stringify({ weighted: cfW.hints, points: cfP.hints }));

await closeAll();
const listP = await assignmentGroups(CP);
check('WO-3.43: on the points class\'s assignment list both essays are found again under "Not in a category", '
  + 'amber and counted',
  listP.open === CP && JSON.stringify(listP.groups['Not in a category']) === JSON.stringify(['Essay 1', 'Essay 2'])
    && !('Essays' in listP.groups) && listP.counted && /the grade counts them/.test(listP.notice),
  JSON.stringify(listP));

/* THE FIXTURE COMES BACK OUT, by id, and the page is handed back as grading-mode.mjs leaves it. */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var mine = [${JSON.stringify(CW)}, ${JSON.stringify(CP)}, ${JSON.stringify(CX)}];
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return mine.indexOf(x.id) === -1; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo343-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return mine.indexOf(a.classId) === -1; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a343') === 0) delete doc.scores[k]; });
  });
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);
}
