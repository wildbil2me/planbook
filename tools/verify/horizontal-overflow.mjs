/* horizontal-overflow.mjs — no horizontal overflow at any breakpoint
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 *
 * WO-3.59 ADDED THE ONE SCREEN THE LOOP BELOW NEVER OPENED — the assignment list, at 390×844 under a
 * coarse pointer, over a class of its own — at the foot of this file. The loop measures whatever
 * screen the run happens to be on, which is home; a page that scrolls sideways only once a class's
 * work is drawn was out of its sight, and WO-1.77 found the list doing it by 134px.
 */

import { nodeDaysFromToday } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

/* ───────────────── no horizontal overflow at any breakpoint ───────────────── */

console.log('\n--- horizontal overflow ---');
for (const [w, h, dsf] of [[1024, 768, 2], [768, 1024, 2], [390, 844, 3]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const o = await evalJs('({sw:document.documentElement.scrollWidth, iw:window.innerWidth})');
  check('no horizontal overflow at ' + w + 'x' + h, o.sw <= o.iw, JSON.stringify(o));

  /*
    The page not overflowing is not the same as the header being readable, which is what the first
    device sitting found: the two strips scrolled correctly and the buttons inside them were
    compressed to narrower than their own labels, so the names were laid out across the rounded
    background and over its edge. `flex-shrink: 0` in shell.css is the fix and this is the
    measurement — a button whose label does not fit inside it, at the width where it was seen.

    A button sitting at its `max-width` cap is exempt: that one is ellipsised on purpose, and an
    ellipsis is the label not fitting by design rather than by accident.
  */
  const spill = await evalJs(`(function(){
    var els = document.querySelectorAll('#classTabBar .cls-tab, #termNav .q-btn');
    var out = [];
    for (var i = 0; i < els.length; i++) {
      var e = els[i], cs = getComputedStyle(e);
      var cap = parseFloat(cs.maxWidth);
      var capped = !isNaN(cap) && e.getBoundingClientRect().width >= cap - 1;
      if (!capped && e.scrollWidth > e.clientWidth + 1) {
        out.push({ text: e.textContent, scrollW: e.scrollWidth, clientW: e.clientWidth });
      }
      if (cs.flexShrink !== '0' || cs.whiteSpace !== 'nowrap') {
        out.push({ text: e.textContent, flexShrink: cs.flexShrink, whiteSpace: cs.whiteSpace });
      }
    }
    return { measured: els.length, bad: out }; })()`);
  check('no class tab or term button is squeezed narrower than its own label at ' + w + 'x' + h,
    spill.measured > 0 && spill.bad.length === 0,
    'measured ' + spill.measured + '; bad = ' + JSON.stringify(spill.bad));

  /*
    The other half of that fix, and a defect it introduced. Once the tabs stopped squeezing they
    started scrolling, and refreshClassBar() rebuilds the strip's children on every call — which
    resets `scrollLeft` to 0. So the teacher whose open class is the last of six got a header
    scrolled to the left with no tab on it looking selected, which reads as the app having forgotten
    which class she was in.

    Measured on the LAST class, because the first one is visible whether or not anything works.
  */
  /* Read off the DOM rather than through `window.__cls`: that reader is re-installed after each
     reload for the sections that use it, and this one runs past the last of them. */
  const tabScroll = await evalJs(`(function(){
    var strip = document.getElementById('classTabBar');
    var tabs = strip.querySelectorAll('[data-class-tab]');
    if (!tabs.length) return { noTabs: true };
    window.planbook.classes.selectClass(tabs[tabs.length - 1].getAttribute('data-class-tab'));
    var el = strip.querySelector('.cls-tab.active');
    if (!el) return { noActive: true };
    var s = strip.getBoundingClientRect(), e = el.getBoundingClientRect();
    return { overflows: strip.scrollWidth > strip.clientWidth + 1,
             inView: e.left >= s.left - 1 && e.right <= s.right + 1,
             scrollLeft: strip.scrollLeft, text: el.textContent,
             strip: { left: Math.round(s.left), right: Math.round(s.right),
                      scrollW: strip.scrollWidth, clientW: strip.clientWidth },
             tab: { left: Math.round(e.left), right: Math.round(e.right) } }; })()`);
  if (tabScroll.noTabs) {
    skip('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
      'no classes on the bar at this point in the run');
  } else {
    /* Asserted before the scroll question, because a strip of zero width answers that question
       "no" for a reason that has nothing to do with scrolling — and it is a whole class bar the
       teacher cannot see. This is how the 390px flex-basis defect was found. */
    check('the class tab strip has real width to scroll at ' + w + 'x' + h,
      tabScroll.strip.clientW >= 96, JSON.stringify(tabScroll.strip));
    if (tabScroll.overflows === false) {
      skip('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
        'the strip fits every tab at this width, so there is nothing to scroll');
    } else {
      check('the open class is scrolled into view on the tab strip at ' + w + 'x' + h,
        tabScroll.inView === true, JSON.stringify(tabScroll));
    }
  }
}

/* ───────────────── the assignment list at phone width (WO-3.59) ─────────────────

   WHAT OVERFLOWED, AND WHY IT WAS NOT THE TABLE. The list's table is wider than a phone, and that is
   allowed: `.assign-table-wrap` scrolls it inside its own box. What carried the PAGE sideways was the
   Actions column head's `<span class="sr-only">Actions</span>`. `.sr-only` is `position: absolute`,
   and an absolutely positioned box is clipped by an `overflow` ancestor only if that ancestor is, or
   contains, its containing block. Nothing between the span and <html> was positioned, so its
   containing block was the page itself: the wrap's `overflow-x: auto` scrolled the table out of the
   way and left the span standing where the table's last column would have been — off the right edge
   of the screen, where the document's `scrollWidth` followed it.

   THE FIX IS ON THE WRAP, NOT THE SPAN (src/assignments.css). `position: relative` makes the wrap the
   containing block of everything absolutely positioned inside the table, so its own scroll clips it.
   That holds for a heading cell carrying a button as well as a bare span — the shape WO-3.55 builds
   into this `<th>` — and the second check below plants exactly that shape to say so.

   THE FIXTURE IS REAL-SHAPED ON PURPOSE. WO-1.77's 134px was found over a term with blank dates and a
   single category, and that blank-dated term was the other candidate cause. This class has a dated
   term around today, a weighted set of categories, and work in two of them with real assigned and due
   dates, so a green here is not the fixture's doing. It is planted at the head and taken back out —
   with the open-class preference — at the foot, and the viewport and touch are handed on as the loop
   above left them: 390×844, coarse.

   IT PRINTS, AND DOES NOT ASSERT, the same reading on the Attendance and Scores screens: WO-3.59's
   Out of scope line is other screens at phone width unless the same element causes theirs. */
console.log('\n--- the assignment list at phone width (WO-3.59) ---');
if (!seam) {
  skip('the assignment list does not scroll the page sideways at 390x844 under a coarse pointer (WO-3.59)',
    'window.planbook is not on the page, so nothing here can seed a class or open the list');
} else {
  const j = (x) => JSON.stringify(x);
  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  const S = [{ id: 'wo359-s1', first: 'Ines', last: 'Okonkwo-Marsh' },
    { id: 'wo359-s2', first: 'Tobiah', last: 'Lindqvist' }];
  const C = { id: 'c_wo359', name: 'WO-3.59 English I', term: 'tm_wo359' };
  const CATS = [{ id: 'k359_e', name: 'Essays', weight: 40 }, { id: 'k359_q', name: 'Reading quizzes', weight: 35 },
    { id: 'k359_h', name: 'Homework', weight: 25 }];
  const D = nodeDaysFromToday;
  const A = (id, categoryId, name, points, assigned, due) =>
    ({ id, classId: C.id, termId: C.term, categoryId, name, points, assigned, due });
  const ASSIGNMENTS = [
    A('a359_1', 'k359_e', 'Personal Narrative — final draft', 100, D(-12), D(-2)),
    A('a359_2', 'k359_e', 'Of Mice and Men Ch 1–3 Response', 50, D(-5), D(3)),
    A('a359_3', 'k359_q', 'Reading Quiz: Chapters 1–2', 20, D(-3), D(-3)),
    A('a359_4', 'k359_q', 'Reading Quiz: Chapters 3–4', 20, D(1), D(1)),
  ];
  const MINE = ASSIGNMENTS.map((a) => a.id);
  const size = async (width, height, dsf) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dsf, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await evalJs('window.dispatchEvent(new Event("resize")); 1');
    await pause(300);
  };
  const reload = async () => {
    await send('Page.reload');
    await pause(600);
    await waitForBoot();
    await evalJs(KILL_ANIM);
  };
  const shut = () => evalJs(`(function(){
    var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
    Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
    return open.length; })()`);
  const onView = () => evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
  /* The page's sideways scroll, and — so a red line names its cause rather than only its size — every
     out-of-flow element whose removal shrinks it. Found by taking each `absolute`/`fixed` box out of
     the page in turn and reading `scrollWidth` again, not by comparing right edges: an edge test
     also finds every cell of a table that is wider than the page but scrolled inside its own box,
     and on a mobile viewport the zoom-out a too-wide page earns moves the numbers it compares. */
  const PAGE = `(function(){
    var d = document.documentElement, sw = d.scrollWidth, cw = d.clientWidth, reach = [];
    if (sw > cw + 1) {
      var all = document.body.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var e = all[i], cs = getComputedStyle(e);
        if (cs.display === 'none' || (cs.position !== 'absolute' && cs.position !== 'fixed')) continue;
        var was = e.style.display;
        e.style.display = 'none';
        var without = d.scrollWidth;
        e.style.display = was;
        if (without < sw) {
          var cb = e.offsetParent;
          reach.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '')
            + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).join('.') : '')
            + ' ' + JSON.stringify((e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 24))
            + ' in <' + (e.parentElement ? e.parentElement.tagName.toLowerCase() : '?') + '>'
            + ' · position ' + cs.position + ' · offsetParent '
            + (cb ? cb.tagName.toLowerCase() + (cb.className && typeof cb.className === 'string'
              ? '.' + cb.className.trim().split(/\\s+/).join('.') : '') : 'none')
            + ' · page scrolls ' + (without - cw) + 'px without it');
        }
      }
    }
    return { view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
      coarse: matchMedia('(pointer: coarse)').matches, vw: cw, page: sw - cw, reach: reach }; })()`;
  /* A screen change for the report-only reading, pressed with the element's own click(): on a page
     that already scrolls sideways a mobile viewport zooms out to fit it, and a press at layout
     coordinates then lands somewhere else — which is how the first red run of this block measured
     the assignment list twice where it meant Attendance and Scores. */
  const toScreen = (screen) => evalJs(`(function(){
    var all = document.querySelectorAll('[data-class-screen="${screen}"]');
    for (var i = 0; i < all.length; i++) {
      var r = all[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { all[i].click(); return true; }
    }
    return false; })()`);
  const before = await evalJs("({ open: localStorage.getItem('planbook_openClassId') })");

  try {
    const plant = await evalJs(`(async function(){
      var p = window.planbook, s = p.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      var kids = ${j(S)}.map(function(x){ var st = p.roster.newStudent(x.first, x.last); st.id = x.id; return st; });
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        if (!Array.isArray(doc.students)) doc.students = [];
        if (!Array.isArray(doc.assignments)) doc.assignments = [];
        kids.forEach(function(st){ doc.students.push(st); });
        doc.classes.push({ id:${j(C.id)}, name:${j(C.name)}, archived:false,
          roster:${j(S.map((x) => x.id))}, letterScale:null,
          terms:[{ id:${j(C.term)}, label:'Quarter 1', start:${j(D(-30))}, end:${j(D(30))} }],
          categories:${j(CATS)} });
        ${j(ASSIGNMENTS)}.forEach(function(a){ doc.assignments.push(a); });
      });
      await s.flush();
      return { ok:true }; })()`);
    if (!plant.ok) throw new Error('could not plant the fixture: ' + plant.why);
    await reload();
    await size(390, 844, 3);

    /* The way a teacher gets there: home, the class's card, the switcher's Assignments. */
    await shut();
    if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
    await pause(150);
    await clickSel('#homeGrid [data-class-tab="' + C.id + '"]');
    await pause(250);
    if ((await onView()) !== 'assignmentsView') {
      await clickVisible('[data-class-screen="assignments"]');
      await pause(300);
    }
    await evalJs('window.scrollTo(0, 0); 1');
    const list = await evalJs(`(function(){
      var t = document.querySelector('#assignmentsView .assign-table-wrap');
      var rows = document.querySelectorAll('#assignmentsBody .assign-name-btn');
      var cats = {};
      Array.prototype.forEach.call(rows, function(b){ cats[b.getAttribute('data-assignment-edit')] = 1; });
      return { rows: rows.length, ids: Object.keys(cats),
        wrap: t ? t.scrollWidth - t.clientWidth : null }; })()`);
    const page = await evalJs(PAGE);
    /* Two categories is the Acceptance line's own floor, read off the rows drawn rather than assumed
       from the fixture; and the table really has to be wider than its box, or "the page does not
       scroll" would be true of a list too narrow to have tested anything. */
    const shown = ASSIGNMENTS.filter((a) => list.ids.indexOf(a.id) >= 0);
    const shownCats = shown.map((a) => a.categoryId).filter((x, i, a) => a.indexOf(x) === i);
    check('WO-3.59: at 390x844 under a coarse pointer the assignment list — work in two categories, a dated term — '
      + 'scrolls its table inside its own box and does not scroll the page sideways',
      page.view === 'assignmentsView' && page.coarse === true && page.vw === 390
        && shown.length === ASSIGNMENTS.length && shownCats.length >= 2
        && list.wrap !== null && list.wrap > 0 && page.page <= 0,
      'view ' + page.view + ' · coarse ' + page.coarse + ' · vw ' + page.vw + ' · rows ' + list.rows
        + ' in ' + shownCats.length + ' categories · table box scrolls ' + list.wrap + 'px · page scrolls '
        + page.page + 'px' + (page.reach.length ? ' · reaching the page edge: ' + j(page.reach) : ''));

    /* WO-3.55 rebuilds the Actions heading around a button. Plant that shape — a real button in the
       last <th>, its name in an `.sr-only` span — and read the page again, then take it back out. */
    const planted = await evalJs(`(function(){
      var th = document.querySelector('#assignmentsView .assign-table thead th:last-child');
      if (!th) return { ok:false };
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-wo359-probe', '');
      b.textContent = '↺'; var s = document.createElement('span'); s.className = 'sr-only';
      s.textContent = 'Your order'; b.appendChild(s); th.appendChild(b);
      return { ok:true }; })()`);
    const withButton = await evalJs(PAGE);
    await evalJs("(function(){ var b = document.querySelector('[data-wo359-probe]'); if (b) b.remove(); return 1; })()");
    check('WO-3.59: and with a button carrying an `.sr-only` name planted in the Actions heading — the shape '
      + 'WO-3.55 builds there — the page still does not scroll sideways',
      planted.ok && withButton.page <= 0,
      'planted ' + planted.ok + ' · page scrolls ' + withButton.page + 'px'
        + (withButton.reach.length ? ' · reaching the page edge: ' + j(withButton.reach) : ''));

    /* The cause, read on every run rather than only on a red one: the wrap's `position` put back to
       `static` in the page for one reading — the fix taken off without touching the file — and every
       out-of-flow box that then carries the page sideways, named. Printed, not asserted: what sits in
       the Actions heading is WO-3.55's to change, and the assertion above is the fence. */
    await evalJs(`(function(){ var st = document.createElement('style'); st.id = 'wo359-off';
      st.textContent = '#assignmentsView .assign-table-wrap { position: static !important; }';
      document.head.appendChild(st); return 1; })()`);
    const unfixed = await evalJs(PAGE);
    await evalJs("(function(){ var st = document.getElementById('wo359-off'); if (st) st.remove(); "
      + "window.scrollTo(0, 0); return 1; })()");
    console.log('  MEASURE | WO-3.59 with the wrap’s `position: relative` taken off in the page, the '
      + 'list scrolls the page sideways by ' + unfixed.page + 'px, carried by ' + j(unfixed.reach));

    /* Report only — see the head of this block. */
    const others = [];
    for (const screen of ['class', 'scores']) {
      await toScreen(screen);
      await pause(300);
      await evalJs('window.scrollTo(0, 0); 1');
      const o = await evalJs(PAGE);
      others.push(o.view + ' ' + o.page + 'px' + (o.reach.length ? ' (' + o.reach.join('; ') + ')' : ''));
    }
    console.log('  MEASURE | WO-3.59 at 390×844, coarse, the same class: the page scrolls sideways on '
      + others.join(' · ') + ' — reported, not ruled on');
  } finally {
    await shut();
    await evalJs(`(async function(){
      var s = window.planbook.store;
      if (s.getDoc()) {
        var mine = ${j(MINE)}, kids = ${j(S.map((x) => x.id))};
        s.update(function(doc){
          doc.classes = (doc.classes || []).filter(function(c){ return c.id !== ${j(C.id)}; });
          doc.students = (doc.students || []).filter(function(x){ return kids.indexOf(x.id) < 0; });
          doc.assignments = (doc.assignments || []).filter(function(a){ return mine.indexOf(a.id) < 0; });
        });
        await s.flush();
      }
      var b = ${j(before)};
      if (b.open === null) { try { localStorage.removeItem('planbook_openClassId'); } catch (e) {} }
      else localStorage.setItem('planbook_openClassId', b.open);
      return 1; })()`);
    await reload();
    await size(390, 844, 3);
  }
}
}
