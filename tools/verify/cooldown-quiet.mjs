/* cooldown-quiet.mjs — the contact cooldown and the quiet middle (WO-4.5)
 *
 * The third section over the signals screen, after `concern-list.mjs` and `praise-column.mjs`,
 * and it is separate from both for the reason those two are separate from each other: the fixture
 * is nothing like theirs. A cooldown needs a `log` with `contact` entries in it, and a quiet middle
 * needs students on the roster whom NO rule fires for — which is the one thing neither of those
 * fixtures can contain, because every student in them was planted to trip something.
 *
 * Nothing here launches a browser, a server or a document of its own: the entry file owns all three
 * and hands them over on `h`. `tools/README.md` § "Driving a browser over CDP" says where a new
 * check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── the cooldown and the quiet middle (WO-4.5) ─────────
 *
 * THE FIXTURE WRITES A RECORD THE APP CANNOT WRITE YET, AND THAT IS THE POINT RATHER THAN A CHEAT.
 * A `contact` entry is Phase 5's (WO-5.3) and nothing in this build authors one; `src/log.js` says
 * so at its own writer and `docs/data-model.md` § log names the `ruleId` field WO-4.5 defined for
 * it. So the harness plants the record the cooldown reads, in exactly the shape the data model
 * documents, and everything downstream of it — the suppression, the foot, the expansion, the
 * restore — is the real path. The alternative was building Phase 5's outreach flow to make one
 * check possible, which is the work order widening itself.
 *
 * SEVEN STUDENTS, AND EVERY ONE OF THEM MAKES ONE CLAIM FALSIFIABLE:
 *
 *   Ada    fires TWO rules — a grade under the line and three missing — and has been written to
 *          about the GRADE three days ago. She is the work order's trap in one student: a build
 *          keyed on the student drops her off the list entirely, and a build keyed on
 *          `student + rule` leaves her on it for the missing work.
 *   Ben    fires ONE rule and was written to about that one two days ago. No row at all, and a
 *          name at the foot — which is the difference between hidden and deleted.
 *   Cal    fires the SAME rule as Ben and was written to about it TWENTY days ago, outside the
 *          fourteen-day default. On the list. A build that read the log without reading the
 *          threshold silences him too.
 *   Dot    fires nothing and nothing has ever been written down about her. The quiet middle, and
 *          the row that must LEAD it.
 *   Eve    fires nothing and has a NOTE TO SELF from four days ago. Still in the quiet middle — a
 *          note is not contact — but under Dot, because the note moved her clock.
 *   Fay    fires nothing and was WRITTEN HOME ABOUT five days ago. Not in the quiet middle at all,
 *          which is the third acceptance line's own word.
 *   Gus    fires two PRAISE rules and was written to about one of them yesterday. The cooldown is
 *          not a concern feature: a praise list that says the same thing every week dies the same
 *          way the concern list does.
 *
 * THE CLASS HAS NO ATTENDANCE RECORDS AT ALL, deliberately. With meetings on the ledger the praise
 * `attendance-window` rule fires at 100% for every student who was never marked absent, which would
 * put all seven on the praise list and leave the quiet middle structurally empty — a green check
 * over a feature nothing had exercised.
 */
console.log('\n--- the cooldown and the quiet middle (WO-4.5) ---');
if (!seam) {
  skip('the cooldown and the quiet middle (WO-4.5)', 'window.planbook is not on the page, so '
    + 'nothing here can seed a contact, read what the cooldown suppressed, or put the document '
    + 'back');
} else {
  const CLS = 'c_wo45';
  const TERM = 'tm_wo45';
  const ADA = 's_wo45ada', BEN = 's_wo45ben', CAL = 's_wo45cal', DOT = 's_wo45dot',
    EVE = 's_wo45eve', FAY = 's_wo45fay', GUS = 's_wo45gus';
  /* Surnames nothing else in this repository contains — the technique § the praise column borrows
     from WO-6.3, for its reason: "is this student on this list" becomes a search over what was
     actually rendered rather than an inspection of the fields somebody remembered to look at. */
  const ADA_N = 'Wo45Split', BEN_N = 'Wo45Silenced', CAL_N = 'Wo45Stale', DOT_N = 'Wo45Quietest',
    EVE_N = 'Wo45Noted', FAY_N = 'Wo45Written', GUS_N = 'Wo45Praised';
  const CLASS_NAME = 'WO-4.5 Cooldown';

  const onView45 = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  async function goHome45() {
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
  async function openSignals45() {
    if ((await onView45()) !== 'homeView') await goHome45();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="signals"]');
    await new Promise(r => setTimeout(r, 400));
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
  const plant45 = await evalJs(`(function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var hadSignals = JSON.stringify(d.signals || {});
    var today = window.planbook.attendance.todayISO();
    var back = function(n){ return window.planbook.calendar.shiftDays(today, -n); };
    /* The offset the app's own localStamp() writes, built the same way, so the planted entries are
       real records rather than a shape the readers happen to tolerate. Only the first ten
       characters are ever compared (src/log.js), which is why this can differ per machine and
       change nothing. */
    var off = (function(){
      var o = -new Date().getTimezoneOffset();
      var p = function(n){ return (n < 10 ? '0' : '') + n; };
      return (o < 0 ? '-' : '+') + p(Math.floor(Math.abs(o) / 60)) + ':' + p(Math.abs(o) % 60);
    })();
    var stamp = function(iso){ return iso + 'T09:00:00' + off; };

    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.log)) doc.log = [];
      doc.students.push({ id:'${ADA}', first:'Ada', last:'${ADA_N}' });
      doc.students.push({ id:'${BEN}', first:'Ben', last:'${BEN_N}' });
      doc.students.push({ id:'${CAL}', first:'Cal', last:'${CAL_N}' });
      doc.students.push({ id:'${DOT}', first:'Dot', last:'${DOT_N}' });
      doc.students.push({ id:'${EVE}', first:'Eve', last:'${EVE_N}' });
      doc.students.push({ id:'${FAY}', first:'Fay', last:'${FAY_N}' });
      doc.students.push({ id:'${GUS}', first:'Gus', last:'${GUS_N}' });
      doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
        roster:['${ADA}','${BEN}','${CAL}','${DOT}','${EVE}','${FAY}','${GUS}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-4.5 Term', start:back(40),
          end:window.planbook.calendar.shiftDays(today, 40) }],
        categories:[{ id:'k_wo45', name:'All work', weight:100 }]});
      /* Three small pieces of work and eight full ones. The small ones are where the MISSING marks
         go: three zeros out of ten points each leave a grade the concern threshold does not also
         catch, so "3 missing" is one rule firing rather than two, and Ben and Cal differ from each
         other in nothing but the date on a log entry. */
      for (var n = 1; n <= 3; n++) {
        doc.assignments.push({ id:'a_wo45_s' + n, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo45', name:'WO-4.5 Warmup ' + n, points:10,
          assigned:back(30), due:back(25) });
      }
      for (var m = 1; m <= 8; m++) {
        doc.assignments.push({ id:'a_wo45_' + m, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo45', name:'WO-4.5 Task ' + m, points:100,
          assigned:back(30), due:back(20) });
      }
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      var put = function(id, sid, cell){
        doc.scores[id] = doc.scores[id] || {};
        doc.scores[id][sid] = cell;
      };
      ['${ADA}', '${BEN}', '${CAL}'].forEach(function(sid){
        for (var i = 1; i <= 3; i++) put('a_wo45_s' + i, sid, { v: null, flag: 'missing' });
      });
      /* Ada: two halves of a hundred, which is 43.5% once the three zeros are in it — under the
         65% line. Only two scored cells, so the run-of-low-scores rule (three in a row) cannot
         fire and her row is exactly two rules deep. */
      put('a_wo45_1', '${ADA}', { v: 50 });
      put('a_wo45_2', '${ADA}', { v: 50 });
      /* Ben and Cal: three 85s, which is 77% with the zeros — over the line, under the 90 a run of
         strong scores wants, and six counted rows against the eight "no-missing" asks for. One
         rule each, and it is the same rule. */
      ['${BEN}', '${CAL}'].forEach(function(sid){
        put('a_wo45_1', sid, { v: 85 });
        put('a_wo45_2', sid, { v: 85 });
        put('a_wo45_3', sid, { v: 85 });
      });
      /* Gus: eight full pieces at 95, nothing missing and nothing small. Two praise rules, no
         concern rule, and no delta anywhere — the grade is flat across the window, so "grade-rose"
         cannot fire and the two hits are exactly the two this check names. */
      for (var g = 1; g <= 8; g++) put('a_wo45_' + g, '${GUS}', { v: 95 });

      /* THE RECORDS WO-5.3 WILL WRITE. Seven fields plus "ruleId", exactly as
         docs/data-model.md § log documents them, and "audience" carrying a real value on every
         "contact" — which is the half of the firewall that keeps a note to self from ever being
         counted as outreach. */
      doc.log.push({ id:'l_wo45_a', studentId:'${ADA}', at:stamp(back(3)), kind:'contact',
        audience:'guardian', subject:'Grade check-in', body:'', ruleId:'grade-below' });
      doc.log.push({ id:'l_wo45_b', studentId:'${BEN}', at:stamp(back(2)), kind:'contact',
        audience:'counselor', subject:'Missing work', body:'', ruleId:'missing-count' });
      doc.log.push({ id:'l_wo45_c', studentId:'${CAL}', at:stamp(back(20)), kind:'contact',
        audience:'guardian', subject:'Missing work', body:'', ruleId:'missing-count' });
      doc.log.push({ id:'l_wo45_e', studentId:'${EVE}', at:stamp(back(4)), kind:'note',
        audience:'', subject:'Ask about the science fair', body:'' });
      doc.log.push({ id:'l_wo45_f', studentId:'${FAY}', at:stamp(back(5)), kind:'contact',
        audience:'guardian', subject:'Checking in', body:'', ruleId:'grade-rose' });
      doc.log.push({ id:'l_wo45_g', studentId:'${GUS}', at:stamp(back(1)), kind:'contact',
        audience:'guardian', subject:'Great run of scores', body:'', ruleId:'high-score-run' });
    });
    var now = s.getDoc();
    return { ok:true, hadSignals:hadSignals, today:today,
      students:(now.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo45') === 0; }).length,
      assignments:(now.assignments || []).filter(function(a){
        return a.classId === '${CLS}'; }).length,
      contacts:(now.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo45') === 0 && e.kind === 'contact'; }).length,
      notes:(now.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo45') === 0 && e.kind === 'note'; }).length }; })()`);
  check('WO-4.5 fixture: one class, seven students, eleven assignments, five `contact` entries '
    + 'carrying the `ruleId` docs/data-model.md names and one note to self — the record WO-5.3 '
    + 'will write, planted because nothing in this build writes one',
    !!plant45 && plant45.ok === true && plant45.students === 7 && plant45.assignments === 11
      && plant45.contacts === 5 && plant45.notes === 1,
    plant45 && plant45.ok ? plant45.students + ' student(s), ' + plant45.assignments
      + ' assignment(s), ' + plant45.contacts + ' contact(s) and ' + plant45.notes + ' note(s)'
      : JSON.stringify(plant45));

  if (!plant45 || !plant45.ok) {
    skip('the whole of WO-4.5', 'the fixture did not install, so nothing below it could be '
      + 'measured against a list that has anything on it');
  } else {
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    await openSignals45();

    /*
      ACCEPTANCE LINE 1, AND IT IS THE WORK ORDER'S TRAP MEASURED RATHER THAN AVOIDED.

      Ada was written to about her grade three days ago and is missing three pieces of work. The
      grade rule is silenced; the missing rule is not, and it is what her row now leads on. A build
      keyed on the STUDENT returns her nowhere at all, and this check names both halves so that
      neither can be satisfied on its own.
    */
    const split = await evalJs(`(function(){
      var v = window.planbook.signalsView;
      var m = v.signalsModel();
      var row = m.concern.rows.filter(function(r){ return r.studentId === '${ADA}'; })[0];
      var held = m.concern.suppressed.filter(function(s){ return s.hit.studentId === '${ADA}'; });
      return {
        onList: !!row,
        lead: row ? row.lead.ruleId : '',
        rules: row ? row.hits.map(function(hh){ return hh.ruleId; }).sort() : [],
        heldRules: held.map(function(s){ return s.hit.ruleId; }),
        heldAudience: held.length ? held[0].audience : '',
        heldOn: held.length ? held[0].on : '',
        heldUntil: held.length ? held[0].until : '',
        heldDays: held.length ? held[0].days : -1 }; })()`);
    check('a contact about ONE signal takes that signal off the list and leaves the student on it '
      + 'for every other one — the student written to about her grade three days ago is still '
      + 'flagged for three missing assignments, and her grade rule is the one at the foot '
      + '(Acceptance line 1, and the work order’s Traps line: key on student + rule)',
      split.onList === true && split.lead === 'missing-count'
        && JSON.stringify(split.rules) === JSON.stringify(['missing-count'])
        && JSON.stringify(split.heldRules) === JSON.stringify(['grade-below'])
        && split.heldAudience === 'guardian' && split.heldDays === 3,
      JSON.stringify(split));

    /*
      AND THE OTHER TWO HALVES OF THE SAME LINE, IN TWO STUDENTS WHO DIFFER IN NOTHING BUT A DATE.

      Ben and Cal trip the same rule with the same numbers. Ben's contact is two days old and Cal's
      is twenty, against a fourteen-day default — so Ben has no row and Cal has one. A build that
      read the log and never read the threshold silences both; a build that read the threshold off
      `doc.signals` rather than through thresholdsOf() silences neither, because the key is absent.
    */
    const edges = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var names = m.concern.rows.map(function(r){ return r.studentId; });
      var held = m.concern.suppressed.map(function(s){ return s.hit.studentId; });
      return { rows: names, held: held,
        drawn: document.querySelectorAll('#signalsList [data-signal-row]').length,
        span: m.concern.suppressed.length ? m.concern.suppressed[0].span : -1 }; })()`);
    check('the window is the threshold’s and not the log’s: two students tripping the SAME rule '
      + 'with the same numbers come out differently because one contact is two days old and the '
      + 'other is twenty, against a fourteen-day default read through thresholdsOf()',
      edges.held.indexOf(BEN) >= 0 && edges.rows.indexOf(BEN) < 0
        && edges.rows.indexOf(CAL) >= 0 && edges.held.indexOf(CAL) < 0
        && edges.drawn === 2 && edges.span === 14,
      JSON.stringify(edges));

    /*
      ACCEPTANCE LINE 5 — HIDDEN, COUNTED, AND NEVER SILENTLY DROPPED — measured on the markup
      rather than on the model, because the model being right about a list nobody drew is exactly
      the failure this harness exists to catch.

      The foot says the count while the rows are closed. Opening it draws one `.sig-muted` per
      suppressed hit, each naming the student, the contact that silenced it and the date it comes
      back, each carrying its own way out.
    */
    const foot = await evalJs(`(function(){
      var b = document.getElementById('signalsConcernHidden');
      var box = document.getElementById('signalsConcernQuiet');
      return { shown: !b.classList.contains('hidden'), text: b.textContent,
        expanded: b.getAttribute('aria-expanded'),
        controls: b.getAttribute('aria-controls'),
        boxHidden: box.classList.contains('hidden'),
        rows: box.querySelectorAll('.sig-muted').length }; })()`);
    check('the column’s foot says HOW MANY the cooldown took out of it and the rows stay closed '
      + 'until they are asked for — a count with no door on it is a count a teacher cannot check, '
      + 'and a list that had quietly lost two students would look identical without it',
      foot.shown === true && /^2 you wrote about recently/.test(foot.text)
        && /show them/.test(foot.text) && foot.expanded === 'false'
        && foot.boxHidden === true && foot.rows === 0
        && foot.controls === 'signalsConcernQuiet',
      JSON.stringify(foot));

    await clickSel('#signalsConcernHidden');
    await new Promise(r => setTimeout(r, 250));
    const opened = await evalJs(`(function(){
      var b = document.getElementById('signalsConcernHidden');
      var box = document.getElementById('signalsConcernQuiet');
      var rows = Array.prototype.map.call(box.querySelectorAll('.sig-muted'), function(n){
        var why = n.querySelector('.sig-row-why');
        var undo = n.querySelector('.sig-undo');
        return { key: n.getAttribute('data-signal-held'),
          name: (n.querySelector('.sig-row-name') || {}).textContent || '',
          why: (why ? why.textContent : '').replace(/\\s+/g, ' ').trim(),
          undo: !!undo, undoText: undo ? undo.textContent : '',
          undoLabel: undo ? undo.getAttribute('aria-label') : '',
          isButton: n.tagName === 'BUTTON' };
      });
      return { text: b.textContent, expanded: b.getAttribute('aria-expanded'),
        boxHidden: box.classList.contains('hidden'), rows: rows,
        placeholder: /\\{\\{|undefined|NaN|\\[object/.test(box.textContent || '') }; })()`);
    const adaHeld = opened.rows.filter((r) => r.name.indexOf(ADA_N) >= 0)[0] || {};
    check('an expanded suppressed row NAMES the contact that silenced it and the date it comes '
      + 'back, carries the rule’s own sentence unchanged in front of it, and is not itself a '
      + 'button — the way to act anyway is the one control at its end',
      opened.expanded === 'true' && opened.boxHidden === false && opened.rows.length === 2
        && /hide them/.test(opened.text) && opened.placeholder === false
        && adaHeld.isButton === false && adaHeld.undo === true
        && adaHeld.undoText === 'Write anyway'
        && /Write anyway about Ada /.test(adaHeld.undoLabel || '')
        && /grade is 43\.48%, below 65%/.test(adaHeld.why || '')
        && /You wrote to their guardian about this on /.test(adaHeld.why || '')
        && /, 3 days ago\. Back on the list on /.test(adaHeld.why || ''),
      JSON.stringify(opened));

    /*
      *WRITE ANYWAY* — the owner's ruling of 2026-08-20 — AND THE THING IT MUST NOT DO.

      It puts one row back on the list and it writes NOTHING. The document is photographed either
      side of the tap, because a control that recorded the decision in the year would be a
      suppression a teacher could not find to undo, and because this screen has no writer in it at
      all (src/signals-view.js).
    */
    const anyway = await evalJs(`(function(){
      var s = window.planbook.store, v = window.planbook.signalsView;
      var before = JSON.stringify(s.getDoc());
      var btn = document.querySelector('#signalsConcernQuiet .sig-muted[data-signal-held*="'
        + '${BEN}' + '"] .sig-undo');
      if (!btn) return { found:false };
      btn.click();
      var after = JSON.stringify(s.getDoc());
      var m = v.signalsModel();
      return { found:true, same: before === after,
        rows: m.concern.rows.map(function(r){ return r.studentId; }),
        held: m.concern.suppressed.map(function(s2){ return s2.hit.studentId; }),
        drawn: document.querySelectorAll('#signalsList [data-signal-row]').length,
        foot: (document.getElementById('signalsConcernHidden') || {}).textContent }; })()`);
    check('*Write anyway* puts that one row back on the list, takes it off the count at the foot, '
      + 'and writes NOTHING to the document — the cooldown suggests, it does not hold the door '
      + 'shut, and a decision recorded in the year would be a suppression she could not find',
      anyway.found === true && anyway.same === true
        && anyway.rows.indexOf(BEN) >= 0 && anyway.held.indexOf(BEN) < 0
        && anyway.drawn === 3 && /^1 you wrote about recently/.test(anyway.foot || ''),
      JSON.stringify(anyway));

    /* And an arrival puts it back to the engine's answer, which is the same rule the class filter
       and the sort follow: nothing on this screen is remembered. */
    await goHome45();
    await openSignals45();
    const rearrived = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      return { rows: m.concern.rows.length, held: m.concern.suppressed.length,
        expanded: (document.getElementById('signalsConcernHidden') || {})
          .getAttribute('aria-expanded'),
        boxHidden: document.getElementById('signalsConcernQuiet')
          .classList.contains('hidden') }; })()`);
    check('an arrival closes the expansion and forgets every *Write anyway* — the same rule the '
      + 'class filter and the sort follow, and the reason none of the five values this screen '
      + 'holds reaches localStorage',
      rearrived.rows === 2 && rearrived.held === 2 && rearrived.expanded === 'false'
        && rearrived.boxHidden === true,
      JSON.stringify(rearrived));

    /*
      THE COOLDOWN IS BOTH DIRECTIONS. A praise list that says the same thing every week dies the
      same way a concern list does, and the foot under the praise column is drawn by the same
      function for that reason.

      THE PRAISE COLUMN HOLDS FOUR ROWS AND ONLY ONE OF THEM IS PLANNED, which is worth stating
      rather than tuning away. Ada, Ben and Cal each carry a `grade-rose` hit as well, because their
      missing marks sit at the FRONT of the term: `gradeWithout(4)` drops the last four counted rows
      and leaves them holding nothing but zeros, so the grade "before" is 0% and every one of them
      has risen by more than eight points. That is the rule working exactly as WO-4.3 specifies on a
      class whose whole record is eleven pieces of work, and it is asserted here rather than
      engineered out — the claim this check makes is about Gus, and the row count is pinned so that
      a change in either rule turns it red instead of passing quietly.
    */
    const praiseSide = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var row = m.praise.rows.filter(function(r){ return r.studentId === '${GUS}'; })[0];
      return { rows: m.praise.rows.length, lead: row ? row.lead.ruleId : '',
        rules: row ? row.hits.map(function(hh){ return hh.ruleId; }) : [],
        held: m.praise.suppressed.map(function(s){ return s.hit.ruleId; }),
        foot: (document.getElementById('signalsPraiseHidden') || {}).textContent,
        footShown: !document.getElementById('signalsPraiseHidden').classList.contains('hidden')
      }; })()`);
    check('the cooldown reaches the praise column too — the student written to yesterday about a '
      + 'run of strong scores keeps her row on the other rule and loses that one, with the same '
      + 'foot under the same kind of list',
      praiseSide.rows === 4 && praiseSide.lead === 'no-missing'
        && JSON.stringify(praiseSide.rules) === JSON.stringify(['no-missing'])
        && JSON.stringify(praiseSide.held) === JSON.stringify(['high-score-run'])
        && praiseSide.footShown === true
        && /^1 you wrote about recently/.test(praiseSide.foot || ''),
      JSON.stringify(praiseSide));

    /*
      ACCEPTANCE LINE 2, FIRST HALF: THERE IS NO SUPPRESSION STORE.

      The document is byte-identical either side of a pass that suppresses three hits across two
      columns, and no key anywhere in it is shaped like a remembered suppression. A byte comparison
      catches a write; the key scan catches one that was already there when the photograph was
      taken. Same pair § the praise column makes about the turnaround, and for the same reason.
    */
    const pure = await evalJs(`(function(){
      var s = window.planbook.store;
      var before = JSON.stringify(s.getDoc());
      window.planbook.signalsView.signalsModel();
      window.planbook.signalsView.renderSignals();
      var after = JSON.stringify(s.getDoc());
      var shaped = (after.match(/"[a-zA-Z]*[Ss]uppress[a-zA-Z]*"\\s*:/g) || [])
        .concat(after.match(/"cooldown[A-Za-z]*"\\s*:/g) || [])
        .concat(after.match(/"[a-zA-Z]*[Ss]ilenc[a-zA-Z]*"\\s*:/g) || [])
        .concat(after.match(/"quiet[A-Za-z]*"\\s*:/g) || []);
      return { same: before === after, shaped: shaped }; })()`);
    check('evaluating a suppressed list writes NOTHING to the document — the year is byte-identical '
      + 'either side of a pass that silences three hits across both columns, and no key anywhere in '
      + 'it is shaped like a stored suppression (`cooldownDays` is a THRESHOLD and is absent here, '
      + 'because an absent threshold key IS its default)',
      pure.same === true && pure.shaped.length === 0,
      'document unchanged = ' + pure.same + ', suppression-shaped keys = '
        + JSON.stringify(pure.shaped));

    /*
      ACCEPTANCE LINE 2, SECOND HALF: RESTORE A BACKUP AND THE COOLDOWNS COME BACK.

      Driven end to end through the real path — the same restoreFromText() a drop and a file picker
      land in, and the same confirm button — because that is what the acceptance line asks for in as
      many words. The file is this run's own document, so the restore is a no-op in content: what is
      being asserted is that the suppression survives a round trip through a FILE, which it can only
      do if it was derived from the log rather than stored beside it.
    */
    const fingerprint = async () => await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      return JSON.stringify(m.concern.suppressed.concat(m.praise.suppressed)
        .map(function(s){ return s.hit.studentId + '/' + s.hit.ruleId + '/' + s.on + '/'
          + s.until; }).sort()); })()`);
    const beforeRestore = await fingerprint();
    const TEXT = await evalJs('JSON.stringify(window.planbook.store.getDoc())');
    await evalJs(`(async function(){
      await window.planbook.backup.restoreFromText(${JSON.stringify(TEXT)},
        'Planbook backup.json'); return 1; })()`);
    await new Promise(r => setTimeout(r, 300));
    await clickSel('[data-backup-confirm]');
    await new Promise(r => setTimeout(r, 800));
    /* Every open dialog, not the topmost one: the restore path can leave both the confirm and the
       backup panel up, and a card tapped through an overlay is a click that lands on the scrim. */
    for (let pass = 0; pass < 3; pass++) {
      await evalJs("(function(){var o=document.querySelector('.modal-overlay:not(.hidden)');"
        + "if(!o) return 0; var b=o.querySelector('[data-modal-close]'); if(b) b.click();"
        + "return 1;})()");
      await new Promise(r => setTimeout(r, 200));
    }
    await openSignals45();
    const afterRestore = await fingerprint();
    check('the cooldown survives a restore, because it was never stored: the same three hits come '
      + 'back suppressed, off the same contacts, with the same return dates, after the document '
      + 'has been round-tripped through a backup FILE and the real confirm (Acceptance line 2)',
      beforeRestore === afterRestore && beforeRestore !== '[]',
      'before ' + beforeRestore + ' :: after ' + afterRestore);

    /*
      AND THE THRESHOLD IS A THRESHOLD. Zero suppresses nothing at all, thirty catches the contact
      that fourteen let through, and putting it back is a DELETE rather than a write of today's
      number — CLAUDE.md's rule, and the reason a default re-tuned in a later build still reaches a
      teacher who once pressed reset.
    */
    const tuned = await evalJs(`(function(){
      var s = window.planbook.store, v = window.planbook.signalsView;
      var out = {};
      var read = function(){
        var m = v.signalsModel();
        return { rows: m.concern.rows.length, held: m.concern.suppressed.length,
          praiseHeld: m.praise.suppressed.length }; };
      s.update(function(doc){
        if (!doc.signals || typeof doc.signals !== 'object') doc.signals = {};
        doc.signals.cooldownDays = 0; });
      out.off = read();
      s.update(function(doc){ doc.signals.cooldownDays = 30; });
      out.wide = read();
      s.update(function(doc){ delete doc.signals.cooldownDays; });
      out.back = read();
      out.keyLeft = Object.prototype.hasOwnProperty.call(s.getDoc().signals || {},
        'cooldownDays');
      v.renderSignals();
      return out; })()`);
    check('the cooldown reads `cooldownDays` through thresholdsOf(): zero suppresses nothing, '
      + 'thirty catches the twenty-day-old contact fourteen let through, and DELETING the key puts '
      + 'the documented default back rather than writing today’s number into the year',
      tuned.off.held === 0 && tuned.off.praiseHeld === 0 && tuned.off.rows === 3
        && tuned.wide.held === 3 && tuned.wide.rows === 1
        && tuned.back.held === 2 && tuned.back.rows === 2 && tuned.keyLeft === false,
      JSON.stringify(tuned));

    /*
      A CONTACT THAT DOES NOT SAY WHICH SIGNAL IT WAS ABOUT SILENCES NOTHING, which is the ruling
      this work order had to make and the one a later reader is most likely to reverse by accident.

      `ruleId` is Phase 5's to write and the reader has to tolerate its absence. Tolerating it by
      silencing EVERYTHING would be the work order's own trap arriving through the back door of a
      missing field, so it under-fires instead: one duplicate email against a list that has quietly
      lost a student.
    */
    const nameless = await evalJs(`(function(){
      var s = window.planbook.store, v = window.planbook.signalsView;
      var before = v.signalsModel();
      s.update(function(doc){
        doc.log.push({ id:'l_wo45_x', studentId:'${CAL}',
          at: window.planbook.attendance.todayISO() + 'T09:00:00+00:00', kind:'contact',
          audience:'guardian', subject:'No rule on this one', body:'' });
      });
      var after = v.signalsModel();
      s.update(function(doc){
        doc.log = doc.log.filter(function(e){ return e.id !== 'l_wo45_x'; }); });
      var back = v.signalsModel();
      return { beforeRows: before.concern.rows.length, afterRows: after.concern.rows.length,
        afterHeld: after.concern.suppressed.length, backRows: back.concern.rows.length }; })()`);
    check('a `contact` with no `ruleId` on it silences nothing — the field is Phase 5’s to write, '
      + 'the reader tolerates its absence, and tolerating it by silencing everything would be this '
      + 'work order’s trap arriving through a missing field',
      nameless.beforeRows === 2 && nameless.afterRows === 2 && nameless.afterHeld === 2
        && nameless.backRows === 2,
      JSON.stringify(nameless));

    /*
      ACCEPTANCE LINE 3 — THE QUIET MIDDLE EXCLUDES ANYONE FLAGGED, PRAISED, OR CONTACTED THIS TERM.

      All four exclusions are in one class: Ada and Cal are flagged, Gus is praised, Fay was written
      home about. Ben is the interesting one — his only rule is currently SUPPRESSED, so a build
      that took the quiet middle off the post-cooldown list would put him in it, which is a screen
      telling a teacher she has lost track of the student she emailed on Tuesday.
    */
    await evalJs('window.planbook.signalsView.renderSignals();1');
    const quiet = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      return { count: m.quiet.count,
        ids: m.quiet.rows.map(function(r){ return r.studentId; }),
        days: m.quiet.rows.map(function(r){ return r.days; }),
        wrote: m.quiet.rows.map(function(r){ return r.wrote; }),
        says: m.quiet.rows.map(function(r){ return r.explanation; }),
        head: (document.getElementById('signalsQuietHead') || {}).textContent,
        drawn: document.querySelectorAll('#signalsQuietList [data-signal-quiet]').length,
        panelHidden: document.getElementById('signalsQuiet').classList.contains('hidden'),
        emptyHidden: document.getElementById('signalsQuietEmpty').classList.contains('hidden'),
        figures: Array.prototype.map.call(
          document.querySelectorAll('#signalsQuietList .sig-since'), function(n){
            return n.textContent; }) }; })()`);
    check('the quiet middle holds the two students who are neither flagged, nor praised, nor '
      + 'contacted this term — and not the student whose only signal is currently SUPPRESSED, who '
      + 'has been both (Acceptance line 3)',
      quiet.count === 2 && JSON.stringify(quiet.ids) === JSON.stringify([DOT, EVE])
        && quiet.drawn === 2 && quiet.panelHidden === false && quiet.emptyHidden === true
        && quiet.head === 'The quiet middle · 2',
      JSON.stringify(quiet));

    check('a NOTE TO SELF is not contact: the student with a four-day-old note is still on the '
      + 'list, and what the note did was move her CLOCK — she sits under the student nothing has '
      + 'ever been written about, whose clock runs from the term’s own start',
      quiet.days.length === 2 && quiet.days[0] === 40 && quiet.days[1] === 4
        && quiet.wrote[0] === false && quiet.wrote[1] === true
        && /all term \u2014 40 days\.$/.test(quiet.says[0] || '')
        && /in 4 days\.$/.test(quiet.says[1] || '')
        && /has no graded work yet/.test(quiet.says[0] || '')
        && quiet.figures[0] === '40 dayssince anything',
      JSON.stringify({ days: quiet.days, wrote: quiet.wrote, says: quiet.says,
        figures: quiet.figures }));

    /* AND A QUIET ROW GOES TO THAT STUDENT'S RECORD, which is the one row on this screen that does
       not open the signal card: the card answers "why is she on the list", and the whole of what is
       true about a quiet student is that she is on none. */
    await clickSel('#signalsQuietList [data-signal-quiet]');
    await new Promise(r => setTimeout(r, 500));
    const landed = await evalJs(`(function(){
      var view = document.querySelector('main > :not(.hidden)');
      return { view: view ? view.id : '',
        named: (document.body.textContent || '').indexOf('${DOT_N}') !== -1,
        card: !!document.querySelector('.modal-overlay:not(.hidden)') }; })()`);
    check('a quiet-middle row opens that student’s RECORD rather than the signal card — there is no '
      + 'card to open for a student no rule fired for, and the thing that resolves "I have lost '
      + 'track of her" is her record',
      landed.view === 'detailView' && landed.named === true && landed.card === false,
      JSON.stringify(landed));
    await openSignals45();

    /*
      PRESENTATION MODE TAKES BOTH NEW SURFACES DOWN WITH THE SCREEN, and it does it through the one
      asker this view already had. There is no presentationMode() test in the panel or in the foot;
      what happens is that nothing is evaluated at all, so there is nothing for either to draw.
    */
    const projected = await evalJs(`(function(){
      var p = window.planbook.supports, v = window.planbook.signalsView;
      var was = p.presentationMode();
      p.setPresentationMode(true);
      v.renderSignals();
      var m = v.signalsModel();
      var out = {
        quietCount: m.quiet.count, held: m.concern.suppressed.length + m.praise.suppressed.length,
        panelHidden: document.getElementById('signalsQuiet').classList.contains('hidden'),
        footHidden: document.getElementById('signalsConcernHidden').classList.contains('hidden'),
        blockedUp: !document.getElementById('signalsBlocked').classList.contains('hidden'),
        names: /${DOT_N}|${ADA_N}|${BEN_N}/.test(document.getElementById('signalsView').textContent)
      };
      p.setPresentationMode(!!was);
      v.renderSignals();
      out.backQuiet = v.signalsModel().quiet.count;
      return out; })()`);
    check('presentation mode takes the quiet middle and both cooldown feet down with the rest of '
      + 'the screen, with no name of any of the seven students left anywhere in the view — and '
      + 'neither surface asks presentationMode() for itself, because nothing was evaluated at all',
      projected.quietCount === 0 && projected.held === 0 && projected.panelHidden === true
        && projected.footHidden === true && projected.blockedUp === true
        && projected.names === false && projected.backQuiet === 2,
      JSON.stringify(projected));

    /* Every control WO-4.5 adds, under a coarse pointer, at the 44px floor — measured rather than
       read off the stylesheet. Nothing on this screen cites the month chip's 28px departure, which
       is one control's ruling and not a precedent (CLAUDE.md § Conventions). */
    await clickSel('#signalsConcernHidden');
    await new Promise(r => setTimeout(r, 200));
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    const touch = await evalJs(`(function(){
      var small = [];
      var seen = 0;
      Array.prototype.forEach.call(document.querySelectorAll(
        '.sig-hidden, .sig-undo, #signalsQuietList .sig-row'), function(n){
          var r = n.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          seen++;
          if (r.height < 44) small.push({ cls: n.className,
            t: (n.textContent || '').trim().slice(0, 24), h: Math.round(r.height) });
        });
      var d = document.documentElement;
      return { coarse: matchMedia('(pointer: coarse)').matches, seen: seen, small: small,
        docScroll: d.scrollWidth, docClient: d.clientWidth }; })()`);
    check('every control this work order adds clears 44px under a coarse pointer — the two column '
      + 'feet, both *Write anyway* buttons and every quiet-middle row — with no sideways scroll at '
      + '390px',
      touch.coarse === true && touch.seen >= 5 && touch.small.length === 0
        && touch.docScroll <= touch.docClient + 1,
      JSON.stringify(touch));
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 300));

    /*
      AND THE HOME SCREEN'S CARD SLOT — WO-4.5's fourth deliverable, and the two things about it
      that are decisions rather than pixels.

      THE COUNT IS POST-COOLDOWN, which is the whole reason this chip belongs to this work order
      rather than to WO-4.2: a number that included the students the engine has decided not to ask
      about again would be the same number every week.

      AND THE SLOT MUST NOT WRAP. src/home.css reserves 24px for one row of chips so that the first
      real datum on a page of five cards reflows nothing, and this is the second chip to go in it.
      The measurement is the invariant, not the arithmetic in the header comment: the slot's own box
      is compared against a single chip's, so a third chip — or a longer word in this one — turns
      this red rather than being noticed on an iPad in September.
    */
    await goHome45();
    const card = await evalJs(`(function(){
      var open = document.querySelector('#homeGrid [data-class-tab="${CLS}"]');
      if (!open) return { found:false };
      var slot = open.querySelector('.class-card-signals');
      var chips = slot ? slot.querySelectorAll('.class-card-count') : [];
      var texts = Array.prototype.map.call(chips, function(n){ return n.textContent; });
      var chipBox = chips.length ? chips[0].getBoundingClientRect() : null;
      var slotBox = slot ? slot.getBoundingClientRect() : null;
      return { found:true, texts: texts,
        slotHeight: slotBox ? Math.round(slotBox.height) : -1,
        chipHeight: chipBox ? Math.round(chipBox.height) : -1,
        cardWidth: Math.round(open.getBoundingClientRect().width) }; })()`);
    check('the class card carries the POST-COOLDOWN count of students who need attention beside the '
      + 'ungraded count — four STUDENTS and not the eight hits the pass produced, with the student '
      + 'whose only concern rule is silenced counted for the praise rule that is not — and the two '
      + 'chips still sit on ONE row inside the height src/home.css reserves, which is the invariant '
      + 'a third chip would break on every card at once',
      card.found === true && card.texts.length === 2 && card.texts[1] === '4 need you'
        && card.chipHeight > 0 && card.slotHeight < card.chipHeight * 2,
      JSON.stringify(card));
    /*
      AND THE PASS IS NOT RUN WHILE THE GRID IS NOT ON SCREEN — WHICH IS THE ONE CLAIM THIS SECTION
      MAKES AND DOES NOT MEASURE, said here rather than left as a gap for a reader to find.

      src/shell.js chains refreshHome() off afterAttendanceChange(), which fires on EVERY mark, and
      attendance marking is on the critical path (CLAUDE.md). So src/home.js skips the signal pass
      while src/views.js says the grid is not the view on screen. Timing it from out here would want
      `home` and `views` on the window.planbook seam — two new entries for one performance guard —
      and that widening was declined: the seam's own rule is that an entry exists because a claim
      cannot be made any other way, and this one can be made by reading eight lines of src/home.js.
      What IS measured above is the thing a teacher sees: the chip is right when the grid is up.
    */
  }

  /* ── and the fixture comes back off ── */
  const cleaned45 = await evalJs(`(function(){
    var s = window.planbook.store;
    s.update(function(doc){
      doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      doc.students = (doc.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo45') !== 0; });
      doc.assignments = (doc.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo45_') !== 0; });
      doc.log = (doc.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo45') !== 0; });
      if (doc.scores) {
        Object.keys(doc.scores).forEach(function(k){
          if (k.indexOf('a_wo45_') === 0) delete doc.scores[k]; });
      }
    });
    var d = s.getDoc();
    return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
      students:(d.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo45') === 0; }).length,
      assignments:(d.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo45_') === 0; }).length,
      log:(d.log || []).filter(function(e){
        return String(e.id).indexOf('l_wo45') === 0; }).length,
      scores: Object.keys(d.scores || {}).filter(function(k){
        return k.indexOf('a_wo45_') === 0; }).length,
      signals: JSON.stringify(d.signals || {}) }; })()`);
  if ((await onView45()) !== 'homeView') await goHome45();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-4.5 fixture came back off the document — class, seven students, eleven '
    + 'assignments, six log entries and every score bag — the signals block was left exactly as it '
    + 'was found, and the page was left on the grid',
    cleaned45.classes === 0 && cleaned45.students === 0 && cleaned45.assignments === 0
      && cleaned45.log === 0 && cleaned45.scores === 0
      && cleaned45.signals === (plant45 ? plant45.hadSignals : '{}')
      && (await onView45()) === 'homeView',
    cleaned45.classes + ' class(es), ' + cleaned45.students + ' student(s), '
      + cleaned45.assignments + ' assignment(s), ' + cleaned45.log + ' log entr(ies) and '
      + cleaned45.scores + ' score bag(s) left behind; signals block = ' + cleaned45.signals
      + ' (wanted ' + (plant45 ? plant45.hadSignals : '{}') + '), left on #' + (await onView45()));
}
}
