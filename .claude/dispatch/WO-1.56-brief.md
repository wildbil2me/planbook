# WO-1.56 — a date-field section that throws leaves the rest of the run on a fine pointer · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.56-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is the proof budget
plus the audit: the Acceptance needs at least three full `verify-shell.mjs` runs (clean, injected
throw with the `finally`, injected throw without it) over a 1550-check harness, which no Codex
budget fits, and the second Deliverable is a judgment read of 39 files written up as `TESTING.md`
prose. The runner-up, Codex on "harness-only, one `finally`", was set aside for those two reasons.
Same route and tier as WO-1.55, the work order this repairs.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.56 — a date-field section that throws leaves the rest of the run on a fine pointer

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-27 · **Size** XS · **Depends on** WO-1.55 — the toggle this repairs
**Closes roadmap** *(no box. A harness defect with no live symptom yet.)*

**Booked 2026-09-27**, owner-directed, from WO-1.55's verdict. `tools/verify/date-zero-key.mjs`
switches touch emulation off before it types (~line 208) and back on only at its foot (~line 416).
The two are joined by nothing. If anything between them throws, `runSection()` in
`tools/verify-shell.mjs` reports the throw and `recoverPage()` reloads the page. **A reload does not
reset CDP emulation**, so every later section runs with no coarse pointer and no touch points. That
starts with `date-clear.mjs`, which sets its own viewport but not its own touch setting. The throw is
reported, because WO-1.44 made sure of that. What is not reported is the second failure it causes:
the checks after it are measured on the wrong device, and the ones that assume the coarse pointer
(44px targets under `pointer: coarse`, tools/README.md trap 3) may go red or green for a reason that
has nothing to do with them.

**Deliverables**
- **Put the touch setting back on every exit from the block**, not just the normal one. A `finally`
  around the span from the toggle-off to the toggle-on is the smallest fix that does it.
- **Say in `TESTING.md` § WO-1.56 whether any other section leaves emulation in a changed state
  across a throw.** There are 39 files in `tools/verify/` that call `setTouchEmulationEnabled`. List
  them and record the answer; do not fix them here. If the answer is "several", the fix is
  `recoverPage()` restoring a known baseline, which is a larger work order and the owner's to book.

**Acceptance**
- [ ] A throw injected between the two toggles leaves the next section reading
      `matchMedia('(pointer: coarse)').matches === true`. The run is recorded in `TESTING.md`
      § WO-1.56 and **the injected throw is reverted before anything else is written** (`AGENTS.md`).
- [ ] Mutation-proved: the same injected throw with the restore removed leaves the next section on a
      fine pointer.
- [ ] The whole harness is green on the real clock, and no check changes state.
- [ ] `TESTING.md` § WO-1.56 answers the question in the second Deliverable.

**Traps** — **Do not move the toggle-off earlier or the toggle-on later to shrink the window**. The
window is not the defect. The missing `finally` is. **Do not turn touch off for the whole section**:
the clicks that open the editor are meant to happen on the coarse pointer, as WO-1.55's comment in
the file explains.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/date-zero-key.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `.claude/dispatch/WO-1.55-result.md` — how the toggle got there and the baseline it left
  (1550/1550 green).
- `AGENTS.md` § "If you were dispatched with a work order" — the mutation rules. Planting a throw
  here *is* a mutation.

**Traps the work order does not spell out:**

- **Use the next section as your reader.** In `BROWSER_SECTIONS` the order is `date-zero-key.mjs`
  → `date-clear.mjs` (`tools/verify-shell.mjs` ~line 323–328). Acceptance 1 and 2 ask what *the next
  section* sees. Whether that reading stays in the harness as a permanent check or is only a
  temporary probe during the planted-throw runs is your call. Either way say which in the result
  file, and make sure a probe does not ship as a hidden plant. If you add a check, Acceptance 3's
  "no check changes state" means the baseline diff shows **only additions**. Compare the PASS/FAIL
  lines of a clean run before and after your change, and do not rely on the totals alone.
- **A `finally` must not hide the throw it is cleaning up after.** If the restoring `send(...)`
  itself throws (the reason for the original throw could be a dead CDP target), the original error
  is replaced and `runSection()` reports the wrong cause. Decide how to handle that and say what you
  chose. Also, do not let the `finally` swallow the error. The section must still be reported as
  having thrown, because WO-1.44 made that the rule.
- **Mark every plant with `MUTATION`** and revert it before you write any prose. Stage your real
  edits (`git add`) before any `git checkout` revert, or the checkout clobbers them. Your last
  command before the result file is `grep -rn MUTATION tools/ src/`, and its output goes in the
  result file.
- **The 39-file audit is a reading, not a fix.** For each file record whether it leaves touch
  emulation (and, if you notice it on the way, the viewport) in a changed state across a throw, then
  give the one-line answer the Deliverable asks for. **Do not edit any of the 39.** If the answer is
  "several", propose the `recoverPage()` baseline as a follow-up in your report. Do not build it.
- `tools/README.md` keeps a `check(` call-site count that `wo-sweep.mjs` § 11/§ 22 hold it to. If you
  add a `check(`, update that number. This is what turned WO-3.26's sweep red.
- Read the log's own `EXIT=` line. `grep -c` on a green log exits 1.

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

1. A throw injected between the two toggles leaves the next section reading `matchMedia('(pointer: coarse)').matches === true`. The run is recorded in `TESTING.md` § WO-1.56 and **the injected throw is reverted before anything else is written** (`AGENTS.md`).
2. Mutation-proved: the same injected throw with the restore removed leaves the next section on a fine pointer.
3. The whole harness is green on the real clock, and no check changes state.
4. `TESTING.md` § WO-1.56 answers the question in the second Deliverable.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

