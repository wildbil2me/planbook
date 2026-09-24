/* calendar-opens-on-day.mjs — a tapped day opens on that day (WO-6.5)
 *
 * WO-6.3's tap-through check (calendar-drawn.mjs, "the two whose source is a screen navigate to
 * it") proves a class's recorded day lands on that class's REGISTRY. It could not prove the day,
 * because the register had no way to be opened on one — and that is why its line passed on the
 * source while the owner read the device and found the right screen on the wrong day. This section
 * asserts the day: the column the strip is built from, the marks in it, the term tab over it, and
 * that nothing on the way painted today first.
 *
 * EVERY TAP HERE IS A REAL CLICK ON A REAL CHIP. The register's entry point takes a date argument
 * (src/attendance.js's resetRegistry()), and calling it from here would prove the argument works
 * where the click proves it is WIRED — the WO-2.54 section's rule about the class tab, one screen
 * over. The chip is reached the way a teacher reaches it: the class's own Calendar pill, which
 * filters the month to that class (a month showing every class draws no meeting state at all), and
 * the month pager.
 *
 * EVERY DATE IS DERIVED FROM TODAY, through lib-dates.mjs, so `--today` moves the whole fixture
 * with it. Two terms either side of a gap: one that ENDED, and one that holds today. Three recorded
 * days, one in each of the three places a recorded day can be — inside the term that holds today,
 * inside the term that ended, and in the gap between them, which is WO-2.50's decision 2 (a record
 * the term dates were typed around, which stays openable). Only this block's own class carries
 * them, so no other section's ledger can move an answer here.
 */

import { nodeColumns, nodeWeekdayAhead } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- a tapped day opens on that day (WO-6.5) ---');

if (!seam) {
  skip('a recorded day tapped on the calendar opens the register on that day',
    'window.planbook is not on the page, so nothing here can seed a ledger or read the register');
} else {
  const CLS = 'c_wo65';
  const S1 = 's_wo65a', S2 = 's_wo65b';
  const PREV_ID = 'tm_wo65prev', NOW_ID = 'tm_wo65now';
  /* The n-th weekday back from today, today being index 0 whatever day it is — nodeColumns()'s own
     rule, read at one index rather than copied. */
  const back = (n) => nodeColumns(n + 1, 0)[n];
  const TODAY = back(0);
  const PREV = { id: PREV_ID, label: 'WO-6.5 ended', start: back(60), end: back(30) };
  const NOW = { id: NOW_ID, label: 'WO-6.5 running', start: back(20), end: nodeWeekdayAhead(40) };
  /* Three weekdays back: inside the running term, and far enough back that the six-column window
     ENDING on it (back 3 to back 8) cannot contain today — so today appearing anywhere in the head
     during the tap is a paint through today, and nothing else. */
  const IN_NOW = back(3);
  const IN_PREV = back(40);
  const OFF = back(25);

  const onView = async () => await evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
  const model = async () => await evalJs('window.planbook.calendarView.calendarModel()');
  const monthIndex = (iso) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7));
  /* Through the real pager, capped — calendar-drawn.mjs's pageToMonth(), for the reason it gives. */
  async function pageToMonth(iso) {
    for (let i = 0; i < 30; i++) {
      const from = (await model()).from;
      const delta = monthIndex(iso) - monthIndex(from);
      if (delta === 0) return true;
      await clickSel('#calendarView [data-calendar-page="' + (delta < 0 ? 'earlier' : 'later') + '"]');
    }
    return false;
  }
  const landscape = async () => {
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 300));
  };
  const portrait = async () => {
    await send('Emulation.setDeviceMetricsOverride',
      { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 300));
  };

  /* ── the fixture, then a reload so every screen is drawn from it ── */
  await landscape();
  const plant = await evalJs(`(async function(){
    var s = window.planbook.store;
    if (!s.getDoc()) return { ok:false, why:'no year document is open' };
    var wasClass = window.planbook.classes.getSelectedClassId();
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      doc.students.push({ id:'${S1}', first:'Wo65Ada', last:'Wo65First' });
      doc.students.push({ id:'${S2}', first:'Wo65Ben', last:'Wo65Second' });
      doc.classes.push({ id:'${CLS}', name:'WO-6.5 Register', archived:false,
        roster:['${S1}', '${S2}'], letterScale:null,
        terms:${JSON.stringify([PREV, NOW])}, categories:[] });
      doc.attendance.push({ classId:'${CLS}', date:'${IN_NOW}', marks:{ '${S1}':{ code:'A' } } });
      doc.attendance.push({ classId:'${CLS}', date:'${IN_PREV}',
        marks:{ '${S1}':{ code:'T' }, '${S2}':{ code:'E' } } });
      doc.attendance.push({ classId:'${CLS}', date:'${OFF}', marks:{ '${S2}':{ code:'A' } } });
    });
    await s.flush();
    return { ok:true, wasClass:wasClass }; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* What the register shows, in one round trip. `seen` is every date a day-column head was ADDED
     for since the observer went on — the no-flash evidence: renderAttendance() rebuilds the head
     wholesale, so a paint through today on the way to the tapped day leaves today in this list. */
  await evalJs(`(function(){
    window.__wo65 = function(){
      var heads = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead th[data-attendance-col]'));
      var cell = function(sid, date){
        var n = document.querySelector('#attendanceBody [data-attendance-row="' + sid + '"] '
          + 'td[data-attendance-col="' + date + '"] .attendance-cell');
        return n ? { glyph: n.textContent, tag: n.tagName } : null; };
      var dates = heads.map(function(th){ return th.getAttribute('data-attendance-col'); });
      var tabs = Array.prototype.slice.call(document.querySelectorAll('#termNav [data-term-select]'));
      var band = document.getElementById('attendanceBanner');
      var todayBtn = document.querySelector('#attendancePager [data-attendance-page="today"]');
      var newest = dates[0] || '';
      return {
        view: (function(){ var e=document.querySelector('main > :not(.hidden)');
          return e ? e.id : ''; })(),
        open: window.planbook.classes.getSelectedClassId(),
        term: window.planbook.classes.getSelectedTermId(),
        activeTab: tabs.filter(function(b){ return b.classList.contains('active'); })
          .map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
        dates: dates,
        s1: cell('${S1}', newest), s2: cell('${S2}', newest),
        pencil: !!document.querySelector('#attendanceHead th[data-attendance-col="' + newest
          + '"] [data-attendance-edit]'),
        band: band && !band.classList.contains('hidden') ? band.textContent : '',
        todayOff: todayBtn ? !!todayBtn.disabled : null,
        seen: (window.__wo65seen || []).slice() };
    };
    window.__wo65watch = function(){
      window.__wo65seen = [];
      if (window.__wo65obs) window.__wo65obs.disconnect();
      var head = document.getElementById('attendanceHead');
      window.__wo65obs = new MutationObserver(function(list){
        list.forEach(function(m){ Array.prototype.forEach.call(m.addedNodes, function(n){
          if (!n.querySelectorAll) return;
          var ths = n.matches && n.matches('th[data-attendance-col]') ? [n]
            : Array.prototype.slice.call(n.querySelectorAll('th[data-attendance-col]'));
          ths.forEach(function(th){ window.__wo65seen.push(th.getAttribute('data-attendance-col')); });
        }); });
      });
      if (head) window.__wo65obs.observe(head, { childList:true, subtree:true });
      return !!head;
    };
    return 1; })()`);
  const read = async () => {
    await new Promise(r => setTimeout(r, 250));
    return evalJs('(async function(){ await window.planbook.store.flush(); return window.__wo65(); })()');
  };
  /* THE ORDINARY WAY IN, which is also how every tap below starts: the class card on the home grid,
     then the class's own Calendar pill. */
  const enterClass = async () => {
    if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 200));
  };
  const tapDay = async (date) => {
    await enterClass();
    await clickSel('#classView [data-class-screen="calendar"]');
    await new Promise(r => setTimeout(r, 200));
    const reached = await pageToMonth(date);
    await evalJs('window.__wo65watch()');
    await clickSel('#calendarGrid .calendar-day .calendar-chip[data-calendar-kind="meeting-state"]'
      + '[data-calendar-class="' + CLS + '"][data-calendar-date="' + date + '"]');
    const r = await read();
    r.reached = reached;
    return r;
  };
  const say = (r) => '#' + r.view + ' in ' + r.open + ', term ' + r.term + ' (tab ' + r.activeTab
    + '), columns ' + JSON.stringify(r.dates) + ', S1 ' + JSON.stringify(r.s1) + ' S2 '
    + JSON.stringify(r.s2) + ', ✏ ' + r.pencil + ', band ' + JSON.stringify(r.band)
    + ', heads painted during the tap ' + JSON.stringify(r.seen);

  check('WO-6.5 fixture: one class, two students, a term that ended and a term that holds today, '
    + 'and three recorded days — one in each term and one in the gap between them',
    !!plant && plant.ok === true && (await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      return (d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length; })()`)) === 3,
    JSON.stringify({ plant, TODAY, IN_NOW, IN_PREV, OFF, PREV, NOW }));

  /* ── 1. landscape, a day in the running term ── */
  /* The observer's own two globals exist before the window is snapshotted, so the snapshot below
     can only see what the TAP added. */
  await evalJs('window.__wo65watch()');
  const docBefore = await evalJs('JSON.stringify(window.planbook.store.getDoc())');
  const winBefore = await evalJs('Object.keys(window).join("|")');
  const a = await tapDay(IN_NOW);
  check('LANDSCAPE: tapping a recorded day on the calendar opens that class’s register ON THE TAPPED '
    + 'DAY — the newest column is that day, not today and not the term’s first day — with that '
    + 'day’s marks in it (Ada absent, Ben present) under the running term’s tab',
    a.reached === true && a.view === 'classView' && a.open === CLS
      && a.dates[0] === IN_NOW && a.dates.length === 6 && a.dates.indexOf(TODAY) === -1
      && !!a.s1 && a.s1.glyph === 'A' && !!a.s2 && a.s2.glyph === 'P'
      && a.term === NOW_ID && a.activeTab === NOW_ID,
    say(a));
  check('and it OPENED on that day rather than passing through today: no day-column head for today '
    + 'was painted at any point during the tap (WO-2.17’s Traps line)',
    a.seen.length > 0 && a.seen.indexOf(TODAY) === -1 && a.seen.indexOf(IN_NOW) !== -1,
    'heads added during the tap: ' + JSON.stringify(a.seen) + '; today is ' + TODAY);
  check('a past day opened from the calendar is READ-ONLY until its ✏ is pressed — a calendar tap '
    + 'is a reading gesture, so the marks are drawn as locked cells and the ✏ is on the column — and '
    + 'the band says the day on screen is not today and offers the way back',
    !!a.s1 && a.s1.tag === 'SPAN' && !!a.s2 && a.s2.tag === 'SPAN' && a.pencil === true
      && a.band.indexOf('Today is not on screen') !== -1 && a.band.indexOf('Back to today') !== -1
      && a.todayOff === false,
    say(a));
  const docAfter = await evalJs('JSON.stringify(window.planbook.store.getDoc())');
  const store = await evalJs(`(function(){
    var out = {}; for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i); out[k] = localStorage.getItem(k); }
    return JSON.stringify(out); })()`);
  const winAfter = await evalJs('Object.keys(window).join("|")');
  const newKeys = winAfter.split('|').filter((k) => winBefore.split('|').indexOf(k) === -1);
  check('NO NEW STATE: the tap left the year document byte-identical, put the tapped date nowhere '
    + 'in localStorage, and added nothing to window — the day arrived as an argument and is the '
    + 'register’s own business',
    docAfter === docBefore && store.indexOf(IN_NOW) === -1 && newKeys.length === 0,
    'document identical: ' + (docAfter === docBefore) + '; localStorage holds ' + IN_NOW + ': '
      + (store.indexOf(IN_NOW) !== -1) + '; new window keys: ' + JSON.stringify(newKeys));

  /* ── 2. the term nav spends it ── */
  await clickSel('#termNav [data-term-select="' + PREV_ID + '"]');
  const toPrev = await read();
  await clickSel('#termNav [data-term-select="' + NOW_ID + '"]');
  const toNow = await read();
  check('a term tapped on the term nav moves the strip the way it always has — the ended term’s '
    + 'last day, then today on the running term — rather than staying pinned on the day the '
    + 'register was opened on',
    toPrev.dates[0] === PREV.end && toPrev.activeTab === PREV_ID
      && toNow.dates[0] === TODAY && toNow.activeTab === NOW_ID,
    'after the ended term’s tab: ' + say(toPrev) + ' || after the running term’s tab: ' + say(toNow));

  /* ── 3. the ordinary way in still lands on today, AFTER a tapped day ── */
  const b = await tapDay(IN_NOW);
  await enterClass();
  const ordinary = await read();
  check('opening the register the ordinary way AFTER a tapped day — back to the class grid, then the '
    + 'class card, with no date — lands on TODAY, unpaged, with no band: the day it was opened on '
    + 'last time is not remembered',
    b.dates[0] === IN_NOW && ordinary.view === 'classView' && ordinary.dates[0] === TODAY
      && ordinary.band === '' && ordinary.todayOff === true,
    'tapped: ' + say(b) + ' || then the card: ' + say(ordinary));

  /* And the band's own way back, from a tapped day in the SAME term as today — the case where
     `Today` moves no term, so nothing but the press itself can let the day go. */
  const e = await tapDay(IN_NOW);
  await clickSel('#attendanceBanner [data-attendance-page="today"]');
  const bandBack = await read();
  check('the band’s *Back to today* lets a tapped day go even when no term has to move: the strip '
    + 'is back on the week ending today, with no band and `Today` greyed',
    e.dates[0] === IN_NOW && bandBack.dates[0] === TODAY && bandBack.term === NOW_ID
      && bandBack.band === '' && bandBack.todayOff === true,
    'tapped: ' + say(e) + ' || then the band’s button: ' + say(bandBack));

  /* ── 4. portrait, a day in the term that ended ── */
  await portrait();
  const c = await tapDay(IN_PREV);
  check('PORTRAIT, a day in a term that is NOT the one holding today: the one column portrait draws '
    + 'is the tapped day, with its marks (Ada tardy, Ben excused), and the term tab over it is that '
    + 'day’s own term — the column and the tab agree',
    c.reached === true && c.view === 'classView' && c.dates.length === 1 && c.dates[0] === IN_PREV
      && !!c.s1 && c.s1.glyph === 'T' && !!c.s2 && c.s2.glyph === 'E'
      && c.term === PREV_ID && c.activeTab === PREV_ID && c.seen.indexOf(TODAY) === -1,
    say(c));
  await clickSel('#attendancePager [data-attendance-page="today"]');
  const escaped = await read();
  check('and `Today` escapes it, in portrait where nothing pages: one column, today, on the running '
    + 'term, with `Today` greyed because there is nowhere left for it to go',
    escaped.dates.length === 1 && escaped.dates[0] === TODAY && escaped.term === NOW_ID
      && escaped.activeTab === NOW_ID && escaped.todayOff === true && escaped.band === '',
    say(escaped));
  /* And the header's class tab, the other ordinary door, from a tapped day. */
  const c2 = await tapDay(IN_PREV);
  await clickSel('#classTabBar [data-class-tab="' + CLS + '"]');
  const viaTab = await read();
  check('and the header’s class tab — the other ordinary door — from a tapped day lands on today on '
    + 'the running term too',
    c2.dates[0] === IN_PREV && viaTab.dates.length === 1 && viaTab.dates[0] === TODAY
      && viaTab.term === NOW_ID,
    'tapped: ' + say(c2) + ' || then the class tab: ' + say(viaTab));

  /* ── 5. a recorded day in no term ── */
  await landscape();
  const d = await tapDay(OFF);
  check('a recorded day in NO term opens on that day rather than somewhere else: the newest column '
    + 'is the tapped day with its mark (Ben absent), and the band names where it is in the column '
    + 'head’s own words',
    d.reached === true && d.view === 'classView' && d.dates[0] === OFF
      && !!d.s2 && d.s2.glyph === 'A' && d.band.indexOf('outside every term') !== -1
      && d.band.indexOf('between ' + PREV.label + ' and ' + NOW.label) !== -1,
    say(d));

  /* ── teardown ── */
  await enterClass();
  const cleaned = await evalJs(`(async function(){
    var s = window.planbook.store;
    s.update(function(d){
      d.classes = (d.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      d.students = (d.students || []).filter(function(p){
        return p.id !== '${S1}' && p.id !== '${S2}'; });
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
    });
    await s.flush();
    if (window.__wo65obs) window.__wo65obs.disconnect();
    var d = s.getDoc();
    return (d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length
      + (d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
  check('the WO-6.5 fixture came back off the document and the page was left on the class grid',
    cleaned === 0 && (await onView()) === 'homeView',
    cleaned + ' fixture record(s) left behind; left on #' + (await onView()));
}
}
