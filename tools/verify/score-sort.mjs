/* score-sort.mjs — the Scores screen's top matches the other class screens (WO-3.60)
 *
 * The summary and + New assignment share the body's first row; the search row ends in a group holding
 * Sort, ⌨ and 🖨, the two doors as icons that keep their words as their accessible names; the box
 * gives up width so the category pills start beside it; and the flag bar is the last thing above the
 * grid. The sort toggle is a VIEW: it redraws the rows, ↵ and ↓ walk the order drawn, it goes back to
 * Last on a class switch, it writes no `planbook_` key, and it never reaches the printed grade sheet —
 * which src/scores.js's gridOrder() feeds, and which is why the toggle sorts a copy.
 *
 * THE GRADE-SHEET CHECK IS THE ONE A PLANTED FAULT IS RUN AGAINST: plant `sortBy` into gridOrder() and
 * the sheet comes out in first-name order under *Sort: First*, which the check refuses.
 *
 * It plants three classes of its own — five students whose first-name order is not their surname
 * order, five categories with one assignment each, all due in the future so no past-due prompt draws —
 * reloads at its head, for the coarse pointer and at its foot, takes everything back out by id, and
 * hands the page back at 1280x900 with touch off.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, evalJs, clickSel, send, KILL_ANIM, INSTALL_WALKER, waitForBoot, readLocalStore,
  oursIn } = h;

console.log('\n--- the Scores screen\'s top matches the other class screens (WO-3.60) ---');
if (!(await evalJs("!!(window.planbook && window.planbook.scores && window.planbook.store"
  + " && window.planbook.classes && window.planbook.supports)"))) {
  skip('the Scores screen\'s top (WO-3.60)', 'window.planbook is missing scores, store, classes or '
    + 'supports, so no fixture can be planted');
  return;
}

const A = 'c_wo360a', B = 'c_wo360b', C = 'c_wo360c', TERM = 'tm360';
const T_START = nodeDaysFromToday(-30), T_END = nodeDaysFromToday(60), DUE = nodeDaysFromToday(20);
/* Surname order s1..s5; first-name order is Ada, Ben, Lee, Mia, Zoe — s2, s4, s5, s3, s1. */
const STUDENTS = [['wo360-s1', 'Zoe', 'Adams'], ['wo360-s2', 'Ada', 'Brooks'], ['wo360-s3', 'Mia', 'Carter'],
  ['wo360-s4', 'Ben', 'Dalton'], ['wo360-s5', 'Lee', 'Ellis']];
const BY_LAST = ['wo360-s1', 'wo360-s2', 'wo360-s3', 'wo360-s4', 'wo360-s5'];
const BY_FIRST = ['wo360-s2', 'wo360-s4', 'wo360-s5', 'wo360-s3', 'wo360-s1'];
const NAMES_LAST = ['Adams, Zoe', 'Brooks, Ada', 'Carter, Mia', 'Dalton, Ben', 'Ellis, Lee'];
const CATS = ['Exams', 'Essays', 'Mastery', 'Practice', 'Reading'];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const flush = () => evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
async function reboot() {
  await send('Page.reload');
  await sleep(700);
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
}

await flush();
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await reboot();

const plant = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var mode = window.planbook.supports.presentationMode();
  window.planbook.supports.setPresentationMode(false);
  var students = ${JSON.stringify(STUDENTS)}, cats = ${JSON.stringify(CATS)};
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!doc.scores) doc.scores = {};
    students.forEach(function(st){ doc.students.push({ id:st[0], first:st[1], last:st[2] }); });
    var klass = function(id, name, withWork){
      doc.classes.push({ id:id, name:name, archived:false, letterScale:null,
        /* The roster in neither order, so neither sort can be the roster's own order by accident. */
        roster:['wo360-s3','wo360-s5','wo360-s1','wo360-s4','wo360-s2'],
        terms:[{ id:'${TERM}', label:'Q1', start:'${T_START}', end:'${T_END}' }],
        categories: cats.map(function(n, i){ return { id:id + '-k' + i, name:n, weight:20 }; }) });
      if (withWork) cats.forEach(function(n, i){
        doc.assignments.push({ id:'a360-' + id + '-' + i, classId:id, termId:'${TERM}',
          categoryId:id + '-k' + i, name:'WO-3.60 ' + n, points:10, assigned:'${T_START}', due:'${DUE}' });
      });
    };
    klass('${A}', 'WO-3.60 First', true);
    klass('${B}', 'WO-3.60 Second', true);
    klass('${C}', 'WO-3.60 Empty', false);
  });
  c.selectClass('${A}'); c.selectTerm('${TERM}');
  c.refreshClassBar();
  await s.flush();
  return { ok:true, was: was, mode: mode, open: c.getOpenTermId('${A}') };
})()`);

if (!plant.ok || plant.open !== TERM) {
  check('the WO-3.60 fixture is real: three classes of five, open on their term', false, JSON.stringify(plant));
  return;
}

async function openScores(id) {
  await clickSel('#classTabBar [data-class-tab="' + id + '"]');
  await sleep(250);
  await clickSel('#classView [data-class-screen="scores"]');
  await sleep(300);
}
const ROWS = "Array.prototype.map.call(document.querySelectorAll('#scoresBody [data-score-row]'),"
  + " function(r){ return r.getAttribute('data-score-row'); })";
const SORT_TEXT = "(document.getElementById('scoresSort') || {}).textContent";

await openScores(A);
const storeBefore = await readLocalStore(evalJs, 400);

/* ── ACCEPTANCE LINE 1: the summary row, with + New assignment as its last control ── */
const top = await evalJs(`(function(){
  var body = document.querySelector('#scoresView .scores-body');
  var shown = function(e){ return e && getComputedStyle(e).display !== 'none'; };
  var first = null;
  for (var e = body ? body.firstElementChild : null; e; e = e.nextElementSibling) {
    if (shown(e)) { first = e; break; }
  }
  var row = document.getElementById('scoresTop');
  var btn = row ? row.lastElementChild : null;
  var sum = document.getElementById('scoresSummary');
  var rr = row ? row.getBoundingClientRect() : null, br = btn ? btn.getBoundingClientRect() : null;
  var sr = sum ? sum.getBoundingClientRect() : null;
  return { firstId: first ? first.id : null, actions: !!document.getElementById('scoresActions'),
    btnNew: !!btn && btn.hasAttribute('data-assignment-new'), label: btn ? btn.textContent.trim() : '',
    summaryFirst: !!row && row.firstElementChild === sum, summaryText: sum ? sum.textContent.length : 0,
    rightGap: rr && br ? Math.round((rr.right - br.right) * 100) / 100 : null,
    leftGap: rr && sr ? Math.round((sr.left - rr.left) * 100) / 100 : null,
    sameLine: br && sr ? br.top < sr.bottom && sr.top < br.bottom : false }; })()`);
check('WO-3.60: the Scores body\'s first drawn row is #scoresTop — the summary at its left and + New '
  + 'assignment as its last control, flush with its right edge on the same line — and #scoresActions '
  + 'does not exist',
  top.firstId === 'scoresTop' && !top.actions && top.btnNew && top.label === '+ New assignment'
    && top.summaryFirst && top.summaryText > 0 && Math.abs(top.rightGap) <= 1 && Math.abs(top.leftGap) <= 1
    && top.sameLine,
  JSON.stringify(top));

/* ── ACCEPTANCE LINE 2: the group at the search row's end ── */
const tools = await evalJs(`(function(){
  var bar = document.getElementById('scoresToolbar');
  var group = bar ? bar.querySelector('.scores-tools') : null;
  var kids = group ? Array.prototype.slice.call(group.children) : [];
  var hook = function(b){ return ['data-scores-sort','data-modal-open','data-grades-record']
    .filter(function(a){ return b.hasAttribute(a); })[0] || '(none)'; };
  /* Visible words: the button's rendered text with every aria-hidden glyph taken out. */
  var words = function(b){ var c = b.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[aria-hidden="true"]'), function(x){ x.remove(); });
    return c.textContent.replace(/\\s+/g, ''); };
  var keys = group ? group.querySelector('[data-modal-open="scoresKeysModal"]') : null;
  var sheet = group ? group.querySelector('[data-grades-record]') : null;
  return { last: !!bar && bar.lastElementChild === group, order: kids.map(hook),
    keysWords: keys ? words(keys) : null, sheetWords: sheet ? words(sheet) : null,
    keysGlyph: keys ? keys.textContent.trim() : null, sheetGlyph: sheet ? sheet.textContent.trim() : null,
    keysName: keys ? keys.getAttribute('aria-label') : null,
    sheetName: sheet ? sheet.getAttribute('aria-label') : null,
    keysTitle: keys ? keys.title : null, sheetTitle: sheet ? sheet.title : null,
    keysPopup: keys ? keys.getAttribute('aria-haspopup') : null,
    keysExpanded: keys ? keys.getAttribute('aria-expanded') : 'no button' }; })()`);
check('WO-3.60: #scoresToolbar ends in .scores-tools holding, in order, the sort toggle, ⌨ and 🖨 — the '
  + 'two doors drawing their glyph and no word, named "Keys" and "Print or export this class’s grade '
  + 'sheet for this term" as before, each title leading with its word — ⌨ opening its dialog through '
  + '`data-modal-open` with aria-haspopup="dialog" and no aria-expanded since WO-3.61',
  tools.last && JSON.stringify(tools.order) === JSON.stringify(['data-scores-sort', 'data-modal-open',
    'data-grades-record'])
    && tools.keysWords === '' && tools.sheetWords === '' && tools.keysGlyph === '⌨' && tools.sheetGlyph === '🖨'
    && tools.keysName === 'Keys' && tools.sheetName === 'Print or export this class’s grade sheet for this term'
    && /^Keys — /.test(tools.keysTitle || '') && /^Grade sheet — /.test(tools.sheetTitle || '')
    && tools.keysPopup === 'dialog' && tools.keysExpanded === null,
  JSON.stringify(tools));

/* ── ACCEPTANCE LINE 5: the flag bar over the grid, its label and the placeholder ── */
const ABOVE_GRID = `(function(){
  var e = document.getElementById('scoresGridWrap');
  for (e = e ? e.previousElementSibling : null; e; e = e.previousElementSibling) {
    if (getComputedStyle(e).display !== 'none') return e.id || e.className;
  }
  return null; })()`;
const flagsAt = await evalJs(`(function(){
  var label = document.querySelector('#scoresFlags .scores-flags-label');
  var box = document.getElementById('scoresSearch');
  var bar = document.getElementById('scoresToolbar'), flags = document.getElementById('scoresFlags');
  return { above: ${ABOVE_GRID}, label: label ? label.textContent : null,
    placeholder: box ? box.placeholder : null,
    toolbarFirst: !!bar && !!flags && !!(bar.compareDocumentPosition(flags) & 4) }; })()`);
/* ⌨ opens a dialog since WO-3.61, not a strip over the grid, so with it open the flag bar is still the
   last thing above the grid — read with the dialog up, then closed through src/modal.js. */
await clickSel('#scoresView [data-modal-open="scoresKeysModal"]');
await sleep(150);
const aboveKeys = await evalJs(`(function(){ var o = document.getElementById('scoresKeysModal');
  return (o && !o.classList.contains('hidden') ? 'dialog open, ' : 'dialog SHUT, ') + ${ABOVE_GRID}; })()`);
await evalJs("window.planbook.closeModal('scoresKeysModal'); 1");
await sleep(150);
await evalJs(`(function(){ var i = document.querySelector('#scoresBody [data-score-cell]'); i.focus(); return 1; })()`);
await clickSel('#scoresFlags [data-score-note-open]');
await sleep(150);
const aboveNote = await evalJs(ABOVE_GRID);
await clickSel('#scoresNote [data-score-note-done]');
await sleep(150);
const aboveAfter = await evalJs(ABOVE_GRID);
check('WO-3.60: the flag bar is the last thing above the grid — the note panel when that is open, and '
  + 'still the flag bar with ⌨\'s keys dialog open (a dialog since WO-3.61, not a strip) — under the '
  + 'search row; its label reads "The cell you are in" and the search box\'s placeholder "Search students…"',
  flagsAt.above === 'scoresFlags' && aboveKeys === 'dialog open, scoresFlags' && aboveNote === 'scoresNote'
    && aboveAfter === 'scoresFlags' && flagsAt.toolbarFirst && flagsAt.label === 'The cell you are in'
    && flagsAt.placeholder === 'Search students…',
  JSON.stringify({ flagsAt, aboveKeys, aboveNote, aboveAfter }));

/* ── ACCEPTANCE LINE 3: the toggle, the order drawn, and the walk ── */
const sk = async (k, code, vk) => {
  const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: 0 };
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'rawKeyDown' }, ev));
  await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
  await sleep(60);
};
const ACTIVE_STUDENT = "(document.activeElement && document.activeElement.getAttribute('data-score-student')) || null";
/* From the first drawn row of the first column: ↵ once and ↓ once, reading who the caret is on. */
async function walk() {
  await evalJs(`(function(){ var i = document.querySelector('#scoresBody [data-score-cell]');
    i.focus(); return 1; })()`);
  const start = await evalJs(ACTIVE_STUDENT);
  await sk('Enter', 'Enter', 13);
  const afterEnter = await evalJs(ACTIVE_STUDENT);
  await sk('ArrowDown', 'ArrowDown', 40);
  const afterDown = await evalJs(ACTIVE_STUDENT);
  return [start, afterEnter, afterDown];
}
const readSheet = async () => {
  await clickSel('#scoresView [data-grades-record]');
  await sleep(300);
  const names = await evalJs(`(function(){
    var m = document.getElementById('gradesRecordModal');
    if (!m || m.classList.contains('hidden')) return null;
    var sl = m.querySelector('.grades-report-slice');
    return sl ? Array.prototype.map.call(sl.querySelectorAll('tbody tr .grades-report-row-head'),
      function(e){ return e.textContent.trim(); }) : []; })()`);
  await clickSel('#gradesRecordModal [data-modal-close]');
  await sleep(200);
  return names;
};

const atRest = { label: await evalJs(SORT_TEXT), rows: await evalJs(ROWS),
  hook: await evalJs("document.getElementById('scoresSort').getAttribute('data-scores-sort')") };
const walkLast = await walk();
const sheetLast = await readSheet();
await clickSel('#scoresSort');
await sleep(200);
const flipped = { label: await evalJs(SORT_TEXT), rows: await evalJs(ROWS),
  hook: await evalJs("document.getElementById('scoresSort').getAttribute('data-scores-sort')"),
  focus: await evalJs("document.activeElement && document.activeElement.id") };
const walkFirst = await walk();
const sheetFirst = await readSheet();
check('WO-3.60: the sort toggle reads "Sort: Last" over a grid in surname order, and one tap redraws the '
  + 'rows in first-name order and reads "Sort: First" — its hook naming the order the next tap changes to',
  atRest.label === 'Sort: Last' && JSON.stringify(atRest.rows) === JSON.stringify(BY_LAST)
    && atRest.hook === 'first' && flipped.label === 'Sort: First'
    && JSON.stringify(flipped.rows) === JSON.stringify(BY_FIRST) && flipped.hook === 'last',
  JSON.stringify({ atRest, flipped }));
check('WO-3.60: ↵ and ↓ walk the students in the order drawn under either sort — from the first row, '
  + 'Adams → Brooks → Carter under Last and Brooks → Dalton → Ellis under First',
  JSON.stringify(walkLast) === JSON.stringify(BY_LAST.slice(0, 3))
    && JSON.stringify(walkFirst) === JSON.stringify(BY_FIRST.slice(0, 3)),
  JSON.stringify({ walkLast, walkFirst }));
/* THE CHECK A PLANTED FAULT IS RUN AGAINST (WO-3.60's third Acceptance line): plant the toggle's order
   into src/scores.js's gridOrder() and the sheet under *Sort: First* lists Brooks first. */
check('WO-3.60: the grade sheet prints in surname order under either sort — Adams, Brooks, Carter, '
  + 'Dalton, Ellis with the toggle on Last and again with it on First',
  JSON.stringify(sheetLast) === JSON.stringify(NAMES_LAST)
    && JSON.stringify(sheetFirst) === JSON.stringify(NAMES_LAST),
  JSON.stringify({ sheetLast, sheetFirst }));

/* A class switch while the grid is up (WO-3.45 keeps the screen) is an arrival: back to Last. And
   the empty class still hides every element the empty state hid — the top row with its button, the
   search row and the flag bar. Then back to the first class, which is an arrival too. */
await clickSel('#classTabBar [data-class-tab="' + B + '"]');
await sleep(300);
const switched = { screen: await evalJs("!document.getElementById('scoresView').classList.contains('hidden')"),
  label: await evalJs(SORT_TEXT), rows: await evalJs(ROWS) };
await clickSel('#scoresSort');
await sleep(200);
await clickSel('#classTabBar [data-class-tab="' + C + '"]');
await sleep(300);
const empty = await evalJs(`(function(){
  var gone = function(id){ var e = document.getElementById(id); return !!e && e.classList.contains('hidden'); };
  return { screen: !document.getElementById('scoresView').classList.contains('hidden'),
    top: gone('scoresTop'), toolbar: gone('scoresToolbar'), flags: gone('scoresFlags'),
    grid: gone('scoresGridWrap'), emptyShown: !gone('scoresEmpty') }; })()`);
await clickSel('#classTabBar [data-class-tab="' + A + '"]');
await sleep(300);
const back = { label: await evalJs(SORT_TEXT), rows: await evalJs(ROWS) };
const storeAfter = await readLocalStore(evalJs, 400);
const ours = (st) => JSON.stringify(oursIn(st).sort().map((k) => [k, st[k]]));
check('WO-3.60: the sort is back to "Sort: Last" after a class switch, both ways — and the toggle wrote '
  + 'no planbook_ key: a view, never a preference',
  switched.screen && switched.label === 'Sort: Last' && JSON.stringify(switched.rows) === JSON.stringify(BY_LAST)
    && back.label === 'Sort: Last' && JSON.stringify(back.rows) === JSON.stringify(BY_LAST)
    && ours(storeBefore) === ours(storeAfter),
  JSON.stringify({ switched, back }) + '; planbook_ keys '
    + (ours(storeBefore) === ours(storeAfter) ? 'unchanged' : 'CHANGED: ' + ours(storeAfter)));
check('WO-3.60: a class with nothing to grade still hides everything the empty state hid — the top row '
  + 'with + New assignment, the search row with its tools, the flag bar and the grid — and says why',
  empty.screen && empty.top && empty.toolbar && empty.flags && empty.grid && empty.emptyShown,
  JSON.stringify(empty));

/* ── ACCEPTANCE LINE 4: the search row's wrap, under a coarse pointer ── */
const ROW_GEOM = `(function(){
  var bar = document.getElementById('scoresToolbar');
  var box = bar ? bar.querySelector('.scores-find') : null;
  if (!bar || !box) return null;
  var kids = Array.prototype.filter.call(bar.children, function(e){ return getComputedStyle(e).display !== 'none'; });
  var pills = Array.prototype.slice.call(bar.querySelectorAll('[data-scores-category]'));
  var leaves = pills.concat(Array.prototype.slice.call(bar.querySelectorAll('.scores-tools > *')), [box]);
  var rs = leaves.map(function(e){ return e.getBoundingClientRect(); });
  var br = box.getBoundingClientRect();
  var top = Math.max.apply(null, rs.map(function(r){ return r.top; }));
  var bottom = Math.min.apply(null, rs.map(function(r){ return r.bottom; }));
  var r44 = function(sel){ var e = bar.querySelector(sel); if (!e) return null;
    var r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
  return { coarse: matchMedia('(pointer: coarse)').matches, width: innerWidth, kids: kids.length,
    pills: pills.length, boxW: Math.round(br.width * 100) / 100,
    oneLine: top < bottom,
    pillsOnBoxLine: pills.filter(function(p){ var r = p.getBoundingClientRect();
      return r.top < br.bottom && br.top < r.bottom; }).length,
    sort: r44('[data-scores-sort]'), keys: r44('[data-modal-open="scoresKeysModal"]'), sheet: r44('[data-grades-record]') }; })()`;
await send('Emulation.setDeviceMetricsOverride', { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await reboot();
await openScores(A);
const wide = await evalJs(ROW_GEOM);
await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
await sleep(400);
const upright = await evalJs(ROW_GEOM);
check('WO-3.60: at 1180px under a coarse pointer the search row is one line — the box, all six pills, '
  + 'Sort, ⌨ and 🖨 share it',
  !!wide && wide.coarse === true && wide.width === 1180 && wide.pills === 6 && wide.oneLine,
  JSON.stringify(wide));
check('WO-3.60: at 820px under a coarse pointer the search box is narrower than 360px and at least one '
  + 'category pill sits on the box\'s line',
  !!upright && upright.coarse === true && upright.width === 820 && upright.pills === 6
    && upright.boxW < 360 && upright.boxW >= 200 && upright.pillsOnBoxLine >= 1,
  JSON.stringify(upright));
const t44 = (m) => !!m && m.w >= 44 && m.h >= 44;
check('WO-3.60: under the coarse pointer Sort, ⌨ and 🖨 each measure at least 44px both ways, at 1180px '
  + 'and at 820px',
  !!wide && !!upright && wide.coarse === true && [wide, upright].every((g) => t44(g.sort) && t44(g.keys) && t44(g.sheet)),
  JSON.stringify({ wide: wide && [wide.sort, wide.keys, wide.sheet], upright: upright && [upright.sort,
    upright.keys, upright.sheet] }));

/* ── THE FIXTURE COMES BACK OUT, by id, and the page is handed back ── */
await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return String(x.id).indexOf('c_wo360') !== 0; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo360-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return String(a.classId).indexOf('c_wo360') !== 0; });
    Object.keys(doc.scores || {}).forEach(function(k){ if (String(k).indexOf('a360-') === 0) delete doc.scores[k]; });
  });
  window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return 1; })()`);
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await reboot();
}
