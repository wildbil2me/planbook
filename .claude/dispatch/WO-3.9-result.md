# WO-3.9 — Grades print & CSV · implementation result

**Route** Claude (work-order-implementer) · **Returned** 2026-08-12
**Status left on the work order** `🔨 IN PROGRESS` — two of the four Acceptance boxes are open and
both are the owner's. The roadmap box "Print/CSV for grades." is **not** ticked.

---

## What was built

**`🖨 Grade sheet`** in the score grid's toolbar opens a dialog (`#gradesRecordModal`) carrying the
printed page and a CSV of the same thing. Students down the page alphabetically by **last name** as
`Last, First`, assignments across in **due-date** order with each column carrying its due date and
point value, total percentage and letter **at the right**. No student-id column. Both surfaces carry
the class, the term, the date and the letter scale in use, and name **whose** bands those are.

That is the owner's recorded table, built as recorded. The assignment-major alternative is **not**
built and nothing in the code reaches toward it.

Shape lifted rather than re-derived, as the brief required:

- `src/attendance-report.js` + `src/attendance.css` (WO-2.6) — the print attribute on `<body>`, the
  500 ms release, the gated `@media print` block, `handToBrowser()` imported not copied, the BOM /
  CRLF / quote-only-when-needed CSV rules, the slice-per-page idiom and the `DATES_PER_SLICE`
  arithmetic (here `ASSIGNMENTS_PER_SLICE = 8`, with the millimetres written down).
- `src/detail.js` (WO-3.7) — the `…Csv(model)` split: `gradesRecord()` reads the document and returns
  a model, `gradesCsv(record)` returns bytes with no DOM in it, so the file is asserted character by
  character from the harness.
- `src/grade-engine.js` — `weightedClassGrade()` per student. **Nothing in the new file sums a
  point, resolves a band or rounds anything.**
- `src/scores.js` — two new exports, `gridOrder()` and `scoreMark()`, so the sheet's row order and
  its reading of a cell are the score grid's own rather than a second copy.

## Against the Acceptance list, one by one

### 1. 👤 The print order matches the SIS entry screen — **NOT TICKED, and cannot be**

Left `- [ ]`. Only a re-key against the live SIS closes it, and I have no SIS.

What I did verify is that the build **is** the recorded answer, on a fixture designed so it cannot
pass by accident: the roster is stored in a third order (neither the answer nor its reverse) and the
assignments are stored out of due-date order. Measured — rows come out
`["Ñuñez-Öztürk, Zoë","Ó\"Brien, Jr, Ida","Zabkowski, Abe"]` from a roster stored as
`["wo39-s3","wo39-s1","wo39-s2"]`; columns come out
`Unit 1 Test [9/18] · Cell Quiz [9/18] · Ch 1 Homework [9/25] · Practice 1–6 · Bonus poster [no due
date]` from a document order starting with Ch 1 Homework; zero id-ish columns.

**Making the assignment-major layout cheap to reach later**, since the brief asked: the model is
already the right shape for it. `gradesRecord()` returns `assignments[]` and `students[].cells[]`
keyed by assignment id, so an assignment-major renderer is a second drawing function over the same
model plus a second CSV section order — no re-derivation of the order, the arithmetic or the marks.
I did not build it and there is no switch, no flag and no dead code for it.

### 2. Percentages and letters on the printout match the app exactly — **TICKED**

"Match the app" is a claim about two surfaces, so the check asserts three things at once: the sheet
against arithmetic done by hand, against `weightedClassGrade()` through the seam, and against what
the **score grid behind the dialog is drawing** for the same three students at the same moment.
`73.00% C · 63.53% D · 122.22% A` on all three, against engine answers
`73 · 63.529411764705884 · 122.22222222222223`.

The fixture moves the weight base per student on purpose (65 with two empty categories, 45 with an
excused test) and one grade is over 100 because extra credit is a scored zero-point assignment.

### 3. The CSV opens cleanly in a spreadsheet, with rows and columns in the printout's order — **NOT TICKED**

Half measured, half owed to the owner, which is exactly how WO-2.6 and WO-3.7 left the same sentence.

Measured: the file's grid section is reassembled against the DOM's slices and every column head, row
head and cell must be the same string in the same place (it is); a BOM, no bare LF anywhere, four
sections at consistent widths (10 assignment rows × 4 cells, 3 student rows × 13); the BOM asserted
**useful** rather than only present — the same 894 bytes decoded as Windows-1252 read
`ï»¿Planbook â€” class grade sheet`; `Ó"Brien, Jr, Ida` surviving a doubled quote and two commas as
one cell; the file named `Planbook WO-3.9 Sheet WO-3.9 Term grades 2026-08-12.csv`.

**Not verified: that it opens in the spreadsheet the owner actually uses.** I have no spreadsheet.
That is now a 👤 line in `TESTING.md` § WO-3.9.

### 4. Neither surface emits accommodation, medical, or plan data — **TICKED**

`src/grades-report.js` does not import `src/supports.js` and has no path to `student.supports`, so
there is nothing to suppress in either mode. Asserted with the data planted first — five sentinels
and `"plan":"IEP"` confirmed present in the serialised document **before** anything is read — then
absent from the dialog's text, the CSV's text and the model's JSON, twice: presentation mode OFF
(where `supportsVisible()` answers true) and ON. Zero hits over surfaces of 1,503, 882 and 2,631
characters, so none of the three was empty.

## What I could not verify

- **The SIS re-key** (Acceptance 1). No SIS.
- **The CSV in a real spreadsheet** (Acceptance 3). Bytes are not Excel.
- **Paper.** The page box is measured at 740px — `panel 740px, table 740px`, so the sheet takes the
  full width rather than `.modal-panel`'s 480px — but **how many sheets it comes out on, whether a
  6pt column head is readable, and whether a row survives a page break are questions no emulator
  answers.** 👤 line added.
- **A real iPad.** The door measures `112.47 × 44` with `spill: 0` and every control in the open
  dialog clears 44px under an emulated coarse pointer at 1024px, but that is emulation. 👤 line added.
- **Human eyes on the on-screen dialog.** I read its structure through the DOM, not its appearance.

I ticked no 👤 line.

## Verification — commands I ran and what they printed

```
node tools/verify-shell.mjs   →  658 checks · 658 passed · 0 failed · 0 skipped, 205s   (exit 0)
node tools/wo-sweep.mjs       →  17 checks · 15 passed · 0 failed · 2 to review         (exit 0)
node tools/wo-gate.mjs --audit → PASS | every fragment matches exactly one roadmap box …
```

The harness run above is the **final** one, made against the tree as it now stands, after the
mutations below were reverted and `src/grades-report.js` was confirmed byte-identical to the
pre-mutation file. 22 new `check()` call sites in one new section at the foot of the file, 22
executed results, none added anywhere else. Up from 636.

Both `wo-sweep` REVIEWs were read rather than waved at:

- *sensitive field names outside `src/backup.js`* — 191 mentions across 16 files; the one file new to
  the list is `src/grades-report.js`, whose three mentions are prose in comments (plus the note the
  dialog prints to the teacher). No `supports` identifier in executable code, no import of
  `src/supports.js`.
- *due-date and late/missing on the same line* — `src/grades-report.js:509`, the printed note stating
  the rule it is flagged for: *"late and missing are only ever there because you marked them."*

**Three mutations, all reverted**, each a full run:

| Mutation | Result |
|---|---|
| `sheetOrder()` returns the list untouched (document order) | **3 red** — `658 · 655 · 3` |
| A blank cell prints `0` | **1 red** — `658 · 657 · 1` |
| Rows resolved in stored roster order instead of `gridOrder()` | **3 red** — `658 · 655 · 3` |

The second is the one worth keeping: the hand-written cell matrix caught it and **the CSV-versus-page
comparison stayed green**, because both surfaces take their strings from one function by design. The
two checks are complementary rather than redundant, and the mutation is what established that.

## Files changed

- `c:\dev\planbook\src\grades-report.js` — **new.** The model, the dialog, the print gate, the CSV.
- `c:\dev\planbook\src\scores.js` — exported `gridOrder()`; added and exported `scoreMark()`.
- `c:\dev\planbook\src\scores.css` — § THE CLASS'S GRADE SHEET, the coarse-block additions, and the
  app's third `@media print` block.
- `c:\dev\planbook\index.html` — the toolbar door and `#gradesRecordModal`.
- `c:\dev\planbook\src\shell.js` — import, three delegated hooks, hook documentation, seam entry.
- `c:\dev\planbook\src\attendance.css`, `c:\dev\planbook\src\detail.css` — the two stale print-block
  censuses corrected ("the one" / "the second" → first of three / second of three). In scope per the
  brief; they are the only census there is.
- `c:\dev\planbook\sw.js` — `src/grades-report.js` added to `SHELL`, `CACHE` → `planbook-shell-v48`.
- `c:\dev\planbook\tools\verify-shell.mjs` — the WO-3.9 section (22 checks); one stale comment in the
  WO-3.7 teardown corrected ("this is the last section in the file").
- `c:\dev\planbook\tools\README.md` — call-site count 637 → 659, the executed-count paragraph, the
  gap paragraph, and a WO-3.9 block.
- `c:\dev\planbook\TESTING.md` — § WO-3.9: what it adds, the four acceptance lines with evidence, four
  👤 lines, the desk-half summary and the mutation table.
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — status `🤖 CLAIMED` → `🔨 IN PROGRESS`,
  Acceptance 2 and 4 ticked with evidence, 1 and 3 annotated and left open.

Not touched: `CHANGELOG.md` (the teacher's), `ROADMAP.md` (its box stays unticked while two
acceptance lines are open). Nothing committed, nothing pushed.

## Decisions the work order did not settle

1. **Surface: a dialog over the score grid, not a print of the grid itself.** `gradebook-surfaces.md`
   says a task you finish and dismiss is a modal, and WO-2.6 made the identical call one screen over.
   The artifact argues it too: the grid's columns are in the teacher's order and this sheet's are by
   due date, its cells are ~250 live `<input>`s, and its grade is frozen beside the name where this
   sheet's total belongs at the right.
2. **Undated work sorts last, not first.** A due date is optional (`src/assignments.js` decision 1)
   and has no place in a due-date order. Last, because a sheet whose first columns are the undated
   ones opens on the work least likely to be what is being typed in.
3. **A same-day tie keeps the teacher's own order** — the order the assignment list draws with its
   ↑ ↓. Written as an explicit index rather than leaning on `Array#sort` stability, so it is a rule
   somebody chose rather than a property somebody relied on.
4. **A blank prints as nothing at all**, on both surfaces. This is a deliberate departure from
   `src/attendance-report.js`, which draws a dash into a blank because an empty attendance cell would
   read as "present"; the departure is stated in a comment at the point it happens, per `CLAUDE.md`.
   The deliverable's own words are "a blank stays blank", an empty cell is what ungraded looks like,
   and a dash in a column of scores is a character a re-keying teacher has to decide about. The key
   under the table names all four cell states in words.
5. **A late score prints `18 L`, missing prints `M`, excused prints `Ex`** — one function makes the
   string and both surfaces call it, which is what makes "the printout and the file must not
   disagree" true by construction rather than by promise.
6. **The CSV has one `Student` column holding `Last, First`**, where WO-2.6's attendance CSV splits
   Last Name and First Name. That file is Roll Call!'s column-for-column; this one is a copy of a
   sheet whose name display the owner pinned as the join against the SIS, and two columns here would
   be a file whose first column is not the sheet's first column. Stated in a comment at the point of
   departure.
7. **The class grade CSV and the per-student CSV share the `Planbook … grades <date>` family**; what
   tells them apart in a folder is the student's name between "Planbook" and the class on the
   per-student one. Noted in `csvName()`.
8. **`gridOrder()` and `scoreMark()` exported from `src/scores.js`** rather than reimplemented. The
   alternative was a third copy of "a cell is always an object" and a second comparator for names —
   both the kind of second answer this repo keeps refusing.

## Temptations declined (out of scope — proposed follow-ups, not done)

- **A door on the assignment list as well as the score grid.** One route, one door, and the switcher
  is two inches away. Not built.
- **Per-assignment averages in a `<tfoot>`** on the printed sheet — the score grid's own drawing has
  them and `src/scores.css` records that they are not in WO-3.5's deliverables. They are not in
  WO-3.9's either. A sheet that carried a class mean per column would be genuinely useful at a
  department meeting; that is a work order, not a line item.
- **A "print all five classes" control.** The obvious next ask for a teacher doing a whole marking
  period, and it collides with a rule that has already been paid for: an installed iPad PWA gets
  structurally **one download per tap** (`src/backup.js`), so five files means an archive, not a
  loop. Worth its own work order with `src/zip.js` in scope.
- **A column-width or landscape option.** `@page` is document-level and cannot be gated per surface,
  so landscape for this sheet alone would need a rethink of the one `@page` rule the whole app
  shares. Named here rather than attempted.
- **Widening `#scoresView`'s `VIEW_PLAN` floor** in the standing coarse sweep now that the toolbar has
  a second control. Left alone: the floor is measured against the state the run's document is in at
  that point (no roster, no assignments, toolbar hidden), and raising it would fail a correct build.

## Draft CHANGELOG entry — yours to accept, reword or bin

> **Grade sheets you can print and re-key from.** A class's whole term on one page: 🖨 Grade sheet on
> the Scores screen opens the sheet in the order the SIS is typed in — students down the page by last
> name, assignments across by due date, each column carrying its due date and what it is out of, and
> the grade and letter at the right. The same thing downloads as a CSV in the same order. Your marks
> print as your marks — a late score keeps its number and its L, missing is M, excused is Ex — and an
> ungraded cell prints as nothing, because a blank is not a zero. Nothing from a student's support
> details is on either one, in either mode.
