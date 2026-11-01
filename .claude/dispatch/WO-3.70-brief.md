# WO-3.70 — the student report lists excused work, with any score it kept · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.70-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is the 👤 presentation-mode reading and the teacher-facing CSV wording — presentation mode is a sensitive surface (`ROUTING.md` § Route to Claude), and the Traps are judgment ("a third kind, not a widened `openWork()`"). Runner-up set aside: Codex on the engine reader alone, which is mechanical, but it is the smallest part of the work and the clean run plus the mutation run do not make the screen half any less a judgment call.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.70 — the student report lists excused work, with any score it kept

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-01 · **Size** M · **Depends on** WO-3.68 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-22.)*

**Booked 2026-10-22**, owner-directed, out of [WO-3.68](#wo-368--an-excused-cell-keeps-the-score-it-had)'s
verdict. **Why it exists.** WO-3.68's fourth Acceptance line asked for the kept score on "both CSVs"
and on student detail. The grade sheet, its CSV and the score history show it. The student report
cannot: neither its screen nor `studentCsv()` in `src/detail.js` lists an excused piece at all.
Their work rows are `openWork()`'s outstanding and missing rows, and excused work is in neither, so
there is no row for a kept score to sit on. The owner's ruling was to give the report excused rows
rather than to narrow the line, so that half of WO-3.68's line 4 is re-homed here, not waived.

**Deliverables**
- **`src/grade-engine.js`.** A reader for the student's excused pieces in the term, a sibling of
  `openWork()` and `heldWork()`: name, category, points, and the kept score or none. **Never fold
  excused rows into `openWork()`** — it feeds every *what it would take to move* projection, and an
  excused piece moves nothing. A held column's excused cell is the held reader's, not this one's.
- **Student detail (`src/detail.js`, `src/detail.css`).** The report lists excused work under its
  own word, after the live and held rows, each with its kept score when there is one, in the same
  mark the grade sheet uses (`Ex (62)`), or `Ex` alone. What prints is what is on screen.
- **`studentCsv()`.** The same rows in the Work section, State cell `excused` or `excused — 62 kept`
  (wording the implementer's to propose, the grade sheet's legend the model). `detailModel()` carries
  them in their own key, the way `onHold` is kept apart from `work`.
- **A mutation**: make the reader leave the kept score off, show the report checks go red, and
  revert it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.70** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] The student report's screen and its CSV list each excused piece in the term, with its kept
      score when it has one and `Ex` alone when it does not.
- [ ] The grade, the to-move card and every `openWork()` reader are unchanged by the new rows.
- [ ] An excused cell in a held column is listed once, as held work, and not again as excused.
- [ ] A student with no excused work gets a report and a CSV byte-identical to today's.
- [ ] With the reader leaving the kept score off, the report checks go red. The mutation is reverted,
      and `TESTING.md` § WO-3.70 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, the excused rows read clearly on the report, in normal mode and in presentation
      mode.
- [ ] `TESTING.md` § WO-3.70 carries these lines verbatim with the evidence for each.

**Traps** — **The excused rows are a third kind, not a widened `openWork()`**: CLAUDE.md's held-column
rule applies word for word. **The engine's grade math is not edited.** **If WO-3.69 lands first**, a
dropped score is not an excused one: it is worked out, never flagged, and stays off these rows unless
the owner rules otherwise.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/detail.css`
  - `src/detail.js`
  - `src/grade-engine.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Siblings whose conventions this must match** — read before writing:
  - `src/grade-engine.js` `heldWork()` (line ~343) and `uncategorizedWork()` (~line 375): each opens with a comment saying why it is a **sibling, not a widening** of `openWork()`. Your reader gets the same kind of comment; keep the engine's "ids, points and states, never names" shape — names are resolved in `src/detail.js`, as `heldWork()`'s rows are.
  - `src/detail.js` `droppedPieces()` / `droppedCard()` (~line 670) and `detailModel()`'s `onHold` and dropped keys (~line 1244–1270), and `studentCsv()` (~line 1333): the dropped card is WO-3.69's precedent for a separate card and a separate model key. Excused rows go **after** the live and held rows.
  - `src/grades-report.js` line ~277: the grade sheet's existing `Ex` / `Ex (62)` mark and its legend (~line 589). **Use that mark, do not retype a second spelling of it** — if it needs exporting, export it; two spellings of one mark is how the sheet and the report drift apart.
  - `tools/verify/excused-kept.mjs` (WO-3.68's harness) and `tools/verify/grade-detail.mjs`: extend these (or add a registered `tools/verify/` module) rather than writing new harness plumbing. The byte-identical line (Acceptance 4) wants a check that compares a no-excused student's report DOM text and CSV against the pre-change output, not a reading.
- **Traps the work order does not spell out**:
  - **Presentation mode.** Read how `src/detail.js` already treats the held and dropped cards under `presentationMode()` and do exactly that for excused rows — do not add a second opinion about what a projector hides. An excused piece is a grade fact, not accommodation data, but say in your result which branch you followed and why.
  - **Which cells count.** Excused cells in **live** columns of the term only; a held column's excused cell stays the held reader's (Acceptance 3 wants a fixture that has one). A dropped score is never flagged and is not excused (WO-3.69 has landed).
  - **The mutation**: revert it before writing *anything* else, then `grep -rn MUTATION src tools` to prove it is out (`AGENTS.md`).
  - Bump `CACHE` in `sw.js` (`src/detail.js` is in `SHELL`). `wo-sweep.mjs` counts `check()` call sites recorded in `tools/README.md` — update that count if you add checks, or the sweep goes red on finished work.

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

## 5. Done means these 8 lines, reported against one by one

1. The student report's screen and its CSV list each excused piece in the term, with its kept score when it has one and `Ex` alone when it does not.
2. The grade, the to-move card and every `openWork()` reader are unchanged by the new rows.
3. An excused cell in a held column is listed once, as held work, and not again as excused.
4. A student with no excused work gets a report and a CSV byte-identical to today's.
5. With the reader leaving the kept score off, the report checks go red. The mutation is reverted, and `TESTING.md` § WO-3.70 shows the red output.
6. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
7. 👤 On the iPad, the excused rows read clearly on the report, in normal mode and in presentation mode.
8. `TESTING.md` § WO-3.70 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.70 — it is a deliverable, not a permission.** Add `### WO-3.70 — the student report lists excused work, with any score it kept` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.70` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

