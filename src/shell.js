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
      data-class-tab="<classId>"      makes that class the open one — carried by the header's tab
                                      row AND by the home screen's cards, which are two views of
                                      one selection and share this one route
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

    `data-year-picker` is not `data-modal-open="yearModal"` because the list inside it has to
    be read out of IndexedDB before the panel is on screen — a modal that opens and then fills
    in is a modal that flickers.
*/

import { openModal, closeModal } from './modal.js';
import { announce } from './live-region.js';
import { getPref, setPref } from './prefs.js';
import { refreshInstallBanner, dismissInstallBanner, isInstalled } from './install-banner.js';
import * as store from './store.js';
import { refreshYearButton, openYearPicker, switchYear, createYearFromForm } from './year-picker.js';
import * as backup from './backup.js';
import * as classes from './classes.js';
import * as home from './home.js';
import * as roster from './roster.js';
import * as supports from './supports.js';
import * as presentation from './presentation.js';
import * as teacher from './teacher.js';

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
*/
function afterClassChange() {
  home.refreshHome();
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

  /* The header tab and the home screen's card both land here — see the hook list above. Selecting
     a class moves the mark on both views, so both are redrawn. */
  const classTab = e.target.closest('[data-class-tab]');
  if (classTab) {
    classes.selectClass(classTab.getAttribute('data-class-tab'));
    afterClassChange();
    return;
  }

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
  if (termSelect) { classes.selectTerm(termSelect.getAttribute('data-term-select')); return; }
  if (e.target.closest('[data-term-add]')) { classes.addTerm(); return; }
  const termRemove = e.target.closest('[data-term-remove]');
  if (termRemove) { classes.removeTerm(termRemove.getAttribute('data-term-remove')); return; }
  const termPreset = e.target.closest('[data-term-preset]');
  if (termPreset) { classes.applyPreset(termPreset.getAttribute('data-term-preset')); return; }

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
  if (form.hasAttribute('data-class-rename-save')) {
    classes.saveRename(form.getAttribute('data-class-rename-save'));
    afterClassChange();
  }
});

/* Term labels and dates, saved as they are typed. `input` rather than `change`: `change` on a text
   field waits for a blur, so a teacher who types a term name and then taps a button elsewhere in
   the dialog is relying on the blur order to have saved it, and the header tab beside her would
   not follow along as she typed either. The store debounces the burst into one save
   (src/store.js) — which is exactly what the debounce is for. */
document.addEventListener('input', (e) => {
  const field = e.target.closest('[data-term-field]');
  if (field) { classes.editTermField(field); return; }

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
  /* The accommodation kind picker, which is read HERE and not in the `input` listener above: a
     <select> commits on `change`, and hooking both would write the same value twice and move `rev`
     twice for one tap. It carries `data-support-kind` rather than `data-student-field` so that the
     other listener cannot see it at all. */
  const kind = e.target.closest('[data-support-kind]');
  if (kind) roster.editAccommodationKind(kind);
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
    /* The class bar and the term nav, drawn from the document that just came out of IndexedDB.
       Boot is the only place they are drawn from outside src/classes.js and the two chains above:
       every other change to a class is made inside that module, which redraws its own header. */
    classes.refreshClassBar();
    /* The home screen, from the same document and the same open-class preference the bar just
       resolved — so the cards and the tabs cannot disagree about which class is open on the first
       paint. Boot is the only place either is drawn from outside the chains above. */
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
  /* `roster` joined at WO-1.7, for the same reason `classes` did and with one addition. The
     acceptance lines are driven by typing into the real paste box and clicking the real controls;
     this is how the result is READ — what the document holds, how a line was split — without a
     second copy of the parser living in the harness where it could agree with itself and disagree
     with the app. parseRosterLine() is exported for that reason and for no other: nothing in the
     app calls it from outside src/roster.js. */
  roster,
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
