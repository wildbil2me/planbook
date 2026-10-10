/* settings-back.mjs — a dialog opened from Settings has a way back to it (WO-1.72)
 *
 * WHAT THIS SECTION OWNS. "‹ Settings" in the header of the three dialogs the hub opens directly —
 * Roster and contacts, Classes and terms, Your details: that it is drawn when the hub opened the
 * dialog and on no other opening; that it closes the dialog and reopens the hub with focus on the
 * door that was used, the gear still the hub's opener; that ✕, Done, Escape and the backdrop close
 * all the way and FORGET the opening, so the next + tap draws nothing (the work order's Traps line,
 * driven in the order it fears); that the inner dialogs — Edit student over the roster, Categories
 * over Classes and terms — stack over their parent, draw no button of their own, and leave the
 * parent's standing (the owner's "first level only"); and that under a coarse pointer at 390×844 the
 * button is at least 44px.
 *
 * WHAT IT LEAVES TO SECTIONS THAT ALREADY OWN IT. The doors themselves, the class the roster door
 * names and Settings shutting behind a door are `settings-hub.mjs`'s; focus trapping and return on
 * the class manager are `modal.mjs`'s, whose second opener is the gear-then-door walk and so now
 * opens a dialog wearing this button.
 *
 * THE FIXTURE IS ONE CLASS AND ONE STUDENT OF ITS OWN, and the open-class preference — all put back
 * at the foot, with the viewport, whatever happens above.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- the way back to Settings (WO-1.72) ---');

if (!seam) {
  skip('a dialog opened from Settings has a way back to it',
    'window.planbook is not on the page, so nothing here can seed a class or read the stack');
} else {
  const C = { id: 'c_wo172', name: 'WO-1.72 English IV' };
  const DIALOGS = [
    { id: 'rosterModal', door: '[data-roster-manage]' },
    { id: 'classesModal', door: '[data-class-manage]' },
    { id: 'teacherModal', door: '[data-teacher-panel]' },
  ];

  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  const size = async (width, height, coarse) => {
    await send('Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 1, mobile: !!coarse });
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
  const goHome = async () => {
    await shut();
    if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
    await pause(150);
  };
  const enter = async () => {
    await goHome();
    await clickSel('#homeGrid [data-class-tab="' + C.id + '"]');
    await pause(250);
  };
  const reload = async () => {
    await send('Page.reload');
    await pause(600);
    await waitForBoot();
    await evalJs(KILL_ANIM);
  };
  const key = async (k, code, vk) => {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
    await pause(150);
  };
  const backdrop = async (id) => {
    const at = await evalJs("(function(){var r=document.getElementById('" + id
      + "').getBoundingClientRect();return {x:r.x+6,y:r.y+6}})()");
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', clickCount: 1 });
    await pause(200);
  };

  /* Everything this section asks, in one round trip: which overlays are open, which carry a DRAWN way
     back (laid out, not merely present — the button is in the markup of all three, `.hidden`), whether
     it sits before the title in the header, and where focus is. */
  const READ = `(function(){
    var open = Array.prototype.map.call(document.querySelectorAll('.modal-overlay:not(.hidden)'),
      function(o){ return o.id; });
    var drawn = Array.prototype.filter.call(document.querySelectorAll('[data-settings-back]'),
      function(b){ return b.getClientRects().length > 0; }).map(function(b){
        var o = b.closest('.modal-overlay'); var h2 = o && o.querySelector('.modal-header h2');
        return { in: o ? o.id : '', beforeTitle: !!h2 && !!(b.compareDocumentPosition(h2) & 4)
          && !!b.closest('.modal-header'), text: b.textContent.trim() }; });
    var a = document.activeElement;
    var doorOf = function(el){ var hooks = ['data-roster-manage','data-class-manage','data-teacher-panel'];
      for (var i = 0; i < hooks.length; i++) if (el && el.hasAttribute && el.hasAttribute(hooks[i])
        && el.closest('#settingsModal')) return hooks[i]; return ''; };
    return { open: open, drawn: drawn,
      active: a ? (a.id || doorOf(a) || a.className) : '' }; })()`;
  const read = () => evalJs(READ);
  const fromHub = async (door) => {
    await clickSel('#settingsBtn'); await pause(120);
    await clickSel('#settingsModal ' + door); await pause(200);
  };
  const plusTab = async () => { await clickVisible('header [data-class-manage]'); await pause(200); };
  const backIn = async (id) => { await clickSel('#' + id + ' [data-settings-back]'); await pause(200); };
  const j = (x) => JSON.stringify(x);

  const before = await evalJs("localStorage.getItem('planbook_openClassId')");

  try {
    await size(1280, 800, false);
    const plant = await evalJs(`(async function(){
      var p = window.planbook, s = p.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      var st = p.roster.newStudent('Wo172', 'Ashdown');
      st.id = 'wo172-s1';
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        if (!Array.isArray(doc.students)) doc.students = [];
        doc.students.push(st);
        doc.classes.push({ id:${j(C.id)}, name:${j(C.name)}, archived:false, roster:['wo172-s1'],
          letterScale:null, terms:[{ id:'tm_wo172', label:'WO-1.72 Term', start:'', end:'' }],
          categories:[{ id:'k_wo172', name:'Essays', weight:100 }] });
      });
      await s.flush();
      return { ok:true }; })()`);
    if (!plant.ok) throw new Error('could not plant the class: ' + plant.why);
    await reload();
    await enter();

    /* ══ Acceptance 1, first half — drawn from the hub, on all three ══ */
    const drawnFromHub = [];
    for (const d of DIALOGS) {
      await fromHub(d.door);
      drawnFromHub.push({ id: d.id, r: await read() });
      await shut();
    }
    check('WO-1.72: opened from Settings, Roster, Classes and terms and Your details each draw "‹ Settings" '
      + 'in their own header, before the title, with Settings shut behind them',
      drawnFromHub.every(({ id, r }) => j(r.open) === j([id]) && r.drawn.length === 1
        && r.drawn[0].in === id && r.drawn[0].beforeTitle && r.drawn[0].text === '‹ Settings'),
      drawnFromHub.map(({ id, r }) => id + ': open ' + j(r.open) + ', drawn ' + j(r.drawn)).join(' · '));

    /* ══ Acceptance 2, first half — back is a close and an open, focus on the door used ══ */
    const backs = [];
    for (const d of DIALOGS) {
      await fromHub(d.door);
      await backIn(d.id);
      backs.push({ id: d.id, door: d.door.slice(1, -1), r: await read() });
      await shut();
    }
    check('WO-1.72: "‹ Settings" closes each of the three and reopens Settings — the only overlay open, '
      + 'never a hub stacked over the dialog — with focus on the door that opened it',
      backs.every(({ door, r }) => j(r.open) === j(['settingsModal']) && r.active === door
        && r.drawn.length === 0),
      backs.map(({ id, r }) => id + ' → open ' + j(r.open) + ', focus on ' + j(r.active)).join(' · '));

    await fromHub('[data-roster-manage]');
    await backIn('rosterModal');
    await clickSel('#settingsModal [data-modal-close]');
    await pause(150);
    const afterHubX = await read();
    await fromHub('[data-roster-manage]');
    await backIn('rosterModal');
    await clickSel('#settingsModal [data-roster-manage]');
    await pause(200);
    const twice = await read();
    await shut();
    check('WO-1.72: the hub that back reopens still has the gear as its opener — its ✕ gives focus to '
      + 'the gear — and a door tapped from it draws the way back again',
      afterHubX.open.length === 0 && afterHubX.active === 'settingsBtn'
        && j(twice.open) === j(['rosterModal']) && twice.drawn.length === 1 && twice.drawn[0].in === 'rosterModal',
      'after ✕ on the reopened hub: open ' + j(afterHubX.open) + ', focus on ' + j(afterHubX.active)
        + '; roster door from it: open ' + j(twice.open) + ', drawn ' + j(twice.drawn));

    /* ══ Acceptance 2, second half — ✕ and Done close all the way ══ */
    const closes = [];
    for (const d of DIALOGS) {
      await fromHub(d.door);
      await clickSel('#' + d.id + ' .modal-header [data-modal-close]');
      await pause(150);
      closes.push({ how: d.id + ' ✕', r: await read() });
    }
    await fromHub('[data-teacher-panel]');
    await clickSel('#teacherModal .modal-actions [data-modal-close]');
    await pause(150);
    closes.push({ how: 'teacherModal Done', r: await read() });
    check('WO-1.72: ✕ on all three, and Done on Your details, close the dialog and leave Settings shut, '
      + 'focus on the gear',
      closes.every(({ r }) => r.open.length === 0 && r.active === 'settingsBtn'),
      closes.map(({ how, r }) => how + ': open ' + j(r.open) + ', focus ' + j(r.active)).join(' · '));

    /* ══ Acceptance 1, second half — opened any other way, nothing is drawn ══ */
    await shut();
    await plusTab();
    const plain = { plus: await read() };
    await shut();
    for (const d of DIALOGS) {
      /* A script's click on a door of a SHUT hub: present in the markup, never a teacher in Settings. */
      await evalJs("document.querySelector('#settingsModal " + d.door + "').click(); 1");
      await pause(150);
      plain[d.id + ' (shut-hub click)'] = await read();
      await shut();
      await evalJs("window.planbook.openModal('" + d.id + "'); 1");
      await pause(100);
      plain[d.id + ' (openModal)'] = await read();
      await shut();
    }
    const plainBad = Object.keys(plain).filter((k) => plain[k].drawn.length !== 0 || plain[k].open.length !== 1);
    check('WO-1.72: opened any other way — the + tab, a script\'s click on a door of a shut hub, '
      + 'openModal() itself — none of the three draws "‹ Settings"',
      plainBad.length === 0,
      Object.keys(plain).map((k) => k + ': open ' + j(plain[k].open) + ', drawn ' + j(plain[k].drawn)).join(' · '));

    /* ══ The Traps line, driven in the order it fears: a hub opening, a way out, then another door ══ */
    const traps = [];
    await fromHub('[data-roster-manage]');
    await clickSel('#rosterModal [data-modal-close]'); await pause(150);
    await plusTab();
    traps.push({ how: 'hub → Roster → ✕ → + tab', r: await read() });
    await shut();
    /* No route at all on the second opening, so nothing re-decides the button on the way in: only
       the close can have forgotten it. */
    await fromHub('[data-roster-manage]');
    await clickSel('#rosterModal [data-modal-close]'); await pause(150);
    await evalJs("window.planbook.openModal('rosterModal'); 1"); await pause(100);
    traps.push({ how: 'hub → Roster → ✕ → openModal(rosterModal)', r: await read() });
    await shut();
    await fromHub('[data-class-manage]');
    await clickSel('#classesModal [data-modal-close]'); await pause(150);
    await plusTab();
    traps.push({ how: 'hub → Classes → ✕ → + tab', r: await read() });
    await shut();
    await fromHub('[data-class-manage]');
    await key('Escape', 'Escape', 27);
    await plusTab();
    traps.push({ how: 'hub → Classes → Escape → + tab', r: await read() });
    await shut();
    await fromHub('[data-class-manage]');
    await backdrop('classesModal');
    await plusTab();
    traps.push({ how: 'hub → Classes → backdrop → + tab', r: await read() });
    await shut();
    await fromHub('[data-class-manage]');
    await backIn('classesModal');
    await shut();
    await plusTab();
    traps.push({ how: 'hub → Classes → ‹ Settings → shut → + tab', r: await read() });
    await shut();
    await fromHub('[data-class-manage]');
    await clickSel('#classesModal [data-modal-close]'); await pause(150);
    await evalJs("document.querySelector('#scoresNoGrade [data-category-manage]').click(); 1");
    await pause(200);
    traps.push({ how: 'hub → Classes → ✕ → the grades screen\'s Categories', r: await read() });
    await shut();
    check('WO-1.72: the flag is forgotten on every way out — after a hub opening closed by ✕, Escape, '
      + 'the backdrop or back itself, the + tab\'s Classes and terms, the roster reopened with no route at '
      + 'all, and the grades screen\'s Categories draw no "‹ Settings"',
      traps.every(({ r }) => r.open.length === 1 && r.drawn.length === 0)
        && traps[0].r.open[0] === 'classesModal' && traps[1].r.open[0] === 'rosterModal'
        && traps[traps.length - 1].r.open[0] === 'categoriesModal',
      traps.map(({ how, r }) => how + ': open ' + j(r.open) + ', drawn ' + j(r.drawn)).join(' · '));

    /* ══ First level only — the inner dialogs stack over their parent and leave its button standing ══ */
    const inner = [];
    await fromHub('[data-roster-manage]');
    await clickSel('#rosterList .roster-row:nth-child(1) [data-student-edit]'); await pause(200);
    inner.push({ how: 'Roster → Edit student', r: await read() });
    await key('Escape', 'Escape', 27);
    inner.push({ how: '… → Escape', r: await read() });
    await shut();
    await fromHub('[data-class-manage]');
    await clickSel('#classesModal [data-category-manage="' + C.id + '"]'); await pause(200);
    inner.push({ how: 'Classes → Categories', r: await read() });
    await key('Escape', 'Escape', 27);
    inner.push({ how: '… → Escape', r: await read() });
    await backIn('classesModal');
    inner.push({ how: '… → ‹ Settings', r: await read() });
    await shut();
    const only = (r, id) => r.drawn.length === 1 && r.drawn[0].in === id;
    check('WO-1.72: first level only — Edit student and Categories open OVER the dialog the hub opened, '
      + 'draw no "‹ Settings" of their own, and close back onto a parent still wearing its own, which '
      + 'still goes back',
      j(inner[0].r.open.slice().sort()) === j(['rosterModal', 'studentModal']) && only(inner[0].r, 'rosterModal')
        && j(inner[1].r.open) === j(['rosterModal']) && only(inner[1].r, 'rosterModal')
        && inner[2].r.open.indexOf('classesModal') >= 0 && inner[2].r.open.indexOf('categoriesModal') >= 0
        && only(inner[2].r, 'classesModal')
        && j(inner[3].r.open) === j(['classesModal']) && only(inner[3].r, 'classesModal')
        && j(inner[4].r.open) === j(['settingsModal']) && inner[4].r.active === 'data-class-manage',
      inner.map(({ how, r }) => how + ': open ' + j(r.open) + ', drawn ' + j(r.drawn) + ', focus '
        + j(r.active)).join(' · '));

    /* ══ Acceptance 3 — 390×844 under a coarse pointer ══ */
    await size(390, 844, true);
    await evalJs(KILL_ANIM);
    const measured = [];
    for (const d of DIALOGS) {
      await fromHub(d.door);
      measured.push({ id: d.id, m: await evalJs(`(function(){
        var o = document.getElementById('${d.id}');
        var bb = o.querySelector('[data-settings-back]'), b = bb.getBoundingClientRect();
        var x = o.querySelector('.modal-header [data-modal-close]').getBoundingClientRect();
        var hd = o.querySelector('.modal-header').getBoundingClientRect();
        var t = o.querySelector('.modal-header h2').getBoundingClientRect();
        return { coarse: matchMedia('(pointer: coarse)').matches,
          w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10,
          font: getComputedStyle(bb).fontSize,
          xh: Math.round(x.height * 10) / 10, xRight: x.right <= hd.right + 0.5, title: t.width > 0,
          overlap: b.right > x.left || t.right > x.left + 0.5,
          overflow: document.documentElement.scrollWidth - window.innerWidth }; })()`) });
      await shut();
    }
    /* The 44 alone would pass with src/shell.css's own `.modal-back` coarse rule deleted, because the
       bare `button { min-height: 44px }` at the head of that block carries it too — a planted delete
       proved that. The drawing's § TOUCH type, 14px, is what only the named rule gives, so it is
       asserted beside the floor: the floor is the Acceptance line, the type is the lift. */
    check('WO-1.72: at 390×844 under a coarse pointer "‹ Settings" is at least 44px tall and wide on all '
      + 'three, in the 14px touch type of the drawing, beside a 44px ✕ inside the header, overlapping nothing, '
      + 'and the page does not scroll sideways',
      measured.every(({ m }) => m.coarse && m.h >= 44 && m.w >= 44 && m.font === '14px' && m.xh >= 44 && m.xRight && m.title
        && !m.overlap && m.overflow <= 0),
      measured.map(({ id, m }) => id + ': ' + j(m)).join(' · '));
  } finally {
    await shut();
    await size(1280, 800, false);
    await evalJs(`(async function(){
      var s = window.planbook.store;
      if (s.getDoc()) {
        s.update(function(doc){
          doc.classes = (doc.classes || []).filter(function(c){ return c.id !== ${j(C.id)}; });
          doc.students = (doc.students || []).filter(function(x){ return x.id !== 'wo172-s1'; });
        });
        await s.flush();
      }
      var open = ${j(before)};
      if (open === null) { try { localStorage.removeItem('planbook_openClassId'); } catch (e) {} }
      else localStorage.setItem('planbook_openClassId', open);
      return 1; })()`);
    await reload();
  }
}
}
