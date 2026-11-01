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
 *   card       W 2 to grade (e, u) · P 3 to grade (e, u, and p-h as HELD work — WO-3.80; until then
 *              the held column was in no reader's array and P read 2)
 *   queue      per class, e first (Essays, 1 blank) then u (no category, 2 blanks); P then p-h, held
 *              (no category · held, 2 blanks) — heldWork()'s, the third source, since WO-3.80
 *   dialog     emptyBoxes() W 3, P 3 — the sum of the queue's blanks for the class, named Essays
 *              then *no category*; heldColumns() P names p-h, which is the dialog's held line
 *   projection S1 in P: classGrade 80/100 = 80%; projected at 100% on what is left (180/200) = 90%,
 *              at 0% (80/200) = 40% — the loose pile counted ONCE; twice would read 93.33% and
 *              26.67%. S1 in W: 80% either way — uncategorized work carries no weight.
 *   commit     p-h with `held` deleted: P's card still 3 to grade, its queue row now live (no
 *              `column`), emptyBoxes 5, heldColumns empty.
 *
 * THE HELD COLUMN'S CHECKS WERE TURNED AROUND BY WO-3.80, not deleted. This section was written
 * pinning the edge as built — a held uncategorized column open nowhere AND held nowhere, so P's card
 * read 2 and rose to 3 on the commit — and the owner's ruling of 2026-11-01 reversed it: such a
 * column shows on the card and the queue as held work, exactly as a held categorized one does, so
 * the card reads 3 either side of the commit. The live claims (the agreement with the Record
 * dialog, the panel's words, no projection moving) are WO-3.76's and unchanged; the agreement with
 * emptyBoxes() is now over the queue's LIVE rows, because the dialog counts held work on a line of
 * its own (heldColumns()), as it always has for a held categorized column. The fixture WO-3.80
 * itself reads — a blank and an excused cell, both modes, detail and the file — is heldLoose() below.
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
  const liveOf = (rows) => rows.filter((r) => !r.column);
  const n = (said) => Number((/^(\d+) to grade$/.exec(said) || [])[1]);

  /* ── acceptance line 1 ── */
  const QW = JSON.stringify([{ id: 'wo376-we', cat: KW, open: 1, column: '' },
    { id: 'wo376-wu', cat: null, open: 2, column: '' }]);
  const QP = JSON.stringify([{ id: 'wo376-pe', cat: KP, open: 1, column: '' },
    { id: 'wo376-pu', cat: null, open: 2, column: '' },
    { id: 'wo376-ph', cat: null, open: 2, column: 'held' }]);
  check('WO-3.76: a class with one empty uncategorized assignment shows it in the card\'s *N to grade* '
    + 'and in the queue, in a weighted class and in a points class — W\'s card says 2 to grade (the '
    + 'Essays blank and the uncategorized one) over two queue rows, the uncategorized one after the '
    + 'class\'s own category with the engine\'s null category and two blanks; P\'s says 3, its third '
    + 'row the HELD uncategorized column, marked held (WO-3.80) — and the card\'s figure equals the '
    + 'queue\'s row count for that class',
    seen.view === 'homeView' && seen.card.w.said === '2 to grade' && seen.card.p.said === '3 to grade'
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
        { id: 'wo376-pu', why: PNAME + ' · no category', meta: '2 blanks' },
        { id: 'wo376-ph', why: PNAME + ' · no category · held', meta: '2 blanks' }]),
    JSON.stringify(seen.drawn));

  /* ── acceptance line 2 ── */
  check('WO-3.76: the quarter dialog\'s empty-boxes count, the card and the queue agree on the same '
    + 'fixture — emptyBoxes() counts 3 in each class, which is the sum of that class\'s LIVE queue '
    + 'blanks (1 + 2; the dialog counts held work on its held line, WO-3.80), the card\'s figure is the '
    + 'queue\'s row count, and the dialog names Essays then *no category*, the order the queue draws '
    + 'them in',
    seen.boxes.w.count === 3 && seen.boxes.p.count === 3
      && blanks(liveOf(seen.queue.w)) === seen.boxes.w.count
      && blanks(liveOf(seen.queue.p)) === seen.boxes.p.count
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
    + 'dialog\'s held line (heldColumns) and in no empty-boxes count, and on the card and the queue as '
    + 'HELD work (WO-3.80, turned around from WO-3.76\'s as-built "in no card figure or queue row"); '
    + 'once committed it is open work everywhere at once: P\'s card still 3 to grade, its queue row '
    + 'live with two blanks, emptyBoxes 5, nothing held',
    JSON.stringify(seen.held) === '["wo376-ph"]'
      && JSON.stringify(seen.queue.p.filter(r => r.id === 'wo376-ph'))
        === JSON.stringify([{ id: 'wo376-ph', cat: null, open: 2, column: 'held' }])
      && seen.card.p.said === '3 to grade'
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

await heldLoose(h);
await missingLoose(h);
}

/* ═══════════════ WO-3.80 — a held column filed under no category is listed ═══════════════
 *
 * THE DEFECT. heldWork() and heldExcusedWork() walked categories only, as openWork() does, and
 * uncategorizedWork() leaves held columns out — so a held uncategorized column was in NO reader: off
 * the card, the queue, student detail's held card and the student CSV. Counting toward nothing is not
 * the same as hidden (WO-3.47). The engine widened both held readers to the pile; the four screens
 * changed nothing but student detail's naming and order.
 *
 * THE FIXTURE, two classes of one shape, one per grading mode, three students — A (Wo380Ada),
 * B (Wo380Ben) and, since WO-3.81, C (Wo380Cal) — every column planted LIVE, then two held through
 * the app's own holdColumn(), then both committed through commitColumn(). Document order:
 *
 *   *-e  Essays       100   A 80 · B blank · C 70                  live throughout
 *   *-c  Essays       100   A blank · B excused · C blank          HELD — the categorized control
 *   *-h  no category  100   A excused (62 kept) · B blank · C blank HELD — the column this is about
 *   *-u  no category  100   A blank · B 50 · C 60                  live throughout
 *
 * C IS WO-3.81'S, folded in on the owner's word (2026-11-01) from two gaps WO-3.80's verifier named:
 * a student with a categorized AND an uncategorized held BLANK, so the held card's order is asserted
 * on two rows that come out of ONE engine reader (A and B each get theirs from two), and the queue
 * compared in the order it is drawn rather than after a sort. C is read on detail and in the queue
 * and nowhere else; the figures and the engine readers are A's and B's, as before.
 *
 * HAND-WORKED.
 *   card       4 to grade in each class in all three states (e for B, c for A and C, h for B and C,
 *              u for A): a hold moves a column from the live readers to the held ones and the card's
 *              Set holds it either way. With h's half of heldWork() dropped, held reads 3.
 *   queue      IN DRAW ORDER — queueRows() takes openWork(), then uncategorizedWork(), then heldWork(),
 *              each over the roster A, B, C, and a row is placed where its assignment first appears.
 *              live: c (A, C — 2 blanks), e (B), u (A), h (B, C — 2).
 *              held: e, u live; then c (2) and h (2) marked `held`, h with the engine's null category
 *              and drawn *no category · held*.  committed: as live.
 *   C's card   c (Essays, not graded yet) above h (no category, not graded yet), *· 2 pieces*.
 *   held card  A: c (Essays, not graded yet), h (no category, excused, 62 kept).
 *              B: c (Essays, excused), h (no category, not graded yet) — B's two engine readers hand
 *              h first (heldWork) and c second (heldExcusedWork); detail moves the pile to the foot.
 *              Each hero says *· 2 held*. The CSV's held rows say the same, Category *no category*.
 *   listed once  while held, nothing of c or h is in openWork(), uncategorizedWork() or excusedWork().
 *   figures    S's classGrade() and projections at 100% and 0% on what is left, while held:
 *              P  A 80 · 90 · 40     B 50 · 75 · 25     (h counted would be B 83.33 / 16.67)
 *              W  A 80 · 80 · 80     B null · 100 · 0
 *              and equal to the same readings on a clone with c and h deleted outright — a held
 *              column counts toward nothing. Live and committed: P A 80 · 93.33 · 26.67, B 50 · 83.33 ·
 *              16.67; W A 80 · 90 · 40, B null · 100 · 0 — identical, because neither writer touches a cell.
 *   commit     each held row reappears in the live reader of its kind with the same id and state —
 *              c's in openWork() (A) and excusedWork() (B), h's in uncategorizedWork() (B) and
 *              excusedWork() (A) — the categorized column and the loose one moving alike.
 *
 * It takes both classes, both students, eight assignments and their score columns back out at its
 * foot, closes the detail student, and puts the selected class back. No reload, no viewport change,
 * no presentation-mode change.
 */
async function heldLoose(h) {
const { check, skip, evalJs, clickSel } = h;

console.log('\n--- a held column filed under no category is listed (WO-3.80) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.classes"
  + " && window.planbook.gradeEngine && window.planbook.glance && window.planbook.detail"
  + " && window.planbook.heldColumn)"))) {
  skip('a held column filed under no category is listed (WO-3.80)', 'window.planbook is missing one '
    + 'of store, classes, gradeEngine, glance, detail or heldColumn, so nothing can be planted or read');
  return;
}

const W = 'c_wo380w', P = 'c_wo380p', TW = 'tm_wo380w', TP = 'tm_wo380p';
const KW = 'k_wo380w', KP = 'k_wo380p', A = 's_wo380a', B = 's_wo380b', C = 's_wo380c';
const WNAME = 'WO-3.80 Weighted', PNAME = 'WO-3.80 Points';
const IDS = { w: { e: 'wo380-we', c: 'wo380-wc', h: 'wo380-wh', u: 'wo380-wu' },
  p: { e: 'wo380-pe', c: 'wo380-pc', h: 'wo380-ph', u: 'wo380-pu' } };
const MINE = Object.keys(IDS.w).map((k) => IDS.w[k]).concat(Object.keys(IDS.p).map((k) => IDS.p[k]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  if (!s.getDoc()) return { ok: false, why: 'no year document is open' };
  var was = c.getSelectedClassId();
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id: '${A}', first: 'Wo380Ada', last: 'Held' },
      { id: '${B}', first: 'Wo380Ben', last: 'Held' }, { id: '${C}', first: 'Wo380Cal', last: 'Held' });
    doc.classes.push({ id: '${W}', name: '${WNAME}', archived: false, letterScale: null,
      roster: ['${A}', '${B}', '${C}'], terms: [{ id: '${TW}', label: 'WO-3.80 Term' }],
      categories: [{ id: '${KW}', name: 'Essays', weight: 100 }] });
    doc.classes.push({ id: '${P}', name: '${PNAME}', archived: false, letterScale: null,
      gradingMode: 'points', roster: ['${A}', '${B}', '${C}'],
      terms: [{ id: '${TP}', label: 'WO-3.80 Term' }],
      categories: [{ id: '${KP}', name: 'Essays', weight: 100 }] });
    [['${W}', '${TW}', '${KW}', ${JSON.stringify(IDS.w)}], ['${P}', '${TP}', '${KP}', ${JSON.stringify(IDS.p)}]]
      .forEach(function(k){
        var a = function(id, cat, name){ doc.assignments.push({ id: id, classId: k[0], termId: k[1],
          categoryId: cat, name: name, points: 100, assigned: '', due: '' }); };
        a(k[3].e, k[2], 'Wo380 essay');
        a(k[3].c, k[2], 'Wo380 held essay');
        a(k[3].h, '', 'Wo380 held loose');
        a(k[3].u, '', 'Wo380 loose');
        doc.scores[k[3].e] = { '${A}': { v: 80 }, '${C}': { v: 70 } };
        doc.scores[k[3].c] = { '${B}': { v: null, flag: 'excused' } };
        doc.scores[k[3].h] = { '${A}': { v: 62, flag: 'excused' } };
        doc.scores[k[3].u] = { '${B}': { v: 50 }, '${C}': { v: 60 } };
      });
  });
  await s.flush();
  return { ok: true, was: was, terms: [c.getOpenTermId('${W}'), c.getOpenTermId('${P}')] }; })()`);

/* The home page repainted the way a teacher gets it: a class opened, then the All-classes door. */
async function rehome() {
  await evalJs(`(function(){ window.planbook.classes.selectClass('${W}'); return 1; })()`);
  await sleep(150);
  await clickSel('#classTabBar [data-view-home]');
  await sleep(250);
}

/* The card, the queue reader and its panel, both classes — the reader's rows and the panel's buttons
   BOTH in the order they come (WO-3.81's fold-in of WO-3.80's verifier note): until then the reader's
   rows were sorted before comparing and the panel's were keyed by id, so an order defect in either
   passed. */
const HOME = `(function(){
  var g = window.planbook.glance;
  var card = function(id){
    var b = document.querySelector('#homeGrid .class-card-open[data-class-tab="' + id + '"]');
    var said = '';
    if (b) Array.prototype.forEach.call(b.querySelectorAll('.class-card-signals .class-card-count'),
      function(n){ if (/ to grade$/.test(n.textContent || '')) said = n.textContent; });
    return said; };
  var rows = g.queueRows();
  var mine = function(id){ return rows.filter(function(r){ return r.classId === id; })
    .map(function(r){ return r.assignmentId + ':' + r.open + ':' + (r.categoryId === null ? 'null' : 'cat')
      + (r.column ? ':' + r.column : ''); }); };
  var panel = document.querySelector('#homeView [data-glance-panel="queue"]');
  var drawn = function(id){ return panel ? Array.prototype.map.call(
      panel.querySelectorAll('.gl-list > [data-scores-class="' + id + '"]'), function(b){
        return b.getAttribute('data-scores-open') + '|'
          + ((b.querySelector('.gl-row-why') || {}).textContent || ''); }) : null; };
  return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
    card: { w: card('${W}'), p: card('${P}') },
    queue: { w: mine('${W}'), p: mine('${P}') },
    drawn: { w: drawn('${W}'), p: drawn('${P}') } }; })()`;

/* Every engine reader for one student, every projection figure, and the same figures on a clone of
   the document with the two held columns deleted outright. */
const ENGINE = (key, clsId, tid, ids) => `(function(){
  var d = window.planbook.store.getDoc(), G = window.planbook.gradeEngine;
  var cls = d.classes.filter(function(x){ return x.id === '${clsId}'; })[0];
  var gone = ${JSON.stringify([ids.c, ids.h])};
  var bare = Object.assign({}, d, { assignments: d.assignments.filter(function(a){
    return gone.indexOf(a.id) === -1; }) });
  var row = function(r){ return r.id + ':' + r.state + (r.categoryId === null ? ':null' : '')
    + (r.kept === null || r.kept === undefined ? '' : ':' + r.kept); };
  var pct = function(g){ return g.percentage === null ? null : g.percentage.toFixed(2); };
  var figs = function(doc, sid){ return [pct(G.classGrade(doc, cls, '${tid}', sid)),
    pct(G.projectedClassGrade(doc, cls, '${tid}', sid, { outstanding: 1 })),
    pct(G.projectedClassGrade(doc, cls, '${tid}', sid, { outstanding: 0 }))]; };
  var one = function(sid){ return {
    open: G.openWork(d, cls, '${tid}', sid).map(row),
    loose: G.uncategorizedWork(d, cls, '${tid}', sid).map(row),
    excused: G.excusedWork(d, cls, '${tid}', sid).map(row),
    held: G.heldWork(d, cls, '${tid}', sid).map(row),
    heldExcused: G.heldExcusedWork(d, cls, '${tid}', sid).map(row),
    figs: figs(d, sid), bare: figs(bare, sid) }; };
  return { a: one('${A}'), b: one('${B}') }; })()`;

/* One student's detail in one class: the hero, the held card's rows, the excused card, the model's
   held rows and the file's Work section. */
const DETAIL = (clsId, sid) => `(function(){
  var p = window.planbook;
  p.classes.selectClass('${clsId}');
  p.detail.openDetail('${sid}');
  p.detail.renderDetail();
  var v = document.getElementById('detailContent');
  var card = v ? v.querySelector('[data-detail-held]') : null;
  var excused = v ? v.querySelector('[data-detail-excused]') : null;
  var m = p.detail.detailModel();
  var csv = m ? p.detail.studentCsv(m).text : '';
  var at = csv.indexOf('Work,Category,Points,State\\r\\n');
  return {
    sub: v ? ((v.querySelector('.detail-hero-sub') || {}).textContent || '') : '',
    title: card ? ((card.querySelector('.detail-card-title') || {}).textContent || '') : '',
    rows: card ? Array.prototype.map.call(card.querySelectorAll('.detail-missing-row'), function(r){
      return [(r.querySelector('.detail-missing-name') || {}).textContent || '',
        (r.querySelector('.detail-missing-when') || {}).textContent || '',
        (r.querySelector('.detail-held-state') || {}).textContent || '',
        (r.querySelector('.detail-held-mark') || {}).textContent || ''].join('|'); }) : null,
    excused: excused ? excused.textContent : '',
    onHold: m ? m.onHold.map(function(w){ return w.name + '|' + w.category + '|' + w.state; }) : null,
    work: at < 0 ? '' : csv.slice(at, csv.indexOf('\\r\\n\\r\\n', at) + 2) }; })()`;

const read = async () => {
  await rehome();
  const home = await evalJs(HOME);
  const eng = { w: await evalJs(ENGINE('w', W, TW, IDS.w)), p: await evalJs(ENGINE('p', P, TP, IDS.p)) };
  const det = { wa: await evalJs(DETAIL(W, A)), wb: await evalJs(DETAIL(W, B)),
    pa: await evalJs(DETAIL(P, A)), pb: await evalJs(DETAIL(P, B)),
    wc: await evalJs(DETAIL(W, C)), pc: await evalJs(DETAIL(P, C)) };
  return { home, eng, det };
};

if (!plant || !plant.ok || plant.terms[0] !== TW || plant.terms[1] !== TP) {
  check('WO-3.80: the fixture is real — a weighted and a points class, each with a categorized and an '
    + 'uncategorized column to hold, open on the term planted', false, JSON.stringify(plant));
} else {
  const live = await read();
  const holding = await evalJs(`(async function(){ var hc = window.planbook.heldColumn;
    var wrote = [${JSON.stringify(IDS.w.c)}, ${JSON.stringify(IDS.w.h)}, ${JSON.stringify(IDS.p.c)},
      ${JSON.stringify(IDS.p.h)}].map(function(id){ return hc.holdColumn(id); });
    await window.planbook.store.flush(); return wrote; })()`);
  const held = await read();
  const committing = await evalJs(`(async function(){ var hc = window.planbook.heldColumn;
    var wrote = [${JSON.stringify(IDS.w.c)}, ${JSON.stringify(IDS.w.h)}, ${JSON.stringify(IDS.p.c)},
      ${JSON.stringify(IDS.p.h)}].map(function(id){ return hc.commitColumn(id); });
    await window.planbook.store.flush(); return wrote; })()`);
  const done = await read();

  /* ── acceptance line 1: the held card and the file, both modes ── */
  const detailOk = (k) => {
    const a = held.det[k + 'a'], b = held.det[k + 'b'];
    return held.home.view === 'homeView'
      && JSON.stringify(a.rows) === JSON.stringify(['Wo380 held essay|Essays|not graded yet|Held',
        'Wo380 held loose|no category|excused, 62 kept|Held'])
      && JSON.stringify(b.rows) === JSON.stringify(['Wo380 held essay|Essays|excused|Held',
        'Wo380 held loose|no category|not graded yet|Held'])
      && a.title === 'Held out of the grade · 2 pieces' && b.title === 'Held out of the grade · 2 pieces'
      && /· 2 held$/.test(a.sub) && /· 2 held$/.test(b.sub)
      && JSON.stringify(a.onHold) === JSON.stringify(['Wo380 held essay|Essays|open',
        'Wo380 held loose|no category|excused'])
      && JSON.stringify(b.onHold) === JSON.stringify(['Wo380 held essay|Essays|excused',
        'Wo380 held loose|no category|open'])
      && a.work.indexOf('\r\nWo380 held essay,Essays,100,held — not graded yet\r\n'
        + 'Wo380 held loose,no category,100,"held — excused, 62 kept"\r\n') >= 0
      && b.work.indexOf('\r\nWo380 held essay,Essays,100,held — excused\r\n'
        + 'Wo380 held loose,no category,100,held — not graded yet\r\n') >= 0
      && a.excused.indexOf('Wo380 held') < 0 && b.excused.indexOf('Wo380 held') < 0;
  };
  check('WO-3.80: a held column filed under no category, with one blank and one excused cell, is listed '
    + 'on student detail\'s held card and in the student CSV\'s held rows, in a weighted class and in a '
    + 'points class — each student\'s card reads *Held out of the grade · 2 pieces*, the categorized '
    + 'held column first (Essays) and the uncategorized one after it under *no category* (Ben\'s two '
    + 'engine readers hand them the other way round), Ada\'s excused cell as *excused, 62 kept* and '
    + 'Ben\'s blank as *not graded yet*; each hero says *· 2 held*, agreeing with its card; the CSV\'s '
    + 'held rows carry the same two lines with Category *no category*; and neither excused cell is on '
    + 'the excused card as well',
    detailOk('w') && detailOk('p'),
    JSON.stringify({ w: { a: held.det.wa, b: held.det.wb }, p: { a: held.det.pa, b: held.det.pb } }));

  /* Listed once: while held, no live reader answers for a cell of c or h, and the held readers hand
     exactly the hand-worked rows. */
  const onceOk = (k) => {
    const ids = IDS[k], e = held.eng[k];
    const live4 = [].concat(e.a.open, e.a.loose, e.a.excused, e.b.open, e.b.loose, e.b.excused);
    return live4.every((r) => r.indexOf(ids.c + ':') !== 0 && r.indexOf(ids.h + ':') !== 0)
      && JSON.stringify(e.a.held) === JSON.stringify([ids.c + ':open'])
      && JSON.stringify(e.a.heldExcused) === JSON.stringify([ids.h + ':excused:null:62'])
      && JSON.stringify(e.b.held) === JSON.stringify([ids.h + ':open:null'])
      && JSON.stringify(e.b.heldExcused) === JSON.stringify([ids.c + ':excused']);
  };
  check('WO-3.80: a held row and a live row never answer for the same cell — while c and h are held, '
    + 'neither is in openWork(), uncategorizedWork() or excusedWork() for either student in either '
    + 'class, and heldWork() / heldExcusedWork() hand exactly Ada c open + h excused (62 kept, null '
    + 'category) and Ben h open (null category) + c excused',
    onceOk('w') && onceOk('p'), JSON.stringify(held.eng));

  /* C: a categorized and an uncategorized held BLANK, both out of heldWork() — the categorized row
     first (WO-3.81's fold-in of WO-3.80's verifier note). */
  const calOk = (k) => {
    const c = held.det[k + 'c'];
    return JSON.stringify(c.rows) === JSON.stringify(['Wo380 held essay|Essays|not graded yet|Held',
        'Wo380 held loose|no category|not graded yet|Held'])
      && c.title === 'Held out of the grade · 2 pieces' && /· 2 held$/.test(c.sub)
      && JSON.stringify(c.onHold) === JSON.stringify(['Wo380 held essay|Essays|open',
        'Wo380 held loose|no category|open']);
  };
  check('WO-3.80 (WO-3.81 fold-in): a student with BOTH a categorized and an uncategorized held blank — '
    + 'Cal, whose two rows come out of one engine reader — has the categorized column listed first on '
    + 'the held card, *Essays* then *no category*, both *not graded yet*, under *· 2 pieces*, in a '
    + 'weighted class and in a points class',
    calOk('w') && calOk('p'), JSON.stringify({ w: held.det.wc, p: held.det.pc }));

  /* ── acceptance line 2: the card and the queue, IN THE ORDER DRAWN ── */
  const q = (k, state) => {
    const ids = IDS[k];
    return JSON.stringify(state === 'held'
      ? [ids.e + ':1:cat', ids.u + ':1:null', ids.c + ':2:cat:held', ids.h + ':2:null:held']
      : [ids.c + ':2:cat', ids.e + ':1:cat', ids.u + ':1:null', ids.h + ':2:null']);
  };
  const drawnHeld = (k, name) => {
    const ids = IDS[k];
    return JSON.stringify([ids.e + '|' + name + ' · Essays', ids.u + '|' + name + ' · no category',
      ids.c + '|' + name + ' · Essays · held', ids.h + '|' + name + ' · no category · held']);
  };
  check('WO-3.80: the home card and the queue show the held uncategorized column under its held word, as '
    + 'they show the held categorized one — while held, h\'s queue row carries the engine\'s `held` '
    + 'marker and null category and is drawn *no category · held* beside c\'s *Essays · held*, in both '
    + 'modes — and *N to grade* is unchanged by the hold: 4 to grade before it, during it and after the '
    + 'commit, in both classes. Every comparison is IN THE ORDER DRAWN (WO-3.81 fold-in): the reader\'s '
    + 'rows live c · e · u · h, held e · u · c · h with the held pair last, and the panel\'s buttons in '
    + 'the held order with their words',
    [live, held, done].every((s) => s.home.card.w === '4 to grade' && s.home.card.p === '4 to grade')
      && JSON.stringify(live.home.queue.w) === q('w', 'live') && JSON.stringify(live.home.queue.p) === q('p', 'live')
      && JSON.stringify(held.home.queue.w) === q('w', 'held') && JSON.stringify(held.home.queue.p) === q('p', 'held')
      && JSON.stringify(held.home.drawn.w) === drawnHeld('w', WNAME)
      && JSON.stringify(held.home.drawn.p) === drawnHeld('p', PNAME),
    JSON.stringify({ live: live.home, held: held.home, done: done.home }));

  /* ── acceptance line 3: the figures, and the commit ── */
  const F = {
    held: { p: { a: ['80.00', '90.00', '40.00'], b: ['50.00', '75.00', '25.00'] },
      w: { a: ['80.00', '80.00', '80.00'], b: [null, '100.00', '0.00'] } },
    live: { p: { a: ['80.00', '93.33', '26.67'], b: ['50.00', '83.33', '16.67'] },
      w: { a: ['80.00', '90.00', '40.00'], b: [null, '100.00', '0.00'] } } };
  const figsOk = (s, want) => ['w', 'p'].every((k) => ['a', 'b'].every((x) =>
    JSON.stringify(s.eng[k][x].figs) === JSON.stringify(want[k][x])));
  check('WO-3.80: no projection\'s figures move — while held, each student\'s grade and projections at 100% '
    + 'and 0% on what is left are the hand-worked figures with both held columns out (points: Ada 80 · 90 '
    + '· 40, Ben 50 · 75 · 25 — Ben 83.33 / 16.67 had h been projected; weighted: Ada 80 · 80 · 80, Ben '
    + '— · 100 · 0), and equal to the same readings on a copy of the document with the two columns '
    + 'deleted outright; and the figures before the hold and after the commit are the same',
    figsOk(held, F.held) && figsOk(live, F.live) && figsOk(done, F.live)
      && ['w', 'p'].every((k) => ['a', 'b'].every((x) =>
        JSON.stringify(held.eng[k][x].figs) === JSON.stringify(held.eng[k][x].bare))),
    JSON.stringify({ live: { w: [live.eng.w.a.figs, live.eng.w.b.figs], p: [live.eng.p.a.figs, live.eng.p.b.figs] },
      held: { w: [held.eng.w.a.figs, held.eng.w.b.figs, held.eng.w.a.bare, held.eng.w.b.bare],
        p: [held.eng.p.a.figs, held.eng.p.b.figs, held.eng.p.a.bare, held.eng.p.b.bare] },
      done: { w: [done.eng.w.a.figs, done.eng.w.b.figs], p: [done.eng.p.a.figs, done.eng.p.b.figs] } }));

  /* Every held row reappears in the live reader of its kind, same id and state, and the held readers
     are empty; the two columns move alike. */
  const movedOk = (k) => {
    const ids = IDS[k], e = done.eng[k];
    return JSON.stringify(e.a.held.concat(e.a.heldExcused, e.b.held, e.b.heldExcused)) === '[]'
      && e.a.open.indexOf(ids.c + ':open') >= 0
      && e.a.excused.indexOf(ids.h + ':excused:null:62') >= 0
      && e.b.loose.indexOf(ids.h + ':open:null') >= 0
      && e.b.excused.indexOf(ids.c + ':excused') >= 0
      && done.det[k + 'a'].rows === null && done.det[k + 'b'].rows === null
      && !/held/.test(done.det[k + 'a'].sub) && !/held/.test(done.det[k + 'b'].sub);
  };
  check('WO-3.80: committing moves the uncategorized column\'s work back to open exactly as the categorized '
    + 'column\'s — through commitColumn(), every held row reappears in the live reader of its kind with '
    + 'the same id and state (c: openWork() for Ada, excusedWork() for Ben; h: uncategorizedWork() for Ben, '
    + 'excusedWork() for Ada), the held readers are empty, no held card or *· N held* is drawn, the card '
    + 'stays at 4 to grade and the queue\'s rows lose their marker, in both classes',
    holding.every(Boolean) && committing.every(Boolean) && movedOk('w') && movedOk('p')
      && JSON.stringify(done.home.queue.w) === q('w', 'live') && JSON.stringify(done.home.queue.p) === q('p', 'live'),
    JSON.stringify({ holding, committing, eng: done.eng, home: done.home,
      det: { wa: done.det.wa.sub, wb: done.det.wb.sub, pa: done.det.pa.sub, pb: done.det.pb.sub } }));
}

const cleaned = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var ours = { '${W}': 1, '${P}': 1 }, mine = ${JSON.stringify(MINE)};
  s.update(function(d){
    d.classes = (d.classes || []).filter(function(x){ return !ours[x.id]; });
    d.students = (d.students || []).filter(function(x){
      return x.id !== '${A}' && x.id !== '${B}' && x.id !== '${C}'; });
    d.assignments = (d.assignments || []).filter(function(a){ return mine.indexOf(a.id) === -1; });
    mine.forEach(function(k){ delete (d.scores || {})[k]; });
  });
  window.planbook.detail.openDetail('');
  await s.flush();
  var was = ${JSON.stringify((plant && plant.was) || '')};
  if (was) c.selectClass(was);
  var d = s.getDoc();
  return { classes: d.classes.filter(function(x){ return ours[x.id]; }).length,
    scores: mine.filter(function(k){ return !!(d.scores || {})[k]; }).length,
    assignments: d.assignments.filter(function(a){ return mine.indexOf(a.id) !== -1; }).length,
    students: d.students.filter(function(x){ return x.id === '${A}' || x.id === '${B}'
      || x.id === '${C}'; }).length }; })()`);
/* Back on the home page, as WO-3.76's teardown above leaves it — selecting the class it found put the
   class view up. */
if (plant && plant.was) {
  await clickSel('#classTabBar [data-view-home]');
  await sleep(200);
}
check('WO-3.80: the fixture came back off the document — both classes, their three students and eight '
  + 'assignments, with their score columns',
  cleaned.classes === 0 && cleaned.assignments === 0 && cleaned.students === 0
    && cleaned.scores === 0, JSON.stringify(cleaned));
}

/* ═══════════ WO-3.81 — a missing mark on work filed under no category is listed ═══════════
 *
 * THE DEFECT. Four readers of missing work asked openWork(), which walks categories only: student
 * detail's *Missing work* card, the student CSV's Work rows, {{missing.list}} / {{missing.count}}, and
 * the signal engine's missing-count rule. So a `missing` mark on uncategorized work was named nowhere
 * — and in a points class that mark is a zero IN THE GRADE, so the grade dropped and nothing said why.
 * Each now takes the `missing` rows of uncategorizedWork() beside openWork()'s; openWork() is not
 * widened. THE OWNER'S RULING OF 2026-11-01: it counts as missing in both kinds of class, and costs
 * points only where the class charges them — so in the weighted class the card lists it and says it
 * is *not in the grade*, and no sentence says it lowers anything.
 *
 * THE FIXTURE, two classes of one shape, one per grading mode, two students — A (Wo381Ada) and
 * B (Wo381Ben):
 *
 *   *-e1  Essays       100   A 90       · B 90
 *   *-e2  Essays       100   A missing  · B 80
 *   *-u1  no category   50   A missing  · B 40
 *   *-u2  no category   50   A missing  · B blank
 *
 * HAND-WORKED, A.
 *   card     P: *Missing work · 200 points at stake* — e2 (Essays, 100 pts), u1 (no category, 50 pts),
 *               u2 (no category, 50 pts); the note as it always read.
 *            W: *Missing work · 100 points at stake* — e2 (Essays, 100 pts), then u1 and u2 each
 *               *no category · not in the grade*, no points pill; the note gains the sentence saying
 *               work filed under no category carries no weight here and is not in the grade.
 *            hero  *0 pieces outstanding · 3 missing* in both.
 *   CSV      Work rows: e2 marked missing (Essays), then u1, u2 marked missing (no category), both modes.
 *   fields   {{missing.list}} *Wo381 essay two, Wo381 loose one, Wo381 loose two* · {{missing.count}} 3.
 *            With the uncategorized half missing they would read *Wo381 essay two* and 1.
 *   rule     missing-count at the default threshold of 3 FIRES, numbers.missing 3, in both modes —
 *            with openWork() alone the count is 1 and it would not. Its sentence names a count of
 *            assignments marked missing and says nothing of points, a zero or the grade.
 *   openWork A: e2 missing, and nothing of u1 or u2 — not widened.
 *   figures  classGrade and projections at 100% / 0% on what is left:
 *            P  A 90/300 = 30 · 30 · 30 (nothing open)   B 210/250 = 84 · 260/300 86.67 · 210/300 70
 *            W  A 90/200 = 45 · 45 · 45                  B 170/200 = 85 · 85 · 85 (loose carries no weight)
 *            and equal before and after every screen above drew — the readers move no figure.
 *
 * It plants through the store, reads detail through the app's own openDetail()/renderDetail() and the
 * file through detailModel()/studentCsv(), the fields through resolveText() and the rule through
 * evaluate(), and takes everything back out with the detail student closed and the class put back.
 */
async function missingLoose(h) {
const { check, skip, evalJs, clickSel } = h;

console.log('\n--- a missing mark on work filed under no category is listed (WO-3.81) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.store && window.planbook.classes"
  + " && window.planbook.gradeEngine && window.planbook.detail && window.planbook.signals"
  + " && window.planbook.mergeFields)"))) {
  skip('a missing mark on work filed under no category is listed (WO-3.81)', 'window.planbook is '
    + 'missing one of store, classes, gradeEngine, detail, signals or mergeFields, so nothing can be '
    + 'planted or read');
  return;
}

const W = 'c_wo381w', P = 'c_wo381p', TW = 'tm_wo381w', TP = 'tm_wo381p';
const KW = 'k_wo381w', KP = 'k_wo381p', A = 's_wo381a', B = 's_wo381b';
const WNAME = 'WO-3.81 Weighted', PNAME = 'WO-3.81 Points';
const IDS = { w: { e1: 'wo381-we1', e2: 'wo381-we2', u1: 'wo381-wu1', u2: 'wo381-wu2' },
  p: { e1: 'wo381-pe1', e2: 'wo381-pe2', u1: 'wo381-pu1', u2: 'wo381-pu2' } };
const MINE = Object.keys(IDS.w).map((k) => IDS.w[k]).concat(Object.keys(IDS.p).map((k) => IDS.p[k]));

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  if (!s.getDoc()) return { ok: false, why: 'no year document is open' };
  var was = c.getSelectedClassId();
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id: '${A}', first: 'Wo381Ada', last: 'Missing' },
      { id: '${B}', first: 'Wo381Ben', last: 'Missing' });
    doc.classes.push({ id: '${W}', name: '${WNAME}', archived: false, letterScale: null,
      roster: ['${A}', '${B}'], terms: [{ id: '${TW}', label: 'WO-3.81 Term' }],
      categories: [{ id: '${KW}', name: 'Essays', weight: 100 }] });
    doc.classes.push({ id: '${P}', name: '${PNAME}', archived: false, letterScale: null,
      gradingMode: 'points', roster: ['${A}', '${B}'],
      terms: [{ id: '${TP}', label: 'WO-3.81 Term' }],
      categories: [{ id: '${KP}', name: 'Essays', weight: 100 }] });
    [['${W}', '${TW}', '${KW}', ${JSON.stringify(IDS.w)}], ['${P}', '${TP}', '${KP}', ${JSON.stringify(IDS.p)}]]
      .forEach(function(k){
        var a = function(id, cat, name, pts){ doc.assignments.push({ id: id, classId: k[0], termId: k[1],
          categoryId: cat, name: name, points: pts, assigned: '', due: '' }); };
        a(k[3].e1, k[2], 'Wo381 essay one', 100);
        a(k[3].e2, k[2], 'Wo381 essay two', 100);
        a(k[3].u1, '', 'Wo381 loose one', 50);
        a(k[3].u2, '', 'Wo381 loose two', 50);
        doc.scores[k[3].e1] = { '${A}': { v: 90 }, '${B}': { v: 90 } };
        doc.scores[k[3].e2] = { '${A}': { v: null, flag: 'missing' }, '${B}': { v: 80 } };
        doc.scores[k[3].u1] = { '${A}': { v: null, flag: 'missing' }, '${B}': { v: 40 } };
        doc.scores[k[3].u2] = { '${A}': { v: null, flag: 'missing' } };
      });
  });
  await s.flush();
  return { ok: true, was: was, terms: [c.getOpenTermId('${W}'), c.getOpenTermId('${P}')] }; })()`);

/* The engine, the fields and the rule for one class: A's openWork(), both students' figures, the two
   fields for A, the threshold in force and A's concern hits. */
const ENGINE = (clsId, tid) => `(function(){
  var d = window.planbook.store.getDoc(), G = window.planbook.gradeEngine;
  var cls = d.classes.filter(function(x){ return x.id === '${clsId}'; })[0];
  var pct = function(g){ return g.percentage === null ? null : g.percentage.toFixed(2); };
  var figs = function(sid){ return [pct(G.classGrade(d, cls, '${tid}', sid)),
    pct(G.projectedClassGrade(d, cls, '${tid}', sid, { outstanding: 1 })),
    pct(G.projectedClassGrade(d, cls, '${tid}', sid, { outstanding: 0 }))]; };
  var mf = window.planbook.mergeFields, sg = window.planbook.signals;
  var req = { doc: d, classId: '${clsId}', termId: '${tid}', studentId: '${A}' };
  var hits = sg.evaluate(d, cls, '${tid}', { studentIds: ['${A}'] })
    .filter(function(x){ return x.ruleId === 'missing-count'; })
    .map(function(x){ return { missing: x.numbers.missing, need: x.numbers.need, says: x.explanation }; });
  return {
    open: G.openWork(d, cls, '${tid}', '${A}').map(function(r){ return r.id + ':' + r.state; }),
    figs: { a: figs('${A}'), b: figs('${B}') },
    list: mf.resolveText('{{missing.list}}', req).text,
    count: mf.resolveText('{{missing.count}}', req).text,
    threshold: sg.thresholdsOf(d).missingCount,
    hits: hits }; })()`;

/* A's detail in one class: the hero, the missing card's title, rows and note, and the file's Work
   section. */
const DETAIL = (clsId) => `(function(){
  var p = window.planbook;
  p.classes.selectClass('${clsId}');
  p.detail.openDetail('${A}');
  p.detail.renderDetail();
  var v = document.getElementById('detailContent');
  var card = v ? v.querySelector('[data-detail-missing]') : null;
  var m = p.detail.detailModel();
  var csv = m ? p.detail.studentCsv(m).text : '';
  var at = csv.indexOf('Work,Category,Points,State\\r\\n');
  return {
    sub: v ? ((v.querySelector('.detail-hero-sub') || {}).textContent || '') : '',
    title: card ? ((card.querySelector('.detail-card-title') || {}).textContent || '') : '',
    rows: card ? Array.prototype.map.call(card.querySelectorAll('.detail-missing-row'), function(r){
      return Array.prototype.map.call(r.children, function(n){ return n.textContent; }).join('|'); }) : null,
    pills: card ? card.querySelectorAll('.detail-missing-pts').length : -1,
    note: card ? ((card.querySelector('.detail-card-note') || {}).textContent || '') : '',
    work: at < 0 ? '' : csv.slice(at, csv.indexOf('\\r\\n\\r\\n', at) + 2) }; })()`;

if (!plant || !plant.ok || plant.terms[0] !== TW || plant.terms[1] !== TP) {
  check('WO-3.81: the fixture is real — a weighted and a points class, each with a categorized and two '
    + 'uncategorized missing marks for one student, open on the term planted', false, JSON.stringify(plant));
} else {
  const before = { w: await evalJs(ENGINE(W, TW)), p: await evalJs(ENGINE(P, TP)) };
  const det = { w: await evalJs(DETAIL(W)), p: await evalJs(DETAIL(P)) };
  const after = { w: await evalJs(ENGINE(W, TW)), p: await evalJs(ENGINE(P, TP)) };

  const NOTE = 'Work marked missing counts as zero out of its full points, which is already in '
    + 'Wo381Ada Missing’s grade above.';
  const EXCEPTION = ' The exception is work filed under no category: it carries no weight in this '
    + 'class, so its missing mark is listed here and is not in the grade.';
  const WORK = 'Work,Category,Points,State\r\nWo381 essay two,Essays,100,marked missing\r\n'
    + 'Wo381 loose one,no category,50,marked missing\r\nWo381 loose two,no category,50,marked missing\r\n';
  const LIST = 'Wo381 essay two, Wo381 loose one, Wo381 loose two';

  /* ── acceptance line 1: a points class ── */
  const p = det.p;
  check('WO-3.81: in a points class, an uncategorized assignment marked missing is listed on student '
    + 'detail\'s *Missing work* card, in the student CSV and by {{missing.list}}, each under or beside '
    + '*no category* — Ada\'s card reads *Missing work · 200 points at stake* over e2 (Essays, 100 pts) '
    + 'then u1 and u2 (no category, 50 pts each, red pills: in this class the zero is charged), the note '
    + 'as it always read; the hero says *3 missing*; the file\'s Work rows carry u1 and u2 as *no '
    + 'category, marked missing* after e2; and {{missing.list}} names all three, Essays first',
    JSON.stringify(p.rows) === JSON.stringify(['Wo381 essay two|Essays|100 pts',
        'Wo381 loose one|no category|50 pts', 'Wo381 loose two|no category|50 pts'])
      && p.title === 'Missing work · 200 points at stake' && p.pills === 3
      && p.note.slice(-NOTE.length) === NOTE
      && /· 0 pieces outstanding · 3 missing$/.test(p.sub)
      && p.work === WORK && after.p.list === LIST,
    JSON.stringify({ card: p, list: after.p.list }));

  /* ── acceptance line 2: a weighted class ── */
  const w = det.w;
  const silent = (says) => !/grade|point|zero|lower|cost|charge/i.test(says);
  check('WO-3.81: in a weighted class, the same mark is listed on the card, in the CSV and in '
    + '{{missing.list}}, and counts toward the missing rule and {{missing.count}} (the owner\'s ruling of '
    + '2026-11-01), and no sentence claims it lowers the grade — Ada\'s card lists u1 and u2 under *no '
    + 'category* with *not in the grade* and NO points pill, its title counts only e2\'s 100 points at '
    + 'stake, and its note gains the sentence that work filed under no category carries no weight and '
    + 'is not in the grade; the hero says *3 missing*; the file and {{missing.list}} read exactly as in '
    + 'the points class; {{missing.count}} is 3 in both classes; and missing-count fires at the default '
    + 'threshold of 3 with a count of 3 in both (openWork() alone counts 1), its sentence naming '
    + 'assignments marked missing and no grade, points, zero or cost',
    JSON.stringify(w.rows) === JSON.stringify(['Wo381 essay two|Essays|100 pts',
        'Wo381 loose one|no category|not in the grade', 'Wo381 loose two|no category|not in the grade'])
      && w.title === 'Missing work · 100 points at stake' && w.pills === 1
      && w.note.slice(-(NOTE.length + EXCEPTION.length)) === NOTE + EXCEPTION
      && /· 0 pieces outstanding · 3 missing$/.test(w.sub)
      && w.work === WORK && after.w.list === LIST
      && after.w.count === '3' && after.p.count === '3'
      && after.w.threshold === 3 && after.p.threshold === 3
      && ['w', 'p'].every((k) => after[k].hits.length === 1 && after[k].hits[0].missing === 3
        && after[k].hits[0].need === 3 && /has 3 assignments marked missing/.test(after[k].hits[0].says)
        && silent(after[k].hits[0].says.replace(/WO-3\.81 (Weighted|Points)/, ''))),
    JSON.stringify({ card: w, list: after.w.list, count: [after.w.count, after.p.count],
      threshold: [after.w.threshold, after.p.threshold], hits: { w: after.w.hits, p: after.p.hits } }));

  /* ── acceptance line 3: no figure moves, openWork() not widened ── */
  const F = { p: { a: ['30.00', '30.00', '30.00'], b: ['84.00', '86.67', '70.00'] },
    w: { a: ['45.00', '45.00', '45.00'], b: ['85.00', '85.00', '85.00'] } };
  check('WO-3.81: no projection\'s figures move and no grade changes — each student\'s grade and '
    + 'projections at 100% and 0% on what is left are the hand-worked figures (points: Ada 30 · 30 · 30, '
    + 'Ben 84 · 86.67 · 70; weighted: Ada 45 · 45 · 45, Ben 85 · 85 · 85), the same before and after '
    + 'detail, the file, the fields and the rule were read; and openWork() still hands Ada e2 alone — '
    + 'it was not widened',
    ['w', 'p'].every((k) => JSON.stringify(after[k].figs) === JSON.stringify(F[k])
      && JSON.stringify(before[k].figs) === JSON.stringify(after[k].figs)
      && JSON.stringify(after[k].open) === JSON.stringify([IDS[k].e2 + ':missing'])),
    JSON.stringify({ before: { w: before.w.figs, p: before.p.figs },
      after: { w: after.w.figs, p: after.p.figs }, open: { w: after.w.open, p: after.p.open } }));
}

const cleaned = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var ours = { '${W}': 1, '${P}': 1 }, mine = ${JSON.stringify(MINE)};
  s.update(function(d){
    d.classes = (d.classes || []).filter(function(x){ return !ours[x.id]; });
    d.students = (d.students || []).filter(function(x){ return x.id !== '${A}' && x.id !== '${B}'; });
    d.assignments = (d.assignments || []).filter(function(a){ return mine.indexOf(a.id) === -1; });
    mine.forEach(function(k){ delete (d.scores || {})[k]; });
  });
  window.planbook.detail.openDetail('');
  await s.flush();
  var was = ${JSON.stringify((plant && plant.was) || '')};
  if (was) c.selectClass(was);
  var d = s.getDoc();
  return { classes: d.classes.filter(function(x){ return ours[x.id]; }).length,
    scores: mine.filter(function(k){ return !!(d.scores || {})[k]; }).length,
    assignments: d.assignments.filter(function(a){ return mine.indexOf(a.id) !== -1; }).length,
    students: d.students.filter(function(x){ return x.id === '${A}' || x.id === '${B}'; }).length }; })()`);
/* Back on the home page, as the two sections above leave it. */
if (plant && plant.was) {
  await clickSel('#classTabBar [data-view-home]');
  await new Promise((r) => setTimeout(r, 200));
}
check('WO-3.81: the fixture came back off the document — both classes, their two students and eight '
  + 'assignments, with their score columns',
  cleaned.classes === 0 && cleaned.assignments === 0 && cleaned.students === 0
    && cleaned.scores === 0, JSON.stringify(cleaned));
}
