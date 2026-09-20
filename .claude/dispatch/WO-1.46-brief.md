# WO-1.46 — four fixtures still guess a date, and one of them is the twin of the one that broke · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.46-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus tier**, on the work order's own merits. The deciding signal is
the Traps section — *"a term boundary is not an event, and the fix may differ; read each before
assuming the twin's answer fits"* — and Acceptance line 2's *four sites, four decisions, none silent*,
which asks for a written ruling at each line rather than a mechanical substitution. The runner-up
consideration set aside: the budget arithmetic (at least three full harness runs plus a
planted-record drive at ~4.4 min each, ~17.6 min against a 20-minute cap) would have excluded Codex
anyway, but `ROUTING.md` § "Which Claude" reads the Claude column first and this row is there on its
own.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.46 — four fixtures still guess a date, and one of them is the twin of the one that broke

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-19 · **Size** S · **Depends on** WO-1.44 ✅ · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.45
made. Booked 2026-08-31, owner-directed, on WO-1.44's verifier's second proposal.)*

**Why it exists.** WO-1.44's defect was a fixture that **guessed** a date — *today + 9* — and collided
with a record another section had planted on a hard-coded `2026-09-09`, on exactly one day of the
year. The repair derived the date instead: `preDropDayFrom()` walks past any day already holding a
record and asserts its own precondition. **It repaired two sites of six.** Four still guess:
`tools/verify/register-opens-on-term.mjs:75`, `term-edges-marking.mjs`, `term-ended.mjs` and
`today-goes-to-term.mjs`. All four were green on the five weekdays WO-1.44 drove, and **none of them
is immune by construction** — which is precisely the evidence that failed us on 2026-08-30, when a
green Sunday run was taken as a healthy harness.

*(**A seventh site turned up on 2026-09-17, and it is deliberately not on this row's list.**
`attendance-passes.mjs:2172` reads the register's *earlier page* — `nodeColumns(6, 1)`, a window
derived backwards — and the residue `classes-terms.mjs` plants on `2026-09-09` sits inside it for a
week every September. The helper this row settles on cannot fix it, because the page is not a date
the fixture is free to pick. It is
[WO-1.53](#wo-153--the-residue-meets-the-registers-earlier-page-for-a-week-every-september); the
count of four here stays right.)*

**One of the four is a twin and three are cousins, and a row that treats them as four equal jobs will
spend its time in the wrong place.** `register-opens-on-term.mjs:75` is
`const DAY_OFF = nodeWeekdayAhead(9)` — **the same construct on the same offset** that just cost a
day: an event authored onto a future date that may already hold a record. The other three use
`nodeWeekdayAhead()` for term **start and end** dates, which is a weaker risk: a term boundary landing
on a planted record is a fixture reading oddly, where authoring an event onto one is the case that
produced five cascading failures and a crash. **Fix the twin first.**

**The urgency dropped the day it was found, and the row should be read with that in mind.** Before
WO-1.44 a collision like this killed the run and hid 766 checks behind a stack trace. It now reddens
its own section, names what it lost, and lets every later section finish — so this is a real defect
that **fails safely**, which is why it is booked here rather than scheduled ahead of the term.
*(**Not before 2026-09-02**, owner-directed: this edits four fixture files inside `tools/verify/`,
the surface WO-1.44 just stabilised on the strength of five green weekdays, and re-opening it two
days before the app meets students trades a real risk for a downgraded one. WO-1.45 carries no such
constraint — it touches `wo-sweep.mjs` and cannot affect a run.)*

**Traps**

- **Derive, do not widen the guess.** Adding a bigger offset — *today + 20* instead of *+ 9* — moves
  the collision rather than removing it, and moves it somewhere nobody has driven. The helper
  `firstClearDayFrom(records, start)` is the shape WO-1.44 settled on, in `lib-dates.mjs` this time
  rather than inline, and a **ceiling rather than an unbounded walk**: a document holding a record on
  every one of the next sixty days should fail a precondition loudly, not hang the run.
- **Assert the precondition at each site.** The derived date is worth little without the check that
  says what was assumed — WO-1.44's site asserts zero records and a future date, and that assertion
  is what turns the next collision into a named red line instead of a cascade.
- **A term boundary is not an event, and the fix may differ.** The three cousins plant term
  start/end dates, and forcing them through a helper built for "a day with nothing on it" may say
  something false about what a term edge needs. Read each before assuming the twin's answer fits.
- **Routing through `nodeNow()` is not immunity, and the two are easy to confuse.**
  `today-goes-to-term.mjs` already respects `--today` and is still on this list: honouring a shifted
  clock and choosing a date that cannot collide are different properties, and WO-1.44 gave it the
  first and not the second.

**Acceptance**
- [ ] `register-opens-on-term.mjs`'s day-off date is **derived from the document** rather than
      guessed, with its precondition asserted at the site — driven against a planted record on the
      date it would otherwise have chosen.
- [ ] The other three sites are each **read and settled in writing**: derived the same way, or left
      as they are with the reason named at the line. Four sites, four decisions, none silent.
- [ ] The helper lives in `lib-dates.mjs`, carries a ceiling rather than an unbounded walk, and is
      used by WO-1.44's site too, so there is one of it rather than two.
- [ ] `node tools/verify-shell.mjs` is green on **at least three weekdays** including one driven with
      `--today` onto a date the fixtures plant records on.
- [ ] `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
  - `tools/verify/register-opens-on-term.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/lib-dates.mjs` — where the helper lands. Read `nodeToday`, `nodeWeekdayAhead()`,
  `nodeColumns()` and the `--today` shift; the new helper must honour the shifted clock the same way.
- `tools/verify/attendance-passes.mjs` — `preDropDayFrom()` (around line 2230) is WO-1.44's inline
  helper and the shape to lift, UTC walk and 60-day ceiling included. Acceptance line 3 says that
  site calls the shared helper afterwards, so there is one of it rather than two. **Do not touch the
  `offWeek` / `nodeColumns(6, 1)` block above it** — that is WO-1.53's, settled, and the work order
  says in as many words it is not on this list.
- `tools/verify/term-edges-marking.mjs`, `tools/verify/term-ended.mjs`,
  `tools/verify/today-goes-to-term.mjs` — the three cousins. Each gets read and gets a decision
  written at the line, whichever way it goes.
- `tools/verify/classes-terms.mjs` around line 734 — the residue.
- `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.44 and § WO-1.53 — the two collisions
  this row descends from.
- `tools/README.md` — the `--today` flag and how a shifted run announces itself.

## 2b. Traps the orchestrator adds — things the tree has moved on since the work order was written

- **The residue is no longer on a hard-coded date.** The work order says `classes-terms.mjs` plants
  a record on `2026-09-09`. Since WO-1.53 it plants it on `nodeColumns(6, 3)[5]` — three register
  pages back, always in the past — so `today + 9` can no longer reach it and **`--today` cannot be
  aimed at it.** Acceptance line 4 still wants one run driven with `--today` onto *a date the
  fixtures plant records on*: find which records actually survive into a later section's document
  on today's tree (`grep` for date literals and clock-derived dates across `tools/verify/`, and read
  what each section tears down), and say in the result which date you chose and why it qualifies.
  If nothing surviving is reachable by a forward walk any more, say that plainly — the honest
  answer to that line is a finding, not a fudge.
- **Acceptance line 1's proof is a planted record at the site, not a lucky calendar.** "Driven
  against a planted record on the date it would otherwise have chosen" means the section itself
  plants a record on the guessed date before deriving, asserts the derived date walked past it, and
  asserts the precondition (zero records on the derived date, and it is in the future). The
  proof must be in the fixture, on every run, not in a one-off `--today` that happens to collide.
- **The twin first, and it is one line.** `register-opens-on-term.mjs:75` `DAY_OFF =
  nodeWeekdayAhead(9)` authors a day-off event onto a future day. Note the derived day must still
  sit **before `OPENS`** (weekday 10) for the phase that uses it — "one weekday before the term
  opens" — so a walk that overshoots `OPENS` breaks the fixture's own arrangement. Assert that
  relation too, or reason at the line why the walk cannot reach it.
- **Weekday versus calendar day.** `nodeWeekdayAhead()` counts weekdays; `preDropDayFrom()` walks
  calendar days. A shared helper has to say which it walks and why, and a site that needs a
  weekday (a term edge, a day-off event on a school day) needs the walk to skip weekends or needs
  the reason written down for why a weekend result is acceptable there.
- **A cousin may legitimately stay as it is.** A term start or end landing on a planted record is
  a fixture reading oddly, not an authored event clashing with a meeting. "Left as it is with the
  reason named at the line" is a valid outcome for any of the three, and a worse outcome than that
  is forcing a term edge through a helper built for "a day with nothing on it" and saying nothing.
- **`--today` runs are runs, not reads.** Acceptance line 4 wants three green weekdays. Record each
  command with its exact `--today` value and its final `EXIT=`/summary line in the result file.
  `grep -c` on the log fakes a failure (zero matches exits 1) — read the harness's own summary.
- **Check `git diff --stat` before reporting** — a diff touching every line of a fixture is a
  line-ending rewrite, not a change. And any temporary `MUTATION` you insert to prove a precondition
  bites comes out before the final clean run; `grep -rn MUTATION` is the first move on any recovery.

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

1. `register-opens-on-term.mjs`'s day-off date is **derived from the document** rather than guessed, with its precondition asserted at the site — driven against a planted record on the date it would otherwise have chosen.
2. The other three sites are each **read and settled in writing**: derived the same way, or left as they are with the reason named at the line. Four sites, four decisions, none silent.
3. The helper lives in `lib-dates.mjs`, carries a ceiling rather than an unbounded walk, and is used by WO-1.44's site too, so there is one of it rather than two.
4. `node tools/verify-shell.mjs` is green on **at least three weekdays** including one driven with `--today` onto a date the fixtures plant records on.
5. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

