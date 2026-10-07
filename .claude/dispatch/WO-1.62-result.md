# WO-1.62 — result

**Verdict: harness, all eleven.** Two causes, neither in `src/`. `git diff HEAD -- src/ index.html sw.js`
is empty, so no `CACHE` bump is owed. All four Acceptance lines are met and ticked in
`plans/work-orders/phase-1-shell-store-roster.md`. The status line is still `🤖 CLAIMED`, for the
orchestrator to move. Nothing is committed. The two tool files are staged (`git add`, done before the
mutation). `TESTING.md` and the phase file are unstaged.

## The eleven, from my own baseline

Baseline on the clean tree `0eaa185`, `--today=2026-11-10`:
`1806 checks · 1795 passed · 11 failed · 0 skipped`, 802s, EXIT=1.

**No check in `build-line.mjs` or `stuck-update.mjs` failed on this tree.** The work order names both,
but all ten non-term failures are in `verify/worker-takeover.mjs`. Six of their titles are about the
About build line, which is probably where the attribution came from.

1. `tapping a class tab opens it, and the term nav switches to THAT class's terms` (`verify/classes-terms.mjs`).
   **Cause: a fixture expectation.** The check wanted `termIds[1][0]`. A tab tap is an arrival, though,
   and since WO-2.54 an arrival opens the term **nearest today**. MESSY's Q1 runs 2026-08-26 … 2026-11-06
   and its Q2 opens 2026-10-15, so on 2026-11-10 the app correctly opens Q2.
2. `bringing the page back to visible calls registration.update() — once, on the first return`
3. `a second return twenty seconds later is inside the throttle window and calls nothing, and a third past the window calls it again — …`
4. `and the line it reads is WO-8.10's sentence to the character, …`
5. `the build line now SAYS the screen is older than what is stored, …`
6. `and it names the action that actually clears it — quitting from the app switcher, …`
7. `the refresh a teacher would try first is named AND refused in the same breath — …`
8. `and it wears the same caution amber the more-than-one line wears, …`
9. `the strip's Reload waited for the save to LAND before it reloaded — …`
10. `and the change is in IndexedDB on the far side of the reload`
11. `§ verify/worker-takeover.mjs ran to the end of its own checks`, which threw after 17 of 23:
    `RangeError: Maximum call stack size exceeded ← at Date.<anonymous> (<anonymous>:13:41) ← … (13:57)`

**Cause of 2–11: the clock patch, overwritten through its own proxy.** `worker-takeover.mjs:179–200`
steps the clock with `var realNow = Date.now; Date.now = function(){ return realNow.call(Date) + shift; }`
and puts it back in a `finally`. The old `SHIFT_PAGE_CLOCK` proxy had **no `set` trap**, so on a shifted
run that assignment **replaced the native `Date.now`**. Its `now` getter also looked up `Real.now()`
afresh on every call.

- **Inside the block**, the getter's closure called the stub and the stub called the closure. The
  app's visibility listener overflowed silently, so the counts read `[0,0,0]` (failures 2 and 3).
- **After the `finally`**, the native `now` was the closure itself and called itself on every
  `Date.now()` and every argument-less `new Date()`. About's line stayed empty (4–8), the update
  strip's Reload threw before reloading (9–10), and the next evaluation overflowed (11).

Both stack positions decode to line 13 of the injected script, the getter's closure. Column 57 is its
`Real.now()` call.

## The recursion hypothesis: ruled out, with evidence

- **In fact.** `SHIFT_PAGE_CLOCK` is added once, run-wide, through `Page.addScriptToEvaluateOnNewDocument`.
  Every document, reload or iframe is a fresh realm with a native `Date`, and `__clockShifted` returns
  early on a repeat within one realm. No section opens a second target or CDP session. The other two
  page clock proxies (`score-history.mjs` `CLOCK`, `sync-button.mjs` `FIXED_CLOCK`) layer over it on
  purpose and never assign `Date.now`.
- **In principle.** I took the pre-fix patch from `HEAD` and ran it in a Node `vm` realm with the flag
  deleted, installed a second time. It **does not recurse** (`recursed: false, extraShiftDays: 35`):
  the inner `Real` is the outer proxy, whose closure reaches the native `now`, so it double-shifts and
  that is all.
- **The real mechanism, reproduced.** The same vm harness, running worker-takeover's exact assignment
  against the HEAD patch, gives `inside: THREW Maximum call stack size exceeded, after: THREW …`. On the
  fixed patch it gives a number in both places. The scratch script is
  `C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\33a20df5-4612-49e9-ac7b-bdd8067eebee\scratchpad\repro.mjs`
  (not in the repo).

## The fixes

- **`tools/verify-shell.mjs` `SHIFT_PAGE_CLOCK`.**
  - The native `now` is captured once (`var realNow = Real.now`). The shifted clock, the argument-less
    construction and `Date()` are all built on that capture.
  - `Date.now` is a slot the proxy owns: `get` returns it, and a new `set` trap stores an assignment
    to it. This copies the real clock's semantics (a stub moves `Date.now()` and leaves `new Date()`
    alone), verified in the vm as `moved: true, ctorUnmoved: true, back: true, sameFn: true`.
  - A forced double install of the fixed patch also does not recurse.
  - The comment above it says why, says the booked hypothesis was ruled out, and explains why both
    halves are kept even though either alone stops the overflow: without `set`, the section's stub
    would be ignored and its throttle checks would read three silent returns.
- **`tools/verify/classes-terms.mjs`.** The nearest-term walk that already sat inline under the reload
  check moved up to a module-level `nearestTermOf()`, and the class-tab check now uses it too. The
  answer is derived in Node from `nodeToday` and the typed dates, never read off the app. It is not a
  hard-coded "pick Q2": it answers Q1 on the real clock and at 2026-01-20, and both runs pass. The
  check's detail now prints the date it was judged against. Title unchanged.

## Acceptance, line by line

1. **[x] `--today=2026-11-10` green, with the real clock's count.**
   `1811 checks · 1811 passed · 0 failed · 0 skipped`, 796s, EXIT=0.
   - The run prints *THE CLOCK WAS MOVED … 2026-11-10*.
   - I diffed its titles against the real-clock run: 1811 each. Three differ, and each only by the
     date it prints in its own title: WO-3.49 create-door (`Q1 on 2026-10-06`/`Q2 on 2026-11-10`) and
     the two WO-2.56 *Editing Fri 10/2* / *11/6* checks.
   - No skips in either run. WO-3.49's one skip (`one tap of Connect puts the Sync button on the panel …`,
     `verify/drive-sync.mjs:1358`) is **not date-dependent**: it fires when accounts.google.com is
     reached and the sign-in is still out after 6s of elapsed real time, and the shift keeps elapsed
     time unchanged.
2. **[x] Real clock unchanged in titles and count, still green.**
   - `HEAD` extracted with `git archive` into the scratchpad: `1811 checks · 1811 passed · 0 failed · 0 skipped`, EXIT=0.
   - Delivered tree: `1811 checks · 1811 passed · 0 failed · 0 skipped`, 796s, EXIT=0.
   - The title sequences are **identical line for line** (`diff` empty).
   - The work order's "1806/1806 on 9a5b316" is an older tree. The baseline's 1806 is 1811, minus six
     worker-takeover checks lost to the throw (23 − 17), plus one containment line.
3. **[x] Mutation.**
   - With the fix staged, I put `SHIFT_PAGE_CLOCK` back to its pre-fix text under a `MUTATION WO-1.62`
     comment.
   - `--today=2026-11-10`: `1806 checks · 1796 passed · 10 failed · 0 skipped`, EXIT=1. The same ten
     worker-takeover failures and the same overflow came back. The class-tab check stayed green, so the
     two causes are independent.
   - **Reverted first**, with `git checkout -- tools/verify-shell.mjs` against the staged tree.
     `git diff --stat` on the tools was then empty.
   - `grep -rn "MUTATION WO-1.62" tools/ src/` returns nothing (exit 1).
   - `grep -rn MUTATION tools/ src/` returns only prose that was already there: `tools/README.md`
     (1411–2983), `verify/keys-legend-guards.mjs`, `verify/outreach.mjs:1578`, `verify/score-grid.mjs`,
     `verify/score-search.mjs:652`, `tools/wo-gate.mjs:2562`, `src/shell.js:998`.
   - Recorded in `TESTING.md` § WO-1.62.
4. **[x] `--today=2026-01-20` run, recorded, failures named and not fixed.**
   `1807 checks · 1792 passed · 15 failed · 0 skipped`, 806s, EXIT=1. Both of this work order's causes
   pass there. The fifteen:
   - four in `term-nav.mjs` (the fixture types term starts 2026-02-02 and 2026-03-02)
   - one in `score-grid.mjs` (the WO-3.27 1280x800 box, top at `-0.12`; **cause not traced**)
   - eight in `concern-list.mjs` (the fixture is all June 2026)
   - one check plus a containment throw in `log-entries.mjs` (the term starts 2026-06-01)

   Each is named by title in `TESTING.md`. The count is four short because log-entries' throw lost five
   checks and added one containment line, confirmed by title diff.

   **Note:** 2026-01-20 is in the *previous* school year, before every fixture term. The fixture year's
   own Quarter 3 is 2027, so I also ran `--today=2027-01-20`:
   `1811 checks · 1811 passed · 0 failed · 0 skipped`, 793s, EXIT=0. Its titles differ from the real
   clock's only in the same three self-dating checks.

**Sweep.** `node tools/wo-sweep.mjs`, after all edits: EXIT=0, 45 PASS · 0 FAIL · 3 REVIEW (the three
standing REVIEWs). § 11 reads `1805 check() call site(s) across 84 harness file(s), matching
tools/README.md:1256`. No `check()` was added, so there is no count to update.

## Not verified

There are no 👤 or 📆 lines. Nothing renders and nothing reaches a device. I did not trace the cause of
the score-grid `-0.12` failure at 2026-01-20.

## Decisions the work order did not settle

- **I added no dedicated check for the clock patch.** One that runs on the real clock would break line
  2 (titles and count unchanged). One that runs only under `--today` would open a count gap on every
  shifted run. The mutation shows the existing worker-takeover checks already have teeth. A possible
  follow-up is a shifted-only check that names its date dependence, if the owner wants the patch
  guarded directly.
- **I left the stub in `worker-takeover.mjs` alone.** It is correct page code. The proxy now behaves
  like the native constructor under it, and that was the defect.
- **I did not touch the prior-year failures at 2026-01-20.** Out of scope by the line itself. Whether
  a prior-year date deserves support is the owner's call, so nothing was booked.

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs` (staged): `SHIFT_PAGE_CLOCK` and its comment
- `c:\dev\planbook\tools\verify\classes-terms.mjs` (staged): `nearestTermOf()`, and the class-tab check's expectation and detail
- `c:\dev\planbook\TESTING.md`: new § WO-1.62, before `## Phase 2`
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: four Acceptance boxes ticked
- `c:\dev\planbook\.claude\dispatch\WO-1.62-result.md`: this file

Logs, in the session scratchpad (not the repo): `base-q2.log`, `fix-real.log`, `fix-q2.log`,
`fix-q3.log`, `fix-2027.log`, `head-real.log`, `mut-q2.log`, `sweep1.log`, `sweep2.log`.

## Draft CHANGELOG entry (the teacher's to keep or drop)

> A full harness run dated in Quarter 2 is green again. Eleven checks failed under `--today=2026-11-10`
> with nothing wrong in the app. Ten of them were one harness bug: the page-clock shift let a section's
> own clock stub overwrite the browser's `Date.now` through the proxy, so the clock called itself until
> the stack ran out. The eleventh was a check that expected a class tab to open Quarter 1 whatever the
> date. Not a byte of `src/` moved.
