# WO-3.1 — Categories & weights · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.1-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the Opus tier, because WO-3.1 is the first work order in Phase 3 and
whatever it decides about the category shape and its editor is what WO-3.3 (assignments) and WO-3.4
(grade engine) will copy — plus two deliverables that are teacher-facing prose (the persistent
"weights total 95%" warning and the removal warning) and one genuine ambiguity to resolve, described
in § 2b below. The runner-up I set aside: the data shape is fully specified in `docs/data-model.md`
and reweight arithmetic is mechanically checkable, which is a real Codex signal — outweighed by the
convention-setting, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.1 — Categories & weights

**Ship** 2 · **Status** 🔨 IN PROGRESS · **Size** S · **Depends on** WO-1.6
**Closes roadmap** Phase 3 → "Weighted categories per class, editable, with a visible warning when
weights ≠ 100%."

**Why it exists.** Grading is weighted categories, configurable per class, because the owner's five
classes differ. This is the first thing to set up in a new class and the thing most likely to be
wrong at the start of a term.

**Deliverables**
- Per-class categories: name, weight. Add, rename, reweight, reorder, remove.
- A **visible, persistent** warning when weights don't total 100% — showing the actual total, not
  just "invalid". The teacher is mid-setup; don't block them, tell them.
- Removing a category warns about the assignments it takes with it.
- Sensible starter categories on class creation, trivially editable.

**Acceptance**
- [ ] Weights of 40/35/25 produce no warning; 40/35/20 warns and shows "95%".
- [ ] The app still computes a grade while weights are wrong, and says the grade is provisional.
- [ ] Two classes carry different category sets without interference.
- [ ] Reweighting recomputes every displayed grade in that class immediately.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `docs/data-model.md` — the category shape is settled there and is not yours to redesign:
  `"categories": [{ "id": "k_…", "name": "Tests", "weight": 40 }]` on the class (line 60), the `k_`
  id prefix (§ id prefixes, mirrored at `src/store.js:66`), and § "Grade math — weighted categories"
  around line 247 for what the weights are *for*.
- `src/classes.js` — the sibling module whose conventions you must match, and the file you will most
  likely be extending. Read it end to end; it is the WO-1.6 build this work order depends on. Three
  places in particular:
  - **`src/classes.js:190-209`** (`newClass`). Its comment says `categories` stays empty on purpose
    *because WO-3.1 had not happened yet* — "a category seeded now would be a weight nobody chose
    sitting in the grade math the moment WO-3.1 lands." You are that moment, and Deliverable 4 asks
    for sensible starter categories. **Update that comment as part of your change.** This project has
    a standing scar about a sketch left contradicting the code it documents (see the `terms` comment
    at `docs/data-model.md:55-58`); leaving a stale rationale behind is a defect here, not tidiness.
  - **`src/classes.js:1097-1123`** (`removeTerm`) and **`:1130-1145`** (`applyPreset`) — the existing
    precedent for "this container still holds assignments." Note that both **refuse** rather than
    cascade, for a stated reason: *"a grade that quietly stops counting is the worst failure this app
    has."* WO-3.1's Deliverable 3 asks you to **warn** about the assignments a category removal takes
    with it, which is not obviously the same answer. Decide which it is, and **write the decision
    down in a comment at the point of departure**, naming the rule you are following and why it beats
    the other. Do not silently copy the refusal and do not silently cascade.
  - The term-list rendering, its error surface (`showTermError`), and `announce()` — the categories
    editor should read as the same screen written by the same person, not a new dialect.
- `src/views.js` and `src/shell.js` — how a screen is registered and parented. `VIEWS` at
  `src/views.js:40` is the registry; do not invent a second navigation mechanism.
- `src/modal.js` — the modal pattern, if the removal warning needs one.
- `design/style-guide.md` and Roll Call!'s `design/portable-components.md` at
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\design\` — **lift the design with
  the function; copy, don't re-derive.** A weights row with an inline numeric field and a persistent
  total banner has close counterparts over there. WO-2.11's pass banner was re-cut because it kept
  the reference's card *shape* and invented everything else.

### 2b. The one thing this work order is ambiguous about — read before you plan

**Acceptance lines 2 and 4 name a grade that does not exist yet.** There is no grade engine (WO-3.4),
no assignments UI (WO-3.3), no scores (WO-3.5), and nothing in `src/` renders a percentage today —
I checked. WO-3.4 explicitly owns "pure functions: category percentage, weighted class grade, letter
from percentage," together with its hand-computed `docs/grade-math-cases.md`.

So: **do not build the grade engine here.** Building across that boundary to close a checkbox is
widening the work order, and it would land the arithmetic the whole product's credibility rests on
without the worked-examples document that is deliberately its only test suite.

What that leaves you, and it is a judgment call I am deliberately not making for you:

- The *provisional* determination itself — "these weights total 95%, so any grade computed from them
  is provisional" — is a property of the categories, is small, and is plainly inside this work order.
  A pure exported function over a class that WO-3.4 and WO-3.5 will consume is a reasonable shape.
- The *display* of a provisional grade, and the *immediate recompute on reweight*, need a consumer
  that does not exist. If you build the seam and the notification path so that WO-3.4/WO-3.5 close
  those two lines by plugging in, say exactly that.

**If a line cannot be honestly closed inside these Deliverables, leave it `- [ ]`, say why in your
result file, and propose the follow-up.** Landing at `🔨 IN PROGRESS` with lines owed is this
project's own convention and `wo-gate.mjs --tick` is built to do it. A tick you cannot point at
evidence for is worse than a blank box, and a verifier reads this list cold.

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

## 5. Done means these 4 lines, reported against one by one

1. Weights of 40/35/25 produce no warning; 40/35/20 warns and shows "95%".
2. The app still computes a grade while weights are wrong, and says the grade is provisional.
3. Two classes carry different category sets without interference.
4. Reweighting recomputes every displayed grade in that class immediately.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

