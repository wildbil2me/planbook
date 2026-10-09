/* strip-holds-still.mjs — the strip above the attendance grid holds still under the pointer (WO-2.56)
 *
 * THREE DEFECTS, ONE FENCE. The owner found all three in daily use on 2026-09-28 and the work order
 * booked them as one on purpose: something above the grid appeared, disappeared or moved while the
 * teacher's pointer was on its way to the next control. The unconfirmed note pushed every row down
 * on the first tap; the paging band un-hid ABOVE the state line on the first ◀ Earlier and pushed the
 * pager down under the second click; and the pager itself was split across the width. Split, each
 * repair could pass while the strip as a whole still jumped — so this section proves them with one
 * set of measurements.
 *
 * THE MEASUREMENT IS FOUR RECTANGLES, TAKEN ONCE PER SIZE AND NEVER RE-BASED. The three pager
 * buttons and the first grid row, in DOCUMENT coordinates (the viewport rect plus the scroll
 * offset): clickSel() scrolls its target into view, so a viewport rect would move every time the
 * harness reached for a cell further down, and a document rect moves only when the layout does.
 * Compared with `===` on the raw numbers, not a tolerance — "to the pixel" is the acceptance line's
 * own phrase, and a tolerance is how a two-pixel creep passes six times. The baseline is recorded
 * ONCE per size, before the first action, so a drift across actions accumulates against it rather
 * than resetting at every step.
 *
 * THE ACTIONS ARE ASSERTED TO HAVE HAPPENED, IN A CHECK OF THEIR OWN. A fence that measured nothing
 * moving after six clicks that did nothing would be the vacuous green this harness keeps finding in
 * its own history — so each size has two checks: the six actions did what they say (the column
 * paged, the ✏ unlocked, the ledger took the marks), and nothing moved.
 *
 * PORTRAIT DOES FIVE OF THE SIX, AND SAYS WHICH. At 768×1024 the strip is one column, today, and
 * `◀ Earlier` and `Later ▶` are disabled (paintPager()'s ruling: a control that vanishes is one the
 * teacher goes hunting for, so a disabled one keeps its place in the group). They are pressed anyway
 * — a thumb lands on a disabled button exactly as it lands on a live one — and so is `Today`, which
 * is disabled on an unpaged, unlocked portrait strip. What portrait cannot do is the ✏: no past
 * column is drawn, and the only ways to stand on one (a calendar arrival, a term that has ended) put
 * the strip on a LOCKED day, whose note — the work order's Out of scope — is exactly what a ✏ takes
 * away. That is named in the check's own detail rather than dropped silently.
 *
 * EVERY DATE IS DERIVED FROM TODAY, through lib-dates.mjs, so `--today` moves the whole fixture.
 * One class of its own, thirteen students — so one tap leaves the twelve the acceptance line names —
 * and one past record two weekdays back holding three `U`s, for the ✏ and for the editing line.
 * Nothing else in the document is read or written, and the class comes back out at the foot.
 */

import { nodeColumns, nodeWeekdayAhead } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- the strip above the attendance grid holds still under the pointer (WO-2.56) ---');

if (!seam) {
  skip('nothing above the attendance grid moves under the pointer across the six actions',
    'window.planbook is not on the page, so nothing here can seed a class or read the ledger');
} else {
  const CLS = 'c_wo256';
  const IDS = [];
  for (let i = 0; i < 13; i++) IDS.push('s_wo256_' + String(i).padStart(2, '0'));
  /* The n-th weekday back from today, today being index 0 whatever day it is — nodeColumns()'s own
     rule, read at one index rather than copied (calendar-opens-on-day.mjs does the same). */
  const back = (n) => nodeColumns(n + 1, 0)[n];
  const TODAY = back(0);
  const PAST = back(2);
  /* One term holding today and the past day, so the ✏ on PAST is drawn at all (WO-2.50 draws no ✏
     on a day outside every term), and a pair for the rollover: one that ended the weekday before
     PAST, and one that starts on PAST and holds today. */
  const MAIN = { id: 'tm_wo256m', label: 'WO-2.56 running', start: back(30), end: nodeWeekdayAhead(40) };
  const ENDED = { id: 'tm_wo256a', label: 'WO-2.56 ended', start: back(30), end: back(3) };
  const HOLDS = { id: 'tm_wo256b', label: 'WO-2.56 now', start: back(2), end: nodeWeekdayAhead(40) };
  const PAST_MARKS = { [IDS[0]]: { code: 'U' }, [IDS[1]]: { code: 'U' }, [IDS[2]]: { code: 'U' } };
  /* The state line's own date, in the column head's numerals with a three-letter weekday — the
     wording src/attendance.js's lineDate() chose. Composed here from the ISO string alone, because
     the claim is about the words on screen and not about which formatter made them. */
  const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const lineDate = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return WEEKDAY[new Date(y, m - 1, d).getDay()] + ' ' + m + '/' + d;
  };

  const onView = async () => await evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
  const size = async (width, height, coarse) => {
    await send('Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 1, mobile: !!coarse });
    await send('Emulation.setTouchEmulationEnabled', coarse
      ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await new Promise(r => setTimeout(r, 350));
  };
  /* The ordinary way in: the class grid, then this class's card. resetRegistry() runs on that path,
     so every size starts unpaged, unlocked and on today. */
  const enterClass = async () => {
    if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
  };
  /* Today's record off and the past record back to its three `U`s, in place — the same fixture at
     the start of every size, so no size inherits the marks the one before it made. */
  const resetLedger = (terms) => evalJs(`(async function(){
    var s = window.planbook.store;
    s.update(function(d){
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
      d.attendance.push({ classId:'${CLS}', date:'${PAST}', marks:${JSON.stringify(PAST_MARKS)} });
      var c = (d.classes || []).filter(function(x){ return x.id === '${CLS}'; })[0];
      if (c) c.terms = ${JSON.stringify(terms)};
    });
    await s.flush();
    return 1; })()`);

  /* THE SIZE IS HANDED BACK EVEN IF SOMETHING BELOW THROWS. This section turns touch emulation on
     for its two iPad sizes, and runSection() contains a throw by reloading the page, which leaves
     emulation exactly as the throw found it — so without this the section after it would measure a
     coarse pointer it never asked for. */
  try {
    /* ── the fixture, then a reload so every screen is drawn from it ── */
    await size(1280, 800, false);
    const plant = await evalJs(`(async function(){
      var s = window.planbook.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        if (!Array.isArray(doc.students)) doc.students = [];
        if (!Array.isArray(doc.attendance)) doc.attendance = [];
        ${JSON.stringify(IDS)}.forEach(function(id, i){
          doc.students.push({ id:id, first:'Wo256' + String.fromCharCode(65 + i), last:'Strip' + String.fromCharCode(65 + i) });
        });
        doc.classes.push({ id:'${CLS}', name:'WO-2.56 Strip', archived:false,
          roster:${JSON.stringify(IDS)}, letterScale:null,
          terms:${JSON.stringify([MAIN])}, categories:[] });
      });
      await s.flush();
      return { ok:true }; })()`);
    await resetLedger([MAIN]);
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);

    /* EVERYTHING THIS SECTION READS, IN ONE ROUND TRIP. `rects` is the fence; the rest is what the
       two kinds of check beside it need — what the actions did, and what the state line says. */
    await evalJs(`(function(){
      window.__wo256 = function(){
        var box = function(el){
          if (!el) return null;
          var b = el.getBoundingClientRect();
          return [b.left + window.scrollX, b.top + window.scrollY, b.width, b.height];
        };
        var pager = document.getElementById('attendancePager');
        var btn = function(which){
          return pager ? pager.querySelector('[data-attendance-page="' + which + '"]') : null; };
        var firstRow = document.querySelector('#attendanceBody tr[data-attendance-row]');
        var state = document.getElementById('attendanceState');
        var note = document.getElementById('attendanceNote');
        var band = document.getElementById('attendanceBanner');
        var heads = Array.prototype.slice.call(
          document.querySelectorAll('#attendanceHead th[data-attendance-col]'));
        var rec = function(date){
          return (window.planbook.store.getDoc().attendance || []).filter(function(r){
            return r.classId === '${CLS}' && r.date === date; })[0] || null; };
        var uIn = function(date){
          var r = rec(date); if (!r) return -1;
          return Object.keys(r.marks || {}).filter(function(k){ return r.marks[k].code === 'U'; }).length; };
        var shown = function(el){ return !!el && el.getClientRects().length > 0; };
        var pagerStyle = pager ? getComputedStyle(pager) : null;
        return {
          view: (function(){ var v = document.querySelector('main > :not(.hidden)'); return v ? v.id : ''; })(),
          rects: { earlier: box(btn('earlier')), today: box(btn('today')), later: box(btn('later')),
                   row: box(firstRow) },
          disabled: { earlier: !!(btn('earlier') || {}).disabled, today: !!(btn('today') || {}).disabled,
                      later: !!(btn('later') || {}).disabled },
          stateRect: box(state), bandRect: shown(band) ? box(band) : null,
          stateText: (document.getElementById('attendanceStateText') || {}).textContent || '',
          stateClass: state ? state.className : '',
          stateTitle: state ? (state.getAttribute('title') || '') : '',
          stateLabel: state ? (state.getAttribute('aria-label') || '') : '',
          noteShown: !!note && !note.classList.contains('hidden'),
          bandUp: !!band && !band.classList.contains('hidden'),
          bandText: band ? band.textContent : '',
          bandCls: band ? band.className : '',
          backTo: Array.prototype.slice.call(document.querySelectorAll('button'))
            .filter(function(b){ return shown(b) && /^\\s*Back to/.test(b.textContent || ''); })
            .map(function(b){ return b.textContent.trim(); }),
          pagerKids: pager ? Array.prototype.slice.call(pager.children).map(function(k){
            return k.tagName + ':' + (k.getAttribute('data-attendance-page') || k.className || ''); }) : [],
          rangeSpans: document.querySelectorAll('.attendance-pager-range').length,
          pagerBox: box(pager),
          /* The row the pager is the right half of since WO-2.58 (.attendance-strip). The pager's
             own box is only as wide as its three buttons there, so "Earlier is not in the left half"
             is asked of the row it shares with the action buttons. */
          stripBox: box(pager ? pager.closest('.attendance-strip') : null),
          pagerPadRight: pagerStyle ? parseFloat(pagerStyle.paddingRight) || 0 : 0,
          newest: heads.length ? heads[0].getAttribute('data-attendance-col') : '',
          cols: heads.length,
          editing: heads.filter(function(th){ return / attendance-col-editing\\b/.test(th.className); })
            .map(function(th){ return th.getAttribute('data-attendance-col'); }),
          todayU: uIn('${TODAY}'), pastU: uIn('${PAST}'),
          term: window.planbook.classes.getSelectedTermId()
        };
      };
      return 1; })()`);
    const read = async () => {
      await new Promise(r => setTimeout(r, 200));
      return evalJs('(async function(){ await window.planbook.store.flush(); return window.__wo256(); })()');
    };
    const cell = (id, date) => '#attendanceBody [data-attendance-cell="' + id
      + '"][data-attendance-date="' + date + '"]';
    const page = (which) => clickSel('#attendancePager [data-attendance-page="' + which + '"]');
    const key = (r) => JSON.stringify(r.rects);
    const drift = (base, steps) => steps
      .filter((s) => key(s.r) !== key(base))
      .map((s) => s.label + ': ' + ['earlier', 'today', 'later', 'row']
        .filter((k) => JSON.stringify(s.r.rects[k]) !== JSON.stringify(base.rects[k]))
        .map((k) => k + ' ' + JSON.stringify(base.rects[k]) + ' -> ' + JSON.stringify(s.r.rects[k]))
        .join(', '));

    check('WO-2.56 fixture: one class of thirteen, on the register, on today, with a past record '
      + 'two weekdays back holding three unconfirmed',
      !!plant && plant.ok === true,
      JSON.stringify({ plant, TODAY, PAST }));

    /* ── the fence, at the three sizes ── */
    const SIZES = [
      { name: '1280×800', w: 1280, h: 800, coarse: false, pages: true },
      { name: '1024×768 (iPad landscape)', w: 1024, h: 768, coarse: true, pages: true },
      { name: '768×1024 (iPad portrait)', w: 768, h: 1024, coarse: true, pages: false },
    ];
    const pagerShapes = [];
    let firstTapRead = null, pagedRead = null;
    for (const sz of SIZES) {
      await size(sz.w, sz.h, sz.coarse);
      await resetLedger([MAIN]);
      await enterClass();
      const base = await read();
      pagerShapes.push({ size: sz.name, r: base });
      const steps = [];
      const after = async (label) => { const r = await read(); steps.push({ label, r }); return r; };

      await clickSel(cell(IDS[0], TODAY));
      const tapped = await after('the first tap on a student');
      if (sz.w === 1280) firstTapRead = tapped;
      await page('earlier');
      const earlier = await after('◀ Earlier');
      if (sz.w === 1280) pagedRead = earlier;
      await page('later');
      const later = await after('Later ▶');
      let pencil = null;
      if (sz.pages) {
        await clickSel('#attendanceHead th[data-attendance-col="' + PAST + '"] [data-attendance-edit]');
        pencil = await after('the ✏ on ' + PAST);
      }
      await page('today');
      const home = await after('Today');
      for (let i = 1; i < IDS.length; i++) {
        await clickSel(cell(IDS[i], TODAY));
        if (i < IDS.length - 1) await after('tap ' + (i + 1) + ' of 13');
      }
      const last = await after('the last ? confirmed');

      const did = sz.pages
        ? tapped.todayU === 12 && earlier.newest !== TODAY && earlier.newest < TODAY
          && later.newest === TODAY && pencil && pencil.editing.join() === PAST
          && home.newest === TODAY && home.editing.length === 0 && last.todayU === 0
        : base.cols === 1 && base.disabled.earlier && base.disabled.later && base.disabled.today
          && tapped.todayU === 12 && earlier.newest === TODAY && later.newest === TODAY
          && home.newest === TODAY && last.todayU === 0;
      check(sz.name + ': the actions the fence measures across all happened — '
        + (sz.pages ? 'the first tap, ◀ Earlier, Later ▶, the ✏ on a past column, Today, and the last ? confirmed'
          : 'the first tap, the disabled ◀ Earlier, Later ▶ and Today pressed where a thumb lands on them, '
            + 'and the last ? confirmed (no ✏: portrait draws no past column, and the two ways onto one '
            + 'stand on a LOCKED day, whose note is out of this work order’s scope)'),
        did,
        'columns ' + base.cols + ', disabled ' + JSON.stringify(base.disabled) + '; U on today after '
          + 'the first tap ' + tapped.todayU + ', newest column after Earlier ' + earlier.newest
          + ', after Later ' + later.newest + (pencil ? ', editing after the ✏ '
          + JSON.stringify(pencil.editing) : '') + ', after Today ' + home.newest + ' editing '
          + JSON.stringify(home.editing) + ', U left on today at the end ' + last.todayU);
      const moved = drift(base, steps);
      check(sz.name + ': no pager button and no grid row moves by a pixel across them — every rect '
        + 'equal to the one taken before the first tap',
        base.rects.earlier && base.rects.today && base.rects.later && base.rects.row
          && moved.length === 0,
        moved.length ? 'moved — ' + moved.join(' | ')
          : steps.length + ' readings, every one ' + key(base) + '; state line '
            + JSON.stringify(base.stateRect) + ' throughout');
    }

    /* ── acceptance 7: the pager is three buttons together at the right, and no range ── */
    const shapeFaults = [];
    pagerShapes.forEach(({ size: name, r }) => {
      const e = r.rects.earlier, t = r.rects.today, l = r.rects.later, p = r.pagerBox;
      const kids = r.pagerKids.join(' ');
      if (kids !== 'BUTTON:earlier BUTTON:today BUTTON:later') shapeFaults.push(name + ' children ' + kids);
      if (r.rangeSpans !== 0) shapeFaults.push(name + ' ' + r.rangeSpans + ' range span(s)');
      if (!e || !t || !l || !p) { shapeFaults.push(name + ' a button is missing'); return; }
      const gap1 = t[0] - (e[0] + e[2]), gap2 = l[0] - (t[0] + t[2]);
      const rightGap = (p[0] + p[2] - r.pagerPadRight) - (l[0] + l[2]);
      if (!(gap1 > 0 && gap1 <= 12 && Math.abs(gap1 - gap2) < 0.5)) {
        shapeFaults.push(name + ' gaps ' + gap1 + ' / ' + gap2);
      }
      if (Math.abs(rightGap) >= 1) shapeFaults.push(name + ' Later ▶ ends ' + rightGap + 'px short of the pager’s right edge');
      const row = r.stripBox || p;
      if (e[0] < row[0] + row[2] / 2) shapeFaults.push(name + ' ◀ Earlier starts in the left half of the strip, at ' + e[0]);
    });
    check('the pager is ◀ Earlier · Today · Later ▶, in that order, grouped at the right edge with one '
      + 'gap between them, and no date range — at all three sizes, portrait’s disabled pair keeping its place',
      shapeFaults.length === 0,
      shapeFaults.length ? shapeFaults.join(' | ')
        : pagerShapes.map((s) => s.size + ' ' + JSON.stringify([s.r.rects.earlier, s.r.rects.today,
          s.r.rects.later])).join(' | '));

    /* ── acceptance 3: twelve unconfirmed, the rule on the title, and no note ── */
    const ft = firstTapRead || {};
    check('with 12 students unconfirmed the state line reads *12 unconfirmed* in the caution wash, its '
      + 'title and accessible name carry *count as absent*, and #attendanceNote is hidden',
      ft.stateText === '12 unconfirmed' && / unconfirmed\b/.test(ft.stateClass || '')
        && /count as absent/.test(ft.stateTitle || '') && /count as absent/.test(ft.stateLabel || '')
        && (ft.stateLabel || '').indexOf('12 unconfirmed') === 0
        && ft.noteShown === false,
      JSON.stringify({ text: ft.stateText, cls: ft.stateClass, title: ft.stateTitle,
        label: ft.stateLabel, note: ft.noteShown }));

    /* ── acceptance 4: paged back, the sentence, no *Back to*, and one Today press ── */
    const pr = pagedRead || {};
    await size(1280, 800, false);
    await resetLedger([MAIN]);
    await enterClass();
    await page('earlier');
    const pagedClean = await read();
    await page('today');
    const returned = await read();
    check('paged back, the state line reads *Today is not on screen.* in its own tone — both mid-marking '
      + 'and on a clean start — and there is no *Back to* button anywhere on the screen',
      pr.stateText === 'Today is not on screen.' && pagedClean.stateText === 'Today is not on screen.'
        && / away\b/.test(pagedClean.stateClass) && !pr.bandUp && !pagedClean.bandUp
        && (pr.backTo || []).length === 0 && pagedClean.backTo.length === 0
        && pagedClean.newest < TODAY,
      'mid-marking ' + JSON.stringify(pr.stateText) + ' (band up ' + pr.bandUp + ', Back-to buttons '
        + JSON.stringify(pr.backTo) + '); clean ' + JSON.stringify(pagedClean.stateText) + ' wearing '
        + JSON.stringify(pagedClean.stateClass) + ', newest column ' + pagedClean.newest);
    check('and one `Today` press returns the strip: the newest column is today and the state line '
      + 'describes today again',
      returned.newest === TODAY && returned.stateText === 'Not taken yet'
        && returned.disabled.today === true && returned.backTo.length === 0,
      'newest ' + returned.newest + ', state ' + JSON.stringify(returned.stateText) + ', Today disabled '
        + returned.disabled.today);

    /* ── acceptance 5: a past day unlocked — with `?`s left, and with none ── */
    await clickSel('#attendanceHead th[data-attendance-col="' + PAST + '"] [data-attendance-edit]');
    const editU = await read();
    for (let i = 0; i < 3; i++) await clickSel(cell(IDS[i], PAST));
    const editDone = await read();
    const EDITING = 'Editing ' + lineDate(PAST);
    check('a past day unlocked with ?s left: the state line reads *' + EDITING + ' · 3 unconfirmed* in '
      + 'the caution wash, and carries the count-as-absent rule on its title',
      editU.stateText === EDITING + ' · 3 unconfirmed' && / unconfirmed\b/.test(editU.stateClass)
        && /count as absent/.test(editU.stateTitle) && !editU.noteShown && !editU.bandUp
        && editU.editing.join() === PAST,
      JSON.stringify({ text: editU.stateText, cls: editU.stateClass, title: editU.stateTitle,
        editing: editU.editing, band: editU.bandUp }));
    check('and with none left it reads *' + EDITING + '* beside the day’s own state — *Taken · all '
      + 'present*, in the taken palette, with no rule on the title',
      editDone.pastU === 0 && editDone.stateText === EDITING + ' · Taken · all present'
        && / taken\b/.test(editDone.stateClass) && !/ unconfirmed\b/.test(editDone.stateClass)
        && editDone.stateTitle === '' && editDone.stateLabel === '',
      JSON.stringify({ text: editDone.stateText, cls: editDone.stateClass, title: editDone.stateTitle,
        pastU: editDone.pastU }));
    await page('today');

    /* ── acceptance 6: the rollover band stays up, and in place, while paged ──
       The term nav's own tab, clicked, is what puts the screen on the ended term: an arrival would
       roll the term forward to the one holding today (resetRegistry(), WO-2.52), which is the very
       thing the band exists to ask for. */
    await resetLedger([ENDED, HOLDS]);
    await enterClass();
    await clickSel('#termNav [data-term-select="' + ENDED.id + '"]');
    const rollBase = await read();
    await page('earlier');
    const rollPaged = await read();
    await page('earlier');
    const rollPaged2 = await read();
    await page('later');
    await page('later');
    const rollBack = await read();
    const SAYS = 'Today is in ' + HOLDS.label + ' — you are still on ' + ENDED.label + '.';
    check('with the term-rollover band up, paging back twice and forward twice leaves it up, saying the '
      + 'same thing, in the same place — and the pager and the first row do not move',
      rollBase.bandUp && / rollover\b/.test(rollBase.bandCls) && rollBase.bandText.indexOf(SAYS) === 0
        && rollPaged.newest < rollBase.newest && rollPaged2.newest < rollPaged.newest
        && [rollPaged, rollPaged2, rollBack].every((r) => r.bandUp && r.bandText === rollBase.bandText
          && JSON.stringify(r.bandRect) === JSON.stringify(rollBase.bandRect) && key(r) === key(rollBase)),
      'band ' + JSON.stringify(rollBase.bandText) + ' at ' + JSON.stringify(rollBase.bandRect)
        + '; paged ' + [rollPaged, rollPaged2, rollBack].map((r) => r.newest + ' band '
          + r.bandUp + ' ' + JSON.stringify(r.bandRect) + ' fence ' + (key(r) === key(rollBase)))
          .join(' | ') + '; state line while paged ' + JSON.stringify(rollPaged.stateText));
    await page('earlier');
    /* Reported rather than thrown when the button is not there: a build that dropped the band while
       paged is exactly what this block is asking about, and clickSel() throwing on it would take the
       teardown below down with the check. */
    const switchSel = '#attendanceBanner [data-term-select]';
    const hadSwitch = await has(switchSel);
    if (hadSwitch) await clickSel(switchSel);
    const switched = await read();
    check('and its Switch button still works from a paged strip: the term today is in is selected and '
      + 'the band goes',
      hadSwitch && rollBase.term === ENDED.id && switched.term === HOLDS.id && !switched.bandUp
        && switched.backTo.length === 0,
      'the Switch was on the paged band = ' + hadSwitch + '; open term '
        + JSON.stringify(rollBase.term) + ' -> ' + JSON.stringify(switched.term)
        + ', band up ' + switched.bandUp + ', newest column ' + switched.newest);
  } finally {
    await size(1280, 900, false);
  }

  /* ── teardown ── */
  await size(1280, 900, false);
  if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
  const cleaned = await evalJs(`(async function(){
    var s = window.planbook.store, ids = ${JSON.stringify(IDS)};
    s.update(function(d){
      d.classes = (d.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      d.students = (d.students || []).filter(function(p){ return ids.indexOf(p.id) < 0; });
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
    });
    await s.flush();
    delete window.__wo256;
    var d = s.getDoc();
    return (d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length
      + (d.students || []).filter(function(p){ return ids.indexOf(p.id) >= 0; }).length
      + (d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
  check('the WO-2.56 fixture came back off the document and the page was left on the class grid',
    cleaned === 0 && (await onView()) === 'homeView',
    cleaned + ' fixture record(s) left behind; left on #' + (await onView()));
}
}
