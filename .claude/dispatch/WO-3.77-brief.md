# WO-3.77 — the record bar names every quarter that needs it, newest first · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.77-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override): the bar must stay up and name no student under a projector while both dialogs refuse — presentation mode is a sensitive surface, never delegated — and the work owes teacher-facing prose (`TESTING.md` § WO-3.77, `CHANGELOG.md`, the mockup banner) plus a layout judgment the drawing does not make (two lines in one bar is not drawn). Set aside: the engine half is a pure, fully-specified list reader that would otherwise be Codex-shaped, but it cannot be split from the view half and the mutate-run-revert proof needs at least two ~4.4-min harness runs.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.77 — the record bar names every quarter that needs it, newest first

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-29 · **Size** S · **Depends on** WO-3.73 · **Blocks** WO-3.74
**Closes roadmap** *(no box. Owner-directed, 2026-10-29, out of WO-3.73's verdict.)*

**Booked 2026-10-29**, owner-directed. WO-3.73's bar shows **one term per class**:
`termNeedingRecord()` in `src/term-record.js` returns the first qualifying term in the class's order,
so the earliest wins. The implementer made that call and flagged it, and the verifier passed it on
unruled. Three things go wrong once a second quarter ends, around mid-January:
- **A stuck term hides every later one.** A Q1 never recorded — skipped once, or a teacher who
  started mid-year — holds the bar on *Q1 has ended* all year, and Q2, Q3 and Q4 never get one. The
  bar has no ✕ by design, so nothing clears it.
- **It points at the wrong quarter when it matters.** A Q1 score fixed in January puts *Q1 has
  changed — 1 student* on the bar on Q2's last day, instead of *Q2 ends today*, in the week Q2 is
  being keyed into Blackbaud.
- **It hides that there are two.** Recording Q1 brings the bar straight back for Q2, which reads as
  a recording that did not take.

**Ruled by the owner, 2026-10-29: one bar naming every term that needs attention, newest first, with
a button per term** — *Q2 ends today · Q1 has changed — 1 student*. Of the three options put to the
owner, it is the only one where nothing can be hidden, and on a bar with no ✕ hiding is the risk.
The others were *the newest term only, older ones after*, and *the earliest, plus "and 1 more
quarter"*. **The order, ruled the same day: unrecorded before changed, then newest first** — the
leaning WO-3.73's Rulings recorded. An unrecorded quarter is a whole quarter missing from Blackbaud;
a changed one is a correction to grades already there. So *Q1 has ended, not recorded* leads
*Q2 has changed — 1 student*. *(The heading says "newest first" and keeps it, because three links
name its anchor; this paragraph is the order.)*

**Booked ahead of WO-3.74 on purpose.** WO-3.74's home bar gives each class a button that opens *the*
quarter's dialog, which is this question again. It reads the list this row adds, and is not built
on the single-term reader.

**Surface.** WO-3.73's bar, lifted as it is — `src/term-record-view.js`, `src/shell.css`'s
`.term-record-*` rules, and frames A0, A and D of
[`design/mockups/closing-a-quarter.html`](../../design/mockups/closing-a-quarter.html) for each
line's wording. Two lines in one bar is not drawn; say how it was laid out in the `TESTING.md`
section, and amend the drawing's banner in the same sitting.

**Deliverables**
- **An engine reader that returns every term needing attention for one class**, unrecorded (and
  *ends today*) before changed, then newest first within each,
  each with the state and count `termNeedingRecord()` returns today. It lives in `src/term-record.js`.
  `termNeedingRecord()` either becomes that list's head or is retired; the implementer picks and
  says why. **No screen tests a term itself.**
- **The bar draws one line per entry**, in the list's order, each in WO-3.73's wording for its state
  and with its own *Record Qn grades* button opening that term's dialog. One entry draws exactly
  what WO-3.73 draws today.
- **Recording one term removes its line only.** The bar goes when the list is empty.
- **A count, never a name**, as before, so the bar still stays up under a projector, and the
  dialogs are still refused there.
- **A mutation**: make the bar draw only the list's first entry, show the check go red, and revert
  it before writing anything else.
- **`CACHE` bump in `sw.js`**, **`TESTING.md` § WO-3.77** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] With Q1 recorded and since changed, and Q2 ended and unrecorded, the bar shows two lines, Q2's
      first, each in its own wording and with its own button opening that term's dialog.
- [ ] With Q1 never recorded and Q2 ended, both terms are on the bar, Q2's first; an unrecorded Q1
      no longer hides Q2.
- [ ] With Q1 never recorded and Q2 recorded and since changed, Q1's *has ended* line comes before
      Q2's *have changed* line: unrecorded leads changed whatever their age.
- [ ] Recording one term removes its line and leaves the other; recording the last removes the bar.
      With one term needing attention, the bar reads exactly as WO-3.73's does.
- [ ] Every term, state and count on the bar comes from the engine's list reader, and no screen
      compares records or tests a term's end date.
- [ ] In presentation mode the bar names no student and both dialogs refuse, naming the control.
- [ ] With the bar drawing only the first entry, the check goes red. The mutation is reverted, and
      `TESTING.md` § WO-3.77 shows the red output.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] 👤 On the iPad, a two-line bar reads clearly and both buttons are thumb-sized, in portrait and
      landscape.
- [ ] `TESTING.md` § WO-3.77 carries these lines verbatim with the evidence for each.

**Traps** — **Newest is by the class's term order, not by a name**, and the state outranks it. `src/term-record-view.js`'s
*Q1* is a display abbreviation, and nothing may sort or find a term by it. **Do not re-run the
comparison per line**: each line's count is the reader's, so the bar and the dialog it opens cannot
disagree about who changed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/closing-a-quarter.html`
  - `src/shell.css`
  - `src/term-record-view.js`
  - `src/term-record.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify/term-record.mjs` — WO-3.73's harness section for this bar and its dialog; extend it rather than writing a new file. Line ~545 names `termNeedingRecord` in an export list — if you retire it, that list moves with you.
- `.claude/dispatch/WO-3.73-result.md` — the implementer's own note on why the earliest term won, and what it flagged.
- `docs/data-model.md` § on `termRecords`, if your reader's shape changes anything a later reader (WO-3.74) depends on.

**Traps worth naming beyond the work order's own.**
- **The order is two keys, state then class term order (newest first).** "Ends today" counts as unrecorded, per the Deliverables. Sort by index in `cls.terms`, never by name or by date string compared in the view.
- **Each line's count and each dialog's rows must come from the same reader call** — do not call `noLongerMatching()` again per line in the view; carry what the list returned.
- **The mutation is live code in `src/`.** Revert it before writing any other line, then `grep -rn MUTATION src tools` and confirm empty. Every dead dispatch in this repo that left a mutation left it under ticked boxes.
- **Do not tick Acceptance boxes** — the verifier, a separate session, does that. Leave 👤 open.
- **`TESTING.md` § WO-3.77 is a deliverable, not optional**, and so is the `sw.js` `CACHE` bump.
- If `tools/README.md` records a `check()` count the harness growth changes, update it — that line turned the sweep red on WO-3.26.

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

## 5. Done means these 10 lines, reported against one by one

1. With Q1 recorded and since changed, and Q2 ended and unrecorded, the bar shows two lines, Q2's first, each in its own wording and with its own button opening that term's dialog.
2. With Q1 never recorded and Q2 ended, both terms are on the bar, Q2's first; an unrecorded Q1 no longer hides Q2.
3. With Q1 never recorded and Q2 recorded and since changed, Q1's *has ended* line comes before Q2's *have changed* line: unrecorded leads changed whatever their age.
4. Recording one term removes its line and leaves the other; recording the last removes the bar. With one term needing attention, the bar reads exactly as WO-3.73's does.
5. Every term, state and count on the bar comes from the engine's list reader, and no screen compares records or tests a term's end date.
6. In presentation mode the bar names no student and both dialogs refuse, naming the control.
7. With the bar drawing only the first entry, the check goes red. The mutation is reverted, and `TESTING.md` § WO-3.77 shows the red output.
8. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
9. 👤 On the iPad, a two-line bar reads clearly and both buttons are thumb-sized, in portrait and landscape.
10. `TESTING.md` § WO-3.77 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.77 — it is a deliverable, not a permission.** Add `### WO-3.77 — the record bar names every quarter that needs it, newest first` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.77` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

