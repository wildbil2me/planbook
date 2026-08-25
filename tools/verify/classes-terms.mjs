/* classes-terms.mjs — classes & terms, and the home screen
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
import { nodeToday } from './lib-dates.mjs';

/* Everything this section reads, in one page-side helper, so that a check is one round trip and
   the reads cannot drift between checks. Re-installed after every reload, like the walker. */
export const INSTALL_CLASS_READER = `(function(){
  window.__cls = function(){
    var doc = window.planbook.store.getDoc();
    var c = window.planbook.classes;
    var bar = document.getElementById('classTabBar');
    var nav = document.getElementById('termNav');
    var tabs = Array.prototype.slice.call(bar.querySelectorAll('[data-class-tab]'));
    return {
      names: doc.classes.map(function(x){ return x.name; }),
      ids: doc.classes.map(function(x){ return x.id; }),
      archived: doc.classes.map(function(x){ return !!x.archived; }),
      termCounts: doc.classes.map(function(x){ return (x.terms||[]).length; }),
      termIds: doc.classes.map(function(x){ return (x.terms||[]).map(function(t){ return t.id; }); }),
      termLabels: doc.classes.map(function(x){ return (x.terms||[]).map(function(t){ return t.label; }); }),
      termDates: doc.classes.map(function(x){ return (x.terms||[]).map(function(t){ return [t.start, t.end]; }); }),
      rosters: doc.classes.map(function(x){ return (x.roster||[]).length; }),
      categories: doc.classes.map(function(x){ return (x.categories||[]).length; }),
      /* WO-3.1. The totals and the provisional verdict come out of src/categories.js rather than
         being summed here, for the reason every other read on this object does: a harness carrying
         its own copy of the arithmetic could agree with itself perfectly and disagree with the app,
         which is the exact failure the seam exists to prevent.
         (No backticks in this comment: it is inside a template literal.) */
      weightTotals: doc.classes.map(function(x){ return window.planbook.categories.weightTotal(x); }),
      provisional: doc.classes.map(function(x){ return window.planbook.categories.isProvisional(x); }),
      categoryNames: doc.classes.map(function(x){ return (x.categories||[]).map(function(k){ return k.name; }); }),
      categoryWeights: doc.classes.map(function(x){ return (x.categories||[]).map(function(k){ return k.weight; }); }),
      categoryIds: doc.classes.map(function(x){ return (x.categories||[]).map(function(k){ return k.id; }); }),
      /* The badge src/classes.js draws on a manager row when a class's weights do not add up —
         WO-3.1's warning on the screen five classes are set up from, read as text so that a check
         can assert the NUMBER is in it and not merely that something went amber. */
      rowWarnings: Array.prototype.slice.call(
        document.querySelectorAll('#classList .class-row')).map(function(r){
          var w = r.querySelector('.class-row-warn'); return w ? w.textContent : ''; }),
      tabNames: tabs.map(function(b){ return b.textContent; }),
      tabIds: tabs.map(function(b){ return b.getAttribute('data-class-tab'); }),
      addTab: !!bar.querySelector('.cls-tab-add'),
      injectedInBar: bar.querySelectorAll('b, script, i').length,
      tabChildren: tabs.reduce(function(n, b){ return n + b.children.length; }, 0),
      navLabels: Array.prototype.slice.call(nav.querySelectorAll('button')).map(function(b){ return b.textContent; }),
      navActive: Array.prototype.slice.call(nav.querySelectorAll('button.active')).map(function(b){ return b.getAttribute('data-term-select'); }),
      /* The home screen's cards, read in the same round trip as the tab bar because they are the
         SECOND VIEW OF THE SAME LIST and only the bar redraws itself — src/shell.js's
         afterClassChange() is what redraws these, from a hand-maintained call list. See
         homeVsDoc() in this file for what a missing line off that list looks like from here.

         The data-class-tab hook moved OFF the card and onto the button inside it at WO-2.1: a card
         that has to carry a second control cannot itself be a button, because a control cannot be
         nested in a control. Same claim, one level deeper — see src/home.js's classCard().
         (No backticks in this comment: it is inside a template literal.) */
      homeIds: Array.prototype.slice.call(
        document.querySelectorAll('#homeGrid .class-card .class-card-open')).map(function(c){ return c.getAttribute('data-class-tab'); }),
      homeNames: Array.prototype.slice.call(
        document.querySelectorAll('#homeGrid .class-card')).map(function(c){ return (c.querySelector('.class-card-name')||{}).textContent; }),
      homeOpen: Array.prototype.slice.call(
        document.querySelectorAll('#homeGrid .class-card.open .class-card-open')).map(function(c){ return c.getAttribute('data-class-tab'); }),
      rows: document.querySelectorAll('#classList .class-row').length,
      archivedRows: document.querySelectorAll('#classArchivedList .class-row').length,
      archivedHidden: document.getElementById('classArchivedSection').classList.contains('hidden'),
      selectedClass: c.getSelectedClassId(),
      selectedTerm: c.getSelectedTermId(),
      rev: doc.rev,
      attendance: doc.attendance.length,
      assignments: doc.assignments.length,
      scoreColumns: Object.keys(doc.scores).length,
      students: doc.students.length,
      classError: (document.getElementById('classError')||{}).textContent,
      termError: (document.getElementById('termError')||{}).textContent,
      prefClass: window.planbook.getPref('openClassId'),
      prefTerms: window.planbook.getPref('openTermIds')
    };
  }; return 1; })()`;

export async function run(h) {
const { ROOT, check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER, dateResetOn,
  waitForBoot, seam } = h;

/* ───────────────── classes & terms ─────────────────
 *
 * WO-1.6's acceptance lines, driven through the controls a teacher touches: the classes are
 * created by typing into the real form and clicking its real Create button, reordered by clicking
 * the real arrows, and deleted through the real confirm. The window.planbook.classes seam is used
 * only to READ the answer — which class and which term are open, what the document holds — because
 * the alternative is a second copy of "resolve the stored id against the document" living in this
 * file, where it could agree with itself and disagree with the app.
 *
 * What is NOT here, and is owed to a human: a thumb on a 44px arrow, the iPadOS date picker that
 * `<input type="date">` opens, and whether six tabs and four terms are actually reachable on a
 * physical iPad in portrait. The touch section below measures the boxes; it cannot press them.
 */


console.log('\n--- classes & terms ---');

/* The section above finishes with a modal open over the header. A reload starts from the app as a
   teacher finds it — and it also proves the class bar draws itself from IndexedDB at boot rather
   than from whatever happened to be in memory. */
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const classesBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);


/*
  Does the home screen still agree with the document — right now, after whatever just changed a
  class?

  WHY THIS EXISTS AS ITS OWN READ, repeated after each mutation instead of once at the end. The
  cards and the header tabs are two views of one list and only the tabs redraw themselves:
  src/classes.js ends every mutator with its own refreshClassBar(), and the cards are redrawn from
  src/shell.js's afterClassChange(), which is a HAND-MAINTAINED LIST OF CALL SITES. That list is
  complete today. The failure it has no guard against is a work order adding a mutator — or editing
  one of the eight branches that already call it — and forgetting its line, which leaves every check
  in this file green while a teacher watches an archived class sit on the grid behind the dialog she
  archived it in. Read once, before the archive step, that gap was invisible (WO-1.12).

  THE VACUOUS PASS THIS GUARDS AGAINST is the obvious one: an empty grid agrees with a document that
  has no classes, and a check that only asked "is the archived class gone from the grid" would pass
  hardest on a grid that renders nothing at all. So the assertion is equality against the ACTIVE
  classes in the document — order, ids and names — plus a non-zero count, plus the open mark landing
  on the class src/classes.js resolves. `live` is one window.__cls() read; the active list is derived
  here from the document it already carries rather than asked for separately.
*/
function homeVsDoc(live) {
  const activeIds = live.ids.filter((_, i) => !live.archived[i]);
  const activeNames = live.names.filter((_, i) => !live.archived[i]);
  /* An archived or deleted class can be the one the preference still names, and it has no card —
     so "no card is marked" is the right answer then, and only then. */
  const wantOpen = activeIds.indexOf(live.selectedClass) === -1 ? [] : [live.selectedClass];
  return {
    ok: live.homeIds.length > 0
      && JSON.stringify(live.homeIds) === JSON.stringify(activeIds)
      && JSON.stringify(live.homeNames) === JSON.stringify(activeNames)
      && JSON.stringify(live.homeOpen) === JSON.stringify(wantOpen),
    detail: live.homeIds.length + ' card(s) ' + JSON.stringify(live.homeNames) + ' for '
      + activeIds.length + ' active class(es) ' + JSON.stringify(activeNames)
      + '; open card ' + JSON.stringify(live.homeOpen) + ', expected ' + JSON.stringify(wantOpen)
  };
}

const classSeam = await evalJs("!!(window.planbook && window.planbook.classes"
  + " && typeof window.planbook.classes.getSelectedTermId === 'function')");

if (!classesBooted || !classSeam) {
  skip('classes & terms: create, reorder, rename, per-class term structures, archive, delete',
    classesBooted ? 'no window.planbook.classes seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  await evalJs(INSTALL_CLASS_READER);

  /*
    ONTO THE CLASS VIEW BEFORE ANYTHING IS READ OFF THE TAB STRIP, because since WO-1.13 that strip
    is a class-view control: cards enter, tabs switch, and the home grid draws no class tabs at all
    (src/classes.js's refreshClassBar). Every tabNames / tabIds check below is asking what the
    SWITCHER shows, so it has to be asked where the switcher is — and the way onto it is the card a
    teacher taps rather than the seam.

    Guarded rather than unconditional: which view a reload lands on is a preference now, so where
    this section starts depends on where the one above it finished, and the guard is what stops that
    mattering. Every check below is about a mutation made AFTER this point, so arriving here does
    not paint any of the answers they read.
  */
  const toClassView = async () => {
    if (await has('#classTabBar [data-class-tab]')) return;
    await clickSel('#homeGrid .class-card-open');
  };
  await toClassView();

  /* The document restored by the section above holds one class written WITHOUT a `terms` array,
     which is exactly the shape a class arrives in from another build, or from a document older
     than this work order. The header has to survive it rather than throw on `cls.terms.length`,
     and the term nav's answer has to be a way to fix it rather than a blank strip. */
  const legacy = await evalJs('window.__cls()');
  check('a class stored with no terms at all still renders, and the term nav offers to add them',
    legacy.tabNames.length === 1 && legacy.addTab && legacy.navLabels.length === 1
      && legacy.navLabels[0] === 'Add terms' && legacy.selectedTerm === ''
      && legacy.selectedClass === legacy.ids[0],
    JSON.stringify({ tabs: legacy.tabNames, nav: legacy.navLabels, selectedTerm: legacy.selectedTerm }));

  /* Six, because the owner teaches five and the acceptance line says six: the sixth is what proves
     nothing here is sized to five. One of them carries markup in its name — class names in this app
     are typed by a teacher and pasted out of a school system, and `Honors Bio <b>lab</b>` has to
     stay those characters rather than become bold. */
  const NEW_CLASSES = ['Period 1 — Biology', 'Period 2 — Chemistry', 'Period 4 — Physics',
    'Honors Bio <b>lab</b>', 'AP Bio', 'Homeroom'];
  await clickSel('header [data-class-manage]');
  for (const name of NEW_CLASSES) {
    await evalJs('(function(){document.getElementById("classNewInput").value='
      + JSON.stringify(name) + ';return 1})()');
    await clickSel('[data-class-create] button[type="submit"]');
  }
  const made = await evalJs('window.__cls()');
  const expectedNames = [legacy.names[0]].concat(NEW_CLASSES);
  check('six classes created through the form are in the document and on the tab bar, in that order',
    JSON.stringify(made.names) === JSON.stringify(expectedNames)
      && JSON.stringify(made.tabNames) === JSON.stringify(expectedNames)
      && JSON.stringify(made.tabIds) === JSON.stringify(made.ids)
      && made.rows === 7,
    JSON.stringify(made.tabNames));
  /* RE-POINTED AT WO-3.1, and the change of side is the deliverable. This asserted
     `categories.every(n => n === 0)` until then, because src/classes.js seeded none on purpose and
     said so in a comment that named the work order it was waiting for. That work order has landed,
     so a class now arrives with a starter set — and the interesting half is not that there are
     four of them but that they add up to 100, which is what makes a fresh class arrive with the
     warning off. The empty collection asserted here now is `roster`, which is still empty on
     purpose. The class restored by the section above predates all of this and is skipped by the
     same `slice(1)` the term count uses. */
  check('each one arrives with a term structure and a starter weighting that already adds up',
    made.termCounts.slice(1).every(n => n === 4) && made.rosters.every(n => n === 0)
      && made.categories.slice(1).every(n => n === 4)
      && made.weightTotals.slice(1).every(n => n === 100)
      && made.provisional.slice(1).every(p => p === false),
    'terms per class = ' + JSON.stringify(made.termCounts) + ', rosters = '
      + JSON.stringify(made.rosters) + ', categories = ' + JSON.stringify(made.categories)
      + ', weights total = ' + JSON.stringify(made.weightTotals));
  check('a class name containing markup is rendered as text — createElement, never innerHTML',
    made.tabNames.indexOf('Honors Bio <b>lab</b>') >= 0 && made.injectedInBar === 0
      && made.tabChildren === 0,
    'elements injected into the tab bar = ' + made.injectedInBar
      + ', child elements inside the tabs = ' + made.tabChildren);
  /* And the home screen's cards followed all six creations — the first of the six mutations below
     that each carry one line of src/shell.js's afterClassChange() list. See homeVsDoc(). */
  const madeHome = homeVsDoc(made);
  check('the home screen gains a card when a class is created through the form', madeHome.ok,
    madeHome.detail);

  /* Reorder, by the explicit controls rather than by drag: HTML5 drag-and-drop does not fire for
     touch on iPadOS at all, and the acceptance line reads "by drag OR by explicit up/down
     controls". The document order IS the tab order — there is no order field — so both halves of
     that claim come out of one read. */
  await clickSel('#classList .class-row:nth-child(1) [data-class-move-down]');
  const down = await evalJs('window.__cls()');
  check('the down control moves a class one place later, in the document and on the bar together',
    down.ids[0] === made.ids[1] && down.ids[1] === made.ids[0]
      && JSON.stringify(down.tabIds) === JSON.stringify(down.ids),
    JSON.stringify(down.tabNames.slice(0, 3)));
  const downHome = homeVsDoc(down);
  check('and the cards reorder with it — the grid is the tab bar\'s second view, not a stale copy',
    downHome.ok, downHome.detail);
  await clickSel('#classList .class-row:nth-child(2) [data-class-move-up]');
  const up = await evalJs('window.__cls()');
  check('the up control puts it back, and the tab order follows the document exactly',
    JSON.stringify(up.ids) === JSON.stringify(made.ids)
      && JSON.stringify(up.tabIds) === JSON.stringify(up.ids),
    JSON.stringify(up.tabNames.slice(0, 3)));
  /* The up arrow is its own line in that list, and its own check for that reason: the down arrow
     above having redrawn the grid is exactly what would let a missing line here read as green. */
  const upHome = homeVsDoc(up);
  check('and the cards go back with it, in the document\'s order', upHome.ok, upHome.detail);
  const ends = await evalJs(`(function(){ var rows = document.querySelectorAll('#classList .class-row');
    var first = rows[0], last = rows[rows.length-1];
    return { firstUp: first.querySelector('[data-class-move-up]').disabled,
             firstDown: first.querySelector('[data-class-move-down]').disabled,
             lastUp: last.querySelector('[data-class-move-up]').disabled,
             lastDown: last.querySelector('[data-class-move-down]').disabled }; })()`);
  check('the arrows are disabled at the ends of the list rather than being live and doing nothing',
    ends.firstUp === true && ends.lastDown === true
      && ends.firstDown === false && ends.lastUp === false,
    JSON.stringify(ends));

  /* Rename, in place in the row. The field is a <form>, so Enter submits it; the click below is the
     other half of the same path. */
  await clickSel('#classList .class-row:nth-child(3) [data-class-rename]');
  const renaming = await evalJs(`(function(){ var i = document.querySelector('#classList .rename-input');
    return { present: !!i, value: i ? i.value : '', focused: i === document.activeElement }; })()`);
  await evalJs('(function(){var i=document.querySelector("#classList .rename-input");'
    + 'i.value="Period 2 — Chem (renamed)";return 1})()');
  await clickSel('#classList .class-rename-form button[type="submit"]');
  const renamed = await evalJs('window.__cls()');
  check('renaming happens in the row, starts from the old name, and lands on the tab as well',
    renaming.present && renaming.value === 'Period 2 — Chemistry' && renaming.focused
      && renamed.names[2] === 'Period 2 — Chem (renamed)'
      && renamed.tabNames[2] === 'Period 2 — Chem (renamed)'
      && renamed.ids[2] === made.ids[2]
      && renamed.names.indexOf('Period 2 — Chemistry') === -1,
    'the field held ' + JSON.stringify(renaming.value) + ', the document now says '
      + JSON.stringify(renamed.names[2]));
  const renamedHome = homeVsDoc(renamed);
  check('and the card carries the new name too, not the one it was rendered with',
    renamedHome.ok && renamed.homeNames.indexOf('Period 2 — Chem (renamed)') >= 0,
    renamedHome.detail);

  /*
    Two classes, two different term structures, both working — the acceptance line that fails the
    instant anything in this app treats terms as a property of the year rather than of the class.
    `Homeroom` is given one term for the whole year; the class above it keeps its four quarters.
  */
  await clickSel('#classList .class-row:nth-child(7) [data-term-manage]');
  const termsPanel = await evalJs(`(function(){ var m = document.getElementById('termsModal');
    return { open: !!m && !m.classList.contains('hidden'),
             className: (document.getElementById('termsClassName')||{}).textContent,
             rows: document.querySelectorAll('#termList .term-row').length,
             stacked: !document.getElementById('classesModal').classList.contains('hidden') }; })()`);
  await clickSel('[data-term-preset="fullYear"]');
  const single = await evalJs('window.__cls()');
  check('the term editor opens over the manager, for the class whose row was tapped',
    termsPanel.open && termsPanel.stacked && termsPanel.className === 'Homeroom'
      && termsPanel.rows === 4,
    JSON.stringify(termsPanel));
  check('a class can be given a single year-long term while its neighbour keeps four',
    single.termCounts[6] === 1 && single.termLabels[6][0] === 'Full year'
      && single.termCounts[1] === 4 && single.termLabels[1].length === 4,
    'Homeroom = ' + JSON.stringify(single.termLabels[6]) + ', Period 1 = '
      + JSON.stringify(single.termLabels[1]));

  /* The dates on that one term, put through the two real date fields. Setting `.value` and
     dispatching `input` is the path a keystroke takes — the delegated listener in shell.js reads
     the element, not the event's provenance. The iPadOS date picker itself is owed to a human. */
  await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-date');
    f[0].value = '2026-08-26'; f[0].dispatchEvent(new Event('input', { bubbles:true }));
    f[1].value = '2027-06-11'; f[1].dispatchEvent(new Event('input', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 300));
  const dated = await evalJs('window.__cls()');
  check('and that term can carry the whole school year, stored exactly as it was typed',
    JSON.stringify(dated.termDates[6]) === JSON.stringify([['2026-08-26', '2027-06-11']]),
    JSON.stringify(dated.termDates[6]));

  /* Asked here because this is where the term editor is already open with its two date fields
     drawn — Homeroom has one term by now, so `#termList .term-date` is exactly Starts and Ends
     (WO-2.24). See dateResetOn() for what a computed `appearance` can and cannot say. */
  const termReset = await dateResetOn('#termList .term-date', 2,
    "!document.getElementById('termsModal').classList.contains('hidden')",
    'the term editor is open');
  check('the term editor\'s Starts and Ends carry the shared date reset as a live computed style — the value that goes back to the platform\'s own the moment src/shell.css loses that one line, which is why it is a style being read here and not a height: this engine gives a date input the height its stylesheet asked for either way, and the height these fields actually draw at is the iPad\'s answer and nobody else\'s',
    termReset.ok, termReset.detail);

  /*
    Messy dates, which is an acceptance line stated as a promise about what does NOT happen: term 2
    starts before term 1 ends (an overlap), term 3 has no dates at all (a gap, and two blanks), and
    term 4 ends months before it starts (backwards). Nothing may sort them, repair them, warn about
    them or refuse them — plans/rotating-schedule.md deleted the schedule model, and validating
    these into a contiguous calendar is how it comes back.
  */
  await clickSel('#termsModal [data-modal-close]');
  await clickSel('#classList .class-row:nth-child(2) [data-term-manage]');
  const messyBefore = await evalJs('window.__cls()');
  const MESSY = [['2026-08-26', '2026-11-06'], ['2026-10-15', '2027-01-22'], ['', ''],
    ['2027-06-10', '2027-03-25']];
  await evalJs(`(function(){ var rows = document.querySelectorAll('#termList .term-row');
    var want = ${JSON.stringify(MESSY)};
    for (var i = 0; i < rows.length; i++) {
      var f = rows[i].querySelectorAll('.term-date');
      f[0].value = want[i][0]; f[0].dispatchEvent(new Event('input', { bubbles:true }));
      f[1].value = want[i][1]; f[1].dispatchEvent(new Event('input', { bubbles:true }));
    }
    return 1; })()`);
  await new Promise(r => setTimeout(r, 300));
  const messy = await evalJs('window.__cls()');
  check('overlapping, backwards and empty term dates are all stored exactly as they were typed',
    JSON.stringify(messy.termDates[1]) === JSON.stringify(MESSY),
    JSON.stringify(messy.termDates[1]));
  check('and nothing sorted, repaired, refused or warned about them',
    JSON.stringify(messy.termIds[1]) === JSON.stringify(messyBefore.termIds[1])
      && JSON.stringify(messy.termLabels[1]) === JSON.stringify(messyBefore.termLabels[1])
      && messy.termCounts[1] === 4 && messy.termError === '' && messy.classError === '',
    'term order and labels unchanged, term error = ' + JSON.stringify(messy.termError));

  /*
    Clearing a date and then choosing the SAME date again, which is the iPadOS defect the first
    device sitting found: the date popover keeps its own selection after the field is cleared, so
    re-tapping the day that was just cleared is a no-op the picker never reports. classes.js answers
    it by throwing a cleared field away and building a fresh one, which is what this measures —
    element identity, not just the stored value.

    Chrome cannot reproduce the picker's stale state, so this does not prove the tablet is fixed.
    What it does prove is the mechanism the fix rests on, and that it is still there next month.

    Run on term 1's start date and then put it back, so MESSY is intact for the reload check
    further down that asserts these same dates survived a restart.
  */
  await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[0]
      .querySelectorAll('.term-date')[0];
    f.__pbStale = 1;
    f.value = ''; f.dispatchEvent(new Event('input', { bubbles:true }));
    f.dispatchEvent(new Event('change', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 200));
  const cleared = await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[0]
      .querySelectorAll('.term-date')[0];
    return { rebuilt: !f.__pbStale, value: f.value, type: f.type,
             label: (f.closest('.term-date-field')||{}).textContent,
             stored: window.planbook.store.getDoc().classes[1].terms[0].start }; })()`);
  check('a cleared term date is stored empty, and its field is rebuilt so the picker keeps no stale selection',
    cleared.rebuilt && cleared.value === '' && cleared.stored === '' && cleared.type === 'date'
      && cleared.label === 'Starts',
    JSON.stringify(cleared));

  await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[0]
      .querySelectorAll('.term-date')[0];
    f.value = '2026-08-26'; f.dispatchEvent(new Event('input', { bubbles:true }));
    return 1; })()`);
  await new Promise(r => setTimeout(r, 300));
  /* Named for what this can actually prove here. Chrome will accept a re-set value whether or not
     the element was rebuilt, so "works on the first tap" is not what is being measured — what is,
     is that the REBUILT field is still wired to the term and field it replaced. A rebuild that
     dropped or mistyped `data-term-id` would write this date to the wrong term, or nowhere, and the
     stored dates would not come back to MESSY. */
  const repicked = await evalJs('window.__cls()');
  check('and the rebuilt field still writes to the term and field it replaced',
    JSON.stringify(repicked.termDates[1]) === JSON.stringify(MESSY),
    JSON.stringify(repicked.termDates[1][0]));

  /* The other half of that fix, and the regression it could easily become. A desktop date field
     reports '' while a date is part-typed, so the rebuild is bound to `change` and must NOT happen
     on `input` — rebuilding there would replace the element under the teacher's caret partway
     through typing. Term 3 carries no dates in MESSY, so an empty `input` here changes nothing. */
  const typing = await evalJs(`(function(){ var f = document.querySelectorAll('#termList .term-row')[2]
      .querySelectorAll('.term-date')[0];
    f.__pbTyping = 1;
    f.value = ''; f.dispatchEvent(new Event('input', { bubbles:true }));
    var now = document.querySelectorAll('#termList .term-row')[2].querySelectorAll('.term-date')[0];
    return { survived: !!now.__pbTyping, same: now === f }; })()`);
  check('an empty date field being typed into is not rebuilt underneath the caret',
    typing.survived && typing.same, JSON.stringify(typing));

  /*
    The one refusal this feature has, and the only place it reads anything grade-shaped: removing a
    term that still holds an assignment. WO-3.x owns moving an assignment between terms; until that
    exists, cascading the removal would leave a grade pointing at a term that is gone, and a grade
    that quietly stops counting is the worst failure this app has. There is no assignment screen
    yet, so the fixture is written through the store — and taken back out afterwards, so the counts
    the delete confirm prints further down stay the ones this file states.
  */
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){ d.assignments.push({ id:'a_guard',
      classId:${JSON.stringify(messyBefore.ids[1])},
      termId:${JSON.stringify(messyBefore.termIds[1][1])}, name:'Unit test', points:100 }); });
    await s.flush(); return 1; })()`);
  await clickSel('#termList .term-row:nth-child(2) [data-term-remove]');
  const refused = await evalJs('window.__cls()');
  check('removing a term that still holds an assignment is refused, and says what is in the way',
    refused.termCounts[1] === 4 && /still holds 1 assignment/.test(refused.termError || '')
      && /has not been removed/.test(refused.termError || ''),
    JSON.stringify(refused.termError));
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){ d.assignments = d.assignments.filter(function(a){ return a.id !== 'a_guard'; }); });
    await s.flush(); return 1; })()`);

  /* Selecting a class and a term from the header, which is the control every later screen reads
     through. Both panels are closed first: an overlay is fixed at inset 0, so a click aimed at a
     header button underneath one lands on the scrim — the same viewport-coordinate trap clickSel's
     own comment describes, one level up. */
  await clickSel('#termsModal [data-modal-close]');
  await clickSel('#classesModal [data-modal-close]');
  await clickSel('[data-class-tab]', 1);
  const onClass = await evalJs('window.__cls()');
  check('tapping a class tab opens it, and the term nav switches to THAT class\'s terms',
    onClass.selectedClass === onClass.ids[1]
      && JSON.stringify(onClass.navLabels) === JSON.stringify(messyBefore.termLabels[1])
      && onClass.selectedTerm === onClass.termIds[1][0],
    'open class = ' + JSON.stringify(onClass.names[1]) + ', nav = ' + JSON.stringify(onClass.navLabels));
  await clickSel('[data-term-select]', 1);
  const onTerm = await evalJs('window.__cls()');
  check('and tapping a term opens that one, with one active tab in the nav',
    onTerm.selectedTerm === onTerm.termIds[1][1] && onTerm.navActive.length === 1
      && onTerm.navActive[0] === onTerm.termIds[1][1],
    'open term = ' + onTerm.selectedTerm);

  /*
    A full reload, which settles three things at once: that a document holding those messy dates
    still boots (a date this app could not read would take the whole year down at load), that the
    header draws itself out of IndexedDB, and that the open class and term are remembered.

    Which class and which term are open is a UI fact, so it lives in a `planbook_` preference —
    ids on both sides and nothing else. A class NAME there would be teacher-typed content sitting
    outside IndexedDB, which is the line src/prefs.js exists to hold.

    FLUSHED FIRST, deliberately, and this is the one place in this file where that needs saying.
    Every write above went through the store's debounce, and a CDP `Page.reload` tears the
    execution context down without waiting for an IndexedDB transaction to complete — which is
    exactly the limit src/store.js's own header comment admits it cannot survive. Reloading on an
    unflushed document made this check fail for a reason with nothing to do with classes and terms:
    the document came back without the six classes, and it read like a store defect. That the store
    starts a pending write the moment the page stops being visible has its own check further up,
    where it is measured with a dispatched `visibilitychange` and a poll rather than a race.
  */
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  const rememberedBoot = await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  const remembered = await evalJs('window.__cls()');
  check('the app boots again on those dates, and the header comes back with them',
    rememberedBoot && JSON.stringify(remembered.termDates[1]) === JSON.stringify(MESSY)
      && remembered.tabNames.length === 7 && remembered.navLabels.length === 4,
    rememberedBoot ? 'reopened with ' + remembered.navLabels.length + ' terms in the nav'
      : 'the loading screen never came down');
  /*
    WO-2.54 BROKE THIS CHECK'S PREMISE AND IT IS REPAIRED AGAINST THE NEW RULE RATHER THAN PINNED TO
    THE OLD ONE, which is what WO-2.52 did to two sections further down for the same kind of reason.

    It read "the open class and the open term survive the reload", and the second half of that is no
    longer a rule this app has: arriving at the register moves the selected term to the one NEAREST
    today, and a boot is an arrival. On this fixture — four terms typed overlapping, backwards and
    empty, none of them anywhere near today — the term the teacher tapped a moment ago is not the one
    the app comes back on, and it should not be.

    SO WHAT IS ASSERTED IS THE ROLLOVER, AT A BOOT, and it is a stronger claim than the one it
    replaces: the class survives, the nav marks exactly one tab, the preference on disk holds the same
    id the screen is showing, and the term is the one this file works out for itself from the dates
    the fixture typed — walked in Node off nodeToday, never read back off the app. A build that
    stopped writing the preference, a build that stopped rolling over at boot, and a build that rolled
    over to the wrong side of a gap are three different reds here.

    THE HALF THAT LEAVES IS ASSERTED ELSEWHERE, twice, so nothing is being given up quietly: that a
    term chosen by hand STICKS while the screen is open — three repaints, byte-identical preference —
    is WO-2.52's section and WO-2.54's, and both drive it against a document where the rollover wants
    a different term.
  */
  const nearestTermId = (() => {
    const ids = remembered.termIds[1] || [];
    const dated = (remembered.termDates[1] || []).map((d, i) => ({ id: ids[i], start: d[0], end: d[1] }))
      .filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.start) && /^\d{4}-\d{2}-\d{2}$/.test(t.end));
    const holds = dated.filter((t) => t.start <= nodeToday && nodeToday <= t.end)[0];
    if (holds) return holds.id;
    const day = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000;
    let before = null;
    let after = null;
    dated.forEach((t) => {
      if (t.end < nodeToday && (!before || t.end > before.end)) before = t;
      if (t.start > nodeToday && (!after || t.start < after.start)) after = t;
    });
    if (!after) return before ? before.id : '';
    if (!before) return after.id;
    return day(after.start) - day(nodeToday) <= day(nodeToday) - day(before.end) ? after.id : before.id;
  })();
  check('the open class survives the reload, and the open term comes back on the one nearest today — the arrival rollover, seen at a boot',
    remembered.selectedClass === onTerm.selectedClass
      && !!nearestTermId && remembered.selectedTerm === nearestTermId
      && remembered.navActive.length === 1 && remembered.navActive[0] === nearestTermId
      && (remembered.prefTerms || {})[remembered.selectedClass] === nearestTermId,
    'class ' + remembered.selectedClass + ', term ' + remembered.selectedTerm + ' (tapped '
      + onTerm.selectedTerm + ' before the reload; nearest to ' + nodeToday + ' over '
      + JSON.stringify(remembered.termDates[1]) + ' is ' + nearestTermId + ', and the preference holds '
      + JSON.stringify((remembered.prefTerms || {})[remembered.selectedClass]) + ')');
  const prefTermPairs = Object.keys(remembered.prefTerms || {})
    .map((k) => k + ' → ' + remembered.prefTerms[k]);
  check('and only ids are remembered — no class name, nothing else out of the document',
    /^c_[0-9a-z]{10}$/.test(remembered.prefClass || '')
      && Object.keys(remembered.prefTerms || {}).length > 0
      && Object.keys(remembered.prefTerms || {}).every(k => /^c_[0-9a-z]{10}$/.test(k))
      && Object.keys(remembered.prefTerms || {}).every(k => /^tm_[0-9a-z]{10}$/.test(remembered.prefTerms[k])),
    'planbook_openClassId = ' + remembered.prefClass + ', planbook_openTermIds = '
      + JSON.stringify(prefTermPairs));
  /* The WO-1.4 defect, which shipped and looked like it worked: setPref refuses any key that is
     not declared in PREF_DEFAULTS, and it refuses it by logging to the console and returning
     false. A new preference that was never declared writes nothing, forever, silently. */
  const declared = await evalJs("(function(){ var p = window.planbook;"
    + " return p.setPref('openClassId', p.getPref('openClassId'))"
    + " && p.setPref('openTermIds', p.getPref('openTermIds')); })()");
  check('both new preferences are declared in PREF_DEFAULTS, so setPref writes instead of refusing',
    declared === true, 'setPref returned ' + declared);

  /* The Traps line, from both ends. Every id in the document is generated and opaque, and no
     module in src/ contains the literal the schema sketch shows — because the day one does,
     something is comparing against it. */
  const termIds = remembered.termIds.reduce((all, list) => all.concat(list), []);
  const uniqueTermIds = new Set(termIds);
  /* Twenty is the guard against a vacuous pass, not the expected number: five classes on quarters
     and one on a single year-long term is 21, and `every` over an empty list is true. */
  check('every term id is generated and opaque: tm_ prefixed, unique, and never a label',
    termIds.length >= 20 && termIds.every(id => /^tm_[0-9a-z]{10}$/.test(id))
      && uniqueTermIds.size === termIds.length,
    termIds.length + ' term ids across ' + remembered.ids.length + ' classes, e.g. ' + termIds[0]);

  /* Static, and comment-stripped rather than a raw grep: src/classes.js's own explanation of this
     trap names the literal, as does the note in src/store.js, and a check that flagged those is
     one nobody could keep green. The strip is naive — block comments, then line comments — so the
     length assertion beside it is the guard against a stripper that ate a file and passed. */
  {
    const files = (await fs.readdir(path.join(ROOT, 'src'))).filter(f => f.endsWith('.js'));
    const offenders = [];
    let shortest = Infinity;
    for (const f of files) {
      const raw = await fs.readFile(path.join(ROOT, 'src', f), 'utf8');
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
      shortest = Math.min(shortest, code.replace(/\s+/g, '').length);
      if (/['"]Q[1-4]['"]/.test(code)) offenders.push(f);
    }
    /* index.html as well, which this sweep did not read until WO-1.6's maintenance pass. The seed
       structures are CHOSEN IN MARKUP — `data-preset="quarters"`, `data-term-preset="fullYear"` —
       so the markup is exactly where a term literal gets reintroduced, and `data-term-preset="Q1"`
       is the same defect as the string in a module. Quoted-literal only, like the pattern above:
       matching a bare Q1 would flag ordinary prose in a hint, and a check that fails on English is
       a check someone deletes. HTML comments come out first, because index.html explains this trap
       in a comment that names it. */
    const html = await fs.readFile(path.join(ROOT, 'index.html'), 'utf8');
    const markup = html.replace(/<!--[\s\S]*?-->/g, '');
    if (/['"]Q[1-4]['"]/.test(markup)) offenders.push('index.html');
    check('no module in src/ and no attribute in index.html carries a term literal like the schema sketch\'s Q1',
      files.length >= 8 && offenders.length === 0 && shortest > 200 && markup.length > 2000,
      (files.length + 1) + ' files read, the smallest module holding ' + shortest
        + ' characters of code, markup ' + markup.length + ' characters'
        + (offenders.length ? ', OFFENDERS: ' + offenders.join(', ') : ''));
  }

  /*
    Archive, then delete. Two operations, and the difference between them is the whole of this work
    order's Trap 6: archive keeps every record and takes the class off the bar, delete destroys
    them. The fixture below is written through the store rather than through a screen because
    attendance and grades have no screen yet — WO-2.x and WO-3.x own those — and the point of it is
    that the confirm counts real records rather than printing zeroes.

    A neighbouring class gets records of its own, so "it deleted the right one" is falsifiable.
  */
  const victimId = remembered.ids[6];
  const neighbourId = remembered.ids[1];
  await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.students = [{ id:'s_v1', first:'Ada', last:'Probe' }, { id:'s_v2', first:'Bo', last:'Probe' }];
      /* Object cells, per WO-2.10 and docs/data-model.md: a fixture written as a bare string here
         would be the one place in this run that a stored string could come from, and the check
         further down that no cell in the document is a bare string would go red about this line
         rather than about the app. (Bare strings ARE tested — deliberately, in the migration and
         restore fixtures, where the point is that they get converted.) */
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-09', marks:{ s_v1:{ code:'A' } } });
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-10', marks:{} });
      /* A day the class did not meet. It is destroyed too, and it is NOT a meeting — everything in
         this app counts recorded meetings (plans/rotating-schedule.md), so the confirm names the
         two kinds separately and this record is what makes that falsifiable. */
      d.attendance.push({ classId:${JSON.stringify(victimId)}, date:'2026-09-11', exception:'dropped' });
      d.attendance.push({ classId:${JSON.stringify(neighbourId)}, date:'2026-09-09', marks:{ s_v1:{ code:'T' } } });
      d.assignments.push({ id:'a_v1', classId:${JSON.stringify(victimId)}, name:'Quiz', points:100 });
      d.assignments.push({ id:'a_n1', classId:${JSON.stringify(neighbourId)}, name:'Lab', points:50 });
      d.scores['a_v1'] = { s_v1:{ v:87 }, s_v2:{ v:null, flag:'missing' } };
      d.scores['a_n1'] = { s_v1:{ v:50 } };
      var victim = d.classes.filter(function(c){ return c.id === ${JSON.stringify(victimId)}; })[0];
      victim.roster = ['s_v1', 's_v2'];
    });
    await s.flush(); return 1; })()`);

  await clickSel('header [data-class-manage]');
  await clickSel('#classList .class-row:nth-child(7) [data-class-archive]');
  const archived = await evalJs('window.__cls()');
  check('archiving takes the class off the tab bar and destroys nothing at all',
    archived.tabNames.length === 6 && archived.tabNames.indexOf('Homeroom') === -1
      && archived.names.length === 7 && archived.archived[6] === true
      && archived.rows === 6 && archived.archivedRows === 1 && !archived.archivedHidden
      && archived.attendance === 4 && archived.assignments === 2 && archived.scoreColumns === 2,
    'tabs = ' + archived.tabNames.length + ', archived rows = ' + archived.archivedRows
      + ', attendance records still there = ' + archived.attendance);
  /* The card goes with the tab, and it goes NOW rather than at the next redraw — this is the
     literal picture src/shell.js's afterClassChange() comment describes: a class the teacher has
     just archived, still on the grid behind the dialog she archived it in. */
  const archivedHome = homeVsDoc(archived);
  check('and the card goes off the grid with it, while the dialog is still open',
    archivedHome.ok && archived.homeNames.indexOf('Homeroom') === -1, archivedHome.detail);
  await clickSel('#classArchivedList [data-class-restore]');
  const unarchived = await evalJs('window.__cls()');
  check('and restoring puts it back on the bar, in the place it had',
    JSON.stringify(unarchived.tabIds) === JSON.stringify(remembered.ids)
      && unarchived.archivedHidden && unarchived.archivedRows === 0,
    JSON.stringify(unarchived.tabNames));
  const unarchivedHome = homeVsDoc(unarchived);
  check('and its card comes back to the grid in that same place',
    unarchivedHome.ok && JSON.stringify(unarchived.homeIds) === JSON.stringify(remembered.ids),
    unarchivedHome.detail);

  /* Delete is offered on an archived row only, and that is the safety this design buys: getting a
     class out of the way costs one tap and nothing at all, and destroying a term of attendance
     costs an archive, a second tap, and a dialog that counts what goes. */
  const deleteOnActive = await evalJs(
    "document.querySelectorAll('#classList [data-class-delete]').length");
  check('no delete control on an active class — archive is how a class leaves the bar',
    deleteOnActive === 0, 'delete buttons in the active list = ' + deleteOnActive);

  /* And the teacher is told why, at the moment she is looking for the control that is not there.
     The full explanation lives in the Archived section, which ships `hidden` and stays hidden until
     something has been archived — so until WO-1.6's maintenance pass, the answer to "where is
     Delete?" was only readable by someone who had already stopped needing to ask. Asserted here
     precisely because nothing is archived at this point in the run. */
  const whyNoDelete = await evalJs(`(function(){
    var modal = document.getElementById('classesModal');
    var stowed = document.getElementById('classArchivedSection');
    var hints = Array.prototype.slice.call(modal.querySelectorAll('.class-hint'));
    var visible = hints.filter(function(p){ return p.offsetParent !== null && !stowed.contains(p); });
    var explains = visible.filter(function(p){ var t = p.textContent.toLowerCase();
      return t.indexOf('archiv') !== -1 && t.indexOf('delet') !== -1; });
    return { archivedSectionHidden: stowed.classList.contains('hidden'),
             visibleHints: visible.length, explaining: explains.length,
             text: explains.length ? explains[0].textContent.replace(/\\s+/g, ' ').trim() : '' };
    })()`);
  check('the reason an active class has no Delete is readable before anything has been archived',
    whyNoDelete.archivedSectionHidden === true && whyNoDelete.explaining >= 1,
    JSON.stringify(whyNoDelete));

  await clickSel('#classList .class-row:nth-child(7) [data-class-archive]');
  await clickSel('#classArchivedList [data-class-delete]');
  const confirmText = await evalJs(`(function(){ var m = document.getElementById('classDeleteModal');
    return { open: !!m && !m.classList.contains('hidden'),
             lead: (document.getElementById('classDeleteLead')||{}).textContent,
             facts: (document.getElementById('classDeleteFacts')||{}).textContent.replace(/\\s+/g,' '),
             button: (document.getElementById('classDeleteBtn')||{}).textContent }; })()`);
  check('the delete confirm names the class and counts the attendance, grades and roster it destroys',
    confirmText.open && /Homeroom/.test(confirmText.lead)
      && /cannot be undone/.test(confirmText.lead) && /archived/.test(confirmText.lead)
      && /2 recorded meetings/.test(confirmText.facts)
      && /1 day marked as not meeting/.test(confirmText.facts)
      && /1 assignment and 2 scores/.test(confirmText.facts)
      && /1 term/.test(confirmText.facts) && /2 students/.test(confirmText.facts)
      && confirmText.button === 'Delete Homeroom',
    confirmText.facts.slice(0, 240));

  /* Flushed first, so that `rev` is settled before the cancel: a debounced save still in the air
     would land between the two reads below and read as the cancel having written something. */
  const beforeCancel = await evalJs(
    '(async function(){ await window.planbook.store.flush(); return window.__cls(); })()');
  await clickSel('[data-class-delete-cancel]');
  const afterCancel = await evalJs(`(async function(){ var s = window.planbook.store;
    await s.flush();
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(s.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var live = window.__cls();
    live.confirmOpen = !document.getElementById('classDeleteModal').classList.contains('hidden');
    live.storedClasses = stored.classes.length;
    live.storedAttendance = stored.attendance.length;
    return live; })()`);
  check('cancelling the delete leaves the class and every record of it exactly as they were',
    afterCancel.confirmOpen === false && afterCancel.names.length === 7
      && afterCancel.attendance === beforeCancel.attendance
      && afterCancel.assignments === beforeCancel.assignments
      && afterCancel.scoreColumns === beforeCancel.scoreColumns
      && afterCancel.rev === beforeCancel.rev
      && afterCancel.storedClasses === 7 && afterCancel.storedAttendance === 4,
    'classes ' + afterCancel.names.length + ', attendance ' + afterCancel.attendance
      + ', rev ' + beforeCancel.rev + ' -> ' + afterCancel.rev
      + ' (nothing written, so rev cannot move)');

  await clickSel('#classArchivedList [data-class-delete]');
  await clickSel('[data-class-delete-confirm]');
  await new Promise(r => setTimeout(r, 400));
  const deleted = await evalJs(`(async function(){ var s = window.planbook.store; await s.flush();
    var d = s.getDoc(); var live = window.__cls();
    live.victimAttendance = d.attendance.filter(function(r){ return r.classId === ${JSON.stringify(victimId)}; }).length;
    live.neighbourAttendance = d.attendance.filter(function(r){ return r.classId === ${JSON.stringify(neighbourId)}; }).length;
    live.victimAssignments = d.assignments.filter(function(a){ return a.classId === ${JSON.stringify(victimId)}; }).length;
    live.victimScores = !!d.scores['a_v1'];
    live.neighbourScores = !!d.scores['a_n1'];
    live.confirmOpen = !document.getElementById('classDeleteModal').classList.contains('hidden');
    return live; })()`);
  check('deleting takes the class, its attendance, its assignments and their scores — and only those',
    deleted.names.length === 6 && deleted.names.indexOf('Homeroom') === -1
      && deleted.victimAttendance === 0 && deleted.victimAssignments === 0
      && deleted.victimScores === false && !deleted.confirmOpen
      && deleted.neighbourAttendance === 1 && deleted.neighbourScores === true
      && deleted.attendance === 1 && deleted.assignments === 1 && deleted.scoreColumns === 1,
    'classes ' + deleted.names.length + ', attendance left ' + deleted.attendance
      + ', assignments left ' + deleted.assignments + ', score columns left ' + deleted.scoreColumns);
  check('and both students stay — a student belongs to the school year, not to one class',
    deleted.students === 2, 'students in the document = ' + deleted.students);
  /*
    The grid after a delete, and this one is HONEST ABOUT BEING WEAKER than the five above it.
    Delete is offered on an ARCHIVED row only (src/classes.js), so the class whose record is being
    destroyed already has no card — the active list does not change, and dropping
    afterClassChange() from this branch of src/shell.js would not move anything on screen. So this
    asserts the invariant rather than the redraw: the grid must still agree with the document, and
    in particular must not have regained a card for a class that no longer exists. Making the
    redraw itself falsifiable here would need delete to be reachable on an active class, which is
    the safety WO-1.6 deliberately bought and is not a thing to add for a check's convenience.
  */
  const deletedHome = homeVsDoc(deleted);
  check('the grid still matches the document after a class is destroyed',
    deletedHome.ok && deleted.homeNames.indexOf('Homeroom') === -1, deletedHome.detail);

  /*
    The first-run header, which nothing above has seen: every class on this device belongs to the
    year that has been open all along, and a teacher opening Planbook for the first time sees
    neither a tab nor a term. An empty year is one year switch away — and the switch is worth
    driving for its own sake, because the class bar is refreshed from shell.js's year-switch chain
    rather than from inside year-picker.js, and a chain nothing exercises is a chain that goes stale
    the next time someone edits that file.
  */
  await evalJs("window.planbook.closeModal('classesModal');1");
  /* A year that genuinely has no classes, found by reading each stored record rather than by
     picking the first other key: the run has three years on the device by now and one of them is
     the migration fixture, which arrives holding a class. Choosing by name gave a year with a tab
     in it and failed this check for the wrong reason. */
  const emptyYear = await evalJs(`(async function(){ var s = window.planbook.store;
    var years = await s.listYears(), open = s.getDoc().year;
    for (var i = 0; i < years.length; i++) {
      if (years[i] === open) continue;
      var d = await s.readStoredDocument(years[i]);
      if (d && (!d.classes || d.classes.length === 0)) return years[i];
    }
    return ''; })()`);
  if (!emptyYear) {
    skip('a year with no classes says so on the bar, and offers the way to add the first one',
      'only one year exists on the device at this point in the run');
  } else {
    const homeYear = await evalJs('window.planbook.store.getDoc().year');
    await clickSel('[data-year-picker]');
    await clickSel('#yearList [data-year-switch=' + JSON.stringify(emptyYear) + ']');
    await new Promise(r => setTimeout(r, 800));
    const bare = await evalJs(`(function(){ var bar = document.getElementById('classTabBar');
      var add = bar.querySelector('.cls-tab-add');
      return { year: window.planbook.store.getDoc().year,
               tabs: bar.querySelectorAll('[data-class-tab]').length,
               emptyText: (bar.querySelector('.hdr-empty')||{}).textContent,
               addText: add ? add.textContent : '',
               dividerHidden: document.getElementById('headerDivider').classList.contains('hidden'),
               navButtons: document.getElementById('termNav').querySelectorAll('button').length,
               manageReachable: !!document.querySelector('#headerRightControls [data-class-manage]')
                 && !document.getElementById('headerRightControls').classList.contains('hidden'),
               selectedClass: window.planbook.classes.getSelectedClassId(),
               selectedTerm: window.planbook.classes.getSelectedTermId(),
               /* WO-1.10's third acceptance line, read off the same fixture: the year that has no
                  classes is also the fresh document its home screen has to be honest about. */
               homeCards: document.querySelectorAll('#homeGrid .class-card').length,
               homeGridHidden: document.getElementById('homeGrid').classList.contains('hidden'),
               homeEmptyShown: !document.getElementById('homeEmpty').classList.contains('hidden'),
               homeEmptyLead: (document.getElementById('homeEmptyLead')||{}).textContent.trim(),
               homeEmptySaid: (document.getElementById('homeEmptyClasses')||{}).textContent.trim().length,
               homeNoYearHidden: document.getElementById('homeEmptyNoYear').classList.contains('hidden'),
               homeEmptyRoute: !!document.querySelector('#homeEmpty [data-class-manage]')
                 && !document.getElementById('homeEmptyActions').classList.contains('hidden')
             }; })()`);
    check('a year with no classes says so on the bar, and offers the way to add the first one',
      bare.year === emptyYear && bare.tabs === 0 && bare.emptyText === 'No classes yet.'
        && bare.addText === 'Add a class' && bare.dividerHidden && bare.navButtons === 0
        && bare.manageReachable && bare.selectedClass === '' && bare.selectedTerm === '',
      JSON.stringify(bare));
    /* A grid that renders nothing and an empty state that says nothing are the same picture, so
       both halves are asserted: zero cards AND a sentence on screen AND the control that leads out
       of it. The no-school-year variant must be the one that stays hidden — there IS a year open
       here, it just has nothing in it, and saying otherwise would be a worse lie than saying
       nothing. */
    check('a fresh document shows a real empty state on the home screen, not blank cards',
      bare.homeCards === 0 && bare.homeGridHidden && bare.homeEmptyShown
        && bare.homeEmptyLead === 'No classes yet.' && bare.homeEmptySaid > 60
        && bare.homeNoYearHidden && bare.homeEmptyRoute,
      'cards = ' + bare.homeCards + ', empty state shown = ' + bare.homeEmptyShown
        + ', lead = ' + JSON.stringify(bare.homeEmptyLead) + ', ' + bare.homeEmptySaid
        + ' characters of explanation, way to the first class = ' + bare.homeEmptyRoute);
    await clickSel('[data-year-picker]');
    await clickSel('#yearList [data-year-switch=' + JSON.stringify(homeYear) + ']');
    await new Promise(r => setTimeout(r, 800));
    const backHome = await evalJs('window.__cls()');
    /* Read on the class GRID, which is where a year switch lands and where the tab strip carries no
       classes at all since WO-1.13. The year with no classes had no working surface to be on, so
       the app went home for it (src/shell.js's afterClassChange) and switching back leaves it
       there. So "that year's classes are back" is counted on the cards — and the bar's own repaint
       is still proved, by the term nav: refreshClassBar draws both halves of that row, and a
       year-switch chain that skipped it would leave the nav empty whichever view was up. */
    check('and switching back brings that year\'s classes and its open term back — the cards on the grid, the terms on the bar',
      backHome.homeIds.length === 6 && backHome.selectedClass === backHome.ids[1]
        && backHome.navLabels.length === 4,
      backHome.homeIds.length + ' cards and ' + backHome.navLabels.length + ' terms back on '
        + homeYear);

  /* ───────────────── the home screen ─────────────────
   *
   * WO-1.10's other three acceptance lines, and they sit INSIDE the classes section because this is
   * the only point in the run where the fixture they need exists: six ACTIVE classes, one of them
   * named with markup, nothing archived yet, and the checks above having just proved all six came
   * back out of IndexedDB rather than out of memory. The step immediately below archives one on
   * purpose, for the delete confirm and the touch pass, and takes the sixth card with it.
   *
   * These are the kinds of check this file already makes and no new ones — rendered geometry under
   * an emulated coarse pointer, and runtime state read back through the seam after a real click.
   * The work order forbids growing this script beyond re-pointing it, and measuring a new screen
   * with measurements that are already here is not that: "six classes fit on an iPad screen in
   * portrait without scrolling" is unreadable from a stylesheet by construction, which is the test
   * plans/verification-tooling.md applies to everything in this file.
   */
  console.log('\n--- the home screen ---');
  await evalJs("(function(){ ['classesModal','yearModal','aboutModal'].forEach(function(m){"
    + " window.planbook.closeModal(m); }); return 1; })()");

  const cards = await evalJs(`(function(){
    var grid = document.getElementById('homeGrid');
    var doc = window.planbook.store.getDoc();
    var active = doc.classes.filter(function(c){ return !c.archived; });
    var els = Array.prototype.slice.call(grid.querySelectorAll('.class-card'));
    return {
      count: els.length,
      active: active.length,
      names: els.map(function(c){ return (c.querySelector('.class-card-name')||{}).textContent; }),
      ids: els.map(function(c){ var b = c.querySelector('.class-card-open');
        return b ? b.getAttribute('data-class-tab') : null; }),
      activeIds: active.map(function(c){ return c.id; }),
      activeNames: active.map(function(c){ return c.name; }),
      /* Class names are teacher-typed and SIS-pasted; one of the six carries markup on purpose. */
      injected: grid.querySelectorAll('b, script, i').length,
      marked: els.filter(function(c){ return c.classList.contains('open'); })
        .map(function(c){ var b = c.querySelector('.class-card-open');
          return b ? b.getAttribute('data-class-tab') : null; }),
      current: els.filter(function(c){
        var b = c.querySelector('.class-card-open');
        return b && b.getAttribute('aria-current') === 'true'; }).length,
      selected: window.planbook.classes.getSelectedClassId(),
      /* The two slots, per card. The state slot was filled by WO-2.1 and says today's state; the
         signals slot is still reserved, empty of text AND of elements, and holding real height. A
         reserved slot with nothing in it and no height is a slot that reflows the grid the day it
         is filled, which is the failure WO-1.10's fourth acceptance line is actually about.

         inControl replaced a hook attribute at WO-1.13, when the card went back to being one
         control: the state line is a span INSIDE the button that opens the class, so what has to be
         true is that the line describing a class sits inside the tap that opens that class. A line
         rendered onto the wrong card, or loose in the grid, answers false.
         (No backticks in this comment: it is inside a template literal.) */
      slots: els.map(function(c){
        var s = c.querySelector('.class-card-state'), g = c.querySelector('.class-card-signals');
        var b = c.querySelector('.class-card-open');
        return { both: !!(s && g),
                 state: s ? s.textContent.trim() : '',
                 inControl: !!(s && b && b.contains(s)),
                 controls: c.querySelectorAll('button').length,
                 said: (g ? g.textContent : '').trim(),
                 kids: g ? g.children.length : 0,
                 h: (s ? s.getBoundingClientRect().height : 0)
                    + (g ? g.getBoundingClientRect().height : 0) };
      })
    }; })()`);

  check('every active class has exactly one card on the home screen, in the tab bar\'s own order',
    cards.count === 6 && cards.count === cards.active
      && JSON.stringify(cards.ids) === JSON.stringify(cards.activeIds)
      && JSON.stringify(cards.names) === JSON.stringify(cards.activeNames)
      && cards.injected === 0,
    cards.count + ' cards for ' + cards.active + ' active classes, elements injected into the grid = '
      + cards.injected + ' :: ' + JSON.stringify(cards.names));
  check('one card is marked as the open class, and it is the one src/classes.js resolves',
    cards.marked.length === 1 && cards.marked[0] === cards.selected && cards.current === 1,
    'marked = ' + JSON.stringify(cards.marked) + ', getSelectedClassId() = ' + cards.selected
      + ', aria-current = ' + cards.current);
  check('every card carries today\'s attendance state and the tap that fixes it, and still reserves Phase 3 and 4\'s space',
    cards.slots.length === 6 && cards.slots.every(s => s.both && s.state !== '' && s.inControl
      && s.controls === 1 && s.said === '' && s.kids === 0 && s.h > 0),
    JSON.stringify(cards.slots.map(s => Math.round(s.h) + 'px, state ' + JSON.stringify(s.state)
      + ', ' + s.controls + ' control(s), line inside it = ' + s.inControl
      + ', signals ' + (s.said === '' && s.kids === 0 ? 'reserved and empty'
        : 'HOLDS ' + JSON.stringify(s.said)))));

  /*
    One tap. Driven on a card that is NOT already the open one — tapping the open card would pass
    whether or not the tap does anything at all — and the answer is read from the same accessor the
    header uses, plus the header itself: the card and the tab are two views of one selection, and a
    tap that moved only the view it was on is the defect this asserts against.
  */
  const other = cards.ids.filter(id => id !== cards.selected)[0];
  await clickSel('#homeGrid .class-card-open[data-class-tab=' + JSON.stringify(other) + ']');
  const tapped = await evalJs(`(function(){
    var want = ${JSON.stringify(other)};
    var btn = document.querySelector('#homeGrid .class-card-open[data-class-tab=' + JSON.stringify(want) + ']');
    var card = btn ? btn.closest('.class-card') : null;
    var tab = document.querySelector('#classTabBar [data-class-tab=' + JSON.stringify(want) + ']');
    var view = document.getElementById('classView'), home = document.getElementById('homeView');
    return { selected: window.planbook.classes.getSelectedClassId(),
             pref: window.planbook.getPref('openClassId'),
             cardMarked: !!(card && card.classList.contains('open')),
             tabMarked: !!(tab && tab.classList.contains('active')),
             marked: document.querySelectorAll('#homeGrid .class-card.open').length,
             /* WO-1.13: the tap is navigation as well as a selection. */
             classView: !!(view && !view.classList.contains('hidden')),
             homeView: !!(home && !home.classList.contains('hidden')),
             dialogs: Array.prototype.slice.call(document.querySelectorAll('.modal-overlay'))
               .filter(function(m){ return !m.classList.contains('hidden'); }).map(function(m){ return m.id; }),
             onScreen: (document.getElementById('attendanceClassName') || {}).textContent }; })()`);
  check('one tap on a card makes that class the open class, on the card AND on the header tab',
    tapped.selected === other && tapped.pref === other && tapped.cardMarked
      && tapped.tabMarked && tapped.marked === 1,
    JSON.stringify(tapped));
  /* The same tap, asked the other question — WO-1.13's first acceptance line, driven from the card
     rather than from the header. The class grid goes, that class's working surface arrives, and
     nothing opened a dialog to do it. The name on the surface is read too: a view that swapped but
     went on describing the class before it would satisfy every clause above this one. */
  check('and it swaps what is in <main> for that class\'s own screen, with no dialog opened',
    tapped.classView && !tapped.homeView && tapped.dialogs.length === 0
      && tapped.onScreen === cards.activeNames[cards.ids.indexOf(other)],
    'class view up = ' + tapped.classView + ', class grid up = ' + tapped.homeView
      + ', dialogs open = ' + JSON.stringify(tapped.dialogs) + ', the screen says '
      + JSON.stringify(tapped.onScreen) + ' for '
      + JSON.stringify(cards.activeNames[cards.ids.indexOf(other)]));

  /*
    Six classes on an iPad in portrait, without scrolling, at 44px.

    Metrics + touch emulation + a reload, in that order, because setEmulatedMedia does not reach
    `pointer` (tools/README.md trap 3) — and the coarse assertion below gates the measurement for
    the same reason the touch section's does: getting this wrong measures the desktop pass and
    reports green.

    THE INSTALL BANNER IS HIDDEN FOR THE MEASUREMENT AND PUT BACK, which is the one liberty taken
    here and it is the honest reading of the acceptance line rather than a way past it. That banner
    is on screen exactly while Planbook is NOT installed, and this claim is about an installed app
    on an iPad — where iOS does not evict the storage either, which is the whole reason the banner
    exists. A headless browser can never be installed, so leaving it up would measure ~200px of a
    strip that cannot be present in the situation being asserted. The backup nag is left exactly as
    the run left it and is reported in the detail, because that one CAN be on screen on an installed
    iPad and it is fair for it to have to fit.
  */
  /* Back to the class grid before the reload below, through the control a teacher taps. Two reasons
     and both are WO-1.13's: the cards cannot be measured while `#homeView` is hidden — they measure
     0x0, which is a green run that measured nothing — and the view is a preference now, so a reload
     taken from a class comes back on that class. Which is a fact this file asserts on purpose in the
     attendance section, and would otherwise trip over here. */
  await clickSel('#classTabBar [data-view-home]');
  await evalJs('(async function(){ await window.planbook.store.flush(); return 1; })()');
  await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  await evalJs(INSTALL_WALKER);
  await evalJs(INSTALL_CLASS_READER);
  const portraitCoarse = await evalJs("matchMedia('(pointer: coarse)').matches");
  check('the emulated iPad-portrait pointer really is coarse (else the fit below is the desktop pass)',
    portraitCoarse === true, 'matchMedia = ' + portraitCoarse);
  const fit = await evalJs(`(function(){
    var banner = document.getElementById('installBanner');
    var wasShown = banner && !banner.classList.contains('hidden');
    if (wasShown) banner.classList.add('hidden');
    var grid = document.getElementById('homeGrid');
    var els = Array.prototype.slice.call(grid.querySelectorAll('.class-card'));
    var last = els.length ? els[els.length - 1].getBoundingClientRect() : null;
    var out = {
      cards: els.length,
      viewport: window.innerHeight,
      scrollH: document.documentElement.scrollHeight,
      lastBottom: last ? Math.round(last.bottom) : 0,
      columns: getComputedStyle(grid).gridTemplateColumns.split(/\\s+/).length,
      /* The CONTROLS on a card, not the card. The card is a container with a button in it, and
         measuring the container would report 44px about a box nobody taps — the WO-1.2 search-box
         defect exactly, arriving in a check rather than in a stylesheet. One per card since WO-1.13
         where WO-2.1 had two; the count below is asserted, so a card that grows a second control
         has to come back through here.
         (No backticks in this comment: it is inside a template literal.) */
      controls: grid.querySelectorAll('.class-card button').length,
      under44: Array.prototype.slice.call(grid.querySelectorAll('.class-card button'))
        .filter(function(c){ var r = c.getBoundingClientRect();
          return r.height < 44 || r.width < 44; }).length,
      nagUp: !document.getElementById('backupNag').classList.contains('hidden'),
      bannerWasUp: !!wasShown
    };
    if (wasShown) banner.classList.remove('hidden');
    return out; })()`);
  if (portraitCoarse !== true) {
    skip('six classes fit on an iPad screen in portrait without scrolling, at 44px+ targets',
      'the coarse pointer never engaged, so nothing below it can be trusted');
  } else {
    check('six classes fit on an iPad screen in portrait without scrolling, at 44px+ targets',
      fit.cards === 6 && fit.controls === 6 && fit.under44 === 0 && fit.lastBottom <= fit.viewport
        && fit.scrollH <= fit.viewport,
      fit.cards + ' cards in ' + fit.columns + ' column(s); last card ends at ' + fit.lastBottom
        + 'px of ' + fit.viewport + 'px, page is ' + fit.scrollH + 'px tall; '
        + fit.controls + ' controls on them, ' + fit.under44 + ' under 44px; backup nag on screen = ' + fit.nagUp
        + ', install banner hidden for the measurement = ' + fit.bannerWasUp);
  }
  /* Handed back as it was found. The touch section sets its own metrics later and the sections
     between here and it drive clicks by viewport coordinate, so a left-behind override would move
     every one of them without saying so. */
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise(r => setTimeout(r, 300));
  /* Back onto the class view for the archive below, for the reason given at the top of this
     section: the measurement above was taken on the grid, and the check under the archive is about
     what the SWITCHER shows once a class has left it. */
  await toClassView();
    await clickSel('header [data-class-manage]');
  }

  /* One class is left archived on purpose. The delete confirm has nothing to open from otherwise,
     and the touch section below has to be able to measure it. Flushed for the reason the reload
     above gives — that section reloads too, and an unflushed archive would arrive there as a
     missing fixture rather than as a failed check. */
  await clickSel('#classList .class-row:nth-child(5) [data-class-archive]');
  const leftover = await evalJs(`(async function(){ var live = window.__cls();
    window.planbook.closeModal('classesModal');
    await window.planbook.store.flush();
    return live; })()`);
  check('the archived section shows what is in it, and the bar shows what is left',
    leftover.archivedRows === 1 && leftover.rows === 5 && leftover.tabNames.length === 5
      && !leftover.archivedHidden,
    'active ' + leftover.rows + ', archived ' + leftover.archivedRows);
}

h.classesBooted = classesBooted;
h.classSeam = classSeam;
}
