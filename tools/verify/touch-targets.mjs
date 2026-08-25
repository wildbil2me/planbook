/* touch-targets.mjs — touch targets, under a pointer that is REALLY coarse
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

/* WHAT COUNTS AS A CONTROL, in one place (WO-2.21). Every touch measurement in this file used to
   carry its own copy of this list, and the copies had already drifted — the whole-page sweep
   collects six kinds of element, WO-3.5's score-grid block collected two. A second list is a second
   answer, and the one that rots is the one nobody re-reads. */
const CONTROL_SEL = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

/*
  The measurement itself, scoped to one element by CSS selector, or to the whole document when
  handed nothing.

  A STRING BUILT IN NODE rather than a helper installed on the page the way INSTALL_WALKER is:
  every Page.reload throws page-side helpers away, this is now called on both sides of three of
  them, and an expression cannot go missing the way an install that somebody forgets to repeat can.

  THE TWO SKIPS ARE THE POINT OF WRITING IT DOWN ONCE. A box that is not rendered is not a box a
  thumb can miss, and a control inside a shown container can still be hidden by its own class — but
  `display: none` is also what `.hidden` computes to, and `.hidden` is what every view but the one on
  screen wears. That is the whole of WO-2.21: this expression is honest about what it can see, and the
  caller is responsible for putting the screen it wants measured ON SCREEN first.
*/
export function measureIn(rootSel) {
  const sel = rootSel
    ? CONTROL_SEL.split(',').map((s) => rootSel + ' ' + s.trim()).join(', ')
    : CONTROL_SEL;
  return `(function(){ var out=[];
    document.querySelectorAll(${JSON.stringify(sel)}).forEach(function(e){
      var r=e.getBoundingClientRect();
      if (r.width===0 && r.height===0) return;
      if (getComputedStyle(e).display==='none') return;
      out.push({t:e.tagName+'.'+(e.className||''), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100});
    });
    return out; })()`;
}

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, openCalendarPanel, KILL_ANIM, INSTALL_WALKER,
  waitForBoot, seam } = h;

/* ───────────────── touch targets, under a pointer that is REALLY coarse ─────────────────
 *
 * Emulation.setEmulatedMedia's `features` list does not reach `pointer`. It needs touch
 * emulation plus mobile device metrics. Getting this wrong measures the desktop pass and
 * reports green, which is the worst available outcome — so the coarse assertion below gates
 * every measurement after it.
 */


console.log('\n--- 44px touch targets (emulated coarse pointer) ---');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
await waitForBoot();            /* boot is async since WO-1.4; see waitForBoot */
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);   /* a reload discards page-side helpers */

const coarse = await evalJs("matchMedia('(pointer: coarse)').matches");
check('the emulated pointer really is coarse (else everything below measures the desktop pass)',
  coarse === true, 'matchMedia = ' + coarse);

if (coarse !== true) {
  skip('no visible interactive element measures under 44px', 'the coarse pointer never engaged');
} else {
  /* Whatever is on screen right now, which is one view out of four — see the block below, which
     is the half of this sweep that opens the other three. */
  const meas = await evalJs(measureIn());
  const under = meas.filter(m => m.h < 44 || m.w < 44);
  console.log('measured ' + meas.length + ' visible interactive elements');
  check('at least a handful of controls were found (guards a vacuous pass)', meas.length >= 5,
    'measured = ' + meas.length);
  check('no visible interactive element measures under 44px on a coarse pointer',
    under.length === 0, JSON.stringify(under));

  /* ─────────── EVERY VIEW, OPENED THE WAY A TEACHER OPENS IT (WO-2.21) ───────────

     THE SWEEP ABOVE MEASURES ONE SCREEN AND SOUNDS LIKE IT MEASURED THE APP. `.hidden` is
     `display: none !important`, every view but the one on screen wears it, and the measurement
     skips anything computing to `display: none` — so what it just walked is whichever view the
     section above it happened to leave open, and the other three were passed over in silence.
     WO-3.5 shipped a grid holding ~250 score inputs through that gap and this run went green over
     every one of them.

     WHICH VIEWS: ASKED OF THE DOCUMENT, NEVER LISTED HERE. index.html's <main> holds the views as
     siblings toggled by `.hidden` and nothing else (src/views.js's header, lifted from Roll Call!'s
     #registryView / #compactGridView), so the CHILDREN OF <main> ARE THE LIST. VIEW_PLAN below adds
     only what the document cannot say — which door opens each screen, and how few controls is too
     few — and a child of <main> that is not in it turns the first check red and names itself. That
     is WO-2.19's rule in a new place: a list maintained by remembering is not maintained, so
     WO-3.6, WO-3.7 and WO-3.9 each arrive here as a failing check rather than as a screen nobody
     measured.

     THEY ARE OPENED THROUGH THE REAL NAVIGATION, AND THAT IS THE DECISION THIS BLOCK RECORDS.
     The cheap alternative is to drop `.hidden` from each view in turn, and it was rejected for a
     reason this repo has already paid for once. #scoresView shipped with its only door DISABLED —
     src/screen-nav.js carried a hardcoded `pending` on the Scores segment — so the view existed,
     was fully drawn, and no teacher could reach it. Un-hiding measures a beautiful grid there and
     reports green; clicking the door cannot, because there is no door to click. Un-hiding also
     measures layouts the app never produces (two views visible at once, a class screen open with no
     class selected), and a sweep that measures a screen in a state the app never puts it in is a
     new way to be green and wrong. So: the segment, the card and the "All classes" door, in that
     order, exactly as WO-3.5 did it by hand.

     A VIEW WITH NO DOOR THEREFORE FAILS RATHER THAN BEING SKIPPED. openView() throws when the
     control it needs is not on the page — disabled segments carry no `data-class-screen` at all —
     and the throw is reported against that view by name. Skipping it silently is the bug this whole
     block exists to close, one level up.

     AND IT PUTS THE PAGE BACK. Sections in this file inherit each other's DOM state; the days-off
     check left a run on the home view once and cost four checks in the section below it, which is
     written up in tools/README.md. The class that was open is the class this block enters through
     (its own card), and the view it found is the view it leaves. */
  const VIEW_PLAN = {
    /*
      `screen` is the `data-class-screen` value that opens it, or null for the class grid, which is
      reached by the "All classes" door instead. `floor` is how few controls means "this did not
      draw" — the count assertion is what makes the measurement real, because ZERO CONTROLS MEASURED
      AND ZERO CONTROLS UNDERSIZED ARE THE SAME GREEN.

      THE FLOORS ARE OF THIS RUN'S DOCUMENT, not of the app in a teacher's hands, and they are
      small for a reason worth reading before anyone raises them. By the time this section runs the
      assignments section has deleted every assignment in the document (its teardown says so in as
      many words), and the class the section above leaves open has no roster — so #assignmentsView is
      in its empty state and #scoresView hides its toolbar, its flag bar and its grid along with it
      (src/scores.js). Measured on the tree this was written on: 7 · 27 · 5 · 4, which is

        homeView         the Days off button and one card per class (six of them)
        classView        the panel's door home, three switcher segments, the class's own three
                         action buttons, the search field, six filter pills, the sort pair, ⌨ Keys,
                         🖨 Record, three pager buttons and six day-column heads
        assignmentsView  + New assignment, three segments, All classes — every one of them markup
        scoresView       All classes and three segments — every one of them markup

      so the floors are set just under those: enough room for a column window that moves with the
      calendar, and far enough above zero that a view which opens and draws NOTHING cannot pass. A
      floor above what the document can produce would be a check that fails on a correct build, which
      is the other way to make a number nobody trusts.

      That asymmetry is also why WO-3.5's by-hand block stays where it is — see the note there.
    */
    homeView: { screen: null, floor: 3 },
    classView: { screen: 'class', floor: 20 },
    assignmentsView: { screen: 'assignments', floor: 5 },
    scoresView: { screen: 'scores', floor: 4 },
    /*
      #signalsView (WO-4.2) IS ENUMERATED HERE AND MEASURED SOMEWHERE ELSE, and it is the THIRD
      `byHand` — for #calendarView's reason rather than #detailView's, but sharper.

      THE LOOP BELOW WOULD MEASURE AN EMPTY SCREEN AND CALL IT A SCREEN. By the time this block
      runs the assignments section has deleted every assignment in the document and the class left
      open has no roster, so there is not one score and not one recorded meeting for a rule to fire
      on: this view would draw its "nobody is flagged" state, which is a CORRECT rendering of an
      empty document and says nothing whatever about a list whose whole job is to RANK people. A
      floor over that is the vacuous pass this table's own header warns about — zero controls
      measured and zero controls undersized are the same green.

      SO IT IS MEASURED AT THE FOOT OF THIS FILE, in § "who needs you, drawn (WO-4.2)", against a
      fixture built for it: three students carrying one answer each, ten recorded meetings, and the
      two claims this screen exists to make — that attendance bands ahead of the grade, and that
      presentation mode CLOSES it rather than redacting it. Everything the loop would have asked
      (it opens through the app's own navigation; every control on it clears 44px) is asserted
      there in full, on a screen with something on it.

      `byHand` IS A POINTER TO COVERAGE AND NEVER A WAY OUT OF ONE. If that section is ever
      deleted, delete this line with it and let the loop go red — a skip is not a pass, and an
      entry here whose section no longer exists is the only way this table can lie.
    */
    signalsView: { byHand: 'the concern list needs scores, meetings and a roster before it can '
      + 'rank anybody, and this block runs on a document the assignments section has emptied — so '
      + 'it is opened through its real door and measured in § "who needs you, drawn (WO-4.2)"' },
    /*
      #detailView (WO-3.7) IS ENUMERATED HERE AND MEASURED SOMEWHERE ELSE, and `byHand` is the whole
      of that. It is not a skip and it is not an exemption: the two checks the loop below would have
      made — it opens through the app's own navigation, and every control on it clears 44px — are
      made in full at the foot of this file, in § "one student's grade detail (WO-3.7)", against a
      fixture that has a roster in it.

      IT IS HERE BECAUSE THIS SCREEN HAS NO DOOR AT THIS POINT IN THE RUN, and that is the app being
      right rather than the harness being lazy. WO-3.7 owns no navigation target: you arrive from a
      NAME, so the door is a student's own name in the score grid or in their attendance history.
      By the time this block runs the assignments section has deleted every assignment and the class
      left open has no roster — so #scoresView is in its "nothing to grade" state, there is not a
      single student name on any screen, and the honest answer to "open the detail view" is that
      nobody can, because no student has been chosen. A block that planted one to make its own door
      would be measuring a screen in a state it reached itself.

      WHAT THIS ENTRY STILL BUYS is the thing the enumeration check above is for: a view added to
      index.html and not named here fails and says its own name. This one is named, and where it is
      measured is written down beside it — so the failure mode WO-2.21 exists to close (a screen
      nothing measured, passing in silence) is not what a reader of this list would be looking at.
    */
    detailView: { screen: null, floor: 4, byHand: 'the per-student detail is reached from a NAME '
      + 'and there is no roster on screen at this point in the run — it is opened through its real '
      + 'door and measured at 44px in § "one student\'s grade detail (WO-3.7)"' },
    /*
      #calendarView (WO-6.3) IS ENUMERATED HERE AND MEASURED SOMEWHERE ELSE, and it is the SECOND
      `byHand` — for a different reason from the first, which is why it gets its own paragraph
      rather than a mention in that one.

      (WO-6.6 gave it a door on the switcher and a `screen` in the plan below, and changed neither
      reason. What it did add is the strip itself: four segments on a control that was
      `overflow-x: auto`, measured on the strip's own scrollWidth at 390px and at 834px in the same
      section named at the end of this paragraph — because a fourth pill that did not fit made
      that control SCROLL rather than putting the page into the overflow this loop's neighbour
      measures. WO-4.2 made it FIVE and made it WRAP, so that measurement is a row count now and
      the scroll it was guarding against no longer exists to guard against.)

      TWO REASONS, AND THE SECOND IS THE ONE THAT MATTERS. The first is this block's own arithmetic:
      the controls this screen is really about are the CHIPS on the grid, and a chip exists only
      where something is on the calendar. By the time this block runs the assignments section has
      deleted every assignment in the document, so the month this loop would open is a toolbar over
      an empty grid — five controls, all of them markup, none of them the thing under test. That is
      the vacuous pass tools/README.md § "Two rules that follow" is about: measuring a screen with
      nothing on it and reporting that nothing was undersized.

      THE SECOND IS A DEPARTURE FROM THE 44px FLOOR, WRITTEN DOWN RATHER THAN ROUTED AROUND. A month
      cell on an iPad in portrait is about 100px wide, and four chips at 44px plus the date line make
      a cell 200px tall — six rows of which is a month a teacher scrolls through twice, which is a
      month that has stopped being one. So src/calendar-view.css floors a chip in the MONTH at 28px
      and says so at the point of departure, the way src/home.css does at `.class-card-state`, and
      the WEEK view's chips take the full 44 — the month is the survey, the week is the surface you
      touch, and the pair is the answer. This loop cannot express "everything clears 44 except one
      class of control, which clears exactly the floor it is documented at"; it can only pass or go
      red, and a red run about a decision somebody made on purpose is how a check stops being read.
      § "the month and the week, drawn (WO-6.3)" at the foot of this file asserts all three claims
      separately — the toolbar at 44, the month chip at its own floor and BELOW 44, so that a silent
      drift to 20 and a silent "fix" to 44 both show up, and the week chip at 44.

      The reading that settles whether the departure is right is 👤 and stays owed: a thumb on a real
      iPad, which is what the work order asks for and what no emulator has.
    */
    /* `screen: 'calendar'` since WO-6.6 rather than `null`: this view has a `data-class-screen`
       door of its own now — the fourth segment on the switcher — so the walk openView() would take
       to it is a real one. Still `byHand`, for the two reasons below, which the ruling did not
       touch. */
    calendarView: { screen: 'calendar', floor: 5, byHand: 'the calendar\'s controls are chips over a '
      + 'fixture, and every assignment in the document is deleted by the time this block runs — so '
      + 'this loop would measure a toolbar over an empty grid. It is opened through its real door '
      + 'and measured in § "the month and the week, drawn (WO-6.3)", where the month chip\'s '
      + 'documented departure from the 44px floor is asserted AS a departure rather than passed' },
  };

  /* Which view is up, read off the DOM rather than off a variable this block keeps — the same
     answer src/views.js's currentView() gives, and for the same reason it gives it that way. */
  const shownView = async () => await evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");

  /* The open class, read through the seam, which is what `classes` is on it for (src/shell.js).
     Reading which class is open is a question; every act below is a click. */
  const openClassId = seam ? await evalJs('window.planbook.classes.getSelectedClassId()') : '';

  async function openView(id) {
    const plan = VIEW_PLAN[id];
    if ((await shownView()) === id) return;      /* already on it; a tap on the screen you are
                                                   standing on is not how anyone gets there */
    if (plan.screen === null) {
      /* The way back to the grid. Two doors on one hook, and document order picks the header's
         tab — which is drawn on class screens only, so it is exactly where we are coming from. */
      await clickSel('[data-view-home]');
      return;
    }
    /* The switcher is drawn inside each class screen's OWN panel, so the screen you are standing on
       is the only strip that can be tapped — a hidden one measures 0x0 and the click lands at the
       top-left corner of the viewport on whatever is there, which is clickSel's oldest trap. A
       screen that has no strip in it therefore has no door to the next screen, and the way through
       is the one a teacher has: out to the grid, and back in through the class's own card. That is
       also the only door from the grid, because the header's tab strip is not drawn on the home
       view at all (src/classes.js) — and it is the card of the class that was already open, so this
       block hands the run back the class it was given. */
    let on = await shownView();
    if (!on || !(await has('#' + on + ' [data-class-screen="' + plan.screen + '"]'))) {
      if (on !== 'homeView') await clickSel('[data-view-home]');
      await clickSel('#homeGrid [data-class-tab="' + openClassId + '"]');
      on = await shownView();
    }
    if (on === id) return;                       /* a card always lands on Attendance */
    if (!on) throw new Error('no view is visible at all, so there is no strip to tap');
    await clickSel('#' + on + ' [data-class-screen="' + plan.screen + '"]');
  }

  const inMain = await evalJs(`(function(){
    return Array.prototype.map.call(document.querySelectorAll('main > *'), function(e){
      return e.id || '(no id: <' + e.tagName.toLowerCase() + '>)'; }); })()`);
  const planned = Object.keys(VIEW_PLAN);
  const unplanned = inMain.filter((id) => planned.indexOf(id) === -1);
  const goneFromMain = planned.filter((id) => inMain.indexOf(id) === -1);
  /* `>= 4` guards the vacuous pass this section is otherwise wide open to: a selector that stopped
     matching reports "no unplanned views" in exactly the same words as a document with none. */
  check('every screen in <main> is one this sweep knows how to open, enumerated from the document '
    + 'rather than from a list — a view added to index.html and not here is named, not skipped',
    inMain.length >= 4 && unplanned.length === 0 && goneFromMain.length === 0,
    inMain.length + ' in <main>: ' + inMain.join(', ')
      + (unplanned.length ? ' :: NOT IN VIEW_PLAN, so nothing measured them: ' + unplanned.join(', ') : '')
      + (goneFromMain.length ? ' :: in VIEW_PLAN and no longer in <main>: ' + goneFromMain.join(', ') : ''));

  const cameInOn = await shownView();
  Object.keys(VIEW_PLAN).filter((id) => VIEW_PLAN[id].byHand).forEach((id) => {
    console.log('#' + id + ' is measured by hand, not in this loop: ' + VIEW_PLAN[id].byHand);
  });
  for (const id of inMain.filter((v) => planned.indexOf(v) !== -1 && !VIEW_PLAN[v].byHand)) {
    const plan = VIEW_PLAN[id];
    let noDoor = '';
    try {
      await openView(id);
      await new Promise(r => setTimeout(r, 250));
    } catch (e) { noDoor = e.message; }
    const state = await evalJs(`(function(){ var v=document.getElementById(${JSON.stringify(id)});
      if (!v) return null; var s=getComputedStyle(v); var r=v.getBoundingClientRect();
      return { hidden: v.classList.contains('hidden'), display: s.display,
               w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100 }; })()`);
    const open = !noDoor && !!state && !state.hidden && state.display !== 'none' && state.h > 0;
    const vm = open ? await evalJs(measureIn('#' + id)) : [];
    const vunder = vm.filter((m) => m.h < 44 || m.w < 44);
    console.log('measured ' + vm.length + ' control(s) on #' + id);
    check('#' + id + ' opens through the app\'s own navigation and draws at least ' + plan.floor
      + ' control(s) — a screen nothing can reach, and a screen that opens empty, both fail here',
      open && vm.length >= plan.floor,
      noDoor ? 'no door: ' + noDoor
        : JSON.stringify(state) + ' :: ' + vm.length + ' control(s) measured');
    check('every control on the open #' + id + ' measures >=44px on a coarse pointer',
      vm.length >= plan.floor && vunder.length === 0,
      'measured ' + vm.length + '; under = ' + JSON.stringify(vunder.slice(0, 6))
        + (vunder.length > 6 ? ' … and ' + (vunder.length - 6) + ' more' : ''));
  }

  /* Back on the view this block found, in the class it found open, through the same doors. */
  if (VIEW_PLAN[cameInOn]) {
    try { await openView(cameInOn); } catch (e) {
      console.log('could not put #' + cameInOn + ' back: ' + e.message);
    }
  }
  console.log('left the page on #' + (await shownView()) + ', class ' + (openClassId || '(none)'));

  /* Measured after opening, not read off min-height: the search-box defect was a compliant
     declaration on the wrong element.

     `[data-modal-open]` is still the right selector here, unlike in the modal-behaviour section
     above: the shelf's two openers went at WO-1.10 and the header's About button — the one this
     clicks — is the real control that carried the hook all along. One opener is all a measurement
     needs; it is focus RETURN that needed two. */
  if (await has('[data-modal-open]')) {
    /* Same viewport-coordinate rule as clickSel above, and one extra reason to obey it here:
       Chrome restores the previous scroll offset across Page.reload, so this click can start
       from wherever the section before it left the page. */
    const box = await evalJs("(function(){var e=document.querySelector('[data-modal-open]');"
      + "e.scrollIntoView({block:'center'});var r=e.getBoundingClientRect();"
      + "return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 });
    await new Promise(r => setTimeout(r, 200));
    const mm = await evalJs(`(function(){ var out=[];
      document.querySelectorAll('.modal-overlay:not(.hidden) button, .modal-overlay:not(.hidden) input').forEach(function(e){
        var r=e.getBoundingClientRect();
        out.push({t:e.className||e.tagName, w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100,
                  hidden:e.classList.contains('hidden')});
      }); return out; })()`);
    /*
      THE PREMISE UNDER THIS CHECK CHANGED AT WO-7.1, AND IT IS SPLIT RATHER THAN LOOSENED.

      It measured every button in the open overlay and required all of them to clear 44 — which was
      right for as long as no modal held a control that comes and goes with a state. The About modal
      now does: the Drive section draws **Connect** or **Disconnect**, never both, so one of the two
      is always `.hidden` and measures 0x0 inside an overlay that IS open. That reads exactly like a
      failed touch target and is not one.

      Dropping the assertion, or filtering on size alone, would be trap 8 in tools/README.md — a
      sensitive check quietly measuring less. So the set is split three ways instead, and all three
      are asserted: what is DRAWN clears 44, what is `.hidden` is named out loud rather than
      silently skipped, and a control that is 0x0 while carrying NO `.hidden` class still FAILS,
      because that one is a collapsed layout rather than a state. `src/modal.js`'s own focusablesIn()
      draws the same line for the same reason — a hidden control is not a place Tab should stop.

      The controls that leave this check by being hidden do not leave the run: WO-7.1's section at
      the foot of this file measures each of them in the state it is actually drawn in.
    */
    const drawn = mm.filter(m => !m.hidden);
    const under = drawn.filter(m => m.h < 44 || m.w < 44);
    const collapsed = under.filter(m => m.w === 0 && m.h === 0);
    if (!mm.length) skip('modal controls measure >=44px on a coarse pointer', 'no modal opened');
    else check('every control DRAWN in the open modal measures >=44px on a coarse pointer, and a '
      + '0x0 control that is not marked hidden fails as a collapsed one',
      drawn.length > 0 && under.length === 0,
      'measured ' + mm.length + ', of which ' + mm.filter(m => m.hidden).length
        + ' hidden by state and named here rather than skipped silently: '
        + JSON.stringify(mm.filter(m => m.hidden).map(m => m.t))
        + '; under 44 = ' + JSON.stringify(under) + '; of those, collapsed with no hidden class = '
        + JSON.stringify(collapsed));
  }

  /* The year picker's rows and its "start another year" field are built at open time, so the
     sweep above never sees them — inside a hidden overlay they measure 0x0 and are skipped.
     They are the controls WO-1.4 adds, so they get measured explicitly, on the same coarse
     pointer, with the About modal closed first so only one overlay is on screen. */
  if (await has('[data-year-picker]')) {
    if (seam) await evalJs("window.planbook.closeModal('aboutModal');1");
    await clickSel('[data-year-picker]');
    await new Promise(r => setTimeout(r, 500));
    const ym = await evalJs(`(function(){ var m=document.getElementById('yearModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r=e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 };
      }); })()`);
    if (!ym || ym.length < 3) {
      check('the year picker opened with its rows, so there is something to measure',
        false, 'controls found = ' + (ym ? ym.length : 'modal never opened'));
    } else {
      check('every year-picker control measures >=44px on a coarse pointer',
        ym.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + ym.length + '; under = ' + JSON.stringify(ym.filter(m => m.h < 44 || m.w < 44)));
    }
    if (seam) await evalJs("window.planbook.closeModal('yearModal');1");
  }

  /* The backup panel and the restore confirm, for the same reason as the year picker above:
     everything in them sits inside a hidden overlay, where it measures 0x0 and the sweep skips
     it. The file input is the one that matters — a 44px <input type=file> wrapped around a 20px
     native button is the WO-1.2 `.search-box` defect exactly, so both are measured. */
  if (await has('[data-backup-panel]')) {
    if (seam) await evalJs("window.planbook.closeModal('yearModal');window.planbook.closeModal('aboutModal');1");
    /* Scoped to the header. The first [data-backup-panel] in the document is the exit inside
       the loading screen, which is display:none on a healthy boot — clicking it measures 0x0
       and the click lands at the top-left corner of the viewport instead, on whatever is there.
       Same viewport-coordinate trap as clickSel's own comment, one level up. */
    await clickSel('header [data-backup-panel]');
    await new Promise(r => setTimeout(r, 400));
    /* The confirm is opened over the top through the seam, so both panels are measured in one
       pass — there is no file to put through the input from here. */
    if (seam) {
      await evalJs("(async function(){ var s = window.planbook.store; var d = s.getDoc();"
        + " if (!d) return 0; var f = await window.planbook.backup.buildBackup();"
        + " await window.planbook.backup.restoreFromText(f.text, 'measure.json'); return 1; })()");
      await new Promise(r => setTimeout(r, 400));
    }
    /* WO-1.11's "Back up all N years" is inside this panel and is `.hidden` on a device with one
       year, so the measurement waits for it rather than measuring a 0x0 box and calling the panel
       broken. It is a real control here — the run has three years by now — and it gets its own
       named check below, because a control that is skipped for being invisible is a control nobody
       measured. */
    const allBtn = await evalJs(`(async function(){ var el;
      for (var i = 0; i < 60; i++) {
        el = document.getElementById('backupDownloadAllBtn');
        if (el && !el.classList.contains('hidden')) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      if (!el || el.classList.contains('hidden')) return null;
      var r = el.getBoundingClientRect();
      return { label: el.textContent, w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100 }; })()`);
    const bm = await evalJs(`(function(){ var out = [];
      document.querySelectorAll('.modal-overlay:not(.hidden) button, .modal-overlay:not(.hidden) input')
        .forEach(function(e){ var r = e.getBoundingClientRect();
          /* The same two skips the whole-page sweep above makes, and for the same reason: a control
             inside a visible overlay can still be hidden by its own class, and a box that is not
             rendered is not a box a thumb can miss. Anything hidden here is measured by a check of
             its own in the state where it is shown. */
          if (r.width === 0 && r.height === 0) return;
          if (getComputedStyle(e).display === 'none') return;
          out.push({ t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }); });
      return out; })()`);
    if (bm.length < 5) {
      check('the backup panel and restore confirm opened, so there is something to measure',
        false, 'controls found = ' + bm.length);
    } else {
      check('every backup and restore control measures >=44px on a coarse pointer',
        bm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + bm.length + '; under = ' + JSON.stringify(bm.filter(m => m.h < 44 || m.w < 44)));
    }
    check('the "back up every year" control is on the panel and measures >=44px on a coarse pointer',
      !!allBtn && allBtn.h >= 44 && allBtn.w >= 44,
      allBtn ? '"' + allBtn.label + '" is ' + allBtn.w + 'x' + allBtn.h
        : 'the control never appeared, so nothing was measured — with three years on the device it should be shown');
    /* The native ::file-selector-button, which is a separate box inside the input and is the
       part a thumb actually lands on. */
    const fileBtn = await evalJs(`(function(){ var i = document.getElementById('backupFile');
      if (!i) return null; var s = getComputedStyle(i, '::file-selector-button');
      return { minHeight: s.minHeight, padding: s.padding }; })()`);
    check('the file input\'s own native button carries a 44px minimum, not just the input around it',
      !!fileBtn && parseFloat(fileBtn.minHeight) >= 44,
      fileBtn ? 'min-height = ' + fileBtn.minHeight + ', padding = ' + fileBtn.padding : 'no #backupFile');
  }

  /* The classes manager, the term editor and the delete confirm, for the same reason as the year
     picker and the backup panel above: every control in them is built at open time inside a hidden
     overlay, where it measures 0x0 and the sweep skips it. Three of them are the ones this work
     order could plausibly get wrong — the reorder arrows are one glyph wide, the rename field is
     an input inside a row, and `<input type="date">` is a control whose height nobody sets by
     accident — so all three are opened and measured rather than read off a rule. */
  if (await has('[data-class-manage]')) {
    /* Everything the section above left open comes down first, the restore confirm included: an
       overlay is fixed at inset 0, so a click aimed at the header button underneath one lands on
       the scrim — and a press-and-release on a scrim is a backdrop dismissal, which would read as
       "the manager stopped opening". */
    if (seam) {
      await evalJs("window.planbook.backup.cancelRestore();"
        + "window.planbook.closeModal('backupModal');"
        + "window.planbook.closeModal('yearModal');window.planbook.closeModal('aboutModal');1");
    }
    await clickSel('header [data-class-manage]');
    await new Promise(r => setTimeout(r, 400));
    /* Rename first, so the field and its two buttons are on screen and inside the sweep. */
    await clickSel('#classList .class-row:nth-child(1) [data-class-rename]');
    const cm = await evalJs(`(function(){ var out = [];
      document.querySelectorAll('#classesModal button, #classesModal input').forEach(function(e){
        var r = e.getBoundingClientRect();
        out.push({ t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }); });
      return out; })()`);
    if (cm.length < 12) {
      check('the classes manager opened with its rows, so there is something to measure',
        false, 'controls found = ' + cm.length);
    } else {
      check('every control in the classes manager measures >=44px on a coarse pointer, arrows included',
        cm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + cm.length + '; under = ' + JSON.stringify(cm.filter(m => m.h < 44 || m.w < 44)));
    }

    await clickSel('[data-class-rename-cancel]');
    /* The SECOND row, not the first: the first is the class the backup section restored, which has
       no terms at all, and its editor is four preset buttons with nothing under them. Measuring
       that would report green while measuring none of the controls this section is here for. */
    await clickSel('#classList .class-row:nth-child(2) [data-term-manage]');
    await new Promise(r => setTimeout(r, 300));
    const tm = await evalJs(`(function(){ var m = document.getElementById('termsModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r = e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
    if (!tm || tm.length < 8) {
      check('the term editor opened with its rows, so there is something to measure',
        false, 'controls found = ' + (tm ? tm.length : 'modal never opened'));
    } else {
      check('every control in the term editor measures >=44px, date fields included',
        tm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + tm.length + '; under = ' + JSON.stringify(tm.filter(m => m.h < 44 || m.w < 44)));
    }
    await clickSel('#termsModal [data-modal-close]');

    /* The categories editor (WO-3.1), for the same reason as every panel above: its rows are built
       at open time inside a hidden overlay, where they measure 0x0 and the sweep at the top of this
       section skips them. Two shapes in here are the ones this work order could plausibly get
       wrong. The weight field is an `<input type="number">` — a control the browser draws, with a
       spinner inside it, whose height nobody sets by accident and which the term editor's date
       fields already had to be told about once. And the Remove button sits shoulder to shoulder
       with a one-glyph reorder arrow, which is where `min-width` matters as much as `min-height`:
       44px tall and 30px wide is half a touch target. The SECOND row again, for the reason the
       term editor uses it — the first class is the restored one, whose categories panel is an
       empty state with one button in it and measuring that would report green having measured
       none of the controls this check exists for. */
    await clickSel('#classList .class-row:nth-child(2) [data-category-manage]');
    await new Promise(r => setTimeout(r, 300));
    const km = await evalJs(`(function(){ var m = document.getElementById('categoriesModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r = e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
    if (!km || km.length < 8) {
      check('the categories editor opened with its rows, so there is something to measure',
        false, 'controls found = ' + (km ? km.length : 'modal never opened'));
    } else {
      check('every control in the categories editor measures >=44px, the weight field included',
        km.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + km.length + '; under = ' + JSON.stringify(km.filter(m => m.h < 44 || m.w < 44)));
    }
    /* The total is not a control and is deliberately not in the sweep above — it is a standing
       line of prose. What it does have to do on a tablet is be READ, so it is measured for the one
       thing a 12px line gets wrong at arm's length, and for the one thing a nowrap banner gets
       wrong at 390px: the "Days off" spill from the first iPad sitting, asked of the next surface
       that carries a sentence rather than a label. */
    const catTotal = await evalJs(`(function(){ var t = document.getElementById('categoryTotal');
      if (!t) return null; var s = getComputedStyle(t);
      return { size: parseFloat(s.fontSize), spill: t.scrollWidth > t.clientWidth,
               said: t.textContent.trim().length }; })()`);
    check('the weights total is legible on a coarse pointer and does not spill out of its own box',
      !!catTotal && catTotal.size >= 13 && !catTotal.spill && catTotal.said > 30,
      JSON.stringify(catTotal));
    await clickSel('#categoriesModal [data-modal-close]');

    /* The letter-scale editor (WO-3.2), for the same reason as every panel above: its bands are
       built at open time inside a hidden overlay, where they measure 0x0 and the sweep at the top of
       this section skips them. Four shapes in here are the ones this work order could plausibly get
       wrong. The boundary field is an `<input type="number">` — the control the categories editor and
       the term editor have each had to be told about once already. The letter field is two
       characters wide by nature, so it is the one input in this app whose `min-width` is doing real
       work. The subject pills wear `.pill`, which carries a coarse HEIGHT and no width, and a pill
       reading "AP" would be half a target — the subject row pins the width for that reason. And
       Remove sits shoulder to shoulder with a one-glyph reorder arrow, which is the mis-tap the 8px
       gap is for. */
    await clickSel('#classesModal [data-letter-scale]');
    await new Promise(r => setTimeout(r, 300));
    const lsm = await evalJs(`(function(){ var m = document.getElementById('letterScaleModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
        var r = e.getBoundingClientRect();
        return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
    if (!lsm || lsm.length < 20) {
      check('the letter-scale editor opened with its bands, so there is something to measure',
        false, 'controls found = ' + (lsm ? lsm.length : 'modal never opened'));
    } else {
      check('every control in the letter-scale editor measures >=44px, the letter and boundary fields and the subject pills included',
        lsm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + lsm.length + '; under = ' + JSON.stringify(lsm.filter(m => m.h < 44 || m.w < 44)));
    }
    /* Two pieces of prose that are not controls and are deliberately not in the sweep above: the
       standing note, and the derived range on a band row. Both are measured for the two things a
       12px line gets wrong on a tablet — legibility at arm's length, and the "Days off" spill from
       the first iPad sitting, asked of the next surfaces that carry a sentence and a chip rather
       than a label. */
    const scaleNote = await evalJs(`(function(){ var n = document.getElementById('scaleNote');
      var chip = document.querySelector('#bandList .band-range');
      if (!n || !chip) return null; var ns = getComputedStyle(n); var cs = getComputedStyle(chip);
      return { size: parseFloat(ns.fontSize), spill: n.scrollWidth > n.clientWidth,
               said: n.textContent.trim().length, chipSize: parseFloat(cs.fontSize),
               chipSpill: chip.scrollWidth > chip.clientWidth,
               chipSaid: chip.textContent.trim().length }; })()`);
    check('the scale note and the derived range beside a band are legible on a coarse pointer and do not spill out of their boxes',
      !!scaleNote && scaleNote.size >= 13 && !scaleNote.spill && scaleNote.said > 30
        && scaleNote.chipSize >= 11 && !scaleNote.chipSpill && scaleNote.chipSaid > 5,
      JSON.stringify(scaleNote));
    await clickSel('#letterScaleModal [data-modal-close]');

    const archivedRows = await evalJs("document.querySelectorAll('#classArchivedList [data-class-delete]').length");
    if (!archivedRows) {
      skip('every control in the delete confirm measures >=44px on a coarse pointer',
        'no archived class on the device to open the confirm from');
    } else {
      await clickSel('#classArchivedList [data-class-delete]');
      await new Promise(r => setTimeout(r, 300));
      const dm = await evalJs(`(function(){ var m = document.getElementById('classDeleteModal');
        if (!m || m.classList.contains('hidden')) return null;
        return Array.prototype.slice.call(m.querySelectorAll('button, input')).map(function(e){
          var r = e.getBoundingClientRect();
          return { t:(e.className||e.tagName), w:Math.round(r.width*100)/100, h:Math.round(r.height*100)/100 }; }); })()`);
      if (!dm || dm.length < 3) {
        check('the delete confirm opened, so there is something to measure', false,
          'controls found = ' + (dm ? dm.length : 'modal never opened'));
      } else {
        check('every control in the delete confirm measures >=44px on a coarse pointer',
          dm.every(m => m.h >= 44 && m.w >= 44),
          'measured ' + dm.length + '; under = ' + JSON.stringify(dm.filter(m => m.h < 44 || m.w < 44)));
      }
      await clickSel('[data-class-delete-cancel]');
    }
    if (seam) await evalJs("window.planbook.closeModal('classesModal');1");
  }

  /*
    Days off & planned drops (WO-2.3), for the same reason as every panel above: its class picker
    and its calendar list are built at open time inside a hidden overlay, where they measure 0x0 and
    the sweep at the top of this section skips them.

    Two shapes in here are the ones this work order could plausibly get wrong, and they are the two
    the run below puts on screen deliberately. The class picker is `.toggle-btn` rather than
    checkboxes — a checkbox is 16px of target that no padding makes bigger — so the kind is switched
    to a planned drop first, which is the only state in which that row exists. And the two date
    fields are `<input type="date">`, a control whose height nobody sets by accident and which the
    term editor above already had to be told about once.
  */
  /*
    THE GUARD IS ON THE CALENDAR'S DOOR NOW, AND IT HAS AN `else` (WO-6.6).

    It read `has('#homeView [data-dayoff-panel]')` until 2026-08-19, and that button no longer exists
    — the owner moved both panels' doors onto the calendar's own header. A guard whose selector
    stops matching does not fail: this whole block and the one nested inside it would have vanished
    from the run with no FAIL and no SKIP, taking two 44px measurements with them and leaving a
    green run two checks shorter. That is the vacuous pass tools/README.md § "Two rules that follow"
    is about and the reason the `check()` count in that file is machine-read. So the guard follows
    the door AND announces itself when it misses: a SKIP is a line a reader can see.
  */
  const dayOffDoorUp = seam && await has('#calendarView .panel-title-actions [data-dayoff-panel]');
  if (!dayOffDoorUp) {
    skip('every control in the days-off panel measures >=44px on a coarse pointer, date fields and class picker included',
      seam ? 'no [data-dayoff-panel] in #calendarView\'s panel header — WO-6.6 put the door there, '
        + 'and this block cannot open a panel it cannot reach'
        : 'no window.planbook seam on the page, so nothing here can close the modals it opens');
    skip('every control in the calendar-events panel measures >=44px on a coarse pointer, the '
      + 'student <select>, the three date fields and the lead-time number included',
      'the days-off door above was not reachable, so the walk that reaches this panel never ran');
  }
  if (dayOffDoorUp) {
    await evalJs("(function(){ ['classDeleteModal','termsModal','classesModal','backupModal',"
      + "'yearModal','aboutModal'].forEach(function(m){ window.planbook.closeModal(m); });"
      + " return 1; })()");
    /* From the calendar's own door since WO-6.6, which means getting onto the calendar: the coarse
       sweep reloads the page and Chrome restores whichever view the preference last held.
       openCalendarPanel() walks it, through the home screen's Calendar button. */
    await openCalendarPanel('[data-dayoff-panel]');
    await clickSel('#daysOffModal [data-dayoff-kind="dropped"]');
    await new Promise(r => setTimeout(r, 200));
    const dom = await evalJs(`(function(){ var m = document.getElementById('daysOffModal');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input'))
        .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
        .map(function(e){ var r = e.getBoundingClientRect();
          return { t:(e.className || e.tagName), w:Math.round(r.width*100)/100,
                   h:Math.round(r.height*100)/100 }; }); })()`);
    const picker = await evalJs("document.querySelectorAll('#daysOffClassPicker .toggle-btn').length");
    if (!dom || dom.length < 8 || !picker) {
      check('the days-off panel opened with its class picker, so there is something to measure',
        false, 'controls found = ' + (dom ? dom.length : 'panel never opened')
          + ', class buttons = ' + picker);
    } else {
      check('every control in the days-off panel measures >=44px on a coarse pointer, date fields and class picker included',
        dom.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + dom.length + ' (including ' + picker + ' class button(s)); under = '
          + JSON.stringify(dom.filter(m => m.h < 44 || m.w < 44)));
    }
    await evalJs("window.planbook.closeModal('daysOffModal');1");

    /*
      Calendar events (WO-6.1), the second panel on this row and measured for the same reason as
      the first: its class picker, its student picker and its list are built at open time inside a
      hidden overlay, where they measure 0x0 and the sweep at the top of this section skips them.

      Two controls in here are the ones this work order could plausibly get wrong. The student
      picker is a real `<select>` — the one departure from the `.toggle-btn` row next door, taken
      because five classes make five buttons and a hundred and forty students make a wall — and the
      lead-time field is a `<input type="number">` inside a sentence, which is the shape
      src/signal-settings.js's threshold field takes and the shape that gets its height from a
      wrapper by accident. The kind is switched to grades-due first, which is the only state in
      which that field is on screen at all.
    */
    /* The nested guard, re-routed with its parent and given the same `else` — see the paragraph
       above the parent for why a guard that quietly stops matching is worse than one that fails. */
    const eventsDoorUp = await has('#calendarView .panel-title-actions [data-events-panel]');
    if (!eventsDoorUp) {
      skip('every control in the calendar-events panel measures >=44px on a coarse pointer, the '
        + 'student <select>, the three date fields and the lead-time number included',
        'no [data-events-panel] in #calendarView\'s panel header — WO-6.6 put the door there');
    }
    if (eventsDoorUp) {
      await openCalendarPanel('[data-events-panel]');
      await clickSel('#eventsModal [data-event-kind="grades-due"]');
      await new Promise(r => setTimeout(r, 200));
      const evm = await evalJs(`(function(){ var m = document.getElementById('eventsModal');
        if (!m || m.classList.contains('hidden')) return null;
        return Array.prototype.slice.call(m.querySelectorAll('button, input, select'))
          .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
          .map(function(e){ var r = e.getBoundingClientRect();
            return { t:(e.className || e.tagName), w:Math.round(r.width*100)/100,
                     h:Math.round(r.height*100)/100 }; }); })()`);
      const leadField = await evalJs("document.querySelectorAll('#eventsModal [data-event-lead]').length");
      const picker = await evalJs("document.querySelectorAll('#eventStudent').length");
      if (!evm || evm.length < 10 || !leadField || !picker) {
        check('the events panel opened with its lead-time field and its student picker, so there '
          + 'is something to measure', false,
          'controls found = ' + (evm ? evm.length : 'panel never opened') + ', lead-time field = '
            + leadField + ', student picker = ' + picker);
      } else {
        check('every control in the calendar-events panel measures >=44px on a coarse pointer, the '
          + 'student <select>, the three date fields and the lead-time number included',
          evm.every(m => m.h >= 44 && m.w >= 44),
          'measured ' + evm.length + '; under = '
            + JSON.stringify(evm.filter(m => m.h < 44 || m.w < 44)));
      }
      await evalJs("window.planbook.closeModal('eventsModal');1");
    }

    /*
      AND THE BUTTON THAT OPENS IT, WHICH IS A DIFFERENT QUESTION FROM 44px AND THE ONE THAT FAILED.
      The owner found "Days off" spilling out through its own border on the iPad on 2026-08-08, with
      every touch-target check above it green — because a button can clear 44px in both directions
      and still be narrower than the words inside it. Every `.class-action-btn` is `white-space:
      nowrap`, so a shrunk one does not reflow, it overflows; and the coarse block's `min-width:
      44px` is what gave it permission to shrink, by replacing the `min-width: auto` that a flex
      item otherwise gets for free.

      Measured as scrollWidth against clientWidth, which is the defect itself rather than a proxy
      for it: a control whose content is wider than its box IS the bug, whatever caused it. Asked of
      every button in the header row, so the next one added to that row inherits the check.

      IT IS ONE BUTTON SINCE WO-6.6 AND IT IS MEASURED FROM THE HOME SCREEN, WHICH IS NOW SOMEWHERE
      TO GO BACK TO. The two panels' doors moved onto the calendar, so this block reaches them there
      and stands on the calendar by the time it gets here — and `#homeView` is `.hidden` from that
      screen, where every rect is 0x0 and every one of these clauses fails for a reason that has
      nothing to do with a label spilling. The calendar's own four-button row is measured the same
      way in § "the month and the week, drawn", which is where the fixture for it lives.
    */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));
    const titleRow = await evalJs(`(function(){
      var row = document.querySelector('#homeView .panel-title-row');
      if (!row) return null;
      return Array.prototype.slice.call(row.querySelectorAll('button')).map(function(b){
        var r = b.getBoundingClientRect();
        return { text: (b.textContent || '').trim(),
                 over: b.scrollWidth - b.clientWidth,
                 w: Math.round(r.width), h: Math.round(r.height),
                 wrap: getComputedStyle(b).whiteSpace }; }); })()`);
    if (!titleRow || !titleRow.length) {
      check('the home screen header row has a control to measure', false,
        'found ' + JSON.stringify(titleRow));
    } else {
      check('no button in the home header row is narrower than its own label — a nowrap control that shrinks does not reflow, it spills through its border',
        titleRow.every(b => b.over <= 0 && b.w >= 44 && b.h >= 44),
        titleRow.map(b => '"' + b.text + '" ' + b.w + 'x' + b.h + ' (' + b.wrap + '), content over its box by '
          + b.over + 'px').join(' · '));
    }
    /* AND BACK INTO A CLASS, which is not tidying up — it is a precondition for the roster block
       below. The class tab strip is drawn on the class view ONLY (WO-1.13), and that block finds
       the class with the biggest roster by reading those tabs; left on the home screen it reads an
       empty list, switches to nothing, and fails four checks about controls it never opened. Found
       exactly that way. A card is the way in, the same route a teacher takes. */
    if (await has('#homeGrid .class-card-open')) await clickSel('#homeGrid .class-card-open');
  }

  /*
    The roster's four screens, for the same reason as the ones above: every control in them is
    built at open time inside a hidden overlay, where it measures 0x0 and the sweep at the top of
    this section skips it. This feature has more fields than every other one put together, which is
    exactly how one of them gets missed — and three of them are shapes nobody sets the height of by
    accident: a <textarea>, a preview row whose two name fields sit side by side, and the
    "Contact first" toggle, which is a pill rather than a checkbox precisely because a checkbox is
    16px of target that no padding makes bigger.

    The wrapper classes the sweep flagged — .roster-list, .roster-form, .student-grid, .guardian-card
    and the rest — carry no rule and are not measured here, because they are not targets. What is
    measured is the control INSIDE each of them, which is the WO-1.2 .search-box lesson: a 44px
    declaration on a wrapper is what a stylesheet review calls compliant and a thumb calls broken.
  */
  if (seam && await has('header [data-roster-manage]')) {
    const closeStack = () => evalJs("(function(){ ['studentDeleteModal','studentModal',"
      + "'rosterPasteModal','rosterModal','teacherModal','classesModal','backupModal',"
      + "'yearModal','aboutModal'].forEach(function(m){ window.planbook.closeModal(m); });"
      + " return 1; })()");
    const measureIn = (id) => evalJs(`(function(){ var m = document.getElementById(`
      + JSON.stringify(id) + `);
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input, textarea'))
        .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
        .map(function(e){ var r = e.getBoundingClientRect();
          return { t:(e.className || e.tagName), w:Math.round(r.width*100)/100,
                   h:Math.round(r.height*100)/100 }; }); })()`);
    const report = (list) => 'measured ' + list.length + '; under = '
      + JSON.stringify(list.filter(m => m.h < 44 || m.w < 44));

    await closeStack();
    /* Onto the class that actually has a roster, found rather than assumed: the panel renders one
       row per student, and measuring an empty one would report green having measured the two
       controls the markup ships with. The overflow section below wants the class the roster
       section left open, so it is put back at the end of this block. */
    const fullest = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var tabs = Array.prototype.slice.call(document.querySelectorAll('#classTabBar [data-class-tab]'));
      var best = -1, n = -1;
      tabs.forEach(function(t, i){
        var c = doc.classes.filter(function(x){ return x.id === t.getAttribute('data-class-tab'); })[0];
        var len = c && c.roster ? c.roster.length : 0;
        if (len > n) { n = len; best = i; }
      });
      return { tab: best, students: n, was: window.planbook.classes.getSelectedClassId() }; })()`);
    if (fullest.tab >= 0) await clickSel('[data-class-tab]', fullest.tab);
    await clickSel('header [data-roster-manage]');
    await new Promise(r => setTimeout(r, 300));
    const rm = await measureIn('rosterModal');
    if (!rm || rm.length < 5) {
      check('the roster panel opened with its rows, so there is something to measure', false,
        'controls found = ' + (rm ? rm.length : 'panel never opened'));
    } else {
      check('every control on the roster panel measures >=44px on a coarse pointer',
        rm.every(m => m.h >= 44 && m.w >= 44), report(rm));
    }

    await clickSel('#rosterModal [data-roster-paste]');
    await new Promise(r => setTimeout(r, 200));
    await evalJs('(function(){ var b = document.getElementById("rosterPasteBox");'
      + ' b.value = "Measured, Ann\\nBeta Gamma\\n";'
      + ' b.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
    await clickSel('[data-roster-preview]');
    await new Promise(r => setTimeout(r, 200));
    const pm = await measureIn('rosterPasteModal');
    if (!pm || pm.length < 6) {
      check('the paste preview opened with its rows, so there is something to measure', false,
        'controls found = ' + (pm ? pm.length : 'panel never opened'));
    } else {
      check('every control in the paste preview measures >=44px, the per-row swap included',
        pm.every(m => m.h >= 44 && m.w >= 44), report(pm));
    }
    await evalJs("window.planbook.closeModal('rosterPasteModal');1");

    /*
      The contact import and its preview (WO-1.23), for the same reason as the paste preview above:
      its rows are built at open time inside a hidden overlay, where they measure 0x0 and the sweep
      at the top of this section skips them. Two shapes in here are the ones this work order could
      plausibly get wrong. The file input is an `<input type=file>`, whose NATIVE button is a second
      box inside the control — a 44px input wrapped around a 20px button is the WO-1.2 `.search-box`
      defect exactly, which is why both halves are measured, the same way `.backup-file`'s are. And
      the preview row puts a toggle shoulder to shoulder with two text fields, which is the shape
      `.paste-row` already had to be told about once — it wears those very classes here, so a rule
      that reached one and not the other would show up as a row of the same dialog measuring two
      different heights.

      Driven through the file input rather than through a seam: a page cannot be handed a File by a
      script, but it can be handed a DataTransfer holding one, which is exactly what the picker
      delivers, so everything from the `change` event inward is the real path including the read.
    */
    await clickSel('#rosterModal [data-roster-import]');
    await new Promise(r => setTimeout(r, 200));
    await evalJs(`(async function(){
      var text = '"Measured, Ann (Annie) \\'28",ann@example.edu,(508) 111-2222 (H),'
        + '"Ochoa, Rea",rea@example.edu,Mr. Bo Measured,'
        + '"(508) 333-4444 (M), (508) 555-6666 (H)",bo@example.com\\n'
        + ',,,,,Mrs. Cyd Measured,(508) 777-8888 (M),cyd@example.com\\n';
      var input = document.getElementById('rosterImportFile');
      var d = new DataTransfer();
      d.items.add(new File([text], 'Measured contacts.csv', { type:'text/csv' }));
      input.files = d.files;
      input.dispatchEvent(new Event('change', { bubbles:true }));
      await new Promise(function(r){ setTimeout(r, 400); });
      return document.querySelectorAll('#rosterImportList .paste-row').length; })()`);
    const im = await measureIn('rosterImportModal');
    const imRows = await evalJs("document.querySelectorAll('#rosterImportList .paste-row').length");
    if (!im || im.length < 6 || !imRows) {
      check('the contact import opened with a preview row, so there is something to measure', false,
        'controls found = ' + (im ? im.length : 'panel never opened') + ', preview rows = ' + imRows);
    } else {
      check('every control in the contact import measures >=44px, the file input and the preview '
        + 'row included',
        im.every(m => m.h >= 44 && m.w >= 44), report(im));
    }
    /* The native ::file-selector-button, which is a separate box inside the input and is the part a
       thumb actually lands on — asked of this input for the reason it is asked of #backupFile. */
    const importFileBtn = await evalJs(`(function(){ var i = document.getElementById('rosterImportFile');
      if (!i) return null; var s = getComputedStyle(i, '::file-selector-button');
      return { minHeight: s.minHeight, padding: s.padding }; })()`);
    check('the contact import\'s own native file button carries a 44px minimum, not just the input '
      + 'around it',
      !!importFileBtn && parseFloat(importFileBtn.minHeight) >= 44,
      importFileBtn ? 'min-height = ' + importFileBtn.minHeight + ', padding = '
        + importFileBtn.padding : 'no #rosterImportFile');
    await evalJs("window.planbook.closeModal('rosterImportModal');1");

    /* The first roster row's student, with a guardian card open: the card is the only place in
       this feature where a toggle, a delete and five fields share one box.

       Guarded rather than clicked straight, because there is no student to open when the roster
       section above ended on a failure — and clickSel throws when it finds nothing, which would
       take the whole run down at the point where a report is what is wanted. Failing to have a
       fixture is a failed check here, never a crash and never a silent pass. */
    const editable = await has('#rosterList .roster-row [data-student-edit]');
    if (!editable) {
      check('the student editor opened with a guardian card, so there is something to measure',
        false, 'no student on the open class\'s roster to open an editor from');
    } else {
      await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]');
      await new Promise(r => setTimeout(r, 200));
      const noGuardian = await evalJs(
        "document.querySelectorAll('#guardianList .guardian-card').length === 0");
      if (noGuardian) await clickSel('#studentModal [data-guardian-add]');
      await new Promise(r => setTimeout(r, 200));
      const sm = await measureIn('studentModal');
      const cards = await evalJs("document.querySelectorAll('#guardianList .guardian-card').length");
      if (!sm || sm.length < 10 || !cards) {
        check('the student editor opened with a guardian card, so there is something to measure',
          false, 'controls found = ' + (sm ? sm.length : 'panel never opened')
            + ', guardian cards = ' + cards);
      } else {
        check('every control in the student editor measures >=44px, the notes box and guardian card included',
          sm.every(m => m.h >= 44 && m.w >= 44), report(sm));
      }

      /*
        The support panel, opened, with an accommodation card in it. Everything in it is inside a
        block that is `.hidden` until a deliberate tap, where it measures 0x0 and every sweep above
        skips it — and two of its controls are shapes nobody sets the height of by accident: a
        <select>, which measureIn's own selector does not even name, and an <input type="date">,
        which is the control the term editor already had to be told about twice.
      */
      const revealable = await has('#studentModal [data-supports-reveal]');
      if (!revealable) {
        check('the support panel opened with an accommodation card, so there is something to measure',
          false, 'no [data-supports-reveal] control in the student editor');
      } else {
        await clickSel('#studentModal [data-supports-reveal]');
        await new Promise(r => setTimeout(r, 200));
        const noCard = await evalJs(
          "document.querySelectorAll('#accommodationList .accommodation-card').length === 0");
        if (noCard) await clickSel('#studentModal [data-accommodation-add]');
        await new Promise(r => setTimeout(r, 200));
        const spm = await evalJs(`(function(){ var b = document.getElementById('supportsBody');
          if (!b || b.classList.contains('hidden')) return null;
          return Array.prototype.slice.call(
            b.querySelectorAll('button, input, textarea, select'))
            .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
            .map(function(e){ var r = e.getBoundingClientRect();
              return { t:(e.className || e.tagName), w:Math.round(r.width*100)/100,
                       h:Math.round(r.height*100)/100 }; }); })()`);
        const selects = await evalJs(
          "document.querySelectorAll('#accommodationList [data-support-kind]').length");
        if (!spm || spm.length < 8 || !selects) {
          check('the support panel opened with an accommodation card, so there is something to measure',
            false, 'controls found = ' + (spm ? spm.length : 'panel never opened')
              + ', kind pickers = ' + selects);
        } else {
          check('every control in the support panel measures >=44px, the kind picker and review date included',
            spm.every(m => m.h >= 44 && m.w >= 44), report(spm));
        }
      }
      /* The support dot on the roster row behind this dialog is a `.support-dot` button and is
         measured by the roster-panel sweep above, which collects every button in that overlay. It
         is named here so that a reader looking for it does not conclude it was missed. */
    }

    await closeStack();
    await clickSel('header [data-teacher-panel]');
    await new Promise(r => setTimeout(r, 300));
    const tp = await measureIn('teacherModal');
    if (!tp || tp.length < 5) {
      check('the teacher panel opened, so there is something to measure', false,
        'controls found = ' + (tp ? tp.length : 'panel never opened'));
    } else {
      check('every control on the teacher panel measures >=44px on a coarse pointer',
        tp.every(m => m.h >= 44 && m.w >= 44), report(tp));
    }
    await closeStack();
    if (fullest.was) await evalJs('window.planbook.classes.selectClass('
      + JSON.stringify(fullest.was) + ');1');
  }

  /*
    THE REGISTRY, which is the one screen in this app whose touch targets are the feature.

    It carries more controls than everything measured above put together — one per student per day,
    and a class is a hundred and fifty-six of them — and each one is a single glyph, which is the
    shape shell.css's coarse block already had to be told about twice (`.cls-tab`,
    `.class-action-btn`): a one-glyph button given 44px of height and its natural width is half a
    touch target, so min-WIDTH is asserted here as hard as min-height.

    The card's own control is measured too, and it is measured before the view swaps, because it is
    the control that swaps it: a home screen whose route into attendance is a 20px strip is a home
    screen unusable on the device it was built for. Since WO-1.13 that is ONE control per card
    rather than two — the state line inside it reports and is not tapped — so what is asserted is
    that every card carries exactly one button and that it is a target.
  */
  if (seam && await has('#homeGrid .class-card-open')) {
    /* Remembered here rather than borrowed from the block above, whose `fullest` is scoped to it.
       Opening the registry moves the selection — that is the whole point of the control —
       and the overflow sweep below measures the term nav of whatever is open. */
    const openWas = await evalJs('window.planbook.classes.getSelectedClassId()');
    await evalJs("(function(){ ['rosterModal','studentModal','classesModal',"
      + "'teacherModal','backupModal','yearModal','aboutModal']"
      + ".forEach(function(m){ window.planbook.closeModal(m); }); return 1; })()");
    /* Back to the grid first, through the control a teacher taps: the section above leaves the app
       on a class, and a card measured while `#homeView` is hidden measures 0x0 — which is the shape
       of a green run that measured nothing (tools/README.md trap 3's lesson, one screen further
       in). */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));
    const cardBtns = await evalJs(`(function(){
      var cards = document.querySelectorAll('#homeGrid .class-card');
      var loose = 0;
      Array.prototype.forEach.call(cards, function(c){
        if (c.querySelectorAll('button').length !== 1) loose++; });
      return { cards: cards.length, oddCards: loose,
        btns: Array.prototype.slice.call(document.querySelectorAll('#homeGrid .class-card button'))
          .map(function(e){ var r = e.getBoundingClientRect();
            return { t: e.className, w: Math.round(r.width*100)/100, h: Math.round(r.height*100)/100 }; }) }; })()`);
    if (!cardBtns.cards || !cardBtns.btns.length) {
      check('the one control on a class card measures >=44px on a coarse pointer', false,
        'cards on the grid = ' + cardBtns.cards + ', controls found = ' + cardBtns.btns.length);
    } else {
      check('the one control on a class card measures >=44px on a coarse pointer, and there is exactly one per card',
        cardBtns.oddCards === 0 && cardBtns.btns.length === cardBtns.cards
          && cardBtns.btns.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + cardBtns.btns.length + ' control(s) on ' + cardBtns.cards + ' card(s), '
          + cardBtns.oddCards + ' card(s) not carrying exactly one; under = '
          + JSON.stringify(cardBtns.btns.filter(m => m.h < 44 || m.w < 44)));
    }

    /* Onto the class with the biggest roster, found rather than assumed, for the reason the roster
       block above gives: measuring a class with no students would report green having measured two
       class-level buttons and no marks at all. */
    const biggest = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var best = null, n = -1;
      doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
        var len = c.roster ? c.roster.length : 0;
        if (len > n) { n = len; best = c.id; } });
      return { id: best, students: n }; })()`);
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + biggest.id + '"]');
    await new Promise(r => setTimeout(r, 300));
    const am = await evalJs(`(function(){ var m = document.getElementById('classView');
      if (!m || m.classList.contains('hidden')) return null;
      return Array.prototype.slice.call(m.querySelectorAll('button, input, select, textarea'))
        .filter(function(e){ var r = e.getBoundingClientRect(); return r.width || r.height; })
        .map(function(e){ var r = e.getBoundingClientRect();
          return { t: (e.className || e.tagName), w: Math.round(r.width*100)/100,
                   h: Math.round(r.height*100)/100 }; }); })()`);
    const cellCount = await evalJs(
      "document.querySelectorAll('#attendanceBody [data-attendance-cell]').length");
    const dayCount = await evalJs(
      "document.querySelectorAll('#attendanceHead th[data-attendance-col]').length");
    if (!am || cellCount < 25) {
      check('the registry opened with a class on it, so there is something to measure', false,
        'controls found = ' + (am ? am.length : 'the class view never came up') + ', tappable cells = '
          + cellCount + ' for a roster of ' + biggest.students);
    } else {
      check('every control on the registry measures >=44px on a coarse pointer, cells and column heads alike',
        am.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + am.length + ' (' + cellCount + ' of them cells in ' + dayCount
          + ' day column(s), for a roster of ' + biggest.students + '); under = '
          + JSON.stringify(am.filter(m => m.h < 44 || m.w < 44)));
    }
    /*
      THE ⌨ DOOR, BY NAME AND WITH THE SPILL MEASURED (WO-2.5). The sweep above already reads every
      control in `#classView`, so this adds nothing to the 44px claim — what it adds is the OTHER
      half, which is the lesson the first iPad sitting sent back on 2026-08-08: "Days off" cleared
      44px in both directions and still spilled through its own border, because a `nowrap` button
      can be narrower than its own label. `⌨ Keys` is the same shape — a glyph and a word in a flex
      row — so it gets the same measurement, `scrollWidth` against `clientWidth`, which is the
      defect itself rather than a proxy for it.
    */
    const keysDoor = await evalJs(`(function(){
      var b = document.querySelector('#classView [data-modal-open="attendanceKeysModal"]');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
               spill: b.scrollWidth - b.clientWidth }; })()`);
    check('the ⌨ shortcuts door measures >=44px on a coarse pointer and does not spill through its '
      + 'own border',
      !!keysDoor && keysDoor.h >= 44 && keysDoor.w >= 44 && keysDoor.spill <= 0,
      JSON.stringify(keysDoor));

    /* AND THE 🖨 DOOR BESIDE IT (WO-2.6), measured the same way and for the same reason: it is the
       third button of that exact shape to land in this toolbar — a glyph, a word, `nowrap`, in a
       flex row — and that shape is what cleared 44px in both directions on the owner's iPad and
       still spilled through its own border. The sweep above already has it in the 44px claim; this
       is the half a size measurement cannot see. The identity block is measured beside it, because
       a student's name became a control at the same work order and it is the one control on this
       screen whose 44px is bought with padding rather than with a box. */
    const recordDoor = await evalJs(`(function(){
      var b = document.querySelector('#classView [data-attendance-record]');
      var n = document.querySelector('#attendanceBody [data-attendance-history]');
      var read = function(e){ if (!e) return null; var r = e.getBoundingClientRect();
        return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
                 spill: e.scrollWidth - e.clientWidth }; };
      return { door: read(b), name: read(n),
        names: document.querySelectorAll('#attendanceBody [data-attendance-history]').length }; })()`);
    check('the 🖨 record door and a student\'s name both measure >=44px on a coarse pointer, and the '
      + 'door does not spill through its own border',
      !!recordDoor.door && recordDoor.door.h >= 44 && recordDoor.door.w >= 44
        && recordDoor.door.spill <= 0
        && !!recordDoor.name && recordDoor.name.h >= 44 && recordDoor.name.w >= 44
        && recordDoor.names >= 25,
      'door ' + JSON.stringify(recordDoor.door) + ', one name of ' + recordDoor.names + ' '
        + JSON.stringify(recordDoor.name));

    /*
      And six columns of 44px cells still fit, on the device this screen is for. This is the desk
      half of acceptance line 2 — the line itself needs the owner's own iPad in the orientation she
      holds it, and no emulator has that — but a grid that already wants a sideways swipe under an
      emulated coarse pointer at 1024px would fail it on any device. Measured three ways, because a
      grid can escape in three: past its own box, past the panel, and past the page.
    */
    const spill = await evalJs(`(function(){
      var wrap = document.getElementById('attendanceGridWrap');
      var rows = Array.prototype.slice.call(document.querySelectorAll('#attendanceBody tr'));
      var panel = document.querySelector('#classView .attendance-panel');
      if (!wrap || !rows.length || !panel) return null;
      var pr = panel.getBoundingClientRect();
      return { rows: rows.length,
               days: document.querySelectorAll('#attendanceHead th[data-attendance-col]').length,
               over: rows.filter(function(r){ var b = r.getBoundingClientRect();
                 return b.right > pr.right + 0.5 || b.left < pr.left - 0.5; }).length,
               wrapOver: wrap.scrollWidth - wrap.clientWidth,
               scrollW: document.documentElement.scrollWidth, inner: window.innerWidth }; })()`);
    check('six days of columns for a full class fit the panel with no sideways scroll anywhere',
      !!spill && spill.days === 6 && spill.over === 0 && spill.wrapOver <= 0
        && spill.scrollW <= spill.inner,
      spill ? spill.rows + ' row(s) across ' + spill.days + ' day column(s), ' + spill.over
        + ' wider than the panel, grid over its own box by ' + spill.wrapOver + 'px; page '
        + spill.scrollW + 'px in a ' + spill.inner + 'px viewport' : 'no rows to measure');
    /* Back to the grid through the control again rather than through the seam — and the selection
       restored under it, because the overflow sweep below measures the term nav of whatever class
       is open. selectClass() navigates since WO-1.13, so the order is: leave, then select. */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    if (openWas) await evalJs('window.planbook.classes.selectClass('
      + JSON.stringify(openWas) + ');1');
  }

  /*
    Presentation mode's two controls, and the reason they need their own block: one of them does
    not exist in the state that matters. The strip under the header is only on screen while the
    mode is ON, where the sweep at the top of this section has already run and where an off strip
    measures 0x0 and is skipped — the same shape as every modal above, with the switch standing in
    for the opener. So the mode goes on, both controls are measured, and it goes off again, because
    a run that walked away leaving support data suppressed would take the fixtures of everything
    after it with it.
  */
  if (seam && await has('header [data-presentation-toggle]')) {
    await clickSel('header [data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 200));
    const pm = await evalJs(`(function(){
      var strip = document.getElementById('presentationStrip');
      if (!strip || strip.classList.contains('hidden')) return null;
      var out = [];
      Array.prototype.forEach.call(
        document.querySelectorAll('#presentationBtn, #presentationStrip button'), function(e){
          var r = e.getBoundingClientRect();
          out.push({ t: (e.id || e.className || e.tagName), w: Math.round(r.width * 100) / 100,
                     h: Math.round(r.height * 100) / 100 }); });
      return out; })()`);
    if (!pm || pm.length < 2) {
      check('presentation mode turned on, so its two controls are on screen to be measured',
        false, 'controls found = ' + (pm ? pm.length : 'the strip never appeared'));
    } else {
      check('the presentation toggle and the strip\'s own button both measure >=44px on a coarse pointer',
        pm.every(m => m.h >= 44 && m.w >= 44),
        'measured ' + pm.length + '; under = ' + JSON.stringify(pm.filter(m => m.h < 44 || m.w < 44)));
    }
    await clickSel('#presentationStrip [data-presentation-toggle]');
    await new Promise(r => setTimeout(r, 200));
    const leftOff = await evalJs('window.planbook.supports.supportsVisible()');
    check('and the run leaves presentation mode off, so nothing after this measures a suppressed app',
      leftOff === true, 'supportsVisible() = ' + leftOff);
  }

  if (await has('[data-backup-panel]')) {
    /* The boot-failure exit is the one control that cannot be measured here: it only exists on
       screen when boot has failed, and this section needs an app that booted. Its rule is read
       instead — weaker than a measurement, and said so, but it still catches the control being
       added without its line in the touch pass. */
    const exitRule = await evalJs(`(function(){ var b = document.querySelector('.loading-error-btn');
      return b ? getComputedStyle(b).minHeight : null; })()`);
    check('the boot-failure exit button declares 44px under a coarse pointer (rule, not a measurement)',
      parseFloat(exitRule) >= 44, 'computed min-height = ' + exitRule);
    if (seam) {
      await evalJs("window.planbook.backup.cancelRestore();"
        + "window.planbook.closeModal('backupModal');1");
    }
  }
}
}
