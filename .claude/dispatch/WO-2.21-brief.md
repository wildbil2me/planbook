# WO-2.21 — the 44px sweep can see a screen that is not the one on screen · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.21-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier, on this work order's own merits rather than as a
Codex fallback. The deciding signal is the first Deliverable, which hands you an unresolved design
question by name — *"How it opens them is the design question… Pick one deliberately and write the
reasoning down"* — and that is judgment about what the spec should be, not implementation of a spec
that already exists; it is also convention-setting, because WO-3.6, WO-3.7 and WO-3.9 each add a
screen that will inherit whatever enumeration mechanism you write. The runner-up I set aside was
Codex: size S, tooling-only, no new visual language, and four of five Acceptance lines are
mechanically checkable — but a work order whose entire subject is *a harness that reported green over
a screen it never looked at* sits squarely on this pipeline's documented worst failure mode, and the
cost of auditing a confident green afterwards is higher than the cost of the top tier now.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.21 — the 44px sweep can see a screen that is not the one on screen

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-11 · **Size** S · **Depends on** WO-3.5 — the by-hand fix it
generalises is in `tools/verify-shell.mjs` § "the score entry grid (WO-3.5)" · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-2.14, WO-2.15, WO-2.18, WO-2.19 and
WO-2.20 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-10, out of WO-3.5's verification, where it
was raised as a residual and deliberately not folded into that work order.

**Why it exists.** The standing 44px touch-target sweep collects `button, input, select, …` across the
page and skips anything computing to `display: none`. **`.hidden` is `display: none !important`, and
every view but the one on screen is `.hidden`.** So the sweep measures whichever screen the fixture
happened to leave open and reports green over the rest.

**This is not hypothetical and the number is the point.** WO-3.5 shipped a grid holding roughly 250
score inputs. The sweep walked past every one of them and passed — and because the *Scores* segment
shipped disabled in the same round, **nothing in that run could have opened the view to measure them
even if it had wanted to.** A green run over a fixture that cannot express the failure is the backup
nag escape exactly, and this is its third appearance.

**What WO-3.5 did about it, and why that is not enough.** It opens `#scoresView` through the real
navigation segment before measuring, and asserts *"the grid is OPEN and drawn under the coarse
pointer"* as a check of its own, because a sweep over nothing is what it was closing. **All of that is
hand-written inside WO-3.5's own section and covers `#scoresView` alone.** The mechanism is untouched.

**The cost of leaving it, which is what makes this worth an S now rather than later.** WO-3.6, WO-3.7
and WO-3.9 each add a screen. On today's harness each one arrives with the same hole, needs the same
by-hand workaround written again, and **reports green in the meantime whether or not anyone remembers
to write it.** The failure is silent and it is silent in the direction of looking fine — which is the
same shape as WO-2.19's stale check count, and the same argument for fixing the mechanism rather than
the instance.

**Deliverables**
- **The sweep enumerates every view and measures each one opened**, rather than measuring whatever the
  fixture left visible. How it opens them is the design question: driving the real navigation is
  truest and is what WO-3.5 did by hand; un-hiding them directly is cheaper and risks measuring a
  layout no teacher can reach. **Pick one deliberately and write the reasoning down** — a sweep that
  measures a screen in a state the app never puts it in is a new way to be green and wrong.
- **A view with nothing in it fails rather than passes.** The count assertion is the part that makes
  this real: WO-3.5's section asserts ≥200 cells before measuring, because zero controls measured is
  indistinguishable from zero controls undersized. **Every view carries its own floor.**
- **A view the sweep does not know about is named**, so the next screen is a failing check rather than
  a silent omission. This is the WO-2.19 principle: a list maintained by remembering is not maintained.
- **WO-3.5's by-hand block collapses into the general mechanism**, or the work order says in a sentence
  why it must stay special. Two mechanisms measuring the same screen is how one of them rots.

**Out of scope** — widening what the sweep measures beyond touch targets, and any change to the 44px
threshold itself. This is about *which screens are looked at*, not about what is checked on them.

**Acceptance**
- [ ] Every view in `index.html` is measured under the coarse pointer, enumerated from the document
      rather than from a list someone typed.
- [ ] **Deleting WO-3.5's by-hand block does not reduce coverage of `#scoresView`** — the general
      mechanism reaches it, proved by running with the block removed and quoting the counts.
- [ ] A view that opens empty fails on its own floor, driven by planting an empty one rather than
      argued.
- [ ] Adding a view to `index.html` and not to the harness turns a check red, driven the same way.
- [ ] The total check count rises and `tools/README.md` records the new number — which is WO-2.19's
      mechanism if it has landed, and a hand edit with a note if it has not.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these — they are the specific ground this work order stands on, and I found them while
routing so you do not have to:

- **`tools/verify-shell.mjs:10522–10561`** — the standing sweep itself, under the banner comment
  *"touch targets, under a pointer that is REALLY coarse"*. Line 10551 is the defect:
  `if (getComputedStyle(e).display==='none') return;`. The `meas.length >= 5` guard at 10558 is the
  vacuous-pass floor as it exists today, and it is the thing your per-view floors generalise.
- **`tools/verify-shell.mjs:13090–13141`** — WO-3.5's by-hand block. It reloads under coarse
  emulation, clicks `#classTabBar [data-class-tab="c_wo35"]` and then
  `#classView [data-class-screen="scores"]`, asserts *"the score grid is OPEN and drawn"* with
  `cells >= 200`, and only then measures `#scoresView button, #scoresView input` with its own
  `grid44.length >= 200` floor. This is the shape the work order asks you to generalise, and
  Deliverable 4 asks you either to collapse it or to write down in one sentence why it stays special.
  Note it depends on a fixture (`c_wo35`, twenty-five students, ten assignments) that the general
  mechanism will not have — that asymmetry is real and is worth naming in your reasoning either way.
- **`index.html`** — the views as they stand: `#homeView` (line 453, the only one not born
  `.hidden`), `#classView` (562), `#assignmentsView` (773), `#scoresView` (870). The comments at
  73–74, 409–410, 761 and 850 state the sibling-toggled-by-`.hidden` convention and lift it from Roll
  Call!'s `#registryView` / `#compactGridView`. Enumerate from the document, per Acceptance line 1 —
  that list of four is a fact about today, not a list to type into the harness.
- **`src/screen-nav.js`** — the real navigation. `refreshScreenNav()` and `segment()` build the
  `data-class-screen` buttons; `screenLabel(view)` names them. If you drive the real navigation, this
  is the module that decides whether a segment is even present or enabled, which is exactly how
  WO-3.5's ~250 inputs became unreachable: the Scores segment shipped disabled in the same round, so
  nothing in that run *could* have opened the view. A view that is real but currently unreachable is
  a case your mechanism has to have an answer for — silently skipping it recreates the bug.
- **`tools/wo-sweep.mjs:573–650` (§11)** — **WO-2.19 has landed**, so Acceptance line 5 goes through
  its mechanism rather than by hand. §11 greps `check(` call sites in the harness and asserts the
  number against the sentence in `tools/README.md` of the form *"… holds N `check()` call sites …"*.
  Move the count without updating that sentence and the sweep goes red. Its own FAIL text
  (`:647`) tells you the whole obligation: update that line **and the executed-check count in the
  paragraph beside it** — `tools/README.md:602–635`, currently **532 executed** — *"from a run rather
  than by arithmetic."* Take both numbers off a real `node tools/verify-shell.mjs` run and quote them
  in your report.

**On proving lines 3 and 4.** Both say *driven* rather than argued: plant an empty view, run, quote
the red; add a view to `index.html` that the harness does not know about, run, quote the red; then
revert both and confirm green. A mutation you reasoned about is not a mutation you ran, and the
verifier reads your work cold — WO-2.19's report is the standard here, four mutations run and
reverted with the counts quoted.

**One trap the work order does not spell out.** The sweep currently runs once, after a reload, in one
device-metrics state. Opening four views in sequence means navigating a live app mid-section and
leaving it somewhere for the sections that follow — `verify-shell.mjs` sections inherit each other's
DOM state and several say so explicitly (see 10515, *"Left the way the section above left it"*, and
13146's teardown). Put the page back the way you found it, and say in your report where you left it.

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

1. Every view in `index.html` is measured under the coarse pointer, enumerated from the document rather than from a list someone typed.
2. **Deleting WO-3.5's by-hand block does not reduce coverage of `#scoresView`** — the general mechanism reaches it, proved by running with the block removed and quoting the counts.
3. A view that opens empty fails on its own floor, driven by planting an empty one rather than argued.
4. Adding a view to `index.html` and not to the harness turns a check red, driven the same way.
5. The total check count rises and `tools/README.md` records the new number — which is WO-2.19's mechanism if it has landed, and a hand edit with a note if it has not.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

