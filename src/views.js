/*
  The main area's views — what is in `<main>`, one at a time.

  WHY THIS FILE EXISTS AT ALL, since it is forty lines. Until WO-1.13 `<main>` held one panel and
  nothing ever swapped it: `selectClass()` wrote a preference, repainted the tab strip, and stopped,
  because there was nowhere to go. Attendance then had to open as a dialog over the cards it had
  just made irrelevant. This is the missing half — the header row selects a class, and the main area
  shows it.

  THE SHAPE IS ROLL CALL!'s, AND IT IS DELIBERATELY THE WHOLE MECHANISM. Over there
  (`src/dashboard.html`) `<main class="main">` holds `#registryView` and `#compactGridView` as
  siblings, and toggling `.hidden` on them IS the view system — no router, no history stack, no
  hash, no framework. Same here. `docs`-level reasons this is not going to grow into one:

    - A URL router is a framework with one user, and the suite rule is no dependencies. An app with
      no server-side routes and no shareable links has nothing for a URL to carry.
    - The back button belongs to the browser, and on an installed iPad PWA there isn't one on
      screen at all — which is why the way back to the class grid is a control a teacher can see
      rather than a gesture she has to know.

  WHAT THIS OWNS AND WHAT IT DOES NOT. It owns which view is visible and the preference that
  remembers it. It owns NO rendering: what a view is made of belongs to the module that draws it
  (src/home.js, src/attendance.js), and the ORDER things happen in belongs to src/shell.js, which is
  where every other chain in this app is stated. That is also why this file imports nothing but
  src/prefs.js — a module that imported classes.js or attendance.js could not be imported BY them,
  and this repo has refused to close an import loop four times now (src/shell.js's own header).

  THE PREFERENCE IS A UI PREFERENCE and nothing else: whether this browser was last inside a class
  or looking at the grid. It is `planbook_openView`, declared in src/prefs.js like every other one,
  and it holds a view NAME rather than an element id — an id in localStorage is markup leaking into
  storage, and the markup is allowed to be renamed. Which class that view shows is `openClassId`,
  which was always the right preference and is untouched by this file. WHICH SCREEN OF THAT CLASS is
  deliberately not remembered at all — see REMEMBERED_AS below.
*/

import { getPref, setPref } from './prefs.js';

/* view name → the element that is shown for it. A view added by a later work order adds one line
   here and one `<div>` in index.html; nothing else in this file changes. Phase 3's gradebook and
   Phase 6's calendar are the two already known about.

   `class` is the ATTENDANCE screen, and the name is kept rather than corrected. It was the class
   view when a class had one screen, it is the value sitting in `planbook_openView` on two devices
   already, and renaming it would rename a stored preference to make a word in this file read
   better. WO-3.3 added `assignments` beside it; WO-3.5 added `scores` the same way, in one line and
   with no other change to this file than the two lists below. WO-3.7's `detail` is the third, and
   the only one that is not a tab. */
const VIEWS = {
  home: 'homeView',
  class: 'classView',
  assignments: 'assignmentsView',
  scores: 'scoresView',
  detail: 'detailView',
};

/*
  THE SCREENS OF ONE OPEN CLASS.

  A class screen is a view like any other — same `.hidden` toggle, same `<main>`, no router — and
  this list is what lets the two callers that care ask the question without keeping their own copy
  of the answer: src/classes.js draws the class tabs on any of them, and src/shell.js paints the
  right screen after a switch. The question both of them are asking is "am I inside a class", which
  src/classes.js's refreshClassBar() states in as many words.

  THE FIRST THREE ARE THE SWITCHER'S, IN ITS ORDER, AND THE FOURTH IS NOT ON IT (WO-3.7). This list
  said "in the order the switcher draws them" until per-student detail landed, and that sentence
  stopped being true of the whole of it: `detail` is a screen of one open class — the header's class
  tabs belong on it, and it is repainted when the class changes underneath it — but it is reached by
  tapping a STUDENT'S NAME and never from the strip, so it has no segment there and adds no line to
  src/screen-nav.js's own SCREENS. Adding one would draw a fourth tab that is dead until a student
  is chosen, which is the shape the owner rejected on 2026-08-09
  (plans/gradebook-surfaces.md § "Per-student detail is not a fourth tab").
*/
const CLASS_SCREENS = ['class', 'assignments', 'scores', 'detail'];

export function isClassScreen(name) { return CLASS_SCREENS.indexOf(name) !== -1; }

/*
  WHAT A CLASS SCREEN IS REMEMBERED AS, and this is the whole of "a class always opens on
  Attendance, never on the screen it was left on" (plans/gradebook-surfaces.md, decided by the owner
  2026-08-09; WO-3.3's sixth acceptance line).

  The preference cannot hold `assignments` or `scores`. Not "is ignored when it does" — cannot hold
  them: every class screen is written down as `class`, so a browser that was left on the score grid
  and then reloaded reads `class` at boot and lands on Attendance, and there is no per-class memory
  anywhere to go stale. Collapsing on the READ side instead would have worked today and left a stored
  `assignments` sitting in localStorage waiting for the next reader of savedView() to trust it.

  A SCREEN ADDED HERE ADDS ITS LINE, and forgetting is silent: the omission does nothing at all until
  a teacher reloads while standing on the new screen, and then it is a preference holding a value the
  owner's rule says cannot exist. WO-3.5's `scores` is the second entry for that reason.

  WO-3.7's `detail` IS THE THIRD, AND IT IS THE ONE WITH A SECOND REASON. The owner's rule already
  covers it — a class opens on Attendance — but this screen also names a student, and a browser that
  reopened on a named student's failing grade would be putting that on the glass without anybody
  having asked for it, on the screen most likely to be projected. The preference holds a view name
  and never a student id either way; this line is what stops the view name being enough.

  It costs nothing that anybody asked for: `openView` answers "was this browser inside a class or
  looking at the grid", which is exactly the granularity src/shell.js's boot restores at.
*/
const REMEMBERED_AS = { assignments: 'class', scores: 'class', detail: 'class' };

/* Where a browser that has never been here lands, and where a stored name that no longer exists
   falls back to. The class grid rather than a class: on a fresh install there is no class to show,
   and "Your classes" is the screen that leads to the first one. */
const DEFAULT_VIEW = 'home';

export function isView(name) { return Object.prototype.hasOwnProperty.call(VIEWS, name); }

/*
  Show one view and hide the others. Returns the name actually shown, which is DEFAULT_VIEW if it
  was handed something it does not have.

  It writes the preference on every call rather than only on a change: setPref is one localStorage
  write of a five-character string, and the alternative is a second copy of "which view is showing"
  living in this module to compare against — which is exactly the kind of second answer this repo
  keeps refusing. The DOM is the one truth about what is on screen; currentView() reads it back.
*/
export function showView(name) {
  const want = isView(name) ? name : DEFAULT_VIEW;
  Object.keys(VIEWS).forEach((key) => {
    const el = document.getElementById(VIEWS[key]);
    if (el) el.classList.toggle('hidden', key !== want);
  });
  setPref('openView', REMEMBERED_AS[want] || want);
  return want;
}

/* What is on screen right now, read off the DOM. Callers use it to decide whether a repaint is
   worth doing — src/shell.js's afterClassChange() repaints the registry only when the registry is
   the thing being looked at. */
export function currentView() {
  const shown = Object.keys(VIEWS).filter((key) => {
    const el = document.getElementById(VIEWS[key]);
    return el && !el.classList.contains('hidden');
  });
  return shown[0] || '';
}

/* What this browser was last looking at. Read at boot by src/shell.js, which is also where the one
   thing this file cannot know is decided: a stored `class` with no class to show is a blank main
   area, and the answer to that is the home view. */
export function savedView() {
  const want = getPref('openView');
  return isView(want) ? want : DEFAULT_VIEW;
}
