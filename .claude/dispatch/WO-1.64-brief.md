# WO-1.64 — the harness floor refuses Sep 1–18 because of one check measured to a fraction of a pixel · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.64-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, no model override. On the work alone this is Codex-shaped — a harness repair with a complete spec and mechanically checkable lines — but the proof does not fit the runner: `verify-shell.mjs` measured ~13 min a run at WO-1.63, and this Acceptance wants at least four full runs (new floor, real clock, two mutations) plus the floor search, far past the 20-minute cap. It lands in the Claude column on its own merits because it writes `TESTING.md` and `tools/README.md` prose, so Opus rather than a Sonnet budget fallback; the runner-up was Sonnet on that budget refusal alone, set aside for consistency with WO-1.63, which was routed the same way for the same files.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.64 — the harness floor refuses Sep 1–18 because of one check measured to a fraction of a pixel

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-07 · **Size** S · **Depends on** WO-1.63
**Closes roadmap** *(no box. A harness repair, owner-directed, 2026-10-07.)*

**Booked 2026-10-07**, owner-directed, out of WO-1.63's verdict.

**The defect.** WO-1.63 put `--today`'s floor at **2026-09-19**, not at the fixtures' year, and one
check is the whole reason. `tools/verify/score-grid.mjs`'s *"at a 1280x800 laptop viewport … the
box's top and bottom edges … are inside the viewport … (WO-3.27)"* asserts `fit.top >= 0` exactly.
`scrollIntoView` lands on a whole-pixel `scrollY`, so the box's top can sit a fraction of a pixel above
the viewport. On every date before 2026-09-19 it reads `{"pageY":505,"top":-0.12,…}`. From that date
on, the fixture's *Unit test*, due `2026-09-18` with blank cells, draws `src/past-due.js`'s banner above
the grid. That moves the page 71px to `{"pageY":576,"top":0.38,…}`, and the fraction happens to come
out positive. So the check has only ever passed because of the banner. It is also one of the fifteen
WO-1.62 listed at 2026-01-20. The cost: Sep 1–18 is refused, and that is where the term starts and
where WO-1.44 (09-01 … 09-03) and WO-1.53 (09-09 … 09-17) took their readings. `TESTING.md`
§ WO-1.63 has the three runs.

**Deliverables**
1. **The WO-3.27 viewport check holds whether or not the banner is drawn.** Allow a half-pixel
   tolerance on `top` (and on `bottom` for the same reason), the `- 0.5` the neighbouring WO-3.27
   checks already use. Don't re-fixture `score-grid.mjs` and don't move its due date. The check then
   proves what it was written to prove: the box's scrollbar is on screen at a laptop size.
2. **`TODAY_FLOOR` comes back down** to the next date the fixtures actually force. That is expected
   to be **2026-07-01**, the end of concern-list's June term, but find it by running. WO-1.63's rule
   stands: if the run at the new floor is not green, move the floor up and write down why; don't fix
   the fixture. The comment beside `TODAY_FLOOR`, the refusal message and `tools/README.md` say which
   fixture sets the floor now.
3. **An impossible date is refused.** `--today=2026-13-40` passes the `YYYY-MM-DD` shape test today,
   rolls over to 2027-02-09 in the `Date` constructor, and runs the whole harness. The parse should
   refuse any date that does not round-trip, through the same `Error` path as a typo.
4. **The refusal stops quoting failure counts.** *"fifteen of them on 2026-01-20, one on 2026-09-18"*
   goes stale the moment either figure changes. Name the fixture that sets the floor and leave the
   numbers out.

**Acceptance**
- [ ] The WO-3.27 viewport check passes with and without the banner. Both the new floor's run and
      the real-clock run are green, and its detail line is recorded in `TESTING.md` § WO-1.64 for
      each.
- [ ] Changing the check's tolerance to `- 5`, or pushing the box down past the viewport by mutation,
      turns it red. A real overflow is tens of pixels, and the half-pixel allowance must not hide one.
      `TESTING.md` records the mutation and its revert.
- [ ] `--today` at the new floor runs and is green, and the day before it is refused. Both are
      recorded with their counts. If the floor is still 2026-09-19 because something else holds it
      there, that is reported and not forced.
- [ ] `--today=2026-13-40` and `--today=2026-02-30` exit non-zero within seconds without launching
      Edge, and `--today=2026-02-28` is not refused by the parse.
- [ ] The real-clock run is unchanged in check titles and count, apart from any title text the
      tolerance change edits, and is still green.
- [ ] `tools/README.md`, the `TODAY_FLOOR` comment, the usage text in `tools/verify-shell.mjs` and
      the refusal message all agree on the floor and on which fixture sets it, and none of them quotes
      a failure count.

**Traps** — **Do not move the fixture's due date** to make the banner disappear or appear: that
changes which runs the check measures, and the check would still be false on half the calendar.
**The other fourteen at 2026-01-20 stay out of range**, and the floor exists for them. Bringing it below
the June term is not in scope. **No upper bound** is in scope either. **Nothing in `src/` moves**:
`src/past-due.js`'s banner is correct, and the check was wrong to depend on it. No `check()` is
needed for the refusal paths; running the command proves them, as it did in WO-1.63.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/past-due.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/score-grid.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-1.63-result.md` and `TESTING.md` § WO-1.63 — the three runs that set the current
  floor, including the `{"pageY":505,"top":-0.12,…}` vs `{"pageY":576,"top":0.38,…}` detail lines.
- `tools/verify/lib-dates.mjs` — `TODAY_FLOOR` (line ~97), the shape test and the refusal message (~112-120).
  The check itself is `tools/verify/score-grid.mjs` ~1942; the neighbouring WO-3.27 checks show the `- 0.5` idiom.

**Orchestrator notes — the traps a cold reader would not guess.**

- **Run time.** There is no section filter; every run is the full harness, ~13 min. Plan the runs before
  starting them: floor search (start at 2026-07-01), the day-before refusal (seconds), the real-clock run,
  and two mutation runs. Background long runs and read the log's own `EXIT=` line — `grep -c` exits 1 on
  zero matches and fakes a failure.
- **Mutations.** Mark each with a `MUTATION` comment, revert it before you write anything else, and run
  `grep -rn MUTATION tools/ src/` before your report. Five dead dispatches here have left a live mutation
  under ticked boxes. Stage your own edits before any `git checkout`-style revert, or it clobbers them.
- **Record the measured `top` in each mutation run**, and which banner state it ran in, so the `- 5`
  reading is interpretable (a `top` of -0.12 is inside -5 either way; the box-pushed-down mutation is
  the one that proves a real overflow bites).
- **Round-trip parse.** Refuse via the same `Error` path as a typo, before Edge launches. `2026-02-28`
  must pass the parse (it may then be refused by the floor — say so; that is the floor, not the parse).
- **Real-clock run is the title comparison.** Diff check titles against HEAD's run; only the WO-3.27
  title may change, and only if you edit it.
- **Line endings.** Check `git diff --stat` before reporting; do not rewrite files with sed -i or Python
  in a way that changes CRLF/LF.
- The gate reported 21.8M proxy units in the 5h window at claim time, past the p25 session-limit death
  level. Write the result file early and keep it current, rather than only at the end.

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

## 5. Done means these 6 lines, reported against one by one

1. The WO-3.27 viewport check passes with and without the banner. Both the new floor's run and the real-clock run are green, and its detail line is recorded in `TESTING.md` § WO-1.64 for each.
2. Changing the check's tolerance to `- 5`, or pushing the box down past the viewport by mutation, turns it red. A real overflow is tens of pixels, and the half-pixel allowance must not hide one. `TESTING.md` records the mutation and its revert.
3. `--today` at the new floor runs and is green, and the day before it is refused. Both are recorded with their counts. If the floor is still 2026-09-19 because something else holds it there, that is reported and not forced.
4. `--today=2026-13-40` and `--today=2026-02-30` exit non-zero within seconds without launching Edge, and `--today=2026-02-28` is not refused by the parse.
5. The real-clock run is unchanged in check titles and count, apart from any title text the tolerance change edits, and is still green.
6. `tools/README.md`, the `TODAY_FLOOR` comment, the usage text in `tools/verify-shell.mjs` and the refusal message all agree on the floor and on which fixture sets it, and none of them quotes a failure count.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

