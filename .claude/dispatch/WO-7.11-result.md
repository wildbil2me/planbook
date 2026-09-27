# WO-7.11 — result (implementer, Claude Opus)

**Summary.** About's Drive section now draws the switch-off whenever this device is opted in,
signed in or not. The words depend on the state: *Disconnect* when signed in (behaviour unchanged),
*Stop syncing on this device* when signed out. With no sign-in the tap asks Google for nothing — no
token request, no revoke, no library load — so it works offline and behind an admin block. After the
tap the header button is gone at once, and the next reload fetches nothing from Google.

Acceptance lines 1–5 are asserted in the harness and pass. Line 5 was mutation-proved, and every
mutation was reverted and checked. Line 6 (👤 iPad) is not ticked.

**The harness is not fully green: 3 failures, and they are not from this work order.** They are the
three `verify/date-zero-key.mjs` checks, and they fail the same way on unmodified `HEAD` (details
below). Nothing committed.

## Against the Acceptance list

1. **[x] Opted in, no token: About draws it; the tap clears the opt-in, removes the header button,
   makes no token request.** New check *"WO-7.11 Acceptance 1 — …"* in
   `tools/verify/sync-button.mjs`, which runs as part of `node tools/verify-shell.mjs`. Result:
   - Before the tap: `signed in = false, opt-in "true"`, switch-off `{"shown":true,"laid":true,"text":"Stop syncing on this device"}`.
   - After the tap, read with About still open: opt-in `"false"`, header button hidden, switch-off not shown.
   - Stand-in counts: `token requests 0 → 0, revokes 0 → 0`.
   - Announced: *"Google Drive sync is off on this device. Nothing here or in your Google Drive changed."*
   - A companion check measures both buttons side by side under a coarse pointer, and passed:
     - at 390: switch-off 164x44, Connect 138x44, both inside the panel, no overflow
     - at 834: 183x44 and 153x44, same result
2. **[x] Network refused.** The page was reloaded opted in, with Google blocked and no stand-in, so
   the library was never loaded. Then the browser was taken offline (`Network.emulateNetworkConditions`).
   Result: `navigator.onLine = false`, opt-in `"false"`, header button hidden, and **zero requests of
   any kind** during the tap.
3. **[x] Signed in: today's Disconnect.** Result: label `"Disconnect"`; afterwards signed out, no
   token held, **exactly 1 revoke, of the token that was held**, opt-in `"false"`, header button
   hidden, 0 token requests. Announcement unchanged (*"Signed out of Google Drive…"*).
4. **[x] Reload after switching off.** No stand-in, Google blocked at the browser (a blocked request
   still shows on the wire). Through a launch and a return to view: `0 request(s) to
   accounts.google.com and 69 to this origin`, no Google object on the page, 0 script tags, no header
   button. The positive control is the existing WO-7.10 check in the same section: the same reload
   while opted in does put `/gsi/client` on the wire.
5. **[x] Mutation-proved, reverted first.** Each mutated file was backed up to the scratchpad and
   restored by copy, confirmed with `cmp` plus `grep -n MUTATION` before anything else was written.
   - **How the runs were made:** a scratch copy of the entry file outside the repo, running the four
     Phase 7 sections only.
   - **Unmutated baseline:** `103 · 98 · 5 failed`. The 5 are the fixture-dependent checks WO-7.10
     also named: four WO-7.7 checks and one `drive-sign-in` check.
   - **M1** — `!state.signedIn` put back as the only condition: `103 · 94 · 9 failed`. **Acceptance 1
     went red**; 2, 4 and the hand-back went red too, because the tap was never made. Acceptance 3
     stayed green, as it should.
   - **M2** (the Trap) — the handler calls `auth.reconnect()` first when signed out:
     `103 · 96 · 7 failed`. Acceptance 1 and 2 went red.
   - **M3** — `noteSyncOptIn()` without its repaint: `103 · 95 · 8 failed`. Acceptance 1, 2 and 3
     went red: the control stayed on the open panel after the tap.
   - These runs came before I added the 390/834 measurement, so they have one check fewer.
   - `grep -n MUTATION` over every file I touched finds only two lines that were there before
     (`src/shell.js:937`, `plans/work-orders/phase-7-sync.md:367`).
6. **[ ] 👤 iPad, deployed.** Not ticked. It needs a real iPad and a deploy (this also supplies
   WO-7.10's open next-deploy reading).

The deliverable "the harness workaround comes out" is done:
- The connect-first block at ~386 is replaced by the four readings above, all taken from the
  signed-out state.
- The hand-back at ~1100 used to click only if a sign-in happened to be standing. It now switches sync
  off through the control from signed out, and asserts it (new check *"WO-7.11 — and the section
  switches sync off…"*).

## Tool runs (from output I read)

- **`node tools/verify-shell.mjs`** (final tree): `1549 checks · 1546 passed · 3 failed · 0 skipped`,
  576s, exit 1, 2026-09-26 ~22:40 EDT, real clock.
  - All three failures are `verify/date-zero-key.mjs`: the `0`-key date-field checks. The field stays
    at `"2026-11-20"`.
  - **They fail the same way on unmodified `HEAD`:** `1543 checks · 1540 passed · 3 failed`, run from a
    `git worktree` of `8ef1b81` at ~22:15 EDT. The worktree has since been removed.
  - Edge is 154.0.4258.37, last updated Sep 24, so not a browser update today. TESTING.md records 1543
    green earlier today. I suspect the clock: the local date is Sep 26 while UTC had already rolled to
    Sep 27. **Not investigated further**: out of scope, and it cannot be run on its own (it skips
    without the earlier sections).
- **Intermittent, not counted:** `verify/drive-sync.mjs`'s *"a sign-in that has already run out when
  the teacher taps Sync…"*.
  - It failed in 2 of 14 runs of this tree (Connect read as hidden). It passed in 4 of 4 runs of `HEAD`,
    and in the final counted run.
  - I added a trace (in the scratchpad only): a MutationObserver on `#driveConnectBtn`. Over 8 more runs
    it never caught the failure.
  - That check reads the Connect button as the last paint left it, and `src/drive-sync.js` never
    repaints it.
  - Most likely cause: `verify/drive-sign-in.mjs` ends with a real Connect tap. Its `connect()` is still
    waiting on the live Google library when `drive-sync` seeds a token, and when it settles it repaints
    with that token standing.
  - I cannot prove my change has no effect on it. Nothing I changed runs in that window: `noteSyncOptIn()`
    is reached only at boot and from `forgetOptIn()`, and neither happens there. **Worth a follow-up.**
- **`node tools/wo-sweep.mjs`:** `45 checks · 42 passed · 0 failed · 3 to review` (the three standing
  REVIEWs); § 11 reads 1538 call sites. An earlier run failed on a `localStorage` token in a comment I
  had written in `src/auth.js`; I reworded the comment.
- **`node tools/wo-gate.mjs WO-7.11`:** `PASS | gates clear`.

## Decisions the work order left open

- **How `src/auth.js` learns the opt-in: it is told, not asked.** A new exported
  `noteSyncOptIn(on)` sets a module boolean and repaints the panel.
  - `src/sync-button.js` calls it in `start()` (before its early return; `rememberOptIn()` reaches
    `start()`) and in `forgetOptIn()`, each time with the value read back from storage.
  - Rejected: importing `src/prefs.js`, which breaks "imports src/live-region.js and nothing else", and
    reading the key directly, which adds a second reader of the key and puts storage access in this
    file. The argument is written at `syncOptedIn`.
  - The repaint inside `noteSyncOptIn()` is what makes every repaint agree: the shell handler calls
    `disconnect()`, which paints, and only then `forgetOptIn()`. M3 proves the repaint is load-bearing.
- **Wording: one element, two words.** *Disconnect* signed in (it signs out, revokes and switches
  off, under "Connected…"). *Stop syncing on this device* signed out. Neither says delete or remove.
  The argument is at the point of departure in `refreshAuthChrome()`.
- **Revoke only when `fresh()`**, where it used to be whenever any session existed. A token in its
  last minute counts as signed out, so it is left to lapse rather than making a request from the
  signed-out path. For a signed-in device the behaviour is identical to before.
- **Public documents.** *"until Disconnect is tapped"* would have become inaccurate for the
  signed-out label, so both `privacy.html` and `docs/FERPA.md` now read *"until sync is switched off
  in About — which needs no network and no sign-in —"*. Same words in both, same sitting, and each
  header comment gains a WO-7.11 sentence.
- **Status line left alone.** It still reads *"Not connected. Planbook works exactly the same either
  way."* beside the new control. Rewording it for the opted-in, signed-out state is tempting but not
  asked for, and existing checks read it.

## Declined / noted

- Did not touch `docs/sync.md`: "Disconnect clears it" is still true of the same control.
- No Drive-file delete, and no change to token storage or the boolean opt-in.
- No `CHANGELOG.md` entry. Draft for the teacher: *"Sync can be switched off without signing in.
  About now shows 'Stop syncing on this device' on a device that has turned sync on but is not signed
  in — which since the last update is every launch — and the tap needs no network: the header button
  goes, and Google's library stops loading from the next launch. Nothing on the device or in Drive is
  deleted."*
- The comments in `tools/verify-shell.mjs` and `verify/sync-button.mjs` said the section reloads
  "nine times"; that was already stale. Both now say fourteen, which is the literal count.

## Files changed

- `c:\dev\planbook\src\auth.js` — `syncOptedIn`, `noteSyncOptIn()`, the switch-off condition and
  words in `refreshAuthChrome()`, and `disconnect()` (revoke on `fresh()`, words for each path)
- `c:\dev\planbook\src\sync-button.js` — tells auth in `start()` and `forgetOptIn()`
- `c:\dev\planbook\src\shell.js` — comment on the Disconnect branch
- `c:\dev\planbook\src\prefs.js` — comment on `driveSyncOptIn`
- `c:\dev\planbook\index.html` — comment on `#driveDisconnectBtn`
- `c:\dev\planbook\sw.js` — `CACHE` v138 → v139
- `c:\dev\planbook\privacy.html`, `c:\dev\planbook\docs\FERPA.md` — the data-flow sentence and header notes, as a pair
- `c:\dev\planbook\tools\verify\sync-button.mjs` — revoke counting in the stand-in, READ fields, the WO-7.11 block, the hand-back
- `c:\dev\planbook\tools\verify-shell.mjs` — comment only
- `c:\dev\planbook\tools\README.md` — call-site count 1532 → 1538, plus a ledger paragraph
- `c:\dev\planbook\TESTING.md` — § WO-7.11
- `c:\dev\planbook\plans\work-orders\phase-7-sync.md` — Acceptance 1–5 ticked (the status line was the orchestrator's `--start` edit)
- `c:\dev\planbook\.claude\dispatch\WO-7.11-result.md` — this file
