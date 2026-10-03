# WO-3.30 — a class can be graded on total points · implementer result

**Every mutation is reverted.** `grep -rn MUTATION src tools` finds only prose that was there before
this work order (`src/shell.js:963`, several lines in `tools/README.md`, and comments in four harness
modules and `tools/wo-gate.mjs`). None of it is a marker. The scratch harness (`tools/verify-scratch-330.mjs`) is
deleted. Every mutated file was restored from a copy in a `finally` and `cmp`'d against a pre-round
copy. Nothing is committed.

## Verification, as run

- **Baseline on the untouched tree.** I ran `node tools/verify-shell.mjs` in a `git worktree` of
  `ba0ebc6`, because my first baseline in the working tree overlapped with my own edits and is void. It
  printed `1643 checks · 1643 passed · 0 failed · 0 skipped`, 671s, `EXIT=0`. The worktree has been
  removed.
- **Delivered tree.** `node tools/verify-shell.mjs` printed
  `1659 checks · 1659 passed · 0 failed · 0 skipped`, 52,845 lines, 674s, `EXIT=0`, 2026-10-02, real
  clock.
- **`node tools/wo-sweep.mjs`** printed `46 checks · 43 passed · 0 failed · 3 to review`. The three
  reviews are the standing ones: sensitive field names, due date beside late/missing, mockup banners.
- **`node tools/wo-gate.mjs --audit`** printed PASS.

## Acceptance, line by line (all nine ticked in the phase file)

1. **[x] No `gradingMode`: byte-identical grades on every screen and in every signal.** There are two
   pieces of evidence.
   (a) Both full harness runs above are green on every existing grade, signal, sheet, detail and
   merge-field check. I also normalised both runs' output (generated ids, clocks, timestamps) and
   compared the 183 lines that print a percentage or a grade. All 183 are identical except one, and
   that one is the intended wording change: the *Write anyway* aria-label on a suppressed
   `grade-below` row now reads "— grade below," where it read "— weighted grade below,". A second line
   differs only by a rev count, because my new section does one restore.
   (b) A throwaway Node script in the session scratchpad (not in the repo) imported the `ba0ebc6`
   engine and the new one side by side. It compared `JSON.stringify` of the weighted grade,
   `openWork()`, `categoryResult()` and seven projection plans over 20,000 random classes: 756,606
   comparisons, 0 differences. The same script with one class in ten set to `"points"` reported 40,320
   differences, so it can detect a change. The weighted arithmetic is unchanged in order. The
   refactor only moved the cell loop into `tally()` and the plan adjustment into `planned()`.
2. **[x] Lopsided three-category points fixture, weights 75, still has a grade.**
   `tools/verify/grade-engine.mjs`, new WO-3.30 block. The check expects 124/225 = 55.1̅%, worked by
   hand in the comment, with `weightTotal` 75 and `reason` null. A companion check shows the same class
   with no mode still refuses (`weights-unbalanced`).
3. **[x] Contributions sum to percentage in both modes; excused out of both totals.** One check covers
   both modes on the same work. Points: 48.8̅ + 4 + 2.2̅ = 55.1̅. Weighted 50/30/20: 27.5 + 13.5 + 20 = 61.
   Homework is 5/5 in both modes, so the excused 5 is in neither total.
4. **[x] An uncategorized scored piece moves points by exactly its points and weighted not at all.**
   With an 18/20 piece, points goes 124/225 → 142/245. The loose row is earned 18, possible 20, and the
   summed totals moved by exactly 18 and 20. The weighted grade object is
   `JSON.stringify`-identical with and without the piece (61).
5. **[x] No `weightedClassGrade` in `src/`, kept by a sweep check.** New `wo-sweep.mjs` § 27 (above
   § 22, per § 23's ordering rule). It forbids the identifier on any line of `src/`, comments
   included, and it fails loudly if `export function classGrade(` disappears. Mutation S1 (an alias
   export) and S2 (the export renamed) each turned it red. The `tools/README.md` sweep count went 45 →
   46. The harness also asserts `typeof gradeEngine.weightedClassGrade === 'undefined'`. I did not
   keep an alias. The six harness modules that called the old name now call `classGrade()`.
6. **[x] Same number on every screen in a points fixture, mutation-proved.** New
   `tools/verify/points-grade.mjs`. It plants a points class at weights 75 with one uncategorized
   piece. The score grid cell, the grade sheet dialog row (opened by its real button), the student
   detail hero (opened from the grid's name), the signals row text and `{{grade.percent}}` all read
   **57.96%** (142/245 by hand). The signals model's own grade agrees, and `grade-below` fired.
   Mutations M1–M6 each put one caller back on the weighted formula (`gradingMode` stripped off the
   class at that call site): detail, scores, grades-report, signals-view, signals, merge-fields. Each
   one turned the agreement check red. The full table is in `TESTING.md` § WO-3.30.
7. **[x] `projectedClassGrade()` points projection hand-worked; the band still solves by the straight
   line.** The hand-worked values are 124/275, 174/275 and 134/225. The rate for D at 60 is solved
   from the two ends as 0.82 (41/50 by hand), and the engine at that rate returns 60%. M9 (the
   projection ignores the mode) turned three checks red.
8. **[x] An old backup restores unchanged; a points year round-trips with its mode.**
   - In `points-grade.mjs`: a year with no `gradingMode` anywhere comes back from `parseBackup()`
     identical in content with nothing added, and `newYearDocument()` contains no key. B1 (seeding the
     key) turned that check red.
   - A points year's `buildBackup()` text carries `"gradingMode": "points"`, and `parseBackup()`
     returns it. After the real restore (confirm clicked), the class read raw from IndexedDB is still
     a points class grading at 142/245.
   - The full restore of a file in the pre-change shape is also exercised unchanged by
     `backup-restore.mjs`, which is green.
9. **[x] No on-screen string calls the class grade "weighted".** I changed four strings:
   - `src/signals.js` threshold label *Weighted grade below* → *Grade below*, and its aria-label. The
     `ruleId` is unchanged.
   - `src/merge-fields.js` palette line → "The current grade for this class and term".
   - Two help paragraphs in `index.html`: the scores hint, and the About status paragraph.

   This was checked by grep and is not a harness assertion. `sw.js` `CACHE` went v151 → v152 because
   `index.html` changed. **Read this before trusting the tick:** `about.html` still says "weighted
   grades" (meta description) and "Grades by weighted category" (line 165). I read both as feature
   descriptions on the public page, not as calling a class's grade weighted, and left them. The
   verifier may read it differently.

No line is 👤 or 📆, so nothing here needs an iPad. The visible changes are words only. Nobody has
looked at the reworded help text on a device, but no Acceptance line asks for that.

## The decision the brief asked for: how uncategorized points appear in the returned shape

**One more row at the foot of `categories`**: `{ id: null, name: 'no category', weight: 0, earned,
possible, percentage, effectiveWeight, contribution }`. It appears **only in points mode** and **only
when that work has something graded in it**.

- **Why a row.** Without one, "contributions add up to `percentage`" breaks on the detail screen, which
  states that promise in words. `src/detail.js` is the only consumer of `categories`. Its breakdown
  table, CSV and `contributionCents()` iterate the rows and key cents by `id`. A `null` id keys as
  `"null"` and works, so no caller branches. The harness reads the detail breakdown drawing
  `no category · 0% · 18 / 20` with the column summing to 57.96 under 57.96%.
- **Why that name.** "no category" is the wording the score grid chip and the grade sheet already
  print for such work.
- **Why only when graded.** A points class with nothing loose draws exactly its categories, and a
  weighted class never sees the row.
- **What counts as uncategorized.** A `categoryId` that is none of this class's category ids,
  including blank or left behind by a deleted category. That is `src/assignments.js`'s own test for
  its red *Not in a category* group.
- **The same row in `pointsShare()`.** It gets a `no category` row when loose work holds points, so
  the shares add to 100.

## Other decisions the work order did not settle

- **`percentage` in points mode is the fraction itself** (E/P×100), not the running sum of
  contributions. "Total earned ÷ total possible" is the definition. The contributions agree to within
  1e-9, and detail's cent allocation already reconciles the printed column.
- **The points projection includes uncategorized open and missing work**, because that work is in the
  grade. `openWork()` is unchanged and still lists categorized work only, so its output and every
  screen that lists from it stay byte-identical. The cost: the detail's missing card does not name a
  loose missing piece that the projection counts. This is documented at `projectedClassGrade()` and in
  `docs/data-model.md`.
- **`gradingModeOf(cls)` is exported** as the one reader of the key. It returns `"points"` only for the
  exact string, and `"weighted"` for everything else (absent, `"weighted"`, `"Points"`, `null`).
  WO-3.31 will want it.
- **Within a points class, a category whose only graded work is extra credit** (possible 0, earned > 0)
  gets a contribution but has a null percentage. The detail screen would draw that row as "nothing
  graded" while handing it cents. It is unreachable until WO-3.31 and is an edge case. I noted it and
  did not handle it on screen.
- **Conventions set.** The harness section file is named `points-grade.mjs`. Sweep section number 27
  is placed above § 22.

## Declined as out of scope (worth booking into WO-3.31 or beside it)

Most of these become visible only once a control can set the mode:

- `src/assignments.js` says uncategorized work is counted by nothing ("nothing counts it at all",
  "no category, so nothing counts it"). That becomes false for a points class.
- The scores help paragraph in `index.html` still says "Until the weights total 100% there is no grade
  at all". That is true for weighted classes only. The detail breakdown's Weight column and its
  "counts at" footnote also talk about weights.
- `copyClass()` in `src/classes.js` copies an explicit field list, so a copied points class becomes
  weighted. It is unclear whether that is desired.
- `design/mockups/outreach.html` and `plans/runbooks/wo-g3-runbook.html` still say "Weighted grade
  below" / "current weighted grade". These are drawings and a runbook, not the app.
- `src/categories.js`'s header comment calls the class grade weighted. It is a comment only and
  nothing on screen.
- `about.html` wording, as noted under line 9.

## Files changed

- `src/grade-engine.js`: `tally()`, `looseAssignments()`, `workRows()`, `planned()`,
  `categoryRows()`, `points()`, `gradingModeOf()`, `classGrade()`, `pointsShare()`;
  `projectedClassGrade()` branches; `weightedClassGrade` removed.
- `src/detail.js`, `src/grades-report.js`, `src/merge-fields.js`, `src/scores.js`,
  `src/signals-view.js`, `src/signals.js`: callers moved to `classGrade()`. Wording changed in
  `signals.js` and `merge-fields.js`.
- `index.html` (two help strings) and `sw.js` (`CACHE` v152).
- `docs/data-model.md`: the field in the class sketch, § "The second formula — total points", and the
  signals and outreach table wording.
- `tools/verify/points-grade.mjs` (new) and `tools/verify-shell.mjs` (import plus one row).
- `tools/verify/grade-engine.mjs`: 11 checks added. `tools/verify/grade-detail.mjs`, `grade-sheet.mjs`,
  `past-due.mjs`, `score-grid.mjs`, `score-search.mjs`: renamed calls.
- `tools/wo-sweep.mjs`: § 27.
- `tools/README.md`: sweep count 46, call sites 1648, seventy-eight files, and a WO-3.30 count-history
  paragraph.
- `TESTING.md`: § WO-3.30, with the mutation table and full-run figures.
- `plans/work-orders/phase-3-gradebook.md`: nine boxes ticked. The status is left at 🤖 CLAIMED for the
  orchestrator's handoff.

## Draft CHANGELOG entry (the teacher's call)

> **A class can be graded on total points — the engine half (WO-3.30).** A class can now carry
> `gradingMode: "points"`. Its grade is then everything earned over everything possible, and the
> category weights are ignored. Categories still file the work and keep their own percentages. Work
> filed under no category counts in a points class and still counts toward nothing in a weighted one.
> Every screen, signal and merge field asks one function for the grade, so they cannot disagree. No
> control sets the mode yet; that is WO-3.31. A weighted class grades exactly as before. The
> threshold label *Weighted grade below* now reads *Grade below*.
