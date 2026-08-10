/*
  Boot, and the wiring for everything in the app shell.

  This is the only module index.html loads directly; everything else it imports. Keeping one
  entry point means the load order is stated in one place rather than in five <script> tags.

  A convention this file sets, because WO-1.2 is the first code and every later work order
  will copy whatever it finds here:

    Handlers are attached by delegation, from declarative `data-*` hooks in the markup —
    never `onclick="..."` attributes. Roll Call! uses inline onclick everywhere and it works
    there, because that app is one file with everything on `window`. Planbook is ES modules,
    where an inline attribute is evaluated in global scope and cannot see a module's
    exports; `onclick="openModal('x')"` would throw "openModal is not defined" and it would
    throw at click time rather than at load time, which is the worst place to find out.

    The hooks, all handled by the one listener below:
      data-modal-open="<overlayId>"   opens that overlay
      data-modal-close                closes the overlay it sits inside
      data-pill-group                 on a container: its .pill children single-select
      data-install-dismiss            snoozes the install banner
      data-presentation-toggle        turns presentation mode on or off — on the header button and
                                      on the strip's own "Turn it off", which are the same flip
      data-year-picker                renders the year list, then opens the year modal
      data-year-switch="<year>"       opens that year document
      data-year-create                on a <form>: creates the year typed into it
      data-backup-panel               fills the backup panel, then opens it
      data-backup-download            downloads the open year document as a file
      data-backup-download-all        downloads every year on the device, in one zip file
      data-backup-file                on an <input type=file>: reads the chosen backup
      data-backup-drop                on a container: accepts a dropped backup file
      data-backup-confirm             carries out the restore the confirm dialog describes
      data-backup-cancel              abandons it, having written nothing
      data-class-manage               fills the classes panel, then opens it
      data-view-home                  puts the class grid back in <main> — the way back, carried by
                                      the "All classes" tab at the head of the class row and by the
                                      class view's own panel header, which are two doors onto one
                                      route rather than two controls
      data-class-tab="<classId>"      makes that class the open one AND puts its working surface in
                                      <main> — carried by the home screen's cards, which is how you
                                      ENTER a class, and by the header's tab row, which is how you
                                      SWITCH between them. The two are never on screen together:
                                      the tab row is drawn on the class view only (src/classes.js)
      data-class-create               on a <form>: creates the class typed into it
      data-class-rename="<classId>"   turns that row into a rename field
      data-class-rename-save="<id>"   on a <form>: saves the name typed into that row
      data-class-rename-cancel        abandons the rename
      data-class-move-up="<classId>"  moves that class one place earlier in the tab order
      data-class-move-down="<id>"     one place later
      data-class-archive="<classId>"  takes it off the tab bar, keeping everything in it
      data-class-restore="<classId>"  puts an archived class back
      data-class-delete="<classId>"   opens the confirm that counts what deleting destroys
      data-class-delete-confirm       carries out that deletion
      data-class-delete-cancel        abandons it, having written nothing
      data-term-manage="<classId>"    opens the term editor for that class (empty = the open one)
      data-term-select="<termId>"     makes that term the open one in the open class
      data-term-add                   adds a term to the class the editor is open for
      data-term-remove="<termId>"     removes it, unless it holds an assignment
      data-term-preset="<key>"        replaces the term list with a starting structure
      data-term-field="label|start|end" + data-term-id: an input; edits that field as it is typed,
                                      and on `change` rebuilds a date field that was cleared
      data-category-manage="<classId>" opens the grading categories for that class
      data-category-add               adds a category to the class the editor is open for, at 0%
      data-category-move-up="<id>"    moves that category one place earlier in the list
      data-category-move-down="<id>"  one place later
      data-category-remove="<id>"     removes it — on the tap when nothing is filed under it, and
                                      through a confirm that counts the assignments and scores when
                                      something is
      data-category-remove-confirm    carries out that removal
      data-category-remove-cancel     abandons it, having written nothing
      data-category-field="name|weight" + data-category-id: an input; edits that field as it is
                                      typed, and redraws the running weights total beside it
      data-letter-scale               opens the letter-grade bands. One door, and it is document-
                                      level: the per-class override is reached from the subject row
                                      inside that panel, because the class-manager row is full
      data-scale-subject="<classId>"  which scale the panel is showing; empty means the year's own
      data-scale-override-on="<id>"   gives that class its own bands, copied from the year's
      data-scale-override-off="<id>"  puts it back on the year's bands, discarding its own
      data-band-add                   adds a band to the scale the panel is showing, at 0%
      data-band-move-up="<index>"     moves that band higher in the list; the list order IS the
                                      order a percentage is read against
      data-band-move-down="<index>"   one lower
      data-band-remove="<index>"      removes it, on the tap — nothing is filed under a band
      data-band-field="letter|min" + data-band-index: an input; edits that band as it is typed, and
                                      redraws the derived range beside every row below it
      data-class-screen="<view>"      moves between the open class's screens — Attendance ·
                                      Assignments · Scores. Drawn by src/screen-nav.js on every one
                                      of them, and it never changes WHICH class is open, only which
                                      screen of it. A class always opens on Attendance, so nothing
                                      here writes down which screen was left (src/views.js)
      data-assignment-new             adds an assignment to the open class and term, and opens the
                                      editor on it
      data-assignment-edit="<id>"     opens the editor for that assignment
      data-assignment-move-up="<id>"  moves it one place earlier inside its own category group
      data-assignment-move-down="<id>"  one place later
      data-assignment-duplicate="<id>"  opens the copy dialog — into this class or another section
      data-assignment-copy-class="<id>"  which class the copy lands in; re-proposes its term and
                                      matches its category BY NAME, never by carrying an id across
      data-assignment-copy-confirm    writes the copy, with a new id and no scores on it
      data-assignment-copy-cancel     abandons it, having written nothing
      data-assignment-delete="<id>"   opens the confirm that counts the scores it takes with it —
                                      empty on the editor's own Delete…, meaning "the open one"
      data-assignment-delete-confirm  carries out that deletion
      data-assignment-delete-cancel   abandons it, having written nothing
      data-assignment-field="name|points|assigned|due" + data-assignment-id: an input; edits that
                                      field as it is typed, and on `change` rebuilds a date field
                                      that was cleared — the iPadOS picker quirk data-term-field
                                      answers above. `points` stores what was typed, INCLUDING 0
      data-assignment-category="<id>" a <select>; files that assignment under another category of
                                      the same class, on `change` rather than on `input`
      data-assignment-copy-term       a <select> in the copy dialog; which term the copy lands in
      data-assignment-copy-category   a <select>; which of the TARGET class's categories it lands in
      data-assignment-copy-name       an input; the copy's name, held as a proposal until confirmed
      data-attendance-cell="<id>" + data-attendance-date="<iso>": cycles that student's mark on
                                      that day — P → A → E → T → D → P, entered at P from a
                                      question mark. `P` is a step and is still never STORED:
                                      landing on it deletes the entry, which is what present is
      data-attendance-take="<iso>"    records the open class as met on that day, everyone present —
                                      the one control allowed to change every row at once
      data-attendance-untake="<iso>"  takes that back — offered only while nothing is marked
      data-attendance-unconfirm-all="<iso>"  the class reset: every student back to a question mark
      data-attendance-unconfirm="<id>"       one student back to a question mark, from their row
      data-attendance-detail="<id>"   opens that row's own panel — the time, the note, the un-confirm
      data-attendance-note="<id>" + data-attendance-note-date="<iso>": an input; writes the note on
                                      that student's mark as it is typed
      data-dayoff-panel               fills the days-off panel, then opens it — carried by the home
                                      screen's own header button and by the 📅 in a covered column's
                                      head on the registry, which are two doors onto one route
      data-dayoff-kind="no-school|dropped"   which kind the form is about; the class picker below
                                      appears for the second and not for the first
      data-dayoff-class="<classId>"   adds or removes that class from the drop being authored
      data-dayoff-create              on a <form>: adds the day off or drop typed into it, or opens
                                      the warning first when the range already holds real attendance
      data-dayoff-confirm             adds it anyway, having read what keeps its marks
      data-dayoff-cancel              abandons it, having written nothing
      data-dayoff-remove="<eventId>"  takes it off the calendar; every day it covered goes straight
                                      back to not taken yet, because nothing was ever copied onto a
                                      record to have to unpick
      data-dayoff-date="from|to"      a date field in that form; on `change` it carries the end date
                                      along with the start, and rebuilds a field cleared by hand —
                                      the iPadOS picker quirk `data-term-field` answers above
      data-attendance-drop="<iso>"    one tap: the class did not meet that day
      data-attendance-undrop="<iso>"  one tap back, leaving the day not taken yet
      data-attendance-edit="<iso>"    the deliberate unlock on a past column, one column at a time
      data-attendance-lock            closes it again and puts the screen back on today
      data-attendance-page="earlier|later|today"  moves the six-weekday window; `later` is disabled
                                      at the window that ends today, because there is no tomorrow
                                      column and there is not going to be one
      data-attendance-filter="all|P|T|A|E|D"      shows only students with that mark on the day
                                      being edited. There is no pill for `U` — it is not a code a
                                      teacher marks, and the count is on the column head instead
      data-attendance-sort="first|last"           sorts the rows by that name
      data-attendance-search          on an <input>: narrows the rows as it is typed
      data-pass-issue="<studentId>" + data-pass-type="bathroom|nurse|quick": sends that student out
                                      of the room and records the time. Three at once per class,
                                      after which these are disabled and the reason is above the grid
      data-pass-return="<studentId>"  one tap back: computes the minutes and appends one entry to
                                      the pass log. On the row AND on the banner card — one hook,
                                      one writer, two surfaces
      data-pass-cancel="<studentId>"  the pass was a mis-tap: the student stops being out and
                                      NOTHING is written. On the card only, never on the row
      data-pass-note="<studentId>"    on an <input>: a note on that student's open pass, written as
                                      it is typed and carried into the log entry on return.
                                      None of these four touches attendance
      data-roster-manage              fills the roster panel for the open class, then opens it
      data-roster-create              on a <form>: adds the student typed into it
      data-roster-paste               opens the paste box over the roster panel
      data-roster-preview             reads the paste box into the preview list
      data-roster-paste-back          back from the preview to the paste box
      data-roster-commit              adds the students the preview lists
      data-paste-include="<index>"    adds or skips that preview row
      data-paste-swap="<index>"       swaps first and last on that row
      data-paste-swap-all             swaps first and last on every row
      data-paste-field="first|last" + data-paste-index: an input; edits that preview row
      data-student-edit="<id>"        opens the editor for that student
      data-student-remove="<id>"      takes that student off the open class's roster
      data-student-add-to-class="<id>" puts a student who is in no class onto the open one
      data-student-delete="<id>"      opens the confirm that counts what deleting destroys
      data-student-delete-confirm     carries out that deletion
      data-student-delete-cancel      abandons it, having written nothing
      data-student-class="<classId>"  puts the open student into that class, or takes them out
      data-student-field="<path>" + data-guardian-index: an input; edits that field as it is typed
      data-guardian-add               adds a guardian to the open student
      data-guardian-remove="<index>"  removes one
      data-guardian-preferred="<i>"   makes that guardian the one to contact first
      data-supports-open="<id>"       the roster row's support dot: opens that student's editor
                                      with the support panel already showing
      data-supports-reveal            shows or hides the support panel inside the open editor
      data-support-plan="<value>"     sets the open student's plan — IEP, 504, ELL or none
      data-accommodation-add          adds an accommodation to the open student
      data-accommodation-remove="<i>" removes one
      data-support-kind + data-accommodation-index: a <select>; sets that accommodation's kind on
                                      `change` rather than on `input`, which is what a <select> is
      data-support-date               on the review-date input: rebuilds a field cleared on iPadOS
      data-teacher-panel              fills the teacher's own details, then opens them
      data-teacher-field="<name>"     an input; edits that field as it is typed
      data-teacher-cc                 toggles whether outreach drafts copy the teacher

    Delegation also means markup rendered later needs no re-binding, which is what makes it
    the right default for a screen whose rows come from the year document. The year rows are
    the first case of it: src/year-picker.js builds them fresh every time the modal opens and
    binds nothing.

    NOT EVERYTHING ON THIS SCREEN IS A CLICK. Three other document-level listeners live further
    down, and each one is there because the thing it carries has no control to hang a hook on:
    `submit` (forms), `input` (fields saved as they are typed), and since WO-2.5 `keydown` — the
    registry's marking keys, which are the path a live class is marked on now that the laptop is
    the device of record. That last one is the only listener in this file that reads
    document.activeElement to decide whether the event is for it, and its five guards are argued
    where it sits.

    `data-year-picker` is not `data-modal-open="yearModal"` because the list inside it has to
    be read out of IndexedDB before the panel is on screen — a modal that opens and then fills
    in is a modal that flickers.
*/

import { openModal, closeModal, anyModalOpen } from './modal.js';
import { announce } from './live-region.js';
import { getPref, setPref } from './prefs.js';
import { refreshInstallBanner, dismissInstallBanner, isInstalled } from './install-banner.js';
import * as store from './store.js';
import { refreshYearButton, openYearPicker, switchYear, createYearFromForm } from './year-picker.js';
import * as backup from './backup.js';
import * as classes from './classes.js';
/* WO-3.1. Its own module rather than a third section of src/classes.js, and that file's header
   argues why; the import runs one way — classes.js imports the seed and the weight arithmetic from
   here, and this module imports nothing back, so "which class is open" is resolved below and
   handed down as an id. */
import * as categories from './categories.js';
/* WO-3.2. Its own module for the reason src/teacher.js declines to host it — a setting about the
   gradebook rather than about the teacher — and a leaf like categories.js: it imports the store, the
   modal system and the live region, and nothing imports it back. */
import * as letterScale from './letter-scale.js';
import * as home from './home.js';
import * as attendance from './attendance.js';
/* Imported here for the seam at the foot of this file and for nothing else — every control a hall
   pass has is on the registry, and src/attendance.js is what drives them. */
import * as passes from './passes.js';
/* WO-2.3's two halves, and they are two modules for the reason src/passes.js and
   src/attendance.js are: src/calendar.js is the MODEL — no DOM, no clock, no store — and
   src/days-off.js is the only screen that writes one. The registry reads the first and never the
   second, which is what keeps "is this class meeting" a question with one answer. */
import * as calendar from './calendar.js';
import * as daysOff from './days-off.js';
import * as roster from './roster.js';
import * as supports from './supports.js';
import * as presentation from './presentation.js';
import * as teacher from './teacher.js';
import * as views from './views.js';
/* WO-3.3, and two modules rather than one because they are two different things. src/screen-nav.js
   is the strip that switches between one class's screens — a leaf that imports src/views.js and
   nothing else, drawn on every class screen and belonging to none of them; src/assignments.js is
   one of those screens. The order below is the order they are wired: the switcher moves the view,
   this file paints whatever the switch landed on. */
import * as screenNav from './screen-nav.js';
import * as assignments from './assignments.js';

/* Everything that is a fact about the open year rather than about a save, re-evaluated wherever the
   open year can change: the backup nag (src/backup.js explains why it is not on every save), the
   class bar and the home screen, both of which are describing another year's classes the instant
   the document underneath them is replaced, and the teacher's own name in the header, which lives
   in the year document rather than in this browser (src/teacher.js). Chained from the hooks below
   rather than called from inside year-picker.js, so that none of those modules has to import the
   others. */
function afterYearChange() {
  backup.refreshBackupNag();
  classes.refreshClassBar();
  afterClassChange();
  teacher.refreshHeaderIdentity();
}

/*
  The home screen redrawn behind whatever just changed a class.

  THE CARDS AND THE TAB ROW ARE TWO VIEWS OF ONE LIST, and only one of them redraws itself.
  src/classes.js ends every mutation with its own refreshClassBar(), and it deliberately does not
  reach the home screen: src/home.js imports IT — for the read point its header comment exists to
  provide — and the reverse import would close a loop this repo has refused twice already
  (afterYearChange above, and src/classes.js's own header comment). So the second view is redrawn
  from here, which is where this app states the order things happen in.

  A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE. The cost of forgetting is a home screen showing
  a class the teacher has just archived, sitting behind the dialog she archived it in — visible the
  moment she closes it, and invisible in a desk check of the module she edited.

  SINCE WO-1.13 IT ALSO REPAINTS THE MAIN AREA, and that is the same failure one view further in.
  The class view is drawn from the class src/classes.js resolves, so archiving the open class,
  deleting it, or renaming it leaves a registry describing a class that is gone — behind the dialog
  it was done in, and visible the moment that dialog closes. Repainted only when the class view is
  the thing on screen: from the home screen there is nothing to repaint, and painting a hidden
  screen is a hundred and fifty cells nobody is looking at.

  AND IT IS WHERE THE LAST CLASS GOING AWAY LANDS THE TEACHER SOMEWHERE. With no active class there
  is no working surface to be on — getSelectedClassId() answers '' — so the class grid is the only
  honest view, and it is also the one carrying the empty state that leads to a first class.
*/
function afterClassChange() {
  home.refreshHome();
  if (!classes.getSelectedClassId()) showHome();
  else if (views.isClassScreen(views.currentView())) paintClassScreen(views.currentView());
  /* AND THE STRIP THAT SAYS WHICH SCREEN OF IT (WO-3.3). Cheap enough to repaint when nothing
     changed — it is six elements — and the cost of leaving it out is a strip that survives a class
     going away, or one that is still empty on the first paint after boot. */
  screenNav.refreshScreenNav();
}

/*
  WHICH OF THE OPEN CLASS'S SCREENS IS PAINTED, and the one place that mapping lives (WO-3.3).

  A class has three screens now — Attendance, Assignments and, when WO-3.5 lands, Scores — and
  every caller above that used to say `attendance.renderAttendance()` was really saying "paint
  whatever screen of this class is up". Said once, here, because that is what this file is for: the
  day a fourth screen exists, the modules that navigate do not each learn about it.
*/
function paintClassScreen(view) {
  if (view === 'assignments') assignments.renderAssignments();
  else attendance.renderAttendance();
}

/*
  MOVING BETWEEN ONE CLASS'S SCREENS — the control WO-3.3 builds, and the whole of what a tap on
  the strip does.

  Four calls, in this order and for four different reasons. The view swaps. The class tab strip
  repaints because it is drawn differently on a class screen than on the grid (src/classes.js's
  refreshClassBar reads which view is up, and its `onClassView` is now "any screen of a class").
  The switcher repaints because the active segment is which screen is showing. Then the screen
  itself is painted, because a view that is shown and not drawn is the class before last.

  WHICH CLASS IS OPEN IS UNTOUCHED, and so is every preference: this moves between screens of the
  class already open, and `openView` deliberately writes down every one of them as `class` so that
  a reload lands on Attendance (src/views.js's REMEMBERED_AS, and the owner's decision at
  plans/gradebook-surfaces.md). Said out loud for the reason selectClass() is: this is a screen a
  screen-reader user cannot see move.
*/
function showClassScreen(name) {
  if (!classes.getSelectedClassId()) { showHome(); return; }
  const view = views.showView(views.isClassScreen(name) ? name : 'class');
  classes.refreshClassBar();
  screenNav.refreshScreenNav();
  paintClassScreen(view);
  const cls = classes.getSelectedClass();
  announce((screenNav.screenLabel(view) || 'That screen')
    + (cls ? ' for ' + cls.name : '') + '.');
}

/*
  A grading category changed, and the screen underneath the panel redrawn.

  ONE CALL, AND IT IS THE SAME FAILURE afterClassChange() DESCRIBES ONE VIEW FURTHER IN. The class
  manager's rows now carry the weights total (src/classes.js's classRow), and the categories editor
  opens on top of that manager — so a teacher who fixes 95% to 100% and closes the panel would be
  looking at a row still saying "weights 95%", which reads as the app not having taken her change.
  src/categories.js cannot make that call itself: it would have to import src/classes.js, and the
  import between those two already runs the other way.

  NOT afterClassChange(). Nothing here changes which classes exist, their order, or which one is
  open, so the cards and the class view have nothing to redraw — and afterClassChange() also
  decides where the teacher should be standing, which is not a thing typing a weight should do.
*/
function afterCategoryChange() {
  classes.refreshClassList();
  /* AND THE ASSIGNMENT LIST, WHEN THAT IS THE SCREEN BEHIND THE PANEL (WO-3.3). It is grouped by
     category, it prints each category's weight in a chip, and removing a category destroys the
     work filed under it — so a teacher who opens Categories from the assignment list and renames,
     reweights or removes one would otherwise close the panel onto a list describing the class as
     it was, with rows on it that no longer exist. Painted only when it is up, for the reason
     afterClassChange() gives: painting a hidden screen is rows nobody is looking at. */
  if (views.currentView() === 'assignments') assignments.renderAssignments();
}

/*
  THE WAY BACK TO THE CLASS GRID. Both doors — the "All classes" tab at the head of the class row
  and the button in the class view's own panel header — land here, because they are one route.

  Three calls and each one is a fact about a different part of the screen: the view swaps, the tab
  strip repaints because it takes the class tabs OFF on the home view and puts a caption there
  instead (src/classes.js's refreshClassBar reads which view is up, and says why at length), and the
  cards redraw because the state line on each of them is today's attendance and the teacher has
  probably just changed one.

  Said out loud for the same reason selectClass() is: this moves a screen a screen-reader user
  cannot see move.
*/
function showHome() {
  views.showView('home');
  classes.refreshClassBar();
  /* The screen switcher goes empty here rather than being hidden: the class grid is not a screen
     OF a class, so there is nothing for it to switch between — and an empty strip keeps the panel
     header the same height between views, where a hidden one would make it jump. */
  screenNav.refreshScreenNav();
  home.refreshHome();
  announce('Your classes.');
}

/*
  Today's attendance changed, and the card behind the dialog redrawn.

  THE SAME SHAPE AS afterClassChange() ABOVE, AND THE SAME COST OF FORGETTING. src/attendance.js
  repaints its own screen after every write and deliberately does not reach the home screen: that
  module is imported BY src/home.js, for the state predicate the card's line is made of, and the
  reverse import would close a loop this repo has refused three times already. So the second view
  is redrawn from here, which is where this app states the order things happen in.

  A tap that changes what happened to a class today adds its line here. Every one of them is a
  hook in the listener below, and the cost of missing one is a teacher who marks a class taken,
  closes the dialog, and finds the card behind it still saying "Not taken yet" — the exact
  question this whole work order exists to answer, answered wrong.
*/
function afterAttendanceChange() {
  home.refreshHome();
}

/*
  A calendar exception was added or removed, and everything that READS one redrawn.

  IT IS A THIRD CHAIN RATHER THAN A REUSE OF THE TWO ABOVE, and the difference is what each one
  knows. afterAttendanceChange() redraws the cards only, because the registry has already repainted
  its own column by the time it runs; afterClassChange() would also decide where the teacher should
  be standing, which is not a thing adding a holiday should do. An event changes what a whole WEEK
  of columns says about a class the teacher is looking at, and the paint that has to follow is the
  registry's, in full — a covered column has a different head, a different palette and inert cells,
  and none of that is one column's repaint.

  Both surfaces, every time, because an event is app-wide: the cards behind the dialog say what
  today is, and today is exactly the day a snow day added this morning is about.
*/
function afterCalendarChange() {
  home.refreshHome();
  if (views.currentView() === 'class') attendance.renderAttendance();
}

/* A restore replaces the whole document, so everything drawn from one is redrawn — the class bar
   and the term nav, the cards behind the dialog, and the teacher's name in the header, which is in
   the document rather than in this browser. Not the backup nag: src/backup.js re-evaluates that
   itself on the path that just wrote the file. */
function afterRestore() {
  classes.refreshClassBar();
  afterClassChange();
  teacher.refreshHeaderIdentity();
}

/*
  Presentation mode flipped, and everything on screen that could be holding support data redrawn
  behind it.

  THE REDRAW IS THE POINT, and it is the part of this feature that is easy to leave out and
  impossible to notice in a desk check. Suppression that only applies to the NEXT render leaves the
  roster the teacher is looking at full of indicator dots until something else happens to redraw
  it — and she flipped this switch precisely because she is about to plug in the projector, so the
  screen already in front of her is exactly the one that has to go quiet.

  Chained here rather than called from inside src/presentation.js, for the reason afterYearChange()
  above is: that module would then import src/roster.js, and shell.js is where this app states the
  order things happen in. A LATER SCREEN THAT CAN SHOW SUPPORT DATA ADDS ITS REDRAW TO THIS
  FUNCTION — and only its redraw. Whether it may show the data at all it already inherits, because
  it asks src/supports.js like everything else; this line is about what is on the glass right now.
*/
function flipPresentationMode() {
  presentation.togglePresentationMode();
  roster.refreshSupportSurfaces();
  /* The home screen is deliberately NOT in this list. Nothing on a class card comes out of a
     student's `supports` block — a class name and a colour are not a student's file — so there is
     nothing on it for the flip to suppress. src/home.js's header comment carries the same note and
     the condition under which it stops being true, because WO-4.x putting a behavior note into a
     card's signals slot is exactly how this list goes quietly out of date. */
}

/* One click listener for the whole document. Order matters only in that the first hook to
   match wins, and no element carries two of them. */
document.addEventListener('click', (e) => {
  /* The opener is handed to openModal rather than left for it to infer: Safari does not
     focus a button when you tap it, so document.activeElement here is <body>. Without
     this argument the modal has nowhere to give focus back to on the iPad. */
  const open = e.target.closest('[data-modal-open]');
  if (open) { openModal(open.getAttribute('data-modal-open'), open); return; }

  const close = e.target.closest('[data-modal-close]');
  if (close) {
    const overlay = close.closest('.modal-overlay');
    if (overlay) closeModal(overlay);
    return;
  }

  if (e.target.closest('[data-install-dismiss]')) { dismissInstallBanner(); return; }

  /* Both controls that carry this hook — the header button and the strip's "Turn it off" — flip
     the same switch, because the strip is only on screen while the mode is on and so its tap can
     only ever mean off. High in this listener rather than low: it is the control a teacher reaches
     for with a class already in the room. */
  if (e.target.closest('[data-presentation-toggle]')) { flipPresentationMode(); return; }

  const picker = e.target.closest('[data-year-picker]');
  if (picker) { openYearPicker(picker); return; }

  const yearRow = e.target.closest('[data-year-switch]');
  if (yearRow) {
    /* The nag is a fact about the open year (src/backup.js), so a year switch is one of the four
       moments its answer can change. Chained here rather than inside switchYear() because
       backup.js already imports year-picker.js for refreshYearButton, and the reverse import
       would close the loop. Refreshed whether or not the switch took: a refusal leaves the old
       year open, and re-asking about the year that is still open is the right answer anyway. */
    switchYear(yearRow.getAttribute('data-year-switch'))
      .then(afterYearChange, afterYearChange);
    return;
  }

  const backupPanel = e.target.closest('[data-backup-panel]');
  if (backupPanel) { backup.openBackupPanel(backupPanel); return; }

  if (e.target.closest('[data-backup-download]')) { backup.downloadBackup(); return; }
  /* Not awaited, like the one above it: it reports into the panel's own status line and disables
     its own control while it runs, and there is nothing here to chain onto the end of it —
     a backup writes a file and changes no screen but that panel. */
  if (e.target.closest('[data-backup-download-all]')) { backup.downloadAllBackups(); return; }
  if (e.target.closest('[data-backup-cancel]')) { backup.cancelRestore(); return; }
  if (e.target.closest('[data-backup-confirm]')) {
    /* A restore replaces the whole document, so the class bar and the term nav are describing a
       year that no longer exists the moment it lands. Chained here rather than called from inside
       backup.js for the reason the nag is chained onto a year switch above: backup.js would then
       import classes.js, classes.js imports the store, and the reverse import that would follow
       the first time a class needed the backup panel closes a loop this repo has already refused
       once. Refreshed whether or not the restore took — a refusal leaves the old document open,
       and re-describing the document that is still open is the right answer anyway. */
    backup.confirmRestore().then(afterRestore, afterRestore);
    return;
  }

  /* ── classes and terms ── */

  const classManage = e.target.closest('[data-class-manage]');
  if (classManage) { classes.openClassManager(classManage); return; }

  /* The way back to the class grid. High here, beside the control that leaves it: these two are
     the app's navigation, and everything below them is something you do once you have arrived. */
  if (e.target.closest('[data-view-home]')) { showHome(); return; }

  /*
    "WORK ON THIS CLASS NOW", and since WO-1.13 it is navigation: the preference moves, the main
    area swaps to that class's working surface, and the strip's active mark follows.

    Two controls carry it and they are never on screen at the same time — cards enter, tabs switch
    (src/classes.js's refreshClassBar, and the work order's own decision record). A card is what a
    teacher taps to go INTO a class from the grid; a header tab is what she taps to move from the
    class she is in to the next one, which the cards cannot do because they are not on screen then.
    One hook, one route, one implementation, because it is one act either way.

    Three calls, in this order and for three different reasons. selectClass() writes the preference,
    swaps the view and repaints the strip. resetRegistry() puts the marking screen back to today,
    unpaged and unfiltered, BEFORE it is painted — the class is walking through the door, and
    finding the screen where it was left an hour ago costs the seconds this design is about.
    afterClassChange() then paints: the cards behind, and the registry itself.
  */
  const classTab = e.target.closest('[data-class-tab]');
  if (classTab) {
    classes.selectClass(classTab.getAttribute('data-class-tab'));
    attendance.resetRegistry();
    afterClassChange();
    return;
  }

  /*
    "SHOW ME ANOTHER SCREEN OF THIS CLASS" (WO-3.3), directly under the control that opens one,
    because these two are the app's navigation and everything below them is something you do once
    you have arrived. The tab row above answers WHICH CLASS; this answers which screen of it.

    One hook for all three segments, and the strip is drawn on every class screen — so the same tap
    means the same thing whichever screen it is made from. A segment for a screen that does not
    exist yet is disabled in the markup src/screen-nav.js builds, so it never reaches this line.
  */
  const classScreen = e.target.closest('[data-class-screen]');
  if (classScreen) { showClassScreen(classScreen.getAttribute('data-class-screen')); return; }

  const rename = e.target.closest('[data-class-rename]');
  if (rename) { classes.startRename(rename.getAttribute('data-class-rename')); return; }
  if (e.target.closest('[data-class-rename-cancel]')) { classes.cancelRename(); return; }

  /* Each of the five below changes which classes are on the bar, or their order, so each redraws
     the second view as well — see afterClassChange(). Two lines apiece rather than this file's
     usual one, because the pair reads as one thing and a 110-character line hides the second
     half of it. */
  const moveUp = e.target.closest('[data-class-move-up]');
  if (moveUp) {
    classes.moveClassUp(moveUp.getAttribute('data-class-move-up')); afterClassChange(); return;
  }
  const moveDown = e.target.closest('[data-class-move-down]');
  if (moveDown) {
    classes.moveClassDown(moveDown.getAttribute('data-class-move-down')); afterClassChange(); return;
  }

  const archive = e.target.closest('[data-class-archive]');
  if (archive) {
    classes.archiveClass(archive.getAttribute('data-class-archive')); afterClassChange(); return;
  }
  const restore = e.target.closest('[data-class-restore]');
  if (restore) {
    classes.restoreClass(restore.getAttribute('data-class-restore')); afterClassChange(); return;
  }

  const del = e.target.closest('[data-class-delete]');
  if (del) { classes.openDeleteConfirm(del.getAttribute('data-class-delete'), del); return; }
  if (e.target.closest('[data-class-delete-confirm]')) {
    classes.confirmDelete(); afterClassChange(); return;
  }
  if (e.target.closest('[data-class-delete-cancel]')) { classes.cancelDelete(); return; }

  const termManage = e.target.closest('[data-term-manage]');
  if (termManage) {
    /* An empty value means "the class that is open", which is what the header's own button says
       and what the class row's button overrides with an id. */
    classes.openTermEditor(termManage.getAttribute('data-term-manage'), termManage);
    return;
  }
  const termSelect = e.target.closest('[data-term-select]');
  if (termSelect) {
    classes.selectTerm(termSelect.getAttribute('data-term-select'));
    /* AND THE SCREEN THE TERM NAV IS SITTING ON TOP OF (WO-3.3, correction round 1).
       classes.selectTerm() repaints the class bar and nothing else, which was right while the only
       class screen was the attendance registry — that screen is a window of dates and does not
       change when the term does. The assignment list is entirely term-filtered, headline included,
       so tapping Quarter 2 moved the chip in the header and left a table of Quarter 1's work
       underneath it, still captioned "Assignments · Quarter 1". Painted only when it is the screen
       up, for the reason afterCategoryChange() above gives.
       NOT paintClassScreen(): the registry has a term-totals line with a gap of its own shape and
       it is not this work order's to close — repainting attendance here would hide it rather than
       fix it. */
    if (views.currentView() === 'assignments') assignments.renderAssignments();
    return;
  }
  if (e.target.closest('[data-term-add]')) { classes.addTerm(); return; }
  const termRemove = e.target.closest('[data-term-remove]');
  if (termRemove) { classes.removeTerm(termRemove.getAttribute('data-term-remove')); return; }
  const termPreset = e.target.closest('[data-term-preset]');
  if (termPreset) { classes.applyPreset(termPreset.getAttribute('data-term-preset')); return; }

  /* ── grading categories & weights (WO-3.1) ──
     Directly under terms, because these are the same act: setting a class up. Every one of the six
     below chains afterCategoryChange(), including the two that may write nothing — a repaint of a
     five-row list that did not change costs a paint, and forgetting one on the path that DID write
     costs a teacher a row still reporting the total she has just fixed.

     The editor is opened with an id resolved HERE rather than inside src/categories.js: that module
     is deliberately a leaf (see the import at the top of this file), and "which class" is a
     question this file answers for every other module too. */
  const categoryManage = e.target.closest('[data-category-manage]');
  if (categoryManage) {
    categories.openCategoryEditor(categoryManage.getAttribute('data-category-manage')
      || classes.getSelectedClassId(), categoryManage);
    return;
  }
  if (e.target.closest('[data-category-add]')) {
    categories.addCategory(); afterCategoryChange(); return;
  }
  const categoryUp = e.target.closest('[data-category-move-up]');
  if (categoryUp) {
    categories.moveCategoryUp(categoryUp.getAttribute('data-category-move-up'));
    afterCategoryChange(); return;
  }
  const categoryDown = e.target.closest('[data-category-move-down]');
  if (categoryDown) {
    categories.moveCategoryDown(categoryDown.getAttribute('data-category-move-down'));
    afterCategoryChange(); return;
  }
  /* One hook for both halves of the removal, and the branch is in src/categories.js rather than
     here: whether a category holds assignments is a question about the document, and this file
     routes taps. The opener is passed for the case where it opens the confirm — src/modal.js needs
     somewhere to hand focus back to, and Safari does not focus a button when you tap it. */
  const categoryRemove = e.target.closest('[data-category-remove]');
  if (categoryRemove) {
    categories.removeCategory(categoryRemove.getAttribute('data-category-remove'), categoryRemove);
    afterCategoryChange(); return;
  }
  if (e.target.closest('[data-category-remove-confirm]')) {
    categories.confirmRemoveCategory(); afterCategoryChange(); return;
  }
  if (e.target.closest('[data-category-remove-cancel]')) {
    categories.cancelRemoveCategory(); return;
  }

  /* ── letter grades (WO-3.2) ──
     Directly under the categories, because these are the same act: setting the year up. Eight hooks
     and NOT ONE OF THEM CHAINS A REPAINT, which is a deliberate absence rather than a forgotten
     line. afterCategoryChange() exists because the class-manager row prints the weights total, so a
     panel over it leaves that row stale; nothing on any screen behind this panel says anything about
     the letter scale — no row badge, no card, no header — so there is nothing to redraw. The day a
     screen shows a letter (WO-3.5), it adds its line to a chain here, exactly as the categories did.

     The editor is opened with no class: the door is a document-level control, and a panel that
     remembered the class it was last on would open showing one class's bands to a teacher who asked
     about all of them. Which class the two override hooks act on comes off the button, because the
     subject row is rendered from the document and the id is already on it. */
  const scaleDoor = e.target.closest('[data-letter-scale]');
  if (scaleDoor) { letterScale.openLetterScaleEditor(scaleDoor); return; }
  const scaleSubject = e.target.closest('[data-scale-subject]');
  if (scaleSubject) {
    letterScale.selectScaleSubject(scaleSubject.getAttribute('data-scale-subject'));
    return;
  }
  const overrideOn = e.target.closest('[data-scale-override-on]');
  if (overrideOn) {
    letterScale.enableOverride(overrideOn.getAttribute('data-scale-override-on')); return;
  }
  const overrideOff = e.target.closest('[data-scale-override-off]');
  if (overrideOff) {
    letterScale.disableOverride(overrideOff.getAttribute('data-scale-override-off')); return;
  }
  if (e.target.closest('[data-band-add]')) { letterScale.addBand(); return; }
  const bandUp = e.target.closest('[data-band-move-up]');
  if (bandUp) { letterScale.moveBandUp(bandUp.getAttribute('data-band-move-up')); return; }
  const bandDown = e.target.closest('[data-band-move-down]');
  if (bandDown) { letterScale.moveBandDown(bandDown.getAttribute('data-band-move-down')); return; }
  const bandRemove = e.target.closest('[data-band-remove]');
  if (bandRemove) { letterScale.removeBand(bandRemove.getAttribute('data-band-remove')); return; }

  /* ── assignments (WO-3.3) ──
     Under the two setup panels because that is the order a class is built in: what it is graded
     on, what the letters mean, then the work itself. None of the eleven below chains
     afterClassChange() or afterCategoryChange() — nothing here changes which classes exist, their
     order, which one is open, or a category — and src/assignments.js repaints its own screen after
     every write, exactly as src/attendance.js does. The one thing behind this screen that could go
     stale is the class-manager row, and no hook here touches a class.

     The opener is passed to all four that open a dialog: src/modal.js needs somewhere to hand
     focus back to, and Safari does not focus a button when you tap it. */
  const assignmentNew = e.target.closest('[data-assignment-new]');
  if (assignmentNew) { assignments.createAssignment(assignmentNew); return; }
  const assignmentEdit = e.target.closest('[data-assignment-edit]');
  if (assignmentEdit) {
    assignments.openAssignmentEditor(assignmentEdit.getAttribute('data-assignment-edit'),
      assignmentEdit);
    return;
  }
  const assignmentUp = e.target.closest('[data-assignment-move-up]');
  if (assignmentUp) {
    assignments.moveAssignmentUp(assignmentUp.getAttribute('data-assignment-move-up')); return;
  }
  const assignmentDown = e.target.closest('[data-assignment-move-down]');
  if (assignmentDown) {
    assignments.moveAssignmentDown(assignmentDown.getAttribute('data-assignment-move-down')); return;
  }
  const assignmentCopy = e.target.closest('[data-assignment-duplicate]');
  if (assignmentCopy) {
    assignments.openCopyEditor(assignmentCopy.getAttribute('data-assignment-duplicate'),
      assignmentCopy);
    return;
  }
  const copyClass = e.target.closest('[data-assignment-copy-class]');
  if (copyClass) {
    assignments.setCopyClass(copyClass.getAttribute('data-assignment-copy-class')); return;
  }
  if (e.target.closest('[data-assignment-copy-confirm]')) { assignments.confirmCopy(); return; }
  if (e.target.closest('[data-assignment-copy-cancel]')) { assignments.cancelCopy(); return; }
  /* One hook and two doors — the row's own Delete and the Delete… inside the editor, which carries
     no value and means "the one this editor is open for". Two controls, one route, the same shape
     `data-view-home` and `data-term-manage` both take. */
  const assignmentDelete = e.target.closest('[data-assignment-delete]');
  if (assignmentDelete) {
    assignments.openAssignmentDelete(assignmentDelete.getAttribute('data-assignment-delete'),
      assignmentDelete);
    return;
  }
  if (e.target.closest('[data-assignment-delete-confirm]')) {
    assignments.confirmAssignmentDelete(); return;
  }
  if (e.target.closest('[data-assignment-delete-cancel]')) {
    assignments.cancelAssignmentDelete(); return;
  }

  /* ── days off & planned drops (WO-2.3) ──
     Above the attendance block because the panel is opened from a control ON the registry as well
     as from the home screen, and the two hooks must not be able to shadow each other. Nothing here
     writes an attendance record — that is the work order's fifth acceptance line, and the way it is
     kept true is that none of these six calls reaches a function in src/attendance.js that writes.

     The panel and the confirm are the only two paths that repaint, and both chain
     afterCalendarChange(): an event changes what a whole week of columns says, so it is the
     registry in full and the cards behind it, not one column. */
  const dayOffPanel = e.target.closest('[data-dayoff-panel]');
  if (dayOffPanel) { daysOff.openDaysOff(dayOffPanel); return; }
  const dayOffKind = e.target.closest('[data-dayoff-kind]');
  if (dayOffKind) { daysOff.setKind(dayOffKind.getAttribute('data-dayoff-kind')); return; }
  const dayOffClass = e.target.closest('[data-dayoff-class]');
  if (dayOffClass) { daysOff.toggleClass(dayOffClass.getAttribute('data-dayoff-class')); return; }
  if (e.target.closest('[data-dayoff-confirm]')) {
    daysOff.confirmCreate(); afterCalendarChange(); return;
  }
  if (e.target.closest('[data-dayoff-cancel]')) { daysOff.cancelCreate(); return; }
  const dayOffRemove = e.target.closest('[data-dayoff-remove]');
  if (dayOffRemove) {
    daysOff.removeDayOff(dayOffRemove.getAttribute('data-dayoff-remove'));
    afterCalendarChange(); return;
  }

  /* ── attendance ──
     High in this listener, above the roster and the teacher's details: these are the taps a
     teacher makes with a class walking through the door, and the five below her are taps she makes
     sitting down. Nothing here is awaited and nothing here confirms — src/attendance.js writes on
     the tap, src/store.js debounces the write, and the chip in the corner says so. */

  /* There is no [data-attendance-open] hook any more, and its absence is the deliverable rather
     than an omission. It meant "make this class the open one, then open the registry for it", which
     is what [data-class-tab] above means now that the registry is where a class opens TO — two
     hooks for one act, on two controls sitting on one card. WO-1.13 retired the second; src/home.js
     carries the reasoning, and the focus-return dance that used to live here went with the dialog
     that needed somewhere to hand focus back to. */

  /* A cell. The date comes off the element rather than out of a module variable, because a grid
     has six of them on screen at once and "which day did that tap land on" must not be a question
     two files can answer differently. src/attendance.js refuses a date it should not write. */
  const cell = e.target.closest('[data-attendance-cell]');
  if (cell) {
    attendance.cycleMark(cell.getAttribute('data-attendance-cell'),
      cell.getAttribute('data-attendance-date'));
    afterAttendanceChange();
    return;
  }

  /* Four class-level taps, each one line, each carrying the day it acts on and each redrawing the
     card behind the dialog. Two of them are the one-tap drop and its one-tap undo — offered both
     in the column head and in the action row above the grid, one hook, one writer; the other two
     are the pair that makes "taken with everyone present" a thing a teacher can say. */
  const take = e.target.closest('[data-attendance-take]');
  if (take) {
    attendance.takeClass(take.getAttribute('data-attendance-take'));
    afterAttendanceChange(); return;
  }
  const untake = e.target.closest('[data-attendance-untake]');
  if (untake) {
    attendance.untakeClass(untake.getAttribute('data-attendance-untake'));
    afterAttendanceChange(); return;
  }
  /* The two un-confirms (WO-2.10), and they are two rather than one because they act on different
     things: the class reset puts every student back to a question mark, and the row's own puts one
     back. Both change what the card behind says — a class whose students are all unconfirmed is a
     class with an absence for every one of them — so both chain the redraw. */
  const unconfirmAll = e.target.closest('[data-attendance-unconfirm-all]');
  if (unconfirmAll) {
    attendance.unconfirmAll(unconfirmAll.getAttribute('data-attendance-unconfirm-all'));
    afterAttendanceChange(); return;
  }
  const unconfirm = e.target.closest('[data-attendance-unconfirm]');
  if (unconfirm) {
    attendance.unconfirmStudent(unconfirm.getAttribute('data-attendance-unconfirm'));
    afterAttendanceChange(); return;
  }
  const drop = e.target.closest('[data-attendance-drop]');
  if (drop) {
    attendance.dropClass(drop.getAttribute('data-attendance-drop'));
    afterAttendanceChange(); return;
  }
  const undrop = e.target.closest('[data-attendance-undrop]');
  if (undrop) {
    attendance.undropClass(undrop.getAttribute('data-attendance-undrop'));
    afterAttendanceChange(); return;
  }

  /* And six taps that move the view without writing anything, so none of them touches the home
     screen: opening a row's detail panel, unlocking a past column, closing it again, paging the
     window, filtering, sorting. */
  const detail = e.target.closest('[data-attendance-detail]');
  if (detail) { attendance.toggleDetail(detail.getAttribute('data-attendance-detail')); return; }
  const editPast = e.target.closest('[data-attendance-edit]');
  if (editPast) { attendance.editPastDay(editPast.getAttribute('data-attendance-edit')); return; }
  if (e.target.closest('[data-attendance-lock]')) { attendance.lockPastDay(); return; }
  const page = e.target.closest('[data-attendance-page]');
  if (page) { attendance.pageDays(page.getAttribute('data-attendance-page')); return; }
  const attFilter = e.target.closest('[data-attendance-filter]');
  if (attFilter) { attendance.setFilter(attFilter.getAttribute('data-attendance-filter')); return; }
  const attSort = e.target.closest('[data-attendance-sort]');
  if (attSort) { attendance.setSort(attSort.getAttribute('data-attendance-sort')); return; }

  /* ── hall passes (WO-2.8, WO-2.11) ──
     Three taps, and NONE OF THEM CHAINS afterAttendanceChange(). That omission is the acceptance
     line: a pass creates no attendance record and moves no mark, so there is nothing behind this
     screen for it to redraw. A student at the bathroom was present. The one path where a pass and a
     mark move together is a `D`, and that goes through the cell hook above, which already redraws
     the card.

     Return is reached from two places — the row's own button and the banner card's — and they are
     one hook rather than two because they are one act. Cancel is reached from the card only: the
     160px Passes column has three targets in it already, and a fourth beside Return is how a thumb
     aiming at Return destroys a real trip's minutes (WO-2.11). */
  const passIssue = e.target.closest('[data-pass-issue]');
  if (passIssue) {
    attendance.issuePass(passIssue.getAttribute('data-pass-issue'),
      passIssue.getAttribute('data-pass-type'));
    return;
  }
  const passReturn = e.target.closest('[data-pass-return]');
  if (passReturn) { attendance.returnPass(passReturn.getAttribute('data-pass-return')); return; }
  const passCancel = e.target.closest('[data-pass-cancel]');
  if (passCancel) { attendance.cancelPass(passCancel.getAttribute('data-pass-cancel')); return; }

  /* ── roster, contacts, and the teacher's own details ── */

  const rosterManage = e.target.closest('[data-roster-manage]');
  if (rosterManage) { roster.openRoster(rosterManage); return; }

  const paste = e.target.closest('[data-roster-paste]');
  if (paste) { roster.openPaste(paste); return; }
  if (e.target.closest('[data-roster-preview]')) { roster.previewPaste(); return; }
  if (e.target.closest('[data-roster-paste-back]')) { roster.backToPasteEdit(); return; }
  if (e.target.closest('[data-roster-commit]')) { roster.commitPaste(); return; }
  if (e.target.closest('[data-paste-swap-all]')) { roster.swapAllPasteRows(); return; }

  const pasteInclude = e.target.closest('[data-paste-include]');
  if (pasteInclude) { roster.togglePasteRow(pasteInclude.getAttribute('data-paste-include')); return; }
  const pasteSwap = e.target.closest('[data-paste-swap]');
  if (pasteSwap) { roster.swapPasteRow(pasteSwap.getAttribute('data-paste-swap')); return; }

  const studentEdit = e.target.closest('[data-student-edit]');
  if (studentEdit) {
    roster.openStudentEditor(studentEdit.getAttribute('data-student-edit'), studentEdit);
    return;
  }
  const studentRemove = e.target.closest('[data-student-remove]');
  if (studentRemove) { roster.removeFromClass(studentRemove.getAttribute('data-student-remove')); return; }
  const studentAdd = e.target.closest('[data-student-add-to-class]');
  if (studentAdd) { roster.addToOpenClass(studentAdd.getAttribute('data-student-add-to-class')); return; }

  const studentDelete = e.target.closest('[data-student-delete]');
  if (studentDelete) {
    roster.openStudentDeleteConfirm(studentDelete.getAttribute('data-student-delete'), studentDelete);
    return;
  }
  if (e.target.closest('[data-student-delete-confirm]')) { roster.confirmStudentDelete(); return; }
  if (e.target.closest('[data-student-delete-cancel]')) { roster.cancelStudentDelete(); return; }

  const studentClass = e.target.closest('[data-student-class]');
  if (studentClass) { roster.toggleStudentClass(studentClass.getAttribute('data-student-class')); return; }

  if (e.target.closest('[data-guardian-add]')) { roster.addGuardian(); return; }
  const guardianRemove = e.target.closest('[data-guardian-remove]');
  if (guardianRemove) { roster.removeGuardian(guardianRemove.getAttribute('data-guardian-remove')); return; }
  const guardianPreferred = e.target.closest('[data-guardian-preferred]');
  if (guardianPreferred) {
    roster.setPreferredGuardian(guardianPreferred.getAttribute('data-guardian-preferred'));
    return;
  }

  /* ── support details ──
     The dot opens the editor the same way [data-student-edit] does and passes one extra argument:
     the tap on the dot is the deliberate one docs/data-model.md § Accommodations rule 1 asks for,
     so the panel inside arrives open. Every other route into that editor leaves it shut. */
  const supportsOpen = e.target.closest('[data-supports-open]');
  if (supportsOpen) {
    roster.openStudentEditor(supportsOpen.getAttribute('data-supports-open'), supportsOpen, true);
    return;
  }
  if (e.target.closest('[data-supports-reveal]')) { roster.toggleSupports(); return; }
  const supportPlan = e.target.closest('[data-support-plan]');
  if (supportPlan) { roster.setPlan(supportPlan.getAttribute('data-support-plan')); return; }
  if (e.target.closest('[data-accommodation-add]')) { roster.addAccommodation(); return; }
  const accommodationRemove = e.target.closest('[data-accommodation-remove]');
  if (accommodationRemove) {
    roster.removeAccommodation(accommodationRemove.getAttribute('data-accommodation-remove'));
    return;
  }

  const teacherPanel = e.target.closest('[data-teacher-panel]');
  if (teacherPanel) { teacher.openTeacherSettings(teacherPanel); return; }
  if (e.target.closest('[data-teacher-cc]')) { teacher.toggleDefaultCc(); return; }

  /* Filter pills are single-select within their group. `aria-pressed` moves with the class
     — a visually active pill that still reads "not pressed" is the standard way this
     component goes wrong. */
  const pill = e.target.closest('[data-pill-group] .pill');
  if (pill) {
    const group = pill.closest('[data-pill-group]');
    group.querySelectorAll('.pill').forEach((p) => {
      const on = (p === pill);
      p.classList.toggle('active', on);
      p.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
});

/* The one place a <form> is submitted, and the only listener here that is not `click`. A form
   rather than a button-with-a-keydown-handler because Enter-to-submit, the implicit
   association between the field and the button, and the fact that iPadOS shows a "go" key on
   the software keyboard all come free with it — and none of them come free without it. */
document.addEventListener('submit', (e) => {
  const form = e.target.closest('form');
  if (!form) return;
  /* Nothing in this app ever navigates: a submit that reloads the page would throw away the
     year document that is live in memory. Cancelled for every form here, before the routing
     below, so that a form added later cannot reload the page by being forgotten. */
  e.preventDefault();

  if (form.hasAttribute('data-year-create')) {
    /* A newly created year has never been backed up, so the strip's answer changes here too — and
       this is the path that produces the second year the per-year timestamps exist for. It is also
       an empty document, so the class bar is describing classes that are no longer there. */
    createYearFromForm().then(afterYearChange, afterYearChange);
    return;
  }
  if (form.hasAttribute('data-class-create')) {
    classes.createClassFromForm(); afterClassChange(); return;
  }
  if (form.hasAttribute('data-roster-create')) { roster.createStudentFromForm(); return; }
  /* A day off or a planned drop. It chains the repaint unconditionally even though this tap does
     not always write — it may raise the warning instead — because a repaint of two screens that did
     not change costs a paint, and forgetting one on the path that DID write costs a teacher a grid
     that still shows a week she has just cancelled. */
  if (form.hasAttribute('data-dayoff-create')) {
    daysOff.createFromForm(); afterCalendarChange(); return;
  }
  if (form.hasAttribute('data-class-rename-save')) {
    classes.saveRename(form.getAttribute('data-class-rename-save'));
    afterClassChange();
  }
});

/*
  ── THE REGISTRY'S KEYBOARD PATH (WO-2.5) ──

  The third document-level listener in this file, and the one with a term riding on it: since
  2026-08-08 the laptop is the device of record, so this is how a class of twenty-five to thirty
  gets marked while it walks in. `↓` picks up the first name, then one letter per student, and the
  selection moves down on its own — the hand never leaves the keys and the eyes never have to leave
  the room. src/attendance.js's markSelected() holds the model and what was lifted from Roll Call!
  to build it; this listener is only the routing, exactly as the click listener above is.

  NOTHING HERE DECIDES ANYTHING ABOUT ATTENDANCE. Every key lands in an exported writer in
  src/attendance.js, which is where the rules about what may be written live — a locked past column,
  a dropped day, a covered day and any date after today refuse a keystroke there, in the same
  guards that refuse a tap. That is the one-writer rule this app keeps, said in a second event type.

  FIVE GUARDS, AND EVERY ONE OF THEM IS A PLACE A STRAY LETTER WOULD LAND SOMEWHERE EXPENSIVE:

    - A MODIFIER HELD. Ctrl+A is select-all and Cmd+P is print; neither is "absent" or "present",
      and swallowing them would break the browser on the screen a teacher works on all day. Shift is
      not in the list: it is how `?` is typed, and Shift+A is still an A.
    - A DIALOG OPEN. Roll Call!'s own shortcut handler opens with this guard for the same reason
      (dashboard.html:3623) — the letters belong to whatever is on top, and a teacher typing into a
      confirm would otherwise be writing marks behind it.
    - FOCUS IN A FIELD. The search box sits two inches above the grid, and "Patel" is five marks.
      Covered by tag rather than by hook, because a field added later must not have to remember.
    - ANY VIEW BUT THE CLASS ONE. There is no grid to mark on the home screen.
    - THE KEY DID NOTHING. Every branch swallows the event only when its writer says it acted, so a
      letter that could not be used goes back to the browser rather than being eaten by a screen
      that ignored it — which is what type-ahead and every browser shortcut depend on.

  `Enter` IS DELIBERATELY NOT BOUND, and it is the one key Roll Call! has that this does not. Over
  there it means "skip to the next student" and is safe because focus is never on a control; here
  the selected cell IS focused, so binding Enter would fire the cell's own click AND move the row —
  one keystroke doing two things, one of which writes. `↓` already means skip, and it means it
  everywhere.
*/
const MARK_KEYS = ['P', 'T', 'A', 'E', 'D'];
const KEYS_MODAL = 'attendanceKeysModal';

document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (anyModalOpen()) return;
  if (views.currentView() !== 'class') return;
  const active = document.activeElement;
  const tag = active ? active.tagName : '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (active && active.isContentEditable) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (attendance.moveSelection(e.key === 'ArrowDown' ? 1 : -1)) e.preventDefault();
    return;
  }
  if (e.key === 'Escape') {
    if (attendance.clearSelection()) e.preventDefault();
    return;
  }
  /* The shortcut for the shortcut list, and the reason the ⌨ button beside the sort pair is not the
     only door: a teacher whose hand is already on the keys should not have to find a control with a
     mouse to be told which keys those are. The opener is passed so that closing gives focus back to
     the cell she was on — see src/modal.js, and the Safari note in its header. */
  if (e.key === '?') {
    openModal(KEYS_MODAL, active && active !== document.body ? active : null);
    e.preventDefault();
    return;
  }
  const code = String(e.key).toUpperCase();
  if (MARK_KEYS.indexOf(code) === -1) return;
  if (!attendance.markSelected(code)) return;
  e.preventDefault();
  /* The same chain a tap on a cell makes: the card behind this view carries today's state, and a
     letter changes it exactly as a finger does. */
  afterAttendanceChange();
});

/* Term labels and dates, saved as they are typed. `input` rather than `change`: `change` on a text
   field waits for a blur, so a teacher who types a term name and then taps a button elsewhere in
   the dialog is relying on the blur order to have saved it, and the header tab beside her would
   not follow along as she typed either. The store debounces the burst into one save
   (src/store.js) — which is exactly what the debounce is for. */
document.addEventListener('input', (e) => {
  const field = e.target.closest('[data-term-field]');
  if (field) { classes.editTermField(field); return; }

  /* A category's name or its weight, saved as it is typed and by the same debounce. The chain runs
     per keystroke on purpose: the total is what the teacher is watching while she types the number,
     and a running total that lags the field it is adding up is worse than no total. The row itself
     is not re-rendered — see src/categories.js, where replacing the input under the caret is the
     failure that rule exists for. */
  const categoryField = e.target.closest('[data-category-field]');
  if (categoryField) { categories.editCategoryField(categoryField); afterCategoryChange(); return; }

  /* A band's letter or its boundary, saved as it is typed and by the same debounce. No chain, for
     the reason the eight click hooks above have none: nothing behind that panel draws a letter yet.
     The rows are not re-rendered — src/letter-scale.js patches the derived range chips in place,
     because replacing the input under the caret is the failure that rule exists for. */
  const bandField = e.target.closest('[data-band-field]');
  if (bandField) { letterScale.editBandField(bandField); return; }

  /* An assignment's name, its points or one of its dates, saved as it is typed and by the same
     debounce. The list behind the dialog is redrawn per keystroke and the FIELD is not — see
     src/assignments.js, where replacing the input under the caret is the failure that rule exists
     for. `points` stores exactly what was typed, including 0, which is this app's extra-credit
     mechanism rather than a value to be caught (docs/data-model.md § Extra credit). */
  const assignmentField = e.target.closest('[data-assignment-field]');
  if (assignmentField) { assignments.editAssignmentField(assignmentField); return; }

  /* The copy's name, which writes NOTHING to the document: a duplicate is a proposal until the
     button that names the class it lands in. */
  const copyName = e.target.closest('[data-assignment-copy-name]');
  if (copyName) { assignments.setCopyName(copyName); return; }

  /* The registry's search box, which is the one hook on this listener that writes NOTHING — it
     narrows the rows on screen. It is here rather than on `keyup` for the reason the fields below
     are: `input` is the event that fires for a paste, for dictation, and for the software
     keyboard's own suggestions, and a search that misses those is a search that feels broken on
     the device this screen is for. */
  const attSearch = e.target.closest('[data-attendance-search]');
  if (attSearch) { attendance.setSearch(attSearch.value); return; }

  /* A note on one student's mark, from the row's detail panel (WO-2.10). It carries the date it
     belongs to on the element for the reason a cell does: the grid has six days on it, and "which
     day did that land on" must not be a question two files can answer differently. Nothing on this
     screen redraws for it — see src/attendance.js's setNote(), where re-rendering the row would
     take the caret out of the field being typed into. */
  const attNote = e.target.closest('[data-attendance-note]');
  if (attNote) {
    attendance.setNote(attNote.getAttribute('data-attendance-note'), attNote.value,
      attNote.getAttribute('data-attendance-note-date'));
    return;
  }

  /* A note on an open hall pass, from the banner card (WO-2.11). It carries no date, and that is
     the difference from the hook above rather than an omission: a mark belongs to one of six days
     on the grid, and a pass is happening now — there is exactly one open pass per student per class
     for it to land on. Nothing redraws for it either, and for the same reason: rebuilding the cards
     would take the caret out of the field being typed into. */
  const passNote = e.target.closest('[data-pass-note]');
  if (passNote) {
    attendance.setPassNote(passNote.getAttribute('data-pass-note'), passNote.value);
    return;
  }

  /* The roster's fields, saved as they are typed for the same reason and by the same debounce.
     Three hooks rather than one: a student's fields carry a path and a guardian index, the
     teacher's carry a field name, and a preview row is not in the document at all — it is a model
     this module hands back to src/roster.js, which is what lets a wrong split be corrected before
     anything is written. */
  const studentField = e.target.closest('[data-student-field]');
  if (studentField) { roster.editStudentField(studentField); return; }

  const pasteField = e.target.closest('[data-paste-field]');
  if (pasteField) { roster.editPasteField(pasteField); return; }

  const teacherField = e.target.closest('[data-teacher-field]');
  if (teacherField) teacher.editTeacherField(teacherField);
});

/* The file input. A `change` listener rather than a click one for the obvious reason, and
   delegated from the document for the same reason every other hook here is: the control lives
   inside a modal, and binding at load time means binding to markup that may be re-rendered. */
document.addEventListener('change', (e) => {
  const chooser = e.target.closest('[data-backup-file]');
  if (chooser) backup.handleChosenFile(chooser);
  /* A committed term date, which matters only when it was committed EMPTY — see
     classes.termDateCommitted(). This is the same element the `input` listener above already saved;
     the second hook exists because a cleared date on iPadOS needs its field rebuilt, and `input`
     fires with an empty value mid-typing where `change` does not. */
  const field = e.target.closest('[data-term-field]');
  if (field) classes.termDateCommitted(field);
  /* The review date, which is the same iPadOS quirk on a different field — roster.js's own comment
     points at the long version rather than repeating it. */
  const supportDate = e.target.closest('[data-support-date]');
  if (supportDate) roster.supportDateCommitted(supportDate);
  /* The days-off range. Third instance of the same quirk, and the only one that also does something
     on a NON-empty commit: picking a start date carries the end date along with it. Both halves are
     in days-off.js's dateCommitted() and neither writes to the document — this hook changes what is
     in a form, not what is in the year. */
  const dayOffDate = e.target.closest('[data-dayoff-date]');
  if (dayOffDate) daysOff.dateCommitted(dayOffDate);
  /* The accommodation kind picker, which is read HERE and not in the `input` listener above: a
     <select> commits on `change`, and hooking both would write the same value twice and move `rev`
     twice for one tap. It carries `data-support-kind` rather than `data-student-field` so that the
     other listener cannot see it at all. */
  const kind = e.target.closest('[data-support-kind]');
  if (kind) roster.editAccommodationKind(kind);
  /* An assignment's dates, which is the same iPadOS quirk on a fourth pair of fields —
     src/assignments.js points at the long version rather than repeating it. Same element the
     `input` listener above already saved; this hook exists for the cleared value. */
  const assignmentDate = e.target.closest('[data-assignment-field]');
  if (assignmentDate) assignments.assignmentDateCommitted(assignmentDate);
  /* Which category an assignment counts in, read HERE and not in the `input` listener above, for
     the reason `data-support-kind` is: a <select> commits on `change`, and hooking both would write
     the same value twice and move `rev` twice for one tap. It carries its own hook so that the
     other listener cannot see it at all. */
  const assignmentCategory = e.target.closest('[data-assignment-category]');
  if (assignmentCategory) assignments.setAssignmentCategory(assignmentCategory);
  /* The copy dialog's two pickers. Neither writes to the document — they move a proposal. */
  const copyTerm = e.target.closest('[data-assignment-copy-term]');
  if (copyTerm) assignments.setCopyTerm(copyTerm);
  const copyCategory = e.target.closest('[data-assignment-copy-category]');
  if (copyCategory) assignments.setCopyCategory(copyCategory);
});

/*
  Drag and drop for the restore target. Three listeners, and the reason they are on `document`
  rather than on the drop zone is not delegation this time — it is that a browser handed a file
  it was not offered NAVIGATES to it. A backup dropped an inch wide of the target would replace
  the running app with a page of raw JSON, taking the year document that is live in memory with
  it. So the default is cancelled everywhere on the page, and only the zone does anything with
  what was dropped.
*/
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  backup.setDropActive(!!(e.target.closest && e.target.closest('[data-backup-drop]')));
});
/* A dragleave with no relatedTarget is the pointer leaving the window entirely; every other one
   is the pointer crossing between children of the zone, where clearing the highlight would make
   it flicker. */
document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) backup.setDropActive(false); });
document.addEventListener('drop', (e) => {
  e.preventDefault();
  backup.setDropActive(false);
  const zone = e.target.closest && e.target.closest('[data-backup-drop]');
  if (!zone) return;
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) backup.handleDropped(file);
});

/* Boot. The loading screen is up from the first paint and comes down here, once the year
   document is out of IndexedDB and in memory — which is what it was put there for (WO-1.2
   left it hiding immediately, with a comment saying so). Hidden on DOMContentLoaded rather
   than on `load`: waiting for `load` waits for every image and font, and the shell has
   neither.

   A boot failure leaves the loading screen UP, and that is deliberate. Planbook without
   storage is an app that accepts grades and forgets them; showing the shell with an empty
   header would look like a working app with an empty gradebook, which is the worse of the
   two lies. The copy behind #loadingError says what to do about it — and since WO-1.5 it also
   carries the way out, because a screen with no exit is not a recovery path either. */
document.addEventListener('DOMContentLoaded', async () => {
  refreshInstallBanner();
  /* Before the store, and deliberately outside the try: presentation mode is a fact about this
     browser rather than about the year document, it is read from localStorage, and it has to be
     painted whether or not IndexedDB opens. This is also the whole of "it survives a reload and an
     app relaunch" — nothing else remembers, because the preference is the memory. */
  presentation.refreshPresentationChrome();
  try {
    await store.boot();
    refreshYearButton();
    /* At boot and after a backup or a restore, which is everywhere the answer can change —
       src/backup.js explains why it is not re-evaluated on every save. */
    backup.refreshBackupNag();
    /*
      WHICH VIEW WAS UP, BEFORE ANYTHING IS DRAWN FROM IT (WO-1.13). The preference is this
      browser's own (src/views.js), and restoring it is what makes "reloading with a class selected
      returns to that class's view" true — `openClassId` says which class, `openView` says whether
      she was looking at it.

      The one thing src/views.js cannot decide is decided here, because it would have to import
      src/classes.js to know it: a stored `class` on a document with no active class is a blank
      main area, so it falls back to the grid. This runs BEFORE refreshClassBar() because the
      strip's active mark is read off which view is up.

      AND IT IS ALWAYS `class` — Attendance — WHICHEVER SCREEN OF A CLASS WAS STORED (WO-3.3). The
      preference cannot hold `assignments` in the first place: src/views.js writes every class
      screen down as `class`, so nothing can be sitting there to restore. Asking isClassScreen()
      rather than comparing to `class` is the belt to those braces, and it is what makes the owner's
      rule survive a document restored from a browser that stored something else — a class opens on
      Attendance every time, including after a reload.
    */
    views.showView(views.isClassScreen(views.savedView()) && classes.getSelectedClassId()
      ? 'class' : 'home');
    /* The class bar and the term nav, drawn from the document that just came out of IndexedDB.
       Boot is the only place they are drawn from outside src/classes.js and the two chains above:
       every other change to a class is made inside that module, which redraws its own header. */
    classes.refreshClassBar();
    /* The home screen and — if that is where this browser left off — the open class's working
       surface, from the same document and the same open-class preference the bar just resolved, so
       nothing on the first paint can disagree about which class is open. Boot is the only place any
       of the three is drawn from outside the chains above. */
    attendance.resetRegistry();
    afterClassChange();
    /* And whose planbook this is. It comes out of the year document rather than out of this
       browser's preferences (src/teacher.js), so it is read here rather than beside presentation
       mode above. */
    teacher.refreshHeaderIdentity();
    document.getElementById('loadingScreen').classList.add('hidden');
  } catch (e) {
    showBootFailure(e);
  }
});

function showBootFailure(e) {
  console.error('Planbook: the year document could not be opened, so the app did not start. '
    + 'Cause:', e);
  const spinner = document.querySelector('#loadingScreen .spinner');
  const status = document.getElementById('loadingStatus');
  const box = document.getElementById('loadingError');
  const detail = document.getElementById('loadingErrorDetail');
  if (spinner) spinner.classList.add('hidden');
  if (status) status.classList.add('hidden');
  if (box) box.classList.remove('hidden');
  /* The store's own message, minus the `store:` prefix that is for the console. It names the
     year and the reason, which is the difference between a teacher who can say what happened
     and one who can only say it didn't work. */
  if (detail) detail.textContent = String(e && e.message ? e.message : e).replace(/^store:\s*/, '');
  announce('Planbook could not open its storage on this device and has not started.');
}

/* The service worker, which is what makes an installed Planbook open with the network off.
   Three things about the few lines below:

     - It registers from here rather than from a <script> in index.html so that the load order
       stays stated in one file, and it is deliberately NOT in install-banner.js: caching the
       shell and nagging about the home screen are two concerns that happen to share a reason.
     - './sw.js' resolves against the document, not against this module, which is exactly what
       is wanted — a worker's scope is its own directory, so sw.js has to sit at the root to
       control the pages above src/ (src/README.md).
     - Registration is deferred to `load`. Fetching and precaching the whole shell competes
       with the first paint otherwise, and on an iPad that is the difference a teacher feels
       when she opens the app as the bell rings.

   A failure here is logged and swallowed: no service worker means no offline, which is bad,
   but it must never be the reason the app does not start. `file://` is the usual cause, and
   the message says so because that is the mistake every local run makes once. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => {
      console.error('Planbook: the service worker did not register, so the app will not work '
        + 'offline. A service worker cannot register from file:// — serve the folder over '
        + 'http instead. Cause: ' + e.message);
    });
  });
}

/*
  A READ SEAM FOR tools/verify-shell.mjs, and the one decision on this page that reversed a
  standing plan — so it is written out at length rather than left as a surprise.

  WO-1.2 put this here as a console seam, because that build had no store and the five save states
  and the live region were reachable no other way. Every comment on it, in this file and in
  plans/verification-tooling.md, said it would go when the component shelf went. WO-1.10 removed the
  shelf and KEPT this, deliberately.

  WHY. What accumulated on it between WO-1.4 and WO-1.9 is not a set of buttons with no home — it is
  the way the harness READS the app's own answers: which class and which term are open, what a
  document holds after six classes were created through the real form, what src/supports.js answers
  about visibility, what came back out of IndexedDB after a reload. Every acceptance line is
  still DRIVEN through the controls a teacher touches; this is only how the result is inspected.
  Delete it and the harness needs its own copy of "resolve the stored id against the document", its
  own parser, and its own copy of the visibility rule — where each one could agree with itself
  perfectly and disagree with the app, which is the exact failure every one of these entries exists
  to prevent. Roughly three quarters of a 200-check run reads through here. The alternative
  was not a smaller seam, it was a suite of announced SKIPs, which
  plans/verification-tooling.md calls out by name: a run that is mostly skips proves nothing.

  WHAT WENT INSTEAD: the entries whose only caller was the shelf. showSaveState and demoSaveCycle
  are gone from here and demoSaveCycle is gone from src/save-indicator.js — src/store.js paints the
  chip on every real write now, and the harness reads #saveIndicator off the page.

  THE RULE THAT HAS NOT CHANGED, and it is the one that matters: nothing in the app may read
  `window.planbook`. It is a one-way window for a tool, not a bus. A module that needs another
  module imports it, and the day something in src/ reaches for this object the seam has become
  architecture and should be deleted instead.

  getPref/setPref have a second reason to be here: setPref refusing an undeclared key IS the check
  behind "no planbook_ key holds anything but a UI preference", and nothing on screen can be made to
  attempt an undeclared write.
*/
window.planbook = {
  announce, openModal, closeModal, getPref, setPref, store,
  /* `backup` is here for a reason the others are not: a page cannot be handed a real file by a
     script, so no harness can put one through the file input or the drop target. Everything
     after the read is the same code either way, and backup.restoreFromText() is that seam —
     tools/verify-shell.mjs drives the round trip, the refusals and the confirm through it. The
     real file paths stay owed to a human on an iPad. */
  backup,
  /* `classes` joined at WO-1.6, and unlike the others it is NOT here because the feature is
     unreachable — every control it owns is on the page and a teacher can touch all of them. It is
     here so tools/verify-shell.mjs can READ the answers: which class and which term are open, what
     a term id looks like, and what a document holds after six classes have been created through
     the form. The acceptance lines are driven by clicking the real controls; this is how the
     result is inspected without a second copy of the resolution logic in the harness. Nothing in
     the app reads window.planbook — see the block above for why the seam outlived the shelf. */
  classes,
  /* `categories` joined at WO-3.1, and for the reading reason `classes` gives rather than a driving
     one: every control this feature has is a button or a field in #categoriesModal and a teacher
     can touch all of them. What no click can show is the pair of claims WO-3.4 and WO-3.5 will be
     built on — what weightTotal() makes of a set of weights, and whether isProvisional() agrees
     with the banner on screen. Asking the module is the only way to tell a build where the banner
     is computed from the exported arithmetic from one where the banner does its own sum and the
     export is decorative, and a harness carrying its own copy of that sum could agree with itself
     and disagree with the app. Nothing in the app reads window.planbook — see the block above for
     why the seam outlived the shelf. */
  categories,
  /* `letterScale` joined at WO-3.2, and for the reading reason `categories` gives rather than a
     driving one: every control this feature has is a pill, a field or a button in #letterScaleModal
     and a teacher can touch all of them. What no click can show is the work order's first acceptance
     line — that a boundary of 89.5 makes 89.5 an A and 89.49 the band below — because nothing in
     this app displays a grade yet, and building a preview over student data to demonstrate it is
     what WO-3.2 forbids. So tools/verify-shell.mjs types the boundary through the real field and
     then asks letterFor() and scaleFaults(), which is the only way to tell a build where the ranges
     on screen come from the exported mapping from one where the panel does its own arithmetic and
     the export WO-3.4 will import says something else. Nothing in the app reads window.planbook —
     see the block above for why the seam outlived the shelf. */
  letterScale,
  /* `assignments` and `screenNav` joined at WO-3.3, and for the reading reason `classes` gives
     rather than a driving one: every control either feature has is a button, a field or a segment
     on a real screen, and a teacher can touch all of them. Two things no click can show. The first
     is what a DUPLICATE actually wrote — that the copy carries the target class's own ids and that
     `scores` grew no column for it — which is the difference between this build and the naive one
     that carried the source's `categoryId` across a class boundary, and it is invisible on screen
     because both look identical on the list. The second is the breadcrumb rule: WO-3.7 owns the
     per-student detail, so there is no screen today from which a name can be set and then left, and
     setDetailBreadcrumb() through this seam is the only way to ask whether a name set with no
     detail open stays off the strip. Nothing in the app reads window.planbook — see the block above
     for why the seam outlived the shelf. */
  assignments, screenNav,
  /* `roster` joined at WO-1.7, for the same reason `classes` did and with one addition. The
     acceptance lines are driven by typing into the real paste box and clicking the real controls;
     this is how the result is READ — what the document holds, how a line was split — without a
     second copy of the parser living in the harness where it could agree with itself and disagree
     with the app. parseRosterLine() is exported for that reason and for no other: nothing in the
     app calls it from outside src/roster.js. */
  roster,
  /* `attendance` joined at WO-2.1, and like `classes` it is NOT here because the feature is
     unreachable — every control it owns is on the page and a teacher can touch all of them. It is
     here so tools/verify-shell.mjs can READ the answers: what the document holds after a class has
     been marked, what stateOf() calls a class that has no record, and what today's date is
     according to the app rather than according to the harness. The acceptance lines are driven by
     tapping the real buttons; this is how the result is inspected without a second copy of "is
     this class taken" living in the harness, where it could agree with itself and disagree with
     the app — which is the exact failure the three states exist to prevent. Nothing in the app
     reads window.planbook — see the block above for why the seam outlived the shelf. */
  attendance,
  /* `passes` joined at WO-2.8, and for the reading reason `attendance` gives rather than for a
     driving one: both pass controls are buttons on the registry and a teacher can touch all of
     them. What no click can show is the half this work order is about — whether an open pass is in
     the DOCUMENT or only in a module variable — so tools/verify-shell.mjs reads openPassesIn() and
     passesIn() straight off a document it reloaded, which is the only way to tell the shipped build
     from the one that copied Roll Call!'s `activePasses`. Nothing in the app reads window.planbook
     — see the block above for why the seam outlived the shelf. */
  passes,
  /* `calendar` joined at WO-2.3, and for the reading reason `attendance` gives. Every control the
     feature has is on a screen and a teacher can touch all of them; what no click can show is the
     claim the work order actually makes, which is about what is NOT in the document. "Authoring an
     event creates no attendance record" is answered by reading `events` and `attendance` off a
     document that was reloaded, and "delete the holiday and every class follows" is answered by
     asking coveringEvent() what covers a date after the row is gone — neither of which a harness
     can ask without a second copy of the covering rule, where it could agree with itself and
     disagree with the app. Nothing in the app reads window.planbook — see the block above for why
     the seam outlived the shelf. */
  calendar,
  /* `supports` joined at WO-1.8, and it is the one entry here whose reason is an ACCEPTANCE line
     rather than a convenience. The work order's claim is that support data is discreet by default
     and that one function decides it — so tools/verify-shell.mjs has to be able to ask that
     function what it answers, and to read a student's block back out of the document to prove a
     round trip, without keeping a second copy of either in the harness where it could agree with
     itself and disagree with the app. Nothing in the app reads window.planbook — see the
     block above for why the seam outlived the shelf. */
  supports,
  /* `presentation` joined at WO-1.9, and like `classes` it is NOT here because the feature is
     unreachable — the toggle is a button in the header a teacher can touch. It is here so
     tools/verify-shell.mjs can READ the mode without a second copy of the preference name in the
     harness, and can put it back afterwards: the acceptance lines are driven by clicking the real
     control, and a run that left the browser in presentation mode would quietly suppress the
     fixtures of every check after it. Nothing in the app reads window.planbook — see the
     block above for why the seam outlived the shelf. */
  presentation,
  /* isInstalled() is here for one reason: the banner's whole behavior turns on it, and on a
     desktop there is no way to ask the question except by installing. */
  isInstalled, refreshInstallBanner,
};
