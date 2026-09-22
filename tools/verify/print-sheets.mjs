/* print-sheets.mjs — the four printed pages under one header, with no chrome and no support data (WO-8.4)
 *
 * WO-8.4's section, written new rather than moved. Nothing here launches a browser, a server or a
 * document of its own: the entry file owns all three and hands them over on `h`.
 * `tools/README.md` § "Driving a browser over CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
  ══════════ THE PRINTED PAGES: ONE HEADER, NO CHROME, NO SUPPORT DATA (WO-8.4) ══════════

  Four surfaces print — the attendance record (WO-2.6), one student's report (WO-3.7), the class
  grade sheet (WO-3.9) and the calendar (WO-6.3) — and each already has its own section asserting
  its own gate. What this section adds is what WO-8.4 made common to all four, asked of all four in
  one pass and in BOTH presentation modes:

    1. #printHeader is drawn on the sheet, and says what the sheet is, the class, the term and the
       print date — and the surface's own head is not drawn beside it (ruling 1).
    2. Nothing that is a control has a box on the sheet: no button, field, link or nav.
    3. No support value is anywhere in the text the sheet renders, with presentation mode OFF as
       well as on — the fixture plants six sentinels and proves they are in the document first.
    4. The grade sheet's rows and columns are still in WO-3.9's order, with the letter scale in the
       header (ruling 3), and the two forced breaks carry the continuation line (ruling 2).

  Plus the three things that are not one surface: the month's named landscape page (ruling 4, as
  far as Chromium can say it — Safari ignores named pages and that stays a limit, not a check), the
  calendar band's filter-in-words rule (ruling 5), and the ungated belt in src/shell.css (ruling 6),
  read on a Ctrl+P from the roster, from a student editor with the support panel open, and from the
  home page's review count, with no gate on <body> at all.

  WHAT A PAGE "RENDERS" MEANS HERE: document.body.innerText under an emulated print medium, which is
  text the layout actually drew — display:none is out of it, which is exactly the difference between
  a sheet and a DOM. textContent would find the hidden dialog head and every CSS-hidden card, and
  tools/README.md records a check here that was wrong for exactly that reason.

  WHAT IT CANNOT SAY: that any of this comes out of a real printer as one clean page, or that the
  iPad's Safari turns the month sideways (it does not; the owner accepted that). The PDF readings at
  the end are Chromium's own print pipeline and are evidence about Chromium. Paper stays 👤.
*/
console.log('\n--- the printed pages: one header, no chrome, no support data (WO-8.4) ---');
if (!seam) {
  skip('the printed pages (WO-8.4)', 'window.planbook is not on the page, so nothing here can seed '
    + 'a class, open its four surfaces, or put the document back');
  return;
}

const CLS = 'c_wo84';
const TERM = 'tm_wo84';
const LABEL = 'WO-8.4 Term';
const CLASS_NAME = 'WO-8.4 Printed';
const S1 = 'wo84-s1', S2 = 'wo84-s2', S3 = 'wo84-s3';
const T_START = '2027-05-03', T_END = '2027-06-25';
const WEEK_OF = '2027-05-12';
const REVIEW = '2027-05-20';
/* Six values nothing else in the repository contains, one per support field that can hold text,
   plus the chip a review date would draw. Searched for in what the sheet RENDERS. */
const SENTINELS = ['WO84 ACCOMMODATION SENTINEL', 'WO84 MEDICAL SENTINEL', 'WO84 BEHAVIOR SENTINEL',
  'WO84 CASEMANAGER SENTINEL', 'WO84 CLAUSE SENTINEL', 'Review ·'];
/* The order the SIS reads (WO-3.9): last name, then due date. Stored in neither order. */
const ROWS = ['Abbott, Ben', 'Okafor-Wo84, Nia', 'Zed, Rev'];
const COLUMNS = ['Quiz B', 'Essay A', 'Practice 1', 'Practice 2', 'Practice 3', 'Practice 4',
  'Practice 5', 'Practice 6', 'Practice 7'];

await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
await send('Emulation.setDeviceMetricsOverride',
  { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();
await evalJs(KILL_ANIM);

const plant = await evalJs(`(function(){
  var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
  var d = s.getDoc();
  if (!d) return { ok:false, why:'no year document is open' };
  var was = c.getSelectedClassId();
  var mode = window.planbook.supports.presentationMode();
  var today = a.todayISO();
  s.update(function(doc){
    if (!Array.isArray(doc.classes)) doc.classes = [];
    if (!Array.isArray(doc.students)) doc.students = [];
    if (!Array.isArray(doc.assignments)) doc.assignments = [];
    if (!Array.isArray(doc.attendance)) doc.attendance = [];
    if (!doc.scores) doc.scores = {};
    doc.students.push(
      { id:'${S1}', first:'Nia', last:'Okafor-Wo84',
        supports:{ plan:'IEP',
          caseManager:{ name:'WO84 CASEMANAGER SENTINEL', email:'wo84@example.test' },
          reviewDate:'${REVIEW}',
          accommodations:[{ kind:'extended-time', detail:'WO84 ACCOMMODATION SENTINEL',
            appliesTo:[] }],
          medical:'WO84 MEDICAL SENTINEL', behaviorPlan:'WO84 BEHAVIOR SENTINEL',
          attendanceClause:'WO84 CLAUSE SENTINEL' } },
      { id:'${S2}', first:'Ben', last:'Abbott' },
      /* A review due TODAY, so the home page has a review count to draw for the belt to take off. */
      { id:'${S3}', first:'Rev', last:'Zed', supports:{ plan:'504', reviewDate: today } });
    doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
      roster:['${S3}','${S1}','${S2}'], letterScale:null,
      terms:[{ id:'${TERM}', label:'${LABEL}', start:'${T_START}', end:'${T_END}' }],
      categories:[{ id:'cat84', name:'All work', weight:100 }]});
    /* A SECOND CLASS WITH NO TERMS, so the calendar's every-class band has at least two classes to
       count and at least one with no term — which is the case where the term line must be absent. */
    doc.classes.push({ id:'${CLS}b', name:'WO-8.4 Other', archived:false, roster:[],
      letterScale:null, terms:[], categories:[] });
    /* Stored in the order the SIS does NOT read: Essay A first, due a week after Quiz B. */
    doc.assignments.push({ id:'a84e', classId:'${CLS}', termId:'${TERM}', categoryId:'cat84',
      name:'Essay A', points:50, assigned:'2027-05-03', due:'2027-05-12' });
    doc.assignments.push({ id:'a84q', classId:'${CLS}', termId:'${TERM}', categoryId:'cat84',
      name:'Quiz B', points:10, assigned:'2027-05-03', due:'2027-05-05' });
    /* Seven more nobody has graded, due in June, so the sheet runs to nine columns and breaks onto a
       second slice: that break is the one the continuation line is for, and the first slice is the
       one that must NOT break (WO-8.4 put it on page one under the header). */
    for (var n = 1; n <= 7; n++) {
      doc.assignments.push({ id:'a84p' + n, classId:'${CLS}', termId:'${TERM}', categoryId:'cat84',
        name:'Practice ' + n, points:10, assigned:'2027-05-03', due:'2027-06-0' + n });
    }
    doc.scores['a84e'] = { '${S1}': { v:40 }, '${S2}': { v:45 } };
    doc.scores['a84q'] = { '${S1}': { v:8 }, '${S2}': { v:null, flag:'missing' } };
    ['2027-05-04','2027-05-05','2027-05-06'].forEach(function(date, i){
      var rec = { classId:'${CLS}', date:date, marks:{} };
      if (i === 1) rec.marks['${S1}'] = { code:'A' };
      doc.attendance.push(rec);
    });
  });
  window.planbook.supports.setPresentationMode(false);
  c.selectClass('${CLS}');
  c.selectTerm('${TERM}');
  a.renderAttendance();
  return { ok:true, doc: JSON.stringify(s.getDoc()), was: was, mode: mode, today: today }; })()`);

if (!plant || !plant.ok) {
  check('the WO-8.4 fixture is real: one class of three, a term, two assignments, three meetings '
    + 'and a full support block', false, JSON.stringify(plant));
  return;
}
const planted = SENTINELS.slice(0, 5).every((s) => plant.doc.indexOf(s) !== -1)
  && plant.doc.indexOf('"reviewDate":"' + REVIEW + '"') !== -1;
check('the WO-8.4 fixture is real: every support sentinel is in the year document before anything '
  + 'is printed, so an absence below is an absence and not a fixture that never landed',
  planted, 'sentinels in the document = ' + planted);

const TODAY = await evalJs('window.planbook.attendance.plainDate(window.planbook.attendance.todayISO())');
const RANGE = await evalJs('window.planbook.attendance.plainDate("' + T_START + '") + " – " + '
  + 'window.planbook.attendance.plainDate("' + T_END + '")');

/*
  ONE READING OF ONE SURFACE ON PAPER. The app's own gate is answered the way the browser answers
  it — a `beforeprint` event, which is what src/print-gate.js listens for and what fills the header
  — and then the medium is switched to print and the page is read. NO BACKTICKS INSIDE THE STRING.
*/
const READ_SHEET = (surfaceSel, ownHeadSel, extraSel) => `(function(){
  var box = function(e){ if (!e) return -1; var r = e.getBoundingClientRect();
    return Math.round(r.height); };
  var hdr = document.getElementById('printHeader');
  var surface = document.querySelector(${JSON.stringify(surfaceSel)});
  var own = ${ownHeadSel ? 'document.querySelector(' + JSON.stringify(ownHeadSel) + ')' : 'null'};
  var controls = [];
  Array.prototype.forEach.call(document.querySelectorAll(
    'button, input, select, textarea, a[href], nav, [role=button], [role=tab], [role=navigation]'),
    function(e){
      /* A calendar chip is a button on screen and a line of text on paper: its print rule strips
         the wash and wraps the label. It is the sheet's content, and it is the one exception. */
      if (e.classList.contains('calendar-chip')) return;
      var r = e.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) controls.push(e.tagName.toLowerCase() + '.'
        + String(e.className || '').split(' ').slice(0, 2).join('.'));
    });
  var running = Array.prototype.map.call(document.querySelectorAll('.print-header-running'),
    function(e){ return { h: box(e), text: e.innerText || '' }; })
    .filter(function(x){ return x.h > 0; });
  return {
    gates: ['data-attendance-print','data-detail-print','data-grades-print','data-calendar-print']
      .filter(function(a){ return document.body.hasAttribute(a); }),
    headerDisplay: hdr ? getComputedStyle(hdr).display : '(absent)',
    headerH: box(hdr),
    headerFirst: !!hdr && document.body.firstElementChild === hdr,
    title: hdr ? ((hdr.querySelector('.print-header-title') || {}).textContent || '') : '',
    subject: hdr ? ((hdr.querySelector('.print-header-class') || {}).textContent || '') : '',
    lines: hdr ? Array.prototype.map.call(hdr.querySelectorAll('.print-header-term'),
      function(e){ return e.textContent; }) : [],
    stamp: hdr ? ((hdr.querySelector('.print-header-stamp') || {}).textContent || '') : '',
    surfaceH: box(surface),
    ownH: own ? box(own) : null,
    controls: controls,
    running: running,
    extraH: ${extraSel ? 'box(document.querySelector(' + JSON.stringify(extraSel) + '))' : 'null'},
    page: getComputedStyle(document.body).getPropertyValue('page'),
    text: document.body.innerText || '' }; })()`;

async function readOnPaper(surfaceSel, ownHeadSel, extraSel) {
  await evalJs("window.dispatchEvent(new Event('beforeprint')); 1");
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await new Promise(r => setTimeout(r, 150));
  const out = await evalJs(READ_SHEET(surfaceSel, ownHeadSel, extraSel));
  await send('Emulation.setEmulatedMedia', { media: '' });
  await evalJs("window.dispatchEvent(new Event('afterprint')); 1");
  await new Promise(r => setTimeout(r, 80));
  return out;
}

const leaks = (text) => SENTINELS.filter((s) => String(text || '').indexOf(s) !== -1)
  .concat(/\bIEP\b|\b504\b/.test(String(text || '')) ? ['a plan type'] : []);

/* The four surfaces, opened through their real doors, in one mode. */
async function openRecord() {
  await clickSel('#classView [data-class-screen="class"]');
  await new Promise(r => setTimeout(r, 200));
  await clickSel('#classView [data-attendance-record]');
  await new Promise(r => setTimeout(r, 250));
}
async function openGrades() {
  await clickSel('#classView [data-class-screen="scores"]');
  await new Promise(r => setTimeout(r, 250));
  await clickSel('#scoresView [data-grades-record]');
  await new Promise(r => setTimeout(r, 250));
}
async function openDetail() {
  await clickSel('#classView [data-class-screen="scores"]');
  await new Promise(r => setTimeout(r, 250));
  await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
  await new Promise(r => setTimeout(r, 250));
}
async function openCalendar(filter) {
  await clickSel('#detailView [data-class-screen="calendar"]');
  await new Promise(r => setTimeout(r, 250));
  await evalJs(`(function(){ var v = window.planbook.calendarView;
    v.resetCalendar(${JSON.stringify(filter)}, '${WEEK_OF}');
    v.setCalendarScale('month'); v.renderCalendar(); return 1; })()`);
  await new Promise(r => setTimeout(r, 150));
}
/* Back to the class screen by the way a teacher gets there: the visible home door, then the class.
   selectClass() keeps the calendar up when it is the view on screen (src/classes.js), so going home
   first is what makes the next door the registry every time. */
async function toClass() {
  await evalJs(`(function(){ var all = document.querySelectorAll('[data-view-home]');
    for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { all[i].click(); return 1; } } return 0; })()`);
  await new Promise(r => setTimeout(r, 200));
  await evalJs("window.planbook.classes.selectClass('" + CLS + "'); "
    + "window.planbook.classes.selectTerm('" + TERM + "'); "
    /* selectClass() swaps the view and leaves the switcher strips to src/shell.js, which repaints
       them after its own door; this is that repaint, since the door here was the seam. */
    + 'window.planbook.screenNav.refreshScreenNav(); 1');
  await new Promise(r => setTimeout(r, 200));
}
const closeAll = async () => evalJs(`(function(){
  ['attendanceRecordModal','gradesRecordModal','rosterModal','studentModal'].forEach(function(id){
    var m = document.getElementById(id);
    if (m && !m.classList.contains('hidden')) window.planbook.closeModal(id); });
  return 1; })()`);

const sheets = {};
for (const mode of [false, true]) {
  const tag = mode ? 'on' : 'off';
  await evalJs('window.planbook.supports.setPresentationMode(' + mode + '); 1');
  await toClass();

  await openRecord();
  sheets['record-' + tag] = await readOnPaper('#attendanceRecordModal',
    '#attendanceRecordModal .attendance-report-print-head');
  await closeAll();

  await openGrades();
  sheets['grades-' + tag] = await readOnPaper('#gradesRecordModal',
    '#gradesRecordModal .grades-report-head');
  sheets['grades-' + tag].order = await evalJs(`(function(){
    var m = document.getElementById('gradesRecordModal');
    var t = m.querySelector('.grades-report-slice table');
    return { rows: Array.prototype.map.call(t.querySelectorAll('tbody tr'),
        function(tr){ return (tr.querySelector('th') || {}).textContent || ''; }),
      cols: Array.prototype.map.call(m.querySelectorAll('.grades-report-slice thead .grades-report-col-name'),
        function(e){ return e.textContent; }),
      slices: m.querySelectorAll('.grades-report-slice').length }; })()`);
  await closeAll();

  await openDetail();
  sheets['detail-' + tag] = await readOnPaper('#detailView', '#detailView .detail-header',
    '#detailView .detail-hero-where');
  sheets['detail-' + tag].heroWhereH = sheets['detail-' + tag].extraH;

  await openCalendar(CLS);
  sheets['calendar-' + tag] = await readOnPaper('#calendarView', '#calendarView .calendar-header');
}

const EXPECT = {
  record: { title: 'Attendance record', surface: 'the attendance record',
    lines: (l) => l.length === 1 && l[0].indexOf(LABEL) === 0 && l[0].indexOf(RANGE) !== -1
      && l[0].indexOf('3 recorded meetings') !== -1 },
  grades: { title: 'Grade sheet', surface: 'the grade sheet',
    lines: (l) => l.length === 2 && l[0].indexOf(LABEL) === 0 && l[0].indexOf(RANGE) !== -1
      && l[1].indexOf('Letter scale') === 0 },
  detail: { title: 'Student report', surface: 'the student report',
    lines: (l) => l.length === 1 && l[0] === LABEL + ' · ' + RANGE },
  calendar: { title: 'Calendar · May 2027', surface: 'the calendar month',
    lines: (l) => l.length === 1 && l[0] === LABEL + ' · ' + RANGE },
};

/* ── ACCEPTANCE 1: a title, the class, the term and the date, on every sheet, in both modes ── */
for (const key of Object.keys(EXPECT)) {
  const e = EXPECT[key];
  const both = ['off', 'on'].map((tag) => sheets[key + '-' + tag]);
  const good = (s) => !!s && s.headerDisplay === 'flex' && s.headerH > 0 && s.headerFirst
    && s.title === e.title && s.subject === CLASS_NAME && e.lines(s.lines)
    && s.stamp.indexOf('Printed ' + TODAY) === 0 && s.surfaceH > 0 && s.gates.length === 1;
  check('WO-8.4 · ' + e.surface + ' prints under #printHeader — the first thing on the sheet, '
    + 'naming what it is, the class, the term with its dates and the day it was printed — with '
    + 'presentation mode off and on',
    both.every(good),
    both.map((s, i) => (i ? 'mode on: ' : 'mode off: ') + (s ? JSON.stringify({
      display: s.headerDisplay, h: s.headerH, first: s.headerFirst, title: s.title,
      subject: s.subject, lines: s.lines, stamp: s.stamp, surfaceH: s.surfaceH,
      gates: s.gates }) : 'no reading')).join(' · '));
}

/* ── ruling 1: each surface's own head is off the sheet, so the band is the ONE title ── */
{
  const heads = ['record', 'grades', 'detail', 'calendar'].map((k) =>
    ({ k: k, off: sheets[k + '-off'].ownH, on: sheets[k + '-on'].ownH }));
  const where = ['off', 'on'].map((t) => sheets['detail-' + t].heroWhereH);
  check('WO-8.4 · each surface\'s own head is not drawn on its sheet — the record\'s and the grade '
    + 'sheet\'s dialog heads, the student report\'s panel header and the class and term on its hero '
    + 'line, and the calendar\'s panel header — so #printHeader is the one title (ruling 1)',
    heads.every((x) => x.off === 0 && x.on === 0) && where.every((h) => h === 0),
    JSON.stringify(heads) + '; the hero\'s class-and-term span = ' + JSON.stringify(where) + 'px');
}

/* ── ACCEPTANCE 2: no app chrome, navigation or control on any sheet ── */
{
  const all = Object.keys(sheets).map((k) => ({ k: k, controls: sheets[k].controls }));
  check('WO-8.4 · no button, field, link or nav has a box on any of the four sheets, in either mode '
    + '— the calendar\'s chips excepted by name, because on paper each is a line of text',
    all.every((x) => Array.isArray(x.controls) && x.controls.length === 0),
    all.filter((x) => x.controls.length).map((x) => x.k + ': ' + JSON.stringify(x.controls.slice(0, 6)))
      .join(' · ') || 'none on any of ' + all.length + ' sheet(s)');
}

/* ── ACCEPTANCE 3: no support value in what any sheet renders, in either mode ── */
{
  const found = Object.keys(sheets).map((k) => ({ k: k, leaks: leaks(sheets[k].text),
    len: String(sheets[k].text || '').length }));
  check('WO-8.4 · none of the four sheets renders a support value — no accommodation, medical need, '
    + 'behaviour plan, case manager, attendance clause, plan type or review chip — with presentation '
    + 'mode OFF as well as on',
    found.every((x) => x.leaks.length === 0 && x.len > 40),
    found.map((x) => x.k + ' ' + x.len + ' chars' + (x.leaks.length ? ' LEAKS ' + JSON.stringify(x.leaks) : ''))
      .join(' · '));
}

/* ── ACCEPTANCE 4, and ruling 3: the SIS order is unchanged, and the scale is in the header ── */
{
  const o = ['off', 'on'].map((t) => sheets['grades-' + t].order);
  const scale = ['off', 'on'].map((t) => sheets['grades-' + t].lines[1] || '');
  check('WO-8.4 · the printed grade sheet is still in WO-3.9\'s order — rows by last name as '
    + '`Last, First`, columns by due date, over a roster and assignment list stored in neither — and '
    + 'the letter scale is the second line of the header, at the top of the sheet (ruling 3)',
    o.every((x) => x && JSON.stringify(x.rows) === JSON.stringify(ROWS)
      && JSON.stringify(x.cols) === JSON.stringify(COLUMNS) && x.slices === 2)
      && scale.every((s) => /^Letter scale · the year’s bands · A /.test(s)),
    JSON.stringify(o) + ' :: ' + JSON.stringify(scale));
}

/* ── ruling 2: the continuation line at the two forced breaks, and nowhere else ── */
{
  /* The record's one day-by-day slice starts page two, so it carries one line; the grade sheet's
     two slices carry ONE between them — the first prints on page one under #printHeader itself. */
  const want = (s) => s.running.length === 1 && s.running.every((r) =>
    r.text.indexOf('Attendance record') !== -1 || r.text.indexOf('Grade sheet') !== -1)
    && s.running.every((r) => r.text.indexOf(CLASS_NAME) !== -1 && r.text.indexOf(LABEL) !== -1
      && r.text.indexOf('Printed ' + TODAY) !== -1 && r.text.indexOf('continued') !== -1);
  const r = ['record-off', 'record-on', 'grades-off', 'grades-on'].map((k) => sheets[k]);
  const none = ['detail-off', 'detail-on', 'calendar-off', 'calendar-on']
    .map((k) => sheets[k].running.length);
  check('WO-8.4 · every slice the record and the grade sheet break onto a page of its own opens '
    + 'with the continuation line — class, term, print date and "continued" — the grade sheet\'s '
    + 'first slice, which prints on page one under the header, carries none, and the two sheets '
    + 'that force no break draw none (ruling 2)',
    r.every(want) && none.every((n) => n === 0),
    r.map((s) => JSON.stringify(s.running)).join(' · ') + '; on the other two: ' + JSON.stringify(none));
}

/* ── ruling 5: the calendar band names the filter in words, and the term only when it is shared ── */
{
  await closeAll();
  await evalJs('window.planbook.supports.setPresentationMode(false); 1');
  await toClass();
  await openDetail();
  await openCalendar('');
  const all = await readOnPaper('#calendarView', null);
  const n = await evalJs('window.planbook.classes.getActiveClasses().length');
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve'];
  const wantSubject = n === 1 ? CLASS_NAME : n === 2 ? 'Both classes'
    : 'All ' + (words[n] || String(n)) + ' classes';
  /* Whether every OTHER active class has the same single term over May 2027 — asked of the document,
     so the expectation is derived rather than assumed. On any real fixture it is false. */
  const shared = await evalJs(`(function(){
    var c = window.planbook.classes, list = c.getActiveClasses();
    var each = list.map(function(k){ return c.getTerms(k.id).filter(function(t){
      return c.termIsDated(t) && t.start <= '2027-05-31' && t.end >= '2027-05-01'; }); });
    if (!each.length || !each.every(function(l){ return l.length === 1; })) return false;
    var f = each[0][0];
    return each.every(function(l){ return l[0].start === f.start && l[0].end === f.end
      && String(l[0].label || '') === String(f.label || ''); }); })()`);
  const one = sheets['calendar-off'];
  check('WO-8.4 · the calendar band names the filter in words — this class\'s own name with one '
    + 'class showing, and "Both classes" or "All <n> classes" with every class showing, counted '
    + 'rather than written — '
    + 'and prints the term only when every class showing has the same one (ruling 5)',
    one.subject === CLASS_NAME && one.lines.length === 1
      && all.subject === wantSubject && all.title === 'Calendar · May 2027'
      && shared === false && all.lines.length === 0 && n >= 2,
    'one class: ' + JSON.stringify({ subject: one.subject, lines: one.lines }) + '; every class, '
      + 'wanting ' + JSON.stringify(wantSubject) + ' ('
      + n + ' active, a shared term = ' + shared + '): '
      + JSON.stringify({ title: all.title, subject: all.subject, lines: all.lines }));
}

/* ── ruling 4: the month, and only the month, asks for a landscape page ── */
{
  /* Read under the print medium, because the rule that names the page is inside @media print — a
     screen reading answers "auto" for every gate and says nothing. The attributes are set by hand
     here, one at a time, because what is asked is what each gate's CSS does, not which surface is up. */
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await new Promise(r => setTimeout(r, 120));
  const named = await evalJs(`(function(){
    var rules = [];
    Array.prototype.forEach.call(document.styleSheets, function(sh){
      var list; try { list = sh.cssRules; } catch (e) { return; }
      Array.prototype.forEach.call(list || [], function(r){
        if (r.type === 6) rules.push({ name: r.selectorText || '', size: r.style.getPropertyValue('size') });
      });
    });
    var read = function(attr){
      if (attr) document.body.setAttribute(attr, '1');
      var p = getComputedStyle(document.body).getPropertyValue('page');
      if (attr) document.body.removeAttribute(attr);
      return p; };
    return { rules: rules, calendar: read('data-calendar-print'), grades: read('data-grades-print'),
      detail: read('data-detail-print'), record: read('data-attendance-print'), none: read('') }; })()`);
  await send('Emulation.setEmulatedMedia', { media: '' });
  const cal = named.rules.filter((r) => r.name === 'calendar')[0];
  check('WO-8.4 · `@page calendar { size: landscape }` is declared, <body> takes that page under the '
    + 'calendar\'s gate and under no other, so the other three sheets stay portrait (ruling 4 — '
    + 'Chromium honours it; Safari on the iPad ignores named pages, an accepted limit)',
    !!cal && /landscape/.test(cal.size) && named.calendar === 'calendar'
      && ['grades', 'detail', 'record', 'none'].every((k) => named[k] !== 'calendar'),
    JSON.stringify(named));

  /* AND WHAT CHROMIUM'S OWN PRINT PIPELINE DOES WITH IT. Page.printToPDF with the CSS page size
     preferred, once over the calendar and once over the grade sheet, reading the first page's
     MediaBox. Evidence about this engine only — the iPad's is the one that ignores the rule. */
  const pdfBox = async () => {
    await evalJs("window.dispatchEvent(new Event('beforeprint')); 1");
    let res = null;
    try { res = await send('Page.printToPDF', { preferCSSPageSize: true, printBackground: true }); }
    catch (e) { return { error: String((e && e.message) || e) }; }
    await evalJs("window.dispatchEvent(new Event('afterprint')); 1");
    if (!res || !res.data) return { error: 'no data' };
    const pdf = Buffer.from(res.data, 'base64').toString('latin1');
    const boxes = [...pdf.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)]
      .map((m) => [Number(m[1]), Number(m[2])]);
    return { pages: boxes.length, first: boxes[0] || null };
  };
  const calPdf = await pdfBox();
  await closeAll();
  await toClass();
  await openGrades();
  const gradesPdf = await pdfBox();
  await closeAll();
  if (calPdf.error || gradesPdf.error) {
    skip('WO-8.4 · Chromium prints the month on a landscape page and the grade sheet on a portrait '
      + 'one', 'Page.printToPDF is not available in this browser: ' + (calPdf.error || gradesPdf.error));
  } else {
    /* AND HOW MANY PAGES THE GRADE SHEET TAKES: two, for two slices. Before WO-8.4 it was three —
       the first slice broke too, leaving page one with a head and a label on it and nothing else. */
    check('WO-8.4 · Chromium prints the month on ONE landscape page, and the two-slice grade sheet on '
      + 'TWO portrait pages — header and first slice on page one, the forced second slice on page two '
      + '— read off the PDF its own print pipeline produces',
      !!calPdf.first && calPdf.first[0] > calPdf.first[1] && calPdf.pages === 1
        && !!gradesPdf.first && gradesPdf.first[0] < gradesPdf.first[1] && gradesPdf.pages === 2,
      'calendar: ' + JSON.stringify(calPdf) + '; grade sheet: ' + JSON.stringify(gradesPdf));
  }
}

/* ── ruling 6: the belt — a Ctrl+P from a screen that is not a print surface, no gate at all ── */
{
  await closeAll();
  await toClass();
  await evalJs('window.planbook.roster.openRoster(); 1');
  await new Promise(r => setTimeout(r, 250));
  const readBelt = async (sel) => {
    const screen = await evalJs(`(function(){ var e = document.querySelector(${JSON.stringify(sel)});
      return e ? Math.round(e.getBoundingClientRect().height) : -1; })()`);
    await evalJs("window.dispatchEvent(new Event('beforeprint')); 1");
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 150));
    const paper = await evalJs(`(function(){ var e = document.querySelector(${JSON.stringify(sel)});
      var hdr = document.getElementById('printHeader');
      return { h: e ? Math.round(e.getBoundingClientRect().height) : -1,
        display: e ? getComputedStyle(e).display : '(absent)',
        header: hdr ? Math.round(hdr.getBoundingClientRect().height) : -1,
        main: Math.round(document.querySelector('main').getBoundingClientRect().height),
        gates: ['data-attendance-print','data-detail-print','data-grades-print','data-calendar-print']
          .filter(function(a){ return document.body.hasAttribute(a); }) }; })()`);
    await send('Emulation.setEmulatedMedia', { media: '' });
    await evalJs("window.dispatchEvent(new Event('afterprint')); 1");
    return { screen: screen, paper: paper };
  };
  const dot = await readBelt('#rosterList .support-dot');
  await closeAll();
  await evalJs(`window.planbook.roster.openStudentEditor('${S1}', null, true); 1`);
  await new Promise(r => setTimeout(r, 250));
  const panel = await readBelt('#studentModal .supports-panel');
  await closeAll();
  await evalJs(`(function(){ var all = document.querySelectorAll('[data-view-home]');
    for (var i = 0; i < all.length; i++) { var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { all[i].click(); return 1; } } return 0; })()`);
  await new Promise(r => setTimeout(r, 300));
  const count = await readBelt('#homeView [data-support-indicator]');
  const ok = (x) => x.screen > 0 && x.paper.h === 0 && x.paper.display === 'none'
    && x.paper.header === 0 && x.paper.gates.length === 0;
  check('WO-8.4 · a Ctrl+P from a screen that is not a print surface, with presentation mode OFF '
    + 'and no gate on <body>: the roster\'s support dot, the student editor\'s open support panel and '
    + 'the home page\'s review count are drawn on screen and have no box on paper, and no empty '
    + 'header band prints either (ruling 6, the belt in src/shell.css)',
    ok(dot) && ok(panel) && ok(count) && count.paper.main > 0,
    'support dot ' + JSON.stringify(dot) + ' · support panel ' + JSON.stringify(panel)
      + ' · review count ' + JSON.stringify(count));
}

/*
  THE FIXTURE COMES BACK OUT, and the presentation-mode preference goes back to what this section
  found — a run that left the mode on would suppress the fixtures of everything after it.
*/
await closeAll();
const gone = await evalJs(`(async function(){
  var s = window.planbook.store, c = window.planbook.classes;
  s.update(function(doc){
    doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}' && x.id !== '${CLS}b'; });
    doc.students = doc.students.filter(function(x){ return String(x.id).indexOf('wo84-') !== 0; });
    doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
    delete doc.scores['a84e']; delete doc.scores['a84q'];
    doc.attendance = doc.attendance.filter(function(r){ return r.classId !== '${CLS}'; });
  });
  window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
  var was = ${JSON.stringify(plant.was || '')};
  if (was) c.selectClass(was);
  c.refreshClassBar();
  await s.flush();
  return JSON.stringify(s.getDoc()).indexOf('wo84-') === -1
    && window.planbook.supports.presentationMode() === ${plant.mode ? 'true' : 'false'}; })()`);
check('WO-8.4 · the fixture is out of the document and presentation mode is back where this section '
  + 'found it', gone === true, 'clean = ' + gone);
}
