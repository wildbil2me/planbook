/* note-panel.mjs — the WO-2.10 note panel fits the screen it is read on
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, load } = h;

/* ──────────── the WO-2.10 note panel fits the screen it is read on ──────────── */

/*
  THE 2026-08-06 DEVICE SITTING. The note field was cut off on the right on the iPad, in BOTH
  orientations, on every mark code — worst on present/absent/at-an-event, where the mark chip is
  short enough that the field stays on the same flex line as the name and gets pushed under the
  edge. Tardy and dismissed carry a time, the longer chip wraps the field onto its own line, and it
  escaped; that difference is why the report described a severity order rather than a plain break.

  The cause was a fixed `width: 720px` on `.attendance-panel` inside src/attendance.css's
  `(pointer: coarse)` block. The cap had already been overruled by the owner and removed from the
  BASE rule — and left standing in the touch block, so the fix reached the laptop and never reached
  the only device it was for. At 720px the grid's own columns want 711px inside 680px of body, the
  wrap's `overflow-x` safety valve engages, and everything past 680px is invisible. A fixed panel
  width also makes the geometry identical in both orientations, which is exactly what was reported:
  rotating to landscape left 288px of screen unused and changed nothing.

  This measures the thing the eye actually catches — the right edge of the field against the right
  edge of the scroll container — rather than the page-level overflow the block above already covers.
  The page never overflowed; the clipping was always INSIDE the wrap, which is why three green
  "no horizontal overflow" checks sat above a screen that was visibly broken.

  Driven at both iPad orientations and on every code, because the defect was orientation-independent
  and code-dependent, and a check that ran one code would have passed on `T` while `A` was broken.
*/
console.log('\n--- the WO-2.10 note panel fits its screen ---');
{
  /*
    THE CONDITION HAS TO BE MANUFACTURED, AND THE FIRST VERSION OF THIS CHECK DID NOT DO IT. Written
    against whatever roster the run happened to have built, it passed with the fix fully reverted:
    the names this harness types in are short, the name column stays narrow, and the grid fits its
    wrap at 720px with room to spare. It was measuring a screen the defect had never been on.

    The trigger is NAME LENGTH. The column is `nowrap`, so its min-content is the longest name laid
    flat, and a table cell's min-content is a floor the browser widens the whole TABLE to honour.
    Short names, no defect; "Delacroix-Nguyen, Xiomara" is 279px and pushes the table to 711px inside
    680px of body. Real rosters are full of hyphenated and double-barrelled names, which is why this
    reached the owner's iPad and never reached a test.

    So the long name is written in deliberately, and put back afterwards. The precondition is then
    ASSERTED rather than assumed — a rename that silently failed would take the check back to
    measuring nothing, which is the exact failure being corrected here.
  */
  const LONG_NAME = { first: 'Xiomara', last: 'Delacroix-Nguyen' };
  const ready = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var cls = (doc.classes || []).filter(function(c){ return !c.archived && (c.roster||[]).length; })[0];
    if (!cls) return { none: true };
    var sid = cls.roster[0];
    var stu = doc.students.filter(function(s){ return s.id === sid; })[0];
    if (!stu) return { none: true };
    var was = { first: stu.first, last: stu.last };
    window.planbook.store.update(function(){
      stu.first = ${JSON.stringify(LONG_NAME.first)}; stu.last = ${JSON.stringify(LONG_NAME.last)}; });
    window.planbook.classes.selectClass(cls.id);
    window.planbook.attendance.renderAttendance();
    return { classId: cls.id, student: sid, was: was,
             rows: document.querySelectorAll('[data-attendance-row]').length }; })()`);

  if (ready.none || !ready.rows) {
    skip('the WO-2.10 note panel sits inside the grid it is drawn in',
      'no unarchived class with a roster is on the device at this point in the run, so there is no '
        + 'registry to draw a panel in — a state, not a pass');
  } else {
    const day = await evalJs('window.planbook.attendance.todayISO()');

    for (const [w, h, label] of [[768, 1024, 'portrait'], [1024, 768, 'landscape']]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await new Promise(r => setTimeout(r, 350));
      /* RENDER AFTER THE RESIZE, EVERY TIME. dayColumnCount() reads `window.innerWidth` when the
         grid is painted, not when it is looked at, so a grid painted at the 390px this run's
         previous section left behind keeps THREE columns at 768px — and three columns leave so much
         spare width that the defect cannot occur. The first version of this section rendered once,
         before the first resize, and measured that phantom. */
      await evalJs('window.planbook.attendance.renderAttendance()');
      await new Promise(r => setTimeout(r, 250));

      /*
        The precondition, per orientation. Without a name column that WANTS more than the day columns
        leave spare, every check below is green for a reason that has nothing to do with the fix.

        Measured on the RENAMED student's own row, found by id. Reading `tbody .attendance-name` took
        whichever row sorted first — "Álvarez, José" — while the long name sat further down the list,
        so the probe reported a 185px column and failed itself. The row this asks about has to be the
        row the name was written onto.
      */
      const cond = await evalJs(`(function(){
        var row = document.querySelector('[data-attendance-row="' + ${JSON.stringify(ready.student)} + '"]');
        var cell = row && row.querySelector('.attendance-name');
        if (!cell) return { noCell: true };
        var probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:min-content;';
        var clone = cell.cloneNode(true);
        clone.style.maxWidth = 'none';          /* what the column would demand UNCAPPED */
        probe.appendChild(clone); document.body.appendChild(probe);
        var want = Math.round(probe.getBoundingClientRect().width);
        document.body.removeChild(probe);
        var days = document.querySelectorAll('thead .attendance-day').length;
        var dayW = days ? Math.round(document.querySelector('thead .attendance-day')
                            .getBoundingClientRect().width) : 0;
        var wrap = document.querySelector('.attendance-grid-wrap');
        /* The Passes column takes its share of the wrap before the name column sees any of it
           (WO-2.8), so the spare the name is competing for is what is left after BOTH fixed
           columns. Measured rather than assumed, because it is the number that decides whether
           the cap below is still load-bearing. */
        var passTh = document.querySelector('thead .attendance-passes');
        var passW = passTh ? Math.round(passTh.getBoundingClientRect().width) : 0;
        return { want: want, days: days, dayW: dayW, wrapW: wrap.clientWidth, passW: passW,
                 spare: wrap.clientWidth - days * dayW - passW,
                 name: (cell.getAttribute('title') || '') }; })()`);
      /* Two claims, and they are separated because only one of them can be made in both
         orientations. This first one guards the RENDER: the right number of day columns, and the
         long name actually on the row being measured. If either slips, everything below is
         measuring a screen the defect was never on, which is the trap this whole block exists to
         close.

         IT WAS SIX IN BOTH ORIENTATIONS UNTIL WO-2.8, and the change is that work order's visible
         cost rather than a slackening of this check. The Passes column asks for 160px of a 688px
         wrap; six day columns and a name column do not fit beside it in portrait, and
         src/attendance.js's answer to "not enough width" was already to draw fewer days rather than
         to let the grid escape sideways — which is the very failure this block was written for.
         So: four in portrait, six in landscape, and the count is still ASSERTED rather than
         accepted, because a grid that quietly dropped to three would be measuring a screen with
         room to spare.

         AND IT IS ONE IN PORTRAIT SINCE WO-2.12 — today's column and nothing else, the owner's own
         answer to the four-five-or-six question WO-2.8 escalated. Six in landscape is untouched by
         that work order and stays asserted here as the thing it must not have changed. */
      const wantDays = label === 'portrait' ? 1 : 6;
      check('the grid under this measurement is ' + wantDays
        + ' columns wide beside the Passes column, and carries the long name, iPad ' + label,
        !cond.noCell && cond.days === wantDays && cond.passW >= 148
          && /Delacroix-Nguyen/.test(cond.name) && cond.want >= 240,
        cond.days + ' day columns at ' + cond.dayW + 'px beside a ' + cond.passW
          + 'px Passes column; the name column wants ' + cond.want
          + 'px uncapped — "' + cond.name + '"');

      /* THIS CHECK CHANGED SIDES AT WO-2.12, AND THE REVERSAL IS THE WORK ORDER.
         It used to assert the defect condition — that a long name in portrait wants MORE than the
         other columns leave, so the cap was load-bearing there and the note-panel measurements below
         were being made on a screen the defect could actually occur on. That was true against four
         day columns (256px spare against a 279px name). Portrait draws ONE column now, so the same
         arithmetic comes out the other way: 688 - 160 - 72 = 456px of spare against the same 279px,
         and the name has room it did not have.

         So the claim is now the one WO-2.12 promised in its place — "full names, no truncation" —
         and it is asserted with the same numbers rather than deleted, which would have left the
         orientation measuring nothing. It is the DESK HALF of acceptance line 4: the ellipsis is
         proved not to engage on the longest name this harness can write. Whether the owner's own
         longest name reads at arm's length is still hers.

         Landscape is exempt for the reason it always was: `.attendance-panel` takes the whole screen
         there, 352px of spare against a 279px name, and nothing could overflow it. */
      if (label === 'portrait') {
        const cut = await evalJs(`(function(){
          var row = document.querySelector('[data-attendance-row="' + ${JSON.stringify(ready.student)} + '"]');
          var span = row && row.querySelector('.attendance-student-name');
          var cell = row && row.querySelector('.attendance-name');
          if (!span || !cell) return { noCell: true };
          return { over: span.scrollWidth - span.clientWidth, shown: span.textContent,
                   spanW: Math.round(span.getBoundingClientRect().width),
                   cellW: Math.round(cell.getBoundingClientRect().width),
                   cap: getComputedStyle(cell).maxWidth }; })()`);
        /* `spanW >= 100` is the guard against a vacuous pass rather than a claim about the design: a
           span of zero width has `scrollWidth - clientWidth === 0` too, and would report "not
           truncated" about a name nobody can see. 100px is well under the ~184px of text this name
           lays out to inside a cell whose other 95px is avatar, door and padding, and well over
           anything a collapsed column could produce. */
        check('a long name is drawn IN FULL in portrait — one day column leaves the name column more '
          + 'than it wants, so the cap never engages (the desk half of WO-2.12 acceptance line 4)',
          !cut.noCell && cut.over <= 0 && cond.want <= cond.spare
            && /Delacroix-Nguyen/.test(cut.shown) && cut.spanW >= 100,
          'the name is over its box by ' + cut.over + 'px (<=0 is whole) in a ' + cut.spanW
            + 'px span; the column wants ' + cond.want + 'px and ' + cond.days
            + ' day column(s) plus a ' + cond.passW + 'px Passes column leave '
            + cond.spare + 'px of a ' + cond.wrapW + 'px wrap; the cell is ' + cut.cellW
            + 'px under a cap of ' + cut.cap + ', showing ' + JSON.stringify(cut.shown));
      }

      /*
        THE NOTE FIELD IS MEASURED INSIDE THE DIALOG NOW (WO-2.53), NOT INSIDE THE GRID.

        It was a field in a panel spanning the grid's own columns, and what was measured was its
        right edge against the grid wrap's — the defect the owner found on 2026-08-06 was +16px past
        it, in both orientations, at every one of the five codes. That panel is gone: the field is in
        the student's history dialog, so the box it must not spill out of is the modal panel, and the
        arithmetic that used to matter (six 72px columns against a 720px cap) does not apply to it at
        all. The measurement is kept because the CLAIM is kept — a note is a sentence and it has to be
        readable on the device this screen is for — and it is made at the same five codes for the same
        reason: `P` is in the list because present is stored as NO MARK, so the block draws its widest
        thing, the hint paragraph, instead of the field.
      */
      for (const code of ['P', 'A', 'E', 'T', 'D']) {
        const m = await evalJs(`(async function(){
          window.planbook.attendance.takeClass(${JSON.stringify(day)});
          window.planbook.attendance.setMark(${JSON.stringify(ready.student)},
            ${JSON.stringify(code)}, ${JSON.stringify(day)});
          await window.planbook.store.flush();
          window.planbook.attendance.renderAttendance();
          window.planbook.attendanceReport.openHistory(${JSON.stringify(ready.student)});
          var panel = document.querySelector('#attendanceHistoryModal .modal-panel');
          var box = document.querySelector('#attendanceHistoryBody [data-attendance-write]');
          var field = box ? (box.querySelector('.attendance-report-write-note')
                   || box.querySelector('.attendance-report-write-hint')) : null;
          if (!panel || !field) return { noPanel: true };
          var pr = panel.getBoundingClientRect(), fr = field.getBoundingClientRect();
          var out = { spill: Math.round(fr.right - pr.right),
                      docOverflow: document.documentElement.scrollWidth - window.innerWidth,
                      panelClientW: Math.round(pr.width), fieldW: Math.round(fr.width),
                      viewportW: window.innerWidth };
          window.planbook.closeModal('attendanceHistoryModal');
          return out; })()`);

        if (m.noPanel) {
          check('the WO-2.53 write block opens at all on ' + code + ', ' + label, false,
            'the history dialog drew no field and no hint — the measurement below cannot be made');
          continue;
        }
        /* Guarded against a vacuous pass twice over: a field of zero width, or a panel of zero
           width, would both put the right edge "inside" the container without anything being
           readable. The panel this measures is the dialog's, and the page is asked for its own
           overflow beside it — a dialog that fits its panel while the panel hangs off the viewport
           is the same defect one level out. */
        check('the note field sits inside the history dialog on ' + code + ', iPad ' + label,
          m.spill <= 0 && m.fieldW >= 80 && m.panelClientW >= 320 && m.docOverflow <= 0,
          'field right is ' + m.spill + 'px past the dialog panel (<=0 is inside); field '
            + m.fieldW + 'px, panel ' + m.panelClientW + 'px in a ' + m.viewportW
            + 'px viewport, page over by ' + m.docOverflow + 'px');
      }

      /* The condition underneath all four: the grid fits the box it is drawn in, so the safety
         valve never engages and nothing on this screen is reachable only by sideways swipe. */
      const valve = await evalJs(`(function(){ var w = document.querySelector('.attendance-grid-wrap');
        return { over: w.scrollWidth - w.clientWidth, clientW: w.clientWidth,
                 scrollW: w.scrollWidth }; })()`);
      check('the registry grid fits its wrap on an iPad in ' + label
        + ', so the overflow valve stays shut',
        valve.over <= 0 && valve.clientW >= 320,
        'wrap client ' + valve.clientW + ', scroll ' + valve.scrollW + ' (over by ' + valve.over + ')');
    }
    await send('Emulation.clearDeviceMetricsOverride');
    /* Put the roster back. Nothing runs after this today, but a section that leaves a student
       renamed is a trap for whichever check gets appended below it next. */
    await evalJs(`(async function(){
      var doc = window.planbook.store.getDoc();
      var stu = doc.students.filter(function(s){ return s.id === ${JSON.stringify(ready.student)}; })[0];
      if (stu) window.planbook.store.update(function(){
        stu.first = ${JSON.stringify(ready.was && ready.was.first)};
        stu.last = ${JSON.stringify(ready.was && ready.was.last)}; });
      await window.planbook.store.flush(); })()`);
  }
}
}
