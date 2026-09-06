/* date-clear.mjs — the Clear beside every date field (WO-1.48)
 *
 * WO-1.47 stopped the app eating the field a teacher was typing into. It did not remove the reason
 * it could: a native `<input type="date">` reports `value === ''` both for *mid-typing, not yet a
 * complete date* and for *deliberately emptied*, and hands the page nothing to tell them apart. So
 * every version of the picker reset that hung off an EVENT was guessing, and this row replaced the
 * guess with a control — ten Clear buttons on five surfaces, and no code path that infers a clear
 * from a value at all.
 *
 * WHY THIS IS ITS OWN FILE AND NOT MORE LINES IN `date-zero-key.mjs`, which is next door and is
 * about the same repair one work order earlier. That file drives a KEYSTROKE and asserts that
 * nothing happens; this one drives a BUTTON and asserts that something does, across five dialogs it
 * has to walk to in turn. They also fail for different reasons: a red line there is a rebuild that
 * has crept back onto an event, and a red line here is a Clear that is missing, wired to the wrong
 * field, or writing the wrong thing. `ls tools/verify/` is the index (`tools/README.md` § "Where a
 * new check goes") and *the date clear* is what a reader will look for.
 *
 * WHAT IS DRIVEN, AND WHAT IS COUNTED. All ten Clears are COUNTED, surface by surface, and the
 * census at the foot of the run is the check that carries the work order's first acceptance line —
 * two in the assignment editor, two in the term editor, one on the roster's supports panel, two in
 * the days-off form and three in the events form. FIVE of them are PRESSED, one per surface,
 * because the five surfaces differ in what a press has to do and not in how the button is wired:
 * three write an empty value to the year document (an assignment date, a term date, a review date)
 * and two are forms that have not been submitted yet and must write nothing at all. Pressing a
 * second button on a surface would re-assert the routing and nothing else.
 *
 * WHICH BUTTON IS PRESSED IS RESOLVED IN THE PAGE, NOT IN A SELECTOR. `nth-of-type` over a row of
 * field wrappers is exactly the shape that keeps passing while it addresses the wrong one of two
 * identical controls, and "the Clear cleared the other field" is a failure that reads as a pass on
 * every clause but one. So the index is found by walking up from the FIELD to the wrapper the pair
 * shares — which is what the app itself does — and a run that cannot find it fails the precondition
 * rather than clicking whatever came first.
 *
 * THE 44px IS MEASURED HERE FOR THE ASSIGNMENT EDITOR ONLY, and that is a division of labour rather
 * than an omission. `tools/verify/touch-targets.mjs` already opens the term editor, the student
 * editor's support panel, the days-off panel and the events panel on a coarse pointer and measures
 * every `button` inside each, so eight of the ten arrived covered on the day they were added. It
 * does not open the assignment editor, so the two Clears in there are measured below. The 👤 line
 * that asks whether all ten are reachable under a THUMB, in portrait, is not closed by any of this.
 *
 * EVERY FIXTURE CARRIES A REAL DATE BEFORE IT IS CLEARED, and deliberately not today. An empty field
 * cleared is a check that cannot fail, and three of the five surfaces read their value back out of
 * the document, so a fixture that never planted one would be comparing '' to ''.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, openCalendarPanel, KILL_ANIM,
  waitForBoot, seam } = h;

console.log('\n--- the Clear beside every date field (WO-1.48) ---');
{
  if (!seam) {
    /* Seven skips for the seven checks below, so a run without the seam is a run that says which
       lines it did not take rather than one that is quietly shorter. */
    const why = 'no window.planbook seam on the page — it is kept deliberately so this file can '
      + 'read what a control wrote, so its absence is a defect and not a stage of the build';
    skip('the WO-1.48 fixture is on screen: an assignment editor open on a complete due date, on a coarse pointer', why);
    skip('the assignment editor\'s Clear empties the field, writes the empty date, and leaves a live element in the panel', why);
    skip('both of the assignment editor\'s Clears measure >=44px on a coarse pointer', why);
    skip('the term editor\'s Clear empties the field and writes the empty term date', why);
    skip('the review date\'s Clear empties the field and writes the empty date, with the support panel still revealed', why);
    skip('the days-off form\'s Clear empties the field and leaves a live element, and writes NOTHING to the year document', why);
    skip('the events form\'s Clear empties the repeat-until field and leaves a live element', why);
    skip('ten Clear buttons across the five surfaces, each inside a wrapper holding exactly one date input', why);
  } else {
    /* 1024 wide with a coarse pointer, which is the shape `date-zero-key.mjs` uses next door and
       for its reasons: 44px lives in `@media (pointer: coarse)` so the pointer has to be really
       coarse (tools/README.md trap 3), and a click at 390px does not land where
       getBoundingClientRect aimed it. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    /* The pointer parked in a corner before anything is measured — trap 7. */
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });

    const coarse = await evalJs("matchMedia('(pointer: coarse)').matches");

    /* One class, one term with both dates set, one assignment with both dates set, and one student
       carrying a review date. */
    const plant = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      if (!s || !c || !s.getDoc()) return { ok:false, why:'no year document is open' };
      var was = c.getSelectedClassId();
      s.update(function(doc){
        doc.classes.push({ id:'c_wo148', name:'WO-1.48 Clear', archived:false,
          terms:[{ id:'tm_wo148', label:'WO-1.48 Term', start:'2026-11-16', end:'2026-11-20' }],
          categories:[{ id:'k_wo148', name:'Tests', weight:100 }],
          roster: ['s_wo148'] });
        doc.students.push({ id:'s_wo148', first:'Wilhelmina', last:'Clearwater', nickname:'',
          gradYear:'', email:'', phone:'', phone2:'', notes:'', guardians:[],
          supports:{ plan:'IEP', caseManager:{ name:'', email:'' }, reviewDate:'2026-11-16',
            accommodations:[], medical:'', behaviorPlan:'', attendanceClause:'' } });
        doc.assignments.push({ id:'a_wo148', classId:'c_wo148', termId:'tm_wo148',
          categoryId:'k_wo148', name:'The one with the dates', points:50,
          assigned:'2026-11-16', due:'2026-11-20' });
      });
      c.selectClass('c_wo148');
      return { ok:true, was: was }; })()`);

    if (!plant.ok) {
      check('the WO-1.48 fixture is on screen: an assignment editor open on a complete due date, on a coarse pointer',
        false, plant.why);
    } else {
      /* Counted as the walk goes, and asserted once at the end. A count taken per surface would be
         five checks that each pass while the app is missing buttons somewhere else. */
      const seen = {};

      /* WHICH of a surface's Clears is the one beside a given field, answered by walking up from the
         field to the wrapper the pair shares. -1 means "no Clear is about this field", which every
         caller below turns into a failing precondition rather than a click. */
      const clearIndex = (btnSel, fieldSel) => evalJs(`(function(){
        var btns = document.querySelectorAll(${JSON.stringify(btnSel)});
        var f = document.querySelector(${JSON.stringify(fieldSel)});
        if (!f) return -1;
        for (var i = 0; i < btns.length; i++) {
          var w = btns[i].closest('[data-date-field]');
          if (w && w.contains(f)) return i;
        }
        return -1; })()`);

      /*
        THE WITNESS IS AN EXPANDO PROPERTY AND NOT AN ATTRIBUTE, which is the opposite of the choice
        `date-zero-key.mjs` makes and is deliberate. Two of the five rebuilds here are
        `cloneNode(true)`, and a clone carries ATTRIBUTES — so an attribute witness would come
        through the rebuild intact and this check would pass over a field that was never replaced.
        A property is exactly what a clone drops and what a freshly built element never had. That
        file's own note predicts this trap from the other side.

        AND THE BUTTON IS WITNESSED TOO. "Leaves a live element in the panel" is the acceptance line,
        and half of what it is worth is that the control the teacher's finger is on survives: the
        reset replaces the INPUT, never the wrapper, or the Clear would be destroyed under the tap
        and the focus would go to <body> — which is the WO-1.47 symptom wearing new clothes.
      */
      const tag = (fieldSel, btnSel, idx) => evalJs(`(function(){
        var f = document.querySelector(${JSON.stringify(fieldSel)});
        var b = document.querySelectorAll(${JSON.stringify(btnSel)})[${idx}];
        if (!f || !b) return { ok:false, field:!!f, button:!!b };
        f.__wo148 = 'seeded';
        b.__wo148 = 'seeded';
        return { ok:true, value:f.value }; })()`);
      const read = (fieldSel, btnSel, idx) => evalJs(`(async function(){
        await window.planbook.store.flush();
        var f = document.querySelector(${JSON.stringify(fieldSel)});
        var b = document.querySelectorAll(${JSON.stringify(btnSel)})[${idx}];
        return {
          present: !!f, value: f ? f.value : null, type: f ? f.type : null,
          /* A fresh element has no expando, so this is "not the one that was pressed". */
          fresh: !!f && f.__wo148 !== 'seeded',
          /* And the button is the SAME one, which is the other half of the acceptance line. */
          sameButton: !!b && b.__wo148 === 'seeded',
          /* Rendered, rather than merely in the tree — a reset that left a display:none input
             behind would satisfy every clause above it. */
          drawn: !!f && f.getClientRects().length > 0
        }; })()`);
      const doc = () => evalJs(`(async function(){
        await window.planbook.store.flush();
        var d = window.planbook.store.getDoc();
        var a = (d.assignments || []).filter(function(x){ return x.id === 'a_wo148'; })[0] || {};
        var c = (d.classes || []).filter(function(x){ return x.id === 'c_wo148'; })[0] || {};
        var t = ((c.terms || [])[0]) || {};
        var s = (d.students || []).filter(function(x){ return x.id === 's_wo148'; })[0] || {};
        return { assigned:a.assigned, due:a.due, start:t.start, end:t.end,
                 reviewDate: (s.supports || {}).reviewDate,
                 events: (d.events || []).length }; })()`);

      /* ── SURFACE 1 OF 5: the assignment editor, opened the way a teacher opens it ── */
      await clickSel('#classTabBar [data-class-tab="c_wo148"]');
      await new Promise(r => setTimeout(r, 200));
      await clickSel('#classView [data-class-screen="assignments"]');
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#assignmentsView [data-assignment-edit="a_wo148"]');
      await new Promise(r => setTimeout(r, 250));

      const DUE = '#assignmentFields [data-assignment-field="due"]';
      const ASSIGN_CLEARS = '#assignmentFields [data-date-clear]';
      seen.assignment = await evalJs(
        'document.querySelectorAll(' + JSON.stringify(ASSIGN_CLEARS) + ').length');
      const dueIdx = await clearIndex(ASSIGN_CLEARS, DUE);
      const editorUp = await evalJs(`(function(){
        var m = document.getElementById('assignmentModal');
        var wraps = document.querySelectorAll('#assignmentFields [data-date-field]');
        return { open: !!m && !m.classList.contains('hidden'), wraps: wraps.length,
                 pairs: Array.prototype.map.call(wraps, function(w){
                   return w.querySelectorAll('input[type="date"]').length; }).join(','),
                 due: (document.querySelector(${JSON.stringify(DUE)}) || {}).value }; })()`);
      const before = await doc();

      /*
        THE PRECONDITION, ASSERTED RATHER THAN ASSUMED, because every way this section can be
        vacuous is silent: an editor that never opened has no button to press, a Clear that is not
        beside the field it is about clears the wrong one and still reports empty, and a pointer that
        never went coarse turns the 44px check below into the desktop pass.
      */
      check('the WO-1.48 fixture is on screen: an assignment editor open on a complete due date, on a coarse pointer',
        coarse === true && editorUp.open === true && editorUp.wraps === 2
          && editorUp.pairs === '1,1' && dueIdx >= 0
          && editorUp.due === '2026-11-20' && before.due === '2026-11-20',
        'coarse = ' + coarse + ', editor open = ' + editorUp.open + ', '
          + editorUp.wraps + ' date wrapper(s) holding ' + editorUp.pairs
          + ' input(s), Due\'s Clear is #' + dueIdx + ' of ' + seen.assignment + ', field '
          + JSON.stringify(editorUp.due) + ', document ' + JSON.stringify(before.due));

      if (dueIdx >= 0) {
        await tag(DUE, ASSIGN_CLEARS, dueIdx);
        await clickSel(ASSIGN_CLEARS, dueIdx);
        await new Promise(r => setTimeout(r, 250));
      }
      const dueAfter = await read(DUE, ASSIGN_CLEARS, Math.max(dueIdx, 0));
      const docAfterDue = await doc();
      check('the assignment editor\'s Clear empties the field, writes the empty date, and leaves a live element in the panel',
        dueIdx >= 0
          && dueAfter.present === true && dueAfter.value === '' && dueAfter.type === 'date'
          && dueAfter.fresh === true && dueAfter.drawn === true
          && dueAfter.sameButton === true
          && docAfterDue.due === ''
          /* The OTHER date on the same surface is untouched, which is what says the button is wired
             to the field it sits beside rather than to the first one it finds. */
          && docAfterDue.assigned === '2026-11-16',
        'field ' + JSON.stringify(dueAfter.value) + ' (drawn = ' + dueAfter.drawn
          + ', a new element = ' + dueAfter.fresh + ', same button = ' + dueAfter.sameButton
          + '), document due = ' + JSON.stringify(docAfterDue.due) + ', assigned = '
          + JSON.stringify(docAfterDue.assigned));

      /*
        44px, on the two Clears the standing coarse sweep does not reach — see the header. Measured
        on the controls that are on screen right now and on a pointer that really is coarse.
      */
      const boxes = await evalJs(`(function(){
        return Array.prototype.map.call(
          document.querySelectorAll(${JSON.stringify(ASSIGN_CLEARS)}),
          function(b){ var r = b.getBoundingClientRect();
            return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
                     /* The "Days off" lesson: a button can clear 44px in both directions and still
                        be narrower than the words inside it. */
                     spill: b.scrollWidth > b.clientWidth + 1 }; }); })()`);
      check('both of the assignment editor\'s Clears measure >=44px on a coarse pointer',
        coarse === true && boxes.length === 2
          && boxes.every(b => b.h >= 44 && b.w >= 44 && !b.spill),
        'coarse = ' + coarse + ', boxes = ' + JSON.stringify(boxes));

      await evalJs("window.planbook.closeModal('assignmentModal'); 1");
      await new Promise(r => setTimeout(r, 150));

      /*
        ── SURFACE 2 OF 5: the term editor, through the class manager's own Terms button ──

        Addressed by class id rather than by row position: this fixture's class is appended to the
        end of a list several other sections have already grown, and `nth-child` over that list is a
        number nobody is maintaining.
      */
      await clickVisible('[data-class-manage]');
      await new Promise(r => setTimeout(r, 300));
      await clickSel('#classList [data-term-manage="c_wo148"]');
      await new Promise(r => setTimeout(r, 300));
      const START = '#termList [data-term-field="start"]';
      const TERM_CLEARS = '#termList [data-date-clear]';
      seen.term = await evalJs(
        'document.querySelectorAll(' + JSON.stringify(TERM_CLEARS) + ').length');
      const startIdx = await clearIndex(TERM_CLEARS, START);
      const termSeeded = startIdx >= 0 ? await tag(START, TERM_CLEARS, startIdx) : { ok: false };
      if (startIdx >= 0) {
        await clickSel(TERM_CLEARS, startIdx);
        await new Promise(r => setTimeout(r, 250));
      }
      const startAfter = await read(START, TERM_CLEARS, Math.max(startIdx, 0));
      const docAfterStart = await doc();
      check('the term editor\'s Clear empties the field and writes the empty term date',
        startIdx >= 0 && termSeeded.ok === true && termSeeded.value === '2026-11-16'
          && startAfter.present === true && startAfter.value === '' && startAfter.type === 'date'
          && startAfter.fresh === true && startAfter.drawn === true
          && startAfter.sameButton === true
          && docAfterStart.start === '' && docAfterStart.end === '2026-11-20',
        'Starts\' Clear is #' + startIdx + ' of ' + seen.term + ', field held '
          + JSON.stringify(termSeeded.value) + ' and now holds '
          + JSON.stringify(startAfter.value) + ' (drawn = ' + startAfter.drawn
          + ', a new element = ' + startAfter.fresh + ', same button = ' + startAfter.sameButton
          + '), document start = ' + JSON.stringify(docAfterStart.start) + ', end = '
          + JSON.stringify(docAfterStart.end));
      await evalJs("(function(){ ['termsModal','classesModal'].forEach(function(m){"
        + ' window.planbook.closeModal(m); }); return 1; })()');
      await new Promise(r => setTimeout(r, 150));

      /*
        ── SURFACE 3 OF 5: the roster's review date, which is the accommodation-adjacent one ──

        The editor is opened through the seam, which is the same call the roster row's Edit makes —
        `tools/verify/support-details.mjs` opens it that way too, and reaching this student's row by
        position would be the maintained number the block above refuses. The PANEL is revealed by the
        real control rather than by un-hiding it, because that reveal is what `supportsVisible()`
        gates: a field measured in a state the app never puts it in is a new way to be green and
        wrong, and a run with presentation mode somehow on has to fail here rather than quietly
        measure a panel nobody can see.
      */
      await evalJs("window.planbook.roster.openStudentEditor('s_wo148'); 1");
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#studentModal [data-supports-reveal]');
      await new Promise(r => setTimeout(r, 250));
      const REVIEW = '#supportsReviewDate';
      const REVIEW_CLEARS = '#supportsBody [data-date-clear]';
      seen.review = await evalJs(
        'document.querySelectorAll(' + JSON.stringify(REVIEW_CLEARS) + ').length');
      const reviewIdx = await clearIndex(REVIEW_CLEARS, REVIEW);
      const revealed = reviewIdx >= 0 ? await tag(REVIEW, REVIEW_CLEARS, reviewIdx) : { ok: false };
      if (reviewIdx >= 0) {
        await clickSel(REVIEW_CLEARS, reviewIdx);
        await new Promise(r => setTimeout(r, 250));
      }
      const reviewAfter = await read(REVIEW, REVIEW_CLEARS, Math.max(reviewIdx, 0));
      const docAfterReview = await doc();
      const stillRevealed = await evalJs(`(function(){
        var b = document.getElementById('supportsBody');
        return !!b && !b.classList.contains('hidden'); })()`);
      check('the review date\'s Clear empties the field and writes the empty date, with the support panel still revealed',
        reviewIdx >= 0 && revealed.ok === true && revealed.value === '2026-11-16'
          && reviewAfter.present === true && reviewAfter.value === ''
          && reviewAfter.type === 'date' && reviewAfter.fresh === true
          && reviewAfter.drawn === true && reviewAfter.sameButton === true
          && docAfterReview.reviewDate === '' && stillRevealed === true,
        'field held ' + JSON.stringify(revealed.value) + ' and now holds '
          + JSON.stringify(reviewAfter.value) + ' (drawn = ' + reviewAfter.drawn
          + ', a new element = ' + reviewAfter.fresh + ', same button = ' + reviewAfter.sameButton
          + '), document = ' + JSON.stringify(docAfterReview.reviewDate) + ', panel revealed = '
          + stillRevealed);
      await evalJs("window.planbook.closeModal('studentModal'); 1");
      await new Promise(r => setTimeout(r, 150));

      /*
        ── SURFACE 4 OF 5: the days-off form, where the press must write NOTHING ──

        These two fields are a form that has not been submitted. `doc.events` is counted either side
        of the press for that reason: a Clear that wrote to the year here would be authoring a
        calendar exception out of a teacher changing her mind about one she had not added yet.
      */
      await openCalendarPanel('[data-dayoff-panel]');
      const FROM = '#daysOffFrom';
      const DAYOFF_CLEARS = '#daysOffModal [data-date-clear]';
      seen.daysOff = await evalJs(
        'document.querySelectorAll(' + JSON.stringify(DAYOFF_CLEARS) + ').length');
      /* Set through the real event the picker fires, so `to` follows `from` exactly as it does for
         a teacher and the fixture is a form in a state the app really produces. */
      await evalJs(`(function(){
        var f = document.getElementById('daysOffFrom');
        if (!f) return 0;
        f.value = '2026-11-16';
        f.dispatchEvent(new Event('change', { bubbles: true }));
        return 1; })()`);
      await new Promise(r => setTimeout(r, 200));
      const beforeDayOff = await doc();
      const fromIdx = await clearIndex(DAYOFF_CLEARS, FROM);
      const dayOffSeeded = fromIdx >= 0 ? await tag(FROM, DAYOFF_CLEARS, fromIdx) : { ok: false };
      if (fromIdx >= 0) {
        await clickSel(DAYOFF_CLEARS, fromIdx);
        await new Promise(r => setTimeout(r, 250));
      }
      const fromAfter = await read(FROM, DAYOFF_CLEARS, Math.max(fromIdx, 0));
      const afterDayOff = await doc();
      const toKept = await evalJs("(document.getElementById('daysOffTo') || {}).value");
      check('the days-off form\'s Clear empties the field and leaves a live element, and writes NOTHING to the year document',
        fromIdx >= 0 && dayOffSeeded.ok === true && dayOffSeeded.value === '2026-11-16'
          && fromAfter.present === true && fromAfter.value === ''
          && fromAfter.type === 'date' && fromAfter.fresh === true
          && fromAfter.drawn === true && fromAfter.sameButton === true
          && afterDayOff.events === beforeDayOff.events
          /* And the OTHER field on the same form kept the date `to` followed `from` into, which is
             the same "wired to its own field" clause the assignment editor makes. */
          && toKept === '2026-11-16',
        'field held ' + JSON.stringify(dayOffSeeded.value) + ' and now holds '
          + JSON.stringify(fromAfter.value) + ' (drawn = ' + fromAfter.drawn + ', a new element = '
          + fromAfter.fresh + ', same button = ' + fromAfter.sameButton + '), To = '
          + JSON.stringify(toKept) + ', doc.events ' + beforeDayOff.events + ' -> '
          + afterDayOff.events);
      await evalJs("window.planbook.closeModal('daysOffModal'); 1");
      await new Promise(r => setTimeout(r, 150));

      /*
        ── SURFACE 5 OF 5: the events form, and the field with the widest caption of the ten ──

        `Repeat weekly until` is the one whose row cannot hold a caption, a 160px field and a 44px
        button on one line at phone width, so it is the one whose Clear is worth pressing rather
        than one of the two beside it.
      */
      await openCalendarPanel('[data-events-panel]');
      const UNTIL = '#eventUntil';
      const EVENT_CLEARS = '#eventsModal [data-date-clear]';
      seen.events = await evalJs(
        'document.querySelectorAll(' + JSON.stringify(EVENT_CLEARS) + ').length');
      await evalJs(`(function(){
        var f = document.getElementById('eventUntil');
        if (!f) return 0;
        f.value = '2026-11-20';
        f.dispatchEvent(new Event('change', { bubbles: true }));
        return 1; })()`);
      await new Promise(r => setTimeout(r, 200));
      const beforeEvent = await doc();
      const untilIdx = await clearIndex(EVENT_CLEARS, UNTIL);
      const eventSeeded = untilIdx >= 0 ? await tag(UNTIL, EVENT_CLEARS, untilIdx) : { ok: false };
      if (untilIdx >= 0) {
        await clickSel(EVENT_CLEARS, untilIdx);
        await new Promise(r => setTimeout(r, 250));
      }
      const untilAfter = await read(UNTIL, EVENT_CLEARS, Math.max(untilIdx, 0));
      const afterEvent = await doc();
      check('the events form\'s Clear empties the repeat-until field and leaves a live element',
        untilIdx >= 0 && eventSeeded.ok === true && eventSeeded.value === '2026-11-20'
          && untilAfter.present === true && untilAfter.value === ''
          && untilAfter.type === 'date' && untilAfter.fresh === true
          && untilAfter.drawn === true && untilAfter.sameButton === true
          && afterEvent.events === beforeEvent.events,
        'Repeat-until\'s Clear is #' + untilIdx + ' of ' + seen.events + ', field held '
          + JSON.stringify(eventSeeded.value) + ' and now holds '
          + JSON.stringify(untilAfter.value) + ' (drawn = ' + untilAfter.drawn
          + ', a new element = ' + untilAfter.fresh + ', same button = ' + untilAfter.sameButton
          + '), doc.events ' + beforeEvent.events + ' -> ' + afterEvent.events);
      await evalJs("window.planbook.closeModal('eventsModal'); 1");
      await new Promise(r => setTimeout(r, 150));

      /*
        ── AND THE CENSUS, WHICH IS THE WORK ORDER'S FIRST ACCEPTANCE LINE ──

        Ten, in the shape the work order enumerates them: 2 + 2 + 1 + 2 + 3. It is one check and not
        five for the reason the work order itself records against a hand-typed number — five
        per-surface checks each go green over a surface that is complete while buttons are missing
        somewhere else, and the total is the only thing that says the fix is whole. The counts were
        taken as each surface was open, because four of the ten do not exist until a dialog builds
        them.

        The second clause is about WIRING rather than presence: every Clear on the page sits inside a
        `[data-date-field]` wrapper holding exactly one date input, which is what makes
        clearDateField()'s one rule serve all ten. A Clear in a wrapper holding two fields would
        clear whichever came first, on every surface, silently.
      */
      const total = (seen.assignment || 0) + (seen.term || 0) + (seen.review || 0)
        + (seen.daysOff || 0) + (seen.events || 0);
      const wrappers = await evalJs(`(function(){
        var bad = [];
        Array.prototype.forEach.call(document.querySelectorAll('[data-date-clear]'), function(b){
          var w = b.closest('[data-date-field]');
          var n = w ? w.querySelectorAll('input[type="date"]').length : 0;
          if (n !== 1) bad.push((b.getAttribute('aria-label') || '(unlabelled)') + ': ' + n);
        });
        return { seen: document.querySelectorAll('[data-date-clear]').length, bad: bad }; })()`);
      check('ten Clear buttons across the five surfaces, each inside a wrapper holding exactly one date input',
        total === 10 && seen.assignment === 2 && seen.term === 2 && seen.review === 1
          && seen.daysOff === 2 && seen.events === 3 && wrappers.bad.length === 0,
        'assignment editor ' + seen.assignment + ', term editor ' + seen.term
          + ', supports panel ' + seen.review + ', days off ' + seen.daysOff
          + ', events ' + seen.events + ' = ' + total
          + ' :: of the ' + wrappers.seen + ' in the document with the dialogs shut, wrappers '
          + 'holding other than one date input: ' + JSON.stringify(wrappers.bad));

      /*
        The fixture comes back out — the class, its assignment and its student — and the class that
        was open before this block is put back under it. One update rather than the real Delete
        confirms, for the reason every teardown in this harness gives: a fixture coming down is not a
        claim being made.

        AND THE PAGE IS PUT BACK ON THE HOME VIEW, which the block above left on the calendar.
        Sections inherit each other's DOM state, and a run that handed the next one a month grid
        would be this file's own version of the days-off defect written up in tools/README.md. The
        door is checked for before it is clicked: clickVisible throws when nothing matches, and a
        throw here would be reported against this section rather than as the navigation it is.
      */
      await evalJs(`(async function(){
        var s = window.planbook.store, c = window.planbook.classes;
        if (!s.getDoc()) return 0;
        s.update(function(doc){
          doc.classes = doc.classes.filter(function(x){ return x.id !== 'c_wo148'; });
          doc.assignments = doc.assignments.filter(function(a){ return a.classId !== 'c_wo148'; });
          doc.students = doc.students.filter(function(x){ return x.id !== 's_wo148'; });
          Object.keys(doc.scores || {}).forEach(function(k){
            if (String(k).indexOf('a_wo148') === 0) delete doc.scores[k]; });
        });
        var was = ${JSON.stringify(plant.was || '')};
        if (was) c.selectClass(was);
        c.refreshClassBar();
        await s.flush();
        return 1; })()`);
      const homeDoor = await evalJs(`(function(){
        var all = document.querySelectorAll('[data-view-home]');
        for (var i = 0; i < all.length; i++) {
          var r = all[i].getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return true;
        }
        return false; })()`);
      if (homeDoor) await clickVisible('[data-view-home]');
    }
  }
}
}
