# WO-7.13 — a sign-in that lapses with About open leaves the panel saying Connected · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.13-result.md` — as your last act, and return it in-band too.

**Routing: Claude, Opus (no model override).** The deciding signal is the proof budget plus the
surface: the Acceptance wants at least five full `verify-shell.mjs` runs (three red on `HEAD`, one
green, one mutation, and a whole-harness pass), about 22+ minutes at ~4.4 min a run, against Codex's
20-minute dispatch cap. The work also sits on the OAuth sign-in chrome and asks for a judgment about
which comments in two files claim a repaint that does not happen. I set aside the fact that the code
change itself is one import and one call, which is Codex-shaped. The Ship 1 pre-routing table has no
row for this work order (`Ship —`).

## 0. RESUME: you are building over an interrupted draft

The first dispatch of this brief died on 2026-09-27 when VS Code crashed. The orchestrator and the implementer both died, and neither returned. What it left in the tree:

- `tools/verify/drive-sync.mjs`: **+86 lines**, one new check (About open, the token lapses, a tap on Sync through the delegated listener, and a MutationObserver same-batch assertion). It was written test-first and **has never been run**. No red or green figure exists for it.
- `src/` is **untouched**. The `refreshAuthChrome()` repaint was never made. `sw.js` has not been bumped. `TESTING.md` has no § WO-7.13 yet.
- `grep -rn MUTATION` found only pre-existing prose, so nothing is armed.

**Before you build on it, audit the draft line by line against this brief.** Check that the new check is deterministic (it must not depend on a late paint from an earlier section), that it asserts what Deliverable 3 asks for, and that it leaves the existing check at ~906 and `verify/drive-sign-in.mjs` alone. **In your result file, report what you kept and what you rewrote, and why.** Then carry on with the brief's order: prove the check red on `HEAD` three times, add the repaint, prove it green, do the mutation round, then the prose.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.13 — a sign-in that lapses with About open leaves the panel saying Connected

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-27 · **Size** S · **Depends on** WO-7.2 — the `syncNow()` this repaints from; WO-7.1 — the `refreshAuthChrome()` it calls
**Closes roadmap** *(no box. A defect in WO-7.2's fifth Acceptance line, found by WO-7.12's first cut and confirmed by its verifier's reading.)*

**Booked 2026-09-27**, owner-directed, from WO-7.12's verdict. WO-7.12 was booked as a harness race.
Its implementer stopped on that work order's own *"if it is the app"* branch, and the verifier
confirmed the `src/` half by reading every caller.

**What is wrong.** `syncNow()` in `src/drive-sync.js` can settle `signed-out` (~545). When it does,
its `finally` calls `refreshSyncChrome()`, which repaints the sync half of About's Drive section.
**Nothing on that path calls `refreshAuthChrome()`**, the only writer of Connect's and Disconnect's
`hidden` class and of the status line. The comment at ~541–544 says Connect *"is back on screen
because authState() computes `signedIn` from the clock"*. That is false. `signedIn` is computed from
the clock, but nothing redraws the button from it.

**A teacher can reach it.** She opens About while signed in. The hour runs out with the modal still
open; on the iPad a resume does not reload the page, so it stays open. Then she taps *Sync this year
now*. The panel then shows **no Connect button, no Sync button and an empty sync line**, and the
status line still reads *"Connected to Google Drive. This access ends at …"*. The re-auth sentence
reaches the live region only, and it points at a button that is not drawn. The first cut drove
exactly that and captured it (`WO712PROBE` in `.claude/dispatch/WO-7.12-cut1-result.md`).
**No data is at risk**: nothing was sent, nothing on the device changed, and the header button and
reopening About both redraw correctly. It is the silent failure WO-7.2's fifth line exists to rule
out, and the harness check that claims it is covered (`verify/drive-sync.mjs` ~906) has been reading
a paint made about 340 lines earlier.

**Deliverables**
- **A `signed-out` `syncNow()` repaints the auth half of the panel, and does it inside
  `syncNow()`.** Put it on the `signed-out` arm or in the `finally`, whichever reads better, but not
  in `src/shell.js`'s `[data-drive-sync]` chain. The harness calls `driveSync.syncNow()` directly,
  and every door should get the repaint, not one. `src/drive-sync.js` already imports from
  `src/auth.js`, so importing `refreshAuthChrome` keeps the dependency pointing the way `auth.js`
  requires.
- **Correct the comment** at `src/drive-sync.js` ~541–544 to say what now puts Connect back.
- **A harness check that is red on `HEAD` every run, not one run in two.** Open About signed in, let
  the token lapse with the modal still open, tap Sync through the delegated listener, then assert
  that Connect is shown and the status line no longer reads *Connected*. The first cut's probe is
  the shape. The existing check at ~906 stays as it is; WO-7.12 steadies it.
- **Bump `CACHE` in `sw.js`.** `src/drive-sync.js` is in `SHELL`.

**Acceptance**
- [ ] The new check is red on `HEAD` in three runs out of three, recorded in `TESTING.md` § WO-7.13,
      and green with the repaint in.
- [ ] Mutation-proved: take the new `refreshAuthChrome()` call out and the new check goes red. **The
      mutation is reverted before anything else is written** (`AGENTS.md`).
- [ ] The comment at ~541–544 is true, and no other comment in `src/drive-sync.js` or `src/auth.js`
      claims a repaint that does not happen. Every caller of `refreshAuthChrome()` is named in
      `TESTING.md` § WO-7.13.
- [ ] The whole browser harness shows no new failure. Name WO-7.12's check as the one known flake
      if it goes red; it is no longer expected to.
- [ ] 👤 **Laptop, deployed or local.** Connect, open About, leave it open past the hour (or until the
      token lapses), tap *Sync this year now*: Connect is drawn and the line does not say Connected.

**Two questions for the owner, not for the build**. The implementer changes neither.
- **Should the *"Tap Connect Google Drive above, then sync again"* sentence be on the glass?** Today
  `refreshSyncChrome()` blanks the sync line whenever sync is off, so a screen reader announces the
  sentence but it is never drawn.
- **Tapping *Stop syncing on this device* while a Connect is still waiting** leaves `pending` set.
  The next Connect then answers *"already waiting for Google"* for up to about 205s. That is noted,
  not booked.

**Traps** — **Do not fix it in `src/shell.js`.** The tap chain is one door, and the harness does not
use it. **Do not touch `verify/drive-sign-in.mjs`.** That is WO-7.12, and it waits on this. **The
token stays memory-only** (`CLAUDE.md`, WO-7.1's ruling): the repaint reads `authState()` and writes
nothing. **`src/sync-button.js` is the store's only subscriber**, and it stays that way. This is a
direct call at settle, not a new `subscribe()`.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/auth.js`
  - `src/drive-sync.js`
  - `src/shell.js`
  - `src/sync-button.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-7.12-cut1-result.md`: the `WO712PROBE` shape (About open, a 3599s token
  painted, then a 10s token seeded, then a **real tap on `[data-drive-sync]`** through the delegated
  listener). Your new check should be that probe made permanent. The same file's trace explains why
  the existing check at `verify/drive-sync.mjs` ~906 passes on a stale paint. **Do not edit that
  check, and do not touch `verify/drive-sign-in.mjs`.** Both are WO-7.12's.
- `tools/verify/drive-sync.mjs`: this is where the new check goes. Match how its sections seed tokens
  and read `#driveConnectBtn` / `#driveStatus`.

**Traps the orchestrator adds:**
- **"Red on `HEAD` 3/3" means the check must be written and run *before* the fix goes in.** Land the
  check first, run the whole harness three times with `src/drive-sync.js` untouched, and record each
  run's totals and `EXIT=` line in `TESTING.md` § WO-7.13. Then add the repaint and run it green.
  Make the red deterministic: the new check must not depend on whether a late paint from an earlier
  section happens to arrive. That kind of race is the flake WO-7.12 is about.
- **Mutation round:** mark the removal with a `MUTATION` comment, and revert it the moment the red
  run's `EXIT=` is read, before you write any prose. Then `grep -rn MUTATION src/ tools/ sw.js
  index.html` must come back empty before you write the result file.
- **Every caller of `refreshAuthChrome()`** is at `src/auth.js` 527/534/541/572/582/591/637/655 and
  `src/shell.js` 2098 on today's tree, plus the one you add. Name them by function, not only by line,
  in `TESTING.md`.
- `refreshAuthChrome()` returns early when the panel is not on screen. Make sure your call does not
  turn that into a problem when About is closed. The header button path must stay unchanged.
- Adding a `check()` call can move the count that `tools/README.md` records, and that turns
  `wo-sweep.mjs` red. Run the sweep last and fix the count if it asks.
- Leave the two owner questions exactly as they are, in code and in the work order.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 5 lines, reported against one by one

1. The new check is red on `HEAD` in three runs out of three, recorded in `TESTING.md` § WO-7.13, and green with the repaint in.
2. Mutation-proved: take the new `refreshAuthChrome()` call out and the new check goes red. **The mutation is reverted before anything else is written** (`AGENTS.md`).
3. The comment at ~541–544 is true, and no other comment in `src/drive-sync.js` or `src/auth.js` claims a repaint that does not happen. Every caller of `refreshAuthChrome()` is named in `TESTING.md` § WO-7.13.
4. The whole browser harness shows no new failure. Name WO-7.12's check as the one known flake if it goes red; it is no longer expected to.
5. 👤 **Laptop, deployed or local.** Connect, open About, leave it open past the hour (or until the token lapses), tap *Sync this year now*: Connect is drawn and the line does not say Connected.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

