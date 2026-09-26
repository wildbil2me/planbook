# WO-7.8 — the stale-by-day check cannot tell a calendar day from 24 hours after 15:12 · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-7-sync.md`
**Report to** `.claude/dispatch/WO-7.8-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Sonnet**, by budget and not by rubric: on the merits this is Codex work (harness-only, XS, fully specified with both clocks and both mutations named, no sensitive surface, no teacher prose), but the proof is at least four full `verify-shell.mjs` runs (clean, two mutations, one `--today`) at ~4.4 min each, ~17.6 min of Codex's 20-min cap before any reading or writing, which is the WO-2.34 shape in `ROUTING.md` § "Which Claude". Runner-up set aside: Opus. Nothing in the Traps calls for judgment the work order has not already exercised.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-7.8 — the stale-by-day check cannot tell a calendar day from 24 hours after 15:12

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** XS · **Depends on** WO-7.5 — the check this pins to a fixed clock
**Closes roadmap** *(no box. A hole in a harness check, found by WO-7.5's verifier.)*

**Booked 2026-09-26**, owner-directed, from finding 4 in WO-7.5's closing note. WO-7.5's ruling 4 says
an old sync turns amber **on a calendar day**, and says specifically that it must not turn amber after a
fixed number of hours, which "would go amber in the middle of a teaching day for no reason." The
harness asserts that line, but **only on a real clock that happens to be early enough in the day.**

**Why the check is blind after 15:12.** `tools/verify/sync-button.mjs` asserts the stale state in two
places, and neither can fail under a 24-hour rule after mid-afternoon:
- **The planted bookmark** (`PLANT(1, 15)`, ~551-570) is yesterday at 15:12 on the real clock. A run
  before 15:12 reads it less than 24 hours old, so only a calendar-day rule calls it stale. A run
  after 15:12 reads it more than 24 hours old, so a 24-hour rule calls it stale too, and the check
  passes either way.
- **The shifted-clock check** (`SHIFT`, ~600-632) moves the page clock exactly 24 hours past a real
  sync. At exactly 24 hours both rules agree at any time of day, so it cannot tell them apart at all.

So `freshnessOf()` in `src/drive-sync.js` could be changed to `now - at > 24h` and any run after 15:12
would stay green. Nothing is wrong with the app today. The fault is that the check which says so only
has teeth for part of the day.

**Deliverables**
- **Both directions pinned to a fixed clock, independent of when the harness runs.** Install the
  page's `Date` as a fixed moment, by the same page-start-script mechanism `SHIFT` already uses:
  - **A sync at 23:30 yesterday, read at 00:30 today**, one hour apart and across midnight, must read
    *stale*. A 24-hour rule reads it as current.
  - **A sync at 00:30 today, read at 23:30 today**, 23 hours apart and on one day, must read *up to
    date*. A rule with a threshold shorter than a day reads it as stale.
- **The existing checks keep what they prove**: the reading's wording, "on Sep 23" for older syncs,
  and a tap bringing it back. Narrow or replace them in place rather than adding a second copy of
  the same claim.
- Harness only. **No file in `src/` moves**, so `sw.js`'s `CACHE` does not move either.

**Acceptance**
- [ ] Both fixed-clock cases pass, and the run's own output names the two planted times and the two
      page clocks.
- [ ] Mutation-proved in both directions: `freshnessOf()` changed to a 24-hour rule turns the
      midnight case red, and to a 12-hour rule turns the same-day case red. **Both mutations are
      reverted before anything else is written** (`AGENTS.md`).
- [ ] The whole browser harness is green on the real clock and again with `--today` moved.

**Traps** — **Do not pin the whole run's clock.** A run on a moved clock is evidence about a
different day for every other section, which is why `SHIFT` is installed for one reload and then
removed. Do the same. **Local time, not UTC**: `localDayOf()` is local on purpose, and a check
written in UTC would test a different midnight from the teacher's.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/drive-sync.js`
  - `tools/verify/sync-button.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify-shell.mjs` near `SHIFT_PAGE_CLOCK` (~859-876), the page clock `--today` installs for the whole run. Your fixed clock has to compose with it (see traps).
- `tools/README.md` § the `check()` call-site count (~1226) and the `verify/sync-button.mjs` paragraph (~2043-2060). `wo-sweep.mjs` goes red when the count there is stale, and that happens when the work is *done*, not wrong (WO-3.26).

**Traps the work order does not spell out (orchestrator's additions)**
- **The line numbers in the work order have drifted.** `PLANT(daysBack, hour)` and its `PLANT(1, 15)` / `PLANT(3, 9)` uses are now ~735-775, and `SHIFT` is ~780-830 of `tools/verify/sync-button.mjs`. Read the file. Do not trust the `~551-632`.
- **Under `--today` the page's `Date` is already a proxy** by the time your page-start script runs. Build the fixed clock from **absolute local components**, e.g. `new Real(y, m, d, 0, 30)` with the date taken from the page's own `new Date()`, so it names the same wall-clock times on either run. Acceptance 3 has to pass under `--today` too, so actually run it that way.
- **A frozen `Date.now()` can stall anything in the app that times itself.** Prefer a fixed base plus elapsed real time (`base + (Real.now() - installedAt)`). An hour of slack is far more than a check needs, and 00:30 plus a few seconds is still 00:30.
- **Plant the bookmark relative to the pinned page clock, not the real one.** The existing `PLANT` computes `at` from the page's `new Date()`, which is fine once the fixed clock is installed and the page has reloaded. Keep everything in local time, per the work order.
- **Install, reload, read, remove, reload**, exactly as `SHIFT` does. The sections after this one must see the real clock (or `--today`'s), never yours.
- **"Narrow or replace in place."** The `PLANT(1, 15)` case can become the midnight case, keeping its "Last synced yesterday at ..." wording check. The `SHIFT` case can become the same-day case, or be narrowed to it, as long as "put back, the same bookmark reads up to date" survives somewhere. Do not leave both the old check and a new one asserting the same claim. The check count in `tools/README.md` moves by exactly what you add or remove. Update it and say why.
- **Acceptance 1 wants the times in the run's output.** Put the two planted `at` values and the two page clocks in the `check()` detail strings, and confirm from an actual run's stdout that a *passing* check prints its detail (see `check()` at `verify-shell.mjs:194`). If it does not, find the harness's existing way to print a line. Do not write a second harness.
- **Mutations**: mark each one with a `MUTATION` comment, and `git add` your harness edits first so a `git checkout` of `src/drive-sync.js` cannot clobber them. Revert each before writing anything else. Finish with `grep -rn MUTATION src tools` clean and `git diff --stat src` empty. **No file in `src/` may differ at the end**, and `sw.js` does not move.

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

## 5. Done means these 3 lines, reported against one by one

1. Both fixed-clock cases pass, and the run's own output names the two planted times and the two page clocks.
2. Mutation-proved in both directions: `freshnessOf()` changed to a 24-hour rule turns the midnight case red, and to a 12-hour rule turns the same-day case red. **Both mutations are reverted before anything else is written** (`AGENTS.md`).
3. The whole browser harness is green on the real clock and again with `--today` moved.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

