/* portrait-landscape.mjs — portrait shows today, landscape shows the week (WO-2.12)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel } = h;

/* ───────── portrait shows today, landscape shows the week (WO-2.12) ─────────
 *
 * The owner's answer, 2026-08-07, to the four-five-or-six question WO-2.8 escalated: none of the
 * three. In portrait this screen is held at the classroom door to mark TODAY, so portrait draws
 * today's column alone and landscape keeps the week.
 *
 * MEASURED ON THE OWNER'S OWN SIZES rather than on 768/1024. Her iPad is an 834pt 11″, which is the
 * width that made this work order necessary — the width budget drew FIVE columns there, not the four
 * the WO-2.8 note leads with, and a check written at 768 would have been measuring a device nobody
 * in this project owns.
 *
 * THE ROTATION IS NOT SIMULATED. Nothing here calls renderAttendance() between the two orientations,
 * because "with no reload" is half of acceptance line 2 and the whole of the repaint this work order
 * added: the device metrics change, the `(orientation: portrait)` media query flips, and the grid
 * either redraws itself or it does not. A harness that repainted the screen by hand would go green
 * against a build with no listener in it at all — which is exactly what the build looked like before
 * this work order, and what every other section of this file works around by rendering after each
 * resize.
 */
console.log('\n--- portrait shows today, landscape shows the week (WO-2.12) ---');
{
  await send('Emulation.clearDeviceMetricsOverride');
  await new Promise(r => setTimeout(r, 200));

  const roster = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    if (!doc) return null;
    var best = null, n = -1;
    doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c; } });
    return n >= 1 ? { id: best.id, student: best.roster[0], students: n } : null; })()`);

  if (!roster) {
    skip('portrait draws one day column and landscape six, on one device with no reload',
      'no unarchived class with a roster is on the device at this point in the run — a state, not '
        + 'a pass');
  } else {
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + roster.id + '"]');
    await new Promise(r => setTimeout(r, 300));
    const day = await evalJs('window.planbook.attendance.todayISO()');

    /* What the screen is made of, in one read: the columns and their dates, the Passes column, the
       wrap's own overflow, and the mark on one cell. The glyph is read off the CELL ITSELF, which is
       the `<button class="attendance-cell" data-attendance-cell>` — not off its `<td>`, which can
       carry the time caption too and would make "T8:14a" of what should be one letter (the WO-2.10
       reader rule, and the first version of this block got it wrong in the other direction by
       looking for `.attendance-cell` INSIDE the hook rather than on it). */
    const CELL_SEL = '#attendanceBody [data-attendance-cell="' + roster.student
      + '"][data-attendance-date="' + day + '"]';
    const READ = `(function(){
      var head = document.getElementById('attendanceHead');
      var wrap = document.getElementById('attendanceGridWrap');
      var passTh = head && head.querySelector('.attendance-passes');
      var cols = head ? Array.prototype.slice.call(head.querySelectorAll('th[data-attendance-col]'))
        .map(function(th){ return th.getAttribute('data-attendance-col'); }) : [];
      var cell = document.querySelector(${JSON.stringify(CELL_SEL)});
      return { cols: cols,
               passW: passTh ? Math.round(passTh.getBoundingClientRect().width) : 0,
               over: wrap ? wrap.scrollWidth - wrap.clientWidth : -1,
               wrapW: wrap ? wrap.clientWidth : 0,
               mark: cell ? cell.textContent.trim() : '',
               inner: window.innerWidth + 'x' + window.innerHeight,
               coarse: matchMedia('(pointer: coarse)').matches,
               portrait: matchMedia('(orientation: portrait)').matches }; })()`;

    /* ── the owner's 11″, held upright ── */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    const up = await evalJs(READ);

    check('the emulated 11″ really is coarse and really is portrait (else everything below measures '
      + 'some other device)', up.coarse === true && up.portrait === true,
      up.inner + ', coarse = ' + up.coarse + ', portrait = ' + up.portrait);
    /* Acceptance line 1. THREE CLAUSES, and the second is the one that would be missed: a grid that
       drew one column of the wrong DATE would satisfy "exactly one" perfectly. */
    check('portrait draws exactly one day column, it is today\'s, and the Passes column is still there',
      up.cols.length === 1 && up.cols[0] === day && up.passW >= 148,
      up.cols.length + ' day column(s) ' + JSON.stringify(up.cols) + ' against today = '
        + JSON.stringify(day) + ', beside a ' + up.passW + 'px Passes column, at ' + up.inner);
    /* Acceptance line 5, portrait half — the WO-2.10 defect this must not reopen. Guarded against a
       vacuous pass by the wrap having a plausible width: a wrap of zero cannot overflow either. */
    check('and the grid fits its wrap in portrait, so the overflow valve stays shut',
      up.over <= 0 && up.wrapW >= 320,
      'the grid is over its own box by ' + up.over + 'px in a ' + up.wrapW + 'px wrap');

    /* A mark made at the door, in portrait, on the one column there is — through the cell a teacher
       taps, round the real cycle. It is what the rotation below has to still be holding.

       WALKED TO `A` RATHER THAN TAPPED ONCE, and the difference matters: one tap on a `?` means
       PRESENT, present is stored as no entry at all, and a check that then asked the document what
       it held would be asking about an absence of data. `A` is a mark that exists in both places, so
       "still on the cell" and "still in the record" are two claims rather than one. */
    let walked = '';
    for (let i = 0; i < 6 && walked !== 'A'; i++) {
      await clickSel(CELL_SEL);
      await new Promise(r => setTimeout(r, 140));
      walked = (await evalJs(READ)).mark;
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    const marked = await evalJs(READ);
    check('a cell in that one column still takes a mark, so the door is a working screen and not a '
      + 'read-only one', marked.mark === 'A' && marked.cols.length === 1,
      'the cell reads ' + JSON.stringify(marked.mark) + ' across ' + marked.cols.length + ' column(s)');

    /* ── the same device, turned. Nothing repaints this by hand; see the header. ── */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1112, height: 834, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 500));
    const across = await evalJs(READ);
    const stored = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var rec = (doc.attendance || []).filter(function(r){
        return r.classId === ${JSON.stringify(roster.id)} && r.date === ${JSON.stringify(day)}; })[0];
      var m = rec && rec.marks ? rec.marks[${JSON.stringify(roster.student)}] : null;
      return m && typeof m === 'object' ? m.code : m; })()`);

    /* Acceptance line 2, and it is the listener that is under test rather than the arithmetic. */
    check('turning the same device to landscape draws six again — no reload, and nothing repainted '
      + 'it by hand', across.cols.length === 6 && across.portrait === false && across.cols[0] === day,
      across.cols.length + ' day column(s) at ' + across.inner + ', most recent = '
        + JSON.stringify(across.cols[0]) + ' against today = ' + JSON.stringify(day));
    /* The DESK HALF of acceptance line 3, and it does not close it: scroll position and a thumb
       mid-tap need the real device. What a desk can answer is that the turn did not cost the mark —
       on the glass and in the document, because a repaint that redrew from a stale copy would put
       the right letter on screen over the wrong record. */
    check('and the mark made in portrait is still on the cell and still in the document after the turn',
      across.mark === marked.mark && across.mark !== '' && stored === across.mark,
      'the cell read ' + JSON.stringify(marked.mark) + ' before the turn and '
        + JSON.stringify(across.mark) + ' after it; the document holds ' + JSON.stringify(stored));
    /* Acceptance line 5, landscape half. */
    check('and the grid still fits its wrap in landscape, so the valve stays shut in both orientations',
      across.over <= 0 && across.wrapW >= 320,
      'the grid is over its own box by ' + across.over + 'px in a ' + across.wrapW + 'px wrap');

    /*
      TURNED AGAIN, AND AGAIN, AND AGAIN — the check the shipped build would have failed and the
      one above would not. The owner's iPad on 2026-08-07: the first turn worked, the turn back did
      not, a reload restored the week, and the next turn into portrait did nothing. Everything above
      this point turns the device ONCE, and a listener that fires once and dies passes all of it.

      Four more turns rather than one, because "once" and "twice" are the two answers a broken
      trigger gives. What it cannot reproduce is WHY the shipped one died — WebKit collecting an
      unreferenced MediaQueryList is not a thing Chrome does, and stale post-rotation metrics are not
      a thing CDP emulation has — so this is a check on the SYMPTOM. The two causes are answered in
      src/attendance.js at the listener, and a build that keeps a live trigger by any means passes.
    */
    const cycle = [[834, 1112, 1], [1112, 834, 6], [834, 1112, 1], [1112, 834, 6]];
    const turns = [];
    for (const [w, h] of cycle) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      /* Longer than the app's own settle delay: the third and last look a turn takes is at 400ms,
         and a harness that read at 300 would be timing the wait rather than the app. */
      await new Promise(r => setTimeout(r, 700));
      const now = await evalJs(READ);
      turns.push({ at: now.inner, cols: now.cols.length, mark: now.mark });
    }
    check('and it goes on turning — four more flips, no reload, each one drawing the count that '
      + 'orientation asks for',
      turns.every((t, i) => t.cols === cycle[i][2]),
      turns.map((t, i) => t.at + ' → ' + t.cols + ' column(s), wanted ' + cycle[i][2]).join(' · '));
    check('and the mark survives all four, so a repaint on every turn is still not a reset',
      turns.every(t => t.mark === marked.mark),
      'the cell read ' + JSON.stringify(marked.mark) + ' before the first turn and '
        + JSON.stringify(turns.map(t => t.mark)) + ' across the four');

    /*
      AN UNLOCKED PAST COLUMN, AND THE TURN THAT TAKES IT OFF THE SCREEN. Not an acceptance line —
      it is the defect this work order opens if the repaint only counts columns. `editingDay` is
      module state and survives a render, so unlocking Tuesday in landscape and turning the iPad
      upright leaves `editDate()` answering Tuesday with no Tuesday on screen: every cell in today's
      column comes back read-only and the banner above them names a day that is not there. A teacher
      at the door cannot mark anybody, and nothing about it looks like a rotation bug.

      Driven through the ✏ a teacher taps, in landscape where a past column exists to unlock, and
      read after the turn as the two things she would actually notice: the "not on today" banner is
      down, and today's cell is a button again.
    */
    const past = await evalJs(`(function(){
      var ths = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead [data-attendance-edit]'));
      return ths.length ? ths[ths.length - 1].getAttribute('data-attendance-edit') : ''; })()`);
    if (!past) {
      skip('turning the iPad upright locks a past column that is no longer on screen',
        'the landscape grid offered no past column with an unlock on it — a state, not a pass');
    } else {
      await clickSel('#attendanceHead [data-attendance-edit="' + past + '"]');
      await new Promise(r => setTimeout(r, 250));
      const unlocked = await evalJs(`(function(){
        var b = document.getElementById('attendanceBanner');
        return { banner: b && !b.classList.contains('hidden'),
                 editing: !!document.querySelector('#attendanceHead th[data-attendance-col="'
                   + ${JSON.stringify(past)} + '"] [data-attendance-lock]') }; })()`);
      await send('Emulation.setDeviceMetricsOverride',
        { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
      await new Promise(r => setTimeout(r, 500));
      const turned = await evalJs(`(function(){
        var b = document.getElementById('attendanceBanner');
        var cell = document.querySelector(${JSON.stringify(CELL_SEL)});
        return { banner: b && !b.classList.contains('hidden'),
                 cols: document.querySelectorAll('#attendanceHead th[data-attendance-col]').length,
                 tappable: !!cell && cell.tagName === 'BUTTON' }; })()`);
      check('turning the iPad upright with a past column unlocked puts the screen back on today — '
        + 'the day being edited is not on screen any more, so it does not go on holding the marks',
        unlocked.banner === true && unlocked.editing === true
          && turned.banner === false && turned.cols === 1 && turned.tappable === true,
        'landscape: "not on today" banner up = ' + unlocked.banner + ', the column carries a lock = '
          + unlocked.editing + '; after the turn: banner up = ' + turned.banner + ', '
          + turned.cols + ' column(s), today\'s cell is tappable = ' + turned.tappable);
    }

    /* Put the mark back. The cycle is P → A → E → T → D → P, so tapping round to present is what
       leaves the document as this section found it — and it is the only exit that writes nothing
       permanent, since present is stored as no mark at all. */
    for (let i = 0; i < 6; i++) {
      const now = (await evalJs(READ)).mark;
      if (now === 'P' || now === '') break;
      await clickSel(CELL_SEL);
      await new Promise(r => setTimeout(r, 120));
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');

    /* ── acceptance line 6: a NARROW LAPTOP WINDOW, which is landscape ──
       The trap this closes is a portrait rule written as a width rule. A browser window dragged to
       900px is 900px of a screen that is still wider than it is tall, the teacher at that window is
       at a desk reading a week, and a build that answered "narrow, therefore today" would take the
       week off the only device it is for.

       NOT RENDERED BY HAND ANY MORE, and the change is the point. This block used to call
       renderAttendance() itself, on the reasoning that landscape → landscape fires no orientation
       change and a window drag had never repainted this grid. That reasoning is what the 2026-08-07
       fix overturned: the repaint now hangs off `resize` as well, guarded by a comparison against
       the count on screen, so a drag across a budget boundary redraws and a drag within one does
       nothing. Measuring it with a hand render would go green against a build that had lost the
       listener again — which is the failure that shipped.

       Two windows rather than one. 900px is the width the acceptance line names and the budget
       answers with five; 1280 is the control that proves the same code still reaches six, so a build
       that had capped every fine-pointer window at five would not pass this pair. */
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    for (const [w, h, want] of [[900, 700, 5], [1280, 900, 6]]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      /* Longer than the app's own settle delay, since the last of the three looks a turn takes is
         the one that has to land here. */
      await new Promise(r => setTimeout(r, 700));
      const desk = await evalJs(READ);
      check('a ' + w + 'px laptop window is LANDSCAPE and keeps its week — ' + want
        + ' day columns, not one',
        desk.cols.length === want && desk.cols.length > 1 && desk.portrait === false
          && desk.coarse === false && desk.over <= 0,
        desk.cols.length + ' day column(s) at ' + desk.inner + ' (portrait = ' + desk.portrait
          + ', coarse = ' + desk.coarse + '), budget = (' + w
          + ' - 80 chrome - 280 name - 160 Passes) / 72; over its box by ' + desk.over + 'px');
    }

    /*
     * ── PAGING ACROSS A TURN — the second thing the owner found, 2026-08-07 ──
     *
     * "If I click Earlier three times and turn to portrait, I see 8/4 instead of today." Two separate
     * defects behind one symptom, and both are checked here.
     *
     * THE POSITION WAS COUNTED IN WINDOWS. `dayColumns()` sliced at `offset * count`, so the number
     * standing for where the teacher is got multiplied by a number that changes when the iPad turns:
     * three taps is eighteen weekdays back at six columns and three weekdays back at one. Now it is
     * counted in weekdays and the STEP is the window, so the anchor survives any change of width —
     * including a laptop drag, which is the same bug with a smaller jump and no rotation in it.
     *
     * AND PORTRAIT SHOULD NOT HAVE A POSITION AT ALL. Her rule: in portrait this screen shows today.
     * Pinned at the paint rather than on the turn, because a turn is only one of the ways into an
     * upright screen — a window dragged tall, a Split View pane, a boot in portrait.
     */
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1112, height: 834, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 700));

    /* The pager's own state, which is a claim about what a thumb can reach rather than about dates. */
    const PAGER = `(function(){
      /* Scoped to the pager: the "not on today" banner carries its own data-attendance-page="today"
         button, and an unscoped query would sometimes read that one instead. */
      var pick = function(dir){
        var b = document.querySelector('#attendancePager [data-attendance-page="' + dir + '"]');
        return b ? { there: true, off: !!b.disabled, title: b.title || '' }
                 : { there: false, off: false, title: '' }; };
      return { earlier: pick('earlier'), later: pick('later'), today: pick('today') }; })()`;

    const EARLIER = '#attendancePager [data-attendance-page="earlier"]';
    const TODAY_BTN = '#attendancePager [data-attendance-page="today"]';
    const page = async (sel, times) => {
      for (let i = 0; i < times; i++) {
        await clickSel(sel);
        await new Promise(r => setTimeout(r, 200));
      }
    };

    await page(EARLIER, 3);
    const back3 = await evalJs(READ);
    check('three taps of Earlier in landscape walk a whole window at a time — six columns, and today '
      + 'is not one of them',
      back3.cols.length === 6 && back3.cols.indexOf(day) < 0,
      'leftmost ' + JSON.stringify(back3.cols[0]) + ' across ' + back3.cols.length
        + ' column(s) at ' + back3.inner + '; today = ' + JSON.stringify(day));

    /* THE REPORTED SYMPTOM, exactly as she described it. Under the old build this read 8/4. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 700));
    const upright = await evalJs(READ);
    const uprightPager = await evalJs(PAGER);
    check('turning to portrait while paged three windows back shows TODAY, not the day the old '
      + 'arithmetic landed on',
      upright.cols.length === 1 && upright.cols[0] === day,
      upright.cols.length + ' column(s) ' + JSON.stringify(upright.cols) + ' at ' + upright.inner
        + '; today = ' + JSON.stringify(day));
    /* Disabled and still on screen, which is this strip's own answer for `Later` at today — a control
       that vanishes on rotation is a control the teacher goes hunting for. The tooltip is checked
       because it is the only place the backfill route is written down for her. */
    check('and the page controls are disabled in portrait rather than gone, and say to turn the iPad',
      uprightPager.earlier.there && uprightPager.earlier.off
        && uprightPager.later.there && uprightPager.later.off
        && /turn the ipad/i.test(uprightPager.earlier.title),
      'Earlier: there = ' + uprightPager.earlier.there + ', disabled = ' + uprightPager.earlier.off
        + ', title = ' + JSON.stringify(uprightPager.earlier.title) + '; Later disabled = '
        + uprightPager.later.off);

    /* Acceptance for part C: landscape comes back on the week ending today, because portrait zeroed
       the position rather than hiding it. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1112, height: 834, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 700));
    const backAcross = await evalJs(READ);
    check('and turning back to landscape lands on the week ending today, not on the page portrait '
      + 'was not allowed to keep',
      backAcross.cols.length === 6 && backAcross.cols[0] === day,
      backAcross.cols.length + ' column(s), leftmost ' + JSON.stringify(backAcross.cols[0])
        + ' against today = ' + JSON.stringify(day));

    /*
      THE ANCHOR, with no rotation in it at all — a laptop window dragged from six columns to five.
      The old window arithmetic slid the teacher from twelve weekdays back to ten without her touching
      anything; an anchor counted in days cannot. Read as "the leftmost column is the SAME DATE",
      which is the claim, rather than as a date this harness would have to compute for itself.
    */
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 700));
    await page(EARLIER, 2);
    const wide = await evalJs(READ);
    await send('Emulation.setDeviceMetricsOverride',
      { width: 900, height: 700, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 700));
    const narrow = await evalJs(READ);
    check('dragging a laptop window from six columns to five keeps the day you were looking at — it '
      + 'shows fewer days, it does not move you',
      wide.cols.length === 6 && narrow.cols.length === 5 && narrow.cols[0] === wide.cols[0]
        && wide.cols[0] !== day,
      'leftmost was ' + JSON.stringify(wide.cols[0]) + ' across ' + wide.cols.length
        + ' column(s) at 1280, and is ' + JSON.stringify(narrow.cols[0]) + ' across '
        + narrow.cols.length + ' at 900');

    /* Back to today, so the next section finds this screen where it expects it. */
    await clickSel(TODAY_BTN);
    await new Promise(r => setTimeout(r, 250));
    await send('Emulation.clearDeviceMetricsOverride');
  }
}
}
