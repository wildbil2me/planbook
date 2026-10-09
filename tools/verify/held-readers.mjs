/* held-readers.mjs — the readers that hide a held column ask the engine whether it is held (WO-3.53)
 *
 * Four readers, one ruling (the owner's, 2026-10-07): A HELD COLUMN IS NOT THERE. The concern list
 * (src/signals.js, read through the screen's own model), the past-due prompt (src/past-due.js), the
 * graded-pieces answer (src/graded-pieces.js) and `{{missing.list}}` (src/merge-fields.js) each ignore
 * a column whose assignment carries `held: true`, and each follows it the moment the column is live.
 *
 * NOTHING IN THE APP COULD HOLD A COLUMN when this was written — WO-3.46 owns the writer, and its own
 * block at the foot of this file holds and commits columns through the app — so this section plants the key
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

await heldWriters(h);
}

/* ═══════════════ WO-3.46 — holding a column, from the grid and the editor ═══════════════
 *
 * WO-3.53's checks above plant `held` straight into the document because nothing could write it.
 * WO-3.46 is the writer, so from here a column is held and committed THROUGH THE APP: the grid's Hold /
 * Commit control on a column head, the confirm it opens (src/held-column.js), and the assignment
 * editor's "Hold out of the grade" box. Scores are TYPED through the grid's cells as keystrokes, which
 * is what puts them through src/scores.js's putCell() and so through reviseCell() with the column's
 * state — the end-to-end half WO-3.52's unit checks could not reach. The past-due accept is driven
 * through src/past-due.js's own acceptPastDue(), its second caller.
 *
 * THE FIXTURE. Two classes, planted through the store; every hold and commit after that is a tap.
 *   W  weighted, Essays 50 / Quizzes 30 / Homework 20, four students (Alpha … Delta), one term with no
 *      dates (so nothing the editor does moves work between terms).
 *        E1  Essays    80 70 90 85         H1  Homework  90 80 70 95
 *        Q1  Quizzes   HELD, 50 60 — the only work in Quizzes
 *        E2  Essays    Alpha 60, Bravo MISSING, Charlie EXCUSED, Delta no cell — held and committed
 *                      from the grid: Alpha and Bravo move, Charlie and Delta must not be named
 *        E3  Essays    nothing entered — the confirm that moves no grade
 *        R1  Essays    empty — held, typed 72 then 74, committed, typed 75 (ruling 1)
 *        R2  Essays    Alpha 60 with a trail [55], stamped a minute ago — INSIDE the five minutes,
 *                      so a live column would replace it and only the hold boundary pushes it — held,
 *                      typed 65 then 66, committed, typed 70 (ruling 2)
 *        P1, P2  Essays, due YESTERDAY, Alpha a blank with a past ([72]) ten minutes old — P1 is held
 *                under a past-due offer that was made while it was live, P2 is the live control
 *        P3  Essays, HELD, due yesterday, Alpha a blank with a past, stamped two seconds ago — committed,
 *            then offered and accepted: the commit is a version boundary through acceptPastDue()
 *   P  points, one category, three students — PB (50 points) held and committed from the grid:
 *      Papa 80/40/10 moves; Quebec's PB is excused and Romeo has no PB cell, so neither is named.
 *
 * TIMING. `at`, `heldAt` and `committedAt` are second-granular (localStamp()), and a write in the very
 * second of a hold or a commit counts as before it — WO-3.52's ruling, and its one documented spare.
 * So every first keystroke after a hold or a commit waits 1.1s, which is what makes each trail below
 * exact rather than one entry long by the clock's luck. The page clock is never moved here.
 *
 * It takes both classes, their students, their work and their score columns back out at its foot,
 * and leaves the page on the home view. No reload, no viewport change, no presentation-mode change.
 */
async function heldWriters(h) {
const { check, skip, evalJs, send, clickSel, clickVisible } = h;

console.log('\n--- holding a column, from the grid and the editor (WO-3.46) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.heldColumn && window.planbook.store"
  + " && window.planbook.classes && window.planbook.gradeEngine && window.planbook.scores)"))) {
  skip('holding a column (WO-3.46)', 'window.planbook is missing one of heldColumn, store, classes, '
    + 'gradeEngine or scores, so nothing can be planted, held or read');
  return;
}

const W = 'c_wo346w', WT = 'tm_wo346w', P = 'c_wo346p', PT = 'tm_wo346p';
const KE = 'k_wo346e', KQ = 'k_wo346q', KH = 'k_wo346h', KP = 'k_wo346p';
const SA = 's_wo346a', SB = 's_wo346b', SC = 's_wo346c', SD = 's_wo346d';
const PP = 's_wo346p', PQ = 's_wo346q', PR = 's_wo346r';
const YESTERDAY = nodeDaysFromToday(-1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  if (!s.getDoc()) return { ok: false, why: 'no year document is open' };
  var lg = await import(new URL('src/log.js', document.baseURI).href);
  var ago = function(ms){ return lg.localStamp(new Date(Date.now() - ms)); };
  var was = c.getSelectedClassId();
  var a = function(id, cls, term, cat, name, pts, extra){
    var o = { id: id, classId: cls, termId: term, categoryId: cat, name: name, points: pts,
      assigned: '', due: '' };
    Object.keys(extra || {}).forEach(function(k){ o[k] = extra[k]; });
    return o; };
  var work = [
    a('wo346-E1', '${W}', '${WT}', '${KE}', 'Wo346 essay one', 100),
    a('wo346-Q1', '${W}', '${WT}', '${KQ}', 'Wo346 held quiz', 100, { held: true, heldAt: ago(3600000) }),
    a('wo346-H1', '${W}', '${WT}', '${KH}', 'Wo346 homework', 100),
    a('wo346-E2', '${W}', '${WT}', '${KE}', 'Wo346 essay two', 100),
    a('wo346-E3', '${W}', '${WT}', '${KE}', 'Wo346 essay three', 100),
    a('wo346-R1', '${W}', '${WT}', '${KE}', 'Wo346 ruling one', 100),
    a('wo346-R2', '${W}', '${WT}', '${KE}', 'Wo346 ruling two', 100),
    a('wo346-P1', '${W}', '${WT}', '${KE}', 'Wo346 past due held', 100, { due: '${YESTERDAY}' }),
    a('wo346-P2', '${W}', '${WT}', '${KE}', 'Wo346 past due live', 100, { due: '${YESTERDAY}' }),
    a('wo346-P3', '${W}', '${WT}', '${KE}', 'Wo346 past due committed', 100,
      { due: '${YESTERDAY}', held: true, heldAt: ago(3600000) }),
    a('wo346-PA', '${P}', '${PT}', '${KP}', 'Wo346 points A', 100),
    a('wo346-PB', '${P}', '${PT}', '${KP}', 'Wo346 points B', 50),
    a('wo346-PC', '${P}', '${PT}', '', 'Wo346 points loose', 20) ];
  var sc = {
    'wo346-E1': { '${SA}': { v: 80 }, '${SB}': { v: 70 }, '${SC}': { v: 90 }, '${SD}': { v: 85 } },
    'wo346-H1': { '${SA}': { v: 90 }, '${SB}': { v: 80 }, '${SC}': { v: 70 }, '${SD}': { v: 95 } },
    'wo346-Q1': { '${SA}': { v: 50 }, '${SB}': { v: 60 } },
    'wo346-E2': { '${SA}': { v: 60 }, '${SB}': { v: null, flag: 'missing' },
                  '${SC}': { v: null, flag: 'excused' } },
    'wo346-R2': { '${SA}': { v: 60, at: ago(60000), was: [{ v: 55, at: ago(1200000) }] } },
    'wo346-P1': { '${SA}': { v: null, at: ago(600000), was: [{ v: 72, at: ago(1200000) }] } },
    'wo346-P2': { '${SA}': { v: null, at: ago(600000), was: [{ v: 72, at: ago(1200000) }] } },
    'wo346-P3': { '${SA}': { v: null, at: ago(2000), was: [{ v: 70, at: ago(1800000) }] } },
    'wo346-PA': { '${PP}': { v: 80 }, '${PQ}': { v: 90 }, '${PR}': { v: 70 } },
    'wo346-PB': { '${PP}': { v: 40 }, '${PQ}': { v: null, flag: 'excused' } },
    'wo346-PC': { '${PP}': { v: 10 } } };
  s.update(function(doc){
    doc.classes.push({ id: '${W}', name: 'WO-3.46 Weighted', archived: false,
      terms: [{ id: '${WT}', label: 'WO-3.46 Term', start: '', end: '' }],
      categories: [{ id: '${KE}', name: 'Essays', weight: 50 }, { id: '${KQ}', name: 'Quizzes', weight: 30 },
                   { id: '${KH}', name: 'Homework', weight: 20 }],
      roster: ['${SA}', '${SB}', '${SC}', '${SD}'] });
    doc.classes.push({ id: '${P}', name: 'WO-3.46 Points', archived: false, gradingMode: 'points',
      terms: [{ id: '${PT}', label: 'WO-3.46 Points term', start: '', end: '' }],
      categories: [{ id: '${KP}', name: 'Essays', weight: 100 }],
      roster: ['${PP}', '${PQ}', '${PR}'] });
    [['${SA}', 'Alpha'], ['${SB}', 'Bravo'], ['${SC}', 'Charlie'], ['${SD}', 'Delta'],
     ['${PP}', 'Papa'], ['${PQ}', 'Quebec'], ['${PR}', 'Romeo']].forEach(function(p){
      doc.students.push({ id: p[0], first: 'Wo346', last: p[1] }); });
    work.forEach(function(w){ doc.assignments.push(w); });
    if (!doc.scores) doc.scores = {};
    Object.keys(sc).forEach(function(id){ doc.scores[id] = sc[id]; });
  });
  await s.flush();
  c.refreshClassBar();
  return { ok: true, was: was }; })()`);

if (!plant || !plant.ok) {
  check('WO-3.46: the fixture is real — two classes planted through the store', false, JSON.stringify(plant));
  return;
}

/* ── the readers every check below is made of ── */

/* The document after a flush: its bytes and its rev. `flush()` is awaited because update() only
   SCHEDULES a save and `rev` moves 800ms later (the WO-5.3 scar). */
const snap = () => evalJs(`(async function(){
  var s = window.planbook.store; await s.flush(); var d = s.getDoc();
  return { json: JSON.stringify(d), rev: d.rev }; })()`);

/* One assignment as stored, its score column as stored, and the rev — after a flush. */
const read = (id) => evalJs(`(async function(){
  var s = window.planbook.store; await s.flush(); var d = s.getDoc();
  var a = d.assignments.filter(function(x){ return x.id === ${JSON.stringify(id)}; })[0] || null;
  return { a: a ? JSON.parse(JSON.stringify(a)) : null,
    scores: JSON.stringify((d.scores || {})[${JSON.stringify(id)}] || null), rev: d.rev,
    held: window.planbook.gradeEngine.isHeld(a) }; })()`);

/* Every student's class grade in one class, the engine's own figure. */
const grades = (cls, term) => evalJs(`(function(){
  var d = window.planbook.store.getDoc();
  var k = d.classes.filter(function(x){ return x.id === ${JSON.stringify(cls)}; })[0];
  var out = {};
  (k.roster || []).forEach(function(id){
    out[id] = window.planbook.gradeEngine.classGrade(d, k, ${JSON.stringify(term)}, id).percentage; });
  return out; })()`);

/* The confirm as it stands on screen, and the model it was drawn from. */
const confirmShown = (id) => evalJs(`(function(){
  var m = document.getElementById('holdModal');
  var lines = Array.prototype.map.call(document.querySelectorAll('#holdChanges [data-hold-change]'),
    function(l){ return { id: l.getAttribute('data-hold-change'), text: l.textContent }; });
  var none = document.querySelector('#holdChanges [data-hold-none]');
  return { open: !!m && !m.classList.contains('hidden'),
    title: (document.getElementById('holdTitle') || {}).textContent || '',
    label: (document.getElementById('holdChangesLabel') || {}).textContent || '',
    button: (document.getElementById('holdConfirmBtn') || {}).textContent || '',
    lines: lines, none: none ? none.textContent : null,
    model: window.planbook.heldColumn.holdPreview(${JSON.stringify(id)}) }; })()`);

const fmt = (p) => p === null ? 'no grade' : Number(p).toFixed(2) + '%';

/* A key AT THE PAGE — score-grid.mjs's helper, so a digit reaches the cell through `beforeinput` and
   `input` exactly as a keyboard's does, and src/shell.js's listener is what writes it. */
const sk = async (k, code, vk, text) => {
  const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 0 };
  if (text) ev.text = text;
  await send('Input.dispatchKeyEvent', Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
  await sleep(45);
};
const cellSel = (a, s) => '#scoresBody [data-score-cell="' + a + '"][data-score-student="' + s + '"]';
/* Into one cell, over whatever it shows: focused by a click, its value selected, then the digits. */
const typeInto = async (a, s, digits) => {
  await clickSel(cellSel(a, s));
  await evalJs('(function(){ var i = document.querySelector(' + JSON.stringify(cellSel(a, s))
    + '); i.focus(); i.select(); return 1; })()');
  for (const d of String(digits).split('')) await sk(d, 'Digit' + d, d.charCodeAt(0), d);
};
const toGrid = async (cls) => {
  await clickVisible('[data-class-tab="' + cls + '"]');
  await sleep(250);
  await clickVisible('[data-class-screen="scores"]');
  await sleep(300);
};
/* The column is brought into the grid's own scroll box first, with the app's own door for that
   (revealScoreColumn(), WO-6.8): the head is sticky inside an `overflow: auto` box, and clickSel's
   scrollIntoView does not reliably scroll a sticky cell's box sideways — a column past the box's right
   edge is clipped, and the click lands on the page beside the grid. Measured on the first run of this
   block, where every column right of the fold failed to open its confirm. */
const viaGrid = async (id) => {
  await evalJs('window.planbook.scores.revealScoreColumn(' + JSON.stringify(id) + ') ? 1 : 0');
  await sleep(100);
  await clickSel('#scoresHead [data-score-hold="' + id + '"]');
  await sleep(150);
  return confirmShown(id);
};
const yes = async () => { await clickSel('#holdModal [data-hold-confirm]'); await sleep(200); };
const no = async () => { await clickSel('#holdModal [data-hold-cancel]'); await sleep(200); };

/* What a confirm promised against what the write then did: every student whose figure moved is one
   the confirm named, every named one landed on the figure it named, and the line on screen says the
   two figures the grid prints. */
const kept = (shown, before, after) => {
  const moved = Object.keys(after).filter((id) => after[id] !== before[id]).sort();
  const named = shown.lines.map((l) => l.id).sort();
  const figures = shown.model.changes.every((c) => after[c.studentId] === c.after.percentage
    && before[c.studentId] === c.before.percentage);
  const texts = shown.lines.every((l) => {
    const c = shown.model.changes.filter((x) => x.studentId === l.id)[0];
    return !!c && l.text.indexOf(fmt(c.before.percentage)) >= 0 && l.text.indexOf(fmt(c.after.percentage)) >= 0
      && l.text.indexOf(' → ') > 0 && l.text.indexOf(c.name) === 0;
  });
  return { ok: JSON.stringify(moved) === JSON.stringify(named) && figures && texts && named.length > 0,
    moved: moved, named: named, figures: figures, texts: texts };
};

await toGrid(W);
const gridUp = await evalJs(`(function(){
  var heads = document.querySelectorAll('#scoresHead [data-score-hold]');
  var q = document.querySelector('#scoresHead [data-score-col="wo346-Q1"]');
  var cell = document.querySelector(${JSON.stringify(cellSel('wo346-Q1', SA))});
  var e1 = document.querySelector('#scoresHead [data-score-hold="wo346-E1"]');
  return { view: !document.getElementById('scoresView').classList.contains('hidden'), controls: heads.length,
    qHeld: !!q && q.classList.contains('held') && /Held/.test(q.textContent)
      && /out of the grade/.test(q.textContent),
    qButton: (q && q.querySelector('[data-score-hold]') || {}).textContent || '',
    qCell: cell ? cell.getAttribute('aria-label') : '',
    e1Button: e1 ? e1.textContent : '', e1Mark: !!document.querySelector('#scoresHead [data-score-col="wo346-E1"] .scores-col-held') }; })()`);
check('WO-3.46: the score grid shows a held column as held — a Held mark and the words "out of the grade" '
  + 'on its head, "held out of the grade" in each cell\'s accessible name, and Commit as its control — '
  + 'while a live column carries Hold and no mark',
  gridUp.view && gridUp.controls === 10 && gridUp.qHeld && gridUp.qButton === 'Commit'
    && /, held out of the grade$/.test(gridUp.qCell) && gridUp.e1Button === 'Hold' && !gridUp.e1Mark,
  JSON.stringify(gridUp));

/* ── Acceptance 1 and 2, weighted: E2 held from the grid, then committed from the grid ── */
const e2Start = await read('wo346-E2');
const wBeforeHold = await grades(W, WT);
const holdE2 = await viaGrid('wo346-E2');
await yes();
const e2Held = await read('wo346-E2');
const wAfterHold = await grades(W, WT);
await sleep(1100);
const commitE2 = await viaGrid('wo346-E2');
await yes();
const e2Live = await read('wo346-E2');
const wAfterCommit = await grades(W, WT);

const keysOf = (o) => Object.keys(o || {}).sort();
const addedOnHold = keysOf(e2Held.a).filter((k) => keysOf(e2Start.a).indexOf(k) < 0);
const sameElse = (x, y, skipKeys) => keysOf(x).filter((k) => skipKeys.indexOf(k) < 0)
  .every((k) => JSON.stringify(x[k]) === JSON.stringify(y[k]));
const STAMP = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/;
check('WO-3.46: holding a column writes `held: true` and `heldAt` and nothing else — no other key on the '
  + 'assignment and no score cell moves — and `rev` moves by one; committing deletes `held`, stamps '
  + '`committedAt`, keeps `heldAt`, touches no cell, and `rev` moves by one again (flush() awaited)',
  !e2Start.held && e2Held.held && !e2Live.held
    && JSON.stringify(addedOnHold) === JSON.stringify(['heldAt', 'held'].sort())
    && e2Held.a.held === true && STAMP.test(e2Held.a.heldAt)
    && sameElse(e2Start.a, e2Held.a, ['held', 'heldAt']) && keysOf(e2Start.a).length + 2 === keysOf(e2Held.a).length
    && e2Held.scores === e2Start.scores && e2Held.rev === e2Start.rev + 1
    && !Object.prototype.hasOwnProperty.call(e2Live.a, 'held') && STAMP.test(e2Live.a.committedAt)
    && e2Live.a.heldAt === e2Held.a.heldAt
    && sameElse(e2Held.a, e2Live.a, ['held', 'committedAt'])
    && keysOf(e2Live.a).length === keysOf(e2Held.a).length
    && e2Live.scores === e2Start.scores && e2Live.rev === e2Held.rev + 1,
  'start ' + JSON.stringify(e2Start.a) + ' rev ' + e2Start.rev + ' · held ' + JSON.stringify(e2Held.a)
    + ' rev ' + e2Held.rev + ' · committed ' + JSON.stringify(e2Live.a) + ' rev ' + e2Live.rev
    + ' · scores unchanged ' + (e2Held.scores === e2Start.scores && e2Live.scores === e2Start.scores));

const wHold = kept(holdE2, wBeforeHold, wAfterHold);
const wCommit = kept(commitE2, wAfterHold, wAfterCommit);
check('WO-3.46: in a WEIGHTED class, holding a column from the grid moves exactly the grades its confirm '
  + 'named, to the figures it named — Alpha (a 60) and Bravo (a missing), never Charlie (excused) or '
  + 'Delta (no cell) — and committing it moves the same two back, again exactly as named',
  holdE2.open && /^Hold “Wo346 essay two” out of the grade\?$/.test(holdE2.title) && wHold.ok
    && JSON.stringify(wHold.named) === JSON.stringify([SA, SB].sort())
    && commitE2.open && /^Commit “Wo346 essay two” to the grade\?$/.test(commitE2.title) && wCommit.ok
    && JSON.stringify(wCommit.named) === JSON.stringify([SA, SB].sort())
    && JSON.stringify(wAfterCommit) === JSON.stringify(wBeforeHold),
  'hold: ' + JSON.stringify(Object.assign({}, wHold, { lines: holdE2.lines }))
    + ' · commit: ' + JSON.stringify(Object.assign({}, wCommit, { lines: commitE2.lines })));

/* ── Acceptance 7: Quizzes holds nothing but a held column ── */
const a7 = await evalJs(`(function(){
  var g = window.planbook.gradeEngine, d = window.planbook.store.getDoc();
  /* A hand-sized document, not the one on the page: three columns and one student, so the hand
     computation is three numbers. Q1 is the only work in Quizzes, and it is held. */
  var cls = { id: 'x', terms: [{ id: 't' }], categories: [{ id: 'e', name: 'E', weight: 50 },
    { id: 'q', name: 'Q', weight: 30 }, { id: 'h', name: 'H', weight: 20 }] };
  var work = [{ id: 'e1', classId: 'x', termId: 't', categoryId: 'e', points: 100 },
    { id: 'q1', classId: 'x', termId: 't', categoryId: 'q', points: 100, held: true },
    { id: 'h1', classId: 'x', termId: 't', categoryId: 'h', points: 100 }];
  var sc = { e1: { s: { v: 80 } }, q1: { s: { v: 50 } }, h1: { s: { v: 90 } } };
  var doc = { classes: [cls], assignments: work, scores: sc };
  var empty = { classes: [cls], assignments: work.filter(function(a){ return a.id !== 'q1'; }), scores: sc };
  var live = { classes: [cls], assignments: work.map(function(a){
    return a.id === 'q1' ? { id: 'q1', classId: 'x', termId: 't', categoryId: 'q', points: 100 } : a; }), scores: sc };
  var held = g.classGrade(doc, cls, 't', 's');
  var w = d.classes.filter(function(x){ return x.id === '${W}'; })[0];
  return { held: held.percentage, empty: g.classGrade(empty, cls, 't', 's').percentage,
    live: g.classGrade(live, cls, 't', 's').percentage,
    q: g.categoryResult(doc, cls, 't', 'q', 's'),
    eff: (held.categories || []).map(function(c){ return [c.id, c.effectiveWeight]; }),
    page: g.categoryResult(d, w, '${WT}', '${KQ}', '${SA}') }; })()`);
const HAND = (80 * 50 + 90 * 20) / (50 + 20);
check('WO-3.46: a held column that is the only work in its category leaves the category empty, and its '
  + 'weight passes to the others exactly as an empty category\'s does — by hand, Essays 80 at 50 and '
  + 'Homework 90 at 20 over 70 is 82.857142…%, the same float as the document with that column deleted, '
  + 'and 73% once it counts; the page\'s own Quizzes, whose one column is held, is empty too',
  Math.abs(a7.held - HAND) < 1e-9 && a7.held === a7.empty && Math.abs(a7.live - 73) < 1e-9
    && a7.q.possible === 0 && a7.q.percentage === null
    && JSON.stringify(a7.eff.map((e) => e[0])) === JSON.stringify(['e', 'q', 'h'])
    && Math.abs(a7.eff[0][1] - 5000 / 70) < 1e-9 && a7.eff[1][1] === null
    && Math.abs(a7.eff[2][1] - 2000 / 70) < 1e-9
    && a7.page.possible === 0 && a7.page.percentage === null,
  'hand ' + HAND + ' · held ' + a7.held + ' · column deleted ' + a7.empty + ' · live ' + a7.live
    + ' · Quizzes ' + JSON.stringify(a7.q) + ' · effective weights ' + JSON.stringify(a7.eff)
    + ' · page Quizzes ' + JSON.stringify(a7.page));

/* ── Acceptance 3: the confirm that moves nothing, and declining both ways ── */
const quietBefore = await snap();
const quiet = await viaGrid('wo346-E3');
await no();
const quietAfter = await snap();
const commitAsk = await viaGrid('wo346-Q1');
await evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 1");
await sleep(150);
const escAfter = await snap();
const holdAsk = await viaGrid('wo346-E1');
await no();
const holdNoAfter = await snap();
const closed = await evalJs("document.getElementById('holdModal').classList.contains('hidden')");
check('WO-3.46: a confirm whose column moves no grade says so in words, and declining either confirm — '
  + 'Keep it, or Escape — leaves the document byte-identical and `rev` where it was (flush() awaited)',
  quiet.open && quiet.lines.length === 0
    && quiet.none === 'No student’s grade in WO-3.46 Term changes — holding it moves nothing yet.'
    && quiet.label === 'Grades that change in WO-3.46 Term'
    && commitAsk.open && /^Commit /.test(commitAsk.title) && commitAsk.lines.length === 2
    && holdAsk.open && /^Hold /.test(holdAsk.title) && holdAsk.lines.length === 4
    && quietAfter.json === quietBefore.json && quietAfter.rev === quietBefore.rev
    && escAfter.json === quietBefore.json && holdNoAfter.json === quietBefore.json
    && holdNoAfter.rev === quietBefore.rev && closed === true,
  'quiet: ' + JSON.stringify({ open: quiet.open, none: quiet.none, label: quiet.label })
    + ' · commit asked of Q1 then Escape: ' + commitAsk.lines.length + ' line(s), identical '
    + (escAfter.json === quietBefore.json) + ' · hold asked of E1 then Keep: ' + holdAsk.lines.length
    + ' line(s), identical ' + (holdNoAfter.json === quietBefore.json) + ' · rev '
    + quietBefore.rev + ' → ' + holdNoAfter.rev);

/* ── Acceptance 5 and 6 through putCell(): ruling 1 on R1, ruling 2 on R2, typed ── */
const cellOf = (id, s) => evalJs(`(async function(){
  await window.planbook.store.flush();
  var c = ((window.planbook.store.getDoc().scores || {})[${JSON.stringify(id)}] || {})[${JSON.stringify(s)}];
  return c ? JSON.parse(JSON.stringify(c)) : null; })()`);
const vals = (cell) => (cell && cell.was ? cell.was : []).map((v) => v.flag ? v.flag : v.v);

await viaGrid('wo346-R1'); await yes(); await sleep(1100);
await typeInto('wo346-R1', SA, '72');
const r1a = await cellOf('wo346-R1', SA);
await typeInto('wo346-R1', SA, '74');
const r1b = await cellOf('wo346-R1', SA);
await sleep(1100);
await viaGrid('wo346-R1'); await yes(); await sleep(1100);
await typeInto('wo346-R1', SA, '75');
const r1c = await cellOf('wo346-R1', SA);

await viaGrid('wo346-R2'); await yes(); await sleep(1100);
await typeInto('wo346-R2', SA, '65');
const r2a = await cellOf('wo346-R2', SA);
await typeInto('wo346-R2', SA, '66');
const r2b = await cellOf('wo346-R2', SA);
await sleep(1100);
await viaGrid('wo346-R2'); await yes(); await sleep(1100);
await typeInto('wo346-R2', SA, '70');
const r2c = await cellOf('wo346-R2', SA);
const r2Live = await read('wo346-R2');

check('WO-3.46: typed through the grid into a column held from its head, 72 then 74 leaves no history; '
  + 'committed from its head, the next score typed (75) pushes the committed 74 however soon — ruling 1, '
  + 'end to end through putCell()',
  !!r1a && r1a.v === 72 && !r1a.was && !!r1b && r1b.v === 74 && !r1b.was
    && !!r1c && r1c.v === 75 && JSON.stringify(vals(r1c)) === JSON.stringify([74]),
  JSON.stringify({ held72: r1a, held74: r1b, committed75: r1c }));
check('WO-3.46: a live column with a trail [55] and a 60 typed a minute ago — inside the window, where a live '
  + 'column would replace it — held from its head and typed 65 then 66 keeps the trail beneath one new '
  + 'entry, the 60 it held before the hold, and pushes nothing for the 66; committed and '
  + 'typed 70, it pushes the committed 66 — ruling 2, end to end through putCell()',
  !!r2a && r2a.v === 65 && JSON.stringify(vals(r2a)) === JSON.stringify([55, 60])
    && !!r2b && r2b.v === 66 && JSON.stringify(vals(r2b)) === JSON.stringify([55, 60])
    && !!r2c && r2c.v === 70 && JSON.stringify(vals(r2c)) === JSON.stringify([55, 60, 66])
    && !r2Live.held && STAMP.test(r2Live.a.committedAt),
  JSON.stringify({ held65: r2a, held66: r2b, committed70: r2c }));

/* ── Acceptance 6 through acceptPastDue(): P1 held under an offer made while it was live ── */
const pd = await evalJs(`(async function(){
  var pd = await import(new URL('src/past-due.js', document.baseURI).href);
  pd.paintPastDue();
  var offered = ['wo346-P1', 'wo346-P2', 'wo346-P3'].map(function(id){ return pd.pastDueAsksAbout(id); });
  /* Held by its writer while the offer stands, so the offer still names it — the one way a held
     column reaches acceptPastDue(), and the reason this work order owes it a check: the prompt never
     offers a held column (WO-3.53), so the call site was confirmed by reading only. */
  window.planbook.heldColumn.holdColumn('wo346-P1');
  var wrote = pd.acceptPastDue();
  await window.planbook.store.flush();
  var sc = window.planbook.store.getDoc().scores;
  var cp = function(x){ return x ? JSON.parse(JSON.stringify(x)) : null; };
  return { offered: offered, wrote: wrote, p1a: cp(sc['wo346-P1']['${SA}']), p1b: cp(sc['wo346-P1']['${SB}']),
    p2a: cp(sc['wo346-P2']['${SA}']),
    p1Held: window.planbook.gradeEngine.isHeld(window.planbook.store.getDoc().assignments
      .filter(function(a){ return a.id === 'wo346-P1'; })[0]) }; })()`);
await sleep(1100);
await evalJs("window.planbook.heldColumn.commitColumn('wo346-P1'); window.planbook.scores.renderScores(); 1");
await sleep(1100);
await typeInto('wo346-P1', SB, '80');
const p1After = await cellOf('wo346-P1', SB);

/* P3: held since the fixture, its blank stamped two seconds ago, committed now — so the blank is the
   committed version, inside the five minutes of its own `at`, and only the commit boundary pushes it. */
const p3 = await evalJs(`(async function(){
  var pd = await import(new URL('src/past-due.js', document.baseURI).href);
  var lg = await import(new URL('src/log.js', document.baseURI).href);
  /* Re-stamped here rather than trusted from the plant: the run between them is long enough that
     "two seconds ago" would have aged, and the claim needs the blank well inside its own five minutes. */
  window.planbook.store.update(function(doc){
    doc.scores['wo346-P3']['${SA}'] = { v: null, at: lg.localStamp(new Date(Date.now() - 2000)),
      was: [{ v: 70, at: lg.localStamp(new Date(Date.now() - 1800000)) }] }; });
  await window.planbook.store.flush();
  window.planbook.heldColumn.commitColumn('wo346-P3');
  window.planbook.scores.renderScores();
  pd.paintPastDue();
  var asks = pd.pastDueAsksAbout('wo346-P3');
  var wrote = pd.acceptPastDue();
  await window.planbook.store.flush();
  var c = window.planbook.store.getDoc().scores['wo346-P3']['${SA}'];
  return { asks: asks, wrote: wrote, cell: c ? JSON.parse(JSON.stringify(c)) : null }; })()`);

check('WO-3.46: acceptPastDue() on a column held under its offer records no history — Alpha\'s trail [72] '
  + 'is kept as it was beneath the missing, where the live column beside it pushes the blank — and once '
  + 'committed, the next score typed (80 over Bravo\'s missing) pushes the committed missing; a column '
  + 'committed two seconds after its blank was stamped pushes that blank through acceptPastDue(), which '
  + 'only the commit boundary does',
  JSON.stringify(pd.offered) === JSON.stringify([true, true, false]) && pd.wrote === true && pd.p1Held
    && !!pd.p1a && pd.p1a.flag === 'missing' && JSON.stringify(vals(pd.p1a)) === JSON.stringify([72])
    && !!pd.p1b && pd.p1b.flag === 'missing' && !pd.p1b.was
    && !!pd.p2a && pd.p2a.flag === 'missing' && JSON.stringify(vals(pd.p2a)) === JSON.stringify([72, null])
    && !!p1After && p1After.v === 80 && JSON.stringify(vals(p1After)) === JSON.stringify(['missing'])
    && p3.asks === true && p3.wrote === true && !!p3.cell && p3.cell.flag === 'missing'
    && JSON.stringify(vals(p3.cell)) === JSON.stringify([70, null]),
  JSON.stringify({ offered: pd.offered, heldP1: pd.p1a, heldP1Bravo: pd.p1b, liveP2: pd.p2a,
    committedThenTyped: p1After, p3: p3 }));

/* ── Acceptance 2, points ── */
await toGrid(P);
const pBefore = await grades(P, PT);
const holdPB = await viaGrid('wo346-PB');
await yes();
const pHeld = await grades(P, PT);
await sleep(1100);
const commitPB = await viaGrid('wo346-PB');
await yes();
const pLive = await grades(P, PT);
const pHold = kept(holdPB, pBefore, pHeld);
const pCommit = kept(commitPB, pHeld, pLive);
check('WO-3.46: in a POINTS class, holding a column from the grid moves exactly the grades its confirm named '
  + '— Papa, 130/170 to 90/120, never Quebec (excused) or Romeo (no cell) — and committing it moves the '
  + 'same one back, as named',
  holdPB.open && pHold.ok && JSON.stringify(pHold.named) === JSON.stringify([PP])
    && Math.abs(pBefore[PP] - 130 / 170 * 100) < 1e-9 && Math.abs(pHeld[PP] - 90 / 120 * 100) < 1e-9
    && commitPB.open && pCommit.ok && JSON.stringify(pCommit.named) === JSON.stringify([PP])
    && JSON.stringify(pLive) === JSON.stringify(pBefore),
  'hold: ' + JSON.stringify(Object.assign({}, pHold, { lines: holdPB.lines }))
    + ' · commit: ' + JSON.stringify(Object.assign({}, pCommit, { lines: commitPB.lines })));

/* ── Acceptance 4: the editor ── */
await toGrid(W);
const gridAsk = await viaGrid('wo346-E2');
await no();
await clickVisible('[data-class-screen="assignments"]');
await sleep(300);
await clickSel('#assignmentsView [data-assignment-new]');
await sleep(250);
const fresh = await evalJs(`(function(){
  var t = document.querySelector('#assignmentModal [data-assignment-hold]');
  var id = t ? t.getAttribute('data-assignment-hold') : '';
  var a = window.planbook.store.getDoc().assignments.filter(function(x){ return x.id === id; })[0] || null;
  return { id: id, role: t ? t.getAttribute('role') : '', checked: t ? t.getAttribute('aria-checked') : '',
    label: t ? t.textContent : '', hasKey: !!a && Object.prototype.hasOwnProperty.call(a, 'held'),
    held: window.planbook.gradeEngine.isHeld(a),
    editor: !document.getElementById('assignmentModal').classList.contains('hidden') }; })()`);
await clickSel('#assignmentModal [data-assignment-hold]');
await sleep(150);
const freshTicked = await evalJs(`(async function(){
  await window.planbook.store.flush();
  var t = document.querySelector('#assignmentModal [data-assignment-hold]');
  var a = window.planbook.store.getDoc().assignments.filter(function(x){ return x.id === ${JSON.stringify(fresh.id)}; })[0] || null;
  return { checked: t ? t.getAttribute('aria-checked') : '', held: window.planbook.gradeEngine.isHeld(a),
    heldAt: a ? a.heldAt : null,
    confirm: !document.getElementById('holdModal').classList.contains('hidden') }; })()`);
await clickVisible('#assignmentModal [data-assignment-create-cancel]');
await sleep(200);

await clickSel('#assignmentsView [data-assignment-edit="wo346-E2"]');
await sleep(250);
const editBefore = await snap();
await clickSel('#assignmentModal [data-assignment-hold]');
await sleep(150);
const editAsk = await confirmShown('wo346-E2');
await no();
const editDeclined = await snap();
const editState = await evalJs(`(function(){
  var t = document.querySelector('#assignmentModal [data-assignment-hold]');
  return { checked: t ? t.getAttribute('aria-checked') : '',
    editor: !document.getElementById('assignmentModal').classList.contains('hidden'),
    focused: document.activeElement === t }; })()`);
await clickSel('#assignmentModal [data-assignment-hold]');
await sleep(150);
await yes();
const editHeld = await evalJs(`(async function(){
  await window.planbook.store.flush();
  var t = document.querySelector('#assignmentModal [data-assignment-hold]');
  var a = window.planbook.store.getDoc().assignments.filter(function(x){ return x.id === 'wo346-E2'; })[0];
  return { checked: t ? t.getAttribute('aria-checked') : '', held: window.planbook.gradeEngine.isHeld(a),
    editor: !document.getElementById('assignmentModal').classList.contains('hidden') }; })()`);
await sleep(1100);
await clickSel('#assignmentModal [data-assignment-hold]');
await sleep(150);
await yes();
const editLive = await evalJs(`(async function(){
  await window.planbook.store.flush();
  var t = document.querySelector('#assignmentModal [data-assignment-hold]');
  var a = window.planbook.store.getDoc().assignments.filter(function(x){ return x.id === 'wo346-E2'; })[0];
  return { checked: t ? t.getAttribute('aria-checked') : '', held: window.planbook.gradeEngine.isHeld(a) }; })()`);
await clickVisible('#assignmentModal [data-modal-close]');
await sleep(200);

const sameAsk = editAsk.open && editAsk.title === gridAsk.title && editAsk.label === gridAsk.label
  && editAsk.button === gridAsk.button && JSON.stringify(editAsk.lines) === JSON.stringify(gridAsk.lines)
  && gridAsk.lines.length === 2;
check('WO-3.46: a new assignment is live and its editor shows "Hold out of the grade" as an unticked '
  + 'checkbox; on an existing column, ticking it opens the same confirm as the grid\'s control — same '
  + 'title, same names, same figures — and declining leaves the document byte-identical with the box '
  + 'still unticked; confirming ticks it, and unticking commits through the same confirm',
  fresh.editor && !!fresh.id && fresh.role === 'checkbox' && fresh.checked === 'false' && !fresh.hasKey
    && !fresh.held && /Hold out of the grade/.test(fresh.label)
    && freshTicked.held && freshTicked.checked === 'true' && STAMP.test(freshTicked.heldAt || '')
    && !freshTicked.confirm
    && sameAsk && editDeclined.json === editBefore.json && editDeclined.rev === editBefore.rev
    && editState.checked === 'false' && editState.editor
    && editHeld.held && editHeld.checked === 'true' && editHeld.editor
    && !editLive.held && editLive.checked === 'false',
  JSON.stringify({ fresh: fresh, freshTicked: freshTicked, grid: { title: gridAsk.title, lines: gridAsk.lines },
    editor: { title: editAsk.title, lines: editAsk.lines }, declinedIdentical: editDeclined.json === editBefore.json,
    afterDecline: editState, afterHold: editHeld, afterCommit: editLive }));

/* THE FIXTURE COMES BACK OUT, both classes and everything filed under them, and the class that was open
   is put back. One update rather than the Delete controls, for the reason the teardown above gives. */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  if (document.getElementById('holdModal') && !document.getElementById('holdModal').classList.contains('hidden')) {
    window.planbook.closeModal('holdModal'); }
  if (!document.getElementById('assignmentModal').classList.contains('hidden')) {
    window.planbook.closeModal('assignmentModal'); }
  s.update(function(doc){
    var gone = ['${W}', '${P}'];
    var ids = doc.assignments.filter(function(a){ return gone.indexOf(a.classId) >= 0; })
      .map(function(a){ return a.id; });
    doc.classes = doc.classes.filter(function(x){ return gone.indexOf(x.id) < 0; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('s_wo346') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return gone.indexOf(a.classId) < 0; });
    ids.forEach(function(id){ if (doc.scores) delete doc.scores[id]; });
  });
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
await clickVisible('[data-view-home]');
await sleep(200);
}
