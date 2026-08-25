/* calendar-derived.mjs — derived events: computed at render, never stored (WO-6.2)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, KILL_ANIM, waitForBoot, seam } = h;

/*
 * ───────── derived events: computed at render, never stored (WO-6.2) ─────────
 *
 * WHAT ONLY A BROWSER CAN SETTLE HERE. src/calendar-derived.js has no DOM, so its arithmetic could
 * in principle be read off the file. Three things cannot.
 *
 * THE FIRST IS WHAT IS **NOT** IN THE DOCUMENT AFTERWARDS. The acceptance line is "`events[]`
 * contains no derived entry, checked deterministically rather than by feel: seed a month holding an
 * assignment due date, a term boundary, a recorded meeting, a planned drop and a review date;
 * render it, page one month forward and one back, and re-read `doc.events`." A build that computes
 * the month and a build that computes it once and caches the answer into `events[]` draw the same
 * grid; they differ in exactly one place, which is the array, and the only way to tell them apart
 * is to seed, read, and re-read. **THE MONTH GRID DOES NOT EXIST YET** — it is WO-6.3's, and this
 * phase's own work orders say `src/calendar.js` has no DOM by design — so what is paged here is the
 * MODEL rather than a view: derivedItemsIn() for the month, for the month after, for the month
 * before, and for the month again, which is precisely the sequence a Next/Back pair puts through
 * it. That substitution is stated rather than smoothed over, and the re-read happens across a
 * RELOAD as well, so a write that was only sitting in memory is caught too.
 *
 * THE SECOND IS THE ABSENCE ITSELF. "A future weekday shows no per-class meeting state at all" is a
 * claim about rows that are not there, and an empty result and a broken query look identical
 * (tools/README.md § "Two rules that follow"). So every check below that asserts nothing is present
 * sits beside one asserting the same call finds the things that ARE — the same fixture, the same
 * window, two directions.
 *
 * THE THIRD IS PRESENTATION MODE, which is a preference in this browser's localStorage and cannot
 * be read off a file at all. The review date has to be GONE — not blanked, not an unlabelled
 * marker — and the way to tell a suppressed record from a redacted one is to serialise the whole
 * month and search it for the student's name and for the date.
 *
 * EVERY EXACT COUNT BELOW IS TAKEN OVER THIS SECTION'S OWN FIXTURE — the items whose `classId` is
 * this block's class or whose `studentId` is its student — and the unfiltered total is printed
 * beside it. An earlier section that left a class behind would otherwise redden a correct build,
 * which is trap 8's shape: a check that goes red about the environment gets routed around next
 * time. The absence claims are the exception and are made UNFILTERED on purpose, because an
 * absence cannot be manufactured by somebody else's leftovers.
 *
 * THE FIXTURE IS IN MARCH 2027, two months from WO-6.1's May, for that block's reason: every other
 * date this harness writes is relative to today, so a fixed month cannot collide with them and the
 * arithmetic is something a reader can check by counting. 2027-03-01 is a Monday, so every date
 * below is a weekday.
 */
console.log('\n--- derived events: computed at render, never stored (WO-6.2) ---');
if (!seam) {
  skip('derived events (WO-6.2)', 'window.planbook is not on the page, so nothing here can seed a '
    + 'month, ask the model about it, or read the document back');
} else {
  const CLS = 'c_wo62';
  const STU = 's_wo62';
  const TERM = 'tm_wo62';
  const ASG = 'a_wo62';
  /* The month, and the two the paging check steps into. */
  const M_FROM = '2027-03-01', M_TO = '2027-03-31';
  const P_FROM = '2027-02-01', P_TO = '2027-02-28';
  const N_FROM = '2027-04-01', N_TO = '2027-04-30';
  /* One date per row of the work order's Deliverables table, plus the two that must produce
     nothing: a bare weekday, and the middle of a school-wide closure. */
  const T_START = '2027-03-02', T_END = '2027-03-30';
  const DUE = '2027-03-11';
  const MET = '2027-03-05';
  const DROP = '2027-03-18';
  const REVIEW = '2027-03-24';
  const BARE = '2027-03-10';
  const SHUT_FROM = '2027-03-15', SHUT_TO = '2027-03-17';
  /* The five things `reviewDate` shares a record with (src/roster.js's SUPPORT_FIELDS, plus the
     plan, the accommodation list and the case manager). Seeded with phrases nothing else in this
     repository contains, so that "no plan type, no accommodation, no medical or behavior-plan text"
     is a SEARCH over the serialised month rather than an inspection of the field names somebody
     remembered to look for. */
  const MEDICAL = 'Wo62MedicalPhrase';
  const BEHAVIOR = 'Wo62BehaviorPhrase';
  const ACCOM = 'Wo62AccommodationPhrase';
  const MANAGER = 'Wo62CaseManagerPhrase';
  const GIVEN = 'Wo62Given', SURNAME = 'Wo62Surname';
  const SENSITIVE = [MEDICAL, BEHAVIOR, ACCOM, MANAGER, 'IEP', 'extended-time'];
  /* Pasted into every eval below rather than exported from the module: what this section measures
     is its own fixture, and a helper the app supplied could agree with itself about which rows are
     ours. */
  const MINE = 'function mine(l){ return l.filter(function(i){ '
    + 'return i.classId === "' + CLS + '" || i.studentId === "' + STU + '"; }); }';

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture: one of every row in the table, authored through the model where there is one ──
     The two events are built by src/calendar.js's own newEvent()/addEvent(), so the seed is a
     record this app could actually have written; everything else is a plain document write, which
     is what the SIS importer and a restored backup both amount to. */
  const plant = await evalJs(`(function(){
    var s = window.planbook.store, cal = window.planbook.calendar;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var before = (d.events || []).map(function(e){ return e.id; });
    var mode = window.planbook.supports.presentationMode();
    var dropId = '', shutId = '';
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      doc.students.push({ id:'${STU}', first:'${GIVEN}', last:'${SURNAME}',
        supports:{ plan:'IEP', caseManager:{ name:'${MANAGER}', email:'' },
          reviewDate:'${REVIEW}',
          accommodations:[{ kind:'extended-time', detail:'${ACCOM}', appliesTo:[] }],
          medical:'${MEDICAL}', behaviorPlan:'${BEHAVIOR}' }});
      doc.classes.push({ id:'${CLS}', name:'WO-6.2 Derived', archived:false,
        roster:['${STU}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-6.2 Term', start:'${T_START}', end:'${T_END}' }],
        categories:[{ id:'k_wo62', name:'All work', weight:100 }]});
      doc.assignments.push({ id:'${ASG}', classId:'${CLS}', termId:'${TERM}',
        categoryId:'k_wo62', name:'WO-6.2 Quiz', points:100, assigned:'${T_START}',
        due:'${DUE}' });
      doc.attendance.push({ classId:'${CLS}', date:'${MET}', marks:{} });
      var drop = cal.newEvent('dropped', '${DROP}', '', 'WO-6.2 planned drop', ['${CLS}']);
      var shut = cal.newEvent('no-school', '${SHUT_FROM}', '${SHUT_TO}', 'WO-6.2 closure', []);
      cal.addEvent(doc, drop);
      cal.addEvent(doc, shut);
      dropId = drop ? drop.id : '';
      shutId = shut ? shut.id : '';
    });
    var now = s.getDoc();
    return { ok:true, mode:mode, dropId:dropId, shutId:shutId,
      beforeIds: before,
      afterIds: (now.events || []).map(function(e){ return e.id; }) }; })()`);
  const SEEDED = plant && plant.ok ? plant.afterIds : [];
  const DROP_ID = plant && plant.dropId ? plant.dropId : 'no-drop-was-seeded';
  const SHUT_ID = plant && plant.shutId ? plant.shutId : 'no-closure-was-seeded';
  check('WO-6.2 fixture: a month holding an assignment due date, a term boundary, a recorded '
    + 'meeting, a planned drop and a review date — plus the five support fields that review date '
    + 'shares a record with, seeded with phrases nothing else in this repository contains',
    !!plant && plant.ok === true && !!plant.dropId && !!plant.shutId
      && plant.afterIds.length === plant.beforeIds.length + 2,
    plant && plant.ok
      ? plant.beforeIds.length + ' event(s) in the document before the seed and '
        + plant.afterIds.length + ' after it; the planned drop is ' + plant.dropId
        + ' and the school-wide closure is ' + plant.shutId
      : JSON.stringify(plant));

  /* ── the four rows of the Deliverables table, each answering out of the collection it names ──
     Read as one shape rather than four checks, because the claim is that ONE call over the month
     produces all of them and in a stable order — a build answering three of four looks like a
     build with an empty month on any check written per row. */
  const month = await evalJs(`(function(){
    ${MINE}
    var dv = window.planbook.calendarDerived, d = window.planbook.store.getDoc();
    var all = dv.derivedItemsIn(d, '${M_FROM}', '${M_TO}');
    var items = mine(all);
    return { rows: items.map(function(i){
        return [i.kind, i.date, i.classId, i.state || '',
          i.assignmentId || i.termId || i.studentId || '', i.eventId || ''].join('|'); }),
      total: all.length,
      allDerived: items.every(function(i){ return dv.isDerived(i) === true; }),
      due: items.filter(function(i){ return i.kind === dv.ASSIGNMENT_DUE; })[0] || null }; })()`);
  const WANT = [
    'term-start|' + T_START + '|' + CLS + '||' + TERM + '|',
    'meeting-state|' + MET + '|' + CLS + '|taken||',
    'assignment-due|' + DUE + '|' + CLS + '||' + ASG + '|',
    'meeting-state|' + DROP + '|' + CLS + '|covered||' + DROP_ID,
    'review-date|' + REVIEW + '|||' + STU + '|',
    'term-end|' + T_END + '|' + CLS + '||' + TERM + '|',
  ];
  check('one call over the month answers every row of the Deliverables table out of the collection '
    + 'it names — the due date from assignments[], both term edges from classes[].terms[], the '
    + 'recorded meeting and the planned drop from attendance[] and the authored event, and the '
    + 'review date from students[].supports — in date order, every one of them flagged derived',
    month.rows.join(' · ') === WANT.join(' · ') && month.allDerived === true
      && !!month.due && month.due.termId === TERM && month.due.title === 'WO-6.2 Quiz',
    'it returned ' + JSON.stringify(month.rows) + '; wanted ' + JSON.stringify(WANT)
      + ' (out of ' + month.total + ' item(s) in the month altogether); every item flagged '
      + 'derived: ' + month.allDerived + '; the due date carries termId '
      + JSON.stringify(month.due && month.due.termId) + ' and the title '
      + JSON.stringify(month.due && month.due.title));

  /* ── acceptance line 4's model half: a date and a student and nothing else ──
     The keys are asserted by NAME and in order, and then the whole serialised month is searched for
     each of the things that share a record with `reviewDate`. Both halves are needed: a record
     carrying the support block under a seventh key would survive a key-name check nobody updated,
     and a record spelled right today can grow a field tomorrow. The search is over the WHOLE
     month — every item, not only the review row — because a leak that arrived through a different
     kind would be the one nobody thought to look for. */
  const REVIEW_KEYS = ['derived', 'kind', 'classId', 'date', 'studentId', 'name'];
  const leaked = await evalJs(`(function(){
    var dv = window.planbook.calendarDerived, d = window.planbook.store.getDoc();
    var text = JSON.stringify(dv.derivedItemsIn(d, '${M_FROM}', '${M_TO}'));
    var one = dv.reviewDatesIn(d, '${M_FROM}', '${M_TO}').filter(function(i){
      return i.studentId === '${STU}'; })[0] || null;
    return { keys: one ? Object.keys(one) : null, name: one ? one.name : null,
      date: one ? one.date : null, studentId: one ? one.studentId : null,
      hits: ${JSON.stringify(SENSITIVE)}.filter(function(p){ return text.indexOf(p) !== -1; }),
      chars: text.length }; })()`);
  check('a review date reaches the calendar as a date and a student and NOTHING else: six fields '
    + 'by name and in order, and no plan type, accommodation, medical text, behavior-plan text or '
    + 'case manager anywhere in the serialised month, though all five are on that student’s record',
    !!leaked.keys && leaked.keys.join(',') === REVIEW_KEYS.join(',')
      && leaked.date === REVIEW && leaked.studentId === STU
      && leaked.name === GIVEN + ' ' + SURNAME && leaked.hits.length === 0,
    'the record holds ' + JSON.stringify(leaked.keys) + ' (wanted '
      + JSON.stringify(REVIEW_KEYS) + '), reading ' + JSON.stringify(leaked.name) + ' on '
      + leaked.date + '; a search of the ' + leaked.chars + '-character month for '
      + JSON.stringify(SENSITIVE) + ' found ' + JSON.stringify(leaked.hits));

  /* ── and gone entirely with the projector on ──
     Not blanked and not an unlabelled marker: the row is absent, and neither the student's name nor
     the review date is anywhere in what the month serialises to. Read back through
     presentationMode() rather than from the value written, src/presentation.js's own rule — a
     refused localStorage write must not leave this check believing it measured the mode. */
  const projected = await evalJs(`(function(){
    ${MINE}
    var dv = window.planbook.calendarDerived, sup = window.planbook.supports;
    var was = sup.presentationMode();
    var on = sup.setPresentationMode(true);
    var d = window.planbook.store.getDoc();
    var text = JSON.stringify(dv.derivedItemsIn(d, '${M_FROM}', '${M_TO}'));
    var out = { on:on,
      reviews: dv.reviewDatesIn(d, '${M_FROM}', '${M_TO}').length,
      inMonth: text.indexOf('review-date') !== -1,
      name: text.indexOf('${SURNAME}') !== -1,
      date: text.indexOf('${REVIEW}') !== -1,
      others: mine(dv.derivedItemsIn(d, '${M_FROM}', '${M_TO}')).length };
    sup.setPresentationMode(was);
    out.back = mine(dv.reviewDatesIn(d, '${M_FROM}', '${M_TO}')).length;
    out.restored = sup.presentationMode();
    return out; })()`);
  check('in presentation mode the review date is GONE rather than redacted: no row anywhere, the '
    + 'token "review-date" nowhere in the month, and neither the student’s surname nor the date '
    + 'itself anywhere in what the month serialises to — while the other five items are untouched',
    projected.on === true && projected.reviews === 0 && projected.inMonth === false
      && projected.name === false && projected.date === false && projected.others === 5
      && projected.back === 1 && projected.restored === !!(plant && plant.mode),
    'with the mode on: ' + projected.reviews + ' review row(s), "review-date" present '
      + projected.inMonth + ', the surname present ' + projected.name + ', the date present '
      + projected.date + ', ' + projected.others
      + ' other fixture item(s) still drawn; with it off again: ' + projected.back
      + ' review row(s), and the preference was left reading ' + projected.restored);

  /* ── acceptance line 5: a weekday nobody wrote anything down about is BLANK ──
     Three claims in one call, because each alone is satisfiable by a broken query. The bare
     Wednesday yields nothing; the two dates that DO yield something are exactly the two that were
     written down; and NOT_TAKEN — the fourth answer stateOf() can give — appears nowhere in a
     window a year wide. The first and third are asked UNFILTERED: an absence cannot be
     manufactured by another section's leftovers, and if some other class DID answer on that
     Wednesday this check should say so rather than look past it. */
  const blank = await evalJs(`(function(){
    ${MINE}
    var dv = window.planbook.calendarDerived, d = window.planbook.store.getDoc();
    var year = dv.derivedItemsIn(d, '2027-01-01', '2027-12-31');
    var states = mine(dv.meetingStatesIn(d, '${M_FROM}', '${M_TO}'));
    return { bare: dv.meetingStatesIn(d, '${BARE}', '${BARE}').length,
      bareAll: dv.derivedItemsIn(d, '${BARE}', '${BARE}').length,
      dates: states.map(function(i){ return i.date + ':' + i.state; }),
      notTaken: JSON.stringify(year).indexOf('not-taken') !== -1,
      yearStates: mine(year.filter(function(i){
        return i.kind === dv.MEETING_STATE; })).length }; })()`);
  check('a weekday with no attendance record and no authored exception over it produces NO '
    + 'per-class meeting state at all — the bare Wednesday between them is empty for every class, '
    + 'the only two dates that answer are the recorded meeting and the planned drop, and NOT_TAKEN '
    + 'appears nowhere in a window a year wide',
    blank.bare === 0 && blank.bareAll === 0
      && blank.dates.join(',') === MET + ':taken,' + DROP + ':covered'
      && blank.notTaken === false && blank.yearStates === 2,
    BARE + ' yields ' + blank.bare + ' meeting state(s) and ' + blank.bareAll
      + ' derived item(s) of any kind, for any class; the month answers '
      + JSON.stringify(blank.dates) + '; the string "not-taken" is present in the year: '
      + blank.notTaken + ' (' + blank.yearStates + ' fixture meeting state(s) in the year)');

  /* ── and the school-wide closure, which names nobody and so closes nobody's row ──
     A three-day `no-school` sits in the middle of this month. Expanding it into one row per class
     would mean this module deciding what a shut school implies about five classes, which is the
     cycle model plans/rotating-schedule.md removed arriving from the rendering side. The event is
     authored and the grid draws it as the entry the teacher typed; the derived layer says nothing
     twice — and src/attendance.js still answers COVERED for the class on those dates, which is what
     the second half asserts, so this is a decision about the CALENDAR and not a hole in the model. */
  const shut = await evalJs(`(function(){
    ${MINE}
    var dv = window.planbook.calendarDerived, att = window.planbook.attendance;
    var d = window.planbook.store.getDoc();
    return { rows: mine(dv.meetingStatesIn(d, '${SHUT_FROM}', '${SHUT_TO}')).length,
      stateOfSays: att.stateOf('${CLS}', '${SHUT_FROM}'),
      eventStillThere: (d.events || []).filter(function(e){
        return e.id === '${SHUT_ID}'; }).length }; })()`);
  check('a school-wide no-school names no class, so it produces no per-class row — while '
    + 'src/attendance.js still answers COVERED for that class on that date, which is what makes '
    + 'this a decision about what the calendar draws rather than a gap in the model',
    shut.rows === 0 && shut.stateOfSays === 'covered' && shut.eventStillThere === 1,
    shut.rows + ' derived meeting state(s) across the three-day closure; stateOf() says "'
      + shut.stateOfSays + '" for the class on ' + SHUT_FROM + '; the authored event is '
      + (shut.eventStillThere === 1 ? 'still on the calendar in its own right' : 'MISSING'));

  /* ── acceptance line 2: page a month each way and the array is exactly what was authored ──
     The month, the month after, the month before, the month again, and then an unbounded call —
     the sequence a Next/Back pair puts through the model, plus the widest read this module has.
     Re-read across a RELOAD as well, so a write that never left memory is caught too. */
  const paged = await evalJs(`(async function(){
    ${MINE}
    var dv = window.planbook.calendarDerived, s = window.planbook.store;
    var d = s.getDoc();
    var counts = [
      mine(dv.derivedItemsIn(d, '${M_FROM}', '${M_TO}')).length,
      mine(dv.derivedItemsIn(d, '${N_FROM}', '${N_TO}')).length,
      mine(dv.derivedItemsIn(d, '${P_FROM}', '${P_TO}')).length,
      mine(dv.derivedItemsIn(d, '${M_FROM}', '${M_TO}')).length,
      mine(dv.derivedItemsIn(d, '', '')).length ];
    await s.flush();
    var now = s.getDoc();
    return { counts: counts, ids: (now.events || []).map(function(e){ return e.id; }),
      assignments: (now.assignments || []).length, attendance: (now.attendance || []).length,
      students: (now.students || []).length }; })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  const reread = await evalJs(`(function(){
    var d = window.planbook.store.getDoc();
    var stu = (d.students || []).filter(function(p){ return p.id === '${STU}'; })[0] || null;
    return { ids: (d.events || []).map(function(e){ return e.id; }),
      reviewDate: stu && stu.supports ? stu.supports.reviewDate : null,
      due: ((d.assignments || []).filter(function(a){ return a.id === '${ASG}'; })[0] || {}).due
      }; })()`);
  check('reading the month and paging one month forward and one back writes NOTHING: doc.events '
    + 'holds the same entries, by id and in the same order, that were authored before the first '
    + 'read — asserted again after a reload, so a copy that never left memory is caught too — and '
    + 'the assignment, the ledger and the student’s own record are untouched',
    paged.ids.join(',') === SEEDED.join(',') && reread.ids.join(',') === SEEDED.join(',')
      && paged.counts.join(',') === '6,0,0,6,6'
      && reread.reviewDate === REVIEW && reread.due === DUE,
    'the five reads returned ' + JSON.stringify(paged.counts)
      + ' fixture item(s) (month, next, previous, month again, unbounded); doc.events held '
      + SEEDED.length + ' entr(ies) before and ' + paged.ids.length + ' after — '
      + (paged.ids.join(',') === SEEDED.join(',') ? 'the same ids in the same order'
        : 'DIFFERENT: ' + JSON.stringify(paged.ids)) + '; after a reload it holds '
      + reread.ids.length + ', the review date still reads '
      + JSON.stringify(reread.reviewDate) + ' and the due date '
      + JSON.stringify(reread.due));

  /* ── the derived tokens can never be mistaken for an authored kind ──
     `meeting-state` sits one hyphen away from the authored `meeting`, which is the collision this
     asserts is not one. Asked of the two exported lists rather than of five string literals typed
     into this file, so a kind added to either side is measured rather than assumed. */
  const tokens = await evalJs(`(function(){
    var dv = window.planbook.calendarDerived, cal = window.planbook.calendar;
    var authored = cal.KINDS.map(function(k){ return k.kind; });
    return { derived: dv.DERIVED_KINDS,
      shared: dv.DERIVED_KINDS.filter(function(k){ return authored.indexOf(k) !== -1; }),
      authored: authored.length,
      authoredIsNotDerived: dv.isDerived({ kind:'meeting', date:'${DUE}' }),
      unflagged: dv.isDerived({ kind:'assignment-due', date:'${DUE}' }) }; })()`);
  check('the five derived kinds share no token with the eight authored ones, so a merged list can '
    + 'be split on `kind` alone — and isDerived() answers on the flag rather than on the token, so '
    + 'an authored meeting and an unflagged look-alike both read as not ours',
    tokens.shared.length === 0 && tokens.derived.length === 5 && tokens.authored === 8
      && tokens.authoredIsNotDerived === false && tokens.unflagged === false,
    JSON.stringify(tokens.derived) + ' against ' + tokens.authored
      + ' authored kind(s), sharing ' + JSON.stringify(tokens.shared)
      + '; isDerived() on an authored meeting: ' + tokens.authoredIsNotDerived
      + ', on an unflagged look-alike: ' + tokens.unflagged);

  /* ── an archived class is one the teacher put away, and the calendar puts it away too ──
     Its due dates would otherwise tap through to a screen that is not on the tab bar — the same
     argument that keeps an archived class out of the roster editor's class picker. The review date
     is deliberately unaffected: it belongs to a student, not to a class. */
  const archived = await evalJs(`(function(){
    ${MINE}
    var dv = window.planbook.calendarDerived, s = window.planbook.store;
    s.update(function(d){
      (d.classes || []).forEach(function(c){ if (c.id === '${CLS}') c.archived = true; }); });
    var away = mine(dv.derivedItemsIn(s.getDoc(), '${M_FROM}', '${M_TO}'));
    s.update(function(d){
      (d.classes || []).forEach(function(c){ if (c.id === '${CLS}') c.archived = false; }); });
    var back = mine(dv.derivedItemsIn(s.getDoc(), '${M_FROM}', '${M_TO}'));
    return { away: away.map(function(i){ return i.kind; }), back: back.length }; })()`);
  check('archiving the class takes its due date, its term edges and its meeting states off the '
    + 'calendar and leaves the review date, which belongs to a student rather than to a class — '
    + 'and un-archiving brings all six back',
    archived.away.join(',') === 'review-date' && archived.back === 6,
    'with the class archived the month holds ' + JSON.stringify(archived.away)
      + '; with it back it holds ' + archived.back + ' item(s)');

  /* Teardown by id, the WO-6.1 shape: this block reloaded, so a snapshot parked on window is gone.
     The two authored events go by the ids the seed handed back rather than by title, and the
     presentation preference is put back to whatever this browser had before the block ran. */
  const cleaned = await evalJs(`(function(){
    var s = window.planbook.store;
    s.update(function(d){
      d.classes = (d.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      d.students = (d.students || []).filter(function(p){ return p.id !== '${STU}'; });
      d.assignments = (d.assignments || []).filter(function(a){ return a.id !== '${ASG}'; });
      d.attendance = (d.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
      d.events = (d.events || []).filter(function(e){
        return e.id !== '${DROP_ID}' && e.id !== '${SHUT_ID}'; });
    });
    window.planbook.supports.setPresentationMode(${plant && plant.mode ? 'true' : 'false'});
    var d = s.getDoc();
    return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
      students:(d.students || []).filter(function(p){ return p.id === '${STU}'; }).length,
      assignments:(d.assignments || []).filter(function(a){ return a.id === '${ASG}'; }).length,
      events:(d.events || []).length,
      mode: window.planbook.supports.presentationMode() }; })()`);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-6.2 fixture came back off the document, and presentation mode was left as it was '
    + 'found',
    cleaned.classes === 0 && cleaned.students === 0 && cleaned.assignments === 0
      && cleaned.events === SEEDED.length - 2 && cleaned.mode === !!(plant && plant.mode),
    cleaned.classes + ' fixture class(es), ' + cleaned.students + ' student(s) and '
      + cleaned.assignments + ' assignment(s) left behind; ' + cleaned.events
      + ' event(s) in the document (wanted ' + (SEEDED.length - 2)
      + '), presentation mode = ' + cleaned.mode);
}
}
