# WO-1.23 — import a class's students and contacts from the SIS CSV · implementation result

**Route** Claude (work-order-implementer), Opus · **Date** 2026-08-18
**Brief** `.claude/dispatch/WO-1.23-brief.md` · **Work order**
`plans/work-orders/phase-1-shell-store-roster.md:1745`

**Verdict in one line:** built and green on the delivered tree — `verify-shell.mjs` **893 checks ·
893 passed · 0 failed · 0 skipped**, exit 0; `wo-sweep.mjs` **21 · 19 passed · 0 failed · 2 to
review**, exit 0. Eighteen of the nineteen Acceptance lines are ticked with evidence below. The
nineteenth is the 👤 iPad line and is **not** ticked: I have no device, and one part of it is not
even reachable from a script (see § "What I could not verify").

---

## 1. What I built, and where

| Absolute path | What changed |
|---|---|
| `c:\dev\planbook\src\roster-import.js` | **New**, 1,005 lines. The whole feature: a real CSV reader, the name-cell parser, the phone splitter, the column-1 grouping, student and guardian matching, the two writing rules, the preview dialog and the commit. |
| `c:\dev\planbook\src\roster.js` | `nameKey()`, `newStudent()` and `newGuardian()` exported (were module-private); `phone`/`phone2` on `newStudent()`, `phone2` on `newGuardian()`; both added to the editor allowlists; a **Second phone** field under the guardian card's Phone; the two student fields filled in `renderStudentEditor()`; a header paragraph naming the second door and the one-way rule. |
| `c:\dev\planbook\src\shell.js` | `import * as rosterImport`; five new `data-*` hooks in the inventory block and in the click / `change` / `input` listeners; a `rosterImport` entry on the `window.planbook` seam with its reasoning. |
| `c:\dev\planbook\index.html` | The `Import contacts from a file` button in the existing `.roster-actions` row directly after `Paste a list of names`; one sentence added to the hint beneath it; the whole `#rosterImportModal`; the student editor's Email/Phone/Second phone grid. |
| `c:\dev\planbook\src\shell.css` | `.import-file` (+ `::file-selector-button`), `.import-meta`, `.import-contacts`, `.import-contact-line`, `.import-summary`, and every one of them in the `@media (pointer: coarse)` block in the same pass. |
| `c:\dev\planbook\sw.js` | `./src/roster-import.js` added to `SHELL`; `CACHE` bumped `planbook-shell-v74` → **`planbook-shell-v75`**. |
| `c:\dev\planbook\docs\data-model.md` | `phone`/`phone2` into the student sketch and `phone2` into the guardian sketch, with the reason; a new **§ Importing the SIS contact list** sited directly after § Importing from Roll Call!, opening with one paragraph on how the two differ. |
| `c:\dev\planbook\src\README.md` | A convention bullet naming the module and the one-way import rule (see decision 2 below — there is no per-module table in that file to add a row to). |
| `c:\dev\planbook\tools\verify-shell.mjs` | A new section at the foot (31 call sites) driving the import through the real file input, plus 3 call sites in the coarse-pointer sweep; two pre-existing student-key enumerations updated for `phone`/`phone2`; `window.__student` reads the three new fields. |
| `c:\dev\planbook\tools\README.md` | The recorded `check()` call-site count 835 → **869**, with the WO-1.23 entry in the running narrative (sited after WO-3.25's, not inside it). |
| `c:\dev\planbook\TESTING.md` | A § WO-1.23 desk pass with the acceptance list and the numbers, sited after WO-1.22 and before Phase 2. |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | Acceptance boxes ticked — every one except the 👤 line. **Status left at `🤖 CLAIMED`** (decision 11). |

**Two modified files in `git status` are not mine:** `plans/work-orders/README.md` and
`plans/work-orders/phase-2-attendance.md`. The orchestrator booked WO-2.50 and WO-2.51 into them
while I was working; I did not touch either, and my diffstat above excludes them.

---

## 2. Acceptance, line by line, with the evidence

Every line below is asserted in `tools/verify-shell.mjs` § *"importing contacts from the SIS CSV
(WO-1.23)"* unless stated otherwise, driven **through the real controls**: the roster panel's own
button, the file input handed a real `File` inside a `DataTransfer` (which is what the Files picker
delivers), the preview's own toggles and fields, and the commit button. Expected values are written
out in the harness rather than computed, so the check cannot agree with the parser it is checking.

1. **Six sample rows → exactly two students.** ✅ `the six sample rows preview as exactly TWO
   students…` and `committing produces exactly two students and no third`. The all-empty rows add
   nobody, the two continuation rows become guardians, and `Smith` / `Smitha` stay two records with
   different ids.
2. **`Smith, Jonathan (John) '28` → the six fields.** ✅ `"Smith, Jonathan (John) '28" lands as
   first Jonathan, last Smith, nickname John, gradYear "2028" (a string)…`. `typeof gradYear ===
   'string'` is asserted, and the phone keeps its `(H)` marker.
3. **Counselor reads `Mike Smith`, flipped.** ✅ `the advisor lands on the counselor with the name
   FLIPPED`.
4. **Two guardians, in file order, markers verbatim, `relation` empty.** ✅ `both guardians are
   there, in file order…` — the whole five-tuple per guardian is compared as one JSON string, so a
   single lost marker fails it.
5. **Both on the class roster and in `doc.students`; no other roster changed.** ✅ `both students are
   on the open class's roster and in doc.students, and no other class's roster changed` — the roster
   of *every* class is snapshotted before and compared after.
6. **Same file twice changes nothing.** ✅ `and importing it a second time changes NOTHING…` — and
   **`rev` does not move**, because a write that is a copy of what is stored produces no operation
   at all (decision 5). `preferred` is still on guardian 1 and off guardian 2.
7. **A changed parent email updates in place.** ✅ Two checks, one per matching direction: changed
   *email* → matched on **name**; changed *name* → matched on **email**. Never a third card, and
   `preferred` stays put.
8. **Empty cell keeps the typed phone; a different one wins.** ✅ Two checks against a planted
   student carrying `phone: '555-0100 (typed by hand)'`.
9. **`supports` identical, field for field; a created student gets `newSupports()`'s defaults.** ✅
   Two checks. The first lifts the whole `supports` block as JSON *before* any import and compares
   it after **two** imports that both wrote to that student's record. The second compares the two
   created students' blocks against `window.planbook.supports.newSupports()` read from the app
   rather than hardcoded. Structurally: `src/roster-import.js` imports `src/supports.js` for
   nothing, and there is no path from any of the eight columns to that block.
10. **Already in the year, another class → linked, not copied.** ✅ `she is LINKED into the open
    class rather than copied` — `doc.students.length` unchanged, the same id on both rosters, and
    the contacts on the one record.
11. **Header row skipped; the headerless sample keeps its first student.** ✅ Two clauses of one
    pair of checks; the header file previews the same two names, and committing it links them into
    a second class without creating a third record.
12. **`recordCsv()`'s output reads back clean.** ✅ `a CSV written by recordCsv() — BOM, CRLF, a
    quoted cell holding a comma, a doubled quote — reads back with an unmangled first cell, no
    stray \r, and each quoted cell whole`. This is the one check that uses the new seam
    (`readCsvRows`), and § 4 decision 3 says why it has to.
13. **Three numbers in a cell.** ✅ `a parent phone cell holding THREE numbers keeps all three`.
14. **The refusals write nothing.** ✅ Three checks: the orphan continuation row (reported, students
    under it still import), the three hard refusals (a JSON file, an empty file, a short row — each
    with its own sentence and no preview), and `every one of those refusals left the document
    exactly where it was — same rev, same students, same rosters`.
15. **The preview shows everything, the edit commits, a skipped row writes nothing.** ✅ `the name
    fields are editable and the EDIT is what gets committed…` — `Alpha` typed to `Alphabet` lands
    as `Alphabet`, and the row toggled off leaves no `Beta` in the document at all.
16. **Same file twice fires the preview both times.** ✅ **Partially, and I want to be exact about
    which part.** Asserted: the preview is rebuilt from the file both times (a row toggled to Skip
    between the two reads comes back as Import), and `input.value === ''` after **every** read,
    refusals included — that clear is the mechanism that makes the browser re-fire `change`. Not
    asserted: the browser's own decision to fire it, because the harness dispatches the event
    itself. That half is on the 👤 line and is written into the harness comment, `TESTING.md` and
    `tools/README.md`.
17. **The editor shows and saves the new fields.** ✅ One check reads `#studentPhone`,
    `#studentPhone2` and both guardian phone fields as the dialog opens on an imported student, then
    types into two of them and reads the document back.
18. **`verify-shell.mjs` green, 44px sweep over the new dialog included.** ✅ **Ticked, and here is
    the run I read:**

    ```
    ================ SUMMARY ================
    893 checks · 893 passed · 0 failed · 0 skipped
    23,732 lines · 26.6 lines per check · 289s
    EXIT=0
    ```

    The coarse-pointer sweep gained `every control in the contact import measures >=44px, the file
    input and the preview row included  :: measured 7; under = []` and `the contact import's own
    native file button carries a 44px minimum, not just the input around it  :: min-height = 44px,
    padding = 8px 14px`.
19. **👤 iPad.** ❌ **Not ticked.** See § 3.

`node tools/wo-sweep.mjs` — `21 checks · 19 passed · 0 failed · 2 to review`, exit 0. Both REVIEWs
are the standing ones. The sensitive-field-name sweep now names `src/roster-import.js`: its only
mentions of `supports`/`accommodation`/`medical` are in the header paragraph that says the module
never writes one, and there is no code path there that reads or writes the block. The
due-date/`late`/`missing` REVIEW names no file this work order touched.

### Three runs, and why there were three

The first run (295s) found one genuine defect **in the harness rather than the app**: a second,
pre-existing student-key enumeration in the support-details section listed ten keys and now sees
twelve. `892 passed · 1 failed`. Fixed by adding `phone`/`phone2` to that list, and re-run: `893
passed · 0 failed`, 294s. I then removed a `<code>` element from the new dialog's copy (it would
have been the only one in `index.html`) and re-ran a third time so that the number I report is the
tree I am delivering: **893 · 893 · 0 · 0, 289s, exit 0**. All three runs completed here; none of
them is a prediction.

---

## 3. What I could not verify

- **The 👤 line, in full.** No iPad. Three separate things are owed to the device: whether the input
  opens the Files sheet, whether a `.csv` in iCloud Drive is selectable at all through
  `accept=".csv,text/csv"` (iPadOS has been fussy about UTI matching), and whether a **real**
  section's export has the eight columns this reader expects. Also thumb-hittability of the preview
  toggles on glass — the 44px half is measured, the *feel* is not.
- **That the browser re-fires `change` for the same file.** As above (line 16). The harness sets
  `input.files` and dispatches `change` itself, so it can only prove the mechanism (`input.value`
  cleared), not the browser's behaviour. `src/backup.js`'s file input has the same limit and the
  same claim.
- **The service worker.** `verify-shell.mjs` has never seen one. That `./src/roster-import.js` is in
  `SHELL` and `CACHE` is at `v75` is read off disk by `wo-sweep.mjs`; whether the installed app picks
  the new module up offline is a device reading, and the standing force-quit procedure applies.
- **Nothing else.** Everything I ticked, I ran and read.

---

## 4. Decisions the work order did not settle

1. **`newStudent()` and `newGuardian()` are exported too.** The Deliverables name four imports
   (`parseRosterLine`, `fullName`, `renderRoster`, `nameKey`), and the importer also has to *create*
   records. The alternative was an object literal in `src/roster-import.js`, which is a second
   definition of the student record shape — and the one that eventually forgets `supports`, a field
   that may not be absent (`src/store.js:102-104`). I exported the two constructors instead, with the
   reason written at the export. The dependency still runs one way.
2. **`src/README.md` has no per-module table**, so "gains its row" had nowhere literal to go. Adding
   a forty-row module table would be inventing a list nothing maintains — the thing `CLAUDE.md`
   warns about for progress counts. It landed as a bullet under **The convention**, naming the module
   and stating the one-way rule with `src/categories.js` → `src/classes.js` as its precedent. Say the
   word and I will reshape it.
3. **One read-only seam function.** Acceptance line 12 is about reading back what
   `src/attendance-report.js` *writes*, and that file is eight columns of attendance rather than
   eight columns of contacts — the importer would rightly refuse it, so it cannot be driven through
   the dialog. `readCsvRows()` is exported for the harness and for nothing else, the same standing
   `parseRosterLine()` has. Everything else in the section is driven through real controls.
4. **A `here` row is included by default** — the opposite of the paste box's `here`, which is off.
   Re-importing a corrected file is *how a teacher fixes twenty-five phone numbers*, so defaulting it
   off would make the second import the hard case. What makes it safe is the two writing rules, not
   the tick, and acceptance line 6 is the proof.
5. **A commit that would write nothing calls `update()` not at all**, so `rev` does not move on a
   no-op re-import and the dialog says *"Every student in that file is already on this roster with
   these contacts, so nothing changed."* This follows `supportDateCommitted()`'s precedent (do not
   save the document over an identical copy of itself) and makes acceptance 6 a stronger claim than
   it asks for.
6. **The name is never written onto an existing record.** It is the key the match was made on, so it
   is already equal but for case and spacing, and the teacher's spelling of her own student's name
   beats the export's.
7. **"A row with fewer columns than the name cell needs" is implemented as: every non-empty row must
   carry all eight cells**, and a short row refuses the whole file naming the row number. An
   all-empty row is skipped *before* that test, so a hand-trimmed blank line costs nobody an import.
   I also added a **JSON sniff** (a file starting `{` or `[` is named as a backup and pointed at the
   backup panel) — it is the file most likely to be chosen here by mistake, and "no students could be
   read" would send the teacher looking for a fault in a perfectly good file.
8. **A two-digit grad year is read as this century** (`'28` → `2028`). A roster is a list of people
   who have not graduated yet; the alternative is a pivot-year rule for a field nothing computes
   with. Written down at the function.
9. **The preview row wears the paste preview's own `.paste-*` classes.** It *is* that row — same two
   editable fields, same toggle, same amber — so the two dialogs measure identically and a change to
   one reaches the other. Renaming those classes to something neutral would mean editing the paste
   path's markup, which this work order may not touch. Said out loud in both the CSS and the module.
10. **The orphan-row sentence goes on the error line.** The Deliverables ask for it "in the preview
    as a skipped row saying why"; the Acceptance asks for "a sentence on the dialog's error line".
    Both are satisfied: the students under it import normally and the error line names the row and
    why it was left out. I did not build a third row type for it — a row with no name, no toggle and
    no fields inside a list of editable students is furniture.
11. **Status left at `🤖 CLAIMED`.** `plans/work-orders/README.md` says the exit from `🤖` is
    `--tick` on work that landed, and that a work order landing with a line it cannot close is
    `✅ DONE` with an `**Owes**` field. Whether this landed is the verifier's call and the `Owes`
    wording is the orchestrator's, so I ticked the boxes and left the status and the dashboards
    alone.
12. **No `schemaVersion` bump.** `phone`, `phone2` and `guardians[].phone2` are optional strings; a
    record written by an older build simply lacks the keys, every reader treats a missing string as
    empty, and the editor writes one the first time it is typed into. A migration that stamped `''`
    onto every student would rewrite the whole document to add nothing.

---

## 5. Proposed follow-up work orders (nothing here was built)

- **`.xlsx` for the same importer.** Explicitly out of scope, and `src/zip.js` already makes it
  possible. Worth booking only if the owner's SIS starts exporting `.xlsx` by default — nothing in
  what I wrote pre-builds for it.
- **A column-header mapping for a re-ordered export.** Today the eight columns are positional, and a
  header row is skipped rather than read. If the SIS ever re-orders or inserts a column, this reads
  the wrong field into the wrong place and the preview is the only thing that would show it. Reading
  the header *when there is one* and mapping by name is a small, self-contained work order — **and it
  is the one that must not quietly acquire a `Notes` → `supports` mapping** (the work order's own
  warning).
- **An "imported on" note per student, or an import log.** There is no record afterwards of which
  fields came from a file and which the teacher typed, so "the SIS overwrote my correction" has no
  answer but the backup. Probably Phase 8 territory; genuinely out of scope here.
- **`guardians[].language` has no column** and stays at `newGuardian()`'s `'en'`. If the export ever
  carries a preferred-language column, that is a one-line mapping *and* a Phase 5 decision about what
  it changes.
- **`wo-sweep.mjs` § 5 now names `src/roster-import.js`** because the file's header spends four
  paragraphs saying it never writes a support field. I deliberately did **not** propose an allowlist
  entry for it: that sweep is a REVIEW precisely so a human reads each mention, and a file that talks
  about `supports` at length is exactly the file worth re-reading. Naming it here so the next reader
  knows the mention was expected.

**Temptations I declined**, in the work order's words rather than mine: editing contact fields inside
the preview; inferring `relation` from `Mr.`/`Mrs.`; normalising or reformatting a phone number;
`tel:` links; a "remove students who are not in the file" option (never remove); refactoring
`openPaste()`'s row renderer so the two dialogs share one (it would edit the paste path); renaming
`.paste-*`. None of them is in the tree.

---

## 6. Draft CHANGELOG entry — **not written to `CHANGELOG.md`**; yours to decide

```markdown
### Added
- **Import a class's students and contacts from your school system's file.** The Roster & contacts
  panel has a second button beside "Paste a list of names": choose the `.csv` your SIS exports for a
  section, and Planbook reads the whole thing — student name, email and phone, the advisor, and one
  or two parents with their phone numbers and email addresses. It shows you every student it found
  before it writes anything, with the name split into two fields you can correct and the contacts it
  read shown beside them, and a line per row saying exactly what importing that row would change.
  A student already in the school year is recognised and linked into this class rather than
  duplicated, and a guardian already on file is updated rather than added a second time — so
  importing a corrected file a week later fixes what changed and touches nothing else. An empty cell
  never clears a field you typed by hand. Nothing in the file reaches accommodations, plans or
  medical needs: they are not in the export, and this importer has no path to them.
- Students and guardians can now hold **two phone numbers**, which is what the export carries and
  what the student editor and guardian card now show.
```

---

## 7. Notes for whoever reads this in six months

- **The four mapping decisions and the two writing rules are the owner's**, taken at booking. I
  implemented them as written and found nothing in them I would argue with — the flipped counselor
  name and the empty `relation` in particular are the two a later reader will be tempted to "fix",
  and both are right for reasons the module header states.
- **`src/roster-import.js` imports `src/roster.js` and never the reverse.** The header says so in
  the shape `src/categories.js` uses; `src/roster.js`'s own header now points at it; `src/shell.js`
  dispatches the open. If a later work order needs the roster to reach the importer, the answer is
  another hook in `src/shell.js`, not an import.
- **`writesFor()` is the single source of "what would this row do".** The preview's summary line
  counts its operations and the commit executes them. Adding a field to the import means adding it
  there once, not in two places that then disagree.
