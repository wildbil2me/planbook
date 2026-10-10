/* settings-hub.mjs — the header keeps what is used in class, and the rest goes behind a gear (WO-1.71)
 *
 * WHAT THIS SECTION OWNS. The header's two rows as WO-1.71 re-sorted them, the orange rule under the
 * header, and the Settings dialog behind the gear: that each of its four doors reaches what its
 * header icon reached and leaves the dialog shut behind it, that the roster door names the class
 * `getSelectedClassId()` resolves to (from All classes, from inside a class, and from a stale
 * preference), that the Sound alerts switch and `soundsOn()` agree through off, on and a reload, and
 * that at 390×844 under a coarse pointer the page does not scroll sideways and every control in both
 * rows and in the dialog is at least 44px.
 *
 * WHAT IT LEAVES TO SECTIONS THAT ALREADY OWN IT. That an overdue pass with the sound OFF is still
 * announced and still tints its card is asserted in `attendance-passes.mjs` § "THE OFF SWITCH",
 * which since WO-1.71 drives the mute through this same switch; a second copy of that fixture here
 * would be a second opinion about a pass clock. The sync button's place in the top row on an
 * opted-in device is `sync-button.mjs`'s, which reads the row's whole order at iPad width.
 *
 * THE FIXTURE IS TWO CLASSES OF ITS OWN, and the preference that says which is open, and the sound
 * preference — all three put back at the foot, with the viewport, whatever happens above.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

console.log('\n--- the header and Settings (WO-1.71) ---');

if (!seam) {
  skip('the header keeps what is used in class, and Settings holds the rest',
    'window.planbook is not on the page, so nothing here can seed a class or read the preference');
} else {
  const A = { id: 'c_wo171a', name: 'WO-1.71 English I' };
  const B = { id: 'c_wo171b', name: 'WO-1.71 English III' };
  const ORANGE = 'rgb(230, 126, 34)';

  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  const onView = () => evalJs(
    "(function(){var v=document.querySelector('main > :not(.hidden)');return v?v.id:''})()");
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
  const goHome = async () => {
    await shut();
    if ((await onView()) !== 'homeView') await clickVisible('[data-view-home]');
    await pause(150);
  };
  const enter = async (cls) => {
    await goHome();
    await clickSel('#homeGrid [data-class-tab="' + cls.id + '"]');
    await pause(250);
  };
  const reload = async () => {
    await send('Page.reload');
    await pause(600);
    await waitForBoot();
    await evalJs(KILL_ANIM);
  };
  /* Everything about Settings and the header in one round trip. */
  const READ = `(function(){
    var m = document.getElementById('settingsModal');
    var sw = document.getElementById('soundsSwitch');
    var laid = function(root, sel){ return root ? Array.prototype.filter.call(root.querySelectorAll(sel),
      function(x){ return x.getClientRects().length > 0; }) : []; };
    var name = function(x){ return x.id || (x.hasAttribute('data-backup-panel') ? 'backup' : x.className); };
    var open = Array.prototype.map.call(document.querySelectorAll('.modal-overlay:not(.hidden)'),
      function(o){ return o.id; });
    var hs = getComputedStyle(document.querySelector('.header'));
    return {
      top: laid(document.querySelector('.header-actions'), 'button').map(name),
      right: laid(document.getElementById('headerRightControls'), 'button').map(function(x){
        return { id: x.id, title: x.title, label: x.getAttribute('aria-label') }; }),
      soundInHeader: document.querySelectorAll('header [data-sounds-toggle], #soundsBtn').length,
      oldIconsInHeader: document.querySelectorAll('header [data-roster-manage], header [data-teacher-panel], '
        + 'header [data-templates-open], #headerRightControls [data-class-manage]').length,
      rule: { w: hs.borderBottomWidth, style: hs.borderBottomStyle, color: hs.borderBottomColor },
      settingsOpen: !!m && !m.classList.contains('hidden'),
      open: open,
      view: (document.querySelector('main > :not(.hidden)') || {}).id || '',
      doorClass: (document.getElementById('settingsRosterClass') || {}).textContent || '',
      doorHint: ((document.getElementById('settingsRosterHint') || {}).textContent || '').trim(),
      rosterClass: (document.getElementById('rosterClassName') || {}).textContent || '',
      selectedId: window.planbook.classes.getSelectedClassId(),
      selectedName: (window.planbook.classes.getSelectedClass() || {}).name || '',
      active: document.activeElement ? (document.activeElement.id || document.activeElement.className) : '',
      checked: sw ? sw.checked : null,
      on: window.planbook.alertSound.soundsOn(),
      stored: localStorage.getItem('planbook_alertSoundOn'),
      said: ((document.getElementById('srLive') || {}).textContent || '').trim()
    }; })()`;
  const read = () => evalJs(READ);
  const openSettings = async () => { await clickSel('#settingsBtn'); await pause(120); };
  const door = async (hook) => { await openSettings(); await clickSel('#settingsModal ' + hook); await pause(200); };

  const before = await evalJs(`(function(){ return {
    openClassId: localStorage.getItem('planbook_openClassId'),
    sound: localStorage.getItem('planbook_alertSoundOn') }; })()`);

  try {
    await size(1280, 800, false);
    const plant = await evalJs(`(async function(){
      var s = window.planbook.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        [${JSON.stringify(A)}, ${JSON.stringify(B)}].forEach(function(c){
          doc.classes.push({ id:c.id, name:c.name, archived:false, roster:[], letterScale:null,
            terms:[], categories:[] });
        });
      });
      await s.flush();
      return { ok:true }; })()`);
    if (!plant.ok) throw new Error('could not plant the two classes: ' + plant.why);
    await reload();

    /* ══ Acceptance 1 — the two rows and the rule ══ */
    await goHome();
    const home = await read();
    check('WO-1.71: the top row draws Backup, Presentation, Year and About in that order — Sync is '
      + 'hidden on a device that never opted in, and sync-button.mjs reads its place beside Backup — and '
      + 'no sounds button; the second row ends in exactly one control, the Settings gear',
      JSON.stringify(home.top) === JSON.stringify(['backup', 'presentationBtn', 'yearButton', 'aboutBtn'])
        && home.soundInHeader === 0 && home.oldIconsInHeader === 0
        && home.right.length === 1 && home.right[0].id === 'settingsBtn'
        && home.right[0].title === 'Settings' && home.right[0].label === 'Settings',
      'top row ' + JSON.stringify(home.top) + '; right of the second row ' + JSON.stringify(home.right)
        + '; sound controls in the header ' + home.soundInHeader + '; old icons in the header '
        + home.oldIconsInHeader);

    const rules = [{ where: home.view, rule: home.rule }];
    await enter(B);
    const segs = await evalJs(`(function(){ return Array.prototype.filter.call(
      document.querySelectorAll('[data-class-screen]'), function(x){ return x.getClientRects().length > 0; })
      .map(function(x){ return x.getAttribute('data-class-screen'); })
      .filter(function(v, i, a){ return a.indexOf(v) === i; }); })()`);
    const inClass = await read();
    rules.push({ where: inClass.view, rule: inClass.rule });
    const tabsDrawn = await evalJs("document.querySelectorAll('#classTabBar [data-class-tab]').length");
    for (const seg of segs) {
      await shut();
      try { await clickVisible('[data-class-screen="' + seg + '"]'); } catch (e) { continue; }
      await pause(200);
      const r = await read();
      rules.push({ where: r.view, rule: r.rule });
    }
    const badRule = rules.filter((r) => !(r.rule.w === '2px' && r.rule.style === 'solid' && r.rule.color === ORANGE));
    const seen = rules.map((r) => r.where).filter((v, i, a) => a.indexOf(v) === i);
    check('WO-1.71: a 2px #e67e22 rule sits under the header on the home view and on every class '
      + 'screen the switcher reaches, and the class view draws its tabs beside the terms and the gear',
      badRule.length === 0 && seen.length >= 4 && seen.indexOf('homeView') >= 0 && tabsDrawn >= 2
        && inClass.right.length === 1 && inClass.right[0].id === 'settingsBtn',
      'read on ' + JSON.stringify(seen) + '; wrong on ' + JSON.stringify(badRule) + '; tabs drawn '
        + tabsDrawn + '; right of the second row ' + JSON.stringify(inClass.right.map((x) => x.id)));

    await openSettings();
    const dialogs = await evalJs(`(function(){
      var out = [];
      document.querySelectorAll('.modal-overlay:not(.hidden) .modal-panel, .modal-overlay:not(.hidden) .modal-header')
        .forEach(function(el){ var s = getComputedStyle(el);
          out.push({ c: el.className, w: s.borderBottomWidth, color: s.borderBottomColor }); });
      return out; })()`);
    const orangeOnDialog = dialogs.filter((d) => d.color === ORANGE && d.w !== '0px');
    check('WO-1.71: no dialog wears the rule — the Settings panel and its header carry no orange border',
      dialogs.length >= 2 && orangeOnDialog.length === 0,
      JSON.stringify(dialogs));
    await shut();

    /* ══ Acceptance 2 and 3 — the doors, and the class the roster door names ══ */
    await enter(B);
    await openSettings();
    const fromB = await read();
    await clickSel('#settingsModal [data-roster-manage]');
    await pause(200);
    const rosterB = await read();
    await clickSel('#rosterModal [data-modal-close]');
    await pause(150);
    const backB = await read();
    check('WO-1.71: from inside a class the roster door names that class — the one getSelectedClassId() '
      + 'resolves to — the roster opens on it with Settings shut behind it, and its ✕ gives focus back '
      + 'to the gear rather than to a door inside a closed dialog',
      fromB.settingsOpen && fromB.doorClass === B.name && fromB.selectedId === B.id
        && fromB.doorHint === B.name + ' · students, guardians and supports'
        && JSON.stringify(rosterB.open) === JSON.stringify(['rosterModal']) && rosterB.rosterClass === B.name
        && backB.open.length === 0 && backB.active === 'settingsBtn',
      'door says ' + JSON.stringify(fromB.doorHint) + ' with ' + fromB.selectedId + ' selected; open after '
        + 'the tap ' + JSON.stringify(rosterB.open) + ', roster names ' + JSON.stringify(rosterB.rosterClass)
        + '; after ✕ focus is on ' + JSON.stringify(backB.active));

    await goHome();
    await openSettings();
    const fromHome = await read();
    await clickSel('#settingsModal [data-roster-manage]');
    await pause(200);
    const rosterHome = await read();
    await shut();
    check('WO-1.71: from All classes the roster door names the last class visited, and the roster opens on it',
      fromHome.view === 'homeView' && fromHome.doorClass === B.name && fromHome.selectedId === B.id
        && rosterHome.rosterClass === B.name && JSON.stringify(rosterHome.open) === JSON.stringify(['rosterModal']),
      'on ' + fromHome.view + ' the door names ' + JSON.stringify(fromHome.doorClass) + ' (selected '
        + fromHome.selectedId + '); the roster names ' + JSON.stringify(rosterHome.rosterClass));

    /* A stale preference: the door must say what the resolver says, not what the preference says. */
    await evalJs("window.planbook.setPref('openClassId', 'c_wo171_gone'); 1");
    await openSettings();
    const stale = await read();
    await clickSel('#settingsModal [data-roster-manage]');
    await pause(200);
    const rosterStale = await read();
    await shut();
    check('WO-1.71: with a stale open-class preference the door names the class getSelectedClassId() '
      + 'resolves it to, and the roster dialog opens on that same class',
      !!stale.selectedName && stale.selectedId !== 'c_wo171_gone' && stale.doorClass === stale.selectedName
        && rosterStale.rosterClass === stale.selectedName,
      'resolved to ' + stale.selectedId + ' (' + JSON.stringify(stale.selectedName) + '); door names '
        + JSON.stringify(stale.doorClass) + '; roster names ' + JSON.stringify(rosterStale.rosterClass));

    await enter(B);
    await door('[data-class-manage]');
    const classes = await read();
    await shut();
    await door('[data-teacher-panel]');
    const teacher = await read();
    await shut();
    await door('[data-templates-open]');
    const tpl = await read();
    check('WO-1.71: the other three doors reach what their header icons reached — Classes and terms, '
      + 'Your details and the template editor — and each leaves Settings shut behind it',
      JSON.stringify(classes.open) === JSON.stringify(['classesModal'])
        && JSON.stringify(teacher.open) === JSON.stringify(['teacherModal'])
        && tpl.open.length === 0 && tpl.view === 'templatesView',
      'Classes and terms → ' + JSON.stringify(classes.open) + '; Your details → ' + JSON.stringify(teacher.open)
        + '; Message templates → view ' + tpl.view + ' with ' + JSON.stringify(tpl.open) + ' open');

    /* ══ Acceptance 4 — the switch and the preference, through off, on and a reload ══ */
    await goHome();
    await evalJs("window.planbook.setPref('alertSoundOn', true); 1");
    await openSettings();
    const s0 = await read();
    await clickSel('#settingsModal .hub-pref');
    await pause(150);
    const s1 = await read();
    await clickSel('#settingsModal .hub-pref');
    await pause(150);
    const s2 = await read();
    await shut();
    await reload();
    await goHome();
    await openSettings();
    const s3 = await read();
    await clickSel('#settingsModal .hub-pref');
    await pause(150);
    await shut();
    await reload();
    await goHome();
    await openSettings();
    const s4 = await read();
    await shut();
    const steps = [s0, s1, s2, s3, s4];
    check('WO-1.71: the Sound alerts switch reads and writes the preference the header button did — '
      + 'on, a tap to off (announced), a tap to on, a reload, a tap to off, a reload — and soundsOn(), the '
      + 'switch and planbook_alertSoundOn agree at every step',
      steps.every((s) => s.checked === s.on && s.stored === String(s.on))
        && s0.on === true && s1.on === false && s2.on === true && s3.on === true && s4.on === false
        && /Alert sounds are off/.test(s1.said),
      steps.map((s, i) => i + ': switch ' + s.checked + ', soundsOn() ' + s.on + ', stored ' + s.stored).join(' · ')
        + '; announced after the first tap ' + JSON.stringify(s1.said));

    /* ══ Acceptance 5 — 390×844, coarse ══ */
    await size(390, 844, true);
    await evalJs(KILL_ANIM);
    const MEASURE = `(function(){
      var bad = [], n = 0;
      var add = function(el, where){
        if (!el.getClientRects().length) return;
        var r = el.getBoundingClientRect(); n++;
        if (r.width < 44 || r.height < 44) bad.push(where + ' ' + (el.id || el.className || el.tagName)
          + ' ' + Math.round(r.width * 10) / 10 + 'x' + Math.round(r.height * 10) / 10);
      };
      document.querySelectorAll('.header-top button, .header-bottom button').forEach(function(el){ add(el, 'header'); });
      var m = document.getElementById('settingsModal');
      if (m && !m.classList.contains('hidden')) m.querySelectorAll('button, label.hub-pref').forEach(function(el){ add(el, 'settings'); });
      return { n: n, bad: bad, overflow: document.documentElement.scrollWidth - window.innerWidth,
        coarse: matchMedia('(pointer: coarse)').matches }; })()`;
    const measured = [];
    await goHome();
    measured.push(['home', await evalJs(MEASURE)]);
    await openSettings();
    measured.push(['home + Settings', await evalJs(MEASURE)]);
    await shut();
    await enter(B);
    measured.push(['class', await evalJs(MEASURE)]);
    await openSettings();
    measured.push(['class + Settings', await evalJs(MEASURE)]);
    await shut();
    const wrong = measured.filter(([, m]) => !(m.coarse && m.bad.length === 0 && m.overflow <= 0 && m.n >= 5));
    check('WO-1.71: at 390×844 under a coarse pointer the page does not scroll sideways, and every '
      + 'control in both header rows and in Settings is at least 44px — home and class view, Settings shut and open',
      wrong.length === 0 && measured[1][1].n >= measured[0][1].n + 6,
      measured.map(([w, m]) => w + ': ' + m.n + ' measured, overflow ' + m.overflow + ', under 44 '
        + JSON.stringify(m.bad)).join(' · '));
  } finally {
    await shut();
    await size(1280, 800, false);
    await evalJs(`(async function(){
      var s = window.planbook.store;
      if (s.getDoc()) {
        s.update(function(doc){
          doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${A.id}' && c.id !== '${B.id}'; });
        });
        await s.flush();
      }
      var open = ${JSON.stringify(before.openClassId)};
      if (open === null) { try { localStorage.removeItem('planbook_openClassId'); } catch (e) {} }
      else localStorage.setItem('planbook_openClassId', open);
      var snd = ${JSON.stringify(before.sound)};
      if (snd === null) { try { localStorage.removeItem('planbook_alertSoundOn'); } catch (e) {} }
      else localStorage.setItem('planbook_alertSoundOn', snd);
      return 1; })()`);
    await reload();
  }
}
}
