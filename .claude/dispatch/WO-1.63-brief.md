# WO-1.63 — --today takes a date before the fixtures' year and reports fifteen failures instead of refusing · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.63-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus.** The code change is Codex-shaped (a mechanical guard with checkable output), but Codex is off the table on the run arithmetic alone — Acceptance demands at least two full `verify-shell.mjs` runs (the floor, and the real clock) at ~13 min each (WO-1.62 measured 793–806s), ~26 min against a 20-min cap. It sits in the Claude column on its own merits anyway — the floor has to be *derived* by reading fixtures in three sections (a judgment step the work order itself says was misread once), and it writes `TESTING.md` and `tools/README.md` prose — so the tier is Opus, not a Sonnet fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.63 — --today takes a date before the fixtures' year and reports fifteen failures instead of refusing

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-07 · **Size** XS · **Depends on** —
**Closes roadmap** *(no box. A harness guard, owner-directed, 2026-10-07.)*

**Booked 2026-10-07**, owner-directed, out of WO-1.62's verdict.

**The defect.** `node tools/verify-shell.mjs --today=2026-01-20` runs to the end and reports
`1807 checks · 15 failed`. None of the fifteen is a defect: the date is January of the school year
*before* the one the fixtures are built in, and term-nav, concern-list and log-entries each type a
date in calendar 2026 that they assume today is already past (`TESTING.md` § WO-1.62 names every
one). The fixture year's own Quarter 3, `--today=2027-01-20`, is 1811/1811. WO-1.62's own Acceptance
line called 2026-01-20 a Quarter 3 date, which is how easily this is misread. A run like that costs
about 13 minutes and ends in fifteen red lines that look like a regression.

**Ruled 2026-10-07: dates before the fixtures' year are not supported.** Supporting them would mean
rewriting fixtures in three files for a date the app is never used on. The fix is a refusal and not
a re-fixture.

**Deliverables** — `--today` refuses a date earlier than a floor, before Edge is launched, with a
message naming the floor, why it exists, and a date that works. The floor is **derived from what the
fixtures actually assume**, not guessed. The latest date that a section types and assumes is past
decides it. Concern-list's June 2026 term is the likely one, but read it off the fixtures. The floor
is a named constant beside the `--today` parse, with a comment saying which fixture sets it, so the
next fixture that types a later date knows to move it. **The real-clock run is never refused**: the
guard reads only an explicit `--today`.

**Acceptance**
- [ ] `--today=2026-01-20` exits non-zero within seconds without launching Edge, and its message names
      the floor and suggests `--today=2027-01-20`.
- [ ] `--today` at the floor itself runs, and is green. The run is recorded in `TESTING.md` § WO-1.63
      with its count. If it is not green, the floor is wrong: move it, do not fix the fixtures.
- [ ] The real-clock run is unchanged in check titles and count and still green.
- [ ] `tools/README.md` and the `--today` usage text say what the floor is and why.

**Traps** — **Do not fix the fifteen.** The ruling is that they are out of range, not broken. **No
upper bound** is in scope. A date after the fixtures' year may or may not be green, and if anyone
wants that probed it is a separate row. Nothing in `src/` moves.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/lib-dates.mjs` — **this is where `--today` is actually parsed** (`nodeToday`, `SHIFT_DAYS`, `SHIFT_MS`), and where a typo already throws. The floor constant belongs beside that parse. Check that the refusal fires before `verify-shell.mjs` launches Edge (it imports lib-dates at line ~164, so a throw at module evaluation is likely already early enough — confirm, don't assume).
- `TESTING.md` § WO-1.62 (around line 3127) — names all fifteen failures at `--today=2026-01-20`, section by section, with the fixture dates each one types. Start there, then **read the fixtures themselves** (`tools/verify/term-nav.mjs`, the concern-list section, the log-entries section) to find the latest typed date assumed past. Do not take the floor from the TESTING prose or from the work order's "June 2026 is likely" — read it off code.
- `tools/README.md` § "It takes one argument, and it is a date — `--today`" (around line 718) — the place the floor gets documented.

**Traps the work order does not spell out:**
- The run at the floor is ~13 min and so is the real-clock run. Budget for both; do not substitute a narrower run for either Acceptance line.
- Line 3 says *unchanged in check titles and count*. If you add a harness check for the refusal, the count moves and `tools/README.md`'s recorded `check()` call-site count (wo-sweep § 11) moves with it. The cleaner reading is that the refusal is proved by running the command (exit code, wall time, no Edge) and recording it in `TESTING.md`, not by a new `check()` — if you decide otherwise, say why in the result file.
- If the floor run is red, the instruction is **move the floor**, not touch fixtures. Record each attempt.
- Any mutation you insert to prove the guard bites must be reverted before you write anything else; `grep -rn MUTATION tools/` clean is part of your report.
- Nothing in `src/`, `index.html` or `sw.js` moves, so no `CACHE` bump.

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

## 5. Done means these 4 lines, reported against one by one

1. `--today=2026-01-20` exits non-zero within seconds without launching Edge, and its message names the floor and suggests `--today=2027-01-20`.
2. `--today` at the floor itself runs, and is green. The run is recorded in `TESTING.md` § WO-1.63 with its count. If it is not green, the floor is wrong: move it, do not fix the fixtures.
3. The real-clock run is unchanged in check titles and count and still green.
4. `tools/README.md` and the `--today` usage text say what the floor is and why.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

