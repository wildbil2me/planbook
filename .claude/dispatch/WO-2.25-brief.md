# WO-2.25 — the print gate is answered when it is read, on every surface · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.25-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude at the Opus tier**, on its own merits rather than by
fallback, on `ROUTING.md`'s "establishes a convention" trigger — the work order's own *Why it exists*
says the point is that a fourth print surface (Phase 4's signal lists, Phase 6's glance page) must
not be able to arrive with a fourth timer in it, so the module boundary you draw here is the thing
every later print surface copies. The second Claude trigger is the Traps section: "do not make the
module ask which surface is open" is judgment, not mechanics, and is exactly the shape a model
optimising for clean code tidies away. The runner-up set aside was a genuine Codex case — the fix is
already written verbatim in `src/grades-report.js` and every Acceptance line is grep- or
harness-checkable — set aside because what is specified is the *behaviour*, not the boundary, and the
boundary is the deliverable.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.25 — the print gate is answered when it is read, on every surface

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-13 · **Size** S · **Depends on** WO-3.9 — the fix this carries is
written there, and reading it is the first step · **Blocks** nothing
**Closes roadmap** *(no box. A defect in shipped work, not a promise anyone made — the same call
WO-2.13 made.)*

**Not a go-live blocker, and in no ship.** Added 2026-08-13, out of the owner's own printing on the
grade sheet. **Two shipped print surfaces have a bug that has already been found, diagnosed and fixed
once**; this is that fix carried to them, and the duplication that let one bug live in three places
removed on the way.

**Why it exists.** `src/attendance-report.js` and `src/detail.js` both hold this, verbatim:

```js
body.setAttribute(PRINT_ATTR, '1');
window.print();
setTimeout(() => body.removeAttribute(PRINT_ATTR), PRINT_RELEASE_MS);   // 500
```

The reasoning under it — WO-2.6's, and Roll Call!'s before that — is that `window.print()` blocks
while the browser's own dialog is up, so 500ms is a margin after it. **It does not always block, and
the owner found both ways it comes apart on 2026-08-12, on the second tap of one sitting:**

- **Chrome throttles a repeated `print()`.** The second call in a short window is refused with *"This
  website has been blocked from automatically printing"* — and **a refused `print()` returns at
  once.** The timer cleared the gate while the teacher read the message; the print they then allowed
  was ungated, and what came out of the printer was **the whole app**.
- **Turning the preview from portrait to landscape** re-generates it from the **live DOM**. Whatever
  the attribute is at that moment is what prints, and the timer had cleared it long before.

Both are one mistake: the gate is **set** when the app asks to print and **read** when the browser
actually prints, and the gap between those is however long a teacher looks at a preview.

**The fix is settled, and it is not this work order's to invent.** `src/grades-report.js` carries it
with the reasoning written out at `printGrades()`: the gate is answered from a `beforeprint`
listener, at the moment the browser serialises the page, by **asking the DOM** whether that surface
is on screen — never remembered from the tap. That is self-correcting rather than balanced: a print
the teacher blocks outright leaves the attribute on, which costs nothing because only `@media print`
reads it, and the next print of anything at all asks again and clears it. **Read that file before
writing anything here.**

**Why the copies go, and not just the bug.** There are three because the idiom was lifted three
times — WO-2.6 wrote it, WO-3.7 copied it, WO-3.9 copied it again — and that is precisely how one
mistake came to live in three places and be fixed in one. The three **attributes** stay three, and
that part was always right: `data-attendance-print`, `data-detail-print` and `data-grades-print` each
re-show a different surface, and sharing one would print the wrong thing rather than nothing. It is
the **mechanism** that must stop being copied. A fourth print surface is a certainty — Phase 4's
signal lists and Phase 6's glance page both want one — and it must not be able to arrive with a
fourth timer in it.

**Deliverables**
- **`src/print-gate.js`, one module, taking the attribute and a predicate**: which `<body>` attribute
  this surface gates on, and a function answering whether that surface is on screen right now. It
  registers the `beforeprint`/`afterprint` listeners and hands back the sync function to call
  immediately before `window.print()` — the belt-and-braces set, for an engine that fires neither
  event.
- **All three surfaces call it**: `src/attendance-report.js`, `src/detail.js`, `src/grades-report.js`.
  Every `PRINT_RELEASE_MS` and every `setTimeout` around a print attribute is gone from the tree.
- **The reasoning moves with it.** `printGrades()`'s comment block is the record of what went wrong
  and why the shape is what it is; it belongs in `src/print-gate.js` now, told once, with the three
  callers pointing at it rather than restating it.
- **The two stale `@media print` headers are corrected** — `src/attendance.css` and `src/detail.css`
  still describe a timer, and `src/scores.css`'s header says so at the point where a reader would
  lift it a fourth time. That sentence comes out when it stops being true.
- **`verify-shell.mjs` covers all three surfaces the way it now covers the grade sheet**: the gate on
  at print time, still on while the surface is up, re-armed by a `beforeprint` the app never asked
  for, cleared by `afterprint`, and cleared by a `beforeprint` raised when the surface is **not** up
  — which is the guarantee the deleted timer used to give. The attendance and detail sections each
  still carry the check that measured the timer; **those come out.**
- **One tap, one `print()`, on all three.** The grade sheet asserts this since 2026-08-13; the other
  two collect the count already and have never asserted it.

**Out of scope** — anything about what the three sheets *contain*, their layout, their page breaks or
their CSVs; the fourth print surface Phase 4 and Phase 6 will want; and **any attempt to suppress
Chrome's throttle message**, which is browser policy and was settled on 2026-08-13 — one tap calls
`print()` exactly once, so there is nothing here to fix and a work order that tries will fail.

**Acceptance**
- [ ] `src/print-gate.js` exists, and `grep -rn "PRINT_RELEASE_MS\|setTimeout" src/` returns no line
      that clears a print attribute anywhere in the tree.
- [ ] All three surfaces gate through it, and each keeps its own attribute — a print from one shows
      that one and hides the other two, asserted per surface rather than argued from the shared call.
- [ ] `verify-shell.mjs` makes the same five readings of each of the three surfaces, and **the two
      checks that asserted a timed release are gone.** The run is green.
- [ ] **Each new check fails on the tree as it stands.** Run them against the unfixed
      `attendance-report.js` and `detail.js` before the fix and record the failure text — a guard
      nobody has watched fail is a guard nobody has tested (WO-2.24's rule, and the reason this bug
      shipped: the check that was watching it was green throughout).
- [ ] 👤 **On the owner's own machine: print the attendance record twice in one sitting, and the
      detail sheet twice**, allowing Chrome's block when it appears, and turn one preview to
      landscape. The right sheet comes out every time. *(This is the only reading that matters and no
      emulator has it — the grade sheet's fix was confirmed this way on 2026-08-13.)*
- [ ] `tools/README.md`'s check count and `TESTING.md` are updated from a run rather than by
      arithmetic, per WO-2.19, and `node tools/wo-sweep.mjs` prints what it printed before but for
      the count.

**Traps** — **Do not share the attribute.** Three surfaces, three attributes; the module takes it as
an argument for exactly this reason, and `src/scores.css`'s header explains what sharing one costs.
**Do not make the module ask which surface is open.** It takes a predicate because the module must
not know about modals, views, or `.hidden` — `src/detail.js`'s surface is a view in `<main>` and the
other two are dialogs, which is why WO-3.7's `@media print` block is the hard one and the other two
are easy. **Do not delete the timer without replacing the guarantee it gave**: a Ctrl+P made when no
print surface is up must leave the ordinary page alone, and that is now the `beforeprint` sync
clearing the attribute rather than a timeout having fired. There is a check for it on the grade
sheet; write the other two. **And re-verify the grade sheet too.** It works today, and this work
order rewires it — the surface that is already correct is the one nobody will think to re-test.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance-report.js`
  - `src/attendance.css`
  - `src/detail.css`
  - `src/detail.js`
  - `src/grades-report.js`
  - `src/scores.css`
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Read in this order. The first item is the work order's own stated first step.**

1. **`src/grades-report.js`, the `printGrades()` region — roughly lines 505–568.** This is the
   settled fix, comment block and all. The work order says in as many words that the fix "is not this
   work order's to invent" and that you must read that file before writing anything here. The comment
   block is the record of what went wrong on 2026-08-12; it **moves** into `src/print-gate.js`, told
   once. It does not get paraphrased, summarised or improved on the way — `CLAUDE.md`'s standing rule
   is that reasoning already argued does not get re-derived.
2. **`plans/work-orders/phase-3-gradebook.md` § WO-3.9 — Grades print & CSV** (line 619). This work
   order's *Depends on* is a prose clause pointing at it, not just a gate: WO-3.9 is where the fix was
   made and where its own verification checks were written. The gate script flagged this clause
   explicitly as something a human must read rather than something it could check.
3. **`tools/verify-shell.mjs`, the grade-sheet print-gate checks — roughly lines 16220–16300.** These
   are the five readings the work order wants made of all three surfaces. Match their shape and their
   phrasing; do not invent a second idiom for the same assertion. Note the pattern they use for
   raising a `beforeprint` the app never asked for.
4. **`plans/work-orders/phase-2-attendance.md` § WO-2.6** (line 356) and **§ WO-2.24** (line 2132).
   WO-2.6 is where the timer idiom came from — useful for knowing what its `@media print` header was
   claiming. WO-2.24 is the source of Acceptance line 4's rule: a guard nobody has watched fail is a
   guard nobody has tested. That line is not a formality; record the actual failure text.
5. **`src/shell.js` line 308**, `import * as gradesReport from './grades-report.js';`. This is why
   the grade sheet's listeners are live from the first paint. Whatever registration shape you choose,
   check that the same is true for all three surfaces — a listener that only registers when a module
   is first used is a gate that is absent for the Ctrl+P before it.

**One thing to hold in view while you work.** The failure this fixes put *the whole app* on paper.
The roster is part of the whole app, and the roster carries accommodations. Constraint 5 in the next
section — no print surface emits accommodation, medical or plan data — is not incidental to this work
order; it is the reason the bug mattered enough to book.

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

## 5. Done means these 6 lines, reported against one by one

1. `src/print-gate.js` exists, and `grep -rn "PRINT_RELEASE_MS\|setTimeout" src/` returns no line that clears a print attribute anywhere in the tree.
2. All three surfaces gate through it, and each keeps its own attribute — a print from one shows that one and hides the other two, asserted per surface rather than argued from the shared call.
3. `verify-shell.mjs` makes the same five readings of each of the three surfaces, and **the two checks that asserted a timed release are gone.** The run is green.
4. **Each new check fails on the tree as it stands.** Run them against the unfixed `attendance-report.js` and `detail.js` before the fix and record the failure text — a guard nobody has watched fail is a guard nobody has tested (WO-2.24's rule, and the reason this bug shipped: the check that was watching it was green throughout).
5. 👤 **On the owner's own machine: print the attendance record twice in one sitting, and the detail sheet twice**, allowing Chrome's block when it appears, and turn one preview to landscape. The right sheet comes out every time. *(This is the only reading that matters and no emulator has it — the grade sheet's fix was confirmed this way on 2026-08-13.)*
6. `tools/README.md`'s check count and `TESTING.md` are updated from a run rather than by arithmetic, per WO-2.19, and `node tools/wo-sweep.mjs` prints what it printed before but for the count.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

