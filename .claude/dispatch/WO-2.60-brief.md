# WO-2.60 — a tap on a name opens today, and the history moves to the student page · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.60-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (spawned with no model override). The deciding signal is the
Traps line on presentation mode — this adds two tables to the student page, which is a sensitive
surface — plus UI lifted from a mockup with four owner rulings still open at dispatch, refusal
sentences in teacher-facing prose, and `TESTING.md`. The runner-up was Codex on "move two tables
from one module to another", set aside: the read-only card's sentences and the presentation-mode
read are judgment, and five harness files plus mutation runs do not fit the 20-minute cap.

**The four Open items — build them as drawn, and say so** (the WO-2.59 precedent). The owner has
not ruled on them at this dispatch. Build what `design/mockups/attendance-today.html` draws: the
door reads *"Attendance history and grades →"*; the card carries no term percentage; day by day is
closed when the door lands and lists newest first. For the refusal sentences, the drawing words
only a locked day — word the others yourself from the refusal reasons (see the trap below), keep
them short and in the teacher's voice, and on a day the class did not meet draw no mark. In your
result file list all four under a heading *"Built as drawn, owner's ruling still owed"*, quoting
every sentence you wrote. Do not tick an Acceptance line on the strength of one of them.

**Session budget is tight.** The rolling window read 21.6M proxy units at claim time — above the
p25 at which dispatches have died. If you mutate to prove a check, mark it `MUTATION` on the line,
run, and revert **before writing anything else**, one at a time (`AGENTS.md`). A corpse holding a
live mutation is the worst outcome this pipeline knows.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.60 — a tap on a name opens today, and the history moves to the student page

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** M · **Depends on** —
**Closes roadmap** *(no box. Owner-directed, 2026-10-09.)*

**Booked 2026-10-09**, owner-directed, in the same sitting as WO-2.58. The owner's concern: the
attendance history dialog is **too much information in the wrong place**. A tap on a name during roll
call is "came in at 8:20", "left for the nurse", "un-confirm him" — standing up, one student, today.
The dialog puts that fourth, under a rate badge, a door and a pass count, and over a term table, a
row for every meeting and a paragraph. Those tables are what a conference reads, sitting down — and
the **›** at the end of the same name already goes to the student page, which carries this student's
attendance counts and every hall pass.

**Surface.** [`design/mockups/attendance-today.html`](../../design/mockups/attendance-today.html),
frames A to E, styled in [`design/mockups/proposed-attendance.css`](../../design/mockups/proposed-attendance.css)
§ STUDENT ATTENDANCE, with `design/mockups/README.md` § "The attendance screen". Frame 0 is v174 as
it ships. **Lift the section rather than re-deriving it**, and amend its banner in the same sitting.

**Rulings, the owner's, 2026-10-09**
1. **The name tap opens today's card**: the student's name as the dialog's title, the write block as
   it ships (mark, time, note, Un-confirm — the same hooks to the same writers), and one door to the
   student page. The rate badge, the pass count, the "Grades for" door, the term table, the
   day-by-day table and the footnote leave the dialog. It is the stock 480px `.modal-panel`.
2. **A present student's hint in a teacher's words** — drawn as *"Nothing to note on a present mark.
   Change the mark on the grid and a note field appears here."*
3. **On a day the card cannot write to, it shows the mark read-only and says what would open it**,
   instead of drawing no block.
4. **The term-by-term table and day by day move to the student page's attendance card**, under its
   five counts, from the same readers. Day by day is a closed `<details>`.

**Open — the owner's ruling, at dispatch.**
- The door's words: drawn as *"Attendance history and grades →"*.
- The term percentage on the card: drawn without it.
- The read-only card's sentence for each refusal — locked, paged away, did not meet, covered, off
  term — worded from the reasons `editableMark()` refuses on, not a second list. Drawn for a locked
  day only. On a day the class did not meet there is no mark to show.
- Whether day by day opens and scrolls into view when the card's door brings the teacher there
  (drawn closed), and whether it lists newest first (drawn so; the dialog listed oldest first).

**Deliverables**
- **`src/attendance-report.js`**: `paintHistory()` draws the card per rulings 1–3; the term table and
  day by day leave it; the read-only block needs the refusal reason, which comes from the module that
  owns `editableMark()`, not from a test written here.
- **`src/detail.js`**: `attendanceCard()` gains the term table (every term, the open one marked, and
  the whole year) and the `<details>` day by day, read through `termTotals()`, `attendanceTotals()` and
  `termHistory()` — no walk of `doc.attendance` in this file.
- **`src/detail.css`**: § STUDENT ATTENDANCE lifted, and its print block told what to do with the
  table and the `<details>`.
- **`index.html`**: the history dialog's comment and title; it comes off `.attendance-report-panel`.
- **`src/pass-history.js`**: `studentPassSummary()` goes if nothing else calls it.
- **The harness**: `tools/verify/attendance-history.mjs`, `history-dialog-write.mjs`,
  `note-panel.mjs`, `grade-detail.mjs` and `print-sheets.mjs` at least.
- **`design/mockups/proposed-attendance.css`'s banner, its `README.md` section and its `index.html`
  entry** amended to say the section landed.
- **`TESTING.md` § WO-2.60**, the `CHANGELOG.md` entry, and **`CACHE` in `sw.js` bumped.**

**Acceptance**
- [ ] A tap on a name opens a dialog titled with the student's name, holding the write block and one
      door and no table. The door opens that student's page.
- [ ] Time, note and Un-confirm write exactly as they did, through the same hooks, and Un-confirm
      repaints the card with focus inside it.
- [ ] On a locked past day the card shows that day's mark, read-only, with its sentence and no input.
- [ ] The student page's attendance card shows every term and the whole year with the same figures
      the dialog showed at v174 for the same document, and a day by day that is closed until opened
      and then lists every recorded meeting in the open term with its running fraction.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
- [ ] 👤 On the iPad, after a force-quit, upright: tap three names mid-roll-call — a tardy, a present
      student and a student on a locked day — and read each card; follow the door and open day by
      day.

**Traps** — **The card is not a second writer.** Its controls carry the hooks they carry today, and
`src/shell.js` routes them to the same functions; the `window` listener that repaints after an
Un-confirm stays, for the reason written over it. **The note field must not re-render on a
keystroke.** **The running percentage survives the move** — it is what makes a row checkable by eye.
**Presentation mode**: read what the student page hides before adding a table to it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/README.md`
  - `design/mockups/attendance-today.html`
  - `design/mockups/proposed-attendance.css`
  - `src/attendance-report.js`
  - `src/detail.css`
  - `src/detail.js`
  - `src/pass-history.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/attendance-history.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/attendance.js` around `editableMark()` (~2506) and its comment above it. **Trap: it
  returns `null` for every refusal** — no class, no student, unwritable (locked / paged away), off
  term, did not meet, covered, empty edit date — so ruling 3 cannot be built from it as it stands.
  The reason must come from **this module** (extend the return, or a sibling export beside it that
  shares the same tests — not a copy of them), per the Deliverables line and the comment's own
  "THE GATE STAYS HERE BECAUSE THE WRITERS ARE HERE". `src/attendance-report.js` words the reason;
  it decides none of it. A read-only card must still carry no input and no hook a writer answers.
- `src/detail.js` header comment (lines ~1–260) on what the student page hides in presentation mode
  and who answers that question — read it before adding a table, per the Traps line.
- `.claude/dispatch/WO-2.59-result.md` — the last build in this exact file; the history dialog
  currently wears `.attendance-report-panel` (widened to 900 by WO-2.59), which this work order
  takes it off.
- `studentPassSummary()` has one caller, `src/attendance-report.js:369`; once the dialog stops
  drawing it, delete it from `src/pass-history.js` if `grep -rn studentPassSummary src tools` is
  then empty, and fix any harness or sweep reference to it.
- `CACHE` in `sw.js` reads `planbook-shell-v176`; bump it once.
- **`CHANGELOG.md`**: the Deliverables list it, but the standing rule (§ 3) is that the teacher
  decides what lands there — **draft the entry in your result file** and do not write the file.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

## 5. Done means these 6 lines, reported against one by one

1. A tap on a name opens a dialog titled with the student's name, holding the write block and one door and no table. The door opens that student's page.
2. Time, note and Un-confirm write exactly as they did, through the same hooks, and Un-confirm repaints the card with focus inside it.
3. On a locked past day the card shows that day's mark, read-only, with its sentence and no input.
4. The student page's attendance card shows every term and the whole year with the same figures the dialog showed at v174 for the same document, and a day by day that is closed until opened and then lists every recorded meeting in the open term with its running fraction.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. `CACHE` in `sw.js` is bumped.
6. 👤 On the iPad, after a force-quit, upright: tap three names mid-roll-call — a tardy, a present student and a student on a locked day — and read each card; follow the door and open day by day.

**Write `TESTING.md` § WO-2.60 — it is a deliverable, not a permission.** Add `### WO-2.60 — a tap on a name opens today, and the history moves to the student page` under `## Phase 2 — Attendance`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-2.60` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

