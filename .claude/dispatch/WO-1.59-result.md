# WO-1.59 — result

**Implementer:** Claude (Opus), 2026-10-05. The row was already claimed. I ran no `--start`, `--release`, `--handoff` or `--tick`, and committed nothing. `tools/verify-shell.mjs` was staged during the mutation round so that a checkout could not clobber it. It was unstaged again at the end, so the index is as I found it.

## What changed

- **`tools/verify-shell.mjs`** is the only code change. It widens WO-1.58's mechanism by one method and adds no second mechanism.
  - `emulation.network` starts at `{ offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }`.
  - `noteWhatItChanges()` records `Network.emulateNetworkConditions` on its successful reply. It keeps the whole params object.
  - The browser loop copies it into `sectionStart`.
  - `putBackWhatTheSectionChanged()` sends it back last, and only if it differs from what the section received.
  - The comment block is corrected:
    - "Four things are kept" now reads "Five".
    - There is a new bullet that names where "not set" was confirmed.
    - "a copy of all five" now reads "all six".
    - The out-of-reach pointer now includes § WO-1.59.
  - Two comments that list the restore order now mention WO-1.59.
  - `runSection()` and `recoverPage()` are untouched. `runSection()` starts at line 506 both at HEAD and now.
- **`TESTING.md`**
  - The `emulateNetworkConditions` bullet in § WO-1.58's out-of-reach list is struck through. It now says the method is put back since WO-1.59 and points to the new section. The original wording is kept as the record.
  - The new § WO-1.59 covers:
    - how the method is recorded;
    - where "not set" was confirmed;
    - why `Network.enable` is not followed;
    - why the plant needs no second edit;
    - the probe;
    - runs H, A, B, C and D;
    - the revert;
    - the three boxes;
    - what is still out of reach.
- **`tools/README.md`**: one clause in the "A section that throws" paragraph. That paragraph listed what the record follows "since WO-1.58". It now adds the network conditions and points at § WO-1.59. The work order did not name this file. It was not false, only incomplete, and I changed it for the same reason WO-1.58 changed the same paragraph.
- **`plans/work-orders/phase-1-shell-store-roster.md`**: all three Acceptance boxes are ticked by hand-edit. The status line is left as the orchestrator set it.

Nothing else moved:
- Nothing under `src/` moved, so no `CACHE` bump is owed.
- Every file under `tools/verify/` is byte-identical to HEAD. `git diff --quiet HEAD -- tools/verify src` held.
- No `check(` was added or removed. The sweep's § 11 still matches 1763 call sites at `tools/README.md:1256`.
- No `finally` was added.

`git diff --numstat`:
- TESTING.md: 169 added, 2 deleted.
- `plans/work-orders/phase-1-shell-store-roster.md`: 4 added, 4 deleted. That is the orchestrator's status line plus my 3 ticks.
- `tools/README.md`: 3 added, 1 deleted.
- `tools/verify-shell.mjs`: 21 added, 5 deleted. Every deletion is a line I replaced. No line endings were rewritten: all edits went through the Edit tool, and the reverts copied byte-for-byte saves back into place.

## Where "not set" was confirmed

Both sources were taken on 2026-10-05 against the Edge the harness drives (`Edg/154.0.4258.53`, protocol 1.3). I used two throwaway scripts in the session scratchpad, outside the repo.

- **The protocol definition**, read from that browser's `/json/protocol`:
  - `offline` = *"True to emulate internet disconnection"*.
  - `-1` *"disables … throttling"* for both throughputs.
  - `latency` is a *"Minimum latency"*.
  - The method is marked **deprecated** in favour of `emulateNetworkConditionsByRule` and `overrideNetworkState`.
- **An observed fresh target.** These are `navigator.onLine` readings:
  - before any send: `true`;
  - with `Network.enable` on: `true`;
  - after `OFFLINE`: `false`;
  - after `Page.reload`: still `false`;
  - after the `ONLINE` params: `true`;
  - after `OFFLINE` and then `Network.disable`: `true`.

## Runs

All runs were the whole harness on the real clock, 2026-10-05. Each `EXIT=` is read from that log's own line, and I waited for every run to exit.

| Run | Tree | Result | Time | Exit |
|---|---|---|---|---|
| **H** | HEAD, started before any edit | 1769 · 1769 · 0 · 0 | 792s | 0 |
| **A** | change + probe | 1769 · 1769 · 0 · 0 | 779s | 0 |
| **B** | change + probe + throw | 1738 · 1735 · 3 failed · 0 | 737s | 1 |
| **C** | B with the one new restore line commented out | 1722 · 1719 · 3 failed · 0 | 722s | 1 |
| **D** | final tree, every plant reverted | 1769 · 1769 · 0 · 0 | 772s | 0 |

The probe was a temporary `console.log` at the head of `first-run.mjs`'s `run()`. `first-run` is the section after `sync-button` in `BROWSER_SECTIONS`; I read that from lines 429 and 434 rather than assuming it. It is not a new check.

| | A | B | C |
|---|---|---|---|
| `first-run` probe | `{"onLine":true,"fetch":"reached"}` served 0→1 | **`{"onLine":true,"fetch":"reached"}` served 0→1** | **`{"onLine":false,"fetch":"refused: Failed to fetch"}` served 0→0** |

## Acceptance, line by line

1. **[x] A throw between OFFLINE and ONLINE leaves the next section online and reaching the server. Mutation-proved, recorded, and reverted first.**
   - **The plant.** I planted `throw new Error('MUTATION WO-1.59 — …')` directly after `const onLineFlag = await evalJs('navigator.onLine');`, at `sync-button.mjs:520`.
     - Run B reported it as a FAIL "after 10 of its own checks", with the message reading `onLine read false`.
     - Runs B and C pay § 25's planted-throw debt. Each throw is a FAIL naming its file and line, the summary is reached, and the run exits 1.
   - **Run B: the restore works.** The probe matched run A.
   - **Run C: mutation-proved.** With the new restore removed, the probe read offline and refused, and the server never saw the request.
     - `first-run` itself threw "after 2 of its own checks" (`Cannot read properties of undefined (reading 'store')`) and lost 17 checks. I inferred, but did not measure, that this is the fresh `localhost` origin failing to load offline.
     - With detail text stripped, the B-vs-C `diff` of PASS/FAIL/SKIP lines shows that thrown section as the only difference.
   - **No second plant edit.** The section's own `OFFLINE` already differs from a normal run's network, so none was needed. TESTING.md says so.
   - **The revert, before anything else was written.**
     - Section files were copied back from saves taken before the plant.
     - `verify-shell.mjs` was copied back from its post-change save, and it matched the staged change.
     - `git diff --quiet HEAD -- tools/verify src` held.
     - `grep -rn "MUTATION WO-1.59\|WO159" tools/ src/` returned exit 1. I re-ran it after the final edit, again exit 1.
2. **[x] Whole harness green on the real clock; check list unchanged; no state change against HEAD.**
   - Run D: `1769 checks · 1769 passed · 0 failed · 0 skipped`, EXIT=0.
   - I cut the PASS/FAIL/SKIP lines of H and D at `  :: ` and diffed them. They are **identical**.
   - A vs H is also identical, so the probe changed nothing.
   - The same note as WO-1.58 applies: my edit landed while H was in flight, but H ran the modules loaded at launch, which were HEAD's.
   - After run D, only docs changed: TESTING.md, tools/README.md and the ticks. Nothing the harness loads changed. `verify-shell.mjs` still passes `node --check`.
3. **[x] `node tools/wo-sweep.mjs` green, including § 25.**
   - Result: `48 checks · 45 passed · 0 failed · 3 to review`, EXIT=0, re-run after the last edit. The three reviews are the standing ones.
   - § 25 reads "runSection() at tools/verify-shell.mjs:506-524 …".
   - `node tools/wo-gate.mjs --audit` passed with EXIT=0.

## Other findings

- **Two failures appear in both B and C and are not this work order's.**
  - The failures:
    - `first-run`'s "the run's own device was never touched" (`"gis":true` in B);
    - `outreach`'s "no Google scope is requested anywhere in this flow" (`google scripts on the page = 1`, identical in B and C).
  - The cause: the opt-in is left `true` in `localStorage`. `sync-button.mjs` sets it at about line 510, just before the plant, and the throw skips its switch-off. Every later launch then preloads Google's library.
  - This is the page-storage family that WO-1.56, WO-1.57 and WO-1.58 all put out of scope.
- **`Network.enable` is not tracked, following the Trap.** Run B showed that putting the conditions back is enough. That the domain stayed on is read from the code path, not measured.
- **Out of reach, recorded in § WO-1.59. These are follow-up candidates I did not act on.**
  1. The two non-deprecated replacement methods, `emulateNetworkConditionsByRule` and `overrideNetworkState`, are not followed. No section sends either today.
  2. The record does not treat `Network.disable` as a clear, although the fresh-target reading shows that it is one. A future section that sends `OFFLINE` and then `Network.disable` with no `ONLINE` would leave the record reading `OFFLINE`. A throw in a later section would then make recovery re-send it.
     - No section does that today.
     - Following enable/disable is what the Traps say not to start without a planted run that needs it.
     - The blocked-URL list has the same shape.
- **What the rest of run C read is inferred, not measured.** By `grep`, nothing after `first-run` sends `emulateNetworkConditions` or `Network.disable`, so the page likely stayed offline for every later section, and no later check turned red. That is the work order's "luck" claim, observed. No probe was taken past `first-run`.

## MUTATION grep

`grep -c MUTATION` over `tools/verify-shell.mjs`, `tools/verify/sync-button.mjs` and `tools/verify/first-run.mjs` gives 0 for each. `tools/README.md` has 9 hits now and 9 at HEAD; all are pre-existing prose, and my diff adds none. `TESTING.md` § WO-1.59 names the marker `MUTATION WO-1.59` in its record prose, as § WO-1.57 and § WO-1.58 do for theirs.

## Not verified

- There are no 👤 or 📆 lines. Nothing renders and nothing reaches a device.

## Decisions the work order didn't settle

- **The probe.** It was temporary instrumentation in `first-run.mjs`, reverted with the throw, not a new check. Acceptance 2 forbids changing the check list.
- **The probe URL.** I used `http://localhost:<port>/wo159-probe` with `no-cors` and `cache: 'no-store'`. It is cross-origin to the `127.0.0.1` page, so the service worker passes it through. The harness's own `SERVED` counts its arrival, so "reached" and "refused" are both local facts. This is WO-1.58's method.
- **The restore order.** Network conditions go last in `putBackWhatTheSectionChanged()`, after the blocked list, matching the order the record was widened in.
- **`tools/README.md`.** I updated its record-follows list. It was not named, but the same paragraph was updated in WO-1.58.

## Draft CHANGELOG entry (the teacher's to use or not)

> When a test section crashes while it has the browser pretending to be offline, the harness now puts the network back before the next section runs. Before this, one such crash would have left every later section running with the network refused, and almost nothing would have noticed. Nothing in the app changed.
