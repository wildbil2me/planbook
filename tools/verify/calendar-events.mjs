/* calendar-events.mjs — calendar events: the six kinds, the rules, and a materialized series (WO-6.1)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, openCalendarPanel, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── calendar events: the six kinds, the rules, and a materialized series (WO-6.1) ─────────
 *
 * WHAT ONLY A BROWSER CAN SETTLE HERE, and it is not the arithmetic — src/calendar.js has no DOM
 * and no clock, so its rules could in principle be read off the file. What cannot be read off a
 * file is the pair of claims the acceptance list actually makes.
 *
 * THE FIRST IS WHAT IS IN `doc.events` AFTER A RECURRENCE. "A weekly recurrence produces N
 * independent entries" and "a weekly recurrence draws one rule five times" look identical on the
 * list, on the calendar, and to a teacher. They differ in exactly one place — the array — and the
 * only way to tell them apart is to author the repeat through the real form and then read the
 * document back. Moving one instance is the same claim from the other side: a build that stored a
 * rule would move the other four with it, silently and correctly by its own lights.
 *
 * THE SECOND IS THAT THE REFUSALS ARE THE MODEL'S. The acceptance line says the three rules refuse
 * "when built through src/calendar.js directly, with no screen module in the call stack" — so this
 * block calls newEvent() and addEvent() through the seam, against a BARE OBJECT rather than the
 * year document, and asserts nothing was built and nothing was stored. src/events.js and
 * src/days-off.js are not merely uninvolved in that call, they are unreachable from it: the
 * document handed in is `{ events: [] }`, made three lines earlier in this file.
 *
 * THE FIXTURE IS IN 2027 ON PURPOSE. Every other date this harness writes is relative to today,
 * and the six kinds authored here are the six src/attendance.js does not read — so the two sets
 * cannot collide, and pinning these to a fixed week makes the series arithmetic something a reader
 * can check by counting rather than by trusting a helper. 2027-05-03 is a Monday.
 */
console.log('\n--- calendar events, the rules and a materialized series (WO-6.1) ---');
if (!seam) {
  skip('calendar events (WO-6.1)', 'window.planbook is not on the page, so nothing here can read '
    + 'the document back or ask the model a question');
} else {
  const CLS = 'c_wo61';
  const S1 = 'wo61-s1';
  const NAME = 'Wo61Surname';
  /* The six this panel authors, in the order the pills draw them. `no-school` and `dropped` are
     deliberately absent: this surface cannot write them, which is the second deliverable, and the
     WO-2.3 block above is what proves those two still behave. */
  const KINDS = ['early-release', 'grades-due', 'conference', 'meeting', 'trip', 'reminder'];
  const D1 = '2027-05-03', D2 = '2027-05-05';
  /* The nine fields docs/data-model.md § Events tabulates, in its order. Written out here rather
     than read off the app: the point of the check is the list. */
  const RECORD = ['id', 'date', 'endDate', 'kind', 'title', 'classIds', 'studentId', 'notes',
    'seriesId'];

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  const plant = await evalJs(`(function(){
    var s = window.planbook.store, d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var lead = d.calendar && Object.prototype.hasOwnProperty.call(d.calendar, 'gradesDueLeadDays')
      ? d.calendar.gradesDueLeadDays : null;
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      doc.students.push({ id:'${S1}', first:'Wo61Given', last:'${NAME}' });
      doc.classes.push({ id:'${CLS}', name:'WO-6.1 Events', archived:false,
        roster:['${S1}'], letterScale:null,
        terms:[{ id:'tm_wo61', label:'WO-6.1 Term' }],
        categories:[{ id:'k_wo61', name:'All work', weight:100 }]});
    });
    var ev = s.getDoc().events || [];
    return { ok:true, lead:lead, events:ev.length,
      exceptions: ev.filter(function(e){
        return e.kind === 'no-school' || e.kind === 'dropped'; }).length }; })()`);
  /* A BASELINE RATHER THAN A DEMAND FOR AN EMPTY ARRAY. Every count below is stated as a delta on
     it, so this section cannot pass or fail on what an earlier one happened to leave behind — and
     a run where the number is not zero still measures what this work order added. */
  const BASE = plant && plant.ok ? plant.events : 0;
  const BASE_EX = plant && plant.ok ? plant.exceptions : 0;
  check('WO-6.1 fixture: a class and a student to hang an event on, and a known count of events '
    + 'already in the document to measure against',
    !!plant && plant.ok === true,
    plant && plant.ok ? plant.events + ' event(s) already in the document, ' + plant.exceptions
      + ' of them days off or drops; the stored lead time was ' + JSON.stringify(plant.lead)
      : JSON.stringify(plant));

  /* ── acceptance line 4: the three rules refuse from the model ──
     Asked of src/calendar.js and of nothing else. The "document" below is an object literal, so
     there is no store, no update(), no screen and no DOM anywhere under these calls. */
  const refused = await evalJs(`(function(){
    var cal = window.planbook.calendar;
    var scratch = { events: [] };
    var whole = { id:'e_scratch', date:'${D1}', endDate:'${D1}', kind:'dropped', title:'x',
                  classIds:[], studentId:'', notes:'', seriesId:'' };
    var good = cal.newEvent('meeting', '${D1}', '', 'A meeting', []);
    return {
      dropNamesNobody: cal.newEvent('dropped', '${D1}', '', 'x', []),
      endsBeforeStart: cal.newEvent('meeting', '${D2}', '${D1}', 'x', []),
      unreadableDate:  cal.newEvent('meeting', 'next Tuesday', '', 'x', []),
      emptyDate:       cal.newEvent('meeting', '', '', 'x', []),
      codes: {
        drop: (cal.eventFault('dropped', '${D1}', '', []) || {}).code,
        ends: (cal.eventFault('meeting', '${D2}', '${D1}', []) || {}).code,
        bad:  (cal.eventFault('meeting', 'not a date', '', []) || {}).code,
        fine: cal.eventFault('meeting', '${D1}', '${D2}', []),
        dropWithClass: cal.eventFault('dropped', '${D1}', '', ['${CLS}'])
      },
      storedAClassLessDrop: cal.addEvent(scratch, whole),
      scratchHolds: scratch.events.length,
      goodKeys: good ? Object.keys(good) : null,
      goodEndDate: good ? good.endDate : null
    }; })()`);
  check('the three rules refuse from the model rather than from a form: a dropped event naming no '
    + 'class, an end date before its start and an unreadable date each build NOTHING through '
    + 'src/calendar.js, and addEvent() will not store one either — asked with a bare object as the '
    + 'document, so no screen module is in the call stack',
    refused.dropNamesNobody === null && refused.endsBeforeStart === null
      && refused.unreadableDate === null && refused.emptyDate === null
      && refused.codes.drop === 'drop-names-nobody' && refused.codes.ends === 'ends-first'
      && refused.codes.bad === 'no-start' && refused.codes.fine === null
      && refused.codes.dropWithClass === null
      && refused.storedAClassLessDrop === null && refused.scratchHolds === 0
      && refused.goodEndDate === D1,
    'newEvent() returned ' + JSON.stringify([refused.dropNamesNobody, refused.endsBeforeStart,
      refused.unreadableDate, refused.emptyDate]) + ', eventFault() codes '
      + JSON.stringify(refused.codes) + ', addEvent() returned '
      + JSON.stringify(refused.storedAClassLessDrop) + ' and left ' + refused.scratchHolds
      + ' row(s) in the scratch document');

  /* ── acceptance line 5, the half a browser can settle: the record the app WRITES ──
     docs/data-model.md's nine names, in its order, against the object newEvent() hands back. The
     other half — that the document still says those nine — is a grep, and it is made in
     tools/wo-sweep.mjs § 16 rather than here. */
  check('newEvent() writes the nine fields docs/data-model.md § Events tabulates, in that order, '
    + 'and no others — including the ones its caller had nothing to put in',
    !!refused.goodKeys && refused.goodKeys.join(',') === RECORD.join(','),
    'it wrote ' + JSON.stringify(refused.goodKeys) + '; the document says '
      + JSON.stringify(RECORD));

  /* ── the form, filled and submitted the way a teacher fills and submits it ──
     The dates are set by value rather than typed, for the WO-2.3 block's reason: dispatchKeyEvent
     into a native date picker types into whichever segment happens to be focused, and what this
     section is testing is not the picker. Everything else is a real tap. */
  const fillEvent = async (kind, title, from, to, until, classIds, studentId, notes) => {
    await clickSel('#eventsModal [data-event-kind="' + kind + '"]');
    /* Everything already chosen is tapped OFF first, the WO-2.3 fill's rule: the picker keeps its
       selection between adds, so a fill that only tapped what it wanted would toggle a leftover
       choice back off and quietly author a different event than the one the check is about. */
    const active = await evalJs('Array.prototype.slice.call('
      + 'document.querySelectorAll("#eventClassPicker .toggle-btn.active"))'
      + '.map(function(b){ return b.getAttribute("data-event-class"); })');
    for (const id of active) await clickSel('#eventClassPicker [data-event-class="' + id + '"]');
    for (const id of (classIds || [])) {
      await clickSel('#eventClassPicker [data-event-class="' + id + '"]');
    }
    await evalJs('(function(){ document.getElementById("eventTitle").value = '
      + JSON.stringify(title) + ';'
      + ' document.getElementById("eventNotes").value = ' + JSON.stringify(notes || '') + ';'
      + ' document.getElementById("eventStudent").value = ' + JSON.stringify(studentId || '') + ';'
      + ' document.getElementById("eventFrom").value = ' + JSON.stringify(from) + ';'
      + ' document.getElementById("eventTo").value = ' + JSON.stringify(to || '') + ';'
      + ' var u = document.getElementById("eventUntil");'
      + ' if (u) u.value = ' + JSON.stringify(until || '') + ';'
      + ' return 1; })()');
    await clickSel('#eventsModal [data-event-create] button[type="submit"]');
  };
  /* What the document holds, and what the panel is showing about it. */
  const readEvents = () => evalJs(`(async function(){
    await window.planbook.store.flush();
    var d = window.planbook.store.getDoc();
    var rows = Array.prototype.slice.call(document.querySelectorAll('#eventList .roster-row'));
    return {
      events: (d.events || []).map(function(e){ return JSON.parse(JSON.stringify(e)); }),
      lead: window.planbook.calendar.leadDaysOf(d),
      error: (function(){ var el = document.getElementById('eventError');
        return el && !el.classList.contains('hidden') ? (el.textContent || '').trim() : ''; })(),
      submit: ((document.getElementById('eventSubmit') || {}).textContent || '').trim(),
      repeatShown: !document.getElementById('eventRepeatRow').classList.contains('hidden'),
      rows: rows.map(function(r){
        var rm = r.querySelector('[data-event-remove]');
        var ser = r.querySelector('[data-event-remove-series]');
        return { badge: ((r.querySelector('.event-kind') || {}).textContent || '').trim(),
                 name: ((r.querySelector('.roster-row-name') || {}).textContent || '').trim(),
                 note: ((r.querySelector('.roster-row-note') || {}).textContent || '').trim(),
                 id: rm ? rm.getAttribute('data-event-remove') : '',
                 series: ser ? (ser.textContent || '').trim() : '' }; })
    }; })()`);

  /* Opened from the CALENDAR's panel header (WO-6.6 moved this door there, and openCalendarPanel()
     walks the two steps): the three call sites in this section each reach the same one control. */
  await openCalendarPanel('[data-events-panel]');

  /* ── acceptance line 1, first half: every kind, with and without a range ── */
  for (const kind of KINDS) {
    await fillEvent(kind, 'One day ' + kind, D1, '', '', [], '', '');
    await fillEvent(kind, 'A range ' + kind, D1, D2, '', [CLS], S1, 'a note on ' + kind);
  }
  const made = await readEvents();
  const mine = made.events.filter((e) => /^(One day|A range) /.test(e.title));
  const singles = mine.filter((e) => e.title.indexOf('One day ') === 0);
  const ranges = mine.filter((e) => e.title.indexOf('A range ') === 0);
  check('every one of the six kinds this panel authors can be created, with a range and without: '
    + 'twelve entries, twelve rows, endDate written on all of them and equal to date on the '
    + 'single-day half',
    mine.length === 12 && made.rows.length === BASE - BASE_EX + 12
      && KINDS.every((k) => singles.filter((e) => e.kind === k).length === 1
        && ranges.filter((e) => e.kind === k).length === 1)
      && singles.every((e) => e.date === D1 && e.endDate === D1 && !e.classIds.length
        && e.studentId === '' && e.seriesId === '')
      && ranges.every((e) => e.date === D1 && e.endDate === D2 && e.classIds.length === 1
        && e.classIds[0] === CLS && e.studentId === S1 && e.notes.indexOf('a note on ') === 0),
    mine.length + ' event(s) written across ' + KINDS.length + ' kind(s) '
      + JSON.stringify(mine.map((e) => e.kind + ':' + e.date + '..' + e.endDate))
      + '; the panel drew ' + made.rows.length + ' row(s)');

  /* THE FIRST WRITER OF `studentId` ANYWHERE IN THIS APP is the ranged half above, and the field
     it fills is a POINTER. What reaches the panel about that student is their name and nothing
     else — no plan, no accommodation, no medical or behavior text — so the row is searched for the
     one thing it is allowed to say about them and the document for the id it is allowed to hold. */
  const named = made.rows.filter((r) => r.note.indexOf(NAME) !== -1);
  check('the ranged entries name their student on the row and store an id in the document — the '
    + 'first writer of studentId in this app, and it carries a pointer rather than anything about '
    + 'the student',
    named.length === 6 && ranges.every((e) => e.studentId === S1)
      && !/supports|accommodation|medical|behaviorPlan/.test(JSON.stringify(made.events)),
    named.length + ' row(s) name the student; the ids stored are '
      + JSON.stringify(ranges.map((e) => e.studentId)));

  /* ── the two panels list exactly what each of them can remove ──
     Twelve events are in the document and NONE of them belongs on the days-off panel. A build that
     listed the array rather than its own kinds would show twelve rows with a Remove beside each,
     which is the mis-tap src/days-off.js's paintList() says it exists to prevent. */
  await evalJs("window.planbook.closeModal('eventsModal');1");
  await openCalendarPanel('[data-dayoff-panel]');
  const daysOffRows = await evalJs("document.querySelectorAll('#daysOffList .roster-row').length");
  await evalJs("window.planbook.closeModal('daysOffModal');1");
  check('with twelve of this work order\'s events in the document, the days-off panel still lists '
    + 'none of them — the two panels list exactly what each of them can remove',
    daysOffRows === BASE_EX,
    'the days-off list drew ' + daysOffRows + ' row(s) — the ' + BASE_EX + ' day(s) off this run '
      + 'already held, and none of the ' + mine.length + ' this section added');

  /* ── acceptance line 1, second half: edited, and deleted ── */
  await openCalendarPanel('[data-events-panel]');
  const target = ranges.filter((e) => e.kind === 'conference')[0];
  const beforeEdit = JSON.stringify(made.events.filter((e) => e.id !== target.id));
  /* Every id this section is responsible for, so the delete loop below cannot take a row an
     earlier section is still using. */
  const MINE = mine.map((e) => e.id);
  await clickSel('#eventList [data-event-edit="' + target.id + '"]');
  await new Promise(r => setTimeout(r, 200));
  const editing = await readEvents();
  await evalJs('(function(){ document.getElementById("eventTitle").value = "Edited conference";'
    + ' document.getElementById("eventFrom").value = "2027-05-10";'
    + ' document.getElementById("eventTo").value = "";'
    + ' document.getElementById("eventStudent").value = "";'
    + ' return 1; })()');
  await clickSel('#eventsModal [data-event-create] button[type="submit"]');
  const edited = await readEvents();
  const afterEdit = edited.events.filter((e) => e.id === target.id)[0];
  check('an event can be edited in place: the form says Save changes and takes the repeat field '
    + 'off screen while it is open, the row keeps its id, and not one other event in the document '
    + 'moved',
    editing.submit === 'Save changes' && editing.repeatShown === false
      && !!afterEdit && afterEdit.title === 'Edited conference' && afterEdit.date === '2027-05-10'
      && afterEdit.endDate === '2027-05-10' && afterEdit.studentId === ''
      && afterEdit.kind === 'conference'
      && edited.events.length === made.events.length
      && JSON.stringify(edited.events.filter((e) => e.id !== target.id)) === beforeEdit,
    'the button said ' + JSON.stringify(editing.submit) + '; the row now reads '
      + JSON.stringify(afterEdit) + ' and the other ' + (edited.events.length - 1)
      + ' event(s) are ' + (JSON.stringify(edited.events.filter((e) => e.id !== target.id))
        === beforeEdit ? 'byte-identical' : 'DIFFERENT'));

  for (const id of MINE) {
    if (await has('#eventList [data-event-remove="' + id + '"]')) {
      await clickSel('#eventList [data-event-remove="' + id + '"]');
    }
  }
  const emptied = await readEvents();
  check('and every one of them can be deleted from the same panel, leaving the document holding '
    + 'exactly what it held before this section ran',
    emptied.events.length === BASE && emptied.rows.length === BASE - BASE_EX,
    emptied.events.length + ' event(s) left in the document (wanted ' + BASE + '), '
      + emptied.rows.length + ' row(s) on the panel');

  /* ── acceptance line 2: a weekly recurrence produces N INDEPENDENT entries ──
     Five Mondays: May 3, 10, 17, 24 and 31 of 2027. The count is arithmetic a reader can do in
     their head, which is the reason the fixture is a fixed week rather than a relative one. */
  await fillEvent('meeting', 'Faculty meeting', D1, '', '2027-05-31', [], '', '');
  const series = await readEvents();
  const weekly = series.events.filter((e) => e.title === 'Faculty meeting');
  const ids = weekly.map((e) => e.id);
  const labels = weekly.map((e) => e.seriesId).filter((v, i, a) => a.indexOf(v) === i);
  check('a weekly repeat materializes into five independent entries — five ids, five dates seven '
    + 'days apart, one series label, and no recurrence rule anywhere in the document',
    weekly.length === 5
      && ids.filter((v, i, a) => a.indexOf(v) === i).length === 5
      && weekly.map((e) => e.date).join(',')
        === '2027-05-03,2027-05-10,2027-05-17,2027-05-24,2027-05-31'
      && weekly.every((e) => e.endDate === e.date)
      && labels.length === 1 && !!labels[0]
      /* Every key on every instance is one of the nine. A stored rule would need a tenth. */
      && weekly.every((e) => Object.keys(e).join(',') === RECORD.join(','))
      && series.rows.length === BASE - BASE_EX + 5,
    weekly.length + ' entr(ies) on ' + JSON.stringify(weekly.map((e) => e.date))
      + ' under ' + labels.length + ' label(s) ' + JSON.stringify(labels)
      + '; each row holds the keys ' + JSON.stringify(Object.keys(weekly[0] || {})));

  /* And moving one moves ONLY that one, which is the half a stored rule would fail. */
  const third = weekly[2];
  const othersBefore = JSON.stringify(weekly.filter((e) => e.id !== third.id));
  await clickSel('#eventList [data-event-edit="' + third.id + '"]');
  await new Promise(r => setTimeout(r, 200));
  await evalJs('(function(){ document.getElementById("eventFrom").value = "2027-05-18";'
    + ' return 1; })()');
  await clickSel('#eventsModal [data-event-create] button[type="submit"]');
  const moved = await readEvents();
  const movedRows = moved.events.filter((e) => e.title === 'Faculty meeting');
  const movedOne = movedRows.filter((e) => e.id === third.id)[0];
  check('moving one instance of that repeat moves only that one: the other four are byte-identical '
    + 'and the moved row keeps its series label',
    !!movedOne && movedOne.date === '2027-05-18' && movedOne.endDate === '2027-05-18'
      && movedOne.seriesId === third.seriesId
      && JSON.stringify(movedRows.filter((e) => e.id !== third.id)) === othersBefore
      && movedRows.length === 5,
    'the third instance moved from ' + third.date + ' to ' + (movedOne ? movedOne.date : 'nowhere')
      + '; the other four are '
      + (JSON.stringify(movedRows.filter((e) => e.id !== third.id)) === othersBefore
        ? 'byte-identical' : 'DIFFERENT: '
          + JSON.stringify(movedRows.filter((e) => e.id !== third.id).map((e) => e.date))));

  /* ── acceptance line 3: the whole series, in one action ── */
  const seriesBtn = await evalJs("(function(){ var b = document.querySelector("
    + "'#eventList [data-event-remove-series]'); return b ? (b.textContent||'').trim() : ''; })()");
  await clickSel('#eventList [data-event-remove-series]');
  const swept = await readEvents();
  check('the whole materialized series goes in one action, without the teacher removing five rows '
    + 'by hand — and the control says how many it is about to take',
    seriesBtn === 'Remove all 5' && swept.events.length === BASE
      && swept.rows.length === BASE - BASE_EX,
    'the button said ' + JSON.stringify(seriesBtn) + ' and the document holds '
      + swept.events.length + ' event(s) afterwards (wanted ' + BASE + ')');

  /* ── the lead time: stored in the DOCUMENT, and an absent key is its default ──
     Not an acceptance line of this work order — the warning it drives is WO-6.4's — but the
     STORAGE is this work order's deliverable, and the rule it follows is the one WO-4.1 wrote for a
     threshold: the key is absent until a teacher types, and it defaults while it is. */
  /* What it read before anything was typed: the shipped default, unless this run arrived with a
     stored one, in which case that is the honest baseline and the check says so. */
  const LEAD_WAS = plant && plant.lead !== null && plant.lead !== undefined ? plant.lead : 3;
  const leadBefore = swept.lead;
  await clickSel('#eventsModal [data-event-kind="grades-due"]');
  await evalJs('(function(){ var f = document.getElementById("eventLead"); f.value = "7";'
    + ' f.dispatchEvent(new Event("input", { bubbles: true })); return 1; })()');
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  const leadKept = await evalJs(`(async function(){
    await window.planbook.store.flush();
    var d = window.planbook.store.getDoc();
    var cal = window.planbook.calendar;
    return { stored: d.calendar ? JSON.stringify(d.calendar) : 'no block',
      read: cal.leadDaysOf(d), def: cal.DEFAULT_LEAD_DAYS,
      absent: cal.leadDaysOf({}),
      nonsense: cal.leadDaysOf({ calendar:{ gradesDueLeadDays:'soon' } }),
      leadKeys: Object.keys(localStorage).filter(function(k){
        return k.toLowerCase().indexOf('lead') !== -1; }) }; })()`);
  check('the grades-due lead time is typed once and stored in the YEAR DOCUMENT, survives a '
    + 'reload, and an absent or unreadable key reads as the shipped default rather than as zero — '
    + 'and nothing about it is in localStorage',
    leadBefore === LEAD_WAS && leadKept.read === 7
      && leadKept.stored === '{"gradesDueLeadDays":7}'
      && leadKept.def === 3 && leadKept.absent === 3 && leadKept.nonsense === 3
      && leadKept.leadKeys.length === 0,
    'it read ' + leadBefore + ' before anything was typed and ' + leadKept.read
      + ' after a reload; the document holds ' + leadKept.stored
      + '; a document with no block reads ' + leadKept.absent + ' and one holding "soon" reads '
      + leadKept.nonsense + '; localStorage keys mentioning a lead: '
      + JSON.stringify(leadKept.leadKeys));

  /* Teardown by id, the WO-3.7 shape rather than a snapshot restore: this block reloads, and a
     reload takes anything parked on window with it. The lead time is put back exactly as it was
     found — DELETED if the key was absent before this section, which is the state the default rule
     is about and the state every document arrives in. */
  const putBack = plant && plant.lead !== null && plant.lead !== undefined
    ? 'd.calendar.gradesDueLeadDays = ' + JSON.stringify(plant.lead) + ';'
    : 'delete d.calendar.gradesDueLeadDays;';
  const cleaned = await evalJs(`(function(){
    var s = window.planbook.store;
    s.update(function(d){
      d.classes = (d.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      d.students = (d.students || []).filter(function(p){ return p.id !== '${S1}'; });
      d.events = (d.events || []).filter(function(e){
        return !/^(One day |A range |Edited conference|Faculty meeting)/.test(e.title || ''); });
      if (!d.calendar) d.calendar = {};
      ${putBack}
    });
    var d = s.getDoc();
    return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
      events:(d.events || []).length,
      lead: d.calendar ? JSON.stringify(d.calendar) : 'no block' }; })()`);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-6.1 fixture came back off the document, and the lead time was left as it was found',
    cleaned.classes === 0 && cleaned.events === BASE
      && cleaned.lead === (plant && plant.lead !== null && plant.lead !== undefined
        ? '{"gradesDueLeadDays":' + JSON.stringify(plant.lead) + '}' : '{}'),
    cleaned.classes + ' fixture class(es) left behind and ' + cleaned.events
      + ' event(s) in the document (wanted ' + BASE + '); the calendar block reads '
      + cleaned.lead);
}
}
