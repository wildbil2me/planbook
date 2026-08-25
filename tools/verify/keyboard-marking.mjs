/* keyboard-marking.mjs — marking a class from the keyboard (WO-2.5)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, seam } = h;

/* ───────────────── marking a class from the keyboard (WO-2.5) ─────────────────
 *
 * ON A FINE POINTER, ON PURPOSE. Everything below runs before the coarse block resets the device
 * metrics, because the keyboard path is the LAPTOP's — since 2026-08-08 that is the device of
 * record, and this is how a live class gets marked while it walks in.
 *
 * THE CLAIM IS NOT "THE KEYS WORK", IT IS "ONE KEYSTROKE PER STUDENT". So the walk below dispatches
 * exactly one ArrowDown and then exactly one letter per student — nothing else, no clicks between
 * them, no arrow to move on — and then compares the whole `marks` object against what those
 * keystrokes should have produced. A build where a letter marked but did not advance would pass a
 * check that pressed ↓ between letters, and it would fail the term.
 *
 * THREE OF THESE ASSERT AN ABSENCE, and each one is the failure the feature exists to prevent:
 * a letter with nothing selected writes nothing, a letter typed into the search box writes nothing,
 * and a letter with a dialog open writes nothing. Each is answered by `doc.attendance` serialised
 * BYTE FOR BYTE either side of the keystroke, the same posture the WO-2.3 block below uses, because
 * a count is kept honest by an overwrite and the defect here is a mark landing on the wrong student.
 *
 * THE CLASS IS PICKED RATHER THAN ASSUMED — the biggest roster, the way the coarse sweep below
 * picks one, because "a full class" is the acceptance line and a walk down four names would prove
 * nothing about a room of thirty. Marking every student is also what makes the comparison exact:
 * whatever was on the day before, the keys overwrite all of it.
 *
 * AND THE TWO OPEN HALL PASSES ARE STEPPED AROUND RATHER THAN CLOSED. That same class is the one
 * the pass section hands on with two students out, on purpose, so that the coarse sweep measures
 * the banner card and both shapes of the Passes column. A `D` closes an open pass
 * (src/attendance.js's setMark), so the two students who are out get `E` where the pattern would
 * have said `D` — and `openPasses` is compared byte for byte across the whole walk afterwards,
 * which turns "this section did not take the next one's fixture away" from a hope into a check.
 */

console.log('\n--- marking a class from the keyboard (WO-2.5) ---');

if (!seam) {
  skip('a full class is marked from the keyboard, one keystroke per student',
    'the window.planbook seam is not present, so nothing here could read what was written');
} else {
  /* One key, dispatched AT THE PAGE rather than at an element, which is most of the claim. A
     printable key needs `keyDown` with `text` or `e.key` arrives as the raw code; the arrows and
     Escape use the `rawKeyDown` shape the modal section above already uses. */
  const kb = async (k, code, vk, text, mods = 0) => {
    const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
      modifiers: mods };
    if (text) ev.text = text;
    await send('Input.dispatchKeyEvent',
      Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
    await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
    await new Promise(r => setTimeout(r, 55));
  };
  const kbDown = () => kb('ArrowDown', 'ArrowDown', 40);
  const kbUp = () => kb('ArrowUp', 'ArrowUp', 38);
  const kbEsc = () => kb('Escape', 'Escape', 27);
  const kbLetter = (L) => kb(L, 'Key' + L, L.charCodeAt(0), L);

  /* Flushed before every read, for tools/README.md trap 6: every save is debounced, so a read taken
     a moment after a keystroke can be looking at the document from before it. */
  const kbAtt = () => evalJs('(async function(){ await window.planbook.store.flush();'
    + ' return JSON.stringify(window.planbook.store.getDoc().attendance); })()');
  const kbRows = () => evalJs("Array.prototype.slice.call("
    + "document.querySelectorAll('#attendanceBody tr[data-attendance-row]'))"
    + ".map(function(tr){ return tr.getAttribute('data-attendance-row'); })");
  /* A letter that would CHANGE the selected student's cell, read off the document rather than
     assumed. The three "this keystroke writes nothing" checks below are answered by comparing
     `doc.attendance` either side, and setMark() refuses a no-op — so a letter that happens to be
     the mark already on that cell would leave the document byte-identical whether the guard is
     there or not. Proved the honest way: two of those three checks passed against a build with the
     guard removed until this helper existed. */
  const kbChangingLetter = async () => evalJs(`(function(){
    var id = window.planbook.attendance.selectedStudent();
    if (!id) return 'A';
    var doc = window.planbook.store.getDoc();
    var cls = window.planbook.classes.getSelectedClassId();
    var day = window.planbook.attendance.todayISO();
    var rec = (doc.attendance || []).filter(function(r){
      return r.classId === cls && r.date === day; })[0];
    var cell = rec && rec.marks ? rec.marks[id] : null;
    var code = cell && cell.code ? cell.code : 'P';
    return code === 'A' ? 'E' : 'A'; })()`);
  /* Where the browser's focus actually is, said in the terms acceptance line 3 is written in.
     `:focus-visible` is asked of the element rather than inferred from a stylesheet rule, because
     the rule being present and the ring being drawn are two different facts — and it is the second
     one the style guide's global rule is about. */
  const kbFocus = () => evalJs(`(function(){ var a = document.activeElement;
    if (!a || a === document.body) return { on: 'body' };
    return { on: a.tagName + '.' + (a.className || ''),
             student: a.getAttribute ? (a.getAttribute('data-attendance-cell') || '') : '',
             date: a.getAttribute ? (a.getAttribute('data-attendance-date') || '') : '',
             ring: a.matches ? a.matches(':focus-visible') : null,
             outline: getComputedStyle(a).outlineWidth + ' ' + getComputedStyle(a).outlineColor };
    })()`);

  await evalJs("window.planbook.closeModal('attendanceKeysModal');1");
  const kbPick = await evalJs(`(function(){
    var doc = window.planbook.store.getDoc();
    var best = null, n = -1;
    doc.classes.filter(function(c){ return !c.archived; }).forEach(function(c){
      var len = c.roster ? c.roster.length : 0;
      if (len > n) { n = len; best = c; } });
    if (!best) return null;
    return { id: best.id, name: best.name, students: n,
             out: (doc.openPasses || []).filter(function(p){ return p && p.classId === best.id; })
               .map(function(p){ return p.studentId; }) }; })()`);

  if (!kbPick || kbPick.students < 20) {
    check('a class with a roster worth walking down was found for the keyboard pass', false,
      'picked = ' + JSON.stringify(kbPick) + ' — under twenty students is not "a full class", and '
        + 'a short walk would not tell an advancing selection from a stationary one');
  } else {
    /*
      ── AND THE GRID IS REACHED WITHOUT A MOUSE EITHER ──

      "Without touching the mouse" has to include getting to the class, or the acceptance line is
      only about the half of the job that happens once you are already there. So the harness puts
      itself on the home screen — the screen a teacher opens the app to, and the only pointer event
      in this section — and from there Tab walks to the class and Enter opens it.

      Tabbed to BY ID rather than to the first card that comes along: the class this section wants
      is the one with the biggest roster, and it is not necessarily the first in the grid.
    */
    if (await has('#classTabBar [data-view-home]')) await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));
    await evalJs('(function(){ var a = document.activeElement;'
      + ' if (a && a.blur) a.blur(); return 1; })()');
    let kbHops = 0;
    let kbOn = '';
    while (kbHops < 60 && kbOn !== kbPick.id) {
      await kb('Tab', 'Tab', 9);
      kbHops++;
      kbOn = await evalJs("(function(){ var a = document.activeElement;"
        + " return a && a.getAttribute ? (a.getAttribute('data-class-tab') || '') : ''; })()");
    }
    await kb('Enter', 'Enter', 13, '\r');
    await new Promise(r => setTimeout(r, 300));
    const kbArrived = await evalJs("(function(){ var v = document.getElementById('classView');"
      + " return { up: !!v && !v.classList.contains('hidden'),"
      + " cls: window.planbook.classes.getSelectedClassId(),"
      + " cells: document.querySelectorAll('#attendanceBody [data-attendance-cell]').length }; })()");
    check('the grid is reached without a mouse too — Tab lands on the class and Enter opens it, '
      + 'which is the half of "without touching the mouse" that happens before any marking',
      kbOn === kbPick.id && kbArrived.up === true && kbArrived.cls === kbPick.id
        && kbArrived.cells >= 20,
      kbHops + ' Tab(s) to reach ' + kbPick.name + ' (landed on ' + JSON.stringify(kbOn)
        + '), then Enter: ' + JSON.stringify(kbArrived));

    /*
      ── THE THIRD DELIVERABLE, WHICH WAS ALREADY MET AND HAD NOTHING WATCHING IT ──

      "Screen-reader labels on the mark buttons — an icon-only `A` button needs `aria-label` and
      `title`." WO-2.1 wrote both on every cell and every column head, so this work order added no
      labels; what it adds is the check, because a deliverable with no fixture behind it is a
      deliverable the next refactor can quietly undo. Asked of the whole class view rather than of
      the cells, and in the deliverable's own terms: every button needs an accessible name, and a
      button whose visible text is one glyph needs BOTH — the name for a screen reader and the
      tooltip for a teacher on a laptop who cannot guess what 🚫 does.
    */
    const kbLabels = await evalJs(`(function(){
      var out = { total: 0, iconOnly: 0, nameless: [], untitled: [] };
      Array.prototype.slice.call(document.querySelectorAll('#classView button'))
        .filter(function(b){ var r = b.getBoundingClientRect(); return r.width || r.height; })
        .forEach(function(b){
          out.total++;
          var text = (b.textContent || '').trim();
          var label = (b.getAttribute('aria-label') || '').trim();
          var title = (b.title || '').trim();
          var id = (b.className || b.tagName) + ' ' + JSON.stringify(text);
          if (!label && !text) out.nameless.push(id);
          if (Array.from(text).length <= 2) {
            out.iconOnly++;
            if (!label || !title) out.untitled.push(id + ' label=' + JSON.stringify(label)
              + ' title=' + JSON.stringify(title));
          }
        });
      return out; })()`);
    check('every button on the registry has an accessible name, and every icon-only one carries '
      + 'both an aria-label and a title',
      kbLabels.total > 30 && kbLabels.iconOnly > 20
        && kbLabels.nameless.length === 0 && kbLabels.untitled.length === 0,
      /* Capped at four of each: a hundred and fifty cells failing one rule prints the same lesson a
         hundred and fifty times, and the count beside it is what says how wide the failure is. */
      kbLabels.total + ' visible button(s), ' + kbLabels.iconOnly + ' of them one glyph; '
        + kbLabels.nameless.length + ' nameless ' + JSON.stringify(kbLabels.nameless.slice(0, 4))
        + ', ' + kbLabels.untitled.length + ' icon-only without both '
        + JSON.stringify(kbLabels.untitled.slice(0, 4)));

    const kbToday = await evalJs('window.planbook.attendance.todayISO()');
    const kbBeforeAny = await kbAtt();
    const kbPassesBefore = await evalJs(
      'JSON.stringify(window.planbook.store.getDoc().openPasses || [])');

    /* ── a letter with nothing selected writes nothing ── */
    /* TWO DIFFERENT LETTERS, here and at the two refusals below, and it is the same precaution the
       kbChangingLetter() helper above exists for: setMark() refuses a no-op, so one letter that
       happens to match the mark already on the cell leaves the document byte-identical whether the
       refusal worked or not. Two letters cannot both be no-ops. */
    await kbLetter('A');
    await kbLetter('E');
    check('a letter with nothing selected writes nothing — the arrow key is what picks a student up, '
      + 'so a stray keystroke cannot mark whoever happens to be at the top of the class',
      (await kbAtt()) === kbBeforeAny,
      'attendance byte-identical across two different keystrokes = '
        + ((await kbAtt()) === kbBeforeAny));

    /* ── one ArrowDown, then one letter per student ── */
    const kbOrder = await kbRows();
    const kbPattern = ['A', 'T', 'E', 'D', 'P'];
    const kbExpect = {};
    /* `D` is swapped for `E` on the two students who are out of the room, and only on them — see
       the block above. It is a substitution in the FIXTURE, not a special case in the app: the key
       these two get is an ordinary one and it is asserted exactly like the rest. */
    kbOrder.forEach((id, i) => {
      const want = kbPattern[i % kbPattern.length];
      kbExpect[id] = want === 'D' && kbPick.out.indexOf(id) !== -1 ? 'E' : want;
    });

    await kbDown();
    const kbFirst = await kbFocus();
    check('one ArrowDown lands the keyboard on the first student, with the focus ring on the exact '
      + 'cell the next letter writes into',
      kbFirst.student === kbOrder[0] && kbFirst.date === kbToday && kbFirst.ring === true,
      JSON.stringify(kbFirst) + ' against first row ' + kbOrder[0] + ' on ' + kbToday);

    /* The walk. One letter per student and NOTHING else — no arrow between them, which is the
       whole of "the selection advances on its own". The focus is read after every keystroke rather
       than at the end, because "never lost after a mark" is a claim about each mark. */
    const kbLostRing = [];
    const kbWrongRow = [];
    for (let i = 0; i < kbOrder.length; i++) {
      await kbLetter(kbExpect[kbOrder[i]]);
      const at = await kbFocus();
      if (at.ring !== true) kbLostRing.push({ step: i, focus: at });
      const want = kbOrder[Math.min(i + 1, kbOrder.length - 1)];
      if (at.student !== want) kbWrongRow.push({ step: i, want: want, got: at.student });
    }

    const kbWrote = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var rec = (doc.attendance || []).filter(function(r){
        return r.classId === ${JSON.stringify(kbPick.id)} && r.date === ${JSON.stringify(kbToday)}; })[0];
      if (!rec) return null;
      var out = {};
      Object.keys(rec.marks || {}).forEach(function(id){
        var c = rec.marks[id];
        out[id] = { code: c && c.code, at: !!(c && c.at), pass: !!(c && c.passId) }; });
      return { entries: out, exception: rec.exception || '' }; })()`);

    const kbShould = {};
    kbOrder.forEach((id) => {
      const code = kbExpect[id];
      /* `P` IS NOT AN ENTRY. Present is the absence of a mark (src/attendance.js's header), so a
         keyboard `P` has to DELETE exactly as a tap does — which is the one thing a check that
         only counted marks would miss, and the one that quietly triples the document. */
      if (code === 'P') return;
      kbShould[id] = { code: code, at: code === 'T' || code === 'D', pass: false };
    });
    const kbGot = kbWrote ? kbWrote.entries : null;
    /* The DIFFERENCE rather than both maps: twenty-six entries printed twice is four thousand
       characters of green output nobody reads, and what a red run needs is the entries that
       disagree. Both directions, so a missing entry shows up as loudly as a wrong one. */
    const kbDiff = kbGot ? Object.keys(Object.assign({}, kbGot, kbShould))
      .filter((id) => JSON.stringify(kbGot[id]) !== JSON.stringify(kbShould[id]))
      .map((id) => ({ id: id, got: kbGot[id] || null, want: kbShould[id] || null })) : null;
    check('a full class is marked from the keyboard, one keystroke per student — ' + kbOrder.length
      + ' letters after one arrow, and every mark landed on the student it was typed at',
      !!kbWrote && !kbWrote.exception && !!kbDiff && kbDiff.length === 0,
      kbOrder.length + ' student(s) in ' + kbPick.name + '; wrote '
        + (kbGot ? Object.keys(kbGot).length : 'no record') + ' entr(ies) against '
        + Object.keys(kbShould).length + ' expected (the ' + kbOrder.filter(
          (id) => kbExpect[id] === 'P').length + ' P students are absent from the document on '
        + 'purpose); disagreements = ' + JSON.stringify(kbDiff));

    check('and the two students who were out of the room are still out — a keyboard mark moves no '
      + 'hall pass, which is also what leaves the coarse sweep below its fixture',
      (await evalJs('JSON.stringify(window.planbook.store.getDoc().openPasses || [])'))
        === kbPassesBefore,
      kbPick.out.length + ' open pass(es) in ' + kbPick.name + ', byte-identical across '
        + kbOrder.length + ' keystroke(s) = '
        + ((await evalJs('JSON.stringify(window.planbook.store.getDoc().openPasses || [])'))
          === kbPassesBefore));

    check('and the selection advanced on its own the whole way down — no arrow key between the '
      + 'letters, which is the difference between thirty keystrokes and sixty',
      kbWrongRow.length === 0,
      kbOrder.length + ' step(s), ' + kbWrongRow.length + ' landed on the wrong row: '
        + JSON.stringify(kbWrongRow.slice(0, 4)));

    check('and keyboard focus was visible on every one of those steps — never lost to <body> by the '
      + 'repaint that follows a mark',
      kbLostRing.length === 0,
      kbOrder.length + ' step(s), ' + kbLostRing.length + ' without a focus-visible ring: '
        + JSON.stringify(kbLostRing.slice(0, 4)));

    /* The last row is its own case: there is nothing to advance to, and the naive implementation
       leaves focus on a cell that has just been replaced — which is <body>. */
    const kbEnd = await kbFocus();
    check('the last student in the class keeps the ring after being marked, rather than dropping '
      + 'focus at the bottom of the list',
      kbEnd.student === kbOrder[kbOrder.length - 1] && kbEnd.ring === true,
      JSON.stringify(kbEnd) + ' against last row ' + kbOrder[kbOrder.length - 1]);

    /*
      ── THE OTHER WAY A KEYBOARD MARKS, AND THE ONE THAT PREDATES THIS WORK ORDER ──

      Tab to a cell and press Enter. That fires the cell's own click, which cycles the mark and
      REPLACES the cell node (src/attendance.js's paintColumn) — so without a hand-off to the
      replacement, focus lands on <body> and a keyboard user is put back at the top of the tab
      order after every single mark. It is the same acceptance line as the walk above and a
      different code path: the walk re-focuses through selectStudent(), which would cover the loss
      up. Asked here, where nothing else is doing the focusing.
    */
    const kbEnterFrom = await kbFocus();
    await kb('Enter', 'Enter', 13, '\r');
    const kbEnterTo = await kbFocus();
    check('pressing Enter on the focused cell cycles it and the ring stays on that cell — the mark '
      + 'replaces the element focus was sitting on, and it is handed to the replacement',
      kbEnterTo.student === kbEnterFrom.student && kbEnterTo.student !== ''
        && kbEnterTo.on !== 'body' && kbEnterTo.ring === true,
      'from ' + JSON.stringify(kbEnterFrom) + ' to ' + JSON.stringify(kbEnterTo));

    /* ── the row highlight: Roll Call!'s treatment, and the reflow it must not cause ── */
    await kbUp();
    await kbUp();
    const kbSel = await evalJs(`(function(){
      var rows = Array.prototype.slice.call(
        document.querySelectorAll('#attendanceBody tr[data-attendance-row]'));
      var on = rows.filter(function(r){ return r.classList.contains('attendance-row-selected'); });
      if (on.length !== 1) return { selected: on.length };
      var name = on[0].querySelector('.attendance-name');
      var other = rows.filter(function(r){ return r !== on[0]; })[0].querySelector('.attendance-name');
      var s = getComputedStyle(name), o = getComputedStyle(other);
      return { selected: 1,
               id: on[0].getAttribute('data-attendance-row'),
               wash: getComputedStyle(on[0].querySelector('.attendance-cell-td')).backgroundColor,
               rail: s.borderLeftWidth + ' ' + s.borderLeftColor,
               otherRail: o.borderLeftWidth + ' ' + o.borderLeftColor,
               left: Math.round(name.getBoundingClientRect().left * 100) / 100,
               otherLeft: Math.round(other.getBoundingClientRect().left * 100) / 100 }; })()`);
    check('exactly one row wears Roll Call!\'s selection treatment — the indigo wash and the 3px '
      + 'left rail, copied by value rather than re-derived',
      kbSel.selected === 1 && kbSel.wash === 'rgba(91, 111, 204, 0.07)'
        && kbSel.rail === '3px rgb(91, 111, 204)',
      JSON.stringify(kbSel));
    /* The one departure from Roll Call!, measured as the thing it was made for: the rail is
       reserved on every row, so selecting one does not shove twenty-six names 3px sideways once
       per student down a class of thirty. */
    check('and selecting a row moves nothing — the rail is reserved on every row, so the names do '
      + 'not step sideways once per student',
      kbSel.left === kbSel.otherLeft && kbSel.otherRail === '3px rgba(0, 0, 0, 0)',
      'selected name at ' + kbSel.left + 'px, an unselected one at ' + kbSel.otherLeft
        + 'px; the unselected rail is ' + kbSel.otherRail);

    /* ── Escape: the selection goes, the focus does not ── */
    const kbBeforeEsc = await kbAtt();
    const kbFocusBeforeEsc = await kbFocus();
    await kbEsc();
    const kbAfterEsc = await evalJs("({ selected: "
      + "document.querySelectorAll('#attendanceBody tr.attendance-row-selected').length,"
      + " id: window.planbook.attendance.selectedStudent() })");
    const kbFocusAfterEsc = await kbFocus();
    check('Escape deselects — no row is highlighted and the module agrees nothing is selected',
      kbAfterEsc.selected === 0 && kbAfterEsc.id === '', JSON.stringify(kbAfterEsc));
    check('and Escape does not throw focus away: the ring stays on the cell it was on, so a teacher '
      + 'who paused is not left hunting for her place with Tab',
      kbFocusAfterEsc.student === kbFocusBeforeEsc.student && kbFocusAfterEsc.on !== 'body',
      'before = ' + JSON.stringify(kbFocusBeforeEsc) + ', after = '
        + JSON.stringify(kbFocusAfterEsc));
    await kbLetter('A');
    await kbLetter('E');
    check('and after Escape a letter writes NOTHING — which is what Escape is for, and it is the '
      + 'reason deselecting is not the same as blurring',
      (await kbAtt()) === kbBeforeEsc,
      'attendance byte-identical across two different keystrokes = '
        + ((await kbAtt()) === kbBeforeEsc));
    await kbDown();
    check('and one arrow picks the selection back up from where the focus was left, rather than at '
      + 'the top of the class',
      (await evalJs('window.planbook.attendance.selectedStudent()'))
        === kbOrder[Math.min(kbOrder.indexOf(kbFocusBeforeEsc.student) + 1, kbOrder.length - 1)],
      'resumed on ' + (await evalJs('window.planbook.attendance.selectedStudent()'))
        + ' after Escape on ' + kbFocusBeforeEsc.student);

    /* ── the three places a letter must not be a mark ── */
    const kbBeforeSearch = await kbAtt();
    const kbSearchLetter = await kbChangingLetter();
    await evalJs("(function(){ var f = document.getElementById('attendanceSearch');"
      + " f.focus(); f.value = ''; return 1; })()");
    await kbLetter(kbSearchLetter);
    const kbTyped = await evalJs("document.getElementById('attendanceSearch').value");
    check('a letter typed into the search box is a letter, not a mark — the field is two inches '
      + 'above the grid and "Patel" is five of them',
      (await kbAtt()) === kbBeforeSearch && kbTyped.toUpperCase() === kbSearchLetter,
      'typed ' + kbSearchLetter + ', the box reads ' + JSON.stringify(kbTyped)
        + ' and attendance is byte-identical = ' + ((await kbAtt()) === kbBeforeSearch));
    await evalJs("(function(){ var f = document.getElementById('attendanceSearch');"
      + " f.value = ''; f.dispatchEvent(new Event('input', { bubbles: true })); f.blur();"
      + " return 1; })()");

    /* ── the shortcuts, on screen rather than in the work order ── */
    const kbDoor = await evalJs(`(function(){
      var b = document.querySelector('#classView [data-modal-open="attendanceKeysModal"]');
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { visible: !!b.offsetParent, tag: b.tagName, w: Math.round(r.width),
               h: Math.round(r.height), text: (b.textContent || '').trim(),
               label: b.getAttribute('aria-label') || '', title: b.title || '',
               tabbable: b.tabIndex >= 0 }; })()`);
    check('the shortcuts have a door on the registry itself, and it is an ordinary control — Tab '
      + 'finds it for somebody who does not know a single one of the keys yet',
      !!kbDoor && kbDoor.visible === true && kbDoor.tag === 'BUTTON' && kbDoor.tabbable === true
        && kbDoor.w > 0 && kbDoor.h > 0 && /keyboard/i.test(kbDoor.label),
      JSON.stringify(kbDoor));

    await kbDown();
    const kbOpener = await kbFocus();
    await kb('?', 'Slash', 191, '?', 8);
    const kbPanel = await evalJs(`(function(){
      var m = document.getElementById('attendanceKeysModal');
      if (!m || m.classList.contains('hidden')) return null;
      var t = m.textContent || '';
      return { open: true,
               inside: m.contains(document.activeElement),
               keys: ['P','T','A','E','D'].filter(function(k){
                 return Array.prototype.slice.call(m.querySelectorAll('.attendance-key'))
                   .some(function(n){ return (n.textContent || '').trim() === k; }); }),
               arrows: /↓/.test(t) && /↑/.test(t),
               esc: /Esc/.test(t) }; })()`);
    check('and `?` opens the same list for the hand that is already on the keys, naming all five '
      + 'letters, both arrows and Escape',
      !!kbPanel && kbPanel.keys.length === 5 && kbPanel.arrows === true && kbPanel.esc === true
        && kbPanel.inside === true,
      JSON.stringify(kbPanel));

    const kbBeforeDialog = await kbAtt();
    const kbDialogLetter = await kbChangingLetter();
    await kbLetter(kbDialogLetter);
    check('and a letter with that dialog open writes nothing — the keys belong to whatever is on '
      + 'top of the screen',
      (await kbAtt()) === kbBeforeDialog,
      'typed ' + kbDialogLetter + ' at ' + (await evalJs(
        'window.planbook.attendance.selectedStudent()')) + ', attendance byte-identical = '
        + ((await kbAtt()) === kbBeforeDialog));
    await kbEsc();
    const kbBack = await kbFocus();
    check('and closing it hands focus back to the cell it was opened from',
      kbBack.student === kbOpener.student && kbBack.student !== '',
      'opened from ' + JSON.stringify(kbOpener) + ', came back to ' + JSON.stringify(kbBack));

    /* ── the keys are refused exactly where a thumb is refused ── */
    await clickSel('[data-attendance-page="earlier"]');
    await new Promise(r => setTimeout(r, 200));
    const kbBeforePaged = await kbAtt();
    await kbDown();
    await kbLetter('A');
    await kbLetter('E');
    check('a window paged off the day being edited takes no keystroke — the keyboard is refused '
      + 'exactly where a thumb is, because both go through the same writer',
      (await kbAtt()) === kbBeforePaged,
      'attendance byte-identical across an arrow and two different letters = '
        + ((await kbAtt()) === kbBeforePaged));
    await clickSel('[data-attendance-page="today"]');

    /* Left the way the section above left it: no dialog, and a class open in <main>. */
    await evalJs("window.planbook.closeModal('attendanceKeysModal');1");
    await clickSel('[data-class-tab]', 1);
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  }
}
}
