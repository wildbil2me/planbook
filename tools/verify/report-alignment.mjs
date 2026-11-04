/* report-alignment.mjs — every report's numbers sit under their own heads (WO-2.62)
 *
 * WO-2.62's section, written new. Nothing here launches a browser, a server or a document of its
 * own: the entry file owns all three and hands them over on `h`. `tools/README.md` § "Driving a
 * browser over CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, mustBoot, seam } = h;

/*
  ══════════ A HEAD AND ITS COLUMN, READ TOGETHER (WO-2.62) ══════════

  Two ties of specificity pulled heads away from their columns. In src/attendance.css the table-wide
  `text-align: left` (0,1,1) beat `.attendance-report-num { text-align: right }` (0,1,0) on every
  cell, and a `thead th.attendance-report-num` patch repaired the head and nothing under it — heads
  right, numbers left, each count read as the column before it. In src/scores.css the table-wide
  centring beat the student and grade columns' own rules, which the print block then moved for the
  cells and not for their heads, so on paper *Student* and *Grade* sat centred over columns that
  were not.

  WHAT THIS SECTION READS: for every column of every table that wears one of those classes, the
  COMPUTED `text-align` of its head and of every body cell under it — on screen, and with each of
  `data-attendance-print`, `data-grades-print` and `data-detail-print` set on <body> (the element
  src/print-gate.js sets them on) under an emulated print medium. Every table is read under all four,
  not only under the attribute that prints it: computed alignment does not depend on display, so a
  table hidden by another surface's gate is still read, and a rule in any print block that moved a
  cell and not its head would show wherever it lands.

  A CHECK THAT READ ONLY HEADS PASSED BOTH DEFECTS, which is how they got here. And a check that
  read only "head equals cells" would pass the first one's mutation — put the column rule back to a
  bare `.attendance-report-num` and, with the `thead` patch gone, heads and cells both fall to the
  table-wide left and agree. So each column is also compared with what it is FOR: a number column
  reads right, a name or a date reads left, a grade sheet's assignment column is centred.

  AND A STRUCTURAL HALF, FOR THE ONE THING THE COMPUTED READING CANNOT SEE. Since WO-2.62 the screen
  rules win for head and cell alike, so the grade sheet's print rules restate rather than repair —
  and a print rule that named the cells and dropped the head would compute exactly the same today.
  So the stylesheets are read through the CSSOM: every rule that sets `text-align` and names one
  half of a grade-sheet column (`-student-head`/`-row-head`, `-total-head`/`-total`) must name the
  other half in the same rule, and no rule that sets `text-align` on a column class may qualify it
  with `thead`, `tbody`, `tfoot`, `th` or `td` — a head-only patch is the defect's shape. A fence,
  not a reading: a pair split across two rules that happen to agree passes the computed half and
  fails this one, which is the intent; an alignment set by a class this list does not name is
  invisible to it.

  WHAT IT CANNOT SAY: that the iPad draws the numbers under their heads, or that a sheet from a real
  printer does. Both are 👤 in the work order.
*/
console.log('\n--- every report\'s numbers sit under their own heads (WO-2.62) ---');
if (!seam) {
  skip('every report\'s numbers sit under their own heads (WO-2.62)', 'window.planbook is not on '
    + 'the page, so nothing here can seed a class, open its reports, or put the document back');
  return;
}

const CLS = 'c_wo262';
const TERM_A = 'tm_wo262a', TERM_B = 'tm_wo262b';
const LABEL_A = 'WO-2.62 Spring', LABEL_B = 'WO-2.62 Summer';
const S1 = 'wo262-s1', S2 = 'wo262-s2';
const NAME = 'No recorded meetings';

await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await mustBoot();
await evalJs(KILL_ANIM);

/*
  THE FIXTURE. Term A holds three meetings, two hall passes and two graded assignments, so every
  table has numbers in it. Term B holds no meeting and no trip — one ungraded assignment, so the
  Scores screen has rows to open the student page from — so every student on the record's By
  student tab, and term B's row of the student page's term table, has no recorded meetings: the case
  the dash is for. Fixed dates, nothing read off the clock.
*/
const plant = await evalJs(`(function(){
  var s = window.planbook.store, c = window.planbook.classes;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var mode = window.planbook.supports.presentationMode();
  var zone = '-04:00';
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!Array.isArray(doc.attendance)) doc.attendance = [];
    if (!Array.isArray(doc.passes)) doc.passes = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push({ id:'${S1}', first:'Ana', last:'Able' },
      { id:'${S2}', first:'Ben', last:'Brook' });
    doc.classes.push({ id:'${CLS}', name:'WO-2.62 English III', archived:false,
      roster:['${S1}','${S2}'], letterScale:null,
      terms:[{ id:'${TERM_A}', label:'${LABEL_A}', start:'2027-03-01', end:'2027-03-31' },
        { id:'${TERM_B}', label:'${LABEL_B}', start:'2027-04-01', end:'2027-06-25' }],
      categories:[{ id:'cat262', name:'All work', weight:100 }]});
    doc.assignments.push({ id:'a262q', classId:'${CLS}', termId:'${TERM_A}', categoryId:'cat262',
      name:'Quiz', points:10, assigned:'2027-03-02', due:'2027-03-03' });
    doc.assignments.push({ id:'a262e', classId:'${CLS}', termId:'${TERM_A}', categoryId:'cat262',
      name:'Essay', points:50, assigned:'2027-03-02', due:'2027-03-10' });
    /* One ungraded piece in term B, only so the Scores screen draws its rows there and the
       student page's door is on screen; it counts toward nothing. */
    doc.assignments.push({ id:'a262b', classId:'${CLS}', termId:'${TERM_B}', categoryId:'cat262',
      name:'Later', points:10, assigned:'2027-04-05', due:'2027-04-06' });
    doc.scores['a262q'] = { '${S1}': { v:8 }, '${S2}': { v:6 } };
    doc.scores['a262e'] = { '${S1}': { v:44 } };
    ['2027-03-02','2027-03-03','2027-03-04'].forEach(function(date, i){
      var rec = { classId:'${CLS}', date:date, marks:{} };
      if (i === 1) rec.marks['${S1}'] = { code:'A' };
      if (i === 2) rec.marks['${S2}'] = { code:'T' };
      doc.attendance.push(rec);
    });
    doc.passes.push({ id:'wo262-p1', studentId:'${S1}', classId:'${CLS}', type:'bathroom',
      out:'2027-03-02T10:00:00' + zone, back:'2027-03-02T10:04:00' + zone,
      minutes:4, endedBy:'return', note:'' });
    doc.passes.push({ id:'wo262-p2', studentId:'${S1}', classId:'${CLS}', type:'nurse',
      out:'2027-03-03T11:00:00' + zone, back:'2027-03-03T11:12:00' + zone,
      minutes:12, endedBy:'return', note:'A note row spans the table' });
  });
  window.planbook.supports.setPresentationMode(false);
  c.selectClass('${CLS}');
  c.selectTerm('${TERM_A}');
  window.planbook.attendance.renderAttendance();
  return { ok:true, was: was, mode: mode }; })()`);

if (!plant || !plant.ok) {
  check('the WO-2.62 fixture is real: one class of two on two terms, three meetings, two trips and '
    + 'two assignments in the first', false, JSON.stringify(plant));
  return;
}

/*
  ONE TABLE, READ. Columns are taken from the head's last row, colspans counted; a body row
  (tbody and tfoot) is read only when its cells line up one to one with the heads, which is what
  leaves the trip table's note row — one cell spanning the table — out of the comparison. Returns
  the head's alignment per column and every cell that disagrees with its head. NO BACKTICKS INSIDE.
*/
await evalJs(`(function(){
  window.__wo262read = function(table){
    if (!table) return null;
    var align = function(e){ return getComputedStyle(e).textAlign; };
    var hrows = table.tHead ? table.tHead.rows : [];
    var hrow = hrows.length ? hrows[hrows.length - 1] : null;
    if (!hrow) return { heads: [], rows: 0, off: ['no head row'] };
    var heads = [];
    Array.prototype.forEach.call(hrow.cells, function(c){
      for (var k = 0; k < (c.colSpan || 1); k++) heads.push(align(c)); });
    var off = [], rows = 0;
    var bodies = Array.prototype.slice.call(table.tBodies);
    if (table.tFoot) bodies.push(table.tFoot);
    bodies.forEach(function(b){
      Array.prototype.forEach.call(b.rows, function(tr){
        var cells = Array.prototype.slice.call(tr.cells);
        if (cells.length !== heads.length) return;
        if (cells.some(function(c){ return (c.colSpan || 1) !== 1; })) return;
        rows++;
        cells.forEach(function(c, i){
          var a = align(c);
          if (a !== heads[i]) off.push('row ' + rows + ' col ' + (i + 1) + ': head ' + heads[i]
            + ', cell ' + a + ' (' + (c.textContent || '').trim().slice(0, 16) + ')');
        });
      });
    });
    return { heads: heads, rows: rows, off: off };
  };
  window.__wo262byHead = function(root, last){
    if (!root) return null;
    var all = root.querySelectorAll('table');
    for (var i = 0; i < all.length; i++) {
      var hr = all[i].tHead && all[i].tHead.rows[all[i].tHead.rows.length - 1];
      if (!hr || !hr.cells.length) continue;
      if ((hr.cells[hr.cells.length - 1].textContent || '').trim() === last) return all[i];
    }
    return null;
  };
  return 1; })()`);

const GATES = ['data-attendance-print', 'data-grades-print', 'data-detail-print'];

/* Every table a surface draws, under each of the four conditions. `finders` maps a name to a JS
   expression that yields the table (or a list of them, for the grade sheet's slices). */
async function readAll(finders) {
  const out = {};
  for (const gate of [null].concat(GATES)) {
    const tag = gate || 'screen';
    if (gate) {
      await evalJs("document.body.setAttribute('" + gate + "', ''); 1");
      await send('Emulation.setEmulatedMedia', { media: 'print' });
      await new Promise(r => setTimeout(r, 60));
    }
    for (const name of Object.keys(finders)) {
      const read = await evalJs(`(function(){ var t = ${finders[name]};
        var list = (t && t.length !== undefined && !t.tagName) ? Array.prototype.slice.call(t) : [t];
        return list.map(function(x){ return window.__wo262read(x); }); })()`);
      (out[name] = out[name] || {})[tag] = read;
    }
    if (gate) {
      await send('Emulation.setEmulatedMedia', { media: '' });
      await evalJs("document.body.removeAttribute('" + gate + "'); 1");
    }
  }
  return out;
}

/* The verdict on one table across the four conditions: every cell agrees with its head, and every
   head is what its column is for. `want` is the expected alignment per column. */
function verdict(byCond, want) {
  const faults = [];
  let rows = 0;
  for (const tag of Object.keys(byCond)) {
    const reads = byCond[tag] || [];
    if (!reads.length || reads.some((x) => !x)) { faults.push(tag + ': table not found'); continue; }
    reads.forEach((r, n) => {
      const exp = typeof want === 'function' ? want(r.heads.length) : want;
      rows += r.rows;
      if (!r.rows) faults.push(tag + ' #' + (n + 1) + ': no body row lined up with the heads');
      if (JSON.stringify(r.heads) !== JSON.stringify(exp)) {
        faults.push(tag + ' #' + (n + 1) + ': heads ' + JSON.stringify(r.heads) + ', want '
          + JSON.stringify(exp));
      }
      r.off.forEach((o) => faults.push(tag + ' #' + (n + 1) + ': ' + o));
    });
  }
  return { ok: !faults.length, faults, rows };
}

const RIGHTS = (n) => Array(n).fill('right');
const WANT = {
  record: ['left'].concat(RIGHTS(7)),
  terms: ['left'].concat(RIGHTS(7)),
  days: ['left', 'left', 'right'],
  passes: ['left'].concat(RIGHTS(5)),
  trips: ['left', 'left', 'left', 'left', 'right'],
  grades: (n) => ['left'].concat(Array(Math.max(0, n - 2)).fill('center')).concat(['right']),
};

const closeAll = async () => evalJs(`(function(){
  ['attendanceRecordModal','gradesRecordModal','passHistoryModal'].forEach(function(id){
    var m = document.getElementById(id);
    if (m && !m.classList.contains('hidden')) window.planbook.closeModal(id); });
  return 1; })()`);
async function toClass(termId) {
  await closeAll();
  await evalJs(`(function(){ var all = document.querySelectorAll('[data-view-home]');
    for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { all[i].click(); return 1; } } return 0; })()`);
  await new Promise(r => setTimeout(r, 200));
  await evalJs("window.planbook.classes.selectClass('" + CLS + "'); "
    + "window.planbook.classes.selectTerm('" + termId + "'); "
    + 'window.planbook.screenNav.refreshScreenNav(); 1');
  await new Promise(r => setTimeout(r, 200));
  await clickSel('#classView [data-class-screen="class"]');
  await new Promise(r => setTimeout(r, 200));
}
async function openDetail() {
  await clickSel('#classView [data-class-screen="scores"]');
  await new Promise(r => setTimeout(r, 250));
  await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
  await new Promise(r => setTimeout(r, 250));
}

/* ── term A: every table, with numbers in it ── */
await toClass(TERM_A);
await clickSel('#classView [data-attendance-record]');
await new Promise(r => setTimeout(r, 250));
const record = await readAll({ record:
  "document.querySelector('#attendanceRecordModal table.attendance-report-table:not(.attendance-report-grid)')" });

/*
  ══════════ THE DAY-BY-DAY GRID, READ FOR WHAT EACH CELL IS (WO-2.63) ══════════

  The grid is the one table the reading above leaves out, and the reason it needs a reading of its
  own is the shape of its defect: bare `.attendance-report-day` and `.attendance-report-cell` lost to
  the table-wide left, so date heads AND marks both sat left — they agreed, and "head equals cells"
  passes that. So nothing here compares a head with a cell. Each element is held to an ABSOLUTE
  value: every `th.attendance-report-day` and every `td.attendance-report-cell` computes `center`,
  the *Student* head and every `.attendance-report-row-head` compute `left`. It reads the `td`, never
  `.attendance-report-mark` — the chip centres its own letter whatever the column does, so a reading
  of the chip passes the defect too. Same four conditions as every other table in this section, and
  a count of what was read, because a grid that drew no rows would pass any per-cell assertion.
*/
await clickSel('#attendanceRecordModal [data-attendance-record-part="days"]');
await new Promise(r => setTimeout(r, 250));
const gridReads = {};
for (const gate of [null].concat(GATES)) {
  const tag = gate || 'screen';
  if (gate) {
    await evalJs("document.body.setAttribute('" + gate + "', ''); 1");
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 60));
  }
  gridReads[tag] = await evalJs(`(function(){
    var grids = document.querySelectorAll('#attendanceRecordModal table.attendance-report-grid');
    var out = { grids: grids.length, days: 0, cells: 0, rowHeads: 0, studentHeads: 0, off: [] };
    var want = function(e, w, what){ var a = getComputedStyle(e).textAlign;
      if (a !== w) out.off.push(what + ' ' + JSON.stringify((e.textContent || '').trim().slice(0, 16))
        + ' computes ' + a + ', want ' + w); };
    Array.prototype.forEach.call(grids, function(t){
      var hr = t.tHead && t.tHead.rows[t.tHead.rows.length - 1];
      if (hr && hr.cells.length) { out.studentHeads++; want(hr.cells[0], 'left', 'Student head'); }
      Array.prototype.forEach.call(t.querySelectorAll('th.attendance-report-day'), function(e){
        out.days++; want(e, 'center', 'date head'); });
      Array.prototype.forEach.call(t.querySelectorAll('td.attendance-report-cell'), function(e){
        out.cells++; want(e, 'center', 'mark cell'); });
      Array.prototype.forEach.call(t.querySelectorAll('.attendance-report-row-head'), function(e){
        out.rowHeads++; want(e, 'left', 'row head'); });
    });
    return out; })()`);
  if (gate) {
    await send('Emulation.setEmulatedMedia', { media: '' });
    await evalJs("document.body.removeAttribute('" + gate + "'); 1");
  }
}
{
  const faults = [];
  for (const tag of Object.keys(gridReads)) {
    const g = gridReads[tag];
    if (!g) { faults.push(tag + ': no reading'); continue; }
    /* The fixture: three meetings, two students — one slice of three date heads and six cells. */
    if (g.grids < 1 || g.days !== 3 || g.cells !== 6 || g.rowHeads !== 2 || g.studentHeads !== g.grids) {
      faults.push(tag + ': read ' + g.grids + ' grid(s), ' + g.days + ' date head(s), ' + g.cells
        + ' mark cell(s), ' + g.rowHeads + ' row head(s), ' + g.studentHeads + ' Student head(s); '
        + 'want 3, 6, 2 and one per grid');
    }
    g.off.forEach((o) => faults.push(tag + ': ' + o));
  }
  const s = gridReads.screen || {};
  check('WO-2.63 · in the record\'s Day by day grid every date head and every mark cell computes '
    + 'text-align center, and the Student head and every row head compute left — on screen and with '
    + 'data-attendance-print, data-grades-print and data-detail-print each set under print media',
    !faults.length, faults.length ? faults.slice(0, 8).join(' · ') + (faults.length > 8 ? ' · …' : '')
      : Object.keys(gridReads).length + ' readings, each of ' + s.days + ' date heads, ' + s.cells
        + ' mark cells, ' + s.rowHeads + ' row heads and ' + s.studentHeads + ' Student head');
}

await closeAll();
await clickSel('#classView [data-pass-history]');
await new Promise(r => setTimeout(r, 250));
const passCounts = await readAll({ passes:
  "window.__wo262byHead(document.getElementById('passHistoryModal'), 'Minutes')" });
const footed = await evalJs("(function(){ var t = window.__wo262byHead(document.getElementById("
  + "'passHistoryModal'), 'Minutes'); return !!(t && t.tFoot && t.tFoot.rows.length); })()");
await clickSel('#passHistoryModal [data-pass-history-student="' + S1 + '"]');
await new Promise(r => setTimeout(r, 250));
const tripDialog = await readAll({ trips:
  "window.__wo262byHead(document.getElementById('passHistoryModal'), 'Minutes')" });

await closeAll();
await clickSel('#classView [data-class-screen="scores"]');
await new Promise(r => setTimeout(r, 250));
await clickSel('#scoresView [data-grades-record]');
await new Promise(r => setTimeout(r, 250));
const grades = await readAll({ grades:
  "document.querySelectorAll('#gradesRecordModal table.grades-report-table')" });

await closeAll();
await openDetail();
await clickSel('#detailView details.detail-att-days > summary');
await new Promise(r => setTimeout(r, 120));
const detailA = await readAll({
  terms: "document.querySelector('#detailView table.detail-att-terms')",
  days: "document.querySelector('#detailView details.detail-att-days table')",
  trips: "window.__wo262byHead(document.getElementById('detailView'), 'Minutes')",
});

/* ── ACCEPTANCE 1: every head over its own column, five tables and the grade sheet ── */
const TABLES = [
  ['the attendance record\'s By student summary (totalsRow(), src/attendance-report.js)',
    record.record, WANT.record],
  ['the student page\'s term table (the same totalsRow(), imported by src/detail.js)',
    detailA.terms, WANT.terms],
  ['the student page\'s day by day (src/detail.js)', detailA.days, WANT.days],
  ['the hall-pass dialog\'s per-student counts, with the All of … footer (src/pass-history.js)',
    passCounts.passes, WANT.passes],
  ['the trip table, in the hall-pass dialog and on the student page (tripTable(), '
    + 'src/pass-history.js)', Object.assign({},
    ...Object.keys(tripDialog.trips).map((k) => ({ ['dialog ' + k]: tripDialog.trips[k] })),
    ...Object.keys(detailA.trips).map((k) => ({ ['card ' + k]: detailA.trips[k] }))), WANT.trips],
  ['the grade sheet, every slice (src/grades-report.js)', grades.grades, WANT.grades],
];
for (const [label, byCond, want] of TABLES) {
  const v = verdict(byCond, want);
  check('WO-2.62 · ' + label + ': every head\'s computed text-align equals every cell\'s under it, '
    + 'and is what the column is for — on screen and with data-attendance-print, data-grades-print '
    + 'and data-detail-print each set under print media',
    v.ok, v.ok ? Object.keys(byCond).length + ' readings, ' + v.rows + ' body rows compared, heads '
      + JSON.stringify((byCond.screen || byCond['dialog screen'] || [{}])[0].heads)
      : v.faults.slice(0, 8).join(' · ') + (v.faults.length > 8 ? ' · …' : ''));
}
check('WO-2.62 · the hall-pass counts table that was read carries its All of … footer, so the footer '
  + 'row was in the comparison above', footed === true, 'tfoot rows present = ' + footed);

/*
  THE STRUCTURAL HALF. Every same-origin stylesheet's rules, walked into @media and other grouping
  rules, the ones that set text-align kept. See the header for what it can and cannot see.
*/
const css = await evalJs(`(function(){
  var PAIRS = [['grades-report-student-head','grades-report-row-head'],
    ['grades-report-total-head','grades-report-total']];
  var COLUMN = ['attendance-report-num'];
  PAIRS.forEach(function(p){ COLUMN.push(p[0], p[1]); });
  var faults = [], seen = 0, sheets = 0;
  var classesOf = function(sel){ var out = [], m, re = /\\.([A-Za-z0-9_-]+)/g;
    while ((m = re.exec(sel))) out.push(m[1]); return out; };
  var TYPE = /(^|[\\s>+~(])(thead|tbody|tfoot|th|td)(?=[.:#\\[\\s>+~)]|$)/;
  var walk = function(rules, where){
    Array.prototype.forEach.call(rules, function(r){
      if (r.cssRules && !r.selectorText) { walk(r.cssRules, where + (r.conditionText
        ? ' @media ' + r.conditionText : '')); return; }
      if (!r.selectorText || !r.style || !r.style.textAlign) return;
      var parts = r.selectorText.split(',').map(function(x){ return x.trim(); });
      var named = []; parts.forEach(function(p){ named = named.concat(classesOf(p)); });
      var touches = named.some(function(c){ return COLUMN.indexOf(c) !== -1; });
      if (!touches) return;
      seen++;
      PAIRS.forEach(function(p){
        var a = named.indexOf(p[0]) !== -1, b = named.indexOf(p[1]) !== -1;
        if (a !== b) faults.push(where + ' { ' + r.selectorText + ' } names .' + (a ? p[0] : p[1])
          + ' without .' + (a ? p[1] : p[0]));
      });
      parts.forEach(function(p){
        if (classesOf(p).some(function(c){ return COLUMN.indexOf(c) !== -1; }) && TYPE.test(p)) {
          faults.push(where + ' { ' + p + ' } aligns a column class under a table-part or cell '
            + 'type — a head-only (or cell-only) rule');
        }
      });
    });
  };
  Array.prototype.forEach.call(document.styleSheets, function(s){
    var rules; try { rules = s.cssRules; } catch (e) { return; }
    if (!rules) return;
    sheets++;
    walk(rules, String(s.href || 'inline').split('/').pop());
  });
  return { faults: faults, seen: seen, sheets: sheets }; })()`);
check('WO-2.62 · no stylesheet aligns one half of a grade-sheet column without the other, in any '
  + 'media block, and no rule aligns a column class under thead/tbody/tfoot/th/td (a head-only rule '
  + 'is the defect\'s shape)',
  !!css && css.sheets > 0 && css.seen >= 4 && !css.faults.length,
  css ? (css.faults.length ? css.faults.join(' · ')
    : css.seen + ' text-align rule(s) naming a column class, across ' + css.sheets + ' sheet(s), '
      + 'every pair whole') : 'no reading');

/* ── ACCEPTANCE 2: the dash, its accessible name, and the card title that keeps the sentence ── */
/* The accessible name as the browser computes it, out of the accessibility tree, not the attribute:
   a name lost to a role change or an aria-hidden ancestor would leave the attribute in place. */
async function axNames(selector) {
  const docNode = await send('DOM.getDocument', { depth: 0 });
  const found = await send('DOM.querySelectorAll', { nodeId: docNode.root.nodeId, selector });
  const names = [];
  for (const nodeId of (found.nodeIds || [])) {
    const ax = await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const node = (ax.nodes || [])[0] || {};
    names.push(node.name && node.name.value !== undefined ? String(node.name.value) : '(none)');
  }
  return names;
}
const lastCells = (sel) => evalJs(`(function(){
  return Array.prototype.map.call(document.querySelectorAll(${JSON.stringify(sel)}),
    function(tr){ var c = tr.cells[tr.cells.length - 1];
      return { row: (tr.cells[0].textContent || '').trim(), text: (c.textContent || '').trim(),
        label: c.getAttribute('aria-label'), scope: tr.cells[0].getAttribute('scope'),
        head: tr.cells[0].tagName }; }); })()`);

await toClass(TERM_B);
await clickSel('#classView [data-attendance-record]');
await new Promise(r => setTimeout(r, 250));
const RECORD_ROWS = '#attendanceRecordModal table.attendance-report-table:not(.attendance-report-grid) tbody tr';
const recB = await lastCells(RECORD_ROWS);
const recAx = await axNames(RECORD_ROWS + ' td:last-child');
check('WO-2.62 · on the record\'s By student tab, a student with no recorded meetings reads — in the '
  + 'percentage cell, and that cell\'s accessible name is "No recorded meetings"; the row head keeps '
  + 'scope="row"',
  recB.length === 2 && recB.every((r) => r.text === '—' && r.label === NAME && r.head === 'TH'
    && r.scope === 'row')
    && recAx.length === 2 && recAx.every((n) => n === NAME),
  JSON.stringify(recB) + ' · accessible names ' + JSON.stringify(recAx));

await closeAll();
await openDetail();
const TERM_ROWS = '#detailView table.detail-att-terms tbody tr';
const termB = await lastCells(TERM_ROWS);
const termAx = await axNames(TERM_ROWS + ' td:last-child');
const title = await evalJs(`(function(){
  var t = Array.prototype.filter.call(document.querySelectorAll('#detailView .detail-card-title'),
    function(e){ return (e.textContent || '').indexOf('Attendance · ') === 0; })[0];
  return t ? t.textContent : ''; })()`);
const rowB = termB.filter((r) => r.row === LABEL_B + ' — open')[0] || {};
const rowA = termB.filter((r) => r.row === LABEL_A)[0] || {};
const rowY = termB.filter((r) => r.row === 'Whole year')[0] || {};
check('WO-2.62 · on the student page\'s term table, the term with no recorded meetings reads — in the '
  + 'percentage cell with the accessible name "No recorded meetings"; the terms with meetings read a '
  + 'percentage and carry no such name; every row head keeps scope="row"; the card title still reads '
  + '"Attendance · No recorded meetings"',
  termB.length === 3 && rowB.text === '—' && rowB.label === NAME
    && /^\d+%$/.test(rowA.text || '') && rowA.label === null
    && /^\d+%$/.test(rowY.text || '') && rowY.label === null
    && termB.every((r) => r.head === 'TH' && r.scope === 'row')
    && termAx.length === 3 && termAx[termB.indexOf(rowB)] === NAME
    && title === 'Attendance · ' + NAME,
  JSON.stringify(termB) + ' · accessible names ' + JSON.stringify(termAx) + ' · title '
    + JSON.stringify(title));

/* The rows with nothing in them are read under the four conditions too: a dash is a narrower cell
   than a sentence, and the alignment must not depend on which one is in it. */
const detailB = await readAll({ terms: "document.querySelector('#detailView table.detail-att-terms')" });
const vB = verdict(detailB.terms, WANT.terms);
check('WO-2.62 · the term table with a dash in it keeps every head over its column, on screen and '
  + 'under each print attribute', vB.ok, vB.ok ? vB.rows + ' body rows compared' : vB.faults.join(' · '));

/*
  THE FIXTURE COMES BACK OUT, and the presentation-mode preference goes back to what this section
  found.
*/
await closeAll();
const gone = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo262-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    delete doc.scores['a262q']; delete doc.scores['a262e'];
    doc.attendance = doc.attendance.filter(function(r){ return r.classId !== '${CLS}'; });
    doc.passes = doc.passes.filter(function(p){ return p.classId !== '${CLS}'; });
  });
  window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  delete window.__wo262read; delete window.__wo262byHead;
  return JSON.stringify(s.getDoc()).indexOf('wo262-') === -1
    && window.planbook.supports.presentationMode() === ${plant.mode ? 'true' : 'false'}; })()`);
check('WO-2.62 · the fixture is out of the document and presentation mode is back where this section '
  + 'found it', gone === true, 'clean = ' + gone);
}
