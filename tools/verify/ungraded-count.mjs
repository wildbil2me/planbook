/* ungraded-count.mjs — the ungraded count on the home screen (WO-3.26)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, send, evalJs, has, clickSel, KILL_ANIM, waitForBoot } = h;

/*
 * ───────────── the ungraded count on the home screen (WO-3.26) ─────────────
 *
 * WHAT ONLY A BROWSER CAN SETTLE HERE. Two things, and neither is the arithmetic. The first is
 * that the chip fits INSIDE the height src/home.css has reserved since WO-1.10 — "no card changes
 * height when the first count appears" is a claim about layout, and the grid stretches its cards to
 * a common height, so comparing two cards to each other would pass whatever the chip's height was.
 * It is measured by taking the chip out of the tree and watching the grid not move. The second is
 * that the count follows a score TYPED THROUGH THE GRID with no reload — which is a claim about
 * src/shell.js's chains and not about src/grade-engine.js.
 *
 * THE FIXTURE IS THE ACCEPTANCE LIST. Seven pieces of work in one term, of which exactly three are
 * ungraded work worth points; the other four are the four ways a column can look empty and not be
 * (excused, a late carrying a score, a teacher-typed 0, and marked missing) plus zero-point bonus
 * work, which is ungraded and is not owed. A count of 3 rather than 7 is the whole of acceptance
 * line 2, and a fixture without those four could not tell this build from one that counted blanks.
 *
 * ONE OF THEM CARRIES A DUE DATE IN 2020, on purpose. The Traps line on this work order is that a
 * count must never be inferred from a date, and a blank six years past due counts exactly as much
 * as a blank with no date on it at all — not more, and not less.
 */
console.log('\n--- the ungraded count on the home screen (WO-3.26) ---');
{
  const CLS = 'c_wo326', CLS2 = 'c_wo326b';
  const TERM = 'tm_wo326', LATER = 'tm_wo326_later';
  const S1 = 'wo326-s1', S2 = 'wo326-s2', S3 = 'wo326-s3';
  const GHOST = 'wo326-nobody';
  /* Names nobody else in this run uses, so "no student is named on the card" is a search rather
     than a judgement. */
  const NAMES = ['Wo326Given', 'Wo326Surname', 'Wo326Second', 'Wo326Third'];
  /* Written out here rather than read off the app — the point of the check is the string. */
  const CHIP = '3 to grade', AFTER = '2 to grade';

  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);

  /* One key at a time, the shape the WO-3.5 block uses: a printable key needs keyDown with `text`
     or the app sees the raw code, and Enter takes the rawKeyDown shape. Local to this block for the
     reason every other section's copy is local — nothing here is a second implementation of
     anything in src/. */
  const sk = async (k, code, vk, text) => {
    const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
      modifiers: 0 };
    if (text) ev.text = text;
    await send('Input.dispatchKeyEvent',
      Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
    await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
    await new Promise(r => setTimeout(r, 45));
  };

  const plant = await evalJs(`(function(){
    var s = window.planbook.store, c = window.planbook.classes;
    var d = s.getDoc();
    if (!d) return { ok:false, why:'no year document is open' };
    var was = c.getSelectedClassId();
    var mode = window.planbook.supports.presentationMode();
    s.update(function(doc){
      if (!Array.isArray(doc.classes)) doc.classes = [];
      if (!Array.isArray(doc.students)) doc.students = [];
      if (!Array.isArray(doc.assignments)) doc.assignments = [];
      if (!doc.scores) doc.scores = {};
      doc.students.push(
        { id:'${S1}', first:'${NAMES[0]}', last:'${NAMES[1]}' },
        { id:'${S2}', first:'${NAMES[0]}', last:'${NAMES[2]}' },
        { id:'${S3}', first:'${NAMES[0]}', last:'${NAMES[3]}' });
      /* THE ROSTER CARRIES AN ID THAT NAMES NOBODY, which a restored or hand-edited document can
         produce and which src/home.js drops rather than asks about. A build that asked openWork()
         about a student who does not exist would be told every assignment in the term is open —
         the chip would read 7 instead of 3 — so the ghost is a fixture, not noise.
         NO BACKTICKS IN THIS COMMENT: it is inside a template literal. */
      doc.classes.push({ id:'${CLS}', name:'WO-3.26 Waiting', archived:false,
        roster:['${S1}','${S2}','${S3}','${GHOST}'], letterScale:null,
        terms:[{ id:'${TERM}', label:'WO-3.26 Term' },
               { id:'${LATER}', label:'WO-3.26 Later' }],
        categories:[{ id:'wo326-cat', name:'All work', weight:100 }]});
      /* The other card: same shape, nothing left to grade. */
      doc.classes.push({ id:'${CLS2}', name:'WO-3.26 Clear', archived:false,
        roster:['${S1}','${S2}'], letterScale:null,
        terms:[{ id:'tm_wo326_clear', label:'WO-3.26 Clear term' }],
        categories:[{ id:'wo326-cat2', name:'All work', weight:100 }]});
      var add = function(id, classId, termId, catId, name, points, due){
        doc.assignments.push({ id:id, classId:classId, termId:termId, categoryId:catId,
          name:name, points:points, assigned:'', due:due || '' });
      };
      /* THE THREE THAT COUNT. */
      add('wo326-a1', '${CLS}', '${TERM}', 'wo326-cat', 'One blank left', 100, '');
      add('wo326-a2', '${CLS}', '${TERM}', 'wo326-cat', 'Two blanks, long overdue', 20, '2020-01-01');
      add('wo326-a3', '${CLS}', '${TERM}', 'wo326-cat', 'Nothing entered at all', 10, '');
      /* THE FOUR THAT DO NOT. */
      add('wo326-a4', '${CLS}', '${TERM}', 'wo326-cat', 'Excused for everyone', 20, '');
      add('wo326-a5', '${CLS}', '${TERM}', 'wo326-cat', 'A late with a score, a nine, a zero', 10, '');
      add('wo326-a6', '${CLS}', '${TERM}', 'wo326-cat', 'Marked missing for everyone', 10, '');
      add('wo326-a7', '${CLS}', '${TERM}', 'wo326-cat', 'Bonus poster', 0, '');
      /* AND ONE IN THE CLASS'S OTHER TERM, entirely ungraded. The chip is scoped to the term the
         teacher has this class open on, which is the first one. */
      add('wo326-a8', '${CLS}', '${LATER}', 'wo326-cat', 'Next term, untouched', 100, '');
      /* The clear class: everyone graded on the one piece of work there is. */
      add('wo326-b1', '${CLS2}', 'tm_wo326_clear', 'wo326-cat2', 'All in', 10, '');

      doc.scores['wo326-a1'] = { '${S1}': { v:80 }, '${S2}': { v:75 } };
      doc.scores['wo326-a2'] = { '${S2}': { v:18 } };
      doc.scores['wo326-a4'] = { '${S1}': { v:null, flag:'excused' },
                                 '${S2}': { v:null, flag:'excused' },
                                 '${S3}': { v:null, flag:'excused' } };
      doc.scores['wo326-a5'] = { '${S1}': { v:7, flag:'late' }, '${S2}': { v:9 },
                                 '${S3}': { v:0 } };
      doc.scores['wo326-a6'] = { '${S1}': { v:null, flag:'missing' },
                                 '${S2}': { v:null, flag:'missing' },
                                 '${S3}': { v:null, flag:'missing' } };
      doc.scores['wo326-b1'] = { '${S1}': { v:10 }, '${S2}': { v:9 } };
    });
    /* selectClass() puts the class view up and repaints the tab strip, which is what makes the
       All-classes door below exist to be clicked. */
    c.selectClass('${CLS}');
    return { ok:true, was:was, mode:mode,
      openTerm: c.getOpenTermId('${CLS}'),
      clearTerm: c.getOpenTermId('${CLS2}') }; })()`);

  if (!plant || !plant.ok) {
    check('the WO-3.26 fixture is real: seven pieces of work in one term, three of them ungraded '
      + 'work worth points', false, (plant && plant.why) || 'the plant did not run at all');
  } else {
    check('the WO-3.26 fixture is real: two classes, seven pieces of work in the open term of the '
      + 'first, and the term the count is scoped to is the one src/classes.js resolves',
      plant.openTerm === TERM && plant.clearTerm === 'tm_wo326_clear',
      'open term for the waiting class = ' + JSON.stringify(plant.openTerm)
        + ', for the clear class = ' + JSON.stringify(plant.clearTerm));

    /* Back to the grid through the control a teacher taps, which is also the chain that redraws it
       (src/shell.js's showHome). Nothing else in this block ever calls a render by hand. */
    await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));

    const READ_CARDS = `(function(){
      var pick = function(id){
        var b = document.querySelector('#homeGrid .class-card-open[data-class-tab="' + id + '"]');
        var card = b ? b.closest('.class-card') : null;
        var slot = b ? b.querySelector('.class-card-signals') : null;
        var chip = slot ? slot.querySelector('.class-card-count') : null;
        return {
          found: !!card,
          said: chip ? chip.textContent : '',
          chips: slot ? slot.querySelectorAll('.class-card-count').length : -1,
          inControl: !!(chip && b && b.contains(chip)),
          controls: card ? card.querySelectorAll('button').length : -1,
          chipH: chip ? chip.getBoundingClientRect().height : 0,
          slotH: slot ? slot.getBoundingClientRect().height : 0,
          cardH: card ? card.getBoundingClientRect().height : 0,
          text: card ? card.textContent : ''
        }; };
      return { waiting: pick('${CLS}'), clear: pick('${CLS2}'),
        gridH: (document.getElementById('homeGrid') || {}).offsetHeight || 0,
        gridText: (document.getElementById('homeGrid') || {}).textContent || '',
        coarse: window.matchMedia('(pointer: coarse)').matches }; })()`;
    const seen = await evalJs(READ_CARDS);

    /* ACCEPTANCE LINES 1 (first half) AND 2 IN ONE ASSERTION, because they are one number: three
       is right only if the four look-alikes and the other term's work are all out of it. A build
       that counted blank cells says 5 here; one that counted every empty-looking column says 4;
       one that ignored the term says 4; one that asked about the ghost roster id says 7. */
    check('a class with three pieces of ungraded work worth points wears one chip saying so — and '
      + 'an excused column, a late carrying a score, a teacher-typed 0, a column marked missing, '
      + 'zero-point bonus work and another term\'s untouched work are none of them in the number',
      seen.waiting.found && seen.waiting.said === CHIP && seen.waiting.chips === 1
        && seen.waiting.inControl && seen.waiting.controls === 1,
      'the card says ' + JSON.stringify(seen.waiting.said) + ' (wanted ' + JSON.stringify(CHIP)
        + '), ' + seen.waiting.chips + ' chip(s), inside the one control = '
        + seen.waiting.inControl + ', controls on the card = ' + seen.waiting.controls);

    /* ACCEPTANCE LINE 3, first half. A zero is a datum a teacher has to read to learn there is
       nothing to read, so the slot stays empty rather than saying "0 ungraded". */
    check('a class with nothing ungraded wears no chip at all — not a zero',
      seen.clear.found && seen.clear.chips === 0 && seen.clear.said === '',
      seen.clear.chips + ' chip(s) on the clear card, saying '
        + JSON.stringify(seen.clear.said));

    /* ACCEPTANCE LINE 3, second half, and the measurement a stylesheet review gets wrong. The two
       cards' own heights are compared because the acceptance line asks for it — but that comparison
       is nearly free, since .home-grid is a CSS grid and stretches every card in a row to the
       tallest. So the real claim is measured by taking the chip OUT of the tree and watching the
       grid not move: if the chip were taller than the 24px src/home.css reserves, removing it would
       shrink the page. The tree is put back by the same door it was drawn through — a click to a
       class and a click back — rather than by re-inserting the node by hand. */
    const withoutChip = await evalJs(`(function(){
      var grid = document.getElementById('homeGrid');
      var before = grid.offsetHeight;
      var b = document.querySelector('#homeGrid .class-card-open[data-class-tab="${CLS}"]');
      var chip = b ? b.querySelector('.class-card-count') : null;
      var slotBefore = b ? b.querySelector('.class-card-signals').getBoundingClientRect().height : 0;
      if (chip) chip.remove();
      var slotAfter = b ? b.querySelector('.class-card-signals').getBoundingClientRect().height : 0;
      return { before: before, after: grid.offsetHeight,
        slotBefore: slotBefore, slotAfter: slotAfter, removed: !!chip }; })()`);
    check('the chip fits inside the height the signals slot has reserved since WO-1.10 — the card '
      + 'carrying a count is the same height as the card beside it that has nothing to say, and '
      + 'taking the chip out of the tree moves the grid by nothing at all',
      withoutChip.removed && withoutChip.before === withoutChip.after
        && withoutChip.slotBefore === withoutChip.slotAfter
        && seen.waiting.cardH === seen.clear.cardH
        && seen.waiting.chipH > 0 && seen.waiting.chipH <= seen.waiting.slotH,
      'grid ' + withoutChip.before + 'px with the chip, ' + withoutChip.after + 'px without it; '
        + 'slot ' + Math.round(withoutChip.slotBefore * 100) / 100 + 'px either way; chip '
        + Math.round(seen.waiting.chipH * 100) / 100 + 'px inside a slot of '
        + Math.round(seen.waiting.slotH * 100) / 100 + 'px; cards '
        + Math.round(seen.waiting.cardH * 100) / 100 + 'px and '
        + Math.round(seen.clear.cardH * 100) / 100 + 'px');

    /* ── acceptance line 4: the number against the grid it opens ── */
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 200));
    await clickSel('#classView [data-class-screen="scores"]');
    await new Promise(r => setTimeout(r, 250));

    /* Counted off the drawn grid rather than out of the document, which is what makes it the same
       count a teacher makes with her eyes: a column holds a blank when one of its fields is empty
       and is not carrying a decision — src/scores.js draws a placeholder of "0" for missing and
       "Ex" for excused, and both of those are empty fields that are not blanks.
       NO BACKTICKS IN THIS COMMENT. */
    const columns = await evalJs(`(function(){
      var heads = Array.prototype.slice.call(
        document.querySelectorAll('th[data-score-col]'));
      var out = { columns: [], blank: [], blankWorthPoints: [], zeroPoint: [] };
      heads.forEach(function(th){
        var id = th.getAttribute('data-score-col');
        var pts = (th.querySelector('.scores-col-pts') || {}).textContent || '';
        var zero = /out of 0\\b/.test(pts);
        out.columns.push(id);
        if (zero) out.zeroPoint.push(id);
        var cells = Array.prototype.slice.call(
          document.querySelectorAll('#scoresBody [data-score-cell="' + id + '"]'));
        var hasBlank = cells.some(function(i){
          return i.value === '' && !i.classList.contains('missing')
            && !i.classList.contains('excused'); });
        if (hasBlank) { out.blank.push(id); if (!zero) out.blankWorthPoints.push(id); }
      });
      return out; })()`);
    check('the number on the card is the number of columns on the score grid holding a blank worth '
      + 'points — counted off the drawn grid, and the one column the two disagree about is the '
      + 'zero-point bonus one, which is ungraded work that is not work owed',
      columns.columns.length === 7 && columns.blankWorthPoints.length === 3
        && columns.blank.length === 4
        && columns.blank.filter((id) => columns.zeroPoint.indexOf(id) !== -1).length === 1
        && seen.waiting.said === columns.blankWorthPoints.length + ' to grade',
      columns.columns.length + ' column(s) drawn, ' + columns.blank.length
        + ' holding a blank (' + JSON.stringify(columns.blank) + '), of which '
        + columns.blankWorthPoints.length + ' are worth points ('
        + JSON.stringify(columns.blankWorthPoints) + '); the card says '
        + JSON.stringify(seen.waiting.said));

    /* ── acceptance line 1, second half: the last blank on one assignment, typed ── */
    await clickSel('#scoresBody [data-score-cell="wo326-a1"][data-score-student="' + S3 + '"]');
    await sk('6', 'Digit6', 54, '6');
    await sk('0', 'Digit0', 48, '0');
    await sk('Enter', 'Enter', 13);
    await new Promise(r => setTimeout(r, 200));
    const typed = await evalJs(`(function(){
      var col = window.planbook.store.getDoc().scores['wo326-a1'] || {};
      return { cell: JSON.stringify(col['${S3}'] || null),
        stillBlank: Array.prototype.slice.call(
          document.querySelectorAll('#scoresBody [data-score-cell="wo326-a1"]'))
          .filter(function(i){ return i.value === ''; }).length }; })()`);
    await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));
    const after = await evalJs(READ_CARDS);
    check('entering the last blank score on one of the three takes the count to two, with no '
      + 'reload — the card is redrawn by the same chain that brings the teacher back to it',
      typed.cell === '{"v":60}' && typed.stillBlank === 0
        && after.waiting.said === AFTER && after.waiting.chips === 1,
      'the cell now holds ' + typed.cell + ', ' + typed.stillBlank
        + ' blank(s) left in that column, and the card says '
        + JSON.stringify(after.waiting.said) + ' (wanted ' + JSON.stringify(AFTER) + ')');

    /* ── acceptance line 6: presentation mode ──
     *
     * src/home.js is deliberately absent from src/shell.js's flipPresentationMode() redraw list,
     * and WO-1.9's acceptance says to re-verify that inheritance at every later phase. Asserting
     * only that the card is unchanged after the flip would prove nothing about a build that
     * suppressed the count on the NEXT render, which is the exact defect that comment warns about —
     * so the card is redrawn while the mode is on, through the two real doors, and read again.
     */
    const modeOn = await evalJs(`(function(){
      return window.planbook.supports.presentationMode(); })()`);
    if (modeOn) await clickSel('header [data-presentation-toggle]');
    const before = await evalJs(READ_CARDS);
    await clickSel('header [data-presentation-toggle]');
    await clickSel('#homeGrid .class-card-open[data-class-tab="' + CLS + '"]');
    await new Promise(r => setTimeout(r, 200));
    await clickSel('#classTabBar [data-view-home]');
    await new Promise(r => setTimeout(r, 200));
    const presenting = await evalJs(READ_CARDS);
    /* Read rather than assumed: the check below is only about a card drawn with the mode ON, and a
       toggle that failed to bind would otherwise make it a check about a card drawn with it off. */
    const modeIsOn = await evalJs('window.planbook.supports.presentationMode()');
    const namedAnywhere = NAMES.filter((n) => presenting.gridText.indexOf(n) !== -1
      || before.gridText.indexOf(n) !== -1);
    check('the card says exactly the same thing with presentation mode on, drawn fresh while it is '
      + 'on — and no student is named on the grid in either mode, which is why src/home.js stays '
      + 'off flipPresentationMode()\'s redraw list',
      modeIsOn === true
        && presenting.waiting.said === before.waiting.said
        && presenting.waiting.said === AFTER
        && presenting.clear.chips === 0
        && presenting.gridText === before.gridText
        && namedAnywhere.length === 0,
      'mode off it says ' + JSON.stringify(before.waiting.said) + ', mode on it says '
        + JSON.stringify(presenting.waiting.said) + '; student names found on the grid: '
        + (namedAnywhere.length ? JSON.stringify(namedAnywhere) : 'none'));

    /* ── the same page under an emulated coarse pointer ──
       The slot's reserve is 26px there rather than 24, and the chip has its own bump in that block;
       a measurement taken only at the desktop size says nothing about the size this app is used at.
       The coarse assertion gates the measurement for the reason tools/README.md trap 3 gives. */
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Emulation.setDeviceMetricsOverride',
      { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    if (await has('#classTabBar [data-view-home]')) {
      await clickSel('#classTabBar [data-view-home]');
      await new Promise(r => setTimeout(r, 200));
    }
    const coarse = await evalJs(READ_CARDS);
    if (!coarse.coarse) {
      check('the chip fits the coarse-pointer reserve too', false,
        'the emulated pointer is not coarse, so nothing below it was measured (tools/README.md '
          + 'trap 3)');
    } else {
      const reserve = await evalJs(`(function(){
        var b = document.querySelector('#homeGrid .class-card-open[data-class-tab="${CLS}"]');
        var slot = b ? b.querySelector('.class-card-signals') : null;
        return slot ? parseFloat(getComputedStyle(slot).minHeight) : 0; })()`);
      check('and on an emulated iPad the chip still fits the reserve the slot takes in the '
        + 'coarse block — it is a line of text inside the card\'s one button, so it takes the '
        + 'font bump and not a 44px floor',
        coarse.waiting.found && coarse.waiting.said === AFTER && reserve === 26
          && coarse.waiting.chipH > 0 && coarse.waiting.chipH <= reserve
          && coarse.waiting.cardH === coarse.clear.cardH && coarse.clear.chips === 0,
        'pointer is coarse, the slot reserves ' + reserve + 'px, the chip measures '
          + Math.round(coarse.waiting.chipH * 100) / 100 + 'px and says '
          + JSON.stringify(coarse.waiting.said) + '; cards '
          + Math.round(coarse.waiting.cardH * 100) / 100 + 'px and '
          + Math.round(coarse.clear.cardH * 100) / 100 + 'px');
    }
  }

  /* Teardown by id, the WO-3.7 shape rather than a snapshot restore: this block reloads twice, and
     a page reload takes anything parked on window with it. The presentation preference and the
     selected class are put back the way they were found. */
  const cleaned = await evalJs(`(function(){
    var s = window.planbook.store;
    var ours = { '${CLS}':1, '${CLS2}':1 };
    var mine = { 'wo326-a1':1,'wo326-a2':1,'wo326-a3':1,'wo326-a4':1,'wo326-a5':1,'wo326-a6':1,
      'wo326-a7':1,'wo326-a8':1,'wo326-b1':1 };
    s.update(function(d){
      d.classes = (d.classes || []).filter(function(c){ return !ours[c.id]; });
      d.students = (d.students || []).filter(function(p){
        return p.id !== '${S1}' && p.id !== '${S2}' && p.id !== '${S3}'; });
      d.assignments = (d.assignments || []).filter(function(a){ return !mine[a.id]; });
      Object.keys(mine).forEach(function(k){ delete (d.scores || {})[k]; });
    });
    if (window.planbook.supports.presentationMode() !== ${JSON.stringify(!!(plant && plant.mode))}) {
      window.planbook.presentation.togglePresentationMode();
    }
    var d = s.getDoc();
    return { classes: (d.classes || []).filter(function(c){ return ours[c.id]; }).length,
      assignments: (d.assignments || []).filter(function(a){ return mine[a.id]; }).length,
      mode: window.planbook.supports.presentationMode() }; })()`);
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  check('the WO-3.26 fixture came back off the document, and presentation mode was left as it was '
    + 'found', cleaned.classes === 0 && cleaned.assignments === 0
      && cleaned.mode === !!(plant && plant.mode),
    cleaned.classes + ' fixture class(es) and ' + cleaned.assignments
      + ' fixture assignment(s) left behind, presentation mode = ' + cleaned.mode);
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
}
}
