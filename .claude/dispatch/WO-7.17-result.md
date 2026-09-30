# WO-7.17 — result

**Implementer:** Claude Opus, 2026-09-30. The row reads 🤖 CLAIMED. I did not run `--start` or `--release`. Nothing was committed.

## What changed

- `src/auth.js`: in `reconnect()`, the line straight after the request (`const asking = … ask(false)`) is now `const connectedBefore = syncOptedIn;`. It sits after the request and before the one `await`. A comment block above it gives the argument. The success announcement is now `connectedBefore ? 'Reconnected to Google Drive.' : 'Connected to Google Drive.'`. The second sentence is `connect()`'s own success sentence, reused rather than a third wording coined. The failure sentence is untouched. No import was added and no storage is read.
- `sw.js`: `CACHE` goes from `planbook-shell-v146` to `planbook-shell-v147`.
- `tools/verify/first-run.mjs`:
  - `WATCH_LIVE`: a `MutationObserver` on `#srLive` that records every non-empty sentence, in order.
  - Check one sits after the Drive door's granted tap in the Acceptance 4 block. It asserts the region said `Connected to Google Drive.`, never anything matching `/Reconnected/`, and that the opt-in is now `'true'`.
  - Check two sits after the Acceptance 2 checks. It uses the same opted-in fresh device, reloaded so the token is gone. It confirms `signedIn === false` and that `#syncBtn` is drawn, taps it, and asserts the region said `Reconnected to Google Drive.` and not the bare `Connected to Google Drive.`.
- `tools/README.md`: the recorded call-site count goes from 1584 to 1586. A ledger paragraph for WO-7.17 follows WO-5.17's.
- `TESTING.md`: a new § WO-7.17 at the foot of Phase 7, with all three runs.
- `plans/work-orders/phase-7-sync.md`: the four Acceptance boxes are ticked. The status line was already CLAIMED before I started; that was the orchestrator's `--start`, not my edit.

## Commands run, with results

Every harness run went to completion. Each result below was read from the log's own summary line and `EXIT=` line after the run exited.

1. `grep -rn MUTATION src/ tools/` at the start: 17 lines. All are pre-existing prose or comments, and none is a live mutation.
2. **Red on HEAD's `src/`**, with the harness changed and `src/` untouched: `node tools/verify-shell.mjs`
   - Result: `1600 checks · 1599 passed · 1 failed · 0 skipped`, 658s, EXIT=1.
   - The one failure was the door check: *the live region said `["Reconnected to Google Drive."]`; opt-in after = "true"*.
   - The header companion check passed.
3. **Green, with the change:** `node tools/verify-shell.mjs`
   - Result: `1600 checks · 1600 passed · 0 failed · 0 skipped`, 51,064 lines, 657s, EXIT=0.
   - The door check read `["Connected to Google Drive."]`.
   - The header check read `["Reconnected to Google Drive.", "Google Drive already has this year exactly as it is on this device. Nothing need…"]`.
4. **Mutation:**
   - `src/auth.js` was copied to the scratchpad. The success branch was set back to the unconditional `'Reconnected to Google Drive.'` and marked `// MUTATION WO-7.17`.
   - `node tools/verify-shell.mjs` → `1600 checks · 1599 passed · 1 failed · 0 skipped`, 657s, EXIT=1. The one red was the door check (`["Reconnected to Google Drive."]`); the header check stayed green.
   - Reverted by copying the clean file back before anything else was written. `grep -rn "MUTATION WO-7.17" src/ tools/` then exited 1 with no output.
5. `node tools/wo-sweep.mjs`, first run: `45 checks · 41 passed · 1 failed · 3 to review`, EXIT=1. The failure was the stale call-site count (1586 in the harness against 1584 recorded). I fixed `tools/README.md`.
6. `node tools/wo-sweep.mjs`, second run: `45 checks · 42 passed · 0 failed · 3 to review`, EXIT=0.
7. `node tools/wo-gate.mjs WO-7.17`: `PASS | gates clear for WO-7.17`. Its notes are the expected ones: CLAIMED, and a dirty tree with no result file yet.
8. `node --check` passes on `src/auth.js` and `tools/verify/first-run.mjs`.
9. `grep -rn MUTATION src/ tools/` at the end: 17 lines, the same pre-existing prose as at the start.

## Acceptance

1. [x] **Red on HEAD, green with the change, both runs in `TESTING.md` § WO-7.17.** Evidence: runs 2 and 3.
2. [x] **Mutation-proved, and reverted first.** Evidence: run 4.
3. [x] **The header's reconnect still announces *Reconnected to Google Drive.*** Evidence: the companion check passed on all three runs.
4. [x] **The whole harness shows no new failure.** Evidence: run 3, 1600/1600, EXIT=0. The count moved 1598 → 1600, which is exactly the two added sites.

There are no 👤 or 📆 lines on this work order.

## Decisions the work order left open

- **How `reconnect()` tells a first sign-in from a reconnect.** I used `syncOptedIn`, the value `src/sync-button.js` tells `auth.js`. I checked that it is set on a fresh device before the door's tap: `syncButton.start()` runs on every boot (`src/shell.js` ~4031) and calls `auth.noteSyncOptIn(optedIn())` *before* its early return. So a device that never connected has told `auth.js` `false`, and the header button, which is only drawn when opted in, reads `true`.
  - The value is captured synchronously, after the request and before the `await`. The opt-in is only set after the promise settles (`src/shell.js` `afterDriveAuthChange` → `rememberOptIn()`), so a successful sign-in cannot flip the sentence.
  - I did not import `src/prefs.js` and did not read `localStorage`, per the brief.
- **An edge case I accepted:** a device that connected once, is still opted in and still untouched, and then taps the door hears "Reconnected". That is true, and the function's comment says so.
- **Placement of the header companion.** I put it in `first-run.mjs` next to the door check, as the Deliverable asks, rather than in `sync-button.mjs`. It reuses the device the door had just opted in, which is the realistic path: a first sign-in from the door, then a later launch that reconnects from the header.

## What I could not verify

- What VoiceOver actually speaks on a real iPad. The harness reads the live region's text, not speech. The work order carries no 👤 line for this, so I have not added one.

## Temptations I declined (out of scope)

- None of substance. I left the failure sentence and `connect()` untouched. The privacy documents need no edit, since nothing changed about when Google is asked.

## Draft changelog note (for the teacher to decide)

> A new device that opens its year from Google Drive now hears "Connected to Google Drive." rather than "Reconnected" — the first thing Planbook says about Google on that device is true. The header's sync button still says "Reconnected".
