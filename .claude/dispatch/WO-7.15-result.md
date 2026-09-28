# WO-7.15 result — a sync Google refused leaves the header button looking like one that worked

**Implementer:** Claude (Opus), 2026-09-27. Not committed.

## What changed

- `c:\dev\planbook\src\sync-button.js`: `syncButtonState()` has a new rung after the failed-tap
  `lapsed` one. `!a.signedIn && s.outcome === 'signed-out'` now draws `lapsed`, reading *"The last
  sync did not reach Google Drive, because the Google sign-in had ended. Tap to sign in to Google and
  sync now."* The file-top state table, the precedence-ladder comment (the decision is argued there)
  and the `tapSyncButton()` comment are updated in the same edit.
- `c:\dev\planbook\sw.js`: `CACHE` v141 → v142.
- `c:\dev\planbook\tools\verify\drive-sync.mjs`: the new red-on-HEAD check (a header tap into a 401,
  starting from a drawn `current`).
- `c:\dev\planbook\tools\verify\sync-button.mjs`: the Acceptance 3 check (refused header tap, then a
  granted sign-in tap, then freshness again).
- `c:\dev\planbook\tools\README.md`: the call-site count went from 1542 to 1544, taken from the
  sweep's own output.
- `c:\dev\planbook\TESTING.md`: new § WO-7.15, after § WO-7.14.
- `c:\dev\planbook\plans\work-orders\phase-7-sync.md`: Acceptance 1–4 ticked. The 👤 line is not
  ticked. The status line is left at `🤖 CLAIMED` (the diff there before I started was the
  orchestrator's `--start`).

`src/auth.js` and `src/drive-sync.js` are untouched, per the Trap about not re-opening WO-7.14.

## The decision the work order left open: reuse `lapsed`, not a seventh state

I reused `lapsed` because every part of it except the wording already fits this case:
- **The tap.** Both arms are `!signedIn`, so `tapSyncButton()` sends the tap to Google's sign-in,
  the door WO-7.14 made work. It can never reach `failed`'s About door.
- **About's badge.** It already draws `!` for `lapsed` (~320), so "About's badge follows it" needed
  no code.
- **The look.** The crossed-out cloud icon and white fill on navy are the header's loudest
  non-alarm, and there is no green.

A new state would have meant a new CSS class, a new icon decision and new `STATE_CLASSES` and badge
arms, all to produce what `lapsed` already draws. Only the reading differs.

The `!a.signedIn` guard is deliberate. With the guard, the rung can never tell a signed-in teacher
that her tap will sign in. Clearing happens where WO-7.14 left it: `signedInAgain()` drops the
outcome after a successful sign-in, and nothing in the ladder hides it.

The new reading ends in the same sentence as the `!signedIn` freshness label ("Tap to sign in to
Google and sync now."). As a result, WO-7.14's existing check, which asserts that suffix, still holds
without being edited.

## Acceptance, line by line

1. **[x] Red on HEAD, green with the change, both recorded in `TESTING.md` § WO-7.15.**
   - `red` ran in a `git worktree` of `f9f4c22` with `src/` and `sw.js` unchanged and only the two
     harness files copied in: `1555 checks · 1553 passed · 2 failed · 0 skipped`, 597s, `EXIT=1`.
     The only failures were the two new checks. After the refused header tap it read
     `"state":"current","label":"Synced with Google Drive at 8:40 PM. Tap to sign in to Google and sync now."`
     with About's badge hidden, which is the defect the owner reported.
   - `green` ran on the main tree: `1555 checks · 1555 passed · 0 failed · 0 skipped`, 590s,
     `EXIT=0`. After the tap it read `"state":"lapsed"`, the new label, and
     `"aboutBadge":{"hidden":false,"text":"!","lapsed":true}` with `"aboutOpen":false`.
2. **[x] Mutation-proved, then reverted before anything else was written.**
   - In the worktree, with this change copied in, the new rung was made
     `false && !a.signedIn && s.outcome === 'signed-out'` under a `// MUTATION WO-7.15` marker.
   - Result: `1555 · 1553 passed · 2 failed`, 595s, `EXIT=1`. Both new checks went red with the HEAD
     reading.
   - The worktree was removed with `git worktree remove --force`. After that,
     `grep -rn "MUTATION WO-7.15" src tools sw.js index.html` and
     `grep -rn MUTATION src/sync-button.js sw.js tools/verify/drive-sync.mjs tools/verify/sync-button.mjs`
     both found nothing, and they ran before TESTING.md, the phase file or this report was written.
     The main tree never held the mutation.
3. **[x] A sign-in that succeeds after the refusal returns the button to its freshness reading.**
   This is proven by a driven tap, not by reasoning, in `sync-button.mjs`, whose stand-in library can
   grant a token. The drive-sync.mjs stand-in only refuses.
   - Green reading: after the refused tap, `state = lapsed`.
   - The next header tap made exactly one visible request inside the click listener
     (`inListener: true`), and About stayed shut.
   - Then `state = current, outcome = in-sync, label = "Synced with Google Drive at 8:51 PM. Tap to sync now."`
4. **[x] The whole browser harness shows no new failure.**
   - `green` came back 1555/1555, `EXIT=0`, and no existing check was edited.
   - `node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review`.
5. **[ ] 👤 Laptop, deployed. Not ticked.** It needs the owner, a real Google account and the
   deployed v142. What to look for is written into TESTING.md § WO-7.15.

## What I could not verify

- Whether the `lapsed` look reads as "not synced" at arm's length on the owner's screen. That is the
  👤 line.
- The real Google 401 after access is removed. The harness plants the 401 in a stand-in Drive, and
  WO-7.14's owner reading showed that the real one reaches the same `signed-out` outcome.

## Notes

- **Where the checks live.** The work order puts the check in `drive-sync.mjs`, and it is there.
  Acceptance 3 went into `sync-button.mjs` because only that file has a stand-in library able to
  grant a sign-in. TESTING.md says this.
- **A second route into the new arm.** The new arm also covers a sync through About's Sync door that
  finds a clock-lapsed token (the WO-7.13 path). That is also a sync that did not reach Drive, so I
  judged drawing it `lapsed` to be correct rather than scope creep. No code was added for it.
- **The folded About label.** Below the phone breakpoint, About's label reads
  "About Planbook. <reading> Tap to open Google Drive sync.", so it says "Tap" twice. The existing
  failed-tap `lapsed` reading already did the same. I left it, since changing it is outside this
  work order.
- `git diff --stat` shows only intended lines (213+/16-), with no line-ending churn.

## Draft CHANGELOG line (the teacher decides)

> The header's sync button no longer looks up to date after Google refuses a sync. If Google has
> ended the sign-in (access removed, a password change), the button turns to its "sign in" look and
> says the last sync did not reach Google Drive; one tap signs in and syncs.
