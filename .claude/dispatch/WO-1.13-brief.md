# WO-1.13 — Main-area views: make the header actually navigate · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.13-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routes to Claude at Opus tier on its own merits, not by fallback: it is a
design-system lift from Roll Call! (`ROUTING.md` § "Route to Claude", bullet 3), it establishes the
view-architecture convention that every Phase 3/4/5 work order will copy, and Acceptance line 8 puts
it on the presentation-mode sensitive surface. It is also a 🚩 go-live blocker, which defaults to
Claude on ties. The runner-up consideration set aside: the re-parenting itself is mechanical enough
to look like Codex work, but "retire the redundant selector — decide, and write down which and why"
is an unspecified design decision, and that is exactly the Claude column.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.13 — Main-area views: make the header actually navigate

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.10
**Closes roadmap** Phase 1 → *(no roadmap line; this closes a gap the roadmap assumed closed —
see "Why it exists")*

**Why it exists.** The shell has no navigation. `selectClass()` in
[`../../src/classes.js`](../../src/classes.js) writes the `openClassId` preference and repaints the
tab strip — and that is all it does, because there is nowhere in `<main>` to go. `<main>` holds one
panel, "Your classes", and nothing ever swaps it. WO-1.6's own note in `index.html` calls the header
class row "the app's navigation rather than a styled strip"; it was never navigation, and no work
order since has noticed.

The cost landed at WO-2.1. Attendance needed somewhere to live, the only established pattern was
`openModal()`, so the marking screen opens as a dialog **on top of** the class cards it just made
irrelevant — and the app now has *two* class selectors, the header tabs and the home cards, both
feeding one invisible variable and neither one going anywhere. The owner found this immediately and
asked the obvious question: why is the panel not the screen?

**This is a divergence from Roll Call!, and that is what makes it a defect rather than a taste.**
Roll Call!'s `<main class="main">` holds `#registryView` and `#compactGridView` as sibling views
toggled by `.hidden`, with the header switching between them; its modals — `#manageModal`, the
config editor, the student report — live *outside* `<main>` and are management-only. We lifted its
modal components and its visual language and left its view architecture behind. `CLAUDE.md` says to
lift from Roll Call! rather than hand-design; this is the second defect in one day traceable to not
having done that.

**Why now and not later.** Phase 3 is ten gradebook work orders, and Phases 4 and 5 add signals and
outreach. Every one of them needs a main-area surface. If attendance stays a modal, they all land as
modals and the shape is permanent. WO-2.1's grid is built and unverified-on-hardware, so its
rendering ports at the lowest cost it will ever have.

**Deliverables**
- **`<main>` holds swappable views**, one visible at a time, in the shape Roll Call! uses: siblings
  toggled by `.hidden`, not a router and not a framework. The home grid becomes `#homeView` — one
  view among several rather than the only thing there is.
- **The header class row navigates.** Selecting a class puts that class's working surface in the
  main area. `selectClass()` keeps writing `openClassId` — the preference is right and is what
  survives a reload — and gains the repaint that the preference was always implying.
- **A way back to the home grid** that is obvious and always reachable.
- **WO-2.1's attendance grid moves out of `attendanceModal` and into a main-area view**, rendering
  unchanged. This is a re-parenting, not a redesign; if the grid's markup needs rewriting to fit,
  stop and say so rather than redesigning it in passing.
- **Retire the redundant selector.** Two controls that set one variable is the defect the owner
  reported. Either the home cards navigate and the header tabs switch within a class, or one of them
  goes — decide, write down which and why, and do not ship both meaning the same thing.
- **Modals keep what they are good at**: the class manager, the term editor, the roster paste box,
  the student editor, the delete confirms. A modal is right for a task you finish and dismiss and
  wrong for the surface a teacher works in all period. Do not convert them.
- **`tools/verify-shell.mjs` follows.** `attendanceModal` appears in it 10 times; the harness drives
  the screen by opening the dialog. Those checks must drive the view instead, and the count must not
  drop — a check deleted because its selector moved is a check that stopped being run.

**Out of scope** — any change to what the attendance grid *shows* or *stores* (that is WO-2.1, and
it is settled). Deep-linking or URL routing. A back-button history stack. Phase 6's calendar view.

**Acceptance**
- [ ] Selecting a class from the header changes what is in `<main>`, without opening a dialog.
- [ ] Attendance is marked in the main area, with no overlay above the class cards.
- [ ] There is exactly one control in the app that means "work on this class now", and a second
      control that means something different can be told apart from it in words.
- [ ] Returning to the class grid is one tap from any view, and the tap is findable without being
      told where it is. 👤
- [ ] `verify-shell.mjs` runs green with **no fewer checks than before**, and every check that used
      to open `attendanceModal` now drives the view. Verify the count, don't assume it.
- [ ] The class manager, term editor, roster paste, and student editor still open as modals and
      still work.
- [ ] Reloading with a class selected returns to that class's view, not to a blank main area —
      `openClassId` already persists and must keep meaning something.
- [ ] Presentation mode still suppresses every support field on every view, including the new ones.

**Traps** — The tempting shortcut is to leave `attendanceModal` in place and hide its chrome, which
produces a dialog pretending to be a page: focus trapping, an Escape key that navigates, and a
screen reader announcing a dialog that never closes. Move it or leave it, but do not disguise it.
And **do not build a router.** Roll Call! switches views with `.hidden` and a class name; the suite
rule is no dependencies, no framework, and a hand-rolled URL router is a framework with one user.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/classes.js`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The reference implementation — read this structure before designing anything.** `CLAUDE.md` says
to lift from Roll Call! rather than hand-design, and the "Why it exists" paragraph above says failing
to do that is what produced this defect. The file is:

```
C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html
```

Landmarks verified today, so you can go straight to them:

- **line 1261** — `<main class="main">` opens
- **line 1264** — `<div id="registryView">`, the default view
- **line 1332** — `<div id="compactGridView" class="hidden">`, the sibling view; note that `.hidden`
  on the markup *is* the whole mechanism
- **line 1354** — `</main>` closes
- **line 1357** — `<div id="manageModal" class="modal-overlay hidden">` — the modals begin
  **outside** `<main>`, and they are management-only

Read how it toggles between the two and how the header drives it. That shape is the bar. It is not
a router, there is no history stack, and there is no framework underneath it.

**Also open, on this side:**

- `index.html` — `<main>` and the panel that lives in it; `attendanceModal` is at **line 1169**, with
  its `aria-labelledby="attendanceModalTitle"` at 1171 and title at 1173. Whatever you do with the
  dialog wrapper, those ARIA relationships have to end up coherent — a `role="dialog"` left on a
  page-level view is precisely the Traps section's first failure mode.
- `src/attendance.js` — WO-2.1's grid. **`const MODAL_ID = 'attendanceModal'` is at line 172.**
- `src/home.js` and `src/home.css` — the home grid that becomes `#homeView`.
- `src/shell.js`, `src/shell.css` — where a view-switch helper belongs, if it belongs anywhere.
- `src/modal.js` — the modal machinery you are **not** converting. Read it to see what you are
  moving *out of*, particularly focus trapping and the Escape handler.
- `src/presentation.js` and `src/supports.js` — Acceptance line 8. A new view is a new surface, and
  presentation mode has to cover it. Do not assume inheritance; check it.

**WO-2.1's grid is settled and is not in question.** It was committed and verified at `af8d3f9`
(9 of 12 acceptance lines, 3 open 👤 iPad lines). Its rendering is to be **re-parented**, not
redesigned. Its shape was settled twice in one day. If the markup genuinely cannot move without a
rewrite, **stop and report that** — do not redesign the grid in passing, and do not change what it
shows or stores.

**Live harness baselines, measured today at dispatch — use these numbers, not any quoted in older
work-order text, which are stale:**

- `node tools/verify-shell.mjs` → **274 checks · 274 passed · 0 failed · 0 skipped**
- `node tools/wo-sweep.mjs` → **11 checks · 10 passed · 0 failed · 1 to review** (the 1 review is the
  pre-existing "sensitive field names outside `src/backup.js`" grep — it is greppable evidence, not
  a failure, and it was already there before you started)

Acceptance line 5 is a count check against that 274. **Ten** `attendanceModal` references live in
`tools/verify-shell.mjs`, at lines 4371, 4481, 4482, 4540, 5200, 5203, 5641, 5670, 5702, and 5717 —
count confirmed today. Each has to end up driving the view rather than opening the dialog. A check
deleted because its selector moved is a check that stopped being run, so the number may go up and
must not go down.

**Two process constraints from the teacher, on top of the standing constraints below:**

- **Do not touch `CHANGELOG.md`.** It stays human-owned. This overrides nothing else — you may still
  tick the boxes your run actually closed.
- **Do not delete `.claude/dispatch/*-status.md` files.** The last two dispatches did that without
  authorization and destroyed the audit trail across two API-limit interruptions.

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

## 5. Done means these 8 lines, reported against one by one

1. Selecting a class from the header changes what is in `<main>`, without opening a dialog.
2. Attendance is marked in the main area, with no overlay above the class cards.
3. There is exactly one control in the app that means "work on this class now", and a second control that means something different can be told apart from it in words.
4. Returning to the class grid is one tap from any view, and the tap is findable without being told where it is. 👤
5. `verify-shell.mjs` runs green with **no fewer checks than before**, and every check that used to open `attendanceModal` now drives the view. Verify the count, don't assume it.
6. The class manager, term editor, roster paste, and student editor still open as modals and still work.
7. Reloading with a class selected returns to that class's view, not to a blank main area — `openClassId` already persists and must keep meaning something.
8. Presentation mode still suppresses every support field on every view, including the new ones.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

