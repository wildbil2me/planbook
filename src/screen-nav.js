/*
  The switcher between one open class's screens — Attendance · Assignments · Scores.

  WHY IT IS ITS OWN FILE. It is drawn on every class screen and belongs to none of them: the strip
  under the attendance panel's title and the strip under the assignment list's title are the same
  control, and the day two modules each drew their own copy is the day they start disagreeing about
  which one is active. src/attendance.js cannot own it (src/assignments.js would have to import a
  195kB registry to draw six buttons), src/views.js must not (its header says it owns which view is
  visible and NO rendering), and src/shell.js is where the ORDER things happen in lives rather than
  what they look like. So: a leaf that imports src/views.js and nothing else, and that nothing
  imports back except src/shell.js.

  DECIDED BY THE OWNER, 2026-08-09, AND NOT RE-OPENED HERE. plans/gradebook-surfaces.md § "How the
  class view navigates between its screens" is the record; design/mockups/proposed.css § SHARED is
  the drawing whose values src/assignments.css lifts. Three things came out of it and all three are
  built below rather than argued:

    THREE TABS, NOT FOUR. Attendance · Assignments · Scores.

    PER-STUDENT DETAIL IS NOT ONE OF THEM. It is reached by tapping a student, and this strip shows
    that student's name as a breadcrumb WHILE YOU ARE IN IT — see setDetailBreadcrumb() below, which
    is written so that the name cannot outlive the screen it belongs to.

    A CLASS ALWAYS OPENS ON ATTENDANCE. That half is not here: it is src/views.js's REMEMBERED_AS,
    because the failure it prevents is a stored preference rather than a painted button.

  IT IS ON THE WHITE PANEL AND NOT IN THE HEADER STRIP, which is a measurement rather than a taste.
  That strip already carries the class tabs, the term nav and three icon buttons, and
  src/classes.js's classRow() records that a fourth control up there puts the page into horizontal
  overflow at 390px. The class tabs answer "which class"; this answers "which screen of it".

  ARIA: `aria-current`, NOT `role="tab"`. The drawing carries `role="tablist"` and the app's own
  class tabs carry `aria-current` (src/classes.js), and the app wins — every class screen renders
  its OWN copy of this strip inside the panel a tab would claim to control, so `aria-controls`
  would point at the element the control sits inside and a `tabpanel` would contain its own
  tablist. That is a worse lie to a screen reader than a group of buttons that says which one you
  are on. Same reason `.cls-tab.active` carries `aria-current="true"` two rows up the page.
*/

import { currentView, isClassScreen, isView } from './views.js';

/* Every container that wants a strip, and there is one per class screen. A view added later puts
   an empty `<nav data-screen-nav>` in its panel header and appears here with no change to this
   file — the same contract #classTabBar and #categoryList have with their renderers. */
const CONTAINER = '[data-screen-nav]';

/*
  The three, in order. `view` is the name in src/views.js — which is why Attendance's is `class`,
  and that history is written down at VIEWS there.

  A SEGMENT IS ENABLED IFF src/views.js HAS ITS VIEW, and nothing here records which. That is what
  lets a tab be DRAWN before its screen exists — the strip carries every screen the class is going
  to have from the day it exists, so a teacher learns where they live before they arrive and the
  strip does not change shape under her when they do — while the disabling stays a question rather
  than a stored answer that a later work order has to remember to come back and edit.

  IT WAS A STORED ANSWER UNTIL 2026-08-10 AND IT COST WO-3.5 A CORRECTION ROUND. `pending` was a
  hardcoded sentence on the Scores row; this comment already promised the mechanism below ("`enabled`
  is asked of src/views.js"), index.html's own markup asserted that this file therefore needed no
  edit when #scoresView landed, and neither implementer opened the third file. The view shipped with
  its only door disabled. So the promise is now the code: WO-3.7's `detail` and Phase 6's calendar
  add a line here the day they are drawn and a line to VIEWS the day they work, and the two halves
  cannot disagree because only one of them is written down.
*/
const SCREENS = [
  { view: 'class', label: 'Attendance' },
  { view: 'assignments', label: 'Assignments' },
  { view: 'scores', label: 'Scores' },
];

/*
  What a screen is called, asked of this file rather than restated in src/shell.js, which announces
  a switch out loud (a screen swap is a change a screen-reader user cannot see). The labels above
  are the only place the three screens are named, and a second copy would be a second name for the
  same button the day one of them is reworded.
*/
export function screenLabel(view) {
  const hit = SCREENS.filter((s) => s.view === view)[0];
  return hit ? hit.label : '';
}

/*
  The view a per-student detail is shown in (WO-3.7), named here before it exists for one reason:
  the breadcrumb rule below is keyed to it, and a rule keyed to nothing is a rule nobody can read.
  Until that work order lands, currentView() never answers this and no name is ever drawn.
*/
const DETAIL_VIEW = 'detail';

/*
  THE BREADCRUMB, AND WHY IT CANNOT BE LEFT BEHIND.

  Whoever opens a student's detail sets the name here; this module draws it only while DETAIL_VIEW
  is the screen on the glass. So switching to Attendance takes the name off the strip by
  construction rather than by somebody remembering to clear it — which is the half of WO-3.3's
  seventh acceptance line that a build can pass on the way in and fail on the way out.

  It is a name and never an id, because it is a caption: nothing is looked up from it. It is also
  the one thing on this strip that is student data, which is why it is set by the screen that has
  already decided a student is on display and never read out of the document by this file.
*/
let detailName = '';

export function setDetailBreadcrumb(name) { detailName = String(name || ''); }

function segment(screen, active) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'screen-nav-btn' + (active ? ' active' : '');
  btn.textContent = screen.label;
  if (!isView(screen.view)) {
    /* Disabled rather than absent, and it says why on hover and to a screen reader. A control that
       is simply missing is a feature a teacher goes looking for; one that is greyed with a sentence
       on it is a feature that has not arrived. The sentence is DERIVED from the label rather than
       written beside it, for the reason SCREENS gives: a bespoke string per row is a second place
       the arrival of a screen has to be recorded, and the first one to go stale is the one nobody
       renders. */
    const why = screen.label + ' is not built yet.';
    btn.disabled = true;
    btn.title = why;
    btn.setAttribute('aria-label', screen.label + ' — ' + why);
    return btn;
  }
  btn.setAttribute('data-class-screen', screen.view);
  if (active) btn.setAttribute('aria-current', 'true');
  return btn;
}

function breadcrumbSegment(name) {
  const btn = document.createElement('button');
  btn.type = 'button';
  /* `.detail` is the gap that says this is a different KIND of destination — the same separation
     `.cls-tab-home` makes at the head of the class row. It is active because you are standing in
     it, and it carries no `data-class-screen`: tapping the screen you are already on is a control
     that does nothing, and the way out of it is one of the three beside it. */
  btn.className = 'screen-nav-btn detail active';
  btn.textContent = name;
  btn.title = name;
  btn.disabled = true;
  btn.setAttribute('aria-current', 'true');
  return btn;
}

/*
  Repaint every strip on the page from what is on screen right now.

  Called by src/shell.js after anything that changes which screen is up, and cheap enough to call
  when nothing did: it is six elements, and the alternative is a second copy of "which screen is
  showing" living in this module to compare against — which is the second answer this repo keeps
  refusing (src/views.js's showView says the same thing about setPref).

  Painted on the hidden strips too, deliberately. The teacher only ever sees one, but a strip that
  is only correct on the view it belongs to is a strip that flashes the wrong active segment for a
  frame the moment that view is shown.
*/
export function refreshScreenNav() {
  const strips = document.querySelectorAll(CONTAINER);
  if (!strips.length) return;
  const view = currentView();
  const onClass = isClassScreen(view) || view === DETAIL_VIEW;

  strips.forEach((strip) => {
    strip.textContent = '';
    /* Nothing to switch between when no class is open — the class grid is not a screen OF a class.
       The strip stays in the markup and goes empty rather than being hidden, so the panel header
       above it does not change height between views. */
    if (!onClass) return;
    SCREENS.forEach((screen) => strip.append(segment(screen, screen.view === view)));
    if (view === DETAIL_VIEW && detailName) strip.append(breadcrumbSegment(detailName));
  });
}
