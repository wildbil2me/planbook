/* term-nav.mjs — the term nav repaints the screen it is sitting on (WO-2.17)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, evalJs, has, clickSel } = h;

/* ───────── the term nav repaints the screen it is sitting on (WO-2.17) ─────────
 *
 * THE SIBLING OF THE TERM-SWITCH CHECK IN THE SECTION ABOVE, and it is here because that block's
 * own comment left the registry's half "to whoever owns it". This is that half. `selectTerm()`
 * wrote the preference, repainted the class bar and said the new term out loud, and the totals line
 * an inch below the nav went on reporting the term the teacher had just left. It came right on the
 * next repaint from any other cause, which is what kept it invisible for a phase: mark one student
 * and the numbers jump, and the jump reads as the mark landing rather than as the term arriving.
 *
 * THE FIXTURE IS TWO DATED TERMS OVER RECORDS THIS BLOCK PLANTS — three meetings inside one window
 * and five inside the other — because the claim is a NUMBER that has to move, not a repaint that
 * has to happen. A check that only read the label at the front of the line would go green against a
 * build that redrew that line out of the same stale totals. The whole document is snapshotted here
 * and put back at the foot of the block, the way the WO-2.13 timing fixture does it.
 *
 * TWO KINDS OF SENTINEL, and they are what make this work order's Traps line measurable instead of
 * a matter of reading the diff. A `data-wo217-sentinel` attribute on one row of the grid survives a
 * repaint of the figures and does NOT survive `renderAttendance()`, which empties tbody and builds
 * it again — so the check that says "the figures, not the grid" goes red against the blanket fix as
 * well as against no fix at all. And the totals element is overwritten by hand before every term tap
 * made from a screen that is NOT the registry, so "a screen that does not read the term is not
 * repainted" is asserted as text still sitting there afterwards rather than inferred from which
 * branch src/shell.js took.
 *
 * ONE MORE CHECK HANGS OFF THIS FIXTURE (WO-2.18), and it is not a defect in what WO-2.17 shipped —
 * it is the check that would notice if it stopped being right.
 *
 *   THERE WERE TWO UNTIL WO-2.53. The other one opened the row's ⋯ panel through the real button
 *   before the term tap and asserted its figures, because that panel was the third surface
 *   paintRenderedTotals() painted and the seven checks above assert the first two — and a check that
 *   asserts two of three painted surfaces licenses the third to be deleted. WO-2.53 deleted the panel
 *   itself, and with it the surface: what that function paints now is the class line, the row lines
 *   and WO-2.51's band, all three of them asserted. The reasoning is kept because it is the rule, not
 *   the check: a painted surface nobody asserts is a painted surface a later work order can delete
 *   for free.
 *
 *   AND selectTerm() IS DRIVEN WITH ANOTHER CLASS'S TERM ID, at the foot of the block. WO-2.17's
 *   fourth acceptance line asks that it return without writing in that case; nothing here ever asked
 *   it to, so that half was settled by reading the two-line guard, which is the condition under which
 *   a guard gets refactored away. The failure it prevents is a preference naming a term the open
 *   class does not have — the case src/classes.js keys the whole preference per class to avoid — so
 *   what is asserted is the absence of all three of its writes: the preference byte for byte, the
 *   nav's own active mark, and the live region, which is pre-filled with a sentence of this file's
 *   own so that silence is text still sitting there rather than an empty string that was always
 *   empty. announce() defers its write a tick (src/live-region.js), so that read waits.
 */
console.log('\n--- the term nav repaints the screen it is sitting on (WO-2.17) ---');
{
  const TERM_A = 'tm_wo217a', TERM_B = 'tm_wo217b';
  const LABEL_A = 'WO-2.17 early', LABEL_B = 'WO-2.17 late';
  /*
    BOTH TERMS' ENDS ARE DERIVED AND BOTH TERMS HAVE TO CONTAIN TODAY, and this fixture is the first
    thing two work orders in a row have broken — worth the paragraphs, because both breakages are
    the feature working.

    WO-2.50 broke it first. Both terms used to be written out as fixed February and March windows,
    which left TODAY outside every term of the fixture class; from WO-2.50 on that means the registry
    draws today's column locked and offers no ⋯, and the block below opens the ⋯ before it reads
    anything. It crashed on a correct app. The late term's end moved to a year from today.

    WO-2.52 broke the other one. The strip is built from anchorDate() now, which stands on the
    SELECTED term's edge when today is outside it — so with the early term selected and running Feb
    2 to Feb 6, the registry opened on February, no column was editable, and the ⋯ was gone again.
    So the early term now ends TODAY, and both terms hold today: the anchor is today under either,
    which is what keeps this block asking about the FIGURES rather than about the strip. It is also
    what keeps WO-2.18's sentinel claim honest here — a term tap that does not move the anchor does
    not rebuild the grid, and that is the claim this block was written to make.

    THE RECORDS MOVED WITH THE DATES AND THE TWO COUNTS DID NOT. The two figures this block asserts
    are counts over these ranges, so the five that belong to the late term can no longer sit in March
    — the early term now covers March. They sit on the five weekdays AFTER today instead, which are
    inside the late term, outside the early one, and (since WO-2.52) perfectly ordinary days for a
    class whose term dates say it meets on them. Three and five, exactly as before.

    Derived from the clock rather than typed for the reason nodeColumns() is derived further down —
    a date written out here stops containing today the moment the calendar passes it. That helper is
    defined below this block and cannot be reached from it, hence the two closures.
  */
  const WO217_ISO = (d) => {
    const p = (x) => (x < 10 ? '0' : '') + x;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };
  const WO217_TODAY = WO217_ISO(new Date());
  const WO217_END = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return WO217_ISO(d);
  })();
  /* The five weekdays after today, walked the same way nodeWeekdayAhead() walks them further down —
     Mon-Fri only, so the late term's meetings land on days a school year has. */
  const WO217_AHEAD = (() => {
    const d = new Date();
    const out = [];
    while (out.length < 5) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) out.push(WO217_ISO(d));
    }
    return out;
  })();
  /* Written out in full rather than pattern-matched: this is the sentence a teacher reads under the
     term nav, and both halves of it — which term, and how many meetings in it — are the claim. */
  const LINE_A = LABEL_A + ': 3 recorded meetings · Year: 8 recorded meetings';
  const LINE_B = LABEL_B + ': 5 recorded meetings · Year: 8 recorded meetings';
  const ROW_A = LABEL_A + ' · P 3 · T 0 · A 0 · E 0 · D 0 · 100%';
  const ROW_B = LABEL_B + ' · P 5 · T 0 · A 0 · E 0 · D 0 · 100%';
  const SENTINEL = 'WO-2.17 sentinel — this screen was not repainted';
  const SR_SENTINEL = 'WO-2.18 sentinel — nothing was announced';

  const plant = await evalJs(`(function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var clsId = c.getSelectedClassId();
    var cls = (d.classes || []).filter(function(x){ return x.id === clsId; })[0];
    if (!cls) return { ok:false, why:'no class is open, so there is no term nav to tap' };
    /* Parked on the window rather than carried back through this call: the teardown at the foot of
       the block has to put the SAME object graph back, and a document that made the round trip
       through CDP would come back as a copy of a copy. NO BACKTICKS IN THIS COMMENT. */
    window.__wo217 = { doc: JSON.stringify(d), classId: clsId, termId: c.getSelectedTermId() };
    /* Read back so the fixture check below can say in one place whether today is inside a term of
       this class — which is now a precondition of the ⋯ being drawn at all (WO-2.50). A fixture
       that has silently stopped holding should print a sentence, not throw at a click.
       NO BACKTICKS IN THIS COMMENT: it is inside a template literal. */
    window.__wo217today = a.todayISO();
    s.update(function(doc){
      cls.terms = [
        { id:'tm_wo217a', label:'WO-2.17 early', start:'2026-02-02',
          end:${JSON.stringify(WO217_TODAY)} },
        { id:'tm_wo217b', label:'WO-2.17 late', start:'2026-03-02',
          end:${JSON.stringify(WO217_END)} }
      ];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(cls.roster)) cls.roster = [];
      doc.attendance = doc.attendance.filter(function(r){ return r.classId !== clsId; });
      ['2026-02-02','2026-02-03','2026-02-04']
        .concat(${JSON.stringify(WO217_AHEAD)}).forEach(function(date){
          doc.attendance.push({ classId: clsId, date: date, marks: {} }); });
      doc.students.push({ id:'wo217-student', first:'Term', last:'Probe' });
      cls.roster.push('wo217-student');
    });
    /* Whatever the sections above left on the toolbar, so the planted row is drawn and its totals
       are the whole roster's arithmetic rather than a filtered subset's. */
    a.setSearch(''); a.setFilter('all');
    c.selectClass(clsId);
    a.renderAttendance();
    return { ok:true, classId: clsId, name: cls.name };
  })()`);

  const READ = `(function(){
    var nav = document.getElementById('termNav');
    var btns = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
    var row = document.querySelector('[data-attendance-row="wo217-student"]');
    var line = row ? row.querySelector('.attendance-student-totals') : null;
    var up = function(id){ var el = document.getElementById(id);
      return !!(el && !el.classList.contains('hidden')); };
    return {
      terms: btns.map(function(b){ return { id: b.getAttribute('data-term-select'),
        label: b.textContent, active: b.classList.contains('active') }; }),
      classText: (document.getElementById('attendanceTotals') || {}).textContent || '',
      rowText: line ? line.textContent : '',
      sentinel: !!(row && row.getAttribute('data-wo217-sentinel')),
      summary: (document.getElementById('assignmentsSummary') || {}).textContent || '',
      registryUp: up('classView'), listUp: up('assignmentsView'), homeUp: up('homeView') }; })()`;

  if (!plant.ok) {
    check('the WO-2.17 fixture is real: the registry is up, over two dated terms whose windows hold three meetings and five',
      false, plant.why);
  } else {
    await evalJs(`(function(){ var row = document.querySelector('[data-attendance-row="wo217-student"]');
      if (row) row.setAttribute('data-wo217-sentinel', '1'); return !!row; })()`);
    const before = await evalJs(READ);
    const todayIn = await evalJs(`(function(){
      var c = window.planbook.classes;
      return !!c.termContaining(c.getSelectedClassId(), window.__wo217today); })()`);
    check('the WO-2.17 fixture is real: the registry is up, over two dated terms whose windows hold three meetings and five, one of which contains today',
      todayIn && before.registryUp && before.terms.length === 2
        && before.terms[0].id === TERM_A && before.terms[1].id === TERM_B
        && before.terms[0].active && !before.terms[1].active
        && before.classText === LINE_A && before.rowText === ROW_A && before.sentinel,
      JSON.stringify(before.terms.map((t) => t.label + (t.active ? ' (open)' : ''))) + ' :: '
        + JSON.stringify(before.classText) + ' :: ' + JSON.stringify(before.rowText)
        + ' :: today falls inside a term of this class = ' + todayIn + ' (the late term runs '
        + '2026-03-02 … ' + WO217_END + ')');

    await clickSel('#termNav [data-term-select="' + TERM_B + '"]');
    const after = await evalJs(READ);
    check('switching term on the attendance registry updates the totals line in the same paint — no mark, no reload, no second tap',
      before.classText === LINE_A && after.classText === LINE_B
        && !!(after.terms[1] || {}).active,
      JSON.stringify(before.classText) + ' -> ' + JSON.stringify(after.classText));
    check('and each student\'s own term line goes with it, rather than the class figure moving alone',
      before.rowText === ROW_A && after.rowText === ROW_B,
      JSON.stringify(before.rowText) + ' -> ' + JSON.stringify(after.rowText));
    /* THE THIRD SURFACE WAS A CHECK HERE UNTIL WO-2.53, AND WHAT IT WATCHED NO LONGER EXISTS.
       WO-2.18's reasoning was that paintRenderedTotals() painted three surfaces and these checks
       asserted two, which licenses the third to be deleted; the third was the open row detail panel,
       and WO-2.53 deleted the panel. What that function paints now is the class line, one line per
       row, and WO-2.51's band — all three asserted, the first two here and the band in its own block
       — so the license this check was written to withdraw is not open again. The history dialog is
       not a fourth: it is built when it opens and no term tap reaches it, which is why re-pointing
       this check at it would have asserted a repaint that does not happen. */
    /* THE TRAP, MEASURED. Repainting the whole registry would make the two checks above pass and
       this one fail: the marked row would be a different element by then. The registry's columns are
       a window of dates and do not move when the term does, so a term change owes the teacher the
       figures and nothing else — src/attendance.js's own history is one long argument about paint
       cost (WO-2.13 exists because the totals were computed once per student). */
    check('the term change repaints the figures and not the grid under them — the rows the teacher was looking at are the same elements',
      after.sentinel && after.rowText !== before.rowText,
      'the marked row survived the switch = ' + after.sentinel + ', and its totals moved = '
        + (after.rowText !== before.rowText));

    /* THE OTHER SCREEN THE NAV SITS ON, which is WO-3.3's line and must not regress — and the same
       tap must leave the registry it is not on alone. */
    await clickSel('#classView [data-class-screen="assignments"]');
    await evalJs(`(function(){ var t = document.getElementById('attendanceTotals');
      if (t) t.textContent = ${JSON.stringify(SENTINEL)}; return 1; })()`);
    await clickSel('#termNav [data-term-select="' + TERM_A + '"]');
    const onList = await evalJs(READ);
    check('switching term on the assignment list still repaints it, and the tap is the only action it takes',
      onList.listUp && !onList.registryUp
        && onList.summary.indexOf('Assignments · ' + LABEL_A + ' · ') === 0
        && !!(onList.terms[0] || {}).active,
      JSON.stringify(onList.summary.slice(0, 64)));
    check('and the registry is not repainted from under the assignment list, because it is not the screen that is up',
      onList.classText === SENTINEL,
      JSON.stringify(onList.classText.slice(0, 64)));

    /* AND FROM THE CLASS GRID, where the term nav is still drawn and no class screen is on the
       glass. Nothing in <main> reads the term there, so nothing in <main> is repainted — asserted
       against both class screens at once, with the nav's own active mark as the proof that the tap
       landed at all. A blanket repaint passes every check above this one and fails this. */
    await clickSel('#assignmentsView [data-view-home]');
    await evalJs(`(function(){
      var t = document.getElementById('attendanceTotals');
      var s = document.getElementById('assignmentsSummary');
      if (t) t.textContent = ${JSON.stringify(SENTINEL)};
      if (s) s.textContent = ${JSON.stringify(SENTINEL)};
      return 1; })()`);
    await clickSel('#termNav [data-term-select="' + TERM_B + '"]');
    const onHome = await evalJs(READ);
    check('a term change made from the class grid repaints neither class screen — the fix is a chain, not a blanket repaint of everything',
      onHome.homeUp && !onHome.registryUp && !onHome.listUp
        && onHome.classText === SENTINEL && onHome.summary === SENTINEL
        && !!(onHome.terms[1] || {}).active,
      'class grid up = ' + onHome.homeUp + ', the nav moved to '
        + JSON.stringify((onHome.terms[1] || {}).label) + ', both screens untouched = '
        + (onHome.classText === SENTINEL && onHome.summary === SENTINEL));

    /* A TERM ID FROM ANOTHER CLASS, AIMED AT THIS ONE (WO-2.18). There is no control that can do
       this — the nav only ever draws the open class's terms — so it goes through the seam, which is
       the same exception the future-date check in the attendance section names. What a restore, a
       hand edit or a class switched under a stale handler CAN produce is exactly this call, and the
       guard's whole job is that it writes nothing. Borrowed from whichever other class in the
       document carries a term rather than from a planted one: an id nothing else in this run has
       ever seen would be a weaker fixture than a real one belonging to a real class. */
    const foreign = await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc(), clsId = c.getSelectedClassId();
      var other = (d.classes || []).filter(function(x){
        return x.id !== clsId && (x.terms || []).length; })[0];
      if (!other) return { ok:false, why:'no other class in this document carries a term id to borrow' };
      var read = function(){
        var nav = document.getElementById('termNav');
        var btns = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
        return {
          pref: JSON.stringify(window.planbook.getPref('openTermIds') || {}),
          term: c.getSelectedTermId(),
          active: btns.filter(function(b){ return b.classList.contains('active'); })
            .map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
          offered: btns.map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
          totals: (document.getElementById('attendanceTotals') || {}).textContent || '' };
      };
      var live = document.getElementById('srLive');
      if (live) live.textContent = ${JSON.stringify(SR_SENTINEL)};
      var was = read();
      /* CAUGHT RATHER THAN LET FLY, and it is asserted below. A build whose guard is gone reaches
         term.label on a term this class does not have and throws — which writes no preference and
         announces nothing, so the three claims below would all be satisfied by a screen that had
         just broken. Caught here, it is one red check; uncaught, it is the whole run. */
      var threw = '';
      try { c.selectTerm(other.terms[0].id); } catch (e) { threw = String(e && e.message || e); }
      /* announce() clears and then writes on a 30ms timer so that an identical repeat reaches
         assistive tech as a change (src/live-region.js). Reading straight back would report
         silence from a build that spoke. */
      await new Promise(function(r){ setTimeout(r, 250); });
      return { ok:true, borrowed: other.terms[0].id, from: other.name,
        was: was, now: read(), said: live ? live.textContent : '', threw: threw };
    })()`);
    check('a term id belonging to ANOTHER class writes no preference, moves no highlight and announces nothing',
      foreign.ok && !foreign.threw && foreign.now.pref === foreign.was.pref
        && foreign.now.term === foreign.was.term
        && foreign.now.active === foreign.was.active
        && foreign.now.offered === foreign.was.offered
        && foreign.said === SR_SENTINEL
        && foreign.now.totals === SENTINEL,
      foreign.ok
        ? JSON.stringify(foreign.borrowed) + ' from ' + JSON.stringify(foreign.from) + ' :: '
          + 'preference ' + foreign.was.pref + ' -> ' + foreign.now.pref + ', open term '
          + JSON.stringify(foreign.was.term) + ' -> ' + JSON.stringify(foreign.now.term)
          + ', nav active ' + JSON.stringify(foreign.was.active) + ' -> '
          + JSON.stringify(foreign.now.active) + ', said ' + JSON.stringify(foreign.said)
          + (foreign.threw ? ', and it THREW: ' + foreign.threw : '')
        : foreign.why);

    /*
      The document back as it was, IN PLACE rather than as a fresh object — every module holds the
      reference getDoc() handed it — and the class and term this block found open put back with it.
      The section below reloads onto whatever is left here and expects to arrive inside a class, so
      the last act is selectClass(), exactly as the assignments teardown above ends on a tab.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo217, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      c.selectClass(saved.classId);
      /* The preference is still naming tm_wo217b, which no longer exists — resolved rather than
         trusted (src/classes.js), so this is tidiness and not a repair. */
      if (saved.termId) c.selectTerm(saved.termId);
      a.setSearch(''); a.setFilter('all'); a.renderAttendance();
      delete window.__wo217;
      await s.flush();
      return 1; })()`);
  }
}
}
