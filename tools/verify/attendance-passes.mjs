/* attendance-passes.mjs — hall passes (WO-2.9), days off and pre-drops (WO-2.3), and the
 * 2026-08-08 punch list
 *
 * THE SECOND HALF OF ONE SECTION, not a section of its own. tools/verify/attendance.mjs
 * calls it with the fixtures it has already built — a marked class, a dropped class, four
 * students holding passes — because those are this half's preconditions and re-deriving
 * them would be a second fixture that could disagree with the first. It is a separate file
 * on length alone (WO-1.26): the two together are 5,400 lines.
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
import { nodeToday, nodeColumns, nodeWeekdayAhead, tomorrow } from './lib-dates.mjs';

export async function passes(h, ctx) {
const { ROOT, check, skip, send, evalJs, has, clickSel, openCalendarPanel, dateResetOn } = h;
const { closeAll, goHome, read, openCard, park, start, ids, marking, opened, first, others, seen,
  absent, finished, three, noted, dismissed, taken, untaken, dropped, week, apart, paged, marked,
  home, typed, searched, sorted, second, day, back, reset, passClass, passRoster, outA, outB,
  outC, outD, issued, fourth, wound, returned, drawn, typeNote, cancelled } = ctx;

  /*
    ────────────── WO-2.9: the elapsed clock, the two overdue alerts, and the history ──────────────

    FIVE ACCEPTANCE LINES, AND THE FIRST OF THEM IS 👤. "Elapsed time is correct after the app has
    been backgrounded for ten minutes" needs an installed PWA that iOS actually suspended, and no
    headless browser has been suspended by anything. What a desk CAN do is the property underneath
    it, and it is the property the work order's Traps section is really about: the figure is a
    SUBTRACTION from the stored stamp rather than a count of ticks. So the fixture below moves the
    stamp while no timer is watching — a wind-back through the store with no repaint in between —
    and asks what the card says next. A build that accumulated would read `0:0x` after that and a
    build that subtracts reads `41:0x`, which is the same difference an hour in a bag makes.

    THE ALERTS ARE ASSERTED IN ALL THREE OF THEIR CLAUSES, and the middle one is the reason the
    fired-ness is on the pass: this screen re-renders every second, so "not repeatedly" is a claim
    about sixty renders a minute and is asked by clearing the live region, letting several ticks go
    by, and reading it back empty.

    AND THE HISTORY IS COMPARED AGAINST THE LOG THIS FILE COUNTS FOR ITSELF, in Node, out of the
    document — not against the app's own tally, which would be the dialog agreeing with the module
    that drew it. The cancelled-pass line is asked the way WO-2.11's is: a trip is issued, noted,
    seen on the card, and cancelled, and what is compared is the whole dialog before and after.
  */
  console.log('\n--- hall passes: the elapsed clock, the alerts and the history (WO-2.9) ---');

  /* Winds one open pass's time out backwards through the store, with NO repaint: the card on screen
     keeps whatever figure it was last painted with, which is what makes the next paint's answer
     mean something. Returns what it moved, and the check that uses it asserts the move first. */
  const windBack = (studentId, minutes) => evalJs(`(async function(){
    var s = window.planbook.store;
    var was = '';
    s.update(function(d){
      d.openPasses.forEach(function(p){
        if (p.studentId !== ${JSON.stringify(studentId)}) return;
        was = p.out;
        var t = new Date(Date.parse(p.out) - ${JSON.stringify(minutes)} * 60000);
        var pad = function(n){ return (n < 10 ? '0' : '') + n; };
        var off = -t.getTimezoneOffset(), abs = Math.abs(off);
        p.out = t.getFullYear() + '-' + pad(t.getMonth()+1) + '-' + pad(t.getDate())
          + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds())
          + (off < 0 ? '-' : '+') + pad(Math.floor(abs/60)) + ':' + pad(abs % 60);
      }); });
    await s.flush();
    return { was: was, now: (s.getDoc().openPasses.filter(function(p){
      return p.studentId === ${JSON.stringify(studentId)}; })[0] || {}).out }; })()`);

  /* The one path a suspended PWA takes back onto the screen. Dispatched rather than simulated with
     a hand render, for the reason WO-2.12's rotation checks give: a harness that repaints by hand
     goes green against a build with no listener in it. `visibilityState` is asserted with it,
     because a headless page that reported `hidden` would make every reading below vacuous. */
  const wakeUp = () => evalJs(`(function(){
    document.dispatchEvent(new Event('visibilitychange'));
    return { state: document.visibilityState }; })()`);

  const SR_WO29 = 'nothing has been announced since this sentinel was written';
  const hush = () => evalJs('(function(){ var l = document.getElementById("srLive");'
    + ' if (l) l.textContent = ' + JSON.stringify(SR_WO29) + '; return 1; })()');
  const heard = () => evalJs('(function(){ var l = document.getElementById("srLive");'
    + ' return l ? l.textContent : ""; })()');

  /* One student out, on a fresh stamp, with the room otherwise empty. */
  await clickSel('[data-pass-issue="' + outA + '"][data-pass-type="bathroom"]');
  const clock0 = await read();
  const card0 = (clock0.passBanner.cards || [])[0] || {};
  const open0 = clock0.openPasses[0] || {};
  check('the card carries an elapsed figure from the moment it is drawn, and the document holds no count of it',
    clock0.openPasses.length === 1 && clock0.passBanner.cards.length === 1
      && /^0:\d{2}$/.test(card0.elapsed || '')
      /* Addressed by pass id, which is what the patch below finds it by. */
      && card0.elapsedFor === open0.id && card0.over === 0
      /* THE FIGURE IS NOWHERE IN THE RECORD. A build that stored the count it was showing would
         carry a sixth key here, and it would be the count that comes back wrong after a suspend. */
      && open0.keys === 'classId,id,out,studentId,type'
      /* And the ROW is unchanged: the 160px column still shows the time they left and no ticking
         figure beside a Return button (src/attendance.js's note at passControls). */
      && /^\d+:\d{2}[ap]$/.test(((clock0.rows.filter((r) => r.student === outA)[0] || {}).pass || {}).since || ''),
    'the card reads ' + JSON.stringify(card0.elapsed) + ' for pass ' + card0.elapsedFor
      + ', the open pass carries keys ' + JSON.stringify(open0.keys)
      + ', and the row still reads ' + JSON.stringify(((clock0.rows
        .filter((r) => r.student === outA)[0] || {}).pass || {}).since));

  /*
    ── WO-2.28: THE ALERT READS THE DOCUMENT AFTER THE TEACHER LEAVES THE REGISTRY ──

    BOTH WALKS LEAVE THE REGISTRY. The first keeps this class open on Scores. The second asserts the
    named property directly: while Scores is still up, remove this pass's elapsed node from the
    hidden banner, prove it is gone, and then cross the threshold. This is stronger than depending
    on how a node went missing. The earlier navigation version was dropped because selectClass()
    always shows the registry, so a deliberate class switch necessarily paints the banner.

    POLLED RATHER THAN SLEPT for tools/README.md trap 5 and the background-page timer throttling this
    section already documents below. hush() runs before windBack() in both walks because the live
    interval can announce on the first tick after the stamp moves.
  */
  /* The sentence all three callers below assert, held once so that what this helper WAITS for and
     what those checks TEST are the same object rather than two copies that can drift apart. */
  const PASS_ALERT_SAID = /has been out on a bathroom pass for 5 minutes\./;

  /*
    ── WO-2.42: IT WAITS FOR THE SENTENCE, NOT FOR THE FLAG ──

    THE CALLERS ASSERT TWO THINGS and this loop used to exit on one. `alerted === 1` on the record
    and the announcement in the live region are both in every check below; the exit condition read
    the flag alone and sampled `said` beside it, so on the iteration where the flag flipped it
    returned the live region as it stood at that instant and never looked again.

    AND THE APP WRITES THEM IN DIFFERENT TASKS, which is what turns that into a race rather than a
    tidiness point: paintPassElapsed() marks the record synchronously, then announce()
    (src/live-region.js) defers its textContent write by 30ms so that a repeated message reaches
    assistive tech as a change. Between those two tasks the flag reads 1 and the live region still
    holds hush()'s sentinel — a window this file can land in, and did. WO-2.39's unchanged tree ran
    824/824, then 823/824, then 824/824, with `git diff --stat -- src/` empty. Nothing was wrong
    with the app; the wait was waiting on the wrong event.

    THE FIX IS THE CONDITION AND NOT THE CLOCK. A larger cap or a sleep in front of the read would
    make the same race rarer and leave it in, which is tools/README.md trap 5 — and this is that
    trap's own subject, so it is not the place to become another instance of it. The cap stays at
    24 × 250ms. What changed is that both readings must be true of the SAME pair of samples, and
    that the pair the loop exited on is the pair the caller is handed; on a timeout it hands back
    the last pair it saw, so a genuine failure still prints what was actually there.

    IT CANNOT GO GREEN ON NOTHING, which is the standing question in plans/dispatch-retro.md
    § "Fixture assumptions". The sentence arrives in ONE textContent assignment, so matching its
    tail is matching the whole of it, name included — a half-written announcement is not an
    observable state, and that is why the two callers that also look for a first and last name do
    not need those folded in here. A stale live region cannot satisfy it either, because the flag
    is still in the conjunction and every pass these walks wind is asserted to arrive carrying no
    `alerted` key at all (the fixture guards below, and the WO-2.29 note with them). A fourth
    caller keeps that true by hush()ing before it winds and by naming the pattern IT asserts —
    which is why the pattern is an argument with no default: a wait that guessed the sentence
    would spend six seconds on one nobody is going to say, and the check it fed would blame the
    app for it.
  */
  /*
    ── WO-2.46: ONE HELPER FOR ALL SIX CALLERS, AND THE LEVEL IS AN ARGUMENT TOO ──

    THE DECISION IS TO PARAMETERISE RATHER THAN TO WRITE A LEVEL-2 TWIN. Three more sites below want
    this loop and two of them want `alerted === 2`, so the choice was one helper with the level in
    its signature or a second local wait beside it. A second wait would be a copy of the exit
    condition, and a copy of the exit condition is precisely what the constant above exists to
    prevent one line up — PASS_ALERT_SAID is held once "so that what this helper WAITS for and what
    those checks TEST are the same object rather than two copies that can drift apart". Of everything
    in this block, the exit condition is the part least worth having two of: the whole subject of
    WO-2.42 and of this row is that it is easy to get subtly wrong and impossible to see wrong on a
    green run.

    AND IT TAKES NO DEFAULT, for a sharper reason than the pattern's. A default of 1 would not be
    "the common case with the odd exception" — it would be a live wrong answer at a site where 1 is
    also a value the flag really holds. The ten-minute caller winds a pass that is ALREADY at level 1
    from the five-minute wind above it, so a wait for 1 can never be satisfied together with the
    ten-minute sentence: the loop would run all 24 iterations, hand back whatever the last read
    happened to hold, and its check would go green off a six-second sleep. That is WO-2.42's own
    failure mode in a new field, so the level gets WO-2.42's own answer — required, stated at every
    call site, unwritable by omission.

    THE `view` READING AT THE END IS LEFT UNCONDITIONAL. Only the two WO-2.28 walks assert it; the
    three new callers ignore it and pay one CDP round-trip for the privilege. That is the cheaper
    half of the trade above, and making it conditional would put a second shape in the one function
    this comment just argued should have one.
  */
  const waitForPassAlert = async (studentId, saidRe, level) => {
    const arrived = (s, heardNow) => !!studentId
      && (s.openPasses.filter((p) => p.studentId === studentId)[0] || {}).alerted === level
      && saidRe.test(heardNow);
    let state = await read();
    let said = await heard();
    for (let i = 0; i < 24 && !arrived(state, said); i++) {
      await new Promise(r => setTimeout(r, 250));
      state = await read();
      said = await heard();
    }
    const view = await evalJs(`(function(){
      var scores = document.getElementById('scoresView');
      var registry = document.getElementById('classView');
      return { scores: !!scores && !scores.classList.contains('hidden'),
               registry: !!registry && !registry.classList.contains('hidden') }; })()`);
    return { state, said, view };
  };

  await clickSel('#classView [data-class-screen="scores"]');
  await hush();
  const scoresWound = await windBack(outA, 5.2);
  const scoresAlert = await waitForPassAlert(outA, PASS_ALERT_SAID, 1);
  check('with a pass open, crossing a threshold still fires the alert while the teacher is on Scores — on a walk that left the registry',
    !!scoresWound.now && scoresAlert.view.scores && !scoresAlert.view.registry
      && (scoresAlert.state.openPasses.filter((p) => p.studentId === outA)[0] || {}).alerted === 1
      && PASS_ALERT_SAID.test(scoresAlert.said),
    'Scores shown = ' + scoresAlert.view.scores + ', registry shown = ' + scoresAlert.view.registry
      + ', alerted = ' + JSON.stringify((scoresAlert.state.openPasses
        .filter((p) => p.studentId === outA)[0] || {}).alerted)
      + ', announcement = ' + JSON.stringify(scoresAlert.said));

  /* Put outA back on a fresh record so WO-2.9's asleep-past-both-thresholds fixture below still
     starts at level zero and proves exactly what it proved before this walk was added. */
  await clickSel('#scoresView [data-class-screen="class"]');
  await clickSel('[data-pass-cancel="' + outA + '"]');
  await clickSel('[data-pass-issue="' + outA + '"][data-pass-type="bathroom"]');
  const propertyPass = ((await read()).openPasses.filter((p) => p.studentId === outA)[0] || {});
  const propertyStudent = await evalJs(`(function(){
    var d = window.planbook.store.getDoc();
    var cls = (d.classes || []).filter(function(c){
      return c.id === ${JSON.stringify(passClass)}; })[0];
    var id = cls && (cls.roster || []).filter(function(x){
      return x === ${JSON.stringify(outA)}; })[0];
    var s = id && (d.students || []).filter(function(x){ return x.id === id; })[0];
    return s ? { first: s.first || '', last: s.last || '' } : { first: '', last: '' }; })()`);

  /* Save the exact teacher-data state and the live-region text before making the DOM-only hole.
     The restoration check below compares the whole document apart from its two save stamps. */
  const beforeMissingNodeDoc = await evalJs(`(function(){
    var d = JSON.parse(JSON.stringify(window.planbook.store.getDoc()));
    delete d.rev; delete d.updatedAt;
    return JSON.stringify(d); })()`);
  const beforeMissingNodePass = await evalJs(`(function(){
    var p = (window.planbook.store.getDoc().openPasses || []).filter(function(x){
      return x.id === ${JSON.stringify(propertyPass.id)}; })[0];
    return p ? JSON.stringify(p) : ''; })()`);
  const beforeMissingNodeLive = await heard();
  await clickSel('#classView [data-class-screen="scores"]');
  const missingNodeFixture = await evalJs(`(function(){
    var box = document.getElementById('attendancePassBanner');
    var scores = document.getElementById('scoresView');
    var registry = document.getElementById('classView');
    var sel = '[data-pass-elapsed="' + ${JSON.stringify(propertyPass.id)} + '"]';
    var node = box && box.querySelector(sel);
    if (node) node.remove();
    return { nodes: box ? box.querySelectorAll(sel).length : -1,
             scores: !!scores && !scores.classList.contains('hidden'),
             registry: !!registry && !registry.classList.contains('hidden') }; })()`);
  /* THE PRECONDITION, AND WHY IT IS A CLAUSE HERE RATHER THAN A CHECK OF ITS OWN (WO-2.29). The
     alert check below asserts `alerted === 1` after the stamp moves and never that it was not 1
     before, and waitForPassAlert() loops UNTIL the flag reads 1 — so a pass that arrived here
     already alerted would return on the first read and that check would go green having proved
     nothing. It is not vacuous today and not by luck: the pass was cancelled and re-issued above, so
     this record is new and carries no `alerted` key at all. What was missing is the guard that keeps
     that true when someone reorders the block, which is the shape plans/dispatch-retro.md
     § "Fixture assumptions" says escapes a green run. It rides on the truthiness test that was
     already here rather than arriving as a new call site: a fixture guard is not a new claim, and
     the count in tools/README.md had just settled. */
  const beforeMissingNodeFresh = !!beforeMissingNodePass
    && !('alerted' in JSON.parse(beforeMissingNodePass));
  check('the document-driven alert fixture removes this pass\'s elapsed node while Scores remains up, before the stamp moves — over a pass that has not already alerted',
    beforeMissingNodeFresh && missingNodeFixture.nodes === 0
      && missingNodeFixture.scores && !missingNodeFixture.registry,
    'saved pass = ' + (beforeMissingNodePass || '(none)') + ', carrying no `alerted` key = '
      + beforeMissingNodeFresh + ', matching elapsed nodes = '
      + missingNodeFixture.nodes + ', Scores shown = ' + missingNodeFixture.scores
      + ', registry shown = ' + missingNodeFixture.registry);

  await hush();
  const missingNodeWound = await windBack(outA, 5.2);
  const missingNodeAlert = await waitForPassAlert(outA, PASS_ALERT_SAID, 1);
  const missingNodeAfter = await evalJs(`(function(){
    var box = document.getElementById('attendancePassBanner');
    var sel = '[data-pass-elapsed="' + ${JSON.stringify(propertyPass.id)} + '"]';
    return box ? box.querySelectorAll(sel).length : -1; })()`);
  check('with no banner node for the pass, the document still drives its overdue alert while the registry stays unpainted',
    !!missingNodeWound.now && missingNodeAlert.view.scores && !missingNodeAlert.view.registry
      && (missingNodeAlert.state.openPasses.filter((p) => p.id === propertyPass.id)[0] || {}).alerted === 1
      && PASS_ALERT_SAID.test(missingNodeAlert.said)
      /* The card renders "Last, First"; the sentence renders the document name as "First Last". */
      && !!propertyStudent.first && missingNodeAlert.said.indexOf(propertyStudent.first) >= 0
      && !!propertyStudent.last && missingNodeAlert.said.indexOf(propertyStudent.last) >= 0
      && missingNodeAfter === 0,
    'Scores shown = ' + missingNodeAlert.view.scores + ', registry shown = '
      + missingNodeAlert.view.registry + ', matching elapsed nodes = ' + missingNodeAfter
      + ', alerted = ' + JSON.stringify((missingNodeAlert.state.openPasses
        .filter((p) => p.id === propertyPass.id)[0] || {}).alerted)
      + ', announcement = ' + JSON.stringify(missingNodeAlert.said));

  /* Restore the exact pass record (out stamp and absence of alerted), then the registry. Its normal
     paint restores the elapsed node removed above and announces, so the prior live-region text goes
     back only after that final navigation. */
  await evalJs(`(async function(){
    var s = window.planbook.store;
    var saved = JSON.parse(${JSON.stringify(beforeMissingNodePass || '{}')});
    s.update(function(d){
      var i = (d.openPasses || []).findIndex(function(p){ return p.id === saved.id; });
      if (i >= 0) d.openPasses[i] = saved;
    });
    await s.flush();
    return 1; })()`);
  await clickSel('#scoresView [data-class-screen="class"]');
  await evalJs(`(function(){
    var live = document.getElementById('srLive');
    if (live) live.textContent = ${JSON.stringify(beforeMissingNodeLive)};
    return 1; })()`);
  const handedBack228 = await read();
  const afterMissingNodeDoc = await evalJs(`(function(){
    var d = JSON.parse(JSON.stringify(window.planbook.store.getDoc()));
    delete d.rev; delete d.updatedAt;
    return JSON.stringify(d); })()`);
  const restoredLive228 = await heard();
  check('and the missing-node walk restores the document, live region, registry, and elapsed node it disturbed',
    afterMissingNodeDoc === beforeMissingNodeDoc && handedBack228.openClass === passClass
      && handedBack228.viewShown
      && (handedBack228.openPasses.filter((p) => p.id === propertyPass.id)[0] || {}).alerted == null
      && (handedBack228.passBanner.cards || []).some((c) => c.elapsedFor === propertyPass.id)
      && restoredLive228 === beforeMissingNodeLive,
    'document content byte-identical apart from save stamps = '
      + (afterMissingNodeDoc === beforeMissingNodeDoc) + ', open class = '
      + JSON.stringify(handedBack228.openClass) + ', registry shown = ' + handedBack228.viewShown
      + ', elapsed node restored = ' + (handedBack228.passBanner.cards || [])
        .some((c) => c.elapsedFor === propertyPass.id) + ', live region restored = '
      + (restoredLive228 === beforeMissingNodeLive));

  /* THE FIXTURE FOR THE 👤 LINE, and both halves of it are asserted before they are used: the stamp
     moves 41 minutes into the past through the store, and a sentinel goes on the card element so
     that "the figure was patched" and "the card was rebuilt" cannot be confused. A rebuild is the
     failure that would take the note field's caret and the software keyboard with it. */
  await evalJs('(function(){ var c = document.querySelector(".attendance-pass-card");'
    + ' if (c) c.setAttribute("data-wo29-sentinel", "planted"); return 1; })()');
  await typeNote('[data-pass-note="' + outA + '"]', 'half-typed while the clock ran');
  /* Hushed BEFORE the stamp moves, not after: the clock is running, so the alert this wind-back
     earns can land on any tick from here on, and a sentinel written afterwards would erase the very
     announcement the check below is looking for. */
  await hush();
  const winded = await windBack(outA, 41);
  const planted = await read();
  check('the fixture for a backgrounded app is real: the stamp moved 41 minutes into the past, through the store, on a card this run has had on screen for about a second',
    !!winded.was && !!winded.now
      && Math.round((Date.parse(winded.was) - Date.parse(winded.now)) / 60000) === 41
      /* The sentinel is on the card that was drawn a moment ago, which is what makes "patched, not
         rebuilt" readable below rather than a claim about an element nobody marked. */
      && ((planted.passBanner.cards || [])[0] || {}).sentinel === 'planted',
    'out went from ' + winded.was + ' to ' + winded.now + '; the card carries sentinel '
      + JSON.stringify(((planted.passBanner.cards || [])[0] || {}).sentinel) + ' and reads '
      + JSON.stringify(((planted.passBanner.cards || [])[0] || {}).elapsed));

  /*
    ── WO-2.46: THIS SLEEP IS DELIBERATELY LEFT, AND THE THREE READINGS BELOW ARE NOT ──

    IT IS THE ONE `setTimeout(250)` IN THIS FIXTURE THAT SURVIVES WO-2.46 — the row's fourth site,
    and the reason is written here rather than left to be rediscovered as an oversight. The three
    readings the row put behind real waits all read the live region, which is a write that lands in a
    LATER TASK than the one setting the flag beside it (src/live-region.js defers 30ms). This check reads
    no announcement at all — the card's figure, the WO-2.29 sentinel and the note field, all three of
    them DOM state that visibilitychange's handler has already written by the time wakeUp()'s own
    evaluation returns, because src/attendance.js calls paintPassElapsed() synchronously from that
    listener. There is no two-task pair here, so there is nothing for a poll to close.

    AND A POLL HERE WOULD MEASURE LESS, not more, which is the part worth saying out loud. This check
    is about coming BACK to the screen: the figure is recomputed from the stamp on wake rather than
    carried by a counter that was not running. But the 1s interval recomputes from the same stamp,
    so a bounded poll for `/^41:\d{2}$/` would be satisfied by the interval a second later on a build
    with no visibilitychange handler in it at all — the check would go green having stopped being
    about the wake. A single read taken as soon as wakeUp() returns is what keeps the claim, and the
    250ms is slack in front of it rather than the defence trap 5 warns about.
  */
  const woke = await wakeUp();
  await new Promise(r => setTimeout(r, 250));
  const backAwake = await read();
  const cardAwake = (backAwake.passBanner.cards || [])[0] || {};
  check('and coming back to the screen recomputes it from the stamp — 41 minutes, not the two a ticking counter would have kept (the desk half of a 👤 line)',
    woke.state === 'visible'
      && /^41:\d{2}$/.test(cardAwake.elapsed || '')
      /* PATCHED, NOT REPAINTED: the sentinel is still on the card and the half-typed note is still
         in the field. A rebuild once a second is the defect this shape exists to avoid. */
      && cardAwake.sentinel === 'planted'
      && cardAwake.note === 'half-typed while the clock ran',
    'the page was ' + woke.state + ' and the card now reads ' + JSON.stringify(cardAwake.elapsed)
      + '; sentinel = ' + JSON.stringify(cardAwake.sentinel) + ', note field = '
      + JSON.stringify(cardAwake.note));

  /* And it does it on its own, with no repaint and no wake-up: the seconds field has to move while
     this file does nothing but watch. The only check here that watches the TIMER rather than the
     arithmetic, and it is what goes red if the interval is never started.

     POLLED RATHER THAN SLEPT, which is trap 5 in tools/README.md and matters here for a specific
     reason: a headless page that has been open for minutes is a BACKGROUND page to Chrome, and
     background pages get their timers budget-throttled — a 1000ms interval measured over a fixed
     1.4s window in this browser really did report "no tick" on a build that ticks. The claim is
     that the figure advances on its own, not that it advances on a particular second, and the poll
     is what says the first without asserting the second. On the device this ships to the interval
     is a foreground one and the tick is the second it asks for. */
  const before1s = cardAwake.elapsed;
  let cardTicked = {};
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 250));
    /* WO-2.46: the whole state was kept here as well, as `ticked`, purely so the escalation check
       below could take its `alerted` flag off THIS loop's exit sample. It reads a sample of its own
       now and nothing else ever wanted this one — what the interval check needs is the card, and the
       card is what this keeps. The exit condition, the cap and the sleep are untouched. */
    cardTicked = (((await read()).passBanner.cards) || [])[0] || {};
    if (cardTicked.elapsed !== before1s) break;
  }
  check('the figure moves on its own, with no repaint and no wake-up — the interval is running',
    /^4[12]:\d{2}$/.test(cardTicked.elapsed || '') && cardTicked.elapsed !== before1s
      && cardTicked.sentinel === 'planted',
    'it read ' + JSON.stringify(before1s) + ' and then read ' + JSON.stringify(cardTicked.elapsed)
      + ' with nothing but a wait in between');

  /*
    ── ACCEPTANCE LINE 2, and this student is the "asleep past both thresholds" case ──

    41 minutes out means both thresholds were crossed while nothing was running. What must NOT
    happen is two alerts: the level goes straight to 2, the first one never fires, and the sentence
    says how long it has actually been rather than which threshold was crossed — "ten minutes" about
    a student who has been gone for forty-one is the elapsed-time trap arriving in the words.
  */
  /*
    ── WO-2.46: A SECOND BOUNDED WAIT, AFTER THE POLL AND NOT INSIDE IT ──

    WHAT THIS CHECK ASSERTED WAS NEVER WHAT THE LOOP ABOVE EXITED ON. The poll exits when the elapsed
    figure moves; this check asserts an escalation, a card level and a sentence. The figure moving is
    a proxy for the first, unrelated to the third, and `said41` was a fresh `heard()` taken after a
    loop that had never once looked at the live region — trap 5 one level in, the exact shape WO-2.42
    fixed at waitForPassAlert() near the top of this block. Worse than the two fixed sleeps below, in
    fact, because the two halves of one check came from two different samples and neither of them was
    the sample the loop exited on.

    NOT FOLDED INTO THAT LOOP, and this is the reason. The interval check above is by its own comment
    "the only check here that watches the TIMER rather than the arithmetic", and it is what goes red
    if the interval is never started. It asserted, before this row: that the card's figure differs
    from `before1s`, that it reads 41 or 42 minutes, and that the sentinel is still on it — off the
    sample of a loop whose ONLY exit condition is the figure changing with nothing but a wait in
    between. It asserts precisely that after this row, off the same sample of the same loop: the
    poll's condition, cap and sleep are unchanged, and the only edit inside it drops a variable this
    file no longer reads. Had the escalation been folded in, the loop could exit on an alert instead
    — including one the WAKE painted — and the timer claim would quietly have become an arithmetic
    one while still reading green. A second wait after it costs a few hundred milliseconds and leaves
    the older claim exactly where it was.

    ITS CARD COMES FROM ITS OWN SAMPLE NOW. `cardTicked.over` used to supply the card half of this
    check while the flag came from `ticked` and the sentence from a third read. paintPassElapsed()
    toggles `over-two` on the card and marks the record inside ONE synchronous pass, so the flag and
    the card are one fact and belong in one read() — this one. The announcement is the half that
    lands in a later task, and folding it into the exit condition is the whole of the fix.
  */
  const ALERT_41_SAID = /has been out on a bathroom pass for 41 minutes\./;
  const alert41 = await waitForPassAlert(outA, ALERT_41_SAID, 2);
  const said41 = alert41.said;
  const alerted41 = alert41.state.openPasses.filter((p) => p.studentId === outA)[0] || {};
  const card41 = (alert41.state.passBanner.cards || [])[0] || {};
  check('a trip that crossed BOTH thresholds while nothing was watching escalates once, to the second alert, and says how long it really is',
    alerted41.alerted === 2 && card41.over === 2
      && alerted41.keys === 'alerted,classId,id,note,out,studentId,type'
      && ALERT_41_SAID.test(said41)
      && said41.indexOf(SR_WO29) < 0
      /* One sentence, not two: the five-minute alert is not also in there. */
      && said41.indexOf('for 5 minutes') < 0 && said41.indexOf('for 10 minutes') < 0,
    'the pass now carries alerted = ' + JSON.stringify(alerted41.alerted) + ' with keys '
      + JSON.stringify(alerted41.keys) + ', the card is at level ' + card41.over
      + ', and what was announced is ' + JSON.stringify(said41));

  /* NOT REPEATEDLY, over the sixty renders a minute this screen makes: the live region is cleared,
     three seconds of ticks go by with the pass still far past both thresholds, and nothing new is
     said. A build that fired off the elapsed time rather than off the record would say it three
     times.

     WHAT THIS CHECK DOES NOT REST ON IS A RELOAD, and the sentence here claimed one until WO-2.27:
     *"a build that fired off a variable would say it again after the reload below"* — there is no
     reload below. The nearest `Page.reload` in this file is thousands of lines away in either
     direction, and these passes are closed and this fixture is gone long before it. Three seconds of
     ticks in one page cannot tell a level stored on the record from a level held in a module
     variable, because both survive a wait.
     WHAT SETTLES THAT IS THE KEY SET, one check above: `alerted41.keys` is read verbatim off the
     pass in `doc.openPasses` and has to be `alerted,classId,id,note,out,studentId,type`. A build
     holding the level in a variable leaves no `alerted` key on the record, so it fails there rather
     than here — and `read()` says the same thing at the field it collects. Two checks, two claims:
     that one is where the level LIVES, this one is that the tick does not re-fire it. */
  await hush();
  await new Promise(r => setTimeout(r, 3200));
  const quiet = await read();
  const stillQuiet = await heard();
  check('and it does not fire again on the next tick, or the next, while the same student is still out',
    stillQuiet === SR_WO29
      && (quiet.openPasses.filter((p) => p.studentId === outA)[0] || {}).alerted === 2
      && (quiet.passBanner.cards || [])[0].over === 2
      && /^4[12]:\d{2}$/.test(((quiet.passBanner.cards || [])[0] || {}).elapsed || ''),
    'after three seconds of ticks the live region still holds '
      + (stillQuiet === SR_WO29 ? 'the sentinel' : JSON.stringify(stillQuiet))
      + ', alerted = ' + JSON.stringify((quiet.openPasses
        .filter((p) => p.studentId === outA)[0] || {}).alerted) + ', the card reads '
      + JSON.stringify(((quiet.passBanner.cards || [])[0] || {}).elapsed));

  /*
    ── AND THE CLOCK COMES DOWN WITH THE BANNER, INCLUDING ON THE PATH THAT RETURNS EARLY (WO-2.27) ──

    paintPassBanner() has two exits. The foot of it stops the clock when nothing was drawn, and its
    own comment promises that *"a run with an empty room costs nothing at all, not one timer doing
    nothing once a second"* — which was true of that exit and false of the other one: the guard at
    the top returns the moment `#attendancePassBanner` is not in the document, and the stop was
    below it. A banner that has gone leaves a 1-second interval behind, ticking over nothing.

    THE PATH IS DRIVEN RATHER THAN DESCRIBED, and the cheapest honest way in is the id: getElementById
    is what the guard asks with, so blanking the attribute for the length of one repaint puts the
    real function down the real branch with no DOM surgery and nothing to put back but a string. The
    element never leaves the page and its cards are rebuilt on the way out.

    THE INTERVAL IS WATCHED THROUGH WRAPPERS ON setInterval/clearInterval, because the id lives in a
    module-scoped variable this file cannot read. The clock this section already has running was
    created before the wrappers went on, so it is deliberately stopped and started again through
    them first — the id under test is one the probe watched being made, and `started` being empty is
    itself the unfixed build failing: with no stop on the early return, startPassClock() finds its
    variable still set and creates nothing.

    The filter is the callback's NAME, which ties this check to `paintPassElapsed` by string. That is
    on purpose and it is why every live name is printed beside the verdict: a rename turns this red
    with the answer in the detail line rather than turning it quiet.
  */
  const clockProbe = await evalJs(`(function(){
    var a = window.planbook.attendance;
    var box = document.getElementById('attendancePassBanner');
    if (!box) return { ok:false, why:'no pass banner in the document to take away' };
    var live = {}, si = window.setInterval, ci = window.clearInterval;
    window.setInterval = function(fn, ms){
      var id = si.call(window, fn, ms);
      live[id] = (fn && fn.name) || 'anonymous';
      return id; };
    window.clearInterval = function(id){ delete live[id]; return ci.call(window, id); };
    var ticking = function(){
      var out = []; for (var k in live) out.push(live[k]); return out; };
    try {
      /* Down and up once, so what is measured below is an interval this probe saw created.
         NO BACKTICKS IN THIS COMMENT: it is inside a template literal. */
      box.id = '';
      a.renderAttendance();
      box.id = 'attendancePassBanner';
      a.renderAttendance();
      var started = ticking();
      var cards = box.children.length;
      /* And now the path itself. */
      box.id = '';
      a.renderAttendance();
      var afterEarly = ticking();
      box.id = 'attendancePassBanner';
      a.renderAttendance();
      return { ok:true, cards: cards, started: started, afterEarly: afterEarly,
               afterBack: ticking(), backCards: box.children.length };
    } finally {
      box.id = 'attendancePassBanner';
      window.setInterval = si;
      window.clearInterval = ci;
    } })()`);
  const clocks = (list) => (list || []).filter((n) => n === 'paintPassElapsed').length;
  check('the elapsed clock is stopped on EVERY path out of the banner paint, including the early return a missing banner takes — and starts again when the banner comes back',
    clockProbe.ok === true && clockProbe.cards > 0 && clockProbe.backCards === clockProbe.cards
      && clocks(clockProbe.started) === 1
      && clocks(clockProbe.afterEarly) === 0
      && clocks(clockProbe.afterBack) === 1,
    clockProbe.ok
      ? 'with the banner up ' + clockProbe.cards + ' card(s) and interval(s) '
        + JSON.stringify(clockProbe.started) + '; with it taken away '
        + JSON.stringify(clockProbe.afterEarly) + '; with it back '
        + JSON.stringify(clockProbe.afterBack) + ' over ' + clockProbe.backCards + ' card(s)'
      : clockProbe.why);

  /*
    ── AND THE ESCALATION ITSELF, one threshold at a time, on a second student ──

    Wound to five and a half minutes, which is the first alert and not the second; then to ten and a
    half, which is the second. The card's state and the sentence are read at each step, and the
    thing being proved between them is that the first alert did not fire twice on the way.
  */
  /* WO-2.29's seam, read either side of the two winds below. It is a record of what the AUDIO PATH
     DID rather than of what the caller meant to do: src/alert-sound.js writes an entry only after
     the oscillators have been constructed, connected and started, and the entry carries how many of
     them there were. A build that stopped scheduling oscillators cannot produce these numbers, and
     a build that stopped asking for a tone produces no entry at all.

     WHAT IT DOES NOT SAY, AND THE SENTENCE HERE USED TO IMPLY OTHERWISE. These entries read
     `played: true, oscillators: 10, state: "running"` for two days on a build that could not make a
     sound on iOS at all, because a context created outside a user gesture reports exactly that and
     plays to nothing (TESTING.md § WO-2.29, the 2026-08-14 run). Nothing in this file listens to
     anything and no browser automation can: audibility is Acceptance line 6 and it belongs to a
     human with an iPad. What the second seam below CAN say is whether the mechanism the corrected
     unlock turns on is in place, which is a different claim and a checkable one. */
  const soundLog = () => evalJs('window.planbook.alertSound.alertSoundLog()');
  const audioState = () => evalJs('window.planbook.alertSound.alertAudioState()');
  const soundBeforeB = await soundLog();
  /* Read BEFORE either threshold: the context under test has to already exist here, made by one of
     the taps this section has been doing all along, not by the alert that is about to fire. */
  const audioBefore = await audioState();

  /*
    ── THE ALERT SOUND IS OPT-IN SINCE 2026-08-16, AND THIS FIXTURE TURNS IT ON DELIBERATELY ──

    The owner withdrew the tone on every device after four 👤 sittings failed to make it sound
    reliably on the teaching iPad (TESTING.md § WO-2.31), so src/prefs.js now defaults
    `alertSoundOn` to false and src/alert-sound.js reads it as `=== true`.

    THE MACHINERY IS STILL SHIPPED AND STILL HAS TO WORK THE MOMENT A TEACHER TAPS THE SPEAKER, so
    every tone check below stays exactly as it was and the fixture pays for them with one tap here.
    The alternative — letting the default carry — would have turned nine checks green while they
    measured nothing, which is the failure mode this whole file is written against: an absence that
    passes. The two winds below assert `played: true` and a count of oscillators, and they would
    have read `silenced` forever.

    THE DEFAULT ITSELF IS ASSERTED FIRST, and before any tap, because a withdrawal that does not
    hold on a fresh browser is the part most likely to come back by accident — a later hand
    restoring `!== false`, or the key drifting back to `soundsOn`, would be invisible to every other
    check in this section once the tap below has run.
  */
  const soundDefault = await evalJs(`(function(){
    return { on: window.planbook.alertSound.soundsOn(),
             stored: localStorage.getItem('planbook_alertSoundOn'),
             legacy: localStorage.getItem('planbook_soundsOn') }; })()`);
  check('a browser that has never touched the speaker is SILENT — the overdue tone is opt-in, and the preference it reads is the post-withdrawal key',
    soundDefault.on === false && soundDefault.stored === null,
    'soundsOn() = ' + soundDefault.on + ', planbook_alertSoundOn = '
      + JSON.stringify(soundDefault.stored) + ', the retired planbook_soundsOn = '
      + JSON.stringify(soundDefault.legacy));
  await clickSel('#soundsBtn');

  await hush();
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="nurse"]');
  const woundB1 = await windBack(outB, 5.2);
  await wakeUp();
  /* WO-2.46: THE SLEEP IS REMOVED, NOT LENGTHENED. What stood here was `setTimeout(250)` and three
     separate reads behind it — a 220ms margin over src/live-region.js's 30ms defer, which is trap 5
     in tools/README.md wearing its original clothes rather than a defence against it, and a margin
     is what that trap says is not one. The wait exits on the flag and the sentence together and
     hands back the pair it exited on, so `atFive` and `saidFive` are one sample; `cardB5` is read
     out of that same state because the card level and the flag are written in one synchronous pass
     of paintPassElapsed(). Level 1 is passed explicitly for the reason the helper's own comment
     gives — the ten-minute caller below is why it may not be a default. */
  const NURSE_FIVE_SAID = /has been out on a nurse pass for 5 minutes\./;
  const alertB5 = await waitForPassAlert(outB, NURSE_FIVE_SAID, 1);
  const atFive = alertB5.state;
  const cardB5 = (atFive.passBanner.cards || []).filter((c) => c.student === outB)[0] || {};
  const saidFive = alertB5.said;
  check('the first alert fires at five minutes: the card escalates, the pass records the level, and the sentence names the student',
    !!woundB1.now
      && (atFive.openPasses.filter((p) => p.studentId === outB)[0] || {}).alerted === 1
      && cardB5.over === 1 && /^5:\d{2}$/.test(cardB5.elapsed || '')
      && NURSE_FIVE_SAID.test(saidFive)
      /* The other card is untouched by it — one alert is about one student. */
      && (atFive.passBanner.cards || []).filter((c) => c.student === outA)[0].over === 2,
    'the card is at level ' + cardB5.over + ' reading ' + JSON.stringify(cardB5.elapsed)
      + ', the pass records alerted = ' + JSON.stringify((atFive.openPasses
        .filter((p) => p.studentId === outB)[0] || {}).alerted) + ', and the announcement was '
      + JSON.stringify(saidFive));

  await hush();
  const woundB2 = await windBack(outB, 5.2);
  await wakeUp();
  /* WO-2.46: the same removal, and this is the caller that makes the level a required argument
     rather than a defaulted one — the pass is already at `alerted === 1` when this wait starts, so
     a wait that assumed 1 could never satisfy both halves at once and would spend its whole cap
     before handing back the last thing it happened to see. */
  const NURSE_TEN_SAID = /has been out on a nurse pass for 10 minutes\./;
  const alertB10 = await waitForPassAlert(outB, NURSE_TEN_SAID, 2);
  const atTen = alertB10.state;
  const cardB10 = (atTen.passBanner.cards || []).filter((c) => c.student === outB)[0] || {};
  const saidTen = alertB10.said;
  check('and the second fires at ten, once, taking the card with it',
    !!woundB2.now
      && (atTen.openPasses.filter((p) => p.studentId === outB)[0] || {}).alerted === 2
      && cardB10.over === 2 && /^10:\d{2}$/.test(cardB10.elapsed || '')
      && NURSE_TEN_SAID.test(saidTen),
    'the card is at level ' + cardB10.over + ' reading ' + JSON.stringify(cardB10.elapsed)
      + ', alerted = ' + JSON.stringify((atTen.openPasses
        .filter((p) => p.studentId === outB)[0] || {}).alerted) + ', announced as '
      + JSON.stringify(saidTen));

  /*
    ── WO-2.29: AND EACH OF THOSE TWO THRESHOLDS ASKED FOR ITS OWN TONE ──

    The two winds above are the whole fixture — one student, one threshold at a time — so what is
    added here is a reading rather than a walk. Exactly two entries appear across them, in order, and
    they are the two Roll Call! patterns at Roll Call!'s own numbers: five two-note pairs at 660 Hz
    at the default gain, then six rising pairs from 700 Hz at 0.4. THE THREE FIGURES ARE HOW THE
    HARNESS TELLS THEM APART WITHOUT EARS — note count, first frequency and peak gain — and they are
    the same three things that make the tones tellable apart in an occupied classroom, which is why
    they are the ones recorded. A build that "simplified" the two sequences into one parameterised
    call fails here rather than in a room.

    `oscillators` is what makes this more than a note of intent: it is counted inside the loop that
    creates and starts them, so it can only equal the note count on a build where the audio path ran
    to the end. What it cannot tell you is whether a sound came out — no headless browser can, and
    Acceptance line 6 stays owed to a human with an iPad.
  */
  const soundAfterB = await soundLog();
  const newTones = soundAfterB.slice(soundBeforeB.length);
  const five = newTones[0] || {};
  const ten = newTones[1] || {};
  check('each threshold asks for its own tone, and the two are not the same tone — five pairs at 660Hz, then six rising from 700Hz at a higher gain',
    newTones.length === 2
      && five.level === 1 && five.played === true && five.notes === 10 && five.first === 660
      && five.peak === 0.32 && five.oscillators === 10 && five.error === ''
      && ten.level === 2 && ten.played === true && ten.notes === 12 && ten.first === 700
      && ten.peak === 0.4 && ten.oscillators === 12 && ten.error === ''
      /* Distinguishable on all three axes, asserted rather than implied by the numbers above. */
      && five.notes !== ten.notes && five.first !== ten.first && five.peak !== ten.peak,
    newTones.length + ' tone(s) requested across the two winds: ' + JSON.stringify(newTones));

  /*
    ── WO-2.29 (CORRECTION): AND BOTH WERE SCHEDULED ON THE ONE CONTEXT THE FIRST GESTURE MADE ──

    THIS CHECK EXISTS BECAUSE THE ONE ABOVE WENT GREEN THROUGH A FAILURE. The build it passed on
    minted a fresh AudioContext inside every tone and another on every `visibilitychange`, and on
    current WebKit a context created outside a user gesture reports `running`, advances its clock and
    starts its oscillators onto no output — so every figure above was produced, in order, at the right
    frequencies, on an iPad that was silent (TESTING.md § WO-2.29, "👤 RUN 2026-08-14 — FAILED",
    probe 1 against probe 2). Audibility is still not assertable here. WHAT IS ASSERTABLE IS THE
    MECHANISM THE FIX TURNS ON, and it is these four things: one context for the life of the page,
    born in a gesture, still open, and carrying both tones.

    `ctxTime` IS THE CLAUSE THAT CANNOT BE FAKED BY A FRESH CONTEXT, and it is why this check is not
    just a counter reading itself back. `contexts` counts the constructions src/alert-sound.js makes
    through its own unlock, so a build that went back to `new AudioContext()` inside the tone would
    leave that number at 1 and slip past it — but a context constructed at alert time reads a
    `currentTime` of ~0, where the held one has been running since the first tap of this section,
    minutes ago. The second tone's clock must also be strictly past the first's, which is the same
    claim from the other end: two readings of one clock, not two clocks each starting at zero.

    AND ONE CLAUSE IS READ OFF THE SOURCE RATHER THAN THE PAGE, which this file does elsewhere for
    the same reason (the prefs sweep at the head of the run). A context minted somewhere the module
    does not count — the shipped build did it on every `visibilitychange` — is invisible to every
    reading above: it is constructed, it is closed, and nothing observable moves. What IS observable
    is that the file contains exactly one constructor call and that it sits in the gesture listener,
    so that is asserted directly. It is the clause a future edit is most likely to break.

    AND THAT PREDICTION CAME TRUE, WHICH IS WO-2.31's HARNESS HALF. The clause matched the literal
    string `new (window.AudioContext` — so a SECOND construction site spelled the way anybody
    writing this fresh on a modern browser would spell it, `new AudioContext()`, satisfied the
    engine and was invisible here: one site found, in unlockAudio, green, over a file that
    constructs two. The guarantee the whole correction rests on was one refactor away from being
    unguarded, and the failure mode was a green run. Two things replace it.

    THE COUNT IS TAKEN WITH A SPELLING-AGNOSTIC MATCHER. `AUDIO_CTOR` catches the qualified pair,
    the bare constructor, and the webkit fallback on its own, so what is asserted is HOW MANY
    construction sites the file has and WHERE the one is — a claim about the code rather than about
    how it is typed.

    AND THE SPELLING IS ASSERTED SEPARATELY, ON PURPOSE, as a trip-wire rather than as the count.
    Dropping `window.webkitAudioContext` is a decision about which devices can make a sound, not a
    tidy-up, and this is a file whose every departure from Roll Call! is argued at the point of
    departure. So the one site must still carry the fallback: rewriting it to a bare
    `new AudioContext()` leaves this check RED with the reason in its own detail line, which is the
    difference between an edit somebody made deliberately and an edit somebody made on the way past.
  */
  const soundSrc = await fs.readFile(path.join(ROOT, 'src', 'alert-sound.js'), 'utf8');
  const soundLines = soundSrc.split('\n');
  /* `new AudioContext(`, `new window.AudioContext(`, `new webkitAudioContext(`, and the parenthesised
     `new (window.AudioContext || window.webkitAudioContext)()` this file uses — one matcher, so that
     a site cannot hide behind a spelling. */
  const AUDIO_CTOR = /\bnew\s+\(?\s*(window\.)?(webkit)?AudioContext\b/;
  const ctorAt = soundLines
    .map((line, i) => ({ n: i + 1, text: line.trim() }))
    .filter((l) => AUDIO_CTOR.test(l.text) && !/^([*]|\/\/|\/\*)/.test(l.text));
  /* Whose function it is in: the nearest declaration above it. */
  const ctorHome = ctorAt.length === 1
    ? ((soundLines.slice(0, ctorAt[0].n).reverse().find((l) => /^function\s+\w+/.test(l)) || '').trim())
    : '(' + ctorAt.length + ' constructor call sites)';
  /* The fallback, on the one site rather than anywhere in the file — a mention of the name in a
     comment must not be able to satisfy this. */
  const ctorKeepsWebkit = ctorAt.length === 1
    && /window\.AudioContext\s*\|\|\s*window\.webkitAudioContext/.test(ctorAt[0].text);
  const audioAfter = await audioState();
  check('both tones were scheduled on the ONE AudioContext the first gesture made — the alerts and the wake-ups mint no others, and nothing closes it',
    audioBefore.contexts === 1 && audioBefore.origin === 'gesture'
      && audioAfter.contexts === 1 && audioAfter.origin === 'gesture'
      /* One constructor call in the module, however it is spelled, and it is the gesture
         listener's — and it still reaches for the webkit fallback (WO-2.31). */
      && ctorAt.length === 1 && /^function unlockAudio\(/.test(ctorHome)
      && ctorKeepsWebkit === true
      /* Still open. A build that closed it after the last note — which is what the lift does and
         what spends iOS's cap — reports `closed` here, live off the context. */
      && audioAfter.state !== 'closed' && audioAfter.state !== 'none'
      && five.ctx === 1 && ten.ctx === 1
      /* Older than the alert that used it, and one clock across both — measured against the reading
         taken BEFORE the winds rather than against a number written down here, which is what makes
         it a comparison rather than a guess about how long this section takes. A context minted at
         alert time reads ~0.00 and fails both. */
      && audioBefore.currentTime > 1 && five.ctxTime >= audioBefore.currentTime
      && ten.ctxTime > five.ctxTime
      && audioAfter.currentTime >= ten.ctxTime,
    'before the winds ' + JSON.stringify(audioBefore) + ', after them ' + JSON.stringify(audioAfter)
      + '; the five-minute tone was scheduled on context ' + five.ctx + ' at its clock '
      + five.ctxTime + 's and the ten-minute tone on context ' + ten.ctx + ' at ' + ten.ctxTime
      + 's; src/alert-sound.js constructs a context at line(s) ' + JSON.stringify(ctorAt.map((l) => l.n))
      + ', in ' + JSON.stringify(ctorHome)
      /* Said only when there IS one site to say it about: with two, the count above is the finding
         and a sentence about the spelling of one of them would read as the reason. */
      + (ctorAt.length !== 1 ? ''
        : ctorKeepsWebkit
          ? ', through the window.AudioContext || window.webkitAudioContext pair'
          : ', and NOT through the window.AudioContext || window.webkitAudioContext pair — a bare '
            + 'constructor drops the fallback older WebKit needs, which is a decision rather than a '
            + 'tidy-up and belongs in a work order'));

  /*
    ── AND NOT AGAIN AFTER THE STUDENT RETURNS, which is the clause the state has to reset for ──

    The same student comes back and is sent straight out again. The new pass carries no `alerted` at
    all and its card is at level 0 — a build that kept the fired-ness anywhere but on the pass would
    have carried it across, and a build that carried it into `passes` would be shipping the app's
    own bookkeeping in the permanent record.
  */
  await clickSel('[data-pass-return="' + outB + '"]');
  const backIn = await read();
  const loggedB = backIn.passLog.filter((p) => p.studentId === outB).slice(-1)[0] || {};
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="quick"]');
  /* Hushed AFTER both taps, because both of them announce something of their own — what the
     sentinel is holding the line against here is an ALERT arriving on a pass that is ten seconds
     old, which is what a fired-ness kept anywhere but on the record would produce. */
  await hush();
  await wakeUp();
  await new Promise(r => setTimeout(r, 1500));
  const outAgain = await read();
  const cardB2 = (outAgain.passBanner.cards || []).filter((c) => c.student === outB)[0] || {};
  const saidAfter = await heard();
  check('a student who comes back and goes out again starts clean: no alert level on the new pass, none in the log entry, and nothing announced',
    loggedB.minutes === 10 && loggedB.alerted === undefined
      && loggedB.keys === 'back,classId,endedBy,id,minutes,out,studentId,type'
      && (outAgain.openPasses.filter((p) => p.studentId === outB)[0] || {}).alerted === undefined
      && (outAgain.openPasses.filter((p) => p.studentId === outB)[0] || {}).keys
        === 'classId,id,out,studentId,type'
      && cardB2.over === 0 && /^0:\d{2}$/.test(cardB2.elapsed || '')
      && saidAfter === SR_WO29,
    'the finished trip is ' + JSON.stringify(loggedB) + '; the new pass carries keys '
      + JSON.stringify((outAgain.openPasses.filter((p) => p.studentId === outB)[0] || {}).keys)
      + ', its card is at level ' + cardB2.over + ' reading ' + JSON.stringify(cardB2.elapsed)
      + ', and the live region still holds '
      + (saidAfter === SR_WO29 ? 'the sentinel' : JSON.stringify(saidAfter)));

  /*
    ── WO-2.29: THE OFF SWITCH, WHICH IS THE OTHER HALF OF SHIPPING A SOUND ──

    Driven through the real control in the header — a teacher proctoring a test has one tap and this
    is it — and then two more thresholds are crossed, the first with the sound off and the second
    with it back on. What must survive the mute is everything that is NOT the tone: the sentence, the
    card colour and the level on the record. The preference silences an alert's loudest channel; it
    does not turn the alert off, and a build that took the announcement with it fails here.

    THE FIXTURE IS THE FRESH PASS THE CHECK ABOVE JUST LEFT ON outB, so this costs no new trip and no
    new student — the quick pass is wound to five minutes and then to ten, and is returned ten
    minutes older than it would have been. The history block below counts every figure it asserts out
    of the log in Node rather than assuming any of them, which is what makes that safe.
  */
  const mutedBefore = await soundLog();
  await clickSel('#soundsBtn');
  const muteChrome = await evalJs(`(function(){
    var b = document.getElementById('soundsBtn');
    if (!b) return null;
    return { pressed: b.getAttribute('aria-pressed'), lit: b.classList.contains('active'),
             label: b.getAttribute('aria-label') || '',
             slashes: b.querySelectorAll('[data-sound-icon] line').length,
             stored: localStorage.getItem('planbook_alertSoundOn'),
             inDoc: JSON.stringify(window.planbook.store.getDoc()).indexOf('alertSoundOn') >= 0 }; })()`);
  check('one tap on the header switch mutes the alert, says so on the button, and writes a `planbook_` preference and nothing in the year document',
    !!muteChrome && muteChrome.pressed === 'true' && muteChrome.lit === true
      && /OFF/.test(muteChrome.label) && muteChrome.slashes === 2
      && muteChrome.stored === 'false' && muteChrome.inDoc === false,
    muteChrome ? 'aria-pressed = ' + muteChrome.pressed + ', lit = ' + muteChrome.lit
      + ', slash strokes on the icon = ' + muteChrome.slashes
      + ', planbook_alertSoundOn = ' + JSON.stringify(muteChrome.stored)
      + ', the string "alertSoundOn" anywhere in the year document = ' + muteChrome.inDoc
      + ', label = ' + JSON.stringify(muteChrome.label)
      : 'there is no #soundsBtn in the header');

  await hush();
  const woundMute = await windBack(outB, 5.2);
  await wakeUp();
  await new Promise(r => setTimeout(r, 250));
  const atMuted = await read();
  const cardMuted = (atMuted.passBanner.cards || []).filter((c) => c.student === outB)[0] || {};
  const saidMuted = await heard();
  const mutedTones = (await soundLog()).slice(mutedBefore.length);
  check('with the sound off the tone is not played — and the announcement, the card colour and the level on the record are all exactly as they were',
    !!woundMute.now && mutedTones.length === 1
      && mutedTones[0].played === false && mutedTones[0].oscillators === 0
      && mutedTones[0].level === 1
      /* The same sentence it says with the sound on, word for word — this is the accessible mirror
         of the tone and it is not a preference. */
      && /has been out on a quick pass for 5 minutes\./.test(saidMuted)
      && cardMuted.over === 1 && /^5:\d{2}$/.test(cardMuted.elapsed || '')
      && (atMuted.openPasses.filter((p) => p.studentId === outB)[0] || {}).alerted === 1,
    'what the tick asked for = ' + JSON.stringify(mutedTones) + ', the card is at level '
      + cardMuted.over + ' reading ' + JSON.stringify(cardMuted.elapsed) + ', alerted = '
      + JSON.stringify((atMuted.openPasses.filter((p) => p.studentId === outB)[0] || {}).alerted)
      + ', and the announcement was ' + JSON.stringify(saidMuted));

  /* AND IT IS THE PREFERENCE DOING IT, not a build that has stopped playing anything. The switch
     goes back on through the same control and the next threshold sounds again — without this, the
     silence above would be indistinguishable from a broken oscillator, which is the failure a check
     written around an absence is always one step away from. It also leaves the browser with the
     sound ON, which is the default every fixture after this one is entitled to. */
  const unmutedBefore = await soundLog();
  await clickSel('#soundsBtn');
  await hush();
  const woundBack = await windBack(outB, 5.2);
  await wakeUp();
  await new Promise(r => setTimeout(r, 250));
  const atUnmuted = await read();
  const unmutedTones = (await soundLog()).slice(unmutedBefore.length);
  const soundBackOn = await evalJs(`(function(){
    var b = document.getElementById('soundsBtn');
    return { pressed: b ? b.getAttribute('aria-pressed') : '', lit: !!b && b.classList.contains('active'),
             slashes: b ? b.querySelectorAll('[data-sound-icon] line').length : -1,
             stored: localStorage.getItem('planbook_alertSoundOn') }; })()`);
  check('and turning it back on is the same one tap: the next threshold sounds again, at the second pattern',
    !!woundBack.now && unmutedTones.length === 1
      && unmutedTones[0].played === true && unmutedTones[0].level === 2
      && unmutedTones[0].oscillators === 12 && unmutedTones[0].first === 700
      && unmutedTones[0].error === ''
      && (atUnmuted.openPasses.filter((p) => p.studentId === outB)[0] || {}).alerted === 2
      && soundBackOn.pressed === 'false' && soundBackOn.lit === false && soundBackOn.slashes === 0
      && soundBackOn.stored === 'true',
    'what the tick asked for = ' + JSON.stringify(unmutedTones) + ', aria-pressed = '
      + soundBackOn.pressed + ', lit = ' + soundBackOn.lit + ', slash strokes = ' + soundBackOn.slashes
      + ', planbook_alertSoundOn = ' + JSON.stringify(soundBackOn.stored));

  /*
    ══ WO-2.31: AN INTERRUPTION THAT NEVER HIDES THE APP, AND THE WAY BACK FROM IT ══

    THE HOLE THIS BLOCK IS AIMED AT. Every wind above arrives through wakeUp(), which dispatches
    `visibilitychange` — and that is the one path WO-2.29's correction already covered. The failure
    this work order is about is the other one: an iOS audio interruption that leaves the app
    FOREGROUNDED — a call, a FaceTime request, an alarm — fires no `visibilitychange` at all, so
    nothing re-armed and nothing resumed, and the next alert put its oscillators onto a dead context
    while the seam went on reading `running`. Nothing in the section above could have caught it.

    SO NOTHING HERE CALLS wakeUp() AND NOTHING HERE CLICKS between the interruption and the tone,
    and both refusals ARE the check rather than housekeeping. A `visibilitychange` would recover the
    context through the path that already worked; a click is a GESTURE, and the gesture listener
    would recover it too. Either one would leave this block green against the build the work order
    was written against. What drives the alerts instead is src/attendance.js's own one-second pass
    clock — polled for, never slept on (trap 5) — which is the only driver left once those two are
    refused.

    THE INTERRUPTION IS REAL AND IT IS DELIVERED FROM OUTSIDE. `suspend()` is called on the context
    the page actually holds, caught at construction by the Proxy installed at the head of this file;
    there is no flag this file sets and the app reads, which would be the fixture that cannot fail.
    That the two halves are holding the SAME object is asserted rather than assumed — the module's
    own `interruptions` count has to move when this file suspends it, or these checks are red.

    AND THE SECOND LEG REPRODUCES THE DEVICE'S OWN WORST CASE. On the iPad, resume() on a context
    that had been interrupted neither resolved nor rejected (TESTING.md § WO-2.29, probe 3). That is
    done here by replacing the instance's own resume() with a promise that never settles: the module
    calls what it always calls and gets back what the device gave it, so the context stays down for
    as long as the leg needs it to — deterministically, rather than by winning a race against a
    recovery that takes twenty milliseconds on a laptop.

    WHAT IT STILL CANNOT SAY is whether any of it made a sound. Nothing here listens, nothing can,
    and Acceptance line 6 is owed to a human with an iPad exactly as WO-2.29's was.

    THE FIXTURE COSTS THE SECTION NOTHING: one student out and back on a pass that is CANCELLED
    rather than returned, so `passes` is byte-identical across the whole block and the history
    checks below read the log this section always handed them.
  */
  const log31 = (await read()).passLogJson;
  /* Out of the room, and this tap is the last GESTURE the block allows itself until the end. */
  await clickSel('[data-pass-issue="' + outC + '"][data-pass-type="bathroom"]');
  const audio31Base = await audioState();
  const soundBase31 = (await soundLog()).length;

  /* One tone, waited for on the pass clock. Six seconds is six ticks — long enough that a red here
     is a build that did not ask for a tone, and never a machine that was busy. */
  const nextTone = (had) => evalJs(`(async function(){
    var s = window.planbook.alertSound;
    for (var i = 0; i < 120; i++) {
      var log = s.alertSoundLog();
      if (log.length > ${had}) return log[log.length - 1];
      await new Promise(function(r){ setTimeout(r, 50); });
    }
    return null; })()`);
  /* The module's own reading, polled until it says what the leg is waiting for — or until three
     seconds are up, after which whatever it does say is what the check reports. */
  const audioUntil = (cond) => evalJs(`(async function(){
    var s = window.planbook.alertSound, a = s.alertAudioState();
    for (var i = 0; i < 60 && !(${cond}); i++) {
      await new Promise(function(r){ setTimeout(r, 50); });
      a = s.alertAudioState();
    }
    return a; })()`);

  const cut31 = await evalJs(`(async function(){
    var list = window.__audioContexts || [];
    if (list.length !== 1) return { why: list.length + ' context(s) caught at construction' };
    var was = list[0].state;
    try { await list[0].suspend(); } catch (e) { return { why: 'suspend() threw ' + e.name }; }
    return { why: '', was: was }; })()`);
  const back31 = await audioUntil(`a.state === 'running' && a.recoveries > ${audio31Base.recoveries}`);
  const wound31 = await windBack(outC, 5.2);
  const tone31 = await nextTone(soundBase31);
  const after31 = await read();
  const audio31After = await audioState();
  check('an interruption that never hides the app is recovered by the module itself: the next alert\'s tone is scheduled on a running context, with no visibilitychange and no touch in between',
    !cut31.why && cut31.was === 'running'
      /* The module saw it, which is also the proof that the object this file suspended is the
         object the module is holding. */
      && back31.interruptions === audio31Base.interruptions + 1
      && back31.recoveries === audio31Base.recoveries + 1 && back31.state === 'running'
      /* THE PATH THAT WAS NOT USED, and it is the whole claim: the app was never hidden and never
         returned, so the resume src/alert-sound.js does on `visibilitychange` never ran. */
      && back31.wakeResumes === audio31Base.wakeResumes
      && !!wound31.now && !!tone31
      && tone31.played === true && tone31.state === 'running' && tone31.oscillators === 10
      && tone31.first === 660 && tone31.rearmed === false && tone31.error === ''
      /* Still the ONE context, and still the one that was interrupted: its own clock ran on across
         the whole thing rather than restarting at the alert, which is the fingerprint WO-2.29's
         check above is built on. */
      && tone31.ctx === 1 && audio31After.contexts === 1 && audio31After.origin === 'gesture'
      && tone31.ctxTime > audio31Base.currentTime
      && (after31.openPasses.filter((p) => p.studentId === outC)[0] || {}).alerted === 1,
    (cut31.why ? 'the context could not be interrupted: ' + cut31.why + '; ' : '')
      + 'before the interruption ' + JSON.stringify(audio31Base) + ', after it '
      + JSON.stringify(back31) + '; the tone that followed was ' + JSON.stringify(tone31)
      + ' and the pass records alerted = '
      + JSON.stringify((after31.openPasses.filter((p) => p.studentId === outC)[0] || {}).alerted));

  /* ── AND THE CASE THE CHEAP FALLBACK IS FOR: A RESUME THAT NEVER SETTLES ── */
  const stuck31 = await evalJs(`(async function(){
    var c = (window.__audioContexts || [])[0];
    if (!c) return { why: 'no context was caught at construction' };
    c.resume = function(){ return new Promise(function(){}); };
    try { await c.suspend(); } catch (e) { return { why: 'suspend() threw ' + e.name }; }
    return { why: '' }; })()`);
  const waiting31 = await audioUntil("a.state !== 'running' && a.armed === true");
  const soundBase31b = (await soundLog()).length;
  const wound31b = await windBack(outC, 5.2);
  const tone31b = await nextTone(soundBase31b);
  const after31b = await read();
  check('and a tone asked for on a context that will not come back re-arms the gesture listener and says so in the log — "waiting for a touch" and "dead" are not the same silence',
    !stuck31.why
      && waiting31.interruptions === back31.interruptions + 1
      && waiting31.state !== 'running' && waiting31.armed === true
      && !!wound31b.now && !!tone31b
      /* The alert was not swallowed and no second context was minted to carry it — the shape the
         2026-08-14 iPad falsified — and the entry says in one field which of the two silences this
         is: scheduled onto a context that is not running, with the next touch armed to fix it. */
      && tone31b.played === true && tone31b.rearmed === true
      && tone31b.state === waiting31.state && tone31b.state !== 'running'
      && tone31b.oscillators === 12 && tone31b.first === 700 && tone31b.ctx === 1
      && tone31b.error === ''
      /* Everything that is not the tone is untouched: the level is on the record either way. */
      && (after31b.openPasses.filter((p) => p.studentId === outC)[0] || {}).alerted === 2,
    (stuck31.why ? 'the context could not be held down: ' + stuck31.why + '; ' : '')
      + 'with resume() hanging the module reads ' + JSON.stringify(waiting31)
      + ' and the tone it then asked for was ' + JSON.stringify(tone31b));

  /* THE TOUCH THAT RESTORES IT, and it is an ordinary one: the tap that cancels the pass. Nothing
     in the app knows this tap is special — it is the listener the two legs above re-armed, doing
     what the work order says the fallback buys. The instance's resume() is put back first, because
     a resume that hangs is the DEVICE's failure and not something to hold this build to. */
  await evalJs("(function(){ var c = (window.__audioContexts || [])[0];"
    + " if (c) delete c.resume; return 1; })()");
  await clickSel('[data-pass-cancel="' + outC + '"]');
  const restored31 = await audioUntil("a.state === 'running' && a.armed === false");
  const tidy31 = await read();
  check('and the teacher\'s next touch anywhere is what restores it: one tap and the held context is running again with the listener stood down — still one context, and this whole block wrote nothing to the pass log',
    restored31.state === 'running' && restored31.armed === false
      && restored31.contexts === 1 && restored31.origin === 'gesture'
      && restored31.recoveries === waiting31.recoveries + 1
      && restored31.wakeResumes === audio31Base.wakeResumes
      /* The fixture leaves no trace: a cancel writes nothing to `passes` (WO-2.11), so the history
         checks below read the log this section has always handed them. */
      && !tidy31.openPasses.some((p) => p.studentId === outC)
      && tidy31.passLogJson === log31,
    'after the tap the module reads ' + JSON.stringify(restored31) + '; the log is '
      + (tidy31.passLogJson === log31 ? 'byte-identical' : 'DIFFERENT') + ' at '
      + tidy31.passLog.length + ' entr(ies) and ' + tidy31.openPasses.length + ' pass(es) open');

  /*
    ── ACCEPTANCE LINE 3: THE HISTORY, AGAINST A COUNT THIS FILE MAKES ITSELF ──

    Everyone comes back in first, so the log holds every trip this section has produced and the two
    surfaces cannot disagree about a student who is still out. The expected numbers are computed in
    NODE, from the `passes` array read off the document — not from the app's own tally, which would
    be the dialog being compared with the module that drew it.
  */
  await clickSel('[data-pass-return="' + outA + '"]');
  await clickSel('[data-pass-return="' + outB + '"]');
  const settled = await read();

  /* The dialog, read as rows of text. The student column is read as its rendered text AND as the
     hook behind it, so "a name is on screen" and "a door leads to that student" stay two facts. */
  const readHistory = () => evalJs(`(function(){
    var m = document.getElementById('passHistoryModal');
    var body = document.getElementById('passHistoryBody');
    if (!m || !body) return null;
    var cells = function(tr){ return Array.prototype.slice.call(tr.querySelectorAll('td'))
      .map(function(td){ return (td.textContent || '').trim(); }); };
    var table = body.querySelector('table');
    return {
      shown: !m.classList.contains('hidden'),
      title: ((document.getElementById('passHistoryTitle') || {}).textContent || '').trim(),
      sub: ((body.querySelector('.attendance-report-sub') || {}).textContent || '').trim(),
      text: (body.textContent || '').replace(/\\s+/g, ' '),
      strip: !!body.querySelector('.pass-history-quiet'),
      doors: Array.prototype.slice.call(body.querySelectorAll('[data-pass-history-student]'))
        .map(function(b){ return b.getAttribute('data-pass-history-student'); }),
      back: body.querySelectorAll('[data-pass-history-all]').length,
      rows: table ? Array.prototype.slice.call(table.querySelectorAll('tbody tr'))
        .map(function(tr){
          var head = tr.querySelector('th');
          var door = tr.querySelector('[data-pass-history-student]');
          return { head: head ? (head.textContent || '').trim() : '',
                   student: door ? door.getAttribute('data-pass-history-student') : '',
                   cls: tr.className,
                   cells: cells(tr) }; }) : [],
      foot: table ? Array.prototype.slice.call(table.querySelectorAll('tfoot tr'))
        .map(function(tr){ return { head: (tr.querySelector('th') || {}).textContent || '',
                                    cells: cells(tr) }; }) : [] }; })()`);

  /* The same arithmetic the dialog is claiming, done here over the log this run wrote. */
  const tally = (list) => {
    const out = { bathroom: 0, nurse: 0, quick: 0, total: 0, minutes: 0 };
    list.forEach((p) => {
      if (out[p.type] !== undefined) out[p.type] += 1;
      out.total += 1;
      out.minutes += p.minutes;
    });
    return out;
  };
  const mine = settled.passLog.filter((p) => p.classId === passClass);
  const byStudent = {};
  mine.forEach((p) => {
    if (!byStudent[p.studentId]) byStudent[p.studentId] = [];
    byStudent[p.studentId].push(p);
  });
  const expectAll = tally(mine);

  await clickSel('[data-pass-history]');
  const hist = await readHistory();
  const foot = (hist && hist.foot[0]) || { cells: [] };
  const rowFor = (id) => (hist ? hist.rows.filter((r) => r.student === id)[0] : null) || { cells: [] };
  const everyRowAgrees = Object.keys(byStudent).every((id) => {
    const want = tally(byStudent[id]);
    const got = rowFor(id).cells;
    return got.length === 5
      && got[0] === (want.bathroom || '—') + '' && got[1] === (want.nurse || '—') + ''
      && got[2] === (want.quick || '—') + '' && got[3] === String(want.total)
      && got[4] === String(want.minutes);
  });
  check('the history view\'s totals match the log: every student\'s row, and the class total under them, against a count this file makes in Node',
    !!hist && hist.shown && hist.rows.length === Object.keys(byStudent).length
      && everyRowAgrees
      && foot.cells.join(',') === [expectAll.bathroom, expectAll.nurse, expectAll.quick,
        expectAll.total, expectAll.minutes].join(',')
      /* The subtitle carries the same total in words, so the number a teacher reads first is the
         number the table adds up to. */
      && hist.sub.indexOf(expectAll.total + ' trips') === 0
      && hist.sub.indexOf(expectAll.minutes + ' minutes out') > 0,
    'the log holds ' + mine.length + ' trip(s) across ' + Object.keys(byStudent).length
      + ' student(s); the dialog drew ' + (hist ? hist.rows.length : 0)
      + ' row(s), every row agreeing = ' + everyRowAgrees + ', footer = '
      + JSON.stringify(foot.cells) + ' against ' + JSON.stringify([expectAll.bathroom,
        expectAll.nurse, expectAll.quick, expectAll.total, expectAll.minutes])
      + ', subtitle ' + JSON.stringify(hist && hist.sub));

  /* A HAND COUNT OF ONE STUDENT'S PASSES, which is the second half of that acceptance line. Driven
     through the name in the table, which is also the only door this view has to a student. */
  const busiest = Object.keys(byStudent).sort((a, b) => byStudent[b].length - byStudent[a].length)[0];
  const wantRows = byStudent[busiest];
  await clickSel('[data-pass-history-student="' + busiest + '"]');
  const one = await readHistory();
  const trips = one ? one.rows.filter((r) => !/pass-history-note-row/.test(r.cls)) : [];
  const endedByD = wantRows.filter((p) => p.endedBy === 'dismissed').length;
  const withNotes = wantRows.filter((p) => p.note).length;
  check('and one student\'s own trips are one row each, with the minutes that were stored, the notes that were typed, and a dismissal marked as one',
    !!one && trips.length === wantRows.length
      && trips.every((r, i) => r.cells[3] === String(wantRows[i].minutes))
      /* Every note that was typed is on the page, under the trip it belongs to. */
      && wantRows.every((p) => !p.note || one.text.indexOf(p.note) >= 0)
      && one.rows.filter((r) => /pass-history-note-row/.test(r.cls)).length === withNotes
      /* "back after 4 minutes" and "dismissed after 4 minutes" are different facts, and this is the
         surface src/passes.js stores `endedBy` for. */
      && (one.text.match(/dismissed/g) || []).length === endedByD
      && one.back === 1,
    'the log holds ' + wantRows.length + ' trip(s) for that student ('
      + endedByD + ' by dismissal, ' + withNotes + ' noted); the dialog drew ' + trips.length
      + ' trip row(s) and ' + (one ? one.rows.length - trips.length : 0) + ' note row(s), with '
      + (one ? (one.text.match(/dismissed/g) || []).length : 0) + ' dismissal marker(s)');

  /*
    ── AND THE NOTE ROW, ON A STUDENT WHO HAS ONE ──

    Asked of a SECOND student rather than of the one above, because the one above is chosen for
    having the most trips and this run's busiest student has no notes at all: the note clause up
    there is true and vacuous, and a vacuous clause is how "the note field renders nowhere" ships.
    The note it looks for is the one WO-2.11's own section typed on a card and watched ride through
    a Return into `passes` — which is what that field was added early for.
  */
  const notedTrip = mine.filter((p) => p.note)[0];
  if (!notedTrip) {
    skip('a note typed on the card while the student was out is on the trip in their history',
      'no entry in the pass log carries a note at this point in the run — a state, not a pass');
  } else {
    await clickSel('[data-pass-history-all]');
    await clickSel('[data-pass-history-student="' + notedTrip.studentId + '"]');
    const noteView = await readHistory();
    const noteRows = noteView ? noteView.rows.filter((r) => /pass-history-note-row/.test(r.cls)) : [];
    const wantNotes = mine.filter((p) => p.studentId === notedTrip.studentId && p.note);
    check('a note typed on the card while the student was out is on the trip in their history, under the row it belongs to',
      noteRows.length === wantNotes.length
        && wantNotes.every((p) => noteView.text.indexOf('Note: ' + p.note) >= 0),
      noteRows.length + ' note row(s) against ' + wantNotes.length + ' noted trip(s): '
        + JSON.stringify(noteRows.map((r) => r.cells[0])));
  }

  /*
    ── ACCEPTANCE LINE 4: A CANCELLED PASS IS IN NO HISTORY AND IN NO TOTAL ──

    Asked as a before-and-after over the WHOLE dialog rather than as an absence on its own: a trip
    is issued, noted with a phrase nothing else in the document uses, watched onto the card, and
    cancelled. WO-2.11 writes nothing to `passes` on a cancel, so this is the check that would
    notice if that ever stopped being true — and the note is searched for across the dialog's text
    because a cancelled note reaching a history view would arrive through the note row.
  */
  await clickSel('#passHistoryModal [data-modal-close]');
  const CANCELLED_NOTE = 'this trip was cancelled and must appear nowhere';
  await clickSel('[data-pass-issue="' + outD + '"][data-pass-type="bathroom"]');
  await typeNote('[data-pass-note="' + outD + '"]', CANCELLED_NOTE);
  const onCard = await read();
  await clickSel('[data-pass-cancel="' + outD + '"]');
  await clickSel('[data-pass-history]');
  const after = await readHistory();
  check('a cancelled pass appears in no row, in no total and nowhere in the dialog — the pass was on the card and its note was in the document a moment earlier',
    onCard.openPasses.some((p) => p.studentId === outD)
      && onCard.docJson.indexOf(CANCELLED_NOTE) >= 0
      /* Nothing about the dialog moved: same rows, same footer, same sentence. */
      && !!after && after.rows.length === hist.rows.length
      && after.foot[0].cells.join(',') === foot.cells.join(',')
      && after.sub === hist.sub
      && after.text.indexOf(CANCELLED_NOTE) < 0
      && after.rows.every((r) => r.student !== outD),
    'the cancelled student has ' + (after ? after.rows.filter((r) => r.student === outD).length : '?')
      + ' row(s); the footer reads ' + JSON.stringify(after && after.foot[0].cells)
      + ' (was ' + JSON.stringify(foot.cells) + ') and the note phrase is in the dialog = '
      + (!!after && after.text.indexOf(CANCELLED_NOTE) >= 0));

  /*
    ── ACCEPTANCE LINE 5: PRESENTATION MODE SUPPRESSES NAMES IN THE HISTORY VIEW ──

    The mode is flipped with the real header control, and every name in the document is searched for
    in the dialog's text — the shape WO-2.6's own support check uses, because a check that looked
    for the names it remembered to plant would miss the twenty-fourth row.

    THE MODE-OFF PASS IS WHAT MAKES THE ABSENCE MEAN SOMETHING, so it is asserted first: this dialog
    names people when the switch is off. And the door into one student's trips is asked TWICE — once
    as a control that must not be drawn, and once through the module, because the missing button is
    not the protection.
  */
  /* BOTH SPELLINGS OF EVERY NAME, and the pair is the check rather than a nicety: this dialog draws
     "Van Dyke, Mary" in the class table and "Mary Van Dyke" in a student's own heading, so a search
     for one form would have gone green over a table full of the other. Written as this run's first
     attempt at it did not: `settled.names` alone found none of the four names that were plainly on
     the screen, and the precondition below is what caught that rather than the assertion. */
  const NAME_FORMS = settled.names
    .concat((settled.roster || []).map((p) => p[0] + ', ' + p[1]));
  const namesIn = (text) => NAME_FORMS.filter((n) => text.indexOf(n) >= 0);
  const namesOff = namesIn(after.text);
  /* The dialog is closed before the toolbar is reached for: the door is BEHIND the scrim, and a
     click at its coordinates with the dialog up lands on the backdrop and dismisses it — which
     would read as a door that does nothing. The header control is `.click()`ed rather than aimed
     at for the same reason the accommodation-prompt section gives. */
  await clickSel('#passHistoryModal [data-modal-close]');
  await evalJs("document.getElementById('presentationBtn').click(); 1");
  await clickSel('[data-pass-history]');
  const hidden = await readHistory();
  const namesOn = namesIn(hidden ? hidden.text : '');
  check('presentation mode suppresses every name in the history view, and leaves the counts a teacher opened it for',
    namesOff.length > 0
      && !!hidden && hidden.shown && namesOn.length === 0
      && hidden.doors.length === 0 && hidden.strip === true
      /* The numbers are still there: this view hides who, not how many — which is the difference
         between it and a support surface, where even the count is a disclosure. */
      && hidden.rows.length === after.rows.length
      && hidden.foot[0].cells.join(',') === after.foot[0].cells.join(','),
    'with the mode off the dialog named ' + namesOff.length + ' of the ' + NAME_FORMS.length
      + ' name form(s) in the document; with it on it names ' + namesOn.length
      + ' (' + JSON.stringify(namesOn) + '), draws ' + hidden.doors.length + ' door(s), '
      + (hidden.strip ? 'says why' : 'says nothing about why') + ', and still shows '
      + hidden.rows.length + ' row(s) totalling ' + JSON.stringify(hidden.foot[0].cells));

  /* And the guard is in the module rather than in the absence of the button: the student view is
     asked for directly, with the mode still on. */
  const forcedOne = await evalJs('(function(){ window.planbook.passHistory.openStudentPasses('
    + JSON.stringify(busiest) + '); return 1; })()');
  const forcedView = await readHistory();
  check('and calling the student view directly under presentation mode names nobody either — the missing door is not what is doing the work',
    forcedOne === 1 && !!forcedView && forcedView.shown
      && namesIn(forcedView.text).length === 0
      && forcedView.rows.length === 0 && forcedView.strip === true
      && forcedView.back === 1,
    'the forced view holds ' + forcedView.rows.length + ' row(s), names '
      + JSON.stringify(namesIn(forcedView.text)) + ', and offers '
      + forcedView.back + ' way(s) back to the class');

  /* THE NEGATIVE CONTROL, and the run must not walk away in presentation mode: everything after
     this section would quietly measure a suppressed app (the reason WO-1.9's own block gives). */
  await evalJs("document.getElementById('presentationBtn').click(); 1");
  await clickSel('[data-pass-history-all]');
  const backOn = await readHistory();
  check('flipping the mode back off brings the same names and the same doors back to the same open dialog',
    !!backOn && namesIn(backOn.text).length === namesOff.length
      && backOn.doors.length === after.rows.length
      && backOn.strip === false
      && backOn.foot[0].cells.join(',') === after.foot[0].cells.join(','),
    backOn ? 'names back = ' + namesIn(backOn.text).length + ' of ' + namesOff.length
      + ', doors = ' + backOn.doors.length + ', strip up = ' + backOn.strip
      + ', footer ' + JSON.stringify(backOn.foot[0].cells) : 'no dialog to read');
  await clickSel('#passHistoryModal [data-modal-close]');

  /*
    ══ WO-2.26: THE CARD ON THE STUDENT REPORT SCREEN, AND THE COUNT LINE THAT AGREES WITH IT ══

    THIS BLOCK USED TO BE AIMED AT A DOOR THAT NO LONGER EXISTS. The first cut of this work order
    drew a 🚪 Every trip button on the attendance history dialog and hung eight checks on it; the
    re-cut deleted the door (owner, 2026-08-14) and put the breakdown inline on WO-3.7's Student
    Report screen. Two of those eight were about that door and about the modal it stacked over, and
    they are gone outright; the rest are re-pointed below, and not one of them was re-run as it
    stood. A green harness against the wrong target is not evidence — which is the sentence the work
    order's own note under the acceptance list is written around. One survives unchanged: the
    per-student doors INSIDE the class-wide 🚪 Passes dialog are still there, and only the report's
    went.

    WHAT IS PROVED HERE IS AN AGREEMENT AND A WINDOW. Every number below is either computed in Node
    off `doc.passes` — the tally() above, this file's own arithmetic — or read off a surface the app
    drew. Nothing asks the app what it thinks its count is and then compares it with itself.

    AND THE WINDOW IS WHY THIS BLOCK PLANTS A FIXTURE, which nothing else in this section does.
    Every trip the run has authored fell on today, so a term-scoped surface and a year-wide one
    would print the same number and the scoping would be INVISIBLE: a check that cannot fail when
    passesForStudentInTerm() is reduced to passesForStudent() is not a check. So the class is put on
    a DATED term whose window holds today, and THREE trips are planted on the busiest student — one
    inside the window carrying a note, one sixty days BEFORE its start, and one sixty days AFTER its
    end. They go in through the store rather than through the registry because there is no control
    that sends a student out last June, which is the same door this section already opens to wind a
    stamp backwards. All three come out again at the foot of the block, with the class's own terms,
    and the section hands on the state it always did.

    THE TRIP ON EACH SIDE IS WO-2.27, AND IT IS THE DIFFERENCE BETWEEN ONE BOUND AND TWO. WO-2.26's
    verifier proved this scoping falsifiable by deleting the whole filter and watching 739 of 746
    checks stand — but every trip in the fixture then fell on or before the term's end, so the UPPER
    bound had nothing beyond it to exclude. passesForStudentInTerm() reduced to `(from)` alone — the
    commonest way a date window rots, and a one-character deletion — passed the suite. A bound with
    no trip beyond it is decoration, so the third trip is dated sixty days past `term.end` and
    carries its own sentinel note. Both sentinels are asked for by name below, on the card, on the
    printed sheet, and in the year-wide fallback where they must both come BACK.

    NOTHING BELOW IS CLICKED BEFORE IT IS ASKED FOR. The block this one replaces called clickSel on
    the deleted door; it threw, and took WO-2.3 and everything under it down with it before a
    summary was printed. A missing fixture is a failed check in this file and never a crash — the
    roster block says so in as many words, and WO-3.5's door says it again.
  */
  /* The dates this fixture is cut against, in Node, the way the pre-drop day below this section is:
     a window that holds today, and a day well outside it. */
  const dayFrom = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const p = (x) => (x < 10 ? '0' : '') + x;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };
  const TERM_FROM = dayFrom(-7);
  const TERM_TO = dayFrom(7);
  const TRIP_OUTSIDE = dayFrom(-60);
  /* WO-2.27: the other side of the window. Sixty days past `term.end`, which is what makes the `to`
     bound load-bearing — see the paragraph above. */
  const TRIP_AFTER = dayFrom(60);
  const NOTE_IN = 'WO-2.26 note — typed on a trip inside the open term';
  const NOTE_OUT = 'WO-2.26 sentinel — this trip is sixty days outside the open term';
  const NOTE_AFTER = 'WO-2.27 sentinel — this trip is sixty days AFTER the open term ends';

  const plant226 = await evalJs(`(function(){
    var s = window.planbook.store, c = window.planbook.classes;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var cls = (d.classes || []).filter(function(x){
      return x.id === ${JSON.stringify(passClass)}; })[0];
    if (!cls) return { ok:false, why:'the class this section has been filling is not in the document' };
    var mine = (d.passes || []).filter(function(p){
      return p && p.classId === ${JSON.stringify(passClass)}; });
    if (!mine.length) return { ok:false, why:'the pass log is empty, so there is nothing to scope' };
    /* THE OFFSET IS TAKEN OFF A STAMP THIS RUN WROTE rather than invented: an hour carrying the
       wrong zone is a different instant, and the two planted trips have to be the same kind of
       record as the ones around them. NO BACKTICKS IN THIS COMMENT: it is inside a template. */
    var zone = String(mine[0].out || '').slice(-6);
    /* Parked on the window and not carried back through CDP, like the WO-2.17 plant: the teardown
       has to put the SAME terms back, and a document that made the round trip would come back as a
       copy of a copy. Nothing between here and the restore reloads the page. */
    window.__wo226 = { terms: JSON.stringify(cls.terms || []) };
    s.update(function(doc){
      cls.terms = [{ id:'tm_wo226', label:'WO-2.26 window',
        start:${JSON.stringify(TERM_FROM)}, end:${JSON.stringify(TERM_TO)} }];
      if (!Array.isArray(doc.passes)) doc.passes = [];
      doc.passes.push({ id:'wo226-in', studentId:${JSON.stringify(busiest)},
        classId:${JSON.stringify(passClass)}, type:'quick',
        out:${JSON.stringify(nodeToday)} + 'T13:02:00' + zone,
        back:${JSON.stringify(nodeToday)} + 'T13:06:00' + zone,
        minutes:4, endedBy:'return', note:${JSON.stringify(NOTE_IN)} });
      doc.passes.push({ id:'wo226-out', studentId:${JSON.stringify(busiest)},
        classId:${JSON.stringify(passClass)}, type:'nurse',
        out:${JSON.stringify(TRIP_OUTSIDE)} + 'T09:00:00' + zone,
        back:${JSON.stringify(TRIP_OUTSIDE)} + 'T09:07:00' + zone,
        minutes:7, endedBy:'return', note:${JSON.stringify(NOTE_OUT)} });
      /* WO-2.27: the same trip on the far side of the window, so the upper bound has something to
         exclude. NO BACKTICKS IN THIS COMMENT: it is inside a template literal. */
      doc.passes.push({ id:'wo226-after', studentId:${JSON.stringify(busiest)},
        classId:${JSON.stringify(passClass)}, type:'nurse',
        out:${JSON.stringify(TRIP_AFTER)} + 'T11:00:00' + zone,
        back:${JSON.stringify(TRIP_AFTER)} + 'T11:11:00' + zone,
        minutes:11, endedBy:'return', note:${JSON.stringify(NOTE_AFTER)} });
    });
    window.planbook.attendance.renderAttendance();
    var open = c.getSelectedTerm() || {};
    return { ok:true, zone: zone, termId: open.id || '', label: open.label || '',
             start: open.start || '', end: open.end || '' };
  })()`);

  /*
    THE SAME QUESTION src/passes.js ANSWERS, ASKED AGAIN IN NODE. The day a trip belongs to is the
    first ten characters of `out` and both bounds are inclusive — docs/data-model.md's rule, written
    out a second time here on purpose, because a harness that called the app's own reader to decide
    what it should be seeing would agree with whatever window the app happened to use.
  */
  const planted226 = await read();
  const busyAll = planted226.passLog.filter((p) => p.classId === passClass
    && p.studentId === busiest);
  const inWindow = busyAll.filter((p) => {
    const on = String(p.out || '').slice(0, 10);
    return on >= TERM_FROM && on <= TERM_TO;
  });
  const daysIn = [...new Set(inWindow.map((p) => String(p.out || '').slice(0, 10)))];
  const daysAll = [...new Set(busyAll.map((p) => String(p.out || '').slice(0, 10)))];
  const wantTerm = tally(inWindow);
  const wantYear = tally(busyAll);
  /* The two sentences src/pass-history.js builds out of tripsText() and minutesText(), spelled out
     here so that a build which reworded either one has to reword this line too. */
  const countText226 = (t) => (t.total
    ? t.total + (t.total === 1 ? ' trip' : ' trips') + ' · '
      + t.minutes + (t.minutes === 1 ? ' minute out' : ' minutes out')
    : 'none');
  const wantLine = 'Hall passes · ' + countText226(wantTerm);
  const wantYearLine = 'Hall passes · ' + countText226(wantYear);

  /*
    THE COUNT LINE ON THE ATTENDANCE HISTORY DIALOG, and the door that must no longer be under it.
    The heading is read as well as the absences, so that "no door" can be told apart from "no
    dialog": a report that failed to draw at all would satisfy every absence below and pass for the
    wrong reason.
  */
  const reportPasses = () => evalJs(`(function(){
    var m = document.getElementById('attendanceHistoryModal');
    var body = document.getElementById('attendanceHistoryBody');
    if (!m || !body) return null;
    var block = body.querySelector('.attendance-report-passes');
    var line = block ? block.querySelector('.attendance-report-sub') : null;
    return {
      shown: !m.classList.contains('hidden'),
      heading: ((body.querySelector('.attendance-report-name') || {}).textContent || '').trim(),
      block: !!block,
      line: line ? (line.textContent || '').trim() : '',
      quiet: !!(block && block.querySelector('.pass-history-quiet')),
      /* Counted across the WHOLE dialog rather than inside the block: a door that moved somewhere
         else in it is not a door that went. */
      doors: body.querySelectorAll('[data-pass-history-student]').length,
      toGrades: body.querySelectorAll('[data-student-detail]').length,
      len: (body.textContent || '').length,
      text: (body.textContent || '').replace(/\\s+/g, ' ') }; })()`);

  /*
    AND THE CARD ITSELF, on a screen rather than in a dialog. It is found by its TITLE and not by
    its position, so that "the pass card is last in the right-hand column" stays a separate claim
    from "the pass card is on the page"; both are read, and both are asserted.

    THE CONTROL CENSUS IS THE 44px CHECK, RE-AIMED. src/detail.css records that this card holds no
    control at all, which is the only honest reason a new block on a touch screen owes no floor — so
    the card is asked for buttons, links, fields and anything focusable, and the answer has to be
    none rather than "they inherit one from somewhere", which is the answer that cost WO-3.7 a
    correction round.
  */
  const detailCard = () => evalJs(`(function(){
    var v = document.getElementById('detailView');
    if (!v) return null;
    var cards = Array.prototype.slice.call(v.querySelectorAll('.detail-card'));
    var titleOf = function(c){
      return ((c.querySelector('.detail-card-title') || {}).textContent || '').trim(); };
    var card = cards.filter(function(c){ return titleOf(c).indexOf('Hall passes') === 0; })[0] || null;
    var table = card ? card.querySelector('.attendance-report-table') : null;
    var rows = table ? Array.prototype.slice.call(table.querySelectorAll('tbody tr')) : [];
    var cells = function(tr){
      return Array.prototype.slice.call(tr.querySelectorAll('th,td'))
        .map(function(c){ return (c.textContent || '').trim(); }); };
    return {
      up: !v.classList.contains('hidden'),
      dialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
        .filter(function(o){ return !o.classList.contains('hidden'); })
        .map(function(o){ return o.id; }),
      heading: (document.getElementById('detailStudentName') || {}).textContent || '',
      cards: cards.map(titleOf),
      card: !!card,
      title: card ? titleOf(card) : '',
      note: card ? ((card.querySelector('.detail-card-note') || {}).textContent || '').trim() : '',
      empty: card ? ((card.querySelector('.attendance-report-empty') || {}).textContent || '').trim() : '',
      quiet: !!(card && card.querySelector('.pass-history-quiet')),
      table: !!table,
      trips: rows.filter(function(tr){ return !/pass-history-note-row/.test(tr.className); })
        .map(cells),
      notes: rows.filter(function(tr){ return /pass-history-note-row/.test(tr.className); })
        .map(function(tr){ return (tr.textContent || '').trim(); }),
      controls: card ? Array.prototype.slice.call(card.querySelectorAll(
        'button, a, input, select, textarea, [tabindex], [role="button"], [data-pass-history-student]'))
        .map(function(e){ return e.tagName + '.' + (e.className || ''); }) : [],
      len: (v.textContent || '').length,
      text: (v.textContent || '').replace(/\\s+/g, ' ') }; })()`);

  /* The two doors this block walks through, asked for before either is used. */
  const rowDoor226 = '#attendanceBody [data-attendance-history="' + busiest + '"]';
  const rowLive226 = await has(rowDoor226);
  if (rowLive226) await clickSel(rowDoor226);
  const onDialog = rowLive226 ? await reportPasses() : null;
  const cardDoor226 = '#attendanceHistoryModal [data-student-detail="' + busiest + '"]';
  const cardDoorLive = rowLive226 ? await has(cardDoor226) : false;

  /* One on each side, counted in Node off the log rather than assumed off the plant: `before` and
     `after` are what make BOTH bounds of the window load-bearing, and a fixture that lost either one
     would leave the corresponding bound provable by nothing (WO-2.27). */
  const before226 = busyAll.filter((p) => String(p.out || '').slice(0, 10) < TERM_FROM);
  const after226 = busyAll.filter((p) => String(p.out || '').slice(0, 10) > TERM_TO);
  const fixture226 = plant226.ok === true && plant226.termId === 'tm_wo226'
    && inWindow.length > 1 && busyAll.length === inWindow.length + 2
    && daysIn.length === 1 && daysAll.length === 3
    && before226.length === 1 && after226.length === 1
    && inWindow.some((p) => p.note === NOTE_IN)
    && busyAll.some((p) => p.note === NOTE_OUT)
    && busyAll.some((p) => p.note === NOTE_AFTER)
    && wantTerm.total !== wantYear.total && wantTerm.minutes !== wantYear.minutes
    && rowLive226 && cardDoorLive;
  check('the WO-2.26 fixture is real: the class is on a DATED term, that student holds trips inside its window and one sixty days on EACH side of it, and a term count and a year count therefore cannot both be right',
    fixture226,
    (plant226.ok ? 'the open term is ' + JSON.stringify(plant226.label) + ' ' + plant226.start
      + '..' + plant226.end : 'the plant did not land: ' + plant226.why)
      + '; that student holds ' + busyAll.length + ' trip(s) on the log across '
      + daysAll.length + ' day(s), ' + inWindow.length + ' of them inside the window on '
      + daysIn.length + ' day(s), with ' + before226.length + ' before it and '
      + after226.length + ' after it — ' + JSON.stringify(countText226(wantTerm)) + ' against '
      + JSON.stringify(countText226(wantYear)) + ' for the year; the registry row is there = '
      + rowLive226 + ', the door to the grades is there = ' + cardDoorLive);

  if (!fixture226) {
    skip('the rest of WO-2.26 — the trips inline on the Student Report screen, the two counts agreeing exactly, the term window and its no-dates fallback, "none" on both surfaces, presentation mode on both surfaces, the card holding no control, and the trips on the printed sheet',
      'the fixture did not land, so nothing below it could be driven the way a teacher reaches it — and a check driven over a fixture that is not there passes for the wrong reason');
  } else {
    await clickSel(cardDoor226);
    await new Promise(r => setTimeout(r, 250));
    const onCard = await detailCard();
    const cardTrips = onCard ? onCard.trips : [];
    const cardDays = [...new Set(cardTrips.map((r) => r[0]))];

    /*
      ACCEPTANCE LINE 1. Every trip in the open term, with its date, its clock and its note, ON THE
      SCREEN — not in a dialog over it. The dialog the door was in is asserted CLOSED for exactly
      that reason: "behind no tap" is a claim about where the list is, and a list that had arrived
      in a modal would satisfy every other clause here.
    */
    check('the Student Report screen lists this student\'s trips inline: one row per trip in the open term, with the minutes that were stored and the note that was typed under the row it belongs to, on the page itself and behind no tap',
      !!onCard && onCard.up && onCard.dialogs.length === 0 && onCard.card && onCard.table
        && cardTrips.length === inWindow.length
        && cardTrips.every((r) => r.length === 5 && /\d/.test(r[0]) && r[2] !== '' && r[3] !== '')
        && cardTrips.every((r, i) => r[4] === String(inWindow[i].minutes))
        && inWindow.every((p) => !p.note || onCard.text.indexOf(p.note) >= 0)
        && onCard.notes.length === inWindow.filter((p) => p.note).length
        && onCard.notes.length > 0,
      'the log holds ' + inWindow.length + ' trip(s) for that student inside the window ('
        + inWindow.filter((p) => p.note).length + ' noted); the card drew ' + cardTrips.length
        + ' trip row(s) and ' + (onCard ? onCard.notes.length : '?') + ' note row(s), with '
        + JSON.stringify(onCard && onCard.dialogs) + ' dialog(s) open over it; the rows read '
        + JSON.stringify(cardTrips));

    /*
      AND IT IS THE CARD attendanceCard() IS THE SIBLING OF, which is the shape half of the same
      line and the half a table bolted onto the page would fail: a titled `.detail-card` carrying
      its own summary, with the note underneath saying what the list is counted out of, DIRECTLY
      UNDER the attendance it is not.

      IT SAID "LAST IN THE RIGHT-HAND COLUMN" UNTIL 2026-08-24, and WO-4.4 is what moved it: the log
      card is the fourth in that column now, so the trips are second-to-last. Re-cut IN PLACE rather
      than deleted — one call site before and one after, so the recorded count in tools/README.md
      does not move — and re-cut to the claim that was actually being made. WO-2.26 put this card
      "under the attendance it is not" on purpose (src/detail.js says so at the append), and
      `cards[cards.length - 1]` was only ever a cheap way of spelling that while it happened to be
      true. What is asserted now is the ADJACENCY, which is the thing the work order argued for, plus
      the log card sitting after it — so a build that shuffled the column still goes red.
    */
    const passAt226 = onCard ? onCard.cards.indexOf(wantLine) : -1;
    check('and it is built as the attendance card\'s sibling — a titled `.detail-card` carrying its own count, the note underneath it, directly under the attendance it is not (and, since WO-4.4, directly above the log)',
      !!onCard && onCard.title === wantLine && passAt226 > 0
        && onCard.cards[passAt226 - 1].indexOf('Attendance · ') === 0
        && onCard.cards[passAt226 + 1] === 'What you have written down'
        && onCard.cards.filter((t) => t.indexOf('Attendance · ') === 0).length === 1
        && /^Every trip that ended is here, oldest first/.test(onCard.note)
        && /a student on a hall pass was present/.test(onCard.note),
      'the cards down the column are ' + JSON.stringify(onCard && onCard.cards)
        + '; the note reads ' + JSON.stringify(onCard && onCard.note.slice(0, 120)));

    /*
      ACCEPTANCE LINE 2, AND THE CLAIM THE OLD BLOCK COULD NOT MAKE. The trips sixty days out are on
      the log and off the card. Four ways of saying it, because each fails differently: the sentinel
      notes are absent, the count is the term's and not the year's, the card covers one day where the
      log covers three, and the card names the term it is over.

      BOTH SENTINELS ARE ASKED FOR SEPARATELY (WO-2.27), and that is the whole of the second bound:
      the one before `term.start` fails a build with no `from`, the one after `term.end` fails a
      build with no `to`, and asking for them in one clause would let either half carry the other.

      AND THE APP'S OWN TWO READERS ARE ASKED TO DISAGREE, through the seam. If
      passesForStudentInTerm() were ever reduced to passesForStudent() those two numbers would be
      equal, the card above would carry the year's count, and both checks would go red together.
    */
    const scoped = await evalJs(`(function(){
      var p = window.planbook.passes, d = window.planbook.store.getDoc();
      var t = window.planbook.classes.getSelectedTerm();
      return {
        inTerm: p.passesForStudentInTerm(d, ${JSON.stringify(passClass)},
          ${JSON.stringify(busiest)}, t).length,
        year: p.passesForStudent(d, ${JSON.stringify(passClass)},
          ${JSON.stringify(busiest)}).length }; })()`);
    check('the list is the open TERM\'s and says which term: the trips sixty days on either side of the window are on the log and off the card, the count is the term\'s and not the year\'s, and the card covers one day where the log covers three',
      !!onCard && onCard.text.indexOf(NOTE_OUT) < 0
        && onCard.text.indexOf(NOTE_AFTER) < 0
        && onCard.text.indexOf(NOTE_IN) >= 0
        && onCard.title === wantLine && onCard.title !== wantYearLine
        && cardDays.length === daysIn.length && daysIn.length < daysAll.length
        && onCard.note.indexOf('WO-2.26 window only') > 0
        && scoped.inTerm === inWindow.length && scoped.year === busyAll.length,
      'the card says ' + JSON.stringify(onCard && onCard.title) + ' where the year would say '
        + JSON.stringify(wantYearLine) + ', over ' + cardDays.length + ' distinct day(s) '
        + JSON.stringify(cardDays) + ' against the log\'s ' + daysAll.length
        + '; the sentinel before the term is on the card = '
        + (!!onCard && onCard.text.indexOf(NOTE_OUT) >= 0) + ', the one after it = '
        + (!!onCard && onCard.text.indexOf(NOTE_AFTER) >= 0) + '; the app\'s own readers answer '
        + scoped.inTerm + ' in the term against ' + scoped.year + ' on the year');

    /*
      ACCEPTANCE LINE 3. One number on two surfaces, compared as STRINGS rather than as tallies: a
      build that agreed on the count and disagreed on the wording would still be two answers to one
      question. The door is asked for across the whole dialog, and so is the year-wide label the
      first cut put on that line — the term-scoping decision makes it untrue rather than merely
      unnecessary.
    */
    check('the attendance history dialog shows the same count and no door: `Hall passes · N trips · N minutes out` character for character with the card, `Every trip` gone from the dialog, and no label reconciling the two',
      !!onDialog && onDialog.shown && onDialog.block
        && onDialog.line === wantLine
        && onDialog.doors === 0
        && onDialog.text.indexOf('Every trip') < 0
        && !/whole year, not just this term/.test(onDialog.text)
        /* The rest of the dialog drew, so the missing door is a decision rather than a dialog that
           failed to build — and the ONE door that belongs there is still there. */
        && onDialog.heading.length > 0 && onDialog.len > 200 && onDialog.toGrades === 1,
      'the dialog said ' + JSON.stringify(onDialog && onDialog.line) + ' and the card said '
        + JSON.stringify(onCard && onCard.title) + '; ' + (onDialog ? onDialog.doors : '?')
        + ' trip door(s) and ' + (onDialog ? onDialog.toGrades : '?') + ' door(s) to the grades in '
        + (onDialog ? onDialog.len : 0) + ' character(s) of dialog');

    /*
      AND THE OTHER HALF OF ACCEPTANCE LINE 2: a term with no dates set falls back to the whole year
      in attendanceCard()'s own words rather than in new ones. The SAME term is stripped of its two
      dates and the screen repainted, so what changes between the two readings is the window and
      nothing else — a second class carrying a bare term would have changed the student too.
    */
    const undated = await evalJs(`(function(){
      var s = window.planbook.store;
      s.update(function(doc){
        var cls = (doc.classes || []).filter(function(x){
          return x.id === ${JSON.stringify(passClass)}; })[0];
        if (cls && cls.terms && cls.terms[0]) { delete cls.terms[0].start; delete cls.terms[0].end; }
      });
      window.planbook.detail.renderDetail();
      var t = window.planbook.classes.getSelectedTerm() || {};
      return { start: t.start || '', end: t.end || '' }; })()`);
    const onBare = await detailCard();
    check('and a term with no dates set falls back to the whole year in the attendance card\'s own words rather than in new ones — the same term, stripped of its two dates, on the same screen',
      undated.start === '' && undated.end === ''
        && !!onBare && onBare.card
        && /this term has no dates set, so this is every trip on the year/.test(onBare.note)
        && onBare.note.indexOf('WO-2.26 window only') < 0
        && onBare.title === wantYearLine
        && onBare.trips.length === busyAll.length
        /* Both sentinels come BACK when the window goes, which is the other direction of the same
           claim: a bound that excluded them is gone, not a list that never had them (WO-2.27). */
        && onBare.text.indexOf(NOTE_OUT) >= 0
        && onBare.text.indexOf(NOTE_AFTER) >= 0,
      'with the dates gone the card says ' + JSON.stringify(onBare && onBare.title) + ' over '
        + (onBare ? onBare.trips.length : '?') + ' row(s) — the year\'s ' + busyAll.length
        + ' — and the note reads ' + JSON.stringify(onBare && onBare.note.slice(0, 100)));

    /* The dates go back on before anything else is read, so every check under this one is over the
       window again. */
    await evalJs(`(function(){
      window.planbook.store.update(function(doc){
        var cls = (doc.classes || []).filter(function(x){
          return x.id === ${JSON.stringify(passClass)}; })[0];
        if (cls && cls.terms && cls.terms[0]) {
          cls.terms[0].start = ${JSON.stringify(TERM_FROM)};
          cls.terms[0].end = ${JSON.stringify(TERM_TO)};
        }
      });
      window.planbook.detail.renderDetail();
      return 1; })()`);

    /*
      THE TRIPS PRINT WITH THE GRADE — this work order's third decision, made in src/detail.js §
      PRINTING A VIEW and measured here. WO-3.7's own apparatus, borrowed rather than reinvented:
      window.print() blocks in a headless browser, so it is stubbed, and the stub takes the reading
      at the one instant the gate is a fact rather than a bet. THE STUB REPORTS THAT IT TOOK, which
      is the guard against the failure that looks exactly like an app defect — a print that was
      never called reads as a sheet with a card missing from it.

      HEIGHTS RATHER THAN DISPLAY, for the reason that section gives: the computed display of an
      element inside a display:none ancestor is its own value, not none. What a hidden card does not
      have is a BOX. This does NOT close the 👤 line on the printed page — nobody here has held the
      paper, and no headless window is a sheet of it.
    */
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await new Promise(r => setTimeout(r, 120));
    const printed226 = await evalJs(`(function(){
      var b = document.querySelector('#detailView [data-detail-sheet-print]');
      if (!b) return { ok:false, why:'no Print control on the open Student Report screen' };
      window.__realPrint = window.print;
      window.print = function(){
        window.__wo226called = (window.__wo226called || 0) + 1;
        try {
          var v = document.getElementById('detailView');
          var hero = v.querySelector('.detail-hero');
          var cards = Array.prototype.slice.call(v.querySelectorAll('.detail-card'));
          var card = cards.filter(function(c){
            var t = c.querySelector('.detail-card-title');
            return t && (t.textContent || '').trim().indexOf('Hall passes') === 0; })[0] || null;
          var table = card ? card.querySelector('.attendance-report-table') : null;
          var high = function(e){ return e ? Math.round(e.getBoundingClientRect().height) : -1; };
          window.__wo226print = {
            attr: document.body.hasAttribute('data-detail-print'),
            cardH: high(card), tableH: high(table), heroH: high(hero),
            rows: table ? table.querySelectorAll('tbody tr').length : -1,
            text: card ? (card.textContent || '').replace(/\\s+/g, ' ') : '' };
        } catch (err) { window.__wo226printErr = String((err && err.message) || err); }
      };
      var stubbed = window.print !== window.__realPrint;
      b.click();
      var out = { ok:true, stubbed: stubbed, calls: window.__wo226called || 0,
        snapshotError: window.__wo226printErr || '', sheet: window.__wo226print || null };
      window.print = window.__realPrint;
      delete window.__realPrint;
      delete window.__wo226print;
      delete window.__wo226printErr;
      delete window.__wo226called;
      window.dispatchEvent(new Event('afterprint'));
      return out; })()`);
    await send('Emulation.setEmulatedMedia', { media: '' });
    const sheet226 = printed226.ok ? printed226.sheet : null;
    check('the trips print WITH the grade, which is the decision this work order made out loud: at the instant the sheet is taken the hall-pass card has a box on it, its rows are the term\'s, and the note typed on a trip is on the paper',
      printed226.ok === true && printed226.stubbed === true && printed226.calls === 1
        && !!sheet226 && sheet226.attr === true
        && sheet226.cardH > 0 && sheet226.tableH > 0 && sheet226.heroH > 0
        && sheet226.rows === inWindow.length + inWindow.filter((p) => p.note).length
        && sheet226.text.indexOf(NOTE_IN) >= 0
        && sheet226.text.indexOf(NOTE_OUT) < 0
        && sheet226.text.indexOf(NOTE_AFTER) < 0,
      printed226.ok
        ? 'window.print() calls from one tap = ' + printed226.calls + ', gate on at the snapshot = '
          + (sheet226 && sheet226.attr) + '; the card measured ' + (sheet226 && sheet226.cardH)
          + 'px over a ' + (sheet226 && sheet226.tableH) + 'px table of '
          + (sheet226 && sheet226.rows) + ' row(s), beside a ' + (sheet226 && sheet226.heroH)
          + 'px hero' + (printed226.snapshotError
            ? '; the snapshot threw ' + printed226.snapshotError : '')
        : printed226.why);

    /*
      ACCEPTANCE LINE 5, FIRST HALF: the card goes and the screen stays a screen. The mode is
      flipped with the real header control while the Student Report is ON SCREEN, which is the half
      that is not about the card at all — src/shell.js's flipPresentationMode() carried this view on
      its "deliberately absent" list until this work order, and suppression that only applies to the
      NEXT render is the defect that list's own paragraph describes.
    */
    await evalJs("document.getElementById('presentationBtn').click(); 1");
    await new Promise(r => setTimeout(r, 150));
    const projected = await detailCard();
    check('presentation mode takes the card\'s list AND its count off the Student Report screen — on the screen already open rather than at the next navigation — and says why, on a page that otherwise still draws in full',
      !!projected && projected.up && projected.card
        && projected.quiet === true && projected.table === false
        && projected.trips.length === 0 && projected.notes.length === 0
        && projected.title === 'Hall passes'
        && projected.text.indexOf(countText226(wantTerm)) < 0
        && projected.text.indexOf(NOTE_IN) < 0
        /* The screen that remains is a screen and not a hole: the heading and the attendance card
           beside it are both still on it. */
        && projected.heading.length > 0 && projected.len > 400
        && projected.cards.filter((t) => t.indexOf('Attendance · ') === 0).length === 1,
      'with the mode on the card is titled ' + JSON.stringify(projected && projected.title)
        + ' over ' + (projected ? projected.trips.length : '?') + ' row(s), says why = '
        + (projected && projected.quiet) + ', and the screen still holds '
        + (projected ? projected.len : 0) + ' character(s) across '
        + JSON.stringify(projected && projected.cards));

    /* THE NEGATIVE CONTROL. Without it the check above is equally true of a screen that failed to
       draw at all, which is the shape of vacuous pass this section keeps refusing. */
    await evalJs("document.getElementById('presentationBtn').click(); 1");
    await new Promise(r => setTimeout(r, 150));
    const modeOff = await detailCard();
    check('and flipping the mode back off brings the same list and the same count back to the same card on the same screen',
      !!modeOff && modeOff.card && modeOff.quiet === false
        && modeOff.title === wantLine
        && modeOff.trips.length === inWindow.length
        && modeOff.text.indexOf(NOTE_IN) >= 0,
      'the card is back at ' + JSON.stringify(modeOff && modeOff.title) + ' over '
        + (modeOff ? modeOff.trips.length : '?') + ' row(s), strip up = '
        + (modeOff && modeOff.quiet));

    /*
      AND THE SAME PAIR ON THE OTHER SURFACE. Back to the registry through the switcher a teacher
      taps, because the count line lives on a dialog opened from a row there. Both flips are made
      with no dialog on screen: the header is BEHIND the scrim, and a click at its coordinates with
      an overlay up lands on the backdrop — the note at the WO-2.9 check above.
    */
    await clickSel('#detailView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 200));
    await evalJs("document.getElementById('presentationBtn').click(); 1");
    await clickSel(rowDoor226);
    const dialogOn = await reportPasses();
    await evalJs("window.planbook.closeModal('attendanceHistoryModal'); 1");
    await evalJs("document.getElementById('presentationBtn').click(); 1");
    await clickSel(rowDoor226);
    const dialogOff = await reportPasses();
    check('and it takes the count line off the attendance history dialog too, on a dialog otherwise still drawn in full — and flipping back brings the same number to the same line',
      !!dialogOn && dialogOn.shown && dialogOn.block && dialogOn.quiet === true
        && dialogOn.text.indexOf(countText226(wantTerm)) < 0
        && dialogOn.heading.length > 0 && dialogOn.len > 200
        && !!dialogOff && dialogOff.quiet === false && dialogOff.line === wantLine,
      'with the mode on the dialog says why = ' + (dialogOn && dialogOn.quiet) + ' over '
        + (dialogOn ? dialogOn.len : 0) + ' character(s), and the count '
        + JSON.stringify(countText226(wantTerm)) + ' is on it = '
        + (!!dialogOn && dialogOn.text.indexOf(countText226(wantTerm)) >= 0)
        + '; with it off the line reads ' + JSON.stringify(dialogOff && dialogOff.line));

    /*
      ACCEPTANCE LINE 4: A STUDENT WITH NO TRIPS IS STATED AS NONE ON BOTH SURFACES. Roll Call!
      draws its inline table only when there are passes (dashboard.html:4718, `if (passes.length)`)
      and that is the half deliberately not lifted — a missing block reads as "this build does not
      show that" rather than as "none". The student is found rather than named, and outD is excluded
      because their pass was CANCELLED, which is a different sentence about a different fact and is
      asserted further up.
    */
    const noTrips = passRoster.filter((id) => !byStudent[id] && id !== outD && id !== busiest)[0];
    await evalJs("window.planbook.closeModal('attendanceHistoryModal'); 1");
    const quietRow = '#attendanceBody [data-attendance-history="' + noTrips + '"]';
    const quietRowLive = await has(quietRow);
    if (quietRowLive) await clickSel(quietRow);
    const quietDialog = quietRowLive ? await reportPasses() : null;
    const quietDoor = '#attendanceHistoryModal [data-student-detail="' + noTrips + '"]';
    if (quietRowLive && await has(quietDoor)) await clickSel(quietDoor);
    await new Promise(r => setTimeout(r, 250));
    const quietCard = await detailCard();
    check('a student with no trips is stated as none on BOTH surfaces — `Hall passes · none` on the dialog, and a card that says so in a sentence rather than an empty table — on two surfaces that otherwise drew in full',
      !!quietDialog && quietDialog.block && quietDialog.line === 'Hall passes · none'
        && quietDialog.heading.length > 0 && quietDialog.len > 200
        && !!quietCard && quietCard.card && quietCard.title === 'Hall passes · none'
        && quietCard.table === false && quietCard.trips.length === 0
        && /No hall passes are recorded for this student in WO-2\.26 window\./.test(quietCard.empty)
        && quietCard.heading.length > 0 && quietCard.len > 400,
      'the dialog said ' + JSON.stringify(quietDialog && quietDialog.line) + ' over '
        + (quietDialog ? quietDialog.len : 0) + ' character(s); the card said '
        + JSON.stringify(quietCard && quietCard.title) + ' and '
        + JSON.stringify(quietCard && quietCard.empty) + ' over '
        + (quietCard ? quietCard.len : 0) + ' character(s) of screen');

    /*
      AND THE ROOM BEHIND THE CLASS DIALOG'S OWN DOOR IS NOT AN EMPTY PAGE EITHER. This one survives
      the re-cut unchanged: the per-student doors inside the class-wide 🚪 Passes dialog are still
      there and only the report's went. Asked through the seam because the app deliberately draws no
      button for a student the log never mentions.
    */
    const forcedEmpty = await evalJs('(function(){ window.planbook.passHistory.openStudentPasses('
      + JSON.stringify(noTrips) + '); return 1; })()');
    const emptyView = await readHistory();
    check('and the view behind the class dialog\'s own door strands nobody: called directly for that student it says there are none and offers the way back to the class',
      forcedEmpty === 1 && !!emptyView && emptyView.shown && emptyView.rows.length === 0
        && /No hall passes are recorded for this student/.test(emptyView.text)
        && emptyView.back === 1,
      'the forced view holds ' + (emptyView ? emptyView.rows.length : '?') + ' row(s), '
        + (emptyView ? emptyView.back : '?') + ' way(s) back, and reads '
        + JSON.stringify(emptyView && emptyView.text.slice(0, 90)));
    await clickSel('#passHistoryModal [data-modal-close]');

    /*
      AND THE TOUCH FLOOR, RE-AIMED. The old check asserted a 44px rule for a door this re-cut
      deletes. Two claims replace it, and the first is the one that matters: the card on the Student
      Report screen holds NO CONTROL AT ALL, which is the only honest reason a new block on a touch
      screen owes no floor — src/detail.css says so in as many words, and this is that sentence
      measured rather than read. The second is that `.attendance-report-door` still declares its
      floor BY NAME for the two controls that do wear it — WO-3.7's "Grades for …" and WO-2.9's
      ← All students — because deleting the third one must not take the rule with it. That half is a
      RULE and not a measurement, and it is weaker on purpose: the coarse sweep at the foot of this
      file measures `#classView` and the modals it opens, and this dialog is reached from a
      student's name with no roster on screen by the time that sweep runs. "It inherits one from
      `.class-action-btn`" was correct at WO-3.7 and still cost that work order a correction round.
      The thumb stays 👤.
    */
    const doorRule = await evalJs(`(function(){
      var out = [];
      for (var i = 0; i < document.styleSheets.length; i++) {
        var rules; try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
        for (var j = 0; j < rules.length; j++) {
          var r = rules[j];
          if (!r.media || String(r.media.mediaText).indexOf('pointer: coarse') < 0) continue;
          for (var k = 0; k < r.cssRules.length; k++) {
            var s = r.cssRules[k];
            if (!s.selectorText || s.selectorText.indexOf('.attendance-report-door') < 0) continue;
            out.push({ sel: s.selectorText, h: s.style.minHeight, w: s.style.minWidth });
          }
        }
      }
      return out; })()`);
    const floored = doorRule.filter((r) => parseFloat(r.h) >= 44 && parseFloat(r.w) >= 44);
    check('the hall-pass card holds no control at all, which is why this screen owes it no 44px floor — and the class the two surviving doors DO wear still declares one by name in the coarse block',
      !!onCard && onCard.controls.length === 0 && floored.length >= 1,
      'the card drew ' + (onCard ? onCard.controls.length : '?') + ' control(s) '
        + JSON.stringify(onCard && onCard.controls) + '; the coarse rules naming that class are '
        + JSON.stringify(doorRule));
  }

  /*
    THE FIXTURE COMES OUT AND THE CLASS GOES BACK ON ITS OWN TERMS. The trips are removed BY ID
    rather than by restoring a snapshot of `passes`, because this section keeps filling that log
    after this block and a snapshot would take the trips it writes next with it.
  */
  await evalJs("['attendanceHistoryModal','passHistoryModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); 1");
  await evalJs(`(function(){
    window.planbook.store.update(function(doc){
      doc.passes = (doc.passes || []).filter(function(p){
        return p && p.id !== 'wo226-in' && p.id !== 'wo226-out' && p.id !== 'wo226-after'; });
      var cls = (doc.classes || []).filter(function(x){
        return x.id === ${JSON.stringify(passClass)}; })[0];
      if (cls && window.__wo226) cls.terms = JSON.parse(window.__wo226.terms);
    });
    delete window.__wo226;
    return 1; })()`);
  /* Back onto the registry through the switcher first, because openCard() below starts by tapping
     the class grid's door and that control is on the class bar rather than in the detail view. */
  if (await has('#detailView [data-class-screen="class"]')) {
    await clickSel('#detailView [data-class-screen="class"]');
    await new Promise(r => setTimeout(r, 200));
  }
  const handedBack = await openCard(passClass);
  const leftovers = handedBack.passLog.filter((p) => p.id === 'wo226-in' || p.id === 'wo226-out'
    || p.id === 'wo226-after');
  check('and the fixture comes out again: all three planted trips are off the log, the class is back on its own terms, and the registry this section hands on is the one it was handed',
    leftovers.length === 0 && handedBack.openClass === passClass && handedBack.viewShown,
    leftovers.length + ' planted trip(s) still on the log; the open class is '
      + JSON.stringify(handedBack.openClass) + ' with the registry up = ' + handedBack.viewShown);

  /*
    ── WO-2.30: THE CLASS IS PUT AWAY AND THE STUDENT IS STILL OUT ──

    THE WHOLE POINT OF THIS BLOCK IS THAT IT GOES THROUGH THE APP. WO-2.28's missing-node check above
    punches its hole in the DOM by hand — the honest limit its own TESTING.md entry records — and
    this path cannot be reached that way, because the defect is not in the banner: it is
    getSelectedClassId() answering with a DIFFERENT class the moment this one leaves the tab bar, so
    the pass clock walks somebody else's room while a child is out of this one. Nothing returns
    early, nothing is missing, and every check in this file was green over it. So the walk is a pass
    issued on a real button, the class archived through the real manager, and the real clock left to
    tick.

    THE SECOND ACTIVE CLASS IS THE PRECONDITION AND IT IS ASSERTED, not assumed. With only one class
    in the document, archiving it leaves paintPassElapsed()'s first guard (`!cls`) to fire and the
    misdirection never happens — that is the rare tail of the case, and a fixture that fell into it
    would prove the opposite of what this block is for. So the check below reads the active list, and
    asserts both that this class is the one the fallback resolves FROM (it is first) and that there
    is another one for it to resolve TO.

    AND THE ALERT IS THE READING, not the tab bar. "The class is still on the bar" is what the
    refusal looks like; "the student is announced five minutes later" is what it is FOR, and it is
    the clause that goes red on a build with no refusal in it — the archived class's pass sits in the
    document, un-alerted, for as long as the app is open.
  */
  const before30 = await read();
  /* Computed the way src/classes.js computes it: the first ACTIVE class in document order is what a
     stale preference falls back to. */
  const fallback30 = await evalJs(`(function(){
    var d = window.planbook.store.getDoc();
    var active = (d.classes || []).filter(function(c){ return !c.archived; });
    var mine = active.filter(function(c){ return c.id === ${JSON.stringify(passClass)}; })[0];
    return { active: active.length, first: active.length ? active[0].id : '',
             name: mine ? mine.name : '',
             next: (active.filter(function(c){
               return c.id !== ${JSON.stringify(passClass)}; })[0] || {}).id || '' }; })()`);
  const who30 = await evalJs(`(function(){
    var s = (window.planbook.store.getDoc().students || []).filter(function(x){
      return x.id === ${JSON.stringify(outA)}; })[0];
    return s ? { first: s.first || '', last: s.last || '' } : { first: '', last: '' }; })()`);
  await clickSel('[data-pass-issue="' + outA + '"][data-pass-type="bathroom"]');
  const issued30 = await read();
  const open30 = issued30.openPasses[0] || {};
  check('the archive walk starts from one student out of THIS class, on a fresh pass, with another active class for the open class to fall back to',
    before30.openPasses.length === 0 && issued30.openPasses.length === 1
      && open30.studentId === outA && open30.classId === passClass
      /* No `alerted` on it yet, which is what makes the alert clause below non-vacuous — the same
         guard the WO-2.28 fixture above carries, and for the same reason. */
      && open30.keys === 'classId,id,out,studentId,type'
      && issued30.openClass === passClass
      && fallback30.active >= 2 && fallback30.first === passClass && !!fallback30.next
      && !!who30.first && !!who30.last,
    'open passes ' + before30.openPasses.length + ' -> ' + issued30.openPasses.length
      + ' carrying keys ' + JSON.stringify(open30.keys) + '; ' + fallback30.active
      + ' active class(es), this one first = ' + (fallback30.first === passClass)
      + ', the one archiving would fall to = ' + JSON.stringify(fallback30.next));

  await clickSel('header [data-class-manage]');
  await hush();
  await clickSel('#classList [data-class-archive="' + passClass + '"]');
  const refused30 = await evalJs(`(function(){
    var id = ${JSON.stringify(passClass)};
    var d = window.planbook.store.getDoc();
    var cls = (d.classes || []).filter(function(c){ return c.id === id; })[0] || {};
    var err = document.getElementById('classError');
    var bar = document.getElementById('classTabBar');
    return { archived: !!cls.archived,
             onBar: !!bar && !!bar.querySelector('[data-class-tab="' + id + '"]'),
             activeRow: !!document.querySelector('#classList [data-class-archive="' + id + '"]'),
             /* This class, in the archived list — not the length of that list, which legitimately
                holds another class this run left there on purpose. */
             archivedRow: !!document.querySelector('#classArchivedList [data-class-restore="' + id + '"]'),
             shown: !!err && !err.classList.contains('hidden'),
             text: err ? (err.textContent || '').replace(/\\s+/g, ' ').trim() : '',
             open: (d.openPasses || []).length }; })()`);
  const heard30 = await heard();
  check('archiving a class with a student still out is refused: the class stays on the bar, the pass stays open, and the manager says who has to come back first',
    refused30.archived === false && refused30.onBar && refused30.activeRow
      && refused30.archivedRow === false && refused30.open === 1
      && refused30.shown && /^1 student is still out on a hall pass from /.test(refused30.text)
      && refused30.text.indexOf(fallback30.name) >= 0
      && /Return/.test(refused30.text) && /Cancel/.test(refused30.text)
      /* Spoken as well as printed: it lands in a corner of a dialog a screen-reader user has no
         reason to move to, which is what src/classes.js's showClassError() is for. */
      && heard30.indexOf('still out on a hall pass') >= 0,
    'archived = ' + refused30.archived + ', still on the bar = ' + refused30.onBar
      + ', open passes = ' + refused30.open + ', the manager reads '
      + JSON.stringify(refused30.text) + ', and the live region heard '
      + JSON.stringify(heard30));

  await clickSel('#classesModal [data-modal-close]');
  await hush();
  const wound30 = await windBack(outA, 5.2);
  const alert30 = await waitForPassAlert(outA, PASS_ALERT_SAID, 1);
  const alerted30 = alert30.state.openPasses.filter((p) => p.studentId === outA)[0] || {};
  check('and the clock still reaches that student five minutes later, because the class it belongs to is still the one that is open',
    !!wound30.now && alert30.state.openClass === passClass
      && alerted30.classId === passClass && alerted30.alerted === 1
      && PASS_ALERT_SAID.test(alert30.said)
      && alert30.said.indexOf(who30.first) >= 0 && alert30.said.indexOf(who30.last) >= 0,
    'the open class is ' + JSON.stringify(alert30.state.openClass) + ', the pass belongs to '
      + JSON.stringify(alerted30.classId) + ' and records alerted = '
      + JSON.stringify(alerted30.alerted) + '; the announcement was ' + JSON.stringify(alert30.said));

  /*
    THE FIXTURE COMES OUT THE WAY THE MESSAGE SAYS TO: bring the student back, then archive. That is
    the other half of the refusal and it is asserted rather than assumed — a guard that never lifts
    is a class the teacher can never put away, which would be a worse bug than the one being fixed.

    The restore arm above it exists for the RED run this block was written against: on a build with
    no refusal in it the class really is archived by now, and everything below would be driving a
    class that is off the bar. It is defensive plumbing, not a claim — the claims are the checks.
  */
  await clickSel('header [data-class-manage]');
  if (await has('#classArchivedList [data-class-restore="' + passClass + '"]')) {
    await clickSel('#classArchivedList [data-class-restore="' + passClass + '"]');
  }
  await evalJs("window.planbook.closeModal('classesModal');1");
  const backOn30 = await openCard(passClass);
  if (await has('[data-pass-cancel="' + outA + '"]')) {
    await clickSel('[data-pass-cancel="' + outA + '"]');
  }
  await clickSel('header [data-class-manage]');
  await clickSel('#classList [data-class-archive="' + passClass + '"]');
  const lifted30 = await evalJs(`(function(){
    var id = ${JSON.stringify(passClass)};
    var d = window.planbook.store.getDoc();
    var cls = (d.classes || []).filter(function(c){ return c.id === id; })[0] || {};
    var err = document.getElementById('classError');
    return { archived: !!cls.archived, open: (d.openPasses || []).length,
             restorable: !!document.querySelector('#classArchivedList [data-class-restore="' + id + '"]'),
             shown: !!err && !err.classList.contains('hidden'),
             text: err ? (err.textContent || '').trim() : '' }; })()`);
  check('and the refusal lifts the moment the student is back: the same tap archives the class, with the error line cleared',
    backOn30.openClass === passClass && lifted30.open === 0
      && lifted30.archived === true && lifted30.restorable
      && lifted30.shown === false && lifted30.text === '',
    'open passes left = ' + lifted30.open + ', archived = ' + lifted30.archived
      + ', restorable = ' + lifted30.restorable + ', the error line reads '
      + JSON.stringify(lifted30.text) + ' (shown = ' + lifted30.shown + ')');

  await clickSel('#classArchivedList [data-class-restore="' + passClass + '"]');
  await evalJs("window.planbook.closeModal('classesModal');1");
  const handedOn30 = await openCard(passClass);
  check('and the walk hands the class back on the bar with nothing added to the pass log — a cancel writes no trip, and this section still owns the registry',
    handedOn30.openPasses.length === 0
      && handedOn30.passLogJson === issued30.passLogJson
      && handedOn30.openClass === passClass && handedOn30.viewShown,
    'open passes = ' + handedOn30.openPasses.length + ', the log is byte-identical to the one this '
      + 'walk was handed = ' + (handedOn30.passLogJson === issued30.passLogJson)
      + ', open class = ' + JSON.stringify(handedOn30.openClass)
      + ' with the registry up = ' + handedOn30.viewShown);

  /* Two back out, which is the state the section is required to hand on — see below. */
  await clickSel('[data-pass-issue="' + outB + '"][data-pass-type="bathroom"]');
  await clickSel('[data-pass-issue="' + outC + '"][data-pass-type="nurse"]');

  /* Handed back the way the section before this one left it: the overflow sweep at the bottom
     measures the term nav of whatever class is open, and this section has been walking across
     five of them.

     TWO PASSES ARE LEFT OPEN ON PURPOSE. The coarse sweep below opens the class with the biggest
     roster — this one — and measures every control on it, so leaving one row showing a Return
     button and the rest showing three issue buttons is what puts both shapes of this column under
     the 44px measurement. A run that tidied them away would measure the empty case only.

     SINCE WO-2.11 IT PUTS THE BANNER UNDER IT TOO, which is where that work order's 44px obligation
     is actually measured: two open passes mean two cards on screen, and the sweep below reads every
     button and input inside `#classView` — the card's Return, its Cancel and its note field among
     them. That is the reason this hand-off is worth two lines of comment rather than one. */
  /*
    ────────────── WO-2.3: days off & pre-drops, read by the registry and never copied into it ──────

    Five acceptance lines, and four of them are about what is NOT in the document — so every check
    below carries `attJson`, `doc.attendance` serialised byte for byte, beside whatever it is
    asserting. A build that copied the event onto records would pass every visible claim here: the
    columns would go grey, the cards would say "No school", and the only thing that would give it
    away is the array this section keeps comparing to itself.

    THE EVENTS ARE AUTHORED THROUGH THE REAL FORM, on the real panel, opened from both of its doors —
    the home screen's own button and the 📅 that appears in a covered column's head. The seam is
    used to READ, as everywhere else in this section: what stateOf() says about a class on a date,
    and what src/calendar.js says covers it. A second copy of the covering rule in this file could
    agree with itself perfectly and disagree with the app, which is the failure the one-function
    design exists to prevent.

    THE FIXTURE IS A WINDOW OF PAST WEEKDAYS THIS RUN HAS NOT TOUCHED, and the first check asserts
    that it has not — an empty range is the precondition for "every class shows as not-meeting", and
    an assertion made over dates that already held records would be measuring the history rule
    instead and passing for the wrong reason.

    THE RANGE IS FIVE OF THAT WINDOW'S SIX WEEKDAYS, AND THE SIXTH IS DROPPED BY HAND FIRST. Two
    reasons, both of them about a check that could otherwise pass for the wrong reason. A range that
    covered the whole window would go green against a build whose covering test ignored the dates
    entirely, so the day just outside it is what proves a range is a range. And the sixth column is
    DROPPED rather than left empty because a covered day and a dropped day are the two quiet greys
    in this palette — the pair a refactor collapses into one by accident — and the only way to
    measure that they are still two is to have one of each on screen at the same time.
  */
  const offWeek = nodeColumns(6, 1);            /* the six weekdays before this week's six */
  const offEdge = offWeek[offWeek.length - 1];  /* nodeColumns is most-recent-first: the oldest */
  const offRange = offWeek.slice(0, offWeek.length - 1);
  const offFrom = offRange[offRange.length - 1];
  const offTo = offRange[0];
  /* A future date for the pre-drop, because "a FUTURE dropped event" is the acceptance line's own
     word. It is asked of the PREDICATE here rather than of the screen — which was once because the
     registry had no column after today, and since 2026-08-08 is because stateOf() is the thing this
     acceptance line is about. The screen's own answer about a future day is measured in the punch
     list at the end of this section. */
  const preDropDay = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    const p = (x) => (x < 10 ? '0' : '') + x;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  })();

  /* stateOf() for every active class over a list of dates, in one round trip. Asked of the app's
     own predicate — the point of the whole work order is that there is exactly one of them. */
  const statesOver = (dates) => evalJs('(async function(){ await window.planbook.store.flush();'
    + ' var a = window.planbook.attendance, doc = window.planbook.store.getDoc();'
    + ' var ids = doc.classes.filter(function(c){ return !c.archived; }).map(function(c){ return c.id; });'
    + ' var out = {};'
    + ' ' + JSON.stringify(dates) + '.forEach(function(d){'
    + '   out[d] = ids.map(function(id){ return a.stateOf(id, d); }); });'
    + ' return { ids: ids, states: out }; })()');

  /* The form, filled and submitted the way a teacher fills and submits it. The two date fields are
     set by value rather than typed: `Input.dispatchKeyEvent` into a native date picker types into
     whichever segment happens to be focused, and what this section is testing is not the picker. */
  const fillDayOff = async (kind, title, from, to, classIds) => {
    if (kind === 'dropped') await clickSel('#daysOffModal [data-dayoff-kind="dropped"]');
    else await clickSel('#daysOffModal [data-dayoff-kind="no-school"]');
    /* Everything already chosen is tapped OFF first. The panel keeps its selection between opens —
       a teacher entering three drops for the same two classes should not re-pick them each time —
       so a fill that only tapped what it wanted would toggle a leftover choice back off and quietly
       author a different event than the one this check is about. */
    const active = await evalJs('Array.prototype.slice.call('
      + 'document.querySelectorAll("#daysOffClassPicker .toggle-btn.active"))'
      + '.map(function(b){ return b.getAttribute("data-dayoff-class"); })');
    for (const id of active) await clickSel('#daysOffClassPicker [data-dayoff-class="' + id + '"]');
    for (const id of (classIds || [])) {
      await clickSel('#daysOffClassPicker [data-dayoff-class="' + id + '"]');
    }
    await evalJs('(function(){ document.getElementById("daysOffTitle").value = '
      + JSON.stringify(title) + ';'
      + ' document.getElementById("daysOffFrom").value = ' + JSON.stringify(from) + ';'
      + ' document.getElementById("daysOffTo").value = ' + JSON.stringify(to || '') + ';'
      + ' return 1; })()');
    await clickSel('#daysOffModal [data-dayoff-create] button[type="submit"]');
  };
  /* What the panel is showing: which overlays are up, and every row on the calendar list. */
  const dayOffPanel = () => evalJs(`(function(){
    var rows = Array.prototype.slice.call(document.querySelectorAll('#daysOffList .roster-row'));
    return {
      open: !document.getElementById('daysOffModal').classList.contains('hidden'),
      confirm: !document.getElementById('daysOffConfirmModal').classList.contains('hidden'),
      confirmLead: (document.getElementById('daysOffConfirmLead') || {}).textContent || '',
      confirmFacts: Array.prototype.slice.call(
        document.querySelectorAll('#daysOffConfirmFacts .dayoff-keeps-line'))
        .map(function(e){ return (e.textContent || '').trim(); }),
      error: (function(){ var e = document.getElementById('daysOffError');
        return e && !e.classList.contains('hidden') ? (e.textContent || '').trim() : ''; })(),
      pickerShown: !document.getElementById('daysOffClasses').classList.contains('hidden'),
      rows: rows.map(function(r){
        var rm = r.querySelector('[data-dayoff-remove]');
        return { badge: ((r.querySelector('.dayoff-kind') || {}).textContent || '').trim(),
                 name: ((r.querySelector('.roster-row-name') || {}).textContent || '').trim(),
                 scope: ((r.querySelector('.roster-row-note') || {}).textContent || '').trim(),
                 id: rm ? rm.getAttribute('data-dayoff-remove') : '' }; })
    }; })()`);

  /* The neighbour column, dropped through the controls a teacher uses: unlock the past day, tap
     "Didn't meet" in the action row it retargets, lock it again. This is the ONLY write this
     sub-section makes to `attendance`, it is made before the baseline is taken, and everything
     after it is measured against a document that already holds it. */
  await closeAll();
  await openCard(marking);
  await clickSel('[data-attendance-page="earlier"]');
  await clickSel('[data-attendance-edit="' + offEdge + '"]');
  await clickSel('#attendanceActions [data-attendance-drop]');
  await clickSel('[data-attendance-lock]');
  await goHome();

  const beforeEvents = await read();
  const emptyRange = beforeEvents.records.filter((r) => r.date >= offFrom && r.date <= offTo);
  const edgeRecord = beforeEvents.records.filter((r) => r.date === offEdge
    && r.classId === marking)[0] || null;
  check('WO-2.3 fixture: the week this section is about to close holds no attendance, and the day just outside the range is dropped so the two greys can be told apart',
    emptyRange.length === 0 && beforeEvents.events.length === 0
      && !!edgeRecord && edgeRecord.exception === 'dropped',
    offFrom + ' .. ' + offTo + ' holds ' + emptyRange.length + ' record(s); '
      + offEdge + ' holds ' + JSON.stringify(edgeRecord)
      + '; the document holds ' + beforeEvents.events.length + ' event(s) and '
      + beforeEvents.records.length + ' attendance record(s) in total');

  /* ── acceptance line 1: a no-school range across a week closes every class on every date in it ── */

  /* Through the calendar's own panel header since WO-6.6, which is where this door lives now —
     openCalendarPanel() walks the two steps and says why up at its definition. */
  await openCalendarPanel('[data-dayoff-panel]');
  const panelOpen = await dayOffPanel();
  /* The panel has just been opened from the calendar and its two dates are still empty, which is
     the first point in this run where `#daysOffFrom` and `#daysOffTo` are on screen to be read at
     all (WO-2.24). Read before the form is filled, so nothing below could be what makes it pass. */
  const dayOffReset = await dateResetOn('#daysOffModal .term-date', 2,
    "!document.getElementById('daysOffModal').classList.contains('hidden')",
    'the days-off panel is open');
  check('the days-off form\'s From and To carry the shared date reset as a live computed style, so a tidy-up of the one input[type="date"] rule in src/shell.css goes red here rather than nowhere — a claim about the cascade only, never about how tall or wide these two fields come out, which is a question this browser answers differently from the one on the teacher\'s desk',
    dayOffReset.ok, dayOffReset.detail);
  await fillDayOff('no-school', 'Winter break', offFrom, offTo, []);
  const afterRange = await read();
  const rangeStates = await statesOver(offWeek);
  const madeEvent = afterRange.events[0] || {};
  check('a no-school range authored across a week shows every class as not-meeting on every date in it — one event, not thirty',
    panelOpen.open === true && panelOpen.pickerShown === false
      && afterRange.events.length === 1
      && madeEvent.kind === 'no-school' && madeEvent.title === 'Winter break'
      && madeEvent.date === offFrom && madeEvent.endDate === offTo && madeEvent.classIds === ''
      /* NINE SINCE WO-6.1, sorted, and the count is the assertion rather than a detail of it: the
         claim is that BOTH authoring surfaces write the same record, so a day off typed on this
         panel carries `seriesId` it will never use — exactly as it has always carried `studentId`
         and `notes`. It read eight here until that work order added the series label; a build where
         only src/events.js wrote the full record would go red on this line, which is the point of
         asserting the shape from the OTHER screen. */
      && madeEvent.keys === 'classIds,date,endDate,id,kind,notes,seriesId,studentId,title'
      && offRange.every((d) => rangeStates.states[d].length === 6
        && rangeStates.states[d].every((s) => s === 'covered'))
      /* And the weekday one day outside the range is untouched by it: five classes still not taken
         there, and the sixth still holding the drop this section made. A covering test that ignored
         its own dates would go green on the clause above and red on this one. */
      && rangeStates.states[offEdge].filter((s) => s === 'not-taken').length === 5
      && rangeStates.states[offEdge].filter((s) => s === 'dropped').length === 1,
    'one event ' + JSON.stringify(madeEvent) + ' covering '
      + offRange.length + ' weekday(s) × ' + rangeStates.ids.length + ' class(es); states = '
      + JSON.stringify(rangeStates.states));

  /* ── acceptance line 5, first of four askings: authoring wrote nothing into `attendance` ── */

  check('authoring that range created no attendance record — the array is byte-identical to what it was',
    afterRange.attJson === beforeEvents.attJson
      && afterRange.records.length === beforeEvents.records.length,
    'the attendance array is ' + (afterRange.attJson === beforeEvents.attJson ? 'byte-identical'
      : 'DIFFERENT') + ' across the write; ' + beforeEvents.records.length + ' record(s) before, '
      + afterRange.records.length + ' after, and ' + afterRange.events.length + ' event(s) now');

  /* ── and the registry says so, in the column head and in the cells under it ── */

  await closeAll();
  await openCard(marking);
  await clickSel('[data-attendance-page="earlier"]');
  const coveredCols = await read();
  await park();
  const coveredLook = await evalJs('window.__colLook(' + JSON.stringify(offTo) + ')');
  const dropLook = await evalJs('window.__colLook(' + JSON.stringify(offEdge) + ')');
  const inRange = coveredCols.columns.filter((c) => c.date !== offEdge);
  const outside = coveredCols.columns.filter((c) => c.date === offEdge)[0] || {};
  check('the covered week draws as not-meeting on the grid: the fourth word in every column head, and a dash in every cell under it',
    coveredCols.columns.length === 6 && inRange.length === 5
      && inRange.every((c) => c.chip === 'No school')
      && inRange.every((c) => / attendance-col-covered\b/.test(c.cls))
      /* The one control on a covered head is the door to the screen the reason was authored on —
         not an undo, because removing a holiday is not one class's decision to take. */
      && inRange.every((c) => c.btnText === '📅' && c.btn === '')
      /* And the day outside the range still says the OTHER quiet word, with its own control. */
      && outside.chip === 'Didn’t meet' && outside.btnText === '✏️'
      && coveredCols.rows.length > 0
      /* Every glyph in every row is the dash, on all six columns: five covered and one dropped, no
         letter and no question mark anywhere. Tested by exclusion rather than against a literal —
         the en dash is one paste away from being an em dash in this file and not in the app. */
      && coveredCols.rows.every((r) => r.codes.length === 6
        && r.codes.split('').every((g) => g !== '?' && !/[A-Za-z]/.test(g))),
    'chips ' + JSON.stringify(coveredCols.columns.map((c) => c.chip))
      + ', head buttons ' + JSON.stringify(coveredCols.columns.map((c) => c.btnText))
      + ', first row reads ' + JSON.stringify((coveredCols.rows[0] || {}).codes));

  /* And it is a DIFFERENT picture from a dropped column, which is the whole reason the state is a
     fourth rather than a re-use of the third. Measured rather than declared, on two columns side by
     side on one screen: the two are quiet greys and what separates them is a word, a fill and a
     border-style — exactly the kind of distinction a refactor collapses by accident and a
     stylesheet review calls identical. */
  check('a covered column and a dropped column, side by side, are drawn as two different things rather than one grey',
    !!coveredLook && !!dropLook
      && coveredLook.chip === 'No school' && dropLook.chip === 'Didn’t meet'
      && coveredLook.cellStyle === 'solid' && dropLook.cellStyle === 'dashed'
      && coveredLook.glyph === dropLook.glyph
      && coveredLook.cellBg !== dropLook.cellBg
      && coveredLook.headBg !== dropLook.headBg,
    'covered = ' + JSON.stringify(coveredLook) + '; dropped = ' + JSON.stringify(dropLook));

  /* ── acceptance line 2: delete the event and every one of those days is back to "not taken yet" ── */

  await clickSel('#attendanceHead [data-dayoff-panel]');
  const listed = await dayOffPanel();
  await clickSel('#daysOffList [data-dayoff-remove="' + madeEvent.id + '"]');
  const afterDelete = await read();
  const restored = await statesOver(offWeek);
  check('deleting that event puts all five days back to "not taken yet" — and not one attendance record was touched on the way in or out',
    listed.open === true && listed.rows.length === 1
      && listed.rows[0].badge === 'No school' && listed.rows[0].scope === 'Every class'
      && afterDelete.events.length === 0
      && offRange.every((d) => restored.states[d].every((s) => s === 'not-taken'))
      /* The dropped day is untouched by the deletion too: it was never the event's to restore, and
         a build that had copied the holiday onto records would most likely have overwritten it. */
      && restored.states[offEdge].filter((s) => s === 'dropped').length === 1
      && afterDelete.attJson === beforeEvents.attJson,
    'the panel listed ' + JSON.stringify(listed.rows) + '; after the Remove the document holds '
      + afterDelete.events.length + ' event(s), the states are ' + JSON.stringify(restored.states)
      + ', and the attendance array is '
      + (afterDelete.attJson === beforeEvents.attJson ? 'byte-identical' : 'DIFFERENT'));

  /* ── acceptance line 3: a future pre-drop naming two classes touches only those two ── */

  const twoClasses = [ids[1], ids[3]];
  await fillDayOff('dropped', 'Fall assembly', preDropDay, '', twoClasses);
  const afterDrop = await read();
  const dropStates = await statesOver([preDropDay]);
  const dropEvent = afterDrop.events[0] || {};
  const covered = dropStates.states[preDropDay]
    .map((s, i) => (s === 'covered' ? dropStates.ids[i] : null)).filter(Boolean);
  check('a future dropped event naming two classes affects only those two — and the other four are untouched',
    afterDrop.events.length === 1 && dropEvent.kind === 'dropped'
      && dropEvent.date === preDropDay && dropEvent.endDate === preDropDay
      && dropEvent.classIds === twoClasses.join(',')
      && covered.join(',') === twoClasses.join(',')
      && dropStates.states[preDropDay].filter((s) => s === 'not-taken').length === 4
      /* Authoring on a FUTURE date is the point of this work order, and it must not have gone
         anywhere near the gate that refuses attendance writes after today. */
      && afterDrop.attJson === beforeEvents.attJson,
    'the event is ' + JSON.stringify(dropEvent) + ' on ' + preDropDay + ' (today is ' + nodeToday
      + '); states across ' + dropStates.ids.length + ' class(es) = '
      + JSON.stringify(dropStates.states[preDropDay]) + ', covered = ' + JSON.stringify(covered)
      + '; attendance byte-identical = ' + (afterDrop.attJson === beforeEvents.attJson));

  /* And the form refuses a drop that names nobody, rather than writing a school-wide one under the
     wrong kind — a `dropped` with empty classIds is school-wide by the data model, which is the
     silent wrong thing this refusal exists to stop. */
  await fillDayOff('dropped', 'Nobody named', preDropDay, '', []);
  const refused = await dayOffPanel();
  const afterRefusal = await read();
  check('a planned drop that names no class is refused rather than written as a school-wide one',
    refused.error !== '' && /which classes/i.test(refused.error)
      && afterRefusal.events.length === 1
      && afterRefusal.attJson === beforeEvents.attJson,
    'the panel said ' + JSON.stringify(refused.error) + ' and the document still holds '
      + afterRefusal.events.length + ' event(s)');

  /* ── acceptance line 4: a retroactive snow day over a day that was really taught ── */

  const taughtToday = beforeEvents.today.filter((r) => !r.exception).map((r) => r.classId);
  /* A class that dropped today from its OWN record, which is precedence line two rather than line
     three: it did not meet, and the reason is the ledger's rather than the calendar's, so laying a
     snow day over it must leave it reading "dropped" and not "covered". Counted here so the check
     below is arithmetic over three groups rather than two. */
  const droppedToday = beforeEvents.today.filter((r) => r.exception).map((r) => r.classId);
  await fillDayOff('no-school', 'Snow day', nodeToday, '', []);
  const warned = await dayOffPanel();
  const duringWarning = await read();
  check('a retroactive snow day over a day that already has recorded attendance WARNS, and has written nothing yet',
    warned.confirm === true
      && warned.confirmFacts.length === taughtToday.length && taughtToday.length > 0
      && /stay/i.test(warned.confirmLead)
      && duringWarning.events.length === 1
      && duringWarning.attJson === beforeEvents.attJson,
    'the confirm named ' + warned.confirmFacts.length + ' period(s) '
      + JSON.stringify(warned.confirmFacts) + ' against ' + taughtToday.length
      + ' recorded today; lead = ' + JSON.stringify(warned.confirmLead.slice(0, 120))
      + '; events in the document while the warning is up = ' + duringWarning.events.length);

  /* Cancel first, because "warns" is only half of it: a warning the teacher backs out of has to
     leave the document exactly as it was, event and all. */
  await clickSel('#daysOffConfirmModal [data-dayoff-cancel]');
  const backedOut = await read();
  check('backing out of that warning writes nothing at all — no event, no record',
    backedOut.events.length === 1 && backedOut.events[0].title === 'Fall assembly'
      && backedOut.attJson === beforeEvents.attJson,
    'the document holds ' + backedOut.events.length + ' event(s) '
      + JSON.stringify(backedOut.events.map((e) => e.title)) + ' and the attendance array is '
      + (backedOut.attJson === beforeEvents.attJson ? 'byte-identical' : 'DIFFERENT'));

  /* And now through it, which is the acceptance line proper: the marks are still there afterward. */
  await fillDayOff('no-school', 'Snow day', nodeToday, '', []);
  await clickSel('#daysOffConfirmModal [data-dayoff-confirm]');
  const snowed = await read();
  const snowStates = await statesOver([nodeToday]);
  const stillTaken = snowStates.states[nodeToday]
    .map((s, i) => (s === 'taken' ? snowStates.ids[i] : null)).filter(Boolean);
  check('adding the snow day anyway does NOT void the record: every period that was taught is still taken, and every mark is still on it',
    snowed.events.length === 2
      && snowed.attJson === beforeEvents.attJson
      && stillTaken.slice().sort().join(',') === taughtToday.slice().sort().join(',')
      /* The three groups, and the arithmetic over them is the precedence rule in full. A class with
         a record and no exception stays TAKEN; a class that dropped today from its own record stays
         DROPPED, because the ledger answers before the calendar does; and only the classes with
         nothing recorded at all are the ones the snow day closes. That last count is what makes the
         clause above non-vacuous — without it, a build that ignored the event entirely would pass. */
      && snowStates.states[nodeToday].filter((s) => s === 'dropped').length === droppedToday.length
      && snowStates.states[nodeToday].filter((s) => s === 'covered').length
        === snowStates.ids.length - taughtToday.length - droppedToday.length
      && snowStates.ids.length - taughtToday.length - droppedToday.length > 0,
    'today reads ' + JSON.stringify(snowStates.states[nodeToday]) + ' across '
      + snowStates.ids.length + ' class(es): ' + stillTaken.length + ' still taken ('
      + JSON.stringify(taughtToday) + '), ' + droppedToday.length
      + ' dropped from their own record, and the attendance array is '
      + (snowed.attJson === beforeEvents.attJson ? 'byte-identical' : 'DIFFERENT'));

  /* ── acceptance line 5, asked of the whole run rather than of one write ── */

  await clickSel('#daysOffList [data-dayoff-remove="' + snowed.events[1].id + '"]');
  await clickSel('#daysOffList [data-dayoff-remove="' + dropEvent.id + '"]');
  const cleared = await read();
  const clearedStates = await statesOver([nodeToday, preDropDay].concat(offWeek));
  check('across every event this section authored, confirmed, cancelled and removed, not one attendance record was created, changed or destroyed',
    cleared.events.length === 0
      && cleared.attJson === beforeEvents.attJson
      && cleared.records.length === beforeEvents.records.length
      /* And the whole document is back where it started — the days the events covered answer with
         their own records again, or with "not taken yet" where there never was one. */
      && offRange.every((d) => clearedStates.states[d].every((s) => s === 'not-taken'))
      && clearedStates.states[preDropDay].every((s) => s === 'not-taken')
      && clearedStates.states[nodeToday]
        .map((s, i) => (s === 'taken' ? clearedStates.ids[i] : null)).filter(Boolean)
        .slice().sort().join(',') === taughtToday.slice().sort().join(','),
    beforeEvents.records.length + ' record(s) before and ' + cleared.records.length
      + ' after, byte-identical = ' + (cleared.attJson === beforeEvents.attJson)
      + '; ' + cleared.events.length + ' event(s) left; today reads '
      + JSON.stringify(clearedStates.states[nodeToday]));

  /*
    ────────── THE 2026-08-08 PUNCH LIST: what the first iPad sitting sent back ──────────

    WO-2.3 passed its five acceptance lines above and then met a classroom, which found five things
    none of them covered. Three are measured here; the other two are a stylesheet rule and a focus
    call, measured where they live (the coarse block below, and the form check in this one).

    The largest is the one this sub-section is mostly about. Days off could be SET ahead and not
    LOOKED at ahead — the window ended at today — so a teacher who entered Thanksgiving in September
    had no way to go and see that she had entered it right. The registry now pages forward as far as
    the calendar reaches, and the three claims worth holding are that it goes far enough, that it
    stops somewhere honest, and that going there still writes nothing. The third is the one that
    would be easy to lose: opening up the columns is a rendering change, and the whole reason it was
    safe to make is that the refusal to write tomorrow lives in the writer.
  */

  const aheadDay = nodeWeekdayAhead(4);

  /* One page-side read of the grid AND the pager AND the action row, for the reason every other
     reader in this file is one round trip: three reads taken a paint apart can disagree with each
     other and the check cannot tell which one was wrong. */
  const gridAhead = () => evalJs(`(function(){
    function colOf(th){
      var date = th.getAttribute('data-attendance-col');
      var btn = th.querySelector('button');
      var td = document.querySelector('#attendanceBody td[data-attendance-col="' + date + '"]');
      var cell = td ? td.firstElementChild : null;
      return { date: date,
               chip: ((th.querySelector('.attendance-day-state') || {}).textContent || '').trim(),
               future: th.className.indexOf('attendance-col-future') >= 0,
               covered: th.className.indexOf('attendance-col-covered') >= 0,
               btn: btn ? (btn.hasAttribute('data-dayoff-panel') ? 'dayoff'
                 : btn.hasAttribute('data-attendance-edit') ? 'edit' : 'other') : 'none',
               cellTag: cell ? cell.tagName : '',
               cellFuture: cell ? cell.className.indexOf('attendance-cell-future') >= 0 : false,
               cellGlyph: cell ? (cell.textContent || '').trim() : '' };
    }
    var later = Array.prototype.slice.call(document.querySelectorAll('#attendancePager button'))
      .filter(function(b){ return b.getAttribute('data-attendance-page') === 'later'; })[0];
    return {
      columns: Array.prototype.slice.call(
        document.querySelectorAll('#attendanceHead th[data-attendance-col]')).map(colOf),
      later: later ? { disabled: !!later.disabled, title: later.title || '' } : null,
      doors: document.querySelectorAll('#attendanceActions [data-dayoff-panel]').length,
      actions: Array.prototype.slice.call(
        document.querySelectorAll('#attendanceActions button'))
        .map(function(b){ return (b.textContent || '').trim(); })
    }; })()`);

  await closeAll();
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + marking + '"]');
  await clickSel('[data-attendance-page="today"]');

  /*
    ── AND THE DOOR IS NOT IN THIS ROW ANY MORE, ON A DAY WITH NOTHING SPECIAL ABOUT IT ──

    THIS CHECK IS INVERTED AND NOT DELETED (WO-6.6, 2026-08-19). It asserted the opposite from
    2026-08-08 until that day: `doors === 1`, "Days off" last in the row, on every state this row
    draws — the owner's own call after the first iPad sitting, and the reason it was made is written
    up in src/attendance.js where the function used to be. The same owner moved the calendar's own
    controls onto the calendar, which is one of this class's screens now and one tap away on the
    switcher above the grid, so a permanent fourth button held at arm's length inside a row whose
    whole design is a three-control limit stopped paying for itself.

    An ABSENCE is the claim, so the controls that WRITE are asserted beside it — a row that drew
    nothing at all would satisfy "no days-off door" and be a screen a teacher cannot mark a class on.
    The other half of the ruling, the 📅 in a COVERED column's head, is asserted by the forward-paging
    check below (`aheadCol.btn === 'dayoff'`), which is where a covered column exists to be read.
  */
  const doorOnPlainDay = await gridAhead();
  check('the attendance action row carries NO days-off door on an ordinary day — the permanent 📅 '
    + 'came off every state of this row when the calendar became one of the class’s own screens — '
    + 'while the controls that write on this day are all still in it',
    doorOnPlainDay.doors === 0
      && doorOnPlainDay.actions.filter((t) => t.indexOf('Days off') >= 0).length === 0
      /* "Didn’t meet" is drawn on every state this row writes on, whatever else is beside it, so it
         is the one label that says "the controls that write are still here" without this check
         having to know which of the five states today is in. */
      && doorOnPlainDay.actions.filter((t) => t.indexOf('meet') >= 0).length === 1
      && doorOnPlainDay.actions.length >= 1,
    'the action row reads ' + JSON.stringify(doorOnPlainDay.actions) + ' with '
      + doorOnPlainDay.doors + ' days-off door(s) in it');

  /* ── the form empties itself, and does not summon the keyboard over the list it just changed ── */

  const beforeAhead = await read();
  await goHome();
  await openCalendarPanel('[data-dayoff-panel]');
  await fillDayOff('no-school', 'Teacher institute day', aheadDay, '', []);
  const formAfterAdd = await evalJs(`(function(){
    var a = document.activeElement;
    return { from: document.getElementById('daysOffFrom').value,
             to: document.getElementById('daysOffTo').value,
             title: document.getElementById('daysOffTitle').value,
             focusId: a ? (a.id || '') : '',
             focusTag: a ? a.tagName : '',
             focusType: a ? (a.getAttribute('type') || '') : '',
             rows: document.querySelectorAll('#daysOffList .roster-row').length }; })()`);
  check('after an add the whole form is empty and focus is on a button, not back in a text field where the keyboard would cover the list',
    formAfterAdd.from === '' && formAfterAdd.to === '' && formAfterAdd.title === ''
      && formAfterAdd.focusId !== 'daysOffTitle'
      && formAfterAdd.focusTag === 'BUTTON'
      && formAfterAdd.rows >= 1,
    'the form reads ' + JSON.stringify([formAfterAdd.title, formAfterAdd.from, formAfterAdd.to])
      + ', focus is on ' + formAfterAdd.focusTag + '#' + formAfterAdd.focusId
      + ', and the list below it shows ' + formAfterAdd.rows + ' row(s)');

  /* And the other half of the same complaint: a range is two fields, and the second one is almost
     always the first one. Dispatched as a real `change`, because that is the event a native date
     picker fires and the hook is deliberately not on `input` (src/days-off.js says why). */
  const carried = await evalJs(`(function(){
    var from = document.getElementById('daysOffFrom');
    var to = document.getElementById('daysOffTo');
    from.value = ${JSON.stringify(aheadDay)};
    from.dispatchEvent(new Event('change', { bubbles: true }));
    var filled = to.value;
    to.value = ${JSON.stringify(nodeWeekdayAhead(6))};
    from.value = ${JSON.stringify(aheadDay)};
    from.dispatchEvent(new Event('change', { bubbles: true }));
    return { filled: filled, kept: to.value }; })()`);
  check('picking a start date carries the end date with it, and never overwrites an end date the teacher set herself',
    carried.filled === aheadDay && carried.kept === nodeWeekdayAhead(6),
    'an empty To became ' + JSON.stringify(carried.filled) + ' (start was ' + aheadDay
      + '); a To already set to ' + nodeWeekdayAhead(6) + ' stayed ' + JSON.stringify(carried.kept));

  /* goHome() rather than closeAll(), because the two lines above left the page on the CALENDAR and
     not on the grid (WO-6.6 moved the days-off door there). `#homeGrid` is `.hidden` from the
     calendar, and a card clicked at 0x0 lands the mouse at the top-left corner of the viewport. */
  await goHome();
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + marking + '"]');
  await clickSel('[data-attendance-page="today"]');

  /* ── forward, to the day that is on the calendar ── */

  const atToday = await gridAhead();
  let hops = 0;
  let ahead = atToday;
  while (hops < 8 && !ahead.columns.some((c) => c.date === aheadDay)) {
    if (ahead.later && ahead.later.disabled) break;
    await clickSel('[data-attendance-page="later"]');
    ahead = await gridAhead();
    hops += 1;
  }
  const aheadCol = ahead.columns.filter((c) => c.date === aheadDay)[0] || null;
  /* A future weekday with nothing on it, taken off the same window, so the two future treatments
     are measured against each other rather than one at a time. */
  const plainAhead = ahead.columns.filter((c) => c.future && c.date !== aheadDay)[0] || null;

  check('a day off set for next week can be paged forward to and read on the registry — the reason the columns were opened up at all',
    atToday.later && atToday.later.disabled === false
      && !!aheadCol && aheadCol.covered === true && aheadCol.future === true
      && aheadCol.chip.length > 0 && aheadCol.btn === 'dayoff',
    'Later at today: ' + JSON.stringify(atToday.later) + '; ' + hops + ' tap(s) later the window is '
      + JSON.stringify(ahead.columns.map((c) => c.date)) + ' and ' + aheadDay + ' reads '
      + JSON.stringify(aheadCol));

  check('an ordinary day ahead of today says "Ahead" rather than "Not taken", carries no unlock, and its cells are inert',
    !!plainAhead && plainAhead.chip === 'Ahead' && plainAhead.btn === 'none'
      && plainAhead.cellTag === 'SPAN' && plainAhead.cellFuture === true
      /* Not the `?` an untaken past day wears. That glyph and that amber together are this screen's
         one alarm, and a day that has not happened is not something anybody forgot. */
      && plainAhead.cellGlyph !== '?',
    plainAhead ? JSON.stringify(plainAhead) : 'no plain future column in the window '
      + JSON.stringify(ahead.columns.map((c) => c.date + ' ' + c.chip)));

  /* ── and it stops where the calendar does ── */

  let guard = 0;
  let edge = ahead;
  while (guard < 12 && edge.later && !edge.later.disabled) {
    await clickSel('[data-attendance-page="later"]');
    edge = await gridAhead();
    guard += 1;
  }
  check('paging forward stops at the last thing on the calendar and says so, rather than running on into empty weeks forever',
    !!edge.later && edge.later.disabled === true
      && /as far ahead as the calendar goes/i.test(edge.later.title)
      && edge.columns.some((c) => c.date >= aheadDay),
    'after ' + (hops + guard) + ' forward tap(s) the window is '
      + JSON.stringify(edge.columns.map((c) => c.date)) + ' and Later reads '
      + JSON.stringify(edge.later));

  /*
    ── AND PORTRAIT STILL DOES NOT PAGE, WITH SOMETHING AHEAD ON THE CALENDAR ──

    A regression this section shipped and caught within the hour, worth a check of its own because
    of the shape of it. `Later` was disabled by ONE test — "are you at the forward end" — and that
    test used to mean "are you on today", which portrait always is. Once the forward end could be a
    day off next week, portrait's pinned position stopped being the end, and the button lit up on
    the one screen that refuses to page: live, tappable, and thrown away by pageDays().

    So the fixture matters. The WO-2.12 section already asks this question and CANNOT catch it —
    it runs after every event has been removed, where the old test and the new one agree. This one
    asks it with a day off four weekdays out, which is the only state the two answers differ in.
  */
  await send('Emulation.setDeviceMetricsOverride',
    { width: 834, height: 1112, deviceScaleFactor: 2, mobile: true });
  /* Longer than the app's own settle delay, for the reason the WO-2.12 turns give: its last look
     after a turn is at 400ms, and reading at 300 would be timing the wait rather than the app. */
  await new Promise(r => setTimeout(r, 700));
  const upright = await gridAhead();
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 700));

  check('turning upright with a day off still ahead on the calendar leaves Later disabled — portrait does not page, and the forward end is no longer the same question as "are you on today"',
    upright.columns.length === 1
      && !!upright.later && upright.later.disabled === true
      && /portrait/i.test(upright.later.title),
    'portrait drew ' + JSON.stringify(upright.columns.map((c) => c.date))
      + ' and Later reads ' + JSON.stringify(upright.later));

  /* ── acceptance line 5 again, asked of the surface that did not exist when it was written ── */

  const afterAhead = await read();
  check('reading a week that has not happened yet wrote nothing — the columns opened up, the writer did not',
    afterAhead.attJson === beforeAhead.attJson
      && afterAhead.records.length === beforeAhead.records.length,
    beforeAhead.records.length + ' record(s) before the forward paging and '
      + afterAhead.records.length + ' after, byte-identical = '
      + (afterAhead.attJson === beforeAhead.attJson));

  /* And with the event gone, the forward stop goes back to today — the behaviour of every year that
     has nothing scheduled in it, which is what this screen did before the change. */
  /* Reached from the CALENDAR rather than from the 📅 in the covered column head, and that is a
     consequence of the portrait detour above rather than a preference: turning upright pins the
     position to today, and landscape comes back on the week ending today rather than where the
     screen was before the turn (WO-2.12's documented cost). So the covered column is off screen by
     the time this runs, and the 📅 with it. The calendar's own door is the orientation-independent
     one, and since WO-6.6 it is the only permanent one — the home screen's copy went with the
     ruling that moved the pair onto the screen they author for. */
  await goHome();
  await openCalendarPanel('[data-dayoff-panel]');
  const madeAhead = (await read()).events.filter((e) => e.title === 'Teacher institute day')[0];
  await clickSel('#daysOffList [data-dayoff-remove="' + madeAhead.id + '"]');
  /* goHome() rather than closeAll(): the removal happened over the calendar, so the grid is not
     what is behind the modal that just closed. */
  await goHome();
  await clickSel('#homeGrid .class-card-open[data-class-tab="' + marking + '"]');
  await clickSel('[data-attendance-page="today"]');
  const backAtToday = await gridAhead();
  check('with nothing on the calendar the window ends at today again, and Later goes back to saying tomorrow is not something to record',
    !!backAtToday.later && backAtToday.later.disabled === true
      && /tomorrow/i.test(backAtToday.later.title)
      && backAtToday.columns.every((c) => c.future === false),
    'the window is ' + JSON.stringify(backAtToday.columns.map((c) => c.date))
      + ' and Later reads ' + JSON.stringify(backAtToday.later));

  await send('Emulation.clearDeviceMetricsOverride');
  await closeAll();
  await clickSel('[data-class-tab]', 1);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
}
