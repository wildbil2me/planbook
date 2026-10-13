# WO-3.67 — WO-3.66's no-roster check passes with the Scores screen's own paint deleted · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.67-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits: the deliverables include `TESTING.md` and `CHANGELOG.md`
prose, and the Traps are a judgment trap — a red before the mutation is a stop-and-report, not a
check to adjust (ROUTING § Route to Claude). The runner-up, Codex, was set aside without a probe: the
harness measured **1110s (~18.5 min) a run** on this tree in the first dispatch, and the Acceptance
wants a clean run plus a mutated run, ~37 min against a 20-minute cap.

**This is the second dispatch.** The first stopped red before its mutation because its route went
through another class's Scores, which drops the note by `src/list-note.js`'s own ruling. The owner
re-cut the work order on that evidence; the first record is committed at `3b2c269` and readable with
`git show 3b2c269:.claude/dispatch/WO-3.67-result.md`. Its proposed re-cut is what you are building.
Do not reattempt any detour through another class or term.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.67 — WO-3.66's no-roster check passes with the Scores screen's own paint deleted

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** XS · **Depends on** WO-3.66 · **Blocks** nothing
**Closes roadmap** *(no box. Owner-directed, 2026-10-12.)*

**Booked 2026-10-12**, owner-directed, out of [WO-3.66](#wo-366--a-nameless-close-from-the-scores-screen-shows-its-warning-on-the-scores-screen)'s
verdict. A ride-along on `tools/verify/copy-class.mjs`: fold it into the next sitting that has that
file open.

**Why it exists.** WO-3.66's verifier deleted the Scores screen's call that paints the list's note
and re-ran the harness. Acceptance lines 1–3 went red; **line 4 — a class with no roster still draws
the note on Scores — stayed green.** Its fixture closes a blank editor from the *assignment list*,
then taps the Scores pill, and the list's paint already fills **both** hosts from `src/list-note.js`,
so the Scores host is full before Scores renders at all. The check proves where the line sits on a
no-roster screen and that `#scoresTop` is hidden around it; it does not prove that **Scores' own
render** draws it. That render is the one that runs when a teacher reaches a no-roster class's Scores
any other way, such as from home. *(Clearing a note left by another class is WO-3.66's third
Acceptance line and is already checked; it is not this work order's.)*

**Re-cut 2026-10-12, owner-directed, after the first dispatch stopped.** As first booked, the route
went through **another class's Scores** to empty the host. Built that way, it went red with no
mutation in place: 2062 checks, 1 failed, WO-3.66 line 4, with the note missing from **both** hosts.
That is not a defect. `src/list-note.js` § "When it is dropped" rules that a Scores render on another
class or term **drops the note**, so any detour through another class deletes the note it was meant
to test. An empty host and a live note cannot both be produced by a route through the app. **Do not
try the detour again.** The record is `.claude/dispatch/WO-3.67-result.md`.

**Deliverables**
- **The line-4 check empties the Scores host by hand before Scores renders**: after the blank close
  on the list, the fixture blanks `#scoresMoved` over `evalJs` and asserts that it is empty. Then it
  reaches the no-roster class's Scores from home by a route that renders no assignment list on the
  way. That leaves the note alive in `src/list-note.js` and the host empty, so only Scores' own
  `paintListNote()` call can refill it. This is a test-only write to a view element and adds no
  door to `src/`. The existing assertions stay as they are.
- **A mutation**: delete Scores' paint call, show the reworked check go red, and revert it before
  writing anything else.
- **`TESTING.md` § WO-3.67** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] WO-3.66's no-roster check reaches the no-roster class's Scores screen with the Scores host
      emptied by the fixture and no list rendered after it, and still passes.
- [ ] With Scores' call to the note's paint deleted, that check goes red. The mutation is reverted, and
      `TESTING.md` § WO-3.67 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-3.67 carries these lines verbatim with the evidence for each.

**Traps** — **There is no `+ New assignment` on a no-roster Scores screen**: it lives in `#scoresTop`,
which that state hides, so the note can only arrive from the list. Do not build a door to make the
fixture easier. Blanking the host from the harness is not a door. **No route through another class
or term can stand in for the hand-emptied host**, because that render drops the note (see the
re-cut above). **If the reworked check goes red before the mutation**, read both hosts first. If the
list host still holds the note and the Scores host does not, that is a defect in `src/scores.js`:
stop and report it rather than adjusting the check. If both are empty, something dropped the note on
the way. That is the route, so stop and report it as well. **Nothing in
`src/` moves** if it passes, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/list-note.js`
  - `src/scores.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/copy-class.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **Where to work**: `tools/verify/copy-class.mjs` § "Acceptance 4: a class with no roster" (around
  line 1864), and its reader `read366()` (around line 1732), which reads both hosts. Scores' paint call
  is `paintListNote()` at `src/scores.js` ~1220 — that is the mutation site.
- **Watch the route from home.** A class card may reopen the last screen visited, which here is the
  assignment list — and a list render refills the host and defeats the test. Confirm which screen the
  card lands on, and step to a non-list screen (e.g. Attendance) before the Scores pill if needed.
  Assert in the check, not just in your head, that the host was empty after the blank and that the
  view before Scores was not `assignmentsView`. Also confirm the trip home drops nothing:
  if it did, both hosts read empty and the Traps say stop.
- **Harness timing**: ~18.5 min a run. Run it in the background and read the log's own `EXIT=` line;
  `grep -c` on zero matches exits 1 and fakes a failure.
- **The mutation**: delete the call, run, record the red, revert with `git checkout -- src/scores.js`,
  and `grep -rn MUTATION src tools` before you write a single line of prose. A killed run that leaves
  it in place ships a broken Scores screen.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

1. WO-3.66's no-roster check reaches the no-roster class's Scores screen with the Scores host emptied by the fixture and no list rendered after it, and still passes.
2. With Scores' call to the note's paint deleted, that check goes red. The mutation is reverted, and `TESTING.md` § WO-3.67 shows the red output.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
4. `TESTING.md` § WO-3.67 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.67 — it is a deliverable, not a permission.** Add `### WO-3.67 — WO-3.66's no-roster check passes with the Scores screen's own paint deleted` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.67` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

