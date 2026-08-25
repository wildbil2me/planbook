/* register-opens-on-term.mjs — the register opens on the term, not on the clock (WO-2.52)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeColumns, nodeWeekdayAhead, daysApart, tomorrow } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, seam } = h;

/* ───────── the register opens on the term, not on the clock (WO-2.52) ─────────
 *
 * THE THIRD EDIT TO ONE SCREEN IN THREE DAYS, AND THE ONE THE OTHER TWO LEFT BEHIND. WO-2.50 gave
 * this grid a term bound and WO-2.51 gave it a voice about the term that holds today. Neither moved
 * the thing both of them are about: the strip was still anchored on the CLOCK. On 2026-08-19, a
 * fortnight before the owner's first term, the register drew six columns that were every one of them
 * outside every term — greyed end to end, no tappable cell, no control but the door to the term
 * editor. WO-2.50 working exactly as specified, and a screen with nothing on it.
 *
 * WHAT IS MEASURED HERE IS THE SEPARATION rather than the feature. The WINDOW follows the term and
 * the GATE follows the clock, except inside a term of this class — so every phase below asks those
 * two questions apart, and neither answer is ever read off the other. The pair that settles it is
 * phase A's probe against phase D's: the same five writers, called one at a time with the ledger put
 * back between them, ALL landing on a future day inside a term and NOT ONE of them moving on the
 * next weekday of a class whose terms carry no dates. Either alone would be satisfied by a build
 * that had simply stopped checking, which is the vacuity trap tools/README.md § trap 5 describes and
 * the one the WO-2.50 section already paid for once.
 *
 * EVERY DATE HERE IS DERIVED FROM TODAY, for the reason the two sections above give at length. The
 * term is built AHEAD of today — ten weekdays out, running to forty — so today is genuinely before
 * it, the anchor is genuinely the term's first day, and there is a real fortnight for the band to
 * count. A fixture pinned to a literal September 2 would stop testing any of this the moment the
 * calendar passed it, which is the fortnight the work order was written in.
 *
 * THE CALENDAR IS EMPTIED, AND THAT IS A PREMISE RATHER THAN A TIDY-UP. The forward stop is the
 * furthest of the last day off and the SELECTED TERM'S OWN END, and acceptance line 4 is about the
 * second of those — so a day off left in the document by an earlier section would move the stop this
 * block asserts and the check would be reporting about somebody else's fixture. The two phases that
 * need a horizon past today plant one event of their own and take it away again.
 *
 * AND THE ONE ROUTE THIS BLOCK CANNOT DRIVE IS SAID OUT LOUD RATHER THAN QUIETLY DROPPED. With a
 * term that has ENDED selected, editDate() answers nothing at all — so today, paged to, carries the
 * 🚫 and no ✏, and no control on the screen marks today. Acceptance line 6 ("the selected term never
 * bounds a write") is therefore driven through the writers themselves, one at a time, which is the
 * same instrument WO-2.50 uses for the same claim and the reason that probe exists at all.
 */
console.log('\n--- the register opens on the term, not on the clock (WO-2.52) ---');

if (!seam) {
  skip('the registry opens on the selected term rather than on today',
    'the window.planbook seam is not present, so nothing here could arrange a term or read a column back');
} else {
  /* Six columns need a laptop's width, and the section above cleared its own override on the way
     out. Stated here rather than inherited, which is the note every section in this run makes. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));

  const D = nodeColumns(6, 0);                 /* [today, ...five weekdays back] */
  /* The term this section is really about: it OPENS ten weekdays from now, which is a fortnight of
     calendar days for the band to count, and runs thirty weekdays past that so `Later ▶` has a wall
     to reach. NEXT is the day after the anchor — the "September 3" of acceptance line 2, the day
     that is inside the term, is writable, and is still not the day the screen opened on. */
  const OPENS = nodeWeekdayAhead(10);
  const NEXT = nodeWeekdayAhead(11);
  const ENDS = nodeWeekdayAhead(40);
  /* One weekday before the term opens, for the phase that needs a horizon past today WITHOUT a
     dated term to provide one: a day off is the other thing forwardLimit() walks to. */
  const DAY_OFF = nodeWeekdayAhead(9);
  const TOMORROW = nodeWeekdayAhead(1);
  const Q1_ID = 'tm_wo252a', Q2_ID = 'tm_wo252b';
  const Q1 = 'WO-2.52 first', Q2 = 'WO-2.52 second';
  const TRI_A = 'Trimester 1', TRI_B = 'Trimester 2';
  /* The pair that puts today INSIDE the second term with the tab on the first — the same shape
     WO-2.51's fixture uses, and the arrangement acceptance lines 6, 7 and 8 are all about. The
     early term ends on the fourth column back and the late one starts on the second, so the two are
     contiguous and today sits three columns inside the late one. */
  const EARLY_TERM = { id: Q1_ID, label: Q1, start: D[5], end: D[3] };
  const LATE_TERM = { id: Q2_ID, label: Q2, start: D[2], end: ENDS };
  const AHEAD_TERM = { id: Q1_ID, label: Q1, start: OPENS, end: ENDS };
  /* How many CALENDAR days from today to the day the term opens — the number the band prints, and
     the one thing in this section that is arithmetic rather than a string. daysApart() is the same
     walk src/attendance.js's daysUntil() makes, written in Node, which is what makes the comparison
     a claim rather than an echo. */
  const OPENS_IN = daysApart(OPENS, D[0]);

  /* A CLICK THAT REPORTS RATHER THAN THROWS, for the reason the two sections above give: half the
     controls this block reaches for — the anchor day's cells, the ✏ on a term's last day — are
     controls a mutated build does not draw, clickSel() throws on a missing one, and an abort there
     would take every report under it down with the stack trace. */
  const clickIf = async (sel) => {
    if (!(await has(sel))) return false;
    await clickSel(sel);
    return true;
  };

  const INSTALL_252 = `(function(){
    function hookOf(b){
      var out = 'none';
      Array.prototype.slice.call(b.attributes).forEach(function(x){
        if (x.name.indexOf('data-') === 0 && x.name !== 'data-attendance-col') {
          out = x.name + (x.value ? '=' + x.value : ''); }
      });
      return out;
    }
    window.__wo252 = function(){
      var a = window.planbook.attendance, c = window.planbook.classes;
      var doc = window.planbook.store.getDoc();
      var id = c.getSelectedClassId();
      var heads = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead th[data-attendance-col]'));
      var band = document.getElementById('attendanceBanner');
      var bandBtns = band ? Array.prototype.slice.call(band.querySelectorAll('button')) : [];
      var pager = document.getElementById('attendancePager');
      var pagerBtns = pager ? Array.prototype.slice.call(pager.querySelectorAll('button')) : [];
      var nav = document.getElementById('termNav');
      var tabs = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
      var stateEl = document.getElementById('attendanceState');
      var view = document.getElementById('classView');
      var holds = c.termContaining(id, a.todayISO());
      return {
        today: a.todayISO(),
        classId: id,
        term: c.getSelectedTermId(),
        holds: holds ? holds.id : '',
        active: tabs.filter(function(b){ return b.classList.contains('active'); })
          .map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
        pref: JSON.stringify(window.planbook.getPref('openTermIds') || {}),
        registryUp: !!(view && !view.classList.contains('hidden')),
        /* The date heading and the state line: the two things that say IN WORDS which day the grid
           under them is about, and the pair focusDate() exists for.
           (No backticks in this comment: it is inside a template literal.) */
        heading: (document.getElementById('attendanceDate') || {}).textContent || '',
        stateLine: stateEl ? stateEl.textContent : '',
        actions: Array.prototype.slice.call(
          document.querySelectorAll('#attendanceActions button')).map(hookOf).join(' | '),
        band: {
          up: !!(band && !band.classList.contains('hidden')),
          cls: band ? band.className : '',
          text: band ? band.textContent : '',
          buttons: bandBtns.length,
          hooks: bandBtns.map(hookOf).join(' | ') },
        pager: pagerBtns.map(function(b){
          return { hook: hookOf(b), disabled: !!b.disabled, title: b.title || '' }; }),
        columns: heads.map(function(th){
          var d = th.getAttribute('data-attendance-col');
          var chip = th.querySelector('.attendance-day-state');
          var btn = th.querySelector('button');
          var cells = Array.prototype.slice.call(
            document.querySelectorAll('#attendanceBody td[data-attendance-col="' + d + '"] > *'))
            .filter(function(n){ return n.className.indexOf('attendance-cell-time') < 0; });
          return {
            date: d,
            state: a.stateOf(id, d),
            chip: chip ? chip.textContent : '',
            colClass: th.className,
            btn: btn ? hookOf(btn) : 'none',
            btnTitle: btn ? (btn.title || '') : '',
            cells: cells.length,
            tappable: cells.filter(function(n){ return n.tagName === 'BUTTON'; }).length,
            tags: cells.map(function(n){ return n.tagName; })
              .filter(function(v, i, all){ return all.indexOf(v) === i; }).join(',') }; }),
        events: (doc.events || []).length,
        attJson: JSON.stringify(doc.attendance || []) };
    };
    return 1; })()`;

  /* Flushed before every read, for tools/README.md trap 6: every save is debounced, so a read taken
     a moment after a tap can be looking at the document from before it. */
  const read52 = () => evalJs('(async function(){ await window.planbook.store.flush();'
    + ' return window.__wo252(); })()');
  const col52 = (r, date) => r.columns.filter((c) => c.date === date)[0] || null;
  const dates52 = (r) => r.columns.map((c) => c.date);
  const page52 = (r, which) => r.pager.filter((b) => b.hook === 'data-attendance-page=' + which)[0]
    || { hook: 'missing', disabled: false, title: '' };
  /* FILTERED BY CLASS AS WELL AS BY DATE, for the reason the WO-2.50 section gives at its own copy
     of this line: the document this block runs on carries records for five other classes on the
     same weekdays, and a reader keyed on the date alone answers with a neighbour's record. */
  const marks52 = (r, date) => JSON.parse(r.attJson)
    .filter((x) => x.date === date && x.classId === r.classId);

  /*
    FIVE WRITERS, HANDED THE DATE DIRECTLY AND ASKED ONE AT A TIME, WITH THE LEDGER PUT BACK BETWEEN
    THEM. The smaller sibling of the WO-2.50 section's nine-writer probe, and it is smaller for a
    reason rather than out of haste: the four it leaves out — unconfirmAll, setNote, untakeClass and
    undropClass — all need a RECORD before they do anything, so on the empty future day this section
    is about, their silence would be true of any build at all. The five here are the ones that can
    act on a date with nothing on it, which is what a day ahead of today always is.

    ONE AT A TIME IS THE WHOLE POINT. Run in a row they undo each other — setMark takes the class,
    takeClass fills it, dropClass writes an exception over the top — and the comparison comes out net
    zero on any date, bound or not. That check goes green on the build with the gate and on the build
    without it, which is exactly how the first draft of the WO-2.50 probe failed.

    editDay() writes nothing to the ledger by design, so what is watched for it is the DATE HEADING,
    which is the thing it moves: focusDate() answers the unlocked day the moment there is one.
  */
  const probe52 = (date) => evalJs(`(async function(){
    var a = window.planbook.attendance, c = window.planbook.classes, s = window.planbook.store;
    var id = c.getSelectedClassId();
    var cls = (s.getDoc().classes || []).filter(function(x){ return x.id === id; })[0];
    /* The student this block planted, not roster[0]: the class was already carrying a roster when
       this section arrived. (No backticks in this comment: it is inside a template literal.) */
    var who = (cls.roster || []).indexOf('wo252-a') >= 0 ? 'wo252-a' : (cls.roster || [])[0];
    var on = ${JSON.stringify(date)};
    var base = JSON.stringify(s.getDoc().attendance || []);
    var baseHead = (document.getElementById('attendanceDate') || {}).textContent || '';
    var out = {};
    function run(name, fn){
      fn();
      var now = JSON.stringify(s.getDoc().attendance || []);
      var head = (document.getElementById('attendanceDate') || {}).textContent || '';
      out[name] = (now !== base) || (head !== baseHead);
      /* Back to the same starting document for the next one. (No backticks: template literal.) */
      s.update(function(d){ d.attendance = JSON.parse(base); });
      a.lockDay();
      a.renderAttendance();
    }
    run('setMark', function(){ a.setMark(who, 'A', on); });
    run('cycleMark', function(){ a.cycleMark(who, on); });
    run('takeClass', function(){ a.takeClass(on); });
    run('dropClass', function(){ a.dropClass(on); });
    run('editDay', function(){ a.editDay(on); });
    await s.flush();
    return { moved: out, student: who,
      ledger: JSON.stringify(s.getDoc().attendance || []) }; })()`);
  const allMoved = (p) => Object.keys(p.moved).every((k) => p.moved[k] === true);
  const noneMoved = (p) => Object.keys(p.moved).every((k) => p.moved[k] === false);

  /* One arrangement of terms and one choice of tab, through the store and through selectTerm() — no
     control types six dates. Everything after a call to this is either a read or a real click.

     THE TAB IS CHOSEN LAST SINCE WO-2.54, and the reorder is that work order's, not a tidy-up:
     `Today` moves the selected term to the one nearest today now, so a pageDays('today') used to put
     the paging back to 0 walks straight out of the arrangement it was called to set up. It reported
     exactly that — the tab on the term that holds today, in a phase whose whole subject is a tab on
     the term that does not. The paging reset comes first and the tap comes after it. */
  const arrange52 = (terms, pick) => evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var id = c.getSelectedClassId();
    var cls = (s.getDoc().classes || []).filter(function(x){ return x.id === id; })[0];
    if (!cls) return { ok:false, why:'no class is open' };
    a.lockDay();
    a.pageDays('today');
    s.update(function(){ cls.terms = ${JSON.stringify(terms)}; });
    c.selectTerm(${JSON.stringify(pick)});
    a.setSearch(''); a.setFilter('all');
    a.renderAttendance();
    await s.flush();
    return { ok:true, term: c.getSelectedTermId() }; })()`);

  /* THE LEDGER BACK TO EMPTY FOR THIS CLASS BETWEEN PHASES, and it is a premise rather than
     housekeeping: WO-2.50's decision 2 says a day that already carries a record is never out of
     term, so a mark left behind by the phase above would make the next phase's locked column
     editable for a reason with nothing to do with what it is asserting. The day off is the same
     claim about the other horizon — see the section header, and phase D's own note. */
  const clear52 = (dayOff) => evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var id = c.getSelectedClassId();
    s.update(function(d){
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== id; });
      d.events = (d.events || []).filter(function(e){ return e.id !== 'ev_wo252'; });
      if (${dayOff ? 'true' : 'false'}) d.events.push({ id:'ev_wo252', kind:'no-school',
        date: ${JSON.stringify(DAY_OFF)}, endDate: ${JSON.stringify(DAY_OFF)},
        title:'WO-2.52 institute day', classIds: [] });
    });
    /* THE TAB IS PUT BACK AFTER THE PAGING RESET (WO-2.54). This is a ledger reset rather than a
       control the fixture is exercising, and since that work order pageDays('today') also moves the
       selected term — so without these two lines it silently re-arranges the phase it is clearing
       for. (No backticks in this comment: it is inside a template literal.) */
    var pinned = c.getSelectedTermId();
    a.lockDay();
    a.pageDays('today');
    if (pinned && c.getSelectedTermId() !== pinned) c.selectTerm(pinned);
    a.renderAttendance();
    await s.flush();
    return (s.getDoc().events || []).length; })()`);

  const plant252 = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var id = c.getSelectedClassId();
    var cls = (d.classes || []).filter(function(x){ return x.id === id; })[0];
    if (!cls) return { ok:false, why:'no class is open, so there is no registry to anchor' };
    /* Parked on the window rather than carried back through CDP, for the reason the WO-2.17,
       WO-2.50 and WO-2.51 fixtures all give: the teardown has to put the SAME object graph back,
       and a document that made the round trip would come back a copy of a copy.
       (No backticks in this comment: it is inside a template literal.) */
    window.__wo252save = { doc: JSON.stringify(d), classId: id, termId: c.getSelectedTermId() };
    s.update(function(doc){
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.events)) doc.events = [];
      if (!Array.isArray(cls.roster)) cls.roster = [];
      doc.attendance = doc.attendance.filter(function(r){ return r.classId !== id; });
      /* THE CALENDAR EMPTIED, which is this section's second premise — see the header. It comes
         back with the document at the foot of the block, like everything else here.
         (No backticks: template literal.) */
      doc.events = [];
      doc.students.push({ id:'wo252-a', first:'Term', last:'Anchor' });
      doc.students.push({ id:'wo252-b', first:'Term', last:'Bearing' });
      cls.roster.push('wo252-a');
      cls.roster.push('wo252-b');
    });
    a.setSearch(''); a.setFilter('all');
    c.selectClass(id);
    a.renderAttendance();
    await s.flush();
    return { ok:true, classId:id, name:cls.name }; })()`);

  if (!plant252.ok) {
    check('the WO-2.52 fixture is real: a class with a roster is open on the registry, over an empty calendar',
      false, plant252.why);
  } else {
    await evalJs(INSTALL_252);

    /* ── PHASE A: the fortnight before the term — the owner's own screen ── */
    await arrange52([AHEAD_TERM], Q1_ID);
    await clear52(false);
    const before = await read52();
    const anchorCol = col52(before, OPENS);

    check('the WO-2.52 fixture is real: the registry is up on a class whose only term starts ten weekdays from now, the calendar is empty, and the class holds no attendance at all',
      before.registryUp && before.today === D[0] && before.term === Q1_ID
        && before.events === 0 && before.holds === ''
        && JSON.parse(before.attJson)
          .filter((r) => r.classId === before.classId).length === 0,
      'the app says today is ' + JSON.stringify(before.today) + ', this file derived '
        + JSON.stringify(D[0]) + '; the one term runs ' + OPENS + ' … ' + ENDS
        + ', the open tab is ' + JSON.stringify(before.term) + ', the term containing today is '
        + JSON.stringify(before.holds) + ', the document holds ' + before.events
        + ' calendar event(s), and this class holds '
        + JSON.parse(before.attJson).filter((r) => r.classId === before.classId).length
        + ' record(s)');

    check('the strip opens on the TERM and not on the clock: its newest column is the term’s first day, and today — which is where it opened before this work order — is nowhere on screen',
      dates52(before)[0] === OPENS && before.columns.length === 6
        && dates52(before).indexOf(D[0]) < 0
        && dates52(before).every((d) => d > D[0]),
      'the window is ' + JSON.stringify(dates52(before)) + ' against a term of ' + OPENS + ' … '
        + ENDS + ' and a today of ' + D[0]);

    /*
      AND THE FIVE COLUMNS BEHIND THE ANCHOR ARE STILL DRAWN, WHICH IS DECISION 3 SEEN AT ITS NEAR
      EDGE. The strip walks weekdays BACK from the day it is built from, so opening on September 2
      puts the last week of August behind it — greyed, Off term, nothing tappable. That is the soft
      wall working rather than a leak: a hard wall would be the WINDOW enforcing a rule instead of
      the GATE, which is the one thing WO-2.50's own Traps line forbids.

      IT IS ALSO WHY THE ACCEPTANCE LINE'S "no August column is on screen" IS ASSERTED IN PORTRAIT
      BELOW AND NOT HERE. On a landscape grid the sentence cannot be literally true of a six-column
      window that ends on the term's first day, and the check that claimed it was red on a correct
      app. Portrait draws exactly one column (WO-2.12), and on the owner's own iPad — which is the
      device the acceptance line was written about and the one the 👤 line asks for — it is the
      whole of what she sees.
    */
    check('and the days between today and the term are drawn rather than walled off — every column behind the anchor is greyed Off term with nothing tappable in it, which is the soft wall seen from the inside',
      before.columns.filter((c) => c.date < OPENS).length === 5
        && before.columns.filter((c) => c.date < OPENS).every((c) => c.chip === 'Off term'
          && c.tappable === 0 && c.btn === 'none'
          && c.colClass.indexOf('attendance-col-off-term') >= 0),
      'behind ' + OPENS + ' the strip drew '
        + JSON.stringify(before.columns.filter((c) => c.date < OPENS)
          .map((c) => c.date + ' ' + c.chip + '/' + c.btn + '/' + c.tappable)));

    check('and the band above it says why, counting CALENDAR days to the day the term opens — one sentence, in its own tone, with nothing to tap on it',
      before.band.up && before.band.text === Q1 + ' opens in ' + OPENS_IN + ' days.'
        && before.band.buttons === 0 && before.band.hooks === ''
        && before.band.cls.indexOf('off-term') >= 0
        && before.band.cls.indexOf('rollover') < 0,
      JSON.stringify(before.band.text) + ' — this file counted ' + OPENS_IN
        + ' calendar days from ' + D[0] + ' to ' + OPENS + ' — wearing '
        + JSON.stringify(before.band.cls) + ' with ' + before.band.buttons + ' button(s) on it');

    check('and the heading over the grid is about the day the strip is standing on rather than about today — the mismatch focusDate() exists to prevent',
      before.heading.indexOf(' ' + Number(OPENS.slice(8, 10)) + ', ' + OPENS.slice(0, 4)) > 0
        && before.heading.indexOf(' ' + Number(D[0].slice(8, 10)) + ', ' + D[0].slice(0, 4)) < 0
        && before.stateLine.indexOf('Off term') < 0,
      'the heading reads ' + JSON.stringify(before.heading) + ' over a state line reading '
        + JSON.stringify(before.stateLine) + ' (the strip opened on ' + OPENS + ', today is '
        + D[0] + ')');

    await clickIf('#attendanceBody td[data-attendance-col="' + OPENS
      + '"] [data-attendance-cell="wo252-a"]');
    const marked = await read52();
    check('the day the strip opened on is LIVE with nothing pressed — its cells are buttons, its head carries no ✏ because there is nothing there to open or to close, and a real tap lands a record on that day',
      !!anchorCol && anchorCol.tappable > 0 && anchorCol.tags === 'BUTTON'
        && anchorCol.btn === 'none' && anchorCol.chip === 'Ahead'
        && anchorCol.colClass.indexOf('attendance-col-editing') >= 0
        /* The RECORD is the claim, and it is the cost this work order booked on the record: one
           tap on a day a fortnight out and the class is taken, in the term percentage and in the
           year total, for a class that has not met. Asserted as the record landing on that exact
           date and the column reading taken — not as a mark under the student's own id, because a
           taken class stores what is NOT present and the tapped student's P is the default the
           record leaves out (see cellFor()'s `codeOf(cell) || PRESENT`). A check that asked for
           the key was red on a correct app. */
        && marks52(marked, OPENS).length === 1
        && (col52(marked, OPENS) || {}).state === 'taken',
      'the anchor column read ' + JSON.stringify(anchorCol) + ' before the tap, and the tap wrote '
        + JSON.stringify(marks52(marked, OPENS)) + ' leaving the column reading '
        + JSON.stringify((col52(marked, OPENS) || {}).chip));

    /*
      THE ACCEPTANCE LINE'S OWN SENTENCE, ON THE DEVICE IT WAS WRITTEN ABOUT. "No August column is
      on screen" is true of the owner's iPad held upright, where the grid draws one column and the
      whole of what she sees on the fortnight before her term is the day it opens.

      THE ROTATION ITSELF IS NOT THE CLAIM HERE and this deliberately does not test it: WO-2.12's
      section owns that, drives it with no render between the two orientations, and would catch a
      broken listener. This one asks a different question — what does the strip anchor on when the
      budget draws ONE column — so it renders explicitly and says so. And it closes nothing on the
      👤 line: a device metric is not a device, and readability at a glance is not measurable here.
    */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    await clear52(false);
    const upright = await read52();
    check('and on an upright iPad it is the WHOLE screen: one day column, and it is the day the term opens — no column from the month before it anywhere',
      upright.columns.length === 1 && dates52(upright)[0] === OPENS
        && (col52(upright, OPENS) || {}).tappable > 0
        && upright.band.text === Q1 + ' opens in ' + OPENS_IN + ' days.',
      'held upright the strip drew ' + JSON.stringify(dates52(upright)) + ' under a band reading '
        + JSON.stringify(upright.band.text));
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 300));

    await clear52(false);
    await clickSel('#attendancePager [data-attendance-page="later"]');
    const ahead = await read52();
    await clickIf('#attendanceHead th[data-attendance-col="' + NEXT + '"] [data-attendance-edit]');
    await clickIf('#attendanceBody td[data-attendance-col="' + NEXT
      + '"] [data-attendance-cell="wo252-a"]');
    const aheadMarked = await read52();
    check('a day inside the term that is NOT the one the strip opened on is not live: it carries its own ✏, offers no tappable cell until that ✏ is pressed, and takes the mark afterwards',
      dates52(ahead).indexOf(NEXT) >= 0
        && (col52(ahead, NEXT) || {}).btn === 'data-attendance-edit=' + NEXT
        && (col52(ahead, NEXT) || {}).tappable === 0
        && (col52(ahead, NEXT) || {}).tags === 'SPAN'
        && (col52(ahead, NEXT) || {}).btnTitle === 'Mark this day early'
        && (col52(aheadMarked, NEXT) || {}).tappable > 0
        && marks52(aheadMarked, NEXT).length === 1,
      'paged one window on, ' + NEXT + ' reads ' + JSON.stringify(col52(ahead, NEXT))
        + ' and after its ✏ was pressed and a cell tapped it holds '
        + JSON.stringify(marks52(aheadMarked, NEXT)));

    await clear52(false);
    const acceptedAhead = await probe52(NEXT);
    check('and every writer that can act on an empty day LANDS on a future day inside a term — the founding sentence of writableDate() reversed, narrowly, and asked one writer at a time',
      allMoved(acceptedAhead),
      'on ' + NEXT + ', one weekday into a term running ' + OPENS + ' … ' + ENDS + ': '
        + JSON.stringify(acceptedAhead.moved));

    /* ── PHASE B: the term is a SOFT wall — ◀ Earlier still walks out of it ── */
    await clear52(false);
    await clickSel('#attendancePager [data-attendance-page="earlier"]');
    await clickSel('#attendancePager [data-attendance-page="earlier"]');
    const walked = await read52();
    check('◀ Earlier still walks straight out of the term and back past today, and every column out there is greyed Off term with nothing tappable and no button in it — a soft wall, proved from the inside out',
      walked.columns.length === 6
        && dates52(walked).every((d) => d < D[0])
        && walked.columns.every((c) => c.chip === 'Off term' && c.tappable === 0
          && c.btn === 'none' && c.tags === 'SPAN'
          && c.colClass.indexOf('attendance-col-off-term') >= 0),
      'two taps of ◀ Earlier from ' + OPENS + ' put ' + JSON.stringify(dates52(walked))
        + ' on screen, reading '
        + JSON.stringify(walked.columns.map((c) => c.chip + '/' + c.btn + '/' + c.tappable)));

    /* ── PHASE C: the forward stop is the TERM'S end, on a document with no calendar in it ── */
    await clickSel('#attendancePager [data-attendance-page="today"]');
    let stop = await read52();
    let stopTaps = 0;
    while (stopTaps < 12 && !page52(stop, 'later').disabled) {
      await clickSel('#attendancePager [data-attendance-page="later"]');
      stop = await read52();
      stopTaps += 1;
    }
    check('Later ▶ walks to the last day of the term and is disabled there naming the term and the date — the stop being proved is the term’s own end, on a document whose calendar is empty',
      stop.events === 0 && dates52(stop)[0] === ENDS
        && page52(stop, 'later').disabled === true
        && page52(stop, 'later').title.indexOf(Q1 + ' ends on ') === 0
        && page52(stop, 'later').title.indexOf(', ' + ENDS.slice(0, 4)
          + ' — there is nothing further in this term to look at') > 0,
      stopTaps + ' tap(s) of Later ▶ ended on ' + JSON.stringify(dates52(stop))
        + ' with the control reading ' + JSON.stringify(page52(stop, 'later'))
        + ' over ' + stop.events + ' calendar event(s); the term ends ' + ENDS);

    /* ── PHASE D: a class with NO dated terms, which pays nothing and is offered nothing ──

       ONE DAY OFF IS PLANTED HERE, and it is this phase's premise rather than decoration: with no
       dated term and an empty calendar there is no horizon past today at all, so there would be no
       future column on screen to assert the absence of a ✏ ON. The day off is what opens the window
       forward, which is WO-2.3's own answer and the other half of forwardLimit(). */
    await arrange52([{ id: 'tm_wo252u', label: 'WO-2.52 undated', start: '', end: '' }],
      'tm_wo252u');
    await clear52(true);
    const undated = await read52();
    check('a class whose terms carry no dates opens on TODAY with no band at all — it pays nothing for this feature and is promised nothing by it',
      dates52(undated)[0] === D[0] && undated.band.up === false
        && undated.heading.indexOf(' ' + Number(D[0].slice(8, 10)) + ', ' + D[0].slice(0, 4)) > 0
        && (col52(undated, D[0]) || {}).tappable > 0,
      'the window is ' + JSON.stringify(dates52(undated)) + ', the band reads '
        + JSON.stringify(undated.band.text) + ' (up = ' + undated.band.up
        + '), and the heading is ' + JSON.stringify(undated.heading));

    await clickSel('#attendancePager [data-attendance-page="later"]');
    const undatedAhead = await read52();
    check('and no future column of that class carries a ✏ or a cell to tap — the shortcut off `offTerm` alone would have drawn a live-looking pencil on every one of them',
      undatedAhead.columns.length === 6
        && dates52(undatedAhead).every((d) => d > D[0])
        && undatedAhead.columns.every((c) => c.btn === 'none' && c.tappable === 0
          && c.chip === 'Ahead' && c.tags === 'SPAN'),
      'paged one window on, ' + JSON.stringify(dates52(undatedAhead)) + ' read '
        + JSON.stringify(undatedAhead.columns.map((c) => c.chip + '/' + c.btn + '/' + c.tappable)));

    await clickSel('#attendancePager [data-attendance-page="today"]');
    const refusedAhead = await probe52(TOMORROW);
    check('and not one writer moves on tomorrow for that class — the paired absence to the probe above, and the half of writableDate()’s founding sentence that was kept rather than deleted',
      noneMoved(refusedAhead),
      'on ' + TOMORROW + ', for a class whose only term carries no dates: '
        + JSON.stringify(refusedAhead.moved));

    /* ── PHASE E: the SELECTED term never bounds a write (WO-2.50 decision 1) ──

       DRIVEN THROUGH THE WRITERS RATHER THAN THROUGH A CELL, and the reason is in the section
       header: with a term that has ended selected, editDate() answers nothing at all, so today —
       which is off the window and reachable only by paging — carries the 🚫 and no ✏, and there is
       no control on this screen that marks it. What is asserted is what the work order says, which
       is about the GATE and not about the buttons: the tab decides what is counted and, since this
       work order, what is drawn, and it has never decided what is written. */
    await arrange52([EARLY_TERM, LATE_TERM], Q1_ID);
    await clear52(false);
    const onEnded = await read52();
    const acceptedToday = await probe52(D[0]);
    check('with the tab on a term that ENDED and today inside the other one, every writer still lands on today — the one change most likely to have broken WO-2.50’s decision 1, re-proved against it',
      onEnded.term === Q1_ID && onEnded.holds === Q2_ID
        && dates52(onEnded)[0] === D[3] && allMoved(acceptedToday),
      'the open tab is ' + JSON.stringify(onEnded.term) + ' (ending ' + D[3]
        + '), today ' + D[0] + ' is inside ' + JSON.stringify(onEnded.holds)
        + ', the strip is standing on ' + JSON.stringify(dates52(onEnded)) + ', and on today: '
        + JSON.stringify(acceptedToday.moved));

    /* ── PHASE F: the jump, on arrival and nowhere else ──

       THE ARRIVAL IS A REAL CLICK ON THE CLASS TAB, not a call to resetRegistry(). That tab is one
       of the two controls src/shell.js runs the whole arrival chain from — selectClass(),
       resetRegistry(), afterClassChange() — and the jump lives inside the middle one. A call to the
       module would prove the writer works; the tap proves it is WIRED, which is the half a
       deliverable this precise can still lose. */
    await clear52(false);
    const arrivedFrom = await read52();
    await clickSel('#classTabBar [data-class-tab="' + plant252.classId + '"]');
    const arrived = await read52();
    check('arriving at the screen selects the term today is in: the preference moves, the nav highlight moves with it, and the strip opens on today',
      arrivedFrom.term === Q1_ID && arrived.term === Q2_ID && arrived.active === Q2_ID
        && arrivedFrom.pref !== arrived.pref && arrived.pref.indexOf(Q2_ID) >= 0
        && dates52(arrived)[0] === D[0] && arrived.band.up === false,
      'the open term went ' + JSON.stringify(arrivedFrom.term) + ' -> '
        + JSON.stringify(arrived.term) + ', the preference ' + arrivedFrom.pref + ' -> '
        + arrived.pref + ', the nav highlight ' + JSON.stringify(arrivedFrom.active) + ' -> '
        + JSON.stringify(arrived.active) + ', and the strip opened on '
        + JSON.stringify(dates52(arrived)));

    await clickSel('#termNav [data-term-select="' + Q1_ID + '"]');
    const chosen = await read52();
    check('and choosing the ended term by hand during that session anchors the strip on its LAST DAY, locked — no cell tappable until its own ✏ is pressed — with WO-2.51’s band up over it',
      chosen.term === Q1_ID && dates52(chosen)[0] === D[3]
        && (col52(chosen, D[3]) || {}).tappable === 0
        && (col52(chosen, D[3]) || {}).btn === 'data-attendance-edit=' + D[3]
        && (col52(chosen, D[3]) || {}).btnTitle === 'Edit this past day'
        && chosen.band.up && chosen.band.cls.indexOf('rollover') >= 0
        && chosen.band.text.indexOf('Today is in ' + Q2 + ' — you are still on ' + Q1 + '.') === 0,
      'the strip stands on ' + JSON.stringify(dates52(chosen)) + ', its newest column reads '
        + JSON.stringify(col52(chosen, D[3])) + ', and the band reads '
        + JSON.stringify(chosen.band.text));

    const heldPref = chosen.pref;
    await evalJs(`(async function(){
      var a = window.planbook.attendance;
      a.renderAttendance();
      a.paintRenderedTotals();
      a.renderAttendance();
      await window.planbook.store.flush();
      return 1; })()`);
    const repainted = await read52();
    await clickSel('#classTabBar [data-class-tab="' + plant252.classId + '"]');
    const arrivedAgain = await read52();
    check('nothing moves the term while the screen is open — the preference is byte-identical across three repaints with the band naming the other term the whole time — and the next ARRIVAL moves it, which is what makes that silence a rule rather than a build that never noticed',
      repainted.pref === heldPref && repainted.term === Q1_ID
        && repainted.band.cls.indexOf('rollover') >= 0
        && arrivedAgain.pref !== heldPref && arrivedAgain.term === Q2_ID,
      'the preference read ' + heldPref + ' before the repaints and ' + repainted.pref
        + ' after them (open term ' + JSON.stringify(repainted.term) + ', band '
        + JSON.stringify(repainted.band.text) + '), then ' + arrivedAgain.pref
        + ' after one arrival (open term ' + JSON.stringify(arrivedAgain.term) + ')');

    await clickSel('#termNav [data-term-select="' + Q1_ID + '"]');
    await clickIf('#attendanceHead th[data-attendance-col="' + D[3] + '"] [data-attendance-edit]');
    const unlockedEnd = await read52();
    await clickIf('#attendanceBody td[data-attendance-col="' + D[3]
      + '"] [data-attendance-cell="wo252-a"]');
    const endMarked = await read52();
    check('and that last day opens with its own ✏ like every other past day, says in words which day the screen is on, and takes the mark',
      (col52(unlockedEnd, D[3]) || {}).tappable > 0
        && (col52(unlockedEnd, D[3]) || {}).btn === 'data-attendance-lock'
        && unlockedEnd.heading.indexOf(' ' + Number(D[3].slice(8, 10)) + ', ' + D[3].slice(0, 4)) > 0
        && marks52(endMarked, D[3]).length === 1,
      'unlocked, ' + D[3] + ' reads ' + JSON.stringify(col52(unlockedEnd, D[3]))
        + ' under a heading of ' + JSON.stringify(unlockedEnd.heading) + ', and the tap wrote '
        + JSON.stringify(marks52(endMarked, D[3])));

    /* ── PHASE G: the label is READ, never invented — and the band speaks in both directions ── */
    await arrange52([Object.assign({}, AHEAD_TERM, { label: TRI_A }),
      { id: Q2_ID, label: TRI_B, start: nodeWeekdayAhead(41), end: nodeWeekdayAhead(60) }], Q1_ID);
    await clear52(false);
    const triBefore = await read52();
    check('a term labelled Trimester 1 that has not started yet produces the same sentence with that label in it, and no quarter vocabulary anywhere in what the screen prints',
      triBefore.band.up && triBefore.band.text === TRI_A + ' opens in ' + OPENS_IN + ' days.'
        && !/quarter/i.test(triBefore.band.text)
        && !/quarter/i.test(triBefore.stateLine)
        && !/quarter/i.test(triBefore.pager.map((b) => b.title).join(' ')),
      JSON.stringify(triBefore.band.text) + ' over a state line reading '
        + JSON.stringify(triBefore.stateLine) + ' and pager tooltips '
        + JSON.stringify(triBefore.pager.map((b) => b.title)));

    await arrange52([{ id: Q1_ID, label: TRI_A, start: D[5], end: D[3] }], Q1_ID);
    await clear52(false);
    const triAfter = await read52();
    check('and the same band speaks the other way about a term that has ENDED, naming the day it ended on with the year on it — the sentence a teacher reads in February',
      triAfter.band.up && triAfter.band.buttons === 0
        && triAfter.band.text.indexOf(TRI_A + ' ended on ') === 0
        && triAfter.band.text.indexOf(', ' + D[3].slice(0, 4) + '.') > 0
        && triAfter.band.cls.indexOf('off-term') >= 0
        && dates52(triAfter)[0] === D[3]
        && !/quarter/i.test(triAfter.band.text),
      JSON.stringify(triAfter.band.text) + ' over a strip standing on '
        + JSON.stringify(dates52(triAfter)) + ' (the term ended ' + D[3] + ')');

    /* The document back as it was, IN PLACE rather than as a fresh object — every module holds the
       reference getDoc() handed it — with the class and term this block found open put back, and
       the calendar this block emptied restored with the rest of it. */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo252save, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      c.selectClass(saved.classId);
      a.lockDay();
      /* THE PAGING RESET COMES BEFORE THE TERM IS PUT BACK (WO-2.54): pageDays('today') moves the
         selected term to the one nearest today now, so a teardown that chose the term first would
         hand the next section a different tab from the one it found. (No backticks: template
         literal.) */
      a.pageDays('today');
      if (saved.termId) c.selectTerm(saved.termId);
      a.setSearch(''); a.setFilter('all'); a.renderAttendance();
      delete window.__wo252save;
      delete window.__wo252;
      await s.flush();
      return 1; })()`);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
}
