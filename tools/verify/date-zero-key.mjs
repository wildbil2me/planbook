/* date-zero-key.mjs — a `0` typed into a date field (WO-1.47)
 *
 * The regression check for the bug reported from the classroom on 2026-09-03, the second day of the
 * live term: typing `0` as the first digit of a due date emptied the field, discarded the date
 * already in it, and took the focus to `BODY`, so every keystroke after it went nowhere and the
 * assignment ended up with no due date and no error. `plans/known-bugs.md` § 1 is the measurement —
 * the mechanism, the segments it fires in, and the two repairs that were struck.
 *
 * WHY THIS IS ITS OWN FILE AND NOT MORE LINES IN `assigned-and-due.mjs`, which is named after the
 * very fields it drives. Three reasons, and the first is the one that would matter to a later hand.
 * The subject is the five date fields as a CLASS — the same rebuild was copied to the term dates,
 * the review date, the days-off range and the events form — so a check driving the term field
 * belongs beside these and would have nowhere obvious to go inside a file about WO-3.17. Second,
 * `assigned-and-due.mjs` ends its block at a 390px viewport, which is the width its own comment
 * spends a paragraph explaining that clicks miss at; appending here would mean either inheriting
 * that or resetting it inside another work order's teardown. Third, `ls tools/verify/` is the index
 * (`tools/README.md` § "Where a new check goes"), and *the zero key* is what a reader will look for.
 *
 * WHAT IS DRIVEN AND WHAT IS NOT. The assignment editor's *Due* field only. That is the field the
 * bug was reported against and the three Acceptance lines that name a keyboard all name it; the
 * other four sites are moved and read by hand, which is that work order's fourth line and is not a
 * thing a headless browser closes. The one 👤 line — clearing a date on the iPad and re-picking the
 * same day — is the case this guard KNOWINGLY gives up, and no run here says anything about it.
 *
 * THE FIELD IS SEEDED BEFORE IT IS TYPED INTO, AND THAT IS A HARNESS FACT RATHER THAN A CONVENIENCE.
 * `plans/known-bugs.md` § 1: synthetic digits into a BLANK `<input type="date">` produced the value
 * `0033-11-22` on a bare page in headed Edge and no events at all under `--headless=new`, while a
 * PREFILLED field is faithful — every measurement in that entry came out of `Input.dispatchKeyEvent`
 * against one. The prefilled field is also where the whole bug lives, since the data loss is the
 * discarding of a date that was already there. So every fixture below carries a real date first.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- a `0` typed into a date field (WO-1.47) ---');
{
  if (!seam) {
    skip('a `0` typed into an assignment date field keeps the element, the caret and the date',
      'no window.planbook seam on the page — it is kept deliberately so this file can read what a '
      + 'control wrote, so its absence is a defect and not a stage of the build');
  } else {
    /* The section before this one leaves the page at 390x844 with touch emulation on. Everything
       below clicks a control, so it comes back to the width where a click lands where
       getBoundingClientRect aimed it (tools/README.md trap 3 for why the coarse pointer stays, and
       `assigned-and-due.mjs`'s own note for why 390 is not a width to click at). */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);

    /* The pointer is parked in a corner before anything is measured — trap 7. Nothing here reads a
       colour, but the click that opens the editor lands on a row this section then re-reads, and a
       parked pointer costs one message. */
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });

    const plant = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      if (!s || !c || !s.getDoc()) return { ok:false, why:'no year document is open' };
      var was = c.getSelectedClassId();
      s.update(function(doc){
        doc.classes.push({ id:'c_wo147', name:'WO-1.47 Zero key', archived:false,
          terms:[{ id:'tm_wo147', label:'WO-1.47 Term', start:'', end:'' }],
          categories:[{ id:'k_wo147', name:'Tests', weight:100 }],
          roster: [] });
        /* A REAL DATE, AND DELIBERATELY NOT TODAY. The rebuild this work order moved reads its
           value out of the document, so a field that came back holding today would be
           indistinguishable from one that came back holding what it was seeded with. 2026-11-20
           also leads with a 1 in both segments, which is the safe digit — so nothing about the
           seed can be what makes a zero behave. (No backticks in this comment: it is inside a
           template literal, which is the trap assigned-and-due.mjs writes down at its own GEO
           reader and which cost this file one run.) */
        doc.assignments.push({ id:'a_wo147', classId:'c_wo147', termId:'tm_wo147',
          categoryId:'k_wo147', name:'The one with the date', points:50,
          assigned:'2026-11-20', due:'2026-11-20' });
      });
      c.selectClass('c_wo147');
      return { ok:true, was: was }; })()`);

    if (!plant.ok) {
      check('the WO-1.47 fixture is real: one assignment carrying a complete due date to type over',
        false, plant.why);
    } else {
      /*
        ONE KEY, AT THE PAGE. A printable key needs `keyDown` with `text` or `e.key` arrives as the
        raw code — the same shape and the same reason as `score-grid.mjs`'s `sk()`. It is dispatched
        at the page rather than at an element on purpose: what is under test is which element the
        browser thinks the caret is in, and addressing an element would answer that question for it.
      */
      const digit = async (d) => {
        const vk = 48 + Number(d);
        const ev = { key: String(d), code: 'Digit' + d, windowsVirtualKeyCode: vk,
          nativeVirtualKeyCode: vk, modifiers: 0, text: String(d), unmodifiedText: String(d) };
        await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown' }, ev));
        await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
        await new Promise(r => setTimeout(r, 60));
      };
      const type = async (digits) => { for (const d of String(digits)) await digit(d); };

      /*
        THE CARET DOES NOT GO HOME WHEN A FOCUSED FIELD IS RE-FOCUSED, and this cost a run. `focus()`
        on a date input that is NOT yet focused puts the caret on the leftmost segment, which is the
        month in this locale — that is why the single-`0` check below reads a month and not a year.
        `focus()` on one that is ALREADY focused is a no-op, and the caret is wherever the last
        keystroke left it: after `0` `9` completes a month, Chromium advances to the day on its own.

        So the second and third fixtures, which re-seed a field the run is already standing in,
        typed `09032026` into the DAY and then the YEAR and came back with a year of 32026 — a
        failure that reads exactly like the app writing the wrong date, which is the family every
        trap in tools/README.md belongs to. Three ArrowLefts walk the caret back to the leftmost
        segment and stop there; it is deterministic where a re-`focus()` is not.

        It is written up here rather than added to that numbered list, because that list's own rule
        is that an entry was hit and diagnosed twice by two different agents, and this has been hit
        once.
      */
      const caretHome = async () => {
        for (let i = 0; i < 3; i++) {
          const ev = { key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37,
            nativeVirtualKeyCode: 37, modifiers: 0 };
          await send('Input.dispatchKeyEvent', Object.assign({ type: 'rawKeyDown' }, ev));
          await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
          await new Promise(r => setTimeout(r, 40));
        }
      };

      /*
        THE IDENTITY WITNESS. `dateField()` builds a fresh element from four attributes and a value,
        and none of them is this one — so a token set here survives every reload of the same element
        and cannot survive a rebuild. That is the whole of "the SAME element", and it is a property
        of the element rather than of a count: the panel holds exactly one *Due* field either way, so
        counting them would pass over a rebuild without noticing.

        It is set through `setAttribute` rather than as an expando so that it is visible in the DOM
        while the fixture is being debugged, and that is the whole of the reason. It is sound HERE
        because the field this file drives is rebuilt by `dateField()`, which authors a new element
        from a fixed set of attributes and copies nothing across.

        BUT IT DOES NOT TRAVEL, and the trap is the opposite way round from the way it first reads.
        The roster's review date is rebuilt with `cloneNode(true)`, and a clone carries ATTRIBUTES
        and not properties — so an attribute witness would come through that rebuild intact and the
        check would pass over a rebuild without seeing it. If this file is ever pointed at
        `data-support-date`, the witness there has to be an expando property, which is exactly what a
        clone drops. *(Corrected 2026-09-03: this paragraph previously argued for `setAttribute`
        BECAUSE a clone carries attributes, which is the argument for the vacuous witness.)*
      */
      const OPEN_AND_TAG = `(function(){
        var f = document.querySelector('#assignmentFields [data-assignment-field="due"]');
        if (!f) return { ok:false };
        f.setAttribute('data-wo147-token', 'seeded');
        f.focus();
        return { ok:true, value:f.value, focused:document.activeElement === f }; })()`;

      const READ = `(async function(){
        await window.planbook.store.flush();
        var f = document.querySelector('#assignmentFields [data-assignment-field="due"]');
        var a = document.activeElement;
        var d = window.planbook.store.getDoc();
        var row = (d.assignments || []).filter(function(x){ return x.id === 'a_wo147'; })[0] || {};
        return {
          present: !!f,
          /* The token, and therefore whether this is the element that was seeded or a new one. */
          same: !!f && f.getAttribute('data-wo147-token') === 'seeded',
          value: f ? f.value : null,
          focused: !!f && a === f,
          /* Named rather than reduced to a boolean, because BODY is the reported symptom and a
             failure that says "not focused" would not distinguish it from the caret having moved to
             the next field. */
          active: a ? (a.tagName + (a.getAttribute && a.getAttribute('data-assignment-field')
            ? '[' + a.getAttribute('data-assignment-field') + ']' : '')) : '(nothing)',
          stored: { assigned: row.assigned, due: row.due },
          editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden')
        }; })()`;

      /* The editor, opened the way a teacher opens it. */
      await clickSel('#classTabBar [data-class-tab="c_wo147"]');
      await new Promise(r => setTimeout(r, 200));
      await clickSel('#classView [data-class-screen="assignments"]');
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#assignmentsView [data-assignment-edit="a_wo147"]');
      await new Promise(r => setTimeout(r, 250));
      const opened = await evalJs(OPEN_AND_TAG);
      const before = await evalJs(READ);

      /*
        THE PRECONDITION, ASSERTED RATHER THAN ASSUMED. Every check below reads a value out of this
        one field after pressing keys at it, and all three ways this block can be vacuous are silent:
        an editor that never opened has no field to type into, a field that never took focus swallows
        every key, and a seed that did not reach the element leaves the check comparing '' to ''.
      */
      check('the WO-1.47 fixture is on screen: the editor is open on an assignment whose Due field holds a complete date, and the caret is in that field',
        !!opened && opened.ok === true && opened.focused === true && before.editorOpen === true
          && before.value === '2026-11-20' && before.stored.due === '2026-11-20'
          && before.same === true,
        'editor open = ' + before.editorOpen + ', field = ' + JSON.stringify(before.value)
          + ', document = ' + JSON.stringify(before.stored) + ', caret in ' + before.active);

      /*
        ── ACCEPTANCE LINE 1 ──

        One `0`, which is the whole of the reported bug. Chromium blanks the month segment and waits
        for a second digit, firing `input` AND `change` on that empty read; the app used to rebuild
        the field on that `change`. Three things are asserted about the moment AFTER the `0` and
        before the segment is completed, because that is the moment the old build destroyed: the
        element carrying the token is still the one in the panel, the caret is still in it, and the
        assignment still has its date in the DOCUMENT.

        That third clause is the one worth being exact about. `editAssignmentField()` stores the
        empty read on `input` — a phantom empty date that lives for one keystroke, named at
        `assignmentDateCommitted()` and deliberately left alone by WO-1.47 — so this reads the store
        after a flush and asserts what a teacher would find, which is the date coming back. What it
        cannot claim is that no empty value was ever written; it claims the field survived to receive
        the commit that undid it, which is the property the whole repair rests on.
      */
      await digit('0');
      const afterZero = await evalJs(READ);
      await digit('9');
      const afterNine = await evalJs(READ);
      check('a `0` typed as the first digit of the month leaves the SAME element in the panel with the caret still in it, and the date is complete again once Chromium commits the second digit',
        afterZero.present && afterZero.same === true && afterZero.focused === true
          && afterNine.same === true && afterNine.focused === true
          && afterNine.value === '2026-09-20' && afterNine.stored.due === '2026-09-20',
        'after `0`: same element = ' + afterZero.same + ', caret in ' + afterZero.active
          + ', field ' + JSON.stringify(afterZero.value) + ', document '
          + JSON.stringify(afterZero.stored.due)
          + ' :: after `9`: same element = ' + afterNine.same + ', caret in ' + afterNine.active
          + ', field ' + JSON.stringify(afterNine.value) + ', document '
          + JSON.stringify(afterNine.stored.due));

      /*
        ── ACCEPTANCE LINE 2, THE DATA-LOSS HALF, ASSERTED SEPARATELY ──

        `09032026` end to end, which is what a teacher types this week. On the old build the first
        keystroke emptied the field and moved the focus to `BODY`, so the remaining seven digits went
        nowhere and the assignment was left with no due date at all — silently, which is what makes
        this the half that matters. The date is re-seeded first so that the run above cannot be what
        makes this one pass.
      */
      await evalJs(`(function(){
        var f = document.querySelector('#assignmentFields [data-assignment-field="due"]');
        if (!f) return 0;
        window.planbook.store.update(function(doc){
          doc.assignments.forEach(function(a){ if (a.id === 'a_wo147') a.due = '2026-11-20'; }); });
        f.value = '2026-11-20';
        f.setAttribute('data-wo147-token', 'seeded');
        f.focus();
        return 1; })()`);
      await new Promise(r => setTimeout(r, 120));
      await caretHome();
      await type('09032026');
      const typedFull = await evalJs(READ);
      check('typing a full `09032026` into that field leaves the assignment holding 2026-09-03 — the date the teacher typed, not an empty one and not the one she typed over',
        typedFull.value === '2026-09-03' && typedFull.stored.due === '2026-09-03'
          && typedFull.same === true,
        'field ' + JSON.stringify(typedFull.value) + ', document '
          + JSON.stringify(typedFull.stored.due) + ', same element = ' + typedFull.same
          + ', caret in ' + typedFull.active);

      /*
        ── ACCEPTANCE LINE 3, THE DAY SEGMENT, AND IT IS THE CASE THAT OUTLIVES SEPTEMBER ──

        `10032026` has a SAFE month — `1` commits as `01` and `0` takes it straight to `10`, with no
        empty read in between — and a `0` day. So a green line 2 with a red line 3 would mean the
        repair covers the month segment only, which is a build that looks fixed until October 1st and
        then goes on losing three dates in ten forever. The two are separate checks for exactly that
        reason; asserting them together would let either one carry the other.
      */
      await evalJs(`(function(){
        var f = document.querySelector('#assignmentFields [data-assignment-field="due"]');
        if (!f) return 0;
        window.planbook.store.update(function(doc){
          doc.assignments.forEach(function(a){ if (a.id === 'a_wo147') a.due = '2026-11-20'; }); });
        f.value = '2026-11-20';
        f.setAttribute('data-wo147-token', 'seeded');
        f.focus();
        return 1; })()`);
      await new Promise(r => setTimeout(r, 120));
      await caretHome();
      await type('10032026');
      const typedDay = await evalJs(READ);
      check('and typing `10032026` — a safe month with a `0` day — leaves the assignment holding 2026-10-03, which is the half of this bug that does not stop happening when September ends',
        typedDay.value === '2026-10-03' && typedDay.stored.due === '2026-10-03'
          && typedDay.same === true,
        'field ' + JSON.stringify(typedDay.value) + ', document '
          + JSON.stringify(typedDay.stored.due) + ', same element = ' + typedDay.same
          + ', caret in ' + typedDay.active);

      /*
        ── AND THE REBUILD IS STILL THERE, WHICH IS THE TRAP THIS WORK ORDER NAMES AGAINST ITSELF ──

        "Do not delete the rebuild outright. It is not dead code and it is not the bug; the bug is
        WHEN it runs." So this asserts both halves of the move in one sequence, and the two clauses
        fail in opposite directions:

          · the field is cleared and `change` is fired on it, and the element must SURVIVE — a build
            that put the rebuild back on `change` goes red here, and it is the same event shape
            `assigned-and-due.mjs` uses to imitate the picker's own Clear;
          · then the field is left, and the element must be GONE and its replacement empty — a build
            that deleted the rebuild rather than moving it goes red here, with nothing else in the
            harness able to notice, since a deleted rebuild breaks only a picker on hardware this run
            does not have.

        The field is left by focusing the *name* input above it, which is how a teacher leaves it.
        `blur()` would also fire `focusout`, and it would prove less: what has to work is the real
        sequence where focus arrives somewhere else.
      */
      await evalJs(`(function(){
        var f = document.querySelector('#assignmentFields [data-assignment-field="due"]');
        if (!f) return 0;
        f.setAttribute('data-wo147-token', 'seeded');
        f.focus();
        f.value = '';
        f.dispatchEvent(new Event('input', { bubbles: true }));
        f.dispatchEvent(new Event('change', { bubbles: true }));
        return 1; })()`);
      await new Promise(r => setTimeout(r, 180));
      const clearedStillThere = await evalJs(READ);
      await evalJs(`(function(){
        var n = document.querySelector('#assignmentFields [data-assignment-field="name"]');
        if (n) n.focus();
        return 1; })()`);
      await new Promise(r => setTimeout(r, 180));
      const afterLeaving = await evalJs(READ);
      check('clearing the date does not replace the field while the teacher is still in it, and leaving the field afterwards does replace it with an empty one — the rebuild moved to `focusout` rather than being deleted',
        clearedStillThere.same === true && clearedStillThere.value === ''
          && afterLeaving.present === true && afterLeaving.same === false
          && afterLeaving.value === '' && afterLeaving.stored.due === '',
        'on the empty `change`: same element = ' + clearedStillThere.same + ', field '
          + JSON.stringify(clearedStillThere.value)
          + ' :: after the caret left: still a field = ' + afterLeaving.present
          + ', same element = ' + afterLeaving.same + ', field '
          + JSON.stringify(afterLeaving.value) + ', document '
          + JSON.stringify(afterLeaving.stored.due) + ', caret in ' + afterLeaving.active);

      /*
        The fixture comes back out — the class and its assignment — and the class that was open
        before this block is put back under it. One update rather than the real Delete confirm, for
        the reason every teardown in this harness gives: a fixture coming down is not a claim being
        made.
      */
      await evalJs("window.planbook.closeModal('assignmentModal'); 1");
      await evalJs(`(async function(){
        var s = window.planbook.store, c = window.planbook.classes;
        if (!s.getDoc()) return 0;
        s.update(function(doc){
          doc.classes = doc.classes.filter(function(x){ return x.id !== 'c_wo147'; });
          doc.assignments = doc.assignments.filter(function(a){ return a.classId !== 'c_wo147'; });
          Object.keys(doc.scores || {}).forEach(function(k){
            if (String(k).indexOf('a_wo147') === 0) delete doc.scores[k]; });
        });
        var was = ${JSON.stringify(plant.was || '')};
        if (was) c.selectClass(was);
        c.refreshClassBar();
        await s.flush();
        return 1; })()`);
    }
  }
}
}
