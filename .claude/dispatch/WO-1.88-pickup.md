# WO-1.88 — pickup after two failed verdicts (owner's ruling, 2026-10-26)

**State when parked.** Row reads `🔍 AWAITING VERDICT`. Nothing committed. Acceptance line 3 is
**unticked** in `plans/work-orders/phase-1-shell-store-roster.md` and `TESTING.md` § WO-1.88 (it was
ticked falsely; the owner unticked it). Lines 1, 2, 4, 5 passed both verifier passes. `src/` is clean
against HEAD. Tool changes are staged (`tools/verify/log-entries.mjs`, `tools/verify/term-record.mjs`);
docs are unstaged (`TESTING.md`, `CHANGELOG.md`, the phase file).

**The ruling: option 3 — name the class, stop chasing it.** The two failures are the step-5 stop; this
file is the owner's answer to it, so a fresh `/wo WO-1.88` should **not** stop again on the
two-failure rule. Each round closed exactly the spellings it was shown and left the same hole in the
neighbouring patterns, because a regex cannot follow JavaScript's parentheses or comments. Line 3 is
made true by **wording**, not by patterns.

## Correction round 2 — wording only

The implementer, at Opus:

1. **Add no pattern and widen no regex.** The regexes stay exactly as correction round 1 left them.
   No plants are owed, because nothing that decides red or green changes.
2. **Reword each check's printed title/detail and its *fence, not a reading* comment** in both files
   so it names, **as a class**, what passes, not as a list of examples:
   - a target, member or key **wrapped in parentheses** anywhere in the chain:
     `(d.log.length) = 0`, `(d.log.length)--`, `(d.log.splice)(0, 1)`, `d[('log')] = []`;
   - a write **split by a `//` comment** at a line end (`d.log // c` ⏎ `= []`);
   - **`++` / `--`** on the array or an element (`d.log++`, `d.log[0]++`, and the
     `termRecords` twins) — outside the titles' current words, but name them;
   - brackets nested deeper than one level (round 1 already names this; keep it);
   - and every twin above for `termRecords`.
   Where the title currently promises a spelling one of these defeats, narrow the promise.
   Locations: `tools/verify/log-entries.mjs` around lines 360, 466, 527;
   `tools/verify/term-record.mjs` around lines 423, 484.
3. **Correct the false prose:**
   - `CHANGELOG.md` ~line 37: "allows a close parenthesis wherever the patterns already allowed
     whitespace" — untrue; the `.length` regexes, remover-token literals and quoted-key opening were
     not widened. Rewrite to what round 1 did, and add the option-3 sentence.
   - `TESTING.md` § WO-1.88 **CR.7** (~line 6920) — its line-3 evidence is false. Supersede it with a
     "Correction round 2" subsection rather than editing history away: record the second verdict, the
     ruling, and the new wording.
4. Run `node tools/verify-shell.mjs` **once** and `node tools/wo-sweep.mjs` **once**. Read the log's
   own `EXIT=` line.
5. Do **not** tick line 3. The verifier ticks it.

## Verifier (third pass) — scoped

- **Line 3 only, by reading.** For each title/detail and fence line in both checks, list what it
  claims and compare that list against the second verdict's passing spellings (below). PASS if every
  passing spelling is either refused or named, and no printed sentence claims more than the patterns
  do. **No new plant runs.** The second pass already proved which spellings pass, and the regexes
  have not moved.
- **Confirm the regexes did not move:** `git diff --cached` vs working tree on the two tool files
  shows only comment/string changes, no regex changes.
- **Regression:** one harness run and one sweep, both green. If `log-entries` throws
  `Cannot read properties of undefined (reading 'store')`, rerun once: the second pass saw that flake
  once and a clean rerun after it. Note it either way.
- **CHANGELOG and CR.7:** no sentence claims a widening that did not happen.
- Lines 1, 2, 4, 5: re-confirm from the tree, do not re-derive.

Target time: about 30–45 minutes for both halves. If a pass starts planting, it has left scope.

## Second verdict's passing spellings (the list line 3 is read against)

`(d.log.length) = 0;` · `(d.log.length)--;` · `(d.log.splice)(0, 1);` · `d[('log')] = [];` ·
`d.log // c` ⏎ `= [];` · `termRecords` twins of all five · unnamed outside the titles:
`d.log++`, `d.log[0]++`, `d.termRecords++`, `d.termRecords[0]++` · already named: brackets nested
more than one level. Plant logs: the scratchpad of session 74c2288a (paths in `-status.md`).

## Owed after the tick, not part of this round

- **A one-line note under WO-1.87** that this ruling exists. That work order widens the
  calendar-derived fence and will face the same choice. The owner ruled for WO-1.88 only; carrying it
  to WO-1.87 is a question to ask, not a given.
- Changelog/maintenance protocol per usual at `--tick`.
- **Check the diffstat before committing:** the tree holds staged and unstaged work from three
  rounds.
