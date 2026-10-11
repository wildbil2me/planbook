/* assignment-list-tidy.mjs — the assignment list's top matches the other class screens, and its rows
 * get lighter (WO-3.54)
 *
 * WHAT THIS SECTION OWNS. The owner's eight rulings of 2026-10-10, as the list draws them: ← All
 * classes last in the title row and + New assignment last in the body's first row, right-aligned; the
 * name a real button carrying `data-assignment-edit`, and no Edit button anywhere; Duplicate and
 * Delete as icon buttons that keep their hooks, name the assignment out loud, and clear 44px square
 * under a coarse pointer; an empty category's notice folded into its own `.empty` heading, in all
 * three of its cases word for word, with the old bar's sentence kept as hidden text; "Not in a
 * category" the same move, `.unfiled`, `.counted` only in a points class, and no word "Edit" in it;
 * and the hint's three sentences.
 *
 * WHAT IT LEAVES TO SECTIONS THAT ALREADY OWN IT. The editor, the copy dialog and the delete confirm
 * are assignments.mjs's and copy-class.mjs's — this section opens the editor once, through the name,
 * to prove the door goes where the button went, and asks nothing about what is inside. The weighted
 * and points sentences' consequences for a grade are points-grade.mjs's (WO-3.34, WO-3.36), and the
 * re-filed work after a category removal is category-removal.mjs's; both read the new headings now.
 * The focus ring the name button keeps is focus-ring.mjs's: it walks every rule in every sheet and
 * fails on any that suppresses an outline, which is the fence the Traps line asks for.
 *
 * IT PRINTS, AND DOES NOT ASSERT, the page's sideways scroll at 390×844 under a coarse pointer over
 * this fixture — WO-3.59's baseline. WO-3.59 fixed it and asserts it in horizontal-overflow.mjs, over
 * a class of its own; this line stays a reading, so the two fixtures can still be compared.
 *
 * THE FIXTURE IS TWO CLASSES, ONE STUDENT AND SEVEN ASSIGNMENTS OF ITS OWN — a weighted class with
 * work in two categories, an empty one at a real weight, an empty one at 0% and one unfiled piece; a
 * points class with work in one category, an empty one and two unfiled pieces — plus the open-class
 * preference. All of it is put back at the foot, with the viewport and touch, whatever happens above.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- the assignment list, tidied (WO-3.54) ---');

if (!seam) {
  skip('the assignment list\'s top row, its lighter rows and its folded headings (WO-3.54)',
    'window.planbook is not on the page, so nothing here can seed a class or open the list');
  return;
}

const j = (x) => JSON.stringify(x);
const pause = (ms) => new Promise(r => setTimeout(r, ms));
const S = { id: 'wo354-s1', first: 'Wren', last: 'Abernathy-Coe' };
const CW = { id: 'c_wo354w', name: 'WO-3.54 English III', term: 'tm_wo354w' };
const CP = { id: 'c_wo354p', name: 'WO-3.54 AP Literature', term: 'tm_wo354p' };
const W_CATS = [
  { id: 'k354_e', name: 'Essays', weight: 35 }, { id: 'k354_q', name: 'Reading quizzes', weight: 45 },
  { id: 'k354_p', name: 'Projects', weight: 20 }, { id: 'k354_z', name: 'Participation', weight: 0 }];
const P_CATS = [{ id: 'k354_t', name: 'Tests', weight: 60 }, { id: 'k354_x', name: 'Projects', weight: 40 }];
const A = (id, classId, termId, categoryId, name, points) =>
  ({ id, classId, termId, categoryId, name, points, assigned: '', due: '' });
const ASSIGNMENTS = [
  A('a354_1', CW.id, CW.term, 'k354_e', 'Personal Narrative', 100),
  A('a354_2', CW.id, CW.term, 'k354_e', 'Gatsby Ch 1–3 Response', 50),
  A('a354_3', CW.id, CW.term, 'k354_q', 'Gatsby Quiz 1', 20),
  A('a354_4', CW.id, CW.term, 'k354_gone', 'Annotated Bibliography', 25),
  A('a354_5', CP.id, CP.term, 'k354_t', 'Poetry test', 50),
  A('a354_6', CP.id, CP.term, '', 'Sonnet imitation', 20),
  A('a354_7', CP.id, CP.term, 'k354_gone', 'Close reading', 30),
];
const MINE = ASSIGNMENTS.map((a) => a.id);

const shut = () => evalJs(`(function(){
  var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
  Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
  return open.length; })()`);
const onView = () => evalJs(
  "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
const reload = async () => {
  await send('Page.reload');
  await pause(600);
  await waitForBoot();
  await evalJs(KILL_ANIM);
};
/* The way a teacher gets there: home, the class's card, the switcher's Assignments. */
const toList = async (classId) => {
  await shut();
  if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
  await pause(150);
  await clickSel('#homeGrid [data-class-tab="' + classId + '"]');
  await pause(250);
  if ((await onView()) !== 'assignmentsView') {
    await clickVisible('[data-class-screen="assignments"]');
    await pause(300);
  }
};
const size = async (width, height, coarse) => {
  await send('Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: coarse ? 2 : 1, mobile: !!coarse });
  await send('Emulation.setTouchEmulationEnabled', coarse
    ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await evalJs('window.dispatchEvent(new Event("resize")); 1');
  await pause(300);
};

/* Everything this section reads off the list, in one round trip: the two rows at the top, every
   tbody row classified, and the hint. */
const READ = `(function(){
  var v = document.getElementById('assignmentsView');
  var norm = function(t){ return String(t || '').replace(/\\s+/g, ' ').trim(); };
  var titleRow = v.querySelector('.panel-title-row');
  var tLast = titleRow ? titleRow.lastElementChild : null;
  var bodyEl = v.querySelector('.assign-body');
  var first = bodyEl ? bodyEl.firstElementChild : null;
  var controls = first ? first.querySelectorAll('button, a, input, select') : [];
  var newBtn = first ? first.querySelector('[data-assignment-new]') : null;
  var fr = first ? first.getBoundingClientRect() : null, fs = first ? getComputedStyle(first) : null;
  var nr = newBtn ? newBtn.getBoundingClientRect() : null;
  var scoresHome = document.querySelector('#scoresView .panel-title-row > [data-view-home]');
  var rows = Array.prototype.map.call(document.querySelectorAll('#assignmentsBody tr'), function(r){
    if (r.classList.contains('assign-group-head')) {
      var t = r.querySelector('.assign-group-title'), n = r.querySelector('.assign-group-note'),
        s = r.querySelector('.sr-only');
      return { kind: 'head', cls: r.className, title: t && t.firstChild ? norm(t.firstChild.textContent) : '',
        note: n ? norm(n.textContent) : '', said: s ? norm(s.textContent) : null, tip: r.getAttribute('title') || '',
        text: norm(r.textContent) };
    }
    var name = r.querySelector('td.assign-name');
    if (!name) return { kind: 'other', cls: r.className, text: norm(r.textContent) };
    var nb = name.querySelector('.assign-name-btn');
    var btns = Array.prototype.map.call(r.querySelectorAll('button'), function(b){
      return { text: norm(b.textContent), cls: b.className, label: b.getAttribute('aria-label') || '',
        tip: b.getAttribute('title') || '', svg: !!b.querySelector('svg'),
        edit: b.getAttribute('data-assignment-edit'), dup: b.getAttribute('data-assignment-duplicate'),
        del: b.getAttribute('data-assignment-delete'), popup: b.getAttribute('aria-haspopup') }; });
    return { kind: 'row', nameBtn: nb ? { text: norm(nb.textContent), tag: nb.tagName, type: nb.type,
        edit: nb.getAttribute('data-assignment-edit'), popup: nb.getAttribute('aria-haspopup') } : null,
      buttons: btns };
  });
  return {
    view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
    titleLast: tLast ? { tag: tLast.tagName, home: tLast.hasAttribute('data-view-home'), text: norm(tLast.textContent),
      html: norm(tLast.outerHTML) } : null,
    scoresHomeHtml: scoresHome ? norm(scoresHome.outerHTML) : '',
    newInTitle: titleRow ? titleRow.querySelectorAll('[data-assignment-new]').length : -1,
    firstRow: first ? { cls: first.className, controls: controls.length,
      lastIsNew: controls.length > 0 && controls[controls.length - 1] === newBtn,
      justify: fs.justifyContent,
      gapRight: nr ? Math.round((fr.right - parseFloat(fs.paddingRight)) - nr.right) : null } : null,
    rows: rows,
    oldBars: document.querySelectorAll('.assign-group-empty, .assign-group-orphan').length,
    hint: Array.prototype.map.call(v.querySelectorAll('.assign-hint'), function(p){ return norm(p.textContent); }).join(' ')
  };
})()`;

const before = await evalJs("({ open: localStorage.getItem('planbook_openClassId') })");

try {
  await size(1280, 800, false);
  const plant = await evalJs(`(async function(){
    var p = window.planbook, s = p.store;
    if (!s.getDoc()) return { ok:false, why:'no year document is open' };
    var st = p.roster.newStudent(${j(S.first)}, ${j(S.last)}); st.id = ${j(S.id)};
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      doc.students.push(st);
      doc.classes.push({ id:${j(CW.id)}, name:${j(CW.name)}, archived:false, roster:[${j(S.id)}], letterScale:null,
        terms:[{ id:${j(CW.term)}, label:'Quarter 1', start:'', end:'' }], categories:${j(W_CATS)} });
      doc.classes.push({ id:${j(CP.id)}, name:${j(CP.name)}, archived:false, roster:[${j(S.id)}], letterScale:null,
        gradingMode:'points', terms:[{ id:${j(CP.term)}, label:'Quarter 1', start:'', end:'' }], categories:${j(P_CATS)} });
      ${j(ASSIGNMENTS)}.forEach(function(a){ doc.assignments.push(a); });
    });
    await s.flush();
    return { ok:true }; })()`);
  if (!plant.ok) throw new Error('could not plant the fixture: ' + plant.why);
  await reload();

  /* ══ the weighted class ══ */
  await toList(CW.id);
  const w = await evalJs(READ);
  const wRows = w.rows.filter((r) => r.kind === 'row');
  const wHeads = w.rows.filter((r) => r.kind === 'head');

  /* ══ Acceptance 1 — the two doors ══ */
  check('WO-3.54: on the assignment list the title row\'s last control is ← All classes (`data-view-home`), '
    + 'in the markup the Scores title row carries, and + New assignment is not in the title row',
    w.view === 'assignmentsView' && !!w.titleLast && w.titleLast.tag === 'BUTTON' && w.titleLast.home
      && w.titleLast.text === '← All classes' && w.titleLast.html === w.scoresHomeHtml && w.newInTitle === 0,
    j({ view: w.view, titleLast: w.titleLast && w.titleLast.text, sameAsScores: !!w.titleLast
      && w.titleLast.html === w.scoresHomeHtml, newInTitle: w.newInTitle }));
  check('WO-3.54: + New assignment is the last control of the body\'s first row, which wears `.assign-actions.end` '
    + 'and right-aligns it — its right edge on the row\'s content edge',
    !!w.firstRow && w.firstRow.cls === 'assign-actions end' && w.firstRow.lastIsNew
      && w.firstRow.justify === 'flex-end' && w.firstRow.gapRight !== null && Math.abs(w.firstRow.gapRight) <= 1,
    j(w.firstRow));

  /* ══ Acceptance 2 — the name is the door, and there is no Edit ══ */
  const editButtons = wRows.flatMap((r) => r.buttons.filter((b) => b.text === 'Edit' || /^Edit\b/.test(b.label)));
  const wantNames = ASSIGNMENTS.filter((a) => a.classId === CW.id);
  const nameOk = wRows.length === wantNames.length && wRows.every((r) => !!r.nameBtn && r.nameBtn.tag === 'BUTTON'
    && r.nameBtn.type === 'button' && r.nameBtn.popup === 'dialog'
    && wantNames.some((a) => a.id === r.nameBtn.edit && a.name === r.nameBtn.text)
    && r.buttons.filter((b) => b.edit !== null).length === 1);
  check('WO-3.54: no row carries an Edit button — none reads "Edit" and none is labelled "Edit …" — and every '
    + 'row\'s name is a real button carrying `data-assignment-edit` for its own assignment, the only one in the row',
    editButtons.length === 0 && nameOk,
    wRows.length + ' rows · Edit buttons ' + editButtons.length + ' · names '
      + j(wRows.map((r) => r.nameBtn && (r.nameBtn.text + ' → ' + r.nameBtn.edit))));
  /* A real press at the name's own coordinates, not the element's click(): the claim is that the
     button a finger lands on is the door. */
  await clickSel('#assignmentsView .assign-name-btn[data-assignment-edit="a354_2"]');
  await pause(250);
  const opened = await evalJs(`(function(){ var m = document.getElementById('assignmentModal');
    var f = m && m.querySelector('[data-assignment-field="name"]');
    return { open: !!m && !m.classList.contains('hidden'), name: f ? f.value : null,
      id: f ? f.getAttribute('data-assignment-id') : null }; })()`);
  check('WO-3.54: tapping an assignment\'s name opens the editor on that assignment',
    opened.open && opened.id === 'a354_2' && opened.name === 'Gatsby Ch 1–3 Response', j(opened));
  await shut();
  await pause(150);

  /* ══ Acceptance 3 — two icons, hooks unchanged ══ */
  const iconsOk = wRows.every((r) => {
    const id = r.nameBtn && r.nameBtn.edit, name = r.nameBtn && r.nameBtn.text;
    const dup = r.buttons.filter((b) => b.dup !== null), del = r.buttons.filter((b) => b.del !== null);
    return dup.length === 1 && del.length === 1 && dup[0].dup === id && del[0].del === id
      && /\bassign-icon-btn\b/.test(dup[0].cls) && /\bassign-icon-btn\b/.test(del[0].cls)
      && /\bclass-action-btn\b/.test(dup[0].cls) && /\bassign-row-btn\b/.test(dup[0].cls)
      && /\bdelete\b/.test(del[0].cls)
      && dup[0].svg && del[0].svg && dup[0].text === '' && del[0].text === ''
      && dup[0].label === 'Duplicate ' + name + ' into other classes' && del[0].label === 'Delete ' + name
      && !!dup[0].tip && !!del[0].tip;
  });
  check('WO-3.54: each row\'s Duplicate and Delete are icon buttons — an SVG and no words — whose `aria-label` '
    + 'names the assignment, each with a `title`, carrying `data-assignment-duplicate` and `data-assignment-delete` '
    + 'for their own row, and Delete still `.delete`',
    wRows.length === wantNames.length && iconsOk,
    j(wRows.slice(0, 1).map((r) => r.buttons.filter((b) => b.dup !== null || b.del !== null)
      .map((b) => ({ label: b.label, tip: b.tip, cls: b.cls, svg: b.svg, text: b.text })))));

  /* Under a thumb. An iPad upright, coarse — asserted before anything is measured. */
  await size(834, 1194, true);
  const thumb = await evalJs(`(function(){
    var m = function(e){ var r = e.getBoundingClientRect(); return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; };
    return { coarse: matchMedia('(pointer: coarse)').matches,
      icons: Array.prototype.map.call(document.querySelectorAll('#assignmentsBody .assign-icon-btn'), m),
      names: Array.prototype.map.call(document.querySelectorAll('#assignmentsBody .assign-name-btn'), m) }; })()`);
  const small = thumb.icons.filter((b) => b.w < 44 || b.h < 44);
  check('WO-3.54: under a coarse pointer every Duplicate and Delete icon is at least 44px square, and every '
    + 'name button at least 44px tall',
    thumb.coarse && thumb.icons.length === 2 * wantNames.length && small.length === 0
      && thumb.names.length === wantNames.length && thumb.names.every((b) => b.h >= 44),
    'coarse ' + thumb.coarse + ' · icons ' + j(thumb.icons.map((b) => b.w + '×' + b.h)
      .filter((x, i, a) => a.indexOf(x) === i)) + ' · names ' + j(thumb.names.map((b) => b.h)
      .filter((x, i, a) => a.indexOf(x) === i)) + (small.length ? ' · UNDER 44: ' + j(small) : ''));

  /* WO-3.59's baseline: the page's sideways scroll at 390×844 under a coarse pointer, over this list. */
  await size(390, 844, true);
  const phone = await evalJs(`(function(){ var d = document.documentElement,
    t = document.querySelector('#assignmentsView .assign-table-wrap');
    return { coarse: matchMedia('(pointer: coarse)').matches, vw: d.clientWidth,
      page: d.scrollWidth - d.clientWidth, wrap: t ? t.scrollWidth - t.clientWidth : null }; })()`);
  console.log('  MEASURE | WO-3.54 at 390×844 (coarse ' + phone.coarse + ', vw ' + phone.vw + ') the assignments '
    + 'screen over this fixture scrolls sideways by ' + phone.page + 'px (its table box by ' + phone.wrap
    + 'px) — asserted in horizontal-overflow.mjs since WO-3.59, reported here');
  await size(1280, 800, false);

  /* ══ Acceptance 4 — an empty category is one heading ══ */
  const after = (rows, head) => { const i = rows.indexOf(head); return i < 0 ? undefined : rows[i + 1]; };
  const headFor = (heads, name) => heads.filter((r) => r.title === name.toUpperCase() || r.title === name);
  const wProjects = headFor(wHeads, 'Projects'), wPart = headFor(wHeads, 'Participation');
  const W_PROJECTS = 'Nothing is filed under “Projects” yet, so its 20% redistributes across the categories '
    + 'that do have work rather than counting as a zero. Nothing is wrong; this category is simply not part '
    + 'of the grade until something is in it.';
  const W_PART = 'Nothing is filed under “Participation” yet, and its weight is 0% — so it counts for nothing '
    + 'either way until you put work in it and give it a weight.';
  const emptyOk = (heads, rows, note, said) => heads.length === 1 && heads[0].cls === 'assign-group-head empty'
    && heads[0].note === note && heads[0].said === said && heads[0].tip === said
    && (after(rows, heads[0]) === undefined || after(rows, heads[0]).kind === 'head');
  check('WO-3.54: in a weighted class an empty category at a real weight draws one `.empty` heading reading '
    + '"Nothing in it yet · its 20% is shared across the others", its full sentence in hidden text, and the '
    + 'next row is the next heading',
    emptyOk(wProjects, w.rows, 'Nothing in it yet · its 20% is shared across the others', W_PROJECTS),
    j(wProjects));
  check('WO-3.54: and an empty category at 0% draws one `.empty` heading reading "Nothing in it yet · 0%, '
    + 'counts for nothing", its own sentence in hidden text, and nothing after it before the next heading',
    emptyOk(wPart, w.rows, 'Nothing in it yet · 0%, counts for nothing', W_PART), j(wPart));

  /* ══ Acceptance 5 — "Not in a category", weighted ══ */
  const wLoose = wHeads.filter((r) => /unfiled/.test(r.cls));
  const W_LOOSE = '1 assignment below is not filed under any category ' + CW.name + ' has, so nothing counts '
    + 'it at all. Tap its name and choose a category.';
  check('WO-3.54: in a weighted class "Not in a category" draws one `.unfiled` heading, not `.counted`, reading '
    + '"1 assignment · counted toward nothing — tap its name to file it", its sentence hidden inside it, no '
    + 'notice row after it, and no "Edit" anywhere in it',
    wLoose.length === 1 && wLoose[0].cls === 'assign-group-head unfiled'
      && wLoose[0].note === '1 assignment · counted toward nothing — tap its name to file it'
      && wLoose[0].said === W_LOOSE && !/\bEdit\b/.test(wLoose[0].text + ' ' + wLoose[0].tip)
      && !!after(w.rows, wLoose[0]) && after(w.rows, wLoose[0]).kind === 'row',
    j(wLoose));
  check('WO-3.54: no `.assign-group-empty` or `.assign-group-orphan` element exists, and every row in the list '
    + 'is a heading or an assignment — no notice row is left',
    w.oldBars === 0 && w.rows.every((r) => r.kind === 'head' || r.kind === 'row') && wHeads.length === 5,
    w.oldBars + ' old bar(s) · ' + w.rows.length + ' rows: ' + j(w.rows.map((r) => r.kind)));

  /* ══ Acceptance 6 — the hint ══ */
  const W_HINT = ['Tap an assignment’s name to edit it.', 'Duplicate — the two squares on its row —',
    'A category with nothing in it yet does not count as a zero — its weight is shared across the others '
      + 'until something is in it.'];
  check('WO-3.54: the hint carries ruling 7\'s three sentences — tap a name to edit, Duplicate is the two squares '
    + 'on its row, and an empty category is not a zero',
    W_HINT.every((s) => w.hint.indexOf(s) >= 0),
    j(W_HINT.map((s) => w.hint.indexOf(s) >= 0)));

  /* ══ the points class ══ */
  await toList(CP.id);
  const p = await evalJs(READ);
  const pHeads = p.rows.filter((r) => r.kind === 'head');
  const pProjects = headFor(pHeads, 'Projects');
  const P_PROJECTS = 'Nothing is filed under “Projects” yet. This class is graded on total points, so an empty '
    + 'category adds nothing to either side of the grade until something is in it.';
  check('WO-3.54: in a class graded on total points an empty category draws one `.empty` heading reading '
    + '"Nothing in it yet · adds nothing until something is in it", its points sentence in hidden text, and the '
    + 'next row is the next heading',
    emptyOk(pProjects, p.rows, 'Nothing in it yet · adds nothing until something is in it', P_PROJECTS),
    j(pProjects));
  const pLoose = pHeads.filter((r) => /unfiled/.test(r.cls));
  const P_LOOSE = '2 assignments below are not filed under any category ' + CP.name + ' has, so the grade counts '
    + 'them under “no category” — ' + CP.name + ' is graded on total points, and every point counts. Tap each '
    + 'one’s name and choose a category to file it where it belongs.';
  check('WO-3.54: in a points class "Not in a category" draws one `.unfiled.counted` heading reading "2 '
    + 'assignments · counted, but in no category — tap its name to file it", no notice row, and no "Edit"',
    pLoose.length === 1 && pLoose[0].cls === 'assign-group-head unfiled counted'
      && pLoose[0].note === '2 assignments · counted, but in no category — tap its name to file it'
      && pLoose[0].said === P_LOOSE && !/\bEdit\b/.test(pLoose[0].text + ' ' + pLoose[0].tip)
      && p.oldBars === 0 && p.rows.every((r) => r.kind === 'head' || r.kind === 'row'),
    j(pLoose));
  /* The hint's third sentence names a weight, and WO-3.34 ruled that a points class's screen names
     none — so there it keeps its first half and takes ruling 5's points clause for its second. */
  check('WO-3.54: in a points class the hint still says an empty category is not a zero, and says it without '
    + 'a weight — "it adds nothing until something is in it" — while keeping the other two sentences',
    p.hint.indexOf('A category with nothing in it yet does not count as a zero — it adds nothing until '
      + 'something is in it.') >= 0 && !/weight/i.test(p.hint)
      && p.hint.indexOf(W_HINT[0]) >= 0 && p.hint.indexOf(W_HINT[1]) >= 0,
    j({ weightWord: (p.hint.match(/[^.]*weight[^.]*/i) || [''])[0] }));
} finally {
  await shut();
  await size(1280, 800, false);
  await evalJs(`(async function(){
    var s = window.planbook.store;
    if (s.getDoc()) {
      var mine = ${j(MINE)};
      s.update(function(doc){
        doc.classes = (doc.classes || []).filter(function(c){ return c.id !== ${j(CW.id)} && c.id !== ${j(CP.id)}; });
        doc.students = (doc.students || []).filter(function(x){ return x.id !== ${j(S.id)}; });
        doc.assignments = (doc.assignments || []).filter(function(a){ return mine.indexOf(a.id) < 0; });
      });
      await s.flush();
    }
    var b = ${j(before)};
    if (b.open === null) { try { localStorage.removeItem('planbook_openClassId'); } catch (e) {} }
    else localStorage.setItem('planbook_openClassId', b.open);
    return 1; })()`);
  await reload();
}
}
