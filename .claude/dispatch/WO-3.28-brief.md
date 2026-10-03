# WO-3.28 — the score grid narrows to one category · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.28-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** (no model override): this work order is a design lift from `design/mockups/score-tools.html` into `src/scores.css`, its keyboard edge cases over unrendered columns are judgment, and its three Traps are judgment traps (CSS hiding, an on-screen average, a remembered filter) — ROUTING.md's Claude column on its own merits. The runner-up was Codex on the engine-sourced arithmetic, set aside because the visual surface and the mutation round (the full harness now runs ~11 min, per WO-3.29's 668s) do not fit Codex's column or its 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.28 — the score grid narrows to one category

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-02 · **Size** M · **Depends on** WO-3.27 — the box whose scroll padding a third frozen column widens; WO-3.29 — the toolbar this adds its pills to
**Closes roadmap** *(no box. Owner-requested, 2026-10-01.)*

**Booked 2026-10-01**, owner-directed, from the same sitting as WO-3.27, and **cut in two on
2026-10-02**: it was booked as *narrows by student and by category*, and the student half is now
[WO-3.29](#wo-329--the-score-grid-narrows-by-student). The cut is along rows and columns. Search
narrows rows, which the grid's existing stop-at-the-last-row behaviour already handles. This work
order narrows columns, which is where the arrow, Tab and Enter edge cases are, and it adds a third
frozen column to WO-3.27's box. So it carries the risk, and it gets a dispatch to itself.

A teacher wants to look at one category alone. That is how a category is checked against the SIS,
and the check is done by hand, because the SIS has no usable export (`CLAUDE.md` § Working
agreements).

**Deliverables**
- **Surface: `design/mockups/proposed-scores.css`**, drawn in `design/mockups/score-tools.html`: the
  `.scores-filter-pills` rule from § SCORE TOOLBAR, the `.scores-cat-avg` rules, and the filtered
  scroll padding left pending in § SCORE SCROLL BOX, all lifted into `src/scores.css`. WO-3.29 lifts
  the rest of the toolbar first; the pills go into it after the search box and its count. Amend the
  drawing's banners in the same sitting.
- **One category at a time, plus *All***: **Open 4**. A single category's average is what gets
  compared to the SIS. Pills carry names only (**Open 6**) and wear `.pill` as shipped. A pill
  appears for each category with at least one assignment in the open term, because a pill that
  empties the grid is a dead control. Work filed under no category shows under *All* only. Columns
  outside the category are **not rendered**, so Tab, the arrows and Enter cannot put a caret in a
  column nobody can see.
- **A third frozen column while a category is picked: that category's average**, from
  `categoryPercentage()` in `src/grade-engine.js` and from nowhere else. A percentage and no letter,
  for the reason `classAverage()` gives. The overall grade does not move and does not change meaning:
  **the owner's ruling before drawing**. The column stays in every orientation, iPad portrait
  included (**Open 8**). The box's left `scroll-padding` widens to cover it (358px, 336px coarse).
- **The summary line gains the category's class average** while one is picked (**Open 5**). Every
  other figure on it stays whole-class. The filter moves no class average, blank count or student's
  grade.
- **The filter is not remembered.** It resets whenever the screen is opened, which is the calendar's
  ruling that a filter is a door and not a preference. Nothing reaches `localStorage`. The printed
  grade sheet ignores it.
- **The two filters together.** A typed name and a picked category both apply at once, and each
  keeps working when the other changes. This work order lands second, so it carries the checks for
  the combination.

**Acceptance**
- [ ] With a category picked, only its columns are in the DOM. Tab, `ArrowRight` and Enter stop at the
      last shown column and the last shown row, with the edge sentence the grid already speaks.
- [ ] The third column's figure for every student equals `categoryPercentage()` for that student and
      category, and the summary's category average equals the same figure averaged over the class.
      **Mutation-proved**: a third column fed any other arithmetic goes red.
- [ ] With a category picked, a focused cell is never under the three frozen columns. This is
      WO-3.27's driven check re-run with the filter on, both pointers.
- [ ] The class average, the blank count and every overall grade are byte-identical with the filter
      on and off.
- [ ] With a name typed and a category picked, the grid shows exactly the matching rows and the
      category's columns. Clearing either one restores its own axis and leaves the other narrowed.
- [ ] Leaving the screen and coming back shows *All*, and no `planbook_` key was written by the pills.
- [ ] The pills measure ≥44px under the coarse pointer.
- [ ] 👤 On the iPad in portrait, with a category picked and a name typed, the three frozen columns
      leave a usable grid under a thumb.

**Traps** — **Do not hide columns with CSS.** The key handlers in `src/scores.js` can still walk into
a `display: none` cell, and a caret in a hidden field is the defect WO-3.27 exists to remove. **Do not
compute the category average on this screen.** The engine already answers it, and a second answer is
the one that ends up disagreeing with the student detail an inch away. **Do not store the filter**,
however convenient a remembered *Quizzes* would be on the second visit.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/proposed-scores.css`
  - `design/mockups/score-tools.html`
  - `src/grade-engine.js`
  - `src/scores.css`
  - `src/scores.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-3.29-result.md` — the sibling that just landed the toolbar this adds pills to. It records where the search reset sits (`resetScoreSearch()` in `showClassScreen()`, before the view swap — put the category reset beside it), that `paintGrades()` is always handed the whole class, and the harness file it extended.
- `tools/verify/score-search.mjs` and `tools/verify/score-grid.mjs` — the combination checks (Acceptance 5) belong next to the search checks; Acceptance 3 is WO-3.27's driven focused-cell-not-under-the-frozen-columns check in `score-grid.mjs`, **re-run with the filter on** at both pointers, not a new geometry check written from scratch.
- `design/mockups/PROTOCOL.md` rule 5 — when you lift `.scores-filter-pills`, `.scores-cat-avg*` and the `.filtered` scroll padding out of `proposed-scores.css`, the pending banners in both mockup files must be amended in the same sitting (`wo-sweep.mjs` § 19 reads them).

**Traps the orchestrator adds, beyond the work order's own:**
- **The category average on the summary line is the mean of the per-student `categoryPercentage()` figures** over students who have one — not a pooled points sum, and not a new helper on this screen. If a student has no figure in that category, the third column says so (match how the grid already draws a blank grade) and that student is left out of the mean; state in your result which rule you used.
- **Pills come from categories with at least one assignment in the open term**, not from every configured category — a pill that empties the grid is a dead control. Uncategorised work shows under *All* only.
- **The frozen-column widths are in WO-3.27's box.** The third column's `left` offset and the 358px / 336px coarse `scroll-padding-left` must agree with each other; a mismatch is exactly what Acceptance 3 catches, so read the existing two frozen columns' widths before picking the third's.
- **Byte-identical figures (Acceptance 4)** means the headline, summary-line whole-class figures and every overall-grade cell read the same with the filter on and off — follow WO-3.29's pattern of always passing the whole class and whole assignment list to `paintGrades()`.
- **Bump `CACHE` in `sw.js`** (it is `planbook-shell-v149` after WO-3.29) — `src/scores.css` and `src/scores.js` are in `SHELL`.
- **Revert every mutation before writing anything else** (AGENTS.md). Mark each `MUTATION`, restore from a copy, `cmp`, and end with `grep -rn MUTATION src tools index.html sw.js design` showing only pre-existing prose. Delete any scratch harness. If `tools/README.md` records a `check()` count that your additions change, correct it — a stale count turns the sweep red.
- **Leave the status line at `🤖 CLAIMED`.** You may tick Acceptance boxes against a check you name; the 👤 box stays `[ ]`.

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

1. With a category picked, only its columns are in the DOM. Tab, `ArrowRight` and Enter stop at the last shown column and the last shown row, with the edge sentence the grid already speaks.
2. The third column's figure for every student equals `categoryPercentage()` for that student and category, and the summary's category average equals the same figure averaged over the class. **Mutation-proved**: a third column fed any other arithmetic goes red.
3. With a category picked, a focused cell is never under the three frozen columns. This is WO-3.27's driven check re-run with the filter on, both pointers.
4. The class average, the blank count and every overall grade are byte-identical with the filter on and off.
5. With a name typed and a category picked, the grid shows exactly the matching rows and the category's columns. Clearing either one restores its own axis and leaves the other narrowed.
6. Leaving the screen and coming back shows *All*, and no `planbook_` key was written by the pills.
7. The pills measure ≥44px under the coarse pointer.
8. 👤 On the iPad in portrait, with a category picked and a name typed, the three frozen columns leave a usable grid under a thumb.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.


---

## CORRECTION ROUND 1 — 2026-10-02 (orchestrator addendum)

**This is a correction, not a rebuild.** The uncommitted tree is the first implementer's work and it
passed a verifier on lines 1–7 (PASS WITH MANUAL CHECKS). Build on it; do not rewrite it. The row
stays `🔍 AWAITING VERDICT` — do not run `--start`, `--release`, `--handoff` or `--tick`. Nothing is
committed and nothing should be. Re-read `plans/work-orders/phase-3-gradebook.md` § WO-3.28 first:
the parent session amended it on 2026-10-02 (struck Deliverable sentence, failure note, two new
Acceptance lines). The phase file is the authority over anything earlier in this brief.

**The failed 👤 reading, verbatim:**

> *(**Failed 2026-10-02, the owner, iPad at v150:** the category-average column is not frozen. It
> drifts a few pixels with a horizontal scroll before holding, and only on the iPad; the name and
> grade columns hold. A likely cause, not yet measured: in an auto-layout table `width: 84px` is a
> floor, so if the grade column renders wider than 84 under iPadOS's font, the third column's
> natural position sits past its `left: 252px` and it travels the difference before sticking.)*

**The two new Acceptance lines, verbatim:**

> - [ ] Every frozen column's rendered left edge equals its sticky `left` at `scrollLeft` 0, and stays
>       there under a full horizontal scroll, under both pointers, with the widest figures the columns
>       can hold (`100.00%`, the longest category name in the head). A column wider than its declared
>       width goes red here rather than on the iPad. *(Added 2026-10-02 from the failed reading above.)*
> - [ ] With a category picked, each student's category figure has the letter `letterFromPercentage()`
>       gives for it, on its own line under the number, and a student with no figure shows the em dash
>       and no letter. In every row the category number sits on the overall grade number's line and
>       its letter on the overall letter's line. The summary's category average has no letter.
>       **Mutation-proved**: a letter banded from the overall grade instead of the category goes red.
>       *(Added 2026-10-02, owner-directed.)*

**What to do**

1. **Drift — measure before fixing.** In `verify-shell.mjs`'s browser, under both pointers, with the
   widest figures, read each frozen column's `getBoundingClientRect().left` relative to the box and
   its rendered width against its declared width (`src/scores.css` ~344 grade `left:190/168`,
   ~369 `.scores-cat-avg` `left:274/252`, `width: 84px; min-width: 84px`). Confirm or refute the
   hypothesis and **say which in your result file**. If refuted, name the real cause.
2. **Fix it so it does not depend on font metrics.** The owner's iPad renders a font the harness does
   not, so a fix that only works because Edge's glyphs fit in 84px is not a fix. The column widths
   must be *enforced* (e.g. a `max-width` with overflow handling, `table-layout`/`box-sizing` choices,
   or any approach you can justify), not merely hoped. Keep the six coupled numbers the comment at
   `src/scores.css` ~312–318 names in step, and keep WO-3.27's focus/scroll-padding checks green.
   Do not hide columns with CSS (Trap still stands).
3. **Letter under each category figure**, from `letterFromPercentage()` and nowhere else — the same
   source and markup pattern the overall grade cell already uses, so the numbers share one line and
   the letters the next. Em dash and no letter where `categoryPercentage()` gives no figure. Summary's
   category average stays letterless. Grade with no letter scale: follow whatever the overall grade
   cell already does (`src/scores.js` ~550).
4. **Correct the prose that argues for no letter**: `src/scores.css` ~361, `src/scores.js` ~357 (only
   if it is about the per-student column — the class-average sentence stays true), the mockup caption
   at `design/mockups/score-tools.html` ~660 and banner, `design/mockups/proposed-scores.css` ~156.
   Update `TESTING.md` § WO-3.28 if it describes the column.
5. **Checks** for both new lines in `tools/verify/score-grid.mjs` (or wherever the WO-3.28 checks
   live — no new harness). Drive the widest figures. **Mutation-prove** the letter line (letter banded
   from the overall grade goes red) and the drift line (a column allowed to grow past its declared
   width goes red), then **revert every mutation before writing anything else** (`AGENTS.md`), and
   `grep -rn MUTATION` clean at the end.
6. **Bump `CACHE` in `sw.js` v150 → v151.** Update the `tools/README.md` check count if the sweep
   demands it.
7. Run `node tools/verify-shell.mjs`, `node tools/wo-sweep.mjs`, `node tools/wo-gate.mjs --audit`.
   Tick the two new desk lines in the phase file only if the harness proves them. **The 👤 line stays
   `[ ]`** — it is the owner's re-reading.

**Report** by rewriting `.claude/dispatch/WO-3.28-result.md` with a `## Correction round 1` section
appended (keep the original above it): the measurement and whether the hypothesis held, the fix and
why it is font-independent, files touched, harness figures, each mutation and what turned red, and
what you could not close.
