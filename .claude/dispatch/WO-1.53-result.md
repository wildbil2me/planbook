# WO-1.53 — the residue meets the register's earlier page for a week every September · implementer result

**Implementer** Claude Opus (work-order-implementer) · **Date** 2026-09-19 (Sat, inside the eight-day window)
**Verdict I am claiming** all six Acceptance lines closed by my own runs. No 👤 line, no 📆 line.
**Nothing under `src/` or `index.html` moved** — `git diff HEAD --stat -- src/ index.html sw.js privacy.html manifest.json icons/` is empty. No `CACHE` bump owed. No scratch file under `tools/`. `grep -rn "MUTATION WO-1.53" tools/ src/ index.html` returns nothing.

## Which shape, and why

**The first shape: the residue moves and the window does not.** The residue's date is derived off the clock — `nodeColumns(6, 3)[5]` in `tools/verify/classes-terms.mjs`, the oldest column of the page three taps of ◀ Earlier back, twenty-three weekdays before today — and the WO-2.3 range (`nodeColumns(6, 1)`) is exactly where it was. Reasoning:

- The earlier page is whatever page the app draws for the clock it is given; a range routed around the residue (shape 2, `preDropDayFrom()`'s pattern) would stop being the earlier page. The page is not the fixture's to choose.
- Cleaning the residue out at the WO-2.3 site (shape 3) is a second document write in a sub-section whose comment promises exactly one, and it removes the wrong-date catch from every later section on exactly the days it would fire.
- Offset 3 rather than 2 because the Traps name `nodeColumns(6, 2)` as the page nobody has driven; offset 3 sits behind both with a whole undriven page between. Derived, not widened — the window is untouched.
- Measured from today, the residue is never today, so the day-of window at `attendance.mjs:648` closes in the same stroke. Both are asserted, not assumed (see line 3 below).
- The victim's three dates moved with it (`farPage[5], [4], [3]`), optionally per the brief: so the neighbour's record still shares a date with the victim's first and "it deleted the right one" stays a question about `classId`, never about date. `deletionCounts()` in `src/classes.js` filters by `classId` and `exception` alone — no term edge, no date — so a record before the neighbour's first fixture term (MESSY opens 2026-08-26) counts exactly as one inside it; the plant site says so and says what to do if that ever changes.
- The reading is handed forward on the harness object as `h.residue = { classId, date, student, code }` — a fourth beside `seam`, `classesBooted`, `classSeam`, which is the convention `verify-shell.mjs` already states for "one reading, many readers" — so `attendance.mjs` re-derives nothing. Declared in the `h` literal with a note.
- The date is derived from `lib-dates.mjs` (imported `nodeColumns`), never a fresh `new Date()`, and reaches the page interpolated, the way `victimId` does.

## Files changed (all absolute)

- `C:\dev\planbook\tools\verify\classes-terms.mjs` — import `nodeColumns`; `let residue = null` beside `classSeam`; derivation + the shape argument at the plant site under "Archive, then delete"; four fixture dates interpolated; `h.residue = residue` at the foot.
- `C:\dev\planbook\tools\verify\attendance.mjs` — destructures `residue` from `h`; reader comment at :174 corrected; precondition comment at :648–660 rewritten (the "if a run ever happens to fall on one of those dates" sentence quoted and said to have been half true, and why); **one new `check()`** directly after the precondition asserting the residue is present once, byte-for-byte as planted, on a class on the bar, not today, and older than every column of `lastWeek`.
- `C:\dev\planbook\tools\verify\attendance-passes.mjs` — comment block above `const offWeek = nodeColumns(6, 1)` saying how the range can no longer hold the residue and why the range did not move; the two WO-1.44 notes at ~:2209 and ~:2327 that said the residue is "hard-coded" corrected to past tense with a pointer (comment-only).
- `C:\dev\planbook\tools\verify\lib-dates.mjs` — one parenthetical in the WO-1.44 header ("hard-codes" → "hard-coded", and what WO-1.53 found). Comment-only.
- `C:\dev\planbook\tools\verify-shell.mjs` — `residue: null` in the harness object literal, with a note.
- `C:\dev\planbook\tools\README.md` — call-site count 1402 → 1403; a WO-1.53 paragraph after WO-6.9's with the executed count 1411 → 1412 from a run.
- `C:\dev\planbook\TESTING.md` — new `### WO-1.53` section under Phase 1, before the Phase 2 separator, in WO-1.44's shape.
- `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — six Acceptance boxes ticked. Status line left at `🤖 CLAIMED — 2026-09-19` (the orchestrator's `--handoff` moves it).
- Not changed: `CHANGELOG.md` (draft below).

## Every harness run, with the summary line I read

All read to the log's own `EXIT=` line. Each ~8 min here (487–502s), not the ~4.5 the brief budgeted.

| # | Tree | Clock | Summary | Exit |
|---|---|---|---|---|
| 1 | pre-repair, untouched | `--today=2026-09-17` | `1396 checks · 1391 passed · 5 failed · 0 skipped`, 43,961 lines, 487s | 1 |
| 2 | pre-repair, untouched | `--today=2026-09-24` | `1411 checks · 1410 passed · 1 failed · 0 skipped`, 494s | 1 |
| 3 | repaired | `--today=2026-09-17` | `1412 checks · 1412 passed · 0 failed · 0 skipped`, 44,090 lines, 494s | 0 |
| 4 | **MUTATION** (`nodeColumns(6, 1)` at the plant), reverted before anything else | `--today=2026-09-10` | `1412 checks · 1410 passed · 2 failed · 0 skipped`, 494s | 1 |
| 5 | repaired | `--today=2026-09-24` | `1412 checks · 1412 passed · 0 failed · 0 skipped`, 495s | 0 |
| 6 | repaired | `--today=2026-09-23` | `1412 checks · 1412 passed · 0 failed · 0 skipped`, 502s | 0 |
| 7 | repaired | `--today=2026-09-09` | `1412 checks · 1412 passed · 0 failed · 0 skipped`, 501s | 0 |
| 8 | repaired | real clock (Sat 2026-09-19, no flag) | `1412 checks · 1412 passed · 0 failed · 0 skipped`, 500s, no "clock was moved" line | 0 |

Run 1's reds: the WO-2.3 precondition (*"2026-09-03 .. 2026-09-09 holds 1 record(s)"*), three checks measuring a non-empty week, and *"§ verify/attendance.mjs ran to the end of its own checks :: it threw after 146 of its own checks, and the rest of that section did not run — Error: nothing to click for #attendanceHead [data-dayoff-panel]"* — 15 lost against 1411, every later section ran. Run 2's one red: the one-event check, edge column `2026-09-09` reading `["dropped","taken","not-taken","not-taken","not-taken","not-taken"]`.

Run 4's reds: the new residue check (*"the class manager left {…"date":"2026-08-26"…}; … the earlier page runs 2026-08-26 .. 2026-09-02"*) and the WO-2.3 one-event check with the edge column reading `["dropped","taken",…]` — the 2026-09-24 shape reproduced on a day the untouched tree was green. So both the new check and the existing precondition have teeth against this exact defect.

On runs 3, 5, 6, 7, 8 the residue check printed the residue at `2026-08-17`, `2026-08-24`, `2026-08-21`, `2026-08-07`, `2026-08-19` against earlier pages of `2026-09-02..09`, `2026-09-09..16`, `2026-09-08..15`, `2026-08-25..09-01`, `2026-09-04..11`, and *"the document holds 1 attendance record(s) in total"* — the neighbour's record is the only attendance record in the document when § attendance opens.

**Mutation hygiene.** The repair was `git add`ed before the plant (the memory note: a checkout against an unstaged tree reverts the work with the mutation). The mutation was removed by hand with the Edit tool the moment the mutated run's log showed it had imported its modules and begun checking (~64 PASS lines in), so the armed window was under a minute; `git diff` (index vs tree) then showed only the phase file's status line. Only afterwards did I write README/TESTING/ticks.

**One honesty note on ordering.** Runs 3 and 5 were taken before I re-wrapped two comment paragraphs in `attendance-passes.mjs` (the WO-1.44 notes) to the file's line width; runs 6, 7, 8 were taken on the final wording. Those edits are comment-only and `node --check` passes; no code changed between any post-repair run and the delivered tree.

## Sweep and audit on the finished tree

- `node tools/wo-sweep.mjs` → `42 checks · 39 passed · 0 failed · 3 to review`, exit 0. § 11 reads `1403 check() call site(s) across 70 harness file(s), matching tools/README.md:1213`. The three REVIEW lines are the standing ones (sensitive field names, due-date/late-missing, mockup banner).
- `node tools/wo-gate.mjs --audit` → PASS, exit 0.
- `node tools/wo-gate.mjs WO-1.53` → PASS with the expected NOTEs (claimed; brief exists, result did not yet).

## Acceptance, line by line

1. **Pre-repair reproduction** — [x]. Run 1 above, taken on the untouched tree before any edit; both logs (runs 1 and 2) read to `EXIT=` first.
2. **Green on 2026-09-17, -23, -24, -09 and the real clock** — [x]. Runs 3, 6, 5, 7, 8: 1412/1412, exit 0 each.
3. **The residue survives, asserted by a check** — [x]. The new `check()` in `attendance.mjs` under the first precondition; read on every date driven; the mutation run proved it fails when the residue is within reach. `attendance.mjs:174`'s reason is true of the document: the residue is the sole attendance record at § attendance's first read, on an active class, on a date no page draws.
4. **WO-2.3 site still asserts the empty five-day range; comment says how** — [x]. `offWeek = nodeColumns(6, 1)` unchanged, `emptyRange.length === 0` still the first clause; the comment block above `offWeek` explains derived-not-widened and names `nodeColumns(6, 2)` as undriven. `grep -n "nodeColumns(6, 2)" tools/verify/*.mjs` finds it in comments only.
5. **Shape written at the site that moved; `:656` re-read** — [x]. The argument is at the plant site in `classes-terms.mjs`; the `:656` comment is corrected in place, quoting its own former sentence and saying which half was false and why the new check makes it true on every day.
6. **Sweep green, audit green** — [x]. Above.

## Could not verify / left undone

- Nothing owed to hardware or the calendar. Nothing left undone inside the work order.
- **Not done, deliberately:** the four other sections WO-1.44's TESTING entry names as deriving a future date off the calendar (`register-opens-on-term.mjs`, `term-edges-marking.mjs`, `term-ended.mjs`, `today-goes-to-term.mjs`) were green on all five dates but are not immune by construction against *other* fixtures; this row is about the residue, not the class, and widening it is what the Traps forbid.
- **A future crossing this leaves possible, named in TESTING.md's limits:** a section that pages ◀ Earlier three times, or plants its own calendar-month-back fixture, will meet the residue at twenty-one to twenty-three weekdays back. The new check is where that says so.

## Draft CHANGELOG entry (the teacher's to accept or rewrite)

> **Tooling.** The verification harness no longer goes red for eight days every September. A fixture the class-manager section leaves in the document on purpose — one attendance record that later sections use to catch a screen writing onto the wrong date — sat on a hard-coded 2026-09-09, and the register's *earlier* page reached it from 2026-09-17 to 2026-09-24. The fixture's date is now derived from the harness's own clock, three pages back, and the attendance section asserts at its first read that it is still there and still out of reach. Nothing in the app changed.
