# WO-7.9 — result (implementer, Claude Opus)

**Status left as 🤖 CLAIMED.** I ran none of `--start` / `--release` / `--handoff` / `--tick`. Acceptance
lines 1 to 4 are ticked by hand in `plans/work-orders/phase-7-sync.md`, and the evidence for each is
below. Both 👤 lines are open. I committed nothing.

## Commands, from output I read

- `node tools/verify-shell.mjs` (whole run, real clock, after the last code change):
  `1572 checks · 1572 passed · 0 failed · 0 skipped`, 613s, `EXIT=0`. The first whole run on this tree
  was **red, 1570/1572**. Two `glance-quiet.mjs` checks read "no text under #homeView mentions a review
  while presentation mode is on". My hidden Testing-mode note under the doors still had its text
  (*"Google is still reviewing…"*) on the fixture page. I fixed it in `src/first-run.js`: the note's
  text is now written only while it is drawn and emptied otherwise. The re-run is the green one above.
- `node tools/wo-sweep.mjs`: `45 checks · 41 passed · 0 failed · 4 to review`, `EXIT=0`. The one new
  review item is "CSS selectors added with no coarse-block rule: `.home-empty-or`, `.home-empty-or-note`".
  Neither is a touch target. They are the hairline wrapper and a `.class-hint` spacer. The doors inside
  are `.class-action-btn`, which already has a 44px floor, and `verify/first-run.mjs` measures both at
  44px under a real coarse pointer. `src/home.css`'s coarse block says why it takes no rule for them.
- `grep -rn MUTATION src tools index.html`: every hit is prose that was already there (`src/shell.js:951`,
  `keys-legend-guards.mjs`, `outreach.mjs`, `score-grid.mjs`, `wo-gate.mjs`, `tools/README.md`).
  `grep -rn "MUTATION WO-7.9" src tools index.html sw.js` returns nothing.

## Against the Acceptance list

1. **[x] Untouched device draws both doors. A class, a student or a second year draws neither. On the
   LAN host only the backup door.** `verify/first-run.mjs` runs the app at `http://localhost:<port>`,
   which is a different origin and so a different IndexedDB: a fresh device, with the run's own fixture
   never touched. There: both doors are drawn, *Add your first class* is the only primary button, the
   note equals `TESTING_MODE_NOTE`, and `untouchedYear()` returns the open docId on one year at rev 1.
   I then took four fresh devices, each of which had drawn both doors, added one thing to each (a
   student, one save of the teacher's name, a second year, a class) and reloaded. Every one draws
   neither door, and `proof: null`. On the student and save devices the empty state is still showing,
   so only the proof keeps the doors down. The fixture page (17 classes, 3 years) reads
   `untouchedYear() = null`, and the doors stay down even when the paint is told the empty state is up.
   **The LAN arm is asserted through `firstRun.doorsFor()`, not on a page served from a LAN address.**
   No harness page can have that hostname. `paint()` draws `doorsFor(show, location.hostname)`, and
   that pure function returns `{"backup":true,"drive":false}` for `192.168.1.50`, `10.0.0.12` and
   `hwgteach.com`. This is the same standard WO-7.4 set for `hostAllowsSignIn()`. The verifier should
   judge whether that meets "asserted in the harness". I believe it does, and I say so plainly.
2. **[x] The list shows live files only; opening one leaves the device holding that document, current,
   with a bookmark at the remote rev; the next sync is in-sync with no writes. Mutation-proved.**
   The list has 4 rows out of 6 files: no conflict copy and no trashed file. The query carries
   `trashed = false`, and the fake Drive sends the trashed file anyway, so the module's own filter is
   what drops it. No row contains the class, student or medical sentinels. After opening:
   `{"docId":"wo79-live","rev":7}`, one year on the device, bookmark `baseRev 7`, freshness `current`.
   The sync after it: `{"kind":"in-sync"}` over 1 Drive call, `0 of them a write`.
   **Mutation:** I commented out `pullYear()`'s `writeSyncState()` line under a `MUTATION WO-7.9`
   marker and ran a temporary runner (localstorage-prefs, a one-class plant, and this section;
   `tools/_wo79-scratch.mjs`, since deleted). Result: `50 · 47 · 3 failed`. The Acceptance 2 check read
   `bookmark = null, freshness = ahead; the sync after: {"kind":"conflict"} … 2 of them a write
   [POST, PATCH]`. I restored the file from a copy taken before the edit and grepped for the marker
   before writing any prose. This mutation run used the subset runner, not a whole-harness run.
3. **[x] A device that takes neither door behaves as today and makes no request to accounts.google.com,
   asserted from the network.** Network domain on, launch plus `visibilitychange`:
   `0 request(s) to accounts.google.com and 70 to http://localhost:…`. No library and no script tag on
   the page, no opt-in, and the header sync button hidden. The backup door also makes no Google request.
4. **[x] A file that fails validation, or is from a newer build, is refused in a sentence and the
   untouched year is unchanged.** A non-JSON body and a `schemaVersion: 99` year are each refused in
   `parseBackup()`'s own sentence, ending *"Nothing on this device has been changed."* The stored-record
   digest, rev, docId and year list are identical before and after, the device is still untouched, and
   no bookmark was written.
5. **[ ] 👤 iPad, deployed, pop-up blocker on, fresh install.** Not done: it needs the iPad and a real
   Google account. **Expect two taps on the iPad** (see trap 1 below). `TESTING.md` § WO-7.9 has the
   procedure, including the warning to back up before clearing site data.
6. **[ ] 👤 Backup door on a fresh device restores a laptop backup.** Not done: it needs a real file in
   the Files picker. The harness only shows that the door opens the existing Backup & restore panel.

## Trap 1: the choice I made

On a fresh device Google's library is not on the page, and Acceptance 3 forbids preloading it when the
doors are drawn. **The Drive tap takes `reconnect()`'s own `loadedFirst` path, unchanged, and the
dialog gives its honest two-tap sentence a home.**

- **On a laptop**, the script fetch lands inside the browser's activation window, so the first tap
  opens Google.
- **On the iPad**, the first tap loads the library and Safari blocks the window. The dialog then shows
  *"It is ready now — tap again and it will open"* beside a *Sign in to Google* button, which carries
  the same hook. That second tap asks inside its own gesture, with the library already on the page.

**What I rejected:**
- **Preload on paint** breaks Acceptance 3.
- **Preload on touchstart** buys about 100ms, and a script fetch does not fit in that.
- **A dialog-first two-step** always costs two taps, even on the laptop.

The harness drives both halves:
- With Google blocked, the tap is the first and only request to `accounts.google.com/gsi/client`, and
  then the red sentence and the Sign in button appear.
- With the library stood in, one visible request is made inside the click listener's own stack, and
  the opt-in is set.

## Decisions the work order did not settle

- **What "untouched" reads** (trap 2) is `store.untouchedYear()`, a positive proof. It needs all of:
  - nothing dirty, saving or in flight;
  - `rev === 1`;
  - no class and no student;
  - exactly one year on the device, and it is the open one;
  - a stored record at rev 1 with the same docId;
  - the stored JSON identical to the in-memory JSON;
  - the same document still open after the reads.

  Anything else returns null. The pull re-proves this before the download and again after it.
  `store.adoptRemoteDocument()` gained an optional `onlyOver: { docId, rev }` guard, checked after its
  own flush, which refuses to replace any record but the proved one. All three layers are driven: a
  class added while the list is open, a name typed during the download, and the guard called directly.
- **A pull's failures do not settle `outcome`.** The refusal goes to the dialog, so the header does not
  report a failed "sync" nobody started. On success the outcome is cleared.
- **`appProperties.year` is now stamped on upload** (`propertiesFor()`), so the list can name a year
  without trusting a file name the teacher may have renamed. Older files fall back to the name. Nothing
  is decided by either: the pull matches on docId, and replace-or-beside follows the year inside the
  document.
- **A same-label Drive file at rev ≤ 1** (an empty year someone synced) is refused with its own
  sentence. Otherwise `adoptRemoteDocument()` would refuse it anyway, with a sentence about "saves".
- **`primeSyncChrome()` now drops an answer about a document that is no longer open.** Without this, a
  bookmark read started at sign-in for the empty year could have landed on top of the pull's bookmark.
- **A new module, `src/first-run.js`.** It is imported by `src/home.js` (the paint) and `src/shell.js`
  (the taps). `window.planbook.firstRun` exists for the harness's `doorsFor()` reading.
  `verify/drive-sign-in.mjs`'s importer allowlist gained it: now four Phase 7 files.

## Declined, and proposed follow-ups

- **The privacy wording is incomplete word for word** (trap 4). `privacy.html` and `docs/FERPA.md` say
  the library "loads first when Connect is tapped", that sign-in happens "only when Connect or the sync
  button is tapped", and that where "Connect has never been tapped, nothing is fetched from Google".
  The Drive door is a third control that does what Connect does. I did not edit either file.
  **Proposed follow-up:** one work order to name the first-run door in both files in the same sitting,
  and it should land before WO-3.18 submits.
- **`reconnect()` announces "Reconnected to Google Drive."** on a first-run sign-in. That is the wrong
  verb for a device that never connected. It is screen-reader only and a shared function, so I left it.
- **Variant A's markup is still in `first-run.html`**, now unstyled, with a caption saying why. Ruling 2
  said to delete its *rules*, and those are deleted.

## Files changed

- New: `src/first-run.js`, `tools/verify/first-run.mjs`.
- `src/store.js`: `untouchedYear()`, and the `adoptRemoteDocument()` guard.
- `src/drive-sync.js`: `listDriveYears()`, `pullYear()`, the `year` property on uploads, and the
  `primeSyncChrome()` guard.
- `src/home.js`, `src/home.css`: lifted `.home-empty-or` and `.home-empty-or-note`.
- `src/shell.js`: the hooks, `afterPull()`, and `window.planbook.firstRun`.
- `index.html`: the doors and two dialogs.
- `sw.js`: `v143`, and `first-run.js` added to `SHELL`.
- `design/mockups/proposed-phase7.css`: banner changed to lifted, variant A rules deleted.
- `design/mockups/first-run.html`: caption.
- `docs/sync.md`: new section. I restored the file's original mixed line endings after the Edit tool
  rewrote them.
- `tools/verify-shell.mjs`: registration, and the file-count comment.
- `tools/verify/drive-sign-in.mjs`: allowlist.
- `tools/verify/drive-sync.mjs`: the "no merge" check is now per path.
- `tools/README.md`: call-site count 1544 → 1561, and the ledger entry.
- `TESTING.md`: § WO-7.9.
- `plans/work-orders/phase-7-sync.md`: four ticks.

## Draft CHANGELOG entry (the teacher decides)

> **A new device can open the year you already have in Google Drive.** On a fresh install the home
> screen's empty state now offers two ways in under *Add your first class*: *Open from Google Drive*
> signs in, lists the Planbook years in your Drive by year, device and date, and opens the one you
> pick, ready to sync with the other device straight away, with no spare conflict file. *Restore a
> backup file* opens the usual restore. Both appear only on a device with nothing on it yet, and they
> go away for good once you add anything. On the iPad the first tap may only load Google's sign-in.
> Tap *Sign in to Google* once more. Sync is still not a backup.
