/* dialog-kinds.mjs — every dialog is the kind the owner ruled, and the kind is its width (WO-1.77)
 *
 * WHAT THIS SECTION OWNS. The rule in design/style-guide.md § 5: every `.modal-panel` wears exactly
 * one of `modal-confirm` (480), `modal-form` (640) and `modal-report` (900), the kind the owner ruled
 * for it on 2026-10-11 — the table is RULED below, copied from the work order — and measures that
 * kind's width, or its named override's (the Grade sheet's `.grades-report-panel`, 980, the only
 * one), in a 1280px window under a fine pointer and on an iPad lying down under a coarse one; at
 * 390×844 none is wider than 95vw or scrolls sideways. And the fallback: a panel stripped of its kind
 * draws at `.modal-panel`'s own 480, so a forgotten class lands on the narrowest width.
 *
 * THE RULE IS ASKED THREE WAYS, because each can be fooled where the others cannot.
 *   · Of index.html's SOURCE, read off disk — the file a person edits, before any script runs.
 *   · Of the LIVE DOCUMENT, every `.modal-panel` in it — which also sees a panel some module built
 *     after boot. There is none today (About, which the brief took for one, is in index.html; the
 *     one in src/modal.js is a doc comment), so that half is a fence for the first one, not a
 *     reading of an existing one. A MutationObserver installed at this section's head also records
 *     any panel added while the section drives its doors, so a dialog built on open and removed on
 *     close is held to the rule too.
 *   · By MEASUREMENT: every panel cloned into a hidden holder and read, which is sound because every
 *     width rule on a panel is keyed to the panel's own classes (the two `#…Modal .modal-panel`
 *     rules are print-only) — WO-1.76's method. And through REAL DOORS for the eight dialogs a
 *     fixture of one class, one student and one assignment can reach: About, Settings, Classes and
 *     terms, Your details, the roster, Edit student and Paste a list over it, and the assignment
 *     editor — the last on the planted assignment's edit door, because + New writes one.
 *
 * MOVED HERE FROM roster-width.mjs. That section's Acceptance 3 — "every stock `.modal-panel`
 * measures 480", through the five doors and across the document — became false on purpose at
 * WO-1.77, when 480 stopped being every dialog's width and became the confirm's. Its door walk and
 * its clone sweep are the two measurements below, now held against the ruled kind rather than 480.
 *
 * WHAT IT LEAVES TO SECTIONS THAT ALREADY OWN IT. The roster's own row at 640 is roster-width.mjs's;
 * Record, Passes, Keys and the history dialog through their real doors are attendance-history.mjs's;
 * the Grade sheet's width and its print box are grade-sheet.mjs's; Duplicate's fold on both sides of
 * the 920 window is copy-class.mjs's.
 *
 * It also prints, on `MEASURE |` lines and asserting nothing, how much of each door's content width
 * its fields use — the work order's last Traps line asks for a field that leaves the room unused to
 * be REPORTED rather than restyled, and a reading is the honest form of that.
 *
 * THE FIXTURE IS ONE CLASS, ONE STUDENT AND ONE ASSIGNMENT OF ITS OWN, and the open-class preference — all put back at
 * the foot, with the viewport, touch and the observer, whatever happens above.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
const { ROOT, check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam, openSettingsDoor } = h;

console.log('\n--- every dialog is the kind it was ruled (WO-1.77) ---');

/* The owner's table, 2026-10-11, every row. A dialog added later is added here with its ruling, or
   the live-document check below fails naming it — which is the point: a dialog nobody classified is
   a dialog a teacher finds too narrow. */
const RULED = {
  'modal-form': ['assignmentModal', 'aboutModal', 'outreachModal', 'settingsModal', 'yearModal',
    'classesModal', 'termsModal', 'categoriesModal', 'letterScaleModal', 'signalsModal',
    'rosterPasteModal', 'rosterImportModal', 'studentModal', 'daysOffModal', 'eventsModal',
    'signalCardModal', 'attendanceHistoryModal', 'logSheetModal', 'backupModal',
    'rosterModal', 'attendanceKeysModal',
    /* WO-3.61, the owner's ruling 1 of 2026-10-11: the score grid's keys, Attendance's twin. */
    'scoresKeysModal'],
  'modal-confirm': ['classDeleteModal', 'categoryRemoveModal', 'outreachConfirmModal',
    'assignmentMoveModal', 'holdModal', 'assignmentDeleteModal', 'studentDeleteModal',
    'restoreConfirmModal', 'daysOffConfirmModal', 'teacherModal', 'drivePullModal',
    'drivePullConfirmModal', 'gradingModeModal',
    /* WO-3.73, the owner's answer to the drawing's question 3 (2026-10-23): Record Q1 grades is a
       stock 480px confirm, its twenty-five rows scrolling inside the box. */
    'termRecordModal'],
  'modal-report': ['attendanceRecordModal', 'passHistoryModal', 'assignmentCopyModal', 'gradesRecordModal'],
};
const KINDS = Object.keys(RULED);
const WIDTH = { 'modal-confirm': 480, 'modal-form': 640, 'modal-report': 900 };
/* The one override, and the only place its number is written in this file. */
const OVERRIDE = { gradesRecordModal: { cls: 'grades-report-panel', width: 980 } };
const kindOf = {};
KINDS.forEach((k) => RULED[k].forEach((id) => { kindOf[id] = k; }));
const want = (id) => (OVERRIDE[id] ? OVERRIDE[id].width : WIDTH[kindOf[id]]);
const j = (x) => JSON.stringify(x);

/* ══ Acceptance 1 and 2, of the SOURCE — no browser needed ══
   Every `class="…modal-panel…"` attribute in index.html, its kinds counted. Read off disk, so a panel
   with no kind or two fails here whatever any script does to the class list afterwards. */
const src = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
const srcPanels = [...src.matchAll(/class="([^"]*\bmodal-panel\b[^"]*)"/g)].map((m, i) => {
  const classes = m[1].split(/\s+/).filter(Boolean);
  const before = src.slice(0, m.index);
  const owner = [...before.matchAll(/id="([A-Za-z]+Modal)"/g)].pop();
  return { at: i, overlay: owner ? owner[1] : '?', kinds: classes.filter((c) => KINDS.includes(c)) };
});
const srcBad = srcPanels.filter((p) => p.kinds.length !== 1);
check('WO-1.77: every `.modal-panel` in index.html\'s source carries exactly one of modal-confirm, '
  + 'modal-form and modal-report — none with no kind, none with two',
  srcPanels.length >= 38 && srcBad.length === 0,
  srcPanels.length + ' panels in the source · '
    + (srcBad.length ? 'WRONG: ' + j(srcBad.map((p) => ({ overlay: p.overlay, kinds: p.kinds })))
      : 'every one wears exactly one kind'));

if (!seam) {
  skip('every dialog is the kind it was ruled, measured in the page',
    'window.planbook is not on the page, so nothing here can seed a class or open a door');
} else {
  const C = { id: 'c_wo177', name: 'WO-1.77 English I' };
  const S = { id: 'wo177-s1', first: 'Wren', last: 'Abernathy-Coe', nickname: '' };
  const A = 'a_wo177';

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
    await clickSel('#homeGrid [data-class-tab="' + C.id + '"]');
    await pause(250);
  };
  const reload = async () => {
    await send('Page.reload');
    await pause(600);
    await waitForBoot();
    await evalJs(KILL_ANIM);
  };

  /* Every panel in the live document: whose it is, its kinds, and — cloned into a hidden holder — its
     width as worn, its width with every class but `.modal-panel` taken off (the fallback), and
     whether its own content scrolls sideways at that width. One round trip. */
  const CENSUS = `(function(){
    var KINDS = ${j(KINDS)};
    var hold = document.createElement('div');
    hold.style.cssText = 'position:fixed;left:0;top:0;width:100vw;visibility:hidden;pointer-events:none';
    document.body.appendChild(hold);
    function measure(p, strip){
      var c = p.cloneNode(true); c.removeAttribute('id'); c.setAttribute('data-wo177-clone', '');
      Array.prototype.forEach.call(c.querySelectorAll('[id]'), function(e){ e.removeAttribute('id'); });
      if (strip) c.className = 'modal-panel';
      hold.appendChild(c);
      var out = { w: c.offsetWidth, side: c.scrollWidth - c.clientWidth };
      c.remove(); return out; }
    var panels = Array.prototype.map.call(document.querySelectorAll('.modal-panel'), function(p){
      var o = p.closest('.modal-overlay');
      var worn = measure(p, false), bare = measure(p, true);
      return { overlay: o ? o.id : '(no overlay)',
        kinds: Array.prototype.filter.call(p.classList, function(c){ return KINDS.indexOf(c) >= 0; }),
        classes: Array.prototype.slice.call(p.classList),
        w: worn.w, side: worn.side, bare: bare.w };
    });
    hold.remove();
    return { vw: window.innerWidth, coarse: matchMedia('(pointer: coarse)').matches, panels: panels }; })()`;
  const census = () => evalJs(CENSUS);

  /* The doors. Each is opened for real, measured as it stands — the panel, and the page's, the
     overlay's, the panel's and the body's sideways scroll — and shut. */
  const READ_OPEN = (id) => `(function(){ var m = document.getElementById(${j(id)});
    if (!m || m.classList.contains('hidden')) return { open: false };
    var p = m.querySelector('.modal-panel'), b = p && p.querySelector('.modal-body');
    var room = null;
    if (b) { var bs = getComputedStyle(b), br = b.getBoundingClientRect();
      var left = br.left + parseFloat(bs.paddingLeft), right = br.right - parseFloat(bs.paddingRight);
      var fs = Array.prototype.filter.call(b.querySelectorAll('input, select, textarea'), function(f){
        return f.type !== 'checkbox' && f.type !== 'radio' && f.type !== 'hidden' && f.offsetWidth > 0; });
      room = { content: Math.round(right - left), fields: fs.length,
        widest: fs.length ? Math.round(Math.max.apply(null, fs.map(function(f){ return f.getBoundingClientRect().width; }))) : 0,
        unusedRight: fs.length ? Math.round(right - Math.max.apply(null, fs.map(function(f){ return f.getBoundingClientRect().right; }))) : null }; }
    return { open: true, w: p ? p.offsetWidth : -1, room: room,
      side: [document.documentElement.scrollWidth - document.documentElement.clientWidth,
        m.scrollWidth - m.clientWidth, p ? p.scrollWidth - p.clientWidth : -1,
        b ? b.scrollWidth - b.clientWidth : -1] }; })()`;
  const viaDoors = async () => {
    const out = {};
    const take = async (id) => { out[id] = await evalJs(READ_OPEN(id)); };
    await shut(); await clickSel('#aboutBtn'); await pause(150); await take('aboutModal');
    await shut(); await clickSel('#settingsBtn'); await pause(150); await take('settingsModal');
    await shut(); await openSettingsDoor('[data-class-manage]'); await pause(150); await take('classesModal');
    await shut(); await openSettingsDoor('[data-teacher-panel]'); await pause(150); await take('teacherModal');
    await shut(); await openSettingsDoor('[data-roster-manage]'); await pause(150); await take('rosterModal');
    await clickSel('#rosterModal [data-student-edit="' + S.id + '"]'); await pause(150); await take('studentModal');
    await shut(); await openSettingsDoor('[data-roster-manage]'); await pause(150);
    await clickSel('#rosterModal [data-roster-paste]'); await pause(150); await take('rosterPasteModal');
    /* The assignment editor, on the planted assignment's own edit door — not + New, which writes.
       The way there is the element's own click() rather than a click at its coordinates: at 390×844
       the class screen's switcher and the row's buttons are laid out for a phone, and where a
       coordinate lands there is that layout's question, not this section's. The handler is the
       real one either way. */
    await shut();
    const tap = (sel) => evalJs(`(function(){ var e = document.querySelector(${j(sel)});
      if (!e) return false; e.click(); return true; })()`);
    if ((await onView()) !== 'assignmentsView') {
      await tap('#homeGrid [data-class-tab="' + C.id + '"]'); await pause(250);
      await tap('#classView [data-class-screen="assignments"]'); await pause(250);
    }
    await tap('#assignmentsView [data-assignment-edit="' + A + '"]'); await pause(200);
    await take('assignmentModal');
    /* And home again, so the next reading — a census, or the next window's doors — is taken over the
       home screen rather than over the assignments screen, whose own width is not this section's. */
    await shut();
    await clickVisible('[data-view-home]'); await pause(150);
    return out;
  };
  const DOORS = 8;
  const doorsAt = (o, cap) => Object.keys(o).length === DOORS && Object.keys(o).every((id) =>
    o[id].open && Math.abs(o[id].w - Math.min(want(id), cap)) <= 1);
  const doorsSaid = (o) => Object.keys(o).map((id) => id + ' ' + (o[id].open ? o[id].w + 'px'
    + (o[id].w === want(id) ? '' : ' (ruled ' + want(id) + ')') : 'NOT OPEN')).join(' · ');

  const before = await evalJs("({ open: localStorage.getItem('planbook_openClassId') })");

  try {
    await size(1280, 800, false);
    const plant = await evalJs(`(async function(){
      var p = window.planbook, s = p.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      var S = ${j(S)}, st = p.roster.newStudent(S.first, S.last); st.id = S.id; st.nickname = S.nickname;
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        if (!Array.isArray(doc.students)) doc.students = [];
        doc.students.push(st);
        doc.classes.push({ id:${j(C.id)}, name:${j(C.name)}, archived:false, roster:[S.id], letterScale:null,
          terms:[{ id:'tm_wo177', label:'WO-1.77 Term', start:'', end:'' }],
          categories:[{ id:'k_wo177', name:'Essays', weight:100 }] });
        if (!Array.isArray(doc.assignments)) doc.assignments = [];
        doc.assignments.push({ id:${j(A)}, classId:${j(C.id)}, termId:'tm_wo177', categoryId:'k_wo177',
          name:'WO-1.77 Personal essay', points:50, assigned:'', due:'' });
      });
      await s.flush();
      return { ok:true }; })()`);
    if (!plant.ok) throw new Error('could not plant the class: ' + plant.why);
    await reload();
    /* Panels added to the document from here on — a dialog some module builds at runtime. Installed
       after the reload, which would drop it with the page, and before anything is opened. */
    await evalJs(`(function(){
      window.__wo177Built = [];
      window.__wo177Obs = new MutationObserver(function(rs){ rs.forEach(function(r){
        Array.prototype.forEach.call(r.addedNodes, function(n){
          if (n.nodeType !== 1) return;
          var found = n.matches && n.matches('.modal-panel') ? [n] : [];
          if (n.querySelectorAll) found = found.concat(Array.prototype.slice.call(n.querySelectorAll('.modal-panel')));
          /* This section's own clones are measured and removed again; they are not dialogs. */
        found = found.filter(function(p){ return !p.hasAttribute('data-wo177-clone'); });
        found.forEach(function(p){ var o = p.closest('.modal-overlay');
            window.__wo177Built.push({ overlay: o ? o.id : '(no overlay)',
              classes: Array.prototype.slice.call(p.classList) }); });
        }); }); });
      window.__wo177Obs.observe(document.body, { childList: true, subtree: true });
      return 1; })()`);
    await enter();

    /* ══ Acceptance 1 and 2, of the LIVE DOCUMENT — one kind each, and the one the owner ruled ══ */
    const wide = await census();
    const domBad = wide.panels.filter((p) => p.kinds.length !== 1);
    check('WO-1.77: every `.modal-panel` in the live document carries exactly one kind — none with no '
      + 'kind, none with two — and as many panels are in the page as in index.html\'s source',
      wide.panels.length === srcPanels.length && domBad.length === 0,
      wide.panels.length + ' in the page, ' + srcPanels.length + ' in the source · '
        + (domBad.length ? 'WRONG: ' + j(domBad.map((p) => ({ overlay: p.overlay, kinds: p.kinds }))) : 'one kind each'));
    const unruled = wide.panels.filter((p) => !kindOf[p.overlay] || p.kinds.length !== 1 || p.kinds[0] !== kindOf[p.overlay]);
    const missing = Object.keys(kindOf).filter((id) => !wide.panels.some((p) => p.overlay === id));
    check('WO-1.77: every dialog wears the kind the owner ruled on 2026-10-11 — '
      + RULED['modal-form'].length + ' forms, ' + RULED['modal-confirm'].length + ' confirms, '
      + RULED['modal-report'].length + ' reports — and no dialog is in the page that the table does not rule',
      unruled.length === 0 && missing.length === 0,
      (unruled.length ? 'not as ruled: ' + j(unruled.map((p) => ({ overlay: p.overlay, wears: p.kinds,
        ruled: kindOf[p.overlay] || 'NOT IN THE TABLE' }))) + ' · ' : '')
        + (missing.length ? 'ruled but not in the page: ' + j(missing)
          : unruled.length ? 'every ruled dialog is in the page' : 'all ' + Object.keys(kindOf).length + ' as ruled'));

    /* ══ Acceptance 1 — each measures its kind's width, or its override's ══ */
    const offWidth = (c, cap) => c.panels.filter((p) => !kindOf[p.overlay]
      || Math.abs(p.w - Math.min(want(p.overlay), cap)) > 1);
    const widthSaid = (c) => 'vw ' + c.vw + ', coarse ' + c.coarse + ' · ' + KINDS.map((k) =>
      k + ' ' + j(c.panels.filter((p) => p.kinds[0] === k).map((p) => p.w)
        .filter((w, i, a) => a.indexOf(w) === i))).join(' · ');
    const wideOff = offWidth(wide, Infinity);
    check('WO-1.77: in a 1280px window under a fine pointer every dialog measures its kind — confirm 480, '
      + 'form 640, report 900 — and the Grade sheet its override, 980',
      wide.vw === 1280 && wide.coarse === false && wideOff.length === 0,
      widthSaid(wide) + (wideOff.length ? ' · OFF: ' + j(wideOff.map((p) => ({ overlay: p.overlay,
        w: p.w, ruled: kindOf[p.overlay] ? want(p.overlay) : 'none' }))) : ''));

    /* ══ Acceptance 2's last clause, standing — a panel with its class removed draws at 480 ══ */
    const notBare = (c) => c.panels.filter((p) => p.bare !== 480);
    check('WO-1.77: the fallback — every panel with its kind (and the override) taken off measures '
      + '`.modal-panel`\'s own 480 in a 1280px window, so a forgotten class lands on the narrowest width',
      notBare(wide).length === 0,
      notBare(wide).length ? 'NOT 480 BARE: ' + j(notBare(wide).map((p) => ({ overlay: p.overlay, bare: p.bare })))
        : wide.panels.length + ' panels, every one 480 bare');

    /* ══ The doors, at 1280 — moved from roster-width.mjs's Acceptance 3 ══ */
    const laptopDoors = await viaDoors();
    check('WO-1.77: through their real doors in a 1280px window — About, Settings, Classes and terms, '
      + 'Roster, Edit student, Paste a list and the assignment editor at 640, Your details at 480 — each '
      + 'dialog measures its ruled kind',
      doorsAt(laptopDoors, Infinity), doorsSaid(laptopDoors));
    /* Whether a form's FIELDS use the room the kind gave it — printed, not ruled on. The work order's
       last Traps line: a 640 panel whose fields stayed at 480's widths has not fixed anything, and a
       field that does not use the room is reported, not restyled here. `unusedRight` is the gap
       between the right-most field and the body's content edge; a whole-width field reads 0. */
    Object.keys(laptopDoors).forEach((id) => { const r = laptopDoors[id].room;
      console.log('  MEASURE | WO-1.77 fields at ' + laptopDoors[id].w + 'px, ' + id + ': '
        + (!r ? 'no body' : 'content ' + r.content + 'px · ' + r.fields + ' field(s) · widest '
          + r.widest + 'px · right-most field ends ' + (r.unusedRight === null ? '—' : r.unusedRight + 'px') + ' short of the content edge')); });

    /* ══ Acceptance 1, the iPad lying down — the coarse block restates every kind ══ */
    await size(1194, 834, true);
    const lying = await census();
    const lyingOff = offWidth(lying, Infinity);
    check('WO-1.77: on an iPad lying down (1194×834) under a coarse pointer every dialog measures its kind, '
      + 'the Grade sheet its override, and every panel bare measures 480',
      lying.vw === 1194 && lying.coarse === true && lyingOff.length === 0 && notBare(lying).length === 0,
      widthSaid(lying) + (lyingOff.length ? ' · OFF: ' + j(lyingOff.map((p) => ({ overlay: p.overlay, w: p.w,
        ruled: kindOf[p.overlay] ? want(p.overlay) : 'none' }))) : '')
        + (notBare(lying).length ? ' · NOT 480 BARE: ' + j(notBare(lying).map((p) => p.overlay)) : ''));
    const ipadDoors = await viaDoors();
    check('WO-1.77: and on the iPad lying down the same eight doors open on their ruled kinds',
      doorsAt(ipadDoors, Infinity), doorsSaid(ipadDoors));

    /* ══ Acceptance 1, the phone — nothing wider than 95vw, nothing scrolling sideways ══ */
    await size(390, 844, true);
    const phone = await census();
    const cap = 390 * 0.95;
    const phoneOff = phone.panels.filter((p) => p.w > cap + 0.5 || p.side > 0);
    check('WO-1.77: at 390×844 under a coarse pointer no dialog is wider than 95vw (370.5px) and none '
      + 'scrolls sideways inside its own panel — the (max-width: 640px) block still wins over every kind '
      + 'and over the Grade sheet\'s override',
      phone.vw === 390 && phone.panels.length === srcPanels.length && phoneOff.length === 0,
      'widths ' + j(phone.panels.map((p) => p.w).filter((w, i, a) => a.indexOf(w) === i))
        + (phoneOff.length ? ' · OFF: ' + j(phoneOff.map((p) => ({ overlay: p.overlay, w: p.w, side: p.side }))) : ''));
    const phoneDoors = await viaDoors();
    /* The assignment editor is the one door opened over a screen other than home — the assignments
       screen — so the PAGE's sideways scroll under it is that screen's width, not the dialog's, and is
       printed rather than asserted here. The dialog's own three (overlay, panel, body) are asserted
       for all eight, and the page's for the seven opened over home. */
    const overScreen = { assignmentModal: true };
    check('WO-1.77: and through the eight doors at 390×844 each dialog is no wider than 95vw and nothing in '
      + 'it — overlay, panel or body — scrolls sideways, nor the page under the seven opened over home',
      Object.keys(phoneDoors).length === DOORS && Object.keys(phoneDoors).every((id) => phoneDoors[id].open
        && phoneDoors[id].w > 0 && phoneDoors[id].w <= cap + 0.5
        && phoneDoors[id].side.every((s, i) => s <= 0 || (i === 0 && overScreen[id]))),
      Object.keys(phoneDoors).map((id) => id + ' ' + phoneDoors[id].w + 'px sideways '
        + j(phoneDoors[id].side)).join(' · '));
    console.log('  MEASURE | WO-1.77 at 390×844 the page under the assignment editor scrolls sideways by '
      + (phoneDoors.assignmentModal && phoneDoors.assignmentModal.side ? phoneDoors.assignmentModal.side[0] : '— (not open)')
      + 'px — the assignments screen\'s own width, not the dialog\'s; reported, not ruled on here');

    /* ══ A dialog built at runtime is held to the same rule ══ */
    const built = await evalJs('window.__wo177Built || null');
    const builtBad = (built || []).filter((b) => b.classes.filter((c) => KINDS.includes(c)).length !== 1);
    check('WO-1.77: every `.modal-panel` added to the document while this section drove its doors carries '
      + 'exactly one kind — a dialog built at runtime is held to the rule index.html is',
      Array.isArray(built) && builtBad.length === 0,
      !Array.isArray(built) ? 'the observer was not installed'
        : built.length === 0 ? 'none was built at runtime today: every panel is in index.html, and the live-document check above held all of them'
          : built.length + ' built · ' + (builtBad.length ? 'WRONG: ' + j(builtBad) : 'one kind each'));
  } finally {
    await shut();
    await size(1280, 800, false);
    await evalJs(`(async function(){
      if (window.__wo177Obs) { window.__wo177Obs.disconnect(); delete window.__wo177Obs; }
      delete window.__wo177Built;
      var s = window.planbook.store;
      if (s.getDoc()) {
        s.update(function(doc){
          doc.classes = (doc.classes || []).filter(function(c){ return c.id !== ${j(C.id)}; });
          doc.students = (doc.students || []).filter(function(x){ return x.id !== ${j(S.id)}; });
          doc.assignments = (doc.assignments || []).filter(function(a){ return a.id !== ${j(A)}; });
        });
        await s.flush();
      }
      var b = ${j(before)};
      if (b.open === null) { try { localStorage.removeItem('planbook_openClassId'); } catch (e) {} }
      else localStorage.setItem('planbook_openClassId', b.open);
      return 1; })()`);
    await reload();
  }
}
}
