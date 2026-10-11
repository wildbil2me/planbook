# WO-3.59 — the assignments screen scrolls sideways at phone width · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.59-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (routed on its own merits, no model override). The deciding signal is that the premise is undiagnosed and the work order says *fix the cause, not the one span* for a `<th>` WO-3.55 will rebuild around a button — a judgment about where the containment belongs, plus `TESTING.md` prose. Set aside: Codex, whose cap would hold a clean run plus one mutation run (~9 min) but not an open-ended diagnosis.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.59 — the assignments screen scrolls sideways at phone width

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-11 · **Size** S · **Depends on** WO-3.54
**Closes roadmap** *(no box. Owner-directed, 2026-10-11.)*

**Booked 2026-10-11**, owner-directed, out of WO-1.77's verdict. Measuring the assignment editor at
390×844 under a coarse pointer, the implementer found the dialog inside 95vw with nothing in it
scrolling, and **the assignments screen underneath scrolling sideways by 134px**, with one planted
assignment. That is the page, not a dialog. `tools/verify/horizontal-overflow.mjs` checks the page at
three sizes but never opens the assignments screen, so nothing has looked.

**Check the premise first.** The cause is not diagnosed. The implementer named one candidate: the
fixture's term with a blank date. Reproduce the 134px with a real-shaped class before changing
anything, find the element that is wider than the screen, and write it down. If it is the fixture
alone, close this work order on that finding and fix the fixture.

**After WO-3.54**, which reshapes the list's top row and its rows. Fixing the overflow first would be
undone by it, or would hide whether WO-3.54 caused a new one.

**WO-3.54 named a cause, and WO-3.55 now waits for this one** (moved 2026-10-11, the owner's call).
`TESTING.md` § WO-3.54 found the element whose right edge is the page's `scrollWidth` on every
fixture: the Actions `<th>`'s `<span class="sr-only">Actions</span>`, absolutely positioned with
no positioned ancestor, so `.assign-table-wrap`'s `overflow-x: auto` does not clip it. Reproduce
that rather than taking it on trust. **WO-3.55 rebuilds that `<th>`** into the ↺ Your order slot, so
the fix must hold for a heading cell that holds a button as well as the span. Fix the cause, not
the one span.

**Acceptance**
- [ ] `TESTING.md` § WO-3.59 names the element that overflowed and why, or shows that only the
      fixture did.
- [ ] At 390×844 under a coarse pointer, the assignments screen with assignments in at least two
      categories has no horizontal overflow, and `horizontal-overflow.mjs` checks it there. With the
      fix reverted, that check fails.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. If `src/` or `index.html`
      changed, `CACHE` in `sw.js` is bumped.
- [ ] `TESTING.md` § WO-3.59 carries these lines verbatim with the evidence for each.

**Not in scope** — other screens at phone width, unless the same element causes theirs. Report them.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify-shell.mjs`
  - `tools/verify/horizontal-overflow.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `TESTING.md` § WO-3.54 — where the Actions-span cause was first named. Reproduce it; do not cite it as your evidence.
- `index.html` ~lines 1150–1165 (`#assignmentsTable`, the `<th><span class="sr-only">Actions</span></th>`), `src/assignments.css` (`.assign-table-wrap`), `src/shell.css` ~line 105 (`.sr-only`) and ~2656 (a comment that already reasons about `.sr-only`'s declarations — read it before touching that class).

**Traps the work order does not spell out.**
- `.sr-only` is used in other wide tables too — `#scoresCaption` and `#attendanceCaption` sit in the same kind of wrapper. If the cause is *an absolutely positioned descendant escaping a scroll wrapper that is not its containing block*, the fix may belong on the wrapper (make it the containing block) rather than on the span or on `.sr-only` globally. Weigh both and write down why you chose. If the same element overflows another screen, the work order says **report it** — fix it only if it is literally the same fix.
- The mutation proof is *revert the fix → the new `horizontal-overflow.mjs` check goes red*. Mark the mutation with a `MUTATION` comment while it is in, revert it **before writing anything else**, and run `grep -rn MUTATION src index.html tools` before you report (AGENTS.md).
- The fixture must have assignments in at least two categories and be real-shaped — the blank-dated term was the other candidate cause; rule it in or out explicitly.
- If `src/` or `index.html` changes, bump `CACHE` in `sw.js`. `verify-shell.mjs` is ~4.5 min a run; budget two or three.

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

1. `TESTING.md` § WO-3.59 names the element that overflowed and why, or shows that only the fixture did.
2. At 390×844 under a coarse pointer, the assignments screen with assignments in at least two categories has no horizontal overflow, and `horizontal-overflow.mjs` checks it there. With the fix reverted, that check fails.
3. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass. If `src/` or `index.html` changed, `CACHE` in `sw.js` is bumped.
4. `TESTING.md` § WO-3.59 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-3.59 — it is a deliverable, not a permission.** Add `### WO-3.59 — the assignments screen scrolls sideways at phone width` under `## Phase 3 — Gradebook`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-3.59` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

