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
      data-modal-open="<overlayId>"   opens that overlay. `aboutModal` is the one exception and it
                                      is handled in the listener rather than here: its last line is
                                      written from Cache Storage before the panel is shown (WO-8.10)
      data-modal-close                closes the overlay it sits inside
      data-pill-group                 on a container: its .pill children single-select
      data-install-dismiss            snoozes the install banner
      data-presentation-toggle        turns presentation mode on or off — on the header button and
                                      on the strip's own "Turn it off", which are the same flip
      data-sounds-toggle              silences the overdue-pass tone, or lets it sound again
                                      (WO-2.29). One control, in the header beside the switch above,
                                      because a teacher about to proctor a test needs it in one tap
                                      mid-period. It silences the TONE only: the announcement and the
                                      card colour are not a preference and are never taken away
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
      data-assignment-create-cancel   removes the assignment written by that still-open create flow
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
      data-accommodation-prompt       on a container inside the assignment editor: the host
                                      src/accommodation-prompt.js paints the summary into. Markup,
                                      never a click target
      data-accommodation-names        the one control in that prompt; shows or hides WHICH students
                                      the counts are about. Refused while presentation mode is on,
                                      by the module rather than here — this file states no part of
                                      that rule (src/supports.js owns all of it)
      data-score-cell="<assignmentId>" + data-score-student="<id>": ONE SCORE. It is four hooks in one
                                      element, which nothing else in this file is: an input that saves
                                      as it is typed, a keydown target (Enter down the column, L M X
                                      for the flags, ⌫ on an empty cell to clear it), and a focusin
                                      target so the flag bar knows which cell it is pointed at. An
                                      empty field with no flag DELETES the key rather than storing a
                                      null — blank means ungraded (docs/data-model.md)
      data-score-flag="late|missing|excused|clear"  the flag bar; marks the cell the teacher is in and
                                      hands focus back to it. It exists because a decimal keypad has
                                      no letters on it, so the keyboard path above is unreachable on
                                      an iPad
      data-scores-keys                shows or hides the key legend on the score grid. Remembered
                                      nowhere — it is a disclosure, not a preference
      data-past-due                   not a control: the empty host each screen carries for the
                                      past-due prompt, painted by src/past-due.js. Two of them, on
                                      the score grid and on the assignment list
      data-past-due-review            shows or hides the list of blanks the prompt is about, inline
                                      under it. A disclosure and not a preference, like the key
                                      legend above; and inline rather than a dialog because the
                                      score grid has no dialog in it by acceptance line
      data-past-due-accept            writes `{ v: null, flag: "missing" }` to exactly the cells the
                                      review listed, in one update, and redraws the screen under it.
                                      THE ONLY PLACE IN THIS APP A FLAG IS WRITTEN ONTO A CELL THE
                                      TEACHER DID NOT POINT AT — it is a suggestion she accepted,
                                      and nothing infers it from a date (docs/data-model.md)
      data-past-due-dismiss           "Not now". Writes no cell and moves no grade; it records the
                                      assignment id in `planbook_pastDueDismissed` so the prompt
                                      stops asking about that work on this browser
      data-grades-record              opens the class's grade sheet for the open term — the print
                                      surface and the CSV, one dialog, built from the document at
                                      open time. Students down the page by last name, assignments
                                      across by DUE DATE, which is the order the SIS is typed in
      data-grades-record-print        prints that sheet. Like the detail button below, it only ASKS:
                                      `data-grades-print` — the attribute src/scores.css's @media
                                      print block is selected under — is answered by
                                      src/print-gate.js at `beforeprint` and taken off by nothing
                                      here. The hook and the gate are different strings, which this
                                      one had by accident and the one below now has on purpose
      data-grades-record-csv          downloads the same sheet as a CSV
      data-student-detail="<id>"      opens that student's grade detail — the category breakdown,
                                      what is missing, and what it would take to move. Carried by
                                      the student's own NAME in the score grid and by the door in
                                      their attendance history, because that screen owns no
                                      navigation target of its own: you arrive there from a name and
                                      never from the switcher, which is why there is no
                                      `data-class-screen="detail"` anywhere in this app
      data-detail-sheet-print         prints the detail screen. It ASKS to print and nothing more:
                                      src/print-gate.js answers `data-detail-print` on <body> — the
                                      attribute src/detail.css's @media print block is selected
                                      under — from a `beforeprint` listener, at the moment the
                                      browser serialises the page, and no timer takes it off.
                                      THE `-sheet-` IS LOAD-BEARING and this line is where it is
                                      written down: `closest()` walks up to <body>, so a hook named
                                      for the gate matches EVERY click on screen for as long as the
                                      gate is on — and a print the teacher blocks leaves it on by
                                      design. The button was `data-detail-print` until 2026-08-13
                                      and every click re-opened the print dialog. A gate attribute
                                      and a click hook never share a string; the other two print
                                      surfaces have that only by luck of naming (WO-2.25)
      data-detail-csv                 downloads that one student's detail as a CSV
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
      data-attendance-history="<id>"  opens that student's own attendance report — every mark they
                                      have in the open term, and since WO-2.26 their hall-pass count
                                      for it. Carried by the name in the registry row
      data-attendance-record          opens the class's attendance record for the open term: the
                                      printed page and the CSV, one dialog, built at open time
      data-attendance-record-print    prints that record. Like the two other print doors it only
                                      ASKS — src/print-gate.js answers `data-attendance-print` on
                                      <body> at `beforeprint`, and the hook and the gate are
                                      different strings, which this pair has by luck of naming
                                      rather than on purpose (WO-2.25)
      data-attendance-record-csv      downloads the same record as a CSV
                                      (These four reach src/attendance-report.js rather than
                                      src/attendance.js, for the reason that module's header gives:
                                      they are read-only surfaces over the same ledger, and nothing
                                      about a printed page belongs in the flow that runs while
                                      students walk in)
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
      data-pass-history               the 🚪 door in the registry's toolbar: the class's whole pass
                                      log, year-wide, one row per student (WO-2.9)
      data-pass-history-student="<id>"  one student's trips inside that dialog. In presentation mode
                                      that view is REFUSED outright rather than drawn with the name
                                      blanked, which src/pass-history.js argues at the point it
                                      does it
      data-pass-history-all           the way back from that student to the whole class. Three taps
                                      onto one dialog, all reaching src/pass-history.js, and none of
                                      them chains anything: opening a dialog over the registry
                                      changes nothing behind it
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
import * as gradeEngine from './grade-engine.js';
/* WO-3.2. Its own module for the reason src/teacher.js declines to host it — a setting about the
   gradebook rather than about the teacher — and a leaf like categories.js: it imports the store, the
   modal system and the live region, and nothing imports it back. */
import * as letterScale from './letter-scale.js';
import * as home from './home.js';
import * as attendance from './attendance.js';
/* WO-2.6's two read-only surfaces — a student's history, and the class's record as a printed page
   and a CSV. Its own module for the reason src/days-off.js is one: the registry is the flow that
   runs while students walk in, and neither of these is opened standing up. It imports the ledger
   from src/attendance.js one way and never writes through it. */
import * as attendanceReport from './attendance-report.js';
/* Imported here for the seam at the foot of this file and for nothing else — every control a hall
   pass has is on the registry, and src/attendance.js is what drives them. */
import * as passes from './passes.js';
/* WO-2.9's read-back of that log, and its own module for the reason attendanceReport above is one —
   plus a second that belongs to it alone: this is the surface that hides names in presentation
   mode, so it asks src/supports.js, which that module's header promises never to do. */
import * as passHistory from './pass-history.js';
/* WO-2.3's two halves, and they are two modules for the reason src/passes.js and
   src/attendance.js are: src/calendar.js is the MODEL — no DOM, no clock, no store — and
   src/days-off.js is the only screen that writes one. The registry reads the first and never the
   second, which is what keeps "is this class meeting" a question with one answer. */
import * as calendar from './calendar.js';
import * as daysOff from './days-off.js';
import * as roster from './roster.js';
import * as supports from './supports.js';
import * as presentation from './presentation.js';
/* WO-2.29's overdue-pass tone, its iOS unlock and the header switch that silences it. Imported here
   for the control and the boot paint only: src/attendance.js imports the module directly for the
   one thing it wants from it, which is a tone at a level. A leaf — it imports src/prefs.js and
   src/live-region.js and nothing imports it back except src/attendance.js. */
import * as alertSound from './alert-sound.js';
import * as teacher from './teacher.js';
import * as views from './views.js';
/* WO-3.3, and two modules rather than one because they are two different things. src/screen-nav.js
   is the strip that switches between one class's screens — a leaf that imports src/views.js and
   nothing else, drawn on every class screen and belonging to none of them; src/assignments.js is
   one of those screens. The order below is the order they are wired: the switcher moves the view,
   this file paints whatever the switch landed on. */
import * as screenNav from './screen-nav.js';
import * as assignments from './assignments.js';
/* WO-3.8's prompt, imported here for one control and one redraw — the tap that shows which students
   the counts are about, and the flip below that takes the whole prompt off the glass. It is a leaf:
   it imports src/supports.js, src/roster.js and src/store.js and nothing imports it back except
   src/assignments.js, which paints it. */
import * as accommodationPrompt from './accommodation-prompt.js';
/* WO-3.5's score grid — the third screen of an open class, and the first thing in this app that
   draws a grade. It imports src/grade-engine.js and nothing in it computes one; the chains below are
   what make "live" true from more than one direction. */
import * as scores from './scores.js';
/* WO-3.6's past-due prompt — the banner both of those two screens wear, and the one module in this
   app that reads a due date and offers to act on it. It is imported here for one hook only: accept
   writes score cells, and the screen standing under the banner has to be redrawn afterwards. That
   module imports neither screen — it paints its own hosts and answers whether it wrote — so the
   chain lives here, where every other "what has to be redrawn now" answer in this file lives. */
import * as pastDue from './past-due.js';
/* WO-3.7's per-student detail — the fourth screen of an open class, and the only one with no
   segment on the switcher: it is reached from a NAME, on the score grid or in a student's
   attendance history, and the strip shows that name as a breadcrumb while it is up. It imports the
   grade engine, the attendance readers and src/backup.js's file hand-off, and nothing imports it
   back. */
import * as detail from './detail.js';
/* WO-3.9's class grade sheet — the term as a page that prints and a file that opens in a
   spreadsheet, one dialog over the score grid. Its own module for the reason
   src/attendance-report.js is one beside src/attendance.js: the grid is the flow a teacher types
   in, and nothing about a printed sheet belongs in it. It reads the grade engine, the score grid's
   own order and cell reader, and src/backup.js's file hand-off; nothing imports it back. */
import * as gradesReport from './grades-report.js';

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

  A class has four screens — Attendance, Assignments, Scores since WO-3.5, and one student's detail
  since WO-3.7 — and every caller above that used to say `attendance.renderAttendance()` was really
  saying "paint whatever screen of this class is up". Said once, here, because that is what this
  file is for: the day a fourth screen exists, the modules that navigate do not each learn about it.
  That day was WO-3.7 and this function is the only thing that changed for it.
*/
function paintClassScreen(view) {
  if (view === 'assignments') assignments.renderAssignments();
  else if (view === 'scores') scores.renderScores();
  else if (view === 'detail') detail.renderDetail();
  else attendance.renderAttendance();
}

/*
  OPENING ONE STUDENT'S DETAIL — the whole of what a tap on a name means (WO-3.7).

  Six calls, in this order and each for its own reason. The module is told whose screen this is,
  which is also what sets the breadcrumb (src/detail.js says why those two are one act). The view
  swaps. The class tab strip repaints, because it is drawn differently inside a class than on the
  grid and `detail` is inside a class (src/views.js's CLASS_SCREENS). The screen is painted BEFORE
  the switcher, and that ordering is the one thing here that is not arbitrary: renderDetail() re-sets
  the breadcrumb from what it actually drew, so a student who is no longer on this class's roster
  takes their name off the strip in the same pass — repaint the strip first and it would carry a name
  the screen below it does not.

  WHICH CLASS AND WHICH TERM ARE UNTOUCHED. This moves between screens of the class already open,
  and `openView` writes this one down as `class` like the other three, so a reload lands on
  Attendance (src/views.js's REMEMBERED_AS).

  FOCUS MOVES, WHICH NO OTHER SCREEN SWITCH IN THIS FILE DOES, and the reason is the door in the
  attendance history dialog: closing a modal hands focus back to whatever opened it, and what opened
  that one is a button on the registry that is `.hidden` by the time the hand-off happens — so focus
  would land on <body> and a keyboard user would be at the top of the document with no idea the
  screen had moved. The heading carries `tabindex="-1"` for it. Said out loud as well, for the
  reason selectClass() is: this is a screen a screen-reader user cannot see move.
*/
function showStudentDetail(studentId, opener) {
  if (!classes.getSelectedClassId()) { showHome(); return; }
  /* The dialog the door was in, if it was in one. Closed BEFORE the view swaps so the modal's own
     focus return happens while its opener is still on screen; the heading below then takes focus
     from wherever that left it. */
  const overlay = opener && opener.closest ? opener.closest('.modal-overlay') : null;
  if (overlay) closeModal(overlay);

  detail.openDetail(studentId);
  views.showView('detail');
  classes.refreshClassBar();
  detail.renderDetail();
  screenNav.refreshScreenNav();

  const heading = document.getElementById('detailStudentName');
  if (heading && typeof heading.focus === 'function') heading.focus({ preventScroll: true });
  const who = detail.openDetailName();
  const cls = classes.getSelectedClass();
  announce(who
    ? 'Grade detail for ' + who + (cls ? ' in ' + cls.name : '') + '.'
    : 'That student is not on this class’s roster any more.');
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
  /*
    AND THE SCORE GRID, WHICH IS WHERE THIS CHAIN STOPS BEING COSMETIC (WO-3.5). The assignment list
    goes stale in WORDS — a chip that still says 25%. The grid goes stale in NUMBERS: every grade in
    its frozen column is a weighted average over these weights, and the banner above it says whether
    there is a grade at all. So a teacher who opens Categories from this screen, walks the total from
    95 to 100 and back, is looking at both halves of WO-3.5's last acceptance line — the grades appear
    when the weights reach 100 and disappear when they leave it — and both halves happen behind the
    panel as she types, because this chain runs on the keystroke that changes the weight.

    renderScores() rather than paintDerived(): a category REMOVAL destroys the assignments filed under
    it, which is whole columns rather than figures, and the narrower paint would leave a column of live
    inputs for work that no longer exists.
  */
  if (views.currentView() === 'scores') scores.renderScores();
  /* AND THE PER-STUDENT DETAIL (WO-3.7), the third screen a category is drawn on and the one where
     it is drawn as a ROW OF ARITHMETIC: one line per category, with its weight, what that weight
     actually counts at once the empty ones have redistributed, and what it contributes. Renaming a
     category behind this screen leaves a row labelled with the name before last; reweighting or
     removing one leaves a column that no longer adds up to the number in the hero an inch above it,
     which is this work order's first acceptance line going quietly false on a screen a guardian is
     reading. */
  if (views.currentView() === 'detail') detail.renderDetail();
}

/*
  AN ASSIGNMENT CHANGED, AND THE SCREEN WHOSE COLUMNS ARE ASSIGNMENTS REDRAWN (WO-3.5).

  THE SHAPE IS afterCategoryChange()'s, ONE FEATURE OVER, and so is the failure. The assignment list
  repaints itself after every write — src/assignments.js ends every mutation with renderAssignments(),
  which is why the eleven hooks below it chain nothing — and that was the whole story while it was the
  only screen an assignment was drawn on. The score grid is the second one, and on it an assignment is
  not a row, it is a COLUMN and a divisor: its points are the denominator of every cell under it, its
  category decides which weight the column counts at, and deleting it takes the column away. So an
  editor open over the grid changes numbers a teacher is looking at, and without this the grid goes on
  showing the arithmetic of the assignment as it was.

  THE CATEGORY MOVE IS WO-3.5's ACCEPTANCE LINE 8, and it is a box of its own because it is the one
  that can be got wrong while every other grade check passes: the weights do not move, the scores do
  not move, and the displayed grade has to change anyway because the column now counts at a different
  weight. WO-3.3 built the move and could not show it; this is where it shows. `points` is the loudest
  of the rest — one keystroke in that field changes every grade in the class — and rename, due date,
  reorder, duplicate and delete are all the same staleness in a quieter register.

  NOT afterClassChange() AND NOT afterCategoryChange(). Nothing here changes which classes exist,
  their order, which one is open, or a category — so the cards, the class bar and the class-manager
  row have nothing to redraw, and afterClassChange() would also decide where the teacher should be
  standing, which is not a thing renaming an assignment should do.

  renderScores() rather than a narrower paint, for the reason afterCategoryChange() gives one function
  up: a delete takes a whole column away and a create adds one, which is structure rather than figures,
  and the narrower paint would leave a column of live inputs for work that no longer exists. Nothing is
  being typed on the grid while these run — every one of them is a control inside a modal over it.
*/
function afterAssignmentChange() {
  if (views.currentView() === 'scores') scores.renderScores();
  /* AND THE PER-STUDENT DETAIL (WO-3.7), where an assignment is not a column either: it is a NAME in
     the missing-work list and a number in "what it would take to move". Renaming one leaves the old
     name in a sentence a teacher is reading out to a parent; changing its points changes how many
     points are at stake and the score needed to reach the next band; deleting it takes both away. */
  if (views.currentView() === 'detail') detail.renderDetail();
}

/*
  THE LETTER SCALE CHANGED, AND THE SCREEN THAT PRINTS A LETTER REDRAWN (WO-3.5).

  This is the chain the letter-grade block below promised: "the day a screen shows a letter (WO-3.5),
  it adds its line to a chain here, exactly as the categories did." That day is this one. The score
  grid prints a band under every percentage, the editor is a modal over whatever screen was up, and a
  teacher who moves the A boundary from 90 to 89.5 while the grid is behind the panel would otherwise
  close it onto a column of letters computed against the old bands.

  TWO BRANCHES SINCE WO-3.7, which is the second one this comment predicted by name. The per-student
  detail prints the letter in its hero AND the NEXT band up in the line under it — "D · next C− at
  70%" — and that second half is the target every "what it would take to move" figure on that screen
  is solved against. Moving a boundary behind it changes the answer as well as the label.

  renderScores() rather than a narrower paint, and that is src/scores.js's own decision rather than a
  choice made here: it exposes one paint for outside callers on purpose, because the two inside it
  differ by whether they may touch an <input> and a caller that had to choose would eventually choose
  wrong. Nothing is being typed while this panel is open — the editor is a modal over the grid — so the
  wide paint costs nothing that can be felt.
*/
function afterLetterScaleChange() {
  if (views.currentView() === 'scores') scores.renderScores();
  if (views.currentView() === 'detail') detail.renderDetail();
}

/*
  THE TERM CHANGED, AND THE SCREEN THE NAV IS SITTING ON TOP OF REDRAWN (WO-2.17).

  src/classes.js's selectTerm() writes the preference, repaints the class bar and says the new term
  out loud. It repaints nothing in <main>, which was right while the term nav sat over one screen
  that did not care — and stopped being right the moment a second one arrived. The registry's totals
  line has been term-scoped since WO-2.4, so tapping Quarter 2 moved the highlight in the header and
  left Quarter 1's percentages an inch below it, with nothing on screen saying which term the number
  belonged to. It corrected itself on the next repaint from any other cause, which is how it survived
  a phase: mark one student and the numbers jump, and the jump reads as the mark landing.

  WHICH IS WHY THIS IS A CHAIN AND NOT A LINE IN THE HANDLER. The term nav is a header control that
  every class screen sits underneath, and there are three of them the day WO-3.5's score grid lands —
  term-filtered by construction. Each new screen that reads getSelectedTerm() and does not repaint
  here is this same defect again, so the repaint is a property of the term change and the screen adds
  one line to this function rather than remembering to ask.

  PAINT WHAT IS UP, THE WAY afterCategoryChange() DOES, and each branch asks its own module for the
  narrowest repaint that makes its screen true. The assignment list is term-filtered top to bottom,
  headline included, so it is redrawn whole. The registry is not: its columns are a window of recent
  dates and do not move when the term does, so what changes is the three totals surfaces and
  paintRenderedTotals() is exactly those — where renderAttendance() would rebuild a grid of students
  × days to correct one line, on the flow this app is measured by (src/attendance.js's own history is
  one long argument about paint cost; WO-2.13 exists because the totals were folded once per student).

  AND NOTHING AT ALL FROM THE CLASS GRID. The nav is drawn there too, but the cards are today's
  attendance and no card reads a term — so the three class screens are named rather than left to an
  else, and a view that does not ask the question is not repainted for the answer.

  NOT paintClassScreen(): that maps a view to its whole-screen paint, which is what entering a screen
  needs and what a term change is one line short of. Two callers, two questions.

  THE SCORE GRID IS THE WIDE PAINT (WO-3.5), like the assignment list and unlike the registry: a term
  change replaces every column on it, because a column IS an assignment and assignments belong to one
  term. It is the third screen this chain's own comment predicted, and it is the one where forgetting
  the line would put Quarter 1's scores under a header saying Quarter 2, one keystroke from being
  overwritten.
*/
function afterTermChange() {
  const view = views.currentView();
  if (view === 'assignments') assignments.renderAssignments();
  else if (view === 'scores') scores.renderScores();
  /* THE PER-STUDENT DETAIL IS THE FOURTH SCREEN THIS CHAIN'S OWN COMMENT PREDICTED (WO-3.7), and it
     is the widest paint of the four: the grade, the breakdown, the outstanding work, the missing
     work AND the attendance summary are every one of them term-scoped, so a term change replaces the
     whole page rather than a line of it. It is also the screen where forgetting the line would be
     worst — a conference page carrying last quarter's grade under this quarter's heading. */
  else if (view === 'detail') detail.renderDetail();
  else if (view === 'class') attendance.paintRenderedTotals();
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

  THAT INSTRUCTION HAS TWO OBEYERS AND ONE EXCEPTION, AND THE EXCEPTION IS GEOMETRY (WO-2.27).
  WO-2.9's hall-pass history is a third surface that draws names and goes quiet in this mode, and it
  is deliberately NOT redrawn here. It cannot need to be: that surface is a MODAL, and the two
  controls this function is wired to — `#presentationBtn` in the header and the strip's own "Turn it
  off" — are both behind the scrim while a modal is up. `.modal-overlay` is `position: fixed; inset: 0`
  at `z-index: 1000` (src/shell.css § MODAL, and the ladder comment above it), and the header is
  unpositioned normal flow with no z-index at all, so it does not merely lose the stacking contest —
  it is covered edge to edge, and a tap at its coordinates lands on the backdrop. The first tap
  closes the dialog and the second reaches the control, which the owner walked on the iPad on
  2026-08-14 and read as the sensible flow. THE GEOMETRY IS ALSO THE SAFER HALF: a flip that reached
  through an open dialog would repaint a list of student names in front of whoever is sitting on the
  other side of the screen, which is the disclosure this mode exists to prevent.

  So there is nothing to add here, and adding it would wire a repaint for a state that cannot
  occur. What would change that is the day one student's trips are drawn somewhere that is not a
  modal — which has already happened once, on the Student Report screen, and that surface DID take
  its line below.
*/
function flipPresentationMode() {
  presentation.togglePresentationMode();
  roster.refreshSupportSurfaces();
  /* AND THE ACCOMMODATION PROMPT IN THE ASSIGNMENT EDITOR (WO-3.8) — the second screen in the app
     that can be holding support data, and the first one added since this comment predicted it. The
     summary is inside a dialog, which makes the flip MORE urgent rather than less: a teacher who
     reaches for this switch with the editor open is a teacher whose iPad is about to face the room
     with that dialog still on it. It goes by not being drawn, exactly as the roster dot does —
     src/accommodation-prompt.js empties its host rather than styling it away, and asks
     src/supports.js the same one question rather than testing the preference itself. */
  assignments.refreshAccommodationPrompt();
  /* The home screen is deliberately NOT in this list. Nothing on a class card comes out of a
     student's `supports` block — a class name and a colour are not a student's file — so there is
     nothing on it for the flip to suppress. src/home.js's header comment carries the same note and
     the condition under which it stops being true, because WO-4.x putting a behavior note into a
     card's signals slot is exactly how this list goes quietly out of date. */

  /*
    AND THE PER-STUDENT DETAIL IS ON THIS LIST NOW (WO-2.26), which is a correction to what stood
    here until 2026-08-14 rather than an addition beside it. This comment used to say that screen
    was deliberately absent, on the ground that it holds no support data — and that ground is still
    true, said in its own header and in src/scores.js's decision 5. What it did not anticipate is the
    other way a screen becomes mode-dependent: WO-2.26 put a hall-pass card on it, drawn by
    src/pass-history.js, which suppresses one student's trips while the mode is on for the reason
    WO-2.9's per-student view refuses outright. So there IS something on that screen for the flip to
    suppress, and suppression that only applies to the next render is the exact defect the paragraph
    above this function describes — worse here, because this is the screen most likely to be facing a
    room or a guardian when the switch is reached for.

    Guarded on the view being the one on screen, like the four other renderDetail() calls in this
    file: every path onto that screen renders it on arrival, so a repaint of a hidden view is work
    nobody sees. The condition the old comment named still stands beside this one — a later work
    order putting the roster's INDICATOR here answers for the print surface and the CSV first.
  */
  if (views.currentView() === 'detail') detail.renderDetail();
}

/* One click listener for the whole document. Order matters only in that the first hook to
   match wins, and no element carries two of them. */
document.addEventListener('click', (e) => {
  /* The opener is handed to openModal rather than left for it to infer: Safari does not
     focus a button when you tap it, so document.activeElement here is <body>. Without
     this argument the modal has nowhere to give focus back to on the iPad. */
  const open = e.target.closest('[data-modal-open]');
  if (open) {
    const overlayId = open.getAttribute('data-modal-open');
    /* The one overlay with something to read before it is on screen (WO-8.10). It keeps the plain
       hook rather than taking one of its own — the About button opens a panel of prose and nothing
       about that changed — so the exception is stated here, in the one listener, instead of in the
       markup. The read is awaited first for the reason `data-year-picker` exists: a modal that
       opens and then fills in is a modal that flickers. Both arms open it, because a panel that
       failed to say which build this is still has to say everything else. */
    if (overlayId === 'aboutModal') {
      paintBuildLine().then(() => openModal(overlayId, open), () => openModal(overlayId, open));
      return;
    }
    openModal(overlayId, open);
    return;
  }

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

  /* Beside it in this listener as well as in the header, and for the same reason: it is a control a
     teacher reaches for with a class already in the room. Nothing is chained onto it — the flip
     changes what the NEXT alert does and touches no screen that is currently drawn, which is the
     opposite of the mode above, where the redraw is the point. */
  if (e.target.closest('[data-sounds-toggle]')) { alertSound.toggleAlertSounds(); return; }

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
    /* AND THE SCREEN THE TERM NAV IS SITTING ON TOP OF (WO-3.3, correction round 1; made a chain at
       WO-2.17). classes.selectTerm() repaints the class bar and nothing in <main>, which was right
       while the term nav sat over one screen that did not care. It left the assignment list showing
       one term's work under another term's heading — that screen is term-filtered top to bottom —
       and it left the registry's totals line reporting the term the teacher had just left, which is
       the same defect one figure at a time and took a phase longer to see. Both belong to the term
       change rather than to this hook, so the order of operations is afterTermChange() above and the
       next class screen adds a line there rather than a branch here. */
    afterTermChange();
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
     Directly under the categories, because these are the same act: setting the year up. Every hook
     that can change a BAND now chains afterLetterScaleChange(), and that is WO-3.5 paying the debt
     this block's own comment recorded: "the day a screen shows a letter (WO-3.5), it adds its line to
     a chain here, exactly as the categories did." Until then there was nothing behind this panel that
     said anything about the scale — no row badge, no card, no header — and the absence of a chain was
     correct. The score grid prints a band under every percentage, so a teacher who moves the A
     boundary from 90 to 89.5 with the grid behind the panel would otherwise close it onto a column of
     letters computed against the bands she has just replaced.

     The door and the subject row are NOT chained, and that is the same distinction the categories
     block makes: opening the panel and choosing whose scale you are looking at change no band.

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
  /* An override arriving or leaving swaps which scale a class is banded by, which is every letter in
     that class changing at once — the loudest of the six. */
  const overrideOn = e.target.closest('[data-scale-override-on]');
  if (overrideOn) {
    letterScale.enableOverride(overrideOn.getAttribute('data-scale-override-on'));
    afterLetterScaleChange(); return;
  }
  const overrideOff = e.target.closest('[data-scale-override-off]');
  if (overrideOff) {
    letterScale.disableOverride(overrideOff.getAttribute('data-scale-override-off'));
    afterLetterScaleChange(); return;
  }
  if (e.target.closest('[data-band-add]')) { letterScale.addBand(); afterLetterScaleChange(); return; }
  const bandUp = e.target.closest('[data-band-move-up]');
  if (bandUp) {
    letterScale.moveBandUp(bandUp.getAttribute('data-band-move-up'));
    afterLetterScaleChange(); return;
  }
  const bandDown = e.target.closest('[data-band-move-down]');
  if (bandDown) {
    letterScale.moveBandDown(bandDown.getAttribute('data-band-move-down'));
    afterLetterScaleChange(); return;
  }
  const bandRemove = e.target.closest('[data-band-remove]');
  if (bandRemove) {
    letterScale.removeBand(bandRemove.getAttribute('data-band-remove'));
    afterLetterScaleChange(); return;
  }

  /* ── assignments (WO-3.3, and the chain since WO-3.5) ──
     Under the two setup panels because that is the order a class is built in: what it is graded
     on, what the letters mean, then the work itself. None of the eleven below chains
     afterClassChange() or afterCategoryChange() — nothing here changes which classes exist, their
     order, which one is open, or a category — and src/assignments.js repaints its own screen after
     every write, exactly as src/attendance.js does. The one thing behind this screen that could go
     stale is the class-manager row, and no hook here touches a class.

     THE ONES THAT WRITE NOW CHAIN afterAssignmentChange(), which is the SECOND screen an assignment
     is drawn on: the score grid, where it is a column and a divisor rather than a row. The openers
     and the two cancels deliberately do not — they change what is in a dialog, not what is in the
     year — and neither do the copy dialog's pickers, which move a proposal.

     The opener is passed to all four that open a dialog: src/modal.js needs somewhere to hand
     focus back to, and Safari does not focus a button when you tap it. */
  const assignmentNew = e.target.closest('[data-assignment-new]');
  if (assignmentNew) { assignments.createAssignment(assignmentNew); afterAssignmentChange(); return; }
  if (e.target.closest('[data-assignment-create-cancel]')) {
    assignments.cancelCreatedAssignment(); afterAssignmentChange(); return;
  }
  const assignmentEdit = e.target.closest('[data-assignment-edit]');
  if (assignmentEdit) {
    assignments.openAssignmentEditor(assignmentEdit.getAttribute('data-assignment-edit'),
      assignmentEdit);
    return;
  }
  const assignmentUp = e.target.closest('[data-assignment-move-up]');
  if (assignmentUp) {
    assignments.moveAssignmentUp(assignmentUp.getAttribute('data-assignment-move-up'));
    afterAssignmentChange(); return;
  }
  const assignmentDown = e.target.closest('[data-assignment-move-down]');
  if (assignmentDown) {
    assignments.moveAssignmentDown(assignmentDown.getAttribute('data-assignment-move-down'));
    afterAssignmentChange(); return;
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
  /* The copy lands in whichever class the dialog names, which may be the one on screen — so the
     grid behind it gains a column for it, and this is the one hook in the block whose write may
     also land somewhere the teacher is not looking. The chain asks which view is up rather than
     which class was chosen, which answers both cases with one line. */
  if (e.target.closest('[data-assignment-copy-confirm]')) {
    assignments.confirmCopy(); afterAssignmentChange(); return;
  }
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
    assignments.confirmAssignmentDelete(); afterAssignmentChange(); return;
  }
  if (e.target.closest('[data-assignment-delete-cancel]')) {
    assignments.cancelAssignmentDelete(); return;
  }

  /* ── the accommodation prompt in that editor (WO-3.8) ──
     Straight to the module that owns the prompt, the same way `data-past-due-review` goes straight
     to src/past-due.js: it holds what it painted, so the tap needs nothing from this file and this
     file learns nothing about a student's `supports` block by routing it. NOTHING IS CHAINED — no
     screen behind this dialog carries accommodation data, and putting one there is the change that
     would owe this line a chain (src/home.js's header records the same condition for the cards). */
  if (e.target.closest('[data-accommodation-names]')) {
    accommodationPrompt.toggleAccommodationNames(); return;
  }

  /* ── the score grid (WO-3.5) ──
     Two hooks, and neither of them chains anything: src/scores.js repaints its own screen after every
     write, exactly as src/attendance.js and src/assignments.js do, and nothing behind this screen goes
     stale for a score — the class-manager row prints a weights total, the cards print today's
     attendance, and no card or row prints a grade.

     The flag bar is a TOUCH path for keys that cannot be typed: a score cell asks iPadOS for a decimal
     keypad and a decimal keypad has no letters on it, so L, M and X are unreachable on the device this
     screen is measured on. The value on the button is the flag; src/scores.js refuses anything else. */
  const scoreFlag = e.target.closest('[data-score-flag]');
  if (scoreFlag) { scores.flagFocusedCell(scoreFlag.getAttribute('data-score-flag')); return; }
  if (e.target.closest('[data-scores-keys]')) { scores.toggleScoreKeys(); return; }

  /* ── the past-due prompt (WO-3.6) ──
     Three hooks, and the chain is the whole difference between them. Review and "Not now" write no
     cell and move no grade, so they repaint nothing but the banner and src/past-due.js does that
     itself. ACCEPT writes a flag onto however many cells the review listed, which is a score change
     like any other — so the screen under it is redrawn here, through the same paintClassScreen()
     every other navigation in this file goes through. It is redrawn from THIS side rather than from
     that module for the reason afterCategoryChange() gives one function up: src/past-due.js would
     have to import both screens to know which one it is standing on, and the import already runs
     the other way.

     The redraw is conditional on something having been written, which is not an optimisation: a
     tap that wrote nothing — every cell having taken a score while the banner was up — must not
     rebuild a grid the teacher is typing in.

     WHAT WO-3.19 ADDS TO THAT TRADE, said here because this is where a reader would look for it:
     the score grid's overdue column heads are drawn from the same set as the banner, so "Not now"
     takes their amber off too — but not until the next render, because src/past-due.js paints its
     own banner and cannot touch a grid it does not import. An amber date over a banner that has just
     gone is a colour one render stale, and rebuilding the grid under a teacher who may have a digit
     half-typed is the cost this paragraph already refuses to pay for something that wrote nothing.
     Accept is the other way round and redraws, which is what makes a column stop being amber the
     moment its blanks are marked. */
  if (e.target.closest('[data-past-due-review]')) { pastDue.togglePastDueReview(); return; }
  if (e.target.closest('[data-past-due-accept]')) {
    if (pastDue.acceptPastDue()) paintClassScreen(views.currentView());
    return;
  }
  if (e.target.closest('[data-past-due-dismiss]')) { pastDue.dismissPastDue(); return; }

  /* ── the class's grade sheet (WO-3.9) ──
     Three hooks, and none of them writes a document or changes a screen: one opens a dialog built
     from the open document, one asks the browser to print and one hands the browser a file. Nothing
     chains a repaint, for the reason the two above do not — nothing behind this dialog goes stale
     for a printout. They reach a different module for the reason src/attendance-report.js states
     over the identical three: it is a read-only surface built out of the same document, and the
     only thing in this app that hands a file to the browser is src/backup.js's helper, which that
     module borrows rather than copies. */
  const gradeSheet = e.target.closest('[data-grades-record]');
  if (gradeSheet) { gradesReport.openGrades(gradeSheet); return; }
  if (e.target.closest('[data-grades-record-print]')) { gradesReport.printGrades(); return; }
  if (e.target.closest('[data-grades-record-csv]')) { gradesReport.downloadGradesCsv(); return; }

  /* ── one student's grade detail (WO-3.7) ──
     Three hooks. The first is NAVIGATION and belongs beside the two above it in spirit — it is how
     this screen is entered, and it is deliberately not a segment on the switcher — but it sits here
     rather than up there because the two controls that carry it are on the screens below: the
     student's own name in the score grid, and the door inside their attendance history dialog. One
     hook, one route, whichever door it came through, exactly as `data-view-home` and
     `data-class-tab` each have several.

     The element is passed as well as the id, and it is not an opener in src/modal.js's sense —
     nothing here opens a dialog. It is how showStudentDetail() finds out whether the tap came from
     INSIDE one, because a door in a dialog has to close it on the way through and a name on a grid
     has nothing to close.

     The other two write no document and change no screen: one hands the browser a file and one asks
     the browser to print. Neither chains a repaint, for the reason the score grid's two do not —
     nothing behind this screen goes stale for a printout. */
  const studentDetail = e.target.closest('[data-student-detail]');
  if (studentDetail) {
    showStudentDetail(studentDetail.getAttribute('data-student-detail'), studentDetail);
    return;
  }
  /* `-sheet-` in the hook and not in the gate, and the two must never converge again: the attribute
     src/print-gate.js writes is `data-detail-print`, on <body>, and `closest()` walks to <body>.
     While this button carried that same string, a gate left on by a print the browser refused and
     the teacher then dismissed matched every click on screen — see the census at the head of this
     file and the markup comment in index.html. */
  if (e.target.closest('[data-detail-sheet-print]')) { detail.printDetail(); return; }
  if (e.target.closest('[data-detail-csv]')) { detail.downloadDetailCsv(); return; }

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

  /* And ten taps that move the view without writing anything, so none of them touches the home
     screen: opening a row's detail panel, unlocking a past column, closing it again, paging the
     window, filtering, sorting, and WO-2.6's four — a student's name, the 🖨 Record door, and the
     print and CSV controls inside the dialog it opens. Those last four reach a different module
     for a reason src/attendance-report.js states at length: they are read-only surfaces built out
     of the same ledger, and the only thing in this app that hands a file to the browser is
     src/backup.js's helper, which that module borrows rather than copies. */
  /* `attDetail` rather than `detail`, and the rename is load-bearing rather than a matter of taste.
     `detail` is the module binding this file imports src/detail.js under (WO-3.7), and a `const` of
     that name ANYWHERE in this listener puts the whole arrow body inside its temporal dead zone —
     so the two hooks 100 lines above, which run long before control reaches this line, threw
     `Cannot access 'detail' before initialization` and the Print button silently did nothing. The
     local is what moved because the module owns the name across ten uses in this file and this is
     its only other one; `attFilter` and `attSort` below are the same shortening for the same
     reason. Every other closest() local in this listener was checked against the import list. */
  const attDetail = e.target.closest('[data-attendance-detail]');
  if (attDetail) {
    attendance.toggleDetail(attDetail.getAttribute('data-attendance-detail')); return;
  }
  const history = e.target.closest('[data-attendance-history]');
  if (history) {
    attendanceReport.openHistory(history.getAttribute('data-attendance-history'), history);
    return;
  }
  const record = e.target.closest('[data-attendance-record]');
  if (record) { attendanceReport.openRecord(record); return; }
  if (e.target.closest('[data-attendance-record-print]')) {
    attendanceReport.printRecord(); return;
  }
  if (e.target.closest('[data-attendance-record-csv]')) {
    attendanceReport.downloadRecordCsv(); return;
  }
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

  /* ── and the log those three write, read back (WO-2.9) ──
     Three taps onto one dialog: the 🚪 door in the registry's toolbar, a student's name inside it,
     and the way back out to the whole class. They reach a different module for the reason WO-2.6's
     four do — a read-only surface built out of a log this file's other hooks write — and none of
     them chains anything, because opening a dialog over the registry changes nothing behind it.

     STILL THREE AFTER WO-2.26. That work order's first cut drew a fourth button carrying the same
     attribute on the student attendance report; the re-cut deleted it, because one student's trips
     are now a card on the Student Report screen rather than a room reached through two doors. What
     joins those surfaces is an import and not a hook, so this list did not move. */
  const passHistoryDoor = e.target.closest('[data-pass-history]');
  if (passHistoryDoor) { passHistory.openPassHistory(passHistoryDoor); return; }
  const passHistoryStudent = e.target.closest('[data-pass-history-student]');
  if (passHistoryStudent) {
    passHistory.openStudentPasses(passHistoryStudent.getAttribute('data-pass-history-student'),
      passHistoryStudent);
    return;
  }
  const passHistoryAll = e.target.closest('[data-pass-history-all]');
  if (passHistoryAll) { passHistory.openPassHistory(passHistoryAll); return; }

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

/*
  THE FOUR MODIFIER FLAGS, AS A RECORD RATHER THAN THE EVENT THEY CAME OFF (WO-3.23).

  Passing `e` itself was the obvious move and is the one that was refused. This listener is the
  only thing in the app that decides whether a keystroke is swallowed — every branch below routes
  to a module that answers a BOOLEAN and comes back here for the preventDefault, which is what
  makes "a key this screen could not use belongs to the browser" a rule with one enforcement point
  instead of a convention every module is trusted to keep. Handing a module the event hands it
  `preventDefault`, `stopPropagation` and every other field on it, and the next module to want the
  target, or the timestamp, or to cancel something itself, would take them without anything having
  to be decided. Four booleans cost one object per keystroke and can be read for nothing else.

  It is a function rather than four arguments so that the next delegated branch that needs the
  modifiers spells it the same way, which is the whole of the convention being set here.
*/
const modifiersOf = (e) => ({ shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey, meta: e.metaKey });

document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (anyModalOpen()) return;

  /*
    THE SCORE GRID'S KEYS (WO-3.5), AND THEY HAVE TO BE READ BEFORE THE GUARDS BELOW, NOT AFTER.

    Three of those five guards would each swallow this screen whole: it is not the `class` view, its
    focus is always inside an INPUT, and that is not an accident of layout — the cells ARE inputs,
    which is what makes 25 scores 25 keystroke-groups. So the branch is scoped by the element instead
    of by the view: a `keydown` whose target carries `data-score-cell` is a key pressed in a score
    cell, and nothing else in the app can be.

    src/scores.js decides what each key means and answers whether it used the key, so a key it could
    not use goes back to the browser — the same contract markSelected() has below, and the reason
    type-ahead, find-in-page and every browser shortcut still work on this screen. `Esc` is the one
    that matters: it is NOT in that module's list, so it falls through here, reaches src/modal.js's own
    handler, finds no modal open and does nothing at all. That is WO-3.5's seventh acceptance line,
    kept by there being no code rather than by code.

    THE MODIFIERS GO WITH THE NAME (WO-3.23), AND UNTIL THEN THEY DID NOT. This line passed `e.key`
    alone, so `Shift`+`→` and `→` arrived as the same string, were answered the same way, and were
    swallowed the same way — and a swallowed `Shift`+`→` is a selection the browser never made.
    Only `Shift` was ever reaching here: the modifier guard at the top of this listener returns on
    Alt, Ctrl and Meta BEFORE this branch, and Shift is deliberately not in that guard because it is
    how `?` is typed. That was measured before it was believed — a `keydown` listener on `window`,
    reading `defaultPrevented` after this one had run, answered false for Ctrl and Cmd and true for
    Shift (`.claude/dispatch/WO-3.23-result.md`) — and what stands in the harness now is the
    behaviour rather than the reading: tools/verify-shell.mjs presses Ctrl and Cmd + arrow at both
    caret edges and asserts nothing moves. The record carries all four flags anyway, so that the
    grid's answer does not depend on a guard above it that a later work order may want to move.
  */
  const scoreCell = e.target.closest ? e.target.closest('[data-score-cell]') : null;
  if (scoreCell) {
    if (scores.handleScoreKey(e.key, scoreCell, modifiersOf(e))) e.preventDefault();
    return;
  }

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
     mechanism rather than a value to be caught (docs/data-model.md § Extra credit).

     The chain runs per keystroke on purpose, for the reason the category field two hooks up gives:
     `points` is the denominator of every cell in that column, so a teacher who corrects 20 to 25
     with the score grid behind the dialog is watching every grade in the class move — and a figure
     that lags the field it is computed from is worse than no figure. */
  const assignmentField = e.target.closest('[data-assignment-field]');
  if (assignmentField) {
    assignments.editAssignmentField(assignmentField); afterAssignmentChange(); return;
  }

  /* A SCORE, SAVED AS IT IS TYPED (WO-3.5), and this is the busiest hook in the app: a teacher enters
     a column of twenty-five, so it fires a few hundred times in a sitting and the store's debounce is
     what turns that into a handful of writes (src/store.js). `input` rather than `change`, for the
     reason every field above uses it — `change` waits for a blur, and the grade beside the name is
     what the teacher is watching while she types the number.

     No chain: src/scores.js repaints its own grade column and summary, and it deliberately does not
     touch the field, because replacing the input under the caret is the failure that rule exists for. */
  const scoreCell = e.target.closest('[data-score-cell]');
  if (scoreCell) { scores.editScore(scoreCell); return; }

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
     `input` listener above already saved; this hook exists for the cleared value. The chain runs
     for the same reason it does there: a due date is printed on the column head of the score grid,
     and a cleared one has to leave it. */
  const assignmentDate = e.target.closest('[data-assignment-field]');
  if (assignmentDate) { assignments.assignmentDateCommitted(assignmentDate); afterAssignmentChange(); }
  /* Which category an assignment counts in, read HERE and not in the `input` listener above, for
     the reason `data-support-kind` is: a <select> commits on `change`, and hooking both would write
     the same value twice and move `rev` twice for one tap. It carries its own hook so that the
     other listener cannot see it at all.

     THIS IS WO-3.5's ACCEPTANCE LINE 8 — the one the chain exists for, and the one the box was
     written separately to hold. WO-3.3 built the move and had no screen that could show it; the
     grid is that screen, and one tap on this <select> has to change the weight the column counts at
     and every grade beside every name, on the keystroke. The weights have not moved and no score
     has moved, which is exactly why walking the weights across 100 could never have discharged it. */
  const assignmentCategory = e.target.closest('[data-assignment-category]');
  if (assignmentCategory) {
    assignments.setAssignmentCategory(assignmentCategory); afterAssignmentChange();
  }
  /* The copy dialog's two pickers. Neither writes to the document — they move a proposal. */
  const copyTerm = e.target.closest('[data-assignment-copy-term]');
  if (copyTerm) assignments.setCopyTerm(copyTerm);
  const copyCategory = e.target.closest('[data-assignment-copy-category]');
  if (copyCategory) assignments.setCopyCategory(copyCategory);
});

/*
  WHICH SCORE CELL THE FLAG BAR ACTS ON (WO-3.5) — the sixth event type this file listens for, and the
  only one whose reason is a browser difference rather than a feature.

  The four flag buttons say "the cell you are in", and by the time one of their clicks arrives the cell
  is no longer the active element: Safari does not focus a button when you tap it (src/modal.js's
  header records the same divergence for the opposite reason), so `document.activeElement` is <body> on
  the iPad and the button on a laptop. Neither is the answer. So the CELL says when it is entered and
  src/scores.js remembers two ids.

  `focusin` rather than `focus`, because `focus` does not bubble and there are two hundred cells to
  attach to otherwise — which would also mean re-attaching on every render.

  It is scoped to the hook and nothing else: no other element in the app carries `data-score-cell`, so
  this listener is inert on every screen but one.
*/
document.addEventListener('focusin', (e) => {
  const scoreCell = e.target.closest ? e.target.closest('[data-score-cell]') : null;
  if (scoreCell) scores.noteFocusedCell(scoreCell);
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
  /* And the mute, beside it and for the same three reasons: a fact about this browser, read from
     localStorage, painted whether or not IndexedDB opens. A teacher who silenced the alert to
     proctor a test yesterday must find the header still saying so today — the preference is the
     memory, and this is the only thing that paints it. */
  alertSound.refreshSoundChrome();
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
  WHICH BUILD THIS DEVICE IS ACTUALLY RUNNING — the last line of the About modal (WO-8.10).

  IT LIVES BESIDE THE REGISTRATION ABOVE AND NOT IN A MODULE OF ITS OWN, which is the one place
  this file departs from src/README.md's "one concern per file". A new src/*.js has to join sw.js's
  SHELL list and bump CACHE in the same commit (sw.js's own rule 2), and this work order may not
  edit sw.js at all: its cache name is the fact being reported, and a change that edits both the
  fact and the report of it can agree with itself while being wrong. So it goes where the shell's
  caching already lives — the comment above says registration is here rather than in
  install-banner.js because caching the shell and nagging about the home screen are two concerns,
  and this is the first concern, read back.

  WHY A CACHE NAME AND NOT A VERSION NUMBER. After a deploy the only way to learn whether the
  installed iPad took the new shell was Safari Web Inspector over USB from a Mac, which is a
  procedure nobody runs in September. And the useful question is not which version: sw.js uses
  skipWaiting + clients.claim, so `activate` deletes every cache that is not the current one.
  ONE CACHE IS THE HEALTHY STATE. More than one means `activate` did not finish and the app may be
  serving a mix — the failure that actually breaks a screen, and the one a version string typed
  into index.html would hide, because it would report the new name while the old cache sat beside
  it. Nothing here may become a constant: the line is generated from caches.keys() every time the
  modal opens, and no file in this app but sw.js contains a versioned cache name.

  It reads from the page and never from the worker — no postMessage, no registration inspected, no
  network request. Cache Storage is a window API and answers the whole question on its own.
*/
const BUILD_LINE_ID = 'buildCaches';
/* Every cache this app has ever made is `planbook-shell-<version>` (sw.js). The filter is the
   prefix rather than a list, so a cache from a future version — the one this line exists to
   catch — is named rather than hidden, and a cache belonging to something else on the origin is
   not reported as Planbook's. */
const SHELL_CACHE_PREFIX = 'planbook-shell-';

/* Written with textContent and one created <strong>, never innerHTML: these strings come out of
   Cache Storage, which anything on this origin can write into, and a cache name is not markup. */
function buildLine(el, warn, parts) {
  el.textContent = '';
  el.classList.toggle('warn', warn);
  parts.forEach((part) => {
    if (typeof part === 'string') { el.appendChild(document.createTextNode(part)); return; }
    const strong = document.createElement('strong');
    strong.textContent = part.name;
    el.appendChild(strong);
  });
}

/*
  Called before the About modal opens, never after — a modal that opens and then fills in is a
  modal that flickers, which is the reason `data-year-picker` is not `data-modal-open="yearModal"`
  (the header comment at the top of this file). It resolves in every path including a rejection, so
  the caller opens the panel either way.

  A BLANK LINE WOULD READ AS "NO CACHES", which is a different fact and a wrong one, so each of the
  five states says which one it is. Two of them are failures to answer rather than answers:
  `window.caches` is undefined on a non-secure origin, and the read can reject in a private window.
  Neither takes the amber (src/shell.css says why) — the caution palette has to mean exactly one
  thing, and that thing is more than one stored copy.
*/
async function paintBuildLine() {
  const el = document.getElementById(BUILD_LINE_ID);
  if (!el) return;

  if (!window.caches || typeof window.caches.keys !== 'function') {
    buildLine(el, false, ['This browser will not let Planbook see its own stored copies, so it '
      + 'cannot tell you which build it is running. That is not the same as none being stored.']);
    return;
  }

  let names;
  try {
    /* Left in the order Cache Storage answers rather than sorted: that order is roughly the order
       they were made, so on the two-cache screen the survivor of a finished update reads last. */
    names = (await window.caches.keys()).filter((n) => n.indexOf(SHELL_CACHE_PREFIX) === 0);
  } catch (e) {
    buildLine(el, false, ['Planbook could not read its stored copies on this device, so it cannot '
      + 'tell you which build it is running. That is not the same as none being stored. The '
      + 'browser said: ' + String(e && e.message ? e.message : e)]);
    return;
  }

  if (!names.length) {
    buildLine(el, false, ['No copy of Planbook is stored on this device yet, so it will not open '
      + 'without a network. If it was just installed or just updated, opening it again in a minute '
      + 'usually settles that.']);
    return;
  }

  if (names.length === 1) {
    buildLine(el, false, ['Running from ', { name: names[0] },
      ' — one stored copy on this device, which is what it should be.']);
    return;
  }

  /* The line the whole feature is for. It names every one of them, and it says the number out
     loud: a teacher who reads "more than one" forwards the screen, and one who reads two cache
     names and no sentence shrugs at it. */
  const parts = ['⚠ More than one copy of Planbook is stored on this device: '];
  names.forEach((name, i) => {
    if (i) parts.push(i === names.length - 1 ? ' and ' : ', ');
    parts.push({ name });
  });
  parts.push('. The last update did not finish, so parts of what you are looking at may still be '
    + 'coming from the older one. Quit Planbook from the app switcher and open it again — if this '
    + 'line still names more than one, send this screen to whoever set Planbook up.');
  buildLine(el, true, parts);
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
  /* `gradeEngine` is pure and has no screen in WO-3.4. The browser verifier reads its answers
     through this seam so the worked cases exercise the shipped module rather than a second copy
     of the arithmetic in the harness. */
  gradeEngine,
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
  /* `scores` joined at WO-3.5, and for the reading reason `classes` gives rather than a driving one:
     every control this screen has is an input, a button or a segment a teacher can touch. What no
     click can show is the SHAPE of what a keystroke wrote — acceptance line 4 is that clearing a cell
     removes the key entirely rather than storing `{ v: null }` with no flag, and a cleared cell and a
     cell holding a null look identical on screen and grade identically too. So the harness types
     through the real field and then reads `scores` off the document to tell the two apart. Nothing in
     the app reads window.planbook — see the block above for why the seam outlived the shelf. */
  scores,
  /* `detail` joined at WO-3.7, and its reason is src/backup.js's and src/attendance-report.js's
     rather than the reading reason `classes` gives: a page cannot be handed a real file by a script
     and no harness can open a print dialog or read what came out of a spreadsheet. detailModel() and
     studentCsv() are the same build-it/hand-it-over split those two use — a model in, bytes out,
     with no DOM anywhere between them — so the BOM, the CRLF endings, the section headers and a
     non-ASCII surname can be asserted character by character. "The CSV opens cleanly in a
     spreadsheet, including a name with a non-ASCII character in it" is otherwise a claim nobody can
     check without a spreadsheet. Nothing in the app reads window.planbook — see the block above for
     why the seam outlived the shelf. */
  detail,
  /* `gradesReport` joined at WO-3.9, and its reason is `detail`'s and `attendanceReport`'s rather
     than the reading reason `classes` gives: a page cannot be handed a real file by a script, and
     no harness can open a print dialog or read what came out of a spreadsheet. gradesRecord() and
     gradesCsv() are the same build-it/hand-it-over split those two use — a model in, bytes out,
     with no DOM anywhere between them — so the row order, the column order, the marks in every cell
     and the BOM can be asserted character by character. "The CSV opens cleanly in a spreadsheet,
     with its rows and columns in the same order as the printout" is otherwise a claim nobody can
     check without a spreadsheet and a printer. Nothing in the app reads window.planbook — see the
     block above for why the seam outlived the shelf. */
  gradesReport,
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
  /* `attendanceReport` joined at WO-2.6, and its reason is the one src/backup.js's entry gives
     rather than the reading reason `attendance` gives: a page cannot be handed a real file by a
     script, and no harness can open a print dialog or read what came out of a spreadsheet. What it
     CAN do is ask for the text — recordCsv() is that seam, the same split buildBackup() has, and it
     takes a record and returns bytes with no DOM anywhere in it. "The CSV opens cleanly in a
     spreadsheet with dates as columns" is otherwise a claim nobody can check without a spreadsheet.
     Nothing in the app reads window.planbook — see the block above for why the seam outlived the
     shelf. */
  attendanceReport,
  /* `passes` joined at WO-2.8, and for the reading reason `attendance` gives rather than for a
     driving one: both pass controls are buttons on the registry and a teacher can touch all of
     them. What no click can show is the half this work order is about — whether an open pass is in
     the DOCUMENT or only in a module variable — so tools/verify-shell.mjs reads openPassesIn() and
     passesIn() straight off a document it reloaded, which is the only way to tell the shipped build
     from the one that copied Roll Call!'s `activePasses`. Nothing in the app reads window.planbook
     — see the block above for why the seam outlived the shelf. */
  passes,
  /* `passHistory` joined at WO-2.9, and for a driving reason rather than a reading one: both of its
     views are reached by tapping, and tools/verify-shell.mjs taps them — what it is here for is the
     ONE path no control can produce, which is opening a student's own trips while presentation mode
     is on. In the app that door is text rather than a button precisely so that it cannot be tapped,
     and the check that proves the refusal is real has to ask the module directly, the same way
     WO-2.11's cancel gate is asked about a pass that has already been returned. Nothing in the app
     reads window.planbook — see the block above for why the seam outlived the shelf. */
  passHistory,
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
  /* `alertSound` joined at WO-2.29, and its reason is the one src/backup.js's entry gives rather
     than the reading reason `classes` gives: a headless browser cannot hear anything, and no check
     anywhere can assert that a room heard a beep. What it CAN be handed is what the audio path
     actually DID — alertSoundLog() is that seam, and an entry is written only after the oscillators
     have been constructed, connected and started, carrying how many of them there were. That is how
     a tone the preference SILENCED (an entry with no oscillators) is told from a threshold that
     stopped asking for one at all (no entry).

     AND THE SECOND FUNCTION IS HERE BECAUSE THE FIRST ONE WAS NOT ENOUGH, which the 2026-08-14 iPad
     run proved at this app's expense: alertSoundLog() read `played: true, oscillators: 10,
     state: "running"` throughout a failure in which the device made no sound, because a context
     created outside a gesture reports exactly that and plays to nothing. So alertAudioState()
     reports the MECHANISM the corrected unlock turns on — how many AudioContexts this page has ever
     constructed, whether the one it holds was born in a gesture, and whether it is still open —
     which is machine-checkable in the way audibility is not. WO-2.31 added the counts beside them
     (`interruptions`, `recoveries`, `wakeResumes`) for a reason worth knowing: a context that was
     interrupted and recovered twenty milliseconds ago reads identically to one that was never
     disturbed, so a harness that could only read `state` would be asserting against a window it has
     to win a race to see. Neither function closes the 👤 line.
     The switch itself is a button in the header a teacher can touch, and the harness taps it.
     Nothing in the app reads window.planbook — see the block above for why the seam outlived the
     shelf. */
  alertSound,
  /* `accommodationPrompt` joined at WO-3.8, for one acceptance line and not for convenience. Its
     visible controls are all reachable by a thumb and are driven that way; what a thumb CANNOT do
     is reach the reveal while presentation mode is on, because with the mode on the button is not
     drawn — and "it must not be reachable at all" is a claim about the guard rather than about the
     button. So the harness calls toggleAccommodationNames() straight through this seam with the
     mode on, which is the only way to ask whether the function refuses or whether the missing
     button was the whole of the protection. Nothing in the app reads window.planbook — see the
     block above for why the seam outlived the shelf. */
  accommodationPrompt,
  /* isInstalled() is here for one reason: the banner's whole behavior turns on it, and on a
     desktop there is no way to ask the question except by installing. */
  isInstalled, refreshInstallBanner,
};
