# WO-7.10 — result (implementer)

No mutation is armed in the tree. All three mutations were reverted by copying back a pre-mutation
backup, each checked with `cmp` against it, and `grep -rn "MUTATION M[0-9]" src tools` returned
nothing. The full harness run and both sweeps below all came after the last revert.

## Summary

- **The launch-time renewal is gone.** `renewSilently()` and both of its call sites (`start()` and
  the visibility listener) are out of `src/sync-button.js`. In their place is
  `auth.preloadSignIn()`, a new export that loads Google's library and asks it for nothing. It runs
  at launch on an opted-in device, and again on a return to view only if the library is still
  missing.
- **`ensureFreshToken()` no longer asks Google anything.** It returns the token it holds, or null.
  Its one remaining caller, `syncNow()`, reached it after two awaits (a flush and a disk read),
  which is outside any tap's gesture. That made it a second path to a window with no tap behind it.
  The false comment above it ("SILENT ONLY, AND NEVER A POPUP") is rewritten. The `requestToken()`
  comment that said `prompt: ''` shows nothing is corrected too.
- **A header tap with no token signs in, then syncs.** `tapSyncButton()` calls `auth.reconnect()`
  synchronously inside the click listener's stack, and starts `syncNow()` only after a token comes
  back. With no token, the button reads the bookmark's freshness (current, ahead or stale). Its
  label then ends "Tap to sign in to Google and sync now."
- **`src/drive-sync.js` gained `signedInAgain()`.** It drops a `signed-out` outcome when a sign-in
  succeeds. `src/shell.js` calls it after a successful Connect, and `src/sync-button.js` calls it
  after its tap's sign-in. This fixes the red line the harness actually found (see below) at its
  cause, not by clearing it on paint.
- **The privacy documents changed, in the same sitting and identically.** `privacy.html` and
  `docs/FERPA.md` lost the clause "Planbook asks accounts.google.com to renew the sign-in without a
  tap — then, and again whenever…". That clause was false once the renewal went. The work order
  said keeping the preload keeps both documents "true word for word". It does for the loading
  sentence, but not for the renewal clause next to it. The replacement ("…until Disconnect is
  tapped — and Planbook asks Google for a sign-in only when Connect or the sync button is tapped.")
  is identical in both files after normalisation (`identical: true`, same method as WO-7.6). Both
  comment blocks above the statement carry a dated WO-7.10 note.
- **`CACHE` bumped v137 → v138.** v137 is on `origin/main`, so it has shipped.

## The actual red-line sequence

I observed this in the harness; I did not infer it. I wrote a scratch section (in the scratchpad,
not committed) and drove a `git archive HEAD` copy of the WO-7.5 tree with it. The stand-in library
modelled three browsers:

- **laptop:** a window opens only while `navigator.userActivation.isActive`;
- **iPad with pop-ups blocked:** a window opens only from inside the click listener's own stack;
- **iPad home-screen app:** every window opens, and the teacher closes it unfinished.

What it showed:

1. **Launch, all three models.** One "silent" request is made with no activation.
   - Laptop and blocked iPad: it is refused as `popup_failed_to_open`, the auth line turns red with
     "The browser blocked the Google sign-in window…", and the header shows `lapsed`.
   - Open iPad: a window opens over the app and is closed unfinished.
2. **Each return to view makes another request, in every model.** The call count was 1, 2, 3 after
   two returns. On the open-iPad model, that means the window reopens every time it is closed. **The
   owner's iPad account is confirmed as a loop in the harness**: a window first, and each return
   brings it back. Two things are not shown by any harness:
   - that this loop is what left About dead on the device;
   - that it is what held v135 and v136 back.
3. **A tap on `lapsed`** makes one visible request inside the click. It succeeds, and the auth line
   clears.
4. **The sequence that left a red line under a tapped success** (blocked-iPad model):
   - the token lapses while the app is open, and the header still reads up to date;
   - a tap syncs, and `syncNow()` reaches `ensureFreshToken()` two awaits late;
   - that "silent" request is refused, so the auth line turns red and the outcome is `signed-out`;
   - the next tap signs in, and About reads **"Connected to Google Drive"** with the sync line below
     it **in red**: "Your Google sign-in has run out, so nothing was synced…".

   Signing in turned the sync half back on, and nothing had replaced its outcome. This is the fixture
   for Acceptance 3.
5. **Not reproduced: the auth line's own "blocked" sentence surviving a tapped success.** Every
   success path in `src/auth.js` clears `lastError`, and no ordering in any of the three models set
   it again while a fresh session stood. So I cannot say the owner's exact sentence-while-connected
   came from this code rather than from Google's own callback order. Either way, after this change
   the only writers of that sentence are tapped requests that failed. The two 👤 readings are where it
   would still show.

## Acceptance, line by line

1. **[x] A launch and a return to view make no token request.**
   - `verify/sync-button.mjs` sets a stand-in that refuses every request as a pop-up blocker, then
     runs a reload and two `visibilitychange` events. It reads `requests after the launch = [], after
     two returns to view = []`, and the button reads `current`.
   - The previous check reads `/gsi/client` on the wire from the same kind of opted-in launch, so
     the library still loads.
   - The About panel afterwards shows `class-hint` "Not connected…" and auth error `""`.
2. **[x] With no token, the button reads freshness and never *Connecting…*, and a tap requests
   inside its own stack, then syncs.**
   - After a lapse and a return to view: zero requests, `current`, and the label ends "Tap to sign in
     to Google and sync now."
   - The tap makes one request with `silent:false, inClick:true, inListener:true`, then signs in,
     Drive calls go up, `baseRev === localRev`, and the state is `current`.
   - The "Connecting…" reading is gone from the code. While a tapped request is actually out, the
     button reads "Waiting for Google…", the About panel's own words for that moment.
3. **[x] A failed silent attempt can't set the red line, and a tapped success clears one already
   there.**
   - The launch-panel check covers the first half.
   - The replay of the found sequence:
     - a no-token sync settles `signed-out` with 0 token requests and auth error `""`;
     - a blocked tap draws `lapsed` with About red;
     - the tap that works leaves both halves `class-hint`, with no "run out" line;
     - the Connect door clears the sync half the same way.
4. **[x] Mutation-proved.** I ran these on the Phase 7 sections only (`localstorage-prefs`,
   `drive-sign-in`, `drive-sync`, `sync-button`), through a scratch copy of the entry in the
   scratchpad.
   - **Baseline:** `128 · 123 · 5 failed`. The five are the four WO-7.7 checks and one
     `drive-sign-in` check. They fail in any subset run because they need class fixtures built by
     earlier sections.
   - **M1**, a launch-time `auth.reconnect()` in `start()`: `128 · 114 · 14 failed`, including line 1.
   - **M2**, WO-7.5 put back (the old requesting `ensureFreshToken()` body plus a call in `start()`):
     `128 · 115 · 13 failed`, including line 1, line 3's first half, and the no-token-sync check.
   - **M3**, `signedInAgain()` removed from `afterDriveAuthChange()`: `128 · 122 · 6 failed`. The one
     new failure is the Connect-door check (sync line `class-error` "…run out…").
   - Every mutation was reverted by copy, checked with `cmp`, and grepped clean before the next step.
   - **Not proved by mutation:** the `signedInAgain()` call inside `tapSyncButton()`. The sync that
     follows it replaces the outcome anyway, so a check can't see it.
5. **[ ] 👤 iPad**: not ticked. It needs the deployed app on the device. Force-quit from the app
   switcher first.
6. **[ ] 👤 Laptop**: not ticked. It needs the deployed origin. Check `location.origin` first.

**Tools** (full run after the last revert and after the last `src/` edit):
- `node tools/verify-shell.mjs`: **`1543 checks · 1543 passed · 0 failed · 0 skipped`, 48,531
  lines, 571s, EXIT=0**. I read that from the log's own summary and `EXIT=` line.
- `node tools/wo-sweep.mjs`: **`45 checks · 42 passed · 0 failed · 3 to review`**, the three
  standing REVIEWs. § 11 is now 1532 call sites, recorded in `tools/README.md` with a ledger entry.
- After the full run, only non-served files changed: `docs/sync.md`, the phase file, `TESTING.md`
  and `tools/README.md`. The sweep was re-run after them and is green.

## Audit of every non-tap path into a token request

| Path | Verdict |
|---|---|
| `sync-button.js start()` → `renewSilently()` | **Removed.** Now `preloadSignIn()`, a library load with no request. |
| `sync-button.js` visibility listener → `renewSilently()` | **Removed.** It repaints, and preloads only if the library is still missing. |
| `rememberOptIn()` → `start()` | After a Connect succeeds. It now only preloads; it used to call `renewSilently()`, which returned early because the token was already there. |
| `drive-sync.js syncNow()` → `ensureFreshToken()` | Tap-rooted (About's Sync, the header tap), but **after two awaits**. `ensureFreshToken()` now makes no request, so this path can't open a window. |
| `auth.connect()` → `requestToken()` | The About Connect click only (`shell.js` `[data-drive-connect]`). Unchanged; it is WO-7.1's. |
| `auth.reconnect()` → `ask()` / `requestToken()` | `tapSyncButton()` only, from the header click listener. |
| `afterRestore()`, `afterDownload()`, `afterDriveAuthChange()`, store subscriber, resize, timers | None of them reaches `ensureFreshToken`, `requestToken`, `ask`, `reconnect`, `connect` or `syncNow`. Checked by grep over `src/`. |
| `window.planbook` seam | Exposes the modules to tools. Nothing in the app calls through it. |

## The `lapsed` decision

I **kept** `lapsed`, **narrowed** to mean: *your tap asked for a sign-in and it did not finish*.
The argument is at its arm in `syncButtonState()`.

- **Why keep it:** if I dropped it, a failed tap would snap back to "Tap to sign in and sync" as
  though nothing had happened.
- **Both common causes are fixable by her:**
  - a blocked window — About explains it, in red;
  - a library that had to be fetched first — a second tap cures it.
- **What it no longer means:**
  - "no token", which is now every launch and not an alarm;
  - a `signed-out` sync outcome.
- **The reading is now** "The Google sign-in did not finish. Tap to try again."
- **The state name and CSS class stay `lapsed`,** so `src/shell.css` did not change. Its comment
  ("nothing can sync until the teacher acts") is still true.

## Decisions the work order did not settle

- **`ensureFreshToken()` no longer requests.** I did this rather than only correcting its comment,
  because its remaining caller lands after awaits. Keeping the request would leave a no-gesture
  window reachable from About's Sync when the token lapsed while the panel was open. The cost: that
  rare case now shows "run out… tap Connect" instead of a window that might have flashed on the
  laptop.
- **The privacy documents changed** even though the preload stayed (see Summary).
- **A reload is a sign-out again on every device.** I updated the comments that said otherwise:
  `src/auth.js` decision 1, `src/shell.js` `reloadForUpdate()`, `src/prefs.js`, `index.html`, and
  `docs/sync.md` in three places plus a dated note under § "What actually happens at the hour".
  WO-7.5's ruling 5 carries a dated note, and its text is unchanged.

## What I could not close, and follow-ups I declined

- **Both 👤 lines.** They are owed on the deployed build (v138).
- **Disconnect cannot be reached without signing in first.** On an opted-in device after a reload,
  About draws Connect but not Disconnect, because Disconnect is drawn only while signed in
  (`refreshAuthChrome()`, WO-7.1's panel). So a teacher who wants to switch sync off has to connect
  first. Before this change the laptop's renewal usually hid this; the iPad already had it. The
  harness now connects before its Disconnect check, with a comment explaining why. **This is a
  proposed follow-up, not built**: the panel is out of this work order's scope.
- **`CLAUDE.md` is stale** and I did not edit it. The status block starting "The header has a sync
  button as of 2026-09-26" still says opting in is consent to renew silently at launch, and that "a
  reload is no longer a sign-out". The `AGENTS.md` twin should be checked in the same sitting.
- **Stray headless Edge processes** (about 36 `pb-verify-*` from earlier sessions today) are still
  running on this machine. This is the known surviving-browser defect recorded in WO-7.4. Two of them
  are from my runs, and I killed one that I had aborted.

## Files changed

- `src/auth.js`, `src/sync-button.js`, `src/drive-sync.js`, `src/shell.js`, `src/prefs.js`
- `index.html` (a comment only), `sw.js` (`CACHE` v138)
- `privacy.html`, `docs/FERPA.md`, `docs/sync.md`
- `tools/verify/sync-button.mjs`, `tools/verify/drive-sync.mjs` (a header note),
  `tools/verify/drive-sign-in.mjs` (the importer check's wording), `tools/README.md` (the count)
- `plans/work-orders/phase-7-sync.md` (ruling 5's dated note; Acceptance 1–4 ticked with evidence),
  `TESTING.md` (§ WO-7.10)
- `.claude/dispatch/WO-7.10-result.md`

I did not run `--start`, `--release`, a commit or a push. The status line still reads 🤖 CLAIMED.

## Draft CHANGELOG entry (the teacher decides)

> **Google Drive no longer asks to sign you in by itself.** On a device that syncs, Planbook used to
> try to renew the Google sign-in every time it opened or came back onto the screen. Google has no
> way to do that without opening a window. On the iPad, that window appeared over the app at every
> launch and blocked taps and updates; on the laptop, it left a red "blocked" line in About. Now
> nothing is asked of Google until you tap. The sync button in the header still shows how fresh this
> device's copy is, and when you are not signed in, one tap signs you in and syncs. The privacy
> policy says so.
