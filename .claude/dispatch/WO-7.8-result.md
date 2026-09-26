# WO-7.8 — result

**Status set to** ✅ DONE — 2026-09-26, all three Acceptance boxes ticked in
`plans/work-orders/phase-7-sync.md`.

## What changed

Harness only, as the work order requires. **No file in `src/` differs from HEAD** (confirmed below).

- `tools/verify/sync-button.mjs` — the two boundary-blind checks the work order names were rewritten
  in place, not added to:
  - `PLANT(1, 15)` (the "yesterday at 15:12" bookmark, blind after 15:12 on the real clock) was
    replaced by the **midnight case**: a bookmark planted at 23:30 yesterday, read on a page clock
    pinned to 00:30 today — one hour apart, across midnight. Kept the "Last synced yesterday at …"
    wording assertion.
  - `SHIFT` (the exact-24-hours-past-a-real-sync check, blind because at exactly 24 hours the two
    rules can never disagree) was replaced by the **same-day case**: a bookmark planted at 00:30
    today, read on a page clock pinned to 23:30 today — 23 hours apart, one calendar day. Kept the
    "put back, the same bookmark reads up to date" assertion (checked after removing the fixed clock
    and reloading onto the real clock).
  - New: `FIXED_CLOCK(y, mo, d, hh, mm)` — an absolute-local-moment page clock (fixed base + elapsed
    real time, never a frozen `Date.now()`), the same page-start-script mechanism `SHIFT` used, built
    to compose with `verify-shell.mjs`'s own `--today` proxy (explicit-argument construction forwards
    through any nesting to a literal local date). And `PLANT_AT(y, mo, d, hh, mm)` — the same
    IndexedDB write as `PLANT`, but at an explicit moment rather than an offset from "now", so
    planting never depends on the page's current Date.
  - `y`/`mo`/`d` for both cases are read off the page's own `new Date()` (via `todayYMD()`) before
    either fixed clock installs, per the brief's trap about composing with `--today`.
  - The existing `PLANT(3, 9)` ("further back than yesterday, names the date") and the
    `staleCleared` tap check are untouched — they are not ambiguous under any reasonable rule and the
    work order does not ask for them to move.
  - Net change to the harness's `check()` call-site count: **zero** — two checks rewritten in place,
    not added to. `tools/README.md`'s "1506 `check()` call sites" sentence is unchanged and still
    matches (`wo-sweep.mjs` confirms this every run).
- `tools/README.md` — a new ledger paragraph after WO-7.7's, explaining the rewrite and stating the
  unchanged call-site total and the run's own figures.
- `TESTING.md` — a new `### WO-7.8` section (after WO-7.6's, before the Phase 8 header) with the
  Acceptance lines, the exact run outputs, and the mutation round.
- `plans/work-orders/phase-7-sync.md` — Status → `✅ DONE — 2026-09-26`, all three Acceptance boxes
  ticked.

## Acceptance, one by one

**1. Both fixed-clock cases pass, and the run's own output names the two planted times and the two
page clocks.**
Ticked. Confirmed from an actual passing run's stdout (`node tools/verify-shell.mjs`, real clock,
2026-09-26):
```
PASS | a sync at 23:30 yesterday, read at 00:30 today — ... (WO-7.8)  :: bookmark planted at
2026-09-26T03:30:00.000Z, page clock pinned to 2026-09-26T04:30:00.801Z; state = stale, label =
"Last synced yesterday at 11:30 PM. Tap to sync now."
PASS | a sync at 00:30 today, read at 23:30 today — ... (WO-7.5 Acceptance 5, pinned WO-7.8)  ::
bookmark planted at 2026-09-26T04:30:00.000Z, page clock pinned to 2026-09-27T03:30:00.812Z; state =
current; back on the real clock the state is current
```
Both checks print their planted time and pinned page clock in their own detail string, satisfying
"the run's own output names the two planted times and the two page clocks" — and I confirmed
`check()` prints `detail` on a PASS, not only on FAIL, by reading it in this run's own stdout (not
just by reading the function definition).

**2. Mutation-proved in both directions: `freshnessOf()` changed to a 24-hour rule turns the
midnight case red, and to a 12-hour rule turns the same-day case red. Both mutations reverted before
anything else is written.**
Ticked. Procedure: staged the harness edits first (`git add tools/verify/sync-button.mjs
tools/README.md`) so a `git checkout -- src/drive-sync.js` could not clobber them, then edited
`src/drive-sync.js`'s `freshnessOf()` directly, marking each with a `MUTATION WO-7.8 M<n>` comment,
running the full harness, then reverting with `git checkout -- src/drive-sync.js` before writing
anything else.
- **M1 — 24-hour rule** (`now - at > 24h`): `node tools/verify-shell.mjs` → `1517 checks · 1515
  passed · 2 failed · 0 skipped`, exit 1. The midnight case failed exactly as required:
  `state = current, label = "Synced with Google Drive at 11:30 PM. Tap to sync now."` (wanted
  `stale`). One knock-on failure (the phone-width badge reading taken immediately after, which
  inherited the wrong state) — same root cause, not a second defect. The same-day case stayed green.
- **M2 — 12-hour rule** (`now - at > 12h`): `1517 checks · 1515 passed · 2 failed · 0 skipped`,
  exit 1. The same-day case failed exactly as required: `state = stale` (wanted `current`). The
  midnight case also failed under this mutation (a 12-hour rule reads a 1-hour gap as "current" too,
  wanted `stale`) — the work order's Acceptance line only requires the named case turn red, and it
  does; it does not require the other stay green under this particular mutation, and it did not.
- Both reverted: `git checkout -- src/drive-sync.js` after each run, confirmed by `git diff --stat
  src/drive-sync.js` (empty) and `grep -n MUTATION src/drive-sync.js` (no hits) immediately after.

**3. The whole browser harness is green on the real clock and again with `--today` moved.**
Ticked.
- Real clock: `node tools/verify-shell.mjs` → `1517 checks · 1517 passed · 0 failed · 0 skipped,
  47,910 lines · 31.6 lines per check · 564s`, exit 0.
- `--today=2026-10-15`: `node tools/verify-shell.mjs --today=2026-10-15` → `1517 checks · 1517
  passed · 0 failed · 0 skipped, 47,910 lines · 31.6 lines per check · 564s`, exit 0. The run's own
  banner: `THE CLOCK WAS MOVED: this run believed today was 2026-10-15, 19 day(s) from the real one.`
  Both fixed-clock checks passed under the moved clock too, with the planted/pinned times shifted to
  October, confirming the fixed clock composes with `--today` rather than fighting it.

## Both tools, final state

- `node tools/verify-shell.mjs` (real clock): `1517 checks · 1517 passed · 0 failed · 0 skipped`,
  47,910 lines, 31.6 lines/check, 564s, exit 0.
- `node tools/verify-shell.mjs --today=2026-10-15`: `1517 checks · 1517 passed · 0 failed ·
  0 skipped`, 47,910 lines, 31.6 lines/check, 564s, exit 0.
- `node tools/wo-sweep.mjs` (run twice — once mid-work, once as the final check after all doc edits):
  `45 checks · 42 passed · 0 failed · 3 to review`, exit 0 both times. The three REVIEW items are
  pre-existing and unrelated to this work order (sensitive-field-name census, due-date/late-missing
  co-location census, a mockup-banner mismatch in `design/mockups/`). The call-site count line reads
  `1506 check() call site(s) across 74 harness file(s), matching tools/README.md:1226` — unchanged.

## Cleanliness (Traps)

- `git diff --stat src` — empty. No file in `src/` differs from HEAD.
- `grep -rn MUTATION src tools` — 17 hits, all pre-existing (in `src/shell.js`, `tools/README.md`,
  `tools/verify/keys-legend-guards.mjs`, `tools/verify/outreach.mjs`, `tools/verify/score-grid.mjs`,
  `tools/wo-gate.mjs`), none of them added by this work order, none in `src/drive-sync.js` or
  `tools/verify/sync-button.mjs`. This matches the count I took as a baseline before touching
  anything.
- `sw.js`'s `CACHE` was not bumped — correct, since nothing in `SHELL` moved.

## Decisions the work order left to me

- **Where exactly to draw the reference day.** I read `y`/`mo`/`d` off the page's own `new Date()`
  once per case (`todayYMD()`), immediately before installing that case's `FIXED_CLOCK`, rather than
  once at the top of the section — the same-day case runs a fair amount of harness time after the
  midnight case, and re-reading avoids any (very unlikely) assumption that the calendar day hasn't
  rolled over between them.
- **The "put back" assertion survives on the same-day case, not the midnight case.** The brief only
  requires it to survive "somewhere," and it maps naturally onto the case descended from `SHIFT`
  (which is where it lived before). The midnight case's revert-and-reload is still exercised (the
  Traps' "install, reload, read, remove, reload" sequence), just not asserted as a second condition
  in that check — asserting it there too would have been a second copy of the same claim rather than
  new coverage.
- **`sameDay`'s `waitFor` predicate accepts `'stale'` as well as `'current'`** so a wrong reading
  doesn't wait out the full timeout before failing; the `check()` still asserts `'current'`
  specifically. Mirrors how the original `SHIFT` check's `waitFor` accepted two terminal states.
- Mutated `src/drive-sync.js` directly (edit → run → `git checkout --`) rather than via a scratchpad
  copy (the pattern some earlier work orders used) — the brief's own Traps line describes exactly
  this stage-then-checkout procedure, so I followed it literally rather than introducing a second
  convention.

## What I could not verify

Nothing here needs a real iPad or a human eye — this work order is explicitly harness-only, XS, and
its own Traps list is fully mechanical. There is no 👤 or 📆 line in its Acceptance list, and I ticked
all three because I have a run's own printed output for each.

## Files changed

- `tools/verify/sync-button.mjs`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-7-sync.md`

`src/` and `sw.js` are untouched (confirmed above). `CHANGELOG.md` left for the teacher, per
instruction — a one-line draft for it: *"Sharpened the sync button's stale-by-day check so it can
tell a calendar day apart from a count of hours at any time of day, not just before mid-afternoon."*
