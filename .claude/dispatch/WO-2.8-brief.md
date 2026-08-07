# WO-2.8 — Hall passes: issue, hold, return · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.8-result.md` — as your last act, and return it in-band too.

**Why you got this one.** Routed to Claude at the **Opus** tier on its own merits, matching the Ship 1
table's row 14: this is a design-system lift from Roll Call! (cross-repo reading plus taste about what
transfers), its Traps section is a judgment trap rather than a mechanical one, and it is a 🚩 go-live
blocker. The runner-up consideration I set aside is that issue / return / cap / append-to-log reads as
bounded CRUD that a spec-matcher could do — but the whole point of this work order is *"copy Roll
Call!, except for the one thing you must not copy,"* and a runner optimizing for fidelity to the
reference walks straight into the in-memory `activePasses` mistake. Read the Traps paragraph twice.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.8 — Hall passes: issue, hold, return

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-2.1, WO-1.13
**Closes roadmap** Phase 2 → "Hall passes: bathroom, nurse, quick"

**Why it exists.** The owner issues hall passes every period in Roll Call! and found them missing
the first time she used Planbook's registry. This phase's goal is *"the owner stops opening Roll
Call!"* — and a Planbook without passes does not meet it, because she keeps the other app open for
this one thing.

**This feature was never in the roadmap.** It is not something a work order dropped; it was never
written down. The only two mentions anywhere in the repo — in
[`../../docs/data-model.md`](../../docs/data-model.md) § log and
[`phase-4-signals.md`](phase-4-signals.md) — cite Roll Call!'s pass log as a *precedent for
append-only storage*, not as a feature Planbook would have. Found on first use, 2026-08-06.

**The reference is Roll Call!'s pass flow** — `src/dashboard.html`: `startPass()` (~3328),
`timeBack()` (~3350), `passButtonsHTML()` (~5260), `_finalizeDismissedPass()` (~5126), and the
`col-passes` column in `renderHead()`. Read them before designing. Three types, in the owner's own
words: **Bathroom · Nurse · Quick** (Roll Call! labels them 🚽 Bath, 🏥 Nurse, ⚡ Quick).

**Deliverables**
- **A `Passes` column in the registry**, per Roll Call!'s `col-passes` at `min-width: 160px`. Three
  buttons per student while they are in the room; a single **Return** button while they are out.
  *(The attendance panel's 720px cap was lifted on 2026-08-06 partly for this — see
  `src/attendance.css`.)*
- **Issue a pass in one tap.** Records who, which type, and the time out.
- **Return in one tap.** Computes minutes out and appends one entry to the pass log.
- **A concurrent cap**, as Roll Call! has (`MAX_ACTIVE_PASSES = 3`), with the buttons disabled and
  the reason on screen rather than a dead control.
- **An open pass SURVIVES A RELOAD, A CRASH, AND A FORCE-QUIT.** See Traps — this is the one place
  this work order deliberately does *not* copy Roll Call!.
- **The pass log is append-only and keyed by student id**, per
  [`../../docs/data-model.md`](../../docs/data-model.md) § log. Never by name.
- **`D` and an open pass agree.** Marking a student dismissed while they are out closes the open
  pass rather than leaving one that never returns; undoing the `D` restores it. Roll Call!'s
  `_finalizeDismissedPass()` / `cancelDismiss()` pair is the model.

**Out of scope** — the elapsed-time banner, the overdue alerts, and the pass-history view, all of
which are WO-2.9. Pass data as a Phase 4 signal. Printing a physical pass.

**Acceptance**
- [ ] Issuing a pass, force-quitting the app, and relaunching shows the student still out, with the
      original time out — not a cleared board. 👤
- [ ] Return writes one log entry with the right minutes, and the student's buttons come back.
- [ ] The fourth concurrent pass is refused with a reason on screen, not by a dead button.
- [ ] Marking a student `D` while they are out leaves no pass open, and undoing the `D` puts it back.
- [ ] The log is keyed by student id — verify in the document, not the UI. Renaming a student after
      the fact neither orphans nor re-attaches their passes.
- [ ] Issuing and returning a pass creates no attendance record and changes no attendance mark. A
      student who went to the bathroom was present.
- [ ] Every pass control clears 44px on a coarse pointer. 👤

**Traps** — **Roll Call! keeps `activePasses` in memory only, and copying that here is the one
mistake this work order exists to prevent.** Over there the app runs a session on a machine that
stays awake; here it is an installed iPad PWA that iOS suspends and evicts, used by a teacher who is
interrupted every period. An in-memory pass means a force-quit loses track of a student who is
physically out of the room, and the app cannot say so because it no longer knows. That is a safety
property, not a convenience.

And **do not infer presence from a pass.** A student on a bathroom pass is present; the mark and the
pass are independent, and the `D` rule above is the only coupling between them.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/attendance.css`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The reference implementation.** Roll Call! lives at
`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App`. Read, in this order:

- `src/dashboard.html` — the five functions the work order names by line: `startPass()` (~3328),
  `timeBack()` (~3350), `passButtonsHTML()` (~5260), `_finalizeDismissedPass()` (~5126), and the
  `col-passes` column in `renderHead()`. Also find `MAX_ACTIVE_PASSES` and `cancelDismiss()`.
  Line numbers are approximate — grep for the names.
- `design/style-guide.md` and `design/portable-components.md` — lift the pass-button grammar and the
  touch-target rules rather than inventing them. This project's convention is to lift.

**Take the flow and the visual grammar. Do not take the storage.** That inversion is the work order.

**The Planbook side you are extending.** These are the conventions this must match, not just read:

- `src/attendance.js` (1844 lines) and `src/attendance.css` (530 lines) — the registry from WO-2.1,
  most recently reshaped by WO-2.10. The column-width comment at `attendance.css:205` says
  *"Stop computing these by hand"* — `min-width` and let the browser distribute. The `Passes` column
  at `min-width: 160px` sits in that system, not beside it.
- `src/store.js` — the persistence layer, and specifically the **migration ladder** at `§ migration`
  (~line 177). It is keyed by the `schemaVersion` a step upgrades *from*; WO-2.10 added the most
  recent rung and its comment says a further migration should be one entry in that object rather than
  a refactor of the load path. If persisting open passes changes the document shape, add the rung —
  do not hand-patch documents on load, and do not skip the bump.
- `docs/data-model.md` § log (~line 119) for the entry shape, and its append-only note (~line 185):
  *"Roll Call! made hall passes append-only after matching rows by `name + time` proved fragile."*
  That sentence is the origin of this work order's own append-only rule.

**One schema decision I am flagging rather than making for you**, because it is yours and everything
downstream inherits it: the existing `log` array is typed `kind: "behavior|contact|note"`. Whether
passes extend that array with a new `kind`, or live in their own top-level append-only array, is a
call you should take deliberately and write down in your result file with the reasoning — WO-2.9's
history view and Phase 4's signals both read whatever you choose. Either answer can be right; an
undocumented one cannot.

**Two coupling surfaces to get right and not widen:**

- **An open pass is state, not history.** The log entry is written on *return*. What survives the
  force-quit is the open pass itself, and it has to live somewhere durable — that is Acceptance line
  1, and it is the safety property in Traps.
- **`D` is the only coupling to attendance** (`_finalizeDismissedPass()` / `cancelDismiss()`). No
  other pass action may create an attendance record or move a mark. Acceptance line 6 tests exactly
  that, and Traps states the rule: a student at the bathroom was present.

Everything in **Out of scope** belongs to WO-2.9 and is already written. The elapsed-time banner in
particular will feel like it is missing — leave it missing.

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

## 5. Done means these 7 lines, reported against one by one

1. Issuing a pass, force-quitting the app, and relaunching shows the student still out, with the original time out — not a cleared board. 👤
2. Return writes one log entry with the right minutes, and the student's buttons come back.
3. The fourth concurrent pass is refused with a reason on screen, not by a dead button.
4. Marking a student `D` while they are out leaves no pass open, and undoing the `D` puts it back.
5. The log is keyed by student id — verify in the document, not the UI. Renaming a student after the fact neither orphans nor re-attaches their passes.
6. Issuing and returning a pass creates no attendance record and changes no attendance mark. A student who went to the bathroom was present.
7. Every pass control clears 44px on a coarse pointer. 👤

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

