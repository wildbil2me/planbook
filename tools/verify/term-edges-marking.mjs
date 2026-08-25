/* term-edges-marking.mjs — a date outside every term is not a date to mark (WO-2.50)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeColumns, nodeWeekdayAhead } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, seam } = h;

/* ───────── a date outside every term is not a date to mark (WO-2.50) ─────────
 *
 * THE DEFECT, REPORTED BY THE OWNER OFF THE DEPLOYED APP ON 2026-08-18. Her first term begins
 * Aug 28. On Aug 18 the registry drew today's column live — a tappable cell for every student and
 * the 🚫 in the head — ten days before the class exists, because `writableDate()` asks one question
 * ("is this date today or earlier") and every day before a term is in the past-or-today set. A
 * meeting recorded there is in the document, in the backup and in the year total, and in NO term
 * percentage, which is a number wrong in a place she cannot see.
 *
 * EVERY DATE IN THIS BLOCK IS DERIVED FROM TODAY, never written out. `nodeColumns()` above already
 * derives the drawn window from the calendar rather than asking the app which dates it chose — for
 * the reason its own comment gives — and a fixture pinned to Aug 2026 would stop testing the bound
 * the moment the clock passed it. So the terms are built AROUND the six columns on screen: one
 * ending on the fourth column back and one starting on the second, which puts a real inclusive
 * `end`, a real inclusive `start` and a real gap between two named terms inside one window.
 *
 * THREE CLAIMS HERE ARE ABOUT WHAT IS *NOT* WRITTEN, and each is paired with the write that proves
 * the fixture could have written it. "No writer accepts an out-of-term date" is asserted as
 * `doc.attendance` byte-identical across nine calls made straight through the seam — and the same
 * nine calls are made again at the foot of the block on a date that IS in term, where they land.
 * "The column offers nothing to tap" is asserted as zero <button> cells on a grid whose other
 * columns are counted in the same read. And the stale-DOM half of acceptance line 5 is driven by
 * BUILDING the control the pre-WO-2.50 build drew — a real <button> carrying `data-attendance-cell`
 * and `data-attendance-date` on an out-of-term column — and clicking it for real, which is exactly
 * the arrival `writableDate()`'s own comment says these gates exist for.
 *
 * AND THE HALF MOST LIKELY TO BE LOST IS DRIVEN THROUGH THE REAL CONTROLS. Decision 2 — a day that
 * already carries attendance stays fully editable — is not asserted by asking the gate what it
 * answers. A mark planted on an out-of-term day is CHANGED by unlocking that column with its own ✏
 * and tapping the cell, and a drop planted on another is undone with the real "The class met after
 * all" button. A build that refused those would be a build that stranded the owner's own stray
 * Aug-18 taps inside the year total with no way to reach them from the screen that made them.
 */
console.log('\n--- a date outside every term is not a date to mark (WO-2.50) ---');

if (!seam) {
  skip('a date outside every term of the class cannot be marked',
    'the window.planbook seam is not present, so nothing here could read what was written');
} else {
  /* Six columns need a laptop's width — the registry budgets the width and draws fewer days rather
     than scrolling sideways — and the section above cleared its own override on the way out. Stated
     here rather than inherited, which is the note the attendance section makes about the same line. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));

  const W = nodeColumns(6, 0);                 /* [today, ...five weekdays back] */
  const FAR = nodeWeekdayAhead(40);
  const SOON = nodeWeekdayAhead(10);
  const EARLY = 'WO-2.50 early';
  const LATE = 'WO-2.50 late';
  const AUTUMN = 'WO-2.50 autumn';

  const INSTALL_250 = `(function(){
    function hookOf(b){
      var out = 'none';
      Array.prototype.slice.call(b.attributes).forEach(function(x){
        if (x.name.indexOf('data-') === 0 && x.name !== 'data-attendance-col') {
          out = x.name + '=' + x.value; }
      });
      return out;
    }
    window.__wo250 = function(){
      var a = window.planbook.attendance, c = window.planbook.classes;
      var doc = window.planbook.store.getDoc();
      var id = c.getSelectedClassId();
      var heads = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead th[data-attendance-col]'));
      var note = document.getElementById('attendanceNote');
      var state = document.getElementById('attendanceState');
      var cards = Array.prototype.slice.call(document.querySelectorAll('#homeGrid .class-card'));
      return {
        today: a.todayISO(),
        classId: id,
        editDate: (document.getElementById('attendanceDate') || {}).textContent || '',
        columns: heads.map(function(th){
          var d = th.getAttribute('data-attendance-col');
          var chip = th.querySelector('.attendance-day-state');
          var btn = th.querySelector('button');
          var cells = Array.prototype.slice.call(
            document.querySelectorAll('#attendanceBody td[data-attendance-col="' + d + '"] > *'))
            .filter(function(n){ return n.className.indexOf('attendance-cell-time') < 0; });
          /* The summary is asked of the module rather than read off the screen: the claim that the
             card and the grid agree is a claim about ONE function answering both, and two rendered
             strings compared against each other cannot tell that from two renderers that happen to
             agree today. (No backticks in this comment: it is inside a template literal.) */
          var sum = a.stateSummary(id, d);
          return {
            date: d,
            state: a.stateOf(id, d),
            summary: sum.text,
            offTerm: !!sum.offTerm,
            colClass: th.className,
            chip: chip ? chip.textContent : '',
            chipTitle: chip ? (chip.title || '') : '',
            btn: btn ? hookOf(btn) : 'none',
            btnText: btn ? btn.textContent : '',
            tappable: cells.filter(function(n){ return n.tagName === 'BUTTON'; }).length,
            tags: cells.map(function(n){ return n.tagName; })
              .filter(function(v, i, all){ return all.indexOf(v) === i; }).join(','),
            glyphs: cells.map(function(n){ return n.textContent; })
              .filter(function(v, i, all){ return all.indexOf(v) === i; }).join(','),
            tones: cells.map(function(n){ return n.className; })
              .filter(function(v, i, all){ return all.indexOf(v) === i; }).join(' | '),
            label: cells.length ? (cells[0].getAttribute('aria-label') || '') : '' };
        }),
        stateLine: state ? state.textContent : '',
        stateClass: state ? state.className : '',
        note: note && !note.classList.contains('hidden') ? note.textContent : '',
        actions: Array.prototype.slice.call(
          document.querySelectorAll('#attendanceActions button'))
          .map(function(b){ return hookOf(b) + ' :: ' + b.textContent; }),
        cards: cards.map(function(card){
          var line = card.querySelector('.class-card-state');
          var open = card.querySelector('.class-card-open');
          return { id: open ? open.getAttribute('data-class-tab') : '',
                   text: line ? line.textContent : '', cls: line ? line.className : '' }; }),
        attJson: JSON.stringify(doc.attendance || []) };
    };
    return 1; })()`;

  /* Flushed before every read, for tools/README.md trap 6: every save is debounced, so a read taken
     a moment after a tap can be looking at the document from before it. */
  const read250 = () => evalJs('(async function(){ await window.planbook.store.flush();'
    + ' return window.__wo250(); })()');
  const col250 = (r, date) => r.columns.filter((c) => c.date === date)[0] || null;
  /*
    A CLICK THAT REPORTS RATHER THAN THROWS, and it is here for the mutation run rather than for the
    green one. Every control this block reaches for — the ✏ on an out-of-term day that carries a
    record, the term-editor door, the undo on a planted drop — is a control that a build with the
    gate broken does not draw. clickSel() throws when it finds nothing, so on that build the run
    ABORTS at the first missing control and the rest of the block never reports at all: three reds
    and a stack trace, where the point of the exercise is to see which of twenty-one claims the
    mutation actually breaks. This clicks when there is something to click and hands back false when
    there is not, which lands in the check that was going to read the result anyway.
  */
  const clickIf = async (sel) => {
    if (!(await has(sel))) return false;
    await clickSel(sel);
    return true;
  };
  /* FILTERED BY CLASS AS WELL AS BY DATE, and the class half is not decoration: the document this
     block runs on carries records for five other classes on the same weekdays, planted by the
     attendance section above. A reader keyed on the date alone answers with a neighbour's record —
     which is how the first draft of this block reported that a planted `A` had become `undefined`,
     about a record it had never touched. */
  const marksOn = (r, date) => JSON.parse(r.attJson)
    .filter((x) => x.date === date && x.classId === r.classId);

  /*
    EVERY WRITER THIS SCREEN HAS, HANDED THE DATE DIRECTLY AND ASKED ONE AT A TIME — which is
    acceptance line 5's "not merely lacks a button for it". Enumerated out of src/attendance.js
    rather than off a list: the SEVEN that guard on writableDate(on) — setMark, takeClass,
    unconfirmAll, setNote, untakeClass, dropClass, undropClass — plus editDay(), which guards on
    writableDate(date), plus cycleMark(), which is the tap's own path into setMark().

    ONE AT A TIME, WITH THE LEDGER PUT BACK BETWEEN THEM, AND THE FIRST DRAFT OF THIS DID NOT DO
    THAT — it made the nine calls in a row and compared the document either side. That check went
    green on the build with the gate and it would have gone green on the build without it, because
    the nine calls UNDO EACH OTHER: setMark takes the class, unconfirmAll empties it back to `U`s,
    untakeClass then removes a record with nothing real on it, dropClass writes an exception and
    undropClass takes it away again. Net zero on any date, bound or not. It was caught by its own
    control — the same nine calls on an in-term date, which are supposed to LAND and did not — and
    it is the vacuity trap tools/README.md § trap 5 describes wearing a different coat.

    So each writer starts from the same document, and what comes back is nine independent answers.
    `editDay()` writes nothing to the ledger by design, so what is watched for it is the date on
    the state line, which is the thing it moves.
  */
  const writerProbe = (date) => evalJs(`(async function(){
    var a = window.planbook.attendance, c = window.planbook.classes, s = window.planbook.store;
    var id = c.getSelectedClassId();
    var cls = (s.getDoc().classes || []).filter(function(x){ return x.id === id; })[0];
    /* THE STUDENT THIS BLOCK PLANTED, NOT roster[0]. The class was already carrying a roster when
       this section arrived, so roster[0] is somebody else's student — and setNote() refuses a
       student who has no mark on the record, which would have made one of the nine answers below
       false for a reason with nothing to do with terms.
       (No backticks in this comment: it is inside a template literal.) */
    var who = (cls.roster || []).indexOf('wo250-a') >= 0 ? 'wo250-a' : (cls.roster || [])[0];
    var on = ${JSON.stringify(date)};
    var base = JSON.stringify(s.getDoc().attendance || []);
    var baseEdit = (document.getElementById('attendanceDate') || {}).textContent || '';
    var out = {};
    function run(name, fn){
      fn();
      var now = JSON.stringify(s.getDoc().attendance || []);
      var edit = (document.getElementById('attendanceDate') || {}).textContent || '';
      out[name] = (now !== base) || (edit !== baseEdit);
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
    run('unconfirmAll', function(){ a.unconfirmAll(on); });
    run('setNote', function(){ a.setNote(who, 'WO-2.50 must never be written', on); });
    run('untakeClass', function(){ a.untakeClass(on); });
    run('undropClass', function(){ a.undropClass(on); });
    await s.flush();
    return { moved: out, student: who, base: base,
      ledger: JSON.stringify(s.getDoc().attendance || []) }; })()`);
  /* The five that can act on a date with NO record on it — the ones whose refusal is this work
     order's and not a side effect of there being nothing there. The other four need a record
     first, and their half of the claim is decision 2's: they must go on working on an out-of-term
     day that HAS one, which is what phase C drives through the real controls. */
  const CREATORS = ['setMark', 'cycleMark', 'takeClass', 'dropClass'];
  const noneMoved = (p) => Object.keys(p.moved).every((k) => p.moved[k] === false);
  const allCreatorsMoved = (p) => CREATORS.every((k) => p.moved[k] === true);

  /*
    AN UNDATED TERM IS PUT IN FRONT OF EVERY ARRANGEMENT BELOW, AND IT IS A PREMISE OF THIS SECTION
    RATHER THAN A TIDY-UP (WO-2.52).

    From that work order the strip is built from anchorDate(), which stands on the SELECTED term's
    edge whenever today is outside it. Every phase here deliberately puts today outside the dated
    terms — that is the whole subject — so without this line the registry would open on September
    and this block would be asking its questions about columns that are not on screen: no column for
    today, no cell to hang a stale control on, no ✏ on the day a record was planted. It reported
    exactly that, fifteen reds deep, on a correct app.

    getSelectedTermId() falls back to the FIRST term when the stored preference names one that does
    not exist, and replacing the list wholesale is what makes that true on every call — so terms[0]
    is the selected term, and an UNDATED selected term anchors the strip on today (src/attendance.js
    anchorDate()). That is the one arrangement that leaves this section measuring what it is about:
    THE GATE, which reads ANY term of the class and has never read the selected one. It bounds
    nothing, it is invisible to outOfTermGap() — which filters to dated terms — and every claim
    below is unchanged by its presence.

    Terms are replaced wholesale for each phase, through the store, because no control types six
    dates and this block needs six arrangements of them.
  */
  const ANCHOR_TERM = { id: 'tm_wo250sel', label: 'WO-2.50 anchor', start: '', end: '' };
  const setTerms250 = (terms) => evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var id = c.getSelectedClassId();
    var d = s.getDoc();
    var cls = (d.classes || []).filter(function(x){ return x.id === id; })[0];
    if (!cls) return { ok:false, why:'no class is open' };
    s.update(function(){ cls.terms = ${JSON.stringify([ANCHOR_TERM])}
      .concat(${JSON.stringify(terms)}); });
    /* THE UNDATED TERM IS SELECTED OUT LOUD SINCE WO-2.54, where it used to be left to
       getSelectedTermId()'s fallback to the first term. Two reasons, and the first is that a premise
       this section depends on for fifteen checks should be stated rather than inherited. The second
       is that the fallback is no longer the only thing that writes this: an ARRIVAL now moves the
       selected term to the nearest DATED one, and every phase here is deliberately arranged so that
       the nearest dated term is not where this block wants the tab.
       (No backticks in this comment: it is inside a template literal.) */
    c.selectTerm(${JSON.stringify(ANCHOR_TERM.id)});
    a.lockDay();
    a.setSearch(''); a.setFilter('all');
    a.renderAttendance();
    await s.flush();
    return { ok:true, classId:id, name:cls.name, terms:(cls.terms||[]).length }; })()`);

  const plant250 = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var id = c.getSelectedClassId();
    var cls = (d.classes || []).filter(function(x){ return x.id === id; })[0];
    if (!cls) return { ok:false, why:'no class is open, so there is no registry to read' };
    /* Parked on the window rather than carried back through CDP, for the reason the WO-2.17 fixture
       gives: the teardown has to put the SAME object graph back, and a document that made the round
       trip would come back a copy of a copy. (No backticks: template literal.) */
    window.__wo250save = { doc: JSON.stringify(d), classId: id, termId: c.getSelectedTermId() };
    s.update(function(doc){
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.events)) doc.events = [];
      if (!Array.isArray(cls.roster)) cls.roster = [];
      doc.attendance = doc.attendance.filter(function(r){ return r.classId !== id; });
      doc.students.push({ id:'wo250-a', first:'Term', last:'Aardvark' });
      doc.students.push({ id:'wo250-b', first:'Term', last:'Beacon' });
      cls.roster.push('wo250-a');
      cls.roster.push('wo250-b');
    });
    a.setSearch(''); a.setFilter('all');
    c.selectClass(id);
    a.renderAttendance();
    await s.flush();
    return { ok:true, classId:id, name:cls.name }; })()`);

  if (!plant250.ok) {
    check('the WO-2.50 fixture is real: a class with a roster is open on the registry, over six drawn columns',
      false, plant250.why);
  } else {
    await evalJs(INSTALL_250);

    /* ── PHASE A: the owner's own case — every column before the first term ── */
    await setTerms250([{ id: 'tm_wo250a', label: AUTUMN, start: SOON, end: FAR }]);
    const beforeTerm = await read250();
    const todayCol = col250(beforeTerm, W[0]);

    check('the WO-2.50 fixture is real: the registry is up on a class whose only DATED term starts after today, today is one of the six columns drawn, and this class holds no attendance on any of them',
      beforeTerm.today === W[0] && beforeTerm.columns.length === 6 && !!todayCol
        && JSON.parse(beforeTerm.attJson)
          .filter((r) => r.classId === beforeTerm.classId).length === 0,
      'the app says today is ' + JSON.stringify(beforeTerm.today) + ', this file derived '
        + JSON.stringify(W[0]) + ', the window is '
        + JSON.stringify(beforeTerm.columns.map((c) => c.date)) + ', the only dated term runs '
        + SOON + ' … ' + FAR + ', and this class holds '
        + JSON.parse(beforeTerm.attJson).filter((r) => r.classId === beforeTerm.classId).length
        + ' record(s) against ' + JSON.parse(beforeTerm.attJson).length
        + ' in the whole document');

    check('a column before the first term of the class draws no tappable cell and no button, and reads "Off term" rather than "Not taken"',
      !!todayCol && todayCol.chip === 'Off term' && todayCol.btn === 'none'
        && todayCol.tappable === 0 && todayCol.tags === 'SPAN'
        && todayCol.glyphs === '·'
        /* The state itself never moved. stateOf() answers not-taken and goes on answering it —
           out-of-term is a modifier carried alongside, the way `future` is, and a fifth branch
           inside that four-line precedence is a fifth way for a term-date edit to change what a
           recorded day means. */
        && todayCol.state === 'not-taken'
        && todayCol.tones.indexOf('attendance-cell-off-term') >= 0
        && todayCol.tones.indexOf('attendance-cell-untaken') < 0
        && todayCol.colClass.indexOf('attendance-col-off-term') >= 0
        && todayCol.colClass.indexOf('attendance-col-not-taken') >= 0,
      todayCol ? JSON.stringify(todayCol) : 'today drew no column at all');

    check('the state line above the grid names the term the day is before, and every cell says it in words for a reader who gets none of the wash',
      beforeTerm.stateLine === 'Off term · before ' + AUTUMN
        && !!todayCol && todayCol.summary === beforeTerm.stateLine
        && todayCol.chipTitle === beforeTerm.stateLine
        && todayCol.label.indexOf('outside every term — before ' + AUTUMN) >= 0,
      JSON.stringify(beforeTerm.stateLine) + ' :: head tooltip '
        + JSON.stringify((todayCol || {}).chipTitle) + ' :: first cell '
        + JSON.stringify((todayCol || {}).label));

    check('the only control the day offers is the door to the term dates, and the note says why the screen is grey and what would un-grey it',
      beforeTerm.actions.length === 1
        && beforeTerm.actions[0].indexOf('data-term-manage= ::') === 0
        && /outside every term/.test(beforeTerm.note)
        && new RegExp(AUTUMN).test(beforeTerm.note)
        && /Terms/.test(beforeTerm.note),
      JSON.stringify(beforeTerm.actions) + ' :: ' + JSON.stringify(beforeTerm.note));

    /* The door, opened. `data-term-manage` with an EMPTY value means "the class that is open" — the
       hook's documented contract (src/shell.js's census) — and a check that only read the attribute
       could not tell a door that opens the right editor from one that opens nothing at all. */
    const doorDrawn = await clickIf('#attendanceActions [data-term-manage]');
    const doorOpen = await evalJs(`(function(){
      var m = document.getElementById('termsModal');
      var name = document.getElementById('termsClassName');
      return { up: !!(m && !m.classList.contains('hidden')),
        forClass: name ? name.textContent : '' }; })()`);
    await evalJs("(function(){ window.planbook.closeModal('termsModal'); return 1; })()");
    check('and that door really opens the term editor, for the class that is open',
      doorDrawn && doorOpen.up && doorOpen.forClass === plant250.name,
      'the terms editor is up = ' + doorOpen.up + ', for ' + JSON.stringify(doorOpen.forClass)
        + ' (the open class is ' + JSON.stringify(plant250.name) + ')');

    /* ── the home card, which is the same words out of the same function (decision 4) ── */
    if (await has('#classTabBar [data-view-home]')) {
      await clickSel('#classTabBar [data-view-home]');
    }
    const home250 = await read250();
    const card250 = home250.cards.filter((c) => c.id === plant250.classId)[0] || null;
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + plant250.classId + '"]');
    /* AND THE TAB IS PUT BACK ON THE UNDATED TERM AFTER THAT RE-ENTRY (WO-2.54). Opening the class
       from its card is an ARRIVAL, and an arrival now moves the selected term to the nearest dated
       one — which on this fixture is the term starting ten weekdays out, so the strip would anchor
       there and today would leave the screen. That is the app behaving as WO-2.54 specifies and this
       block asking its questions about columns that are no longer drawn: it reported exactly that,
       six reds deep, on a correct app. The line below is the fixture's own premise restated after the
       one control in this section that disturbs it. */
    await evalJs("(function(){ window.planbook.classes.selectTerm("
      + JSON.stringify(ANCHOR_TERM.id) + "); window.planbook.attendance.renderAttendance();"
      + " return 1; })()");
    check('the home card says exactly what the grid says, out of the one stateSummary() that decides both — and it is NOT the untaken amber',
      !!card250 && card250.text === 'Off term · before ' + AUTUMN
        && card250.text === beforeTerm.stateLine
        && card250.cls.indexOf('off-term') >= 0
        && card250.cls.indexOf('not-taken') >= 0
        && card250.cls.indexOf('unconfirmed') < 0,
      card250 ? JSON.stringify(card250) : 'no card for the open class on the home grid');

    /* ── acceptance line 5, both of the arrivals writableDate()'s comment names ── */
    const refusedToday = await writerProbe(W[0]);
    const refusedPast = await writerProbe(W[1]);
    check('every writer on this screen refuses an out-of-term date handed to it directly — all nine, one at a time, on today and on a past weekday, and not one of them moves anything',
      noneMoved(refusedToday) && noneMoved(refusedPast)
        && refusedToday.student === 'wo250-a',
      'on ' + W[0] + ' (today) ' + JSON.stringify(refusedToday.moved) + ' :: on ' + W[1]
        + ' (a past weekday) ' + JSON.stringify(refusedPast.moved));

    const stale = await evalJs(`(function(){
      var s = window.planbook.store;
      var before = JSON.stringify(s.getDoc().attendance || []);
      var td = document.querySelector('#attendanceBody td[data-attendance-col="'
        + ${JSON.stringify(W[0])} + '"]');
      if (!td) return { ok:false, why:'no cell on today to hang a stale control on' };
      var b = document.createElement('button');
      b.type = 'button';
      b.id = 'wo250-stale';
      b.setAttribute('data-attendance-cell', td.getAttribute('data-attendance-student'));
      b.setAttribute('data-attendance-date', ${JSON.stringify(W[0])});
      b.textContent = '?';
      td.textContent = '';
      td.appendChild(b);
      return { ok:true, before: before }; })()`);
    if (!stale.ok) {
      check('a hook fired at a stale DOM writes nothing on an out-of-term day', false, stale.why);
    } else {
      await clickSel('#wo250-stale');
      const afterStale = await read250();
      check('a hook fired at a stale DOM writes nothing on an out-of-term day — the control the build BEFORE this one drew, rebuilt by hand and really clicked',
        afterStale.attJson === stale.before,
        'attendance was ' + stale.before + ' before the click on a live-looking cell and '
          + afterStale.attJson + ' after it');
    }

    const keyed = await evalJs(`(async function(){
      var a = window.planbook.attendance, s = window.planbook.store;
      /* REPAINTED FIRST, and the reason is the check right above it: the stale-DOM probe left a
         hand-built cell button in the grid, and markSelected() looks for exactly that element to
         decide whether there is anything to write into. Reading here without a repaint measures
         this file's own forgery rather than the app's markup — which is what it did on the first
         run, reporting a keyboard path that had "worked" while writing nothing.
         (No backticks in this comment: it is inside a template literal.) */
      a.renderAttendance();
      a.selectStudent('wo250-a');
      var before = JSON.stringify(s.getDoc().attendance || []);
      var wrote = a.markSelected('A');
      await s.flush();
      return { before: before, after: JSON.stringify(s.getDoc().attendance || []),
        wrote: wrote, selected: a.selectedStudent() }; })()`);
    check('WO-2.5’s keyboard path writes nothing on an out-of-term day, and reports the key unused so it goes back to the browser',
      keyed.wrote === false && keyed.before === keyed.after,
      'markSelected returned ' + keyed.wrote + ', the selection was '
        + JSON.stringify(keyed.selected) + ', ledger ' + keyed.before + ' -> ' + keyed.after);

    /* ── PHASE B: two terms, an inclusive end, an inclusive start, and the gap between them ── */
    await setTerms250([
      { id: 'tm_wo250e', label: EARLY, start: W[5], end: W[3] },
      { id: 'tm_wo250l', label: LATE, start: W[1], end: FAR },
    ]);
    const two = await read250();
    const endDay = col250(two, W[3]);      /* the last day of the early term */
    const gapDay = col250(two, W[2]);      /* the one day between the two */
    const startDay = col250(two, W[1]);    /* the first day of the late term */

    check('the day between a term that has ended and one that has not started is locked, and its reason names BOTH terms',
      !!gapDay && gapDay.chip === 'Off term' && gapDay.btn === 'none' && gapDay.tappable === 0
        && gapDay.summary === 'Off term · between ' + EARLY + ' and ' + LATE
        && gapDay.chipTitle === gapDay.summary
        && gapDay.label.indexOf('outside every term — between ' + EARLY + ' and ' + LATE) >= 0,
      gapDay ? JSON.stringify(gapDay) : 'no column drawn for ' + W[2]);

    check('and the days on either side of it are open — a term’s own start and end are inside it, which is the bound being inclusive at BOTH ends',
      !!endDay && !!startDay && !!gapDay
        && endDay.offTerm === false && startDay.offTerm === false && gapDay.offTerm === true
        && endDay.chip !== 'Off term' && startDay.chip !== 'Off term'
        && endDay.btn.indexOf('data-attendance-edit') === 0
        && startDay.btn.indexOf('data-attendance-edit') === 0,
      W[3] + ' (the early term’s end) reads ' + JSON.stringify((endDay || {}).chip) + '/'
        + JSON.stringify((endDay || {}).btn) + ' · ' + W[2] + ' (the gap) reads '
        + JSON.stringify((gapDay || {}).chip) + ' · ' + W[1] + ' (the late term’s start) reads '
        + JSON.stringify((startDay || {}).chip) + '/' + JSON.stringify((startDay || {}).btn));

    /* And MARKED, through the real ✏ and a real tap on the cell, because "markable" is a claim
       about a write landing and not about a button having been drawn. Both ends, same shape. */
    const markPastDay = async (date) => {
      await clickIf('#attendanceHead th[data-attendance-col="' + date + '"] [data-attendance-edit]');
      /* TWO TAPS AND NOT ONE. The first takes the class and puts this student on present, and
         present is stored as NOTHING at all — the exceptions-only rule — so a check that read the
         student's entry after one tap would find `undefined` on a build that had worked perfectly.
         The second walks the cycle on to a code that is really in the document. */
      await clickIf('#attendanceBody td[data-attendance-col="' + date
        + '"] [data-attendance-cell="wo250-a"]');
      await clickIf('#attendanceBody td[data-attendance-col="' + date
        + '"] [data-attendance-cell="wo250-a"]');
      const after = await read250();
      await evalJs('(function(){ window.planbook.attendance.lockDay(); return 1; })()');
      return after;
    };
    const atEnd = await markPastDay(W[3]);
    const atStart = await markPastDay(W[1]);
    const landed = (r, date) => {
      const list = marksOn(r, date);
      const cell = list.length === 1 && list[0].marks ? list[0].marks['wo250-a'] : null;
      return cell && cell.code && cell.code !== 'U' ? list[0] : null;
    };
    check('the LAST day of a term takes a mark, tapped on the real cell after the real ✏ — the inclusive end proved by writing to it rather than by reading a class name',
      !!landed(atEnd, W[3]),
      W[3] + ' is the early term’s end and the ledger now holds '
        + JSON.stringify(marksOn(atEnd, W[3])));
    check('and so does the FIRST day of a term, which is the other end of the same claim and would fail differently',
      !!landed(atStart, W[1]),
      W[1] + ' is the late term’s start and the ledger now holds '
        + JSON.stringify(marksOn(atStart, W[1])));

    /* ── PHASE C: the record wins — decision 2, driven through the controls a teacher touches ── */
    const planted = await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var id = c.getSelectedClassId();
      s.update(function(d){
        d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== id; });
        /* Written straight into the document, which is exactly how the records this decision
           protects got there: they were made by the build BEFORE the gate existed, and nothing
           migrates them. (No backticks: template literal.) */
        d.attendance.push({ classId: id, date: ${JSON.stringify(W[1])},
          marks: { 'wo250-a': { code: 'A' } } });
        d.attendance.push({ classId: id, date: ${JSON.stringify(W[2])}, exception: 'dropped' });
      });
      a.renderAttendance();
      await s.flush();
      return JSON.stringify(s.getDoc().attendance); })()`);
    /* Back to the arrangement where NEITHER of those dates is in any term, which is the whole point
       of the phase: the records were made outside the terms and have to survive being read by the
       build that would refuse to create them. */
    await setTerms250([{ id: 'tm_wo250a', label: AUTUMN, start: SOON, end: FAR }]);
    const held = await read250();
    const markedDay = col250(held, W[1]);
    const droppedDay = col250(held, W[2]);

    check('a day outside every term that already CARRIES attendance reads as itself and not as off-term — the record is answered before the calendar and before the term dates',
      !!markedDay && markedDay.state === 'taken' && markedDay.chip !== 'Off term'
        && markedDay.offTerm === false
        && markedDay.colClass.indexOf('attendance-col-off-term') < 0
        && markedDay.btn.indexOf('data-attendance-edit') === 0
        && !!droppedDay && droppedDay.state === 'dropped' && droppedDay.chip !== 'Off term'
        && droppedDay.offTerm === false,
      'planted ' + planted + ' :: ' + W[1] + ' reads '
        + JSON.stringify((markedDay || {}).chip) + '/' + JSON.stringify((markedDay || {}).btn)
        + ' · ' + W[2] + ' reads ' + JSON.stringify((droppedDay || {}).chip));

    await clickIf('#attendanceHead th[data-attendance-col="' + W[1] + '"] [data-attendance-edit]');
    await clickIf('#attendanceBody td[data-attendance-col="' + W[1]
      + '"] [data-attendance-cell="wo250-a"]');
    const changed = await read250();
    const changedRec = marksOn(changed, W[1])[0] || null;
    check('and a mark on that day can still be CHANGED, unlocked with its own ✏ and tapped on the real cell — this is the half that gets dropped under time pressure',
      !!changedRec && !!changedRec.marks
        /* Compared against what was planted rather than against a code this file names, so the
           check says "the mark moved" without also quietly asserting which way the cycle turns —
           that ring is the attendance section's claim and is asserted there. */
        && JSON.stringify(changedRec.marks) !== JSON.stringify({ 'wo250-a': { code: 'A' } }),
      W[1] + ' held {"wo250-a":{"code":"A"}} before the tap and now holds '
        + JSON.stringify(changedRec && changedRec.marks));

    /* THE FOUR WRITERS THE PROBE ABOVE COULD ONLY SEE REFUSE. unconfirmAll, setNote, untakeClass
       and undropClass all need a record before they do anything, so on the recordless day in phase
       A their silence was true of any build. Here the day is still outside every term and it HAS a
       record, which is decision 2's own case — and the gate answers false the moment recordFor()
       does, so they have to be alive. Asked of the marked day and of the dropped one, because the
       four split between those two states. */
    /* Locked first, because the drive above left this very column unlocked — and editDay()'s
       answer is measured as the state line's date moving, which cannot move to where it already
       is. That read false once for exactly that reason, on a build where the call was working. */
    await evalJs('(function(){ window.planbook.attendance.lockDay(); return 1; })()');
    const alive = await writerProbe(W[1]);
    await evalJs('(function(){ window.planbook.attendance.lockDay(); return 1; })()');
    const aliveDropped = await writerProbe(W[2]);
    await evalJs('(function(){ window.planbook.attendance.lockDay(); return 1; })()');
    check('and every writer that needs a record is ALIVE on an out-of-term day that has one — which is the other half of "the record wins", and the half a gate written on the term dates alone would have killed',
      alive.moved.unconfirmAll === true && alive.moved.setNote === true
        && alive.moved.editDay === true
        && aliveDropped.moved.undropClass === true && aliveDropped.moved.editDay === true,
      'on ' + W[1] + ' (a marked out-of-term day) ' + JSON.stringify(alive.moved)
        + ' :: on ' + W[2] + ' (a dropped one) ' + JSON.stringify(aliveDropped.moved));

    await evalJs('(function(){ window.planbook.attendance.lockDay(); return 1; })()');
    await clickIf('#attendanceHead th[data-attendance-col="' + W[2] + '"] [data-attendance-edit]');
    const onDrop = await read250();
    await clickIf('#attendanceActions [data-attendance-undrop]');
    const undropped = await read250();
    await evalJs('(function(){ window.planbook.attendance.lockDay(); return 1; })()');
    check('and a drop on an out-of-term day can still be UNDONE, through the real "class met after all" button the day offers BECAUSE it carries a record',
      onDrop.actions.some((x) => x.indexOf('data-attendance-undrop') === 0)
        && marksOn(onDrop, W[2]).length === 1
        && marksOn(undropped, W[2]).length === 0
        /* And the day goes straight back to being locked the moment its record is gone, which is
           the gate and the undo agreeing about the same date. */
        && (col250(undropped, W[2]) || {}).chip === 'Off term',
      'the unlocked dropped day offered ' + JSON.stringify(onDrop.actions)
        + ', after the undo this class holds '
        + JSON.stringify(JSON.parse(undropped.attJson)
          .filter((r) => r.classId === undropped.classId).map((r) => r.date))
        + ', and the day itself now reads '
        + JSON.stringify((col250(undropped, W[2]) || {}).chip));

    /* ── PHASE D: the two unbounded classes, which fail differently ── */
    const tapToday = async () => {
      await evalJs(`(async function(){
        var a = window.planbook.attendance, s = window.planbook.store;
        var id = window.planbook.classes.getSelectedClassId();
        s.update(function(d){
          d.attendance = (d.attendance || []).filter(function(x){ return x.classId !== id; }); });
        a.lockDay();
        a.renderAttendance();
        await s.flush();
        return 1; })()`);
      const drawn = await read250();
      await clickIf('#attendanceBody td[data-attendance-col="' + W[0]
        + '"] [data-attendance-cell="wo250-a"]');
      return { col: col250(drawn, W[0]), after: await read250() };
    };

    await setTerms250([{ id: 'tm_wo250n', label: 'WO-2.50 no dates', start: '', end: '' }]);
    const undated = await tapToday();
    check('a class whose terms carry NO dates is unbounded, exactly as it was before this landed — today draws a live column and a real tap on it lands',
      !!undated.col && undated.col.offTerm === false && undated.col.chip !== 'Off term'
        && undated.col.tappable > 0 && undated.col.tags === 'BUTTON'
        && undated.col.btn.indexOf('data-attendance-drop') === 0
        && marksOn(undated.after, W[0]).length === 1,
      'today reads ' + JSON.stringify((undated.col || {}).chip) + '/'
        + JSON.stringify((undated.col || {}).btn) + ' with '
        + ((undated.col || {}).tappable) + ' tappable cell(s), and the tap wrote '
        + JSON.stringify(marksOn(undated.after, W[0])));

    await setTerms250([{ id: 'tm_wo250h', label: 'WO-2.50 half typed', start: SOON, end: '' }]);
    const halfTyped = await tapToday();
    check('and a term with a START and no END is not a bound either — the state a teacher is IN while she types the dates, and the one that would seal the year behind her',
      !!halfTyped.col && halfTyped.col.offTerm === false && halfTyped.col.chip !== 'Off term'
        && halfTyped.col.tappable > 0 && halfTyped.col.tags === 'BUTTON'
        && marksOn(halfTyped.after, W[0]).length === 1,
      'with a start of ' + SOON + ' and no end at all, today reads '
        + JSON.stringify((halfTyped.col || {}).chip) + ' with '
        + ((halfTyped.col || {}).tappable) + ' tappable cell(s), and the tap wrote '
        + JSON.stringify(marksOn(halfTyped.after, W[0])));

    /* ── PHASE E: the calendar outranks the term dates, the way it outranks "Ahead" ── */
    await evalJs(`(async function(){
      var s = window.planbook.store, a = window.planbook.attendance;
      var id = window.planbook.classes.getSelectedClassId();
      s.update(function(d){
        d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== id; });
        if (!Array.isArray(d.events)) d.events = [];
        d.events = d.events.filter(function(e){ return e.id !== 'ev_wo250'; });
        d.events.push({ id:'ev_wo250', kind:'no-school', date: ${JSON.stringify(W[2])},
          endDate: ${JSON.stringify(W[2])}, title:'WO-2.50 institute day', classIds: [] });
      });
      a.renderAttendance();
      await s.flush();
      return 1; })()`);
    await setTerms250([{ id: 'tm_wo250a', label: AUTUMN, start: SOON, end: FAR }]);
    const withEvent = await read250();
    const coveredCol = col250(withEvent, W[2]);
    check('a no-school day that is ALSO outside every term still reads as covered, with its own title and its own door — the calendar outranks this the way it outranks "Ahead"',
      !!coveredCol && coveredCol.state === 'covered'
        && coveredCol.chip === 'No school' && coveredCol.chip !== 'Off term'
        && coveredCol.chipTitle.indexOf('WO-2.50 institute day') >= 0
        && coveredCol.btn.indexOf('data-dayoff-panel') === 0
        && coveredCol.glyphs === '–'
        && coveredCol.tones.indexOf('attendance-cell-covered') >= 0
        && coveredCol.label.indexOf('WO-2.50 institute day') >= 0,
      coveredCol ? JSON.stringify(coveredCol) : 'no column drawn for ' + W[2]);

    /* ── and the same nine writers on a date that IS in term, so the nine refusals above are not
          nine calls that would have done nothing on any date at all ── */
    await setTerms250([{ id: 'tm_wo250w', label: 'WO-2.50 wide', start: W[5], end: FAR }]);
    await evalJs(`(async function(){
      var s = window.planbook.store, a = window.planbook.attendance;
      var id = window.planbook.classes.getSelectedClassId();
      s.update(function(d){
        d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== id; });
        d.events = (d.events || []).filter(function(e){ return e.id !== 'ev_wo250'; });
      });
      a.renderAttendance();
      await s.flush();
      return 1; })()`);
    const acceptedToday = await writerProbe(W[0]);
    const acceptedPast = await writerProbe(W[1]);
    check('and the same writers on a date that IS inside a term all land — which is what makes the refusals above a bound rather than a seam that does nothing on any date at all',
      allCreatorsMoved(acceptedToday) && allCreatorsMoved(acceptedPast)
        /* editDay() splits the two on purpose: it unlocks a PAST column, so it acts on the
           past date and refuses today — which it did before this work order and still does. A
           check that expected it on both would be asserting the wrong rule with the right code. */
        && acceptedPast.moved.editDay === true
        && acceptedToday.moved.editDay === false,
      'with a term running ' + W[5] + ' … ' + FAR + ', on ' + W[0] + ' (today) '
        + JSON.stringify(acceptedToday.moved) + ' :: on ' + W[1] + ' (a past weekday) '
        + JSON.stringify(acceptedPast.moved)
        + ' — the four still false on both need a record before they act at all, which is what the '
        + 'record-wins probe above proves separately');

    /* AND THE THIRD MEMBER OF THAT PAIR, WHICH IS WO-2.52's (2026-08-19). The gate used to be "ISO
       shaped, and today or earlier", so a date AHEAD of today was refused whatever the terms said;
       it is narrowed rather than deleted now, and a future day INSIDE a term of this class is
       writable. SOON is ten weekdays out and the term arranged above runs to FAR, so it is exactly
       that day — and it joins acceptedToday/acceptedPast here rather than being asserted only in
       WO-2.52's own section, because the three of them are one claim about one gate asked on the
       three sides of today. editDay() moves on this one for the same reason it moves on the past
       date: it is not the day the screen is already open on. */
    const acceptedAhead = await writerProbe(SOON);
    check('and they land on a FUTURE date inside a term too (WO-2.52) — the third side of today, and the narrowing that replaced "today or earlier" rather than deleting it',
      allCreatorsMoved(acceptedAhead) && acceptedAhead.moved.editDay === true,
      'with the same term running ' + W[5] + ' … ' + FAR + ', on ' + SOON
        + ' (ten weekdays ahead, inside it) ' + JSON.stringify(acceptedAhead.moved));

    /* The document back as it was, IN PLACE rather than as a fresh object — every module holds the
       reference getDoc() handed it — with the class and term this block found open put back. */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo250save, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      c.selectClass(saved.classId);
      if (saved.termId) c.selectTerm(saved.termId);
      a.lockDay();
      a.setSearch(''); a.setFilter('all'); a.renderAttendance();
      delete window.__wo250save;
      delete window.__wo250;
      await s.flush();
      return 1; })()`);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
}
