# WO-1.93 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-11-02/03 UTC. Not committed. The row is still `🤖 CLAIMED`. All six Acceptance boxes are ticked in the phase file and in `TESTING.md` § WO-1.93, because each one has evidence I ran and read. There are no 👤 or 📆 lines.

## What was done

- **`mustBoot()`**, a new helper in `tools/verify-shell.mjs`, put on `h`.
  - It awaits `waitForBoot()` with the same 8s budget and returns nothing.
  - On `false` it takes one reading and throws. The message gives the state (`booting`/`failed`/`none`/`threw`), whether the modules ran, `readyState`, any boot error and the full reading. It ends with the page's own exceptions and error-level log entries since that document's navigation, dated by the page's `performance.timeOrigin`.
  - `load()`'s inline poll expression became the shared `BOOT_READING`, which gained one field, `navigatedAt`. Its error tail became `saidSince()`. `load()`'s behaviour and its message wording are otherwise unchanged.
  - `waitForBoot()`'s body, return value and default budget are unchanged. Only its comment moved.
- **101 sites rewritten**: `await waitForBoot();` → `await mustBoot();`, one line each. The work order's grep counts 100. The 101st is `touch-targets.mjs:63`, which has a trailing comment. WO-1.91 had also counted 101.
  - Each file's `h` destructure gained `mustBoot`, and dropped `waitForBoot` where nothing else uses it.
  - Line endings were preserved: insertions equal deletions in every one of those files.
- **`first-run.mjs`'s `goFresh()`** was an indirect discard: ten callers, plus `reloadFresh()`, threw its returned answer away. It now calls `mustBoot()` unless called with `{ reads: true }`, which only the one caller that asserts `booted === true` (line 358) does.
- **`reload45()` moved onto `h.load()`.** It still flushes and still checks the fixture is in IndexedDB first. I picked "move" over "teach it to report" because `load()` waits on the identical condition with the identical 10s deadline, and already reports `modulesRan`, the boot error and the page's errors since the navigation. A second copy of that message would be one more thing to keep in step. The one difference is that `load()` navigates to `index.html?door=skip`, where `Page.reload` kept the current URL. The section passed all 28 of its checks in each of the three runs. The reasoning is in a comment above `reload45()`.
- Docs:
  - `TESTING.md` § WO-1.93: the survey, the reader table, the change, the probe, and the Acceptance list with evidence.
  - `tools/README.md`: a ledger paragraph after WO-1.91's, `mustBoot` added to the "what rides on `h`" list, and a paragraph under CDP trap 6 telling new sections to use `mustBoot()` after a reload.

## Against the Acceptance list

1. **No discarding call; probe fails at the reload; probe not in the tree. Met.**
   - `grep -rnE "await waitForBoot\(\);" tools/verify/` finds only 18 lines, and every one binds the answer to a name that is asserted.
   - The probe is a scratch copy of the harness, `make-probe.mjs` in the session scratchpad. It blocked `src/shell.js` under the rewritten `touch-targets.mjs` site, and the section threw at that line (`tt-probe.mjs:68:1`) with `state booting, modules never ran, readyState complete`, quoting the planted page error.
   - The same probe also ran the old line, `await waitForBoot();`, under the same block. It returned after 8714ms with `planbook: "undefined"`, which is the defect.
   - `recoverPage()` brought the page back, and a clean reload passed through `mustBoot()` in 618ms.
   - Nothing of the probe is in the repo. `grep -rn MUTATION tools/ src/` shows only the nine pre-existing prose mentions plus `tools/README.md`'s ledger.
2. **`reload45()` reports modules ran and page errors. Met**, via `load()`. Under the probe it printed `…"modulesRan":false…; the page reported ["Error: PROBE-1.93: reload45 page error …"] since the navigation ← at load ← at async reload45`.
3. **Sites expecting a failed boot still read the answer and are listed. Met. There are none.** No `waitForBoot()` call expects `false`. The failed-boot proofs (`backup-restore.mjs`'s `schemaVersion: 99` blocks and `front-door.mjs`'s `settle()`) poll `#loadingError` themselves. The 19 reading sites (18 direct plus `first-run.mjs`'s) are tabled in § 2. All of them assert `true`, and none was rewritten.
4. **Three consecutive green full runs on one tree. Met.** One script, run back to back, each run waited to its `EXIT=`. The tree md5 read `e417debc78b5` before each run and after the last.
   - Run 1: `2205 checks · 2205 passed · 0 failed · 0 skipped`, `72,015 lines · 32.7 lines per check · 1207s`, `EXIT=0`.
   - Run 2: same counts, `1212s`, `EXIT=0`.
   - Run 3: same counts, `1212s`, `EXIT=0`.
5. **`wo-sweep.mjs` passes. Met.** `52 checks · 49 passed · 0 failed · 3 to review`, `EXIT=0`, run after run 3 and again after the docs were written. The three reviews are the standing ones.
6. **The `TESTING.md` section carries the lines verbatim with evidence. Met.**

No page error named `src/`, so nothing went to WO-1.92. Nothing in `src/` moved, so no `CACHE` bump is owed.

## Decisions the work order did not settle

- **Helper shape.** I used a separate `mustBoot()` rather than an option on `waitForBoot()` or a do-everything `reload()`:
  - An option would give one function two contracts.
  - A `reload()` would rewrite three lines per site, flatten five different sleeps, and could not serve the site that reloads by tapping the app's own Reload button.
  - Replacing only the discarding line makes the 101 rewrites one substitution, checkable with one grep.
  - `mustBoot()` returns nothing on success, so there is no answer for a caller to discard.
- **Eight helper reloads sit inside a `finally`** (listed in `TESTING.md` § 1). A reload there that fails to boot now throws from the `finally`, which replaces any error the `try` had already thrown. I kept the rewrite, because the work order says no call discards the answer, and those `finally` blocks already hold `evalJs` calls that can throw the same way. I am naming it rather than hiding it.
- **Pre-existing prose was left alone.** `cooldown-quiet.mjs`'s WO-1.89 comment and `verify-shell.mjs`'s `load()` comment still mention `reload45()` waiting on its own mark. Those are historical descriptions. The new comment above `reload45()` says it now goes through `load()`. A tidier pass could reword `load()`'s comment ("the condition reload45() and settle() wait on"). I left it because it is still true of the condition.

## Declined / out of scope

- I did not try to cure the module-graph flake. That is WO-1.92, and none occurred in these runs.
- `front-door.mjs`'s `settle()` and `sync-button.mjs`'s local waits were not touched. They do not call `waitForBoot()`.

## Files changed

- `tools/verify-shell.mjs`
- `tools/verify/` — 58 files (`git status --short tools/verify | wc -l`):
  - 56 files holding the 101 rewritten sites;
  - `first-run.mjs`, the `goFresh()` change;
  - `cooldown-quiet.mjs`, `reload45()` onto `load()`.

  `worker-takeover.mjs` (one of the 56) also had a comment reworded, "after waitForBoot()" → "after mustBoot()".
- `TESTING.md`
- `tools/README.md`
- `plans/work-orders/phase-1-shell-store-roster.md` — six boxes ticked; the status is untouched.

## Draft CHANGELOG entry (the teacher decides)

> **The harness's own reloads now fail where they fail (WO-1.93).** About a hundred places in the browser harness reloaded the page and then threw away the answer to "did it come back?". A reload that never booted let the section carry on and fail somewhere unrelated, with an error that named nothing. Each of them now stops at the reload and says how far the page got: whether its code ran, and any error the page reported. The cooldown section's own reload now goes through the shared one and says the same. No app code changed.
