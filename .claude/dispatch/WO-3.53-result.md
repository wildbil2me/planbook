# WO-3.53 — result (implementer, Claude Opus)

**Outcome:** built and verified. I ticked all six Acceptance boxes in
`plans/work-orders/phase-3-gradebook.md` by hand. None of them is a 👤 or 📆 line. The status line
still reads `🤖 CLAIMED`, because the status and `--tick` belong to the pipeline. Nothing is committed.
I did not run `--start`, `--release`, `--handoff` or `--tick`.

## Files changed

- `c:\dev\planbook\src\signals.js`
  - `isHeld` is now imported from the engine.
  - `sequence` in `makeContext()` filters with `&& !isHeld(a)`. A comment names WO-3.53 and lists the
    readers that follow from that one filter, and the readers that already follow the engine.
- `c:\dev\planbook\src\past-due.js`
  - `pastDueBlanks()` has `if (isHeld(assignment)) return;`, with a comment. It reuses WO-3.52's
    import.
  - Decision 1 in the header and the import comment now mention it.
  - The `reviseCell` descriptor is untouched.
- `c:\dev\planbook\src\graded-pieces.js`
  - `isHeld` is imported, and `gradedPieces()` skips a held column, with a comment.
  - The header's "imports gradingModeOf() and nothing else" now names `isHeld()` too.
- `c:\dev\planbook\src\merge-fields.js`: one header paragraph and **no code change**. See decision 2.
- `c:\dev\planbook\sw.js`: `CACHE` goes from `planbook-shell-v170` to `planbook-shell-v171`.
- `c:\dev\planbook\tools\wo-sweep.mjs`: a new **§ 30**, placed above § 22 for § 23's reason.
- `c:\dev\planbook\tools\verify\held-readers.mjs` (new): five `check()` sites. Four are claims and one
  is the failure arm of the fixture guard.
- `c:\dev\planbook\tools\verify-shell.mjs`: the import and the `BROWSER_SECTIONS` row, straight after
  `verify/past-due.mjs`.
- `c:\dev\planbook\tools\README.md`
  - The sweep row now reads `49-check`, with a § 30 clause.
  - The harness count goes from 1836 to 1841.
  - A new WO-3.53 paragraph records the executed count.
- `c:\dev\planbook\docs\data-model.md`: the reader table sits under *Held columns*. WO-3.47's three
  rows are marked *not yet built*.
- `c:\dev\planbook\TESTING.md`: a new § WO-3.53 with the boxes, the § 30 decision, the harness
  mutation table, the plant table and the run figures.
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`: the six boxes are ticked.

## Acceptance, line by line

1. **[x] Concern list.**
   - **Fixture:** one points class. For one student it has three held columns (a `missing`, a 40 due
     yesterday, a 40) and a fourth held 80. Around them are live work: two `missing`, ten 95s, and a
     live 40.
   - **Held:** the concern column of `signalsView.signalsModel()` has no row for her, and
     `signals.evaluate()` returns no concern hit.
   - **Live** (`held` deleted and `committedAt` stamped): both read `grade-fell`, `low-score-run`,
     `missing-count`.
   - I worked the expected values by hand against the default thresholds, and they are written in
     the section header:
     - held: 76.15%, 2 missing, a run of 1, and the grade rose across the last four;
     - live: 67.65%, 3 missing, a run of 3 under 60, and a fall of 11.58.
   - **A wording note:** the line says "a held column holding a missing and two low scores". One
     column holds one cell per student, so I read it as held columns for one student holding those
     three. The verifier may want to look at that.
2. **[x] Past-due prompt.**
   - Held: the prompt reads *"1 blank is past due — mark it missing?"* and *"In Wo353 live low (due
     Oct 7)…"*. `pastDueAsksAbout()` answers `[false, true]` for [held, live].
   - Live: it reads *"2 blanks are past due"* and names *"Wo353 held low one … and Wo353 live low"*,
     with `[true, true]`.
   - The live past-due column is the control that shows the prompt was drawing.
3. **[x] graded-pieces.**
   - Held: `{ ids: ['k_wo353a'], loose: false }`, so Reading checks, whose only work is held, is
     absent.
   - Live: both categories.
4. **[x] `{{missing.list}}`.**
   - Held: *"Wo353 live missing one, Wo353 live missing two"*, and `{{missing.count}}` is `2`.
   - Live: the same plus *"Wo353 held missing"*, and the count is `3`.
5. **[x] § 30 is green on the delivered tree, and red with a plant in each of the four readers.**
   - **The plants were made in a scratch copy of the final tree, never in the working tree.** That
     copy carries the same `tools/wo-sweep.mjs` and the same `src/`, so the sweep logic it ran is
     identical. Each plant was run alone and its file restored before the next. Afterwards
     `diff -r src` against the tree was empty, and § 30 was green in the copy both before and after.
   - The four readers, each with sweep exit 1 and § 30 FAIL naming the line:

     | Reader | Plant | § 30 reports |
     |---|---|---|
     | `src/signals.js:1738` | `!a.held` | member read on `a` |
     | `src/past-due.js:296` | `if (assignment.held) return;` | on `assignment` |
     | `src/graded-pieces.js:120` | `if (assignment.held === true) return;` | on `assignment` |
     | `src/merge-fields.js:417` | `…find(…).held` | on `)` |

   - Three extra plants, all red:
     - `column.assignment.held` in the excepted `src/score-history.js`;
     - `a['held']` in `src/signals.js`;
     - the `isHeld()` call deleted from `src/graded-pieces.js` with its import kept.
   - "Reverted before anything else is written" holds in the strongest sense: nothing was ever planted
     in the working tree.
   - **`grep -rn MUTATION src tools sw.js`:**
     - It returns **19 lines**, the same 19 that `git grep MUTATION HEAD -- src tools sw.js` returns.
       They are pre-existing comments and prose in `src/shell.js`, `tools/README.md`, `tools/wo-gate.mjs`
       and four `tools/verify/*.mjs`.
     - `git diff -- src tools sw.js | grep -c MUTATION` is **0**, and the new untracked
       `tools/verify/held-readers.mjs` contains 0.
6. **[x] `CACHE`:** v170 becomes v171.

### Harness mutation round

This was a separate scratch copy with a two-section subset, `year-document-store` and `held-readers`.
The control run read `30 · 30 · 0 · 0`, exit 0.

| Mutation | Result |
|---|---|
| S1: the filter deleted from `sequence` | 1 red. Held reads `["low-score-run"]`. |
| S2: the filter deleted from `pastDueBlanks()` | 1 red. Held reads "2 blanks". |
| S3: the filter deleted from `gradedPieces()` | 1 red. |
| S4: the engine's `assignmentsFor()` filter deleted, which is the merge fields' only filter | 2 red: `{{missing.list}}` and the concern check. |

## Totals, all read from finished output

- **`node tools/verify-shell.mjs`** on the delivered tree:
  - `1846 checks · 1846 passed · 0 failed · 0 skipped`, 58,548 lines, 31.7 lines per check, 849s,
    `EXIT=0`, on the real clock.
  - This is up 4 from 1842: five sites, one of them a failure arm.
  - **Caveat:** during the run I rewrapped three comments (in `src/past-due.js`, `src/graded-pieces.js`
    and `src/merge-fields.js`). They are comment-only, and no code line moved.
- **`node tools/wo-sweep.mjs`** on the final tree:
  - `49 checks · 46 passed · 0 failed · 3 to review`, `SWEEP_EXIT=0`.
  - The three reviews are the same three as on the baseline run before my edits: sensitive names, due
    and late/missing, and the mockup banner.
  - § 11 is green at 1841. § 20 is green: `src/merge-fields.js` holds no new code. § 22 is green at 49.
- **`node tools/wo-gate.mjs --audit`:** PASS, `AUDIT_EXIT=0`.

## Decisions the work order did not settle

1. **How § 30 tells the two non-assignment `.held` reads apart.** I used **(file, receiver)
   exceptions**, not file exceptions, and did not rename anything.
   - How it works:
     - The member-read pattern captures the identifier in front of the dot.
     - Only `column` in `src/score-history.js` is let through. That is reviseCell()'s descriptor,
       which its callers build from `isHeld()`.
     - Only `pass` in `src/signals-view.js` is let through. That is the cooldown list, which uses the
       word for something else.
   - So `assignment.held` or `a.held` in either file is still red, and I proved that for
     score-history.
   - Each exception FAILs if it goes unused, so a stale allowance cannot sit waiting.
   - Renaming was refused. One read is WO-3.52's history logic, which the brief says not to rewrite.
     The other is an unrelated screen outside this work order.
   - Beyond member reads, the section also fences `['held']`, `'held' in`, `hasOwnProperty('held')`
     and destructured `held`.
   - A bare `'held'` string is **not** fenced, because `data-signals-open="held"` in `src/glance.js`
     and `src/shell.js` uses the same word for something else.
   - `.heldAt` is not matched, thanks to the word boundary.
   - The banner names what a grep cannot see: § 20's open-ended dynamic-read family.
   - It also requires `src/signals.js`, `src/past-due.js` and `src/graded-pieces.js` to keep importing
     **and** calling `isHeld()`. A reader that stops asking would otherwise pass looking clean.
2. **`src/merge-fields.js` gained no `isHeld()` call.**
   - `{{missing.count}}` and `{{missing.list}}` are `openWork()`. `{{grade.percent}}` and
     `{{grade.letter}}` are `classGrade()`. WO-3.52 already filters both.
   - A second filter would be the "second opinion" the Traps forbid, and brief trap 5 asks me to say
     so rather than add one.
   - The file's header says this, in a paragraph naming WO-3.53. Harness mutation S4 shows the line is
     carried by the engine's filter.
   - This departs from the letter of Deliverable 1 ("each ruling … asking `isHeld()`") for the row
     whose ruling is "follows the engine". I chose the ruling over the letter. If the owner wants a
     visible call there anyway, it is a one-line `.filter` in `missing()` that § 20 claim 5 would
     accept.
3. **Side effect of filtering at `sequence`:** `termWork()` loses held columns. So `notYetRules()`
   does not count a held column toward a rule's "the term has N assignments" minimum. That is
   consistent with "a held column is not there", and the data-model table says so. I am naming it
   because it is a fourth reader the brief did not list.
4. **The harness reaches past-due and graded-pieces by dynamic `import()`**, following WO-3.52's
   precedent, because neither module has a `window.planbook` seam. The concern list is read through
   the screen's own `signalsModel()` and also through `evaluate()`.

## What I could not verify

- Nothing in this work order needs an iPad or human eyes: it draws nothing new, and no build can
  write `held` yet.
- What I have **not** looked at is how the four readers look on a real screen with a held column.
  That waits for WO-3.46's writer and WO-3.47's 👤 line.

## Declined, out of scope

- I did not touch the queue, the home card, student detail (`src/detail.js`) or the grade sheet. Note
  that student detail and the grade sheet *consume* `gradedPieces()`, so in a points class a category
  whose only work is held now reads empty there. That is the owner's ruling for graded-pieces, but
  WO-3.47 should know it arrives already true.
- I did not widen § 30 to `tools/`, because harness fixtures write and delete `held` by design.

## CHANGELOG draft (the teacher decides)

> Four more parts of the app now treat a held column as not there, so they agree with the grade on
> the day holding arrives: the concern list (no signal from a held column's scores or missing marks),
> the past-due prompt (it no longer offers to mark a held column's blanks missing), the "nothing graded
> yet" sentence in a points class, and the `{{missing.list}}` / `{{missing.count}}` merge fields.
> Nothing visible changes yet — nothing in the app can hold a column until WO-3.46.
