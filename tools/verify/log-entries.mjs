/* log-entries.mjs — the log, written down (WO-4.4)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export async function run(h) {
const { ROOT, check, skip, send, evalJs, has, clickSel, clickVisible, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── the log, written down (WO-4.4) ─────────
 *
 * FOUR ACCEPTANCE LINES AND A HALF OF A FIFTH. What a headless browser can settle about this work
 * order is what was WRITTEN, what is DRAWN, and what is ABSENT; what it cannot settle is the one
 * the work order leads with — *an entry is logged in under five seconds from the roster* — because
 * five seconds is a thumb, a lock screen and a class walking through a door. This section measures
 * the taps rather than the clock: the door, the chip, and the entry existing afterwards. The
 * stopwatch stays owed to a human (TESTING.md § WO-4.4).
 *
 * THE FIXTURE IS DATED FROM BOTH ENDS, and it has to be. The absence half counts recorded MEETINGS
 * through today, so its ten meetings sit in the past; the behavior half counts DAYS since an entry
 * was written, so its entries are stamped relative to today at plant time. A fixture that put both
 * in June would have a behavior rule measuring a window that closed two months ago and reporting an
 * honest zero — which passes on a build that counts nothing at all.
 *
 * THE TERM RUNS THROUGH TODAY on purpose. src/attendance.js refuses a mark on a day outside every
 * term of the class (offTermDay), and the absence prompt fires off a mark landing on `A` TODAY —
 * so a June term would make the whole of Acceptance line 5 unreachable through the real controls.
 *
 * FOUR STUDENTS, EACH CARRYING ONE ANSWER:
 *
 *   Ada    five absences and an attendance clause on file. Acceptance line 5's yes.
 *   Ben    the same five absences and NO clause. Acceptance line 5's "if one exists" — the prompt
 *          has to stay away, and a build that raised an empty box for him would look correct on Ada.
 *   Cyd    two behavior entries inside the window, one behavior entry forty days old, and one note.
 *          Acceptance line 3's count is 2, and each of the other two rows is a different way to get
 *          3 or 4 by mistake.
 *   Dov    one behavior entry inside the window. Under the threshold of 2, so the rule must be
 *          silent for him — the control that separates "the rule counts" from "the rule fires".
 */
console.log('\n--- the log, written down (WO-4.4) ---');
if (!seam) {
  skip('the behavior and note log (WO-4.4)', 'window.planbook is not on the page, so nothing here '
    + 'can write an entry, read what the card drew, or put the document back');
} else {
  const CLS44 = 'c_wo44';
  const TERM44 = 'tm_wo44';
  const ADA = 's_wo44abs', BEN = 's_wo44noc', CYD = 's_wo44log', DOV = 's_wo44one';
  /* Surnames and phrases nothing else in this repository contains, so "the behavior entry is not in
     the page" is a SEARCH over everything that was rendered rather than an inspection of the fields
     somebody remembered to look at. WO-6.3's technique, pointed at this work order's own risk. */
  const CLAUSE44 = 'Wo44ClauseAbsencesExcusedPerPlan';
  const BEHAV44 = 'Wo44BehaviourSubjectOne';
  const BEHAV44B = 'Wo44BehaviourSubjectTwo';
  const OLD44 = 'Wo44BehaviourSubjectOld';
  const NOTE44 = 'Wo44NoteToSelfSubject';
  const BODY44 = 'Wo44BodyTextOnTheBehaviourEntry';

  const onView44 = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  /*
    BACK TO THE GRID, AND IT ASKS WHETHER IT IS ALREADY THERE FIRST. Every copy of this walk in this
    file throws when no `[data-view-home]` is visible, which is correct on a class screen and wrong
    on the grid itself: that control is drawn on the screens you leave, not on the one you arrive at.
    The section above this one hands the page back on #homeView, so the first call would have thrown
    — and a throw here is not a red check, it is the whole rest of the file not running
    (tools/README.md § "Driving a browser over CDP", trap 3's neighbour). Asked rather than assumed.
  */
  async function goHome44() {
    const already = await evalJs(`(function(){ var v = document.getElementById('homeView');
      return !!v && !v.classList.contains('hidden'); })()`);
    if (already) return;
    const nth = await evalJs(`(function(){
      var all = document.querySelectorAll('[data-view-home]');
      for (var i = 0; i < all.length; i++) {
        var r = all[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return i;
      }
      return -1; })()`);
    if (nth < 0) throw new Error('no visible [data-view-home] on this screen');
    await clickSel('[data-view-home]', nth);
    await new Promise(r => setTimeout(r, 250));
  }
  /* Everything this section ever wants to know about the document's log, in one reader, so no check
     below carries a second copy of "which entries are this student's". */
  const READ_LOG = `(function(){
    var d = window.planbook.store.getDoc();
    var rows = (d && d.log) || [];
    return { total: rows.length,
      mine: rows.filter(function(e){ return String(e.studentId).indexOf('s_wo44') === 0; })
        .map(function(e){ return { keys: Object.keys(e), id: e.id, studentId: e.studentId,
          at: e.at, kind: e.kind, audience: e.audience, subject: e.subject, body: e.body }; }) };
  })()`;

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture ── */
  const plant44 = await evalJs(`(function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var wasClass = window.planbook.classes.getSelectedClassId();
    var mode = window.planbook.supports.presentationMode();
    var today = window.planbook.attendance.todayISO();
    function pad(n){ return (n < 10 ? '0' : '') + n; }
    /* An entry's own stamp, N days back, built the way src/log.js builds one — local, with its
       offset, never a Z. A UTC stamp here would put an entry written at 8pm on the following day
       for the whole of the eastern hemisphere, and the window is counted in days. */
    function stampBack(days){
      var t = new Date();
      t.setDate(t.getDate() - days);
      var off = -t.getTimezoneOffset();
      var sign = off < 0 ? '-' : '+';
      var abs = Math.abs(off);
      return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate())
        + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds())
        + sign + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);
    }
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.log)) doc.log = [];
      doc.students.push({ id:'${ADA}', first:'Ada', last:'Wo44Absentee',
        supports: { plan:'IEP', caseManager:{ name:'', email:'' }, reviewDate:'',
          accommodations:[], medical:'', behaviorPlan:'',
          attendanceClause:'${CLAUSE44}' } });
      /* Ben carries a support block with an EMPTY clause rather than no block at all, which is the
         harder of the two negatives: a build that tested for the block instead of for the clause
         would raise a prompt with nothing in it. */
      doc.students.push({ id:'${BEN}', first:'Ben', last:'Wo44Noclause',
        supports: { plan:'504', caseManager:{ name:'', email:'' }, reviewDate:'',
          accommodations:[], medical:'', behaviorPlan:'', attendanceClause:'' } });
      doc.students.push({ id:'${CYD}', first:'Cyd', last:'Wo44Logged' });
      doc.students.push({ id:'${DOV}', first:'Dov', last:'Wo44Under' });
      doc.classes.push({ id:'${CLS44}', name:'WO-4.4 Log', archived:false,
        roster:['${ADA}','${BEN}','${CYD}','${DOV}'], letterScale:null,
        /* Through today, so the registry will accept a mark — see the section header. */
        terms:[{ id:'${TERM44}', label:'WO-4.4 Term', start:'2026-06-01', end:'2027-06-30' }],
        categories:[{ id:'k_wo44', name:'All work', weight:100 }] });
      /* Ten recorded meetings in June, five of them absences for Ada and Ben. Five is one clear of
         the documented threshold of four, so the rule fires with a number the sentence can print. */
      for (var i = 1; i <= 10; i++) {
        var marks = {};
        if (i <= 5) { marks['${ADA}'] = { code:'A' }; marks['${BEN}'] = { code:'A' }; }
        doc.attendance.push({ classId:'${CLS44}', date:'2026-06-' + pad(i), marks: marks });
      }
      /* Cyd: two inside the window, one outside it, one that is a note rather than an incident.
         Written straight onto the document rather than through writeEntry() so that the DATES are
         the fixture's rather than the clock's — the write path is driven through the real controls
         further down, which is where the record's own shape is asserted. */
      doc.log.push({ id:'l_wo44a', studentId:'${CYD}', at: stampBack(1), kind:'behavior',
        audience:'', subject:'${BEHAV44}', body:'${BODY44}' });
      doc.log.push({ id:'l_wo44b', studentId:'${CYD}', at: stampBack(6), kind:'behavior',
        audience:'', subject:'${BEHAV44B}', body:'' });
      doc.log.push({ id:'l_wo44c', studentId:'${CYD}', at: stampBack(40), kind:'behavior',
        audience:'', subject:'${OLD44}', body:'' });
      doc.log.push({ id:'l_wo44d', studentId:'${CYD}', at: stampBack(3), kind:'note',
        audience:'', subject:'${NOTE44}', body:'' });
      doc.log.push({ id:'l_wo44e', studentId:'${DOV}', at: stampBack(2), kind:'behavior',
        audience:'', subject:'Wo44DovOnlyEntry', body:'' });
    });
    return { ok:true, wasClass: wasClass, mode: mode, today: today,
      students: window.planbook.store.getDoc().students.length,
      log: window.planbook.store.getDoc().log.length };
  })()`);

  if (!plant44.ok) {
    check('WO-4.4 fixture: a class through today, four students, ten recorded meetings and five '
      + 'log entries', false, plant44.why);
  } else {
    check('WO-4.4 fixture: a class whose term runs through today, four students, ten recorded '
      + 'meetings with five absences apiece on two of them, and five log entries stamped relative '
      + 'to the clock rather than to a fixed date',
      plant44.log >= 5 && plant44.students >= 4 && !!plant44.today,
      plant44.log + ' log row(s) in the document over ' + plant44.students
        + ' student(s); today is ' + plant44.today + ', presentation mode was ' + plant44.mode);

    /*
      AND THE APP IS BOOTED AGAIN ON TOP OF IT, which is WO-4.2's own note one section up and the
      same trap: the home grid was painted at the boot ABOVE, before this fixture existed, so its
      cards are the ones the document had then — and clicking for a class card no screen has drawn
      is a `nothing to click` that kills the run rather than a red check. A reload is the honest way
      to get one: it is the state a teacher's own app is in, and it proves the seed reached storage
      rather than only the object in memory.
    */
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);

    /* ══ the record, and what a chip writes ══ */

    /*
      THE SIX SHIP FIXED AND A CHIP WRITES A SUBJECT (the owner, 2026-08-20). Both halves are
      asserted because only one of them is visible: the ORDER is what a teacher's thumb learns, and
      the VALUE is what keeps a per-teacher list later a settings block rather than a migration. A
      build whose chips carried `data-log-quick="3"` would look identical on screen and would have
      spent that decision.
    */
    const quick44 = await evalJs(`(function(){
      var q = window.planbook.log.QUICK_ENTRIES;
      return { subjects: q.map(function(e){ return e.subject; }),
        marks: q.map(function(e){ return e.mark; }),
        kinds: window.planbook.log.LOG_KINDS.map(function(k){ return k.value; }) };
    })()`);
    check('the six quick entries are the six the owner ruled, in that order, with the middle ground '
      + 'fourth — the first slot after the conduct entries — and both directions in one sheet',
      JSON.stringify(quick44.subjects) === JSON.stringify(
        ['Off task', 'Phone out', 'Disruptive', 'Showing improvement', 'Great contribution',
          'Helped someone'])
        && JSON.stringify(quick44.kinds) === JSON.stringify(['behavior', 'note']),
      'the chips read ' + JSON.stringify(quick44.subjects) + ' over kinds '
        + JSON.stringify(quick44.kinds));

    /* ══ two taps from the roster ══ */

    await goHome44();
    await clickSel('#homeGrid [data-class-tab="' + CLS44 + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickVisible('[data-roster-manage]');
    await new Promise(r => setTimeout(r, 250));
    const door44 = await evalJs(`(function(){
      var rows = document.querySelectorAll('#rosterList .roster-row');
      var doors = document.querySelectorAll('#rosterList [data-log-open]');
      var mine = document.querySelector('[data-log-open="${CYD}"]');
      return { rows: rows.length, doors: doors.length, mine: !!mine,
        label: mine ? (mine.getAttribute('aria-label') || '') : '',
        first: rows.length ? (rows[0].querySelector('[data-log-open]') ===
          rows[0].querySelector('.roster-row-actions > *')) : false }; })()`);
    check('tap one is on the ROSTER and on every row of it — one ✎ per student, leading the row’s '
      + 'own actions, and named for the student it writes about (the door is deliberately not on '
      + 'the attendance registry, whose row is the critical path)',
      door44.rows === 4 && door44.doors === 4 && door44.mine === true
        && door44.first === true && /Wo44Logged/.test(door44.label),
      door44.doors + ' door(s) over ' + door44.rows + ' row(s); the first action in a row is the '
        + 'door = ' + door44.first + ', labelled ' + JSON.stringify(door44.label));

    await clickSel('[data-log-open="' + CYD + '"]');
    await new Promise(r => setTimeout(r, 250));
    const sheet44 = await evalJs(`(function(){
      var m = document.getElementById('logSheetModal');
      var open = !!m && !m.classList.contains('hidden');
      var chips = Array.prototype.map.call(m.querySelectorAll('[data-log-quick]'),
        function(b){ return b.getAttribute('data-log-quick'); });
      var kinds = Array.prototype.map.call(m.querySelectorAll('[data-log-kind]'),
        function(b){ return b.getAttribute('data-log-kind') +
          (b.classList.contains('active') ? '*' : ''); });
      var strip = m.querySelector('.log-kinds');
      var grid = m.querySelector('.log-quick-grid');
      return { open: open, chips: chips, kinds: kinds,
        title: (m.querySelector('#logSheetTitle') || {}).textContent || '',
        /* THE STRIP IS ABOVE THE WORDS, and it is a position rather than a preference: the log is
           append-only, so a wrong kind can only be annotated afterwards. */
        stripFirst: !!strip && !!grid
          && strip.compareDocumentPosition(grid) === Node.DOCUMENT_POSITION_FOLLOWING,
        appendNote: !!m.querySelector('.log-append-note'),
        student: window.planbook.logSheet.logSheetStudent() }; })()`);
    check('tap two is the sheet, and it opens on the student the door named — the kind strip ABOVE '
      + 'the six chips, behavior selected, and the append-only sentence on the screen where the '
      + 'entry is written rather than only where it is read',
      sheet44.open === true && sheet44.student === CYD
        && JSON.stringify(sheet44.kinds) === JSON.stringify(['behavior*', 'note'])
        && sheet44.stripFirst === true && sheet44.appendNote === true
        && /Wo44Logged/.test(sheet44.title),
      'the sheet is open on ' + JSON.stringify(sheet44.title) + ' for ' + sheet44.student
        + '; kinds ' + JSON.stringify(sheet44.kinds) + ', strip before the chips = '
        + sheet44.stripFirst);
    check('and the chip carries its SUBJECT rather than a code, which is the one constraint that '
      + 'keeps a per-teacher list later a settings block instead of a migration',
      JSON.stringify(sheet44.chips) === JSON.stringify(quick44.subjects),
      'the six hooks read ' + JSON.stringify(sheet44.chips));

    const beforeWrite = await evalJs(READ_LOG);
    await clickSel('[data-log-quick="Phone out"]');
    await new Promise(r => setTimeout(r, 250));
    const afterWrite = await evalJs(`(function(){
      var m = document.getElementById('logSheetModal');
      var read = ${READ_LOG};
      read.sheetOpen = !!m && !m.classList.contains('hidden');
      return read; })()`);
    const written = afterWrite.mine.filter((e) => e.subject === 'Phone out')[0] || null;
    check('one tap on a chip writes a COMPLETE record and closes the sheet: the seven fields '
      + 'docs/data-model.md names and no eighth, the kind off the strip, the subject in the chip’s '
      + 'own words, a local timestamp carrying its offset, and an audience of nobody (Acceptance '
      + 'line 1’s mechanism — the five seconds themselves are 👤)',
      afterWrite.mine.length === beforeWrite.mine.length + 1
        && !!written
        && JSON.stringify(written.keys) === JSON.stringify(
          ['id', 'studentId', 'at', 'kind', 'audience', 'subject', 'body'])
        && written.kind === 'behavior' && written.audience === '' && written.body === ''
        && written.studentId === CYD
        && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/.test(written.at)
        && afterWrite.sheetOpen === false,
      written
        ? 'the entry wrote ' + JSON.stringify(written.keys) + ' = ' + JSON.stringify(written)
          + '; the sheet closed = ' + (afterWrite.sheetOpen === false)
        : 'no entry with the chip’s subject was written; the log went '
          + beforeWrite.mine.length + ' -> ' + afterWrite.mine.length);

    /* ══ append-only ══ */

    /*
      A CORRECTION IS AN ORDINARY LATER ENTRY THAT SAYS SO (the owner, 2026-08-20, after a round
      trip). This is Acceptance line 2 done the way it asks — *verify by inspecting the document
      after a "correction"* — so the wrong entry is read byte for byte before and after, and what
      the check refuses is any difference at all: not a changed subject, not a new field, not a
      removal. The ruling that arrived first was "you can just delete and re-enter", and the build
      that implemented it would pass every other check in this section.
    */
    const wrong = written;
    await clickSel('[data-log-open="' + CYD + '"]');
    await new Promise(r => setTimeout(r, 250));
    await evalJs(`(function(){
      var s = document.getElementById('logSheetSubject');
      var b = document.getElementById('logSheetBody');
      s.value = 'Wo44CorrectionEntry';
      b.value = 'It was a calculator, not a phone.';
      return 1; })()`);
    await clickSel('[data-log-write]');
    await new Promise(r => setTimeout(r, 250));
    const afterCorrection = await evalJs(READ_LOG);
    const stillThere = afterCorrection.mine.filter((e) => e.id === (wrong && wrong.id))[0] || null;
    const correction = afterCorrection.mine.filter(
      (e) => e.subject === 'Wo44CorrectionEntry')[0] || null;
    check('a "correction" appends and changes nothing: the entry it corrects is still in the '
      + 'document, byte for byte, and the later one sits beside it — no correctsId, no removal, no '
      + 'edit (Acceptance line 2, verified by inspecting the document)',
      afterCorrection.mine.length === afterWrite.mine.length + 1
        && !!stillThere && !!wrong
        && JSON.stringify(stillThere) === JSON.stringify(wrong)
        && !!correction && correction.body === 'It was a calculator, not a phone.'
        && JSON.stringify(correction.keys) === JSON.stringify(
          ['id', 'studentId', 'at', 'kind', 'audience', 'subject', 'body']),
      'the log went ' + afterWrite.mine.length + ' -> ' + afterCorrection.mine.length
        + '; the corrected entry now reads ' + JSON.stringify(stillThere)
        + ' against ' + JSON.stringify(wrong));

    /*
      AND THERE IS NOTHING IN THE MODULE TO DELETE WITH — read off the file rather than driven,
      which is the posture tools/wo-sweep.mjs § 17 takes about src/calendar-derived.js and for the
      same reason: driving proves what today's paths did, and a grep proves there is nothing in the
      file that could do otherwise on any input. One `push` and no `splice`, `pop`, `shift`, `delete`
      or assignment into `d.log[...]`.
    */
    const logSource = await fs.readFile(path.join(ROOT, 'src/log.js'), 'utf8');
    const bodyOnly = logSource.replace(/\/\*[\s\S]*?\*\//g, '\n').replace(/^\s*\/\/.*$/gm, '');
    const pushes = (bodyOnly.match(/\.push\(/g) || []).length;
    /*
      THE CREATE-ON-FIRST-WRITE GUARD IS NOT A REMOVER, AND A FLAT '.log =' TOKEN CALLED IT ONE.
      `if (!Array.isArray(d.log)) d.log = [];` is CLAUDE.md's own rule — a block is created by its
      first write and never seeded — and it can only ever fire when there is no array there to take
      an entry away from. That token went red on correct code, while the thing this check was
      actually written for — an assignment INTO d.log[...], which the comment above asks for in as
      many words — had no token at all. So the guard is lifted out by name before the search, any
      other reassignment still counts, and index assignment is now genuinely looked for.
    */
    const initGuard = /if (!Array.isArray(d.log))s*d.log = [];/;
    const guarded = initGuard.test(bodyOnly);
    const searchable = bodyOnly.replace(initGuard, '');
    const removers = ['.splice(', '.pop(', '.shift(', 'delete d.log', 'delete doc.log'];
    const found = removers.filter((token) => searchable.indexOf(token) >= 0)
      .concat(/.logs*=[^=]/.test(searchable) ? ['reassignment of .log'] : [])
      .concat(/.logs*[[^]]*]s*=[^=]/.test(searchable) ? ['assignment into .log[...]'] : []);
    check('append-only is structural rather than promised: src/log.js does exactly one thing to the '
      + 'document, and there is no splice, pop, shift, delete or reassignment anywhere in its code '
      + 'that could ever remove an entry',
      pushes === 1 && found.length === 0,
      pushes + ' push(s) in ' + bodyOnly.split('\n').length + ' line(s) of code; the create-on-first-write guard is present = ' + guarded + '; removers found: '
        + (found.length ? JSON.stringify(found) : 'none'));

    /* ══ the card on the student record ══ */

    /* Onto the student record through the door a teacher has, not through the module: the › at
       the end of the registry row (WO-2.53). The roster panel is shut first — it is a modal over
       this very screen, and clickSel would otherwise measure a row behind a scrim. */
    await evalJs("window.planbook.closeModal('rosterModal'); 1");
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-student-detail="' + CYD + '"]');
    await new Promise(r => setTimeout(r, 300));

    const card44 = await evalJs(`(function(){
      var card = document.querySelector('#detailView .log-card');
      if (!card) return { ok:false, why:'no .log-card on the student record' };
      var subs = Array.prototype.map.call(card.querySelectorAll('.log-entry-subject'),
        function(e){ return e.textContent; });
      var kinds = Array.prototype.map.call(card.querySelectorAll('.log-entry-kind'),
        function(e){ return e.textContent; });
      return { ok:true, subs: subs, kinds: kinds,
        title: (card.querySelector('.detail-card-title') || {}).textContent || '',
        more: !!card.querySelector('[data-log-more]'),
        moreText: (card.querySelector('[data-log-more]') || {}).textContent || '',
        text: (card.textContent || '').replace(/\\s+/g, ' '),
        view: (document.querySelector('main > :not(.hidden)') || {}).id || '' }; })()`);
    check('the log is on the student record, newest first, as another .detail-card on WO-3.7’s '
      + 'screen — with the older entries behind one tap rather than all of them at once',
      card44.ok === true && card44.view === 'detailView'
        && card44.subs.length === 4 && card44.subs[0] === 'Wo44CorrectionEntry'
        && card44.subs[1] === 'Phone out' && card44.subs[2] === BEHAV44
        && card44.more === true && /older entr/.test(card44.moreText),
      card44.ok
        ? 'the card drew ' + JSON.stringify(card44.subs) + ' under ' + JSON.stringify(card44.title)
          + ', with ' + JSON.stringify(card44.moreText.trim()) + ' under it'
        : card44.why);

    await clickSel('#detailView [data-log-more]');
    await new Promise(r => setTimeout(r, 250));
    const opened44 = await evalJs(`(function(){
      var card = document.querySelector('#detailView .log-card');
      return { subs: Array.prototype.map.call(card.querySelectorAll('.log-entry-subject'),
        function(e){ return e.textContent; }),
        bodies: Array.prototype.map.call(card.querySelectorAll('.log-entry-body'),
          function(e){ return e.textContent; }) }; })()`);
    check('the rest are one tap away and every entry ever written is in the list — including the '
      + 'forty-day-old one the signal rule will not count, because a log that hid what it no longer '
      + 'counts would be a log nobody could read in a meeting',
      opened44.subs.length === 6
        && opened44.subs.indexOf(OLD44) >= 0 && opened44.subs.indexOf(NOTE44) >= 0
        && opened44.bodies.indexOf(BODY44) >= 0,
      opened44.subs.length + ' entr(ies) drawn: ' + JSON.stringify(opened44.subs));

    /* ══ presentation mode ══ */

    /*
      ACCEPTANCE LINE 4, AND IT IS THE ONE THAT NEEDS BOTH READINGS. A card that built its entries
      and then styled them away and a card that never received them look identical to a teacher and
      differ in exactly the thing WO-1.9's standard is about — so the model is asked what it handed
      over AND the rendered page is searched for the entries' own words.
    */
    await evalJs('window.planbook.supports.setPresentationMode(true); '
      + "window.planbook.detail.renderDetail(); 1");
    await new Promise(r => setTimeout(r, 200));
    const projected44 = await evalJs(`(function(){
      var card = document.querySelector('#detailView .log-card');
      var page = document.body.innerHTML;
      var d = window.planbook.store.getDoc();
      return { card: !!card,
        subs: card ? Array.prototype.map.call(card.querySelectorAll('.log-entry-subject'),
          function(e){ return e.textContent; }) : [],
        text: card ? (card.textContent || '').replace(/\\s+/g, ' ') : '',
        behaviourInPage: page.indexOf('${BEHAV44}') >= 0 || page.indexOf('${BEHAV44B}') >= 0
          || page.indexOf('${BODY44}') >= 0,
        noteInPage: page.indexOf('${NOTE44}') >= 0,
        handed: window.planbook.log.visibleEntriesFor(d, '${CYD}')
          .map(function(e){ return e.kind; }),
        all: window.planbook.log.entriesFor(d, '${CYD}').length }; })()`);
    check('under a projector the behavior entries are ABSENT from the page rather than redacted — '
      + 'not their subjects, not their bodies, not a count of them — and the notes to self STAY, '
      + 'because a teacher’s own working memory is not the app’s to hide from her (Acceptance line 4)',
      projected44.card === true
        && projected44.behaviourInPage === false && projected44.noteInPage === true
        && JSON.stringify(projected44.handed) === JSON.stringify(['note'])
        && projected44.all === 6,
      'the model handed over ' + JSON.stringify(projected44.handed) + ' of '
        + projected44.all + ' entries; the behavior words are in the page = '
        + projected44.behaviourInPage + ', the note is = ' + projected44.noteInPage
        + '; the card drew ' + JSON.stringify(projected44.subs));
    check('and there is no "N hidden" line, no count and no ellipsis standing where they were — a '
      + 'count is itself the disclosure, which is why the card simply holds fewer rows',
      /hidden|suppress|redact/i.test(projected44.text) === false
        && / 5 | 6 |older entr/i.test(projected44.text) === false,
      'the card reads ' + JSON.stringify(projected44.text.slice(0, 200)));

    /*
      AND THE EMPTY SENTENCE IS THE SAME SENTENCE IN BOTH MODES, which is the half of this rule that
      is invisible until somebody looks for it. Dov has one behavior entry and nothing else: with the
      mode on his card is empty, and it has to read exactly as a student with nothing written down
      reads — any wording that could tell the two apart is the count arriving by another route.
    */
    const empties44 = await evalJs(`(function(){
      /* studentLogCard() builds DOM and appends it nowhere, so this asks the builder rather than
         the screen — which is the only way to put four cards side by side in one reading. */
      function cardFor(id, mode){
        window.planbook.supports.setPresentationMode(mode);
        var el = window.planbook.logSheet.studentLogCard(id);
        return (el.textContent || '').replace(/\\s+/g, ' ').trim();
      }
      var dovProjected = cardFor('${DOV}', true);
      var adaProjected = cardFor('${ADA}', true);
      var adaPlain = cardFor('${ADA}', false);
      var dovPlain = cardFor('${DOV}', false);
      window.planbook.supports.setPresentationMode(false);
      return { dovProjected: dovProjected, adaProjected: adaProjected, adaPlain: adaPlain,
        dovPlain: dovPlain }; })()`);
    check('a student whose every entry is suppressed reads EXACTLY as a student who has none — same '
      + 'sentence, no "yet" that means one thing for one of them, so the card cannot be used to '
      + 'tell the two apart from across a room',
      empties44.dovProjected === empties44.adaProjected
        && empties44.adaProjected === empties44.adaPlain
        && empties44.dovPlain !== empties44.dovProjected,
      'suppressed: ' + JSON.stringify(empties44.dovProjected.slice(0, 90))
        + ' · genuinely empty: ' + JSON.stringify(empties44.adaPlain.slice(0, 90))
        + ' · the same student unsuppressed differs = '
        + (empties44.dovPlain !== empties44.dovProjected));

    /* ══ the sheet is not a print surface ══ */

    await evalJs('window.planbook.supports.setPresentationMode(false); '
      + 'window.planbook.detail.renderDetail(); 1');
    await new Promise(r => setTimeout(r, 250));
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 120));
    const printed44 = await evalJs(`(function(){
      var b = document.querySelector('#detailView [data-detail-sheet-print]');
      if (!b) return { ok:false, why:'no Print control on the open Student Report screen' };
      window.__realPrint44 = window.print;
      window.print = function(){
        var v = document.getElementById('detailView');
        var high = function(e){ return e ? Math.round(e.getBoundingClientRect().height) : -1; };
        var cards = Array.prototype.slice.call(v.querySelectorAll('.detail-card'));
        var pass = cards.filter(function(c){
          var t = c.querySelector('.detail-card-title');
          return t && (t.textContent || '').indexOf('Hall passes') === 0; })[0] || null;
        window.__wo44print = { attr: document.body.hasAttribute('data-detail-print'),
          logH: high(v.querySelector('.log-card')), passH: high(pass),
          heroH: high(v.querySelector('.detail-hero')),
          sheet: (v.innerText || '').replace(/\\s+/g, ' ') };
        window.__wo44calls = (window.__wo44calls || 0) + 1;
      };
      var stubbed = window.print !== window.__realPrint44;
      b.click();
      var out = { ok:true, stubbed: stubbed, calls: window.__wo44calls || 0,
        sheet: window.__wo44print || null };
      window.print = window.__realPrint44;
      delete window.__realPrint44; delete window.__wo44print; delete window.__wo44calls;
      window.dispatchEvent(new Event('afterprint'));
      return out; })()`);
    await send('Emulation.setEmulatedMedia', { media: '' });
    /*
      THE SHEET IS READ AS RENDERED TEXT, NOT AS textContent. This screen's print gate is CSS —
      body[data-detail-print] .log-card { display: none !important } in src/detail.css, which is
      the same mechanism every other row of the sheet is built with and the one WO-2.26 shipped.
      textContent cannot tell a card that is hidden from a card that is drawn, so it reported the
      log card's every subject as being on the paper while the card measured 0px beside it — two
      instruments in one check disagreeing, with the wrong one deciding. innerText is the text a
      reader would actually get, which is the question the acceptance line asks. The height
      measurement stays: between them they say the box is gone AND its words went with it.
    */
    const sheetOf44 = printed44.ok ? printed44.sheet : null;
    check('the log card is the one thing on that screen that does NOT go home on paper — at the '
      + 'instant the sheet is taken it has no box at all while the hall-pass card beside it does, '
      + 'and not a word of any entry is on the page (the departure from WO-2.26’s rule, argued at '
      + 'src/detail.js’s own import)',
      printed44.ok === true && printed44.stubbed === true && printed44.calls === 1
        && !!sheetOf44 && sheetOf44.attr === true
        && sheetOf44.logH === 0 && sheetOf44.passH > 0 && sheetOf44.heroH > 0
        && sheetOf44.sheet.indexOf(BEHAV44) < 0
        && sheetOf44.sheet.indexOf(NOTE44) < 0,
      printed44.ok
        ? 'window.print() calls from one tap = ' + printed44.calls + ', gate on at the snapshot = '
          + (sheetOf44 && sheetOf44.attr) + '; the log card measured '
          + (sheetOf44 && sheetOf44.logH) + 'px beside a ' + (sheetOf44 && sheetOf44.passH)
          + 'px hall-pass card and a ' + (sheetOf44 && sheetOf44.heroH) + 'px hero'
          + '; an entry subject on the rendered sheet = '
          + (!!sheetOf44 && (sheetOf44.sheet.indexOf(BEHAV44) >= 0
            || sheetOf44.sheet.indexOf(NOTE44) >= 0))
        : printed44.why);

    const csv44 = await evalJs(`(function(){
      /* studentCsv() RETURNS { name, text } AND NOT A STRING. Stringifying it gave the literal
         '[object Object]' — 15 characters that contain no subject, so both negatives below came
         back clean while nothing had read the CSV at all. Only the length floor caught it, which
         is why that floor is here: a negative measured against an empty haystack proves nothing. */
      var out = window.planbook.detail.studentCsv(window.planbook.detail.detailModel());
      var t = out && typeof out.text === 'string' ? out.text : null;
      return { has: t !== null, behav: t !== null && t.indexOf('${BEHAV44}') >= 0,
        note: t !== null && t.indexOf('${NOTE44}') >= 0, len: t === null ? 0 : t.length }; })()`);
    check('and it is not in the CSV either — studentCsv() is untouched, which is the boundary '
      + 'WO-2.26 drew around that file with an argument this work order now has of its own',
      csv44.has === true && csv44.behav === false && csv44.note === false && csv44.len > 40,
      csv44.len + ' bytes of CSV; the behavior subject is in it = ' + csv44.behav
        + ', the note subject = ' + csv44.note);

    /* ══ the signal rule ══ */

    /*
      ACCEPTANCE LINE 3: the entries feed WO-4.2's behavior rule AND THE COUNT MATCHES. Cyd's four
      pre-planted rows are three different ways to get the wrong number — an entry outside the
      window, a note rather than an incident, and the two that genuinely count — plus the two
      written through the sheet above, which are inside the window and are behavior. So the answer
      is 4, and a build that counted notes would say 5, one that ignored the window would say 5, and
      one that did both would say 6.
    */
    const rule44 = await evalJs(`(function(){
      var d = window.planbook.store.getDoc();
      var cls = d.classes.filter(function(c){ return c.id === '${CLS44}'; })[0];
      var hits = window.planbook.signals.evaluate(d, cls, '${TERM44}');
      var mine = hits.filter(function(h){ return h.ruleId === 'behavior-window'; });
      return { inert: window.planbook.signals.inertRules().length,
        fired: mine.map(function(h){ return { who: h.studentId, n: h.numbers.entries,
          days: h.numbers.days, need: h.numbers.need, said: h.explanation }; }),
        counted: window.planbook.log.behaviorCountSince(d, '${CYD}',
          window.planbook.attendance.todayISO(), 30),
        held: window.planbook.log.entriesFor(d, '${CYD}').length }; })()`);
    const cydHit = rule44.fired.filter((h) => h.who === CYD)[0] || null;
    check('the behavior entries feed WO-4.2’s ninth rule and the count matches what is in the '
      + 'document: four inside the window out of six entries, with the forty-day-old one and the '
      + 'note to self both left out — and the rule is no longer inert (Acceptance line 3)',
      rule44.inert === 0 && rule44.fired.length === 1 && !!cydHit
        && cydHit.n === 4 && cydHit.need === 2 && cydHit.days === 30
        && rule44.counted === 4 && rule44.held === 6
        && /4 behavior notes in the last 30 days/.test(cydHit.said),
      'inertRules() names ' + rule44.inert + '; the rule fired for '
        + JSON.stringify(rule44.fired) + '; the model counts ' + rule44.counted
        + ' of ' + rule44.held + ' entries held');
    check('and the student under the threshold is not on the list at all — one entry against a line '
      + 'of two, which is what separates a rule that counts from a rule that merely fires',
      rule44.fired.every((h) => h.who !== DOV),
      'the rule fired for ' + JSON.stringify(rule44.fired.map((h) => h.who))
        + ' and Dov holds one entry');

    /*
      AND THE MODE DOES NOT REACH THE ARITHMETIC. A rule whose count fell when the projector went on
      would make the concern list disagree with itself twice a day, and the suppression is a fact
      about a SCREEN. Asked the hard way — the same evaluate() call, with the mode on.
    */
    const modeRule44 = await evalJs(`(function(){
      window.planbook.supports.setPresentationMode(true);
      var d = window.planbook.store.getDoc();
      var cls = d.classes.filter(function(c){ return c.id === '${CLS44}'; })[0];
      var hits = window.planbook.signals.evaluate(d, cls, '${TERM44}')
        .filter(function(h){ return h.ruleId === 'behavior-window'; });
      var n = hits.length ? hits[0].numbers.entries : -1;
      var handed = window.planbook.log.visibleEntriesFor(d, '${CYD}').length;
      window.planbook.supports.setPresentationMode(false);
      return { n: n, handed: handed }; })()`);
    check('presentation mode changes what a SCREEN may draw and never what a rule counts: the same '
      + 'four with the mode on, while the card is handed one entry',
      modeRule44.n === 4 && modeRule44.handed === 1,
      'the rule counted ' + modeRule44.n + ' with the mode on, and the card was handed '
        + modeRule44.handed + ' entr(ies)');

    /* ══ the absence prompt ══ */

    /*
      ACCEPTANCE LINE 5, re-homed from WO-3.8. Two taps on Ada's cell today: the first is present,
      the second is absent — src/attendance.js's ring — and the second is the one that raises the
      prompt. Everything about it is asserted against Ben in the same pass, who has the same five
      absences and an EMPTY clause: a build that raised the box on the count alone passes on Ada and
      fails on him.
    */
    await goHome44();
    await clickSel('#homeGrid [data-class-tab="' + CLS44 + '"]');
    await new Promise(r => setTimeout(r, 300));
    const host44 = await evalJs(`(function(){
      var h = document.querySelector('[data-absence-prompt]');
      return { there: !!h, hidden: !!h && h.classList.contains('hidden'),
        empty: !!h && h.children.length === 0,
        cell: !!document.querySelector('[data-attendance-cell="${ADA}"]') }; })()`);
    check('the registry carries an empty host for the prompt and nothing in it at rest — the box is '
      + 'raised by a mark and never by a render',
      host44.there === true && host44.hidden === true && host44.empty === true
        && host44.cell === true,
      'the host is present = ' + host44.there + ', hidden = ' + host44.hidden + ', empty = '
        + host44.empty);

    await clickSel('[data-attendance-cell="' + ADA + '"]');
    await new Promise(r => setTimeout(r, 200));
    await clickSel('[data-attendance-cell="' + ADA + '"]');
    await new Promise(r => setTimeout(r, 300));
    const prompt44 = await evalJs(`(function(){
      var h = document.querySelector('[data-absence-prompt]');
      var page = document.body.innerHTML;
      return { hidden: h.classList.contains('hidden'),
        lead: (h.querySelector('.accommodation-prompt-lead') || {}).textContent || '',
        where: (h.querySelector('.accommodation-prompt-where') || {}).textContent || '',
        reveal: !!h.querySelector('[data-absence-clause]'),
        clauseInPage: page.indexOf('${CLAUSE44}') >= 0,
        who: window.planbook.accommodationPrompt.absencePromptStudent(),
        code: (window.planbook.attendance.editableMark('${ADA}') || {}).code || '' }; })()`);
    check('marking a student absent for the Nth time raises the plan’s attendance clause — the '
      + 'sentence names the student and the count the SIGNAL RULE measured, the scope line says '
      + 'where it goes, and the clause itself is behind one deliberate tap rather than in the first '
      + 'paint (Acceptance line 5)',
      prompt44.code === 'A' && prompt44.hidden === false && prompt44.who === ADA
        && /Wo44Absentee/.test(prompt44.lead) && /6th absence/.test(prompt44.lead)
        && /recorded meeting/.test(prompt44.lead)
        && /never printed, exported or put in a draft/.test(prompt44.where)
        && prompt44.reveal === true && prompt44.clauseInPage === false,
      'the mark reads ' + JSON.stringify(prompt44.code) + '; the prompt says '
        + JSON.stringify(prompt44.lead) + ' about ' + prompt44.who
        + '; the clause is in the page before the tap = ' + prompt44.clauseInPage);

    await clickSel('[data-absence-clause]');
    await new Promise(r => setTimeout(r, 250));
    const revealed44 = await evalJs(`(function(){
      var h = document.querySelector('[data-absence-prompt]');
      return { clause: (h.querySelector('.accommodation-prompt-clause') || {}).textContent || '',
        expanded: (h.querySelector('[data-absence-clause]') || {}).getAttribute('aria-expanded') };
    })()`);
    check('and the tap shows what the plan actually says, in the teacher’s own words, inside the '
      + 'same white box WO-3.8’s names arrive in',
      revealed44.clause === CLAUSE44 && revealed44.expanded === 'true',
      'the reveal shows ' + JSON.stringify(revealed44.clause));

    /* The same two taps on the student with no clause. */
    await clickSel('[data-attendance-cell="' + BEN + '"]');
    await new Promise(r => setTimeout(r, 200));
    await clickSel('[data-attendance-cell="' + BEN + '"]');
    await new Promise(r => setTimeout(r, 300));
    const ben44 = await evalJs(`(function(){
      var h = document.querySelector('[data-absence-prompt]');
      var page = document.body.innerHTML;
      return { hidden: h.classList.contains('hidden'), empty: h.children.length === 0,
        who: window.planbook.accommodationPrompt.absencePromptStudent(),
        code: (window.planbook.attendance.editableMark('${BEN}') || {}).code || '',
        clauseInPage: page.indexOf('${CLAUSE44}') >= 0 }; })()`);
    check('a student with the same absences and NOTHING on file gets no box at all — "if one '
      + 'exists" is the acceptance line, and a prompt announcing that the app looked would be the '
      + 'disclosure it is there to prevent; the previous student’s clause goes with it',
      ben44.code === 'A' && ben44.hidden === true && ben44.empty === true
        && ben44.who === '' && ben44.clauseInPage === false,
      'Ben’s mark reads ' + JSON.stringify(ben44.code) + '; the host is hidden = ' + ben44.hidden
        + ', empty = ' + ben44.empty + ', still about ' + JSON.stringify(ben44.who));

    /* Back to Ada, then present — the prompt must not survive a mark that is not an absence. */
    await clickSel('[data-attendance-cell="' + ADA + '"]');
    await new Promise(r => setTimeout(r, 200));
    const cleared44 = await evalJs(`(function(){
      var h = document.querySelector('[data-absence-prompt]');
      return { hidden: h.classList.contains('hidden'), empty: h.children.length === 0,
        code: (window.planbook.attendance.editableMark('${ADA}') || {}).code || '',
        who: window.planbook.accommodationPrompt.absencePromptStudent() }; })()`);
    check('and it comes off the glass the moment the mark stops being an absence — the box is about '
      + 'one mark on one student, not a banner the screen carries around',
      cleared44.code !== 'A' && cleared44.hidden === true && cleared44.empty === true
        && cleared44.who === '',
      'the mark now reads ' + JSON.stringify(cleared44.code) + '; the host is hidden = '
        + cleared44.hidden);

    /*
      AND IT CANNOT BE REACHED WITH THE MODE ON — asked through the seam rather than through the
      button, which is the reading WO-3.8's own section takes about its reveal and for the same
      reason: with the mode on the button is not drawn, and "it must not be reachable at all" is a
      claim about the guard rather than about the button.
    */
    const projectedPrompt44 = await evalJs(`(function(){
      window.planbook.supports.setPresentationMode(true);
      var d = window.planbook.store.getDoc();
      var cls = d.classes.filter(function(c){ return c.id === '${CLS44}'; })[0];
      var painted = window.planbook.accommodationPrompt.paintAbsencePrompt(cls, '${TERM44}',
        '${ADA}');
      window.planbook.accommodationPrompt.toggleAbsenceClause();
      var h = document.querySelector('[data-absence-prompt]');
      var page = document.body.innerHTML;
      var out = { painted: painted, hidden: h.classList.contains('hidden'),
        empty: h.children.length === 0, clauseInPage: page.indexOf('${CLAUSE44}') >= 0,
        who: window.planbook.accommodationPrompt.absencePromptStudent() };
      window.planbook.supports.setPresentationMode(false);
      return out; })()`);
    check('with a projector on, the prompt is refused by the module rather than by the absence of a '
      + 'button: painting it draws nothing, and the reveal called straight through the seam puts no '
      + 'clause on the page (Acceptance line 5’s second half)',
      projectedPrompt44.painted === false && projectedPrompt44.hidden === true
        && projectedPrompt44.empty === true && projectedPrompt44.clauseInPage === false
        && projectedPrompt44.who === '',
      'paintAbsencePrompt() returned ' + projectedPrompt44.painted + '; the host is empty = '
        + projectedPrompt44.empty + ', the clause is in the page = '
        + projectedPrompt44.clauseInPage);

    /* ── put the document back ── */
    const cleanup44 = await evalJs(`(function(){
      var s = window.planbook.store;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(c){ return c.id !== '${CLS44}'; });
        doc.students = doc.students.filter(function(x){
          return String(x.id).indexOf('s_wo44') !== 0; });
        doc.attendance = doc.attendance.filter(function(a){ return a.classId !== '${CLS44}'; });
        doc.log = doc.log.filter(function(e){
          return String(e.studentId).indexOf('s_wo44') !== 0; });
      });
      window.planbook.supports.setPresentationMode(${plant44.mode ? 'true' : 'false'});
      if ('${plant44.wasClass}') window.planbook.classes.selectClass('${plant44.wasClass}');
      var d = s.getDoc();
      return { classes: d.classes.filter(function(c){ return c.id === '${CLS44}'; }).length,
        students: d.students.filter(function(x){
          return String(x.id).indexOf('s_wo44') === 0; }).length,
        log: d.log.filter(function(e){
          return String(e.studentId).indexOf('s_wo44') === 0; }).length,
        mode: window.planbook.supports.presentationMode() }; })()`);
    await goHome44();
    check('this section handed the document back as it found it — no fixture class, no fixture '
      + 'student, not one log entry left in an append-only collection nothing can delete from '
      + 'through the app, and presentation mode as it was',
      cleanup44.classes === 0 && cleanup44.students === 0 && cleanup44.log === 0
        && cleanup44.mode === !!plant44.mode && (await onView44()) === 'homeView',
      cleanup44.classes + ' fixture class(es), ' + cleanup44.students + ' student(s) and '
        + cleanup44.log + ' log row(s) left behind; presentation mode = ' + cleanup44.mode
        + ', left on #' + (await onView44()));
  }
}
}
