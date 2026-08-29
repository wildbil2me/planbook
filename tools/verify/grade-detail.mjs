/* grade-detail.mjs — one student's grade detail (WO-3.7)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { measureIn } from './touch-targets.mjs';

export async function run(h) {
const { check, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, load } = h;

/* ───────── one student's grade detail (WO-3.7) ─────────
 *
 * A fourth class screen, and the only one you cannot reach from the switcher. Nine acceptance lines,
 * and the shape of most of them is AGREEMENT or ABSENCE rather than "the number is right", so the
 * fixture is built to be survivable by neither.
 *
 * THE FIXTURE IS FOUR CATEGORIES AND ONE OF THEM IS EMPTY, which is what makes acceptance line 2
 * checkable at all: Participation carries 15% and holds nothing, so the other three count at 40/85,
 * 25/85 and 20/85 rather than at their face weights, and every figure below is over 85 and not 100.
 * A fixture whose categories all had work in them would pass an implementation that ignored
 * redistribution entirely.
 *
 * EVERY FIGURE IN THIS SECTION WAS COMPUTED BY HAND AND IS WRITTEN DOWN HERE, which is acceptance
 * line 3 in its own terms — "the to-move figure is reproducible by hand" is a claim about somebody
 * with a calculator, so the expected values are calculated here and asserted as strings, never read
 * back off the screen and compared to themselves:
 *
 *   Tests 78/100 = 78%, Quizzes 13/20 = 65%, Homework 8/20 = 40%, Participation empty.
 *   Grade = (78x40 + 65x25 + 40x20) / 85 = 5545/85 = 65.2352941…%  -> 65.24%, a D.
 *   Contributions 36.705882…, 19.117647…, 9.411765…
 *   Nothing scored on the outstanding 30 points: (78x40 + 32.5x25 + 26.666…x20)/85 = 52.54%
 *   Full marks on them:                          (78x40 + 82.5x25 + 60x20)/85       = 75.09%
 *   Next band up is D+ at 67, so the rate is (67 - 52.5392…)/(75.0882… - 52.5392…) = 0.6413043…,
 *   rounded UP to the two places everything else prints at: 64.14%, which lands at 67.00% — a D+.
 *   Handing in the one missing 10-pointer in full: (78x40 + 65x25 + 90x20)/85 = 6545/85 = 77.00%.
 *
 * THE SECOND STUDENT IS THE ROUNDING FIXTURE, and she exists because acceptance line 1 is about the
 * PRINTED column and not the computed one. 78/100, 17/20, 9/10 gives contributions of 36.705882,
 * 25.000000 and 21.176471 over a grade of 82.882353% — round each on its own and the column reads
 * 36.71 + 25.00 + 21.18 = 82.89 under a total of 82.88, which is a page a guardian can add up and
 * catch. src/detail.js allocates the cents by largest remainder instead; the check below asserts
 * BOTH that the naive sum would have missed and that the printed one does not, so it cannot go
 * green against a build that dropped the allocation. She also has NOTHING outstanding, which takes
 * the other branch of the to-move card.
 *
 * BOTH NAMES ARE NON-ASCII ON PURPOSE (acceptance line 7). WO-2.6 shipped a BOM asserted present and
 * never asserted USEFUL, because every name in its fixture was ASCII — so the check here decodes the
 * file's own bytes as Windows-1252 as well as UTF-8 and asserts the two disagree, which is the
 * failure the BOM exists to prevent, demonstrated rather than described. The second surname also
 * carries a comma and a double quote, so the quoting rule in this file's own csvCell() is asserted
 * rather than assumed to have come across correctly from WO-2.6's.
 *
 * ACCEPTANCE LINE 8 IS ASSERTED IN BOTH MODES AND THE MODE-OFF PASS IS THE ONE THAT MATTERS. Support
 * data is planted on the student first — a plan, a case manager, an accommodation, a medical line and
 * a behavior plan, each with a sentinel — and its presence in the serialised document is asserted
 * before anything is read, because an absence check over a student with nothing on file proves
 * nothing. A build that gated the screen and the file on the presentation toggle would pass the
 * mode-ON pass and fail the mode-OFF one.
 *
 * THE PRINT SURFACE IS DRIVEN THROUGH THE REAL BUTTON, which WO-2.6's section could not do until
 * WO-2.25 taught it the same trick. The one thing standing in the way is that window.print() blocks
 * in a headless browser, so it is stubbed — and the stub is what makes this stronger rather than
 * weaker: it takes its snapshot AT THE MOMENT THE APP ASKS TO PRINT, under emulated print media,
 * which is the only moment the gate is a fact rather than a bet. What it measures is what is left
 * on the sheet: the panel header, the
 * switcher, the breadcrumb, the action row and every other view are display:none, the hero and the
 * breakdown are not, and NOTHING outside #detailView has a box at all. What it still cannot say is
 * that the result fits one sheet of paper — no emulator has one, and that stays owed to a human.
 *
 * AND THE UNGATED-RULE REGRESSION IS ITS OWN CHECK, because it has already happened once in this
 * app: print media is emulated with the attribute OFF first, and the app has to still be there.
 */
console.log('\n--- one student\'s grade detail (WO-3.7) ---');
{
  const CLS = 'c_wo37';
  const TERM = 'tm_wo37';
  const LABEL = 'WO-3.7 Term';
  const S1 = 'wo37-s1', S2 = 'wo37-s2';
  const S1_FIRST = 'Zoë', S1_LAST = 'Ñuñez-Öztürk';
  const S1_ROSTER = S1_LAST + ', ' + S1_FIRST;
  const S1_FULL = S1_FIRST + ' ' + S1_LAST;
  const S2_FIRST = 'Ida', S2_LAST = 'Ó"Brien, Jr';
  const SENTINELS = ['WO37 CASEMANAGER SENTINEL', 'WO37 ACCOMMODATION SENTINEL',
    'WO37 MEDICAL SENTINEL', 'WO37 BEHAVIOR SENTINEL', '2027-01-14'];
  /* Written down rather than read back — see the header. */
  const GRADE = '65.24%', LETTER = 'D';
  const CONTRIBS = ['36.71', '19.12', '9.41'];
  const FLOOR = '52.54%', CEILING = '75.09%', RATE = '64.14%', LANDS = '67.00%';
  const HANDED_IN = '77.00%';
  const S2_CONTRIBS = ['36.70', '25.00', '21.18'];
  const S2_GRADE = '82.88%';

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
    /* Carried back to Node rather than parked on the window, unlike the WO-2.6 plant: this section
       RELOADS the page for its coarse pass, and a page reload takes anything on window with it. So
       the teardown deletes the fixture by id instead of restoring a snapshot, the way the WO-3.5
       teardown does. NO BACKTICKS IN THIS COMMENT. */
    var was = c.getSelectedClassId();
    var mode = window.planbook.supports.presentationMode();
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!doc.scores) doc.scores = {};
      doc.students.push(
        { id:'${S1}', first:${JSON.stringify(S1_FIRST)}, last:${JSON.stringify(S1_LAST)},
          supports: {
            plan:'IEP',
            caseManager:{ name:'WO37 CASEMANAGER SENTINEL', email:'wo37@example.test' },
            reviewDate:'2027-01-14',
            accommodations:[{ kind:'extended-time', detail:'WO37 ACCOMMODATION SENTINEL',
              appliesTo:[] }],
            medical:'WO37 MEDICAL SENTINEL', behaviorPlan:'WO37 BEHAVIOR SENTINEL' } },
        { id:'${S2}', first:${JSON.stringify(S2_FIRST)}, last:${JSON.stringify(S2_LAST)} });
      doc.classes.push({ id:'${CLS}', name:'WO-3.7 Detail', archived:false,
        roster:['${S1}','${S2}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'${LABEL}', start:'2026-09-01', end:'2026-11-06' }],
        categories:[
          { id:'cat37t', name:'Tests', weight:40 },
          { id:'cat37q', name:'Quizzes', weight:25 },
          { id:'cat37h', name:'Homework', weight:20 },
          /* EMPTY ON PURPOSE — nothing is ever filed under it. Acceptance line 2 is about this row
             being drawn rather than hidden, and every figure in the section is over 85. */
          { id:'cat37p', name:'Participation', weight:15 }]});
      var add = function(id, cat, name, points){
        doc.assignments.push({ id:id, classId:'${CLS}', termId:'${TERM}', categoryId:cat,
          name:name, points:points, assigned:'2026-09-08', due:'2026-09-18' });
      };
      add('a37t1', 'cat37t', 'Unit 1 Test', 100);
      add('a37q1', 'cat37q', 'Cell Quiz', 20);
      add('a37q2', 'cat37q', 'Osmosis Quiz', 20);       /* outstanding */
      add('a37q3', 'cat37q', 'Retake Quiz', 20);        /* excused, so in nothing */
      add('a37h1', 'cat37h', 'Ch 1 Homework', 10);
      add('a37h2', 'cat37h', 'Ch 2 Homework', 10);      /* marked missing */
      add('a37h3', 'cat37h', 'Ch 3 Homework', 10);      /* outstanding */
      add('a37b1', 'cat37h', 'Bonus poster', 0);        /* outstanding bonus work */
      doc.scores['a37t1'] = { '${S1}': { v:78 }, '${S2}': { v:78 } };
      doc.scores['a37q1'] = { '${S1}': { v:13 }, '${S2}': { v:17 } };
      doc.scores['a37h1'] = { '${S1}': { v:8 },  '${S2}': { v:9 } };
      doc.scores['a37h2'] = { '${S1}': { v:null, flag:'missing' } };
      /* THE SECOND STUDENT HAS NOTHING OUTSTANDING, which is the other branch of the to-move card
         and is arranged rather than assumed: every assignment she has no score on is one she is
         excused from. An excused cell is out of the grade in both directions, so it is neither
         owed nor outstanding — which is exactly the distinction openWork() has to get right.
         NO BACKTICKS IN THIS COMMENT: it is inside a template literal. */
      doc.scores['a37q2'] = { '${S2}': { v:null, flag:'excused' } };
      doc.scores['a37q3'] = { '${S1}': { v:null, flag:'excused' },
                              '${S2}': { v:null, flag:'excused' } };
      doc.scores['a37h2']['${S2}'] = { v:null, flag:'excused' };
      doc.scores['a37h3'] = { '${S2}': { v:null, flag:'excused' } };
      doc.scores['a37b1'] = { '${S2}': { v:null, flag:'excused' } };
      /* Six recorded meetings in the term, one of them an absence for the subject. */
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      ['2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-14','2026-09-15']
        .forEach(function(date, i){
          var rec = { classId:'${CLS}', date:date, marks:{} };
          if (i === 0) rec.marks['${S1}'] = { code:'A' };
          if (i === 1) rec.marks['${S1}'] = { code:'T' };
          doc.attendance.push(rec);
        });
    });
    c.selectClass('${CLS}');
    c.selectTerm('${TERM}');
    window.planbook.attendance.renderAttendance();
    return { ok:true, doc: JSON.stringify(s.getDoc()), was: was, mode: mode,
      visible: window.planbook.supports.supportsVisible() };
  })()`);

  if (!plant.ok) {
    check('the WO-3.7 fixture is real: a class of two over four categories, one of them empty',
      false, plant.why);
  } else {
    const planted = SENTINELS.every((s) => plant.doc.indexOf(s) !== -1)
      && plant.doc.indexOf('"plan":"IEP"') !== -1;
    /* Written as a code-point test rather than as a character-class range, because a range in a
       regex literal here would put the escape sequence itself into this file and the point is that
       the NAMES really do leave ASCII. If they ever stop, this check fails and says so — a fixture
       that cannot express the failure is not evidence, and an all-ASCII roster is exactly the hole
       WO-2.6 left behind its BOM. */
    const outsideAscii = (s) => Array.from(s).some((ch) => ch.charCodeAt(0) > 127);
    /* Searched for in the form the DOCUMENT holds them, which is not the form they are written in
       here: the second surname carries a double quote, and JSON.stringify escapes it. A search for
       the raw string came back empty on the first run and read as "the fixture never landed", which
       it had. */
    const asStored = (s) => JSON.stringify(s).slice(1, -1);
    const nonAscii = plant.doc.indexOf(asStored(S1_LAST)) !== -1
      && plant.doc.indexOf(asStored(S2_LAST)) !== -1
      && outsideAscii(S1_LAST) && outsideAscii(S2_LAST);
    check('the WO-3.7 fixture is real: two students with non-ASCII names, four categories with one '
      + 'of them empty, and a support block on the one whose detail is opened',
      planted && nonAscii && plant.visible === true,
      'every support sentinel is in the document = ' + planted + ', both surnames hold a '
        + 'non-ASCII character = ' + nonAscii + ' (' + S1_LAST + ' · ' + S2_LAST + '), support '
        + 'data is visible in this mode = ' + plant.visible);

    /* ── the door: a student's own name on the score grid ── */
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 250));
    const gridDoors = await evalJs(
      "document.querySelectorAll('#scoresBody [data-student-detail]').length");
    await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
    await new Promise(r => setTimeout(r, 250));

    const READ = `(function(){
      var v = document.getElementById('detailView');
      if (!v) return { up:false };
      var strip = v.querySelector('[data-screen-nav]');
      var txt = function(sel){ var e = v.querySelector(sel); return e ? e.textContent : ''; };
      var breakRows = Array.prototype.slice.call(v.querySelectorAll('.detail-break tbody tr'));
      return {
        up: !v.classList.contains('hidden'),
        inMain: v.parentElement ? v.parentElement.tagName.toLowerCase() : '',
        role: v.getAttribute('role') || '',
        dialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
          .filter(function(o){ return !o.classList.contains('hidden'); })
          .map(function(o){ return o.id; }),
        heading: (document.getElementById('detailStudentName') || {}).textContent || '',
        subtitle: (document.getElementById('detailSubtitle') || {}).textContent || '',
        big: txt('.detail-grade-big'),
        band: txt('.detail-grade-band'),
        segments: strip ? Array.prototype.map.call(strip.children, function(b){
          return { label: b.textContent, detail: b.className.indexOf('detail') !== -1,
                   screen: b.getAttribute('data-class-screen') || '' }; }) : [],
        rows: breakRows.map(function(tr){
          var cells = Array.prototype.map.call(tr.children, function(c){ return c.textContent; });
          return { empty: tr.className.indexOf('empty') !== -1, cells: cells }; }),
        foot: Array.prototype.map.call(
          v.querySelectorAll('.detail-break tfoot tr')[0].children,
          function(c){ return c.textContent; }),
        move: txt('.detail-move'),
        unreachable: !!v.querySelector('.detail-move.unreachable'),
        missing: Array.prototype.map.call(v.querySelectorAll('.detail-missing-name'),
          function(e){ return e.textContent; }),
        stake: txt('.detail-card-title'),
        att: Array.prototype.map.call(v.querySelectorAll('.detail-att-stat'),
          function(e){ return e.textContent; }),
        attTitle: Array.prototype.map.call(v.querySelectorAll('.detail-card-title'),
          function(e){ return e.textContent; }),
        text: v.textContent || '' }; })()`;
    const d = await evalJs(READ);

    /* ACCEPTANCE LINE 5, and the entry point in the same check: the screen is a view in <main>
       reached by tapping a NAME, and tapping it opened no dialog at all. */
    check('a student\'s own name in the score grid opens their grade detail as a VIEW in <main>, '
      + 'with no dialog anywhere in it',
      d.up && d.inMain === 'main' && d.role === '' && d.dialogs.length === 0
        && gridDoors === 2 && d.heading === S1_FULL,
      'in <' + d.inMain + '>, role ' + JSON.stringify(d.role) + ', dialogs open '
        + JSON.stringify(d.dialogs) + ', ' + gridDoors + ' name door(s) on the grid, heading '
        + JSON.stringify(d.heading));

    /* AND WO-2.26's HALL-PASS CARD IS ON THE SCREEN THIS DOOR OPENED (WO-2.27). That work order put
       the card here and asserts it on its own route — the door inside the attendance history dialog
       — so nothing checked that it is built when the screen is reached from a NAME IN THE SCORE
       GRID, which is the route a teacher uses most. One assertion, on a walk this block already
       takes. It asks for the title and its position and not for trips: this fixture's class has no
       pass log behind it, so the card reads `Hall passes · none`, and what is being asked is whether
       the card was drawn on this route at all.

       WO-4.4 ADDED A FIFTH CARD AND THIS CHECK MOVED WITH IT, in place: it asserted the pass card
       was LAST in the column, and the log card is under it now. Re-cut to name both, because this
       route is the one a teacher uses most and "was the card drawn here at all" is the claim — one
       card missing from this walk is a card missing from the common route while the rare one passes,
       which is the whole reason this line exists.

       WO-5.4 ADDED A SIXTH AND IT MOVED AGAIN, the same way and for the same reason: the contact
       history is now the foot of the column, with the log card above it and the passes above that.
       All three are named rather than only the new one — the point of this line is the whole tail
       of the column on the common route, and a check that only ever asserted the newest card would
       have stopped noticing the older ones the moment it was updated. */
    const passCard37 = d.attTitle.filter((t) => t.indexOf('Hall passes') === 0);
    const logCard37 = d.attTitle.filter((t) => t === 'What you have written down');
    const contactCard37 = d.attTitle.filter((t) => t === 'Who you have written to');
    check('the hall-pass card is on the Student Report screen when that screen is reached from a name in the score grid, and not only from the door inside the attendance history dialog — with the log card under it since WO-4.4 and the contact history under that since WO-5.4, on that same route',
      passCard37.length === 1 && logCard37.length === 1 && contactCard37.length === 1
        && d.attTitle[d.attTitle.length - 1] === contactCard37[0]
        && d.attTitle[d.attTitle.length - 2] === logCard37[0]
        && d.attTitle[d.attTitle.length - 3] === passCard37[0],
      'the cards this route drew are ' + JSON.stringify(d.attTitle));

    /* ACCEPTANCE LINE 9, first half — the name is drawn on the strip, as a fourth segment that is
       NOT one of the three tabs. WO-3.3 could assert only the safe direction of this rule (a name
       set with no detail open is drawn nowhere); this is the half nobody had a screen to show. */
    const crumb = d.segments[d.segments.length - 1] || {};
    check('the switcher shows the open student\'s name as a breadcrumb segment while this screen '
      + 'is up, set apart from the five tabs and carrying no screen of its own',
      /* SIX SEGMENTS SINCE WO-4.2, and the breadcrumb is still the last of them: the calendar
         became the fourth tab on 2026-08-19 (the owner reversing THREE TABS, NOT FOUR) and Signals
         the fifth on 2026-08-20, and the distinction this check is really about is unchanged — the
         tabs carry a screen, the breadcrumb carries a name and no `data-class-screen` at all. */
      d.segments.length === 6 && crumb.label === S1_FULL && crumb.detail === true
        && crumb.screen === ''
        && JSON.stringify(d.segments.slice(0, 5).map((s) => s.label))
          === JSON.stringify(['Attendance', 'Assignments', 'Scores', 'Calendar', 'Signals']),
      d.segments.length + ' segment(s): ' + JSON.stringify(d.segments));

    /* ACCEPTANCE LINE 1. The contributions as PRINTED sum to the total as PRINTED, and both agree
       with what the engine says to the same two places — three claims, because a build could satisfy
       any two of them. */
    const contribs = d.rows.filter((r) => !r.empty).map((r) => r.cells[r.cells.length - 1]);
    const sum = contribs.reduce((n, s) => n + Math.round(Number(s) * 100), 0);
    const engine = await evalJs(`(function(){
      var p = window.planbook, doc = p.store.getDoc();
      var cls = p.classes.getSelectedClass();
      return p.gradeEngine.weightedClassGrade(doc, cls, '${TERM}', '${S1}').percentage; })()`);
    check('the breakdown\'s contributions sum to the displayed overall grade, and the total is the '
      + 'engine\'s own answer rather than the column\'s',
      JSON.stringify(contribs) === JSON.stringify(CONTRIBS)
        && sum === Math.round(Number(GRADE.replace('%', '')) * 100)
        && d.foot[d.foot.length - 1] === GRADE
        && d.big === GRADE
        && Math.abs(engine - Number(GRADE.replace('%', ''))) < 0.005,
      'column ' + JSON.stringify(contribs) + ' sums to ' + (sum / 100).toFixed(2)
        + ', footer ' + JSON.stringify(d.foot[d.foot.length - 1]) + ', hero '
        + JSON.stringify(d.big) + ', engine ' + engine);

    /* ACCEPTANCE LINE 2. The empty category is a row on the screen, it says its weight goes
       somewhere, and the "counts at" column on the rows beside it proves that it did — 40% counting
       at 47.06% is redistribution shown rather than described. */
    const emptyRow = d.rows.filter((r) => r.empty)[0] || { cells: [] };
    const countsAt = d.rows.filter((r) => !r.empty).map((r) => r.cells[4]);
    check('a category with nothing in it is SHOWN with its weight redistributing, not hidden and '
      + 'not printed as a zero — and the other rows say what they count at instead of their weight',
      d.rows.length === 4 && emptyRow.cells[0] === 'Participation'
        && emptyRow.cells[1] === '15%'
        && /redistribut|shared across/.test(emptyRow.cells[2] || '')
        && (emptyRow.cells[2] || '').indexOf('15%') !== -1
        && JSON.stringify(countsAt) === JSON.stringify(['47.06%', '29.41%', '23.53%']),
      d.rows.length + ' row(s); the empty one reads ' + JSON.stringify(emptyRow.cells)
        + '; the others count at ' + JSON.stringify(countsAt));

    /* ACCEPTANCE LINE 3, as five figures a person with a calculator can check: where the grade sits,
       what the next band is, the two ends of the line, and the score that crosses it. Every one of
       them is written down at the top of this section rather than read off the screen. */
    check('the "what it would take to move" figures are the ones the arithmetic gives — the floor, '
      + 'the ceiling, the score needed and where it lands',
      d.move.indexOf(GRADE) !== -1
        && d.move.indexOf('D+') !== -1 && d.move.indexOf('67%') !== -1
        && d.move.indexOf(FLOOR) !== -1 && d.move.indexOf(CEILING) !== -1
        && d.move.indexOf(RATE) !== -1 && d.move.indexOf(LANDS) !== -1
        && d.move.indexOf('Osmosis Quiz') !== -1 && d.move.indexOf('Ch 3 Homework') !== -1
        && d.move.indexOf('30 points') !== -1
        && !d.unreachable,
      'expected ' + [GRADE, FLOOR, CEILING, RATE, LANDS].join(' / ') + ' :: '
        + JSON.stringify(d.move.slice(0, 460)));

    /* The two routes that are NOT that line, and both are named rather than folded into it: work
       already marked missing is a numerator-only change, and bonus work cannot carry a percentage at
       all. A build that folded the 0-point assignment into "score X% on everything left" would put a
       piece of work in the figure that the figure cannot move. */
    check('the missing-work route and the bonus work are each given their own line rather than '
      + 'folded into the score-on-everything-left figure',
      d.move.indexOf(HANDED_IN) !== -1 && d.move.indexOf('Ch 2 Homework') !== -1
        && d.move.indexOf('C+') !== -1
        && d.move.indexOf('Bonus poster') !== -1 && d.move.indexOf('worth 0 points') !== -1
        && d.move.indexOf('Bonus poster') > d.move.indexOf(RATE),
      'handing in the missing work reads ' + HANDED_IN + ' :: '
        + JSON.stringify(d.move.slice(d.move.indexOf('Separately'))));

    /* The missing list, and the points at stake on its own title. `late` and `missing` are teacher
       marked and never inferred, so the excused and the blank cells are deliberately not on it. */
    check('the missing-work list is exactly what the teacher marked missing, with the points at '
      + 'stake on it — the blank and the excused are not on it',
      JSON.stringify(d.missing) === JSON.stringify(['Ch 2 Homework'])
        && d.attTitle.some((t) => t.indexOf('Missing work · 10 points at stake') === 0),
      JSON.stringify(d.missing) + ' :: ' + JSON.stringify(d.attTitle));

    /* The attendance summary, from WO-2.4's own readers — asserted against what those readers
       answer rather than against a number typed here, because the deliverable is that the two
       agree. Six recorded meetings, one absence and one tardy on the subject. */
    const totals = await evalJs(`(function(){
      var p = window.planbook, cls = p.classes.getSelectedClass();
      var t = p.attendance.termTotals(cls.id, '${S1}', p.classes.getSelectedTerm());
      return { line: p.attendance.percentText(t), meetings: t.meetings,
        counts: [t.P, t.T, t.A, t.E, t.D] }; })()`);
    check('the attendance summary is the same walk the registry counts from, over recorded '
      + 'meetings and never calendar days',
      JSON.stringify(totals.counts) === JSON.stringify([4, 1, 1, 0, 0])
        && totals.meetings === 6
        && d.attTitle.some((t) => t === 'Attendance · ' + totals.line)
        && d.text.indexOf('6 recorded meetings') !== -1
        && d.text.indexOf('not school days') !== -1,
      'termTotals says ' + JSON.stringify(totals) + '; the card titles read '
        + JSON.stringify(d.attTitle));

    /* ACCEPTANCE LINE 9, second half — the name goes when you leave, and it goes for all three
       tabs rather than for the one somebody tested. This is the half WO-3.3 could not demonstrate:
       there was no screen to leave.

       FOUR TABS SINCE WO-6.6, and the fourth is walked with the others rather than exempted. The
       calendar became a class screen on 2026-08-19, so it is a screen this name can be left on —
       and a build where the breadcrumb outlived the screen it belongs to would show a student's name
       over a month grid, which is the same defect on the surface most likely to be projected. */
    const left = [];
    for (const screen of ['class', 'assignments', 'scores', 'calendar']) {
      await clickSel('#detailView [data-class-screen="' + screen + '"]');
      await new Promise(r => setTimeout(r, 200));
      left.push(await evalJs(`(function(){
        var strips = Array.prototype.slice.call(document.querySelectorAll('[data-screen-nav]'));
        var on = document.querySelector('main > :not(.hidden)');
        return { view: on ? on.id : '',
          anyName: strips.some(function(s){ return s.textContent.indexOf(${JSON.stringify(S1_FULL)}) !== -1; }),
          segments: strips.reduce(function(n, s){ return Math.max(n, s.children.length); }, 0) }; })()`));
      /* Back in through the same door a teacher has: the name on the score grid. Two of the three
         tabs land somewhere that has no name on it, so the route out to Scores comes first. */
      const on = left[left.length - 1].view;
      if (on !== 'scoresView') {
        await clickSel('#' + on + ' [data-class-screen="scores"]');
        await new Promise(r => setTimeout(r, 300));
      }
      await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
      await new Promise(r => setTimeout(r, 250));
    }
    const back = await evalJs(READ);
    /* THE WALK IS STILL THE FOUR TABS THAT HAVE A DOOR BACK THROUGH A NAMED SCORE GRID, and the
       counts around it moved to five when WO-4.2 added Signals: the strip a teacher sees on any
       class screen is five segments now, and the detail's own strip is those five PLUS the student's
       name, so the name sits at index 5 rather than 4. Signals is deliberately NOT walked here —
       this check is about the NAME leaving the strip, and adding a fifth leg would be new coverage
       written by the check that measures it rather than by the work order that specified it. */
    check('switching to any of the four tabs takes the student\'s name off the strip with it, and '
      + 'coming back puts it there again',
      left.length === 4 && left.every((l) => l.anyName === false && l.segments === 5)
        && JSON.stringify(left.map((l) => l.view))
          === JSON.stringify(['classView', 'assignmentsView', 'scoresView', 'calendarView'])
        && back.segments.length === 6
        && (back.segments[5] || {}).label === S1_FULL,
      JSON.stringify(left) + ' :: back on the detail with '
        + back.segments.length + ' segment(s)');

    /* THE SECOND DOOR, and the one the registry could not carry on a row: a student's own name on
       the registry is already spoken for (it opens their attendance history), so the way from
       attendance to grades is inside that dialog. It has to close the dialog on the way through. */
    await clickSel('#detailView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#attendanceBody [data-attendance-history="' + S1 + '"]');
    await new Promise(r => setTimeout(r, 200));
    const dialogUp = await evalJs(
      "!document.getElementById('attendanceHistoryModal').classList.contains('hidden')");
    await clickSel('#attendanceHistoryModal [data-student-detail="' + S1 + '"]');
    await new Promise(r => setTimeout(r, 250));
    const viaHistory = await evalJs(`(function(){
      var on = document.querySelector('main > :not(.hidden)');
      return { view: on ? on.id : '',
        dialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
          .filter(function(o){ return !o.classList.contains('hidden'); }).length,
        focused: document.activeElement ? document.activeElement.id : '',
        heading: (document.getElementById('detailStudentName') || {}).textContent || '' }; })()`);
    check('the door in a student\'s attendance history opens the same screen, closes the dialog '
      + 'behind it, and does not leave focus on <body>',
      dialogUp === true && viaHistory.view === 'detailView' && viaHistory.dialogs === 0
        && viaHistory.heading === S1_FULL && viaHistory.focused === 'detailStudentName',
      'the history dialog was up = ' + dialogUp + ' :: ' + JSON.stringify(viaHistory));

    /* ── the printed page ── */

    /* THE GATE, READ OFF THE STYLESHEET: every @media print rule that touches this surface is
       selected under the attribute, and <body> carries no such attribute at rest. That is the whole
       reason a Ctrl+P made on any other screen still prints the page rather than a blank sheet. */
    const printRules = await evalJs(`(function(){
      var seen = 0, gated = 0, ungated = 0, selectors = [];
      window.__eachRule(function(rule, sel){
        if (String(sel).indexOf('detail') === -1 && String(sel).indexOf('detailView') === -1) return;
        var media = '';
        for (var p = rule.parentRule; p; p = p.parentRule) {
          if (p.media && String(p.media.mediaText).indexOf('print') !== -1) media = 'print'; }
        if (media !== 'print') return;
        seen++;
        if (String(sel).indexOf('data-detail-print') !== -1) gated++;
        else { ungated++; selectors.push(sel); }
      });
      return { seen: seen, gated: gated, ungated: ungated, selectors: selectors.slice(0, 4),
        atRest: document.body.hasAttribute('data-detail-print') }; })()`);
    check('every print rule for this screen is gated on the attribute the button sets, and nothing '
      + 'carries that attribute at rest',
      printRules.seen >= 20 && printRules.ungated === 0 && printRules.atRest === false,
      printRules.seen + ' print rule(s) touching this surface, ' + printRules.gated
        + ' gated on data-detail-print, ' + printRules.ungated + ' ungated '
        + JSON.stringify(printRules.selectors) + '; <body> carries the attribute at rest = '
        + printRules.atRest);

    /* AND THE REGRESSION THAT HAS ALREADY HAPPENED ONCE: print media, no attribute, and the app is
       still there. An ungated rule would blank every screen in the app on a keyboard print. */
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 120));
    const ungatedPrint = await evalJs(`(function(){
      var d = function(sel){ var e = document.querySelector(sel);
        return e ? getComputedStyle(e).display : '(absent)'; };
      return { header: d('header.header'), main: d('main'), detail: d('#detailView'),
        actions: d('.detail-actions'), hero: d('.detail-hero') }; })()`);
    check('a print with the attribute OFF leaves the whole app on the page — the blank-sheet '
      + 'regression this gate exists for',
      ungatedPrint.header !== 'none' && ungatedPrint.main !== 'none'
        && ungatedPrint.detail !== 'none' && ungatedPrint.actions !== 'none'
        && ungatedPrint.hero !== 'none',
      JSON.stringify(ungatedPrint));

    /* THE SHEET ITSELF, snapshotted at the instant the app asks to print. window.print() is stubbed
       because it blocks in a headless browser and there is no paper anyway; the stub takes the
       reading at the one moment the gate is a fact rather than a bet.

       THE STUB REPORTS THAT IT TOOK, which is the guard against the failure that looks exactly like
       an app defect: if `window.print` were not writable the snapshot would simply never be taken,
       and the check would read "the printed page is missing its header" over a build whose printed
       page is perfect. */
    const stubbed = await evalJs(`(function(){
      window.__realPrint = window.print;
      window.print = function(){
        window.__wo37called = (window.__wo37called || 0) + 1;
        try {
        var v = document.getElementById('detailView');
        var d = function(sel){ var e = document.querySelector(sel);
          return e ? getComputedStyle(e).display : '(absent)'; };
        /* HEIGHTS AS WELL AS DISPLAY, and the difference is load-bearing: the computed display of
           an element inside a display:none ancestor is its OWN value, not none. The switcher is
           never named by a print rule — it is hidden because the panel header around it is — so
           asking it for its display would report flex on a build that is behaving perfectly. What
           it does not have is a BOX. NO BACKTICKS IN THIS COMMENT: it is inside a template. */
        var box = function(sel){ var e = document.querySelector(sel);
          return e ? Math.round(e.getBoundingClientRect().height) : -1; };
        var outside = [];
        Array.prototype.forEach.call(document.querySelectorAll('body *'), function(e){
          if (v && (v.contains(e) || e.contains(v))) return;
          var r = e.getBoundingClientRect();
          if (r.height > 0 || r.width > 0) outside.push(e.tagName + '.' + (e.className || ''));
        });
        window.__wo37print = {
          attr: document.body.hasAttribute('data-detail-print'),
          /* THE OTHER TWO GATES, read at the same instant (WO-2.25). One mechanism now answers all
             three, and the claim that it keeps three attributes rather than sharing one is a claim
             about this moment: the two surfaces this print is not of carry no attribute and have no
             box. Sharing one would re-show a dialog that is not on screen — a blank sheet by a
             different route, which is what src/detail.css's header says at length. */
          attendanceAttr: document.body.hasAttribute('data-attendance-print'),
          gradesAttr: document.body.hasAttribute('data-grades-print'),
          recordH: box('#attendanceRecordModal'), gradesH: box('#gradesRecordModal'),
          header: d('header.header'), classView: d('#classView'), scoresView: d('#scoresView'),
          panelHeader: d('#detailView .detail-header'),
          actions: d('#detailView .detail-actions'),
          stamp: d('#detailView .detail-print-stamp'),
          stripH: box('#detailView [data-screen-nav]'),
          headerH: box('header.header'),
          actionsH: box('#detailView .detail-actions'),
          heroH: box('#detailView .detail-hero'), tableH: box('#detailView .detail-break'),
          stampH: box('#detailView .detail-print-stamp'),
          stampText: (document.querySelector('#detailView .detail-print-stamp') || {}).textContent || '',
          heroText: (document.querySelector('#detailView .detail-hero') || {}).textContent || '',
          outside: outside.slice(0, 8), outsideCount: outside.length,
          text: v ? v.textContent : '' };
        } catch (err) { window.__wo37printErr = String((err && err.message) || err); }
      };
      return window.print !== window.__realPrint; })()`);
    /*
      THE REAL BUTTON, THROUGH THE REAL DELEGATED HANDLER, but clicked from the page rather than by
      dispatching a mouse event at computed coordinates — the one departure in this section, and it
      is written down here because it cost a red run to find. Input.dispatchMouseEvent takes viewport
      coordinates and this is the only place in the file that clicks anything while
      Emulation.setEmulatedMedia is holding the page in `print`; the event went somewhere else and the
      symptom was "window.print() was never called", which reads as a Print button that does nothing.
      Nothing about the CLAIM needs a pointer: element.click() runs the same delegated listener in
      src/shell.js against the same hook, and the button's geometry is measured separately by the
      coarse pass at the foot of this section. The alternative — reaching past the control into
      src/detail.js's printDetail() — would have been the thing worth refusing.
    */
    const clicked = await evalJs(`(function(){
      /* THE CONTROL IS NOT NAMED FOR THE GATE (WO-2.25, correction 2). The button is
         data-detail-SHEET-print; data-detail-print is the attribute on <body>, and while the two were
         one string src/shell.js's closest() matched every click on screen. NO BACKTICKS. */
      var b = document.querySelector('#detailView [data-detail-sheet-print]');
      if (!b) return { ok:false, why:'no Print control on the open detail view' };
      window.__wo37err = '';
      var onErr = function(ev){ window.__wo37err += String(ev.message || ev.reason || ev) + ' | '; };
      window.addEventListener('error', onErr);
      b.click();
      window.removeEventListener('error', onErr);
      /* Read straight after the click: the attribute being ON here is the proof printDetail() ran at
         all, which is the fork this detail line has to be able to name — a Print button that never
         reaches the module and a snapshot that threw look identical from the outside. */
      return { ok:true, label: (b.textContent || '').trim(),
        attrRightAfter: document.body.hasAttribute('data-detail-print'),
        printCalls: window.__wo37called || 0,
        snapshotError: window.__wo37printErr || '',
        pageError: window.__wo37err || '' }; })()`);
    const sheet = await evalJs('window.__wo37print || null');
    const today = await evalJs('window.planbook.attendance.plainDate('
      + 'window.planbook.attendance.todayISO())');
    /*
      ── THE GATE AFTER THE TAP, AND WHAT THIS PASS USED TO ASSERT (WO-2.25) ──

      There was one check here and it asserted the OPPOSITE of the first one below: that 700ms after
      the tap the attribute was off again, on WO-2.6's reasoning that window.print() blocks until the
      browser's own dialog closes. It went green on every run and the surface was broken anyway —
      the same bug the grade sheet shipped with, from the same lifted idiom, found by the owner on
      2026-08-12. Chrome refuses a repeated print() with "This website has been blocked from
      automatically printing"; a REFUSED print() does not block, so the timer cleared the gate while
      the teacher read the message, and the print they then allowed came out as the whole app. A
      preview turned from portrait to landscape did it by the other road: it re-generates from the
      live DOM, and the timer had cleared the gate by then too.

      So the contract is no longer "on, then off after a moment" — that sentence is precisely the
      bug. It is: ON while this screen is what is on screen, ANSWERED at the moment the browser asks
      rather than remembered from the tap, and off the moment it is not. Four readings below, and the
      middle two are the ones the deleted check could not have caught.
    */
    await new Promise(r => setTimeout(r, 700));
    const heldOn = await evalJs("document.body.hasAttribute('data-detail-print')");
    /* THE PRINT THE BROWSER DELAYED AND THE TEACHER THEN ALLOWED. Not a second tap — the gate is
       cleared by hand first, so that the only thing that can turn it back on is the event the
       browser fires when it finally serialises the page. Under the shipped build this comes back
       false and the whole app prints. */
    const onDelayedPrint = await evalJs(`(function(){
      document.body.removeAttribute('data-detail-print');
      window.dispatchEvent(new Event('beforeprint'));
      return document.body.hasAttribute('data-detail-print'); })()`);
    const clearedAfter = await evalJs(`(function(){
      window.dispatchEvent(new Event('afterprint'));
      return document.body.hasAttribute('data-detail-print'); })()`);
    /* AND THE GUARANTEE THE TIMER EXISTED TO GIVE, which must survive losing the timer: a Ctrl+P
       made anywhere else in the app must not hide the page and print a blank sheet. This surface is
       a VIEW rather than a dialog, so "not up" is another view being the one on screen — it is put
       back exactly as it was, and nothing below this reads a disturbed page. */
    const offWhenViewIsNotUp = await evalJs(`(function(){
      var v = document.getElementById('detailView');
      var wasHidden = v.classList.contains('hidden');
      v.classList.add('hidden');
      window.dispatchEvent(new Event('beforeprint'));
      var gated = document.body.hasAttribute('data-detail-print');
      if (!wasHidden) v.classList.remove('hidden');
      window.dispatchEvent(new Event('afterprint'));
      return gated; })()`);
    await evalJs('window.print = window.__realPrint; delete window.__realPrint;'
      + ' delete window.__wo37print; delete window.__wo37printErr; delete window.__wo37called;'
      + ' delete window.__wo37err; 1');
    await send('Emulation.setEmulatedMedia', { media: '' });

    /* ACCEPTANCE LINE 6, as far as a laptop can see it: the sheet carries the student, the class,
       the term and the day it was printed, and the app's own chrome is not on it. Whether the result
       is ONE page stays owed to a human with a printer — no emulator has one. */
    check('the printed sheet carries the student, the class, the term and the date it was printed',
      !!sheet && sheet.attr === true
        && sheet.heroText.indexOf(S1_FULL) !== -1
        && sheet.heroText.indexOf('WO-3.7 Detail') !== -1
        && sheet.heroText.indexOf(LABEL) !== -1
        && sheet.stamp === 'block' && sheet.stampH > 0
        && sheet.stampText.indexOf('Printed ' + today) === 0,
      sheet ? 'attribute on = ' + sheet.attr + ', stamp ' + JSON.stringify(sheet.stampText)
        + ' :: ' + JSON.stringify(sheet.heroText.slice(0, 140))
        : 'no snapshot :: the stub took = ' + stubbed + ', the control was clicked = '
          + JSON.stringify(clicked) + ' — window.print() was never called, so either the Print '
          + 'button does not reach printDetail() or the stub never replaced window.print');
    check('and the nav strip, the breadcrumb and every other piece of app chrome are NOT on it — '
      + 'nothing outside the detail view has a box at all',
      !!sheet && sheet.header === 'none' && sheet.classView === 'none'
        && sheet.scoresView === 'none' && sheet.panelHeader === 'none'
        && sheet.actions === 'none'
        && sheet.headerH === 0 && sheet.stripH === 0 && sheet.actionsH === 0
        && sheet.outsideCount === 0
        && sheet.heroH > 0 && sheet.tableH > 0,
      sheet ? JSON.stringify({ header: sheet.header, panelHeader: sheet.panelHeader,
        stripHeight: sheet.stripH, actionsHeight: sheet.actionsH,
        heroHeight: sheet.heroH, tableHeight: sheet.tableH })
        + '; ' + sheet.outsideCount + ' element(s) still drawn outside #detailView'
        + (sheet.outsideCount ? ': ' + JSON.stringify(sheet.outside) : '')
        : 'no snapshot');
    check('one tap on 🖨 Print calls window.print() exactly once — a second call from one gesture is '
      + 'what Chrome\'s auto-print block is for, so this is the reading that says the block is not '
      + 'ours to fix',
      clicked && clicked.ok && clicked.printCalls === 1,
      'window.print() calls from a single tap = '
        + (clicked && clicked.ok ? clicked.printCalls : JSON.stringify(clicked)));
    check('and the print carries this surface\'s own attribute and neither of the other two — the '
      + 'record dialog and the grade sheet are not on this page and have no box on it',
      !!sheet && sheet.attr === true
        && sheet.attendanceAttr === false && sheet.gradesAttr === false
        && sheet.recordH === 0 && sheet.gradesH === 0,
      sheet
        ? 'data-detail-print = ' + sheet.attr + ', data-attendance-print = ' + sheet.attendanceAttr
          + ', data-grades-print = ' + sheet.gradesAttr + '; #attendanceRecordModal '
          + sheet.recordH + 'px, #gradesRecordModal ' + sheet.gradesH + 'px'
        : 'no snapshot');
    check('and the gate is still on while this screen is on screen — a print the browser DELAYS is '
      + 'still this sheet when it finally happens, not a timer\'s idea of how long that takes',
      heldOn === true, '<body> carries data-detail-print 700ms after the tap = ' + heldOn);
    check('a print the browser refused and the teacher then allowed re-gates itself: `beforeprint` '
      + 'with this screen up puts the attribute back (the 2026-08-12 bug, in one reading)',
      onDelayedPrint === true,
      'beforeprint with the detail on screen left data-detail-print on = ' + onDelayedPrint);
    check('and `afterprint` clears it, so <body> outside a print carries nothing',
      clearedAfter === false,
      '<body> still carries data-detail-print after afterprint = ' + clearedAfter);
    check('and a Ctrl+P made when this screen is NOT the view on screen clears the gate rather than '
      + 'printing a blank page — the guarantee the timer used to give, kept without it',
      offWhenViewIsNotUp === false,
      'beforeprint with the detail view hidden left data-detail-print on = ' + offWhenViewIsNotUp);

    /*
      ── THE PAGE BOX, WHICH IS THE WIDTH THE SHEET IS ACTUALLY LAID OUT AT ──

      EVERY CHECK ABOVE SHARES ONE BLIND SPOT, and it let a real defect through.
      `Emulation.setEmulatedMedia` switches the media TYPE and nothing else: the page keeps
      whatever width `setDeviceMetricsOverride` last set, which is 1280 for the whole of this
      section, so while the snapshot above is being taken every `max-width` query in the app is
      still resolving against 1280. NO PRINTER IS 1280 WIDE. Letter at the `@page { margin: 10mm }`
      this app declares is about 740 CSS px (816 less 75.6); landscape Letter is about 981; A4 is
      about 718. All three are inside `src/detail.css`'s `@media (max-width: 1024px)`, the
      tablet-portrait rule that drops the detail screen to a single column.

      WHAT THAT COST. The gated print block declared `gap` on `.detail-cols` and never restated
      `grid-template-columns`, so on every real sheet of paper the responsive rule won and the sheet
      printed as one column — "two pages of half-empty paper" in that stylesheet's own words, under
      an acceptance line that says one page. Every check above was green through all of it, because
      1280 is the one width band in which the shipped stylesheet still looked like the designed one.
      The WO-3.7 verifier found it on 2026-08-12 by rendering the file to PDF at the page box; this
      harness could not express it, and "a fixture that cannot express the failure is not evidence"
      is this project's own rule. So it is expressed here.

      THE NARROW BAND IS ASSERTED LIVE, and that clause is the one that keeps this honest. If the
      metrics override ever silently fails, the page stays at 1280, the responsive rule stops
      applying, two columns come back for entirely the wrong reason and the check goes green over
      the defect it was written for. So it demands `matchMedia('(max-width: 1024px)')` MATCH and the
      media be `print` before it believes anything it measures — the same fork the stub above draws
      between "the button did not reach the module" and "the sheet is wrong".

      Driven through the real Print button, and through element.click() rather than a dispatched
      mouse event, for the reason written over the snapshot above: this is again a click made while
      the page is held in `print`, where viewport coordinates go somewhere else.
    */
    const PAGE_BOX = 740;
    await send('Emulation.setDeviceMetricsOverride',
      { width: PAGE_BOX, height: 980, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 250));
    const paper = await evalJs(`(function(){
      window.__realPrint = window.print;
      window.__wo37paper = null;
      window.__wo37paperErr = '';
      window.print = function(){
        try {
          var view = document.getElementById('detailView');
          var cols = document.querySelector('#detailView .detail-cols');
          var kids = cols ? Array.prototype.slice.call(cols.children) : [];
          var a = kids[0] ? kids[0].getBoundingClientRect() : null;
          var b = kids[1] ? kids[1].getBoundingClientRect() : null;
          /* The computed value of a grid's columns is its USED track list — two lengths when the
             sheet has two columns, one when it has been dropped to a single one. That count is the
             whole claim. NO BACKTICKS IN THIS COMMENT: it is inside a template. */
          var tracks = cols
            ? String(getComputedStyle(cols).gridTemplateColumns).trim().split(/ +/) : [];

          /* AND THE SWEEP, run here because the attribute is genuinely ON at this instant — set by
             the module, not by this file. Half the gated selectors (body[data-detail-print] > main
             and the rest) match nothing at all without it, so a sweep run at rest would report
             every one of them as unpinned. Static: which properties does a max-width rule declare
             on an element of this sheet, and does a gated print rule matching the same element
             restate them? The columns defect is exactly that shape, and so is the next one. */
          var els = [view].concat(Array.prototype.slice.call(view.querySelectorAll('*')));
          for (var p = view.parentElement; p; p = p.parentElement) els.push(p);
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
            var m = mediaOf(rule);
            if (m.indexOf('print') !== -1) {
              if (String(sel).indexOf('data-detail-print') !== -1)
                pinned.push({ sel: sel, props: propsOf(rule), els: hits(sel) });
              return; }
            if (m.indexOf('max-width') !== -1)
              responsive.push({ sel: sel, cond: m, props: propsOf(rule), els: hits(sel) });
          });
          /* Shorthands, both ways round: this engine keeps "padding: 0" as one declared name and
             "padding-left: max(...)" as another, so a pin written as the shorthand has to count for
             the longhand and the reverse. */
          var SHORT = { 'padding-top':'padding', 'padding-right':'padding',
            'padding-bottom':'padding', 'padding-left':'padding', 'margin-top':'margin',
            'margin-right':'margin', 'margin-bottom':'margin', 'margin-left':'margin',
            'row-gap':'gap', 'column-gap':'gap', 'grid-template-columns':'grid-template',
            'grid-template-rows':'grid-template' };
          var covers = function(list, prop){
            for (var i = 0; i < list.length; i++) {
              var q = list[i];
              if (q === prop) return true;
              if (SHORT[prop] && SHORT[prop] === q) return true;
              if (SHORT[q] && SHORT[q] === prop) return true; }
            return false; };
          var pairs = 0, offenders = [];
          responsive.forEach(function(r){
            r.els.forEach(function(el){
              pairs++;
              var pins = [];
              pinned.forEach(function(q){
                if (q.els.indexOf(el) !== -1) pins = pins.concat(q.props); });
              r.props.forEach(function(prop){
                if (!covers(pins, prop))
                  offenders.push('@media ' + r.cond + ' { ' + r.sel + ' { ' + prop
                    + ' } } unpinned on '
                    + (el.id ? '#' + el.id : el.tagName.toLowerCase()
                      + (el.className ? '.' + String(el.className).split(' ')[0] : ''))); });
            });
          });

          window.__wo37paper = {
            attr: document.body.hasAttribute('data-detail-print'),
            width: document.documentElement.clientWidth,
            narrowBand: matchMedia('(max-width: 1024px)').matches,
            printMedia: matchMedia('print').matches,
            tracks: tracks, trackCount: tracks.length, kids: kids.length,
            sameRow: !!(a && b) && Math.abs(a.top - b.top) < 2 && b.left > a.left + 20,
            viewH: view ? Math.round(view.getBoundingClientRect().height) : -1,
            responsive: responsive.length, pinned: pinned.length, pairs: pairs,
            offenderCount: offenders.length, offenders: offenders.slice(0, 8) };
        } catch (err) { window.__wo37paperErr = String((err && err.message) || err); }
      };
      var btn = document.querySelector('#detailView [data-detail-sheet-print]');
      if (btn) btn.click();
      var out = { clicked: !!btn, sheet: window.__wo37paper,
        err: window.__wo37paperErr, stub: window.print !== window.__realPrint };
      window.print = window.__realPrint;
      delete window.__realPrint; delete window.__wo37paper; delete window.__wo37paperErr;
      return out; })()`);
    await new Promise(r => setTimeout(r, 700));
    await send('Emulation.setEmulatedMedia', { media: '' });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 200));
    const box = paper && paper.sheet;
    check('at a real page box — 740px, Letter less its 10mm margins — the printed sheet is still '
      + 'TWO columns, with the tablet-portrait rule live and beaten rather than absent',
      !!box && box.attr === true && box.printMedia === true && box.narrowBand === true
        && box.width <= 1024 && box.kids === 2 && box.trackCount === 2 && box.sameRow === true,
      box
        ? 'page box ' + box.width + 'px, print media = ' + box.printMedia
          + ', (max-width: 1024px) matches = ' + box.narrowBand
          + ', grid tracks ' + JSON.stringify(box.tracks) + ' over ' + box.kids
          + ' column(s), side by side = ' + box.sameRow
          + '; the view is ' + box.viewH + 'px tall at that width, which is a CONTENT height and '
          + 'not a page count — whether it lands on one sheet is still 👤'
        : 'no reading :: the Print control was found = ' + (paper && paper.clicked)
          + ', the stub took = ' + (paper && paper.stub)
          + ', error = ' + JSON.stringify(paper && paper.err));
    /* THE GENERAL FORM OF THE SAME DEFECT, so the next one does not need a verifier to find it.
       Specificity is not modelled here — the check asks whether a gated rule DECLARES the property,
       not whether it would win a tie — and that is enough today because every gated selector on this
       sheet is attribute-plus-class and outranks the single-class responsive rules it faces. A
       future responsive rule that ties on specificity would pass this and still lose on paper; it
       would need its own reading, and this comment is where that is recorded. */
    check('and no responsive rule declares a property on this sheet that the gated print block '
      + 'leaves unpinned — the general form of the one-column defect',
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
      var m = p.detail.detailModel();
      var f = p.detail.studentCsv(m);
      var blob = new Blob([f.text], { type: 'text/csv;charset=utf-8' });
      var buf = new Uint8Array(await blob.arrayBuffer());
      return { name: f.name, text: f.text, lines: f.text.split('\\r\\n'),
        bom: f.text.charCodeAt(0) === 0xFEFF, lf: /[^\\r]\\n/.test(f.text),
        utf8: new TextDecoder('utf-8').decode(buf),
        cp1252: new TextDecoder('windows-1252').decode(buf),
        bytes: buf.length }; })()`);
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
    const parsed = csv.lines.map(cols);
    const rowStartingWith = (first) => parsed.filter((r) => r[0] === first)[0] || [];
    const catHead = parsed.findIndex((r) => r[0] === 'Category');
    const catRows = catHead === -1 ? [] : parsed.slice(catHead + 1)
      .slice(0, parsed.slice(catHead + 1).findIndex((r) => r.length === 1 && r[0] === ''));
    check('the per-student CSV opens as a spreadsheet expects: a BOM so Excel reads it as UTF-8, '
      + 'CRLF endings, and one header row per section at a consistent width',
      csv.bom && !csv.lf
        && JSON.stringify(parsed[catHead]) === JSON.stringify(['Category', 'Weight %', 'Earned',
          'Possible', 'Category %', 'Counts at %', 'Contributes'])
        && catRows.length === 5
        && catRows.every((r) => r.length === 7),
      'BOM = ' + csv.bom + ', a bare LF anywhere = ' + csv.lf + ', category section header '
        + JSON.stringify(parsed[catHead]) + ' over ' + catRows.length + ' row(s) of width(s) '
        + JSON.stringify(catRows.map((r) => r.length)));

    /* THE BOM, ASSERTED USEFUL AND NOT ONLY PRESENT — the hole WO-2.6 left, closed by a fixture that
       can express the failure. If the same bytes read one way as the teacher's roster and another
       way as mojibake, then the byte-order mark is doing work; if the two decodings agreed, this
       file would be pure ASCII and the check would be measuring nothing. */
    const nameRow = rowStartingWith('Student');
    check('a name with non-ASCII characters in it survives the file — and the same bytes read as '
      + 'Windows-1252 are mojibake, which is what the BOM is there to prevent',
      csv.utf8.indexOf(S1_LAST) !== -1 && csv.utf8.indexOf(S1_FIRST) !== -1
        && nameRow[1] === S1_LAST && nameRow[2] === S1_FIRST
        && csv.cp1252 !== csv.utf8
        && csv.cp1252.indexOf(S1_LAST) === -1
        && csv.bytes > csv.text.length,
      'the Student row parses to ' + JSON.stringify(nameRow) + '; decoded as Windows-1252 the '
        + 'surname reads ' + JSON.stringify(csv.cp1252.slice(csv.cp1252.indexOf('Student'),
          csv.cp1252.indexOf('Student') + 40)) + '; ' + csv.bytes + ' bytes for '
        + csv.text.length + ' characters');

    /* The numbers in the file are the numbers on the screen, character for character — including
       the contribution column's cent allocation. A file that has left the building and disagrees
       with the screen it was taken from is worse than no file. */
    const csvContribs = catRows.slice(0, -1).filter((r) => r[6] !== '').map((r) => r[6]);
    check('the file carries the same figures the screen does, contribution column included, and '
      + 'names the empty category rather than dropping it',
      JSON.stringify(csvContribs) === JSON.stringify(CONTRIBS)
        && rowStartingWith('Overall grade')[1] === GRADE
        && rowStartingWith('Overall grade')[2] === LETTER
        && rowStartingWith('Overall')[1] === '100'
        && rowStartingWith('Overall')[6] === GRADE
        && catRows.some((r) => r[0] === 'Participation' && /redistribut/.test(r[4]))
        && rowStartingWith('Recorded meetings')[1] === '6'
        && rowStartingWith('Ch 2 Homework')[3] === 'marked missing'
        && rowStartingWith('Bonus poster')[3] === 'outstanding bonus work',
      JSON.stringify(csvContribs) + ' :: Overall ' + JSON.stringify(rowStartingWith('Overall'))
        + ' :: ' + JSON.stringify(catRows.map((r) => r[0])));

    check('and the file is named for the student, the class and the term it holds, in the same '
      + 'family as the backup files and the attendance CSV',
      csv.name.indexOf('Planbook ' + S1_ROSTER + ' WO-3.7 Detail ' + LABEL + ' grades ') === 0
        && /\.csv$/.test(csv.name),
      JSON.stringify(csv.name));

    /* ── the second student: the rounding the column would otherwise miss ── */
    await clickSel('#detailView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#scoresBody [data-student-detail="' + S2 + '"]');
    await new Promise(r => setTimeout(r, 250));
    const two = await evalJs(READ);
    const twoContribs = two.rows.filter((r) => !r.empty).map((r) => r.cells[r.cells.length - 1]);
    const twoSum = twoContribs.reduce((n, s) => n + Math.round(Number(s) * 100), 0);
    /* What rounding each contribution on its own would have produced — computed here from the
       engine's unrounded answers, so the check knows the naive column really does miss. */
    const naive = await evalJs(`(function(){
      var p = window.planbook, doc = p.store.getDoc();
      var cls = p.classes.getSelectedClass();
      var g = p.gradeEngine.weightedClassGrade(doc, cls, '${TERM}', '${S2}');
      var each = g.categories.filter(function(c){ return c.contribution !== null; })
        .map(function(c){ return Math.round(c.contribution * 100); });
      return { each: each, sum: each.reduce(function(a,b){ return a+b; }, 0),
        total: Math.round(g.percentage * 100) }; })()`);
    check('the contribution column is rounded so that it ADDS UP to the total printed under it — '
      + 'on a student where rounding each row on its own would have missed by a cent',
      naive.sum !== naive.total
        && JSON.stringify(twoContribs) === JSON.stringify(S2_CONTRIBS)
        && twoSum === naive.total
        && two.foot[two.foot.length - 1] === S2_GRADE && two.big === S2_GRADE,
      'rounding each row alone gives ' + naive.each.map((c) => (c / 100).toFixed(2)).join(' + ')
        + ' = ' + (naive.sum / 100).toFixed(2) + ' under a total of '
        + (naive.total / 100).toFixed(2) + '; the screen prints '
        + JSON.stringify(twoContribs) + ' = ' + (twoSum / 100).toFixed(2)
        + ' under ' + JSON.stringify(two.foot[two.foot.length - 1]));

    /* And the other branch of the to-move card: nothing outstanding to score anything on. Said
       plainly rather than left as an empty paragraph, and in the quiet palette rather than the
       indigo one — this is not a route. */
    check('a student with no outstanding work is told so rather than shown an empty figure',
      two.unreachable === true
        && two.move.indexOf('no work outstanding') !== -1
        && two.move.indexOf('%') !== -1,
      JSON.stringify(two.move.slice(0, 300)));

    /* ── ACCEPTANCE LINES 4 AND 8, IN BOTH MODES ── */
    await clickSel('#detailView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
    await new Promise(r => setTimeout(r, 250));
    for (const mode of [false, true]) {
      const out = await evalJs(`(function(){
        var p = window.planbook;
        p.supports.setPresentationMode(${mode ? 'true' : 'false'});
        p.detail.renderDetail();
        var v = document.getElementById('detailView');
        var m = p.detail.detailModel();
        return { visible: p.supports.supportsVisible(),
          screen: v ? v.textContent : '',
          csv: p.detail.studentCsv(m).text,
          model: JSON.stringify(m) }; })()`);
      const found = SENTINELS.filter((s) => out.screen.indexOf(s) !== -1
        || out.csv.indexOf(s) !== -1 || out.model.indexOf(s) !== -1);
      /* `IEP` is asked separately from the sentinels, because it is the one value a reader would
         expect to find abbreviated somewhere harmless — and it is not here. */
      const plan = out.screen.indexOf('IEP') !== -1 || out.csv.indexOf('IEP') !== -1
        || out.model.indexOf('IEP') !== -1;
      check('neither the screen, the printed page nor the CSV carries accommodation, medical or '
        + 'plan data — with support data '
        + (mode ? 'SUPPRESSED by presentation mode' : 'VISIBLE everywhere else in the app'),
        found.length === 0 && !plan && out.visible === !mode
          && out.screen.length > 400 && out.csv.length > 400 && out.model.length > 400,
        'supportsVisible() = ' + out.visible + '; sentinels found = ' + JSON.stringify(found)
          + ', the word IEP found = ' + plan + '; the three measured ' + out.screen.length
          + ', ' + out.csv.length + ' and ' + out.model.length
          + ' characters, so none of them was empty');
    }
    await evalJs('window.planbook.supports.setPresentationMode('
      + (plant.mode ? 'true' : 'false') + '); window.planbook.detail.renderDetail(); 1');

    /*
      ── THE COARSE PASS ──

      What a desk can say about the touch half of this screen: every control on it clears 44px with
      the view OPEN, which is the state the standing sweep at the top of this run cannot reach. That
      sweep names this view and hands it here (VIEW_PLAN's `byHand`), because there is no roster on
      screen at that point in the run and this screen has no door without one — it is reached from a
      NAME. So it is opened here through its real door, on a fixture that has names in it, and that
      it is DRAWN is its own clause: a sweep over nothing is the failure this whole idea exists to
      close.
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
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    await clickSel('#scoresBody [data-student-detail="' + S1 + '"]');
    await new Promise(r => setTimeout(r, 300));
    const drawn = await evalJs(`(function(){
      var v = document.getElementById('detailView');
      if (!v) return null;
      var r = v.getBoundingClientRect();
      return { hidden: v.classList.contains('hidden'), display: getComputedStyle(v).display,
        h: Math.round(r.height), rows: v.querySelectorAll('.detail-break tbody tr').length,
        name: (document.getElementById('detailStudentName') || {}).textContent || '' }; })()`);
    check('#detailView opens through the app\'s own navigation — a name on the score grid — and '
      + 'draws under a coarse pointer',
      coarseNow === true && !!drawn && !drawn.hidden && drawn.display !== 'none'
        && drawn.h > 0 && drawn.rows === 4 && drawn.name === S1_FULL,
      'coarse pointer = ' + coarseNow + ' :: ' + JSON.stringify(drawn));
    const detail44 = await evalJs(measureIn('#detailView'));
    const detailUnder = detail44.filter((m) => m.h < 44 || m.w < 44);
    console.log('measured ' + detail44.length + ' control(s) on #detailView');
    check('every control on the open #detailView measures >=44px on a coarse pointer',
      detail44.length >= 4 && detailUnder.length === 0,
      'measured ' + detail44.length + '; under = ' + JSON.stringify(detailUnder.slice(0, 6))
        + (detailUnder.length > 6 ? ' … and ' + (detailUnder.length - 6) + ' more' : ''));
    /* And the door itself, on the screen it is on, which is the other half of the same question:
       twenty-five names down a frozen column are twenty-five targets. */
    await clickSel('#detailView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 300));
    const doors44 = await evalJs(`(function(){ var out = [];
      document.querySelectorAll('#scoresBody [data-student-detail]').forEach(function(e){
        var r = e.getBoundingClientRect();
        out.push({ w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100 }); });
      return out; })()`);
    check('and the name door on the score grid is a 44px target of its own rather than a strip of '
      + 'text inside a row that happens to be tall enough',
      doors44.length === 2 && doors44.every((m) => m.h >= 44 && m.w >= 44),
      JSON.stringify(doors44));

    /*
      AND THE OTHER DOOR, MEASURED RATHER THAN INHERITED. This work order adds a second way in — a
      button inside the attendance history dialog — and `src/attendance.css` gives it a margin and
      nothing else, on the stated grounds that it wears `.class-action-btn` and that component
      already carries its 44px floor in `src/shell.css`'s coarse block. That reasoning is correct and
      it is still a CLAIM: `wo-sweep.mjs` flags every new selector with no coarse rule and asks a
      human to confirm it is not a target, and "it inherits one" answered by reading is exactly the
      shape of the BOM this work order was told not to inherit — asserted present, never asserted
      useful. So it is opened at 1024px under a coarse pointer, on the surface a teacher reaches it
      from, and measured.

      ASKED FOR BEFORE IT IS CLICKED, because `clickSel()` throws when nothing matches and this
      file's rule is that a missing fixture is a red check and never a crash — the rule this section
      of the run broke once already (TESTING.md § WO-3.5).
    */
    await clickSel('#scoresView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 300));
    const historyDoor = await evalJs(
      "!!document.querySelector('#attendanceBody [data-attendance-history=\"" + S1 + "\"]')");
    let door44 = null;
    if (historyDoor) {
      await clickSel('#attendanceBody [data-attendance-history="' + S1 + '"]');
      await new Promise(r => setTimeout(r, 300));
      door44 = await evalJs(`(function(){
        var m = document.getElementById('attendanceHistoryModal');
        var b = m ? m.querySelector('[data-student-detail]') : null;
        if (!m || !b) return { open: m ? !m.classList.contains('hidden') : false, found: false };
        var r = b.getBoundingClientRect();
        return { open: !m.classList.contains('hidden'), found: true,
          w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100,
          /* The same spill reading the 🖨 door gets, and for the same reason: this is another
             glyph-plus-words button and that shape cleared 44px on the owner's iPad while still
             pushing its label through its own border. */
          spill: b.scrollWidth - b.clientWidth,
          label: (b.textContent || '').trim() }; })()`);
      await evalJs("window.planbook.closeModal('attendanceHistoryModal'); 1");
      await new Promise(r => setTimeout(r, 200));
    }
    check('the door from a student\'s attendance history to their grades is a 44px target too, and '
      + 'does not spill through its own border',
      historyDoor === true && !!door44 && door44.open === true && door44.found === true
        && door44.h >= 44 && door44.w >= 44 && door44.spill <= 0
        && door44.label.indexOf(S1_FULL) !== -1,
      historyDoor
        ? JSON.stringify(door44)
        : 'no student name on the registry to open a history from, so the door was never reached');

    /*
      THE FIXTURE COMES BACK OUT — the class, its two students, its eight assignments, every score
      typed against them and the six attendance records under them — and the class this block found
      open is put back. Written as one update rather than through the real Delete controls, for the
      reason the WO-3.5 teardown gives: a fixture coming down is not a claim being made. Deleted by
      id rather than restored from a snapshot because this section RELOADS the page for its coarse
      pass, and a snapshot parked on `window` would not survive it.

      It was the last section in the file until WO-3.9 added one below it, so the cleanup is now load
      bearing as well as polite: the section under this one plants a class of its own and reads a
      whole document back through the seam. It would have been cleaned up either way, because a run
      that left a fixture class in the teacher's own browser is a run that wrote student data nobody
      asked for — and this one's fixture has a support block in it.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return 0;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){ return x.id !== '${CLS}'; });
        doc.students = doc.students.filter(function(x){
          return String(x.id).indexOf('wo37-') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){ return a.classId !== '${CLS}'; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (String(k).indexOf('a37') === 0) delete doc.scores[k]; });
        doc.attendance = doc.attendance.filter(function(r){ return r.classId !== '${CLS}'; });
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
