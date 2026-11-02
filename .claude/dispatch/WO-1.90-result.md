# WO-1.90 — front-door.mjs's installed cold launch timed out once under load · result

**Implementer:** Claude Opus, 2026-11-01. This was harness-only work. Nothing in `src/` moved:
`git status --short src/` was empty after every mutation was copied back, so no `CACHE` bump is owed.
No `check(` was added, so both counts in `tools/README.md` stay put (2199 sites, 2205 executed).
Nothing is committed. The row is still 🤖 CLAIMED as it arrived, and I ran no `--start`, `--tick`,
`--release` or `--handoff`.

## What I found

- **What `timeout` meant.** `settle()` polled every 150ms for `door` or `app` and gave up when its
  own 12000ms default ran out. That budget started after a fixed `pause(400)`.
- **What the failing line shows.** The line in WO-1.89's run 1 read
  `{"settled":"timeout","home":true,"seen":{"doorSeen":false,"appSeen":false,"appBeforeDoor":false}}`:
  - `seen` is present, so the new document was up and was the one being read.
  - `appSeen` and `doorSeen` are both false, so the app **had not booted at all** at 12.4s.
  - `home: true` tells us nothing: `#homeView` is laid out under the loading screen before boot.
- **A failed boot read the same as a stalled one.** `showBootFailure()` keeps the loading screen up
  and shows `#loadingError`. `settle()` read that as `wait` until the budget ran out. So the record
  cannot tell apart three cases:
  - the modules never ran;
  - `store.boot()` never resolved;
  - `store.boot()` threw. An IndexedDB `onblocked` on a just-wiped origin is a live candidate here.
- **Not reproduced.** I ran 315 scripted installed cold launches in six shapes: idle, sweep and audit
  looping beside it, 18 busy-loop processes on 16 cores, three instances in parallel, and the real
  section ×15 in both its old and new form. **None timed out.** The slowest took 1.5s, against a
  12s budget. Side load adds a few hundred milliseconds and nothing close to 12s; on this machine
  `wo-sweep` takes 2.8s and `--audit` 0.25s.
- **Why I did not stop and report an app defect.** Every launch in those runs booted in under 1.6s.
  The candidates left are all in the browser, and they come from the harness clearing an origin and
  relaunching on it within a second, which no teacher's device does. Nothing pointed at `src/`.
- **A second defect of the same shape, fixed but never seen here.** Each of the four page-to-page arms
  (`again`, `prefFirst`, `byList`, `fromCache`) slept 400ms and then read whatever document was up. If
  the navigation had not committed by then, it would have read the old booted page as `app`, and the
  check could have passed on the wrong page. That is WO-1.89's defect in this section. A debug trail
  over 65 settles showed it never happened here: no `leaving`, `none` or `threw`. `Page.navigate`
  answered after the commit every time.

## What I changed (`tools/verify/front-door.mjs`)

- **`navigateTo(url)`** marks the outgoing document (`window.__fdLeaving`) before `Page.navigate`. All
  six navigation sites use it: `wipe()`, `coldVisit()` and the four page-to-page arms. **Every
  `pause(400)` and `wipe()`'s `pause(250)` are gone.**
- **`settle()`**:
  - answers `leaving` while the marked document is still up;
  - answers `failed` at once when `#loadingError` shows;
  - keeps a `trail` of every distinct reading;
  - **keeps its 12000ms budget**, per the Traps.
- **`wipe()`** waits for a fresh `about:blank` before it clears the origin. It throws after 10s with
  its last reading, in the same shape as WO-1.89's `reload45()`.
- **`READ`** gained `ready`, `modulesRan` and `bootError`. `coldVisit()` returns `steps`. The installed
  check prints all of them, so if the timeout ever comes back its line says which candidate it was.
- **Nothing was made forgiving.** Every check still needs exactly `app` or `door`.
- **Mutations.** Each was run through a scratch front-door-only copy of the harness, and each `src/`
  file was copied back from a saved copy. `git diff --stat src/` was empty after each one, and
  `grep -rn "MUTATION WO-1.90"` over `src/` and `tools/` comes back empty:
  - **M1:** the door forced on an installed launch. The check FAILED with `settled: door`.
  - **M2:** the boot hangs. The check FAILED with `settled: timeout`, `loadingUp: true`,
    `modulesRan: true`, `doc: false`.
  - **M3:** the boot throws. The check FAILED with `settled: failed` and the loading screen's own
    error text.
- **About `grep -rn MUTATION tools/`.** It is not literally empty, and it was not empty at HEAD either:
  - It finds older uses of the word in `tools/README.md`, `keys-legend-guards.mjs`,
    `outreach.mjs:1578`, `score-grid.mjs:1777`, `score-search.mjs:829` and `wo-gate.mjs:2800`.
  - None of these is mine.
  - `git diff | grep MUTATION` finds only the one line in TESTING.md that quotes the grep.

## Acceptance, line by line

1. **[x] § WO-1.90 says what `timeout` meant and whether the cause was found.** §§ 1–2 explain what it
   meant and say plainly that it was **not reproduced**, with the 315-launch table and the three
   candidates that remain.
2. **[x] No longer fails because a fixed pause or budget ran out on a slow run.**
   - The fixed pauses are gone: `grep -n "pause(400)\|pause(250)"` finds nothing.
   - The 12s budget stays, and the slowest ordinary run used about a tenth of it.
   - **Limit:** the one failure on record was a launch that never booted for at least 12s, cause
     unknown. If it recurs, the check goes red again, which is what the Traps require. The detail
     will now name the cause.
3. **[x] Three consecutive full runs on one tree are green.** I made five runs. The code hash was
   `df10f337…` before every one of them.
   - **Runs 1 and 2** read `2197 · 2194 passed · 3 failed`, EXIT=1. Both times
     `verify/sync-button.mjs` threw after 35 checks in its pinned same-day clock block
     (`reading 'driveSync'` of undefined), and two checks failed downstream.
     - That section runs **before** front-door, so nothing I changed ran ahead of it.
     - Front-door's 18 checks passed in both runs.
     - It passed again on runs 3–5, and on a full run of the pre-change harness made beside run 3:
       `2205 · 2205 · 0`, EXIT=0.
   - **Runs 3, 4 and 5** each read `2205 checks · 2205 passed · 0 failed · 0 skipped`, 71,874 lines,
     32.6 lines per check, at 1229s, 1233s and 1228s, EXIT=0.
4. **[x] `node tools/wo-sweep.mjs` passes.** It printed `52 checks · 49 passed · 0 failed · 3 to review`,
   EXIT=0, on a final run after all the docs were written. The 3 are the standing reviews.
   `wo-gate.mjs --audit` exits 0.
5. **[x] § WO-1.90 carries the lines verbatim, with evidence.** Done.

There are no 👤 or 📆 lines. I ticked all five boxes in `TESTING.md` and in the work order.

## Files changed

- `tools/verify/front-door.mjs`
- `TESTING.md`: § WO-1.90, under Phase 1, just before `## Phase 2`
- `tools/README.md`: one ledger paragraph after WO-2.62's. Neither count moves.
- `plans/work-orders/phase-1-shell-store-roster.md`: the five Acceptance boxes ticked. The status
  line is untouched; its 🤖 CLAIMED diff was already in the tree.
- `.claude/dispatch/WO-1.90-result.md` (this file)

Scratch files, none committed, all in this session's scratchpad: `repro190.mjs`, `fd-only.mjs`,
`fd-orig.mjs`, `fd-dbg.mjs`, `sb-only.mjs`, `full-orig.mjs`, `front-door.orig.mjs`, the
run/rep/mutation logs and the code hashes.

## Decisions the work order didn't settle

- **I added a `failed` state.** It goes slightly past "wait on the condition", but without it a broken
  boot could only ever be told apart from a slow one by waiting 12s. It cannot make anything pass,
  because every check compares against `app` or `door`.
- **I changed the four page-to-page arms as well**, which the work order asked me to judge. They are
  the same shape and the worse version of it: reading the wrong page could pass rather than fail.
  The tap arm (`settledIn`) was left alone, because there is no navigation there.
- **The helpers stay local to the section and are not put on `h`.** That follows WO-1.89's choice.

## Declined / follow-ups for the owner

- **`verify/sync-button.mjs` threw in two consecutive runs, roughly 19:20–20:00 ET, at the same
  place.** It then passed four times in a row (runs 3–5 and the pre-change run). The likely mechanism
  is its `reload()`, which is `h.load()`: a navigation, then **a fixed 800ms**, then `waitForBoot()`.
  That is the same family as WO-1.89 and this work order, and it sits in the shared helper every
  section uses. The pinned-clock block reads `window.planbook` straight after it. I did not touch it
  because it is out of scope. **It may be worth booking `h.load()` itself** (mark the document, then
  wait for the new one to boot), because that one fix would cover every section rather than one file
  at a time.
- Nothing here proves the front-door flake is cured. It never happened on this machine. What the
  change guarantees is that its next appearance will say what it was.

## CHANGELOG draft (the teacher decides)

> **Harness:** the front-door checks no longer guess how long a page change takes. Each one waits
> until the page it left is really gone. A boot that fails now reads as "failed" straight away
> instead of as a 12-second timeout. The installed-launch check also records how far the page got,
> so if it ever goes red again the line says why. (WO-1.90. The single timeout on record could not
> be reproduced in 315 tries; nothing in the app changed.)
