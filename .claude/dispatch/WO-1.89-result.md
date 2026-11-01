# WO-1.89 — cooldown-quiet.mjs sometimes finds no class tab to click · result

**Implementer:** Claude Opus, 2026-11-01. Harness-only: nothing in `src/` moved (`git status --short src/`
empty), so no `CACHE` bump. No `check(` added, so the call-site count stays 2171. Not committed.
`grep -rn MUTATION tools/verify/cooldown-quiet.mjs` finds nothing: the one diagnostic probe was reverted
from a saved copy before any fix was written.

## What I found

- **Where it threw, from the numbers alone.** `runSection()` turns a throw into one FAIL in place of the
  checks it lost. The section runs 20 checks when green, so 2158 against 2176 means 19 lost and 1 FAIL
  added. The throw therefore came after exactly **one** of the section's checks, the fixture check. That
  puts it at the **first** card click, right after the fixture's `flush → Page.reload → 600ms →
  waitForBoot()`.
- **What fits:** `waitForBoot()` only asks whether *some* document has `#loadingScreen.hidden`. The page
  that has just been told to reload still has it. So if the reload has not committed within 600ms, the
  harness carries on inside the old page, and the old page's grid was drawn before the fixture existed.
  The flush race is the same mechanism one reload earlier.
- **Ruled out by reading:** the app side. `src/shell.js` paints the home grid synchronously before it
  hides the loading screen, whatever view is up, so this is not a `src/` defect. Also ruled out: state
  left by an earlier section. Two reloads come before that click, boot sends any non-class view to the
  grid, and the section that runs just before this one is `contact-log.mjs`, not WO-3.70's.
- **Not reproduced.** A scratch script (`repro189.mjs` in the scratchpad, not committed) drove 293 reloads
  in the section's exact sequence, in five load shapes: plain, a busy old page, a cold service worker,
  beside a full harness run, and four instances in parallel. It found **0** missing cards and **0**
  evaluations of the old document. 30 more in the fix's polled shape also gave 0. `TESTING.md` § WO-1.89
  § 2 has the table.
- **One full run on the unfixed tree is not evidence.** It failed at the same spot and printed
  `2158 checks · 2157 passed · 1 failed`, but the cause was a syntax error in my own probe. It shows only
  where the throw lands. It does not reproduce the flake.

## What I changed

`tools/verify/cooldown-quiet.mjs`:
- `poll45(expr, pred, ms)` is the local `waitFor()` shape already used in `first-run.mjs` and
  `sync-button.mjs`: a reading, a predicate, 80ms between tries, and the last reading returned.
- `reload45(stored)` does the reload in five steps:
  - flushes;
  - when given the fixture's class id, reads the **stored** record back with
    `store.readStoredDocument()` and throws if the class is not on disk;
  - marks the document with `window.__wo45Leaving`;
  - sends `Page.reload`;
  - polls until the marked document is gone and the new one has booted, and throws after 10s.

  Both of the section's reloads use it. `waitForBoot` is no longer destructured.
- `waitForCard45()` polls until the card has a box in `#homeGrid` with `#homeView` up. After 5s it throws,
  naming the view, the class ids the grid did draw, and whether the store holds the class.
  `openSignals45()` calls it before each card click.
- Nothing is forgiving. Every deadline throws, the click is still `clickSel`'s fatal one, and
  `runSection()` still contains the throw.

## Acceptance, line by line

1. **[x] § WO-1.89 names the cause with evidence, or says plainly it could not be reproduced and what was
   tried.** Done: it gives where the throw lands (derived from the counts), the mechanism that fits, and
   says plainly that it was not reproduced, with the 293-reload table.
2. **[x] The section no longer depends on a fixed sleep for the class card it clicks.** Done: both reloads
   go through `reload45()`, and all four card clicks go through `waitForCard45()`. `waitForBoot` and
   `setTimeout(r, 600)` survive only in the explanatory comment.
3. **[x] Three consecutive full runs on one tree are green, run lines quoted.** I made four runs. The code
   hash was `3d70192f…` before every run, and only docs changed between runs.
   - **Run 1 was red, but not in this section:** `2176 checks · 2175 passed · 1 failed · 0 skipped`,
     1220s, EXIT=1. All 20 cooldown checks passed. The single FAIL was `verify/front-door.mjs`'s
     *"an installed launch opens the app with no flash of the door … (WO-8.16 Acceptance 1)"* with
     `{"settled":"timeout",…}`, while I had the sweep and `--audit` running beside it.
   - **Runs 2, 3 and 4 were green:** each read `2176 checks · 2176 passed · 0 failed · 0 skipped`, 70,459
     lines, 32.4 lines per check, at 1201s, 1223s and 1227s, EXIT=0, with nothing running beside them.
   - **Limit:** on this machine the unfixed click never failed, so three green runs show the fix breaks
     nothing. They do not prove it cures a flake this machine never showed.
4. **[x] `node tools/wo-sweep.mjs` passes:** `52 checks · 49 passed · 0 failed · 3 to review`, EXIT=0. The 3
   are the standing reviews.
5. **[x] § WO-1.89 carries these lines verbatim with evidence.** Done.

There are no 👤 or 📆 lines. I ticked all five boxes in `TESTING.md` and in the work order. `wo-gate.mjs
--audit` passes.

## Files changed
- `tools/verify/cooldown-quiet.mjs`
- `TESTING.md`: § WO-1.89, under Phase 1, before `## Phase 2`
- `tools/README.md`: one ledger paragraph after WO-3.70's. Neither count moves.
- `plans/work-orders/phase-1-shell-store-roster.md`: the five Acceptance boxes ticked. The row status is
  untouched (still 🤖 CLAIMED, as it arrived).
- `.claude/dispatch/WO-1.89-result.md` (this file)

## Decisions the work order didn't settle
- **The poll stays local and is not hoisted onto `h`.** `first-run.mjs` and `sync-button.mjs` already keep
  their own copies. Hoisting would widen the shared surface and `tools/README.md`'s `h` list for one
  section.
- **I added a stored-record check before the fixture reload.** It throws if the plant is not in
  IndexedDB. Without it, "the plant never reached disk" and "the grid was not painted yet" look exactly
  alike on screen. If the flake comes back, the error message now says which one it was.
- **The home-card *read* near the section's foot was left alone.** I briefly put `waitForCard45()` in
  front of it and took it out again. It is a read, not a click, and a throw there would turn one red
  check into a lost section. The work order is about the card it clicks.
- **I left the sleeps that are not the card's:** `goHome45()`'s 250ms, and the 250ms and 400ms after the
  click.

## Declined / follow-ups for the owner
- **`verify/front-door.mjs` "installed launch … no flash of the door" timed out once** (`settled:
  "timeout"`) under load. It is the same shape as this work order: a timing check that is green on an idle
  machine. It passed on the other four full runs I made. I did not touch it (out of scope). It may be
  worth booking if it shows up again.
- The proof that matters is the verifier's machine, where this failed 2 of 3, staying green.

## CHANGELOG draft (the teacher decides)
> **Harness:** `cooldown-quiet.mjs` no longer guesses how long a reload takes. It waits until the page it
> reloaded has actually been replaced, and until the class card it is about to tap is on the screen. It
> still fails loudly if the card never appears, and the message now says whether the class was missing
> from storage or only from the screen. (WO-1.89. The flake could not be reproduced on demand; the fix
> removes the fixed sleeps it most plausibly came from.)
