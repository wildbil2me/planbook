/* history-dialog-write.mjs — the write block in the history dialog, and the row's door out (WO-2.53)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, evalJs, has, clickSel, send } = h;

/* ───────── the write block in the history dialog, and the row's door out (WO-2.53) ─────────
 *
 * TWO SURFACES, ONE WORK ORDER. The ⋯ at the end of a name used to open a panel under the row
 * holding the mark, a note field and the un-confirm; on the state every row is in at the start of
 * every period that panel repeated the row, so the note and the un-confirm moved into the student's
 * own history dialog and the button became a door to their grade detail.
 *
 * WHY THIS IS ITS OWN FIXTURE AND ITS OWN DOCUMENT. Three of the four conditional cases have to be
 * on screen at once — a confirmed mark, a confirmed-present student and a student nobody has reached
 * — and the fourth needs today's class DROPPED, which destroys the marks on it. The attendance
 * section below marks a real day across six classes and every count in it is arithmetic over those
 * marks, so a block that dropped a class in the middle of it would be re-writing another section's
 * fixture. The whole document is snapshotted here and put back at the foot, the way the WO-2.17
 * block above does it.
 *
 * THE FIGURES ARE READ OUT OF THE DIALOG, never out of the module that drew it — the badge in the
 * head, the open term's row, the *Whole year* row and the day-by-day table, as the strings a teacher
 * reads. That is WO-2.18's rule about the panel this block replaces, and it is the reason the
 * un-confirm check below is worth writing at all: the grid behind the dialog repaints itself on
 * every write and looks like the whole answer.
 */
console.log('\n--- the history dialog writes, and the row goes to the grades (WO-2.53) ---');
{
  const D_ID = 'wo253-dismissed', P_ID = 'wo253-present', U_ID = 'wo253-waiting';
  const plant = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    var cls = (d.classes || [])[0];
    if (!cls) return { ok:false, why:'no class in the document' };
    window.__wo253 = { doc: JSON.stringify(d), classId: c.getSelectedClassId(),
                       termId: c.getSelectedTermId() };
    var p = function(n){ return (n < 10 ? '0' : '') + n; };
    var iso = function(off){ var t = new Date(); t.setDate(t.getDate() + off);
      return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); };
    var today = a.todayISO(), before = iso(-7);
    s.update(function(doc){
      /* A term that HOLDS today, so the dialog draws an open-term row beside the year row — the two
         figures an un-confirm has to move separately. The ended term written for the last case
         replaces this one and the restore at the foot puts both back. */
      cls.terms = [{ id:'tm_wo253', label:'WO-2.53 term', start: iso(-30), end: iso(30) }];
      cls.roster = ['wo253-dismissed', 'wo253-present', 'wo253-waiting'];
      doc.students = (doc.students || []).filter(function(x){
        return String(x.id).indexOf('wo253-') !== 0; });
      doc.students.push({ id:'wo253-dismissed', first:'Dee', last:'Dismissed' });
      doc.students.push({ id:'wo253-present', first:'Pat', last:'Present' });
      doc.students.push({ id:'wo253-waiting', first:'Ula', last:'Waiting' });
      doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== cls.id; });
      /* One earlier meeting where everybody was present, so the day-by-day table has two rows and
         the percentage the un-confirm moves is neither 0 nor 100 by construction. */
      doc.attendance.push({ classId: cls.id, date: before, marks: {} });
      doc.attendance.push({ classId: cls.id, date: today, marks: {
        'wo253-dismissed': { code:'D', at: today + 'T08:14:00-04:00' },
        'wo253-waiting': { code:'U' } } });
    });
    await s.flush();
    c.selectClass(cls.id);
    c.selectTerm('tm_wo253');
    a.setSearch(''); a.setFilter('all');
    a.renderAttendance();
    return { ok:true, classId: cls.id, name: cls.name, today: today, before: before,
             start: iso(-30), end: iso(30) };
  })()`);

  /* Everything inside the dialog that this block asserts, plus the row behind it and the state of
     the grade screen the door leads to. One read, because half of these claims are about several of
     those things agreeing in the same paint.
     NO BACKTICKS ANYWHERE BELOW: it is a template literal shipped to the browser, and one closes it. */
  const READ = `(async function(){
    await window.planbook.store.flush();
    var body = document.getElementById('attendanceHistoryBody');
    var modal = document.getElementById('attendanceHistoryModal');
    var box = body ? body.querySelector('[data-attendance-write]') : null;
    var note = box ? box.querySelector('[data-attendance-note]') : null;
    var flat = function(el){ return (el.textContent || '').replace(/\\s+/g, ' ').trim(); };
    var pick = function(sel){ var el = box ? box.querySelector(sel) : null;
      return el ? flat(el) : ''; };
    var doorOf = function(tr){ return tr.querySelector('[data-student-detail]'); };
    var gridRow = function(id){
      var tr = document.querySelector('#attendanceBody tr[data-attendance-row="' + id + '"]');
      if (!tr) return null;
      var cell = tr.querySelector('td[data-attendance-col] .attendance-cell');
      var door = doorOf(tr);
      return { code: cell ? (cell.textContent || '').trim() : '',
               doors: tr.querySelectorAll('[data-student-detail]').length,
               promises: door ? String(door.getAttribute('aria-pressed')) + '/'
                 + String(door.getAttribute('aria-haspopup')) : '',
               glyph: door ? (door.textContent || '').trim() : '',
               label: door ? (door.getAttribute('aria-label') || '') : '' }; };
    var view = function(id){ var el = document.getElementById(id);
      return !!(el && !el.classList.contains('hidden')); };
    return {
      dialogUp: !!(modal && !modal.classList.contains('hidden')),
      overlays: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
        .filter(function(o){ return !o.classList.contains('hidden'); })
        .map(function(o){ return o.id; }),
      block: !!box,
      blocks: body ? body.querySelectorAll('[data-attendance-write]').length : 0,
      student: box ? box.getAttribute('data-attendance-write') : '',
      day: pick('.attendance-report-write-day'),
      mark: pick('.attendance-report-write-mark'),
      hint: pick('.attendance-report-write-hint'),
      hasNote: !!note,
      note: note ? note.value : '',
      noteDate: note ? note.getAttribute('data-attendance-note-date') : '',
      unconfirms: box ? box.querySelectorAll('[data-attendance-unconfirm]').length : 0,
      /* The same field element, or a new one: the property is set by hand before typing, so "the
         caret is not taken out of the field" is a fact about the element rather than about the
         value that came back. */
      sameField: !!(note && note.__wo253),
      focused: !!(note && document.activeElement === note),
      /* WO-2.60: the card's own shape. The four figures an un-confirm used to go stale in here — the
         badge, the open term's row, the year row and day by day — are the student page's now, and
         are read off that page by READ_PAGE below. */
      title: (document.getElementById('attendanceHistoryTitle') || {}).textContent || '',
      tables: body ? body.querySelectorAll('table').length : 0,
      inputs: body ? body.querySelectorAll('input, textarea, select').length : 0,
      doors: body ? Array.prototype.slice.call(body.querySelectorAll('[data-student-detail]'))
        .map(function(b){ return b.getAttribute('data-student-detail'); }) : [],
      readonly: (function(){ var b = body ? body.querySelector('[data-attendance-readonly]') : null;
        if (!b) return null;
        var chip = b.querySelector('.attendance-report-write-mark');
        var hint = b.querySelector('.attendance-report-write-hint');
        return { reason: b.getAttribute('data-attendance-readonly'),
          day: flat(b.querySelector('.attendance-report-write-day') || b),
          chip: chip ? flat(chip) : '', hint: hint ? flat(hint) : '',
          /* Every attribute a writer or a router answers, anywhere inside it. */
          hooks: b.querySelectorAll('input, button, [data-attendance-note], [data-attendance-time], '
            + '[data-attendance-unconfirm], [data-attendance-cell], [tabindex]').length }; })(),
      /* Where focus is after the un-confirm's repaint: inside the dialog, on the write box. */
      focusInBox: !!(box && document.activeElement === box),
      focusInDialog: !!(modal && modal.contains(document.activeElement)),
      /* And the grid behind it. */
      grid: { dismissed: gridRow('wo253-dismissed'), present: gridRow('wo253-present'),
              waiting: gridRow('wo253-waiting') },
      registryUp: view('classView'), detailUp: view('detailView'),
      heading: (document.getElementById('detailStudentName') || {}).textContent || '',
      /* THE VISIBLE STRIP, and it has to be found rather than named: every class screen carries its
         own identical [data-screen-nav] and src/screen-nav.js paints all of them, so a check that
         took the first in document order would be reading a hidden one. */
      crumbs: (function(){
        var strip = Array.prototype.slice.call(document.querySelectorAll('[data-screen-nav]'))
          .filter(function(n){ return !!n.offsetParent; })[0];
        if (!strip) return [];
        return Array.prototype.slice.call(strip.querySelectorAll('.screen-nav-btn'))
          .map(function(b){ return (b.textContent || '').trim()
            + (b.classList.contains('detail') ? ' (name)' : ''); }); })(),
      /* The entry itself, out of the document, so a claim about the screen is never the only one. */
      entry: (function(){
        var d = window.planbook.store.getDoc();
        var r = (d.attendance || []).filter(function(x){
          return x.date === window.planbook.attendance.todayISO()
            && x.classId === ((d.classes || [])[0] || {}).id; })[0];
        /* The marks map is ABSENT on a dropped day — the record is class, date and exception, and nothing
           else (docs/data-model.md). Reading it off that shape is what took this block's first run
           down after the drop case, on an app that was behaving exactly as specified. */
        if (!r) return 'no record';
        if (r.exception) return 'exception: ' + r.exception;
        return JSON.stringify((r.marks || {})['wo253-dismissed'] || null); })() }; })()`;
  const read253 = () => evalJs(READ);
  /* THE STUDENT PAGE'S ATTENDANCE CARD (WO-2.60), where the term table and day by day went. Each row
     is read as a LIST of its cells rather than as its textContent, which would run five counts into
     one unreadable number. NO BACKTICKS INSIDE. */
  const READ_PAGE = `(function(){
    var v = document.getElementById('detailView');
    var flat = function(el){ return (el.textContent || '').replace(/\\s+/g, ' ').trim(); };
    var cellsOf = function(tr){ return Array.prototype.slice.call(tr.children).map(flat); };
    var att = v ? Array.prototype.slice.call(v.querySelectorAll('.detail-card')).filter(function(c){
      var t = c.querySelector('.detail-card-title');
      return !!t && flat(t).indexOf('Attendance · ') === 0; })[0] : null;
    var terms = att ? Array.prototype.slice.call(att.querySelectorAll('table.detail-att-terms tbody tr')) : [];
    var det = att ? att.querySelector('details.detail-att-days') : null;
    return { up: !!(v && !v.classList.contains('hidden')),
      title: att ? flat(att.querySelector('.detail-card-title')) : '',
      openTerm: (terms.filter(function(tr){
        return tr.className.indexOf('attendance-report-open') >= 0; })[0] || null),
      rows: terms.map(cellsOf),
      days: det ? Array.prototype.slice.call(det.querySelectorAll('tbody tr')).map(cellsOf) : [] }; })()`;
  const readPage = async () => {
    const out = await evalJs(READ_PAGE);
    out.openTerm = (out.rows.filter((r) => /— open$/.test(r[0]))[0]) || [];
    out.year = (out.rows.filter((r) => r[0] === 'Whole year')[0]) || [];
    return out;
  };
  const openFor = async (id) => {
    await clickSel('#attendanceBody [data-attendance-history="' + id + '"]');
    return read253();
  };
  const shut = () => clickSel('#attendanceHistoryModal [data-modal-close]');

  if (!plant.ok) {
    check('the WO-2.53 fixture is real: three students on a dated term that holds today, one dismissed, one present, one unconfirmed',
      false, plant.why);
  } else {
    /* ── case 1: a confirmed mark gets the field and the un-confirm ── */
    const onD = await openFor(D_ID);
    check('the WO-2.53 fixture is real: three students on a dated term that holds today, one dismissed, one present, one unconfirmed',
      onD.dialogUp && !!onD.grid.dismissed && onD.grid.dismissed.code === 'D'
        && onD.grid.present.code === 'P' && onD.grid.waiting.code === '?'
        /* WO-2.60: the dialog is titled with the student and holds no table and one door. */
        && onD.title === 'Dee Dismissed' && onD.tables === 0
        && JSON.stringify(onD.doors) === JSON.stringify([D_ID]),
      'the column reads ' + JSON.stringify([onD.grid.dismissed && onD.grid.dismissed.code,
        onD.grid.present && onD.grid.present.code, onD.grid.waiting && onD.grid.waiting.code])
        + ' :: titled ' + JSON.stringify(onD.title) + ', ' + onD.tables + ' table(s), doors '
        + JSON.stringify(onD.doors));
    check('a confirmed mark gets the note field and the un-confirm, in ONE block that names the day it writes on',
      onD.block && onD.blocks === 1 && onD.student === D_ID
        && onD.day.indexOf('Today · ') === 0 && onD.day.indexOf(', ') > 0
        && onD.mark.indexOf('Dismissed at ') === 0
        && onD.hasNote && onD.noteDate === plant.today && onD.unconfirms === 1
        && onD.hint === '',
      JSON.stringify(onD.day) + ' :: ' + JSON.stringify(onD.mark) + ' :: field = ' + onD.hasNote
        + ' on ' + JSON.stringify(onD.noteDate) + ', un-confirm(s) = ' + onD.unconfirms
        + ', block(s) = ' + onD.blocks);

    /* ── the note lands on that day's mark, and typing does not repaint ── */
    await evalJs(`(function(){ var e = document.querySelector('[data-attendance-note]');
      if (!e) return false; e.__wo253 = 1; e.focus();
      e.value = 'walked in with a late pass';
      e.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    const typed = await read253();
    await shut();
    const reopened = await openFor(D_ID);
    check('a note typed in the dialog lands on that day\'s mark and comes back on it — and the field it was typed into is never replaced',
      typed.sameField && typed.focused && typed.note === 'walked in with a late pass'
        && typed.entry === JSON.stringify({ code: 'D', at: plant.today + 'T08:14:00-04:00',
          note: 'walked in with a late pass' })
        && reopened.hasNote && reopened.note === 'walked in with a late pass'
        && reopened.noteDate === plant.today,
      'the entry is now ' + typed.entry + '; the same element survived the keystroke = '
        + typed.sameField + ', still focused = ' + typed.focused
        + '; reopened, the field reads ' + JSON.stringify(reopened.note));

    /* ── the un-confirm, and the four figures in the dialog that go stale with it ── */
    await clickSel('#attendanceHistoryModal [data-attendance-unconfirm]');
    const undone = await read253();
    check('WO-2.60 · Un-confirm from inside the card writes `{ code: "U" }` through the same hook, moves the grid behind it, and repaints the card with focus INSIDE it — on the write box, not on <body>',
      undone.dialogUp && undone.block && undone.focusInBox && undone.focusInDialog
        && undone.grid.dismissed.code === '?'
        && undone.entry === JSON.stringify({ code: 'U' }),
      'dialog up = ' + undone.dialogUp + ', block = ' + undone.block + ', focus on the box = '
        + undone.focusInBox + ', focus inside the dialog = ' + undone.focusInDialog
        + ' :: the cell behind it reads ' + JSON.stringify(undone.grid.dismissed.code)
        + ' and the entry is ' + undone.entry);
    check('and the block redraws as the case it now is — the un-confirmed hint, and neither control',
      undone.block && !undone.hasNote && undone.unconfirms === 0
        && undone.hint.indexOf('Nobody has confirmed this student yet') === 0
        && undone.mark === 'Not confirmed',
      JSON.stringify(undone.mark) + ' :: ' + JSON.stringify(undone.hint)
        + ' :: field = ' + undone.hasNote + ', un-confirm(s) = ' + undone.unconfirms);

    /*
      AND THE FOUR FIGURES IT MOVED, ON THE PAGE THEY MOVED TO (WO-2.60). The badge, the open term's
      row, the Whole year row and the day-by-day table were read in this dialog until that work order;
      they are the student page's now, so the card's one door is followed and the same strings are
      read there. Two meetings, one of them now an absence. Day by day is NEWEST FIRST on the page, so
      today's row is the first of the two.
    */
    await clickSel('#attendanceHistoryModal [data-student-detail="' + D_ID + '"]');
    await new Promise(r => setTimeout(r, 250));
    const page = await readPage();
    check('WO-2.60 · and the student page behind the card\'s door shows what the un-confirm moved — the card title, the open term\'s row, the Whole year row and today\'s row of day by day, with its running fraction',
      page.up && page.title === 'Attendance · 50%'
        && JSON.stringify(page.openTerm)
          === JSON.stringify(['WO-2.53 term — open', '1', '0', '1', '0', '0', '2', '50%'])
        && JSON.stringify(page.year)
          === JSON.stringify(['Whole year', '1', '0', '1', '0', '0', '2', '50%'])
        && page.days.length === 2 && page.days[0][1] === 'Absent' && page.days[0][2] === '1 of 2 · 50%'
        && page.days[1][1] === 'Present' && page.days[1][2] === '1 of 1 · 100%',
      'page up = ' + page.up + ' :: ' + JSON.stringify(page.title) + ' :: term '
        + JSON.stringify(page.openTerm) + ' :: year ' + JSON.stringify(page.year) + ' :: days '
        + JSON.stringify(page.days));
    await clickSel('#detailView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 250));

    /* ── case 2: a confirmed present student ── */
    const onP = await openFor(P_ID);
    check('a confirmed present student gets the un-confirm and the sentence saying why there is nothing to note',
      onP.block && !onP.hasNote && onP.unconfirms === 1 && onP.mark === 'Present'
        && onP.hint === 'Nothing to note on a present mark. Change the mark on the grid and a note field appears here.',
      JSON.stringify(onP.mark) + ' :: ' + JSON.stringify(onP.hint) + ' :: field = ' + onP.hasNote
        + ', un-confirm(s) = ' + onP.unconfirms);
    await shut();

    /* ── case 3, on a student nobody has reached rather than on one just put back ── */
    const onU = await openFor(U_ID);
    check('a student nobody has confirmed gets the hint and NEITHER control — nothing to type into and nothing to put back',
      onU.block && !onU.hasNote && onU.unconfirms === 0 && onU.mark === 'Not confirmed'
        && onU.hint.indexOf('Nobody has confirmed this student yet') === 0,
      JSON.stringify(onU.mark) + ' :: field = ' + onU.hasNote + ', un-confirm(s) = '
        + onU.unconfirms);
    await shut();

    /* ── case 4: a day with no meeting draws no block at all ── */
    await evalJs(`(async function(){ var a = window.planbook.attendance;
      a.dropClass(); await window.planbook.store.flush(); return 1; })()`);
    const onDropped = await openFor(P_ID);
    check('a day the class did not meet draws no write block — the card is read-only, says why, and shows no mark because there is none, with no input and no hook on it (WO-2.60)',
      onDropped.dialogUp && !onDropped.block && onDropped.blocks === 0
        && !onDropped.hasNote && onDropped.unconfirms === 0 && onDropped.inputs === 0
        && !!onDropped.readonly && onDropped.readonly.reason === 'did-not-meet'
        && onDropped.readonly.chip === '' && onDropped.readonly.hooks === 0
        && onDropped.readonly.hint.indexOf('The class didn’t meet this day') === 0
        && JSON.stringify(onDropped.doors) === JSON.stringify([P_ID]),
      'dialog up = ' + onDropped.dialogUp + ', write block(s) = ' + onDropped.blocks
        + ', field = ' + onDropped.hasNote + ', un-confirm(s) = ' + onDropped.unconfirms
        + ', input(s) = ' + onDropped.inputs + '; read-only ' + JSON.stringify(onDropped.readonly));
    await shut();
    await evalJs(`(async function(){ var a = window.planbook.attendance;
      a.undropClass(); await window.planbook.store.flush(); return 1; })()`);

    /*
      ── editDate() answers '' : a past day, still locked ──

      THE STATE IS REACHED THE WAY WO-2.52 DESCRIBES IT, by selecting a term that has ENDED: the
      strip anchors on that term's last day, that day is in the past, and a past day is read-only
      until its ✏ is pressed — so editDate() answers '', which matches no column, and every writer
      refuses on the shape test in writableDate(). Paging the window back is NOT this state and never
      was: the anchor does not move when the window does, so editDate() still answers today there and
      the block is still drawn — naming the day it writes on, which is what makes that honest.
    */
    const ended = await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var d = s.getDoc(), cls = (d.classes || [])[0];
      var p = function(n){ return (n < 10 ? '0' : '') + n; };
      var iso = function(off){ var t = new Date(); t.setDate(t.getDate() + off);
        return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); };
      s.update(function(doc){ cls.terms = [{ id:'tm_wo253over', label:'WO-2.53 ended',
        start: iso(-60), end: iso(-30) }];
        /* WO-2.60: a meeting ON the ended term's last day, the day the strip stands on, with an
           absence for the dismissed student — so the read-only card has that day's mark to show. */
        doc.attendance.push({ classId: cls.id, date: iso(-30), marks: {
          'wo253-dismissed': { code:'A' } } }); });
      await s.flush();
      c.selectTerm('tm_wo253over');
      a.renderAttendance();
      return { end: iso(-30) }; })()`);
    const onLocked = await openFor(D_ID);
    const lockedSaid = await evalJs('window.planbook.attendance.spokenDate('
      + JSON.stringify(ended.end) + ')');
    check('WO-2.60 · on a locked past day the card shows THAT day\'s mark, read-only, with its sentence — no write block, no input, no hook — and names the day it is about',
      onLocked.dialogUp && !onLocked.block && onLocked.blocks === 0
        && !onLocked.hasNote && onLocked.unconfirms === 0 && onLocked.inputs === 0
        && !!onLocked.readonly && onLocked.readonly.reason === 'locked'
        && onLocked.readonly.chip === 'Absent' && onLocked.readonly.hooks === 0
        && onLocked.readonly.hint === 'This day is locked. Press its ✏ on the grid to change the mark or add a note.'
        && onLocked.readonly.day.indexOf(lockedSaid + ' · ') === 0
        && onLocked.readonly.day.indexOf('Today') < 0,
      'the selected term ended ' + ended.end + ' (' + lockedSaid + '); dialog up = '
        + onLocked.dialogUp + ', write block(s) = ' + onLocked.blocks + ', field = '
        + onLocked.hasNote + ', un-confirm(s) = ' + onLocked.unconfirms + ', input(s) = '
        + onLocked.inputs + '; read-only ' + JSON.stringify(onLocked.readonly));
    await shut();

    /*
      ── the row's door, in ONE activation ──

      The whole of the owner's ask: the button at the end of a name lands on that student's grade
      detail rather than opening a panel that repeats the row. Driven on the row with the least on it
      — the student nobody has confirmed — because that is the state every row is in at the start of
      every period and it is the state the panel was hollow on. One clickSel is one activation; what
      is asserted is that no dialog opened on the way and that the screen it landed on is the grade
      detail for that student, named on the switcher.
    */
    const atRow = await read253();
    await clickSel('#attendanceBody tr[data-attendance-row="' + U_ID + '"] [data-student-detail]');
    const arrived = await read253();
    check('one activation of the row\'s door lands on the grade screen for that student, with the breadcrumb naming them, and no dialog opens on the way',
      atRow.registryUp && !atRow.detailUp && atRow.overlays.length === 0
        && arrived.detailUp && !arrived.registryUp && arrived.overlays.length === 0
        && arrived.heading === 'Ula Waiting'
        && arrived.crumbs[arrived.crumbs.length - 1] === 'Ula Waiting (name)',
      'from the registry (' + atRow.registryUp + ') to the detail screen (' + arrived.detailUp
        + ') in one activation; dialogs open on arrival = ' + JSON.stringify(arrived.overlays)
        + ', heading ' + JSON.stringify(arrived.heading) + ', switcher '
        + JSON.stringify(arrived.crumbs));
    check('the door is one per row, it is not a toggle, and it does not promise a dialog — no aria-pressed and no aria-haspopup on it',
      atRow.grid.waiting.doors === 1 && atRow.grid.dismissed.doors === 1
        && atRow.grid.present.doors === 1
        && atRow.grid.waiting.glyph === '›'
        && atRow.grid.waiting.promises === 'null/null'
        && atRow.grid.waiting.label === 'Grade detail for Ula Waiting',
      'doors per row = ' + JSON.stringify([atRow.grid.dismissed.doors, atRow.grid.present.doors,
        atRow.grid.waiting.doors]) + ', glyph ' + JSON.stringify(atRow.grid.waiting.glyph)
        + ', aria-pressed/aria-haspopup = ' + atRow.grid.waiting.promises + ', label '
        + JSON.stringify(atRow.grid.waiting.label));

    /*
      The document back as it was, IN PLACE rather than as a fresh object — every module holds the
      reference getDoc() handed it — and the class, the term and the screen this block found open put
      back with it. The section below opens a class from the home grid, so the last act puts the
      registry back on screen and repaints it.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo253, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      c.selectClass(saved.classId);
      if (saved.termId) c.selectTerm(saved.termId);
      a.setSearch(''); a.setFilter('all'); a.resetRegistry(); a.renderAttendance();
      delete window.__wo253;
      await s.flush();
      return 1; })()`);
    const cleaned = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      return { students: (d.students || []).filter(function(x){
                 return String(x.id).indexOf('wo253-') === 0; }).length,
               records: (d.attendance || []).filter(function(r){
                 return JSON.stringify(r.marks || {}).indexOf('wo253-') >= 0; }).length,
               terms: JSON.stringify(((d.classes || [])[0] || {}).terms || null) }; })()`);
    check('the WO-2.53 fixture came back off the document — no planted student, no planted mark, and the first class\'s terms as they were',
      cleaned.students === 0 && cleaned.records === 0 && cleaned.terms.indexOf('wo253') < 0,
      cleaned.students + ' planted student(s) and ' + cleaned.records
        + ' record(s) holding one left behind; the first class\'s terms are '
        + cleaned.terms.slice(0, 120));
  }
}

/* ───────── the time on a mark, typed in the history dialog (WO-2.55) ─────────
 *
 * A tardy caught late: the tap stamps the moment of the tap, and only on today's column, so the
 * dialog's write block carries a time field for a `T` or a `D` and nothing else — and not for a `D`
 * whose dismissal closed a pass, because the pass owns that time.
 *
 * THE PAST DAY IS CHOSEN TO SIT ACROSS A DAYLIGHT-SAVING CHANGE FROM TODAY, and the zone is pinned
 * to America/New_York for the length of the block so that is true on any machine. That is what makes
 * the first check able to fail: a writer that built the stamp with the offset of the moment of
 * typing rather than of the mark's own date writes the right hour with the wrong offset, and on two
 * dates inside one offset the two are the same string. The block asserts the two offsets differ
 * before it asserts anything about them.
 *
 * Its own students on the first class, its own terms, the whole document snapshotted and put back at
 * the foot, as the WO-2.53 block above does. The past day is reached the way a teacher reaches it:
 * a term that ENDED on it, so the strip stands on that day, and its ✏ — editDay() — unlocks it.
 */
console.log('\n--- the time on a mark, typed in the history dialog (WO-2.55) ---');
{
  let zoned = false;
  try {
    await send('Emulation.setTimezoneOverride', { timezoneId: 'America/New_York' });
    zoned = true;
  } catch (err) { zoned = false; }

  const plant = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc(), cls = (d.classes || [])[0];
    if (!cls) return { ok:false, why:'no class in the document' };
    window.__wo255 = { doc: JSON.stringify(d), classId: c.getSelectedClassId(),
                       termId: c.getSelectedTermId() };
    var p = function(n){ return (n < 10 ? '0' : '') + n; };
    var isoOf = function(t){ return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); };
    var offOf = function(t){ var o = -t.getTimezoneOffset(), m = Math.abs(o);
      return (o < 0 ? '-' : '+') + p(Math.floor(m / 60)) + ':' + p(m % 60); };
    var today = a.todayISO();
    var tp = today.split('-').map(Number);
    var at = function(off, hh, mm){ return new Date(tp[0], tp[1] - 1, tp[2] + off, hh, mm); };
    /* The offset a stamp taken right now carries, and the nearest weekday behind today whose 08:20
       carries the other one. */
    var offNow = offOf(new Date());
    var k = 1, past = '';
    for (; k < 400; k++) {
      var t = at(-k, 8, 20);
      if (t.getDay() === 0 || t.getDay() === 6) continue;
      if (offOf(t) !== offNow) { past = isoOf(t); break; }
    }
    if (!past) return { ok:false, why:'no weekday within 400 days carries a different offset from today in this zone' };
    var offPast = offOf(at(-k, 8, 20)), offToday = offOf(at(0, 8, 14));
    s.update(function(doc){
      /* Term A ENDS on the past day, so selecting it stands the strip there; term B holds today. */
      cls.terms = [{ id:'tm_wo255a', label:'WO-2.55 then', start: isoOf(at(-k - 20, 12, 0)), end: past },
                   { id:'tm_wo255b', label:'WO-2.55 now', start: isoOf(at(-k + 1, 12, 0)),
                     end: isoOf(at(30, 12, 0)) }];
      var ids = ['late', 'today', 'pass', 'absent', 'event', 'present', 'waiting'];
      cls.roster = ids.map(function(x){ return 'wo255-' + x; });
      doc.students = (doc.students || []).filter(function(x){
        return String(x.id).indexOf('wo255-') !== 0; });
      ids.forEach(function(x){ doc.students.push({ id:'wo255-' + x, first: x.charAt(0).toUpperCase()
        + x.slice(1), last:'Twofiftyfive' }); });
      doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== cls.id; });
      doc.attendance.push({ classId: cls.id, date: past, marks: {} });
      doc.attendance.push({ classId: cls.id, date: today, marks: {
        'wo255-today': { code:'T', at: today + 'T08:14:00' + offToday },
        'wo255-pass': { code:'D', at: today + 'T09:02:00' + offToday, passId:'pass_wo255' },
        'wo255-absent': { code:'A' }, 'wo255-event': { code:'E' }, 'wo255-waiting': { code:'U' } } });
    });
    await s.flush();
    c.selectClass(cls.id);
    c.selectTerm('tm_wo255a');
    a.setSearch(''); a.setFilter('all');
    a.renderAttendance();
    /* The ✏, and then the tap — the real writer, which writes a past-day tardy with no time. */
    a.editDay(past);
    a.setMark('wo255-late', 'T', past);
    await s.flush();
    return { ok:true, classId: cls.id, today: today, past: past, offPast: offPast,
             offToday: offToday, offNow: offNow }; })()`);

  /* The entry, the dialog's time field and chip, and the grid cell's time caption, in one read. */
  const READ = (id, date) => evalJs(`(async function(){
    await window.planbook.store.flush();
    var d = window.planbook.store.getDoc(), cls = (d.classes || [])[0];
    var r = (d.attendance || []).filter(function(x){
      return x.classId === cls.id && x.date === ${JSON.stringify(date)}; })[0];
    var modal = document.getElementById('attendanceHistoryModal');
    var body = document.getElementById('attendanceHistoryBody');
    var box = body ? body.querySelector('[data-attendance-write]') : null;
    var field = box ? box.querySelector('[data-attendance-time]') : null;
    var chip = box ? box.querySelector('.attendance-report-write-mark') : null;
    var cell = document.querySelector('#attendanceBody tr[data-attendance-row="${id}"] '
      + 'td[data-attendance-col="${date}"]');
    var cap = cell ? cell.querySelector('.attendance-cell-time') : null;
    return {
      entry: r ? JSON.stringify((r.marks || {})[${JSON.stringify(id)}] || null) : 'no record',
      dialogUp: !!(modal && !modal.classList.contains('hidden')),
      block: !!box,
      hasField: !!field, fields: box ? box.querySelectorAll('input[type="time"]').length : 0,
      value: field ? field.value : '',
      fieldDate: field ? field.getAttribute('data-attendance-time-date') : '',
      same: !!(field && field.__wo255),
      chip: chip ? (chip.textContent || '').trim() : '',
      hints: box ? Array.prototype.slice.call(box.querySelectorAll('.attendance-report-write-hint'))
        .map(function(x){ return (x.textContent || '').trim(); }) : [],
      caption: cap ? (cap.textContent || '').trim() : '',
      cellFound: !!cell }; })()`);
  const openFor = async (id, date) => {
    await clickSel('#attendanceBody [data-attendance-history="' + id + '"]');
    return READ(id, date);
  };
  const shut = () => clickSel('#attendanceHistoryModal [data-modal-close]');
  /* What a teacher's wheel does: set the value, and let the page hear both events a browser fires. */
  const typeTime = (value) => evalJs(`(function(){
    var f = document.querySelector('#attendanceHistoryBody [data-attendance-time]');
    if (!f) return false; f.__wo255 = 1; f.focus(); f.value = ${JSON.stringify(value)};
    f.dispatchEvent(new Event('input', { bubbles: true }));
    f.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  const direct = (id, text, date) => evalJs(`(async function(){
    window.planbook.attendance.setMarkTime(${JSON.stringify(id)}, ${JSON.stringify(text)},
      ${JSON.stringify(date)});
    await window.planbook.store.flush(); return 1; })()`);

  if (!plant.ok) {
    check('the WO-2.55 fixture is real: a past day across a daylight-saving change from today, unlocked, with a tardy tapped onto it and no time on it',
      false, plant.why);
  } else {
    const PAST = plant.past, TODAY = plant.today;

    /* ── acceptance 1: a past-day tardy, typed at 8:20, lands with THAT day's offset ── */
    const before = await openFor('wo255-late', PAST);
    check('the WO-2.55 fixture is real: a past day across a daylight-saving change from today, unlocked, with a tardy tapped onto it and no time on it',
      zoned && plant.offPast !== plant.offToday && plant.offToday === plant.offNow
        && before.entry === JSON.stringify({ code: 'T' })
        && before.hasField && before.value === '' && before.fieldDate === PAST,
      'zone pinned = ' + zoned + '; ' + PAST + ' is ' + plant.offPast + ', ' + TODAY + ' is '
        + plant.offToday + ' (now ' + plant.offNow + '); the tap wrote ' + before.entry
        + '; the dialog\'s field = ' + before.hasField + ' reading ' + JSON.stringify(before.value)
        + ' for ' + JSON.stringify(before.fieldDate));
    await typeTime('08:20');
    const typed = await READ('wo255-late', PAST);
    await shut();
    const after = await READ('wo255-late', PAST);
    const again = await openFor('wo255-late', PAST);
    await shut();
    check('a time typed onto a past-day tardy lands in the document as that day at 08:20 with THAT day\'s offset, not today\'s — and the chip, the grid cell and the reopened field all read it',
      typed.entry === JSON.stringify({ code: 'T', at: PAST + 'T08:20:00' + plant.offPast })
        && typed.same && typed.chip === 'Tardy at 8:20 AM'
        && after.cellFound && after.caption === '8:20a'
        && again.value === '08:20',
      'the entry is ' + typed.entry + ' (want the offset ' + plant.offPast + ', not '
        + plant.offToday + '); the field survived = ' + typed.same + '; chip '
        + JSON.stringify(typed.chip) + '; the cell behind it reads ' + JSON.stringify(after.caption)
        + ' (cell found = ' + after.cellFound + '); reopened, the field reads '
        + JSON.stringify(again.value));

    /* ── acceptance 2: today's column — the typed time replaces the stamp, and a cycle re-stamps ── */
    await evalJs(`(function(){ var c = window.planbook.classes, a = window.planbook.attendance;
      a.lockDay(); c.selectTerm('tm_wo255b'); a.renderAttendance(); return 1; })()`);
    const stamped = await openFor('wo255-today', TODAY);
    await typeTime('07:55');
    const retimed = await READ('wo255-today', TODAY);
    await shut();
    const retimedGrid = await READ('wo255-today', TODAY);
    const TYPED = TODAY + 'T07:55:00' + plant.offToday;
    check('on today\'s column a typed time REPLACES the tap\'s stamp, and the cell under the dialog reads the new one',
      stamped.value === '08:14' && stamped.fieldDate === TODAY
        && retimed.entry === JSON.stringify({ code: 'T', at: TYPED })
        && retimedGrid.caption === '7:55a',
      'the field opened on ' + JSON.stringify(stamped.value) + '; the entry is now '
        + retimed.entry + '; the cell reads ' + JSON.stringify(retimedGrid.caption));
    await evalJs(`(async function(){ var a = window.planbook.attendance;
      a.setMark('wo255-today', 'A'); a.setMark('wo255-today', 'T');
      await window.planbook.store.flush(); return 1; })()`);
    const cycled = await READ('wo255-today', TODAY);
    const cycledAt = (() => { try { return JSON.parse(cycled.entry).at || ''; } catch (e) { return ''; } })();
    check('and cycling the cell off T and back still re-stamps it — the cell is rewritten whole, so the typed time does not survive',
      cycledAt !== '' && cycledAt !== TYPED && cycledAt.indexOf(TODAY + 'T') === 0
        && cycledAt.slice(-6) === plant.offToday,
      'after A then T the entry is ' + cycled.entry);
    await openFor('wo255-today', TODAY);
    await typeTime('');
    const emptied = await READ('wo255-today', TODAY);
    await shut();
    check('an emptied time field deletes `at` and leaves the mark — the shape a past-day tap has always written',
      emptied.entry === JSON.stringify({ code: 'T' }),
      'the entry is ' + emptied.entry);

    /* ── acceptance 3: a pass-linked dismissal shows its time and draws no field ── */
    const PASS = JSON.stringify({ code: 'D', at: TODAY + 'T09:02:00' + plant.offToday,
                                  passId: 'pass_wo255' });
    const onPass = await openFor('wo255-pass', TODAY);
    await shut();
    await direct('wo255-pass', '10:30', TODAY);
    const passAfter = await READ('wo255-pass', TODAY);
    check('a D that closed a hall pass draws NO time field — one sentence says the pass owns its time — and setMarkTime() refuses it',
      onPass.block && !onPass.hasField && onPass.fields === 0
        && onPass.chip === 'Dismissed at 9:02 AM'
        && onPass.hints.some((x) => x.indexOf('the pass owns its time, 9:02 AM') >= 0)
        && passAfter.entry === PASS,
      'field = ' + onPass.hasField + ' (' + onPass.fields + ' time input(s)); chip '
        + JSON.stringify(onPass.chip) + '; ' + JSON.stringify(onPass.hints)
        + '; after a direct setMarkTime the entry is ' + passAfter.entry);

    /* ── acceptance 4: A, E, P and U draw no field, and the writer refuses every one ── */
    const others = [['wo255-absent', { code: 'A' }], ['wo255-event', { code: 'E' }],
                    ['wo255-present', null], ['wo255-waiting', { code: 'U' }]];
    const seen = [];
    for (const [id, want] of others) {
      const onIt = await openFor(id, TODAY);
      await shut();
      await direct(id, '10:30', TODAY);
      const afterIt = await READ(id, TODAY);
      seen.push({ id, block: onIt.block, fields: onIt.fields, entry: afterIt.entry,
                  ok: onIt.block && onIt.fields === 0 && afterIt.entry === JSON.stringify(want) });
    }
    check('absent, event, present and not-confirmed draw no time field, and setMarkTime() writes nothing onto any of them',
      seen.every((x) => x.ok),
      seen.map((x) => x.id + ': block ' + x.block + ', ' + x.fields + ' time input(s), entry '
        + x.entry).join(' · '));

    /* The document, class, term and screen put back. */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo255, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      c.selectClass(saved.classId);
      if (saved.termId) c.selectTerm(saved.termId);
      a.setSearch(''); a.setFilter('all'); a.resetRegistry(); a.renderAttendance();
      delete window.__wo255;
      await s.flush();
      return 1; })()`);
  }
  /* And the zone released, whatever happened above. */
  if (zoned) await send('Emulation.setTimezoneOverride', { timezoneId: '' });
  const cleaned = await evalJs(`(function(){
    var d = window.planbook.store.getDoc();
    return { students: (d.students || []).filter(function(x){
               return String(x.id).indexOf('wo255-') === 0; }).length,
             records: (d.attendance || []).filter(function(r){
               return JSON.stringify(r.marks || {}).indexOf('wo255-') >= 0; }).length }; })()`);
  check('the WO-2.55 fixture came back off the document',
    cleaned.students === 0 && cleaned.records === 0,
    cleaned.students + ' planted student(s), ' + cleaned.records + ' record(s) holding one');
}
}
