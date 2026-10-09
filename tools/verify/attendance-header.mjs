/* attendance-header.mjs — the attendance header gives back the rows it does not need (WO-2.58)
 *
 * WHAT IT MEASURES, AGAINST THE WORK ORDER'S ACCEPTANCE LINES. One class of its own, driven at the
 * owner's two iPad widths under a coarse pointer — 820 upright and 1180 lying down, the drawing's
 * frames A and B — through the states the strip above the grid can be in:
 *
 *   line 1  the strip (the action buttons and the pager on one row) is ONE line in every state, the
 *           widest included — three action buttons, "Un-confirm everyone" among them — and the
 *           grid's first row is at the same height before the first tap, after it, and after the
 *           first mark. The widths are printed in the detail, because ruling 3's fallbacks are
 *           measured rather than ruled and the owner reads which one the build took.
 *   line 2  the toolbar is one line at 1180; at 820 it is two, with Sort and the three doors
 *           together on the second.
 *   line 3  taken with nothing marked and nobody unconfirmed, the strip offers exactly "Not taken
 *           yet" and "Didn't meet", and the first leaves the day with no record; "Un-confirm
 *           everyone" is drawn only on a day carrying a mark — asked of all five states.
 *   line 4  the term and year totals are a span inside the state line, correct before a mark, after
 *           one and after a term change — and #attendanceTotals is not in the document.
 *   line 6  the sort toggle flips the order and its own label; the three doors are glyphs whose
 *           accessible names are the shipped ones, word for word.
 *
 * Line 5 — the ✕ in both search boxes — is in tools/verify/score-search.mjs, which already holds a
 * fixture for both boxes and is where a search box's checks live.
 *
 * MEASURED IN DOCUMENT COORDINATES and compared with `===`, for the reason strip-holds-still.mjs
 * gives: clickSel() scrolls its target into view, so a viewport rect would move every time the
 * harness reached for a cell, and "the grid held still" is a claim to the pixel.
 *
 * EVERY DATE IS DERIVED FROM TODAY through lib-dates.mjs, so `--today` moves the whole fixture, and
 * the class comes back out at the foot.
 */

import { nodeColumns, nodeWeekdayAhead } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- the attendance header gives back the rows it does not need (WO-2.58) ---');

if (!seam) {
  skip('the attendance header: the strip, the toolbar, the actions, the totals and the sort toggle',
    'window.planbook is not on the page, so nothing here can seed a class or read the ledger');
} else {
  const CLS = 'c_wo258';
  const IDS = [];
  for (let i = 0; i < 13; i++) IDS.push('s_wo258_' + String(i).padStart(2, '0'));
  const back = (n) => nodeColumns(n + 1, 0)[n];
  const TODAY = back(0);
  /* Two terms, so a term change has somewhere to go: Quarter 1 has ended and Quarter 2 holds today,
     and arrival rolls the screen onto Quarter 2 (resetRegistry(), WO-2.52). Real-length labels on
     purpose — "Quarter 2: 3 recorded meetings · Year: 6 recorded meetings" is the longest the totals
     get in the owner's own classes, and the state line has to hold it beside the day's words. */
  const Q1 = { id: 'tm_wo258a', label: 'Quarter 1', start: back(40), end: back(11) };
  const Q2 = { id: 'tm_wo258b', label: 'Quarter 2', start: back(10), end: nodeWeekdayAhead(40) };
  /* Five meetings before today: three in Quarter 1 and two in Quarter 2. */
  const PAST = [back(20), back(15), back(12), back(5), back(3)];
  /* First names and last names in OPPOSITE orders, so sorting by one is visibly not sorting by the
     other — a toggle that changed its label and not the rows would pass a fixture where they agree. */
  const FIRST = (i) => 'Wo258' + String.fromCharCode(65 + i);
  const LAST = (i) => 'Header' + String.fromCharCode(77 - i);
  const SAID = (label, inTerm, inYear) => label + ': ' + inTerm + ' recorded meeting' + (inTerm === 1 ? '' : 's')
    + ' · Year: ' + inYear + ' recorded meeting' + (inYear === 1 ? '' : 's');

  const onView = async () => await evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
  const size = async (width, height, coarse) => {
    await send('Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 1, mobile: !!coarse });
    await send('Emulation.setTouchEmulationEnabled', coarse
      ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await new Promise(r => setTimeout(r, 350));
  };
  const enterClass = async () => {
    if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
  };
  /* Today's record off and the five past meetings back, in place — the same ledger at the start of
     every size, so no size inherits the marks the one before it made. */
  const resetLedger = () => evalJs(`(async function(){
    var s = window.planbook.store;
    s.update(function(d){
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
      ${JSON.stringify(PAST)}.forEach(function(date){
        d.attendance.push({ classId:'${CLS}', date:date, marks:{} }); });
    });
    await s.flush();
    return 1; })()`);

  try {
    await size(1280, 800, false);
    const plant = await evalJs(`(async function(){
      var s = window.planbook.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        if (!Array.isArray(doc.students)) doc.students = [];
        if (!Array.isArray(doc.attendance)) doc.attendance = [];
        ${JSON.stringify(IDS)}.forEach(function(id, i){
          doc.students.push({ id:id, first:'Wo258' + String.fromCharCode(65 + i),
            last:'Header' + String.fromCharCode(77 - i) });
        });
        doc.classes.push({ id:'${CLS}', name:'WO-2.58 Header', archived:false,
          roster:${JSON.stringify(IDS)}, letterScale:null,
          terms:${JSON.stringify([Q1, Q2])}, categories:[] });
      });
      await s.flush();
      return { ok:true }; })()`);
    await resetLedger();
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);

    /* EVERYTHING THIS SECTION READS, IN ONE ROUND TRIP. */
    await evalJs(`(function(){
      window.__wo258 = function(){
        var box = function(el){
          if (!el) return null;
          var b = el.getBoundingClientRect();
          return [b.left + window.scrollX, b.top + window.scrollY, b.width, b.height];
        };
        var strip = document.querySelector('#classView .attendance-strip');
        var actions = document.getElementById('attendanceActions');
        var pager = document.getElementById('attendancePager');
        var stripBtns = strip ? Array.prototype.slice.call(strip.querySelectorAll('button')) : [];
        var state = document.getElementById('attendanceState');
        var totals = document.getElementById('attendanceStateTotals');
        var stateText = document.getElementById('attendanceStateText');
        var toolbar = document.querySelector('#classView .attendance-toolbar');
        var find = toolbar ? toolbar.querySelector('.attendance-find') : null;
        var pills = document.getElementById('attendancePills');
        var tools = toolbar ? toolbar.querySelector('.attendance-tools') : null;
        var toolBtns = tools ? Array.prototype.slice.call(tools.querySelectorAll('button')) : [];
        var pillBtns = pills ? Array.prototype.slice.call(pills.querySelectorAll('button')) : [];
        var firstRow = document.querySelector('#attendanceBody tr[data-attendance-row]');
        var sort = document.getElementById('attendanceSort');
        var rec = (window.planbook.store.getDoc().attendance || []).filter(function(r){
          return r.classId === '${CLS}' && r.date === '${TODAY}'; })[0] || null;
        var gap = strip ? parseFloat(getComputedStyle(strip).columnGap) || 0 : 0;
        return {
          coarse: matchMedia('(pointer: coarse)').matches,
          stripParent: !!strip && !!actions && !!pager && actions.parentNode === strip && pager.parentNode === strip,
          stripRect: box(strip),
          stripScroll: strip ? [strip.scrollWidth, strip.clientWidth] : null,
          need: (actions ? actions.scrollWidth : 0) + (pager ? pager.scrollWidth : 0) + gap,
          actionsW: actions ? actions.scrollWidth : 0, pagerW: pager ? pager.scrollWidth : 0, gap: gap,
          stripTops: stripBtns.map(function(b){ return Math.round(b.getBoundingClientRect().top * 100) / 100; }),
          stripHeights: stripBtns.map(function(b){ return Math.round(b.getBoundingClientRect().height); }),
          actions: actions ? Array.prototype.slice.call(actions.querySelectorAll('button'))
            .map(function(b){ return (b.textContent || '').trim(); }) : [],
          hooks: actions ? Array.prototype.slice.call(actions.querySelectorAll('button'))
            .map(function(b){ return ['data-attendance-take','data-attendance-untake',
              'data-attendance-unconfirm-all','data-attendance-drop','data-term-manage']
              .filter(function(k){ return b.hasAttribute(k); }).join(''); }) : [],
          row: box(firstRow),
          stateRect: box(state),
          stateText: stateText ? stateText.textContent : null,
          stateWhole: state ? state.textContent : '',
          totals: totals ? totals.textContent : null,
          totalsInside: !!totals && !!state && totals.parentNode === state,
          totalsCls: totals ? totals.className : '',
          oldTotals: !!document.getElementById('attendanceTotals'),
          oldTotalsCls: document.querySelectorAll('.attendance-totals').length,
          tb: { find: box(find), pills: box(pills), tools: box(tools) },
          pillTops: pillBtns.map(function(b){ return Math.round(b.getBoundingClientRect().top); }),
          toolTops: toolBtns.map(function(b){ return Math.round(b.getBoundingClientRect().top); }),
          toolKids: toolBtns.map(function(b){ return b.id || b.className.split(' ').filter(function(c){
            return c.indexOf('attendance-') === 0; }).join(''); }),
          sortLabel: sort ? (sort.textContent || '').replace(/\\s+/g, ' ').trim() : null,
          sortNext: sort ? sort.getAttribute('data-attendance-sort') : null,
          sortTitle: sort ? sort.title : '',
          rowsLast: Array.prototype.slice.call(document.querySelectorAll('#attendanceBody tr[data-attendance-row]'))
            .map(function(r){ return r.getAttribute('data-attendance-row'); }),
          record: rec ? { keys: Object.keys(rec).sort().join(','),
            marks: Object.keys(rec.marks || {}).length,
            u: Object.keys(rec.marks || {}).filter(function(k){ return rec.marks[k].code === 'U'; }).length } : null,
          term: window.planbook.classes.getSelectedTermId()
        };
      };
      return 1; })()`);
    const read = async () => {
      await new Promise(r => setTimeout(r, 200));
      return evalJs('(async function(){ await window.planbook.store.flush(); return window.__wo258(); })()');
    };
    /* An action pressed only if it is drawn, and reported by the checks rather than thrown: a build
       that offers a different set of buttons is exactly what line 3 asks about, and clickSel()
       throwing on a missing one would take every check after it down too. */
    const press = async (hook) => {
      const sel = '#attendanceActions [' + hook + ']';
      if (!(await has(sel))) return false;
      await clickSel(sel);
      return true;
    };
    const cell = (id) => '#attendanceBody [data-attendance-cell="' + id + '"][data-attendance-date="' + TODAY + '"]';
    const oneLine = (r) => r.stripTops.length > 0 && r.stripTops.every((t) => Math.abs(t - r.stripTops[0]) < 1)
      && r.stripScroll && r.stripScroll[0] <= r.stripScroll[1]
      && r.stripRect && r.stripRect[3] < 2 * Math.min.apply(null, r.stripHeights);
    const widths = (label, r) => label + ': strip ' + (r.stripRect ? r.stripRect[2] : '?') + 'px wide holds '
      + r.need + 'px (actions ' + r.actionsW + ' + gap ' + r.gap + ' + pager ' + r.pagerW + '), slack '
      + (r.stripRect ? Math.round((r.stripRect[2] - r.need) * 100) / 100 : '?') + 'px, buttons '
      + JSON.stringify(r.actions);

    check('WO-2.58 fixture: one class of thirteen in two terms, five meetings before today, on the register',
      !!plant && plant.ok === true, JSON.stringify({ plant, TODAY, PAST, Q1: Q1.end, Q2: Q2.start }));

    /* ── lines 1, 3 and 4 at 820 under a coarse pointer — upright, the drawing's frame A ── */
    await size(820, 1180, true);
    await resetLedger();
    await enterClass();
    const s0 = await read();                                             // not taken
    await press('data-attendance-take');
    const t0 = await read();                                             // taken, nothing on it
    await press('data-attendance-untake');
    const u0 = await read();                                             // back to not taken
    await clickSel(cell(IDS[0]));
    const s1 = await read();                                             // the first tap: only ?s
    await clickSel(cell(IDS[0]));
    const s2 = await read();                                             // the first mark: marks and ?s
    await press('data-attendance-take');
    const s3 = await read();                                             // marks, no ?s

    const wide = [s1, s2].filter((r) => r.actions.length === 3);
    check('at 820 under a coarse pointer the strip holds the action buttons and the pager as its two children, and is ONE line in every state — the widest, three action buttons with "Un-confirm everyone", included',
      s0.coarse === true && s0.stripParent && wide.length === 2
        && s2.actions.indexOf('Un-confirm everyone') >= 0
        && [s0, t0, u0, s1, s2, s3].every(oneLine),
      [widths('not taken', s0), widths('first tap', s1), widths('first mark (widest)', s2),
        widths('everyone confirmed', s3)].join(' | ') + ' · tops in the widest '
        + JSON.stringify(s2.stripTops) + ' · coarse ' + s0.coarse);
    check('and the grid\'s first row is at the same height before the first tap, after it, and after the first mark — and through the take and un-take before them',
      !!s0.row && [t0, u0, s1, s2, s3].every((r) => JSON.stringify(r.row) === JSON.stringify(s0.row)),
      'first row ' + JSON.stringify(s0.row) + ' then ' + [t0, u0, s1, s2, s3].map((r) => JSON.stringify(r.row)).join(', ')
        + ' · state line ' + JSON.stringify(s0.stateRect) + ' -> ' + JSON.stringify(s2.stateRect));

    const unconfirmIn = (r) => r.hooks.indexOf('data-attendance-unconfirm-all') >= 0;
    check('taken with nothing marked and nobody unconfirmed, the strip offers exactly "Not taken yet" and "Didn’t meet", and "Not taken yet" leaves the day with no record',
      t0.stateText === 'Taken · all present' && t0.record && t0.record.marks === 0
        && JSON.stringify(t0.actions) === JSON.stringify(['Not taken yet', 'Didn’t meet'])
        && JSON.stringify(t0.hooks) === JSON.stringify(['data-attendance-untake', 'data-attendance-drop'])
        && u0.record === null && u0.stateText === 'Not taken yet',
      'taken: ' + JSON.stringify({ state: t0.stateText, actions: t0.actions, record: t0.record })
        + ' · after Not taken yet: ' + JSON.stringify({ state: u0.stateText, record: u0.record }));
    check('"Un-confirm everyone" is drawn only on a day carrying a mark — absent not taken, absent taken with nothing on it, absent with only ?s, present with a mark and ?s, present with a mark and none',
      !unconfirmIn(s0) && !unconfirmIn(t0) && !unconfirmIn(s1) && unconfirmIn(s2) && unconfirmIn(s3)
        && s1.record && s1.record.u === 12 && s1.record.marks === 12
        && s2.record && s2.record.marks === 13 && s2.record.u === 12
        && s3.record && s3.record.u === 0 && s3.record.marks === 1,
      [['not taken', s0], ['taken, nothing', t0], ['only ?s', s1], ['a mark and ?s', s2], ['a mark, no ?s', s3]]
        .map(([n, r]) => n + ' ' + JSON.stringify(r.actions) + ' ' + JSON.stringify(r.record)).join(' | '));

    /* ── line 4: the totals inside the state line ── */
    check('the term and year totals are a span inside the state line, at its far end, and #attendanceTotals is not in the document',
      s0.totalsInside && s0.totalsCls === 'attendance-state-totals' && !s0.oldTotals && s0.oldTotalsCls === 0
        && s0.totals === SAID('Quarter 2', 2, 5) && s0.stateWhole === s0.totals + s0.stateText,
      JSON.stringify({ inside: s0.totalsInside, cls: s0.totalsCls, totals: s0.totals, state: s0.stateText,
        oldId: s0.oldTotals, oldCls: s0.oldTotalsCls, term: s0.term }));
    /* The trap the work order names: the state line's writer repaints after every write, and a writer
       that set the line's textContent would take the totals span with it. So the totals are read
       after each of the writes above — the take, the un-take, the first tap, the mark — and must be
       there and right every time, while the day's words beside them change. */
    check('and they stay correct after every write — the take, the un-take, the first tap, the first mark — while the day\'s words beside them change',
      t0.totals === SAID('Quarter 2', 3, 6) && u0.totals === SAID('Quarter 2', 2, 5)
        && s1.totals === SAID('Quarter 2', 3, 6) && s2.totals === SAID('Quarter 2', 3, 6)
        && s3.totals === SAID('Quarter 2', 3, 6)
        && [t0, u0, s1, s2, s3].every((r) => r.totalsInside && r.stateWhole === r.totals + r.stateText)
        && s1.stateText !== s0.stateText && s2.stateText !== s1.stateText,
      [['take', t0], ['un-take', u0], ['first tap', s1], ['first mark', s2], ['all confirmed', s3]]
        .map(([n, r]) => n + ' ' + JSON.stringify(r.totals) + ' beside ' + JSON.stringify(r.stateText)).join(' | '));
    await clickSel('#termNav [data-term-select="' + Q1.id + '"]');
    const onQ1 = await read();
    await clickSel('#termNav [data-term-select="' + Q2.id + '"]');
    const onQ2 = await read();
    check('and after a term change: Quarter 1 counts its own three meetings beside the year\'s six, and back on Quarter 2 the figures are Quarter 2\'s again',
      onQ1.term === Q1.id && onQ1.totals === SAID('Quarter 1', 3, 6) && onQ1.totalsInside
        && onQ2.term === Q2.id && onQ2.totals === SAID('Quarter 2', 3, 6) && onQ2.totalsInside,
      'Quarter 1: ' + JSON.stringify(onQ1.totals) + ' (' + onQ1.term + ') · Quarter 2: '
        + JSON.stringify(onQ2.totals) + ' (' + onQ2.term + ')');

    /* ── line 2 at 820: two lines, Sort and the three doors together on the second ── */
    const toolbarAt820 = await read();
    const tb = toolbarAt820.tb;
    const toolsOk = (r) => JSON.stringify(r.toolKids) === JSON.stringify(
      ['attendanceSort', 'attendance-keys-btn', 'attendance-record-btn', 'attendance-passes-btn'])
      && r.toolTops.every((t) => t === r.toolTops[0]);
    const pillsOneRow = (r) => r.pillTops.length === 6 && r.pillTops.every((t) => t === r.pillTops[0]);
    check('at 820 under a coarse pointer the toolbar is two lines: the search box and the six pills on the first, and Sort and the three doors together on the second',
      !!tb.find && !!tb.pills && !!tb.tools && toolsOk(toolbarAt820) && pillsOneRow(toolbarAt820)
        && tb.pills[1] < tb.find[1] + tb.find[3]
        && tb.tools[1] >= tb.find[1] + tb.find[3] && tb.tools[1] >= tb.pills[1] + tb.pills[3] - 1,
      JSON.stringify({ find: tb.find, pills: tb.pills, tools: tb.tools, kids: toolbarAt820.toolKids,
        toolTops: toolbarAt820.toolTops, pillTops: toolbarAt820.pillTops }));

    /* ── line 6: the sort toggle, and the three doors as glyphs ── */
    const byLast = IDS.slice().reverse();
    const byFirst = IDS.slice();
    const sortStart = toolbarAt820;
    await clickSel('#attendanceSort');
    const sortedFirst = await read();
    await clickSel('#attendanceSort');
    const sortedBack = await read();
    check('the sort toggle flips the order and its own label: "Sort: Last" over the class by surname, one tap to "Sort: First" over the class by first name, one more and back',
      sortStart.sortLabel === 'Sort: Last' && sortStart.sortNext === 'first'
        && JSON.stringify(sortStart.rowsLast) === JSON.stringify(byLast)
        && sortedFirst.sortLabel === 'Sort: First' && sortedFirst.sortNext === 'last'
        && JSON.stringify(sortedFirst.rowsLast) === JSON.stringify(byFirst)
        && /first name/.test(sortedFirst.sortTitle)
        && sortedBack.sortLabel === 'Sort: Last' && JSON.stringify(sortedBack.rowsLast) === JSON.stringify(byLast),
      JSON.stringify({ start: [sortStart.sortLabel, sortStart.sortNext, sortStart.rowsLast.slice(0, 2)],
        tapped: [sortedFirst.sortLabel, sortedFirst.sortNext, sortedFirst.rowsLast.slice(0, 2)],
        back: [sortedBack.sortLabel, sortedBack.rowsLast.slice(0, 2)] }));
    const doors = await evalJs(`(function(){
      return [['[data-modal-open="attendanceKeysModal"]', 'Keys'], ['[data-attendance-record]', 'Record'],
              ['[data-pass-history]', 'Passes']].map(function(p){
        var b = document.querySelector('#classView .attendance-tools ' + p[0]);
        return b ? { word: p[1], text: (b.textContent || '').trim(), label: b.getAttribute('aria-label') || '',
                     title: b.title || '' } : { word: p[1], missing: true }; }); })()`);
    const NAMES = ['Keyboard shortcuts for marking attendance', 'Print or export this class’s attendance record',
      'Every hall pass recorded for this class'];
    check('the three doors are glyphs only, inside the toolbar\'s end group, and their accessible names are the ones they shipped with, word for word — each title leading with the word it lost',
      doors.length === 3 && doors.every((d, i) => !d.missing && !/[A-Za-z]/.test(d.text)
        && d.label === NAMES[i] && d.title.indexOf(d.word + ' — ') === 0),
      JSON.stringify(doors));

    /* ── line 2 at 1180: one line ── and line 1 there too, for the widest state */
    await size(1180, 820, true);
    await resetLedger();
    await enterClass();
    const l0 = await read();
    await clickSel(cell(IDS[0]));
    await clickSel(cell(IDS[0]));
    const l2 = await read();
    const ltb = l0.tb;
    check('at 1180 under a coarse pointer the toolbar is one line: the search box, the six pills and the end group side by side',
      l0.coarse === true && !!ltb.find && !!ltb.pills && !!ltb.tools && toolsOk(l0) && pillsOneRow(l0)
        && ltb.pills[1] < ltb.find[1] + ltb.find[3] && ltb.tools[1] < ltb.find[1] + ltb.find[3]
        && ltb.find[1] < ltb.tools[1] + ltb.tools[3],
      JSON.stringify({ find: ltb.find, pills: ltb.pills, tools: ltb.tools }));
    check('and lying down the strip is one line too, before and after the first mark, with the grid\'s first row where it was',
      oneLine(l0) && oneLine(l2) && l2.actions.indexOf('Un-confirm everyone') >= 0
        && JSON.stringify(l0.row) === JSON.stringify(l2.row),
      widths('1180 not taken', l0) + ' | ' + widths('1180 first mark', l2) + ' · row '
        + JSON.stringify(l0.row) + ' -> ' + JSON.stringify(l2.row));
  } finally {
    await size(1280, 900, false);
  }

  /* ── teardown ── */
  if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
  const cleaned = await evalJs(`(async function(){
    var s = window.planbook.store, ids = ${JSON.stringify(IDS)};
    s.update(function(d){
      d.classes = (d.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      d.students = (d.students || []).filter(function(p){ return ids.indexOf(p.id) < 0; });
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
    });
    await s.flush();
    delete window.__wo258;
    var d = s.getDoc();
    return (d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length
      + (d.students || []).filter(function(p){ return ids.indexOf(p.id) >= 0; }).length
      + (d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
  check('the WO-2.58 fixture came back off the document and the page was left on the class grid',
    cleaned === 0 && (await onView()) === 'homeView',
    cleaned + ' fixture record(s) left behind; left on #' + (await onView()));
}
}
