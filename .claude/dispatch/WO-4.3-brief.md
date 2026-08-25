# WO-4.3 — Praise signals · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-4-signals.md`
**Report to** `.claude/dispatch/WO-4.3-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus**, because this work order's Traps are judgment rather than
mechanics: *rank by delta, not by level* and *derive the turnaround from the log and prior
evaluations rather than storing a "was flagged" bit that can go stale* are both rulings a model
optimizing for clean code will quietly undo, and its own third Acceptance line grades whether the
ranking is **right**, not whether it runs. The runner-up I set aside is the Codex read: the five
defaults are tabulated outside the work order in `docs/data-model.md` § Signal thresholds, which is
the project's strongest Codex signal — but WO-4.1 already built that arithmetic contract and
registered all five praise threshold blocks, so what is left here is the design ruling plus a mockup
lift and per-rule explanation prose.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-4.3 — Praise signals

**Ship** 3 · **Status** 🤖 CLAIMED — 2026-08-24 · **Size** M · **Depends on** WO-4.1
**Closes roadmap** Phase 4 → "Praise signals."

**Why it exists.** "Top of the class" surfaces the same four students every week and is worth
nothing. "Came up 14 points since October" surfaces a different student every time, and it's the
message that actually lands at home. **A rule that can only ever fire for high achievers is the
wrong rule.**

**Deliverables** — each with its documented default:

| Rule | Default |
|---|---|
| Rose N points across the last N assignments | 8 pts / 4 |
| N consecutive scores at or above N% | 3 / 90% |
| Came off the concern list (turnaround) | within 21 days |
| No missing work across the last N assignments | 8 |
| Attendance at or above N% over the last N meetings | 100% / 20 |

Plus: the praise list, **ranked by delta** — the size of the change, not the height of the score.
The turnaround rule requires retaining enough history to know a student was previously flagged;
derive it from the log and prior evaluations rather than storing a "was flagged" bit that can go
stale.

- **Surface: the right-hand column of WO-4.2's view, at equal width** — drawn in
  [`design/mockups/signals.html`](../../design/mockups/signals.html), which is where the equal billing
  is argued rather than asserted: a stacked layout buries praise on any screen shorter than both
  lists, and every iPad is. Two consequences the drawing settles for this work order. The column head
  says **biggest climb first** in as many words, because a teacher who reads "Praise" as "the top of
  the class" stops reading it inside a fortnight. And the **delta is the only bold figure on a praise
  row** — the current grade is not drawn at all, since a list that ranks by delta and draws the level
  big is arguing with itself.

**Acceptance**
- [ ] Sorting the praise list by its default ranking puts the biggest *improvement* first, not the
      highest grade. Verify with a case where a B− student outranks an A student.
- [ ] The turnaround rule fires for a student who was on the concern list and no longer is.
- [ ] Running the praise list two weeks apart on real data surfaces a materially different set of
      students. *(If it doesn't, the ranking is wrong — this is the acceptance test that matters.)*
- [ ] A student with a perfect record but no improvement does not dominate the list.
- [ ] Every praise hit's explanation contains the delta and the window it was measured over.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/signals.html`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/signals.js` — WO-4.1's engine and WO-4.2's nine concern rules. **Read its file header and the
  `attendanceWindow` rule near the foot before writing a rule of your own**: that is the one praise
  rule already registered, and its shape (`id` / `direction` / `keys` / `measure` / `say` / `figure`)
  is the contract your four inherit. `SIGNAL_SETTINGS` already declares all five praise thresholds —
  check before adding a key.
- `src/signals-view.js` and `src/signals-view.css` — WO-4.2's view. The praise column is the
  right-hand half of a layout that already exists; `SORT_NOTES` is where a column head says out loud
  what it is ordered by.
- `design/mockups/signals.html` with `design/mockups/proposed-phase4.css` — the drawing, and it is
  written to be lifted rather than re-derived (`CLAUDE.md` § Reference implementation).
- `plans/work-orders/phase-4-signals.md` § WO-4.2 — the surface, the severity ruling and the
  presentation-mode ruling this column inherits rather than re-decides.

### Five traps specific to this one

1. **The delta is the ranking and the only bold figure on a praise row.** The current grade is not
   drawn at all — a list that ranks by delta and draws the level big is arguing with itself. The
   column head says **biggest climb first** in as many words.
2. **`attendanceWindow` and the "no missing work" rule have no delta**, and its `figure()` says so
   with `tone: 'flat'` and a comment addressed to you by name. Decide deliberately where a level-only
   praise hit sits in a delta ranking and write the reasoning at the point you decide it; do not let
   a perfect-attendance student head a list of climbers (Acceptance line 4 is exactly this).
3. **Ordering is a function over hits, never a field on one.** `severityOrder()` recomputes from the
   hit's own numbers so nothing can go stale; a praise ordering follows that pattern or explains why.
4. **The turnaround rule must not add a stored bit.** Derive "was on the concern list and no longer
   is" at read time. If that turns out to need something the document does not hold, say so in your
   result as a proposed follow-up — do not invent a schema field.
5. **The rules produce their own sentences.** Every explanation carries the delta *and* the window it
   was measured over (Acceptance line 5), built from the numbers the rule measured — never written
   per-screen, so it cannot drift from the arithmetic.

### The one Acceptance line you probably cannot close

*"Running the praise list two weeks apart on real data surfaces a materially different set of
students."* There is no real data until the term starts 2026-09-02. Do the strongest desk-side thing
you can — two fixture snapshots a fortnight apart, if that is honest evidence — and if it is not,
**leave the box `- [ ]` and say what it is waiting for**. A tick you cannot point at evidence for is
worse than a blank box, and landing at `🔨 IN PROGRESS` with a line owed is this project's own
convention.

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

1. Sorting the praise list by its default ranking puts the biggest *improvement* first, not the highest grade. Verify with a case where a B− student outranks an A student.
2. The turnaround rule fires for a student who was on the concern list and no longer is.
3. Running the praise list two weeks apart on real data surfaces a materially different set of students. *(If it doesn't, the ranking is wrong — this is the acceptance test that matters.)*
4. A student with a perfect record but no improvement does not dominate the list.
5. Every praise hit's explanation contains the delta and the window it was measured over.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

