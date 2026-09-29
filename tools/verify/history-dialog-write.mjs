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
    var rows = body ? Array.prototype.slice.call(body.querySelectorAll('tbody tr')) : [];
    var flat = function(el){ return (el.textContent || '').replace(/\\s+/g, ' ').trim(); };
    var pick = function(sel){ var el = box ? box.querySelector(sel) : null;
      return el ? flat(el) : ''; };
    /* A row's cells, in order, as the strings a teacher reads. Read as a LIST rather than as the
       row's textContent, which concatenates them with no separator and turns five counts into one
       unreadable number. */
    var cellsOf = function(tr){
      return Array.prototype.slice.call(tr.children).map(flat); };
    var labelled = function(label){
      var hit = rows.filter(function(tr){ var th = tr.querySelector('th');
        return !!th && flat(th).indexOf(label) === 0; })[0];
      return hit ? cellsOf(hit) : []; };
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
      /* The four figures in the dialog that an un-confirm goes stale. */
      rate: body && body.querySelector('.attendance-report-rate')
        ? flat(body.querySelector('.attendance-report-rate')) : '',
      openTerm: (function(){
        var hit = rows.filter(function(tr){
          return tr.className.indexOf('attendance-report-open') >= 0; })[0];
        return hit ? cellsOf(hit) : []; })(),
      year: labelled('Whole year'),
      days: rows.filter(function(tr){ return !!tr.querySelector('.attendance-report-mark'); })
        .map(cellsOf),
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
        && onD.openTerm[0] === 'WO-2.53 term — open'
        && onD.year[0] === 'Whole year'
        /* Every count after the label, not the label: this term holds both of the class's meetings,
           so the open term's row and the year's row are the same figures under two names. */
        && JSON.stringify(onD.openTerm.slice(1)) === JSON.stringify(onD.year.slice(1)),
      'the column reads ' + JSON.stringify([onD.grid.dismissed && onD.grid.dismissed.code,
        onD.grid.present && onD.grid.present.code, onD.grid.waiting && onD.grid.waiting.code])
        + ' :: ' + JSON.stringify(onD.openTerm) + ' / ' + JSON.stringify(onD.year));
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
    check('un-confirm from inside the dialog moves all five surfaces in one paint — the head percentage, the open term\'s row, the Whole year row, the day-by-day table, and the grid behind it',
      undone.dialogUp
        /* The badge in the head: two meetings, one of them now an absence. */
        && reopened.rate === '100%' && undone.rate === '50%'
        /* The open term's row and the year row, cell by cell — P T A E D, meetings, percentage. */
        && JSON.stringify(reopened.openTerm)
          === JSON.stringify(['WO-2.53 term — open', '1', '0', '0', '0', '1', '2', '100%'])
        && JSON.stringify(undone.openTerm)
          === JSON.stringify(['WO-2.53 term — open', '1', '0', '1', '0', '0', '2', '50%'])
        && JSON.stringify(reopened.year)
          === JSON.stringify(['Whole year', '1', '0', '0', '0', '1', '2', '100%'])
        && JSON.stringify(undone.year)
          === JSON.stringify(['Whole year', '1', '0', '1', '0', '0', '2', '50%'])
        /* The day-by-day table: today's row is the second of the two, and its mark is a word. */
        && reopened.days.length === 2 && undone.days.length === 2
        && reopened.days[1][1] === 'Dismissed' && undone.days[1][1] === 'Absent'
        && reopened.days[1][2] === '2 of 2 · 100%' && undone.days[1][2] === '1 of 2 · 50%'
        /* And the grid behind the dialog, which is the surface that repaints itself. */
        && undone.grid.dismissed.code === '?'
        && undone.entry === JSON.stringify({ code: 'U' }),
      'rate ' + JSON.stringify(reopened.rate) + ' -> ' + JSON.stringify(undone.rate)
        + ' :: term ' + JSON.stringify(reopened.openTerm) + ' -> '
        + JSON.stringify(undone.openTerm) + ' :: year ' + JSON.stringify(reopened.year) + ' -> '
        + JSON.stringify(undone.year) + ' :: today\'s row ' + JSON.stringify(reopened.days[1])
        + ' -> ' + JSON.stringify(undone.days[1]) + ' :: the cell behind it reads '
        + JSON.stringify(undone.grid.dismissed.code) + ' and the entry is ' + undone.entry);
    check('and the block redraws as the case it now is — the un-confirmed hint, and neither control',
      undone.block && !undone.hasNote && undone.unconfirms === 0
        && undone.hint.indexOf('Nobody has confirmed this student yet') === 0
        && undone.mark === 'Not confirmed',
      JSON.stringify(undone.mark) + ' :: ' + JSON.stringify(undone.hint)
        + ' :: field = ' + undone.hasNote + ', un-confirm(s) = ' + undone.unconfirms);
    await shut();

    /* ── case 2: a confirmed present student ── */
    const onP = await openFor(P_ID);
    check('a confirmed present student gets the un-confirm and the sentence saying why there is nothing to note',
      onP.block && !onP.hasNote && onP.unconfirms === 1 && onP.mark === 'Present'
        && onP.hint.indexOf('Present is stored as no mark at all') === 0,
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
    check('a day the class did not meet draws no write block — there is no mark on it to edit, and no path through the dialog that would make one',
      onDropped.dialogUp && !onDropped.block && onDropped.blocks === 0
        && !onDropped.hasNote && onDropped.unconfirms === 0
        && onDropped.year[0] === 'Whole year',
      'dialog up = ' + onDropped.dialogUp + ', block(s) = ' + onDropped.blocks
        + ', field = ' + onDropped.hasNote + ', un-confirm(s) = ' + onDropped.unconfirms
        + '; the year row is still drawn: ' + JSON.stringify(onDropped.year));
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
      s.update(function(){ cls.terms = [{ id:'tm_wo253over', label:'WO-2.53 ended',
        start: iso(-60), end: iso(-30) }]; });
      await s.flush();
      c.selectTerm('tm_wo253over');
      a.renderAttendance();
      return { end: iso(-30) }; })()`);
    const onLocked = await openFor(D_ID);
    check('with the strip standing on a past day that has not been unlocked, the dialog draws no write block — the day it writes on is the day the registry accepts writes on, and there is none',
      onLocked.dialogUp && !onLocked.block && onLocked.blocks === 0
        && !onLocked.hasNote && onLocked.unconfirms === 0,
      'the selected term ended ' + ended.end + '; dialog up = ' + onLocked.dialogUp
        + ', block(s) = ' + onLocked.blocks + ', field = ' + onLocked.hasNote
        + ', un-confirm(s) = ' + onLocked.unconfirms);
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
