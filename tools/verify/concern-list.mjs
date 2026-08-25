/* concern-list.mjs — who needs you, drawn (WO-4.2)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── who needs you, drawn (WO-4.2) ─────────
 *
 * THE VIEW, NOT THE ENGINE. § "the signal engine (WO-4.1)" above installs four fixtures, runs
 * evaluate() against them and reads the hits it returns; nothing there ever renders. This section
 * is the other half — the screen those hits land on — and it is here rather than in the VIEW_PLAN
 * loop for the reason #detailView and #calendarView are: by the time that loop runs, the
 * assignments section has deleted every assignment in the document and the class left open has no
 * roster, so the loop would measure a concern list over a document that cannot produce a single
 * concern. A screen whose entire content is "nobody is flagged" is not a measurement of a screen
 * that ranks flagged students.
 *
 * THE FIXTURE IS JUNE 2026 AND IT IS IN THE PAST ON PURPOSE. The view calls evaluate() with no
 * `through`, which is what a teacher's own arrival does, so it defaults to today — a fixture dated
 * forward would be a term this screen has not reached and would read as an empty list on a correct
 * build. WO-4.1's block plants September and passes its own `through` precisely because it does
 * not render; this one cannot borrow that trick.
 *
 * THREE STUDENTS, EACH CARRYING ONE ANSWER:
 *
 *   Abe   absent for the last five of ten recorded meetings, and PASSING (95%). The attendance
 *         case, and passing so that the ordering claim below cannot be satisfied by a build that
 *         merely sorts on the grade.
 *   Lena  present at all ten, scoring 50 of 100. The grade case, and the row that must sit BELOW
 *         Abe under the owner's ruling of 2026-08-20 — attendance first, whatever the grade says.
 *   Nils  present at all ten and never scored at all. He is the screen's control: Acceptance line
 *         4 is that no-graded-work is not a zero, and the way to assert it is a student who would
 *         be bottom of the class if it were.
 */
console.log('\n--- who needs you, drawn (WO-4.2) ---');
if (!seam) {
  skip('the signals list (WO-4.2)', 'window.planbook is not on the page, so nothing here can seed '
    + 'a concern, read what the list ranked, or put the document back');
} else {
  const CLS = 'c_wo42';
  const OTHER = 'c_wo42b';
  const TERM = 'tm_wo42';
  const ASG = 'a_wo42';
  const ABS = 's_wo42abs', LOW = 's_wo42low', NEW = 's_wo42new';
  /* Surnames nothing else in this repository contains, so "no student name survived the refusal"
     is a SEARCH over what the screen actually rendered rather than an inspection of the fields
     somebody remembered to look at. WO-6.3's technique, pointed at this screen's own risk. */
  const ABS_NAME = 'Wo42Absentee', LOW_NAME = 'Wo42Lowscore', NEW_NAME = 'Wo42Ungraded';

  const onView = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  /* clickSel's oldest trap, and the same guard § WO-6.3 carries: there is more than one
     [data-view-home] in the document and the hidden ones measure 0x0, so the visible one is found
     by index and clicked by index rather than by selector. */
  async function goHome() {
    const nth = await evalJs(`(function(){
      var all = document.querySelectorAll('[data-view-home]');
      for (var i = 0; i < all.length; i++) {
        var r = all[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return i;
      }
      return -1; })()`);
    if (nth < 0) throw new Error('no visible [data-view-home] on this screen');
    await clickSel('[data-view-home]', nth);
    await new Promise(r => setTimeout(r, 250));
  }

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture ── */
  const plant = await evalJs(`(function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    if (!d.scores || typeof d.scores !== 'object') return { ok:false, why:'no scores map' };
    var wasClass = window.planbook.classes.getSelectedClassId();
    var mode = window.planbook.supports.presentationMode();
    var hadSignals = JSON.stringify(d.signals || {});
    var dropId = '';
    function pad(n){ return (n < 10 ? '0' : '') + n; }
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      doc.students.push({ id:'${ABS}', first:'Abe', last:'${ABS_NAME}' });
      doc.students.push({ id:'${LOW}', first:'Lena', last:'${LOW_NAME}' });
      doc.students.push({ id:'${NEW}', first:'Nils', last:'${NEW_NAME}' });
      doc.classes.push({ id:'${CLS}', name:'WO-4.2 Signals', archived:false,
        /*
          LENA IS FIRST ON THE ROSTER AND ABE IS SECOND, AND THAT ORDER IS THE BANDING CHECK'S
          WHOLE LOAD. src/signals.js's evaluate() walks the roster OUTER and the rules inner, so
          the order hits come back in — and therefore the order collect() creates rows in — is
          roster order. Array.prototype.sort is stable, so a build whose ranking had been reduced
          to a no-op would leave rows in exactly that order.

          Seeded [Abe, Lena] the banding check passed either way: Abe was already first, and the
          check could not tell "attendance bands ahead of the grade" from "the ranking does nothing
          and the roster happened to agree with it." **Proved by mutation on 2026-08-20** —
          severityOrder()'s rank comparison cut to a constant zero, and the run came back 1086 of
          1086. (No backticks in here; it is inside a template literal and one would close it.)

          Reversed, the unbanded order puts the FAILING-BUT-PRESENT student on top and only the
          ranking can lift the passing absentee above her. The same mutation reddens it now.
        */
        roster:['${LOW}','${ABS}','${NEW}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-4.2 Term', start:'2026-06-01', end:'2026-06-30' }],
        categories:[{ id:'k_wo42', name:'All work', weight:100 }]});
      /* A second class so the filter has something to be wrong about. Its roster is empty, so it
         contributes no rows and cannot quietly supply the ones this section counts. */
      doc.classes.push({ id:'${OTHER}', name:'WO-4.2 Other', archived:false,
        roster:[], letterScale:null,
        terms:[{ id:'tm_wo42b', label:'WO-4.2 Other Term', start:'2026-06-01', end:'2026-06-30' }],
        categories:[{ id:'k_wo42b', name:'All work', weight:100 }]});
      doc.assignments.push({ id:'${ASG}', classId:'${CLS}', termId:'${TERM}',
        categoryId:'k_wo42', name:'WO-4.2 Quiz', points:100, assigned:'2026-06-01',
        due:'2026-06-02' });
      /*
        NINE RECORDED MEETINGS WITH A HOLE IN THE MIDDLE OF THE ABSENCE RUN, and the hole is the
        whole point — it is what turns Acceptance line 3 from a reading of the code into a
        measurement. June 8th gets NO attendance record and an authored dropped event instead, so
        the run of absences either side of it (the 6th, the 7th, then the 9th and the 10th) is only
        four in a row if dropped and untaken days are SKIPPED rather than treated as a break.
        (No backticks anywhere in this comment: it lives inside a template literal and one would
        close it — the warning § the signal engine carries, earned again here.)

        That is also the work order's own trap, one class along: consecutive means consecutive
        MEETINGS OF THIS CLASS, never consecutive weekdays. Abe is absent on four consecutive
        meetings that span five calendar days.
      */
      for (var i = 1; i <= 10; i++) {
        if (i === 8) continue;
        var marks = {};
        if (i >= 6) marks['${ABS}'] = { code: 'A' };
        doc.attendance.push({ classId:'${CLS}', date:'2026-06-' + pad(i), marks: marks });
      }
      /*
        THE 8th IS A RECORD CARRYING AN EXCEPTION, NOT AN ABSENT ONE, and the difference is the
        whole of why this fixture is worth its length. src/attendance.js's stateOf() has two ways to
        not be a meeting: a record WITH an exception is DID_NOT_MEET, and no record at all is
        COVERED or NOT_TAKEN. Only the first reaches meetingDates()'s stateOf() predicate — a date
        with no record is filtered out one line earlier, by not being in the ledger at all.

        Seeding the 8th as a bare gap therefore proves the UNTAKEN half and leaves the DROPPED half
        untouched, while the Acceptance line names both. So the record exists and wears the
        exception dropClass() writes, and the untaken half is proved by the rest of June, which has
        twenty-one weekdays and nine meetings on it.
      */
      doc.attendance.push({ classId:'${CLS}', date:'2026-06-08', exception:'dropped' });
      var cal = window.planbook.calendar;
      var drop = cal.newEvent('dropped', '2026-06-08', '', 'WO-4.2 planned drop', ['${CLS}']);
      cal.addEvent(doc, drop);
      dropId = drop ? drop.id : '';
      /* INSIDE the update rather than on the doc afterwards: the store is what marks a write
         dirty, and a score set on the object it handed back is a score the next flush does not
         know it has. Abe is planted PASSING on purpose — see this section's header. */
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      doc.scores['${ASG}'] = doc.scores['${ASG}'] || {};
      doc.scores['${ASG}']['${ABS}'] = { v: 95 };
      doc.scores['${ASG}']['${LOW}'] = { v: 50 };
    });
    var now = s.getDoc();
    return { ok:true, wasClass:wasClass, mode:mode, hadSignals:hadSignals, dropId:dropId,
      classes:(now.classes || []).length, students:(now.students || []).length }; })()`);
  check('WO-4.2 fixture: two classes, three students, one assignment, NINE recorded meetings and a '
    + 'dropped day in the middle of the absence run — an absentee who is passing, a low scorer who '
    + 'is never absent, and a student with no graded work at all',
    !!plant && plant.ok === true && !!plant.dropId,
    plant && plant.ok ? plant.classes + ' class(es) and ' + plant.students + ' student(s) on the '
      + 'document after the seed' : JSON.stringify(plant));

  if (!plant || !plant.ok) {
    skip('the whole of WO-4.2’s screen', 'the fixture did not install, so nothing below it '
      + 'could be measured against a list that has anything on it');
  } else {
    /* AND THE APP IS BOOTED AGAIN ON TOP OF IT. The home grid was painted at the boot ABOVE, which
       was before this fixture existed, so its cards are the ones the document had then — clicking
       for a class card that no screen has drawn yet is a `nothing to click` and not a red check.
       A reload is the honest way to get one: it is the state a teacher's own app is in, and it
       proves the seed reached storage rather than only the object in memory. */
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    /* ── in through the fifth segment, from inside a class ──
       Walked the way a teacher walks it: home, a card, then the new segment on the strip inside the
       class screen she landed on. Two claims at once — it is a VIEW in <main> with no dialog
       semantics, and it arrived FILTERED TO THE CLASS SHE CAME FROM, which is the door-not-a-memory
       ruling this screen inherits from src/calendar-view.js. */
    if ((await onView()) !== 'homeView') await goHome();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="signals"]');
    await new Promise(r => setTimeout(r, 300));
    const arrived = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var on = document.querySelector('main > :not(.hidden)');
      var v = document.getElementById('signalsView');
      return { view: on ? on.id : '',
        inMain: !!(v && v.parentElement && v.parentElement.tagName === 'MAIN'),
        dialogBits: v ? v.querySelectorAll('[role="dialog"],[aria-modal="true"]').length : -1,
        openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        classId: m.classId, sort: m.sort, blocked: m.blocked,
        /* m.concern SINCE WO-4.3, which split the model into two symmetrical columns. Every
           claim below is the same claim it was; what moved is that "rows" is now the CONCERN
           column's rows by name rather than by being the only ones there are. (No backticks in
           here; it is inside a template literal and one would close it.) */
        rows: m.concern.rows.map(function(r){ return { name:r.name, lead:r.lead.ruleId,
          tags:r.tags.map(function(h){ return h.ruleId; }) }; }),
        count: m.concern.count, total: m.concern.total }; })()`);
    check('the fifth segment is a live door: one tap from inside a class lands on #signalsView, a '
      + 'view in <main> with no dialog anywhere in it — and it arrives FILTERED TO THAT CLASS, '
      + 'which is a door recomputed on arrival and never a stored preference',
      arrived.view === 'signalsView' && arrived.inMain === true && arrived.dialogBits === 0
        && arrived.openModals === 0 && arrived.classId === CLS,
      'landed on #' + arrived.view + ' (in <main> = ' + arrived.inMain + ', dialog bits = '
        + arrived.dialogBits + ', open modals = ' + arrived.openModals + '), filtered to '
        + JSON.stringify(arrived.classId));

    /*
      THE OWNER'S RULING OF 2026-08-20, AND THE ONE CHECK IN THIS SECTION THAT THE PHASE TURNS ON:
      attendance rules band ahead of everything else, and the fixture is built so that a build which
      sorted on the grade instead would put these two rows the other way up. Abe is at 95% and Lena
      at 50%; Abe leads anyway, because he is the one who is not in the room.
    */
    const order = arrived.rows.map((r) => r.name);
    check('the list bands attendance ahead of the grade: the passing student who is absent leads '
      + 'the failing student who is never absent — an ordering a build that sorted on the grade '
      + 'would get exactly backwards',
      arrived.rows.length === 2
        && order[0] === 'Abe ' + ABS_NAME && order[1] === 'Lena ' + LOW_NAME,
      arrived.rows.length + ' row(s): ' + JSON.stringify(arrived.rows));

    check('and the lead sentence on each row is the rule that put it there — the absentee leads on '
      + 'an attendance rule with the other two carried as tags, the low scorer on the grade',
      arrived.rows.length === 2
        && ['attendance-below', 'absence-window', 'absence-run'].indexOf(arrived.rows[0].lead) !== -1
        && arrived.rows[0].tags.length === 2
        && arrived.rows[1].lead === 'grade-below' && arrived.rows[1].tags.length === 0,
      JSON.stringify(arrived.rows));

    /* ACCEPTANCE LINE 4, and it is asserted as an ABSENCE from a list rather than as a null in a
       model: a student with no graded work has no percentage, and a build that read that as a zero
       would put Nils at the very top of a list sorted by lowest grade. */
    const named = JSON.stringify(arrived.rows);
    check('a student with no graded work at all is on NO concern list — not treated as a zero, '
      + 'which is what would put him top of it (Acceptance line 4)',
      named.indexOf(NEW_NAME) === -1 && arrived.total === 2,
      'the list holds ' + arrived.total + ' row(s) and ' + NEW_NAME
        + (named.indexOf(NEW_NAME) === -1 ? ' is on none of them' : ' IS ON ONE OF THEM'));

    /*
      ACCEPTANCE LINE 3, AND THE WORK ORDER'S NAMED TRAP WITH IT.

      The absence run is read off the hit's own numbers rather than off the sentence: FOUR in a row,
      out of NINE recorded meetings. Nine is the tell — ten calendar days were seeded and the 8th
      was dropped, so a build that counted calendar days would say ten meetings here, and a build
      that let a dropped or untaken day BREAK the run would say two (the 9th and the 10th) and the
      rule would not fire at all at a threshold of three.

      The trap the work order names is the same claim from the other side: consecutive means
      consecutive MEETINGS OF THIS CLASS. These four span five calendar days, and the rule is right
      to call them consecutive.
    */
    const run = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var row = m.concern.rows.filter(function(r){ return r.name.indexOf('${ABS_NAME}') !== -1; })[0];
      if (!row) return { found:false };
      var hit = row.hits.filter(function(h){ return h.ruleId === 'absence-run'; })[0];
      var att = row.hits.filter(function(h){ return h.ruleId === 'attendance-below'; })[0];
      return { found:true, run: hit ? hit.numbers.run : -1,
        meetings: hit ? hit.numbers.meetings : -1, need: hit ? hit.numbers.need : -1,
        say: hit ? hit.explanation : '',
        attMeetings: att ? att.numbers.meetings : -1 }; })()`);
    check('the absence run counts FOUR in a row across NINE recorded meetings, walking straight '
      + 'through a dropped day IN THE LEDGER in the middle of it — a record wearing an exception, '
      + 'which is the only shape that reaches stateOf() — and through the untaken weekdays around '
      + 'it; a build that broke on either would report two and fire nothing (Acceptance line 3)',
      run.found === true && run.run === 4 && run.meetings === 9 && run.need === 3
        && run.attMeetings === 9,
      JSON.stringify(run));

    /* ── the two toolbars ── */
    const bars = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      return { rules: m.rules.map(function(r){ return { id:r.id, count:r.count }; }),
        chips: document.querySelectorAll('#signalsRules [data-signals-rule]').length,
        classChips: document.querySelectorAll('#signalsClasses [data-signals-filter]').length,
        classCount: m.classes.length,
        allRulesChip: !!document.querySelector('#signalsRules [data-signals-rule=""]'),
        allClassesChip: !!document.querySelector('#signalsClasses [data-signals-filter=""]'),
        sortValue: (document.getElementById('signalsSort') || {}).value,
        sortOptions: Array.prototype.map.call(
          document.querySelectorAll('#signalsSort option'), function(o){ return o.value; }),
        inertShown: !(document.getElementById('signalsInert') || {classList:{contains:function(){return true;}}}).classList.contains('hidden'),
        inertText: (document.getElementById('signalsInert') || {}).textContent || '',
        /* THE MODEL'S OWN ANSWER BESIDE THE SCREEN'S, added at WO-4.4: a hidden notice and an empty
           inertRules() look identical from the markup, and only one of them means the rule landed. */
        inertRuleIds: window.planbook.signals.inertRules().map(function(r){ return r.id; }),
        emptyShown: !document.getElementById('signalsEmpty').classList.contains('hidden'),
        blockedShown: !document.getElementById('signalsBlocked').classList.contains('hidden')
      }; })()`);
    const ruleIds = bars.rules.map((r) => r.id).sort();
    const ruleCounts = {};
    bars.rules.forEach((r) => { ruleCounts[r.id] = r.count; });
    /* PLUS THE *ALL RULES* CHIP, which is why the count is rules + 1 rather than rules: the strip
       leads with the way back to the whole list, exactly as the class filter above it leads with
       *All classes*. Both are asserted, because a strip that can be filtered and not unfiltered is
       the cul-de-sac this screen's own filter rule was written against. */
    /* FIVE SINCE WO-4.3, AND THE FIFTH IS A PRAISE RULE ON THE SAME FIXTURE. The strip carries both
       directions now, so `attendance-window` earns a chip here: Lena and Nils are present at all
       nine recorded meetings, which is 100% over a window that asks for twenty and finds nine. Its
       count is TWO where the other four are one, which is the same "count students, not hits" claim
       read from the other end — and it is asserted as an exact map rather than as `every count is 1`,
       because that shape could not tell a praise rule that fired twice from one that fired once. */
    check('one rule chip per rule that actually fired, in BOTH directions — four concern rules over '
      + 'two students and one praise rule over two others, each counting STUDENTS rather than hits '
      + 'so the absentee is counted once by each of his three — and the strip leads with the way '
      + 'back to the whole list',
      bars.chips === bars.rules.length + 1 && bars.rules.length === 5
        && bars.allRulesChip === true && bars.allClassesChip === true
        && bars.classChips === bars.classCount + 1
        && JSON.stringify(ruleIds) === JSON.stringify(
          ['absence-run', 'absence-window', 'attendance-below', 'attendance-window', 'grade-below'])
        && JSON.stringify(ruleCounts) === JSON.stringify({ 'absence-run': 1, 'absence-window': 1,
          'attendance-below': 1, 'grade-below': 1, 'attendance-window': 2 }),
      bars.chips + ' rule chip(s) (All rules present = ' + bars.allRulesChip + ') for '
        + JSON.stringify(bars.rules) + '; ' + bars.classChips + ' class chip(s) over '
        + bars.classCount + ' class(es) (All classes present = ' + bars.allClassesChip + ')');

    /* THE DEFAULT IS THE RULING (the owner, 2026-08-20): what protects the phase's argument is
       which option the list OPENS on, not which options are absent. So the four options are read
       AND the selected one is asserted to be the ruled order. */
    check('the sort opens on the ruled order every time — attendance first, then the biggest '
      + 'change — with the other three offered under it and none of them the arrival default',
      bars.sortValue === 'ruled'
        && JSON.stringify(bars.sortOptions) === JSON.stringify(
          ['ruled', 'change', 'grade', 'missing']),
      'the control reads ' + JSON.stringify(bars.sortValue) + ' over options '
        + JSON.stringify(bars.sortOptions));

    /*
      WO-4.2's ACCEPTANCE LINE 6, RE-CUT IN PLACE ON 2026-08-24 RATHER THAN DELETED (WO-4.4).

      It read *"the behavior rule is inert until WO-4.4 and the screen says so in words"* and
      asserted `bars.inertShown === true`. WO-4.4 is the day it named: the rule counts now,
      inertRules() returns an empty list, and the notice took itself off the screen — which is
      exactly what that work order's own note said would happen and is what this check has to assert
      instead. Deleting it would have retired the only reading that can tell "the notice went because
      the rule landed" from "the notice went because somebody deleted the notice", which are the two
      builds this line exists to separate. One call site before, one after; the recorded count in
      tools/README.md does not move for this.
    */
    check('the inert notice is GONE now that WO-4.4 has landed, and it went because inertRules() is '
      + 'empty rather than because a screen stopped drawing it — with no empty state and no refusal '
      + 'standing in its place (WO-4.2 acceptance line 6, re-cut)',
      bars.inertShown === false && bars.inertRuleIds.length === 0
        && bars.emptyShown === false && bars.blockedShown === false,
      'the inert line is up: ' + bars.inertShown + ' reading '
        + JSON.stringify(bars.inertText.slice(0, 160)) + '; inertRules() names '
        + JSON.stringify(bars.inertRuleIds));

    /* ── the card behind a row ── */
    await clickSel('#signalsView [data-signal-row]');
    await new Promise(r => setTimeout(r, 300));
    const card = await evalJs(`(function(){
      var open = document.querySelector('.modal-overlay:not(.hidden)');
      if (!open) return { open:false };
      var text = open.textContent || '';
      return { open:true, id: open.id,
        dialog: !!open.querySelector('[role="dialog"][aria-modal="true"]'),
        named: text.indexOf('${ABS_NAME}') !== -1,
        rules: open.querySelectorAll('.sig-card-rule').length,
        evidence: open.querySelectorAll('.sig-card-ev-item').length,
        thresholds: open.querySelectorAll('.sig-card-thresh').length,
        placeholder: /\\{\\{|undefined|NaN|\\[object/.test(text) }; })()`);
    check('tapping a row opens the signal card, and it carries every rule that fired on that '
      + 'student over the numbers that fired it — three rules for the absentee, each with its '
      + 'own evidence and its threshold named, and no placeholder anywhere in it',
      card.open === true && card.dialog === true && card.named === true
        && card.rules === 3 && card.evidence >= 3 && card.thresholds === 3
        && card.placeholder === false,
      JSON.stringify(card));
    await evalJs("(function(){var b=document.querySelector('.modal-overlay:not(.hidden) "
      + "[data-modal-close]'); if(b) b.click(); return 1;})()");
    await new Promise(r => setTimeout(r, 250));

    /*
      ACCEPTANCE LINE 5 — editing a threshold changes the list immediately.

      The number is moved on the DOCUMENT and the screen redrawn through the app's own
      renderSignals(), which is the same call src/shell.js makes from the thresholds panel's save
      chain. What that proves is the half a fixture can prove: the list is a pure function of the
      document and holds no evaluation of its own from before the edit. That the panel's own save
      CALLS this is asserted where it can be — the delegated-hook census in § the shell — and the
      👤 line is what closes the pair on a real device.

      THE KEY IS DELETED AFTERWARDS RATHER THAN WRITTEN BACK TO 65, which is CLAUDE.md's rule that
      an absent threshold key IS its default: writing today's number into the year is exactly the
      edit that makes a later re-tuning invisible to this document.
    */
    const moved = await evalJs(`(function(){
      var s = window.planbook.store;
      var before = window.planbook.signalsView.signalsModel().concern.rows.length;
      s.update(function(doc){
        if (!doc.signals || typeof doc.signals !== 'object') doc.signals = {};
        doc.signals.gradeBelow = 40;
      });
      window.planbook.signalsView.renderSignals();
      var after = window.planbook.signalsView.signalsModel();
      var afterRows = document.querySelectorAll('#signalsList [data-signal-row]').length;
      s.update(function(doc){ delete doc.signals.gradeBelow; });
      window.planbook.signalsView.renderSignals();
      var back = window.planbook.signalsView.signalsModel().concern.rows.length;
      var backRows = document.querySelectorAll('#signalsList [data-signal-row]').length;
      return { before:before, after:after.concern.rows.length, afterRows:afterRows,
        afterNames:after.concern.rows.map(function(r){ return r.name; }),
        back:back, backRows:backRows,
        keyGone: !Object.prototype.hasOwnProperty.call(
          (s.getDoc().signals || {}), 'gradeBelow') }; })()`);
    check('moving the grade line from 65 to 40 takes the 50% student off the list on the spot, and '
      + 'putting it back brings her back — the rendered rows moving with the model, not just the '
      + 'model (Acceptance line 5)',
      moved.before === 2 && moved.after === 1 && moved.afterRows === 1
        && moved.afterNames.indexOf('Lena ' + LOW_NAME) === -1
        && moved.back === 2 && moved.backRows === 2,
      JSON.stringify(moved));
    check('and the threshold was put back by DELETING the key rather than by writing 65 into the '
      + 'year — an absent key IS its default, and a number written here is a default that can '
      + 'never be re-tuned for this document again',
      moved.keyGone === true,
      'gradeBelow still on doc.signals = ' + !moved.keyGone);

    /*
      ══════════ THE REFUSAL (the owner, 2026-08-20) ══════════

      THE FIRST SCREEN IN THE APP THAT REFUSES RATHER THAN HIDES, and the check is written to match
      that distinction rather than the usual one. Everywhere else — the roster, the calendar, the
      student detail — presentation mode REDACTS and the screen stays usable. Here the whole screen
      closes, because initials protect nobody in a room of thirty who know each other's initials and
      this is the only surface whose entire content is a ranked list of named students in trouble.

      So three things are asserted, and the third is the one that would catch a build that merely
      styled the list away: not one of the three planted surnames survives anywhere in the view's
      DOM. src/signals-view.js's model does not build the list at all while the mode is on — a list
      that exists in memory is a list a later screen can render — and this is that claim measured
      from the outside.
    */
    const shut = await evalJs(`(function(){
      window.planbook.supports.setPresentationMode(true);
      window.planbook.signalsView.renderSignals();
      var v = document.getElementById('signalsView');
      var text = v ? (v.textContent || '') : '';
      var m = window.planbook.signalsView.signalsModel();
      var blocked = document.getElementById('signalsBlocked');
      return { blocked: !blocked.classList.contains('hidden'),
        modelBlocked: m.blocked, modelRows: m.concern.rows.length + m.praise.rows.length,
        rendered: document.querySelectorAll('#signalsView [data-signal-row]').length,
        emptyShown: !document.getElementById('signalsEmpty').classList.contains('hidden'),
        names: ['${ABS_NAME}','${LOW_NAME}','${NEW_NAME}'].filter(function(n){
          return text.indexOf(n) !== -1; }),
        blockedText: blocked ? (blocked.textContent || '') : '' }; })()`);
    check('presentation mode CLOSES this screen rather than redacting it: the refusal is drawn, the '
      + 'model evaluates nobody, no row is rendered — and not one of the three planted surnames '
      + 'survives anywhere in the view, which is what a build that only styled the list away fails',
      shut.blocked === true && shut.modelBlocked === true && shut.modelRows === 0
        && shut.rendered === 0 && shut.names.length === 0,
      JSON.stringify(shut.names) + ' name(s) still in the view; blocked panel up = ' + shut.blocked
        + ', model rows = ' + shut.modelRows + ', rendered rows = ' + shut.rendered);

    /* AND IT READS AS REFUSED RATHER THAN BROKEN, which is the other half of the ruling: an
       `.empty-state` that names the control that undoes it. A screen that just went blank would
       satisfy every assertion above and teach a teacher that the feature is broken. */
    check('and the refusal names the control that undoes it, so it reads as refused rather than '
      + 'as broken — the ruling’s own words, and the reason it is an .empty-state and not a blank',
      /presentation mode/i.test(shut.blockedText)
        && /turn it off|header/i.test(shut.blockedText),
      JSON.stringify(shut.blockedText.replace(/\s+/g, ' ').trim().slice(0, 200)));

    const reopened = await evalJs(`(function(){
      window.planbook.supports.setPresentationMode(false);
      window.planbook.signalsView.renderSignals();
      return { blocked: !document.getElementById('signalsBlocked').classList.contains('hidden'),
        rows: document.querySelectorAll('#signalsList [data-signal-row]').length }; })()`);
    check('and it comes straight back when the mode goes off — the refusal is a gate on the render '
      + 'and never a state the screen has to be rebuilt out of',
      reopened.blocked === false && reopened.rows === 2,
      'blocked = ' + reopened.blocked + ' over ' + reopened.rows + ' row(s)');

    /* ── nothing about this screen is remembered ──
       The filter and the sort both recompute on arrival, for src/calendar-view.js's reason: a
       remembered filter is a list quietly hiding four fifths of a roster from a teacher who does
       not recall setting it. Asserted over EVERY planbook_ key rather than over the two this
       screen might plausibly have written, so a third preference invented later is caught too. */
    /* `planbook_openClassId` IS EXCLUDED BY NAME, AND IT IS NOT A HOLE IN THIS CHECK. That key is
       WHICH CLASS IS OPEN — written by the class card this walk clicked, long before this screen
       existed, and read by every class screen in the app. It is a different fact from *which
       classes this list is showing*: the two happen to hold the same id right now only because the
       walk arrived through that class's own door, and the check below the exclusion is what proves
       they are separate — the filter is read back after arriving from the OTHER class, and it moved
       while nothing new was written here. What is asserted is that this screen wrote NOTHING: not
       its filter, not its sort, and not some third preference invented later, which is why the
       sweep is over every planbook_ key rather than over the two names it might have used. */
    const stored = await evalJs(`(function(){
      var out = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('planbook_') !== 0) continue;
        if (k === 'planbook_openClassId') continue;
        var v = localStorage.getItem(k) || '';
        if (/signal|concern|ruled|${CLS}/i.test(k + ' ' + v)) out.push(k + '=' + v.slice(0, 80));
      }
      return out; })()`);
    check('neither the class filter nor the sort reached localStorage — no planbook_ key other than '
      + 'the open-class one this walk arrived through mentions this screen, its sort, or the class '
      + 'it was filtered to',
      stored.length === 0,
      stored.length ? JSON.stringify(stored) : 'no planbook_ key mentions any of them');

    /* ── and every control on it under a thumb ──
       44px, not 28: the month chip's departure is the owner's ruling for ONE control and explicitly
       not a precedent (CLAUDE.md § Conventions). Every control this screen adds is new, so every
       one of them gets the full floor. The `<select>` is measured with the rest — src/signals-view.css
       gives it a height in the coarse block and nothing else, which is the whole of what it needs. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    const thumb = await evalJs(`(function(){
      var v = document.getElementById('signalsView');
      var d = document.documentElement;
      var nodes = Array.prototype.slice.call(
        v.querySelectorAll('button, select, [data-signals-filter], [data-signals-rule]'));
      var small = [];
      nodes.forEach(function(n){
        var r = n.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        if (r.height < 44) small.push({ t:(n.textContent||'').trim().slice(0,24),
          w:Math.round(r.width), h:Math.round(r.height) });
      });
      return { coarse: matchMedia('(pointer: coarse)').matches,
        measured: nodes.length, small: small,
        docScroll: d.scrollWidth, docClient: d.clientWidth }; })()`);
    check('every control on the signals screen clears 44px high at 390px under a coarse pointer, '
      + 'and the page does not scroll sideways — no control here takes the month chip’s 28px '
      + 'departure, which is one control’s ruling and not a precedent',
      thumb.coarse === true && thumb.measured >= 8 && thumb.small.length === 0
        && thumb.docScroll <= thumb.docClient + 1,
      thumb.measured + ' control(s) measured, under 44 = ' + JSON.stringify(thumb.small)
        + '; document ' + thumb.docScroll + ' in ' + thumb.docClient);
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 300));

    /* ── arriving from OUTSIDE a class opens on every class ──
       The other half of the door ruling: the filter is recomputed on arrival, so the same screen
       reached without a class behind it opens unfiltered rather than on whatever it held last. */
    if ((await onView()) !== 'homeView') await goHome();
    await clickSel('#homeGrid [data-class-tab="' + OTHER + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="signals"]');
    await new Promise(r => setTimeout(r, 300));
    const fromOther = await evalJs(
      'JSON.stringify(window.planbook.signalsView.signalsModel().classId)');
    check('the same screen reached from a DIFFERENT class arrives filtered to THAT one — the '
      + 'filter is recomputed from the door every time and never carried over from the last visit',
      fromOther === JSON.stringify(OTHER),
      'filtered to ' + fromOther + ' after arriving from ' + OTHER);
  }

  /* ── and the fixture comes back off ── */
  const cleaned = await evalJs(`(function(){
    var s = window.planbook.store;
    s.update(function(doc){
      doc.classes = (doc.classes || []).filter(function(c){
        return c.id !== '${CLS}' && c.id !== '${OTHER}'; });
      doc.students = (doc.students || []).filter(function(p){
        return p.id !== '${ABS}' && p.id !== '${LOW}' && p.id !== '${NEW}'; });
      doc.assignments = (doc.assignments || []).filter(function(a){ return a.id !== '${ASG}'; });
      doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
      if (doc.scores) delete doc.scores['${ASG}'];
      doc.events = (doc.events || []).filter(function(e){
        return (e.title || '').indexOf('WO-4.2 planned drop') === -1; });
    });
    window.planbook.supports.setPresentationMode(${plant && plant.mode ? 'true' : 'false'});
    var d = s.getDoc();
    return { classes:(d.classes || []).filter(function(c){
        return c.id === '${CLS}' || c.id === '${OTHER}'; }).length,
      students:(d.students || []).filter(function(p){
        return p.id === '${ABS}' || p.id === '${LOW}' || p.id === '${NEW}'; }).length,
      assignments:(d.assignments || []).filter(function(a){ return a.id === '${ASG}'; }).length,
      attendance:(d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length,
      scores: d.scores && d.scores['${ASG}'] ? 1 : 0,
      events:(d.events || []).filter(function(e){
        return (e.title || '').indexOf('WO-4.2 planned drop') !== -1; }).length,
      signals: JSON.stringify(d.signals || {}),
      mode: window.planbook.supports.presentationMode() }; })()`);
  if ((await onView()) !== 'homeView') await goHome();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-4.2 fixture came back off the document, the signals block was left exactly as it '
    + 'was found, presentation mode was left as it was found, and the page was left on the grid',
    cleaned.classes === 0 && cleaned.students === 0 && cleaned.assignments === 0
      && cleaned.attendance === 0 && cleaned.scores === 0 && cleaned.events === 0
      && cleaned.signals === (plant ? plant.hadSignals : '{}')
      && cleaned.mode === !!(plant && plant.mode)
      && (await onView()) === 'homeView',
    cleaned.classes + ' class(es), ' + cleaned.students + ' student(s), ' + cleaned.assignments
      + ' assignment(s), ' + cleaned.attendance + ' attendance row(s) and ' + cleaned.scores
      + ' score bag(s) left behind; signals block = ' + cleaned.signals + ' (wanted '
      + (plant ? plant.hadSignals : '{}') + '), presentation mode = ' + cleaned.mode
      + ', left on #' + (await onView()));
}
}
