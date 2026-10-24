# WO-1.83 — result (implementer)

**Outcome.** All five Acceptance lines are met and ticked in the phase file. None of them is a 👤 or 📆
line. Nothing is committed. `tools/verify/log-entries.mjs` is staged (`git add`, done before the first
plant). The other edits are unstaged.

## Files changed

- `c:\dev\planbook\tools\verify\log-entries.mjs` — the append-only check (staged):
  - **Two regexes added**, each with a tagged name in `found`:
    - `assignment to .length`: `/\.length\s*(?:\*\*|<<|>>>?|&&|\|\||\?\?|[-+*\/%&|^])?=[^=]/`
    - `bracketed log key assigned`: ``/\[\s*(['"`])log\1\s*\]\s*=[^=]/``
  - **Two tokens added**: `.fill(` and `.copyWithin(`.
  - **Wording rewritten**: the check's title now names all nine shapes. The detail line's *a fence, not a reading* clause now names five shapes that still pass. The comment's "A FENCE, NOT A READING" paragraph is rewritten to argue each addition and name what still passes.
- `c:\dev\planbook\TESTING.md` — the new § WO-1.83, under Phase 1, after § WO-1.82.
- `c:\dev\planbook\CHANGELOG.md` — a WO-1.83 entry at the top of `[Unreleased]`. The brief asked for it as a deliverable, so it is written. Edit it or drop it as you see fit.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — the five Acceptance boxes are ticked. The status line still reads `🤖 CLAIMED` from the orchestrator's `--start`. I did not run `--tick`, `--start` or `--release`.

`src/` is unchanged. `git diff --stat src/` and `git diff --cached --stat src/` both print nothing, so no `CACHE` bump is owed.

## Commands run, with results

| Command | Result |
|---|---|
| scratch regex test (outside repo), 14 strings + `src/log.js` | `.length` fires on `= 0`, `=0`, `-= 1`; not on `===`, `==`, `>=`, `<=`, `!==`, `- 1`. Bracket fires on `'log'`, `"log"`, `` `log` `` assigned; not on `== x` or `['log'][0] = x`. Neither fires on today's `src/log.js`; no `.fill(`/`.copyWithin(` in its code |
| `node tools/wo-sweep.mjs` (after harness edit) | `EXIT=0`, 52 checks · 49 passed · 0 failed · 3 to review |
| `node tools/verify-shell.mjs` clean (src at HEAD) | `EXIT=0`, 2117 · 2117 passed · 0 failed · 0 skipped, 1168s |
| plant A run | `EXIT=1`, 2117 · 2116 passed · 1 failed, 1166s |
| plant B run | `EXIT=1`, 2117 · 2116 · 1 failed, 1163s |
| plant C run | `EXIT=1`, 2117 · 2116 · 1 failed, 1167s |
| plant D run | `EXIT=1`, 2117 · 2116 · 1 failed, 1166s |
| `node tools/verify-shell.mjs` final, after all reverts | `EXIT=0`, 2117 · 2117 passed · 0 failed · 0 skipped, 1152s |
| `node tools/wo-sweep.mjs` (after TESTING/CHANGELOG/ticks) | `EXIT=0`, 52 checks · 49 passed · 0 failed · 3 to review (the three standing reviews) |
| `node tools/wo-gate.mjs WO-1.83` | `PASS | gates clear`. It also prints two NOTEs: the row is CLAIMED, and the dirty tree reads as an interrupted draft. Both are expected mid-dispatch |

Every run above was waited out to its `EXIT=` line, and every figure quoted is from that run's own log.

## The four plants and their red lines

**How they were made.** Each plant went into `writeEntry()`, after `d.log.push(entry);`, under a `// MUTATION WO-1.83 plant X` line. Each was written as `if (entry === null) <shape>;`. The shape is in the source but never runs, because `entry` cannot be null there. So the append-only check was the only failure in each run.

**How each came out.** `git checkout -- src/log.js`. After each revert, `git diff --stat src/` was empty and `grep -rn "MUTATION WO-1.83" src/ tools/` was empty.

**What fired.** In every run the failure was line 2160, `FAIL | append-only is structural rather than promised …`. The detail read:

- A `d.log.length = 0` → `removers found: ["assignment to .length"]; FAILED ON: remover(s) ["assignment to .length"]`
- B `d['log'] = []` → `removers found: ["bracketed log key assigned"]; FAILED ON: remover(s) ["bracketed log key assigned"]`
- C `d["log"] = []` → the same as B
- D `d.log.fill(null)` → `removers found: [".fill("]; FAILED ON: remover(s) [".fill("]`

Each plant fired one remover, its own. The push and guard figures were unchanged in every run: 2 pushes, the guard present 2 times, 247 lines of code.

## Acceptance, line by line

1. **Met.** verify-shell passes, the check reports 2 pushes and the guard 2 times, and its removers read none. Evidence: the clean run and the final run, both `EXIT=0` and 2117/2117. The final run's check reads `2 push(s) … guard is present 2 time(s) … removers found: none`.
2. **Met.** Each plant turns the check red and names its remover, as listed above. All four are reverted, and TESTING.md § WO-1.83 quotes the red lines.
3. **Met.** The detail line names what still passes it:
   - `d.log.length--`
   - an index write through an alias (`l = d.log; l[0] = x`)
   - `d['log'][0] = x`
   - a key held in a variable (`d[k] = []`)
   - `Object.assign(d, { log: [] })`

   The comment above the check adds `Reflect.set`. The two holes this work order closed are no longer named.
4. **Met.** verify-shell and wo-sweep both pass: the final verify-shell run `EXIT=0`, and wo-sweep `EXIT=0` on both runs.
5. **Met.** TESTING.md § WO-1.83 carries all five lines verbatim, with evidence for each.

## What I could not close, and things to flag

- **`grep -rn MUTATION src/` is not empty.** The brief requires it to be. It finds `src/shell.js:1077`, `A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE`. That line is prose already at HEAD, introduced at `7f6b33b`, and I did not plant it. `grep -rn "MUTATION WO-1.83" src/ tools/` is empty, and `git diff --stat src/` is empty. I left `src/shell.js` alone because it is outside this work order's scope. A broad `MUTATION` grep will keep matching this line on every dead-dispatch audit. Rewording it is a separate decision, and I did not take it.

## Decisions the work order did not settle

- **Compound assignment to `.length` (`-=`, `|=`, …) is refused.** The deliverable says "an assignment to `.length` of anything", and in JavaScript's grammar these are assignments; `-=` removes entries just as `pop()` does. I argued it in the comment. Leaving `.length--` out is the matching call, because an update expression is not an assignment, and it is named as still passing.
- **The `.length` regex covers any receiver, not only `d.log`.** That catches aliases, and `src/log.js` has no legitimate write to `.length`.
- **`.sort(`, `.reverse(` and `.unshift(` are not on the list.** That follows "per token, not by symmetry": they reorder or add, and take nothing away. The comment notes that a reorder would move the same-second tie-break. That is a question about ordering, not about append-only.
- **Plants were written so they never run** (`if (entry === null) …`) rather than as bare statements. A bare `d.log.length = 0` would empty the log at runtime, turn the log-entries checks red as well, and make the run's single failure harder to attribute. The brief's exact shape text is in each plant.

## Declined (out of scope)

- Closing the five shapes that still pass. That would be a widening, and each would need its own argument.
- Rewording the `src/shell.js:1077` prose.

## Draft changelog

Already written into `CHANGELOG.md`, under the heading "The log's append-only check closes the two holes it named — 2026-10-24".
