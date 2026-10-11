/* roster-width.mjs — the roster dialog is wide enough for its rows (WO-1.76)
 *
 * WHAT THIS SECTION OWNS. The width of #rosterModal's panel since `.roster-panel` gave it one of its
 * own: 640px in a 1280px window under a fine pointer and on an iPad upright and lying down under a
 * coarse one; no wider than 95vw at 390×844, with nothing in the dialog or the page scrolling
 * sideways; that at 640 a row for a student with a long name, an "also in" note and a plan on file is
 * one line tall with ✎ · Edit · Remove on it; that under presentation mode the same row is built
 * without its dot.
 *
 * ITS ACCEPTANCE 3 WENT FALSE ON PURPOSE AT WO-1.77, AND MOVED RATHER THAN WENT. It asserted that
 * every dialog but the roster measured the stock 480 — through five real doors and across every
 * `.modal-panel` in the document — and that stopped being true the day 480 became the confirm's width
 * rather than every dialog's. Both measurements are in tools/verify/dialog-kinds.mjs now, held against
 * the kind the owner ruled for each dialog instead of against 480. The roster's own 640 is still
 * asserted here, and since WO-1.77 it is `.modal-form`'s 640 rather than `.roster-panel`'s.
 *
 * WHAT IT MEASURES AND DOES NOT RULE ON. Where the support dot lands at 640 is printed on a
 * `MEASURE |` line — how far it sits from the end of the name and of the note, and how far from the
 * actions — and asserted only as WO-1.74 left it (after the name column, before the actions). Whether
 * it should sit beside the name is the owner's ruling (the work order's third question), and a check
 * here that held either answer would be making it.
 *
 * WHAT IT LEAVES TO SECTIONS THAT ALREADY OWN IT. The row at the stock 480 is roster-who.mjs's, which
 * since WO-1.76 pins the panel at 480 for its read so that this width cannot make that measurement
 * pass for the wrong reason; the row's 44px buttons are touch-targets.mjs's; "‹ Settings" in this
 * dialog's header is settings-back.mjs's.
 *
 * THE FIXTURE IS TWO CLASSES AND TWO STUDENTS OF ITS OWN, and the open-class and presentation
 * preferences — all put back at the foot, with the viewport and touch, whatever happens above.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam, openSettingsDoor } = h;

console.log('\n--- the roster dialog\'s width (WO-1.76) ---');

if (!seam) {
  skip('the roster dialog is wide enough for its rows',
    'window.planbook is not on the page, so nothing here can seed a class or read the roster');
} else {
  /* English classes, per the owner. The long name is invented, hyphenated and nicknamed, because the
     row's name is `Last, First “Nick”` and that is the longest shape it draws. */
  const A = { id: 'c_wo176a', name: 'WO-1.76 English III' };
  const B = { id: 'c_wo176b', name: 'AP Literature' };
  const S = {
    long:  { id: 'wo176-long',  first: 'Anastasia', last: 'Castellanos-Whitfield', nickname: 'Ana' }, // A, B, a plan
    plain: { id: 'wo176-plain', first: 'Pim', last: 'Odell', nickname: '' },                          // A only
  };
  const WANT = 640;

  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  const size = async (width, height, coarse) => {
    await send('Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: coarse ? 2 : 1, mobile: !!coarse });
    await send('Emulation.setTouchEmulationEnabled', coarse
      ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await evalJs('window.dispatchEvent(new Event("resize")); 1');
    await pause(300);
  };
  const shut = () => evalJs(`(function(){
    var open = document.querySelectorAll('.modal-overlay:not(.hidden)');
    Array.prototype.forEach.call(open, function(o){ window.planbook.closeModal(o); });
    return open.length; })()`);
  const onView = () => evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
  const enter = async () => {
    await shut();
    if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
    await pause(150);
    await clickSel('#homeGrid [data-class-tab="' + A.id + '"]');
    await pause(250);
  };
  const reload = async () => {
    await send('Page.reload');
    await pause(600);
    await waitForBoot();
    await evalJs(KILL_ANIM);
  };
  const j = (x) => JSON.stringify(x);

  /* The panel, the page's and the dialog's sideways scroll, and the long row taken apart: every
     child's box, the name's and the note's TEXT ends (a Range, because the spans stretch across the
     column and their own boxes say nothing about where the words stop), and how many lines the name's
     text occupies. One round trip. */
  const READ = `(function(){
    function box(el){ if (!el) return null; var r = el.getBoundingClientRect();
      return { top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10,
        left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10 }; }
    function text(el){ if (!el || !el.firstChild) return null; var g = document.createRange();
      g.selectNodeContents(el); var rs = Array.prototype.slice.call(g.getClientRects());
      var tops = []; rs.forEach(function(r){ var t = Math.round(r.top); if (tops.indexOf(t) < 0) tops.push(t); });
      var b = g.getBoundingClientRect();
      return { right: Math.round(b.right * 10) / 10, lines: tops.length }; }
    var m = document.getElementById('rosterModal'), p = m && m.querySelector('.modal-panel');
    var body = p && p.querySelector('.modal-body');
    var rows = Array.prototype.slice.call(document.querySelectorAll('#rosterList .roster-row'));
    function rowFor(id){ return rows.filter(function(r){
      return !!r.querySelector('[data-student-edit="' + id + '"]'); })[0] || null; }
    function take(r){ if (!r) return null;
      var name = r.querySelector('.roster-row-name'), note = r.querySelector('.roster-row-note');
      var acts = r.querySelector(':scope > .roster-row-actions');
      return {
        row: box(r),
        order: Array.prototype.map.call(r.children, function(c){ return c.classList[0]; }),
        kids: Array.prototype.map.call(r.children, function(c){ return box(c); }),
        who: box(r.querySelector(':scope > .roster-row-who')),
        name: box(name), nameText: text(name), noteText: text(note),
        note: note ? note.textContent : null,
        dot: box(r.querySelector(':scope > .support-dot')),
        dots: r.querySelectorAll('.support-dot, [data-supports-open]').length,
        acts: box(acts),
        buttons: acts ? Array.prototype.map.call(acts.querySelectorAll('button'), function(b){
          return { t: b.textContent.trim(), b: box(b) }; }) : []
      }; }
    return {
      open: !!m && !m.classList.contains('hidden'),
      vw: window.innerWidth, coarse: matchMedia('(pointer: coarse)').matches,
      panelW: p ? p.offsetWidth : -1, panel: box(p),
      pageSide: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      overlaySide: m ? m.scrollWidth - m.clientWidth : -1,
      panelSide: p ? p.scrollWidth - p.clientWidth : -1,
      bodySide: body ? body.scrollWidth - body.clientWidth : -1,
      rowsInside: rows.every(function(r){ var b = r.getBoundingClientRect(), q = p.getBoundingClientRect();
        return b.left >= q.left - 0.5 && b.right <= q.right + 0.5; }),
      long: take(rowFor(${j(S.long.id)})), plain: take(rowFor(${j(S.plain.id)})),
      visible: window.planbook.supports.supportsVisible()
    }; })()`;
  const openRoster = async () => {
    await shut();
    await openSettingsDoor('[data-roster-manage]');
    await pause(200);
    return evalJs(READ);
  };
  /* One flex line: every child of the row overlaps every other vertically — the lowest top above the
     highest bottom — which a wrapped row cannot satisfy, because its second line starts below the
     first line's bottom. And ✎ · Edit · Remove are three of the row's buttons, on that line. */
  const oneLine = (x) => !!x && x.kids.length >= 3
    && Math.max(...x.kids.map((k) => k.top)) < Math.min(...x.kids.map((k) => k.bottom))
    && j(x.buttons.map((b) => b.t)) === j(['✎', 'Edit', 'Remove'])
    && x.buttons.every((b) => b.b.top < x.name.bottom && b.b.bottom > x.name.top);
  const noSideways = (r) => r.pageSide <= 0 && r.overlaySide <= 0 && r.panelSide <= 0 && r.bodySide <= 0 && r.rowsInside;
  const geometry = (x) => !x || !x.dot ? 'no dot built' : [
    'name text ends ' + x.nameText.right, 'note text ends ' + (x.noteText ? x.noteText.right : 'none'),
    'name column ends ' + x.who.right, 'dot ' + x.dot.left + '..' + x.dot.right,
    'actions start ' + x.acts.left,
    'dot sits ' + Math.round((x.dot.left - Math.max(x.nameText.right, x.noteText ? x.noteText.right : 0)) * 10) / 10
      + 'px past the longer of name and note, ' + Math.round((x.acts.left - x.dot.right) * 10) / 10
      + 'px before the actions'].join(' · ');
  const said = (r) => 'vw ' + r.vw + ', coarse ' + r.coarse + ', panel ' + r.panelW + 'px · sideways page '
    + r.pageSide + ', overlay ' + r.overlaySide + ', panel ' + r.panelSide + ', body ' + r.bodySide
    + ', rows inside ' + r.rowsInside;
  const rowSaid = (x) => !x ? 'no long row' : 'row ' + j(x.row) + ' · order ' + j(x.order)
    + ' · name lines ' + (x.nameText && x.nameText.lines) + ' · buttons ' + j(x.buttons.map((b) => b.t));

  const before = await evalJs("({ open: localStorage.getItem('planbook_openClassId'),"
    + " pres: localStorage.getItem('planbook_presentationMode') })");

  try {
    await size(1280, 800, false);
    const plant = await evalJs(`(async function(){
      var p = window.planbook, s = p.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      var S = ${j(S)}, made = {};
      Object.keys(S).forEach(function(k){
        var st = p.roster.newStudent(S[k].first, S[k].last); st.id = S[k].id; st.nickname = S[k].nickname;
        made[k] = st; });
      made.long.supports = Object.assign({}, made.long.supports || {}, { plan: '504' });
      function cls(c, roster){ return { id:c.id, name:c.name, archived:false, roster:roster, letterScale:null,
        terms:[{ id:'tm_' + c.id, label:'WO-1.76 Term', start:'', end:'' }],
        categories:[{ id:'k_' + c.id, name:'Essays', weight:100 }] }; }
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        if (!Array.isArray(doc.students)) doc.students = [];
        Object.keys(made).forEach(function(k){ doc.students.push(made[k]); });
        doc.classes.push(cls(${j(A)}, [S.long.id, S.plain.id]));
        doc.classes.push(cls(${j(B)}, [S.long.id]));
      });
      await s.flush();
      return { ok:true, hasDot: p.supports.hasSupports(made.long) }; })()`);
    if (!plant.ok) throw new Error('could not plant the classes: ' + plant.why);
    await reload();
    await enter();

    /* ══ Acceptance 1 — 640 at 1280, and no sideways scroll ══ */
    const wide = await openRoster();
    check('WO-1.76: in a 1280px window under a fine pointer the roster dialog\'s panel is ' + WANT
      + 'px wide — `width`, not a cap that never comes into play — and nothing in the dialog or the page scrolls sideways',
      wide.open && wide.vw === 1280 && wide.coarse === false && wide.panelW === WANT && noSideways(wide),
      said(wide));

    /* ══ Acceptance 2 — the long row at 640, fine pointer ══ */
    const L = wide.long;
    check('WO-1.76: at 640 a roster row for a student with a plan on file, an "also in" note and a long name '
      + 'is one line tall, the name\'s text on one line, the note under it, and ✎ · Edit · Remove on that line',
      plant.hasDot && !!L && L.dots === 1 && oneLine(L) && !!L.nameText && L.nameText.lines === 1
        && L.note === 'also in ' + B.name,
      rowSaid(L) + ' · note ' + j(L && L.note));
    /* The dot where WO-1.74 left it — after the name column, immediately left of ✎ — which is where the
       owner ruled it stays (2026-10-10, on the iPad). Its distance from the words is printed, not
       asserted: it grows with the column, and the ruling is about its neighbour, not that gap. */
    console.log('  MEASURE | WO-1.76 dot at 640, fine pointer: ' + geometry(L));
    check('WO-1.76: the support dot is where WO-1.74 left it — after the name column, before the actions — '
      + 'and not moved by the width (its place is the owner\'s ruling; the geometry is on the MEASURE line)',
      !!L && j(L.order) === j(['avatar', 'roster-row-who', 'support-dot', 'roster-row-actions'])
        && !!L.dot && L.dot.left >= L.who.right - 0.5 && L.dot.right <= L.acts.left + 0.5,
      geometry(L));

    /* ══ Acceptance 1, the iPad halves — upright and lying down, under a really coarse pointer ══
       The coarse block restates `.modal-form` (`.roster-panel` until WO-1.77); a laptop-only reading would never see that rule. */
    await shut();
    await size(820, 1180, true);
    const upright = await openRoster();
    await shut();
    await size(1194, 834, true);
    const lying = await openRoster();
    check('WO-1.76: on an iPad upright (820×1180) and lying down (1194×834) under a coarse pointer the '
      + 'roster panel is ' + WANT + 'px, nothing scrolls sideways, and the long row is still one line with its actions on it',
      [upright, lying].every((r) => r.open && r.coarse === true && r.panelW === WANT && noSideways(r) && oneLine(r.long)),
      'upright: ' + said(upright) + ' · ' + rowSaid(upright.long) + ' || lying: ' + said(lying) + ' · ' + rowSaid(lying.long));
    console.log('  MEASURE | WO-1.76 dot at 640, coarse, upright: ' + geometry(upright.long));
    console.log('  MEASURE | WO-1.76 dot at 640, coarse, lying down: ' + geometry(lying.long));

    /* ══ Acceptance 1, the phone half — 95vw at 390×844, no sideways scroll ══ */
    await shut();
    await size(390, 844, true);
    const phone = await openRoster();
    check('WO-1.76: at 390×844 under a coarse pointer the roster panel is no wider than 95vw (370.5px) and '
      + 'nothing in the dialog or the page scrolls sideways — the (max-width: 640px) block still wins',
      phone.open && phone.vw === 390 && phone.panelW > 0 && phone.panelW <= 390 * 0.95 && noSideways(phone),
      said(phone));

    /* ══ Presentation mode — the dot is not built at 640, and the row keeps its line ══ */
    await shut();
    await size(1280, 800, false);
    await clickSel('header [data-presentation-toggle]');
    await pause(200);
    const pres = await openRoster();
    check('WO-1.76: under presentation mode, at 640, the long row\'s support dot is absent from the DOM — '
      + 'supportsVisible() still decides, the width touched nothing of WO-1.9 — and the row is still one line',
      pres.visible === false && pres.panelW === WANT && !!pres.long && pres.long.dots === 0
        && j(pres.long.order) === j(['avatar', 'roster-row-who', 'roster-row-actions']) && oneLine(pres.long),
      'supportsVisible() ' + pres.visible + ' · panel ' + pres.panelW + ' · ' + rowSaid(pres.long)
        + ' · dots ' + j(pres.long && pres.long.dots));
    await shut();
    await clickSel('header [data-presentation-toggle]');
    await pause(200);

    /* Acceptance 3 — "every other dialog still measures 480" — moved to tools/verify/dialog-kinds.mjs at
       WO-1.77; see this file's header. */
  } finally {
    await shut();
    await size(1280, 800, false);
    await evalJs(`(async function(){
      var s = window.planbook.store;
      var ids = ${j(Object.keys(S).map((k) => S[k].id))}, cids = ${j([A.id, B.id])};
      if (s.getDoc()) {
        s.update(function(doc){
          doc.classes = (doc.classes || []).filter(function(c){ return cids.indexOf(c.id) < 0; });
          doc.students = (doc.students || []).filter(function(x){ return ids.indexOf(x.id) < 0; });
        });
        await s.flush();
      }
      var b = ${j(before)};
      function put(k, v){ if (v === null) { try { localStorage.removeItem(k); } catch (e) {} }
        else localStorage.setItem(k, v); }
      put('planbook_openClassId', b.open);
      put('planbook_presentationMode', b.pres);
      return 1; })()`);
    await reload();
  }
}
}
