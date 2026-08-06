# Result — WO-1.5 Backup & restore

**Branch:** `phase/1-shell-store-roster`, uncommitted, working tree left for the verifier.
**Harness:** `node tools/verify-shell.mjs` — **before: 54 checks · 54 passed · 0 failed · 0 skipped**;
**after: 79 checks · 79 passed · 0 failed · 0 skipped.** Run three times end to end, green each
time (no intermittency observed).

Nothing under `plans/`, `CHANGELOG.md`, or `TESTING.md` was touched. No roadmap or work-order box
ticked. No commit, no branch.

---

## 1. Against §7's "what done means", one line each

**1. Download → wipe browser storage → restore: the document is byte-identical in content. ✅**
`verify-shell.mjs:1075-1113` — builds the file, deletes the `2026-2027` record out of IndexedDB,
reloads the page (boot then opens a different year, as a wiped device would), restores through the
confirm, and compares the stored record against `JSON.parse(fileText)` with `rev` and `updatedAt`
removed. `PASS | download → wipe the year out of storage → restore gives the document back,
identical in content :: restored 2026-2027 at rev 6 from a file at rev 5`. The same comparison runs
on the overwrite path at `verify-shell.mjs:1013` (`identical: true`).
**"In content" is doing work, deliberately:** `rev` and `updatedAt` move on a restore, and the
reasoning is written out at `src/store.js:543-561`. The restored document takes
`max(this device's rev for that year, the file's rev) + 1` so that `rev` never goes backwards for
a year on a device, and a later sync can never compare against a rev the document never had
(`docs/sync.md`). A restored old file therefore legitimately supersedes the Drive copy rather than
quietly losing to it. Everything the teacher typed — including `docId` — comes back exactly.

**2. The restore confirm names the outgoing document and the incoming one, with counts, before
anything is replaced. ✅** `src/backup.js:325-372`, markup `index.html:510-528`. Verified at
`verify-shell.mjs:962-978`: the dialog is open, the compare block contains "On this device now"
and "In the backup file", `3 students` and `2 students`, the year twice, and "Last saved" twice,
and the confirm button reads `Replace 2026-2027`. Actual rendered text in the run log:
`On this device now 2026-2027 1 class · 3 students Last saved Aug 4, 2026, 2:25 PM 6 saves behind
it / In the backup file 2026-2027 1 class · 2 students Last saved Aug 4, 2026, 2:25 PM 5 saves
behind it`. The outgoing side is read raw off disk (`store.readStoredDocument`, never opened), so
it also describes a document `boot()` refuses.

**3. Cancelling the confirm leaves the existing document untouched. ✅**
`verify-shell.mjs:979-999` clicks the real `[data-backup-cancel]` button and then reads the record
back out of IndexedDB: 3 students in memory and 3 on disk, `rev` unmoved, status line "Restore
cancelled. The 2026-2027 school year is exactly as before." Structurally there is nothing to undo —
the only write in the module is `store.restoreDocument()`, reached only from `confirmRestore()`.

**4. A malformed or non-Planbook JSON file is refused with a message saying what was wrong, and
does not partially apply. ✅** Six files driven at `verify-shell.mjs:915-960`: empty, truncated
JSON, a shopping list, a newer `schemaVersion`, a document with `students`/`scores` deleted, and
one with `students` as a string. All six refused, none reached the confirm, all six messages end
with "Nothing on this device has been changed.", and each names its own fault (checked
individually, not as one generic string). `rev`, `docId` and the roster are identical before and
after all six.

**5. A backup from a different `schemaVersion` either migrates or refuses — never half-loads. ✅**
`src/backup.js:255-266` runs `migrateDocument()` — the existing ladder, which refuses a newer
version and refuses a gap — *before* the shape check, so an older document is legitimately allowed
to be missing whatever its migration adds. The refusal is verified above (#4, the schema-99 case:
"the document for 2026-2027 was written by a newer version of Planbook"). The migrate-and-accept
half is exercised as the boot-failure recovery (#8) and by the store's own migration checks, which
still pass. If a step ever throws mid-ladder, nothing has been written: the whole parse runs on an
in-memory object.

**6. The nag appears when the last backup is >7 days old and clears on a successful download. ✅**
`src/backup.js:508-538`, markup `index.html:180-201`. `verify-shell.mjs:876-913` samples four
states rather than one: hidden at 2 days, shown at 8 days with the lead reading "Your last Planbook
backup was 8 days ago.", shown when there has never been a backup, and hidden again immediately
after a real `downloadBackup()`, with `planbook_lastBackupAt` stamped within 120s of now.
**One judgment the work order left open:** the nag stays down when the open document holds nothing
a teacher typed (no classes, students, assignments, attendance, log, events or templates). Nagging
about backing up an empty gradebook on day one is precisely the "train dismissal" failure the work
order warns against, and it is the same argument the install banner's own comment makes about amber
vs red. Stated at `src/backup.js:498-506`.

**7. The backup UI says what sensitive data the file contains. ✅** `index.html:471-484`, checked
at `verify-shell.mjs:871-879` for *accommodation*, *IEP*, *504*, *medical* and *behavior plan* in
the panel's rendered text. Copy: "It also contains the support details you keep on students —
accommodations, IEP and 504 plans, medical needs, and behavior plans. That is on purpose: a backup
that left them out would not bring your gradebook back," plus a paragraph that it is plain text and
should be kept like a paper folder, not emailed. The file is **not** filtered — there is a check
(`verify-shell.mjs:867-870`) asserting a seeded `medical` string and `"plan": "IEP"` are still in
the downloaded bytes, so a later work order cannot quietly "fix" this for safety without a red run.

**8. A document `boot()` refuses leaves a reachable way to restore. ✅** Button at
`index.html:88-96` inside `#loadingError`, styled `src/shell.css:88-97`. `verify-shell.mjs:1121-1197`
poisons the stored record to `schemaVersion: 99`, points `planbook_openYear` at it, reloads, polls
for the failure (no fixed sleep), and asserts the loading screen is still up and says why; then
**clicks the button on that screen**, gets the panel, restores, and asserts the loading screen came
down with the app on the restored year and `schemaVersion` back to 1. The download button correctly
reads "Nothing open to back up" and is disabled in that state (`src/backup.js:545-556`), because
there is no document to download and a button that fails on tap is worse than one that says so.

---

## 2. Verified beyond the eight lines

- **Both real entry points**, `verify-shell.mjs:1027-1073`: a `DragEvent` carrying a real `File` in
  a `DataTransfer` highlights the drop zone and lands in the confirm; `input.files` + a `change`
  event does the same and the input is cleared afterwards so the same file can be chosen twice; and
  a file dropped anywhere else on the page does nothing **and has its default prevented** — a
  browser handed a file it was not offered navigates to it, which would replace the running app
  with a page of JSON and take the in-memory year document with it (`src/shell.js:128-152`).
- **44px**, `verify-shell.mjs:1272-1327`: the backup panel and the restore confirm are opened and
  measured under the emulated coarse pointer (6 controls, none under 44), plus a separate check on
  `::file-selector-button`'s own `min-height` — a 44px `<input type=file>` wrapped around a 20px
  native button is the WO-1.2 `.search-box` defect in a new control. The general sweep rose from 23
  to 24 visible controls (the new header button) and stays clean.
- **No horizontal overflow** at 1024/768/390 with the third header button in place.
- The existing 54 checks all still pass unchanged, including the focus-ring, no-`var()`, and
  `planbook_`-keys-only sweeps.

## 3. Not verified — owed to a human 🙋

- **A real drag out of Finder or the Files app** on Safari/iPadOS. The harness drives a synthesized
  `DragEvent` with a real `File`; everything from the event inward is the production path, but
  Safari's own drag session is not exercised.
- **A real download.** `downloadBackup()` is driven for real, but in headless Chromium with
  `Browser.setDownloadBehavior` pointed at the throwaway profile. That the file lands where an
  iPadOS teacher can find it again (Files → On My iPad), and that an installed PWA can download at
  all, needs the device.
- **A thumb on any of it**, and the boot-failure exit button seen on a real screen. That button is
  the one control the harness cannot measure — it only exists while boot has failed, and every
  measurement pass needs an app that booted — so its 44px is asserted from its computed rule
  (`verify-shell.mjs:1317-1327`) and labelled as a rule rather than a measurement.
- **`::file-selector-button` rendering in Safari.** Supported since 14.1; the styling is verified
  computed in Chromium only.

## 4. Files

| File | Change |
|---|---|
| `src/backup.js` | **new, 563 lines.** Download, validation, the confirm, the nag, the drop/file paths |
| `src/store.js` | +67. `readStoredDocument()` and `restoreDocument()` — the swap, and the `rev` reasoning |
| `src/prefs.js` | +14. `lastBackupAt` declared in `PREF_DEFAULTS` with its comment |
| `src/shell.js` | +59. Six new `data-*` hooks in the table and the listener, a `change` listener, three drag listeners, `refreshBackupNag()` at boot, `backup` on the console seam |
| `index.html` | +136. Header button, nag strip, backup panel, restore confirm, boot-failure exit, About-modal copy |
| `src/shell.css` | +131. Nag, panel, drop target, compare block, `.danger` / `:disabled` button variants, loading-error button, and every one of them in the `@media (pointer: coarse)` block in the same pass |
| `sw.js` | +3. `./src/backup.js` precached, `CACHE` bumped `v2` → `v3` |
| `tools/verify-shell.mjs` | +447. The backup section (22 checks) and the backup-modal touch pass (3) |

## 5. Decisions the work order did not settle

1. **A restore replaces the year named in the file, not the year that is open** — and then switches
   to it. Renaming the incoming document to the open year would put two years of grades in one
   record; refusing a cross-year file would make a restore impossible on a device that has moved on.
   The confirm says which year is being replaced, and adds an explicit line — "The year you have
   open, 2030-2031, is not touched by this" — whenever they differ. `src/store.js:543-549`, checked
   at `verify-shell.mjs:1101-1107`.
2. **`rev` continues this device's count** rather than reverting to the file's; **`updatedAt`
   becomes now.** Reasoning in full at `src/store.js:550-557` and summarised under #1 above.
3. **The nag does not appear for a document with nothing in it** (#6 above).
4. **The nag has no "Not now."** The install banner above it can be snoozed because acting on it
   means installing an app; the way to clear this one is to tap the button beside it, and that
   always works. A snooze here is a snooze on the only copy of a term of grades. `src/backup.js:508-521`.
5. **The save chip is not touched by a backup or a restore.** The chip means "did a save land"; a
   restore reports in its own dialog, exactly as the year picker's errors do.
6. **The file is pretty-printed** (2 spaces, ~25% larger). It is the artifact a teacher opens when
   everything else has gone wrong, sometimes in a text editor to prove her students are still in
   there, and one 4 MB line proves nothing. `src/backup.js:130-138`.
7. **The panel is reached from a header icon button**, not from the component shelf — it has to
   still be reachable when everything else has gone wrong, and the shelf disappears at WO-1.10.
8. **`lastBackupAt` records that the file was offered**, not that it was saved; a page is never told
   whether the save dialog was confirmed. Written out in `PREF_DEFAULTS` rather than left implicit.

## 6. Out of scope — noted, not done

- **Automatic/scheduled backups** and **Drive**: explicitly out of scope, and out of reach anyway
  (no background execution; `docs/sync.md` says a browser-only token flow cannot sync in the
  background).
- **A "backup all years at once" button.** The nag and the download are per-year, because the open
  document is what `getDoc()` returns. A teacher with two live years has to switch and download
  twice, and nothing tells her so. Tempting, and outside the Deliverables — worth a follow-up work
  order rather than a quiet addition here.
- **Restoring a single class or student out of a backup file.** Deliberately not built: the whole
  point of one-document-per-year is that the unit of recovery is the year.
- **`docs/FERPA.md`.** Referenced by `CLAUDE.md` and `docs/data-model.md`, still absent, and the
  brief says it belongs to a later phase. The obligation to say what is in the file was met in the
  UI instead.
- **`tools/README.md` still says verify-shell "went green at WO-1.3, 28 of 28."** It was already
  stale at 54 before this work order; it is now stale at 79. Left alone — it is documentation
  maintenance, and the teacher does maintenance after the verifier reports.
- **`CHANGELOG.md` / `TESTING.md` entries and the roadmap tick** for this work order: not written,
  by rule. TESTING.md in particular now owes 👤 items for the real download, the real drop, and the
  boot-failure exit on hardware.
