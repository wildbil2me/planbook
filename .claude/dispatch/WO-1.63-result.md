# WO-1.63 result: `--today` refuses dates before a floor read off the fixtures

**Implementer:** Claude Opus (work-order-implementer), 2026-10-07. Not committed. I ran no `--start`,
`--release`, `--handoff` or `--tick`.

## The floor is 2026-09-19, not 2026-07-01. The floor run moved it.

- **Reading the fixtures first gave 2026-07-01.**
  - `tools/verify/concern-list.mjs` was the latest past-assumed date in calendar 2026. Its term is
    typed `2026-06-01 … 2026-06-30`, and its header says "THE FIXTURE IS JUNE 2026 AND IT IS IN THE PAST
    ON PURPOSE".
  - `log-entries.mjs` (meetings 2026-06-01 … 06-10) and `term-nav.mjs` (2026-02-02 … 03-02) fall
    inside it.
- **`--today=2026-07-01` was red.**
  - Result: `1832 checks · 1831 passed · 1 failed · 0 skipped`, 841s, EXIT=1.
  - The failing check: `verify/score-grid.mjs`, "at a 1280x800 laptop viewport … the box's top and
    bottom edges … are inside the viewport … (WO-3.27)".
  - Its detail: `{"pageY":505,"top":-0.12,…}`. This is the same check, with the same −0.12, that
    WO-1.62 listed among the fifteen at 2026-01-20 and did not trace.
- **What the check depends on.**
  - The real clock reads `{"pageY":576,"top":0.38,…}`, which is 71px more content above the grid.
  - The score-grid fixture types `due:'2026-09-18'` on *Unit test*, with blank cells.
  - `src/past-due.js` draws its banner when `due < today`, strictly.
- **The boundary run.** `--today=2026-09-18` ran while the 07-01 floor still allowed it:
  `1832 · 1831 · 1 failed`, 836s, EXIT=1. It was the same single failure with the identical
  `pageY 505 / top -0.12`.
- **`--today=2026-09-19` is green** (figures under Acceptance line 2).
- **What set the floor.** The score-grid fixture's due date, 2026-09-18. `TODAY_FLOOR = '2026-09-19'`
  in `tools/verify/lib-dates.mjs`, beside the parse. Its comment names this fixture, the earlier
  concern-list reading, and why the reading was not enough. A due date that is assumed past does not
  say so in any header.
- **One thing not checked.** I did not look at the rendered page to confirm the banner by eye. The
  evidence is the 71px step and the fact that it falls exactly on the fixture's due date.

## Acceptance, line by line

1. **[x] The refusal.**
   - Command: `time node tools/verify-shell.mjs --today=2026-01-20` gave **EXIT=1** in **0.141s** real
     time.
   - Why Edge never starts: the throw happens while `lib-dates.mjs` is being evaluated. ESM evaluates
     every import before `verify-shell.mjs`'s body runs, so neither the server nor Edge has started.
   - The output holds no `serving :` line, no `CLOCK   :` line and no PASS or FAIL line (grep count 0).
   - The message, verbatim:
     *"--today=2026-01-20 is before 2026-09-19, the earliest date this harness supports. The fixtures
     are built in the 2026-27 school year and some of them type dates they assume are already past -
     the latest is tools/verify/score-grid.mjs's assignment due 2026-09-18, and before it
     concern-list.mjs's June 2026 term - so an earlier day ends in red checks that are not defects
     (fifteen of them on 2026-01-20, one on 2026-09-18). Dates before the floor are out of range by
     ruling (WO-1.63), not broken. Try --today=2027-01-20 (the fixtures' own Quarter 3, measured
     green), or any date from 2026-09-19 on."*
   - `--today=2026-09-18` is refused the same way: EXIT=1, 0.130s.
   - The message is thrown as an Error, the same way the existing typo path throws, so Node prints a
     short stack under it.
2. **[x] The floor run.**
   - `--today=2026-09-19`: **`1832 checks · 1832 passed · 0 failed · 0 skipped`**, 58,018 lines, 836s,
     **EXIT=0**. Recorded in `TESTING.md` § WO-1.63, together with the 07-01 and 09-18 attempts.
   - Its titles differ from the real clock's on 4 lines only. Each of those checks prints its own date
     (WO-3.50, WO-3.49, and two WO-2.56 state lines).
   - 2026-09-19 is a Saturday. It is green anyway.
   - I also ran the suggested `--today=2027-01-20` on the delivered tree: 1832/1832, 841s, EXIT=0.
3. **[x] The real clock is unchanged.**
   - `HEAD` (`8df9db2`), extracted with `git archive` and run in scratch: **1832/1832, 835s, EXIT=0**.
   - The delivered tree: **1832/1832, 58,018 lines, 833s, EXIT=0**.
   - The `PASS|FAIL|SKIP` title sequences are **identical line for line** (`diff` printed nothing).
   - No `check()` was added. The refusal is proved by running the command, as the brief suggested.
   - After that run I made two text-only edits: one comment in `lib-dates.mjs` and the README example.
4. **[x] The docs.**
   - `tools/README.md` § "It takes one argument, and it is a date" has a new paragraph, *"And a date
     before 2026-09-19 is refused, by ruling"*. It covers which fixtures, why, how the floor moved, the
     suggestion, the move-it rule, the real-clock exemption, no upper bound, and what the floor costs.
   - The `Run:` usage block at the head of `tools/verify-shell.mjs` now shows `--today` and the floor.
   - The README example `--today=2026-09-03` is now refused by the floor, so it now reads
     `--today=2026-11-10`. The `lib-dates.mjs` header example changed the same way.

There are no 👤 or 📆 lines, so nothing needed a device. I ticked all four boxes in the work order and
in TESTING.md, and each tick has a run behind it as listed above.

## Other evidence

- `node tools/wo-sweep.mjs`: **48 checks · 45 passed · 0 failed · 3 to review**, EXIT=0. The three to
  review were already standing (sensitive field names, due-date with late/missing, the mockup banners),
  and the run after my last edit is still EXIT=0.
- `node tools/wo-gate.mjs --audit`: PASS, EXIT=0.
- `git diff HEAD -- src/ index.html sw.js` is empty, so no `CACHE` bump is owed.
- **`grep -rn MUTATION tools/ src/`.** I inserted no mutation; the guard was proved by running it.
  The grep returns only prose that was already there:
  - `tools/README.md:1436,1442,1449,1491,1530,1531,1989,2033,3031`
  - `tools/verify/keys-legend-guards.mjs:71,204,251,256`
  - `tools/verify/outreach.mjs:1578`
  - `tools/verify/score-grid.mjs:1667,2073`
  - `tools/verify/score-search.mjs:652`
  - `tools/wo-gate.mjs:2562`
  - `src/shell.js:1005`
  - `grep -rn "MUTATION WO-1.63"` returns nothing.

## Decisions the work order did not settle

- **The floor now refuses part of the fixtures' own year.** The ruling was "dates before the
  fixtures' year". Following "move it, do not fix the fixtures" also refuses **2026-09-01 … 09-18**,
  and WO-1.44 (09-01 … 09-03) and WO-1.53 (09-09 … 09-17) took their readings in that window. One
  sub-pixel check is all that excludes them.
  - I followed the work order's instruction. I did not touch the check.
  - The cost is written down in `tools/README.md` and TESTING.md.
  - The way to get September back is a separate row, owner's call: make score-grid's WO-3.27 check
    hold without the past-due banner, for example by tolerating a sub-pixel top or by scrolling to an
    integer offset. With that done, the floor could return to 2026-07-01.
- **The suggestion is a fixed date (`2027-01-20`), not one computed from the refused date.** A
  computed date would be one nobody had run. This one has been measured green twice.
- **The guard compares ISO strings** (`SHIFT_ARG < TODAY_FLOOR`) after the existing format check. With
  no `--today`, the function returns 0 before the comparison, so the real-clock run is never refused.

## Declined as out of scope

- I did not fix the WO-3.27 check's sub-pixel sensitivity. See above.
- No upper bound.

## Files changed

- `tools/verify/lib-dates.mjs`: `TODAY_FLOOR`, `TODAY_SUGGESTED`, the refusal, and comments
- `tools/verify-shell.mjs`: usage text in the header comment only
- `tools/README.md`: the floor paragraph, and the example date
- `TESTING.md`: § WO-1.63
- `plans/work-orders/phase-1-shell-store-roster.md`: four boxes ticked, plus a note on line 2. The
  status line is still the orchestrator's `🤖 CLAIMED`.

## Draft CHANGELOG entry (the teacher decides)

> `--today` now refuses a date before 2026-09-19, the earliest day every harness fixture's
> assumptions hold, within a second and before a browser starts. It suggests 2027-01-20 instead. The
> floor was first read as July 1 off the June fixtures. A run there showed a score-grid assignment
> due 2026-09-18 is assumed past as well. The real-clock run is untouched.
