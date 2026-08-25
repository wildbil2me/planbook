/* term-ended.mjs — the term ended and the screen never said so (WO-2.51)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeColumns, nodeWeekdayAhead } from './lib-dates.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, seam } = h;

/* ───────── the term ended and the screen never said so (WO-2.51) ─────────
 *
 * THE SIBLING OF THE SECTION ABOVE, AND THE OTHER HALF OF ONE OWNER REPORT. WO-2.50 refuses days
 * that belong to no term; this one speaks up about days that belong to a term she is not looking at.
 * Nothing in this app ever moved a teacher from one term to the next — `getSelectedTermId()` falls
 * back to the FIRST term when the stored preference names nothing that exists, never to the term
 * containing today — so the tab sits where she left it in August while every count on the screen is
 * scoped to it. A week into Quarter 2 the registry quietly reports Quarter 1 while she marks
 * Quarter 2, and WO-2.50's decision 1 (the selected tab never bounds what is writable) is what makes
 * that failure pure arithmetic: every mark lands correctly, nothing breaks, and nothing warns.
 *
 * EVERY DATE HERE IS DERIVED FROM TODAY, for the reason the WO-2.50 section gives at length: the
 * terms are built AROUND the six columns on screen — one ending on the fourth column back, one
 * starting on the second and running well past today — so today is genuinely inside the late term
 * with real records either side of the boundary. A fixture pinned to a literal November would stop
 * testing this the moment the calendar passed it.
 *
 * THE CENTRAL CLAIM IS AN ABSENCE, AND IT IS PAIRED WITH THE PRESENCE THAT PROVES THE FIXTURE COULD
 * HAVE BROKEN IT. "Nothing changes the selected term without a tap" is asserted as the `openTermIds`
 * preference serialised BYTE FOR BYTE across a whole second arrival — the class re-selected, the
 * registry re-rendered, the totals repainted — with the band naming the other term on screen the
 * entire time; and the same string is read again immediately after the button is clicked, where it
 * MUST have moved. An unchanged preference on its own would be satisfied by a build that never
 * noticed the rollover at all.
 *
 * AND THE PRECEDENCE IS PROVED IN BOTH DIRECTIONS, THROUGH THE REAL CONTROLS. One band at a time and
 * the off-today message wins it: the pager's own ◀ Earlier takes today off the screen, and the ✏
 * unlocks a past column while today is still on it — two different reasons to be off today, which
 * are the two arms of the condition in `paintBanner()` — and each is followed by the real way back,
 * because a band that goes away and does not come back would satisfy half of that line.
 *
 * THE LABELS ARE THE LAST PHASE AND THEY ARE THE POINT OF THE WHOLE ROW. The same two terms are
 * relabelled `Trimester 1` and `Trimester 2` with nothing else changed, and the band has to read
 * correctly with no code change — asserted as the sentence, the button, AND the absence of the
 * string "quarter" in any case anywhere in the band or the totals line under it. Term ids are opaque
 * (docs/data-model.md; src/classes.js's rule 1), so a build that invented a word instead of reading
 * `term.label` is a build that is wrong for every school that is not on quarters.
 */
console.log('\n--- the term ended and the screen never said so (WO-2.51) ---');

if (!seam) {
  skip('the registry says so when today is inside a term the teacher does not have open',
    'the window.planbook seam is not present, so nothing here could arrange a term or read a preference back');
} else {
  /* Six columns need a laptop's width, and the section above cleared its own override on the way
     out. Stated here rather than inherited, which is the note the two sections above both make. */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));

  const V = nodeColumns(6, 0);                 /* [today, ...five weekdays back] */
  const AHEAD = nodeWeekdayAhead(40);
  const LATER = nodeWeekdayAhead(10);
  const EARLY_ID = 'tm_wo251a', LATE_ID = 'tm_wo251b';
  const EARLY = 'WO-2.51 early', LATE = 'WO-2.51 late', AFTER = 'WO-2.51 after';
  const TRI_A = 'Trimester 1', TRI_B = 'Trimester 2';
  /* `end` on the early term is the fourth column back and `start` on the late one is the second, so
     the pair is contiguous — no gap to trip WO-2.50's own screen — and today sits three columns
     inside the late term with records either side of the boundary. The third arrangement replaces
     the late one with a term that has not begun, which puts today in NO term. */
  const EARLY_TERM = { id: EARLY_ID, label: EARLY, start: V[5], end: V[3] };
  const LATE_TERM = { id: LATE_ID, label: LATE, start: V[2], end: AHEAD };
  const AFTER_TERM = { id: LATE_ID, label: AFTER, start: LATER, end: AHEAD };

  /* Written out in full rather than pattern-matched: this is the sentence a teacher reads at the
     classroom door, and both halves of it — which term today is in, which one she is on — are the
     claim the work order makes. */
  const SAYS = 'Today is in ' + LATE + ' — you are still on ' + EARLY + '.';
  const BTN = 'Switch to ' + LATE;
  const TRI_SAYS = 'Today is in ' + TRI_B + ' — you are still on ' + TRI_A + '.';
  const TRI_BTN = 'Switch to ' + TRI_B;
  /* Two records inside the early term and three inside the late one, so the figures on the three
     surfaces WO-2.18 enumerates have somewhere to move TO. Five in the year under either term,
     which is what makes each pair of strings below a claim about the TERM rather than about a line
     having been redrawn at all. */
  const DATES = [V[5], V[4], V[2], V[1], V[0]];
  const LINE_EARLY = EARLY + ': 2 recorded meetings · Year: 5 recorded meetings';
  const LINE_LATE = LATE + ': 3 recorded meetings · Year: 5 recorded meetings';
  const ROW_EARLY = EARLY + ' · P 2 · T 0 · A 0 · E 0 · D 0 · 100%';
  const ROW_LATE = LATE + ' · P 3 · T 0 · A 0 · E 0 · D 0 · 100%';

  /* A CLICK THAT REPORTS RATHER THAN THROWS, for the reason the section above gives: the ✏ this
     block reaches for is a control a mutated build may not draw, `clickSel()` throws when it finds
     nothing, and an abort there would take the rest of the block's reports down with it. */
  const clickIf = async (sel) => {
    if (!(await has(sel))) return false;
    await clickSel(sel);
    return true;
  };

  /* THE BAND, THE PREFERENCE AND THE THREE TOTALS SURFACES, IN ONE READ. Everything is taken out of
     the DOM the teacher looks at — the band's own sentence, the text on its button, the hooks that
     button actually carries — and never out of the module that drew them, for the reason WO-2.18's
     trap gives about the detail panel: a sentence composed correctly and never painted is the whole
     bug. The two facts that ARE asked of the app are the two with no surface of their own: what it
     thinks today is, and which term contains it. Flushed first, per tools/README.md trap 6. */
  const READ = `(async function(){
    await window.planbook.store.flush();
    var c = window.planbook.classes, a = window.planbook.attendance;
    var band = document.getElementById('attendanceBanner');
    var buttons = band ? Array.prototype.slice.call(band.querySelectorAll('button')) : [];
    var hooks = buttons.map(function(b){
      var out = [];
      Array.prototype.slice.call(b.attributes).forEach(function(x){
        if (x.name.indexOf('data-') === 0) out.push(x.name + '=' + x.value); });
      return out.join(' '); });
    var nav = document.getElementById('termNav');
    var tabs = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
    var row = document.querySelector('[data-attendance-row="wo251-student"]');
    var line = row ? row.querySelector('.attendance-student-totals') : null;
    var text = band ? band.querySelector('.attendance-banner-text') : null;
    var view = document.getElementById('classView');
    var today = a.todayISO();
    var holds = c.termContaining(c.getSelectedClassId(), today);
    return {
      up: !!(band && !band.classList.contains('hidden')),
      cls: band ? band.className : '',
      text: text ? text.textContent : '',
      all: band ? band.textContent : '',
      btnText: buttons.length ? buttons[0].textContent : '',
      buttons: buttons.length,
      hooks: hooks.join(' | '),
      pref: JSON.stringify(window.planbook.getPref('openTermIds') || {}),
      term: c.getSelectedTermId(),
      active: tabs.filter(function(b){ return b.classList.contains('active'); })
        .map(function(b){ return b.getAttribute('data-term-select'); }).join(','),
      classText: (document.getElementById('attendanceTotals') || {}).textContent || '',
      rowText: line ? line.textContent : '',
      stateLine: (document.getElementById('attendanceState') || {}).textContent || '',
      editDate: (document.getElementById('attendanceDate') || {}).textContent || '',
      registryUp: !!(view && !view.classList.contains('hidden')),
      today: today,
      holds: holds ? holds.id : '' }; })()`;
  const read251 = () => evalJs(READ);
  const prefOnly = () => evalJs(
    "JSON.stringify(window.planbook.getPref('openTermIds') || {})");

  /* One arrangement of terms and one choice of tab, through the store and through selectTerm() — no
     control types six dates, and the tab this fixture needs is the one a teacher would NOT have
     moved off. Everything after this call is either a read or a real click. */
  const arrange = (terms, pick) => evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var id = c.getSelectedClassId();
    var cls = (s.getDoc().classes || []).filter(function(x){ return x.id === id; })[0];
    if (!cls) return { ok:false, why:'no class is open' };
    s.update(function(){ cls.terms = ${JSON.stringify(terms)}; });
    c.selectTerm(${JSON.stringify(pick)});
    a.lockDay();
    a.setSearch(''); a.setFilter('all');
    a.renderAttendance();
    await s.flush();
    return { ok:true, term: c.getSelectedTermId() }; })()`);

  const plant251 = await evalJs(`(async function(){
    var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var id = c.getSelectedClassId();
    var cls = (d.classes || []).filter(function(x){ return x.id === id; })[0];
    if (!cls) return { ok:false, why:'no class is open, so there is no term nav to tap and no registry to band' };
    /* Parked on the window rather than carried back through CDP, for the reason the WO-2.17 and
       WO-2.50 fixtures both give: the teardown has to put the SAME object graph back, and a
       document that made the round trip would come back a copy of a copy.
       (No backticks in this comment: it is inside a template literal.) */
    window.__wo251 = { doc: JSON.stringify(d), classId: id, termId: c.getSelectedTermId() };
    s.update(function(doc){
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(cls.roster)) cls.roster = [];
      doc.attendance = doc.attendance.filter(function(r){ return r.classId !== id; });
      ${JSON.stringify(DATES)}.forEach(function(date){
        doc.attendance.push({ classId: id, date: date, marks: {} }); });
      doc.students.push({ id:'wo251-student', first:'Roll', last:'Over' });
      cls.roster.push('wo251-student');
    });
    a.setSearch(''); a.setFilter('all');
    c.selectClass(id);
    await s.flush();
    return { ok:true, classId:id, name: cls.name }; })()`);

  if (!plant251.ok) {
    check('the WO-2.51 fixture is real: a class with a roster and two dated terms is open on the registry',
      false, plant251.why);
  } else {
    /* ── PHASE A: today inside the late term, the tab still on the early one ── */
    await arrange([EARLY_TERM, LATE_TERM], EARLY_ID);
    const prefAfterArranging = await prefOnly();
    /* THE WHOLE ARRIVAL, RUN AGAIN WITH THE TAB WHERE SHE LEFT IT, and it is the presence half of
       the absence check below: the class re-selected, the registry re-rendered and the totals
       repainted are every path that could plausibly "help" by moving the tab onto the term that
       contains today. */
    await evalJs(`(async function(){
      var c = window.planbook.classes, a = window.planbook.attendance;
      c.selectClass(c.getSelectedClassId());
      a.renderAttendance();
      a.paintRenderedTotals();
      await window.planbook.store.flush();
      return 1; })()`);
    const start = await read251();

    check('the WO-2.51 fixture is real: the registry is up over two dated terms, today falls inside the LATE one, and the tab is on the EARLY one',
      start.registryUp && start.today === V[0] && start.holds === LATE_ID
        && start.term === EARLY_ID && start.active === EARLY_ID
        && start.classText === LINE_EARLY && start.rowText === ROW_EARLY,
      'the app says today is ' + JSON.stringify(start.today) + ', this file derived '
        + JSON.stringify(V[0]) + '; the early term runs ' + V[5] + ' … ' + V[3]
        + ' and the late one ' + V[2] + ' … ' + AHEAD + '; today is inside '
        + JSON.stringify(start.holds) + ' and the open tab is ' + JSON.stringify(start.term)
        + ' :: ' + JSON.stringify(start.classText) + ' :: ' + JSON.stringify(start.rowText));

    check('with today inside a term the teacher does not have open, the band is up and names BOTH terms',
      start.up && start.text === SAYS && start.cls.indexOf('rollover') >= 0,
      JSON.stringify(start.text) + ' :: the band wears ' + JSON.stringify(start.cls));

    check('and the one button on it names the destination, out of term.label',
      start.buttons === 1 && start.btnText === BTN,
      start.buttons + ' button(s) on the band :: ' + JSON.stringify(start.btnText));

    check('that button goes through the term nav own route — one data-term-select carrying the late term id, and no second way to change the selected term',
      start.hooks === 'data-term-select=' + LATE_ID,
      JSON.stringify(start.hooks));

    check('and nothing moved the selected term while that band was on screen — the preference is byte-identical across a second whole arrival',
      start.pref === prefAfterArranging && start.term === EARLY_ID
        && prefAfterArranging.indexOf(EARLY_ID) >= 0,
      'the preference read ' + prefAfterArranging + ' before the arrival and ' + start.pref
        + ' after it, with the band reading ' + JSON.stringify(start.text));

    /* ── the tap, and the two totals surfaces that need no unlocked day ──

       THE ⋯ IS NOT ON SCREEN HERE ANY MORE, AND THAT IS WO-2.52 WORKING RATHER THAN A REGRESSION.
       The strip is built from the SELECTED term now, so with the tab on a term that ended the
       registry anchors on that term's last day — a past day, read-only until its own ✏ is pressed —
       and the row's ⋯ is drawn only while some column accepts edits. Which is the same sentence
       this app has always said about a past column, arrived at from the other side. So the third
       surface is driven on its own below, with a day deliberately unlocked, and this pair of checks
       asserts what the band's own button does. Clicking the ⋯ here is what crashed this block on a
       correct app. */
    const before = await read251();
    const tapped = await clickIf('#attendanceBanner [data-term-select]');
    const after = await read251();

    check('tapping it selects the term today is in: the preference moves, the nav highlight moves with it, and the band goes',
      tapped && before.pref !== after.pref && after.term === LATE_ID && after.active === LATE_ID
        && before.up && !after.up && after.buttons === 0,
      'preference ' + before.pref + ' -> ' + after.pref + ', open term '
        + JSON.stringify(before.term) + ' -> ' + JSON.stringify(after.term)
        + ', nav active ' + JSON.stringify(before.active) + ' -> ' + JSON.stringify(after.active)
        + ', band up ' + before.up + ' -> ' + after.up);

    check('and the counts and the row lines repaint in that same tap — two of the three surfaces WO-2.18 enumerates',
      before.classText === LINE_EARLY && after.classText === LINE_LATE
        && before.rowText === ROW_EARLY && after.rowText === ROW_LATE,
      JSON.stringify(before.classText) + ' -> ' + JSON.stringify(after.classText) + ' :: '
        + JSON.stringify(before.rowText) + ' -> ' + JSON.stringify(after.rowText));

    /* AND THE STRIP ITSELF FOLLOWED THE TERM (WO-2.52). The tap above moved the selected term from
       one that ended four columns back to the one that holds today, so the day the screen is ABOUT
       moved with it — from the early term's last day to today. Read off the date heading, which is
       the sentence a teacher reads, rather than off the module that composed it. */
    check('and the strip re-anchors on the same tap: the screen was about the ended term’s last day and is about today afterwards',
      /* Matched on the day and the year rather than on the whole sentence: the wording of a spoken
         date is src/date-text.js's claim and the attendance section's, and re-asserting it here
         would be a second opinion about a format this block is not about. */
      before.editDate.indexOf(' ' + Number(V[3].slice(8, 10)) + ', ' + V[3].slice(0, 4)) > 0
        && after.editDate.indexOf(' ' + Number(V[0].slice(8, 10)) + ', ' + V[0].slice(0, 4)) > 0
        && before.editDate !== after.editDate,
      JSON.stringify(before.editDate) + ' -> ' + JSON.stringify(after.editDate)
        + ' (the early term ends ' + V[3] + ' and today is ' + V[0] + ')');

    /* ── the figures, across a term change that moves the anchor ──

       THE HARD VERSION OF THE TWO CHECKS ABOVE: the strip is rebuilt from the early term's last day,
       and the class line has to come back describing the term that was tapped rather than the one
       the columns were built from. The ✏ on that last day is pressed first — the route WO-2.52's
       acceptance line 7 describes — so the day the screen is about is a day the teacher unlocked, and
       the switch is driven from the term NAV rather than from the band, because the band on an
       unlocked day is the "you are editing" message and carries no term button: one band at a time,
       which is WO-2.51's own precedence rule still holding.

       IT ASSERTED THE OPEN DETAIL PANEL'S OWN FIGURES UNTIL WO-2.53, on WO-2.18's reasoning that
       paintRenderedTotals() painted a third surface nothing checked. That panel is gone and so is the
       third surface; what the tap owes is the class line and the row lines, both asserted here and
       above, and the band, asserted in the phases below. */
    await clickIf('#attendanceHead th[data-attendance-col="' + V[3] + '"] [data-attendance-edit]');
    const onLate = await read251();
    await clickSel('#termNav [data-term-select="' + EARLY_ID + '"]');
    const onEarly = await read251();

    check('the class figures repaint across a term change that moves the strip under them — from an unlocked day inside the term that has ended',
      onLate.classText === LINE_LATE && onEarly.classText === LINE_EARLY
        && onLate.rowText === ROW_LATE && onEarly.rowText === ROW_EARLY,
      JSON.stringify(onLate.classText) + ' -> ' + JSON.stringify(onEarly.classText)
        + ' :: ' + JSON.stringify(onLate.rowText) + ' -> ' + JSON.stringify(onEarly.rowText));

    /* The unlocked day locked again, then the tab put back on the term today is in — the phases
       below page and unlock for themselves, and a fixture none of them asked for is how a check
       reports about a screen it did not arrange. */
    await evalJs('(function(){ window.planbook.attendance.lockDay(); return 1; })()');
    await clickSel('#termNav [data-term-select="' + LATE_ID + '"]');

    /* ── PHASE B: the right term already open ── */
    await evalJs(`(async function(){ var a = window.planbook.attendance;
      a.renderAttendance(); await window.planbook.store.flush(); return 1; })()`);
    const settled = await read251();
    check('with the term today is in already open, a full repaint draws no band at all — the reminder is a condition being true, not a thing that was dismissed',
      !settled.up && settled.buttons === 0 && settled.term === LATE_ID
        && settled.holds === LATE_ID,
      'band up = ' + settled.up + ', open term ' + JSON.stringify(settled.term)
        + ', term containing today ' + JSON.stringify(settled.holds) + ', the band reads '
        + JSON.stringify(settled.all));

    /* ── PHASE C: today inside no term at all — WO-2.50's screen owns that day ──

       TODAY'S OWN RECORD COMES OFF FIRST, AND THAT IS WO-2.50's DECISION 2 RATHER THAN TIDINESS: a
       day that already carries attendance is never out of term — the record wins, and the state
       line over it reads "Taken" — so a fixture that left the planted record on today would be
       asserting this band's silence on a day WO-2.50's screen is silent about too, which proves
       nothing about which of them owns it. Found by running it: the first draft of this check read
       back `Taken · all present`. It goes back on before the phase below. */
    const dropToday = (put) => evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var id = c.getSelectedClassId(), on = ${JSON.stringify(V[0])};
      s.update(function(doc){
        doc.attendance = (doc.attendance || []).filter(function(r){
          return !(r.classId === id && r.date === on); });
        if (${put ? 'true' : 'false'}) doc.attendance.push({ classId:id, date:on, marks:{} });
      });
      a.renderAttendance();
      await s.flush();
      return (s.getDoc().attendance || []).filter(function(r){
        return r.classId === id; }).length; })()`);

    await arrange([EARLY_TERM, AFTER_TERM], EARLY_ID);
    const held = await dropToday(false);
    const gap = await read251();
    /*
      THIS ROW'S BAND STILL SAYS NOTHING ON A DAY IN NO TERM, AND SOMETHING ELSE NOW SPEAKS THERE
      (WO-2.52). WO-2.51 declined this day because WO-2.50's grid was already saying it four ways —
      the column, the chip, the state line and the home card — and two bands disagreeing about one
      day is worse than either. The anchor has since moved the grid INTO the selected term, so none
      of those four is saying it any more and a new band explains the date on screen instead. What
      is asserted is therefore both halves: no rollover — no term button, no rollover tone — and the
      other band, in its own tone, naming the selected term and the side of it today falls on.

      The sentence is pinned at both ends rather than composed here: this file does not own a date
      formatter and a second one is what src/date-text.js's header spends a thousand words on.
    */
    check('with today inside NO term this row’s band still says nothing — and WO-2.52’s band says which term the screen is standing in instead, in its own tone and with no term button on it',
      held === DATES.length - 1 && gap.holds === ''
        && gap.up && gap.buttons === 0 && gap.hooks === ''
        && gap.cls.indexOf('rollover') < 0 && gap.cls.indexOf('off-term') >= 0
        && gap.text.indexOf(EARLY + ' ended on ') === 0
        && gap.text.indexOf(', ' + V[3].slice(0, 4) + '.') > 0,
      'the band reads ' + JSON.stringify(gap.text) + ' and wears ' + JSON.stringify(gap.cls)
        + ' with ' + gap.buttons + ' button(s) on it; the term containing today = '
        + JSON.stringify(gap.holds) + ', and the class holds '
        + held + ' record(s) — today\'s own is off, because a day that carries one is never out of '
        + 'term (WO-2.50 decision 2)');
    await dropToday(true);

    /* ── PHASE D: one band at a time, and the off-today message wins it ── */
    await arrange([EARLY_TERM, LATE_TERM], EARLY_ID);
    const backOn = await read251();
    await clickSel('#attendancePager [data-attendance-page="earlier"]');
    const paged = await read251();
    await clickSel('#attendancePager [data-attendance-page="today"]');
    const returned = await read251();
    await clickSel('#termNav [data-term-select="' + EARLY_ID + '"]');
    const chosenAgain = await read251();
    /* THE OFF-TODAY BAND IS AN OFF-ANCHOR BAND SINCE WO-2.52, and the sentence names the day the
       strip is standing on rather than today: with the tab on a term that ended, the strip opens on
       that term's last day and "Today is not on screen" would be true of an arrival nobody paged.
       The precedence is the one being asserted and it is unchanged — the message about the day on
       screen beats the message about the term.

       AND THE WAY BACK NOW ANSWERS THIS BAND RATHER THAN RETURNING TO IT (WO-2.54). `Today` moved the
       selected term to the one that holds today as it came back, so what used to be the third state
       here — the rollover band up again — is a screen with no band at all and the tab on the right
       term. That is this band's own condition being RESOLVED, which is what it exists to ask for, so
       the check follows it with a real tap on the early term's tab: the rollover is back on the paint
       after it, unpaged, which is the precedence claim this check was written for. Three states, one
       of them new, and none of them dropped. */
    check('paged back off the day the strip opened on, the band on screen is that one and not this one — the pager’s way back RESOLVES this one by moving the tab, and tapping the early term again gives it straight back',
      backOn.up && backOn.text === SAYS
        && paged.up && paged.text.indexOf(' is not on screen.') > 0
        && paged.text.indexOf(', ' + V[3].slice(0, 4) + ' is not on screen.') > 0
        && paged.hooks === 'data-attendance-page=today'
        && returned.term === LATE_ID && !returned.up
        && chosenAgain.term === EARLY_ID && chosenAgain.up && chosenAgain.text === SAYS
        && chosenAgain.hooks === 'data-term-select=' + LATE_ID,
      JSON.stringify(backOn.text) + ' -> paged ' + JSON.stringify(paged.text) + ' ['
        + paged.hooks + '] -> back on term ' + JSON.stringify(returned.term) + ' with '
        + JSON.stringify(returned.text) + ' [' + returned.hooks + '] -> the early tab tapped again '
        + JSON.stringify(chosenAgain.text) + ' [' + chosenAgain.hooks + ']');

    /* The other arm of the same condition, and it is a different fact: today IS on the screen, and
       the day accepting edits is not today. The ✏ is the real control, on a past column inside the
       late term so that WO-2.50 draws one there at all. The sentence is compared against the app's
       own spoken date read off the state line, rather than against a date this file formatted —
       there is one date formatter in this app (src/date-text.js's header is a thousand words about
       what a second one costs) and the claim here is about the band, not about spokenDate(). */
    /* THE COLUMN IS ONE THE STRIP IS ACTUALLY DRAWING (WO-2.52). With the tab on the early term the
       window is that term's last day and the five weekdays before it, so the day after today is not
       on screen to unlock — the ✏ pressed here is the one inside the early term, one column left of
       where the strip opened. */
    const unlocked = await clickIf(
      '#attendanceHead th[data-attendance-col="' + V[4] + '"] [data-attendance-edit]');
    const editing = await read251();
    await evalJs(`(async function(){ var a = window.planbook.attendance;
      a.lockDay(); await window.planbook.store.flush(); return 1; })()`);
    const locked = await read251();
    check('and with a past column unlocked while the strip is standing where it opened, the editing message wins that too — the band describes the day being edited, and locking it again gives this one back',
      unlocked && editing.up && editing.editDate !== locked.editDate
        && editing.text === 'You are editing ' + editing.editDate + ' — not today.'
        && editing.hooks === 'data-attendance-page=today'
        && locked.up && locked.text === SAYS
        && locked.hooks === 'data-term-select=' + LATE_ID,
      'the ✏ was there to click = ' + unlocked + ' :: editing ' + JSON.stringify(editing.editDate)
        + ' ' + JSON.stringify(editing.text) + ' [' + editing.hooks + '] -> back on '
        + JSON.stringify(locked.editDate) + ' ' + JSON.stringify(locked.text) + ' ['
        + locked.hooks + ']');

    /* ── PHASE E: the same two terms, relabelled, and nothing else changed ── */
    await arrange([Object.assign({}, EARLY_TERM, { label: TRI_A }),
      Object.assign({}, LATE_TERM, { label: TRI_B })], EARLY_ID);
    const tri = await read251();
    const triTapped = await clickIf('#attendanceBanner [data-term-select]');
    const triAfter = await read251();
    check('terms labelled Trimester 1 and Trimester 2 produce the same band with those labels in it, and no quarter vocabulary anywhere in what it prints',
      tri.up && tri.text === TRI_SAYS && tri.btnText === TRI_BTN
        && !/quarter/i.test(tri.all) && !/quarter/i.test(tri.classText),
      JSON.stringify(tri.text) + ' :: the button reads ' + JSON.stringify(tri.btnText)
        + ' :: the whole band reads ' + JSON.stringify(tri.all) + ' over a totals line reading '
        + JSON.stringify(tri.classText));
    check('and the button under those labels does what the quarter one did — the label is read, never switched on',
      triTapped && triAfter.term === LATE_ID && !triAfter.up
        && triAfter.classText.indexOf(TRI_B + ':') === 0,
      'open term ' + JSON.stringify(tri.term) + ' -> ' + JSON.stringify(triAfter.term)
        + ', band up ' + tri.up + ' -> ' + triAfter.up + ', and the totals line reads '
        + JSON.stringify(triAfter.classText));

    /* The document back as it was, IN PLACE rather than as a fresh object — every module holds the
       reference getDoc() handed it — with the class and term this block found open put back. */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes, a = window.planbook.attendance;
      var saved = window.__wo251, d = s.getDoc();
      var restored = JSON.parse(saved.doc);
      Object.keys(d).forEach(function(k){ delete d[k]; });
      Object.assign(d, restored);
      s.update(function(){});
      c.selectClass(saved.classId);
      if (saved.termId) c.selectTerm(saved.termId);
      a.lockDay();
      a.setSearch(''); a.setFilter('all'); a.renderAttendance();
      delete window.__wo251;
      await s.flush();
      return 1; })()`);
  }

  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
}
