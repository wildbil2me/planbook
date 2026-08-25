/* calendar-drawn.mjs — the month and the week, drawn (WO-6.3)
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
 * ───────── the month and the week, drawn (WO-6.3) ─────────
 *
 * WHAT ONLY A BROWSER CAN SETTLE HERE, and it is a different list from WO-6.2's one section up.
 * That block drove a MODEL with no DOM in it. This one is the DOM: the first surface in Phase 6
 * with markup, so the claims are about what is on a cell, what a tap on it does, and what comes
 * out of a printer.
 *
 * THE FIRST IS THE FILTER OVER TWO DIFFERENT SOURCES. "The class filter applies to derived items as
 * well as authored ones" is a claim about a rule that has to be applied twice, in two places, over
 * two shapes — an authored event answers through coversClass() and a derived row answers on its own
 * `classId`, and a review answers through neither, because it belongs to a student. A build that
 * filtered the events and forgot the due dates draws a month that looks entirely plausible. So the
 * counts below are read per kind, on and off the filter, from the screen's own model.
 *
 * THE SECOND IS THE TAP. Six kinds of item, six different destinations, and every one of them a
 * route this app already had — the days-off panel, the events panel with a row loaded, an
 * assignment's editor on the assignment list, the term editor, a class's registry, and a student's
 * own editor with the support panel open. None of that is inspectable from a file: what it is is a
 * chain of navigation in src/shell.js, and the only way to ask whether it lands is to click.
 *
 * THE THIRD IS THE 44px DEPARTURE, WHICH IS ASSERTED AS A DEPARTURE. src/calendar-view.css floors a
 * month chip at 28px and says why at the point of departure; the week's chips take the full 44. The
 * whole-app touch sweep can only pass or go red, so #calendarView is enumerated there and measured
 * here (see its `byHand` note in VIEW_PLAN): the toolbar at 44 or over, the month chip at its own
 * floor AND UNDER 44 so that a silent drift to 20 and a silent "fix" to 44 both show up, and the
 * week chip at 44 or over. None of the three closes the 👤 line — a thumb on a real iPad is what
 * settles whether the departure is right, and no emulator has one.
 *
 * THE FOURTH IS THE PRINTER, and it is the one with the most to lose. A review date must not reach
 * paper WHATEVER presentation mode says — the mode is the screen's suppression and a teacher can
 * legitimately have it off, because she is looking at her own iPad. So the chip is read under
 * `Emulation.setEmulatedMedia: 'print'` three ways: with the gate on, with the gate off (the one
 * ungated rule in that stylesheet, which only ever subtracts), and on screen, where it must still
 * be there or the two readings above prove nothing.
 *
 * EVERY EXACT COUNT BELOW IS TAKEN OVER THIS SECTION'S OWN FIXTURE, which is trap 8's shape read
 * forward: earlier sections leave dated terms behind in 2027, and a month grid reads every class's
 * terms. The unfiltered total is printed beside every filtered one, so a foreign row explains
 * itself instead of reddening a correct build.
 *
 * THE FIXTURE IS IN APRIL 2027, one month past WO-6.2's March and one before WO-6.1's May, so it
 * collides with neither and the arithmetic is something a reader can check by counting.
 * 2027-04-01 is a Thursday, which is why the grid it produces borrows days from March.
 */
console.log('\n--- the month and the week, drawn (WO-6.3) ---');
if (!seam) {
  skip('the calendar grid (WO-6.3)', 'window.planbook is not on the page, so nothing here can seed '
    + 'a month, read what the grid decided, or put the document back');
} else {
  const CLS = 'c_wo63';
  const OTHER = 'c_wo63b';
  const STU = 's_wo63';
  const TERM = 'tm_wo63';
  const ASG = 'a_wo63';
  const MONTH_FROM = '2027-04-01';
  /* Far enough from every fixed date in this file that nothing else can be sitting in it — the
     empty state is a claim about a month with NOTHING in it, and a leftover would be the one thing
     that makes it false on a correct build. Reached through the pager, four taps on. */
  const EMPTY_FROM = '2027-08-01';
  const T_START = '2027-04-05', T_END = '2027-04-27';
  const DUE = '2027-04-14', DUE_MOVED = '2027-04-21';
  const MET = '2027-04-07';
  const BARE = '2027-04-08';
  const DROP = '2027-04-20';
  const REVIEW = '2027-04-13';
  const SHUT_FROM = '2027-04-01', SHUT_TO = '2027-04-02';
  const GRADES_DUE = '2027-04-29';
  /* The five things `reviewDate` shares a record with, seeded with phrases nothing else in this
     repository contains — so "no plan type, no accommodation, no medical or behavior-plan text" is
     a SEARCH over what the grid actually rendered rather than an inspection of the field names
     somebody remembered to look for. Same technique as WO-6.2's block, one layer out: that one
     searched a serialised model, this one searches the DOM. */
  const MEDICAL = 'Wo63MedicalPhrase';
  const BEHAVIOR = 'Wo63BehaviorPhrase';
  const ACCOM = 'Wo63AccommodationPhrase';
  const MANAGER = 'Wo63CaseManagerPhrase';
  const GIVEN = 'Wo63Given', SURNAME = 'Wo63Surname';
  const SENSITIVE = [MEDICAL, BEHAVIOR, ACCOM, MANAGER, 'IEP', 'extended-time'];

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture ──
     Two classes, so the class filter has something to be wrong about; one of everything the grid
     can draw; and the five neighbours of the review date. The events go through src/calendar.js's
     own newEvent()/addEvent(), so what is seeded is a record this app could have written. */
  const plant = await evalJs(`(function(){
    var s = window.planbook.store, cal = window.planbook.calendar;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var before = (d.events || []).map(function(e){ return e.id; });
    var mode = window.planbook.supports.presentationMode();
    var wasClass = window.planbook.classes.getSelectedClassId();
    var ids = {};
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      doc.students.push({ id:'${STU}', first:'${GIVEN}', last:'${SURNAME}',
        supports:{ plan:'IEP', caseManager:{ name:'${MANAGER}', email:'' },
          reviewDate:'${REVIEW}',
          accommodations:[{ kind:'extended-time', detail:'${ACCOM}', appliesTo:[] }],
          medical:'${MEDICAL}', behaviorPlan:'${BEHAVIOR}' }});
      doc.classes.push({ id:'${CLS}', name:'WO-6.3 Grid', archived:false,
        roster:['${STU}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-6.3 Term', start:'${T_START}', end:'${T_END}' }],
        categories:[{ id:'k_wo63', name:'All work', weight:100 }]});
      doc.classes.push({ id:'${OTHER}', name:'WO-6.3 Other', archived:false,
        roster:[], letterScale:null, terms:[], categories:[] });
      doc.assignments.push({ id:'${ASG}', classId:'${CLS}', termId:'${TERM}',
        categoryId:'k_wo63', name:'WO-6.3 Quiz', points:100, assigned:'${T_START}',
        due:'${DUE}' });
      doc.attendance.push({ classId:'${CLS}', date:'${MET}', marks:{} });
      var drop = cal.newEvent('dropped', '${DROP}', '', 'WO-6.3 planned drop', ['${CLS}']);
      var shut = cal.newEvent('no-school', '${SHUT_FROM}', '${SHUT_TO}', 'WO-6.3 closure', []);
      var grades = cal.newEvent('grades-due', '${GRADES_DUE}', '', 'WO-6.3 grades due', []);
      cal.addEvent(doc, drop); cal.addEvent(doc, shut); cal.addEvent(doc, grades);
      ids = { drop: drop ? drop.id : '', shut: shut ? shut.id : '',
        grades: grades ? grades.id : '' };
    });
    var now = s.getDoc();
    return { ok:true, mode:mode, wasClass:wasClass, ids:ids, beforeIds:before,
      afterIds:(now.events || []).map(function(e){ return e.id; }) }; })()`);
  const SEEDED = plant && plant.ok ? plant.afterIds : [];
  const DROP_ID = plant && plant.ok ? plant.ids.drop : 'no-drop-was-seeded';
  const SHUT_ID = plant && plant.ok ? plant.ids.shut : 'no-closure-was-seeded';
  const GRADES_ID = plant && plant.ok ? plant.ids.grades : 'no-grades-due-was-seeded';
  check('WO-6.3 fixture: two classes, a term, an assignment with a due date, a recorded meeting, a '
    + 'planned drop, a school-wide closure, a grades-due date and a review date — plus the five '
    + 'support fields that review date shares a record with, in phrases nothing else here contains',
    !!plant && plant.ok === true && !!plant.ids.drop && !!plant.ids.shut && !!plant.ids.grades
      && plant.afterIds.length === plant.beforeIds.length + 3,
    plant && plant.ok
      ? plant.beforeIds.length + ' event(s) before the seed and ' + plant.afterIds.length
        + ' after; drop=' + plant.ids.drop + ' closure=' + plant.ids.shut
        + ' grades-due=' + plant.ids.grades
      : JSON.stringify(plant));

  /* Which view is up, off the DOM — the same answer src/views.js's currentView() gives. */
  const onView = async () => await evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
  /* The screen's own model, which is what the grid was drawn FROM (src/calendar-view.js). */
  const model = async () => await evalJs('window.planbook.calendarView.calendarModel()');
  const monthIndex = (iso) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7));
  /* Paged through the REAL control, one month at a time, rather than by writing an anchor: the
     pager is one of the things under test, and a check that reached past it would pass on a build
     whose Next button does nothing. Capped, so a build that never moves fails instead of looping. */
  async function pageToMonth(iso) {
    for (let i = 0; i < 30; i++) {
      const from = (await model()).from;
      const delta = monthIndex(iso) - monthIndex(from);
      if (delta === 0) return true;
      await clickSel('#calendarView [data-calendar-page="' + (delta < 0 ? 'earlier' : 'later') + '"]');
    }
    return false;
  }
  /*
    THE WAY BACK, AND IT IS A HELPER BECAUSE `[data-view-home]` IS NOT ONE ELEMENT.

    Four screens carry that hook and the header's own "All classes" tab carries a fifth — and which
    of them is VISIBLE depends on which view is up, because src/classes.js draws that tab on class
    screens only. On the calendar, which is not a class screen, the first match in document order is
    #classView's, which is `.hidden`: clickSel measures it at 0x0 and clicks the top-left corner of
    the viewport instead, which is clickSel's oldest trap and cost this section two red checks on
    its first run. So the visible one is found by index and clicked by index.
  */
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
  }
  const closeAnyModal = async () => await evalJs(`(function(){
    var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
    Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
    return open.length; })()`);

  /* ── the sixth view, opened the way a teacher opens it from the grid ──
     Through the button on the home screen, which is one of its two doors since WO-6.6 (the other is
     the fourth segment on the class-screen switcher, walked further down). What is claimed here is
     the shape of the screen a teacher arrives at from OUTSIDE every class: it is a view, it IS a
     class screen, and the lens it opens on is every class. */
  if ((await onView()) !== 'homeView') await goHome();
  await clickSel('#homeView [data-calendar-open]');
  await new Promise(r => setTimeout(r, 200));
  const arrived = await evalJs(`(function(){
    var cur = document.querySelector('#calendarView [data-screen-nav] [aria-current="true"]');
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      segments: document.querySelectorAll('#calendarView [data-screen-nav] [data-class-screen]').length,
      labels: Array.prototype.map.call(
        document.querySelectorAll('#calendarView [data-screen-nav] button'),
        function(b){ return (b.textContent || '').trim(); }),
      current: cur ? (cur.textContent || '').trim() : '',
      navSegments: document.querySelectorAll('[data-screen-nav] [data-class-screen]').length,
      classTabs: document.querySelectorAll('#classTabBar [data-class-tab]').length,
      homeDoor: !!document.querySelector('#classTabBar [data-view-home]'),
      caption: (document.querySelector('#classTabBar .hdr-empty') || {}).textContent || '',
      heading: (document.getElementById('calendarRange') || {}).textContent || '',
      cells: document.querySelectorAll('#calendarGrid .calendar-day').length,
      heads: document.querySelectorAll('#calendarGrid th.calendar-dow').length }; })()`);
  const arrivedModel = await model();
  /*
    THIS CHECK IS INVERTED AND NOT DELETED (WO-6.6, 2026-08-19).

    It asserted the opposite in as many words until that day — *the calendar is the sixth VIEW and
    belongs to no class … which is what not being a `CLASS_SCREENS` entry looks like* — with a
    comment saying that a build which added it to that list fails here. That build is this one, and
    the owner's ruling of 2026-08-19 is the reason: the calendar was built as a destination and wired
    as a cul-de-sac, taking over the header's whole left-hand strip and handing back one button
    inside a panel header. So the same three things are read and the expected answers are the
    opposite ones, which is what keeps the check honest in both directions — a build that reverts to
    no tabs and no strip goes red here rather than quietly passing a check nobody rewrote.

    STILL ASSERTED AS THE THING A TEACHER WOULD SEE rather than by asking src/views.js.
    `isClassScreen` is not on the seam and is not being put there for one reading: what BEING a class
    screen means on the glass is that src/classes.js draws the class tabs and the *All classes* door
    over this view and src/screen-nav.js draws five segments inside it with Calendar current. The
    caption that used to sit in that strip — `Calendar`, out of a two-entry lookup in src/classes.js
    — has to be gone with it, so it is read and required to be empty.

    AND THE LENS IS EVERY CLASS, BECAUSE OF THE DOOR THIS WALK CAME THROUGH. That is the other half
    of the same ruling (the pill inside a class arrives filtered to it), and it is read off the
    screen's own model rather than off a button's class list.
  */
  check('the calendar is the sixth VIEW and one of the open class’s SCREENS: the home screen’s own '
    + 'button puts it in <main>, the header draws the class tabs and the All classes door over it, '
    + 'the switcher inside it shows five segments with Calendar current, the Calendar caption is '
    + 'gone from the strip — and arriving from OUTSIDE a class opens on every class showing',
    arrived.view === 'calendarView'
      && arrived.segments === 5 && arrived.current === 'Calendar'
      && arrived.labels.join(' · ') === 'Attendance · Assignments · Scores · Calendar · Signals'
      && arrived.classTabs >= 2 && arrived.homeDoor === true && arrived.caption === ''
      && arrivedModel.classId === ''
      && arrived.heads === 7 && arrived.cells >= 28,
    'view=' + arrived.view + ' switcher segments inside it=' + arrived.segments
      + ' (anywhere on the page=' + arrived.navSegments + ') reading '
      + JSON.stringify(arrived.labels) + ' with ' + JSON.stringify(arrived.current)
      + ' current; class tabs=' + arrived.classTabs + ', way home in the strip='
      + arrived.homeDoor + ', caption=' + JSON.stringify(arrived.caption)
      + ', filter=' + JSON.stringify(arrivedModel.classId)
      + '; weekday heads=' + arrived.heads + ' day cells=' + arrived.cells
      + ' heading=' + JSON.stringify(arrived.heading));

  const reachedMonth = await pageToMonth(MONTH_FROM);

  /* ── one month, every row of the table, on the day it belongs to ──
     Read out of the DOM rather than out of the model, deliberately: the model is asserted on its
     own further down, and a grid that decided correctly and drew nothing is the failure a
     model-only check cannot see. The chips are collected per date with their palette class, which
     is the pair a teacher reads. */
  const painted = async () => await evalJs(`(function(){
    var out = {};
    Array.prototype.forEach.call(document.querySelectorAll('#calendarGrid .calendar-day'),
      function(cell){
        var chips = cell.querySelectorAll('.calendar-chip');
        if (!chips.length) return;
        var date = '';
        Array.prototype.forEach.call(chips, function(c){ date = c.getAttribute('data-calendar-date'); });
        out[date] = Array.prototype.map.call(chips, function(c){
          return c.getAttribute('data-calendar-kind') + '|' + c.className.replace('calendar-chip ', '')
            + '|' + c.textContent; });
      });
    return { at: out, text: document.getElementById('calendarGrid').textContent,
      chips: document.querySelectorAll('#calendarGrid .calendar-chip').length,
      hint: !document.getElementById('calendarHint').classList.contains('hidden'),
      empty: !document.getElementById('calendarEmpty').classList.contains('hidden') }; })()`);
  const month = await painted();
  const kindsOn = (date) => (month.at[date] || []).map((s) => s.split('|')[0]).join(',');
  check('one month draws every row of the derived table and every authored event on the day it '
    + 'belongs to: the closure on both of its days, the term’s two edges, the assignment’s due '
    + 'date, the planned drop, the grades-due date and the review — each as a labelled <button>',
    reachedMonth === true
      && kindsOn(SHUT_FROM) === 'no-school' && kindsOn(SHUT_TO) === 'no-school'
      && kindsOn(T_START) === 'term-start' && kindsOn(T_END) === 'term-end'
      && kindsOn(DUE) === 'assignment-due' && kindsOn(DROP) === 'dropped'
      && kindsOn(GRADES_DUE) === 'grades-due' && kindsOn(REVIEW) === 'review-date'
      && kindsOn(BARE) === '',
    'reached ' + MONTH_FROM + ': ' + reachedMonth + '; ' + month.chips + ' chip(s) on the grid :: '
      + JSON.stringify(month.at));

  /* ── the wall that is not drawn, and the sentence that says so ──
     A month with every class showing draws no per-class meeting state — src/calendar-view.js
     argues the hundred green chips at length — and the hint under the grid is what keeps that
     absence from reading as a bug. The bare Wednesday is the other half: nothing was recorded on
     it and nothing is drawn, which is CLAUDE.md's rule rather than this screen's choice. */
  check('with every class showing, a MONTH draws no per-class meeting state at all and says so in '
    + 'words under the grid — and the weekday nobody wrote anything down about is empty, which is '
    + 'the schedule model not being reinvented from the rendering side',
    month.hint === true && kindsOn(MET) === '' && kindsOn(BARE) === ''
      && month.text.indexOf('Taken') === -1 && month.text.indexOf('Not taken') === -1,
    'the hint is up: ' + month.hint + '; ' + MET + ' draws ' + JSON.stringify(kindsOn(MET))
      + ' and ' + BARE + ' draws ' + JSON.stringify(kindsOn(BARE))
      + '; the word "Taken" appears in the grid: ' + (month.text.indexOf('Taken') !== -1));

  /* ── the class filter, over BOTH sources ──
     Three readings of one month. Everything, then this class, then the other one — and the counts
     are per kind, because a build that filtered the authored events and forgot the derived rows
     draws a month that looks entirely plausible. The school-wide closure and the school-wide
     grades-due survive every filter, which is docs/data-model.md's own rule about `classIds: []`
     and is asserted rather than assumed. */
  await clickSel('#calendarClasses [data-calendar-filter="' + CLS + '"]');
  const mine = await painted();
  await clickSel('#calendarClasses [data-calendar-filter="' + OTHER + '"]');
  const theirs = await painted();
  await clickSel('#calendarClasses [data-calendar-filter=""]');
  const kindsIn = (snap, date) => (snap.at[date] || []).map((s) => s.split('|')[0]).join(',');
  check('the class filter applies to DERIVED items as well as authored ones: filtered to this '
    + 'class the due date, both term edges and the meeting states are there and filtered to the '
    + 'other class none of them is — while the school-wide closure and grades-due date, which name '
    + 'no class, survive both',
    kindsIn(mine, DUE) === 'assignment-due' && kindsIn(mine, T_START) === 'term-start'
      && kindsIn(mine, T_END) === 'term-end' && kindsIn(mine, MET) === 'meeting-state'
      && kindsIn(mine, DROP).indexOf('meeting-state') !== -1
      && kindsIn(theirs, DUE) === '' && kindsIn(theirs, T_START) === ''
      && kindsIn(theirs, T_END) === '' && kindsIn(theirs, MET) === ''
      && kindsIn(mine, SHUT_FROM) === 'no-school' && kindsIn(theirs, SHUT_FROM) === 'no-school'
      && kindsIn(mine, GRADES_DUE) === 'grades-due' && kindsIn(theirs, GRADES_DUE) === 'grades-due',
    'filtered to this class: ' + JSON.stringify(mine.at) + ' :: filtered to the other class: '
      + JSON.stringify(theirs.at));

  /* ── and a review follows its student through it ──
     src/calendar-derived.js declined to answer this on the screen's behalf and said so; WO-6.3's
     decision is that a review belongs to the class its student is on the roster of. Asserted in
     both directions, because "it is always shown" and "it is never shown" each satisfy one half. */
  check('a review date follows its student through the class filter — shown for the class whose '
    + 'roster that student is on, and gone for the class they are not in, which is the decision '
    + 'src/calendar-derived.js left to this screen',
    kindsIn(mine, REVIEW) === 'review-date' && kindsIn(theirs, REVIEW) === ''
      && kindsOn(REVIEW) === 'review-date',
    'with this class: ' + JSON.stringify(kindsIn(mine, REVIEW)) + '; with the other: '
      + JSON.stringify(kindsIn(theirs, REVIEW)) + '; unfiltered: '
      + JSON.stringify(kindsOn(REVIEW)));

  /* ── a review on a cell is a date and a name and NOTHING else ──
     The rendered grid is searched — its text, and its markup, because an attribute is not text —
     for each of the five things that share a student record with `reviewDate`. WO-6.2 made this
     claim about the model; this makes it about the pixels, and the two are not redundant: a screen
     that put the plan type in a `title` would pass over there and fail here. */
  const chipText = await evalJs(`(function(){
    var chip = document.querySelector('#calendarGrid .calendar-chip.review');
    var grid = document.getElementById('calendarGrid');
    return { present: !!chip, text: chip ? chip.textContent : '',
      label: chip ? chip.getAttribute('aria-label') : '', title: chip ? chip.title : '',
      ref: chip ? chip.getAttribute('data-calendar-ref') : '',
      hits: ${JSON.stringify(SENSITIVE)}.filter(function(p){
        return grid.textContent.indexOf(p) !== -1 || grid.innerHTML.indexOf(p) !== -1; }),
      chars: grid.innerHTML.length }; })()`);
  check('a review date on a month cell says the word, the student’s name and its date, and NOTHING '
    + 'else: no plan type, no accommodation, no medical text, no behavior-plan text and no case '
    + 'manager anywhere in the grid’s text OR its markup, though all five are on that record',
    chipText.present === true
      && chipText.text.indexOf(GIVEN) !== -1 && chipText.text.indexOf(SURNAME) !== -1
      && chipText.text.indexOf('Review') !== -1
      && chipText.label.indexOf('Apr 13') !== -1
      && chipText.ref === STU && chipText.hits.length === 0,
    'the chip reads ' + JSON.stringify(chipText.text) + ', labelled '
      + JSON.stringify(chipText.label) + ', pointing at ' + JSON.stringify(chipText.ref)
      + '; a search of the ' + chipText.chars + '-character grid for ' + JSON.stringify(SENSITIVE)
      + ' found ' + JSON.stringify(chipText.hits));

  /* ── and it is GONE with the projector on ──
     Not blanked, not an unlabelled marker: no element, and the student's name and the date nowhere
     in the grid at all. Flipped through the header's real control, and read back through
     presentationMode() rather than from the value written — src/presentation.js's own rule, because
     a refused localStorage write must not leave this check believing it measured the mode. */
  const wasMode = await evalJs('window.planbook.supports.presentationMode()');
  if (wasMode !== true) await clickSel('[data-presentation-toggle]');
  await new Promise(r => setTimeout(r, 200));
  const projected = await evalJs(`(function(){
    var grid = document.getElementById('calendarGrid');
    return { on: window.planbook.supports.presentationMode(),
      reviews: document.querySelectorAll('#calendarGrid .calendar-chip.review').length,
      others: document.querySelectorAll('#calendarGrid .calendar-chip').length,
      name: grid.innerHTML.indexOf('${SURNAME}') !== -1,
      date: grid.innerHTML.indexOf('${REVIEW}') !== -1,
      token: grid.innerHTML.indexOf('review-date') !== -1 }; })()`);
  if ((await evalJs('window.planbook.supports.presentationMode()')) !== wasMode) {
    await clickSel('[data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 200));
  }
  const restored = await evalJs(`(function(){
    return { mode: window.planbook.supports.presentationMode(),
      reviews: document.querySelectorAll('#calendarGrid .calendar-chip.review').length }; })()`);
  check('in presentation mode the review is GONE from the cell rather than redacted — no element, '
    + 'the token "review-date" nowhere in the grid’s markup, and neither the student’s surname nor '
    + 'the date itself anywhere in it — while every other chip on the month is untouched',
    projected.on === true && projected.reviews === 0 && projected.token === false
      && projected.name === false && projected.date === false
      && projected.others === month.chips - 1
      && restored.mode === wasMode && restored.reviews === 1,
    'with the mode on: ' + projected.reviews + ' review chip(s), the token present '
      + projected.token + ', the surname present ' + projected.name + ', the date present '
      + projected.date + ', ' + projected.others + ' other chip(s) (the month has '
      + month.chips + ' altogether); with it back: ' + restored.reviews
      + ' review chip(s), mode = ' + restored.mode);

  /* ── the week, where the meeting ledger IS drawn ──
     The other half of the rule the month check above asserts. One tap to the week and one to the
     week that holds the recorded meeting: with every class still showing, the class's own day is
     on the cell, wearing src/attendance.js's own sentence and the marking screen's own palette. */
  await clickSel('#calendarView [data-calendar-scale="week"]');
  await clickSel('#calendarView [data-calendar-page="later"]');
  const week = await painted();
  const weekModel = await model();
  check('the WEEK view draws the per-class meeting ledger with every class showing — the recorded '
    + 'meeting wears the taken palette and the class’s name, the planned drop wears the covered '
    + 'one, and the hint that explains the month’s silence is down',
    weekModel.scale === 'week' && weekModel.from <= MET && weekModel.to >= MET
      && kindsIn(week, MET).indexOf('meeting-state') !== -1
      && (week.at[MET] || []).join(' ').indexOf('state-taken') !== -1
      && (week.at[MET] || []).join(' ').indexOf('WO-6.3 Grid') !== -1
      && week.hint === false && kindsIn(week, BARE) === '',
    'the week runs ' + weekModel.from + '..' + weekModel.to + '; ' + MET + ' draws '
      + JSON.stringify(week.at[MET]) + '; ' + BARE + ' draws '
      + JSON.stringify(week.at[BARE] || []) + '; the hint is up: ' + week.hint);

  /* ── the 44px departure, asserted as a departure ──
     Three readings under a really coarse pointer, and the middle one is the whole point: it
     asserts the month chip is AT its documented floor and UNDER 44, so that a silent drift down and
     a silent "fix" up both go red. None of the three closes the 👤 line; a thumb is what settles
     whether the trade is right. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await new Promise(r => setTimeout(r, 300));
  const reallyCoarse = await evalJs("matchMedia('(pointer: coarse)').matches");
  const weekChips = await evalJs(`(function(){
    return Array.prototype.map.call(
      document.querySelectorAll('#calendarGrid .calendar-chip'), function(c){
        var r = c.getBoundingClientRect();
        return { h: Math.round(r.height * 100) / 100, w: Math.round(r.width * 100) / 100 }; }); })()`);
  check('every chip in the WEEK view clears 44px under a coarse pointer — the half of the trade '
    + 'that pays for the month’s, and the reason every item on this screen has a thumb-sized path '
    + 'to it',
    reallyCoarse === true && week.chips >= 2 && weekChips.length === week.chips
      && weekChips.every((c) => c.h >= 44),
    'coarse = ' + reallyCoarse + '; ' + weekChips.length + ' week chip(s) measured against the '
      + week.chips + ' the week drew, heights ' + JSON.stringify(weekChips.map((c) => c.h)));

  await clickSel('#calendarView [data-calendar-scale="month"]');
  await pageToMonth(MONTH_FROM);
  const monthChips = await evalJs(`(function(){
    return Array.prototype.map.call(
      document.querySelectorAll('#calendarGrid .calendar-chip'), function(c){
        var r = c.getBoundingClientRect();
        return { h: Math.round(r.height * 100) / 100 }; }); })()`);
  check('and every chip in the MONTH view sits at its documented 28px floor and BELOW 44 — the '
    + 'departure src/calendar-view.css writes out at the point of departure, asserted AS a '
    + 'departure so that a silent drift down and a silent "fix" up both turn this red (👤 owed)',
    reallyCoarse === true && monthChips.length >= 5
      && monthChips.every((c) => c.h >= 28) && monthChips.some((c) => c.h < 44),
    monthChips.length + ' month chip(s), heights ' + JSON.stringify(monthChips.map((c) => c.h)));

  const toolbar = await evalJs(`(function(){
    var sel = '#calendarView .calendar-toolbar button, #calendarView .panel-title-actions button';
    return Array.prototype.map.call(document.querySelectorAll(sel), function(e){
      var r = e.getBoundingClientRect();
      return { t: (e.getAttribute('data-calendar-scale') || e.getAttribute('data-calendar-page')
          || e.getAttribute('data-calendar-filter') || e.tagName),
        h: Math.round(r.height * 100) / 100, w: Math.round(r.width * 100) / 100 }; }); })()`);
  const shortOnes = toolbar.filter((c) => c.h < 44 || c.w < 44);
  check('every control this screen adds that is NOT a chip — the span pair, the pager, the class '
    + 'filter, Print and the way back — clears 44px in both directions under a coarse pointer',
    reallyCoarse === true && toolbar.length >= 8 && shortOnes.length === 0,
    toolbar.length + ' control(s) measured; under 44 = ' + JSON.stringify(shortOnes));

  /* ── and no horizontal scrolling at phone width, which is what `table-layout: fixed` is for ── */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await new Promise(r => setTimeout(r, 300));
  const narrow = await evalJs(`(function(){
    var d = document.documentElement, g = document.getElementById('calendarGrid');
    return { docScroll: d.scrollWidth, docClient: d.clientWidth,
      gridScroll: g.scrollWidth, gridClient: g.clientWidth,
      cells: document.querySelectorAll('#calendarGrid .calendar-day').length }; })()`);
  check('a month full of events does not scroll sideways at 390px — the whole of what '
    + '`table-layout: fixed` buys, and the one thing WO-6.3’s first acceptance line forbids by name',
    narrow.docScroll <= narrow.docClient + 1 && narrow.gridScroll <= narrow.gridClient + 1
      && narrow.cells >= 28,
    'document ' + narrow.docScroll + ' wide in ' + narrow.docClient + '; grid '
      + narrow.gridScroll + ' in ' + narrow.gridClient + '; ' + narrow.cells + ' cell(s)');

  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));

  /* ── nothing on that printed page carries a support value ──
     Read under an emulated print media three ways. With the gate ON is the printout a teacher
     actually takes; with the gate OFF is the one ungated rule in that stylesheet, which exists for
     a print that reached the printer without `beforeprint` firing; and ON SCREEN is the guard
     against a vacuous pass — a chip that was never there proves nothing about a chip being hidden.
     A non-review chip is measured beside it every time, so "everything is hidden" cannot pass. */
  const sheet = await evalJs(`(function(){
    var out = {};
    var review = function(){ return document.querySelector('#calendarGrid .calendar-chip.review'); };
    var other = function(){ return document.querySelector('#calendarGrid .calendar-chip.due'); };
    var read = function(){ var r = review(), o = other();
      return { review: r ? getComputedStyle(r).display : 'no chip',
        other: o ? getComputedStyle(o).display : 'no chip' }; };
    out.atRest = document.body.hasAttribute('data-calendar-print');
    out.screen = read();
    return out; })()`);
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await new Promise(r => setTimeout(r, 150));
  const ungated = await evalJs(`(function(){
    var r = document.querySelector('#calendarGrid .calendar-chip.review');
    var o = document.querySelector('#calendarGrid .calendar-chip.due');
    return { gate: document.body.hasAttribute('data-calendar-print'),
      review: r ? getComputedStyle(r).display : 'no chip',
      other: o ? getComputedStyle(o).display : 'no chip' }; })()`);
  const gated = await evalJs(`(function(){
    document.body.setAttribute('data-calendar-print', '1');
    var r = document.querySelector('#calendarGrid .calendar-chip.review');
    var o = document.querySelector('#calendarGrid .calendar-chip.due');
    var v = document.getElementById('calendarView');
    var stamp = document.getElementById('calendarPrintStamp');
    var out = { review: r ? getComputedStyle(r).display : 'no chip',
      other: o ? getComputedStyle(o).display : 'no chip',
      view: getComputedStyle(v).display,
      stamp: getComputedStyle(stamp).display,
      toolbar: getComputedStyle(document.querySelector('#calendarView .calendar-toolbar')).display };
    document.body.removeAttribute('data-calendar-print');
    return out; })()`);
  await send('Emulation.setEmulatedMedia', { media: '' });
  await new Promise(r => setTimeout(r, 150));
  check('no printout of a calendar month emits a review date, whatever presentation mode says: '
    + 'with the gate on the review chip computes to display:none while the due-date chip beside it '
    + 'is still drawn, the sheet keeps its own stamp and loses its toolbar — and with the gate OFF '
    + 'the review chip is still gone, which is the one ungated rule in that stylesheet',
    sheet.atRest === false && sheet.screen.review !== 'none' && sheet.screen.other !== 'none'
      && gated.review === 'none' && gated.other !== 'none'
      && gated.view === 'block' && gated.stamp === 'block' && gated.toolbar === 'none'
      && ungated.gate === false && ungated.review === 'none',
    'on screen: ' + JSON.stringify(sheet.screen) + ' (gate on <body> at rest: ' + sheet.atRest
      + '); print media with the gate: ' + JSON.stringify(gated)
      + '; print media without it: ' + JSON.stringify(ungated));

  /* ── a derived due date moves with its assignment, with no other action ──
     The date is changed on the ASSIGNMENT — through the store, which is what the editor writes
     through — and the only thing that happens next is the repaint src/shell.js chains. Nothing
     invalidates a cache, because there is no cache: the grid re-reads `assignments[].due` every
     time it is drawn. Both directions, so a build that moved it and lost it fails too. */
  await pageToMonth(MONTH_FROM);
  const before = await painted();
  /* The date is changed on the ASSIGNMENT and nothing else happens: no repaint is called from here,
     no cache is invalidated because there is none, and the grid is simply left and opened again the
     way a teacher would. That is what "with no other action" is worth asserting as — a check that
     called renderCalendar() itself would be proving the renderer runs rather than that the month is
     recomputed from `assignments[].due` every time it is drawn. */
  await evalJs(`(function(){ window.planbook.store.update(function(d){
    (d.assignments || []).forEach(function(a){ if (a.id === '${ASG}') a.due = '${DUE_MOVED}'; }); });
    return 1; })()`);
  await goHome();
  await clickSel('#homeView [data-calendar-open]');
  await pageToMonth(MONTH_FROM);
  const after = await painted();
  await evalJs(`(function(){ window.planbook.store.update(function(d){
    (d.assignments || []).forEach(function(a){ if (a.id === '${ASG}') a.due = '${DUE}'; }); });
    return 1; })()`);
  await goHome();
  await clickSel('#homeView [data-calendar-open]');
  await pageToMonth(MONTH_FROM);
  const backAgain = await painted();
  check('a derived due date moves with its assignment: change the date on the assignment and the '
    + 'month grid draws it on the new day and no longer on the old one, with no other action — and '
    + 'moving it back moves the chip back, so this is a re-read rather than an append',
    kindsIn(before, DUE) === 'assignment-due' && kindsIn(before, DUE_MOVED) === ''
      && kindsIn(after, DUE) === '' && kindsIn(after, DUE_MOVED) === 'assignment-due'
      && kindsIn(backAgain, DUE) === 'assignment-due' && kindsIn(backAgain, DUE_MOVED) === ''
      && after.chips === before.chips,
    'before: ' + DUE + '=' + JSON.stringify(kindsIn(before, DUE)) + ' ' + DUE_MOVED + '='
      + JSON.stringify(kindsIn(before, DUE_MOVED)) + '; after: ' + DUE + '='
      + JSON.stringify(kindsIn(after, DUE)) + ' ' + DUE_MOVED + '='
      + JSON.stringify(kindsIn(after, DUE_MOVED)) + '; back: ' + DUE + '='
      + JSON.stringify(kindsIn(backAgain, DUE)) + '; chip count ' + before.chips + ' -> '
      + after.chips + ' -> ' + backAgain.chips);

  /* ── every item taps through to its source: the four that open a dialog ──
     One click each, the dialog read back, and the dialog closed before the next. The last of them
     is the sensitive one — a review chip opens that student's own editor with the support panel
     already showing, which is `data-supports-open`'s route and the same judgement WO-1.8 made about
     the roster dot: the tap IS the deliberate one. */
  const tapTo = async (date, nth) => {
    await clickSel('#calendarGrid .calendar-day .calendar-chip[data-calendar-date="' + date + '"]',
      nth || 0);
    await new Promise(r => setTimeout(r, 200));
    return await evalJs(`(function(){
      var open = document.querySelector('.modal-overlay:not(.hidden)');
      return { modal: open ? open.id : '',
        view: (function(){ var e=document.querySelector('main > :not(.hidden)');
          return e ? e.id : ''; })(),
        eventTitle: (document.getElementById('eventTitle') || {}).value || '',
        student: (document.getElementById('studentModalTitle') || {}).textContent || '',
        review: (document.getElementById('supportsReviewDate') || {}).value || '',
        supportsOpen: (document.getElementById('supportsRevealBtn') || {})
          .getAttribute ? document.getElementById('supportsRevealBtn').getAttribute('aria-expanded') : '',
        assignment: (document.querySelector('#assignmentModal [data-assignment-field="name"]')
          || {}).value || '',
        assignmentId: (document.querySelector('#assignmentModal [data-assignment-id]') || {})
          .getAttribute ? document.querySelector('#assignmentModal [data-assignment-id]')
            .getAttribute('data-assignment-id') : '' }; })()`);
  };
  const toDayOff = await tapTo(SHUT_FROM); await closeAnyModal();
  const toEvent = await tapTo(GRADES_DUE); await closeAnyModal();
  const toTerm = await tapTo(T_START); await closeAnyModal();
  const toReview = await tapTo(REVIEW); await closeAnyModal();
  check('the four items whose source is a dialog tap through to it: a school closure opens the '
    + 'days-off panel, a grades-due date opens the events panel WITH THAT ROW LOADED into its form, '
    + 'a term edge opens that class’s term editor, and a review opens that student’s own editor '
    + 'with the support panel already showing and the date in it',
    toDayOff.modal === 'daysOffModal'
      && toEvent.modal === 'eventsModal' && toEvent.eventTitle === 'WO-6.3 grades due'
      && toTerm.modal === 'termsModal'
      && toReview.modal === 'studentModal' && toReview.review === REVIEW
      && toReview.supportsOpen === 'true'
      && toReview.student.indexOf(SURNAME) !== -1,
    'closure -> ' + toDayOff.modal + '; grades due -> ' + toEvent.modal + ' holding '
      + JSON.stringify(toEvent.eventTitle) + '; term edge -> ' + toTerm.modal
      + '; review -> ' + toReview.modal + ' for ' + JSON.stringify(toReview.student)
      + ' with the support panel expanded=' + toReview.supportsOpen + ' and the date '
      + JSON.stringify(toReview.review));

  /* ── and the two that navigate ──
     An assignment's due date lands on that class's assignment LIST with the assignment open, which
     is where the due date is a field; a class's own day lands on that class's registry, which is
     the ledger the chip is a fact about. Both change which class is open, so the class this block
     found is put back at the end. */
  await goHome();
  await clickSel('#homeView [data-calendar-open]');
  await pageToMonth(MONTH_FROM);
  const toAssignment = await tapTo(DUE);
  await closeAnyModal();
  const afterAssignment = await evalJs(`(function(){
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      openClass: window.planbook.classes.getSelectedClassId() }; })()`);
  await goHome();
  await clickSel('#homeView [data-calendar-open]');
  await pageToMonth(MONTH_FROM);
  await clickSel('#calendarClasses [data-calendar-filter="' + CLS + '"]');
  const toRegistry = await tapTo(MET);
  const afterRegistry = await evalJs(`(function(){
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      openClass: window.planbook.classes.getSelectedClassId(),
      heading: (document.getElementById('attendanceClassName') || {}).textContent || '' }; })()`);
  check('and the two whose source is a screen navigate to it: an assignment’s due date opens that '
    + 'class’s assignment list with the assignment’s own editor up, and a class’s recorded day '
    + 'opens that class’s registry — both of them making it the open class on the way',
    toAssignment.modal === 'assignmentModal' && toAssignment.assignment === 'WO-6.3 Quiz'
      && toAssignment.assignmentId === ASG
      && afterAssignment.view === 'assignmentsView' && afterAssignment.openClass === CLS
      && afterRegistry.view === 'classView' && afterRegistry.openClass === CLS
      && afterRegistry.heading.indexOf('WO-6.3 Grid') !== -1,
    'due date -> ' + afterAssignment.view + ' with ' + toAssignment.modal + ' holding '
      + JSON.stringify(toAssignment.assignment) + ', open class ' + afterAssignment.openClass
      + '; recorded day -> ' + afterRegistry.view + ' headed '
      + JSON.stringify(afterRegistry.heading) + ', open class ' + afterRegistry.openClass);

  /* ── a month with nothing in it says so ──
     Paged four months past the fixture, through the real control. The grid STAYS UP behind the
     message — a teacher who opened a calendar wants the dates whether or not anything is on them —
     and the lead line names the month, because "nothing here" without a month in it is a sentence
     that could be about any month. The unfiltered count is printed beside it: if an earlier section
     has left something in August 2027, this check should say so rather than look past it. */
  await goHome();
  await clickSel('#homeView [data-calendar-open]');
  const reachedEmpty = await pageToMonth(EMPTY_FROM);
  const emptyModel = await model();
  const emptyPaint = await evalJs(`(function(){
    return { empty: !document.getElementById('calendarEmpty').classList.contains('hidden'),
      lead: (document.getElementById('calendarEmptyLead') || {}).textContent || '',
      chips: document.querySelectorAll('#calendarGrid .calendar-chip').length,
      cells: document.querySelectorAll('#calendarGrid .calendar-day').length,
      doors: document.querySelectorAll('#calendarEmpty [data-dayoff-panel], '
        + '#calendarEmpty [data-events-panel]').length }; })()`);
  check('a month with nothing in it shows an honest empty state: the grid stays up with its cells '
    + 'drawn, the message names the month it is about, and it leads somewhere — the two panels that '
    + 'author what this grid draws',
    reachedEmpty === true && emptyModel.count === 0 && emptyPaint.empty === true
      && emptyPaint.chips === 0 && emptyPaint.cells >= 28 && emptyPaint.doors === 2
      && emptyPaint.lead.indexOf('August 2027') !== -1,
    'reached ' + EMPTY_FROM + ': ' + reachedEmpty + '; the model counts ' + emptyModel.count
      + ' item(s) in range, the grid drew ' + emptyPaint.chips + ' chip(s) over '
      + emptyPaint.cells + ' cell(s); the message reads ' + JSON.stringify(emptyPaint.lead)
      + ' with ' + emptyPaint.doors + ' door(s)');

  /* And the other direction, because "the empty state is always up" satisfies half of the check
     above. Back on the fixture month, the message is down and the grid is not. */
  const reachedBack = await pageToMonth(MONTH_FROM);
  const notEmpty = await evalJs(`(function(){
    return { empty: !document.getElementById('calendarEmpty').classList.contains('hidden'),
      chips: document.querySelectorAll('#calendarGrid .calendar-chip').length }; })()`);
  check('and a month with something in it does not: the empty state comes down again on the '
    + 'fixture month, which is what stops the check above passing on a build that always shows it',
    reachedBack === true && notEmpty.empty === false && notEmpty.chips >= 7,
    'back on ' + MONTH_FROM + ': ' + reachedBack + '; the empty state is up: ' + notEmpty.empty
      + ' over ' + notEmpty.chips + ' chip(s)');

  /*
    ══════════ WO-6.6: THE DOORS — in from every class screen, out of it to any of them ══════════

    Measured inside this section rather than in one of its own, because everything it asks about
    needs two classes, a roster and a recorded meeting, and that fixture is already standing here.
    What only a browser can settle: which strip is on screen, what a tap on a header tab does while
    the calendar is up, and whether five segments fit a control that WRAPS (WO-4.2 took the
    `overflow-x: auto` off it with the scroll it allowed) rather than one that will
    therefore SCROLL rather than overflow when they do not.
  */

  /* ── in through the fourth pill, from inside a class ──
     The other door. It is walked the way a teacher walks it — home, a card, then the segment on the
     strip inside the class screen she landed on — and the claim is the owner's ruling of 2026-08-19:
     the Calendar pill inside Period 3 opens on Period 3's month. */
  await goHome();
  await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
  await new Promise(r => setTimeout(r, 200));
  const pillOnClass = await evalJs(`(function(){
    var strip = document.querySelectorAll('#classView [data-screen-nav] button');
    var seg = document.querySelector('#classView [data-class-screen="calendar"]');
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      labels: Array.prototype.map.call(strip, function(b){ return (b.textContent || '').trim(); }),
      live: !!seg && !seg.disabled }; })()`);
  await clickSel('#classView [data-class-screen="calendar"]');
  await new Promise(r => setTimeout(r, 250));
  const fromPill = await model();
  const fromPillView = await onView();
  const openViewPref = await evalJs("window.planbook.getPref('openView')");
  check('the same strip on Attendance shows Calendar as a live segment, and tapping it opens the '
    + 'month on TODAY, on the month, filtered to THAT CLASS — the door decides the lens (WO-6.6)',
    pillOnClass.view === 'classView' && pillOnClass.live === true
      && pillOnClass.labels.join(' · ') === 'Attendance · Assignments · Scores · Calendar · Signals'
      && fromPillView === 'calendarView' && fromPill.classId === CLS
      && fromPill.scale === 'month'
      && fromPill.from <= (await evalJs('window.planbook.attendance.todayISO()'))
      && fromPill.to >= (await evalJs('window.planbook.attendance.todayISO()')),
    'the strip on Attendance reads ' + JSON.stringify(pillOnClass.labels) + ' (Calendar live='
      + pillOnClass.live + '); the pill landed on ' + fromPillView + ' showing '
      + fromPill.from + '..' + fromPill.to + ' at scale ' + fromPill.scale + ' filtered to '
      + JSON.stringify(fromPill.classId));

  /* ── and the preference it wrote down is `class`, not `calendar` ──
     src/views.js's REMEMBERED_AS, asserted where it can be: a reload is what would reveal it, and
     what a reload reads is this key. `planbook_openView` holding `calendar` is a browser that
     reopens onto a month with no door behind it to say which class or which lens it should be. */
  check('standing on the calendar, `planbook_openView` holds `class` and never `calendar` — so a '
    + 'reload lands on Attendance for the open class, which is the owner’s rule surviving a screen '
    + 'that is ABOUT a class rather than of one',
    openViewPref === 'class',
    'the preference reads ' + JSON.stringify(openViewPref) + ' while #calendarView is up');

  /* ── the per-class ledger the month suppresses when every class is showing ──
     Paged to the fixture month WITHOUT touching the filter, so what is drawn is the arrival's own
     lens. The hint under the grid is the other half of the pair: it explains the month's silence and
     must be DOWN here, where the month is about one class, and it was up on the unfiltered arrival
     forty checks above. */
  await pageToMonth(MONTH_FROM);
  const pillMonth = await painted();
  check('arriving through the pill draws that class’s own meeting ledger on the month — the '
    + 'per-class state a month suppresses with every class showing — and the hint that explains '
    + 'that silence is down, because this month is about one class',
    kindsIn(pillMonth, MET).indexOf('meeting-state') !== -1
      && (pillMonth.at[MET] || []).join(' ').indexOf('state-taken') !== -1
      && pillMonth.hint === false && kindsIn(pillMonth, BARE) === '',
    MET + ' draws ' + JSON.stringify(pillMonth.at[MET]) + '; the hint is up: ' + pillMonth.hint
      + '; the bare weekday draws ' + JSON.stringify(kindsIn(pillMonth, BARE)));

  /* ── a header tab moves the lens, not the screen ──
     The tap that used to land on Attendance. Two answers are read back, because the whole ruling is
     that they are two questions: the header tab says which class you are IN (and `openClassId` moves
     with it), the toolbar filter says what the grid is ABOUT. */
  await clickSel('#classTabBar [data-class-tab="' + OTHER + '"]');
  await new Promise(r => setTimeout(r, 250));
  const afterTab = await evalJs(`(function(){
    var cur = document.querySelector('#classTabBar [data-class-tab][aria-current="true"]');
    var filter = document.querySelector('#calendarClasses [data-calendar-filter].active');
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      open: window.planbook.classes.getSelectedClassId(),
      tab: cur ? cur.getAttribute('data-class-tab') : '',
      filterBtn: filter ? filter.getAttribute('data-calendar-filter') : '' }; })()`);
  const afterTabModel = await model();
  check('tapping another class’s header tab while the calendar is up leaves the calendar up, moves '
    + 'the open class AND the grid’s filter to that class, and does not land on Attendance',
    afterTab.view === 'calendarView' && afterTab.open === OTHER && afterTab.tab === OTHER
      && afterTabModel.classId === OTHER && afterTab.filterBtn === OTHER,
    'the view is ' + afterTab.view + ', the open class is ' + afterTab.open + ', the current tab is '
      + afterTab.tab + ', the pressed filter is ' + afterTab.filterBtn + ' and the model is '
      + 'filtered to ' + JSON.stringify(afterTabModel.classId));

  /* ── two controls, two answers, neither one lying ──
     *All classes* in the toolbar is the one thing a tab row cannot say, which is why the filter
     strip keeps it. Pressing it must not move which class the teacher is in. */
  await clickSel('#calendarClasses [data-calendar-filter=""]');
  await new Promise(r => setTimeout(r, 250));
  const bothAnswers = await evalJs(`(function(){
    var cur = document.querySelector('#classTabBar [data-class-tab][aria-current="true"]');
    return { open: window.planbook.classes.getSelectedClassId(),
      tab: cur ? cur.getAttribute('data-class-tab') : '',
      view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })() }; })()`);
  const bothModel = await model();
  check('tapping All classes in the toolbar shows every class while the header tab of the class you '
    + 'are IN stays current — two controls, two answers, and the lens does not move the selection',
    bothModel.classId === '' && bothAnswers.open === OTHER && bothAnswers.tab === OTHER
      && bothAnswers.view === 'calendarView',
    'the filter reads ' + JSON.stringify(bothModel.classId) + ' while the open class is '
      + bothAnswers.open + ' and the current tab is ' + bothAnswers.tab);

  /* ── the two panels that author what this grid draws, opened from the grid ──
     The gap the owner reported: a teacher looking at a March that already has one thing on it could
     not add a second without leaving, because both doors were on the home screen and inside this
     screen's EMPTY state. Authored through the real form, and the grid behind the panel is read
     after the panel closes — no reload, no second tap. */
  await clickSel('#calendarView .panel-title-actions [data-dayoff-panel]');
  await new Promise(r => setTimeout(r, 250));
  const dayOffFromHere = await evalJs(
    "(function(){ var m = document.getElementById('daysOffModal');"
    + " return !!m && !m.classList.contains('hidden'); })()");
  await closeAnyModal();
  await clickSel('#calendarView .panel-title-actions [data-events-panel]');
  await new Promise(r => setTimeout(r, 250));
  const eventsFromHere = await evalJs(
    "(function(){ var m = document.getElementById('eventsModal');"
    + " return !!m && !m.classList.contains('hidden'); })()");
  await evalJs(`(function(){
    document.getElementById('eventTitle').value = 'WO-6.6 authored here';
    document.getElementById('eventFrom').value = '${GRADES_DUE}';
    document.getElementById('eventTo').value = '';
    return 1; })()`);
  await clickSel('#eventsModal [data-event-create] button[type="submit"]');
  await new Promise(r => setTimeout(r, 250));
  await closeAnyModal();
  await new Promise(r => setTimeout(r, 250));
  const behindThePanel = await evalJs(`(function(){
    var chips = document.querySelectorAll('#calendarGrid .calendar-chip');
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      here: Array.prototype.filter.call(chips, function(c){
        return (c.textContent || '').indexOf('WO-6.6 authored here') !== -1; }).length,
      on: (function(){
        var hit = Array.prototype.filter.call(chips, function(c){
          return (c.textContent || '').indexOf('WO-6.6 authored here') !== -1; })[0];
        return hit ? hit.getAttribute('data-calendar-date') : ''; })() }; })()`);
  const authoredHere = await evalJs(`(async function(){
    await window.planbook.store.flush();
    var d = window.planbook.store.getDoc();
    return (d.events || []).filter(function(e){
      return e.title === 'WO-6.6 authored here'; }).map(function(e){ return e.id; }); })()`);
  await evalJs(`(function(){ window.planbook.store.update(function(d){
    d.events = (d.events || []).filter(function(e){
      return e.title !== 'WO-6.6 authored here'; }); }); return 1; })()`);
  check('Days off and Events open from the calendar’s OWN panel header, and an event authored there '
    + 'is on the grid behind the panel the moment it closes — no reload and no second tap',
    dayOffFromHere === true && eventsFromHere === true
      && authoredHere.length === 1 && behindThePanel.view === 'calendarView'
      && behindThePanel.here === 1 && behindThePanel.on === GRADES_DUE,
    'the days-off panel opened from here: ' + dayOffFromHere + '; the events panel: '
      + eventsFromHere + '; ' + authoredHere.length + ' event(s) written, drawing '
      + behindThePanel.here + ' chip(s) on ' + JSON.stringify(behindThePanel.on)
      + ' with #' + behindThePanel.view + ' still up');

  /* ── the home screen keeps ONE door, and it is Calendar ──
     Read as markup rather than as rectangles, so it can be asked from this screen: what is being
     claimed is which controls are in that row at all. The two that were beside it author what this
     grid draws and are on this grid now, which is the whole of the ruling. */
  const homeRow = await evalJs(`(function(){
    var row = document.querySelector('#homeView .panel-title-actions');
    if (!row) return null;
    return { count: row.querySelectorAll('button').length,
      labels: Array.prototype.map.call(row.querySelectorAll('button'), function(b){
        return (b.textContent || '').trim(); }),
      dayoff: row.querySelectorAll('[data-dayoff-panel]').length,
      events: row.querySelectorAll('[data-events-panel]').length,
      calendar: row.querySelectorAll('[data-calendar-open]').length }; })()`);
  const homeAnywhere = await evalJs(
    "document.querySelectorAll('#homeView [data-dayoff-panel], #homeView [data-events-panel]').length");
  check('the home screen’s title row carries Calendar and nothing else beside it — the days-off and '
    + 'events doors are nowhere on that screen at all, in its header or anywhere else in it',
    !!homeRow && homeRow.count === 1 && homeRow.calendar === 1
      && homeRow.dayoff === 0 && homeRow.events === 0 && homeAnywhere === 0
      && homeRow.labels.join('').indexOf('Calendar') !== -1,
    homeRow ? homeRow.count + ' button(s) in that row: ' + JSON.stringify(homeRow.labels)
      + '; days-off doors anywhere in #homeView = ' + homeAnywhere : 'no title-actions row found');

  /* ── FIVE SEGMENTS, AND THE MEASUREMENT IS ROWS RATHER THAN A SCROLL (WO-4.2) ──
     THIS CHECK ASSERTED `scrollWidth <= clientWidth` OVER FOUR SEGMENTS AND IT HAD TO CHANGE, which
     is the one edit that work order names in the harness. The trap it was written for is WO-6.6's:
     `.screen-nav` was `overflow-x: auto`, so a pill that did not fit made the STRIP scroll —
     silently, with no page overflow at all, under a teacher who does not know that control scrolls,
     and the page-width check every other control here is measured by passes straight through it.

     Five does not fit one row at 390px and the owner ruled FIVE, WRAPPED (2026-08-20), so the strip
     wraps now and the scroll is gone with the `overflow-x` (src/assignments.css says so at the
     rule). Against a wrapped strip the old assertion is VACUOUS — a flex container that wraps has
     nothing to overflow horizontally, so it passes whatever the layout is doing — and this is the
     replacement rather than a loosening of it: the row count itself, TWO at 390px, plus every
     segment proved to sit inside its own strip, which is the claim `scrollWidth` was standing in
     for. A build that dropped the wrap fails on the rows AND on the segments hanging off the end; a
     build that shortened the labels to squeeze five into one row fails on the rows too, which is
     the alternative the owner refused by name.

     The 44px floor is asserted here too, and NOT at 28: the month chip's departure is the owner's
     ruling for one control and explicitly not a precedent (CLAUDE.md § Conventions). A new control
     gets the full 44 — and the fifth segment is a new control. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await new Promise(r => setTimeout(r, 400));
  const stripAt390 = await evalJs(`(function(){
    var strip = document.querySelector('#calendarView [data-screen-nav]');
    var d = document.documentElement;
    if (!strip) return null;
    var sr = strip.getBoundingClientRect();
    return { coarse: matchMedia('(pointer: coarse)').matches,
      docScroll: d.scrollWidth, docClient: d.clientWidth,
      stripLeft: Math.round(sr.left * 100) / 100, stripRight: Math.round(sr.right * 100) / 100,
      segs: Array.prototype.map.call(strip.querySelectorAll('button'), function(b){
        var r = b.getBoundingClientRect();
        return { t: (b.textContent || '').trim(), w: Math.round(r.width * 100) / 100,
                 h: Math.round(r.height * 100) / 100,
                 top: Math.round(r.top * 100) / 100,
                 left: Math.round(r.left * 100) / 100,
                 right: Math.round(r.right * 100) / 100 }; }) }; })()`);
  const shortSegs = stripAt390 ? stripAt390.segs.filter((s) => s.h < 44) : [];
  /* The row count IS the assertion. Distinct `top` offsets, rounded to the pixel so a sub-pixel
     baseline difference inside one row cannot read as two — a wrapped flex line moves a whole
     segment by its own height, which is never a rounding artifact. */
  const rows390 = stripAt390
    ? [...new Set(stripAt390.segs.map((s) => Math.round(s.top)))].sort((a, b) => a - b) : [];
  /* And every segment inside the strip's own box, which is the claim `scrollWidth` was standing in
     for and the one a wrapped container can no longer make on its own. */
  const outside390 = stripAt390 ? stripAt390.segs.filter((s) => s.left < stripAt390.stripLeft - 1
    || s.right > stripAt390.stripRight + 1) : [];
  check('the five-segment switcher WRAPS to two rows at 390px rather than scrolling inside itself, '
    + 'every segment sits within its own strip, and each clears 44px high under a coarse pointer — '
    + 'measured in ROWS because `.screen-nav` wraps now and a scrollWidth check is vacuous on it',
    !!stripAt390 && stripAt390.coarse === true && stripAt390.segs.length === 5
      && rows390.length === 2 && outside390.length === 0 && shortSegs.length === 0
      && stripAt390.docScroll <= stripAt390.docClient + 1,
    stripAt390 ? 'the strip spans ' + stripAt390.stripLeft + '–' + stripAt390.stripRight
      + ' (document ' + stripAt390.docScroll + ' in ' + stripAt390.docClient + '); '
      + rows390.length + ' row(s) at top offset(s) ' + JSON.stringify(rows390) + '; segments '
      + JSON.stringify(stripAt390.segs) + '; hanging outside the strip = '
      + JSON.stringify(outside390) + '; under 44 high = ' + JSON.stringify(shortSegs)
      : 'no [data-screen-nav] inside #calendarView');

  /* ── and the four buttons in its panel header, at the same width ──
     The "Days off" spill from the first iPad sitting, asked of the row that just gained two
     buttons: `.class-action-btn` is `white-space: nowrap`, so a shrunk one does not reflow, it
     spills through its own border, and the coarse block's `min-width: 44px` is what gives it
     permission to shrink. `.panel-title-actions` wraps, which is what pays for four. */
  const headerRow = await evalJs(`(function(){
    var row = document.querySelector('#calendarView .panel-title-actions');
    var d = document.documentElement;
    if (!row) return null;
    return { docScroll: d.scrollWidth, docClient: d.clientWidth,
      rows: Array.prototype.map.call(row.querySelectorAll('button'), function(b){
        var r = b.getBoundingClientRect();
        return { t: (b.textContent || '').trim(), over: b.scrollWidth - b.clientWidth,
                 w: Math.round(r.width), h: Math.round(r.height) }; }) }; })()`);
  const spilling = headerRow ? headerRow.rows.filter((b) => b.over > 0 || b.w < 44 || b.h < 44) : [];
  check('the calendar’s panel header carries four buttons at 390px — Days off · Events · Print · '
    + 'All classes — none of them narrower than its own label, none under 44px, and no horizontal '
    + 'page scroll: the wrapper wraps, which is why four in that row is a measurement',
    !!headerRow && headerRow.rows.length === 4 && spilling.length === 0
      && headerRow.docScroll <= headerRow.docClient + 1,
    headerRow ? headerRow.rows.map((b) => '"' + b.t + '" ' + b.w + 'x' + b.h + ' over by '
      + b.over + 'px').join(' · ') + '; document ' + headerRow.docScroll + ' in '
      + headerRow.docClient : 'no .panel-title-actions inside #calendarView');

  /* And the iPad's own portrait, which is the width the 👤 line is read at — the strip is the same
     control on a wider screen, so what this catches is a wrap or a squeeze that only 834px produces. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const stripAt834 = await evalJs(`(function(){
    var strip = document.querySelector('#calendarView [data-screen-nav]');
    var d = document.documentElement;
    if (!strip) return null;
    return { docScroll: d.scrollWidth, docClient: d.clientWidth,
      segs: strip.querySelectorAll('button').length,
      rows: [...new Set(Array.prototype.map.call(strip.querySelectorAll('button'), function(b){
        return Math.round(b.getBoundingClientRect().top); }))].length,
      short: Array.prototype.filter.call(strip.querySelectorAll('button'), function(b){
        return b.getBoundingClientRect().height < 44; }).length }; })()`);
  check('the same strip is ONE row at an iPad’s portrait width, five segments and none of them '
    + 'under 44px — the wrap is a phone answer and 834px is where it must NOT fire; the reading '
    + 'the 👤 line is owed at, taken here on an emulator that has no thumb (so it does not close it)',
    !!stripAt834 && stripAt834.segs === 5 && stripAt834.rows === 1 && stripAt834.short === 0
      && stripAt834.docScroll <= stripAt834.docClient + 1,
    stripAt834 ? 'the strip is ' + stripAt834.rows + ' row(s) over ' + stripAt834.segs
      + ' segment(s), ' + stripAt834.short + ' under 44 high; '
      + 'document ' + stripAt834.docScroll + ' in ' + stripAt834.docClient
      : 'no [data-screen-nav] inside #calendarView');

  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));

  /* ── AND A REAL RELOAD, FROM THIS SCREEN, because the preference read above is only half of it ──
     The check further up asserts what `planbook_openView` HOLDS while the calendar is on screen,
     which is the half a read-side fix cannot fake. This is the other half: the browser actually
     reloaded from here, landing on Attendance for the class that was open — src/shell.js's boot line
     restoring `class` for any class screen, met by a preference that cannot hold `calendar` at all
     (src/views.js's REMEMBERED_AS). Both are needed. A build that wrote `calendar` into the key and
     ALSO ignored it at boot would pass this one and fail that one, and the reverse build would pass
     that one and come back on a month with no door behind it. */
  await goHome();
  await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
  await clickSel('#classView [data-class-screen="calendar"]');
  await new Promise(r => setTimeout(r, 250));
  const beforeReload = await evalJs(`(async function(){
    await window.planbook.store.flush();
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      open: window.planbook.classes.getSelectedClassId(),
      pref: window.planbook.getPref('openView'),
      raw: String(localStorage.getItem('planbook_openView') || '') }; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  const afterReload = await evalJs(`(function(){
    return { view: (function(){ var e=document.querySelector('main > :not(.hidden)');
        return e ? e.id : ''; })(),
      open: window.planbook.classes.getSelectedClassId(),
      heading: (document.getElementById('attendanceClassName') || {}).textContent || '',
      raw: String(localStorage.getItem('planbook_openView') || '') }; })()`);
  check('reloading WHILE THE CALENDAR IS UP lands on Attendance for the class that was open — the '
    + 'preference was already written down as `class` on the way in, so there is no `calendar` in '
    + 'localStorage for a reload to restore and nothing decides which month to come back on',
    beforeReload.view === 'calendarView' && beforeReload.open === CLS
      && beforeReload.pref === 'class' && beforeReload.raw.indexOf('calendar') === -1
      && afterReload.view === 'classView' && afterReload.open === CLS
      && afterReload.raw.indexOf('calendar') === -1
      && afterReload.heading.indexOf('WO-6.3 Grid') !== -1,
    'left on #' + beforeReload.view + ' in ' + beforeReload.open + ' with openView = '
      + JSON.stringify(beforeReload.raw) + '; came back on #' + afterReload.view + ' in '
      + afterReload.open + ' headed ' + JSON.stringify(afterReload.heading) + ' with openView = '
      + JSON.stringify(afterReload.raw));

  /* Teardown by id, WO-6.1's and WO-6.2's shape. The two classes, the student, the assignment, the
     ledger row and the three authored events go; the class that was open before this block ran is
     put back, and so is the view. */
  const cleaned = await evalJs(`(function(){
    var s = window.planbook.store;
    s.update(function(d){
      d.classes = (d.classes || []).filter(function(c){
        return c.id !== '${CLS}' && c.id !== '${OTHER}'; });
      d.students = (d.students || []).filter(function(p){ return p.id !== '${STU}'; });
      d.assignments = (d.assignments || []).filter(function(a){ return a.id !== '${ASG}'; });
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
      d.events = (d.events || []).filter(function(e){
        return e.id !== '${DROP_ID}' && e.id !== '${SHUT_ID}' && e.id !== '${GRADES_ID}'; });
    });
    var d = s.getDoc();
    return { classes:(d.classes || []).filter(function(c){
        return c.id === '${CLS}' || c.id === '${OTHER}'; }).length,
      students:(d.students || []).filter(function(p){ return p.id === '${STU}'; }).length,
      assignments:(d.assignments || []).filter(function(a){ return a.id === '${ASG}'; }).length,
      events:(d.events || []).length,
      mode: window.planbook.supports.presentationMode() }; })()`);
  await goHome();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-6.3 fixture came back off the document, presentation mode was left as it was found, '
    + 'and the page was left on the class grid',
    cleaned.classes === 0 && cleaned.students === 0 && cleaned.assignments === 0
      && cleaned.events === SEEDED.length - 3
      && cleaned.mode === !!(plant && plant.mode)
      && (await onView()) === 'homeView',
    cleaned.classes + ' fixture class(es), ' + cleaned.students + ' student(s) and '
      + cleaned.assignments + ' assignment(s) left behind; ' + cleaned.events
      + ' event(s) in the document (wanted ' + (SEEDED.length - 3) + '), presentation mode = '
      + cleaned.mode + ', left on #' + (await onView()));
}
}
