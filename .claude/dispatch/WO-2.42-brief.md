# WO-2.42 — waitForPassAlert() waits on a flag its callers do not assert, so a correct app can go red · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.42-result.md` — as your last act, and return it in-band too.

**The routing decision.** This went to **Claude at Opus** on its own merits: the deciding signal is
that the Traps section is entirely judgment rather than mechanics — the two obvious fixes (raise the
24-iteration cap, insert a sleep) both produce a green Acceptance while leaving the race in, and the
third cheap path to green is dropping the `said` assertion from the callers, which would close the
row by deleting its subject. The third deliverable, the sibling-helper audit, is an open-ended read
of a 13k-line harness that needs taste about what counts as a proxy wait. The runner-up considered
and set aside was **Codex**: this reads Codex-shaped on the surface (no `src/` changes, a spec
written out in full, mechanically checkable Acceptance), but it fails `ROUTING.md`'s budget bullet
independently — three clean `verify-shell.mjs` runs plus at least one deliberate-red run is
4 × ~4.4 min = **~17.6 minutes against the 20-minute cap**, the WO-2.34 arithmetic exactly, and the
red demonstration would be holding a mutation in the tree at SIGTERM time.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.42 — waitForPassAlert() waits on a flag its callers do not assert, so a correct app can go red

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** S · **Depends on** nothing · **Blocks** nothing
**Closes roadmap** *(no box. Harness, not app.)*

**Not a go-live blocker, and the app is not defective.** Booked 2026-08-17 out of WO-2.39's
verification, which caught the failure in passing and then diagnosed it from source rather than
writing it off.

**Why it exists.** `verify-shell.mjs` ran three times on WO-2.39's unchanged tree: 824/824, then
**823/824**, then 824/824. The red was *"and the clock still reaches that student five minutes later,
because the class it belongs to is still the one that is open"*. WO-2.39 changed documentation and two
block comments; `git diff --stat -- src/` was empty. So this is the harness, not a regression — but
**"probably flaky" is the verdict this project does not accept**, and the cause is now known.

**The seam.** `waitForPassAlert()` polls for up to six seconds and its exit condition reads **one**
thing: `(…openPasses.filter(…)[0] || {}).alerted !== 1`. Its three callers assert **two** — the flag
*and* the text of the live region, via `said`. `said` is re-read on every tick, but only ever
*before* the re-test, so on the iteration where the flag flips to 1 the function returns the
announcement as it stood at that instant and never looks again. The app writes the flag and the
announcement in that order, so there is a window in which the helper's exit condition is satisfied and
the thing the caller checks is not yet true. **Nothing is wrong with the app; the wait is waiting on
the wrong event.**

**The failure signature says so, which is what makes this diagnosable rather than a guess.**
`TESTING.md:3486` records what this check prints on the unfixed build it was written for — *"the open
class is `c_2b2z71075k`, the pass belongs to `c_b1` and records `alerted = undefined`"*: wrong room, no
alert. The red run printed *"the open class is `c_b1`, the pass belongs to `c_b1` and records
`alerted = 1`"* — **right room, alert fired, announcement unsampled.** A real defect and this flake
print differently, and only one of them has ever been seen on a green tree.

**Why it is worth a row.** This is the failure mode that costs the most and shows the least: a check
that reddens perhaps one run in three teaches its readers to re-run rather than to read, and the next
genuine regression in that block arrives already discounted. `tools/README.md` trap 5 is this exact
subject — *"a fixed sleep before a measurement is a race, and it hides defects rather than only
causing flakes"* — and its own lesson is that the flaky-looking check is worth investigating.

**Deliverables**
- **`waitForPassAlert()` exits on the condition its callers assert**, which means folding the
  announcement into the loop's test rather than sampling it after. Three call sites share it
  (`:11118`, `:11187`, `:12895` on the tree that booked this — grep `waitForPassAlert`, the numbers
  will have moved), and all three must stay green.
- **A note at the helper** saying what it waits for and why the flag alone is not it, so the next
  person to add a fourth caller does not re-open this.
- **An answer on the sibling helpers**: whether any other wait in the file exits on a proxy for the
  thing its callers check. Reported either way — a sentence naming that this one is alone is a
  deliverable, an unasked question is not.

**Out of scope** — anything under `src/`. The app's write order is correct and this row does not
change it. Also out of scope: the 41-minute clock check at what was `:11269`, and any widening into
WO-2.30's hall-pass block beyond the three call sites.

**Acceptance**
- [ ] `waitForPassAlert()`'s exit condition includes the announcement its callers test, and no fixed
      sleep was added anywhere in the change.
- [ ] **`node tools/verify-shell.mjs` green on three consecutive runs**, quoted with their summary
      lines. Three because one green run is what the unfixed helper already produces two times in
      three; the count is the evidence here.
- [ ] The check is demonstrated **still able to go red** for the reason it exists — the defect
      `TESTING.md:3486` records — rather than made green by waiting longer.
- [ ] The sibling-helper question is answered in writing.
- [ ] `node tools/wo-sweep.mjs` green, `git diff --stat -- src/` empty.

**Traps** — **A longer timeout is not the fix and neither is a sleep**; both make the race less likely
and leave it in, which is trap 5's whole point. **Do not weaken the check to match the helper** — the
callers assert the announcement because the announcement is what the teacher gets, and dropping it
would close this row by deleting its subject. **Three runs, not one**, and if one of the three is red
the row is not done however plausible the excuse.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`tools/verify-shell.mjs:11098`** — `waitForPassAlert()` itself, with the WO-2.28 block comment
  above it that already explains why this block polls rather than sleeps. The three call sites are at
  **`:11118`, `:11187` and `:12895`** on the tree you have been handed (verified by grep at dispatch
  time, 2026-08-17; the work order's numbers happen to still hold). Read all three before you touch
  the helper: they do not assert identically — `:11118` and `:11187` filter `openPasses` by
  `studentId` / `p.id` and match `/has been out on a bathroom pass for 5 minutes\./` against `said`,
  and `:12895` is the archive walk that actually went red.
- **`tools/README.md` § trap 5** — *"a fixed sleep before a measurement is a race"*. This work order
  is that trap's own subject; the fix must not become an instance of it. The § "Driving a browser over
  CDP" traps above it are the general case.
- **`TESTING.md:3480-3492`** — the recorded failure signature for the `:12895` check, and the reason
  Acceptance line 3 is answerable at all. It records `alerted = undefined` and *"the announcement was
  'nothing has been announced since this sentinel was written'"* on the build the check was written
  for, plus the md5 (`df7b2e98c83d7e00543ce5b0da9b7991`) of the restored `src/classes.js`. **That is
  the shape of the red demonstration**: a temporary mutation, one run, then a byte-identical revert
  proved rather than assumed. Acceptance line 5 requires `git diff --stat -- src/` empty when you are
  done, so verify the restore the way `TESTING.md` did — by hash, not by eye.
- **`plans/dispatch-retro.md` § "Fixture assumptions"** — the standing lesson about checks that go
  green having proved nothing. The comment already at `:11165` is a worked example of the guard this
  project expects; whatever you fold into the loop must not make any of the three checks vacuous
  (e.g. a condition that can be satisfied by a stale live-region sentinel).

**Two practical notes.**

- **This is a long run and that is expected.** `verify-shell.mjs` is ~4.4 minutes a pass and
  Acceptance demands at least four passes (three green plus the deliberate red), so budget 40+
  minutes of wall clock for verification alone. Do not shorten the count to save time — Trap 3 in
  the work order is explicit that three greens *are* the evidence, because the unfixed helper already
  produces two greens in three.
- **Watch the line endings.** A whole-file rewrite of `tools/verify-shell.mjs` that flips it to CRLF
  will show up as a 22,000-line diff for a ten-line change. Edit in place; if `git diff --stat` for
  this file reports anything near the file's length, you have done that and it must be undone.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

1. `waitForPassAlert()`'s exit condition includes the announcement its callers test, and no fixed sleep was added anywhere in the change.
2. **`node tools/verify-shell.mjs` green on three consecutive runs**, quoted with their summary lines. Three because one green run is what the unfixed helper already produces two times in three; the count is the evidence here.
3. The check is demonstrated **still able to go red** for the reason it exists — the defect `TESTING.md:3486` records — rather than made green by waiting longer.
4. The sibling-helper question is answered in writing.
5. `node tools/wo-sweep.mjs` green, `git diff --stat -- src/` empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

