/* assigned-and-due.mjs — the Assigned and Due fields (WO-3.17)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/* ───────── the Assigned and Due fields (WO-3.17) ─────────
 *
 * Six acceptance lines. Five are driven here and the sixth cannot be: "on the iPad, portrait and
 * landscape, both fields fully visible with nothing off screen" needs the hardware the defect was
 * found on, and it stays a 👤 item in TESTING.md however green this block runs. What a desk can say
 * is measured; what it cannot is left owed.
 *
 * WHY THIS BLOCK EXISTS AT ALL WHEN THE ASSIGNMENTS SECTION IS ALREADY UP THERE. Two reasons, and
 * both are about the state the fields are measured in.
 *
 *   THE FIELDS HAVE TO BE MEASURED EMPTY, and after this work order the default path never shows
 *   them empty again. That is the trap WO-3.17 names against itself: part two puts today in both
 *   dates on creation, so a check that opened a new assignment and measured what it found would be
 *   measuring a field with a value in it — and the owner's photographs are of EMPTY ones, which is
 *   the state a teacher now reaches only by clearing a date. So this block creates an assignment,
 *   clears both dates through the real fields, and measures what is left. The clearing is acceptance
 *   line 2 and the measuring is line 5; doing them in that order is what makes the second one about
 *   the state the first one produces.
 *
 *   AND AT 390px, WHICH IS THE NARROWEST WIDTH THIS APP SUPPORTS. The standing coarse sweep runs at
 *   1024x768, where a 480px panel has all the room it wants; `.modal-panel` is `max-width: 95vw`, so
 *   390px is where the pair is squeezed hardest and where a field that cannot shrink shows it.
 *
 * WHAT THE DESK CAN AND CANNOT SEE OF PART ONE, said plainly because the gap is the whole risk here.
 * The mechanism is iOS Safari painting `<input type="date">` as a native control at its own
 * intrinsic size while the flex layout shrinks the element's box — layout and paint disagreeing, on
 * an engine this harness is not running. Headless Chromium honours the box, so it never reproduced
 * the overlap and it cannot demonstrate the fix. Three things are therefore asserted instead: the
 * boxes are within the panel and clear of each other AT THE WIDTH WHERE THEY ARE TIGHTEST, they take
 * the 44px floor, and the `appearance` reset that stops WebKit drawing the widget itself actually
 * reaches the element as a computed style. The third is the closest a laptop gets to the mechanism —
 * it says the declaration is live on the right element, not that iOS obeys it — and it is here so
 * that a later "tidy" of that one line goes red somewhere rather than nowhere.
 *
 * THE FIXTURE IS PLANTED, AND ONE PART OF IT COULD NOT BE MADE THROUGH THE UI AT ALL. Acceptance
 * line 3 is about an assignment that ALREADY EXISTS with a blank date — the shape a restore, a hand
 * edit, or a build older than this work order leaves behind. There is no longer a control that
 * creates one, which is exactly why it is written into the document rather than clicked into being;
 * everything else in this block goes through the real button, the real fields and the real rows.
 */
console.log('\n--- the Assigned and Due fields (WO-3.17) ---');
{
  const dateSeam = await evalJs("!!(window.planbook && window.planbook.assignments"
    + " && window.planbook.classes && window.planbook.store"
    + " && typeof window.planbook.store.update === 'function')");

  if (!dateSeam) {
    skip('the Assigned and Due fields: today on creation, empty when cleared, blank when it was blank, and both boxes inside a 390px panel',
      'no window.planbook seam on the page — it is kept deliberately so this file can read what a '
      + 'control wrote, so its absence is a defect and not a stage of the build');
  } else {
    /*
      THIS BLOCK RUNS AT TWO WIDTHS, AND THE SPLIT IS A MEASUREMENT RATHER THAN A PREFERENCE.

      Everything that has to CLICK a control runs at 1024x768; the geometry that has to be measured
      at the narrowest supported width runs at 390x844, and reaches the dialog with the one control
      that is not at the right-hand end of a row. Both halves keep the coarse pointer, because the
      44px floor lives in `@media (pointer: coarse)` and a run that lost it would measure the desktop
      pass and report green (tools/README.md trap 3).

      WHY, AND IT COST TWO FULL RUNS TO SEE. Written as one 390px pass, two checks failed reporting
      the values of a dialog that had never opened — the click on a row's Edit button landed on
      nothing at all, twice, while every measurement in the same block read correctly. At 390 the
      page reports `document.documentElement.clientWidth` 390 and `window.innerWidth` 524, and
      `95vw` resolves to 370.5px: the layout viewport really is 390 and the VISUAL one is 524, so
      the page is sitting at a scale of about 0.74. `getBoundingClientRect` answers in layout
      coordinates and `Input.dispatchMouseEvent` takes visual ones, so a control at the left edge is
      hit anyway and one at the right edge is missed by ~35% of its distance across the screen.
      Changing the device scale factor from 3 to 2 did not fix it, which is how that suspicion was
      eliminated; what remains is that something makes the content wider than the viewport at this
      width, and shrink-to-fit follows.

      IT IS AN ARTIFACT THAT READS EXACTLY LIKE AN APP DEFECT — a dialog that "does not open" —
      which is the family every trap in tools/README.md belongs to. It is worth knowing about before
      the next 390px click is written; it is written up in this comment rather than added to that
      numbered list, because that list's own rule is that each entry was hit and diagnosed twice by
      two different agents, and this has been hit once. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    const coarse317 = await evalJs("matchMedia('(pointer: coarse)').matches");

    const plant317 = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return { ok:false, why:'no year document is open' };
      var was = c.getSelectedClassId();
      s.update(function(doc){
        doc.classes.push({ id:'c_wo317', name:'WO-3.17 Dates', archived:false,
          terms:[{ id:'tm_wo317', label:'WO-3.17 Term', start:'', end:'' }],
          categories:[{ id:'k_wo317', name:'Tests', weight:100 }],
          roster: [] });
        /* Acceptance line 3's fixture, and the one thing in this block no control could make: an
           assignment that already exists carrying two blank dates. Opening it must show blank. */
        doc.assignments.push({ id:'a_wo317_blank', classId:'c_wo317', termId:'tm_wo317',
          categoryId:'k_wo317', name:'Written down some other year', points:50,
          assigned:'', due:'' });
      });
      c.selectClass('c_wo317');
      return { ok:true, was: was }; })()`);

    if (!plant317.ok) {
      check('the WO-3.17 fixture is real: a class with a term, a category and one assignment whose dates are already blank',
        false, plant317.why);
    } else {
      /* In the way a teacher goes: a tab on the header strip, then the Assignments segment. */
      await clickSel('#classTabBar [data-class-tab="c_wo317"]');
      await new Promise(r => setTimeout(r, 200));
      await clickSel('#classView [data-class-screen="assignments"]');
      await new Promise(r => setTimeout(r, 250));

      /* Every read of the two fields, in one round trip: their values, their boxes, the panel and
         the row that bounds them, and the computed `appearance` that is the mechanism. Nothing here
         is read off a stylesheet — the WO-1.2 `.search-box` defect was a compliant declaration on
         the wrong element, and every measurement in this file exists because of it. */
      const GEO = `(function(){
        var modal = document.getElementById('assignmentModal');
        var panel = modal ? modal.querySelector('.modal-panel') : null;
        var body = modal ? modal.querySelector('.modal-body') : null;
        var fields = Array.prototype.slice.call(
          document.querySelectorAll('#assignmentFields .assign-field-date'));
        var open = !!modal && !modal.classList.contains('hidden');
        if (!panel || !body || fields.length !== 2) {
          return { open: open, fields: fields.length, boxes: null }; }
        var bs = getComputedStyle(body), br = body.getBoundingClientRect();
        var pr = panel.getBoundingClientRect();
        var row = fields[0].closest('.assign-field-row');
        var boxes = fields.map(function(f){
          var r = f.getBoundingClientRect(), cs = getComputedStyle(f);
          return { field: f.getAttribute('data-assignment-field'),
                   value: f.value, type: f.type,
                   left: Math.round(r.left * 100) / 100, right: Math.round(r.right * 100) / 100,
                   w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100,
                   appearance: cs.appearance, webkit: cs.webkitAppearance,
                   /* The "Days off" lesson from the first iPad sitting: a control can clear 44px in
                      both directions and still be narrower than what is drawn inside it. */
                   spill: f.scrollWidth > f.clientWidth + 1 }; });
        return { open: open, fields: fields.length, boxes: boxes,
                 sameRow: !!row && row.contains(fields[1]),
                 rowSpill: !!row && row.scrollWidth > row.clientWidth + 1,
                 gap: Math.round((boxes[1].left - boxes[0].right) * 100) / 100,
                 innerLeft: Math.round((br.left + parseFloat(bs.paddingLeft)) * 100) / 100,
                 innerRight: Math.round((br.right - parseFloat(bs.paddingRight)) * 100) / 100,
                 panelLeft: Math.round(pr.left * 100) / 100,
                 panelRight: Math.round(pr.right * 100) / 100,
                 panelW: Math.round(pr.width * 100) / 100,
                 /* The LAYOUT viewport, which is what 95vw and every box below are measured
                    against. window.innerWidth is reported beside it rather than asserted on,
                    because the two came apart on the first run of this block — see the note at the
                    device metrics above — and a check that asserted the wrong one of them would be
                    red about the emulator rather than about the app. (No backticks in this comment:
                    it is inside a template literal.) */
                 layoutW: document.documentElement.clientWidth,
                 innerW: window.innerWidth }; })()`;

      /* A date cleared the way the iPad's picker clears one: the value goes, `input` fires, and
         `change` follows — which is the event src/assignments.js writes the empty date to the
         document on.

         IT DRIVES NO REBUILD, AND SINCE WO-1.48 NO EVENT DOES. The rebuild was on `change` until
         WO-1.47 — where it ate the field under the caret on the momentarily-empty read Chromium
         reports while a leading `0` is typed — then on `focusout`, and it now hangs off the Clear
         button beside each field, which is the only thing that reaches it. The checks below still
         pass and still mean something — a cleared date must not re-fill itself — but what they read
         is the SAME element, not a rebuilt one. Nothing here asserts the rebuild, and that is stated
         rather than left to be assumed; tools/verify/date-clear.mjs drives the button and
         tools/verify/date-zero-key.mjs drives the keystroke that used to trigger it. */
      const clearDate = async (field) => {
        await evalJs(`(function(){
          var f = document.querySelector('#assignmentFields [data-assignment-field="${field}"]');
          if (!f) return 0;
          f.value = '';
          f.dispatchEvent(new Event('input', { bubbles: true }));
          f.dispatchEvent(new Event('change', { bubbles: true }));
          return 1; })()`);
        await new Promise(r => setTimeout(r, 160));
      };
      const readFields = () => evalJs(`(async function(){
        await window.planbook.store.flush();
        var out = { fields: {}, editorOpen:
          !document.getElementById('assignmentModal').classList.contains('hidden') };
        ['assigned','due'].forEach(function(f){
          var el = document.querySelector('#assignmentFields [data-assignment-field="' + f + '"]');
          out.fields[f] = el ? el.value : null; });
        var d = window.planbook.store.getDoc();
        out.assignments = d.assignments.filter(function(a){ return a.classId === 'c_wo317'; })
          .map(function(a){ return { id:a.id, assigned:a.assigned, due:a.due }; });
        return out; })()`);

      /*
        THE PRECONDITION FOR EVERYTHING BELOW, asserted rather than assumed, because two of the
        three ways this block can be wrong are silent. The pointer has to be coarse or every 44px
        number below is the desktop pass (tools/README.md trap 3); the planted assignment has to be
        DRAWN or a click on its row hits nothing; and the layout and visual viewports have to be the
        same width, which is what says a click lands where getBoundingClientRect aimed it. That last
        one is the artifact this block was rewritten around, and it is asserted here so that a run in
        which it comes back says so in one line instead of as two mystery failures.
      */
      const stage317 = await evalJs(`(function(){
        var view = document.getElementById('assignmentsView');
        return { shown: !!view && !view.classList.contains('hidden'),
                 rows: document.querySelectorAll('#assignmentsBody .assign-name').length,
                 editHooks: document.querySelectorAll('#assignmentsView [data-assignment-edit]').length,
                 layoutW: document.documentElement.clientWidth,
                 innerW: window.innerWidth }; })()`);
      check('the WO-3.17 fixture is on screen: the planted assignment is drawn on a coarse pointer, and the page is at a scale where a click lands where it was aimed',
        coarse317 === true && stage317.shown && stage317.rows === 1 && stage317.editHooks >= 1
          && stage317.layoutW === stage317.innerW,
        'coarse = ' + coarse317 + ', list up = ' + stage317.shown + ', ' + stage317.rows
          + ' row(s) with ' + stage317.editHooks + ' edit hook(s), layout viewport '
          + stage317.layoutW + 'px against a visual one of ' + stage317.innerW + 'px');

      /*
        ACCEPTANCE LINE 3, ASKED FIRST — before anything on this screen has created an assignment,
        so nothing this block did could be what makes it pass. An assignment that arrived with blank
        dates opens blank: the default is a creation-time default, and an editor that applied it
        would silently re-date work a teacher wrote down months ago.
      */
      await clickSel('#assignmentsView [data-assignment-edit="a_wo317_blank"]');
      await new Promise(r => setTimeout(r, 200));
      const blankOpen = await readFields();
      check('an existing assignment whose dates are blank opens blank, not on today — the default is a creation-time default and never touches work already written down',
        blankOpen.editorOpen && blankOpen.fields.assigned === '' && blankOpen.fields.due === ''
          && blankOpen.assignments.some((a) => a.id === 'a_wo317_blank' && a.assigned === ''
            && a.due === ''),
        'fields ' + JSON.stringify(blankOpen.fields) + ' with today at ' + nodeToday
          + ', document ' + JSON.stringify(blankOpen.assignments.filter((a) => a.id === 'a_wo317_blank')));
      await evalJs("window.planbook.closeModal('assignmentModal'); 1");

      /*
        ACCEPTANCE LINE 1, through the real "+ New assignment". Today is compared against `nodeToday`
        — derived in Node, off the same machine clock — rather than read back out of the field it was
        written from: two runtimes, one clock, one answer. A check that asked the app what today was
        would agree with a build that wrote UTC's tomorrow into an October evening, which is the
        exact bug src/attendance.js's todayISO() is shaped to avoid and the reason this default reads
        it rather than calling `new Date()` on the spot.
      */
      await clickSel('#assignmentsView [data-assignment-new]');
      await new Promise(r => setTimeout(r, 200));
      const madeToday = await readFields();
      const madeId = (madeToday.assignments.filter((a) => a.id !== 'a_wo317_blank')[0] || {}).id;
      check('a newly created assignment opens with both dates on today, in the document and in the two fields, formatted the way an <input type="date"> wants it',
        madeToday.editorOpen && !!madeId
          && madeToday.fields.assigned === nodeToday && madeToday.fields.due === nodeToday
          && madeToday.assignments.some((a) => a.id === madeId && a.assigned === nodeToday
            && a.due === nodeToday),
        'node says ' + nodeToday + ', fields say ' + JSON.stringify(madeToday.fields)
          + ', document says ' + JSON.stringify(madeToday.assignments.filter((a) => a.id === madeId)));

      /*
        ACCEPTANCE LINE 2. Both dates cleared through the real fields, on the real `change` the
        picker's Clear fires. A build that re-applied the creation default would store '' and show
        today, and the teacher would find the date back the moment she looked away — that is what
        this catches, on the field as well as on the document.

        WHAT IT STOPPED ASSERTING (WO-1.47): the field read below is the same element that was
        cleared, not a rebuilt one. clearDate() above never blurs, and the rebuild moved off
        `change` onto `focusout`, so this line's premise changed under it without the check going
        red. Extending it to drive the blur would be new coverage rather than a repair and was left
        alone deliberately.
      */
      await clearDate('assigned');
      await clearDate('due');
      const cleared = await readFields();
      check('clearing either date stores it empty and leaves the field empty — a cleared date is never re-filled',
        cleared.editorOpen && cleared.fields.assigned === '' && cleared.fields.due === ''
          && cleared.assignments.some((a) => a.id === madeId && a.assigned === '' && a.due === ''),
        'fields ' + JSON.stringify(cleared.fields) + ', document '
          + JSON.stringify(cleared.assignments.filter((a) => a.id === madeId)));

      /*
        AND THE SECOND HALF OF LINE 2: closed, reopened from the row, still empty. The editor is
        filled from the document every time it opens (renderEditorFields), so this is the check that
        would catch a default applied on OPEN rather than on creation — which is the shape of the
        mistake that satisfies every other check in this block.
      */
      await evalJs("window.planbook.closeModal('assignmentModal'); 1");
      await new Promise(r => setTimeout(r, 150));
      await clickSel('#assignmentsView [data-assignment-edit="' + madeId + '"]');
      await new Promise(r => setTimeout(r, 200));
      const reopened = await readFields();
      check('and reopening that assignment shows both dates still empty rather than filling them in again',
        reopened.editorOpen && reopened.fields.assigned === '' && reopened.fields.due === ''
          && reopened.assignments.some((a) => a.id === madeId && a.assigned === '' && a.due === ''),
        'fields ' + JSON.stringify(reopened.fields) + ' (today is ' + nodeToday + '), document '
          + JSON.stringify(reopened.assignments.filter((a) => a.id === madeId)));

      /*
        ACCEPTANCE LINE 4, asked of the two surfaces that carry the promise: the standing hint under
        the list and the note inside the editor itself. BOTH are read, because the second one was a
        copy of the first and the work order names only the first — a rewrite that fixed one and left
        the other would leave the dialog contradicting itself an inch from the field.

        The no-timetable half is asserted as text a teacher can read rather than as a boolean about
        the paragraph existing: that reasoning survives this work order intact, and dropping it while
        removing the sentence beside it is the other way to fail this line.
      */
      const prose = await evalJs(`(function(){
        var listHint = Array.prototype.slice.call(
          document.querySelectorAll('#assignmentsView .assign-hint'))
          .map(function(p){ return p.textContent; }).join(' ');
        var editorHint = Array.prototype.slice.call(
          document.querySelectorAll('#assignmentModal .class-hint'))
          .map(function(p){ return p.textContent; }).join(' ');
        return { list: listHint.replace(/\\s+/g, ' ').trim(),
                 editor: editorHint.replace(/\\s+/g, ' ').trim() }; })()`);
      const stale = /(neither|no)\s+date[^.]*fills? itself in|neither fills itself in/i;
      const reason = /no timetable/i;
      const nextMeeting = /next meeting/i;
      check('neither the list hint nor the editor\'s own note still says the dates do not fill themselves in, and both still say why there is no next-meeting guess',
        !stale.test(prose.list) && !stale.test(prose.editor)
          && reason.test(prose.list) && reason.test(prose.editor)
          && nextMeeting.test(prose.list) && nextMeeting.test(prose.editor)
          && /today/i.test(prose.list) && /today/i.test(prose.editor),
        'list hint :: ' + JSON.stringify(prose.list.slice(0, 190))
          + ' || editor note :: ' + JSON.stringify(prose.editor.slice(0, 150)));

      /*
        ── 390px, WHICH IS ACCEPTANCE LINE 5 ──

        Down to the narrowest width the app supports, with the coarse pointer kept. The dialog is
        reached with "+ New assignment" and nothing else, because that control sits at the top of
        the panel where a click still lands (see the note at the device metrics above), and the
        dates are then cleared through the fields the way they were cleared at 1024 — no clicks at
        all. Everything measured here is measured with the two fields EMPTY, which after part two of
        this work order is a state a teacher reaches by clearing a date rather than by making an
        assignment, and which is the state the owner's screenshots are of. Measuring the filled ones
        would be measuring a box with a value holding it open.
      */
      await evalJs("window.planbook.closeModal('assignmentModal'); 1");
      await send('Emulation.setDeviceMetricsOverride',
        { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await new Promise(r => setTimeout(r, 400));
      const coarseNarrow = await evalJs("matchMedia('(pointer: coarse)').matches");
      await clickSel('#assignmentsView [data-assignment-new]');
      await new Promise(r => setTimeout(r, 250));
      await clearDate('assigned');
      await clearDate('due');
      const narrowFields = await readFields();
      const geoEmpty = await evalJs(GEO);
      check('with both date fields EMPTY at 390px on a coarse pointer, each one measures at least 44px in both directions and neither is squeezed narrower than what it draws',
        coarseNarrow === true && !!geoEmpty.boxes && geoEmpty.open && geoEmpty.layoutW <= 390
          && narrowFields.fields.assigned === '' && narrowFields.fields.due === ''
          && geoEmpty.boxes.every((b) => b.value === '' && b.type === 'date')
          && geoEmpty.boxes.every((b) => b.h >= 44 && b.w >= 44 && !b.spill),
        'coarse = ' + coarseNarrow + ', layout viewport = ' + geoEmpty.layoutW
          + 'px (innerWidth ' + geoEmpty.innerW + ' — see the note above) :: '
          + JSON.stringify(geoEmpty.boxes && geoEmpty.boxes.map((b) => b.field + ' ' + b.w + 'x'
            + b.h + (b.spill ? ' SPILLING' : ''))));
      check('and neither empty field crosses the panel edge or the other one: both sit inside the panel at 390px with the row\'s gap still between them',
        !!geoEmpty.boxes && geoEmpty.sameRow && !geoEmpty.rowSpill
          && geoEmpty.layoutW <= 390 && geoEmpty.panelW < 480
          && geoEmpty.boxes.every((b) => b.left >= geoEmpty.innerLeft - 0.5
            && b.right <= geoEmpty.innerRight + 0.5
            && b.left >= geoEmpty.panelLeft && b.right <= geoEmpty.panelRight)
          && geoEmpty.gap >= 11.5,
        'at a ' + geoEmpty.layoutW + 'px layout viewport: panel ' + geoEmpty.panelW
          + 'px (capped below its natural 480) spanning ' + geoEmpty.panelLeft + '..'
          + geoEmpty.panelRight + ', content ' + geoEmpty.innerLeft + '..' + geoEmpty.innerRight
          + ', fields ' + JSON.stringify(geoEmpty.boxes
            && geoEmpty.boxes.map((b) => b.field + ' ' + b.left + '..' + b.right))
          + ', gap between them ' + geoEmpty.gap + 'px');

      /*
        THE MECHANISM, AS FAR AS A LAPTOP CAN SEE IT — and no further, which is worth being exact
        about. The iPad symptom is WebKit painting the native widget over the box this stylesheet
        sized; `appearance: none` is what stops it, and headless Chromium can demonstrate neither
        half because it honours the box already. What this asserts is that the reset is LIVE on both
        of these elements as a computed style, so the one line the whole fix rests on cannot be
        tidied away without something going red here. Acceptance line 6 is still owed to the
        hardware, and this does not touch it.
      */
      check('the appearance reset that stops WebKit drawing its own date widget is live on both fields, which is the one part of the iPad fix a laptop can witness',
        !!geoEmpty.boxes && geoEmpty.boxes.every((b) => b.appearance === 'none'
          && b.webkit === 'none'),
        JSON.stringify(geoEmpty.boxes && geoEmpty.boxes.map((b) => b.field + ': appearance '
          + b.appearance + ', -webkit-appearance ' + b.webkit)));

      /*
        The fixture comes back out — the class and both assignments — and the class that was open
        before this block is put back under it. One update rather than the real Delete confirm, for
        the reason the two teardowns above give: a fixture coming down is not a claim being made.
      */
      await evalJs("window.planbook.closeModal('assignmentModal'); 1");
      await evalJs(`(async function(){
        var s = window.planbook.store, c = window.planbook.classes;
        if (!s.getDoc()) return 0;
        s.update(function(doc){
          doc.classes = doc.classes.filter(function(x){ return x.id !== 'c_wo317'; });
          doc.assignments = doc.assignments.filter(function(a){ return a.classId !== 'c_wo317'; });
          Object.keys(doc.scores || {}).forEach(function(k){
            if (String(k).indexOf('a_wo317') === 0) delete doc.scores[k]; });
        });
        var was = ${JSON.stringify(plant317.was || '')};
        if (was) c.selectClass(was);
        c.refreshClassBar();
        await s.flush();
        return 1; })()`);
    }
  }
}
}
