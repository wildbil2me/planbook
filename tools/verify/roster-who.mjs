/* roster-who.mjs — a roster row's "also in" note sits under the name (WO-1.74)
 *
 * WHAT THIS SECTION OWNS. The shape of one roster row since the name and its note became a column:
 * that at the stock 480px panel a row for a student in three classes is the height of a row for a
 * student in one, the note under the name and ✎ · Edit · Remove on the name's line; that no row —
 * on the class's roster or under *Not in any class* — carries an empty `.roster-row-note`; that the
 * row's order is avatar, the name column, the support dot when there is one, the actions; that the
 * dot is still built only when supportsVisible() says so (absent, not hidden, under a projector);
 * and that a name in the column is a line tall rather than the 140px `.roster-row-name`'s own flex
 * would make it, read down a column (the work order's Traps line).
 *
 * WHAT IT LEAVES TO SECTIONS THAT ALREADY OWN IT. What the note SAYS is roster-contacts.mjs's (its
 * "also in" check reads the second class's roster); what the dot opens and everything else
 * presentation mode suppresses is support-details.mjs's; the 44px floor of the row's buttons is
 * touch-targets.mjs's. The days-off and events rows wear `.roster-row-name` and `.roster-row-note`
 * too and are not touched by WO-1.74 — attendance-passes.mjs and calendar-events.mjs read those.
 *
 * THE FIXTURE IS FOUR CLASSES AND FOUR STUDENTS OF ITS OWN, and the open-class and presentation
 * preferences — all put back at the foot, with the viewport, whatever happens above.
 */

export async function run(h) {
const { check, skip, send, evalJs, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam, openSettingsDoor } = h;

console.log('\n--- the roster row\'s note under the name (WO-1.74) ---');

if (!seam) {
  skip('a roster row\'s "also in" note sits under the name',
    'window.planbook is not on the page, so nothing here can seed a class or read the roster');
} else {
  /* English classes, per the owner. The open class is A; the other three exist so that one student
     can be "also in" two of them, which is the longest note this fixture writes. */
  const A = { id: 'c_wo174a', name: 'WO-1.74 English III' };
  const B = { id: 'c_wo174b', name: 'English IV' };
  const C = { id: 'c_wo174c', name: 'AP Literature' };
  const S = {
    one:   { id: 'wo174-one',   first: 'Pim',   last: 'Elsworth' },    // A only — no note
    three: { id: 'wo174-three', first: 'Talia', last: 'Dunmore' },     // A, B, C — "also in English IV, AP Literature"
    dot:   { id: 'wo174-dot',   first: 'Renée', last: 'Baptiste' },    // A, C, with a plan on file
    none:  { id: 'wo174-none',  first: 'Ivo',   last: 'Castellanos' }, // in no class — the orphan list
  };

  const pause = (ms) => new Promise(r => setTimeout(r, ms));
  const size = async (width, height) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
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

  /* Every row in both lists, in one round trip: its children's order by first class name, its box,
     the name column's parts and their boxes, and the actions' boxes. A row is keyed by the student
     id its Edit button carries, so a check names the student it is about rather than a position. */
  const READ = `(function(){
    function box(el){ if (!el) return null; var r = el.getBoundingClientRect();
      return { top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10,
        left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10,
        h: Math.round(r.height * 10) / 10 }; }
    function rowsIn(sel){ return Array.prototype.map.call(document.querySelectorAll(sel + ' .roster-row'), function(r){
      var idEl = r.querySelector('[data-student-edit],[data-student-delete],[data-student-add-to-class]');
      var id = idEl ? (idEl.getAttribute('data-student-edit') || idEl.getAttribute('data-student-delete')
        || idEl.getAttribute('data-student-add-to-class')) : '';
      var who = r.querySelector(':scope > .roster-row-who');
      var name = r.querySelector('.roster-row-name'), note = r.querySelector('.roster-row-note');
      var acts = r.querySelector(':scope > .roster-row-actions');
      return {
        id: id,
        order: Array.prototype.map.call(r.children, function(c){ return c.classList[0]; }),
        row: box(r), who: box(who), name: box(name), note: box(note),
        nameInWho: !!(who && name && name.parentNode === who),
        noteInWho: !!(note && who && note.parentNode === who),
        noteAfterName: !!(note && name && name.nextElementSibling === note),
        noteText: note ? note.textContent : null,
        emptyNotes: Array.prototype.filter.call(r.querySelectorAll('.roster-row-note'),
          function(n){ return !n.textContent.trim(); }).length,
        buttons: acts ? Array.prototype.map.call(acts.querySelectorAll('button'), function(b){
          return { t: b.textContent.trim(), b: box(b) }; }) : [],
        dots: r.querySelectorAll('.support-dot, [data-supports-open]').length,
        nameFlex: name ? getComputedStyle(name).flex : ''
      }; }); }
    return { panel: box(document.querySelector('#rosterModal .modal-panel')),
      roster: rowsIn('#rosterList'), orphans: rowsIn('#rosterOrphanList'),
      visible: window.planbook.supports.supportsVisible() }; })()`;
  const openRoster = async () => {
    await shut();
    await openSettingsDoor('[data-roster-manage]');
    await pause(200);
    return evalJs(READ);
  };
  const of = (r, id) => r.roster.find((x) => x.id === id) || r.orphans.find((x) => x.id === id) || null;
  /* "On the name's line": every action button's box sits within the name's vertical span's reach —
     its top above the name's bottom — and to the right of the name column, which is what a second
     flex line would break. */
  const onNameLine = (x) => x && x.buttons.length >= 3 && x.buttons.every((b) =>
    b.b.top < x.name.bottom && b.b.bottom > x.name.top && b.b.left >= x.who.right - 0.5);
  const stacked = (x) => x && x.note && x.nameInWho && x.noteInWho && x.noteAfterName
    && x.note.top >= x.name.bottom - 0.5 && Math.abs(x.note.left - x.name.left) <= 0.5;

  const before = await evalJs("({ open: localStorage.getItem('planbook_openClassId'),"
    + " pres: localStorage.getItem('planbook_presentationMode') })");

  try {
    await size(1280, 800);
    const plant = await evalJs(`(async function(){
      var p = window.planbook, s = p.store;
      if (!s.getDoc()) return { ok:false, why:'no year document is open' };
      var S = ${j(S)}, made = {};
      Object.keys(S).forEach(function(k){
        var st = p.roster.newStudent(S[k].first, S[k].last); st.id = S[k].id; made[k] = st; });
      made.dot.supports = Object.assign({}, made.dot.supports || {}, { plan: '504' });
      function cls(c, roster){ return { id:c.id, name:c.name, archived:false, roster:roster, letterScale:null,
        terms:[{ id:'tm_' + c.id, label:'WO-1.74 Term', start:'', end:'' }],
        categories:[{ id:'k_' + c.id, name:'Essays', weight:100 }] }; }
      s.update(function(doc){
        if (!Array.isArray(doc.classes)) doc.classes = [];
        if (!Array.isArray(doc.students)) doc.students = [];
        Object.keys(made).forEach(function(k){ doc.students.push(made[k]); });
        doc.classes.push(cls(${j(A)}, [S.one.id, S.three.id, S.dot.id]));
        doc.classes.push(cls(${j(B)}, [S.three.id]));
        doc.classes.push(cls(${j(C)}, [S.three.id, S.dot.id]));
      });
      await s.flush();
      return { ok:true, hasDot: p.supports.hasSupports(made.dot) }; })()`);
    if (!plant.ok) throw new Error('could not plant the classes: ' + plant.why);
    await reload();
    await enter();

    const r = await openRoster();
    const one = of(r, S.one.id), three = of(r, S.three.id), dot = of(r, S.dot.id), none = of(r, S.none.id);

    /* ══ Acceptance 1 — at 480px, three classes is one class's height, note under, actions on the line ══ */
    check('WO-1.74: at the stock 480px panel a roster row for a student in three classes is the height of '
      + 'a row for a student in one, with "also in" under the name and ✎ · Edit · Remove on the name\'s line',
      !!r.panel && Math.abs((r.panel.right - r.panel.left) - 480) <= 0.5
        && !!one && !!three && Math.abs(one.row.h - three.row.h) <= 0.5
        && three.noteText === 'also in ' + B.name + ', ' + C.name && stacked(three)
        && onNameLine(three) && onNameLine(one),
      'panel ' + (r.panel ? (r.panel.right - r.panel.left) : 'none') + 'px · one-class row ' + j(one && one.row.h)
        + 'px, three-class row ' + j(three && three.row.h) + 'px · three: name ' + j(three && three.name)
        + ', note ' + j(three && three.note) + ' ' + j(three && three.noteText) + ', buttons '
        + j(three && three.buttons));

    /* ══ Acceptance 2 — no empty note on either list ══ */
    const all = r.roster.concat(r.orphans);
    check('WO-1.74: no roster row carries an empty .roster-row-note — the one-class student\'s row has no '
      + 'note element at all, and neither does the *Not in any class* row of a student on no roster',
      all.length >= 4 && all.every((x) => x.emptyNotes === 0)
        && !!one && one.note === null && !!none && none.note === null && r.orphans.some((x) => x.id === S.none.id),
      all.map((x) => x.id + ': ' + j(x.noteText) + ' (' + x.emptyNotes + ' empty)').join(' · '));

    /* ══ The order, and the Traps line about the dot ══ */
    check('WO-1.74: every row reads avatar, the name column, the support dot only where a plan is on file, '
      + 'then the actions — on the roster and under *Not in any class*',
      plant.hasDot && !!dot && j(dot.order) === j(['avatar', 'roster-row-who', 'support-dot', 'roster-row-actions'])
        && stacked(dot) && dot.dots === 1
        && all.filter((x) => x.id !== S.dot.id).every((x) =>
          j(x.order) === j(['avatar', 'roster-row-who', 'roster-row-actions']) && x.nameInWho && x.dots === 0),
      all.map((x) => x.id + ': ' + j(x.order)).join(' · '));

    /* The Traps line's other half. `.roster-row-who > *` is what keeps `.roster-row-name`'s own
       `flex: 1 1 140px` from being read down the column; with that rule gone the name is 140px tall,
       and every row is. The shipped rule is asserted as unedited beside it. */
    check('WO-1.74: inside the column the name takes no flex and is a line tall, not 140px — and '
      + '`.roster-row-name`\'s own rule still reads 1 1 140px everywhere it is not in a column',
      all.every((x) => x.nameFlex === '0 0 auto' && x.name.h < 30)
        && await evalJs(`(function(){ var s = document.createElement('span'); s.className = 'roster-row-name';
          document.body.appendChild(s); var f = getComputedStyle(s).flex; s.remove(); return f === '1 1 140px'; })()`),
      all.map((x) => x.id + ': flex ' + j(x.nameFlex) + ', ' + x.name.h + 'px').join(' · '));

    /* ══ Presentation mode — the dot is not built, and the row keeps its shape ══ */
    await shut();
    await clickSel('header [data-presentation-toggle]');
    await pause(200);
    const p = await openRoster();
    const pDot = of(p, S.dot.id), pThree = of(p, S.three.id), pOne = of(p, S.one.id);
    check('WO-1.74: under presentation mode the support dot is absent from the row\'s DOM, not hidden in '
      + 'it, and the row reads avatar, the name column, the actions — note still under the name',
      p.visible === false && !!pDot && pDot.dots === 0
        && j(pDot.order) === j(['avatar', 'roster-row-who', 'roster-row-actions']) && stacked(pDot)
        && !!pThree && !!pOne && Math.abs(pThree.row.h - pOne.row.h) <= 0.5,
      'supportsVisible() ' + p.visible + ' · dot row ' + j(pDot && pDot.order) + ', dots ' + j(pDot && pDot.dots)
        + ', note under the name ' + j(stacked(pDot)) + ' · one-class row ' + j(pOne && pOne.row.h)
        + 'px, three-class row ' + j(pThree && pThree.row.h) + 'px');
  } finally {
    await shut();
    await size(1280, 800);
    await evalJs(`(async function(){
      var s = window.planbook.store;
      var ids = ${j(Object.keys(S).map((k) => S[k].id))}, cids = ${j([A.id, B.id, C.id])};
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
