# WO-1.51 — result (implementer, 2026-10-01)

**Outcome:** a 44th `--self-check` plant now fences the `\b` in `/^nothing\b/i`. The regex is unchanged.
All five Acceptance boxes are ticked, each on evidence quoted below. None of them is 👤 or 📆. Not committed.

## Files changed

- `c:\dev\planbook\tools\wo-gate.mjs`:
  - A new plant sits immediately after WO-1.30's sentinel plant, with a block comment giving the
    structural call and the choice of values.
  - The self-check's closing coverage summary gains four lines ("And WO-1.51's ONE …").
  - `noDependencies()` and `/^nothing\b/i` are **untouched**.
- `c:\dev\planbook\tools\README.md`:
  - A new mutation-table row for the widening, directly under WO-1.30's three prefix/arm rows.
  - A WO-1.51 paragraph added to the `--self-check` plant history.
  - "forty-three" changed to "forty-four", and the quoted run line changed to `44 plants, 44 caught, 0 missed` / `PASS | 44 of 44`.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the five WO-1.51 Acceptance boxes ticked. The status line was already 🤖 CLAIMED from `--start`, and I left it alone.

I did not touch, stage or revert the five foreign dirty paths (`design/mockups/*`, `plans/work-orders/phase-8-packaging.md`). The repo has no scratch files from this run, and `grep -rn MUTATION` over the two tools files finds only older prose.

## The structural call (first Trap): a new plant, not a widening of the sentinel plant

The comment at the plant gives the reasons:
- **Its assertions would contradict the existing plant's.** All three of the sentinel plant's assertions say the value IS a sentinel. Adding the negative values to that array would assert the defect. A flipped-sense second loop inside it would report failures under the name "…are read as no dependencies", which says the reverse of what broke.
- **A plant of its own names the arm.** A FAIL line prints the plant's name, which is how the widening "names the arm" (Acceptance 1).
- **It keeps WO-1.30's paired shape.** Each mutation of the prefix reddens one side of the pair: narrowing turns the sentinel plant red and the new plant stays green; widening does the reverse.

Plant name: *"the sentinel's word boundary — `nothings`, `nothingness` and `nothing_but_a_hunch` are REFUSED as clauses naming no work order, not read as `nothing`"*.

For each value, it asserts four things in refusal terms. These are not the positive loop's checks flipped:
1. The gate does not exit 0.
2. A `FAIL | … names no work order` line is present.
3. The depends line is not `depends nothing`.
4. The depends line is exactly `depends (prose) <value>`, so the refused value is quoted for a person to read.

## A decision the work order did not settle: hyphen-joined values

`-` is a non-word character, so under the rule as WO-1.30 wrote it, `nothing-but-a-hunch` has a boundary after `nothing` and **reads as a sentinel**. Writing `nothing—reason` with the dash closed up gets the same reading.

So the punctuation-joined value is `nothing_but_a_hunch`, the Trap's own example. `_` counts as punctuation to a person but is a word character to `\b`, so the regex refuses it.

I deliberately left hyphen-joined values out. Asserting that they are refused would mean changing the rule, which the Traps put out of scope ("not a value to widen the sentinel for" / do not touch the rule). Three places record it: the comment at the plant, the self-check's own "NOT covered" line, and the README row. **I am raising it as a finding for the owner, not fixing it**: whether `nothing-<word>` should be a sentinel is a separate question, and it may well be fine, since it reads like `nothing — reason`.

## Acceptance, line by line

1. **[x] `--self-check` catches the boundary being dropped.** I wrote the mutated copy with a node script into the scratchpad (`m-widen.mjs`); the tree was never edited. The script checked that the original string occurred exactly once. Diff: line 709 changed to `return /^nothing/i.test(v);`.
   - `node tools/wo-gate.mjs --self-check --against <scratch>/m-widen.mjs` → **EXIT=1**, `FAIL | 1 of 44 plants were not caught.` The one FAIL is the new plant by name. All four assertions fired for each of the three values, e.g. *"the gate exited 0 on **Depends on** nothings …"* and *"… read as no dependencies — the report printed "depends nothing""*.
   - **"Passes today", reproduced:** I extracted HEAD with `git archive HEAD | tar -x` into the scratchpad (outside the repo) and ran HEAD's own plants against HEAD's script with the same widening: `PASS | 43 of 43 plants were caught.`, EXIT=0. HEAD's unmutated self-check is also `PASS | 43 of 43`. The work order's "39 of 39" was the 2026-09-08 figure, and the count is 43 now, as the brief said.

2. **[x] At least two negative values, one word-joined and one punctuation-joined, asserted refused.**
   - Word-joined: `nothings`, `nothingness`, each with a letter as the eighth character.
   - Punctuation-joined: `nothing_but_a_hunch`.
   - The assertions are the four listed above, each worded as a refusal.

3. **[x] The eight existing values still read as no dependencies, and the standing mutations still bite.**
   - The sentinel plant's array is unchanged, and the plant is `ok` in the post-change `--self-check`.
   - **Sentinel arm dropped** (`unresolvedClause: !ids.length && !!wo.dependsRaw.trim()`, equivalent to the README row's `!!raw.trim()`) → **5 of 44**, EXIT=1. The red plants are the same five as recorded: the **Owes** control (WO-1.29), the sentinel arm, 🎒 ordering, the prose-field plant, and `**Takes from**`.
   - **Narrowed to `/^nothing$/i`** → **2 of 44**, EXIT=1: the **Owes** control and the sentinel arm, the same two as recorded.
   - The new plant is green under both. **Neither count moved; only N went from 39 to 44.** I did not rewrite those two dated rows, because the README says rows "stay at the number that was true then". The re-measure is recorded in the new row instead.

4. **[x] Every gate report is byte-identical to the pre-change run.**
   - **There are 212 ids, not 169.** `--list` gives 212 today, and I looped over all 212.
   - Before my first edit I ran `node tools/wo-gate.mjs <id>` for every id, plus its exit code, into `before.txt`: 4558 lines, 201 exit 0 and 11 non-zero. After all edits, including the ticks, I ran the same loop into `after.txt`.
   - The raw `cmp` differs, and **only** in the `git` block. Each of the 212 reports shows the changed-path count going from 8 to 10, plus two new lines: ` M tools/README.md` and ` M tools/wo-gate.mjs`.
   - Accounted for in two ways:
     - Every `>` diff line other than the git-count line and those two paths: **0**. Every `<` diff line other than the git-count line: **0**.
     - After stripping the `  git ` line and the porcelain path lines from both files, `cmp` reports **NORMALISED-BYTE-IDENTICAL** (2650 lines each).
   - The `dispatch` lines did not move, because `before.txt` was captured after the brief and status files already existed.
   - I re-ran WO-1.51's own gate report after ticking (EXIT=0). It differs from its before-run only in that same git block.

5. **[x] `--audit`, `--self-check` and `wo-sweep.mjs` all green, and the mutation-table row exists.**
   - `--audit` → EXIT=0, `PASS | every fragment matches exactly one roadmap box, …`. Re-run after the ticks: still PASS.
   - `--self-check` → EXIT=0, `PASS | 44 of 44 plants were caught.` (43 before, 44 after.)
   - `node tools/wo-sweep.mjs` → EXIT=0, `45 checks · 42 passed · 0 failed · 3 to review`. Its § 22 count check reads `45 results emitted this run, matching tools/README.md:10`.
     - The 3 REVIEWs are in files I did not touch: sensitive field names in `src/`, due-date/late on one line, and a mockup banner in `design/mockups/proposed-phase6.css`.
   - README row added: *"the `nothing` prefix test WIDENED … — **1 red of 44**"*.

I did not run `verify-shell.mjs`, as the brief allows: this change touches no file the browser loads.

## What I could not close / notes

- Nothing open. No 👤 or 📆 lines.
- Two figures in the work order's prose are stale but tick-neutral. "169 work orders" is now 212. "39 of 39" is now 43 (before) and 44 (after). I left its prose as written.
- I am **not** offering a fix for the hyphen finding above, and it is out of scope.
- In the new README row, the pipe characters inside code spans are written `\|`, which is correct GFM inside a table cell. It is the only such escape in that table.

## Draft CHANGELOG line (for the teacher to decide)

> Tooling: `wo-gate.mjs --self-check` now proves the word boundary in the `nothing` no-dependency marker. Dropping it used to be silent, letting `nothings` or `nothing_but_a_hunch` clear a gate as "waits on nothing". 44 plants.
