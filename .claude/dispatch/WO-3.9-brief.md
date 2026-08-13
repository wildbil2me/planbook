# WO-3.9 — Grades print & CSV · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.9-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude, Opus tier**. The deciding signal is that a print view
and a CSV export are *both* export surfaces, and this project's standing obligation — *"No merge
field, log line, print surface, or export ever emits accommodation, medical, or plan data"* — makes
them a sensitive surface, restated here as Acceptance line 4 and as the "presentation-mode safe; no
`supports` data on either" deliverable. Sensitive surfaces are never delegated. The runner-up I set
aside: the owner pinned the entire layout order on 2026-08-12 (the table below) and "percentages
match the app" is mechanically checkable, which is exactly the Codex column's shape — but for the
disclosure surface this would have gone to Codex, and that reasoning stays intact rather than being
argued away.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.9 — Grades print & CSV

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-12 · **Size** M · **Depends on** WO-3.4
**Closes roadmap** Phase 3 → "Print/CSV for grades."

**Why it exists.** The SIS has no import, so re-keying is manual and the printout is what the owner
types from. **Order it to match the SIS entry screen** — that single decision is most of this work
order's value.

**The order, answered by the owner — 2026-08-12.** *This is the fact the deliverable used to say "ask
the owner" for. It is recorded here so nobody guesses it, and so a verifier can check the build
against something other than the builder's memory.*

| | |
|---|---|
| **Layout** | **Student-major grid** — one row per student, assignments as columns |
| **Row order** | alphabetical by **last name** |
| **Column order** | by **due date** |
| **Name display** | `Last, First` — matching the SIS |
| **Student ID column** | none. The SIS entry screen has no ID to match on, so the name is the join |

**Student-major was chosen against a drawn mock-up of both**, not in the abstract: the alternative was
one section per assignment with the roster repeated inside each, which reads straight down while
typing but never puts a student's whole term in one place and costs several times the paper. The grid
was chosen because a term fits on a page or two and the same sheet doubles as the at-a-glance class
picture. **If a re-key with the real SIS turns out to want a finger held on one assignment column, that
is the finding Acceptance line 1 exists to catch** — and the answer then is the assignment-major
layout, already designed, not a redesign from nothing.

**Deliverables**
- Print view of a class's grades for a term: **a student-major grid**, students down the page
  alphabetically by last name as `Last, First`, assignments across in due-date order, each column
  carrying its due date and point value, and a total percentage and letter at the right.
- CSV export of the same, **in the same order** — the printout and the file must not disagree, or the
  order stops being a decision and becomes two of them.
- Both carry class, term, date, and the letter scale in use.
- **`late` and `missing` are shown as the teacher's marks**, and a blank stays blank. A printout that
  turned a blank into a zero would be inventing a grade on the sheet the SIS gets typed from.
- Presentation-mode safe; no `supports` data on either.

**Acceptance**
- [ ] 👤 The print order matches the SIS entry screen, confirmed by the owner against a real re-key.
      *(The recorded answer above is what to build. This box is the one that says it was right, and
      only a re-key against the live SIS can close it.)*
- [ ] Percentages and letters on the printout match the app exactly.
- [ ] The CSV opens cleanly in a spreadsheet, with its rows and columns in the same order as the
      printout.
- [ ] Neither surface emits accommodation, medical, or plan data.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**This work order has a direct in-repo precedent, and you are expected to lift it rather than
re-derive it.** Two surfaces in this app already do exactly "one screen, two doors: Print and a
CSV." Read both before you design anything:

- **`src/detail.js` and `src/detail.css` (WO-3.7 — per-student grade detail).** The closest
  counterpart there is: it prints *one student's* grade detail and exports the same as CSV, and
  WO-3.9 is its class-wide sibling. Take its shape — the `data-detail-print` attribute pattern, the
  `@media print` block gated on that attribute, the timer that takes the attribute back off, and in
  particular **`studentCsv(model)`: a pure function that takes a model and returns bytes with no DOM
  in it**, so the harness can assert the CSV character by character. Build the class grid's CSV the
  same way, for the same reason — a CSV that can only be checked by downloading it is a CSV nobody
  checks. Its own header comment says the three load-bearing CSV details (CRLF endings among them)
  came from WO-2.6; inherit them, do not re-decide them.
- **`src/attendance-report.js` and the `@media print` block at the foot of `src/attendance.css`
  (WO-2.6 — attendance history & output).** The original of that pattern, lifted from Roll Call!'s
  `printStudentReport()` and `exportAttendanceCSV()`. Read its comments on **why the print attribute
  exists**: a print block that is not gated on an attribute answers a stray Ctrl+P on any other
  screen with a blank sheet. It also documents the A4-vs-Letter width call and the
  revoke-delay / one-download-per-tap rules that were paid for on the owner's own iPad.

There will be **a third `@media print` block** when you are done. Both existing ones say in comments
how many there are ("the one @media print block in this app", "the app's SECOND @media print block") —
those comments are now wrong and correcting them is in scope, since they are the only census there is.

Other files this must agree with:

- **`src/grade-engine.js` (WO-3.4, your dependency).** `weightedClassGrade()` and
  `letterFromPercentage()` are the source of Acceptance line 2. **Call the engine; do not recompute
  percentages or letters in the print path.** Two implementations of the same arithmetic is precisely
  how a printout and a screen come to disagree, and this printout is what gets typed into the SIS.
  `src/letter-scale.js` is where the scale itself lives — the deliverable asks the sheet to name the
  scale in use.
- **`src/presentation.js`** — `refreshPresentationChrome()` / `togglePresentationMode()`. Note what
  Acceptance line 4 actually demands, and what `src/detail.js` already does about it: **neither
  surface carries support data in *either* mode.** Presentation mode is not the guard here; the
  guard is that this data never reaches the page or the file at all. `src/supports.js` is the module
  whose data must not appear.
- **`src/scores.js` (WO-3.5 score entry grid)** for how `late` / `missing` / blank are represented in
  the document, and `docs/data-model.md` for the schema. A blank must stay blank on paper — a
  printout that renders an ungraded cell as `0` invents a grade on the sheet the SIS is keyed from.
- **`plans/gradebook-surfaces.md`** — the gradebook's surface inventory, for where a print/CSV door
  belongs relative to the screens that already exist.

**A note on Acceptance line 1.** It is 👤 and it cannot close here: only the owner, re-keying against
the live SIS, can confirm the order. The table in the work order is what to build — student-major,
last name alphabetical, due-date columns, `Last, First`, no ID column. **Do not tick that line, and
do not treat the recorded answer as having already closed it.** If your build makes the assignment-
major alternative cheap to reach later, say so in your report; do not build both.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 4 lines, reported against one by one

1. 👤 The print order matches the SIS entry screen, confirmed by the owner against a real re-key. *(The recorded answer above is what to build. This box is the one that says it was right, and only a re-key against the live SIS can close it.)*
2. Percentages and letters on the printout match the app exactly.
3. The CSV opens cleanly in a spreadsheet, with its rows and columns in the same order as the printout.
4. Neither surface emits accommodation, medical, or plan data.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

