/* past-due.mjs — the past-due prompt (WO-3.6)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeToday, tomorrow } from './lib-dates.mjs';
import { measureIn } from './touch-targets.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam } = h;

/* ───────── the past-due prompt (WO-3.6) ─────────
 *
 * Four acceptance lines, and every one of them is about something NOT changing — which is the shape
 * this file is worst at unless the fixture is built to say so. Three of the four are satisfied
 * perfectly by a build that draws no prompt at all, so the checks below are arranged in pairs: each
 * "nothing moved" reading is taken beside one that proves the screen was capable of moving, and the
 * accept at the foot of the section is the negative control for all of them — it moves a hand-computed
 * grade from 68.00% to 50.00% on the same rows the checks above assert are still.
 *
 * WHY THE FIXTURE IS TWO CLASSES. Acceptance line 2 is "the grade before accepting is identical to the
 * grade with the prompt never shown", and one class cannot hold both arms of that: the prompt has been
 * shown on it. So `c_wo36` and `c_wo36b` are twins — same weights, same points, same scores, the same
 * two past-due assignments — and the run dismisses the prompt on the second one and then RELOADS the
 * page, which is how a render where the prompt was never drawn is obtained rather than argued for. The
 * dismissal lives in localStorage (src/prefs.js's `pastDueDismissed`), so it is already true before the
 * document is open on the way back up.
 *
 * WHAT THE FIXTURE'S FIVE ASSIGNMENTS ARE FOR, because the count in the sentence is the claim:
 *
 *   wo36-past    due YESTERDAY, 20 points, Tests     — 2 blanks. Also carries the three cells that
 *                must NOT be swept: a scored one, an EXCUSED one and a LATE one with no score. An
 *                excused student swept into `missing` is a teacher's decision turned into a zero,
 *                which is the most expensive mistake available to this feature.
 *   wo36-past2   due YESTERDAY, 10 points, Homework  — 4 blanks, and the second assignment is what
 *                makes the prompt's per-assignment dismissal and its "In A and B" sentence testable.
 *   wo36-today   due TODAY                           — a date that has not gone by. 4 blanks, none of
 *                them past due. This is the off-by-one the whole feature turns on.
 *   wo36-soon    due TOMORROW                        — 5 blanks, none past due.
 *   wo36-nodate  NO DUE DATE                         — 5 blanks, and an empty due date is valid
 *                (src/assignments.js decision 1) and can never be past due.
 *
 * Two plus four is six, which is the work order's own sentence — "6 blanks are past due — mark them
 * missing?" — and it is asserted as that string rather than as a regex over a number, because the copy
 * is a deliverable.
 *
 * THE DATES ARE DERIVED IN NODE off the same machine clock, never asked of the app, for the reason
 * `nodeToday` above states at length: a check that asked the page what yesterday was would agree
 * perfectly with a build that read UTC.
 *
 * WHAT IS NOT HERE AND IS OWED TO A HUMAN: whether the three buttons are separately tappable under a
 * thumb, and whether a banner that appears above the grid on arrival reads as an offer rather than as
 * an error. The boxes are measured on an emulated coarse pointer below; no emulator has a thumb.
 */
console.log('\n--- the past-due prompt (WO-3.6) ---');
{
  const promptHost = await evalJs("document.querySelectorAll('[data-past-due]').length");
  const promptSeam = await evalJs("!!(window.planbook && window.planbook.store"
    + " && window.planbook.classes && window.planbook.gradeEngine)");

  if (!promptHost || !promptSeam) {
    check('the past-due prompt has a host on the screens that wear it', false,
      promptHost + ' element(s) carry [data-past-due] and the store seam is '
        + (promptSeam ? 'present' : 'absent') + ' — src/past-due.js paints into that hook, so its '
        + 'absence is a defect rather than a stage of the build');
    skip('the rest of WO-3.6 — the sentence, the review, Esc over the banner, the coarse pass, '
      + 'dismissing, the dismissal surviving four renders, the never-shown grade, and accept '
      + 'writing to exactly the previewed cells',
      'there is no prompt host to paint into, so nothing below could be driven the way a teacher '
        + 'would reach it');
  } else {
    /* Yesterday and tomorrow off this machine's clock, built the way `nodeToday` above is built and
       for the same reason. setDate() past either end of a month is the platform's own arithmetic,
       which is what makes this correct on the 1st and the 31st. */
    const nodeDay = (offset) => {
      const n = new Date();
      n.setDate(n.getDate() + offset);
      const p = (x) => (x < 10 ? '0' : '') + x;
      return n.getFullYear() + '-' + p(n.getMonth() + 1) + '-' + p(n.getDate());
    };
    const YESTERDAY = nodeDay(-1);
    const TOMORROW = nodeDay(1);
    const A = 'c_wo36', B = 'c_wo36b';

    /*
      THE FIXTURE, planted through the store rather than through the controls — the same departure
      the WO-3.5 and WO-3.9 sections make and for the same reason: ten students, two classes, ten
      assignments and eight score cells is twenty minutes of clicking that proves nothing this file
      has not proved elsewhere. What is DRIVEN is every part of this work order: the prompt is read
      off the screen, the review is opened with the real button, and the accept and the dismiss are
      real taps.
    */
    const plant = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return { ok:false, why:'no year document is open' };
      var mk = function(prefix){
        var students = [], roster = [];
        for (var i = 1; i <= 5; i++) {
          students.push({ id: prefix + '-s' + i, first:'Blank', last:'Row' + i });
          roster.push(prefix + '-s' + i);
        }
        return { students: students, roster: roster };
      };
      var work = function(prefix, termId, classId){
        return [
          { id: prefix + '-past', classId: classId, termId: termId, categoryId: prefix + '-tests',
            name:'Unit test', points:20, assigned:'', due:${JSON.stringify(YESTERDAY)} },
          { id: prefix + '-past2', classId: classId, termId: termId, categoryId: prefix + '-home',
            name:'Worksheet 4', points:10, assigned:'', due:${JSON.stringify(YESTERDAY)} },
          { id: prefix + '-today', classId: classId, termId: termId, categoryId: prefix + '-tests',
            name:'Pop quiz', points:20, assigned:'', due:${JSON.stringify(nodeToday)} },
          { id: prefix + '-soon', classId: classId, termId: termId, categoryId: prefix + '-tests',
            name:'Lab report', points:20, assigned:'', due:${JSON.stringify(TOMORROW)} },
          { id: prefix + '-nodate', classId: classId, termId: termId, categoryId: prefix + '-home',
            name:'Reading log', points:10, assigned:'', due:'' }
        ];
      };
      var a = mk('wo36'), b = mk('wo36b');
      var was = c.getSelectedClassId();
      var pref = localStorage.getItem('planbook_pastDueDismissed');
      s.update(function(doc){
        [['wo36', 'c_wo36', 'tm_wo36', a], ['wo36b', 'c_wo36b', 'tm_wo36b', b]]
          .forEach(function(pair){
            var prefix = pair[0], classId = pair[1], termId = pair[2], people = pair[3];
            doc.classes.push({ id: classId, name: prefix === 'wo36' ? 'WO-3.6 Past due'
              : 'WO-3.6 Twin', archived:false,
              terms:[{ id: termId, label:'WO-3.6 Term', start:'', end:'' }],
              categories:[{ id: prefix + '-tests', name:'Tests', weight:60 },
                          { id: prefix + '-home', name:'Homework', weight:40 }],
              roster: people.roster });
            people.students.forEach(function(st){ doc.students.push(st); });
            work(prefix, termId, classId).forEach(function(w){ doc.assignments.push(w); });
            if (!doc.scores) doc.scores = {};
            /* The three cells that must survive every tap below, and the one on an assignment that
               is not due yet. A blank is the ABSENCE of a key here, never a null with no flag. */
            doc.scores[prefix + '-past'] = {};
            doc.scores[prefix + '-past'][prefix + '-s2'] = { v: 15 };
            doc.scores[prefix + '-past'][prefix + '-s3'] = { v: null, flag: 'excused' };
            doc.scores[prefix + '-past'][prefix + '-s4'] = { v: null, flag: 'late' };
            doc.scores[prefix + '-past2'] = {};
            doc.scores[prefix + '-past2'][prefix + '-s1'] = { v: 8 };
            doc.scores[prefix + '-today'] = {};
            doc.scores[prefix + '-today'][prefix + '-s1'] = { v: 12 };
          });
      });
      c.selectClass('c_wo36');
      /* Counted off the document AFTER the update rather than off the arrays that went into it: what
         is being reported is what landed, which is the only version of it worth printing when this
         check goes red. */
      var made = s.getDoc();
      return { ok:true, was: was, pref: pref,
        classes: made.classes.filter(function(x){
          return x.id === 'c_wo36' || x.id === 'c_wo36b'; }).length,
        work: made.assignments.filter(function(x){
          return x.classId === 'c_wo36' || x.classId === 'c_wo36b'; }).length }; })()`);

    if (!plant.ok) {
      check('the WO-3.6 fixture is real: two twin classes, six past-due blanks, and three cells that '
        + 'must never be swept', false, plant.why);
    } else {
      /* Every score cell this section's fixture owns, as `assignment/student` → the cell's JSON.
         Flushed first, for tools/README.md trap 6: every save is debounced, so a read taken a moment
         after a tap can be looking at the document from before it. A flat map rather than the nested
         object because the claim "exactly the previewed cells" is a set difference. */
      const readCells = () => evalJs(`(async function(){ await window.planbook.store.flush();
        var d = window.planbook.store.getDoc();
        var sc = d.scores || {};
        var out = {}, mine = {};
        Object.keys(sc).forEach(function(a){
          Object.keys(sc[a]).forEach(function(s){
            out[a + '/' + s] = JSON.stringify(sc[a][s]);
            if (String(a).indexOf('wo36') === 0) mine[a + '/' + s] = JSON.stringify(sc[a][s]); }); });
        return { all: JSON.stringify(out), mine: mine,
                 keys: Object.keys(sc).filter(function(k){ return String(k).indexOf('wo36') === 0; }) };
      })()`);

      /* What the ENGINE says these students are worth, asked separately from the screen — the same
         split the WO-3.5 section makes, so a screen doing its own arithmetic cannot pass by agreeing
         with itself. */
      const engineGrades = (classId, termId, prefix) => evalJs(`(function(){
        var d = window.planbook.store.getDoc();
        var cls = d.classes.filter(function(c){ return c.id === ${JSON.stringify(classId)}; })[0];
        var out = [];
        for (var i = 1; i <= 5; i++) {
          var g = window.planbook.gradeEngine.weightedClassGrade(d, cls,
            ${JSON.stringify(termId)}, ${JSON.stringify(prefix)} + '-s' + i);
          out.push(g.percentage === null ? '—' : Number(g.percentage).toFixed(2) + '%');
        }
        return out; })()`);

      const READ = `(function(){
        var host = document.getElementById('scoresPastDue');
        var alt = document.getElementById('assignmentsPastDue');
        var view = document.getElementById('scoresView');
        if (!host || !view) return null;
        var rows = Array.prototype.slice.call(
          document.querySelectorAll('#scoresBody tr[data-score-row]'));
        var btns = Array.prototype.slice.call(host.querySelectorAll('button'));
        var chips = Array.prototype.slice.call(host.querySelectorAll('[data-past-due-cell]'));
        var heads = Array.prototype.slice.call(
          document.querySelectorAll('#scoresHead th[data-score-col]'));
        return {
          up: !host.classList.contains('hidden'),
          altUp: alt ? !alt.classList.contains('hidden') : null,
          altLead: alt ? ((alt.querySelector('.past-due-lead')||{}).textContent || '') : '',
          shown: !view.classList.contains('hidden'),
          /* A view lives in <main>. A dialog would not, and would carry the semantics beside it. */
          inMain: !!host.closest('main'),
          dialogBits: view.querySelectorAll('[role="dialog"], [aria-modal], .modal-overlay').length,
          openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
          lead: (host.querySelector('.past-due-lead')||{}).textContent || '',
          where: (host.querySelector('.past-due-where')||{}).textContent || '',
          labels: btns.map(function(b){ return (b.textContent||'').trim(); }),
          expanded: btns.length ? btns[0].getAttribute('aria-expanded') : '',
          previewed: chips.map(function(c){ return c.getAttribute('data-past-due-cell'); }),
          /* THE OVERDUE TINT ON A COLUMN HEAD (WO-3.19), read as ids rather than as a count — the
             acceptance line is about WHICH columns. The data-score-col attribute is on the head for
             exactly this reason (src/scores.js's columnHead), so nothing here maps a head position
             onto a cell position and then reports the wrong column when one is inserted.
             dueHeads is the vacuous-pass guard the two rules under tools/README.md's CDP traps ask
             for: a run where no head printed a due date at all would otherwise report "nothing is
             tinted" and look like a pass.
             (No backticks anywhere in this block — it is inside a template literal, and one of them
             ends the string thirty lines early with a syntax error that reads like a broken app.) */
          tinted: heads.filter(function(h){ return !!h.querySelector('.scores-col-due.overdue'); })
            .map(function(h){ return h.getAttribute('data-score-col'); }),
          dueHeads: heads.filter(function(h){ return !!h.querySelector('.scores-col-due'); })
            .map(function(h){ return h.getAttribute('data-score-col'); }),
          /* The ink, off the drawn element on each of the two screens that carry one. No hover rule
             on either sheet names the color property — the registry-style hover rules on both tables
             set a background and nothing else — so trap 7 does not reach this reading. */
          tintInk: (function(){ var t = document.querySelector('#scoresHead .scores-col-due.overdue');
            return t ? getComputedStyle(t).color : ''; })(),
          altTintInk: (function(){ var t = document.querySelector('#assignmentsView .assign-date.overdue');
            return t ? getComputedStyle(t).color : ''; })(),
          students: rows.map(function(r){ return r.getAttribute('data-score-row'); }),
          grades: rows.map(function(r){
            var n = r.querySelector('.scores-grade-num');
            return n ? n.textContent : (r.querySelector('.scores-grade-none') ? '—' : ''); }),
          missingGlyphs: Array.prototype.slice.call(
            document.querySelectorAll('#scoresBody .scores-flag.missing')).length
        }; })()`;

      const openClass = async (id) => {
        await clickSel('#classTabBar [data-class-tab="' + id + '"]');
        await new Promise(r => setTimeout(r, 250));
      };
      /* The strip is inside whichever view is up, so the source view is named rather than left to
         `[data-screen-nav]` — that selector matches the hidden views' strips too, and clicking a
         zero-sized box in a `display: none` view lands the pointer on whatever is at 0,0. */
      const goScreen = async (fromViewSel, name) => {
        await clickSel(fromViewSel + ' [data-class-screen="' + name + '"]');
        await new Promise(r => setTimeout(r, 300));
      };

      const planted = await readCells();
      check('the WO-3.6 fixture is real: two twin classes, five assignments each — one due yesterday, '
        + 'one due today, one due tomorrow and one with no date — and the excused, late and scored '
        + 'cells that must survive every tap below',
        plant.classes === 2 && plant.work === 10 && planted.keys.length === 6
          && planted.mine['wo36-past/wo36-s3'] === '{"v":null,"flag":"excused"}'
          && planted.mine['wo36-past/wo36-s4'] === '{"v":null,"flag":"late"}'
          && planted.mine['wo36-past/wo36-s2'] === '{"v":15}'
          && YESTERDAY < nodeToday && nodeToday < TOMORROW,
        plant.classes + ' class(es), ' + plant.work + ' assignment(s); score columns planted = ' + JSON.stringify(planted.keys) + '; yesterday ' + YESTERDAY
          + ' < today ' + nodeToday + ' < tomorrow ' + TOMORROW
          + '; the excused cell reads ' + planted.mine['wo36-past/wo36-s3']);

      /*
        ── THE COARSE PASS, TAKEN FIRST ──

        Before anything is accepted or dismissed, because after either of those there is no banner
        left on this fixture to measure. This is what a desk can say about the touch half: that the
        three controls on a prompt that is actually UP clear 44px. The standing WO-2.21 sweep opens
        every view and measures what it finds, and it cannot find these — it runs thousands of lines
        above this fixture, where no assignment in the document is past due, so the banner is not on
        screen to be walked. A sweep over nothing is the failure this block exists to close.
      */
      await send('Emulation.setDeviceMetricsOverride',
        { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await send('Page.reload');
      await new Promise(r => setTimeout(r, 700));
      await waitForBoot();
      await evalJs(KILL_ANIM);
      await evalJs(INSTALL_WALKER);
      const coarseHere = await evalJs("matchMedia('(pointer: coarse)').matches");
      await openClass(A);
      await goScreen('#classView', 'scores');
      const coarseRead = await evalJs(READ);
      const prompt44 = await evalJs(measureIn('#scoresPastDue'));
      const promptUnder = prompt44.filter((m) => m.h < 44 || m.w < 44);
      check('the prompt is DRAWN on a coarse pointer and all three of its controls measure >=44px — '
        + 'the review, the accept and the dismiss, on a banner that is actually up',
        coarseHere === true && !!coarseRead && coarseRead.up === true
          && prompt44.length === 3 && promptUnder.length === 0,
        'coarse pointer = ' + coarseHere + ', banner up = ' + (coarseRead && coarseRead.up)
          + '; measured ' + prompt44.length + ' control(s), under 44 = '
          + JSON.stringify(promptUnder));

      /* Back to a laptop for everything below: the rest of this section is about content, keys and
         document shape, and the sections after it expect the fine-pointer page the run arrived on. */
      await send('Emulation.setTouchEmulationEnabled', { enabled: false });
      await send('Emulation.setDeviceMetricsOverride',
        { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
      await send('Page.reload');
      await new Promise(r => setTimeout(r, 700));
      await waitForBoot();
      await evalJs(KILL_ANIM);
      await evalJs(INSTALL_WALKER);

      await openClass(A);
      await goScreen('#classView', 'scores');
      const arrived = await evalJs(READ);
      check('on opening the class gradebook the prompt is up and says the work order\'s own sentence '
        + 'word for word — "6 blanks are past due — mark them missing?" — and names both assignments '
        + 'it means, with the two that are not yet due and the one with no date named nowhere',
        !!arrived && arrived.up === true
          && arrived.lead === '6 blanks are past due — mark them missing?'
          && /Unit test/.test(arrived.where) && /Worksheet 4/.test(arrived.where)
          && !/Pop quiz|Lab report|Reading log/.test(arrived.where)
          && /no grade has changed/.test(arrived.where),
        'the banner reads ' + JSON.stringify(arrived && arrived.lead) + ' :: '
          + JSON.stringify((arrived && arrived.where || '').slice(0, 120)));

      check('and it is a BANNER IN THE VIEW rather than a dialog — inside <main>, with no role=dialog, '
        + 'no aria-modal and no overlay anywhere in the score grid, and nothing open over it',
        !!arrived && arrived.shown === true && arrived.inMain === true
          && arrived.dialogBits === 0 && arrived.openModals === 0
          && arrived.labels.length === 3
          && arrived.labels[0] === 'Review the 6'
          && arrived.labels[1] === 'Mark them missing'
          && arrived.labels[2] === 'Not now',
        'in <main> = ' + (arrived && arrived.inMain) + ', dialog bits = '
          + (arrived && arrived.dialogBits) + ', open modals = ' + (arrived && arrived.openModals)
          + ', buttons = ' + JSON.stringify(arrived && arrived.labels));

      /*
        WO-3.5'S ACCEPTANCE LINE 7, RE-ASSERTED OVER THE NEW BANNER. That work order shipped "Esc
        mid-column does not close the screen, because there is no dialog to close" as a tested claim,
        and the obvious build of this work order — a modal on arrival — would have broken it. Pressed
        twice, with the banner up and the caret in a score cell, exactly as that section presses it.
      */
      await clickSel('#scoresBody [data-score-cell="wo36-soon"][data-score-student="wo36-s1"]');
      await send('Input.dispatchKeyEvent',
        { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
          nativeVirtualKeyCode: 27, modifiers: 0 });
      await send('Input.dispatchKeyEvent',
        { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
          nativeVirtualKeyCode: 27, modifiers: 0 });
      await send('Input.dispatchKeyEvent',
        { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
          nativeVirtualKeyCode: 27, modifiers: 0 });
      await send('Input.dispatchKeyEvent',
        { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27,
          nativeVirtualKeyCode: 27, modifiers: 0 });
      await new Promise(r => setTimeout(r, 200));
      const afterEsc = await evalJs(READ);
      const escFocus = await evalJs(`(function(){ var a = document.activeElement;
        return a ? (a.getAttribute('data-score-student') || a.tagName) : '(nothing)'; })()`);
      check('Esc pressed twice with the prompt on screen closes nothing — the banner is still up, the '
        + 'grid is still up, no dialog appeared, and the caret is still in the cell it was in',
        !!afterEsc && afterEsc.up === true && afterEsc.shown === true
          && afterEsc.openModals === 0 && afterEsc.dialogBits === 0
          && escFocus === 'wo36-s1',
        'banner up = ' + (afterEsc && afterEsc.up) + ', grid up = ' + (afterEsc && afterEsc.shown)
          + ', open modals = ' + (afterEsc && afterEsc.openModals) + ', focus is in '
          + escFocus);

      /* The review, opened with the real button. The six rows carry their own cell ids, which is what
         makes "exactly the previewed cells" readable rather than a claim about a formatter's output. */
      await clickSel('#scoresPastDue [data-past-due-review]');
      await new Promise(r => setTimeout(r, 250));
      const reviewed = await evalJs(READ);
      const WANT = ['wo36-past/wo36-s1', 'wo36-past/wo36-s5',
        'wo36-past2/wo36-s2', 'wo36-past2/wo36-s3', 'wo36-past2/wo36-s4', 'wo36-past2/wo36-s5'];
      const previewedSet = (reviewed && reviewed.previewed ? reviewed.previewed : []).slice().sort();
      check('the review lists exactly the six cells the sentence counted — and the EXCUSED cell, the '
        + 'LATE blank, the scored cell, the assignment due today, the one due tomorrow and the one '
        + 'with no due date are none of them',
        !!reviewed && reviewed.expanded === 'true'
          && JSON.stringify(previewedSet) === JSON.stringify(WANT.slice().sort())
          && !previewedSet.some((k) => /wo36-today|wo36-soon|wo36-nodate/.test(k))
          && !previewedSet.some((k) => k === 'wo36-past/wo36-s3' || k === 'wo36-past/wo36-s4'
            || k === 'wo36-past/wo36-s2'),
        'previewed = ' + JSON.stringify(previewedSet));

      /*
        ── THE OVERDUE TINT ON A COLUMN HEAD (WO-3.19) ──

        Four acceptance lines, and they ride on THIS fixture rather than on one of their own because
        the third of them is an identity with the prompt's set — "exactly the assignments the banner's
        sentence names" — and two fixtures could only ever be compared for agreeing. The five
        assignments planted above are already the four cases the tint has to tell apart: due
        yesterday twice, due TODAY, due tomorrow, and no due date at all.

        THE TINTED SET IS COMPARED AGAINST THE PREVIEWED CELLS ON SCREEN, not against a list written
        here. The review is open at this point, so `previewed` is the six `assignment/student` keys a
        teacher could have read; the assignment half of those keys is what the banner is about, and
        that is what the heads have to match. A check that named `wo36-past` and `wo36-past2` itself
        would be re-deriving the answer and would agree with a build that tinted by its own clock.
      */
      const tintedIds = (reviewed && reviewed.tinted ? reviewed.tinted : []).slice().sort();
      const askedAbout = [...new Set((reviewed && reviewed.previewed ? reviewed.previewed : [])
        .map((k) => String(k).split('/')[0]))].sort();
      check('the overdue tint is on exactly the column heads the prompt is asking about — the same '
        + 'set the review just listed, taken off the screen rather than recomputed here — and the '
        + 'assignment due TODAY, the one due tomorrow and the one with no date are none of them, '
        + 'though three of those four columns do print a due date to tint',
        tintedIds.length === 2 && askedAbout.length === 2
          && JSON.stringify(tintedIds) === JSON.stringify(askedAbout)
          && reviewed.dueHeads.length === 4
          && reviewed.dueHeads.indexOf('wo36-today') !== -1
          && !tintedIds.some((id) => /wo36-today|wo36-soon|wo36-nodate/.test(id)),
        'tinted heads = ' + JSON.stringify(tintedIds) + ' :: the prompt is asking about '
          + JSON.stringify(askedAbout) + ' :: heads printing a due date = '
          + JSON.stringify(reviewed.dueHeads));

      /* The other surface this work order names — "on opening an assignment or a class gradebook".
         One module paints both hosts from one computed set, so the number cannot disagree between
         the two screens; this is that asserted rather than assumed. */
      await goScreen('#scoresView', 'assignments');
      const onList = await evalJs(READ);
      check('the same prompt, from the same set, is on the assignment list — the other screen the '
        + 'work order names — saying the same sentence',
        !!onList && onList.altUp === true
          && onList.altLead === '6 blanks are past due — mark them missing?',
        'the list\'s banner is up = ' + (onList && onList.altUp) + ' and reads '
          + JSON.stringify(onList && onList.altLead));

      /* WO-3.19's deliverable is "#8a6d1a, lifted rather than re-derived, and matching the assignment
         list's own overdue colour exactly", which is a claim about two stylesheets that a review of
         either one on its own cannot make. Both are read here, on this screen, because this is the
         one moment in the run where a tinted date exists on the list AND a tinted head exists on the
         grid behind it. Asserted as the resolved rgb() rather than as the hex, since that is what
         both sheets have to agree ON rather than agree about. */
      check('the tint is the assignment list\'s own overdue ink and the drawing\'s — rgb(138, 109, 26), '
        + 'which is #8a6d1a — on the score grid\'s column head and on the list\'s due date both, so '
        + 'the two screens carry one amber rather than two',
        !!onList && onList.tintInk === 'rgb(138, 109, 26)'
          && onList.altTintInk === 'rgb(138, 109, 26)',
        'the column head reads ' + JSON.stringify(onList && onList.tintInk) + ' and the assignment '
          + 'list\'s due date reads ' + JSON.stringify(onList && onList.altTintInk));

      await goScreen('#assignmentsView', 'scores');

      const beforeAnything = await evalJs(READ);
      const cellsBefore = await readCells();
      const engineA = await engineGrades(A, 'tm_wo36', 'wo36');

      /* WO-3.19's acceptance line 2 — the tint is a COLOUR AND NOT A MARK. The document is compared
         entire against the read taken when the fixture was planted, across every render the tint has
         been on screen for since: a coarse pass, two reloads, four navigations and an Esc. Taken over
         all of `scores` rather than over this fixture's own columns for the reason the dismissal
         check gives — a build that wrote somewhere else entirely would pass a narrower reading by
         being out of frame — and beside a reading that says the tint was actually drawn, or a build
         with no tint at all would pass it perfectly. */
      check('the tint writes NOTHING: with two column heads amber on screen, every score cell in the '
        + 'whole document is byte identical to what was planted, and all five grades still agree with '
        + 'the engine asked separately',
        beforeAnything.tinted.length === 2 && cellsBefore.all === planted.all
          && JSON.stringify(beforeAnything.grades) === JSON.stringify(engineA),
        'amber heads on screen = ' + JSON.stringify(beforeAnything.tinted)
          + '; scores byte-identical to the plant = ' + (cellsBefore.all === planted.all)
          + '; grades ' + JSON.stringify(beforeAnything.grades) + ' :: engine '
          + JSON.stringify(engineA));

      /*
        ACCEPTANCE LINE 1, ON THE TWIN. Dismiss is driven on `c_wo36b` rather than on the class the
        accept below needs, and the reading is taken over the WHOLE `scores` object rather than over
        this fixture's own cells: a build that wrote somewhere else entirely would pass a narrower
        check by being out of frame.
      */
      await openClass(B);
      await goScreen('#classView', 'scores');
      const twinUp = await evalJs(READ);
      const twinBefore = await readCells();
      const twinEngine = await engineGrades(B, 'tm_wo36b', 'wo36b');
      await clickSel('#scoresPastDue [data-past-due-dismiss]');
      await new Promise(r => setTimeout(r, 300));
      const twinAfter = await evalJs(READ);
      const twinCells = await readCells();
      check('dismissing the prompt changes NO SCORE — every score cell in the whole document is byte '
        + 'identical either side of the tap, this fixture\'s six columns included — and the banner goes',
        !!twinUp && twinUp.up === true && !!twinAfter && twinAfter.up === false
          && twinCells.all === twinBefore.all,
        'banner ' + (twinUp && twinUp.up) + ' -> ' + (twinAfter && twinAfter.up)
          + '; scores byte-identical = ' + (twinCells.all === twinBefore.all)
          + '; columns = ' + JSON.stringify(twinCells.keys));

      check('and it changes NO GRADE: all five displayed grades are the same strings after the '
        + 'dismissal as before it, and both agree with the engine asked separately',
        !!twinUp && !!twinAfter
          && JSON.stringify(twinAfter.grades) === JSON.stringify(twinUp.grades)
          && JSON.stringify(twinUp.grades) === JSON.stringify(twinEngine)
          && twinUp.grades.length === 5 && twinUp.grades[0] === '68.00%',
        'before ' + JSON.stringify(twinUp && twinUp.grades) + ' :: after '
          + JSON.stringify(twinAfter && twinAfter.grades) + ' :: engine '
          + JSON.stringify(twinEngine));

      const dismissedPref = await evalJs(
        "JSON.parse(localStorage.getItem('planbook_pastDueDismissed') || 'null')");
      check('what a dismissal DID write is one UI preference and nothing else — `planbook_pastDueDismissed` '
        + 'holds the twin\'s two assignment ids, and nothing from inside the document: no name, no due '
        + 'date, no student, no score',
        !!dismissedPref
          && JSON.stringify(Object.keys(dismissedPref).sort())
            === JSON.stringify(['wo36b-past', 'wo36b-past2'])
          && Object.keys(dismissedPref).every((k) => dismissedPref[k] === true),
        'planbook_pastDueDismissed = ' + JSON.stringify(dismissedPref));

      /*
        ACCEPTANCE LINE 4 — a dismissed prompt does not reappear on every render. Four renders, each
        one a real navigation: the repaint the dismissal itself did, a switch to the assignment list,
        a switch back to the grid, and a full page RELOAD, which is the one that tells a preference
        apart from a variable somebody set.
      */
      await goScreen('#scoresView', 'assignments');
      const twinList = await evalJs(READ);
      await goScreen('#assignmentsView', 'scores');
      const twinBack = await evalJs(READ);
      await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
      await send('Page.reload');
      await new Promise(r => setTimeout(r, 700));
      await waitForBoot();
      await evalJs(KILL_ANIM);
      await evalJs(INSTALL_WALKER);
      await openClass(B);
      await goScreen('#classView', 'scores');
      const twinReloaded = await evalJs(READ);
      check('a dismissed prompt does not come back on the next render, or the one after, or after a '
        + 'full page reload — four renders including a fresh boot, and it is down on all four',
        twinAfter.up === false && twinList.altUp === false && twinBack.up === false
          && !!twinReloaded && twinReloaded.up === false && twinReloaded.shown === true,
        'after the tap = ' + twinAfter.up + ', on the assignment list = ' + twinList.altUp
          + ', back on the grid = ' + twinBack.up + ', after a reload = '
          + (twinReloaded && twinReloaded.up));

      /* And it is per ASSIGNMENT rather than per browser, which is the half a build passes by
         switching the feature off. The other class's prompt is still up on the same reloaded page. */
      await openClass(A);
      await goScreen('#classView', 'scores');
      const stillAsking = await evalJs(READ);
      check('and the dismissal is per assignment rather than global: on the same reloaded page the '
        + 'other class\'s prompt is still up, still counting six',
        !!stillAsking && stillAsking.up === true
          && stillAsking.lead === '6 blanks are past due — mark them missing?',
        'the other class reads ' + JSON.stringify(stillAsking && stillAsking.lead));

      /*
        ACCEPTANCE LINE 2 — the grade before accepting is identical to the grade with the prompt never
        shown. The twin is that second arm: its prompt was dismissed before the reload, so the render
        being read has never drawn one, and the two classes hold identical work and identical scores.
        Both are also compared against the engine, which is what a grade IS.
      */
      check('the grade BEFORE accepting is identical to the grade on a render where the prompt was '
        + 'never drawn at all — the twin class, reloaded with its prompt already dismissed — and both '
        + 'agree with the engine',
        JSON.stringify(beforeAnything.grades) === JSON.stringify(engineA)
          && JSON.stringify(stillAsking.grades) === JSON.stringify(engineA)
          && JSON.stringify(twinReloaded.grades) === JSON.stringify(twinEngine)
          && JSON.stringify(engineA) === JSON.stringify(twinEngine),
        'with the prompt up ' + JSON.stringify(stillAsking.grades)
          + ' :: with it never shown ' + JSON.stringify(twinReloaded.grades)
          + ' :: engine ' + JSON.stringify(engineA));

      /*
        ACCEPTANCE LINE 3 — accept writes `{ v: null, flag: "missing" }` to exactly the previewed
        cells. The review is opened first so that what is compared is what a teacher could actually
        have read, and the previewed ids are taken off the SCREEN rather than out of the module.
      */
      await clickSel('#scoresPastDue [data-past-due-review]');
      await new Promise(r => setTimeout(r, 250));
      const beforeAccept = await evalJs(READ);
      const cellsPre = await readCells();
      await clickSel('#scoresPastDue [data-past-due-accept]');
      await new Promise(r => setTimeout(r, 400));
      const cellsPost = await readCells();
      const afterAccept = await evalJs(READ);

      const previewedOnScreen = beforeAccept.previewed.slice().sort();
      const changed = Object.keys(cellsPost.mine)
        .filter((k) => cellsPre.mine[k] !== cellsPost.mine[k])
        .concat(Object.keys(cellsPre.mine).filter((k) => !(k in cellsPost.mine)))
        .sort();
      check('accepting writes to EXACTLY the previewed cells — the set of score cells that changed is '
        + 'the set the review listed, with nothing added and nothing left out',
        previewedOnScreen.length === 6
          && JSON.stringify(changed) === JSON.stringify(previewedOnScreen),
        'previewed on screen ' + JSON.stringify(previewedOnScreen) + ' :: changed in the document '
          + JSON.stringify(changed));

      const written = previewedOnScreen.map((k) => cellsPost.mine[k]);
      const untouched = ['wo36-past/wo36-s2', 'wo36-past/wo36-s3', 'wo36-past/wo36-s4',
        'wo36-today/wo36-s1'];
      check('and what it wrote is `{ v: null, flag: "missing" }` in exactly that shape, six times — '
        + 'while the excused cell, the late blank, the scored cell and the cell on the assignment due '
        + 'today are byte identical to what they were',
        written.length === 6 && written.every((cell) => cell === '{"v":null,"flag":"missing"}')
          && untouched.every((k) => cellsPre.mine[k] === cellsPost.mine[k])
          && cellsPost.mine['wo36-past/wo36-s3'] === '{"v":null,"flag":"excused"}'
          && !Object.keys(cellsPost.mine).some((k) => /wo36-soon|wo36-nodate/.test(k)),
        'written = ' + JSON.stringify([...new Set(written)]) + '; the excused cell reads '
          + cellsPost.mine['wo36-past/wo36-s3'] + '; cells on the not-yet-due and undated '
          + 'assignments = ' + JSON.stringify(Object.keys(cellsPost.mine)
            .filter((k) => /wo36-soon|wo36-nodate/.test(k))));

      /*
        THE NEGATIVE CONTROL FOR EVERY "NOTHING MOVED" CHECK ABOVE, and the reason they are worth
        anything. Row 1's grade is hand-computed on both sides rather than asked of the engine: with
        the unit test blank it is Tests 12/20 = 60% at weight 60 and Homework 8/10 = 80% at weight 40,
        which is 68.00%; once the blank counts 0 out of 20 it is Tests 12/40 = 30%, which is 50.00%. A
        screen that could not move could have passed every check above.
      */
      check('and the grades MOVE when she accepts — row 1 from a hand-computed 68.00% to a '
        + 'hand-computed 50.00% — which is what makes every "nothing changed" reading above a claim '
        + 'rather than a screen that cannot move at all',
        beforeAccept.grades[0] === '68.00%' && afterAccept.grades[0] === '50.00%'
          && afterAccept.grades.filter((g, i) => g !== beforeAccept.grades[i]).length === 5,
        'row 1 ' + beforeAccept.grades[0] + ' -> ' + afterAccept.grades[0] + '; grades that moved = '
          + afterAccept.grades.filter((g, i) => g !== beforeAccept.grades[i]).length + ' of 5 ('
          + JSON.stringify(beforeAccept.grades) + ' -> ' + JSON.stringify(afterAccept.grades) + ')');

      check('after accepting there is nothing left to ask about, so the prompt goes — and the six '
        + 'cells wear the missing flag in the grid, where she can take any of them off again',
        !!afterAccept && afterAccept.up === false && afterAccept.missingGlyphs === 6
          && afterAccept.shown === true,
        'banner up = ' + (afterAccept && afterAccept.up) + ', missing glyphs in the grid = '
          + (afterAccept && afterAccept.missingGlyphs));

      /* WO-3.19's acceptance line 4, on the same render as the check above and out of the same
         reading: the thing the amber was reporting has stopped being true, so it goes with the
         banner. The two columns still carry their due dates — this is a colour coming off, not a
         head being emptied — and `beforeAccept` is the negative control that says they were amber a
         moment ago. */
      check('and the two column heads stop being amber on that same render, because their blanks are '
        + 'marked now — the dates are still printed, and it is only the tint that goes',
        beforeAccept.tinted.length === 2 && !!afterAccept && afterAccept.tinted.length === 0
          && JSON.stringify(afterAccept.dueHeads) === JSON.stringify(beforeAccept.dueHeads)
          && afterAccept.dueHeads.length === 4,
        'amber heads ' + JSON.stringify(beforeAccept.tinted) + ' -> '
          + JSON.stringify(afterAccept && afterAccept.tinted) + '; heads printing a due date '
          + JSON.stringify(beforeAccept.dueHeads) + ' -> '
          + JSON.stringify(afterAccept && afterAccept.dueHeads));
    }

    /*
      THE FIXTURE COMES BACK OUT — both classes, their ten students, their ten assignments and every
      score column under them — and the class this block found open is put back under it. The
      DISMISSAL PREFERENCE is put back too, to exactly the string this run found: it is the one check
      in this file that writes a `planbook_` key as a side effect of driving a control, and a run that
      left its own dismissals in the teacher's browser would silence a prompt about work she has not
      seen. Written as one update rather than through the real Delete controls, for the reason the
      WO-3.5 and WO-3.9 teardowns give: a fixture coming down is not a claim being made.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return 0;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){
          return x.id !== 'c_wo36' && x.id !== 'c_wo36b'; });
        doc.students = doc.students.filter(function(x){
          return String(x.id).indexOf('wo36') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){
          return a.classId !== 'c_wo36' && a.classId !== 'c_wo36b'; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (String(k).indexOf('wo36') === 0) delete doc.scores[k]; });
      });
      var pref = ${JSON.stringify(plant.pref === undefined ? null : plant.pref)};
      if (pref === null) localStorage.removeItem('planbook_pastDueDismissed');
      else localStorage.setItem('planbook_pastDueDismissed', pref);
      var was = ${JSON.stringify(plant.was || '')};
      if (was) c.selectClass(was);
      c.refreshClassBar();
      await s.flush();
      return 1; })()`);
  }
}
}
