/* praise-column.mjs — the praise column, drawn (WO-4.3)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, waitForBoot, load, seam } = h;

/*
 * ───────── the praise column, drawn (WO-4.3) ─────────
 *
 * THE OTHER HALF OF THE SCREEN § "who needs you, drawn" measures, and it is a separate section for
 * the reason that one is separate from the VIEW_PLAN loop: the fixture it needs is nothing like the
 * one above it. A concern list wants a student who is failing and a student who is absent; a praise
 * list ranked BY DELTA wants a class where the highest grade and the biggest climb belong to two
 * different students, which is the only shape that can tell a correct ranking from a sort on the
 * level. So this plants its own class and takes it back off again.
 *
 * THE FIXTURE IS DATED FROM TODAY AND NOT FROM A FIXED MONTH, which is the one place it departs
 * from the section above. That section's June 2026 dates work because every rule it exercises reads
 * a window that ends at `through` and reaches backwards as far as the ledger goes. The TURNAROUND
 * rule cannot: it compares this evaluator's answer today against its answer at `through − 21 days`,
 * so it needs a ledger in which those two windows hold DIFFERENT meetings. A June fixture read in
 * August has the same meetings in both, and the rule would be structurally unable to fire — a green
 * check over a rule nothing had exercised.
 *
 * FIVE STUDENTS, AND FOUR OF THEM EXIST TO MAKE ONE ORDERING CLAIM FALSIFIABLE:
 *
 *   Bea   a B− (80.50%) who came up 16.25 points. The climber, and the row that must lead.
 *   Cy    an A (94.20%) who came up 9.20. Also a real climb, and a smaller one — so the ordering
 *         cannot be satisfied by a build that merely puts "rose" above everything else.
 *   Ada   an A (96.50%), the HIGHEST grade in the class, who improved by a quarter of a point.
 *         Acceptance line 4 in one student: a build that ranked by level puts her first, and this
 *         one has to put her last of five.
 *   Dev   never scored, absent four times a month ago and present ever since. The turnaround, and
 *         the only student here whose answer changes when `through` moves.
 *   Eli   failing, falling and sinking — three concern rules — who has nonetheless handed in every
 *         piece of work. He is on BOTH columns at once, which is WO-4.1's "that is information
 *         rather than a bug" reaching a screen, and he is the reason the praise half is not a list
 *         of the same four high achievers every week.
 */
console.log('\n--- the praise column, drawn (WO-4.3) ---');
if (!seam) {
  skip('the praise column (WO-4.3)', 'window.planbook is not on the page, so nothing here can seed '
    + 'a climb, read what the list ranked, or put the document back');
} else {
  const CLS = 'c_wo43';
  const TERM = 'tm_wo43';
  const ADA = 's_wo43ada', BEA = 's_wo43bea', CY = 's_wo43cy', DEV = 's_wo43dev', ELI = 's_wo43eli';
  /* Surnames nothing else in this repository contains — WO-6.3's technique, and § who needs you's
     reason for borrowing it: "is this student on this list" becomes a search over what was actually
     rendered rather than an inspection of the fields somebody remembered to look at. */
  const ADA_N = 'Wo43Ace', BEA_N = 'Wo43Climber', CY_N = 'Wo43Riser', DEV_N = 'Wo43Turned',
    ELI_N = 'Wo43Sinking';
  const CLASS_NAME = 'WO-4.3 Praise';

  /* Hand-written, every character of them, for § the signal engine's reason: src/signals.js builds
     these out of who.className, fullName(), sayPoints(), formatPercent(), plural() and sayNumber(),
     and nothing here calls any of those. The typographic apostrophe is the one that file uses. */
  const BEA_SAYS = 'In ' + CLASS_NAME + ', Bea ' + BEA_N + '\u2019s grade rose 16.25 points across '
    + 'the last 4 assignments, from 64.25% to 80.50% \u2014 a rise of 8 or more.';
  const DEV_SAYS = 'In ' + CLASS_NAME + ', Dev ' + DEV_N + ' is off the concern list \u2014 '
    + '2 rules were flagging them 21 days ago and none is today.';
  const ELI_SAYS = 'In ' + CLASS_NAME + ', Eli ' + ELI_N + ' has nothing marked missing across the '
    + 'last 8 assignments \u2014 8 or more.';

  const onView43 = async () => await evalJs(
    "(function(){var e=document.querySelector('main > :not(.hidden)');return e?e.id:'';})()");
  async function goHome43() {
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

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* ── the fixture ── */
  const plant43 = await evalJs(`(function(){
    var s = window.planbook.store;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var mode = window.planbook.supports.presentationMode();
    var hadSignals = JSON.stringify(d.signals || {});
    var today = window.planbook.attendance.todayISO();
    var back = function(n){ return window.planbook.calendar.shiftDays(today, -n); };
    /*
      FORTY-FIVE RECORDED MEETINGS, TODAY MINUS 45 THROUGH TODAY MINUS 1, and Dev absent on FOUR of
      them — the 40th, 39th, 38th and 37th days back. Every one of those four numbers is load-bearing
      and they were chosen against the documented defaults rather than picked:

        - As of TODAY MINUS 21 the last twenty meetings run from day 40 back to day 21 back, so all
          four absences are inside the absence window (4 of 4 needed) and the term rate over the 25
          meetings that exist by then is 21/25 = 84%, under the 90% line. TWO concern rules fire.
        - As of TODAY the last twenty meetings run from day 20 back to yesterday and hold NO
          absences, and the term rate over all 45 is 41/45 = 91.11%, over the line. NEITHER fires,
          and nothing else does either, because Dev has no scores at all.

      That gap IS the turnaround, and it is the only thing in this fixture that a build could not
      produce by reading today's document alone. Widening the term or moving one absence closes it.
      (No backticks in this comment: it lives inside a template literal and one would close it.)
    */
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!Array.isArray(doc.attendance)) doc.attendance = [];
      doc.students.push({ id:'${ADA}', first:'Ada', last:'${ADA_N}' });
      doc.students.push({ id:'${BEA}', first:'Bea', last:'${BEA_N}' });
      doc.students.push({ id:'${CY}', first:'Cy', last:'${CY_N}' });
      doc.students.push({ id:'${DEV}', first:'Dev', last:'${DEV_N}' });
      doc.students.push({ id:'${ELI}', first:'Eli', last:'${ELI_N}' });
      doc.classes.push({ id:'${CLS}', name:'${CLASS_NAME}', archived:false,
        roster:['${ADA}','${BEA}','${CY}','${DEV}','${ELI}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-4.3 Term', start:back(50),
          end:window.planbook.calendar.shiftDays(today, 45) }],
        categories:[{ id:'k_wo43', name:'All work', weight:100 }]});
      for (var n = 1; n <= 8; n++) {
        doc.assignments.push({ id:'a_wo43_' + n, classId:'${CLS}', termId:'${TERM}',
          categoryId:'k_wo43', name:'WO-4.3 Task ' + n, points:100,
          assigned:back(40), due:back(30) });
      }
      for (var m = 45; m >= 1; m--) {
        var marks = {};
        if (m === 40 || m === 39 || m === 38 || m === 37) marks['${DEV}'] = { code: 'A' };
        doc.attendance.push({ classId:'${CLS}', date:back(m), marks: marks });
      }
      if (!doc.scores || typeof doc.scores !== 'object') doc.scores = {};
      /*
        THE FOUR SCORE ROWS, AND CY'S THREE BLANKS ARE NOT PADDING. An eight-assignment class of
        equal weight cannot produce an eight-point rise for a student who ends at an A: removing the
        last four leaves the earlier four at 400 points, and the arithmetic caps the rise at seven.
        Cy's first three cells are BLANK, so his counted work is five and the window is four of five
        — the same shape Bea's is not — and the rise is 9.20. A blank is ungraded and affects
        nothing (CLAUDE.md), which is exactly why it can shorten a window without moving a grade.
      */
      var put = function(sid, list){
        for (var i = 0; i < list.length; i++) {
          if (list[i] === null) continue;
          var a = 'a_wo43_' + (i + 1);
          doc.scores[a] = doc.scores[a] || {};
          doc.scores[a][sid] = { v: list[i] };
        }
      };
      put('${ADA}', [96, 96, 97, 96, 97, 96, 97, 97]);
      put('${BEA}', [45, 55, 62, 95, 96, 96, 97, 98]);
      put('${CY}',  [null, null, null, 85, 95, 96, 97, 98]);
      put('${ELI}', [95, 92, 90, 88, 40, 35, 30, 25]);
    });
    var now = s.getDoc();
    return { ok:true, mode:mode, hadSignals:hadSignals,
      meetings:(now.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length,
      assignments:(now.assignments || []).filter(function(a){
        return a.classId === '${CLS}'; }).length }; })()`);
  check('WO-4.3 fixture: one class, five students, eight assignments and FORTY-FIVE recorded '
    + 'meetings dated from today — a B− who climbed 16 points, an A who climbed 9, the highest '
    + 'grade in the class who climbed nothing, a student who came off the concern list this '
    + 'fortnight, and a failing student who has handed in everything',
    !!plant43 && plant43.ok === true && plant43.meetings === 45 && plant43.assignments === 8,
    plant43 && plant43.ok ? plant43.meetings + ' meeting(s) and ' + plant43.assignments
      + ' assignment(s) on the document after the seed' : JSON.stringify(plant43));

  if (!plant43 || !plant43.ok) {
    skip('the whole of WO-4.3’s column', 'the fixture did not install, so nothing below it could '
      + 'be measured against a list that has anything on it');
  } else {
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    if ((await onView43()) !== 'homeView') await goHome43();
    await clickSel('#homeGrid [data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 250));
    await clickSel('#classView [data-class-screen="signals"]');
    await new Promise(r => setTimeout(r, 400));

    /*
      THE DOCUMENT IS PHOTOGRAPHED EITHER SIDE OF THE PASS, and this is the check that stands
      between this work order and the thing it was told not to build. WO-4.3: "derive it from the
      log and prior evaluations rather than storing a 'was flagged' bit that can go stale." The
      turnaround rule runs on every one of the five students here and fires on one of them; if any
      part of that derivation had been cached into the year, these two strings would differ.
      It is a byte comparison of the WHOLE document rather than a look at `signals`, because a bit
      hidden on a student or an attendance row would pass the narrower reading.
    */
    const pure = await evalJs(`(function(){
      var s = window.planbook.store;
      var before = JSON.stringify(s.getDoc());
      var m = window.planbook.signalsView.signalsModel();
      window.planbook.signalsView.renderSignals();
      var after = JSON.stringify(s.getDoc());
      /* And the same claim from the other side: no key ANYWHERE in the document is shaped like a
         remembered flag. A byte comparison catches a write; this catches one that was already
         there when the photograph was taken. */
      var shaped = (after.match(/"[a-zA-Z]*[Ff]lag[a-zA-Z]*"\\s*:/g) || [])
        .concat(after.match(/"wasOn[a-zA-Z]*"\\s*:/g) || [])
        .concat(after.match(/"turnaround[a-zA-Z]*"\\s*:/g) || []);
      return { same: before === after, shaped: shaped,
        praise: m.praise.rows.length, concern: m.concern.rows.length }; })()`);
    check('evaluating the praise list writes NOTHING to the document — the year is byte-identical '
      + 'either side of a pass that runs the turnaround rule on five students and fires it on one, '
      + 'and no key anywhere in it is shaped like a remembered "was flagged" bit (WO-4.3’s own '
      + 'instruction, and the reason newYearDocument() gained nothing for this work order)',
      pure.same === true && pure.shaped.length === 0,
      'document unchanged = ' + pure.same + ', flag-shaped keys = ' + JSON.stringify(pure.shaped)
        + ', ' + pure.praise + ' praise row(s) beside ' + pure.concern + ' concern row(s)');

    /* ── the column itself ── */
    const col = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var head = document.getElementById('signalsPraiseHead');
      var first = document.querySelectorAll('#signalsPraiseList [data-signal-row]')[0];
      var kids = first ? Array.prototype.map.call(first.children, function(n){
        return (n.className || '').split(' ')[0]; }) : [];
      return {
        rows: m.praise.rows.map(function(r){ return { name:r.name, lead:r.lead.ruleId,
          text:(window.planbook.signals.signalFigure(r.lead) || {}).text,
          tags:r.tags.map(function(h){ return h.ruleId; }),
          grade:r.grade, letter:r.letter }; }),
        drawn: document.querySelectorAll('#signalsPraiseList [data-signal-row]').length,
        concernDrawn: document.querySelectorAll('#signalsList [data-signal-row]').length,
        head: (head ? head.textContent : ''),
        note: (head && head.querySelector('.sig-col-note')
          ? head.querySelector('.sig-col-note').textContent : ''),
        firstDelta: (document.querySelector('#signalsPraiseList .sig-delta') || {}).textContent,
        firstKids: kids,
        count: m.praise.count, total: m.praise.total }; })()`);
    const praiseNames = col.rows.map((r) => r.name);
    check('the praise column is drawn beside the concern one — five rows, a head that counts them, '
      + 'and a head note that says BIGGEST CLIMB FIRST in as many words, because a teacher who '
      + 'reads "Praise" as "the top of the class" stops reading it inside a fortnight',
      col.drawn === 5 && col.count === 5 && col.total === 5 && col.concernDrawn === 1
        && /Praise · 5/.test(col.head) && col.note === 'biggest climb first',
      col.drawn + ' praise row(s) beside ' + col.concernDrawn + ' concern row(s); head reads '
        + JSON.stringify(col.head));

    /*
      ACCEPTANCE LINE 1, AND IT IS THE PHASE'S WHOLE ARGUMENT: a B− outranks an A.

      Bea is at 80.50% and came up 16.25 points; Cy is at 94.20% and came up 9.20; Ada is at 96.50%,
      the highest grade in the class, and came up a quarter of a point. A build that ranked by level
      returns exactly this list upside down, and a build that ranked by "did anything move" cannot
      separate Bea from Cy. Both letters are asserted, so the sentence in the work order — "verify
      with a case where a B− student outranks an A student" — is true of what this measured rather
      than of what the numbers were meant to be.
    */
    const bea = col.rows[0] || {};
    const cy = col.rows[1] || {};
    check('the praise list puts the BIGGEST IMPROVEMENT first and not the highest grade: a B− who '
      + 'came up 16.25 points leads an A who came up 9.20, and the A with the highest grade in the '
      + 'class is nowhere near the top (Acceptance line 1)',
      col.rows.length === 5
        && bea.name === 'Bea ' + BEA_N && bea.lead === 'grade-rose' && bea.letter === 'B-'
        && Math.abs(bea.grade - 80.5) < 1e-9 && bea.text === '+16.25'
        && cy.name === 'Cy ' + CY_N && cy.lead === 'grade-rose' && cy.letter === 'A'
        && Math.abs(cy.grade - 94.2) < 1e-9 && cy.text === '+9.20',
      JSON.stringify(col.rows.map((r) => r.name + ' ' + r.letter + ' ' + r.text)));

    /* ACCEPTANCE LINE 4. Ada has a perfect record — every assignment in, every score at or above
       90, every meeting attended — and no improvement, and she is LAST of five. She is not absent
       from the column, which would be a different and wrong answer: a level is worth saying, it is
       just not worth the strong position. */
    check('the student with a perfect record and no improvement does not dominate the list — the '
      + 'highest grade in the class sorts LAST of five, under every student who moved, and is '
      + 'still on the column rather than dropped from it (Acceptance line 4)',
      praiseNames.length === 5 && praiseNames[4] === 'Ada ' + ADA_N
        && praiseNames.indexOf('Ada ' + ADA_N) === 4 && col.rows[4].lead === 'no-missing',
      JSON.stringify(praiseNames));

    /* THE DRAWING'S OTHER RULING, MEASURED ON THE MARKUP: the delta is the only bold figure on a
       praise row and the current grade is not on the row at all. The row's own children are the
       census — avatar, the name-and-sentence block, the delta, the chevron — so a build that added
       a grade in the strong position, or beside it, turns this red rather than being caught by
       somebody reading the stylesheet. */
    check('the number in the strong position on a praise row is the DELTA and the current grade is '
      + 'nowhere on the row: four children, the third of them the delta, reading +16.25 for the '
      + 'climber — a list that ranked by delta and drew the level big would be arguing with itself',
      JSON.stringify(col.firstKids) === JSON.stringify(
        ['avatar', 'sig-row-main', 'sig-delta', 'sig-row-go'])
        && String(col.firstDelta).indexOf('+16.25') === 0,
      JSON.stringify(col.firstKids) + ' :: delta reads ' + JSON.stringify(col.firstDelta));

    /*
      ACCEPTANCE LINE 2 — the turnaround fires for a student who WAS on the concern list and is not
      any more — and the numbers are read off the hit rather than off the sentence.

      Two rules were flagging Dev twenty-one days ago and none is today, which is the fixture's
      whole reason for being dated from today. `cleared` is 2 and `days` is 21; a build that
      sampled the wrong end of the window reports nothing at all, and a build that only asked
      whether he is clear NOW reports a turnaround for all four of the others as well.
    */
    const turn = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var all = [];
      m.praise.rows.forEach(function(r){ r.hits.forEach(function(h){ all.push(h); }); });
      var hit = all.filter(function(h){ return h.ruleId === 'turnaround'; });
      var doc = window.planbook.store.getDoc();
      var cls = (doc.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      var nowHits = window.planbook.signals.evaluate(doc, cls, '${TERM}');
      var concernNames = nowHits.filter(function(h){ return h.direction === 'concern'; })
        .map(function(h){ return h.studentId; });
      return { fired: hit.length, cleared: hit.length ? hit[0].numbers.cleared : -1,
        days: hit.length ? hit[0].numbers.days : -1,
        who: hit.length ? hit[0].studentId : '',
        say: hit.length ? hit[0].explanation : '',
        stillConcerned: concernNames.indexOf('${DEV}') !== -1 }; })()`);
    check('the turnaround fires for exactly one student — the one who was flagged by TWO concern '
      + 'rules twenty-one days ago and by none today — and it fires for nobody else, including the '
      + 'four who were never on the list at all (Acceptance line 2)',
      turn.fired === 1 && turn.who === DEV && turn.cleared === 2 && turn.days === 21
        && turn.stillConcerned === false,
      JSON.stringify(turn));

    /*
      ACCEPTANCE LINE 5 — every praise hit's explanation carries the delta and the window it was
      measured over — swept over every hit on the column rather than asserted on one, then pinned
      by three hand-written sentences.

      WHAT "THE DELTA" MEANS FOR THE THREE RULES THAT HAVE NONE is decided in src/signals.js and
      recorded here rather than glossed: `no-missing`, `attendance-window` and `high-score-run`
      measure a level or a count and have no before-and-after to state. THE DRAWING'S CAPTION IS THE
      PRINCIPLE AND NOT THE COUNT: "four rules have no delta, and they say a count instead" reads
      across BOTH columns and two of its three examples ("5 absences", "61%") are concern-side. It
      settles that a count is a legitimate figure where there is no before-and-after; on the praise
      side the number is THREE of five. What every one of the five
      does carry is the FIGURE IT MEASURED and the WINDOW it measured it over, and that is what the
      sweep asserts: the printed figure appears in the sentence, and so does a window phrase.
    */
    const said = await evalJs(`(function(){
      var m = window.planbook.signalsView.signalsModel();
      var all = [];
      m.praise.rows.forEach(function(r){ r.hits.forEach(function(h){ all.push(h); }); });
      var WINDOW = /across the last \\d+|in a row|the last \\d+ recorded meetings|\\d+ days ago/;
      var bad = all.filter(function(h){
        var fig = window.planbook.signals.signalFigure(h);
        var figureIn = !!fig && h.explanation.indexOf(fig.text.replace(/^\\+/, '')) !== -1;
        return !h.explanation || !WINDOW.test(h.explanation) || !figureIn
          || /\\{\\{|undefined|NaN|\\[object/.test(h.explanation);
      });
      var byRule = {};
      all.forEach(function(h){ byRule[h.ruleId] = (byRule[h.ruleId] || 0) + 1; });
      var find = function(rule, sid){
        return all.filter(function(h){
          return h.ruleId === rule && h.studentId === sid; })[0] || {}; };
      return { total: all.length, bad: bad.map(function(h){ return h.explanation; }),
        rules: Object.keys(byRule).sort().join(','),
        bea: find('grade-rose', '${BEA}').explanation || '',
        dev: find('turnaround', '${DEV}').explanation || '',
        eli: find('no-missing', '${ELI}').explanation || '' }; })()`);
    check('every praise hit on the column names the figure it measured AND the window it measured '
      + 'it over, with no placeholder anywhere — all five rules represented, and the three '
      + 'hand-written sentences match character for character (Acceptance line 5)',
      said.bad.length === 0 && said.total === 14
        && said.rules === 'attendance-window,grade-rose,high-score-run,no-missing,turnaround'
        && said.bea === BEA_SAYS && said.dev === DEV_SAYS && said.eli === ELI_SAYS,
      said.total + ' praise hit(s) over ' + JSON.stringify(said.rules)
        + (said.bad.length ? ' :: bad ' + JSON.stringify(said.bad[0]) : '')
        + ' :: ' + JSON.stringify([said.bea, said.dev, said.eli]));

    /*
      ONE STUDENT ON BOTH COLUMNS AT ONCE, which is WO-4.1's ruling reaching a screen: a student
      whose grade is falling while he hands everything in is exactly who a teacher wants to see
      twice. Eli leads the concern column on a 29-point fall and sits on the praise column for
      having missed nothing — and ONE card carries both, so tapping either row shows the whole
      student rather than the half of him the column he was tapped in was about.
    */
    await clickSel('#signalsPraiseList [data-signal-row]', 3);
    await new Promise(r => setTimeout(r, 300));
    const both = await evalJs(`(function(){
      var open = document.querySelector('.modal-overlay:not(.hidden)');
      if (!open) return { open:false };
      var text = open.textContent || '';
      var m = window.planbook.signalsView.signalsModel();
      var onConcern = m.concern.rows.filter(function(r){
        return r.name.indexOf('${ELI_N}') !== -1; }).length;
      var onPraise = m.praise.rows.filter(function(r){
        return r.name.indexOf('${ELI_N}') !== -1; }).length;
      return { open:true, named: text.indexOf('${ELI_N}') !== -1,
        concernRules: open.querySelectorAll('.sig-card-rule.concern').length,
        praiseRules: open.querySelectorAll('.sig-card-rule.praise').length,
        onConcern: onConcern, onPraise: onPraise,
        placeholder: /\\{\\{|undefined|NaN|\\[object/.test(text) }; })()`);
    check('the failing student who hands everything in is on BOTH columns at once, and the one card '
      + 'behind either row carries all five rules — three concern and two praise — rather than the '
      + 'half of him the column he was tapped in was about',
      both.open === true && both.named === true && both.onConcern === 1 && both.onPraise === 1
        && both.concernRules === 3 && both.praiseRules === 2 && both.placeholder === false,
      JSON.stringify(both));
    await evalJs("(function(){var b=document.querySelector('.modal-overlay:not(.hidden) "
      + "[data-modal-close]'); if(b) b.click(); return 1;})()");
    await new Promise(r => setTimeout(r, 250));

    /* ── the two columns, side by side, at equal width ──
       The work order's Surface deliverable in as many words. Measured rather than read off the
       stylesheet, because `1fr 1fr` inside a container that has picked up a padding on one side is
       still `1fr 1fr` and is no longer equal billing. */
    const wide = await evalJs(`(function(){
      var a = document.getElementById('signalsConcern').getBoundingClientRect();
      var b = document.getElementById('signalsPraise').getBoundingClientRect();
      return { aw: Math.round(a.width), bw: Math.round(b.width),
        aTop: Math.round(a.top), bTop: Math.round(b.top),
        aLeft: Math.round(a.left), bLeft: Math.round(b.left) }; })()`);
    check('concern and praise are side by side at EQUAL width on a laptop — the work order’s own '
      + 'Surface line, and the drawing’s argument rather than its layout: a stacked praise column '
      + 'is a praise column nobody scrolls to',
      Math.abs(wide.aw - wide.bw) <= 1 && wide.aw > 300 && wide.aTop === wide.bTop
        && wide.bLeft > wide.aLeft,
      JSON.stringify(wide));

    /* AND PRAISE IS DRAWN FIRST ON A PHONE, which is the one place the pair is deliberately not
       symmetrical: two columns of names at 390px are two columns of ellipsis, and if only one of
       them can be first it is the one a teacher would otherwise never scroll to. Every control in
       the column takes the full 44px in the same measurement — no control on this screen cites the
       month chip's 28px departure, which is one control's ruling and not a precedent. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await new Promise(r => setTimeout(r, 400));
    const narrow = await evalJs(`(function(){
      var a = document.getElementById('signalsConcern').getBoundingClientRect();
      var b = document.getElementById('signalsPraise').getBoundingClientRect();
      var small = [];
      Array.prototype.forEach.call(
        document.querySelectorAll('#signalsPraise button, #signalsPraise select'), function(n){
          var r = n.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (r.height < 44) small.push({ t:(n.textContent||'').trim().slice(0,20),
            h:Math.round(r.height) });
        });
      var d = document.documentElement;
      return { coarse: matchMedia('(pointer: coarse)').matches,
        praiseTop: Math.round(b.top), concernTop: Math.round(a.top),
        praiseWidth: Math.round(b.width), concernWidth: Math.round(a.width),
        measured: document.querySelectorAll('#signalsPraise button').length, small: small,
        docScroll: d.scrollWidth, docClient: d.clientWidth }; })()`);
    check('below 720px the pair becomes one column with PRAISE DRAWN FIRST, both at full width, '
      + 'every row in it still clearing 44px under a coarse pointer, and no sideways scroll',
      narrow.coarse === true && narrow.praiseTop < narrow.concernTop
        && Math.abs(narrow.praiseWidth - narrow.concernWidth) <= 1
        && narrow.measured >= 5 && narrow.small.length === 0
        && narrow.docScroll <= narrow.docClient + 1,
      JSON.stringify(narrow));
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 300));

    /*
      A RULE CHIP NARROWS THE COLUMN ITS RULE IS IN AND LEAVES THE OTHER WHOLE — this screen's
      answer to a question WO-4.3 did not settle, recorded at src/signals-view.js's columnRows().
      Filtering to "a run of low scores" is a concern errand; emptying the praise half while a
      teacher does it would bury the column this phase exists to protect, for a reason she never
      asked for. Both directions are measured, because a rule that only worked one way round would
      look correct from whichever side was tested.
    */
    const chips = await evalJs(`(function(){
      var v = window.planbook.signalsView;
      var out = {};
      v.setSignalsRule('low-score-run');
      var a = v.signalsModel();
      out.concernOnLowScore = a.concern.rows.length;
      out.praiseOnLowScore = a.praise.rows.length;
      v.setSignalsRule('grade-rose');
      var b = v.signalsModel();
      out.concernOnRose = b.concern.rows.length;
      out.praiseOnRose = b.praise.rows.length;
      out.praiseNamesOnRose = b.praise.rows.map(function(r){ return r.name; });
      v.setSignalsRule('');
      var c = v.signalsModel();
      out.concernBack = c.concern.rows.length;
      out.praiseBack = c.praise.rows.length;
      out.chips = Array.prototype.map.call(
        document.querySelectorAll('#signalsRules [data-signals-rule]'), function(n){
          return n.getAttribute('data-signals-rule'); });
      return out; })()`);
    check('a rule chip narrows the column its rule belongs to and leaves the other one whole — a '
      + 'concern rule takes nothing off the praise list and a praise rule takes nothing off the '
      + 'concern list — and the strip carries chips for both directions with the way back at its '
      + 'head',
      chips.concernOnLowScore === 1 && chips.praiseOnLowScore === 5
        && chips.concernOnRose === 1 && chips.praiseOnRose === 2
        && JSON.stringify(chips.praiseNamesOnRose)
          === JSON.stringify(['Bea ' + BEA_N, 'Cy ' + CY_N])
        && chips.concernBack === 1 && chips.praiseBack === 5
        && chips.chips[0] === '' && chips.chips.indexOf('grade-rose') > 0
        && chips.chips.indexOf('low-score-run') > 0,
      JSON.stringify(chips));

    /* ONE COLUMN EMPTY BESIDE ONE THAT IS NOT gets a quiet line where its rows would have been, and
       NOT the centred empty state — that block is for a whole screen, and half a screen's worth of
       it beside a working list reads as the working list being broken too. Reached by moving three
       thresholds so that the only concern student stops qualifying, then putting them back by
       DELETING the keys: an absent threshold key IS its default (CLAUDE.md). */
    const lopsided = await evalJs(`(function(){
      var s = window.planbook.store, v = window.planbook.signalsView;
      s.update(function(doc){
        if (!doc.signals || typeof doc.signals !== 'object') doc.signals = {};
        doc.signals.gradeBelow = 1;
        doc.signals.gradeFellPoints = 500;
        doc.signals.lowScoreBelow = 1;
      });
      v.renderSignals();
      var m = v.signalsModel();
      var quiet = document.getElementById('signalsConcernEmpty');
      var out = {
        concern: m.concern.rows.length, praise: m.praise.rows.length,
        concernQuiet: !quiet.classList.contains('hidden'),
        praiseQuiet: !document.getElementById('signalsPraiseEmpty').classList.contains('hidden'),
        wholeScreen: !document.getElementById('signalsEmpty').classList.contains('hidden'),
        columnsUp: !document.getElementById('signalsColumns').classList.contains('hidden'),
        praiseDrawn: document.querySelectorAll('#signalsPraiseList [data-signal-row]').length,
        says: (quiet.textContent || '').replace(/\\s+/g, ' ').trim()
      };
      s.update(function(doc){
        delete doc.signals.gradeBelow; delete doc.signals.gradeFellPoints;
        delete doc.signals.lowScoreBelow;
      });
      v.renderSignals();
      var back = v.signalsModel();
      out.backConcern = back.concern.rows.length;
      out.keysLeft = Object.keys(s.getDoc().signals || {}).filter(function(k){
        return k === 'gradeBelow' || k === 'gradeFellPoints' || k === 'lowScoreBelow'; });
      return out; })()`);
    check('a column with nothing in it beside a column that is full draws a quiet line where its '
      + 'rows would have been — not the centred empty state, which would read as the working list '
      + 'beside it being broken too — and the praise column keeps drawing all five rows through it',
      lopsided.concern === 0 && lopsided.praise === 5 && lopsided.praiseDrawn === 5
        && lopsided.concernQuiet === true && lopsided.praiseQuiet === false
        && lopsided.wholeScreen === false && lopsided.columnsUp === true
        && lopsided.backConcern === 1 && lopsided.keysLeft.length === 0,
      JSON.stringify(lopsided));

    /*
      ACCEPTANCE LINE 3, AS FAR AS A DESK CAN TAKE IT, AND THE LIMIT IS STATED RATHER THAN HIDDEN.

      The line asks that running the praise list two weeks apart ON REAL DATA surfaces a materially
      different set of students, and there is no real data until the term starts. What this measures
      is the mechanism: the same document, evaluated twice through the engine's own `through`, a
      fortnight apart. Dev is ON the concern list two weeks ago and off it today, so the turnaround
      fires for nobody then and for him now — and his praise row leads on a different rule in each
      pass. A ranking that could not move would return identical lists here.

      WHAT IT DOES NOT PROVE is the acceptance line itself: a fixture built to move is not evidence
      that a real class moves, and the box stays open until the term has a fortnight in it.
    */
    const fortnight = await evalJs(`(function(){
      var doc = window.planbook.store.getDoc();
      var cls = (doc.classes || []).filter(function(c){ return c.id === '${CLS}'; })[0];
      var back14 = window.planbook.calendar.shiftDays(
        window.planbook.attendance.todayISO(), -14);
      var pair = function(hits, dir){
        return hits.filter(function(h){ return h.direction === dir; })
          .map(function(h){ return h.studentId + '/' + h.ruleId; }).sort(); };
      var now = window.planbook.signals.evaluate(doc, cls, '${TERM}');
      var then = window.planbook.signals.evaluate(doc, cls, '${TERM}', { through: back14 });
      var pNow = pair(now, 'praise'), pThen = pair(then, 'praise');
      var cNow = pair(now, 'concern'), cThen = pair(then, 'concern');
      var gained = pNow.filter(function(x){ return pThen.indexOf(x) === -1; });
      var lost = pThen.filter(function(x){ return pNow.indexOf(x) === -1; });
      return { same: JSON.stringify(pNow) === JSON.stringify(pThen),
        gained: gained, lost: lost,
        concernSame: JSON.stringify(cNow) === JSON.stringify(cThen),
        concernThen: cThen.length, concernNow: cNow.length }; })()`);
    check('the same document evaluated a fortnight apart does NOT return the same praise list — '
      + 'the turnaround that fires today fired for nobody two weeks ago, because two weeks ago the '
      + 'student was still on the concern list (evidence for Acceptance line 3, which wants a real '
      + 'term’s data and does not have one yet)',
      fortnight.same === false
        && fortnight.gained.indexOf(DEV + '/turnaround') !== -1
        && fortnight.concernSame === false
        && fortnight.concernThen > fortnight.concernNow,
      JSON.stringify(fortnight));
  }

  /* ── and the fixture comes back off ── */
  const cleaned43 = await evalJs(`(function(){
    var s = window.planbook.store;
    s.update(function(doc){
      doc.classes = (doc.classes || []).filter(function(c){ return c.id !== '${CLS}'; });
      doc.students = (doc.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo43') !== 0; });
      doc.assignments = (doc.assignments || []).filter(function(a){
        return a.classId !== '${CLS}'; });
      doc.attendance = (doc.attendance || []).filter(function(r){ return r.classId !== '${CLS}'; });
      if (doc.scores) {
        Object.keys(doc.scores).forEach(function(k){
          if (k.indexOf('a_wo43_') === 0) delete doc.scores[k]; });
      }
    });
    var d = s.getDoc();
    return { classes:(d.classes || []).filter(function(c){ return c.id === '${CLS}'; }).length,
      students:(d.students || []).filter(function(p){
        return String(p.id).indexOf('s_wo43') === 0; }).length,
      assignments:(d.assignments || []).filter(function(a){
        return String(a.id).indexOf('a_wo43_') === 0; }).length,
      attendance:(d.attendance || []).filter(function(r){ return r.classId === '${CLS}'; }).length,
      scores: Object.keys(d.scores || {}).filter(function(k){
        return k.indexOf('a_wo43_') === 0; }).length,
      signals: JSON.stringify(d.signals || {}) }; })()`);
  if ((await onView43()) !== 'homeView') await goHome43();
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-4.3 fixture came back off the document — class, five students, eight assignments, '
    + 'forty-five attendance rows and every score bag — the signals block was left exactly as it '
    + 'was found, and the page was left on the grid',
    cleaned43.classes === 0 && cleaned43.students === 0 && cleaned43.assignments === 0
      && cleaned43.attendance === 0 && cleaned43.scores === 0
      && cleaned43.signals === (plant43 ? plant43.hadSignals : '{}')
      && (await onView43()) === 'homeView',
    cleaned43.classes + ' class(es), ' + cleaned43.students + ' student(s), '
      + cleaned43.assignments + ' assignment(s), ' + cleaned43.attendance + ' attendance row(s) and '
      + cleaned43.scores + ' score bag(s) left behind; signals block = ' + cleaned43.signals
      + ' (wanted ' + (plant43 ? plant43.hadSignals : '{}') + '), left on #' + (await onView43()));
}
}
