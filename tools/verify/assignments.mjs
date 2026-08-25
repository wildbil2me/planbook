/* assignments.mjs — assignments and the screen switcher (WO-3.3)
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import { nodeToday } from './lib-dates.mjs';
import { INSTALL_CLASS_READER } from './classes-terms.mjs';

export async function run(h) {
const { check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, waitForBoot, seam,
  classesBooted, classSeam } = h;

/* ───────────────── assignments and the screen switcher (WO-3.3) ─────────────────
 *
 * Five of WO-3.3's seven acceptance lines are driven here in full, and two are driven as far as
 * anything in this build can take them. Everything is done through the controls a teacher touches:
 * the segmented strip under the panel title, the real "+ New assignment", the real name, points,
 * category and date fields, the real Duplicate dialog with its real class pills, and the real
 * delete confirm. The window.planbook.assignments seam is used only to READ.
 *
 * TWO LINES NAME A GRADE AND THERE IS NO GRADE IN THIS APP. "does not break any grade calculation"
 * and "the grade updates" both need WO-3.4's engine and WO-3.5's grid, neither of which exists, and
 * building either here is what WO-3.4's Out of scope line forbids. So the halves that exist are
 * measured and the halves that do not are re-homed in the work order rather than faked here:
 * a `0` typed into the points field survives typing, re-rendering and a reload as `0` — never
 * defaulted, never rejected — and an assignment moves between categories with its score column
 * following it untouched.
 *
 * WHY A SCORE IS PLANTED THROUGH THE SEAM. There is no score entry anywhere in this build (WO-3.5
 * owns it), so the only way to have a score column at all is to write one. Every claim ABOUT that
 * column is then read back off the real screen and the real dialogs — the coverage bar, the count
 * in the delete confirm, and the column surviving a move between categories.
 *
 * THE TRAP CHECK IS THE ONE TO KEEP. WO-3.3's Traps line says a duplicate must not carry its
 * source's `categoryId` into another class, because a category removal in the first class would
 * then destroy work in the second under a dialog naming the first. Two checks stand on it: the copy
 * is asserted to carry the TARGET's own category id (or none) and never the source's, and a foreign
 * assignment is planted carrying this class's `categoryId` with another class's `classId` — where
 * it must be absent from this list AND absent from the count in the category-removal confirm. The
 * second one goes red against the build this work order started from, which is what makes it worth
 * its lines.
 *
 * WHAT IS NOT HERE AND IS OWED TO A HUMAN: whether five controls in an assignment row are
 * distinguishable under a thumb (design/mockups/README.md's open question 4), whether iPadOS offers
 * the numeric keypad for the points field, and whether the date picker's Clear behaves on the
 * hardware the way the rebuild below assumes. The touch section measures the boxes; it cannot press
 * them.
 */

/* `nodeToday` was defined here until WO-2.54 and now sits above the classes & terms section, which
   needs the same value for the same reason — the term the register comes back on after a reload is
   the one NEAREST today. The definition moved rather than being copied, exactly as WO-3.17 moved it
   here; its comment moved with it. */

console.log('\n--- assignments and the screen switcher ---');

const assignSeam = await evalJs("!!(window.planbook && window.planbook.assignments"
  + " && typeof window.planbook.assignments.renderAssignments === 'function'"
  + " && window.planbook.screenNav"
  + " && typeof window.planbook.screenNav.setDetailBreadcrumb === 'function')");

if (!classesBooted || !classSeam || !assignSeam) {
  skip('assignments: the list as a view, the three-tab switcher, a zero-point assignment, a move between categories, a duplicate with no scores, and a delete that counts',
    classesBooted
      ? 'no window.planbook.assignments / screenNav seam on the page — both are kept deliberately for this file to read a copy and the breadcrumb rule through, so their absence is a defect and not a stage of the build'
      : 'the app did not boot before this section');
} else {
  /* Everything this section reads off the SCREEN, in two page-side helpers, so a check is one round
     trip and the reads cannot drift between checks. `__assign` is the list; `__strip` is the
     switcher, which is drawn on every class screen and therefore has to be read as a set rather
     than as one element. */
  const INSTALL_ASSIGN_READER = `(function(){
    window.__assign = function(){
      var view = document.getElementById('assignmentsView');
      var body = document.getElementById('assignmentsBody');
      var rows = Array.prototype.slice.call(body.querySelectorAll('tr'));
      var data = rows.filter(function(r){ return !!r.querySelector('.assign-name'); });
      var wrap = document.querySelector('#assignmentsView .assign-table-wrap');
      var empty = document.getElementById('assignmentsEmpty');
      return {
        shown: !view.classList.contains('hidden'),
        classShown: !document.getElementById('classView').classList.contains('hidden'),
        homeShown: !document.getElementById('homeView').classList.contains('hidden'),
        /* A view lives in <main>. A dialog would not, and would carry the semantics below. */
        inMain: !!view.closest('main'),
        dialogBits: view.querySelectorAll('[role="dialog"], [aria-modal], .modal-overlay').length,
        openModals: document.querySelectorAll('.modal-overlay:not(.hidden)').length,
        managerOpen: !document.getElementById('classesModal').classList.contains('hidden'),
        heading: (document.getElementById('assignmentsClassName')||{}).textContent,
        summary: (document.getElementById('assignmentsSummary')||{}).textContent,
        emptyText: empty ? empty.textContent : '',
        emptyHidden: empty ? empty.classList.contains('hidden') : null,
        wrapHidden: wrap ? wrap.classList.contains('hidden') : null,
        names: data.map(function(r){ return r.querySelector('.assign-name').textContent; }),
        points: data.map(function(r){ return r.querySelector('.assign-pts').textContent; }),
        dates: data.map(function(r){ return Array.prototype.slice.call(
          r.querySelectorAll('.assign-date')).map(function(d){ return d.textContent; }); }),
        counts: data.map(function(r){ return (r.querySelector('.assign-count')||{}).textContent; }),
        extras: data.map(function(r){ return !!r.querySelector('.assign-extra'); }),
        overdue: body.querySelectorAll('.assign-date.overdue').length,
        rowButtons: data.length ? data[0].querySelectorAll('.assign-row-actions button').length : 0,
        groups: rows.filter(function(r){ return r.classList.contains('assign-group-head'); })
          .map(function(r){ return r.querySelector('.assign-group-title').textContent
            .replace(/\\s+/g, ' ').trim(); }),
        notes: Array.prototype.slice.call(body.querySelectorAll('.assign-group-empty'))
          .map(function(p){ return p.textContent.replace(/\\s+/g, ' ').trim(); }),
        orphans: Array.prototype.slice.call(body.querySelectorAll('.assign-group-orphan'))
          .map(function(p){ return p.textContent.replace(/\\s+/g, ' ').trim(); }),
        /* An assignment name and a category name are both teacher-typed, and one of each below
           carries markup on purpose. The chip's own <b> holds the weight, so it is excluded by
           asking the NAME cells and the group titles rather than the whole table. */
        injected: body.querySelectorAll('.assign-name b, .assign-name i, .assign-name script,'
          + ' .assign-group-title b:not(.cat-chip b), .assign-group-title i').length,
        chips: body.querySelectorAll('.cat-chip').length
      };
    };
    window.__strip = function(){
      return Array.prototype.slice.call(document.querySelectorAll('[data-screen-nav]'))
        .map(function(s){
          var btns = Array.prototype.slice.call(s.querySelectorAll('.screen-nav-btn'));
          return {
            /* Visible ones only tell you what a teacher can reach; both strips are read so that a
               hidden one cannot be holding a stale active mark or a name it should not have. */
            visible: !!s.offsetParent,
            inHeader: !!s.closest('.header'),
            inMain: !!s.closest('main'),
            labels: btns.map(function(b){ return b.textContent; }),
            hooks: btns.map(function(b){ return b.getAttribute('data-class-screen'); }),
            active: btns.map(function(b){ return b.classList.contains('active'); }),
            current: btns.map(function(b){ return b.getAttribute('aria-current'); }),
            disabled: btns.map(function(b){ return b.disabled; }),
            detail: s.querySelectorAll('.screen-nav-btn.detail').length
          };
        });
    };
    window.__adoc = function(){
      var d = window.planbook.store.getDoc();
      return {
        rev: d.rev,
        assignments: d.assignments.map(function(a){ return { id:a.id, classId:a.classId,
          termId:a.termId, categoryId:a.categoryId, name:a.name, points:a.points,
          assigned:a.assigned, due:a.due }; }),
        scoreKeys: Object.keys(d.scores),
        scores: JSON.stringify(d.scores),
        /* Parsed, because src/prefs.js stores every preference as JSON — the raw string carries
           its own quotation marks, and a check comparing it to the bare word would go red about
           the storage format rather than about the rule. (No backticks in this comment: it is
           inside a template literal.) */
        openView: JSON.parse(localStorage.getItem('planbook_openView') || 'null')
      };
    }; return 1; })()`;
  await evalJs(INSTALL_ASSIGN_READER);

  /* Typing into the editor, through the real field and the real delegated listener: setting
     `.value` and dispatching `input` is the path a keystroke takes, and shell.js reads the element
     rather than the event's provenance. */
  const typeField = async (field, value) => {
    await evalJs(`(function(){
      var f = document.querySelector('#assignmentFields [data-assignment-field="${field}"]');
      if (!f) return 0;
      f.value = ${JSON.stringify(String(value))};
      f.dispatchEvent(new Event('input', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 120));
  };
  /* A <select> commits on `change`, which is the event src/shell.js listens for on both of these —
     dispatching `input` here would prove nothing about the path a tap takes. */
  const pickSelect = async (sel, value) => {
    await evalJs(`(function(){
      var s = document.querySelector(${JSON.stringify(sel)});
      if (!s) return 0;
      s.value = ${JSON.stringify(String(value))};
      s.dispatchEvent(new Event('change', { bubbles: true }));
      return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
  };
  const closeAssignDialogs = () => evalJs("['assignmentDeleteModal','assignmentCopyModal',"
    + "'assignmentModal','categoriesModal','classesModal','rosterModal','studentModal']"
    + ".forEach(function(m){ window.planbook.closeModal(m); }); 1");

  await closeAssignDialogs();

  /*
    WHICH CLASS THIS SECTION WORKS IN, chosen off the document rather than written down: the biggest
    roster among the classes that have both a term and a category, because the coverage bar's
    denominator is the roster and a class with none of it would make three checks vacuous. The
    duplicate's target is another active class with a term of its own.
  */
  const stage = await evalJs(`(function(){
    var c = window.planbook.classes; var d = window.planbook.store.getDoc();
    var live = c.getActiveClasses().map(function(cls){
      return { id: cls.id, name: cls.name, roster: (cls.roster||[]).length,
        terms: c.getTerms(cls.id).map(function(t){ return t.id; }),
        catIds: (cls.categories||[]).map(function(k){ return k.id; }),
        catNames: (cls.categories||[]).map(function(k){ return k.name; }),
        catWeights: (cls.categories||[]).map(function(k){ return Number(k.weight) || 0; }) };
    });
    var usable = live.filter(function(x){ return x.terms.length && x.catIds.length; });
    var source = usable.slice().sort(function(a, b){ return b.roster - a.roster; })[0] || null;
    var target = usable.filter(function(x){ return source && x.id !== source.id; })[0] || null;
    return { source: source, target: target, classes: live,
      tabs: Array.prototype.slice.call(document.querySelectorAll('#classTabBar [data-class-tab]'))
        .map(function(b){ return b.getAttribute('data-class-tab'); }) };
  })()`);

  if (!stage.source || !stage.target) {
    skip('assignments: the list, the switcher, the zero-point field, the duplicate and the delete',
      'this run did not leave two classes with a term and a category each, so there is nothing to '
      + 'file work in — the fixture is the defect, not the app');
  } else {
    const src = stage.source;
    const dst = stage.target;

    /* Into the source class the way a teacher does — a tab on the header strip, which also puts
       the class view up. The class manager is not opened anywhere in this block, which is half of
       acceptance line 5. */
    const tabIndex = stage.tabs.indexOf(src.id);
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);

    /*
      TWO STUDENTS, IF THIS CLASS HAS NONE — added through the real roster form, and taken out again
      at the end of this section so the sections after it see the document they expect.

      The coverage bar's denominator IS the roster, so a class with an empty one turns three checks
      below into `0/0`, which is a number that passes whatever the app does. The only class this run
      leaves with a roster is the one restored from a pre-WO-3.1 backup, which has neither terms nor
      categories and so cannot hold an assignment at all — hence a fixture rather than a hunt.
      Deliberately not added to that class: the attendance section asserts it draws exactly 26 rows,
      and a fixture that quietly changed another section's arithmetic is worse than no fixture.
    */
    let planted = [];
    if (src.roster === 0) {
      await clickSel('#headerRightControls [data-roster-manage]');
      for (const who of ['Coverage, Ada', 'Coverage, Bo']) {
        await evalJs('(function(){ document.getElementById("rosterNewInput").value = '
          + JSON.stringify(who) + '; return 1; })()');
        await clickSel('[data-roster-create] button[type="submit"]');
      }
      planted = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
        var cls = d.classes.filter(function(c){ return c.id === ${JSON.stringify(src.id)}; })[0];
        return (cls.roster || []).slice(); })()`);
      await evalJs("window.planbook.closeModal('rosterModal'); 1");
    }
    const rosterSize = planted.length || src.roster;
    check('the coverage fixture is real: this class has a roster for the bar to be a fraction of',
      rosterSize >= 2,
      rosterSize + ' student(s) on ' + src.name
        + (planted.length ? ' (added here through the roster form, removed again below)' : ''));

    /*
      ACCEPTANCE LINE 7, first half — and it is asserted on BOTH strips, because they are two
      renderings of one control drawn by one module and a build that painted only the visible one
      would flash the wrong active segment for a frame on every switch.

      FOUR SEGMENTS SINCE WO-6.6, named, in order, with no fifth — and this check was THREE, in as
      many words, from 2026-08-09 until 2026-08-19. Both dates are the owner's: *THREE TABS, NOT
      FOUR* was his call against the drawn candidate, and Calendar is his reversal of it ten days
      later, because the calendar is the first surface that is ABOUT a class without being OWNED by
      one (plans/gradebook-surfaces.md carries the reversal with both dates on it). The count is
      still asserted exactly rather than as "at least", which is what makes a fifth tab arriving
      without a decision behind it turn this red.

      A student's name is still not among them: WO-3.7's per-student detail is reached by tapping a
      name, and the half of the 2026-08-09 record that covers it is unchanged — a segment that is
      dead until something has been chosen does not belong on this strip. That is the distinction the
      reversal turns on, and it is why the breadcrumb count is read beside the labels.
    */
    const stripOnClass = await evalJs('window.__strip()');
    const wantLabels = ['Attendance', 'Assignments', 'Scores', 'Calendar', 'Signals'];
    check('the switcher carries exactly five tabs — Attendance, Assignments, Scores, Calendar, '
      + 'Signals — and no student tab',
      stripOnClass.length >= 2
        && stripOnClass.every((s) => JSON.stringify(s.labels) === JSON.stringify(wantLabels))
        && stripOnClass.every((s) => s.detail === 0)
        && stripOnClass.some((s) => s.visible),
      stripOnClass.length + ' strip(s): ' + JSON.stringify(stripOnClass.map((s) => s.labels)));
    /* And it is on the white panel in <main>, never in the navy header — a measurement rather than
       a taste: src/classes.js records that a fourth control up there overflows at 390px. */
    check('the strip sits on the panel inside <main> rather than in the header strip',
      stripOnClass.every((s) => s.inMain && !s.inHeader),
      'inMain ' + JSON.stringify(stripOnClass.map((s) => s.inMain))
        + ', inHeader ' + JSON.stringify(stripOnClass.map((s) => s.inHeader)));
    /* All three carry their hook and none is disabled since WO-3.5 landed #scoresView. This check
       asserted the OPPOSITE of the third one until 2026-08-10 — "Scores is drawn but not yet
       reachable" — and stayed green through a build that shipped the view with its only door greyed
       out, because src/screen-nav.js still held a hardcoded `pending` string. That is the shape of a
       check that outlives the state it describes: it went on measuring the build it was written
       against. It is worded as a question about the SET now, so the day a fourth screen is drawn
       ahead of its view the disabled one is named rather than assumed. */
    check('Attendance is the active segment on a freshly opened class, and all five segments carry their hook',
      stripOnClass.every((s) => s.active[0] === true && s.current[0] === 'true')
        && stripOnClass.every((s) => s.disabled.every((d) => d === false))
        && stripOnClass.every((s) => s.hooks[0] === 'class' && s.hooks[1] === 'assignments'
          && s.hooks[2] === 'scores' && s.hooks[3] === 'calendar' && s.hooks[4] === 'signals'),
      'active ' + JSON.stringify(stripOnClass[0].active)
        + ', disabled ' + JSON.stringify(stripOnClass[0].disabled)
        + ', hooks ' + JSON.stringify(stripOnClass[0].hooks));

    /*
      ACCEPTANCE LINE 5. One tap on the strip, and what arrives is a VIEW: a sibling of #homeView
      and #classView inside <main>, carrying no dialog semantics of its own, with no overlay open
      behind or in front of it — and the class manager never opened on the way.
    */
    await clickSel('#classView [data-class-screen="assignments"]');
    const listUp = await evalJs('window.__assign()');
    check('the assignment list is a view in <main>, not a dialog, and one tap on the strip gets there',
      listUp.shown && !listUp.classShown && !listUp.homeShown && listUp.inMain
        && listUp.dialogBits === 0 && listUp.openModals === 0 && !listUp.managerOpen,
      'shown ' + listUp.shown + ', in <main> ' + listUp.inMain + ', dialog bits '
        + listUp.dialogBits + ', open overlays ' + listUp.openModals);
    const stripOnList = await evalJs('window.__strip()');
    check('the class\'s screens are switchable without passing through the class manager, and the active segment followed',
      stripOnList.every((s) => s.active[1] === true && s.active[0] === false
        && s.current[1] === 'true')
        && stripOnList.some((s) => s.visible),
      'active ' + JSON.stringify(stripOnList[0].active));

    /*
      A CLASS WITH NO WORK IN IT SAYS SO. The empty state is a sentence naming the class and the
      term rather than a table of headings with nothing under them — the roster's own idiom.
    */
    check('an empty list says so in words, naming the class and the term, with no table drawn',
      listUp.wrapHidden === true && listUp.emptyHidden === false
        && listUp.emptyText.indexOf(src.name) >= 0 && /New assignment/.test(listUp.emptyText)
        && listUp.names.length === 0,
      JSON.stringify(listUp.emptyText.slice(0, 110)));

    /*
      ACCEPTANCE LINE 4, RE-POINTED AT WO-3.17 RATHER THAN DELETED, because the half of it that
      matters did not change. It used to assert that a brand-new assignment's dates were EMPTY; the
      owner overruled that on 2026-08-10 and both now arrive on TODAY, which is a fact about the day
      rather than a guess at a schedule. What this line was really guarding is still guarded here
      and by WO-3.17's own section at the foot of this file: nothing is defaulted to the term's
      start, and above all nothing is defaulted to "the next time this class meets", which would
      need the schedule model plans/rotating-schedule.md deleted.

      Today is compared against `nodeToday`, derived in Node above rather than asked of the app —
      two runtimes, one clock, one answer. A check that read the value back out of the field it was
      written from would agree with a build that wrote UTC's tomorrow into an October evening.
    */
    await clickSel('#assignmentsView [data-assignment-new]');
    const fresh = await evalJs(`(function(){
      var doc = window.__adoc();
      var mine = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(src.id)}; });
      var fields = {};
      ['name','points','assigned','due'].forEach(function(f){
        var el = document.querySelector('#assignmentFields [data-assignment-field="' + f + '"]');
        fields[f] = el ? el.value : null;
      });
      var cat = document.querySelector('#assignmentFields [data-assignment-category]');
      return { made: mine[mine.length - 1] || null, count: mine.length, fields: fields,
        editorOpen: !document.getElementById('assignmentModal').classList.contains('hidden'),
        catOptions: cat ? cat.options.length : 0, catValue: cat ? cat.value : null,
        dateInputs: document.querySelectorAll('#assignmentFields input[type="date"]').length }; })()`);
    check('no date field auto-populates from anything schedule-shaped: a new assignment arrives on today in both dates and nowhere else, in the document and on the fields',
      !!fresh.made && fresh.made.assigned === nodeToday && fresh.made.due === nodeToday
        && fresh.fields.assigned === nodeToday && fresh.fields.due === nodeToday
        && fresh.dateInputs === 2 && fresh.editorOpen,
      JSON.stringify({ node: nodeToday, assigned: fresh.made && fresh.made.assigned,
        due: fresh.made && fresh.made.due,
        fields: fresh.fields.assigned + '|' + fresh.fields.due }));
    /* It lands in the open class and the open term, filed under the class's first category —
       which is a starting point rather than a guess at a better one, and the select offers the
       rest. */
    check('a new assignment belongs to the open class, the open term and one of that class\'s own categories',
      fresh.made.classId === src.id && src.terms.indexOf(fresh.made.termId) >= 0
        && src.catIds.indexOf(fresh.made.categoryId) >= 0
        && fresh.catValue === fresh.made.categoryId
        && fresh.catOptions === src.catIds.length,
      JSON.stringify({ classId: fresh.made.classId === src.id, termId: fresh.made.termId,
        categoryId: fresh.made.categoryId, options: fresh.catOptions }));

    const firstId = fresh.made.id;

    /*
      ACCEPTANCE LINE 1, the half that exists in this build. `0` is the extra-credit mechanism
      (docs/data-model.md § Extra credit, owner 2026-08-09), so the field has to take it and the
      document has to keep it — not default it back, not refuse it, not turn it into a blank. Typed
      through the real field, read back out of the document, and then read off the row, where it is
      labelled in words so a lone zero cannot read as a slip.
    */
    await typeField('name', 'Bonus <b>lab</b> write-up');
    await typeField('points', '0');
    const zeroed = await evalJs(`(function(){ var doc = window.__adoc();
      var a = doc.assignments.filter(function(x){ return x.id === ${JSON.stringify(firstId)}; })[0];
      var f = document.querySelector('#assignmentFields [data-assignment-field="points"]');
      return { a: a, field: f ? f.value : null, type: f ? f.type : null,
        min: f ? f.getAttribute('min') : null }; })()`);
    check('a zero-point assignment can be created: 0 is typed, kept as 0, and never defaulted or refused',
      zeroed.a && zeroed.a.points === 0 && zeroed.field === '0' && zeroed.type === 'number',
      'points stored ' + JSON.stringify(zeroed.a && zeroed.a.points) + ', field reads '
        + JSON.stringify(zeroed.field));
    await clickSel('#assignmentModal [data-modal-close]');
    const withZero = await evalJs('window.__assign()');
    check('the row says EXTRA CREDIT in words beside the 0, so a zero cannot read as a mistake',
      withZero.names.length === 1 && withZero.points[0] === '0' && withZero.extras[0] === true
        && /Extra credit/i.test(withZero.names[0]),
      JSON.stringify(withZero.names[0]) + ' at ' + JSON.stringify(withZero.points[0]));
    /* And the name is text. An assignment name is typed by a teacher, and "Bonus <b>lab</b>
       write-up" has to be those characters rather than markup. */
    check('an assignment name carrying markup is rendered as text',
      withZero.injected === 0 && withZero.names[0].indexOf('<b>lab</b>') >= 0,
      withZero.injected + ' element(s) built from a name or a category title');

    /*
      THE EMPTY CATEGORIES, AND WHAT EACH ONE COSTS. Every category with nothing filed under it is
      drawn and says its own consequence — a weight that redistributes (docs/data-model.md § Grade
      math) or, at 0%, that it counts for nothing either way. The expected sentences are derived
      HERE from the class's own weights, so this cannot pass by printing one sentence everywhere.
    */
    const emptyCats = src.catIds
      .map((id, i) => ({ id, name: src.catNames[i], weight: src.catWeights[i] }))
      .filter((c) => c.id !== fresh.made.categoryId);
    const withZeroWeight = emptyCats.filter((c) => c.weight === 0).length;
    check('every empty category is drawn with its consequence in words, and a 0% one says something different',
      withZero.notes.length === emptyCats.length
        && emptyCats.every((c, i) => withZero.notes[i].indexOf(c.name) >= 0)
        && emptyCats.every((c, i) => (c.weight === 0
          ? /counts for nothing either way/.test(withZero.notes[i])
          : /redistributes/.test(withZero.notes[i])))
        && withZero.groups.length === src.catIds.length
        && withZero.chips === src.catIds.length,
      emptyCats.length + ' empty categor(ies), ' + withZeroWeight + ' at 0% :: '
        + JSON.stringify(withZero.notes.map((n) => n.slice(0, 48))));

    /*
      ACCEPTANCE LINE 2, the half that exists. A second assignment, worth real points, moved between
      categories through the real <select> — with a score column planted on it first, so that the
      claim "the work moves and its scores go with it" is asserted against a column that exists
      rather than against an empty object. The other half of the line names a displayed grade and is
      re-homed to WO-3.5 in the work order.
    */
    await clickSel('#assignmentsView [data-assignment-new]');
    await typeField('name', 'Unit 1 test');
    await typeField('points', '100');
    await typeField('assigned', '2026-09-14');
    await typeField('due', '2026-09-18');
    await clickSel('#assignmentModal [data-modal-close]');
    const secondId = await evalJs(`(function(){ var d = window.__adoc().assignments
      .filter(function(a){ return a.classId === ${JSON.stringify(src.id)}; });
      return d[d.length - 1].id; })()`);
    /* The only write in this section that does not go through a control, and it is here because
       there is no score entry in this build at all — WO-3.5 owns it. Everything read back about it
       is read off the real screen and the real dialogs. */
    const scoredStudent = await evalJs(`(function(){ var s = window.planbook.store;
      var cls = s.getDoc().classes.filter(function(c){ return c.id === ${JSON.stringify(src.id)}; })[0];
      var who = (cls.roster || [])[0]; if (!who) return '';
      s.update(function(d){ var col = {}; col[who] = { v: 87 };
        d.scores[${JSON.stringify(secondId)}] = col; });
      return who; })()`);
    await evalJs('window.planbook.assignments.renderAssignments(); 1');
    const scored = await evalJs('window.__assign()');
    check('the coverage bar counts entered cells against the class roster rather than guessing',
      !!scoredStudent && rosterSize > 0
        && scored.counts.indexOf('1/' + rosterSize) >= 0
        && scored.counts.indexOf('0/' + rosterSize) >= 0,
      JSON.stringify(scored.counts) + ' over a roster of ' + rosterSize);

    const beforeMove = await evalJs('window.__adoc()');
    const otherCat = src.catIds.filter((id) => id !== fresh.made.categoryId)[0];
    await clickSel('#assignmentsView [data-assignment-edit="' + secondId + '"]');
    await pickSelect('#assignmentFields [data-assignment-category]', otherCat);
    await clickSel('#assignmentModal [data-modal-close]');
    const moved = await evalJs(`(function(){ var live = window.__assign();
      var doc = window.__adoc();
      live.moved = doc.assignments.filter(function(a){ return a.id === ${JSON.stringify(secondId)}; })[0];
      live.scores = doc.scores; live.scoreKeys = doc.scoreKeys; return live; })()`);
    check('an assignment can be moved between categories, and its scores go with it untouched',
      moved.moved.categoryId === otherCat
        && moved.moved.classId === src.id
        && moved.scores === beforeMove.scores
        && moved.groups.length === src.catIds.length,
      'now in ' + moved.moved.categoryId + ' :: score column byte-identical = '
        + (moved.scores === beforeMove.scores));
    /* And the row went with it on screen, which is the half of "moved" a document read cannot see:
       it is drawn under the group head of the category it now counts in. */
    const movedWhere = await evalJs(`(function(){
      var rows = Array.prototype.slice.call(document.querySelectorAll('#assignmentsBody tr'));
      var head = ''; var out = '';
      rows.forEach(function(r){
        if (r.classList.contains('assign-group-head')) head = r.querySelector('.assign-group-title').textContent;
        var n = r.querySelector('.assign-name');
        if (n && n.textContent.indexOf('Unit 1 test') === 0) out = head;
      });
      return out.replace(/\\s+/g, ' ').trim(); })()`);
    check('and the row is drawn under the group head of the category it now counts in',
      movedWhere.indexOf(src.catNames[src.catIds.indexOf(otherCat)]) >= 0,
      JSON.stringify(movedWhere.slice(0, 70)));

    /*
      THE TERM NAV SITS IN THE HEADER ON EVERY CLASS SCREEN, AND THE WHOLE OF THIS LIST IS
      TERM-FILTERED. *(Added 2026-08-09, correction round 1, with the one-line fix in src/shell.js's
      [data-term-select] branch.)* Before it, tapping Quarter 2 moved the chip in the header and
      left the table, the caption and the summary line all describing Quarter 1 — the first surface
      in this app where a term switch gets the entire body wrong rather than one figure, which is
      why it was fixed here first. The registry's own term-totals gap, left then to whoever owned
      it, is WO-2.17 — its block sits directly below this section, and the chain both screens now
      hang off is src/shell.js's afterTermChange().

      TWO TERMS ARE NEEDED TO SWITCH BETWEEN and this class may only have one, so one is added
      through the real term editor when that is the case and taken down with the rest of the fixture
      at the foot of this section.
    */
    const TERM_NAV = `(function(){
      var nav = document.getElementById('termNav');
      var btns = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-term-select]')) : [];
      return btns.map(function(b){ return { id: b.getAttribute('data-term-select'),
        label: b.textContent, active: b.classList.contains('active') }; }); })()`;
    let termTabs = await evalJs(TERM_NAV);
    let plantedTerm = '';
    if (termTabs.length < 2) {
      await clickSel('header [data-class-manage]');
      await clickSel('#classList [data-term-manage="' + src.id + '"]');
      await clickSel('#termsModal [data-term-add]');
      await clickSel('#termsModal [data-modal-close]');
      await closeAssignDialogs();
      termTabs = await evalJs(TERM_NAV);
      plantedTerm = (termTabs.filter((t) => src.terms.indexOf(t.id) < 0)[0] || {}).id || '';
    }
    const openTerm = termTabs.filter((t) => t.active)[0] || termTabs[0];
    const otherTerm = termTabs.filter((t) => t.id !== openTerm.id)[0];
    check('the term fixture is real: this class has two terms to switch between',
      termTabs.length >= 2 && !!openTerm && !!otherTerm && openTerm.id !== otherTerm.id,
      termTabs.length + ' term(s): ' + JSON.stringify(termTabs.map((t) => t.label))
        + (plantedTerm ? ' (one added here through the term editor, removed below)' : ''));
    /* Named by the summary line's own shape — "Assignments · <term> · …" — rather than by searching
       for the label anywhere in it, so two terms whose labels share a prefix cannot pass this. */
    const summaryFor = (t) => 'Assignments · ' + t.label + ' · ';
    await clickSel('#termNav [data-term-select="' + otherTerm.id + '"]');
    const otherTermUp = await evalJs('window.__assign()');
    check('switching term repaints the assignment list instead of leaving the other term\'s work on screen under a new heading',
      otherTermUp.shown
        && otherTermUp.names.every((n) => n.indexOf('Unit 1 test') === -1)
        && otherTermUp.names.every((n) => n.indexOf('Bonus') === -1)
        && otherTermUp.summary.indexOf(summaryFor(otherTerm)) === 0,
      JSON.stringify(otherTermUp.summary) + ' over rows '
        + JSON.stringify(otherTermUp.names.map((n) => n.slice(0, 24))));
    await clickSel('#termNav [data-term-select="' + openTerm.id + '"]');
    const backOnTerm = await evalJs('window.__assign()');
    check('and switching back brings that term\'s own work back, with the summary line naming it',
      backOnTerm.names.length === 2
        && backOnTerm.summary.indexOf(summaryFor(openTerm)) === 0
        && backOnTerm.names.some((n) => n.indexOf('Unit 1 test') === 0),
      JSON.stringify(backOnTerm.summary));

    /*
      ACCEPTANCE LINE 3, and this work order's named TRAP in the same breath. Duplicating into
      another class produces a NEW assignment with no scores attached — and the copy carries the
      TARGET class's own ids. A copy that kept the source's `categoryId` would sit in the target
      filed under a category only the source has: invisible on its list, counted by nothing, and
      destroyed by a category removal in the source under a dialog naming the source.

      THE FIXTURE IS BUILT IN BOTH DIRECTIONS NOW, AND THAT IS WHY THIS BLOCK IS LONG.
      *(Rebuilt 2026-08-09, correction round 1.)* Its first cut asserted "the copy wears the
      target's id for its category name, or none" against a document in which no class was ever
      named like another — so `matchCategory()` only ever took its `return ''` path, and a version
      of it that returned `''` unconditionally would have passed every check in this file. The
      REFUSAL was measured and the MATCH was not, which is the same shape as the `termId` finding
      four checks up and was invisible for the same reason: nothing in the fixture could express the
      failure. Both cases are constructed here rather than hoped for. The source's category is first
      renamed to a name no other class has — the no-match case, and the one the dialog has to be
      honest about — and the target is then given a category of that same name through the real
      category manager, which is the match case and the only one that can tell the target's id for a
      name apart from the source's.
    */
    const catRowIndex = src.catIds.indexOf(otherCat);
    const sourceCatName = src.catNames[catRowIndex];
    /* Distinctive on purpose: the claim below is that no OTHER class has a category of this name,
       and a name a teacher might plausibly reuse would make that an accident rather than a fixture. */
    const PROBE_CAT = 'Copy probe — labs (WO-3.3)';
    await clickSel('header [data-class-manage]');
    await clickSel('#classList [data-category-manage="' + src.id + '"]');
    await evalJs(`(function(){
      var f = document.querySelectorAll('#categoryList .category-name-input')[${catRowIndex}];
      if (!f) return 0;
      f.value = ${JSON.stringify(PROBE_CAT)};
      f.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
    await closeAssignDialogs();
    /* Both classes' categories read off the document, because the ids are what the two cases below
       are about and `stage` was taken before either of these edits. */
    const catsNow = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
      var pick = function(id){ var cls = d.classes.filter(function(c){ return c.id === id; })[0];
        return (cls.categories || []).map(function(k){ return { id: k.id, name: k.name }; }); };
      return { src: pick(${JSON.stringify(src.id)}), dst: pick(${JSON.stringify(dst.id)}) }; })()`);
    const probeInSrc = catsNow.src.filter((k) => k.id === otherCat)[0];
    check('the duplicate fixture is real: the source\'s category has a name the target class does not use',
      !!probeInSrc && probeInSrc.name === PROBE_CAT
        && catsNow.dst.length >= 1
        && catsNow.dst.every((k) => k.name !== PROBE_CAT),
      'source category ' + JSON.stringify(PROBE_CAT) + ' :: ' + dst.name + ' holds '
        + JSON.stringify(catsNow.dst.map((k) => k.name)));

    /* One read of the dialog, used three times below, so the two proposals and the pick in between
       cannot drift apart by being read differently. `catShown` is what the CONTROL displays —
       the selected option's value rather than the variable behind it, which is the whole of the
       first defect this round came back for. */
    const COPY_READ = `(function(){
      var term = document.querySelector('[data-assignment-copy-term]');
      var cat = document.querySelector('[data-assignment-copy-category]');
      var opts = cat ? Array.prototype.slice.call(cat.options) : [];
      var shown = cat && cat.selectedIndex >= 0 ? opts[cat.selectedIndex] : null;
      return {
        open: !document.getElementById('assignmentCopyModal').classList.contains('hidden'),
        lead: (document.getElementById('assignmentCopyLead')||{}).textContent.replace(/\\s+/g,' '),
        note: (document.getElementById('assignmentCopyNote')||{}).textContent.replace(/\\s+/g,' '),
        button: (document.getElementById('assignmentCopyBtn')||{}).textContent,
        term: term ? term.value : null, category: cat ? cat.value : null,
        catOptions: opts.map(function(o){ return o.value; }),
        catShown: shown ? shown.value : null,
        catShownLabel: shown ? shown.textContent : null,
        classes: document.querySelectorAll('#assignmentCopyClasses .pill').length,
        active: document.querySelectorAll('#assignmentCopyClasses .pill.active').length }; })()`;

    await clickSel('#assignmentsView [data-assignment-duplicate="' + secondId + '"]');
    await clickSel('#assignmentCopyClasses [data-assignment-copy-class="' + dst.id + '"]');
    const proposal = await evalJs(COPY_READ);
    check('the duplicate dialog proposes the TARGET class\'s own term, and files under nothing when that class has no category of the source\'s name',
      proposal.open && dst.terms.indexOf(proposal.term) >= 0
        && proposal.category === ''
        && proposal.active === 1 && proposal.classes >= 2
        && proposal.button.indexOf(dst.name) >= 0
        && /no scores/.test(proposal.lead)
        && proposal.note.indexOf(PROBE_CAT) >= 0 && /Pick one above/.test(proposal.note),
      JSON.stringify({ term: dst.terms.indexOf(proposal.term) >= 0, category: proposal.category,
        button: proposal.button }));
    /*
      AND THE CONTROL SHOWS WHAT THE PROPOSAL HOLDS. A <select> with no option marked `selected`
      displays its first one, so an unmatched proposal against a class that HAS categories drew
      "Homework — 25%" while the copy was filed under nothing: the teacher reads the dialog, taps
      Copy into Period 2, and finds the row under the red "Not in a category" banner. The reachable
      half is the same defect from the other side — the option a select is already displaying fires
      no `change` when it is tapped, so the note's own "Pick one above" was unreachable for exactly
      the option it pointed at. Asserted as: the displayed option is the placeholder, and every real
      category sits below it, in the target's own order and with the target's own ids.
    */
    check('the copy dialog never displays a category it will not file the copy under, and every real category is a change away from what is shown',
      proposal.catShown === '' && proposal.catOptions[0] === ''
        && /choose a category/i.test(proposal.catShownLabel || '')
        && proposal.catOptions.length === catsNow.dst.length + 1
        && proposal.catOptions.slice(1).every((v, i) => v === catsNow.dst[i].id),
      'displaying ' + JSON.stringify(proposal.catShownLabel) + ' for a proposal of '
        + JSON.stringify(proposal.category) + ' over ' + catsNow.dst.length + ' real categor(ies)');
    /* And picking one through the real control moves the proposal onto it and takes the placeholder
       away with it — so it cannot be chosen back into by accident, which is the rule
       categoryField() states for the editor's own select. */
    await pickSelect('[data-assignment-copy-category]', catsNow.dst[0].id);
    const picked = await evalJs(COPY_READ);
    check('picking a category in the duplicate dialog moves the proposal onto it and retires the placeholder',
      picked.category === catsNow.dst[0].id && picked.catShown === catsNow.dst[0].id
        && picked.catOptions.indexOf('') === -1
        && picked.catOptions.length === catsNow.dst.length
        && !/Pick one above/.test(picked.note),
      'proposal now ' + JSON.stringify(picked.category) + ', options '
        + picked.catOptions.length + ' with no placeholder among them');
    await clickSel('[data-assignment-copy-cancel]');

    /*
      THE MATCH CASE. The target class gets a category of the source's own name, through the real
      manager — [data-category-add] puts it at 0% and disturbs no other weight — and the copy must
      come out wearing THAT class's id for that name. This is the half no run in this tree exercised
      before today.
    */
    await clickSel('header [data-class-manage]');
    await clickSel('#classList [data-category-manage="' + dst.id + '"]');
    await clickSel('#categoriesModal [data-category-add]');
    await evalJs(`(function(){
      var all = document.querySelectorAll('#categoryList .category-name-input');
      var last = all[all.length - 1]; if (!last) return 0;
      last.value = ${JSON.stringify(PROBE_CAT)};
      last.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
    await new Promise(r => setTimeout(r, 150));
    await closeAssignDialogs();
    const twin = await evalJs(`(function(){ var d = window.planbook.store.getDoc();
      var cls = d.classes.filter(function(c){ return c.id === ${JSON.stringify(dst.id)}; })[0];
      var cats = cls.categories || [];
      var hit = cats.filter(function(k){ return k.name === ${JSON.stringify(PROBE_CAT)}; });
      return { id: hit.length === 1 ? hit[0].id : '', count: cats.length,
        ids: cats.map(function(k){ return k.id; }) }; })()`);
    check('the target class now holds a category of the source\'s own name, under an id of its own',
      !!twin.id && twin.id !== otherCat && twin.ids.indexOf(otherCat) === -1
        && twin.count === catsNow.dst.length + 1,
      dst.name + ' category ' + JSON.stringify(twin.id) + ' for the name ' + JSON.stringify(PROBE_CAT)
        + ', where the source\'s id for it is ' + JSON.stringify(otherCat));

    await clickSel('#assignmentsView [data-assignment-duplicate="' + secondId + '"]');
    await clickSel('#assignmentCopyClasses [data-assignment-copy-class="' + dst.id + '"]');
    const matched = await evalJs(COPY_READ);
    check('with a category of that name in the target, the dialog proposes the TARGET\'s id for it and shows it',
      matched.category === twin.id && matched.catShown === twin.id
        && matched.category !== otherCat
        && matched.catOptions.indexOf('') === -1
        && /The dates come across as they are/.test(matched.note),
      'proposed ' + JSON.stringify(matched.category) + ' and displayed '
        + JSON.stringify(matched.catShownLabel));

    const beforeCopy = await evalJs('window.__adoc()');
    await clickSel('[data-assignment-copy-confirm]');
    const copied = await evalJs(`(function(){ var doc = window.__adoc();
      var made = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(dst.id)}; });
      doc.copy = made[made.length - 1] || null;
      doc.copyOpen = !document.getElementById('assignmentCopyModal').classList.contains('hidden');
      return doc; })()`);
    check('duplicating into another class produces a new assignment with no scores attached',
      !!copied.copy && copied.copy.id !== secondId
        && copied.copy.classId === dst.id
        && dst.terms.indexOf(copied.copy.termId) >= 0
        && copied.scoreKeys.indexOf(copied.copy.id) === -1
        && copied.scoreKeys.indexOf(secondId) >= 0
        && copied.assignments.length === beforeCopy.assignments.length + 1
        && !copied.copyOpen,
      'copy ' + (copied.copy && copied.copy.id) + ' in ' + dst.name + ', score columns '
        + JSON.stringify(copied.scoreKeys.length) + ' (unchanged from '
        + beforeCopy.scoreKeys.length + ')');
    check('the copy is filed under the TARGET class\'s own id for that category name, never the source\'s — the trap this work order names',
      copied.copy.categoryId === twin.id
        && copied.copy.categoryId !== otherCat
        && twin.id !== otherCat
        && twin.ids.indexOf(copied.copy.categoryId) >= 0
        && catsNow.src.every((k) => k.id !== copied.copy.categoryId)
        && copied.copy.classId === dst.id,
      JSON.stringify(PROBE_CAT) + ': source id ' + JSON.stringify(otherCat) + ' -> copy id '
        + JSON.stringify(copied.copy.categoryId) + ' (matched by name in ' + dst.name + ')');
    /* And the points and both dates came across as they were — a duplicate that dropped the dates
       would be a form to fill in twice, which is what this control exists to stop. */
    check('the copy carries the points and both dates across, and nothing else about the source moved',
      copied.copy.points === 100 && copied.copy.assigned === '2026-09-14'
        && copied.copy.due === '2026-09-18'
        && JSON.stringify(copied.assignments.filter((a) => a.id === secondId))
          === JSON.stringify(beforeCopy.assignments.filter((a) => a.id === secondId)),
      JSON.stringify({ points: copied.copy.points, assigned: copied.copy.assigned,
        due: copied.copy.due }));

    /*
      THE OTHER END OF THE TRAP. A document can arrive from a restore, a hand edit, or a build older
      than this one carrying an assignment whose `categoryId` belongs to this class and whose
      `classId` does not. It must be absent from this class's list, and — the expensive half —
      absent from the count in the category-removal confirm, which is what decides how much work a
      teacher agrees to destroy.

      THE PLANT CARRIES THE SOURCE'S TERM ID AS WELL, AND THAT IS THE WHOLE FIXTURE. The first
      version of it used the target class's own term, and the mutation run said so: dropping the
      `classId` guard from assignmentsOf() turned NOTHING red, because the term filter beside it was
      already excluding the row for a reason that has nothing to do with the claim. A naive
      duplicate copies everything and changes the class, so the honest adversary shares the term as
      well as the category — and then only the guard under test can keep it off this list.
    */
    await evalJs(`(function(){ var s = window.planbook.store;
      s.update(function(d){ d.assignments.push({ id:'a_foreign', classId:${JSON.stringify(dst.id)},
        termId:${JSON.stringify(fresh.made.termId)}, categoryId:${JSON.stringify(otherCat)},
        name:'Planted in another class', points:25, assigned:'', due:'' }); });
      return 1; })()`);
    await evalJs('window.planbook.assignments.renderAssignments(); 1');
    const guarded = await evalJs('window.__assign()');
    check('work belonging to another class never appears on this class\'s list, however its category reads',
      guarded.names.every((n) => n.indexOf('Planted in another class') === -1)
        && guarded.names.length === 2,
      guarded.names.length + ' row(s): ' + JSON.stringify(guarded.names.map((n) => n.slice(0, 32))));
    /* Through the real door and the real confirm: the class manager, the Categories button on this
       class's row, and Remove on the category that holds one real assignment. "1 assignment" is the
       claim; an unguarded count says 2 and the teacher agrees to destroy work in a class the dialog
       does not name. */
    await clickSel('header [data-class-manage]');
    await clickSel('#classList [data-category-manage="' + src.id + '"]');
    await clickSel('#categoryList .category-row:nth-child(' + (catRowIndex + 1) + ') [data-category-remove]');
    const removalCount = await evalJs(`(function(){
      return { open: !document.getElementById('categoryRemoveModal').classList.contains('hidden'),
        facts: (document.getElementById('categoryRemoveFacts')||{}).textContent.replace(/\\s+/g,' ') }; })()`);
    check('and a category removal counts only the work in its own class, not work elsewhere wearing the same category id',
      removalCount.open && /1 assignment\b/.test(removalCount.facts)
        && !/2 assignments/.test(removalCount.facts),
      JSON.stringify(removalCount.facts.slice(0, 120)));
    await clickSel('[data-category-remove-cancel]');
    await closeAssignDialogs();
    await evalJs(`(function(){ var s = window.planbook.store;
      s.update(function(d){ d.assignments = d.assignments.filter(function(a){ return a.id !== 'a_foreign'; }); });
      return 1; })()`);

    /*
      ACCEPTANCE LINE 6, and it is proved the way the work order asks for — by leaving one class on
      Assignments, opening a second and coming back — rather than by reading the code. The failure
      mode is a per-class memory nobody asked for, and it is invisible until the second class.
    */
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);
    await clickSel('#classView [data-class-screen="assignments"]');
    const leftOnList = await evalJs('window.__assign()');
    const dstTab = stage.tabs.indexOf(dst.id);
    await clickSel('#classTabBar [data-class-tab]', dstTab);
    const secondClass = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); live.open = window.planbook.classes.getSelectedClassId();
      return live; })()`);
    check('opening a second class from a class left on Assignments lands on Attendance',
      leftOnList.shown && secondClass.classShown && !secondClass.shown
        && secondClass.open === dst.id
        && secondClass.strip.every((s) => s.active[0] === true),
      'left on assignments = ' + leftOnList.shown + ', second class shows attendance = '
        + secondClass.classShown);
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);
    const backAgain = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); live.open = window.planbook.classes.getSelectedClassId();
      return live; })()`);
    check('and coming back to the first class lands on Attendance too — there is no per-class memory',
      backAgain.classShown && !backAgain.shown && backAgain.open === src.id
        && backAgain.strip.every((s) => s.active[0] === true && s.active[1] === false),
      'open class ' + (backAgain.open === src.id) + ', attendance up = ' + backAgain.classShown);

    /* The way in from a card, which is the other door into a class, and it has to answer the same
       way — a teacher who left the list open and went home through "All classes" is the commonest
       route to the defect. */
    await clickSel('#classView [data-class-screen="assignments"]');
    await clickSel('#assignmentsView [data-view-home]');
    const homeFromList = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); return live; })()`);
    check('the way back to the class grid works from the assignment list, and empties the switcher on the way',
      homeFromList.homeShown && !homeFromList.shown && !homeFromList.classShown
        && homeFromList.strip.every((s) => s.labels.length === 0),
      'home up = ' + homeFromList.homeShown + ', segments left on the strip = '
        + JSON.stringify(homeFromList.strip.map((s) => s.labels.length)));
    await clickSel('#homeGrid [data-class-tab="' + src.id + '"]');
    const fromCard = await evalJs('window.__assign()');
    check('entering a class from its card lands on Attendance, not on the screen it was left on',
      fromCard.classShown && !fromCard.shown && !fromCard.homeShown,
      'attendance up = ' + fromCard.classShown + ', assignments up = ' + fromCard.shown);

    /*
      AND ACROSS A RELOAD, which is the cross-device form of the same failure: `planbook_openView`
      is this browser's own memory of where it was, and src/views.js writes every class screen down
      as `class` precisely so that there is nothing for a reload to restore. Flushed first — CDP
      tears the execution context down without waiting for a debounced write, and that loss reads as
      a store defect (tools/README.md § trap 6).
    */
    await clickSel('#classView [data-class-screen="assignments"]');
    const storedOnList = await evalJs('window.__adoc().openView');
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const assignBoot = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    await evalJs(INSTALL_CLASS_READER);
    await evalJs(INSTALL_ASSIGN_READER);
    const afterReload = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); live.doc = window.__adoc();
      live.stored = live.doc.openView; return live; })()`);
    check('a reload while the assignment list is open comes back on Attendance, because no class screen is ever written down as itself',
      assignBoot && afterReload.classShown && !afterReload.shown
        && storedOnList === 'class' && afterReload.stored === 'class'
        && afterReload.strip.every((s) => s.active[0] === true),
      assignBoot ? 'planbook_openView held ' + JSON.stringify(storedOnList)
        + ' while the list was up, and ' + JSON.stringify(afterReload.stored) + ' after the reload'
        : 'the loading screen never came down');
    /* And the work itself came back out of IndexedDB — including the 0, which is the half of
       acceptance line 1 a document read is the only witness to. By id rather than by class,
       because an earlier section left a fixture of its own on this class and a count would be
       asserting that nobody else had written anything rather than that these two survived. */
    const survived = afterReload.doc.assignments
      .filter((a) => a.id === firstId || a.id === secondId);
    check('the assignments survive a reload, zero points included',
      survived.length === 2
        && survived.some((a) => a.id === firstId && a.points === 0)
        && survived.some((a) => a.id === secondId && a.points === 100 && a.due === '2026-09-18'),
      JSON.stringify(survived.map((a) => a.name + ' @ ' + a.points)));

    /*
      ACCEPTANCE LINE 7, second half, as far as this build can take it — and the shortfall is named
      rather than papered over. WO-3.7 owns the per-student detail, so there is no screen from which
      a name can be set and then left; what CAN be asserted is the rule that makes the line true on
      the way out, which is that the name is drawn only while that screen is the one on the glass.
      Setting one with no detail open must therefore change nothing at all.
    */
    await clickSel('#classTabBar [data-class-tab]', tabIndex < 0 ? 0 : tabIndex);
    await clickSel('#classView [data-class-screen="assignments"]');
    const breadcrumb = await evalJs(`(function(){
      window.planbook.screenNav.setDetailBreadcrumb('Ada Probe');
      window.planbook.screenNav.refreshScreenNav();
      var strips = window.__strip();
      return { strips: strips,
        named: strips.some(function(s){ return s.labels.some(function(l){
          return l.indexOf('Ada Probe') >= 0; }); }) }; })()`);
    check('a student\'s name stays off the strip while no student detail is open, so it cannot outlive the screen it belongs to',
      breadcrumb.named === false
        && breadcrumb.strips.every((s) => s.detail === 0)
        && breadcrumb.strips.every((s) => JSON.stringify(s.labels) === JSON.stringify(wantLabels)),
      'segments ' + JSON.stringify(breadcrumb.strips[0].labels) + ', breadcrumb segments '
        + JSON.stringify(breadcrumb.strips.map((s) => s.detail)));

    /*
      REORDER, which is two arrows and an array — no `order` field, because two ways to say where an
      assignment sits is one way for them to disagree. Driven on two rows in one category.
    */
    await clickSel('#assignmentsView [data-assignment-new]');
    await typeField('name', 'Second in its group');
    await clickSel('#assignmentModal [data-modal-close]');
    const pair = await evalJs(`(function(){ var doc = window.__adoc();
      var mine = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(src.id)}
        && a.categoryId === ${JSON.stringify(fresh.made.categoryId)}; });
      return mine.map(function(a){ return a.id; }); })()`);
    await clickSel('#assignmentsView [data-assignment-move-down="' + pair[0] + '"]');
    const reordered = await evalJs(`(function(){ var doc = window.__adoc();
      var live = window.__assign();
      live.order = doc.assignments.filter(function(a){ return a.classId === ${JSON.stringify(src.id)}
        && a.categoryId === ${JSON.stringify(fresh.made.categoryId)}; })
        .map(function(a){ return a.id; });
      return live; })()`);
    check('the arrows reorder an assignment inside its own category, and the document order is the order drawn',
      pair.length === 2 && JSON.stringify(reordered.order) === JSON.stringify([pair[1], pair[0]])
        && reordered.names.length === 3
        && reordered.rowButtons === 5,
      'order ' + JSON.stringify(pair) + ' -> ' + JSON.stringify(reordered.order)
        + ', ' + reordered.rowButtons + ' controls per row');

    /*
      DELETING ONE WARNS ABOUT THE SCORES IT TAKES WITH IT. It asks every time, including when there
      is nothing filed under it — an assignment IS the work, so one with no scores is still a name, a
      mark out of, a category and two dates the teacher would have to type again. Cancel writes
      nothing, which is the point of counting before the dialog rather than after it.
    */
    await clickSel('#assignmentsView [data-assignment-delete="' + secondId + '"]');
    const confirmSeen = await evalJs(`(function(){
      return { open: !document.getElementById('assignmentDeleteModal').classList.contains('hidden'),
        lead: (document.getElementById('assignmentDeleteLead')||{}).textContent.replace(/\\s+/g,' '),
        facts: (document.getElementById('assignmentDeleteFacts')||{}).textContent.replace(/\\s+/g,' '),
        button: (document.getElementById('assignmentDeleteBtn')||{}).textContent }; })()`);
    check('deleting an assignment warns first and counts the scores it takes with it',
      confirmSeen.open && /1 score entered on it/.test(confirmSeen.facts)
        && /cannot be undone/.test(confirmSeen.lead)
        && confirmSeen.button.indexOf('Unit 1 test') >= 0,
      JSON.stringify(confirmSeen.facts.slice(0, 90)) + ' :: ' + JSON.stringify(confirmSeen.button));
    const beforeCancel = await evalJs(
      '(async function(){ await window.planbook.store.flush(); return window.__adoc(); })()');
    await clickSel('[data-assignment-delete-cancel]');
    const afterCancel = await evalJs(
      '(async function(){ await window.planbook.store.flush(); return window.__adoc(); })()');
    check('cancelling leaves the assignment and its scores exactly as they were, and writes nothing',
      afterCancel.rev === beforeCancel.rev
        && JSON.stringify(afterCancel.assignments) === JSON.stringify(beforeCancel.assignments)
        && afterCancel.scores === beforeCancel.scores,
      'rev ' + beforeCancel.rev + ' -> ' + afterCancel.rev + ' (nothing written, so rev cannot move)');

    await clickSel('#assignmentsView [data-assignment-delete="' + secondId + '"]');
    await clickSel('[data-assignment-delete-confirm]');
    await new Promise(r => setTimeout(r, 250));
    const deleted = await evalJs(`(async function(){ await window.planbook.store.flush();
      var live = window.__assign(); live.doc = window.__adoc(); return live; })()`);
    check('confirming takes the assignment and its score column — and only those',
      deleted.doc.assignments.every((a) => a.id !== secondId)
        && deleted.doc.scoreKeys.indexOf(secondId) === -1
        && deleted.doc.assignments.filter((a) => a.classId === dst.id).length >= 1
        && deleted.names.length === 2,
      deleted.doc.assignments.length + ' assignment(s) left, score columns '
        + JSON.stringify(deleted.doc.scoreKeys));

    /*
      The fixture comes back out, so the sections after this one see the document they expect, and
      the class the roster section left open is left open — the overflow sweep at the bottom
      measures the term nav of whatever is up. Driven through the real confirm rather than spliced
      out of the array, because a cleanup that writes differently from the app is a cleanup that can
      leave a shape the app never makes.
    */
    const leftovers = await evalJs('window.__adoc().assignments.map(function(a){ return a.id; })');
    for (const id of leftovers) {
      await evalJs(`(function(){ var s = window.planbook.store;
        s.update(function(d){ delete d.scores[${JSON.stringify(id)}];
          d.assignments = d.assignments.filter(function(a){ return a.id !== ${JSON.stringify(id)}; }); });
        return 1; })()`);
    }
    /* And the fixtures the duplicate and the term switch used: the twin category comes off the
       target class, the source's category gets its own name back, and a term added for the switch
       goes away. One update rather than the real Remove controls, for the reason the roster
       teardown below gives — a fixture coming down is not a claim being made — and every assignment
       that was filed in any of them is already gone. */
    await evalJs(`(function(){ var s = window.planbook.store; var planted = ${JSON.stringify(plantedTerm)};
      s.update(function(d){ d.classes.forEach(function(c){
        if (c.id === ${JSON.stringify(dst.id)} && Array.isArray(c.categories)) {
          c.categories = c.categories.filter(function(k){ return k.id !== ${JSON.stringify(twin.id)}; });
        }
        if (c.id === ${JSON.stringify(src.id)} && Array.isArray(c.categories)) {
          c.categories.forEach(function(k){
            if (k.id === ${JSON.stringify(otherCat)}) k.name = ${JSON.stringify(sourceCatName)}; });
        }
        if (c.id === ${JSON.stringify(src.id)} && planted && Array.isArray(c.terms)) {
          c.terms = c.terms.filter(function(t){ return t.id !== planted; });
        }
      }); }); return 1; })()`);
    /* And the two students this section added for the coverage bar, off the roster and out of the
       year — which is what Remove followed by Delete does through the controls, written in one
       update because this is a fixture coming down rather than a claim being made. */
    if (planted.length) {
      await evalJs(`(function(){ var s = window.planbook.store; var ids = ${JSON.stringify(planted)};
        s.update(function(d){
          d.classes.forEach(function(c){ if (Array.isArray(c.roster)) {
            c.roster = c.roster.filter(function(x){ return ids.indexOf(x) === -1; }); } });
          d.students = d.students.filter(function(st){ return ids.indexOf(st.id) === -1; });
        }); return 1; })()`);
    }
    await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
    await clickSel('#assignmentsView [data-class-screen="class"]');
    const backOnAttendance = await evalJs(`(function(){ var live = window.__assign();
      live.strip = window.__strip(); return live; })()`);
    check('the strip takes you back to Attendance from the assignment list, which is the switch in both directions',
      backOnAttendance.classShown && !backOnAttendance.shown
        && backOnAttendance.strip.every((s) => s.active[0] === true && s.active[1] === false),
      'attendance up = ' + backOnAttendance.classShown);
    if (stage.tabs[1] && stage.tabs[1] !== src.id) await clickSel('#classTabBar [data-class-tab]', 1);
  }
}
}
