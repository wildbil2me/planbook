/* uncategorized-to-grade.mjs — "N to grade" and the queue take in work filed under no category (WO-3.76)
 *
 * THE DEFECT. The card's *N to grade* (src/home.js ungradedCount()) and the glance page's *Waiting to
 * be graded* (src/glance.js queueRows()) asked openWork(), which walks categories only — so a blank
 * in work filed under no category was on the Record dialog's empty-boxes line (WO-3.73, through the
 * engine's uncategorizedWork()) and on neither the card nor the queue. One cell, two screens, two
 * answers. Both now take the engine's third array beside openWork() and heldWork().
 *
 * THE FIXTURE, two classes of one shape, one per grading mode, so every claim is made in both:
 *
 *   W  WO-3.76 Weighted   weighted, one category (Essays, 100%)
 *   P  WO-3.76 Points     graded on total points, one category (Essays)
 *
 *   each has   *-e   Essays, 100 points    — S1 80, S2 blank       one blank
 *              *-u   no category (''), 100 — S1 blank, S2 blank    two blanks
 *   P also has  p-h  no category, 100, HELD — both blank          a held uncategorized column
 *
 * HAND-WORKED:
 *   card       W 2 to grade (e, u) · P 2 to grade (e, u; the held column is in no reader's array)
 *   queue      per class, e first (Essays, 1 blank) then u (no category, 2 blanks); no row for p-h
 *   dialog     emptyBoxes() W 3, P 3 — the sum of the queue's blanks for the class, named Essays
 *              then *no category*; heldColumns() P names p-h, which is the dialog's held line
 *   projection S1 in P: classGrade 80/100 = 80%; projected at 100% on what is left (180/200) = 90%,
 *              at 0% (80/200) = 40% — the loose pile counted ONCE; twice would read 93.33% and
 *              26.67%. S1 in W: 80% either way — uncategorized work carries no weight.
 *   commit     p-h with `held` deleted: P's card 3 to grade, its queue row live (no `column`),
 *              emptyBoxes 5, heldColumns empty.
 *
 * It plants both classes through the store, walks to the class grid and back so the home page is
 * repainted by the chain a teacher triggers, and takes everything back out at its foot with the
 * selection where it found it. No reload, no viewport change, no presentation-mode change.
 */

export async function run(h) {
const { check, evalJs, clickSel } = h;

console.log('\n--- "N to grade" and the queue take in uncategorized work (WO-3.76) ---');
const W = 'c_wo376w', P = 'c_wo376p', TW = 'tm_wo376w', TP = 'tm_wo376p';
const KW = 'k_wo376w', KP = 'k_wo376p', S1 = 's_wo376a', S2 = 's_wo376b';
const WNAME = 'WO-3.76 Weighted', PNAME = 'WO-3.76 Points';
const MINE = ['wo376-we', 'wo376-wu', 'wo376-pe', 'wo376-pu', 'wo376-ph'];

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  if (!s.getDoc()) return { ok: false, why: 'no year document is open' };
  var was = c.getSelectedClassId();
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id: '${S1}', first: 'Wo376First', last: 'Scored' },
      { id: '${S2}', first: 'Wo376Second', last: 'Blank' });
    doc.classes.push({ id: '${W}', name: '${WNAME}', archived: false, letterScale: null,
      roster: ['${S1}', '${S2}'], terms: [{ id: '${TW}', label: 'WO-3.76 Term' }],
      categories: [{ id: '${KW}', name: 'Essays', weight: 100 }] });
    doc.classes.push({ id: '${P}', name: '${PNAME}', archived: false, letterScale: null,
      gradingMode: 'points', roster: ['${S1}', '${S2}'],
      terms: [{ id: '${TP}', label: 'WO-3.76 Term' }],
      categories: [{ id: '${KP}', name: 'Essays', weight: 100 }] });
    var a = function(id, cid, tid, cat, name, held){
      var o = { id: id, classId: cid, termId: tid, categoryId: cat, name: name, points: 100,
        assigned: '', due: '' };
      if (held) o.held = true;
      doc.assignments.push(o); };
    a('wo376-we', '${W}', '${TW}', '${KW}', 'Wo376 essay W');
    a('wo376-wu', '${W}', '${TW}', '', 'Wo376 loose W');
    a('wo376-pe', '${P}', '${TP}', '${KP}', 'Wo376 essay P');
    a('wo376-pu', '${P}', '${TP}', '', 'Wo376 loose P');
    a('wo376-ph', '${P}', '${TP}', '', 'Wo376 held loose P', true);
    doc.scores['wo376-we'] = { '${S1}': { v: 80 } };
    doc.scores['wo376-pe'] = { '${S1}': { v: 80 } };
  });
  await s.flush();
  return { ok: true, was: was, terms: [c.getOpenTermId('${W}'), c.getOpenTermId('${P}')] }; })()`);

/* The home page repainted the way a teacher gets it: a class opened, then the All-classes door. */
async function rehome() {
  await evalJs(`(function(){ window.planbook.classes.selectClass('${W}'); return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
  await clickSel('#classTabBar [data-view-home]');
  await new Promise(r => setTimeout(r, 250));
}

/* Every reading, once: the two cards, the queue reader and its panel, the dialog's two readers and
   S1's projections, all off the document as it stands. */
const READ = `(function(){
  var d = window.planbook.store.getDoc(), g = window.planbook.glance, T = window.planbook.termRecord;
  var G = window.planbook.gradeEngine;
  var cls = function(id){ return d.classes.filter(function(x){ return x.id === id; })[0]; };
  var card = function(id){
    var b = document.querySelector('#homeGrid .class-card-open[data-class-tab="' + id + '"]');
    var chips = b ? b.querySelectorAll('.class-card-signals .class-card-count') : [];
    var said = '';
    Array.prototype.forEach.call(chips, function(n){
      if (/ to grade$/.test(n.textContent || '')) said = n.textContent; });
    return { found: !!b, said: said }; };
  var rows = g.queueRows();
  var mine = function(id){ return rows.filter(function(r){ return r.classId === id; })
    .map(function(r){ return { id: r.assignmentId, cat: r.categoryId, open: r.open,
      column: r.column || '' }; }); };
  var panel = document.querySelector('#homeView [data-glance-panel="queue"]');
  var drawn = function(id){ return panel ? Array.prototype.filter.call(
      panel.querySelectorAll('.gl-list > *'), function(b){
        return b.getAttribute('data-scores-class') === id; })
    .map(function(b){ return { id: b.getAttribute('data-scores-open'),
      why: (b.querySelector('.gl-row-why') || {}).textContent || '',
      meta: (b.querySelector('.gl-row-meta') || {}).textContent || '' }; }) : null; };
  var boxes = function(id, tid){ var r = T.emptyBoxes(d, cls(id), tid);
    return { count: r.count, cats: r.categories.map(function(k){ return k.name; }) }; };
  var proj = function(id, tid, plan){
    var r = plan ? G.projectedClassGrade(d, cls(id), tid, '${S1}', plan) : G.classGrade(d, cls(id), tid, '${S1}');
    return r.percentage === null ? null : Math.round(r.percentage * 100) / 100; };
  var figures = function(id, tid){ return [proj(id, tid, null), proj(id, tid, { outstanding: 1 }),
    proj(id, tid, { outstanding: 0 })]; };
  return {
    view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
    card: { w: card('${W}'), p: card('${P}') },
    queue: { w: mine('${W}'), p: mine('${P}') },
    drawn: { w: drawn('${W}'), p: drawn('${P}') },
    boxes: { w: boxes('${W}', '${TW}'), p: boxes('${P}', '${TP}') },
    held: T.heldColumns(d, cls('${P}'), '${TP}').map(function(x){ return x.id; }),
    figures: { w: figures('${W}', '${TW}'), p: figures('${P}', '${TP}') } }; })()`;

if (!plant || !plant.ok || plant.terms[0] !== TW || plant.terms[1] !== TP) {
  check('WO-3.76: the fixture is real — a weighted and a points class, each with one empty '
    + 'uncategorized assignment, open on the term planted', false, JSON.stringify(plant));
} else {
  /* S1's projections read straight off the document BEFORE the home page is drawn, so "no figure
     moves" is a comparison as well as a hand-worked number. */
  const beforeHome = await evalJs(READ);
  await rehome();
  const seen = await evalJs(READ);
  const blanks = (rows) => rows.reduce((n, r) => n + r.open, 0);
  const n = (said) => Number((/^(\d+) to grade$/.exec(said) || [])[1]);

  /* ── acceptance line 1 ── */
  const QW = JSON.stringify([{ id: 'wo376-we', cat: KW, open: 1, column: '' },
    { id: 'wo376-wu', cat: null, open: 2, column: '' }]);
  const QP = JSON.stringify([{ id: 'wo376-pe', cat: KP, open: 1, column: '' },
    { id: 'wo376-pu', cat: null, open: 2, column: '' }]);
  check('WO-3.76: a class with one empty uncategorized assignment shows it in the card\'s *N to grade* '
    + 'and in the queue, in a weighted class and in a points class — each card says 2 to grade (the '
    + 'Essays blank and the uncategorized one), each class has two queue rows, the uncategorized one '
    + 'after the class\'s own category with the engine\'s null category and two blanks — and the card\'s '
    + 'figure equals the queue\'s row count for that class',
    seen.view === 'homeView' && seen.card.w.said === '2 to grade' && seen.card.p.said === '2 to grade'
      && JSON.stringify(seen.queue.w) === QW && JSON.stringify(seen.queue.p) === QP
      && n(seen.card.w.said) === seen.queue.w.length && n(seen.card.p.said) === seen.queue.p.length,
    JSON.stringify({ view: seen.view, card: seen.card, queue: seen.queue }));

  /* ── deliverable 2: the queue panel names the pile in the quarter dialog's words ── */
  check('WO-3.76: the *Waiting to be graded* panel draws the uncategorized row after the class\'s own '
    + 'category and names it *no category* — the Record dialog\'s word, the engine\'s LOOSE_NAME — '
    + 'in both modes, with its blanks counted',
    JSON.stringify(seen.drawn.w) === JSON.stringify([
      { id: 'wo376-we', why: WNAME + ' · Essays', meta: '1 blank' },
      { id: 'wo376-wu', why: WNAME + ' · no category', meta: '2 blanks' }])
      && JSON.stringify(seen.drawn.p) === JSON.stringify([
        { id: 'wo376-pe', why: PNAME + ' · Essays', meta: '1 blank' },
        { id: 'wo376-pu', why: PNAME + ' · no category', meta: '2 blanks' }]),
    JSON.stringify(seen.drawn));

  /* ── acceptance line 2 ── */
  check('WO-3.76: the quarter dialog\'s empty-boxes count, the card and the queue agree on the same '
    + 'fixture — emptyBoxes() counts 3 in each class, which is the sum of that class\'s queue blanks '
    + '(1 + 2), the card\'s 2 is the queue\'s two rows, and the dialog names Essays then *no category*, '
    + 'the order the queue draws them in',
    seen.boxes.w.count === 3 && seen.boxes.p.count === 3
      && blanks(seen.queue.w) === seen.boxes.w.count && blanks(seen.queue.p) === seen.boxes.p.count
      && n(seen.card.w.said) === seen.queue.w.length && n(seen.card.p.said) === seen.queue.p.length
      && JSON.stringify(seen.boxes.w.cats) === '["Essays","no category"]'
      && JSON.stringify(seen.boxes.p.cats) === '["Essays","no category"]',
    JSON.stringify({ boxes: seen.boxes, queueBlanks: { w: blanks(seen.queue.w), p: blanks(seen.queue.p) },
      card: { w: seen.card.w.said, p: seen.card.p.said } }));

  /* ── acceptance line 3 ── */
  check('WO-3.76: no projection\'s figures move — S1\'s grade and projections at 100% and 0% on what is '
    + 'left read 80 · 90 · 40 in the points class (the loose pile counted once; twice would be 93.33 '
    + 'and 26.67) and 80 · 80 · 80 in the weighted class, the same before and after the home page '
    + 'drew the card and the queue',
    JSON.stringify(seen.figures.p) === '[80,90,40]' && JSON.stringify(seen.figures.w) === '[80,80,80]'
      && JSON.stringify(beforeHome.figures) === JSON.stringify(seen.figures),
    'before ' + JSON.stringify(beforeHome.figures) + ' · after ' + JSON.stringify(seen.figures));

  /* The held column taken off and read again: what it adds when live is what it was kept out of. */
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(doc){ doc.assignments.forEach(function(a){
      if (a.id === 'wo376-ph') { delete a.held; a.committedAt = '2026-11-01T09:00:00-04:00'; } }); });
    await s.flush(); return 1; })()`);
  await rehome();
  const live = await evalJs(READ);
  check('WO-3.76: a held uncategorized column still counts as held, not open — while held it is on the '
    + 'dialog\'s held line (heldColumns) and in no empty-boxes count, card figure or queue row; once '
    + 'committed it is open work everywhere at once: P\'s card 3 to grade, a live queue row with two '
    + 'blanks, emptyBoxes 5, nothing held',
    JSON.stringify(seen.held) === '["wo376-ph"]'
      && seen.queue.p.every(r => r.id !== 'wo376-ph') && seen.card.p.said === '2 to grade'
      && seen.boxes.p.count === 3
      && live.card.p.said === '3 to grade' && live.queue.p.length === 3
      && JSON.stringify(live.queue.p[2]) === JSON.stringify({ id: 'wo376-ph', cat: null, open: 2, column: '' })
      && live.boxes.p.count === 5 && live.held.length === 0
      && blanks(live.queue.p) === live.boxes.p.count && n(live.card.p.said) === live.queue.p.length,
    JSON.stringify({ held: { card: seen.card.p.said, queue: seen.queue.p, boxes: seen.boxes.p, heldLine: seen.held },
      committed: { card: live.card.p.said, queue: live.queue.p, boxes: live.boxes.p, heldLine: live.held } }));
}

const cleaned = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var ours = { '${W}': 1, '${P}': 1 }, mine = ${JSON.stringify(MINE)};
  s.update(function(d){
    d.classes = (d.classes || []).filter(function(x){ return !ours[x.id]; });
    d.students = (d.students || []).filter(function(x){ return x.id !== '${S1}' && x.id !== '${S2}'; });
    d.assignments = (d.assignments || []).filter(function(a){ return mine.indexOf(a.id) === -1; });
    mine.forEach(function(k){ delete (d.scores || {})[k]; });
  });
  await s.flush();
  var was = ${JSON.stringify((plant && plant.was) || '')};
  if (was) c.selectClass(was);
  var d = s.getDoc();
  return { classes: d.classes.filter(function(x){ return ours[x.id]; }).length,
    scores: mine.filter(function(k){ return !!(d.scores || {})[k]; }).length,
    assignments: d.assignments.filter(function(a){ return mine.indexOf(a.id) !== -1; }).length,
    students: d.students.filter(function(x){ return x.id === '${S1}' || x.id === '${S2}'; }).length }; })()`);
/* Back on the class grid, the view ungraded-count.mjs hands this section — selecting the class it
   found put the class view up. */
if (plant && plant.was) {
  await clickSel('#classTabBar [data-view-home]');
  await new Promise(r => setTimeout(r, 200));
}
check('WO-3.76: the fixture came back off the document — both classes, their two students and five '
  + 'assignments, with their score columns',
  cleaned.classes === 0 && cleaned.assignments === 0 && cleaned.students === 0
    && cleaned.scores === 0, JSON.stringify(cleaned));
}
