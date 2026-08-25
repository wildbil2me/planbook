/* score-grid.mjs — the score entry grid (WO-3.5)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { measureIn } from './touch-targets.mjs';

export async function run(h) {
const { PORT, check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam } = h;

/* ───────── the score entry grid (WO-3.5) ─────────
 *
 * Ten acceptance lines, nine of which a desk can answer and one of which cannot. The one that
 * cannot is line 6 — "the grid is usable on an iPad in landscape" — and it stays a 👤 item in
 * TESTING.md however green this block runs; what is measured here is the half a laptop can see, on
 * an emulated coarse pointer, and none of it is the line.
 *
 * WHY THIS BLOCK OPENS THE VIEW BEFORE IT MEASURES ANYTHING, which is the whole reason it exists
 * rather than a handful of lines bolted onto the sweeps above. The standing 44px sweep collects
 * `button, input, ...` across the page and skips anything whose computed `display` is `none`;
 * `.hidden` is `display: none !important` (src/shell.css), and every view but the one on screen is
 * `.hidden`. So that sweep walked past ~250 score inputs and reported green — the same shape as the
 * backup-nag escape, a green run over a fixture that cannot express the failure. Worse, until the
 * correction round of 2026-08-10 nothing in this run COULD open the view: src/screen-nav.js still
 * shipped the Scores segment disabled, so the grid had no door at all. A check that cannot fail is
 * not a check, so the coarse pass below opens the grid through the real segment first and asserts it
 * is drawn before it measures one box.
 *
 * THE FIXTURE IS docs/grade-math-cases.md CASE 1, DRIVEN THROUGH THE KEYBOARD. A class of 25 with
 * Tests 50 / Quizzes 30 / Homework 20, its own four-band letter scale so that 87% is a B rather than
 * the document default's B+, and case 1's three assignments — plus seven empty ones, which change no
 * grade (an assignment with no cell for a student contributes 0/0) and are there so the grid is wider
 * than the viewport and the two frozen columns have something to be frozen against. Every score below
 * is typed as keystrokes AT THE PAGE, never assigned to `.value`: the claim is a keyboard path, and a
 * harness that sets values and dispatches `input` would be asserting that src/shell.js's listener
 * works, which is not what the acceptance line says.
 *
 * THE SCORES DIFFER PER ROW ON PURPOSE. A column of 25 identical numbers stores the same map whether
 * the build wrote it against the drawn row order or against the roster order, and this class's roster
 * is deliberately stored BACKWARDS from the order the grid sorts into. So the map is the claim: row i
 * gets 60 + i, and the check reads the students off the drawn rows.
 *
 * THE FIXTURE COMES BACK OUT at the foot of the block — the class, its students, its work and its
 * score columns — the way the assignments section takes its own down. Not a document snapshot, for a
 * reason particular to this block: it reloads the page twice, and a snapshot parked on `window` does
 * not survive a reload.
 */
console.log('\n--- the score entry grid (WO-3.5) ---');
{
  const scoreSeam = await evalJs("!!(window.planbook && window.planbook.scores"
    + " && typeof window.planbook.scores.renderScores === 'function'"
    + " && window.planbook.classes && window.planbook.gradeEngine && window.planbook.assignments)");

  if (!scoreSeam) {
    skip('the score grid: 25 down a column, Enter at the bottom, Esc mid-column, three flags, a '
      + 'cleared key, case 1 to the digit, the category move, and the weights crossing 100 both ways',
      'no window.planbook.scores seam on the page — it is kept deliberately so this file can read '
      + 'what a keystroke wrote, so its absence is a defect and not a stage of the build');
  } else {
    /* Back to a laptop before anything is measured: the sections above leave the browser on an
       emulated tablet, and eight of the checks below are about a keyboard. The coarse half of this
       block turns touch on again for itself. */
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await send('Emulation.setDeviceMetricsOverride',
      { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 700));
    await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);

    /* One key, dispatched AT THE PAGE rather than at an element, which is most of the claim — the
       same helper and the same reasoning as the WO-2.5 keyboard section above. A printable key needs
       `keyDown` with `text` or `e.key` arrives as the raw code; Enter, Escape, the arrows and
       Backspace take the `rawKeyDown` shape, which still reaches the editing pipeline. */
    /* `mods` is Input.dispatchKeyEvent's own bitmask — Alt 1, Ctrl 2, Meta 4, Shift 8 — and it is
       the whole of WO-3.23's evidence: a modifier that is only NAMED proves nothing about a seam
       whose defect was that only the name crossed it. It defaults to 0, so every call written
       before that work order still dispatches an unmodified key. */
    const sk = async (k, code, vk, text, mods = 0) => {
      const ev = { key: k, code: code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
        modifiers: mods };
      if (text) ev.text = text;
      await send('Input.dispatchKeyEvent',
        Object.assign({ type: text ? 'keyDown' : 'rawKeyDown' }, ev));
      await send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, ev));
      await new Promise(r => setTimeout(r, 45));
    };
    const skEnter = () => sk('Enter', 'Enter', 13);
    const skEsc = () => sk('Escape', 'Escape', 27);
    const skBack = () => sk('Backspace', 'Backspace', 8);
    const skUp = () => sk('ArrowUp', 'ArrowUp', 38);
    /* WO-3.16's pair, and they take the same `rawKeyDown` shape as Backspace above for the same
       reason it matters here: the check below needs the BROWSER's own caret movement when
       src/scores.js hands the key back, and that path is the one the cleared-cell check already
       proves reaches the editing pipeline. */
    const skRight = () => sk('ArrowRight', 'ArrowRight', 39);
    const skLeft = () => sk('ArrowLeft', 'ArrowLeft', 37);
    /* WO-3.23's pair of helpers: the four flags by name, and one arrow dispatched with them
       actually held down. `''` for `text` keeps the `rawKeyDown` shape the four above use — an
       arrow carries no text — so the only thing that differs from a plain press is the bitmask,
       which is exactly the difference under test. */
    const ALT = 1, CTRL = 2, META = 4, SHIFT = 8;
    const ARROW = { right: ['ArrowRight', 'ArrowRight', 39], left: ['ArrowLeft', 'ArrowLeft', 37],
      down: ['ArrowDown', 'ArrowDown', 40], up: ['ArrowUp', 'ArrowUp', 38] };
    const skHeld = (mods, dir) => sk(ARROW[dir][0], ARROW[dir][1], ARROW[dir][2], '', mods);
    const skLetter = (L) => sk(L, 'Key' + L, L.charCodeAt(0), L);
    const skDigits = async (n) => {
      for (const d of String(n).split('')) await sk(d, 'Digit' + d, d.charCodeAt(0), d);
    };
    /* One keystroke-group: the digits of a score, and the Enter that commits it and moves down. */
    const skScore = async (n) => { await skDigits(n); await skEnter(); };

    const A1 = 'wo35-a1', A2 = 'wo35-a2', A3 = 'wo35-a3', P1 = 'wo35-p1';
    const cellSel = (a, s) => '#scoresBody [data-score-cell="' + a + '"][data-score-student="'
      + s + '"]';
    const focusCell = (a, s) => clickSel(cellSel(a, s));

    /*
      THE FIXTURE. Planted through the store rather than through the controls, and that is the one
      place this block departs from the assignments section's rule of driving everything: 25 students,
      three categories, ten assignments and a per-class letter scale is twenty minutes of clicking
      that proves nothing this file has not proved elsewhere. Every SCORE — which is what this work
      order is about — is typed.
    */
    const plant = await evalJs(`(function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return { ok:false, why:'no year document is open' };
      var students = [], roster = [];
      for (var i = 1; i <= 25; i++) {
        var n = (i < 10 ? '0' : '') + i;
        students.push({ id:'wo35-s' + n, first:'Score', last:'Row' + n });
        roster.push('wo35-s' + n);
      }
      /* BACKWARDS. The grid sorts surname then first name (src/scores.js's gridOrder), so the drawn
         order is Row01..Row25 and the stored roster is the exact reverse of it. A column typed down
         the screen and written against the roster order would land twenty-five scores on the wrong
         twenty-five students and look perfectly fine doing it. */
      roster.reverse();
      var work = [
        { id:'wo35-a1', classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-tests',
          name:'Unit test', points:100, assigned:'', due:'2026-09-18' },
        { id:'wo35-a2', classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-quiz',
          name:'Quiz one', points:20, assigned:'', due:'' },
        { id:'wo35-a3', classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-home',
          name:'HW one', points:10, assigned:'', due:'' }
      ];
      /* Seven with nothing in them. An assignment with no cell for a student contributes 0/0, so
         these change no grade below — what they change is the WIDTH of the grid, which is what the
         two frozen columns exist for and what a three-column fixture could not have tested. */
      for (var j = 1; j <= 7; j++) {
        work.push({ id:'wo35-p' + j, classId:'c_wo35', termId:'tm_wo35', categoryId:'wo35-tests',
          name:'Filler ' + j, points:10, assigned:'', due:'' });
      }
      var was = c.getSelectedClassId();
      s.update(function(doc){
        doc.classes.push({ id:'c_wo35', name:'WO-3.5 Grid', archived:false,
          terms:[{ id:'tm_wo35', label:'WO-3.5 Term', start:'', end:'' }],
          categories:[{ id:'wo35-tests', name:'Tests', weight:50 },
                      { id:'wo35-quiz', name:'Quizzes', weight:30 },
                      { id:'wo35-home', name:'Homework', weight:20 }],
          /* Its own bands, so 87 is a B rather than the document default's B+ — which is the letter
             docs/grade-math-cases.md case 1 names, and the reason that file says "unless a case says
             otherwise". */
          letterScale:[{ letter:'A', min:90 }, { letter:'B', min:80 },
                       { letter:'C', min:70 }, { letter:'F', min:0 }],
          roster: roster });
        students.forEach(function(st){ doc.students.push(st); });
        work.forEach(function(a){ doc.assignments.push(a); });
      });
      /* Navigates and repaints the class bar, and deliberately paints no screen and no strip — which
         is why the tab is then clicked for real: that is the route that runs src/shell.js's chain. */
      c.selectClass('c_wo35');
      return { ok:true, rows: roster.length, columns: work.length, was: was,
        drawnFirst: 'wo35-s01', rosterFirst: roster[0] };
    })()`);

    if (!plant.ok) {
      check('the WO-3.5 fixture is real: a class of 25 with case 1\'s three weighted categories',
        false, plant.why);
    } else {
      await clickSel('#classTabBar [data-class-tab="c_wo35"]');
      await new Promise(r => setTimeout(r, 250));

      const READ = `(function(){
        var view = document.getElementById('scoresView');
        var body = document.getElementById('scoresBody');
        var head = document.getElementById('scoresHead');
        var rows = Array.prototype.slice.call(body.querySelectorAll('tr[data-score-row]'));
        var banner = document.getElementById('scoresNoGrade');
        var summary = document.getElementById('scoresSummary');
        var strip = document.querySelector('#scoresView [data-screen-nav]');
        var segs = strip ? Array.prototype.slice.call(strip.querySelectorAll('.screen-nav-btn')) : [];
        return {
          shown: !view.classList.contains('hidden'),
          classShown: !document.getElementById('classView').classList.contains('hidden'),
          /* A view lives in <main>. A dialog would not, and would carry the semantics beside it. */
          inMain: !!view.closest('main'),
          dialogBits: view.querySelectorAll('[role="dialog"], [aria-modal], .modal-overlay').length,
          openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
          headline: (document.getElementById('scoresHeadline')||{}).textContent,
          students: rows.map(function(r){ return r.getAttribute('data-score-row'); }),
          grades: rows.map(function(r){
            var n = r.querySelector('.scores-grade-num');
            return n ? n.textContent : (r.querySelector('.scores-grade-none') ? '—' : ''); }),
          letters: rows.map(function(r){
            var l = r.querySelector('.scores-grade-letter'); return l ? l.textContent : ''; }),
          heads: Array.prototype.slice.call(head.querySelectorAll('th.scores-col')).map(function(th){
            return { name: (th.querySelector('.scores-col-name')||{}).textContent,
                     chip: ((th.querySelector('.cat-chip')||{}).textContent||'')
                       .replace(/\\s+/g,' ').trim() }; }),
          summary: (summary ? summary.textContent : '').replace(/\\s+/g,' ').trim(),
          summaryPercent: ((summary ? summary.querySelector('b') : null)||{}).textContent || '',
          summaryLabel: ((summary ? summary.querySelector('span') : null)||{}).getAttribute
            ? summary.querySelector('span').getAttribute('aria-label') || '' : '',
          bannerUp: banner ? !banner.classList.contains('hidden') : null,
          bannerText: ((document.getElementById('scoresNoGradeText')||{}).textContent||'')
            .replace(/\\s+/g,' ').trim(),
          /* The word the owner's 2026-08-09 rule forbids ON A FIGURE, asked of the three surfaces
             that carry one and NOT of the whole view: the standing hint under the grid uses the word
             in order to tell the teacher it is never used, and a search of the view would go red
             about the sentence that states the rule. */
          provisional: /provisional/i.test(body.textContent)
            || /provisional/i.test(summary ? summary.textContent : '')
            || /provisional/i.test(banner ? banner.textContent : ''),
          segHooks: segs.map(function(b){ return b.getAttribute('data-class-screen'); }),
          segDisabled: segs.map(function(b){ return b.disabled; })
        }; })()`;

      /* Flushed before every read, for tools/README.md trap 6: every save is debounced, so a read
         taken a moment after a keystroke can be looking at the document from before it. */
      const readDoc = () => evalJs(`(async function(){ await window.planbook.store.flush();
        var d = window.planbook.store.getDoc();
        var sc = d.scores || {};
        /* Every cell in the WHOLE document that is a null with no flag — the shape acceptance line 4
           says must never be written — and every cell that is a bare number rather than an object.
           Asked of everything rather than of this fixture, so a second writer added later cannot pass
           by being somewhere else. */
        var nulls = [], bare = [];
        Object.keys(sc).forEach(function(a){
          Object.keys(sc[a]).forEach(function(s){
            var cell = sc[a][s];
            if (typeof cell !== 'object' || cell === null) { bare.push(a + '/' + s); return; }
            if ((cell.v === null || cell.v === undefined) && !cell.flag) nulls.push(a + '/' + s); }); });
        return { keys: Object.keys(sc), nulls: nulls, bare: bare,
                 a1: sc['wo35-a1'] ? JSON.stringify(sc['wo35-a1']) : null,
                 a1has: sc['wo35-a1'] ? Object.keys(sc['wo35-a1']) : [],
                 all: JSON.stringify(sc),
                 weights: JSON.stringify((d.classes.filter(function(c){
                   return c.id === 'c_wo35'; })[0] || {}).categories || []) }; })()`);

      const onClass = await evalJs(READ);
      check('the WO-3.5 fixture is real: a class of 25 opens on Attendance, and its roster is stored in the reverse of the order the grid draws',
        onClass.classShown && !onClass.shown && plant.rows === 25 && plant.columns === 10
          && plant.rosterFirst === 'wo35-s25',
        plant.rows + ' student(s), ' + plant.columns + ' assignment(s); the roster starts at '
          + plant.rosterFirst + ' where the grid draws ' + plant.drawnFirst + ' first');

      /*
        THE DOOR, which is defect 1 of the 2026-08-10 correction round. The grid shipped with the
        Scores segment disabled and carrying no `data-class-screen`, so nothing — not a teacher, not
        this file — could reach the view at all; index.html asserted that src/screen-nav.js needed no
        change for it, and that file had never been opened. One tap on the real segment is the claim.

        AND THE PREFERENCE IS STILL `class`, which is src/views.js's REMEMBERED_AS and the owner's
        rule that a class always reopens on Attendance. Asserted here rather than after a reload
        because the write happens on the way IN — showView() collapses every class screen to `class`
        as it stores it — which is the half a check made after a reload cannot tell from a read-side
        fix that left `scores` sitting in localStorage.
      */
      /*
        THE DOOR CHECK IS ALSO A GATE, and it is a gate because of what happened when this section
        was first negative-tested: with the Scores segment disabled again, clickSel found nothing,
        threw, and took the whole run down before it printed a summary. A missing fixture is a failed
        check in this file and never a crash — the roster block says so in as many words — so the
        hook is asked for before it is clicked, and everything below it is announced as SKIPPED
        rather than quietly not run. A skip is not a pass.
      */
      const doorOk = await evalJs("!!document.querySelector("
        + "'#classView [data-class-screen=\"scores\"]')");
      if (!doorOk) {
        check('the Scores segment is a live door: one tap lands on the grid, a view in <main> with no dialog anywhere in it, and the reload preference still says class',
          false,
          'the segment carries no data-class-screen hook — hooks '
            + JSON.stringify(onClass.segHooks) + ', disabled '
            + JSON.stringify(onClass.segDisabled)
            + '. Drawn and greyed is the state WO-3.5 shipped in and the 2026-08-10 correction round removed.');
        skip('the rest of WO-3.5 — 25 down a column, Enter at the bottom, Esc mid-column, the three flags, the cleared key, case 1 to the digit, the category move, the weights crossing 100 both ways, and the coarse-pointer sweep',
          'the grid has no door, so nothing below it could be driven the way a teacher would reach it');
      } else {
        await clickSel('#classView [data-class-screen="scores"]');
        await new Promise(r => setTimeout(r, 250));
        const opened = await evalJs(READ);
        const openView = await evalJs(
          "JSON.parse(localStorage.getItem('planbook_openView') || 'null')");
        check('the Scores segment is a live door: one tap lands on the grid, a view in <main> with no dialog anywhere in it, and the reload preference still says class',
          opened.shown && !opened.classShown && opened.inMain
            && opened.dialogBits === 0 && opened.openModals === 0
            /* Four hooks since WO-6.6 — the calendar joined the strip (plans/gradebook-surfaces.md
               carries the owner's reversal of THREE TABS, NOT FOUR with both its dates) — and FIVE
               since WO-4.2 put Signals on it. The list is asserted whole rather than by prefix so a
               segment appearing without a decision behind it still turns this red. */
            && opened.segHooks.join(',') === 'class,assignments,scores,calendar,signals'
            && opened.segDisabled.every((d) => d === false)
            && openView === 'class',
          'grid up = ' + opened.shown + ', in <main> = ' + opened.inMain + ', dialog bits = '
            + opened.dialogBits + ', segment hooks = ' + JSON.stringify(opened.segHooks)
            + ', disabled = ' + JSON.stringify(opened.segDisabled)
            + ', openView preference = ' + JSON.stringify(openView));

        /*
          WO-3.15: THE SAME CREATOR, ON THE GRID. The list button and this one are compared as
          markup before either is touched: same hook, class, label and dialog promise. The tap is on
          the grid's real control; the document read proves createAssignment() used the open class
          and term, and the editor's own field id proves it is the shared dialog rather than a copy.

          CANCEL IS THE PRE-EXISTING GAP THIS WORK ORDER FOUND. Before WO-3.15 the shared editor had
          Done, Delete and generic Close, and createAssignment() documented that dismissing it left
          an Untitled assignment behind. The explicit Cancel now belongs to that shared create flow,
          not to this grid door, so the same rule serves the assignment list too. It is driven here
          before a second create is committed, and both the document and the column count have to
          return byte-for-byte to their starting point.

          FOCUS RETURNS TO THE NEW-ASSIGNMENT BUTTON. renderScores() rebuilds the rows and columns but
          deliberately leaves #scoresActions standing, so modal.js's ordinary return-to-opener rule
          has a stable target. That is a useful landing place after both outcomes: the teacher can
          make the next column, reach Keys beside it, or Tab into the grid; body is not an answer.
        */
        const createDoors = await evalJs(`(function(){
          function read(sel){ var b = document.querySelector(sel); return b ? {
            hook: b.hasAttribute('data-assignment-new'), cls: b.className,
            label: (b.textContent || '').trim(), popup: b.getAttribute('aria-haspopup') } : null; }
          return { list: read('#assignmentsView [data-assignment-new]'),
                   grid: read('#scoresActions [data-assignment-new]') }; })()`);
        const gridCreateDoorOk = !!createDoors.list && !!createDoors.grid
          && JSON.stringify(createDoors.list) === JSON.stringify(createDoors.grid);
        let wo315Result = { pass:false, doors:createDoors };

        if (!gridCreateDoorOk) {
          skip('creating, cancelling and committing an assignment from the score grid',
            'the grid does not carry the shared New assignment button, so there is no real door to drive');
        } else {
          const createBaseline = await evalJs(`(function(){
            var d = window.planbook.store.getDoc(); var live = ${READ};
            return { ids:d.assignments.filter(function(a){ return a.classId === 'c_wo35'
                && a.termId === 'tm_wo35'; }).map(function(a){ return a.id; }),
              heads:live.heads, grades:live.grades }; })()`);
          await clickSel('#scoresActions [data-assignment-new]');
          await new Promise(r => setTimeout(r, 250));
          const createdFromGrid = await evalJs(`(function(){
            var d = window.planbook.store.getDoc();
            var mine = d.assignments.filter(function(a){ return a.classId === 'c_wo35'
              && a.termId === 'tm_wo35' && ${JSON.stringify(createBaseline.ids)}.indexOf(a.id) < 0; });
            var name = document.querySelector('#assignmentFields [data-assignment-field="name"]');
            return { count:mine.length, id:mine[0] ? mine[0].id : '',
              classId:mine[0] ? mine[0].classId : '', termId:mine[0] ? mine[0].termId : '',
              modalUp:!document.getElementById('assignmentModal').classList.contains('hidden'),
              editorId:name ? name.getAttribute('data-assignment-id') : '',
              focused:document.activeElement === name,
              cancelUp:!!document.querySelector('#assignmentModal [data-assignment-create-cancel]:not(.hidden)'),
              deleteUp:!!document.querySelector('#assignmentModal [data-assignment-delete]:not(.hidden)'),
              columns:document.querySelectorAll('#scoresHead th.scores-col').length,
              viewUp:!document.getElementById('scoresView').classList.contains('hidden') }; })()`);
          const createdPass = createdFromGrid.count === 1 && createdFromGrid.classId === 'c_wo35'
              && createdFromGrid.termId === 'tm_wo35' && createdFromGrid.modalUp
              && createdFromGrid.editorId === createdFromGrid.id && createdFromGrid.focused
              && createdFromGrid.cancelUp && !createdFromGrid.deleteUp
              && createdFromGrid.columns === createBaseline.heads.length + 1
              && createdFromGrid.viewUp;

          if (createdFromGrid.cancelUp) {
            await clickSel('#assignmentModal [data-assignment-create-cancel]');
            await new Promise(r => setTimeout(r, 250));
          }
          const afterCreateCancel = await evalJs(`(function(){
            var d = window.planbook.store.getDoc(); var live = ${READ};
            var active = document.activeElement;
            return { ids:d.assignments.filter(function(a){ return a.classId === 'c_wo35'
                && a.termId === 'tm_wo35'; }).map(function(a){ return a.id; }),
              scoreLeft:!!(d.scores && d.scores[${JSON.stringify(createdFromGrid.id)}]),
              heads:live.heads, grades:live.grades,
              modalUp:!document.getElementById('assignmentModal').classList.contains('hidden'),
              focusBack:!!active && active.matches('#scoresActions [data-assignment-new]') }; })()`);
          const cancelPass = createdFromGrid.cancelUp
              && JSON.stringify(afterCreateCancel.ids) === JSON.stringify(createBaseline.ids)
              && afterCreateCancel.scoreLeft === false
              && JSON.stringify(afterCreateCancel.heads) === JSON.stringify(createBaseline.heads)
              && JSON.stringify(afterCreateCancel.grades) === JSON.stringify(createBaseline.grades)
              && !afterCreateCancel.modalUp && afterCreateCancel.focusBack;

          await clickSel('#scoresActions [data-assignment-new]');
          await new Promise(r => setTimeout(r, 200));
          await evalJs(`(function(){
            var f = document.querySelector('#assignmentFields [data-assignment-field="name"]');
            if (!f) return 0; f.value = 'Exit ticket';
            f.dispatchEvent(new Event('input', { bubbles:true })); return 1; })()`);
          await new Promise(r => setTimeout(r, 250));
          const committedId = await evalJs(`(function(){
            var f = document.querySelector('#assignmentFields [data-assignment-field="name"]');
            return f ? f.getAttribute('data-assignment-id') : ''; })()`);
          const liveWhileEditing = await evalJs(READ);
          await clickSel('#assignmentModal .modal-actions [data-modal-close]');
          await new Promise(r => setTimeout(r, 250));
          const afterCreateCommit = await evalJs(`(function(){
            var d = window.planbook.store.getDoc(); var live = ${READ};
            var cells = Array.prototype.slice.call(document.querySelector('#scoresHead tr').children);
            var active = document.activeElement;
            return { assignment:d.assignments.filter(function(a){ return a.id === ${JSON.stringify(committedId)}; })[0] || null,
              heads:live.heads, grades:live.grades, viewUp:live.shown,
              gradeSecond:cells.length > 1 && cells[1].classList.contains('scores-grade')
                && cells[1].textContent.trim() === 'Grade',
              modalUp:!document.getElementById('assignmentModal').classList.contains('hidden'),
              focusBack:!!active && active.matches('#scoresActions [data-assignment-new]') }; })()`);
          const commitPass = !!afterCreateCommit.assignment
              && afterCreateCommit.assignment.classId === 'c_wo35'
              && afterCreateCommit.assignment.termId === 'tm_wo35'
              && liveWhileEditing.heads.some(function(h){ return h.name === 'Exit ticket'; })
              && afterCreateCommit.heads.some(function(h){ return h.name === 'Exit ticket'; })
              && afterCreateCommit.heads.length === createBaseline.heads.length + 1
              && JSON.stringify(afterCreateCommit.grades) === JSON.stringify(createBaseline.grades)
              && afterCreateCommit.viewUp && afterCreateCommit.gradeSecond
              && !afterCreateCommit.modalUp && afterCreateCommit.focusBack;

          /* Fixture cleanup: the create itself was the claim, and leaving its empty column in the
             ten-column fixture would change every count and width assertion below it. */
          await evalJs(`(function(){ var s = window.planbook.store;
            s.update(function(d){ d.assignments = d.assignments.filter(function(a){
              return a.id !== ${JSON.stringify(committedId)}; });
              if (d.scores) delete d.scores[${JSON.stringify(committedId)}]; });
            window.planbook.scores.renderScores(); return 1; })()`);
          wo315Result = { pass:createdPass && cancelPass && commitPass, doors:createDoors,
            created:createdFromGrid, cancelled:afterCreateCancel, committed:afterCreateCommit };
        }
        check('the grid wears the exact shared New assignment button; create opens the shared editor in the open class and term, Cancel leaves no row or column, and commit repaints with Grade beside it and focus back on the door',
          gridCreateDoorOk && wo315Result.pass,
          JSON.stringify(wo315Result));

        /*
          ACCEPTANCE LINE 1. Twenty-five scores down one column in twenty-five keystroke-groups, with no
          mouse — and "no mouse" is COUNTED rather than asserted by the harness not having called
          clickSel. A page-side listener installed after the arrival tap catches a build that needs a
          click between rows, which is exactly the failure the line is about.
        */
        await focusCell(A1, 'wo35-s01');
        await evalJs(`(function(){
          window.__wo35mouse = 0;
          window.__wo35count = function(){ window.__wo35mouse++; };
          ['mousedown','mouseup','click'].forEach(function(t){
            document.addEventListener(t, window.__wo35count, true); });
          return 1; })()`);
        for (let i = 1; i <= 25; i++) await skScore(60 + i);
        await new Promise(r => setTimeout(r, 150));
        const typed = await readDoc();
        const afterColumn = await evalJs(READ);
        const mouse = await evalJs('window.__wo35mouse');
        const wantColumn = {};
        afterColumn.students.forEach((id, i) => { wantColumn[id] = { v: 61 + i }; });
        check('twenty-five scores go down one column in twenty-five keystroke-groups with no mouse, and land on the students in DRAWN row order rather than in roster order',
          mouse === 0 && afterColumn.students.length === 25
            && typed.a1 === JSON.stringify(wantColumn)
            && afterColumn.students[0] === 'wo35-s01' && afterColumn.students[24] === 'wo35-s25',
          'mouse events during the column = ' + mouse + '; drawn order ran '
            + afterColumn.students[0] + ' → ' + afterColumn.students[24] + '; stored column = '
            + String(typed.a1).slice(0, 96) + ' …');

        /*
          ACCEPTANCE LINE 2. The twenty-fifth Enter above was pressed at the bottom of the column, so
          this reads what it did: the caret is still in the last cell, its value is selected so the next
          thing typed overtypes rather than appends, and the live region says which student and how many
          are in. A wrap would have put the teacher back at the top of a class she had just finished,
          where the next number overwrites the first student's mark.
        */
        const bottom = await evalJs(`(function(){ var a = document.activeElement;
          return { cell: a ? a.getAttribute('data-score-cell') : '',
                   student: a ? a.getAttribute('data-score-student') : '',
                   value: a ? a.value : '',
                   selected: a ? (a.selectionEnd - a.selectionStart) : -1,
                   said: (document.getElementById('srLive')||{}).textContent || '' }; })()`);
        check('Enter at the bottom of a column keeps the caret where it is with the value selected for overtyping, and says which student and how many are in',
          bottom.cell === A1 && bottom.student === 'wo35-s25' && bottom.value === '85'
            && bottom.selected === 2 && /last student/.test(bottom.said)
            && /25 of 25/.test(bottom.said),
          JSON.stringify(bottom));

        /*
          ACCEPTANCE LINE 7, proved by pressing the key rather than by arguing the screen is a view.
          Twice, two thirds of the way down, with a freshly typed digit in the field: nothing closes,
          nothing navigates, the caret does not move, what was typed survives and no dialog appears.
          There is no Escape binding in src/scores.js at all, which is what makes this true — so the
          check is written to fail against a build that added one "helpfully".
        */
        await focusCell(A1, 'wo35-s16');
        await skEnter();
        await skDigits(9);
        const escBefore = await evalJs(`(function(){ var a = document.activeElement;
          return { student: a.getAttribute('data-score-student'), value: a.value,
                   caret: a.selectionStart }; })()`);
        await skEsc();
        await skEsc();
        const escAfter = await evalJs(`(function(){ var a = document.activeElement;
          var view = document.getElementById('scoresView');
          return { student: a ? a.getAttribute('data-score-student') : '(focus left the grid)',
                   value: a ? a.value : '', caret: a ? a.selectionStart : -1,
                   shown: !view.classList.contains('hidden'),
                   openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length }; })()`);
        check('Esc pressed twice mid-column closes nothing and loses nothing — the screen is still up, the caret is in the same cell, and what was typed into it is still there',
          escAfter.shown && escAfter.openModals === 0
            && escBefore.student === 'wo35-s17' && escAfter.student === 'wo35-s17'
            && escBefore.value === '9' && escAfter.value === '9'
            && escAfter.caret === escBefore.caret,
          JSON.stringify(escBefore) + ' -> ' + JSON.stringify(escAfter));
        /* The 9 typed to give Esc something to lose comes back off and the row's own mark goes back on,
           through the keyboard like everything else, so the arithmetic below is case 1's and not this
           check's leftovers. */
        await skBack();
        await skDigits(77);

        /*
          ACCEPTANCE LINE 5. docs/grade-math-cases.md case 1, to the digit, on the row whose Tests mark
          the column above happened to make 80: Tests 80/100, Quizzes 18/20, Homework 10/10 against
          weights 50/30/20 is 87%, and this class's own bands make that a B. Both extra cells are typed
          through the keyboard like everything else, and the figure is read off the SCREEN — the engine
          is asked separately, so a screen doing its own arithmetic could not pass by agreeing with
          itself.
        */
        await focusCell(A3, 'wo35-s01');
        for (let i = 1; i <= 25; i++) await skScore(10);
        await focusCell(A2, 'wo35-s20');
        await skDigits(18);
        await new Promise(r => setTimeout(r, 150));
        const case1 = await evalJs(READ);
        const engine = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
          var cls = d.classes.filter(function(c){ return c.id === 'c_wo35'; })[0];
          var g = window.planbook.gradeEngine.weightedClassGrade(d, cls, 'tm_wo35', 'wo35-s20');
          return { percentage: g.percentage, letter: g.letter, reason: g.reason }; })()`);
        const row20 = case1.students.indexOf('wo35-s20');
        check('the displayed grade is docs/grade-math-cases.md case 1 to the digit — 87.00% and a B — and the screen and the engine agree about it',
          row20 >= 0 && case1.grades[row20] === '87.00%' && case1.letters[row20] === 'B'
            && engine.percentage === 87 && engine.letter === 'B' && engine.reason === null
            && case1.bannerUp === false && case1.provisional === false,
          'screen ' + case1.grades[row20] + ' ' + case1.letters[row20] + ' :: engine '
            + engine.percentage + ' ' + engine.letter);

        /* WO-3.14: the two percentage surfaces THIS fixture has on screen, asserted together —
           including the class average's accessible rendering — so their precision cannot drift
           independently.

           THE THIRD SURFACE THE WORK ORDER NAMED NOW EXISTS and is not asserted here, which is a
           choice rather than an omission. WO-3.7's per-student detail landed on 2026-08-12 and
           imports formatPercent() from src/scores.js rather than declaring its own, so there is one
           formatter and not three; the screen is measured at two places in § "one student's grade
           detail (WO-3.7)" at the foot of this file, against its own fixture. It is not measured
           HERE because this fixture's class is WO-3.5's 25-student grid and the detail screen is
           reached from a name — opening one from this section would be a second fixture inside a
           block that already has one. The name of this check said "does not exist yet" until that
           day, and a check name that has quietly gone false is a line nobody re-reads. */
        check('the grade column and class average use the same two-decimal precision (the per-student detail is the third surface, measured in its own section)',
          /^-?\d+\.\d{2}%$/.test(case1.grades[row20])
            && /^-?\d+\.\d{2}%$/.test(case1.summaryPercent)
            && /Class average -?\d+\.\d{2}%/.test(case1.summaryLabel),
          'grid ' + JSON.stringify(case1.grades[row20]) + ' :: summary '
            + JSON.stringify(case1.summaryPercent) + ' :: aria ' + JSON.stringify(case1.summaryLabel));

        /*
          ACCEPTANCE LINE 8, INHERITED FROM WO-3.3, and the box that only this claim can tick. The
          assignment moves from Tests (50%) to Homework (20%) through the real <select> in the real
          editor, and EVERY displayed grade in the class has to move on that keystroke — no weight
          changes, no score changes, and walking the weights across 100 could never have discharged it.

          Case 1's row goes 87.00% -> 86.73%: Quizzes keep 90% at 30, Homework becomes (80 + 10) / 110 =
          81.81…% at 20, Tests is empty so its 50 redistributes, and 90 x 30/50 + 81.81… x 20/50 =
          86.72…%. Hand-computed here rather than asked of the engine, for the reason the case above is:
          an engine and a screen that agree with each other and disagree with the arithmetic is exactly
          what this file exists to catch.

          THE EDITOR IS OPENED THROUGH THE SEAM, and that is the one exception in this block. WO-3.15
          did put a + New assignment button on this grid, but that control CREATES: nothing here opens
          the editor on an assignment that already exists, because data-assignment-edit is drawn on the
          assignment list's rows and nowhere else, and index.html says why there is no second door to
          that list. So no tap can get THIS assignment's dialog on screen over this view. What is
          DRIVEN is the part the acceptance line is about: the real <select>, the real `change` event,
          and src/shell.js's real hook.
        */
        const beforeMove = await evalJs(READ);
        const beforeDoc = await readDoc();
        await evalJs("window.planbook.assignments.openAssignmentEditor('wo35-a1'); 1");
        await new Promise(r => setTimeout(r, 250));
        const pickCategory = async (id) => {
          await evalJs(`(function(){
            var s = document.querySelector('#assignmentFields [data-assignment-category]');
            if (!s) return 0;
            s.value = ${JSON.stringify(id)};
            s.dispatchEvent(new Event('change', { bubbles: true }));
            return 1; })()`);
          await new Promise(r => setTimeout(r, 250));
        };
        await pickCategory('wo35-home');
        const afterMove = await evalJs(READ);
        const afterMoveDoc = await readDoc();
        const movedRows = afterMove.students.filter((id, i) =>
          afterMove.grades[i] !== beforeMove.grades[i]).length;
        const a1Head = afterMove.heads.filter((h) => h.name === 'Unit test')[0] || {};
        check('moving an assignment to another category moves EVERY displayed grade in the class on the keystroke — case 1\'s row 87.00% -> 86.73%, with no weight and no score touched',
          beforeMove.grades[row20] === '87.00%' && afterMove.grades[row20] === '86.73%'
            && movedRows === 25
            && /Homework/.test(a1Head.chip) && /20%/.test(a1Head.chip)
            && afterMoveDoc.all === beforeDoc.all
            && afterMoveDoc.weights === beforeDoc.weights,
          movedRows + ' of 25 displayed grades moved; case 1\'s row ' + beforeMove.grades[row20]
            + ' -> ' + afterMove.grades[row20] + '; that column head now reads '
            + JSON.stringify(a1Head.chip) + '; scores byte-identical = '
            + (afterMoveDoc.all === beforeDoc.all) + ', weights byte-identical = '
            + (afterMoveDoc.weights === beforeDoc.weights));

        /* And back, through the same control — the half of a move a build can get right on the way out
           and wrong on the way home, and it puts case 1 back for the two checks below. */
        await pickCategory('wo35-tests');
        await evalJs("window.planbook.closeModal('assignmentModal'); 1");
        await new Promise(r => setTimeout(r, 200));
        const backAgain = await evalJs(READ);
        check('and moving it back restores every displayed grade, so the chain runs in both directions rather than only on the way out',
          backAgain.grades[row20] === '87.00%'
            && JSON.stringify(backAgain.grades) === JSON.stringify(beforeMove.grades),
          'case 1\'s row is ' + backAgain.grades[row20] + ' again, and all 25 match = '
            + (JSON.stringify(backAgain.grades) === JSON.stringify(beforeMove.grades)));

        /*
          ACCEPTANCE LINES 9 AND 10, INHERITED FROM WO-3.1 — the weights taken off 100 and put back,
          through the real weight field in the real categories editor, reached from the class manager
          the way a teacher reaches it. The banner has to stand where the number was and NAME the total;
          no grade may be shown at all; and the word "provisional" may appear on no figure.

          The disappearing half first, which is the one the work order warns a build can pass while
          getting wrong.
        */
        await clickSel('header [data-class-manage]');
        await new Promise(r => setTimeout(r, 350));
        await clickSel('#classList [data-category-manage="c_wo35"]');
        await new Promise(r => setTimeout(r, 350));
        const typeWeight = async (v) => {
          await evalJs(`(function(){
            var f = document.querySelector('#categoryList [data-category-id="wo35-tests"]'
              + '[data-category-field="weight"]');
            if (!f) return 0;
            f.value = ${JSON.stringify(String(v))};
            f.dispatchEvent(new Event('input', { bubbles: true }));
            return 1; })()`);
          await new Promise(r => setTimeout(r, 250));
        };
        await typeWeight(40);
        const unbalanced = await evalJs(READ);
        check('no grade is shown at all while the weights do not total 100, the banner stands where the number was and names the total, and no figure wears a "provisional" label',
          unbalanced.bannerUp === true && /90%/.test(unbalanced.bannerText)
            && /not 100%/.test(unbalanced.bannerText)
            && unbalanced.grades.length === 25 && unbalanced.grades.every((g) => g === '—')
            && unbalanced.letters.every((l) => l === '')
            && /Class average —/.test(unbalanced.summary)
            && unbalanced.provisional === false,
          'banner up = ' + unbalanced.bannerUp + ' :: '
            + JSON.stringify(unbalanced.bannerText.slice(0, 96)) + ' :: distinct grade cells = '
            + JSON.stringify([...new Set(unbalanced.grades)]) + ' :: '
            + JSON.stringify(unbalanced.summary.slice(0, 64)));

        await typeWeight(50);
        const balanced = await evalJs(READ);
        check('and the grades come back the moment the weights reach 100 again — the crossing works in both directions, with the categories panel still open over the grid',
          balanced.bannerUp === false && balanced.grades[row20] === '87.00%'
            && balanced.letters[row20] === 'B'
            && JSON.stringify(balanced.grades) === JSON.stringify(beforeMove.grades)
            && /Weights total 100%/.test(balanced.summary),
          'banner up = ' + balanced.bannerUp + ', case 1\'s row is ' + balanced.grades[row20] + ' '
            + balanced.letters[row20] + ', and all 25 match = '
            + (JSON.stringify(balanced.grades) === JSON.stringify(beforeMove.grades)));
        await evalJs("window.planbook.closeModal('categoriesModal');"
          + "window.planbook.closeModal('classesModal'); 1");
        await new Promise(r => setTimeout(r, 250));

        /*
          ACCEPTANCE LINE 3. The three flags, set from the keyboard, read back as COMPUTED STYLE rather
          than as class names: the claim is that a teacher can tell them apart, and a class name on an
          element whose rule was deleted is a class name that says nothing. Four ways apart — the fill,
          the border, the corner glyph and the accessible name — and blank has none of them, because a
          blank that is styled is a blank that looks like a state somebody chose.

          The caret is parked on a fourth cell before the read: `.scores-input:focus` carries a wash of
          its own, and measuring a flag on the cell that still has focus would be measuring the two
          rules together.
        */
        await focusCell(A1, 'wo35-s01');
        await skLetter('L');
        await focusCell(A1, 'wo35-s02');
        await skLetter('M');
        await focusCell(A1, 'wo35-s03');
        await skLetter('X');
        await focusCell(A1, 'wo35-s10');
        const flags = await evalJs(`(function(){
          var pick = function(a, s){
            var e = document.querySelector('#scoresBody [data-score-cell="' + a
              + '"][data-score-student="' + s + '"]');
            if (!e) return null;
            var st = getComputedStyle(e);
            var glyph = e.parentElement ? e.parentElement.querySelector('.scores-flag') : null;
            return { bg: st.backgroundColor, border: st.borderTopColor, ink: st.color,
                     glyph: glyph ? glyph.textContent : '', label: e.getAttribute('aria-label') || '',
                     placeholder: e.placeholder, value: e.value }; };
          return { late: pick('wo35-a1','wo35-s01'), missing: pick('wo35-a1','wo35-s02'),
                   excused: pick('wo35-a1','wo35-s03'), blank: pick('wo35-p2','wo35-s01') }; })()`);
        const four = [flags.late, flags.missing, flags.excused, flags.blank];
        check('late, missing and excused are three distinct fills, three distinct borders, three distinct glyphs and three distinct accessible names — and blank wears none of them',
          four.every((f) => !!f)
            && new Set(four.map((f) => f.bg)).size === 4
            && new Set(four.map((f) => f.border)).size === 4
            && flags.late.glyph === 'L' && flags.missing.glyph === 'M' && flags.excused.glyph === 'X'
            && flags.blank.glyph === ''
            && / — late$/.test(flags.late.label) && / — missing$/.test(flags.missing.label)
            && / — excused$/.test(flags.excused.label) && !/ — /.test(flags.blank.label)
            && flags.missing.value === '' && flags.excused.value === ''
            && flags.missing.placeholder === '0' && flags.excused.placeholder === 'Ex'
            && flags.blank.placeholder === '—',
          'fills ' + JSON.stringify(four.map((f) => f && f.bg)) + ' :: borders '
            + JSON.stringify(four.map((f) => f && f.border)) + ' :: glyphs '
            + JSON.stringify(four.map((f) => f && f.glyph)));

        /*
          ACCEPTANCE LINE 4, and it is the one no screenshot can answer: a cleared cell and a cell
          holding `{ v: null }` with no flag look identical on the grid and grade identically too. Two
          halves, because writeCell() makes two promises. The cell's key goes; and when the last cell in
          a column goes, the COLUMN's key goes with it, rather than leaving an empty object under an
          assignment id that every later reader would have to know about.

          Both cells are arrived at with a key rather than a click, so the value is SELECTED on arrival
          and one Backspace is the whole clear — which is also how a teacher fixing a column does it.
        */
        await focusCell(A1, 'wo35-s03');
        await skEnter();
        await skBack();
        await new Promise(r => setTimeout(r, 150));
        /* And a column with exactly one cell in it, so that its last cell leaving is the column
           leaving. wo35-p1 has never been typed into. */
        await focusCell(P1, 'wo35-s01');
        await skScore(7);
        const withColumn = await readDoc();
        await skUp();
        await skBack();
        await new Promise(r => setTimeout(r, 150));
        const cleared = await readDoc();
        check('clearing a cell deletes its key rather than storing a null with no flag, the last cell out takes the empty column key with it, and no such null exists anywhere in the document',
          cleared.a1has.indexOf('wo35-s04') === -1
            && cleared.a1has.length === 24
            && withColumn.keys.indexOf('wo35-p1') >= 0
            && cleared.keys.indexOf('wo35-p1') === -1
            && cleared.nulls.length === 0 && cleared.bare.length === 0,
          'the cleared student is still in the column = ' + (cleared.a1has.indexOf('wo35-s04') !== -1)
            + ' with ' + cleared.a1has.length + ' cell(s) left; the one-cell column went from present ('
            + (withColumn.keys.indexOf('wo35-p1') >= 0) + ') to present ('
            + (cleared.keys.indexOf('wo35-p1') >= 0) + '); nulls with no flag anywhere = '
            + JSON.stringify(cleared.nulls) + '; bare numbers anywhere = '
            + JSON.stringify(cleared.bare));

        /*
          ── WO-3.16: THE HORIZONTAL PAIR, AND THE CARET RULE THAT DECIDES WHO OWNS THE KEY ──

          Three checks inside this section rather than in one of their own, because they need what
          this fixture already is: twenty-five rows, ten drawn columns, and scores typed into them
          from the keyboard. They sit at the FOOT of it deliberately — every arithmetic claim above
          is made against case 1's row, and the third of these types a correction into a cell in
          order to press `←` inside it. Row s12 is used rather than case 1's s20 so that nothing
          above can be disturbed by what happens down here.

          THE MIDDLE COLUMN IS FILLED FIRST. A row needs three ADJACENT numbers before "moved one
          column and selected the value" can be told apart from "moved somewhere and found
          something": wo35-a2 holds one cell in this fixture and it belongs to s20.

          ACCEPTANCE LINE 3 IS THE REASON THIS IS DRIVEN AND NOT REASONED ABOUT. The claim is that a
          real `←` at a partly corrected number reaches the CARET rather than the grid, and that is a
          claim about what src/shell.js does with handleScoreKey()'s return value. Setting
          `selectionStart` from script and calling the handler would be asserting the rule against
          itself; every keystroke below goes at the page like the rest of this section's.
        */
        await focusCell(A2, 'wo35-s12');
        await skDigits(15);
        /* Arrived at with a key, so the value is SELECTED — the state a teacher is in after Enter,
           and the one the caret rule reads as "ready to overtype" rather than as a caret position
           somebody chose. */
        await focusCell(A1, 'wo35-s11');
        await skEnter();

        /* Where the caret is, which cell it is in, and WHERE THAT CELL IS ALONG THE DRAWN ROW —
           an index rather than an id, because "one assignment right" is a claim about the order on
           screen and an id comparison would still pass if the grid drew its columns in another
           order. */
        const ROW12 = `(function(){
          var a = document.activeElement;
          var row = Array.prototype.slice.call(document.querySelectorAll(
            '#scoresBody tr[data-score-row="wo35-s12"] [data-score-cell]'));
          return { cell: a ? a.getAttribute('data-score-cell') : '',
                   student: a ? a.getAttribute('data-score-student') : '',
                   index: row.indexOf(a), columns: row.length,
                   value: a ? a.value : '',
                   from: a ? a.selectionStart : -1, to: a ? a.selectionEnd : -1 }; })()`;

        const atFirst = await evalJs(ROW12);
        await skRight();
        const right1 = await evalJs(ROW12);
        await skRight();
        const right2 = await evalJs(ROW12);
        check('ArrowRight from a full cell moves one assignment right along the drawn row, same student, with the arrived-at value selected for overtyping',
          atFirst.columns === 10 && atFirst.index === 0 && atFirst.cell === A1
            && atFirst.value === '72'
            && right1.index === 1 && right1.student === 'wo35-s12' && right1.value === '15'
            && right1.from === 0 && right1.to === right1.value.length
            && right2.index === 2 && right2.student === 'wo35-s12' && right2.value === '10'
            && right2.from === 0 && right2.to === right2.value.length,
          JSON.stringify(atFirst) + ' -> ' + JSON.stringify(right1) + ' -> '
            + JSON.stringify(right2));

        await skLeft();
        const left1 = await evalJs(ROW12);
        await skLeft();
        const left2 = await evalJs(ROW12);
        /* "SAYS SO ONCE" IS COUNTED, not inferred from what the region holds afterwards: the live
           region is REPLACED on every announcement (src/live-region.js), so a second sentence would
           leave exactly one textContent behind and read as a single one. Every non-empty write
           between the press and the read is collected instead. */
        await evalJs(`(function(){
          window.__wo316said = [];
          var el = document.getElementById('srLive');
          window.__wo316obs = new MutationObserver(function(){
            var t = (el.textContent || '').trim();
            if (t) window.__wo316said.push(t); });
          window.__wo316obs.observe(el, { childList: true, characterData: true, subtree: true });
          return 1; })()`);
        const beforeClamp = await readDoc();
        await skLeft();
        const clamped = await evalJs(ROW12);
        const saidAtEdge = await evalJs('(function(){ window.__wo316obs.disconnect();'
          + ' return window.__wo316said; })()');
        const afterClamp = await readDoc();
        check('ArrowLeft at the first assignment clamps rather than wrapping — the caret and its selection do not move, no score is written, and the live region says so exactly once',
          left1.index === 1 && left2.index === 0 && left2.cell === A1
            && clamped.index === 0 && clamped.cell === A1 && clamped.student === 'wo35-s12'
            && clamped.value === left2.value && clamped.from === left2.from
            && clamped.to === left2.to
            && saidAtEdge.length === 1 && /^Score Row12: /.test(saidAtEdge[0])
            && /that is the first assignment\.$/.test(saidAtEdge[0])
            && afterClamp.all === beforeClamp.all,
          JSON.stringify(left2) + ' -> ' + JSON.stringify(clamped) + '; said '
            + JSON.stringify(saidAtEdge) + '; scores byte-identical = '
            + (afterClamp.all === beforeClamp.all));

        /*
          ACCEPTANCE LINE 3, at the cell one column IN from the edge — so there is a column to the
          left for a build that stole the key to land on, which is what makes this fail rather than
          pass by geography. 15 is corrected to 100 the way a teacher does it, over the selection,
          which collapses the caret to the end of what she typed; the two `←` presses after it are
          the caret's, and the cell must still be the one she is correcting.
        */
        await skRight();
        await skDigits(100);
        const typedIn = await evalJs(ROW12);
        await skLeft();
        const caret1 = await evalJs(ROW12);
        await skLeft();
        const caret2 = await evalJs(ROW12);
        const midEdit = await readDoc();
        const midCell = (JSON.parse(midEdit.all)[typedIn.cell] || {})['wo35-s12'] || null;
        check('with the caret mid-value ArrowLeft moves the caret and not the cell — driven with real keystrokes at a partly corrected number, with a column to its left it does not take',
          typedIn.index === 1 && typedIn.value === '100'
            && typedIn.from === 3 && typedIn.to === 3
            && caret1.index === 1 && caret1.cell === typedIn.cell && caret1.value === '100'
            && caret1.from === 2 && caret1.to === 2
            && caret2.index === 1 && caret2.cell === typedIn.cell && caret2.value === '100'
            && caret2.from === 1 && caret2.to === 1
            && !!midCell && midCell.v === 100,
          JSON.stringify(typedIn) + ' -> ' + JSON.stringify(caret1) + ' -> '
            + JSON.stringify(caret2) + '; stored ' + JSON.stringify(midCell));

        /*
          AND THE RIGHT EDGE, which the three checks above never press. *"That is the last
          assignment"* is named in the work order's own Deliverables, and until this check it
          existed only as the `step > 0` arm of a ternary inside moveAcrossRow() — the half of the
          clamp no keystroke had ever reached, so a build that announced the wrong end (or nothing)
          on the right would have gone green.

          WALKED OUT TO THE EDGE WITH THE KEY rather than with a click, because a click puts the
          caret where the coordinate landed and this is a claim about a caret with nowhere left to
          go. The first presses are still the CARET's — it is sitting at 1 inside `100` from the
          check above — and every press after that is a column, which is why the walk is a capped
          loop against the drawn index rather than a counted number of presses.
        */
        let atLastCol = await evalJs(ROW12);
        let stepsRight = 0;
        while (atLastCol.index >= 0 && atLastCol.index < atLastCol.columns - 1 && stepsRight < 20) {
          await skRight();
          atLastCol = await evalJs(ROW12);
          stepsRight++;
        }
        await evalJs(`(function(){
          window.__wo316said = [];
          var el = document.getElementById('srLive');
          window.__wo316obs = new MutationObserver(function(){
            var t = (el.textContent || '').trim();
            if (t) window.__wo316said.push(t); });
          window.__wo316obs.observe(el, { childList: true, characterData: true, subtree: true });
          return 1; })()`);
        const beforeRightEdge = await readDoc();
        await skRight();
        const rightClamped = await evalJs(ROW12);
        const saidAtRight = await evalJs('(function(){ window.__wo316obs.disconnect();'
          + ' return window.__wo316said; })()');
        const afterRightEdge = await readDoc();
        check('ArrowRight at the last assignment clamps the same way and says THAT end — "that is the last assignment", exactly once, with nothing moved and nothing written',
          atLastCol.columns === 10 && atLastCol.index === atLastCol.columns - 1
            && rightClamped.index === atLastCol.index && rightClamped.cell === atLastCol.cell
            && rightClamped.student === 'wo35-s12'
            && rightClamped.value === atLastCol.value && rightClamped.from === atLastCol.from
            && rightClamped.to === atLastCol.to
            && saidAtRight.length === 1 && /^Score Row12: /.test(saidAtRight[0])
            && /that is the last assignment\.$/.test(saidAtRight[0])
            && afterRightEdge.all === beforeRightEdge.all,
          stepsRight + ' press(es) out to ' + JSON.stringify(atLastCol) + ' -> '
            + JSON.stringify(rightClamped) + '; said ' + JSON.stringify(saidAtRight)
            + '; scores byte-identical = ' + (afterRightEdge.all === beforeRightEdge.all));

        /*
          ── WO-3.23: THE MODIFIERS, WHICH UNTIL THIS WORK ORDER DID NOT CROSS THE SEAM ──

          `src/shell.js` handed `handleScoreKey()` a key NAME and nothing else, so `Shift`+`→` and a
          bare `→` arrived as the same string and were answered the same way — and where the grid
          answers yes it also `preventDefault()`s, so the browser's own selection never happened.

          EVERY PRESS BELOW HOLDS THE MODIFIER DOWN, through `Input.dispatchKeyEvent`'s bitmask, and
          that is the whole of the evidence rather than a detail of it. A check that called
          `handleScoreKey('ArrowRight', cell)` would be RE-TYPING the defect instead of measuring
          it: only the name ever crossed, so a synthesised name passes on the fixed build and the
          broken one alike. ALL FIVE WENT RED ON THE PRE-WO-3.23 TREE — they were written first and
          the run read `795 checks · 790 passed · 5 failed` — but read that with the Ctrl and Cmd
          one's own comment beside it: four of the five fail on their own claim, and the fifth fails
          only because a stolen `Shift`+`←` earlier in the walk has carried it onto the wrong cell.
          Cascade, not independent evidence.

          ONE WALK ACROSS ONE CELL, and the order is load-bearing: each step leaves the caret where
          the next one needs it, and every intermediate reading is asserted rather than assumed.
          `wo35-a2` — column index 1, holding `100` from the check above — is used rather than index
          0 so that a build which stole the key HAS SOMEWHERE TO GO. At the first assignment
          moveAcrossRow() clamps, the cell would not change either way, and the check would pass by
          geography rather than by behaviour, which is the trap the check above this one names.

          WHAT THE BROWSER ITSELF DOES at each caret position was MEASURED before these assertions
          were written — a bare `<input value="100">` in this same headless build, driven with the
          same helper — rather than assumed from what a text field "should" do. Two of those
          measurements are worth having in front of you, because they are why two of these checks
          assert that NOTHING moved: with the caret collapsed at the end of the value there is
          nothing to the right for `Shift`+`→` to extend over, and at position 0 there is nothing to
          the left for `Shift`+`←`. The browser's own answer at those two positions is to do nothing
          at all, so "the key is the browser's" reads here as a cell that did not change rather than
          as a selection that grew. The selection growing IS asserted, twice, where the browser
          really does grow one: over the full selection a keyboard arrival leaves behind, and on the
          vertical pair mid-number.
        */
        /*
          BACK TO COLUMN INDEX 1 WITH THE KEY, never with a click. By the time this block runs the
          grid is scrolled to its right-hand end — the walk above put it there — and at that scroll
          offset a click at `wo35-a1`'s coordinates lands on the frozen name column sitting over it,
          which is the viewport-coordinate trap in clickSel's own comment arriving through the
          fixture. Left to the clamp at index 0 and then one step right, so the starting state is
          reached the same way from wherever the check above left the caret; every arrival selects
          the value, so each press is a whole column.
        */
        const walkToSecondColumn = async () => {
          let at = await evalJs(ROW12);
          for (let i = 0; i < 20 && at.index !== 0; i++) {
            await skLeft();
            at = await evalJs(ROW12);
          }
          await skRight();
          return await evalJs(ROW12);
        };

        const modStart = await walkToSecondColumn();
        const beforeMods = await readDoc();

        /* The sentence src/scores.js carried until this work order — *"`Shift`+`←` over a full
           selection therefore moves a cell where a plain text field would shrink the selection"* —
           driven rather than described. This is the one press in the walk where the pre-WO-3.23
           build is unambiguously visible: it lands on wo35-a1 with `72` selected. */
        await skHeld(SHIFT, 'left');
        const shiftLeftSel = await evalJs(ROW12);
        check('Shift+← over the value a keyboard arrival selects shrinks that selection and stays in the cell — the modifier actually held, which is the only way this can be told from a plain ←',
          modStart.index === 1 && modStart.cell === A2 && modStart.student === 'wo35-s12'
            && modStart.value === '100' && modStart.from === 0 && modStart.to === 3
            && shiftLeftSel.index === 1 && shiftLeftSel.cell === A2
            && shiftLeftSel.student === 'wo35-s12' && shiftLeftSel.value === '100'
            && shiftLeftSel.from === 0 && shiftLeftSel.to === 2,
          JSON.stringify(modStart) + ' -> ' + JSON.stringify(shiftLeftSel));

        /* A plain `←` first, which collapses the selection to 0 because caretCanLeave() answers
           false over a partial selection and hands the key back — WO-3.16's rule, unchanged, and
           asserted here so that the state the next press is made from is a reading and not a
           belief. */
        await skLeft();
        const collapsedAtZero = await evalJs(ROW12);
        await skHeld(SHIFT, 'left');
        const shiftAtZero = await evalJs(ROW12);
        check('Shift+← with the caret at position 0 does not step to the previous assignment — with a previous assignment sitting there for a build that stole the key to land on',
          collapsedAtZero.index === 1 && collapsedAtZero.from === 0 && collapsedAtZero.to === 0
            && shiftAtZero.index === 1 && shiftAtZero.cell === A2
            && shiftAtZero.student === 'wo35-s12' && shiftAtZero.value === '100'
            && shiftAtZero.from === 0 && shiftAtZero.to === 0,
          JSON.stringify(collapsedAtZero) + ' -> ' + JSON.stringify(shiftAtZero));

        /* Out to the far end of the number with three plain `→`, each of them the caret's for the
           same reason, and then the modified one at the edge the arrow rule was written for. */
        await skRight();
        await skRight();
        await skRight();
        const collapsedAtEnd = await evalJs(ROW12);
        await skHeld(SHIFT, 'right');
        const shiftAtEnd = await evalJs(ROW12);
        check('Shift+→ with the caret at the end of a full cell stays in that cell — there is no character to its right to extend over, so the browser\'s own answer is to do nothing and doing nothing is what has to happen',
          collapsedAtEnd.index === 1 && collapsedAtEnd.from === 3 && collapsedAtEnd.to === 3
            && shiftAtEnd.index === 1 && shiftAtEnd.cell === A2
            && shiftAtEnd.student === 'wo35-s12' && shiftAtEnd.value === '100'
            && shiftAtEnd.from === 3 && shiftAtEnd.to === 3,
          JSON.stringify(collapsedAtEnd) + ' -> ' + JSON.stringify(shiftAtEnd));

        /*
          CTRL AND CMD AT BOTH CARET EDGES — and this one is GREEN ON THE PRE-WO-3.23 TREE, which is
          a finding rather than a weakness and is written down here so that nobody reads its green
          as proof of the fix. `src/shell.js`'s keydown listener opens
          `if (e.altKey || e.ctrlKey || e.metaKey) return;`, ABOVE the score-cell branch, so those
          three modifiers have never reached `handleScoreKey()` at all — the work order's "Why it
          exists" names all four flags, and only `Shift` was ever the defect, because `Shift` is
          deliberately not in that guard (it is how `?` is typed). Measured, not read off the
          source: with `Ctrl` held, a `keydown` listener on `window` sees `defaultPrevented false`
          and the caret collapses where the browser's word motion puts it, while the same press
          with `Shift` held read `defaultPrevented true` and changed column.

          What this check is for is that the answer now holds in TWO places rather than one: the
          guard above, and the grid itself, which since WO-3.23 refuses a modified arrow whatever
          let it through. Move the score branch above that guard — which a work order wanting
          `Cmd`+`Z` would do — and this stays green.

          `Alt`+ARROW IS NOT PRESSED HERE, and the reason is the best argument in this block for the
          whole work order: in this browser `Alt`+`←` is BACK. Driven once during development it
          navigated the page out from under the run, `window.planbook` went undefined and the
          harness died three checks later. That is what a screen swallowing a modified arrow costs
          somebody — the difference being that the teacher does not get a stack trace.
        */
        await skHeld(CTRL, 'right');
        const ctrlAtEnd = await evalJs(ROW12);
        await skHeld(CTRL, 'left');
        const ctrlWordLeft = await evalJs(ROW12);
        await skHeld(CTRL, 'left');
        const ctrlAtZero = await evalJs(ROW12);
        await skHeld(META, 'right');
        const metaAtZero = await evalJs(ROW12);
        const heldRuns = [ctrlAtEnd, ctrlWordLeft, ctrlAtZero, metaAtZero];
        check('Ctrl and Cmd + arrow are the browser\'s at both caret edges — word motion collapses the caret where the browser puts it and no press of the four changes assignment, student or score',
          ctrlAtEnd.from === 3 && ctrlAtEnd.to === 3
            && ctrlWordLeft.from === 0 && ctrlWordLeft.to === 0
            && ctrlAtZero.from === 0 && ctrlAtZero.to === 0
            && metaAtZero.from === 0 && metaAtZero.to === 0
            && heldRuns.every((s) => s.index === 1 && s.cell === A2
              && s.student === 'wo35-s12' && s.value === '100'),
          JSON.stringify(heldRuns));

        /*
          AND THE VERTICAL PAIR, which the work order's failing case does not mention and which is
          the WIDER half of the same defect. moveWithinColumn() has no caretCanLeave() gate — by
          design, since up and down mean nothing to a caret in a one-line field — so `↑` and `↓`
          were swallowed at EVERY caret position rather than only at an edge. Held with `Shift`
          they are not nothing: measured in this build, `Shift`+`↓` selects from the caret to the
          end of the number and `Shift`+`↑` selects back to its start. Both were being spent on
          changing student.
        */
        await skRight();
        const midCaret = await evalJs(ROW12);
        await skHeld(SHIFT, 'down');
        const shiftDown = await evalJs(ROW12);
        await skHeld(SHIFT, 'up');
        const shiftUp = await evalJs(ROW12);
        const afterMods = await readDoc();
        check('Shift+↓ and Shift+↑ select to the ends of the number instead of changing student, and the whole modified walk writes nothing — every score in the document byte-identical across fifteen presses',
          midCaret.index === 1 && midCaret.from === 1 && midCaret.to === 1
            && shiftDown.cell === A2 && shiftDown.student === 'wo35-s12'
            && shiftDown.value === '100' && shiftDown.from === 1 && shiftDown.to === 3
            && shiftUp.cell === A2 && shiftUp.student === 'wo35-s12'
            && shiftUp.value === '100' && shiftUp.from === 0 && shiftUp.to === 1
            && afterMods.all === beforeMods.all,
          JSON.stringify(midCaret) + ' -> ' + JSON.stringify(shiftDown) + ' -> '
            + JSON.stringify(shiftUp) + '; scores byte-identical = '
            + (afterMods.all === beforeMods.all));

        /*
          ── WO-3.25: WHAT A SCORE CELL WILL TAKE, AND WHAT IT WILL NOT ──

          The grid's cells are the app's one `type="text"` numeric field, and until this work order
          they took every string Number() can read: `1e3` stored 1000, `0x1f` stored 31, `0b101`
          stored 5, `0o17` stored 15 and `+7` stored 7 — measured with bare Node on 2026-08-17, not
          read off a spec. `inputmode="decimal"` is a keyboard hint and has never rejected a
          character, which is why this hole survived four work orders on this screen.

          EVERY REFUSAL BELOW IS READ TWICE, AND THAT IS THE POINT OF THE SECTION. The second half of
          the defect was worse than the table: `8a` was refused by editScore()'s bare `return`, so the
          FIELD went on showing `8a` while the STORE kept the previous number, with no `blur` and no
          `change` handler anywhere to reconcile them. So every read here takes the cell's value and
          the document's cell IN ONE EVALUATION — after a flush, trap 6 — and the comparison between
          them is made here in Node, out of the two numbers. Asking the page whether it agrees with
          itself is WO-3.24's vacuous first draft, one section up, and it is the shape this check
          could most easily have taken.

          THE PASTE IS A REAL PASTE. `Browser.grantPermissions` plus `navigator.clipboard.writeText`
          plus a dispatched Ctrl+V, which produces `beforeinput` with `inputType:
          "insertFromPaste"` — asserted per case out of a capture-phase trace, so a run where the
          clipboard silently did nothing goes red instead of green. A paste the grammar ALLOWS is
          driven as well, for the same reason: five refusals over a paste path that never worked in
          this browser would pass every line of this block.

          THE BACKSTOP IS DRIVEN THROUGH THE ONE PATH THAT REALLY CANNOT BE CANCELLED. Composition
          text — `Input.imeSetComposition` — arrives as `beforeinput` with `cancelable: false`, so
          the guard's preventDefault is ignored by the browser and `8a` genuinely reaches the field.
          That is not a simulation of the uncancelable case; it is the uncancelable case, and it is
          what the trace records alongside the value.

          THE TRACE IS TWO CAPTURE-PHASE LISTENERS, and the phase is load-bearing: src/shell.js's own
          listeners are on `document` in the bubble phase, so a bubble-phase probe would read the
          field AFTER the backstop had already put it back and could never see the `8a` it exists to
          catch. Neither listener cancels anything, and both come off at the foot of the block.

          COLUMNS p4, p5 AND p6 ARE USED because nothing else in this file reads them — the case-1
          arithmetic is on a1/a2/a3 and the flag and cleared-key checks are on a1 and p1. Scores
          typed here move the class average and nothing below asserts on it.
        */
        const P4 = 'wo35-p4', P5 = 'wo35-p5', P6 = 'wo35-p6';
        /* Written out here rather than imported from src/scores.js, for the reason SCHEMA_NOW is at
           the top of this file: a claim about the grammar has to be a claim about a PATTERN, and an
           import would be the app compared with the copy of itself it handed over. */
        const SCORE_GRAMMAR_HERE = /^-?\d*(?:\.\d{0,2})?$/;

        /* One cell, as the teacher sees it and as the document holds it, read in one evaluation so
           the two cannot be a moment apart. The flush is trap 6: every save is debounced. */
        const cellRead = (a, s) => evalJs(`(async function(){
          await window.planbook.store.flush();
          var el = document.querySelector('#scoresBody [data-score-cell="` + a
            + `"][data-score-student="` + s + `"]');
          var d = window.planbook.store.getDoc();
          var col = (d.scores || {})['` + a + `'] || {};
          var cell = col['` + s + `'];
          return { on: !!el, field: el ? String(el.value) : '(not on screen)',
                   caret: el && typeof el.selectionStart === 'number' ? el.selectionStart : -1,
                   has: Object.prototype.hasOwnProperty.call(col, '` + s + `'),
                   v: cell && cell.v !== undefined && cell.v !== null ? cell.v : null,
                   flag: cell && cell.flag ? cell.flag : '' }; })()`);

        /* THE COMPARISON, MADE IN NODE OUT OF TWO READ VALUES. An empty field means the cell holds
           no value; anything else has to be the same number the document holds. */
        const agrees = (r) => (String(r.field).trim() === ''
          ? r.v === null
          : Number(String(r.field).trim()) === r.v);

        /* Centred horizontally before the click, which the WO-3.24 block learned the hard way: by
           this point the walk has scrolled the grid sideways, and a click at a cell that is under
           the frozen name column lands on the student's own name — a link that navigates the whole
           run off the fixture. */
        const focusScoreCell = async (a, s) => {
          const scrolled = await evalJs('(function(){ var e = document.querySelector('
            + JSON.stringify(cellSel(a, s)) + '); if (!e) return 0;'
            + ' e.scrollIntoView({ block: "center", inline: "center" }); return 1; })()');
          /* A cell that is not there is a failed check below and never a crash — clickSel() throws
             on a selector that matches nothing, and the roster block's rule about fixtures applies
             here too. cellRead() answers `on: false` and every check naming it goes red. */
          if (!scrolled) return false;
          await clickSel(cellSel(a, s));
          return true;
        };

        /* One printable character, at the page. `text` is what makes e.key the character itself
           rather than the raw code — the same rule skDigits() above is built on. */
        const CODE_OF = { '.': ['Period', 190], '-': ['Minus', 189], '+': ['Equal', 187] };
        const skChar = async (ch) => {
          const named = CODE_OF[ch];
          const code = named ? named[0]
            : /[0-9]/.test(ch) ? 'Digit' + ch : 'Key' + ch.toUpperCase();
          const vk = named ? named[1] : ch.toUpperCase().charCodeAt(0);
          await sk(ch, code, vk, ch);
        };
        const typeChars = async (text) => {
          for (const ch of String(text).split('')) await skChar(ch);
        };

        /* Back to blank through the real keys: select the value, ⌫ takes it, and a second ⌫ on the
           now-empty field takes the cell itself — which is how a flag left over from a previous case
           goes as well. */
        const clearScoreCell = async (a, s) => {
          await focusScoreCell(a, s);
          await evalJs('(function(){ var e = document.querySelector('
            + JSON.stringify(cellSel(a, s)) + '); if (!e) return 0;'
            + ' e.setSelectionRange(0, String(e.value).length); return 1; })()');
          await skBack();
          await skBack();
          await new Promise((r) => setTimeout(r, 80));
        };

        const TRACE_ON = `(function(){
          window.__wo325 = [];
          window.__wo325b = function(e){
            var cell = e.target && e.target.closest ? e.target.closest('[data-score-cell]') : null;
            if (!cell) return;
            window.__wo325.push({ ev:'beforeinput', type:e.inputType, data:e.data,
              cancelable:e.cancelable, value:String(cell.value) }); };
          window.__wo325i = function(e){
            var cell = e.target && e.target.closest ? e.target.closest('[data-score-cell]') : null;
            if (!cell) return;
            window.__wo325.push({ ev:'input', type:e.inputType, value:String(cell.value) }); };
          document.addEventListener('beforeinput', window.__wo325b, true);
          document.addEventListener('input', window.__wo325i, true);
          return 1; })()`;
        await evalJs(TRACE_ON);
        const traceClear = () => evalJs('window.__wo325 = []; 1');
        const traceRead = () => evalJs('window.__wo325');

        /* The clipboard is a browser-level permission, so this one goes without the page session —
           and the origin is the harness's own server, which is a secure context because it is
           127.0.0.1. Without it navigator.clipboard is present and writeText rejects. */
        let clipboardOk = 'not asked';
        try {
          await send('Browser.grantPermissions',
            { origin: 'http://127.0.0.1:' + PORT,
              permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] }, false);
          clipboardOk = 'granted';
        } catch (e) { clipboardOk = 'refused: ' + e.message; }

        const pasteOver = async (a, s, text) => {
          await focusScoreCell(a, s);
          const wrote = await evalJs('navigator.clipboard.writeText(' + JSON.stringify(text)
            + ').then(function(){ return "ok"; }).catch(function(err){ return "ERR " + err.name; })');
          await evalJs('(function(){ var e = document.querySelector('
            + JSON.stringify(cellSel(a, s)) + '); if (!e) return 0;'
            + ' e.setSelectionRange(0, String(e.value).length); return 1; })()');
          await sk('v', 'KeyV', 86, '', CTRL);
          await new Promise((r) => setTimeout(r, 120));
          return wrote;
        };

        const gridReady = await evalJs('(function(){ var need = '
          + JSON.stringify(['wo35-p4', 'wo35-p5', 'wo35-p6'])
          + '; var out = { columns: [], rows: 0 };'
          + ' need.forEach(function(a){ if (document.querySelector('
          + '"#scoresBody [data-score-cell=\\"" + a + "\\"]")) out.columns.push(a); });'
          + ' out.rows = document.querySelectorAll("#scoresBody tr[data-score-row]").length;'
          + ' return out; })()');
        check('the three columns this block types into are drawn, on the 25 rows the fixture planted — nothing below can pass by being measured against a grid that is not there',
          gridReady.columns.length === 3 && gridReady.rows === 25,
          JSON.stringify(gridReady));

        /*
          ACCEPTANCE LINE 1, TYPED. Each string goes in one character at a time and the cell is read
          after EVERY one of them, because "cannot be produced" is a claim about every state the
          field passes through and not only about where it stops.

          `x` NEVER REACHES THE GUARD AT ALL, and the walk shows it: src/shell.js's keydown swallows
          `L`, `M` and `X` for the flag bar first, so typing `0x1f` marks the cell excused half way
          through and the digit after it takes the flag off again. That is the Trap in the work order
          — no second refusal for those three letters — and the invariants asserted here are true
          through it: the character never lands in the field, and the poison number never lands in
          the store.
        */
        const TYPED = [
          { text: '1e3', poison: 1000, illegal: ['e'] },
          { text: '0x1f', poison: 31, illegal: ['x', 'f'] },
          { text: '0b101', poison: 5, illegal: ['b'] },
          { text: '0o17', poison: 15, illegal: ['o'] },
          { text: '+7', poison: null, illegal: ['+'] },
          { text: '8a', poison: null, illegal: ['a'] },
        ];
        for (const one of TYPED) {
          await clearScoreCell(P4, 'wo35-s02');
          await traceClear();
          const steps = [];
          for (const ch of one.text.split('')) {
            await skChar(ch);
            const r = await cellRead(P4, 'wo35-s02');
            steps.push({ typed: ch, field: r.field, v: r.v, flag: r.flag, agrees: agrees(r) });
          }
          const trace = await traceRead();
          const showed = steps.filter((st) => one.illegal.some((c) => st.field.indexOf(c) >= 0));
          const stored = one.poison === null ? [] : steps.filter((st) => st.v === one.poison);
          const strayed = steps.filter((st) => !SCORE_GRAMMAR_HERE.test(st.field));
          const disagreed = steps.filter((st) => !st.agrees);
          /* THE CLAUSE THAT SEPARATES THE GUARD FROM THE BACKSTOP, and without it this check passes
             on a build with no guard at all: the backstop rewrites the field on the very next
             `input`, so a read taken after the keystroke sees the same reconciled value either way.
             An `input` event carrying the character is what the guard prevents from ever happening —
             delete the preventDefault in src/shell.js and `{ev:"input", value:"1e"}` turns up here. */
          const reached = trace.filter((t) => t.ev === 'input'
            && one.illegal.some((c) => String(t.value).indexOf(c) >= 0));
          check('typing `' + one.text + '` into a score cell: the field never holds '
            + one.illegal.map((c) => '`' + c + '`').join(' or ')
            + ' — not even for the instant before an `input` fires — the store never holds '
            + (one.poison === null ? 'anything the notation meant' : one.poison)
            + ', and the two agree after every keystroke',
            !showed.length && !stored.length && !strayed.length && !disagreed.length
              && !reached.length,
            'keystroke by keystroke ' + JSON.stringify(steps) + ' :: events ' + JSON.stringify(trace)
              + (showed.length ? ' :: THE FIELD SHOWED IT: ' + JSON.stringify(showed) : '')
              + (stored.length ? ' :: THE STORE TOOK IT: ' + JSON.stringify(stored) : '')
              + (strayed.length ? ' :: OUT OF GRAMMAR: ' + JSON.stringify(strayed) : '')
              + (disagreed.length ? ' :: FIELD AND STORE DISAGREED: ' + JSON.stringify(disagreed) : '')
              + (reached.length ? ' :: IT REACHED THE FIELD: ' + JSON.stringify(reached) : ''));
        }

        /*
          ACCEPTANCE LINE 1, PASTED — the same five, arriving whole over a selected value rather than
          a character at a time. This is what makes the guard's shape matter: it tests the
          PROSPECTIVE field contents rather than the inserted text, so one test covers a paste, a
          drag-and-drop and an autofill. The cell holds 87 first, so a refusal has something to
          protect and "the field is unchanged" is a claim about a number rather than about emptiness.
        */
        for (const text of ['1e3', '0x1f', '0b101', '0o17', '+7']) {
          await clearScoreCell(P5, 'wo35-s04');
          await typeChars('87');
          const before = await cellRead(P5, 'wo35-s04');
          await traceClear();
          const wrote = await pasteOver(P5, 'wo35-s04', text);
          const after = await cellRead(P5, 'wo35-s04');
          const trace = await traceRead();
          const sawPaste = trace.some((t) => t.ev === 'beforeinput' && t.type === 'insertFromPaste');
          /* CANCELLED OUTRIGHT, which is the same clause the typed walk carries and for the same
             reason: with no guard the paste would land and the backstop would put 87 back on the
             next `input`, leaving every other assertion here true. No `input` event at all is what
             says the text never entered the field. */
          const landed = trace.filter((t) => t.ev === 'input');
          check('pasting `' + text + '` over a score cell holding 87 is refused whole — the paste '
            + 'really did reach the page, no `input` ever fired from it, and the field and the '
            + 'stored cell are both still 87',
            sawPaste && !landed.length && before.v === 87 && after.field === '87' && after.v === 87
              && agrees(after),
            'clipboard ' + clipboardOk + '/' + wrote + ', events seen = ' + JSON.stringify(trace)
              + ', before = ' + JSON.stringify(before) + ', after = ' + JSON.stringify(after));
        }

        await clearScoreCell(P5, 'wo35-s05');
        await typeChars('87');
        await traceClear();
        const legalPasteWrote = await pasteOver(P5, 'wo35-s05', '12.75');
        const legalPaste = await cellRead(P5, 'wo35-s05');
        const legalPasteTrace = await traceRead();
        check('and a paste the grammar allows lands — 12.75 over a cell holding 87 stores 12.75, so the five refusals above are a guard rather than a paste path that never worked in this browser',
          legalPaste.field === '12.75' && legalPaste.v === 12.75 && agrees(legalPaste)
            && legalPasteTrace.some((t) => t.ev === 'beforeinput' && t.type === 'insertFromPaste'),
          'clipboard ' + clipboardOk + '/' + legalPasteWrote + ' :: ' + JSON.stringify(legalPaste)
            + ' :: ' + JSON.stringify(legalPasteTrace));

        /*
          ACCEPTANCE LINE 2. Two decimals are the owner's call of 2026-08-17 — the SIS carries two
          and this number is re-keyed into it by hand — so the third digit is where the grammar
          stops, and the two before it must be untouched.
        */
        await clearScoreCell(P4, 'wo35-s06');
        await typeChars('87.256');
        const thirdDigit = await cellRead(P4, 'wo35-s06');
        check('a third digit after the decimal point is refused and the two before it are not: 87.25 is typed, stored as 87.25, and the 6 that follows never reaches the field',
          thirdDigit.field === '87.25' && thirdDigit.v === 87.25 && agrees(thirdDigit),
          JSON.stringify(thirdDigit));

        /*
          ACCEPTANCE LINE 3, AND IT IS THE ONE A ZEALOUS FIX FAILS. Refusing a notation is not
          clamping a value: a negative is a penalty the teacher typed and meant, and a score above
          the assignment's points is extra credit she is allowed to award (docs/data-model.md §
          Extra credit). wo35-p4 is worth 10 points, so 300 is thirty times the maximum and it is
          stored unchanged.
        */
        await clearScoreCell(P4, 'wo35-s07');
        await typeChars('-5');
        const negative = await cellRead(P4, 'wo35-s07');
        await clearScoreCell(P4, 'wo35-s08');
        await typeChars('300');
        const extraCredit = await cellRead(P4, 'wo35-s08');
        check('-5 is accepted and stored as -5, and 300 on a 10-point assignment is still stored as 300 — this work order refuses a NOTATION and never clamps a VALUE',
          negative.field === '-5' && negative.v === -5 && agrees(negative)
            && extraCredit.field === '300' && extraCredit.v === 300 && agrees(extraCredit),
          'negative = ' + JSON.stringify(negative) + ', above the points possible = '
            + JSON.stringify(extraCredit));

        /*
          ACCEPTANCE LINE 4 — the distinction the whole work order turns on. `-`, `.` and `12.` are
          what a field looks like part-way through a number: they are legal PREFIXES and not illegal
          values, so they must be typable, they must write nothing, and nothing may reformat the
          field under the caret while she is still typing.

          "WRITES NOTHING" IS THE WHOLE SCORES MAP, BYTE FOR BYTE, across the keystroke that
          completes the prefix — a comparison of one cell would be satisfied by a build that wrote
          somewhere else. And the caret is read because "does not rewrite the field" is a claim about
          where the caret ends up as much as about what the field holds: a field re-rendered under
          the caret puts it back at 0.
        */
        for (const prefix of ['-', '.', '12.']) {
          await clearScoreCell(P6, 'wo35-s09');
          const lead = prefix.slice(0, -1);
          if (lead) await typeChars(lead);
          const beforeDot = await readDoc();
          await skChar(prefix.slice(-1));
          const afterDot = await readDoc();
          const shown = await cellRead(P6, 'wo35-s09');
          check('typing `' + prefix + '` leaves the field showing exactly that with the caret at the '
            + 'end of it, and writes nothing: the whole scores map is byte-identical across the '
            + 'keystroke that completed the prefix',
            shown.field === prefix && shown.caret === prefix.length
              && afterDot.all === beforeDot.all,
            'field = ' + JSON.stringify(shown.field) + ', caret = ' + shown.caret + ' of '
              + prefix.length + ', scores byte-identical = ' + (afterDot.all === beforeDot.all)
              + ', cell = ' + JSON.stringify(shown));
        }

        /*
          ACCEPTANCE LINE 5, AND THE `8a` CASE ITSELF. Everything above is the guard; this is what
          happens when the guard cannot fire. Composition text is `beforeinput` with `cancelable:
          false` — the browser ignores preventDefault on it, which is measured here rather than
          assumed — so `8a` genuinely lands in the field, editScore() reads it, and the backstop puts
          the field back to what the document holds. The capture-phase trace is what proves the field
          really did hold `8a` for an instant: src/shell.js's own listener is on the bubble phase, so
          a bubble-phase read would see only the value the backstop had already written back.
        */
        await clearScoreCell(P6, 'wo35-s10');
        await typeChars('8');
        const beforeIme = await cellRead(P6, 'wo35-s10');
        await traceClear();
        await send('Input.imeSetComposition', { text: 'a', selectionStart: 1, selectionEnd: 1 });
        await new Promise((r) => setTimeout(r, 200));
        const afterIme = await cellRead(P6, 'wo35-s10');
        const imeTrace = await traceRead();
        const uncancelable = imeTrace.filter((t) => t.ev === 'beforeinput' && t.cancelable === false);
        const fieldHeld8a = imeTrace.some((t) => t.ev === 'input' && t.value === '8a');
        check('the field and the store cannot disagree even where the guard cannot fire: an uncancelable composition puts `8a` in the cell, and the backstop puts the field back to the 8 the document holds rather than leaving the two saying different things',
          beforeIme.v === 8 && uncancelable.length > 0 && fieldHeld8a
            && afterIme.field === '8' && afterIme.v === 8 && agrees(afterIme),
          'before = ' + JSON.stringify(beforeIme) + ', after = ' + JSON.stringify(afterIme)
            + ', the field held `8a` at `input` = ' + fieldHeld8a
            + ', uncancelable beforeinput = ' + JSON.stringify(uncancelable));

        /*
          ACCEPTANCE LINE 6. A score of 12.3456789 typed before this work order landed is NOT
          migrated: rounding a number a teacher already typed is the silent-wrong-number failure this
          work order exists to close, wearing a fix's clothes. It is planted through the store
          because no control can produce it any more, and the grid is then left and re-entered
          through the real segments — which is both the render and the "opened and left" of the
          acceptance line.
        */
        await evalJs(`(async function(){
          var s = window.planbook.store;
          s.update(function(doc){
            doc.scores = doc.scores || {};
            doc.scores['wo35-p6'] = doc.scores['wo35-p6'] || {};
            doc.scores['wo35-p6']['wo35-s11'] = { v: 12.3456789 };
          });
          await s.flush();
          return 1; })()`);
        /* EACH STRIP BELONGS TO THE SCREEN IT IS ON, and the segment for the screen you are already
           on carries no hook at all (src/screen-nav.js). So the way OUT of the grid is the strip
           inside #scoresView and the way back in is the one inside #assignmentsView — `#classView`'s
           own strip is `display: none` while a class screen is up, and clicking it puts a click at
           0,0 and re-renders nothing. That is not hypothetical: it is what the first run of this
           block did, and the check below read an empty field over a stored 12.3456789 — which is why
           the leave and the return are now ASSERTED rather than assumed. */
        await clickSel('#scoresView [data-class-screen="assignments"]');
        await new Promise((r) => setTimeout(r, 250));
        const leftTheGrid = await evalJs("document.getElementById('scoresView')"
          + ".classList.contains('hidden')");
        await clickSel('#assignmentsView [data-class-screen="scores"]');
        await new Promise((r) => setTimeout(r, 300));
        const backOnTheGrid = await evalJs("!document.getElementById('scoresView')"
          + ".classList.contains('hidden')");
        const oldPrecision = await cellRead(P6, 'wo35-s11');
        check('a score of 12.3456789 written before this grammar existed survives it: the cell renders as typed and the stored value is unchanged after the grid has been left and re-opened without touching it',
          leftTheGrid && backOnTheGrid
            && oldPrecision.field === '12.3456789' && oldPrecision.v === 12.3456789
            && agrees(oldPrecision),
          'the grid was left = ' + leftTheGrid + ' and re-opened = ' + backOnTheGrid + ' :: '
            + JSON.stringify(oldPrecision));

        /* And it can be edited DOWN and not extended, which is the other half of not migrating it:
           every deletion passes the guard and lands in the store, so the field and the store stay
           together while she shortens it — and the digit that would put it back out of grammar is
           refused. */
        await focusScoreCell(P6, 'wo35-s11');
        await evalJs('(function(){ var e = document.querySelector('
          + JSON.stringify(cellSel(P6, 'wo35-s11')) + '); if (!e) return 0;'
          + ' var n = String(e.value).length; e.setSelectionRange(n, n); return 1; })()');
        await skBack();
        await new Promise((r) => setTimeout(r, 120));
        const shortened = await cellRead(P6, 'wo35-s11');
        await skChar('9');
        const reExtended = await cellRead(P6, 'wo35-s11');
        check('and it can be edited down but not extended: one ⌫ takes 12.3456789 to 12.345678 in the field AND in the store, and the digit that would put it back is refused',
          shortened.field === '12.345678' && shortened.v === 12.345678 && agrees(shortened)
            && reExtended.field === '12.345678' && reExtended.v === 12.345678 && agrees(reExtended),
          'after ⌫ ' + JSON.stringify(shortened) + ', after typing 9 ' + JSON.stringify(reExtended));

        await evalJs(`(function(){
          document.removeEventListener('beforeinput', window.__wo325b, true);
          document.removeEventListener('input', window.__wo325i, true);
          delete window.__wo325; delete window.__wo325b; delete window.__wo325i;
          return 1; })()`);

        /*
          THE TWO FROZEN COLUMNS, AND THE PAIR src/scores.css SAYS IS ASSERTED HERE. The grade column's
          `left` is a pixel offset, so it can only be right if the name column's width is known — the
          hand-computed layout src/attendance.css warns against, accepted for two columns because sticky
          arithmetic leaves no alternative. That comment claimed a check that did not exist until this
          one; the width and the offset could have drifted apart in any later edit and nothing would have
          said so. Both blocks, because the coarse block narrows the name column and has to move the
          offset with it — which is also why the two numbers are asserted to DIFFER between the blocks:
          a coarse block that had quietly stopped overriding either would otherwise pass.
        */
        const frozen = await evalJs(`(function(){
          var out = { base: {}, coarse: {}, sheet: false };
          window.__eachRule(function(r, label){
            var href = '';
            try { href = (r.parentStyleSheet && r.parentStyleSheet.href) || ''; } catch (e) {}
            if (href.indexOf('scores.css') < 0) return;
            out.sheet = true;
            var coarse = false, p = r.parentRule;
            while (p) {
              if (p.conditionText && p.conditionText.indexOf('coarse') >= 0) coarse = true;
              p = p.parentRule;
            }
            var bag = coarse ? out.coarse : out.base;
            /* Split and matched exactly, never by substring: '.scores-grade-num' contains
               '.scores-grade', and the grouped thead selector contains both of them. */
            var parts = String(label).split(',').map(function(x){ return x.trim(); });
            if (parts.indexOf('.scores-name') >= 0 && r.style.width) {
              bag.nameWidth = r.style.width; bag.nameMin = r.style.minWidth;
            }
            if (parts.indexOf('.scores-grade') >= 0 && r.style.left) bag.gradeLeft = r.style.left;
          });
          return out; })()`);
        check('the frozen name column\'s width and the frozen grade column\'s offset are the same number in the base rules and the same number again in the coarse block',
          frozen.sheet && !!frozen.base.nameWidth && !!frozen.coarse.nameWidth
            && frozen.base.nameWidth === frozen.base.gradeLeft
            && frozen.base.nameWidth === frozen.base.nameMin
            && frozen.coarse.nameWidth === frozen.coarse.gradeLeft
            && frozen.coarse.nameWidth === frozen.coarse.nameMin
            && frozen.coarse.nameWidth !== frozen.base.nameWidth,
          'base ' + JSON.stringify(frozen.base) + ' :: coarse ' + JSON.stringify(frozen.coarse));

        /*
          AND THE SAME PAIR AS A MEASUREMENT, with the grid scrolled sideways — which is the defect
          itself rather than a proxy for it. Two sticky columns whose numbers have drifted apart do not
          stop being sticky; they OVERLAP, and the student's name disappears under her own grade three
          columns into a wide term. The seven empty assignments in the fixture are here for this: a
          three-column grid at 1200px does not scroll at all, and a check over a grid that cannot move
          is a check that cannot fail.
        */
        const PIN = `(function(){
          var wrap = document.getElementById('scoresGridWrap');
          var row = document.querySelector('#scoresBody tr[data-score-row="wo35-s01"]');
          if (!wrap || !row) return null;
          wrap.scrollLeft = 260;
          var name = row.querySelector('.scores-name').getBoundingClientRect();
          var grade = row.querySelector('.scores-grade').getBoundingClientRect();
          var box = wrap.getBoundingClientRect();
          return { scrolled: wrap.scrollLeft, scrollable: wrap.scrollWidth - wrap.clientWidth,
                   overlap: Math.round((name.right - grade.left) * 100) / 100,
                   nameOff: Math.round((name.left - box.left) * 100) / 100,
                   nameW: Math.round(name.width * 100) / 100 }; })()`;
        const pinned = await evalJs(PIN);
        check('and with the grid scrolled sideways the two frozen columns stay pinned to its left edge without overlapping each other',
          !!pinned && pinned.scrollable > 0 && pinned.scrolled > 0
            && pinned.overlap <= 0.5 && Math.abs(pinned.nameOff) <= 0.5,
          JSON.stringify(pinned));

        /*
          ── THE COARSE PASS ──

          Everything above is a keyboard, and none of it is acceptance line 6. This is what a desk can
          say about the touch half: that every control on the grid clears 44px with the view OPEN, which
          is the state the standing sweep at the top of this run cannot reach. A `.hidden` view computes
          to `display: none`, that sweep skips anything that does, and so it walked past every one of
          these inputs and reported green. The grid is opened here through the real segment before a
          single box is measured, and that it is DRAWN is its own check — because a sweep over nothing
          is the failure this block exists to close.

          WHY THIS BLOCK STILL EXISTS NOW THAT WO-2.21 OPENS EVERY VIEW UP THERE, which is the one
          sentence that work order asks for: THE GENERAL SWEEP CAN REACH THIS SCREEN AND CANNOT REACH
          A FULL ONE. It runs 2,700 lines above this fixture, on a document where the assignments
          section has deleted every assignment and no class carrying a roster has a term to file one
          in — so #scoresView opens there in its "nothing to grade" state, where src/scores.js hides
          the grid, the toolbar and the flag bar, and four panel controls are all there is to measure.
          The 25-student, 10-assignment fixture is planted here and torn down at the foot of this
          section, so THIS is the only place in the run where 250 score cells exist at once, and 250
          is the number WO-3.5's acceptance line is about. The general mechanism proves the screen is
          reachable and its chrome is thumb-sized on every run; this proves the cells are, in the only
          state where there are any. What is NOT duplicated any more is the measurement itself — both
          call measureIn(), so there is one definition of what a control is and one of what is skipped.

          Line 6 itself — "usable on an iPad in landscape" — stays a 👤 item in TESTING.md. An emulator
          is not a thumb.
        */
        await send('Emulation.setDeviceMetricsOverride',
          { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
        await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
        await send('Page.reload');
        await new Promise(r => setTimeout(r, 700));
        await waitForBoot();
        await evalJs(KILL_ANIM);
        await evalJs(INSTALL_WALKER);
        const coarseNow = await evalJs("matchMedia('(pointer: coarse)').matches");
        await clickSel('#classTabBar [data-class-tab="c_wo35"]');
        await new Promise(r => setTimeout(r, 250));
        await clickSel('#classView [data-class-screen="scores"]');
        await new Promise(r => setTimeout(r, 350));
        const drawn = await evalJs(`(function(){
          var view = document.getElementById('scoresView');
          var cell = document.querySelector('#scoresBody [data-score-cell]');
          if (!view) return null;
          var vs = getComputedStyle(view);
          var r = cell ? cell.getBoundingClientRect() : { width: 0, height: 0 };
          return { hidden: view.classList.contains('hidden'), viewDisplay: vs.display,
                   cellDisplay: cell ? getComputedStyle(cell).display : '(no cell)',
                   drawn: r.width > 0 && r.height > 0,
                   cells: document.querySelectorAll('#scoresBody [data-score-cell]').length }; })()`);
        check('the score grid is OPEN and drawn under the coarse pointer, so the sweep below measures score cells rather than a display:none screen',
          coarseNow === true && !!drawn && !drawn.hidden && drawn.viewDisplay !== 'none'
            && drawn.cellDisplay !== 'none' && drawn.drawn && drawn.cells >= 200,
          'coarse pointer = ' + coarseNow + ' :: ' + JSON.stringify(drawn));

        const grid44 = await evalJs(measureIn('#scoresView'));
        const under44 = grid44.filter((m) => m.h < 44 || m.w < 44);
        const create44 = await evalJs(`(function(){
          var b = document.querySelector('#scoresActions [data-assignment-new]');
          if (!b) return null; var r = b.getBoundingClientRect();
          return { w:Math.round(r.width * 100) / 100, h:Math.round(r.height * 100) / 100,
            label:(b.textContent || '').trim(), shown:getComputedStyle(b).display !== 'none' }; })()`);
        check('every control on the open score grid measures >=44px on a coarse pointer — the score cells, four flag buttons and visible New assignment door included',
          grid44.length >= 200 && under44.length === 0
            && coarseNow === true && !!create44 && create44.shown
            && create44.h >= 44 && create44.w >= 44
            && create44.label === '+ New assignment',
          'measured ' + grid44.length + ' visible control(s) with the grid open; under = '
            + JSON.stringify(under44.slice(0, 6))
            + (under44.length > 6 ? ' … and ' + (under44.length - 6) + ' more' : '')
            + '; New assignment = ' + JSON.stringify(create44));

        const pinnedCoarse = await evalJs(PIN);
        check('and the frozen pair holds on the coarse pointer too, where the name column is narrower and the offset had to move with it',
          !!pinnedCoarse && pinnedCoarse.scrollable > 0 && pinnedCoarse.scrolled > 0
            && pinnedCoarse.overlap <= 0.5 && Math.abs(pinnedCoarse.nameOff) <= 0.5
            && !!pinned && pinnedCoarse.nameW < pinned.nameW,
          JSON.stringify(pinnedCoarse) + ' against a fine-pointer name column of '
            + (pinned ? pinned.nameW : '?') + 'px');

        /*
          ── WO-3.24: THE ⌨ KEYS PANEL, MEASURED FOR SPILL RATHER THAN ARGUED FROM CHARACTER COUNTS ──

          `.scores-key` is `white-space: nowrap` (src/scores.css:154-157), so a row wider than the
          panel pushes through its own border instead of wrapping. Nothing in this file had ever
          opened `#scoresKeys` before this work order — WO-3.22 could defend its own row only by
          counting characters against the `← →` row, and its own Acceptance said so.

          OPENED THROUGH THE REAL BUTTON, not by clearing `.hidden` by hand — WO-2.21's scar is a
          sweep that measured a screen that was not the one on screen, and `aria-expanded` on the
          button is the independent evidence the click actually landed rather than the panel being
          open for some other reason. The grid is already open and coarse from the block above, so
          this reuses that state instead of planting a second fixture.

          A ROW'S OWN scrollWidth AGAINST ITS OWN clientWidth IS ALWAYS EQUAL, AND THAT IS NOT A
          SHORTCUT — IT WAS THE FIRST DRAFT HERE AND THE MUTATION PROVED IT VACUOUS. `.scores-key` is
          an unconstrained `inline-flex` chip: nothing sets it a width or a max-width, so it always
          sizes itself to whatever its own content needs, `white-space: nowrap` or not. A row cannot
          overflow a box that grows to fit it. The first pass at this check compared each row's
          scrollWidth to its own clientWidth and reddened NOTHING against a row stretched to 1678px
          in a 942px panel — both numbers came back 1678, because the row simply grew. What actually
          happens when a row is too long is the WO's own words: it "pushes through its own border",
          meaning the PANEL'S border, not a border `.scores-key` does not have — the row keeps its
          natural width and overflows the panel around it. So the real per-row claim compares each
          row's own width to the panel's available CONTENT width (`clientWidth` less its own
          padding, since flex children lay out inside the padding edge, not the border edge) — that
          is the number a row can actually fail to fit inside, and it is what the mutation below is
          run against.

          `#scoresKeys` ITSELF IS `flex-wrap: wrap` (src/scores.css:148). Its own scrollWidth against
          its own clientWidth is kept below as CONTEXT — in this one failure mode (a single row wider
          than the whole panel) it happens to move too, because flex-wrap cannot shrink an item that
          does not fit even alone on its own line, so the widest row still drives the container's
          scrollWidth up. It is not asserted as its own check regardless: it cannot NAME the row, and
          a defect built from several moderately-long rows that only crowd each other on the same
          line (rather than any one of them individually exceeding the panel) would move the container
          number without any single row failing the real per-row comparison — the container is
          corroborating context, never the claim.
        */
        await clickSel('#scoresView [data-scores-keys]');
        await new Promise((r) => setTimeout(r, 200));
        const KEYS_SPILL = `(function(){
          var btn = document.querySelector('#scoresView [data-scores-keys]');
          var panel = document.getElementById('scoresKeys');
          var rows = panel ? Array.prototype.slice.call(panel.querySelectorAll('.scores-key')) : [];
          var cs = panel ? getComputedStyle(panel) : null;
          var innerW = panel
            ? panel.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0')
            : 0;
          return {
            expanded: btn ? btn.getAttribute('aria-expanded') : null,
            hidden: panel ? panel.classList.contains('hidden') : null,
            panelScrollW: panel ? panel.scrollWidth : 0,
            panelClientW: panel ? panel.clientWidth : 0,
            panelInnerW: innerW,
            rowCount: rows.length,
            rows: rows.map(function(row){
              var t = (row.textContent || '').replace(/\\s+/g, ' ').trim();
              return { text: t, scrollW: row.scrollWidth, innerW: innerW,
                spill: row.scrollWidth > innerW + 1 };
            })
          }; })()`;

        const keys1024 = await evalJs(KEYS_SPILL);
        check('the ⌨ Keys panel opens through its own button rather than by unhiding it — aria-expanded flips true, #scoresKeys comes off .hidden, and a plausible number of rows are there to measure',
          keys1024.expanded === 'true' && keys1024.hidden === false && keys1024.rowCount >= 7,
          'aria-expanded = ' + keys1024.expanded + ', hidden = ' + keys1024.hidden
            + ', rows = ' + keys1024.rowCount);

        const spill1024 = keys1024.rows.filter((row) => row.spill);
        check('every .scores-key row fits inside the panel at 1024px on a coarse pointer — each row\'s own scrollWidth measured against the panel\'s available content width, not against the row\'s own (always-equal) clientWidth',
          coarseNow === true && keys1024.rowCount >= 7 && spill1024.length === 0,
          keys1024.rowCount + ' row(s), panel content width ' + keys1024.panelInnerW
            + 'px (container scrollWidth/clientWidth ' + keys1024.panelScrollW + '/'
            + keys1024.panelClientW + 'px, context only) :: '
            + JSON.stringify(keys1024.rows.map((row) => row.text + ' ' + row.scrollW + '/' + row.innerW))
            + (spill1024.length
              ? '; SPILLING: ' + JSON.stringify(spill1024.map((row) => row.text)) : ''));

        /* Resized rather than reloaded, so the panel stays open the way the teacher left it and this
           is one open through the button rather than two — a reload would drop `keysOpen` back to
           false (src/scores.js's module variable, not a stored preference) and a second click would
           be needed anyway, which is no more honest than resizing under the one that already landed. */
        await send('Emulation.setDeviceMetricsOverride',
          { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
        await new Promise((r) => setTimeout(r, 400));
        const coarse390 = await evalJs("matchMedia('(pointer: coarse)').matches");
        check('the emulated pointer is still coarse at 390px, else the row-width sweep below measures the desktop pass',
          coarse390 === true, 'matchMedia = ' + coarse390);

        const keys390 = await evalJs(KEYS_SPILL);
        const spill390 = keys390.rows.filter((row) => row.spill);
        check('and every .scores-key row still fits inside the panel at 390px, the narrowest width this app supports, with the panel never re-opened for the narrower read',
          coarse390 === true && keys390.expanded === 'true' && keys390.hidden === false
            && keys390.rowCount >= 7 && spill390.length === 0,
          keys390.rowCount + ' row(s), panel content width ' + keys390.panelInnerW
            + 'px (container scrollWidth/clientWidth ' + keys390.panelScrollW + '/'
            + keys390.panelClientW + 'px, context only) :: '
            + JSON.stringify(keys390.rows.map((row) => row.text + ' ' + row.scrollW + '/' + row.innerW))
            + (spill390.length
              ? '; SPILLING: ' + JSON.stringify(spill390.map((row) => row.text)) : ''));

        /* Back to 1024x768: tidiness rather than a dependency, since the WO-3.17 section right after
           this one sets its own device metrics and reloads before its first click. */
        await send('Emulation.setDeviceMetricsOverride',
          { width: 1024, height: 768, deviceScaleFactor: 2, mobile: true });
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    /*
      THE FIXTURE COMES BACK OUT — the class, its twenty-five students, its ten assignments and every
      score column typed into them — and the class this block found open is put back under it. Written
      as one update rather than through the real Delete controls, for the reason the assignments
      teardown gives: a fixture coming down is not a claim being made. This is the last section in the
      file, so nothing depends on the state; it is cleaned up anyway, because a run that left a
      fixture class in the teacher's own browser is a run that wrote student data nobody asked for.
    */
    await evalJs(`(async function(){
      var s = window.planbook.store, c = window.planbook.classes;
      var d = s.getDoc();
      if (!d) return 0;
      s.update(function(doc){
        doc.classes = doc.classes.filter(function(x){ return x.id !== 'c_wo35'; });
        doc.students = doc.students.filter(function(x){
          return String(x.id).indexOf('wo35-') !== 0; });
        doc.assignments = doc.assignments.filter(function(a){ return a.classId !== 'c_wo35'; });
        Object.keys(doc.scores || {}).forEach(function(k){
          if (String(k).indexOf('wo35-') === 0) delete doc.scores[k]; });
      });
      var was = ${JSON.stringify(plant.was || '')};
      if (was) c.selectClass(was);
      c.refreshClassBar();
      await s.flush();
      return 1; })()`);
  }
}
}
