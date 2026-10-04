# WO-1.50 — a document you can read is not a document anything checks · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.50-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at Opus (no model override). The deciding signal is the masking predicate: this tool's whole risk is a third reader of `supports.medical` / guardian data, which is an accommodations surface and Claude-only under ROUTING.md; the Traps (which checks to build, the second-truth hazard, the deployed-origin ruling) are judgment rather than spec. Set aside: the checks themselves are mechanical comparisons that would otherwise look Codex-shaped, but a sensitive surface decides it, so no Codex probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.50 — a document you can read is not a document anything checks

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-04 · **Size** M · **Depends on** nothing · **Blocks** nothing
*(`tools/data-viewer.html` already exists and this builds on it — that is a starting point rather than
a dependency, and it is stated here instead of in the field so the gate reads clean.)*
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.49 made.
Booked 2026-09-06, owner-directed, out of the sitting that built the viewer.* **Lower priority than
every row above it, in the owner's own framing** *— it sits at the foot of § After Ship 3 for that
reason and for no other, and* **position is not a fence** *(§ Ride-along rows, and row 36's scar), so
a reader who finds it leading the table should re-place it rather than take the position as
permission.)*

**Why it exists.** [`plans/known-bugs.md`](../known-bugs.md) § 2: a class read *1 unconfirmed* on the
day header while every student on the grid showed present. `tools/data-viewer.html`, built the same
day, makes that **readable** — a person can open the record, compare the keys under `marks` against
the class's `roster`, and see it, with both ends annotated by name. What it cannot do is make it
**noticed.** Nobody opens a viewer about a class that looks fine, and this disagreement sat on screen
across more than one day before anybody asked the document about it. **The viewer answers a question;
this row asks one.**

**What it is.** [`tools/inspector-mockup.html`](../../tools/inspector-mockup.html) is the drawing,
made 2026-09-06 and parked the same day — a checking panel over the same document the viewer already
loads, with findings in four families: **referential** (an id pointing at nothing, a mark or score
keyed outside the roster, a duplicate `attendance` record for one class and date), **shape** (a cell
that is a bare value rather than an object, a code outside the vocabulary, a `U` carrying more than
its code), **semantic** (weights that do not total 100, a letter band nothing can reach, a term whose
edges cross) and **consistency** (a count computed both the way `countsFor()` computes it and the way
the grid renders it). Read the drawing for the surface. What belongs *here* are the rulings, because a
picture makes none of them — and this row's whole risk is in them rather than in the checks.

**Traps**

- **A check that re-derives the app's arithmetic is a second truth, and this is the central hazard of
  the row.** The tool cannot call `countsFor()`: `src/attendance.js` reads the open document out of
  `src/store.js`, so its functions are not pure over a document handed to them, and over `file://`
  importing them at all drags IndexedDB into a page that must work without it. So a check either
  re-derives or does not exist — and **a re-derived count that drifts from the app's puts the defect
  in the tool while wearing a report's clothes**, which is worse than no check, because a green panel
  is then evidence. **Prefer the checks that need no app arithmetic at all**: comparing mark keys
  against roster ids, or two `attendance` rows against each other, is a comparison of two things
  *inside the document* and cannot drift however `src/` changes. A weighted-grade recomputation can
  only ever be a second implementation of `src/grade-engine.js`. Where the second shape is genuinely
  wanted, **name the source line the check mirrors, at the check**, and say what that means where a
  reader of a green report will meet it.
- **One loader, one masking predicate, one id map — and the masking one has already failed once.**
  On 2026-09-06 the viewer's tree masked `supports.medical` correctly while its own side pane printed
  it in full, because the two asked different questions: the tree asked a path predicate and the pane
  matched key names. **A checking panel is a third reader, and it brings three more escapes** — a
  finding body, a path list, and a report copied to the clipboard. The copied report is the worst of
  them, because it is the one that ends up in a file somebody commits. Share the predicate; do not
  re-ask the question. A finding names **a path and a count**, never a value.
  **This row carries the fence for it, and the fence is a grep rather than a run** — see Acceptance.
  The choice was made 2026-09-06 with the alternatives on the table: the browser harness that caught
  the original leak was deliberately **not** kept, because this page gates nothing and fails loudly
  when it is broken, so a 400-second behavioural run on every dispatch buys a *loud* failure a
  standing check for a *silent* one. A second answer to "is this masked" is text, and text is what
  `wo-sweep.mjs` is for.
- **Severity is a reading, not a verdict.** `wo-sweep.mjs` § 21's posture and the drawing's own limits
  box: green means *no unexcused occurrence*, not *the document is right*. Several of the mockup's
  amber rows are states a teacher has every right to hold — weights that do not total 100 is the
  clearest, and it is documented app behaviour rather than a fault. **An "error" here is the tool's
  opinion.** Say so on the panel, not only in a comment.
- **No repair button, and the reason is not that writing is hard.** The first write this tool ever
  makes will be to the file holding a live term's grades, and it will be made **from a suspect**. A
  snippet the reader copies keeps the keystroke a person's. Editing is *down the road* — the owner's
  own words, 2026-09-06.
- **It is not a harness and must not become one.** A page, run by hand, gating nothing — the line
  `plans/verification-tooling.md` draws between the two existing tools. If a check *the panel makes
  about a document* turns out to be worth running on every dispatch, it belongs in `wo-sweep.mjs`, and
  moving it there is a different row with a different argument. **The masking fence below is not that
  and is not an exception to it**: it is a check about **this file's own text** — how many places
  answer one question — and it never reads a year document at all.
- **The drawing's 38 checks are a picture's number.** Two of them answer a report that actually
  exists — § 2's off-roster mark, and the both-ways count that shows it — and the rest are candidates
  nobody has needed yet. **Build the ones with a report behind them and leave the table short**, or
  this row spends its afternoon filling in a mockup's arithmetic.
- **Decide whether it is reachable from the deployed origin, and write the decision down.** The viewer
  faces this already: `/tools/…` is public on Pages and holds no data, and reading the teaching iPad
  without a file round-trip needs exactly that. It is not obviously the same answer for a page that
  prints findings.

**Acceptance**
- [ ] The checking surface and the viewer share **one** loader, **one** masking predicate and **one**
      id map — one page or one module — with which was chosen and why written at the line.
- [ ] The off-roster-mark check and the both-ways count check each find `plans/known-bugs.md` § 2's
      shape, driven against a document that carries it **and** one that does not, so neither is
      vacuous.
- [ ] Every check names the source line whose behaviour it mirrors, and a check that re-derives app
      arithmetic says so where a reader of a green report will meet it — not only in a comment.
- [ ] No write path anywhere in the file: no `put`, no `readwrite` transaction, no repair button. A
      repair is a snippet the reader copies.
- [ ] **No masked value reaches a finding body, a path list, or the copied report** — driven with
      masking on, against a fixture carrying a distinctive string in `supports.medical`, over all
      four surfaces including the clipboard text.
- [ ] `wo-sweep.mjs` gains **one check that the masking question has exactly one answer** in the
      viewer's file: no `'supports'` or `'guardians'` comparison, and no `JSON.stringify` replacer,
      anywhere outside the single predicate. **Proved against the 2026-09-06 defect restored on
      purpose** — the key-name replacer put back, the check red, the replacer reverted — because a
      grep that has never seen the thing it is for is a grep nobody has tested. `tools/README.md`'s
      check count moves with it, and § 22 is what fails if it does not.
- [ ] The paragraph in `tools/data-viewer.html`'s header that says **nothing checks the masking** is
      replaced by what now does, in the same sitting. It was written on 2026-09-06 as the standing
      admission until this row landed, and leaving it beside its own fence is the `§ SHARED` failure
      `design/mockups/PROTOCOL.md` § 4 records.
- [ ] The report copies out as Markdown shaped for a `plans/known-bugs.md` row: the reproduction, the
      paths and the counts, and no diagnosis.
- [ ] `node tools/wo-sweep.mjs` is green and `node tools/wo-gate.mjs --audit` is green on a clean
      tree, with `tools/README.md`'s row for the mockup replaced by one for the built tool.

**Not in scope**

- **Editing the document.** Named above; it is a later row and it wants a forced backup before its
  first write.
- **The Compare panel** — two documents, their `rev`, `deviceId` and per-collection differences. It is
  in the drawing and it is a different job with a different reason: sync is whole-document
  last-writer-wins, so *what did the iPad overwrite* has no answer anywhere today, and the row that
  wants it is [WO-7.2](phase-7-sync.md#wo-72--document-transfer--conflicts) rather than this one.
- **Zip archives and Drive.** `downloadAllBackups()` writes a zip and this reads one JSON file; a
  reader for the archive is worth having and is not this.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/PROTOCOL.md`
  - `plans/known-bugs.md`
  - `plans/verification-tooling.md`
  - `src/attendance.js`
  - `src/grade-engine.js`
  - `src/store.js`
  - `tools/README.md`
  - `tools/data-viewer.html`
  - `tools/inspector-mockup.html`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Orchestrator notes — the traps a cold reader would not guess.**

- **Read `plans/known-bugs.md` § 2 first.** It is the reproduction both required checks must find; build your "carries it" fixture from its shape, and the "does not" fixture from the same document with the off-roster key removed.
- **Build two checks well, not thirty-eight.** The Traps already rule this; the Acceptance asks for the off-roster mark and the both-ways count. A third check needs a report behind it — if you add one, name the report.
- **Driving the masking line (Acceptance 5) is evidence, not a harness.** The work order deliberately did not keep a browser run for this page. Drive it however you need to (a CDP script in your scratchpad, reusing `tools/README.md` § "Driving a browser over CDP"), report the commands and output, and **commit no new runner** — CLAUDE.md: nobody writes a third harness. The standing fence is the `wo-sweep.mjs` grep in Acceptance 6.
- **The Acceptance 6 mutation restores a leak on purpose.** Per `AGENTS.md` § "If you were dispatched with a work order": mark it `MUTATION`, run the sweep, revert it **before writing anything else**, and confirm `grep -rn MUTATION tools/` is empty before you report. Two prior dispatches here died holding a mutation. Stage your own work before any `git checkout` used to revert, or it clobbers unstaged edits.
- **§ 22 counts the sweep's results against `tools/README.md:10`.** Adding a check moves that number; update it from the run, not by arithmetic.
- **§ 26 reads `tools/data-viewer.html` as a planning document** and excuses it by its own words because it states no status. If your header rewrite or panel text names a work order with a status, that check will read it — keep it green.
- **The deployed-origin decision (last Trap)** must be written down at the line and in `tools/README.md`'s row; it is yours to make and argue.
- **Session budget is tight** (the rolling window was already high at claim time). Write `.claude/dispatch/WO-1.50-result.md` early with a running log and keep it current, so a killed run leaves an honest record of what was and was not proved.

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

## 5. Done means these 9 lines, reported against one by one

1. The checking surface and the viewer share **one** loader, **one** masking predicate and **one** id map — one page or one module — with which was chosen and why written at the line.
2. The off-roster-mark check and the both-ways count check each find `plans/known-bugs.md` § 2's shape, driven against a document that carries it **and** one that does not, so neither is vacuous.
3. Every check names the source line whose behaviour it mirrors, and a check that re-derives app arithmetic says so where a reader of a green report will meet it — not only in a comment.
4. No write path anywhere in the file: no `put`, no `readwrite` transaction, no repair button. A repair is a snippet the reader copies.
5. **No masked value reaches a finding body, a path list, or the copied report** — driven with masking on, against a fixture carrying a distinctive string in `supports.medical`, over all four surfaces including the clipboard text.
6. `wo-sweep.mjs` gains **one check that the masking question has exactly one answer** in the viewer's file: no `'supports'` or `'guardians'` comparison, and no `JSON.stringify` replacer, anywhere outside the single predicate. **Proved against the 2026-09-06 defect restored on purpose** — the key-name replacer put back, the check red, the replacer reverted — because a grep that has never seen the thing it is for is a grep nobody has tested. `tools/README.md`'s check count moves with it, and § 22 is what fails if it does not.
7. The paragraph in `tools/data-viewer.html`'s header that says **nothing checks the masking** is replaced by what now does, in the same sitting. It was written on 2026-09-06 as the standing admission until this row landed, and leaving it beside its own fence is the `§ SHARED` failure `design/mockups/PROTOCOL.md` § 4 records.
8. The report copies out as Markdown shaped for a `plans/known-bugs.md` row: the reproduction, the paths and the counts, and no diagnosis.
9. `node tools/wo-sweep.mjs` is green and `node tools/wo-gate.mjs --audit` is green on a clean tree, with `tools/README.md`'s row for the mockup replaced by one for the built tool.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

