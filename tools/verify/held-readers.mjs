/* held-readers.mjs — the readers that hide a held column ask the engine whether it is held (WO-3.53)
 *
 * Four readers, one ruling (the owner's, 2026-10-07): A HELD COLUMN IS NOT THERE. The concern list
 * (src/signals.js, read through the screen's own model), the past-due prompt (src/past-due.js), the
 * graded-pieces answer (src/graded-pieces.js) and `{{missing.list}}` (src/merge-fields.js) each ignore
 * a column whose assignment carries `held: true`, and each follows it the moment the column is live.
 *
 * NOTHING IN THE APP CAN HOLD A COLUMN YET — WO-3.46 owns the writer — so this section plants the key
 * straight into the document, the way WO-3.52's engine checks do, and "committing" is the same document
 * with every `held` deleted and a `committedAt` stamped, which is what that writer will leave behind.
 * Every reading is taken twice on ONE fixture, held and then live, so each "nothing from that column"
 * sits beside the reading that proves the reader could see it.
 *
 * THE FIXTURE, and why each column is where it is. One points class, two categories, two students.
 * Wo353Held Reader (S) is the student every claim is about; Wo353Blank Row (T) exists only to have
 * blank cells for the past-due prompt to offer. Document order, which is the order a run of scores is
 * read in:
 *
 *   L1, L2      live, Essays, 100 — S MISSING on both. Two missing: one short of the default three.
 *   L3–L12      live, Essays, 100 — S 95 on each.
 *   H4          HELD, Reading checks, 100 — S 80. The only work in Reading checks, for graded-pieces.
 *   H1          HELD, Essays, 100 — S MISSING. The third missing.
 *   H2          HELD, Essays, 100, due YESTERDAY — S 40, T blank. The first low score, and the held
 *               column the past-due prompt must not offer.
 *   H3          HELD, Essays, 100 — S 40. The second low score.
 *   L13         live, Essays, 100, due YESTERDAY — S 40, T blank. The live low score the two held ones
 *               join to make a run of three, and the live past-due control.
 *
 * HAND-WORKED, against the default thresholds (thresholdsOf(); nothing here is tuned):
 *   held  S's grade 990/1300 = 76.15%. Missing 2 (<3). Scores end 95, 40 — a run of 1 (<3). The
 *         last four counted (L10–L13) taken out leave 665/900 = 73.89%, so the grade ROSE across
 *         them and grade-fell is quiet. Concern: nothing.
 *   live  S's grade 1150/1700 = 67.65% (not under 65). Missing 3 (L1, L2, H1). Scores end 80, 40, 40,
 *         40 — a run of 3 under 60. The last four counted are H1, H2, H3, L13; without them
 *         1030/1300 = 79.23%, a fall of 11.58 (≥10). Concern: grade-fell, low-score-run, missing-count.
 *   past-due, held: 1 blank (T on L13). Live: 2 blanks (T on H2 and L13), in that order.
 *   graded-pieces, held: Essays only. Live: Essays and Reading checks.
 *   {{missing.list}}, held: L1 and L2 by name. Live: L1, L2 and H1.
 *
 * THE DATES ARE NODE'S (lib-dates.mjs), for the reason past-due.mjs gives. Two modules are reached by
 * a dynamic import() of the URL the page already loaded — the same instance, so the same store —
 * because neither has a window.planbook seam: src/past-due.js (paintPastDue, pastDueAsksAbout) and
 * src/graded-pieces.js (gradedPieces). WO-3.52 made that the precedent in score-history.mjs.
 *
 * It plants its class through the store, selects it, sets the concern list's filter to it, and puts
 * all three back at its foot, with the class, its students, its assignments and their score columns
 * taken out again. No reload, no viewport change, no presentation-mode change.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs } = h;

console.log('\n--- the readers that hide a held column (WO-3.53) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.classes"
  + " && window.planbook.signals && window.planbook.signalsView && window.planbook.mergeFields"
  + " && window.planbook.gradeEngine)"))) {
  skip('the readers that hide a held column (WO-3.53)', 'window.planbook is missing one of store, '
    + 'classes, signals, signalsView, mergeFields or gradeEngine, so nothing can be planted or read');
  return;
}

const CLS = 'c_wo353', TERM = 'tm_wo353', K1 = 'k_wo353a', K2 = 'k_wo353b';
const S = 's_wo353a', T = 's_wo353b';
const YESTERDAY = nodeDaysFromToday(-1);

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes, v = window.planbook.signalsView;
  if (!s.getDoc()) return { ok: false, why: 'no year document is open' };
  var m0 = v.signalsModel();
  var was = { cls: c.getSelectedClassId(), filter: m0.classId || '', rule: m0.ruleId || '' };
  var a = function(id, cat, name, extra){
    var o = { id: id, classId: '${CLS}', termId: '${TERM}', categoryId: cat, name: name,
      points: 100, assigned: '', due: '' };
    Object.keys(extra || {}).forEach(function(k){ o[k] = extra[k]; });
    return o; };
  var work = [a('wo353-L1', '${K1}', 'Wo353 live missing one'),
    a('wo353-L2', '${K1}', 'Wo353 live missing two')];
  for (var i = 3; i <= 12; i++) work.push(a('wo353-L' + i, '${K1}', 'Wo353 essay ' + i));
  work.push(a('wo353-H4', '${K2}', 'Wo353 held reading check', { held: true }));
  work.push(a('wo353-H1', '${K1}', 'Wo353 held missing', { held: true }));
  work.push(a('wo353-H2', '${K1}', 'Wo353 held low one', { held: true, due: '${YESTERDAY}' }));
  work.push(a('wo353-H3', '${K1}', 'Wo353 held low two', { held: true }));
  work.push(a('wo353-L13', '${K1}', 'Wo353 live low', { due: '${YESTERDAY}' }));
  var cells = { 'wo353-L1': { v: null, flag: 'missing' }, 'wo353-L2': { v: null, flag: 'missing' },
    'wo353-H4': { v: 80 }, 'wo353-H1': { v: null, flag: 'missing' }, 'wo353-H2': { v: 40 },
    'wo353-H3': { v: 40 }, 'wo353-L13': { v: 40 } };
  for (var j = 3; j <= 12; j++) cells['wo353-L' + j] = { v: 95 };
  s.update(function(doc){
    doc.classes.push({ id: '${CLS}', name: 'WO-3.53 Held readers', archived: false,
      gradingMode: 'points',
      terms: [{ id: '${TERM}', label: 'WO-3.53 Term', start: '', end: '' }],
      categories: [{ id: '${K1}', name: 'Essays', weight: 50 },
                   { id: '${K2}', name: 'Reading checks', weight: 50 }],
      roster: ['${S}', '${T}'] });
    doc.students.push({ id: '${S}', first: 'Wo353Held', last: 'Reader' });
    doc.students.push({ id: '${T}', first: 'Wo353Blank', last: 'Row' });
    work.forEach(function(w){ doc.assignments.push(w); });
    if (!doc.scores) doc.scores = {};
    Object.keys(cells).forEach(function(id){ doc.scores[id] = {}; doc.scores[id]['${S}'] = cells[id]; });
  });
  await s.flush();
  c.selectClass('${CLS}');
  v.setSignalsFilter('${CLS}');
  v.setSignalsRule('');
  var d = s.getDoc();
  return { ok: true, was: was,
    held: d.assignments.filter(function(x){ return x.classId === '${CLS}'
      && window.planbook.gradeEngine.isHeld(x); }).length,
    all: d.assignments.filter(function(x){ return x.classId === '${CLS}'; }).length,
    open: c.getSelectedClassId() }; })()`);

if (!plant || !plant.ok || plant.held !== 4 || plant.all !== 17 || plant.open !== CLS) {
  check('WO-3.53: the fixture is real — one points class, seventeen assignments of which four are '
    + 'held, open on screen', false, JSON.stringify(plant));
  return;
}

/* Every reader, read once, off the document as it stands. */
const readAll = () => evalJs(`(async function(){
  var s = window.planbook.store, v = window.planbook.signalsView;
  var d = s.getDoc();
  var cls = d.classes.filter(function(x){ return x.id === '${CLS}'; })[0];
  var m = v.signalsModel();
  var row = m.concern.rows.filter(function(r){ return r.studentId === '${S}' && r.classId === '${CLS}'; })[0];
  var hits = window.planbook.signals.evaluate(d, cls, '${TERM}', { studentIds: ['${S}'] })
    .filter(function(x){ return x.direction === 'concern'; })
    .map(function(x){ return x.ruleId; }).sort();
  var pd = await import(new URL('src/past-due.js', document.baseURI).href);
  pd.paintPastDue();
  var host = document.getElementById('scoresPastDue');
  var gp = await import(new URL('src/graded-pieces.js', document.baseURI).href);
  var mf = window.planbook.mergeFields;
  var req = { doc: d, classId: '${CLS}', termId: '${TERM}', studentId: '${S}' };
  return {
    blocked: m.blocked,
    row: row ? [row.lead.ruleId].concat(row.tags.map(function(x){ return x.ruleId; })).sort() : [],
    hits: hits,
    asks: ['wo353-H2', 'wo353-L13'].map(function(id){ return pd.pastDueAsksAbout(id); }),
    lead: host ? ((host.querySelector('.past-due-lead') || {}).textContent || '') : null,
    where: host ? ((host.querySelector('.past-due-where') || {}).textContent || '') : null,
    pieces: gp.gradedPieces(d, cls, '${TERM}', '${S}'),
    list: mf.resolveText('{{missing.list}}', req).text,
    count: mf.resolveText('{{missing.count}}', req).text };
})()`);

const held = await readAll();

/* Commit: every `held` deleted and a `committedAt` stamped — what WO-3.46's writer will leave. */
await evalJs(`(async function(){
  var s = window.planbook.store;
  s.update(function(doc){
    doc.assignments.forEach(function(a){
      if (a.classId !== '${CLS}' || !Object.prototype.hasOwnProperty.call(a, 'held')) return;
      delete a.held;
      a.committedAt = '2026-10-08T09:00:00-04:00';
    });
  });
  await s.flush();
  return 1; })()`);

const live = await readAll();

const LIVE_CONCERN = ['grade-fell', 'low-score-run', 'missing-count'];
check('WO-3.53: with three held columns holding a MISSING and two low scores for one student, the '
  + 'concern list shows nothing for her — no row on the screen\'s model and no concern hit from the '
  + 'engine, against the default thresholds — and with `held` deleted and the columns committed the '
  + 'matching signals fire: missing-count (3) and low-score-run (3 under 60), with grade-fell (11.58 '
  + 'points) beside them, on the model and in the engine alike',
  held.blocked === false && held.row.length === 0 && held.hits.length === 0
    && JSON.stringify(live.row) === JSON.stringify(LIVE_CONCERN)
    && JSON.stringify(live.hits) === JSON.stringify(LIVE_CONCERN),
  'held: row ' + JSON.stringify(held.row) + ', engine ' + JSON.stringify(held.hits)
    + ' · live: row ' + JSON.stringify(live.row) + ', engine ' + JSON.stringify(live.hits)
    + ' · presentation-mode refusal ' + held.blocked);

check('WO-3.53: the past-due prompt does not name a held column whose due date has passed — one blank, '
  + 'the live column\'s, and no tint asked for the held one — and once the column is live it names '
  + 'both, the held column first, as two blanks',
  held.lead === '1 blank is past due — mark it missing?'
    && /^In Wo353 live low \(due [^)]+\)\. /.test(held.where) && held.where.indexOf('held') < 0
    && JSON.stringify(held.asks) === JSON.stringify([false, true])
    && live.lead === '2 blanks are past due — mark them missing?'
    && /^In Wo353 held low one \(due [^)]+\) and Wo353 live low \(due [^)]+\)\. /.test(live.where)
    && JSON.stringify(live.asks) === JSON.stringify([true, true]),
  'held: ' + JSON.stringify([held.lead, held.where, held.asks]) + ' · live: '
    + JSON.stringify([live.lead, live.where, live.asks]));

check('WO-3.53: graded-pieces reports no counted work for a category whose only work is held — Essays '
  + 'alone while Reading checks\' one column is held, and both once it is live',
  JSON.stringify(held.pieces) === JSON.stringify({ ids: [K1], loose: false })
    && JSON.stringify(live.pieces) === JSON.stringify({ ids: [K1, K2], loose: false }),
  'held ' + JSON.stringify(held.pieces) + ' · live ' + JSON.stringify(live.pieces));

check('WO-3.53: {{missing.list}} does not name a held column\'s missing work and {{missing.count}} does '
  + 'not count it — two, by name — and once the column is live both name it: three',
  held.list === 'Wo353 live missing one, Wo353 live missing two' && held.count === '2'
    && live.list === 'Wo353 live missing one, Wo353 live missing two, Wo353 held missing'
    && live.count === '3',
  'held ' + JSON.stringify([held.list, held.count]) + ' · live ' + JSON.stringify([live.list, live.count]));

/* THE FIXTURE COMES BACK OUT, and the open class and the concern list's two filters are put back as
   they were found. Written as one update rather than through the Delete controls, for the reason
   past-due.mjs's teardown gives: a fixture coming down is not a claim being made. */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes, v = window.planbook.signalsView;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return x.id !== '${S}' && x.id !== '${T}'; });
    doc.assignments = doc.assignments.filter(function(x){ return x.classId !== '${CLS}'; });
    Object.keys(doc.scores || {}).forEach(function(k){
      if (String(k).indexOf('wo353-') === 0) delete doc.scores[k]; });
  });
  var was = ${JSON.stringify(plant.was)};
  v.setSignalsFilter(was.filter);
  v.setSignalsRule(was.rule);
  if (was.cls) c.selectClass(was.cls);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
}
