# WO-1.46 — result

**Implementer** Claude (work-order-implementer), 2026-09-19 (Sat, real clock).
**Brief** `.claude/dispatch/WO-1.46-brief.md`. **Not committed, not staged** — the tree is left as
nine modified files in the working tree (six under `tools/verify/`, plus `tools/README.md`,
`TESTING.md`, `plans/work-orders/phase-1-shell-store-roster.md`). `src/`, `index.html`, `sw.js`,
`privacy.html`, `manifest.json`, `icons/` untouched — no `CACHE` bump owed. No `CHANGELOG.md` entry
written (a draft is at the foot). `grep -rn "MUTATION WO-1.46" tools/ src/` returns nothing.

## What landed

| File | Change |
|---|---|
| `C:\dev\planbook\tools\verify\lib-dates.mjs` | New `firstClearDayFrom(records, start, { weekdays })` — WO-1.44's walk lifted whole (UTC arithmetic, 60-day ceiling, returns rather than throws so the site's precondition is what goes red). Also `nextWeekday(iso)`, `isWeekday(iso)`, `nodeDaysFromToday(n)`; `tomorrow` is now `nodeDaysFromToday(1)`. Header gains a paragraph naming the fifth question the file answers. |
| `C:\dev\planbook\tools\verify\register-opens-on-term.mjs` | **The twin.** `DAY_OFF = nodeWeekdayAhead(9)` → `DAY_OFF_GUESS = nodeWeekdayAhead(9)` with the ruling at the line; `DAY_OFF` is settled after `INSTALL_252` by planting a neighbour-class record (`c_b1`, `marks: {}`) on the guessed day and walking `doc.attendance` forward in weekdays. `clear52()` takes the ISO date (or `false`) instead of a boolean, because the date is derived after the function is defined. Two new `check()`s: the derived-date precondition (walked past the plant, in the future, a weekday, zero records of any class) and a teardown check (guessed day holds what it held before the plant; `ev_wo252` gone). Section header notes the one document-derived date. |
| `C:\dev\planbook\tools\verify\attendance-passes.mjs` | WO-1.44's site: inline `preDropDayFrom()` and the `aheadDay` IIFE + local `nextWeekday` deleted; `preDropDay = firstClearDayFrom(records, nodeDaysFromToday(9))` (calendar days, as before) and `aheadDay = firstClearDayFrom(records, nodeWeekdayAhead(4), { weekdays: true })`; `aheadTo` uses the imported `nextWeekday`. Fixture check's clauses unchanged. The `offWeek` / `nodeColumns(6, 1)` block (WO-1.53's) untouched. |
| `C:\dev\planbook\tools\verify\term-edges-marking.mjs` | Ruling at `SOON`/`FAR`: **left as a guess**, reason written (below). No behaviour change. |
| `C:\dev\planbook\tools\verify\term-ended.mjs` | Ruling at `AHEAD`/`LATER`: **left**, reason written. No behaviour change. |
| `C:\dev\planbook\tools\verify\today-goes-to-term.mjs` | Ruling at the term block: **left**, reason written, including the Traps' `--today`-is-not-immunity distinction. One ride-along fold: local `calDay()` was `nodeDaysFromToday()` to the character and now aliases it (`const calDay = nodeDaysFromToday`), `nodeNow` import dropped. Every date value is identical to before. |
| `C:\dev\planbook\tools\README.md` | Call-site sentence 1403 → **1405**; WO-1.46 ledger paragraph after WO-1.53's (executed 1412 → 1414, what moved, the cousins' ruling, the real-clock figure). |
| `C:\dev\planbook\TESTING.md` | § WO-1.46 after § WO-1.53: six boxes with the run figures, the mutation, and two limits. |
| `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | WO-1.46's five Acceptance boxes ticked (the fourth with a parenthetical pointing at the reading it rests on). Status line still `🤖 CLAIMED` — the orchestrator's to move. |

## The four site decisions, one line each

1. **`register-opens-on-term.mjs:75` — derived.** The event carries `classIds: []` and the app's precedence says a record under it wins per class, so a horizon authored over a neighbour's recorded meeting contradicts the model even where this section does not read it; and authored through the form instead of the store it is the 2026-08-31 cascade exactly. Walked in weekdays because the strip draws no Saturday. The old comment's "one weekday before the term opens" was descriptive, not load-bearing — phase D's term is undated — and the derived day sits ON `OPENS` on every ordinary run now; said at the line.
2. **`term-edges-marking.mjs` (`SOON`, `FAR`) — left.** Term edges are bounds read out of `terms[]`; every gate that reads one is per-class and record-first (`!recordFor(classId, date) && …`); this class's records are cleared at plant and before each phase; nothing is authored onto the day; the writer probe on `SOON` writes this class's own record and puts the ledger back. Walking an edge past a neighbour's record would assert that a term may not open on a day another class met.
3. **`term-ended.mjs` (`AHEAD`, `LATER`) — left.** Same ruling; what it measures is which term a screen is handed and what the band says, read off `terms[]` and the `openTermIds` preference, none of which reads the ledger.
4. **`today-goes-to-term.mjs` (`OPENS` and the edges) — left.** Same ruling, plus the Traps' distinction written down: it honours `--today` and was never given a date that cannot collide, and does not need one — its only ledger write is clearing its own class.

## Commands run, with what they printed

All harness runs on the reverted (clean) tree unless marked. Logs in the session scratchpad; each read to its `EXIT=` line, not `grep -c`'d.

| Command | Summary line | Lines / time | Exit |
|---|---|---|---|
| `node tools/verify-shell.mjs` (real clock, Sat 2026-09-19) | `1414 checks · 1414 passed · 0 failed · 0 skipped` | 44,287 · 494s | 0 |
| `node tools/verify-shell.mjs --today=2026-09-21` **with `MUTATION WO-1.46`** (`return day;` before the loop — the walk never walks) | `1414 checks · 1413 passed · 1 failed · 0 skipped` — the one FAIL is the derived check: *"the day off is 2026-10-02 … holding 1 record(s)"*; every other check green, phase D included | 44,287 · 496s | 1 |
| `node tools/verify-shell.mjs --today=2026-09-21` (Mon) | `1414 checks · 1414 passed · 0 failed · 0 skipped` — guess Fri 10-02 → Mon 10-05, the weekday walk crossing a weekend | 44,287 · 495s | 0 |
| `node tools/verify-shell.mjs --today=2026-09-23` (Wed) | `1414 checks · 1414 passed · 0 failed · 0 skipped` — guess 10-06 → 10-07 | 44,287 · 495s | 0 |
| `node tools/verify-shell.mjs --today=2026-09-25` (Fri) | `1414 checks · 1414 passed · 0 failed · 0 skipped` — guess 10-08 → 10-09 | 44,287 · 495s | 0 |
| `node tools/wo-sweep.mjs` (before the README count moved) | `42 checks · 38 passed · 1 failed · 3 to review` — the call-site count, up 2 on 1403 | | |
| `node tools/wo-sweep.mjs` (final) | `42 checks · 39 passed · 0 failed · 3 to review` — `1405 check() call site(s) across 70 harness file(s), matching tools/README.md:1213`; the three REVIEW lines are the standing ones | | 0 |
| `node tools/wo-gate.mjs --audit` (final) | `PASS \| every fragment matches exactly one roadmap box …` | | 0 |
| `node tools/wo-gate.mjs WO-1.46` | `PASS \| gates clear for WO-1.46`, with the expected NOTEs (claimed; brief exists, result did not yet) | | |
| `node --check` over every `tools/verify/*.mjs` | clean | | |
| `git diff --stat` | 9 files, +383 / −70 — proportionate, no line-ending rewrite | | |

Mutation hygiene: the six fixture files were `git add`ed before the plant (a `git checkout` against an unstaged tree reverts the work with the mutation); the mutation came out **by hand** the moment the run printed its first section header (modules are imported at process start), never by `git checkout`; `grep -rn "MUTATION WO-1.46" tools/ src/` returned nothing before the three clean runs started. The staging was undone with `git reset` at the end so the whole change sits uniformly in the working tree.

## Acceptance, line by line

1. **Derived, precondition at the site, driven against a planted record on the guessed date — met, ticked.** The plant is in the fixture on every run (§ 2b's reading), the check asserts `DAY_OFF > guess`, `> today`, weekday, zero records of any class; the teardown check asserts the plant is gone. Evidence: the two PASS lines in every clean run, and the mutation reddening exactly the first.
2. **Four sites, four written decisions — met, ticked.** One derived, three left, each with the reason at its own line (quoted above).
3. **One helper in `lib-dates.mjs`, with a ceiling, used by WO-1.44's site — met, ticked.** `firstClearDayFrom()` is the only walk; `attendance-passes.mjs` calls it twice (its second inline copy, `aheadDay`, was folded too — "one of it rather than two" read as one rather than three). `grep -n "preDropDayFrom\|nextWeekday = " tools/verify/*.mjs` finds no definition outside `lib-dates.mjs`.
4. **Green on ≥ three weekdays including one `--today` onto a date the fixtures plant records on — ticked, on a reading the verifier should see.** Mon/Wed/Fri by `--today` and Sat on the real clock, all 1414/1414. **The finding § 2b asked for:** since WO-1.53, every record that survives into the twin's document is clock-derived and behind the clock — the derived check prints the full date list on each run (e.g. Sat: `09-04, 09-14, 09-15, 09-17, 09-18, 09-19` + the proof on `10-01`) — so no `--today` can put a foreign record on any forward guess any more; the collision the line wanted driven is planted by the fixture on every run instead. Each `--today` is a date the fixtures plant records on only in the literal sense (the attendance section marks today). I ticked on that reading and wrote it beside the box in both the phase file and `TESTING.md`; if the verifier wants the narrower reading, the box should come back to blank and the line be re-cut, because the narrower reading is unreachable on this tree by construction.
5. **Sweep green, `--audit` green on a clean tree — met, ticked.** Figures above. "Clean tree" here means the working tree as delivered (uncommitted), which is what the orchestrator will commit.

## Could not verify / left undone

- Nothing needs an iPad or human eyes; no 👤 or 📆 line exists on this work order.
- **The WO-2.3 fixture check's teeth were not re-proved on this tree.** The mutation reddened one check, not two: `attendance-passes.mjs`'s fixture check stayed green under the broken walk because nothing sits on its two dates on any date driven. Its clauses did not move and WO-1.44 proved them by real collision; a reader wanting them re-proved wants a planted record there too, which I did not add (it would be a second plant in a block whose comment promises exactly one attendance write). Noted in `TESTING.md` as a limit.
- **The derived day sits ON `OPENS` on every ordinary run.** Phase D cannot tell (its term is undated). A future phase arranging a dated term AND the day off would be authoring a day off on the term's first day; the note at `DAY_OFF_GUESS` is where that is written.

## Decisions the work order did not settle

- **Helper signature and mode.** `firstClearDayFrom(records, start, { weekdays })`: `records` is any array with `.date` (every harness reader's shape for `doc.attendance`), `start` is ISO, and the caller names the walk. The start is trusted (a weekday walk handed a Saturday hands it back if clear) — the sites assert the weekday themselves — rather than the helper moving a clear start, which would be a second opinion about which day was asked for. The ceiling returns rather than throws, WO-1.44's shape, so the red line is the site's precondition and names what was assumed.
- **Neighbour plant, not own-class plant.** `clear52()` wipes the open class's records before every phase, so an own-class proof record would be gone before phase D authors the event; the neighbour's survives under it, which is the 2026-08-31 shape (`ids[1]`). Planted after `__wo252save`'s snapshot so the teardown removes it; asserted, not assumed.
- **`clear52(dayOff)` takes the date.** Because `DAY_OFF` is derived after the function is defined; a `let` reassigned later was the alternative and reads worse.
- **Folding `aheadDay` and `calDay`.** Both are outside the WO's literal four-line list but inside its rule: `lib-dates.mjs` exists so there is one clock walk, and WO-1.44 had written a second inline copy of the same walk one screen below the first. `calDay` → `nodeDaysFromToday` changes no value on any date. Flagging as scope I took on the file's own rule rather than the brief's.

## Out-of-scope temptations declined

- Adding a planted record to the WO-2.3 fixture check to re-prove its teeth (above).
- Making `firstClearDayFrom()` throw at the ceiling — refused because the site precondition is the documented red line and a throw would take the section with it, which is WO-1.44's blast-radius argument in reverse.
- Touching the `offWeek` / `nodeColumns(6, 1)` block — WO-1.53's, settled.

## CHANGELOG draft (for the teacher to accept, edit or drop)

> **Harness:** the four fixtures WO-1.44 left guessing a future date off the calendar are settled. The one that authored an event — the WO-2.52 day off, the twin of the `today + 9` that cost 766 checks — now derives its date from the document over a record the fixture plants on purpose, and asserts the walk at the site on every run. The other three plant term edges, which no per-class gate reads against a neighbour's record; each says so at its own line. The walk itself lives once, in `lib-dates.mjs`, with a sixty-day ceiling. Green on four days, one of them a real Saturday; a mutation that stopped the walk reddened exactly the line built to catch it.
