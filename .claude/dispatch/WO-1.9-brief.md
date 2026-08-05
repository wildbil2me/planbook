# WO-1.9 — Presentation mode · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.9-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to Claude because presentation mode is named explicitly in
`ROUTING.md`'s Claude-only sensitive-surface list — its failure mode is not a bug, it is disclosing
a student's IEP status to a room of thirty, and that surface is never delegated. It is also a 🚩
go-live blocker, which defaults to Claude on its own. The runner-up consideration I set aside: the
mechanical shape of this work is small and well-specified (WO-1.8 already built the choke point and
left the body of one function to change), which would otherwise read as a Codex row — but "sensitive
surface" is not overridable by how small the diff looks, and no Codex probe was run this dispatch
because the rubric never derives to Codex for this row.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.9 — Presentation mode

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · 🚩 · **Depends on** WO-1.8
**Closes roadmap** Phase 1 → "Presentation mode."

**Why it exists.** Teachers project attendance and gradebook screens onto classroom walls. IEP
status on that wall is a disclosure to thirty students. One global toggle, hit before you plug in
the projector, that suppresses every sensitive field at once — because remembering which screens are
safe is not a plan.

**Deliverables**
- A global toggle in the header, one tap, obviously on when it's on (persistent visual state, not a
  checkbox buried in Settings).
- When on: every `supports` field, indicator dot, medical note, behavior plan, and case manager is
  suppressed app-wide — including inside modals, print output, and anything Phase 4 and 6 later add.
- The suppression is implemented **at the render helper**, not per screen, so screens built later
  inherit it by default rather than by remembering.
- State stored in `planbook_` (a UI preference), and it survives reload — a teacher who turned it on
  before first period should not find it off after lunch.

**Out of scope** — hiding grades or names. Presentation mode protects `supports`, not the gradebook.

**Acceptance**
- [ ] With it on, no screen in the app displays plan, accommodation, medical, behavior, or case
      manager data — verified by walking every built screen.
- [ ] The toggle state is visible without hunting for it.
- [ ] It survives a reload and an app relaunch.
- [ ] A screen added after this work order inherits suppression without touching the toggle code.
      *(Re-verify this claim at every later phase; it is the whole reason for the render-helper
      approach.)*

**Traps** — Per-screen conditionals will pass this work order and fail in Phase 4, when a signal
card quotes a behavior note. Build the choke point.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`src/supports.js` — read the whole header comment before you touch anything.** WO-1.8 built the
  choke point this work order exists to flip, and wrote you instructions in it. `supportsVisible()`
  at line 87 currently `return true`, and its comment says in terms: *"WO-1.9 IS THE WORK ORDER THAT
  CHANGES THIS BODY. It reads a `planbook_`-prefixed preference and returns false while presentation
  mode is on."* The two funnels beneath it — `sensitiveValue()` for form controls and
  `setSensitiveText()` for rendered text — already consult it. **The Traps line about building the
  choke point is therefore mostly already satisfied; your job is to not route around it.** If you
  find yourself adding a second `if` that tests presentation mode anywhere outside `supports.js`,
  that is the failure the work order predicts.
- **`src/prefs.js`** — the only file allowed to touch `localStorage`, and `setPref()` hard-refuses a
  key not declared in `PREF_DEFAULTS`. Adding the preference means adding a line there with a
  default and a comment in the house style explaining why it is a fact about this browser rather
  than about a student. That declaration is also what makes reload survival free.
- **`src/roster.js`** — the only screen built so far that renders support data, including the
  indicator dot at line ~406. Check every one of its `supportsVisible` call sites still behaves when
  the answer flips to false, especially the reveal state (`supportsShown`, ~line 1066).
- **`src/shell.js` and `index.html`** — where the header lives, and where the toggle goes.
- `design/style-guide.md` for the toggle's visual treatment. "Obviously on when it's on" is a design
  requirement, not a nice-to-have: a persistent visual state, not a checkbox.

**Three things to get right that the Acceptance list will test and the deliverables only imply:**

1. **Flipping the toggle must re-render what is already on screen.** Suppression that only applies
   to future renders leaves the currently-open roster full of support data until something else
   redraws it. The teacher flips this switch *because* she is about to plug in the projector — the
   screen already in front of her is exactly the one that must go quiet.
2. **Suppress by not rendering, not by hiding.** `sensitiveValue()`'s comment already makes this
   argument: an element with `display: none` is still reachable by a screenshot tool, find-in-page,
   and the accessibility tree. CSS-only suppression will look like it passes.
3. **The dot is disclosure too.** A visible indicator that a student has *something* on file is
   still a disclosure to the wall, and the work order and `supports.js` both say so.

Add checks for this to `tools/verify-shell.mjs` — the toggle's presence, its persisted state, and
that support text is absent from the DOM rather than merely hidden when it is on.

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

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

1. With it on, no screen in the app displays plan, accommodation, medical, behavior, or case manager data — verified by walking every built screen.
2. The toggle state is visible without hunting for it.
3. It survives a reload and an app relaunch.
4. A screen added after this work order inherits suppression without touching the toggle code. *(Re-verify this claim at every later phase; it is the whole reason for the render-helper approach.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

