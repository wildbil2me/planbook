/* accommodation-prompts.mjs — accommodation prompts at point of use (WO-3.8)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, waitForBoot, seam } = h;

/* ───────── accommodation prompts at point of use (WO-3.8) ─────────
 *
 * Three acceptance lines, and the third one — "in presentation mode nothing appears at all, not even
 * the count" — is an ABSENCE, which is the shape this file is worst at unless the fixture is built to
 * say so. A build that draws no prompt anywhere passes it perfectly. So every absence below is taken
 * beside the same reading with the mode OFF, on the same document, in the same dialog, and the prompt
 * that comes back is the negative control for all of them.
 *
 * THE FIXTURE IS TWO CLASSES, and each one exists for a line the other cannot make.
 *
 *   c_wo38   Tests / Homework, six students, and NOT ONE empty `appliesTo` on it. That is what lets
 *            Homework be genuinely EMPTY — acceptance line 1's second half — while the roster still
 *            has accommodations on it: `Zephyrine` is scoped to `labs, field work`, so a prompt that
 *            fired there would be firing on a category nobody's accommodation names. The Tests half
 *            is arranged to produce docs/data-model.md's own worked sentence, word for word:
 *
 *              Ashdown    extended time      appliesTo ["tests"]         exact
 *              Braemore   extended time      appliesTo ["Tests"]         case only
 *              Corvane    extended time      appliesTo ["unit tests"]    the category is narrower
 *              Dunmarrow  separate setting   appliesTo ["quizzes","tests"]
 *              Everleigh  separate setting   appliesTo ["TESTS "]        case and whitespace
 *              Zephyrine  read aloud         appliesTo ["labs","field work"]   fires on neither
 *
 *            → "3 students have extended time, 2 need a separate setting." asserted as that string
 *            rather than as a regex over two numbers, because the sentence is a deliverable.
 *
 *   c_wo38b  One category, `Homework`, and one student carrying TWO accommodation rows: `breaks`
 *            with an empty `appliesTo`, which the data model says means everything, and a wholly
 *            BLANK row of the kind `newAccommodation()` writes the moment a teacher taps Add. The
 *            blank row also has an empty `appliesTo`, so a build that counted rows instead of
 *            answers would say "1 student needs breaks, 1 has an accommodation on file" over one
 *            student who has one. The class says exactly one clause or this check is red.
 *
 * WHAT IS DRIVEN AND WHAT IS PLANTED. The document is planted through the store — six students with
 * `supports` blocks is twenty minutes of clicking that proves nothing this file has not proved in the
 * WO-1.8 section — and everything the work order is ABOUT is driven: the assignment is created with
 * the real "+ New assignment", the category is changed with the real <select>, the names are revealed
 * with the real button, and presentation mode is flipped with the real header control.
 *
 * WHY THE FLIP IS `.click()` AND NOT A MOUSE AT COORDINATES, said here because it looks like a
 * shortcut and is a finding. A `.modal-overlay` is fixed at inset 0, so a click aimed at the header
 * while the editor is open lands on the scrim and is a backdrop dismissal — the WO-1.9 section says
 * the same thing about the roster dialog. That is true of the app as well: a teacher cannot reach the
 * header toggle without closing this dialog first, so THE LIVE FLIP WITH THE EDITOR OPEN IS NOT A
 * GESTURE ANYBODY CAN MAKE TODAY. It is still the behaviour under test — src/shell.js's
 * flipPresentationMode() chains this prompt's redraw, and what that chain genuinely protects is the
 * reachable case one line below it: a flip made with the editor SHUT, which must leave no summary
 * sitting in the shut dialog's DOM. Both are checked. `.click()` runs the real delegated handler and
 * the real chain; only the pointer is synthetic.
 *
 * WHAT IS NOT HERE AND IS OWED TO A HUMAN: whether "Show which students" reads as a disclosure rather
 * than as a "more" link under a thumb, and whether a teacher who turns presentation mode on mid-class
 * can see at a glance that this box has gone. The box is measured on an emulated coarse pointer
 * below; no emulator has a thumb and none of them is standing in front of thirty students.
 */
console.log('\n--- accommodation prompts at point of use (WO-3.8) ---');
{
  const promptSeam = await evalJs("!!(window.planbook && window.planbook.store"
    + " && window.planbook.classes && window.planbook.supports"
    + " && window.planbook.accommodationPrompt"
    + " && typeof window.planbook.supports.appliesToMatches === 'function')");
  const promptHosts = await evalJs("document.querySelectorAll('[data-accommodation-prompt]').length");

  if (!promptSeam || !promptHosts) {
    check('the accommodation prompt has a host in the assignment editor and a seam to read it by',
      false, promptHosts + ' element(s) carry [data-accommodation-prompt] and the seam is '
        + (promptSeam ? 'present' : 'absent') + ' — src/accommodation-prompt.js paints into that '
        + 'hook, so its absence is a defect rather than a stage of the build');
    skip('the rest of WO-3.8 — the sentence, the category that fires nothing, empty `appliesTo`, '
      + 'the names behind the tap, presentation mode, the reveal being unreachable under it, and '
      + 'the 44px pass',
      'there is no prompt host to paint into, so nothing below could be driven the way a teacher '
        + 'would reach it');
  } else {
    /* Coarse, because the 44px floor lives in `@media (pointer: coarse)` and a run that lost it
       would measure the desktop pass and report green (tools/README.md trap 3). 1024x768 rather than
       390: everything here has to CLICK a control, and the note in the WO-3.17 section records what
       happens to a click at 390 when the layout and visual viewports come apart. */
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    const coarse38 = await evalJs("matchMedia('(pointer: coarse)').matches");

    /* The mode as this run found it, put back at the foot of the section. A run that left the
       browser in presentation mode would quietly suppress the fixtures of everything after it —
       WO-1.9's section states the rule and this is the second place that has to obey it. */
    const mode38Was = await evalJs("localStorage.getItem('planbook_presentationMode')");

    const plant38 = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return { ok:false, why:'no year document is open' };
      var was = c.getSelectedClassId();
      var person = function(id, last, rows){
        return { id:id, first:'Wo38', last:last, nickname:'', gradYear:'', email:'', notes:'',
          supports: { plan:'IEP', caseManager:{ name:'', email:'' }, reviewDate:'',
            accommodations: rows, medical:'', behaviorPlan:'' } };
      };
      var row = function(kind, applies){ return { kind:kind, detail:'', appliesTo:applies }; };
      s.update(function(doc){
        doc.classes.push({ id:'c_wo38', name:'WO-3.8 Supports', archived:false,
          terms:[{ id:'tm_wo38', label:'WO-3.8 Term', start:'', end:'' }],
          categories:[{ id:'k_wo38_tests', name:'Tests', weight:60 },
                      { id:'k_wo38_home', name:'Homework', weight:40 }],
          roster:['wo38-s1','wo38-s2','wo38-s3','wo38-s4','wo38-s5','wo38-s6'] });
        doc.classes.push({ id:'c_wo38b', name:'WO-3.8 Everything', archived:false,
          terms:[{ id:'tm_wo38b', label:'WO-3.8 Term B', start:'', end:'' }],
          categories:[{ id:'k_wo38b_home', name:'Homework', weight:100 }],
          roster:['wo38-s7'] });
        /* WO-3.21: a second REAL row of the SAME kind, scoped to something the match rule already
           fires on (wo38-s3 Corvane below proves ['unit tests'] matches Tests) - the dedupe in
           groupsFor()'s seen Set (src/accommodation-prompt.js:186) is what this second row exists
           to exercise, and the WO-3.8 fixture never had a chance to prove wrong. */
        doc.students.push(person('wo38-s1', 'Ashdown',
          [row('extended-time', ['tests']), row('extended-time', ['unit tests'])]));
        doc.students.push(person('wo38-s2', 'Braemore', [row('extended-time', ['Tests'])]));
        doc.students.push(person('wo38-s3', 'Corvane', [row('extended-time', ['unit tests'])]));
        doc.students.push(person('wo38-s4', 'Dunmarrow',
          [row('separate-setting', ['quizzes', 'tests'])]));
        doc.students.push(person('wo38-s5', 'Everleigh', [row('separate-setting', ['TESTS '])]));
        doc.students.push(person('wo38-s6', 'Zephyrine',
          [row('read-aloud', ['labs', 'field work'])]));
        /* Two rows on one student: everything, and a row a mis-tap made. */
        doc.students.push(person('wo38-s7', 'Marchetti',
          [row('breaks', []), { kind:'', detail:'', appliesTo:[] }]));
      });
      c.selectClass('c_wo38');
      var made = s.getDoc();
      return { ok:true, was: was,
        classes: made.classes.filter(function(x){
          return x.id === 'c_wo38' || x.id === 'c_wo38b'; }).length,
        people: made.students.filter(function(x){
          return String(x.id).indexOf('wo38-') === 0; }).length,
        /* The sensitive data asserted PRESENT in the serialised document before anything below
           claims it is absent from a screen — the discipline the WO-3.7 and WO-3.9 sections use, and
           the only thing that tells "suppressed" apart from "never planted". */
        planted: JSON.stringify(made.students.filter(function(x){
          return String(x.id).indexOf('wo38-') === 0; })) }; })()`);

    /*
      TWO SENTINEL SETS, AND THE SPLIT IS THE FINDING THIS BLOCK PAID FOR ON ITS FIRST RUN.

      Written as one set swept over the whole page, five checks went red naming all five students —
      on the FIRST paint, with zero name chips drawn and the prompt showing nothing but counts. The
      names were real and they were not this prompt's: the class's attendance registry inside
      #classView had drawn its six rows, the Assignments segment hides that view rather than emptying
      it, and `document.documentElement.textContent` reaches every hidden element by design. Which is
      the whole point of sweeping the document — it was right, and the check was asking the wrong
      question.

      A STUDENT'S NAME IS NOT THE SECRET. It is on the roster, on the registry, on the score grid and
      on the printed sheet, and none of that is a disclosure. WHAT IS SECRET IS THE PAIRING — this
      name with that accommodation — and the KIND PHRASE on its own, which is what makes "3 students
      have extended time" a disclosure on a projected screen even with nobody named. So:

        KIND_SENTINELS  are swept over the WHOLE PAGE, hidden elements included. Nothing outside this
                        prompt may ever say them, and in presentation mode neither may it.
        NAME_SENTINELS  are swept over the ASSIGNMENT EDITOR, which is the only surface in the app
                        where a name next to this prompt would be the pairing. Sweeping them page-wide
                        would be asserting that the registry has no roster on it.
    */
    const KIND_SENTINELS = ['extended time', 'separate setting'];
    const NAME_SENTINELS = ['Ashdown', 'Braemore', 'Corvane', 'Dunmarrow', 'Everleigh'];

    if (!plant38.ok || plant38.classes !== 2 || plant38.people !== 7
        || !/extended-time/.test(plant38.planted || '') || !/"plan":"IEP"/.test(plant38.planted || '')) {
      check('the WO-3.8 fixture is real: two classes, seven students, and their accommodations in '
        + 'the document before anything is read off a screen', false,
        (plant38.why || '') + ' classes = ' + plant38.classes + ', students = ' + plant38.people
          + ', document carries extended-time = ' + /extended-time/.test(plant38.planted || ''));
      skip('the rest of WO-3.8', 'the fixture never landed, so every reading below would be about a '
        + 'document that does not hold what the checks are about');
    } else {
      check('the WO-3.8 fixture is real: two classes, seven students, and their accommodations in '
        + 'the document before anything is read off a screen',
        coarse38 === true && plant38.classes === 2 && plant38.people === 7,
        'coarse pointer = ' + coarse38 + ', classes = ' + plant38.classes + ', students = '
          + plant38.people + ', `extended-time` and `"plan":"IEP"` both present in the serialised '
          + 'document = true');

      /* Everything the prompt is, in one round trip: is the host up, what does it say, is the reveal
         drawn, and are the names on screen. Read off the SCREEN rather than out of the module — the
         acceptance lines are about what a teacher could have read. */
      const READ_PROMPT = `(function(){
        var host = document.querySelector('[data-accommodation-prompt]');
        var modal = document.getElementById('assignmentModal');
        var lead = host ? host.querySelector('.accommodation-prompt-lead') : null;
        var reveal = host ? host.querySelector('[data-accommodation-names]') : null;
        var names = host ? Array.prototype.map.call(
          host.querySelectorAll('.accommodation-prompt-name'),
          function(n){ return n.textContent; }) : [];
        var cat = document.querySelector('#assignmentFields [data-assignment-category]');
        var chosen = '';
        if (cat && cat.selectedIndex >= 0) chosen = cat.options[cat.selectedIndex].textContent;
        return {
          editorOpen: !!modal && !modal.classList.contains('hidden'),
          hostExists: !!host,
          hidden: !!host && host.classList.contains('hidden'),
          display: host ? getComputedStyle(host).display : '(absent)',
          text: host ? host.textContent.replace(/\\s+/g, ' ').trim() : '',
          lead: lead ? lead.textContent.replace(/\\s+/g, ' ').trim() : '',
          where: (function(){ var w = host ? host.querySelector('.accommodation-prompt-where') : null;
            return w ? w.textContent.replace(/\\s+/g, ' ').trim() : ''; })(),
          revealCount: document.querySelectorAll('[data-accommodation-names]').length,
          revealLabel: reveal ? reveal.textContent.trim() : '',
          expanded: reveal ? reveal.getAttribute('aria-expanded') : null,
          names: names,
          chosenCategory: chosen,
          /* The absence claim, over the WHOLE document rather than over the elements this block
             happens to know the names of — including every hidden one, which is the entire point.
             window.__leak's own shape, one section over. */
          pageText: document.documentElement.textContent.replace(/\\s+/g, ' '),
          modalText: modal ? modal.textContent.replace(/\\s+/g, ' ') : '' }; })()`;
      const readPrompt = () => evalJs(READ_PROMPT);

      /* In the way a teacher goes: the class tab, then the Assignments segment, then + New. */
      await clickSel('#classTabBar [data-class-tab="c_wo38"]');
      await new Promise(r => setTimeout(r, 200));
      await clickSel('#classView [data-class-screen="assignments"]');
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#assignmentsView [data-assignment-new]');
      await new Promise(r => setTimeout(r, 250));

      /*
        ACCEPTANCE LINE 1, FIRST HALF. A new assignment lands in the class's FIRST category, which is
        Tests — so this is the work order's own sentence, "creating a test surfaces the counts",
        driven through the button that creates one rather than by setting a category from the console.
      */
      const onTests = await readPrompt();
      check('creating a test surfaces the counts, in docs/data-model.md\'s own words — '
        + '"3 students have extended time, 2 need a separate setting."',
        onTests.editorOpen === true && onTests.hidden === false
          && onTests.lead === '3 students have extended time, 2 need a separate setting.'
          && /Tests/.test(onTests.chosenCategory),
        'category = ' + JSON.stringify(onTests.chosenCategory) + ', prompt says '
          + JSON.stringify(onTests.lead) + ', host hidden = ' + onTests.hidden);

      check('and it says where the counts came from, so a count with no scope on it is not left for '
        + 'the teacher to guess at',
        /Tests/.test(onTests.where) && /presentation mode/i.test(onTests.where)
          && /never printed/i.test(onTests.where),
        JSON.stringify(onTests.where));

      /*
        ACCEPTANCE LINE 2. Counts are the default and names are not on the screen — asserted as an
        absence over the WHOLE document, not over the prompt, so a build that drew the names somewhere
        else in the dialog could not pass by being out of frame.
      */
      const namesOnFirstPaint = NAME_SENTINELS.filter((s) => onTests.modalText.indexOf(s) >= 0);
      check('the default view is counts, not names: the reveal is drawn and collapsed, and not one '
        + 'of the five students is named anywhere in the dialog',
        onTests.revealCount === 1 && onTests.expanded === 'false'
          && /Show which students/i.test(onTests.revealLabel)
          && onTests.names.length === 0 && namesOnFirstPaint.length === 0,
        'reveal = ' + JSON.stringify(onTests.revealLabel) + ' aria-expanded=' + onTests.expanded
          + ', name chips = ' + onTests.names.length + ', names found in the dialog = '
          + JSON.stringify(namesOnFirstPaint) + ' over a dialog of ' + onTests.modalText.length
          + ' characters');

      /* The deliberate tap, through the real button. */
      await clickSel('[data-accommodation-names]');
      await new Promise(r => setTimeout(r, 200));
      const revealed = await readPrompt();
      check('one deliberate tap puts the five names on screen, grouped under the kind they belong '
        + 'to, and the button offers to put them back',
        revealed.expanded === 'true' && /Hide the names/i.test(revealed.revealLabel)
          && revealed.names.length === 5
          && ['Ashdown', 'Braemore', 'Corvane', 'Dunmarrow', 'Everleigh']
            .every((n) => revealed.names.some((chip) => chip.indexOf(n) >= 0))
          && revealed.names.every((chip) => chip.indexOf('Zephyrine') < 0),
        revealed.names.length + ' chip(s): ' + JSON.stringify(revealed.names));

      /*
        ACCEPTANCE LINE 1, SECOND HALF, and the half a build passes by accident. The category is
        changed to Homework with the real <select>, and NOTHING is left on screen: no sentence, no
        count, no reveal, and the names that were showing a moment ago are gone with it. The roster
        still carries an accommodation — Zephyrine's, scoped to labs — so this is a scope that does
        not match rather than a class with nothing on file.
      */
      await evalJs(`(function(){
        var s = document.querySelector('#assignmentFields [data-assignment-category]');
        if (!s) return 0;
        s.value = 'k_wo38_home';
        s.dispatchEvent(new Event('change', { bubbles: true }));
        return 1; })()`);
      await new Promise(r => setTimeout(r, 250));
      const onHomework = await readPrompt();
      check('changing the same open editor to Homework surfaces nothing at all — an accommodation '
        + 'scoped to `tests` does not fire on homework, and the reveal goes with the counts',
        onHomework.editorOpen === true && onHomework.hidden === true
          && onHomework.text === '' && onHomework.revealCount === 0
          && KIND_SENTINELS.every((s) => onHomework.pageText.indexOf(s) < 0)
          && NAME_SENTINELS.every((s) => onHomework.modalText.indexOf(s) < 0),
        'host hidden = ' + onHomework.hidden + ', host text = ' + JSON.stringify(onHomework.text)
          + ', reveal hooks on the page = ' + onHomework.revealCount + ', kinds left on a page of '
          + onHomework.pageText.length + ' characters = '
          + JSON.stringify(KIND_SENTINELS.filter((s) => onHomework.pageText.indexOf(s) >= 0))
          + ', names left in a dialog of ' + onHomework.modalText.length + ' characters = '
          + JSON.stringify(NAME_SENTINELS.filter((s) => onHomework.modalText.indexOf(s) >= 0)));

      /* Back to Tests, which is also the check that the summary is recomputed rather than remembered
         — and that the names went back behind the tap when the category moved. */
      await evalJs(`(function(){
        var s = document.querySelector('#assignmentFields [data-assignment-category]');
        if (!s) return 0;
        s.value = 'k_wo38_tests';
        s.dispatchEvent(new Event('change', { bubbles: true }));
        return 1; })()`);
      await new Promise(r => setTimeout(r, 250));
      const backOnTests = await readPrompt();
      check('and back to Tests recomputes the same sentence while the names return to being behind '
        + 'the tap — a summary computed once on open and left standing is the failure this line names',
        backOnTests.lead === '3 students have extended time, 2 need a separate setting.'
          && backOnTests.expanded === 'false' && backOnTests.names.length === 0
          && NAME_SENTINELS.every((s) => backOnTests.modalText.indexOf(s) < 0),
        'says ' + JSON.stringify(backOnTests.lead) + ', aria-expanded = ' + backOnTests.expanded
          + ', name chips = ' + backOnTests.names.length);

      /* 44px, on the control that is on screen right now and on a pointer that is really coarse. */
      const box38 = await evalJs(`(function(){
        var b = document.querySelector('[data-accommodation-names]');
        if (!b) return null;
        var r = b.getBoundingClientRect();
        return { w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }; })()`);
      check('the reveal measures >=44px on an emulated coarse pointer — the standing sweep cannot '
        + 'find this one, because it runs thousands of lines before this fixture and the prompt is '
        + 'only on screen while a matching category is chosen',
        coarse38 === true && !!box38 && box38.h >= 44 && box38.w >= 44,
        'coarse = ' + coarse38 + ', box = ' + JSON.stringify(box38));

      /*
        ACCEPTANCE LINE 3, and the first of its two halves: the LIVE flip, with the editor open and
        the prompt on screen. `.click()` rather than a mouse at coordinates — see the note at the head
        of this section; the scrim owns the viewport, and it is the delegated handler and the redraw
        chain under test rather than the gesture.
      */
      await clickSel('[data-accommodation-names]');    /* names showing, so the flip has more to take */
      await new Promise(r => setTimeout(r, 200));
      const beforeFlip = await readPrompt();
      await evalJs("document.getElementById('presentationBtn').click(); 1");
      await new Promise(r => setTimeout(r, 300));
      const underMode = await readPrompt();
      const leakedKinds = KIND_SENTINELS.filter((s) => underMode.pageText.indexOf(s) >= 0);
      const leakedNames = NAME_SENTINELS.filter((s) => underMode.modalText.indexOf(s) >= 0);
      check('in presentation mode nothing appears at all — not the names, not the sentence, not even '
        + 'the count: the host is empty, hidden, no kind phrase survives anywhere on the page and no '
        + 'name survives in the dialog, while the editor is still open on the category that was '
        + 'showing all of it a moment ago',
        beforeFlip.names.length === 5 && underMode.editorOpen === true
          && underMode.hidden === true && underMode.display === 'none'
          && underMode.text === '' && underMode.revealCount === 0
          && underMode.names.length === 0 && leakedKinds.length === 0 && leakedNames.length === 0,
        'names showing before the flip = ' + beforeFlip.names.length + '; after: hidden = '
          + underMode.hidden + ', display = ' + underMode.display + ', host text = '
          + JSON.stringify(underMode.text) + ', reveal hooks = ' + underMode.revealCount
          + ', kind phrases left on a page of ' + underMode.pageText.length + ' characters = '
          + JSON.stringify(leakedKinds) + ', names left in a dialog of '
          + underMode.modalText.length + ' characters = ' + JSON.stringify(leakedNames));

      /* AND IT CANNOT BE REACHED WITH THE BUTTON GONE. The missing control is not the protection;
         the guard inside the module is, and the only way to ask which one is doing the work is to
         call the function the button would have called. */
      const forced = await evalJs(`(function(){
        window.planbook.accommodationPrompt.toggleAccommodationNames();
        var host = document.querySelector('[data-accommodation-prompt]');
        var modal = document.getElementById('assignmentModal');
        return { text: host ? host.textContent.replace(/\\s+/g, ' ').trim() : '(absent)',
                 hidden: !!host && host.classList.contains('hidden'),
                 reveals: document.querySelectorAll('[data-accommodation-names]').length,
                 modalText: modal ? modal.textContent.replace(/\\s+/g, ' ') : '',
                 page: document.documentElement.textContent.replace(/\\s+/g, ' ') }; })()`);
      check('and the reveal is not merely un-drawn under presentation mode: calling it directly '
        + 'writes nothing to the screen either, so the guard is in the module rather than in the '
        + 'absence of a button',
        forced.text === '' && forced.hidden === true && forced.reveals === 0
          && KIND_SENTINELS.every((s) => forced.page.indexOf(s) < 0)
          && NAME_SENTINELS.every((s) => forced.modalText.indexOf(s) < 0),
        'host text after the forced call = ' + JSON.stringify(forced.text) + ', reveal hooks = '
          + forced.reveals + ', kind phrases on the page = '
          + JSON.stringify(KIND_SENTINELS.filter((s) => forced.page.indexOf(s) >= 0))
          + ', names in the dialog = '
          + JSON.stringify(NAME_SENTINELS.filter((s) => forced.modalText.indexOf(s) >= 0)));

      /* THE NEGATIVE CONTROL FOR BOTH READINGS ABOVE. Flipped back, on the same open dialog, with
         nothing else touched: if the prompt did not come back, every absence above was a build that
         cannot draw one. And the names stay behind the tap coming out of presentation mode — a panel
         that sprang back open would be a disclosure the teacher did not ask for, on the screen she
         has just finished projecting (src/roster.js's refreshSupportSurfaces() makes the same call). */
      await evalJs("document.getElementById('presentationBtn').click(); 1");
      await new Promise(r => setTimeout(r, 300));
      const modeOff38 = await readPrompt();
      check('flipping presentation mode back off brings the same counts back to the same open dialog '
        + '— which is what makes every absence above a suppression rather than a screen that cannot '
        + 'draw — with the names still behind the tap',
        modeOff38.editorOpen === true && modeOff38.hidden === false
          && modeOff38.lead === '3 students have extended time, 2 need a separate setting.'
          && modeOff38.revealCount === 1 && modeOff38.expanded === 'false'
          && modeOff38.names.length === 0,
        'says ' + JSON.stringify(modeOff38.lead) + ', reveal hooks = ' + modeOff38.revealCount
          + ', aria-expanded = ' + modeOff38.expanded + ', name chips = ' + modeOff38.names.length);

      /* THE REACHABLE HALF OF THE SAME CHAIN: a flip made with the editor SHUT, which is the only
         way a teacher can make one. The dialog keeps its DOM after a close, so a summary left in it
         is present without being on screen — the distinction src/supports.js's sensitiveValue()
         draws, and the reason src/assignments.js's refreshAccommodationPrompt() clears rather than
         repaints when the modal is down. */
      await clickSel('#assignmentModal [data-modal-close]');
      await new Promise(r => setTimeout(r, 250));
      await evalJs("document.getElementById('presentationBtn').click(); 1");
      await new Promise(r => setTimeout(r, 300));
      const shutFlip = await readPrompt();
      check('and a flip made the way a teacher can actually make one — with the editor shut — leaves '
        + 'no summary sitting in the shut dialog, where it would be out of sight and still in the DOM',
        shutFlip.editorOpen === false && shutFlip.hidden === true && shutFlip.text === ''
          && KIND_SENTINELS.every((s) => shutFlip.pageText.indexOf(s) < 0)
          && NAME_SENTINELS.every((s) => shutFlip.modalText.indexOf(s) < 0),
        'editor open = ' + shutFlip.editorOpen + ', host text = ' + JSON.stringify(shutFlip.text)
          + ', kind phrases on a page of ' + shutFlip.pageText.length + ' characters = '
          + JSON.stringify(KIND_SENTINELS.filter((s) => shutFlip.pageText.indexOf(s) >= 0))
          + ', names in the shut dialog = '
          + JSON.stringify(NAME_SENTINELS.filter((s) => shutFlip.modalText.indexOf(s) >= 0)));
      await evalJs("document.getElementById('presentationBtn').click(); 1");
      await new Promise(r => setTimeout(r, 300));

      /*
        AN EMPTY `appliesTo` MEANS EVERYTHING — the deliverable's second sentence, and the reason the
        fixture needs a second class. The one student on it carries a `breaks` row scoped to nothing
        at all and a BLANK row of the kind a mis-tap writes; the class says exactly one clause, so a
        build counting rows rather than answers is red here and nowhere else.
      */
      await clickSel('#classTabBar [data-class-tab="c_wo38b"]');
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#classView [data-class-screen="assignments"]');
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#assignmentsView [data-assignment-new]');
      await new Promise(r => setTimeout(r, 250));
      const everything = await readPrompt();
      check('an empty `appliesTo` means everything, and a blank accommodation row means nothing: a '
        + 'homework assignment in the other class says exactly "1 student needs breaks."',
        everything.editorOpen === true && everything.hidden === false
          && everything.lead === '1 student needs breaks.',
        'says ' + JSON.stringify(everything.lead));
      await evalJs("window.planbook.closeModal('assignmentModal'); 1");

      /*
        THE MATCH RULE ITSELF, asked of src/supports.js rather than inferred from the two screens
        above — the same split the WO-3.5 section makes between the grid and the engine, so a screen
        cannot pass by agreeing with itself. The two rows that must answer NO are the point: a
        substring rule would fire `art` on `Participation`, and a prompt that did that would teach a
        teacher to stop reading them.
      */
      const matchTable = await evalJs(`(function(){
        var m = window.planbook.supports.appliesToMatches;
        var cases = [
          [[], 'Tests', true], [['tests'], 'Tests', true], [['Tests'], 'tests', true],
          [['TESTS '], 'Tests', true], [['test'], 'Tests', true],
          [['unit tests'], 'Tests', true], [['tests'], 'Unit Tests', true],
          [['quizzes'], 'Quiz', true], [['quiz'], 'Quizzes', true],
          [['tests'], 'Homework', false], [['art'], 'Participation', false],
          [['tests'], '', false], [[], '', true]
        ];
        return cases.map(function(c){
          return { applies: c[0].join('|'), category: c[1], want: c[2],
                   got: m(c[0], c[1]) === true }; }); })()`);
      const wrong = matchTable.filter((c) => c.got !== c.want);
      check('the match rule is one function in src/supports.js and it answers thirteen cases the way '
        + 'the work order describes — case, whitespace, plurals and both directions of narrowing all '
        + 'fire, `tests` against `Homework` and `art` against `Participation` do not, and an empty '
        + '`appliesTo` fires on everything including no category at all',
        matchTable.length === 13 && wrong.length === 0,
        matchTable.length + ' case(s), wrong = ' + JSON.stringify(wrong));

      /*
        AND IT NEVER PRINTS. The three gated print blocks already hide every child of <body> but
        their own surface, so what is left is a Ctrl+P made from the keyboard with this dialog open
        and no gate set — where the app prints the page as it stands. This asserts the one ungated
        rule that closes it, and asserts in the same breath that the rule hides ITSELF and not the
        app: the blank-sheet regression is what every other print rule in this tree is gated against.
      */
      await clickSel('#classTabBar [data-class-tab="c_wo38"]');
      await new Promise(r => setTimeout(r, 200));
      await clickSel('#classView [data-class-screen="assignments"]');
      await new Promise(r => setTimeout(r, 250));
      await clickSel('#assignmentsView [data-assignment-new]');
      await new Promise(r => setTimeout(r, 250));
      const beforePrint = await readPrompt();
      await send('Emulation.setEmulatedMedia', { media: 'print' });
      await new Promise(r => setTimeout(r, 200));
      const printed = await evalJs(`(function(){
        var d = function(sel){ var e = document.querySelector(sel);
          return e ? getComputedStyle(e).display : '(absent)'; };
        var gates = ['data-attendance-print','data-detail-print','data-grades-print']
          .filter(function(a){ return document.body.hasAttribute(a); });
        return { prompt: d('[data-accommodation-prompt]'), header: d('header.header'),
                 main: d('main'), modal: d('#assignmentModal'), gates: gates }; })()`);
      await send('Emulation.setEmulatedMedia', { media: '' });
      await new Promise(r => setTimeout(r, 200));
      check('a keyboard print with no gate set leaves the whole app on the page and takes the '
        + 'accommodation prompt off it — the one place in this app where "on screen" and "on paper" '
        + 'are allowed to differ',
        beforePrint.hidden === false && printed.gates.length === 0
          && printed.prompt === 'none' && printed.header !== 'none' && printed.main !== 'none'
          && printed.modal !== 'none',
        'prompt was up before the media change = ' + (beforePrint.hidden === false)
          + '; under print media ' + JSON.stringify(printed));
      await evalJs("window.planbook.closeModal('assignmentModal'); 1");
    }

    /*
      THE FIXTURE COMES BACK OUT — both classes, their seven students and the two assignments the
      "+ New assignment" taps above wrote — and the class this block found open is put back under it.
      THE PRESENTATION-MODE PREFERENCE IS PUT BACK to exactly the string this run found: this block
      flips it four times, and a run that left it on would suppress the fixtures of everything after
      it (WO-1.9's section states the rule). Written as one update rather than through the real
      Delete controls, for the reason the WO-3.5, WO-3.6 and WO-3.9 teardowns give: a fixture coming
      down is not a claim being made.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      if (!s.getDoc()) return 0;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){
          return x.id !== 'c_wo38' && x.id !== 'c_wo38b'; });
        doc.students = doc.students.filter(function(x){
          return String(x.id).indexOf('wo38-') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){
          return a.classId !== 'c_wo38' && a.classId !== 'c_wo38b'; });
      });
      var mode = ${JSON.stringify(mode38Was === undefined ? null : mode38Was)};
      if (mode === null) localStorage.removeItem('planbook_presentationMode');
      else localStorage.setItem('planbook_presentationMode', mode);
      var was = ${JSON.stringify(plant38.was || '')};
      if (was) c.selectClass(was);
      c.refreshClassBar();
      await s.flush();
      return 1; })()`);
    const mode38Left = await evalJs('window.planbook.supports.supportsVisible()');
    check('this section leaves the browser out of presentation mode, so nothing after it is reading '
      + 'a suppressed screen and calling it an absence',
      mode38Left === true, 'supportsVisible() = ' + mode38Left);

    /* Handed back as it was found: the block after this one drives clicks through element.click()
       rather than by coordinate, but a left-behind override would move every measurement in anything
       added after it without saying so. */
    await send('Emulation.clearDeviceMetricsOverride');
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await new Promise(r => setTimeout(r, 200));
  }
}
}
