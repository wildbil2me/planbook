/* signal-engine.mjs — the signal engine and its thresholds (WO-4.1)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, evalJs, has, clickSel, seam } = h;

/* ───────── the signal engine and its thresholds (WO-4.1) ─────────
 *
 * WO-4.1 shipped src/signals.js and src/signal-settings.js and left this file unchanged by one
 * byte, so a green run said nothing whatever about either of them. This block is the correction,
 * and it is the same correction the grade-engine block above records: src/shell.js's comment over
 * the `signals` / `signalSettings` seam already argued that the evaluator has NO SCREEN in this
 * work order and that asking the module is therefore the only way to tell one build from another —
 * a purpose the repository did not fulfil until this block existed.
 *
 * FOUR THINGS NO CLICK AND NO ROUND FIXTURE CAN REACH, one per case below:
 *
 *   1. A STUDENT FAILING WITH PERFECT ATTENDANCE. The one shape that proves both directions out of
 *      a single pass AND the same student on both lists with two different sentences — and it is
 *      exactly what a generic strong-student / struggling-student fixture cannot express, because
 *      the struggling student in one of those is also the absent one.
 *   2. A GRADE INSIDE 0.005 OF THE LINE. src/signals.js's sayPercent() prints MORE decimals when
 *      the rounded figure stops satisfying the comparison its own sentence is making, and on round
 *      grades that branch never runs — so the whole of the rounded-lie defence is untested unless a
 *      grade is planted to land there. 64.9985% against the 65% line prints "65.00%" through the
 *      app's own formatter, and the sentence would then read "65.00%, below 65%".
 *   3. A PARTIAL WINDOW, AND A CLASS WITH NO RECORDED MEETINGS AT ALL. The short-window sentence
 *      and the `percent: null` no-window arm are both invisible against a class that always has its
 *      full twenty.
 *   4. WHAT THE RESET WROTE. src/signal-settings.js's resetThresholds() DELETES the keys rather
 *      than writing twenty-two numbers in, and those two builds look identical on screen and
 *      evaluate identically today — they diverge the day a shipped default is re-tuned. Only the
 *      document can tell them apart.
 *
 * EVERY EXPECTED SENTENCE BELOW IS A LITERAL, assembled by hand from the rule's own wording and
 * arithmetic done on paper — never by calling the module's formatters. That is the grade-engine
 * block's rule and it is load-bearing here for the same reason: a check that asked sayPercent()
 * what it made of 64.9985 would agree with itself perfectly and go green against a build that
 * rounded the sentence wrong.
 *
 * THE FIXTURE LIVES IN THE OPEN DOCUMENT AND IS TAKEN BACK OUT AGAIN. src/signals.js's header says
 * the document handed to evaluate() is expected to be the OPEN one, because the meetings half of
 * the answer comes from src/attendance.js and those helpers resolve against the store — so unlike
 * the grade-engine cases above, these cannot be handed a free-standing object. Everything is pushed
 * onto the open document inside ONE synchronous page-side block and truncated away at the end of
 * it, the way the WO-2.4 block above does; nothing calls update() in between, so no debounced save
 * can serialise a fixture, and the store is flushed before the block starts so that no earlier
 * write is still sitting on a timer.
 *
 * WHAT IS NOT HERE. The nine concern rules and the five praise rules — WO-4.2 and WO-4.3 own those,
 * and only two are registered today. Nothing below asserts how many rules exist, so this block does
 * not go red the day the other twelve land; it checks the behaviour of the pass and of the two
 * rules that are there. Nothing here reads a support, a plan or a medical need, because no rule
 * may (src/signals.js's header), and a fixture that planted one would be the first place a
 * disclosure could leak into a tool's output.
 */

console.log('\n--- the signal engine and its thresholds (WO-4.1) ---');
{
  const signalSeam = await evalJs(`(function(){ var p = window.planbook || {};
    return !!(p.signals && typeof p.signals.evaluate === 'function'
      && Array.isArray(p.signals.THRESHOLD_KEYS)
      && typeof p.signals.thresholdsOf === 'function'
      && typeof p.signals.changedThresholds === 'function'
      && p.signalSettings && typeof p.signalSettings.resetThresholds === 'function'); })()`);
  /* Asserted rather than skipped, for the reason the WO-2.4 block states above: the evaluator has
     no screen at all in this work order, so an absent seam is a defect and not a stage of the
     build — and a skip here would retire eleven checks behind a green summary. */
  check('the signal engine and the threshold panel are both reachable through window.planbook, '
    + 'which is the purpose src/shell.js states over that seam',
    signalSeam === true,
    signalSeam ? 'signals and signalSettings both present'
      : 'absent — nothing else in the repo calls evaluate(), so with the seam gone the two new '
        + 'modules are unreachable from here and unmeasured');

  if (signalSeam) {
    /* ── case 4: the panel, and what the reset actually wrote ──
     *
     * Driven through the controls a teacher touches — the door in the class manager, the real
     * number fields, the real Put-every-threshold-back button — because every one of them exists,
     * and src/shell.js's seam comment is explicit that `signalSettings` is here to READ the result
     * rather than to drive the feature.
     */

    /* Nothing above this is guaranteed to have left the screen clear; a section that skipped left
       whatever it had open. Same defensive close the letter-scale block above makes. */
    await evalJs(`['signalsModal','letterScaleModal','categoryRemoveModal','categoriesModal',
      'termsModal','studentModal','rosterModal','classesModal']
      .forEach(function(m){ window.planbook.closeModal(m); }); 1`);
    await clickSel('header [data-class-manage]');
    await clickSel('#classesModal [data-signal-panel]');

    const panel = await evalJs(`(function(){
      var m = document.getElementById('signalsModal');
      var c = document.getElementById('classesModal');
      var fields = Array.prototype.slice.call(
        document.querySelectorAll('#signalsModal [data-signal-threshold]'));
      return {
        open: !!m && !m.classList.contains('hidden'),
        stacked: !!c && !c.classList.contains('hidden'),
        keys: fields.map(function(f){ return f.getAttribute('data-signal-threshold'); }),
        types: fields.map(function(f){ return f.type; }),
        declared: window.planbook.signals.THRESHOLD_KEYS.slice(),
        groups: Array.prototype.slice.call(
          document.querySelectorAll('#signalList .modal-section-label'))
          .map(function(e){ return e.textContent; })
      }; })()`);
    /* TWENTY-TWO IS WRITTEN OUT rather than read off the module, and it is the vacuity guard for
       everything below: a panel that rendered the concern table and stopped would still match
       THRESHOLD_KEYS if the table itself had lost its other two groups. The nine concern rules,
       the five praise rules and the cooldown come to twenty-two numbers in
       docs/data-model.md § Signal thresholds, counted by hand. */
    check('the class manager opens the threshold panel over itself, with one numeric field per '
      + 'threshold this build names — all twenty-two, in the order the data model tabulates them, '
      + 'under Concern, Praise and Cooldown',
      panel.open && panel.stacked && panel.keys.length === 22
        && JSON.stringify(panel.keys) === JSON.stringify(panel.declared)
        && panel.types.every((t) => t === 'number')
        && JSON.stringify(panel.groups) === JSON.stringify(['Concern', 'Praise', 'Cooldown']),
      panel.keys.length + ' field(s) in ' + JSON.stringify(panel.groups) + ' :: '
        + JSON.stringify(panel.keys.slice(0, 4)) + ' …');

    /* The block as the document held it before this section touched it, put back at the end
       through update() so the write goes out the same door a teacher's does. */
    const signalsBefore = await evalJs(
      'JSON.stringify(window.planbook.store.getDoc().signals || {})');

    const typeThreshold = async (key, value) => await evalJs(`(function(){
      var f = document.querySelector('#signalsModal [data-signal-threshold="` + key + `"]');
      if (!f) return false;
      f.value = ` + JSON.stringify(String(value)) + `;
      f.dispatchEvent(new Event('input', { bubbles: true }));
      return true; })()`);
    const typedFirst = await typeThreshold('gradeBelow', 70);
    const typedLast = await typeThreshold('cooldownDays', 21);
    /* A key this build does not name, planted directly so that the reset below can be watched
       leaving it alone — src/signal-settings.js's resetThresholds() argues that deleting one would
       be throwing away somebody else's setting to tidy up, and nothing on screen can put one there. */
    await evalJs(`window.planbook.store.update(function(d){
      if (!d.signals || typeof d.signals !== 'object' || Array.isArray(d.signals)) d.signals = {};
      d.signals.wo41NotOurs = 7; }); 1`);

    const afterTyping = await evalJs(`(function(){
      var s = window.planbook.signals, d = window.planbook.store.getDoc();
      return { block: JSON.parse(JSON.stringify(d.signals || {})),
        changed: s.changedThresholds(d).slice(),
        note: (document.getElementById('signalNote') || {}).textContent || '' }; })()`);
    /* The first field of the first group and the last field of the last one, so a panel wired to
       only one of its three tables cannot pass this. */
    check('typing into two of the fields writes exactly those two keys and no others — the twenty '
      + 'a teacher has not touched are still absent from the document rather than seeded into it',
      typedFirst && typedLast
        && JSON.stringify(Object.keys(afterTyping.block).sort())
          === JSON.stringify(['cooldownDays', 'gradeBelow', 'wo41NotOurs'])
        && afterTyping.block.gradeBelow === 70 && afterTyping.block.cooldownDays === 21
        && JSON.stringify(afterTyping.changed) === JSON.stringify(['gradeBelow', 'cooldownDays'])
        && /^2 thresholds of 22 differ/.test(afterTyping.note),
      JSON.stringify(afterTyping.block) + ' :: ' + JSON.stringify(afterTyping.note.slice(0, 48)));

    await clickSel('#signalsModal [data-signal-reset]');
    const afterReset = await evalJs(`(function(){
      var s = window.planbook.signals, d = window.planbook.store.getDoc();
      var block = d.signals || {};
      return {
        stillPresent: s.THRESHOLD_KEYS.filter(function(k){
          return Object.prototype.hasOwnProperty.call(block, k); }),
        keysLeft: Object.keys(block).sort(),
        notOurs: block.wo41NotOurs,
        resolved: s.thresholdsOf(d),
        changed: s.changedThresholds(d).slice(),
        shown: Array.prototype.slice.call(
          document.querySelectorAll('#signalsModal [data-signal-threshold]'))
          .map(function(f){ return f.value; }),
        note: (document.getElementById('signalNote') || {}).textContent || ''
      }; })()`);
    /* THE CHECK THIS SECTION EXISTS FOR, in the sense that no other one can be made to see it: a
       build whose reset wrote the twenty-two shipped numbers into the document instead of removing
       the keys is indistinguishable from this one on screen, in changedThresholds(), and in every
       hit the evaluator returns today. The two diverge only when a default is re-tuned, at which
       point every teacher who ever pressed the button is pinned to a number she never chose. */
    check('the reset DELETES the twenty-two keys rather than writing twenty-two numbers into the '
      + 'document, and a key this build does not name survives it untouched',
      afterReset.stillPresent.length === 0
        && JSON.stringify(afterReset.keysLeft) === JSON.stringify(['wo41NotOurs'])
        && afterReset.notOurs === 7,
      'signals now holds ' + JSON.stringify(afterReset.keysLeft)
        + (afterReset.stillPresent.length
          ? ' — still carrying ' + JSON.stringify(afterReset.stillPresent) : ''));

    /* Every default written out by hand from docs/data-model.md § Signal thresholds — the two
       tables and the cooldown paragraph, read line by line. Never derived from defaultThreshold(),
       which is the number under test. */
    const SHIPPED = {
      gradeBelow: 65,
      gradeFellPoints: 10, gradeFellAssignments: 4,
      lowScoreRun: 3, lowScoreBelow: 60,
      missingCount: 3,
      attendanceBelow: 90,
      absenceCount: 4, absenceWindowMeetings: 20,
      absenceRun: 3,
      tardyCount: 5,
      behaviorCount: 2, behaviorWindowDays: 30,
      gradeRosePoints: 8, gradeRoseAssignments: 4,
      highScoreRun: 3, highScoreAtLeast: 90,
      turnaroundDays: 21,
      noMissingAssignments: 8,
      attendanceAtLeast: 100, attendanceWindowMeetings: 20,
      cooldownDays: 14,
    };
    const wrongAfterReset = panel.declared.filter((k) => afterReset.resolved[k] !== SHIPPED[k]);
    check('and all twenty-two resolve to the number docs/data-model.md tabulates, with the panel '
      + 'showing every one of them — an absent key IS its default, which is the whole reason the '
      + 'reset is allowed to be a delete',
      wrongAfterReset.length === 0
        && Object.keys(SHIPPED).length === 22
        && panel.declared.length === 22
        && afterReset.changed.length === 0
        && JSON.stringify(afterReset.shown)
          === JSON.stringify(panel.declared.map((k) => String(SHIPPED[k])))
        && /^All 22 thresholds are at the values Planbook ships with/.test(afterReset.note),
      wrongAfterReset.length
        ? 'resolved wrong: ' + JSON.stringify(wrongAfterReset.map((k) =>
          k + '=' + afterReset.resolved[k] + ' want ' + SHIPPED[k]))
        : 'all 22 at their shipped values, and the fields show '
          + JSON.stringify(afterReset.shown.slice(0, 4)) + ' …');

    /* Put the block back exactly as it was found, and flush — so the fixture block below runs with
       no debounced save pending, which is what keeps that fixture from ever reaching disk. */
    await evalJs(`window.planbook.store.update(function(d){
      d.signals = JSON.parse(` + JSON.stringify(signalsBefore) + `); }); 1`);
    await evalJs(`window.planbook.closeModal('signalsModal');
      window.planbook.closeModal('classesModal'); 1`);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');

    /* ── cases 1, 2 and 3: one pass over four planted classes ──
     *
     * ONE SYNCHRONOUS BLOCK. Nothing awaits inside it, so no timer can fire part-way through and no
     * save can see the fixture; the arrays are grown and then truncated back to the lengths they
     * were found at, and the score keys are deleted by name, so the document that comes out the far
     * side is the one that went in. That is the WO-2.4 block's shape with the JSON round-trip
     * replaced by truncation: replacing d.students wholesale hands every module holding a reference
     * to it a stale array, and there is no reason to.
     *
     * `through` is passed as a LITERAL DATE rather than left to default to today, so this block
     * reads the same in September as it does in June. NO BACKTICKS IN THIS COMMENT OR THE CODE
     * BELOW — it lives inside a template literal.
     */
    const engine = await evalJs(`(function(){
      var s = window.planbook.signals, d = window.planbook.store.getDoc();
      if (!Array.isArray(d.students) || !Array.isArray(d.attendance)
        || !Array.isArray(d.assignments) || !d.scores || typeof d.scores !== 'object') {
        return { fixture: false,
          why: 'the open document is missing one of students, attendance, assignments, scores' };
      }
      var students0 = d.students.length, attendance0 = d.attendance.length,
        assignments0 = d.assignments.length;
      var hadAtLeast = Object.prototype.hasOwnProperty.call(d.signals || {}, 'attendanceAtLeast');
      var oldAtLeast = (d.signals || {}).attendanceAtLeast;
      var scoreKeys = [];
      var THROUGH = '2026-09-30';

      function pad(n){ return (n < 10 ? '0' : '') + n; }
      /* One TAKEN meeting per date: a record with no exception is a meeting (src/attendance.js's
         stateOf), and a roster student with no entry in its marks object reads present. A single
         'A' is planted on the one day a fixture wants an absence. */
      function meet(classId, days, studentId, absentOnDay){
        for (var i = 1; i <= days; i++) {
          var marks = {};
          if (absentOnDay === i) marks[studentId] = { code: 'A' };
          d.attendance.push({ classId: classId, date: '2026-09-' + pad(i), marks: marks });
        }
      }
      function graded(classId, studentId, points, score){
        var id = classId + '-a1';
        d.assignments.push({ id: id, classId: classId, termId: 'wo41-t', categoryId: 'only',
          points: points });
        d.scores[id] = {}; d.scores[id][studentId] = { v: score };
        scoreKeys.push(id);
      }
      function person(id, first){ d.students.push({ id: id, first: first, last: 'Fixture' }); }
      /* One category at 100 so the weights balance and the class percentage IS the category's.
         The class object is handed straight to evaluate() rather than pushed onto d.classes: the
         meetings helpers resolve by classId, and nothing here needs a sixth class on the bar. */
      function room(id, name, roster){
        return { id: id, name: name, roster: roster,
          categories: [{ id: 'only', name: 'All work', weight: 100 }], terms: [] };
      }
      function run(cls){ return s.evaluate(d, cls, 'wo41-t', { through: THROUGH }); }

      /* A — failing, and present at every one of twenty recorded meetings. */
      person('wo41-s-a', 'Ada');
      var clsA = room('wo41-c-a', 'WO-4.1 Fixture A', ['wo41-s-a']);
      graded('wo41-c-a', 'wo41-s-a', 100, 55);
      meet('wo41-c-a', 20, 'wo41-s-a', 0);

      /* B — a grade 0.0015 under the 65 line, and attendance 0.0043 over a planted one. */
      person('wo41-s-b', 'Bo');
      var clsB = room('wo41-c-b', 'WO-4.1 Fixture B', ['wo41-s-b']);
      graded('wo41-c-b', 'wo41-s-b', 1000000, 649985);
      meet('wo41-c-b', 7, 'wo41-s-b', 4);

      /* C — six recorded meetings and no graded work at all. */
      person('wo41-s-c', 'Cy');
      var clsC = room('wo41-c-c', 'WO-4.1 Fixture C', ['wo41-s-c']);
      meet('wo41-c-c', 6, 'wo41-s-c', 0);

      /* D — graded, passing, and the class has never once been marked. */
      person('wo41-s-d', 'Di');
      var clsD = room('wo41-c-d', 'WO-4.1 Fixture D', ['wo41-s-d']);
      graded('wo41-c-d', 'wo41-s-d', 100, 90);

      var a = run(clsA), c = run(clsC), dHits = run(clsD);
      var bPlain = run(clsB);
      /* THE PRAISE LINE MOVED ONTO THE FIXTURE, and it has to be planted in the document rather
         than typed: the panel writes what formatWeight() prints and that is two decimals, so
         85.714 is not a number that field can hold. A hand-edited or restored file is where a
         value like this comes from, which is a case thresholdOf() is written for. It is also the
         only shape the OTHER arm of sayPercent() can take at all — a figure that rounds DOWN
         across its line needs a line with more than two decimals on it, because the nearest
         two-decimal value above 85.71 is 85.72 and that is above the attendance itself. */
      if (!d.signals || typeof d.signals !== 'object' || Array.isArray(d.signals)) d.signals = {};
      d.signals.attendanceAtLeast = 85.714;
      var bEdge = run(clsB);
      if (hadAtLeast) { d.signals.attendanceAtLeast = oldAtLeast; }
      else { delete d.signals.attendanceAtLeast; }

      var windowD = window.planbook.attendance.lastMeetings('wo41-c-d', 20, THROUGH);

      d.students.length = students0;
      d.attendance.length = attendance0;
      d.assignments.length = assignments0;
      scoreKeys.forEach(function(k){ delete d.scores[k]; });

      return { fixture: true, a: a, b: bPlain, bEdge: bEdge, c: c, d: dHits,
        windowD: windowD,
        restored: d.students.length === students0 && d.attendance.length === attendance0
          && d.assignments.length === assignments0
          && scoreKeys.every(function(k){ return !(k in d.scores); })
          && JSON.stringify(d.signals || {}) === ` + JSON.stringify(signalsBefore) + ` };
    })()`);

    check('the WO-4.1 fixture installed on the open document and was taken back off it again',
      !!engine && engine.fixture === true && engine.restored === true,
      engine ? (engine.why || ('restored: ' + engine.restored))
        : 'the block did not run at all');

    if (engine && engine.fixture) {
      /* Hand-written, every character of them. src/signals.js builds these out of who.className,
         fullName(), sayPercent() and sayNumber(); nothing below calls any of those. The typographic
         apostrophe is the one src/signals.js uses. */
      const A_CONCERN = 'In WO-4.1 Fixture A, Ada Fixture’s grade is 55.00%, below 65%.';
      const A_PRAISE = 'In WO-4.1 Fixture A, Ada Fixture’s attendance across the last '
        + '20 recorded meetings is 100.00%, at or above 100%.';
      const B_CONCERN = 'In WO-4.1 Fixture B, Bo Fixture’s grade is 64.999%, below 65%.';
      const B_PRAISE = 'In WO-4.1 Fixture B, Bo Fixture’s attendance across the last '
        + '7 recorded meetings is 85.714%, at or above 85.71%.';
      const C_PRAISE = 'In WO-4.1 Fixture C, Cy Fixture’s attendance across the last '
        + '6 recorded meetings is 100.00%, at or above 100%.';

      /* ── case 1 ── */
      check('ONE PASS returns both directions, and the student failing with perfect attendance '
        + 'comes back on both lists at once — one student, two hits, two different sentences, and '
        + 'neither hit knows it has a twin',
        engine.a.length === 2
          && engine.a[0].direction === 'concern' && engine.a[1].direction === 'praise'
          && engine.a[0].ruleId === 'grade-below' && engine.a[1].ruleId === 'attendance-window'
          && engine.a[0].studentId === 'wo41-s-a' && engine.a[1].studentId === 'wo41-s-a'
          && engine.a[0].classId === 'wo41-c-a' && engine.a[1].classId === 'wo41-c-a'
          && engine.a[0].termId === 'wo41-t' && engine.a[1].termId === 'wo41-t'
          && engine.a[0].explanation !== engine.a[1].explanation
          && engine.a[0].explanation === A_CONCERN && engine.a[1].explanation === A_PRAISE,
        engine.a.length + ' hit(s): '
          + JSON.stringify(engine.a.map((h) => h.direction + ' ' + h.ruleId)) + ' :: '
          + JSON.stringify(engine.a.map((h) => h.explanation)));

      /* The other half of "no explanation contains a placeholder or a rounded lie", swept over
         every hit this section produced rather than asserted on one. A sentence is what goes home
         to a guardian through WO-5.1's {{signals.list}}, so "undefined" or "NaN" in one is not a
         cosmetic defect. */
      const allHits = [].concat(engine.a, engine.b, engine.bEdge, engine.c, engine.d);
      const badSentence = allHits.filter((h) => !h.explanation
        || /\{\{|undefined|NaN|\[object|null/.test(h.explanation));
      const badNumbers = allHits.filter((h) => !h.numbers
        || Object.keys(h.numbers).length === 0
        || Object.keys(h.numbers).some((k) => !Number.isFinite(h.numbers[k])));
      /* EIGHT SINCE WO-4.2, AND THE TWO NEW ONES ARE THE ATTENDANCE RULES REACHING A FIXTURE THAT
         PREDATES THEM. WO-4.1 wrote these fixtures against the engine alone; WO-4.2 added the rule
         table, and Fixture B's student is 6 of 7 recorded meetings = 85.71%, which is below the
         90% line the work order documents. So the count is asserted at its new value rather than
         loosened to `>=`: the point of the number is that a rule appearing here without a decision
         behind it still turns this red. The rule ids are printed either way, so the next change to
         this set arrives with its own evidence instead of a bare count. */
      check('every hit carries a non-empty bag of finite numbers, and no sentence anywhere in this '
        + 'section holds a placeholder, an "undefined" or a NaN',
        allHits.length === 8 && badSentence.length === 0 && badNumbers.length === 0,
        allHits.length + ' hit(s) swept: '
          + JSON.stringify(allHits.map((h) => h.direction + ' ' + h.ruleId))
          + (badSentence.length ? ' :: bad sentence ' + JSON.stringify(badSentence[0]) : '')
          + (badNumbers.length ? ' :: bad numbers ' + JSON.stringify(badNumbers[0]) : ''));

      /* ── case 2 ── */
      /* FOUND BY RULE AND BY DIRECTION, NEVER BY INDEX. Both of these hits used to be the only one
         of their kind in their bag, so WO-4.1 could reach them at [0] and [1]; WO-4.2's attendance
         rules put a second hit in each and an index is now a claim about ORDER that neither check
         is trying to make (the ordering claim is the concern list's, asserted on the screen). */
      const bGrade = engine.b.find((h) => h.ruleId === 'grade-below');
      const bEdgePraise = engine.bEdge.find((h) => h.direction === 'praise');
      check('a grade of 64.9985% against the 65% line says 64.999%, NOT the "65.00%, below 65%" '
        + 'that two decimals would round it into — and the hit still carries the unrounded number',
        engine.b.length === 2 && !!bGrade && bGrade.explanation === B_CONCERN
          && Math.abs(bGrade.numbers.percentage - 64.9985) < 1e-9
          && bGrade.numbers.below === 65,
        engine.b.length + ' hit(s) :: '
          + JSON.stringify(engine.b.map((h) => h.ruleId)) + ' :: '
          + JSON.stringify(engine.b.map((h) => h.explanation)) + ' :: numbers '
          + JSON.stringify(bGrade && bGrade.numbers));

      /* The same escalation in the other direction, which is the other arm of satisfies() and the
         only fixture shape that can reach it — see the comment at the planted threshold above. The
         line itself prints as 85.71 because a threshold is written the way a teacher types one
         (src/categories.js's formatWeight, two decimals) while the measured figure keeps its
         third, which is what leaves the comparison in the sentence readable as true. */
      check('and the same escalation happens in the at-or-above direction: 85.714% against an '
        + '85.714 line, where two decimals would have printed 85.71% and read as false',
        engine.bEdge.length === 3 && !!bEdgePraise
          && bEdgePraise.explanation === B_PRAISE
          && bEdgePraise.numbers.meetings === 7 && bEdgePraise.numbers.attended === 6
          && bEdgePraise.numbers.asked === 20,
        JSON.stringify(engine.bEdge.map((h) => h.direction + ' ' + h.ruleId)) + ' :: '
          + JSON.stringify(engine.bEdge.map((h) => h.explanation)));

      /* ── case 3 ── */
      check('a class six recorded meetings into the term says SIX and is never padded up to the '
        + 'twenty it asked for — and its student, who has no graded work, is on no concern list',
        engine.c.length === 1 && engine.c[0].direction === 'praise'
          && engine.c[0].explanation === C_PRAISE
          && engine.c[0].numbers.meetings === 6 && engine.c[0].numbers.asked === 20,
        engine.c.length + ' hit(s) :: ' + JSON.stringify(engine.c.map((h) => h.explanation)));

      check('a class with no recorded meetings at all fires nothing — the no-window arm, not a '
        + 'rate of 0% and not one of 100%, on a class that does have graded work',
        engine.d.length === 0 && Array.isArray(engine.windowD) && engine.windowD.length === 0,
        engine.d.length + ' hit(s) :: '
          + JSON.stringify(engine.d.map((h) => h.explanation)) + ' :: lastMeetings returned '
          + JSON.stringify(engine.windowD));
    }

    /* ───────── a rule that cannot fire YET is a different sentence from a rule that is not built (WO-4.6) ─────────
     *
     * notYetRules() is the engine's second answer beside inertRules(): the rules whose own thresholds
     * ask for more term than this class holds on this date. It is proved BOTH WAYS here — a thin
     * term names exactly the expected set, a full term returns [] — and against the pass itself: no
     * rule the answer names is one evaluate() fired the same morning, which is the title's whole
     * claim and the property a mutation that named a full window would break.
     *
     * FOUR CLASSES, and each exists to make one arm falsifiable:
     *
     *   T  THIN — a term four days old with three assignments and three recorded meetings, and one
     *      student who has three low scores and three absences in a row. Three is the shipped
     *      threshold for low-score-run, missing-count, absence-run and high-score-run, so this class
     *      sits EXACTLY ON the edge of four rules: a build that named a rule at `have === want` would
     *      name two rules the pass is firing for this very student. The six it must name are the
     *      ones whose thresholds ask for four, five, eight, or twenty-one.
     *   F  FULL — nine assignments and twenty-five meetings reaching back thirty-four days. Nothing
     *      is short of anything and the answer must be [].
     *   E  EMPTY — a dated term starting today with nothing in it. All ten window-shaped rules are
     *      early, and the turnaround's sentence takes its "nothing dated yet" arm.
     *   R  REACH — two meetings this week and no assignments, whose one student gets a behavior
     *      entry dated twenty-five days back part-way through. Before the entry the turnaround is
     *      early (the record reaches back three days); after it the answer must NOT name the
     *      turnaround, because a behavior entry that old is a dated fact the concern list could have
     *      been reading three weeks ago. That is the log probe, and the reason it is a class-level
     *      reader rather than a per-student count.
     *
     * EVERY EXPECTED SENTENCE AND FIGURE IS A LITERAL, hand-derived from the shipped defaults in
     * docs/data-model.md and the rules' own null arms, for the reason the block above states.
     * Same fixture discipline as above: one synchronous page-side block, arrays grown and truncated,
     * score keys deleted by name, the log put back to the length it was found at. NO BACKTICKS IN
     * THIS COMMENT OR THE CODE BELOW.
     */
    const notYet = await evalJs(`(function(){
      var s = window.planbook.signals, d = window.planbook.store.getDoc();
      if (!Array.isArray(d.students) || !Array.isArray(d.attendance)
        || !Array.isArray(d.assignments) || !d.scores || typeof d.scores !== 'object') {
        return { fixture: false,
          why: 'the open document is missing one of students, attendance, assignments, scores' };
      }
      var students0 = d.students.length, attendance0 = d.attendance.length,
        assignments0 = d.assignments.length;
      var hadLog = Array.isArray(d.log);
      if (!hadLog) d.log = [];
      var log0 = d.log.length;
      var scoreKeys = [];
      var THROUGH = '2026-10-05';
      var TERM = 'wo46-t';

      function meet(classId, date, marks){
        d.attendance.push({ classId: classId, date: date, marks: marks || {} });
      }
      function graded(classId, n, studentId, score){
        var id = classId + '-a' + n;
        d.assignments.push({ id: id, classId: classId, termId: TERM, categoryId: 'only',
          points: 100 });
        if (studentId) { d.scores[id] = {}; d.scores[id][studentId] = { v: score }; scoreKeys.push(id); }
      }
      function person(id, first){ d.students.push({ id: id, first: first, last: 'Wo46' }); }
      function room(id, name, roster, start){
        return { id: id, name: name, roster: roster,
          categories: [{ id: 'only', name: 'All work', weight: 100 }],
          terms: [{ id: TERM, name: 'Term', start: start, end: '2026-12-18' }] };
      }
      function ask(cls){ return s.notYetRules(d, cls, TERM, { through: THROUGH }); }
      function fired(cls){
        return s.evaluate(d, cls, TERM, { through: THROUGH }).map(function(h){ return h.ruleId; });
      }

      /* T — thin: three assignments, three meetings, one student on the edge of four rules. */
      person('wo46-s-t', 'Tam');
      var clsT = room('wo46-c-t', 'WO-4.6 Thin', ['wo46-s-t'], '2026-10-01');
      graded('wo46-c-t', 1, 'wo46-s-t', 50);
      graded('wo46-c-t', 2, 'wo46-s-t', 40);
      graded('wo46-c-t', 3, 'wo46-s-t', 30);
      meet('wo46-c-t', '2026-10-01', { 'wo46-s-t': { code: 'A' } });
      meet('wo46-c-t', '2026-10-02', { 'wo46-s-t': { code: 'A' } });
      meet('wo46-c-t', '2026-10-05', { 'wo46-s-t': { code: 'A' } });

      /* F — full: nine assignments, twenty-five meetings from Sep 1. */
      person('wo46-s-f', 'Fay');
      var clsF = room('wo46-c-f', 'WO-4.6 Full', ['wo46-s-f'], '2026-09-01');
      for (var i = 1; i <= 9; i++) graded('wo46-c-f', i, 'wo46-s-f', 90);
      for (var m = 1; m <= 25; m++) meet('wo46-c-f', '2026-09-' + (m < 10 ? '0' : '') + m);

      /* E — empty: a term that starts today and holds nothing. */
      person('wo46-s-e', 'Eve');
      var clsE = room('wo46-c-e', 'WO-4.6 Empty', ['wo46-s-e'], '2026-10-05');

      /* R — reach: two meetings this week, and a behavior entry planted between two readings. */
      person('wo46-s-r', 'Rae');
      var clsR = room('wo46-c-r', 'WO-4.6 Reach', ['wo46-s-r'], '2026-10-01');
      meet('wo46-c-r', '2026-10-02');
      meet('wo46-c-r', '2026-10-05');

      var before = JSON.stringify(d);
      var t = ask(clsT), f = ask(clsF), e = ask(clsE), rBefore = ask(clsR);
      var tFired = fired(clsT);
      var after = JSON.stringify(d);

      d.log.push({ id: 'wo46-log-1', studentId: 'wo46-s-r', at: '2026-09-10T08:00:00',
        kind: 'behavior', subject: 'WO-4.6 fixture', body: '' });
      var rAfter = ask(clsR);

      var inert = s.inertRules();
      var wearing = s.signalRules().filter(function(r){ return r.inert; }).map(function(r){ return r.id; });

      d.students.length = students0;
      d.attendance.length = attendance0;
      d.assignments.length = assignments0;
      scoreKeys.forEach(function(k){ delete d.scores[k]; });
      if (hadLog) d.log.length = log0; else delete d.log;

      return { fixture: true, t: t, f: f, e: e, rBefore: rBefore, rAfter: rAfter,
        tFired: tFired, same: before === after, inert: inert, wearing: wearing,
        restored: d.students.length === students0 && d.attendance.length === attendance0
          && d.assignments.length === assignments0
          && scoreKeys.every(function(k){ return !(k in d.scores); })
          && (hadLog ? d.log.length === log0 : !('log' in d)) };
    })()`);

    check('the WO-4.6 fixture installed on the open document and was taken back off it again — '
      + 'four classes, their scores and one log entry',
      !!notYet && notYet.fixture === true && notYet.restored === true,
      notYet ? (notYet.why || ('restored: ' + notYet.restored)) : 'the block did not run at all');

    if (notYet && notYet.fixture) {
      const ids = (list) => list.map((r) => r.id);
      const figures = (list) => list.map((r) => r.id + ' ' + r.have + '/' + r.want + ' ' + r.unit);

      /* Registry order, which is the order inertRules() answers in and the order the settings
         panel draws. Each have/want pair is derived by hand: three assignments against a fall
         window of four that needs one more before it (5); three meetings inside an absence window
         wanting four absences; three term meetings against five tardies; four days of dated record
         (Oct 1 to Oct 5) against a look-back of twenty-one; three assignments against eight. */
      const T_IDS = ['grade-fell', 'absence-window', 'tardy-count', 'grade-rose', 'turnaround',
        'no-missing'];
      const T_FIGURES = ['grade-fell 3/5 assignments', 'absence-window 3/4 recorded meetings',
        'tardy-count 3/5 recorded meetings', 'grade-rose 3/5 assignments', 'turnaround 4/21 days',
        'no-missing 3/8 assignments'];
      const T_WHY = [
        'the term has 3 assignments so far; this rule wants 5 — 4 to measure across and one before them',
        'the class has 3 recorded meetings in this window so far; this rule wants 4 absences',
        'the term has 3 recorded meetings so far; this rule wants 5 tardies',
        'the term has 3 assignments so far; this rule wants 5 — 4 to measure across and one before them',
        'the dated record reaches back 4 days; this rule looks back 21 days',
        'the term has 3 assignments so far; this rule wants 8',
      ];
      const T_TEXT = ['Grade fell over recent work', 'Absences in a recent window', 'Tardies',
        'Grade rose over recent work', 'Came off the concern list',
        'Nothing missing over recent work'];
      const T_DIR = ['concern', 'concern', 'concern', 'praise', 'praise', 'praise'];
      const shaped = notYet.t.every((r) => typeof r.id === 'string' && typeof r.direction === 'string'
        && typeof r.text === 'string' && typeof r.why === 'string' && r.why.length > 0
        && Number.isFinite(r.have) && Number.isFinite(r.want) && typeof r.unit === 'string');
      check('a term four days old names exactly the six rules whose windows are not full — in '
        + 'registry order, each with its measured have/want and the unit they are counted in — and '
        + 'names none of the four rules whose threshold the term has exactly reached',
        JSON.stringify(ids(notYet.t)) === JSON.stringify(T_IDS)
          && JSON.stringify(figures(notYet.t)) === JSON.stringify(T_FIGURES)
          && JSON.stringify(notYet.t.map((r) => r.direction)) === JSON.stringify(T_DIR)
          && shaped,
        JSON.stringify(figures(notYet.t)));

      /* inertRules()' own four fields, and the sentence in them written out — the `why` a screen
         would print beside an inert rule's `why`, and the `text` that is ruleText()'s word for
         word, so the chip on the list and the line under it cannot come to say different things. */
      check('each entry carries the rule’s text from the settings table and a measured sentence '
        + 'a screen can print beside inertRules()’ own — six literal sentences, not one of them '
        + 'a placeholder',
        JSON.stringify(notYet.t.map((r) => r.text)) === JSON.stringify(T_TEXT)
          && JSON.stringify(notYet.t.map((r) => r.why)) === JSON.stringify(T_WHY),
        JSON.stringify(notYet.t.map((r) => r.text + ' — ' + r.why)));

      /* THE TITLE'S CLAIM, against the pass itself. Tam has three low scores and three absences in
         a row, so low-score-run and absence-run FIRE this morning — and both sit at exactly their
         threshold, so a build that compared with <= instead of < would name two rules the pass just
         returned hits for. The four fired ids are asserted so that an empty intersection cannot be
         an empty pass. */
      const overlap = ids(notYet.t).filter((id) => notYet.tFired.indexOf(id) >= 0);
      check('no rule the answer names is one evaluate() fired the same morning — the thin class’s '
        + 'student trips four concern rules, two of them at exactly the threshold the term has just '
        + 'reached, and none of the four is on the not-yet list',
        overlap.length === 0
          && JSON.stringify(notYet.tFired.slice().sort())
            === JSON.stringify(['absence-run', 'attendance-below', 'grade-below', 'low-score-run']),
        'fired ' + JSON.stringify(notYet.tFired) + ' :: overlap ' + JSON.stringify(overlap));

      check('a full term behind the same date returns [] — and inertRules() is [] beside it, with '
        + 'no rule in the registry wearing an inert string to mean "early"',
        Array.isArray(notYet.f) && notYet.f.length === 0
          && Array.isArray(notYet.inert) && notYet.inert.length === 0
          && notYet.wearing.length === 0,
        'notYetRules ' + JSON.stringify(figures(notYet.f)) + ' :: inertRules '
          + JSON.stringify(notYet.inert) + ' :: inert strings on ' + JSON.stringify(notYet.wearing));

      const E_IDS = ['grade-fell', 'low-score-run', 'missing-count', 'absence-window', 'absence-run',
        'tardy-count', 'grade-rose', 'high-score-run', 'turnaround', 'no-missing'];
      const eTurn = notYet.e.filter((r) => r.id === 'turnaround')[0];
      check('a dated term that starts today and holds nothing names all ten window-shaped rules '
        + 'and no level rule — and the turnaround’s sentence says nothing is dated yet, with a '
        + 'reach of 0 rather than a NaN',
        JSON.stringify(ids(notYet.e)) === JSON.stringify(E_IDS)
          && !!eTurn && eTurn.have === 0 && eTurn.want === 21
          && eTurn.why === 'nothing about this class is dated yet; this rule looks back 21 days',
        JSON.stringify(figures(notYet.e)) + ' :: ' + JSON.stringify(eTurn && eTurn.why));

      /* The log probe. The behavior rule is one of the four that can put a student on the concern
         list on a PAST date, so a behavior entry twenty-five days old is a dated fact the turnaround
         could have been reading — and the answer must stop calling that rule early the moment the
         entry exists, without counting anything per student. */
      const rTurnBefore = notYet.rBefore.filter((r) => r.id === 'turnaround')[0];
      const rTurnAfter = notYet.rAfter.filter((r) => r.id === 'turnaround')[0];
      check('the turnaround is early while the dated record reaches back three days, and is NOT '
        + 'early once one roster student has a behavior entry dated twenty-five days back — the '
        + 'reach is the older of the first meeting and the first behavior entry, not the term’s age',
        !!rTurnBefore && rTurnBefore.have === 3 && rTurnBefore.want === 21
          && rTurnBefore.why === 'the dated record reaches back 3 days; this rule looks back 21 days'
          && !rTurnAfter
          && JSON.stringify(ids(notYet.rAfter))
            === JSON.stringify(ids(notYet.rBefore).filter((id) => id !== 'turnaround')),
        'before ' + JSON.stringify(rTurnBefore && rTurnBefore.why) + ' :: after '
          + JSON.stringify(ids(notYet.rAfter)));

      check('asking the not-yet answer about four classes writes NOTHING — the fixture-bearing '
        + 'document is byte-identical either side of the four calls (WO-4.3’s no-writer invariant)',
        notYet.same === true,
        notYet.same ? 'identical' : 'THE DOCUMENT MOVED');
    }
  }
}
}
