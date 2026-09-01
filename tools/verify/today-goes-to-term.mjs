/* today-goes-to-term.mjs — `Today` goes to the term, and there is no way back to today (WO-2.54)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeNow, nodeColumns, nodeWeekdayAhead, daysApart } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, seam } = h;

/* ───────── `Today` goes to the term, and there is no way back to today (WO-2.54) ─────────
 *
 * THE FOURTH EDIT TO THIS SCREEN IN FOUR DAYS, AND IT IS A DEFECT IN THE THIRD. WO-2.52 anchored the
 * strip on the SELECTED term, which is what made the fortnight before a term readable; what it did
 * not do is move the term. So on 2026-08-20, with the Quarter 4 tab up and every term still ahead of
 * today, the owner pressed `Today` on the deployed app and arrived at Quarter 4's first day — and
 * nothing on the screen could get her back, because the one control that could was GREYED OUT. The
 * arrival rollover had the same hole from the other side: it only ever answered from inside a term,
 * so every day of a gap, every day after the last term, and every day of the setup fortnight opened
 * on whatever tab was last touched and called it correct.
 *
 * WHAT IS MEASURED HERE IS WHICH TERM THE SCREEN IS HANDED, and never how it draws once it has one.
 * anchorDate() is not touched by this work order and nothing below asserts anything new about it:
 * every phase reads the strip's newest column purely as the evidence that the TERM moved, because
 * the anchor's own rule — today inside the term, else the term's near edge — is WO-2.52's section's
 * claim and is still made there.
 *
 * THE THREE GAP READINGS ARE ONE RULE ASKED THREE TIMES, and they are three rather than one because
 * the work order's Acceptance and its Deliverables can be read as disagreeing. The Deliverables give
 * the measurement — `after.start - today` against `today - before.end`, in calendar days, forward
 * winning a TIE — and a tie-break is a rule with nothing to do unless nearest is what decides. The
 * fifth Acceptance line illustrates the same case as "one day past a term's end and two before the
 * next's start … the forward side still wins" and calls the forward side the nearer one, which it is
 * not on those two numbers; on the dates it names (Quarter 1 ending 10/31, Quarter 2 starting 11/3)
 * the one day in that gap a teacher opens a register on is 11/2, where the two numbers are the other
 * way round and the forward side genuinely IS nearer. So the walk measures, and this block drives it
 * from both sides and down the middle: forward when forward is nearer, back when back is nearer, and
 * forward on an exact tie. A single reading could not tell the measurement from a build that simply
 * always went forward.
 *
 * EVERY DATE HERE IS DERIVED FROM TODAY, for the reason the three sections above give at length. The
 * gap phases need their two sides measured in CALENDAR days on either side of today — which is what
 * the walk compares — so they step by calendar days rather than by weekdays; everything else steps
 * by weekdays, because those dates have to be columns the strip can draw.
 */
console.log('\n--- `Today` goes to the term, and there is no way back to today (WO-2.54) ---');

if (!seam) {
  skip('`Today` moves the selected term to the one nearest today',
    'the window.planbook seam is not present, so nothing here could arrange a term or press a pager');
} else {
  /* Six columns need a laptop's width, and the section above cleared its own override on the way
     out. Stated here rather than inherited, which is the note every section in this run makes. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));

  const W = nodeColumns(6, 0);                 /* [today, ...five weekdays back] */
  /* THE CALENDAR-DAY STEP, which the weekday walkers above cannot express: a gap of two days either
     side of today is two days whether or not they are school days, and it is exactly what the walk
     under test compares. Same shape as `tomorrow` further up this file, with the step as an
     argument. */
  const calDay = (n) => {
    const d = nodeNow();
    d.setDate(d.getDate() + n);
    const p = (x) => (x < 10 ? '0' : '') + x;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  /* Four dated terms, all of them AHEAD of today — the owner's own screen on the day she reported
     this, with the register being readied a fortnight before the year starts. */
  const Q1_ID = 'tm_wo254a', Q2_ID = 'tm_wo254b', Q3_ID = 'tm_wo254c', Q4_ID = 'tm_wo254d';
  const Q1 = 'WO-2.54 first', Q4 = 'WO-2.54 fourth';
  const OPENS = nodeWeekdayAhead(10);
  const FOUR_TERMS = [
    { id: Q1_ID, label: Q1, start: OPENS, end: nodeWeekdayAhead(40) },
    { id: Q2_ID, label: 'WO-2.54 second', start: nodeWeekdayAhead(41), end: nodeWeekdayAhead(70) },
    { id: Q3_ID, label: 'WO-2.54 third', start: nodeWeekdayAhead(71), end: nodeWeekdayAhead(100) },
    { id: Q4_ID, label: Q4, start: nodeWeekdayAhead(101), end: nodeWeekdayAhead(130) },
  ];
  const OPENS_IN = daysApart(OPENS, W[0]);
  /* The ordinary day: one term with today inside it, which is what every day of a live term looks
     like and the state acceptance line 3 says must not change by one keystroke. */
  const NOW_ID = 'tm_wo254now', NOW = 'WO-2.54 running';
  const NOW_TERM = { id: NOW_ID, label: NOW, start: W[5], end: nodeWeekdayAhead(20) };
  /* February: the term that ENDED, selected by hand, with today inside the other one. WO-2.52's own
     acceptance line, re-driven here because this work order is the one most likely to break it. */
  const FEB_A_ID = 'tm_wo254feb1', FEB_B_ID = 'tm_wo254feb2';
  const FEB_A = 'WO-2.54 finished', FEB_B = 'WO-2.54 current';
  const FEB_TERMS = [
    { id: FEB_A_ID, label: FEB_A, start: W[5], end: W[3] },
    { id: FEB_B_ID, label: FEB_B, start: W[2], end: nodeWeekdayAhead(30) },
  ];
  const GAP_BACK_ID = 'tm_wo254gapb', GAP_FWD_ID = 'tm_wo254gapf';
  const GAP_BACK = 'WO-2.54 ended', GAP_FWD = 'WO-2.54 opening';
  /* One gap, three arrangements of it. Only the two inner edges move: the term behind today ends
     `back` calendar days ago and the one ahead opens `fwd` calendar days from now. */
  const gapTerms = (back, fwd) => [
    { id: GAP_BACK_ID, label: GAP_BACK, start: calDay(-90), end: calDay(-back) },
    { id: GAP_FWD_ID, label: GAP_FWD, start: calDay(fwd), end: calDay(fwd + 60) },
  ];
  const PAST_A_ID = 'tm_wo254pasta', PAST_B_ID = 'tm_wo254pastb';
  const PAST_B = 'WO-2.54 last';
  const PAST_TERMS = [
    { id: PAST_A_ID, label: 'WO-2.54 first of two', start: calDay(-200), end: calDay(-120) },
    { id: PAST_B_ID, label: PAST_B, start: calDay(-90), end: W[3] },
  ];
  const UNDATED_ID = 'tm_wo254undated';
  const SR_254 = 'WO-2.54 sentinel — nothing was announced';

  const INSTALL_254 = `(function(){
    function hookOf(b){
      var out = 'none';
      Array.prototype.slice.call(b.attributes).forEach(function(x){
        if (x.name.indexOf('data-') === 0 && x.name !== 'data-attendance-col') {
          out = x.name + (x.value ? '=' + x.value : ''); }
      });
      return out;
    }
    window.__wo254 = function(){
      var a = window.planbook.attendance, c = window.planbook.classes;
      var id = c.getSelectedClassId();
      var heads = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead th[data-attendance-col]'));
      var band = document.getElementById('attendanceBanner');
      var pager = document.getElementById('attendancePager');
      var pagerBtns = pager ? Array.prototype.slice.call(pager.querySelectorAll('button')) : [];
      var nav = document.getElementById('termNav');
      var tabs = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
      var live = document.getElementById('srLive');
      var view = document.getElementById('classView');
      return {
        today: a.todayISO(),
        classId: id,
        term: c.getSelectedTermId(),
        active: tabs.filter(function(b){ return b.classList.contains('active'); })
          .map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
        tabs: tabs.length,
        pref: JSON.stringify(window.planbook.getPref('openTermIds') || {}),
        registryUp: !!(view && !view.classList.contains('hidden')),
        /* What the screen SAYS, in the same round trip as what it shows: this section's whole
           second half is one sentence per press. (No backticks in this comment: it is inside a
           template literal.) */
        said: live ? live.textContent : '',
        coarse: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches),
        band: {
          up: !!(band && !band.classList.contains('hidden')),
          cls: band ? band.className : '',
          text: band ? band.textContent : '' },
        pager: pagerBtns.map(function(b){
          var r = b.getBoundingClientRect();
          return { hook: hookOf(b), disabled: !!b.disabled, title: b.title || '',
            w: Math.round(r.width), h: Math.round(r.height) }; }),
        columns: heads.map(function(th){
          var d = th.getAttribute('data-attendance-col');
          var chip = th.querySelector('.attendance-day-state');
          var btn = th.querySelector('button');
          var cells = Array.prototype.slice.call(
            document.querySelectorAll('#attendanceBody td[data-attendance-col="' + d + '"] > *'))
            .filter(function(n){ return n.className.indexOf('attendance-cell-time') < 0; });
          return {
            date: d,
            chip: chip ? chip.textContent : '',
            btn: btn ? hookOf(btn) : 'none',
            tappable: cells.filter(function(n){ return n.tagName === 'BUTTON'; }).length }; }) };
    };
    return 1; })()`;

  /* Flushed before every read, for tools/README.md trap 6, and given the 250ms announce() needs:
     src/live-region.js clears and re-writes on a 30ms timer so that a repeat reaches assistive tech
     as a change, and a read taken straight back reports silence from a screen that spoke. */
  const read54 = async () => {
    await new Promise(r => setTimeout(r, 250));
    return evalJs('(async function(){ await window.planbook.store.flush();'
      + ' return window.__wo254(); })()');
  };
  const dates54 = (r) => r.columns.map((c) => c.date);
  const col54 = (r, date) => r.columns.filter((c) => c.date === date)[0] || null;
  const page54 = (r, which) => r.pager.filter((b) => b.hook === 'data-attendance-page=' + which)[0]
    || { hook: 'missing', disabled: false, title: '', w: 0, h: 0 };

  /*
    ONE ARRANGEMENT OF TERMS AND ONE CHOICE OF TAB, through the store and through selectTerm() — no
    control types six dates, and everything after a call to this is a read or a real click.

    THE ORDER INSIDE IT IS LOAD-BEARING NOW, which is the one way this differs from its WO-2.52
    sibling. That one ended with pageDays('today') to put the paging back to 0; since this work order
    that call MOVES THE TERM, so it would arrange the fixture and then walk out of it. Paging is reset
    FIRST, against whatever terms the phase above left behind, and the tab is chosen last.
  */
  const arrange54 = (terms, pick) => evalJs(`(async function(){
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

  /* The ledger back to empty for this class between phases, and the sentinel into the live region in
     the same breath: WO-2.50's decision 2 says a day that already carries a record is never out of
     term, so a mark left behind would make the next phase's locked column editable for a reason with
     nothing to do with what it is asserting — and a sentence left behind would be read as this
     phase's. */
  const clear54 = () => evalJs(`(async function(){
    var s = window.planbook.store, a = window.planbook.attendance;
    var id = window.planbook.classes.getSelectedClassId();
    s.update(function(d){
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== id; });
    });
    var live = document.getElementById('srLive');
    if (live) live.textContent = ${JSON.stringify(SR_254)};
    a.lockDay();
    a.renderAttendance();
    await s.flush();
    return 1; })()`);

  /* THE ARRIVAL IS A REAL CLICK ON THE CLASS TAB, never a call to resetRegistry() — that tab is one
     of the two controls src/shell.js runs the whole arrival chain from, and a call to the module
     would prove the writer works where the tap proves it is WIRED. */
  const arrive54 = async (classId) => {
    await clickSel('#classTabBar [data-class-tab="' + classId + '"]');
    return read54();
  };
  const repaint54 = () => evalJs(`(async function(){
    var a = window.planbook.attendance;
    a.renderAttendance();
    a.paintRenderedTotals();
    a.renderAttendance();
    await window.planbook.store.flush();
    return 1; })()`);

  const plant254 = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var id = c.getSelectedClassId();
    var cls = (d.classes || []).filter(function(x){ return x.id === id; })[0];
    if (!cls) return { ok:false, why:'no class is open, so there is no term to move' };
    /* Parked on the window rather than carried back through CDP, for the reason every fixture in
       this file gives: the teardown has to put the SAME object graph back, and a document that made
       the round trip would come back a copy of a copy.
       (No backticks in this comment: it is inside a template literal.) */
    window.__wo254save = { doc: JSON.stringify(d), classId: id, termId: c.getSelectedTermId() };
    s.update(function(doc){
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.events)) doc.events = [];
      if (!Array.isArray(cls.roster)) cls.roster = [];
      doc.attendance = doc.attendance.filter(function(r){ return r.classId !== id; });
      /* The calendar emptied, which is this section's second premise: a day off left behind by an
         earlier section moves the forward horizon, and one of the phases below reads a locked
         column at a term's end. (No backticks: template literal.) */
      doc.events = [];
      doc.students.push({ id:'wo254-a', first:'Term', last:'Nearest' });
      cls.roster.push('wo254-a');
    });
    a.setSearch(''); a.setFilter('all');
    c.selectClass(id);
    a.renderAttendance();
    await s.flush();
    return { ok:true, classId:id, name:cls.name }; })()`);

  if (!plant254.ok) {
    check('the WO-2.54 fixture is real: a class with a roster is open on the registry, over an empty calendar',
      false, plant254.why);
  } else {
    await evalJs(INSTALL_254);

    /* ── PHASE A: the arrival, from a tab six months away ── */
    await arrange54(FOUR_TERMS, Q4_ID);
    await clear54();
    const parked = await read54();
    const arrived = await arrive54(plant254.classId);

    check('the WO-2.54 fixture is real: the registry is up on a class with four dated terms, every one of them ahead of today, and the tab is parked on the fourth',
      parked.registryUp && parked.today === W[0] && parked.term === Q4_ID
        && parked.tabs === 4 && dates54(parked)[0] === FOUR_TERMS[3].start,
      'the app says today is ' + JSON.stringify(parked.today) + ', this file derived '
        + JSON.stringify(W[0]) + '; the nav draws ' + parked.tabs + ' tab(s), the open one is '
        + JSON.stringify(parked.term) + ' (the fourth term runs ' + FOUR_TERMS[3].start + ' … '
        + FOUR_TERMS[3].end + '), and the strip stands on ' + JSON.stringify(dates54(parked)));

    check('arriving with the tab parked on a term six months out opens on the term NEAREST today instead — the first one — anchored on the day it starts, with the nav highlight and the preference both moved',
      arrived.term === Q1_ID && arrived.active === Q1_ID
        && dates54(arrived)[0] === OPENS
        && arrived.pref !== parked.pref && arrived.pref.indexOf(Q1_ID) >= 0
        && arrived.band.text === Q1 + ' opens in ' + OPENS_IN + ' days.',
      'the open term went ' + JSON.stringify(parked.term) + ' -> ' + JSON.stringify(arrived.term)
        + ', the nav highlight ' + JSON.stringify(parked.active) + ' -> '
        + JSON.stringify(arrived.active) + ', the preference ' + parked.pref + ' -> '
        + arrived.pref + ', and the strip opened on ' + JSON.stringify(dates54(arrived))
        + ' under a band reading ' + JSON.stringify(arrived.band.text));

    /* ── PHASE B: browsing to a far term, and getting home in one press ── */
    await clickSel('#termNav [data-term-select="' + Q4_ID + '"]');
    await clear54();
    const browsed = await read54();

    check('choosing that far term by hand still STICKS and still anchors the strip on it — and this is the state the defect was reported from, so `Today` is live rather than greyed out with a tooltip naming a day next April',
      browsed.term === Q4_ID && browsed.active === Q4_ID
        && dates54(browsed)[0] === FOUR_TERMS[3].start
        && page54(browsed, 'today').disabled === false
        && page54(browsed, 'today').title.indexOf('Back to') === 0,
      'the open term is ' + JSON.stringify(browsed.term) + ', the strip stands on '
        + JSON.stringify(dates54(browsed)) + ', and `Today` reads '
        + JSON.stringify(page54(browsed, 'today')));

    await clickSel('#attendancePager [data-attendance-page="today"]');
    const home = await read54();

    check('and one press of it takes the tab, the nav highlight and the strip back to the term nearest today — in ONE sentence, which names the term it landed in and is not selectTerm()’s',
      home.term === Q1_ID && home.active === Q1_ID && dates54(home)[0] === OPENS
        && home.said.indexOf('Back to this week, ending ') === 0
        && home.said.slice(-(Q1.length + 5)) === ' in ' + Q1 + '.'
        && home.said.indexOf('is open') < 0,
      'the open term went ' + JSON.stringify(browsed.term) + ' -> ' + JSON.stringify(home.term)
        + ', the strip ' + JSON.stringify(dates54(browsed)) + ' -> '
        + JSON.stringify(dates54(home)) + ', and the screen said ' + JSON.stringify(home.said));

    /* ── PHASE C: the ordinary day, unchanged to the keystroke ── */
    await arrange54([NOW_TERM], NOW_ID);
    await clear54();
    const ordinary = await read54();

    check('on an ordinary day — today inside the selected term, unpaged, nothing unlocked — `Today` is DISABLED under the same sentence it has always carried, because there is nowhere for it to go',
      ordinary.term === NOW_ID && dates54(ordinary)[0] === W[0]
        && page54(ordinary, 'today').disabled === true
        && page54(ordinary, 'today').title === 'You are on today',
      'the strip stands on ' + JSON.stringify(dates54(ordinary)) + ' in term '
        + JSON.stringify(ordinary.term) + ' and `Today` reads '
        + JSON.stringify(page54(ordinary, 'today')));

    await clickSel('#attendancePager [data-attendance-page="earlier"]');
    await clickSel('#attendancePager [data-attendance-page="today"]');
    const backOrdinary = await read54();

    check('and paged back and pressed, it does exactly what it did before this work order: the week ending today, the preference byte-identical, and NO term in the sentence',
      dates54(backOrdinary)[0] === W[0] && backOrdinary.term === NOW_ID
        && backOrdinary.pref === ordinary.pref
        && backOrdinary.said === 'Back to this week, ending today.',
      'the strip came back to ' + JSON.stringify(dates54(backOrdinary)) + ', the preference read '
        + ordinary.pref + ' -> ' + backOrdinary.pref + ', and the screen said '
        + JSON.stringify(backOrdinary.said));

    /* ── PHASE D: WO-2.52's February line, which this work order is the one most likely to break ── */
    await arrange54(FEB_TERMS, FEB_B_ID);
    await clear54();
    await clickSel('#termNav [data-term-select="' + FEB_A_ID + '"]');
    const february = await read54();
    await repaint54();
    const repainted = await read54();

    check('WO-2.52’s February line survives: with today inside the later term, choosing the FINISHED one by hand anchors the strip on its last day, locked behind its own ✏, with WO-2.51’s band up — and three repaints move nothing at all',
      february.term === FEB_A_ID && dates54(february)[0] === W[3]
        && (col54(february, W[3]) || {}).tappable === 0
        && (col54(february, W[3]) || {}).btn === 'data-attendance-edit=' + W[3]
        && february.band.cls.indexOf('rollover') >= 0
        && repainted.term === FEB_A_ID && repainted.pref === february.pref,
      'the open term is ' + JSON.stringify(february.term) + ', the strip stands on '
        + JSON.stringify(dates54(february)) + ', its newest column reads '
        + JSON.stringify(col54(february, W[3])) + ', the band reads '
        + JSON.stringify(february.band.text) + ', and across three repaints the preference read '
        + february.pref + ' -> ' + repainted.pref);

    await clickSel('#attendancePager [data-attendance-page="today"]');
    const outOfFebruary = await read54();

    check('and `Today` is the way out of it — live on that screen, and one press puts the tab on the term that HOLDS today with the strip back on today, naming the term it landed in',
      page54(february, 'today').disabled === false
        && outOfFebruary.term === FEB_B_ID && outOfFebruary.active === FEB_B_ID
        && dates54(outOfFebruary)[0] === W[0]
        && outOfFebruary.said === 'Back to this week, ending today in ' + FEB_B + '.',
      '`Today` read ' + JSON.stringify(page54(february, 'today'))
        + ' on the finished term; after the press the tab is '
        + JSON.stringify(outOfFebruary.term) + ', the strip stands on '
        + JSON.stringify(dates54(outOfFebruary)) + ' and the screen said '
        + JSON.stringify(outOfFebruary.said));

    /* ── PHASE E: the gap, from both sides and down the middle ── */
    await arrange54(gapTerms(4, 2), GAP_BACK_ID);
    await clear54();
    const gapForward = await arrive54(plant254.classId);

    check('in the gap between two terms, with the one ahead NEARER, arrival takes the forward side — the strip opens on the day it starts and the band counts the days to it',
      gapForward.term === GAP_FWD_ID && gapForward.active === GAP_FWD_ID
        && dates54(gapForward)[0] === calDay(2)
        && gapForward.band.text === GAP_FWD + ' opens in 2 days.',
      'four calendar days past one term and two before the next, the open term is '
        + JSON.stringify(gapForward.term) + ', the strip stands on '
        + JSON.stringify(dates54(gapForward)) + ' and the band reads '
        + JSON.stringify(gapForward.band.text));

    await arrange54(gapTerms(2, 4), GAP_FWD_ID);
    await clear54();
    const gapBack = await arrive54(plant254.classId);

    check('and with the FINISHED one nearer it takes that instead, anchored on the day it ended — the measurement, not a build that always walks forward',
      gapBack.term === GAP_BACK_ID && gapBack.active === GAP_BACK_ID
        && dates54(gapBack)[0] === calDay(-2)
        && gapBack.band.text.indexOf(GAP_BACK + ' ended on ') === 0,
      'two calendar days past one term and four before the next, the open term is '
        + JSON.stringify(gapBack.term) + ', the strip stands on '
        + JSON.stringify(dates54(gapBack)) + ' and the band reads '
        + JSON.stringify(gapBack.band.text));

    await arrange54(gapTerms(3, 3), GAP_BACK_ID);
    await clear54();
    const gapTie = await arrive54(plant254.classId);

    check('and on an exact tie the forward side wins — three days either way, and a teacher opening her register in a gap is getting ready for what comes next',
      gapTie.term === GAP_FWD_ID && dates54(gapTie)[0] === calDay(3)
        && gapTie.band.text === GAP_FWD + ' opens in 3 days.',
      'three calendar days either side, the open term is ' + JSON.stringify(gapTie.term)
        + ', the strip stands on ' + JSON.stringify(dates54(gapTie)) + ' and the band reads '
        + JSON.stringify(gapTie.band.text));

    /* ── PHASE F: past the last term, where there is no forward side at all ── */
    await arrange54(PAST_TERMS, PAST_A_ID);
    await clear54();
    const past = await arrive54(plant254.classId);

    check('with every term behind today, arrival takes the LAST of them and anchors on the day it ended, locked — the walk does not fall through to no move at all for want of a term ahead',
      past.term === PAST_B_ID && past.active === PAST_B_ID && dates54(past)[0] === W[3]
        && (col54(past, W[3]) || {}).tappable === 0
        && (col54(past, W[3]) || {}).btn === 'data-attendance-edit=' + W[3]
        && past.band.text.indexOf(PAST_B + ' ended on ') === 0,
      'the open term went ' + JSON.stringify(PAST_A_ID) + ' -> ' + JSON.stringify(past.term)
        + ', the strip stands on ' + JSON.stringify(dates54(past)) + ', its newest column reads '
        + JSON.stringify(col54(past, W[3])) + ' and the band reads '
        + JSON.stringify(past.band.text));

    /* ── PHASE G: a class whose terms carry no dates pays nothing and is promised nothing ── */
    await arrange54([{ id: UNDATED_ID, label: 'WO-2.54 undated', start: '', end: '' }], UNDATED_ID);
    await clear54();
    const undated = await read54();
    const undatedArrived = await arrive54(plant254.classId);

    check('a class whose terms carry no dates is untouched: arrival moves nothing, the strip opens on today, and `Today` is disabled under exactly the sentence it carried before this work order',
      undated.term === UNDATED_ID && dates54(undated)[0] === W[0]
        && page54(undated, 'today').disabled === true
        && page54(undated, 'today').title === 'You are on today'
        && undatedArrived.term === UNDATED_ID && undatedArrived.pref === undated.pref,
      'the strip stands on ' + JSON.stringify(dates54(undated)) + ', `Today` reads '
        + JSON.stringify(page54(undated, 'today')) + ', and across an arrival the preference read '
        + undated.pref + ' -> ' + undatedArrived.pref);

    await clickSel('#attendancePager [data-attendance-page="earlier"]');
    await clickSel('#attendancePager [data-attendance-page="today"]');
    const undatedBack = await read54();

    check('and pressing it there moves no term either — the week ending today, the preference byte-identical, and no term named in the sentence',
      dates54(undatedBack)[0] === W[0] && undatedBack.term === UNDATED_ID
        && undatedBack.pref === undated.pref
        && undatedBack.said === 'Back to this week, ending today.',
      'the strip came back to ' + JSON.stringify(dates54(undatedBack)) + ', the preference read '
        + undated.pref + ' -> ' + undatedBack.pref + ', and the screen said '
        + JSON.stringify(undatedBack.said));

    /*
      ── PHASE H: upright, under a thumb ──

      THE ORIENTATION THE DEFECT WAS REPORTED FROM. Portrait cannot page at all (WO-2.12), so
      `Today` is the only control on that screen that can move anything — which is why this work
      order's 👤 line asks for one tap and 44px on the owner's own iPad.

      IT CLOSES NOTHING ON THAT LINE. A device metric is not a device, this run has never seen a
      thumb, and "in one tap" on hardware is a reading only she can take. What is measurable here is
      the pair that makes the tap possible at all: the control is LIVE in the state she reported, and
      it is at least 44 by 44 with the pointer actually coarse — asserted before anything below it is
      believed (tools/README.md § CDP trap 3).
    */
    await arrange54(FOUR_TERMS, Q4_ID);
    await clear54();
    await send('Emulation.setDeviceMetricsOverride',
      { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    await repaint54();
    const upright = await read54();

    check('held upright, on the one column portrait draws, `Today` is live in exactly the state the defect was reported from and clears 44px under a coarse pointer',
      upright.coarse === true && upright.columns.length === 1
        && upright.term === Q4_ID && dates54(upright)[0] === FOUR_TERMS[3].start
        && page54(upright, 'today').disabled === false
        && page54(upright, 'today').h >= 44 && page54(upright, 'today').w >= 44,
      'the pointer is ' + (upright.coarse ? 'coarse' : 'FINE') + ', the strip drew '
        + JSON.stringify(dates54(upright)) + ' on term ' + JSON.stringify(upright.term)
        + ', and `Today` reads ' + JSON.stringify(page54(upright, 'today')));

    await clickSel('#attendancePager [data-attendance-page="today"]');
    const uprightHome = await read54();

    check('and one tap of it gets home on the screen that cannot page — one column, the day the nearest term opens, and a one-date sentence naming that term',
      uprightHome.term === Q1_ID && uprightHome.active === Q1_ID
        && uprightHome.columns.length === 1 && dates54(uprightHome)[0] === OPENS
        && uprightHome.said.indexOf('Back to ') === 0
        && uprightHome.said.indexOf('this week') < 0
        && uprightHome.said.indexOf(' in ' + Q1 + '.') > 0,
      'one tap took the tab ' + JSON.stringify(upright.term) + ' -> '
        + JSON.stringify(uprightHome.term) + ' and the strip '
        + JSON.stringify(dates54(upright)) + ' -> ' + JSON.stringify(dates54(uprightHome))
        + ', with the screen saying ' + JSON.stringify(uprightHome.said));

    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 300));

    /* The document back as it was, IN PLACE rather than as a fresh object — every module holds the
       reference getDoc() handed it — with the class and term this block found open put back. */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo254save, d = s.getDoc();
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
      delete window.__wo254save;
      delete window.__wo254;
      await s.flush();
      return 1; })()`);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
}
