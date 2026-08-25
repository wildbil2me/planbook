/* attendance-history.mjs — attendance history, print and CSV (WO-2.6)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot } = h;

/* ───────── attendance history, print and CSV (WO-2.6) ─────────
 *
 * Two read-back surfaces over one ledger, and the acceptance lines that matter here are two claims
 * about AGREEMENT and one about an ABSENCE. Neither shape is settled by looking at a screen once.
 *
 * THE FIXTURE IS BUILT SO THAT A SECOND OPINION CANNOT SURVIVE IT. Inside the open term there are
 * six recorded meetings, and beside them two records that must NOT appear anywhere: one carrying an
 * `exception` (the class did not meet) and one outside the term's dates. Both are the shape a
 * hand-rolled filter gets wrong, and both are the reason acceptance line 1 is written as "the two
 * agree" rather than "the numbers are right" — a history built from its own walk over
 * doc.attendance would list eight rows over a percentage computed from six and nothing on screen
 * would look broken. The dates are written down in this file and compared as a list, not counted.
 *
 * THE PLANTED STUDENT WEARS ONE OF EVERY MARK, plus a `U`. The `U` is the interesting one: it is
 * scaffolding rather than a sixth code, it counts as an absence in the denominator AND the
 * numerator, and src/attendance.js's header promises it never appears in a total or in a report.
 * So the check asserts that row reads "Absent" and that the letter U is nowhere in the dialog.
 *
 * ACCEPTANCE LINE 4 IS ASSERTED IN BOTH PRESENTATION MODES, AND THE FIXTURE IS THE POINT. Support
 * data is planted on the student first — a plan, a case manager, an accommodation, a medical line
 * and a behavior plan, each carrying a sentinel string — and its presence in the serialised
 * document is asserted before either surface is read. Then the history, the record and the CSV TEXT
 * are searched for all five sentinels with the mode OFF (support data visible everywhere in the app)
 * and again with it ON. A build that gated these surfaces on the toggle would pass the second pass
 * and fail the first, which is exactly the implementation the work order's brief warns against:
 * "presentation-mode safe" does not mean "hidden while the toggle is on".
 *
 * THE CSV IS READ AS TEXT THROUGH THE SEAM, never from a downloaded file. recordCsv() takes a record
 * and returns bytes with no DOM in it — src/backup.js's own build-it/hand-it-over split — so the BOM,
 * the CRLF endings, the column order and the quoting of a surname holding a comma AND a quote are
 * each asserted character by character. A student called O"Brien, Jr is in the fixture for that one
 * clause alone: a naive join(',') writes a row with two extra columns in it, and every other check
 * in this section passes over the top of it.
 *
 * WHAT THIS SECTION CANNOT DO, AND DOES NOT PRETEND TO. No emulator has a sheet of paper, so "the
 * print view fits a class on a page" stays owed to a human with a printer. What is measured instead
 * is the two halves of it a laptop can see: the header carries the class, the term and the date
 * range, and a term of thirty meetings is laid out in TWO slices rather than one table nobody could
 * print.
 *
 * IT DID NOT CALL printRecord() AT ALL UNTIL WO-2.25, and that sentence used to stand here as a
 * limitation of the harness: window.print() blocks in a headless browser. WO-3.7 answered it by
 * stubbing window.print, and this section does the same now — because the one thing that was
 * measured about the gate, that <body> carries no print attribute AT REST, was green on every run
 * over a surface that printed the whole app on the second tap of a sitting. The five readings at
 * the foot of this section are the ones that can see that; the at-rest one stays, because it is
 * what keeps a Ctrl+P made anywhere else in the app from printing a blank sheet.
 */
console.log('\n--- attendance history, print and CSV (WO-2.6) ---');
{
  const CLS = 'c_wo26';
  const TERM_A = 'tm_wo26a', TERM_B = 'tm_wo26b';
  const LABEL_A = 'WO-2.6 Term', LABEL_B = 'WO-2.6 Long';
  /* The six meetings inside term A, in the order they happened. Written down here rather than read
     back from the app: a check that asked the registry which dates it had counted would agree with
     any build, including the one that counted the dropped day. */
  const MET = ['2026-02-02', '2026-02-03', '2026-02-05', '2026-02-06', '2026-02-09', '2026-02-10'];
  const DROPPED = '2026-02-04';      // a record with an exception — inside the window, not a meeting
  const OUTSIDE = '2026-03-02';      // a real meeting, outside the term's dates
  /* One of every mark on the planted student, in date order, with a U among them: A, T, U, (none),
     E, D → P1 T1 A2 E1 D1 over six meetings, four of them attended. 4/6 is 66.67%, which the app
     prints as 67% and which is deliberately not a round number. */
  const S1_MARKS = { '2026-02-02': 'A', '2026-02-03': 'T', '2026-02-05': 'U', '2026-02-09': 'E',
    '2026-02-10': 'D', '2026-03-02': 'A' };
  const S1_PCT = '67%';
  const SENTINELS = ['WO26 CASEMANAGER SENTINEL', 'WO26 ACCOMMODATION SENTINEL',
    'WO26 MEDICAL SENTINEL', 'WO26 BEHAVIOR SENTINEL', '2026-05-05'];

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
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    /* Parked on the window rather than carried back through CDP, the way the WO-2.17 plant does it:
       the teardown has to put the SAME object graph back. NO BACKTICKS IN THIS COMMENT. */
    window.__wo26 = { doc: JSON.stringify(d), classId: c.getSelectedClassId(),
      mode: window.planbook.supports.presentationMode() };
    var marks = ${JSON.stringify(S1_MARKS)};
    var met = ${JSON.stringify(MET)};
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      doc.students.push(
        { id:'wo26-s1', first:'Sam', last:'Probe', supports: {
            plan:'IEP',
            caseManager:{ name:'WO26 CASEMANAGER SENTINEL', email:'wo26@example.test' },
            reviewDate:'2026-05-05',
            accommodations:[{ kind:'extended-time', detail:'WO26 ACCOMMODATION SENTINEL',
              appliesTo:[] }],
            medical:'WO26 MEDICAL SENTINEL', behaviorPlan:'WO26 BEHAVIOR SENTINEL' } },
        { id:'wo26-s2', first:'Ida', last:'Quiet' },
        /* A surname holding a comma AND a double quote, which is the CSV quoting rule's whole
           fixture. It is a real shape: hyphens, apostrophes and suffixes all arrive pasted out of
           an SIS, and a name is never sanitised on the way in. */
        { id:'wo26-s3', first:'Ned', last:'O"Brien, Jr' });
      doc.classes.push({ id:'${CLS}', name:'WO-2.6 Record', archived:false,
        roster:['wo26-s1','wo26-s2','wo26-s3'], categories:[],
        terms:[{ id:'${TERM_A}', label:'${LABEL_A}', start:'2026-02-02', end:'2026-02-13' },
               { id:'${TERM_B}', label:'${LABEL_B}', start:'2026-04-01', end:'2026-04-30' }] });
      var put = function(date, exception){
        var rec = { classId:'${CLS}', date: date, marks: {} };
        if (exception) rec.exception = exception;
        if (marks[date]) rec.marks['wo26-s1'] = { code: marks[date] };
        if (date === '2026-02-02') rec.marks['wo26-s3'] = { code:'A' };
        doc.attendance.push(rec);
      };
      met.forEach(function(date){ put(date, ''); });
      put('${DROPPED}', 'dropped');
      put('${OUTSIDE}', '');
      /* Thirty meetings in term B, which is what makes the printed record more than one page. */
      for (var i = 1; i <= 30; i++) {
        var day = (i < 10 ? '0' : '') + i;
        doc.attendance.push({ classId:'${CLS}', date:'2026-04-' + day, marks:{} });
      }
    });
    a.setSearch(''); a.setFilter('all');
    c.selectClass('${CLS}');
    c.selectTerm('${TERM_A}');
    a.renderAttendance();
    return { ok:true, doc: JSON.stringify(s.getDoc()),
      visible: window.planbook.supports.supportsVisible() };
  })()`);

  if (!plant.ok) {
    check('the WO-2.6 fixture is real: a class with two dated terms, three students and eight records inside the first window',
      false, plant.why);
  } else {
    /* THE FIXTURE, ASSERTED BEFORE ANYTHING IS READ. Three things at once: the registry is up on the
       planted class over the six-meeting term, the two records that must not count are in the
       document, and the support block really is on the student — an absence check over a student
       who has nothing on file proves nothing at all. */
    const ready = await evalJs(`(function(){
      var rows = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceBody tr[data-attendance-row]'));
      return {
        up: !document.getElementById('classView').classList.contains('hidden'),
        rows: rows.map(function(r){ return r.getAttribute('data-attendance-row'); }),
        totals: (document.getElementById('attendanceTotals') || {}).textContent || '',
        rowLine: (function(){
          var r = document.querySelector('[data-attendance-row="wo26-s1"] .attendance-student-totals');
          return r ? r.textContent : ''; })(),
        doors: document.querySelectorAll('#attendanceBody [data-attendance-history]').length,
        record: !!document.querySelector('#classView [data-attendance-record]') }; })()`);
    const planted = SENTINELS.every((s) => plant.doc.indexOf(s) !== -1)
      && plant.doc.indexOf('"plan":"IEP"') !== -1;
    check('the WO-2.6 fixture is real: three students on a six-meeting term, a dropped day and an out-of-term day beside it, and a support block on the planted student',
      ready.up && ready.rows.length === 3 && ready.doors === 3 && ready.record
        && ready.totals === LABEL_A + ': 6 recorded meetings · Year: 37 recorded meetings'
        && planted && plant.visible === true,
      'rows ' + JSON.stringify(ready.rows) + ', name doors ' + ready.doors + ', totals '
        + JSON.stringify(ready.totals) + ', every support sentinel is in the document = ' + planted
        + ', support data is visible in this mode = ' + plant.visible);

    /* ── the history, opened the way a teacher opens it: by tapping the name ── */
    await clickSel('[data-attendance-history="wo26-s1"]');
    const READ_HISTORY = `(function(){
      var m = document.getElementById('attendanceHistoryModal');
      if (!m || m.classList.contains('hidden')) return { up:false, text:'' };
      var days = Array.prototype.slice.call(m.querySelectorAll('tbody tr'))
        .filter(function(tr){ return !!tr.querySelector('.attendance-report-date'); });
      return {
        up: true,
        openDialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
          .filter(function(o){ return !o.classList.contains('hidden'); })
          .map(function(o){ return o.id; }),
        name: (m.querySelector('.attendance-report-name') || {}).textContent || '',
        sub: (m.querySelector('.attendance-report-sub') || {}).textContent || '',
        rate: (m.querySelector('.attendance-report-rate') || {}).textContent || '',
        dates: days.map(function(tr){
          return (tr.querySelector('.attendance-report-date') || {}).textContent || ''; }),
        marks: days.map(function(tr){
          return (tr.querySelector('.attendance-report-mark') || {}).textContent || ''; }),
        running: days.map(function(tr){
          var tds = tr.querySelectorAll('td');
          return (tds[tds.length - 1] || {}).textContent || ''; }),
        text: m.textContent || '' }; })()`;
    const hist = await evalJs(READ_HISTORY);
    /* The app's own words for the six dates, so the comparison is against a list of DATES and not
       against a count. plainDate() is the formatter both surfaces use. */
    const said = await evalJs('(' + JSON.stringify(MET)
      + ').map(function(d){ return window.planbook.attendance.plainDate(d); })');
    const saidDropped = await evalJs(
      'window.planbook.attendance.plainDate(' + JSON.stringify(DROPPED) + ')');
    const saidOutside = await evalJs(
      'window.planbook.attendance.plainDate(' + JSON.stringify(OUTSIDE) + ')');

    check('a student\'s own name in the grid opens their history, and it opens nothing else',
      hist.up && hist.openDialogs.length === 1
        && hist.openDialogs[0] === 'attendanceHistoryModal'
        && hist.name === 'Sam Probe',
      'dialogs open = ' + JSON.stringify(hist.openDialogs) + ', named '
        + JSON.stringify(hist.name) + ' :: ' + JSON.stringify(hist.sub));

    /* ACCEPTANCE LINE 1, and it is asserted as a list rather than as a number: these six dates in
       this order, with the day that did not meet and the day outside the term absent from it. */
    check('the history lists exactly the meetings that count — the six recorded ones, oldest first, with the dropped day and the out-of-term day absent',
      JSON.stringify(hist.dates) === JSON.stringify(said)
        && hist.dates.indexOf(saidDropped) === -1
        && hist.dates.indexOf(saidOutside) === -1,
      hist.dates.length + ' row(s): ' + JSON.stringify(hist.dates) + ' — expected '
        + JSON.stringify(said) + '; the dropped day ' + JSON.stringify(saidDropped)
        + ' and the out-of-term day ' + JSON.stringify(saidOutside) + ' are absent = '
        + (hist.dates.indexOf(saidDropped) === -1 && hist.dates.indexOf(saidOutside) === -1));

    /* AND THE OTHER HALF OF THE SAME LINE: the two agree. The last row's running percentage, the
       badge at the top of the dialog and the line under the student's name on the registry behind it
       are three renderings of one number, and the fraction beside the first one has the row count as
       its denominator. */
    const last = hist.running[hist.running.length - 1] || '';
    check('and the running percentage on the last row is the percentage the registry prints for that student, over a denominator that is the number of rows',
      last === '4 of 6 · ' + S1_PCT && hist.rate === S1_PCT
        && hist.dates.length === 6
        && ready.rowLine === LABEL_A + ' · P 1 · T 1 · A 2 · E 1 · D 1 · ' + S1_PCT,
      'last row ' + JSON.stringify(last) + ', badge ' + JSON.stringify(hist.rate)
        + ', the registry row behind it ' + JSON.stringify(ready.rowLine));

    /* THE `U` FOLD. It is an absence in the arithmetic and it is not a code a teacher has ever seen
       in a report — src/attendance.js's header promises both. The mark column is read for the day
       the U was planted on, and the whole dialog is searched for the letter as a chip. */
    const uRow = hist.dates.indexOf(await evalJs(
      'window.planbook.attendance.plainDate("2026-02-05")'));
    check('a student nobody had confirmed reads as Absent in the history and never as U, which is what it counts as',
      uRow !== -1 && hist.marks[uRow] === 'Absent'
        && hist.marks.indexOf('U') === -1
        && JSON.stringify(hist.marks) === JSON.stringify(
          ['Absent', 'Tardy', 'Absent', 'Present', 'Event', 'Dismissed']),
      'the unconfirmed day is row ' + uRow + ' and reads ' + JSON.stringify(hist.marks[uRow])
        + '; the six marks are ' + JSON.stringify(hist.marks));

    /* ── the record, and the CSV ── */
    await evalJs("window.planbook.closeModal('attendanceHistoryModal'); 1");
    await clickSel('#classView [data-attendance-record]');
    const READ_RECORD = `(function(){
      var m = document.getElementById('attendanceRecordModal');
      if (!m || m.classList.contains('hidden')) return { up:false, text:'' };
      var slices = Array.prototype.slice.call(m.querySelectorAll('.attendance-report-slice'));
      var summary = m.querySelector('table:not(.attendance-report-grid)');
      return {
        up: true,
        name: (m.querySelector('.attendance-report-name') || {}).textContent || '',
        subs: Array.prototype.slice.call(m.querySelectorAll('.attendance-report-sub'))
          .map(function(e){ return e.textContent; }),
        students: summary
          ? Array.prototype.slice.call(summary.querySelectorAll('tbody tr'))
            .map(function(tr){ return (tr.querySelector('th') || {}).textContent || ''; })
          : [],
        rates: summary
          ? Array.prototype.slice.call(summary.querySelectorAll('tbody tr'))
            .map(function(tr){ var t = tr.querySelectorAll('td');
              return (t[t.length - 1] || {}).textContent || ''; })
          : [],
        slices: slices.length,
        columns: slices.map(function(s){
          return s.querySelectorAll('thead th').length - 1; }),
        printAttr: document.body.hasAttribute('data-attendance-print'),
        text: m.textContent || '' }; })()`;
    const rec = await evalJs(READ_RECORD);

    /* ACCEPTANCE LINE 3, the half a laptop can see: the header carries the class, the term and the
       date range, and the count of meetings beside them — because everything in this app counts
       recorded meetings and never calendar days, so the range is a label and the count is the
       denominator. */
    check('the record\'s header carries the class, the term, the date range and the number of recorded meetings — the four things a printout still needs when it has left the building',
      rec.up && rec.name === 'WO-2.6 Record'
        && (rec.subs[0] || '').indexOf(LABEL_A) === 0
        && (rec.subs[0] || '').indexOf('February 2, 2026 – February 13, 2026') !== -1
        && (rec.subs[0] || '').indexOf('6 recorded meetings') !== -1
        && (rec.subs[1] || '').indexOf('Printed ') === 0,
      JSON.stringify(rec.name) + ' :: ' + JSON.stringify(rec.subs));
    check('and one row per student in the class, in the order the grid draws them, each with the percentage its own history ends on',
      JSON.stringify(rec.students) === JSON.stringify(['O"Brien, Jr, Ned', 'Probe, Sam', 'Quiet, Ida'])
        && JSON.stringify(rec.rates) === JSON.stringify(['83%', S1_PCT, '100%']),
      JSON.stringify(rec.students) + ' :: ' + JSON.stringify(rec.rates));

    /* THE PRINT GATE. Nothing here calls window.print(); what is asserted is that the attribute the
       @media print block keys on is NOT on <body> at rest, which is the whole reason a Ctrl+P made
       on any other screen still prints the page rather than a blank sheet.

       SINCE WO-2.26 THESE CLASS NAMES ARE PRINTED BY TWO SURFACES, and the reading has to know it or
       it fails on a build that is behaving. src/pass-history.js renders the same
       `.attendance-report-table` into a card on WO-3.7's Student Report screen — one builder, so the
       dialog and the card cannot drift — and src/attendance.css therefore carries a second arm of
       print rules for it, selected under `data-detail-print` rather than under this surface's
       attribute. That is the rule "a stylesheet does not style another sheet's class names" being
       obeyed, not a gate going missing: the rules are where the classes are, gated on the surface
       they draw for.

       SO THE CLAIM IS SHARPENED RATHER THAN LOOSENED. Every rule is still gated on SOMETHING — an
       ungated one is still a failure, and it is still the failure that prints a record dialog onto a
       Ctrl+P from anywhere else — and the borrowed arm is COUNTED, so a build that lost WO-2.26's
       print rules goes red here too instead of quietly reading as a tidier stylesheet. */
    const printRules = await evalJs(`(function(){
      var seen = 0, gated = 0, borrowed = 0, ungated = 0, selectors = [];
      window.__eachRule(function(rule, sel){
        if (String(sel).indexOf('attendance-report') === -1
          && String(sel).indexOf('attendanceRecordModal') === -1) return;
        var media = '';
        for (var p = rule.parentRule; p; p = p.parentRule) {
          if (p.media && String(p.media.mediaText).indexOf('print') !== -1) media = 'print'; }
        if (media !== 'print') return;
        seen++;
        if (String(sel).indexOf('data-attendance-print') !== -1) { gated++; }
        else if (String(sel).indexOf('data-detail-print') !== -1) { borrowed++; }
        else { ungated++; selectors.push(sel); }
      });
      return { seen: seen, gated: gated, borrowed: borrowed, ungated: ungated,
               selectors: selectors.slice(0, 4) }; })()`);
    check('the print rules exist and every one of them is gated on the attribute of the surface it draws for — this dialog\'s, or the Student Report card that borrows these class names — and nothing carries this one at rest',
      printRules.seen >= 10 && printRules.ungated === 0 && printRules.gated >= 10
        && printRules.borrowed > 0 && rec.printAttr === false,
      printRules.seen + ' print rule(s) touching these class names, ' + printRules.gated
        + ' gated on data-attendance-print and ' + printRules.borrowed
        + ' on data-detail-print for WO-2.26\'s card, ' + printRules.ungated + ' ungated '
        + JSON.stringify(printRules.selectors) + '; <body> carries the attribute at rest = '
        + rec.printAttr);

    /* THE SLICING, which is the answer to "what happens when the meetings outrun the page". Six
       meetings are one slice with no page break in it; thirty are two. Asserted on both terms
       through the real term nav, because the count is a fact about the term and not about the
       dialog. */
    check('a term that fits is drawn as one table, with one column per recorded meeting',
      rec.slices === 1 && JSON.stringify(rec.columns) === JSON.stringify([6]),
      rec.slices + ' slice(s), ' + JSON.stringify(rec.columns) + ' date column(s) in each');

    await evalJs("window.planbook.closeModal('attendanceRecordModal'); 1");
    await clickSel('#termNav [data-term-select="' + TERM_B + '"]');
    await clickSel('#classView [data-attendance-record]');
    const long = await evalJs(READ_RECORD);
    check('and a term of thirty meetings is cut into pages of twenty-four columns rather than into one table nobody could print',
      long.up && long.slices === 2
        && JSON.stringify(long.columns) === JSON.stringify([24, 6])
        && (long.subs[0] || '').indexOf('30 recorded meetings') !== -1,
      long.slices + ' slice(s), ' + JSON.stringify(long.columns) + ' date column(s) in each :: '
        + JSON.stringify(long.subs[0]));

    /* ── the CSV, as text ── */
    await evalJs("window.planbook.closeModal('attendanceRecordModal'); 1");
    await clickSel('#termNav [data-term-select="' + TERM_A + '"]');
    const csv = await evalJs(`(function(){
      var r = window.planbook.attendance.classRecord();
      var f = window.planbook.attendanceReport.recordCsv(r);
      return { name: f.name, text: f.text, lines: f.text.split('\\r\\n'),
        bom: f.text.charCodeAt(0) === 0xFEFF, lf: /[^\\r]\\n/.test(f.text) }; })()`);
    const head = (csv.lines[0] || '').replace(/^﻿/, '');
    const cols = (line) => {
      /* A CSV reader, deliberately naive except about quotes — which is the one thing being
         asserted. Anything cleverer would be a parser that forgave the defect. */
      const out = [];
      let cur = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) {
          if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (ch === '"') q = false;
          else cur += ch;
        } else if (ch === '"') q = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
      }
      out.push(cur);
      return out;
    };
    const headCols = cols(head);
    check('the CSV opens as a spreadsheet expects: a BOM so Excel reads it as UTF-8, CRLF endings, and Roll Call!\'s own column order',
      csv.bom && !csv.lf
        && JSON.stringify(headCols.slice(0, 9)) === JSON.stringify(['Last Name', 'First Name',
          'Present', 'Tardy', 'Absent', 'Event', 'Dismissed', 'Meetings', 'Att %']),
      'BOM = ' + csv.bom + ', a bare LF anywhere = ' + csv.lf + ', header '
        + JSON.stringify(headCols.slice(0, 9)));
    check('and the dates are the columns after it, in ISO, oldest first, and exactly the meetings that were counted',
      JSON.stringify(headCols.slice(9)) === JSON.stringify(MET),
      JSON.stringify(headCols.slice(9)) + ' — expected ' + JSON.stringify(MET));

    const rows = csv.lines.filter((l) => l.length).slice(1).map(cols);
    const s1Row = rows.filter((r) => r[0] === 'Probe')[0] || [];
    check('every row is one student, every row is the same width as the header, and the planted student\'s row is their marks in date order beside the counts they add up to',
      rows.length === 3 && rows.every((r) => r.length === headCols.length)
        && JSON.stringify(s1Row) === JSON.stringify(['Probe', 'Sam', '1', '1', '2', '1', '1', '6',
          S1_PCT, 'A', 'T', 'A', 'P', 'E', 'D']),
      rows.length + ' row(s), widths ' + JSON.stringify(rows.map((r) => r.length))
        + ' against a header of ' + headCols.length + ' :: ' + JSON.stringify(s1Row));
    /* THE QUOTING, and the fixture is the check. A surname holding a comma and a quote is what a
       join(',') turns into two extra columns, silently, in a file the teacher opens weeks later. */
    const s3Row = rows.filter((r) => r[1] === 'Ned')[0] || [];
    check('a surname holding a comma and a double quote survives as one cell rather than becoming two columns',
      s3Row[0] === 'O"Brien, Jr' && s3Row.length === headCols.length
        && csv.lines[1].indexOf('"O""Brien, Jr",Ned,') === 0,
      'first cell ' + JSON.stringify(s3Row[0]) + ' in a row of ' + s3Row.length
        + '; the raw line begins ' + JSON.stringify((csv.lines[1] || '').slice(0, 40)));
    check('and the file is named for the class and the term it holds, in the same family as the backup files',
      csv.name.indexOf('Planbook WO-2.6 Record ' + LABEL_A + ' attendance ') === 0
        && /\.csv$/.test(csv.name),
      JSON.stringify(csv.name));

    /*
      ── THE PRINT GATE, THROUGH THE REAL 🖨 Print BUTTON (WO-2.25) ──

      This section could not call printRecord() when it was written — the paragraph at the head of it
      said so, and said why: window.print() blocks in a headless browser. WO-3.7 answered that by
      stubbing window.print, and the stub is what makes this stronger rather than weaker, because the
      reading is taken AT THE MOMENT THE APP ASKS TO PRINT rather than after it.

      FIVE READINGS, THE SAME FIVE THE GRADE SHEET MAKES, and they are here because the timer this
      surface shipped with had exactly one check watching it: "<body> carries no print attribute at
      rest", which was green throughout and could not see the bug. The gate is ON at print time and
      carries THIS surface's attribute and neither of the other two; it is still on while the record
      is up, however long the teacher looks at the preview; a `beforeprint` the app never asked for
      re-arms it, which is the print Chrome refused and the teacher then allowed; `afterprint` clears
      it; and a `beforeprint` raised while the record is NOT up clears it, which is the guarantee the
      deleted timer used to give.

      Clicked from the page with element.click() rather than by dispatching a mouse event at computed
      coordinates — WO-3.7's note, obeyed rather than rediscovered: this is a click made while
      Emulation.setEmulatedMedia holds the page in `print`, where viewport coordinates land somewhere
      else and the symptom is "window.print() was never called", which reads as a Print button that
      does nothing.
    */
    await clickSel('#classView [data-attendance-record]');
    await new Promise(r => setTimeout(r, 200));
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 120));
    /* THE STUB REPORTS THAT IT TOOK, which is the guard against the failure that looks exactly like
       an app defect: if window.print were not writable the snapshot would simply never be taken, and
       the check would read as a Print button that does not reach the module. */
    const printStubbed = await evalJs(`(function(){
      window.__realPrint = window.print;
      window.__wo225called = 0;
      window.print = function(){
        window.__wo225called++;
        try {
          /* HEIGHTS RATHER THAN DISPLAY, for the reason WO-3.7's snapshot gives: the computed
             display of an element inside a display:none ancestor is its OWN value, not none. What a
             hidden surface does not have is a BOX. NO BACKTICKS IN THIS COMMENT: it is inside a
             template literal. */
          var box = function(sel){ var e = document.querySelector(sel);
            return e ? Math.round(e.getBoundingClientRect().height) : -1; };
          window.__wo225print = {
            attr: document.body.hasAttribute('data-attendance-print'),
            detailAttr: document.body.hasAttribute('data-detail-print'),
            gradesAttr: document.body.hasAttribute('data-grades-print'),
            recordH: box('#attendanceRecordModal'),
            detailH: box('#detailView'), gradesH: box('#gradesRecordModal'),
            headerH: box('header.header'), mainH: box('main') };
        } catch (err) { window.__wo225printErr = String((err && err.message) || err); }
      };
      return window.print !== window.__realPrint; })()`);
    const printClicked = await evalJs(`(function(){
      var b = document.querySelector('#attendanceRecordModal [data-attendance-record-print]');
      if (!b) return { ok:false, why:'no Print control in the open record dialog' };
      b.click();
      return { ok:true, label: (b.textContent || '').trim(),
        printCalls: window.__wo225called || 0,
        snapshotError: window.__wo225printErr || '' }; })()`);
    const printedSheet = await evalJs('window.__wo225print || null');
    await new Promise(r => setTimeout(r, 700));
    const gateHeldOn = await evalJs("document.body.hasAttribute('data-attendance-print')");
    /* THE PRINT THE BROWSER DELAYED AND THE TEACHER THEN ALLOWED. Not a second tap — the gate is
       cleared by hand first, so that the only thing that can turn it back on is the event the
       browser fires when it finally serialises the page. Under the shipped build this comes back
       false and the whole app prints. */
    const gateRearmed = await evalJs(`(function(){
      document.body.removeAttribute('data-attendance-print');
      window.dispatchEvent(new Event('beforeprint'));
      return document.body.hasAttribute('data-attendance-print'); })()`);
    const gateClearedAfter = await evalJs(`(function(){
      window.dispatchEvent(new Event('afterprint'));
      return document.body.hasAttribute('data-attendance-print'); })()`);
    /* AND THE GUARANTEE THE TIMER EXISTED TO GIVE, which must survive losing the timer: a Ctrl+P
       made anywhere else in the app must not hide the page and print a blank sheet. The dialog is
       hidden and put back exactly as it was, and the last event leaves <body> as the app would. */
    const gateOffWhenRecordIsNotUp = await evalJs(`(function(){
      var m = document.getElementById('attendanceRecordModal');
      var wasHidden = m.classList.contains('hidden');
      m.classList.add('hidden');
      window.dispatchEvent(new Event('beforeprint'));
      var gated = document.body.hasAttribute('data-attendance-print');
      if (!wasHidden) m.classList.remove('hidden');
      window.dispatchEvent(new Event('afterprint'));
      return gated; })()`);
    await evalJs('window.print = window.__realPrint; delete window.__realPrint;'
      + ' delete window.__wo225print; delete window.__wo225printErr; delete window.__wo225called; 1');
    await send('Emulation.setEmulatedMedia', { media: '' });

    check('one tap on 🖨 Print calls window.print() exactly once — a second call from one gesture is '
      + 'what Chrome\'s auto-print block is for, so this is the reading that says the block is not '
      + 'ours to fix',
      printClicked && printClicked.ok && printClicked.printCalls === 1,
      'window.print() calls from a single tap = '
        + (printClicked && printClicked.ok ? printClicked.printCalls
          : JSON.stringify(printClicked)));
    check('at the moment the app asks to print, <body> carries this surface\'s own attribute and '
      + 'neither of the other two, and the record is the only one of the three surfaces with a box '
      + 'on the page',
      !!printedSheet && printedSheet.attr === true
        && printedSheet.detailAttr === false && printedSheet.gradesAttr === false
        && printedSheet.recordH > 0 && printedSheet.detailH === 0 && printedSheet.gradesH === 0
        && printedSheet.headerH === 0 && printedSheet.mainH === 0,
      printedSheet
        ? JSON.stringify(printedSheet)
        : 'no snapshot :: the stub took = ' + printStubbed + ', the control was clicked = '
          + JSON.stringify(printClicked));
    check('and the gate is still on while the record is on screen — a print the browser DELAYS is '
      + 'still this record when it finally happens, not a timer\'s idea of how long that takes',
      gateHeldOn === true, '<body> carries data-attendance-print 700ms after the tap = '
        + gateHeldOn);
    check('a print the browser refused and the teacher then allowed re-gates itself: `beforeprint` '
      + 'with the record up puts the attribute back (the 2026-08-12 bug, in one reading)',
      gateRearmed === true,
      'beforeprint with the record on screen left data-attendance-print on = ' + gateRearmed);
    check('and `afterprint` clears it, so <body> outside a print carries nothing',
      gateClearedAfter === false,
      '<body> still carries data-attendance-print after afterprint = ' + gateClearedAfter);
    check('and a Ctrl+P made when the record is NOT up clears the gate rather than printing a blank '
      + 'page — the guarantee the timer used to give, kept without it',
      gateOffWhenRecordIsNotUp === false,
      'beforeprint with the record closed left data-attendance-print on = '
        + gateOffWhenRecordIsNotUp);

    /*
      ACCEPTANCE LINE 4, IN BOTH MODES. The support block is on this student, it is in the document,
      and this app shows it on the roster — none of it may reach either of these surfaces or the
      file, whatever the presentation toggle says. The mode is driven through the module the header
      control drives, and both passes read the history, the record and the CSV text.
    */
    const sweep = async (mode) => {
      await evalJs('window.planbook.supports.setPresentationMode(' + (mode ? 'true' : 'false') + ');1');
      await evalJs("window.planbook.closeModal('attendanceRecordModal'); 1");
      await clickSel('[data-attendance-history="wo26-s1"]');
      const h = await evalJs(READ_HISTORY);
      await evalJs("window.planbook.closeModal('attendanceHistoryModal'); 1");
      await clickSel('#classView [data-attendance-record]');
      const r = await evalJs(READ_RECORD);
      const text = await evalJs(`(function(){
        var rc = window.planbook.attendance.classRecord();
        return window.planbook.attendanceReport.recordCsv(rc).text
          + ' ' + JSON.stringify(rc); })()`);
      await evalJs("window.planbook.closeModal('attendanceRecordModal'); 1");
      return { visible: await evalJs('window.planbook.supports.supportsVisible()'),
        history: h.text, record: r.text, csv: text };
    };
    for (const mode of [false, true]) {
      const out = await sweep(mode);
      const found = SENTINELS.filter((s) => out.history.indexOf(s) !== -1
        || out.record.indexOf(s) !== -1 || out.csv.indexOf(s) !== -1);
      /* `IEP` is asked of the three surfaces separately from the sentinels, because it is the one
         value a reader would expect to find abbreviated somewhere harmless — and it is not here. */
      const plan = out.history.indexOf('IEP') !== -1 || out.record.indexOf('IEP') !== -1
        || out.csv.indexOf('IEP') !== -1;
      check('neither surface nor the CSV carries accommodation, medical or plan data — with support '
        + 'data ' + (mode ? 'SUPPRESSED by presentation mode' : 'VISIBLE everywhere else in the app'),
        found.length === 0 && !plan && out.visible === !mode
          && out.history.length > 200 && out.record.length > 200 && out.csv.length > 200,
        'supportsVisible() = ' + out.visible + '; sentinels found = ' + JSON.stringify(found)
          + ', the word IEP found = ' + plan + '; the three surfaces measured '
          + out.history.length + ', ' + out.record.length + ' and ' + out.csv.length
          + ' characters, so none of them was empty');
    }

    /*
      The document back as it was, IN PLACE rather than as a fresh object — every module holds the
      reference getDoc() handed it — with the class that was open put back under it and the
      presentation mode returned to whatever this browser had. A run that left the mode on would
      suppress the fixtures of anything added after this block.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var saved = window.__wo26, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      window.planbook.supports.setPresentationMode(saved.mode);
      if (saved.classId) c.selectClass(saved.classId);
      c.refreshClassBar();
      delete window.__wo26;
      await s.flush();
      return 1; })()`);
  }
}
}
