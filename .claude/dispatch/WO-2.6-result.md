# WO-2.6 — Attendance history & output · result

**Implementer** Claude (Opus), work-order-implementer · **Date** 2026-08-11
**Status written to the tracker** `🔨 IN PROGRESS` — three of four Acceptance lines ticked, one
deliberately left open (see line 3 below). `wo-gate.mjs --tick` refused `✅ DONE` and left the
roadmap boxes alone, which is correct.

---

## Verification — both commands, on the tree as it stands

Both were run to completion and the numbers below are quoted from output I read.

```
node tools/verify-shell.mjs
  582 checks · 582 passed · 0 failed · 0 skipped
  14,038 lines · 24.1 lines per check · 193s
  exit 0
```

```
node tools/wo-sweep.mjs
  16 checks · 15 passed · 0 failed · 1 to review
```

The single REVIEW is the standing sensitive-field-name sweep, **181 mentions across 13 files**, up
from 174 across 12. The seven new ones are all in `src/attendance-report.js`'s header comment, which
states — at the point where a future author would break it — that no accommodation, medical or plan
data reaches these surfaces and that the module does not import `src/supports.js`. That is the shape
the REVIEW exists to be read: a mention that is a prohibition rather than an emission.

The harness went from 564 executed checks to 582. Call sites went 571 → 589 and `tools/README.md` is
updated with both, plus a note that the executed-count *gap* did not move this time because the new
section added one fixture-guard arm a green run never reaches **and** one call site inside a
two-pass loop that fires twice.

---

## Against the Acceptance list, one line at a time

### 1. `[x]` A student's history lists exactly the meetings counted in their percentage — the two agree

**Ticked. Verified by measurement, and by mutation.**

The line is a claim about a **shared source**, so the implementation is structural: `walkMeetings()`
in `src/attendance.js` is one chronological pass over one set of records, returning `{ rows, totals }`
together. `totalsFrom()` — which every existing percentage on the registry already went through — is
now `walkMeetings(...).totals`, and `attendanceHistory()` / `termHistory()` are `walkMeetings(...).rows`.
There is no second walk, no second filter, and nothing in the report module touches `doc.attendance`.

Measured with a fixture built so a second opinion could not survive it: six recorded meetings inside
the term, plus **a record carrying an `exception`** and **a record outside the term's dates** sitting
beside them. Asserted as a *list of dates*, not a count. The planted student wears one of every mark
plus a `U`.

- history rows = the six dates, in order; the dropped day and the out-of-term day absent
- last row `4 of 6 · 67%`, badge `67%`, and the registry line behind the dialog
  `P 1 · T 1 · A 2 · E 1 · D 1 · 67%`
- the `U` day reads `Absent`; the letter `U` appears nowhere in the dialog

**Mutation:** giving `attendanceHistory()` its own filter with no `stateOf()` in it turns 3 red, and
the failure detail reads `last row "5 of 7 · 71%", badge "67%"` — the acceptance line failing in its
own words. A second mutation (not folding `U` into `A`) turns **8** red, four of them WO-2.4's own
totals checks, which is also the proof that re-expressing `totalsFrom()` on the new walk did not
quietly fork it.

### 2. `[x]` The CSV opens cleanly in a spreadsheet with dates as columns

**Ticked, and here is exactly what that tick rests on — no spreadsheet was opened.**

`recordCsv(record)` is a pure text function with no DOM in it (the seam the brief pointed at in
`src/backup.js`), exposed on `window.planbook.attendanceReport`, so the harness asserts the bytes
character by character rather than eyeballing a file:

- a **BOM**, so Excel reads it as UTF-8
- **CRLF** endings, with a check that no bare `\n` exists anywhere in the file
- Roll Call!'s own column order, lifted: `Last Name, First Name, Present, Tardy, Absent, Event,
  Dismissed, Meetings, Att %` — then the meeting dates in **ISO, oldest first**, asserted against the
  same list acceptance line 1 uses
- one row per student, every row the header's width
- a student called `O"Brien, Jr` — a comma **and** a quote — surviving as one cell, with the raw line
  asserted as `"O""Brien, Jr",Ned,…`

**Mutation:** removing the quoting turns 2 red (that row parses to width 1 against a header of 15).

**What I did not verify, and why I still ticked it.** Nobody opened the file in Excel, Numbers or
Sheets. I judged that a different kind of gap from acceptance line 3's: CSV conformance is a *format*
property and it is exactly what was measured, on a column layout already in daily use in this
teacher's spreadsheet via Roll Call!. If the verifier reads that as overclaiming, the correction is
one box. `TESTING.md` § WO-2.6 carries a 👤 line — *open the CSV in the spreadsheet you actually
use* — so it does not get lost either way.

Also unverified: the **download itself**. The harness never clicks *Download CSV*; it calls
`recordCsv()` through the seam. The hand-off is `src/backup.js`'s `handToBrowser()`, now exported and
borrowed rather than copied (its comment names the new caller and the one-download-per-tap rule that
travels with it), so the mechanism is the one already proven on the owner's iPad — but the CSV
landing in Files is a 👤 line, and it is in `TESTING.md`.

### 3. `[ ]` The print view fits a class on a page and carries the class, term, and date range

**LEFT OPEN. This is the one box I did not tick, and it is not a build that is missing.**

The second half is measured. The record dialog's header reads
`WO-2.6 Term · February 2, 2026 – February 13, 2026 · 6 recorded meetings` under the class name, with
`Printed August 11, 2026 · Planbook` below it. The `@media print` block exists and is asserted: all
24 rules touching this surface are selected under `body[data-attendance-print]`, and `<body>` carries
no such attribute at rest.

The first half is **not** measured and cannot be here. `window.print()` in a headless browser prints
nothing and can block; no emulator has a sheet of paper. *"Fits a class on a page"* is a claim about
paper — the roster down the page, the margins around it, the mark colours on a real printer — and it
needs the owner and one print. So the box stays blank and `TESTING.md` § WO-2.6 carries it as a 👤
line with what to look at.

**The decision the work order left to me, stated as the brief asked.** A class fits *down* a page —
one row per student at 8pt. It is the term's meetings that do not fit *across* one. So the day-by-day
table is cut into **slices of 24 date columns**, each starting a new page and repeating the student
column: A4 is 210mm, the print margin is 10mm a side, a 45mm student column leaves 145mm, and 24
columns at 6mm are 144mm. Above the slices is a **summary table** — every student's counts and
percentage — which always fits on its own and is the page a conference actually wants. The slices are
drawn on screen as well, so the dialog is a preview rather than an approximation. Measured: six
meetings → one slice of 6 columns; thirty meetings → two slices of 24 and 6. **Mutation:** raising
`DATES_PER_SLICE` to 100 turns 1 red.

### 4. `[x]` Neither surface emits accommodation, medical, or plan data

**Ticked. Verified in BOTH presentation modes, and mutation-proved against exactly the
implementation the brief warned about.**

The implementation is by construction, not by conditional. `classRecord()` hands
`src/attendance-report.js` a student shaped `{ id, first, last, name, marks, totals }` and nothing
else; that module does not import `src/supports.js` at all and has no path to `student.supports`.
"Presentation-mode safe" is therefore trivially true rather than conditionally true.

The check plants a plan, a case manager, a review date, an accommodation, a medical line and a
behavior plan on the student — each with a sentinel — and **asserts they are in the serialised
document first**, because an absence check over a student with nothing on file proves nothing. Then
the history's text, the record's text and the CSV's text (plus `JSON.stringify(classRecord())`) are
searched for all five sentinels and for the word `IEP`, twice: once with presentation mode **OFF**
(the switch answering true, support data visible everywhere else in the app) and once with it **ON**.
Zero hits either way, over surfaces of 799, 744 and 1316 characters, so none of the three was empty.

**Mutation:** carrying `supports` onto the record shape and printing the medical line behind the
visibility switch — the exact "reads as complete" build the brief predicts — turns **3** red,
including *both* mode passes, because the gated build still has the data in hand.

---

## Files changed

- `c:\dev\planbook\src\attendance-report.js` — **new**, 520 lines. Both dialogs, the CSV text, the
  print trigger. Owns no arithmetic.
- `c:\dev\planbook\src\attendance.js` — `walkMeetings()` / `summarise()`; `totalsFrom()` re-expressed
  on them; new exports `attendanceHistory`, `termHistory`, `classRecord`, `percentText`, `plainDate`,
  `shortDate`, `dayAbbr`; `historyDoor()` makes the identity block a button; header updated.
- `c:\dev\planbook\src\attendance.css` — the report styles, the identity-block button reset, the new
  names in the `@media (pointer: coarse)` block, and the app's first `@media print` block.
- `c:\dev\planbook\index.html` — the 🖨 Record door in the toolbar, and the two dialog skeletons.
- `c:\dev\planbook\src\shell.js` — the import, four click hooks, the `window.planbook` seam entry.
- `c:\dev\planbook\src\backup.js` — `handToBrowser()` exported, with the reasoning added to its
  comment.
- `c:\dev\planbook\sw.js` — `./src/attendance-report.js` added to `SHELL`, `CACHE` → `planbook-shell-v44`.
- `c:\dev\planbook\tools\verify-shell.mjs` — one new section (17 checks) plus one in the coarse sweep.
- `c:\dev\planbook\tools\README.md` — the WO-2.6 growth paragraph, the call-site count 571 → 589, the
  executed-gap arithmetic.
- `c:\dev\planbook\TESTING.md` — § WO-2.6: what it adds, the four lines with their evidence, four 👤
  lines, and the mutation table.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — three boxes ticked, one left open with
  the reason, status `🔨 IN PROGRESS` (written by `wo-gate.mjs --tick`).

`plans/ROADMAP.md` is **untouched** — `--tick` left the boxes alone because the work order is not
done, and that is right.

---

## Decisions the work order did not settle

1. **A new module, but no new stylesheet.** `src/attendance-report.js` is named for what it owns
   (`src/README.md`'s rule), because the registry is the flow that runs while students walk in and
   neither of these surfaces is opened standing up. Its *styles* went into `src/attendance.css`
   rather than a sheet of their own, following the ⌨ Keys dialog precedent: a dialog belonging to a
   screen is styled by that screen's sheet.
2. **The door into the history is the student's own name** — Roll Call!'s `.s-name-link`, lifted with
   the function. The target is the **whole identity block** (name + term line), not the name alone,
   and that is arithmetic rather than taste: 44px on the name alone takes the row from 62px to 75px
   on a coarse pointer, which is two thirds of a screen of extra scrolling over a class of 26. On the
   block, the 44px cells still decide the row height and nothing moves. The reasoning is written at
   the coarse rule.
3. **A new control on the row was rejected.** The grid's width is budgeted in 72px day columns; a
   seventh button per row is paid for with a day column on the one screen where a missing column is a
   day nobody can see they forgot.
4. **`@media print` is gated on a `<body>` attribute** the Print button sets and removes — Roll Call!'s
   `body[data-modal-print]` idiom. **Departure, stated at the point of departure:** Roll Call! also
   prints its registry by default, and Planbook cannot, because its registry is a six-day *window*
   rather than a term. Ungated, a Ctrl+P made on any other screen would print a blank sheet. The gate
   is measured, and the mutation that ungates one rule turns 1 red.
5. **The CSV's columns are Roll Call!'s, plus one.** Same order, so a teacher who has exported from
   Roll Call! all year opens this in the same spreadsheet with the same columns in the same places. I
   added a **Meetings** column it does not have, because the denominator is the thing WO-2.4 made
   explicit everywhere else in this app.
6. **Attendance percentages still round to a whole number**, via the exported `percentText()` — the
   same function the registry has used since WO-2.4. WO-3.14's two-decimal rule is about *grades*;
   nothing here touches the letter-scale path, and `wo-sweep.mjs`'s three rounding checks stay green.
7. **`countText()` was deliberately NOT exported.** The report lays the five counts out as five
   columns, so `P 3 · T 0 · A 0` is a line for a place with one line to spend. Noted in the comment
   beside `percentText()` so the asymmetry does not read as an oversight.

---

## Out-of-scope temptations I declined

None of these were built. Each is a candidate follow-up work order:

- **A Print button on the *history* dialog.** Roll Call! has one (`printStudentReport`). The work
  order asks for a print view "of the attendance record for a class and term" — a class, not a
  student — so I built one print surface. A per-student printout is a real want at a conference and
  it is a small follow-up now that the print block exists.
- **The rest of Roll Call!'s student report**: the at-risk banner, the absence letter, the email
  composer, the hall-pass and tardy history sections. The first three are Phase 4/5 and a threshold
  invented here would be a second opinion about "at risk" before the work order that owns the first
  one is written; the pass history is WO-2.9's. Said in the module's comment at the point where they
  were left out.
- **Exporting more than one class, or a whole year, in one file.** One tap in an installed PWA gets
  structurally one download event (`src/backup.js`), so that shape wants an archive and its own
  acceptance lines.
- **A harness check that the CSV actually lands on disk.** `verify-shell.mjs` can be pointed at a
  download directory (trap 9 in `tools/README.md` is about exactly that), but it would need the
  download-path plumbing the backup checks use and a rule about the two-taps-one-name case. Proposed
  as a follow-up rather than bolted on; the 👤 line covers it in the meantime.
- **Fixing the stale clause in `src/attendance.js`'s header** that still lists "percentages and
  counts over history (WO-2.4)" as out of scope. WO-2.4 landed. I removed only the WO-2.6 clause,
  which was mine to remove.

---

## Things a verifier should look at with suspicion

- **Acceptance line 2 is ticked without a spreadsheet having been opened.** Argued above. If that
  reading is wrong, the box is the fix, not the code.
- **One mutation run in the `TESTING.md` table is recorded as a *failed run*.** The first attempt at
  the CSV-quoting mutation never applied — the edit script's own pattern did not match, because this
  shell collapses `\\` inside a quoted heredoc — and the harness went green over an unmutated tree.
  I caught it by reading the file rather than the summary, and re-ran it. It is in the table because
  a green mutation run and a vacuous check are indistinguishable until somebody looks.
- **`TESTING.md` was briefly rewritten CRLF** by an edit script and normalised back to LF before the
  final run. `git diff --stat` for it is 111 insertions, 0 deletions — if it reads as thousands of
  changed lines in some other checkout, that is line endings and not content.
- **I ticked no 👤 line.** Four new ones were added to `TESTING.md` (print on real paper, open in a
  real spreadsheet, download on the installed iPad PWA, and a tap-test on the name control mid-class)
  and all four are blank.

---

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or bin

> **Attendance you can hand to somebody.** Tap a student's name in the registry to see every day the
> class met, what they were marked, and what their attendance percentage was after each one. The new
> **🖨 Record** button opens the whole class's term — counts and percentage per student, then the term
> day by day — ready to print, or to save as a CSV that opens in any spreadsheet with the dates as
> columns. Both are read-only: nothing on either one can be edited, and neither carries anything from
> a student's support details.
