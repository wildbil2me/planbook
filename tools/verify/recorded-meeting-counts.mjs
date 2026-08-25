/* recorded-meeting-counts.mjs — recorded-meeting counts and Roll Call! percentage (WO-2.4)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, evalJs, has, clickSel } = h;

/* ───────── recorded-meeting counts and Roll Call! percentage (WO-2.4) ───────── */
console.log('\n--- recorded-meeting counts and Roll Call! percentage (WO-2.4) ---');
{
  const result = await evalJs(`(function(){
    var s = window.planbook.store, a = window.planbook.attendance;
    var classes = window.planbook.classes, d = s.getDoc();
    var cls = (d.classes || [])[0], student = cls && (cls.roster || [])[0];
    /* A MISSING FIXTURE IS A FAILURE, NOT A SKIP. This returned null, and the caller turned that
       into one skip() that swallowed all ten checks while the suite still exited 0 — the same
       shape as the term guard below, one level up, and the reason it is spelled out twice is that
       this file produced it twice. The caller now asserts on fixture presence, so a class or
       roster that changes under this block fails loudly instead of quietly measuring nothing.
       NO BACKTICKS IN THIS COMMENT — it lives inside a template literal. */
    if (!cls || !student) {
      return { fixture:false,
        why: cls ? 'the first class has an empty roster' : 'no class in the document' };
    }
    /* What the screen was showing before this block moved it. selectClass() navigates since
       WO-1.13 and writes the openClassId preference, so a block that calls it and walks away
       leaves the next section on a different class and a different view. This one is currently
       last in the file, which makes that harmless TODAY and a trap for whoever appends after it —
       the sections at the touch-target sweep restore both, and so does this now. */
    var oldClassId = classes.getSelectedClassId();
    var classViewEl = document.getElementById('classView');
    var oldView = classViewEl && !classViewEl.classList.contains('hidden') ? 'class' : 'home';
    classes.selectClass(cls.id);
    /* NARROWED 2026-08-08. This read "if (!term) return null", which turned one missing term into
       ten skipped checks while the suite still exited 0 — and a check that cannot run is the same
       defect as one that cannot fail. Only the two rendered-DOM checks below need a live selected
       term to write dates onto; the other eight build their own window object and never touch it.
       A missing term now costs exactly those two, and says so.
       NO BACKTICKS IN THIS COMMENT — it lives inside a template literal. */
    var oldAttendance = JSON.stringify(d.attendance || []), oldEvents = JSON.stringify(d.events || []);
    var oldStudents = JSON.stringify(d.students || []), oldRoster = JSON.stringify(cls.roster || []);
    var oldTerms = JSON.stringify(cls.terms || []);
    /* AND IF IT HAS NONE, LEND IT ONE. The fixture class is the legacy no-terms shape on purpose
       (see the seeding comment far above), so asking it for a term and giving up is how ten checks
       came to skip on every run. The id is shaped like a generated one because this document is
       read by id-format checks; it is removed again in the restore below, so nothing downstream
       sees it either way. Dates start empty, which is what newTerm() ships and is a valid term. */
    if (!(cls.terms || []).length) {
      cls.terms = [{ id:'tm_wo24fixt', label:'Quarter 1', start:'', end:'' }];
    }
    var term = classes.getSelectedTerm();
    var oldTerm = term ? {start:term.start, end:term.end} : null;
    var dates = ['2026-09-01','2026-09-03','2026-09-08','2026-09-11','2026-09-14',
      '2026-09-18','2026-09-21','2026-09-24','2026-09-29','2026-10-02'];
    d.attendance = dates.map(function(date, i){ return { classId: cls.id, date: date,
      marks: i === 4 ? Object.fromEntries([[student, {code:'E'}]]) : {} }; });
    d.attendance.push({classId:cls.id,date:'2026-09-04',exception:'dropped'});
    d.attendance.push({classId:'another-class',date:'2026-10-06',marks:{}});
    d.events = [{id:'fixture-day-off',kind:'no-school',title:'Fixture holiday',
      date:'2026-09-07',endDate:'2026-09-07',classIds:[]}];
    var excused = a.attendanceTotals(cls.id, student);
    var fixtureStudent = 'wo-2-4-no-marks';
    d.students.push({id:fixtureStudent,first:'Fixture',last:'Student'});
    cls.roster.push(fixtureStudent);
    var noMarks = a.attendanceTotals(cls.id, fixtureStudent);
    var dated = a.termTotals(cls.id, fixtureStudent,
      {start:'2026-09-01',end:'2026-09-14'});
    var datedDom = null, undatedDom = null;
    if (term) {
      term.start = '2026-09-01'; term.end = '2026-09-14';
      a.renderAttendance();
      datedDom = {
        classText:(document.getElementById('attendanceTotals') || {}).textContent || '',
        studentText:((document.querySelector('[data-attendance-row="' + fixtureStudent
          + '"] .attendance-student-totals') || {}).textContent || '')
      };
      term.start = ''; term.end = ''; a.renderAttendance();
      undatedDom = {
        classText:(document.getElementById('attendanceTotals') || {}).textContent || '',
        studentText:((document.querySelector('[data-attendance-row="' + fixtureStudent
          + '"] .attendance-student-totals') || {}).textContent || '')
      };
    }
    d.attendance.push({classId:cls.id,date:'2026-10-05',
      marks:Object.fromEntries([[student,{code:'U'}]])});
    var withU = a.attendanceTotals(cls.id, student);
    var zero = a.attendanceTotals(cls.id, 'student-with-no-meetings', '2030-01-01', '2030-12-31');
    /* TEN, NOT THREE. At N=3 the three newest dates were all plain meetings and the dropped day
       sat outside the window entirely, so a lastMeetings() that never excluded dropped days would
       have passed a check whose name claims it counts meetings rather than days. Ten reaches back
       across 2026-09-04 (dropped) and 2026-09-07 (no school, no record), so both now have to be
       skipped for this to pass. The expected list is every taken date but the oldest. */
    var last = a.lastMeetings(cls.id, 10, '2026-10-31');
    var snowBefore = a.stateOf(cls.id, '2026-09-03');
    d.events.push({id:'retro-snow',kind:'no-school',title:'Retroactive snow',
      date:'2026-09-03',endDate:'2026-09-03',classIds:[]});
    var snowAfter = a.stateOf(cls.id, '2026-09-03');
    d.attendance = JSON.parse(oldAttendance); d.events = JSON.parse(oldEvents);
    d.students = JSON.parse(oldStudents); cls.roster = JSON.parse(oldRoster);
    if (term && oldTerm) { term.start = oldTerm.start; term.end = oldTerm.end; }
    cls.terms = JSON.parse(oldTerms);
    a.renderAttendance();
    return {fixture:true, excused:excused, withU:withU, noMarks:noMarks, dated:dated,
      datedDom:datedDom, undatedDom:undatedDom, hadTerm:!!term, zero:zero, last:last,
      snowBefore:snowBefore, snowAfter:snowAfter,
      oldClassId:oldClassId, oldView:oldView};
  })()`);
  /* Asserted rather than skipped. See the note at the top of the block: a fixture that has gone
     missing must cost a red line, because the alternative is ten checks silently measuring
     nothing behind a green summary — which is what this block did until 2026-08-08. */
  check('the WO-2.4 fixture has a class with a roster member to count',
    !!result && result.fixture === true,
    result ? (result.why || 'class and roster member present') : 'the block did not run at all');
  if (result && result.fixture) {
    check('one excused absence in ten recorded meetings is 100%, with E in the numerator',
      result.excused.E === 1 && result.excused.P === 9 && result.excused.percent === 100,
      JSON.stringify(result.excused));
    check('U folds into A in totals and the denominator, without becoming a sixth displayed mark',
      result.withU.A === 1 && result.withU.meetings === 11
        && Math.abs(result.withU.percent - (10 / 11 * 100)) < 0.000001,
      JSON.stringify(result.withU));
    /* `excused.meetings === 10` is the conjunct that earns this check its name. It used to assert
       only `withU.meetings === 11` — the fact the line above already proves — so it could not fail
       independently of its neighbour, which is this work order's own recurring defect. The `withU`
       conjunct is KEPT rather than replaced: the two together say the denominator is right before
       and after the `U` row lands. The fixture lays down 12 attendance rows for this class
       (10 taken + 1 `dropped` + 1 on another-class) plus a no-school event, so 10 is the number
       that proves all three are excluded, and it is read BEFORE the `U` row exists. */
    check('dropped, no-school, untaken, and another class are absent from the denominator',
      result.excused.meetings === 10 && result.withU.meetings === 11,
      JSON.stringify({excused:result.excused.meetings, withU:result.withU.meetings}));
    check('a roster student absent from every marks object reads present at all ten meetings',
      result.noMarks.P === 10 && result.noMarks.meetings === 10 && result.noMarks.percent === 100,
      JSON.stringify(result.noMarks));
    check('termTotals applies an actual dated term window',
      result.dated.P === 5 && result.dated.meetings === 5 && result.dated.percent === 100,
      JSON.stringify(result.dated));
    /* These two, and only these two, need a live selected term to write dates onto. They skip on
       their own rather than through the block's front door — see the NARROWED note above. `(^|[^0-9])`
       in front of the 5 because a bare /5 recorded meetings/ also matches "15 recorded meetings",
       which is the assertion passing on a number it was written to reject. */
    if (!result.hadTerm) {
      skip('rendered class and student surfaces show dated-term and year counts',
        'the fixture class carries no term');
      skip('an undated term is disclosed instead of wearing its label over year totals',
        'the fixture class carries no term');
    } else {
      check('rendered class and student surfaces show dated-term and year counts',
        /(^|[^0-9])5 recorded meetings/.test(result.datedDom.classText)
          && /Year: 10 recorded meetings/.test(result.datedDom.classText)
          && /P 5/.test(result.datedDom.studentText) && /100%/.test(result.datedDom.studentText),
        JSON.stringify(result.datedDom));
      check('an undated term is disclosed instead of wearing its label over year totals',
        /Term dates not set/.test(result.undatedDom.classText)
          && /Year: 10 recorded meetings/.test(result.undatedDom.classText)
          && /Term dates not set/.test(result.undatedDom.studentText)
          && /Year/.test(result.undatedDom.studentText) && !/Quarter 1/.test(result.undatedDom.classText),
        JSON.stringify(result.undatedDom));
    }
    check('zero recorded meetings returns null percentage, not NaN or zero',
      result.zero.meetings === 0 && result.zero.percent === null, JSON.stringify(result.zero));
    /* Ten deep, so the window spans the dropped day and the no-school day and both have to be
       absent from the answer for this to pass — see the note at the call site. 2026-09-01 is the
       eleventh-newest meeting and is correctly off the end. */
    check('last N meetings is class-scoped, newest first, and counts meetings rather than days',
      JSON.stringify(result.last) === JSON.stringify(['2026-10-05','2026-10-02','2026-09-29',
        '2026-09-24','2026-09-21','2026-09-18','2026-09-14','2026-09-11','2026-09-08','2026-09-03']),
      JSON.stringify(result.last));
    check('a retroactive no-school event cannot erase an already recorded meeting',
      result.snowBefore === 'taken' && result.snowAfter === 'taken',
      result.snowBefore + ' -> ' + result.snowAfter);
  }
  /* Put the screen back where it was found. The document is restored inside the block, but the
     SELECTION and the VIEW are not part of the document — selectClass() writes a preference and
     navigates, so this is undone here through the same seam and the same control the touch-target
     sweeps use rather than by toggling `hidden` by hand, which would be a second copy of
     src/views.js's showView() living in the harness.

     Order matters: selectClass() navigates to the class view, so the selection is restored FIRST
     and the walk back to home comes after it. */
  if (result && result.oldClassId) {
    await evalJs('window.planbook.classes.selectClass('
      + JSON.stringify(result.oldClassId) + ');1');
  }
  if (result && result.oldView === 'home' && await has('#classTabBar [data-view-home]')) {
    await clickSel('#classTabBar [data-view-home]');
  }
}
}
