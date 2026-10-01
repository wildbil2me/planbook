# WO-1.58 — result

**Implementer:** Claude (Opus), 2026-09-30. The row was already claimed. I ran no `--start`, `--release`, `--handoff` or `--tick`, and committed nothing.

## What changed

- **`tools/verify-shell.mjs`** is the only code change. It widens WO-1.57's mechanism and adds no second one.
  - `emulation` gains three fields: `media: { media: '' }`, `timezone: { timezoneId: '' }` and `blocked: { urls: [] }`. Each starts at its own "not set" send, not at an invented default.
  - `noteWhatItChanges()` follows three more methods: `Emulation.setEmulatedMedia`, `Emulation.setTimezoneOverride` and `Network.setBlockedURLs`. It records each on its successful reply and keeps the whole params object, so a future `features` list would be kept too.
  - The browser loop now copies all three into `sectionStart`.
  - `putBackWhatTheSectionChanged()` sends each one back after touch, and only when it differs from what the section received.
  - The comment block above `send` is corrected. It used to say these are not put back. It now describes the three new fields and points the out-of-reach list at `TESTING.md` § WO-1.58.
  - `runSection()` and `recoverPage()`'s bodies are untouched. A failed restore call still lands in `recoverPage()`'s existing `catch`.
- **`TESTING.md`**:
  - The WO-1.57 out-of-reach bullet is struck through and points to the new section. The original wording is kept as the record.
  - New § WO-1.58 covers how the state is recorded, why `Network.enable` is not followed, the probes, runs H, A, B, C and D, the revert, all five boxes, and what is still out of reach.
- **`tools/README.md`**: one sentence in the "A section that throws" paragraph. It used to say "`setEmulatedMedia` and `setTimezoneOverride` are *not* followed", which this change makes false. It now says all three are followed and restored. The work order named two statements to correct; this was a third, so I corrected it as well.
- **`plans/work-orders/phase-1-shell-store-roster.md`**: all five Acceptance boxes ticked by hand-edit, not `--tick`. The status line is left as the orchestrator set it.

Nothing under `src/` moved. Every file under `tools/verify/` is byte-identical to HEAD (`git diff --quiet HEAD -- tools/verify src` held after the revert). No `check(` was added or removed. No `finally` was added anywhere.

## Runs

All runs were the whole harness on the real clock, 2026-09-30. Each `EXIT=` value is read from that log's own line.

| Run | Tree | Result | Time | Exit |
|---|---|---|---|---|
| **H** | HEAD, captured before any edit | 1600 · 1600 · 0 · 0 | 658s | 0 |
| **A** | change + 3 probes | 1600 · 1600 · 0 · 0 | 659s | 0 |
| **B** | change + 3 probes + 3 throws | 1540 · 1536 · 4 failed · 0 | 596s | 1 |
| **C** | B with the three new restore lines commented out (WO-1.57's left in) | 1540 · 1534 · 6 failed · 0 | 587s | 1 |
| **D** | final tree, every plant reverted, no flag | 1600 · 1600 · 0 · 0 | 648s | 0 |

Probe readings at the head of the section after each throw:

| Probe (next section) | A (normal) | B (restore in) | C (restore out) |
|---|---|---|---|
| `build-line` (after print-sheets), `print` | false | **false** | **true** |
| `attendance` (after history-dialog-write), `tz` | America/New_York | **America/New_York** | **Pacific/Honolulu** |
| `first-run` (after sync-button), probe fetch / server hits | reached / 3 | **reached / 3** | **refused: Failed to fetch / 2** |

## Acceptance, line by line

1. **[x] A print-window throw leaves the next section's `matchMedia('print')` normal.**
   - The plant is in `print-sheets.mjs` `readOnPaper()`, after `setEmulatedMedia {media:'print'}` and before its `{media:''}`. It is reported as a FAIL at `print-sheets.mjs:198`.
   - Run B: `build-line` reads `false`, the same as run A.
   - Run C: it reads `true`, and two real `calendar-drawn.mjs` checks go red: "28px floor" and "no printout of a calendar month emits a review date". With detail text stripped, those are the only two lines that differ between B and C.
   - Recorded in TESTING.md. The plants were reverted before anything else was written.
2. **[x] A throw between the two time-zone calls leaves the next section's time zone normal.**
   - **Decision the work order didn't settle.** This machine is on Eastern time, so a normal run already reads `America/New_York`, the same zone the section sets. A handed-on override would therefore look exactly like a correct restore. For runs B and C only, the plant also changed the section's override to `Pacific/Honolulu` (marked `MUTATION WO-1.58`, reverted). TESTING.md says so.
   - The throw is at `history-dialog-write.mjs:415`.
   - Run B: `attendance` reads `America/New_York`.
   - Run C: `attendance` reads `Pacific/Honolulu`, and so do the two later probes. Nothing else in the run sends a time zone, so in C it stays on for all 52 browser sections after it. No check turned red on it.
3. **[x] A throw while `*accounts.google.com*` is blocked leaves the next section unblocked.**
   - The plant goes directly after `setBlockedURLs` at ~288, with `Network.enable` already on from ~254. It is reported at `sync-button.mjs:289`.
   - The probe fetches `http://localhost:<port>/accounts.google.com-wo158-probe` with `no-cors`. That URL matches the pattern, the harness's own server answers it, and it is cross-origin to the page, so the service worker passes it through untouched.
   - The probe also counts `SERVED` hits for that path, so the server side confirms whether the request arrived.
   - Run B: reached, and `SERVED` went 2 to 3.
   - Run C: refused, and `SERVED` stayed at 2.
   - Mutation-proved.
4. **[x] Whole harness green on the real clock; check list unchanged; no state change against HEAD.**
   - Run D: 1600 · 1600 · 0 · 0, EXIT=0.
   - **How I compared:** run H was captured at HEAD before the first edit, not via `git stash`. I took every `PASS | `/`FAIL | `/`SKIP | ` line from H and from D, cut each at `  :: `, and ran `diff`. The result is **IDENTICAL**: the same 1600 names, in the same order, in the same states. Run A vs H is also identical, so the probes changed nothing.
   - **Two honest notes.**
     - The `lines ·` figure under run H's summary already includes my edit. That counter reads files from disk at the end of a run, and I edited during H. H's checks ran the HEAD modules, because all sections are static imports loaded at launch.
     - After run D I changed one word in a comment ("Three things are kept" became "Four", to match the bullets). Run D did not see that, and no harness run has been taken since. It is comment-only: `node --check` passes, and the sweep was re-run green after it.
5. **[x] `wo-sweep.mjs` green, including § 25.**
   - `45 checks · 42 passed · 0 failed · 3 to review`, exit 0. The three reviews are the standing ones.
   - § 25 reads `runSection()` at `tools/verify-shell.mjs:461-479`, unchanged.
   - Re-run after the last edit of any file.
   - `wo-gate.mjs --audit` passes.

Runs B and C also pay § 25's planted-throw debt, which is owed because I edited `putBackWhatTheSectionChanged()` and the browser loop. Each throw is a FAIL naming its file and line, the summary is reached, and the run exits 1.

## Revert proof

The six section files were copied back from copies saved before the first plant. `verify-shell.mjs` was copied back from its post-change save. Then:

```
$ grep -rn "MUTATION WO-1.58" tools/ src/
$ echo $?
1
```

The output is empty. `grep -rn WO158 tools/ src/` is also empty, and I re-ran it after the final edit (exit 1).

## Other findings

- **`Network.enable` is not tracked**, following the Trap.
  - Evidence from run B: the throw left the domain on going into `first-run`, because nothing in between sends `Network.disable`. With the blocked list cleared, `first-run` and every later section read exactly as in run A.
  - That the domain was still on comes from reading the code path. It was not measured, because no probe asks CDP whether a domain is enabled.
- **The fourth failure in run B/C is not this work order's.** `praise-column`'s "writes NOTHING to the document" check found `"flag":`. That key comes from `history-dialog-write.mjs:121`'s fixture score `{v:null, flag:'missing'}`, left in the document because the section threw before its own cleanup. It is the WO-1.56 storage family, it appears identically in B and C, and it is out of scope.
- **Found while writing the out-of-reach list; a follow-up candidate I did not act on:** `Network.emulateNetworkConditions` is sent `OFFLINE` at `sync-button.mjs:~515` and `ONLINE` at ~526. A throw between those two lines hands an offline network on, which is the same shape as the blocked list. The work order names three methods, so I did not follow it. No planted run was taken against it. `Browser.grantPermissions` and `Browser.setDownloadBehavior` are also never undone, but they are never undone on a normal run either, so a throw hands on nothing extra. All three are recorded in TESTING.md § WO-1.58.

## Not verified

- There are no 👤 or 📆 lines. Nothing renders and nothing reaches a device.

## Draft CHANGELOG entry (the teacher's to use or not)

> When a test section crashes, the browser harness now also puts back three more settings before the next section runs: print mode, an overridden time zone, and a list of blocked web addresses. Before this, one crash in the middle of a print test could leave every later section measuring the screen as if it were a printout. Nothing in the app changed.
