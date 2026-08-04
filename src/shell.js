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
      data-save-state="<state>"       shows that save-indicator state
      data-save-cycle                 runs the five-state demo
      data-announce="<message>"       sends a message to the aria-live region
      data-pill-group                 on a container: its .pill children single-select
      data-install-dismiss            snoozes the install banner
      data-year-picker                renders the year list, then opens the year modal
      data-year-switch="<year>"       opens that year document
      data-year-create                on a <form>: creates the year typed into it
      data-backup-panel               fills the backup panel, then opens it
      data-backup-download            downloads the open year document as a file
      data-backup-file                on an <input type=file>: reads the chosen backup
      data-backup-drop                on a container: accepts a dropped backup file
      data-backup-confirm             carries out the restore the confirm dialog describes
      data-backup-cancel              abandons it, having written nothing
      data-class-manage               fills the classes panel, then opens it
      data-class-tab="<classId>"      makes that class the open one
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
import { showSaveState, demoSaveCycle } from './save-indicator.js';
import { getPref, setPref } from './prefs.js';
import { refreshInstallBanner, dismissInstallBanner, isInstalled } from './install-banner.js';
import * as store from './store.js';
import { refreshYearButton, openYearPicker, switchYear, createYearFromForm } from './year-picker.js';
import * as backup from './backup.js';
import * as classes from './classes.js';

/* The two things that are facts about the open year rather than about a save, so they are
   re-evaluated wherever the open year can change: the backup nag (src/backup.js explains why it is
   not on every save) and the class bar, which is describing another year's classes the instant the
   document underneath it is replaced. Chained from the hooks below rather than called from inside
   year-picker.js, so that neither of those modules has to import the other two. */
function afterYearChange() {
  backup.refreshBackupNag();
  classes.refreshClassBar();
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

  const saveState = e.target.closest('[data-save-state]');
  if (saveState) { showSaveState(saveState.getAttribute('data-save-state')); return; }

  if (e.target.closest('[data-save-cycle]')) { demoSaveCycle(); return; }

  if (e.target.closest('[data-install-dismiss]')) { dismissInstallBanner(); return; }

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
  if (e.target.closest('[data-backup-cancel]')) { backup.cancelRestore(); return; }
  if (e.target.closest('[data-backup-confirm]')) {
    /* A restore replaces the whole document, so the class bar and the term nav are describing a
       year that no longer exists the moment it lands. Chained here rather than called from inside
       backup.js for the reason the nag is chained onto a year switch above: backup.js would then
       import classes.js, classes.js imports the store, and the reverse import that would follow
       the first time a class needed the backup panel closes a loop this repo has already refused
       once. Refreshed whether or not the restore took — a refusal leaves the old document open,
       and re-describing the document that is still open is the right answer anyway. */
    backup.confirmRestore().then(classes.refreshClassBar, classes.refreshClassBar);
    return;
  }

  /* ── classes and terms ── */

  const classManage = e.target.closest('[data-class-manage]');
  if (classManage) { classes.openClassManager(classManage); return; }

  const classTab = e.target.closest('[data-class-tab]');
  if (classTab) { classes.selectClass(classTab.getAttribute('data-class-tab')); return; }

  const rename = e.target.closest('[data-class-rename]');
  if (rename) { classes.startRename(rename.getAttribute('data-class-rename')); return; }
  if (e.target.closest('[data-class-rename-cancel]')) { classes.cancelRename(); return; }

  const moveUp = e.target.closest('[data-class-move-up]');
  if (moveUp) { classes.moveClassUp(moveUp.getAttribute('data-class-move-up')); return; }
  const moveDown = e.target.closest('[data-class-move-down]');
  if (moveDown) { classes.moveClassDown(moveDown.getAttribute('data-class-move-down')); return; }

  const archive = e.target.closest('[data-class-archive]');
  if (archive) { classes.archiveClass(archive.getAttribute('data-class-archive')); return; }
  const restore = e.target.closest('[data-class-restore]');
  if (restore) { classes.restoreClass(restore.getAttribute('data-class-restore')); return; }

  const del = e.target.closest('[data-class-delete]');
  if (del) { classes.openDeleteConfirm(del.getAttribute('data-class-delete'), del); return; }
  if (e.target.closest('[data-class-delete-confirm]')) { classes.confirmDelete(); return; }
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

  const speak = e.target.closest('[data-announce]');
  if (speak) { announce(speak.getAttribute('data-announce')); return; }

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
  if (form.hasAttribute('data-class-create')) { classes.createClassFromForm(); return; }
  if (form.hasAttribute('data-class-rename-save')) {
    classes.saveRename(form.getAttribute('data-class-rename-save'));
  }
});

/* Term labels and dates, saved as they are typed. `input` rather than `change`: `change` on a text
   field waits for a blur, so a teacher who types a term name and then taps a button elsewhere in
   the dialog is relying on the blur order to have saved it, and the header tab beside her would
   not follow along as she typed either. The store debounces the burst into one save
   (src/store.js) — which is exactly what the debounce is for. */
document.addEventListener('input', (e) => {
  const field = e.target.closest('[data-term-field]');
  if (field) classes.editTermField(field);
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

/* A console seam, and the reason it exists: WO-1.2 ships no store, so the five save states
   and the live region are only reachable by hand. Later work orders import these modules
   directly — nothing in the app should ever read `window.planbook`, and when the shelf goes
   this goes with it.

   getPref/setPref are here for the same reason and one more: setPref refusing an undeclared
   key is the check behind "no planbook_ key holds anything but a UI preference", and it is
   only runnable by hand until there is a preference to set.

   `store` joined them at WO-1.4 with the same justification: the store now saves, retries,
   and reports on the chip, but nothing on screen writes to a year document until WO-1.6 and
   WO-1.7 give the app a class and a roster. Until then store.update() is reachable only from
   here, and so is every acceptance line about `rev` — the console and tools/verify-shell.mjs
   are what exercise them. This goes when the shelf goes. */
window.planbook = {
  showSaveState, demoSaveCycle, announce, openModal, closeModal, getPref, setPref, store,
  /* `backup` is here for a reason the others are not: a page cannot be handed a real file by a
     script, so no harness can put one through the file input or the drop target. Everything
     after the read is the same code either way, and backup.restoreFromText() is that seam —
     tools/verify-shell.mjs drives the round trip, the refusals and the confirm through it. The
     real file paths stay owed to a human on an iPad. This goes when the shelf goes. */
  backup,
  /* `classes` joined at WO-1.6, and unlike the others it is NOT here because the feature is
     unreachable — every control it owns is on the page and a teacher can touch all of them. It is
     here so tools/verify-shell.mjs can READ the answers: which class and which term are open, what
     a term id looks like, and what a document holds after six classes have been created through
     the form. The acceptance lines are driven by clicking the real controls; this is how the
     result is inspected without a second copy of the resolution logic in the harness. Nothing in
     the app reads window.planbook, and this goes when the shelf goes. */
  classes,
  /* isInstalled() is here for one reason: the banner's whole behavior turns on it, and on a
     desktop there is no way to ask the question except by installing. */
  isInstalled, refreshInstallBanner,
};
