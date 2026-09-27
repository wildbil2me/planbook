# WO-7.12 (cut 2) — result

**Landed. The harness fix, the corrected comment, and the premise assertion are in, and nothing in
`src/` moved.** No `CACHE` bump. All three Acceptance boxes are ticked, each with evidence below.
The status line is untouched (`🤖 CLAIMED`); that is the orchestrator's to move. `CHANGELOG.md` is
untouched. Nothing is committed. I staged the two tools files briefly so the mutation revert had a
clean source, then unstaged them. The tree now shows four unstaged modified files.

## What changed

- **`tools/verify/drive-sign-in.mjs`**
  - Before the foot's `auth.disconnect()`, never after it, the section polls `authState().busy`
    until it reads `false`. It re-reads every 100ms (`READ_AUTH`), with no fixed sleep.
  - **Why `busy` is a true condition here, and not only the first cut's proposal.** The reload
    above the About block resets the module. The wire check counts zero Google requests before
    the tap. `pending` is set only by `ask()`, which needs the library, so this tap's `connect()`
    is the only request on the page. From the tap until `connect()` returns, `busy` is true. The
    one exception is inside `settle()`, between the silent attempt and the visible one, and that
    gap closes in a single microtask run, where a CDP evaluate cannot land. `connect()` then clears
    `busy` and paints in one synchronous run. So `busy === false` means `connect()` has returned
    and its last paint is done. The comment at the wait says all of this.
  - **The bound** is `SILENT_TIMEOUT_MS` + `VISIBLE_TIMEOUT_MS` (25s + 180s), parsed from
    `src/auth.js`'s source text, which the section already holds as `source71`, plus 15s for the
    library to load. The numbers are not copied into the harness.
  - If the bound runs out, the run prints a **SKIP**. It also prints a SKIP if the constants can no
    longer be parsed. It is a skip and not a fail for `tools/README.md` trap 8's reason: a stalled
    Google script is about the network, not the app.
  - The hand-back check's detail now reports whether the tap had settled and how long the wait
    took. `skip` was added to the section's `h` destructure.
  - **No `check()` call site was added.** The count stays at 1540, and the sweep agrees.
  - The foot's comment at ~652 is corrected. It no longer calls the leftover request "a timer in a
    browser that is about to be killed". It says the next section runs in the same page, and it
    names both things the section must not leave behind: a session and a request.
- **`tools/verify/drive-sync.mjs`**
  - WO-7.13's check gains `typeof openInStatus === 'string' && /^Connected/.test(openInStatus)` in
    its existing conjunction. The existing detail already printed `openInStatus`.
  - A comment paragraph says why the premise is asserted.
  - The ~906 check's assertion is untouched.
- **`TESTING.md`**: new § WO-7.12, placed after § WO-7.13. It covers both layers, the first cut's
  `t=999` trace quoted and attributed to that sitting, this sitting's runs, and the mutation round.
- **`plans/work-orders/phase-7-sync.md`**: the three Acceptance boxes are ticked. Nothing else
  moved. The 1-line claim edit was already there.

## Acceptance, line by line

1. **[x] The cause is named in `TESTING.md` § WO-7.12, with the run that shows it; both layers.**
   - **Layer 1, the harness trigger:** `disconnect()` clears `busy` and the session but not
     `pending`, so the leftover `connect()` settles on `popup_failed_to_open` inside drive-sync and
     paints over a seeded token.
   - **Layer 2, the `src/` repaint:** a signed-out `syncNow()` did not repaint Connect before
     WO-7.13.
   - The first cut's trace is lifted in and labelled as that sitting's evidence, not re-observed.
   - This sitting's own evidence for layer 1 is the new wait's reading. In all 20 counting runs,
     the Connect request was still out when drive-sign-in's checks finished. It settled 760–2316ms
     later, always on the blocked-window sentence. That is the moment the old code called
     `disconnect()`.
2. **[x] Twenty consecutive runs read the check green.**
   - The harness has no section filter, so these were 20 whole-harness runs, run as two streams of
     10 back-to-back, in parallel on one 16-core machine.
   - **All 20 read `1551 checks · 1551 passed · 0 failed · 0 skipped`, `EXIT=0`, 580–591s.** I read
     each log's own summary line and `EXIT=` line.
   - In all 20, the ~906 check passed, WO-7.13's premise read "Connected to Google Drive…", and the
     hand-back read "settled".
   - **Honest limit:** the baseline on unmodified `HEAD` (post-WO-7.13), taken first, was also green:
     `1551 · 1551 · 0 failed`, 586s, `EXIT=0`, premise *Connected*. So the 20 greens do not on their
     own distinguish this fix from WO-7.13's repaint. Since WO-7.13, the ~906 check reads a paint
     its own sync made, and a late leftover paint would draw the lapsed state too. What the runs do
     show: the request was out at the old hand-off point in 20 of 20, it is now waited out, and the
     WO-7.13 premise held in 20 of 20. The flake was not reproduced on `HEAD` in this sitting (1
     baseline run), which fits WO-7.13 having removed layer 2.
3. **[x] The whole browser harness shows no new failure.**
   - 20 of 20 at 1551/1551, zero skips.
   - `node tools/wo-sweep.mjs`: `45 checks · 42 passed · 0 failed · 3 to review` (the standing
     three), with the call-site count at 1540 matching `tools/README.md:1226`.
   - `node tools/wo-gate.mjs --audit`: its final line is PASS.

No 👤 or 📆 lines in this work order.

## Mutation round

One run, `mut-1`, with two plants marked `MUTATION WO-7.12`. I reverted both with `git checkout`
from the staged fix as soon as the run printed `serving :`. Sections are static imports, so the
run had already loaded the planted modules. No counting run started before the revert.

- **Bound = 1ms:** the SKIP fired and was announced, with status line "Waiting for Google…". The
  hand-back detail read "STILL WAITING when disconnect() ran".
- **`#driveStatus` forced to "Waiting for Google…"** before WO-7.13's check read it: that check went
  red on the premise alone.
- Run total: `1552 checks · 1550 passed · 1 failed · 1 skipped`, 585s, `EXIT=1`.
- After the revert, `grep -rn "MUTATION WO-7.12" tools src` came back empty.
- `grep -rn MUTATION tools/ src/` returns only pre-existing prose. `git grep -c MUTATION` gives the
  same per-file counts in the working tree as on `HEAD`: `src/shell.js` 1, `tools/README.md` 9,
  `keys-legend-guards.mjs` 4, `outreach.mjs` 1, `score-grid.mjs` 1, `wo-gate.mjs` 1.

## Decisions the work order left open

- **Condition:** I kept `authState().busy === false`, and wrote down why it is sufficient here
  (above). I found no truer observable condition without touching `src/`: `pending` is not exposed.
- **Bound:** the full sum of the app's own timeouts plus 15s, rather than something short. With
  that bound, a SKIP means the app's own give-up timers did not fire, or the library never loaded.
  A short bound would have made a SKIP mean "Google was slow today". The cost is up to about 3.7
  minutes of waiting in a pathological run. In practice the wait was 0.76–2.3s.
- **Skip, not fail, on expiry,** as the brief proposed, citing trap 8.
- **The premise is a clause in the existing check, not a new check.** This keeps the call-site
  count and the executed count unchanged. A premise failure still names itself in the detail line.

## Noted, not done

- The SKIP's wording hard-codes "plus 15s for the library", and in the 1ms mutation it read oddly
  ("past … 25s + 180s … after 1ms"). That is cosmetic, and only reachable under mutation.
- `tools/README.md`'s per-work-order count ledger has no WO-7.12 paragraph, because neither count
  moved. I did not add one.
- The first cut's proposal 3 (a `disconnect()` during a pending `connect()` leaves `pending` set, so
  a teacher gets "already waiting" for up to ~205s) is still unbooked and is out of scope here.

## Files changed

- `c:\dev\planbook\tools\verify\drive-sign-in.mjs`
- `c:\dev\planbook\tools\verify\drive-sync.mjs`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-7-sync.md` (three ticks)
- `c:\dev\planbook\.claude\dispatch\WO-7.12-result.md` (this file)

Logs are in the session scratchpad (`...\02fbe683-...\scratchpad\runs\`: `base-1`, `mut-1`,
`fixA-01..10`, `fixB-01..10`). That folder is not durable, so the lines that matter are quoted
above and in `TESTING.md`.

## Draft CHANGELOG entry (the teacher decides)

> The Drive sign-in check in the browser harness now waits for its own Connect tap to finish before
> handing the page to the Drive sync checks. That tap used to settle a second later, inside the next
> section, and repaint the panel over a token that section had planted, which is how a sync check
> went red in more than half of recent runs. The About-open lapse check now also confirms the panel
> really said "Connected" before the lapse. No change to the app.
