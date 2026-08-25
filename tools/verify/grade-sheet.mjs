/* grade-sheet.mjs — the class's grade sheet, printed and exported (WO-3.9)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam } = h;

/* ───────── the class's grade sheet, printed and exported (WO-3.9) ─────────
 *
 * The sheet the SIS is typed off. Four acceptance lines, and the first of them cannot be closed
 * here at all — "the print order matches the SIS entry screen" is a re-key against a live system
 * nobody in this process can reach. What a desk CAN say is that the build is the order the owner
 * recorded on 2026-08-12, and that is what this section asserts, item by item: student-major, rows
 * alphabetical by LAST NAME as `Last, First`, columns by DUE DATE, no student-id column.
 *
 * THE FIXTURE IS BUILT TO FAIL A BUILD THAT GOT THE ORDER RIGHT BY ACCIDENT.
 *
 *   THE ROSTER IS STORED IN AN ORDER THAT IS NEITHER THE ANSWER NOR ITS REVERSE — Zabkowski,
 *   Ñuñez-Öztürk, Ó"Brien — so a sheet that printed the roster as stored, or sorted on first names
 *   (Abe, Ida, Zoë), lands somewhere this check names.
 *
 *   THE DOCUMENT ORDER OF THE ASSIGNMENTS IS NOT THE DUE-DATE ORDER, and two of them are due the
 *   SAME DAY while one has no due date at all. Those are the three cases: sort by date, tie broken
 *   by the order the teacher arranged them in, and undated work last. A build that printed the
 *   assignments as stored — which is what the score grid does, deliberately — fails the first
 *   clause; one that dropped the tie rule fails the second; one that sorted an empty date as the
 *   epoch puts the bonus poster in column one and fails the third.
 *
 * EVERY FIGURE WAS COMPUTED BY HAND AND IS WRITTEN DOWN HERE, so the check compares the screen to
 * arithmetic rather than to itself. The class carries its OWN letter scale — A 90 · B 80 · C 70 ·
 * D 60 — which is both hand-checkable and the branch the printed header has to name as this class's
 * own rather than the year's:
 *
 *   Tests 40 · Quizzes 25 · Homework 20 · Participation 15 (nothing ever filed under it).
 *   Ñuñez-Öztürk  78/100 Tests, 13/20 Quizzes marked LATE, nothing in Homework.
 *                 Homework and Participation are both empty, so the base is 65, not 100:
 *                 (78x40 + 65x25)/65 = 4745/65 = 73.00%, a C.
 *   Ó"Brien       90/100 Tests, Cell Quiz marked MISSING (0 out of its full 20), 9/10 Homework:
 *                 (90x40 + 0x25 + 90x20)/85 = 5400/85 = 63.5294…% -> 63.53%, a D.
 *   Zabkowski     Unit 1 Test EXCUSED, so Tests is empty and redistributes; 20/20 Quizzes; 10/10
 *                 Homework plus 5 on a 0-point bonus, which is 15 earned out of 10 possible:
 *                 (100x25 + 150x20)/45 = 5500/45 = 122.2222…% -> 122.22%, an A. Over 100 on
 *                 purpose — extra credit is a scored zero-point assignment and nothing caps a
 *                 percentage (WO-3.4).
 *
 * SIX OF THE TEN ASSIGNMENTS ARE UNGRADED FOR EVERYBODY, and they are not filler. They put the
 * grid over ASSIGNMENTS_PER_SLICE so the slicing can be measured, they are eighteen blank cells for
 * the deliverable that says a blank stays blank, and — because a blank counts toward nothing — they
 * are what makes the three figures above true of a ten-column sheet as well as of a four-column
 * one. A build that read a blank as a zero fails all three at once.
 *
 * ACCEPTANCE LINE 2 IS ASKED AS AN AGREEMENT AND NOT AS A NUMBER. The sheet's totals are compared
 * to the arithmetic above, to what src/grade-engine.js answers through the seam, AND to what the
 * score grid behind the dialog is drawing for the same three students at the same moment. "Match
 * the app exactly" is a claim about two surfaces, so both are read.
 *
 * ACCEPTANCE LINE 3 IS ASKED CELL FOR CELL. The CSV is parsed, its grid section is reassembled
 * against the DOM's slices, and every column head, every row head and every cell has to be the same
 * string in the same place. That is the only form of "the printout and the file do not disagree"
 * that a machine can hold; whether the file opens in the spreadsheet the owner actually uses stays
 * owed to a human, exactly as it did at WO-2.6 and WO-3.7.
 *
 * ACCEPTANCE LINE 4 IS ASSERTED IN BOTH MODES with the support data planted first and its presence
 * in the serialised document proved before anything is read — an absence check over a student with
 * nothing on file proves nothing, and a build that gated the sheet on the presentation toggle would
 * pass the mode-ON pass and fail the mode-OFF one.
 *
 * AND THE PAGE BOX IS READ AT 740px, which is tools/README.md's trap 10 and WO-3.7's own scar:
 * `setEmulatedMedia: 'print'` changes the media TYPE and relayouts nothing, so a sheet measured at
 * this run's 1280px is a sheet no printer produces. `.modal-panel` is 480px wide, which at a Letter
 * page box would print the whole grade sheet down the left-hand third of the paper.
 */
console.log('\n--- the class\'s grade sheet, printed and exported (WO-3.9) ---');
{
  const CLS = 'c_wo39';
  const TERM = 'tm_wo39';
  const LABEL = 'WO-3.9 Term';
  const S1 = 'wo39-s1', S2 = 'wo39-s2', S3 = 'wo39-s3';
  const S1_ROW = 'Ñuñez-Öztürk, Zoë';
  const S2_ROW = 'Ó"Brien, Jr, Ida';
  const S3_ROW = 'Zabkowski, Abe';
  /* Stored in this order on purpose — neither the answer nor its reverse. */
  const ROSTER = [S3, S1, S2];
  const ROWS = [S1_ROW, S2_ROW, S3_ROW];
  const SENTINELS = ['WO39 CASEMANAGER SENTINEL', 'WO39 ACCOMMODATION SENTINEL',
    'WO39 MEDICAL SENTINEL', 'WO39 BEHAVIOR SENTINEL', '2027-02-11'];
  /* The column order the due dates ask for, written down rather than read back. */
  const COLUMNS = ['Unit 1 Test', 'Cell Quiz', 'Ch 1 Homework', 'Practice 1', 'Practice 2',
    'Practice 3', 'Practice 4', 'Practice 5', 'Practice 6', 'Bonus poster'];
  /* Every cell of the sheet, in that order — the marks half of the deliverable and the blanks. */
  const CELLS = {};
  CELLS[S1_ROW] = ['78', '13 L', '', '', '', '', '', '', '', ''];
  CELLS[S2_ROW] = ['90', 'M', '9', '', '', '', '', '', '', ''];
  CELLS[S3_ROW] = ['Ex', '20', '10', '', '', '', '', '', '', '5'];
  const GRADES = {};
  GRADES[S1_ROW] = { pct: '73.00%', letter: 'C' };
  GRADES[S2_ROW] = { pct: '63.53%', letter: 'D' };
  GRADES[S3_ROW] = { pct: '122.22%', letter: 'A' };

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
    var s = window.planbook.store, c = window.planbook.classes;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    /* Carried back to Node rather than parked on the window, for the reason the WO-3.7 plant gives:
       this section RELOADS the page for its coarse pass and anything on window goes with it, so the
       teardown deletes the fixture by id instead of restoring a snapshot. NO BACKTICKS HERE. */
    var was = c.getSelectedClassId();
    var mode = window.planbook.supports.presentationMode();
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!doc.scores) doc.scores = {};
      doc.students.push(
        { id:'${S1}', first:'Zoë', last:'Ñuñez-Öztürk',
          supports: {
            plan:'IEP',
            caseManager:{ name:'WO39 CASEMANAGER SENTINEL', email:'wo39@example.test' },
            reviewDate:'2027-02-11',
            accommodations:[{ kind:'extended-time', detail:'WO39 ACCOMMODATION SENTINEL',
              appliesTo:[] }],
            medical:'WO39 MEDICAL SENTINEL', behaviorPlan:'WO39 BEHAVIOR SENTINEL' } },
        { id:'${S2}', first:'Ida', last:'Ó"Brien, Jr' },
        { id:'${S3}', first:'Abe', last:'Zabkowski' });
      doc.classes.push({ id:'${CLS}', name:'WO-3.9 Sheet', archived:false,
        roster:${JSON.stringify(ROSTER)},
        /* ITS OWN BANDS, which is the branch the printed header has to name — and four boundaries a
           person can check the three letters against without opening the scale editor. */
        letterScale:[{ letter:'A', min:90 }, { letter:'B', min:80 },
          { letter:'C', min:70 }, { letter:'D', min:60 }],
        terms:[{ id:'${TERM}', label:'${LABEL}', start:'2026-09-01', end:'2026-11-06' }],
        categories:[
          { id:'cat39t', name:'Tests', weight:40 },
          { id:'cat39q', name:'Quizzes', weight:25 },
          { id:'cat39h', name:'Homework', weight:20 },
          { id:'cat39p', name:'Participation', weight:15 }]});
      var add = function(id, cat, name, points, due){
        doc.assignments.push({ id:id, classId:'${CLS}', termId:'${TERM}', categoryId:cat,
          name:name, points:points, assigned:'2026-09-08', due:due });
      };
      /* THE DOCUMENT ORDER, which is deliberately not the due-date order. Ch 1 Homework is stored
         first and prints third; the two due 9/18 print in the order they are stored; the bonus
         poster has no due date and prints last however early it was created. */
      add('a39h1', 'cat39h', 'Ch 1 Homework', 10, '2026-09-25');
      add('a39t1', 'cat39t', 'Unit 1 Test', 100, '2026-09-18');
      add('a39b1', 'cat39h', 'Bonus poster', 0, '');
      add('a39q1', 'cat39q', 'Cell Quiz', 20, '2026-09-18');
      /* Six nobody has graded. They put the grid over one slice, they are eighteen blank cells, and
         a blank counts toward nothing — so every figure above is true of this ten-column sheet. */
      for (var n = 1; n <= 6; n++) {
        add('a39p' + n, 'cat39h', 'Practice ' + n, 25, '2026-10-0' + n);
      }
      doc.scores['a39t1'] = { '${S1}': { v:78 }, '${S2}': { v:90 },
        '${S3}': { v:null, flag:'excused' } };
      doc.scores['a39q1'] = { '${S1}': { v:13, flag:'late' },
        '${S2}': { v:null, flag:'missing' }, '${S3}': { v:20 } };
      doc.scores['a39h1'] = { '${S2}': { v:9 }, '${S3}': { v:10 } };
      doc.scores['a39b1'] = { '${S3}': { v:5 } };
    });
    c.selectClass('${CLS}');
    c.selectTerm('${TERM}');
    window.planbook.attendance.renderAttendance();
    return { ok:true, doc: JSON.stringify(s.getDoc()), was: was, mode: mode,
      visible: window.planbook.supports.supportsVisible(),
      stored: (s.getDoc().classes.filter(function(x){ return x.id === '${CLS}'; })[0] || {}).roster,
      documentOrder: s.getDoc().assignments.filter(function(a){ return a.classId === '${CLS}'; })
        .map(function(a){ return a.name; }) }; })()`);

  if (!plant.ok) {
    check('the WO-3.9 fixture is real: three students and ten assignments over four categories',
      false, plant.why);
  } else {
    const planted = SENTINELS.every((s) => plant.doc.indexOf(s) !== -1)
      && plant.doc.indexOf('"plan":"IEP"') !== -1;
    const outsideAscii = (s) => Array.from(s).some((ch) => ch.charCodeAt(0) > 127);
    check('the WO-3.9 fixture is real: a roster stored out of alphabetical order, assignments '
      + 'stored out of due-date order, a non-ASCII name and a support block on it',
      planted && outsideAscii(S1_ROW) && plant.visible === true
        && JSON.stringify(plant.stored) === JSON.stringify(ROSTER)
        && plant.documentOrder.length === 10
        && JSON.stringify(plant.documentOrder) !== JSON.stringify(COLUMNS)
        && plant.documentOrder[0] === 'Ch 1 Homework',
      'every support sentinel is in the document = ' + planted + ', the roster is stored as '
        + JSON.stringify(plant.stored) + ', the assignments are stored as '
        + JSON.stringify(plant.documentOrder) + ', support data is visible in this mode = '
        + plant.visible);

    /* ── the door: 🖨 Grade sheet, in the score grid's toolbar ── */
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    /* What the SCREEN says these three students' grades are, read before the dialog is opened.
       Acceptance line 2 is an agreement between two surfaces, so this is the other one. */
    const onScreen = await evalJs(`(function(){ var out = {};
      Array.prototype.forEach.call(document.querySelectorAll('#scoresBody tr[data-score-row]'),
        function(tr){
          var num = tr.querySelector('.scores-grade-num');
          var letter = tr.querySelector('.scores-grade-letter');
          var name = tr.querySelector('.scores-name-btn');
          out[name ? name.textContent : tr.getAttribute('data-score-row')] = {
            pct: num ? num.textContent : '', letter: letter ? letter.textContent : '' };
        });
      return out; })()`);
    await clickSel('#scoresView [data-grades-record]');
    await new Promise(r => setTimeout(r, 300));

    const READ = `(function(){
      var m = document.getElementById('gradesRecordModal');
      if (!m) return { up:false };
      var txt = function(sel){ var e = m.querySelector(sel); return e ? e.textContent : ''; };
      var slices = Array.prototype.map.call(m.querySelectorAll('.grades-report-slice'),
        function(sl){
          var head = sl.querySelectorAll('thead th');
          return {
            label: (sl.querySelector('.grades-report-slice-label') || {}).textContent || '',
            first: head.length ? head[0].textContent : '',
            last: head.length ? head[head.length - 1].textContent : '',
            cols: Array.prototype.map.call(sl.querySelectorAll('thead th.grades-report-col'),
              function(th){
                var g = function(cls){ var e = th.querySelector(cls);
                  return e ? e.textContent : ''; };
                return { name: g('.grades-report-col-name'), due: g('.grades-report-col-due'),
                  pts: g('.grades-report-col-pts') }; }),
            rows: Array.prototype.map.call(sl.querySelectorAll('tbody tr'), function(tr){
              return {
                name: (tr.querySelector('.grades-report-row-head') || {}).textContent || '',
                cells: Array.prototype.map.call(tr.querySelectorAll('.grades-report-mark'),
                  function(s){ return s.textContent; }),
                flags: Array.prototype.map.call(tr.querySelectorAll('.grades-report-mark'),
                  function(s){ return s.className.replace('grades-report-mark', '').trim(); }),
                pct: (tr.querySelector('.grades-report-pct') || {}).textContent || '',
                letter: (tr.querySelector('.grades-report-letter') || {}).textContent || '' }; }) };
        });
      return {
        up: !m.classList.contains('hidden'),
        role: (m.querySelector('[role="dialog"]') || {}).getAttribute
          ? m.querySelector('[role="dialog"]').getAttribute('role') : '',
        className: txt('.grades-report-name'),
        subs: Array.prototype.map.call(m.querySelectorAll('.grades-report-sub'),
          function(e){ return e.textContent; }),
        scale: txt('.grades-report-scale'),
        label: txt('.grades-report-label'),
        key: txt('.grades-report-key'),
        note: txt('.grades-report-note'),
        banner: txt('.grade-none'),
        slices: slices,
        text: m.textContent || '' }; })()`;
    const g = await evalJs(READ);
    const cols = g.slices.reduce((all, s) => all.concat(s.cols), []);
    const rowNames = g.slices.length ? g.slices[0].rows.map((r) => r.name) : [];
    const rowCells = {};
    rowNames.forEach((name) => {
      rowCells[name] = g.slices.reduce((all, s) =>
        all.concat((s.rows.filter((r) => r.name === name)[0] || { cells: [] }).cells), []);
    });

    check('the 🖨 Grade sheet door on the score grid opens the sheet as a DIALOG, built from the '
      + 'open document at open time',
      g.up === true && g.role === 'dialog' && g.className === 'WO-3.9 Sheet'
        && g.slices.length > 0 && rowNames.length === 3,
      'open = ' + g.up + ', role ' + JSON.stringify(g.role) + ', header '
        + JSON.stringify(g.className) + ', ' + g.slices.length + ' slice(s), '
        + rowNames.length + ' row(s)');

    /* THE ROW ORDER, which is half of the layout the owner pinned: alphabetical by LAST NAME, drawn
       `Last, First`, and no student-id column anywhere on the sheet. The roster is stored in a third
       order, so this cannot pass by drawing what it was handed. */
    const idish = cols.filter((c) => /^id$/i.test(c.name)).length
      + (/\bstudent id\b/i.test(g.text) ? 1 : 0);
    check('students run down the page alphabetically by LAST NAME, drawn `Last, First`, and there '
      + 'is no student-id column on the sheet',
      JSON.stringify(rowNames) === JSON.stringify(ROWS)
        && JSON.stringify(plant.stored) !== JSON.stringify([S1, S2, S3])
        && idish === 0
        && g.slices.every((s) => s.first === 'Student' && s.last === 'Grade'),
      JSON.stringify(rowNames) + ' from a roster stored as ' + JSON.stringify(plant.stored)
        + '; id-ish columns = ' + idish + '; each slice runs '
        + JSON.stringify(g.slices.map((s) => s.first + ' … ' + s.last)));

    /* THE COLUMN ORDER, and the three cases it is made of — see this section's header. Each head
       carries its due date and its point value, which is the rest of the deliverable. */
    check('assignments run across in DUE-DATE order, with a same-day tie kept in the teacher\'s own '
      + 'order and undated work last — each column carrying its due date and what it is out of',
      JSON.stringify(cols.map((c) => c.name)) === JSON.stringify(COLUMNS)
        && cols[0].due === 'due 9/18' && cols[0].pts === 'out of 100'
        && cols[1].due === 'due 9/18' && cols[1].pts === 'out of 20'
        && cols[2].due === 'due 9/25' && cols[2].pts === 'out of 10'
        && cols[9].name === 'Bonus poster' && cols[9].due === ''
        && cols[9].pts === 'out of 0',
      JSON.stringify(cols.map((c) => c.name + ' [' + (c.due || 'no due date') + ']')));

    /* ACCEPTANCE LINE 2, as three agreements: the sheet against arithmetic done by hand, against
       the engine through the seam, and against what the score grid behind this dialog is drawing
       for the same three students. */
    const engine = await evalJs(`(function(){
      var p = window.planbook, doc = p.store.getDoc();
      var cls = p.classes.getSelectedClass();
      var out = {};
      [['${S1}', ${JSON.stringify(S1_ROW)}], ['${S2}', ${JSON.stringify(S2_ROW)}],
       ['${S3}', ${JSON.stringify(S3_ROW)}]].forEach(function(pair){
        var grade = p.gradeEngine.weightedClassGrade(doc, cls, '${TERM}', pair[0]);
        out[pair[1]] = { pct: grade.percentage, letter: grade.letter };
      });
      return out; })()`);
    const sheetTotals = {};
    g.slices[0].rows.forEach((r) => { sheetTotals[r.name] = { pct: r.pct, letter: r.letter }; });
    const totalsAgree = ROWS.every((name) =>
      sheetTotals[name] && sheetTotals[name].pct === GRADES[name].pct
        && sheetTotals[name].letter === GRADES[name].letter
        && onScreen[name] && onScreen[name].pct === GRADES[name].pct
        && onScreen[name].letter === GRADES[name].letter
        && engine[name].letter === GRADES[name].letter
        && Math.abs(engine[name].pct - Number(GRADES[name].pct.replace('%', ''))) < 0.005);
    check('the percentages and letters on the sheet are the ones the arithmetic gives, the ones the '
      + 'engine answers, and the ones the score grid behind it is drawing — three ways, not one',
      totalsAgree
        && g.slices.every((s) => JSON.stringify(s.rows.map((r) => r.pct + ' ' + r.letter))
          === JSON.stringify(ROWS.map((n) => GRADES[n].pct + ' ' + GRADES[n].letter))),
      'by hand ' + JSON.stringify(ROWS.map((n) => GRADES[n].pct + ' ' + GRADES[n].letter))
        + ' :: on the sheet ' + JSON.stringify(ROWS.map((n) => sheetTotals[n]
          ? sheetTotals[n].pct + ' ' + sheetTotals[n].letter : '(missing)'))
        + ' :: on the grid ' + JSON.stringify(ROWS.map((n) => onScreen[n]
          ? onScreen[n].pct + ' ' + onScreen[n].letter : '(missing)'))
        + ' :: from the engine ' + JSON.stringify(ROWS.map((n) => engine[n].pct)));

    /* THE MARKS, AND THE BLANKS. `late` keeps its score and wears its letter, `missing` holds no
       number at all, `excused` says so, and twenty-one ungraded cells are EMPTY — not a dash, not a
       zero. The last clause is the one the deliverable is about: a printout that turned a blank into
       a zero would be inventing a grade on the sheet the SIS gets typed from.

       TWENTY-ONE AND NOT EIGHTEEN, which is the arithmetic rather than a fudge: the six ungraded
       Practice columns are eighteen of them, and the other three are the work these students happen
       not to have — Ñuñez-Öztürk has neither homework, and Ó"Brien has no bonus poster.

       THE FLAG CLASSES ARE READ PER ROW AND IN COLUMN ORDER, so a build that tinted the right cell
       in the wrong column would fail here: the late score is Ñuñez-Öztürk's SECOND cell, the missing
       one is Ó"Brien's second, and the excused one is Zabkowski's first. */
    const blanks = ROWS.reduce((n, name) =>
      n + rowCells[name].filter((c) => c === '').length, 0);
    const zeroish = ROWS.reduce((n, name) =>
      n + rowCells[name].filter((c) => c === '0').length, 0);
    const flagsOn = g.slices[0].rows.map((r) => r.flags.slice(0, 3).join('|'));
    check('late, missing and excused print as the teacher\'s own marks and a blank stays blank — '
      + 'twenty-one ungraded cells are empty, and not one of them is a zero',
      ROWS.every((name) => JSON.stringify(rowCells[name]) === JSON.stringify(CELLS[name]))
        && blanks === 21 && zeroish === 0
        && JSON.stringify(flagsOn) === JSON.stringify(['|late|', '|missing|', 'excused||']),
      ROWS.map((n) => n + ' ' + JSON.stringify(rowCells[n])).join(' :: ')
        + '; ' + blanks + ' empty cell(s), ' + zeroish + ' reading "0"; flag classes '
        + JSON.stringify(flagsOn));

    /* Class, term, the day it was printed, and the letter scale in use — with WHOSE bands they are,
       because a sheet printed off a class with an override and read against the year's scale is a
       sheet that disagrees with itself. */
    const today = await evalJs('window.planbook.attendance.plainDate('
      + 'window.planbook.attendance.todayISO())');
    check('the sheet carries the class, the term, the day it was printed and the letter scale in '
      + 'use — named as this class\'s own bands rather than the year\'s',
      g.className === 'WO-3.9 Sheet'
        && g.subs.some((s) => s.indexOf(LABEL) === 0)
        && g.subs.some((s) => s.indexOf('3 students') !== -1 && s.indexOf('10 assignments') !== -1)
        && g.subs.some((s) => s === 'Printed ' + today + ' · Planbook')
        && g.scale.indexOf('this class’s own bands') !== -1
        && g.scale.indexOf('A 90 · B 80 · C 70 · D 60') !== -1,
      JSON.stringify(g.subs) + ' :: ' + JSON.stringify(g.scale));

    /* THE SLICES. Ten columns do not fit across a sheet of A4, so the grid is drawn in eights — on
       screen as well as on paper, so the preview is a preview — and every slice repeats the student
       column and the grade column, because a page you cannot read a total off is half a page. */
    check('a term wider than one sheet is drawn in slices of eight, each repeating the student and '
      + 'grade columns and naming which assignments it holds',
      g.slices.length === 2
        && g.slices[0].cols.length === 8 && g.slices[1].cols.length === 2
        && g.slices[0].label === 'Assignments 1–8 of 10'
        && g.slices[1].label === 'Assignments 9–10 of 10'
        && g.slices.every((s) => s.rows.length === 3),
      g.slices.length + ' slice(s): '
        + JSON.stringify(g.slices.map((s) => s.label + ' — ' + s.cols.length + ' column(s)')));

    /* ── the printed page ── */

    /* THE GATE, READ OFF THE STYLESHEET: every @media print rule that touches this surface is
       selected under the attribute, and <body> carries no such attribute at rest. That is the whole
       reason a Ctrl+P made on any other screen still prints the page rather than a blank sheet. */
    const printRules = await evalJs(`(function(){
      var seen = 0, gated = 0, ungated = 0, selectors = [];
      window.__eachRule(function(rule, sel){
        if (String(sel).indexOf('grades-report') === -1
          && String(sel).indexOf('gradesRecordModal') === -1) return;
        var media = '';
        for (var p = rule.parentRule; p; p = p.parentRule) {
          if (p.media && String(p.media.mediaText).indexOf('print') !== -1) media = 'print'; }
        if (media !== 'print') return;
        seen++;
        if (String(sel).indexOf('data-grades-print') !== -1) gated++;
        else { ungated++; selectors.push(sel); }
      });
      return { seen: seen, gated: gated, ungated: ungated, selectors: selectors.slice(0, 4),
        atRest: document.body.hasAttribute('data-grades-print') }; })()`);
    check('every print rule for this sheet is gated on the attribute the button sets, and nothing '
      + 'carries that attribute at rest',
      printRules.seen >= 20 && printRules.ungated === 0 && printRules.atRest === false,
      printRules.seen + ' print rule(s) touching this surface, ' + printRules.gated
        + ' gated on data-grades-print, ' + printRules.ungated + ' ungated '
        + JSON.stringify(printRules.selectors) + '; <body> carries the attribute at rest = '
        + printRules.atRest);

    /* AND THE REGRESSION THAT HAS ALREADY HAPPENED ONCE IN THIS APP: print media, no attribute, and
       the app is still there. An ungated rule would blank every screen on a keyboard print. */
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 120));
    const ungatedPrint = await evalJs(`(function(){
      var d = function(sel){ var e = document.querySelector(sel);
        return e ? getComputedStyle(e).display : '(absent)'; };
      return { header: d('header.header'), main: d('main'), scores: d('#scoresView'),
        actions: d('.grades-report-actions'), head: d('.grades-report-head') }; })()`);
    check('a print with the attribute OFF leaves the whole app on the page — the blank-sheet '
      + 'regression this gate exists for',
      ungatedPrint.header !== 'none' && ungatedPrint.main !== 'none'
        && ungatedPrint.scores !== 'none' && ungatedPrint.actions !== 'none'
        && ungatedPrint.head !== 'none',
      JSON.stringify(ungatedPrint));

    /* THE SHEET ITSELF, snapshotted at the instant the app asks to print — window.print() is
       stubbed because it blocks in a headless browser, and the stub is what makes this stronger
       rather than weaker: the reading is taken while the attribute is genuinely on, at the one
       moment it is a fact. THE STUB REPORTS THAT IT TOOK, which is the guard against the failure that
       looks exactly like an app defect — if window.print were not writable the snapshot would simply
       never be taken and the check would read as a sheet with no header on it. */
    const stubbed = await evalJs(`(function(){
      window.__realPrint = window.print;
      window.print = function(){
        window.__wo39called = (window.__wo39called || 0) + 1;
        try {
        var m = document.getElementById('gradesRecordModal');
        var d = function(sel){ var e = document.querySelector(sel);
          return e ? getComputedStyle(e).display : '(absent)'; };
        /* HEIGHTS AS WELL AS DISPLAY: the computed display of an element inside a display:none
           ancestor is its OWN value, not none, so asking the dialog header for its display would
           report flex on a build behaving perfectly. What it does not have is a BOX. NO BACKTICKS
           IN THIS COMMENT: it is inside a template literal. */
        var box = function(sel){ var e = document.querySelector(sel);
          return e ? Math.round(e.getBoundingClientRect().height) : -1; };
        var outside = [];
        Array.prototype.forEach.call(document.querySelectorAll('body *'), function(e){
          if (m && (m.contains(e) || e.contains(m))) return;
          var r = e.getBoundingClientRect();
          if (r.height > 0 || r.width > 0) outside.push(e.tagName + '.' + (e.className || ''));
        });
        window.__wo39print = {
          attr: document.body.hasAttribute('data-grades-print'),
          /* THE OTHER TWO GATES, read at the same instant (WO-2.25). One mechanism answers all three
             now, and the claim that it keeps three attributes rather than sharing one is a claim
             about this moment: the two surfaces this print is not of carry no attribute and have no
             box. NO BACKTICKS IN THIS COMMENT. */
          attendanceAttr: document.body.hasAttribute('data-attendance-print'),
          detailAttr: document.body.hasAttribute('data-detail-print'),
          recordH: box('#attendanceRecordModal'), detailH: box('#detailView'),
          header: d('header.header'), main: d('main'),
          /* THE VIEW BEHIND THE DIALOG IS ASKED FOR ITS BOX AND NOT FOR ITS DISPLAY, and the
             difference cost this check a red run. #scoresView is the view a teacher was standing on
             when the dialog opened, so it carries no .hidden of its own and its computed display is
             block whatever the print block does — it is dark because <main> above it is. The claim
             is that nothing behind the sheet has a BOX, which is what the sweep below asserts of
             every element at once and what this reads of the one that matters. */
          scoresView: d('#scoresView'), scoresViewH: box('#scoresView'),
          modalHeader: d('#gradesRecordModal .modal-header'),
          actions: d('#gradesRecordModal .grades-report-actions'),
          headerH: box('header.header'), mainH: box('main'),
          modalHeaderH: box('#gradesRecordModal .modal-header'),
          actionsH: box('#gradesRecordModal .grades-report-actions'),
          headH: box('#gradesRecordModal .grades-report-head'),
          tableH: box('#gradesRecordModal .grades-report-table'),
          keyH: box('#gradesRecordModal .grades-report-key'),
          headText: (document.querySelector('#gradesRecordModal .grades-report-head') || {})
            .textContent || '',
          outside: outside.slice(0, 8), outsideCount: outside.length };
        } catch (err) { window.__wo39printErr = String((err && err.message) || err); }
      };
      return window.print !== window.__realPrint; })()`);
    /* THE REAL BUTTON, THROUGH THE REAL DELEGATED HANDLER, but clicked from the page rather than by
       dispatching a mouse event at computed coordinates — WO-3.7's note, obeyed rather than
       rediscovered: this is a click made while Emulation.setEmulatedMedia holds the page in `print`,
       where viewport coordinates land somewhere else and the symptom is "window.print() was never
       called", which reads as a Print button that does nothing. */
    const clicked = await evalJs(`(function(){
      var b = document.querySelector('#gradesRecordModal [data-grades-record-print]');
      if (!b) return { ok:false, why:'no Print control in the open grade sheet' };
      b.click();
      return { ok:true, label: (b.textContent || '').trim(),
        attrRightAfter: document.body.hasAttribute('data-grades-print'),
        printCalls: window.__wo39called || 0,
        snapshotError: window.__wo39printErr || '' }; })()`);
    const sheet = await evalJs('window.__wo39print || null');

    /*
      ── THE GATE AFTER THE TAP, WHICH IS WHERE WO-3.9 SHIPPED A BUG AND THIS CHECK BLESSED IT ──

      This pass originally asserted the OPPOSITE of what is below: that 700ms after the tap the
      attribute was off again, on WO-2.6's reasoning that window.print() blocks until the browser's
      own dialog closes. It went green and the surface was broken anyway — the owner found it on the
      second tap of one sitting, 2026-08-12. Chrome refuses a repeated print() with "This website has
      been blocked from automatically printing"; a REFUSED print() does not block, so the timer
      cleared the gate while the teacher was reading the message, and the print they then allowed
      came out as the whole app. Turning the preview from portrait to landscape did it by the other
      road: the preview re-generates from the live DOM, and the timer had cleared the gate by then
      too.

      So the contract is no longer "on, then off after a moment" — that sentence is precisely the
      bug. It is: ON while the sheet is what is on screen, ANSWERED at the moment the browser asks
      rather than remembered from the tap, and off the moment the sheet is not on screen. Four
      readings below, and the second and third are the two the old check could not have caught.
    */
    await new Promise(r => setTimeout(r, 700));
    const heldOn = await evalJs("document.body.hasAttribute('data-grades-print')");
    /* THE PRINT THE BROWSER DELAYED AND THE TEACHER THEN ALLOWED. Not a second tap — the gate is
       cleared by hand first, so that the only thing that can turn it back on is the event the
       browser fires when it finally serialises the page. This is the reported bug, in one reading:
       under the shipped build this comes back false and the whole app prints. */
    const onDelayedPrint = await evalJs(`(function(){
      document.body.removeAttribute('data-grades-print');
      window.dispatchEvent(new Event('beforeprint'));
      return document.body.hasAttribute('data-grades-print'); })()`);
    const clearedAfter = await evalJs(`(function(){
      window.dispatchEvent(new Event('afterprint'));
      return document.body.hasAttribute('data-grades-print'); })()`);
    /* AND THE GUARANTEE THE TIMER EXISTED TO GIVE, which must survive losing the timer: a Ctrl+P
       made anywhere else in the app must not hide the page and print a blank sheet. The dialog is
       hidden and put back exactly as it was, so nothing below this reads a disturbed page. */
    const offWhenSheetIsNotUp = await evalJs(`(function(){
      var m = document.getElementById('gradesRecordModal');
      var wasHidden = m.classList.contains('hidden');
      m.classList.add('hidden');
      window.dispatchEvent(new Event('beforeprint'));
      var gated = document.body.hasAttribute('data-grades-print');
      if (!wasHidden) m.classList.remove('hidden');
      window.dispatchEvent(new Event('beforeprint'));
      return gated; })()`);
    await evalJs('window.print = window.__realPrint; delete window.__realPrint;'
      + ' delete window.__wo39print; delete window.__wo39printErr; delete window.__wo39called; 1');
    await send('Emulation.setEmulatedMedia', { media: '' });

    check('the printed sheet carries the class, the term and the date, and the app\'s chrome and '
      + 'the dialog\'s own furniture are NOT on it — nothing outside the sheet has a box at all',
      !!sheet && sheet.attr === true
        && sheet.headText.indexOf('WO-3.9 Sheet') !== -1
        && sheet.headText.indexOf(LABEL) !== -1
        && sheet.headText.indexOf('Printed ') !== -1
        && sheet.header === 'none' && sheet.main === 'none'
        && sheet.modalHeader === 'none' && sheet.actions === 'none'
        && sheet.headerH === 0 && sheet.mainH === 0 && sheet.scoresViewH === 0
        && sheet.modalHeaderH === 0 && sheet.actionsH === 0
        && sheet.outsideCount === 0
        && sheet.headH > 0 && sheet.tableH > 0 && sheet.keyH > 0,
      sheet ? JSON.stringify({ attr: sheet.attr, header: sheet.header, main: sheet.main,
        modalHeader: sheet.modalHeader, actions: sheet.actions,
        headerHeight: sheet.headerH, mainHeight: sheet.mainH,
        scoresViewDisplay: sheet.scoresView, scoresViewHeight: sheet.scoresViewH,
        modalHeaderHeight: sheet.modalHeaderH, actionsHeight: sheet.actionsH,
        headHeight: sheet.headH, tableHeight: sheet.tableH,
        keyHeight: sheet.keyH }) + '; ' + sheet.outsideCount
        + ' element(s) still drawn outside the sheet'
        + (sheet.outsideCount ? ': ' + JSON.stringify(sheet.outside) : '')
        + ' :: ' + JSON.stringify(sheet.headText.slice(0, 120))
        : 'no snapshot :: the stub took = ' + stubbed + ', the control was clicked = '
          + JSON.stringify(clicked));
    /* THE THREE ATTRIBUTES STAY THREE (WO-2.25). One module answers all of them now, which is what
       makes this worth asserting on each surface separately rather than arguing it from the shared
       call: sharing one attribute would re-show a surface that is not on screen, and every one of
       the three print blocks says so in its own header. */
    check('and the print carries this surface\'s own attribute and neither of the other two — the '
      + 'record dialog and the detail screen are not on this page and have no box on it',
      !!sheet && sheet.attr === true
        && sheet.attendanceAttr === false && sheet.detailAttr === false
        && sheet.recordH === 0 && sheet.detailH === 0,
      sheet
        ? 'data-grades-print = ' + sheet.attr + ', data-attendance-print = ' + sheet.attendanceAttr
          + ', data-detail-print = ' + sheet.detailAttr + '; #attendanceRecordModal '
          + sheet.recordH + 'px, #detailView ' + sheet.detailH + 'px'
        : 'no snapshot');
    /* ONE TAP, ONE print(). Collected since the section was written and never asserted until the
       owner reported Chrome's "blocked from automatically printing" on 2026-08-13. A delegated
       handler that matched a tap twice would call print() twice from one gesture, which is exactly
       what that throttle exists to stop — so this reading is what separates an app defect from the
       browser's own policy. It is one, so the message is Chrome's and not ours. */
    check('one tap on 🖨 Print calls window.print() exactly once — a second call from one gesture is '
      + 'what Chrome\'s auto-print block is for, so this is the reading that says the block is not '
      + 'ours to fix',
      clicked && clicked.printCalls === 1,
      'window.print() calls from a single tap = ' + (clicked ? clicked.printCalls : '(no click)'));
    check('and the gate is still on while the sheet is on screen — a print the browser DELAYS is '
      + 'still this sheet when it finally happens, not a timer\'s idea of how long that takes',
      heldOn === true, '<body> carries data-grades-print 700ms after the tap = ' + heldOn);
    check('a print the browser refused and the teacher then allowed re-gates itself: `beforeprint` '
      + 'with the sheet up puts the attribute back (the 2026-08-12 bug, in one reading)',
      onDelayedPrint === true,
      'beforeprint with the sheet on screen left data-grades-print on = ' + onDelayedPrint);
    check('and `afterprint` clears it, so <body> outside a print carries nothing',
      clearedAfter === false, '<body> still carries data-grades-print after afterprint = '
        + clearedAfter);
    check('and a Ctrl+P made when the sheet is NOT up clears the gate rather than printing a blank '
      + 'page — the guarantee the timer used to give, kept without it',
      offWhenSheetIsNotUp === false,
      'beforeprint with the sheet closed left data-grades-print on = ' + offWhenSheetIsNotUp);

    /*
      ── THE PAGE BOX, WHICH IS THE WIDTH THE SHEET IS ACTUALLY LAID OUT AT ──

      tools/README.md's trap 10, and WO-3.7's own scar applied to the next print surface rather than
      rediscovered on it. `Emulation.setEmulatedMedia` switches the media TYPE and nothing else: the
      page keeps whatever width setDeviceMetricsOverride last set, which is 1280 for the whole of
      this section, and NO PRINTER IS 1280 WIDE. Letter at this app's `@page { margin: 10mm }` is
      about 740 CSS px, A4 about 718.

      WHAT IT WOULD COST HERE. `.modal-panel` is `width: 480px`, and the gated block restates
      `width: 100% !important` over it. Without that restatement the whole grade sheet prints down
      the left-hand third of the paper — at 1280 the same defect is invisible, because 480 of 1280
      looks like a dialog rather than like a mistake.

      THE NARROW BAND IS ASSERTED LIVE, which is the clause that keeps this honest: if the metrics
      override silently fails the page stays at 1280 and a check that only measured the panel would
      go green for the wrong reason. So print media and the page-box width both have to be true
      before anything measured here is believed.
    */
    const PAGE_BOX = 740;
    await send('Emulation.setDeviceMetricsOverride',
      { width: PAGE_BOX, height: 980, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 250));
    const paper = await evalJs(`(function(){
      window.__realPrint = window.print;
      window.__wo39paper = null;
      window.__wo39paperErr = '';
      window.print = function(){
        try {
          var m = document.getElementById('gradesRecordModal');
          var panel = m ? m.querySelector('.modal-panel') : null;
          var table = m ? m.querySelector('.grades-report-table') : null;
          /* THE SWEEP, run here because the attribute is genuinely ON at this instant — set by the
             module and not by this file. Half the gated selectors match nothing without it, so a
             sweep run at rest would report every one of them as unpinned. Static: which properties
             does a max-width rule declare on an element of this sheet, and does a gated print rule
             matching the same element restate them? NO BACKTICKS IN THIS COMMENT. */
          var els = m ? [m].concat(Array.prototype.slice.call(m.querySelectorAll('*'))) : [];
          for (var p = m && m.parentElement; p; p = p.parentElement) els.push(p);
          var propsOf = function(rule){ var out = [];
            for (var i = 0; i < rule.style.length; i++) out.push(rule.style.item(i));
            return out; };
          var mediaOf = function(rule){ var t = [];
            for (var r = rule.parentRule; r; r = r.parentRule) {
              if (r.media) t.push(String(r.media.mediaText)); }
            return t.join(' | '); };
          var hits = function(sel){ var out = [];
            for (var i = 0; i < els.length; i++) {
              try { if (els[i].matches(sel)) out.push(els[i]); } catch (e) {} }
            return out; };
          var pinned = [], responsive = [];
          window.__eachRule(function(rule, sel){
            var q = mediaOf(rule);
            if (q.indexOf('print') !== -1) {
              if (String(sel).indexOf('data-grades-print') !== -1)
                pinned.push({ sel: sel, props: propsOf(rule), els: hits(sel) });
              return; }
            if (q.indexOf('max-width') !== -1)
              responsive.push({ sel: sel, cond: q, props: propsOf(rule), els: hits(sel) });
          });
          var SHORT = { 'padding-top':'padding', 'padding-right':'padding',
            'padding-bottom':'padding', 'padding-left':'padding', 'margin-top':'margin',
            'margin-right':'margin', 'margin-bottom':'margin', 'margin-left':'margin',
            'row-gap':'gap', 'column-gap':'gap', 'grid-template-columns':'grid-template',
            'grid-template-rows':'grid-template' };
          var covers = function(list, prop){
            for (var i = 0; i < list.length; i++) {
              var q2 = list[i];
              if (q2 === prop) return true;
              if (SHORT[prop] && SHORT[prop] === q2) return true;
              if (SHORT[q2] && SHORT[q2] === prop) return true; }
            return false; };
          var pairs = 0, offenders = [];
          responsive.forEach(function(r){
            r.els.forEach(function(el){
              pairs++;
              var pins = [];
              pinned.forEach(function(q3){
                if (q3.els.indexOf(el) !== -1) pins = pins.concat(q3.props); });
              r.props.forEach(function(prop){
                if (!covers(pins, prop))
                  offenders.push('@media ' + r.cond + ' { ' + r.sel + ' { ' + prop
                    + ' } } unpinned on '
                    + (el.id ? '#' + el.id : el.tagName.toLowerCase()
                      + (el.className ? '.' + String(el.className).split(' ')[0] : ''))); });
            });
          });
          window.__wo39paper = {
            attr: document.body.hasAttribute('data-grades-print'),
            width: document.documentElement.clientWidth,
            printMedia: matchMedia('print').matches,
            panelW: panel ? Math.round(panel.getBoundingClientRect().width) : -1,
            tableW: table ? Math.round(table.getBoundingClientRect().width) : -1,
            responsive: responsive.length, pinned: pinned.length, pairs: pairs,
            offenderCount: offenders.length, offenders: offenders.slice(0, 8) };
        } catch (err) { window.__wo39paperErr = String((err && err.message) || err); }
      };
      var btn = document.querySelector('#gradesRecordModal [data-grades-record-print]');
      if (btn) btn.click();
      var out = { clicked: !!btn, sheet: window.__wo39paper,
        err: window.__wo39paperErr, stub: window.print !== window.__realPrint };
      window.print = window.__realPrint;
      delete window.__realPrint; delete window.__wo39paper; delete window.__wo39paperErr;
      return out; })()`);
    await new Promise(r => setTimeout(r, 700));
    await send('Emulation.setEmulatedMedia', { media: '' });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 200));
    const box = paper && paper.sheet;
    check('at a real page box — 740px, Letter less its 10mm margins — the sheet takes the whole '
      + 'width of the paper rather than the dialog\'s own 480px',
      !!box && box.attr === true && box.printMedia === true && box.width <= 780
        && box.panelW >= box.width - 40 && box.tableW > 480,
      box
        ? 'page box ' + box.width + 'px, print media = ' + box.printMedia
          + ', panel ' + box.panelW + 'px, table ' + box.tableW + 'px — the panel\'s own base rule '
          + 'is width: 480px, so anything near that is the restatement missing'
        : 'no reading :: the Print control was found = ' + (paper && paper.clicked)
          + ', the stub took = ' + (paper && paper.stub)
          + ', error = ' + JSON.stringify(paper && paper.err));
    check('and no responsive rule declares a property on this sheet that the gated print block '
      + 'leaves unpinned — the general form of WO-3.7\'s one-column defect',
      !!box && box.responsive > 0 && box.pairs > 0 && box.offenderCount === 0,
      box
        ? box.responsive + ' max-width rule(s) in the app, ' + box.pinned
          + ' gated print rule(s), ' + box.pairs + ' rule/element pair(s) on the sheet, '
          + box.offenderCount + ' unpinned'
          + (box.offenderCount ? ': ' + JSON.stringify(box.offenders) : '')
        : 'no reading');

    /* ── the CSV, as text through the seam ── */
    const csv = await evalJs(`(async function(){
      var p = window.planbook;
      var r = p.gradesReport.gradesRecord();
      var f = p.gradesReport.gradesCsv(r);
      var blob = new Blob([f.text], { type: 'text/csv;charset=utf-8' });
      var buf = new Uint8Array(await blob.arrayBuffer());
      return { name: f.name, text: f.text, lines: f.text.split('\\r\\n'),
        bom: f.text.charCodeAt(0) === 0xFEFF, lf: /[^\\r]\\n/.test(f.text),
        utf8: new TextDecoder('utf-8').decode(buf),
        cp1252: new TextDecoder('windows-1252').decode(buf),
        bytes: buf.length }; })()`);
    const parse = (line) => {
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
    const parsed = csv.lines.map(parse);
    const rowStartingWith = (first) => parsed.filter((r) => r[0] === first)[0] || [];
    const gridHead = parsed.findIndex((r) => r[0] === 'Student');
    const gridRows = gridHead === -1 ? [] : parsed.slice(gridHead + 1)
      .filter((r) => r.length > 1 && r[0] !== '');
    const assignHead = parsed.findIndex((r) => r[0] === 'Assignment');
    const assignRows = assignHead === -1 ? [] : parsed.slice(assignHead + 1,
      assignHead + 1 + COLUMNS.length);
    check('the CSV opens as a spreadsheet expects: a BOM so Excel reads it as UTF-8, CRLF endings, '
      + 'and one header row per section at a consistent width',
      csv.bom && !csv.lf
        && rowStartingWith('Class')[1] === 'WO-3.9 Sheet'
        && rowStartingWith('Term')[1] === LABEL
        && rowStartingWith('Letter scale')[1] === 'this class’s own bands'
        && rowStartingWith('A')[1] === '90'
        && assignRows.length === COLUMNS.length
        && assignRows.every((r) => r.length === 4)
        && gridRows.length === 3
        && gridRows.every((r) => r.length === COLUMNS.length + 3),
      'BOM = ' + csv.bom + ', a bare LF anywhere = ' + csv.lf + ', '
        + assignRows.length + ' assignment row(s) of width(s) '
        + JSON.stringify(assignRows.map((r) => r.length)) + ', ' + gridRows.length
        + ' student row(s) of width(s) ' + JSON.stringify(gridRows.map((r) => r.length)));

    /* ACCEPTANCE LINE 3'S CHECKABLE HALF: the file and the printed page in the same order, cell for
       cell. The DOM's slices are reassembled to compare against the file's single wide grid, so a
       build whose slicing quietly reordered anything fails here rather than on paper. */
    const csvColumns = gridHead === -1 ? []
      : parsed[gridHead].slice(1, parsed[gridHead].length - 2);
    const sameOrder = JSON.stringify(csvColumns) === JSON.stringify(cols.map((c) => c.name))
      && JSON.stringify(gridRows.map((r) => r[0])) === JSON.stringify(rowNames)
      && gridRows.every((r) => {
        const name = r[0];
        return JSON.stringify(r.slice(1, r.length - 2)) === JSON.stringify(rowCells[name])
          && r[r.length - 2] === GRADES[name].pct && r[r.length - 1] === GRADES[name].letter;
      });
    check('the CSV\'s rows and columns are the printout\'s, cell for cell — the same students in '
      + 'the same order, the same assignments in the same order, and the same marks in between',
      sameOrder && csvColumns.length === 10 && gridRows.length === 3
        && JSON.stringify(assignRows.map((r) => r[0])) === JSON.stringify(COLUMNS)
        && assignRows[0][2] === '2026-09-18' && assignRows[0][3] === '100'
        && assignRows[9][2] === '' && assignRows[9][1] === 'Homework',
      'file columns ' + JSON.stringify(csvColumns) + ' :: page columns '
        + JSON.stringify(cols.map((c) => c.name)) + ' :: file rows '
        + JSON.stringify(gridRows.map((r) => r[0])) + ' :: page rows ' + JSON.stringify(rowNames)
        + ' :: ' + JSON.stringify(gridRows.map((r) => r.slice(1, r.length - 2))));

    /* THE BOM, ASSERTED USEFUL AND NOT ONLY PRESENT — WO-2.6's hole, closed the way WO-3.7 closed
       it: if the same bytes read one way as the teacher's roster and another way as mojibake then
       the byte-order mark is doing work. And the surname carrying both a comma and a double quote
       is what proves the quoting rule came across rather than being assumed — every name in this
       file holds a comma by construction, because `Last, First` is the display the owner pinned. */
    check('a name with non-ASCII characters survives the file, the same bytes read as Windows-1252 '
      + 'are mojibake, and a surname holding a quote and a comma is still one cell',
      csv.utf8.indexOf(S1_ROW) !== -1
        && csv.cp1252 !== csv.utf8 && csv.cp1252.indexOf(S1_ROW) === -1
        && csv.bytes > csv.text.length
        && gridRows.some((r) => r[0] === S2_ROW)
        && csv.text.indexOf('"Ó""Brien, Jr, Ida"') !== -1,
      'decoded as Windows-1252 the first surname reads '
        + JSON.stringify(csv.cp1252.slice(csv.cp1252.indexOf('uñ') - 4,
          csv.cp1252.indexOf('uñ') + 24) || csv.cp1252.slice(0, 40))
        + '; ' + csv.bytes + ' bytes for ' + csv.text.length + ' characters; the quoted surname '
        + 'parses back to ' + JSON.stringify((gridRows.filter((r) => r[0] === S2_ROW)[0] || [])[0]));

    check('and the file is named for the class and the term it holds, in the same family as the '
      + 'backup files, the attendance CSV and the per-student grade CSV',
      csv.name.indexOf('Planbook WO-3.9 Sheet ' + LABEL + ' grades ') === 0
        && /\.csv$/.test(csv.name),
      JSON.stringify(csv.name));

    /* ── ACCEPTANCE LINE 4, IN BOTH MODES ── */
    for (const mode of [false, true]) {
      const out = await evalJs(`(function(){
        var p = window.planbook;
        p.supports.setPresentationMode(${mode ? 'true' : 'false'});
        p.gradesReport.openGrades();
        var m = document.getElementById('gradesRecordModal');
        var r = p.gradesReport.gradesRecord();
        return { visible: p.supports.supportsVisible(),
          screen: m ? m.textContent : '',
          csv: p.gradesReport.gradesCsv(r).text,
          model: JSON.stringify(r) }; })()`);
      const found = SENTINELS.filter((s) => out.screen.indexOf(s) !== -1
        || out.csv.indexOf(s) !== -1 || out.model.indexOf(s) !== -1);
      /* `IEP` is asked separately from the sentinels, because it is the one value a reader would
         expect to find abbreviated somewhere harmless — and it is not here. */
      const plan = out.screen.indexOf('IEP') !== -1 || out.csv.indexOf('IEP') !== -1
        || out.model.indexOf('IEP') !== -1;
      check('neither the printed sheet nor the CSV carries accommodation, medical or plan data — '
        + 'with support data '
        + (mode ? 'SUPPRESSED by presentation mode' : 'VISIBLE everywhere else in the app'),
        found.length === 0 && !plan && out.visible === !mode
          && out.screen.length > 400 && out.csv.length > 400 && out.model.length > 400,
        'supportsVisible() = ' + out.visible + '; sentinels found = ' + JSON.stringify(found)
          + ', the word IEP found = ' + plan + '; the three measured ' + out.screen.length
          + ', ' + out.csv.length + ' and ' + out.model.length
          + ' characters, so none of them was empty');
    }
    await evalJs('window.planbook.supports.setPresentationMode('
      + (plant.mode ? 'true' : 'false') + '); 1');

    /*
      ── THE COARSE PASS ──

      The door and the dialog it opens, at 1024px under a coarse pointer, reached the way a teacher
      reaches them. The door is a glyph-plus-two-words button in a flex row, which is the shape that
      cleared 44px on the owner's own iPad while still pushing its label through its own border — so
      it is measured for SPILL as well as for size, which is the reading the "Days off" button
      earned for every button of this shape after the first iPad sitting.
    */
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    const coarseNow = await evalJs("matchMedia('(pointer: coarse)').matches");
    await clickSel('#classTabBar [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 300));
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    const door44 = await evalJs(`(function(){
      var b = document.querySelector('#scoresView [data-grades-record]');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100,
        spill: b.scrollWidth - b.clientWidth, label: (b.textContent || '').trim() }; })()`);
    check('the 🖨 Grade sheet door on the score grid is a 44px target under a coarse pointer and '
      + 'does not spill through its own border',
      coarseNow === true && !!door44 && door44.h >= 44 && door44.w >= 44 && door44.spill <= 0,
      'coarse pointer = ' + coarseNow + ' :: ' + JSON.stringify(door44));
    await clickSel('#scoresView [data-grades-record]');
    await new Promise(r => setTimeout(r, 400));
    const dialog44 = await evalJs(`(function(){
      var m = document.getElementById('gradesRecordModal');
      if (!m || m.classList.contains('hidden')) return null;
      var out = { drawn: m.querySelectorAll('.grades-report-slice').length, controls: [] };
      m.querySelectorAll('button, input').forEach(function(e){
        var r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (getComputedStyle(e).display === 'none') return;
        out.controls.push({ t: e.className || e.tagName,
          w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100 });
      });
      return out; })()`);
    const under = dialog44 ? dialog44.controls.filter((m) => m.h < 44 || m.w < 44) : [];
    check('every control in the open grade sheet measures >=44px on a coarse pointer, over a sheet '
      + 'that actually drew',
      !!dialog44 && dialog44.drawn === 2 && dialog44.controls.length >= 3 && under.length === 0,
      dialog44
        ? 'measured ' + dialog44.controls.length + ' control(s) over ' + dialog44.drawn
          + ' slice(s); under = ' + JSON.stringify(under)
        : 'the dialog never opened, so nothing was measured');
    if (seam) await evalJs("window.planbook.closeModal('gradesRecordModal'); 1");

    /*
      THE FIXTURE COMES BACK OUT — the class, its three students, its ten assignments and every
      score typed against them — and the class this block found open is put back. Written as one
      update rather than through the real Delete controls, for the reason the WO-3.5 and WO-3.7
      teardowns give: a fixture coming down is not a claim being made. Deleted by id rather than
      restored from a snapshot because this section RELOADS the page for its coarse pass.

      This is the last section in the file now, so nothing depends on the state; it is cleaned up
      anyway, because a run that left a fixture class in the teacher's own browser is a run that
      wrote student data nobody asked for — and this one's fixture has a support block in it.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return 0;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
        doc.students = doc.students.filter(function(x){
          return String(x.id).indexOf('wo39-') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (String(k).indexOf('a39') === 0) delete doc.scores[k]; });
      });
      window.planbook.supports.setPresentationMode(${plant.mode ? 'true' : 'false'});
      var was = ${JSON.stringify(plant.was || '')};
      if (was) c.selectClass(was);
      c.refreshClassBar();
      await s.flush();
      return 1; })()`);
  }
}
}
